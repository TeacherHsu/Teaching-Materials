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
