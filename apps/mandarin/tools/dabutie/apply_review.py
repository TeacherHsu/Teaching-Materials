#!/usr/bin/env python3
"""套用待審頁下載的審核結果 JSON：把對應 lesson JSON 的條目改 approved/rejected。
規格 §5：`python3 tools/dabutie/apply_review.py <審核結果.json> <lesson.json>`
審核結果格式：{"lesson_id": "...", "decisions": [{"id": "...", "decision": "approved|rejected", "note": "..."}]}
本檔為 batch 1 最小可用版本：待審頁（前端 `#/review/<lesson_id>`）尚未實作，
此腳本先備妥套用邏輯，供後續批次接上。
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from common import read_json, write_json  # noqa: E402

REVIEWABLE_KEYS = [
    "words", "idiom_sentences", "sentence_patterns", "rhetoric",
    "paragraph_summary", "main_idea", "reading_questions",
]


def apply_decisions(lesson: dict, decisions: list[dict]) -> int:
    by_id = {d["id"]: d for d in decisions}
    applied = 0
    for key in REVIEWABLE_KEYS:
        val = lesson.get(key)
        items = val if isinstance(val, list) else ([val] if isinstance(val, dict) else [])
        for item in items:
            if not isinstance(item, dict):
                continue
            item_id = item.get("id")
            if item_id in by_id:
                d = by_id[item_id]
                item["status"] = d["decision"]
                if d["decision"] == "rejected" and d.get("note"):
                    item["review_note"] = d["note"]
                applied += 1
    return applied


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("review_json")
    ap.add_argument("lesson_json")
    args = ap.parse_args()

    review = read_json(Path(args.review_json))
    lesson_path = Path(args.lesson_json)
    lesson = read_json(lesson_path)

    if review.get("lesson_id") != lesson.get("lesson_id"):
        print(f"警告：審核結果 lesson_id={review.get('lesson_id')} 與檔案 lesson_id="
              f"{lesson.get('lesson_id')} 不一致，仍繼續套用（以 id 比對為準）。")

    applied = apply_decisions(lesson, review.get("decisions", []))
    write_json(lesson_path, lesson)
    print(f"套用 {applied} 筆審核結果 → {lesson_path}")


if __name__ == "__main__":
    main()
