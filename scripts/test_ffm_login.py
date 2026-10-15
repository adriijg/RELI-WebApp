import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _load_ffm_env  # noqa: F401
import requests

admin_pass = os.environ.get('RELI_ADMIN_PASS', '')
ffm_user = os.environ.get('FFM_USER', '')
ffm_pass = os.environ.get('FFM_PASS', '')
if not admin_pass or not ffm_user or not ffm_pass:
    sys.exit('Faltan RELI_ADMIN_PASS / FFM_USER / FFM_PASS')

s = requests.Session()
s.headers['User-Agent'] = 'Mozilla/5.0 (RELI-WebApp)'
r = s.post('http://localhost:8080/api/users/login', json={'identifier': os.environ.get('RELI_ADMIN', 'admin'), 'password': admin_pass}, timeout=5)
print(f'Admin login: {r.status_code}')

r2 = s.post('http://parla.ffmadrid.es/nfg/NLogin', data={'NUser': ffm_user, 'NPass': ffm_pass, 'LoginAjax': '1'}, timeout=10)
print(f'FFM login: {r2.status_code}')
print(f'Location: {r2.headers.get("Location", "none")}')
print(f'Body: {r2.text[:200]}')
