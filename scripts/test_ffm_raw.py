import os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _load_ffm_env  # noqa: F401
import requests

import ffmadrid as f

BASE = "https://parla.ffmadrid.es"
FFM_USER = os.environ.get("FFM_USER", "")
FFM_PASS = os.environ.get("FFM_PASS", "")
if not FFM_USER or not FFM_PASS:
    sys.exit("Faltan FFM_USER / FFM_PASS")

session = requests.Session()
session.headers["User-Agent"] = "Mozilla/5.0 (RELI-WebApp)"
f.login(session, FFM_USER, FFM_PASS)
print("Login OK")

# Fetch jornada page
params = {"cod_primaria": "1000128", "CodCompeticion": "324545", "CodGrupo": "324568", "CodTemporada": "22", "cod_agrupacion": "1", "Sch_Tipo_Juego": "3", "CodJornada": "1"}
r = session.get(f"{BASE}/nfg/NPcd/NFG_CmpJornada", params=params, timeout=30)
print(f"Jornada status: {r.status_code}")
html = r.content.decode("utf-8", errors="replace")
print(f"Jornada length: {len(html)}")

# Check if RE_CODACTA matches
RE_CODACTA = re.compile(r"NFG_CmpPartido\?cod_primaria=\d+&CodActa=(\d+)&cod_acta=\d+", re.I)
codactas = [m.group(1) for m in RE_CODACTA.finditer(html)]
print(f"CodActas found: {len(codactas)}")
if codactas:
    print(f"First codactas: {codactas[:5]}")
    
    # Fetch first acta with User-Agent
    codacta = codactas[0]
    url = f"{BASE}/nfg/NPcd/NFG_CmpPartido?cod_primaria=1000128&CodActa={codacta}&cod_acta={codacta}"
    r2 = session.get(url, timeout=30)
    print(f"\nActa status: {r2.status_code}, length: {len(r2.content)}")
    
    # Check if RE_PLAYER_ROW matches
    RE_PLAYER_ROW = re.compile(r"<td[^>]*>&nbsp;&nbsp;(\d+)&nbsp;.*?</td>\s*<td[^>]*><p[^>]*>&nbsp;(.*?)</p>", re.S)
    RE_EQUIPOS = re.compile(r'<span class="tituloprograma">\s*(.*?)\s*</span>', re.S)
    
    names = [m.group(1) for m in RE_EQUIPOS.finditer(r2.text)]
    print(f"Team names found: {names[:4]}")
    
    players = RE_PLAYER_ROW.findall(r2.text)
    print(f"Players found via regex: {len(players)}")
    if players:
        print(f"First players: {players[:5]}")
    
    # Try with ISO-8859-15 decoding
    try:
        acta_html = r2.content.decode("iso-8859-15")
    except:
        acta_html = r2.content.decode("windows-1252")
    players2 = RE_PLAYER_ROW.findall(acta_html)
    print(f"Players found (ISO-8859-15): {len(players2)}")
    if players2:
        print(f"First: {players2[:3]}")
