// 綜合複習遊戲共用引擎：載入題庫、設定面板、出題視窗、朗讀。
// 題庫由 tools/build_data.py 產生（data/G3A.js 等），網址用 ?g=G3A 指定年級。
(function () {
  const GRADES = { G3A: '三上', G4A: '四上', G6A: '六上' };
  const TYPES = {
    meaning: '語詞意思', zhuyin: '注音讀音', lookalike: '形似字', idiom: '成語',
    reading: '閱讀理解', gist: '課文大意',
  };
  const LEVELS = {
    support: { label: '支持', options: 3, retry: true, seconds: 0, autoSpeak: true },
    standard: { label: '標準', options: 4, retry: false, seconds: 0, autoSpeak: false },
    challenge: { label: '挑戰', options: 4, retry: false, seconds: 20, autoSpeak: false },
  };

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
  const speakBtn = (text) => h('button', { class: 'speak', type: 'button', 'aria-label': '朗讀', onclick: () => speak(text) }, '🔊');

  const gradeKey = () => {
    const g = new URLSearchParams(location.search).get('g');
    return GRADES[g] ? g : 'G3A';
  };
  const loadBank = () => new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `data/${gradeKey()}.js`;
    s.onload = () => resolve(window.REVIEW_BANK);
    s.onerror = () => reject(new Error('題庫載入失敗'));
    document.head.appendChild(s);
  });

  // 設定面板：課次、題型、支持程度。onChange 拿到 settings 物件。
  const STORE = 'review-games-settings';
  const loadSaved = () => { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; } };
  const save = (s) => { try { localStorage.setItem(STORE, JSON.stringify(s)); } catch { /* 無痕模式 */ } };

  function setupPanel(bank, { types = Object.keys(TYPES), extra = [] } = {}) {
    const saved = loadSaved();
    const settings = {
      lessons: new Set(saved.lessons || bank.lessons.map((l) => l.no)),
      types: new Set((saved.types || types).filter((t) => types.includes(t))),
      level: saved.level in LEVELS ? saved.level : 'standard',
    };
    if (!settings.lessons.size) bank.lessons.forEach((l) => settings.lessons.add(l.no));
    if (!settings.types.size) types.forEach((t) => settings.types.add(t));
    const persist = () => save({ lessons: [...settings.lessons], types: [...settings.types], level: settings.level });
    const chip = (label, checked, onchange) => h('label', { class: 'chip' }, [
      h('input', { type: 'checkbox', checked, onchange: (e) => { onchange(e.target.checked); persist(); } }), label]);
    const toggle = (set, v) => (on) => (on ? set.add(v) : set.delete(v));
    const levelSel = h('select', { 'aria-label': '支持程度', onchange: (e) => { settings.level = e.target.value; persist(); } },
      Object.entries(LEVELS).map(([k, v]) => h('option', { value: k, selected: k === settings.level }, v.label)));
    const el = h('section', { class: 'setup', 'aria-label': '遊戲設定' }, [
      h('h2', {}, '複習哪幾課？'),
      h('div', { class: 'chips' }, bank.lessons.map((l) => chip(`第${l.no}課 ${l.title}`, settings.lessons.has(l.no), toggle(settings.lessons, l.no)))),
      types.length > 1 ? h('h2', {}, '題目類型') : null,
      types.length > 1 ? h('div', { class: 'chips' }, types.map((t) => chip(TYPES[t], settings.types.has(t), toggle(settings.types, t)))) : null,
      h('div', { class: 'row' }, [h('strong', {}, '支持程度'), levelSel,
        h('span', { class: 'note' }, '支持：3 個選項、答錯可再試、自動朗讀｜標準：4 個選項｜挑戰：4 個選項、20 秒')]),
      ...extra,
    ]);
    return { el, settings };
  }

  // 題目牌堆：依設定篩選，洗牌後依序抽，抽完再洗。
  function makeDeck(bank, settings, filter = () => true) {
    let pile = [];
    const pool = () => bank.questions.filter((q) => settings.lessons.has(q.lesson) && settings.types.has(q.type) && filter(q));
    return {
      size: () => pool().length,
      draw(pref) {
        if (!pile.length) pile = shuffle(pool());
        if (!pile.length) return null;
        const i = pref ? pile.findIndex(pref) : -1;
        return pile.splice(i >= 0 ? i : 0, 1)[0];
      },
    };
  }

  // 出題視窗：回傳 Promise<boolean>（是否答對）。
  function ask(q, settings, { title } = {}) {
    const lv = LEVELS[settings.level];
    const wrong = q.options.filter((o) => o !== q.answer);
    const opts = shuffle([q.answer, ...shuffle(wrong).slice(0, lv.options - 1)]);
    const lessonTitle = (window.REVIEW_BANK.lessons.find((l) => l.no === q.lesson) || {}).title || '';
    const speakText = q.speak || q.stem;
    return new Promise((resolve) => {
      let tries = 0; let done = false; let timer = null;
      const feed = h('div', { class: 'qfeed', role: 'status', 'aria-live': 'polite' });
      const foot = h('div', { class: 'qfoot' });
      const bar = lv.seconds ? h('div', { class: 'qtimer' }, h('i')) : null;
      const finish = (ok) => {
        if (done) return; done = true; clearInterval(timer);
        buttons.forEach((b) => { b.disabled = true; if (b.dataset.v === q.answer) b.classList.add('ok'); });
        feed.className = `qfeed ${ok ? 'ok' : 'bad'}`;
        feed.textContent = ok ? '答對了！' : `正確答案是「${q.answer}」${q.explain ? `（${q.explain}）` : ''}`;
        speak(ok ? '答對了' : `正確答案是，${q.type === 'zhuyin' ? '' : q.answer}`);
        const next = h('button', { class: 'btn primary', type: 'button', onclick: () => { mask.remove(); resolve(ok); } }, '繼續');
        foot.append(next); next.focus();
      };
      const buttons = opts.map((o) => h('button', {
        class: `qopt${q.type === 'zhuyin' ? ' zy' : ''}`, type: 'button', 'data-v': o,
        onclick: (e) => {
          if (done) return;
          tries++;
          if (o === q.answer) return finish(true);
          e.currentTarget.classList.add('bad'); e.currentTarget.disabled = true;
          if (lv.retry && tries < 2) { feed.className = 'qfeed bad'; feed.textContent = '再想想看，還有一次機會！'; speak('再想想看'); return; }
          finish(false);
        },
      }, o));
      const mask = h('div', { class: 'qmask', role: 'dialog', 'aria-modal': 'true', 'aria-label': title || '回答問題' }, h('div', { class: 'qbox' }, [
        h('span', { class: 'qtag' }, `第${q.lesson}課 ${lessonTitle}｜${TYPES[q.type]}`),
        title ? h('div', { class: 'note', style: 'margin-top:6px' }, title) : null,
        h('div', { class: 'qhead' }, [h('div', { class: 'qstem' }, q.stem), speakBtn(speakText)]),
        h('div', { class: 'qopts' }, buttons.map((b) => q.noSpeakOptions || q.type === 'zhuyin' ? b
          : h('div', { style: 'display:flex;gap:6px;min-width:0' }, [b, speakBtn(b.dataset.v)]))),
        bar, feed, foot,
      ]));
      buttons.forEach((b) => { b.style.flex = '1'; });
      document.body.append(mask);
      buttons[0].focus();
      if (lv.autoSpeak) speak(speakText);
      if (lv.seconds) {
        const end = Date.now() + lv.seconds * 1000;
        timer = setInterval(() => {
          const left = Math.max(0, end - Date.now());
          bar.firstChild.style.width = `${(left / (lv.seconds * 1000)) * 100}%`;
          if (!left) finish(false);
        }, 100);
      }
    });
  }

  function header(bank, gameTitle) {
    const g = gradeKey();
    return h('div', { class: 'topbar' }, [
      h('a', { class: 'back', href: `./?g=${g}` }, '← 遊戲選單'),
      h('h1', {}, `${bank.grade}第1～6課｜${gameTitle}`),
    ]);
  }

  const TEAM_COLORS = ['#e05a4f', '#3b82c4', '#3fa45b', '#8b5cc8'];
  const TEAM_NAMES = ['紅隊', '藍隊', '綠隊', '紫隊'];

  window.RG = { h, shuffle, speak, speakBtn, loadBank, setupPanel, makeDeck, ask, header, gradeKey, TYPES, LEVELS, TEAM_COLORS, TEAM_NAMES };
})();
