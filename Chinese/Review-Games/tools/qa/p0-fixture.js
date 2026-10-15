async function runP0Fixture() {
/* cdp.mjs 的操作腳本。只在 QA 頁注入固定 RNG／時間，不由正式 HTML 引用。
   網址可帶 qaLevel=support|standard|challenge、qaMode=solo|duel|duel-face、qaSlide=3|99。
   截圖局直接設定 view 狀態，不修改出題資料、遊戲分數或學習紀錄。 */
const wait = ms => new Promise(r => setTimeout(r, ms));
const params = new URLSearchParams(location.search);
let seed = 271828;
Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
Date.now = () => 1792108800000;
const views = [];
let roomView;
if (window.Detective3D) {
  const mount = Detective3D.mount;
  Detective3D.mount = (host, opts) => { roomView = mount(host, opts); return roomView; };
}
if (window.RG3D) {
  const mount = RG3D.mount;
  RG3D.mount = opts => { const v = mount(opts); if (v) views.push(v); return v; };
}
const choose = (label, value) => {
  const el = document.querySelector(`select[aria-label="${label}"]`) || [...document.querySelectorAll("label")].find(l => l.querySelector("strong")?.textContent === label)?.querySelector("select");
  if (el) { el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); }
};
const clickText = text => {
  const b = [...document.querySelectorAll('button')].find(b => b.textContent.includes(text));
  if (!b) throw Error('找不到操作：' + text); b.click();
};
choose('支持程度', params.get('qaLevel') || 'standard');
choose('作答時間', '0');
choose('隊伍數', '4'); choose('玩家數', '4'); choose('蛇的規則', params.get('qaSlide') || '3');
if (location.pathname.includes('dobble')) choose('模式', params.get('qaMode') || 'solo');
if (location.pathname.includes('bingo')) { choose('模式', '4'); choose('分隊玩法', 'versus'); }
if (location.pathname.includes('detective')) {
  clickText('開始偵探'); await wait(300);
  const game = DT_DEBUG.game, C = DetectiveCore, state = params.get('qaRoom') || 'last-clue';
  const holders = game.objects.filter(o => game.clues.some(c => c.id === o.holds));
  holders.slice(0, state === 'last-clue' ? -1 : undefined).forEach(o => C.investigate(game, o.id));
  if (state === 'final-door') {
    const perms = a => a.length <= 1 ? [a] : a.flatMap((x, i) => perms(a.filter((_, k) => k !== i)).map(r => [x, ...r]));
    const combos = (a, n) => n === 0 ? [[]] : a.flatMap((x, i) => combos(a.slice(i + 1), n - 1).map(r => [x, ...r]));
    for (const p of game.puzzles.filter(p => !['search', 'final'].includes(p.type))) {
      let answer;
      if (p.type === 'sort') answer = p.answer.slice();
      if (p.type === 'dial') answer = p.items.map(i => i.answer);
      if (p.type === 'keys') answer = p.locks.map(i => i.answer);
      if (p.type === 'blocks') answer = combos(p.blocks, p.need).flatMap(perms).find(a => C.blocksOk(p.item, a));
      if (['compare', 'cause'].includes(p.type)) answer = { choice: p.answer, evidence: p.evidence };
      const result = C.check(game, p.id, answer); if (!result.ok) throw Error('fixture 未能依原規則解題：' + p.id);
    }
  }
  clickText('進入密室'); await wait(6000);
  const before = JSON.stringify(game.state), fault = params.get('qaFault');
  if (fault === 'render' && roomView.renderer) { roomView.renderer.render = () => { throw Error('QA render failure'); }; roomView.kick(); }
  if (fault === 'context' && roomView.renderer) roomView.renderer.domElement.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
  if (fault === 'calm') document.body.classList.add('calm');
  await wait(500);
  if (JSON.stringify(game.state) !== before) throw Error('視圖降級改動遊戲狀態');
  const rects = [...document.querySelectorAll('.dt-mark')].map(b => b.getBoundingClientRect());
  const collisions = rects.flatMap((a, i) => rects.slice(i + 1).filter(b => a.left < b.right + 7 && a.right + 7 > b.left && a.top < b.bottom + 7 && a.bottom + 7 > b.top));
  if (collisions.length) throw Error('密室標記互蓋');
  return { fixture: 'detective-' + state, fault, unchanged: before === JSON.stringify(game.state), state: JSON.parse(JSON.stringify(DT_DEBUG.game.state)), markers: document.querySelectorAll('.dt-mark').length, entries: document.querySelectorAll('.dt-list button').length, status: document.querySelector('.dt-status').textContent };
}
clickText('開始遊戲'); await wait(6000);
const v = views[0];
if (v && ['snakes', 'monopoly'].includes(v.kind)) {
  const cell = v.kind === 'snakes' ? 13 : 1;
  for (let i = 0; i < 4; i++) await v.moveToken(i, cell, { instant: true });
  if (v.kind === 'monopoly') v.setOwner(cell, 0);
  v.stepMark(0, cell, 3); v.draw(); await wait(1000);
}
if (location.pathname.includes('dobble')) {
  const discs = [...document.querySelectorAll('.disc')];
  const shared = [...discs[0].querySelectorAll('.sym')].find(b => [...discs[1].querySelectorAll('.sym')].some(c => c.textContent === b.textContent));
  shared?.click(); await wait(300);
}
return { fixture: location.pathname, rng: seed, tokens: v ? [...v.tokens] : [], owners: v ? [...v.owners] : [], snakes: v?.snakes, labels: [...document.querySelectorAll('.rg3d-cell-label')].map(el => ({ text: el.textContent, rect: el.getBoundingClientRect().toJSON() })), words: [...document.querySelectorAll('.bword, .sym')].map(el => el.textContent) };

}
return runP0Fixture();
