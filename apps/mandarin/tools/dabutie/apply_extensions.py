#!/usr/bin/env python3
"""把研究 agent 產出的延伸練習候選連結（~/mandarin-work/115AG3H/extensions/
lessonNN.candidates.json）併入對應 lesson JSON 的 `extensions[]`。

規格 docs/specs/2026-09-25-mandarin-dabutie-importer.md「延伸練習連結」一節：
- 以「網址正規化」當穩定 id，重跑（同一 url 再匯入一次）保留既有
  approved/rejected 決定，不會被打回 draft。
- 候選新進來一律 status: draft，等教師在待審頁（ReviewPage.js）核准。
- 不驗證網域白名單（那是 scripts/validate-data.mjs 的責任），但會擋掉非
  https 網址（大聲失敗，不靜默丟棄）。

candidates JSON 格式（陣列）：
[
  {
    "url": "https://wordwall.net/tc/resource/...",
    "title": "生字選字遊戲",
    "provider": "Wordwall",
    "type": "game",
    "module": "characters",
    "version_note": "通用",
    "login_required": false,
    "note": "選字配對",
    "char": "待"   # 選填，module=characters 且 type=reading 時可用
  },
  ...
]

用法：
  python3 tools/dabutie/apply_extensions.py <candidates.json> <lesson.json>
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from common import read_json, write_json, stable_id  # noqa: E402

# 候選欄位裡，即使教師之後手動修訂，重跑時仍以候選來源為準覆寫的欄位
# （status／id 除外，那兩個由本腳本自己管理，見 merge_candidate）。
OVERWRITE_FIELDS = [
    "url", "title", "provider", "type", "module",
    "version_note", "login_required", "checked_at", "note", "char",
]


def normalize_url(url: str) -> str:
    """正規化網址：小寫 scheme/host、去掉結尾斜線與 fragment，供穩定 id 使用。
    不動 query（wordwall 等站台常靠 query 帶資源 id）。"""
    if not url.startswith("https://"):
        raise ValueError(f"延伸練習連結必須是 https：{url}")
    parts = urlsplit(url)
    path = parts.path.rstrip("/") or ""
    normalized = urlunsplit((parts.scheme.lower(), parts.netloc.lower(), path, parts.query, ""))
    return normalized


def extension_id(url: str) -> str:
    return stable_id("ext", normalize_url(url))


def merge_candidates(lesson: dict, candidates: list[dict]) -> tuple[int, int]:
    """回傳 (新增數, 更新既有欄位但保留審核狀態數)。"""
    existing = lesson.get("extensions") or []
    existing_by_id = {e["id"]: e for e in existing if isinstance(e, dict) and e.get("id")}

    merged: list[dict] = []
    seen_ids = set()
    added = 0
    kept = 0
    for c in candidates:
        ext_id = extension_id(c["url"])
        seen_ids.add(ext_id)
        prior = existing_by_id.get(ext_id)
        status = prior["status"] if prior and prior.get("status") in ("draft", "approved", "rejected") else "draft"
        item = {"id": ext_id, "status": status}
        for field in OVERWRITE_FIELDS:
            if field in c:
                item[field] = c[field]
            elif prior and field in prior:
                item[field] = prior[field]
        if prior and prior.get("review_note"):
            item["review_note"] = prior["review_note"]
        merged.append(item)
        if prior is None:
            added += 1
        else:
            kept += 1

    # 候選清單以外、但先前已存在（例如教師手動核准過）的連結一律保留，
    # 避免研究 agent 這次沒重新回報就被誤刪。
    for e in existing:
        if isinstance(e, dict) and e.get("id") and e["id"] not in seen_ids:
            merged.append(e)

    lesson["extensions"] = merged
    return added, kept


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("candidates_json")
    ap.add_argument("lesson_json")
    args = ap.parse_args()

    candidates = read_json(Path(args.candidates_json))
    if not isinstance(candidates, list):
        print("[失敗] candidates JSON 必須是陣列", file=sys.stderr)
        sys.exit(2)

    lesson_path = Path(args.lesson_json)
    lesson = read_json(lesson_path)

    added, kept = merge_candidates(lesson, candidates)
    write_json(lesson_path, lesson)
    print(f"套用延伸練習候選 → {lesson_path}：新增 {added} 筆，保留/更新既有 {kept} 筆。")


if __name__ == "__main__":
    main()
