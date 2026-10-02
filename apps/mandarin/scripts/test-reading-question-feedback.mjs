import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FakeElement, installFakeDom } from './fake-dom.mjs';

installFakeDom();
document.body = new FakeElement('body');
window.matchMedia = () => ({ matches: true });

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = path.join(appRoot, 'public', 'data');
const styles = fs.readFileSync(path.join(appRoot, 'src', 'styles', 'components.css'), 'utf8');
assert.match(
  styles,
  /\.quiz-option--correct:disabled,\s*\.quiz-option--incorrect:disabled\s*\{[^}]*color:\s*#000;[^}]*opacity:\s*1;/u,
  '判錯／正解選項即使鎖定，也要保留足夠文字對比',
);
assert.match(
  styles,
  /\.quiz-option\[aria-pressed="true"\]\.quiz-option--correct\s*\{[^}]*background:\s*#e4f3ea;/u,
  '答對底色要優先於一般已選取底色',
);
assert.match(
  styles,
  /\.quiz-option\[aria-pressed="true"\]\.quiz-option--incorrect\s*\{[^}]*background:\s*#fbe9e7;/u,
  '答錯底色要優先於一般已選取底色',
);
const gradeQuestionCounts = new Map();
let gradedQuestionCount = 0;

for (const volumeCode of fs.readdirSync(dataRoot).filter((name) => /^115AG[1-6][HK]$/u.test(name))) {
  const lessonFiles = fs.readdirSync(path.join(dataRoot, volumeCode)).filter((name) => /^lesson\d+\.json$/u.test(name));
  let optioned = 0;
  for (const lessonFile of lessonFiles) {
    const lesson = JSON.parse(fs.readFileSync(path.join(dataRoot, volumeCode, lessonFile), 'utf8'));
    const lessonQuestions = lesson.reading_questions || [];
    const lessonOptionedCount = lessonQuestions.filter((question) => Array.isArray(question.options) && question.options.length > 0).length;
    assert.ok(
      lessonOptionedCount === 0 || lessonOptionedCount === lessonQuestions.length,
      `${volumeCode}/${lessonFile}: 開放問答與選擇題不可混在同一作答組`,
    );
    for (const question of lessonQuestions) {
      if (!Array.isArray(question.options) || question.options.length === 0) continue;
      optioned += 1;
      assert.ok(question.options.length >= 2, `${volumeCode}/${lessonFile} ${question.stem}: 選項至少要有兩個`);
      assert.ok(question.options.includes(question.answer), `${volumeCode}/${lessonFile} ${question.stem}: 正解必須是現有選項`);
      // 答案來源要嘛是衍生時核對過的，要嘛是教師親自裁定的（teacher: 開頭並寫明理由）。
      // 教師裁定排在衍生之上——衍生有標錯的前例（四上 L03 把「學長」標成「家人」）。
      assert.ok(
        question.answer_source === 'derived:reviewed-reading-question-context'
        || /^(teacher|authored):.+/u.test(question.answer_source || ''),
        `${volumeCode}/${lessonFile} ${question.stem}: 必須標示已核對的答案來源（derived 或 teacher:…）`,
      );
    }
  }
  gradeQuestionCounts.set(volumeCode, optioned);
  gradedQuestionCount += optioned;
}

assert.equal(gradeQuestionCounts.get('115AG4K'), 48, '四上 12 課各 4 題選擇題應全部有答案鍵');
assert.equal(gradeQuestionCounts.get('115AG6H'), 48, '六上 12 課各 4 題選擇題應全部有答案鍵');
for (const volumeCode of ['115AG1H', '115AG2H', '115AG3H']) {
  if (gradeQuestionCounts.has(volumeCode)) {
    assert.equal(gradeQuestionCounts.get(volumeCode), 0, `${volumeCode} 目前是逐步提示問答，不應被誤標為選擇題`);
  }
}

const { ReadingQuestions } = await import('../src/components/ReadingQuestions.js');
const testItem = {
  stem: '哪一個選項是正確的？',
  options: ['錯誤線索甲', '錯誤線索乙', '正確答案'],
  answer: '正確答案',
  hints: ['回到文章，找出題目中的關鍵詞。'],
};
const root = ReadingQuestions({ items: [testItem] });
const choices = () => root.findAll((node) => node.tagName === 'button' && node.hasClass('quiz-option'));
const choice = (label) => choices().find((node) => node.textContent.trim() === label);

const firstWrong = choice('錯誤線索甲');
const secondWrong = choice('錯誤線索乙');
const correctOption = choice('正確答案');
firstWrong.dispatch('click');
let status = root.findAll((node) => node.getAttribute('role') === 'status')
  .find((node) => node.textContent.includes('再試一次'));
assert.ok(status, '應找到第一次錯誤的狀態訊息');
assert.match(status.textContent, /再試一次/u, '第一次答錯要有清楚的重試回饋');
assert.ok(root.find((node) => node.hasClass('hint-panel')), '第一次答錯應提供不揭露答案的線索');
assert.equal(correctOption.hasClass('quiz-option--correct'), false, '第一次答錯不能先標出正解');
assert.equal(firstWrong.disabled, true, '第一次答錯的選項應停用，讓學生嘗試其他選項');

secondWrong.dispatch('click');
status = root.findAll((node) => node.getAttribute('role') === 'status')
  .find((node) => node.textContent.includes('正確答案是：正確答案'));
assert.ok(status, '應找到第二次錯誤後的答案揭曉訊息');
assert.match(status.textContent, /正確答案是：正確答案/u, '第二次答錯才揭露正解');
assert.ok(correctOption.hasClass('quiz-option--correct'), '揭曉時應以正確樣式標示正解');
assert.ok(choices().every((node) => node.disabled), '答案揭曉後應鎖定這一題');
assert.ok(root.find((node) => node.tagName === 'button' && node.textContent.trim() === '看結果'), '答案揭曉後應能繼續');

const correctRoot = ReadingQuestions({ items: [testItem] });
const correctChoice = correctRoot.findAll((node) => node.tagName === 'button' && node.hasClass('quiz-option'))
  .find((node) => node.textContent.trim() === '正確答案');
correctChoice.dispatch('click');
const correctStatus = correctRoot.findAll((node) => node.getAttribute('role') === 'status')
  .find((node) => node.innerHTML.includes('答對了'));
assert.ok(correctStatus, '選對時應給正確回饋');
assert.ok(correctChoice.hasClass('quiz-option--correct'), '答對選項應有正確樣式');

const unkeyedRoot = ReadingQuestions({ items: [{ ...testItem, answer: null }] });
assert.match(unkeyedRoot.textContent, /答案資料尚待核對/u, '未核定答案的選擇題應停止作答，不可假裝有判分');
assert.equal(unkeyedRoot.find((node) => node.hasClass('quiz-options')), null, '未核定題目不應呈現可點選選項');

const openEndedRoot = ReadingQuestions({ items: [{
  stem: '課文中的主角為什麼改變心情？',
  scaffold: '先找出主角心情改變前後的兩段。',
  answer_hint: '想想看，發生了什麼事？',
  status: 'approved',
}] });
assert.equal(openEndedRoot.find((node) => node.hasClass('quiz-options')), null, '開放問答不應被誤轉成選擇題');
const revealButton = openEndedRoot.findAll((node) => node.tagName === 'button')
  .find((node) => node.textContent.trim() === '找哪段／哪張圖');
assert.ok(revealButton, '開放問答應先呈現第一步引導');
revealButton.dispatch('click');
assert.ok(openEndedRoot.textContent.includes('先找出主角心情改變前後的兩段。'), '開放問答第一步應揭露 scaffold');
assert.ok(openEndedRoot.findAll((node) => node.tagName === 'button').some((node) => node.textContent.trim() === '指出關鍵詞'), '開放問答應可逐步揭露下一步');

console.log(`PASS: 跨年級檢查 ${gradedQuestionCount} 題已標記答案的閱讀選擇題、開放問答 scaffold，並通過第一次提示、第二次揭曉、答對回饋與未核定題目閘門。`);
