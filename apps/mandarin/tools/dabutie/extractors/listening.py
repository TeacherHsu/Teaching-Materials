"""16聆聽練習：盤點顯示僅部分課次有對應檔案（第1課目前未見對應檔），
若找不到就回傳 status:"missing"，merge 階段對應 modules.listening.status="missing"
（規格 §6 風險 3 已預告此情況）。
"""
from __future__ import annotations

from pathlib import Path

from common import find_lesson_file, read_docx_paragraphs, resolve_path


def extract(src_dir: Path, lesson_no: int) -> dict:
    folder = resolve_path(src_dir, "1.備課資料", "16聆聽練習")
    if not folder.exists():
        return {"status": "missing", "source": str(folder), "items": []}
    path = find_lesson_file(folder, lesson_no, exts=(".docx", ".doc"))
    if path is None:
        return {"status": "missing", "source": f"{folder}（第{lesson_no}課無對應檔案）", "items": []}
    paragraphs = read_docx_paragraphs(path) if path.suffix.lower() == ".docx" else []
    items = [{"raw": p.strip()} for p in paragraphs if p.strip()]
    return {
        "status": "todo",  # 結構未確認（規格 §6 風險3），先落地原文供人工比對，不自動判斷題型
        "source": f"dabutie:16聆聽練習（{path.name}，結構未確認）",
        "items": items,
    }
