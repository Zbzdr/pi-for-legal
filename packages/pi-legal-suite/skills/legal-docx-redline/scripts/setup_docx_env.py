#!/usr/bin/env python3
"""Create or refresh the workspace-local DOCX runtime."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import venv


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepare the Pi for Legal DOCX virtual environment.")
    parser.add_argument("--workspace", type=Path, default=Path.cwd())
    parser.add_argument("--check", action="store_true", help="Check only; do not create or install")
    return parser.parse_args()


def environment_python(environment: Path) -> Path:
    return environment / ("Scripts/python.exe" if sys.platform == "win32" else "bin/python")


def requirements_digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def probe(python: Path) -> dict[str, str] | None:
    if not python.is_file():
        return None
    completed = subprocess.run(
        [
            str(python),
            "-c",
            (
                "import json, docx, lxml; "
                "print(json.dumps({'pythonDocx': docx.__version__, 'lxml': lxml.__version__}))"
            ),
        ],
        check=False,
        capture_output=True,
        text=True,
    )
    if completed.returncode != 0:
        return None
    try:
        value = json.loads(completed.stdout)
    except json.JSONDecodeError:
        return None
    return value if isinstance(value, dict) else None


def main() -> int:
    args = parse_args()
    workspace = args.workspace.expanduser().resolve()
    scripts = Path(__file__).resolve().parent
    requirements = scripts / "requirements.txt"
    environment = workspace / ".pi" / "legal-workbench" / "venvs" / "docx-redline"
    marker = environment / ".pi-legal-requirements.sha256"
    python = environment_python(environment)
    digest = requirements_digest(requirements)
    versions = probe(python)
    current = versions is not None and marker.is_file() and marker.read_text().strip() == digest

    if args.check:
        print(json.dumps({
            "ok": current,
            "environment": str(environment),
            "python": str(python),
            "versions": versions,
        }, indent=2))
        return 0 if current else 1

    if sys.version_info < (3, 9):
        raise RuntimeError("python-docx 1.2.0 requires Python 3.9 or newer")
    if environment.exists() and environment.is_symlink():
        raise RuntimeError(f"Refusing symlinked DOCX environment: {environment}")

    created = False
    installed = False
    if not python.is_file():
        environment.parent.mkdir(parents=True, exist_ok=True)
        venv.EnvBuilder(with_pip=True, clear=False).create(environment)
        created = True

    if not current:
        subprocess.run(
            [
                str(python),
                "-m",
                "pip",
                "install",
                "--disable-pip-version-check",
                "--requirement",
                str(requirements),
            ],
            check=True,
        )
        marker.write_text(f"{digest}\n", encoding="utf-8")
        installed = True

    versions = probe(python)
    if versions is None:
        raise RuntimeError("DOCX environment was created but python-docx/lxml could not be imported")
    print(json.dumps({
        "ok": True,
        "created": created,
        "installed": installed,
        "environment": str(environment),
        "python": str(python),
        "versions": versions,
    }, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, RuntimeError, subprocess.CalledProcessError) as exc:
        print(json.dumps({"ok": False, "error": str(exc)}), file=sys.stderr)
        raise SystemExit(2)
