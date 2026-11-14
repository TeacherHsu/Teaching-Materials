// 朗讀打怪：大聲念出來就是聲波，把偷走聲音的安靜怪趕跑；最後大魔王考最不熟的 3 題。
(function () {
  'use strict';
  const MONS = [['👾', '安靜怪'], ['👻', '悄悄鬼'], ['🦇', '摀耳蝙蝠'], ['🐙', '吸音章魚'], ['🤖', '靜音機器人'], ['🦖', '小聲龍']];
  const BOSS = ['🐲', '無聲大魔王'];
  let lv = 1; let bossTasks = [];

  const hearts = (n, max) => '💛'.repeat(n) + '🤍'.repeat(Math.max(0, max - n));
  function paintStrip(tasks, curTask) {
    const main = tasks.filter((t) => t.phase !== 'bonus');
    document.getElementById('strip').innerHTML = main.map((t) =>
      `<span class="slot ${t.done ? 'done' : ''} ${t === curTask ? 'cur' : ''}">${t.done ? '⭐' : t.mon[0]}</span>`).join('')
      + (bossTasks.length ? `<span class="slot ${curTask && curTask.phase === 'bonus' ? 'cur' : ''} ${bossTasks.every((t) => t.done) ? 'done' : ''}">${bossTasks.every((t) => t.done) ? '🏆' : BOSS[0]}</span>` : '');
  }
  function mount(api, foe, cls) {
    api.$('stage').className = 'stage battle';
    api.$('stage').innerHTML = `<div class="bubble" id="bubble"></div>
      <div class="fighter" id="hero" style="transform:scale(${Math.min(1.15, 0.9 + lv * 0.02)})"><span class="face" role="img" aria-label="聲波小勇士">🦸</span><br><span class="tag" id="heroTag">聲波小勇士 LV ${lv}</span></div>
      <div class="fighter ${cls || ''}" id="foe"><span class="face" role="img" aria-label="${foe[1]}">${foe[0]}</span><br><span class="tag" id="foeTag"></span></div>
      <div class="cells" id="cells"></div>`;
  }
  function paintFoe(t, api) {
    if (t.phase === 'bonus') {
      const left = bossTasks.filter((x) => !x.done).length;
      api.$('foeTag').textContent = `${BOSS[1]} ${hearts(left, bossTasks.length)}`;
      api.$('foe').style.transform = `scale(${0.7 + 0.3 * (left / bossTasks.length)})`;
      api.$('bubble').textContent = `👑 ${BOSS[1]}：「這個字你一定不會念！」`;
      api.$('cells').innerHTML = '🔊 蓄力 ' + Array.from({ length: api.FULL }, (_, k) => `<span class="cell ${k < t.got ? 'on' : ''}"></span>`).join('');
    } else {
      api.$('foeTag').textContent = `${t.mon[1]} ${hearts(api.FULL - t.got, api.FULL)}`;
      api.$('bubble').textContent = `${t.mon[0]} ${t.mon[1]}把這個字的聲音偷走了！`;
      api.$('cells').innerHTML = '';
    }
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
      const order = api.shuffle(MONS);
      tasks.forEach((t, i) => { t.mon = order[i % order.length]; });
      lv = 1; bossTasks = [];
    },
    showTask(t, api) {
      if (t.phase === 'bonus') mount(api, BOSS, 'boss'); else mount(api, t.mon);
      paintFoe(t, api); paintStrip(api.state.tasks, t);
    },
    async onGain(t, gain, api) {
      const foe = api.$('foe');
      const before = t.got - gain;
      await Promise.all(Array.from({ length: gain }, async (_, k) => {
        await api.sleep(k * 300);
        const p = await api.fly('🔊', api.$('hero'), foe, { arc: 30, dur: 420, spin: false });
        foe.classList.remove('shake'); void foe.offsetWidth; foe.classList.add('shake');
        api.burst(p.x, p.y, ['#ffd24d', '#bfe3f2', '#ffffff', '#9be26a'], 9, 70);
        api.beep([300 + (before + k) * 90], 0.08, 'square');
        if (t.phase === 'bonus') {
          api.$('cells').querySelectorAll('.cell')[before + k]?.classList.add('on');
        } else {
          api.popText(p.x, p.y - 50, '💥');
          api.$('foeTag').textContent = `${t.mon[1]} ${hearts(api.FULL - (before + k + 1), api.FULL)}`;
        }
      }));
      await api.sleep(350);
    },
    async onTaskDone(t, api) {
      const foe = api.$('foe'); const r = foe.getBoundingClientRect();
      if (t.phase === 'bonus') {
        const left = bossTasks.filter((x) => !x.done).length;
        api.burst(r.left + r.width / 2, r.top + r.height / 2, ['#ffd24d', '#b79ae0', '#fff'], 26, 130);
        api.beep([392, 523, 659], 0.1, 'sine');
        paintFoe(t, api);
        if (left === 0) { foe.classList.add('gone'); api.flash(`🏆 ${BOSS[1]}被你打敗了！`); }
        else api.flash(`💥 ${BOSS[1]}中招！還剩 ${left} 招`);
        paintStrip(api.state.tasks, t);
        await api.sleep(1100);
        return;
      }
      foe.classList.add('gone'); lv += 1;
      api.burst(r.left + r.width / 2, r.top + r.height / 2, ['#ffd24d', '#7fe0c0', '#fff'], 22, 120);
      api.beep([523, 659, 784], 0.09, 'sine');
      api.$('heroTag').textContent = `聲波小勇士 LV ${lv}`;
      api.flash(`⭐ 趕跑${t.mon[1]}！升到 LV ${lv}`);
      paintStrip(api.state.tasks, t);
      await api.sleep(1000);
    },
    // 大魔王考第一次念得最不熟的 3 題（分數一樣時，照原本的順序）
    bonus: (rows) => rows.map((r, i) => ({ ...r, i })).sort((a, b) => a.first - b.first || a.i - b.i).slice(0, 3).map((r) => r.task),
    async onBonusStart(tasks, api) {
      bossTasks = tasks;
      mount(api, BOSS, 'boss');
      api.$('foeTag').textContent = `${BOSS[1]} ${hearts(tasks.length, tasks.length)}`;
      api.$('bubble').textContent = `👑 ${BOSS[1]}出現了！`;
      paintStrip(api.state.tasks, null);
      api.$('wordBig').innerHTML = ''; api.$('wordEx').hidden = true; api.$('counter').textContent = '';
      api.feedback(`小怪物都被趕跑了！${BOSS[1]}要考你最不熟的 ${tasks.length} 題。`, 'good');
      api.beep([196, 185, 174], 0.18, 'sawtooth');
      await api.waitButton('挑戰大魔王 ▶');
    },
    async onFinish(api) {
      api.$('finStage').innerHTML = '<span role="img" aria-label="聲波小勇士">🦸</span><span>🏆</span><span>⭐</span>';
      if (!api.reduced()) for (let k = 0; k < 4; k += 1) {
        setTimeout(() => api.burst(innerWidth * (0.2 + Math.random() * 0.6), innerHeight * (0.25 + Math.random() * 0.4), ['#ffd24d', '#7fe0c0', '#b79ae0', '#fff'], 28, 160), k * 420);
      }
      await api.sleep(600);
    },
  });
})();
