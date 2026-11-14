// 無套件：直接解析 RIFF/WebP chunk 與 VP8X、VP8、VP8L 檔頭。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const directory = path.join(__dirname, '../img');
const transparent = [
  'egg-0', 'egg-1', 'egg-2', 'shell-top', 'shell-bottom', 'meat',
  ...['dog', 'cat', 'rabbit', 'hamster', 'chick', 'penguin', 'fox', 'panda', 'koala', 'turtle', 'hedgehog', 'frog'].map(n => `pet-${n}`),
  'hero-idle', 'hero-shout', 'hero-cheer',
  ...Array.from({ length: 6 }, (_, i) => `mon-${i + 1}`),
  'boss', 'boss-dizzy', 'wave', 'star',
];
const backgrounds = ['bg-hatchery', 'bg-forest'];
function header(bytes) {
  assert.ok(bytes.length >= 20, '檔頭完整');
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  assert.equal(bytes.readUInt32LE(4) + 8, bytes.length, 'RIFF 長度');
  let width, height, alpha = false, image = false;
  for (let pos = 12; pos < bytes.length;) {
    assert.ok(pos + 8 <= bytes.length, 'chunk 檔頭完整');
    const type = bytes.toString('ascii', pos, pos + 4);
    const size = bytes.readUInt32LE(pos + 4); const start = pos + 8;
    assert.ok(start + size <= bytes.length, 'chunk 長度合法');
    if (type === 'VP8X') {
      assert.ok(size >= 10);
      width = bytes.readUIntLE(start + 4, 3) + 1;
      height = bytes.readUIntLE(start + 7, 3) + 1;
      alpha = Boolean(bytes[start] & 0x10);
      assert.equal(bytes[start] & 0x02, 0, '素材是單張靜態 WebP');
    } else if (type === 'VP8 ') {
      assert.ok(size >= 10); image = true;
      assert.equal(bytes.toString('hex', start + 3, start + 6), '9d012a');
      width ??= bytes.readUInt16LE(start + 6) & 0x3fff;
      height ??= bytes.readUInt16LE(start + 8) & 0x3fff;
    } else if (type === 'VP8L') {
      assert.ok(size >= 5); image = true;
      assert.equal(bytes[start], 0x2f);
      const bits = bytes.readUInt32LE(start + 1);
      width ??= (bits & 0x3fff) + 1;
      height ??= ((bits >>> 14) & 0x3fff) + 1;
      alpha ||= Boolean(bits & 0x10000000);
    } else if (type === 'ALPH') {
      assert.ok(size > 1); alpha = true;
    }
    pos = start + size + (size & 1);
    assert.ok(pos <= bytes.length, 'chunk padding 完整');
  }
  assert.ok(image, '有影像資料');
  return { width, height, alpha };
}
for (const name of [...transparent, ...backgrounds]) {
  test(`素材 ${name}.webp：格式、尺寸、alpha 與容量`, () => {
    const bytes = fs.readFileSync(path.join(directory, `${name}.webp`));
    const h = header(bytes); const bg = backgrounds.includes(name);
    assert.equal(h.width, bg ? 1600 : 512);
    assert.equal(h.height, bg ? 640 : 512);
    assert.equal(h.alpha, !bg, bg ? '背景不透明' : '角色／物件須有 alpha 通道');
    assert.ok(bytes.length <= (bg ? 220 : 120) * 1024, `${bytes.length} bytes 超過單張上限`);
  });
}
test('img 整個資料夾合計不超過 3.5 MiB，只有指定的成品 WebP', () => {
  const expected = [...transparent, ...backgrounds].map(n => n + '.webp').sort();
  assert.deepEqual(fs.readdirSync(directory).sort(), expected);
  const total = expected.reduce((sum, name) => sum + fs.statSync(path.join(directory, name)).size, 0);
  assert.ok(total <= 3.5 * 1024 * 1024, `總量 ${total} bytes`);
});
