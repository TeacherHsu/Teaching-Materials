// 驗證 src/utils/classroomKey.js：正確密碼解得開、錯密碼解不開、金鑰記得住、
// 鎖上之後課文真的從記憶體消失，而且密文檔裡沒有任何明碼課文。
//
// 這支測試守的是版權界線（sped-os ADR-0034：課文全文不進公開 repo），
// 不只是功能正確性——所以它直接讀真正的 public/data/readings.enc.json。
// 用法：node scripts/test-classroom-key.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ENC_PATH = path.join(ROOT, 'public', 'data', 'readings.enc.json');
import { classroomPassword } from './classroom-password.mjs';
const PASSWORD = classroomPassword();
if (!PASSWORD) { console.log('⏭  沒有教室密碼，略過'); process.exit(0); }

if (!fs.existsSync(ENC_PATH)) {
  console.log('⚠ 找不到 public/data/readings.enc.json，跳過（這台電腦沒有 mandarin-work）');
  process.exit(0);
}

const envelopeText = fs.readFileSync(ENC_PATH, 'utf8');
const envelope = JSON.parse(envelopeText);

// ── 1. 密文檔的形狀 ──────────────────────────────
assert.equal(envelope.v, 1, '密文格式版本應為 1');
assert.equal(envelope.kdf, 'PBKDF2-SHA256');
assert.ok(envelope.iter >= 100000, `PBKDF2 迭代次數太低：${envelope.iter}`);
assert.ok(Array.isArray(envelope.lessons) && envelope.lessons.length > 0, '應有課次清單');
assert.ok(envelope.salt && envelope.iv && envelope.data, 'salt／iv／data 都要有');

// ── 2. 密文檔內不得出現明碼課文 ────────────────────
// 課次代號可以留（manifest 需要），但不可以有課文的字句。
const SAMPLES = ['害怕的時候', '心裡颳起冷冷的風', '竹林盡頭', '盡情享受'];
for (const phrase of SAMPLES) {
  assert.ok(!envelopeText.includes(phrase), `密文檔不該含明碼課文：「${phrase}」`);
}
// 更廣的檢查：除了 manifest 的課次代號，整份檔案不該有連續三個以上漢字。
const withoutData = JSON.stringify({ ...envelope, data: '', salt: '', iv: '' });
const hanRun = withoutData.match(/[㐀-鿿]{3,}/g);
assert.equal(hanRun, null, `manifest 區出現漢字字串：${hanRun}`);

// ── 3. 假 DOM／fetch／localStorage ─────────────────
const store = new Map();
let throwOnWrite = false;
globalThis.window = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => {
      if (throwOnWrite) throw new Error('私密瀏覽');
      store.set(k, v);
    },
    removeItem: (k) => store.delete(k),
  },
};
globalThis.atob = (s) => Buffer.from(s, 'base64').toString('binary');
globalThis.btoa = (s) => Buffer.from(s, 'binary').toString('base64');
let fetchCount = 0;
globalThis.fetch = async (url) => {
  fetchCount += 1;
  assert.ok(String(url).endsWith('data/readings.enc.json'), `預期讀密文檔，實際：${url}`);
  return { ok: true, status: 200, json: async () => JSON.parse(envelopeText) };
};

const key = await import('../src/utils/classroomKey.js');

// ── 4. 沒解鎖時的狀態 ─────────────────────────────
assert.equal(key.cryptoAvailable(), true, 'Node 應該有 crypto.subtle');
assert.equal(key.isUnlocked(), false);
const lessonId = envelope.lessons[0];
assert.equal(key.getReading(lessonId), null, '沒解鎖不該拿到課文');
assert.equal(await key.hasReading(lessonId), true, '沒解鎖也要能問「有沒有這一課」');
assert.equal(await key.hasReading('不存在的課'), false);
assert.equal(fetchCount, 1, '密文檔只該讀一次（之後共用同一個 promise）');

// ── 5. 錯密碼 ────────────────────────────────────
await assert.rejects(() => key.unlockWithPassword('000000'), '錯密碼必須失敗');
assert.equal(key.isUnlocked(), false, '錯密碼不該解開任何課文');
assert.equal(store.size, 0, '錯密碼不該寫入金鑰');

// ── 6. 對密碼 ────────────────────────────────────
await key.unlockWithPassword(PASSWORD);
assert.equal(key.isUnlocked(), true);
assert.equal(store.size, 1, '解開後應記住金鑰');
assert.ok(!JSON.stringify([...store.values()]).includes(PASSWORD), '存的必須是金鑰，不是密碼');

assert.ok(key.getReading(lessonId), '應拿到第一課');

// 結構：段 → 行 → 詞；每個詞 [文字, 注音, 朗讀用字|null]。
// 全部 53 課都驗，因為對位錯一格這種 bug 只會在特定課次露出來
// （曾經因為漏算詞邊界符 `|` 的字元位置而整份注音錯一格）。
let words = 0;
let overrides = 0;
for (const id of envelope.lessons) {
  const lesson = key.getReading(id);
  assert.ok(lesson, `解鎖後應拿到 ${id}`);
  assert.ok(typeof lesson.title === 'string', `${id} 應有標題`);
  assert.ok(Array.isArray(lesson.paras) && lesson.paras.length > 0, `${id} 應有段落`);
  for (const para of lesson.paras) {
    assert.ok(Array.isArray(para) && para.length > 0, `${id} 每段至少一行`);
    for (const line of para) {
      assert.ok(Array.isArray(line) && line.length > 0, `${id} 每行至少一詞`);
      for (const word of line) {
        words += 1;
        assert.equal(word.length, 3, `${id} 詞應為 [文字, 注音, 朗讀用字]：${JSON.stringify(word)}`);
        const [text, zhuyin, say] = word;
        assert.ok(typeof text === 'string' && text.length > 0, `${id} 詞的文字不可為空`);
        assert.ok(!text.includes('|'), `${id} 詞邊界符不該進畫面：${JSON.stringify(word)}`);
        assert.equal(
          zhuyin.split(' ').length,
          [...text].length,
          `${id} 注音格數要和字數一致：${JSON.stringify(word)}`,
        );
        assert.ok(say === null || typeof say === 'string', `${id} 朗讀用字是字串或 null`);
        if (typeof say === 'string') {
          overrides += 1;
          assert.equal(
            [...say].length,
            [...text].length,
            `${id} 朗讀用字長度要和字數一致：${JSON.stringify(word)}`,
          );
        }
      }
    }
  }
}
assert.ok(words > 1000, `總詞數太少（${words}），資料可能壞了`);
assert.ok(overrides > 100, `朗讀覆寫太少（${overrides}），教師裁定的讀音可能掉了`);

// ── 7. 鎖上 ──────────────────────────────────────
key.lock();
assert.equal(key.isUnlocked(), false, '鎖上後不該還是解鎖狀態');
assert.equal(key.getReading(lessonId), null, '鎖上後課文要從記憶體消失');
assert.equal(store.size, 0, '鎖上後金鑰要清掉');

// ── 8. 用記住的金鑰解鎖 ───────────────────────────
await key.unlockWithPassword(PASSWORD);
const savedKey = store.get('mandarin:classroom-key:v1');
key.lock();
store.set('mandarin:classroom-key:v1', savedKey);
assert.equal(await key.unlockFromStore(), true, '記住的金鑰應能免密碼解鎖');
assert.equal(key.isUnlocked(), true);

// 壞掉的金鑰要被丟掉，而不是一直失敗
key.lock();
store.set('mandarin:classroom-key:v1', Buffer.alloc(32).toString('base64'));
assert.equal(await key.unlockFromStore(), false, '壞金鑰應解不開');
assert.equal(store.size, 0, '壞金鑰要自動清掉，讓教師重新輸入');

// 沒有記住金鑰時不該炸
assert.equal(await key.unlockFromStore(), false);

// ── 9. localStorage 不可寫時仍要能用 ──────────────
throwOnWrite = true;
await key.unlockWithPassword(PASSWORD);
assert.equal(key.isUnlocked(), true, '私密瀏覽也要能解鎖（只是記不住）');
throwOnWrite = false;

console.log(
  `✅ classroomKey：${envelope.lessons.length} 課密文、${words} 詞全部對位正確、` +
    `${overrides} 個朗讀覆寫、PBKDF2 ${envelope.iter} 次、` +
    '錯密碼解不開、鎖上會清乾淨、密文檔無明碼',
);
