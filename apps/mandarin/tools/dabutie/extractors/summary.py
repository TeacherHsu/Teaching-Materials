"""12主旨、課文大意、段落大意（全冊1檔 docx，「第N課　課名」為課界）。
主旨／課文大意／段落大意全部需改寫（draft），因為是課文內容的濃縮衍生，
教師需要把關「改寫品質」（規格 §1 版權界線表）。
"""
from __future__ import annotations

import re
from pathlib import Path

from common import read_docx_paragraphs

LESSON_HEAD_RE = re.compile(r"^第(.+?)課[　 ]*(.*)$")
PARA_RE = re.compile(r"^第(.+?)段[：:]\s*(.*)$")


def parse_paragraphs(paragraphs: list[str], target_lesson_no: int) -> dict:
    from common import cn_to_int

    in_target = False
    theme = ""
    gist = ""
    para_summaries: list[dict] = []
    cur_para_no = None
    for raw in paragraphs:
        line = raw.strip()
        m = LESSON_HEAD_RE.match(line)
        if m:
            lesson_no = cn_to_int(m.group(1))
            in_target = (lesson_no == target_lesson_no)
            cur_para_no = None
            continue
        if not in_target or not line:
            continue
        if line.startswith("主旨："):
            theme = line[len("主旨："):]
            continue
        if line.startswith("課文大意："):
            gist = line[len("課文大意："):]
            continue
        if line == "段落大意":
            continue
        pm = PARA_RE.match(line)
        if pm:
            cur_para_no = cn_to_int(pm.group(1))
            para_summaries.append({"para_no": cur_para_no, "summary": pm.group(2).strip()})
            continue
        # 段落大意跨行接續（Word 自動換行非新段落）
        if para_summaries and cur_para_no is not None and para_summaries[-1]["para_no"] == cur_para_no:
            para_summaries[-1]["summary"] += line.strip()
    return {"theme": theme, "gist": gist, "paragraphs": para_summaries}


def extract(src_dir: Path, lesson_no: int) -> dict:
    folder = src_dir / "1.備課資料" / "12主旨、課文大意、段落大意"
    cands = list(folder.glob("*.docx"))
    if not cands:
        return {"status": "missing", "source": str(folder), "theme": "", "gist": "", "paragraphs": []}
    path = cands[0]
    paragraphs = read_docx_paragraphs(path)
    data = parse_paragraphs(paragraphs, lesson_no)
    ready = bool(data["gist"] or data["paragraphs"])
    data["status"] = "ready" if ready else "todo"
    data["source"] = f"dabutie:12主旨、課文大意、段落大意（{path.name}）"
    return data
