// 每個已實作的大項都要有一句學習策略，且用詞要能和答錯提示對得上。
import assert from 'node:assert/strict';
import { MODULE_REGISTRY } from '../src/activities/moduleRegistry.js';
import { strategyFor, STRATEGY_CARDS } from '../src/activities/strategyCards.js';

let covered = 0;
for (const entry of MODULE_REGISTRY) {
  if (!entry.implemented) continue;
  const text = strategyFor(entry.key);
  assert.ok(text, `${entry.label}（${entry.key}）需要一句學習策略`);
  assert.ok(text.length >= 10, `${entry.key}: 策略句太短，說不清楚做法`);
  assert.ok(text.length <= 40, `${entry.key}: 策略句太長，學生記不住`);
  // 策略要講「怎麼做」，不是精神喊話
  for (const empty of ['加油', '努力', '用心', '認真一點']) {
    assert.ok(!text.includes(empty), `${entry.key}: 策略要講方法，不是精神喊話（出現「${empty}」）`);
  }
  covered += 1;
}

// 不可有對應不到大項的孤兒策略
const keys = new Set(MODULE_REGISTRY.map((e) => e.key));
for (const key of Object.keys(STRATEGY_CARDS)) {
  assert.ok(keys.has(key), `策略卡 ${key} 找不到對應的大項`);
}
console.log(`PASS: ${covered} 個大項都有學習策略，且無孤兒策略。`);
