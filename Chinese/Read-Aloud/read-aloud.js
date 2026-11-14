// 朗讀遊戲共用核心：選課次 → 逐題「聽一聽、我來念」→ 評分 → 交給各模式演出。
// 兩個模式（寵物餵食 pet.js、朗讀打怪 monster.js）只負責舞台與動畫。
//
// 評分原則同課文樂園「念讀語詞」：不比聲調、同音字算對。
// 辨識器挑了哪個同音字不是學生的錯。
(function (root) {
  'use strict';

  const TONE = /[ˊˇˋ˙]/g;
  const HAN = /[㐀-鿿]/;
  const toneless = (z) => String(z || '').replace(TONE, '');

  // ---------- 評分（純函式，node 測試直接用） ----------
  function makeGrader(data) {
    const homo = data.homo || {};
    const near = data.near || {};
    // 1＝同字或同音字；0.5＝容易混淆的音；0＝不像
    function hit(target, heard, syl) {
      if (target === heard) return 1;
      const key = toneless(syl);
      if ((homo[key] || '').includes(heard)) return 1;
      if ((near[key] || '').includes(heard)) return 0.5;
      return 0;
    }
    function gradeText(target, syls, text) {
      const T = [...String(text || '')].filter((c) => HAN.test(c));
      const C = [...target];
      const n = C.length;
      if (!T.length) return 0;
      let best = 0;
      if (n === 1) {
        for (const t of T) best = Math.max(best, hit(C[0], t, syls[0]));
        return best === 1 ? 3 : best > 0 ? 2 : 1;
      }
      for (let s = -(n - 1); s < T.length; s += 1) {
        let m = 0;
        for (let i = 0; i < n; i += 1) if (T[s + i]) m += hit(C[i], T[s + i], syls[i]);
        best = Math.max(best, m);
      }
      return best >= n ? 3 : best >= n / 2 ? 2 : 1;
    }
    /** @returns {0|1|2|3} 0＝沒聽到字；1＝有開口；2＝很接近；3＝念對 */
    return function grade(item, alts) {
      let best = 0;
      for (const a of alts || []) {
        best = Math.max(best, gradeText(item.t, item.z, a));
        // 生字可以念成造詞（「樣子的樣」），整個造詞念對也算對
        if (item.ex && gradeText(item.ex, item.exz, a) === 3) best = 3;
      }
      return best;
    };
  }

  /** 把 n 題分成每組約 size 題（不留只有 1 題的尾巴）。回傳各組題數。 */
  function groupSizes(n, size) {
    if (n <= 0) return [];
    const k = Math.max(1, Math.round(n / size));
    const base = Math.floor(n / k);
    return Array.from({ length: k }, (_, i) => base + (i < n % k ? 1 : 0));
  }

  const pure = { makeGrader, groupSizes, toneless };
  if (typeof module !== 'undefined' && module.exports) { module.exports = pure; return; }

  // ====================== 以下是瀏覽器部分 ======================
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function shuffle(a) {
    const b = [...a];
    for (let i = b.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
    return b;
  }

  /** 國字＋右側直排注音。 */
  function zhuyinHtml(text, syls) {
    return [...text].map((ch, i) => {
      const s = (syls && syls[i]) || '';
      if (!s) return `<span class="zc"><span class="han">${esc(ch)}</span></span>`;
      const neutral = s.includes('˙');
      const tone = neutral ? '' : (s.match(/[ˊˇˋ]/) || [''])[0];
      return `<span class="zc"><span class="han">${esc(ch)}</span><span class="zy" aria-hidden="true">${
        neutral ? '<span class="zyd">˙</span>' : ''}<span class="zyb">${toneless(s)}</span>${
        tone ? `<span class="zyt">${tone}</span>` : ''}</span></span>`;
    }).join('');
  }

  // ---------- 音效 ----------
  let sfxOn = true;
  let actx = null;
  function beep(freqs, dur, type) {
    if (!sfxOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach((f, i) => {
        const o = actx.createOscillator(); const g = actx.createGain();
        const t0 = actx.currentTime + i * dur;
        o.type = type || 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.08, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + dur);
      });
    } catch (e) { /* 沒有音效不影響遊戲 */ }
  }

  // ---------- 特效 ----------
  function burst(x, y, colors, n, spread) {
    if (reduced()) return;
    const fx = $('fx');
    for (let k = 0; k < n; k += 1) {
      const el = document.createElement('div');
      el.className = 'spark';
      const sz = 8 + Math.random() * 10;
      el.style.cssText = `left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;background:${colors[k % colors.length]}`;
      fx.appendChild(el);
      const ang = Math.random() * Math.PI * 2;
      const dist = (spread || 90) * (0.4 + Math.random() * 0.9);
      el.animate([
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist - 20}px)) scale(.2)`, opacity: 0 },
      ], { duration: 550 + Math.random() * 350, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => el.remove();
    }
  }
  function popText(x, y, text) {
    const el = document.createElement('div');
    el.className = 'pop-txt'; el.textContent = text;
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    $('fx').appendChild(el);
    setTimeout(() => el.remove(), 900);
  }
  /** 從 from 元素丟一個 emoji 到 to 元素（拋物線）。減少動態時直接命中。 */
  function fly(emoji, fromEl, toEl, { arc = 110, dur = 520, spin = true } = {}) {
    return new Promise((resolve) => {
      const a = fromEl.getBoundingClientRect(); const b = toEl.getBoundingClientRect();
      const x1 = b.left + b.width / 2; const y1 = b.top + b.height / 2;
      if (reduced()) { resolve({ x: x1, y: y1 }); return; }
      const x0 = a.left + a.width * (0.35 + Math.random() * 0.3); const y0 = a.top + a.height * 0.3;
      const el = document.createElement('div');
      el.className = 'fly'; el.textContent = emoji;
      $('fx').appendChild(el);
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        el.style.left = `${x0 + (x1 - x0) * p}px`;
        el.style.top = `${y0 + (y1 - y0) * p - Math.sin(p * Math.PI) * arc}px`;
        el.style.transform = `translate(-50%,-50%) rotate(${spin ? p * 360 : 0}deg) scale(${1.1 - p * 0.25})`;
        if (p < 1) requestAnimationFrame(step); else { el.remove(); resolve({ x: x1, y: y1 }); }
      };
      requestAnimationFrame(step);
    });
  }
  let flashT;
  function flash(text) {
    const f = $('flash'); f.textContent = text; f.classList.add('show');
    clearTimeout(flashT); flashT = setTimeout(() => f.classList.remove('show'), 1500);
  }

  // ---------- 朗讀示範：只用台灣國語語音 ----------
  function twVoice() {
    const all = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    const tw = all.filter((v) => /^zh[-_]TW/i.test(v.lang));
    const nice = tw.find((v) => /natural|google|mei-?jia|美佳|yating|雅婷|hsiao|曉/i.test(v.name));
    return { voice: nice || tw[0] || null, loaded: all.length > 0 };
  }
  function speak(text, rate) {
    return new Promise((resolve) => {
      listener.stop();
      if (!window.speechSynthesis) { resolve(false); return; }
      const { voice, loaded } = twVoice();
      // 有語音清單卻沒有台灣國語：寧可不念，也不用其他腔調示範
      if (loaded && !voice) { $('voiceWarn').hidden = false; resolve(false); return; }
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-TW'; u.rate = rate || 0.8;
      if (voice) u.voice = voice;
      let done = false;
      const end = () => { if (!done) { done = true; resolve(true); } };
      u.onend = end; u.onerror = end;
      setTimeout(end, 6000);
      speechSynthesis.speak(u);
    });
  }
  const sayItem = (item) => speak(item.ex ? `${item.ex}的${item.t}` : item.t);

  // ---------- 收音 ----------
  // 有語音辨識就比對讀音；沒有（或連不上）就退成「有大聲念出來就算」。
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const listener = (() => {
    let srBroken = !SR;
    let rec = null; let stream = null; let meterT = null; let limitT = null; let on = false;
    let cb = {};
    function stop() {
      on = false;
      clearTimeout(limitT); clearInterval(meterT);
      if (rec) { try { rec.abort(); } catch (e) { /* 已結束 */ } rec = null; }
      if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
      if ($('meter')) $('meter').hidden = true;
      if (cb.onState) cb.onState(false);
    }
    function viaSR() {
      rec = new SR();
      rec.lang = 'zh-TW'; rec.interimResults = false; rec.maxAlternatives = 5; rec.continuous = false;
      let got = false;
      rec.onresult = (e) => {
        const alts = [...e.results[0]].map((a) => a.transcript || '').filter((t) => t.trim());
        if (!alts.length) return;
        got = true; const done = cb.onHeard; stop(); done(alts);
      };
      rec.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { const f = cb.onDenied; stop(); f(); }
        else if (e.error === 'network' || e.error === 'language-not-supported') { srBroken = true; rec = null; viaVolume(); }
      };
      rec.onend = () => { if (on && !got && rec) { const f = cb.onMiss; stop(); f(); } };
      try { rec.start(); } catch (err) { srBroken = true; rec = null; viaVolume(); }
    }
    async function viaVolume() {
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
      catch (err) { const f = cb.onDenied; stop(); f(); return; }
      if (!on) { stop(); return; }
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const an = actx.createAnalyser(); an.fftSize = 512;
      actx.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.fftSize);
      let loud = 0;
      $('meter').hidden = false;
      meterT = setInterval(() => {
        an.getByteTimeDomainData(buf);
        let sum = 0; for (const v of buf) sum += (v - 128) ** 2;
        const rms = Math.sqrt(sum / buf.length);
        $('meterBar').style.width = `${Math.min(100, rms * 4)}%`;
        if (rms > 7) loud += 1; else if (loud > 0 && loud < 4) loud = 0;
        if (loud >= 4) { const f = cb.onLoud; stop(); f(); }
      }, 80);
    }
    return {
      get active() { return on; },
      stop,
      start(callbacks) {
        cb = callbacks; on = true;
        if (window.speechSynthesis) speechSynthesis.cancel();
        cb.onState(true);
        if (!srBroken) viaSR(); else viaVolume();
        limitT = setTimeout(() => { if (on) { const f = cb.onMiss; stop(); f(); } }, 7000);
      },
    };
  })();

  // ---------- 遊戲流程 ----------
  const MAX_TRIES = 3;      // 一題最多念 3 次，第 3 次不論結果都過關，不讓學生卡住
  const FULL = 3;           // 一題最多拿 3 份（肉肉／傷害）

  function start(cfg) {
    const params = new URLSearchParams(location.search);
    const code = params.get('g') || cfg.defaultSet;
    const data = (window.READ_ALOUD_DATA || {})[code];
    if (!data) { document.body.innerHTML = '<p style="padding:24px;font-size:22px">找不到這一冊的題庫。</p>'; return; }
    const grade = makeGrader(data);
    const S = { tasks: [], cur: -1, busy: false, misses: 0, firsts: [], pick: { lesson: data.lessons[0].no, kind: 'chars' } };

    document.title = `${cfg.title}｜${data.label}第 ${data.from}～${data.to} 課`;
    $('back').href = `../../mandarin/#/grade/${data.grade}`;
    $('title').textContent = `${cfg.icon} ${cfg.title}`;
    $('introTitle').textContent = `${cfg.icon} ${cfg.title}`;
    $('introBody').innerHTML = cfg.introHtml;
    $('sfx').onclick = () => { sfxOn = !sfxOn; $('sfx').textContent = sfxOn ? '🔔 音效開' : '🔕 音效關'; };
    $('introSpeak').onclick = () => speak($('introBody').textContent.replace(/\s+/g, ' '), 0.9);

    // 選課次與內容
    const lessonBtns = data.lessons.map((L) => `<button type="button" class="pick" data-lesson="${L.no}">第 ${L.no} 課<small>${esc(L.title)}</small></button>`).join('')
      + `<button type="button" class="pick" data-lesson="0">大混合<small>${data.from}～${data.to} 課抽 ${cfg.mixCount} 題</small></button>`;
    $('pickLesson').innerHTML = lessonBtns;
    $('pickKind').innerHTML = '<button type="button" class="pick" data-kind="chars">生字</button><button type="button" class="pick" data-kind="words">語詞</button>';
    const paintPick = () => {
      document.querySelectorAll('#pickLesson .pick').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.lesson === S.pick.lesson)));
      document.querySelectorAll('#pickKind .pick').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kind === S.pick.kind)));
    };
    $('pickLesson').onclick = (e) => { const b = e.target.closest('.pick'); if (b) { S.pick.lesson = +b.dataset.lesson; paintPick(); } };
    $('pickKind').onclick = (e) => { const b = e.target.closest('.pick'); if (b) { S.pick.kind = b.dataset.kind; paintPick(); } };
    paintPick();

    function pickItems() {
      const { lesson, kind } = S.pick;
      if (lesson) return data.lessons.find((L) => L.no === lesson)[kind].map((it) => ({ ...it, lesson }));
      const all = data.lessons.flatMap((L) => L[kind].map((it) => ({ ...it, lesson: L.no })));
      const seen = new Set();
      return shuffle(all).filter((it) => !seen.has(it.t) && seen.add(it.t)).slice(0, cfg.mixCount);
    }

    const score100 = () => (S.firsts.length ? Math.round(S.firsts.reduce((a, b) => a + b, 0) * 100 / (S.firsts.length * FULL)) : 0);
    const paintScore = () => { $('score').textContent = `⭐ ${score100()} 分`; };

    function setButtons(html) { $('btns').innerHTML = html; }
    function waitButton(label) {
      return new Promise((resolve) => {
        setButtons(`<button type="button" class="btn btn-go" id="goBtn">${esc(label)}</button>`);
        $('goBtn').onclick = resolve; $('goBtn').focus();
      });
    }
    function feedback(html, tone) { const f = $('feedback'); f.innerHTML = html; f.dataset.tone = tone || ''; }

    function showTask(i) {
      listener.stop();
      S.cur = i; S.misses = 0;
      const t = S.tasks[i]; const it = t.item;
      $('wordBig').innerHTML = zhuyinHtml(it.t, it.z);
      $('wordBig').dataset.len = Math.min([...it.t].length, 4);
      $('wordEx').innerHTML = it.ex ? `造詞：${zhuyinHtml(it.ex, it.exz)}` : '';
      $('wordEx').hidden = !it.ex;
      setButtons('<button type="button" class="btn btn-listen" id="lis" aria-label="聽一聽">🔊 聽一聽</button>'
        + '<button type="button" class="btn btn-mic" id="mic">🎤 我來念</button>');
      $('lis').onclick = () => sayItem(it);
      $('mic').onclick = toggleMic;
      feedback(cfg.promptHtml || '先按 🔊 聽一次，再按 🎤 大聲念出來！');
      $('card').hidden = false;
      $('counter').textContent = t.phase === 'bonus' ? cfg.bonusLabel : `第 ${S.tasks.filter((x) => x.phase !== 'bonus').indexOf(t) + 1} 題／共 ${S.firsts.length} 題`;
      cfg.showTask(t, api);
      setTimeout(() => { if (S.cur === i && !S.busy) sayItem(it); }, 500);
    }

    function micState(listening) {
      const b = $('mic'); if (!b) return;
      b.classList.toggle('rec', listening);
      b.textContent = listening ? '👂 我在聽…（再按一次停止）' : '🎤 我來念';
    }
    function toggleMic() {
      if (S.busy) return;
      if (listener.active) { listener.stop(); return; }
      const it = S.tasks[S.cur].item;
      feedback(`🎤 請大聲念：<b>${esc(it.t)}</b>`, 'listen');
      listener.start({
        onState: micState,
        onHeard: (alts) => { const s = grade(it, alts); if (s === 0) missed(); else judge(s, alts[0]); },
        onLoud: () => judge(2, null),
        onMiss: missed,
        onDenied: () => { feedback('⚠️ 麥克風沒有打開。請按網址列旁邊的圖示「允許麥克風」，再按一次 🎤。', 'warn'); teacherPass(); },
      });
    }
    function missed() {
      S.misses += 1;
      feedback('🙉 沒聽到耶！靠近一點、大聲一點，再按 🎤 試一次。（這次不算）', 'warn');
      if (S.misses >= 2) teacherPass();
    }
    function teacherPass() {
      if ($('tPass')) return;
      const b = document.createElement('button');
      b.type = 'button'; b.id = 'tPass'; b.className = 'btn btn-sub'; b.textContent = '👩‍🏫 老師確認通過';
      b.onclick = () => judge(FULL, null, true);
      $('btns').appendChild(b);
    }

    async function judge(stars, heard, teacher) {
      if (S.busy || S.cur < 0) return;
      const t = S.tasks[S.cur]; const it = t.item;
      S.busy = true; S.misses = 0;
      t.tries += 1;
      if (t.tries === 1 && t.phase !== 'bonus') { S.firsts[t.index] = teacher ? 1 : stars; paintScore(); }
      const lastTry = t.tries >= MAX_TRIES;
      const gain = Math.min(FULL - t.got, teacher || lastTry ? FULL : stars);
      t.got += gain;
      const done = t.got >= FULL;
      const head = teacher ? '👩‍🏫 老師確認通過！' : stars === 3 ? '🌟 念得很清楚！' : stars === 2 ? '👍 很接近了！' : '🙂 有聽到你開口了！';
      feedback(`<span>${head}　${cfg.gainText(gain)}</span>${heard ? `<small>（聽到：${esc(heard)}）</small>` : ''}`, 'good');
      document.querySelectorAll('#btns .btn').forEach((b) => { b.disabled = true; });
      beep(stars === 3 ? [660, 880] : [520], 0.09, 'triangle');
      await cfg.onGain(t, gain, api);
      if (!done) {
        S.busy = false;
        document.querySelectorAll('#btns .btn').forEach((b) => { b.disabled = false; });
        $('feedback').insertAdjacentHTML('beforeend', `<div class="again">${cfg.againText(FULL - t.got)}　先聽一次，再念念看。</div>`);
        sayItem(it);
        return;
      }
      t.done = true;
      await cfg.onTaskDone(t, api);
      S.busy = false;
      next();
    }

    async function next() {
      const i = S.tasks.findIndex((t) => !t.done);
      if (i >= 0) { showTask(i); return; }
      // 主線念完：模式可以加碼（打怪的大魔王用最不熟的字）
      if (cfg.bonus && !S.bonusAdded) {
        S.bonusAdded = true;
        const main = S.tasks.slice();
        const picks = cfg.bonus(main.map((t) => ({ task: t, first: S.firsts[t.index] })));
        if (picks.length) {
          picks.forEach((t) => S.tasks.push({ item: t.item, index: t.index, phase: 'bonus', tries: 0, got: 0, done: false }));
          await cfg.onBonusStart(S.tasks.filter((t) => t.phase === 'bonus'), api);
          next();
          return;
        }
      }
      finish();
    }

    async function finish() {
      listener.stop(); S.cur = -1;
      $('card').hidden = true;
      beep([523, 659, 784, 1046, 1318], 0.12, 'sine');
      await cfg.onFinish(api);
      $('finScore').textContent = `你的分數：${score100()} 分`;
      $('finNote').textContent = cfg.finishText(S.tasks.filter((t) => t.phase !== 'bonus').length);
      $('finale').classList.add('show');
      $('again').focus();
    }

    function begin() {
      const items = pickItems();
      S.tasks = items.map((item, index) => ({ item, index, phase: 'main', tries: 0, got: 0, done: false }));
      S.firsts = items.map(() => 0); S.bonusAdded = false; S.cur = -1; S.busy = false;
      paintScore();
      $('intro').classList.remove('show'); $('finale').classList.remove('show');
      if (window.speechSynthesis) speechSynthesis.getVoices();
      cfg.setup(S.tasks, api);
      next();
    }
    $('startBtn').onclick = begin;
    $('again').onclick = () => { speechSynthesis && speechSynthesis.cancel(); $('finale').classList.remove('show'); $('intro').classList.add('show'); $('startBtn').focus(); };

    // 空白鍵＝開關麥克風（按鈕本身有焦點時交給瀏覽器，不重複觸發）
    addEventListener('keydown', (e) => {
      if (e.code !== 'Space' || e.target.closest('button, a, input')) return;
      if (document.querySelector('.overlay.show') || $('card').hidden) return;
      const b = $('mic'); if (b && !b.disabled) { e.preventDefault(); toggleMic(); }
    });

    const api = { $, sleep, reduced, burst, popText, fly, flash, beep, waitButton, feedback, zhuyinHtml, shuffle, groupSizes, FULL, state: S };
    // 測試與教師示範用：不經麥克風直接給分
    root.__readAloud = { S, judge, score100, begin, data };
    return api;
  }

  root.ReadAloud = { start, ...pure };
})(typeof window !== 'undefined' ? window : globalThis);
