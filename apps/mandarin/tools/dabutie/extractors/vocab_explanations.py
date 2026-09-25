"""05形音輕鬆學（.doc→.docx，見 convert_doc.py）：翰林版目標語詞與解釋的正確來源
（不是 06字義分析的造詞）。一份 docx 拆成四段獨立資料：

- ■語詞解釋 → words[]（學會語詞正本，序號／語詞／解釋／原例句）
- ■字義辨正 → polysemy_senses[]（一字多義的權威字義來源，逐字多個義項＋課本例詞）
- ■認識多音字 → polyphones[]（一字多音，逐字多個讀音，各自的義項＋例詞）
- ■字形辨別 → lookalikes[]（形似字組，文字方塊裡的表格，探測失敗則回空清單並記 todo）

注音限制（誠實記錄，不猜測）：05 docx 的注音是向量圖形／特殊字型渲染
（文鼎注音寬字＋vml 形狀組成聲調符號），不是可抽取的純文字，抽不到就是抽不到；
本抽取器一律回傳 dabutie 端 zhuyin 為 None，注音一律交給呼叫端查 pedia 補，
pedia 沒有的維持 None 並在報告列 TODO（規格要求：不憑訓練記憶回答）。
"""
from __future__ import annotations

import re
import zipfile
from pathlib import Path

from lxml import etree

from common import read_docx_paragraphs

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W_NS}

HEADER_RE = re.compile(r"^■(.+)$")
NEW_SENSE_MARK_RE = re.compile(r"^[①②③④⑤]")
ENTRY_WORD_RE = re.compile(r"^(\d+)[.．]\s*(.+?)[:：]\s*(.*)$")
SMALL_FLOATER_RE = re.compile(r"^(\d+)[.．]([一-鿿])$")


def find_converted_docx(work: Path, lesson_no: int) -> Path | None:
    p = work / "converted" / f"L{lesson_no:02d}-形音輕鬆學.docx"
    return p if p.exists() else None


def _split_sections(paragraphs: list[str]) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {}
    current = None
    for p in paragraphs:
        m = HEADER_RE.match(p.strip())
        if m:
            current = m.group(1).strip()
            sections[current] = []
            continue
        if current is not None:
            sections[current].append(p)
    return sections


def _parse_sense(text: str) -> dict:
    """一段義項文字（可能內含軟斷行 \\n 純屬版面換行，非新義項）拆成
    definition／examples（如：後面的造詞）。"""
    text = text.replace("\n", "").strip()
    text = NEW_SENSE_MARK_RE.sub("", text).strip()
    text = text.lstrip("\t").strip()
    m = re.search(r"如[：:]?(.*)$", text)
    if m:
        definition = text[: m.start()].strip("。").strip()
        examples_raw = m.group(1)
        examples = [w.strip("。").strip() for w in re.split("[、，,]", examples_raw) if w.strip("。").strip()]
    else:
        definition = text.strip("。").strip()
        examples = []
    return {"definition": definition, "examples": examples}


def _parse_words(lines: list[str]) -> list[dict]:
    """■語詞解釋：「N.\\tword：解釋」+ 下一行原例句。"""
    words: list[dict] = []
    current: dict | None = None
    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        m = ENTRY_WORD_RE.match(line)
        if m:
            no, word, meaning = m.groups()
            current = {
                "no": int(no),
                "word": word.strip(),
                "meaning": meaning.strip("。").strip(),
                "example_sentence": None,
            }
            words.append(current)
        else:
            if current is None:
                continue
            if current["example_sentence"] is None:
                current["example_sentence"] = line
            else:
                # 例句因排版跨兩段時直接接續（罕見，觀察到的樣本沒有這種情況）
                current["example_sentence"] += line
    return words


def _parse_polyphones(lines: list[str]) -> dict[str, list[dict]]:
    """■認識多音字：「char｜...」開新讀音區塊，重複出現同一個字＝該字另一個讀音；
    區塊內後續「①②③」開頭（不含 char｜）的行是同一讀音的其他義項。"""
    readings_by_char: dict[str, list[dict]] = {}
    current_reading: dict | None = None
    block_char_re = re.compile(r"^(.)｜\s*(.*)$", re.S)
    for raw in lines:
        line = raw.strip("\t").strip()
        if not line.strip():
            continue
        m = block_char_re.match(raw.strip())
        if m:
            char, rest = m.groups()
            current_reading = {"senses": []}
            readings_by_char.setdefault(char, []).append(current_reading)
            if rest.strip():
                current_reading["senses"].append(_parse_sense(rest))
        else:
            if current_reading is None:
                continue
            current_reading["senses"].append(_parse_sense(raw))
    return readings_by_char


def _parse_polysemy_groups(lines: list[str]) -> list[dict]:
    """■字義辨正：同一個字的義項固定從①重新編號，遇到①且目前已有內容就是新的字。"""
    groups: list[dict] = []
    current: dict | None = None
    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        if NEW_SENSE_MARK_RE.match(line) and line.startswith("①") and current is not None:
            groups.append(current)
            current = None
        if current is None:
            current = {"senses": []}
        current["senses"].append(_parse_sense(raw))
    if current is not None:
        groups.append(current)
    return groups


def _small_floater_chars(path: Path) -> dict[int, list[str]]:
    """蒐集文件內「N.字」這種小型浮動文字方塊（■字義辨正／■認識多音字標題旁的
    裝飾字卡），回傳 {數字: [候選字,...]}，供字義辨正配對字用（認識多音字的字
    已經在正文「字｜」內，不需要靠這個）。"""
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml")
    root = etree.fromstring(xml)
    out: dict[int, list[str]] = {}
    for box in root.findall(".//w:txbxContent", NS):
        txt = "".join(t.text or "" for t in box.findall(".//w:t", NS))
        m = SMALL_FLOATER_RE.match(txt.strip())
        if m:
            out.setdefault(int(m.group(1)), []).append(m.group(2))
    return out


def _resolve_polysemy_chars(groups: list[dict], floaters: dict[int, list[str]], exclude_chars: set[str]) -> list[str | None]:
    resolved: list[str | None] = []
    for idx, _ in enumerate(groups, start=1):
        candidates = [c for c in floaters.get(idx, []) if c not in exclude_chars]
        resolved.append(candidates[0] if len(candidates) == 1 else None)
    return resolved


def _split_by_empty(cells: list[str]) -> list[list[str]]:
    chunks: list[list[str]] = []
    cur: list[str] = []
    for c in cells:
        if c.strip() == "":
            if cur:
                chunks.append(cur)
                cur = []
        else:
            cur.append(c)
    if cur:
        chunks.append(cur)
    return chunks


def parse_lookalike_grid(num_row: list[str], char_row: list[str], def_row: list[str], todos: list[str]) -> list[dict]:
    """字形辨別文字方塊的 3 列表格（數字列／字列／例詞列，欄位因 gridSpan 不同
    而長度不一，故用空字串儲存格當群組分隔符切段）拆成形似字組清單。
    純函式（不碰 docx/XML），方便單元測試；結構跟預期不同就記 todo 並跳過，
    不硬湊出假資料。"""
    labels = [c.rstrip(".").rstrip("．") for c in num_row if c.strip()]
    char_chunks = _split_by_empty(char_row)
    def_chunks = _split_by_empty(def_row)
    groups: list[dict] = []
    if not (len(labels) == len(char_chunks) == len(def_chunks)):
        todos.append(f"字形辨別：文字方塊表格欄位數對不齊（label={len(labels)} char組={len(char_chunks)} def組={len(def_chunks)}），略過此表")
        return groups
    for label, chars_chunk, defs_chunk in zip(labels, char_chunks, def_chunks):
        if len(chars_chunk) != len(defs_chunk):
            todos.append(f"字形辨別：第{label}組字數與例詞數不一致，略過此組")
            continue
        entries = [
            {"char": ch.strip(), "example": d.lstrip("：").lstrip(":").strip("。")}
            for ch, d in zip(chars_chunk, defs_chunk) if ch.strip()
        ]
        if entries:
            groups.append({"label": label, "chars": entries})
    return groups


def _parse_lookalikes(path: Path, todos: list[str]) -> list[dict]:
    """■字形辨別：內容在文字方塊裡的表格，3 列結構：數字列／字列／例詞列
    （「：詞、詞」）。表格結構跟預期不同就略過該表並記 todo，不硬湊。"""
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml")
    root = etree.fromstring(xml)
    groups: list[dict] = []
    for box in root.findall(".//w:txbxContent", NS):
        tbl = box.find(".//w:tbl", NS)
        if tbl is None:
            continue
        rows = tbl.findall("w:tr", NS)
        if len(rows) != 3:
            continue
        cell_texts = [
            ["".join(t.text or "" for t in c.findall(".//w:t", NS)) for c in row.findall("w:tc", NS)]
            for row in rows
        ]
        num_row, char_row, def_row = cell_texts
        groups.extend(parse_lookalike_grid(num_row, char_row, def_row, todos))
    if not groups:
        todos.append("字形辨別：未抽到任何形似字組（文字方塊結構與預期不同或本課無此段）")
    return groups


def extract(work: Path, lesson_no: int) -> dict:
    path = find_converted_docx(work, lesson_no)
    if path is None:
        return {
            "status": "missing",
            "source": f"dabutie:05形音輕鬆學（work/converted/L{lesson_no:02d}-形音輕鬆學.docx 不存在，先跑 convert_doc.py）",
            "words": [], "polysemy_groups": [], "polyphones": [], "lookalikes": [],
            "todos": [f"05形音輕鬆學：第{lesson_no}課尚未轉檔，請先跑 convert_doc.py"],
        }

    paragraphs = read_docx_paragraphs(path)
    sections = _split_sections(paragraphs)
    todos: list[str] = []
    source = f"dabutie:05形音輕鬆學（{path.name}，語詞解釋）"

    words = _parse_words(sections.get("語詞解釋", []))
    if not words:
        todos.append("05形音輕鬆學：■語詞解釋段落抽到 0 筆，請確認段落標題文字是否一致")

    readings_by_char = _parse_polyphones(sections.get("認識多音字", []))
    polyphones = [
        {"char": char, "readings": readings}
        for char, readings in readings_by_char.items()
    ]

    zhengyi_lines = sections.get("字義辨正", [])
    zhengyi_groups = _parse_polysemy_groups(zhengyi_lines)
    floaters = _small_floater_chars(path) if zhengyi_groups else {}
    resolved_chars = _resolve_polysemy_chars(zhengyi_groups, floaters, exclude_chars=set(readings_by_char.keys()))
    polysemy_groups = []
    for group, char in zip(zhengyi_groups, resolved_chars):
        if char is None:
            todos.append(f"字義辨正：有一組義項（{[s['definition'] for s in group['senses']]}）配不出對應的字（文字方塊探測失敗或有歧義），未列入 polysemy_senses")
            continue
        polysemy_groups.append({"char": char, "senses": group["senses"]})

    lookalikes = _parse_lookalikes(path, todos)

    return {
        "status": "ready" if words else "todo",
        "source": source,
        "words": words,
        "polysemy_groups": polysemy_groups,
        "polyphones": polyphones,
        "lookalikes": lookalikes,
        "todos": todos,
    }
