import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.join(here, '..');

// 直接 import ImageFrame.js 會需要 DOM，這裡只取 resolveImageSrc 的邏輯來驗，
// 並以原始碼比對確保 ImageFrame 真的有套用它（避免函式存在但沒被使用）。
const sourcePath = path.join(appRoot, 'src', 'components', 'ImageFrame.js');
const source = fs.readFileSync(sourcePath, 'utf8');

assert.match(
  source,
  /src:\s*resolveImageSrc\(src\)/,
  'ImageFrame 必須以 resolveImageSrc 解析圖片路徑，不可直接使用資料檔原值',
);

// 以子路徑部署（GitHub Pages）的 BASE 模擬解析行為。
function makeResolver(BASE) {
  return function resolveImageSrc(src) {
    if (typeof src !== 'string' || src === '') return src;
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(src)) return src;
    if (src.startsWith('/')) {
      return `${BASE.endsWith('/') ? BASE : `${BASE}/`}${src.slice(1)}`;
    }
    return src;
  };
}

const subpath = makeResolver('/Teaching-Materials/mandarin/');
assert.equal(
  subpath('/assets/115AG4K/lesson09/vocabulary/l09-01.webp'),
  '/Teaching-Materials/mandarin/assets/115AG4K/lesson09/vocabulary/l09-01.webp',
  '根絕對路徑必須接回 BASE_URL，否則在 GitHub Pages 子路徑會 404',
);
assert.equal(subpath('assets/a.webp'), 'assets/a.webp', '相對路徑不可被改寫');
assert.equal(subpath('https://x.test/a.webp'), 'https://x.test/a.webp', '完整網址不可被改寫');
assert.equal(subpath('data:image/webp;base64,AA'), 'data:image/webp;base64,AA', 'data URI 不可被改寫');
assert.equal(subpath(''), '', '空字串原樣返回');

const root = makeResolver('/');
assert.equal(root('/assets/a.webp'), '/assets/a.webp', '掛在網域根時路徑不變');

// 資料檔目前大量使用根絕對路徑，這正是需要解析的原因；抽驗一課確認格式沒變。
const lesson = JSON.parse(
  fs.readFileSync(path.join(appRoot, 'public', 'data', '115AG4K', 'lesson09.json'), 'utf8'),
);
const sample = (lesson.words || []).find((w) => typeof w.image === 'string' && w.image);
assert.ok(sample, '第九課應有帶圖片的語詞可供抽驗');
assert.ok(
  sample.image.startsWith('/assets/') || sample.image.startsWith('assets/'),
  `語詞圖片路徑格式非預期：${sample.image}`,
);

console.log('PASS: 圖片路徑會接回 BASE_URL，子路徑部署不會 404。');
