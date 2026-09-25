// 驗證「全部唸給我聽」組出的朗讀序列：標題→任務說明→題幹→選項（選項前加「選項一、選項二…」）。
// 無新依賴，純 Node。
// 用法：node scripts/test-read-all-sequence.mjs
import assert from 'node:assert/strict';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();
const { buildReadAllSequence } = await import('../src/components/ReadAllButton.js');

const seq = buildReadAllSequence({
  title: '第 1 課：小狗回家了',
  task: '看字選出正確的注音',
  stem: '「回」的注音是？',
  options: ['ㄏㄨㄟˊ', 'ㄏㄨㄟˇ', 'ㄏㄨㄟˋ'],
});

assert.deepEqual(
  seq.map((s) => s.text),
  [
    '第 1 課：小狗回家了',
    '看字選出正確的注音',
    '「回」的注音是？',
    '選項一、ㄏㄨㄟˊ',
    '選項二、ㄏㄨㄟˇ',
    '選項三、ㄏㄨㄟˋ',
  ],
  '序列應依序為 標題→任務說明→題幹→選項（選項前加中文數字）',
);

// 缺欄位時應略過，不留空字串／undefined
const partial = buildReadAllSequence({ stem: '只有題幹', options: ['甲', '乙'] });
assert.deepEqual(partial.map((s) => s.text), ['只有題幹', '選項一、甲', '選項二、乙']);

const empty = buildReadAllSequence({});
assert.deepEqual(empty, [], '完全沒有內容時應回傳空陣列');

console.log('PASS: buildReadAllSequence 依序組出 標題→任務說明→題幹→選項，缺欄位時正確略過。');
