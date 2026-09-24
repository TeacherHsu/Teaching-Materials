"""15閱讀理解提問（每課1檔 .doc，textutil 轉純文字）：
題號＋題幹＋策略標籤(推論訊息/提取訊息/比較評估/詮釋整合)＋答案（全形浪紋括號 ︵ ︶ 內）。
策略標籤為教師用分類詞可公開；題幹與答案提示需改寫。
"""
from __future__ import annotations

import re
from pathlib import Path

from common import find_lesson_file, read_doc_via_textutil

Q_RE = re.compile(r"^(\d+)[.．]\s*(.+?)([推論提取比較詮釋][^\d]{2,4})\s*$")
ANS_RE = re.compile(r"^︵(.+)︶\s*$")


def parse_text(text: str) -> list[dict]:
    items = []
    cur = None
    for raw in text.split("\n"):
        line = raw.strip()
        if not line or line == "SHAPE  \\* MERGEFORMAT":
            continue
        m = Q_RE.match(line)
        if m:
            if cur:
                items.append(cur)
            no, stem, tag = m.groups()
            cur = {"no": int(no), "stem": stem.strip(), "strategy_tag": tag.strip(), "answer_hint": ""}
            continue
        am = ANS_RE.match(line)
        if am and cur:
            cur["answer_hint"] = am.group(1).strip()
            continue
    if cur:
        items.append(cur)
    return items


def extract(src_dir: Path, lesson_no: int) -> dict:
    folder = src_dir / "1.備課資料" / "15閱讀理解提問"
    path = find_lesson_file(folder, lesson_no, exts=(".doc", ".docx"))
    if path is None:
        return {"status": "missing", "source": str(folder), "items": []}
    text = read_doc_via_textutil(path)
    items = parse_text(text)
    return {
        "status": "ready" if items else "todo",
        "source": f"dabutie:15閱讀理解提問（{path.name}）",
        "items": items,
    }
