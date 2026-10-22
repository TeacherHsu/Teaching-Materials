# 新增一課：課文情境探索

1. 確認課次已存在於課程索引、已有正常密文，並由教師核定情境／提問。四上12〈老鞋匠和小精靈〉與六上12〈存根〉各自使用現有 lesson_id；不要猜 ID、句數、情緒詞或原句。
2. 在 repo 外，用既有 `splitSentences(reading.paras)` 斷句規則盤點解鎖課文；記下各段句數、句索引與 SHA-256 前8碼。分配每幕 intro/read，全文每句依序恰好一次；不是每課都45句。完整原文及官方來源留 repo 外。
3. 只新增 `src/data/situationLessons/<lessonId>.js`，default export 課次物件，依下例填資料。不要複製 `cooking-*` profile、不要修改路由／Dashboard／登記表。新檔會由 Vite 自動收集，既有課次頁即顯示「課文情境探索」。開發測試的純 Node 相容 getter 只含舊課；實際 Vite 自動收集另有整合測試。
4. 將素材放 `public/assets/situation/<lessonId>/`，明列底圖／狀態圖／sprite檔名與座標。設定 `assetBase` 並給每幕相同值。新課預設960×960 WebP、單張≤300 KiB、`aspect:[960,960]`，透明物件建議≤120 KiB；舊課2400×1024橫幅是既有例外，不重新裁切。正方形素材在情境探索 cover 幾何中仍需測横／直向取景，人物與操作線索放在安全範圍，勿靠邊；不直接改既有主站圖片規範。
5. 畫風：白底／低彩度、柔和一致筆觸、每圖一重點、無文字、無多餘線索。人物衣著／位置／光向一致；狀態圖同尺寸、同構圖，只改操作結果，避免切換跳動。sprite透明留邊、無白框；每個提示、對話、題卡皆保留朗讀與≥44px觸控範圍。
6. 先選六種型別之一：observe、dragToTarget、scoopGesture、toolGrab、chooseCard、orderCards。拖放／工具需 target 區域，舀取需 water 區域，工具物件設 tool:true，完成吸附設 destination。`steps` 是事件，`collect` 可任意順序、不可重複的物件；量表每個事件有一項，連開場共 steps.length+1。量表名稱逐字使用原文，解鎖驗證會拒絕不存在的詞；教師仍須核對該詞是否真的描述指定人物。
7. 題卡用改寫問題、完整錯因與三級提示；依據只存索引＋hash。排序題 answer 與 initialOrder 都必須完整排列，表情圖片放sprites目錄。結尾卡不限成語，可用事件比較或閱讀策略；不預告尚未讀到的解法。
8. 執行 `npm run validate`、`for f in scripts/test-*.mjs; do node "$f" || exit 1; done`、`npm run build`、`npm run check-dist`。新增設定會被 `test-situation-schema.mjs` 自動掃描；Vite自動入口由 `test-situation-registry.mjs` 驗證。靜態測試檢查全文覆蓋、hash格式／相互一致、量表、型別與座標；實際原文hash與來源詞必須在正常解鎖後驗證。
9. 交 Claude 以1366×900、820×1180、375×812實玩每拍：先看字幕→可操作→結果鏡頭→讀文→作答。確認觸控／滑鼠／Tab/Enter、錯放／取消／重複操作、吸附／計數／量表、手機無橫捲、字及人物不被遮、音效開關、三種動畫設定、重玩／重載／已讀回顧。通過前不宣稱瀏覽器驗收完成；提交與發布依當次授權辦理。

## 設定範例（虛構欄位，沒有原文）

下例展示一幕的完整形狀。`abcd1234/abcd5678` 與量表詞都是佔位值，**不可直接上線**，必須從 repo 外核對取得實際索引、hash與原文用字。課次 metadata 與來源說明也需換成已核定資料。

```js
const assetBase = 'assets/situation/example/';
export default {
  schemaVersion: 1, lessonId: 'example', version: 1,
  assetBase, paragraphCounts: [2], sentenceCount: 2,
  title: '觀察與閱讀', gateTitle: '進入故事', introduction: '先觀察，再讀課文。',
  source: { text: '教師核定來源', questions: '教師改寫', strategy: '觀察與推論', checked: 'YYYY-MM-DD' },
  ui: { enter: '打開課文', return: '回到場景', speaker: '角色', character: '角色',
    context: '插畫為閱讀示意。', safety: '只操作畫面中的物件。' },
  meter: { states: ['文中狀態甲', '文中狀態乙'], faces: ['🙂', '🙂'] },
  review: [['觀察', '說說你找到的線索。']], ending: { title: '閱讀回顧', refs: [] },
  scenes: [{
    id: 'observe-room', act: 1, title: '觀察房間', goal: '點物件看線索。',
    view: 'room', stationType: 'challenge', assetBase,
    art: { images: ['room.webp'], aspect: [960, 960], hotspots: {}, effects: {},
      views: { room: .5 }, orientationFocus: { landscape: 50, portrait: 50 } },
    operation: { type: 'observe', steps: ['look'], objects: [
      { action: 'look', label: '觀察物件', observation: '這是畫面觀察提示。',
        sprite: 'object', x: 50, y: 60, width: 12, ratio: 1, angle: 0 },
    ] },
    meter: [{ state: 0, level: 0 }, { state: 1, level: 1 }],
    beats: {
      intro: [{ para: 1, sentences: [0], sha: ['abcd1234'] }],
      act: { demo: false }, result: { view: 'room', duration: 1800 },
      read: [{ para: 1, sentences: [1], sha: ['abcd5678'] }],
    },
    clues: [{ id: 'evidence', refs: [{ para: 1, sentences: [0, 1], sha: ['abcd1234', 'abcd5678'] }] }],
    questions: [{ id: 'q1', type: 'choice', operationType: 'chooseCard',
      stem: '哪個選項符合線索？', options: ['選項甲', '選項乙'], answer: 0,
      why: ['符合線索。', '再看看物件的線索。'], hints: ['看物件。', '比較選項。', '重讀這一段。'],
      explanation: '把觀察和文字連起來。',
      refs: [{ para: 1, sentences: [1], sha: ['abcd5678'] }],
    }],
  }],
};
```

## 紅線

公開 repo 只放 L1 無個資資料。不放學生姓名／代號／照片／IEP、教室密碼、解密入口、官方Word／PDF／大補帖、生字表原檔、課文原句或全文。原文只在既有正常密碼門後於記憶體取用，不寫回設定、localStorage、測試快照、文件或主控台。新增注音或字音另依教育部資料查證，不憑記憶填入。
