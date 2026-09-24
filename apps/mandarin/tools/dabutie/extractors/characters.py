"""02各冊生字：全冊1檔，table per 冊，row=課次，欄=課次｜習寫字(未分隔字串)｜認讀字。"""
from __future__ import annotations

from pathlib import Path

from common import lesson_cn, read_docx_tables, resolve_path

GRADE_CN = {1: "一", 2: "二", 3: "三", 4: "四", 5: "五", 6: "六"}


def parse_table(table: list[list[str]], lesson_no: int) -> dict:
    """table：單一冊次的表格（含表頭列與課次列）。"""
    target = lesson_cn(lesson_no)
    for row in table[2:]:  # row0=冊名, row1=欄名(課次/習寫字/認讀字)
        if not row:
            continue
        if row[0].strip() == target:
            basic = list(row[1]) if len(row) > 1 else []
            extended = list(row[2]) if len(row) > 2 and row[2].strip() else []
            return {"basic_chars": basic, "extended_chars": extended, "row": row}
    return {"basic_chars": [], "extended_chars": [], "row": None}


def pick_table(tables: list, grade: int, term: str) -> list | None:
    label = f"{GRADE_CN.get(grade, '')}{term}"
    for t in tables:
        header = t[0][0] if t and t[0] else ""
        if label in header:
            return t
    return None


def extract(src_dir: Path, lesson_no: int, grade: int = 3, term: str = "上") -> dict:
    folder = resolve_path(src_dir, "1.備課資料", "02各冊生字")
    path = folder / "115上翰林版生字.docx"
    if not path.exists():
        # 容錯：檔名可能因版本不同微調，退而求其次掃一層找唯一 docx
        # （folder 本身已由 resolve_path 保證存在，找不到 docx 才是真的沒資料）
        cands = list(folder.glob("*.docx"))
        if not cands:
            return {"status": "missing", "source": str(path), "basic_chars": [], "extended_chars": []}
        path = cands[0]
    tables = read_docx_tables(path)
    table = pick_table(tables, grade, term)
    if table is None:
        return {"status": "missing", "source": str(path), "basic_chars": [], "extended_chars": []}
    result = parse_table(table, lesson_no)
    result["status"] = "ready" if result["basic_chars"] else "todo"
    result["source"] = f"dabutie:02各冊生字（{path.name}）"
    return result
