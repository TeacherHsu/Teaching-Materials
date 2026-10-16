# T5：語詞賓果、語詞哆寶實作紀錄

- 執行：Codex；本機 Mac 沙盒。
- 範圍：只改本單四個檔案。依派工單覆蓋開收工流程，未執行任何 git 指令、未修改 HANDOFF；commit 由 Claude 處理。
- 已讀 ART-SPEC §1、§6，VISUAL-UPGRADE §3、REVIEW-codex 及 HANDOFF 最上三筆。未開啟 Chrome、未監聽任何埠。
- 狀態：T5 專項 11 項全過，語法與資料檢查通過；全套最終重跑 114 項全綠（早期重跑曾有 4 項並行密室測試失敗，詳見下方）。視覺與實機觸控待 Claude 截圖驗收。

## 修改檔案

1. `Chinese/Review-Games/bingo.html`：只改內嵌 CSS 與呈現用 JS。
2. `Chinese/Review-Games/dobble.html`：只改內嵌 CSS 與呈現用 JS。
3. `Chinese/Review-Games/tests/t5-bingo-dobble.test.cjs`：新增測試。
4. `Chinese/Review-Games/docs/visual-upgrade/IMPL-LOG-T5.md`：本紀錄。

未改 common、scene3d、kit、其他遊戲、偵探系列、資料、vendor、既有測試或 QA 腳本。沒有新增依賴、外部素材或題庫文字。

## 實作摘要

### 賓果

- 方塊使用 surface-1、shadow-toy、r-md、2px 高光；按壓下移 3px，已答／共學格下沉 4px。以頁面內較明確的選擇器覆蓋 common.css 舊有上浮樣式，2D／3D 背景下皆保留 DOM 文字。
- 答對仍保留橘底白字與 ✓；對抗仍用既有隊伍色。加上隊伍色圓章、1–4 編號及 ●／◆／▲／★，不更動 `.bstate` 原文字或 aria-label。新增對比測試驗證橘色與四隊底色的白字均 ≥4.5:1。
- `settle()` 先執行 `const confirmedLines = lines()`，再交給 `animateConfirmedLines()`。呈現層用自己的 Set 記錄已播連線，不更動 marked／owner／teamScore／winner／出題佇列。
- 每格相隔 120ms 亮金框；全部點亮後，棋盤外預留的橫幅顯示 BINGO! 1.2 秒。既有 3D DOM 光軌／線號牌在這頁隱藏，避免即時光軌先於序列顯示；scene3d 的狀態 API 原樣保留。
- 動畫期間棋盤與操作列 inert，另用捕獲 click 擋住連點及程式觸發點擊；結束解鎖並將焦點交回下一題。calm／系統減少動態直接完成亮框與橫幅，不排等待；中途切換也立即解鎖。
- 題目欄最小高度 220px、固定高度 240px，文字區可換行及內部捲動，操作列留在欄內；長題不會改變題框高度。≤760px 最小高度 180px，題目區明確排在棋盤前。窄版支持層詞字 28px，其他格 24px 起。

### 哆寶

- 白紙卡、紅／藍細邊、三層接觸陰影、r-lg 圓角；聽卡按鈕獨立留在卡下，卡片和按鈕之間留 20px gap 與 4px margin。
- 修正窄版／雙人內嵌 CSS 的 min-width:0，並以 `#app .stage .disc .sym` 統一保證 ≥64×52px。≤760px 每卡用一欄詞槽，避免雙欄強擠；文字不縮小補空間。
- 保留原本出題、shuffle、slots、ROT、FONT 與隨機旋轉程式。既有 common.css 的正向固定詞槽仍生效。
- 單雙人配對成功都從已高亮的 `.sym.ok` 量測位置，畫 success 色 SVG 曲線 400ms，接著出現成功徽章。SVG 遮罩保護所有語詞與朗讀按鈕，線條不覆蓋文字。徽章在預留的 32px 空間顯示。
- ResizeObserver 重算曲線；面對面模式轉回局部座標。換卡與收尾清除 SVG／徽章並斷開觀察器；舊有 DOM 光軌隱藏，3D 場景及 API 保留。
- 雙人正在選詞義的區域，外框與卡框加粗，保留既有形狀／數字角色 token，顯示「正在作答」。此模式原本可同時搶答，兩人皆進入詞義題時會同時突顯，沒有新增輪流規則。
- 計分時機與詞義題流程原樣保留；視覺成功徽章不代表已通過詞義題。

### 減少動態

兩頁都對 body.calm 與 prefers-reduced-motion 明確將動畫時間、動畫延遲、transition 時間與延遲設為 0ms；共用原有的停動畫規則也保留。狀態、成功樣式及徽章照常更新。賓果低動態橫幅保留至下一步，不以短暫顯示後立刻消失造成看不到回饋。

## 驗收指令與實際輸出

以下皆從 repo 根目錄實際執行。HTML／Markdown 不是 JavaScript，不能直接交給 Node 語法檢查；兩個 HTML 的全部 inline script 各自抽為 .js，再實際執行 node --check，新增 .cjs 直接檢查。本紀錄無可執行程式。未宣稱 HTML／Markdown 本身通過 node --check。

### 語法檢查：exit 0

執行 `node /tmp/t5-check.cjs`，腳本內容如下，供重現抽取方式：

```js
const fs = require('node:fs');
const cp = require('node:child_process');
for (const name of ['bingo', 'dobble']) {
  const html = fs.readFileSync(`Chinese/Review-Games/${name}.html`, 'utf8');
  const matches = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)];
  if (!matches.length) throw Error(`${name}: 沒有 inline script`);
  matches.forEach((m, i) => {
    const file = `/tmp/t5-${name}-inline-${i + 1}.js`;
    fs.writeFileSync(file, m[1]);
    cp.execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
    console.log(`node --check ${file}：exit 0（無語法錯誤）`);
  });
}
const file = 'Chinese/Review-Games/tests/t5-bingo-dobble.test.cjs';
cp.execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
console.log(`node --check ${file}：exit 0（無語法錯誤）`);
```

實際輸出：

```text
node --check /tmp/t5-bingo-inline-1.js：exit 0（無語法錯誤）
node --check /tmp/t5-dobble-inline-1.js：exit 0（無語法錯誤）
node --check Chinese/Review-Games/tests/t5-bingo-dobble.test.cjs：exit 0（無語法錯誤）
```

### 原邏輯保留檢查：exit 0

執行 `python3 /tmp/t5-preservation.py`：以開工前存於 `/tmp/t5-original/` 的兩份 HTML 對照；只移除本次新增的呈現 helper、呼叫、圓章與橫幅，還原原本的連線加 class 呼叫後，比對整支 inline script 逐字相同；另比對 style／inline script 以外的 HTML 外殼。

```text
✅ bingo.html：移除新增呈現層後，整支 inline script 與原檔逐字一致；HTML 外殼一致。
✅ dobble.html：移除新增呈現層後，整支 inline script 與原檔逐字一致；HTML 外殼一致。
```

### T5 專項：exit 0

指令：`node --test Chinese/Review-Games/tests/t5-bingo-dobble.test.cjs`

測試包含實際抽取腳本語法、詞塊尺寸、連線呼叫順序、120ms 逐格順序、橫幅停留、輸入鎖解除、重複線不重播、低動態零等待、單雙人 SVG 清除路徑、成功格色彩對比。

```text
✔ bingo：抽出的每支 inline script 語法正確 (2.7491ms)
✔ bingo：calm 和系統低動態將時間與延遲歸零 (1.101433ms)
✔ dobble：抽出的每支 inline script 語法正確 (0.678039ms)
✔ dobble：calm 和系統低動態將時間與延遲歸零 (0.185331ms)
✔ 哆寶：所有內嵌詞塊尺寸宣告至少 64×52，且覆蓋共用縮小規則 (0.82835ms)
✔ 賓果：連線動畫呼叫位於 settle 內 lines() 判定之後 (0.253502ms)
✔ 賓果：每格相隔 120ms，橫幅 1.2 秒後解鎖，重複連線不再播 (2.344268ms)
✔ 賓果：calm 不等待，連線與橫幅仍更新 (1.193306ms)
✔ 賓果：systemReduced 不等待，連線與橫幅仍更新 (1.045438ms)
✔ 哆寶：單雙人成功後均畫 SVG，換卡與收尾清除舊連線 (0.999947ms)
✔ 賓果：橘底及四隊成功格的白字對比至少 4.5:1 (2.820939ms)
ℹ tests 11
ℹ suites 0
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 238.342329
```

### 全套測試：最終 exit 0，114 項全綠

指令：`node --test Chinese/Review-Games/tests/*.cjs`

初次執行：113 項，109 通過、4 失敗。新增成功格對比測試後再次執行：114 項，110 通過、4 失敗。最終版再次執行相同指令後為 114 項全過，完整輸出如下。早期四個失敗皆位於另一位 Codex 負責的 `tests/detective3d.test.cjs`，本次沒有修改該範圍；不推定失敗原因。

```text
✔ G1A 每個可玩課次三級都能完成，且不能跳關 (288.011769ms)
✔ G1A 跨課綜合案件可完成 (13.200337ms)
✔ G1A 謎題資料：答案在選項內、選項不重複、線索排序唯一 (5.941462ms)
✔ G2A 每個可玩課次三級都能完成，且不能跳關 (2254.525834ms)
✔ G2A 跨課綜合案件可完成 (15.812438ms)
✔ G2A 謎題資料：答案在選項內、選項不重複、線索排序唯一 (9.865808ms)
✔ G3A 每個可玩課次三級都能完成，且不能跳關 (323.789962ms)
✔ G3A 跨課綜合案件可完成 (34.872829ms)
✔ G3A 謎題資料：答案在選項內、選項不重複、線索排序唯一 (16.960953ms)
✔ G4A 每個可玩課次三級都能完成，且不能跳關 (3006.580931ms)
✔ G4A 跨課綜合案件可完成 (671.755475ms)
✔ G4A 謎題資料：答案在選項內、選項不重複、線索排序唯一 (22.503391ms)
✔ G6A 每個可玩課次三級都能完成，且不能跳關 (955.673863ms)
✔ G6A 跨課綜合案件可完成 (23.253034ms)
✔ G6A 謎題資料：答案在選項內、選項不重複、線索排序唯一 (8.729158ms)
✔ 亂答不會過關：錯的排序、錯的鑰匙、只選結論不附證據都不通過 (1.443781ms)
✔ 最終推理：選了干擾紙條當證據不通過 (1.447204ms)
✔ 句型詞塊接受合理的另一種排法（只吃飯不喝湯／只喝湯不吃飯） (0.346583ms)
✔ 紀錄區分第一次完成與用提示完成 (1.089846ms)
✔ G1A 每課三級都能走完三幕 (87.691062ms)
✔ G2A 每課三級都能走完三幕 (188.358829ms)
✔ G3A 每課三級都能走完三幕 (102.147268ms)
✔ G4A 每課三級都能走完三幕 (416.262606ms)
✔ G6A 每課三級都能走完三幕 (171.811456ms)
✔ 〈水滾了〉：題目全部來自課次資料、對質一定要附對證物 (0.918498ms)
✔ 錯三次自動前進並記為一起學過（不卡關） (1.270329ms)
✔ 第三幕：可疑紙條不能當證據、證據不足不過 (1.0794ms)
✔ 存檔後重新載入，題目與進度一致 (4.263955ms)
✔ 一課兩篇（四上〈水陸小高手〉、六上〈樹的聯想〉）：時間線分兩條，各自判定 (2.297217ms)
✔ 六個主題皆建立有厚度的布景與可操作機關 (23684.894239ms)
✔ dispose 解除動畫與 focus 的所有等待並清空排程 (5608.776689ms)
✔ 下一步目標永遠不會遮擋淡出；high 不做遮擋淡出 (2363.536942ms)
✔ 平面圖固定 high，保留使用者的探索設定 (14.082079ms)
✔ yaw pitch 縮放夾住範圍且相機不穿後牆或左牆 (3292.569723ms)
✔ 固定視角阻止滾輪與拖曳；低動態動畫直接到終態 (3718.124619ms)
✔ qaOwnAll 僅以 view.setOwner 指派十二地，遊戲卡片保持起始值 (13.483858ms)
✔ 密室中途 calm／系統 reduce 保留同一份狀態並完成待等動畫 (36.260445ms)
✔ 密室 render throw 收斂 2D，保留 found 且清除待機動畫 (3.5446ms)
✔ 慢 CDN 返回時重新檢查 calm／force2d／disposed，不初始化 GPU (11.126706ms)
✔ 背景頁完成補間，返回只要求目前狀態的一幀 (3.065521ms)
✔ 密室 15 個標記：390／768／1024／1366、左右 yaw，矩形間隔至少 8px 且不越界 (45.280487ms)
✔ 蛇兩種規則的視圖映射與實際落點公式相同，保留原始常數 (4.743358ms)
✔ 密室核心與教學資料基線未改動 (17.995271ms)
✔ 全部題庫產物與基線 SHA256 相同 (15.510063ms)
✔ 密室 snapshot 在重建模型後還原箱門、抽屜、布告欄、齒輪與出口 (3.697505ms)
✔ 骰子 1–6：實際幾何各面的本地法向量經旋轉矩陣後只有指定面朝上 (154.800145ms)
✔ 一般擲骰包含拋起、兩次落地彈跳；最終指定面保持朝上 (94.146692ms)
✔ 四個角色底座均有各自數字 canvas 貼圖，且外形確實不同 (385.659791ms)
✔ calm hop 每格 80ms，全程 y 不變，idle 與 cheer 不播放 (75.905592ms)
✔ dispose 完成所有等待補間，並移除 rAF 與事件監聽 (27.832982ms)
✔ 閒置不排 rAF；同名替換、頁面隱藏均解除等待 (26.51354ms)
✔ calm 初始降級不載入引擎，切換後可恢復 (17.292316ms)
✔ reduced 初始降級不載入引擎，切換後可恢復 (13.391581ms)
✔ narrow 初始降級不載入引擎，切換後可恢復 (18.63808ms)
✔ context lost 與 WebGL 初始化失敗都回 2D (28.822209ms)
✔ 連續慢幀先降 light，再降 2D，每次都解除等待 (20.937137ms)
✔ 引擎載入失敗不會留下等待或 timer (4.483352ms)
✔ 引擎載入逾時不會留下等待或 timer (2.750152ms)
✔ 材質共用、木紋共圖；renderer 品質設定符合規格 (22.895072ms)
T1B 全購地幾何預算 {"triangles":51434,"calls":138,"canvasTextures":8,"textureSizes":[[512,512],[256,256],[128,128],[512,896],[128,128],[128,128],[128,128],[128,128]]}
T1B 相機外框投影 620 0.8999901988320776
T1B 相機外框投影 800 0.8999901988320775
T1B 相機外框投影 1024 0.8999901988320776
T1B 相機外框投影 1366 0.8999901988320776
T1B 相機外框投影 1920 0.8999901988320776
R2 最小角色投影高度 41.082107414063586
R2 可見牆面比例 1 0.4538834951456311
R2 可見牆面比例 2 0.45823389021479716
R2 可見牆面比例 4 0.6102564102564103
R2 可見牆面比例 5 0.6201550387596899
R2 可見牆面比例 7 0.4752475247524752
R2 可見牆面比例 8 0.4669926650366748
R2 可見牆面比例 11 0.47702407002188185
R2 可見牆面比例 12 0.4631578947368421
R2 可見牆面比例 14 0.39950372208436724
R2 可見牆面比例 15 0.4024691358024691
R2 可見牆面比例 17 0.5751173708920188
R2 可見牆面比例 18 0.5841121495327103
R1 library [ 1.6217881877247882, 0.638392840711666, 0.9552238592460975 ]
✔ 載入失敗及 2D 模式：所有方法立即完成，保留呈現狀態 (111.440659ms)
✔ 真實幾何初始化、未售只有地基，購地後六種建築出現；相同課旗串 (1259.406756ms)
✔ dispose 解除等待中的逐格 hop、骰子及購地，所有後續方法立即完成 (960.980062ms)
✔ 四隊同格維持獨立中央槽，且只為當前隊伍播放 idle (1357.772199ms)
✔ rollDice 1–6 完成後真實旋轉矩陣的指定面朝上 (1093.556034ms)
✔ 全購地、四角色與六條旗串的最壞情境預算 (2357.952332ms)
✔ 只有模式改變才通知；2D 期間更新的棋子與地產在恢復時同步 (1195.40322ms)
✔ hop 壓縮只發生在落地之後，停止 idle 不留下補間 (1612.669445ms)
✔ Resize／標籤 DOM 更新不會遞迴觸發 stage.refresh (1569.274414ms)
✔ 斜俯視相機在各驗收寬度維持完整外框與水平留白 (1558.374993ms)
✔ 單隊居中，多隊展開 ±.40 槽位，離開後剩餘棋子回中央 (1432.720845ms)
✔ 1024 頁面棋盤寬 690：20 格四角色實際幾何投影至少 40px (2402.614456ms)
✔ 全購地每棟建築可見紙色牆面，外框完整且仰角 48 度 (2426.809104ms)
✔ 中央靜態擺設高度、主景尺寸與木牌字高 (1123.21335ms)
✔ 四隊同格頭部可見、底座號牌不互擋且保留最上層繪製 (1678.736307ms)
✔ 真實幾何：每條蛇的頭在高號格、尾端在低號格，環紋及漸細方向正確 (718.132671ms)
✔ 真實幾何：梯子兩端完全對應 LADDERS，斜高 .15 且橫桿等距 (541.130248ms)
✔ dispose 同時解除等待中的滑蛇、爬梯、逐格跳與骰子 Promise；後續呼叫立即完成 (801.611995ms)
✔ 同一格四隊棋子的真實不透明幾何 XZ 不重疊，離開後恢復單隊中央 (946.780907ms)
✔ 爬梯每階120ms；滑蛇先眨眼點頭再沿曲線滑900ms，最後到達實際落點 (708.292042ms)
✔ 低動態、窄螢幕與 WebGL 失敗：所有 API 立即 resolve，2D 狀態可恢復 (68.443764ms)
✔ 降級、隱藏與 context lost 解除等待者；重新啟用同步最後位置 (3516.006891ms)
✔ 格號、事件小標與步數各自投影；事件有步數時往底邊讓位 (743.533228ms)
✔ HTML 僅替換呈現入口，遊戲規則與 QA 選擇器保留 (1.354845ms)
✔ 減少動態與其他遊戲的窄螢幕不載入 CDN，仍保留棋子與地產狀態 (21.863554ms)
✔ 大富翁手機版用低成本 3D 呈現完整棋盤 (3.578242ms)
✔ 切換減少動態會完成補間並解除等待；恢復時重建目前狀態 (7.983514ms)
✔ 系統動態設定優先於面板，變更投影不會重設遊戲狀態 (8.706717ms)
✔ CDN 失敗與逾時皆保留 2D，沒有未處理的拒絕 (5.938856ms)
✔ CDN 等待期間開啟減少動態，不建立 renderer (2.713365ms)
✔ 移除載入中的視圖後，不重新啟動 renderer (2.746267ms)
✔ 頁面隱藏時補間直接完成，不阻擋回合流程 (3.459653ms)
✔ WebGL 初始化失敗仍可保存遊戲狀態 (2.994591ms)
✔ CDN 等待期間已找到的詞，不會被延遲的發牌清除 (5.561262ms)
✔ 2D 期間的賓果記號、連線會留在同一份視圖狀態 (2.78802ms)
✔ 泛光遮罩完成後還原場景、字卡與 render target (6.308089ms)
✔ 泛光遮罩失敗後還原場景、字卡與 render target (3.326393ms)
✔ 固定骰序含連續同點數：每次仍完整旋轉，終態回指定面與原位 (4.371096ms)
✔ 2D 擲五點後同步 3D：指定面復原且不重擲 (2.543481ms)
✔ 陰影品質依連續活躍幀降級，閒置不列入慢幀，終態保留 (14.116425ms)
✔ overlay 清理不釋放 View 共用紋理，獨有資源去重釋放 (3.042124ms)
✔ 美術視圖不呼叫遊戲的 Math.random (2.630479ms)
✔ T16：四款 2D 降級仍保留任務與完成物件，重複完成不改棋子狀態 (9.871905ms)
✔ T16：overlay 入場限 450ms，略過立即到位且不重播 (2.888841ms)
✔ bingo：抽出的每支 inline script 語法正確 (6.379045ms)
✔ bingo：calm 和系統低動態將時間與延遲歸零 (1.353933ms)
✔ dobble：抽出的每支 inline script 語法正確 (1.847739ms)
✔ dobble：calm 和系統低動態將時間與延遲歸零 (0.408023ms)
✔ 哆寶：所有內嵌詞塊尺寸宣告至少 64×52，且覆蓋共用縮小規則 (1.446478ms)
✔ 賓果：連線動畫呼叫位於 settle 內 lines() 判定之後 (0.501061ms)
✔ 賓果：每格相隔 120ms，橫幅 1.2 秒後解鎖，重複連線不再播 (6.656696ms)
✔ 賓果：calm 不等待，連線與橫幅仍更新 (2.260258ms)
✔ 賓果：systemReduced 不等待，連線與橫幅仍更新 (2.288489ms)
✔ 哆寶：單雙人成功後均畫 SVG，換卡與收尾清除舊連線 (1.313904ms)
✔ 賓果：橘底及四隊成功格的白字對比至少 4.5:1 (5.692005ms)
ℹ tests 114
ℹ suites 0
ℹ pass 114
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 39085.647582
```

早期首次全套測試的四項失敗原始明細（歷史紀錄，最終重跑已通過）：

```text
test at Chinese/Review-Games/tests/detective3d.test.cjs:62:1
✖ 六個主題皆建立有厚度的布景與可操作機關 (455.032405ms)
  AssertionError [ERR_ASSERTION]: study
  
  false !== true
  
      at TestContext.<anonymous> (/Users/hsuchiafang/Teaching-Materials/Chinese/Review-Games/tests/detective3d.test.cjs:65:10)
      at async Test.run (node:internal/test_runner/test:1208:7)
      at async startSubtestAfterBootstrap (node:internal/test_runner/harness:385:3) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: false,
    expected: true,
    operator: 'strictEqual',
    diff: 'simple'
  }

test at Chinese/Review-Games/tests/detective3d.test.cjs:76:1
✖ 下一步目標永遠不會遮擋淡出；high 不做遮擋淡出 (343.354222ms)
  TypeError: Cannot set properties of undefined (setting 'intersectObjects')
      at TestContext.<anonymous> (/Users/hsuchiafang/Teaching-Materials/Chinese/Review-Games/tests/detective3d.test.cjs:79:33)
      at async Test.run (node:internal/test_runner/test:1208:7)
      at async Test.processPendingSubtests (node:internal/test_runner/test:831:7)

test at Chinese/Review-Games/tests/detective3d.test.cjs:88:1
✖ yaw pitch 縮放夾住範圍且相機不穿後牆或左牆 (295.123245ms)
  AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:
  
    assert.ok(Math.abs(room.yaw)<=.9)
  
      at TestContext.<anonymous> (/Users/hsuchiafang/Teaching-Materials/Chinese/Review-Games/tests/detective3d.test.cjs:91:9)
      at async Test.run (node:internal/test_runner/test:1208:7)
      at async Test.processPendingSubtests (node:internal/test_runner/test:831:7) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: false,
    expected: true,
    operator: '==',
    diff: 'simple'
  }

test at Chinese/Review-Games/tests/detective3d.test.cjs:96:1
✖ 固定視角阻止滾輪與拖曳；低動態動畫直接到終態 (278.792265ms)
  TypeError: Cannot read properties of null (reading 'domElement')
      at TestContext.<anonymous> (/Users/hsuchiafang/Teaching-Materials/Chinese/Review-Games/tests/detective3d.test.cjs:98:25)
      at async Test.run (node:internal/test_runner/test:1208:7)
      at async Test.processPendingSubtests (node:internal/test_runner/test:831:7)
```

### 資料檢查：exit 0

指令：`python3 Chinese/Review-Games/tools/check_data.py`

```text
✅ G1A（一上）7 課、282 題 {'zhuyin': 69, 'reading': 27, 'lookalike': 69, 'gist': 7, 'meaning': 71, 'idiom': 39}
✅ G2A（二上）6 課、285 題 {'zhuyin': 80, 'reading': 28, 'lookalike': 46, 'gist': 6, 'meaning': 91, 'idiom': 34}
   提醒： 語詞有重複（跨課同詞，遊戲會自動去重）
✅ G3A（三上）6 課、326 題 {'zhuyin': 72, 'reading': 24, 'lookalike': 112, 'gist': 6, 'meaning': 78, 'idiom': 34}
✅ G4A（四上）6 課、360 題 {'zhuyin': 90, 'reading': 24, 'lookalike': 117, 'gist': 6, 'meaning': 90, 'idiom': 33}
✅ G6A（六上）6 課、478 題 {'zhuyin': 94, 'reading': 24, 'lookalike': 209, 'gist': 6, 'meaning': 96, 'idiom': 49}
```

## 與規格不一致之處

- 最終自動驗收全通過；視覺仍需 Claude 截圖驗收。早期四項並行密室測試失敗於最終重跑均通過，未觸碰並行範圍。
- scene3d 背景維持原狀，採用本單允許的保留路徑；未將它移植到 kit。
- 沒有改哆寶原始旋轉程式；正向詞槽沿用既有共用 CSS，符合本單要求保留位置／旋轉邏輯。
- 尺寸微調：題框 240px 固定高度與內捲、窄版哆寶單欄詞槽、徽章預留 32px，皆為避免題框位移與覆字；不改字詞及操作判定。

## 截圖網址（供 Claude 執行，本次未啟動）

以下假設靜態伺服器以 repo 根目錄為根，使用 QA 工具說明中的 5190 埠。`?g=G3A` 使用既有年級入口；對抗模式由腳本操作選單，沒有增加新的網址參數。

| QA 腳本 | 截圖網址 |
|---|---|
| `tools/qa/play-bingo.js` | `http://localhost:5190/Chinese/Review-Games/bingo.html?g=G3A` |
| `tools/qa/play-bingo-versus.js` | `http://localhost:5190/Chinese/Review-Games/bingo.html?g=G3A` |
| `tools/qa/play-dobble.js` | `http://localhost:5190/Chinese/Review-Games/dobble.html?g=G3A` |

建議另驗：calm、窄版 390／760、桌機 1366、雙人面對面、真正完成一條線後的序列與橫幅。原有 bingo QA 腳本每題只等 900ms；若該題完成連線，新的輸入鎖可能仍啟用，驗收器應等待 `.bgrid.inert === false` 再按下一題。本單沒有修改既有 QA 腳本。

## 已知問題與驗收界線

- 早期曾有四項 detective3d 測試失敗：study 布景斷言、未建立 raycaster、yaw 夾值斷言、renderer 為 null；最終同一全套指令已全綠。沒有修改或修復並行檔案。
- 未以瀏覽器驗證 CSS 實際排版、SVG 視覺路徑、投影字級、iPad 觸控或 WebGL 降級外觀；靜態／Node 檢查不等於截圖通過。
- 窄版挑戰層每卡八詞，保留 64×52 下限及字級，因此可能需要垂直捲動；不以縮字壓進單一畫面。
- 沒有執行 commit／push，交由 Claude 整合。
