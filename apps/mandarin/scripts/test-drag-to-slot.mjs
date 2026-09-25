// 驗證成語拖拉題已開啟直接拖曳樣式，且點選／鍵盤替代操作仍可用。
// 用法：node scripts/test-drag-to-slot.mjs
import assert from 'node:assert/strict';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();
const { DragToSlot } = await import('../src/components/DragToSlot.js');

const inlineSlot = document.createElement('button');
inlineSlot.className = 'sentence-chip drag-to-slot__slot drag-to-slot__inline-slot';
inlineSlot.textContent = '＿';
const inlineSlotWrap = document.createElement('span');
inlineSlotWrap.className = 'idiom-builder__inline-slot-wrap';
inlineSlotWrap.appendChild(inlineSlot);
const context = document.createElement('div');
context.appendChild(inlineSlotWrap);

const root = DragToSlot({
  dragEnabled: true,
  items: [{
    id: 'idiom-1',
    context,
    inlineSlot,
    inlineSlotWrap,
    options: [
      { id: 'char:冰', label: '冰' },
      { id: 'char:夏', label: '夏' },
    ],
    answerId: 'char:冰',
  }],
});

assert.ok(root.hasClass('drag-to-slot--drag-enabled'), '成語題應開啟拖曳模式');
assert.ok(
  root.find((node) => node.hasClass('drag-to-slot__instruction')),
  '拖曳模式應顯示操作提示',
);
assert.equal(root.find((node) => node.hasClass('drag-to-slot__slot-row')), null, '成語內嵌空格不應再產生下方獨立答案框');
const slot = root.find((node) => node.hasClass('drag-to-slot__slot'));
const chips = root.findAll((node) => node.hasClass('drag-to-slot__option-chip'));
assert.equal(chips.length, 2, '拖曳模式仍應保留所有候選答案');

// 點選 fallback 仍須能完成「選取 → 放入」操作，確保鍵盤與無法拖曳的裝置可用。
chips.find((chip) => chip.textContent === '冰').dispatch('click');
assert.equal(slot.textContent, '冰', '點選候選答案後應放入空格');
assert.equal(chips.find((chip) => chip.textContent === '冰').disabled, true, '已放入答案應暫時鎖定候選卡');
slot.dispatch('click');
assert.equal(slot.textContent, '？', '點擊空格應可取消已放入答案');

console.log('PASS: 成語題已開啟拖曳模式，點選／鍵盤 fallback 仍可操作。');
