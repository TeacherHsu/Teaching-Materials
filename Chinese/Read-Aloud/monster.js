// 朗讀打怪：大聲念出來就是聲波，把偷走聲音的安靜怪趕跑；最後大魔王考最不熟的 3 題。
(function () {
  'use strict';
  const MONS = [['👾', '安靜怪'], ['👻', '悄悄鬼'], ['🦇', '摀耳蝙蝠'], ['🐙', '吸音章魚'], ['🤖', '靜音機器人'], ['🦖', '小聲龍']];
  const BOSS = ['🐲', '無聲大魔王'];
  let lv = 1; let bossTasks = [];

  let visualApi;
  const foeFile = (foe) => foe === BOSS ? 'boss' : 'mon-' + (MONS.indexOf(foe) + 1);
  const hearts = (n, max) => Array.from({ length: max }, (_, k) => `<span class="hp ${k < n ? 'full' : ''}">${k < n ? '💛' : '🤍'}</span>`).join('');
  function paintStrip(tasks, curTask) {
    const main = tasks.filter((t) => t.phase !== 'bonus');
    document.getElementById('strip').innerHTML = main.map((t) =>
      `<span class="slot ${t.done ? 'done' : ''} ${t === curTask ? 'cur' : ''}">${visualApi.art(t.done ? 'star' : foeFile(t.mon), t.done ? '⭐' : t.mon[0])}</span>`).join('')
      + (bossTasks.length ? `<span class="slot ${curTask && curTask.phase === 'bonus' ? 'cur' : ''} ${bossTasks.every((t) => t.done) ? 'done' : ''}">${visualApi.art(bossTasks.every((t) => t.done) ? 'star' : 'boss', bossTasks.every((t) => t.done) ? '🏆' : BOSS[0])}</span>` : '');
  }
  function heroPose(api, pose) {
    api.$('heroFace').innerHTML = api.art('hero-' + pose, '🦸', '聲波小勇士');
  }
  function mount(api, foe, cls) {
    api.$('stage').className = 'stage battle' + (cls ? ' boss-stage' : '');
    api.$('stage').innerHTML = `${api.backdrop('bg-forest')}<div class="bubble" id="bubble"></div>
      <div class="fighter" id="hero"><span class="face" id="heroFace">${api.art('hero-idle', '🦸', '聲波小勇士')}</span><span class="tag" id="heroTag">聲波小勇士 LV ${lv}</span></div>
      <div class="fighter ${cls || ''}" id="foe"><span class="face" id="foeFace">${api.art(foeFile(foe), foe[0], foe[1])}</span><span class="tag" id="foeTag"></span></div>
      <div class="cells" id="cells"></div>`;
  }
  function paintFoe(t, api) {
    if (t.phase === 'bonus') {
      const left = bossTasks.filter((x) => !x.done).length;
      api.$('foeTag').innerHTML = `${BOSS[1]} ${hearts(left, bossTasks.length)}`;
      api.$('foeFace').style.transform = `scale(${0.7 + 0.3 * (left / bossTasks.length)})`;
      api.$('bubble').textContent = `👑 ${BOSS[1]}：「這個字你一定不會念！」`;
      api.$('cells').innerHTML = '🔊 蓄力 ' + Array.from({ length: api.FULL }, (_, k) => `<span class="cell ${k < t.got ? 'on' : ''}"></span>`).join('');
    } else {
      api.$('foeTag').innerHTML = `${t.mon[1]} ${hearts(api.FULL - t.got, api.FULL)}`;
      api.$('bubble').textContent = `${t.mon[0]} ${t.mon[1]}把這個字的聲音偷走了！`;
      api.$('cells').innerHTML = '';
    }
  }
  function enter(api, boss = false) {
    if (api.reduced()) return Promise.resolve();
    if (boss) {
      const veil = document.createElement('div'); veil.className = 'boss-veil'; api.$('stage').appendChild(veil);
      api.motion(veil, [{ opacity: 0 }, { opacity: .22, offset: .4 }, { opacity: 0 }], 480).finally(() => veil.remove());
    }
    return api.motion(api.$('foe'), boss ? [
      { translate: '0 -180px', opacity: 0 }, { translate: '0 5px', opacity: 1, offset: .75 }, { translate: '0 0', opacity: 1 },
    ] : [
      { translate: '180px 0', opacity: 0 }, { translate: '0 -8px', opacity: 1, offset: .7 }, { translate: '0 0', opacity: 1 },
    ], 450);
  }
  function microphone(api) {
    const r = api.$('heroFace').getBoundingClientRect();
    return { x: r.left + r.width * .64, y: r.top + r.height * .36 };
  }
  async function hit(api, large = false) {
    const face = api.$('foeFace');
    api.impact(face, large); api.particles(face, 'star', large ? 12 : 6, large ? 100 : 65);
    api.floatLabel(face, '-1');
    api.motion(api.$('stage'), [{ translate: '0 0' }, { translate: '4px 0', offset: .25 }, { translate: '-4px 0', offset: .65 }, { translate: '0 0' }], 180);
    await api.motion(face.firstElementChild, [
      { transform: 'rotate(0) scale(1)', filter: 'brightness(1)' },
      { transform: 'rotate(12deg) scale(.84,1.1)', filter: 'brightness(1.8)', offset: .4 },
      { transform: 'rotate(0) scale(1)', filter: 'brightness(1)' },
    ], 160);
  }
  async function breakHeart(api, index) {
    const hp = api.$('foeTag').querySelectorAll('.hp')[index]; if (!hp) return;
    await api.motion(hp, [{ translate: '0 0', rotate: '0deg', opacity: 1 }, { translate: '18px -30px', rotate: '35deg', opacity: 0 }], 160);
    hp.textContent = '🤍'; hp.classList.remove('full');
  }

  window.ReadAloud.start({
    defaultSet: 'G2A2', title: '朗讀打怪', icon: '🔊', mixCount: 15, bonusLabel: '👑 大魔王關卡：最不熟的字',
    introHtml: `<p>糟糕！<b>安靜怪</b>把課本裡字的聲音都偷走了！</p>
      <p>你是<b>聲波小勇士</b>：把字<b>大聲念出來</b>，聲音就會變成聲波，把怪物趕跑。</p>
      <div class="rules">🔊 念對發出 3 道聲波，很接近 2 道，有開口 1 道。<br>💪 每趕跑一隻怪物，你就升一級！<br>👑 最後的大魔王，會考你<b>最不熟的 3 題</b>。<br>💛 念不好也不會輸，怪物只是閃開，再念一次就好。</div>`,
    gainText: (g) => `發出 ${g} 道聲波！`,
    againText: (r) => `再 ${r} 道聲波就成功了！`,
    finishText: (n) => `你念了 ${n} 題，升到 LV ${lv}，還打敗了${BOSS[1]}！`,
    setup(tasks, api) {
      visualApi = api;
      const order = api.shuffle(MONS);
      tasks.forEach((t, i) => { t.mon = order[i % order.length]; });
      lv = 1; bossTasks = [];
    },
    showTask(t, api) {
      if (t.phase === 'bonus') mount(api, BOSS, 'boss'); else mount(api, t.mon);
      paintFoe(t, api); paintStrip(api.state.tasks, t);
      enter(api, t.phase === 'bonus');
    },
    async onGain(t, gain, api) {
      const before = t.got - gain;
      for (let k = 0; k < gain; k += 1) {
        heroPose(api, 'shout');
        api.motion(api.$('heroFace'), [{ translate: '0 0' }, { translate: '6px 0', offset: .4 }, { translate: '0 0' }], 160);
        if (t.phase === 'bonus') {
          const cell = api.$('cells').querySelectorAll('.cell')[before + k];
          cell?.classList.add('on');
          await api.motion(cell, [{ scale: 1 }, { scale: 1.5, offset: .5 }, { scale: 1 }], 180);
        } else {
          await api.projectile('wave', '🔊', api.$('heroFace'), api.$('foeFace'), { duration: 250, large: k === gain - 1, source: microphone(api) });
          await Promise.all([hit(api, k === gain - 1), breakHeart(api, api.FULL - before - k - 1)]);
        }
        api.beep([300 + (before + k) * 90], .08, 'triangle');
      }
      heroPose(api, 'idle');
    },
    async onTaskDone(t, api) {
      const foe = api.$('foe');
      if (t.phase === 'bonus') {
        const left = bossTasks.filter((x) => !x.done).length;
        heroPose(api, 'shout');
        await api.projectile('wave', '🔊', api.$('heroFace'), api.$('foeFace'), { duration: 330, large: true, source: microphone(api) });
        await Promise.all([hit(api, true), breakHeart(api, left)]);
        api.beep([392, 523, 659], .1, 'sine');
        paintFoe(t, api);
        if (left === 0) {
          api.$('foeFace').innerHTML = api.art('boss-dizzy', BOSS[0], '頭暈的無聲大魔王');
          api.particles(foe, 'star', 14, 115); api.particles(foe, 'note', 10, 100);
          await api.visualSleep(200);
          await api.motion(foe, [{ opacity: 1 }, { opacity: 0 }], 400);
          foe.style.opacity = '0';
          api.$('bubble').textContent = '🏆 無聲大魔王被你打敗了！';
        } else api.$('bubble').textContent = `💥 大魔王中招！還剩 ${left} 招`;
        heroPose(api, 'idle'); paintStrip(api.state.tasks, t);
        return;
      }
      await api.motion(foe, [{ transform: 'translate(0,0) rotate(0) scale(1)', opacity: 1 }, { transform: 'translate(70px,-90px) rotate(300deg) scale(.1)', opacity: 0 }], 320);
      const source = api.$('foeFace');
      foe.style.visibility = 'hidden';
      const targetSlot = api.$('strip').querySelectorAll('.slot')[api.state.tasks.filter((x) => x.phase !== 'bonus').indexOf(t)];
      const rect = source.getBoundingClientRect();
      await api.projectile('star', '⭐', source, targetSlot || api.$('strip'), { arc: 40, duration: 300, source: { x: rect.left + rect.width / 2 + 70, y: rect.top + rect.height / 2 - 90 } });
      lv += 1; api.$('heroTag').textContent = `聲波小勇士 LV ${lv}`;
      api.beep([523, 659, 784], .09, 'sine');
      api.floatLabel(api.$('heroFace'), '⬆', 'level-arrow');
      await api.motion(api.$('hero'), [{ translate: '0 0' }, { translate: '0 -18px', offset: .5 }, { translate: '0 0' }], 280);
      paintStrip(api.state.tasks, t);
    },
    // 大魔王考第一次念得最不熟的 3 題（分數一樣時，照原本的順序）
    bonus: (rows) => rows.map((r, i) => ({ ...r, i })).sort((a, b) => a.first - b.first || a.i - b.i).slice(0, 3).map((r) => r.task),
    async onBonusStart(tasks, api) {
      bossTasks = tasks;
      mount(api, BOSS, 'boss');
      api.$('foeTag').innerHTML = `${BOSS[1]} ${hearts(tasks.length, tasks.length)}`;
      enter(api, true);
      api.$('bubble').textContent = `👑 ${BOSS[1]}出現了！`;
      paintStrip(api.state.tasks, null);
      api.$('wordBig').innerHTML = ''; api.$('wordEx').hidden = true; api.$('counter').textContent = '';
      api.feedback(`小怪物都被趕跑了！${BOSS[1]}要考你最不熟的 ${tasks.length} 題。`, 'good');
      api.beep([196, 185, 174], 0.18, 'sawtooth');
      await api.waitButton('挑戰大魔王 ▶');
    },
    async onFinish(api) {
      api.$('finStage').innerHTML = `<span class="photo-hero">${api.art('hero-cheer', '🦸', '聲波小勇士歡呼')}</span><span class="photo-trophy">🏆</span><span class="photo-star">${api.art('star', '⭐', '星星')}</span>`;
    },
  });
})();
