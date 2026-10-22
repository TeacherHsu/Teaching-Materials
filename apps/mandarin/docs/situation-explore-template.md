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
