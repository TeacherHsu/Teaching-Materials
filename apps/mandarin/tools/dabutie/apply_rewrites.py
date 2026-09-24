#!/usr/bin/env python3
"""套用改寫作業（REWRITE-GUIDE.md）：把 work 目錄 `rewrites/lesson<NN>.json`
（改寫後文字，不進 repo）寫回對應 lesson JSON 的欄位，並把 status 設為 draft
（等待教師在待審頁核准為 approved，本腳本不會自行核准）。

重跑 import_lesson.py 時，merge.py 已把 draft/approved/rejected 都視為既有
改寫予以保留（不會被清空），所以本腳本可以先套用，之後重跑匯入器不會遺失。

用法：
  python3 tools/dabutie/apply_rewrites.py <rewrites.json> <lesson.json>
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from common import read_json, write_json, desensitize_l0  # noqa: E402


def _apply_list(lesson_key: str, lesson: dict, rewrites: list[dict], fields: list[str]) -> int:
    by_id = {it["id"]: it for it in lesson.get(lesson_key) or []}
    applied = 0
    for rw in rewrites:
        item = by_id.get(rw["id"])
        if not item:
            print(f"警告：{lesson_key} 找不到 id={rw['id']}，略過")
            continue
        if item.get("status") in ("approved", "rejected"):
            # 教師已審核過，不可用改寫作業覆蓋
            continue
        for f in fields:
            if f in rw:
                item[f] = rw[f]
        item["status"] = "draft"
        applied += 1
    return applied


def _apply_upsert(lesson_key: str, lesson: dict, rewrites: list[dict], fields: list[str]) -> int:
    """listening 這類完全無大補帖來源、由教師原創的題目：rewrites 檔裡的筆數
    才是唯一正本，lesson JSON 裡對應 id 不存在時要新增（而非略過），這樣
    重跑 import_lesson.py（產生空殼）後再套用本檔仍能重建完整清單。"""
    items = lesson.setdefault(lesson_key, [])
    by_id = {it["id"]: it for it in items if isinstance(it, dict) and it.get("id")}
    applied = 0
    for rw in rewrites:
        item = by_id.get(rw["id"])
        if item is None:
            item = {"id": rw["id"]}
            items.append(item)
            by_id[rw["id"]] = item
        elif item.get("status") in ("approved", "rejected"):
            continue
        for f in fields:
            if f in rw:
                item[f] = rw[f]
        item["status"] = "draft"
        item.setdefault("source", "original:draft（教師自撰，無對應大補帖來源）")
        applied += 1
    return applied


def apply_rewrites(lesson: dict, rewrites: dict) -> int:
    applied = 0
    applied += _apply_list("idiom_sentences", lesson, rewrites.get("idiom_sentences", []), ["rewritten"])
    applied += _apply_list("paragraph_summary", lesson, rewrites.get("paragraph_summary", []), ["summary"])
    applied += _apply_list("reading_questions", lesson, rewrites.get("reading_questions", []), ["stem", "answer_hint"])
    applied += _apply_list("rhetoric", lesson, rewrites.get("rhetoric", []), ["example", "child_note"])
    applied += _apply_list("polysemy", lesson, rewrites.get("polysemy", []), ["sentence"])
    applied += _apply_upsert("listening", lesson, rewrites.get("listening", []), ["stem", "question", "options", "answer"])

    # sentence_patterns：examples 欄位＋獨立的 examples_status（因為 status 本身代表「結構」是否可公開，
    # 恆為 ready；改寫審核狀態記在 examples_status）。
    sp_by_id = {it["id"]: it for it in lesson.get("sentence_patterns") or []}
    for rw in rewrites.get("sentence_patterns", []):
        item = sp_by_id.get(rw["id"])
        if not item:
            print(f"警告：sentence_patterns 找不到 id={rw['id']}，略過")
            continue
        if item.get("examples_status") in ("approved", "rejected"):
            continue
        item["examples"] = rw.get("examples", [])
        item["examples_status"] = "draft"
        applied += 1

    # main_idea：單一物件
    mi_rw = rewrites.get("main_idea")
    if mi_rw:
        mi = lesson.get("main_idea") or {}
        if mi.get("id") == mi_rw.get("id") and mi.get("status") not in ("approved", "rejected"):
            mi["gist"] = mi_rw.get("gist", mi.get("gist"))
            mi["theme"] = mi_rw.get("theme", mi.get("theme"))
            mi["status"] = "draft"
            lesson["main_idea"] = mi
            applied += 1
        elif mi.get("id") != mi_rw.get("id"):
            print(f"警告：main_idea id 不一致（lesson={mi.get('id')}，rewrites={mi_rw.get('id')}），略過")

    return applied


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("rewrites_json")
    ap.add_argument("lesson_json")
    args = ap.parse_args()

    rewrites = read_json(Path(args.rewrites_json))
    lesson_path = Path(args.lesson_json)
    lesson = read_json(lesson_path)

    if rewrites.get("lesson_id") != lesson.get("lesson_id"):
        print(f"警告：rewrites lesson_id={rewrites.get('lesson_id')} 與檔案 lesson_id="
              f"{lesson.get('lesson_id')} 不一致，仍繼續套用（以 id 比對為準）。")

    applied = apply_rewrites(lesson, rewrites)
    write_json(lesson_path, desensitize_l0(lesson))
    print(f"套用 {applied} 筆改寫 → {lesson_path}")


if __name__ == "__main__":
    main()
