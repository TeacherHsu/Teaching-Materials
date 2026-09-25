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


# --- 研究 agent 實際輸出欄位名稱對映（規格「已知落差」段） ---


def test_normalize_candidate_maps_legacy_field_names():
    raw = {
        "url": "https://pedia.cloud.edu.tw/Entry/Detail?title=蝸牛",
        "title": "蝸牛 - 教育百科",
        "provider": "教育部教育雲教育百科",
        "type": "dictionary",
        "module": "vocabulary",
        "matched_lesson": "部分",
        "edition_note": "通用辭典詞條",
        "needs_login": "否",
        "ads_or_inappropriate": "無",
        "checked_date": "2026-09-25",
        "note": "說明蝸牛外型與習性",
    }
    c = ae.normalize_candidate(raw)
    assert c["version_note"] == "通用辭典詞條"
    assert c["login_required"] is False
    assert c["checked_at"] == "2026-09-25"
    assert "matched_lesson" not in c
    assert "edition_note" not in c
    assert "needs_login" not in c
    assert "checked_date" not in c
    assert "ads_or_inappropriate" not in c
    assert c["note"] == "說明蝸牛外型與習性"


def test_normalize_candidate_needs_login_true():
    raw = {"url": "https://quizlet.com/x", "needs_login": "是"}
    c = ae.normalize_candidate(raw)
    assert c["login_required"] is True


def test_normalize_candidate_rejects_ads_or_inappropriate():
    raw = {
        "url": "https://www.youtube.com/watch?v=x",
        "title": "有廣告的影片",
        "ads_or_inappropriate": "含不當內容",
    }
    try:
        ae.normalize_candidate(raw)
        assert False, "ads_or_inappropriate 為真應丟例外"
    except ValueError:
        pass


def test_normalize_candidate_allows_youtube_style_disclaimer():
    """「未見不當內容，但平台可能插入一般廣告」是免責敘述，不應被當成拒收。"""
    raw = {
        "url": "https://www.youtube.com/watch?v=feCqoggL9GM",
        "ads_or_inappropriate": "未見不當內容，YouTube平台前後可能插入一般廣告，教師播放前建議先確認",
    }
    c = ae.normalize_candidate(raw)
    assert "ads_or_inappropriate" not in c


def test_normalize_candidate_keeps_clean_ads_field():
    raw = {"url": "https://www.youtube.com/watch?v=x", "ads_or_inappropriate": "無"}
    c = ae.normalize_candidate(raw)
    assert "ads_or_inappropriate" not in c


def test_merge_candidates_reports_rejected_ads_and_skips_them():
    lesson = {"lesson_id": LESSON_ID}
    candidates = [
        {
            "url": "https://wordwall.net/tc/resource/1",
            "title": "正常連結",
            "provider": "Wordwall",
            "type": "game",
            "module": "characters",
            "ads_or_inappropriate": "無",
        },
        {
            "url": "https://www.youtube.com/watch?v=bad",
            "title": "有問題的影片",
            "ads_or_inappropriate": "疑似置入性行銷廣告",
        },
    ]
    rejected: list[str] = []
    added, kept = ae.merge_candidates(lesson, candidates, rejected=rejected)
    assert added == 1
    assert kept == 0
    assert len(lesson["extensions"]) == 1
    assert lesson["extensions"][0]["title"] == "正常連結"
    assert len(rejected) == 1
    assert "bad" in rejected[0] or "watch?v=bad" in rejected[0]


def test_apply_extensions_with_legacy_field_names_end_to_end():
    lesson = {"lesson_id": LESSON_ID}
    candidates = [
        {
            "url": "https://dict.idioms.moe.edu.tw/idiomView.jsp?ID=743",
            "title": "迫不及待",
            "provider": "教育部《成語典》2020",
            "type": "dictionary",
            "module": "idiom_builder",
            "matched_lesson": "是",
            "edition_note": "無版本限制",
            "needs_login": "否",
            "ads_or_inappropriate": "無",
            "checked_date": "2026-09-25",
            "note": "官方成語典條目",
        }
    ]
    added, kept = ae.merge_candidates(lesson, candidates)
    assert added == 1
    ext = lesson["extensions"][0]
    assert ext["version_note"] == "無版本限制"
    assert ext["login_required"] is False
    assert ext["checked_at"] == "2026-09-25"
    assert ext["status"] == "draft"
