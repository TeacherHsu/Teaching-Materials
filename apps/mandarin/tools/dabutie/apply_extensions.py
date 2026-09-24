#!/usr/bin/env python3
"""把研究 agent 產出的延伸練習候選連結（~/mandarin-work/115AG3H/extensions/
lessonNN.candidates.json）併入對應 lesson JSON 的 `extensions[]`。

規格 docs/specs/2026-09-25-mandarin-dabutie-importer.md「延伸練習連結」一節：
- 以「網址正規化」當穩定 id，重跑（同一 url 再匯入一次）保留既有
  approved/rejected 決定，不會被打回 draft。
- 候選新進來一律 status: draft，等教師在待審頁（ReviewPage.js）核准。
- 不驗證網域白名單（那是 scripts/validate-data.mjs 的責任），但會擋掉非
  https 網址（大聲失敗，不靜默丟棄）。

candidates JSON 格式（陣列）：
[
  {
    "url": "https://wordwall.net/tc/resource/...",
    "title": "生字選字遊戲",
    "provider": "Wordwall",
    "type": "game",
    "module": "characters",
    "version_note": "通用",
    "login_required": false,
    "note": "選字配對",
    "char": "待"   # 選填，module=characters 且 type=reading 時可用
  },
  ...
]

用法：
  python3 tools/dabutie/apply_extensions.py <candidates.json> <lesson.json>
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from common import read_json, write_json, stable_id  # noqa: E402

# 候選欄位裡，即使教師之後手動修訂，重跑時仍以候選來源為準覆寫的欄位
# （status／id 除外，那兩個由本腳本自己管理，見 merge_candidate）。
OVERWRITE_FIELDS = [
    "url", "title", "provider", "type", "module",
    "version_note", "login_required", "checked_at", "note", "char",
]

# 研究 agent 目前實際輸出的欄位名稱與本規格欄位名稱不一致（規格「延伸練習
# 連結」一節「已知落差」段），套用前先做欄位對映：舊名 → 規格名。
FIELD_ALIASES = {
    "edition_note": "version_note",
    "needs_login": "login_required",
    "checked_date": "checked_at",
}

# 只用來輔助人工判讀、不是 lesson JSON 正式欄位；直接忽略（不併入 note，
# 因為 note 有 25 字上限，塞課次說明容易超過）。
IGNORED_FIELDS = ["matched_lesson"]

# 教師判讀「是否含廣告／不當內容」的欄位；為真時直接拒收該筆候選。
ADS_FIELD = "ads_or_inappropriate"

_TRUE_STRINGS = {"是", "true", "yes", "y", "1"}
_FALSE_STRINGS = {"否", "無", "false", "no", "n", "0", ""}


def _to_bool(value, default_if_ambiguous: bool = True) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    text = str(value).strip()
    if text in _TRUE_STRINGS:
        return True
    if text in _FALSE_STRINGS:
        return False
    return default_if_ambiguous


# 「無」／「否」開頭的長敘述（例如研究 agent 常寫「未見不當內容，YouTube
# 平台前後可能插入一般廣告，教師播放前建議先確認」）視為「沒有問題」，
# 只是附加說明；其餘敘述保守視為「有問題」，擋下拒收。
_ADS_FALSE_PREFIXES = ("無", "未見", "沒有", "否")


def _ads_flag_is_true(value) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    text = str(value).strip()
    if text in _FALSE_STRINGS:
        return False
    if any(text.startswith(prefix) for prefix in _ADS_FALSE_PREFIXES):
        return False
    if text in _TRUE_STRINGS:
        return True
    return True


def normalize_candidate(raw: dict) -> dict:
    """把研究 agent 實際輸出欄位對映成規格欄位名稱，回傳新 dict（不動原物件）。
    ads_or_inappropriate 判定為真時丟 ValueError，由呼叫端擋下並警告、不收。
    """
    c = dict(raw)

    if ADS_FIELD in c:
        ads_raw = c.pop(ADS_FIELD)
        if _ads_flag_is_true(ads_raw):
            raise ValueError(
                f"候選連結疑似含廣告或不當內容，拒收：{c.get('url')}（{ADS_FIELD}={ads_raw!r}）"
            )

    for old_name, new_name in FIELD_ALIASES.items():
        if old_name in c:
            c[new_name] = c.pop(old_name)

    if "login_required" in c:
        c["login_required"] = _to_bool(c["login_required"], default_if_ambiguous=False)

    for field in IGNORED_FIELDS:
        c.pop(field, None)

    return c


def normalize_url(url: str) -> str:
    """正規化網址：小寫 scheme/host、去掉結尾斜線與 fragment，供穩定 id 使用。
    不動 query（wordwall 等站台常靠 query 帶資源 id）。"""
    if not url.startswith("https://"):
        raise ValueError(f"延伸練習連結必須是 https：{url}")
    parts = urlsplit(url)
    path = parts.path.rstrip("/") or ""
    normalized = urlunsplit((parts.scheme.lower(), parts.netloc.lower(), path, parts.query, ""))
    return normalized


def extension_id(url: str) -> str:
    return stable_id("ext", normalize_url(url))


def merge_candidates(
    lesson: dict, candidates: list[dict], rejected: list[str] | None = None
) -> tuple[int, int]:
    """回傳 (新增數, 更新既有欄位但保留審核狀態數)。
    若 rejected 傳入一個 list，因 ads_or_inappropriate 被拒收的候選警告訊息
    會 append 進去（呼叫端可用來印出、不會靜默丟棄）。
    """
    existing = lesson.get("extensions") or []
    existing_by_id = {e["id"]: e for e in existing if isinstance(e, dict) and e.get("id")}

    merged: list[dict] = []
    seen_ids = set()
    added = 0
    kept = 0
    for raw in candidates:
        try:
            c = normalize_candidate(raw)
        except ValueError as exc:
            if rejected is not None:
                rejected.append(str(exc))
            continue
        ext_id = extension_id(c["url"])
        seen_ids.add(ext_id)
        prior = existing_by_id.get(ext_id)
        status = prior["status"] if prior and prior.get("status") in ("draft", "approved", "rejected") else "draft"
        item = {"id": ext_id, "status": status}
        for field in OVERWRITE_FIELDS:
            if field in c:
                item[field] = c[field]
            elif prior and field in prior:
                item[field] = prior[field]
        if prior and prior.get("review_note"):
            item["review_note"] = prior["review_note"]
        merged.append(item)
        if prior is None:
            added += 1
        else:
            kept += 1

    # 候選清單以外、但先前已存在（例如教師手動核准過）的連結一律保留，
    # 避免研究 agent 這次沒重新回報就被誤刪。
    for e in existing:
        if isinstance(e, dict) and e.get("id") and e["id"] not in seen_ids:
            merged.append(e)

    lesson["extensions"] = merged
    return added, kept


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("candidates_json")
    ap.add_argument("lesson_json")
    args = ap.parse_args()

    candidates = read_json(Path(args.candidates_json))
    if not isinstance(candidates, list):
        print("[失敗] candidates JSON 必須是陣列", file=sys.stderr)
        sys.exit(2)

    lesson_path = Path(args.lesson_json)
    lesson = read_json(lesson_path)

    rejected: list[str] = []
    added, kept = merge_candidates(lesson, candidates, rejected=rejected)
    write_json(lesson_path, lesson)
    for warning in rejected:
        print(f"[警告] {warning}", file=sys.stderr)
    print(
        f"套用延伸練習候選 → {lesson_path}：新增 {added} 筆，保留/更新既有 {kept} 筆，"
        f"拒收 {len(rejected)} 筆。"
    )


if __name__ == "__main__":
    main()
