# 成語圖片交接清單（草稿）

`idiom_builder` 模組（生字變成語）的拖字/選字填空互動，若要加成語插圖，
需要人工繪製或另尋授權素材（大補帖原始圖片不可用，版權不明）。

本批（batch 1）匯入器只落地成語文字資料，不處理圖片。每課匯入完成後，
`idioms[]` 中 `status:"ready"` 的成語即為「已可公開，尚缺圖」清單，
可用以下指令列出待畫清單：

```
python3 -c "
import json
d = json.load(open('public/data/115AG3H/lesson01.json'))
for it in d['idioms']:
    print(it['idiom'], '-', it['definition'])
"
```

後續批次若加上 `image` 欄位，請比照 `characters[].image` 的路徑慣例：
`assets/<volume_code>/lesson<NN>/idioms/<idiom>.webp`。
