/* 課文偵探密室 2.0：三幕畫面流程。邏輯在 detective2-core.js；第一幕與結尾沿用 detective3d.js 房間。
   開場委託 → 第一幕 案發現場（搜查、修復線索卡、時間線）→ 第二幕 證物桌（證物袋、證人對質）
   → 第三幕 推理黑板（主張、證據、理由）→ 結案報告。每幕結束自動存檔（本機）。 */
(function () {
  'use strict';
  const { h, speak, stopSpeak, gradeKey } = window.RG;
  const D = window.Detective2;
  const app = document.getElementById('app');
  const SKEY = 'rg-detective2-settings-v1';
  const saveKey = (n) => `rg-detective2-${gradeKey()}-L${n}`;
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (_) { return d; } };
  const store = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* 無痕模式 */ } };
  let bank, settings, game, room, modal;

  // ---------- 原創包裝：委託信（不是課文內容）與探長台詞 ----------
  const LETTERS = {
    event: (t) => `偵探社收到一封信：「我聽說〈${t}〉裡發生了一件事，可是大家說的都不一樣。到底發生了什麼？請偵探幫忙查清楚！」`,
    museum: (t) => `小博物館的館員來求救：「〈${t}〉的說明牌被弄亂了，參觀的人都看不懂。請偵探幫我們找回正確的說明！」`,
    poem: (t) => `天文台的詩句燈熄了：「〈${t}〉的每一句都像一顆星，排錯了，星座就亮不起來。請偵探幫忙！」`,
    court: (t) => `小法庭的書記官說：「〈${t}〉的作者提出了一個想法，可是記錄被打亂了。請偵探幫忙還原！」`,
  };
  const BOSS = '書蟲探長';
  const say = (t) => { if (settings.autoSpeak) speak(t); };
  const spk = (t, label = '朗讀') => h('button', { class: 'speak', type: 'button', 'aria-label': label, title: label, onclick: () => speak(t) }, '🔊');
  const boss = (text) => h('div', { class: 'd2-boss', role: 'status' }, [h('div', { class: 'd2-face', 'aria-hidden': 'true' }, '🐛'),
    h('div', { style: 'flex:1' }, [h('div', { class: 'who' }, `${BOSS}（遊戲角色）`), h('div', { class: 'say' }, text)]), spk(text, '朗讀探長的話')]);
  const title = () => (bank.rooms.find((r) => r.no === game.lesson) || {}).title || '';

  let actx;
  function tone(kind) {
    if (!settings.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      ({ ok: [523, 659, 784], bad: [330, 262], find: [880], open: [392, 523, 659, 784, 1046] }[kind] || [600]).forEach((f, i) => {
        const o = actx.createOscillator(); const g = actx.createGain(); const t = actx.currentTime + i * 0.11;
        o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.1, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.22);
      });
    } catch (_) { /* 無音效裝置 */ }
  }
  const persist = () => store(saveKey(game.lesson), game.state.finished ? null : D.save(game));

  function topbar() {
    return h('div', { class: 'topbar' }, [
      h('a', { class: 'back', href: `./?g=${gradeKey()}` }, '← 遊戲選單'),
      h('h1', {}, `課文偵探密室 2.0｜${game ? game.title : bank.grade}`),
      h('span', { class: 'qtag' }, '試玩版'),
    ]);
  }
  function header() {
    const act = game.state.finished ? 4 : game.state.act;
    return [topbar(),
      h('ol', { class: 'd2-acts', 'aria-label': '案件進度' }, ['第一幕 案發現場', '第二幕 證物桌', '第三幕 推理黑板', '結案'].map((t, i) => h('li', { class: i + 1 < act ? 'done' : i + 1 === act ? 'now' : '', 'aria-current': i + 1 === act ? 'step' : null }, t))),
      h('div', { class: 'd2-q' }, [h('span', { class: 'tag' }, '案件問題'), h('b', {}, game.question), spk(game.question, '朗讀案件問題')]),
      h('div', { class: 'dt-bar' }, [
        h('button', { class: 'btn', type: 'button', onclick: notebook }, '📓 偵探筆記本'),
        h('button', { class: 'btn', type: 'button', onclick: () => { persist(); setup(); } }, '💾 存檔，下次再玩'),
      ])];
  }

  // ---------- 設定 ----------
  function setup() {
    closeModal(); if (room) { room.dispose(); room = null; } stopSpeak(); game = null;
    const rooms = bank.rooms.filter((r) => r.acts);
    if (!rooms.some((r) => r.no === settings.lesson)) settings.lesson = (rooms.find((r) => r.no === 4) || rooms[0]).no;
    const lessonSel = h('div', { class: 'chips' }, bank.rooms.map((r) => h('label', { class: 'chip', title: r.acts ? '' : r.actGaps.join('；') }, [
      h('input', { type: 'radio', name: 'lesson', checked: settings.lesson === r.no, disabled: !r.acts, onchange: () => { settings.lesson = r.no; store(SKEY, settings); render(); } }),
      `第${r.no}課 ${r.title}`, load(saveKey(r.no), null) ? h('small', { class: 'note' }, ' 💾') : null, r.acts ? null : h('small', { class: 'note' }, '（待補）')])));
    const toggle = (k, t) => h('label', { class: 'chip' }, [h('input', { type: 'checkbox', checked: !!settings[k], onchange: (e) => { settings[k] = e.target.checked; store(SKEY, settings); document.body.classList.toggle('calm', !!settings.calm); } }), t]);
    const box = h('div', {});
    function render() {
      const saved = load(saveKey(settings.lesson), null);
      box.replaceChildren(saved
        ? h('div', { class: 'd2-saved' }, [`這一課有存檔（${D.LEVELS[saved.level].label}，第 ${saved.state.act} 幕）。 `,
          h('button', { class: 'btn primary', type: 'button', onclick: () => resume(saved) }, '▶ 接著玩'), ' ',
          h('button', { class: 'btn', type: 'button', onclick: () => { store(saveKey(settings.lesson), null); render(); } }, '重新開始')])
        : h('button', { class: 'btn primary', type: 'button', onclick: start }, '🕵️ 接受委託'));
    }
    app.replaceChildren(topbar(), h('div', { class: 'setup' }, [
      h('p', { class: 'note' }, '2.0 試玩版：一課是一個案件，分三幕——還原經過、找出說錯的證人、用證據說出真相。每幕結束自動存檔，可以下次接著玩。設計說明見 DETECTIVE-REDESIGN.md。'),
      h('h2', {}, '選一個案件（課次）'), lessonSel,
      h('h2', {}, '偵探等級'), h('div', { class: 'chips' }, Object.entries(D.LEVELS).map(([k, v]) => h('label', { class: 'chip' }, [
        h('input', { type: 'radio', name: 'lv', checked: settings.level === k, onchange: () => { settings.level = k; store(SKEY, settings); } }), `${v.label}（${v.role}）`]))),
      h('p', { class: 'note' }, '支持：一次一個目標、提示自動出現、推理句自動組好｜標準：三個證物袋、選兩張證據、自己排推理句｜挑戰：線索更多、兩輪對質、有可疑紙條。三級都不限時。'),
      h('div', { class: 'row' }, [toggle('autoSpeak', '自動朗讀'), toggle('sound', '音效'), toggle('calm', '減少動態（平面圖）')]),
      box,
      h('details', { class: 'note' }, [h('summary', {}, '教師資訊'), '題目全部取自課文樂園已審核資料：段落大意（線索卡）、形似字（修復線索卡）、語詞、句型、聆聽題（證物袋）、閱讀理解題與證據段落（證人對質）、主旨與核准的干擾敘述（推理黑板）。委託信、書蟲探長是遊戲包裝，不是課文內容。存檔只在這台裝置的瀏覽器，不記姓名。']),
    ]));
    render();
  }
  function start() { game = D.build(bank, settings.lesson, settings.level, Date.now() >>> 0); opening(); }
  function resume(saved) { game = D.load(bank, saved); route(); }
  function route() { if (game.state.finished) report(); else if (game.state.act === 1) act1(); else if (game.state.act === 2) act2(); else act3(); }

  // ---------- 開場 ----------
  function opening() {
    const letter = LETTERS[game.caseType](title());
    app.replaceChildren(...header(), h('div', { class: 'setup' }, [
      h('div', { class: 'dt-story' }, [h('span', { class: 'tag' }, '委託信（遊戲故事，不是課文內容）'), h('p', { class: 'dt-big' }, letter), spk(letter, '朗讀委託信')]),
      boss(`見習偵探，你好！我是${BOSS}。這個案件要回答上面紫色框的問題。我們分三幕辦案：先到現場還原經過，再到證物桌找出說錯的證人，最後在黑板前用證據說出真相。準備好了嗎？`),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: act1 }, '🔍 前往案發現場')),
    ]));
    say(letter);
  }

  // ---------- 第一幕：案發現場 ----------
  function act1() {
    if (room) { room.dispose(); room = null; }
    const s = game.state; const fixed = s.fixed.length; const total = game.clues.length;
    const searching = !D.searchDone(game);
    const tip = searching
      ? `點房間裡的 🔍，把 ${total} 張線索卡找回來（已修好 ${fixed} 張）。有些卡片破掉了，補對字才能讀。`
      : '線索卡都找齊了！到「案件布告欄」把它們排成事情發生的順序。';
    const roomHost = h('div', {}); const status = h('div', { class: 'dt-status', role: 'status' });
    const list = h('ul', { class: 'dt-list' });
    app.replaceChildren(...header(), boss(tip), h('div', { class: 'dt-layout' }, [roomHost, h('aside', { class: 'dt-side' }, [h('h2', {}, '現場清單'), list])]));
    const objects = [...game.clues.map((c) => ({ id: c.id, holds: c.id, role: 'clue' })), ...game.decoys.map((d) => ({ id: d.id, holds: d.id, role: 'decoy' }))];
    const stations = [{ id: 'timeline', type: 'sort' }];
    room = window.Detective3D.mount(roomHost, { theme: game.theme, objects: D.shuffle(objects, D.rng(game.seed)), puzzles: stations, onPick: pick1, onStatus: (t) => { status.textContent = t; }, force2d: !!settings.calm });
    roomHost.append(status);
    room.applyVisualState({ done: s.rec.timeline.done ? ['sort'] : [], found: s.found, escaped: false });
    const items = [];
    objects.forEach((o, i) => {
      const got = s.found.includes(o.id) && (o.role === 'decoy' || s.fixed.includes(o.id));
      room.setState(o.id, got ? 'found' : game.L.autoHint ? 'next' : 'open', got ? '已調查' : '還沒調查');
    });
    room.setState('timeline', searching ? 'locked' : s.rec.timeline.done ? 'done' : 'next', searching ? '線索還沒找齊' : '可以排時間線');
    items.push(h('li', {}, h('button', { type: 'button', class: searching ? 'next' : 'done', onclick: notebook }, `${searching ? '🔍' : '✓'} 找回線索卡（${fixed}/${total}）`)));
    items.push(h('li', {}, h('button', { type: 'button', class: searching ? '' : 'next', disabled: searching, onclick: () => pick1('timeline') }, `${searching ? '🔒' : '▶'} 案件布告欄：排時間線`)));
    list.replaceChildren(...items);
    say(tip);
  }
  function pick1(id) {
    if (id === 'timeline') return D.searchDone(game) ? timelineModal() : message('🔒 還不能排', boss('線索卡還沒全部找回來，先把房間裡的 🔍 都調查一遍。'));
    const r = D.investigate(game, id);
    tone('find'); if (room) room.animate('found', id);
    if (r.decoy) { message('📝 一張可疑紙條', [h('div', { class: 'd2-card decoy' }, r.decoy.text), boss('這張紙條沒有被證實，先收進筆記本。最後推理時要小心，不一定可信喔。')]); return act1(); }
    if (r.torn && !game.state.fixed.includes(id)) return tornModal(r.clue, r.torn);
    message('🔍 找到線索卡', [h('div', { class: 'd2-card' }, r.clue.text), spk(r.clue.text)]);
    persist(); act1();
  }
  function tornModal(clue, t) {
    const feed = h('div', { class: 'dt-feed', role: 'status' });
    const ask = t.kind === 'char' ? `卡片的下半部有一個字看不清楚：「${t.blank}」要填哪一個字？` : `卡片下半部寫著一個語詞的意思：「${t.meaning}」是哪一個語詞？`;
    const id = `frag-${clue.id}`;
    const btns = t.choices.map((c) => h('button', { type: 'button', onclick: (e) => {
      const res = D.fixFragment(game, clue.id, c);
      if (res.ok) { tone('ok'); done('✓ 補對了！線索卡修好了。'); }
      else if (res.learned) done(`一起學：答案是「${t.answer}」（${t.kind === 'char' ? t.word : t.meaning}）。線索卡修好了。`);
      else { tone('bad'); e.currentTarget.classList.add('bad'); feed.className = 'dt-feed bad'; feed.textContent = res.tries === 1 ? '再看一次：把整個語詞小聲念一遍，想想它的意思。' : `${BOSS}：比較這幾個字的部件，哪個和語詞的意思有關？`; if (res.tries === 2) D.hint(game, id); }
    } }, c));
    const top = h('div', { class: 'top blur' }, clue.text);
    function done(msg) {
      top.classList.remove('blur'); feed.className = 'dt-feed ok'; feed.textContent = msg; btns.forEach((b) => { b.disabled = true; });
      actions.replaceChildren(spk(clue.text, '朗讀線索'), h('button', { class: 'btn primary', type: 'button', onclick: () => { closeModal(); persist(); act1(); } }, '收進筆記本'));
    }
    const actions = h('div', { class: 'dt-actions' });
    frame('🧩 破掉的線索卡', [h('div', { class: 'd2-torn' }, [top, h('div', { class: 'bottom' }, [h('p', {}, ask), h('div', { class: `d2-choices${t.kind === 'char' ? '' : ' words'}` }, btns)])]),
      h('p', { class: 'note' }, '補對字，上面的線索才會變清楚。'), feed, actions]);
    say(ask);
  }
  // 時間線：點卡片依序掛上去，點已掛上的卡片可以拿回來
  function orderer(cards, labels, { onChange } = {}) {
    const val = labels.map(() => null);
    const pool = h('div', { class: 'd2-pool' }); const line = h('div', { class: 'd2-line' });
    function draw() {
      pool.replaceChildren(...cards.filter((c) => !val.includes(c.id)).map((c) => h('button', { type: 'button', onclick: () => { const k = val.indexOf(null); if (k >= 0) { val[k] = c.id; draw(); } } }, c.text)));
      line.replaceChildren(...labels.map((lab, k) => {
        const c = cards.find((x) => x.id === val[k]);
        return h('div', { class: 'slot', role: 'button', tabindex: 0, onclick: () => { val[k] = null; draw(); } }, [h('span', { class: 'n' }, lab), c ? c.text : h('span', { class: 'note' }, '（點上面的卡片放到這裡）')]);
      }));
      if (onChange) onChange();
    }
    draw();
    return { el: h('div', { class: 'd2-ev' }, [h('p', { class: 'note' }, '點卡片會依序放進空格；點放好的卡片可以拿回來。'), pool, line]), value: () => val, full: () => val.every(Boolean), mark: (k) => line.querySelectorAll('.slot').forEach((s, i) => s.classList.toggle('bad', i === k)) };
  }
  function timelineModal() {
    const blocks = [...new Set(game.clues.map((c) => c.block).filter(Boolean))];
    const multi = game.strands.length > 1;
    // 一課兩篇：每一篇一條時間線，各排各的
    const lines = game.strands.map((ids) => {
      const cs = ids.map((id) => game.clues.find((c) => c.id === id));
      return orderer(D.shuffle(cs, Math.random).map((c) => ({ id: c.id, text: c.text })), cs.map((_, k) => (k === 0 ? '最先' : k === cs.length - 1 ? '最後' : `第${k + 1}`)));
    });
    const feed = h('div', { class: 'dt-feed', role: 'status' });
    const hintBox = h('div', { class: 'dt-hint hidden' });
    const first = game.strands.map((ids) => game.clues.find((c) => c.id === ids[0]).text);
    const hints = [multi ? '這一課有兩篇，每一篇各排一條。先找每一篇「一開始」的那一張。' : '先找「故事一開始」的那一張：誰、在哪裡？',
      blocks.length > 1 ? `課文結構是：${blocks.join(' → ')}。比較兩張卡，哪件事要先發生？` : '比較兩張卡：哪件事發生了，另一件事才會發生？',
      multi ? first.map((t, k) => `第${k + 1}篇最先的是「${t}」`).join('；') : `最先的是：「${first[0]}」`];
    const showHint = (n) => { hintBox.classList.remove('hidden'); hintBox.replaceChildren(...hints.slice(0, n).map((t, i) => h('div', {}, `💡 ${BOSS}提示 ${i + 1}：${t}`))); };
    if (game.L.autoHint) showHint(1);
    const actions = h('div', { class: 'dt-actions' }, [
      h('button', { class: 'btn', type: 'button', onclick: () => showHint(D.hint(game, 'timeline')) }, '💡 提示'),
      h('button', { class: 'btn primary', type: 'button', onclick: () => {
        if (!lines.every((l) => l.full())) { feed.textContent = '還有空格沒有放卡片。'; return; }
        const res = D.placeTimeline(game, lines.map((l) => l.value()));
        if (res.ok || res.learned) {
          tone(res.ok ? 'open' : 'ok'); feed.className = 'dt-feed ok';
          feed.textContent = res.ok ? '✓ 時間線完成！得到證物「時間線」。' : '一起學：正確的順序請看筆記本的時間線。得到證物「時間線」。';
          if (room) room.applyVisualState({ done: ['sort'], found: game.state.found, escaped: false });
          persist();
          actions.replaceChildren(h('button', { class: 'btn primary', type: 'button', onclick: () => { closeModal(); interlude(1); } }, '第一幕完成 ▶'));
        } else {
          tone('bad'); lines.forEach((l, k) => l.mark(res.wrong && res.wrong.strand === k ? res.wrong.at : -1));
          feed.className = 'dt-feed bad';
          const where = res.wrongAt === 0 ? '最先' : `第${res.wrongAt + 1}`;
          feed.textContent = `${multi ? `第${res.wrong.strand + 1}篇` : ''}從「${where}」這一格開始不對。再讀一次卡片。`;
          showHint(Math.min(3, res.tries));
        }
      } }, '📌 掛好了，檢查'),
    ]);
    const body = lines.map((l, k) => (multi ? h('div', {}, [h('h3', {}, `第${k + 1}篇`), l.el]) : l.el));
    frame('📌 案件布告欄：排時間線', [boss(multi ? '這一課有兩篇。把每一篇的線索卡各自排成順序，最上面是最先的。' : '把線索卡排成事情發生的順序，最上面是最先發生的事。'), hintBox, ...body, feed, actions]);
  }
  function interlude(n) {
    if (room) { room.dispose(); room = null; }
    const msg = n === 1 ? '太好了！經過已經還原。現在帶著線索到證物桌，三個證物袋裡藏著關鍵證據。' : '證人說錯的話都被揭穿了！最後到推理黑板，用證據說出真相。';
    app.replaceChildren(...header(), boss(msg), h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: n === 1 ? act2 : act3 }, n === 1 ? '前往證物桌 ▶' : '前往推理黑板 ▶')));
    say(msg);
  }

  // ---------- 第二幕：證物桌 ----------
  function act2() {
    const s = game.state; const bagsDone = D.bagsDone(game);
    const next = game.bags.find((b) => !s.rec[b.id].done);
    const tip = bagsDone ? '證物袋都打開了！看看兩位證人說的話，誰說錯了？還要拿出證物證明喔。' : `打開證物袋，取得關鍵證據。${game.L.oneAtATime ? '先開發亮的那一袋。' : '可以照你喜歡的順序開。'}`;
    const bagBtns = game.bags.map((b) => {
      const done = s.rec[b.id].done; const locked = game.L.oneAtATime && !done && b !== next;
      return h('button', { type: 'button', class: `d2-bag${done ? ' done' : ''}${b === next ? ' next' : ''}`, disabled: locked, onclick: () => bagModal(b) },
        [D.BAG_NAMES[b.type], h('small', {}, done ? '✓ 已打開' : locked ? '🔒 等一下再開' : '點我打開')]);
    });
    const rounds = game.rounds.map((x, i) => {
      const done = s.rec[x.id].done;
      return h('button', { type: 'button', class: `d2-bag${done ? ' done' : bagsDone ? ' next' : ''}`, disabled: !bagsDone, onclick: () => confrontModal(x) }, [`⚖️ 證人對質 ${game.rounds.length > 1 ? i + 1 : ''}`, h('small', {}, done ? '✓ 已揭穿' : bagsDone ? '點我開始' : '🔒 先打開證物袋')]);
    });
    app.replaceChildren(...header(), boss(tip), h('div', { class: 'd2-table' }, [h('h2', {}, '證物袋'), h('div', { class: 'd2-bags' }, bagBtns), h('h2', {}, '對質室'), h('div', { class: 'd2-bags' }, rounds)]));
    say(tip);
  }
  function stepModal(titleText, intro, id, body, getAnswer, check, hints, onWrong) {
    const feed = h('div', { class: 'dt-feed', role: 'status' }); const hintBox = h('div', { class: 'dt-hint hidden' });
    const showHint = (n) => { hintBox.classList.remove('hidden'); hintBox.replaceChildren(...hints.slice(0, n).map((t, i) => h('div', {}, `💡 ${BOSS}提示 ${i + 1}：${t}`))); };
    if (game.L.autoHint) showHint(1);
    const actions = h('div', { class: 'dt-actions' });
    const submit = h('button', { class: 'btn primary', type: 'button', onclick: () => {
      const ans = getAnswer(); if (ans == null) { feed.className = 'dt-feed bad'; feed.textContent = '還沒完成喔：有空格沒放好或還沒選。'; return; }
      const res = check(ans);
      if (res.ok || res.learned) { tone('ok'); feed.className = 'dt-feed ok'; feed.textContent = res.ok ? '✓ 解開了！' : `一起學：${res.teach || '我們一起看正確答案。'}`; persist(); actions.replaceChildren(h('button', { class: 'btn primary', type: 'button', onclick: () => { closeModal(); route2(); } }, '繼續')); }
      else { tone('bad'); feed.className = 'dt-feed bad'; feed.textContent = onWrong(res); showHint(Math.min(3, res.tries + (game.L.autoHint ? 1 : 0))); }
    } }, '🔓 檢查');
    actions.append(h('button', { class: 'btn', type: 'button', onclick: () => showHint(D.hint(game, id)) }, '💡 提示'), submit);
    frame(titleText, [boss(intro), hintBox, ...body, feed, actions]);
    say(intro);
  }
  function route2() { if (game.state.act >= 3) interlude(2); else act2(); }
  function bagModal(b) {
    if (game.state.rec[b.id].done) return message(`${D.BAG_NAMES[b.type]}（已打開）`, rewardView(b));
    if (b.type === 'words') {
      const pick = b.locks.map(() => null);
      const rows = b.locks.map((l, i) => h('div', { class: 'd2-ev' }, [h('div', { class: 'd2-card' }, `🔒 ${l.meaning}`),
        h('div', { class: 'd2-choices words' }, b.keys.map((k) => h('button', { type: 'button', 'aria-pressed': 'false', onclick: (e) => { pick[i] = k; e.currentTarget.parentNode.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === e.currentTarget))); } }, k)))]));
      stepModal(D.BAG_NAMES[b.type], '每個鎖上寫著一個意思，選出意思相符的語詞，密碼就對了。', b.id, rows, () => (pick.every(Boolean) ? pick : null),
        (a) => Object.assign(D.openBag(game, b.id, a), { teach: b.locks.map((l) => `${l.answer}＝${l.meaning}`).join('；') }),
        ['先讀鎖上的意思，再看哪個語詞最接近。', '先選最有把握的，剩下的再比較。', `「${b.locks[0].meaning}」是「${b.locks[0].answer}」。`],
        (r) => `有 ${r.detail.bad.filter(Boolean).length} 個鎖還打不開，再讀一次意思。`);
    } else if (b.type === 'sentence') {
      const ord = orderer(b.blocks.map((t, i) => ({ id: String(i), text: t })), b.blocks.map((_, k) => `${k + 1}`));
      const val = () => (ord.full() ? ord.value().map((i) => b.blocks[Number(i)]) : null);
      const right = (b.item.accepted ? b.item.accepted[0] : b.item.rows[0]).join('');
      stepModal(D.BAG_NAMES[b.type], '袋子上的句子被剪成好幾塊了，把詞塊排回通順的句子。', b.id,
        [game.level !== 'challenge' && b.structure ? h('p', { class: 'note' }, `句型：${b.structure}`) : null, ord.el], val,
        (a) => Object.assign(D.openBag(game, b.id, a), { teach: `通順的句子是「${right}」。` }),
        [b.structure ? `句型是：${b.structure}` : '先想：誰？做什麼？', '先找出不會變的詞，放中間，其他詞塊放前後試試。', `第一塊是「${(b.item.accepted ? b.item.accepted[0] : b.item.rows[0])[0]}」。`],
        () => '念念看，這樣不通順。誰？做什麼？再調整順序。');
    } else {
      let choice = null; const reveal = h('div', { class: 'd2-card hidden' }, b.stem);
      const btns = b.choices.map((c) => h('button', { type: 'button', 'aria-pressed': 'false', onclick: (e) => { choice = c; btns.forEach((x) => x.setAttribute('aria-pressed', String(x === e.currentTarget))); } }, c));
      stepModal(D.BAG_NAMES[b.type], '這是一段錄音證詞。先按播放仔細聽，再回答問題。', b.id,
        [h('div', { class: 'row' }, [h('button', { class: 'btn primary', type: 'button', onclick: () => speak(b.stem) }, '▶ 播放錄音'), h('button', { class: 'btn', type: 'button', onclick: () => reveal.classList.remove('hidden') }, '看文字')]), reveal,
          h('div', { class: 'qhead' }, [h('div', { class: 'qstem' }, b.question), spk(b.question)]), h('div', { class: 'dt-choice' }, btns)],
        () => choice, (a) => Object.assign(D.openBag(game, b.id, a), { teach: `答案是「${b.answer}」。` }),
        ['再播放一次，注意聽和問題有關的那一句。', '可以按「看文字」，一邊聽一邊看。', `錄音說：「${b.stem}」`],
        () => '再聽一次錄音，找找和問題有關的那一句。');
      setTimeout(() => speak(b.stem), 600);
    }
  }
  function rewardView(b) {
    if (!b.reward) return [boss('這個袋子已經打開了。')];
    if (b.reward.kind === 'listen') return [boss('得到錄音證物：'), h('div', { class: 'd2-card' }, b.reward.text)];
    const c = game.clues.find((x) => x.id === b.reward.id);
    return [boss('這張線索卡被證實了，是對質的關鍵證據：'), h('div', { class: 'd2-card star' }, c.text)];
  }
  function confrontModal(x) {
    let liar = null; let ev = null;
    const wits = x.witnesses.map((w, i) => h('button', { type: 'button', class: 'd2-w', 'aria-pressed': 'false', onclick: (e) => { liar = i; wits.forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget))); } },
      [h('span', { class: 'who' }, `證人${'甲乙丙'[i]}說：`), h('span', { class: 'said' }, w.text), h('small', {}, '點我：他說錯了')]));
    const pool = D.evidencePool(game).filter((e) => e.kind === 'clue');
    const evBtns = pool.map((c) => h('button', { type: 'button', class: `d2-card${c.star ? ' star' : ''}`, 'aria-pressed': 'false', onclick: (e) => { ev = c.id; evBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget))); } }, c.text));
    const needEv = x.evidence.length > 0;
    const evidence = x.evidence.map((id) => game.clues.find((c) => c.id === id)).filter(Boolean);
    stepModal('⚖️ 證人對質', `問題是：「${x.stem}」兩位證人的回答不一樣。${needEv ? '點出說錯的人，再拿一張能證明的證物。' : '點出說錯的人。'}`, x.id,
      [h('div', { class: 'd2-wit' }, wits), needEv ? h('h3', {}, '拿出證物：哪一張線索卡能證明？') : null, needEv ? h('div', { class: 'd2-ev' }, evBtns) : null],
      () => (liar == null || (needEv && !ev) ? null : { liar, evidence: ev }),
      (a) => Object.assign(D.confront(game, x.id, a), { teach: `說對的是「${x.truth}」。${evidence[0] ? `證據是：「${evidence[0].text}」` : ''}` }),
      [x.hints[0] || '回想課文：這件事是怎麼發生的？', x.hints[1] || '把兩位證人的話和線索卡放在一起讀，哪裡不一樣？', evidence[0] ? `看這張線索：「${evidence[0].text}」` : `說對的是「${x.truth}」。`],
      (r) => (!r.liarOk ? '再想想：哪一位的話和線索卡對不上？' : '方向對了！但這張證物還不能證明，想想哪一張有提到這件事？'));
  }

  // ---------- 第三幕：推理黑板 ----------
  function act3() {
    const s = game.state; const L = game.L;
    const tip = !s.rec.claim.done ? '最後一步！先回答案件問題：哪一個結論最正確？' : !s.rec.evidence.done ? `很好！再從筆記本選 ${L.claimEvidence} 張證據，支持你的結論。` : '把結論和證據放進推理句，說出你的推理！';
    const step = (n, t, on, kids) => h('div', { class: `step${on ? '' : ' off'}` }, [h('h3', {}, `${n}　${t}`), ...kids]);
    // 1 主張
    let choice = null;
    const claimBtns = game.claim.choices.map((c) => h('button', { type: 'button', class: 'd2-card', 'aria-pressed': String(s.chosenClaim === c), disabled: s.rec.claim.done, onclick: (e) => { choice = c; claimBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget))); } }, c));
    const fb = h('div', { class: 'dt-feed', role: 'status', style: 'color:#ffe9a8' });
    const claimStep = step('①', '主張：案件的答案是什麼？', true, [h('div', { class: 'd2-ev' }, claimBtns), s.rec.claim.done ? null : h('button', { class: 'btn primary', type: 'button', onclick: () => {
      if (!choice) return; const r = D.chooseClaim(game, choice);
      if (r.ok || r.learned) { tone('ok'); persist(); if (r.learned) message('一起學', boss(`最符合所有線索的結論是：「${game.claim.answer}」其他兩個，一個太籠統，一個說到課文沒提的事。`)); act3(); }
      else { tone('bad'); D.hint(game, 'claim'); fb.textContent = r.tries === 1 ? `${BOSS}：把筆記本的線索從頭讀一遍，整件事主要在說什麼？` : `${BOSS}：有一個說法太籠統，有一個說到課文沒提的事。`; }
    } }, '確定')]);
    // 2 證據
    const picked = new Set(s.chosenEvidence);
    const pool = D.evidencePool(game).filter((e) => e.kind !== 'timeline');
    const evBtns = pool.map((e) => h('button', { type: 'button', class: `d2-card${e.star ? ' star' : ''}${e.decoy ? ' decoy' : ''}`, 'aria-pressed': String(picked.has(e.id)), disabled: !s.rec.claim.done || s.rec.evidence.done, onclick: (ev) => { if (picked.has(e.id)) picked.delete(e.id); else picked.add(e.id); ev.currentTarget.setAttribute('aria-pressed', String(picked.has(e.id))); } }, e.text));
    const evStep = step('②', `證據：選 ${L.claimEvidence} 張能支持主張的證物`, s.rec.claim.done, [h('div', { class: 'd2-ev' }, evBtns), !s.rec.claim.done || s.rec.evidence.done ? null : h('button', { class: 'btn primary', type: 'button', onclick: () => {
      const r = D.chooseEvidence(game, [...picked]);
      if (r.ok || r.learned) { tone('ok'); persist(); act3(); }
      else { tone('bad'); fb.textContent = r.decoyPicked ? '可疑紙條沒有被證實，不能當證據喔。' : `要選 ${r.need} 張不同的證物。`; }
    } }, '確定')]);
    // 3 理由（推理句）
    let reasonStep;
    if (s.rec.evidence.done) {
      const cards = D.reasoningCards(game);
      if (L.reasoning === 'auto' && !s.rec.reasoning.done) { D.buildReasoning(game, cards.map((c) => c.id)); persist(); return report(); }
      const labels = ['我認為（主張）', '因為（證據）', ...(cards.length > 2 ? ['而且（證據）'] : [])];
      const ord = orderer(D.shuffle(cards, Math.random).map((c) => ({ id: c.id, text: c.text })), labels);
      reasonStep = step('③', '理由：把卡片放進推理句', true, [ord.el, h('button', { class: 'btn primary', type: 'button', onclick: () => {
        if (!ord.full()) { fb.textContent = '推理句還有空格。'; return; }
        const r = D.buildReasoning(game, ord.value());
        if (r.ok || r.learned) { tone('open'); persist(); report(); }
        else { tone('bad'); fb.textContent = `${BOSS}：「我認為」後面要放你的主張（答案），「因為」後面放證據。`; }
      } }, '完成推理')]);
    } else reasonStep = step('③', '理由：把卡片放進推理句', false, [h('p', {}, '完成前兩步後打開。')]);
    app.replaceChildren(...header(), boss(tip), h('div', { class: 'd2-board' }, [h('h2', {}, '🧑‍🏫 推理黑板'), claimStep, evStep, reasonStep, fb]));
    say(tip);
  }

  // ---------- 結案報告 ----------
  function report() {
    closeModal(); stopSpeak();
    const sm = D.summary(game);
    store(saveKey(game.lesson), null);
    const roomHost = h('div', {});
    app.replaceChildren(...header(), h('div', { class: 'setup d2-report' }, [
      h('div', { class: 'dt-escape' }, '🎉 結案！'),
      boss(`你用證據說出了真相，這就是真正的偵探！`),
      h('h2', {}, '我的推理'), h('div', { class: 'd2-sentence' }, [sm.sentence, ' ', spk(sm.sentence, '朗讀我的推理')]),
      roomHost,
      h('h2', {}, '辦案紀錄'),
      h('table', {}, [h('thead', {}, h('tr', {}, ['步驟', '練習能力', '情形'].map((t) => h('th', {}, t)))),
        h('tbody', {}, sm.rows.map((r) => h('tr', {}, [h('td', {}, stepName(r.id)), h('td', {}, r.skill), h('td', {}, r.status)])))]),
      h('p', {}, `自己想到 ${sm.self}／${sm.total} 步，用了 ${sm.hints} 次提示。`),
      h('h2', {}, '再複習卡'), sm.review.length ? h('ul', {}, sm.review.map((t) => h('li', {}, t))) : h('p', {}, '全部自己想到，太厲害了！'),
      h('div', { class: 'row' }, [h('button', { class: 'btn primary', type: 'button', onclick: start }, '🔄 再辦一次'), h('button', { class: 'btn', type: 'button', onclick: setup }, '換一個案件')]),
    ]));
    say(`結案！我的推理：${sm.sentence}`);
    // 3D：回到現場，大門打開
    roomHost.style.height = '320px'; roomHost.style.position = 'relative';
    room = window.Detective3D.mount(roomHost, { theme: game.theme, objects: [], puzzles: [{ id: 'exit', type: 'final' }], onPick: () => {}, force2d: !!settings.calm });
    room.setState('exit', 'done', '已結案');
    room.applyVisualState({ done: ['sort'], found: [], escaped: false });
    setTimeout(() => { if (room) { room.applyVisualState({ done: ['sort'], found: [], escaped: true }); room.animate('escape'); } }, 900);
  }
  function stepName(id) {
    if (id.startsWith('frag-')) return '修復線索卡';
    if (id.startsWith('bag')) { const b = game.bags.find((x) => x.id === id); return D.BAG_NAMES[b.type]; }
    if (/^r\d/.test(id)) return '證人對質';
    return { timeline: '排時間線', claim: '主張', evidence: '證據', reasoning: '推理句' }[id] || id;
  }

  // ---------- 筆記本與視窗 ----------
  function notebook() {
    const pool = D.evidencePool(game);
    frame('📓 偵探筆記本', [boss('辦案時隨時可以回來看這些證物。'),
      h('h3', {}, '案件問題'), h('p', {}, game.question),
      h('h3', {}, `證物（${pool.length}）`), pool.length ? h('div', { class: 'd2-ev' }, pool.map((e) => h('div', { class: `d2-card${e.star ? ' star' : ''}${e.decoy ? ' decoy' : ''}` }, [e.text, ' ', spk(e.text)]))) : h('p', { class: 'note' }, '還沒有證物。到房間裡找找看。'),
      h('div', { class: 'dt-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: closeModal }, '關閉'))]);
  }
  function closeModal() { if (modal) { modal.remove(); modal = null; app.inert = false; stopSpeak(); } }
  function frame(t, kids) {
    closeModal();
    modal = h('div', { class: 'qmask', role: 'dialog', 'aria-modal': 'true', 'aria-label': t }, h('div', { class: 'qbox' }, [h('div', { class: 'qhead' }, [h('div', { class: 'qstem' }, t), h('button', { class: 'btn', type: 'button', onclick: closeModal }, '關閉')]), ...kids]));
    modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    document.body.append(modal); app.inert = true;
    const f = modal.querySelector('.qbox button'); if (f) f.focus();
  }
  function message(t, body) { frame(t, [...[].concat(body), h('div', { class: 'dt-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: closeModal }, '知道了'))]); }

  settings = Object.assign({ lesson: 4, level: 'standard', autoSpeak: false, sound: true, calm: false }, load(SKEY, {}));
  document.body.classList.toggle('calm', !!settings.calm);
  const s = document.createElement('script'); s.src = `data/detective-${gradeKey()}.js?v=2`;
  s.onload = () => { bank = window.DETECTIVE_BANK; setup(); }; s.onerror = () => { app.textContent = '找不到這個年級的資料'; };
  document.head.append(s);
  window.D2_DEBUG = { get game() { return game; }, route };
})();
