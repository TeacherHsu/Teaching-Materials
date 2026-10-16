# T1B：大富翁黃金樣板實作紀錄

- 日期：2026-10-16；機器：本機 Mac 沙盒；執行：Codex；設計驗收：Claude。
- 狀態：程式實作及 Node 驗收完成；**HTTP 驗收受沙盒限制未通過，瀏覽器畫面與幀時間尚未驗收，因此不宣稱 Gate 1 通過**。HTTP 受阻後停止實作調整，只整理本紀錄。
- 已讀 HANDOFF.md 最新三筆、IMPL-LOG-T1A.md、ART-SPEC.md §3 與共用元件規格、VISUAL-UPGRADE.md §3，以及現有呈現層／測試／QA 腳本。
- 依本派工單最新指示，未執行任何 git 指令，未 commit／push，未改 HANDOFF.md；整合與交接提交由 Claude 接手。未啟動 Chrome、未嘗試截圖。

## 檔案清單

新增：
- `Chinese/Review-Games/scene3d-monopoly.js`
- `Chinese/Review-Games/tests/scene3d-monopoly.test.cjs`
- `Chinese/Review-Games/tools/qa/shot-monopoly.js`
- `Chinese/Review-Games/docs/visual-upgrade/IMPL-LOG-T1B.md`

修改：
- `Chinese/Review-Games/rg3d-kit.js`
- `Chinese/Review-Games/monopoly.html`
- `Chinese/Review-Games/tools/qa/capture-monopoly.mjs`：只換 mount API 名稱及移除舊 kind 判斷。

`play-monopoly.js` 的 DOM 選擇器仍適用，依派工要求未改。沒有修改 scene3d.js、common.js、common.css、detective、其他遊戲 HTML、data、vendor、Shape-Run 或既有 tests；沒有新增網路依賴。

## 實作摘要

### 場景與公開介面

- `window.RG3DMonopoly.mount({host,cells,onMode,quality})` 回傳 View；同步建構失敗回 null，載入／WebGL 失敗則保留可立即完成方法的 2D View，與現行 mount 策略一致。
- 所有指定方法皆回傳 Promise：moveToken、stepMark、clearMarks、rollDice、focusPlayer、setOwner、presentFinish、dispose。降級／隱藏／dispose 解除等待；2D 仍保留位置、屋主、骰值，恢復 3D 時同步。
- `onMode(active)` 僅在 active 實際改變時通知，先切 host class 與原 2D 容器 aria-hidden，再呼叫遊戲提供的回呼。初始 2D 不額外呼叫 false，與舊 View 相同。
- 保留 `.rg3d-host`、`.rg3d-monopoly`、`.is-3d`、`.rg3d-surface`、`.rg3d-dom-labels`、`.rg3d-cell-label`／name／direction／detail／state／step、`data-cell`、`data-compact`／`data-full`，以及 owners／tokens／active／draw 等 QA 使用介面。新增 `ready`、`stats()` 供 QA 等待與統計。
- 2D `.board`、遊戲規則、分數、亂數、出題及作答流程保留。HTML inline JavaScript 只更換 mount 對象及移除 kind 參數；其餘 HTML 改動為兩支 script 引用及 §3.7 CSS。

### 鏡頭與材質

- 透視 fov **32°**，仰角 **54°**，x=0、不水平旋轉。以 11.08 方形外框的八個包圍角做 28 次二分搜尋，自動求相機距離，水平與垂直投影均留至少 5%。
- 3D surface aspect-ratio **1.22**。以此比例在 620／800／1024／1366／1920 畫布寬度做真實矩陣測試，最外框水平 NDC 絕對值 **0.89999999956**，即左右各約 **5%**。此為幾何測試，不是瀏覽器版面截圖。
- focus 使用 **2.5%** 短暫推近，**500ms** 回預設，無旋轉。
- 木底座厚 .55、框寬 .5、圓角 .12；格子 1.62×.2×1.62、圓角 .07、間隔 .06；內側課次帶寬 .3、凸高 .04。
- 木桌 22×22，約兩倍棋盤；透明畫布以水平／垂直 4% 邊緣 mask 淡回頁面，移除舊大富翁表面的整塊木色背景與框線。最終邊緣觀感待截圖確認。
- 新材質皆透過 MAT／kit.material 建立，沿用 sRGB→線性轉換、PMREM 與 studio lights，未新增外部素材。
- 標籤置於內側 .47，房屋置於外側 .42；標牌米白底與課次色點，字固定 16px，足跡 16px、22px 圓牌；完整格名及屋主保留於 aria-label。

### 模型與動作

- 五種特殊格：綠色起點三角旗／起跑木牌、金色問號積木、三張錯位卡牌、木椅與杯、三本藍色書；綜合複習在未選課次時使用。
- 六種參數建築：厚書拱門屋、條紋棚鉛筆文具店、鐘樓學堂、四柱山牆圖書館、圓屋錐頂煙囪小屋、三本書頂閱讀塔。紙色牆、隊伍屋頂與門、隊號旗；未售僅地基線框與木牌。
- 購地先亮帶 300ms，接著 scale.y 由 .001 長到 1.08 再回 1，700ms；.001 是避免完全零縮放導致法線矩陣奇異的數值替代，視覺等同 0。屋主 cheer；同課兩地同隊時增加繩與五面隊色小旗。
- 中央木邊毛氈墊、前側圓形淺骰盤、後側低矮圖書館、兩支 emissive=.4 鉛筆燈、寶箱與「課文探險」小旗。中央圖書館縮至 .62、鉛筆尖中心降至 .62，讓擺設頂端維持 .7 以內；骰子動畫不受靜態擺設高度限制。
- 四角色沿用 kit，棋子同格固定 ±.36 的 2×2 配置，最近距離 .72（測試要求 ≥.5）。遊戲逐格呼叫 moveToken，各格播放 hop。
- 目前隊伍由場景續播 idle，換隊／hop／cheer／隱藏／降級／dispose 取消舊 idle。hop 220ms 的前 80% 飛行，後 20% 已落地才壓扁 6% 再回彈；calm hop 維持 80ms 無弧位移。
- presentFinish：所有棋子 cheer，中央小金環 900ms 旋轉縮放，保留小獎章，不覆蓋棋盤。
- 側邊目前隊伍左側 6px 隊色邊框、shadow-toy，四個角色 inline SVG 以 CSS data URL 顯示，保留原數字／形狀 token。主要操作仍由原遊戲流程管理，其他按鈕保留次要樣式。

### kit 的 T1A 待辦與生命週期修正

- 機器人天線球改為該隊 plastic。
- idle 停止使用 `stage.cancelTween()`，既有 idle API 不增加低動態補間；不破壞既有 calm 測試。
- 新增 `controls()`，沿用畫面設定 details、status、減少動態、投影模式與 `RG.force3dToggle()`；同步 body class 與 checkbox。
- 匯出 material／releaseMaterial，讓本場景 atlas 材質沿用色彩轉換且可在 dispose 從 cache 移除。
- stage 的 MutationObserver 僅於 body class 改變或 host 脫離時 refresh，避免投影標籤更新 DOM → refresh → draw → 標籤更新的遞迴。新增測試驗證。

## 效能預算：估算方式及實際數字

測試載入真實 vendor Three.js／RoundedBoxGeometry；DOM、renderer、PMREM 和 rAF 採替身。

- 固定布景、每個建築、每個角色 toy group、骰子 body 依材質合併 geometry；保留動畫父群組。使用 BufferGeometry 合併，沒有新增工具或依賴。
- 場景建築／格子 roundedBox 使用 seg=1；半徑維持規格，角色與骰子保留 kit 精度。選擇低分段以控制 80k 預算；實際圓角平滑程度交由截圖驗收。
- `stats()` 遍歷 visible Mesh；indexed 幾何用 index.count/3，non-indexed 用 position.count/3；主畫面 draw call 估計每 Mesh 一次；使用中 map 以 Set 去重。
- **12 地全購、四角色、六條旗串、完成獎章可見：49,718 triangles、134 主畫面 draw calls、8 張 canvas 貼圖。**
- 貼圖尺寸：wood 512×512、felt 256×256、標牌 atlas 512×896、共享 blob 128×128、四隊 number 各 128×128。全部 ≤1024。
- draw call 是幾何估算，不包含 PMREM 初次生成與陰影貼圖 pass。請 Claude 補 `view.renderer.info.render` 與 GPU／swiftshader 實測。
- **standard swiftshader 單幀 ≤50ms 尚未量測**；不能以 Node 測試時間替代。

## 實際驗收指令與輸出

### JavaScript 語法

從 monopoly.html 以 Python 正則抽出所有無 src 的 inline script，寫至 `/private/tmp/t1b-monopoly-inline.js`，再實際執行：

```sh
node --check Chinese/Review-Games/rg3d-kit.js
node --check Chinese/Review-Games/scene3d-monopoly.js
node --check Chinese/Review-Games/tests/scene3d-monopoly.test.cjs
node --check Chinese/Review-Games/tools/qa/shot-monopoly.js
node --check Chinese/Review-Games/tools/qa/capture-monopoly.mjs
node --check /private/tmp/t1b-monopoly-inline.js
```

以上每個指令皆 exit 0，無錯誤輸出。

### Node 測試

```sh
node --test Chinese/Review-Games/tests/scene3d-monopoly.test.cjs
```

最終獨立執行輸出：tests 10、pass 10、fail 0、cancelled 0、skipped 0；duration_ms 4917.674668。
覆蓋：失敗／2D、購地六模型／旗串、dispose 等待解除、四隊世界座標、當前 idle、骰面真實旋轉、完整預算、onMode 時機與恢復、落地壓縮、DOM observer、防裁切取景。

```sh
node --test Chinese/Review-Games/tests/*.cjs > /private/tmp/t1b-tests.txt 2>&1
```

最終實際 exit 0：

```text
ℹ tests 82
ℹ suites 0
ℹ pass 82
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 7580.278489
```

開發中曾有一項既有 calm idle 測試失敗（停止 idle 原本改呼叫 0ms tween，替身僅接受 hop 的 80ms）；已改用 cancelTween 保留 idle 的不播放語意。沒有修改既有測試；最終全過。

### 資料檢查

```sh
python3 Chinese/Review-Games/tools/check_data.py > /private/tmp/t1b-check-data.txt 2>&1
```

exit 0，實際輸出：

```text
✅ G1A（一上）7 課、282 題 {'gist': 7, 'lookalike': 69, 'idiom': 39, 'zhuyin': 69, 'meaning': 71, 'reading': 27}
✅ G2A（二上）6 課、285 題 {'gist': 6, 'lookalike': 46, 'idiom': 34, 'zhuyin': 80, 'meaning': 91, 'reading': 28}
   提醒： 語詞有重複（跨課同詞，遊戲會自動去重）
✅ G3A（三上）6 課、326 題 {'gist': 6, 'lookalike': 112, 'idiom': 34, 'zhuyin': 72, 'meaning': 78, 'reading': 24}
✅ G4A（四上）6 課、360 題 {'gist': 6, 'lookalike': 117, 'idiom': 33, 'zhuyin': 90, 'meaning': 90, 'reading': 24}
✅ G6A（六上）6 課、478 題 {'gist': 6, 'lookalike': 209, 'idiom': 49, 'zhuyin': 94, 'meaning': 96, 'reading': 24}
```

### HTTP：受阻，未通過

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

實際 exit 1，socket.bind 回報：

```text
PermissionError: [Errno 1] Operation not permitted
```

接著仍實際執行派工要求的 curl：

```sh
curl --connect-timeout 3 -sS -o /dev/null -w 'monopoly.html HTTP %{http_code}\n' http://127.0.0.1:8765/Chinese/Review-Games/monopoly.html
curl --connect-timeout 3 -sS -o /dev/null -w 'scene3d-monopoly.js HTTP %{http_code}\n' http://127.0.0.1:8765/Chinese/Review-Games/scene3d-monopoly.js
curl --connect-timeout 3 -sS -o /dev/null -w 'rg3d-kit.js HTTP %{http_code}\n' http://127.0.0.1:8765/Chinese/Review-Games/rg3d-kit.js
```

三次皆 exit 7：`Failed to connect to 127.0.0.1 port 8765 ... Couldn't connect to server`；分別輸出 `monopoly.html HTTP 000`、`scene3d-monopoly.js HTTP 000`、`rg3d-kit.js HTTP 000`。**未取得 HTTP 200**；未嘗試繞過沙盒或啟動 Chrome。

## Claude 截圖網址與操作

請在能監聽埠的環境，從 repo 根目錄啟動：

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

開局與購地腳本：`Chinese/Review-Games/tools/qa/shot-monopoly.js`。使用 p1-fixture 同款 seed 271828；在每次擲骰按鈕的同步 click 期間固定骰值 **1、4、2**，四隊依序落在三塊不同地，依題庫原答案實際點選作答，再點「繼續」；不直接修改遊戲 owner／cash。其餘出題亂數使用 seeded PRNG，finally 還原原亂數與 mount。回傳 JSON，亦存為 `window.RG_T1B_QA = {view,state}`。

**腳本尚未在瀏覽器執行，不宣稱三次實玩驗收已完成。**

```sh
node Chinese/Review-Games/tools/qa/cdp.mjs 'http://127.0.0.1:8765/Chinese/Review-Games/monopoly.html?g=G3A&qaWidth=1366&qaHeight=900' /tmp/t1b-1366.png Chinese/Review-Games/tools/qa/shot-monopoly.js
node Chinese/Review-Games/tools/qa/cdp.mjs 'http://127.0.0.1:8765/Chinese/Review-Games/monopoly.html?g=G3A&qaWidth=1024&qaHeight=768' /tmp/t1b-1024.png Chinese/Review-Games/tools/qa/shot-monopoly.js
node Chinese/Review-Games/tools/qa/cdp.mjs 'http://127.0.0.1:8765/Chinese/Review-Games/monopoly.html?g=G3A&qaWidth=1920&qaHeight=1080' /tmp/t1b-1920.png Chinese/Review-Games/tools/qa/shot-monopoly.js
node Chinese/Review-Games/tools/qa/cdp.mjs 'http://127.0.0.1:8765/Chinese/Review-Games/monopoly.html?g=G3A&qaWidth=800&qaHeight=1000' /tmp/t1b-800.png Chinese/Review-Games/tools/qa/shot-monopoly.js
```

以上四個網址亦可手動開啟，點開始遊戲。qaWidth／qaHeight 由 cdp.mjs 設定 viewport，正式 HTML 不讀取這兩個參數。五年級可替換 g=G1A／G2A／G3A／G4A／G6A。

補查 760px 以下 2D 與減少動態：把 qaWidth 改 760／390；或 `RM=reduce` 執行 cdp.mjs。檢查 JSON owners 應為三筆（1→0、4→1、2→2），overflowX=false，寬螢幕 active3d=true；窄螢幕／系統減少動態應 active3d=false，但同樣完成三次購地。教室電腦可透過畫面設定的「顯示 3D」覆蓋系統偏好。

現有 capture-monopoly.mjs 已換新 API，但沿用其原本 Windows Chrome 路徑，Mac 截圖請使用上列 cdp.mjs；依要求未擴大修改截圖工具。

## 偏離規格及已知問題

- HTTP 200 與 swiftshader ≤50ms 尚未驗收；畫面截圖與 QA 三回合尚未執行。這是沙盒能力限制，並非已證明符合視覺要求。
- 上述數值選擇（surface 1.22、2.5% focus、中央模型 .62、低分段圓角、.001 生長起點）均已記錄原因，其餘未刻意調低設計要求。
- 尚需 Claude 檢查材質／接觸陰影、屋頂與臉部方向、旗串可讀性、16px 標牌的視覺碰撞、畫布淡出，以及四種 viewport 下側邊面板實際布局；800 寬沿用原本單欄排列，必要時捲動。
- 主畫面 draw call／貼圖／三角形已用實際幾何驗證；真實陰影 pass、瀏覽器長時間資源與幀時間未驗證。
- 原本全套測試及新增測試通過，但不把它等同於 p0-baseline 的完整瀏覽器重播或 2D／3D 全局對照。
- 無 commit／push；本單依最新要求未動 HANDOFF.md，請 Claude 整合時補交接紀錄與提交。

## R1 修正

- 日期：2026-10-16；本機 Mac／Codex。已讀 `shots/t1b-r0-1366.jpg`、本紀錄及 ART-SPEC §3。
- 本輪只改呈現、樣式、元件陳列、QA fixture 與測試；`monopoly.html` 的 inline 遊戲程式、規則、出題、計分、回合流程未改。沒有修改共用 kit、其他遊戲、資料或 vendor。
- 依本單要求，沒有執行 git、啟動 Chrome 或開任何埠；沒有產生新截圖，**不宣稱 Gate 1 已通過**。

### 1. 取景

- `scene3d-monopoly.js` 改以托盤真正的八角（XZ ±5.54，Y −.55／0）投影，32 次二分求左右各 5% 的距離，外加 8 次迭代求畫布比例及垂直中心；不再讓垂直 fit 把水平棋盤縮小。原本 Y=1.22 的角點是模型上方的空間，不是外框。
- 把 canvas 絕對定位在 surface 中，避免 renderer 設定的 canvas intrinsic／inline 尺寸反過來撐大 surface；迭代結果寫入 surface 的 `aspectRatio`，resize 使用更新後的實際比例。
- 驗證：真實 Three.js 矩陣測試經 `stage.resize()`，畫布寬 620、800、1024、1366、1920 的外框最大水平 NDC 均約 .89997，即左右各 **5.002%**，垂直完整；fov=32、仰角54°、無水平旋轉。測試模擬 CSS aspectRatio 的高度結果，不等同瀏覽器排版驗收。

### 2. 中央場景

- 大富翁專用 felt 改為 `#5f8f78`；原共享 felt 的帶色底圖不再用於此盤，改白底、極低對比的中性噪點貼圖，讓底色不受另一層淺綠調色。獨有貼圖及材質在 dispose 釋放。
- 圖書館移到後方中央，實際不透明幾何尺寸約 **1.62×.96（XZ）、高 .64**；保留柱列、山牆與台階。
- 新增四塊石板連接骰子盤後緣至圖書館、六棵圓球樹（兩種 plastic 綠），保持骰盤前方淨空。鉛筆路燈相對毛氈高 .60、emissive .4，寶箱總高 .35。
- 小旗改為斜立木牌，牌面 1.65×.60，文字沿用 canvas atlas。靜態景物相對毛氈頂面均不超過 .7；骰子沿用原動畫高度。
- 驗證：幾何尺寸測試；690／850／1100 畫布寬度下，以 atlas 字高比例與木牌世界矩陣計算投影字高 ≥14px。文字實際清晰度與色彩仍待截圖確認。

### 3. 課次色

- 色帶由 .30 加寬為 **.42**，中心內移為 .60，讓色帶保留在格面範圍；購地閃光片同步尺寸與位置。
- 課次整格以 paper 與課次色混合 **15%**，各色材質透過 kit cache 共用。特殊／複習格改淺奶油黃 `#fff0cd`。
- 驗證：真實幾何初始化及全購地預算測試；材質實際辨識度交由設計總監截圖驗收。

### 4. 標籤一致

- 落點狀態也固定使用 `data-compact` 的 `N課`，不再顯示 `data-full`；轉換正則支援多位數課次。
- 完整名稱保留 `data-full`、title 與 aria-label；2D 原始格名保持原流程。
- 驗證：JavaScript／HTML inline 語法檢查；檢視大富翁注入樣式的預設與落點兩條規則均取 compact。

### 5. 建築／棋子／標籤分區

- 建築中心設於外側 .54，依各邊朝內旋轉，局部深度縮為 .65 倍，實際幾何落在外側35%的徑向區間 **[−.81, −.243]**；未售地基同區同方向。
- 角色維持2×2槽，切向 ±.30、徑向 −.14／+.18，位於格子中央；棋子統一縮為 .30 倍，讓四個完整角色幾何均能放進中央區且不擠到建築。最小槽距 .32，舊「中心距 ≥.5」測試改為對應槽距，另用更嚴格的實際幾何不交疊測試取代只量中心。
- DOM標籤移至內側邊緣 .82，與棋子保留距離。
- 驗證：對 **12 塊課次地×4角色** 建立實際模型世界 AABB，投影到 XZ；建築／四角色／標籤保留區逐對檢查不重疊。透明接觸陰影不當作實體佔地；標籤以保守 **1.1×.80** 世界區域檢查（涵蓋左右側橫排牌）。另驗證每棟建築位於外側35%。這是世界XZ分區檢查，不是螢幕像素遮擋測試。

### 6. 建築辨識與陳列

- 文具店屋頂鉛筆加粗，學堂鐘樓／鐘面加大，圖書館柱子加粗並突出，閱讀塔頂書疊加寬加厚；其餘保留書本牆＋拱門、圓屋＋圓錐屋頂。
- `kit-showcase.html?shot=buildings` 使用同一個 `RG3DMonopoly.building()` 工廠，六種建築單列、屋主依序 **1、2、3、4、1、2**；此模式不建棋子、骰子及材質球。獨立的陳列鏡頭以約60px模型高度計算距離，並隨resize重算。
- 驗證：HTML inline 語法、主場景六模型初始化與真實幾何測試；**60px時的人眼剪影辨識仍待設計總監截圖驗收**。

### 7. 側欄

- 純 CSS `:has(> .team:nth-child(3))` 偵測3／4隊：隊伍卡改兩欄，取消原卡片最小高度、縮小角色圖示／token／行高／資金與地產字級；目前隊伍仍有6px隊色左框。
- 壓縮操作區間距及訊息字級，擲骰子的原DOM、按鈕行為及可操作尺寸維持原流程。
- 驗證：HTML inline 語法、選擇器及specificity檢視；**1366×900與1024×768的實際不捲動驗收未執行**（本單禁止啟動Chrome與開埠），後續須包含已購地訊息／目前隊伍狀態一起截圖確認。

### 8. QA fixture

- `tools/qa/shot-monopoly.js` 讀取遊戲網址 `?qaOwnAll=1`；仍透過原開始按鈕開局，等待 view.ready 後，只對12塊課次地逐一呼叫 `view.setOwner(cell.id, i % 4)`。
- 此分支不擲骰、不回答題目、不購地、不碰遊戲閉包中的owner/cash/turn；側欄仍應顯示1000元／地產0。沒有該參數時，保留前三回合買三地的原fixture。
- 回傳fixture名稱 `T1B-all-buildings-view-only` 與view owners／tokens／stats，供截圖工具辨識；結束時還原Math.random及mount。
- 驗證：新增 `tests/monopoly-qa.test.cjs`，以VM執行真實QA腳本，確認12次API指派及隊序、只開局一次、不走回合、卡片仍為起始值，且還原mount與亂數。

### 本輪驗證結果與限制

- `node --test Chinese/Review-Games/tests/*.cjs`：**85/85 通過**。
- `python3 Chinese/Review-Games/tools/check_data.py`：**五年級全 ✅**（二上跨課同詞為原有提示，非失敗）。
- Review-Games 全部 JS／MJS／CJS 與 HTML inline script 共53份語法檢查：**全通過**。`play-*`／`shot-*` 是CDP注入函式本文，依 `tools/qa/cdp.mjs:32` 的 `(async()=>{…})()` 語境包裝後執行 `node --check`；直接以CommonJS解析七份既有play腳本會因頂層await失敗，並未改動這些腳本。
- 全購地＋四角色＋六旗串＋完成獎章：**51,434 triangles、138主畫面draw calls、8張canvas貼圖**，尺寸全部≤1024，仍在原效能預算內；不代表GPU／陰影pass／幀時間實測。
- 尚待設計總監：三種寬度截圖取景、felt實際顏色、六建築60px辨識、木牌實際讀字、4隊側欄無捲動，以及全滿畫面遮擋。沒有瀏覽器截圖或幀時間數據，不能以Node測試宣稱Gate 1通過。

## R2 修正

- 日期：2026-10-16；本機 Mac／Codex。已看 `shots/t1b-r1-all.jpg`、`t1b-r1-1024.jpg`、`t1b-r1-bottomrow.jpg`，並對照 ART-SPEC §2.5／§3、R1 實作紀錄。
- 本輪僅修改 `scene3d-monopoly.js`、`tests/scene3d-monopoly.test.cjs` 及本紀錄；未動遊戲規則、HTML inline 流程、共用 kit、中央布景、陳列頁、側欄、資料或其他遊戲。
- 依本單覆蓋指示，沒有執行任何 git 指令、commit／push，未修改 HANDOFF.md；提交交由 Claude。沿用 R1 紀律，未啟動 Chrome、未開埠、未產生新截圖，**不宣稱瀏覽器視覺驗收或 Gate 1 通過**。

### 1. 棋子尺寸、同格槽位及標籤

- 恢復棋子 XZ 尺寸為 kit 的 **.95 倍**。四種原始角色高度不同，若只做等比 .95 倍，最矮角色仍不足 40px；因此 Y 依真實幾何正規化為約 **1.00 世界單位**（接近原 kit 最高角色約 1.05 × .95）。這是為滿足 40px 下限的微調，並非所有軸都固定 .95，也不宣稱實體高度嚴格落在 .80–.95。
- 多隊同格採徑向、切向 **±.40** 的 2×2 槽，最小中心距 **.80**；恢復 **≥.5** 測試，允許棋子與建築部分重疊，移除 R1 以「所有 XZ AABB 完全不交疊」強迫縮小角色的測試。
- 只有一隊時使用格子中央；另一隊到達即展開槽位，離開後剩下一隊會回中央。2D 恢復 3D 的 sync 同樣使用此規則。
- 同格大棋子會遮住後排平放的底座號碼：大富翁專用號牌移到前緣、稍朝上，依槽位向外偏 .14；號牌保留獨立 Mesh，複製材質並設定 `depthTest=false`、`depthWrite=false`、`renderOrder=2`，作為最後繪製的辨識標記，保證不被前排幾何遮住。未改共享 kit 的角色／材質。獨有號牌材質透過 `ownedMaterial` 隨 stage 釋放。
- DOM 標籤層明確設 `z-index:3`，牌底由半透明米白改為不透明 **#fffaf3**，保留深色 16px 字，讓大棋子無法蓋住 DOM 標籤文字。
- 驗證：真實 vendor Three.js 幾何在模擬 1024px 頁面、保守取棋盤寬 **690px** 時，遍歷20格與四角色的實際頂點投影，最小高度 **40.581px**。20格四隊同格射線測試均有各隊頭部可見點；底座號牌中心投影彼此至少16px，並檢查最上層繪製設定。單隊居中、展開／返回中央、idle 與生命週期測試通過。這些為幾何／繪製設定驗證；DOM 對頭部的實際遮擋及數字人眼清晰度仍待截圖驗收。

### 2. 課次格面顏色

- 整塊格面 paper／課次色混合由15%提高為 **30%**，同課兩格依同一色值與 cache key 共用材質；內緣色帶仍為 **.42**。
- 特殊格仍為淺奶油黃 **#fff0cd**。DOM 米白牌面不透出下方課次色，維持深字對比。
- 驗證：場景初始化、全購地及語法測試通過；遠看同課色辨識度仍需 Claude 以相同 all 截圖檢查。

### 3. 前排建築牆面

- 選擇 **(a) 為主，搭配 (b) 的朝外與牆面傾角調整**：相機仰角由實際 R1 的54°降至 **48°**，仍為32°透視、x=0，不做水平旋轉。
- 建築 +Z 正面依格子所在側轉向棋盤外；再以世界 X 軸 **−18°** 抬起朝鏡頭的牆面，以增加牆面投影（這是牆面朝向鏡頭的調整，模型上端實際往遠側傾，並非把屋頂向鏡頭壓低）。傾斜後依真實幾何最低點調整高度，讓實體最低點維持 Y=.26、不陷進格面。未售地基只朝外、不傾斜；獨立建築陳列與中央圖書館不套用此變換。
- 原外框自動取景仍保留：620／800／1024／1366／1920畫布寬度的最大水平 NDC 約 **.899952**，左右各約5%留白，外框垂直完整；中央木牌字高測試仍通過。
- 驗證：12棟各自以真實模型做24×24投影射線取樣，取每條射線第一個不透明表面，紙色牆面佔命中樣本約 **40.45%–62.08%**，前排4課／5課均有牆面；排除「模型自身只露屋頂」的退步。此測試不包含其他建築／棋子／DOM遮擋，不能取代 all 截圖「每棟皆可見門或牆」的最後視覺驗收。

### 本輪驗證結果

- `node --test Chinese/Review-Games/tests/*.cjs`：**88 tests、88 pass、0 fail**，duration_ms 12517.90008。輸出留於 `/private/tmp/t1b-r2-tests.txt`。
- `node --check Chinese/Review-Games/scene3d-monopoly.js`、`node --check Chinese/Review-Games/tests/scene3d-monopoly.test.cjs`：皆 exit 0。
- `python3 Chinese/Review-Games/tools/check_data.py`：exit 0，五年級全 ✅；二上跨課同詞維持原有提示。
- 全購地＋四角色＋六旗串＋完成獎章：**51,434 triangles、138主畫面draw calls、8張canvas貼圖**，尺寸全部≤1024，與R1相同；未量測GPU／陰影pass／幀時間。
- 請 Claude 延用原 fixture 補 all、1024×768、bottomrow 截圖，確認角色頭部及底座字、所有建築牆面、30%課次色與標牌閱讀性；本輪沒有新增瀏覽器截圖，也沒有執行 git 指令。
