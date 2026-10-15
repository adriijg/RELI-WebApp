import os, sys, json, time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _load_ffm_env  # noqa: F401
import requests

admin_pass = os.environ.get("RELI_ADMIN_PASS", "")
if not admin_pass:
    sys.exit("Falta RELI_ADMIN_PASS")
BASE = "http://localhost:8080/api"
auth = (os.environ.get("RELI_ADMIN", "admin"), admin_pass)

# Test roster scraping for season 1 (2025/26)
print("=== SCRAPING ROSTER TEMPORADA 1 ===")
start = time.time()
r = requests.get(f"{BASE}/admin/scrape/roster", auth=auth, params={"seasonId": 1}, timeout=120)
elapsed = time.time() - start
result = r.json()
print(f"Tiempo: {elapsed:.1f}s")
print(f"Jugadores encontrados: {len(result)}")
for p in result[:20]:
    print(f"  {p['fullName']} (dorsal {p['jerseyNumber']}, apariciones={p['appearances']})")

# Check if we have players from BOTH teams
names = [p['fullName'] for p in result]
lisiados = [n for n in names if 'LISIADOS' in n.upper() or 'REAL' in n.upper() or any(w in n.upper() for w in ['ADRIAN','ALBERTO','ALEJANDRO','HAROUN','HUGO','IKER','IVAN','IZAN','JAVI','JOSE','JUANMA','JULEN','RAUL','ROBERTO','ZAKA'])]
print(f"\nLisiados encontrados: {len(lisiados)}")
print(f"Total unico: {len(set(names))}")

# Test roster scraping for season 2 (2026/27)
print("\n=== SCRAPING ROSTER TEMPORADA 2 ===")
start = time.time()
r = requests.get(f"{BASE}/admin/scrape/roster", auth=auth, params={"seasonId": 2}, timeout=120)
elapsed = time.time() - start
result2 = r.json()
print(f"Tiempo: {elapsed:.1f}s")
print(f"Jugadores encontrados: {len(result2)}")
for p in result2[:20]:
    print(f"  {p['fullName']} (dorsal {p['jerseyNumber']}, apariciones={p['appearances']})")
