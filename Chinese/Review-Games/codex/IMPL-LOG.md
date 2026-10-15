# 視覺重整實作紀錄

## 2026-10-16｜Codex｜第一批 T01–T07｜程式已實作，瀏覽器驗收受阻

### 工作與檔案

- T01：`tools/qa/p0-baseline.json` 留存修改前六個頁面／核心檔雜湊、全部題庫雜湊、seed=271828、驗收參數。`tools/qa/p0-fixture.js` 提供同格四隊、蛇規則、4/6/8 詞（依支持程度）、賓果尺寸與分隊、密室最後線索／最後門狀態；只由 QA 呼叫，不引入正式頁面。密室末段用原核心 API 依答案解前置題，不篡改資料／判分。`tools/qa/cdp.mjs` 支援 qaWidth／qaHeight，Chrome 失敗顯示明確錯誤。
- T02：`scene3d.js` 新增可見 DOM 格號／課次／方向／特殊格／隊伍／所有權／步數層，按實際矩形避碰；移除必要格名與步數 Sprite。`monopoly.html`、`snakes.html` 補方向資料；`common.css` 增字級與狀態層樣式。3D 模式原棋盤 aria-hidden，避免重複讀屏；切回 2D 還原。
- T03：`snakes.html` 計算僅視圖用的 visualSnakes，2D SVG／標牌及 3D 路線同用有效落點；原規則常數與 play 不改。
- T04：`bingo.html` 桌面左任務右棋盤，穩定隊卡；真 DOM 狀態與完整 aria-label。`common.css` 限棋盤寬高、容許長詞換行、移除小字狀態偽元素。
- T05：`common.css` 統一穩定詞槽、自然延展詞義；`dobble.html` 雙人詞義焦點接線。沿用既有抽題與全部 Math.random 呼叫，未增加美術亂數。
- T06：`detective3d.js` 增 reduce／body calm／visibility 監聽、載入後重查、frame 例外與 context loss 收斂、補間完成／清理、資源去重釋放；移除待機 pulse。`detective.js` 當局減少動態切換保留進度。
- T07：`detective3d.js` 標記編號／當前目標全名／矩形避碰／狀態安全區；`detective.js` 清單加入每個 holder 與 station 同編號全名入口；`detective.css` 字級與可操作清單。
- 快取版本：所有引用本批 CSS／JS 的 `index.html`、`monopoly.html`、`snakes.html`、`dobble.html`、`bingo.html`、`detective.html` 的對應 `?v=` 加 1，原無版本的加 v=3。
- `tests/p0-visual.test.cjs` 新增 8 項狀態／生命週期／矩形／資料雜湊測試。既有測試與斷言完全保留。`codex/VISUAL-REVIEW.md` 附錄記錄實作差異與驗收缺口。

### 檢查結果

- `node --check`：scene3d.js、detective3d.js、detective.js、tests/p0-visual.test.cjs、tools/qa/p0-fixture.js、tools/qa/cdp.mjs；全部通過。
- 六份 HTML 的所有 inline script 抽到 `/tmp/rg-*.js` 執行 `node --check`；全部通過。
- `node --test Chinese/Review-Games/tests/*.cjs`：39/39 通過（原 31＋新增 8），未刪改原斷言。
- `python3 Chinese/Review-Games/tools/check_data.py`：五年級全部 ✅；二上既有跨課重複語詞提醒保留。
- 核心及 data/*.js 的 SHA256 基線檢查通過；沒有修改題庫、生成器、apps 或跑酷，也沒有執行 git 指令。

### 截圖與未完成驗收

- 嘗試 `cdp.mjs http://localhost:5191/Chinese/Review-Games/snakes.html?g=G6A /tmp/rg-shots/after-snakes.png tools/qa/play-snakes.js`，9333 未能連線。原工具報 targets undefined；診斷直接啟動 Chrome exit 134，無輸出。已改善工具的連線失敗訊息。
- 指定 `rm -rf` 被執行環境拒絕，改用 Python shutil 清除同一暫存 profile；`pkill -f remote-debugging-port=9333` 也因無法取得 process list 而失敗。沒有權限提升或繞過限制。
- **沒有成功產出的 after 截圖，沒有看圖驗收，不能宣稱視覺通過。** `/tmp/rg-shots/after-snakes.png` 僅為嘗試路徑，非交付圖。
- 尚待：在能啟動 Chrome 的環境跑五款 QA fixture、全部寬度／投影／200%／長文／雙人面對面，核對棋盤標籤與模型遮擋、賓果底列及主操作、詞義閱讀、密室真矩形／拖轉與鍵盤走完全流程；真實 context loss／慢 CDN／reduce 切換；完整改動前後輸入 trace；iPad／教室電腦實機與效能成績。
- 替身測試只證明程式邊界與提供的矩形可排，不當成 GPU／真字型／實機證據。固定 seed fixture 已備妥但本次未成功在瀏覽器執行。T01–T07 不標記已完整驗收。

### 復驗範例

使用既有 cdp.mjs，將操作腳本改為 `tools/qa/p0-fixture.js`。網址可加：

- `qaLevel=support|standard|challenge`（哆寶 4/6/8 詞、賓果 3/4/5 邊）。
- `qaMode=solo|duel|duel-face`（哆寶）。
- `qaSlide=3|99`（蛇）。
- `qaRoom=last-clue|final-door`、`qaFault=calm|render|context`（密室）。
- `qaWidth=390&qaHeight=844` 等視窗尺寸；預設 1366×900。

例如：`node Chinese/Review-Games/tools/qa/cdp.mjs 'http://localhost:5191/Chinese/Review-Games/detective.html?g=G6A&qaRoom=final-door&qaFault=render&qaWidth=390&qaHeight=844' /tmp/rg-shots/after-detective-render-390.png Chinese/Review-Games/tools/qa/p0-fixture.js`。
