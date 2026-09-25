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
- 範圍：`apps/mandarin/src/activities/sentencePractice.js`、`apps/mandarin/scripts/test-sentence-chunking.mjs`
- 做了什麼：句型練習改用固定詞組保護、瀏覽器中文斷詞、助詞／介詞合併與標點歸併；不再以每兩字硬切，並支援教材以 `sentence_patterns[].example_parts` 提供人工確認詞塊。同步檢查第 1～4 課 55 個例句，修正「寫作業」「暖暖的」「進門的客人」「今天沒有遲到」等詞組
- 驗證：新增 `node scripts/test-sentence-chunking.mjs`；第 1～4 課 55 個例句重新串接全部成功，最大 7 個詞塊且無孤立助詞；全部 `scripts/test-*.mjs`、第 5 課星星覆蓋測試、`npm.cmd run validate`、`npm.cmd run check-assets`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；瀏覽器確認詞組完整呈現，console 無錯誤
- 推送：完成 commit 後推送至 `origin/codex/mandarin-115g3a-lessons`；`origin/main` 尚未更新
- 待辦／給下一棒：新增特殊句型時，可在該句型的 `example_parts` 放入人工確認且可重新串回原句的詞塊
- 注意：保留原句內容與亂數呈現，只調整學生作答時的詞塊邊界

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/data/115AG3H/lesson05.json`、`apps/mandarin/public/assets/115AG3H/lesson05/`、`apps/mandarin/public/data/course-index.json`
- 做了什麼：新增翰林三上第 5 課「為梨花撐傘」完整課次資料，包含 15 個生字、14 個目標語詞、5 個成語與插圖、句型、修辭、段落大意、閱讀理解、一字多義、一字多音、形似字、聆聽題、跨課複習與挑戰題；加入每課筆順直連，並把 14 張語詞圖與 5 張成語圖壓縮為 WebP
- 驗證：`npm.cmd run validate`、`npm.cmd run check-assets`、全部 `scripts/test-*.mjs`、第 5 課 `MANDARIN_TEST_LESSON=../public/data/115AG3H/lesson05.json node scripts/test-module-star-coverage.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；瀏覽器確認課次首頁、語詞圖片與點選解釋、成語拖拉、形似字拆題、生字造詞與筆順連結，無水平溢出與 console 錯誤
- 推送：已推送至 `origin/codex/mandarin-115g3a-lessons`（完成 commit 後更新）；`origin/main` 尚未更新
- 待辦／給下一棒：後續可接續 G3A 第 6 課；本課圖片 19 張、約 2.05 MiB，維持單張 300 KiB 與單課 4 MiB 容量閘門
- 注意：不修改課文全文，不把官方原始教材、出版社補充原檔或第三方 xlsx 放入公開 repo；網站資產只保留壓縮 WebP

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/data/115AG3H/lesson04.json`、`public/assets/115AG3H/lesson04/`、`course-index.json`
- 做了什麼：新增翰林三上第 4 課「水滾了」課次資料，包含 18 個生字、10 個目標語詞、5 個成語、句型、段落大意、修辭、形似字、一字多義、一字多音、聆聽題與挑戰題；加入 10 張語詞 WebP、5 張成語 WebP，並加入雄筆順直接連結
- 驗證：`npm.cmd run validate`、`npm.cmd run check-assets`、全部 `scripts/test-*.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；本機瀏覽器確認課次首頁、生字頁、語詞圖片與點選解釋、成語拖放題可開啟，頁面錯誤紀錄為空
- 推送：尚未推送；開工前 `git pull --rebase origin main` 因 GitHub 憑證錯誤 `SEC_E_NO_CREDENTIALS` 受阻，本次不強行覆蓋或推送
- 待辦／給下一棒：提交本次變更後，確認 GitHub 憑證可用再推送；後續課次沿用本課資料結構與壓縮資產規範
- 注意：本次不修改課文全文，不把官方原始教材、出版社補充原檔或 xlsx 放入公開 repo；課 4 圖片只保留壓縮 WebP，總計約 1.37 MiB

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/data/115AG3H/lesson01.json`、`lesson02.json` 與兩課語詞圖片資產
- 做了什麼：第一課 13 張、第二課 15 張語詞補上兒童友善教學插圖；資料引用同步指向 WebP；沿用第三課圖片固定、點卡片切換詞義、朗讀同步的語詞卡規格
- 驗證：`npm.cmd run validate`、`npm.cmd run check-assets`、全部 `scripts/test-*.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；第一、二課 28 張圖片瀏覽器實際載入；第三課互動回歸確認通過；總資產 6.30 MiB，第一課 2.52 MiB、第二課 1.93 MiB、第三課 1.84 MiB
- 推送：尚未推送
- 待辦／給下一棒：後續課次補圖沿用 `l課次-序號.webp` 命名與圖片容量閘門；每張維持 300 KiB 內、每課約 4 MiB 內
- 注意：原始 PNG 僅留在 Codex 生成目錄，網站與 repo 只保留 WebP；圖片為教學輔助，不在圖內加入文字

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/` 語詞認識步驟與語詞卡片
- 做了什麼：依使用者確認改為可點選語詞卡；圖片固定不變，點選後文字替換為對應解釋，再點一次可回到語詞；注音、朗讀內容與操作說明同步切換
- 驗證：`npm.cmd run validate`、`npm.cmd run check-assets`、全部 `scripts/test-*.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；第三課瀏覽器確認圖片不變、詞義可切換、朗讀內容同步、無水平溢出且無警告
- 推送：尚未推送
- 待辦／給下一棒：後續課次沿用此語詞卡互動與圖片資產容量閘門；若補圖，維持單張 150～300 KB、每課約 4 MB 內
- 注意：點選喇叭只朗讀，不會觸發卡片切換；語詞解釋與例句仍保留在後續配對與選詞活動

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/` 語詞認識步驟與語詞卡片
- 做了什麼：依使用者確認取消卡片翻面，改為固定顯示圖片、語詞、注音與朗讀按鈕；同步更新操作說明
- 驗證：`npm.cmd run validate`、`npm.cmd run check-assets`、全部 `scripts/test-*.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；第三課瀏覽器確認 5 張卡片都有圖片、每張 1 個朗讀鈕、無翻面互動、無水平溢出且無警告
- 推送：尚未推送
- 待辦／給下一棒：後續課次沿用固定式語詞卡與圖片資產容量閘門；若補圖，維持單張 150～300 KB、每課約 4 MB 內
- 注意：語詞解釋保留在後續配對與選詞活動；圖片容量閘門維持有效

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/` 圖片資產與建置容量檢查
- 做了什麼：新增 WebP 壓縮腳本與 `check-assets` 容量閘門；第三課 20 張 PNG 轉成 WebP，資料路徑同步更新，原圖備份到 repo 外的 `_archive/mandarin-image-sources/115AG3H/lesson03/`
- 驗證：第三課圖片由 35.79 MiB 降至 1.84 MiB，全站 `public/assets` 約 3.01 MiB；`npm.cmd run validate`、全套 `scripts/test-*.mjs`、`npm.cmd run build`、`npm.cmd run check-dist`、`npm.cmd run check-assets` 通過；瀏覽器確認第三課語詞與成語 WebP 正常載入
- 推送：尚未推送
- 待辦／給下一棒：後續新增圖片先執行 `npm run check-assets`；若需發布，再由使用者確認後推送目前本地 commit
- 注意：閘門為單張 300 KiB、單課 4 MiB、全站 600 MiB 警告／700 MiB 失敗；本次 `git pull --rebase origin main` 因 GitHub 憑證 `SEC_E_NO_CREDENTIALS` 失敗，當時本地追蹤資訊顯示分支 ahead 15、沒有落後

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/src/components/TaskBanner.js` 所有組別進度文字
- 做了什麼：依使用者回饋移除所有「第 X 組／共 Y 組」，不論單組或多組；保留步驟進度
- 驗證：`npm.cmd run validate`、`node scripts/test-extension-links.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 通過；瀏覽器確認多組語詞頁僅保留「第 1 步／共 3 步」，修辭頁不顯示組別資訊，console 無錯誤或警告
- 推送：尚未推送
- 待辦／給下一棒：如需發布，再由使用者確認後推送目前本地 commit
- 注意：不影響題目本身的「第 X／共 Y 題」進度

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/src/components/TaskBanner.js` 單組進度文字
- 做了什麼：移除只有一組時的「第 1 組／共 1 組」，保留多組練習的組別進度
- 驗證：`npm.cmd run validate`、`node scripts/test-extension-links.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 通過；瀏覽器修辭頁確認單組提示已隱藏，語詞頁確認多組提示仍保留，頁面無橫向溢出，console 無錯誤或警告
- 推送：尚未推送
- 待辦／給下一棒：如需發布，再由使用者確認後推送目前本地 commit
- 注意：不刪除真正有多組時的進度資訊

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/data/115AG3H/lesson03.json` 第三課詞彙圖片
- 做了什麼：修正「喊」與「文具」兩筆詞彙圖片對調問題
- 驗證：`npm.cmd run validate`、`node scripts/test-extension-links.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 通過；瀏覽器第三課語詞頁確認「喊」使用呼喊孩子圖片、「文具」使用文具桌面圖片，console 無錯誤
- 推送：尚未推送
- 待辦／給下一棒：如需發布，再由使用者確認後推送目前本地 commit
- 注意：只調整圖片欄位，不重製或刪除既有圖片資產

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/` 生字卡片視覺標籤
- 做了什麼：依使用者回饋移除「習寫字」、「認讀字（只要會認）」等卡片上方標籤，保留資料分類供功能使用
- 驗證：`npm.cmd run validate`、`node scripts/test-extension-links.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 通過；瀏覽器第三課確認 17 張生字卡片均無分類標籤，版面無橫向溢出，console 無錯誤或警告
- 推送：尚未推送
- 待辦／給下一棒：如需發布，再由使用者確認後推送目前本地 commit
- 注意：不修改教材 JSON 的 `type` 分類，也不影響其他模組的待審或策略標籤

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/` 筆順直連卡片文字
- 做了什麼：依使用者回饋簡化筆順直連顯示，主標題統一為「筆順練習(雄筆順)」，隱藏重複的提供者、版本與課次說明
- 驗證：`npm.cmd run validate`、`node scripts/test-extension-links.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 通過；瀏覽器第三課頁面確認主標、版面無橫向溢出，console 無錯誤或警告
- 推送：尚未推送
- 待辦／給下一棒：如需發布，再由使用者確認後推送目前本地 commit
- 注意：其他延伸資源仍保留提供者與說明文字

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/` G3A 翰林第 1～3 課筆順外連
- 做了什麼：依固定網址規律 `html5_stroke_parts.html?by=gsyan&words=`，將三課生字依課本順序串接並 URL 編碼；三課「本課筆順教材」均改為直接開啟該課生字，備註改為顯示已帶入的生字數量
- 驗證：`npm run validate`、`node scripts/test-extension-links.mjs`、`npm run build`、`npm run check-dist` 通過；瀏覽器實際開啟第 1～3 課直連，確認頁面標題為「雄-筆順練習」且輸入區帶入各課生字；本地第三課 href 已更新
- 推送：尚未推送
- 待辦／給下一棒：後續課次可沿用相同規律，由該課 `characters[].char` 依序串成 `words` 參數
- 注意：未修改官方原始教材與既有造詞資料；保留 `Chinese/` 舊站與內部官方原始檔

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/` G3A 翰林第 1～3 課生字造詞資料與「認識生字」筆順教材入口
- 做了什麼：依使用者提供的《115上114下學期生字表_大腦與語言實驗室_20260723.xlsx》翰林／115上／三年級第 1～3 課資料，補充每個生字最多 5 個造詞並保留 `examples_source`；新增每課筆順練習外連，放在「認識生字」第一步任務提示下方，以折疊卡顯示版本、年級與課別選取方式；延伸連結卡新增 `note` 顯示
- 驗證：`npm run validate`、全部 `scripts/test-*.mjs`、`npm run build`、`npm run check-dist` 通過；瀏覽器確認第三課造詞與筆順入口、無橫向溢位、無 console error／warning
- 推送：尚未推送
- 待辦／給下一棒：後續課次可沿用 `characters[].examples` 與 `examples_source`；各課筆順入口沿用同一選單，依課次更新 note
- 注意：未修改原始 Excel；保留 `Chinese/` 舊站與內部官方原始檔

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/` G3A 第三課「提早五分鐘」資料、圖片資產、課程索引與模組覆蓋測試
- 做了什麼：依官方生字表／教育百科字庫建立 15 個習寫字與 2 個認讀字；接入 14 個語詞及 AI 圖片、6 個生字衍生成語及圖片、句型、修辭、段落重述、閱讀理解、一字多義、一字多音、形似字、聆聽與跨課複習。形似字沿用逐例詞拆題規則，避免同組例詞露出答案。
- 驗證：`npm run validate`、`npm run build`、`npm run check-dist`、全部 `scripts/test-*.mjs` 通過；另以 `MANDARIN_TEST_LESSON=../public/data/115AG3H/lesson03.json node scripts/test-module-star-coverage.mjs` 驗證第三課 11 個可開始模組；瀏覽器確認課次首頁、成語拖拉、語詞圖片、形似字、舊字新詞，無 console error／warning，當前視窗無橫向溢位
- 推送：尚未推送
- 待辦／給下一棒：若要公開到 GitHub Pages，請另行確認後再推送；應用任務仍是既有待補項目
- 注意：官方生字表採 `統票角板業本況該喊文具理此備易匆餘`；未把九份補充資料中的另一組生字混入本課。未動 `Chinese/` 舊站與內部官方原始檔

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
