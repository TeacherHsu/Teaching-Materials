// 作答紀錄：正確率＝第一次就答對的比率，且不得儲存任何個人資料。
import assert from 'node:assert/strict';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();
const { accuracyOf, recordAttempt, listRecords, recordsAsTsv, clearRecords } = await import('../src/utils/records.js');

clearRecords();
assert.equal(accuracyOf({ total: 0, firstTryCount: 0 }), null, '沒有可判定題目時沒有正確率');
assert.equal(accuracyOf({ total: 4, firstTryCount: 3 }), 0.75);

recordAttempt('115AG3H01', 'characters', { total: 5, firstTryCount: 4, revealedCount: 0 }, '2026-09-30T01:00:00Z');
recordAttempt('115AG3H01', 'characters', { total: 5, firstTryCount: 2, revealedCount: 1 }, '2026-09-30T02:00:00Z');
recordAttempt('115AG3H02', 'main_idea', { total: 1, firstTryCount: 1, revealedCount: 0 }, '2026-09-30T03:00:00Z');

const rows = listRecords();
assert.equal(rows.length, 2, '兩個課次／大項組合');
assert.equal(rows[0].lessonId, '115AG3H02', '最近的排前面');
const characters = rows.find((r) => r.moduleKey === 'characters');
assert.equal(characters.attempts, 2, '同一大項的多次練習都留下');
assert.equal(characters.latest.accuracy, 0.4, '最近一次是第二次的成績');
assert.equal(characters.best, 0.8, '最佳成績保留第一次的 80%');

// 純瀏覽步驟（total 0）不留紀錄，避免灌水
const before = listRecords().length;
recordAttempt('115AG3H03', 'reading', { total: 0, firstTryCount: 0, revealedCount: 0 });
assert.equal(listRecords().length, before, '沒有可判定題目時不記錄');

const tsv = recordsAsTsv(listRecords(), '三年級1號機');
assert.match(tsv, /載具\t課次\t大項/, 'TSV 有表頭');
assert.match(tsv, /三年級1號機/, '帶入載具標記');
assert.ok(!/姓名|學生/.test(tsv), '匯出內容不得含姓名欄位');

clearRecords();
assert.equal(listRecords().length, 0, '清除後沒有紀錄');
console.log('PASS: 正確率以第一次作答計算，紀錄可匯出且不含個人資料。');
