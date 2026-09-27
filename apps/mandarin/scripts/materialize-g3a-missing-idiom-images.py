"""將 G3A 第 7–12 課缺少的成語理解圖物化為公開 WebP。

生成原圖留在私有 worksheet-batches；公開 repo 只保存由私有 PNG 轉出的
960×960 WebP 與 lesson JSON 的相對路徑。這支工具會核對課次與成語順序，
避免把圖片配到錯誤的成語，也不會把私有絕對路徑寫入 JSON。
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageOps


MAX_BYTES = 300 * 1024
TARGET_SIZE = (960, 960)
BACKGROUND = (255, 253, 249)
SOURCE_ORIGIN = "generated:imagegen-idiom-meaning"

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[2]
WORKSPACE_ROOT = REPO_ROOT.parent
PRIVATE_ROOT = (
    WORKSPACE_ROOT
    / "worksheet-batches"
    / "115"
    / "115G3A_國語 翰"
    / "04_內容資料與草案"
    / "idiom-images"
    / "missing-generated"
)
PUBLIC_DATA_ROOT = REPO_ROOT / "apps" / "mandarin" / "public" / "data" / "115AG3H"
PUBLIC_ASSET_ROOT = REPO_ROOT / "apps" / "mandarin" / "public" / "assets" / "115AG3H"


def encode_webp(image: Image.Image, target: Path) -> int:
    """以最高可接受品質輸出 WebP，硬性控制在 300 KiB 內。"""
    for quality in range(80, 35, -4):
        temp = target.with_suffix(".tmp.webp")
        image.save(temp, format="WEBP", quality=quality, method=6)
        size = temp.stat().st_size
        if size <= MAX_BYTES:
            temp.replace(target)
            return size
    raise RuntimeError(f"WebP 無法壓到 300 KiB 以下：{target}")


def fit_to_square(source: Image.Image) -> Image.Image:
    """完整容納圖片到暖白 960×960 畫布，不用 cover 裁切。"""
    source = source.convert("RGBA")
    fitted = ImageOps.contain(source, TARGET_SIZE, method=Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", TARGET_SIZE, BACKGROUND + (255,))
    left = (TARGET_SIZE[0] - fitted.width) // 2
    top = (TARGET_SIZE[1] - fitted.height) // 2
    canvas.alpha_composite(fitted, (left, top))
    return canvas.convert("RGB")


def materialize_lesson(lesson_no: int) -> dict[str, object]:
    data_path = PUBLIC_DATA_ROOT / f"lesson{lesson_no:02d}.json"
    data = json.loads(data_path.read_text(encoding="utf-8"))
    if data.get("volume", {}).get("code") != "115AG3H":
        raise ValueError(f"不是 G3A 課次：{data_path}")

    idioms = data.get("idioms") or []
    if not idioms:
        raise ValueError(f"課次沒有成語資料：{data_path}")

    output_dir = PUBLIC_ASSET_ROOT / f"lesson{lesson_no:02d}" / "idioms"
    output_dir.mkdir(parents=True, exist_ok=True)
    sizes: list[int] = []

    for index, item in enumerate(idioms, start=1):
        idiom = item.get("idiom")
        if not idiom:
            raise ValueError(f"成語名稱缺漏：{data_path} index={index}")
        target = output_dir / f"{index:02d}_{idiom}.webp"
        if item.get("image"):
            if item["image"] != f"idioms/{target.name}" or not target.is_file():
                raise ValueError(f"已有圖片但不是本物化器產物：{data_path} {idiom}")
            sizes.append(target.stat().st_size)
            continue

        source = PRIVATE_ROOT / f"L{lesson_no:02d}_{index:02d}_{idiom}.png"
        if not source.is_file():
            raise FileNotFoundError(f"找不到私有生成圖：{source}")

        with Image.open(source) as source_image:
            fitted = fit_to_square(source_image)
        size = encode_webp(fitted, target)
        sizes.append(size)

        item["image"] = f"idioms/{target.name}"
        item["image_origin"] = SOURCE_ORIGIN
        item["image_layout"] = "square-contain"
        item["image_layout_origin"] = "workflow:960x960-contain"

    data_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return {
        "lesson": f"L{lesson_no:02d}",
        "idioms": len(idioms),
        "size": "960x960",
        "max_bytes": max(sizes),
        "output": str(output_dir),
    }


if __name__ == "__main__":
    results = [materialize_lesson(lesson_no) for lesson_no in range(7, 13)]
    print(json.dumps({"source": str(PRIVATE_ROOT), "results": results}, ensure_ascii=False, indent=2))
