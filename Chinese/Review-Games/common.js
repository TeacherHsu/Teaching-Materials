// 綜合複習遊戲共用引擎：載入題庫、設定面板、出題視窗（含逐步線索）、錯題再出、朗讀、投影與減少動態。
// 題庫由 tools/build_data.py 產生（data/G3A.js 等），網址用 ?g=G3A 指定年級。
(function () {
  const GRADES = { G3A: '三上', G4A: '四上', G6A: '六上' };
  const TYPES = {
    meaning: '語詞意思', zhuyin: '注音讀音', lookalike: '形似字', idiom: '成語',
    reading: '閱讀理解', gist: '課文大意',
  };
  // 支持程度只管選項數與嘗試次數；朗讀、計時另有獨立開關。
  const LEVELS = {
    support: { label: '支持', options: 3, tries: 3 },
    standard: { label: '標準', options: 4, tries: 2 },
    challenge: { label: '挑戰', options: 4, tries: 2 },
  };
  const QUESTION_NOTE = '支持：3 個選項、可試 3 次｜標準：4 個選項、可試 2 次｜挑戰：4 個選項、可試 2 次';
  const HINTS = {
    meaning: '把每個選項放進句子裡讀讀看，哪一個的意思最接近？',
    zhuyin: '先小聲念念看，再注意每個字的聲調符號。',
    lookalike: '想想這個詞的意思，哪個字的部首跟意思有關？',
    idiom: '先找出解釋裡最重要的詞，再看哪個成語的字跟它有關。',
    reading: (q) => `打開課本第${q.lesson}課，找找跟題目有關的那一段。`,
    gist: '想想每一課主要在講什麼人、什麼事。',
  };
  const TEAM_COLORS = ['#c0362c', '#1f5fa8', '#1f7a43', '#6b3fb0'];
  const TEAM_NAMES = ['第1隊', '第2隊', '第3隊', '第4隊'];

  const h = (tag, attrs = {}, kids = []) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of [].concat(kids)) if (kid != null) el.append(kid);
    return el;
  };
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  let voice = null;
  const pickVoice = () => {
    const vs = speechSynthesis.getVoices();
    voice = vs.find((v) => v.lang === 'zh-TW') || vs.find((v) => /zh[-_]TW|Hant/i.test(v.lang)) || null;
  };
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  const speak = (text) => {
    if (!('speechSynthesis' in window) || !text) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-TW'; u.rate = 0.9;
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  };
  const stopSpeak = () => { if ('speechSynthesis' in window) speechSynthesis.cancel(); };
  const speakBtn = (text, label = '朗讀') => h('button', { class: 'speak', type: 'button', 'aria-label': label, title: label, onclick: () => speak(text) }, '🔊');

  // 減少動態：系統設定或面板開關任一開啟即生效
  const calm = () => document.body.classList.contains('calm') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, calm() ? 0 : ms));

  const gradeKey = () => {
    const g = new URLSearchParams(location.search).get('g');
    return GRADES[g] ? g : 'G3A';
  };
  const loadBank = () => new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `data/${gradeKey()}.js`;
    s.onload = () => { applyDisplay(loadSaved()); resolve(window.REVIEW_BANK); };
    s.onerror = () => reject(new Error('題庫載入失敗'));
    document.head.appendChild(s);
  });

  const STORE = 'review-games-settings';
  const loadSaved = () => { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; } };
  const save = (s) => { try { localStorage.setItem(STORE, JSON.stringify({ ...loadSaved(), ...s })); } catch { /* 無痕模式 */ } };
  const applyDisplay = (s) => {
    document.body.classList.toggle('proj', !!s.proj);
    document.body.classList.toggle('calm', !!s.calm);
  };

  // 設定面板：課次、題型、支持程度、朗讀、計時、投影、減少動態。
  // levelNote：各遊戲自己的程度說明；types 為空表示此遊戲不出選擇題（不顯示題型與計時）。
  function setupPanel(bank, { types = Object.keys(TYPES), extra = [], levelNote = QUESTION_NOTE } = {}) {
    const saved = loadSaved();
    const settings = {
      lessons: new Set(saved.lessons || bank.lessons.map((l) => l.no)),
      types: new Set((saved.types || types).filter((t) => types.includes(t))),
      level: saved.level in LEVELS ? saved.level : 'standard',
      autoSpeak: saved.autoSpeak ?? false,
      timer: [0, 30, 60].includes(saved.timer) ? saved.timer : 0,
      proj: !!saved.proj,
      calm: !!saved.calm,
    };
    if (!settings.lessons.size) bank.lessons.forEach((l) => settings.lessons.add(l.no));
    if (!settings.types.size) types.forEach((t) => settings.types.add(t));
    const persist = () => {
      const s = { lessons: [...settings.lessons], level: settings.level, autoSpeak: settings.autoSpeak, timer: settings.timer, proj: settings.proj, calm: settings.calm };
      if (types.length) s.types = [...settings.types];
      save(s); applyDisplay(settings);
    };
    const chip = (label, checked, onchange) => h('label', { class: 'chip' }, [
      h('input', { type: 'checkbox', checked, onchange: (e) => { onchange(e.target.checked); persist(); } }), label]);
    const toggle = (set, v) => (on) => (on ? set.add(v) : set.delete(v));
    const select = (label, key, opts) => h('label', { class: 'row', style: 'gap:8px' }, [h('strong', {}, label),
      h('select', { onchange: (e) => { settings[key] = /^\d+$/.test(e.target.value) ? Number(e.target.value) : e.target.value; persist(); } },
        opts.map(([v, t]) => h('option', { value: v, selected: v === settings[key] }, t)))]);
    const el = h('section', { class: 'setup', 'aria-label': '遊戲設定' }, [
      h('h2', {}, '複習哪幾課？'),
      h('div', { class: 'chips' }, bank.lessons.map((l) => chip(`第${l.no}課 ${l.title}`, settings.lessons.has(l.no), toggle(settings.lessons, l.no)))),
      types.length > 1 ? h('h2', {}, '題目類型') : null,
      types.length > 1 ? h('div', { class: 'chips' }, types.map((t) => chip(TYPES[t], settings.types.has(t), toggle(settings.types, t)))) : null,
      h('div', { class: 'row' }, [select('支持程度', 'level', Object.entries(LEVELS).map(([k, v]) => [k, v.label])), h('span', { class: 'note' }, levelNote)]),
      h('div', { class: 'row' }, [
        chip('自動朗讀題目', settings.autoSpeak, (v) => { settings.autoSpeak = v; }),
        types.length ? select('作答時間', 'timer', [[0, '不限時'], [30, '30 秒'], [60, '60 秒']]) : null,
        chip('投影模式（字更大）', settings.proj, (v) => { settings.proj = v; }),
        chip('減少動態', settings.calm, (v) => { settings.calm = v; }),
      ]),
      ...extra,
    ]);
    return { el, settings };
  }

  // 題目牌堆：依設定篩選、洗牌依序抽；沒有獨立答對的題，隔 3 題後換選項順序再出一次。
  function makeDeck(bank, settings, filter = () => true) {
    let pile = []; let drawn = 0; const again = [];
    const pool = (pref) => bank.questions.filter((q) => settings.lessons.has(q.lesson) && settings.types.has(q.type) && filter(q) && (!pref || pref(q)));
    return {
      size: (pref) => pool(pref).length,
      draw(pref) {
        drawn++;
        const due = again.findIndex((a) => a.due <= drawn && (!pref || pref(a.q)));
        if (due >= 0) return again.splice(due, 1)[0].q;
        let i = pref ? pile.findIndex(pref) : 0;
        if (i < 0 || !pile.length) {
          // 這一課（或全部）的牌用完了：只補同條件的題，不默默換別課
          const fresh = shuffle(pool(pref));
          if (!fresh.length) return null;
          pile = pref ? fresh.concat(pile) : fresh;
          i = 0;
        }
        return pile.splice(i, 1)[0];
      },
      // 回報作答結果：非獨立答對的題排入再練
      report(q, r) {
        if (r && !r.independent && !again.some((a) => a.q === q)) again.push({ q, due: drawn + 3 });
      },
      pending: () => again.map((a) => a.q),
    };
  }

  // 本局學習紀錄（只存在記憶體，不存學生資料）
  const stats = { independent: 0, helped: 0, learned: 0 };
  const record = (r) => { if (r.independent) stats.independent++; else if (r.correct) stats.helped++; else stats.learned++; };
  const statsLine = () => `自己答對 ${stats.independent} 題｜看線索後答對 ${stats.helped} 題｜一起學過 ${stats.learned} 題`;

  // 出題視窗。回傳 Promise<{correct, independent, attempts, usedHint, revealed, timedOut}>。
  // 流程：選錯→標「這個不符合」→給一條線索→再試；用完次數或按「看答案」才揭曉並說明。
  function ask(q, settings, { title, deck } = {}) {
    const lv = LEVELS[settings.level];
    const wrong = q.options.filter((o) => o !== q.answer);
    const opts = shuffle([q.answer, ...shuffle(wrong).slice(0, lv.options - 1)]);
    const lessonTitle = (window.REVIEW_BANK.lessons.find((l) => l.no === q.lesson) || {}).title || '';
    const speakText = q.speak || q.stem;
    const hintText = typeof HINTS[q.type] === 'function' ? HINTS[q.type](q) : HINTS[q.type];
    const opener = document.activeElement;
    const app = document.getElementById('app');
    return new Promise((resolve) => {
      const res = { correct: false, independent: false, attempts: 0, usedHint: false, revealed: false, timedOut: false };
      let done = false; let timer = null; let left = 0;
      const stemId = `qstem-${Date.now()}`;
      const feed = h('div', { class: 'qfeed', role: 'status', 'aria-live': 'polite' });
      const tools = h('div', { class: 'qtools' });
      const foot = h('div', { class: 'qfoot' });
      const bar = settings.timer ? h('div', { class: 'qtimer', 'aria-hidden': 'true' }, h('i')) : null;
      const close = () => {
        clearInterval(timer); stopSpeak(); mask.remove();
        if (app) app.inert = false;
        record(res); if (deck) deck.report(q, res);
        if (opener && opener.isConnected) opener.focus();
        resolve(res);
      };
      const finish = (ok) => {
        if (done) return; done = true; clearInterval(timer);
        res.correct = ok; res.independent = ok && res.attempts === 1 && !res.usedHint && !res.timedOut;
        buttons.forEach((b) => { b.disabled = true; if (b.dataset.v === q.answer) b.classList.add('ok'); });
        tools.replaceChildren();
        const why = q.explain ? `「${q.explain}」` : '';
        feed.className = `qfeed ${ok ? 'ok' : 'learn'}`;
        feed.replaceChildren(
          h('div', {}, ok ? (res.independent ? '✓ 答對了！' : '✓ 用線索找到答案，很棒！') : `一起學：正確答案是「${q.answer}」`),
          ...(why ? [h('div', { class: 'qwhy' }, `完整的詞：${why}`)] : []));
        speak(ok ? '答對了' : `一起學，正確答案是，${q.type === 'zhuyin' ? '' : q.answer}`);
        const next = h('button', { class: 'btn primary', type: 'button', onclick: close }, '繼續');
        foot.replaceChildren(next); next.focus();
      };
      const showHint = (msg) => {
        res.usedHint = true;
        feed.className = 'qfeed hint';
        feed.replaceChildren(h('div', {}, msg || '再想想看！'), h('div', { class: 'qwhy' }, `💡 線索：${hintText}`));
        speak(`${msg || '再想想看'}。線索，${hintText}`);
      };
      const startTimer = (sec) => {
        clearInterval(timer);
        left = sec * 1000; const total = left; let last = Date.now();
        timer = setInterval(() => {
          const now = Date.now();
          if (!(('speechSynthesis' in window) && speechSynthesis.speaking)) left -= now - last; // 朗讀時暫停
          last = now;
          bar.firstChild.style.width = `${Math.max(0, left / total) * 100}%`;
          if (left <= 0) {
            clearInterval(timer); res.timedOut = true; bar.classList.add('hidden');
            showHint('時間到了，沒關係，我們一起找線索。');
            tools.replaceChildren(revealBtn);
          }
        }, 100);
      };
      const revealBtn = h('button', { class: 'btn', type: 'button', onclick: () => { res.revealed = true; finish(false); } }, '看答案');
      const buttons = opts.map((o) => h('button', {
        class: `qopt${q.type === 'zhuyin' ? ' zy' : ''}`, type: 'button', 'data-v': o,
        onclick: (e) => {
          if (done || e.currentTarget.disabled) return;
          res.attempts++;
          if (o === q.answer) return finish(true);
          const b = e.currentTarget;
          b.classList.add('bad'); b.disabled = true;
          b.append(h('span', { class: 'qno' }, '這個不符合'));
          if (res.attempts >= lv.tries || buttons.filter((x) => !x.disabled).length <= 1) return finish(false);
          showHint('再想想看，還可以再試一次！');
          tools.replaceChildren(revealBtn);
        },
      }, o));
      const optRow = (b) => q.noSpeakOptions || q.type === 'zhuyin' ? b
        : h('div', { class: 'qoptrow' }, [b, speakBtn(b.dataset.v, `朗讀選項：${b.dataset.v}`)]);
      const optsBox = h('div', { class: 'qopts' }, buttons.map(optRow));
      const head = [
        h('span', { class: 'qtag' }, `第${q.lesson}課 ${lessonTitle}｜${TYPES[q.type]}`),
        title ? h('div', { class: 'qtitle' }, title) : null,
        h('div', { class: 'qhead' }, [h('div', { class: 'qstem', id: stemId }, q.stem),
          h('div', { class: 'qspk' }, [speakBtn(speakText, '重聽題目'), h('button', { class: 'speak', type: 'button', 'aria-label': '停止朗讀', title: '停止朗讀', onclick: stopSpeak }, '⏹')])]),
      ];
      const mask = h('div', { class: 'qmask', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': stemId },
        h('div', { class: 'qbox' }, [...head, optsBox, bar, feed, tools, foot]));
      // 焦點圈限在題目視窗內
      mask.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        const f = [...mask.querySelectorAll('button:not([disabled])')];
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      });
      if (app) app.inert = true;
      document.body.append(mask);
      if (settings.autoSpeak) speak(speakText);
      if (settings.timer) {
        // 先讀題／聽題，按「我準備好了」才開始計時
        buttons.forEach((b) => { b.disabled = true; });
        const ready = h('button', { class: 'btn primary', type: 'button', onclick: () => {
          buttons.forEach((b) => { b.disabled = false; });
          tools.replaceChildren(h('button', { class: 'btn', type: 'button', onclick: () => { left += 30000; } }, '延長 30 秒'));
          startTimer(settings.timer); buttons[0].focus();
        } }, `我準備好了（${settings.timer} 秒）`);
        tools.replaceChildren(ready); ready.focus();
      } else buttons[0].focus();
    });
  }

  function header(bank, gameTitle) {
    const g = gradeKey();
    return h('div', { class: 'topbar' }, [
      h('a', { class: 'back', href: `./?g=${g}` }, '← 遊戲選單'),
      h('h1', {}, `${bank.grade}第1～6課｜${gameTitle}`),
    ]);
  }

  // 隊伍棋子：顏色＋編號，不只靠顏色辨識
  const token = (i, extraClass = '') => h('span', { class: `token ${extraClass}`, style: `background:${TEAM_COLORS[i]}`, title: TEAM_NAMES[i] }, String(i + 1));

  window.RG = { h, shuffle, speak, stopSpeak, speakBtn, sleep, calm, loadBank, setupPanel, makeDeck, ask, header, gradeKey, token, stats, statsLine, TYPES, LEVELS, TEAM_COLORS, TEAM_NAMES };
})();
