# 交接紀錄（最新的寫在最上面）

## 2026-10-04（夜 7）｜家中 Mac｜Claude Code｜狀態：✅ 已推送
- 形似字三組依 CF 更正（一上 L03 火大烤、心芯；三上 L06 分份粉）；四上匯入程式根因已修（prepare_g4a.mjs 取例詞共有字）＋資料健檢測試。
- sped-os check_l0.py 誤報修正（學期「115上」、辭典釋義欄位），sped-os 已推。
- 一上、二上：78 題開放題改為選擇題（draft，待 CF 審）；看圖、開放思考題移到「說說看」題組。
- 學方法推到全部關卡：strategyLibrary.js 12 個＋找線索、找部首；每個學生代碼第一次進關卡自動出現。
- 待 CF：審核 78 題選擇題（npm run review）；二上 L09 官方參考答案與課文不合的那題已依課文改寫。

## 2026-10-04（夜 6）｜家中 Mac｜Claude Code｜狀態：✅ 已推送
- 開始按鈕一律同樣式（「下一步」只靠角標）；抓重點、生字變成語補題組跳轉列（共 9 個關卡有）。
- 「學找線索」擴及一上、二上開放題（54/55 課有；六上 L12 沒有提取訊息題）；「學找部首」55/55 課，直接進網址時字形資料晚到也會補上步驟。
- 移除未使用的 engine.js `buildChallengeActivity`；教師手冊補 10/4 新功能。
- 尚未完成／待 CF：見最新回報（念讀字詞實機測語音辨識、4 碼密碼、4 組形似字待確認、四上匯入器根因、學方法推到其他關卡、IEP 目標代碼、一二上開放題全量語意複核）。

## 2026-10-04（夜 5）｜家中 Mac｜Claude Code｜狀態：✅ 已推送
- 新關卡「念讀字詞」（加練區）：本課生字＋語詞逐一念，語音辨識自動判斷（不比聲調）或教師判讀；記入技能紀錄「念讀字詞」。語音辨識要在實機（iPad Safari／Chrome）試，瀏覽器窗格擋麥克風。
- 題組跳轉列（6 個多步驟關卡＋念讀字詞），課堂控制可關。
- 程度名稱改回支持／標準／挑戰；教室密碼已換（仍只有 4 碼）；四上 L05 第 1 題答案改寫。

## 2026-10-04（夜 4）｜家中 Mac｜Claude Code｜狀態：✅ 已推送
- 能力分組（低／中／高）依學生代碼記，教師頁列 7 項細項可單獨調；造句預填開頭已做。
- 技能標籤＋遷移紀錄（教師頁「技能紀錄」）；試做「學方法」：讀懂課文找線索、認識生字找部首。
- 閱讀題抽查：自動全量＋抽樣 36 題，報告在 `~/mandarin-work/閱讀題抽查-20261004.md`。補 2 題證據；六上 L09 課文亂碼「¬¬─¬─」改「──」（`reading-tool-lessons/115HG6A09.json`，已重算注音位置、重新加密，備份在 `115AG6H/`）。
- 待 CF：四上 L05 第 1 題答案措辭；念讀字詞測驗是否要做。

## 2026-10-04（夜 3）｜家中 Mac｜Claude Code｜狀態：✅ 已推送（第二版審查 v3 處理）
- P0 已修：一、二上開放題完成頁改「已看完 X 題」（原誤顯示答對 X/X）；讀音提示第 3 層不再念含目標字的語詞、形似字第 3 層不再念語詞；支持層每次答錯只往下一層。
- 升降級建議只算目前學生代碼＋目前程度（紀錄新增 `level` 欄）；附「非 IEP 證據」說明。
- 字感閃現限時改教師開關（預設不限時）；挑戰層不再把語詞配對換成翻牌記憶。
- 讀懂課文第 3 層未解鎖時給課本段號（段落大意換算）。
- 新文件 `apps/mandarin/docs/scaffold-matrix.md`：各程度實際生效的設定、常駐支持、各關卡提示形式、尚未做的項目。
- 指引與教師手冊補：代碼是可連結的教育紀錄、試算表「任何人」寫入的風險、星星／答對率不是 IEP 證據。
- 未做（需 CF 決定）：逐項支持開關、IEP 目標與技能標籤欄位、worked example／遷移題、全題庫人工語意複核。

## 2026-10-04（夜 2）｜家中 Mac｜Claude Code｜狀態：✅ 已推送
- **四上形似字資料修正 61＋3 筆**：康軒匯入把 char 誤取成「第一個例詞的第一個字」（應為秀／誘，存成秀／引）。`tools/fix_lookalike_chars.py` 已修並保留 `char_original`。**日後重新匯入四上後要重跑這支**（根源在匯入器，尚未修）。三上 L08 垃→圾 同步更新 docs/lookalike-approved-groups.json。
- 4 組字形不像（一上 L03 火活、心星×2；三上 L06 分部）標 `not_shape_similar`，形似字與字感訓練不出題，待 CF 確認原始資料。
- 形似字、字感訓練選項只用官方同組形似字（撤回自行補字）；遮蔽字仍依部件遮共同的那半。
- 大項圖示依主題色重新上色（`tools/recolor_icons.py`，原圖在 `~/mandarin-work/_vendor/icons-original/`）；字感訓練改用自己的放大鏡圖示。
- 部件拼字連結移到字感訓練頁最上方（課次首頁不再有卡片）。

## 2026-10-04（深夜）｜家中 Mac｜Claude Code｜狀態：✅ 已推送；教室密碼已於 2026-10-04 更換
- 教室密碼原本寫死在 4 個公開檔案（自 65a2391 起），已改從 `CLASSROOM_PASSWORD` 或 `~/mandarin-work/.classroom-password` 讀取。舊密碼雖仍在 git 歷史，但**已換新密碼並重新加密（舊密碼解不開）**。加密器不帶 --password 時讀本機密碼檔（`python3 tools/encrypt_readings.py --password <新密碼>`，再更新 .classroom-password）。另一台電腦要跑解密工具，需自行建立該檔。
- 讀懂課文第 3 層：當下建立面板、段落整段（≤8 句）、關鍵詞螢光筆（只畫和答案相同、題目沒有的詞）。
- 字感訓練：干擾項全為形似字（hanzi/<冊>.json 的 similar）；遮蔽字依部件遮共同的那半（mask_side）。
- 部件拼字移到字感訓練下、無圖示；練習句子圖示重繪（tools/draw_sentence_icon.py）。

## 2026-10-04（夜）｜家中 Mac｜Claude Code｜狀態：✅ 筆順動畫已上線（CF 2026-10-04 核對 808 字 OK，開關已改 true）
- 生字卡新增「看筆順」（站內動畫：播放／下一筆／重來；reduced-motion 時不描繪、一筆一筆出現）。
- 資料：hanzi/<冊>.json 加 medians（`m`）。**筆畫數和課本不同的字自動不給**（艹、辶、阝等兩岸寫法不同），共排除 61 字，這些字只保留外部筆順連結。
- 上線閘門：`src/components/CharacterCard.js` 的 `STROKE_ANIMATION_APPROVED = false`，目前只在 `?preview=1` 出現。CF 核對 `~/mandarin-work/生字筆順-待確認.html`（808 字）後：有誤的字加進 `tools/build_hanzi_parts.py` 的 STROKE_EXCLUDE 重跑，再把開關改 true。

## 2026-10-04（晚）｜家中 Mac｜Claude Code｜狀態：✅ 生字／形似字部件鷹架上線
- 資料：Make Me a Hanzi（`~/mandarin-work/_vendor/makemeahanzi/`，不進 repo），`tools/build_hanzi_parts.py` 產生 `public/data/_index/hanzi/<冊>.json`（筆畫路徑、形似字差異筆畫、生字部首筆畫），授權全文在同目錄 LICENSES/。
- 形似字：第 2 層提示同組字並排、不同部件上色；CF 已確認三上 74 組標色。標錯的組加進 build 腳本的 EXCLUDE。
- 生字找部首：第 2 層把字畫出來、部首筆畫上色（各冊 57–192 字可標，約九成）；第 3 層說明部首變形（手→扌）。部首本身成字（口、牛）或資料拆不出的字只有文字提示。
- DragToSlot 支援 layer.on，挑戰層也有看提示。
- 換資料或新增課次後要重跑：`python3 tools/build_hanzi_parts.py`。

## 2026-10-04｜家中 Mac｜Claude Code＋Codex｜狀態：✅ 版面視覺第一輪已合併
- Codex（gpt-5.5，sandbox 內不能寫 .git，所以只改檔、由 Claude 驗收後 commit）改了 tokens.css／base.css／components.css：狀態色改 token、窄螢幕卡片格線可縮、提示面板加左側色條、句子詞塊 ≥44px、iPad 寬模組兩欄。報告：`apps/mandarin/docs/codex-visual-report-20261004.md`。
- Claude 補：手機頁首原本直排三列（187px）改成一列（72px）。
- 驗收：全部測試、build、check-dist 通過；375px 與 1024px 無橫向捲動，最小字 18px、可點元素皆 ≥44px。
- 之後派 Codex：`~/.codex/config.toml` 的 model 仍是 gpt-5.4（ChatGPT 帳號不能用），要在 Codex 裡 /model 換 gpt-5.5；在 worktree 裡不要叫它跑 git。

## 2026-10-04｜家中 Mac｜Claude Code｜狀態：✅ 已推送（優化清單大致完成）
- 學生代碼（CF 決定：先只記代碼）：教師頁設定，英數 8 碼內；紀錄、匯出、試算表同步都帶代碼。教師手冊 Apps Script 多兩欄，已部署的需重新部署新版本。
- 讀懂課文鷹架：三上／四上／六上選擇題都有證據＋三層提示＋錯因；四上干擾項重寫。一上／二上開放題 82 題有證據（打開段落→畫線索→參考答案），看圖題 35、開放思考題 31 維持文字提示。
- 注音高手分部回饋、聽聽看分句重播、排序錯時「聽我排的句子」。
- 形似字「差異部件」標示**沒做**：需要每個字的部件拆分資料（例如 IDS），目前資料沒有，硬做會標錯。
- 版面視覺：已建 worktree `~/Teaching-Materials-codex-visual`（分支 `codex/visual-polish-20261003`），派工說明在 Mac 的 scratchpad；Codex 自動啟動被權限擋下，待 CF 手動啟動。

## 2026-10-03（夜）｜家中 Mac｜Claude Code｜狀態：🔄 優化逐步進行中
- 已完成：形似字／一字多音／修辭／一字多義改三層提示（修辭舊提示會直接說出修辭名稱，已修）；作答紀錄分「獨立／提示後／揭曉」三欄（教師頁＋匯出）；三上 48 題補錯因回饋 `why`；證據第 3 層依題型措辭。
- 下一步（依序）：六上、四上閱讀題補 `why`；注音高手分聲母／韻母／聲調回饋；聽聽看「分句重播」；句型練習排序錯時標出第一個不合的相鄰組合；形似字差異部件標示（需部件資料）。
- 仍待 CF 決定：學生作答紀錄是否加學生代碼、IEP 目標對應、雲端保存的欄位／權限／期限——未動手。

## 2026-10-03（晚）｜家中 Mac｜Claude Code｜狀態：✅ 已推送——**其他電腦拉下來後先讀這段**
- **密文已是 55 課**（含三上 12 課、四上 L07 正本）。之後重產 `readings.enc.json` **不要再加 `--skip 115KG4A07`**；也只能在有 `~/mandarin-work/reading-tool-lessons/` 的家中 Mac 產，學校 Win 不要重產。
- **草稿全數核准**（CF 2026-10-03）：二上／三上／四上／六上的段落大意、三上與六上新編閱讀題、文體活動共 323 筆改 approved（`approved_by: CF`）。目前全站沒有 draft。
- 一上 L01 第 5 題、L02 第 4 題已刪（CF 裁定）。三上 L07–L12 聽力 18 題選項重寫。四上 L07 第 3 題答案原為「印度甩餅」是錯的，已改「日本壽司」，全課大意也重寫。
- 新閘門：`scripts/test-answer-in-options.mjs`（選擇題答案必須逐字等於選項）、`npm run check-evidence`（逐課驗證據句雜湊，需本機有密文密碼）。
- 鷹架行為改了：支持層 wrongLimit=2、「看提示」各層都有、選項數依鷹架層裁切（`trimOptions`，`fixedOptions` 不裁）。
- 私人資料位置：三上交接包 `~/mandarin-work/115AG3H/_private-reading-g3-20261003/`；四上 L07 產生檔 `~/mandarin-work/115AG4K/_private-reading-L07-20261003/`（含抓錯冊別的舊檔備份）。
- 四上 L07 注音是用與三上相同的引擎（pronunciation-rules＋pinyin-pro 3.27.0）產生，多音字已逐一對上下文核過；**仍請 CF 在 Reading-Tool 抽聽一次**。
- 還沒做：14 關逐關的畫面流程重設計（進行中，見下一筆）、學生作答紀錄／IEP 欄位（需 CF 先決定欄位、權限、保存期限，未動手）。

## 2026-10-03｜家中 Mac｜Claude Code｜狀態：✅ 三上課文加密已完成並推送（學校 Win 的同項工作可停）
- 三上 12 課（教師已覆核讀音，來源 docx SHA-256 c215c6a5… 與 manifest 相符）併入 54 課密文，`--skip 115KG4A07` 照舊；密碼沿用現行教室密碼，驗證 42 課舊課可解。明碼留在 `~/mandarin-work/reading-tool-lessons/`，交接包存 `~/mandarin-work/115AG3H/_private-reading-g3-20261003/`。
- 接續：三上 48 題閱讀題補 evidence、44 則大意補 text_spots；L07–L12 聽力 18 題 answer∉options 已修，並加前後端閘門。
- 依審查建議：支持層 wrongLimit 改 2、看提示各層可用、選項數依鷹架層裁切、語詞第 2 層提示不再洩答、`npm run check-evidence` 逐課驗雜湊。
- **學校 Win 請勿再重產 readings.enc.json**，否則會覆蓋本次結果；如需重產，先 pull。

## 2026-10-03｜學校 Win｜Codex｜狀態：🚧 施工中
- 範圍：依 CF 確認，採用本機既有 42 課來源，與已完成讀音人工覆核的三上 12 課合併，重新產生 54 課密文及字音索引。只提交密文與交接紀錄，不提交明文課文、來源擷取檔或覆核資料。
- 安全與驗證：密碼由 CF 在本機隱藏提示輸入；生成後驗證密文課數／代號、G3 注音完整性、網站驗證與測試，再推送 `origin/main`。
- 先前同步與中斷紀錄提交 `a24e008` 基礎上的 `5f83a30`、`1c00a48` 均已推送；本次續作先確認本機 42 課來源為 CF 指定的重建來源。

## 2026-09-30｜學校 Win｜Codex｜狀態：✅ 交接補記已推送；教材內容待家中 Mac 核校
- 問題與目前進度：國語「生字測驗」原本把字義、部首題混在看字選音中，且多題正解不在選項；「課文地圖」有把課文副標題／段落小標放在題目上方、與結構題不相干的情況。已盤點 55 課：436 筆選擇題僅 22 題符合看字選音與注音選項檢核，其餘 414 題目前由前端安全閘門隱藏；55 課有 254 筆結構角色需重新核實，目前只有一上 7 課、三上第 1 課仍提供地圖題，其餘顯示審核中。這是防止錯題出現在學生端的暫時措施，不代表教材內容已修正。
- 本次沒有改公開課次 JSON，也沒有推送課文全文或出版社原檔。修正教材資料必須在家中 Mac 依 `apps/mandarin/AGENTS.md`，使用私有 `mandarin-work`、官方來源與審核 manifest 重新生成；不要在學校 Windows 手改 `public/data/*.json`。
- 來源待核：二、三、六年級提供的 Word 為 115 學年；一年級 Word 是 114 學年，不能直接核對 115 一上；四年級是 17 份舊式 `.doc`，目前無法抽取文字。回家先確認學年／版本並整理可讀的官方來源，再逐課核對生字、語境讀音、三個有效注音選項與課文結構角色；四上如需參照，先轉檔。核實後更新資料與角色核准清單，回歸測試通過再逐步解除隱藏。
- 教育百科注音抓取注意：先前抽查發現，只讀頁面可見的 `td.show1` 會漏掉 `sr-only` 聲調符號，可能把正確讀音誤判成聲調不符。抽查頁面的注音連結 `Bopomofo/List?bopomofo=...` 帶有完整注音，可用該值或完整讀取輔助文字重新核驗。repo 外既有的快取／抓取結果不是已核准教材來源，請勿直接據此批次改資料；重新核對並重建後仍要記錄來源與人工覆核。
- 開工時 `git pull --rebase origin main` 曾因本機代理無法連到 GitHub 而失敗；當時本機快取的 `origin/main` 與工作分支一致。交接施工標記已推送為 `a51547f`；本次補記完成後另提交並推送。僅更新本交接檔。

## 2026-09-30｜學校 Win｜Codex｜狀態：🟡 顯示安全閘門完成；教材內容待家中 Mac 核校
- 範圍：稽核 115 學年一上、二上、三上、康軒四上、翰林六上，共 55 課的生字測驗與課文地圖；本次只改 `apps/mandarin/` 共用前端、回歸測試與工作流文件，沒有手改公開課次教材 JSON，也沒有把 repo 外課文加入公開 repo。
- 生字測驗發現：436 筆 `quiz` 選擇題中，只有 22 題（三年級）符合「單字看字選音」、題目答案與該字已記錄的教育百科注音一致、3 個互異注音選項且含正答；其餘 414 題混有部首／字義、選項錯誤或未通過以上完整性檢查。資料稽核另確認 332 題的答案不在選項中。前端現在只呈現通過閘門的題目，其餘不再誤進「看字選音」；其他年級暫時沒有這一類測驗題。
- 課文地圖發現：55 課中有 254 筆 `structure_role` 是「第 N 段重點」、課文小標題或未經逐課核實的內容角色，不是可直接作答的通用結構角色。前端目前只呈現核准的結構類別；未達三段者顯示教材審核中，不把小標題放在題目上方或選項裡。現有資料暫時只有一上 7 課、三上第 1 課能提供地圖練習。
- 本機來源界線：二、三、六年級 Word 是 115 學年；一年級 Word 是 114 學年，不能直接當成 115 一上的生字測驗對照；四年級提供的是 17 份舊式 `.doc`，本機目前無法抽取文字。更重要的是，`apps/mandarin/AGENTS.md` 明確要求教材 JSON 必須回到家中 Mac 的 `mandarin-work` 與官方來源／審核 manifest 生成，不能在 Windows 手改。課文全文與工作 manifest 均不得推入公開 repo。
- 後續必做（家中 Mac）：先同步本次 `main`，以私有 115 上翰林／康軒生字與課文結構來源逐課核對；重建各課「看字選音」題目，確保注音按課本詞語語境核准、三個選項均為注音且唯一並包含正解；由官方課文結構來源和教師覆核修正 `paragraph_summary[].structure_role`，不得把副標直接當角色。四上 `.doc` 如仍需作為對照，先轉為可讀格式。完成後再按核准角色擴充 `src/activities/structureMapRoles.js`，確認各課地圖，回歸測試通過後才移除不再需要的隱藏狀態。
- 驗證：`validate` 通過（55 課／1 索引）；`check-workflow` 通過（18 工具／契約、23 回歸測試、20 閘門）；37 個 `scripts/test-*.mjs` 全數通過；`check-assets` 通過（1458 個資產、105.58 MiB）；Vite build、`check-dist` 通過。375px 響應式預覽測得文件寬 360px、無橫向溢位；抽查三年級音題與四年級地圖的畫面行為符合閘門。`git diff --check` 通過。
- 推送：開工標記 `5a5231e` 已先推到 `origin/main`；本次安全閘門與交接一併提交並依 CF 指示推到 `origin/main`。

## 2026-09-27｜家中 Mac｜Claude｜狀態：✅ 完成；全年級分支獨立驗收與 main 合併
- 分支：`codex/mandarin-115-all-grades`，驗收 commit `0a63e99`。本機 `~/Teaching-Materials` 原為 single-branch clone（fetch refspec 只含 main），已改為 `+refs/heads/*:refs/remotes/origin/*` 才能取得此分支。
- 更正前一筆紀錄：前一筆記為「push 被 `SEC_E_NO_CREDENTIALS` 擋下、遠端尚未更新」，實際上遠端已是 `0a63e99`，本機與 origin 同步，推送當時已成功。
- 更正既有失敗標記：多筆紀錄把 `scripts/test-lesson-dashboard-progress.mjs`（G3A L01 dashboard 預期 listening 不存在）列為與該項無關的既有失敗；本次在 Mac 上 35 個 `scripts/test-*.mjs` 全數通過，該測試已不再失敗。
- 驗收結果（全部在 Mac、Node v26.0.0／npm 11.12.1）：`validate` PASS（55 份課次、1 份索引）；`check-workflow` PASS（18 個工具／契約、20 個回歸測試、20 個 npm 閘門）；`audit:listening --strict` PASS（187 PASS／0 FAIL／0 REVIEW／1 LOCKED）；`build` 成功且 dist 不含 `_preview`；`check-dist` PASS；`check-assets` PASS（1458 個資產、105.58 MiB）；35／35 `scripts/test-*.mjs` 通過；`git diff --check` 乾淨。
- 補跑先前無法執行的項目：`tools/dabutie` pytest 在 Mac 上 56 passed（學校 Win 環境當時缺 pytest 才未跑）。

## 2026-09-27｜全年級工作樹整理與分支推送
- 分支：`codex/mandarin-115-all-grades`。整理並提交此前累積的跨年級網站、教材資料、流程檢查與圖片變更，程式／教材提交為 `1b83a0f`；納入範圍限於 `HANDOFF.md` 與 `apps/mandarin/`。
- 巡檢：一、二、三、四、六年級總覽與各年級課次首頁以 375px 視窗檢查，沒有水平溢位；另檢視二上閱讀排序暖身與四上第九課句型頁。
- 驗證：`npm run validate`、`npm run check-workflow`、`npm run audit:listening -- --strict`、全部 35 個 `scripts/test-*.mjs`、正式／預覽建置、`check-dist`、`check-assets` 與 `git diff --check` 通過。`tools/dabutie` 的 pytest 未能執行，當前 Python 環境沒有安裝 `pytest`。
- GitHub 同步：本機 `git fetch --prune origin` 與 `git push -u origin codex/mandarin-115-all-grades` 都被 `SEC_E_NO_CREDENTIALS` 擋下；遠端尚未更新。本機提交保留，認證恢復後執行 `git push -u origin codex/mandarin-115-all-grades`。

## 2026-09-27｜學校 Win｜Codex｜狀態：✅ 完成；G3A 原缺圖成語補上 32 張理解圖
- 範圍：`apps/mandarin/scripts/materialize-g3a-missing-idiom-images.py`、`apps/mandarin/package.json`、`apps/mandarin/scripts/check-workflow-completeness.mjs`、`apps/mandarin/docs/lesson-generation-workflow.md`、G3A 第 7～12 課成語 JSON 與 WebP 資產。
- 做了什麼：依 32 筆成語辭意生成兒童教材理解圖，涵蓋 G3A 第 7～12 課原本沒有圖片的全部成語；公開資料逐筆接回相對路徑，來源標記為 `generated:imagegen-idiom-meaning`。
- 圖片契約：全部轉為 960×960 WebP，單張不超過 300 KiB，採 `square-contain` 完整容納，不使用長版 `cover` 裁切；生成原始 PNG 留在私有 `worksheet-batches`，未寫入公開 JSON 私有絕對路徑。
- 驗證：成語圖片完整性 PASS（55 課、346 張、0 筆缺圖）；相關 `test-*.mjs`（排除既有且與本項無關的 `test-lesson-dashboard-progress.mjs`）、`npm.cmd run validate`、`npm.cmd run check-workflow`、`npm.cmd run build`、`npm.cmd run check-dist`、`npm.cmd run check-assets`、`git diff --check` 均通過。
- 提交／推送：本項尚未建立提交、尚未推送；保留工作樹中其他既有教材與網站修改。

## 2026-09-27｜學校 Win｜Codex｜狀態：✅ 完成；G1A 生字變成語候選字重複修正
- 範圍：`apps/mandarin/src/components/IdiomBuilder.js`、`scripts/test-idiom-option-uniqueness.mjs`、`scripts/check-workflow-completeness.mjs`。
- 原因：第一關原本只排除同一個成語 ID，沒有排除相同 `related_char`；因此第 2 課「粗枝大葉／大驚小怪」、第 3 課與第 5 課的部分題目會出現兩個相同候選字，例如「大、大、心」。
- 修正：干擾字改按畫面顯示字去重，並排除與正確字相同的字；第二關成語選項也共用同一個去重函式。
- 驗證：新增 G1A 39 題候選字不重複回歸測試；`npm.cmd run validate`、`npm.cmd run check-workflow`、升級權限 `npm.cmd run build`、`npm.cmd run check-dist`、`npm.cmd run check-assets`、`git diff --check` 均通過。
- 提交／推送：本項尚未建立提交、尚未推送；保留工作樹中其他既有教材與網站修改。

## 2026-09-27｜學校 Win｜Codex｜狀態：✅ 完成；全年級成語圖長版裁切稽核與完整容納版面
- 範圍：`apps/mandarin/scripts/normalize-idiom-images.py`、`scripts/materialize-g1a-idiom-images.py`、`scripts/test-idiom-image-completeness.mjs`、`src/styles/components.css`、成語圖片 JSON 與 WebP 資產、工作流文件／完整性檢查。
- 稽核結果：檢查 G1A、G2A、G3A、G4A、G6A 共 55 課、346 筆成語；其中 314 筆已有圖片，原有直式／橫式／非 960 正方形圖片均另存為 `-fit.webp`，以完整容納方式置中到 960×960，原圖不覆寫；另 32 筆仍無圖片，維持原本未補圖狀態。
- G1A 修正：重新製作「聞雞起舞」安全構圖，雞完整留在畫面內；G1A 39 張成語圖均為 960×960 WebP。成語圖片框明確使用 1:1、`contain`、置中與背景，避免容器再度以 `cover` 裁切。
- 容量：所有引用中的成語圖均為 960×960 WebP、單張不超過 300 KiB；`check-assets` 通過，單課 4 MiB 上限通過。
- 驗證：成語圖片完整性 PASS（55 課、314 張）、成語情境句／填句／句型共用入口／星星覆蓋 PASS；`npm.cmd run validate`、`npm.cmd run check-workflow`、升級權限 `npm.cmd run build`、`npm.cmd run check-dist`、`npm.cmd run check-assets`、`git diff --check` 均通過。
- 來源／交付：生成來源 PNG 與接觸表留在私有工作區，公開 repo 只保留衍生 WebP 與相對路徑；本項尚未建立提交、尚未推送，保留工作樹中其他既有教材與網站修改。

## 2026-09-27｜學校 Win｜Codex｜狀態：✅ 完成；G1A 生字變成語補上辭意理解圖
- 範圍：`apps/mandarin/scripts/materialize-g1a-idiom-images.py`、`apps/mandarin/scripts/materialize-g1a-content.mjs`、`apps/mandarin/scripts/test-idiom-image-completeness.mjs`、G1A `public/assets` 與 `lesson01.json`～`lesson07.json`、工作流文件與完整性檢查。
- 做了什麼：依 39 個成語辭意生成 7 張私有接觸表，再裁切為每成語 1 張公開理解圖；所有圖片為 960×960 WebP，並以 `image_origin=generated:imagegen-contact-sheet-crop` 保留生成來源標記。未將接觸表或私有絕對路徑放入公開 repo。
- 工作流：新增 G1A 成語圖裁切器與成語圖片完整性回歸測試，逐筆檢查圖片存在、格式、960×960 尺寸與單張 300 KiB 上限。
- 驗證：成語圖片 39／39 通過；`npm.cmd run materialize:g1a`、`npm.cmd run validate`、`npm.cmd run check-workflow`、成語情境／填句／星星覆蓋及其餘 `test-*.mjs`（排除既有與本項無關的 `test-lesson-dashboard-progress.mjs`）均通過；正式 `npm.cmd run build`、`npm.cmd run check-dist`、`npm.cmd run check-assets`、`git diff --check` 通過。全套測試唯一既有失敗為 G3A 第 1 課 dashboard 測試仍預期 listening 不存在，但目前資料已有 listening，與本次 G1A 成語圖無關。
- 提交／推送：本項尚未建立提交、尚未推送；保留工作樹中其他既有教材與網站修改，未廣泛提交。

## 2026-09-27｜學校 Win｜Codex｜狀態：✅ 完成；套用使用者貼上的 G1A L01～L07 09 閱讀理解提問
- 範圍：`apps/mandarin/scripts/materialize-g1a-content.mjs`、`apps/mandarin/public/data/115AG1H/lesson01.json`～`lesson07.json`。
- 做了什麼：依使用者貼上的第 1～7 課閱讀理解教材，替換原先每課 3 題的精簡題目，保留提取訊息、推論訊息、詮釋整合、比較評估四類標籤與答案提示；七課題數為 6／7／8／9／10／9／10，共 59 題。
- 顯示規則：正式學生畫面只顯示題目，按「看提示」才揭曉答案提示；策略標籤只在教師預覽顯示。
- 驗證：`npm.cmd run materialize:g1a`、`npm.cmd run validate`、`npm.cmd run check-workflow`、讀懂課文順序／星星覆蓋／聽聽看內容稽核、升級權限 `npm.cmd run build`、`npm.cmd run check-dist`、`npm.cmd run check-assets`、`git diff --check` 均通過。
- 提交／推送：本項尚未建立提交、尚未推送；保留工作樹中其他既有教材與網站修改，未廣泛提交。

## 2026-09-27｜學校 Win｜Codex｜狀態：✅ 完成；套用使用者貼上的 G1A L01～L07 06 句型教材
- 範圍：`apps/mandarin/scripts/materialize-g1a-content.mjs`、`apps/mandarin/src/activities/moduleRegistry.js`、`apps/mandarin/public/data/115AG1H/lesson01.json`～`lesson07.json`。
- 做了什麼：依使用者貼上的第 1～7 課「短語／短句／句型」內容，重建公開句型練習資料，保留各課結構、說明與例句；句型數量為 L01～L07：3／4／4／4／3／2／3。第 6 課來源本身只有 2 組，依已核准例句與來源內容新增 G1A L06 的 2 組開放例外，未補造第三組。
- 開放狀態：7 課句型練習均為 available；其他既有 G1A 擴充模組狀態維持不變，L01／L03／L07 一字多音與 L07 一字多義仍因缺乏可核實來源而保留 missing。
- 驗證：`npm.cmd run materialize:g1a`、`npm.cmd run validate`、`npm.cmd run check-workflow`、句型共用入口／形似字／星星覆蓋回歸測試、升級權限 `npm.cmd run build`、`npm.cmd run check-dist`、`npm.cmd run check-assets`、`git diff --check` 均通過。
- 提交／推送：本項尚未建立提交、尚未推送；保留工作樹中其他既有教材與網站修改，未廣泛提交。

## 2026-09-27｜學校 Win｜Codex｜狀態：✅ 完成；套用使用者貼上的 G6A L06／L09 句型教材
- 範圍：`apps/mandarin/scripts/apply-pasted-g6a-sentence-patterns.mjs`、`apps/mandarin/public/data/115AG6H/lesson06.json`、`lesson09.json`、`apps/mandarin/package.json`。
- 做了什麼：依使用者貼上的 06「短語／句型／造句練習」內容，將 G6A 第 6 課與第 9 課各更新為 8 組，保留結構、說明、引導與四個例句；第 6 課「過多多身體」依語意修正為「過多對身體也沒有幫助」。
- 驗證：`npm.cmd run materialize:g6a-pasted`、`npm.cmd run validate`、`node scripts/test-sentence-practice-shared.mjs`、升級權限 `npm.cmd run build` 均通過。
- 提交／推送：本項尚未建立提交、尚未推送；保留工作樹中其他既有教材與網站修改，未廣泛提交。

## 2026-09-27｜學校 Win｜Codex｜狀態：✅ 完成；G1A 課文樂園擴充項目物化與開放
- 範圍：`apps/mandarin/scripts/materialize-g1a-content.mjs`、`apps/mandarin/public/data/115AG1H/lesson01.json`～`lesson07.json`、形似字核准基準、G1A 工作流文件與物化 npm script。
- 做了什麼：依私有官方教材 04／05／06／08／09 與已核對課文來源，補入 7 課句型練習、讀懂課文提問、課文地圖、形似字、成語／生活化例句、一字多義；04 來源核實的 L02／L04／L05／L06 多音字也已開放。形似字沿用私有 7 課、每課 10 題題庫，未把官方原檔或私有路徑放入公開資料。
- 開放狀態：句型、讀懂課文、課文地圖、形似字、成語、一字多義均為 7／7 課 available；一字多音為 L02、L04、L05、L06 available，L01、L03、L07 因來源沒有至少兩種可核實不同注音而保留 missing；L07 一字多義因 04 來源不足也保留 missing。
- 工作流：新增 `npm run materialize:g1a`，並修正形似字回歸基準以接受官方題庫中只為正確字提供例詞的干擾選項；不要求臆造干擾字例詞。
- 驗證：`npm.cmd run materialize:g1a`、`npm.cmd run validate`、`npm.cmd run check-workflow`、成語／句型／形似字／星星覆蓋／課文朗讀回歸測試、`npm.cmd run build`、`npm.cmd run check-dist`、`npm.cmd run check-assets`、`git diff --check` 均通過。建置第一次受沙箱上層目錄權限阻擋，升級受控權限後成功。
- 提交／推送：本項尚未建立提交、尚未推送；保留工作樹中其他既有教材與網站修改，未廣泛提交。

## 2026-09-27｜學校 Win｜Codex｜狀態：✅ 完成；聽聽看待選選項精簡與工作流閘門
- 範圍：`apps/mandarin/scripts/backfill-listening-passages.mjs`、`scripts/audit-listening-content.mjs`、`docs/lesson-generation-workflow.md`、各年級聽聽看 JSON。
- 做了什麼：將 G2A、G4A 等課次中帶有課文全文、頁碼、解析或推論過程的待選選項，依原答案語意縮成可直接作答的短句；同步縮短答案欄位，避免答案與選項不一致。G4A 第 5 課畫面中的冗長選項已改為「期待光明，也珍惜看見的時光」、「小時候生病。失明與失聰」、「她用『假如』想像看見世界」。
- 工作流規則：共用稽核器新增選項存在性與 45 字上限；超過上限即列為 `REVIEW_REQUIRED`，並在工作流文件明訂不得放入頁碼、依據、解析或推論說明。
- 驗證：聽聽看 187 題 PASS、0 FAIL、0 REVIEW_REQUIRED；G3A 第 1 課仍保留 1 課 LOCKED。`npm.cmd run validate`、`npm.cmd run check-workflow`、`npm.cmd run audit:listening -- --strict`、`node scripts/test-listening-single-round.mjs`、升級權限 `npm.cmd run build`、`npm.cmd run check-dist`、`npm.cmd run check-assets`、`git diff --check` 均通過；已重新讀回 G4A 第 5 課聽聽看預覽。
- 提交／推送：本項尚未建立提交、尚未推送；保留工作樹中其他既有教材與網站修改，未廣泛提交。

## 2026-09-27｜學校 Win｜Codex｜狀態：✅ 完成；全站語音語速與腔調選擇更新
- 範圍：`apps/mandarin/src/utils/speech.js`、`apps/mandarin/scripts/test-speech-voice-selection.mjs`。
- 做了什麼：TTS 預設語速與 normal preset 統一為 `0.9`；臺灣中文仍為必要條件，若裝置同時提供 Microsoft／Google 的臺灣 Natural 語音，優先選自然語音，否則回退臺灣內建語音；不退回中國大陸或香港中文聲音。
- 驗證：語音選擇／讀音替代／語速回歸測試、`npm.cmd run validate`、`npm.cmd run check-workflow`、升級權限 `npm.cmd run build`、`npm.cmd run check-dist`、`npm.cmd run check-assets`、`git diff --check` 均通過；已重新開啟 G6A 第 5 課聽聽看預覽。
- 提交／推送：本項尚未建立提交、尚未推送；工作樹另有既存教材與網站修改，未擅自覆蓋或廣泛提交。

## 2026-09-27｜學校 Win｜Codex｜狀態：✅ 完成；G1A 第1～7課聽聽看開放
- 範圍：`apps/mandarin/scripts/backfill-listening-passages.mjs`、`apps/mandarin/public/data/115AG1H/lesson01.json`～`lesson07.json`。
- 做了什麼：回到 G1A 翰林官方「09閱讀理解提問」與第一冊課文逐課核對，補入 7 課、共 21 題；每題新增只支撐答案的短版 `passage`，畫面播放「先聽一聽」後再作答。七課 `modules.listening.status` 均改為 `available`。
- 驗證：G1A 聽聽看 21/21 題 PASS；全冊聽聽看 PASS 187、FAIL 0、REVIEW_REQUIRED 0，G3A 第1課仍因題目與官方課文不符維持鎖定。`npm.cmd run validate`、`npm.cmd run check-workflow`、`npm.cmd run audit:listening -- --strict`、`node scripts/test-listening-single-round.mjs` 均通過。
- 提交／推送：本項尚未建立提交、尚未推送；工作樹另有既存教材與網站修改，未擅自覆蓋或廣泛提交。

## 2026-09-27｜學校 Win｜Codex｜狀態：✅ 完成；G3A 第1課維持鎖定
- 範圍：`apps/mandarin/scripts/backfill-listening-passages.mjs`、聽聽看資料、工作流文件與完整性閘門。
- 做了什麼：回到 G2A、G3A、G4A、G6A 私有官方課文逐題核對並補入 166 題 `passage`；每題只保留支持答案的一至兩句關鍵語句。另修正 G6A 第1課 3 題與官方詩文不一致的答案／選項。
- 核對結果：可用題目 PASS 166；FAIL 0；REVIEW_REQUIRED 0。G1A 7 課沒有可用聽聽看資料；G3A 第1課現有生活作息題與〈時間是什麼〉不相符，因此標為 `missing` 並保留 `review_required` 題目，不硬塞不相關課文。
- 驗證：`npm.cmd run validate`、`npm.cmd run check-workflow`、`npm.cmd run audit:listening -- --strict`、`node scripts/test-listening-single-round.mjs`、`git diff --check` 通過。
- 提交／推送：本項尚未建立提交、尚未推送；工作樹另有既存教材與網站修改，未擅自覆蓋或廣泛提交。

## 2026-09-27｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/scripts/test-sentence-practice-shared.mjs`、`scripts/check-workflow-completeness.mjs`。
- 做了什麼：新增跨版本一致性閘門，掃描 course-index 登錄的 G1A、G2A、G3A、G4A、G6A 共 55 課，確認所有 `sentence_practice` 都導向共用句型練習與 `SentenceOrdering` 互動引擎。
- 驗證：跨版本共用入口測試與工作流完整性檢查通過。
- 提交／推送：本項已建立本地提交；尚未推送遠端。

## 2026-09-27｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/src/components/SentenceOrdering.js`、句子排序回歸測試、星星覆蓋測試與工作流契約。
- 做了什麼：檢查答案送出前，再點一次已放置詞塊即可單獨退回候選區原本的位置；其他詞塊不受影響，並保留原有檢查後的部分判錯、綠／紅底色與拖拉修正模式。
- 驗證：句子排序回歸測試、SpeakButton coverage、模組星星覆蓋測試均通過；完整資料／工作流／建置檢查於本次修改後重新執行。
- 提交／推送：本項已建立本地提交；尚未推送遠端。

## 2026-09-27｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/src/components/SentenceOrdering.js`、`src/styles/components.css`、句子排序回歸測試與教材網站批次產出工作流文件／完整性檢查。
- 目標：將各年級「練習句子」統一採用部分判錯模式；正確詞塊綠底黑字並鎖定，錯誤詞塊紅底黑字退回候選區，保留再次拖拉修正的機會。
- 驗證：`npm.cmd run validate`、`npm.cmd run check-workflow`、全部 `scripts/test-*.mjs`、升級權限 `npm.cmd run build`、`npm.cmd run check-dist`、`git diff --check` 均通過；已更新各年級共用句子排序工作流契約與回歸測試。
- 提交／推送：本項已建立本地提交；尚未推送遠端。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/src/styles/components.css`、`apps/mandarin/scripts/test-vocabulary-image-fit.mjs`。
- 做了什麼：修正語詞卡圖片框原本以 4:3 `object-fit: cover` 顯示，造成方形插圖上下被裁掉；語詞卡改用 1:1 圖片框與 `object-fit: contain`，完整保留插圖內容。其他圖片模組維持原本規則。
- 驗證：已在 G4A 第 3 課「指揮」語詞卡預覽確認指揮者頭部與前景樂手完整顯示；新增圖片比例回歸測試；`npm.cmd run validate`、完整 `scripts/test-*.mjs`、升級權限 `npm.cmd run build`、`npm.cmd run check-dist`、`npm.cmd run check-assets` 均通過。
- 提交／推送：本項待建立本地提交；尚未推送遠端。工作樹另有既存的 G2A 未追蹤／修改內容，未納入本項。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/src/activities/sentencePractice.js`、`apps/mandarin/scripts/test-sentence-practice-prompt.mjs`。
- 做了什麼：移除句子重組題幹中對學生不必要的「（句型：……）」資訊；保留上方的「句子重組」與步驟／題數進度提示。
- 驗證：新增題幹回歸測試；`npm.cmd run validate`、完整 `scripts/test-*.mjs`、升級權限 `npm.cmd run build`、`npm.cmd run check-dist`、`npm.cmd run check-assets` 均通過。已開啟第五課句型練習本機預覽。
- 提交／推送：本項待建立本地提交；尚未推送遠端。工作樹另有既存的 G2A 未追蹤／修改內容，未納入本項。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：G4A 第 5 課「失聰」語詞卡圖片 `apps/mandarin/public/assets/115AG4K/lesson05/vocabulary/l05-16-v2.webp` 與 `lesson05.json` 圖片引用。
- 做了什麼：修正右側女孩多出的下垂手臂／手，保留耳旁的手與抓背包帶的手；原 `l05-16.webp` 保留，公開資料改接修正版 `l05-16-v2.webp`。
- 資產規格：修正版為 1200×1200 RGB WebP，82,912 bytes；無文字、無浮水印，未改動其他語詞卡。
- 驗證：`npm.cmd run validate`、語詞圖片完整性與配對測試、完整 `scripts/test-*.mjs`、升級權限 `npm.cmd run build`、`npm.cmd run check-dist`、`npm.cmd run check-assets` 均通過。已開啟第五課語詞卡本機預覽。
- 提交／推送：本項待建立本地提交；尚未推送遠端。工作樹另有既存的 G2A 未追蹤／修改內容，未納入本項。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/src/activities/rhetoric.js`、`apps/mandarin/scripts/enrich_g4a_official.py`、`apps/mandarin/scripts/test-rhetoric-highlights.mjs`、G4A 12 課公開修辭資料。
- 做了什麼：修辭小偵探改為每個官方例句逐題作答，不再把 3–5 題合併在同一畫面；康軒來源的 `⑴⑵⑶`、圈號與數字括號例句已拆開，並移除只供教材分析的尾端註記。
- 關鍵詞規則：保留官方 `「」` 等明確標記；G4A 只對可由句型穩定逆推的譬喻、設問、感嘆、明確重複／排比片段加入 `highlight_terms`。摹寫、轉化等無法可靠定位者維持不標色，沒有臆造關鍵詞。
- 驗證：G4A 修辭共 35 題；`npm.cmd run validate`、完整 `scripts/test-*.mjs`、Python `py_compile`、升級權限 `npm.cmd run build`、`npm.cmd run check-dist`、`npm.cmd run check-assets` 均通過。已開啟本機 G4A 第 9 課修辭預覽，畫面顯示「第 1 題／共 3 題」且每題內只有 1 題。
- 提交／推送：本項待建立本地提交；尚未推送遠端。工作樹另有既存的 G2A 未追蹤／修改內容，未納入本項。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/src/activities/structureMap.js`。
- 做了什麼：課文地圖的整課結構樹不再直接顯示目前題目的結構角色；目前段落改顯示「目前段落」，保留其他結構節點作為情境參考，避免上方資訊先揭露下方作答答案。
- 驗證：已在 G4A 第 5 課課文地圖本機預覽確認；`npm.cmd run validate`、`npm.cmd run check-workflow`、升級權限 `npm.cmd run build`、`npm.cmd run check-dist`、`npm.cmd run check-assets`、全套 `scripts/test-*.mjs` 均通過。
- 提交／推送：本項已建立本地提交；尚未推送遠端。工作樹另有既存的 G2A 未追蹤／修改內容，未納入本項。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：G4A 康軒 1–12 課生字變成語圖片、G4A 修辭小偵探開放條件與選項、G6A 第 5 課「腳踏實地」修正版圖片。
- 做了什麼：依各課官方成語語義建立 69 張無文字語義插圖；`idioms[].image` 全部接回對應課次，公開資產統一為 960×720 WebP，單張低於 200 KiB；既有可核對成語圖只沿用明確對應者。G6A 保留原圖，新增 `04_腳踏實地-v2.webp` 並回寫 L05 JSON，修正人物多一隻腳。G4A 修辭官方例句拆成可作答題目，官方只有 1–2 題的課次仍以來源題開放，並以全冊修辭名稱補足選項。
- 來源邊界：官方原始教材與 Excel 未加入公開 repo；圖片為無文字衍生視覺素材，原始生成 PNG 留在私有暫存區。未覆蓋 G6A 原問題資產。
- 驗證：`npm.cmd run validate`、`npm.cmd run check-workflow`、`npm.cmd run check-assets`、全套 `scripts/test-*.mjs`、升級權限 `npm.cmd run build`、`npm.cmd run check-dist`、`git diff --check` 均通過；G4A 69 張成語圖皆存在且為 960×720，最大約 100 KiB。已開啟 G4A 第 1 課「生字變成語」與第 6 課「修辭小偵探」本機預覽。
- 提交／推送：本項主要本地提交為 `14e0a10`；尚未推送遠端。工作樹另有既存的 G2A 未追蹤／修改內容，未納入本項。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/data/115AG4K/lesson01.json`～`lesson12.json`、`apps/mandarin/scripts/enrich_g4a_official.py`、`apps/mandarin/scripts/generate_lessons.py`。
- 做了什麼：依指定的康軒官方教材匯入生字變成語、練習句子、一字多義、一字多音、聽聽看、修辭小偵探；每課生字頁新增雄筆順連結；生字卡改以康軒工作表排序取最常見造詞，並保留來源不足項目的可核對詞例。
- 來源邊界：官方 `.doc` 原檔與常用度 Excel 均未加入公開 repo；公開 JSON 只保存衍生內容、來源定位與 SHA-256。遨字第三項以教育部辭典核對的「遨嬉」補足；蓓只有「蓓蕾」、嘖只有兩個可靠詞例，沒有臆造第三項。
- 開放狀態：符合既有活動最少題數契約的模組標為 `available`；第 9 課句型、各課修辭，以及第 2／7／12 課無明確官方多音辨析者，依來源數量維持 `missing`，避免把不足資料標成可開始。
- 驗證：`npm.cmd run validate`、升級權限 `npm.cmd run build`、`npm.cmd run check-dist`、`npm.cmd run check-assets`、全部 `scripts/test-*.mjs`、Python `py_compile`、公開 JSON 亂碼／絕對路徑掃描均通過。沙箱第一次 build 因 `Access is denied` 失敗，升級權限後成功。
- 提交／推送：本項本地提交為 `00576e3`；尚未推送遠端。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：G4A 康軒 1–12 課語詞解釋卡圖片補齊、舊圖明確配對盤點、WebP 壓縮與公開資料回寫；同步把 G4A 接回語詞圖片工作流與完整性測試。
- 規則：只有檔名或私有 manifest 能明確對應完整詞名的舊圖才重用；沒有可靠詞圖對照的 `L02_01` 類舊圖不猜配。其餘依官方語詞 meaning 生成一詞一圖，原始生成 PNG 只留私有工作區，公開只放符合單張 300 KiB／單課 4 MiB 閘門的 WebP。
- 完成結果：G4A 12 課、183 個語詞全部回寫圖片；共沿用 35 張能由完整詞名確認的舊圖，其餘使用依官方 meaning 建立的私有生成圖 manifest。公開只保留 183 張 WebP，原始生成 PNG 與 manifest 留在私有暫存區。
- 驗證：`npm.cmd run validate`、`test-vocabulary-image-completeness.mjs`（G3A／G4A／G6A 共 496 個語詞）、`check-workflow-completeness.mjs`、全套 `scripts/test-*.mjs`、升級權限 `npm.cmd run build`、`npm.cmd run check-dist`、`npm.cmd run check-assets` 均通過；公開資產 708 個、704 張 WebP／AVIF、58.43 MiB，單張與單課容量均通過。
- 注意：本項工作尚未推送遠端；G4A 來源內容依既有官方來源直接公開，圖片是依官方詞義生成的衍生視覺素材。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：G4A 康軒 1–12 課來源準備、`apps/mandarin/scripts/prepare_g4a.mjs`、`apps/mandarin/scripts/generate_lessons.py` 的 G4A 準備資料介面、G4A 工作流與公開課次資料。
- 做了什麼：依康軒 12 課來源資料夾與既有來源 manifest 產出私有準備資料，再匯入 `public/data/115AG4K/lesson01.json`～`lesson12.json`；補上課名對齊、生字注音、Unihan 部首／筆畫、常用度造詞上限三項、形似字群組、段落摘要、課文地圖、挑戰題、筆順連結與課程索引。
- 來源邊界：公開資料不含官方原檔、完整課文、私有路徑或未壓縮圖片。句型、成語、修辭、一字多義、一字多音、聆聽答案與沒有明確配對來源的語詞圖片維持未開放或 `image: null`；沒有以推測內容補齊。缺少直接命中語詞注音的生字，準備階段以固定 pypinyin 衍生並以 `zhuyin_source` 標記，後續仍可按課本複核。
- 驗證：`npm run validate`（43 課）、`node scripts/sync-review-coverage.mjs --check`、`node scripts/check-workflow-completeness.mjs`、`npm run build`、`npm run check-dist`、`npm run check-assets`（525 資產／40.37 MiB）、全套 `scripts/test-*.mjs` 均通過。
- 目前狀態：G4A 12 課可公開瀏覽，已與 `course-index.json` 對齊；圖片容量總量仍在既有 600 MiB 警告線以下。尚未推送遠端，提交前請再次確認 `git status` 與公開 diff。
- 請勿同時修改上述範圍；若要補齊待開放模組，先提供對應的官方來源核對結果，再沿用同一準備資料契約重跑。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/scripts/generate_lessons.py`、`apps/mandarin/scripts/check-workflow-completeness.mjs`、`apps/mandarin/docs/specs/2026-09-25-mandarin-dabutie-importer.md`、`apps/mandarin/docs/lesson-generation-workflow.md`。
- 做了什麼：補上 G6A 的公開準備資料介面（只接受已審核的標準課次 JSON 與 WebP／AVIF 資產，不把官方原始檔放進公開倉庫）；補齊大補帖匯入、來源邊界、圖片容量、回歸驗證與重跑規格；新增 `check-workflow-completeness.mjs` 與 `npm run check-workflow`，檢查 10 個工具／契約、13 個回歸測試與 10 個 npm 閘門。
- G4A 只完成唯讀檔案／資料夾盤點，未開始生成：01–16 官方資料夾均存在，12 課核心課文與課文結構／圖像策略檔案齊全；但多份資料是合併文件，尚未建立內部課次索引，且 G4A 康軒來源 profile 尚未確認各模組權威段落。詞語解釋、字義／字音字形、修辭、聆聽等候選檔案已列出，需先完成內容抽取與來源綁定；目前不能據檔名直接生成。
- 受限事項：Windows Word COM 內容抽取回傳 `CO_E_SERVER_EXEC_FAILURE (0x80080005)`，所以本次 G4A 掃描是檔案結構／檔名層級，沒有把未核實的內容當成官方資料。
- 驗證：工作流完整性檢查、`npm.cmd run validate`、`npm.cmd run build`、`npm.cmd run check-dist`、`npm.cmd run check-assets`、Python AST 解析、`git diff --check` 均通過；資產檢查為 521 張 WebP／AVIF、40.37 MiB。第一次沙箱建置被目錄存取限制擋住，升級權限重跑後建置通過。
- 提交／推送：已建立本地提交 `e949e6e`；尚未推送。G4A 尚未生成，等待來源確認後再進入生成階段。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/src/components/IdiomBuilder.js`、`DragToSlot.js`、成語填句子回歸測試。
- 做了什麼：第二關「成語填句子」改為把候選成語直接填入句子內的 `（　　）`，呈現為 `（成語）`；移除句子外獨立的 `?` 答案框，句中括號仍可點擊清除並重新選擇。第一關維持成語內嵌生字空格，並改用正確的操作說明。
- 驗證：新增 `test-idiom-fill-sentence.mjs`；該測試、`test-drag-to-slot.mjs`、`test-module-star-coverage.mjs`、全部 `scripts/test-*.mjs`、`npm.cmd run validate`、`npm.cmd run build`、`npm.cmd run check-dist`、`npm.cmd run check-assets`、`git diff --check` 均通過；本機預覽確認成語拖放操作說明正確。
- 推送：尚未推送；本次修改待建立本地提交。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：全面稽核 G1A／G3A／G6A 的「舊字新詞」跨課索引、公開課次 JSON、批次產出工具與工作流。
- 做了什麼：發現 G1A 7 課、G6A 12 課、G3A 第 7～12 課的 `review_words` 有缺漏；新增 `scripts/sync-review-coverage.mjs`，以各課既有公開生字建立累積索引，並同步 `modules.review` 狀態。`generate_lessons.py` 批次產出後也會自動同步，不再只開放 G3A 前 5 課。
- 查核結果：31 課中 28 課可開始舊字新詞；三個年級各自第 1 課因沒有前課資料維持鎖定，其餘第 2 課起均能產生 3～5 題跨課複習題。
- 驗證：`node scripts/sync-review-coverage.mjs --check`、`node scripts/test-review-coverage.mjs`、全部 `scripts/test-*.mjs`、`npm.cmd run validate`、`npm.cmd run check-assets`、`npm.cmd run build`、`npm.cmd run check-dist`、Python `py_compile`、`git diff --check` 均通過；本機預覽確認 G3A 第 8 課顯示「舊字新詞／可以開始」。
- 工作流：已加入跨課索引建立、唯讀稽核與實際題目回歸測試指令；資料仍只使用公開衍生課次 JSON，沒有新增或猜測官方教材內容。
- 推送：尚未推送；本次修改待建立本地提交。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：G3A 第 7～12 課的 `polysemy`、`polysemy_senses`、`polyphones`、`listening`、`rhetoric`，以及官方延伸直出工具與工作流。
- 做了什麼：依使用者指定的翰林官方來源補入公開衍生資料：`06字義分析` 建立一字多義題、各課 `05形音輕鬆學(含語詞解釋)` 的「認識多音字」建立一字多音題、`15閱讀理解提問` 建立聽聽看題目、`10修辭輕鬆學` 解析建立修辭題；修辭 `example` 保留官方 `﹁﹂` 關鍵字標記。新增 `scripts/publish-g3a-official-extensions.mjs` 可重跑直出，並把來源規則與「無官方多音字段落不硬湊」寫入工作流。
- 發佈數量：一字多義 55 題、聽聽看 18 題、修辭 18 題；第 8～10 課共 7 個多音字，含經查證的不同注音。第 7、11、12 課官方檔案沒有「認識多音字」段落，維持未開放並在模組備註說明原因。
- 驗證：`npm.cmd run validate`、新增 `test-g3a-official-extensions.mjs`、全部 `scripts/test-*.mjs`、`npm.cmd run check-assets`、`npm.cmd run build`、`npm.cmd run check-dist`、`git diff --check` 均通過；生產建置 31 份課次資料、525 個資產、521 張 WebP／AVIF、40.37 MiB。以本機 Vite 預覽確認 G3A 第 8 課五個新增延伸模組均顯示「可以開始」。
- 推送：尚未推送；目前只完成本地修改，待建立本地提交。
- 注意：官方原始教材與抽取暫存檔未加入公開 repo；公開 JSON 只保存衍生題目與來源標籤。網站仍維持既有圖片容量規則，本次沒有新增圖片。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：G1A／G3A／G6A 全部公開課次資料與 G3A 直出工具
- 做了什麼：逐課比對公開 JSON 的實際題目陣列、`modules` 狀態與生產 `dist/data` 過濾結果。沒有發現其他年級存在「已有可用題目但仍被阻擋」的新增案例；G3A 第 7～12 課已在前一項工作完成直出，本次另清除其已開放模組殘留的「待審核」備註，避免狀態文字矛盾。
- 查核結果：G1A 未開放延伸模組的陣列均為空；G6A 尚未開放的一字多音課次沒有可直接使用的公開題目；G3A 第 7～12 課剩餘未開放項目同樣沒有題目資料。`application`、`review` 等屬於尚未有資料的預期狀態，沒有硬標成可開始。
- 驗證：重新掃描 public／dist 資料、`git diff --check`；前一項已完成的 `npm.cmd run validate`、完整 `scripts/test-*.mjs`、`npm.cmd run build`、`npm.cmd run check-dist`、`npm.cmd run check-assets` 結果仍適用，修改後將再跑一次。
- 推送：本次修改尚未建立提交，也尚未推送；目前分支仍比遠端同名分支超前。
- 注意：私有來源中仍有 PPTX／PDF 等未標準化教材，不等同可直接公開的網站資料；若要匯入，需先轉成網站 JSON 契約並確認題型欄位。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/data/115AG3H/lesson07.json`～`lesson12.json`、`apps/mandarin/docs/lookalike-approved-groups.json`、`apps/mandarin/scripts/publish-g3a-extensions.mjs`、`apps/mandarin/docs/lesson-generation-workflow.md`
- 做了什麼：依使用者明確授權「不用審核、直接公開」，將 G3A 第 7～12 課已有來源的句型、成語與具體情境句、聚焦理解提問、形似字資料直接寫入公開課次 JSON；同步開放句型練習、成語練習與形似字模組，並加入可重跑的直出工具與工作流說明。
- 發佈數量：6 課共 33 筆句型、32 個成語、32 筆成語填句子情境句、36 筆閱讀提問、38 組形似字；每筆成語例句均包含成語且保留具體生活語境。
- 圖片：來源成語圖仍為未壓縮 PNG，本次沒有帶入公開 repo；JSON 使用 `image: null`，避免違反單張 WebP／AVIF 300 KiB 與單課 4 MiB 規則，也避免私有絕對路徑外洩。
- 驗證：`npm.cmd run validate`、`test-idiom-sentence-contexts.mjs`、`test-lookalike-shape-groups.mjs`、`npm.cmd run build`、`npm.cmd run check-dist`、`npm.cmd run check-assets` 均通過；建置後 `public/assets` 為 40.37 MiB、521 張 WebP/AVIF，開發伺服器 HTTP 200 且第 7 課成語模組狀態為 `available`。
- 推送：本次修改尚未建立提交，也尚未推送；本機預覽伺服器仍在工作階段運作。
- 待辦／給下一棒：若發現直出內容錯誤，直接修正對應公開 JSON 後重跑上述測試；若要補成語圖片，先壓成符合容量規則的 WebP／AVIF，再回寫 `image`。
- 注意：這批資料是使用者授權直出，未經人工審核；官方原始教材、私有工作檔與未壓縮圖片未加入公開 repo。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/data/115AG6H/lesson05.json`、`apps/mandarin/public/assets/115AG6H/lesson05/vocabulary/l05-05-v2.webp`
- 做了什麼：針對 G6A 第 5 課「淘氣」圖片與詞意不符的回報，核對公開資產後確認正確圖像應為孩童頑皮、玩具散落的情境；為避免瀏覽器或舊預覽伺服器快取同名舊樹木圖片，保留原檔並以版本化檔名 `l05-05-v2.webp` 回寫資料。圖片為 WebP，132,542 bytes；原檔未刪除。
- 預覽：重新啟動 Vite 開發伺服器，`http://127.0.0.1:5173/` 可連線；伺服器直接回傳新的 `/assets/115AG6H/lesson05/vocabulary/l05-05-v2.webp`，HTTP 200、`image/webp`。
- 驗證：`node scripts/test-vocabulary-image-completeness.mjs`、`npm.cmd run validate`、`npm.cmd run check-assets`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；建置後 31 份課次資料、521 張 WebP/AVIF、總資產 40.37 MiB。
- 推送：本次修改尚未建立提交，也尚未推送；預覽伺服器目前仍在本機工作階段運作。
- 待辦／給下一棒：開啟 G6A 第 5 課語詞頁時使用 `http://127.0.0.1:5173/?cacheBust=20260926-g6a-l05#/lesson/115AG6H05/module/vocabulary`；若部署到 GitHub Pages，需一併提交新的 JSON 與 WebP 資產。
- 注意：原始 `l05-05.webp` 保留作為回復依據，未修改官方教材與來源檔。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/data/115AG6H/lesson01.json`～`lesson12.json`、`apps/mandarin/docs/lookalike-approved-groups.json`、`apps/mandarin/scripts/sync-g6a-lookalikes-from-official.mjs`、`apps/mandarin/scripts/test-lookalike-shape-groups.mjs`、`apps/mandarin/scripts/test-g6a-lesson05-lookalikes.mjs`、`apps/mandarin/docs/lesson-generation-workflow.md`
- 做了什麼：檢視 G1A／G3A／G6A 公開形似字題目。G6A 12 課改以官方形似字辨別題庫的 `official_shape_group` 重建答案群組，修正「例詞第一字被誤當答案」造成的非形似字選項，並保留每個選項的有效例詞；G3A 已有課次與 G1A 目前未開放課次一併建立公開核對基準。
- 核對結果：跨 31 課、162 組、524 個選項檢查；每組至少兩個不重複漢字，每個例詞均包含對應字，沒有未核准字形混入。G1A 目前沒有形似字資料，維持未開放，不猜測補題。
- 工作流：新增「形似字選項核對」規則，禁止用例詞第一字推回答案；新增私有官方題庫同步工具與 `docs/lookalike-approved-groups.json` 衍生基準，後續批次產出必須先核對 `official_shape_group`，不確定即標記 `REVIEW_REQUIRED`。
- 驗證：`test-lookalike-shape-groups.mjs`、`test-g6a-lesson05-lookalikes.mjs`、`test-lookalike-splitting.mjs`、全部 `scripts/test-*.mjs`、`npm.cmd run validate`、`npm.cmd run check-assets`、`npm.cmd run build`、`npm.cmd run check-dist`、`git diff --check` 均通過；建置後 31 份課次資料、520 張 WebP/AVIF、總資產 40.24 MiB。
- 推送：本次修改已建立本地提交，尚未推送。開工前 `git pull --rebase origin main` 因 GitHub Schannel `SEC_E_NO_CREDENTIALS` 失敗，未強行改動遠端。
- 待辦／給下一棒：新增或匯入形似字題目時，先更新私有官方核對資料，再重新產生公開核對基準並執行 `node scripts/test-lookalike-shape-groups.mjs`；不要直接手動加入未核准選項。
- 注意：官方教材、Wordwall 私有題庫與來源檔未加入公開 repo；只提交衍生後的課程 JSON、核對基準與工具。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/data/115AG3H/lesson01.json`～`lesson06.json`、`apps/mandarin/public/data/115AG6H/lesson02.json`、`lesson04.json`、`lesson11.json`、`apps/mandarin/scripts/test-rhetoric-highlights.mjs`、`apps/mandarin/docs/lesson-generation-workflow.md`
- 做了什麼：全面檢查 G1A／G3A／G6A 所有課次的「修辭小偵探」；G3A 24 筆與 G6A 3 筆原本缺少關鍵字框標，已補上 `﹁關鍵字﹂`，G1A 無修辭資料的課次維持未開放。回歸測試現在會跨三個年級掃描 58 筆可用題目，確認每筆都有成對標記、標記數與 `.rhetoric-highlight` 變色片段一致，且朗讀純文字不含框字。工作流已列入資料標記、畫面變色、朗讀去標記與跨年級檢查規則。
- 驗證：`test-rhetoric-highlights.mjs`、全部 `scripts/test-*.mjs`、`npm.cmd run validate`、`npm.cmd run check-assets`、`npm.cmd run build`、`npm.cmd run check-dist`、`git diff --check` 均通過；建置後檢查 31 份課次資料與 520 張 WebP/AVIF 資產。
- 推送：尚未推送；本次修改待建立本地提交。開工前 `git pull --rebase origin main` 因 GitHub Schannel `SEC_E_NO_CREDENTIALS` 失敗，未強行改動遠端。
- 待辦／給下一棒：新增或匯入修辭題目時，先在 `example` 標出真正的關鍵字，再執行 `node scripts/test-rhetoric-highlights.mjs`。
- 注意：未修改官方原始教材；G1A 沒有修辭資料的課次不製造空白標記。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/assets/115AG6H/lesson02/vocabulary/l02-13.webp`、`lesson03/vocabulary/l03-03.webp`、`lesson06/vocabulary/l06-17.webp`、`lesson08/vocabulary/l08-06.webp`
- 做了什麼：依語詞正式解釋重做四張圖詞不符的 G6A 語詞卡圖片：「寬」改為明確放鬆情境、「鏗鏘」改為清脆響亮的三角鐵聲音、「窘境」改為孩子在教室紙張散落時的尷尬處境、「不羈」改為在開闊草地自由演奏的情境。四張均由私有生成來源產出後，依既有流程壓縮為 WebP。
- 驗證：四張檔案分別為約 105.2、52.1、99.8、95.8 KiB，均低於單張 300 KiB；`test-vocabulary-image-pairs.mjs`、`test-vocabulary-image-completeness.mjs`、全部 `scripts/test-*.mjs`、`npm.cmd run validate`、`npm.cmd run check-assets`、`npm.cmd run build`、`npm.cmd run check-dist`、`git diff --check` 均通過；已以本地圖片檢視確認四張新圖內容。
- 推送：尚未推送；本次修改待建立本地提交。
- 待辦／給下一棒：若再發現 G6A 語詞圖片與詞意不符，先核對課次 JSON 的正式詞意與資產對應，再沿用同一 WebP 壓縮與圖片完整性閘門。
- 注意：原始生成 PNG 留在私有生成資料夾，未放入公開 repo；未修改官方教材與公開資料詞義。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/assets/115AG6H/lesson05/vocabulary/l05-05.webp`
- 做了什麼：更換與「淘氣」詞意不符的風吹樹木圖片，改為頑皮孩童藏玩具、周圍玩具散落的友善情境圖；輸出為 WebP，約 129 KiB，符合單張 300 KiB 與單課 4 MiB 資產規則。
- 驗證：`test-vocabulary-image-pairs.mjs`、`test-vocabulary-image-completeness.mjs`、`npm.cmd run check-assets`、`npm.cmd run build`、`npm.cmd run check-dist`、`git diff --check` 均通過；瀏覽器確認 G6A 第 5 課語詞卡仍正常載入。
- 推送：尚未推送；本次修改待建立本地提交。
- 待辦／給下一棒：若再發現語詞圖片與詞意不符，先做詞意檢查，再用相同 WebP 壓縮與圖詞完整性閘門。
- 注意：原始生成 PNG 留在私有生成資料夾，未放入公開 repo。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/src/components/PronunciationNotice.js`、`apps/mandarin/src/activities/characters.js`、`apps/mandarin/src/activities/vocabulary.js`、`apps/mandarin/src/styles/components.css`、`apps/mandarin/scripts/test-pronunciation-notice.mjs`
- 做了什麼：在生字卡與語詞解釋卡頁面下方加入多音字提醒，說明不同語境／詞語的注音可能不同，使用者應以課本與課文標示為準；兩個頁面共用同一個提醒元件與樣式。
- 驗證：`test-pronunciation-notice.mjs`、`test-module-star-coverage.mjs`、全部 `scripts/test-*.mjs`、`npm.cmd run validate`、`npm.cmd run check-assets`、`npm.cmd run build`、`npm.cmd run check-dist`、`git diff --check` 均通過；瀏覽器實際確認 G6A 第 5 課生字卡／語詞卡皆顯示提醒。
- 推送：尚未推送；本次修改待建立本地提交。
- 待辦／給下一棒：後續新增生字卡或語詞解釋卡頁面時，沿用 `PronunciationNotice`，不要各自重寫提醒文字。
- 注意：提醒是使用者校讀提示，不取代官方課本注音；未修改教材原始資料。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/data/115AG6H/lesson05.json`、`apps/mandarin/scripts/test-g6a-lesson05-lookalikes.mjs`
- 做了什麼：依私有官方教材「05形音輕鬆學（含語詞解釋）」校正 G6A 第 5 課 7 組形似字，移除「泥／叮／檸」等錯置選項，改為「擰／檸／嚀／濘」、「噪／燥／操／躁」、「庶／蔗／遮」、「賢／資／質／貿／賀」、「陶／淘」、「隱／穩」、「戴／載／截／裁／栽」；每個字補回官方例詞。
- 驗證：`test-g6a-lesson05-lookalikes.mjs`、`test-lookalike-splitting.mjs`、全部 `scripts/test-*.mjs`、`npm.cmd run validate`、`npm.cmd run check-assets`、`npm.cmd run build`、`npm.cmd run check-dist`、`git diff --check` 均通過。
- 推送：尚未推送；本次修改待建立本地提交。
- 待辦／給下一棒：其他課次若發現形似字選項疑似錯置，先對照私有官方「字形辨別」資料，再更新公開題庫並補回歸測試。
- 注意：官方原始教材仍只留私有工作區，公開 repo 只保存校正後的字與例詞。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/docs/lesson-generation-workflow.md`、`apps/mandarin/scripts/test-idiom-sentence-contexts.mjs`
- 做了什麼：全面掃描公開 G1A／G3A／G6A 課次；136 筆核准成語填句子全部是具體情境句。G1A 7 課沒有成語資料；G3A 6 課有 34 個成語、另 6 課無成語資料；G6A 12 課有 102 個成語。工作流新增成語情境句閘門，禁止泛用模板，要求每個可用成語都有核准例句；沒有成語資料的課次維持模組未開放。
- 驗證：`node scripts/test-idiom-sentence-contexts.mjs`、`npm.cmd run validate`、全部 `scripts/test-*.mjs`、`npm.cmd run check-assets`、`npm.cmd run build`、`npm.cmd run check-dist`、`git diff --check` 均通過。
- 推送：尚未推送；本次修改待建立本地提交。
- 待辦／給下一棒：後續新增成語資料需沿用此情境句閘門。
- 注意：官方原始教材仍只留私有工作區，未納入公開 repo。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/data/115AG6H/lesson01.json`～`lesson12.json`、`apps/mandarin/scripts/test-idiom-sentence-contexts.mjs`
- 做了什麼：修正「成語填句子」原本使用「遇到生活中的相關情況時，可以用……來形容」的泛用題幹，G6A 112 筆核准例句全部改為具體生活情境句；學生需把候選成語拖入句中，使語句與語意完整。G3A 原有具體例句保留不動。
- 驗證：`npm.cmd run validate`、全部 `scripts/test-*.mjs`、`npm.cmd run check-assets`、`npm.cmd run build`、`npm.cmd run check-dist`、`git diff --check` 均通過；新增測試確認 136 筆核准成語例句皆不含泛用題幹且包含足夠語境。
- 推送：尚未推送；本次修改待建立本地提交。
- 待辦／給下一棒：後續新增成語填句子資料，需提供完整情境句，不可使用泛用模板。
- 注意：未修改官方原始教材，只整理公開教材資料中的教師自撰例句。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/assets/115AG6H/lesson05/idioms/01_心浮氣躁.webp`
- 做了什麼：更換與「心浮氣躁」詞意不符的冥想圖片，改為課桌前皺眉、敲筆、翻動作業紙的焦躁情境圖；輸出為 512×512 WebP，約 46 KiB。
- 驗證：`test-vocabulary-image-pairs.mjs`、`test-vocabulary-image-completeness.mjs`、`npm.cmd run check-assets`、`npm.cmd run build`、`npm.cmd run check-dist`、`git diff --check` 均通過；已用瀏覽器確認成語卡載入新圖。
- 推送：尚未推送；本次修改待建立本地提交。
- 待辦／給下一棒：若再發現成語圖詞不符，沿用詞意檢視、WebP 壓縮、圖詞配對測試流程。
- 注意：生成來源與原始 PNG 留在私有工作區，不放入公開 repo。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/src/activities/rhetoric.js`、`apps/mandarin/src/components/ChoiceQuiz.js`、`apps/mandarin/src/styles/components.css`、`apps/mandarin/public/data/115AG6H/lesson01.json`～`lesson12.json`、`apps/mandarin/scripts/test-rhetoric-highlights.mjs`
- 做了什麼：修辭資料支援官方解析使用的 `﹁﹂`，並相容既有 `「」`／`『』` 標記；題幹只將標記內關鍵字套用修辭模組色彩，畫面與朗讀／全部朗讀共用純文字，不會讀出標記。G6A 第一至十二課例句依官方解析補上關鍵字標記。
- 驗證：`npm.cmd run validate`、全部 `scripts/test-*.mjs`、`npm.cmd run check-assets`、`npm.cmd run build`、`npm.cmd run check-dist`、`git diff --check` 均通過；瀏覽器實際確認第六課「化解／營造」變色。
- 推送：尚未推送；本次修改待建立本地提交。
- 待辦／給下一棒：後續匯入官方修辭解析時，沿用 `﹁關鍵字﹂` 標記即可自動變色。
- 注意：官方原始文件仍只留私有工作區，公開 repo 僅保存已整理的例句與標記。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/data/115AG6H/lesson02.json`
- 做了什麼：修正第二課修辭「頂真」例句，完整顯示「他沒有理我。我走到他身邊，又說了一遍。」避免題幹截斷前後句的語意。
- 驗證：`npm.cmd run validate`、`npm.cmd run check-assets`、全部 `scripts/test-*.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；確認答案仍為「頂真」，解釋與其他課次未改動。
- 推送：尚未推送；本次修改已建立本地提交（以 `git log -1` 為準）。
- 待辦／給下一棒：若再調整修辭例句，回到官方來源／教師確認資料核對完整語境。
- 注意：只修改 G6A 第二課第一題例句，未修改圖片、其他題目或其他課次資料。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/scripts/fill_vocabulary_images.py`、`apps/mandarin/scripts/test-vocabulary-image-completeness.mjs`、`apps/mandarin/docs/lesson-generation-workflow.md`、`apps/mandarin/public/data/115AG3H/`、`apps/mandarin/public/data/115AG6H/`、`apps/mandarin/public/assets/115AG3H/`、`apps/mandarin/public/assets/115AG6H/`
- 做了什麼：全面盤點 G3A／G6A 語詞解釋卡缺圖；156 個缺圖位置中，58 張沿用私有教材中詞名完全對應的舊圖，98 張依詞意生成兒童友善插圖；全部壓縮為 WebP 並回寫公開資料。補圖工具只接受完整詞名元件，不會把多詞合成預覽圖誤配給單一語詞；新增 G3A／G6A 語詞圖片完整性回歸測試與工作流說明。
- 驗證：`npm.cmd run validate`、`npm.cmd run check-assets`、全部 `scripts/test-*.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；共 313 個 G3A／G6A 語詞，全部有有效圖片；公開資產 520 張 WebP／AVIF、約 39.94 MiB，單張 ≤300 KiB、單課 ≤4 MiB。
- 推送：尚未推送；本次修改已建立本地提交 `223e7f5`。
- 待辦／給下一棒：若後續新增語詞圖片，使用 `fill_vocabulary_images.py` 搭配私有 manifest，完成後再跑圖片完整性測試與容量閘門。
- 注意：生成來源、原始 PNG、官方教材與私有 manifest 不放入公開 repo；本次開工前 `git pull --rebase origin main` 因 GitHub Schannel 憑證錯誤 `SEC_E_NO_CREDENTIALS` 未成功，未強行改動遠端。

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

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/data/course-index.json`、`apps/mandarin/scripts/generate_lessons.py`
- 做了什麼：首頁課本名稱由「翰林一年級上」簡化為「翰林一上」；課本索引依年級由小到大排列為一、三、六年級；批次產生器同步固定 G1A 顯示名稱與後續索引排序。
- 驗證：`npm.cmd run validate`、年級排序／名稱檢查、`npm.cmd run build`、`npm.cmd run check-dist` 均通過。
- 推送：尚未推送；本次修改待建立本地提交。
- 待辦／給下一棒：新增年級時沿用 `update_course_index()` 的數字排序。
- 注意：未修改課程內容、圖片或既有課次資料。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/scripts/generate_lessons.py`、`apps/mandarin/docs/lesson-generation-workflow.md`、`apps/mandarin/public/data/115AG3H/`、`apps/mandarin/public/assets/115AG3H/`、`apps/mandarin/public/data/115AG1H/`、`apps/mandarin/public/assets/115AG1H/`、`apps/mandarin/public/data/course-index.json`
- 做了什麼：建立可重跑的教材網站工作流與 Python 批次產生器；完成 G3A 第 7～12 課，G3A 語詞優先採用已審核的 low-g3-v2 語詞／圖片 manifest，避免圖詞錯配；修正課程索引的增量合併，不會因批次只產生部分課次而刪除既有課次；完成 G1A 第 1～7 課，生字造詞依私有 Excel 常用度取前三項，語詞圖片轉為 WebP；加入外部進度檔與 `--resume` 接續規則、筆順連結與段落 fallback。
- 驗證：`python -m py_compile apps/mandarin/scripts/generate_lessons.py`、G3A／G1A dry-run 與實際批次產出、`npm.cmd run validate`、全部 `scripts/test-*.mjs`、`npm.cmd run check-assets`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；公開資料共 31 課，資產 25.14 MiB，單張 WebP／AVIF 均未超過 300 KiB。
- 推送：尚未推送；本次修改已建立本地提交 `5e93d58`、`b4e15cc`。
- 待辦／給下一棒：G6A 目前維持已審核的 1～12 課公開基準；若日後重建，先在私有工作區完成官方來源台帳／manifest，再接入相同的標準化 JSON、圖片容量與驗證閘門。額度中斷時使用私有進度檔加 `--resume`。
- 注意：不把官方原始教材、第三方 Excel、完整課文或進度檔放入公開 repo；語詞圖片只使用明確核對的圖詞 manifest，不以相似檔名猜圖。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/src/`、`apps/mandarin/public/data/115AG6H/`、`apps/mandarin/public/assets/115AG6H/`、`apps/mandarin/scripts/test-module-star-coverage.mjs`、`apps/mandarin/scripts/test-star-scoring.mjs`
- 做了什麼：依教師回饋完成 G6A 第 1～12 課修正；生字卡造詞改取 Excel 常見度前三項，補回可核對的官方語詞圖並轉 WebP；一字多義題幹改為不揭示答案；修正完成狀態覆蓋星星的累計問題；段落資料支援 `paragraph_no` 並在無有效段號時只顯示文本摘要；依官方「10修辭輕鬆學」逐課整理 3 題修辭；依「15閱讀理解提問」官方答案鍵補入每課 4 題聆聽答案，並修正選項解析；配對改用配對資料辨識，支援同名句型的不同解釋。
- 驗證：G6A 第 1～12 課星星覆蓋測試、`npm.cmd run validate`、`npm.cmd run check-assets`、全部 `scripts/test-*.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；共 269 張 WebP/AVIF、`public/assets` 約 18.69 MiB；G6A 圖片約 7.76 MiB，單課最高約 1.40 MiB，均低於單張 300 KiB／單課 4 MiB 閘門；星星回歸測試確認完成模組後仍保留既有星數，內容抽查確認造詞最多 3 個、修辭每課 3 題、聆聽答案均已就緒且無答案揭示／undefined 段落字串。
- 推送：已建立本地提交；尚未推送。
- 待辦／給下一棒：若後續更換修辭例句，仍應回到官方 PDF 逐頁核對；語詞圖只可使用明確詞名對應的素材，不以相似檔名猜圖。
- 注意：不把第三方 Excel 或官方原始教材放入公開 repo；網站只保留壓縮後 WebP/AVIF，維持單張約 150～300 KB、單課 4 MB 內規範。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/data/115AG6H/`、`apps/mandarin/public/assets/115AG6H/`、`apps/mandarin/public/data/course-index.json`
- 做了什麼：依翰林六上官方教材資料完成 G6A 第 1～12 課網站資料；包含生字、語詞、成語、句型、段落摘要、閱讀提問、字義分析、形似字、多音字與各課雄筆順連結。可對應的官方語詞／成語圖已轉為 WebP，未將原始教材或第三方試算表放入公開 repo。
- 驗證：`npm.cmd run validate`、`npm.cmd run check-assets`、全部 `scripts/test-*.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；G6A 圖片共 121 張、約 6.60 MiB，單課均低於 4 MiB；瀏覽器已實際開啟 G6A 第 1 課與第 12 課，確認語詞圖片、生字頁與課次路由。
- 推送：尚未推送；施工標記 `fc7e0db` 已推送，教材完成內容待確認後再推送。
- 待辦／給下一棒：修辭、應用任務、聆聽答案與跨課複習仍依官方資料整理狀態保留為待補；若補齊，沿用本批資料結構與 WebP 容量規範。
- 注意：網站資料使用 `115AG6H`（翰林六上）代碼；保留 `115HG6A` 作為 Reading-Tool 內部來源 ID，不要混用。

## 2026-09-26｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/data/115AG3H/lesson06.json`、`apps/mandarin/public/assets/115AG3H/lesson06/`、`apps/mandarin/public/data/course-index.json`
- 做了什麼：依官方教材生成翰林三上第 6 課「小鉛筆大學問」完整教材資料，加入 14 個生字、12 個語詞、6 個成語、句型、課文地圖、閱讀理解、聆聽、修辭、形似字與一字多音；補齊語詞／成語 WebP 圖片及雄筆順連結。官方形似字圖卡中的「削」已正確歸入一字多音，不重複放入形似字題。
- 驗證：`npm.cmd run validate`、`npm.cmd run check-assets`、全部 `scripts/test-*.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；第六課 18 張圖片合計約 1.03 MiB，單張均低於 300 KB；瀏覽器已檢查首頁、生字、語詞、成語、句型、形似字與一字多音頁面。
- 推送：尚未推送；本次結果已建立本地提交
- 待辦／給下一棒：若要公開到 GitHub，推送本次提交；後續課次沿用同一資料結構、WebP 壓縮與語詞圖卡規格。
- 注意：沿用既有第五課規格；不直接改寫共用元件，不把官方原始教材或第三方試算表放入公開 repo；本課未加入官方課文全文。

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/src/components/VocabularyCard.js`、`apps/mandarin/scripts/test-speak-button-coverage.mjs`
- 做了什麼：移除語詞解釋卡中與芫荽注音體重複的下方注音列；語詞本身保留芫荽注音體，切換成解釋時維持一般介面字型
- 驗證：`node scripts/test-speak-button-coverage.mjs`、`npm.cmd run validate`、`npm.cmd run check-assets`、全部 `scripts/test-*.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；瀏覽器確認下方注音列數量為 0、語詞字型載入成功，切換解釋後恢復一般字型，console 無錯誤
- 推送：完成 commit 後推送至 `origin/codex/mandarin-115g3a-lessons`；`origin/main` 尚未更新
- 待辦／給下一棒：後續新增卡片變體時，保持注音只由芫荽注音體呈現，避免重複列出
- 注意：不修改語詞資料、圖片、卡片點選切換與朗讀功能

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/src/activities/characters.js`、`apps/mandarin/scripts/test-character-examples-limit.mjs`
- 做了什麼：生字卡造詞依教材資料現有的常用順序取前 3 個顯示；完整造詞資料保留不刪除、不改順序
- 驗證：`node scripts/test-character-examples-limit.mjs`、`npm.cmd run validate`、`npm.cmd run check-assets`、全部 `scripts/test-*.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；瀏覽器確認第五課每字最多 3 個造詞且無水平溢出
- 推送：完成 commit 後推送至 `origin/codex/mandarin-115g3a-lessons`；`origin/main` 尚未更新
- 待辦／給下一棒：後續若要重新排序常用度，應先更新教材資料的 examples 順序，再由顯示層取前 3 個
- 注意：不改寫官方造詞資料順序與內容，只限制生字卡顯示數量

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/src/components/CharacterCard.js`、`apps/mandarin/src/styles/components.css`、`apps/mandarin/scripts/test-speak-button-coverage.mjs`
- 做了什麼：移除已由芫荽注音體大字呈現的重複注音列；造詞改用芫荽注音體並放大至 32px；筆順與解釋按鈕縮小文字與內距，但保留 44px 觸控高度
- 驗證：`npm.cmd run validate`、`npm.cmd run check-assets`、全部 `scripts/test-*.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；瀏覽器確認注音列數量為 0、造詞 computed font-family 為 `Bpmf Iansui`、字體 32px、按鈕文字 18px、無水平溢出，字型載入成功，console 無錯誤
- 推送：完成 commit 後推送至 `origin/codex/mandarin-115g3a-lessons`；`origin/main` 尚未更新
- 待辦／給下一棒：後續若調整芫荽注音體大小，需同步檢查多字造詞在小螢幕是否換行合理
- 注意：一般說明文字與點開後的解釋維持原字型；不修改字型檔與授權文件

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/fonts/`、`apps/mandarin/src/styles/tokens.css`、`apps/mandarin/src/styles/components.css`
- 做了什麼：加入使用者提供且附有 OFL／Apache 授權文件的 `BpmfIansui-Regular.ttf`；生字卡大字與語詞卡的字詞套用芫荽注音體，翻成解釋時恢復一般介面字型；字型移至 `public/fonts`，不納入圖片資產的單課 4 MiB 計算
- 驗證：`npm.cmd run validate`、`npm.cmd run check-assets`、全部 `scripts/test-*.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；瀏覽器確認 `document.fonts.check('96px "Bpmf Iansui"')` 為 true，生字卡 computed font-family 正確，語詞卡顯示解釋時恢復一般字型，console 無錯誤；字型檔約 6.25 MiB，圖片資產總量約 9.89 MiB
- 推送：完成 commit 後推送至 `origin/codex/mandarin-115g3a-lessons`；`origin/main` 尚未更新
- 待辦／給下一棒：若未來要降低首屏下載量，可再做字型子集化或轉成 WOFF2，但須重新確認注音與教材生字覆蓋率
- 注意：一般說明文字維持原字型；網站散布原始字型與授權文件，不修改字型檔

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/data/115AG3H/lesson05.json`、`apps/mandarin/scripts/test-vocabulary-image-pairs.mjs`
- 做了什麼：修正第五課「夾子」與「遮雨」圖片路徑對調；新增回歸測試，固定確認夾子使用夾子圖、遮雨使用雨傘圖
- 驗證：`node scripts/test-vocabulary-image-pairs.mjs`、`npm.cmd run validate`、`npm.cmd run check-assets`、全部 `scripts/test-*.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；瀏覽器逐組確認兩張卡片實際載入正確圖片，console 無錯誤
- 推送：完成 commit 後推送至 `origin/codex/mandarin-115g3a-lessons`；`origin/main` 尚未更新
- 待辦／給下一棒：後續新增語詞圖片時，需同時檢查資料中的 image 路徑與畫面上的語詞文字
- 注意：只修正資料引用，不更動圖片內容與卡片互動規格

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/assets/115AG3H/lesson05/vocabulary/l05-05.webp`
- 做了什麼：檢查第五課 14 張語詞圖，確認只有「綿」錯配；將跳繩圖替換為梨花山路上綿綿不斷的雨景，對應「連續不斷」的詞義。原始生成圖保留於 Codex 生成資產目錄，網站只放壓縮後 WebP
- 驗證：`npm.cmd run validate`、`npm.cmd run check-assets`、全部 `scripts/test-*.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；瀏覽器確認第五課語詞頁載入 `l05-05.webp`，圖片 naturalWidth=1254，console 無錯誤；新圖約 256 KiB，總資產約 9.89 MiB
- 推送：完成 commit 後推送至 `origin/codex/mandarin-115g3a-lessons`；`origin/main` 尚未更新
- 待辦／給下一棒：後續新增語詞圖片時，先逐張以詞義與例句檢查語意，不要只依檔名或生成提示判斷
- 注意：不修改語詞內容與既有資料結構；不把 PNG 原圖放入公開網站

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/src/activities/sentencePractice.js`、`apps/mandarin/scripts/test-sentence-chunking.mjs`
- 做了什麼：句型練習改用固定詞組保護、瀏覽器中文斷詞、助詞／介詞合併與標點歸併；不再以每兩字硬切，並支援教材以 `sentence_patterns[].example_parts` 提供人工確認詞塊。同步檢查第 1～4 課 55 個例句，修正「寫作業」「暖暖的」「進門的客人」「今天沒有遲到」等詞組
- 驗證：新增 `node scripts/test-sentence-chunking.mjs`；第 1～4 課 55 個例句重新串接全部成功，最大 7 個詞塊且無孤立助詞；全部 `scripts/test-*.mjs`、第 5 課星星覆蓋測試、`npm.cmd run validate`、`npm.cmd run check-assets`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；瀏覽器確認詞組完整呈現，console 無錯誤
- 推送：完成 commit 後推送至 `origin/codex/mandarin-115g3a-lessons`；`origin/main` 尚未更新
- 待辦／給下一棒：新增特殊句型時，可在該句型的 `example_parts` 放入人工確認且可重新串回原句的詞塊
- 注意：保留原句內容與亂數呈現，只調整學生作答時的詞塊邊界

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/data/115AG3H/lesson05.json`、`apps/mandarin/public/assets/115AG3H/lesson05/`、`apps/mandarin/public/data/course-index.json`
- 做了什麼：新增翰林三上第 5 課「為梨花撐傘」完整課次資料，包含 15 個生字、14 個目標語詞、5 個成語與插圖、句型、修辭、段落大意、閱讀理解、一字多義、一字多音、形似字、聆聽題、跨課複習與挑戰題；加入每課筆順直連，並把 14 張語詞圖與 5 張成語圖壓縮為 WebP
- 驗證：`npm.cmd run validate`、`npm.cmd run check-assets`、全部 `scripts/test-*.mjs`、第 5 課 `MANDARIN_TEST_LESSON=../public/data/115AG3H/lesson05.json node scripts/test-module-star-coverage.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；瀏覽器確認課次首頁、語詞圖片與點選解釋、成語拖拉、形似字拆題、生字造詞與筆順連結，無水平溢出與 console 錯誤
- 推送：已推送至 `origin/codex/mandarin-115g3a-lessons`（完成 commit 後更新）；`origin/main` 尚未更新
- 待辦／給下一棒：後續可接續 G3A 第 6 課；本課圖片 19 張、約 2.05 MiB，維持單張 300 KiB 與單課 4 MiB 容量閘門
- 注意：不修改課文全文，不把官方原始教材、出版社補充原檔或第三方 xlsx 放入公開 repo；網站資產只保留壓縮 WebP

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/data/115AG3H/lesson04.json`、`public/assets/115AG3H/lesson04/`、`course-index.json`
- 做了什麼：新增翰林三上第 4 課「水滾了」課次資料，包含 18 個生字、10 個目標語詞、5 個成語、句型、段落大意、修辭、形似字、一字多義、一字多音、聆聽題與挑戰題；加入 10 張語詞 WebP、5 張成語 WebP，並加入雄筆順直接連結
- 驗證：`npm.cmd run validate`、`npm.cmd run check-assets`、全部 `scripts/test-*.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；本機瀏覽器確認課次首頁、生字頁、語詞圖片與點選解釋、成語拖放題可開啟，頁面錯誤紀錄為空
- 推送：尚未推送；開工前 `git pull --rebase origin main` 因 GitHub 憑證錯誤 `SEC_E_NO_CREDENTIALS` 受阻，本次不強行覆蓋或推送
- 待辦／給下一棒：提交本次變更後，確認 GitHub 憑證可用再推送；後續課次沿用本課資料結構與壓縮資產規範
- 注意：本次不修改課文全文，不把官方原始教材、出版社補充原檔或 xlsx 放入公開 repo；課 4 圖片只保留壓縮 WebP，總計約 1.37 MiB

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/data/115AG3H/lesson01.json`、`lesson02.json` 與兩課語詞圖片資產
- 做了什麼：第一課 13 張、第二課 15 張語詞補上兒童友善教學插圖；資料引用同步指向 WebP；沿用第三課圖片固定、點卡片切換詞義、朗讀同步的語詞卡規格
- 驗證：`npm.cmd run validate`、`npm.cmd run check-assets`、全部 `scripts/test-*.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；第一、二課 28 張圖片瀏覽器實際載入；第三課互動回歸確認通過；總資產 6.30 MiB，第一課 2.52 MiB、第二課 1.93 MiB、第三課 1.84 MiB
- 推送：尚未推送
- 待辦／給下一棒：後續課次補圖沿用 `l課次-序號.webp` 命名與圖片容量閘門；每張維持 300 KiB 內、每課約 4 MiB 內
- 注意：原始 PNG 僅留在 Codex 生成目錄，網站與 repo 只保留 WebP；圖片為教學輔助，不在圖內加入文字

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/` 語詞認識步驟與語詞卡片
- 做了什麼：依使用者確認改為可點選語詞卡；圖片固定不變，點選後文字替換為對應解釋，再點一次可回到語詞；注音、朗讀內容與操作說明同步切換
- 驗證：`npm.cmd run validate`、`npm.cmd run check-assets`、全部 `scripts/test-*.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；第三課瀏覽器確認圖片不變、詞義可切換、朗讀內容同步、無水平溢出且無警告
- 推送：尚未推送
- 待辦／給下一棒：後續課次沿用此語詞卡互動與圖片資產容量閘門；若補圖，維持單張 150～300 KB、每課約 4 MB 內
- 注意：點選喇叭只朗讀，不會觸發卡片切換；語詞解釋與例句仍保留在後續配對與選詞活動

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/` 語詞認識步驟與語詞卡片
- 做了什麼：依使用者確認取消卡片翻面，改為固定顯示圖片、語詞、注音與朗讀按鈕；同步更新操作說明
- 驗證：`npm.cmd run validate`、`npm.cmd run check-assets`、全部 `scripts/test-*.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 均通過；第三課瀏覽器確認 5 張卡片都有圖片、每張 1 個朗讀鈕、無翻面互動、無水平溢出且無警告
- 推送：尚未推送
- 待辦／給下一棒：後續課次沿用固定式語詞卡與圖片資產容量閘門；若補圖，維持單張 150～300 KB、每課約 4 MB 內
- 注意：語詞解釋保留在後續配對與選詞活動；圖片容量閘門維持有效

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/` 圖片資產與建置容量檢查
- 做了什麼：新增 WebP 壓縮腳本與 `check-assets` 容量閘門；第三課 20 張 PNG 轉成 WebP，資料路徑同步更新，原圖備份到 repo 外的 `_archive/mandarin-image-sources/115AG3H/lesson03/`
- 驗證：第三課圖片由 35.79 MiB 降至 1.84 MiB，全站 `public/assets` 約 3.01 MiB；`npm.cmd run validate`、全套 `scripts/test-*.mjs`、`npm.cmd run build`、`npm.cmd run check-dist`、`npm.cmd run check-assets` 通過；瀏覽器確認第三課語詞與成語 WebP 正常載入
- 推送：尚未推送
- 待辦／給下一棒：後續新增圖片先執行 `npm run check-assets`；若需發布，再由使用者確認後推送目前本地 commit
- 注意：閘門為單張 300 KiB、單課 4 MiB、全站 600 MiB 警告／700 MiB 失敗；本次 `git pull --rebase origin main` 因 GitHub 憑證 `SEC_E_NO_CREDENTIALS` 失敗，當時本地追蹤資訊顯示分支 ahead 15、沒有落後

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/src/components/TaskBanner.js` 所有組別進度文字
- 做了什麼：依使用者回饋移除所有「第 X 組／共 Y 組」，不論單組或多組；保留步驟進度
- 驗證：`npm.cmd run validate`、`node scripts/test-extension-links.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 通過；瀏覽器確認多組語詞頁僅保留「第 1 步／共 3 步」，修辭頁不顯示組別資訊，console 無錯誤或警告
- 推送：尚未推送
- 待辦／給下一棒：如需發布，再由使用者確認後推送目前本地 commit
- 注意：不影響題目本身的「第 X／共 Y 題」進度

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/src/components/TaskBanner.js` 單組進度文字
- 做了什麼：移除只有一組時的「第 1 組／共 1 組」，保留多組練習的組別進度
- 驗證：`npm.cmd run validate`、`node scripts/test-extension-links.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 通過；瀏覽器修辭頁確認單組提示已隱藏，語詞頁確認多組提示仍保留，頁面無橫向溢出，console 無錯誤或警告
- 推送：尚未推送
- 待辦／給下一棒：如需發布，再由使用者確認後推送目前本地 commit
- 注意：不刪除真正有多組時的進度資訊

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/public/data/115AG3H/lesson03.json` 第三課詞彙圖片
- 做了什麼：修正「喊」與「文具」兩筆詞彙圖片對調問題
- 驗證：`npm.cmd run validate`、`node scripts/test-extension-links.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 通過；瀏覽器第三課語詞頁確認「喊」使用呼喊孩子圖片、「文具」使用文具桌面圖片，console 無錯誤
- 推送：尚未推送
- 待辦／給下一棒：如需發布，再由使用者確認後推送目前本地 commit
- 注意：只調整圖片欄位，不重製或刪除既有圖片資產

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/` 生字卡片視覺標籤
- 做了什麼：依使用者回饋移除「習寫字」、「認讀字（只要會認）」等卡片上方標籤，保留資料分類供功能使用
- 驗證：`npm.cmd run validate`、`node scripts/test-extension-links.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 通過；瀏覽器第三課確認 17 張生字卡片均無分類標籤，版面無橫向溢出，console 無錯誤或警告
- 推送：尚未推送
- 待辦／給下一棒：如需發布，再由使用者確認後推送目前本地 commit
- 注意：不修改教材 JSON 的 `type` 分類，也不影響其他模組的待審或策略標籤

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/` 筆順直連卡片文字
- 做了什麼：依使用者回饋簡化筆順直連顯示，主標題統一為「筆順練習(雄筆順)」，隱藏重複的提供者、版本與課次說明
- 驗證：`npm.cmd run validate`、`node scripts/test-extension-links.mjs`、`npm.cmd run build`、`npm.cmd run check-dist` 通過；瀏覽器第三課頁面確認主標、版面無橫向溢出，console 無錯誤或警告
- 推送：尚未推送
- 待辦／給下一棒：如需發布，再由使用者確認後推送目前本地 commit
- 注意：其他延伸資源仍保留提供者與說明文字

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/` G3A 翰林第 1～3 課筆順外連
- 做了什麼：依固定網址規律 `html5_stroke_parts.html?by=gsyan&words=`，將三課生字依課本順序串接並 URL 編碼；三課「本課筆順教材」均改為直接開啟該課生字，備註改為顯示已帶入的生字數量
- 驗證：`npm run validate`、`node scripts/test-extension-links.mjs`、`npm run build`、`npm run check-dist` 通過；瀏覽器實際開啟第 1～3 課直連，確認頁面標題為「雄-筆順練習」且輸入區帶入各課生字；本地第三課 href 已更新
- 推送：尚未推送
- 待辦／給下一棒：後續課次可沿用相同規律，由該課 `characters[].char` 依序串成 `words` 參數
- 注意：未修改官方原始教材與既有造詞資料；保留 `Chinese/` 舊站與內部官方原始檔

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/` G3A 翰林第 1～3 課生字造詞資料與「認識生字」筆順教材入口
- 做了什麼：依使用者提供的《115上114下學期生字表_大腦與語言實驗室_20260723.xlsx》翰林／115上／三年級第 1～3 課資料，補充每個生字最多 5 個造詞並保留 `examples_source`；新增每課筆順練習外連，放在「認識生字」第一步任務提示下方，以折疊卡顯示版本、年級與課別選取方式；延伸連結卡新增 `note` 顯示
- 驗證：`npm run validate`、全部 `scripts/test-*.mjs`、`npm run build`、`npm run check-dist` 通過；瀏覽器確認第三課造詞與筆順入口、無橫向溢位、無 console error／warning
- 推送：尚未推送
- 待辦／給下一棒：後續課次可沿用 `characters[].examples` 與 `examples_source`；各課筆順入口沿用同一選單，依課次更新 note
- 注意：未修改原始 Excel；保留 `Chinese/` 舊站與內部官方原始檔

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/` G3A 第三課「提早五分鐘」資料、圖片資產、課程索引與模組覆蓋測試
- 做了什麼：依官方生字表／教育百科字庫建立 15 個習寫字與 2 個認讀字；接入 14 個語詞及 AI 圖片、6 個生字衍生成語及圖片、句型、修辭、段落重述、閱讀理解、一字多義、一字多音、形似字、聆聽與跨課複習。形似字沿用逐例詞拆題規則，避免同組例詞露出答案。
- 驗證：`npm run validate`、`npm run build`、`npm run check-dist`、全部 `scripts/test-*.mjs` 通過；另以 `MANDARIN_TEST_LESSON=../public/data/115AG3H/lesson03.json node scripts/test-module-star-coverage.mjs` 驗證第三課 11 個可開始模組；瀏覽器確認課次首頁、成語拖拉、語詞圖片、形似字、舊字新詞，無 console error／warning，當前視窗無橫向溢位
- 推送：尚未推送
- 待辦／給下一棒：若要公開到 GitHub Pages，請另行確認後再推送；應用任務仍是既有待補項目
- 注意：官方生字表採 `統票角板業本況該喊文具理此備易匆餘`；未把九份補充資料中的另一組生字混入本課。未動 `Chinese/` 舊站與內部官方原始檔

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/` 成語內嵌答案空格的語音按鈕
- 做了什麼：移除填入答案後出現在成語中間的額外朗讀按鈕；保留題目朗讀與下方候選字朗讀，並補上內嵌空格的答錯揭曉防呆
- 驗證：`npm run validate`、`npm run build`、`npm run check-dist`、全部 `scripts/test-*.mjs` 通過；瀏覽器確認「原封不動」填入「原」後成語中間沒有多餘喇叭，無 console/page error
- 推送：尚未推送（等待明確推送指示）
- 待辦／給下一棒：後續若新增內嵌答案空格，不要在 `inlineSlotWrap` 放置 slot 專用朗讀鈕
- 注意：不改官方教材內容；只調整內嵌答案空格的 UI 呈現

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/`「生字變成語」拖拉作答互動
- 做了什麼：
  - `DragToSlot` 新增直接用滑鼠／觸控拖曳候選答案到空格的 Pointer Events 互動
  - 第 2 課「生字變成語」第一關把答案空格嵌在成語本身（如「得過＿過」），不再在下方另放獨立答案框；兩關都開啟拖拉模式，空格拖曳經過時會高亮
  - 保留點選、鍵盤與觸控替代操作，新增 `test-drag-to-slot.mjs`
- 驗證：`npm run validate`、`npm run build`、`npm run check-dist`、全部 `scripts/test-*.mjs` 通過；瀏覽器實際將「且」拖入「得過＿過」並確認答對，無 console/page error
- 推送：尚未推送（等待明確推送指示）
- 待辦／給下一棒：後續需要拖拉作答的模組可傳入 `dragEnabled: true`；現有其他模組維持原本點選流程
- 注意：不改官方教材內容；只修改作答互動與樣式

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/` 形似字題目生成與第 2 課資料
- 做了什麼：
  - 形似字 activity 將每個 `example` 的逗號分隔語詞拆成獨立題目；「天使、使命」會分成「天＿」與「＿命」，不再把完整答案露在同一題
  - 使用共用 `shuffle()`，選項維持亂數排列
  - 新增 `test-lookalike-splitting.mjs` 回歸測試
- 驗證：`npm run validate`、`npm run build`、`npm run check-dist`、全部 `scripts/test-*.mjs` 通過；瀏覽器第 2 課形似字路由確認「天＿」與「＿命」兩題，無 console/page error
- 推送：尚未推送（等待明確推送指示）
- 待辦／給下一棒：後續課次沿用「一個語詞一題、只挖一個目標字」規則；既有歷史成品需重新生成才會套用
- 注意：不改官方教材內容；canonical `example` 保留官方例詞，前端只改學生題面拆題

## 2026-09-25｜學校 Win｜Codex｜狀態：✅ 完成
- 範圍：`apps/mandarin/`；教材網頁各類選項題的共用洗牌規則
- 做了什麼：
  - 新增共用 Fisher–Yates `shuffle()`，ChoiceQuiz、拖曳候選詞、成語題與配對題都改用亂數排列；若結果恰好等於原順序，會再交換前兩項
  - `ReadAllButton` 改讀畫面實際順序，視覺選項與朗讀選項一致
  - 新增 `test-option-shuffle.mjs`，確認不改題庫、保留全部選項、題面不固定順序
- 驗證：`npm run validate`、`npm run build`、`npm run check-dist`、全部 `scripts/test-*.mjs` 通過；瀏覽器實際確認第 2 課「認識生字」選項不再固定正解第一
- 推送：尚未推送（等待明確推送指示）
- 待辦／給下一棒：學習單端的產生器規則另記於 sped-os repo 的 ADR-0035；後續新題目一律遵守選項亂數排列
- 注意：不改官方教材內容、不改 `Chinese/` 既有靜態頁面；題庫 canonical 順序保留，僅改學生題面呈現順序

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

## 2026-10-04（晚）
- 一上、二上 78 題轉換選擇題：CF 已審核，改 approved。
- 語音補齊：學方法選項／步驟／示範句、課程首頁入口卡、小考與錯題入口、成語意思、念讀說明。
- 成語卡說明字放大到內文字級；四上修辭 8 題補 highlight_terms；「」不再當標色記號。
- 念讀字詞：念對有稱讚＋動畫＋連對數，組末鼓勵語，稱讚後有「下一個」鈕（2.5 秒自動前進）。
- 未做：CardWalkthrough 進度字（「看過 n／N」）沒有加喇叭，屬進度資訊。

## 2026-10-04（第二版審查落地）
- 完成 A1–A6、B1、B2（讀懂課文圈關鍵詞試做）、C3、課文地圖年級用語。細節見 `apps/mandarin/docs/optimization-workflow.md` 最後一節。
- 待 CF：C2 低年級學習重點改寫草稿（`apps/mandarin/docs/review/2026-10-04-C2-low-grade-blurbs-draft.md`）。
- B2 尚未做：選段落、點證據句兩步（需每題標準關鍵詞／證據句資料）；主旨、句型、聆聽的筆記互動未動。
- 確定沒有五年級（CF 2026-10-04）。

## 2026-10-04（UX／無障礙優化）
- 完成：建議學習順序、繼續學習、上課投影模式、答對線索、axe 10 頁 0 違規。報告：`apps/mandarin/docs/review/2026-10-04-ux-a11y-audit.md`；規則已列入 `apps/mandarin/docs/optimization-workflow.md`。
- 待辦：Lighthouse、VoiceOver 實機、200% 縮放細查；教師／學生雙模式觀察兩週後再決定；形似字深化（P2）未動。
