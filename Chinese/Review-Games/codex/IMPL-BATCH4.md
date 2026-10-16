# 派工：視覺重整第 4 批（四款棋盤的情境與氛圍：T16＋Claude 驗收缺口）

本批只動四款棋盤：`scene3d.js`、`common.css`、`common.js`（只限視覺）、`monopoly.html`、`snakes.html`、`dobble.html`、`bingo.html`、相關 tests／tools/qa。**不要動 detective* 檔案**（Claude 同時在修）。

## 目標：讓四款棋盤達到跑酷級的情境帶入感
Claude 看第 2 批截圖（/tmp/rg-shots/b2-*.png）的結論：可讀性過關，但「畫面像網頁上放了一塊棋盤」，沒有世界觀與氛圍。請做：
1. **T16 開場與結尾**（VISUAL-REVIEW.md M-E、S-E、O-E、B-E）：每款一段可略過、≤1.2 秒的入場鏡頭（例如從桌邊斜角推到遊玩視角）、一句 DOM 任務短句；結束時世界留下完成痕跡（大富翁：書屋亮燈；蛇梯：終點旗升起；哆寶：整理好的卡盒；賓果：收藏盤蓋章）。減少動態時直接到位。
2. **環境**：棋盤周圍要有「閱讀探險工作室」的中景與遠景（桌緣、書本、檯燈光暈、窗光、柔和漸層背景或霧），取代空白奶油色畫布；低對比、不搶棋盤、不閃爍、靜態。參考跑酷的前中遠景與天空漸層手法（VISUAL-REVIEW 第 2 節）。
3. **哆寶**：第 2 批後兩張卡變成灰色平面框，失去立體感。要恢復成有厚度、紙質、輕微傾斜與接觸陰影的實體卡（仍維持文字在 DOM 且與卡對位），左右卡用暖橘／天藍邊。
4. **大富翁**：第 5 格「1步」步數標籤與課名重疊（b2-monopoly.png），修正避碰。
5. 移除面向學生的「3D 立體視圖・題目與操作保留大字」大橫條，改成小型畫面設定入口（審查 3.2 UI 層級）。
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
- 你的沙盒無法啟動 Chrome：截圖驗收由 Claude 執行。請在 IMPL-LOG 列出請 Claude 截圖的網址與要看的重點。
