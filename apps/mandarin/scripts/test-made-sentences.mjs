// 驗證學生造句的資料層與**個資界線**。
//
// 最重要的一條：學生自由寫的句子可能寫到自己或同學的名字，所以它存在
// 獨立的 localStorage key，records.js 的 Google 試算表同步**結構上**不可能
// 把它帶出去。這支測試就是守住這條（對應 sped-os 的資料分級 L3）。
// 用法：node scripts/test-made-sentences.mjs
import assert from 'node:assert/strict';

const store = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  },
};

const S = await import('../src/utils/madeSentences.js');
const R = await import('../src/utils/records.js');

const PATTERN = { id: 'p1', head: '無比堅定的自信', structure: '無比（形容詞）的（名詞）' };
const DAY = 86400000;

// ── 1. 句型關鍵字抽取（保守，抽不準寧可不抽）─────────
assert.deepEqual(S.patternKeywords('無比（形容詞）的（名詞）'), ['無比', '的']);
assert.deepEqual(S.patternKeywords('（名詞）從（名詞）（疊字副詞）（動詞）。'), ['從']);
assert.deepEqual(S.patternKeywords('動詞＋上／下／進／入／到＋名詞（什麼地方）'), ['上', '下', '進', '入', '到'],
  '沒加括號的「動詞」「名詞」是佔位詞，不該被當成必用字');
assert.deepEqual(S.patternKeywords('生活情境句'), [], '這是分類標籤不是句型');
assert.deepEqual(S.patternKeywords('詞語造句'), []);
assert.deepEqual(S.patternKeywords(''), []);
assert.deepEqual(S.patternKeywords(undefined), []);

// ── 2. 軟提示：依序比對，但永遠不擋送出 ─────────────
assert.deepEqual(S.missingKeywords('今天天氣很好', PATTERN), ['無比', '的']);
assert.deepEqual(S.missingKeywords('無比雄厚的實力', PATTERN), []);
assert.deepEqual(S.missingKeywords('的無比實力', PATTERN), ['的'],
  '順序不對：「的」出現在「無比」之前不算用到');

// ── 3. 硬性檢查只擋「沒寫」和「太短」─────────────────
assert.equal(S.checkSentence('').ok, false);
assert.equal(S.checkSentence('   ').ok, false);
assert.equal(S.checkSentence('我很好').ok, false, '漢字太少');
assert.equal(S.checkSentence('今天天氣很好').ok, true);
assert.equal(S.checkSentence('今天天氣很好').text, '今天天氣很好。', '句號沒打要自動補');
assert.equal(S.checkSentence('你好嗎？').text, '你好嗎？', '已經有問號就不再補');
// 完全沒照句型寫也要能送出——判斷交給教師
assert.equal(S.checkSentence('我喜歡吃蘋果').ok, true, '沒用到句型也要能送出');

// ── 4. 存、讀、同句型覆蓋 ─────────────────────────
store.clear();
assert.equal(S.saveSentence({ lessonId: 'L1', patternId: 'p1', structure: 'X', text: '第一次寫的。' }), true);
assert.equal(S.listSentences().length, 1);
assert.equal(S.listSentences()[0].mark, null, '剛寫完是「還沒看」');
S.saveSentence({ lessonId: 'L1', patternId: 'p1', structure: 'X', text: '改寫過的。' });
assert.equal(S.listSentences().length, 1, '同一課同一句型只留最新一句');
assert.equal(S.listSentences()[0].text, '改寫過的。');
S.saveSentence({ lessonId: 'L2', patternId: 'p1', structure: 'X', text: '另一課。' });
assert.equal(S.listSentences().length, 2);
assert.equal(S.listSentences('L1').length, 1, '可依課次篩選');
// 缺欄位不存
assert.equal(S.saveSentence({ lessonId: 'L1', text: '沒有句型代號' }), false);
assert.equal(S.saveSentence({ patternId: 'p1', text: '沒有課次' }), false);

// ── 5. 批改與重寫迴路 ─────────────────────────────
store.clear();
S.saveSentence({ lessonId: 'L1', patternId: 'p1', structure: 'X', text: '原本的句子。' });
assert.equal(S.pendingSentences().length, 1, '還沒批改');
assert.equal(S.redoSentences('L1').length, 0, '還沒打 ✗ 就不用重寫');

assert.equal(S.markSentence('L1', 'p1', S.MARKS.OK), true);
assert.equal(S.pendingSentences().length, 0);
assert.equal(S.redoSentences('L1').length, 0, '打 ✓ 不用重寫');

S.markSentence('L1', 'p1', S.MARKS.REDO);
assert.equal(S.redoSentences('L1').length, 1, '打 ✗ 要重寫');
assert.equal(S.markSentence('L1', '不存在', S.MARKS.OK), false);
assert.equal(S.markSentence('L1', 'p1', '亂寫'), false, '不合法的批改狀態要擋掉');

// 重寫之後回到「還沒看」，教師要再批一次
S.saveSentence({ lessonId: 'L1', patternId: 'p1', structure: 'X', text: '重寫的句子。' });
assert.equal(S.redoSentences('L1').length, 0, '重寫完就不在待重寫清單');
assert.equal(S.pendingSentences().length, 1, '重寫完要回到待批改');

// ── 6. 今天先跳過 ────────────────────────────────
S.markSentence('L1', 'p1', S.MARKS.REDO);
const now = Date.now();
assert.equal(S.redoSentences('L1', now).length, 1);
S.skipToday('L1', 'p1', now);
assert.equal(S.redoSentences('L1', now).length, 0, '今天跳過就不出現');
assert.equal(S.redoSentences('L1', now + DAY).length, 1, '明天還是要重寫');
// 教師重新批改會解除跳過
S.markSentence('L1', 'p1', S.MARKS.REDO);
assert.equal(S.redoSentences('L1', now).length, 1, '重新批改要解除「今天跳過」');

// ── 7. 個資界線：句子不可進試算表同步 ────────────────
store.clear();
const SECRET = '小明和小華一起去公園玩。';   // 假裝學生寫到同學名字
S.saveSentence({ lessonId: 'L1', patternId: 'p1', structure: 'X', text: SECRET });
R.recordAttempt('L1', 'sentence_practice', { total: 5, firstTryCount: 4, revealedCount: 0 });

// 兩者必須存在不同的 key
const keys = [...store.keys()];
assert.ok(keys.includes('mandarin:made-sentences:v1'), '句子要有自己的 key');
assert.ok(keys.includes('mandarin:records:v1'), '紀錄有自己的 key');
assert.ok(!store.get('mandarin:records:v1').includes(SECRET), '紀錄裡不該出現句子文字');

// 會送出去的兩條路徑都不可含句子
const tsv = R.recordsAsTsv(R.listRecords(), '三年級3號機');
assert.ok(!tsv.includes(SECRET), '匯出的 TSV 不該含句子文字');
assert.ok(!tsv.includes('小明') && !tsv.includes('小華'), 'TSV 不該含任何學生寫的字');

let sentBody = null;
await R.syncRecords('https://script.google.com/x', '三年級3號機', async (url, opts) => {
  sentBody = opts.body;
  return { ok: true, status: 200 };
});
assert.ok(sentBody, '應該有送出內容');
assert.ok(!sentBody.includes(SECRET), '同步到試算表的內容不該含句子文字');
assert.ok(!sentBody.includes('小明'), '同步內容不該含任何學生寫的字');

// ── 8. 清除與壞資料 ──────────────────────────────
S.clearSentences();
assert.equal(S.listSentences().length, 0);
window.localStorage.getItem = () => '{壞掉的 JSON';
assert.deepEqual(S.listSentences(), []);
window.localStorage.getItem = () => JSON.stringify({ not: 'array' });
assert.deepEqual(S.listSentences(), []);
window.localStorage.getItem = () => { throw new Error('私密瀏覽'); };
assert.deepEqual(S.listSentences(), []);
window.localStorage.getItem = () => null;
window.localStorage.setItem = () => { throw new Error('配額滿'); };
assert.doesNotThrow(() => S.saveSentence({ lessonId: 'L1', patternId: 'p1', text: '寫不進去也不能炸。' }));

console.log('✅ 造句：關鍵字保守抽取、軟提示不擋送出、批改重寫迴路、今天可跳過、'
  + '句子與紀錄分開存且不進試算表同步');
