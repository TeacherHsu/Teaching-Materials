#!/usr/bin/env python3
"""翰林 115 三上大補帖匯入器 CLI 入口。
用法：
  python3 tools/dabutie/import_lesson.py \\
      --src <大補帖根目錄> --lesson 1 --work <work目錄> --out <lesson json輸出路徑>
規格：docs/specs/2026-09-25-mandarin-dabutie-importer.md
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from common import SourceNotFoundError, desensitize_l0, read_json, write_json  # noqa: E402
import merge  # noqa: E402
from extractors import (  # noqa: E402
    characters as ex_characters,
    idioms as ex_idioms,
    listening as ex_listening,
    phrases_sentences as ex_phrases,
    reading_questions as ex_reading_questions,
    rhetoric as ex_rhetoric,
    sentence_patterns as ex_sentence_patterns,
    structure_map as ex_structure_map,
    summary as ex_summary,
    word_meanings as ex_word_meanings,
)

PEDIA_PATH = Path.home() / "sped-os/30-materials/interactive/lesson-park/reference/115AG3H-pedia.json"
VOLUME_CODE = "115AG3H"


def load_pedia() -> dict:
    if not PEDIA_PATH.exists():
        return {"lessons": {}, "characters": {}}
    return json.loads(PEDIA_PATH.read_text(encoding="utf-8"))


def lesson_id_for(volume_code: str, lesson_no: int) -> str:
    return f"{volume_code}{lesson_no:02d}"


def validate_src(src: Path) -> None:
    """匯入前先確認來源根目錄真的存在、且長得像大補帖（有「1.備課資料」）。
    找不到就大聲失敗（非 0 exit），不得讓後續抽取器各自吞掉例外、靜默回傳空資料。
    路徑比對一律 NFC 正規化，容忍 unzip/ditto/Finder 解壓造成的檔名編碼差異。
    """
    if not src.exists():
        print(f"[匯入失敗] --src 指定的資料夾不存在：{src}", file=sys.stderr)
        sys.exit(2)
    try:
        from common import resolve_path
        resolve_path(src, "1.備課資料")
    except SourceNotFoundError as e:
        print("[匯入失敗] 來源根目錄底下找不到「1.備課資料」，來源解壓可能不完整或損毀：", file=sys.stderr)
        print(str(e), file=sys.stderr)
        print(
            "提示：本機 unzip（Info-ZIP）對這份大補帖 zip 的中文檔名會產生亂碼／"
            "「Illegal byte sequence」，請改用 macOS `ditto -x -k <zip> <目的地>` "
            "或 Finder 雙擊解壓，不要用 unzip。",
            file=sys.stderr,
        )
        sys.exit(2)


def run_extractors(src: Path, lesson_no: int, work: Path, pedia_title: str) -> dict:
    validate_src(src)
    steps = [
        ("characters", lambda: ex_characters.extract(src, lesson_no)),
        ("word_meanings", lambda: ex_word_meanings.extract(src, lesson_no)),
        ("phrases_sentences", lambda: ex_phrases.extract(src, lesson_no)),
        ("sentence_patterns", lambda: ex_sentence_patterns.extract(src, lesson_no)),
        ("rhetoric", lambda: ex_rhetoric.extract(src, lesson_no)),
        ("summary", lambda: ex_summary.extract(src, lesson_no)),
        ("structure_map", lambda: ex_structure_map.extract(src, lesson_no, pedia_title)),
        ("reading_questions", lambda: ex_reading_questions.extract(src, lesson_no)),
        ("listening", lambda: ex_listening.extract(src, lesson_no)),
    ]
    raw: dict = {}
    errors: list[str] = []
    for key, fn in steps:
        try:
            raw[key] = fn()
        except SourceNotFoundError as e:
            errors.append(f"{key}: {e}")

    if errors:
        print(f"[匯入失敗] {len(errors)} 個來源資料夾找不到，全部列出（不做部分匯入）：", file=sys.stderr)
        for e in errors:
            print(f"- {e}", file=sys.stderr)
        sys.exit(2)

    related_chars = raw["characters"].get("basic_chars", []) + raw["characters"].get("extended_chars", [])
    try:
        raw["idioms"] = ex_idioms.extract(src, lesson_no, related_chars)
    except SourceNotFoundError as e:
        print(f"[匯入失敗] idioms: {e}", file=sys.stderr)
        sys.exit(2)

    lesson_dir = work / "raw" / f"lesson{lesson_no:02d}"
    for key, data in raw.items():
        write_json(lesson_dir / f"{key}.json", data)
    return raw


def build_quiz(characters: list[dict]) -> list[dict]:
    quiz = []
    for i, ch in enumerate(characters[:5], start=1):
        if ch["status"] != "ready":
            continue
        others = [c for c in characters if c["char"] != ch["char"] and c.get("zhuyin")]
        import random
        random.seed(ch["char"])  # 確定性亂數，重跑結果穩定
        distractors = random.sample(others, k=min(2, len(others))) if others else []
        options = [ch["zhuyin"]] + [d["zhuyin"] for d in distractors]
        random.shuffle(options)
        quiz.append({
            "id": f"q{i:02d}",
            "type": "choice",
            "stem": f"「{ch['char']}」的注音是？",
            "options": options,
            "answer": ch["zhuyin"],
            "explanation": f"「{ch['char']}」讀作 {ch['zhuyin']}（來源：教育部教育百科）。",
            "level": "basic",
            "status": "ready",
            "source": "derived:pedia",
            "hints": ["先念念看聲母，再想想韻母，不要急著選。"],
        })
    ready_chars = [c for c in characters if c["status"] == "ready"]
    if len(ready_chars) >= 2:
        quiz.append({
            "id": "m01",
            "type": "matching",
            "stem": "字 ↔ 部首配對",
            "pairs": [{"left": c["char"], "right": c["radical"]} for c in ready_chars[:6]],
            "level": "basic",
            "status": "ready",
            "source": "derived:pedia",
        })
    return quiz


def _sentence_pattern_originals(raw: dict) -> list[list[str]]:
    """對應 merge.build_sentence_patterns 的組裝順序：先 08 各分類項目，後 09 反向歸課項目。"""
    out = []
    for items in raw["phrases_sentences"].get("sections", {}).values():
        for it in items:
            out.append(it.get("examples", []))
    for it in raw["sentence_patterns"].get("items", []):
        out.append([it.get("sentence", "")])
    return out


def module_entry(label: str, activity: str, count: int, threshold: int = 3, note: str = "") -> dict:
    if count >= threshold:
        return {"label": label, "status": "available", "activity": activity}
    return {"label": label, "status": "missing", "note": note or f"教材審核中（僅 {count} 筆，未達門檻 {threshold}）"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, help="大補帖根目錄")
    ap.add_argument("--lesson", required=True, type=int)
    ap.add_argument("--work", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    src = Path(args.src).expanduser()
    work = Path(args.work).expanduser()
    out_path = Path(args.out)
    lesson_no = args.lesson

    pedia = load_pedia()
    lesson_id = lesson_id_for(VOLUME_CODE, lesson_no)
    pedia_entry = pedia.get("lessons", {}).get(lesson_id, {})
    pedia_title = pedia_entry.get("title", "").replace("第", "", 0) if pedia_entry else ""
    # pedia title 形如「第一課：時間是什麼」，13課文結構表跳過的是課名本身（不含「第X課」）
    if pedia_title and "：" in pedia_title:
        pedia_title = pedia_title.split("：", 1)[1]
    lesson_title = pedia_title or ""

    existing = None
    if out_path.exists():
        try:
            existing = read_json(out_path)
        except Exception:
            existing = None

    raw = run_extractors(src, lesson_no, work, lesson_title)

    # ---- characters ----
    characters, char_todos = merge.build_characters(raw["characters"], pedia, lesson_id)

    # ---- pedia 生字一致性比對 ----
    pedia_chars = pedia_entry.get("習寫字", []) + pedia_entry.get("認讀字", [])
    dbt_chars = raw["characters"].get("basic_chars", []) + raw["characters"].get("extended_chars", [])
    pedia_diff = []
    if pedia_chars and dbt_chars and pedia_chars != dbt_chars:
        pedia_diff.append(f"02各冊生字（{dbt_chars}）與 pedia（{pedia_chars}）不一致")

    # ---- words ----
    existing_words_by_id = merge.index_existing(existing, "words")
    words, word_todos = merge.build_words(raw["word_meanings"], lesson_id, existing_words_by_id)
    word_meanings = merge.build_word_meanings(raw["word_meanings"])

    # ---- idioms ----
    existing_idioms_by_id = merge.index_existing(existing, "idioms")
    existing_idiom_sentences_by_id = merge.index_existing(existing, "idiom_sentences")
    idioms, idiom_sentences = merge.build_idioms(
        raw["idioms"], lesson_id, existing_idioms_by_id, existing_idiom_sentences_by_id
    )

    # ---- sentence_patterns ----
    existing_sp_by_id = merge.index_existing(existing, "sentence_patterns")
    sentence_patterns = merge.build_sentence_patterns(
        raw["phrases_sentences"], raw["sentence_patterns"], lesson_id, existing_sp_by_id
    )

    # ---- rhetoric ----
    existing_rhetoric_by_id = merge.index_existing(existing, "rhetoric")
    rhetoric = merge.build_rhetoric(raw["rhetoric"], lesson_id, existing_rhetoric_by_id)

    # ---- paragraph_summary / main_idea ----
    existing_paragraph_by_id = merge.index_existing(existing, "paragraph_summary")
    paragraph_summary = merge.build_paragraph_summary(raw["summary"], raw["structure_map"], lesson_id, existing_paragraph_by_id)
    main_idea = merge.build_main_idea(raw["summary"], lesson_id, (existing or {}).get("main_idea"))

    # ---- reading_questions ----
    existing_rq_by_id = merge.index_existing(existing, "reading_questions")
    reading_questions = merge.build_reading_questions(raw["reading_questions"], lesson_id, existing_rq_by_id)

    # ---- listening / review_words ----
    listening = merge.build_listening(raw["listening"], lesson_id)
    review_words = merge.build_review_words(raw["characters"], lesson_no)

    quiz = build_quiz(characters)

    lesson = {
        "lesson_id": lesson_id,
        "volume": {"code": VOLUME_CODE, "publisher": "翰林", "grade": 3, "term": "上"},
        "unit": (existing or {}).get("unit", {"no": 1, "title": "TODO: 單元名稱待補"}),
        "lesson_no": lesson_no,
        "title": lesson_title or (existing or {}).get("title", "TODO"),
        "author": (existing or {}).get("author", ""),
        "blurb": (existing or {}).get("blurb", "TODO: 課次簡介待教師撰寫"),
        "characters": characters,
        "words": words,
        "word_meanings": word_meanings,
        "sentences": (existing or {}).get("sentences", [{
            "pattern": "TODO", "examples": [], "blanks": [], "level": "basic",
            "status": "todo", "source": "missing: 沿用 v1 欄位，v2 改用 sentence_patterns[]",
        }]),
        "idioms": idioms,
        "idiom_sentences": idiom_sentences,
        "sentence_patterns": sentence_patterns,
        "rhetoric": rhetoric,
        "paragraph_summary": paragraph_summary,
        "main_idea": main_idea,
        "reading_questions": reading_questions,
        "listening": listening["items"],
        "review_words": review_words,
        "quiz": quiz,
        "modules": {
            "characters": module_entry("認識生字", "character-cards", len([c for c in characters if c["status"] == "ready"])),
            "vocabulary": module_entry("學會語詞", "vocabulary-cards", len(words)),
            "reading": module_entry("讀懂課文", "reading", len(paragraph_summary) + len(reading_questions)),
            "sentence_practice": module_entry("練習句子", "sentence-practice", len(sentence_patterns)),
            "challenge": module_entry("動手挑戰", "challenge-quiz", len(quiz)),
            "application": (existing or {}).get("modules", {}).get("application", {
                "label": "我會應用", "status": "missing", "note": "教材待補：應用任務設計中",
            }),
            "idiom_builder": module_entry("生字變成語", "idiom-builder", len(idioms)),
            "polysemy": module_entry("一字多義", "polysemy-quiz", len([r for r in word_meanings if len(r["senses"]) > 1])),
            "structure_map": module_entry("課文地圖", "structure-map", len(paragraph_summary)),
            "listening": module_entry("聽聽看", "listening-quiz", len(listening["items"]),
                                       note="教材審核中：" + ("16聆聽練習無此課對應檔案（規格 §6 風險3）" if listening["status"] == "missing" else "結構未確認，待人工比對")),
            "rhetoric": module_entry("修辭小偵探", "rhetoric-quiz", len(rhetoric)),
            "review": module_entry("舊字新詞", "review-words", 0, note="教材待補：需累積跨課 review_words.by_lesson 後才可用"),
        },
    }

    write_json(out_path, desensitize_l0(lesson))

    # ---- rewrite-queue（原文只留 work 目錄）----
    rewrite_queue = {
        "lesson_id": lesson_id,
        "idiom_sentences": [
            {"id": s["id"], "idiom_id": s["idiom_id"], "original": orig}
            for s, orig in zip(idiom_sentences, [
                sent for it in raw["idioms"].get("items", []) for sent in it.get("sentences", [])
            ])
        ],
        "sentence_pattern_examples": [
            {"id": p["id"], "category": p["category"], "original_examples": raw_examples}
            for p, raw_examples in zip(sentence_patterns, _sentence_pattern_originals(raw))
        ],
        "paragraph_summary": [
            {"id": p["id"], "para_no": p["para_no"], "original": orig.get("summary")}
            for p, orig in zip(paragraph_summary, raw["summary"].get("paragraphs", []))
        ],
        "main_idea": {
            "gist_original": raw["summary"].get("gist"),
            "theme_original": raw["summary"].get("theme"),
        },
        "reading_questions": [
            {"id": q["id"], "stem_original": it.get("stem"), "answer_hint_original": it.get("answer_hint")}
            for q, it in zip(reading_questions, raw["reading_questions"].get("items", []))
        ],
        "rhetoric_examples": [
            {"id": r["id"], "figure": r["figure"], "original_example": it.get("example")}
            for r, it in zip(rhetoric, raw["rhetoric"].get("items", []))
        ],
    }
    write_json(work / "rewrite-queue" / f"lesson{lesson_no:02d}.json", rewrite_queue)

    # ---- 匯入報告 ----
    report_lines = [
        f"# 匯入報告：{lesson_id}（{lesson_title}）",
        "",
        f"- 生字：{len(characters)}（習寫 {len(raw['characters'].get('basic_chars', []))}／認讀 {len(raw['characters'].get('extended_chars', []))}）",
        f"- 字義（06字義分析，逐字）：{len(word_meanings)}",
        f"- 語詞（由字義例字衍生）：{len(words)}",
        f"- 成語：{len(idioms)}（例句待改寫 {len(idiom_sentences)}）",
        f"- 短語句型（08，項目組數／例句總數）：短語 "
        f"{len(raw['phrases_sentences'].get('sections', {}).get('短語練習', []))}"
        f"（{sum(len(i['examples']) for i in raw['phrases_sentences'].get('sections', {}).get('短語練習', []))}句）／"
        f"造句 {len(raw['phrases_sentences'].get('sections', {}).get('造句練習', []))}"
        f"（{sum(len(i['examples']) for i in raw['phrases_sentences'].get('sections', {}).get('造句練習', []))}句）／"
        f"句型 {len(raw['phrases_sentences'].get('sections', {}).get('句型練習', []))}"
        f"（{sum(len(i['examples']) for i in raw['phrases_sentences'].get('sections', {}).get('句型練習', []))}句）"
        "（派工預期「4+4+4」對應各組例句數，非項目組數，見說明）",
        f"- 教冊句型總表（09，反向歸課）：{len(raw['sentence_patterns'].get('items', []))}",
        f"- 修辭（11，反向歸課）：{len(rhetoric)}",
        f"- 閱讀理解提問（15）：{len(reading_questions)}",
        f"- 段落大意（12）：{len(paragraph_summary)}",
        f"- 課文結構角色（13）：{len([p for p in paragraph_summary if p['structure_role']])} / {len(paragraph_summary)} 段有標註",
        f"- 聆聽練習（16）：{listening['status']}（{len(listening['items'])} 筆）",
        "",
        "## 與 pedia 差異",
    ]
    report_lines += (pedia_diff or ["（無差異）"])
    report_lines += ["", "## TODO"]
    todos = char_todos + word_todos
    if listening["status"] == "missing":
        todos.append("16聆聽練習：第1課無對應檔案，modules.listening 標 missing（規格 §6 風險3 已預告）")
    if not sentence_patterns:
        todos.append("sentence_patterns 為空，需檢查 08/09 來源")
    todos.append("words/idiom_sentences/sentence_patterns.examples/paragraph_summary/main_idea/reading_questions/rhetoric.example 皆為 status:todo_rewrite 佔位，原文在 work/rewrite-queue/，待後續改寫並 apply_review.py 核准")
    report_lines += [f"- {t}" for t in todos] if todos else ["（無）"]

    (work / "reports").mkdir(parents=True, exist_ok=True)
    (work / "reports" / f"lesson{lesson_no:02d}.md").write_text("\n".join(report_lines) + "\n", encoding="utf-8")

    print(f"完成：{out_path}")
    print(f"報告：{work / 'reports' / f'lesson{lesson_no:02d}.md'}")


if __name__ == "__main__":
    main()
