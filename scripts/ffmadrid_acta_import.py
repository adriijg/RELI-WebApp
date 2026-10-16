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
- Stat (POST o PUT /api/stats): goals, amarillas, rojas, attended=true,
  assists=0, mvp=false. Es la unica tabla de estadisticas (jugador x partido);
  los convocados son los Stat con attended=true.

Es idempotente: relee las stats del partido y solo crea lo que falta o
actualiza stats con valores distintos. Usar --dry-run para previsualizar.

Uso:
    python scripts/ffmadrid_acta_import.py --acta acta-78450.json --match-id 27 --dry-run
    python scripts/ffmadrid_acta_import.py --acta acta-78450.json --match-id 27 --apply
    python scripts/ffmadrid_acta_import.py --codacta 78450 --match-id 27 --apply
    # sin --codacta: descubre el acta de NUESTRO partido en su jornada
    python scripts/ffmadrid_acta_import.py --match-id 27 --ffm-competicion 324545 --ffm-grupo 324568 --ffm-temporada 22 --ffm-our-code 320143 --apply
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


def our_codacta(html: str, our_code: str) -> str | None:
    """CodActa del partido del RELI dentro del HTML de una jornada."""
    comps: list[tuple[str, str, int]] = []
    seen: set[tuple[str, str]] = set()
    for m in acta_mod.f.RE_COMP.finditer(html):
        key = (m.group(1), m.group(2))
        if key in seen:
            continue
        seen.add(key)
        comps.append((key[0], key[1], m.start()))
    actas: list[tuple[str, int]] = []
    seen_codes: set[str] = set()
    for m in acta_mod.RE_CODACTA.finditer(html):
        code = m.group(1)
        if code in seen_codes:
            continue
        seen_codes.add(code)
        actas.append((code, m.start()))
    for index, (home, away, pos) in enumerate(comps):
        if our_code not in (home, away):
            continue
        lo = comps[index - 1][2] if index else 0
        hi = comps[index + 1][2] if index + 1 < len(comps) else len(html)
        best: tuple[int, str] | None = None
        for code, acta_pos in actas:
            if lo < acta_pos < hi:
                dist = abs(acta_pos - pos)
                if best is None or dist < best[0]:
                    best = (dist, code)
        if best:
            return best[1]
    return None


def load_players(api: str, token: str) -> list[dict]:
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{api}/players", params={"size": 500},
                     headers=headers, timeout=30)
    r.raise_for_status()
    return r.json().get("content", [])


# Dorsal del acta -> jugador actual, cuando el número cambió de temporada.
# 2025/26: Adrián "Buko" llevaba el 27; en 2026/27 es el 6.
DORSAL_ALIASES = {
    27: {"nickname": "BUKO", "name": "ADRIAN"},
}


def player_from_alias(alias: dict, players: list[dict]) -> dict | None:
    for player in players:
        if norm(player.get("nickname")) == alias["nickname"] or norm(player.get("name")) == alias["name"]:
            return player
    return None


def map_players(our_side: dict, players: list[dict]) -> tuple[dict, list[dict]]:
    """Devuelve (mapeo dorsal->player, avisos). Clave primaria: dorsal."""
    by_dorsal = {p["jerseyNumber"]: p for p in players}
    mapping: dict[int, dict] = {}
    warnings: list[dict] = []
    for conv in our_side["titulares"] + our_side["suplentes"]:
        dorsal = conv["dorsal"]
        alias = DORSAL_ALIASES.get(dorsal)
        if alias:
            player = player_from_alias(alias, players)
            if player is None:
                warnings.append({"dorsal": dorsal, "acta": conv["nombre"],
                                 "problema": "alias de dorsal sin jugador en la BD"})
                continue
            tokens = acta_first_names(conv["nombre"])
            if alias["name"] not in tokens and alias["nickname"] not in tokens:
                warnings.append({"dorsal": dorsal, "acta": conv["nombre"],
                                 "bd": f"{player.get('name')} ({player.get('nickname')})",
                                 "problema": "el alias no coincide con el nombre del acta; no se importa"})
                continue
            mapping[dorsal] = player
            continue
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


def find_match(api: str, token: str, competition_id: int, acta: dict, side_data: dict) -> dict | None:
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{api}/matches", params={"size": 500},
                     headers=headers, timeout=30)
    r.raise_for_status()
    content = r.json().get("content", [])
    # Buscar el partido por jornada y competicion
    side_name = norm(side_data.get("nombre", ""))
    other_name = None
    if norm(acta["local"]["nombre"]) == side_name:
        other_name = norm(acta["visitante"]["nombre"]) if acta.get("visitante") else None
    else:
        other_name = norm(acta["local"]["nombre"]) if acta.get("local") else None
    for m in content:
        if m.get("competitionId") != competition_id:
            continue
        if (m.get("jornada") or 0) != (acta.get("jornada") or 0):
            continue
        rival_bd = norm(m.get("rival", ""))
        if rival_bd == (other_name or ""):
            return m
    # Si no coincide el rival, devolver el primer partido de esa jornada
    for m in content:
        if m.get("competitionId") != competition_id:
            continue
        if (m.get("jornada") or 0) == (acta.get("jornada") or 0):
            return m
    return None


def main() -> int:
    import sys
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    ap = argparse.ArgumentParser(description="Importa acta FFM a la BD")
    ap.add_argument("--acta", default="", help="JSON del acta (ffmadrid_acta.py --out)")
    ap.add_argument("--codacta", default="", help="Descarga y parsea el acta en vivo")
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
    ap.add_argument("--ffm-cod-primaria", default="1000128")
    ap.add_argument("--ffm-agrupacion", default="1")
    ap.add_argument("--ffm-tipo-juego", default="3")
    ap.add_argument("--ffm-our-code", default="320143")
    args = ap.parse_args()
    do_write = args.apply and not args.dry_run
    if not args.apply:
        args.dry_run = True

    if not args.admin_pass:
        print("Falta clave admin (RELI_ADMIN_PASS / ADMIN_PASSWORD).", file=sys.stderr)
        return 2
    token = api_login(args.api, args.admin_user, args.admin_pass)
    headers = {"Authorization": f"Bearer {token}"}

    match = None
    if args.match_id:
        match = requests.get(f"{args.api}/matches/{args.match_id}",
                             headers=headers, timeout=30).json()

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
        codacta = args.codacta
        if not codacta:
            if match is None:
                print("Indica --codacta, --acta o --match-id.", file=sys.stderr)
                return 2
            params = {
                "cod_primaria": args.ffm_cod_primaria,
                "CodCompeticion": args.ffm_competicion,
                "CodGrupo": args.ffm_grupo,
                "CodTemporada": args.ffm_temporada,
                "cod_agrupacion": args.ffm_agrupacion,
                "Sch_Tipo_Juego": args.ffm_tipo_juego,
            }
            html = acta_mod.f.get_jornada(session, int(match.get("jornada") or 0), params)
            codacta = our_codacta(html, args.ffm_our_code)
            if not codacta:
                print("No se encontró el acta de nuestro partido en la federación.", file=sys.stderr)
                return 2
            print(f"CodActa descubierto: {codacta}")
        acta = acta_mod.parse_acta(acta_mod.fetch_acta(session, codacta), codacta)

    # Procesar ambos equipos (local y visitante)
    sides = []
    for side_name, side_data, flag in [
        ("local", acta["local"], "local"),
        ("visitante", acta["visitante"], "visitante"),
    ]:
        if side_data is None:
            continue
        sides.append((side_name, side_data, flag))

    if not sides:
        print(f"El acta {acta.get('codacta')} no tiene datos de equipos.", file=sys.stderr)
        return 2

    acta["our_side_name"] = sides[0][1]["nombre"]

    if match is None:
        if not args.competition_id:
            print("--competition-id es obligatorio sin --match-id", file=sys.stderr)
            return 2
        our_name = next(
            (sd["nombre"] for _, sd, _ in sides if "LISIADOS" in norm(sd.get("nombre", ""))),
            sides[0][1]["nombre"])
        match = find_match(args.api, token, args.competition_id, acta, {"nombre": our_name})
        if match is None:
            print("No hay partido en la BD para esa jornada/rival.", file=sys.stderr)
            return 2
    match_id = match["id"]
    print(f"Partido BD #{match_id}: vs {match.get('rival')} J{match.get('jornada')} "
          f"{match.get('date')} [{match.get('status')}] {match.get('ourGoals')}-{match.get('rivalGoals')}")
    resultado = acta.get("resultado") or {}
    visitante = (acta.get("visitante") or acta.get("away") or {}).get("nombre")
    print(f"Acta {acta.get('codacta')}: {acta['local']['nombre']} "
          f"{resultado.get('home', '?')}-{resultado.get('away', '?')} vs {visitante}")

    players = load_players(args.api, token)

    total_created = {"callups": 0, "goals": 0, "stats": 0, "stats_updated": 0}
    total_imported = 0

    for side_name, side_data, flag in sides:
        mapping, warnings = map_players(side_data, players)
        for w in warnings:
            try:
                msg = f"  AVISO dorsal {w['dorsal']} acta={w['acta']!r}: {w['problema']}" + (f" bd={w['bd']!r}" if w.get("bd") else "")
                print(msg)
            except Exception:
                pass

        per_player: dict[int, dict] = {}
        for conv in side_data["titulares"] + side_data["suplentes"]:
            per_player.setdefault(conv["dorsal"], {"goals": [], "yellow": 0, "red": 0, "called": True})

        side_goals = [g for g in acta["goles"] if g.get("equipo") == flag]
        for g in side_goals:
            for conv in side_data["titulares"] + side_data["suplentes"]:
                if norm(conv["nombre"]) == norm(g["jugador"]):
                    per_player[conv["dorsal"]]["goals"].append(g["minuto"])
                    break

        side_cards = [t for t in acta["tarjetas"] if t.get("equipo") == flag]
        for t in side_cards:
            for conv in side_data["titulares"] + side_data["suplentes"]:
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

        stats_resp = requests.get(f"{args.api}/stats",
                                   params={"matchId": match_id, "size": 200},
                                   headers=headers, timeout=30).json()
        stats_list = stats_resp.get("content", [])
        stat_by_player = {s["playerId"]: s for s in stats_list}

        plan: list[str] = []
        for dorsal, agg in sorted(per_player.items()):
            player = mapping.get(dorsal)
            if player is None:
                plan.append(f"SKIP dorsal {dorsal}: sin mapeo")
                continue
            pid = player["id"]
            plan.append(f"{player['name']} (dorsal {dorsal}->id {pid}): "
                        f"goles={agg['goals'] or '-'}, amarillas={agg['yellow']}, rojas={agg['red']}")
        print(f"\n--- {side_data['nombre']} ({flag}) ---")
        print("\n".join(f"  {line}" for line in plan))

        if not do_write:
            print(f"\nDRY-RUN {side_data['nombre']}: {len(per_player)} convocados, "
                  f"{sum(len(v['goals']) for v in per_player.values())} goles.")
            continue

        for dorsal, agg in per_player.items():
            player = mapping.get(dorsal)
            if player is None:
                continue
            pid = player["id"]
            payload = {"playerId": pid, "matchId": match_id,
                       "goals": len(agg["goals"]), "assists": 0,
                       "yellowCards": agg["yellow"], "redCards": agg["red"],
                       "mvp": False, "attended": True}
            existing = stat_by_player.get(pid)
            if existing is None:
                requests.post(f"{args.api}/stats", json=payload,
                              headers=headers, timeout=30).raise_for_status()
                total_created["stats"] += 1
            elif any(existing.get(k) != v for k, v in payload.items()
                     if k not in ("playerId", "matchId")):
                requests.put(f"{args.api}/stats/{existing['id']}", json=payload,
                             headers=headers, timeout=30).raise_for_status()
                total_created["stats_updated"] += 1
            total_created["callups"] += 1
            total_created["goals"] += len(agg["goals"])
        total_imported += 1
        print(f"{side_data['nombre']}: importado correctamente")

    print(f"\nAplicado: {total_created}")
    print(f"Equipos importados: {total_imported}/{len(sides)}")

    return 0

if __name__ == "__main__":
    raise SystemExit(main())
