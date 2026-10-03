# 國語教材網站批次產出工作流

本文件把 G1A、G2A、G3A、G4A、G6A 的教材網站產出流程固定下來，並說明目前可重跑的 Python 產生器與各版本準備資料器。公開 repo 只保存衍生後的課程 JSON、壓縮圖片與索引；官方教材、完整課文、Excel 與審核用工作檔仍留在私有工作區。

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
4. 讀取官方語詞解釋。G3A 第 7 課採用 `low-g3-v2` 已審核 manifest；第 8–12 課逐課核對 05 形音輕鬆學官方詞表並完整匯入，官方詞目排在前面，既有非重複補充詞卡留在後面。所有圖片都要有逐詞完全相符的來源對應；既有課次補圖時，使用 `fill_vocabulary_images.py`，舊教材明確對應圖優先，沒有可核對舊圖的詞才接入私有生成圖 manifest。G3A 第 8–12 課執行 `npm run materialize:g3a-vocabulary`；來源台帳與原圖留在私有教材工作區。
5. 將圖片轉成 WebP，單張不得超過 300 KiB，單課不得超過 4 MiB。
6. 產生固定網站資料結構：生字卡、語詞解釋卡、隨機選項、筆順外部連結與模組可用狀態。
7. 建立「舊字新詞」跨課索引：每課的 `review_words.by_lesson` 必須累積同冊截至本課的已公開生字；第 2 課起要以實際前課生字／語詞至少 3 題為可開始條件，第 1 課維持鎖定。不得只改模組文字而沒有可產生的跨課題目。
8. 建立「成語填句子」資料：每個可用成語都要有一筆完整、自然、可由上下文判斷的具體情境句；句中必須包含該成語，挖空成語後仍要保留足夠語境。禁止使用「遇到生活中的相關情況時，可以用……來形容」等泛用模板。若該課尚無成語資料，維持模組未開放，不用空白或泛用題目填充。
   成語理解圖須針對辭意建立清楚的兒童教材插圖；公開圖片統一為 960×960 WebP，單張不得超過 300 KiB。直式、橫式或非 960 正方形來源，必須以 `normalize-idiom-images.py` 完整容納於正方形畫布，不得用 `cover` 裁切；在 `idioms[].image` 使用明確的相對路徑，並以 `image_layout` 記錄 `square-native` 或 `square-contain`。圖片來源標記保留為 `image_origin`，不得寫入私有絕對路徑。
9. 建立「修辭小偵探」資料：每一筆可用的 `rhetoric` 題目都要在 `example` 中以 `﹁關鍵字﹂` 標出官方解析所框出的關鍵字；若是既有資料使用 `「關鍵字」` 或 `『關鍵字』`，可保留作相容格式，但新增資料統一使用 `﹁﹂`。
10. 建立「聽聽看」資料：每一題必須先回到官方課文或已核准的對應閱讀內容，找出足以支持答案的關鍵語句，寫入 `passage`；`passage` 只能放一至兩句關鍵語句，不得把整個自然段、題目、選項、答案解析或「請仔細聽題目」等提示句當成播放內容。`question` 是聽完後才顯示／朗讀的作答問題，不能與 `passage` 相同。
11. 建立「形似字」資料：答案選項只能來自官方形似字辨別題庫核定的同一字形群組；不可把例詞的第一個字直接當成答案，也不可因讀音、詞義相近就混入非形似字。每個選項都要有包含該字的有效例詞，並保留一份公開衍生的核對基準 `docs/lookalike-approved-groups.json`。匯入後必須檢查「每個 `char` 都出現在自己的例詞裡、且是例詞共有的字」——康軒四上曾整批誤存成第一個例詞的首字（2026-10-04 以 `tools/fix_lookalike_chars.py` 修正 64 筆，重新匯入後要重跑）。之後跑 `python3 tools/build_hanzi_parts.py` 更新字形資料。
12. 合併 `course-index.json`，不能因為只產生部分課次而刪掉既有課次。
13. 寫入外部進度檔。中斷後以 `--resume` 跳過已有且狀態為 `ready` 的課次。
14. 執行資料驗證、舊字新詞全面稽核、成語情境句與成語圖片檢查、形似字選項核對、修辭關鍵字變色檢查、聽聽看內容對應稽核、圖片容量檢查、建置與回歸測試，再 commit。

### 生字測驗與課文地圖內容閘門

- 「看字選音」只可呈現題幹為單一生字注音題、答案與該字已記錄的教育百科注音一致、三個選項皆為注音且互異並包含答案的題目。部首、字義或來源／選項未完整核對的選擇題不得混入此步驟。
- 「課文地圖」的 `structure_role` 必須是經來源核對的結構角色；課文小標題、內容主題和「第 N 段重點」等段落標籤不能充當結構答案。暫無核准角色的課次應維持教材審核中，不以猜測補齊。新增角色須同時更新 `src/activities/structureMapRoles.js` 與對應回歸測試。
- 執行 `node scripts/test-character-pronunciation-filter.mjs` 與 `node scripts/test-structure-map-role-filter.mjs`，確認題型、答案與可呈現的結構角色通過閘門。

### 句子排序共用互動契約

各年級「練習句子」的句子排序都必須使用共用 `src/components/SentenceOrdering.js`，不得在年級或出版社資料中另做一套判錯邏輯。學生按下「檢查答案」後，逐詞塊比對目前序位：

- 位置正確的詞塊留在原位，使用綠底黑字並鎖定，讓學生保留已完成的線索。
- 位置錯誤的詞塊使用紅底黑字退回候選區，保持可拖曳／點選，讓學生再次唸讀後重新放入正確序位。
- 尚未送出檢查前，再點一次已放置的詞塊時，只將該詞塊退回候選區原本的位置，其他已放置詞塊保留，方便檢查與調整。
- 空出的序位顯示可放置目標；重新排列時不可移動已鎖定的正確詞塊。
- 正確詞塊的 disabled 狀態不得造成文字灰階或透明，錯誤詞塊也不得只以紅色文字表示；兩者都要保留足夠的底色與黑色文字對比。

這項契約由 `scripts/test-sentence-ordering-feedback.mjs` 驗證，並由 `scripts/check-workflow-completeness.mjs` 納入工作流完整性閘門；因此 G1A、G2A、G3A、G4A 與 G6A 只要使用同一個句型練習活動，就會自動套用相同模式。

### 聽聽看：先聽對應內容再回答

「聽聽看」不是把題目念一遍後再問同一題，而是依序完成：

1. 從官方課文、官方閱讀理解資料或已核准的教師來源，定位本題答案所在的內容。
2. 只摘錄能支持答案的一至兩句關鍵語句，寫入該題的 `passage` 欄位。必要時可保留兩句的前後因果，但不得全文搬入公開 JSON。
3. `question` 只保留學生聽完後要回答的問題；不得把 `question`、選項、答案解析或「請仔細聽題目」當成 `passage`。
4. 每題在畫面上顯示「先聽一聽」按鈕。正常支援語音的畫面只播放 `passage`，不把 `passage` 全文印在題目頁；沒有語音 API 時才提供文字 fallback。
5. 選項只保留學生需要比較的答案短語或短句，不得放入頁碼、課文依據、解題過程、推論說明或整段課文；單一選項超過 45 字即列入 `REVIEW_REQUIRED`，回核後縮成精簡答案。
6. 新資料必須有可追溯的官方來源標籤與課次定位；公開資料只放必要的關鍵語句，不放官方課文檔、完整自然段或私有絕對路徑。

既有資料若只有 `stem`：

- `stem` 是內容敘述且與題目不同時，標為 `REVIEW_REQUIRED`，回官方課文核對後搬入 `passage`。
- `stem` 等於 `question`，或含「請仔細聽題目／根據剛才聽到」等提示時，判為 `FAIL`，不得直接開放。
- 沒有聽聽看題目的課次可維持 `modules.listening.status: "missing"`，不可用空白題或朗讀題目冒充內容。

每次新增或匯入聽聽看資料，執行：

```powershell
npm.cmd run backfill:listening
node scripts/audit-listening-content.mjs
node scripts/audit-listening-content.mjs --strict
node scripts/test-listening-single-round.mjs
```

`backfill:listening` 只套用已回到私有官方課文核對過的逐題關鍵語句，不帶入官方課文全文；第一個稽核指令列出各年級與各課的盤點結果；`--strict` 在仍有 `FAIL` 或 `REVIEW_REQUIRED` 時阻擋發布。完成人工核對並補齊 `passage` 後，才可把課次標為 `available`。

這支稽核器能可靠抓出欄位缺漏、把題目當成播放內容、提示句冒充內容，以及整段過長等結構問題；它不能只靠字串相似度證明 `passage` 的語意真的支持答案。因此 `REVIEW_REQUIRED` 必須回到官方課文逐題核對，不能把自動稽核通過當成教材內容審核完成。

## Python 批次產生器

檔案：`scripts/generate_lessons.py`

這支工具目前直接涵蓋 G3A 與 G1A 的官方來源標準化輸入，也提供 G2A、G4A、G6A 的公開準備資料介面。G2A、G4A 與 G6A 的官方來源清理、來源 hash 與每課 manifest 保留在私有工作流，完成來源核對後只將標準化課次 JSON 與壓縮圖片交給公開介面，避免把官方檔案帶入公開 repo。

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

批次輸出後，無論是 G1A、G2A、G3A 或已審核匯入的 G4A／G6A，都要同步同冊跨課索引：

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

G1A 基礎課次產出後，再執行公開擴充內容物化器，將私有官方來源轉成不含完整課文與私有路徑的衍生資料：

```powershell
npm run materialize:g1a
```

G1A 成語理解圖先在私有工作區保存生成接觸表，再以裁切器輸出每個成語一張 960×960 WebP；裁切器只將圖片與相對路徑寫入公開資料，不把接觸表或私有路徑帶入 repo：

```powershell
python scripts/materialize-g1a-idiom-images.py
npm run materialize:g1a
```

G3A 第 7–12 課原本沒有成語圖片的 32 筆，依公開課次成語辭意在私有工作區生成單張理解圖，再由 `materialize-g3a-missing-idiom-images.py` 轉成公開資產。物化器只接受課次 JSON 中原本為空的成語圖片欄位，依課次、順序與成語名稱核對檔名；生成 PNG 不進公開 repo，公開資料只保留相對 WebP 路徑、`image_origin` 與 960×960 完整容納標記：

```powershell
python scripts/materialize-g3a-missing-idiom-images.py
```

全站既有年級的成語圖再執行一次完整容納器。它不覆寫原圖，非 960×960 來源另存為 `-fit.webp`，並回寫公開 JSON；原圖因此保留，教材只引用不裁切的正方形版本：

```powershell
python scripts/normalize-idiom-images.py
```

此物化器核對 `04形音輕鬆學(含語詞解釋)`、`05生字延伸成語`、`06各課短語句型練習`、`08課文結構表`、`09閱讀理解提問` 及私有形似字題庫；句型、讀懂課文、課文地圖、形似字、成語與一字多義／多音只寫入衍生 JSON。官方來源沒有兩種不同注音的課次，保留一字多音未開放，不以猜測內容補齊。

### 額度中斷後續作

進度檔不放在 repo，而是放在私有工作區。每課完成後記錄 `ready`、時間與輸出 JSON 的 SHA-256；若執行中斷，重新執行同一指令並加上 `--resume`，會從第一個尚未完成或輸出不存在的課次接續。額度恢復後不需要重新產出已完成課次。

### G2A 公開準備資料介面（翰林來源閘門）

G2A 使用翰林二上官方來源 `115G2A_國語 翰/01_本學年官方教材`。私有準備器 `scripts/prepare_g2a.py` 先讀取已核對的生字注音 manifest、04 形音輕鬆學語詞解釋、05 生字延伸成語、06 短語句型、07 主旨摘要、10 閱讀提問、形似字題庫與教師提供的課文整理；它只輸出不含完整課文、官方原檔與私有絕對路徑的標準化課次 JSON。語詞圖與成語圖先在私有階段盤點，舊圖必須完全對應，缺圖才使用私有生成圖接觸表裁切，全部再壓成 WebP。

```text
<prepared-root>/
  115AG2H/
    lesson01.json
    lesson02.json
  assets/115AG2H/lesson01/**/*.webp
  assets/115AG2H/lesson02/**/*.webp
```

`lessonNN.json` 必須符合既有公開課次契約，`volume.code` 為 `115AG2H`、出版社為「翰林」。每個生字保留課本核對注音、三個造詞與教育百科連結；每課由公開介面補上 Unihan 部首／筆畫，並帶入雄筆順外部連結。成語圖片來源與圖片容量留在私有來源稽核；公開 JSON 只保存衍生圖片路徑與不含本機路徑的來源標記。

```powershell
python scripts/prepare_g2a.py `
  --source-root <private-workspace-root> `
  --prepared-root <private-prepared-root> `
  --repo-root <repo>\apps\mandarin `
  --idiom-sheets <private-generated-contact-sheets>

python scripts/generate_lessons.py `
  --profile g2a `
  --prepared-root <private-prepared-root> `
  --repo-root <repo>\apps\mandarin `
  --lessons 1-12 `
  --unihan-zip <private-Unihan.zip> `
  --progress-file <private-progress.json> `
  --resume
```

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

### G4A 公開準備資料介面（康軒來源閘門）

G4A 使用康軒版，不能直接套用翰林資料夾名稱。私有來源階段先掃描並核對 `115G4A_國語 康/01_本學年官方教材` 的 12 課生字表、課文、語詞解釋、形似字、段落大意與閱讀理解來源，再由 `scripts/prepare_g4a.mjs` 輸出不含官方原檔與私有路徑的標準化課次 JSON。這一步只整理已有來源綁定的衍生資料；沒有完成來源核對的句型、成語、修辭、一字多義、一字多音、聆聽答案與語詞圖片維持未開放，不自行補寫。

```powershell
cd apps/mandarin
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
  --unihan-zip <private-Unihan.zip> `
  --progress-file <private-progress.json> `
  --resume
```

`prepare_g4a.mjs` 會在 12 課中保留來源已備妥的生字、語詞解釋、段落摘要與形似字；注音優先使用各課已核對的語詞注音 manifest，沒有直接命中的生字才使用固定 pypinyin 環境作為衍生欄位。Python 產生器接手後補上 Unihan 部首／筆畫、常用造詞上限三項、筆順連結與部首挑戰題，並再次阻擋 `undefined`、私有絕對路徑、未壓縮圖片與超過 300 KiB 的資產。

G4A 的圖片仍遵守「只接受完全對應、已壓縮的 WebP／AVIF」規則。補圖時先掃描私有來源，只有檔名或 manifest 能完整對應詞語的舊圖才可重用；`L02_01.png` 這類沒有詞名對照的舊圖不得猜配。沒有明確舊圖時，依官方詞義建立私有生成圖 manifest，再由 `fill_vocabulary_images.py` 壓縮成 WebP 並回寫公開 JSON。完成匯入後，照本文件的索引、舊字新詞、資料、容量、建置與回歸檢查執行。

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

### 讀懂課文：選擇題答案鍵與對錯回饋

各年級的閱讀理解選擇題統一由 `src/components/ReadingQuestions.js` 轉交共用 `ChoiceQuiz`，不在年級頁另寫判分。選對時明確顯示「答對了」並標示正確選項；第一次答錯時保留其他選項、停用剛選錯的選項並給一個找線索提示；第二次答錯才揭曉正解並鎖定題目。未核定答案或答案不在選項內的題目會停止開放作答，避免只顯示所選文字或錯把資料當成可判分題。

每個答案鍵都必須是該題 `options` 的完整原字串，並填入 `answer_source`。目前四上、六上有選擇題；一至三年級維持逐步提示問答，不為了統一畫面而補造選項。日後任一年級新增選擇題，都會由同一元件提供回饋，並由跨年級測試檢查答案鍵是否完整。

四上、六上題目重建後，執行以下物化器；它會用題幹和正解文字成對核對，題目順序或題幹有變更時會停止，要求重新審核，不會默默把答案套到錯題：

```powershell
npm.cmd run materialize:g4a-reading-choices
npm.cmd run materialize:reading-answer-keys
node scripts/test-reading-question-feedback.mjs
```

新增或改寫答案鍵時，先回核該課閱讀教材與選項；有歧義的題目留待審，不以猜測的答案開放判分。公開 JSON 只存正確選項文字與衍生來源標記，不存官方解析或私有絕對路徑。

## 工作流完整性檢查

每次新增年級、出版社介面或教材模組時，先執行：

```powershell
node scripts/check-workflow-completeness.mjs
```

檢查器會確認工作流文件、匯入規格、G1A／G2A／G3A／G4A／G6A 批次介面、G2A／G4A／G6A 準備資料閘門、`dabutie` 抽取／合併工具、圖片容量閘門、舊字新詞同步，以及各項教材規則對應的回歸測試都仍存在。它只檢查公開 repo 的工具與契約，不會讀取或公開官方教材原檔；缺少任一必要項目即以非零狀態結束。

## 形似字選項核對

官方來源的「形似字」資料常以例詞呈現，不能用例詞第一字推回答案字。批次處理時，先以官方題庫的空格正解與 `official_shape_group` 建立群組，再寫入公開 JSON；例詞只作為該字的作答情境。G3A、G6A 已核對內容的群組基準保存於 `docs/lookalike-approved-groups.json`，不包含官方原始檔或完整教材。

```powershell
cd apps/mandarin
node scripts/test-lookalike-shape-groups.mjs
```

這項測試會跨公開的 G1A、G3A、G6A 與目前有資料的其他年級課次，檢查每課群組與核對基準一致、每組至少兩個不重複漢字；正確字必須有核對例詞，官方題庫只提供選項而未提供例詞的干擾字可留空。若未經核對的字混入選項，建置前即失敗。

## 修辭小偵探關鍵字變色規則

修辭題目的資料標記、畫面顯示與朗讀文字分成三層處理：

1. `public/data/<冊別>/lessonNN.json` 的 `rhetoric[].example` 保存官方解析中的關鍵字標記。每一筆 `status` 為 `ready` 或 `approved` 的可用題目，至少要有一組完整的 `﹁文字﹂`；標記只包住真正要觀察的字詞或句段，不可把整個題目無差別包起來。
2. `src/activities/rhetoric.js` 由 `splitRhetoricExample()` 解析 `﹁﹂`，並相容既有的 `「」`、`『』`。被標記的片段必須輸出為 `<span class="rhetoric-highlight">`，未標記文字維持一般文字。
3. `.rhetoric-highlight` 的樣式負責呈現修辭模組的關鍵字色彩。題幹畫面不得顯示框字標記本身；朗讀與「全部聽給我聽」一律使用 `stripRhetoricMarkup()` 移除標記後的純文字。
4. 每次新增或匯入修辭資料，執行 `node scripts/test-rhetoric-highlights.mjs`。測試會跨 G1A、G3A、G6A 所有課次，檢查可用題目都有成對標記、標記數與變色片段數一致、朗讀文字不含框字，並確認變色 CSS 存在。沒有修辭資料的一年級課次維持模組未開放，不需製造空白標記。

## 語詞解釋卡補圖

檔案：`scripts/fill_vocabulary_images.py`

這支工具只接受兩種來源：私有教材中檔名含有「完整詞名元件」的舊圖，或私有生成圖 manifest。它不會把「鹹味蔚藍回航」這類多詞合成預覽圖誤配給單一語詞；所有輸出會壓縮到 `public/assets/<冊別>/lessonNN/vocabulary/`，並回寫課次 JSON 的 `image` 路徑。G4A 康軒代碼 `115AG4K` 也走同一介面，預設檢查 G3A、G4A、G6A。若生成圖暫存檔以課次／詞序命名，可先用 `scripts/build_vocabulary_image_manifest.mjs` 建立私有 manifest，再交給補圖器；manifest 與原始 PNG 不得進入公開 repo。

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
node scripts/test-reading-question-feedback.mjs
npm.cmd run audit:listening
node scripts/audit-listening-content.mjs --strict
npm.cmd run build
npm.cmd run check-dist
npm.cmd run check-assets
node scripts/check-workflow-completeness.mjs
Get-ChildItem scripts/test-*.mjs | ForEach-Object { node $_.FullName }
```

其中 `node scripts/test-idiom-sentence-contexts.mjs` 會跨所有公開年級與課次檢查：有成語的課次是否每個成語都有核准情境句、例句是否包含對應成語、挖空後是否仍有足夠語境，以及是否誤用泛用模板。沒有成語資料的課次會列為「不開放本模組」，不會被當成缺例句失敗。

容量規則：單張 WebP／AVIF ≤ 300 KiB，單課 ≤ 4 MiB；`public/assets` 接近 600 MiB 時發出警告，達 700 MiB 時阻擋建置。完成後確認 `git status`、提交範圍與 `HANDOFF.md`，不要把私有來源、Excel、完整課文或進度檔加入公開 repo。
