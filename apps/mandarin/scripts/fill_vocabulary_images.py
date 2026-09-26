#!/usr/bin/env python3
"""Fill missing vocabulary-card images from reviewed sources or generated files.

The source workspace is private.  This script writes only compressed WebP
assets and their public ``image`` paths into lesson JSON.  A generated-manifest
JSON can be supplied for words that have no reviewed legacy illustration:

    [{"lesson_id": "115AG6H01", "word": "搖晃", "source": "C:/...png"}]

Reviewed source images are preferred automatically.  The candidate ranking
prefers same-lesson vocabulary/illustration assets, then same-lesson reading
assets, and never guesses from unrelated public assets.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from generate_lessons import compress_webp


IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp"}


def load_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def parse_codes(value: str) -> set[str]:
    return {item.strip() for item in value.split(",") if item.strip()}


def lesson_number(lesson_id: str) -> int:
    match = re.search(r"(\d+)$", lesson_id)
    if not match:
        raise ValueError(f"無法從課次 ID 解析課號：{lesson_id}")
    return int(match.group(1))


def course_code(lesson_id: str) -> str:
    match = re.match(r"^(\d{3}AG\d[HK])", lesson_id)
    if not match:
        raise ValueError(f"無法從課次 ID 解析冊別代碼：{lesson_id}")
    return match.group(1)


def source_roots(source_root: Path, code: str) -> list[Path]:
    match = re.search(r"AG(\d)([HK])$", code)
    if not match:
        return []
    grade_no, publisher_code = match.groups()
    publisher = "翰" if publisher_code == "H" else "康"
    batch = source_root / "worksheet-batches" / "115" / f"115G{grade_no}A_國語 {publisher}"
    return [batch]


def image_inventory(source_root: Path, codes: set[str]) -> list[Path]:
    files: list[Path] = []
    for code in codes:
        for root in source_roots(source_root, code):
            if root.exists():
                files.extend(path for path in root.rglob("*") if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES)
    return files


def candidate_score(path: Path, lesson_no: int, word: str) -> int:
    stem = path.stem
    score = 0
    if word == stem or stem.endswith("_" + word):
        score += 1000
    elif word in stem:
        score += 500
    lesson_token = f"L{lesson_no:02d}"
    if lesson_token in str(path):
        score += 250
    if "語詞解釋" in str(path) or "語詞插圖" in str(path):
        score += 180
    if "段落大意" in str(path):
        score += 120
    if "成語" in str(path):
        score -= 160
    if "cropped" in str(path):
        score -= 20
    return score


def find_reviewed_source(files: list[Path], lesson_no: int, word: str) -> Path | None:
    # Only accept a filename component that is exactly the target word.  A
    # filename such as ``01_鹹味蔚藍回航.png`` is a composite preview, not a
    # safe illustration for any one of the three vocabulary items.
    matches = [
        path
        for path in files
        if word in re.split(r"[_\-\s]+", path.stem)
    ]
    if not matches:
        return None
    return max(matches, key=lambda path: (candidate_score(path, lesson_no, word), str(path)))


def public_asset_path(repo_root: Path, target: Path) -> str:
    return "/assets/" + target.relative_to(repo_root / "public" / "assets").as_posix()


def main() -> int:
    parser = argparse.ArgumentParser(description="補齊語詞解釋卡缺圖並壓縮為 WebP。")
    parser.add_argument("--source-root", type=Path, required=True, help="含私有 worksheet-batches 的工作區。")
    parser.add_argument("--repo-root", type=Path, required=True, help="apps/mandarin 目錄。")
    parser.add_argument("--codes", default="115AG3H,115AG4K,115AG6H", help="要檢查的冊別代碼，以逗號分隔。")
    parser.add_argument("--generated-manifest", type=Path, help="生成圖片對照 JSON。")
    parser.add_argument("--refresh", action="store_true", help="重新依來源優先序回寫既有圖片。")
    args = parser.parse_args()

    repo_root = args.repo_root.resolve()
    codes = parse_codes(args.codes)
    generated: dict[tuple[str, str], Path] = {}
    if args.generated_manifest:
        payload = load_json(args.generated_manifest)
        for item in payload:
            key = (str(item["lesson_id"]), str(item["word"]))
            generated[key] = Path(str(item["source"])).expanduser().resolve()

    inventory = image_inventory(args.source_root.resolve(), codes)
    changed = 0
    reused = 0
    generated_count = 0
    unresolved: list[str] = []
    data_root = repo_root / "public" / "data"
    for data_path in sorted(data_root.glob("*/lesson*.json")):
        lesson = load_json(data_path)
        lesson_id = str(lesson.get("lesson_id") or "")
        code = course_code(lesson_id) if lesson_id else ""
        if not code or code not in codes:
            continue
        lesson_no = lesson_number(lesson_id)
        asset_root = repo_root / "public" / "assets" / code / f"lesson{lesson_no:02d}" / "vocabulary"
        for index, item in enumerate(lesson.get("words", []), start=1):
            word = str(item.get("word") or "").strip()
            if not word:
                continue
            existing = item.get("image")
            existing_path = repo_root / "public" / existing.lstrip("/") if existing else None
            if not args.refresh and existing and existing_path and existing_path.exists():
                continue
            # 舊教材中能以完整詞名確認的圖片優先；只有找不到明確舊圖時，
            # 才使用私有生成圖 manifest，避免新圖蓋掉既有可追溯素材。
            source = find_reviewed_source(inventory, lesson_no, word)
            source_kind = "reviewed"
            if source is None:
                source = generated.get((lesson_id, word))
                source_kind = "generated"
            if source is None or not source.exists():
                unresolved.append(f"{lesson_id}:{word}")
                continue
            target = asset_root / f"l{lesson_no:02d}-{index:02d}.webp"
            compress_webp(source, target)
            item["image"] = public_asset_path(repo_root, target)
            changed += 1
            if source_kind == "generated":
                generated_count += 1
            else:
                reused += 1
        save_json(data_path, lesson)

    if unresolved:
        raise SystemExit("仍缺少圖片來源：" + ", ".join(unresolved))
    print(f"[OK] 補齊語詞圖片：{changed} 張（重用舊圖 {reused}、生成圖 {generated_count}）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
