# 成語插圖交接清單（給 Codex）

「生字變成語」第一關的成語卡會顯示插圖。圖檔路徑由資料**明確指定**，前端不會猜檔名：

- 資料欄位：`public/data/<冊別>/lessonNN.json` 的 `idioms[].image`，例如 `"idioms/迫不及待.webp"`
- 實際檔案位置：`apps/mandarin/public/assets/<冊別>/lesson<NN>/<image>`
  - 第 1 課：`apps/mandarin/public/assets/115AG3H/lesson01/idioms/迫不及待.webp`
- 缺圖時畫面只留空白框，不會壞版，所以可以分批放。

## 第 1 課待放圖（115AG3H 第 1 課〈時間是什麼〉）

- idioms/迫不及待.webp
- idioms/忍氣吞聲.webp
- idioms/疲於奔命.webp
- idioms/對牛彈琴.webp
- idioms/長話短說.webp
- idioms/一勞永逸.webp

以下指令可列出任一課的清單（含解釋）：

```bash
cd apps/mandarin && python3 -c "
import json; d=json.load(open('public/data/115AG3H/lesson01.json'))
[print(i['image'], i['idiom'], i['definition']) for i in d['idioms']]"
```

## 圖從哪裡來

家裡 Windows 的 Codex 在學習單專案裡已經替各課成語生過圖，**請優先沿用那批圖**，確保學習單和網站的圖一致，不必重新生成。沿用時要做三件事：

1. 轉成 `.webp`。
2. 依下方檔名改名。
3. 確認畫面上沒有文字；有字的話，換成無字版本或重新裁切。

## 規格

- 格式為 `.webp`，建議 1024×768（4:3）以內，單檔小於 200KB。
- 檔名必須與 `image` 欄位**完全相同**，包括中文成語本身。不要自行改名，也不要另外加編號。
- 畫面內**不要有文字**（成語字樣、注音都不要），避免與網站字體和讀音衝突。
- 風格：簡潔插畫，不要滿版卡通，也不要恐怖或暴力畫面，適合國小中年級。
- 大補帖內的原始圖片不可以用（版權不明）。

## 放好之後

```bash
cd apps/mandarin
npm ci
npm run validate && npm run build && npm run check-dist
for f in scripts/test-*.mjs; do node "$f" || exit 1; done
```

全部通過後再 commit 並 push 到 `main`。**不要改動** `public/data/*.json` 的其他欄位，也不要動 `tools/dabutie/` 的匯入器。
