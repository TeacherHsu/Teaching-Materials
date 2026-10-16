# 派工：視覺重整第 3 批（P1／P2：密室 T14、T15、T17）

請實作 `VISUAL-REVIEW.md` 第 11 節 **T14（密室持續狀態與成功接線）、T15（家具、光影、取景）、T17（六主題道具差異）**。本批只動密室檔案：`detective.html`、`detective.js`、`detective3d.js`、`detective.css`（必要時 tests、tools/qa）。不要動四款棋盤檔案。

## Claude 驗收時看到、本批必須修好的問題
1. **手機寬度（390×844）**：標記全部堆在 3D 畫面左下角，沒有對到物件（/tmp/rg-shots/b1-det390.png）。避碰演算法在窄畫面要以物件投影點為中心就近放置，放不下時改成小圓點＋清單，不可整批擠到角落。
2. CF 的標準是跑酷級：房間要有「劇情感」——開場鏡頭從門外／窗外推進房間（可略過、減少動態時直接到位）、窗光有方向、家具細緻（書架真的有書、抽屜把手、相框、窗框窗台、植物葉片）、找線索時紙卡飛進筆記本、解開機關後房間狀態持續改變（保險箱開著、布告欄貼好、齒輪停在完成位置）、最後開門有一束光照進來再到成果頁。
3. 不得有持續脈動或循環動畫（審查 D07）。

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
- 你的沙盒無法啟動 Chrome：截圖驗收由 Claude 執行。請在 IMPL-LOG 列出請 Claude 截圖的網址清單（含 qaRoom／qaWidth 參數）與要看的重點。
