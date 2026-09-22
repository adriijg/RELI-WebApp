import os
import subprocess

for name in ("FFM_USER", "FFM_PASS"):
    if os.environ.get(name):
        continue
    try:
        out = subprocess.check_output(
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
        out = ""
    if out:
        os.environ[name] = out
