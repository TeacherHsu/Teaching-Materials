# 國語教材網站批次產出工作流

本文件把 G1A、G3A、G6A 的教材網站產出流程固定下來，並說明目前可重跑的 Python 產生器。公開 repo 只保存衍生後的課程 JSON、壓縮圖片與索引；官方教材、完整課文、Excel 與審核用工作檔仍留在私有工作區。

## 產出架構

```text
私有官方來源
    ↓ 來源台帳／課次核對／內容審核
標準化課次資料
    ↓ 生字、常用造詞、語詞解釋、已核對圖詞
lessonNN.json + WebP 圖片
    ↓ 合併索引與自動檢查
course-index.json → Vite build → GitHub Pages
```

每課輸出固定放在：

```text
public/data/<冊別>/lessonNN.json
public/assets/<冊別>/lessonNN/
public/data/course-index.json
```

## 每課處理順序

1. 建立課次清單，確認課名、生字與官方來源版本。
2. 讀取生字表，使用已核對的字音、部首與筆畫資料。
3. 從私有生字 Excel 依常用度取前三個造詞；若不足，才用本課官方語詞補足，不自行創詞。
4. 讀取官方語詞解釋。G3A 第 7–12 課優先採用 `low-g3-v2` 已審核 manifest；圖片只接受 manifest 的完全同詞對應。既有課次補圖時，使用 `fill_vocabulary_images.py`，舊教材明確對應圖優先，沒有可核對舊圖的詞才接入私有生成圖 manifest。
5. 將圖片轉成 WebP，單張不得超過 300 KiB，單課不得超過 4 MiB。
6. 產生固定網站資料結構：生字卡、語詞解釋卡、隨機選項、筆順外部連結與模組可用狀態。
7. 建立「舊字新詞」跨課索引：每課的 `review_words.by_lesson` 必須累積同冊截至本課的已公開生字；第 2 課起要以實際前課生字／語詞至少 3 題為可開始條件，第 1 課維持鎖定。不得只改模組文字而沒有可產生的跨課題目。
8. 建立「成語填句子」資料：每個可用成語都要有一筆完整、自然、可由上下文判斷的具體情境句；句中必須包含該成語，挖空成語後仍要保留足夠語境。禁止使用「遇到生活中的相關情況時，可以用……來形容」等泛用模板。若該課尚無成語資料，維持模組未開放，不用空白或泛用題目填充。
9. 建立「修辭小偵探」資料：每一筆可用的 `rhetoric` 題目都要在 `example` 中以 `﹁關鍵字﹂` 標出官方解析所框出的關鍵字；若是既有資料使用 `「關鍵字」` 或 `『關鍵字』`，可保留作相容格式，但新增資料統一使用 `﹁﹂`。
10. 建立「形似字」資料：答案選項只能來自官方形似字辨別題庫核定的同一字形群組；不可把例詞的第一個字直接當成答案，也不可因讀音、詞義相近就混入非形似字。每個選項都要有包含該字的有效例詞，並保留一份公開衍生的核對基準 `docs/lookalike-approved-groups.json`。
11. 合併 `course-index.json`，不能因為只產生部分課次而刪掉既有課次。
12. 寫入外部進度檔。中斷後以 `--resume` 跳過已有且狀態為 `ready` 的課次。
13. 執行資料驗證、舊字新詞全面稽核、成語情境句檢查、形似字選項核對、修辭關鍵字變色檢查、圖片容量檢查、建置與回歸測試，再 commit。

## Python 批次產生器

檔案：`scripts/generate_lessons.py`

這支工具目前直接涵蓋 G3A 與 G1A 的官方來源標準化輸入，也提供 G6A 的公開準備資料介面。G6A 的官方來源清理、來源 hash 與每課 manifest 保留在私有工作流，完成審核後只將標準化課次 JSON 與壓縮圖片交給公開介面，避免把官方檔案帶入公開 repo。

### G3A 第 7–12 課

```powershell
python scripts/generate_lessons.py `
  --profile g3a `
  --source-root <private-workspace-root> `
  --repo-root <repo>\apps\mandarin `
  --lessons 7-12 `
  --workbook <private-workbook.xlsx> `
  --unihan-zip <private-Unihan.zip> `
  --pypinyin-path <private-pypinyin-directory> `
  --progress-file <private-progress.json> `
  --resume
```

第一次執行或來源已更新時，移除 `--resume`，讓課次重新生成。若只想檢查來源完整性，加入 `--dry-run`；dry-run 不會寫入公開課程資料。

批次輸出後，無論是 G1A、G3A 或已審核匯入的 G6A，都要同步同冊跨課索引：

```powershell
cd apps/mandarin
node scripts/sync-review-coverage.mjs --write
node scripts/sync-review-coverage.mjs --check
node scripts/test-review-coverage.mjs
```

`sync-review-coverage.mjs` 會掃描 `course-index.json` 的全部課次，從公開生字卡資料建立 `review_words.by_lesson`，並同步 `modules.review` 的可用狀態。`--check` 是唯讀稽核；若第 2 課以後沒有足夠前課字詞，會明確列為缺資料，不會用空白題目開放。

### 使用者授權直出模式

若使用者明確表示「不用審核、直接公開」，可對已有私有來源與標準化資料的課次使用直出工具。這個模式只跳過人工等待，不跳過 JSON 結構、情境句、形似字群組、建置與容量檢查；沒有實際來源的模組仍維持未開放，不以空白題目冒充教材。

G3A 第 7～12 課的直出指令：

```powershell
cd apps/mandarin
node scripts/publish-g3a-extensions.mjs `
  --source-root <private-workspace-root>\worksheet-batches\115\115G3A_國語 翰 `
  --repo-root <repo>\apps\mandarin `
  --lessons 7-12 `
  --publish
```

工具會公開句型、成語與具體情境句、聚焦理解提問及形似字資料，並同步課次模組狀態與公開衍生核對基準。成語圖若仍是未壓縮 PNG，先保留 `image: null`，待轉成符合 WebP／AVIF 容量規則後再補圖；不得把私有絕對路徑寫入公開 JSON。直出內容標記為使用者授權的 `ready`／`approved`，後續發現錯誤時直接修正並重新執行相同檢查。

G3A 官方延伸模組直出：

```powershell
cd apps/mandarin
node scripts/publish-g3a-official-extensions.mjs
```

此工具使用私有官方教材的四個來源區：`06字義分析` 供一字多義、各課 `05形音輕鬆學(含語詞解釋)` 的「認識多音字」供一字多音、`15閱讀理解提問` 供聽聽看、`10修辭輕鬆學` 的解析段落供修辭小偵探。公開 JSON 只保存衍生題目與不含私有絕對路徑的來源標籤。多音字必須有至少兩個經查證且不同的注音；官方檔案沒有「認識多音字」段落的課次維持未開放，不以猜測內容補齊。修辭例句必須保留官方解析以 `﹁﹂` 框出的關鍵字，聽聽看題目需由官方閱讀提問與課文內容設計成可聽辨的具體情境。

### G1A 第 1–7 課

```powershell
python scripts/generate_lessons.py `
  --profile g1a `
  --source-root <private-workspace-root> `
  --repo-root <repo>\apps\mandarin `
  --lessons 1-7 `
  --workbook <private-workbook.xlsx> `
  --unihan-zip <private-Unihan.zip> `
  --pypinyin-path <private-pypinyin-directory> `
  --progress-file <private-progress.json>
```

### 額度中斷後續作

進度檔不放在 repo，而是放在私有工作區。每課完成後記錄 `ready`、時間與輸出 JSON 的 SHA-256；若執行中斷，重新執行同一指令並加上 `--resume`，會從第一個尚未完成或輸出不存在的課次接續。額度恢復後不需要重新產出已完成課次。

### G6A 公開準備資料介面

G6A 不直接把官方 `.doc`、`.docx`、PDF 或來源台帳交給公開 repo。私有來源清理器完成內容核對後，必須輸出下列準備資料結構：

```text
<prepared-root>/
  115AG6H/
    lesson01.json
    lesson02.json
  assets/115AG6H/lesson01/**/*.webp
  assets/115AG6H/lesson02/**/*.webp
```

`lessonNN.json` 必須符合既有公開課次契約，至少包含 `lesson_id`、`volume`、`unit`、`lesson_no`、`title`、`characters`、`words` 與 `modules`；`volume.code` 必須是 `115AG6H`、`volume.publisher` 必須是「翰林」。介面會拒絕 `undefined`、私有絕對路徑、官方原檔標記、非 WebP／AVIF 資產與超過單張 300 KiB 的圖片。

```powershell
python scripts/generate_lessons.py `
  --profile g6a `
  --prepared-root <private-prepared-root> `
  --repo-root <repo>\apps\mandarin `
  --lessons 1-12 `
  --progress-file <private-progress.json> `
  --resume
```

這是「公開介面」，不是官方原始檔匯入器：來源清理、官方 hash、人工確認與準備資料產出仍在私有工作區完成；介面只負責契約驗證、複製衍生 JSON／壓縮資產、同步舊字新詞索引與合併課程索引。第一次匯入可先加 `--dry-run`，中斷後使用同一指令加 `--resume`。

## G6A 專用來源閘門

G6A 的 12 課先在私有工作區完成：

1. 以官方課文、形音資料、修辭輕鬆學與閱讀理解提問建立來源台帳。
2. 每課保留來源檔案 SHA-256 與 `official_characters`，不從舊稿臆造缺漏內容。
3. 由私有 Python source-materializer（`materialize_g6_rebuild_from_clean_sources.py`）產出各模組的標準化 JSON 與圖片 manifest。
4. 人工確認語詞、圖片、修辭、聆聽答案與課文段落 fallback。
5. 形似字選項以官方形似字辨別題庫的 `official_shape_group` 逐組核對；若選項無法確認為字形相近，標記 `REVIEW_REQUIRED`，不得直接公開。
6. 通過審核後才寫入 `public/data/115AG6H/lessonNN.json` 與 `public/assets/115AG6H/lessonNN/`。
7. 使用同一組容量、資料、建置與回歸測試。

G6A 目前的 12 課是已審核基準，不在公開產生器中重新攜入官方原始檔；若日後需要重建，只需把私有來源清理器的輸出接到相同的標準化課次契約，再沿用索引、圖片與驗證階段。

## 工作流完整性檢查

每次新增年級、出版社介面或教材模組時，先執行：

```powershell
node scripts/check-workflow-completeness.mjs
```

檢查器會確認工作流文件、匯入規格、G1A／G3A／G6A 批次介面、G6A 準備資料閘門、`dabutie` 抽取／合併工具、圖片容量閘門、舊字新詞同步，以及各項教材規則對應的回歸測試都仍存在。它只檢查公開 repo 的工具與契約，不會讀取或公開官方教材原檔；缺少任一必要項目即以非零狀態結束。

## 形似字選項核對

官方來源的「形似字」資料常以例詞呈現，不能用例詞第一字推回答案字。批次處理時，先以官方題庫的空格正解與 `official_shape_group` 建立群組，再寫入公開 JSON；例詞只作為該字的作答情境。G3A、G6A 已核對內容的群組基準保存於 `docs/lookalike-approved-groups.json`，不包含官方原始檔或完整教材。

```powershell
cd apps/mandarin
node scripts/test-lookalike-shape-groups.mjs
```

這項測試會跨公開的 G3A、G6A 與目前有資料的其他年級課次，檢查每課群組與核對基準一致、每組至少兩個不重複漢字、每個例詞確實包含對應字；若未經核對的字混入選項，建置前即失敗。G1A 尚無已核准的形似字資料時，維持模組未開放，不以猜測內容填充。

## 修辭小偵探關鍵字變色規則

修辭題目的資料標記、畫面顯示與朗讀文字分成三層處理：

1. `public/data/<冊別>/lessonNN.json` 的 `rhetoric[].example` 保存官方解析中的關鍵字標記。每一筆 `status` 為 `ready` 或 `approved` 的可用題目，至少要有一組完整的 `﹁文字﹂`；標記只包住真正要觀察的字詞或句段，不可把整個題目無差別包起來。
2. `src/activities/rhetoric.js` 由 `splitRhetoricExample()` 解析 `﹁﹂`，並相容既有的 `「」`、`『』`。被標記的片段必須輸出為 `<span class="rhetoric-highlight">`，未標記文字維持一般文字。
3. `.rhetoric-highlight` 的樣式負責呈現修辭模組的關鍵字色彩。題幹畫面不得顯示框字標記本身；朗讀與「全部聽給我聽」一律使用 `stripRhetoricMarkup()` 移除標記後的純文字。
4. 每次新增或匯入修辭資料，執行 `node scripts/test-rhetoric-highlights.mjs`。測試會跨 G1A、G3A、G6A 所有課次，檢查可用題目都有成對標記、標記數與變色片段數一致、朗讀文字不含框字，並確認變色 CSS 存在。沒有修辭資料的一年級課次維持模組未開放，不需製造空白標記。

## 語詞解釋卡補圖

檔案：`scripts/fill_vocabulary_images.py`

這支工具只接受兩種來源：私有教材中檔名含有「完整詞名元件」的舊圖，或私有生成圖 manifest。它不會把「鹹味蔚藍回航」這類多詞合成預覽圖誤配給單一語詞；所有輸出會壓縮到 `public/assets/<冊別>/lessonNN/vocabulary/`，並回寫課次 JSON 的 `image` 路徑。

```powershell
python scripts/fill_vocabulary_images.py `
  --source-root <private-workspace-root> `
  --repo-root <repo>\apps\mandarin `
  --codes 115AG3H,115AG6H `
  --generated-manifest <private-generated-manifest.json>
```

生成圖 manifest 與原始 PNG 只留在私有工作區，不得加入公開 repo；完成後仍須執行 `npm.cmd run check-assets`，確認單張、單課與總容量閘門。

## 完工檢查

```powershell
cd apps/mandarin
npm.cmd run validate
node scripts/sync-review-coverage.mjs --check
node scripts/test-review-coverage.mjs
node scripts/test-lookalike-shape-groups.mjs
npm.cmd run build
npm.cmd run check-dist
npm.cmd run check-assets
node scripts/check-workflow-completeness.mjs
Get-ChildItem scripts/test-*.mjs | ForEach-Object { node $_.FullName }
```

其中 `node scripts/test-idiom-sentence-contexts.mjs` 會跨所有公開年級與課次檢查：有成語的課次是否每個成語都有核准情境句、例句是否包含對應成語、挖空後是否仍有足夠語境，以及是否誤用泛用模板。沒有成語資料的課次會列為「不開放本模組」，不會被當成缺例句失敗。

容量規則：單張 WebP／AVIF ≤ 300 KiB，單課 ≤ 4 MiB；`public/assets` 接近 600 MiB 時發出警告，達 700 MiB 時阻擋建置。完成後確認 `git status`、提交範圍與 `HANDOFF.md`，不要把私有來源、Excel、完整課文或進度檔加入公開 repo。
