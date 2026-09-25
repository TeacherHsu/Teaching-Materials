#!/usr/bin/env python3
"""便利 wrapper：跑 npm run validate（ajv schema）＋ sped-os check_l0.py（公開檢查閘門）。
規格 §2 pipeline 的 validate 步驟；CI／手動驗收都可以直接呼叫這支。
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parents[2]  # apps/mandarin
CHECK_L0 = Path.home() / "sped-os/30-materials/interactive/lesson-park/check_l0.py"


def main():
    failed = False

    r1 = subprocess.run(["npm", "run", "validate"], cwd=APP_ROOT)
    failed = failed or r1.returncode != 0

    data_dir = APP_ROOT / "public" / "data"
    json_files = [str(p) for p in data_dir.rglob("*.json")]
    if CHECK_L0.exists() and json_files:
        r2 = subprocess.run(["python3", str(CHECK_L0), *json_files])
        failed = failed or r2.returncode != 0
    else:
        print(f"[跳過] check_l0.py 不存在或無 JSON 可檢查：{CHECK_L0}")

    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
