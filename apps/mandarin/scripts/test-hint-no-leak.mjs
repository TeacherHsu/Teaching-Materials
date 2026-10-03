// 提示不能直接說出答案：修辭題提示不得出現修辭名稱；多音字、形似字提示不得出現本題語詞的答案寫法。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rhetoricHints } from '../src/activities/rhetoric.js';
import { polyphoneHints } from '../src/activities/polyphones.js';
import { lookalikeHints } from '../src/activities/lookalikes.js';
import { pronunciationHints } from '../src/activities/pronunciationQuestions.js';

const dataRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data');
let n = 0;
for (const vol of fs.readdirSync(dataRoot).filter((x) => /^115AG\d/.test(x))) {
  for (const f of fs.readdirSync(path.join(dataRoot, vol)).filter((x) => /^lesson\d+\.json$/.test(x))) {
    const lesson = JSON.parse(fs.readFileSync(path.join(dataRoot, vol, f), 'utf8'));
    for (const r of lesson.rhetoric || []) {
      n += 1;
      for (const h of rhetoricHints(r, 3)) assert.ok(!h.text.includes(r.figure), `${lesson.lesson_id} ${r.id} 提示洩漏修辭名稱「${r.figure}」`);
    }
  }
}
const ph = polyphoneHints({ example: '彈珠', zhuyin: 'ㄉㄢˋ', readings: [{ zhuyin: 'ㄊㄢˊ', examples: ['彈力', '反彈'] }, { zhuyin: 'ㄉㄢˋ', examples: ['彈珠', '子彈'] }] });
assert.ok(!ph[1].text.includes('ㄉㄢˋ：彈珠'), '對照例詞要排除本題語詞');
const lh = lookalikeHints({ chars: [{ char: '社', example: '社會' }, { char: '杜', example: '杜鵑' }] }, { char: '社', example: '社會' }, '＿會', '社會');
assert.ok(!lh[0].text.includes('社') && !lh[1].text.includes('社會'), '形似字前兩層不能露出正確字');
// 第二版審查：提示不只看文字，念出來的內容（speak）也不能等於給答案
let checkedSpeak = 0;
for (const vol of fs.readdirSync(dataRoot).filter((x) => /^115AG\d/.test(x))) {
  for (const f of fs.readdirSync(path.join(dataRoot, vol)).filter((x) => /^lesson\d+\.json$/.test(x))) {
    const lesson = JSON.parse(fs.readFileSync(path.join(dataRoot, vol, f), 'utf8'));
    for (const c of lesson.characters || []) {
      for (const h of pronunciationHints(c, 3)) {
        checkedSpeak += 1;
        assert.ok(!(h.speak && h.speak.includes(c.char)), `${lesson.lesson_id} ${c.char}：讀音提示念出含目標字的語詞＝直接給讀音`);
      }
    }
    for (const g of lesson.lookalikes || []) {
      for (const t of (g.chars || []).filter((x) => x.char && x.example)) {
        const ex = String(t.example).split(/[、,，]/u)[0];
        for (const h of lookalikeHints({ chars: g.chars }, t, ex.replace(t.char, '＿'), ex)) {
          assert.ok(!h.speak, `${lesson.lesson_id} ${t.char}：形似字提示不可念出語詞（靠聲音就分得出）`);
        }
      }
    }
  }
}
assert.ok(checkedSpeak > 0);
console.log(`✅ ${n} 題修辭提示、多音字、形似字提示都不洩答案`);
