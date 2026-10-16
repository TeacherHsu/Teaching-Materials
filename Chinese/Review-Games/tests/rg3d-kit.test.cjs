/* 使用 vendor 的真實幾何、矩陣；僅 DOM、WebGL renderer、排程採替身，不代表視覺驗收。 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
function environment({ calm = false, narrow = false, reduced = false, three = true, rendererFails = false } = {}) {
  const media = new Map(), observers = [], frames = new Map(), timers = new Map(), scripts = [], texts = [];
  let now = 0, id = 0, renderCount = 0;
  function node(tag) {
    const events = new Map();
    return { tag, children: [], isConnected: true, style: {}, hidden: false, attributes: {}, events,
      classList: { values: new Set(), contains(c) { return this.values.has(c); }, add(c) { this.values.add(c); }, remove(c) { this.values.delete(c); } },
      setAttribute(k, v) { this.attributes[k] = v; },
      addEventListener(k, fn) { events.set(k, fn); }, removeEventListener(k) { events.delete(k); },
      append(...children) { this.children.push(...children); if (tag === 'head') scripts.push(...children); },
      remove() { this.isConnected = false; }, getBoundingClientRect() { return { width: 1200, height: 580 }; },
      getContext() { return new Proxy({ fillText(t) { texts.push(t); }, createRadialGradient() { return { addColorStop() {} }; } },
        { get(o, k) { return k in o ? o[k] : () => {}; }, set(o, k, v) { o[k] = v; return true; } }); }
    };
  }
  const body = node('body'); if (calm) body.classList.add('calm');
  const documentEvents = new Map(), windowEvents = new Map();
  const document = { body, head: node('head'), currentScript: { src: 'http://local/Chinese/Review-Games/rg3d-kit.js' }, hidden: false,
    createElement: node, addEventListener(k, f) { documentEvents.set(k, f); }, removeEventListener(k) { documentEvents.delete(k); } };
  const c = { document, console, performance: { now: () => now }, RG: { systemReduced: () => media.get('(prefers-reduced-motion: reduce)')?.matches || false },
    devicePixelRatio: 3, addEventListener(k, f) { windowEvents.set(k, f); }, removeEventListener(k) { windowEvents.delete(k); },
    matchMedia(q) { if (!media.has(q)) media.set(q, { matches: q.includes('760') ? narrow : reduced,
      addEventListener(k, f) { this.listener = f; }, removeEventListener() { this.listener = null; } }); return media.get(q); },
    MutationObserver: class { constructor(cb) { this.cb = cb; observers.push(this); } observe() {} disconnect() { this.disconnected = true; } },
    ResizeObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame(fn) { const key = ++id; frames.set(key, fn); return key; }, cancelAnimationFrame(key) { frames.delete(key); },
    setTimeout(fn) { const key = ++id; timers.set(key, fn); return key; }, clearTimeout(key) { timers.delete(key); }
  };
  c.window = c; vm.createContext(c);
  if (three) {
    for (const file of ['three.min.js', 'examples/js/geometries/RoundedBoxGeometry.js', 'examples/js/environments/RoomEnvironment.js']) vm.runInContext(read('vendor/three-r128/' + file), c);
    c.THREE.WebGLRenderer = class {
      constructor(options) { if (rendererFails) throw new Error('無 WebGL'); this.options = options; this.domElement = node('canvas'); this.shadowMap = {}; }
      setPixelRatio(r) { this.pixelRatio = r; } setClearColor() {} setSize() {} render() { renderCount++; }
      dispose() { this.disposed = true; } forceContextLoss() { this.lost = true; }
    };
    c.THREE.PMREMGenerator = class { fromScene() { return { texture: {}, dispose() {} }; } dispose() {} };
  }
  vm.runInContext(read('rg3d-kit.js'), c);
  const host = node('host');
  return { c, kit: c.RG3DKit, host, frames, timers, scripts, media, texts, observers, documentEvents, windowEvents,
    get renderCount() { return renderCount; },
    step(ms = 16) { now += ms; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach((fn) => fn(now)); },
    stage(options = {}) { return c.RG3DKit.createStage({ host, ...options }); } };
}
const settle = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };

test('骰子 1–6：實際幾何各面的本地法向量經旋轉矩陣後只有指定面朝上', async () => {
  const e = environment(), d = e.kit.dice(), T = e.c.THREE;
  for (let n = 1; n <= 6; n++) {
    await d.roll(n, { calm: true });
    const matrix = new T.Matrix4().makeRotationFromEuler(d.userData.body.rotation);
    const up = [...d.userData.faceNormals].filter(([, normal]) => normal.clone().transformDirection(matrix).y > .999999).map(([face]) => face);
    assert.deepEqual(up, [n]); assert.equal(d.userData.value, n);
    assert.equal(d.userData.body.position.y, .46);
  }
  assert.throws(() => d.roll(7), /1–6/);
});

test('一般擲骰包含拋起、兩次落地彈跳；最終指定面保持朝上', async () => {
  const e = environment(), d = e.kit.dice(), samples = [];
  const stage = { tween: async (name, ms, fn) => {
    assert.equal(ms, 1200); for (const p of [0, .275, .55, .665, .78, .89, 1]) { fn(p); samples.push(d.userData.body.position.y); }
  } };
  await d.roll(6, { stage });
  assert.ok(samples[1] > samples[3] && samples[3] > samples[5]);
  for (const i of [0, 2, 4, 6]) assert.ok(Math.abs(samples[i] - .46) < 1e-8);
});

test('四個角色底座均有各自數字 canvas 貼圖，且外形確實不同', () => {
  const e = environment(), counts = [];
  for (let team = 0; team < 4; team++) {
    const p = e.kit.piece(team), map = p.userData.base.userData.numberTexture;
    assert.equal(map.image.width, 128); assert.ok(e.texts.includes(String(team + 1)));
    let found = false, count = 0; p.traverse((o) => { count++; if (o.material?.map === map) found = true; });
    assert.ok(found); counts.push(count);
  }
  assert.ok(new Set(counts).size >= 3);
});

test('calm hop 每格 80ms，全程 y 不變，idle 與 cheer 不播放', async () => {
  const e = environment(), p = e.kit.piece(0), ys = [];
  const stage = { tween: async (name, ms, fn) => { assert.equal(ms, 80); for (const progress of [0, .25, .5, .75, 1]) { fn(progress); ys.push(p.position.y); } } };
  await p.hop({ x: 0, y: .2, z: 0 }, { x: 2, y: .2, z: 3 }, { stage, calm: true });
  assert.deepEqual(ys, [.2, .2, .2, .2, .2]); assert.equal(p.position.x, 2); assert.equal(p.position.z, 3);
  await p.idle({ stage, calm: true, active: true }); await p.cheer({ stage, calm: true });
});

test('dispose 完成所有等待補間，並移除 rAF 與事件監聽', async () => {
  const e = environment(), s = e.stage(); await s.ready;
  assert.equal(s.active, true); let progress = 0;
  const a = s.tween('move', 500, (p) => { progress = p; }), b = s.tween('dice', 1200, () => {});
  const renderer = s.renderer; s.dispose(); await Promise.all([a, b]);
  assert.equal(progress, 1); assert.equal(s.tweens.size, 0); assert.equal(e.frames.size, 0);
  assert.equal(renderer.disposed, true); assert.equal(e.documentEvents.size, 0); assert.equal(e.windowEvents.size, 0);
  await s.tween('later', 100, (p) => assert.equal(p, 1)); s.dispose();
});

test('閒置不排 rAF；同名替換、頁面隱藏均解除等待', async () => {
  const e = environment(), s = e.stage(); await s.ready; assert.equal(e.frames.size, 0);
  let first = 0; const p = s.tween('same', 500, (t) => { first = t; });
  const next = s.tween('same', 500, () => {}); await p; assert.equal(first, 1);
  e.c.document.hidden = true; s.visibility(); await next; assert.equal(e.frames.size, 0);
  await s.tween('hidden', 500, (t) => assert.equal(t, 1)); s.dispose();
});

for (const setting of ['calm', 'reduced', 'narrow']) test(setting + ' 初始降級不載入引擎，切換後可恢復', async () => {
  const e = environment({ [setting]: true }), s = e.stage(); await s.ready; assert.equal(s.active, false);
  e.c.document.body.classList.remove('calm'); for (const media of e.media.values()) media.matches = false;
  await s.refresh(); assert.equal(s.active, true);
  const p = s.tween('move', 1000, () => {}); e.c.document.body.classList.add('calm'); await s.refresh(); await p;
  assert.equal(s.active, false); s.dispose();
});

test('context lost 與 WebGL 初始化失敗都回 2D', async () => {
  const e = environment(), s = e.stage(); await s.ready;
  const p = s.tween('move', 500, () => {}); s.renderer.domElement.events.get('webglcontextlost')({ preventDefault() {} }); await p;
  assert.equal(s.active, false); assert.match(s.failed, /context lost/); s.dispose();
  const fail = environment({ rendererFails: true }), failed = fail.stage(); await failed.ready; assert.equal(failed.active, false); failed.dispose();
});

test('連續慢幀先降 light，再降 2D，每次都解除等待', async () => {
  const e = environment(), s = e.stage(); await s.ready;
  const a = s.tween('slow', 100000, () => {}); for (let i = 0; i < 215; i++) e.step(40); await a;
  assert.equal(s.quality, 'light'); assert.equal(s.renderer.shadowMap.enabled, false);
  const b = s.tween('still-slow', 100000, () => {}); for (let i = 0; i < 185; i++) e.step(40); await b;
  assert.equal(s.active, false); assert.equal(e.frames.size, 0); s.dispose();
});

for (const timeout of [false, true]) test('引擎載入' + (timeout ? '逾時' : '失敗') + '不會留下等待或 timer', async () => {
  const e = environment({ three: false }), s = e.stage();
  assert.equal(e.scripts[0].src, 'http://local/Chinese/Review-Games/vendor/three-r128/three.min.js');
  if (timeout) [...e.timers.values()][0](); else e.scripts[0].onerror();
  await settle(); await s.ready; assert.equal(s.active, false); assert.equal(e.timers.size, 0); s.dispose();
});

test('材質共用、木紋共圖；renderer 品質設定符合規格', () => {
  const e = environment(), k = e.kit;
  assert.equal(k.MAT.plastic('#c0362c'), k.MAT.plastic('#c0362c')); assert.equal(k.MAT.wood.map, k.MAT.woodDark.map);
  assert.equal(k.MAT.wood.map.image.width, 512); assert.equal(k.MAT.felt.roughness, 1);
  for (const [q, ratio] of [['high', 2], ['standard', 1.5], ['light', 1]]) {
    const r = k.createRenderer(q); assert.equal(r.pixelRatio, ratio); assert.equal(r.toneMappingExposure, 1.05);
    assert.equal(r.shadowMap.enabled, q !== 'light'); assert.equal(r.domElement.attributes['aria-hidden'], 'true');
  }
});
