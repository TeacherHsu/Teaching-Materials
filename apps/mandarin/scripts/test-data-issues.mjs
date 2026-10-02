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
installFakeDom();
document.body = new FakeElement('body');
window.matchMedia = () => ({ matches: true });

const { PendingReviewPage } = await import('../src/pages/PendingReviewPage.js');

// 用合成課次測渲染，不綁任何一課的現狀——疑義一旦裁定就會從資料裡消失，
// 綁實際課次的測試會在裁定後無聲失效。
function fakeLesson(extra) {
  return { lesson_id: '115AG9X01', lesson_no: 1, title: '測試課', ...extra };
}

const perQuestion = PendingReviewPage(fakeLesson({
  reading_questions: [{
    id: 'question:115AG9X01:01',
    stem: '這題問了什麼？',
    answer: '甲',
    options: ['甲', '乙'],
    answer_source: 'derived:test',
    data_issue: '答案與課文對不上，待教師裁定。',
  }],
})).textContent;
assert.match(perQuestion, /資料疑義/u, '待審頁要列出資料疑義區');
assert.match(perQuestion, /這題問了什麼/u, '疑義題的題幹要印出來，教師才能對照課本');
assert.match(perQuestion, /對不上/u, '疑義說明要一起印出來');

const lessonLevel = PendingReviewPage(fakeLesson({
  reading_issue: '本課課文檔抓錯版本，待更換後才能標證據。',
})).textContent;
assert.match(lessonLevel, /資料疑義/u, '課次層級的疑義也要顯示');
assert.match(lessonLevel, /抓錯版本/u, '課次層級疑義的說明要印出來');

assert.doesNotMatch(PendingReviewPage(fakeLesson({})).textContent, /資料疑義/u, '沒有疑義的課不顯示疑義區');

// 課次層級疑義：課文還沒換就不能標證據，否則螢光筆會畫在別篇課文上
let readingIssues = 0;
for (const volume of fs.readdirSync(dataRoot, { withFileTypes: true }).filter((e) => e.isDirectory() && /^115AG\d/.test(e.name))) {
  for (const filename of fs.readdirSync(path.join(dataRoot, volume.name)).filter((n) => /^lesson\d+\.json$/.test(n))) {
    const lesson = JSON.parse(fs.readFileSync(path.join(dataRoot, volume.name, filename), 'utf8'));
    if (!lesson.reading_issue) continue;
    readingIssues += 1;
    assert.ok(
      !(lesson.reading_questions || []).some((q) => q.evidence),
      `${lesson.lesson_id}: 課文本身有疑義時不得標閱讀證據`,
    );
  }
}

console.log(`✅ 資料疑義：題目層級 ${flagged} 筆、課次層級 ${readingIssues} 筆，都沒有誤標證據，待審頁也看得到`);
