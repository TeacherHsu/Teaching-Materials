# 照樣造短語｜批次製作規格（2026-10-05，CF 已核准範例：二上 L09）

範例：`public/data/115AG2H/lesson09.json` 的 `phrase_builders[0]`（status=approved）。照它的格式做。

## 來源（紅線）
- 只用課次 JSON `sentence_patterns` 裡 category 為「短語練習」或「短語句型練習」的項目（官方各課短語句型練習）。
- `pattern_ref` = 該項 id；`example.chunks` 拼起來必須**完全等於**該項 `head`（課本短語）；`official` 抄 head／examples／structure。
- `source` 抄該項 source。新項目一律 `status: "draft"`，`authored_note` 寫「詞塊拆分、圖片描述、語意判定與回饋為本站編寫（非官方教材），需教師確認」。
- 不改 `sentence_patterns` 任何內容；不放課文全文；不寫學生姓名。
- 做不到（結構太長、超過 4 個可換格、像整句造句）就跳過，寫進 review 檔「跳過原因」。

## 結構
- `slots`：依官方 `structure` 拆。可換的格子 `{role, label}`，label 用學生看得懂的白話（例：「怎麼樣的」「什麼東西」「做什麼」「誰」「心情」），不要用「形容詞／名詞／動詞」當 label。
  固定不換的字（越、又、的時候、得、著、無比、是如此……）用 `{fixed:"越"}`。可換格子最多 3 個。
- `explain`：一句白話，說「哪裡可以換」，例：「『越』後面各放一個動作或感覺。」
- `bank`：每個可換 role 放 3 個詞塊，**優先用官方 head 與 examples 裡出現的詞**，不足才補常見詞。
- `accepted`：說得通的完整組合（含 fixed 字，順序同 slots）。官方 head、examples 一定在內。
- `semantic_rejects`：其餘每一種「結構正確」的組合都要列出（測試會檢查窮舉），附一句回饋：開頭「順序對了。」接著用問句引導想意思，不說「錯」、不給答案。
  若某組合其實說得通但不是圖片意思，放 `accepted`（元件會回「也通順，但和圖片不一樣」）。
- `rounds`：2 輪，各綁一個 `answer`（必須在 accepted），通常用官方 examples 的前兩個。
  - `image.src`：`/assets/phrases/<lessonId>-<英文短名>.webp`
  - `image.alt`：一句中文描述圖片（學生看得懂），會顯示並朗讀。
  - `image.prompt`：英文生圖描述，只寫主體與動作（風格由產圖程式統一加），一圖一重點、無文字、無人臉特寫也可（有人時寫 "a child"）。
  - `image_hint`：第 1 級提示，指向圖片關鍵（不直接說出答案詞）。
  - `check`：`{prompt:"哪一個比較適合這張圖片？", options:[正解短語, 一個 semantic_reject 短語]}`，各附一句原因回饋，只有一個 correct。
- 課次 `modules` 加 `"phrase_builder": {"label": "照樣造短語"}`（若沒有）。

## 寫檔規則
- 用 Python 讀寫 JSON：`json.dumps(d, ensure_ascii=False, indent=2) + "\n"`，只新增 `phrase_builders` 與 modules 鍵，其他內容不得變動（`git diff` 應只有新增行）。
- 跑 `node scripts/test-phrase-builder.mjs` 與 `npm run validate` 必須通過。
- 不要跑任何 git 指令；不要改 src/ 或 scripts/。
- 每個年級寫一份確認清單 `docs/review/2026-10-05-phrase-builder-<冊別>-confirm.md`，格式同 `2026-10-05-phrase-builder-115AG2H09-confirm.md`（每課：官方來源、格子與詞塊、語意判定表含回饋、圖片 alt、小確認題、跳過的項目與原因）。
