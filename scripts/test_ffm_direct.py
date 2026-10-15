import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _load_ffm_env  # noqa: F401
import ffmadrid as f
import requests

ffm_user = os.environ.get('FFM_USER', '')
ffm_pass = os.environ.get('FFM_PASS', '')
if not ffm_user or not ffm_pass:
    sys.exit('Faltan FFM_USER / FFM_PASS')

session = requests.Session()
session.headers['User-Agent'] = 'Mozilla/5.0 (RELI-WebApp)'
r = session.post('http://parla.ffmadrid.es/nfg/NLogin', data={'NUser': ffm_user, 'NPass': ffm_pass, 'LoginAjax': '1'}, timeout=10)
print(f'Status: {r.status_code}')
print(f'Location: {r.headers.get("Location", "none")}')
print(f'Cookies: {dict(session.cookies)}')
print(f'Body: {r.text[:200]}')

# Try to fetch jornada
r2 = session.get('http://parla.ffmadrid.es/nfg/NPcd/NFG_CmpJornada?cod_primaria=1000128&CodCompeticion=320164&CodGrupo=320174&CodTemporada=21&CodJornada=1&cod_agrupacion=1&Sch_Tipo_Juego=3', timeout=10)
print(f'\nJornada Status: {r2.status_code}, len={len(r2.text)}')
