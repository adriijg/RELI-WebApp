import os, sys, re, html as htmlmod, urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _load_ffm_env  # noqa: F401
import requests

FFM_USER = os.environ.get('FFM_USER', '')
FFM_PASS = os.environ.get('FFM_PASS', '')
if not FFM_USER or not FFM_PASS:
    sys.exit('Faltan FFM_USER / FFM_PASS')

BASE = 'https://parla.ffmadrid.es'
session = requests.Session()
session.headers['User-Agent'] = 'Mozilla/5.0 (RELI-WebApp)'
r = session.post(f'{BASE}/nfg/NLogin', data={'NUser': FFM_USER, 'NPass': FFM_PASS, 'LoginAjax': '1'}, timeout=30, allow_redirects=False)
loc = r.headers.get('Location', '')
session.get(f'{BASE}{loc}', timeout=30)

url = f'{BASE}/nfg/NPcd/NFG_CmpPartido?cod_primaria=1000128&CodActa=82858&cod_acta=82858'
r = session.get(url, timeout=30)
acta = r.content.decode('iso-8859-15')

RE_EQUIPOS = re.compile(r'<span class="tituloprograma">\s*(.*?)\s*</span>', re.S)
names = [m.group(1) for m in RE_EQUIPOS.finditer(acta)]
print(f'Team names found: {names[:4]}')

for name in names[:2]:
    cleaned = htmlmod.unescape(name).strip()
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    print(f'Cleaned: [{cleaned}]')

# Test the Java clean function equivalent
test_name = names[0] if names else ''
try:
    step1 = re.sub(r'<[^>]+>', ' ', test_name)
    step2 = step1.replace('&nbsp;', ' ')
    step3 = urllib.parse.unquote(step2)  # URLDecoder equivalent
    step4 = re.sub(r'\s+', ' ', step3).strip()
    step5 = step4.replace('&amp;', '&')
    print(f'Java clean result: [{step5}]')
    if not step5:
        print('CLEAN RETURNED NULL/EMPTY - THIS IS THE BUG')
except Exception as e:
    print(f'URLDecoder.decode threw: {e}')
    # Try with windows-1252
    try:
        step3 = urllib.parse.unquote(step2, encoding='windows-1252')
        step4 = re.sub(r'\s+', ' ', step3).strip()
        step5 = step4.replace('&amp;', '&')
        print(f'Java clean (windows-1252): [{step5}]')
    except Exception as e2:
        print(f'Still error: {e2}')
