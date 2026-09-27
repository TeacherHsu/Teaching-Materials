// 驗證每個公開成語都有明確圖片，且圖片符合成語縮圖契約。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = path.join(appRoot, 'public', 'data');
const assetsRoot = path.join(appRoot, 'public', 'assets');
const MAX_BYTES = 300 * 1024;
const EXPECTED_SIZE = 960;

function webpSize(file) {
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', `${file}: 不是 RIFF WebP`);
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', `${file}: 不是 WebP`);
  const chunk = bytes.toString('ascii', 12, 16);
  if (chunk === 'VP8 ') {
    const payload = 20;
    return {
      width: bytes.readUInt16LE(payload + 6) & 0x3fff,
      height: bytes.readUInt16LE(payload + 8) & 0x3fff,
    };
  }
  if (chunk === 'VP8X') {
    const payload = 20;
    return {
      width: 1 + bytes.readUIntLE(payload + 4, 3),
      height: 1 + bytes.readUIntLE(payload + 7, 3),
    };
  }
  throw new Error(`${file}: 不支援的 WebP chunk ${chunk}`);
}

let lessons = 0;
let checked = 0;
let missing = 0;
for (const volume of fs.readdirSync(dataRoot, { withFileTypes: true })) {
  if (!volume.isDirectory()) continue;
  for (const fileName of fs.readdirSync(path.join(dataRoot, volume.name))) {
    if (!/^lesson\d+\.json$/u.test(fileName)) continue;
    const dataFile = path.join(dataRoot, volume.name, fileName);
    const lesson = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const idioms = lesson.idioms || [];
    if (!idioms.length) continue;
    lessons += 1;
    for (const idiom of idioms) {
      if (!idiom.image) {
        missing += 1;
        continue;
      }
      assert.match(idiom.image, /^idioms\/[^/]+\.webp$/u, `${dataFile}: ${idiom.idiom} 圖片路徑不符合 WebP 契約`);
      const asset = path.join(assetsRoot, volume.name, `lesson${String(lesson.lesson_no).padStart(2, '0')}`, idiom.image);
      assert.ok(fs.existsSync(asset), `${dataFile}: 找不到成語「${idiom.idiom}」圖片 ${idiom.image}`);
      const bytes = fs.statSync(asset).size;
      assert.ok(bytes <= MAX_BYTES, `${asset}: 超過 300 KiB（${bytes} bytes）`);
      const size = webpSize(asset);
      assert.equal(size.width, EXPECTED_SIZE, `${asset}: 寬度應為 ${EXPECTED_SIZE}px，實際 ${size.width}px`);
      assert.equal(size.height, EXPECTED_SIZE, `${asset}: 高度應為 ${EXPECTED_SIZE}px，實際 ${size.height}px`);
      assert.ok(
        ['square-native', 'square-contain'].includes(idiom.image_layout),
        `${dataFile}: ${idiom.idiom} 缺少 960x960 圖片版面標記`,
      );
      checked += 1;
    }
  }
}

assert.ok(checked > 0, '沒有找到可檢查的成語圖片');
console.log(`PASS: ${lessons} 課、${checked} 個已有圖片的成語均為 960x960 WebP，單張不超過 300 KiB，且使用完整容納版面；另有 ${missing} 個成語仍無圖片，維持原本未補圖狀態。`);
