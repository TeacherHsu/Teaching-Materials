// 賓果對抗模式：2 隊輪流答對 4 題、1 題看答案，回報各格歸屬（cdp.mjs 用）
const W = (ms) => new Promise((r) => setTimeout(r, ms));
const sels = [...document.querySelectorAll('select')];
const mode = sels.find((s) => s.getAttribute('aria-label') === '模式'); mode.value = '2'; mode.dispatchEvent(new Event('change'));
sels.find((s) => s.getAttribute('aria-label') === '分隊玩法').value = 'versus';
[...document.querySelectorAll('button')].find((b) => b.textContent === '開始遊戲').click(); await W(3000);
for (let r = 0; r < 5; r++) {
  const m = document.getElementById('clue').textContent.match(/「(.+)」/)[1];
  const w = [...REVIEW_BANK.words, ...REVIEW_BANK.idioms].find((x) => (x.meaning || x.definition) === m);
  if (r === 4) [...document.querySelectorAll('.clue button')].find((b) => b.textContent === '看答案').click();
  else [...document.querySelectorAll('.bcell')].find((b) => b.textContent === (w.word || w.idiom)).click();
  await W(900);
  [...document.querySelectorAll('.clue button')].find((b) => b.textContent === '下一題')?.click(); await W(300);
}
await W(1200);
return { is3d: !!document.querySelector('.rg3d-bingo.is-3d'), cells: [...document.querySelectorAll('.bcell.team,.bcell.neutral')].map((b) => b.dataset.team || 'n') };
