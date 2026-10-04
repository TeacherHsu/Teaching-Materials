// 學方法內容完整：每個大項都有方法、示範至少兩步、一起做的正解有效、每個錯誤選項都有原因
import assert from 'node:assert/strict';
import { installFakeDom } from './fake-dom.mjs';
installFakeDom();
const { STRATEGY_LIBRARY, MODULE_STRATEGY } = await import('../src/activities/strategyLibrary.js');
const { LibraryStrategy } = await import('../src/components/LibraryStrategy.js');
const { MODULE_REGISTRY } = await import('../src/activities/moduleRegistry.js');

const covered = new Set([...Object.keys(MODULE_STRATEGY), 'reading', 'characters', 'review']);
for (const m of MODULE_REGISTRY) assert.ok(covered.has(m.key), `${m.label}（${m.key}）還沒有學方法`);
for (const [key, s] of Object.entries(STRATEGY_LIBRARY)) {
  assert.ok(s.title && s.goal, `${key} 要有標題和一句話方法`);
  assert.ok(s.frames.length >= 2, `${key} 示範至少兩步`);
  for (const f of s.frames) assert.ok(f.say && f.lines.length, `${key} 每一步都要有畫面和放聲思考`);
  const g = s.guided;
  assert.ok(g.choices[g.answer], `${key} 一起做的正解要存在`);
  g.choices.forEach((_, i) => { if (i !== g.answer) assert.ok(g.why[i], `${key} 錯誤選項 ${i} 要說明原因`); });
  assert.ok(LibraryStrategy(key, () => {}), `${key} 要畫得出來`);
}
for (const key of Object.values(MODULE_STRATEGY)) assert.ok(STRATEGY_LIBRARY[key], `找不到 ${key}`);
console.log(`✅ ${Object.keys(STRATEGY_LIBRARY).length} 個學方法內容完整，所有大項都有學方法（舊字新詞為複習，不另設）`);
