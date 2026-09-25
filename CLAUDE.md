# Teaching-Materials：多機、跨 AI 接力合作守則

> 本檔與 `AGENTS.md` 內容相同（Claude Code 讀 CLAUDE.md，其他 AI 讀 AGENTS.md）。修改時兩份同步改，以 AGENTS.md 為正本。
本檔同時給 Claude Code、Codex 等 AI 與 CF（Erato Hsu）本人閱讀；`CLAUDE.md` 的內容與本檔相同。
這個 repo 是**公開 repo**，main 分支會發布到 GitHub Pages（https://teacherhsu.github.io/Teaching-Materials/）。
回覆一律用繁體中文；程式碼、指令、檔名維持英文。

## 一、開工前（必做，不可跳過）

1. **拉最新版**：`git pull --rebase origin main`。拉不下來或有衝突時，先停下來回報，不要自行 force。
2. **讀交接紀錄**：讀 `HANDOFF.md` 最上面三筆，確認：
   - 上一棒做到哪裡
   - 哪些工作「進行中、請勿同時修改」
   - 有哪些待辦
3. **讀你要動的子專案的說明**：
   - 國語網站 `apps/mandarin/` → 先讀 `apps/mandarin/AGENTS.md`
   - 其他資料夾（`Chinese/`、`Math/`、`Timer/`…）是既有靜態頁面，除非任務明確指定，否則不要動。
4. **在 `HANDOFF.md` 最上方先寫一行「施工中」**，標明機器、AI、動哪些資料夾，commit 並 push 出去，讓其他人知道現在不要碰這些檔案。

## 二、施工中

- **同一時間只讓一個人（或一個 AI）改同一個子專案。** 看到別人標「施工中」的範圍，就不要動。
- **紅線**：
  - 公開 repo 只放 L1 無個資內容：不放學生姓名、代號、照片或 IEP。
  - 教科書課文全文、出版社大補帖原檔、第三方生字表 xlsx，都**不可以**放進 repo。
  - 注音與字音只能依教育部辭典／教育百科查證後填入，不可憑記憶。
- 不要改 repo 設定、不要改 GitHub Pages 設定、不要 force push、不要刪除別人的分支。這些事都交給 CF 決定。

## 三、完工時（必做）

1. **驗證**：跑該子專案說明文件列出的驗證指令，全部通過才算完成；沒通過就照實寫下。
2. **commit**：訊息寫清楚改了什麼、為什麼改。
3. **寫交接**：在 `HANDOFF.md` 最上方，把自己那一行「施工中」改成完整紀錄（格式見 `HANDOFF.md` 開頭的範本）。
4. **提醒 CF 推送**：最後回覆 CF 時，**一定要附上這段提醒**：
   > 📌 本次修改已 commit：［已推送／尚未推送］到 origin/main。
   > 若尚未推送，請確認後執行 `git push origin main`，否則另一台電腦或其他 AI 會拿不到最新進度。
   > 交接紀錄已寫在 HANDOFF.md。

   CF 已經明確說「推」的話，就直接 push，並回報 push 結果（例：`abc123..def456 main -> main`）。

## 四、發生衝突時

- `git pull` 出現衝突：不要選「全部用我的版本」直接覆蓋。逐檔看過，無法判斷時停下來問 CF。
- 發現別人剛 push 的內容壞掉（build 或測試失敗）：不要直接改掉，在 `HANDOFF.md` 記錄並回報 CF。
