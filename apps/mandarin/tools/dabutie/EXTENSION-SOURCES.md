# 延伸練習連結來源筆記

給研究 agent／人工找延伸練習連結時參考，避免每次重新摸索網站規則。
候選檔案格式與匯入方式見規格
`docs/specs/2026-09-25-mandarin-dabutie-importer.md`「延伸練習連結」一節、
`tools/dabutie/apply_extensions.py`。

## gsyan888.blogspot.com（雄老師 HTML5 FUN 筆順遊戲）

2026-09-25 使用者從雄老師網站選單手動取得 L01 網址：

```
https://gsyan888.blogspot.com/2023/08/html5-fun-game-laucher.html?sheet=10Nq6prSt0s_ZI1Z1phlGEtr0MDDE1wDqEiPmnHWSM_Q&gid=1268766218&gameid=115%23%E7%BF%B0%E6%9E%97%233%E4%B8%8A%E7%AD%86%E9%A0%86%23L01
```

規則：路徑與 `sheet`/`gid` 這三個參數在同一套件（同版本、同冊、同大項）內
固定不變，只有 `gameid` 尾碼隨課次變化。這組 gameid 的格式是
`115#翰林#3上筆順#LNN`（URL-encode 後即上面網址的 `gameid=` 值），`LNN` 從
`L01` 到 `L12`（115 學年翰林三上共 12 課）。也就是說，只要把 `L01` 換成
`L02`…`L12`，就能批次產生本冊全部課次的筆順練習連結，不需要再逐一開瀏覽器
選單確認。

換版本／換冊時，`115`、`翰林`、`3上` 這三段可能都要換，且 `sheet`/`gid`
未必沿用同一套 Google Sheet，仍需人工從網站選單重新取得一次當範本。

`gsyan888.blogspot.com` 的另一個變體網域 `gsyan888.github.io` 也可能出現
同系列連結，已一併加入 `src/config/linkDomains.js` 白名單。

## se365edu.com（特教 365）

使用者提供的來源，Notion 架站，收錄各版本分課教材（含國語）。非傳統網站
結構、資源分頁靠 Notion 頁面連結串接，無法用固定 URL pattern 批次生成，
需要人工瀏覽找到對應課次的頁面後逐一取 URL。網域
`www.se365edu.com` 已加入白名單。

## Wordwall

只收「標題明確包含課名」的資源（例如標題寫出「翰林三上第一課」這類可辨識
版本／冊次／課次的字樣），避免收到與課文對不上的泛用練習。Wordwall 沒有
公開可查詢的課程對照索引，網址一律由教師人工瀏覽後提供，不做自動搜尋。

## 教育部筆順教學網

`stroke-order.learningweb.moe.edu.tw` 提供官方單字筆順動畫，已加入白名單，
可作為 `module=characters`、`type=reading` 的字源／筆順補充連結來源
（對應 `char` 欄位）。

## 2026-09-25 補充（瀏覽器實測）

- **翰林官方 Wordwall（hanlindigi，teacher/393914）**：國小國語資料夾 `https://wordwall.net/teacher/393914/hanlindigi/folder/501375`；各冊「成語找一找」子資料夾（3上＝folder/749090），活動標題格式「翰林國小國語_3上LNN課名」。同課可能有新舊課本兩版標題（例 L02 明天再寫／妙用便利貼），**只收與 115 課名相符者**。入口頁：sites.google.com/hanlin.com.tw/e-wordwall。
- **教育部異體字字典（漢字由來）**：`https://dict.variants.moe.edu.tw/search.jsp?QTP=0&WORD=<字>` 查詢結果頁（需瀏覽器執行 JS）→ 取字號以 A 開頭且無 `-NNN` 尾碼的正字 → `dictView.jsp?ID=<n>`（去掉 `&q=1`）。頁面含說文、甲骨文、金文字形。
- **中研院小學堂**：查詢為 POST 表單，無每字固定網址，不收。
- **特工365**：Notion「各版教材」頁已導向 sites.google.com/view/se365，目前只有首冊注音與空白的「全版本適用」頁，無翰林分課教材（2026-09-25 檢查）。
- **Wordwall 社群搜尋**：未登入時搜尋結果固定為預設清單，無法用程式搜尋；以官方 hanlindigi 資料夾或教師提供網址為主。
