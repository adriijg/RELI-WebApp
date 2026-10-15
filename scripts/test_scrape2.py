import os, sys, json, time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _load_ffm_env  # noqa: F401
import requests

admin_pass = os.environ.get("RELI_ADMIN_PASS", "")
if not admin_pass:
    sys.exit("Falta RELI_ADMIN_PASS")
BASE = "http://localhost:8080/api"
auth = (os.environ.get("RELI_ADMIN", "admin"), admin_pass)

# Let's test what happens with scrapeStats
print("=== TEST SCRAPE STATS seasonId=2 ===")
r = requests.post(f"{BASE}/admin/scrape/stats", auth=auth, params={"seasonId": 2}, timeout=120)
print(f"Status: {r.status_code}")
data = r.json()
print(json.dumps(data, indent=2)[:500])

# Also test season 1
print("\n=== TEST SCRAPE STATS seasonId=1 ===")
r = requests.post(f"{BASE}/admin/scrape/stats", auth=auth, params={"seasonId": 1}, timeout=120)
print(f"Status: {r.status_code}")
data = r.json()
print(json.dumps(data, indent=2)[:500])
