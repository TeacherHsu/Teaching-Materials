// 注音高手：音節切分、鍵盤排列、候選字與出題閘門。
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installFakeDom } from './fake-dom.mjs';
import { splitSyllables, syllablesMatchWord, syllableKeys } from '../src/utils/zhuyin.js';
import { KEY_MAP, KEYBOARD_ROWS, symbolKind } from '../src/components/ZhuyinKeyboard.js';

installFakeDom();
const { typableWords, canStartZhuyinTyping, pickCandidates } = await import('../src/activities/zhuyinTyping.js');

// ---- 音節切分：有無空白都要對 ----
assert.deepEqual(splitSyllables('ㄧㄡˊㄩㄥˇ'), ['ㄧㄡˊ', 'ㄩㄥˇ'], '無空白也要切得開');
assert.deepEqual(splitSyllables('ㄌㄧㄢˊ ㄧ'), ['ㄌㄧㄢˊ', 'ㄧ'], '空白分隔');
// 輕聲一律輸出**顯示形式**（前置，˙ㄗ）——台灣的印刷慣例，學生看到的就是這樣。
// 敲鍵順序（後置）由 syllableKeys 負責，見下面。
assert.deepEqual(splitSyllables('ㄕ ˙ㄗ ㄨㄤˊ'), ['ㄕ', '˙ㄗ', 'ㄨㄤˊ'], '輕聲前置，靠空白斷句');
assert.deepEqual(splitSyllables('ㄕ ㄗ˙ ㄨㄤˊ'), ['ㄕ', '˙ㄗ', 'ㄨㄤˊ'], '來源寫成後置也要正規化成前置');
assert.deepEqual(splitSyllables('ㄐㄧㄝˇ˙ㄐㄧㄝ'), ['ㄐㄧㄝˇ', '˙ㄐㄧㄝ'], '無空白＋前置輕聲也要切得對');
assert.deepEqual(splitSyllables('˙ㄌㄜ'), ['˙ㄌㄜ'], '單音節輕聲');
assert.deepEqual(splitSyllables('ㄉㄨㄛㄘㄞˇㄉㄨㄛㄗ'), ['ㄉㄨㄛ', 'ㄘㄞˇ', 'ㄉㄨㄛ', 'ㄗ'], '空韻單獨成音節');

// ---- 敲鍵順序：輕聲要移到最後 ----
// 注音輸入法是最後才按聲調，所以顯示是 ˙ㄌㄜ，敲的是 ㄌ → ㄜ → ˙。
assert.deepEqual(syllableKeys('˙ㄌㄜ'), ['ㄌ', 'ㄜ', '˙'], '輕聲敲鍵要在最後');
assert.deepEqual(syllableKeys('ㄏㄡˋ'), ['ㄏ', 'ㄡ', 'ˋ'], '一般聲調本來就在最後');
assert.deepEqual(syllableKeys('ㄗ'), ['ㄗ'], '一聲不帶符號');

// ---- 鍵盤排列必須是大千標準，不可為了排版重排 ----
assert.equal(Object.keys(KEY_MAP).length, 41, '41 個鍵（37 注音＋4 聲調）');
const expected = {
  1: 'ㄅ', 2: 'ㄉ', 3: 'ˇ', 4: 'ˋ', 5: 'ㄓ', 6: 'ˊ', 7: '˙', 8: 'ㄚ', 9: 'ㄞ', 0: 'ㄢ', '-': 'ㄦ',
  q: 'ㄆ', w: 'ㄊ', e: 'ㄍ', r: 'ㄐ', t: 'ㄔ', y: 'ㄗ', u: 'ㄧ', i: 'ㄛ', o: 'ㄟ', p: 'ㄣ',
  a: 'ㄇ', s: 'ㄋ', d: 'ㄎ', f: 'ㄑ', g: 'ㄕ', h: 'ㄘ', j: 'ㄨ', k: 'ㄜ', l: 'ㄠ', ';': 'ㄤ',
  z: 'ㄈ', x: 'ㄌ', c: 'ㄏ', v: 'ㄒ', b: 'ㄖ', n: 'ㄙ', m: 'ㄩ', ',': 'ㄝ', '.': 'ㄡ', '/': 'ㄥ',
};
for (const [key, symbol] of Object.entries(expected)) {
  assert.equal(KEY_MAP[key], symbol, `鍵 ${key} 應對應 ${symbol}（大千標準排列）`);
}
assert.equal(KEYBOARD_ROWS.length, 4, '四列');
assert.equal(symbolKind('ㄅ'), 'initial');
assert.equal(symbolKind('ㄧ'), 'medial');
assert.equal(symbolKind('ㄤ'), 'final');
assert.equal(symbolKind('ˋ'), 'tone');

// ---- 候選字：必含答案、互異、數量正確、同音字優先 ----
const index = JSON.parse(readFileSync(fileURLToPath(new URL('../public/data/_index/char-index.json', import.meta.url)), 'utf8'));
for (const count of [3, 5, 8]) {
  const candidates = pickCandidates('是', 'ㄕˋ', index, count);
  assert.equal(candidates.length, count, `候選字應有 ${count} 個`);
  assert.ok(candidates.includes('是'), '候選字必須包含正確答案');
  assert.equal(new Set(candidates).size, count, '候選字不可重複');
}
const five = pickCandidates('是', 'ㄕˋ', index, 5).filter((c) => c !== '是');
const homophones = five.filter((c) => (index.chars[c]?.z || []).includes('ㄕˋ'));
assert.ok(homophones.length >= 3, `同音字應優先作為干擾項，實際 ${homophones.length}/4`);

// ---- 出題閘門：沒有注音就不出題（fail-closed）----
const dataRoot = fileURLToPath(new URL('../public/data/', import.meta.url));
const ready = {};
for (const volume of readdirSync(dataRoot, { withFileTypes: true }).filter((e) => e.isDirectory() && /^115AG\d/.test(e.name))) {
  let lessons = 0;
  for (const filename of readdirSync(join(dataRoot, volume.name)).filter((n) => /^lesson\d+\.json$/.test(n))) {
    const lesson = JSON.parse(readFileSync(join(dataRoot, volume.name, filename), 'utf8'));
    for (const w of typableWords(lesson)) {
      assert.ok(w.zhuyin, `${lesson.lesson_id}: 沒有注音的語詞不得出題`);
      assert.ok(syllablesMatchWord(w.word, w.zhuyin), `${lesson.lesson_id} ${w.word}: 音節數必須對得上字數`);
    }
    if (canStartZhuyinTyping(lesson)) lessons += 1;
  }
  ready[volume.name] = lessons;
}
// 語詞注音補齊後五冊皆可出題；仍保留 fail-closed 檢查（上面逐筆驗證過音節對應）。
for (const [volume, lessons] of Object.entries(ready)) {
  assert.ok(lessons > 0, `${volume} 應該要有可出題的課次`);
}
console.log(`PASS: 大千排列正確、候選字同音優先、閘門 fail-closed — 可出題課數 ${JSON.stringify(ready)}`);
