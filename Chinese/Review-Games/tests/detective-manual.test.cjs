/* T4b：執行真實畫面函式，DOM／鏡頭用替身；不代替 Claude 的截圖驗收。 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const source = read('detective.js');
function h(tag, attrs = {}, kids = []) {
  const el = { tag, attrs, children: [].concat(kids).filter(x => x != null), open: !!attrs.open,
    replaceChildren(...kids) { this.children = kids; },
    querySelector(selector) { return walk(this).find(n => selector.startsWith('[data-group=')
      ? n.attrs['data-group'] === selector.match(/"([^"]+)"/)[1]
      : selector.startsWith('.') && (n.attrs.class || '').split(' ').includes(selector.slice(1))) || null; },
  };
  Object.defineProperty(el, 'textContent', { get: () => el.children.map(c => typeof c === 'object' ? c.textContent : c).join('') });
  return el;
}
function walk(n) { return [n, ...n.children.filter(c => c && typeof c === 'object').flatMap(walk)]; }
function env(level = 'standard') {
  const c = { window: {}, h }; c.window = c; vm.createContext(c);
  vm.runInContext(read('detective-core.js'), c);
  vm.runInContext(read('data/detective-G3A.js'), c);
  c.C = c.DetectiveCore; c.game = c.C.makeRoom(c.DETECTIVE_BANK, 1, level, 42);
  c.calls = []; c.notebook = () => c.calls.push('notebook'); c.pick = id => c.calls.push(`pick:${id}`);
  c.visualSnapshot = () => ({}); c.room = { items: [...c.game.objects.map(o => ({ id: o.id, label: o.label || o.id })), ...c.game.puzzles.map(p => ({ id: p.id, label: p.id }))],
    setState() {}, applyVisualState() {}, focus: id => c.calls.push(`focus:${id}`) };
  vm.runInContext(source.slice(source.indexOf('  const stationPuzzles'), source.indexOf('  function play()')), c);
  vm.runInContext(source.slice(source.indexOf('  function refreshStates'), source.indexOf('  function rerender')), c);
  // 使用 T4a 真實捕獲 listener，確認 data-id 先聚焦再執行 onPick。
  const scene = read('detective3d.js');
  const listener = scene.slice(scene.indexOf('this.listFocusListener=e=>'), scene.indexOf('this.listContainer?.addEventListener'));
  vm.runInContext(`(function(){${listener}}).call(room)`, c);
  c.click = b => { c.room.listFocusListener({ target: { closest: () => ({ dataset: { id: b.attrs['data-id'] }, textContent: b.textContent }) } }); b.attrs.onclick(); };
  return c;
}
for (const level of ['support', 'standard', 'challenge']) {
  test(`${level} 手冊五區、實際線索總數、目前任務與所有物件入口`, () => {
    const c = env(level), manual = h('div'); c.refreshStates(manual);
    assert.equal(manual.children.length, 5);
    assert.match(manual.children[0].textContent, /目前任務/);
    assert.match(manual.children[1].textContent, new RegExp(`線索 0/${c.game.clues.length}`));
    assert.match(manual.children[2].textContent, /可以調查/);
    assert.equal(manual.children[3].open, false); assert.equal(manual.children[4].open, false);
    const go = walk(manual.children[0]).find(n => n.tag === 'button');
    c.click(go); assert.deepEqual(c.calls, [`focus:${go.attrs['data-id']}`, `pick:${go.attrs['data-id']}`]);
    const entries = walk(manual).filter(n => n.tag === 'button' && n.attrs['data-id'] && n !== go);
    assert.equal(entries.length, c.game.objects.length + c.game.puzzles.length - 1);
    for (const b of entries) { c.calls.length = 0; c.click(b); assert.deepEqual(c.calls, [`focus:${b.attrs['data-id']}`, `pick:${b.attrs['data-id']}`]); }
    const clue = walk(manual.children[1]).find(n => n.tag === 'button'); clue.attrs.onclick(); assert.equal(c.calls.at(-1), 'notebook');
    manual.children[3].open = true;
    c.game.objects.forEach(o => c.C.investigate(c.game, o.id)); c.refreshStates(manual);
    assert.equal(manual.children[3].open, true);
    assert.match(manual.children[1].textContent, new RegExp(`線索 ${c.game.clues.length}/${c.game.clues.length}`));
    assert.equal(walk(manual.children[1]).filter(n => (n.attrs.class || '').includes(' found')).length, c.game.clues.length);
    const nextGo = walk(manual.children[0]).find(n => n.tag === 'button'); assert.equal(nextGo.attrs['data-id'], 'sort');
    c.game.puzzles.forEach(p => { c.game.state.solved[p.id].done = true; }); c.refreshStates(manual);
    assert.equal(walk(manual.children[0]).find(n => n.tag === 'button').attrs['data-id'], 'final');
  });
}
test('筆記本僅真實線索有蒐證章，可疑紙條與解題回顧沒有', () => {
  const c = env(); c.game.objects.forEach(o => c.C.investigate(c.game, o.id));
  c.game.state.solved.dial.done = true;
  c.spk = () => null; c.solvedInfo = () => '回顧'; c.frame = (title, kids) => { c.note = h('div', {}, kids); };
  vm.runInContext(source.slice(source.indexOf('  function notebook()'), source.indexOf('  function solvedInfo')), c);
  c.notebook(); const cards = walk(c.note).filter(n => (n.attrs.class || '').split(' ').includes('dt-evidence'));
  assert.equal(cards.length, c.game.clues.length);
  assert.ok(cards.every(n => !n.attrs.class.includes('decoy')));
  assert.match(read('detective.css'), /\.dt-evidence::after[^}]*已蒐證[^}]*400ms/);
  assert.doesNotMatch(read('detective.css'), /\.dt-clue:not\(\.decoy\)::after/);
});
function exitEnv(reduced = false) {
  const c = env(); Object.assign(c, { escaping: false, recorded: false, settings: { calm: reduced }, document: { hidden: false },
    matchMedia: () => ({ matches: false }), tone() {}, app: { append(b) { c.skip = b; } }, timers: [],
    setTimeout(fn, ms) { c.timers.push({ fn, ms }); return 1; }, clearTimeout() {} });
  c.C = { escape: () => true }; c.room.animate = kind => c.calls.push(kind); c.results = animate => c.calls.push(['results', animate]);
  vm.runInContext(source.slice(source.indexOf('  function escapeRoom()'), source.indexOf('  function results(')), c);
  return c;
}
test('破案門光後進揭曉、可從開門階段略過，重複點擊不排兩次', () => {
  const c = exitEnv(); c.escapeRoom(); c.escapeRoom();
  assert.equal(c.timers.length, 1); assert.equal(c.timers[0].ms, 700);
  c.skip.attrs.onclick(); assert.deepEqual(c.calls.at(-1), ['results', false]);
  const normal = exitEnv(); normal.escapeRoom(); normal.timers[0].fn(); assert.deepEqual(normal.calls.at(-1), ['results', true]);
});
for (const mode of ['calm', 'system', 'hidden']) {
  test(`破案 ${mode} 直接顯示終態且沒有計時等待`, () => {
    const c = exitEnv(mode === 'calm'); if (mode === 'system') c.matchMedia = () => ({ matches: true }); if (mode === 'hidden') c.document.hidden = true;
    c.escapeRoom(); assert.equal(c.timers.length, 0); assert.deepEqual(c.calls.at(-1), ['results', false]);
  });
}
test('破案揭曉依光、案件章、偵探章、摘要順序，總長 2050ms', () => {
  const css = read('detective.css');
  assert.match(css, /dt-case-seal \{ animation: dt-case-appear 350ms 300ms/);
  assert.match(css, /dt-detective-badge \{ animation: dt-case-appear 350ms 650ms/);
  assert.match(css, /dt-case-summary \{ animation: dt-case-appear 350ms 1000ms/);
  assert.ok(700 + 1000 + 350 <= 2500);
  assert.match(source, /classList.remove\('dt-reveal'\)/);
  assert.match(css, /prefers-reduced-motion: reduce\) \{\s*\.dt-case-closed \* \{ animation: none !important/);
});
test('成果頁保留學習紀錄，實際建立徽章與摘要，略過只完成呈現', () => {
  const c = env(); c.game.objects.forEach(o => c.C.investigate(c.game, o.id));
  c.game.puzzles.forEach(p => { c.game.state.solved[p.id].done = true; });
  let writes = 0, disposed = 0;
  Object.assign(c, { recorded: false, escapeTimer: null, RKEY: 'record', gradeKey: () => 'G3A', clearTimeout() {},
    closeModal() {}, start() {}, setup() {}, topbar: t => h('h1', {}, t), stepper: () => h('ol'), load: () => ({}),
    save() { writes++; }, say() {}, app: h('main') });
  c.room.dispose = () => disposed++;
  vm.runInContext(source.slice(source.indexOf('  function results('), source.indexOf('\n  settings = Object.assign')), c);
  c.results(true);
  assert.equal(writes, 1); assert.equal(disposed, 1); assert.equal(c.game.stage, 7);
  assert.match(c.app.textContent, /案件破解/); assert.match(c.app.textContent, /找到 \d+ 張線索、解開 \d+ 個機關/);
  assert.match(c.app.textContent, /第一次就完成/);
  const reveal = walk(c.app).find(n => (n.attrs.class || '').includes('dt-reveal'));
  assert.deepEqual(reveal.children.slice(0, 4).map(n => n.attrs.class), ['dt-case-light', 'dt-case-seal', 'dt-detective-badge', 'dt-case-summary']);
  const skip = walk(reveal).find(n => n.attrs.class === 'btn dt-reveal-skip'); let completed = false;
  skip.attrs.onclick({ currentTarget: { closest: () => ({ classList: { remove(k) { assert.equal(k, 'dt-reveal'); completed = true; } } }), remove() {} } });
  assert.equal(completed, true); c.results(); assert.equal(writes, 1);
});
test('開門期間取消或更換案件，舊計時器不能覆蓋新畫面', () => {
  for (const change of ['cancel', 'game', 'room']) {
    const c = exitEnv(); c.escapeRoom();
    if (change === 'cancel') {
      vm.runInContext(source.slice(source.indexOf('  function cancelExit()'), source.indexOf('  function visualSnapshot()')), c); c.cancelExit();
    } else c[change] = {};
    c.timers[0].fn(); assert.ok(!c.calls.some(x => Array.isArray(x) && x[0] === 'results'));
  }
});
