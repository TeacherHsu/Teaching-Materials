# 交接紀錄（最新的寫在最上面）

每次開工先寫一行「🚧 施工中」；完工時把那一行改成完整紀錄，格式如下：

```
## YYYY-MM-DD｜機器（家裡 Mac／學校 Win…）｜AI（Claude Code／Codex…）｜狀態：✅ 完成／🚧 施工中／⚠️ 中斷
- 範圍：動了哪些資料夾
- 做了什麼：
- 驗證：跑了哪些指令、結果如何
- 推送：已推送（commit hash）／尚未推送
- 待辦／給下一棒：
- 注意：不要動的東西、已知問題
```

---

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/` 成語內嵌答案空格的語音按鈕
- 做了什麼：移除填入答案後出現在成語中間的額外朗讀按鈕；保留題目朗讀與下方候選字朗讀，並補上內嵌空格的答錯揭曉防呆
- 驗證：`npm run validate`、`npm run build`、`npm run check-dist`、全部 `scripts/test-*.mjs` 通過；瀏覽器確認「原封不動」填入「原」後成語中間沒有多餘喇叭，無 console/page error
- 推送：尚未推送（等待明確推送指示）
- 待辦／給下一棒：後續若新增內嵌答案空格，不要在 `inlineSlotWrap` 放置 slot 專用朗讀鈕
- 注意：不改官方教材內容；只調整內嵌答案空格的 UI 呈現

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/`「生字變成語」拖拉作答互動
- 做了什麼：
  - `DragToSlot` 新增直接用滑鼠／觸控拖曳候選答案到空格的 Pointer Events 互動
  - 第 2 課「生字變成語」第一關把答案空格嵌在成語本身（如「得過＿過」），不再在下方另放獨立答案框；兩關都開啟拖拉模式，空格拖曳經過時會高亮
  - 保留點選、鍵盤與觸控替代操作，新增 `test-drag-to-slot.mjs`
- 驗證：`npm run validate`、`npm run build`、`npm run check-dist`、全部 `scripts/test-*.mjs` 通過；瀏覽器實際將「且」拖入「得過＿過」並確認答對，無 console/page error
- 推送：尚未推送（等待明確推送指示）
- 待辦／給下一棒：後續需要拖拉作答的模組可傳入 `dragEnabled: true`；現有其他模組維持原本點選流程
- 注意：不改官方教材內容；只修改作答互動與樣式

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/` 形似字題目生成與第 2 課資料
- 做了什麼：
  - 形似字 activity 將每個 `example` 的逗號分隔語詞拆成獨立題目；「天使、使命」會分成「天＿」與「＿命」，不再把完整答案露在同一題
  - 使用共用 `shuffle()`，選項維持亂數排列
  - 新增 `test-lookalike-splitting.mjs` 回歸測試
- 驗證：`npm run validate`、`npm run build`、`npm run check-dist`、全部 `scripts/test-*.mjs` 通過；瀏覽器第 2 課形似字路由確認「天＿」與「＿命」兩題，無 console/page error
- 推送：尚未推送（等待明確推送指示）
- 待辦／給下一棒：後續課次沿用「一個語詞一題、只挖一個目標字」規則；既有歷史成品需重新生成才會套用
- 注意：不改官方教材內容；canonical `example` 保留官方例詞，前端只改學生題面拆題

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/`；教材網頁各類選項題的共用洗牌規則
- 做了什麼：
  - 新增共用 Fisher–Yates `shuffle()`，ChoiceQuiz、拖曳候選詞、成語題與配對題都改用亂數排列；若結果恰好等於原順序，會再交換前兩項
  - `ReadAllButton` 改讀畫面實際順序，視覺選項與朗讀選項一致
  - 新增 `test-option-shuffle.mjs`，確認不改題庫、保留全部選項、題面不固定順序
- 驗證：`npm run validate`、`npm run build`、`npm run check-dist`、全部 `scripts/test-*.mjs` 通過；瀏覽器實際確認第 2 課「認識生字」選項不再固定正解第一
- 推送：尚未推送（等待明確推送指示）
- 待辦／給下一棒：學習單端的產生器規則另記於 sped-os repo 的 ADR-0035；後續新題目一律遵守選項亂數排列
- 注意：不改官方教材內容、不改 `Chinese/` 既有靜態頁面；題庫 canonical 順序保留，僅改學生題面呈現順序

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/`、`HANDOFF.md`；115G3A／翰林三上第 2 課〈妙用便利貼〉完整教材資料與成語素材
- 做了什麼：
  - 依官方教師確認字表建立 17 個生字；依官方 05／06／10 來源補齊 15 個語詞、34 題一字多義、便的兩音、8 組形似字與 3 題修辭，並把段落重述改用官方 v2.1 的「困擾／嘗試／改變」結構
  - 沿用既有學習單 6 張無文字成語插圖，轉成 WebP 放入 `public/assets/115AG3H/lesson02/idioms/`，`idioms[].image` 明確指定
  - 手機版任務提示與 ChoiceQuiz 題幹／整題朗讀鈕重新排版，窄螢幕不再把題幹擠成一字一行
  - 官方第 2 課只有一組多音字「便」，調整模組門檻為兩個讀音即可開放；其餘模組均依資料量正常分組
- 驗證：`npm run validate`、`npm run build`、`npm run check-dist`、全部 `scripts/test-*.mjs`；Chromium 1440px／375px 實際渲染 9 條路由，無橫向捲動、無 console/page error，成語圖 natural size 正常
- 推送：尚未推送（等待明確推送指示）
- 待辦／給下一棒：後續課次沿用官方字表優先、來源可追溯、先重用既有圖片、缺資料才標待審的流程；推送前檢查本分支與 `origin/main` 差異
- 注意：不重跑 Mac 專用大補帖匯入器，不改 `Chinese/`；本機 `node_modules`、`dist`、暫存 QA 腳本／截圖不納入 commit

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/`、`HANDOFF.md`；115G3A／翰林三上第 1 課成語插圖與共用頁面視覺
- 做了什麼：
  - 沿用舊學習單 PPTX 內嵌的 6 張無文字成語插圖，轉成 WebP 放入 `public/assets/115AG3H/lesson01/idioms/`；未重新生成圖片，未改課次 JSON 內容
  - 成語插圖改為正方形、完整顯示、不裁切，桌機置中，手機自適應，缺圖仍不會讓版面塌陷
  - 麵包屑分隔符改為跟隨下一個項目，窄螢幕另起一行時不會出現行尾孤立斜線
  - 保留既有大字、朗讀鈕、觸控目標與 reduced-motion 設計，供後續各課共用
- 驗證：`npm run validate`、`npm run build`、`npm run check-dist`、全部 `scripts/test-*.mjs` 通過；6 張 WebP 均存在且成功打包；Chromium 1440px 與 375px 實際渲染通過，無橫向捲動，圖片 natural size 正常
- 推送：已在 origin/main（6e560f0）；家裡 Mac 已拉下並驗收（validate／build／check-dist／node 測試／pytest 全過，抽看插圖無文字）
- 待辦／給下一棒：後續各課沿用 `idioms[].image` 明確路徑與同一視覺規則；確認後將目前分支 commit 同步到 `origin/main`，本分支可用 `git push origin HEAD:main`
- 注意：不重跑 Mac 專用大補帖匯入器，不改 `Chinese/` 既有靜態頁面；本機 `node_modules`、`dist` 與暫存截圖不納入 commit

## 2026-09-25｜家裡 Mac｜Claude Code｜狀態：✅ 完成
- 範圍：`apps/mandarin/`、`.github/workflows/pages.yml`、本檔與 `AGENTS.md`
- 做了什麼：
  - 國語課文樂園第一階段：翰林三上第 1 課，12 大項、朗讀、星星、延伸練習
  - 大補帖匯入器；PR #10 已合併
  - 成語插圖改成由 `idioms[].image` 明確指定路徑
- 驗證：validate／build／check-dist、pytest 56、node 測試 13 支全數通過
- 推送：已推送到 origin/main
- 待辦／給下一棒：
  1. **家裡 Windows 的 Codex**：它的學習單專案裡已經有各課成語圖，**優先沿用，不要重新生成**。
     - 照 `apps/mandarin/tools/dabutie/IMAGE-HANDOFF.md` 的規格轉成 .webp，並依清單改名，放到 `public/assets/115AG3H/lesson01/idioms/`。
     - 學習單用的圖若有成語字樣、注音或題目文字，必須換成無字版本或重新裁切。
     - 驗證通過後 push。
  2. **CF**：Codex 推完後，到 Settings → Pages 把 Source 改成「GitHub Actions」，新網站才會上線。
  3. 上線後確認 `/mandarin/` 和既有頁面（`Timer/`、`Chinese/Lesson-Park/`）都正常。
- 決策原因：見 sped-os `90-meta/decisions/ADR-0034-mandarin-site-2026-09-25-decisions.md`（私人 repo）
- 注意：
  - `~/mandarin-work/`（大補帖抽取資料、改寫紀錄、審核決定）只在家裡 Mac，不在 repo 裡。重新匯入教材、改寫、審核都必須在家裡 Mac 上做。
  - 其他電腦只做前端、圖片、文件。
