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
