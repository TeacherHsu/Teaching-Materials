"""08各課短語句型練習（每課1檔 PDF，單欄）：一/二/三大類＝短語練習／造句練習／句型練習。
「結構」「說明」可公開；「引導」為教學提示（可公開，教師用）；範例句（⑴⑵⑶⑷／◎主句）
需改寫，落地為 examples[](draft)。
"""
from __future__ import annotations

import re
from pathlib import Path

from common import find_lesson_file, read_pdf_text, resolve_path

SECTION_RE = re.compile(r"^[一二三]、")
HEAD_RE = re.compile(r"^[◎⒈⒉⒊⒋⒌]\s*(.+)$")
NUM_HEAD_RE = re.compile(r"^[⒈⒉⒊⒋⒌⒍⒎⒏⒐]\s*(.+)$")
EXAMPLE_RE = re.compile(r"^[⑴⑵⑶⑷⑸⑹⑺⑻]\s*(.+)$")
FIELD_RE = re.compile(r"^(結構|說明|引導|解析)[：:]\s*(.*)$")


def parse_lines(lines: list[str]) -> dict:
    sections = {"短語練習": [], "造句練習": [], "句型練習": []}
    section_names = ["短語練習", "造句練習", "句型練習"]
    cur_section = None
    cur_item = None

    def flush():
        if cur_item and cur_section:
            sections[cur_section].append(cur_item)

    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        if SECTION_RE.match(line):
            flush()
            cur_item = None
            for name in section_names:
                if name in line:
                    cur_section = name
                    break
            continue
        if line.startswith("◎") or NUM_HEAD_RE.match(line):
            flush()
            head = line.lstrip("◎⒈⒉⒊⒋⒌⒍⒎⒏⒐").strip()
            cur_item = {"head": head, "structure": "", "description": "", "guide": "", "analysis": "", "examples": []}
            continue
        fm = FIELD_RE.match(line)
        if fm and cur_item is not None:
            key, val = fm.groups()
            mapping = {"結構": "structure", "說明": "description", "引導": "guide", "解析": "analysis"}
            cur_item[mapping[key]] = val
            continue
        em = EXAMPLE_RE.match(line)
        if em and cur_item is not None:
            cur_item["examples"].append(em.group(1).strip())
            continue
        # 課名列或頁碼列等雜訊行，忽略
    flush()
    return sections


def extract(src_dir: Path, lesson_no: int) -> dict:
    folder = resolve_path(src_dir, "1.備課資料", "08各課短語句型練習", "PDF")
    path = find_lesson_file(folder, lesson_no, exts=(".pdf",))
    if path is None:
        return {"status": "missing", "source": str(folder), "sections": {}}
    text = read_pdf_text(path, layout=True)
    lines = text.split("\n")
    sections = parse_lines(lines)
    has_any = any(sections.values())
    return {
        "status": "ready" if has_any else "todo",
        "source": f"dabutie:08各課短語句型練習（{path.name}）",
        "sections": sections,
    }
