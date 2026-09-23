#!/usr/bin/env python3
"""Importa un acta parseada (ffmadrid_acta.py) a la BD del backend.

Mapeo de jugadores:
- El acta trae "APELLIDOS, NOMBRE" + dorsal. La BD guarda nombre corto
  ("Hugo", "Julen", "Zaka"...) + dorsal. La clave de union es el DORSAL,
  verificando como apoyo que el nombre/apodo de la BD aparezca entre los
  tokens del nombre del acta (avisa si no, pero no bloquea: ej. "Zaka"
  vs "BOUALAM MELLOUK, ZAKARIAS").
- Solo se importa NUESTRO equipo (el lado del acta cuyo nombre contiene
  "LISIADOS"); el rival se ignora.

Que escribe por jugador convocado (titulares+suplentes):
- MatchCallUp  (POST /api/matches/{id}/callups)
- MatchGoal    (POST /api/matches/{id}/goals, uno por gol con minuto)
- Stat         (POST o PUT /api/stats: goles, amarillas, rojas,
  attended=true, assists=0, mvp=false)

Es idempotente: relee goles/convocatorias/stats del partido y solo crea
lo que falta o actualiza stats con valores distintos. Usar --dry-run
para previsualizar sin escribir.

Uso:
    python scripts/ffmadrid_acta_import.py --acta acta-78450.json --match-id 27 --dry-run
    python scripts/ffmadrid_acta_import.py --acta acta-78450.json --match-id 27 --apply
    python scripts/ffmadrid_acta_import.py --codacta 78450 --competition-id 3 --apply
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import unicodedata

import requests

import ffmadrid_acta as acta_mod
import ffmadrid as f


def norm(text: str | None) -> str:
    text = unicodedata.normalize("NFKD", text or "")
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = text.upper()
    text = re.sub(r"[^A-Z0-9 ]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def acta_first_names(acta_name: str) -> set[str]:
    return set(norm(acta_name).split())


def api_login(api: str, user: str, password: str) -> str:
    r = requests.post(f"{api}/users/login",
                      json={"identifier": user, "password": password}, timeout=30)
    r.raise_for_status()
    return r.json()["token"]


def load_players(api: str, token: str) -> list[dict]:
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{api}/players", params={"size": 500},
                     headers=headers, timeout=30)
    r.raise_for_status()
    return r.json().get("content", [])


def map_players(our_side: dict, players: list[dict]) -> tuple[dict, list[dict]]:
    """Devuelve (mapeo dorsal->player, avisos). Clave primaria: dorsal."""
    by_dorsal = {p["jerseyNumber"]: p for p in players}
    mapping: dict[int, dict] = {}
    warnings: list[dict] = []
    for conv in our_side["titulares"] + our_side["suplentes"]:
        dorsal = conv["dorsal"]
        player = by_dorsal.get(dorsal)
        if player is None:
            warnings.append({"dorsal": dorsal, "acta": conv["nombre"],
                             "problema": "sin jugador con ese dorsal en la BD"})
            continue
        tokens = acta_first_names(conv["nombre"])
        if norm(player.get("name", "")) not in tokens \
                and norm(player.get("nickname", "")) not in tokens:
            warnings.append({"dorsal": dorsal, "acta": conv["nombre"],
                             "bd": f"{player.get('name')} ({player.get('nickname')})",
                             "problema": "el nombre no aparece en el acta; se casa por dorsal"})
        mapping[dorsal] = player
    return mapping, warnings


def find_match(api: str, token: str, competition_id: int, acta: dict) -> dict | None:
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{api}/matches", params={"size": 500},
                     headers=headers, timeout=30)
    r.raise_for_status()
    content = r.json().get("content", [])
    # Rival en la BD = el otro equipo del acta
    our_name = acta["our_side_name"]
    rival_name = acta["away"]["nombre"] if norm(our_name) == norm(acta["local"]["nombre"]) \
        else acta["local"]["nombre"]
    for m in content:
        if m.get("competitionId") != competition_id:
            continue
        if (m.get("jornada") or 0) == (acta.get("jornada") or 0) \
                and norm(m.get("rival", "")) == norm(rival_name):
            return m
    return None


def main() -> int:
    ap = argparse.ArgumentParser(description="Importa acta FFM a la BD")
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--acta", default="", help="JSON del acta (ffmadrid_acta.py --out)")
    src.add_argument("--codacta", default="", help="Descarga y parsea el acta en vivo")
    ap.add_argument("--match-id", type=int, default=0, help="Id del partido en la BD")
    ap.add_argument("--competition-id", type=int, default=0, help="Necesario si no se da --match-id")
    ap.add_argument("--api", default="http://localhost:8080/api")
    ap.add_argument("--admin-user", default=os.environ.get("RELI_ADMIN", os.environ.get("ADMIN_USERNAME", "admin")))
    ap.add_argument("--admin-pass", default=os.environ.get("RELI_ADMIN_PASS", os.environ.get("ADMIN_PASSWORD", "")))
    ap.add_argument("--dry-run", action="store_true", help="Previsualiza sin escribir (defecto si no se pasa --apply)")
    ap.add_argument("--apply", action="store_true", help="Escribe en la BD")
    ap.add_argument("--ffm-competicion", default="320164")
    ap.add_argument("--ffm-grupo", default="320174")
    ap.add_argument("--ffm-temporada", default="21")
    args = ap.parse_args()
    do_write = args.apply and not args.dry_run
    if not args.apply:
        args.dry_run = True

    if args.acta:
        with open(args.acta, encoding="utf-8") as fh:
            acta = json.load(fh)
    else:
        ffm_user = os.environ.get("FFM_USER", "")
        ffm_pass = os.environ.get("FFM_PASS", "")
        if not ffm_user or not ffm_pass:
            print("Faltan FFM_USER / FFM_PASS en el entorno.", file=sys.stderr)
            return 2
        session = requests.Session()
        session.headers["User-Agent"] = "Mozilla/5.0 (RELI-WebApp acta import)"
        acta_mod.f.login(session, ffm_user, ffm_pass)
        acta = acta_mod.parse_acta(acta_mod.fetch_acta(session, args.codacta), args.codacta)

    # Lado nuestro: el que contiene LISIADOS
    if "LISIADOS" in norm(acta["local"].get("nombre")):
        our_side, our_flag = acta["local"], "local"
    elif "LISIADOS" in norm(acta["visitante"].get("nombre")):
        our_side, our_flag = acta["visitante"], "visitante"
    else:
        print(f"El acta {acta.get('codacta')} no es del Real Lisiados: "
              f"{acta['local'].get('nombre')} vs {acta['visitante'].get('nombre')}", file=sys.stderr)
        return 2
    acta["our_side_name"] = our_side["nombre"]
    our_goals = [g for g in acta["goles"] if g.get("equipo") == our_flag]
    our_cards = [t for t in acta["tarjetas"] if t.get("equipo") == our_flag]

    if not args.admin_pass:
        print("Falta clave admin (RELI_ADMIN_PASS / ADMIN_PASSWORD).", file=sys.stderr)
        return 2
    token = api_login(args.api, args.admin_user, args.admin_pass)
    headers = {"Authorization": f"Bearer {token}"}

    if args.match_id:
        match = requests.get(f"{args.api}/matches/{args.match_id}",
                             headers=headers, timeout=30).json()
    else:
        if not args.competition_id:
            print("--competition-id es obligatorio sin --match-id", file=sys.stderr)
            return 2
        match = find_match(args.api, token, args.competition_id, acta)
        if match is None:
            print("No hay partido en la BD para esa jornada/rival.", file=sys.stderr)
            return 2
    match_id = match["id"]
    print(f"Partido BD #{match_id}: vs {match.get('rival')} J{match.get('jornada')} "
          f"{match.get('date')} [{match.get('status')}] {match.get('ourGoals')}-{match.get('rivalGoals')}")
    print(f"Acta {acta.get('codacta')}: {acta['local']['nombre']} "
          f"{acta['resultado']['home']}-{acta['resultado']['away']} vs {acta['visitante']['nombre']} "
          f"-> lado nuestro: {our_flag} ({our_side['nombre']})")

    players = load_players(args.api, token)
    mapping, warnings = map_players(our_side, players)
    for w in warnings:
        print(f"  AVISO dorsal {w['dorsal']} acta={w['acta']!r}: {w['problema']}"
              + (f" bd={w['bd']!r}" if w.get("bd") else ""))

    # Agregados por jugador (dorsal BD)
    per_player: dict[int, dict] = {}
    for conv in our_side["titulares"] + our_side["suplentes"]:
        per_player.setdefault(conv["dorsal"], {"goals": [], "yellow": 0, "red": 0, "called": True})
    for g in our_goals:
        for conv in our_side["titulares"] + our_side["suplentes"]:
            if norm(conv["nombre"]) == norm(g["jugador"]):
                per_player[conv["dorsal"]]["goals"].append(g["minuto"])
                break
    for t in our_cards:
        for conv in our_side["titulares"] + our_side["suplentes"]:
            if norm(conv["nombre"]) == norm(t["jugador"]):
                entry = per_player[conv["dorsal"]]
                if t["tipo"] == "AMARILLA":
                    entry["yellow"] += 1
                elif t["tipo"] == "ROJA":
                    entry["red"] += 1
                elif t["tipo"] == "DOBLE_AMARILLA":
                    entry["yellow"] += 1
                    entry["red"] += 1
                break

    detail = requests.get(f"{args.api}/matches/{match_id}/detail",
                          headers=headers, timeout=30).json()
    existing_goals = {(g["playerId"], g.get("minute")) for g in detail.get("goals", [])}
    existing_callups = {c["playerId"] for c in detail.get("callups", [])}
    stats = requests.get(f"{args.api}/stats",
                         params={"matchId": match_id, "size": 200},
                         headers=headers, timeout=30).json().get("content", [])
    stat_by_player = {s["playerId"]: s for s in stats}

    plan: list[str] = []
    for dorsal, agg in sorted(per_player.items()):
        player = mapping.get(dorsal)
        if player is None:
            plan.append(f"SKIP dorsal {dorsal}: sin mapeo")
            continue
        pid = player["id"]
        plan.append(f"{player['name']} (dorsal {dorsal}->id {pid}): "
                    f"goles={agg['goals'] or '-'}, amarillas={agg['yellow']}, rojas={agg['red']}")
    print("\n".join(f"  {line}" for line in plan))

    if not do_write:
        print(f"\nDRY-RUN: {len(per_player)} convocados, "
              f"{sum(len(v['goals']) for v in per_player.values())} goles nuestros. "
              f"Nada escrito (usa --apply).")
        return 0

    created = {"callups": 0, "goals": 0, "stats": 0, "stats_updated": 0}
    for dorsal, agg in per_player.items():
        player = mapping.get(dorsal)
        if player is None:
            continue
        pid = player["id"]
        if pid not in existing_callups:
            requests.post(f"{args.api}/matches/{match_id}/callups",
                          json={"playerId": pid}, headers=headers, timeout=30).raise_for_status()
            created["callups"] += 1
        for minute in agg["goals"]:
            if (pid, minute) not in existing_goals:
                requests.post(f"{args.api}/matches/{match_id}/goals",
                              json={"playerId": pid, "minute": minute},
                              headers=headers, timeout=30).raise_for_status()
                created["goals"] += 1
        payload = {"playerId": pid, "matchId": match_id,
                   "goals": len(agg["goals"]), "assists": 0,
                   "yellowCards": agg["yellow"], "redCards": agg["red"],
                   "mvp": False, "attended": True}
        existing = stat_by_player.get(pid)
        if existing is None:
            requests.post(f"{args.api}/stats", json=payload,
                          headers=headers, timeout=30).raise_for_status()
            created["stats"] += 1
        elif any(existing.get(k) != v for k, v in payload.items()
                 if k not in ("playerId", "matchId")):
            requests.put(f"{args.api}/stats/{existing['id']}", json=payload,
                         headers=headers, timeout=30).raise_for_status()
            created["stats_updated"] += 1
    print(f"Aplicado: {created}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
