# 第一人稱探索實作紀錄（2026-10-22）

狀態：**待 CF 試玩確認**。本輪只改檔，沒有執行任何 git 指令、部署或瀏覽器操作。Claude 負責瀏覽器實玩與截圖，再處理試作分支的 commit／push；不得發布 main。

## 修改與依據

| 檔案 | 修改 | 依據 |
|---|---|---|
| `src/data/firstPersonLesson.js` | version 3；四段分四幕，每幕一個全文劇情站與一個兩題關卡，共八站八題；集中入口導讀、回顧、PIRLS、圖像類別、原句索引／雜湊、選項錯因與三級提示 | 本單 1、3、6、7；既有核准題庫及正式密文段句。原始教材與密碼僅本機使用 |
| `src/activities/firstPersonCore.js` | 逐題完成、排序與配對序列判定、提示累計與 1–3 水滴；保存題次，錯答保留線索；版本變更重建進度 | 不扣體力、不限時、不清錯答進度；提示使用越多仍至少獲一滴 |
| `src/pages/FirstPersonPage.js` | 全文站→挑戰；看圖、排序、配對、場景按鈕作答；逐題回原句；關卡一覽、重玩與正常 classroomKey 教師解鎖；10 秒閒置提示、邊緣箭頭、側面定點、四項回顧 | 本單 1–4、6、8；ART-SPEC 的定點引導與標記熱區。教師預覽不偽造前面完成紀錄 |
| `src/activities/firstPersonScene.js` | 加側面觀察鏡位；握點增加包住勺柄的指節 | CF 的握持與多角度檢視回饋；沿用已有中空鍋／勺、比例、兩節手臂與連續運動，不宣稱幾何通過等於美感合格 |
| `src/styles/first-person.css` | 柔和目標環、畫面外箭頭、圖片選項、場景動作區與返回按鈕；縮窄桌機目標文字區避免碰工具列 | 不讓文字擋住鍋與動作；44px 以上操作區、減少動態 |
| `scripts/test-first-person.mjs` | 兩題流程、錯答保留、錯因／提示／PIRLS／依據、正解分布、正式密文全文覆蓋與所有引用雜湊 | 本單新增驗收。無密碼時明示略過正式覆蓋檢查 |
| `docs/first-person-exploration.md`、根目錄 `HANDOFF.md` | 新流程、檢查結果與接手清單 | 狀態保留待 CF 試玩確認 |

選擇類題目（含看圖、場景三選一）正解位置為 0／1／2 各兩題；排序、配對用序列答案，不混進位置統計。場景作答以場內動作按鈕選擇，抽柴後可先觀察，再回題目；不要求精準拖曳 3D 物件。圖片為本地 inline SVG 示意，另保留文字與朗讀。

參考〈鳥〉僅採用使用者指定的「幕／關／劇情站、體驗→原句→挑戰」結構，未取得或複製其程式、文字、素材。美術依現有 `Chinese/Review-Games/docs/visual-upgrade/ART-SPEC.md` 正本；沒有新增外部素材或依賴。未找到 `phase2_workspace_diff.md`，沒有依賴其內容做改動。

## 指令與結果

在 `apps/mandarin`：

- `npm run validate`：通過；55 課資料與正式密文外洩檢查通過（全站 14.7%，門檻 20%）。正式密碼由既有 helper 讀本機檔，沒有略過。
- `node scripts/test-first-person.mjs`：通過；正式全文 **45 句**全部有站點引用，所有站點／題目引用雜湊與正式密文一致；逐題錯因、三級提示、正解分布與存檔通過。
- `node scripts/test-first-person-motion.mjs`：通過；1601 個舀水姿勢的比例、固定臂長、握持、避鍋、倒回與循環連續性。
- 以 Python subprocess 逐支執行 `scripts/test-*.mjs`：**82 支，0 失敗**。
- `npm run build`：通過。Vite 提示既有 CharacterStoryPage 同時靜態／動態匯入；未改該模組。
- `npm run check-dist`：通過，1300 筆引用均存在；`check-assets` 1606 個資產通過。
- `npm run build:preview`：通過；供 Claude 後續 draft 預覽使用。
- `node --check src/pages/FirstPersonPage.js`：通過。
- 修改檔空白字元檢查（Python，行尾空白／衝突標記）：通過。
- `git diff --check`：**未執行**，本單明令禁止任何 git 指令；不得當成通過，請 Claude 提交前補跑。

本輪早期測試曾抓到選項位置分布不均，已同步第一關的選項、錯因與正解索引後重跑通過。一次暫存編輯命令因工作目錄不同未寫入，已在正確根目錄重跑。最終重建曾在 repo 根目錄執行而遇到 package.json 不存在，已改在 apps/mandarin 重跑。沒有因缺正式密碼略過的檢查。沒有修改公開教材 JSON 或密文。

## Claude 瀏覽器驗收（尚未執行）

使用 `tools/qa/cdp.mjs`，截圖與報告存 repo 外；含原文的截圖不可提交公開 repo。不要設置密碼旁路或測試解鎖入口，使用正常教室密碼門。若已解鎖，可在關卡一覽再次輸入正式教室密碼取得教師跳關；密碼不得出現在終端輸出、CDP 記錄或截圖。

啟動：在 `apps/mandarin` 執行 `npm run preview -- --host 127.0.0.1 --port 4175`。正式建置網址：

`http://127.0.0.1:4175/#/lesson/115AG3H04/explore`

若 Vite 顯示的 base 不同，沿其 Local 網址接 `#/lesson/115AG3H04/explore`。另可 `npm run preview:draft -- --host 127.0.0.1 --port 4176` 檢查預覽建置。兩者都只在本機預覽，不部署。

1. 桌機 1366×900、手機 375×812、平板 820×1180 各跑完整八站。全新瀏覽器從第一劇情站開始，核對第1–4段完整出現，關卡各兩題；選擇、排序（可重新排列）、配對、圖片與場景動作皆實際操作。測錯答、三級提示、原句返回、重新載入、已完成關卡重玩、教師跳關與錯密碼。重玩不應清除既有完成紀錄。
2. 第二幕關卡點「觀察康康舀水」，面板關閉時連續播放至少八秒。正面用起始視角「↶」，側面用「側」按鈕；每個角度截入水、舀起、抬高、傾倒、回位與循環接點。可觀察 `.fp-world` 的 `data-ladle-phase`／`data-ladle-roll` 判斷階段，但不能用屬性代替目視驗收。
3. 比對鍋沿是否低於人物、手掌是否留在湯外且握住柄、指節是否合理包柄、勺碗是否真的中空、手臂有無穿鍋／身體、水流有無落回鍋內；看八秒連續動作是否流暢。手機側面取景也須檢查全套動作。保留 CF 對比例與美感的最終判定。
4. 第四幕場景動作題選錯誤動作確認不清進度；再選抽出部分柴火，停留場景觀看後按「觀察後回到題目」。檢查抽柴握持、火與水的靜態結果及結尾四項回顧。
5. 環顧至目標離屏，確認方向箭頭能帶回定點；停十秒查看溫和提示。檢查目標環、上方任務、底部字幕、場景動作按鈕不遮鍋與手。若不合格請繼續調整，不可因數值測試通過而勾選美術合格。
6. Tab／Enter／方向鍵與觸控分別操作；音效預設關、動畫可關、系統 reduce 有效。阻擋本地 Three.js 或模擬 context lost，確認 SVG 與同一八站／題目流程仍可完成。
7. 每個尺寸檢查 `scrollWidth <= clientWidth`、console 無錯誤、network 無外部請求；離頁／返回沒有殘留音效或重複動畫。記錄瀏覽器版本、尺寸與截圖檔名。

## 仍未驗收

Claude 的桌機／手機／平板瀏覽器完整實玩、正面／側面截圖、主控台、外部請求、水平溢出與連續動作目視皆尚待執行。實機 iPad、教室電腦效能、臺灣國語朗讀與音量、CF 美感確認、學生理解成效亦尚未驗收。不得把本輪標成已可正式發布的黃金樣本。

## 插畫版（2026-10-22）

狀態：**待 CF 試玩確認**。本段取代上方 3D 畫面驗收項目；八站、題目、提示、進度、導引、關卡一覽與正常密碼流程沿用。全程未執行 git，未開 Chrome、未部署；commit／push 由 Claude 處理。

### 改動與依據

- 新增 `src/activities/firstPersonIllustrated.js`，沿用 `mountFirstPersonScene` controller 契約；頁面換 import，舊 Three.js 場景與 motion 測試保留。新增百分比熱點／定點與七張圖清單在 `firstPersonLesson.js`，教材 version 不變，避免清除既有閱讀進度。
- 水彩／不透明水彩插畫依本機核可 `s1-entrance.png`、`s2-pot.png`、新版 `s3-fire.png`；本機 `~/mandarin-work/reading-tool-lessons/115HG3A04.json` 僅讀取核對，未複製原句或官方檔案。玩家仍是探索者眼睛，無觀看者的手，無新原文動作、噴湯、倒數或驚嚇。
- 幕1改背柴與無日式短冊的陶瓷風鈴；幕2縮鍋、舀起／抬高／倒回三格；幕3跟著康康看灶下；幕4工具抽柴與火小、水靜的之後狀態。四幕人物維持白髮米衣棕圍裙／黑髮橘紅衣。
- 圖片置於獨立畫面帶，等比例顯示；窄視窗可拖曳／觸控／方向鍵水平環顧，夾在圖內。當整幅已放得下時置中，沒有額外平移空間；定點在可平移時平滑移動。拖曳方向配合插畫移動修正，圓點保留方向箭頭並取消舊 3D 的垂直32–62%夾限。
- CSS 水泡／蒸氣／微弱火光；幕2每格約1.2秒交叉淡入（完整循環約3.6秒），幕4按原有觀察／正確動作後淡入之後狀態。設定、系統減少動態、面板與背景分頁皆可停止動畫；減少動態仍可直接顯示幕4結果。只載入當幕與下一幕，離頁清除 RAF、ResizeObserver、media／visibility 監聽及圖片 handler。
- 主圖失敗則純色底與原有線索／讀文／作答流程；沒有測試解鎖入口、外部素材網址、新依賴或密碼變動。

### 產圖與逐張自檢

使用內建 imagegen；讀取 draw 與 imagegen 技能，依 imagegen 的優先規則使用內建工具，未呼叫 API CLI。提示組合為「核可樣圖人物／畫風＋2400×1024橫幅＋本單各幕動作＋無字／無觀看者手／正確握持／無方格紋」；幕2後兩格與幕4之後狀態以主圖定向改圖，要求背景與人物位置鎖定。原始生成尺寸約1920×819，交付 WebP 經 Pillow 等比例規格化為2400×1024；不是原生2400像素細節。原始PNG保存在 repo 外 `~/mandarin-work/first-person-samples/final/`（本機對應 OneDrive 同一路徑）。

七張均已打開原始圖及第一版WebP逐張看；背柴／陶鈴、舀起／抬高／倒回、望火、工具握持、火小水靜可辨識，未見馬賽克或方格像素紋，無文字與觀看者手。手指有自然遮蔽，沒有把遮蔽處當作可數清五指的證據。幕3為低視線透視，鍋在前景顯大，比例美感仍請CF確認。

| 圖片 | 最終 bytes | 重生次數／原因 |
|---|---:|---|
| act1-entrance.webp | 306290 | 0；首次依s1重繪即修正背柴／風鈴 |
| act2-scoop-1.webp | 266054 | 0 |
| act2-scoop-2.webp | 250638 | 0；從第1格定向改抬高，不計作失敗重生 |
| act2-scoop-3.webp | 247728 | 0；從第1格定向改倒回 |
| act3-looking-down.webp | 299442 | 0 |
| act4-draw-wood.webp | 289458 | 0 |
| act4-after.webp | 292516 | 0；從抽柴圖定向改結果 |

**尚未通過的嚴格品質項目：**幕2三格構圖接近，但生成改圖仍可見衣褶等非手臂區域細微差異，未能保證「僅手臂、勺、水流不同、背景完全一致」。不能將這項列為已驗收；Claude應連續播放檢查背景呼吸感，若仍有漂移需固定底圖局部合成或再製，不以測試通過取代這條品質要求。所有瀏覽器動作流暢、遮擋、美感亦尚未驗收。

### 本輪指令

- `npm run validate`：通過，含正式密文外洩檢查，未略過密碼檢查。
- `node scripts/test-first-person.mjs`：通過，含正式45句覆蓋與引用雜湊。
- `node scripts/test-first-person-motion.mjs`：通過，舊檔保留。
- 新增 `node scripts/test-first-person-illustrated.mjs`：通過；四幕圖檔存在、WebP、≤400KiB、所有線索有座標且0–100%、頁面相依圖無Three.js；建置後另掃描 emitted JS 無Three.js renderer／loader。
- Python/Pillow：規格化尺寸、WebP壓縮與尺寸檢查；七張2400×1024，皆≤300KiB（亦符合本單400KiB）。第一輪check-dist的check-assets因既有300KiB上限失敗，已再壓縮，不放寬檢查器。
- Python subprocess逐支執行 `scripts/test-*.mjs`：83支、0失敗。
- `npm run build`、`npm run check-dist`、`npm run build:preview`：最終結果見後續補記。
- 早期一次 `npm run validate` 誤在repo根目錄執行，因無package.json失敗；已在apps/mandarin重跑通過。尋找phase2_workspace_diff.md未找到，擴大至父目錄搜尋遇權限限制；未以未讀內容為依據。
- `git diff --check`、瀏覽器／截圖／實機測試：依本單未執行，不算通過。

### Claude 接手的網址與步驟（尚未執行）

在 `apps/mandarin` 執行 `npm run preview -- --host 127.0.0.1 --port 4175`，開啟 `http://127.0.0.1:4175/#/lesson/115AG3H04/explore`；若Vite有base前綴，沿Local網址接同一hash。draft用 `npm run preview:draft -- --host 127.0.0.1 --port 4176`。不要部署。

1. 正常教室密碼門進入，不輸出密碼；桌機1366×900、手機375×812、平板820×1180，逐幕截整體與細節。確認畫面帶大小、構圖、上下文字與圓點不遮臉／手／鍋口；特別檢查幕3前景鍋比例。寬畫面整幅放得下不應硬移到圖外。
2. 各幕拖曳／左右鍵／觸控滑動到兩端，點起始、另一線索、側面定點；插畫的側面按鈕是同一幅圖的另一水平位置，不是新3D視角。確認離屏箭頭與線索按鈕都能帶回觀察位置。十秒閒置導引仍在。
3. 幕2播放至少12秒，核對舀起→抬高→倒回的1.2秒淡入與循環接點；聚焦背景、衣褶、手、勺和水流有無漂移／雙影。背景完全一致尚未驗收，不可直接勾選通過。幕4觀察前後與場景動作題，核對火小、水靜與工具握持。
4. 實玩完整八站八題，包含所有錯答、三級提示、原句、排序／配對／看圖／場景動作、進度保存、重玩、關卡一覽與正常教師解鎖；既有教材規則不得改動。
5. 關動畫、開系統reduce、開閱讀面板、切背景分頁，再返回；無動畫仍可看到幕4結果並完成八站。阻擋本地 `assets/first-person/115AG3H04/` 所有圖片，確認純色降級仍能完成；再單獨阻擋一張關鍵格檢查可理解性。
6. Network確認只有當幕與下一幕圖、無Three.js請求與外部素材；離頁返回無重複RAF／監聽／音效、console無錯、各尺寸無水平溢出。含原文截圖存repo外。

CF試玩、實機效能／朗讀／音量、瀏覽器截圖與學生理解成效仍未驗收。

### 插畫版最終重跑結果

最終在 `apps/mandarin` 依序重跑 validate、test-first-person、test-first-person-motion、build、test-first-person-illustrated、check-dist、build:preview，全部exit 0。check-dist與check-assets皆通過；正式與preview建置皆只有既有CharacterStoryPage靜態／動態匯入提示。新增測試已檢查正式產出JS無Three.js renderer／loader。文字修改檔以Python檢查行尾空白／衝突標記通過；這不等同執行git diff --check。

目前可交Claude進行本機驗收，但不算整單品質驗收完成：嚴格幕2局部變更／背景一致與瀏覽器實玩仍待處理。沒有commit／push，請Claude在指定試作分支接手，不能推到main。
