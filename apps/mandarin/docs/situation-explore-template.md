# 課文情境探索模板

## 盤點與遷移

| 原本寫死的位置 | 內容 | 本輪歸屬 |
| --- | --- | --- |
| `data/firstPersonLesson.js` | 115AG3H04、四幕、題目、成語依據、45句及段落 | `data/situationLessons/115AG3H04.js`；舊檔只保留相容匯出與 evidence helper |
| `firstPersonIllustrated.js` | 素材根路徑、每幕底圖、火勢狀態圖、預載下一幕 | `assetBase`、`scene.art`、`nextImages` |
| `firstPersonLayout.js` | 木柴／工具 sprite、百分比座標、尺寸、角度、柴堆 | 課次檔 `operation.objects` 與原數值相容匯出；cover 幾何支援 `art.aspect` |
| `firstPersonInteraction.js` | 第一幕搬柴、第二幕舀水、第三幕觀察 | 操作 `type`、`steps`、`collect`、`heat`；已核可動畫用 `cooking-*` 相容配置 |
| `firstPersonTongs.js` | 拿鉗→夾柴→移出爐口、64px錯開熱區、示範／閒置提示 | `toolGrab` 的既有相容配置；工具素材路徑由課次提供 |
| `FirstPersonPage.js` | 45句字幕與「第4段第8句」量表事件、師傅、康康、食堂、成語卡 | `paragraphCounts`、帶雜湊 `beats`、`meter.read`、`ui`、`ending` |
| `firstPersonPresentation.js` | 各幕心情級數、強度詞、排序 | 正式頁改讀 `scene.meter`；舊 `moodFor` 保留供回歸測試；共用排序控制器維持原行為 |
| `firstPersonIllustrated.js` | 横向／直向火鉗對焦修正、底圖效果點 | `art.focus.landscape/portrait`、`art.effects`；新課可用 `art.orientationFocus` |
| `LessonDashboard.js` | 單課入口判斷 | 原有 getter 改為 Vite 自動收集設定檔；路由與頁面均無需逐課修改 |
| `firstPersonChime.js` | 風鈴音色／風痕／擺動 | 保留效果外掛，`art.plugins: ['chimeWind']` 選用 |

## Schema v1

設定檔 default export 一個物件；`index.js` 用 Vite glob 收集同目錄課次。`schema.js` 不登記為課次。

- 課次：`schemaVersion:1`、`lessonId`、進度 `version`、`assetBase`（相對 public 的本地目錄）、`paragraphCounts`、`sentenceCount`、`source`、`ui`、`gateTitle`、`introduction`、`review`、`ending`、`meter`、`scenes`。
- 幕：唯一 `id`、顯示序號 `act`、`title/goal/view`、`assetBase`、`art`、`operation`、`beats`、`clues`、`questions`、`meter`。
- 美術：`images` 第一張底圖及後續狀態圖、`aspect:[width,height]`、百分比 `hotspots/effects`、`views`（0–1水平環顧）、`focus`（横／直向對焦修正，0–100）、`orientationFocus`（新課操作開始對焦，0–100）。`stateImages:true` 用 heat 混合頭兩張圖；`plugins` 選特效。
- 可操作物：`label/sprite/action/x/y/width/ratio/angle`；sprite 是不含副檔名的 WebP 檔名；位置／寬度 0–100，ratio 是高寬比；`target` 表目標按鈕、`tool` 表工具、`destination:[x,y]` 表完成吸附位置、`observation` 表觀察小對話框。
- 操作：`type` 七選一、`steps` 成功事件順序、`collect` 不得重複計數的物件 ID、`regions`（`target/water` 區域，left/right/top/bottom）、`heat` 每步效果值；`demoPrompt/retry/takePrompt` 可覆寫提示。不需教室密碼以外的入口。
- 四拍：`intro/read` 各為 `{para, sentences:[n], sha:[hash]}` 陣列；段落從1起、句索引從0起、hash為現行斷句後原句 UTF-8 SHA-256 前8碼；`act.demo` 決定示範；`result:{view,duration}`。所有幕的 intro→read 必須按全文順序恰好覆蓋一次，〈水滾了〉為45句，其他課按實際句數。
- 量表：`meter.states` 必須是原文用字，`faces` 為對應圖示；`scene.meter` 第0項是開場，每完成一個 `steps` 事件換下一項 `{state,level}`，level為0–3；`meter.read:{para,n,state,level}` 是讀句觸發事件。不可把推論當原文明說情緒。
- 題卡：沿用既有 `stem/options/answer/why/hints/explanation/refs`，`operationType` 是 `chooseCard/orderCards`；表情卡另外設 `type:'emotion',images`，排序卡設 `type:'order',initialOrder`。場景內卡也可用 operation type，排序需 `operation.answer`。
- 結尾：`ending:{title,refs}` 與 `review:[[小標,改寫說明]]`，不預設每課都有成語。

## 共用操作與相容界線

`activities/situation/operations.js` 提供七種型別的 DOM 事件流程：觀察小對話框、目標拖放／點選、區域舀取、拿工具／夾取／放置、選卡、排序。支援百分比幾何、吸附、計數、示範、減少動態、離頁清理及按鈕鍵盤替代；排序題卡沿用原本的點選編號／取消及觸控拖曳。

〈水滾了〉指定 `cooking-dragToTarget/scoopGesture/observe/toolGrab` 配置，保留原本的手勢時序、字幕、火鉗64px熱區、虛線箭頭、木柴手勢／8秒及12秒提醒、風鈴效果與三尺寸鏡頭。這些配置目前仍由 `firstPersonInteraction.js`／`firstPersonTongs.js` 實作，包含本課文字與幾何；**不是完全刪除單課特殊程式**。新課不要複製或選用 cooking profile，直接用共用型別；新的特殊動作若超出現有型別仍需新增程式。

既有量表「平靜／有點慌張／慌張／十分慌張／用心記住」為保留玩家行為的相容例外；新課解鎖後逐字驗證狀態名存在於全文。靜態驗證只能檢查非空、事件與雜湊一致性，沒有密碼時無法證明來源詞或重新計算官方原句 hash。正式頁在原密碼門後才驗全文句數、hash及新課量表詞，失配顯示既有版本未對齊訊息，不洩漏原文。

舊3D試作與其 motion／layout 測試保留。正式路徑仍為插畫，不改密文、課文資料、密碼門、進度版本9與發布設定。

## 老鞋匠擴充（2026-10-22）

- 第七種共用型別 `tracePath`：物件提供 `path:[[x,y],…]` 與 `tolerance`（來源圖百分比）。按住工具沿線走，稀疏 pointer move 以小段重採樣；可沿直線快速掃過，不能抄捷徑穿過折線。錯線／取消不完成，鍵盤每次 Enter 推進一個節點。完成後可用分離的皮革 sprite 呈現切下結果。
- 同幕多種手勢：`object.gesture` 可為 `tap/observe/dragToTarget/tracePath`；不填沿用幕的 type。`fromStep/toStep` 控制物件可見與可用的步驟，`passive` 是不可操作的圖層，`hotspot` 是無文字光暈，`region` 選擇 `operation.regions` 裡的目標。拖放仍有選物件→點目標的鍵盤替代。
- `operation.prompts` 每步一行任務；`focus` 每步水平對焦百分比，包含重新開啟設定／提示後的恢復。多次收集可共用一個對焦，避免任意收集順序讓剩餘物件出框。`silentObserve:true` 只切換狀態圖，不在動手拍加文字氣泡。
- `art.stepImages` 的長度為 steps+1，值為 `art.images` 的索引。每步切換狀態圖，不把完成物件留成重複的 sprite。`resultImage` 在結果拍切換；`resultDelay` 毫秒讓完成狀態先停留（例如先看桌上禮物），再切結果；`resultView` 可指定同時轉到另一個 `art.views`。`resultZoom:false` 保留結果拍正常 cover 尺度，避免尚未看清的禮物先被讀文鏡頭裁掉。離頁清除結果計時器；減少動態時不淡入。
- 本單指定 115AG4K12 使用 **2400×1024** WebP 底圖≤400KiB、透明物件≤120KiB，優先於一般新課960方圖建議；實際所有底圖也低於既有300KiB檢查上限。滿版 cover 不改為 contain。
- 本課正式密文是1個資料段、18行、100個朗讀單位，含標題／作者／課前導讀。教師設計單的正文段號不拿來重編現有密文；設定使用真正的 `para:1` 與0起算句索引，細目見實作紀錄。來源明文與密碼沒有加入 repo。

## 存根擴充（2026-10-23）

- **形狀配對沿用 `dragToTarget`，沒有新增操作型別。** 每個蒂用不同 `object.region` 對應 `operation.regions` 的蒂口；點選物件再點目標與拖放走同一個判定。錯配彈回、不增加計數，`retry` 提醒觀察粗細形狀。`guide:false` 關閉通往正解的箭頭與單一目標虛框，三個實際目標按鈕仍保留；`destinationWidth` 僅在成功吸附後調整物件尺寸，熱區仍至少44px。
- `operation.groups:[{from:0,to:3},{from:3,to:6}]` 是連續、不重疊、完整覆蓋 steps 的半開區間。每組重新從0／3計數；collect 僅接受目前組的動作，搭配物件 `fromStep/toStep` 避免提前收集。混合 observe／dragToTarget 的目標框僅在拖放組顯示。操作清單仍用原本的完整 step 保存／恢復。
- `object.observation:''` 明確表示不產生名牌／氣泡；未設定才使用 label。〈存根〉第三顆南瓜不自編名字，前兩顆只使用教師核定的文中小名。
- `meter.events:[{para,n,state,level},…]` 按閱讀順序列出原文狀態事件；每句取不晚於該句的最後事件，動手時仍取 scene.meter。`meter.caption` 可在原量表內標示主語。本課caption為布大爺的心情，既有課次不加此行。
- `art.expressionStates:{狀態詞:{底圖檔名:局部透明圖檔}}`：沿用老鞋匠全尺寸稀疏疊圖，只在對應量表詞顯示，跟隨底圖的透明度與cover幾何。此功能與原本 `expressionOverlays` 相容，非臉部遮罩區域保留原底圖。設定／暫停恢復仍保留目前狀態。
- `scene.readViews:{'段:句索引':viewName}` 在指定讀句切換已宣告鏡頭；不用原文作key。本課在讀到接蒂說明時保留證據鏡頭，在欣慰事件轉回布大爺；開場先看人物，動手回中央操作區，結果看回家／警察／證據。
- 本單指定115AG6H12場景2400×1024 WebP≤400KiB，sprite／局部表情圖≤120KiB，優先於一般方圖建議。資產容量檢查只對此課路徑套此上限；其他主站圖片仍維持300KiB。schema素材測試對既有2400寬情境圖依400KiB檢查，沒有改成contain、縮小滿版場景或裁掉線索來通過測試。

## 存根修正單1：共用閱讀策略與插入拍

四種策略為 `predict`、`emotionClue`、`causeEffect`、`summaryCard`，只由課次設定啟用。本輪僅〈存根〉使用，兩舊課繼續使用既有四拍，不增加策略或題目。

- `scene.strategies`：`id/type/prompt/options/refs/hint`。`refs` 必須包含解密資料段號 `para`、零起算句號 `sentences`、SHA-256 前8碼 `sha`；選擇式預測外，每個場景選項亦帶自己的 `refs`。
- `predict`：2–3個字串選項，必含「我不確定」，禁止 `answer`；`revealAt:{para,n}` 必須位於依據內。在揭曉句顯示 `你猜的是：○○，課文怎麼說？`，不計正誤或獎勵。
- `emotionClue`：`answer` 為1–2個正確選項索引；選項帶 `label/x/y/refs`，`states` 指向量表既有原文詞。其他人物可用 `words` 與 `meterTarget`，正常解鎖時逐字核對其指定原句，不新增布大爺的量表狀態。點錯使用「再看看他的臉／動作」，可繼續找。
- `causeEffect`：同樣使用場景選項及 `answer`，`result:[x,y]` 是結果位置，`explanation` 是改寫的因果回饋。點中後發亮並在相同插畫座標畫柔和曲線，不自動跳走，按繼續後前進；答錯可再試。
- `summaryCard`：放在 `questions`，`type` 與 `operationType` 均設為此值，恰好三個 `options`、`summaryImages`、`why`、一個正解索引及原句 `refs`；取代原題。圖片明確指定本幕場景或本地 `sprites/*.webp`。錯因指出細節與重點差別。最後用已完成各幕的正確選卡串成一句，保留朗讀。它沿用題卡進度、錯因與重玩，不另加題。

需要插入策略或動手點時，加 `scene.timeline`；不加就保留舊四拍。每項 `kind` 為 `intro/read/act/result/strategy/openBag/question`；`intro/read` 使用獨立 `refs`，展開後須與 `beats.intro + beats.read` 完全一致並依序唯一覆蓋全文。每段 `intro` 最多8單位；例外必須寫 `lengthException` 理由。`act.untilStep` 可在既有操作完成指定步後先讀下一段，再接續剩餘動手；不重算／重置計數。

`strategy.id` 引用本幕策略。`imageIndex` 指定該拍底圖，`hideOperations:true` 隱藏既有操作物件，避免未揭曉道具外露。`openBag` 以 `object:{x,y,width,sprite}` 設背包，支援拉開、點擊及 Enter／Space；只改開口視覺，不出現包內物。它有自己的原句依據，不另計分或加題。

策略熱點與線條使用獨立插畫平面，繼承滿版 cover 的縮放／環顧，主操作保持鎖定；Tab聚焦會將熱點移進畫面。提示、卡片與回饋都有喇叭。`test-situation-strategies.mjs` 驗證四型別、原句引用、開場長度、重試、預測無正誤、摘要題數及全文時序；視覺仍需 Claude 實玩。

### 臉部線索與場景物件（存根修正單2）

`emotionClue`／`causeEffect` 的人物臉部選項必須設定 `face: {width, height}`（原圖百分比），並設定 `markerOffset: [dx, dy]`。`x/y` 仍代表臉的中心與因果連線起點；按鈕放在偏移處，保留至少44px點擊範圍。柔和橢圓光圈只畫外緣，中心透明、不攔截事件；命中短暫加亮650ms，離開拍時清除計時器。不得將實心標記蓋在五官上。

場景中的容器使用透明sprite與接觸陰影，不用白卡。`openBag` 只透過袋體透視變形與袋口暗橢圓呈現開啟，不渲染任何內容；減少動態時直接切末態。配對目標可用 `consumedBy` 指向消耗它的物件action，已用物件可設定 `usedFade`：配對完成立刻停用、移除光暈，保留接合物件本體。`grounded` 物件無漂浮動畫。

極窄直向若動作者與證據無法在cover中同框，可明確設定 `art.portraitFrame: {left,right,top,bottom}`，以原圖百分比界定同框範圍、像素保留上下介面空間；主畫面等比例縮放，後方仍以同場景模糊cover滿版，所有熱區共用同一幾何。此設定為單課選用，未設定的課保持原cover與閱讀縮放。必須驗證動作者、全部證據、操作熱區與字幕的實際可見範圍。

## 籃球夢：節奏、瞄準與呼吸（2026-10-23）

三種共用型別 `rhythmTap`、`aimShot`、`holdBreath` 使用 `sportsOperations.js`，由既有 `mountConfiguredOperation` 分派。支援 `object.gesture` 在同幕切換呼吸與投籃，`fromStep/toStep` 指定顯示區間。`steps` 為成功事件，完成只讀既有 `state.step`，不以 DOM／動畫是否存在判斷；重入、暫停、取消、離頁均不增加次數。

- `rhythmTap`：球按鈕可點擊或鍵盤空白鍵／Enter。`state.rhythmAttempts` 保存每次嘗試；前四次必然亂彈、寬容窗逐次增加，第五次起完整週期均成功。成功三次才完成；650ms內連點忽略，失敗不扣分、自動回球。縮頭只有3px位移、小彈跳，沒有受傷表現。減少動態保留靜態球與完整操作。
- `aimShot`：從球拖出二次貝茲曲線，放開後以來源圖百分比判定；方向及終點有38%的寬容區。`operation.hoop:[x,y]` 指籃框；無位移不接受。Tab聚焦球後空白鍵／Enter提供輔助投籃；`operation.guaranteed:true` 讓最後一球必進。球沿弧線到籃框再落下，練習成功事件兩次。取消／錯向不增加計數。
- `holdBreath`：按住圓圈或長按空白鍵／Enter滿3000ms才成功；圓圈前半吸氣放大、後半吐氣縮小。提前放開、失焦、暫停／離頁取消計時。`quiet` callback隨進度降低既有環境音，沿用音效開關；完成保留安靜至投球，最後投出後恢復環境音。四周以柔和遮罩淡化，不新增字幕。動畫關閉時取消球的持續彈跳／投射動畫，呼吸圓圈仍反映按住進度。

倒敘可在 `predict` 設 `revealOnResult:true` 與改寫的 `resultReminder`：`revealAt` 仍指向已先讀過的開頭依據，結果拍用無正誤提醒請學生回想開頭，不重播原文。本課每幕一張摘要題，共四題；第四幕摘要串起加入、運球、投籃練習與關鍵投球，取代原設計排序題，不另增加題目。

本課教師指定2400×1024橫幅WebP≤400KiB，實際四張均≤300KiB；全部沿用滿版cover。第一人稱只畫雙手與視角，無主角臉。呼吸圓圈／瞄準線為程式形狀，PNG示意留在repo外，WebP sprite保留供素材交接；即時動畫使用CSS／SVG。

觀察物件可加 `viewMotion:'lookUp'|'approach'`：以保持cover的微放大／抬鏡頭呈現抬頭看高處或靠近的視角，動畫完成才提交觀察事件；等待期間停用其他物件、暫停取消不提交，減少動態直接完成。此為共用選用欄位，不改其他課既有操作。
