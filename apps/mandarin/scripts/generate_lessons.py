#!/usr/bin/env python3
"""Generate data-driven Mandarin lessons from private, reviewed source files.

The script deliberately keeps source files outside the public repository.  It
only writes derived lesson JSON, compressed WebP assets, course-index entries,
and an external progress file.  It is resumable: completed lesson keys are
skipped by ``--resume`` after their output files still exist.

After each non-dry-run batch it rebuilds the cumulative ``review_words`` index
from the public lesson JSON files, so the cross-lesson review module is never
left in a false "教材待補" state after a partial or resumed generation.

Profiles currently covered by this public adapter:
  * g3a: 115 翰林三上, L07-L12 (the same adapter can rebuild L01-L12)
  * g1a: 115 翰林一上, L01-L07
  * g2a: 115 翰林二上, reviewed prepared standard lesson JSON only
  * g6a: 115 翰林六上, prepared standard lesson JSON only
  * g4a: 115 康軒四上, prepared standard lesson JSON only

G6A uses the same output contract and validation gates.  Its official source
cleaning remains private; after the source review gate, a prepared directory
containing standard lesson JSON and compressed assets can be imported through
the public ``g6a`` interface without copying official source files into the
repository.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
import zipfile
from dataclasses import dataclass
from datetime import date, datetime, timezone
from io import BytesIO
from pathlib import Path
from random import Random
from urllib.parse import quote

try:
    from PIL import Image
except ImportError:  # pragma: no cover - only image-producing profiles need Pillow
    Image = None


MAX_IMAGE_BYTES = 300 * 1024
MAX_LESSON_BYTES = 4 * 1024 * 1024
TODAY = date.today().isoformat()


@dataclass(frozen=True)
class Profile:
    name: str
    code: str
    grade: int
    term: str
    label: str
    source_hint: str
    publisher: str
    unit_title: str


PROFILES = {
    "g3a": Profile("g3a", "115AG3H", 3, "上", "翰林三上", "115G3A_國語 翰", "翰林", "三上國語課程"),
    "g1a": Profile("g1a", "115AG1H", 1, "上", "翰林一上", "115G1A_國語 翰", "翰林", "一年級上學期國語課程"),
    "g2a": Profile("g2a", "115AG2H", 2, "上", "翰林二上", "115G2A_國語 翰", "翰林", "二上國語課程"),
    "g6a": Profile("g6a", "115AG6H", 6, "上", "翰林六上", "115G6A_國語 翰（準備資料）", "翰林", "六上國語課程"),
    "g4a": Profile("g4a", "115AG4K", 4, "上", "康軒四上", "115G4A_國語 康（準備資料）", "康軒", "四上國語課程"),
}

PREPARED_PROFILES = {"g2a", "g4a", "g6a"}


def load_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sync_review_coverage(output_data: Path) -> None:
    """Rebuild the cumulative old-character index after a batch run.

    The review activity loads earlier lesson JSON files at runtime.  The
    ``review_words`` index is therefore only the public availability manifest;
    it must be rebuilt from existing derived lesson data instead of being
    hand-authored or guessed from the private textbook.
    """
    lesson_files = sorted(output_data.glob("lesson*.json"))
    lessons: list[dict] = []
    for path in lesson_files:
        try:
            lesson = load_json(path)
            if isinstance(lesson, dict) and isinstance(lesson.get("lesson_no"), int):
                lessons.append(lesson)
        except (OSError, json.JSONDecodeError):
            continue
    lessons.sort(key=lambda item: item["lesson_no"])

    for lesson in lessons:
        current_no = lesson["lesson_no"]
        by_lesson: dict[str, list[str]] = {}
        for source in lessons:
            source_no = source["lesson_no"]
            if source_no > current_no:
                continue
            by_lesson[str(source_no)] = [
                item["char"]
                for item in source.get("characters", [])
                if item.get("char") and (item.get("status") in (None, "ready"))
            ]
        lesson["review_words"] = {"by_lesson": by_lesson}

        previous = [source for source in lessons if source["lesson_no"] < current_no]
        candidate_count = sum(
            1
            for source in previous
            for item in source.get("characters", [])
            if item.get("char") and item.get("zhuyin") and item.get("status") in (None, "ready")
        )
        candidate_count += sum(
            1
            for source in previous
            for item in source.get("words", [])
            if item.get("word") and item.get("meaning") and item.get("status") in ("ready", "approved")
        )
        review_module = lesson.get("modules", {}).get("review")
        if review_module is not None:
            if current_no == 1:
                review_module["status"] = "missing"
                review_module["note"] = "第 1 課沒有前課資料。"
            elif candidate_count >= 3:
                review_module["status"] = "available"
                review_module.pop("note", None)
            else:
                review_module["status"] = "missing"
                review_module["note"] = "前課可複習字詞不足 3 題。"

        save_json(output_data / f"lesson{current_no:02d}.json", lesson)


def first_lesson(value: object) -> dict:
    if isinstance(value, dict) and isinstance(value.get("lessons"), list) and value["lessons"]:
        return value["lessons"][0]
    if isinstance(value, list) and value and isinstance(value[0], dict):
        return value[0]
    return value if isinstance(value, dict) else {}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_range(value: str) -> list[int]:
    result: set[int] = set()
    for token in value.split(","):
        token = token.strip()
        if not token:
            continue
        if "-" in token:
            start, end = (int(part) for part in token.split("-", 1))
            result.update(range(start, end + 1))
        else:
            result.add(int(token))
    return sorted(result)


def dedupe(items: list[str]) -> list[str]:
    return list(dict.fromkeys(item.strip() for item in items if item and item.strip()))


def pinyin_loader(pypinyin_path: Path | None):
    if pypinyin_path:
        sys.path.insert(0, str(pypinyin_path.resolve()))
    try:
        from pypinyin import Style, pinyin
    except ImportError as exc:  # pragma: no cover - environment guidance
        raise SystemExit(
            "找不到 pypinyin。請以 --pypinyin-path 指向含 pypinyin 的私有環境；"
            "注音只作為來源已核對後的衍生欄位。"
        ) from exc

    def to_zhuyin(text: str) -> str:
        return " ".join(item[0] for item in pinyin(text, style=Style.BOPOMOFO, heteronym=False))

    return to_zhuyin


def parse_unihan(unihan_zip: Path | None) -> tuple[dict[str, str], dict[str, int]]:
    radicals: dict[str, str] = {}
    strokes: dict[str, int] = {}
    if not unihan_zip or not unihan_zip.exists():
        return radicals, strokes
    with zipfile.ZipFile(unihan_zip) as archive:
        for filename in ("Unihan_IRGSources.txt",):
            text = archive.read(filename).decode("utf-8")
            for line in text.splitlines():
                if not line or line.startswith("#"):
                    continue
                fields = line.split("\t")
                if len(fields) != 3:
                    continue
                code, field, value = fields
                try:
                    char = chr(int(code[2:], 16))
                except ValueError:
                    continue
                if field == "kRSUnicode" and char not in radicals:
                    match = re.match(r"(\d+)[.']", value)
                    if match and int(match.group(1)) <= 214:
                        radicals[char] = chr(0x2F00 + int(match.group(1)) - 1)
                if field == "kTotalStrokes" and char not in strokes:
                    match = re.match(r"(\d+)", value)
                    if match:
                        strokes[char] = int(match.group(1))
    return radicals, strokes


def load_common_examples(workbook_path: Path | None, grade: int, publisher: str = "翰林") -> dict[str, list[str]]:
    """Read only derived term names from the publisher sheet in the private workbook."""
    if not workbook_path or not workbook_path.exists():
        return {}
    try:
        from openpyxl import load_workbook
    except ImportError:
        return load_common_examples_xlsx_xml(workbook_path, grade, publisher)

    workbook = load_workbook(workbook_path, read_only=True, data_only=True)
    if publisher not in workbook.sheetnames:
        workbook.close()
        return {}
    sheet = workbook[publisher]
    terms_by_char: dict[str, dict[str, int]] = {}
    for row in sheet.iter_rows(min_row=2, values_only=True):
        if len(row) < 17 or row[1] != 115 or row[2] != grade or row[3] != 1:
            continue
        char = str(row[6] or "").strip()
        if not char:
            continue
        bucket = terms_by_char.setdefault(char, {})
        for cell in row[11:17]:
            if not cell:
                continue
            for raw in re.split(r"[、,，;；\s]+", str(cell)):
                match = re.fullmatch(r"(.+?)\((\d+)\)", raw.strip())
                if not match:
                    continue
                term, score = match.group(1).strip(), int(match.group(2))
                if len(term) >= 2 and char in term:
                    bucket[term] = max(score, bucket.get(term, 0))
    workbook.close()
    return {
        char: [term for term, _ in sorted(values.items(), key=lambda item: (-item[1], item[0]))[:3]]
        for char, values in terms_by_char.items()
    }


def load_common_examples_xlsx_xml(workbook_path: Path, grade: int, publisher: str = "翰林") -> dict[str, list[str]]:
    """Dependency-free fallback for the private workbook.

    The public generator must also run on the lightweight Python environment
    used by the Windows handoff machine, where openpyxl may not be installed.
    This reads only the requested publisher worksheet cells needed by the common-term
    ranking and never copies workbook content to the repository.
    """
    from xml.etree import ElementTree as ET

    ns_main = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
    ns_rel = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    ns_pkg = "http://schemas.openxmlformats.org/package/2006/relationships"
    with zipfile.ZipFile(workbook_path) as archive:
        shared: list[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            shared = ["".join(node.text or "" for node in item.iter(f"{{{ns_main}}}t")) for item in root]
        workbook_root = ET.fromstring(archive.read("xl/workbook.xml"))
        rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        rel_targets = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels.findall(f"{{{ns_pkg}}}Relationship")}
        sheet_path = None
        for sheet in workbook_root.findall(f".//{{{ns_main}}}sheet"):
            if sheet.attrib.get("name") == publisher:
                target = rel_targets.get(sheet.attrib.get(f"{{{ns_rel}}}id"))
                if target:
                    sheet_path = "xl/" + target.lstrip("/") if not target.startswith("xl/") else target
                break
        if not sheet_path or sheet_path not in archive.namelist():
            return {}
        worksheet = ET.fromstring(archive.read(sheet_path))

        def column_number(reference: str) -> int:
            letters = re.match(r"[A-Z]+", reference or "")
            if not letters:
                return -1
            number = 0
            for letter in letters.group(0):
                number = number * 26 + ord(letter) - ord("A") + 1
            return number - 1

        def cell_value(cell: ET.Element) -> str:
            value = cell.find(f"{{{ns_main}}}v")
            raw = value.text if value is not None else ""
            if cell.attrib.get("t") == "s" and raw.isdigit() and int(raw) < len(shared):
                return shared[int(raw)]
            inline = cell.find(f".//{{{ns_main}}}t")
            return inline.text or "" if inline is not None else raw

        terms_by_char: dict[str, dict[str, int]] = {}
        for row in worksheet.findall(f".//{{{ns_main}}}row"):
            values = {column_number(cell.attrib.get("r", "")): cell_value(cell) for cell in row.findall(f"{{{ns_main}}}c")}
            if values.get(1) != "115" or values.get(2) != str(grade) or values.get(3) != "1":
                continue
            char = str(values.get(6, "")).strip()
            if not char:
                continue
            bucket = terms_by_char.setdefault(char, {})
            for column in range(11, 17):
                for raw in re.split(r"[、,，;；\s]+", str(values.get(column, ""))):
                    match = re.fullmatch(r"(.+?)\((\d+)\)", raw.strip())
                    if match and len(match.group(1).strip()) >= 2 and char in match.group(1):
                        term, score = match.group(1).strip(), int(match.group(2))
                        bucket[term] = max(score, bucket.get(term, 0))
        return {
            char: [term for term, _ in sorted(values.items(), key=lambda item: (-item[1], item[0]))[:3]]
            for char, values in terms_by_char.items()
        }


def compress_webp(source: Path, destination: Path) -> int:
    if Image is None:
        raise SystemExit("目前產生圖片需要 Pillow；G6A 準備資料匯入不需 Pillow，但 G1A／G3A 圖片產生需要先安裝。")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as opened:
        image = opened.convert("RGB")
        image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
        quality = 84
        while True:
            buffer = BytesIO()
            image.save(buffer, "WEBP", quality=quality, method=6)
            if buffer.tell() <= MAX_IMAGE_BYTES:
                destination.write_bytes(buffer.getvalue())
                return destination.stat().st_size
            if quality > 52:
                quality -= 8
            else:
                image = image.resize((max(320, int(image.width * 0.82)), max(320, int(image.height * 0.82))), Image.Resampling.LANCZOS)
                quality = 76


def copy_image(source: Path | None, destination: Path) -> str | None:
    if not source or not source.exists():
        return None
    compress_webp(source, destination)
    return "/assets/" + destination.relative_to(destination.parents[3]).as_posix()


def url_encode_chars(chars: str) -> str:
    return "https://gsyan888.github.io/html5_fun/html5_stroke_parts/html5_stroke_parts.html?by=gsyan&words=" + quote(chars, safe="")


def extension(profile: Profile, lesson_no: int, chars: str) -> dict:
    return {
        "id": f"ext:stroke-{profile.code.lower()}-{lesson_no:02d}",
        "status": "approved",
        "url": url_encode_chars(chars),
        "title": "筆順練習(雄筆順)",
        "provider": "雄::gsyan 筆順練習選單",
        "type": "reading",
        "module": "characters",
        "compact": True,
        "version_note": f"115上・{profile.publisher}・{profile.grade}年級・第{lesson_no}課",
        "login_required": False,
        "checked_at": TODAY,
        "note": f"已帶入本課{len(chars)}個生字",
    }


def module(label: str, activity: str, available: bool, note: str = "") -> dict:
    value = {"label": label, "status": "available" if available else "missing", "activity": activity}
    if note:
        value["note"] = note
    return value


def character_items(profile: Profile, lesson_no: int, chars: str, readings: dict[str, str], radicals: dict[str, str], strokes: dict[str, int], examples: dict[str, list[str]], word_items: list[dict]) -> list[dict]:
    output = []
    for char in chars:
        zhuyin = readings.get(char)
        if not zhuyin:
            raise ValueError(f"{profile.name} L{lesson_no:02d} 缺少生字讀音：{char}")
        stroke_count = strokes.get(char)
        if not stroke_count:
            raise ValueError(f"{profile.name} L{lesson_no:02d} 缺少筆畫資料：{char}")
        terms = list(examples.get(char, []))
        for item in word_items:
            word = str(item.get("word") or "")
            if char in word and word not in terms:
                terms.append(word)
        output.append({
            "char": char,
            "zhuyin": zhuyin,
            "stroke_count": stroke_count,
            "radical": radicals.get(char) or char,
            "type": "習寫字",
            "level": "basic",
            "examples": terms[:3],
            "examples_source": "大腦與語言實驗室生字表（依常用度取前三項；不足時以本課語詞補足）",
            "image": None,
            "audio_override": None,
            "pedia_url": "https://pedia.cloud.edu.tw/Entry/Detail?title=" + quote(char),
            "source": f"115G{profile.grade}A／翰林官方教材與教育百科字庫",
            "status": "ready",
        })
    return output


def deterministic_options(correct: str, pool: list[str], seed: int, limit: int = 3) -> list[str]:
    values = dedupe([correct] + pool)
    Random(seed).shuffle(values)
    return values[:limit]



def image_map_for_g3a(private_root: Path, lesson_no: int, meaning_manifest: Path | None = None) -> dict[str, Path]:
    """Return only reviewed exact-word illustrations.

    The low-g3-v2 manifest is the source of truth for vocabulary cards.  The
    older image-quiz manifest contains a different, smaller word list and can
    therefore silently create the wrong picture/word pair; it is retained only
    as a compatibility fallback for lessons without a reviewed manifest.
    """
    image_root = private_root / "worksheet-batches" / "115" / "115G3A_國語 翰" / "04_內容資料與草案" / "wordwall" / "image_quiz"
    manifest = meaning_manifest
    if manifest and manifest.exists():
        data = load_json(manifest)
        manifest_root = manifest.parent
        result: dict[str, Path] = {}
        for item in data.get("illustrations", []):
            term = str(item.get("word") or "").strip()
            raw_path = item.get("resolved_path") or item.get("path")
            if not term or not raw_path:
                continue
            candidate = Path(raw_path)
            if not candidate.is_absolute():
                candidate = manifest_root / candidate
            if candidate.exists():
                result[term] = candidate
        return result

    manifest = image_root / f"L{lesson_no:02d}_assets.json"
    if not manifest.exists():
        return {}
    data = load_json(manifest)
    result: dict[str, Path] = {}
    for item in data.get("assets", []):
        term = item.get("term")
        rel = item.get("image")
        if term and rel:
            candidate = image_root / rel
            if candidate.exists():
                result[term] = candidate
    return result


def image_for_g1a(private_root: Path, lesson_no: int, word: str) -> Path | None:
    root = private_root / "worksheet-batches" / "115" / "115G1A_國語 翰" / "04_內容資料與草案"
    patterns = [
        root / "assets" / f"115翰G1A{lesson_no:02d}*" / f"*_{word}.png",
        root / "assets" / f"115翰G1A{lesson_no:02d}*" / f"*{word}*.png",
    ]
    for pattern in patterns:
        matches = sorted(pattern.parent.glob(pattern.name)) if pattern.parent.exists() else []
        if matches:
            return matches[0]
    for base in (root / "wordwall", root / "assets"):
        if not base.exists():
            continue
        matches = sorted(path for path in base.rglob("*") if path.is_file() and path.suffix.lower() in {".png", ".jpg", ".jpeg"} and path.stem.endswith("_" + word))
        if matches:
            return matches[0]
    return None


def g3a_sources(private_root: Path, lesson_no: int) -> dict:
    batch = private_root / "worksheet-batches" / "115" / "115G3A_國語 翰"
    legacy = private_root / "sped-os-github" / "30-materials" / "worksheets"
    draft = batch / "04_內容資料與草案"
    source_files = {
        "chars": batch / "01_本學年官方教材" / "生字表.txt",
        "zici": legacy / "G1_zici_meizi" / "source" / "115AG3" / f"115翰G3A{lesson_no:02d}*data.json",
        "meanings": legacy / "yuci_jieshi_low" / "source" / "115AG3" / f"115翰G3A{lesson_no:02d}*語詞解釋_data.json",
        "lookalikes": legacy / "xiangsizi" / "source" / "115AG3" / f"115翰G3A{lesson_no:02d}*形似字_data.json",
        "idioms": legacy / "chengyu_buchong" / "source" / "115AG3" / f"115翰G3A{lesson_no:02d}*data.json",
        "sentences": legacy / "zaoju_juxing" / "source" / "115AG3" / f"115翰G3A{lesson_no:02d}*造句與句型練習_data.json",
        "paragraph": draft / "段落大意_L01-L12_Terra備料_v2.1" / f"L{lesson_no:02d}_*" / f"*G3A{lesson_no:02d}*段落大意_data_v2.1.json",
    }
    files: dict[str, Path] = {"chars": source_files["chars"]}
    search_roots = {
        "zici": legacy / "G1_zici_meizi" / "source" / "115AG3",
        "meanings": draft / "low-g3-v2_單課樣張",
        "lookalikes": legacy / "xiangsizi" / "source" / "115AG3",
        "idioms": legacy / "chengyu_buchong" / "source" / "115AG3",
        "sentences": legacy / "zaoju_juxing" / "source" / "115AG3",
        "paragraph": draft / "段落大意_L01-L12_Terra備料_v2.1",
    }
    for key, root in search_roots.items():
        if key == "paragraph":
            matches = sorted(root.glob(f"L{lesson_no:02d}_*/*G3A{lesson_no:02d}*段落大意_data_v2.1.json"))
        elif key == "meanings":
            matches = sorted(root.glob(f"L{lesson_no:02d}_*/*G3A{lesson_no:02d}*語詞解釋_low-g3-v2_terra.json"))
            if not matches:
                matches = sorted((legacy / "yuci_jieshi_low" / "source" / "115AG3").glob(f"*G3A{lesson_no:02d}*語詞解釋_data.json"))
        elif key == "lookalikes":
            matches = sorted(root.glob(f"*G3A{lesson_no:02d}*形似字_data.json"))
        elif key == "sentences":
            matches = sorted(root.glob(f"*G3A{lesson_no:02d}*造句與句型練習_data.json"))
        else:
            matches = sorted(root.glob(f"*G3A{lesson_no:02d}*data.json"))
        if matches:
            files[key] = matches[0]
    chars_line = next((line for line in source_files["chars"].read_text(encoding="utf-8").splitlines() if line.startswith(f"L{lesson_no:02d}:")), "")
    chars = chars_line.split(":", 1)[1].strip() if ":" in chars_line else ""
    lesson_data = first_lesson(load_json(files["zici"])) if "zici" in files else {}
    meaning_data = first_lesson(load_json(files["meanings"])) if "meanings" in files else {}
    paragraph_data = first_lesson(load_json(files["paragraph"])) if "paragraph" in files else {}
    raw_title = str(
        meaning_data.get("title")
        or meaning_data.get("lesson_title")
        or lesson_data.get("title")
        or paragraph_data.get("title")
        or f"第{lesson_no}課"
    )
    title = re.sub(r"^第\s*\d+\s*課\s*", "", raw_title)
    title = re.sub(r"^.*?G3A\d+\s*", "", title)
    title = re.sub(r"^.*?L\d+\s*", "", title) if title.startswith(("翰林", "115")) else title
    title = title.strip("　 ") or f"第{lesson_no}課"
    word_items = list(meaning_data.get("items") or lesson_data.get("items") or [])
    return {"batch": batch, "draft": draft, "chars": chars, "title": title, "word_items": word_items, "meaning_data": meaning_data, "meaning_manifest": files.get("meanings"), "files": files, "paragraph": paragraph_data}


def g1a_sources(private_root: Path, lesson_no: int) -> dict:
    batch = private_root / "worksheet-batches" / "115" / "115G1A_國語 翰"
    draft = batch / "04_內容資料與草案"
    chars_data = first_lesson(load_json(draft / "lesson_characters.json"))
    lesson_record = next(item for item in load_json(draft / "lesson_characters.json")["lessons"] if item["lesson_code"] == f"L{lesson_no:02d}")
    reading = private_root / "Teaching-Materials-github" / "Chinese" / "Reading-Tool" / "lessons" / f"115HG1A{lesson_no:02d}.json"
    wordwall = load_json(draft / "wordwall" / "語詞解釋_quiz_電子遊戲" / "lesson_data.json")
    word_record = next(item for item in wordwall if item["code"] == f"L{lesson_no:02d}")
    return {"batch": batch, "draft": draft, "lesson": lesson_record, "reading": load_json(reading), "words": word_record}


def g3a_readings(private_root: Path, lesson_no: int, chars: str, to_zhuyin) -> dict[str, str]:
    # The G3A worksheet JSON contains reviewed vocabulary readings.  Character
    # readings are generated from the same pinned pypinyin environment and are
    # recorded as derived data; polyphonic characters remain a review gate.
    blogger_root = private_root / "tmp" / "blogger-115g3a-20260809"
    matches = sorted(blogger_root.glob(f"L{lesson_no:02d}_*/input.json")) if blogger_root.exists() else []
    readings = {}
    if matches:
        for item in first_lesson(load_json(matches[0])).get("speaking_words", []):
            term = item.get("term", "")
            syllables = item.get("zhuyin", "").split()
            for char, syllable in zip(term, syllables):
                readings.setdefault(char, syllable)
    for char in chars:
        readings.setdefault(char, to_zhuyin(char))
    return readings


def g1a_readings(record: dict, to_zhuyin) -> dict[str, str]:
    readings: dict[str, str] = {}
    for item in record.get("overrides", {}).values():
        char, zhuyin = item.get("char"), item.get("zhuyin")
        if char and zhuyin:
            readings.setdefault(char, zhuyin)
    for char in record.get("chars", ""):
        readings.setdefault(char, to_zhuyin(char))
    return readings


def build_words(profile: Profile, lesson_no: int, lesson_id: str, items: list[dict], image_lookup, destination: Path, to_zhuyin) -> list[dict]:
    result = []
    for index, item in enumerate(items, start=1):
        word = str(item.get("word") or "").strip()
        if not word:
            continue
        source_image = image_lookup(word)
        image = None
        if source_image:
            target = destination / f"lesson{lesson_no:02d}" / "vocabulary" / f"l{lesson_no:02d}-{index:02d}.webp"
            compress_webp(source_image, target)
            image = "/assets/" + target.relative_to(destination.parent).as_posix()
        meaning = item.get("definition") or item.get("meaning")
        result.append({
            "id": f"word:{lesson_id}:{index:02d}",
            "word": word,
            "zhuyin": item.get("zhuyin") or to_zhuyin(word),
            "meaning": meaning,
            "example_sentence": None,
            "example_status": "todo_rewrite",
            "level": "basic" if len(word) <= 2 else "challenge",
            "image": image,
            "status": "ready",
            "source": f"115G{profile.grade}A／{profile.publisher}官方教材（形音輕鬆學：語詞解釋）",
        })
    return result


def simple_paragraphs(profile: Profile, lesson_no: int, paragraph_data: dict) -> tuple[list[dict], dict]:
    columns = paragraph_data.get("columns_zhuyin") or []
    paragraphs = []
    for index, summary in enumerate(columns, start=1):
        text = str(summary).strip()
        if not text or text.startswith("第 undefined"):
            continue
        paragraphs.append({
            "id": f"paragraph:{profile.code}:{lesson_no:02d}:{index:02d}",
            "paragraph_no": index,
            "summary": text,
            "structure_role": f"第{index}段重點",
            "status": "approved",
            "source": f"115G{profile.grade}A／翰林官方教材（段落大意）",
        })
    gist = paragraphs[0]["summary"] if paragraphs else "本課重點整理待補。"
    return paragraphs, {"gist": gist, "theme": "閱讀理解", "status": "approved", "source": "derived:official-paragraph-summary"}


def build_g3a(profile: Profile, private_root: Path, lesson_no: int, output_data: Path, output_assets: Path, workbook: Path | None, radicals, strokes, to_zhuyin) -> dict:
    source = g3a_sources(private_root, lesson_no)
    if not source["chars"] or not source["word_items"]:
        raise ValueError(f"G3A L{lesson_no:02d} 的生字或語詞來源不完整")
    lesson_id = f"{profile.code}{lesson_no:02d}"
    image_map = image_map_for_g3a(private_root, lesson_no, source.get("meaning_manifest"))
    words = build_words(profile, lesson_no, lesson_id, source["word_items"], lambda word: image_map.get(word), output_assets, to_zhuyin)
    readings = g3a_readings(private_root, lesson_no, source["chars"], to_zhuyin)
    examples = load_common_examples(workbook, profile.grade, profile.publisher)
    characters = character_items(profile, lesson_no, source["chars"], readings, radicals, strokes, examples, source["word_items"])
    paragraphs, main_idea = simple_paragraphs(profile, lesson_no, source["paragraph"])
    lesson = {
        "lesson_id": lesson_id,
        "volume": {"code": profile.code, "publisher": profile.publisher, "grade": profile.grade, "term": profile.term},
        "unit": {"no": 1, "title": profile.unit_title},
        "lesson_no": lesson_no,
        "title": source["title"],
        "author": "",
        "blurb": f"透過〈{source['title']}〉整理生字、語詞與閱讀重點，練習把課文內容連結到生活。",
        "characters": characters,
        "words": words,
        "word_meanings": [], "sentences": [], "idioms": [], "idiom_sentences": [], "sentence_patterns": [],
        "rhetoric": [], "paragraph_summary": paragraphs, "main_idea": main_idea, "reading_questions": [],
        "polysemy": [], "polysemy_senses": [], "polyphones": [], "lookalikes": [], "listening": [],
        "review_words": {}, "extensions": [extension(profile, lesson_no, source["chars"])],
        "modules": {
            "characters": module("認識生字", "character-cards", len(characters) >= 3),
            "vocabulary": module("學會語詞", "vocabulary-cards", len(words) >= 3),
            "reading": module("讀懂課文", "reading", bool(paragraphs), "課文全文不放入公開網站。"),
            "sentence_practice": module("練習句子", "sentence-practice", False, "句型資料待審核。"),
            "application": module("我會應用", "application", False, "教材待補。"),
            "idiom_builder": module("生字變成語", "idiom-builder", False, "成語資料待審核。"),
            "polysemy": module("一字多義", "polysemy", False, "字義資料待審核。"),
            "polyphones": module("一字多音", "polyphones", False, "多音字資料待審核。"),
            "lookalikes": module("形似字", "lookalikes", False, "形似字資料待審核。"),
            "structure_map": module("課文地圖", "structure-map", bool(paragraphs)),
            "listening": module("聽聽看", "listening-quiz", False, "聆聽題資料待審核。"),
            "rhetoric": module("修辭小偵探", "rhetoric", False, "修辭資料待審核。"),
            "review": module("舊字新詞", "review", False, "跨課複習資料待補。"),
        },
    }
    save_json(output_data / f"lesson{lesson_no:02d}.json", lesson)
    return lesson


def build_g1a(profile: Profile, private_root: Path, lesson_no: int, output_data: Path, output_assets: Path, workbook: Path | None, radicals, strokes, to_zhuyin) -> dict:
    source = g1a_sources(private_root, lesson_no)
    record = source["reading"]
    chars = source["lesson"]["chars"]
    lesson_id = f"{profile.code}{lesson_no:02d}"
    word_items = source["words"].get("items", [])
    words = build_words(profile, lesson_no, lesson_id, word_items, lambda word: image_for_g1a(private_root, lesson_no, word), output_assets, to_zhuyin)
    readings = g1a_readings(record, to_zhuyin)
    examples = load_common_examples(workbook, profile.grade, profile.publisher)
    characters = character_items(profile, lesson_no, chars, readings, radicals, strokes, examples, word_items)
    title = source["lesson"]["title"]
    lesson = {
        "lesson_id": lesson_id,
        "volume": {"code": profile.code, "publisher": profile.publisher, "grade": profile.grade, "term": profile.term},
        "unit": {"no": 1, "title": profile.unit_title},
        "lesson_no": lesson_no,
        "title": title,
        "author": "",
        "blurb": f"透過〈{title}〉練習認讀生字、理解語詞，並用聲音和圖像建立閱讀連結。",
        "characters": characters,
        "words": words,
        "word_meanings": [], "sentences": [], "idioms": [], "idiom_sentences": [], "sentence_patterns": [],
        "rhetoric": [], "paragraph_summary": [], "main_idea": {"gist": "本課閱讀重點待補。", "theme": "閱讀理解", "status": "draft", "source": "teacher-review-required"},
        "reading_questions": [], "polysemy": [], "polysemy_senses": [], "polyphones": [], "lookalikes": [], "listening": [],
        "review_words": {}, "extensions": [extension(profile, lesson_no, chars)],
        "modules": {
            "characters": module("認識生字", "character-cards", len(characters) >= 3),
            "vocabulary": module("學會語詞", "vocabulary-cards", len(words) >= 3),
            "reading": module("讀懂課文", "reading", False, "一年級課文內容待整理為公開摘要；課文全文不放入公開網站。"),
            "sentence_practice": module("練習句子", "sentence-practice", False, "句型資料待審核。"),
            "application": module("我會應用", "application", False, "教材待補。"),
            "idiom_builder": module("生字變成語", "idiom-builder", False, "一年級不安排成語題。"),
            "polysemy": module("一字多義", "polysemy", False, "一年級不安排一字多義題。"),
            "polyphones": module("一字多音", "polyphones", False, "多音字資料待審核。"),
            "lookalikes": module("形似字", "lookalikes", False, "形似字資料待審核。"),
            "structure_map": module("課文地圖", "structure-map", False, "摘要資料待補。"),
            "listening": module("聽聽看", "listening-quiz", False, "聆聽題資料待審核。"),
            "rhetoric": module("修辭小偵探", "rhetoric", False, "一年級不安排修辭題。"),
            "review": module("舊字新詞", "review", False, "跨課複習資料待補。"),
        },
    }
    save_json(output_data / f"lesson{lesson_no:02d}.json", lesson)
    return lesson


def prepared_lesson_path(prepared_root: Path, profile: Profile, lesson_no: int) -> Path:
    """Resolve one reviewed, normalized lesson from the private staging area.

    The public adapter deliberately accepts only the standard lesson contract,
    not publisher files.  The private source-materializer may choose its own
    internal layout; it must export one of these stable hand-off layouts:
    ``<root>/<volume-code>/lessonNN.json``, ``<root>/lessonNN.json`` or
    ``<root>/public/data/<volume-code>/lessonNN.json``.
    """
    relative = f"lesson{lesson_no:02d}.json"
    candidates = (
        prepared_root / profile.code / relative,
        prepared_root / relative,
        prepared_root / "public" / "data" / profile.code / relative,
        prepared_root / "data" / profile.code / relative,
    )
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    checked = ", ".join(str(path) for path in candidates)
    raise FileNotFoundError(f"找不到 {profile.code} L{lesson_no:02d} 的準備資料；已檢查：{checked}")


def _walk_strings(value: object):
    if isinstance(value, dict):
        for key, item in value.items():
            yield from _walk_strings(key)
            yield from _walk_strings(item)
    elif isinstance(value, list):
        for item in value:
            yield from _walk_strings(item)
    elif isinstance(value, str):
        yield value


def validate_prepared_lesson(lesson: dict, profile: Profile, lesson_no: int) -> None:
    """Fail closed on an incomplete or private-path-bearing hand-off file."""
    required = {"lesson_id", "volume", "unit", "lesson_no", "title", "characters", "words", "modules"}
    missing = sorted(required - set(lesson))
    if missing:
        raise ValueError(f"{profile.code} L{lesson_no:02d} 準備資料缺少欄位：{', '.join(missing)}")
    expected_id = f"{profile.code}{lesson_no:02d}"
    if lesson.get("lesson_id") != expected_id or lesson.get("lesson_no") != lesson_no:
        raise ValueError(f"{profile.code} L{lesson_no:02d} lesson_id／lesson_no 不一致")
    volume = lesson.get("volume")
    if not isinstance(volume, dict) or volume.get("code") != profile.code or volume.get("publisher") != profile.publisher:
        raise ValueError(f"{profile.code} L{lesson_no:02d} volume 不是 {profile.publisher} 的 {profile.code} 契約")
    if not isinstance(lesson.get("characters"), list) or not isinstance(lesson.get("words"), list):
        raise ValueError(f"{profile.code} L{lesson_no:02d} characters／words 必須是陣列")
    if not isinstance(lesson.get("modules"), dict):
        raise ValueError(f"{profile.code} L{lesson_no:02d} modules 必須是物件")
    private_markers = re.compile(r"(?:^|[\\/\s])(?:[A-Za-z]:[\\/]|\\\\)|worksheet-batches|mandarin-work|官方教材原檔", re.IGNORECASE)
    leaked = next((text for text in _walk_strings(lesson) if private_markers.search(text)), None)
    if leaked:
        raise ValueError(f"{profile.code} L{lesson_no:02d} 準備資料疑似含私有絕對路徑或官方原檔標記：{leaked[:160]}")
    undefined = next((text for text in _walk_strings(lesson) if re.search(r"\bundefined\b", text, re.IGNORECASE)), None)
    if undefined:
        raise ValueError(f"{profile.code} L{lesson_no:02d} 準備資料含 undefined：{undefined[:160]}")


def copy_prepared_assets(prepared_root: Path, profile: Profile, lesson_no: int, output_assets: Path) -> int:
    """Copy only already-compressed hand-off assets into the public asset tree."""
    relative = Path(profile.code) / f"lesson{lesson_no:02d}"
    candidates = (
        prepared_root / "assets" / relative,
        prepared_root / "public" / "assets" / relative,
        prepared_root / profile.code / f"lesson{lesson_no:02d}" / "assets",
    )
    source_dir = next((path for path in candidates if path.is_dir()), None)
    if source_dir is None:
        return 0
    copied = 0
    destination = output_assets / f"lesson{lesson_no:02d}"
    for source in sorted(source_dir.rglob("*")):
        if not source.is_file():
            continue
        if source.suffix.lower() not in {".webp", ".avif"}:
            raise ValueError(f"{profile.name} 準備資產不是 WebP／AVIF：{source}")
        if source.stat().st_size > MAX_IMAGE_BYTES:
            raise ValueError(f"G6A 準備資產超過單張 300 KiB：{source}")
        target = destination / source.relative_to(source_dir)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        copied += 1
    return copied


def enrich_prepared_characters(
    lesson: dict,
    profile: Profile,
    lesson_no: int,
    radicals: dict[str, str],
    strokes: dict[str, int],
    common_examples: dict[str, list[str]] | None = None,
) -> None:
    """Fill only mechanical character fields from the pinned Unihan source.

    The prepared hand-off owns lesson-specific readings and examples.  Radical
    and stroke-count fields are deterministic dictionary metadata, so they can
    be completed at the public import boundary without inventing curriculum
    content.  Missing readings or stroke data fail closed.
    """
    for item in lesson.get("characters", []):
        char = str(item.get("char") or "").strip()
        if len(char) != 1:
            raise ValueError(f"{profile.code} L{lesson_no:02d} 生字欄位不是單一字：{char}")
        if not item.get("zhuyin"):
            raise ValueError(f"{profile.code} L{lesson_no:02d} 缺少生字讀音：{char}")
        stroke_count = item.get("stroke_count") or strokes.get(char)
        if not stroke_count:
            raise ValueError(f"{profile.code} L{lesson_no:02d} 缺少筆畫資料：{char}")
        item["radical"] = item.get("radical") or radicals.get(char) or char
        item["stroke_count"] = stroke_count
        item.setdefault("type", "習寫字")
        item.setdefault("level", "basic")
        existing_examples = list(item.get("examples") or [])
        ranked_examples = list(common_examples.get(char, [])) if common_examples else []
        item["examples"] = dedupe(ranked_examples + existing_examples)[:3]
        item.setdefault("examples_source", "康軒官方教材來源整理；常用度排序由私有來源階段完成")
        item.setdefault("image", None)
        item.setdefault("audio_override", None)
        item.setdefault("pedia_url", "https://pedia.cloud.edu.tw/Entry/Detail?title=" + quote(char))
        item.setdefault("status", "ready")


def finalize_prepared_lesson(lesson: dict, profile: Profile, lesson_no: int) -> None:
    """Add deterministic public extensions at import time."""
    chars = "".join(str(item.get("char") or "") for item in lesson.get("characters", []))
    lesson["extensions"] = [extension(profile, lesson_no, chars)]
    modules = lesson.setdefault("modules", {})
    if modules.get("characters", {}).get("status") == "missing" and len(lesson.get("characters", [])) >= 3:
        modules["characters"] = module("認識生字", "character-cards", True)
    if modules.get("vocabulary", {}).get("status") == "missing" and len(lesson.get("words", [])) >= 3:
        modules["vocabulary"] = module("學會語詞", "vocabulary-cards", True)


def build_prepared(
    profile: Profile,
    prepared_root: Path,
    lesson_no: int,
    output_data: Path,
    output_assets: Path,
    radicals: dict[str, str],
    strokes: dict[str, int],
    common_examples: dict[str, list[str]] | None,
) -> dict:
    source = prepared_lesson_path(prepared_root, profile, lesson_no)
    lesson = load_json(source)
    if not isinstance(lesson, dict):
        raise ValueError(f"{source} 不是課次物件")
    validate_prepared_lesson(lesson, profile, lesson_no)
    enrich_prepared_characters(lesson, profile, lesson_no, radicals, strokes, common_examples)
    finalize_prepared_lesson(lesson, profile, lesson_no)
    copied = copy_prepared_assets(prepared_root, profile, lesson_no, output_assets)
    save_json(output_data / f"lesson{lesson_no:02d}.json", lesson)
    print(f"[OK] prepared {profile.code} L{lesson_no:02d} assets={copied}")
    return lesson


def update_course_index(repo_root: Path, profile: Profile, lessons: list[dict]) -> None:
    path = repo_root / "public" / "data" / "course-index.json"
    index = load_json(path)
    grades = index.setdefault("grades", [])
    grade = next((item for item in grades if item.get("grade") == profile.grade), None)
    new_lessons = {
        item["lesson_no"]: {
            "lesson_id": item["lesson_id"],
            "lesson_no": item["lesson_no"],
            "title": item["title"],
            "data": f"data/{profile.code}/lesson{item['lesson_no']:02d}.json",
        }
        for item in lessons
    }
    existing_lessons: dict[int, dict] = {}
    if grade is not None:
        existing_volume = next((item for item in grade.get("volumes", []) if item.get("code") == profile.code), None)
        if existing_volume:
            for unit in existing_volume.get("units", []):
                for item in unit.get("lessons", []):
                    number = item.get("lesson_no")
                    if isinstance(number, int):
                        existing_lessons[number] = item
    # Recover an index entry if an interrupted/older run wrote lesson JSON but
    # replaced the index before all lesson metadata was merged.
    data_root = repo_root / "public" / "data" / profile.code
    for data_path in sorted(data_root.glob("lesson*.json")):
        try:
            item = load_json(data_path)
            number = int(item.get("lesson_no"))
            existing_lessons.setdefault(number, {
                "lesson_id": item["lesson_id"],
                "lesson_no": number,
                "title": item["title"],
                "data": f"data/{profile.code}/{data_path.name}",
            })
        except (KeyError, TypeError, ValueError, json.JSONDecodeError):
            continue
    existing_lessons.update(new_lessons)
    volume = {
        "code": profile.code,
        "publisher": profile.publisher,
        "term": profile.term,
        "label": "115 學年上學期",
        "units": [{
            "no": 1,
            "title": profile.unit_title,
            "lessons": [existing_lessons[number] for number in sorted(existing_lessons)],
        }],
    }
    if grade is None:
        grades.append({"grade": profile.grade, "label": profile.label, "volumes": [volume]})
    else:
        volumes = grade.setdefault("volumes", [])
        existing = next((item for item in volumes if item.get("code") == profile.code), None)
        if existing is None:
            volumes.append(volume)
        else:
            existing.clear()
            existing.update(volume)
        grade["label"] = profile.label
    grades.sort(key=lambda item: int(item.get("grade", 10**9)))
    save_json(path, index)


def load_progress(path: Path) -> dict:
    if not path.exists():
        return {"version": 1, "updated_at": None, "items": {}}
    return load_json(path)


def mark_progress(path: Path, progress: dict, key: str, status: str, detail: str = "") -> None:
    progress.setdefault("items", {})[key] = {"status": status, "updated_at": datetime.now(timezone.utc).isoformat(), "detail": detail}
    progress["updated_at"] = datetime.now(timezone.utc).isoformat()
    save_json(path, progress)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate resumable Mandarin lesson data and compressed assets.")
    parser.add_argument("--profile", choices=sorted(PROFILES), required=True)
    parser.add_argument("--source-root", type=Path, help="Private workspace root containing worksheet-batches and source tools.")
    parser.add_argument("--prepared-root", type=Path, help="G6A reviewed staging root containing normalized lesson JSON and WebP／AVIF assets.")
    parser.add_argument("--repo-root", type=Path, required=True, help="Teaching-Materials-github/apps/mandarin directory.")
    parser.add_argument("--lessons", required=True, help="Lesson numbers, for example 7-12 or 1-7.")
    parser.add_argument("--workbook", type=Path, help="Private Excel source for common character examples.")
    parser.add_argument("--unihan-zip", type=Path, help="Private Unihan.zip for radical/stroke data.")
    parser.add_argument("--pypinyin-path", type=Path, help="Private environment containing pypinyin.")
    parser.add_argument("--progress-file", type=Path, required=True, help="External progress JSON; do not place it in public/data.")
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    profile = PROFILES[args.profile]
    if args.profile in PREPARED_PROFILES and not args.prepared_root:
        parser.error(f"--profile {args.profile} 必須提供 --prepared-root；不得直接讀取官方原始教材。")
    if args.profile not in PREPARED_PROFILES and not args.source_root:
        parser.error("g1a／g3a 必須提供 --source-root。")
    lesson_numbers = parse_range(args.lessons)
    repo_root = args.repo_root.resolve()
    output_data = repo_root / "public" / "data" / profile.code
    output_assets = repo_root / "public" / "assets" / profile.code
    radicals, strokes = parse_unihan(args.unihan_zip)
    to_zhuyin = None if args.profile in PREPARED_PROFILES else pinyin_loader(args.pypinyin_path)
    common_examples = load_common_examples(args.workbook, profile.grade, profile.publisher)
    progress = load_progress(args.progress_file)
    generated: list[dict] = []

    for lesson_no in lesson_numbers:
        key = f"{profile.name}:L{lesson_no:02d}"
        data_path = output_data / f"lesson{lesson_no:02d}.json"
        if args.resume and progress.get("items", {}).get(key, {}).get("status") == "ready" and data_path.exists():
            generated.append(load_json(data_path))
            print(f"[SKIP] {key} 已完成，保留既有輸出")
            continue
        try:
            if args.profile in PREPARED_PROFILES:
                source = prepared_lesson_path(args.prepared_root.resolve(), profile, lesson_no)
                prepared = load_json(source)
                if not isinstance(prepared, dict):
                    raise ValueError(f"{source} 不是課次物件")
                validate_prepared_lesson(prepared, profile, lesson_no)
                if args.dry_run:
                    print(f"[PLAN] {key} {prepared['title']} chars={len(prepared['characters'])} words={len(prepared['words'])}")
                    mark_progress(args.progress_file, progress, key, "planned", prepared["title"])
                    continue
                lesson = build_prepared(profile, args.prepared_root.resolve(), lesson_no, output_data, output_assets, radicals, strokes, common_examples)
            elif args.profile == "g3a":
                source = g3a_sources(args.source_root.resolve(), lesson_no)
                if args.dry_run:
                    print(f"[PLAN] {key} {source['title']} chars={len(source['chars'])} words={len(source['word_items'])}")
                    mark_progress(args.progress_file, progress, key, "planned", source["title"])
                    continue
                lesson = build_g3a(profile, args.source_root.resolve(), lesson_no, output_data, output_assets, args.workbook, radicals, strokes, to_zhuyin)
            else:
                source = g1a_sources(args.source_root.resolve(), lesson_no)
                if args.dry_run:
                    print(f"[PLAN] {key} {source['lesson']['title']} chars={len(source['lesson']['chars'])} words={len(source['words']['items'])}")
                    mark_progress(args.progress_file, progress, key, "planned", source["lesson"]["title"])
                    continue
                lesson = build_g1a(profile, args.source_root.resolve(), lesson_no, output_data, output_assets, args.workbook, radicals, strokes, to_zhuyin)
            generated.append(lesson)
            mark_progress(args.progress_file, progress, key, "ready", f"{data_path}; sha256={sha256(data_path)}")
            print(f"[OK] {key} {lesson['title']} chars={len(lesson['characters'])} words={len(lesson['words'])}")
        except Exception as exc:
            mark_progress(args.progress_file, progress, key, "failed", str(exc))
            raise

    if not args.dry_run and generated:
        sync_review_coverage(output_data)
        print(f"[OK] review_words synced: {profile.code}")
        update_course_index(repo_root, profile, generated)
        print(f"[OK] course-index updated: {profile.code} lessons={len(generated)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
