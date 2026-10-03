// 作答紀錄：正確率＝第一次就答對的比率，且不得儲存任何個人資料。
import assert from 'node:assert/strict';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();
const { accuracyOf, recordAttempt, listRecords, recordsAsTsv, clearRecords, unsyncedAttempts, syncRecords } = await import('../src/utils/records.js');
const { setSheetUrl, getSheetUrl } = await import('../src/utils/deviceSettings.js');

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
assert.match(tsv, /載具\t學生代碼\t課次\t大項/, 'TSV 有表頭');
assert.match(tsv, /三年級1號機/, '帶入載具標記');
assert.ok(!/姓名/.test(tsv), '匯出內容不得含姓名欄位（學生代碼可以，CF 2026-10-03 同意）');

clearRecords();
assert.equal(listRecords().length, 0, '清除後沒有紀錄');

// ---- Google 試算表同步 ----
// 網址等同寫入權限，只接受 Apps Script 網域，避免成績送錯對象。
assert.equal(setSheetUrl('https://example.com/hook'), false, '非 Apps Script 網址不可寫入');
assert.equal(setSheetUrl('https://script.google.com/macros/s/abc/exec'), true);
assert.equal(getSheetUrl(), 'https://script.google.com/macros/s/abc/exec');

recordAttempt('115AG3H01', 'characters', { total: 4, firstTryCount: 2, revealedCount: 0 }, '2026-09-30T05:00:00Z');
assert.equal(unsyncedAttempts().length, 1, '新紀錄預設未同步');

// 連線失敗時不可標記為已同步，紀錄必須留著下次再送
const failed = await syncRecords(getSheetUrl(), '1號機', async () => { throw new Error('offline'); });
assert.equal(failed.ok, false);
assert.equal(unsyncedAttempts().length, 1, '同步失敗後紀錄仍未同步');

// HTTP 非 2xx 也算失敗
const rejected = await syncRecords(getSheetUrl(), '1號機', async () => ({ ok: false, status: 403 }));
assert.equal(rejected.ok, false);
assert.match(rejected.message, /403/);
assert.equal(unsyncedAttempts().length, 1);

let sentBody = null;
const okSync = await syncRecords(getSheetUrl(), '1號機', async (url, init) => {
  sentBody = JSON.parse(init.body);
  assert.match(init.headers['Content-Type'], /text\/plain/, '用 text/plain 避免 CORS preflight');
  return { ok: true, status: 200 };
});
assert.equal(okSync.ok, true);
assert.equal(okSync.sent, 1);
assert.equal(unsyncedAttempts().length, 0, '成功後標記為已同步');
assert.equal(sentBody.rows[0].device, '1號機');
assert.ok(!('name' in sentBody.rows[0]), '送出的內容不得含姓名欄位');

// 重複按不會重送
const again = await syncRecords(getSheetUrl(), '1號機', async () => ({ ok: true, status: 200 }));
assert.equal(again.sent, 0, '重複同步不會重複寫入');

clearRecords();
setSheetUrl('');
console.log('PASS: 正確率以第一次作答計算；同步只送新紀錄、失敗不誤標、不含個資。');
