# T4b：密室任務手冊、蒐證印章、破案畫面

- 執行：Codex；環境：本機 Mac 沙盒。
- 狀態：實作、語法及全套 131 項測試通過；待 Claude 截圖驗收與提交。
- 依派工單覆蓋 git 開收工流程：沒有執行任何 git 指令，沒有 commit／push，也沒有修改 HANDOFF；由 Claude 統一提交、整合快取版本及截圖驗收。
- 已讀 T4a（含 R1）實作紀錄、ART-SPEC §4.4–4.6、VISUAL-UPGRADE §3 及 HANDOFF 最新三筆。

## 修改檔案

- `detective.js`：v1 任務手冊、線索卡印章識別、破案流程與成果頁揭曉。
- `detective.css`：任務手冊、線索卡圖示、限定線索蒐證章、破案徽章與低動態樣式。
- 新增 `tests/detective-manual.test.cjs`：11 項呈現及互動測試。
- 新增本紀錄 `docs/visual-upgrade/IMPL-LOG-T4b.md`。

`detective2.js` 沒有修改，另跑語法與既有 v2 測試確認；沒有修改既有測試、core、資料、其他遊戲、kit、scene3d、HTML 或快取版本。

## 實作摘要

### 任務手冊

- 保留 `.dt-side`、`.dt-list`、房間及工具列既有入口、按鈕文字。手冊依序為：不可收合的目前任務卡／前往、線索進度、可以調查、尚未解鎖、已完成。
- 未解鎖與已完成預設收合並顯示數量；玩家自行展開後，蒐證等重新渲染會保留展開狀態。
- 前往及全部清單物件按鈕均有 `data-id`。沿用 T4a 掛在 `.dt-side` 的 click 捕獲監聽：先 `room.focus(id)`，再由按鈕執行原本的 `pick(id)`。不另外重複呼叫 focus，避免啟動兩次鏡頭補間；不等待補間完成才開啟題目，與房間標記一致。
- 未解鎖清單仍可點擊，沿用原本 pick 的未解鎖說明及一次一件事提示；沒有改 core 的開放條件。搜查入口改為整排線索卡按鈕，每個都開筆記本。
- 下一個蒐證任務指向尚未找到的真實線索物件；搜查完成後指向 nextPuzzle，最後解完指向出口。可疑紙條仍可由可以調查清單或房間操作。
- 線索卡實心／空心搭配可讀 aria-label 表達已找到／尚未找到，不只靠顏色。

### 蒐證印章

- 找到線索彈窗與筆記本真實線索加上 `.dt-evidence`，套用 400ms「已蒐證」印章與 `--success`。
- 修正 T4a 原先所有非 decoy 的 `.dt-clue` 都有印章的範圍；解題回顧與一般訊息不再被誤標為蒐證。可疑紙條不蓋章。減少動態直接顯示印章終態。

### 破案畫面

- 保留原本 `C.escape` 判定與成果存檔，沒有新增存檔欄位或改遊戲進度規則。
- 開門與門光 700ms → 成果揭曉的光 → `--reward` 金色案件破解章 → 偵探徽章 → 本次實際線索數及機關數摘要。成果頁原本的逐題能力與提示紀錄保留。
- 正常總長 2050ms（700 + 1000 + 350），小於 2500ms。開門期間與揭曉期間各有「略過動畫」，直接顯示完整成果。
- calm、系統低動態或背景頁直接進入完整成果，不排等待計時器；CSS 同時覆蓋低動態。舊計時器有案件及房間身份檢查，取消或換案件後不覆蓋新畫面。

## 驗收指令與實際輸出

以下全部由 repo 根目錄執行。沒有啟動 Chrome 或監聽埠。

```sh
node --check Chinese/Review-Games/detective.js
node --check Chinese/Review-Games/tests/detective-manual.test.cjs
node --check Chinese/Review-Games/detective2.js
```

逐項實際結果均為 exit 0，stdout／stderr 為空。

```sh
node --test Chinese/Review-Games/tests/detective-manual.test.cjs
```

最終獨立執行 exit 0，實際輸出摘要：

```text
ℹ tests 11
ℹ suites 0
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 459.565898
```

測試執行真實 refreshStates／notebook／escapeRoom／results 函式、真實 core 與 G3A 資料，以及 T4a 真實側欄捕獲 listener；DOM、鏡頭與 timer 使用替身。涵蓋三級手冊入口聚焦順序、分區、實際線索數、收合狀態保留、筆記本印章、破案低動態、略過、成果寫入僅一次，以及取消後舊計時器無效。

開發時新增成果頁測試曾因替身漏宣告 `escapeTimer`、`start` 而失敗，已補齊替身，未修改任何既有斷言。第一輪全套（當時新增 9 項）129 pass、0 fail；補上成果頁及取消測試後重新跑完整套件，結果如下。

```sh
node --test Chinese/Review-Games/tests/*.cjs > /private/tmp/t4b-tests-final.txt 2>&1
```

最終實際 exit 0，輸出摘要：

```text
ℹ tests 131
ℹ suites 0
ℹ pass 131
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 52094.459497
```

包含未修改的 `detective.test.cjs`、`detective2.test.cjs`、T4a 場景測試與其餘遊戲測試，全部通過。完整 stdout／stderr 留在本機 `/private/tmp/t4b-tests-final.txt`。

## 偏離規格與整合說明

- 規格示例「線索 n/5」改以實際 `game.clues.length` 顯示。不同難度與跨課案件的張數不同，固定 5 會誤報進度；沒有為了 UI 改規則或線索數量。
- 沿用 T4a 已實作的 focus 捕獲委派，沒有修改 `detective3d.js`。測試直接執行該 listener 確認順序。
- 依 VISUAL-UPGRADE 的分工，沒有產出瀏覽器截圖；下面提供 Claude 截圖用網址，並非已產出的截圖連結。

## 截圖網址與驗收情境（交 Claude）

以 Claude 本機服務埠 8765 為例，本次沒有啟動服務：

- v1 書房：`http://127.0.0.1:8765/Chinese/Review-Games/detective.html?g=G3A&qaRoom=study`
- v1 森林：`http://127.0.0.1:8765/Chinese/Review-Games/detective.html?g=G3A&qaRoom=forest`
- v2 原型：`http://127.0.0.1:8765/Chinese/Review-Games/detective2.html?g=G3A`

請在 1366×900、1024×768、390×844 各截：

1. 初始任務手冊五區，未解鎖／已完成預設收合。
2. 點前往與清單：鏡頭聚焦、原題目／蒐證彈窗；點鎖住項目有依賴說明。
3. 找到第一張線索後的實心卡進度、筆記本已蒐證章，可疑紙條沒有章。
4. 解完搜查後下一任務改為機關，收合清單仍能展開回顧。
5. 開門、金色案件章、偵探徽章與摘要終態；兩階段略過、系統低動態與平面圖。
6. v2 進場、蒐證與解題，確認原型沒有任務手冊、仍可正常操作。

## 已知問題與交付限制

- 瀏覽器像素、手機／平板真實排版、3D 鏡頭與彈窗同時呈現及觸控須由 Claude 截圖／實機驗收；Node 替身通過不能宣稱視覺 Gate 通過。
- HTML 快取碼依既有分工留給 Claude 整合；驗收時請停用快取或強制重新載入。
