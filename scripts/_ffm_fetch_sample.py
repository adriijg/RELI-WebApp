import os
import re
import sys

import requests

import _load_ffm_env  # noqa: F401
import ffmadrid as f

u = os.environ.get("FFM_USER", "")
p = os.environ.get("FFM_PASS", "")
if not u or not p:
    sys.exit("no creds")

s = requests.Session()
s.headers["User-Agent"] = "Mozilla/5.0"
f.login(s, u, p)
params = {
    "cod_primaria": "1000128",
    "CodCompeticion": "320164",
    "CodGrupo": "320174",
    "CodTemporada": "21",
    "cod_agrupacion": "1",
    "Sch_Tipo_Juego": "",
}
for j in (1, 10, 22):
    html = f.get_jornada(s, j, params)
    path = f"E:/Proyectos/RELI-WebApp/scripts/_sample_j{j}.html"
    with open(path, "w", encoding="utf-8") as out:
        out.write(html)
    print("wrote", path, len(html))
    for pat in ["Acta", "Gol", "goleador", "VisActa", "CmpPartido", "LstGol", "minuto"]:
        print(j, pat, html.lower().count(pat.lower()))
    links = sorted(set(re.findall(r"(?:NPcd/)?NFG_[A-Za-z0-9?&=_.%-]+", html)))
    print("links", len(links))
    for L in links:
        if any(x in L for x in ("Acta", "Gol", "Partido", "Comparativa", "Vis")):
            print(" ", L[:180])
