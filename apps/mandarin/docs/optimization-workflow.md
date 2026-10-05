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
- **提示不可以洩漏答案——文字、念出來的內容（`speak`）、`on()` 展開的東西都算**：讀音題不念含目標字的語詞、形似字不替學生念語詞（`test-hint-no-leak` 會掃 speak）。修辭提示不得出現修辭名稱、語詞提示不得指出答案用字、多音字對照例詞要排除本題語詞（`test-hint-no-leak`）。
- **答錯先給提示、第二次才揭曉**：三個鷹架層都一樣，**每次答錯只往下一層**（不可跳到最強層）。
- **「看提示」每一層都可以主動按**；用過提示的題目不算獨立答對，紀錄分「獨立／提示後／揭曉」三欄。
- **選項數跟著鷹架層**（支持 2／標準 3／挑戰 4），由 `ChoiceQuiz` 的 `trimOptions` 統一裁；正解一定留，`fixedOptions` 不裁；刪選項的提示至少留一個錯的。
- **讀懂課文第 3 層**：按下當下才建立課文面板（中途解鎖也看得到）；段落 ≤8 句整段給；線索句畫底線，句中**和答案相同、題目沒有的詞**上螢光筆；整段沒有關鍵詞的推論題才整句畫。沒解鎖就明說要請老師輸入密碼。
- **錯因回饋**：選擇題可寫 `why[錯誤選項]`，答錯時先說錯在哪再給提示；`why` 只能掛錯誤選項、不得含正解。
- **不要出現術語當題目**：句型卡用關聯詞框架（「一會兒……一會兒……」）＋白話意思＋課文例句，不出「並列複句」這類術語；短語搭配的術語解釋要換白話，造句指示（「依照句型寫一句」）不當配對。

- **開放題不計分**：網站沒收到學生答案的題目，完成時只能說「已看完 X 題」，不顯示答對數、不記錄正確率。
- **程度實際改變什麼**以 [scaffold-matrix.md](scaffold-matrix.md) 為準；改程式就同步改矩陣和 `deviceSettings.js` 的 `note`。限時、記憶遊戲這類會加重與國語無關負荷的設定不綁程度。
- **升降級建議**只比「同一學生代碼、同一程度」的作答，並註明不是 IEP 進展證據。
- **讀懂課文第 3 層未解鎖時**給課本段號（由段落大意的 `text_spots` 換算；對應不唯一就不給段號）。

- **支持程度依個案（學生代碼）記**：低／中／高組帶出 7 項細項（`DETAIL_SPECS`），單獨改過的換組別不蓋掉；新增細項要同時加進 `SCAFFOLD_LEVELS`、`DETAIL_SPECS`、`OVERRIDABLE` 與 scaffold-matrix。
- **技能標籤**：題目帶 `skill`（沒帶就用大項預設 `MODULE_SKILL`），紀錄依技能累積；學過方法後的新材料題標 `transfer: true`，另計遷移。
- **「學方法」流程**（`StrategyLesson`）：看示範（放聲思考＋標示）→ 一起做一步（學生點、立即回饋、錯了說原因）→ 本課題目（遷移）。示範材料用原創短文，不用課文，免密碼。讀懂課文「找線索」、認識生字「找部首」用專用版本（strategyLessons.js）；其他 12 個方法（含認識生字「學讀音」）寫在 `strategyLibrary.js`（資料：示範幾步＋一起做一題＋錯因），由 `LibraryStrategy` 畫出；每個學生代碼第一次進關卡自動出現，之後有「再看一次方法」。新增方法要過 `test-strategy-library`（每個錯誤選項都要有原因、一起做的題目和選項要對得上）。
- **開放題轉選擇題**：有課文證據、有單一正解的開放題改寫成四選一（draft，CF 核准才上線）；看圖題、開放思考題放 `discussion_questions`，讀懂課文的「說說看」題組呈現、不計分。

- **題組跳轉列**（`StepJump`）：有多個步驟的關卡上方列出各題組可直接跳；新增多步驟關卡時，在 `STEP_LABELS` 加步驟名稱、列放在 container 外面（各步驟會 clear container）、跳轉時重設 round／item 索引。教師可在課堂控制關掉。
- **學生看得到的畫面不出現能力標籤**：程度名稱用「支持／標準／挑戰」，不用低中高組（CF 2026-10-04）。
- **念讀字詞**（`wordReading.js`）：生字＋語詞，不比聲調、同音字算對、任一辨識候選念對即算；每個字詞兩次機會；沒有語音辨識自動改教師判讀。範讀跟著細項「朗讀前可先聽範讀」。

## 3-1. 閱讀題抽查（每次大批新增或核准後）

1. 全量自動檢查：證據句是否存在、提取訊息題證據與答案有無共同字詞（沒有的逐題人工看）、課文有無異常字元。
2. 分層抽樣（每冊 6～8 題），逐題對課文判定：答案正確、證據完整、干擾項合理。
3. 報告含課文句子，只放 `~/mandarin-work/`，不進 repo；修正後跑 `npm run check-evidence`。

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
- 同一張卡片裡同樣的字眼不要重複出現：例如生字卡已有外部「筆順與解釋」，站內筆順鈕就只放鉛筆插圖（附 `aria-label`），不再寫「看筆順」。
- 圖示型按鈕一律要有 `aria-label`、觸控範圍 ≥44px、展開狀態用 `aria-expanded`。

## 5-1. 頁底說明頁（教師操作指引、版權與資料來源）

- 頁底固定三行（非出版社官方產品／資料來源／僅供教學），下方連到 `#/guide`「教師操作指引」與 `#/credits`「版權與資料來源」（`src/pages/InfoPages.js`）。
- 兩頁都**不寫學校名稱、不寫教室密碼**；也不寫取得密碼的管道（CF 2026-10-04 刪除「向網站管理老師索取」，維護出版社版權）。目前不放權利人聯絡方式（CF 2026-10-04）。
- 指引裡的關卡清單直接讀 `MODULE_REGISTRY`、鷹架程度讀 `SCAFFOLD_LEVELS`，新增關卡或改設定說明不用改指引。
- **新增任何站內使用的外部資料**（字庫、詞表、圖片、聲音）時，要同時更新版權頁：寫出來源、授權、怎麼使用；授權要求附全文的，全文放進 `public/` 並從版權頁連結。外部連結（另開視窗）只需列在「外部連結」段。
- 教師手冊 `docs/teacher-manual.md` 是詳細版，畫面入口改了（例如齒輪）要同步改。

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

## 2026-10-04 補充規則（語音稽核、修辭標色）

- **語音稽核**：學生會讀到的字（學方法的題目、選項、示範句、入口卡、成語意思、念讀說明）都要有喇叭。例外：進度列（TaskBanner）不放朗讀鈕；按鈕、注音鍵是控制項不另加。成語挖空念成「什麼」，不洩漏答案字。
- **修辭標色**：只用 `﹁﹂` 標記或 `highlight_terms`；「」『』是引號，不是標記。四上起每題修辭都要有 `highlight_terms`（`test-rhetoric-highlights.mjs` 會檢查）。
- **念讀字詞回饋**：念對時輪替稱讚語＋動畫＋朗讀，連續 3 個以上顯示連對數；每組結束有鼓勵語。

## 2026-10-04 第二版審查落地規則（A1–A6、B1、B2 試做、C3、課文地圖年級用語）

- **課文地圖用語依年級**：低年級（一、二）不顯示結構術語，段落大意前綴「起：承：轉：合：」拿掉；中年級（三、四）用白話標籤（`reading.js` 的 `PLAIN_LABELS`）＋比較表版面；高年級（六）保留術語。新增術語時先補 `PLAIN_LABELS`。
- **修辭螢光筆**：支持、標準預標；挑戰組第 2 層提示才標。提示語只說「螢光筆」，不說「畫線」。
- **進度分帳**：課程首頁核心學習（4 項）與加練挑戰（選做）分開計算與顯示。
- **首屏**：關卡方法收成「本關小方法」一行；題組列只佔一列（第 n／N 組＋換題組）。
- **念讀字詞**：答錯流程＝自己再念 → 示範跟讀 → 自己再念；紀錄分 first／helped／after-model／modeled／skipped。
- **讀屏**：CardWalkthrough 每格名稱＝索引＋內容＋已看過／還沒看。
- **對比**：C3 量測首頁主要文字皆 ≥4.5:1；看過的卡片透明度最低 0.8。
- **C2 低年級學習重點改寫**：草稿在 `docs/review/2026-10-04-C2-low-grade-blurbs-draft.md`，CF 勾選後才改 `blurb`。
- **學方法不強制（CF 2026-10-04）**：進關卡直接做題；沒看過方法時上方顯示「先看這關的方法」，看過顯示「再看一次方法」。示範畫面標題旁一律有「跳過，直接做題」（含認識生字、讀懂課文流程內的學方法步驟）。跳過不記為遷移。
- **學方法的出現方式（CF 2026-10-04 定案，取代上一條）**：支持組第一次進關卡自動示範（可跳過）；標準、挑戰組直接做題，上方有「先看這關的方法」。教師可個別改細項「第一次進關卡自動示範」。任何組別在同一關連續 2 題第一次就答錯、且沒看過方法 → 提醒一次（`utils/strategyNudge.js`）。
- **朗讀挑戰注音（CF 2026-10-04）**：學生端不能切換；預設一、二年級開，三年級以上支持組開、標準挑戰組關；教師頁細項「朗讀挑戰顯示注音」可個別覆寫（`reciteZhuyinOn`）。
- **朗讀挑戰標示（CF 2026-10-04）**：只用底色——紅底＝念得不一樣、黃底＝漏掉了；同音字算念對、不標示。分數下方有「標示是什麼意思？」圖例（樣本字＋白話＋喇叭）；標示的字可以點來聽。

## 2026-10-04 UX／特教易用性／無障礙規則（詳見 `docs/review/2026-10-04-ux-a11y-audit.md`）

- **建議學習順序**：課程首頁核心 4 項顯示「✓ 做完／現在／還沒」＋●○ 小目標＋「繼續學習」鈕；只是建議，不鎖流程。新增核心大項時順序跟 `MODULE_REGISTRY`。
- **繼續學習**：不放首頁（一台平板多年級共用）；只在各年級頁顯示該年級＋學生代碼的上次課（`setLastLesson`／`getLastLesson`，key `mandarin.lastLessonByGrade`）。
- **上課模式**：只用 `html.present-mode` 切 CSS，不另做頁面；新增全站導覽、次要提示類元件時，要補進上課模式的隱藏清單。Esc／「離開上課模式」退出。
- **答對回饋**：答對時顯示資料既有 `explanation`；不要求補資料，沒有就只說答對了。
- **無障礙底線**（每次改版跑一次 axe：wcag2a、wcag2aa、best-practice，目標 0 違規）：
  - `<main>` 只包頁面內容，header／footer 在外面。
  - 白字底色對比 ≥4.5:1（模組色徽章用 `--module-color-dark`）。
  - 外框不可是 role=button 又包按鈕；卡片裡有按鈕就用 role=group，翻面用真正的 `<button>`。
  - 圖片旁已有同樣文字時 alt 留空。
- **版面驗收尺寸**：375×812、768×1024、1024×768、1280×720、上課模式；不得有橫向捲動。
- **不做**：不加後端／帳號、不加第四級提示或組別、不加無教學目的動畫、不另做第二套圖示。教師／學生雙模式列為下一階段（先觀察兩週）。

## 2026-10-05 基本練習、照樣造短語、課文點讀字級

- **基本練習區**：課程首頁核心之後、不收合；順序＝念讀字詞 → 照樣造短語（`BASIC_MODULES`）。沒有已核准短語的課，學生畫面不顯示照樣造短語卡。
- **照樣造短語資料**（`lesson.phrase_builders[]`）：`pattern_ref` 必須指向官方 `sentence_patterns`，`example.chunks` 拼起來必須等於課本短語；`slots`（role＋學生看得懂的 label）、`bank`、`accepted`、`semantic_rejects`（附回饋）、`rounds`（圖片、`image_hint`、`answer`、`check` 小確認題）。結構正確的每一種組合都要有判定（`test-phrase-builder.mjs` 檢查）。
- **編寫內容一律 draft**：詞塊拆分、語意判定、圖片描述是本站編寫；`filter-build-data` 會擋掉 draft，教師確認後改 `approved` 才上線。確認清單放 `docs/review/`。
- **不批次產生**：一課一課做、一課一課給老師確認；沒有官方短語的課不做。
- **課文點讀字級**：三級「標準｜大字｜特大」＝1／1.25／1.5，基準 `clamp(30px, 2vw + 16px, 42px)`；舊設定 small／medium→標準。
