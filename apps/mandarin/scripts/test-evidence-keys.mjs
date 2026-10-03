// 第 3 層螢光筆：只畫和答案相同的關鍵詞、題目已有的詞不畫、跨詞雜訊不畫
import assert from 'node:assert/strict';
import { installFakeDom } from './fake-dom.mjs';
installFakeDom();
const { keySpans } = await import('../src/components/EvidencePanel.js');
const pick = (s, sp) => sp.map(([a, b]) => s.slice(a, b));
assert.deepEqual(pick('康康十分慌張，就跑到鍋子旁，把熱水舀起來，', keySpans('康康十分慌張，就跑到鍋子旁，把熱水舀起來，', ['把熱水舀起來再倒回去'])), ['熱水舀起來']);
assert.deepEqual(keySpans('拿出許多南瓜蒂和南瓜。', ['南瓜蒂和南瓜原本相連'], '布大爺拿出的南瓜蒂為什麼能證明南瓜是他的'), [], '題目裡的詞不畫，跨詞的「和南」也不畫');
console.log('✅ 螢光筆只畫關鍵資訊');
