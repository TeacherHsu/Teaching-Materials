"""06字義分析（每課1檔 docx）：表格 序號｜生字｜部首｜筆畫｜字義／造詞（句）。
字義原文照登（版權表允許），「例」後面的造詞是可公開語詞；若字義敘述內含完整
例句（"例：XXX真的很XXX" 這種句子而非詞），則整條標 draft 進待改寫佇列。
05（形音輕鬆學）PDF 為多欄版面、抽取可靠度低，本抽取器不採用，改以本檔（06）
供應語詞解釋，符合規格 §0 決定。
"""
from __future__ import annotations

import re
from pathlib import Path

from common import find_lesson_file, read_docx_tables, resolve_path

SENSE_RE = re.compile(r"^\s*\d+[.．]\s*(.+?)例(.+)$")


def parse_meaning_cell(text: str) -> list[dict]:
    """把「1.等候。例等待\\n2.對待、照顧。例優待、款待」拆成義項清單。"""
    senses = []
    for line in text.split("\n"):
        line = line.strip()
        if not line:
            continue
        m = SENSE_RE.match(line)
        if m:
            definition, examples_raw = m.groups()
            frags = [w.strip("。") for w in re.split("[、，,]", examples_raw) if w.strip("。")]
            # 06字義分析多數「例」後接造詞（≤6字），但「它」等少數字例句是完整句子
            # （版權表：例句需改寫），依長度分流，避免長句誤當公開語詞落地。
            examples = [w for w in frags if len(w) <= 6]
            sentences = [w for w in frags if len(w) > 6]
            senses.append({
                "definition": definition.strip("。"),
                "examples": examples,
                "sentences": sentences,
            })
        else:
            # 沒有「例」的義項（純定義）
            m2 = re.match(r"^\s*\d+[.．]\s*(.+)$", line)
            if m2:
                senses.append({"definition": m2.group(1).strip("。"), "examples": [], "sentences": []})
            else:
                senses.append({"definition": line.strip("。"), "examples": [], "sentences": []})
    return senses


def parse_table(table: list[list[str]]) -> list[dict]:
    """table：[header_row, row1, row2, ...]，header=['','生字','部首','筆畫','字義／造詞（句）']。"""
    records = []
    for row in table[1:]:
        if len(row) < 5 or not row[1].strip():
            continue
        idx, char, radical, strokes, meaning_text = row[0], row[1], row[2], row[3], row[4]
        records.append({
            "char": char.strip(),
            "radical": radical.strip(),
            "strokes": strokes.strip(),
            "senses": parse_meaning_cell(meaning_text),
        })
    return records


def extract(src_dir: Path, lesson_no: int) -> dict:
    folder = resolve_path(src_dir, "1.備課資料", "06字義分析", "WORD")
    path = find_lesson_file(folder, lesson_no, exts=(".docx",))
    if path is None:
        return {"status": "missing", "source": str(folder), "records": []}
    tables = read_docx_tables(path)
    if not tables:
        return {"status": "missing", "source": str(path), "records": []}
    records = parse_table(tables[0])
    return {
        "status": "ready" if records else "todo",
        "source": f"dabutie:06字義分析（{path.name}）",
        "records": records,
    }
