import os
import subprocess
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent
_ENV_FILES = (_ROOT / "api-backend" / ".env", _ROOT / "nas-deploy" / ".env")
_ALIASES = {
    "FFM_USER": ("FFM_USER",),
    "FFM_PASS": ("FFM_PASS",),
    "RELI_ADMIN": ("RELI_ADMIN", "ADMIN_USERNAME"),
    "RELI_ADMIN_PASS": ("RELI_ADMIN_PASS", "ADMIN_PASSWORD"),
}


def _user_var(name):
    try:
        return subprocess.check_output(
            [
                "powershell",
                "-NoProfile",
                "-Command",
                f"[Environment]::GetEnvironmentVariable('{name}','User')",
            ],
            text=True,
            timeout=10,
        ).strip()
    except Exception:
        return ""


def _file_vars():
    values = {}
    for path in _ENV_FILES:
        if not path.is_file():
            continue
        for line in path.read_text(encoding="utf-8-sig", errors="replace").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            values.setdefault(key.strip(), value.strip().strip("\"'"))
    return values


def load():
    files = _file_vars()
    for name, sources in _ALIASES.items():
        if os.environ.get(name):
            continue
        value = ""
        if name in ("FFM_USER", "FFM_PASS"):
            value = _user_var(name)
        if not value:
            value = next((files[s] for s in sources if files.get(s)), "")
        if value:
            os.environ[name] = value


load()
