// 字感訓練：遮蔽字、閃示字的選項一定要含正解。
// 原本先把整組形近字洗牌再取前四個，一組五個字時正解有 1/5 機會被切掉
// （CF 2026-10-03 回報：六上 L05「載」那題沒有正確答案）。
import assert from 'node:assert/strict';

const { buildMaskItems, buildFlashItems } = await import('../src/activities/visualSearch.js');

const groups = [
  { chars: ['戴', '載', '截', '裁', '栽'] }, // 五個字：舊寫法會出錯的情況
  { chars: ['清', '晴'] },                   // 兩個字：選項不能硬湊到四個
];
for (let round = 0; round < 2000; round += 1) {
  for (const item of [...buildMaskItems(groups), ...buildFlashItems(groups)]) {
    assert.ok(item.options.includes(item.answer), `「${item.answer}」那題沒有正確答案：${item.options.join('')}`);
    assert.equal(new Set(item.options).size, item.options.length, '選項不能重複');
    assert.ok(item.options.length <= 4);
  }
}
console.log('✅ 字感訓練選項：2000 輪都含正解、不重複、最多四個');

// 2026-10-04：遮蔽方向用部件資料（遮共同的那半）、兩字組也補足形似字選項
{
  const parts = {
    mask_side: { g1: { 墨: 'top' } },
    similar: { 墨: ['默', '點'], 黑: ['默'] },
  };
  const items = buildMaskItems([{ id: 'g1', chars: ['墨', '黑'] }], (a) => [...a], parts);
  const mo = items.find((i) => i.char === '墨');
  assert.equal(mo.side.key, 'top', '依部件資料遮上半部，露出「土」');
  assert.ok(mo.options.includes('墨') && mo.options.includes('黑'), '同組形似字一定在選項裡');
  assert.equal(mo.options.length, 4, '兩字組補足到四個形似字選項');
  console.log('✅ 遮蔽方向依部件、選項補足形似字');
}
