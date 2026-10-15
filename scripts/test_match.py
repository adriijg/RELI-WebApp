import subprocess, os, sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _load_ffm_env  # noqa: F401

ROOT = Path(__file__).resolve().parent.parent
os.chdir(ROOT)

admin_user = os.environ.get('RELI_ADMIN', 'admin')
admin_pass = os.environ.get('RELI_ADMIN_PASS', '')
if not admin_pass or not os.environ.get('FFM_USER') or not os.environ.get('FFM_PASS'):
    sys.exit('Faltan RELI_ADMIN_PASS / FFM_USER / FFM_PASS')
env = dict(os.environ)

# First, let's see what the API returns for matches
r = subprocess.run(['python', '-c', '''
import requests
headers = {"Authorization": "Bearer TOKEN"}
r = requests.get("http://localhost:8080/api/matches", params={"size": 500}, headers=headers, timeout=30)
print(r.json()["content"][:3])
'''], capture_output=True, text=True, timeout=30, env=env)
print("API test:", r.stdout[:500])
print("API stderr:", r.stderr[:500])

# Now test the full script with debug
r2 = subprocess.run(['python', 'scripts/ffmadrid_acta_import.py', '--codacta', '78450', '--competition-id', '320164', '--api', 'http://localhost:8080/api', '--admin-user', admin_user, '--admin-pass', admin_pass, '--apply', '--ffm-competicion', '320164', '--ffm-grupo', '320174', '--ffm-temporada', '21'], capture_output=True, text=True, timeout=120, env=env)
print('EXIT:', r2.returncode)
print('STDOUT:', r2.stdout[:3000])
print('STDERR:', r2.stderr[:1000])
