// 星星規則是精熟導向：用提示不扣分，只有「被揭曉正解」才扣。
import assert from 'node:assert/strict';
import { computeModuleStars, firstTryBadge } from '../src/utils/scoring.js';

// 關鍵：看過提示但最後自己答對，仍是滿星——鷹架不可以有代價。
assert.equal(computeModuleStars({ total: 5, firstTryCount: 0, revealedCount: 0 }), 3,
  '全部靠提示但最後都自己答對，仍應給 3 顆星（不可懲罰使用鷹階）');
assert.equal(computeModuleStars({ total: 5, firstTryCount: 5, revealedCount: 0 }), 3, '全部一次就對也是 3 顆星');
assert.equal(computeModuleStars({ total: 5, firstTryCount: 3, revealedCount: 1 }), 2, '一題被揭曉降為 2 顆星');
assert.equal(computeModuleStars({ total: 5, firstTryCount: 0, revealedCount: 3 }), 1, '多題被揭曉仍給完成鼓勵星');
assert.equal(computeModuleStars({ total: 0, firstTryCount: 0, revealedCount: 0 }), 0, '純瀏覽步驟不計星');

// 「一次就對」改以徽章呈現，不影響星數
assert.equal(firstTryBadge({ total: 5, firstTryCount: 5 }).level, 'gold');
assert.equal(firstTryBadge({ total: 5, firstTryCount: 3 }).level, 'silver');
assert.equal(firstTryBadge({ total: 5, firstTryCount: 1 }), null);
assert.equal(firstTryBadge({ total: 0, firstTryCount: 0 }), null);
console.log('PASS: 星星為精熟導向，提示不扣分；一次就對改以徽章呈現。');
