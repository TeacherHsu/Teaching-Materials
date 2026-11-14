// Node VM／DOM 替身驗證行為；不代表瀏覽器排版或動畫驗收。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
function helpers() {
  let calm = false, observer;
  const fx = { children: [], get childElementCount() { return this.children.length; }, appendChild(n) { this.children.push(n); n.remove = () => { this.children = this.children.filter(x => x !== n); }; } };
  const context = { Promise, setTimeout, clearTimeout, Math,
    document: { body: {}, createElement: () => ({ style: {} }) },
    MutationObserver: class { constructor(fn) { observer = fn; } observe() {} },
    reduced: () => calm, esc: s => String(s).replaceAll('"', '&quot;'), $: () => fx,
  };
  vm.createContext(context);
  const source = read('read-aloud.js');
  const section = source.slice(source.indexOf('  function art('), source.indexOf('  // ---------- 朗讀示範'));
  vm.runInContext(section + '\nthis.api={art,backdrop,motion,visualSleep,particles,impact,floatLabel,projectile,effectNode};', context);
  return { api: context.api, fx, calm(value) { calm = value; if (observer) observer(); } };
}
test('每張角色圖的 error handler 保留同尺寸 fallback，背景 error 保留底色', () => {
  const { api } = helpers(); const html = api.art('egg-0', '<svg></svg>', '寵物蛋');
  const handler = html.match(/onerror="([^"]+)"/)[1];
  const img = { hidden: false, nextElementSibling: { hidden: true } };
  new Function(handler).call(img);
  assert.equal(img.hidden, true); assert.equal(img.nextElementSibling.hidden, false);
  assert.match(html, /<svg><\/svg>/);
  assert.match(api.backdrop('bg-forest'), /onerror="this.remove\(\)"/);
});
test('動畫關：新演出不建立粒子、不啟動動畫、不等待計時', async () => {
  const h = helpers(); h.calm(true);
  const el = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }), animate() { throw Error('動畫關仍呼叫 animate'); } };
  await Promise.all([h.api.motion(el, [], 1000), h.api.visualSleep(10000), h.api.particles(el), h.api.impact(el), h.api.floatLabel(el, '+1'), h.api.projectile('wave', '🔊', el, el)]);
  assert.equal(h.fx.childElementCount, 0);
});
test('特效滿 60 個時不再加入 DOM', () => {
  const h = helpers(); for (let i = 0; i < 65; i++) h.api.effectNode('', 'particle', 0, 0);
  assert.equal(h.fx.childElementCount, 60);
});
test('演出中關動畫：取消 WAAPI 並 resolve、移除投射物', async () => {
  const h = helpers(); let animation;
  const node = { style: {}, animate() { animation = { cancel() { this.oncancel(); } }; return animation; } };
  const target = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) };
  const originalAppend = h.fx.appendChild.bind(h.fx);
  h.fx.appendChild = n => { n.animate = node.animate; originalAppend(n); };
  const flight = h.api.projectile('wave', '🔊', target, target, { duration: 10000 });
  assert.equal(h.fx.childElementCount, 1);
  h.calm(true); await flight;
  assert.equal(h.fx.childElementCount, 0);
});
function mode(name) {
  let config;
  const elements = new Map();
  function element() { return { style: { setProperty() {} }, dataset: {}, classList: { toggle() {}, add() {}, remove() {} }, innerHTML: '', textContent: '', querySelector: () => element(), querySelectorAll: () => Array.from({ length: 20 }, element), firstElementChild: {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 150, height: 150 }) }; }
  const $ = id => { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); };
  const context = { window: { ReadAloud: { start: cfg => { config = cfg; } } }, document: { getElementById: $ }, console };
  vm.runInNewContext(read(name + '.js'), context);
  const calls = [];
  const api = { $, FULL: 3, state: { tasks: [] }, reduced: () => true, shuffle: a => [...a],
    groupSizes: require('../read-aloud.js').groupSizes,
    art: n => `<span class="art">${n}</span>`, backdrop: n => n,
    motion: async () => {}, visualSleep: async () => {}, projectile: async n => { calls.push(n); },
    particles() {}, impact() {}, floatLabel() {}, beep() {}, feedback() {}, waitButton: async () => {},
  };
  return { config, api, calls };
}
test('寵物模式：動畫關仍逐份加能量，滿 9 份破蛋，結算使用插圖', async () => {
  const { config, api, calls } = mode('pet');
  const tasks = Array.from({ length: 3 }, () => ({})); config.setup(tasks, api);
  config.showTask(tasks[0], api);
  for (let i = 0; i < tasks.length; i++) { await config.onGain(tasks[i], 3, api); await config.onTaskDone(tasks[i], api); }
  assert.equal(calls.filter(x => x === 'meat').length, 9);
  assert.match(api.$('bubble').textContent, /破蛋出生/);
  assert.match(api.$('strip').innerHTML, /pet-dog/);
  await config.onFinish(api); assert.match(api.$('finStage').innerHTML, /pet-dog/);
});
test('打怪模式：三道聲波依序呼叫，升級；大魔王集滿才發特大聲波', async () => {
  const { config, api, calls } = mode('monster');
  const tasks = [{ got: 3 }]; api.state.tasks = tasks; config.setup(tasks, api); config.showTask(tasks[0], api);
  await config.onGain(tasks[0], 3, api); assert.deepEqual(calls, ['wave', 'wave', 'wave']);
  tasks[0].done = true; await config.onTaskDone(tasks[0], api);
  assert.match(api.$('heroTag').textContent, /LV 2/); assert.equal(calls.at(-1), 'star');
  const boss = [{ phase: 'bonus', got: 3, done: true }]; api.state.tasks = [...tasks, ...boss];
  await config.onBonusStart(boss, api); config.showTask(boss[0], api);
  calls.length = 0; await config.onGain(boss[0], 3, api); assert.equal(calls.length, 0);
  await config.onTaskDone(boss[0], api); assert.deepEqual(calls, ['wave']);
  assert.match(api.$('foeFace').innerHTML, /boss-dizzy/); assert.equal(api.$('foe').style.opacity, '0');
  await config.onFinish(api); assert.match(api.$('finStage').innerHTML, /hero-cheer/);
});
