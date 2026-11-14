# 朗讀遊戲（寵物餵食、朗讀打怪）

國語課文樂園年級頁「第 7～12 課綜合複習」用的生字、語詞朗讀練習。學生先聽示範、再對著麥克風念，念對就有回饋。

- `pet.html`：寵物餵食。念對一題 → 投餵肉肉 → 能量滿了破蛋。約每 3 題孵一顆蛋。
- `monster.html`：朗讀打怪。念出來的聲音變成聲波趕跑怪物；最後大魔王考第一次念得最不熟的 3 題。
- 網址 `?g=` 決定哪一冊，題庫由頁面依代號載入 `data/<代號>.js`：`G1A`（翰林一上第 1～7 課）、`G2A2`（翰林二上第 7～12 課）。進去先選課次（或大混合）與內容（生字／語詞）。
- 一年級（`taught_only`）生字的造詞只用「每個字都教過」的詞，找不到就只念單字。

本遊戲改編自「步步練」（<https://spedmixteaching.pages.dev/>）的魔法寵物孵化屋與朗讀打怪，原作者：米克師 spedmix2025，經原作者同意仿作。玩法參考原站，程式與美術是另外寫的；頁尾的出處標示請保留。

## 畫面上的選項

- **示範語音**（開始前，選內容旁邊）：「要示範」每題自動念一次、有 🔊 聽一聽；「不要示範」學生自己先念，第一次沒過關才出現 🔊 聽一聽當提示。
- **注音開／關**（右上角，遊戲中隨時切換）：關掉時只藏注音，國字不變。
- **動畫開／關**、**音效開／關**（右上角）。
- 示範語音、注音、動畫的選擇記在這台裝置（localStorage），不含任何學生資料。
- 示範語音會念錯的多音字，在 `tools/zhuyin-supplement.json` 的 `say` 指定同音字代念（例：一上第一課「和」ㄏㄢˋ 用「汗」），畫面仍顯示原字。

## 評分

同課文樂園「念讀語詞」：**不比聲調、同音字算對**（辨識器挑了哪個同音字不是學生的錯）。

| 結果 | 條件 | 回饋 |
|---|---|---|
| 念對 | 每個字都是同字或同音字；生字念成造詞（「不一樣的樣」）也算 | 3 份 |
| 很接近 | 語詞念對一半以上，或是容易混淆的音（ㄓㄗ、ㄔㄘ、ㄕㄙ、ㄋㄌ、ㄖㄌ、ㄣㄥ、ㄢㄤ） | 2 份 |
| 有開口 | 有聽到字但不像 | 1 份 |

- 一題集滿 3 份就過關；最多念 3 次，第 3 次不論結果都過關，不讓學生卡住。
- 分數只算每題第一次念的結果，滿分 100。大魔王關卡不計分。
- 沒聽到聲音不算次數；連續 2 次沒聽到、或麥克風被擋，會出現「老師確認通過」。
- 瀏覽器沒有語音辨識（或連不上）時，退成「有大聲念出來就算很接近」。
- 示範朗讀只用台灣國語語音；裝置沒有就不念，畫面會請老師示範。
- 不記錄任何學生資料，也不存成績。

## 更新題庫

```bash
python3 Chinese/Read-Aloud/tools/build_data.py           # 重產 data/*.js
python3 Chinese/Read-Aloud/tools/build_data.py --check   # ✅ 才能 commit
node --test Chinese/Read-Aloud/tests/grade.test.cjs
```

- `data/*.js` 是產物，不要手改。生字、語詞、生字讀音都來自 `apps/mandarin/public/data/<冊別>/lessonNN.json`。
- 課次資料裡沒有讀音的語詞，補在 `tools/zhuyin-supplement.json`（要寫來源；讀音不可憑記憶）。缺讀音時產生器會停下來。
- 生字的造詞只收「查得到讀音、而且這個字在詞裡的讀音和生字一致」的；找不到就只念單字。
- 同音字表需要 repo 外的兩個檔（注音字型讀音表、國語辭典簡編本離線詞庫），**只有家中 Mac 能重產**。
- 新增一冊：在 `build_data.py` 的 `SETS` 加一筆（html 不用改），把 `read-aloud.js` 的 `DATA_VERSION` 升版，重產後到 `apps/mandarin/public/data/course-index.json` 的 `reviews` 登記入口。
- 改了 css／js 之後，把兩個 html 的 `?v=` 一起升版。

## 驗收

無頭瀏覽器沒有麥克風，可在主控台用 `__readAloud.judge(3)`（3／2／1）模擬念讀結果。真實麥克風與語音辨識要在教室的電腦或 iPad 上試。

## 插圖與演出

素材為本遊戲原創的暖色童書貼紙插圖，全部存於 `img/`，遊戲執行時只載入本機素材，不使用 CDN、外部字型、圖片服務或新增函式庫。

| 用途 | 檔案 |
|---|---|
| 蛋的三個階段 | `egg-0.webp`、`egg-1.webp`、`egg-2.webp` |
| 破蛋與餵食 | `shell-top.webp`、`shell-bottom.webp`、`meat.webp` |
| 寵物寶寶 | `pet-dog.webp`、`pet-cat.webp`、`pet-rabbit.webp`、`pet-hamster.webp`、`pet-chick.webp`、`pet-penguin.webp`、`pet-fox.webp`、`pet-panda.webp`、`pet-koala.webp`、`pet-turtle.webp`、`pet-hedgehog.webp`、`pet-frog.webp` |
| 小勇士 | `hero-idle.webp`、`hero-shout.webp`、`hero-cheer.webp` |
| 小怪物 | `mon-1.webp`～`mon-6.webp`（安靜怪、悄悄鬼、摀耳蝙蝠、吸音章魚、靜音機器人、小聲龍） |
| 大魔王 | `boss.webp`、`boss-dizzy.webp` |
| 特效 | `wave.webp`、`star.webp` |
| 舞台背景 | `bg-hatchery.webp`、`bg-forest.webp` |

31 張角色／物件均為 512×512、有 alpha 的透明 WebP，單張不超過 120 KiB；2 張背景為 1600×640、不透明 WebP，單張不超過 220 KiB，`img/` 合計不超過 3.5 MiB。角色透過 `<img>` 呈現；每張都有 `onerror`，載入失敗即在相同容器顯示既有 emoji（蛋顯示原 SVG）。背景載入失敗即移除圖片，保留舞台漸層。

寵物每口肉肉依序拋向蛋，命中時擠壓回彈、加能量、冒愛心與碎屑；蛋到門檻換裂痕，滿能量後約 1.43 秒破蛋。打怪每道聲波依序命中，有衝擊環、星星、HP 彈走與短震動；大魔王先蓄力，滿格後發出特大聲波。結算使用寵物合照或歡呼勇士。新演出共用最多 60 個特效節點，用完移除；關閉動畫時立即完成視覺狀態，中途關閉也會取消尚未結束的演出。

原始 PNG、退件、`contact-sheet.png`、`generation-record.md` 與重產提示集合 `prompts.md` 留在 repo 外：

`/Users/hsuchiafang/Library/CloudStorage/OneDrive-個人/mandarin-work/read-aloud-art/`

重產時依提示集合以內建生圖逐張生成；蛋、勇士與大魔王姿勢使用原圖編輯以維持一致。將選定 PNG 放進該資料夾的 `originals/`，再執行外部的 `export-assets.py` 做透明邊整理、共同座標對齊及 WebP 輸出；原始 PNG、總覽與退件不要放回 repo。程式與素材引用版本同步為 `20261114e`。

```bash
node --test Chinese/Read-Aloud/tests/
python3 Chinese/Read-Aloud/tools/build_data.py --check
```

`visual.test.cjs` 用 Node VM／DOM 替身檢查缺圖處理、動畫關、粒子上限、取消清理與兩模式狀態；不代表瀏覽器驗收。實玩與裝置驗收清單見 `docs/VISUAL-IMPL-LOG.md`。
