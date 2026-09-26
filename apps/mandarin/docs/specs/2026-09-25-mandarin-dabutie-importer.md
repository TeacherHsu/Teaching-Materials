# 國語教材大補帖匯入器規格

版本：2026-09-25

本規格定義官方教材來源如何轉成網站可用的衍生課次資料。它適用於 `apps/mandarin` 的資料驅動網站與 `tools/dabutie` Python 匯入器；官方原始檔、完整課文、Excel、來源台帳與人工審核工作檔不進公開 repo。

## 1. 權責與資料邊界

來源處理分成兩層：

1. 私有來源層：讀取出版社教材、保存來源檔 SHA-256、整理課次、抽取文字、建立審核佇列與圖片 manifest。
2. 公開衍生層：只輸出符合網站契約的 `lessonNN.json`、壓縮後的 WebP／AVIF、課程索引與不含私有絕對路徑的來源標籤。

公開層不得出現下列內容：

- 出版社官方 `.doc`、`.docx`、PDF、PPTX 或完整課文。
- 私有工作區絕對路徑、來源台帳、未審核草稿與學生資料。
- 尚未確認的字音、詞義、形似字群組、聆聽答案或圖片配對。

## 2. 標準化課次契約

每課輸出至：

```text
public/data/<volume-code>/lessonNN.json
public/assets/<volume-code>/lessonNN/
```

課次 JSON 至少需要：

```text
lesson_id, volume, unit, lesson_no, title,
characters, words, modules
```

`lesson_id` 必須等於 `<volume-code><兩位課次>`；`volume.code`、出版社、年級與學期必須和 profile 一致。所有可公開題目使用 `ready` 或 `approved`，`draft`、`todo_rewrite`、`REVIEW_REQUIRED` 不得在正式建置中出現。

## 3. 官方資料抽取與來源優先序

翰林大補帖目前由 `tools/dabutie/import_lesson.py` 統一呼叫 extractor，再由 `merge.py` 產生網站契約。各模組來源如下：

| 網站模組 | 來源類型 | 公開前閘門 |
|---|---|---|
| 生字卡 | 各冊生字表、教育百科字音與部首 | 生字清單一致、字音已查證 |
| 生字造詞 | 06 字義分析與私有常用度 Excel | 常用度前三項；不足才用本課官方詞，不自行創詞 |
| 語詞解釋 | 05 形音輕鬆學的語詞解釋 | 目標詞與釋義逐詞核對 |
| 一字多義 | 05 字義辨正或指定官方字義分析 | 不直接顯示答案，例句需可判斷 |
| 一字多音 | 05 認識多音字 | 至少兩個已查證讀音；來源缺段落就維持未開放 |
| 成語 | 07 生字延伸成語 | 每個成語有具體情境句，不使用泛用模板 |
| 句型 | 08 句型總表、07 語句練習 | 詞塊合理、`parts` 打亂、`solution_parts` 保留正解順序 |
| 修辭 | 修辭分析／修辭輕鬆學 | 官方 `﹁﹂` 框出的關鍵字要保留並變色 |
| 形似字 | 官方字音字形／字形辨別題庫 | 只能使用已核准的 `official_shape_group` |
| 聽聽看 | 閱讀理解、教材聆聽故事與課文 | 題幹、答案與音訊內容必須一致 |
| 課文摘要 | 課文導讀、課文大意、段落大意、結構表 | 不得產生 `undefined`；段落不明確時顯示文本 |

不同出版社不可直接套用上述路徑。新增 profile 前，必須先建立來源對照表，逐項確認資料夾、檔名、課次標記與內容欄位；找不到來源時標記 `missing` 或 `REVIEW_REQUIRED`，不可猜測替代。

## 4. G1A／G3A 官方來源批次介面

`scripts/generate_lessons.py` 的 `g1a` 與 `g3a` profile 接受私有 `--source-root`，支援課次範圍、私有 Excel、Unihan、pypinyin 與外部進度檔。`--dry-run` 只檢查來源，`--resume` 依進度檔與輸出 JSON 的 SHA-256 跳過已完成課次。

## 5. G6A 公開準備資料介面

G6A 的官方來源清理器與來源 hash 留在私有工作區。私有流程完成審核後，必須輸出：

```text
<prepared-root>/115AG6H/lessonNN.json
<prepared-root>/assets/115AG6H/lessonNN/**/*.webp
```

公開介面使用：

```powershell
python scripts/generate_lessons.py `
  --profile g6a `
  --prepared-root <prepared-root> `
  --repo-root <repo>\apps\mandarin `
  --lessons 1-12 `
  --progress-file <private-progress.json> `
  --resume
```

介面只複製標準化衍生資料，不解析官方原始檔。它會拒絕契約欄位不足、課次編號不符、出版社不符、`undefined`、私有路徑、非 WebP／AVIF 及超過 300 KiB 的資產，完成後同步 `review_words` 與 `course-index.json`。

### 5.1 G4A 康軒來源準備與公開介面

G4A 使用 `115AG4K` profile。私有準備器 `scripts/prepare_g4a.mjs` 只讀取已完成來源核對的康軒四上衍生資料，依課次資料夾與來源 manifest 對齊生字、語詞解釋、段落摘要及形似字；它不把官方 `.doc`、完整課文、來源絕對路徑或原始圖片寫入準備資料。沒有明確來源的句型、成語、修辭、一字多義、一字多音與聆聽答案維持 `missing`；語詞圖片則須在後續補圖階段以明確舊圖或私有生成圖 manifest 建立，無法對應時才維持 `image: null`。

```powershell
node scripts/prepare_g4a.mjs `
  --source-root <private-workspace-root> `
  --prepared-root <private-prepared-root> `
  --python <private-python.exe> `
  --pypinyin-path <private-pypinyin-directory>

python scripts/generate_lessons.py `
  --profile g4a `
  --prepared-root <private-prepared-root> `
  --repo-root <repo>\apps\mandarin `
  --lessons 1-12 `
  --workbook <private-workbook.xlsx> `
  --unihan-zip <private-Unihan.zip> `
  --progress-file <private-progress.json> `
  --resume
```

準備資料必須使用 `115AG4K`／「康軒」契約。公開 Python 介面在匯入時補上 Unihan 部首與筆畫、常用度前三項造詞、筆順連結及機械挑戰題，並再次執行私有路徑、`undefined`、資料契約與 WebP／AVIF 容量閘門。pypinyin 只作為已核對注音 manifest 缺漏時的明確衍生欄位，並以 `zhuyin_source` 留下方法標記，供後續依課本複核。

## 6. 圖片與容量

- 只公開 WebP／AVIF。
- 單張不超過 300 KiB。
- 單課不超過 4 MiB。
- `public/assets` 接近 600 MiB 警告，達 700 MiB 阻擋建置。
- 語詞圖片必須是完整詞名的明確對應，不可把多詞合成圖配給單一語詞。
- 補圖順序固定為：先掃描同冊私有來源中能由完整詞名確認的舊圖，再使用依官方 meaning 產生的私有 manifest；不能由檔名或 manifest 確認的舊圖不得猜配。
- `scripts/build_vocabulary_image_manifest.mjs` 只建立私有 manifest，原始 PNG 與 manifest 不得進公開 repo；`scripts/fill_vocabulary_images.py --refresh` 才能依來源優先序重新回寫既有圖片。

使用 `scripts/fill_vocabulary_images.py` 或 `scripts/compress-images.py` 後，必須執行 `npm.cmd run check-assets`。

## 7. 合併、審核與重跑安全

匯入器不得刪除其他課次；重跑時保留已核准的改寫、審核狀態與人工備註。`apply_review.py` 只套用明確核准的項目，`apply_rewrites.py` 只處理改寫佇列。任何來源不完整都要 fail closed，不做部分匯入冒充完整教材。

## 8. 完工閘門

```powershell
npm.cmd run validate
node scripts/sync-review-coverage.mjs --check
node scripts/check-workflow-completeness.mjs
npm.cmd run build
npm.cmd run check-dist
npm.cmd run check-assets
Get-ChildItem scripts/test-*.mjs | ForEach-Object { node $_.FullName }
python -m pytest tools/dabutie/tests -q
```

以上任一項失敗，該批次不得標記為 `ready`，也不得直接公開。工作流完整性檢查器只確認公開工具、規格與測試的存在及相互對應；官方內容正確性仍需依來源台帳與人工核對完成。
