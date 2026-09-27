"""Materialize complete official G3A vocabulary with verified one-word art.

Private source manifests and generated illustrations remain in worksheet-batches.
Only rewritten meanings, course terms and compliant WebP derivatives are written
to the public lesson data and asset folders.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image


APP_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = APP_ROOT.parents[1]
WORKSPACE_ROOT = REPO_ROOT.parent
PRIVATE_BATCH = WORKSPACE_ROOT / "worksheet-batches" / "115" / "115G3A_國語 翰"
PRIVATE_CONTENT = PRIVATE_BATCH / "04_內容資料與草案" / "wordwall"
PRIVATE_SOURCE = PRIVATE_CONTENT / "source-manifests"
PRIVATE_IMAGES = PRIVATE_CONTENT / "image_quiz"
PUBLIC_DATA = APP_ROOT / "public" / "data" / "115AG3H"
PUBLIC_ASSETS = APP_ROOT / "public" / "assets" / "115AG3H"
MAX_IMAGE_BYTES = 300 * 1024
MAX_LESSON_IMAGE_BYTES = 4 * 1024 * 1024
OUTPUT_SIZE = (960, 960)

# The source extraction truncated the final definition. This concise paraphrase
# follows the official glossary and its example: a hermit crab uses an empty
# shell to protect its soft abdomen.
DEFINITION_OVERRIDES = {
    (8, "寄居蟹"): "一種會住進空螺殼、用殼保護柔軟腹部的螃蟹。",
}


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def make_webp(source: Path, target: Path) -> int:
    with Image.open(source) as raw:
        if raw.width != raw.height:
            raise ValueError(f"來源插圖不是正方形：{source.name} {raw.size}")
        image = raw.convert("RGB").resize(OUTPUT_SIZE, Image.Resampling.LANCZOS)

    quality = 84
    while quality >= 56:
        image.save(target, format="WEBP", quality=quality, method=6)
        size = target.stat().st_size
        if size <= MAX_IMAGE_BYTES:
            return size
        quality -= 4
    raise ValueError(f"WebP 無法壓至 300 KiB 以下：{target.name}")


def main() -> None:
    total_terms = 0
    total_images = 0
    for lesson_no in range(8, 13):
        key = f"L{lesson_no:02d}"
        source_manifest = read_json(PRIVATE_SOURCE / f"{key}_vocabulary_source.json")
        asset_manifest = read_json(PRIVATE_IMAGES / f"{key}_assets.json")
        if source_manifest.get("lesson") != key or asset_manifest.get("lesson") != key:
            raise ValueError(f"課次標記不符：{key}")

        assets_by_term = {item["term"]: item for item in asset_manifest.get("assets", [])}
        official_items = source_manifest.get("items", [])
        if not official_items:
            raise ValueError(f"官方詞表為空：{key}")
        if len(official_items) != len(assets_by_term):
            raise ValueError(f"詞表與逐詞插圖數量不一致：{key}")

        lesson_path = PUBLIC_DATA / f"lesson{lesson_no:02d}.json"
        lesson = read_json(lesson_path)
        lesson_id = lesson["lesson_id"]
        existing = lesson.get("words", [])
        existing_by_term = {item.get("word"): item for item in existing if item.get("word")}
        official_terms = {item["term"] for item in official_items}
        official_words = []
        asset_dir = PUBLIC_ASSETS / f"lesson{lesson_no:02d}" / "vocabulary"

        for index, source_item in enumerate(official_items, start=1):
            term = source_item["term"]
            asset = assets_by_term.get(term)
            if not asset:
                raise ValueError(f"找不到逐詞插圖：{key}:{term}")
            source_image = PRIVATE_IMAGES / asset["image"]
            if not source_image.is_file():
                raise FileNotFoundError(source_image)
            expected_hash = asset.get("sha256")
            if expected_hash and sha256(source_image) != expected_hash:
                raise ValueError(f"圖片雜湊不符：{key}:{term}")

            target_name = f"l{lesson_no:02d}-target-{index:02d}.webp"
            target_image = asset_dir / target_name
            target_image.parent.mkdir(parents=True, exist_ok=True)
            image_size = make_webp(source_image, target_image)
            total_images += 1

            old = existing_by_term.get(term, {})
            meaning = DEFINITION_OVERRIDES.get((lesson_no, term), source_item.get("definition", "")).strip()
            if not meaning:
                raise ValueError(f"缺少語詞解釋：{key}:{term}")
            official_words.append({
                **old,
                "id": f"word:{lesson_id}:{index:02d}",
                "word": term,
                "zhuyin": old.get("zhuyin"),
                "meaning": meaning,
                "example_sentence": old.get("example_sentence"),
                "example_status": old.get("example_status", "todo_rewrite"),
                "level": old.get("level", "challenge" if len(term) >= 4 else "basic"),
                "image": f"/assets/115AG3H/lesson{lesson_no:02d}/vocabulary/{target_name}",
                "status": "ready",
                "source": "115G3A／翰林官方教材（05形音輕鬆學：語詞解釋；逐詞配圖採既有核對素材）",
            })
            if image_size > MAX_IMAGE_BYTES:
                raise ValueError(f"單張圖片超過 300 KiB：{target_image}")

        # Keep prior non-duplicate words as optional extension cards. Their
        # source and artwork stay intact; the complete official list comes first.
        supplementary = [item for item in existing if item.get("word") not in official_terms]
        for offset, item in enumerate(supplementary, start=len(official_words) + 1):
            item["id"] = f"word:{lesson_id}:{offset:02d}"
            item["level"] = item.get("level") or "challenge"
        lesson["words"] = official_words + supplementary

        lesson_image_bytes = sum(item.stat().st_size for item in asset_dir.glob("*.webp") if item.is_file())
        if lesson_image_bytes > MAX_LESSON_IMAGE_BYTES:
            raise ValueError(f"課次圖片總量超過 4 MiB：{key} ({lesson_image_bytes} bytes)")
        write_json(lesson_path, lesson)
        total_terms += len(official_words)
        print(f"{key}: 官方詞目 {len(official_words)} 筆，補充詞卡 {len(supplementary)} 筆，插圖 {len(official_words)} 張；圖片總量 {lesson_image_bytes:,} bytes")

    print(f"完成：{total_terms} 個官方詞目、{total_images} 張方形 WebP 插圖。")


if __name__ == "__main__":
    main()
