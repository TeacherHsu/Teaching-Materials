"""09教冊句型總表（全冊1檔，以句型類別分段，例句以「（第N課）」反向歸課）。
「結構」（句型類別名稱）可公開，例句需改寫。
"""
from __future__ import annotations

import re
from pathlib import Path

from common import cn_to_int, read_doc_via_textutil, resolve_path

LESSON_TAG_RE = re.compile(r"[（﹙]第(.+?)課[）﹚]\s*$")
NUM_PREFIX_RE = re.compile(r"^\d+[.．]\s*")


def parse_text(text: str) -> list[dict]:
    """回傳全冊清單：[{category, definition, sentence, lesson_no}, ...]。"""
    lines = [l for l in text.split("\n")]
    results = []
    cur_category = None
    cur_definition = ""
    for raw in lines:
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
                "category": cur_category,
                "definition": cur_definition,
                "sentence": sentence,
                "lesson_no": lesson_no,
            })
            continue
        # 不含課次標記、非定義/例句行 -> 視為新分類標題
        cur_category = line
        cur_definition = ""
    return results


def extract(src_dir: Path, lesson_no: int) -> dict:
    folder = resolve_path(src_dir, "1.備課資料", "09教冊句型總表")
    cands = list(folder.glob("*.doc")) + list(folder.glob("*.docx"))
    if not cands:
        return {"status": "missing", "source": str(folder), "items": []}
    path = cands[0]
    text = read_doc_via_textutil(path) if path.suffix.lower() == ".doc" else ""
    all_items = parse_text(text)
    items = [it for it in all_items if it["lesson_no"] == lesson_no]
    return {
        "status": "ready" if items else "todo",
        "source": f"dabutie:09教冊句型總表（{path.name}，反向歸課）",
        "items": items,
    }
