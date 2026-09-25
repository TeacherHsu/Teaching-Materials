#!/usr/bin/env python3
"""05形音輕鬆學（.doc）轉 .docx：textutil/antiword 讀不出來（疑似內嵌 OLE 物件／
舊版 Word 格式），改用本機 Microsoft Word（AppleScript）另存 .docx。

用法：
  python3 tools/dabutie/convert_doc.py \\
      --src ~/mandarin-work/115AG3H/raw/大補帖 \\
      --work ~/mandarin-work/115AG3H \\
      --all
  python3 tools/dabutie/convert_doc.py --src ... --work ... --lesson 5

沒有 Microsoft Word 時明確報錯（非 0 exit），不靜默略過。
輸出：<work>/converted/L{NN}-形音輕鬆學.docx，已存在就略過（不重轉）。
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from common import SourceNotFoundError, resolve_path  # noqa: E402

SECTION_NAME = "05形音輕鬆學(含語詞解釋)"


def _word_is_available() -> bool:
    check = subprocess.run(
        ["osascript", "-e", 'id of application "Microsoft Word"'],
        capture_output=True, text=True,
    )
    return check.returncode == 0


def find_doc_files(src: Path) -> list[Path]:
    folder = resolve_path(src, "1.備課資料", SECTION_NAME, "WORD")
    docs = sorted(
        p for p in folder.iterdir()
        if p.is_file() and p.suffix.lower() == ".doc" and not p.name.startswith("~$") and not p.name.startswith("~WRL")
    )
    return docs


def lesson_no_of(path: Path) -> int | None:
    m = re.search(r"L0*([0-9]+)(?!\d)", path.name)
    return int(m.group(1)) if m else None


def convert_one(doc_path: Path, out_path: Path) -> None:
    """開 doc → 另存 docx → 關閉（不儲存原檔），清掉 Word 產生的 ~$ 鎖定暫存檔。
    `close document 1 saving no` 比 `close` 穩定：`close` 在部分 Word 版本對
    「另存新檔後的作用中文件」判斷已儲存與否會出錯而丟例外，但檔案其實已存好；
    改用 `saving no` 明確告訴 Word 不必再問、不必再存，避免這個假錯誤。"""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    # 來源檔常帶 com.apple.quarantine（zip 用 ditto 解壓時從封存繼承）：Word 開啟
    # 有這個屬性的檔案會進入「保護檢視」，AppleScript 的 save as 會卡死等待
    # 「啟用編輯」這個只能用滑鼠點的橫幅（無障礙輔助權限也點不到），必須先清掉
    # 這個屬性再開檔，否則整個轉檔會無聲卡住（曾實測卡滿 AppleEvent timeout）。
    subprocess.run(["xattr", "-d", "com.apple.quarantine", str(doc_path)], capture_output=True)
    script = f'''
    set srcPosix to POSIX file "{doc_path}"
    set outPosix to POSIX file "{out_path}"
    tell application "Microsoft Word"
        open srcPosix
        set theDoc to active document
        save as theDoc file name outPosix file format format document
        close theDoc saving no
    end tell
    '''
    try:
        result = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=60)
    except subprocess.TimeoutExpired:
        raise RuntimeError(
            f"AppleScript 轉檔逾時（60秒）：{doc_path.name}——通常代表 Word 卡在某個需要滑鼠點擊的\n"
            "對話框（例如保護檢視「啟用編輯」橫幅）。已先清過 com.apple.quarantine，若仍逾時，\n"
            "請手動在 Word 開一次這個檔案確認沒有殘留的相容性/字型替換對話框。"
        )
    if result.returncode != 0:
        raise RuntimeError(
            f"AppleScript 轉檔失敗：{doc_path.name}\nstdout={result.stdout}\nstderr={result.stderr}"
        )
    # 清掉 Word 開檔期間在來源資料夾產生的鎖定暫存檔（~$xxx.doc / ~WRLxxxx.tmp）
    lock1 = doc_path.parent / f"~${doc_path.name}"
    if lock1.exists():
        lock1.unlink()
    for tmp in doc_path.parent.glob("~WRL*.tmp"):
        tmp.unlink()
    if not out_path.exists():
        raise RuntimeError(f"轉檔後找不到輸出檔：{out_path}（AppleScript 回報成功但檔案未產生）")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, help="大補帖根目錄")
    ap.add_argument("--work", required=True)
    ap.add_argument("--lesson", type=int, help="只轉單一課")
    ap.add_argument("--all", action="store_true", help="轉全部找得到的課")
    ap.add_argument("--force", action="store_true", help="已存在也重轉")
    args = ap.parse_args()

    src = Path(args.src).expanduser()
    work = Path(args.work).expanduser()
    out_dir = work / "converted"

    if not _word_is_available():
        print(
            "[轉檔失敗] 找不到本機 Microsoft Word（AppleScript 無法取得 application id）。\n"
            "替代方案：\n"
            "  1. 手動在 Word 開啟 .doc 另存為 .docx 到 "
            f"{out_dir}/L{{NN}}-形音輕鬆學.docx；或\n"
            "  2. 安裝 LibreOffice 後改用 "
            "`soffice --headless --convert-to docx --outdir <out> <file>.doc`\n"
            "不可靜默跳過 05 來源。",
            file=sys.stderr,
        )
        sys.exit(2)

    try:
        docs = find_doc_files(src)
    except SourceNotFoundError as e:
        print(f"[轉檔失敗] {e}", file=sys.stderr)
        sys.exit(2)

    if args.lesson:
        docs = [d for d in docs if lesson_no_of(d) == args.lesson]
        if not docs:
            print(f"[轉檔失敗] 找不到第 {args.lesson} 課的 05 來源 .doc", file=sys.stderr)
            sys.exit(2)
    elif not args.all:
        print("[轉檔失敗] 請指定 --lesson N 或 --all", file=sys.stderr)
        sys.exit(2)

    converted, skipped = [], []
    for doc_path in docs:
        no = lesson_no_of(doc_path)
        if no is None:
            continue
        out_path = out_dir / f"L{no:02d}-形音輕鬆學.docx"
        if out_path.exists() and not args.force:
            skipped.append(out_path)
            continue
        convert_one(doc_path, out_path)
        converted.append(out_path)
        print(f"轉檔完成：{doc_path.name} → {out_path}")

    print(f"共轉檔 {len(converted)} 筆，略過（已存在）{len(skipped)} 筆")


if __name__ == "__main__":
    main()
