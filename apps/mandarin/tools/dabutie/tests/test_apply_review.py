"""apply_review.py：待審頁（src/pages/ReviewPage.js）下載的審核結果 JSON
套用邏輯。串接 apply_rewrites → apply_review → merge 重跑，確認：
- 各大項狀態都套用到正確欄位（sentence_patterns 是 examples_status，其餘是 status）
- rejected 的內容標記 review_note，且不會被 filter-build-data 判定為可上線
  （PUBLIC_STATUSES 只認 ready/approved，這裡用等價的 python 集合模擬）
- 重跑 merge（模擬 import_lesson.py 重跑）不會遺失已核准（approved）的內容
"""
from __future__ import annotations

import apply_review as arv
import merge


LESSON_ID = "999AG3H99"
PUBLIC_STATUSES = {"ready", "approved"}


def _lesson_with_draft_items():
    return {
        "lesson_id": LESSON_ID,
        "idiom_sentences": [
            {"id": "idiom_sentence:1", "rewritten": "改寫例句", "status": "draft"},
        ],
        "sentence_patterns": [
            {
                "id": "sentence_pattern:1",
                "structure": "先……才……",
                "examples": ["改寫例句一", "改寫例句二"],
                "examples_status": "draft",
                "status": "ready",
            },
        ],
        "rhetoric": [
            {"id": "rhetoric:1", "figure": "譬喻", "example": "改寫例句", "status": "draft"},
        ],
        "paragraph_summary": [
            {"id": "paragraph_summary:1", "para_no": 1, "summary": "改寫大意", "status": "draft"},
        ],
        "main_idea": {"id": "main_idea:1", "gist": "改寫大意", "theme": "改寫主旨", "status": "draft"},
        "reading_questions": [
            {"id": "reading_question:1", "stem": "改寫題幹", "status": "draft"},
        ],
        "listening": [
            {"id": "listening:1", "stem": "改寫題目", "status": "draft"},
        ],
        "polysemy": [
            {"id": "polysemy:1", "char": "待", "sentence": "改寫例句", "status": "draft"},
        ],
    }


def test_apply_decisions_sets_correct_status_field_per_group():
    lesson = _lesson_with_draft_items()
    decisions = [
        {"id": "idiom_sentence:1", "decision": "approved"},
        {"id": "sentence_pattern:1", "decision": "approved"},
        {"id": "rhetoric:1", "decision": "rejected", "note": "例句太難"},
        {"id": "paragraph_summary:1", "decision": "approved"},
        {"id": "main_idea:1", "decision": "approved"},
        {"id": "reading_question:1", "decision": "rejected", "note": "題目不清楚"},
        {"id": "listening:1", "decision": "approved"},
        {"id": "polysemy:1", "decision": "approved"},
    ]

    applied = arv.apply_decisions(lesson, decisions)
    assert applied == len(decisions)

    assert lesson["idiom_sentences"][0]["status"] == "approved"
    # sentence_patterns：決定要寫進 examples_status，不是 status
    assert lesson["sentence_patterns"][0]["examples_status"] == "approved"
    assert lesson["sentence_patterns"][0]["status"] == "ready"  # 結構欄不受影響
    assert lesson["rhetoric"][0]["status"] == "rejected"
    assert lesson["rhetoric"][0]["review_note"] == "例句太難"
    assert lesson["paragraph_summary"][0]["status"] == "approved"
    assert lesson["main_idea"]["status"] == "approved"
    assert lesson["reading_questions"][0]["status"] == "rejected"
    assert lesson["reading_questions"][0]["review_note"] == "題目不清楚"
    assert lesson["listening"][0]["status"] == "approved"
    assert lesson["polysemy"][0]["status"] == "approved"


def test_rejected_items_are_excluded_from_public_statuses():
    lesson = _lesson_with_draft_items()
    decisions = [{"id": "rhetoric:1", "decision": "rejected", "note": "不夠清楚"}]
    arv.apply_decisions(lesson, decisions)

    assert lesson["rhetoric"][0]["status"] not in PUBLIC_STATUSES  # 不上線


def test_approved_survives_merge_rerun():
    """核准後重跑匯入器（merge.build_rhetoric 等）不可把 approved 打回 todo_rewrite。
    完整鏈路：merge 首次產生（todo_rewrite）→ 改寫（draft）→ apply_review 核准
    （approved）→ 重跑 merge（模擬重跑 import_lesson.py）仍保留 approved。
    """
    rhetoric_raw = {
        "items": [{"figure": "譬喻", "definition": "用比方說明的修辭法。", "lesson_no": 1}],
        "source": "dabutie:11修辭總表",
    }
    first = merge.build_rhetoric(rhetoric_raw, LESSON_ID)
    assert first[0]["status"] == "todo_rewrite"

    # 改寫作業：填入例句，狀態轉 draft（apply_rewrites.py 的行為）
    first[0]["example"] = "改寫例句"
    first[0]["status"] = "draft"

    lesson = {"lesson_id": LESSON_ID, "rhetoric": first}
    decisions = [{"id": first[0]["id"], "decision": "approved"}]
    applied = arv.apply_decisions(lesson, decisions)
    assert applied == 1
    assert lesson["rhetoric"][0]["status"] == "approved"

    # 模擬重跑 import_lesson.py 的 merge 階段
    existing_by_id = {r["id"]: r for r in lesson["rhetoric"]}
    rebuilt = merge.build_rhetoric(rhetoric_raw, LESSON_ID, existing_by_id)

    target = next(r for r in rebuilt if r["figure"] == "譬喻")
    assert target["status"] == "approved"
    assert target["example"] == "改寫例句"
