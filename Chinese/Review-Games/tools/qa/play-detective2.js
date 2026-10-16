// 2.0 三幕案件：用 UI 走完〈水滾了〉並回傳推理句（cdp.mjs 用）
const W = (ms) => new Promise((r) => setTimeout(r, ms));
const B = (t, root = document) => [...root.querySelectorAll('button')].find((b) => b.textContent.includes(t) && !b.disabled);
const M = () => document.querySelector('.qmask'); const D = Detective2;
B('接受委託').click(); await W(200); B('前往案發現場').click(); await W(5000);
const g = D2_DEBUG.game;
for (const c of g.clues) { D2_DEBUG; document.querySelector(`.dt-mark[data-id="${c.id}"]`).click(); await W(150);
  if (M() && M().querySelector('.d2-torn')) { [...M().querySelectorAll('.d2-choices button')].find((b) => b.textContent === g.torn[c.id].answer).click(); await W(50); B('收進筆記本', M()).click(); } else if (M()) B('知道了', M()).click(); await W(100); }
if (location.search.includes('stop=1')) return 'act1';
document.querySelector('.dt-mark[data-id="timeline"]').click(); await W(150);
for (const c of g.clues) { [...M().querySelectorAll('.d2-pool button')].find((b) => b.textContent === c.text).click(); await W(20); }
B('掛好了', M()).click(); await W(80); B('第一幕完成', M()).click(); await W(100); B('前往證物桌').click(); await W(200);
for (const b of g.bags) { [...document.querySelectorAll('.d2-bag')].find((x) => x.textContent.startsWith(D.BAG_NAMES[b.type])).click(); await W(150);
  if (b.type === 'words') M().querySelectorAll('.d2-ev').forEach((row, i) => [...row.querySelectorAll('button')].find((x) => x.textContent === b.locks[i].answer).click());
  else if (b.type === 'sentence') { const right = b.item.accepted ? b.item.accepted[0] : b.item.rows.find((r) => [...r].sort().join() === [...b.blocks].sort().join()); for (const t of right) { [...M().querySelectorAll('.d2-pool button')].find((x) => x.textContent === t).click(); await W(20); } }
  else [...M().querySelectorAll('.dt-choice button')].find((x) => x.textContent === b.answer).click();
  B('檢查', M()).click(); await W(80); B('繼續', M()).click(); await W(150); }
for (const x of g.rounds) { [...document.querySelectorAll('.d2-bag')].find((b) => b.textContent.includes('證人對質') && !b.classList.contains('done')).click(); await W(150);
  M().querySelectorAll('.d2-w')[x.witnesses.findIndex((w) => w.lying)].click();
  if (x.evidence.length) [...M().querySelectorAll('.d2-ev .d2-card')].find((b) => b.textContent.endsWith(g.clues.find((c) => c.id === x.evidence[0]).text)).click();
  if (location.search.includes('stop=2')) return 'confront';
  B('檢查', M()).click(); await W(80); B('繼續', M()).click(); await W(150); }
B('前往推理黑板').click(); await W(150);
[...document.querySelectorAll('.d2-board .d2-card')].find((b) => b.textContent === g.claim.answer).click(); B('確定').click(); await W(150);
const st = document.querySelectorAll('.d2-board .step')[1]; [...st.querySelectorAll('.d2-card:not(.decoy)')].slice(0, g.L.claimEvidence).forEach((c) => c.click()); B('確定').click(); await W(150);
if (g.L.reasoning !== 'auto') { for (const c of D.reasoningCards(g)) { [...document.querySelectorAll('.d2-pool button')].find((b) => b.textContent === c.text).click(); await W(20); } if (location.search.includes('stop=3')) return 'reason'; B('完成推理').click(); }
await W(2500); return document.querySelector('.d2-sentence')?.textContent;
