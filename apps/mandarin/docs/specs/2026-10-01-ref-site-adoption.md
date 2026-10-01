# 參考站設計採用計畫（國語課文樂園優化設計）

日期：2026-10-01｜狀態：**設計草案，待 CF 核可，尚未實作**

參考對象：`https://sped-teacher.github.io/Teaching-Materials/mandarin/`
（「國語五上學習樂園」，康軒五上，單檔 vanilla JS）。**已取得原作者同意參考**。
本站自行實作，不複製其程式碼；若採用其獨創設計（錯題盒、收題式小考），
在對應活動頁底部標示出處，比照「注音高手」「念讀語詞」的既有做法。

本文只寫「對照兩站實際程式碼」得出的差異，不寫一般性建議。

---

## 0. 先說結論

參考站**架構比我們簡陋**（單檔 148KB、課次寫死在陣列、無 status 審核機制、
無測試、無跨冊），但在**學習迴路**上有四項我們完全沒有的設計，而且都是
特教學生最吃的那一段：

| # | 參考站有、我們沒有 | 為什麼對資源班重要 |
|---|---|---|
| A | **錯題盒**（間隔複習） | 我們的學生最大的問題是「上週會、這週忘」。我們現在答錯只給提示、當場過關，然後就消失了——沒有任何機制把它找回來 |
| B | **單課小考**（跨站隨機抽題） | 我們的每一站都是「教完就過」，學生從沒在「混在一起、沒有提示」的情境下被考過，無法預測定期評量表現 |
| C | **課文點讀整進課次首頁** | 我們有 `Chinese/Reading-Tool`，但它是**另一個 app**，學生要換網址。點讀是閱讀困難學生的入口，不該放在動線外 |
| D | **等級不只變難，還會換題型** | 我們的三段鷹架只調整選項數／題數；參考站在等級 3 才解鎖翻牌記憶遊戲，等級 1 則「答錯一次就揭曉」＝近似零錯誤學習 |

另外有一件**不是設計、是安全問題**，順便在這裡提（見 §3）。

我們該**保留不動**的既有優勢：資料驅動五冊、`status` 審核閘門
（draft/ready/approved）、Google 試算表同步、`npm run validate` 與
`scripts/test-*.mjs`、`check-contrast.mjs`、`prefers-reduced-motion`、
44px 觸控、「正確率＝第一次作答答對率」的紀錄定義。參考站這些全都沒有。

---

## 1. 參考站的設計拆解（已讀過其 `assets/app.js`）

### 1.1 三層等級表（`LEVELS`，app.js:32）

```
等級 1 大量支持：group 4、options 2、pairs 3、wrongLimit 1、hint、autoRead、orderCount 1、prefill 1
等級 2 部分支持：group 6、options 3、pairs 4、wrongLimit 2、hint
等級 3 少量支持：group 9、options 4、pairs 5、wrongLimit 2、memory（翻牌遊戲）
```

比我們的 `SCAFFOLD_LEVELS`（只有 `optionCount` / `roundSize` /
`eliminateHint`）多出四個維度：

- `wrongLimit`：答錯幾次後直接標出正解。等級 1 設 1 ＝**錯一次就看到答案**，
  不讓學生在錯誤裡反覆打轉（零錯誤學習）。
- `autoRead`：自動念題目。等級 1 預設開。
- `memory` / `orderCount`：**題型隨等級增減**，不只是同一題變難。
- `prefill`：造句時預先填好幾格。

另有「個別調整」可覆寫等級預設（`autoRead == null` 表示跟隨等級，一經
切換就固定）。這個 null 哨兵值的做法值得照抄——教師改過的項目不會被
切等級蓋掉。

### 1.2 錯題盒（app.js:1598–1700）

- Leitner 盒：`BOX_DAYS = [0, 1, 3, 7]`。答對 `box++`，排到
  `now + BOX_DAYS[box] * 1 天 - 1 小時`（**刻意提早一小時，隔天上課就會出現**）；
  答錯 `box` 歸零、立刻到期。`box` 超出陣列長度＝「學會了」，從清單移除並
  在慶祝畫面告知「🏅 有 N 題已經學會了，不會再出現」。
- **快照式儲存**：存 `innerHTML` ＋ `options` ＋ `say` ＋ `ask`，還原時重新
  把 `[data-say]` 接回朗讀。好處是錯題不依賴原模組還在不在、資料有沒有改版。
- 上限 300 題，超過砍最舊。
- 每次只做一批（`max(5, group + 2)` 題），不讓學生面對一整牆錯題。

### 1.3 造句批改回饋環（app.js:1621, 1656）

教師在設定頁對學生造的句子打 ✗ → `made[].mark = 'redo'` → 學生**下次進錯題
複習時，先被要求用同一個句型重寫**，寫完才進選擇題。`skip` 欄位記當天日期，
可當天跳過不卡住。

這是全站唯一的「教師→學生」回饋通道，我們完全沒有對應物。

### 1.4 單課小考（app.js:1707–1780）

技術上最漂亮的一段：**不另建題庫**。用全域旗標 `CAPTURE`（陣列）讓各站的
`runQuiz` 在開頭就 `return`，只把題目物件推進陣列——跑一次所有站的所有步驟
就得到整課題庫，`CAPTURE_ASK` 順便記下「這題原本在哪一步」。

- 去重：同 `答案 + 題目朗讀` 只留一題。
- 抽題：各站 round-robin 抽，**盡量每站都有**，題數依等級 8／12／15。
- 考試模式強制 `hint: false, wrongLimit: 1`。
- 考完顯示總分 ＋ **各站答對率表**，答錯的自動進錯題盒，並給
  「🔁 馬上複習答錯的題目」按鈕。
- 成績存 `progress[lid].tests`（留最近 20 筆），教師設定頁可看。

### 1.5 課文點讀（app.js:2069–2155）

- **字／詞／句三種點讀粒度共用同一份 DOM**：建 DOM 時同時把每個
  `<span class="rc">` 登記進 `units.char` / `units.word` / `units.sent`，
  切模式只是換查表對象。
- 資料格式 `tok = [文字, 注音, 朗讀用字?]`，第三格可覆寫朗讀
  （例：連接詞「和」念 ㄏㄢˋ 時餵「汗」給語音合成）。這正好對上我們
  memory 裡「讀音以教師裁定優先」那條。
- 「念全文」逐句高亮 ＋ `scrollIntoView`，可中途停止。
- 標點不換行處理：句末標點與下引號黏前字、上引號黏後字（`nw-grp`）。
  這是中文排版細節，我們的 Reading-Tool 可以比對一下。

### 1.6 朗讀挑戰（app.js:2158–2330）

瀏覽器內建語音辨識 → **無聲調讀音比對，同音字算對** → 標出沒念到的字 →
90／70／40 分對應 3／2／1 星，每段取最高分。

與我們 `docs/specs/2026-09-30-speaking-practice.md`（念讀語詞，源自雄老師
HTML5 FUN Speaking）**判準完全一致**（無聲調比對）。差別是參考站做在
**課文段落**層級、我們草案做在**語詞**層級。建議兩者合併成一個模組的兩個
難度層，不要做成兩站。

### 1.7 其他可直接抄的小設計

- **教師設定門是乘法題**（`a × b`，a∈12–19、b∈6–9），擋學生亂進。我們的
  `utils/teacherGate.js` 要比對一下強度。
- `balanced()`：15 個、每組最多 6 → 5／5／5，**不留只剩一兩個的孤兒組**。
  我們的 `utils/chunk.js` 用 min/max 區間，結果可能出現 6／6／3，要修。
- 「核心活動依序解鎖」是**開關**（`sequential`），預設關。
- 紀錄表明文寫「獨立答對＝沒用提示、第一次就答對的比例，可作為 IEP 觀察
  參考」——和我們 `utils/records.js` 的定義一致，可互相引用。

---

## 2. 我們的缺口對照（檔案層級）

| 缺口 | 現況檔案 | 說明 |
|---|---|---|
| 錯題盒 | **不存在** | `src/activities/review.js` 是「舊字新詞」（跨課複習前面課次的生字語詞），不是錯題重練。`src/pages/ReviewPage.js` 是大補帖**待審頁**，名字容易誤會 |
| 單課小考 | **不存在** | 需要 `ChoiceQuiz` / `engine.js` 支援「只收題、不渲染」模式 |
| 點讀在動線內 | `Chinese/Reading-Tool`（另一個 app） | 課次首頁沒有入口 |
| 朗讀評分 | 草案 `2026-09-30-speaking-practice.md`（未實作） | |
| 教師→學生回饋 | **不存在** | `sentencePractice.js` 沒有批改／重寫機制；`TeacherPage.js` 只有紀錄與同步 |
| 等級換題型 | `utils/deviceSettings.js` 僅三個參數 | |

---

## 3. 順帶發現的安全／版權問題（建議列為最優先）

`Chinese/Reading-Tool/access-config.js` 的密碼門只存密碼的 **SHA-256 雜湊**，
`access-gate.js` 比對後才顯示 UI——但**課文全文是明碼 JSON，直接放在公開
GitHub Pages 上**。實測：

```
curl -o /dev/null -w "%{http_code} %{size_download}" \
  https://teacherhsu.github.io/Teaching-Materials/Chinese/Reading-Tool/lessons/115HG2A01.json
→ 200 10036
```

任何人不輸入密碼、直接開這個網址就拿到整篇課文。這和
`sped-os` ADR-0034 的「課文全文不放公開 repo」牴觸。

參考站的做法是對的：課文全文以 **AES-GCM 加密**存成 `data/reading.enc.js`，
密碼走 **PBKDF2-SHA256** 導出金鑰，解開後把 raw key 存 localStorage
（下次免輸入），教師設定頁可「鎖上」（刪 key ＋ 清掉記憶體裡的課文）。
密碼不對就只是解密失敗，伺服器上永遠只有密文。

→ 建議把這一項排在所有教學功能前面。做法見 §4 的 P0-C。

---

## 4. 優化設計提案（依優先序）

### P0-C　課文全文真加密 ＋ 點讀併回課次動線

1. 新增 `tools/encrypt_readings.py`：吃 `Chinese/Reading-Tool/lessons/*.json`，
   輸出 `public/data/readings.enc.json`（`{salt, iv, iter, lessons[], data}`），
   明碼課文留在 `~/mandarin-work/`，**不進 repo**。
2. 新增 `src/utils/classroomKey.js`：`unlockWithPassword` / `unlockFromStore` /
   `lock`，用 `crypto.subtle`（PBKDF2 → AES-GCM）。非 https/localhost 時
   `crypto.subtle` 不存在，要有明確的降級訊息。
3. 新增 `src/pages/ReaderPage.js`：字／詞／句三粒度點讀 ＋ 念全文逐句高亮，
   資料格式沿用 `[文字, 注音, 朗讀用字?]`，第三格接 `src/data/speech-overrides.js`。
4. `LessonDashboard.js` 加「📖 課文點讀」入口（未解鎖時顯示鎖頭）。
5. 舊 `Chinese/Reading-Tool` 的 `lessons/` 從 git 歷史移除（`git filter-repo`），
   並在該目錄留 README 指向新入口。
   **這一步會改寫歷史，需 CF 明確同意後再執行。**

驗收：公開站上 `grep` 不到任何一句課文；輸入 078451 以外的密碼只得到
「密碼不對」；解鎖後重新開啟不需再輸入；教師設定頁「鎖上」後立刻要求重輸。

### P0-A　錯題盒

- 新增 `src/utils/mistakes.js`：`add` / `due` / `grade` / `all` / `clear`，
  Leitner `BOX_DAYS = [0, 1, 3, 7]`（提早一小時到期的設計照抄），上限 300。
- 快照存 `{stem, options, answer, explanation, moduleKey, lessonId, ask}`。
  **我們不存 `innerHTML`**——我們的 `ChoiceQuiz` 題目是純資料，直接存資料
  比存 HTML 乾淨，也不會把樣式凍進 localStorage。
- `ChoiceQuiz` 在「非第一次答對」時呼叫 `mistakes.add`。
- 新增 `src/pages/MistakePage.js`（路由 `#/mistakes/:lessonId?`）。
  現有 `ReviewPage.js` 更名為 `PendingReviewPage.js`，避免三個「review」互撞。
- 課次首頁與全站首頁顯示「🔁 錯題複習（N）」，N＝今日到期數。
- 一批 `max(5, roundSize + 2)` 題。全清完給「🎉 今天的錯題都複習完了，
  還有 N 題在練習中，M 天後會再出現」。

驗收：故意答錯 → 當天出現在錯題複習；答對 → 隔天出現；連對四次 → 消失並
顯示「已學會」；清除紀錄會一起清掉。

### P0-B　單課小考

- `engine.js` 加 `captureMode`：開啟時各活動只回傳題目陣列、不掛 DOM。
  **用參數傳遞，不用全域變數**（參考站的 `CAPTURE` 全域旗標在我們這種
  模組化架構下會變成隱性耦合）。
- 新增 `src/pages/QuizPage.js`（`#/quiz/:lessonId`）：收題 → 去重 →
  各大項 round-robin 抽 → 依鷹架層級取 8／12／15 題。
- 小考強制「無提示、答錯一次揭曉」，不受 `eliminateHint` 影響。
- 結算頁：總分 ＋ 各大項答對率表 ＋「🔁 馬上複習答錯的」。
- 成績寫 `records.js`（`moduleKey: '_quiz'`），納入 TSV 與試算表同步。

驗收：每個有選擇題的大項都至少抽到一題；同一題不會重複出現；
答錯的題目考完後出現在錯題複習；成績出現在教師頁與 TSV。

### P1-D　等級表擴充

`SCAFFOLD_LEVELS` 加四欄：

```
support  : wrongLimit 1, autoRead true,  unlockMemory false, prefill 1
standard : wrongLimit 2, autoRead false, unlockMemory false, prefill 0
challenge: wrongLimit 2, autoRead false, unlockMemory true,  prefill 0
```

教師頁的「個別調整」用 `null = 跟隨等級` 哨兵值，切等級不蓋掉教師手調過的項。
`MatchingGame` 的翻牌模式由 `unlockMemory` 決定；`SentenceBuilder` 吃 `prefill`。

### P1-E　造句批改回饋環

`sentencePractice.js` 把學生造的句子寫進 `records`（`made[]`）→ `TeacherPage`
列出未批改的，給 ✓／✗ → ✗ 的句型進錯題複習，要求用同一句型重寫（`skip`
可當天跳過）。教師頁標題顯示「（N 句待批改）」。

### P2-F　朗讀挑戰（與 speaking-practice 草案合併）

同一個模組兩個層級：語詞（草案已設計）→ 課文段落。判準統一為無聲調讀音比對、
同音字算對、標出沒念到的字、90／70／40 → 3／2／1 星、每段取最高分。
需要先完成 P0-C（課文解鎖）才有課文段落可念。出處標示比照草案第一節。

### P2-G　分組與解鎖

- `utils/chunk.js` 改用 `balanced()` 演算法（15／6 → 5-5-5），加 unit test。
- 教師頁加「核心活動依序解鎖」開關，預設關。

---

## 5. 不採用的設計

| 參考站做法 | 不採用的理由 |
|---|---|
| 課次寫死在 `LESSON_LIST` 陣列 | 我們是五冊 70 課，必須走 `course-index.json` |
| 單檔 148KB `app.js` | 我們已模組化，且有 `check-dist` 把關 |
| 全域 `CAPTURE` 旗標收題 | 改成參數傳遞（見 P0-B） |
| 錯題存 `innerHTML` | 我們的題目是純資料，存資料即可（見 P0-A） |
| 無 `status` 審核閘門 | 我們的教材來自出版社大補帖，審核閘門是版權界線的一部分，不可移除 |

---

## 6. 建議施工順序

```
P0-C（加密＋點讀）→ P0-A（錯題盒）→ P0-B（小考）
   → P1-D（等級）→ P1-E（批改環）→ P2-F（朗讀）→ P2-G（分組）
```

P0-C 排第一是因為它是**版權與個資風險**，不是功能。P0-A 排在 P0-B 前面，
因為小考的「答錯自動進錯題複習」依賴錯題盒。

每一項完工前跑：

```bash
cd apps/mandarin
npm run validate
npm run build && npm run check-dist
for f in scripts/test-*.mjs; do node "$f" || exit 1; done
```

畫面有改另外跑 `npm run build:preview && npm run preview:draft`，
375px 下不可橫向捲動。
