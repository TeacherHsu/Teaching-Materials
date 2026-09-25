"""07生字延伸成語（每課1檔，PDF雙欄版面；.doc 原檔中文以 antiword 讀出為亂碼，
改用 PDF + pdftotext，依前導空白切雙欄後照原序解析）。
成語與定義可公開（status:"ready"）；例句（★開頭）需改寫，落地為
idiom_sentences[]（status:"draft"），原文只留 work 目錄。
"""
from __future__ import annotations

import re
from pathlib import Path

from common import find_lesson_file, read_pdf_text, split_two_columns, resolve_path

ITEM_RE = re.compile(r"^(\d+)[.．]\s*(.+)$")


def parse_lines(lines: list[str], related_chars: list[str] | None = None) -> list[dict]:
    related_chars = related_chars or []
    items = []
    cur = None
    for line in lines:
        m = ITEM_RE.match(line)
        if m:
            if cur:
                items.append(cur)
            no, rest = m.groups()
            if "：" in rest:
                idiom, definition = rest.split("：", 1)
            else:
                idiom, definition = rest, ""
            cur = {"no": int(no), "idiom": idiom.strip(), "definition": definition.strip(), "sentences": [], "related": ""}
            continue
        if line.startswith("近義"):
            continue  # 近義詞非本規格欄位，暫不落地
        if line.startswith("★"):
            if cur:
                cur["sentences"].append(line.lstrip("★").strip())
            continue
        # 續行：續接上一筆定義或例句
        if cur is None:
            continue
        if cur["sentences"]:
            cur["sentences"][-1] += line.strip()
        else:
            cur["definition"] += line.strip()
    if cur:
        items.append(cur)
    items.sort(key=lambda x: x["no"])
    for it in items:
        for ch in related_chars:
            if ch and ch in it["idiom"]:
                it["related"] = ch
                break
    return items


def extract(src_dir: Path, lesson_no: int, related_chars: list[str] | None = None) -> dict:
    folder = resolve_path(src_dir, "1.備課資料", "07生字延伸成語", "PDF")
    path = find_lesson_file(folder, lesson_no, exts=(".pdf",))
    if path is None:
        return {"status": "missing", "source": str(folder), "items": []}
    text = read_pdf_text(path, layout=True)
    lines = split_two_columns(text)
    items = parse_lines(lines, related_chars)
    return {
        "status": "ready" if items else "todo",
        "source": f"dabutie:07生字延伸成語（{path.name}，PDF雙欄解析）",
        "items": items,
    }
