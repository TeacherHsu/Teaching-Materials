"""raw JSON（各 extractor 輸出）→ schema v2 lesson JSON。
以穩定 id 對應保留既有 approved/rejected 的改寫內容（規格 §3）。
"""
from __future__ import annotations

from common import stable_id

PEDIA_URL = "https://pedia.cloud.edu.tw/Entry/Detail?title={}"


# draft 也要保留：改寫作業（REWRITE-GUIDE.md）把 status 設為 draft 等待教師審核，
# 重跑匯入器不可把它打回 todo_rewrite 並清空已改寫的文字（規格 §3）。
PRESERVED_STATUSES = ("draft", "approved", "rejected")


def _existing_status(existing_by_id: dict, item_id: str, default: str):
    ent = existing_by_id.get(item_id)
    if ent and ent.get("status") in PRESERVED_STATUSES:
        return ent["status"], ent.get("rewritten"), ent.get("review_note")
    return default, None, None


def _preserved(existing_by_id: dict, item_id: str):
    ent = existing_by_id.get(item_id)
    if ent and ent.get("status") in PRESERVED_STATUSES:
        return ent
    return None


def index_existing(existing_lesson: dict | None, key: str) -> dict:
    if not existing_lesson:
        return {}
    items = existing_lesson.get(key) or []
    return {it.get("id"): it for it in items if isinstance(it, dict) and it.get("id")}


def build_characters(char_raw: dict, pedia: dict, lesson_id: str) -> tuple[list[dict], list[str]]:
    todos = []
    pedia_chars = pedia.get("characters", {})
    basic = char_raw.get("basic_chars", [])
    extended = char_raw.get("extended_chars", [])
    out = []
    for idx, ch in enumerate(basic + extended):
        typ = "習寫字" if ch in basic else "認讀字"
        info = pedia_chars.get(ch)
        level = "basic" if idx < len(basic) else "challenge"
        if info is None:
            todos.append(f"characters: 「{ch}」不在 pedia 參考檔，zhuyin/radical/stroke_count 待補")
            out.append({
                "char": ch, "zhuyin": None, "stroke_count": None, "radical": None,
                "type": typ, "level": level, "examples": None, "image": None,
                "audio_override": None, "pedia_url": PEDIA_URL.format(ch),
                "source": char_raw.get("source", "dabutie:02各冊生字"),
                "status": "todo",
            })
            continue
        out.append({
            "char": ch,
            "zhuyin": info.get("zhuyin"),
            "stroke_count": info.get("stroke_count"),
            "radical": info.get("radical"),
            "type": typ,
            "level": level,
            "examples": None,
            "image": None,
            "audio_override": None,
            "pedia_url": PEDIA_URL.format(ch),
            "source": char_raw.get("source", "dabutie:02各冊生字"),
            "status": "ready",
        })
    return out, todos


def build_words(meaning_raw: dict, lesson_id: str, existing_by_id: dict) -> tuple[list[dict], list[str]]:
    todos = []
    out = []
    seen_words = set()
    for rec in meaning_raw.get("records", []):
        char = rec["char"]
        for sense in rec.get("senses", []):
            for ex in sense.get("examples", []):
                if not ex or ex in seen_words:
                    continue
                seen_words.add(ex)
                item_id = stable_id(f"word:{lesson_id}", ex)
                status, rewritten, note = _existing_status(existing_by_id, item_id, "ready")
                entry = {
                    "id": item_id,
                    "word": ex,
                    "zhuyin": None,
                    "meaning": sense.get("definition"),
                    "example_sentence": None,
                    "level": "basic",
                    "image": None,
                    "status": status,
                    "source": meaning_raw.get("source", "dabutie:06字義分析"),
                }
                if rewritten:
                    entry["example_sentence"] = rewritten
                if note:
                    entry["review_note"] = note
                out.append(entry)
    if out:
        todos.append(f"words: {len(out)} 筆 zhuyin 皆為 null（pedia 參考檔無語詞層級注音，僅有單字），待教師/後續工具補上")
    return out, todos


def build_word_meanings(meaning_raw: dict) -> list[dict]:
    out = []
    for rec in meaning_raw.get("records", []):
        out.append({
            "char": rec["char"],
            "radical": rec["radical"],
            "strokes": rec["strokes"],
            "senses": [{"definition": s["definition"], "examples": s.get("examples", [])} for s in rec.get("senses", [])],
            "status": "ready",
            "source": meaning_raw.get("source", "dabutie:06字義分析"),
        })
    return out


def build_idioms(idiom_raw: dict, lesson_id: str, existing_by_id: dict, existing_sentences_by_id: dict):
    idioms_out, sentences_out = [], []
    for it in idiom_raw.get("items", []):
        idiom_id = stable_id(f"idiom:{lesson_id}", it["idiom"])
        idioms_out.append({
            "id": idiom_id,
            "idiom": it["idiom"],
            "definition": it["definition"],
            "related_char": it.get("related", ""),
            "status": "ready",
            "source": idiom_raw.get("source", "dabutie:07生字延伸成語"),
        })
        for i, sent in enumerate(it.get("sentences", [])):
            sent_id = stable_id(f"idiom_sentence:{lesson_id}:{it['idiom']}", str(i))
            status, rewritten, note = _existing_status(existing_sentences_by_id, sent_id, "todo_rewrite")
            entry = {
                "id": sent_id,
                "idiom_id": idiom_id,
                "rewritten": rewritten,
                "status": status,
                "source": idiom_raw.get("source", "dabutie:07生字延伸成語"),
            }
            if note:
                entry["review_note"] = note
            sentences_out.append(entry)
    return idioms_out, sentences_out


def build_sentence_patterns(phrase_raw: dict, sp_raw: dict, lesson_id: str, existing_by_id: dict):
    out = []
    sections = phrase_raw.get("sections", {})
    for section_name, items in sections.items():
        for it in items:
            structure = it.get("structure") or it.get("head")
            pat_id = stable_id(f"sentence_pattern:{lesson_id}", section_name, structure or it.get("head", ""))
            examples_ids = []
            examples_status = "todo_rewrite"
            examples = []
            existing_entry = existing_by_id.get(pat_id)
            if existing_entry and existing_entry.get("examples_status") in PRESERVED_STATUSES:
                examples_status = existing_entry["examples_status"]
                examples = existing_entry.get("examples") or []
            out.append({
                "id": pat_id,
                "category": section_name,
                "head": it.get("head", ""),
                "structure": structure,
                "description": it.get("description", ""),
                "guide": it.get("guide", ""),
                "analysis": it.get("analysis", ""),
                "examples": examples,  # 待改寫，原文於 rewrite-queue
                "examples_status": examples_status,
                "status": "ready",  # 結構/說明本身可公開
                "source": phrase_raw.get("source", "dabutie:08各課短語句型練習"),
            })
    for it in sp_raw.get("items", []):
        pat_id = stable_id(f"sentence_pattern:{lesson_id}", "教冊句型總表", it.get("category", ""))
        existing_entry = existing_by_id.get(pat_id)
        examples_status = "todo_rewrite"
        examples = []
        if existing_entry and existing_entry.get("examples_status") in PRESERVED_STATUSES:
            examples_status = existing_entry["examples_status"]
            examples = existing_entry.get("examples") or []
        out.append({
            "id": pat_id,
            "category": "教冊句型總表",
            "head": it.get("category"),
            "structure": it.get("category"),
            "description": it.get("definition", ""),
            "guide": "",
            "analysis": "",
            "examples": examples,
            "examples_status": examples_status,
            "status": "ready",
            "source": sp_raw.get("source", "dabutie:09教冊句型總表"),
        })
    return out


def build_rhetoric(rhetoric_raw: dict, lesson_id: str, existing_by_id: dict | None = None):
    """一課同一修辭格在來源檔常有多個例句段落（見 11修辭總表反向歸課），
    schema 只留一筆「結構事實」（figure/note）＋一個待改寫 example，
    重複的原文段落只用來取 definition，不可各自產生一筆重複 id 的紀錄
    （曾是重跑產生重複輸出的根因）：先依 figure 去重，僅取每個 figure
    第一次出現的 definition。"""
    existing_by_id = existing_by_id or {}
    by_figure: dict[str, str] = {}
    order: list[str] = []
    for it in rhetoric_raw.get("items", []):
        figure = it.get("figure")
        if not figure:
            continue
        if figure not in by_figure:
            by_figure[figure] = it.get("definition", "")
            order.append(figure)
    out = []
    for figure in order:
        rid = stable_id(f"rhetoric:{lesson_id}", figure)
        existing = _preserved(existing_by_id, rid)
        entry = {
            "id": rid,
            "figure": figure,
            "note": by_figure[figure],
            "example": existing.get("example") if existing else None,
            "status": existing["status"] if existing else "todo_rewrite",
            "source": rhetoric_raw.get("source", "dabutie:11修辭總表"),
        }
        if existing and existing.get("child_note"):
            entry["child_note"] = existing["child_note"]
        if existing and existing.get("review_note"):
            entry["review_note"] = existing["review_note"]
        out.append(entry)
    return out


def build_paragraph_summary(summary_raw: dict, structure_raw: dict, lesson_id: str, existing_by_id: dict | None = None):
    existing_by_id = existing_by_id or {}
    out = []
    role_by_para = {it["para_no"]: it["structure_role"] for it in structure_raw.get("items", [])}
    for p in summary_raw.get("paragraphs", []):
        pid = stable_id(f"paragraph_summary:{lesson_id}", str(p["para_no"]))
        existing = _preserved(existing_by_id, pid)
        entry = {
            "id": pid,
            "para_no": p["para_no"],
            "summary": existing.get("summary") if existing else None,
            "structure_role": role_by_para.get(p["para_no"], ""),
            "status": existing["status"] if existing else "todo_rewrite",
            "source": summary_raw.get("source", "dabutie:12"),
        }
        if existing and existing.get("review_note"):
            entry["review_note"] = existing["review_note"]
        out.append(entry)
    return out


def build_main_idea(summary_raw: dict, lesson_id: str, existing_main_idea: dict | None = None):
    mid = stable_id(f"main_idea:{lesson_id}")
    if existing_main_idea and existing_main_idea.get("status") in PRESERVED_STATUSES and existing_main_idea.get("id") == mid:
        entry = {
            "id": mid,
            "gist": existing_main_idea.get("gist"),
            "theme": existing_main_idea.get("theme"),
            "status": existing_main_idea["status"],
            "source": summary_raw.get("source", "dabutie:12"),
        }
        if existing_main_idea.get("review_note"):
            entry["review_note"] = existing_main_idea["review_note"]
        return entry
    return {
        "id": mid,
        "gist": None,
        "theme": None,
        "status": "todo_rewrite",
        "source": summary_raw.get("source", "dabutie:12"),
    }


def build_reading_questions(rq_raw: dict, lesson_id: str, existing_by_id: dict | None = None):
    existing_by_id = existing_by_id or {}
    out = []
    for it in rq_raw.get("items", []):
        qid = stable_id(f"reading_question:{lesson_id}", str(it["no"]))
        existing = _preserved(existing_by_id, qid)
        entry = {
            "id": qid,
            "stem": existing.get("stem") if existing else None,
            "strategy_tag": it.get("strategy_tag", ""),
            "answer_hint": existing.get("answer_hint") if existing else None,
            "status": existing["status"] if existing else "todo_rewrite",
            "source": rq_raw.get("source", "dabutie:15閱讀理解提問"),
        }
        if existing and existing.get("review_note"):
            entry["review_note"] = existing["review_note"]
        out.append(entry)
    return out


def build_polysemy(meaning_raw: dict, lesson_id: str, existing_by_id: dict | None = None):
    """模組6 一字多義：word_meanings 中 ≥2 義項的生字，逐義項各留一筆待改寫的
    原創生活句（sentence）。definition/options 為結構事實，每次重跑依當前
    word_meanings 重新算；sentence（教師原創例句）與已核准的 status 需保留，
    id 用「char:義項序」而非 hash，方便人工比對 rewrite 檔。"""
    existing_by_id = existing_by_id or {}
    out = []
    for rec in meaning_raw.get("records", []):
        senses = rec.get("senses", [])
        if len(senses) < 2:
            continue
        char = rec["char"]
        options = [s.get("definition", "") for s in senses]
        for idx, sense in enumerate(senses):
            pid = f"polysemy:{lesson_id}:{char}:{idx}"
            existing = _preserved(existing_by_id, pid)
            entry = {
                "id": pid,
                "char": char,
                "sentence": existing.get("sentence") if existing else None,
                "definition": sense.get("definition", ""),
                "options": options,
                "status": existing["status"] if existing else "todo_rewrite",
                "source": meaning_raw.get("source", "dabutie:06字義分析"),
            }
            if existing and existing.get("review_note"):
                entry["review_note"] = existing["review_note"]
            out.append(entry)
    return out


def build_listening(listening_raw: dict, lesson_id: str, existing_items: list[dict] | None = None):
    """16聆聽練習來源常無對應檔案（規格 §6 風險3）：此時 listening[] 完全依賴
    教師以 rewrites 檔原創（apply_rewrites.py 會 upsert 進來），重跑匯入器
    不可把既有 draft/approved 的聆聽題清空——保留既有清單中仍是
    draft/approved/rejected 的項目。"""
    existing_items = existing_items or []
    preserved = [it for it in existing_items if isinstance(it, dict) and it.get("status") in PRESERVED_STATUSES]
    status = listening_raw.get("status", "missing")
    if preserved and status == "missing":
        status = "todo"  # 有教師原創題目，不再顯示「完全無來源」
    return {
        "items": preserved,
        "status": status,
        "source": listening_raw.get("source", "dabutie:16聆聽練習"),
    }


def build_review_words(char_raw: dict, lesson_no: int):
    return {"by_lesson": {str(lesson_no): char_raw.get("basic_chars", []) + char_raw.get("extended_chars", [])}}
