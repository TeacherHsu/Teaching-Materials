// 寵物餵食：念對一題 → 投餵肉肉 → 能量滿了破蛋。
(function () {
  'use strict';
  const PETS = [['🐶', '小狗'], ['🐱', '小貓'], ['🐰', '小兔子'], ['🐹', '小倉鼠'], ['🐥', '小雞'], ['🐧', '小企鵝'],
    ['🦊', '小狐狸'], ['🐼', '小貓熊'], ['🐨', '無尾熊'], ['🐢', '小烏龜'], ['🦔', '小刺蝟'], ['🐸', '小青蛙']];
  const EGG = `<svg viewBox="0 0 120 150" aria-hidden="true">
    <defs><radialGradient id="eggFill" cx="38%" cy="28%" r="80%"><stop offset="0" stop-color="#fffdf5"/><stop offset="1" stop-color="#f1d8a6"/></radialGradient></defs>
    <path d="M60 6C92 6 112 60 112 94C112 126 90 146 60 146C30 146 8 126 8 94C8 60 28 6 60 6Z" fill="url(#eggFill)" stroke="#c9a66b" stroke-width="3"/>
    <circle cx="40" cy="104" r="7" fill="#f6c779" opacity=".7"/><circle cx="80" cy="60" r="9" fill="#f6c779" opacity=".7"/><circle cx="74" cy="116" r="5" fill="#f6c779" opacity=".7"/>
    <polyline class="crack c1" points="30,58 44,66 38,78 54,84 48,96"/>
    <polyline class="crack c2" points="92,74 78,82 86,94 70,100 76,112 64,118"/>
  </svg>`;
  let eggs = [];
  let cur = -1;

  function paintStrip() {
    document.getElementById('strip').innerHTML = eggs.map((e, i) =>
      `<span class="slot ${e.hatched ? 'done' : ''} ${i === cur ? 'cur' : ''}">${e.hatched ? e.pet[0] : '🥚'}</span>`).join('');
  }
  function paintEgg(api) {
    const e = eggs[cur]; const wrap = api.$('eggWrap');
    const r = e.shown / e.need;
    wrap.dataset.lv = e.hatched ? '' : r >= 2 / 3 ? '2' : r >= 1 / 3 ? '1' : '0';
    wrap.classList.toggle('wobble', !e.hatched);
    wrap.style.transform = `scale(${e.hatched ? 1.05 : 0.8 + r * 0.3})`;
    if (e.hatched && !wrap.querySelector('.pet')) wrap.innerHTML = `<span class="pet" role="img" aria-label="${e.pet[1]}">${e.pet[0]}</span>`;
    api.$('bubble').textContent = e.hatched ? `🎉 ${e.pet[1]}破蛋出生了！` : `🍖 肚子餓，想吃肉肉（${e.shown}／${e.need}）`;
    api.$('cells').innerHTML = '🍖 ' + Array.from({ length: e.need }, (_, k) => `<span class="cell ${k < e.shown ? 'on' : ''}"></span>`).join('');
  }
  function mountEgg(api) {
    api.$('stage').innerHTML = `<div class="bubble" id="bubble"></div><div class="egg-wrap" id="eggWrap">${eggs[cur].hatched ? '' : EGG}</div><div class="cells" id="cells"></div>`;
    paintEgg(api); paintStrip();
  }

  window.ReadAloud.start({
    defaultSet: 'G2A2', title: '寵物餵食', icon: '🥚', mixCount: 18,
    introHtml: `<p>孵化屋裡有好多<b>寵物蛋</b>，蛋裡的小寵物肚子餓了！</p>
      <p>你是今天的小小飼養員：把字<b>大聲念出來</b>，就能丟肉肉給牠吃。</p>
      <div class="rules">🍖 念對餵 3 個肉肉，很接近餵 2 個，有開口餵 1 個。<br>🥚 能量滿了，蛋就會<b>破掉</b>，小寵物出生！<br>💛 念不好也沒關係，再念一次就能繼續餵。</div>`,
    gainText: (g) => `餵出 ${g} 個 🍖！`,
    againText: (r) => `這一題再餵 ${r} 個肉肉就吃完了！`,
    finishText: (n) => `你念了 ${n} 題，孵出 ${eggs.length} 隻小寵物！`,
    setup(tasks, api) {
      const pets = api.shuffle(PETS); let k = 0;
      eggs = api.groupSizes(tasks.length, 3).map((size, i) => {
        tasks.slice(k, k + size).forEach((t) => { t.egg = i; }); k += size;
        return { need: size * api.FULL, shown: 0, hatched: false, pet: pets[i % pets.length] };
      });
      cur = -1; api.$('stage').hidden = false;
    },
    showTask(t, api) {
      if (t.egg !== cur) { cur = t.egg; mountEgg(api); }
    },
    async onGain(t, gain, api) {
      const e = eggs[t.egg]; const wrap = api.$('eggWrap');
      await Promise.all(Array.from({ length: gain }, async (_, k) => {
        await api.sleep(k * 280);
        const p = await api.fly('🍖', api.$('card'), wrap);
        e.shown = Math.min(e.need, e.shown + 1);
        wrap.classList.remove('squash'); void wrap.offsetWidth; wrap.classList.add('squash');
        api.burst(p.x, p.y, ['#ffd24d', '#fff4d9', '#f6c779', '#9be26a'], 10, 80);
        api.popText(p.x + (Math.random() - 0.5) * 40, p.y - 50, '🍖 +1');
        api.beep([340 + (e.shown / e.need) * 420], 0.08, 'triangle');
        paintEgg(api);
      }));
      await api.sleep(350);
    },
    async onTaskDone(t, api) {
      const e = eggs[t.egg];
      if (e.shown < e.need) return;
      e.hatched = true;
      const r = api.$('eggWrap').getBoundingClientRect();
      api.burst(r.left + r.width / 2, r.top + r.height / 2, ['#ffd24d', '#f6c779', '#7fe0c0', '#b79ae0', '#ffffff'], 34, 150);
      api.beep([523, 659, 784, 1046], 0.11, 'sine');
      api.flash(`🐣 ${e.pet[1]}破蛋出生！`);
      paintEgg(api); paintStrip();
      api.feedback(`🎉 吃飽飽，<b>${e.pet[1]}</b>破蛋出生了！`, 'good');
      const last = eggs.every((x) => x.hatched);
      await api.waitButton(last ? '🎉 全部破蛋！看寵物大合照' : '下一顆蛋 ▶');
    },
    async onFinish(api) {
      api.$('finStage').innerHTML = eggs.map((e, i) => `<span style="animation-delay:${(i * 0.12).toFixed(2)}s" role="img" aria-label="${e.pet[1]}">${e.pet[0]}</span>`).join('');
      if (!api.reduced()) for (let k = 0; k < 4; k += 1) {
        setTimeout(() => api.burst(innerWidth * (0.2 + Math.random() * 0.6), innerHeight * (0.25 + Math.random() * 0.4), ['#ffd24d', '#f6c779', '#7fe0c0', '#b79ae0', '#fff'], 28, 160), k * 420);
      }
      await api.sleep(600);
    },
  });
})();
