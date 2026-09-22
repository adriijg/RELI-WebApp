"""One-off probe: delete after use."""
import os
import re
import sys

import requests

import ffmadrid as f

u = os.environ.get("FFM_USER", "")
p = os.environ.get("FFM_PASS", "")
if not u or not p:
    print("Faltan FFM_USER / FFM_PASS", file=sys.stderr)
    sys.exit(3)

s = requests.Session()
s.headers["User-Agent"] = "Mozilla/5.0 (RELI probe)"
f.login(s, u, p)
params = {
    "cod_primaria": "1000128",
    "CodCompeticion": "320164",
    "CodGrupo": "320174",
    "CodTemporada": "21",
    "cod_agrupacion": "1",
    "Sch_Tipo_Juego": "",
}
html = f.get_jornada(s, 1, params)
print("len", len(html))
hrefs = re.findall(r'href=["\']([^"\']+)["\']', html, re.I)
nfg = sorted({h for h in hrefs if "NFG_" in h or "nfg/" in h.lower()})
for h in nfg[:60]:
    print(h[:160])
print("nfg count", len(nfg))
matches = f.parse_jornada(html, 1, "320143")
finished = [m for m in matches if m["home_goals"] is not None]
print("matches", len(matches), "finished", len(finished))
if finished:
    print("sample", finished[0])
