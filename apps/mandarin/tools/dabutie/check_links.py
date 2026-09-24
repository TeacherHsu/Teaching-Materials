#!/usr/bin/env python3
"""對所有課次 JSON 中 status=="approved" 的 extensions[] 連結發 HEAD（失敗時
退回 GET）請求，回報失效清單。手動或未來 CI 手動觸發用，不在 `npm run build`
時執行（維持零外部連線的 build 時保證，見規格「延伸練習連結」一節）。

用法：
  python3 tools/dabutie/check_links.py [--data-dir public/data] [--timeout 10]
"""
from __future__ import annotations

import argparse
import sys
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
APP_ROOT = HERE.parent.parent
sys.path.insert(0, str(HERE))

from common import read_json  # noqa: E402


def find_lesson_files(data_dir: Path):
    for p in sorted(data_dir.rglob("*.json")):
        if "_fixtures" in p.parts or "_preview" in p.parts or p.name == "course-index.json":
            continue
        yield p


def check_url(url: str, timeout: float) -> tuple[bool, str]:
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return True, f"HTTP {resp.status}"
    except urllib.error.HTTPError as e:
        if e.code in (403, 405):  # 有些站不支援 HEAD 或擋爬蟲，退回 GET 再試一次
            try:
                req2 = urllib.request.Request(url, method="GET", headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req2, timeout=timeout) as resp2:
                    return True, f"HTTP {resp2.status}（GET 重試）"
            except Exception as e2:  # noqa: BLE001
                return False, f"GET 重試失敗：{e2}"
        return False, f"HTTP {e.code}"
    except Exception as e:  # noqa: BLE001
        return False, str(e)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data-dir", default=str(APP_ROOT / "public" / "data"))
    ap.add_argument("--timeout", type=float, default=10.0)
    args = ap.parse_args()

    data_dir = Path(args.data_dir)
    failures = []
    checked = 0

    for lesson_path in find_lesson_files(data_dir):
        lesson = read_json(lesson_path)
        if not isinstance(lesson, dict):
            continue
        for ext in lesson.get("extensions", []) or []:
            if ext.get("status") != "approved":
                continue
            checked += 1
            ok, detail = check_url(ext["url"], args.timeout)
            status = "OK" if ok else "FAIL"
            print(f"[{status}] {lesson.get('lesson_id')} {ext.get('title')} {ext['url']} ({detail})")
            if not ok:
                failures.append((lesson_path, ext, detail))

    print(f"\n共檢查 {checked} 筆 approved 連結，失效 {len(failures)} 筆。")
    if failures:
        print("\n失效清單：")
        for lesson_path, ext, detail in failures:
            print(f"- {lesson_path.name}: {ext.get('title')} {ext['url']} — {detail}")
        sys.exit(1)


if __name__ == "__main__":
    main()
