# 國語教材網站批次產出工作流

本文件把 G3A、G6A 的教材網站產出流程固定下來，並說明目前可重跑的 Python 產生器。公開 repo 只保存衍生後的課程 JSON、壓縮圖片與索引；官方教材、完整課文、Excel 與審核用工作檔仍留在私有工作區。

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
7. 建立「成語填句子」資料：每個可用成語都要有一筆完整、自然、可由上下文判斷的具體情境句；句中必須包含該成語，挖空成語後仍要保留足夠語境。禁止使用「遇到生活中的相關情況時，可以用……來形容」等泛用模板。若該課尚無成語資料，維持模組未開放，不用空白或泛用題目填充。
8. 合併 `course-index.json`，不能因為只產生部分課次而刪掉既有課次。
9. 寫入外部進度檔。中斷後以 `--resume` 跳過已有且狀態為 `ready` 的課次。
10. 執行資料驗證、成語情境句檢查、圖片容量檢查、建置與回歸測試，再 commit。

## Python 批次產生器

檔案：`scripts/generate_lessons.py`

這支工具目前直接涵蓋 G3A 與 G1A 的標準化輸入。G6A 使用同一份公開 JSON 契約；G6A 的官方來源清理、來源 hash 與每課 manifest 保留在私有工作流，完成審核後再匯入既有公開資料結構，避免把官方檔案帶入公開 repo。

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

## G6A 專用來源閘門

G6A 的 12 課先在私有工作區完成：

1. 以官方課文、形音資料、修辭輕鬆學與閱讀理解提問建立來源台帳。
2. 每課保留來源檔案 SHA-256 與 `official_characters`，不從舊稿臆造缺漏內容。
3. 由私有 Python source-materializer（`materialize_g6_rebuild_from_clean_sources.py`）產出各模組的標準化 JSON 與圖片 manifest。
4. 人工確認語詞、圖片、修辭、聆聽答案與課文段落 fallback。
5. 通過審核後才寫入 `public/data/115AG6H/lessonNN.json` 與 `public/assets/115AG6H/lessonNN/`。
6. 使用同一組容量、資料、建置與回歸測試。

G6A 目前的 12 課是已審核基準，不在公開產生器中重新攜入官方原始檔；若日後需要重建，只需把私有來源清理器的輸出接到相同的標準化課次契約，再沿用索引、圖片與驗證階段。

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
npm.cmd run build
npm.cmd run check-dist
npm.cmd run check-assets
Get-ChildItem scripts/test-*.mjs | ForEach-Object { node $_.FullName }
```

其中 `node scripts/test-idiom-sentence-contexts.mjs` 會跨所有公開年級與課次檢查：有成語的課次是否每個成語都有核准情境句、例句是否包含對應成語、挖空後是否仍有足夠語境，以及是否誤用泛用模板。沒有成語資料的課次會列為「不開放本模組」，不會被當成缺例句失敗。

容量規則：單張 WebP／AVIF ≤ 300 KiB，單課 ≤ 4 MiB；`public/assets` 接近 600 MiB 時發出警告，達 700 MiB 時阻擋建置。完成後確認 `git status`、提交範圍與 `HANDOFF.md`，不要把私有來源、Excel、完整課文或進度檔加入公開 repo。
