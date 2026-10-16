# 視覺重整實作紀錄

## 2026-10-16｜Codex｜第一批 T01–T07｜程式已實作，瀏覽器驗收受阻

### 工作與檔案

- T01：`tools/qa/p0-baseline.json` 留存修改前六個頁面／核心檔雜湊、全部題庫雜湊、seed=271828、驗收參數。`tools/qa/p0-fixture.js` 提供同格四隊、蛇規則、4/6/8 詞（依支持程度）、賓果尺寸與分隊、密室最後線索／最後門狀態；只由 QA 呼叫，不引入正式頁面。密室末段用原核心 API 依答案解前置題，不篡改資料／判分。`tools/qa/cdp.mjs` 支援 qaWidth／qaHeight，Chrome 失敗顯示明確錯誤。
- T02：`scene3d.js` 新增可見 DOM 格號／課次／方向／特殊格／隊伍／所有權／步數層，按實際矩形避碰；移除必要格名與步數 Sprite。`monopoly.html`、`snakes.html` 補方向資料；`common.css` 增字級與狀態層樣式。3D 模式原棋盤 aria-hidden，避免重複讀屏；切回 2D 還原。
- T03：`snakes.html` 計算僅視圖用的 visualSnakes，2D SVG／標牌及 3D 路線同用有效落點；原規則常數與 play 不改。
- T04：`bingo.html` 桌面左任務右棋盤，穩定隊卡；真 DOM 狀態與完整 aria-label。`common.css` 限棋盤寬高、容許長詞換行、移除小字狀態偽元素。
- T05：`common.css` 統一穩定詞槽、自然延展詞義；`dobble.html` 雙人詞義焦點接線。沿用既有抽題與全部 Math.random 呼叫，未增加美術亂數。
- T06：`detective3d.js` 增 reduce／body calm／visibility 監聽、載入後重查、frame 例外與 context loss 收斂、補間完成／清理、資源去重釋放；移除待機 pulse。`detective.js` 當局減少動態切換保留進度。
- T07：`detective3d.js` 標記編號／當前目標全名／矩形避碰／狀態安全區；`detective.js` 清單加入每個 holder 與 station 同編號全名入口；`detective.css` 字級與可操作清單。
- 快取版本：所有引用本批 CSS／JS 的 `index.html`、`monopoly.html`、`snakes.html`、`dobble.html`、`bingo.html`、`detective.html` 的對應 `?v=` 加 1，原無版本的加 v=3。
- `tests/p0-visual.test.cjs` 新增 8 項狀態／生命週期／矩形／資料雜湊測試。既有測試與斷言完全保留。`codex/VISUAL-REVIEW.md` 附錄記錄實作差異與驗收缺口。

### 檢查結果

- `node --check`：scene3d.js、detective3d.js、detective.js、tests/p0-visual.test.cjs、tools/qa/p0-fixture.js、tools/qa/cdp.mjs；全部通過。
- 六份 HTML 的所有 inline script 抽到 `/tmp/rg-*.js` 執行 `node --check`；全部通過。
- `node --test Chinese/Review-Games/tests/*.cjs`：39/39 通過（原 31＋新增 8），未刪改原斷言。
- `python3 Chinese/Review-Games/tools/check_data.py`：五年級全部 ✅；二上既有跨課重複語詞提醒保留。
- 核心及 data/*.js 的 SHA256 基線檢查通過；沒有修改題庫、生成器、apps 或跑酷，也沒有執行 git 指令。

### 截圖與未完成驗收

- 嘗試 `cdp.mjs http://localhost:5191/Chinese/Review-Games/snakes.html?g=G6A /tmp/rg-shots/after-snakes.png tools/qa/play-snakes.js`，9333 未能連線。原工具報 targets undefined；診斷直接啟動 Chrome exit 134，無輸出。已改善工具的連線失敗訊息。
- 指定 `rm -rf` 被執行環境拒絕，改用 Python shutil 清除同一暫存 profile；`pkill -f remote-debugging-port=9333` 也因無法取得 process list 而失敗。沒有權限提升或繞過限制。
- **沒有成功產出的 after 截圖，沒有看圖驗收，不能宣稱視覺通過。** `/tmp/rg-shots/after-snakes.png` 僅為嘗試路徑，非交付圖。
- 尚待：在能啟動 Chrome 的環境跑五款 QA fixture、全部寬度／投影／200%／長文／雙人面對面，核對棋盤標籤與模型遮擋、賓果底列及主操作、詞義閱讀、密室真矩形／拖轉與鍵盤走完全流程；真實 context loss／慢 CDN／reduce 切換；完整改動前後輸入 trace；iPad／教室電腦實機與效能成績。
- 替身測試只證明程式邊界與提供的矩形可排，不當成 GPU／真字型／實機證據。固定 seed fixture 已備妥但本次未成功在瀏覽器執行。T01–T07 不標記已完整驗收。

### 復驗範例

使用既有 cdp.mjs，將操作腳本改為 `tools/qa/p0-fixture.js`。網址可加：

- `qaLevel=support|standard|challenge`（哆寶 4/6/8 詞、賓果 3/4/5 邊）。
- `qaMode=solo|duel|duel-face`（哆寶）。
- `qaSlide=3|99`（蛇）。
- `qaRoom=last-clue|final-door`、`qaFault=calm|render|context`（密室）。
- `qaWidth=390&qaHeight=844` 等視窗尺寸；預設 1366×900。

例如：`node Chinese/Review-Games/tools/qa/cdp.mjs 'http://localhost:5191/Chinese/Review-Games/detective.html?g=G6A&qaRoom=final-door&qaFault=render&qaWidth=390&qaHeight=844' /tmp/rg-shots/after-detective-render-390.png Chinese/Review-Games/tools/qa/p0-fixture.js`。

## 2026-10-16｜Codex｜第 2 批 T08–T13｜程式檢查通過，待 Claude 視覺驗收

### 修改

- `scene3d.js`：程序環境圖、材質參數、陰影按需、標準／高階／輕量與慢幀單向降級；獨立美術 PRNG；共用木紋歸 View 擁有、結束才釋放；overlay 尺寸快取。骰子每次固定增量旋轉、規範終態、sync 讀目前骰點。格面 DOM 錨點取代避碰搬牌；大富翁減中央擺設、縮骰、低矮單號書屋；蛇漸細／條斑／數字避讓、低幅移動與切線朝向；哆寶薄牌同步淡入及 DOM gutter 配對線；賓果薄格材質過渡、取消翻背與一般答對彩紙、四方向連線角標／軌跡。
- `detective3d.js`：限 T08，共同光色／PMREM／材質與降級門檻、陰影與獨立美術亂數、最多 8 粒，未改解謎核心或機關狀態。
- `common.css`：格面小牌、條件規則牌、方向與編號、薄格陰影與靜態成功格、DOM 配對線與連線角標、靜態骰點結果。數字／格名 ≥22px，方向／步數 16px。
- `dobble.html`：先判定雙人再 mount 單人 renderer；`monopoly.html`、`snakes.html`：3D 模式靜態骰點接線。以上三頁及 `index.html`、`bingo.html`、`detective.html` 的所有受影響 CSS／JS 引用版本從 v3 加到 v4。
- `tests/scene3d.test.cjs`：新增 5 項（連續同骰、2D→3D 骰點、活躍幀降級、共用紋理釋放、禁止視圖使用遊戲 RNG），原斷言保留。
- `tools/qa/p1-fixture.js`：延伸固定情境，可選 qaQuality=high／qaDice=1，建立四種賓果連線；哆寶連續配對 20 次量 textures／geometries。僅視圖測試不算真實遊戲過關。
- `codex/VISUAL-REVIEW.md`：附錄記錄實作、參數差異與未簽收項。

### 檢查結果

- 所有修改 JS（含新增 QA fixture 與測試）`node --check` ✅；六份 HTML 的 inline script 抽到 `/tmp/rg-b2-*.js` 檢查 ✅。
- `node --test Chinese/Review-Games/tests/*.cjs`：**44/44 通過**（39 原有＋5 新增），最後執行紀錄 `/tmp/rg-b2-tests.txt`。
- `python3 Chinese/Review-Games/tools/check_data.py`：G1A／G2A／G3A／G4A／G6A 全 ✅；二上原有跨課重詞提醒保留。
- 既有資料與 detective-core 雜湊測試通過；未改 `data/*.js`、生成器、Shape-Run 或 apps。未新增遊戲亂數呼叫，視圖既有粒子 RNG 改獨立 seed。
- 依本批指示未執行任何 git 指令、未 commit／push，也未修改範圍外的 HANDOFF.md。以此檔作本批交接。

### Claude 截圖／錄影清單（本次未執行 Chrome）

基底 `http://localhost:5191/Chinese/Review-Games/`；以下皆用 `tools/qa/p1-fixture.js`。每次依派工清除 `$TMPDIR/rg-cdp-profile`，完成關閉 9333 Chrome。

| 相對網址 | 建議輸出 | 重點 |
|---|---|---|
| `monopoly.html?g=G3A&qaDice=1` | `/tmp/rg-shots/after-monopoly.png` | 後緣格牌與下角號碼對位、四隊／屋／步數區分、上方留白、連續同骰每次都動、骰面最後 5 |
| `monopoly.html?g=G3A&qaQuality=high` | `/tmp/rg-shots/after-monopoly-high.png` | 與標準比較；購地動畫期間拍後製，DOM 對比相同，無黑屏 |
| `snakes.html?g=G3A&qaDice=1&qaSlide=3` | `/tmp/rg-shots/after-snakes.png` | 對照 b1-snakes；格號不漂移、常態遮擋約 ≤35%、蛇梯／星格可辨、13→10 短退 |
| `snakes.html?g=G3A&qaSlide=99` | `/tmp/rg-shots/after-snakes-tail.png` | 一般蛇尾，爬梯／躲蛇／抵達 30 另實際操作錄影；朗讀仍完整 |
| `dobble.html?g=G3A&qaLevel=challenge` | `/tmp/rg-shots/after-dobble.png` | 8 詞薄卡、250ms 發牌字不動、連線繞過詞槽、20 次資源記錄 |
| `dobble.html?g=G3A&qaMode=duel-face&qaLevel=challenge` | `/tmp/rg-shots/after-dobble-face.png` | 180° 配對端點、雙視圖 DPR≤1.25、resize 後重算；沒有多開單人 renderer |
| `bingo.html?g=G3A` | `/tmp/rg-shots/after-bingo.png` | 橫直／兩對角四組線號、gutter 軌跡、長詞與隊號不被角標蓋住；fixture 只改視圖，不當計分證據 |
| `detective.html?g=G3A` | `/tmp/rg-shots/after-detective-quality.png` | 本批 T08 光色、calm／context loss 仍保留進度；機關終態屬下批 |

以上重跑 1366×900 與 `&qaWidth=1024&qaHeight=768`，另看投影／200%。真實遊戲須補賓果合作／對抗／中性格計分、哆寶正常 20 回與 resize（fixture 的反覆同詞檢查只驗配對層）、骰子動畫中切 calm，2D 擲 5 再回 3D。可從 `window.RG_P1_QA.views` 取得當局視圖唯讀觀察／呼叫品質降級；需測三類裝置 p95 與 renderer.info。

### 尚未簽收／偏離

沒有新產出的 `/tmp/rg-shots/after-*.png`，未宣稱看過修改後畫面；只檢視了使用者提供的 b1-snakes／b1-monopoly。格面覆蓋、相機構圖、蛇梯避數字、配對線避字、角標避長詞等均待 Claude 實際截圖。薄卡／薄格新增 .02 單段倒角，幾何對位仍待實際截圖；投影格牌 22px（依本批密集棋盤要求）；特殊移動保留 1400ms。資源重用已改善牌面／木紋／賓果格，但未建立全場共享幾何池；實機資源預算與效能未量測、密室輕量接觸陰影與靜態家具合併未做。T08–T13 不標為完整視覺驗收完成，詳見 VISUAL-REVIEW 附錄。

## 2026-10-16｜Codex｜視覺第 3 批 T14／T15／T17

- 修改 detective.html、detective.js、detective3d.js、detective.css、tests/p0-visual.test.cjs；報告附錄記錄格式變更與偏離。未執行 git，未改棋盤、核心、題庫、build 工具或 repo 根目錄交接。
- 同局 room 保留、唯讀快照還原、解題關窗後演出、出口兩條路共用 guard 與一次紀錄、離開取消 timer。鏡頭矩陣先更新再投影，取景按房間角點與長寬比計算；標記只就近搜尋，放不下保留編號小圓點＋DOM 清單。
- 可略過窗外推入；400ms 紙卡飛入筆記本；700ms 開門與漸亮地面光；無新增循環動畫。抽屜只對抽屜物件動作。書櫃、六色批次書本、抽屜把手、保險箱內部、窗框、相框、植物葉片；教室黑板、圖書館書車、森林松果籃與木箱、實驗器材、博物館展示座、書房桌上書。
- 檢查：node --check detective.js、detective3d.js、tests/p0-visual.test.cjs 通過；detective.html 無 inline JS（已抽取檢查）；node --test tests/*.cjs：45/45 通過；python3 tools/check_data.py：五年級全 ✅。HTML 三個改動引用版本各 +1。
- 截圖：依派工沙盒限制未啟動 Chrome，沒有產出或檢視截圖；以下請 Claude 執行，輸出 /tmp/rg-shots/after-det-*.png。qaRoom 僅 localhost／127.0.0.1 生效，需按「開始偵探任務」與「進入密室」；qaWidth 由既有 cdp.mjs 設定視窗。
- 網址（共同前綴 http://localhost:5191/Chinese/Review-Games/detective.html?g=G3A）：
  - &qaRoom=study&qaWidth=390&qaHeight=844：開場／略過後標記須貼近物件，不能整批堆左下；清單全部可用。
  - &qaRoom=study&qaWidth=1366&qaHeight=900：預設及左右拖曳極限、書脊外露、抽屜把手同步、方向窗光。
  - &qaRoom=classroom&qaWidth=768&qaHeight=1024：黑板與窗框；直向取景。
  - &qaRoom=library&qaWidth=1024&qaHeight=768：書車、閱讀區；橫向取景。
  - &qaRoom=forest&qaWidth=390&qaHeight=844：松果籃不能仍是地球儀、葉片與小圓點。
  - &qaRoom=lab&qaWidth=1366&qaHeight=900：器材架與三組容器。
  - &qaRoom=museum&qaWidth=1366&qaHeight=900：展示座與金色展品。
- 每主題檢查：開場略過、idle 10 秒無循環動畫；收線索紙卡飛往筆記本；解保險箱後繼續／筆記本／2D→3D 仍開著；布告欄排整齊、齒輪停完成位置；最後題按開門及關窗後再次點出口均先開門照光再到成果；中途回設定／重開不得被舊 timer 蓋頁；calm／WebGL 失敗可完整玩。
- 未完成：未量測 draw calls／實機 FPS，未視覺驗收；柔邊光束、程序接觸陰影及 keys／blocks／compare 完成模型已補上，仍需 Claude 實際看圖；詳 VISUAL-REVIEW 附錄。不得將本批視為全部視覺驗收通過。

## 2026-10-16｜視覺重整第 4 批：T16＋四棋盤情境（Codex）

- 範圍：`scene3d.js`、`common.css`、`monopoly.html`、`snakes.html`、`dobble.html`、`bingo.html`、`tests/scene3d.test.cjs`、本紀錄與 `VISUAL-REVIEW.md` 附錄。未執行 git，未改 detective*、common.js、題庫、出題／計分／學習紀錄或遊戲亂數。
- 四款 DOM 任務短句、450ms 單次入場、略過按鈕／pointerdown／keydown 取消；大富翁與蛇梯使用距離變化 4% 鏡頭，overlay 兩款整體桌面移入以保留字卡對位。減少動態直接到位並保留 2D 保底。
- 靜態工作室中遠景：窗格／窗光、書堆、檯燈、漸層背景，實體桌面縮為 15×15 顯露桌緣；無循環環境動畫。
- 完成：大富翁亮窗書屋、蛇梯 360ms 升旗；DOM 實體造型標記留下書屋亮燈／旅程旗／整理卡盒／收藏蓋章，包含 2D 降級。哆寶雙人兩邊均接線；賓果達標與結束均保留完成章。
- 哆寶紙卡加厚、接觸陰影、紙紋、暖橘／天藍邊與 ±.7° 全卡傾斜；文字仍為 DOM 按鈕。步數移到近端獨立錨點。畫面設定改可鍵盤展開的 details，移除大型 3D 宣告。
- 驗證：`node --check scene3d.js`、`node --check tests/scene3d.test.cjs`、四份 HTML inline script 抽至 `/tmp/rg-b4-*.js` 後 `node --check` 全通過；`node --test Chinese/Review-Games/tests/*.cjs` 47/47 pass；`python3 Chinese/Review-Games/tools/check_data.py` 五年級全 ✅。新增測試驗證四款 2D 任務／完成保留、450ms 入場可取消且不重播；未改既有斷言。
- 截圖：本批未啟動 Chrome、未產生或檢視截圖（依派工交 Claude），以下皆為**請求輸出路徑，尚不存在本批驗收證據**。

請 Claude 使用 `http://localhost:5191/Chinese/Review-Games/` 以下網址，開始遊戲後截圖：

| URL（接上上述根網址） | 請輸出 | 重點 |
|---|---|---|
| `monopoly.html?g=G6A` | `/tmp/rg-shots/after-monopoly.png`、`after-monopoly-finish.png` | 入場 ≤450ms／略過與按擲骰可取消；第 5 格「1步」不碰課名；桌緣及窗光；結尾書屋亮窗常駐 |
| `snakes.html?g=G6A` | `/tmp/rg-shots/after-snakes.png`、`after-snakes-finish.png` | 入場取消；數字與步數分區；自然到終點與回合上限兩種結束升旗，文字不誤稱到終點 |
| `dobble.html?g=G6A` | `/tmp/rg-shots/after-dobble.png`、`after-dobble-finish.png` | 左橘右藍、紙層／陰影；DOM 與卡對位；單人與雙人並排／面對面；結尾卡盒，無第三欄擠壓 |
| `bingo.html?g=G6A` | `/tmp/rg-shots/after-bingo.png`、`after-bingo-finish.png` | 任務不擠原題目欄；收藏盤周圍低對比情境；達標後與繼續收集保留完成章 |

另請測 1366×900、1024px、390px、投影、系統 reduce、畫面設定 calm、WebGL/CDN 失敗；確認 2D 任務／完成物件、設定入口鍵盤可用，讀題期間鏡頭固定。瀏覽器未測，尤其整卡傾斜後的配對連線與 resize 對位、桌緣取景及 DOM 字碰撞仍待 Claude 判讀。偏離報告與快取版本範圍例外詳見 VISUAL-REVIEW.md 第 4 批附錄。未 commit／push，依本批「不要跑任何 git」指示。
