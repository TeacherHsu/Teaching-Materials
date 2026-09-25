#!/usr/bin/env bash
# 重跑安全驗證：備份目前 lesson JSON → 從零重建（import_lesson.py＋apply_rewrites.py）
# → 與備份做「排序無關」語意 diff，除已知可接受差異外必須一致。
# 用法：
#   tools/dabutie/rebuild_check.sh <SRC 大補帖根目錄> [LESSON_NO] [WORK_DIR]
# 例：
#   tools/dabutie/rebuild_check.sh ~/mandarin-work/115AG3H/raw/大補帖 1 ~/mandarin-work/115AG3H
set -euo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SRC="${1:?用法: rebuild_check.sh <大補帖根目錄> [課次] [work目錄]}"
LESSON_NO="${2:-1}"
WORK="${3:-$HOME/mandarin-work/115AG3H}"
LESSON_TAG=$(printf "lesson%02d" "$LESSON_NO")
OUT="$APP_ROOT/public/data/115AG3H/${LESSON_TAG}.json"
REWRITES="$WORK/rewrites/${LESSON_TAG}.json"
EXTENSIONS="$WORK/extensions/${LESSON_TAG}.candidates.json"
BACKUP=$(mktemp -t "${LESSON_TAG}.backup.XXXXXX.json")

if [ ! -f "$OUT" ]; then
  echo "[跳過] 找不到既有輸出 $OUT，無從比對，先手動跑過一次 import_lesson.py。" >&2
  exit 2
fi
cp "$OUT" "$BACKUP"
echo "備份：$BACKUP"

cd "$APP_ROOT/tools/dabutie"
rm -f "$OUT"
python3 import_lesson.py --src "$SRC" --lesson "$LESSON_NO" --work "$WORK" --out "$OUT"
if [ -f "$REWRITES" ]; then
  python3 apply_rewrites.py "$REWRITES" "$OUT"
else
  echo "[提醒] 找不到 $REWRITES，本次重建不含改寫內容。" >&2
fi

# extensions 非大補帖抽取來源，import_lesson.py 只能從既有輸出檔繼承；
# 這裡 OUT 已被刪除重建，比照 REWRITES 的做法，從 work/extensions/ 候選檔
# 重新套用一次，讓「延伸練習連結」也納入重跑安全驗證。
if [ -f "$EXTENSIONS" ]; then
  python3 apply_extensions.py "$EXTENSIONS" "$OUT"
else
  echo "[提醒] 找不到 $EXTENSIONS，本次重建不含延伸練習連結。" >&2
fi

# 教師審核決定（apply_review.py --work 累積存檔）也要重新套用，否則從零重建會把 approved 打回 draft。
REVIEWS="$WORK/reviews/lesson$(printf '%02d' "$LESSON_NO").json"
if [ -f "$REVIEWS" ]; then
  python3 apply_review.py --no-save "$REVIEWS" "$OUT"
fi

python3 - "$BACKUP" "$OUT" <<'PY'
import json
import sys

backup_path, out_path = sys.argv[1], sys.argv[2]
a = json.load(open(backup_path, encoding="utf-8"))
b = json.load(open(out_path, encoding="utf-8"))

# 已知可接受差異：v1 遺留欄位 sentences 的 source 文字、rhetoric.source 從
# 「未取得」佔位字串更新為實際 11修辭總表來源（規格 §3 修 rerun-safety 批次
# 已把 rhetoric 例句改由 word_meanings/11修辭總表 反向歸課正確來源標注）。
IGNORE_KEYS = {"sentences"}


def norm(x):
    if isinstance(x, list):
        try:
            return sorted(
                (norm(i) for i in x),
                key=lambda v: json.dumps(v, sort_keys=True, ensure_ascii=False),
            )
        except TypeError:
            return [norm(i) for i in x]
    if isinstance(x, dict):
        return {k: norm(v) for k, v in x.items()}
    return x


keys = (set(a) | set(b)) - IGNORE_KEYS
bad = []
for k in sorted(keys):
    if norm(a.get(k)) != norm(b.get(k)):
        bad.append(k)

if bad:
    print(f"[FAIL] 重跑後與備份不一致的欄位：{bad}")
    sys.exit(1)
print("[PASS] 重跑結果與備份語意一致（排序無關；sentences 為已知可忽略的 v1 遺留欄位）。")
PY

echo "備份保留於：$BACKUP（確認 PASS 後可自行刪除）"
