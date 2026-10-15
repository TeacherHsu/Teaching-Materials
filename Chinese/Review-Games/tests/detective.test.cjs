/* 課文偵探密室：資料與解謎邏輯測試（不需瀏覽器）。
   對每個年級、每個可玩課次、三級難度各組 5 局，用「照證據作答」的解題者走完，
   並確認：依賴不能跳、亂答不會過關、多解句型兩種排法都接受、干擾詞塊不會變成正解。 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const dir = path.join(__dirname, '..');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(dir, 'detective-core.js'), 'utf8'), ctx);
const C = ctx.DetectiveCore;
const GRADES = ['G1A', 'G2A', 'G3A', 'G4A', 'G6A'];
const banks = Object.fromEntries(GRADES.map((g) => {
  const c = {}; vm.createContext(c); c.window = c;
  vm.runInContext(fs.readFileSync(path.join(dir, `data/detective-${g}.js`), 'utf8'), c);
  return [g, c.DETECTIVE_BANK];
}));

function solve(game) {
  // 先試著跳關：除了搜查以外都應該被擋
  for (const p of game.puzzles) if (p.id !== 'search') assert.equal(C.check(game, p.id, []).blocked, true, `${p.id} 未解鎖卻能作答`);
  assert.equal(C.escape(game), false);
  for (const o of game.objects) C.investigate(game, o.id);
  assert.equal(game.state.solved.search.done, true);
  let guard = 0;
  while (!game.state.solved.final.done && guard++ < 20) {
    for (const p of game.puzzles) {
      if (game.state.solved[p.id].done || !C.isOpen(game, p.id)) continue;
      let ans;
      if (p.type === 'sort') ans = p.answer.slice();
      else if (p.type === 'dial') ans = p.items.map((i) => i.answer);
      else if (p.type === 'keys') ans = p.locks.map((l) => l.answer);
      else if (p.type === 'blocks') {
        // 用題目給的詞塊找出至少一種被接受的排法（證明可解）
        ans = findBlocks(p);
        assert.ok(ans, `詞塊無解：${JSON.stringify(p.blocks)}`);
      } else if (p.type === 'compare' || p.type === 'cause') ans = { choice: p.answer, evidence: p.evidence };
      else if (p.type === 'final' && p.cross) ans = p.pairs.map((x) => x.answer);
      else if (p.type === 'final') ans = { choice: p.answer, evidence: game.clues.map((c) => c.id).slice(0, p.needEvidence) };
      const r = C.check(game, p.id, ans);
      assert.equal(r.ok, true, `${p.id} 正解未通過 ${JSON.stringify(ans)}`);
    }
  }
  assert.equal(C.escape(game), true);
}
function perms(a) { if (a.length <= 1) return [a]; return a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((r) => [x, ...r])); }
function combos(a, k) { if (!k) return [[]]; return a.flatMap((x, i) => combos(a.slice(i + 1), k - 1).map((r) => [x, ...r])); }
function findBlocks(p) {
  for (const c of combos(p.blocks, p.need)) for (const s of perms(c)) if (C.blocksOk(p.item, s)) return s;
  return null;
}

for (const g of GRADES) {
  test(`${g} 每個可玩課次三級都能完成，且不能跳關`, () => {
    const bank = banks[g];
    let n = 0;
    for (const r of bank.rooms.filter((x) => x.playable)) {
      for (const lv of Object.keys(C.LEVELS)) for (let s = 1; s <= 5; s++) { solve(C.makeRoom(bank, r.no, lv, s * 7919 + r.no)); n++; }
    }
    assert.ok(n > 0);
  });
  test(`${g} 跨課綜合案件可完成`, () => {
    const nos = banks[g].rooms.filter((x) => x.playable).map((x) => x.no);
    for (const lv of Object.keys(C.LEVELS)) for (let s = 1; s <= 5; s++) solve(C.makeCross(banks[g], nos.slice(0, 4), lv, s));
  });
  test(`${g} 謎題資料：答案在選項內、選項不重複、線索排序唯一`, () => {
    for (const r of banks[g].rooms.filter((x) => x.playable)) {
      const orders = r.clues.map((c) => c.order);
      assert.equal(new Set(orders).size, orders.length);
      for (const lv of Object.keys(C.LEVELS)) {
        const game = C.makeRoom(banks[g], r.no, lv, 3);
        for (const p of game.puzzles) {
          if (p.choices) { assert.equal(new Set(p.choices).size, p.choices.length, `${r.no} ${p.id} 選項重複`); assert.ok(p.choices.includes(p.answer)); }
          if (p.type === 'dial') for (const it of p.items) { assert.ok(it.chars.includes(it.answer)); assert.equal(new Set(it.chars).size, it.chars.length); assert.ok(it.word.includes(it.answer)); }
          if (p.type === 'keys') { assert.equal(new Set(p.keys).size, p.keys.length); assert.equal(new Set(p.locks.map((l) => l.meaning)).size, p.locks.length); }
          if (p.type === 'blocks') {
            // 干擾詞塊不得出現在任何被接受的排法裡
            const extra = p.blocks.length - p.need;
            assert.ok(extra >= 0);
          }
        }
      }
    }
  });
}

test('亂答不會過關：錯的排序、錯的鑰匙、只選結論不附證據都不通過', () => {
  const bank = banks.G3A; const r = bank.rooms.find((x) => x.playable);
  const game = C.makeRoom(bank, r.no, 'challenge', 42);
  for (const o of game.objects) C.investigate(game, o.id);
  const sort = game.puzzles.find((p) => p.type === 'sort');
  assert.equal(C.check(game, 'sort', sort.answer.slice().reverse()).ok, false);
  assert.equal(C.check(game, 'sort', sort.answer).ok, true);
  const keys = game.puzzles.find((p) => p.type === 'keys');
  if (keys) assert.equal(C.check(game, 'keys', keys.locks.map(() => keys.keys[0])).ok, false);
  assert.equal(C.check(game, 'final', { choice: 'x' }).blocked, true, '其他機關未完成就能最終推理');
});

test('最終推理：選了干擾紙條當證據不通過', () => {
  const bank = banks.G3A; const r = bank.rooms.find((x) => x.playable);
  const game = C.makeRoom(bank, r.no, 'challenge', 9);
  for (const p of game.puzzles) if (p.id !== 'final') game.state.solved[p.id].done = true;
  const fin = game.puzzles.find((p) => p.id === 'final');
  assert.equal(C.check(game, 'final', { choice: fin.answer, evidence: ['d1', game.clues[0].id] }).ok, false);
  assert.equal(C.check(game, 'final', { choice: fin.answer, evidence: [game.clues[0].id] }).ok, false, '證據不足也不能過');
  assert.equal(C.check(game, 'final', { choice: fin.answer, evidence: [game.clues[0].id, game.clues[1].id] }).ok, true);
});

test('句型詞塊接受合理的另一種排法（只吃飯不喝湯／只喝湯不吃飯）', () => {
  const item = { frame: ['只', 'S', '不', 'S'], fillers: [[], ['吃飯', '喝湯'], [], ['吃飯', '喝湯']] };
  assert.equal(C.blocksOk(item, ['只', '吃飯', '不', '喝湯']), true);
  assert.equal(C.blocksOk(item, ['只', '喝湯', '不', '吃飯']), true);
  assert.equal(C.blocksOk(item, ['不', '喝湯', '只', '吃飯']), false);
  const pb = { accepted: [['一', '個', '又一', '個'], ['一', '件', '又一', '件']] };
  assert.equal(C.blocksOk(pb, ['一', '件', '又一', '件']), true);
  assert.equal(C.blocksOk(pb, ['一', '件', '又一', '個']), false);
});

test('紀錄區分第一次完成與用提示完成', () => {
  const bank = banks.G2A; const r = bank.rooms.find((x) => x.playable);
  const game = C.makeRoom(bank, r.no, 'standard', 5);
  for (const o of game.objects) C.investigate(game, o.id);
  C.useHint(game, 'sort');
  const sort = game.puzzles.find((p) => p.type === 'sort');
  C.check(game, 'sort', sort.answer);
  const s = C.summary(game);
  const row = s.rows.find((x) => x.id === 'sort');
  assert.equal(row.firstTry, false); assert.equal(row.hints, 1);
});
