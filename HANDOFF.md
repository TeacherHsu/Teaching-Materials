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
