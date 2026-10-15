# 派工：視覺重整第 1 批（P0：T01–T07）

請實作 `VISUAL-REVIEW.md` 第 11 節的 **T01～T07**（全部 P0）：驗收情境基線、大富翁／蛇梯可見 DOM 標籤、蛇有效路線與落點一致、賓果全盤與狀態可讀、哆寶詞義版面、密室中途降級與錯誤收斂、密室標記避碰與完整文字入口。

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
