#!/usr/bin/env python3
"""套用待審頁（`#/review/<lesson_id>`，src/pages/ReviewPage.js）下載的審核
結果 JSON：把對應 lesson JSON 的條目改 approved/rejected。
規格 §5：`python3 tools/dabutie/apply_review.py <審核結果.json> <lesson.json>`
審核結果格式：{"lesson_id": "...", "decisions": [{"id": "...", "decision": "approved|rejected", "note": "..."}]}
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from common import read_json, write_json  # noqa: E402

# (lesson key, 狀態欄位名稱)：大多數審核類欄位的狀態存在 "status"，但
# sentence_patterns 的「結構/說明」恆為 ready，審核的是「例句改寫」，狀態
# 存在獨立的 "examples_status"（見 apply_rewrites.py 同樣的區分）。
REVIEWABLE_KEYS = [
    ("words", "status"),
    ("idiom_sentences", "status"),
    ("rhetoric", "status"),
    ("paragraph_summary", "status"),
    ("main_idea", "status"),
    ("reading_questions", "status"),
    ("listening", "status"),
    ("polysemy", "status"),
    ("sentence_patterns", "examples_status"),
    ("extensions", "status"),
]


def apply_decisions(lesson: dict, decisions: list[dict]) -> int:
    by_id = {d["id"]: d for d in decisions}
    applied = 0
    for key, status_field in REVIEWABLE_KEYS:
        val = lesson.get(key)
        items = val if isinstance(val, list) else ([val] if isinstance(val, dict) else [])
        for item in items:
            if not isinstance(item, dict):
                continue
            item_id = item.get("id")
            if item_id in by_id:
                d = by_id[item_id]
                item[status_field] = d["decision"]
                if d["decision"] == "rejected" and d.get("note"):
                    item["review_note"] = d["note"]
                applied += 1
    return applied


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("review_json")
    ap.add_argument("lesson_json")
    ap.add_argument("--work", default=None,
                    help="work 目錄（例 ~/mandarin-work/115AG3H）；給定時把審核決定累積存到 "
                         "<work>/reviews/lessonNN.json，讓從零重建（rebuild_check.sh）時能重新套用，"
                         "核准狀態不會被打回 draft。")
    ap.add_argument("--no-save", action="store_true", help="只套用，不寫入 work/reviews（重建流程用）")
    args = ap.parse_args()

    review = read_json(Path(args.review_json))
    lesson_path = Path(args.lesson_json)
    lesson = read_json(lesson_path)

    if review.get("lesson_id") != lesson.get("lesson_id"):
        print(f"警告：審核結果 lesson_id={review.get('lesson_id')} 與檔案 lesson_id="
              f"{lesson.get('lesson_id')} 不一致，仍繼續套用（以 id 比對為準）。")

    applied = apply_decisions(lesson, review.get("decisions", []))
    write_json(lesson_path, lesson)

    if args.work and not args.no_save:
        lesson_id = lesson.get("lesson_id", "")
        store = Path(args.work).expanduser() / "reviews" / f"lesson{lesson_id[-2:]}.json"
        store.parent.mkdir(parents=True, exist_ok=True)
        merged = {}
        if store.exists():
            for d in read_json(store).get("decisions", []):
                merged[d["id"]] = d
        for d in review.get("decisions", []):
            merged[d["id"]] = d  # 後來的決定覆蓋先前的
        write_json(store, {"lesson_id": lesson_id, "decisions": list(merged.values())})
        print(f"審核決定已累積存檔 → {store}（共 {len(merged)} 筆）")
    print(f"套用 {applied} 筆審核結果 → {lesson_path}")


if __name__ == "__main__":
    main()
