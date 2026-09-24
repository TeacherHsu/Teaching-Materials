"""改寫內容不得與大補帖原文有 8 字以上連續重疊（REWRITE-GUIDE.md 規則）。
比對 work 目錄的 rewrite-queue（原文，不進 repo）與 rewrites（改寫，不進 repo）。
work 目錄不在本 repo 內，兩個檔案都不存在時直接跳過（例如 CI 環境沒有 mandarin-work）。
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

WORK = Path.home() / "mandarin-work" / "115AG3H"
QUEUE_FILE = WORK / "rewrite-queue" / "lesson01.json"
REWRITES_FILE = WORK / "rewrites" / "lesson01.json"

MIN_OVERLAP = 8


def _max_common_substring_len(a: str, b: str) -> int:
    if not a or not b:
        return 0
    # 標準最長共同子字串（動態規劃），課次文字量小，O(len(a)*len(b)) 可接受。
    prev = [0] * (len(b) + 1)
    best = 0
    for i in range(1, len(a) + 1):
        cur = [0] * (len(b) + 1)
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                cur[j] = prev[j - 1] + 1
                best = max(best, cur[j])
        prev = cur
    return best


def _iter_pairs():
    """yield (label, rewritten_text, original_text)"""
    queue = json.loads(QUEUE_FILE.read_text(encoding="utf-8"))
    rewrites = json.loads(REWRITES_FILE.read_text(encoding="utf-8"))

    orig_idiom = {s["id"]: s["original"] for s in queue.get("idiom_sentences", [])}
    for s in rewrites.get("idiom_sentences", []):
        if s["id"] in orig_idiom:
            yield (f"idiom_sentence:{s['id']}", s["rewritten"], orig_idiom[s["id"]])

    orig_sp = {p["id"]: p["original_examples"] for p in queue.get("sentence_pattern_examples", [])}
    for p in rewrites.get("sentence_patterns", []):
        for orig in orig_sp.get(p["id"], []):
            for ex in p.get("examples", []):
                yield (f"sentence_pattern:{p['id']}", ex, orig)

    orig_para = {p["id"]: p["original"] for p in queue.get("paragraph_summary", [])}
    for p in rewrites.get("paragraph_summary", []):
        orig = orig_para.get(p["id"])
        if orig:
            yield (f"paragraph_summary:{p['id']}", p["summary"], orig)

    mi = rewrites.get("main_idea", {})
    mi_orig = queue.get("main_idea", {})
    if mi.get("gist") and mi_orig.get("gist_original"):
        yield ("main_idea.gist", mi["gist"], mi_orig["gist_original"])
    if mi.get("theme") and mi_orig.get("theme_original"):
        yield ("main_idea.theme", mi["theme"], mi_orig["theme_original"])

    orig_rq = {q["id"]: q for q in queue.get("reading_questions", [])}
    for q in rewrites.get("reading_questions", []):
        oq = orig_rq.get(q["id"])
        if not oq:
            continue
        if oq.get("stem_original"):
            yield (f"reading_question.stem:{q['id']}", q["stem"], oq["stem_original"])
        if oq.get("answer_hint_original"):
            yield (f"reading_question.answer_hint:{q['id']}", q["answer_hint"], oq["answer_hint_original"])


@pytest.mark.skipif(not QUEUE_FILE.exists() or not REWRITES_FILE.exists(), reason="work 目錄改寫檔不存在，跳過")
def test_no_long_verbatim_overlap():
    violations = []
    for label, rewritten, original in _iter_pairs():
        overlap = _max_common_substring_len(rewritten, original)
        if overlap >= MIN_OVERLAP:
            violations.append(f"{label}: 與原文連續重疊 {overlap} 字")
    assert not violations, "改寫內容與原文重疊過長：\n" + "\n".join(violations)


@pytest.mark.skipif(not QUEUE_FILE.exists() or not REWRITES_FILE.exists(), reason="work 目錄改寫檔不存在，跳過")
def test_rewrites_cover_all_todo_rewrite_ids():
    """rewrites 檔應涵蓋 rewrite-queue 列出的每一筆待改寫 id（聆聽題除外，第1課無來源）。"""
    queue = json.loads(QUEUE_FILE.read_text(encoding="utf-8"))
    rewrites = json.loads(REWRITES_FILE.read_text(encoding="utf-8"))

    expected_ids = set()
    expected_ids |= {s["id"] for s in queue.get("idiom_sentences", [])}
    expected_ids |= {p["id"] for p in queue.get("sentence_pattern_examples", [])}
    expected_ids |= {p["id"] for p in queue.get("paragraph_summary", [])}
    expected_ids |= {q["id"] for q in queue.get("reading_questions", [])}

    got_ids = set()
    got_ids |= {s["id"] for s in rewrites.get("idiom_sentences", [])}
    got_ids |= {p["id"] for p in rewrites.get("sentence_patterns", [])}
    got_ids |= {p["id"] for p in rewrites.get("paragraph_summary", [])}
    got_ids |= {q["id"] for q in rewrites.get("reading_questions", [])}

    missing = expected_ids - got_ids
    assert not missing, f"rewrites 缺少以下 id 的改寫：{missing}"
