/* 課文偵探密室 2.0（三幕案件）邏輯測試：不需瀏覽器。 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const dir = path.join(__dirname, '..');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(dir, 'detective2-core.js'), 'utf8'), ctx);
const D = ctx.Detective2;
const GRADES = ['G1A', 'G2A', 'G3A', 'G4A', 'G6A'];
const banks = Object.fromEntries(GRADES.map((g) => {
  const c = {}; vm.createContext(c); c.window = c;
  vm.runInContext(fs.readFileSync(path.join(dir, `data/detective-${g}.js`), 'utf8'), c);
  return [g, c.DETECTIVE_BANK];
}));
const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((r) => [x, ...r])));

function play(game) {
  // 跳關都要被擋
  assert.equal(D.placeTimeline(game, game.strands).blocked, true);
  assert.equal(D.openBag(game, game.bags[0].id, []).blocked, true);
  assert.equal(D.chooseClaim(game, game.claim.answer).blocked, true);
  for (const c of game.clues) { D.investigate(game, c.id); if (game.torn[c.id]) assert.equal(D.fixFragment(game, c.id, game.torn[c.id].answer).ok, true); }
  game.decoys.forEach((d) => D.investigate(game, d.id));
  assert.equal(D.searchDone(game), true);
  assert.equal(D.placeTimeline(game, game.strands).ok, true);
  assert.equal(game.state.act, 2);
  assert.equal(D.confront(game, game.rounds[0].id, { liar: 0 }).blocked, true, '證物袋沒開完就能對質');
  for (const b of game.bags) {
    let ans;
    if (b.type === 'words') ans = b.locks.map((l) => l.answer);
    else if (b.type === 'sentence') ans = perms(b.blocks).find((s) => D.blocksOk(b.item, s));
    else ans = b.answer; // listen、meaning 都是單選
    assert.ok(ans, `證物袋無解 ${JSON.stringify(b)}`);
    assert.equal(D.openBag(game, b.id, ans).ok, true);
  }
  for (const x of game.rounds) {
    const liar = x.witnesses.findIndex((w) => w.lying);
    assert.ok(x.witnesses.some((w) => !w.lying));
    if (x.evidence.length) assert.ok(x.evidence.every((id) => game.clues.some((c) => c.id === id)), '對質證據不在本局線索卡');
    assert.equal(D.confront(game, x.id, { liar, evidence: x.evidence[0] }).ok, true);
  }
  assert.equal(game.state.act, 3);
  assert.equal(D.chooseClaim(game, game.claim.answer).ok, true);
  const real = D.evidencePool(game).filter((e) => !e.decoy && e.kind !== 'timeline').map((e) => e.id);
  assert.ok(real.length >= game.L.claimEvidence);
  assert.equal(D.chooseEvidence(game, real.slice(0, game.L.claimEvidence)).ok, true);
  const cards = D.reasoningCards(game).map((c) => c.id);
  assert.equal(D.buildReasoning(game, cards).ok, true);
  assert.equal(game.state.finished, true);
  assert.match(game.state.sentence, /^我認為.+因為.+。$/);
}

for (const g of GRADES) {
  test(`${g} 每課三級都能走完三幕`, () => {
    let n = 0;
    for (const r of banks[g].rooms.filter((x) => x.acts)) for (const lv of Object.keys(D.LEVELS)) for (let s = 1; s <= 5; s++) { play(D.build(banks[g], r.no, lv, s * 31 + r.no)); n++; }
    assert.ok(n > 0);
  });
}

test('〈水滾了〉：題目全部來自課次資料、對質一定要附對證物', () => {
  const bank = banks.G3A; const game = D.build(bank, 4, 'standard', 7);
  assert.match(game.question, /水滾了/);
  for (const c of game.clues) { D.investigate(game, c.id); if (game.torn[c.id]) D.fixFragment(game, c.id, game.torn[c.id].answer); }
  D.placeTimeline(game, game.clues.map((c) => c.id));
  game.bags.forEach((b) => { game.state.rec[b.id].done = true; });
  const x = game.rounds[0];
  assert.ok(x.evidence.length > 0, '水滾了的對質題應對得到線索卡');
  const liar = x.witnesses.findIndex((w) => w.lying);
  const wrongEv = game.clues.map((c) => c.id).find((id) => !x.evidence.includes(id));
  const r = D.confront(game, x.id, { liar, evidence: wrongEv });
  assert.equal(r.ok, false); assert.equal(r.liarOk, true); assert.equal(r.evOk, false);
  assert.equal(D.confront(game, x.id, { liar: 1 - liar, evidence: x.evidence[0] }).liarOk, false);
});

test('錯三次自動前進並記為一起學過（不卡關）', () => {
  const game = D.build(banks.G3A, 4, 'standard', 3);
  for (const c of game.clues) { D.investigate(game, c.id); if (game.torn[c.id]) D.fixFragment(game, c.id, game.torn[c.id].answer); }
  const bad = game.clues.map((c) => c.id).reverse();
  D.placeTimeline(game, bad); D.placeTimeline(game, bad);
  const r = D.placeTimeline(game, bad);
  assert.equal(r.learned, true); assert.equal(game.state.act, 2);
  assert.equal(D.summary(game).rows.find((x) => x.id === 'timeline').status, '一起學過');
});

test('第三幕：可疑紙條不能當證據、證據不足不過', () => {
  const game = D.build(banks.G3A, 4, 'challenge', 11);
  play.call(null, D.build(banks.G3A, 4, 'challenge', 11)); // 確認可解
  for (const c of game.clues) { D.investigate(game, c.id); if (game.torn[c.id]) D.fixFragment(game, c.id, game.torn[c.id].answer); }
  game.decoys.forEach((d) => D.investigate(game, d.id));
  D.placeTimeline(game, game.clues.map((c) => c.id));
  game.bags.forEach((b) => { game.state.rec[b.id].done = true; });
  game.rounds.forEach((x) => D.confront(game, x.id, { liar: x.witnesses.findIndex((w) => w.lying), evidence: x.evidence[0] }));
  D.chooseClaim(game, game.claim.answer);
  assert.equal(D.chooseEvidence(game, ['d1', game.clues[0].id]).decoyPicked, true);
  assert.equal(D.chooseEvidence(game, [game.clues[0].id]).ok, false);
});

test('存檔後重新載入，題目與進度一致', () => {
  const bank = banks.G3A; const game = D.build(bank, 4, 'standard', 99);
  for (const c of game.clues) { D.investigate(game, c.id); if (game.torn[c.id]) D.fixFragment(game, c.id, game.torn[c.id].answer); }
  D.placeTimeline(game, game.clues.map((c) => c.id));
  const saved = JSON.parse(JSON.stringify(D.save(game)));
  const back = D.load(bank, saved);
  assert.equal(back.state.act, 2);
  assert.deepEqual(back.bags.map((b) => b.type), game.bags.map((b) => b.type));
  assert.deepEqual(back.rounds.map((r) => r.witnesses.map((w) => w.text)), game.rounds.map((r) => r.witnesses.map((w) => w.text)));
});

test('一課兩篇（四上〈水陸小高手〉、六上〈樹的聯想〉）：時間線分兩條，各自判定', () => {
  for (const [g, n] of [['G4A', 1], ['G6A', 5]]) {
    for (const lv of Object.keys(D.LEVELS)) {
      const game = D.build(banks[g], n, lv, 21);
      assert.equal(game.strands.length, 2, `${g} 第${n}課應有兩條時間線`);
      game.strands.forEach((ids) => assert.ok(ids.length >= 2, '每條至少兩張'));
      for (const c of game.clues) { D.investigate(game, c.id); if (game.torn[c.id]) D.fixFragment(game, c.id, game.torn[c.id].answer); }
      const flat = game.strands.flat();
      const r1 = D.placeTimeline(game, flat);
      assert.equal(r1.ok, false, '兩篇接成一條不算對');
      const r2 = D.placeTimeline(game, [game.strands[0], [...game.strands[1]].reverse()]);
      assert.equal(r2.ok, false); assert.equal(r2.wrong.strand, 1, '應指出第二篇排錯');
      assert.equal(D.placeTimeline(game, game.strands).ok, true);
    }
  }
});
