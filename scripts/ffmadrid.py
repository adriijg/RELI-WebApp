#!/usr/bin/env python3
"""Scraper de resultados/calendario de la FFM (Novanet) para RELI-WebApp.

Uso:
    pip install requests
    set FFM_USER=0R49865 & set FFM_PASS=Bancos25      (Windows, solo en memoria)
    python scripts/ffmadrid.py --jornadas 1-22 --out jornada.json     # solo descarga + parsea
    python scripts/ffmadrid.py --jornadas 1-22 --push --competition-id 2 --api http://localhost:8080/api --admin-user admin --admin-pass "..."   # sincroniza con el backend

Notas:
- Las credenciales van por entorno/argumentos, NUNCA en el repo.
- Los nombres de equipos se normalizan (mayusculas, sin tildes) para casar
  con los `rival` de la BD ("CLIMAHILLO FUTSAL" == "Climahillo Futsal").
- Si un partido ya existe (misma competicion + rival + dia) se actualiza (PUT),
  si no existe se crea (POST). Sin goles -> SCHEDULED, con goles -> FINISHED.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import unicodedata
from datetime import datetime

import requests

BASE = "https://parla.ffmadrid.es"
OUR_TEAM_CODE = "320143"
OUR_TEAM_NAME = "REAL LISIADOS"
# Parametros de la competicion/grupo vistos en la web de la FFM
JORNADA_PARAMS = {
    "cod_primaria": "1000128",
    "CodCompeticion": "324545",
    "CodGrupo": "324568",
    "CodTemporada": "22",
    "cod_agrupacion": "1",
    "Sch_Tipo_Juego": "3",
}
# Temporada actual (defecto). Año pasado: --temporada 21 --competicion 320164 --grupo 320174
DEFAULT_OUR_CODE = "320143"

RE_TEAMS = re.compile(r"NFG_VisEquipos\?cod_primaria=\d+&Codigo_Equipo=(\d+)[^>]*>\s*([^<]+?)\s*</a>")
# Ancla de cada partido: equipo1 = local, equipo2 = visitante
RE_COMP = re.compile(r"equipo1=(\d+)&equipo2=(\d+)")
RE_DATES = re.compile(r"fa-clock-o[^>]*></i>\s*(\d{2}-\d{2}-\d{4})")
RE_TIMES = re.compile(r'esconder">\s*(\d{2}:\d{2})')
RE_CAMPO = re.compile(r"Campo:</b></span>\s*([^<]+?)\s*(?:<|$)")
RE_ROUND_OPT = re.compile(r'<option[^>]*value="(\d+)"[^>]*>\s*\d+\s*-\s*(\d{2}-\d{2}-\d{4})')
# Resultado tipo "3 - 1" dentro del bloque del partido (cuando lo haya)
RE_SCORE = re.compile(r"(?<!\d)(\d{1,2})\s*-\s*(\d{1,2})(?!\d)")


def norm(name: str) -> str:
    name = unicodedata.normalize("NFKD", name or "")
    name = "".join(c for c in name if not unicodedata.combining(c))
    name = name.upper()
    name = re.sub(r"[^A-Z0-9 ]", " ", name)
    return re.sub(r"\s+", " ", name).strip()


_UPPER_TOKENS = {"FS", "F.S", "CD", "AD", "UD", "CF", "FF", "CE", "AT", "SD", "FC", "AC"}
_LOWER_TOKENS = {"de", "del", "la", "el", "los", "las", "y", "e", "al"}


def smart_title(name: str) -> str:
    """'EL VAQUILLA FS' -> 'El Vaquilla FS'; respeta siglas y conectores."""
    if not name or not name.isupper():
        return name
    out = []
    for i, word in enumerate(name.split()):
        core = word.strip(".")
        if core in _UPPER_TOKENS:
            out.append(word)
        elif word.lower() in _LOWER_TOKENS and i > 0:
            out.append(word.lower())
        else:
            out.append(word.capitalize())
    return " ".join(out)


def login(session: requests.Session, user: str, password: str) -> None:
    r = session.post(
        f"{BASE}/nfg/NLogin",
        data={"NUser": user, "NPass": password, "LoginAjax": "1"},
        timeout=30,
        allow_redirects=False,
    )
    loc = r.headers.get("Location", "")
    if r.status_code != 302 or "NLogin" not in loc:
        raise RuntimeError(f"Login inesperado: HTTP {r.status_code}")
    r2 = session.get(f"{BASE}{loc}", timeout=30)
    if 'estado="1"' not in r2.text and "estado='1'" not in r2.text:
        raise RuntimeError("Login rechazado (estado != 1). Revisa usuario/clave.")


def get_jornada(session: requests.Session, jornada: int, params_base: dict | None = None) -> str:
    params = dict(params_base or JORNADA_PARAMS)
    params["CodJornada"] = str(jornada)
    r = session.get(f"{BASE}/nfg/NPcd/NFG_CmpJornada", params=params, timeout=30)
    r.raise_for_status()
    raw = r.content
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        text = raw.decode("windows-1252")
    if "<title>Novanet | Login" in text[:2000]:
        raise RuntimeError("Sesion caducada (devuelve login).")
    return text


def nearest(items: list[tuple[str, int]], pos: int, lo: int, hi: int) -> tuple[str, int] | None:
    """Elemento (valor, posicion) mas cercano a pos dentro de (lo, hi)."""
    best = None
    for value, p in items:
        if lo < p < hi:
            if best is None or abs(p - pos) < abs(best[1] - pos):
                best = (value, p)
    return best


def parse_jornada(html: str, jornada: int, our_code: str = OUR_TEAM_CODE) -> list[dict]:
    """Emparejamientos desde los enlaces de comparativa (equipo1 = local,
    equipo2 = visitante). Fecha/hora/sede = las mas cercanas dentro del tramo.
    La web repite el listado en el HTML: se conserva la primera aparicion.
    Devuelve tambien los codigos de todos los equipos vistos ('all_codes')."""
    names: dict[str, str] = {}
    for m in RE_TEAMS.finditer(html):
        names.setdefault(m.group(1), " ".join(m.group(2).split()))
    dates = [(m.group(1), m.start()) for m in RE_DATES.finditer(html)]
    times = [(m.group(1), m.start()) for m in RE_TIMES.finditer(html)]
    campos = [(" ".join(m.group(1).split()), m.start()) for m in RE_CAMPO.finditer(html)]
    # Fecha de la jornada (desplegable): fallback cuando el partido jugado
    # ya no muestra fecha propia
    round_dates = {int(n): d for n, d in RE_ROUND_OPT.findall(html)}
    fallback = round_dates.get(jornada)

    comps: list[tuple[str, str, int]] = []
    seen_pairs: set[tuple[str, str]] = set()
    for m in RE_COMP.finditer(html):
        key = (m.group(1), m.group(2))
        if key not in seen_pairs:
            seen_pairs.add(key)
            comps.append((key[0], key[1], m.start()))

    out: list[dict] = []
    for i, (e1, e2, p) in enumerate(comps):
        lo = comps[i - 1][2] if i > 0 else 0
        hi = comps[i + 1][2] if i < len(comps) - 1 else len(html)
        found_date = nearest(dates, p, lo, hi)
        found_time = nearest(times, p, lo, hi)
        found_campo = nearest(campos, p, lo, hi)
        fecha = found_date[0] if found_date else fallback
        hora = found_time[0] if found_time else "00:00"
        venue = found_campo[0] if found_campo else None
        # Goles: se buscan solo si el bloque los trae (jornadas jugadas).
        # Se quitan fechas/horas primero para no confundir "27-09" con un 27-9.
        score = None
        seg = html[lo:hi]
        seg = re.sub(r"<select.*?</select>", " ", seg, flags=re.S | re.I)
        seg = re.sub(r"<[^>]+>", " ", seg)
        seg = re.sub(r"\d{2}-\d{2}-\d{4}", " ", seg)
        seg = re.sub(r"\d{2}:\d{2}", " ", seg)
        m = RE_SCORE.search(seg)
        if m:
            score = (int(m.group(1)), int(m.group(2)))
        iso = None
        if fecha:
            try:
                dt = datetime.strptime(f"{fecha} {hora}", "%d-%m-%Y %H:%M")
                iso = dt.strftime("%Y-%m-%dT%H:%M:%S")
            except ValueError:
                iso = None
        out.append({
            "jornada": jornada,
            "date": iso,
            "venue": venue,
            "home_code": e1,
            "home_name": names.get(e1, e1),
            "away_code": e2,
            "away_name": names.get(e2, e2),
            "we_play": our_code in (e1, e2),
            "we_are_home": (e1 == our_code) if our_code in (e1, e2) else None,
            "home_goals": score[0] if score else None,
            "away_goals": score[1] if score else None,
        })
    out_all_codes = sorted(names.keys())
    for m in out:
        m["all_codes"] = out_all_codes
    return out


def api_login(api: str, user: str, password: str) -> str:
    r = requests.post(f"{api}/users/login",
                      json={"identifier": user, "password": password}, timeout=30)
    r.raise_for_status()
    return r.json()["token"]


def has_time(iso: str | None) -> bool:
    """True si la fecha trae hora publicada (no 00:00)."""
    return bool(iso) and iso[11:] != "00:00:00"


def sync_match(api: str, token: str, competition_id: int, m: dict, dry_run: bool) -> str:
    """Crea o actualiza el partido en el backend. Devuelve accion realizada.

    Clave estable: (competicion, jornada, rival). Si la fila aun no tiene
    jornada (creada a mano), se casa por (rival, dia) una vez y se la pone.
    La sede/hora manual se conserva cuando la FFM aun no las publica.
    """
    is_home = m["we_are_home"]
    rival = m["away_name"] if is_home else m["home_name"]
    our_goals = m["home_goals"] if is_home else m["away_goals"]
    rival_goals = m["away_goals"] if is_home else m["home_goals"]
    finished = our_goals is not None and rival_goals is not None
    headers = {"Authorization": f"Bearer {token}"}
    existing = requests.get(f"{api}/matches", params={"size": 500},
                            headers=headers, timeout=30).json().get("content", [])
    same_comp = [e for e in existing if e.get("competitionId") == competition_id]
    match = next((e for e in same_comp
                  if e.get("jornada") == m["jornada"]
                  and norm(e.get("rival", "")) == norm(rival)), None)
    if match is None:
        want_day = (m["date"] or "")[:10]
        match = next((e for e in same_comp
                      if e.get("jornada") in (None, 0)
                      and norm(e.get("rival", "")) == norm(rival)
                      and (e.get("date") or "")[:10] == want_day), None)
    # Base: lo que ya hay (para no pisar sede/hora puestas a mano)
    base_date = match.get("date") if match else None
    base_loc = match.get("location") if match else None
    if has_time(m["date"]):
        new_date = m["date"]
    elif base_date and (m["date"] or "")[:10] == (base_date or "")[:10]:
        new_date = base_date
    else:
        new_date = m["date"] if not match else base_date
        if m["date"] and base_date and (m["date"][:10] != base_date[:10]):
            new_date = m["date"]  # cambio de dia federativo manda
    payload = {
        "rival": smart_title(rival),
        "home": bool(is_home),
        "date": new_date,
        "location": m["venue"] or base_loc,
        "status": "FINISHED" if finished else (match.get("status") if match else "SCHEDULED"),
        "ourGoals": our_goals if finished else (match.get("ourGoals") if match else 0),
        "rivalGoals": rival_goals if finished else (match.get("rivalGoals") if match else 0),
        "jornada": m["jornada"],
        "competitionId": competition_id,
    }
    if match:
        changed = any(match.get(k) != v for k, v in payload.items() if k != "competitionId")
        if not changed:
            return "igual"
        if not dry_run:
            requests.put(f"{api}/matches/{match['id']}", json=payload,
                         headers=headers, timeout=30).raise_for_status()
        return "actualizado"
    if not dry_run:
        requests.post(f"{api}/matches", json=payload,
                      headers=headers, timeout=30).raise_for_status()
    return "creado"


def parse_range(text: str) -> list[int]:
    out: list[int] = []
    for part in text.split(","):
        part = part.strip()
        if "-" in part:
            a, b = part.split("-", 1)
            out.extend(range(int(a), int(b) + 1))
        elif part:
            out.append(int(part))
    return sorted(set(out))


def main() -> int:
    ap = argparse.ArgumentParser(description="Scraper FFM -> RELI-WebApp")
    ap.add_argument("--jornadas", default="1", help="Ej. 1-22 o 1,2,5")
    ap.add_argument("--out", default="", help="Guarda JSON parseado en fichero")
    ap.add_argument("--push", action="store_true", help="Sincroniza con el backend")
    ap.add_argument("--competition-id", type=int, default=0)
    ap.add_argument("--api", default="http://localhost:8080/api")
    ap.add_argument("--admin-user", default=os.environ.get("RELI_ADMIN", "admin"))
    ap.add_argument("--admin-pass", default=os.environ.get("RELI_ADMIN_PASS", ""))
    ap.add_argument("--dry-run", action="store_true", help="Muestra que haria sin escribir")
    ap.add_argument("--export-dir", default="",
                    help="Exporta cada jornada completa (todos los equipos) a jornada-<n>.json en DIR")
    ap.add_argument("--cod-primaria", default=JORNADA_PARAMS["cod_primaria"])
    ap.add_argument("--competicion", default=JORNADA_PARAMS["CodCompeticion"])
    ap.add_argument("--grupo", default=JORNADA_PARAMS["CodGrupo"])
    ap.add_argument("--temporada", default=JORNADA_PARAMS["CodTemporada"])
    ap.add_argument("--agrupacion", default=JORNADA_PARAMS["cod_agrupacion"])
    ap.add_argument("--tipo-juego", default=JORNADA_PARAMS["Sch_Tipo_Juego"])
    ap.add_argument("--our-code", default=OUR_TEAM_CODE,
                    help="Codigo FFM de nuestro equipo (temporada actual: 320143)")
    args = ap.parse_args()

    ffm_params = {
        "cod_primaria": args.cod_primaria,
        "CodCompeticion": args.competicion,
        "CodGrupo": args.grupo,
        "CodTemporada": args.temporada,
        "cod_agrupacion": args.agrupacion,
        "Sch_Tipo_Juego": args.tipo_juego,
    }

    ffm_user = os.environ.get("FFM_USER", "")
    ffm_pass = os.environ.get("FFM_PASS", "")
    if not ffm_user or not ffm_pass:
        print("Faltan FFM_USER / FFM_PASS en el entorno.", file=sys.stderr)
        return 2

    session = requests.Session()
    session.headers["User-Agent"] = "Mozilla/5.0 (RELI-WebApp scraper)"
    login(session, ffm_user, ffm_pass)
    print("Login FFM OK")

    all_matches: list[dict] = []
    for j in parse_range(args.jornadas):
        try:
            html = get_jornada(session, j, ffm_params)
        except RuntimeError:
            login(session, ffm_user, ffm_pass)
            html = get_jornada(session, j, ffm_params)
        found = parse_jornada(html, j, args.our_code)
        print(f"Jornada {j}: {len(found)} partidos")
        all_matches.extend(found)

    codes: set[str] = set()
    for m in all_matches:
        codes.update(m.pop("all_codes", []))
    ours = [m for m in all_matches if m["we_play"]]
    rests: list[int] = []
    for j in sorted({m["jornada"] for m in all_matches}):
        played = {m["home_code"] for m in all_matches if m["jornada"] == j}
        played.update(m["away_code"] for m in all_matches if m["jornada"] == j)
        if args.our_code in codes - played:
            rests.append(j)
    print(f"Total: {len(all_matches)} partidos, {len(ours)} del RELI, descansamos: {rests or '-'}")

    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(all_matches, f, ensure_ascii=False, indent=2)
        print(f"Guardado en {args.out}")

    if args.export_dir:
        os.makedirs(args.export_dir, exist_ok=True)
        rounds: dict[int, list[dict]] = {}
        for m in all_matches:
            rounds.setdefault(m["jornada"], []).append({
                "date": m["date"],
                "venue": m["venue"],
                "home": smart_title(m["home_name"]),
                "away": smart_title(m["away_name"]),
                "homeCode": m["home_code"],
                "awayCode": m["away_code"],
                "homeGoals": m["home_goals"],
                "awayGoals": m["away_goals"],
                "ours": m["we_play"],
            })
        for j, games in sorted(rounds.items()):
            path = os.path.join(args.export_dir, f"jornada-{j}.json")
            with open(path, "w", encoding="utf-8") as f:
                json.dump(games, f, ensure_ascii=False, indent=2)
        index = {"competitionId": args.competition_id or None,
                 "ourCode": args.our_code,
                 "rounds": sorted(rounds.keys())}
        with open(os.path.join(args.export_dir, "index.json"), "w", encoding="utf-8") as f:
            json.dump(index, f, ensure_ascii=False, indent=2)
        print(f"Exportadas {len(rounds)} jornadas en {args.export_dir}")

    if args.push:
        if not args.competition_id:
            print("--competition-id es obligatorio con --push", file=sys.stderr)
            return 2
        if not args.admin_pass:
            print("Falta RELI_ADMIN_PASS en el entorno.", file=sys.stderr)
            return 2
        token = api_login(args.api, args.admin_user, args.admin_pass)
        for m in ours:
            if m["date"] is None:
                print(f"  SKIP sin fecha: {m['home_name']} - {m['away_name']}")
                continue
            action = sync_match(args.api, token, args.competition_id, m,
                                dry_run=args.dry_run)
            rival = m["away_name"] if m["we_are_home"] else m["home_name"]
            print(f"  [{action}] J{m['jornada']} {m['date'][:10]} vs {rival}"
                  + (f" {m['home_goals']}-{m['away_goals']}" if m["home_goals"] is not None else ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
