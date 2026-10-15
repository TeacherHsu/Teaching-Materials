// 開始一局、進入密室、等 3D 載入，回報狀態（cdp.mjs 用）
const W = (ms) => new Promise((r) => setTimeout(r, ms));
[...document.querySelectorAll('button')].find((b) => b.textContent.includes('開始偵探')).click(); await W(300);
[...document.querySelectorAll('button')].find((b) => b.textContent.includes('進入密室')).click(); await W(6000);
const g = DT_DEBUG.game; DT_DEBUG.pick(g.objects[0].id); await W(300);
[...document.querySelectorAll('.qmask button')].find((b) => b.textContent.includes('知道了')).click(); await W(800);
return { canvas: !!document.querySelector('.dt-room canvas'), status: document.querySelector('.dt-status').textContent };
