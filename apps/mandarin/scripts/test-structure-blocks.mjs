// 驗證「例句拆積木」：結構對位（切對、切不準就不出）與元件操作（一次一格、答錯提示、再錯揭曉）。
// 用法：node scripts/test-structure-blocks.mjs
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { installFakeDom } from './fake-dom.mjs';
import { alignExample, frameText, parseStructure } from '../src/utils/structureBlocks.js';

const slotsOf = (r) => r.slots.map((s) => `${s.label}=${s.text}`).join('｜');

// 括號是格子、其餘是固定字
let r = alignExample('（主詞）是（情況一），也是（情況二）。', '妹妹是班上的開心果，也是全家的寶貝。');
assert.equal(frameText(r.frame), '＿＿是＿＿也是＿＿');
assert.equal(slotsOf(r), '誰=妹妹｜情況一=班上的開心果｜情況二=全家的寶貝');

// ＋號寫法：沒括號的一段出現在例句裡＝固定字，否則＝格子
r = alignExample('只要＋條件，就＋結果', '只要認真練習就會有進步');
assert.equal(slotsOf(r), '條件=認真練習｜結果=會有進步');
r = alignExample('動詞（動作）＋著＋動詞（做什麼事）', '坐著看書');
assert.equal(slotsOf(r), '動作=坐｜做什麼事=看書');

// 兩格之間只有標點也能切
r = alignExample('假如（假設情況），（可能的結果）。', '假如垃圾山變成公園，也許能一舉多得。');
assert.equal(slotsOf(r), '假設情況=垃圾山變成公園｜可能的結果=也許能一舉多得');

// 同名的格子加上順序
r = alignExample('（名詞）又（形容詞）又（形容詞）', '球員又高又壯');
assert.equal(slotsOf(r), '人或東西=球員｜第 1 個怎麼樣=高｜第 2 個怎麼樣=壯');

// 人工拆好的語塊和結構一一對應時直接用（兩格相鄰也行）
r = alignExample('疊字形容詞（怎麼樣）＋的＋名詞（東西）。', '閃亮亮的鉛筆', ['閃亮亮', '的', '鉛筆']);
assert.equal(slotsOf(r), '怎麼樣=閃亮亮｜東西=鉛筆');

// 不出題的情況：兩格相鄰切不出界線、兩格的字一樣、只有一格、語塊夾標點、沒有固定字
assert.equal(alignExample('將（名詞）（動詞）給（名詞）', '將感恩回饋給社會'), null);
assert.equal(alignExample('動詞（什麼動作）＋一＋動詞（什麼動作）', '走一走'), null);
assert.equal(alignExample('一起＋動詞（做什麼事）', '一起吃飯'), null);
assert.equal(alignExample('當（先發生的情境），就（接著產生的結果）', '當爸爸一打開大門，小狗就跑了出去'), null);
assert.equal(alignExample('生活情境句', '演講結束後，聽眾都起立鼓掌。'), null);
assert.equal(parseStructure('').length, 0);

// 資料：寫進課次的 structure_blocks 每一題都要能還原成原例句（去標點後相同），且 2～3 格
const dataRoot = fileURLToPath(new URL('../public/data/', import.meta.url));
const bare = (t) => t.replace(/[，。！？、；：\s]/gu, '');
let total = 0;
for (const volume of readdirSync(dataRoot).filter((v) => /^115A/.test(v))) {
  for (const name of readdirSync(`${dataRoot}${volume}`).filter((f) => /^lesson\d+\.json$/.test(f))) {
    const lesson = JSON.parse(readFileSync(`${dataRoot}${volume}/${name}`, 'utf8'));
    for (const pattern of lesson.sentence_patterns || []) {
      for (const block of pattern.structure_blocks || []) {
        const sentence = pattern.examples[block.example_index];
        assert.ok(sentence, `${pattern.id} 的 example_index 指不到例句`);
        assert.equal(bare(block.frame.map((t) => t.text).join('')), bare(sentence), `${pattern.id} 的語塊拼不回原句`);
        const n = block.frame.filter((t) => t.type === 'slot').length;
        assert.ok(n >= 2 && n <= 3, `${pattern.id} 應為 2～3 格`);
        total += 1;
      }
    }
  }
}
assert.ok(total >= 100, `拆積木題目應有一定數量，現在只有 ${total} 題`);

// 元件：一次問一格；答錯先提示、不前進；再錯才幫忙放；放完出現整句與句型框架
installFakeDom();
const { StructureBlocks } = await import('../src/components/StructureBlocks.js');
const { setScaffoldLevel } = await import('../src/utils/deviceSettings.js');
setScaffoldLevel('standard');
const item = { id: 't', sentence: '因為下雨，所以比賽延期。', frame: alignExample('因為（原因），所以（結果）。', '因為下雨，所以比賽延期。').frame };
let continued = false;
const root = StructureBlocks({ items: [item], onContinue: () => { continued = true; } });
const text = (cls) => root.find((n) => n.hasClass(cls))?.textContent;
const chip = (label) => root.findAll((n) => n.hasClass('sentence-chip')).find((c) => c.textContent === label);
assert.equal(text('structure-blocks__question'), '哪一塊是「原因」？');
chip('比賽延期').dispatch('click');
assert.equal(text('structure-blocks__question'), '哪一塊是「原因」？', '答錯不應前進');
assert.ok(root.find((n) => n.hasClass('hint-panel')), '答錯要給提示');
chip('下雨').dispatch('click');
assert.equal(text('structure-blocks__question'), '哪一塊是「結果」？');
chip('比賽延期').dispatch('click');
assert.equal(text('structure-blocks__pattern'), '句型：因為＿＿所以＿＿');
root.findAll((n) => n.tagName === 'button').find((b) => b.textContent === '完成').dispatch('click');
assert.ok(root.find((n) => n.hasClass('completion-feedback')), '做完要出現完成卡');
assert.ok(root.find((n) => n.hasClass('completion-feedback')).textContent.includes('答對 0 / 1'), '答錯過一次不算一次答對');
root.findAll((n) => n.tagName === 'button').find((b) => b.textContent === '繼續').dispatch('click');
assert.ok(continued);

// 支持層：先放好第一格當示範，直接問第二格
setScaffoldLevel('support');
const supported = StructureBlocks({ items: [item] });
assert.equal(supported.find((n) => n.hasClass('structure-blocks__question')).textContent, '哪一塊是「結果」？');

console.log(`PASS: 例句拆積木對位、資料（${total} 題）與元件操作。`);
