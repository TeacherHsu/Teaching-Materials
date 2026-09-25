# 改寫規則手冊（給後續改寫改寫作業的 AI／教師）

匯入器（`import_lesson.py`）只把需要改寫的內容落地為 `status:"todo_rewrite"`
佔位，原文放在 `work/rewrite-queue/lesson<NN>.json`（不進 repo）。本檔說明
改寫時要遵守的規則。

## 哪些欄位需要改寫

依規格 `docs/specs/2026-09-25-mandarin-dabutie-importer.md` §1 版權界線表：

- `idiom_sentences[].rewritten`（成語例句）
- `sentence_patterns[].examples`（短語／造句／句型的範例句）
- `paragraph_summary[].summary`（段落大意）
- `main_idea.gist` / `main_idea.theme`（課文大意／主旨）
- `reading_questions[].stem` / `.answer_hint`（提問題幹與答案提示）
- `rhetoric[].example`（修辭例句）

## 改寫原則

1. **不得抄用原文字句**——原文只在 `work/rewrite-queue/` 給你對照語意，寫出的
   句子要用不同措辭，且不得是原句刪減／同義詞替換的表面變化。
2. 保留原文要傳達的**語意重點**（例如成語的正確用法情境、句型的結構、
   段落的因果關係），不要改變教學意圖。
3. 難度需符合三年級程度：句子不宜過長，生詞控制在課次生字表以內。
4. 改寫完成後，把內容寫回同一筆記錄的對應欄位，並把 `status` 改為 `draft`
   （等待教師在待審頁核准為 `approved`）。**不要**自行改成 `approved`。
5. 若判斷某筆原文已經足夠通用、無版權疑慮（例如純結構描述），仍要走一般
   改寫流程，不可略過；規格刻意不提供例外通道。

## 重跑匯入器時的行為

`merge.py` 以穩定 id（例如 `idiom_sentence:115AG3H01:<hash>`）比對舊檔，
若某筆已是 `approved` 或 `rejected`，重跑不會覆蓋其文字本體。

## 一字多義句子（polysemy）

- 題目問的是「單一個字」在句中的意思，不是整個詞。
- 句子用《》標出含目標字的詞即可（例：壞人想要《併吞》別人的財產），前端會自動去掉《》，把詞加底線、只把目標字「吞」標色，並另外問「『吞』在這句話裡是什麼意思？」。
- 句子裡的目標字只能出現一次，避免學生不知道在問哪一個。
