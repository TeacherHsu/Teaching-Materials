"""13課文結構表（每課1檔 PDF）：段落句子＋結構角色標籤（如「分說／總說」）。
角色標籤（分說/總說/起因/經過/結果…）為結構性詞彙可公開；段落內容需改寫，
落在 paragraph_summary[].structure_role 對應規格 §3。
"""
from __future__ import annotations

import re
from pathlib import Path

from common import find_lesson_file, read_pdf_text

ITEM_RE = re.compile(r"(\d+)[.．]\s*(.+)")


def parse_text(text: str, lesson_title: str = "") -> list[dict]:
    pending: list[dict] = []
    result: list[dict] = []
    title_clean = lesson_title.strip()
    for raw in text.split("\n"):
        line = raw.strip()
        if not line:
            continue
        if title_clean and line == title_clean:
            continue
        m = ITEM_RE.search(line)
        if m:
            no, content = m.groups()
            # 一行內可能同時含角色標籤（如「總說   5.  時間，到底是什麼？」）
            prefix = line[: m.start()].strip()
            if prefix:
                # 先把先前累積、尚未賦予角色的項目賦予這個角色
                for it in pending:
                    it["structure_role"] = prefix
                result.extend(pending)
                pending = []
                pending.append({"para_no": int(no), "content": content.strip(), "structure_role": prefix})
                result.extend(pending)
                pending = []
            else:
                pending.append({"para_no": int(no), "content": content.strip(), "structure_role": ""})
            continue
        # 非項目行、非標題行 -> 視為角色標籤，套用到累積中的項目
        if pending:
            for it in pending:
                it["structure_role"] = line
            result.extend(pending)
            pending = []
    result.extend(pending)
    result.sort(key=lambda x: x["para_no"])
    return result


def extract(src_dir: Path, lesson_no: int, lesson_title: str = "") -> dict:
    folder = src_dir / "1.備課資料" / "13課文結構表" / "PDF"
    path = find_lesson_file(folder, lesson_no, exts=(".pdf",))
    if path is None:
        return {"status": "missing", "source": str(folder), "items": []}
    text = read_pdf_text(path, layout=True)
    items = parse_text(text, lesson_title)
    return {
        "status": "ready" if items else "todo",
        "source": f"dabutie:13課文結構表（{path.name}）",
        "items": items,
    }
