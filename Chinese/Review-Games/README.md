# 綜合複習遊戲

國語課文樂園各年級「第1～N課綜合複習」用的遊戲：課文大富翁、語文蛇梯棋、語詞哆寶、語詞賓果、形似字跑酷、課文偵探密室（五個年級都有）。網址 `?g=G1A|G2A|G3A|G4A|G6A`。

## 更新題庫（課次資料改過之後）

```bash
python3 Chinese/Review-Games/tools/build_data.py
python3 Chinese/Review-Games/tools/check_data.py   # 全部 ✅ 才能 commit
python3 Chinese/Review-Games/tools/build_shape_run.py          # 形似字跑酷：從 G6A 母版重產五個年級
python3 Chinese/Review-Games/tools/build_shape_run.py --check  # 全部 ✅ 才能 commit
```

偵探密室：`python3 Chinese/Review-Games/tools/build_detective.py` 後跑 `node --test Chinese/Review-Games/tests/detective.test.cjs`。

`data/*.js` 是產物，不要手改。完整規則見 `apps/mandarin/docs/optimization-workflow.md` 的「綜合複習遊戲」一節；設計依據見 `REVIEW-codex.md`。

## 3D 視覺架構（2026-10 視覺升級後）

設計正本是 `docs/visual-upgrade/ART-SPEC.md`；任務看板、決策與各 Gate 驗收紀錄在 `VISUAL-UPGRADE.md`。

| 檔案 | 用途 | 使用者 |
|---|---|---|
| `vendor/three-r128/` | Three.js r128 與用到的 examples，放進 repo，斷網也能載入 | 全部 3D |
| `rg3d-kit.js` | 共用玩具元件庫：材質、燈光、圓角幾何、接觸陰影、四隊角色、骰子、stage 生命週期、畫面設定列 | 大富翁、蛇梯、密室 |
| `scene3d-monopoly.js` | 大富翁黃金樣板（`RG3DMonopoly.mount`） | monopoly.html |
| `scene3d-snakes.js` | 蛇梯（`RG3DSnakes.mount`） | snakes.html |
| `scene3d.js` | 舊版共用 3D；**凍結**，只剩賓果、哆寶的 3D 背景在用 | bingo、dobble |
| `detective3d.js` | 密室剖面微縮屋，六個主題、探索鏡頭、兩種標記模式 | detective、detective2 |
| `common.css` `:root` | 設計 token（`--surface-*`、`--action`、`--team-*`、`--dur-*` 等） | 全部 |

規則：
- 3D 層只負責呈現：骰點、出題、計分都由遊戲決定。所有 Promise 在 2D、dispose 或跳過動畫時都會立刻 resolve。
- 降回 2D 的條件：系統減少動態（可用「顯示 3D」覆蓋，`RG.systemReduced()`）、`body.calm`、寬度 ≤760px、載入失敗、WebGL 失敗、context lost。
- 新增材質一律走 `RG3DKit.MAT` 或 `material()`，它會把 sRGB hex 轉成線性色彩；直接 `new MeshStandardMaterial({color:'#..'})` 會褪色。
- 物件屬性不可以和方法同名（曾經把 `this.frame` 相框蓋掉渲染迴圈 `frame()`）。
- 改了 css／js 之後，要把各 html 的 `?v=` 一起升版。

QA 截圖：

```bash
cd ~/Teaching-Materials && python3 -m http.server 5190
node Chinese/Review-Games/tools/qa/cdp.mjs 'http://localhost:5190/Chinese/Review-Games/monopoly.html?g=G3A&qaOwnAll=1' out.png Chinese/Review-Games/tools/qa/shot-monopoly.js
RM=reduce node Chinese/Review-Games/tools/qa/cdp.mjs '<url>' out.png <script>   # 模擬系統減少動態
```

- `cdp.mjs` 預設使用 swiftshader 軟體繪圖，每幀約 1 秒，**不要拿來量效能**。量效能時把參數改成 `--use-angle=metal --enable-gpu`。
- 9333 埠被殘留的 Chrome 佔住時，`cdp.mjs` 會直接報錯，先執行 `pkill -f remote-debugging-port=9333`。
- Codex 的沙盒不能開 Chrome，也不能開埠，視覺驗收一律由 Claude 截圖完成。

## 舊版 scene3d.js 說明（賓果、哆寶仍在使用）

> 以下是視覺升級前的歷史說明。「四款共用」「走 CDN」這兩點已不再成立，現況以上一節為準。

四款棋盤遊戲共用 `scene3d.js`，以 `RG3D.mount()` 建立視圖。遊戲只傳棋盤格資料，並在原流程呼叫 `moveToken()`、`rollDice()`、`setOwner()`、`focusPlayer()`、`deal()`、`markMatch()`、`markCell()`、`setLines()`；出題、計分與學習紀錄仍由原遊戲及 `common.js` 負責。

- 教學文字與互動按鈕保留 DOM；哆寶及賓果以 DOM 按鈕疊在 3D 場景上。
- Three.js r128 與 examples 的 CDN 路徑和 `Shape-Run-G6A/index.html` 相同。載入非同步，不阻擋 2D 操作；無法上網仍能沿用原本地題庫玩 2D。
- 系統減少動態、`body.calm`、螢幕寬度 ≤760px、核心 CDN 失敗／逾時、WebGL 初始化／繪圖失敗或 context lost 時回到原版。後製載入失敗只關泛光。
- 遊戲中可用畫面設定列切換減少動態與投影；此列只影響本頁。開始前的教師設定仍沿用原本儲存方式。
- 閒置時不持續渲染；隱藏頁面、降級或移除場景時會完成待等候的補間，避免卡住回合。
- 第二輪視覺：50° 俯視透視相機、程序木紋桌面、倒角木盤與暖主光／冷輪廓光；骰子完整納入取景。賓果成功格用 DOM 保證橘底白字與勾號，「一起學過」為藍底；泛光以獨立遮罩限制在成功物件。GPU 不支援浮點附件或後製失敗時保留一般 3D。

檢查：

```bash
node --check Chinese/Review-Games/common.js
node --check Chinese/Review-Games/scene3d.js
node --test Chinese/Review-Games/tests/scene3d.test.cjs
python3 Chinese/Review-Games/tools/check_data.py
```

四份 HTML 的 inline script 另需抽出後各跑 `node --check`。生命週期測試使用繪圖替身，不等於瀏覽器／GPU 驗收；實際畫面、iPad、投影與語音仍需實測，詳見 `CODEX-3D-REPORT.md`。
