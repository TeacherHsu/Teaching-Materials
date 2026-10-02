// 資料疑義（reading_questions[].data_issue）：
// 1. 有疑義的題目絕不可以同時有閱讀證據 —— 疑義未裁定就標證據，等於教學生一個
//    自己都還沒確定的答案，而且螢光筆會畫在對不上的句子上。
// 2. 待審頁要真的把疑義印出來，欄位才不會像之前那樣寫了卻沒人讀。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FakeElement, installFakeDom } from './fake-dom.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = path.join(appRoot, 'public', 'data');

let flagged = 0;
for (const volume of fs.readdirSync(dataRoot, { withFileTypes: true }).filter((e) => e.isDirectory() && /^115AG\d/.test(e.name))) {
  for (const filename of fs.readdirSync(path.join(dataRoot, volume.name)).filter((n) => /^lesson\d+\.json$/.test(n))) {
    const lesson = JSON.parse(fs.readFileSync(path.join(dataRoot, volume.name, filename), 'utf8'));
    for (const q of lesson.reading_questions || []) {
      if (!q.data_issue) continue;
      flagged += 1;
      assert.equal(typeof q.data_issue, 'string', `${lesson.lesson_id}: 疑義說明要是文字`);
      assert.ok(q.data_issue.trim().length >= 10, `${lesson.lesson_id}: 疑義要寫清楚是哪裡對不上`);
      assert.ok(!q.evidence, `${lesson.lesson_id} ${q.id}: 未裁定的疑義題不得標閱讀證據`);
      assert.ok(!q.hints, `${lesson.lesson_id} ${q.id}: 未裁定的疑義題不得給提示鷹架`);
    }
  }
}
assert.ok(flagged >= 1, '這支測試要有實際資料才有意義（目前四上有待裁定的疑義）');

installFakeDom();
document.body = new FakeElement('body');
window.matchMedia = () => ({ matches: true });

const { PendingReviewPage } = await import('../src/pages/PendingReviewPage.js');
const lesson = JSON.parse(fs.readFileSync(path.join(dataRoot, '115AG4K', 'lesson07.json'), 'utf8'));
const rendered = PendingReviewPage(lesson).textContent;
assert.match(rendered, /資料疑義/u, '待審頁要列出資料疑義區');
assert.match(rendered, /巧文姐姐/u, '疑義題的題幹要印出來，教師才能對照課本');
assert.match(rendered, /對不上|不符/u, '疑義說明要一起印出來');

// 沒有疑義的課不該憑空長出這一區
const clean = JSON.parse(fs.readFileSync(path.join(dataRoot, '115AG4K', 'lesson05.json'), 'utf8'));
assert.doesNotMatch(PendingReviewPage(clean).textContent, /資料疑義/u, '沒有疑義的課不顯示疑義區');

console.log(`✅ 資料疑義：${flagged} 筆都沒有誤標證據，待審頁也看得到`);
