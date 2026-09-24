"""11修辭總表（全冊1檔 docx，以修辭格分段，例句以「（第N課）」反向歸課）。
「修辭格名稱」「定義」可公開，例句需改寫（課文原句節錄，版權紅線內）。
"""
from __future__ import annotations

from pathlib import Path

from common import cn_to_int, read_docx_paragraphs
from extractors.sentence_patterns import LESSON_TAG_RE, NUM_PREFIX_RE


def parse_paragraphs(paragraphs: list[str]) -> list[dict]:
    results = []
    cur_category = None
    cur_definition = ""
    for raw in paragraphs:
        line = raw.strip()
        if not line:
            continue
        if line == "例句":
            continue
        if line.startswith("定義"):
            cur_definition = line[2:]
            continue
        m = LESSON_TAG_RE.search(line)
        if m:
            lesson_no = cn_to_int(m.group(1))
            sentence = LESSON_TAG_RE.sub("", line)
            sentence = NUM_PREFIX_RE.sub("", sentence).strip()
            results.append({
                "figure": cur_category,
                "definition": cur_definition,
                "example": sentence,
                "lesson_no": lesson_no,
            })
            continue
        cur_category = line
        cur_definition = ""
    return results


def extract(src_dir: Path, lesson_no: int) -> dict:
    folder = src_dir / "1.備課資料" / "11修辭總表"
    cands = list(folder.glob("*.docx"))
    if not cands:
        return {"status": "missing", "source": str(folder), "items": []}
    path = cands[0]
    paragraphs = read_docx_paragraphs(path)
    all_items = parse_paragraphs(paragraphs)
    items = [it for it in all_items if it["lesson_no"] == lesson_no]
    return {
        "status": "ready" if items else "todo",
        "source": f"dabutie:11修辭總表（{path.name}，反向歸課）",
        "items": items,
    }
