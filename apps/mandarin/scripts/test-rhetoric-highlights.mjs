// 驗證修辭題幹會把官方資料中的關鍵字標記轉成有色文字，且朗讀文字不含資料標記。
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installFakeDom } from './fake-dom.mjs';
import { splitRhetoricExample, stripRhetoricMarkup, buildRhetoricActivity } from '../src/activities/rhetoric.js';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const dataRoot = resolve(scriptDir, '../public/data');
const supportedMarkup = /﹁([^﹂]+)﹂|「([^」]+)」|『([^』]+)』/g;
const activeStatuses = new Set(['ready', 'approved']);
let scannedEntries = 0;

for (const grade of ['115AG1H', '115AG3H', '115AG4K', '115AG6H']) {
  const gradeDir = join(dataRoot, grade);
  for (const file of readdirSync(gradeDir).filter((name) => /^lesson\d+\.json$/.test(name))) {
    const data = JSON.parse(readFileSync(join(gradeDir, file), 'utf8'));
    for (const entry of data.rhetoric || []) {
      if (!activeStatuses.has(entry.status)) continue;
      scannedEntries += 1;
      if (grade === '115AG4K') {
        assert.ok(Array.isArray(entry.highlight_terms), `${grade}/${file} ${entry.id} 缺少保守關鍵詞欄位`);
        for (const term of entry.highlight_terms) {
          assert.ok(String(entry.example).includes(term), `${grade}/${file} ${entry.id} 關鍵詞不在官方例句中`);
        }
        const inferredSegments = splitRhetoricExample(entry.example, entry.highlight_terms);
        const highlightedTexts = inferredSegments.filter(({ highlighted }) => highlighted).map(({ text }) => text);
        for (const term of entry.highlight_terms) {
          assert.ok(highlightedTexts.includes(term), `${grade}/${file} ${entry.id} 保守關鍵詞未形成變色片段`);
        }
        continue;
      }
      const matches = [...String(entry.example || '').matchAll(supportedMarkup)];
      assert.ok(matches.length > 0, `${grade}/${file} ${entry.id} 缺少修辭關鍵字標記`);
      const segments = splitRhetoricExample(entry.example);
      assert.equal(
        segments.filter(({ highlighted }) => highlighted).length,
        matches.length,
        `${grade}/${file} ${entry.id} 關鍵字標記數與變色片段數不一致`,
      );
      assert.equal(stripRhetoricMarkup(entry.example).includes('﹁'), false, `${entry.id} 朗讀文字仍含標記`);
      assert.equal(stripRhetoricMarkup(entry.example).includes('﹂'), false, `${entry.id} 朗讀文字仍含標記`);
    }
  }
}

const css = readFileSync(resolve(scriptDir, '../src/styles/components.css'), 'utf8');
assert.match(css, /\.rhetoric-highlight\s*\{/, '找不到修辭關鍵字變色樣式');

const segments = splitRhetoricExample('甲﹁乙﹂丙「丁」戊『己』');
assert.deepEqual(segments, [
  { text: '甲', highlighted: false },
  { text: '乙', highlighted: true },
  { text: '丙', highlighted: false },
  { text: '丁', highlighted: true },
  { text: '戊', highlighted: false },
  { text: '己', highlighted: true },
]);
assert.equal(stripRhetoricMarkup('甲﹁乙﹂丙「丁」戊『己』'), '甲乙丙丁戊己');
assert.deepEqual(splitRhetoricExample('甲乙丙乙', ['乙']), [
  { text: '甲', highlighted: false },
  { text: '乙', highlighted: true },
  { text: '丙', highlighted: false },
  { text: '乙', highlighted: true },
]);

installFakeDom();
const root = buildRhetoricActivity(
  {
    rhetoric: [
      { id: 'r1', figure: '轉化', example: '甲﹁關鍵﹂乙', child_note: '說明一', status: 'ready' },
      { id: 'r2', figure: '譬喻', example: '普通句二', child_note: '說明二', status: 'ready' },
      { id: 'r3', figure: '映襯', example: '普通句三', child_note: '說明三', status: 'ready' },
    ],
  },
  () => {},
);
const stem = root.find((node) => node.hasClass('quiz-stem'));
assert.equal(stem.textContent, '這句話用了什麼修辭？「甲關鍵乙」');
assert.equal(stem.find((node) => node.hasClass('rhetoric-highlight')).textContent, '關鍵');

console.log('PASS: 修辭題幹會隱藏官方標記、保留朗讀純文字，並將關鍵字套用變色元素。');
console.log(`PASS: 已掃描 G1A／G3A／G4A／G6A 共 ${scannedEntries} 筆可用修辭題，官方標記或保守推導關鍵詞均通過。`);
