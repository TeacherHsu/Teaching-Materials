# apps/mandarin（國語課文樂園）施工說明

> 本檔與 `AGENTS.md` 內容相同（Claude Code 讀 CLAUDE.md，其他 AI 讀 AGENTS.md）。修改時兩份同步改，以 AGENTS.md 為正本。
先讀 repo 根目錄的 `AGENTS.md`，裡面有開工、完工與交接的通用規則。本檔只寫這個子專案的細節。

## 架構一分鐘

- Vite + Vanilla JS，資料驅動。所有課次共用程式碼，新增一課只要加：
  - `public/data/<冊別>/lessonNN.json`
  - `public/assets/<冊別>/lessonNN/`
  - 在 `public/data/course-index.json` 登記
- **不要**為每一課複製一份程式，也不要把教材文字寫死在元件裡。
- 大項的註冊表在 `src/activities/moduleRegistry.js`（順序、顏色、圖示、開放條件）。
- 正式版只顯示 `status` 為 `ready` 或 `approved` 的內容。`draft` 只在網址加 `?preview=1` 或本機 `npm run dev` 時看得到。

## 這台電腦能做什麼

| 工作 | 需要什麼 | 哪台可以做 |
|---|---|---|
| 前端樣式與元件、修 bug | 只需要 repo | 任何一台 |
| 放插圖（見 `tools/dabutie/IMAGE-HANDOFF.md`） | 只需要 repo | 任何一台 |
| 重新匯入大補帖、改寫句子、套用審核 | `~/mandarin-work/`＋大補帖 zip＋Microsoft Word | **只有家裡 Mac** |
| 新增課次（批次匯入） | 同上 | **只有家裡 Mac** |

> 家裡 Windows 的 Codex 也有大補帖等官方教材，並已做好整套學習單（含各課成語圖）。但匯入器的 .doc 轉檔（`convert_doc.py`）目前用 macOS AppleScript 呼叫 Word，而且 `~/mandarin-work/` 的改寫與審核紀錄沒有同步到 Windows，所以 **Windows 目前仍不跑匯入流程**。Windows 最適合的工作是提供現成的成語插圖與學習單素材。若要讓 Windows 也能匯入，需要先把 `convert_doc.py` 改成 Word COM 版，並決定 `mandarin-work` 的同步方式（它含大補帖原文，**不可以**進公開 repo）。

沒有 `~/mandarin-work/` 的電腦**不要**執行 `tools/dabutie/import_lesson.py`、`rebuild_check.sh`、`apply_*.py`，也不要手動改 `public/data/*.json` 裡的教材內容。這些改動在下次重建時會被蓋掉，或和審核紀錄對不上。

## 驗證指令（完工前全部要通過）

```bash
cd apps/mandarin
npm ci                      # 第一次或 package-lock.json 有變動時
npm run validate
npm run build && npm run check-dist
for f in scripts/test-*.mjs; do node "$f" || exit 1; done
python3 -m pytest tools/dabutie/tests -q   # 有動到 tools/dabutie 時
```

有改畫面的話，另外用 `npm run build:preview && npm run preview:draft` 開起來看一次。手機寬度（375px）下不可以出現橫向捲動。

## 設計底線（CF 已確認，不要改回去）

- 對象是國小中年級，包含 ADHD、閱讀困難、學障的學生：
  - 正文 ≥22px，次要文字 ≥18px，觸控範圍 ≥44px
  - 一個畫面只放一個任務
  - 答錯先給提示，第二次才揭曉答案
- 所有學生會讀的文字都要有朗讀按鈕：
  - 按鈕只放喇叭圖示，不寫文字
  - 只用台灣國語語音，不可退回中國大陸口音
- 「做完了？再挑戰看看」延伸練習預設收合，避免提前看到答案。
- 動畫要尊重 prefers-reduced-motion。答對可以熱鬧，但不可持續閃爍，也不可擋住操作。
- 圖片是加分項目：缺圖不能壞版，檔名由資料明確指定，不猜檔名。
- 語詞來源：翰林版的目標語詞從大補帖「05 形音輕鬆學」的語詞解釋抽取；06 字義分析的造詞不算目標語詞。
- 一字多義、一字多音、形似字是三個獨立大項。
