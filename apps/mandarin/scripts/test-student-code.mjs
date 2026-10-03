// 學生代碼：只收英數 8 碼、作答紀錄依代碼分開、匯出含代碼欄。
import assert from 'node:assert/strict';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();
const D = await import('../src/utils/deviceSettings.js');
const R = await import('../src/utils/records.js');

assert.equal(D.setStudentCode('王小明'), false, '中文（可能是姓名）不收');
assert.equal(D.setStudentCode('S03-ABCDE'), false, '超過 8 碼不收');
assert.equal(D.setStudentCode('s03'), true);
assert.equal(D.getStudentCode(), 'S03', '轉大寫');

const sess = { total: 4, firstTryCount: 2, hintedCount: 1, revealedCount: 1 };
R.recordAttempt('115AG3H01', 'reading', sess, '2026-10-03T01:00:00Z');
D.setStudentCode('S07');
R.recordAttempt('115AG3H01', 'reading', { ...sess, firstTryCount: 4, hintedCount: 0, revealedCount: 0 }, '2026-10-03T02:00:00Z');
const rows = R.listRecords();
assert.equal(rows.length, 2, '同一課同一大項，不同學生分成兩列');
assert.deepEqual(rows.map((r) => r.student).sort(), ['S03', 'S07']);
const tsv = R.recordsAsTsv(rows, '3號機');
assert.match(tsv.split('\n')[0], /學生代碼/);
assert.match(tsv, /3號機\tS03\t115AG3H01/);
assert.equal(R.unsyncedAttempts().every((a) => a.student), true);

// 每個學生各留 20 筆，不互相擠掉
for (let i = 0; i < 25; i += 1) R.recordAttempt('115AG3H02', 'vocabulary', sess, `2026-10-03T03:${String(i).padStart(2, '0')}:00Z`, 'S07');
R.recordAttempt('115AG3H02', 'vocabulary', sess, '2026-10-03T04:00:00Z', 'S03');
const v = R.listRecords().filter((r) => r.lessonId === '115AG3H02');
assert.equal(v.find((r) => r.student === 'S07').attempts, 20);
assert.equal(v.find((r) => r.student === 'S03').attempts, 1);
console.log('✅ 學生代碼：格式限制、依代碼分開統計、匯出與同步都帶代碼、每人各留 20 筆');
