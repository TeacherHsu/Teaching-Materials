// 選關聯詞：認得真的關聯詞、挖空位置對、誘答不會也是正解。
import assert from 'node:assert/strict';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();
const C = await import('../src/utils/connectives.js');
const { buildConnectiveItems } = await import('../src/activities/sentencePractice.js');

assert.deepEqual(C.connectivesInStructure('名詞（人或物）＋動詞（做什麼動作）'), [], '結構字串裡的「名詞」不是關聯詞');
assert.deepEqual(C.connectivesInStructure('雖然＋情況，卻＋結果'), ['雖然', '卻']);
assert.deepEqual(C.matchPair(['先', '再', '最後']).words, ['先', '再', '最後'], '取最長的那一組');
assert.equal(C.matchPair(['一', '一']), null, '「一個又一個」不是關聯詞句型');
assert.deepEqual(C.blankConnectives('雖然下雨我們卻照常上課', ['雖然', '卻']), ['', '下雨我們', '照常上課']);
assert.equal(C.blankConnectives('我們照常上課', ['雖然', '卻']), null, '例句沒照句型寫就不出題');

// 誘答：不共用詞、不同類型、每類最多一組
for (const pair of C.CONNECTIVE_PAIRS) {
  for (let i = 0; i < 20; i += 1) {
    const ds = C.connectiveDistractors(pair, 3, (a) => [...a].sort(() => Math.random() - 0.5));
    for (const d of ds) {
      assert.ok(!d.words.some((w) => pair.words.includes(w)), `${pair.words} 的誘答 ${d.words} 共用了關聯詞`);
      assert.notEqual(d.type, pair.type, '誘答不能和正解同類');
      assert.equal(d.words.length, pair.words.length);
    }
    assert.equal(new Set(ds.map((d) => d.type)).size, ds.length, '每類最多一組');
  }
}
const fakeTypes = (words) => C.connectiveDistractors({ type: '遞進', words }, 3).map((d) => d.type);
assert.ok(!fakeTypes(['不只', '還']).includes('並列'), '遞進不拿並列當誘答（「一邊要掃地，一邊要排椅子」也通）');

const lesson = {
  lesson_id: '115AG9X01',
  sentence_patterns: [{ id: 'p1', head: '轉折複句', structure: '雖然……可是……', examples_status: 'approved',
    examples: ['雖然題目很難可是我會一步一步練習'] }],
};
const [item] = buildConnectiveItems(lesson, 3, (a) => a);
assert.equal(item.answer, '雖然……可是');
assert.ok(item.options.includes(item.answer));
assert.equal(item.options.length, 3, '選項數跟著等級');
assert.equal(buildConnectiveItems(lesson, 2, (a) => a)[0].options.length, 2, '支持層兩個選項');
assert.ok(!/。。/.test(item.readAllStem), '朗讀題目不要多一個句號');
console.log('✅ 選關聯詞：只認真的關聯詞、挖空正確、誘答不共用詞也不同類、選項數跟著等級');
