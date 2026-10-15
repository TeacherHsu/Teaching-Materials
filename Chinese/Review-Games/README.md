# 綜合複習遊戲

國語課文樂園各年級「第1～N課綜合複習」用的遊戲：課文大富翁、語文蛇梯棋、語詞哆寶、語詞賓果、形似字跑酷（五個年級都有）。網址 `?g=G1A|G2A|G3A|G4A|G6A`。

## 更新題庫（課次資料改過之後）

```bash
python3 Chinese/Review-Games/tools/build_data.py
python3 Chinese/Review-Games/tools/check_data.py   # 全部 ✅ 才能 commit
python3 Chinese/Review-Games/tools/build_shape_run.py          # 形似字跑酷：從 G6A 母版重產五個年級
python3 Chinese/Review-Games/tools/build_shape_run.py --check  # 全部 ✅ 才能 commit
```

`data/*.js` 是產物，不要手改。完整規則見 `apps/mandarin/docs/optimization-workflow.md` 的「綜合複習遊戲」一節；設計依據見 `REVIEW-codex.md`。

## 四款棋盤遊戲的 Three.js 3D 視圖

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
