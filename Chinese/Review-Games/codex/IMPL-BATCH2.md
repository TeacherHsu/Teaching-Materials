# 派工：視覺重整第 2 批（P1：T08–T13，四款棋盤）

請實作 `VISUAL-REVIEW.md` 第 11 節 **T08～T13**：共用材質／光色／程序環境圖／陰影按需／品質分級與資源重用（T08）、骰子同步與連續同點數（T09）、大富翁構圖與物件層級（T10）、蛇梯路徑與動畫（T11）、哆寶薄卡發牌與配對回饋（T12）、賓果薄格與三方向連線（T13）。

## Claude 驗收第 1 批時看到、本批必須一併修好的問題（截圖：/tmp/rg-shots/b1-*.png）
1. **蛇梯棋**：第 1 批的 DOM 格號／方向／特殊格標籤把 30 格幾乎全部蓋滿，棋盤、蛇、梯子都看不見（b1-snakes.png）。要重新設計：格號小而清楚地貼在格子一角（像印在格面上的位置），特殊規則只在必要時以小牌呈現，方向用細箭頭；整體要讓棋盤圖面是主角。必要資訊仍須在 DOM、字 ≥22px（可用較小的輔助字 ≥16px 給方向／步數），但不可覆蓋格子主體超過約 35%。
2. **大富翁**：DOM 標籤擠在棋盤外緣、互相貼著、格子本體被遮（b1-monopoly.png）。標籤要與格子對位、像格面上的牌，不像浮在上面的網頁標籤。
3. 兩款都要達到「棋盤畫面本身有質感、讀得出空間」——這是 CF 的核心抱怨。

## 共同紀律（每批都適用）
- 依據：`Chinese/Review-Games/codex/VISUAL-REVIEW.md`（你自己寫的審查報告）。照該報告的工作包、參數與驗收做；報告與現況衝突時以「不破壞玩法」為先，並在報告附錄寫明。
- 標準：CF 要求 3D 至少達到 `Chinese/Shape-Run-G6A/index.html`（跑酷）的流暢度、情境帶入感與畫面細緻度。不要只加特效，要修構圖、材質、光影、因果與狀態。
- **不要跑任何 git 指令**；只改 `Chinese/Review-Games/` 內檔案（不改 `data/*.js`、`tools/build_*.py`、`Shape-Run-*`、`apps/`）。
- 遊戲邏輯、出題、計分、學習紀錄、亂數序列不可改；新增美術亂數不得消耗遊戲用的 `Math.random()`（用獨立 seed）。
- 題目／選項／教學文字留 DOM；減少動態、WebGL 失敗回 2D；不加背景音樂、閃爍、排行榜、計時。
- 只能用 cdnjs three r128（＋既有 jsdelivr examples 後製檔），不引入新套件。
- 改了 JS/CSS 後，把引用它的 HTML 中 `?v=` 版本號加 1（無版本號的就加 `?v=3`）。
- 必過：`node --check` 所有改過的 JS（含 HTML inline script 抽出檢查）、`node --test Chinese/Review-Games/tests/*.cjs` 全綠、`python3 Chinese/Review-Games/tools/check_data.py` 全 ✅。可新增測試，不准刪改既有斷言讓它通過（除非斷言的是你依報告刻意改變的視覺內部格式，須在報告附錄說明）。
- 視覺驗收：本機已開靜態伺服器 `http://localhost:5191/`。可用 `node Chinese/Review-Games/tools/qa/cdp.mjs <url> <out.png> <script.js>` 截圖（每次前先 `rm -rf "$TMPDIR/rg-cdp-profile"`，跑完 `pkill -f remote-debugging-port=9333`）。截圖存到 `/tmp/rg-shots/after-*.png`，自己看過再交。
- 完成後在 `Chinese/Review-Games/codex/IMPL-LOG.md` 追加本批紀錄：做了哪些任務、改哪些檔、跑了哪些檢查與結果、截圖路徑、未完成／偏離報告之處。不得把沒做的寫成做了。
- 你的沙盒無法啟動 Chrome：截圖驗收由 Claude 執行。你仍要用 node 測試與程式碼檢查盡量保證正確，並在 IMPL-LOG 列出請 Claude 截圖的網址清單與要看的重點。
