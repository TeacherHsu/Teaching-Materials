"""merge.py 重跑保留邏輯：draft/approved/rejected 都不可被下一次匯入覆蓋（規格 §3）。
用合成小 fixture，不依賴大補帖原文／pedia，也不依賴實際檔案解析。
"""
import merge


LESSON_ID = "999AG3H99"


def test_paragraph_summary_preserves_draft_on_rerun():
    summary_raw = {"paragraphs": [{"para_no": 1}], "source": "dabutie:12"}
    structure_raw = {"items": [{"para_no": 1, "structure_role": "總說"}]}

    first = merge.build_paragraph_summary(summary_raw, structure_raw, LESSON_ID)
    assert first[0]["status"] == "todo_rewrite"
    assert first[0]["summary"] is None

    # 模拟已改寫：狀態改為 draft
    first[0]["summary"] = "改寫後的段落大意（合成測試用）"
    first[0]["status"] = "draft"
    existing_by_id = {first[0]["id"]: first[0]}

    second = merge.build_paragraph_summary(summary_raw, structure_raw, LESSON_ID, existing_by_id)
    assert second[0]["status"] == "draft"
    assert second[0]["summary"] == "改寫後的段落大意（合成測試用）"


def test_reading_questions_preserves_approved_on_rerun():
    rq_raw = {"items": [{"no": 1, "strategy_tag": "提取訊息"}], "source": "dabutie:15"}

    first = merge.build_reading_questions(rq_raw, LESSON_ID)
    first[0]["stem"] = "核准後的題幹（合成測試用）"
    first[0]["answer_hint"] = "核准後的提示"
    first[0]["status"] = "approved"
    existing_by_id = {first[0]["id"]: first[0]}

    second = merge.build_reading_questions(rq_raw, LESSON_ID, existing_by_id)
    assert second[0]["status"] == "approved"
    assert second[0]["stem"] == "核准後的題幹（合成測試用）"


def test_main_idea_preserves_draft_on_rerun():
    summary_raw = {"source": "dabutie:12"}
    first = merge.build_main_idea(summary_raw, LESSON_ID)
    first["gist"] = "改寫大意（合成測試用）"
    first["status"] = "draft"

    second = merge.build_main_idea(summary_raw, LESSON_ID, first)
    assert second["status"] == "draft"
    assert second["gist"] == "改寫大意（合成測試用）"


def test_main_idea_fresh_default_todo_rewrite():
    summary_raw = {"source": "dabutie:12"}
    entry = merge.build_main_idea(summary_raw, LESSON_ID)
    assert entry["status"] == "todo_rewrite"
    assert entry["gist"] is None


def test_sentence_pattern_examples_preserve_draft_on_rerun():
    phrase_raw = {"sections": {"造句練習": [{"head": "慢吞吞", "structure": "慢吞吞"}]}, "source": "dabutie:08"}
    sp_raw = {"items": []}

    first = merge.build_sentence_patterns(phrase_raw, sp_raw, LESSON_ID, {})
    first[0]["examples"] = ["改寫例句一（合成測試用）"]
    first[0]["examples_status"] = "draft"
    existing_by_id = {first[0]["id"]: first[0]}

    second = merge.build_sentence_patterns(phrase_raw, sp_raw, LESSON_ID, existing_by_id)
    assert second[0]["examples_status"] == "draft"
    assert second[0]["examples"] == ["改寫例句一（合成測試用）"]
