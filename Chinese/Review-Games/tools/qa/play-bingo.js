const w=(ms)=>new Promise(r=>setTimeout(r,ms));
document.querySelector('.setup ~ .row .btn.primary, .row > .btn.primary').click(); await w(3000);
const words=[...window.REVIEW_BANK.words];
for(let k=0;k<3;k++){ const clue=document.querySelector('#clue').textContent; const m=clue.match(/「(.*)」/); const it=words.find(x=>x.meaning===m[1]); const cell=[...document.querySelectorAll('.bcell')].find(c=>c.textContent.includes(it.word)); cell.click(); await w(900); document.querySelector('.acts .primary')?.click(); await w(400);} 
await w(1200); return [!!document.querySelector('canvas'), document.querySelectorAll('.bcell.on').length];
