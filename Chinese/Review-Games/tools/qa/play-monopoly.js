const w=(ms)=>new Promise(r=>setTimeout(r,ms));
document.querySelector('.setup ~ .row .btn.primary, .row > .btn.primary').click(); await w(2500);
for (let k=0;k<3;k++){ const b=[...document.querySelectorAll('button')].find(x=>x.textContent==='擲骰子'&&!x.disabled); if(!b) break; b.click(); for(let t=0;t<60;t++){ await w(200); const o=document.querySelector('.qopt:not([disabled])'); if(o){o.click(); await w(80);} const c=document.querySelector('.qfoot .btn, .rest .btn'); if(c) c.click(); if(!b.disabled) break; } }
await w(1500);
return [!!window.THREE, !!document.querySelector('canvas'), document.querySelector('.log')?.textContent];
