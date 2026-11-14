// 寵物餵食：念對一題 → 投餵肉肉 → 能量滿了破蛋。
(function () {
  'use strict';
  const PETS = [['🐶', '小狗'], ['🐱', '小貓'], ['🐰', '小兔子'], ['🐹', '小倉鼠'], ['🐥', '小雞'], ['🐧', '小企鵝'],
    ['🦊', '小狐狸'], ['🐼', '小貓熊'], ['🐨', '無尾熊'], ['🐢', '小烏龜'], ['🦔', '小刺蝟'], ['🐸', '小青蛙']];
  const PET_FILES = ['dog', 'cat', 'rabbit', 'hamster', 'chick', 'penguin', 'fox', 'panda', 'koala', 'turtle', 'hedgehog', 'frog'];
  const petFile = (pet) => 'pet-' + PET_FILES[PETS.indexOf(pet)];
  let visualApi;
  const petArt = (pet) => visualApi.art(petFile(pet), pet[0], pet[1]);
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
      `<span class="slot ${e.hatched ? 'done' : ''} ${i === cur ? 'cur' : ''}">${e.hatched ? petArt(e.pet) : visualApi.art('egg-0', EGG, '寵物蛋')}</span>`).join('');
  }
  function paintEgg(api) {
    const e = eggs[cur]; const wrap = api.$('eggWrap');
    const r = e.shown / e.need;
    wrap.dataset.lv = e.hatched ? '' : r >= 2 / 3 ? '2' : r >= 1 / 3 ? '1' : '0';
    wrap.classList.toggle('wobble', !e.hatched);
    wrap.style.setProperty('--glow', .12 + r * .65);
    wrap.style.transform = `scale(${e.hatched ? 1.05 : 0.8 + r * 0.3})`;
    if (e.hatched) wrap.innerHTML = `<span class="pet">${petArt(e.pet)}</span>`;
    else wrap.innerHTML = api.art('egg-' + wrap.dataset.lv, EGG, '寵物蛋', 'egg-art');
    api.$('bubble').textContent = e.hatched ? `🎉 ${e.pet[1]}破蛋出生了！` : `🍖 肚子餓，想吃肉肉（${e.shown}／${e.need}）`;
    api.$('cells').innerHTML = '🍖 ' + Array.from({ length: e.need }, (_, k) => `<span class="cell ${k < e.shown ? 'on' : ''}"></span>`).join('');
  }
  function mountEgg(api) {
    api.$('stage').className = 'stage hatchery';
    api.$('stage').innerHTML = `${api.backdrop('bg-hatchery')}<div class="bubble" id="bubble"></div><div class="egg-wrap" id="eggWrap">${eggs[cur].hatched ? '' : EGG}</div><div class="cells" id="cells"></div>`;
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
      visualApi = api;
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
      for (let k = 0; k < gain; k += 1) {
        await api.projectile('meat', '🍖', api.$('card'), wrap, { arc: 105, duration: 250 });
        const oldCrack = Math.floor(e.shown / e.need * 3);
        e.shown = Math.min(e.need, e.shown + 1);
        paintEgg(api);
        api.floatLabel(wrap, '+1');
        api.particles(wrap, 'heart', 4, 55); api.particles(wrap, 'crumb', 3, 45);
        api.beep([340 + (e.shown / e.need) * 420], .08, 'triangle');
        const cell = api.$('cells').querySelectorAll('.cell')[e.shown - 1];
        const bites = [api.motion(wrap.firstElementChild, [
          { transform: 'scale(1)' }, { transform: 'scale(1.16,.82)', offset: .35 }, { transform: 'scale(.95,1.08)', offset: .7 }, { transform: 'scale(1)' },
        ], 180), api.motion(cell, [{ transform: 'scale(1)' }, { transform: 'scale(1.5)', offset: .5 }, { transform: 'scale(1)' }], 180)];
        if (Math.floor(e.shown / e.need * 3) > oldCrack && e.shown < e.need) {
          api.particles(wrap, 'crumb', 5, 65);
          bites.push(api.motion(wrap, [{ rotate: '-3deg' }, { rotate: '3deg' }, { rotate: '0deg' }], 180));
        }
        await Promise.all(bites);
      }
    },
    async onTaskDone(t, api) {
      const e = eggs[t.egg]; const wrap = api.$('eggWrap');
      if (e.shown < e.need) return;
      if (!api.reduced()) {
        await api.motion(wrap, [{ rotate: '-4deg' }, { rotate: '4deg' }, { rotate: '-4deg' }, { rotate: '4deg' }, { rotate: '0deg' }], 220);
        const light = document.createElement('div'); light.className = 'hatch-light'; api.$('stage').appendChild(light);
        const flash = api.motion(light, [{ opacity: 0 }, { opacity: .9, offset: .35 }, { opacity: 0 }], 170).finally(() => light.remove());
        wrap.innerHTML = `<span class="shell shell-top">${api.art('shell-top', '🥚')}</span><span class="shell shell-bottom">${api.art('shell-bottom', '🥚')}</span>`;
        const shells = [...wrap.children].map((shell, i) => api.motion(shell, [
          { transform: 'translate(0,0) rotate(0)', opacity: 1 },
          { transform: `translate(${i ? 80 : -75}px,${i ? 55 : -90}px) rotate(${i ? 35 : -40}deg)`, opacity: 0 },
        ], 330));
        await Promise.all([flash, ...shells]);
      }
      e.hatched = true;
      paintEgg(api); paintStrip();
      api.beep([523, 659, 784, 1046], .11, 'sine');
      api.particles(wrap, 'star', 14, 112); api.impact(wrap, true);
      await api.motion(wrap.querySelector('.pet'), [{ transform: 'scale(.15)', opacity: 0 }, { transform: 'scale(1.12)', opacity: 1, offset: .7 }, { transform: 'scale(1)', opacity: 1 }], 300);
      await api.motion(wrap.querySelector('.pet'), [{ translate: '0 0' }, { translate: '0 -18px', offset: .25 }, { translate: '0 0', offset: .5 }, { translate: '0 -12px', offset: .75 }, { translate: '0 0' }], 580);
      api.feedback(`🎉 吃飽飽，<b>${e.pet[1]}</b>破蛋出生了！`, 'good');
      const last = eggs.every((x) => x.hatched);
      await api.waitButton(last ? '🎉 全部破蛋！看寵物大合照' : '下一顆蛋 ▶');
    },
    async onFinish(api) {
      api.$('finStage').innerHTML = eggs.map((e, i) => `<span class="photo-pet" style="--delay:${(i * .45 / Math.max(1, eggs.length - 1)).toFixed(3)}s">${petArt(e.pet)}</span>`).join('');
    },
  });
})();
