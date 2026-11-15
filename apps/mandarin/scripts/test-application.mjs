// 驗證「我會應用」：草稿只在預覽模式可玩、資料格式完整、正式建置不帶草稿、支持層不寫句子。
// 用法：node scripts/test-application.mjs
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();
const { readyApplication, canStartApplication, buildApplicationActivity } = await import('../src/activities/application.js');
const { MODULE_REGISTRY, getModuleStatus } = await import('../src/activities/moduleRegistry.js');
const { setScaffoldLevel } = await import('../src/utils/deviceSettings.js');
const { hasPlayableAnswer } = await import('../src/utils/answerGate.js');

const dataRoot = fileURLToPath(new URL('../public/data/', import.meta.url));
const publicRoot = fileURLToPath(new URL('../public/', import.meta.url));
const entry = MODULE_REGISTRY.find((m) => m.key === 'application');
assert.ok(entry, '註冊表要有 application');

let tasks = 0;
for (const volume of readdirSync(dataRoot).filter((v) => /^115A/.test(v))) {
  for (const name of readdirSync(`${dataRoot}${volume}`).filter((f) => /^lesson\d+\.json$/.test(f))) {
    const lesson = JSON.parse(readFileSync(`${dataRoot}${volume}/${name}`, 'utf8'));
    const task = lesson.application;
    if (!task) {
      // 沒有任務的課：學生端不顯示這張卡（狀態是「本課尚未建立」，不是「審核中」）
      assert.equal(getModuleStatus(lesson, entry).code, 'coming_soon', `${lesson.lesson_id} 沒有任務時不應算進進度`);
      continue;
    }
    tasks += 1;
    const id = lesson.lesson_id;
    assert.ok(['draft', 'approved'].includes(task.status), `${id} 任務狀態只能是 draft 或 approved`);
    const words = new Set(lesson.words.map((w) => w.word));
    const picture = task.variant === 'picture';
    let pattern = null;
    if (picture) {
      // 一年級：看圖選一句話
      assert.ok(task.items.length >= 2, `${id} 至少 2 張圖`);
      for (const item of task.items) {
        assert.ok(hasPlayableAnswer(item), `${id}「${item.word}」答案要逐字等於某個選項`);
        assert.ok(words.has(item.word) && item.answer.includes(item.word), `${id}「${item.word}」要是本課語詞且出現在正確句裡`);
        assert.ok(existsSync(`${publicRoot}${item.image.replace(/^\//, '')}`), `${id}「${item.word}」的圖不存在：${item.image}`);
        assert.ok(item.options.every((o) => [...o].length <= 14), `${id}「${item.word}」的句子要短（14 字內）`);
      }
    } else {
      assert.ok(task.kind && task.passage && task.situation, `${id} 要有文本類型、短文與情境`);
      const length = [...task.passage.replace(/\s/g, '')].length;
      assert.ok(length >= 30 && length <= 110, `${id} 短文 ${length} 字，應在 30～110 字`);
      assert.ok(task.questions.length >= 2 && task.questions.every(hasPlayableAnswer), `${id} 至少 2 題，答案要逐字等於某個選項`);
      assert.ok(hasPlayableAnswer(task.response), `${id} 回應題的答案要逐字等於某個選項`);
      assert.ok(task.lesson_words.length >= 2, `${id} 短文至少用到本課 2 個語詞`);
      // 答錯時要畫顏色的關鍵字詞：一定要真的在短文卡上；理解題每一題都要有
      const cardText = [task.title, task.passage, task.signature].filter(Boolean).join('\n');
      for (const q of [...task.questions, task.response]) {
        for (const phrase of q.evidence || []) assert.ok(cardText.replace(/\n/g, '').includes(phrase) || cardText.includes(phrase), `${id} 的關鍵字詞「${phrase}」不在短文卡上`);
      }
      for (const q of task.questions) assert.ok(q.evidence?.length, `${id}「${q.question}」沒有關鍵字詞，答錯時畫不出線索`);
      for (const w of task.lesson_words) assert.ok(words.has(w) && task.passage.includes(w), `${id} 的「${w}」要是本課語詞且出現在短文裡`);
      // 沒有合適句型的課可以不寫句子；有寫就要指到本課句型
      if (task.write) {
        pattern = lesson.sentence_patterns.find((p) => p.id === task.write.pattern_id);
        assert.ok(pattern, `${id} 的 write.pattern_id 要指到本課句型`);
      }
    }
    if (task.status === 'draft') {
      // 正式模式（沒有 ?preview=1）看不到草稿
      assert.equal(canStartApplication(lesson), false, `${id} 草稿不應在正式模式出現`);
    }
    // 核准後的樣子：三步都畫得出來；支持層沒有寫句子那一步
    const approved = { ...lesson, application: { ...task, status: 'approved' } };
    setScaffoldLevel('standard');
    let root = buildApplicationActivity(approved, () => {});
    if (picture) {
      assert.equal(readyApplication(approved).items.length, task.items.length);
      assert.ok(root.find((n) => n.hasClass?.('application-picture')), `${id} 要看得到圖`);
    } else {
      assert.equal(readyApplication(approved).questions.length, task.questions.length);
      assert.ok(root.find((n) => n.hasClass?.('application-passage')), `${id} 第一步要看得到短文卡`);
      assert.ok(root.textContent.includes(pattern ? '第 1／3 組' : '第 1／2 組'), `${id} 標準層的步驟數不對`);
      // 進到題目，答錯一次：短文卡上要出現畫了顏色的關鍵字詞，而且就是這一題的線索
      root.findAll((n) => n.tagName === 'button').find((b) => b.textContent === '我讀完了').dispatch('click');
      assert.equal(root.find((n) => n.hasClass?.('application-passage__key')), null, `${id} 還沒答錯前不應該先畫線索`);
      const first = task.questions[0];
      const wrong = root.findAll((n) => n.hasClass?.('quiz-option')).find((o) => !o.textContent.includes(first.answer));
      wrong.dispatch('click');
      root.findAll((n) => n.tagName === 'button').find((b) => b.textContent.trim() === '確認答案')?.dispatch('click');
      const marks = root.findAll((n) => n.hasClass?.('application-passage__key')).map((n) => n.textContent);
      assert.deepEqual(marks.sort(), [...first.evidence].sort(), `${id} 答錯一次後應畫出這一題的關鍵字詞`);
      setScaffoldLevel('support');
      root = buildApplicationActivity(approved, () => {});
      assert.ok(root.textContent.includes('第 1／2 組'), `${id} 支持層只有兩步（不寫句子）`);
    }
  }
}
assert.ok(tasks >= 3, `應至少有 3 課樣張，現在 ${tasks} 課`);
assert.match(readFileSync(new URL('./filter-build-data.mjs', import.meta.url), 'utf8'), /l\.application && !isPublic\(l\.application\.status\)/, '正式建置要濾掉未核准的生活任務');
// 手機寬度：題目頁的短文卡預設收合，按鈕可打開；答錯一次會自動打開並畫出線索。桌機預設展開。
{
  const sample = JSON.parse(readFileSync(`${dataRoot}115AG3H/lesson02.json`, 'utf8'));
  const originalMatchMedia = globalThis.window.matchMedia;
  const play = (narrow) => {
    globalThis.window.matchMedia = (query) => ({ matches: narrow && /max-width/.test(query) });
    setScaffoldLevel('standard');
    const root = buildApplicationActivity(sample, () => {});
    root.findAll((n) => n.tagName === 'button').find((b) => b.textContent === '我讀完了').dispatch('click');
    return root;
  };
  const collapsed = (root) => root.find((n) => n.hasClass?.('application-passage--compact')).hasClass('application-passage--collapsed');
  const desktop = play(false);
  assert.equal(collapsed(desktop), false, '桌機：題目頁短文卡預設展開');
  const phone = play(true);
  assert.equal(collapsed(phone), true, '手機：題目頁短文卡預設收合');
  const toggle = phone.find((n) => n.hasClass?.('application-passage__toggle'));
  assert.equal(toggle.textContent, '再看一次便利貼');
  toggle.dispatch('click');
  assert.equal(collapsed(phone), false, '按一下要打開');
  toggle.dispatch('click');
  assert.equal(collapsed(phone), true, '再按一下收起來');
  const first = sample.application.questions[0];
  phone.findAll((n) => n.hasClass?.('quiz-option')).find((o) => !o.textContent.includes(first.answer)).dispatch('click');
  phone.findAll((n) => n.tagName === 'button').find((b) => b.textContent.trim() === '確認答案')?.dispatch('click');
  assert.equal(collapsed(phone), false, '答錯一次要自動打開短文卡');
  assert.ok(phone.find((n) => n.hasClass?.('application-passage__key')), '打開後要看得到畫了顏色的線索');
  globalThis.window.matchMedia = originalMatchMedia;
}
console.log(`PASS: 我會應用 ${tasks} 課任務格式正確，草稿只在預覽模式可玩。`);
