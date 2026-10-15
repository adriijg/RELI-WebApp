import os, sys, json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _load_ffm_env  # noqa: F401
import requests
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
admin_pass = os.environ.get('RELI_ADMIN_PASS', '')
if not admin_pass:
    sys.exit('Falta RELI_ADMIN_PASS')
BASE = 'http://localhost:8080/api'
auth = (os.environ.get('RELI_ADMIN', 'admin'), admin_pass)
r = requests.post(f'{BASE}/admin/scrape/stats', auth=auth, params={'seasonId': 2}, timeout=180)
data = r.json()
print(f'Stats result: {json.dumps(data, indent=2, ensure_ascii=False)}')
