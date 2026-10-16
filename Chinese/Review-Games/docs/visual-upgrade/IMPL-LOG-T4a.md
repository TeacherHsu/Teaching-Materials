# T4a：密室黃金樣板實作紀錄

- 執行：Codex；環境：本機 Mac 沙盒。
- 狀態：程式及 Node 驗收完成；視覺截圖／實機觸控待 Claude 驗收。
- 已讀 ART-SPEC §2、§4.1–4.4、VISUAL-UPGRADE §3、DETECTIVE-REDESIGN、IMPL-LOG-T1B 及 HANDOFF 最新三筆。
- 依派工單覆蓋開收工流程：未執行任何 git 指令、未 commit／push、未修改 HANDOFF；提交由 Claude 處理。未開啟 Chrome、未監聽任何埠。

## 修改檔案

- `detective3d.js`：共用呈現層、房間模型、探索鏡頭、標記、動畫、資源釋放。
- `detective.css`：兩種標記模式、手機小圓點、視角控制及蒐證印章。
- `detective.js`：僅在 `dt-bar` 加入標記選單與固定視角開關。
- `detective.html`、`detective2.html`：加入 kit script、更新此次變動的資源版本。
- 新增 `tests/detective3d.test.cjs`。
- 新增本紀錄 `docs/visual-upgrade/IMPL-LOG-T4a.md`。

沒有修改 core、資料、build 工具、共用 kit、scene3d 系列、其他遊戲、vendor 或任何既有測試。

## 實作摘要

### 房間與材質

- 沿用 `Detective3D.mount(host, opts)`、THEMES，以及 setState／applyVisualState／animate／paper／confetti／refreshMode／dispose；新增 focus、setMarkerMode、setFixedView。
- 使用 kit 的 load、createRenderer、addStudioLights、material／MAT、roundedBox、blobShadow；透明畫布、exposure .92；暖色 key 位置調到 (4.3,8,-2)、強度 1.25 以配合右後窗，保留 kit 的 hemi／fill；RoomEnvironment 經 PMREM。自訂材質使用房間專屬 cache key；釋放時只 release 自己的材質及貼圖，不誤釋放 kit 共用 MAT／木紋／blob 紋理。
- .25 厚的米白剖面牆，後牆實際留下窗洞；下段護牆板、踢腳板、上段程序壁紙，六主題各自配色與圖案變體。木底座與逐條木地板、地毯織紋與流蘇、窗格、低透明 additive 光束、emissive 暖燈。只有 high 增加 .5／距離 4 的 PointLight。
- 六主題皆有共用機關及專屬道具：書房的書／杯／信紙、教室黑板／雙課桌／鉛筆筒、圖書館書車／書堆／閱讀卡、森林松果／油燈／地圖、實驗室試管架／燒杯／儀器、博物館玻璃展示罩／雕像／陶器與標牌。
- 互動點落地 blob；右前景低木箱與標記投影重疊時隱藏，避免擋住操作入口。

### 鏡頭、標記與互動

- yaw ±.9、pitch ±.12；滾輪及雙指距離縮放 .72–1.2。每次先以房間角點計算預設距離，再施加縮放；lookAt 固定房間內部中心，並限制相機 x／z 不越過左／後牆。
- 起始水平角由原 .62 改為 .92 rad，使整個 yaw 範圍在可見剖面的室內側；預設視角按鈕 48px，置於左下狀態列上方。
- focus(id) 500ms 轉向並推近、單次光暈；低動態直接到位。3D 物件、DOM 標記觸發聚焦；側欄清單使用捕獲事件委派，以既有 data-id／編號或名稱對照，不更改側欄內容與選擇器，供 T4b 直接接 focus。
- `dt-fixed-view` 鎖拖曳與縮放；`dt-marker-mode` 儲存 standard／high，預設探索。儲存空間受限時仍可操作。
- 探索模式未調查 holder 顯示 18px 點，熱區 48px，hover／鍵盤焦點展開；鎖定機關僅鎖頭。high 顯示編號、圖示與名稱。dt-target 永遠展開、opacity 1、排版優先。
- raycast 只在鏡頭／標記變動停止 180ms 後計算，不在逐幀動畫中重複射線。high 與平面圖清除淡出。手機 3D 非目標標記改點，保留下方完整清單；平面圖仍 high。
- 書抽出與翻開、抽屜拉出、相框翻開、葉片晃動、保險箱轉盤後開門、鎖勾彈起掉落、打字機逐鍵下壓、放大鏡抬起與暖色高光、出口開門與光均實作。持續狀態依 snapshot 恢復，紙卡飛入筆記本保留，線索卡有 400ms「已蒐證」印章。
- dispose／背景頁／切平面圖會完成待等補間，解除 Promise、移除飛行紙卡與彩紙。所有動畫不使用遊戲亂數。

## 驗收指令與輸出

以下指令均從 repo 根目錄實際執行，沒有使用瀏覽器。

```sh
node --check Chinese/Review-Games/detective3d.js
node --check Chinese/Review-Games/detective.js
node --check Chinese/Review-Games/tests/detective3d.test.cjs
```

三個指令皆 exit 0，無錯誤輸出；兩個 HTML 沒有新增 inline JavaScript。

```sh
node --test Chinese/Review-Games/tests/detective3d.test.cjs
```

新增六項：六主題實際建模、dispose 解除動畫與 focus 等待、目標不淡出／high 不淡出、平面圖固定 high、yaw／pitch／zoom 與牆界限制、固定視角與低動態終態。使用真實 vendor Three.js 幾何／矩陣；DOM、WebGL renderer、PMREM、rAF／timer 用替身。獨立執行 6 pass、0 fail。

```sh
node --test Chinese/Review-Games/tests/p0-visual.test.cjs
```

最終 exit 0：tests 9、pass 9、fail 0、cancelled 0、skipped 0、duration_ms 479.188957。未修改此測試。

開發中的驗證曾出現新增測試 mount 名稱重複（已修正）；首輪全套 103 項中 100 pass、3 fail，均屬 P0 替身與既有 pivot／標記錨點相容問題，已修正在呈現層，沒有改既有測試。高併行測試時場景建構較慢，另以暫存診斷腳本確認六主題能完整建立並結束；診斷檔不進 repo。

```sh
node --test Chinese/Review-Games/tests/*.cjs > /private/tmp/t4a-tests-final.txt 2>&1
```

最後一次實際 exit 0，輸出摘要：

```text
ℹ tests 103
ℹ suites 0
ℹ pass 103
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 27665.749879
```

包含原封不動的 `detective.test.cjs`、`detective2.test.cjs`、P0 相容測試及並行蛇梯測試，這次全部通過。新增六項亦在此最終執行中全部通過。最後再確認 high 模式即使擁擠也不縮點，優先掃描完整標籤的可用空位；補上測試斷言後重跑以上全套得到本結果。

完整 stdout／stderr 在本機 `/private/tmp/t4a-tests-final.txt`；未將暫存執行輸出放入公開 repo。

## 截圖網址與操作（供 Claude 驗收，尚未執行瀏覽器）

使用 Claude 可用的本機站台，以下以 `http://127.0.0.1:8765` 示範；本次沒有啟動此服務。

共同網址：`http://127.0.0.1:8765/Chinese/Review-Games/detective.html?g=G3A`。

選「單課」，依下表選課，開始後進入房間。v2 將檔名改為 `detective2.html`，同一年級與課次有相同主題。

| 主題 | 三上課次 | v1 可強制主題的本機網址 |
|---|---|---|
| study | 第1課〈時間是什麼〉 | `http://127.0.0.1:8765/Chinese/Review-Games/detective.html?g=G3A&qaRoom=study` |
| classroom | 第2課〈妙用便利貼〉 | `http://127.0.0.1:8765/Chinese/Review-Games/detective.html?g=G3A&qaRoom=classroom` |
| library | 第3課〈提早五分鐘〉 | `http://127.0.0.1:8765/Chinese/Review-Games/detective.html?g=G3A&qaRoom=library` |
| forest | 第4課〈水滾了〉 | `http://127.0.0.1:8765/Chinese/Review-Games/detective.html?g=G3A&qaRoom=forest` |
| lab | 第5課〈為梨花撐傘〉 | `http://127.0.0.1:8765/Chinese/Review-Games/detective.html?g=G3A&qaRoom=lab` |
| museum | 第6課〈小鉛筆大學問〉 | `http://127.0.0.1:8765/Chinese/Review-Games/detective.html?g=G3A&qaRoom=museum` |

qaRoom 是 v1 原有的 localhost／127.0.0.1 QA 參數；v2 請實際選課，不讀 qaRoom。公開站可用 `https://teacherhsu.github.io/Teaching-Materials/Chinese/Review-Games/detective.html?g=G3A`，但此次成果需 Claude 整合發布後才會出現。

請驗收 1366×900、1024×768、390×844：預設房間、探索／全部顯示、yaw 兩端、最小／最大縮放、固定視角重新載入、reset、聚焦、遮擋點轉到可見、找到線索後終態、開門、平面圖。手機全清單與 dt-target 必須保持可操作。

## 規格調整與已知限制

- 保險箱使用兩層同軸鉸鏈：舊 pivot 終態仍 -1.3 rad，第二層補足至實際 100°，同時保留既有 P0 斷言與新美術需求。
- 手機的小圓點規則僅用於 3D，平面圖遵守「固定 high」的明確規格。壅擠標記保留既有 20px 視覺錨點，但實際按鈕為 48px、偏移補償 14px。
- 鏡頭以房間中心取景；focus 在房間中心軌道上轉向、推近，不把 lookAt 移到單一物件，確保地板中心留在畫面。
- 前景木箱是低矮物件，投影重疊時隱藏；是否有足夠的局部前景層次須看截圖。
- 道具為程序幾何，沒有外加素材。沒有新增任務手冊或 v2 工具列；v2 使用共用場景與儲存設定，手冊交 T4b。
- 尚未量測 GPU 幀時間、draw calls，未做真實觸控／瀏覽器版面驗收。Node 替身通過不代表黃金樣板視覺 Gate 通過；需 Claude 截圖驗收。
