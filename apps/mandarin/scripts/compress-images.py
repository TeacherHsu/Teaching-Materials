"""將教材圖片轉成適合 GitHub Pages 的 WebP。

用法：
  python scripts/compress-images.py public/assets/115AG3H/lesson03

原始檔不會被刪除；腳本會在同一資料夾產生同檔名的 .webp，
並逐步降低品質直到檔案不超過 --max-kb（預設 300 KiB）。
"""

from __future__ import annotations

import argparse
from io import BytesIO
from pathlib import Path

from PIL import Image


def encode_webp(image: Image.Image, max_bytes: int) -> tuple[bytes, int]:
    mode = "RGBA" if "A" in image.getbands() else "RGB"
    converted = image.convert(mode)
    for quality in (82, 78, 74, 70, 66, 62, 58):
        buffer = BytesIO()
        converted.save(buffer, format="WEBP", quality=quality, method=6)
        encoded = buffer.getvalue()
        if len(encoded) <= max_bytes or quality == 58:
            return encoded, quality
    raise RuntimeError("WebP 編碼失敗")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path, help="要處理的圖片資料夾")
    parser.add_argument("--max-kb", type=int, default=300, help="單張圖片上限，預設 300 KiB")
    args = parser.parse_args()

    sources = sorted(
        path
        for path in args.root.rglob("*")
        if path.is_file() and path.suffix.lower() in {".png", ".jpg", ".jpeg", ".gif"}
    )
    if not sources:
        raise SystemExit(f"找不到可轉換的 PNG/JPEG/GIF：{args.root}")

    max_bytes = args.max_kb * 1024
    for source in sources:
        with Image.open(source) as image:
            encoded, quality = encode_webp(image, max_bytes)
        target = source.with_suffix(".webp")
        target.write_bytes(encoded)
        print(f"[OK] {source.name} → {target.name}：{len(encoded) / 1024:.1f} KiB，quality={quality}")


if __name__ == "__main__":
    main()
