# 國語課文樂園：優化與維護工作流

整理自 2026-10-03～04 的優化工作（三上補齊、鷹架、形似字、筆順、密碼外洩處置）。
**新增課次**看 [lesson-generation-workflow.md](lesson-generation-workflow.md)；**已上線課次的優化、校對、維護**看本文件。
決策的來由見 sped-os `90-meta/decisions/ADR-0035`。

---

## 0. 開工前

1. `git pull`，先讀 repo 根目錄 `HANDOFF.md` 最上面幾筆（另一台電腦或 Codex 可能剛動過）。
2. 確認這台電腦有沒有 `~/mandarin-work/`。沒有的話**只能改前端**，不能動課次 JSON、不能加密。
3. 需要解密課文的工具（證據句、外洩檢查）要有本機密碼檔 `~/mandarin-work/.classroom-password`。**密碼不可寫進任何 repo 檔案、commit、交接或對話**。

## 1. 資料流與正本位置

| 東西 | 正本在哪 | 公開 repo 裡是什麼 |
|---|---|---|
| 官方教材（大補帖 docx/doc/pdf） | OneDrive `mandarin-work/<冊>/raw/` | 不放 |
| 課文明碼（Reading-Tool JSON） | `~/mandarin-work/reading-tool-lessons/` | `readings.enc.json`（AES-GCM 密文） |
| 證據句、段落對應 | 課次 JSON 的 `evidence` / `text_spots`（段號＋句序＋雜湊） | 只有索引，沒有句子 |
| 字形／部件／筆順 | `~/mandarin-work/_vendor/makemeahanzi/` | `data/_index/hanzi/<冊>.json`（只抽用得到的字）＋ LICENSES |
| 大項圖示原圖 | `~/mandarin-work/_vendor/icons-original/` | 上色後的 `assets/icons/*.webp` |

`mandarin-work` 在 OneDrive：檔案可能是雲端占位檔，工具會卡在 `read()` 等下載。卡住時用 `lsof -p <pid>` 找是哪個檔，Finder 右鍵「永遠保留在此裝置上」。

## 2. 內容補齊（某冊缺課文／缺題目）

1. **以官方教材為準**：課文、段落大意、閱讀提問都先找大補帖對應檔（docx 用 zipfile、doc 用 `textutil`、pdf 用 `pdftoppm`）。
2. **段落大意**照官方分段，不可為了版面固定切幾份。
3. **閱讀題**依官方「閱讀理解提問」參考答案改寫成四選一：
   - 狀態一律先 `draft`，CF 審核後才 `approved`。
   - 錯誤選項取自課文中會混淆的說法，**長度和正解相近**（正解明顯最長的題目 ≤10%，`test-authored-question-quality` 會擋）。
   - 官方標「學生自由回答」的不硬改選擇題。
4. **課文唸讀**：
   - Reading-Tool 產生注音後，CF 抽聽／覆核，交接包狀態改 `TEACHER_APPROVED` 才加密。
   - 用 `pronunciation-rules` 引擎自產注音時，必須逐一核對多音字上下文（一、不、的、得、著、了、和、還、長）。
   - 加密：`python3 tools/encrypt_readings.py`（不帶 `--password` 會讀本機密碼檔）。
5. 課文上線後才能標證據：`tools/annotate_evidence.py`（雜湊從 `reading_evidence.mjs list` 現場取，不憑記憶），段落對應跑 `tools/paragraph_spots.py`（官方 docx 對不齊的課寫進 `MANUAL`）。
6. 一上／二上開放題：`tools/match_open_evidence.mjs` 只是**候選**，必須逐題看過才留（看圖題、開放思考題不配證據）。

## 3. 鷹架設計規則（每個關卡都適用）

- **三層提示，一層比一層多幫一點**：策略 → 縮小範圍／找位置 → 示範或直接帶到證據。提示要改變學生「做的事」，不能只是同一句話說得更白。
- **提示不可以洩漏答案**：修辭提示不得出現修辭名稱、語詞提示不得指出答案用字、多音字對照例詞要排除本題語詞（`test-hint-no-leak`）。
- **答錯先給提示、第二次才揭曉**：三個鷹架層都一樣（支持層 `wrongLimit` 也是 2，第一次錯直接給最強那層）。
- **「看提示」每一層都可以主動按**；用過提示的題目不算獨立答對，紀錄分「獨立／提示後／揭曉」三欄。
- **選項數跟著鷹架層**（支持 2／標準 3／挑戰 4），由 `ChoiceQuiz` 的 `trimOptions` 統一裁；正解一定留，`fixedOptions` 不裁；刪選項的提示至少留一個錯的。
- **讀懂課文第 3 層**：按下當下才建立課文面板（中途解鎖也看得到）；段落 ≤8 句整段給；線索句畫底線，句中**和答案相同、題目沒有的詞**上螢光筆；整段沒有關鍵詞的推論題才整句畫。沒解鎖就明說要請老師輸入密碼。
- **錯因回饋**：選擇題可寫 `why[錯誤選項]`，答錯時先說錯在哪再給提示；`why` 只能掛錯誤選項、不得含正解。
- **不要出現術語當題目**：句型卡用關聯詞框架（「一會兒……一會兒……」）＋白話意思＋課文例句，不出「並列複句」這類術語；短語搭配的術語解釋要換白話，造句指示（「依照句型寫一句」）不當配對。

## 4. 形似字與字形資料

- **形似字選項只用官方核對過的同組字**（`docs/lookalike-approved-groups.json` 是基準），不自行補字湊選項；兩字組就兩個選項。
- 匯入後先跑資料健檢：每個字都要出現在自己的例詞裡、例詞共有字要和 `char` 一致。
  - 康軒四上曾整批把 `char` 存成「第一個例詞的第一個字」（秀／引應為秀／誘），用 `tools/fix_lookalike_chars.py` 修；**重新匯入四上後要重跑**。
  - 組內沒有任何共同部件、字形又不像的組（多為同音字誤植）標 `not_shape_similar: true`，不出題，等 CF 確認。
- 字形資料：`python3 tools/build_hanzi_parts.py`（新增課次或修形似字後要重跑）。產出：
  - `lookalike_diff`：形似字不同部件的筆畫（第 2 層提示上色）；`EXCLUDE` 放 CF 標錯的組。
  - `mask_side`：字感訓練遮蔽字要遮「共同的那半」。
  - `radical_strokes`：生字找部首第 2 層上色（康熙部首碼先 NFKC，部首變形見 `RADICAL_FORMS`）。
  - `m`（筆順中線）：**筆畫數和課本不同的字自動不給**（艹辶阝等兩岸寫法不同），`STROKE_EXCLUDE` 放 CF 標錯的字。
- 新的字形相關功能上線前，先產生核對頁（HTML，放 `mandarin-work`）給 CF 看過；筆順動畫用 `STROKE_ANIMATION_APPROVED` 開關，核對前只在 `?preview=1` 出現。

## 5. 視覺

- 大項圖示依模組主題色上色：`python3 tools/recolor_icons.py`（主題色對應 `moduleRegistry.js` 的 `color` 與 `tokens.css`）。換圖時把新原圖放 `_vendor/icons-original/` 再跑。
- 全站顏色一律走 `tokens.css` 的 token，不寫死色碼。
- 每次改畫面都要在 **375px（手機）與 1024px（iPad 橫放）** 實際看：無橫向捲動、最小字 18px、可點元素 ≥44px。

## 6. 派 Codex 做版面

1. 在 worktree 開分支：`git worktree add ../Teaching-Materials-codex-<名稱> -b codex/<名稱> main`，派工說明放 worktree 根目錄。
2. Codex 的 sandbox **寫不到主 repo 的 `.git`**：派工時明說「不要跑任何 git，只改檔案、跑驗收」。
3. Claude Code 從 Bash 啟動 `codex exec` 會被權限擋，請 CF 在終端機開 `codex` 互動模式貼指令。
4. Codex 說「做完了」**不能信結尾文字**（它固定會印「已 commit」）：自己看 `git status`／diff、跑全部測試、開瀏覽器看兩種寬度，再由 Claude commit 合併、清掉 worktree。

## 7. 安全

- 教室密碼只放 `CLASSROOM_PASSWORD` 或 `~/mandarin-work/.classroom-password`；程式一律用 `scripts/classroom-password.mjs` 取得，沒有就略過。
- 換密碼：CF 在終端機用 `read -rs` 寫入本機檔（密碼不經過對話）→ `python3 tools/encrypt_readings.py` → 驗證新密碼解得開 55 課、舊密碼解不開 → 推送 → CF 通知師生。
- 證據、聽聽看段落只存索引，不存課文明碼；`npm run check-text-leak` 擋外洩比例。

## 8. 完工檢查（每一批都要全過）

```bash
cd apps/mandarin
for f in scripts/test-*.mjs; do node "$f" || exit 1; done
npm run validate          # 含課文外洩檢查
npm run check-evidence    # 逐課驗證據句雜湊（需本機密碼）
npm run build && npm run check-dist
```

外加：
- 瀏覽器實際走一次改到的關卡（`npm run dev`，或 `npm run review` 看草稿）。
- 新增資料閘門要寫成測試（例：`test-answer-in-options`、`test-hint-no-leak`、`test-evidence-keys`、`test-student-code`）。

## 9. 收尾

1. commit 訊息寫「做了什麼＋為什麼」，結尾附 Co-Authored-By。
2. `HANDOFF.md` 最上面加一筆：範圍、狀態、**另一台電腦要注意的事**、還沒做的事。
3. 推送後若遠端有新提交（另一台電腦或 Codex），先看內容再 rebase，不要蓋掉別人的密文或資料。
4. 需要 CF 做的事（審核、核對頁、換密碼通知、Apps Script 重新部署）在回報裡單獨列出。
