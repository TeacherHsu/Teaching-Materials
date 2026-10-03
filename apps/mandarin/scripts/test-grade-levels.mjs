// 等級依年級記、升降級建議依年級算（CF 2026-10-03：同一台平板會給不同年級用）。
import assert from 'node:assert/strict';

const store = new Map();
Object.defineProperty(globalThis, 'window', { configurable: true, value: globalThis });
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
});

const S = await import('../src/utils/deviceSettings.js');
const R = await import('../src/utils/records.js');

// ── 等級依年級
S.setScaffoldLevel('standard', null);           // 整台預設
S.setLastGrade('6');
S.setScaffoldLevel('challenge');                // 只改六年級
assert.equal(S.getScaffoldLevelKey(), 'challenge');
S.setLastGrade('2');
assert.equal(S.getScaffoldLevelKey(), 'standard', '二年級沒設定過，用整台預設，不被六年級影響');
assert.equal(S.hasGradeLevel('2'), false);
S.setScaffoldLevel('support');
assert.equal(S.getScaffoldLevelKey(), 'support');
S.setLastGrade('6');
assert.equal(S.getScaffoldLevelKey(), 'challenge', '切回六年級還是挑戰層');

// 舊資料（只有整台 scaffoldLevel）照樣有效
store.set('mandarin:settings:v1', JSON.stringify({ scaffoldLevel: 'support', lastGrade: '4' }));
const keys = [...store.keys()];
const settingsKey = keys.find((k) => /settings/.test(k));
store.set(settingsKey, JSON.stringify({ scaffoldLevel: 'support', lastGrade: '4' }));
assert.equal(S.getScaffoldLevelKey(), 'support', '升級前的整台設定要繼續有效');

// ── 升降級建議
const now = Date.parse('2026-10-03T12:00:00Z');
const at = new Date(now - 24 * 3600 * 1000).toISOString();
S.setScaffoldLevel('standard'); // 紀錄會帶作答當時的鷹架層
R.recordAttempt('115AG6H01', 'reading', { total: 20, firstTryCount: 18, revealedCount: 0 }, at); // 六年級 90%
R.recordAttempt('115AG2H01', 'reading', { total: 20, firstTryCount: 6, revealedCount: 4 }, at);  // 二年級 30%

const g6 = R.levelAdvice('6', 'standard', { now });
assert.equal(g6.advice, 'up', '獨立答對 8 成以上建議升級');
assert.equal(R.levelAdvice('6', 'challenge', { now }).advice, null, '只拿同一層的作答比：挑戰層沒有紀錄就不給建議');
// 共用平板：只算目前這位學生代碼的作答
R.recordAttempt('115AG6H02', 'reading', { total: 20, firstTryCount: 2, revealedCount: 10 }, at, 'S09');
assert.equal(R.levelAdvice('6', 'standard', { now }).advice, 'up', '別的代碼的低分不影響這位學生');
assert.equal(R.levelAdvice('6', 'standard', { now, student: 'S09' }).advice, 'down', '依代碼分開算');
const g2 = R.levelAdvice('2', 'standard', { now });
assert.equal(g2.advice, 'down', '低於 5 成建議降級');
assert.equal(Math.round(g2.rate * 100), 30, '只算二年級的題目，不混入六年級');
assert.equal(R.levelAdvice('3', 'standard', { now }).advice, null, '沒有紀錄不給建議');

const old = new Date(now - 40 * 24 * 3600 * 1000).toISOString();
R.recordAttempt('115AG3H01', 'reading', { total: 30, firstTryCount: 30, revealedCount: 0 }, old);
assert.equal(R.levelAdvice('3', 'standard', { now }).advice, null, '超過三週的舊紀錄不算');

console.log('✅ 等級依年級各自記、舊設定相容；升降級建議只算該年級、近三週、題數足夠才給');
