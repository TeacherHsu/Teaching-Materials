const w=(ms)=>new Promise(r=>setTimeout(r,ms));
document.querySelector('.setup ~ .row .btn.primary, .row > .btn.primary').click(); await w(3000);
const a=[...document.querySelectorAll('.card:not(.b) .sym')], b=[...document.querySelectorAll('.card.b .sym')].map(x=>x.textContent);
const sh=a.filter(x=>b.includes(x.textContent)); sh[0]?.click(); await w(1500);
return [!!document.querySelector('canvas'), sh.length];
