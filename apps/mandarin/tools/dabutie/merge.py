"""raw JSON（各 extractor 輸出）→ schema v2 lesson JSON。
以穩定 id 對應保留既有 approved/rejected 的改寫內容（規格 §3）。
"""
from __future__ import annotations

from common import stable_id

PEDIA_URL = "https://pedia.cloud.edu.tw/Entry/Detail?title={}"


def _existing_status(existing_by_id: dict, item_id: str, default: str):
    ent = existing_by_id.get(item_id)
    if ent and ent.get("status") in ("approved", "rejected"):
        return ent["status"], ent.get("rewritten"), ent.get("review_note")
    return default, None, None


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
            existing_entry = existing_by_id.get(pat_id)
            if existing_entry and existing_entry.get("status") in ("approved", "rejected"):
                examples_status = existing_entry["status"]
            out.append({
                "id": pat_id,
                "category": section_name,
                "head": it.get("head", ""),
                "structure": structure,
                "description": it.get("description", ""),
                "guide": it.get("guide", ""),
                "analysis": it.get("analysis", ""),
                "examples": [],  # 待改寫，原文於 rewrite-queue
                "examples_status": examples_status,
                "status": "ready",  # 結構/說明本身可公開
                "source": phrase_raw.get("source", "dabutie:08各課短語句型練習"),
            })
    for it in sp_raw.get("items", []):
        pat_id = stable_id(f"sentence_pattern:{lesson_id}", "教冊句型總表", it.get("category", ""))
        out.append({
            "id": pat_id,
            "category": "教冊句型總表",
            "head": it.get("category"),
            "structure": it.get("category"),
            "description": it.get("definition", ""),
            "guide": "",
            "analysis": "",
            "examples": [],
            "examples_status": "todo_rewrite",
            "status": "ready",
            "source": sp_raw.get("source", "dabutie:09教冊句型總表"),
        })
    return out


def build_rhetoric(rhetoric_raw: dict, lesson_id: str):
    out = []
    for it in rhetoric_raw.get("items", []):
        rid = stable_id(f"rhetoric:{lesson_id}", it.get("figure", ""))
        out.append({
            "id": rid,
            "figure": it.get("figure"),
            "note": it.get("definition", ""),
            "example": None,
            "status": "todo_rewrite",
            "source": rhetoric_raw.get("source", "dabutie:11修辭總表"),
        })
    return out


def build_paragraph_summary(summary_raw: dict, structure_raw: dict, lesson_id: str):
    out = []
    role_by_para = {it["para_no"]: it["structure_role"] for it in structure_raw.get("items", [])}
    for p in summary_raw.get("paragraphs", []):
        pid = stable_id(f"paragraph_summary:{lesson_id}", str(p["para_no"]))
        out.append({
            "id": pid,
            "para_no": p["para_no"],
            "summary": None,
            "structure_role": role_by_para.get(p["para_no"], ""),
            "status": "todo_rewrite",
            "source": summary_raw.get("source", "dabutie:12"),
        })
    return out


def build_main_idea(summary_raw: dict, lesson_id: str):
    return {
        "id": stable_id(f"main_idea:{lesson_id}"),
        "gist": None,
        "theme": None,
        "status": "todo_rewrite",
        "source": summary_raw.get("source", "dabutie:12"),
    }


def build_reading_questions(rq_raw: dict, lesson_id: str):
    out = []
    for it in rq_raw.get("items", []):
        qid = stable_id(f"reading_question:{lesson_id}", str(it["no"]))
        out.append({
            "id": qid,
            "stem": None,
            "strategy_tag": it.get("strategy_tag", ""),
            "answer_hint": None,
            "status": "todo_rewrite",
            "source": rq_raw.get("source", "dabutie:15閱讀理解提問"),
        })
    return out


def build_listening(listening_raw: dict, lesson_id: str):
    return {
        "items": [],
        "status": listening_raw.get("status", "missing"),
        "source": listening_raw.get("source", "dabutie:16聆聽練習"),
    }


def build_review_words(char_raw: dict, lesson_no: int):
    return {"by_lesson": {str(lesson_no): char_raw.get("basic_chars", []) + char_raw.get("extended_chars", [])}}
