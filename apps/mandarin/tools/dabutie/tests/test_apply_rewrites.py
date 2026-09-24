"""apply_rewrites.py：rewrites 檔（work 目錄，不進 repo）套用到 lesson JSON
的欄位覆蓋／新增邏輯。合成 fixture，不依賴大補帖原文。
"""
from __future__ import annotations

import apply_rewrites as ar


def test_apply_list_updates_matching_id_and_sets_draft():
    lesson = {"rhetoric": [{"id": "rhetoric:x:1", "figure": "譬喻", "example": None, "status": "todo_rewrite"}]}
    rewrites = {"rhetoric": [{"id": "rhetoric:x:1", "example": "改寫例句", "child_note": "白話說明"}]}

    applied = ar.apply_rewrites(lesson, rewrites)
    assert applied == 1
    item = lesson["rhetoric"][0]
    assert item["status"] == "draft"
    assert item["example"] == "改寫例句"
    assert item["child_note"] == "白話說明"


def test_apply_list_does_not_overwrite_approved():
    lesson = {"rhetoric": [{"id": "rhetoric:x:1", "example": "教師核准版本", "status": "approved"}]}
    rewrites = {"rhetoric": [{"id": "rhetoric:x:1", "example": "新的改寫（不應套用）"}]}

    applied = ar.apply_rewrites(lesson, rewrites)
    assert applied == 0
    assert lesson["rhetoric"][0]["example"] == "教師核准版本"
    assert lesson["rhetoric"][0]["status"] == "approved"


def test_apply_list_polysemy_sentence():
    lesson = {"polysemy": [{"id": "polysemy:x:牛:0", "char": "牛", "sentence": None, "status": "todo_rewrite"}]}
    rewrites = {"polysemy": [{"id": "polysemy:x:牛:0", "sentence": "叔叔家養了一頭乳牛。"}]}

    applied = ar.apply_rewrites(lesson, rewrites)
    assert applied == 1
    assert lesson["polysemy"][0]["sentence"] == "叔叔家養了一頭乳牛。"
    assert lesson["polysemy"][0]["status"] == "draft"


def test_apply_upsert_listening_creates_missing_items():
    """listening 完全無大補帖來源時，rewrites 檔是唯一正本：lesson JSON 裡
    找不到對應 id 也要新增（而非略過），reruneg import_lesson.py 產生空殼後
    apply_rewrites.py 才能重建完整清單。"""
    lesson = {"listening": []}
    rewrites = {"listening": [
        {"id": "listening:x:0001", "stem": "小明先刷牙。", "question": "先做什麼？",
         "options": ["刷牙", "吃飯"], "answer": "刷牙"},
    ]}

    applied = ar.apply_rewrites(lesson, rewrites)
    assert applied == 1
    assert len(lesson["listening"]) == 1
    item = lesson["listening"][0]
    assert item["status"] == "draft"
    assert item["stem"] == "小明先刷牙。"
    assert item["answer"] == "刷牙"


def test_apply_upsert_listening_skips_rejected():
    lesson = {"listening": [{"id": "listening:x:0001", "stem": "舊題目", "status": "rejected"}]}
    rewrites = {"listening": [{"id": "listening:x:0001", "stem": "不應覆蓋"}]}

    applied = ar.apply_rewrites(lesson, rewrites)
    assert applied == 0
    assert lesson["listening"][0]["stem"] == "舊題目"
    assert lesson["listening"][0]["status"] == "rejected"
