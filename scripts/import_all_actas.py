"""Importa el acta de Real Lisiados de cada jornada jugada de la 2025/26."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import requests

import ffmadrid as f
import ffmadrid_acta as acta

OUR_CODE = "320143"
PARAMS = {
    "cod_primaria": "1000128",
    "CodCompeticion": "320164",
    "CodGrupo": "320174",
    "CodTemporada": "21",
    "cod_agrupacion": "1",
    "Sch_Tipo_Juego": "3",
}


def our_codacta(html: str) -> str | None:
    comps: list[tuple[str, str, int]] = []
    seen: set[tuple[str, str]] = set()
    for match in f.RE_COMP.finditer(html):
        key = (match.group(1), match.group(2))
        if key in seen:
            continue
        seen.add(key)
        comps.append((key[0], key[1], match.start()))

    actas: list[tuple[str, int]] = []
    seen_codes: set[str] = set()
    for match in acta.RE_CODACTA.finditer(html):
        code = match.group(1)
        if code in seen_codes:
            continue
        seen_codes.add(code)
        actas.append((code, match.start()))

    for index, (home, away, pos) in enumerate(comps):
        if OUR_CODE not in (home, away):
            continue
        lo = comps[index - 1][2] if index else 0
        hi = comps[index + 1][2] if index + 1 < len(comps) else len(html)
        best: tuple[int, str] | None = None
        for code, acta_pos in actas:
            if lo < acta_pos < hi:
                dist = abs(acta_pos - pos)
                if best is None or dist < best[0]:
                    best = (dist, code)
        return best[1] if best else None
    return None


def main() -> int:
    user = os.environ.get("FFM_USER", "")
    password = os.environ.get("FFM_PASS", "")
    if not user or not password:
        print("Faltan FFM_USER / FFM_PASS", file=sys.stderr)
        return 2
    session = requests.Session()
    session.headers["User-Agent"] = "Mozilla/5.0 (RELI-WebApp acta import)"
    f.login(session, user, password)

    here = Path(__file__).resolve().parent
    failures = 0
    for jornada in range(1, 23):
        html = f.get_jornada(session, jornada, PARAMS)
        code = our_codacta(html)
        print(f"J{jornada} codacta={code or '-'}", flush=True)
        if not code:
            continue
        result = subprocess.run(
            [
                sys.executable,
                str(here / "ffmadrid_acta_import.py"),
                "--codacta",
                code,
                "--competition-id",
                "3",
                "--apply",
            ],
            cwd=here,
        )
        if result.returncode != 0:
            failures += 1
            print(f"Fallo jornada {jornada} (codigo {result.returncode})", flush=True)
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
