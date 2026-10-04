// 學方法提醒：連續 2 題第一次就答錯才提醒、答對歸零、一關只提醒一次
import assert from 'node:assert/strict';
import { onStrategyNudge, noteFirstAttempt } from '../src/utils/strategyNudge.js';
let n = 0;
onStrategyNudge(() => { n += 1; });
noteFirstAttempt(false); noteFirstAttempt(true); noteFirstAttempt(false);
assert.equal(n, 0, '中間答對就歸零');
noteFirstAttempt(false);
assert.equal(n, 1, '連續 2 題答錯提醒');
noteFirstAttempt(false); noteFirstAttempt(false);
assert.equal(n, 1, '一關只提醒一次');
const { SCAFFOLD_LEVELS } = await import('../src/utils/deviceSettings.js');
assert.deepEqual(['support', 'standard', 'challenge'].map((k) => SCAFFOLD_LEVELS[k].autoStrategy), [true, false, false]);
console.log('✅ 學方法：支持組自動示範、連錯 2 題提醒一次');
