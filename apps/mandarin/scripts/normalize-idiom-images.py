"""把各年級成語圖統一成不裁切的 960x960 WebP 縮圖。

既有圖片不覆寫；非 960x960 的來源另存為 ``-fit.webp``，以 960x960 暖白畫布
置中完整容納原圖，再回寫 lesson JSON。這樣直式、橫式或較小正方形來源都不會
因教材正方形圖片框而遺失視覺線索。
"""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

from PIL import Image, ImageOps


MAX_BYTES = 300 * 1024
TARGET_SIZE = (960, 960)
BACKGROUND = (255, 253, 249)

SCRIPT_DIR = Path(__file__).resolve().parent
APP_ROOT = SCRIPT_DIR.parent
DATA_ROOT = APP_ROOT / "public" / "data"
ASSET_ROOT = APP_ROOT / "public" / "assets"


def encode_webp(image: Image.Image, target: Path) -> int:
    # 80 起步仍保留教材可辨識度，同時讓單課總量有足夠餘裕；單張上限仍是 300 KiB。
    for quality in range(80, 35, -4):
        temp = target.with_suffix(".tmp.webp")
        image.save(temp, format="WEBP", quality=quality, method=6)
        size = temp.stat().st_size
        if size <= MAX_BYTES:
            temp.replace(target)
            return size
    raise RuntimeError(f"WebP 無法壓到 300 KiB 以下：{target}")


def fit_to_square(source: Image.Image) -> Image.Image:
    source = source.convert("RGBA")
    fitted = ImageOps.contain(source, TARGET_SIZE, method=Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", TARGET_SIZE, BACKGROUND + (255,))
    left = (TARGET_SIZE[0] - fitted.width) // 2
    top = (TARGET_SIZE[1] - fitted.height) // 2
    canvas.alpha_composite(fitted, (left, top))
    return canvas.convert("RGB")


def iter_lesson_files():
    for volume_dir in sorted(DATA_ROOT.iterdir()):
        if not volume_dir.is_dir():
            continue
        for data_path in sorted(volume_dir.glob("lesson*.json")):
            if data_path.stem[6:].isdigit():
                yield data_path


def normalize_lesson(data_path: Path) -> tuple[str, int, int]:
    data = json.loads(data_path.read_text(encoding="utf-8"))
    volume = data.get("volume", {}).get("code", data_path.parent.name)
    lesson_no = int(data_path.stem[6:])
    changed = 0
    checked = 0

    for item in data.get("idioms") or []:
        image = item.get("image")
        if not image:
            continue
        checked += 1
        source = ASSET_ROOT / volume / f"lesson{lesson_no:02d}" / image
        if not source.is_file():
            raise FileNotFoundError(f"找不到成語圖片：{source}")

        with Image.open(source) as source_image:
            source_size = source_image.size

        if source_size == TARGET_SIZE and not image.endswith("-fit.webp"):
            item["image_layout"] = "square-native"
            continue

        source_stem = Path(image).stem
        target_name = f"{source_stem}-fit.webp" if not source_stem.endswith("-fit") else f"{source_stem}.webp"
        target = source.with_name(target_name)
        with Image.open(source) as source_image:
            fitted = fit_to_square(source_image)
        encode_webp(fitted, target)
        item["image"] = f"idioms/{target.name}"
        item["image_layout"] = "square-contain"
        item["image_layout_origin"] = "workflow:960x960-contain"
        changed += 1

    if changed or any(item.get("image_layout") for item in data.get("idioms") or []):
        data_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return volume, checked, changed


def main() -> None:
    totals = Counter()
    for data_path in iter_lesson_files():
        volume, checked, changed = normalize_lesson(data_path)
        totals[(volume, "checked")] += checked
        totals[(volume, "changed")] += changed
    for volume in sorted({key[0] for key in totals}):
        print(json.dumps({
            "volume": volume,
            "idioms": totals[(volume, "checked")],
            "normalized": totals[(volume, "changed")],
        }, ensure_ascii=False))


if __name__ == "__main__":
    main()
