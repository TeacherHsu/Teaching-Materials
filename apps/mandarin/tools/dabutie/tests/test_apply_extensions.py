"""apply_extensions.py：延伸練習候選連結併入 lesson JSON extensions[]。
- 以正規化網址當穩定 id，重跑保留既有 approved/rejected 決定。
- 候選裡沒有再回報、但先前已存在的連結（例如教師已核准過）不會被刪掉。
"""
from __future__ import annotations

import apply_extensions as ae


LESSON_ID = "999AG3H99"


def test_new_candidates_become_draft():
    lesson = {"lesson_id": LESSON_ID}
    candidates = [
        {
            "url": "https://wordwall.net/tc/resource/1",
            "title": "生字選字遊戲",
            "provider": "Wordwall",
            "type": "game",
            "module": "characters",
            "version_note": "通用",
        },
    ]
    added, kept = ae.merge_candidates(lesson, candidates)
    assert added == 1
    assert kept == 0
    assert len(lesson["extensions"]) == 1
    ext = lesson["extensions"][0]
    assert ext["status"] == "draft"
    assert ext["title"] == "生字選字遊戲"
    assert ext["id"].startswith("ext:")


def test_rerun_preserves_approved_status():
    lesson = {"lesson_id": LESSON_ID}
    candidate = {
        "url": "https://wordwall.net/tc/resource/1",
        "title": "生字選字遊戲",
        "provider": "Wordwall",
        "type": "game",
        "module": "characters",
    }
    ae.merge_candidates(lesson, [candidate])
    lesson["extensions"][0]["status"] = "approved"

    # 重跑：同一 url 再進來一次（研究 agent 重新產生候選），標題稍微更新
    candidate2 = dict(candidate, title="生字選字遊戲（更新版）")
    added, kept = ae.merge_candidates(lesson, [candidate2])
    assert added == 0
    assert kept == 1
    ext = lesson["extensions"][0]
    assert ext["status"] == "approved", "重跑不可把已核准的連結打回 draft"
    assert ext["title"] == "生字選字遊戲（更新版）", "非狀態欄位仍以候選來源更新"


def test_urls_differing_only_by_trailing_slash_share_stable_id():
    assert ae.extension_id("https://wordwall.net/tc/resource/1") == ae.extension_id(
        "https://wordwall.net/tc/resource/1/"
    )


def test_non_https_url_rejected():
    lesson = {"lesson_id": LESSON_ID}
    try:
        ae.merge_candidates(lesson, [{"url": "http://wordwall.net/x", "title": "t", "provider": "p", "type": "game", "module": "characters"}])
        assert False, "應該要因為非 https 而丟例外"
    except ValueError:
        pass


def test_candidate_no_longer_reported_is_kept():
    lesson = {
        "lesson_id": LESSON_ID,
        "extensions": [
            {
                "id": "ext:old",
                "url": "https://quizlet.com/old",
                "title": "舊連結",
                "provider": "Quizlet",
                "type": "quiz",
                "module": "vocabulary",
                "status": "approved",
            }
        ],
    }
    added, kept = ae.merge_candidates(lesson, [])
    assert added == 0
    assert kept == 0
    assert len(lesson["extensions"]) == 1
    assert lesson["extensions"][0]["status"] == "approved"
