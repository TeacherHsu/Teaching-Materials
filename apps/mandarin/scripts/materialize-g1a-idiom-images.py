"""裁切 G1A 成語接觸表，輸出符合公開工作流的 WebP 成語圖。

接觸表留在私有 worksheet-batches；公開 repo 只保存裁切後的 960x960 WebP
與 lesson JSON 內的相對圖片路徑。此工具不把私有來源路徑寫入公開資料。
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


MAX_BYTES = 300 * 1024
TARGET_SIZE = (960, 960)
SOURCE_ORIGIN = "generated:imagegen-contact-sheet-crop"
SAFE_REFRAME_ORIGIN = "generated:imagegen-safe-reframe"

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[2]
WORKSPACE_ROOT = REPO_ROOT.parent
PRIVATE_ROOT = WORKSPACE_ROOT / "worksheet-batches" / "115" / "115G1A_國語 翰"
SHEET_ROOT = PRIVATE_ROOT / "04_內容資料與草案" / "idiom-images" / "g1a" / "contact-sheets"
REPLACEMENT_ROOT = PRIVATE_ROOT / "04_內容資料與草案" / "idiom-images" / "g1a" / "replacements"
PUBLIC_DATA_ROOT = REPO_ROOT / "apps" / "mandarin" / "public" / "data" / "115AG1H"
PUBLIC_ASSET_ROOT = REPO_ROOT / "apps" / "mandarin" / "public" / "assets" / "115AG1H"

SHEETS = {
    1: ("L01_contact_sheet.png", 3, 2),
    2: ("L02_contact_sheet.png", 3, 2),
    3: ("L03_contact_sheet.png", 3, 2),
    4: ("L04_contact_sheet.png", 4, 2),
    5: ("L05_contact_sheet.png", 3, 2),
    6: ("L06_contact_sheet.png", 3, 2),
    7: ("L07_contact_sheet.png", 3, 2),
}


def encode_webp(image: Image.Image, target: Path) -> int:
    """以最高可接受品質輸出 WebP，硬性控制在 300 KiB 內。"""
    for quality in range(92, 39, -4):
        temp = target.with_suffix(".tmp.webp")
        image.save(temp, format="WEBP", quality=quality, method=6)
        size = temp.stat().st_size
        if size <= MAX_BYTES:
            temp.replace(target)
            return size
    raise RuntimeError(f"WebP 無法壓到 300 KiB 以下：{target}")


def crop_panel(sheet: Image.Image, row: int, col: int, rows: int, cols: int) -> Image.Image:
    width, height = sheet.size
    cell_width = width / cols
    cell_height = height / rows
    gutter = max(6, round(min(cell_width, cell_height) * 0.018))
    left = round(col * cell_width) + gutter
    top = round(row * cell_height) + gutter
    right = round((col + 1) * cell_width) - gutter
    bottom = round((row + 1) * cell_height) - gutter
    panel = sheet.crop((left, top, right, bottom)).convert("RGB")

    side = min(panel.size)
    left = (panel.width - side) // 2
    top = (panel.height - side) // 2
    panel = panel.crop((left, top, left + side, top + side))
    return panel.resize(TARGET_SIZE, Image.Resampling.LANCZOS)


def replacement_for(lesson_no: int, index: int) -> Path | None:
    """回傳需要人工安全構圖的私有替代來源；找不到時沿用接觸表裁切。"""
    replacement = REPLACEMENT_ROOT / f"L{lesson_no:02d}_{index + 1:02d}_聞雞起舞.png"
    return replacement if replacement.is_file() else None


def materialize_lesson(lesson_no: int) -> dict:
    sheet_name, cols, rows = SHEETS[lesson_no]
    sheet_path = SHEET_ROOT / sheet_name
    if not sheet_path.is_file():
        raise FileNotFoundError(f"找不到私有成語接觸表：{sheet_path}")

    data_path = PUBLIC_DATA_ROOT / f"lesson{lesson_no:02d}.json"
    data = json.loads(data_path.read_text(encoding="utf-8"))
    idioms = data.get("idioms") or []
    if len(idioms) > rows * cols:
        raise ValueError(f"L{lesson_no:02d} 成語數量超過接觸表格數：{len(idioms)} > {rows * cols}")

    output_dir = PUBLIC_ASSET_ROOT / f"lesson{lesson_no:02d}" / "idioms"
    output_dir.mkdir(parents=True, exist_ok=True)
    with Image.open(sheet_path) as source_sheet:
        sheet = source_sheet.convert("RGB")
        sizes = []
        for index, item in enumerate(idioms):
            idiom = item["idiom"]
            row, col = divmod(index, cols)
            target = output_dir / f"{index + 1:02d}_{idiom}.webp"
            replacement = replacement_for(lesson_no, index)
            if replacement:
                with Image.open(replacement) as replacement_image:
                    panel = replacement_image.convert("RGB").resize(TARGET_SIZE, Image.Resampling.LANCZOS)
                origin = SAFE_REFRAME_ORIGIN
            else:
                panel = crop_panel(sheet, row, col, rows, cols)
                origin = SOURCE_ORIGIN
            size = encode_webp(panel, target)
            sizes.append(size)
            item["image"] = f"idioms/{target.name}"
            item["image_origin"] = origin
            item["image_layout"] = "square-native"

    data_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return {
        "lesson": f"L{lesson_no:02d}",
        "idioms": len(idioms),
        "size": "960x960",
        "max_bytes": max(sizes, default=0),
        "output": str(output_dir),
    }


if __name__ == "__main__":
    results = [materialize_lesson(lesson_no) for lesson_no in range(1, 8)]
    print(json.dumps({"source": str(SHEET_ROOT), "results": results}, ensure_ascii=False, indent=2))
