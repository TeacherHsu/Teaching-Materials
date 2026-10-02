#!/usr/bin/env python3
"""把 Reading-Tool 的明碼課文加密成公開站可放的密文。

為什麼要加密（不是只擋 UI）：
    舊的 Chinese/Reading-Tool 用 access-config.js 存密碼的 SHA-256 雜湊，
    比對過了才顯示畫面——但 lessons/*.json 是明碼放在公開 GitHub Pages 上，
    任何人直接開 .../lessons/115HG2A01.json 就拿到整篇課文。
    這牴觸 sped-os ADR-0034「課文全文不放公開 repo」。
    改成 AES-GCM 後，伺服器上永遠只有密文，密碼不對就只是解密失敗。

明碼正本在 ~/mandarin-work/reading-tool-lessons/（不進 repo）。
要改課文請改那裡，然後重跑本程式。

用法：
    python3 tools/encrypt_readings.py --password 078451
    python3 tools/encrypt_readings.py --password 078451 --src ~/mandarin-work/reading-tool-lessons

輸出：public/data/readings.enc.json
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import re
import sys
from pathlib import Path

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# 迭代次數：iPad Safari 上 PBKDF2 是同步阻塞的，太高會卡住畫面。
# 210000 在 iPad 第 9 代約 0.4 秒，是 OWASP 2023 對 PBKDF2-SHA256 的建議值。
ITERATIONS = 210_000
HAN = re.compile(r"[㐀-鿿]")
DEFAULT_SRC = Path.home() / "mandarin-work" / "reading-tool-lessons"

# Reading-Tool 的課次代號和課文樂園的不一樣，出版社字母與學期字母互換位置：
#   Reading-Tool   115HG2A01  = 115 + 翰H + G2 + 上A + 01
#   課文樂園        115AG2H01  = 115 + 上A + G2 + 翰H + 01
# 密文一律改用**課文樂園的 lesson_id** 當 key，前端就不必在執行期做字串轉換。
READING_ID = re.compile(r"^(?P<year>\d{3})(?P<pub>[A-Z])G(?P<grade>\d)(?P<term>[A-Z])(?P<no>\d{2})$")


def to_park_id(reading_id: str) -> str | None:
    """115HG2A01 → 115AG2H01；對不上格式時回 None。"""
    m = READING_ID.match(reading_id)
    if not m:
        return None
    g = m.groupdict()
    return f"{g['year']}{g['term']}G{g['grade']}{g['pub']}{g['no']}"


def park_lesson_ids(index_path: Path) -> set[str]:
    """course-index.json 裡登記的所有 lesson_id。"""
    index = json.loads(index_path.read_text(encoding="utf-8"))
    out: set[str] = set()
    for grade in index.get("grades", []):
        for volume in grade.get("volumes", []):
            for unit in volume.get("units", []):
                for lesson in unit.get("lessons", []):
                    if lesson.get("lesson_id"):
                        out.add(lesson["lesson_id"])
    return out


class AlignmentError(Exception):
    """overrides 的 index 和課文對不上——資料壞了，寧可整批失敗也不要產出錯注音。"""


def tokenise(text: str, overrides: dict, gaps: list[str] | None = None) -> list[list[list[list]]]:
    """把 "|我的心情。|\\n|害怕的時候|，" 轉成 [段][行][詞] 三層結構。

    為什麼要保留「行」：課文裡有詩歌（例如三上〈我的心情〉是分行的），
    把一段裡的換行吃掉會讓詩變成散文。段落之間用空行分隔。

    每個詞是 [文字, "注音 注音 ...", 朗讀用字]，和點讀單位對齊：
      - 文字：這個詞的字（含黏在詞後的標點）
      - 注音：以空白分隔，和文字逐字對應；標點的位置給空字串
      - 朗讀用字：教師裁定的讀音覆寫（phoneChar），沒有覆寫時為 None

    `|` 是詞邊界標記，不進畫面——但**它在原始 text 裡佔一個字元位置，而
    overrides 的 key 是數進原始 text 的位置**，所以掃描時每個字元（含 `|`
    和 `\\n`）都必須推進 idx。這裡曾經因為跳過 `|` 而讓整份注音錯一格，
    所以下面用 overrides[idx]["char"] 逐字驗證對位。
    """
    paragraphs: list[list[list[list]]] = []
    current: list[list[list]] = []
    line: list[list] = []
    word, zhuyins, says, dirty = "", [], "", False

    def flush_word() -> None:
        nonlocal word, zhuyins, says, dirty
        if word:
            line.append([word, " ".join(zhuyins), says if dirty else None])
        word, zhuyins, says, dirty = "", [], "", False

    def flush_line() -> None:
        nonlocal line
        flush_word()
        if line:
            current.append(line)
        line = []

    def flush_para() -> None:
        nonlocal current
        flush_line()
        if current:
            paragraphs.append(current)
        current = []

    blank_run = 0
    for idx, ch in enumerate(text):
        if ch == "\n":
            blank_run += 1
            # 連續兩個換行＝段落界線；單一換行只是行界線。
            flush_para() if blank_run >= 2 else flush_line()
            continue
        blank_run = 0
        if ch == "|":
            flush_word()
            continue
        if ch.isspace():
            continue

        ov = overrides.get(str(idx)) or {}
        if ov and ov.get("char") and ov["char"] != ch:
            raise AlignmentError(
                f"位置 {idx} 對不上：課文是「{ch}」，overrides 說是「{ov['char']}」"
            )
        if HAN.match(ch) and not ov.get("zhuyin"):
            # 不硬失敗：這個字只是會少注音，照樣能點讀。已知 2026-10-01 有 7 個
            # 這種字，全部都是「盡」的後一字（Reading-Tool 多音規則的 off-by-one）。
            if gaps is not None:
                gaps.append(f"位置 {idx}「{ch}」（…{text[max(0, idx - 6):idx + 6]}…）")

        word += ch
        zhuyins.append(ov.get("zhuyin", "") if HAN.match(ch) else "")
        phone = ov.get("phoneChar")
        if phone and phone != ch:
            dirty = True
        says += phone if phone else ch

    flush_para()
    return paragraphs


def build_payload(src: Path, known: set[str] | None = None) -> dict:
    out: dict[str, dict] = {}
    all_gaps: list[tuple[str, list[str]]] = []
    unmatched: list[str] = []
    for path in sorted(src.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        reading_id = data.get("lesson_id") or path.stem
        lesson_id = to_park_id(reading_id)
        if not lesson_id:
            print(f"  ! {reading_id}：代號不符格式，跳過", file=sys.stderr)
            continue
        if known is not None and lesson_id not in known:
            # 有課文但課文樂園沒有這一課（例如 Reading-Tool 的 G0 學前教材）。
            # 不是錯誤，但要講出來，不然會以為有收進去。
            unmatched.append(f"{reading_id} → {lesson_id}")
            continue
        text, overrides = data.get("text", ""), data.get("overrides", {}) or {}
        if not text:
            print(f"  ! {path.name}：沒有 text，跳過", file=sys.stderr)
            continue
        gaps: list[str] = []
        try:
            paras = tokenise(text, overrides, gaps)
        except AlignmentError as err:
            print(f"  ✗ {lesson_id}：{err}", file=sys.stderr)
            raise
        if gaps:
            all_gaps.append((lesson_id, gaps))
        out[lesson_id] = {"title": data.get("title", ""), "paras": paras}
        paras = out[lesson_id]["paras"]
        print(f"  · {reading_id} → {lesson_id}  {len(paras)} 段 / {sum(len(p) for p in paras)} 行")

    if unmatched:
        print(f"\n⚠ {len(unmatched)} 課有課文，但 course-index.json 沒有登記，未收進密文：", file=sys.stderr)
        for u in unmatched:
            print(f"    {u}", file=sys.stderr)
    if known is not None:
        no_reading = sorted(known - set(out))
        if no_reading:
            print(f"\n· {len(no_reading)} 課沒有課文（點讀入口會顯示為沒有課文）：", file=sys.stderr)
            print(f"    {', '.join(no_reading[:10])}{' …' if len(no_reading) > 10 else ''}", file=sys.stderr)

    if all_gaps:
        total = sum(len(g) for _, g in all_gaps)
        print(f"\n⚠ {total} 個漢字缺注音（{len(all_gaps)} 課），這些字會沒有注音但仍可點讀：", file=sys.stderr)
        for lesson_id, gaps in all_gaps:
            for g in gaps:
                print(f"    {lesson_id}  {g}", file=sys.stderr)
        print("  → 源頭在 Chinese/Reading-Tool 的多音規則，請在 mandarin-work 修正後重跑。", file=sys.stderr)
    return out


def char_readings(payload: dict) -> dict:
    """字 → 讀音清單。朗讀挑戰要判「同音字算對」，就得知道辨識出來的字怎麼念。

    這份**不加密**：內容只有「字」和「注音」，沒有課文的任何一句話，
    不涉及出版社教材的版權。加密的是課文，不是字音。
    """
    out: dict[str, list[str]] = {}
    for lesson in payload.values():
        for para in lesson["paras"]:
            for line in para:
                for text, zhuyin, _say in line:
                    zs = zhuyin.split(" ")
                    for i, ch in enumerate(text):
                        z = zs[i] if i < len(zs) else ""
                        if not z or not HAN.match(ch):
                            continue
                        out.setdefault(ch, [])
                        if z not in out[ch]:
                            out[ch].append(z)
    return dict(sorted(out.items()))


def merge_char_index(readings: dict, index_path: Path) -> dict:
    """併入既有的 char-index.json（五冊生字與語詞的字音統計），擴大覆蓋率。"""
    if not index_path.is_file():
        return readings
    data = json.loads(index_path.read_text(encoding="utf-8"))
    for ch, info in (data.get("chars") or {}).items():
        for z in info.get("z", []):
            readings.setdefault(ch, [])
            if z not in readings[ch]:
                readings[ch].append(z)
    return dict(sorted(readings.items()))


def encrypt(payload: dict, password: str) -> dict:
    salt, nonce = os.urandom(16), os.urandom(12)
    key = PBKDF2HMAC(
        algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITERATIONS
    ).derive(password.encode("utf-8"))
    blob = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return {
        "v": 1,
        "kdf": "PBKDF2-SHA256",
        "iter": ITERATIONS,
        "salt": base64.b64encode(salt).decode(),
        "iv": base64.b64encode(nonce).decode(),
        "lessons": sorted(payload),
        "data": base64.b64encode(AESGCM(key).encrypt(nonce, blob, None)).decode(),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="把課文全文加密成公開站可放的密文")
    ap.add_argument("--password", required=True, help="教室密碼")
    ap.add_argument("--src", type=Path, default=DEFAULT_SRC, help=f"明碼課文目錄（預設 {DEFAULT_SRC}）")
    ap.add_argument(
        "--index",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "public" / "data" / "course-index.json",
        help="course-index.json，用來核對課次代號",
    )
    ap.add_argument(
        "--readings-out",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "public" / "data" / "_index" / "char-readings.json",
        help="字→讀音索引（明碼，朗讀挑戰判同音字用）",
    )
    ap.add_argument(
        "--skip",
        nargs="*",
        default=[],
        metavar="LESSON_ID",
        help=(
            "不要加密的課次（Reading-Tool 代號或課文樂園代號都收）。"
            "用在課文檔抓錯版本時：寧可讓點讀／朗讀入口整個不出現，"
            "也不要讓學生讀到掛著這一課課名的別篇課文。"
        ),
    )
    ap.add_argument(
        "--out",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "public" / "data" / "readings.enc.json",
    )
    args = ap.parse_args()

    if not args.src.is_dir():
        print(f"找不到明碼課文目錄：{args.src}", file=sys.stderr)
        print("這台電腦沒有 ~/mandarin-work/，不要在這裡跑加密器。", file=sys.stderr)
        return 1

    known = None
    if args.index.is_file():
        known = park_lesson_ids(args.index)
        print(f"course-index 登記了 {len(known)} 課")
    else:
        print(f"⚠ 找不到 {args.index}，不核對課次代號", file=sys.stderr)

    print(f"讀取 {args.src}")
    payload = build_payload(args.src, known)
    for raw in args.skip:
        for candidate in (raw, to_park_id(raw)):
            if candidate in payload:
                payload.pop(candidate)
                print(f"⏭  略過 {candidate}（--skip {raw}）")
                break
        else:
            print(f"⚠ --skip {raw} 在課文目錄裡找不到，沒有略過任何課次", file=sys.stderr)
    if not payload:
        print("沒有任何課文可加密。", file=sys.stderr)
        return 1

    # 字→讀音索引（明碼）
    readings = merge_char_index(
        char_readings(payload),
        args.index.parent / "_index" / "char-index.json",
    )
    args.readings_out.parent.mkdir(parents=True, exist_ok=True)
    args.readings_out.write_text(
        json.dumps({"v": 1, "count": len(readings), "chars": readings}, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"字→讀音索引：{len(readings)} 字 → {args.readings_out}")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(
        json.dumps(encrypt(payload, args.password), ensure_ascii=False, indent=0),
        encoding="utf-8",
    )
    print(f"\n✅ {len(payload)} 課 → {args.out}  ({args.out.stat().st_size / 1024:.0f} KB)")
    print("   伺服器上只有密文；明碼留在 mandarin-work，不要 commit。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
