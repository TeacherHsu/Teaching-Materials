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


def test_rhetoric_dedups_by_figure_and_preserves_example():
    """同一修辭格在來源常有多段例句（11修辭總表反向歸課），曾是重跑產生
    重複輸出的根因：merge.build_rhetoric 應只留一筆／修辭格。"""
    rhetoric_raw = {
        "items": [
            {"figure": "類疊", "definition": "反覆使用的修辭法。", "lesson_no": 1},
            {"figure": "類疊", "definition": "反覆使用的修辭法。", "lesson_no": 1},
            {"figure": "類疊", "definition": "反覆使用的修辭法。", "lesson_no": 1},
            {"figure": "譬喻", "definition": "用比方說明的修辭法。", "lesson_no": 1},
        ],
        "source": "dabutie:11修辭總表",
    }

    first = merge.build_rhetoric(rhetoric_raw, LESSON_ID)
    assert len(first) == 2  # 去重後只剩 2 個修辭格，不是 4 筆原文段落
    assert len({r["id"] for r in first}) == 2

    first[0]["example"] = "改寫例句（合成測試用）"
    first[0]["child_note"] = "類疊＝重複說同一個詞語。"
    first[0]["status"] = "draft"
    existing_by_id = {r["id"]: r for r in first}

    second = merge.build_rhetoric(rhetoric_raw, LESSON_ID, existing_by_id)
    assert len(second) == 2
    target = next(r for r in second if r["figure"] == "類疊")
    assert target["status"] == "draft"
    assert target["example"] == "改寫例句（合成測試用）"
    assert target["child_note"] == "類疊＝重複說同一個詞語。"


def test_polysemy_only_multisense_chars_and_preserves_sentence_on_rerun():
    meaning_raw = {
        "records": [
            {"char": "牛", "radical": "牛", "strokes": "0/4", "senses": [
                {"definition": "動物", "examples": ["乳牛"]},
                {"definition": "固執", "examples": ["牛脾氣"]},
            ]},
            {"char": "永", "radical": "水", "strokes": "1/5", "senses": [
                {"definition": "恆久", "examples": []},
            ]},
        ],
        "source": "dabutie:06字義分析",
    }

    first = merge.build_polysemy(meaning_raw, LESSON_ID)
    assert len(first) == 2  # 只有「牛」是多義字，各義項各一筆；「永」單義不進 polysemy
    assert all(p["char"] == "牛" for p in first)
    assert first[0]["status"] == "todo_rewrite"

    first[0]["sentence"] = "叔叔家養了一頭乳牛。（合成測試用）"
    first[0]["status"] = "draft"
    existing_by_id = {p["id"]: p for p in first}

    second = merge.build_polysemy(meaning_raw, LESSON_ID, existing_by_id)
    assert second[0]["status"] == "draft"
    assert second[0]["sentence"] == "叔叔家養了一頭乳牛。（合成測試用）"
    assert second[0]["options"] == ["動物", "固執"]


def test_listening_preserves_existing_draft_items_when_source_missing():
    """16聆聽練習常無對應大補帖檔案（規格 §6 風險3），此時 listening[] 完全
    是教師原創題目，重跑匯入器不可清空既有 draft/approved 題目。"""
    listening_raw = {"status": "missing", "source": "dabutie:16聆聽練習"}
    existing_items = [
        {"id": "listening:999AG3H99:0001", "stem": "小明先刷牙。", "question": "先做什麼？",
         "options": ["刷牙", "吃飯"], "answer": "刷牙", "status": "draft", "source": "original:draft"},
        {"id": "listening:999AG3H99:0002", "stem": "已被退回的題目。", "question": "?",
         "options": ["a", "b"], "answer": "a", "status": "todo_rewrite", "source": "original:draft"},
    ]

    result = merge.build_listening(listening_raw, LESSON_ID, existing_items)
    assert len(result["items"]) == 1  # todo_rewrite（未曾改寫）狀態的不保留
    assert result["items"][0]["id"] == "listening:999AG3H99:0001"
    assert result["status"] == "todo"  # 有教師原創題目時不再顯示「完全無來源」


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
