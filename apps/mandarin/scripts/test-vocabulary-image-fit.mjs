import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(resolve(scriptDir, '../src/styles/components.css'), 'utf8');

assert.match(css, /\.vocabulary-card \.image-frame\s*\{[^}]*aspect-ratio:\s*1\s*\/\s*1/s, '語詞卡圖片框應保留方形比例');
assert.match(css, /\.vocabulary-card \.image-frame img\s*\{[^}]*object-fit:\s*contain/s, '語詞卡圖片不可用 cover 裁切');

console.log('PASS: 語詞卡完整顯示方形插圖，不會因 cover 裁掉上下內容。');
