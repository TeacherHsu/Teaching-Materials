#!/usr/bin/env python3
"""Enrich the prepared 115AG4K lesson JSON with approved official-source modules.

This Windows-side adapter reads the private 康軒 source documents and the
already reviewed G4A sentence data, then writes only derived JSON into the
public Mandarin app.  The official documents themselves never enter the
repository.  Every imported module records a source locator and SHA-256 in
``source_audit``.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from typing import Iterable
from urllib.parse import quote


HAN = r"\u3400-\u9fff\uF900-\uFAFF"
LESSON_TITLES = [
    "水陸小高手",
    "放學後",
    "我的籃球夢",
    "永遠的馬偕",
    "假如給我三天光明",
    "攀登生命的高峰",
    "美味的一堂課",
    "建築界的長頸鹿",
    "請到我的家鄉來",
    "奇幻旋律",
    "兔子先生等等我",
    "老鞋匠和小精靈",
]

# The workbook has only two ranked entries for 遨.  The third term is a
# dictionary-verified extension so every character card can keep the same
# three-term contract without pretending it came from the workbook ranking.
FALLBACK_COMMON_TERMS = {"遨": ["遨嬉"]}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: dict) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def read_doc(path: Path) -> str:
    # These legacy .doc files contain the Word text in a UTF-16LE stream.
    # Direct COM extraction is unavailable on this machine, so keep the
    # extraction deterministic and fail closed when a source file is absent.
    return path.read_bytes().decode("utf-16-le", errors="ignore")


def section_by_title(text: str, title: str, all_titles: Iterable[str] = LESSON_TITLES) -> str:
    start = text.find(title)
    if start < 0:
        return ""
    ends = [text.find(other, start + len(title)) for other in all_titles if other != title]
    ends = [index for index in ends if index >= 0]
    end = min(ends) if ends else len(text)
    return text[start:end]


def clean_text(value: str) -> str:
    value = value.replace("\x0b", " ").replace("\x0c", " ")
    return re.sub(r"[\x00-\x08\x0e-\x1f]", " ", value)


def han_runs(value: str) -> list[str]:
    return re.findall(rf"[{HAN}]{{2,}}", value)


def add_source_audit(lesson: dict, locator: str, path: Path) -> None:
    audit = lesson.setdefault("source_audit", [])
    record = {"kind": "official", "locator": locator, "sha256": sha256(path)}
    if record not in audit:
        audit.append(record)


def source_label(locator: str) -> str:
    return f"康軒四上官方教材（{locator}）"


def parse_common_terms(
    lesson: dict,
    source_06: str,
    source_09: str,
    common_examples: dict[str, list[str]] | None,
) -> None:
    """Fill three character-card terms with the publisher ranking first."""

    characters = [str(item.get("char") or "") for item in lesson.get("characters", [])]
    terms_09 = han_runs(source_09)
    terms_06 = han_runs(source_06)
    word_items = [str(item.get("word") or "") for item in lesson.get("words", [])]

    for item in lesson.get("characters", []):
        char = str(item.get("char") or "")
        candidates: list[str] = []
        if common_examples:
            candidates.extend(common_examples.get(char, []))
        candidates.extend(FALLBACK_COMMON_TERMS.get(char, []))
        candidates.extend(
            term for term in terms_09 if char in term and 2 <= len(term) <= 8
        )
        candidates.extend(
            term for term in terms_06 if char in term and 2 <= len(term) <= 8
        )
        candidates.extend(word for word in word_items if char in word)
        existing = [str(value) for value in item.get("examples") or []]
        selected = list(dict.fromkeys([*(common_examples.get(char, []) if common_examples else []), *existing, *candidates]))
        # Remove source labels and single repeated-character artifacts such as
        # the comparison headings 「泳泳」 while retaining real terms like
        # 「溜溜」 only when an official vocabulary source also confirms them.
        known_terms = set(existing) | set(word_items) | set(terms_09)
        selected = [
            term
            for term in selected
            if len(term) >= 2 and (len(set(term)) > 1 or term in known_terms)
        ]
        item["examples"] = selected[:3]
        if common_examples:
            source_note = "康軒出版社生字頻率 Excel（康軒工作表；按分數取前三項）"
            if char == "遨" and "遨嬉" in item["examples"]:
                source_note += "；不足項目以教育部辭典補足"
            elif len(item["examples"]) < 3:
                source_note += "；原始來源不足三項，保留可核對詞例"
            item["examples_source"] = source_note
        else:
            item["examples_source"] = "康軒官方教材 09 生字解釋、06 字音字形；以官方來源順序補足"


def parse_sentence_patterns(lesson_no: int, source_dir: Path) -> list[dict]:
    path = next(source_dir.glob(f"*G4A{lesson_no:02d}_*/*data.json"), None)
    if path is None:
        return []
    data = read_json(path)
    held = set(data.get("astra_held_review_required_items") or [])
    output: list[dict] = []
    for page in data.get("pages") or []:
        for section in page.get("sections") or []:
            title = str(section.get("title") or "").strip()
            category, _, head = title.partition("　")
            items = [item for item in section.get("items") or [] if item.get("id") not in held]
            examples = [str(item.get("answer") or "").strip() for item in items]
            examples = list(dict.fromkeys(value for value in examples if value))
            if not head or not section.get("structure") or not section.get("explanation") or not examples:
                continue
            output.append(
                {
                    "id": f"sentence:{lesson_no:02d}:{len(output) + 1:02d}",
                    "category": category or "句型練習",
                    "head": head,
                    "structure": str(section.get("structure") or ""),
                    "description": str(section.get("explanation") or ""),
                    "guide": str(section.get("hint") or ""),
                    "examples": examples,
                    "example_parts": [
                        item.get("solution_parts")
                        for item in items
                        if isinstance(item.get("solution_parts"), list) and item.get("solution_parts")
                    ][:3],
                    "examples_status": "approved",
                    "status": "ready",
                    "source": "康軒四上官方教材（07 語句練習；v13 spacing reviewed，排除 REVIEW_REQUIRED 題目）",
                }
            )
    return output


def parse_idioms(lesson_no: int, title: str, source_text: str, chars: str) -> tuple[list[dict], list[dict]]:
    section = section_by_title(source_text, title)
    pattern = re.compile(
        rf"▼(?P<char>[{HAN}])\s*(?P<idiom>[{HAN}]{{4}})：(?P<definition>.*?)\s*例：(?P<example>.*?。)",
        re.S,
    )
    idioms: list[dict] = []
    sentences: list[dict] = []
    for match in pattern.finditer(section):
        related_char = match.group("char")
        if related_char not in chars:
            continue
        idiom = match.group("idiom")
        definition = re.sub(r"\s+", "", match.group("definition")).strip()
        example = re.sub(r"\s+", "", match.group("example")).strip()
        item_id = f"idiom:{lesson_no:02d}:{len(idioms) + 1:02d}"
        idioms.append(
            {
                "id": item_id,
                "idiom": idiom,
                "definition": definition,
                "related_char": related_char,
                "image": f"idioms/{len(idioms) + 1:02d}_{idiom}.webp",
                "status": "ready",
                "source": "康軒四上官方教材（04 生字延伸成語）",
            }
        )
        sentences.append(
            {
                "id": f"idiom-sentence:{lesson_no:02d}:{len(sentences) + 1:02d}",
                "idiom_id": item_id,
                "rewritten": example,
                "status": "approved",
                "source": "康軒四上官方教材（04 生字延伸成語；例句）",
            }
        )
    return idioms, sentences


def parse_polysemy(lesson_no: int, title: str, source_text: str, chars: str) -> tuple[list[dict], list[dict]]:
    section = section_by_title(source_text, title)
    runs = han_runs(section)
    pos_pattern = re.compile(r"^(?:動|名|形|副|量|連|介|代|助|嘆|數)(.+)$")
    senses: list[dict] = []
    index = 0
    while index < len(runs):
        match = pos_pattern.match(runs[index])
        if not match:
            index += 1
            continue
        definition = match.group(1).strip()
        following: list[str] = []
        cursor = index + 1
        while cursor < len(runs) and not pos_pattern.match(runs[cursor]):
            following.append(runs[cursor])
            cursor += 1
        examples = [value for value in following if len(value) <= 12 and any(char in value for char in chars)]
        if examples:
            counts = {char: sum(value.count(char) for value in examples) for char in chars}
            char = max(counts, key=counts.get)
            if counts[char] > 0:
                senses.append({"char": char, "definition": definition, "examples": examples[:5]})
        index = cursor

    by_char: dict[str, list[dict]] = {}
    for sense in senses:
        by_char.setdefault(sense["char"], []).append(sense)
    polysemy: list[dict] = []
    polysemy_senses: list[dict] = []
    for char, char_senses in by_char.items():
        if len(char_senses) < 2:
            continue
        definitions = list(dict.fromkeys(sense["definition"] for sense in char_senses if sense["definition"]))
        polysemy_senses.append({"char": char, "senses": char_senses})
        for sense in char_senses:
            definition = sense["definition"]
            options = list(dict.fromkeys([definition, *definitions]))[:4]
            example = sense["examples"][0]
            polysemy.append(
                {
                    "id": f"polysemy:{lesson_no:02d}:{len(polysemy) + 1:02d}",
                    "char": char,
                    "sentence": f"語詞「{example}」中的「{char}」，表示什麼意思？",
                    "definition": definition,
                    "options": options,
                    "status": "approved",
                    "source": "康軒四上官方教材（09 生字解釋；字義辨析）",
                }
            )
    return polysemy, polysemy_senses


POLYPHONE_ROWS: dict[int, dict[str, list[tuple[str, list[str]]]]] = {
    1: {"轉": [("ㄓㄨㄢˇ", ["轉身", "轉彎"]), ("ㄓㄨㄢˋ", ["轉圈", "公轉"])]},
    3: {
        "彈": [("ㄊㄢˊ", ["彈力", "彈跳", "反彈", "彈奏"]), ("ㄉㄢˋ", ["彈珠", "子彈"])],
        "曾": [("ㄘㄥˊ", ["曾經", "不曾"]), ("ㄗㄥ", ["曾先生", "曾祖母"])],
        "與": [("ㄩˇ", ["贈與"]), ("ㄩˋ", ["參與", "與會"])],
    },
    4: {"宿": [("ㄙㄨˋ", ["食宿", "宿舍"]), ("ㄒㄧㄡˋ", ["星宿"])]},
    5: {"勒": [("ㄌㄜˋ", ["勒索", "懸崖勒馬"]), ("ㄌㄟ", ["勒緊", "勒死"])]},
    6: {
        "稱": [("ㄔㄥ", ["稱呼", "名稱"]), ("ㄔㄣˋ", ["稱職", "稱意"])],
        "磨": [("ㄇㄛˊ", ["折磨", "磨練", "研磨"]), ("ㄇㄛˋ", ["磨坊", "石磨"])],
    },
    8: {"濟": [("ㄐㄧˋ", ["經濟", "救濟", "同舟共濟"]), ("ㄐㄧˇ", ["人才濟濟", "濟南"])]},
    9: {"華": [("ㄏㄨㄚˊ", ["華麗", "精華"]), ("ㄏㄨㄚˋ", ["華山", "華佗"])]},
    10: {
        "扁": [("ㄅㄧㄢˇ", ["扁平", "扁鑽"]), ("ㄆㄧㄢ", ["扁舟"])],
        "旋": [("ㄒㄩㄢˊ", ["旋律", "旋轉", "旋球"]), ("ㄒㄩㄢˋ", ["旋風"])],
    },
    11: {"背": [("ㄅㄟˋ", ["背心", "違背"]), ("ㄅㄟ", ["背包", "背負"])]},
}


def parse_polyphones(lesson_no: int, title: str, source_text: str, chars: str) -> list[dict]:
    section = section_by_title(source_text, title)
    output: list[dict] = []
    for char, readings in POLYPHONE_ROWS.get(lesson_no, {}).items():
        if char not in chars:
            continue
        usable: list[dict] = []
        for zhuyin, examples in readings:
            found = [example for example in examples if example in section]
            if found:
                usable.append(
                    {
                        "zhuyin": zhuyin,
                        "dabutie_zhuyin": zhuyin,
                        "senses": [{"definition": "官方字音字形辨析中的例詞。", "examples": found}],
                    }
                )
        if len(usable) >= 2:
            output.append(
                {
                    "id": f"polyphone:{lesson_no:02d}:{char}",
                    "char": char,
                    "readings": usable,
                    "status": "ready",
                    "source": "康軒四上官方教材（06 字音字形；多音例詞經來源文字核對）",
                }
            )
    return output


def parse_official_listening(lesson_no: int, title: str, source_text: str) -> list[dict]:
    section = clean_text(section_by_title(source_text, title))
    pairs: list[tuple[str, str]] = []
    previous_end = 0
    # Splitting by the official answer parentheses avoids catastrophic
    # backtracking on the legacy .doc's embedded drawing streams (especially
    # the final lesson, which contains a large non-text tail).
    pair_pattern = re.compile(r"[（(](?P<answer>[^）)]{2,})[）)]")
    for match in pair_pattern.finditer(section):
        before = section[previous_end : match.start()]
        question_end = before.rfind("？")
        if question_end < 0:
            previous_end = match.end()
            continue
        number_matches = list(re.finditer(r"\d+\.", before[: question_end + 1]))
        if number_matches:
            question_start = number_matches[-1].end()
        else:
            question_start = max(before.rfind("\r"), before.rfind("\n")) + 1
        question = re.sub(r"\s+", "", before[question_start : question_end + 1]).strip()
        answer = re.sub(r"\s+", "", match.group("answer")).strip()
        previous_end = match.end()
        if not question or not answer or "學生自由作答" in answer:
            continue
        answer = answer.split("例如：", 1)[0].strip("。；，")
        if len(answer) > 80:
            answer = answer[:80].rstrip("，；") + "……"
        if len(answer) >= 2:
            pairs.append((question, answer))
    # Keep short, source-complete items first.  The public activity is a
    # 3-question round; the source itself supplies more than three per lesson.
    pairs = list(dict.fromkeys(pairs))
    selected = pairs[:3]
    if len(selected) < 3:
        return []
    distractors = [answer for _, answer in pairs[3:] if answer not in {item[1] for item in selected}]
    output: list[dict] = []
    for index, (question, answer) in enumerate(selected, start=1):
        choices = [answer]
        for candidate in distractors:
            if candidate not in choices:
                choices.append(candidate)
            if len(choices) == 3:
                break
        if len(choices) < 3:
            continue
        # Rotate the correct answer so every round does not train first-choice
        # guessing, while retaining deterministic output.
        rotation = (index - 1) % len(choices)
        choices = choices[rotation:] + choices[:rotation]
        output.append(
            {
                "id": f"listening:{lesson_no:02d}:{index:02d}",
                "stem": question,
                "question": question,
                "options": choices,
                "answer": answer,
                "status": "approved",
                "source": "康軒四上官方教材（15 閱讀理解；官方問答抽取）",
            }
        )
    return output


def module_status(label: str, activity: str, available: bool, note: str = "") -> dict:
    value = {"label": label, "status": "available" if available else "missing", "activity": activity}
    if note:
        value["note"] = note
    return value


RHETORIC_NUMBER_MARKER = r"(?:[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]|[⑴⑵⑶⑷⑸⑹⑺⑻⑼⑽⑾⑿⒀⒁⒂⒃⒄⒅⒆⒇]|[（(]\d+[）)])"
RHETORIC_SOURCE_NOTE = re.compile(r"\s*[（(](?:擬人|視覺|聽覺|嗅覺|味覺|觸覺|每段結尾)[）)]\s*$")


def split_rhetoric_examples(example: str) -> list[str]:
    """Split every numbered official example into a separate quiz item."""
    parts = re.split(rf"(?={RHETORIC_NUMBER_MARKER})", example)
    cleaned = []
    for part in parts:
        value = re.sub(rf"^{RHETORIC_NUMBER_MARKER}\s*", "", part).strip()
        value = RHETORIC_SOURCE_NOTE.sub("", value).strip()
        if value:
            cleaned.append(value)
    return cleaned or [example.strip()]


def _unique_longest_terms(terms: Iterable[str]) -> list[str]:
    selected: list[str] = []
    for term in sorted({term.strip() for term in terms if term and term.strip()}, key=len, reverse=True):
        if not any(term in existing for existing in selected):
            selected.append(term)
    return selected


def repeated_rhetoric_terms(example: str) -> list[str]:
    """Return only exact, visibly repeated Chinese terms; fail closed otherwise."""
    terms: list[str] = []
    terms.extend(match.group(0) for match in re.finditer(rf"([{HAN}])\1+", example))
    for length in range(min(12, len(example) // 2), 1, -1):
        for start in range(0, len(example) - length + 1):
            candidate = example[start : start + length]
            if not re.fullmatch(rf"[{HAN}]{{{length}}}", candidate):
                continue
            if example.count(candidate) >= 2:
                terms.append(candidate)
    return _unique_longest_terms(terms)


def infer_rhetoric_highlights(figure: str, example: str) -> list[str]:
    """Infer only high-confidence visual clues from the official answer figure.

    Uncertain figures intentionally return no terms instead of colouring an
    arbitrary portion of the sentence.
    """
    if figure == "譬喻":
        return _unique_longest_terms(re.findall(r"(?:就)?(?:像|有如)[^，。！？；!?]+", example))
    if figure == "設問":
        return _unique_longest_terms(re.findall(r"[^。！？!?]*[？?]", example))
    if figure == "感嘆":
        return _unique_longest_terms(re.findall(r"[^。！？!?]*?(?:啊|呀|唉|哇|哪)[！!]", example))
    if figure in {"類疊", "排比"}:
        return repeated_rhetoric_terms(example)
    return []


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--workspace-root", type=Path, required=True)
    parser.add_argument("--repo-root", type=Path, required=True)
    parser.add_argument("--workbook", type=Path)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    workspace = args.workspace_root.resolve()
    repo = args.repo_root.resolve()
    workbook_path = args.workbook.resolve() if args.workbook else None
    if workbook_path and not workbook_path.exists():
        raise SystemExit(f"找不到常用度 Excel：{workbook_path}")
    common_examples: dict[str, list[str]] = {}
    if workbook_path:
        from generate_lessons import load_common_examples

        common_examples = load_common_examples(workbook_path, 4, "康軒")
        if not common_examples:
            raise SystemExit("常用度 Excel 沒有讀到康軒工作表資料")
    official = workspace / "worksheet-batches" / "115" / "115G4A_國語 康" / "01_本學年官方教材"
    source_files = {
        "idioms": official / "04.國語4上生字延伸成語" / "國小國語4上生字延伸成語.doc",
        "polyphones": official / "06.國語4上字音字形" / "國小國語4上字音字形.doc",
        "sentences": official / "07.國語4上語句練習" / "國小國語4上語句練習.doc",
        "polysemy": official / "09.國語4上生字解釋" / "國小國語4上生字解釋.doc",
        "rhetoric": official / "10.國語4上修辭分析" / "國小國語4上修辭分析.doc",
        "listening": official / "15.國語4上閱讀理解" / "國小國語4上閱讀理解.doc",
    }
    missing = [str(path) for path in source_files.values() if not path.exists()]
    if missing:
        raise SystemExit("缺少官方來源：\n" + "\n".join(missing))

    source_texts = {key: read_doc(path) for key, path in source_files.items()}
    output_dir = repo / "apps" / "mandarin" / "public" / "data" / "115AG4K"
    sentence_root = workspace / "sped-os-github" / "30-materials" / "worksheets" / "zaoju_juxing" / "source" / "115AG4"
    report: list[dict] = []
    for lesson_no, title in enumerate(LESSON_TITLES, start=1):
        print(f"[G4A] L{lesson_no:02d} processing", flush=True)
        path = output_dir / f"lesson{lesson_no:02d}.json"
        lesson = read_json(path)
        chars = "".join(str(item.get("char") or "") for item in lesson.get("characters", []))
        parse_common_terms(
            lesson,
            source_texts["polyphones"],
            section_by_title(source_texts["polysemy"], title),
            common_examples,
        )

        idioms, idiom_sentences = parse_idioms(lesson_no, title, source_texts["idioms"], chars)
        patterns = parse_sentence_patterns(lesson_no, sentence_root)
        polysemy, polysemy_senses = parse_polysemy(lesson_no, title, source_texts["polysemy"], chars)
        polyphones = parse_polyphones(lesson_no, title, source_texts["polyphones"], chars)
        listening = parse_official_listening(lesson_no, title, source_texts["listening"])

        rhetoric_section = section_by_title(source_texts["rhetoric"], title)
        rhetoric_pattern = re.compile(
            rf"(?:⒈|⒉|⒊|⒋|●)\s*(?P<figure>[^\r\n\t]+?)\s*\r?\s*定義\t(?P<note>.*?)\r?\s*例句\t(?P<example>.*?)\r?\s*解析\t(?P<analysis>.*?)(?=(?:\r?\s*(?:⒈|⒉|⒊|⒋|●))|$)",
            re.S,
        )
        rhetoric = []
        for match in rhetoric_pattern.finditer(clean_text(rhetoric_section)):
            figure = re.sub(r"\s+", "", match.group("figure")).strip()
            note = re.sub(r"\s+", "", match.group("note")).strip()
            example = re.sub(r"\s+", "", match.group("example")).strip()
            if not figure or not example:
                continue
            for example_part in split_rhetoric_examples(example):
                rhetoric.append(
                    {
                        "id": f"rhetoric:{lesson_no:02d}:{len(rhetoric) + 1:02d}",
                        "figure": figure,
                        "note": note,
                        "example": example_part,
                        "highlight_terms": infer_rhetoric_highlights(figure, example_part),
                        "child_note": f"{figure}：{note}",
                        "status": "approved",
                        "source": "康軒四上官方教材（10 修辭分析；官方例句拆題）",
                    }
                )

        lesson["idioms"] = idioms
        lesson["idiom_sentences"] = idiom_sentences
        lesson["sentence_patterns"] = patterns
        lesson["polysemy"] = polysemy
        lesson["polysemy_senses"] = polysemy_senses
        lesson["polyphones"] = polyphones
        lesson["listening"] = listening
        lesson["rhetoric"] = rhetoric
        lesson["extensions"] = [
            {
                "id": f"ext:stroke-115ag4k-{lesson_no:02d}",
                "status": "approved",
                "url": "https://gsyan888.github.io/html5_fun/html5_stroke_parts/html5_stroke_parts.html?by=gsyan&words=" + quote(chars, safe=""),
                "title": "筆順練習(雄筆順)",
                "provider": "雄::gsyan 筆順練習選單",
                "type": "reading",
                "module": "characters",
                "compact": True,
                "version_note": f"115上・康軒・4年級・第{lesson_no}課",
                "login_required": False,
                "checked_at": "2026-09-26",
                "note": f"已帶入本課{len(chars)}個生字",
            }
        ]

        for key, locator in [
            ("idioms", "04 生字延伸成語"),
            ("sentences", "07 語句練習"),
            ("polysemy", "09 生字解釋"),
            ("polyphones", "06 字音字形"),
            ("listening", "15 閱讀理解"),
            ("rhetoric", "10 修辭分析"),
        ]:
            add_source_audit(lesson, f"{locator}／第{lesson_no}課", source_files[key])

        modules = lesson.setdefault("modules", {})
        modules["idiom_builder"] = module_status("生字變成語", "idiom-builder", len(idioms) >= 3, "官方成語不足 3 題。" if len(idioms) < 3 else "")
        modules["sentence_practice"] = module_status("練習句子", "sentence-practice", len(patterns) >= 3, "官方核准句型不足 3 組。" if len(patterns) < 3 else "")
        modules["polysemy"] = module_status("一字多義", "polysemy", len(polysemy) >= 3, "官方字義辨析不足 3 題。" if len(polysemy) < 3 else "")
        modules["polyphones"] = module_status("一字多音", "polyphones", sum(len(item.get("readings") or []) for item in polyphones) >= 2, "06 文件本課未達兩個可核對讀音。" if sum(len(item.get("readings") or []) for item in polyphones) < 2 else "")
        modules["listening"] = module_status("聽聽看", "listening-quiz", len(listening) >= 3, "官方閱讀理解可核對問答不足 3 題。" if len(listening) < 3 else "")
        modules["rhetoric"] = module_status(
            "修辭小偵探",
            "rhetoric",
            len(rhetoric) >= 1,
            "官方本課題數少於 3 題，仍開放來源題目。" if 0 < len(rhetoric) < 3 else "官方修辭分析沒有可核對題目。" if not rhetoric else "",
        )

        report.append(
            {
                "lesson": lesson_no,
                "characters": len(lesson.get("characters", [])),
                "character_examples_below_3": sum(len(item.get("examples") or []) < 3 for item in lesson.get("characters", [])),
                "idioms": len(idioms),
                "sentence_patterns": len(patterns),
                "polysemy": len(polysemy),
                "polyphones": sum(len(item.get("readings") or []) for item in polyphones),
                "listening": len(listening),
                "rhetoric": len(rhetoric),
            }
        )
        print(
            f"[G4A] L{lesson_no:02d} idioms={len(idioms)} patterns={len(patterns)} polysemy={len(polysemy)} polyphones={sum(len(item.get('readings') or []) for item in polyphones)} listening={len(listening)} rhetoric={len(rhetoric)}",
            flush=True,
        )
        if not args.dry_run:
            write_json(path, lesson)

    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
