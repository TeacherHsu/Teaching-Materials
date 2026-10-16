/* P0：真實資料固定種子與視圖故障邊界；不代替 GPU／實機驗收。 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
function roomEnv() {
  const listeners = new Map();
  const media = { matches: false, addEventListener(k, f) { listeners.set('reduce', f); }, removeEventListener() {} };
  const classes = new Set();
  const document = { hidden: false, body: { className: '', classList: { contains: c => classes.has(c) } }, addEventListener(k, f) { listeners.set(k, f); }, removeEventListener() {} };
  class Vector { constructor(x, y, z) { this.x = x; this.y = y; this.z = z; } applyMatrix4() { return this; } project() { this.x /= 8; this.y /= 5; return this; } }
  const context = { window: { THREE: { Vector3: Vector } }, document, matchMedia: () => media, cancelAnimationFrame() {}, requestAnimationFrame: () => 1, setTimeout, clearTimeout };
  let source = fs.readFileSync(path.join(root, 'detective3d.js'), 'utf8');
  source = source.replace('window.Detective3D = { mount:', 'window.Detective3D = { Room, mount:');
  vm.runInNewContext(source, context);
  const room = Object.create(context.window.Detective3D.Room.prototype);
  Object.assign(room, { opts: {}, items: [], meshes: new Map(), tweens: [], host: { clientWidth: 390, clientHeight: 472, classList: { add() {}, remove() {} } } });
  return { room, media, classes, document, context };
}
test('密室中途 calm／系統 reduce 保留同一份狀態並完成待等動畫', () => {
  for (const mode of ['calm', 'reduce', 'force2d']) {
    const e = roomEnv(); const r = e.room; let end = 0;
    r.items = [{ id: 'clue', state: 'found', btn: {} }];
    r.tweens.push({ fn: k => { end = k; } });
    r.layoutMarkers = () => {};
    if (mode === 'calm') e.classes.add('calm');
    if (mode === 'reduce') e.media.matches = true;
    if (mode === 'force2d') r.opts.force2d = true;
    const before = r.items;
    r.refreshMode();
    assert.equal(r.is3d, false); assert.equal(end, 1); assert.equal(r.items, before); assert.equal(r.items[0].state, 'found');
  }
});
test('密室 render throw 收斂 2D，保留 found 且清除待機動畫', () => {
  const { room: r } = roomEnv(); let disposed = 0;
  r.renderer = { render() { throw Error('GPU'); }, dispose() { disposed++; }, domElement: { remove() {} } };
  r.items = [{ state: 'found' }]; r.layoutMarkers = () => {};
  r.frame(100);
  assert.equal(disposed, 1); assert.equal(r.is3d, false); assert.equal(r.failed, true); assert.equal(r.items[0].state, 'found'); assert.equal(r.raf, 0);
});
test('慢 CDN 返回時重新檢查 calm／force2d／disposed，不初始化 GPU', () => {
  for (const setting of ['reduce', 'force2d', 'disposed']) {
    const e = roomEnv(); const r = e.room;
    if (setting === 'reduce') e.media.matches = true; else if (setting === 'force2d') r.opts.force2d = true; else r.disposed = true;
    r.init3d(); assert.equal(r.renderer, undefined);
  }
});
test('背景頁完成補間，返回只要求目前狀態的一幀', () => {
  const { room: r, document } = roomEnv(); let end = 0, kicks = 0;
  r.tweens.push({ fn: k => { end = k; } }); r.layoutMarkers = () => {}; r.kick = () => { kicks++; };
  document.hidden = true; r.visibility(); assert.equal(end, 1); assert.equal(r.tweens.length, 0); assert.equal(kicks, 0);
  document.hidden = false; r.visibility(); assert.equal(kicks, 1);
});
test('密室 15 個標記：390／768／1024／1366、左右 yaw，矩形間隔至少 8px 且不越界', () => {
  for (const width of [390, 768, 1024, 1366]) for (const yaw of [-.45, 0, .45]) {
    const { room: r } = roomEnv();
    r.host.clientWidth = width; r.yaw = yaw; r.is3d = true; r.camera = { updateMatrixWorld() {}, position: { toArray: () => [] } }; r.group = { matrixWorld: {}, updateMatrixWorld() {} };
    r.items = Array.from({ length: 15 }, (_, i) => ({ kind: i < 8 ? 'holder' : 'dial', state: i === 8 ? 'next' : 'open', pos: [(i % 5 - 2) * 2 + yaw, Math.floor(i / 5), 1], g: [50, 50], btn: { dot: false, classList: { toggle() {}, remove() { this.owner.dot=false; }, add() { this.owner.dot=true; } }, offsetWidth: i === 8 ? 200 : 64, offsetHeight: 48, style: {} } }));
    r.items.forEach(it => { it.btn.classList.owner=it.btn; });
    r.layoutMarkers();
    for (const it of r.items.filter(it => it.btn.dot)) {
      const x=(it.pos[0]/8+1)*width/2, y=(1-it.pos[1]/5)*472/2;
      assert.ok(Math.abs(parseFloat(it.btn.style.left)+10-x)<=14);
      assert.ok(Math.abs(parseFloat(it.btn.style.top)+10-y)<=14);
    }
    const rects = r.items.filter(it => !it.btn.dot).map(it => ({ x: parseFloat(it.btn.style.left), y: parseFloat(it.btn.style.top), w: it.btn.offsetWidth, h: it.btn.offsetHeight }));
    for (const a of rects) { assert.ok(a.x >= 8 && a.y >= 8 && a.x + a.w <= width - 8 && a.y + a.h <= 460); }
    rects.forEach((a, i) => rects.slice(i + 1).forEach(b => assert.ok(a.x + a.w + 8 <= b.x || b.x + b.w + 8 <= a.x || a.y + a.h + 8 <= b.y || b.y + b.h + 8 <= a.y)));
  }
});
test('蛇兩種規則的視圖映射與實際落點公式相同，保留原始常數', () => {
  const source = fs.readFileSync(path.join(root, 'snakes.html'), 'utf8');
  const raw = source.match(/const SNAKES = (\{[^;]+\});/)[1];
  const snakes = vm.runInNewContext('(' + raw + ')');
  assert.deepEqual(Object.keys(snakes).map(Number), [13, 21, 25, 29]);
  for (const maxSlide of [3, 99]) {
    const visual = Object.fromEntries(Object.entries(snakes).map(([a, b]) => [a, Math.max(b, Number(a) - maxSlide)]));
    for (const a of Object.keys(snakes)) assert.equal(visual[a], Math.max(snakes[a], a - maxSlide));
  }
  assert.match(source, /snakes: visualSnakes/); assert.match(source, /Object.entries\(visualSnakes\)\.forEach/);
  assert.match(source, /Math.max\(SNAKES\[/);
});
test('密室核心與教學資料基線未改動', () => {
  const crypto = require('node:crypto');
  const baseline = JSON.parse(fs.readFileSync(path.join(root, 'tools/qa/p0-baseline.json')));
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'detective-core.js'))).digest('hex'), baseline.beforeSHA256['detective-core.js']);
});
test('全部題庫產物與基線 SHA256 相同', () => {
  const crypto = require('node:crypto');
  const b = JSON.parse(fs.readFileSync(path.join(root, 'tools/qa/p0-baseline.json')));
  for (const [file, hash] of Object.entries(b.dataSHA256)) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex'), hash, file);
});
test('密室 snapshot 在重建模型後還原箱門、抽屜、布告欄、齒輪與出口', () => {
  const { room: r } = roomEnv(); r.kick=()=>{};
  r.items=[{kind:'holder',idx:1,id:'drawer'}];
  const models=()=>{ r.group={}; r.safeDoor={rotation:{}}; r.drawer={position:{}}; r.boardCards=[{rotation:{},position:{}}]; r.gears=[{rotation:{}}]; r.door={rotation:{}}; r.exitLight={material:{}}; };
  const snapshot={done:['dial','sort','cause'],found:['drawer'],escaped:true};
  r.applyVisualState(snapshot); // WebGL 還沒回來時先保存
  for(let i=0;i<2;i++) {
    models(); r.applyVisualState();
    assert.equal(r.safeDoor.rotation.y,-1.3); assert.equal(r.drawer.position.z,.5);
    assert.equal(r.boardCards[0].rotation.z,0); assert.equal(r.gears[0].rotation.x,8);
    assert.equal(r.door.rotation.y,-1.5); assert.equal(r.exitLight.material.opacity,.35);
  }
  assert.deepEqual(snapshot,{done:['dial','sort','cause'],found:['drawer'],escaped:true});
});
