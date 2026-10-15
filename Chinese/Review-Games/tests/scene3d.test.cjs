/* 不需瀏覽器的生命週期測試。繪圖初始化採替身，不能據此宣稱 GPU 或視覺驗收通過。 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../scene3d.js'), 'utf8');

function environment({ calm = false, narrow = false, three = true } = {}) {
  const media = new Map(), observers = [], timers = new Set(), scripts = [];
  const node = (tag) => ({
    tag, children: [], isConnected: true, checked: false, className: '',
    classList: {
      values: new Set(), contains(c) { return this.values.has(c); },
      add(...c) { c.forEach((v) => this.values.add(v)); }, remove(c) { this.values.delete(c); },
      toggle(c, on) { if (on) this.values.add(c); else this.values.delete(c); }
    },
    setAttribute() {}, addEventListener() {}, remove() { this.isConnected = false; },
    append(...n) { this.children.push(...n); if (tag === 'head') n.forEach((s) => scripts.push(s)); },
    prepend(n) { this.children.unshift(n); }, after() {}, querySelector() { return this.children[0]; },
    querySelectorAll() { return []; }
  });
  const body = node('body'); if (calm) body.classList.add('calm');
  const document = { body, head: node('head'), hidden: false, createElement: node, createTextNode: (t) => ({ textContent: t }), addEventListener() {}, querySelector: () => node('header') };
  const context = {
    window: { addEventListener() {} }, document, performance: { now: () => 100 },
    matchMedia(q) { if (!media.has(q)) media.set(q, { matches: q.includes('760') ? narrow : false, addEventListener() {} }); return media.get(q); },
    MutationObserver: class { constructor(cb) { this.cb = cb; observers.push(this); } observe() {} },
    ResizeObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    setTimeout(cb) { const t = { cb }; timers.add(t); return t; }, clearTimeout(t) { timers.delete(t); }
  };
  if (three) context.window.THREE = {};
  vm.runInNewContext(source, context);
  const host = node('host');
  return { context, document, media, observers, scripts, host, timers, mount: (extra = {}) => context.window.RG3D.mount({ kind: 'monopoly', host, ...extra }) };
}
const settle = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };
function drawingSubstitute(v) {
  v.init = () => { v.renderer = { dispose() {}, forceContextLoss() {} }; };
  v.sync = () => { v.syncCount = (v.syncCount || 0) + 1; };
  v.resize = () => {}; v.draw = () => {}; v.updateProjection = () => {};
}

test('減少動態與窄螢幕不載入 CDN，仍保留棋子與地產狀態', async () => {
  for (const settings of [{ calm: true }, { narrow: true }]) {
    const e = environment({ ...settings, three: false }); const v = e.mount();
    await v.moveToken(2, 17); v.setOwner(17, 2); await v.rollDice(5);
    assert.equal(v.active, false); assert.equal(e.scripts.length, 0);
    assert.equal(v.tokens.get(2), 17); assert.equal(v.owners.get(17), 2); assert.equal(v.dieValue, 5);
    v.dispose();
  }
});

test('切換減少動態會完成補間並解除等待；恢復時重建目前狀態', async () => {
  const e = environment(); const modes = [];
  const v = e.mount({ onMode: (on) => modes.push(on) }); drawingSubstitute(v); await settle();
  assert.equal(v.active, true);
  let progress = 0; const movement = v.tween('move', 800, (t) => { progress = t; });
  e.document.body.classList.add('calm'); await v.refresh(); await movement;
  assert.equal(v.active, false); assert.equal(progress, 1); assert.equal(v.tweens.size, 0);
  await v.moveToken(0, 9); v.setOwner(4, 1);
  e.document.body.classList.remove('calm'); await v.refresh();
  assert.equal(v.active, true); assert.equal(v.tokens.get(0), 9); assert.equal(v.owners.get(4), 1);
  assert.ok(v.syncCount >= 2); assert.deepEqual(modes, [true, false, true]); v.dispose();
});

test('系統動態設定優先於面板，變更投影不會重設遊戲狀態', async () => {
  const e = environment(); const v = e.mount(); drawingSubstitute(v); await settle();
  e.media.get('(prefers-reduced-motion: reduce)').matches = true; await v.refresh();
  assert.equal(v.active, false);
  await v.moveToken(3, 8);
  e.media.get('(prefers-reduced-motion: reduce)').matches = false;
  e.document.body.classList.add('proj'); await v.refresh();
  assert.equal(v.active, true); assert.equal(v.projection, true); assert.equal(v.tokens.get(3), 8); v.dispose();
});

test('CDN 失敗與逾時皆保留 2D，沒有未處理的拒絕', async () => {
  for (const timeout of [false, true]) {
    const e = environment({ three: false }); const v = e.mount();
    assert.equal(e.scripts.length, 1);
    if (timeout) [...e.timers][0].cb(); else e.scripts[0].onerror();
    await settle(); assert.equal(v.active, false); assert.ok(v.failed); assert.equal(e.timers.size, timeout ? 1 : 0);
    await v.moveToken(1, 6); assert.equal(v.tokens.get(1), 6); v.dispose();
  }
});

test('CDN 等待期間開啟減少動態，不建立 renderer', async () => {
  const e = environment({ three: false }); const v = e.mount(); let called = false;
  v.init = () => { called = true; };
  e.document.body.classList.add('calm'); e.scripts[0].onload(); await settle();
  assert.equal(called, false); assert.equal(v.active, false); v.dispose();
});

test('移除載入中的視圖後，不重新啟動 renderer', async () => {
  const e = environment({ three: false }); const v = e.mount(); let initialized = false;
  v.init = () => { initialized = true; }; v.dispose(); e.scripts[0].onload(); await settle();
  assert.equal(initialized, false); assert.equal(v.disposed, true);
});

test('頁面隱藏時補間直接完成，不阻擋回合流程', async () => {
  const e = environment(); const v = e.mount(); drawingSubstitute(v); await settle();
  let done = false; const p = v.tween('move', 850, (t) => { done = t === 1; });
  e.document.hidden = true; v.visibility(); await p; assert.equal(done, true);
  let immediate = 0; await v.tween('dice', 930, (t) => { immediate = t; }); assert.equal(immediate, 1); v.dispose();
});

test('WebGL 初始化失敗仍可保存遊戲狀態', async () => {
  const e = environment(); const v = e.mount();
  v.init = () => { throw new Error('此裝置沒有 WebGL'); }; await settle();
  assert.equal(v.active, false); assert.ok(v.failed);
  await v.moveToken(0, 12); assert.equal(v.tokens.get(0), 12); v.dispose();
});

test('CDN 等待期間已找到的詞，不會被延遲的發牌清除', async () => {
  const e = environment({ three: false }); const v = e.mount({ kind: 'dobble' }); drawingSubstitute(v);
  v.deal(); assert.equal(v.pendingDeal, true);
  v.markMatch('語詞'); e.scripts[0].onload(); await settle();
  assert.equal(v.match, '語詞'); assert.equal(v.pendingDeal, false); v.dispose();
});

test('2D 期間的賓果記號、連線會留在同一份視圖狀態', async () => {
  const e = environment({ calm: true }); const v = e.mount({ kind: 'bingo' });
  v.markCell(0, false); v.markCell(1, true); v.markCell(2, false); v.setLines([[0, 1, 2]]);
  assert.equal(v.marks.get(0), false); assert.equal(v.marks.get(1), true);
  assert.equal(JSON.stringify(v.lineState), '[[0,1,2]]'); v.dispose();
});

for (const fails of [false, true]) test(`泛光遮罩${fails ? '失敗' : '完成'}後還原場景、字卡與 render target`, async () => {
  const e = environment(), v = e.mount(); drawingSubstitute(v); await settle();
  e.context.THREE = { Color: class { constructor(value) { this.value = value; } } };
  const background = { name: '木桌背景' }, originalTarget = { name: '原本 target' };
  const wood = { name: '木頭材質' }, feedback = { color: { set() { return this; }, convertSRGBToLinear() { return this; }, multiplyScalar(n) { this.intensity = n; return this; } } };
  const tile = { isMesh: true, material: wood, userData: {}, parent: null };
  const sprite = { isSprite: true, visible: true };
  const hiddenSprite = { isSprite: true, visible: false };
  const house = { isMesh: true, material: wood, userData: { bloomMaterial: feedback }, parent: { userData: { feedback: .5 }, parent: null } };
  v.root = { traverse(fn) { [tile, sprite, hiddenSprite, house].forEach(fn); } };
  v.scene = { background }; v.camera = {}; v.maskMaterial = {}; v.baseTarget = {};
  let target = originalTarget, baseRendered = false;
  v.renderer.getRenderTarget = () => target; v.renderer.setRenderTarget = (t) => { target = t; };
  v.renderer.render = () => { assert.equal(v.scene.background, background); assert.equal(sprite.visible, true); assert.equal(tile.material, wood); baseRendered = true; };
  v.composer = { render() {
    assert.ok(baseRendered); assert.equal(tile.material, v.maskMaterial); assert.equal(sprite.visible, false);
    assert.equal(house.material, feedback); assert.equal(feedback.color.intensity, 1.5);
    if (fails) throw new Error('GPU 後製失敗');
  } };
  if (fails) assert.throws(() => v.renderEffects(), /GPU 後製失敗/); else v.renderEffects();
  assert.equal(v.scene.background, background); assert.equal(tile.material, wood); assert.equal(house.material, wood);
  assert.equal(sprite.visible, true); assert.equal(hiddenSprite.visible, false); assert.equal(target, originalTarget);
  v.root = null; v.composer = null; v.baseTarget = null; v.maskMaterial = null; v.dispose();
});
