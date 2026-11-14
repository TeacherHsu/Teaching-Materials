# 朗讀遊戲視覺實作紀錄

日期：2026-11-14。機器：家中 Mac；AI：Codex。
狀態：插圖、演出、文件與 Node 檢查完成；待 Claude 瀏覽器／裝置實玩。

依本派工單全程未執行任何 git 指令、未開 Chrome／其他瀏覽器、未開埠。分支與提交由 Claude 處理。只修改 Chinese/Read-Aloud/；沒有修改 HANDOFF.md。

## 逐檔修改

| 檔案 | 修改內容 |
|---|---|
| `read-aloud.js` | 新增 art／backdrop（img缺圖處理）、motion／visualSleep（尊重動畫開關與中途取消）、projectile（圖片拋物線／放大聲波）、particles／impact／floatLabel；加進api，未改任何既有函式內容、簽名或回傳。新特效以fx子節點共用60個上限，用完移除。 |
| `pet.js` | 12寵物圖片映射、蛋三階段、背景、光暈／接觸陰影、進度列小蛋與寵物圖。每口250ms飛行＋180ms命中，三口約1.29秒；裂痕門檻冒碎屑。破蛋220ms抖動＋330ms殼分離（170ms白光併行）＋300ms彈出＋580ms兩次跳＝約1.43秒。結算一排寵物依序跳，起跳延遲分布在0～450ms，整段最長1.55秒。原分組、FULL、份數、滿能量條件與下一顆按鈕流程保留。 |
| `monster.js` | 六怪物／勇士三姿勢／大魔王兩姿勢、森林背景、接觸陰影、登場、待機、麥克風位置發波。普通三擊約1.23秒、最後一道最大；衝擊環／星星、HP彈走、4px／180ms舞台短震。趕跑320ms旋轉縮小＋300ms星星飛進度列＋280ms勇士升級跳。大魔王短暫變暗／落下、逐格蓄力、滿格發特大聲波；保持原縮小公式，最後暈眩／星星與CSS音符散出後淡出（最後一招約1.09秒）。結算歡呼勇士、獎盃、星星。原bonus選題函式與等級計數保留。 |
| `read-aloud.css` | 追加插圖／fallback同尺寸容器、背景、角色大舞台、陰影／光暈、特效與有限次結算跳。一般舞台clamp(280px,38vh,380px)，boss舞台clamp(330px,42vh,380px)；桌機蛋／寵物230px容器，勇士／小怪178px、boss260px。iPad橫向縮頂列／進度列／字卡留白，進度格仍32px、按鈕至少56px。名稱移到腳下，boss蓄力格放勇士上方空白處。375寬左右各獨立容器。既有字與注音選擇器原樣保留。 |
| `pet.html`、`monster.html` | 全部既有?v=升到20261114e，除此之外檔案內容不變（含頁尾）。 |
| `img/*.webp` | 新增下表33件原創成品，生成34次。31張透明512×512、2張不透明1600×640。 |
| `tests/assets.test.cjs` | 無npm套件，直接讀RIFF／VP8X／VP8／VP8L／ALPH檔頭；檢查清單、格式、尺寸、alpha、單張容量、整個img容量及僅有成品。 |
| `tests/visual.test.cjs` | Node VM／DOM替身測試：圖片error handler、動畫關即時完成、新特效60節點上限、中途關動畫取消與清理、寵物9份破蛋、三道聲波／升級／boss滿蓄力才攻擊。此測試不是瀏覽器驗收。 |
| `tests/index.js` | 本機Node v26.0.0將明確目錄參數視為入口，原指定指令首次得到MODULE_NOT_FOUND；新增入口載入三份測試後，原指令完整通過，未更動grade.test.cjs。 |
| `README.md` | 新增「插圖與演出」清單、alpha與容量規格、缺圖退回、動畫關、repo外原始圖與重產位置、測試指令。 |
| `docs/VISUAL-IMPL-LOG.md` | 本紀錄。 |

## 保護項目與驗證

- 以開工前存於repo外before/的副本逐位元比對：移除新視覺工具區塊與新增api欄位後，read-aloud.js與原版完全一致，包含makeGrader、groupSizes、judge、next、finish、listener、speak、MAX_TRIES、FULL、reduced／body.calm既有行為、window.__readAloud。
- tests/grade.test.cjs與data/G2A2.js逐位元一致；tools/未修改。既有CSS全文為新檔前綴，未改.word-big、.word-ex、.zc、.zy*。兩html反向替換版本後與原版完全一致，頁尾出處完整保留。
- `node --test Chinese/Read-Aloud/tests/`：46項通過、0失敗、0略過（素材34＋原評分6＋新行為6）。
- `python3 Chinese/Read-Aloud/tools/build_data.py --check`：✅ G2A2，108個生字、103個語詞。
- `node --check`：read-aloud.js、pet.js、monster.js通過。
- Pillow額外解碼檢查透明圖31張alpha最小0、最大255，背景2張RGB；不只依賴檔頭。成品共1,201,060 bytes＝1.145 MiB，最大背景109,260 bytes；容量未靠縮減成品尺寸達成。
- 不新增外部連線／字型／函式庫／音檔；不記錄學生資料。原聲音示範與辨識既有機制不變。

## 素材逐張生成與退件

使用已讀取的draw與imagegen技能，依派工單採內建image_gen（未使用CLI）。共同畫風：暖色童書貼紙、柔和深棕粗線、圓潤造型、平塗與一層柔影、白邊。逐張檢視主體完整、表情、無文字、風格一致、同角色連續姿勢。boss首版袋中內容不像音符，因此退件並局部修正；其餘沒有品質退件或工具失敗。

| 成品 | 生成次數 | 退件／檢視 | 大小（bytes） |
|---|---:|---|---:|
| `bg-forest.webp` | 1 | 無退件；已逐張檢視 | 109,260 |
| `bg-hatchery.webp` | 1 | 無退件；已逐張檢視 | 57,254 |
| `boss.webp` | 2 | 首版袋中弧塊不像音符；局部編輯 1 次後採用 | 40,260 |
| `boss-dizzy.webp` | 1 | 無退件；已逐張檢視 | 44,188 |
| `egg-0.webp` | 1 | 無退件；已逐張檢視 | 25,284 |
| `egg-1.webp` | 1 | 無退件；已逐張檢視 | 24,786 |
| `egg-2.webp` | 1 | 無退件；已逐張檢視 | 27,162 |
| `hero-cheer.webp` | 1 | 無退件；已逐張檢視 | 37,430 |
| `hero-idle.webp` | 1 | 無退件；已逐張檢視 | 38,790 |
| `hero-shout.webp` | 1 | 無退件；已逐張檢視 | 38,322 |
| `meat.webp` | 1 | 無退件；已逐張檢視 | 22,446 |
| `mon-1.webp` | 1 | 無退件；已逐張檢視 | 36,328 |
| `mon-2.webp` | 1 | 無退件；已逐張檢視 | 30,198 |
| `mon-3.webp` | 1 | 無退件；已逐張檢視 | 38,014 |
| `mon-4.webp` | 1 | 無退件；已逐張檢視 | 46,338 |
| `mon-5.webp` | 1 | 無退件；已逐張檢視 | 38,578 |
| `mon-6.webp` | 1 | 無退件；已逐張檢視 | 37,098 |
| `pet-cat.webp` | 1 | 無退件；已逐張檢視 | 38,424 |
| `pet-chick.webp` | 1 | 無退件；已逐張檢視 | 28,642 |
| `pet-dog.webp` | 1 | 無退件；已逐張檢視 | 38,124 |
| `pet-fox.webp` | 1 | 無退件；已逐張檢視 | 38,030 |
| `pet-frog.webp` | 1 | 無退件；已逐張檢視 | 34,782 |
| `pet-hamster.webp` | 1 | 無退件；已逐張檢視 | 34,824 |
| `pet-hedgehog.webp` | 1 | 無退件；已逐張檢視 | 34,534 |
| `pet-koala.webp` | 1 | 無退件；已逐張檢視 | 35,370 |
| `pet-panda.webp` | 1 | 無退件；已逐張檢視 | 31,392 |
| `pet-penguin.webp` | 1 | 無退件；已逐張檢視 | 28,144 |
| `pet-rabbit.webp` | 1 | 無退件；已逐張檢視 | 33,612 |
| `pet-turtle.webp` | 1 | 無退件；已逐張檢視 | 31,868 |
| `shell-bottom.webp` | 1 | 無退件；已逐張檢視 | 23,922 |
| `shell-top.webp` | 1 | 無退件；已逐張檢視 | 25,008 |
| `star.webp` | 1 | 無退件；已逐張檢視 | 24,394 |
| `wave.webp` | 1 | 無退件；已逐張檢視 | 28,254 |

## Repo外交付

`/Users/hsuchiafang/Library/CloudStorage/OneDrive-個人/mandarin-work/read-aloud-art/`

- originals/：33張選用原始PNG；rejected/boss-01-sound-blobs.png：唯一退件。
- contact-sheet.png：全部成品總覽（已自行看過）；review-01.png：首輪局部總覽。
- generation-record.md、generation-output-paths.json：逐件次數、退件、生成輸出路徑；prompts.md與style-prompt.txt：重產提示集合。
- export-assets.py、export-metadata.json：PNG連通區雜點清理、等比縮放、透明留邊、蛋／勇士／boss共同框對齊、WebP輸出與總覽。原始PNG不被覆寫。可加檔名參數只匯出指定件。
- before/與before-hashes.json：開工前受保護檔案比對依據，非git操作。

## Claude 必須執行的瀏覽器驗收（尚未驗證）

1. 兩模式各用`__readAloud.judge(3)`／2／1試玩至結算與再玩一次；確認份數、最多三次、原選題與計分不變；同時檢查console。
2. 寵物連續三口須各自命中，+1／愛心不擋回饋或按鈕，能量格各亮一次；1/3與2/3切圖不跳位置，裂痕碎屑時機正確。
3. 破蛋約1.43秒：抖動→單次白光→殼分離淡出→寶寶彈出→星星環光→跳兩次；下一顆按鈕只在演出完後出現，結算整排輪流跳。
4. 小怪登場、勇士麥克風發波、三次命中節奏、最後一擊較大、白環／白亮與HP破掉彈走、震動無持續閃爍；怪物旋轉飛走後星星到正確進度格，升級箭頭與數字對應。
5. 大魔王落下短暗、蓄力滿才發特大波、每招縮小、最後boss-dizzy與袋中音符飛散淡出；hero-cheer結算。
6. **1024×768 iPad橫向**：生字含造詞／4字語詞、普通與boss關各驗，無捲動可同時看到頂列、進度列、整舞台、題號、大字、兩按鈕與回饋第一行；不可縮字或縮插圖來補救。數值留白配置已處理，但無瀏覽器無法宣稱通過；也驗較大桌機／平板角色顯示高度。
7. **375寬手機直向**：無橫向捲動，角色各自清楚；泡泡不蓋臉，底部名稱／HP與蓄力格不互蓋、能量格不蓋蛋；18題進度格換行正常，觸控按鈕至少56px。
8. 開始前關動畫，以及在飛行、破蛋、命中途中關動畫：不位移／縮放／閃爍／震動，沒有殘留粒子，流程照常立即到結果；再開動畫待機與後續演出恢復。系統減少動態也需試。
9. DevTools阻擋img/*.webp（含單張與全數）：寵物／怪物／勇士／肉肉／聲波／蛋、進度列與結算均有fallback；背景失敗保留漸層；無破圖版面與流程中斷。蛋fallback是原SVG，不是空白。
10. 實機麥克風、台灣國語示範與辨識仍需Claude／教師確認；此輪未做音訊／教學驗收。

沒有已知的規格阻塞；瀏覽器排版、實際動畫時序與裝置體驗均保留為待驗，不能將Node替身測試當作已完成實玩。
