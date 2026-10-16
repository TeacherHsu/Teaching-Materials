// 密室完整流程（Gate 4）：UI 開始→進入密室→點完所有搜查點（UI）→機關依原規則用 core 正解→UI 點出口大門逃出。
// ?qaStage=manual 停在搜查一半（截任務手冊）；預設跑到破案畫面。
try {
const W = (ms) => new Promise((r) => setTimeout(r, ms));
const stage = new URLSearchParams(location.search).get('qaStage') || 'finale';
const click = (t) => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes(t)); if (!b) throw Error('找不到按鈕：' + t); b.click(); };
click('開始偵探'); await W(300); click('進入密室'); await W(6000);
const game = DT_DEBUG.game, C = DetectiveCore;
const holders = game.objects;
const half = stage === 'manual' ? Math.ceil(holders.length / 2) : holders.length;
for (const o of holders.slice(0, half)) { DT_DEBUG.pick(o.id); await W(500); const ok = [...document.querySelectorAll('.qmask button')].find((b) => /知道了|收進|好/.test(b.textContent)); if (ok) ok.click(); await W(500); }
if (stage === 'manual') return JSON.stringify({ stage, found: game.state.found.length, side: document.querySelector('.dt-side')?.innerText.slice(0, 200) });
const perms = a => a.length <= 1 ? [a] : a.flatMap((x, i) => perms(a.filter((_, k) => k !== i)).map(r => [x, ...r]));
const combos = (a, n) => n === 0 ? [[]] : a.flatMap((x, i) => combos(a.slice(i + 1), n - 1).map(r => [x, ...r]));
for (const p of game.puzzles.filter(p => !['search', 'final'].includes(p.type))) {
  let answer;
  if (p.type === 'sort') answer = p.answer.slice();
  if (p.type === 'dial') answer = p.items.map(i => i.answer);
  if (p.type === 'keys') answer = p.locks.map(i => i.answer);
  if (p.type === 'blocks') answer = combos(p.blocks, p.need).flatMap(perms).find(a => C.blocksOk(p.item, a));
  if (['compare', 'cause'].includes(p.type)) answer = { choice: p.answer, evidence: p.evidence };
  const r = C.check(game, p.id, answer); if (!r.ok) throw Error('機關未能依原規則解開：' + p.id);
}
const f = game.puzzles.find(p => p.type === 'final');
const fa = f.cross ? f.pairs.map(x => x.answer) : { choice: f.answer, evidence: game.clues.map(c => c.id).slice(0, Math.max(f.needEvidence || 0, 1)) };
const fr = C.check(game, 'final', fa); if (!fr.ok) throw Error('最終推理未通過：' + JSON.stringify(fr.detail));
DT_DEBUG.pick('final'); await W(stage === 'finale-mid' ? 900 : 4000);
return JSON.stringify({ stage, escaped: game.state.escaped, solved: Object.values(game.state.solved).filter(s => s.done).length, total: game.puzzles.length, text: document.body.innerText.match(/案件破解[^\n]{0,40}|偵探徽章[^\n]{0,30}/g) });
} catch (e) { return 'ERR ' + e.message; }
