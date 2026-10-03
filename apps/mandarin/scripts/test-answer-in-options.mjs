// 資料閘門：閱讀題、聽聽看的選擇題，answer 必須逐字等於某個選項。
// 前端也會擋（utils/answerGate.js），這裡是讓壞資料根本進不了 main。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasPlayableAnswer } from '../src/utils/answerGate.js';

const dataRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data');
const bad = [];
let checked = 0;
for (const vol of fs.readdirSync(dataRoot).filter((n) => /^115AG\d/.test(n))) {
  for (const f of fs.readdirSync(path.join(dataRoot, vol)).filter((n) => /^lesson\d+\.json$/.test(n))) {
    const lesson = JSON.parse(fs.readFileSync(path.join(dataRoot, vol, f), 'utf8'));
    for (const field of ['reading_questions', 'listening']) {
      for (const q of lesson[field] || []) {
        if (!Array.isArray(q.options) || q.options.length === 0) continue; // 開放問答不在此限
        checked += 1;
        if (!hasPlayableAnswer(q)) bad.push(`${lesson.lesson_id} ${field} ${q.id}`);
      }
    }
  }
}
assert.equal(bad.length, 0, `答案不在選項裡（學生選不到正解）：\n${bad.join('\n')}`);
assert.ok(!hasPlayableAnswer({ options: ['甲', '乙'], answer: '甲。' }));
console.log(`✅ ${checked} 題選擇題的答案都逐字等於某個選項`);
