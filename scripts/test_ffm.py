import os, sys, json, time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _load_ffm_env  # noqa: F401
import requests

BASE = "http://localhost:8080/api"
admin_pass = os.environ.get("RELI_ADMIN_PASS", "")
if not admin_pass:
    sys.exit("Falta RELI_ADMIN_PASS")
auth = (os.environ.get("RELI_ADMIN", "admin"), admin_pass)

# Check if the scrape endpoint returns empty because of a specific issue
# Let's test the FFM sync instead first
print("=== TEST FFM SYNC preview ===")
r = requests.get(f"{BASE}/admin/sync/ffm/preview/1", auth=auth, timeout=30)
print(f"Status: {r.status_code}")
data = r.json()
if "error" in data:
    print(f"Error: {data['error']}")
else:
    print(f"Rounds checked: {data.get('roundsChecked',0)}")
    print(f"Created: {data.get('created',0)}, Updated: {data.get('updated',0)}")
    actions = data.get('actions', [])
    print(f"Actions: {len(actions)}")
    for a in actions[:5]:
        print(f"  J{a.get('jornada')}: {a.get('rival')} -> {a.get('action')}")

print("\n=== TEST FFM SYNC preview (competition 2) ===")
r = requests.get(f"{BASE}/admin/sync/ffm/preview/2", auth=auth, timeout=30)
print(f"Status: {r.status_code}")
data = r.json()
if "error" in data:
    print(f"Error: {data['error']}")
else:
    print(f"Rounds checked: {data.get('roundsChecked',0)}")
    print(f"Created: {data.get('created',0)}, Updated: {data.get('updated',0)}")
    actions = data.get('actions', [])
    print(f"Actions: {len(actions)}")
    for a in actions[:5]:
        print(f"  J{a.get('jornada')}: {a.get('rival')} -> {a.get('action')}")
