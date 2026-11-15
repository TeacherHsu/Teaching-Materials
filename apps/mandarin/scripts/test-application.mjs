// 驗證「我會應用」：草稿只在預覽模式可玩、資料格式完整、正式建置不帶草稿、支持層不寫句子。
// 用法：node scripts/test-application.mjs
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();
const { readyApplication, canStartApplication, buildApplicationActivity } = await import('../src/activities/application.js');
const { MODULE_REGISTRY, getModuleStatus } = await import('../src/activities/moduleRegistry.js');
const { setScaffoldLevel } = await import('../src/utils/deviceSettings.js');
const { hasPlayableAnswer } = await import('../src/utils/answerGate.js');

const dataRoot = fileURLToPath(new URL('../public/data/', import.meta.url));
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
    assert.ok(task.kind && task.passage && task.situation, `${id} 要有文本類型、短文與情境`);
    const length = [...task.passage.replace(/\s/g, '')].length;
    assert.ok(length >= 30 && length <= 110, `${id} 短文 ${length} 字，應在 30～110 字`);
    assert.ok(task.questions.length >= 2 && task.questions.every(hasPlayableAnswer), `${id} 至少 2 題，答案要逐字等於某個選項`);
    assert.ok(hasPlayableAnswer(task.response), `${id} 回應題的答案要逐字等於某個選項`);
    const words = new Set(lesson.words.map((w) => w.word));
    assert.ok(task.lesson_words.length >= 2, `${id} 短文至少用到本課 2 個語詞`);
    for (const w of task.lesson_words) assert.ok(words.has(w) && task.passage.includes(w), `${id} 的「${w}」要是本課語詞且出現在短文裡`);
    const pattern = lesson.sentence_patterns.find((p) => p.id === task.write.pattern_id);
    assert.ok(pattern, `${id} 的 write.pattern_id 要指到本課句型`);
    if (task.status === 'draft') {
      // 正式模式（沒有 ?preview=1）看不到草稿
      assert.equal(canStartApplication(lesson), false, `${id} 草稿不應在正式模式出現`);
    }
    // 核准後的樣子：三步都畫得出來；支持層沒有寫句子那一步
    const approved = { ...lesson, application: { ...task, status: 'approved' } };
    assert.equal(readyApplication(approved).questions.length, task.questions.length);
    setScaffoldLevel('standard');
    let root = buildApplicationActivity(approved, () => {});
    assert.ok(root.find((n) => n.hasClass?.('application-passage')), `${id} 第一步要看得到短文卡`);
    assert.ok(root.textContent.includes('第 1／3 組'), `${id} 標準層有三步`);
    setScaffoldLevel('support');
    root = buildApplicationActivity(approved, () => {});
    assert.ok(root.textContent.includes('第 1／2 組'), `${id} 支持層只有兩步（不寫句子）`);
  }
}
assert.ok(tasks >= 3, `應至少有 3 課樣張，現在 ${tasks} 課`);
assert.match(readFileSync(new URL('./filter-build-data.mjs', import.meta.url), 'utf8'), /l\.application && !isPublic\(l\.application\.status\)/, '正式建置要濾掉未核准的生活任務');
console.log(`PASS: 我會應用 ${tasks} 課任務格式正確，草稿只在預覽模式可玩。`);
