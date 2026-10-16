# T1A 實作紀錄

- 日期：2026-10-16；機器：本機 Mac 沙盒；執行：Codex。
- 狀態：程式與 Node 驗證完成；**HTTP 驗收受沙盒限制，尚未全部驗收通過**。依派工單「做不到時，停下來寫進 log」停止後續實作。
- 已完整讀取 `ART-SPEC.md`、`VISUAL-UPGRADE.md`，以及 `HANDOFF.md` 最新三筆；參考現行 `scene3d.js` 載入與生命週期、既有測試替身。
- 依本單指示，未執行任何 git 指令、未 commit／push；未修改 HANDOFF.md，交接及整合由 Claude 處理。沒有啟動 Chrome 或截圖。

## 檔案清單

修改：
- `Chinese/Review-Games/common.css`：新增 §1 token，原有 token／樣式保留；新增 calm 與系統減少動態的時長歸零規則。

新增：
- `Chinese/Review-Games/rg3d-kit.js`
- `Chinese/Review-Games/docs/visual-upgrade/kit-showcase.html`
- `Chinese/Review-Games/tests/rg3d-kit.test.cjs`
- `Chinese/Review-Games/docs/visual-upgrade/IMPL-LOG-T1A.md`

未修改 scene3d.js、detective 系列、遊戲 HTML、data、tools、vendor、Shape-Run 與既有 tests；無新增網路依賴。

## 對外 API

使用前先 `await RG3DKit.load()`；公開物件為 `window.RG3DKit`。

| API | 行為 |
| --- | --- |
| `load({effects = false})` | 本地 vendor 載入 Three r128、RoundedBoxGeometry、RoomEnvironment；effects 為 true 才依相依順序載入後製。以 currentScript.src 與字串組路徑，沒有 new URL。每支腳本 6500ms 逾時，失敗可重試。 |
| `TOKENS` | press=150、select=220、correct=600、reward=900、dice=1200（ms），teams 為四隊色。 |
| `LIGHT` | hemisphere、key、fill 設定；數值依美術規格。 |
| `MAT.wood / woodDark / paper / felt / gold / ink` | 延遲建立並共用 MeshStandardMaterial；木紋同圖，毛氈為獨立確定性雜訊圖。 |
| `MAT.plastic(color)` | 依色彩字串快取霧面塑膠材質。 |
| `roundedBox(w,h,d,r,seg=3)` | 回傳 vendor RoundedBoxGeometry。 |
| `blobShadow(size=1,opacity=.23)` | 回傳接觸陰影平面，y=.002。 |
| `createRenderer(quality='standard')` | 透明 renderer、sRGB、ACES、曝光 1.05；high/standard/light DPR 上限 2/1.5/1。 |
| `addStudioLights(scene,quality)` | 加入並回傳 `{hemi,key,fill}`，light 不開陰影。 |
| `piece(team)` | team 為 0–3；回傳含角色、底座數字貼圖、接觸陰影的 THREE.Group。 |
| `piece.idle({active,calm,stage})` | active=true 才播一次 2400ms 呼吸週期；目前隊伍若要持續待機，由呼叫端在適當時機續播。 |
| `piece.hop(from,to,{calm,stage})` | from/to 為含 x/y/z 的位置；220ms 弧線、朝向前進方向及壓縮；calm 改 80ms 無弧位移。 |
| `piece.cheer({calm,stage})` | 600ms 跳躍及旋轉；calm 直接完成。 |
| `dice()` / `dice.roll(n,{calm,stage})` | 回傳骰子群組，n 必須為 1–6；一般 1200ms，拋起、兩次彈跳、停在指定面；calm 直接對準並用 150ms 淡入。 |
| `createStage({host,quality,onMode})` | 回傳 stage；`stage.ready` 可等待初次載入／降級完成。onMode 收到 `(is3D,reason)`。 |
| `stage.scene / camera / renderer` | 初始化成功後可組裝場景；scene.userData.stage 讓其下元件自動尋找 stage。 |
| `stage.tween(name,ms,fn)` | fn 接收 0–1；回傳 Promise。同名替換、隱藏、降級、dispose 都套用終態並 resolve。 |
| `stage.draw / resize / refresh / visibility / dispose` | 單次繪圖、尺寸同步、設定重查、頁面可見處理、去重釋放與移除監聽。 |

元件動作回傳 Promise；可由選項指定 stage，也可從父場景尋找。未掛載 stage 時直接套用最終狀態，避免產生另一套無法追蹤的動畫迴圈。

stage 只在有補間時排 rAF；系統減少動態只透過 `RG.systemReduced()` 判斷，尊重 common.js 既有覆蓋設定。calm、寬度 ≤760px、載入失敗／逾時、WebGL 失敗、context lost 降回 2D；頁面隱藏完成所有補間。慢幀沿用 scene3d 的語意：先略過 30 幀，90 幀取 p95，連續兩窗超過 22ms 時降 light；light 連續兩窗超過 28ms 再降 2D。降級時等待者均完成。

共享 MAT／貼圖保留供下一個 stage 使用；stage.dispose 只釋放場景幾何、物件獨有材質、環境 render target、陰影與 renderer，避免破壞其他 stage。

## 數值與呈現決定

- CSS token 全照規格；輔助操作文字色另命名 `--action-soft-ink: #1f4f87`，讓表內底色和文字色都有可用 token；原本 `--ink` 已相同，保留原定義。
- felt 採 256×256、14000 次低對比點描；規格未指定尺寸，採小圖減少成本。木紋為指定的 512×512，110 條低對比曲線沿同方向；不呼叫 Math.random，不影響遊戲骰序與出題亂數。
- 棋子底盤直徑 .78，中央圓柱厚 .10，兩道半徑 .025 的圓邊形成約 .12 厚度；數字徽章半徑 .115、128×128 白底粗體，置於底座朝前的頂面，避免被身體遮住。
- 角色用約 .95 高的獨立外形；背包、天線、背刺、書翼分別提供不同剪影；眼睛半徑 .029，腮紅半徑 .037，確保臉有方向。
- 骰子保留指定 .9 邊長與 .14 圓角。將圓角殼的六面中心移除，以有圓孔的面補回，骰點採半徑 .066、深度約 .016 的內凹半球，避免黑珠凸出表面。
- 陳列桌面 17×.20×10，球半徑 .28；角色橫距 1.6，材質球橫距 .95，讓兩排物件保持間隔。
- 陳列鏡頭 fov 32、位置 (0,7.8,9.8)，看向 (0,.2,0)，host 高 580px；透明畫布用橢圓 mask 淡回頁底，避免桌面硬切的空白色帶。
- silhouette 角色縮放 .45；依上述取景估計約 40px 高，實際像素尺寸待 Claude 截圖量測。
- `?shot=hop|cheer` 僅在陳列頁將補間取樣固定為 50%，用於可重現的動作姿勢；一般按鈕與共用庫動畫仍跑完整時長。dice6 跑完整擲骰並停在六朝上；idle 播第一隊一個呼吸週期；silhouette 不播動作。

## 實際驗收

### 語法

```sh
node --check Chinese/Review-Games/rg3d-kit.js
node --check Chinese/Review-Games/tests/rg3d-kit.test.cjs
```

兩者均 exit 0，無錯誤輸出。另用 Python 從新增 HTML 抽出 inline script 至 `/private/tmp/rg3d-kit-showcase-inline.js`，實際執行：

```sh
node --check /private/tmp/rg3d-kit-showcase-inline.js
```

exit 0，無錯誤輸出。未修改 common.js。

### Node 測試

```sh
node --test Chinese/Review-Games/tests/rg3d-kit.test.cjs
```

實際摘要：tests 14 / pass 14 / fail 0 / cancelled 0 / skipped 0，duration 約 757ms。

```sh
node --test Chinese/Review-Games/tests/*.cjs
```

實際摘要：tests 72 / pass 72 / fail 0 / cancelled 0 / skipped 0，duration 約 4524ms。原有 58 項與新增 14 項全部通過。

新增涵蓋：六種點數的真實旋轉矩陣、一般擲骰三段離地高度、四隊數字貼圖、calm hop 全程 y 不變、dispose 解除所有等待、同名補間替換、隱藏頁面、三種初始降級及恢復、context lost、初始化失敗、慢幀兩階段降級、載入失敗／逾時、材質共用與 renderer 參數。

### HTTP（受阻，未通過）

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

實際 exit 1：`PermissionError: [Errno 1] Operation not permitted`，失敗於 socket.bind，並非網站程式錯誤。沙盒禁止監聽連接埠，未嘗試繞過限制。

```sh
curl --connect-timeout 3 -sS -o /dev/null -w 'kit-showcase.html HTTP %{http_code}\n' http://127.0.0.1:8765/Chinese/Review-Games/docs/visual-upgrade/kit-showcase.html
curl --connect-timeout 3 -sS -o /dev/null -w 'rg3d-kit.js HTTP %{http_code}\n' http://127.0.0.1:8765/Chinese/Review-Games/rg3d-kit.js
```

兩個實際結果均為 curl exit 7、HTTP 000，`Couldn't connect to server`。**沒有取得 200，不能宣稱 HTTP 驗收通過。** 請 Claude 在可開埠的環境重跑。

## 偏離規格與待確認

- HTTP 200 驗收未能完成；已依紀律停止。Chrome 截圖依派工交由 Claude。
- idle 提供單一呼吸週期，沒有自行無限續播；整合時需由當前隊伍控制續播與停止，避免非當前隊伍持續排程。
- hop 的 6% 壓縮安排於補間末段，當時弧線尚未完全落地；落地後壓縮的時序仍需調整才能嚴格符合 §2.5。
- 機器人天線頂端使用 gold；§2.3 限制 gold 用於寶箱、獎章、旗桿頂端，此處需改回塑膠。此為實作落差，並非修改美術規格。
- stage 沿用 common.js 的設定語意，但沒有自行插入「畫面設定」列；陳列頁只有本單要求的 calm 按鈕，投影與系統覆蓋 UI 尚未加入。整合時要確認 §2.7 的設定列要求。

## Claude 截圖網址

在 repo 根目錄啟動 `python3 -m http.server 8765 --bind 127.0.0.1`，建議 1366×900；等待 `window.__ready === true`，並檢查 `window.__stage.active === true` 才算 3D 截圖。

- http://127.0.0.1:8765/Chinese/Review-Games/docs/visual-upgrade/kit-showcase.html?shot=idle
- http://127.0.0.1:8765/Chinese/Review-Games/docs/visual-upgrade/kit-showcase.html?shot=hop
- http://127.0.0.1:8765/Chinese/Review-Games/docs/visual-upgrade/kit-showcase.html?shot=cheer
- http://127.0.0.1:8765/Chinese/Review-Games/docs/visual-upgrade/kit-showcase.html?shot=dice6
- http://127.0.0.1:8765/Chinese/Review-Games/docs/visual-upgrade/kit-showcase.html?shot=silhouette

另驗證 calm 按鈕切換至 2D 後，再關閉可回 3D，以及 roll 1–6 的最終朝向。系統開啟減少動態時會尊重 RG.systemReduced() 降回 2D，須使用 common.js 原有覆蓋設定或暫時關閉系統減少動態才可審查 3D。

## 已知問題

- 尚未在真實 WebGL／瀏覽器視覺驗收：木紋強度、面孔可見性、底座數字大小、骰點凹面光影、40px 剪影、淡出邊緣與標籤對齊均需 Claude 確認。
- Node 使用真實 vendor 幾何／矩陣，但 renderer、PMREM 與 DOM 採替身；不代表 GPU 效能或實機互動驗收。
- hop／cheer 的 shot 頁停在取樣姿勢，適合截圖；要操作完整動畫請另開 idle 頁。
- 測試尚未覆蓋 effects 的成功載入序列與真實 PMREM GPU 初始化。
- 除上述明列落差與 HTTP 阻礙外，未變更遊戲規則、公開 API 或教材資料。

## Claude 驗收（2026-10-16）
- HTTP 與截圖由 Claude 補做：kit-showcase 的 idle、hop、dice6、silhouette 都是 `__stage.active=true`。
- **退回修正（由 Claude 直接修改）**：材質與燈光的 hex 色沒有 `convertSRGBToLinear()`，在 sRGB 輸出下整體褪色、偏粉。已在 `material()` 與 `addStudioLights()` 統一轉換。另外加強木紋對比，底座數字徽章從半徑 .115 放大到 .17。
- 修正後截圖：`shots/t1a-kit.jpg`。材質分得出來，四個角色的灰階剪影也可以區分。
- 轉入 T1B 的待辦：idle 由場景控制續播；hop 落地壓扁的時序；機器人天線頂端改用塑膠材質；畫面設定列。
