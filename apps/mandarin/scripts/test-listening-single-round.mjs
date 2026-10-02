// 驗證「聽聽看」3 題會被當成同一組作答，TaskBanner「共 N 題」與題目內部
// ProgressIndicator「第 X / N 題」的 N 要一致，不能被切成各自獨立的一組（1/1）。
// 無新依賴，純 Node（fake-dom stub）。
// 用法：node scripts/test-listening-single-round.mjs
import assert from 'node:assert/strict';
import { installFakeDom, installFakeSpeechSynthesis } from './fake-dom.mjs';

installFakeDom();
installFakeSpeechSynthesis([{ lang: 'zh-TW', name: 'Taiwan test voice' }]);
const { buildListeningActivity } = await import('../src/activities/listening.js');

const N = 3;
const items = Array.from({ length: N }, (_, i) => ({
  id: `l${i}`,
  stem: `小明在公園裡玩耍第 ${i} 句`,
  question: `這句話在說誰？${i}`,
  passage: `課文段落第 ${i}`,
  options: ['小明', '小華', '小美'],
  answer: '小明',
  status: 'ready',
}));

const lesson = { listening: items };
const container = buildListeningActivity(lesson, () => {});

const passageButton = container
  .findAll((n) => n.tagName === 'button')
  .find((button) => button.getAttribute('aria-label') === '先聽一聽：課文段落');
assert.ok(passageButton, '每題應提供「先聽一聽」課文段落語音按鈕');
assert.ok(passageButton.textContent.startsWith('先聽一聽'), '課文段落語音按鈕應在喇叭圖示前顯示「先聽一聽」');
assert.ok(!container.textContent.includes('課文段落第 0'), '課文段落只作為語音來源，不應全文顯示在頁面上');

const bannerText = container.find((n) => n.hasClass('task-step')).textContent;
// 核心練習不再標「本課先完成」（CF 決定移除，對學生是非必要資訊、造成干擾）；
// TaskBanner 只留任務本身，「加練挑戰」才會另外標示。
assert.ok(bannerText.includes('仔細聽'), `TaskBanner 應顯示任務說明，實際：${bannerText}`);
assert.ok(!bannerText.includes('本課先完成'), `TaskBanner 不應再標示「本課先完成」，實際：${bannerText}`);

function progressText() {
  const progress = container.find((n) => n.hasClass('progress-indicator'));
  assert.ok(progress, '應該要有 ProgressIndicator');
  return progress.children[0].textContent;
}

// 第一題：應該是「第 1 / 3 題」，不是「第 1 / 1 題」。
let text = progressText();
assert.equal(text, `第 1 / ${N} 題`, `第一題計數應為「第 1 / ${N} 題」，實際：${text}`);

// 逐題按「正確答案」推進，確認每一題的 total 都固定是 N（同一組）。
for (let i = 1; i <= N; i += 1) {
  text = progressText();
  assert.equal(text, `第 ${i} / ${N} 題`, `第 ${i} 題計數應為「第 ${i} / ${N} 題」，實際：${text}`);
  const correctBtn = container.findAll((n) => n.tagName === 'button' && n.hasClass('quiz-option')).find((b) =>
    b.textContent.includes('小明'),
  );
  assert.ok(correctBtn, `第 ${i} 題應找到正確選項按鈕`);
  correctBtn.dispatch('click');
  const nextBtn = container.findAll((n) => n.tagName === 'button').find((b) => /下一題|看結果/.test(b.textContent));
  assert.ok(nextBtn, `第 ${i} 題答對後應有「下一題／看結果」按鈕`);
  nextBtn.dispatch('click');
}

console.log(`PASS: 聽聽看 ${N} 題同一組作答，TaskBanner 與題目計數皆一致（不會出現「第 1/1 題」）。`);
