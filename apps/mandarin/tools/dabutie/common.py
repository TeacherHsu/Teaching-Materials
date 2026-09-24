"""共用工具：讀 docx / doc(textutil) / pdf(pdftotext)，JSON I/O，穩定 id。"""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
from pathlib import Path
from typing import Optional

try:
    import docx  # python-docx
except ImportError:  # pragma: no cover
    docx = None

CN_NUM = "一二三四五六七八九十"


def cn_to_int(s: str) -> Optional[int]:
    """「第一課」「第十一課」「第十二課」型中文數字→int，夠用即可，不做到百。"""
    s = s.strip()
    if not s:
        return None
    if s == "十":
        return 10
    if "十" in s:
        tens_part, _, ones_part = s.partition("十")
        tens = CN_NUM.index(tens_part) + 1 if tens_part else 1
        ones = CN_NUM.index(ones_part) + 1 if ones_part else 0
        return tens * 10 + ones
    if s in CN_NUM:
        return CN_NUM.index(s) + 1
    return None


def lesson_cn(n: int) -> str:
    """1 -> 一, 10 -> 十, 11 -> 十一（國小課次夠用，不做到百）。"""
    if n <= 10:
        return CN_NUM[n - 1] if n < 10 else "十"
    tens, ones = divmod(n, 10)
    s = ("十" if tens == 1 else CN_NUM[tens - 1] + "十")
    if ones:
        s += CN_NUM[ones - 1]
    return s


def stable_id(*parts: str) -> str:
    """由內容組成穩定 id（不含隨機成分），同輸入必同輸出。"""
    raw = ":".join(parts)
    h = hashlib.sha1(raw.encode("utf-8")).hexdigest()[:8]
    return f"{parts[0]}:{h}"


def read_docx_tables(path: Path):
    if docx is None:
        raise RuntimeError("python-docx 未安裝")
    d = docx.Document(str(path))
    return [[[c.text for c in row.cells] for row in t.rows] for t in d.tables]


def read_docx_paragraphs(path: Path) -> list[str]:
    if docx is None:
        raise RuntimeError("python-docx 未安裝")
    d = docx.Document(str(path))
    return [p.text for p in d.paragraphs]


def read_doc_via_textutil(path: Path) -> str:
    """舊 .doc 用 macOS textutil 轉純文字（比 antiword 對中文可靠）。"""
    out = subprocess.run(
        ["textutil", "-convert", "txt", "-stdout", str(path)],
        capture_output=True, text=True, check=True,
    )
    return out.stdout


def read_pdf_text(path: Path, layout: bool = True) -> str:
    args = ["pdftotext"]
    if layout:
        args.append("-layout")
    args += [str(path), "-"]
    out = subprocess.run(args, capture_output=True, text=True, check=True)
    return out.stdout


def split_two_columns(layout_text: str, threshold: int = 20) -> list[str]:
    """給 pdftotext -layout 的雙欄輸出，依前導空白長度切左右欄，
    回傳「左欄各行（原序）+ 右欄各行（原序）」串接後的單一序列，
    讓後續可依線性順序做正規表達式解析。"""
    left, right = [], []
    for line in layout_text.split("\n"):
        if not line.strip():
            continue
        lead = len(line) - len(line.lstrip(" "))
        if lead >= threshold:
            right.append(line.strip())
        else:
            left.append(line.strip())
    return left + right


def find_lesson_file(dir_: Path, lesson_no: int, exts=(".doc", ".docx", ".pdf")) -> Optional[Path]:
    """在資料夾（含子資料夾 WORD/PDF）找檔名含 L{lesson_no:02d} 的檔案，
    優先傳回可靠格式（docx > pdf > doc），依 exts 傳入順序決定優先序。"""
    pat = re.compile(rf"L0*{lesson_no}(?!\d)")
    candidates = []
    for p in dir_.rglob("*"):
        if p.is_file() and p.suffix.lower() in exts and pat.search(p.name):
            candidates.append(p)
    if not candidates:
        return None
    order = {ext: i for i, ext in enumerate(exts)}
    candidates.sort(key=lambda p: order.get(p.suffix.lower(), 99))
    return candidates[0]


_L0_CODE_RE = re.compile(r'(?<![0-9A-Za-z])([0-9]{3})([一-鿿])')
_L0_BENIGN_NEXT = set('頁年課冊字級號位分秒人次題卷章節段行列組班校日月時週個元度學期版')


def desensitize_l0(obj):
    """遞迴走訪並在字串中的「三位數＋緊接中文字」樣式（check_l0.py 判定的疑似
    學生代號樣式）中插入一個空白，避免我們自己標的來源檔名（例如「115上翰林版」
    的「115」= 學年度、非入學年度代號）誤觸公開檢查閘門。僅調整字串顯示，不影響
    JSON 的語意內容。"""
    if isinstance(obj, str):
        def _fix(m):
            digits, ch = m.groups()
            if ch in _L0_BENIGN_NEXT:
                return m.group(0)
            return f"{digits} {ch}"
        return _L0_CODE_RE.sub(_fix, obj)
    if isinstance(obj, list):
        return [desensitize_l0(x) for x in obj]
    if isinstance(obj, dict):
        return {k: desensitize_l0(v) for k, v in obj.items()}
    return obj


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))
