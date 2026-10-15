/* 課文偵探密室：畫面流程。邏輯在 detective-core.js，3D 房間在 detective3d.js。
   流程：設定 → 偵探任務說明 → 觀察現場、蒐集線索 → 解謎與機關 → 最終推理 → 逃出密室 → 複習成果 */
(function () {
  'use strict';
  const { h, speak, stopSpeak, gradeKey } = window.RG;
  const C = window.DetectiveCore;
  const GRADE_LINKS = [['G1A', '一上'], ['G2A', '二上'], ['G3A', '三上'], ['G4A', '四上'], ['G6A', '六上']];
  const STEPS = ['進入密室', '觀察現場', '蒐集線索', '操作解謎', '解開機關', '最終推理', '逃出密室', '複習成果'];
  const SKEY = 'rg-detective-settings-v1';
  const RKEY = 'rg-detective-record-v1';
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (_) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* 無痕模式等 */ } };
  const app = document.getElementById('app');
  let bank, settings, game, room, modal, pendingVisual, escapeTimer;
  let escaping = false, recorded = false;
  function cancelExit() { clearTimeout(escapeTimer); escaping = false; pendingVisual = null; }
  function visualSnapshot() { return { done: game.puzzles.filter(p => game.state.solved[p.id].done).map(p => p.type), found: game.objects.filter(o => game.state.found.includes(o.holds)).map(o => o.id), escaped: escaping }; }

  // ---------- 音效（WebAudio 短音，可關） ----------
  let actx;
  function tone(kind) {
    if (!settings.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const seq = { ok: [523, 659, 784], bad: [330, 262], find: [880], open: [392, 523, 659, 784, 1046] }[kind] || [600];
      seq.forEach((f, i) => {
        const o = actx.createOscillator(); const g = actx.createGain(); const t = actx.currentTime + i * 0.11;
        o.type = kind === 'bad' ? 'triangle' : 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.22);
      });
    } catch (_) { /* 沒有音效裝置 */ }
  }
  const say = (t) => { if (settings.autoSpeak) speak(t); };
  const spk = (t, label = '朗讀') => h('button', { class: 'speak', type: 'button', 'aria-label': label, title: label, onclick: () => speak(t) }, '🔊');
  const applyDisplay = () => { document.body.classList.toggle('calm', !!settings.calm); document.body.classList.toggle('proj', !!settings.proj); };

  function loadBank() {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script'); s.src = `data/detective-${gradeKey()}.js`;
      s.onload = () => resolve(window.DETECTIVE_BANK); s.onerror = () => reject(new Error('找不到這個年級的密室資料'));
      document.head.append(s);
    });
  }
  function topbar(title) {
    return h('div', { class: 'topbar' }, [
      h('a', { class: 'back', href: `./?g=${gradeKey()}` }, '← 遊戲選單'),
      h('h1', {}, title),
      h('a', { class: 'back', href: '../../mandarin/#/grade/' + gradeKey()[1] }, '課文樂園'),
    ]);
  }

  // ---------- 設定畫面 ----------
  function setup() {
    cancelExit();
    stopSpeak(); closeModal(); if (room) { room.dispose(); room = null; }
    const playable = bank.rooms.filter((r) => r.playable);
    if (!playable.some((r) => r.no === settings.lesson)) settings.lesson = playable[0].no;
    const rec = load(RKEY, {})[gradeKey()] || {};
    const lessonChips = h('div', { class: 'chips' });
    const crossNote = h('p', { class: 'note' }, '請老師勾選「已經教過」的課（至少兩課）。不會預設全部課次。');
    const startBtn = h('button', { class: 'btn primary', type: 'button', onclick: start }, '🕵️ 開始偵探任務');
    const renderChips = () => {
      const isCross = settings.mode === 'cross';
      lessonChips.replaceChildren(...bank.rooms.map((r) => {
        const checked = isCross ? settings.cross.includes(r.no) : settings.lesson === r.no;
        const last = rec[`L${r.no}`];
        return h('label', { class: 'chip', title: r.playable ? '' : '教材資料不足，暫不開放' }, [
          h('input', {
            type: isCross ? 'checkbox' : 'radio', name: 'lesson', checked, disabled: !r.playable,
            onchange: (e) => {
              if (isCross) settings.cross = e.target.checked ? [...settings.cross, r.no] : settings.cross.filter((x) => x !== r.no);
              else settings.lesson = r.no;
              save(SKEY, settings); startBtn.disabled = isCross && settings.cross.length < 2;
            },
          }),
          `第${r.no}課 ${r.title}`, r.playable ? (last ? h('small', { class: 'note' }, ` ✓${last.first}/${last.total}`) : null) : h('small', { class: 'note' }, '（待補）'),
        ]);
      }));
      startBtn.disabled = isCross && settings.cross.length < 2;
      crossNote.classList.toggle('hidden', !isCross);
    };
    const modeBtn = (key, label) => h('label', { class: 'chip' }, [h('input', { type: 'radio', name: 'mode', checked: settings.mode === key, onchange: () => { settings.mode = key; save(SKEY, settings); renderChips(); } }), label]);
    const toggle = (key, label) => h('label', { class: 'chip' }, [h('input', { type: 'checkbox', checked: !!settings[key], onchange: (e) => { settings[key] = e.target.checked; save(SKEY, settings); applyDisplay(); } }), label]);
    const gaps = bank.rooms.filter((r) => r.gaps.length);
    app.replaceChildren(
      topbar(`${bank.grade}・課文偵探密室`),
      h('nav', { class: 'grades', 'aria-label': '換年級' }, GRADE_LINKS.map(([k, t]) => h('a', { href: `?g=${k}`, 'aria-current': k === gradeKey() ? 'page' : null }, t))),
      h('div', { class: 'setup', style: 'margin-top:12px' }, [
        h('ol', { class: 'howto' }, [
          ['🔍', '點房間裡的物件，找出線索'], ['📌', '用線索排好事件、解開機關'], ['🧠', '用證據完成最終推理'], ['🚪', '打開大門，看複習成果'],
        ].map(([i, t]) => h('li', {}, [h('span', { class: 'howto-ico', 'aria-hidden': 'true' }, i), t]))),
        h('h2', {}, '複習方式'), h('div', { class: 'row' }, [modeBtn('single', '單課密室'), modeBtn('cross', '跨課綜合案件')]),
        h('h2', {}, '複習哪一課？'), crossNote, lessonChips,
        h('h2', {}, '偵探等級'),
        h('div', { class: 'chips' }, Object.entries(C.LEVELS).map(([k, v]) => h('label', { class: 'chip' }, [
          h('input', { type: 'radio', name: 'level', checked: settings.level === k, onchange: () => { settings.level = k; save(SKEY, settings); } }), `${v.label}（${v.role}）`]))),
        h('p', { class: 'note' }, '支持：線索少、一次一個任務、提示自動出現｜標準：要比較與整合、有干擾紙條、提示自己開｜挑戰：線索多、要選出支持答案的證據。三級都不限時。'),
        h('div', { class: 'row' }, [toggle('autoSpeak', '自動朗讀'), toggle('sound', '音效'), toggle('calm', '減少動態（平面圖）'), toggle('proj', '投影模式（字更大）')]),
        h('div', { class: 'row' }, [startBtn]),
      ]),
      h('details', { class: 'note', style: 'margin-top:16px' }, [h('summary', {}, '教師資訊：教材來源、課次覆蓋與待補清單'),
        h('p', {}, `題材全部取自課文樂園已審核的課次資料（${bank.publisher}${bank.grade}）：段落大意、閱讀理解題、形似字、語詞解釋、句型例句與主旨；偵探故事、物件名稱是遊戲包裝，不是課文內容。可玩 ${playable.length}／${bank.rooms.length} 課。`),
        h('p', {}, '學習紀錄只存在這台裝置的瀏覽器（只記課次、等級、完成情形，不記姓名）；清除瀏覽器資料或換裝置就會不見。'),
        gaps.length ? h('ul', {}, gaps.map((r) => h('li', {}, `第${r.no}課 ${r.title}：${r.gaps.join('；')}`))) : h('p', {}, '全部課次資料齊全。'),
      ]),
    );
    renderChips(); applyDisplay();
  }

  function start() {
    cancelExit(); recorded = false;
    try {
      game = settings.mode === 'cross'
        ? C.makeCross(bank, settings.cross.slice().sort((a, b) => a - b), settings.level, Date.now())
        : C.makeRoom(bank, settings.lesson, settings.level, Date.now());
    } catch (e) { alert(e.message); return; }
    const qaTheme = new URLSearchParams(location.search).get('qaRoom');
    if (window.Detective3D.THEMES[qaTheme] && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) game.theme = qaTheme;
    game.stage = 0;
    briefing();
  }
  function stepper() {
    return h('ol', { class: 'dt-steps', 'aria-label': '任務進度' }, STEPS.map((s, i) => h('li', { class: i < game.stage ? 'done' : i === game.stage ? 'now' : '', 'aria-current': i === game.stage ? 'step' : null }, s)));
  }
  function briefing() {
    closeModal(); if (room) { room.dispose(); room = null; }
    const L = game.L;
    const lessonText = game.mode === 'cross' ? `第${game.lessons.join('、')}課` : game.title;
    const letter = `偵探社收到一封委託信：「${lessonText}的案件檔案被風吹散了，大門也被機關鎖住。請你找回線索、排好事件、解開機關，用證據說出案件的真相，才能打開大門！」`;
    app.replaceChildren(
      topbar(`課文偵探密室｜${game.title}`), stepper(),
      h('div', { class: 'setup' }, [
        h('div', { class: 'dt-story' }, [h('span', { class: 'tag' }, '偵探任務（遊戲故事，不是課文內容）'), h('p', { class: 'dt-big' }, letter), spk(letter, '朗讀委託信')]),
        h('p', {}, `場景：${(window.Detective3D.THEMES[game.theme] || {}).name || '密室'}｜等級：${L.label}（${L.role}）｜要找 ${game.clues.length} 張線索卡${game.decoys.length ? `，房間裡也有 ${game.decoys.length} 張可疑紙條（不一定可信）` : ''}。`),
        h('ul', {}, [
          h('li', {}, '線索卡上的事情，都來自你學過的課文。'),
          h('li', {}, '任何時候都可以打開「偵探筆記本」看找到的線索。'),
          h('li', {}, '答錯沒關係，回去看證據再試；需要時可以按「提示」。'),
          h('li', {}, '沒有時間限制，慢慢想。'),
        ]),
        h('div', { class: 'row' }, [h('button', { class: 'btn primary', type: 'button', onclick: () => { game.stage = 1; play(); } }, '進入密室')]),
      ]),
    );
    say(letter);
  }

  // ---------- 主畫面 ----------
  const stationPuzzles = () => game.puzzles.filter((p) => p.type !== 'search');
  function nextPuzzle() {
    if (!game.state.solved.search.done) return game.puzzles[0];
    return stationPuzzles().find((p) => !game.state.solved[p.id].done && C.isOpen(game, p.id));
  }
  function stageOf() {
    const s = game.state.solved;
    if (s.final.done) return 6;
    if (stationPuzzles().filter((p) => p.type !== 'final').every((p) => s[p.id].done)) return 5;
    if (['dial', 'keys', 'blocks'].some((t) => s[t] && s[t].done)) return 4;
    if (s.search.done) return 3;
    return game.state.found.length ? 2 : 1;
  }
  function taskText() {
    if (!game.state.solved.search.done) {
      const real = game.clues.filter((c) => game.state.found.includes(c.id)).length;
      return `點房間裡有 🔍 的物件，找出 ${game.clues.length} 張線索卡（已找到 ${real} 張）。`;
    }
    if (game.state.solved.final.done) return '案件破了！點「出口大門」逃出密室。';
    const p = nextPuzzle();
    if (!p) return '完成其他機關，最終推理就會打開。';
    return {
      sort: '到「案件布告欄」，把線索卡排成事件發生的順序。',
      dial: '到「國字保險箱」，轉出正確的字打開保險箱。',
      keys: '到「語詞鎖櫃」，把語詞鑰匙放進意思相符的鎖。',
      blocks: '到「詞塊打字機」，把詞塊排成通順的句子。',
      compare: '到「證詞放大鏡」，比對哪一句說法和線索相符。',
      cause: '到「原因推理機」，用線索推出原因或結果。',
      final: game.mode === 'cross' ? '到「出口大門」，把每段主旨配對到正確的課。' : '到「出口大門」，選出和所有證據都相符的結論。',
    }[p.type];
  }
  function play() {
    if (room && room.host.isConnected) { rerender(); return; }
    game.stage = Math.max(game.stage, stageOf());
    const task = taskText();
    const list = h('ul', { class: 'dt-list' });
    const roomHost = h('div', {});
    const status = h('div', { class: 'dt-status', role: 'status' });
    app.replaceChildren(
      topbar(`課文偵探密室｜${game.title}`), stepper(),
      h('div', { class: 'dt-task', role: 'status' }, [h('span', { 'aria-hidden': 'true' }, '🎯'), h('b', {}, task), spk(task, '朗讀目前任務')]),
      h('div', { class: 'dt-bar' }, [
        h('label', { class: 'chip' }, [h('input', { type: 'checkbox', checked: !!settings.calm, onchange: (e) => { settings.calm = e.target.checked; applyDisplay(); room.opts.force2d = !!settings.calm; room.refreshMode(); } }), '減少動態（平面圖）']),
        h('button', { class: 'btn', type: 'button', id: 'dt-notebook', onclick: notebook }, '📓 偵探筆記本'),
        h('button', { class: 'btn', type: 'button', onclick: () => { if (confirm('要重新開始這間密室嗎？目前進度不會保留。')) start(); } }, '🔄 重新挑戰'),
        h('button', { class: 'btn', type: 'button', onclick: () => { if (confirm('回到設定畫面？目前進度不會保留。')) setup(); } }, '↩ 回到設定'),
      ]),
      h('div', { class: 'dt-layout' }, [roomHost, h('aside', { class: 'dt-side' }, [h('h2', {}, '機關清單'), list,
        h('p', { class: 'note' }, '可以點房間裡的物件，也可以點這份清單。')])]),
    );
    if (room) room.dispose();
    room = window.Detective3D.mount(roomHost, { theme: game.theme, objects: game.objects, puzzles: stationPuzzles(), onPick: pick, onStatus: (t) => { status.textContent = t; }, force2d: !!settings.calm });
    roomHost.append(status);
    refreshStates(list);
    say(task);
  }
  function refreshStates(list) {
    const next = nextPuzzle();
    for (const o of game.objects) {
      const found = game.state.found.includes(o.holds);
      room.setState(o.id, found ? 'found' : (game.L.autoHint ? 'next' : 'open'), found ? '已調查' : '還沒調查');
    }
    const items = game.objects.map((o) => {
      const it = room.items.find((x) => x.id === o.id), found = game.state.found.includes(o.holds);
      return h('li', {}, h('button', { type: 'button', class: found ? 'done' : '', onclick: () => pick(o.id) }, `${room.items.indexOf(it) + 1}. ${it.label}・${found ? '已調查' : '調查'}`));
    });
    const real = game.clues.filter((c) => game.state.found.includes(c.id)).length;
    items.push(h('li', {}, h('button', { type: 'button', class: game.state.solved.search.done ? 'done' : 'next', onclick: notebook }, `${game.state.solved.search.done ? '✓' : '🔍'} 搜查現場（${real}/${game.clues.length}）`)));
    for (const p of stationPuzzles()) {
      const st = game.state.solved[p.id]; const open = C.isOpen(game, p.id);
      let state = st.done ? 'done' : !open ? 'locked' : (p === next ? 'next' : 'open');
      if (game.L.oneAtATime && !st.done && open && p !== next) state = 'locked';
      room.setState(p.id, state, st.done ? '已完成' : state === 'locked' ? '還鎖著' : '可以調查');
      items.push(h('li', {}, h('button', { type: 'button', class: state === 'done' ? 'done' : state === 'next' ? 'next' : '', disabled: state === 'locked', onclick: () => pick(p.id) },
        `${state === 'done' ? '✓' : state === 'locked' ? '🔒' : '▶'} ${room.items.findIndex((it) => it.id === p.id) + 1}. ${room.items.find((it) => it.id === p.id)?.label || C.NAMES[p.type]}${p.lesson && game.mode === 'cross' ? `（第${p.lesson}課）` : ''}`)));
    }
    list.replaceChildren(...items);
    room.applyVisualState(visualSnapshot());
  }
  function rerender() { const list = app.querySelector('.dt-list'); if (list) refreshStates(list); const t = app.querySelector('.dt-task b'); if (t) t.textContent = taskText(); }

  function pick(id) {
    const obj = game.objects.find((o) => o.id === id);
    if (obj) return investigate(obj);
    const p = game.puzzles.find((x) => x.id === id);
    if (!p) return;
    if (game.state.solved[p.id].done) return p.type === 'final' ? escapeRoom() : review(p);
    if (!C.isOpen(game, p.id)) {
      const need = p.deps.filter((d) => !game.state.solved[d].done).map((d) => C.NAMES[game.puzzles.find((x) => x.id === d).type]);
      return message('🔒 這個機關還鎖著', h('p', {}, `先完成：${need.join('、')}。`));
    }
    if (game.L.oneAtATime && p !== nextPuzzle()) return message('一次做一件事', h('p', {}, `先完成目前任務：${taskText()}`));
    openPuzzle(p);
  }
  function investigate(obj) {
    const already = game.state.found.includes(obj.holds);
    const wasDone = game.state.solved.search.done;
    const r = C.investigate(game, obj.id);
    if (!already) { tone('find'); room.animate('search', obj.id); room.animate('found', obj.id); }
    const body = r.kind === 'clue'
      ? [h('div', { class: 'dt-clue' }, [h('small', {}, `線索卡｜第${game.mode === 'cross' ? game.baseLesson : game.lessons[0]}課`), r.item.text]), spk(r.item.text, '朗讀線索')]
      : [h('div', { class: 'dt-clue decoy' }, [h('small', {}, '可疑紙條（尚未證實，不一定可信）'), r.item.text]), h('p', {}, '偵探提醒：這張紙條不一定可信，先記在筆記本，之後用證據判斷。')];
    if (r.kind === 'clue') say(r.item.text);
    if (!wasDone && game.state.solved.search.done) {
      tone('open'); play();
      message('✓ 線索全部找到了！', [...body, h('p', {}, '布告欄、放大鏡和推理機都打開了。打開「偵探筆記本」可以重讀所有線索。')]);
      return;
    }
    message(r.kind === 'clue' ? (already ? '🔍 已經看過的線索' : '🔍 找到線索卡！') : '📝 找到一張可疑紙條', body, `已找到線索卡 ${r.progress[0]}／${r.progress[1]} 張，都放進偵探筆記本了。`);
    rerender();
  }

  // ---------- 視窗 ----------
  function closeModal() { if (modal) { modal.remove(); modal = null; app.inert = false; stopSpeak(); if (pendingVisual && room) { const kind = pendingVisual; pendingVisual = null; room.applyVisualState(visualSnapshot()); room.animate(kind); } } }
  function frame(title, kids) {
    closeModal();
    modal = h('div', { class: 'qmask', role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, h('div', { class: 'qbox' }, [h('div', { class: 'qhead' }, [h('div', { class: 'qstem' }, title), h('button', { class: 'btn', type: 'button', onclick: closeModal }, '關閉')]), ...kids]));
    modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    document.body.append(modal); app.inert = true;
    const f = modal.querySelector('.btn.primary') || modal.querySelector('button'); if (f) f.focus();
    return modal;
  }
  function message(title, body, foot) {
    frame(title, [...[].concat(body), foot ? h('p', { class: 'note' }, foot) : null, h('div', { class: 'dt-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: closeModal }, '知道了'))]);
  }

  function notebook() {
    const s = game.state; const sorted = s.solved.sort && s.solved.sort.done;
    const found = game.clues.filter((c) => s.found.includes(c.id));
    const decoys = game.decoys.filter((d) => s.found.includes(d.id));
    const done = game.puzzles.filter((p) => p.type !== 'search' && s.solved[p.id].done);
    frame('📓 偵探筆記本', [h('div', { class: 'dt-note' }, [
      h('h3', {}, '🎯 目前任務'), h('p', {}, taskText()),
      h('h3', {}, sorted ? '✅ 已確認的事實（依事件順序）' : `🔍 已發現的線索（${found.length}/${game.clues.length}）`),
      h('section', {}, found.length ? (sorted ? game.clues : found).map((c, i) => h('div', { class: 'dt-clue' }, [h('small', {}, sorted ? `第 ${i + 1} 件事` : '線索卡'), c.text, ' ', spk(c.text)])) : [h('p', {}, '還沒找到線索。點房間裡有 🔍 的物件。')]),
      game.decoys.length ? h('h3', {}, '❓ 尚未證實的推測（可疑紙條）') : null,
      game.decoys.length ? h('section', {}, decoys.length ? decoys.map((d) => h('div', { class: 'dt-clue decoy' }, d.text)) : [h('p', { class: 'note' }, '還沒找到。')]) : null,
      h('h3', {}, '🧩 已完成的謎題（可回顧解題資訊）'),
      h('section', {}, done.length ? done.map((p) => h('div', { class: 'dt-clue' }, [h('small', {}, C.NAMES[p.type]), solvedInfo(p)])) : [h('p', { class: 'note' }, '還沒有。')]),
    ])]);
  }
  function solvedInfo(p) {
    if (p.type === 'dial') return p.items.map((i) => i.word).join('、');
    if (p.type === 'keys') return p.locks.map((l) => `${l.answer}＝${l.meaning}`).join('；');
    if (p.type === 'blocks') return game.state.solved.blocks.answerText || '';
    if (p.type === 'sort') return '事件順序已確認（見上方事實）';
    if (p.type === 'final' && p.cross) return p.pairs.map((x) => x.answer).join('、');
    if (p.answer) return `${p.stem ? p.stem + ' → ' : ''}${p.answer}`;
    return '';
  }
  function review(p) { message(`✓ ${C.NAMES[p.type]}（已完成）`, h('div', { class: 'dt-clue' }, solvedInfo(p))); }

  // ---------- 提示（三級：觀察方向 → 比較線索 → 明確下一步） ----------
  function hintsFor(p) {
    const evid = (p.evidence || []).map((id) => game.clues.find((c) => c.id === id)).filter(Boolean);
    switch (p.type) {
      case 'sort': {
        const blocks = [...new Set(game.clues.map((c) => c.block).filter(Boolean))];
        return ['先找「故事一開始」的那張卡：誰、在哪裡？', blocks.length > 1 ? `課文的結構是：${blocks.join(' → ')}。比較兩張卡，哪件事要先發生？` : '比較兩張卡：哪件事發生了，另一件事才會發生？', `最先的是：「${game.clues[0].text}」`];
      }
      case 'dial': return ['把整個語詞小聲念一遍，想想在哪一課學過。', '比較這幾個字：哪個部件（偏旁）和語詞的意思有關？', `「${p.items[0].word}」的空格是「${p.items[0].answer}」。`];
      case 'keys': return ['先讀鎖上的意思，再找意思相同的語詞。', '先放最有把握的那一把，剩下的再比較。', `「${p.locks[0].meaning}」是「${p.locks[0].answer}」。`];
      case 'blocks': return [p.structure ? `句型：${p.structure}` : '先想：誰？做什麼？', '先找出不會變的詞塊，再把其他詞塊放前後試試。', `第一個詞塊是「${((p.item.accepted && p.item.accepted[0]) || p.item.rows[0])[0]}」。`];
      case 'compare': case 'cause': return [p.hintsText[0] || '回到筆記本，找和題目有關的線索卡。', p.hintsText[1] || '比較每個說法和線索卡，哪一句有證據支持？', evid.length ? `看這張線索：「${evid[0].text}」` : `正確的說法開頭是「${p.answer.slice(0, 3)}」。`];
      case 'final': return p.cross
        ? ['先讀主旨，找出和課名有關的關鍵詞。', '先配最有把握的一課，剩下的再比較。', `「${p.pairs[0].gist.slice(0, 18)}…」是${p.pairs[0].answer}。`]
        : ['把筆記本的線索從頭讀一遍，整件事主要在說什麼？', '有一個說法太籠統，有一個說到課文沒提的事。', '結論要能用線索卡證明；可疑紙條不能當證據。'];
      default: return ['', '', ''];
    }
  }
  function hintBox(p) {
    const box = h('div', { class: 'dt-hint', role: 'status' });
    const st = game.state.solved[p.id]; const list = hintsFor(p);
    const show = () => { box.replaceChildren(...list.slice(0, Math.max(st.hints, game.L.autoHint ? 1 : 0)).map((t, i) => h('div', {}, `💡 提示 ${i + 1}：${t}`))); box.classList.toggle('hidden', !box.childNodes.length); };
    const btn = h('button', { class: 'btn', type: 'button', onclick: () => { if (st.hints >= 3) return; C.useHint(game, p.id); show(); say(list[st.hints - 1]); if (st.hints >= 3) btn.disabled = true; } }, '💡 提示');
    if (st.hints >= 3) btn.disabled = true;
    show();
    return { box, btn };
  }

  // ---------- 可拖曳、可點選的排列器 ----------
  function arranger(items, slotLabels, { row = false, keyStyle = false } = {}) {
    const pool = h('div', { class: 'dt-pool', 'aria-label': '可用的卡片' });
    const slots = h('div', { class: `dt-slots${row ? ' row' : ''}`, 'aria-label': '放置區' });
    const val = slotLabels.map(() => null); let sel = null;
    const target = (e) => { const el = document.elementFromPoint(e.clientX, e.clientY); return el && el.closest ? el.closest('.dt-slot') : null; };
    const tap = (i) => {
      if (val.includes(i)) { remove(i); return; }
      if (keyStyle) { sel = sel === i ? null : i; draw(); return; }
      const k = val.indexOf(null); if (k >= 0) put(i, k);
    };
    const chips = items.map((it, i) => {
      const b = h('button', { class: `dt-chip${keyStyle ? ' key' : ''}`, type: 'button' }, it.text);
      let start = null, ghost = null;
      b.addEventListener('pointerdown', (e) => { start = { x: e.clientX, y: e.clientY }; try { b.setPointerCapture(e.pointerId); } catch (_) { /* */ } });
      b.addEventListener('pointermove', (e) => {
        if (!start) return;
        if (!ghost && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) { ghost = b.cloneNode(true); ghost.classList.add('ghost'); document.body.append(ghost); }
        if (ghost) { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; slots.querySelectorAll('.dt-slot').forEach((s) => s.classList.remove('drop')); const t = target(e); if (t) t.classList.add('drop'); }
      });
      b.addEventListener('pointerup', (e) => {
        if (!start) return;
        const wasDrag = !!ghost; if (ghost) ghost.remove(); ghost = null; start = null;
        slots.querySelectorAll('.dt-slot').forEach((s) => s.classList.remove('drop'));
        b.dataset.skip = '1';
        if (wasDrag) { const t = target(e); if (t) put(i, Number(t.dataset.k)); return; }
        tap(i);
      });
      b.addEventListener('pointercancel', () => { if (ghost) ghost.remove(); ghost = null; start = null; });
      // 鍵盤（Enter／空白鍵）觸發 click；指標操作已在 pointerup 處理過就略過
      b.addEventListener('click', () => { if (b.dataset.skip) { delete b.dataset.skip; return; } tap(i); });
      return b;
    });
    function put(i, k) { const old = val.indexOf(i); if (old >= 0) val[old] = null; val[k] = i; sel = null; draw(); }
    function remove(i) { const k = val.indexOf(i); if (k >= 0) val[k] = null; draw(); }
    function draw() {
      pool.replaceChildren(...items.map((_, i) => i).filter((i) => !val.includes(i)).map((i) => { chips[i].classList.toggle('sel', sel === i); return chips[i]; }));
      if (!pool.childNodes.length) pool.append(h('span', { class: 'note' }, '卡片都放好了，可以按「檢查」。'));
      slots.replaceChildren(...slotLabels.map((lab, k) => {
        const s = h('div', { class: 'dt-slot', 'data-k': k, role: 'button', tabindex: 0, 'aria-label': `${lab || `第${k + 1}格`}${val[k] == null ? '，空的' : ''}` }, [lab ? h('span', { class: 'lab' }, lab) : null, val[k] != null ? chips[val[k]] : null]);
        s.addEventListener('click', (e) => { if (!e.target.closest('.dt-chip') && sel != null) put(sel, k); });
        s.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === s && sel != null) { e.preventDefault(); put(sel, k); } });
        return s;
      }));
    }
    draw();
    return {
      el: h('div', {}, [h('p', { class: 'note' }, keyStyle ? '點一把鑰匙，再點要放的鎖（也可以直接拖曳）。點放好的鑰匙可以拿回來。' : '點卡片會依序放進空格，也可以拖曳；點放好的卡片可以拿回來。'), pool, slots]),
      value: () => val.map((i) => (i == null ? null : items[i].value)),
      full: () => val.every((x) => x != null),
      mark: (bad) => slots.querySelectorAll('.dt-slot').forEach((s, k) => s.classList.toggle('bad', !!bad[k])),
    };
  }

  // ---------- 謎題視窗 ----------
  function openPuzzle(p) {
    const st = game.state.solved[p.id];
    const feed = h('div', { class: 'dt-feed', role: 'status', 'aria-live': 'polite' });
    const { box: hint, btn: hintBtn } = hintBox(p);
    const submit = h('button', { class: 'btn primary', type: 'button' }, '🔓 檢查');
    let body = []; let getAnswer; let onWrong = () => {}; let intro = '';
    let needLook = false; // 選擇題答錯後，要先看證據才能再交（避免亂點）
    const evidencePanel = h('div', { class: 'hidden dt-ev' });
    const lookBtn = h('button', { class: 'btn hidden', type: 'button', onclick: () => {
      const ev = (p.evidence || []).map((id) => game.clues.find((c) => c.id === id)).filter(Boolean);
      const show = ev.length ? ev : game.clues.filter((c) => game.state.found.includes(c.id));
      evidencePanel.replaceChildren(h('b', {}, ev.length ? '和這題有關的線索：' : '你找到的線索：'), ...show.map((c) => h('div', { class: 'dt-clue' }, c.text)));
      evidencePanel.classList.remove('hidden'); needLook = false; submit.disabled = false; lookBtn.classList.add('hidden');
    } }, '📓 先看證據');

    if (p.type === 'sort') {
      intro = '把線索卡排成事件發生的順序（最上面是最先發生的事）。';
      const items = p.cards.map((id) => ({ text: game.clues.find((c) => c.id === id).text, value: id }));
      const arr = arranger(items, p.answer.map((_, k) => (k === 0 ? '最先' : k === p.answer.length - 1 ? '最後' : `第${k + 1}`)));
      body = [arr.el]; getAnswer = () => (arr.full() ? arr.value() : null);
      onWrong = (r) => { arr.mark(p.answer.map((_, k) => k === r.detail.wrongAt)); feed.textContent = `從「${r.detail.wrongAt === 0 ? '最先' : `第${r.detail.wrongAt + 1}`}」這一格開始不對。讀讀看，哪件事要先發生？`; };
    } else if (p.type === 'dial') {
      intro = '保險箱有國字轉盤。轉出正確的字，讓每個語詞都寫對。';
      const pos = p.items.map(() => 0);
      const dials = p.items.map((it, i) => {
        const show = h('i', {}, it.chars[0]);
        const parts = it.blank.split('＿');
        const word = h('div', { class: 'word', 'aria-live': 'polite' }, [parts[0], show, parts.slice(1).join('＿')]);
        const el = h('div', { class: 'dt-dial' });
        const turn = (d) => { pos[i] = (pos[i] + d + it.chars.length) % it.chars.length; show.textContent = it.chars[pos[i]]; word.classList.remove('spin'); void word.offsetWidth; word.classList.add('spin'); el.classList.remove('bad'); };
        el.append(h('button', { type: 'button', 'aria-label': '往上轉', onclick: () => turn(-1) }, '▲'), word, h('button', { type: 'button', 'aria-label': '往下轉', onclick: () => turn(1) }, '▼'), spk(it.word.replace(it.answer, '什麼'), '朗讀（空格念「什麼」）'));
        return el;
      });
      body = [h('div', { class: 'dt-dials' }, dials)]; getAnswer = () => p.items.map((it, i) => it.chars[pos[i]]);
      onWrong = (r) => { r.detail.bad.forEach((b, i) => dials[i].classList.toggle('bad', b)); feed.textContent = `有 ${r.detail.bad.filter(Boolean).length} 個轉盤還不對（紅框）。比較字的部件，想想語詞的意思。`; };
    } else if (p.type === 'keys' || (p.type === 'final' && p.cross)) {
      const isKeys = p.type === 'keys';
      intro = isKeys ? '每個鎖上寫著一個意思。把意思相符的語詞鑰匙放進鎖裡。' + (p.keys.length > p.locks.length ? '（有鑰匙用不到）' : '') : '每段主旨是哪一課？把課名鑰匙放進對應的主旨鎖。';
      const keys = isKeys ? p.keys : p.titles;
      const arr = arranger(keys.map((k) => ({ text: k, value: k })), isKeys ? p.locks.map((l) => `🔒 ${l.meaning}`) : p.pairs.map((x) => `🔒 ${x.gist}`), { keyStyle: true });
      body = [arr.el]; getAnswer = () => (arr.full() ? arr.value() : null);
      onWrong = (r) => { arr.mark(r.detail.bad); feed.textContent = `有 ${r.detail.bad.filter(Boolean).length} 個鎖打不開（紅框）。再讀一次鎖上的${isKeys ? '意思' : '主旨'}。`; };
    } else if (p.type === 'blocks') {
      intro = '打字機卡住了！把詞塊排成一句通順的話。' + (p.blocks.length > p.need ? '（有一塊用不到）' : '');
      const arr = arranger(p.blocks.map((b) => ({ text: b, value: b })), Array.from({ length: p.need }, () => ''), { row: true });
      body = [game.level !== 'challenge' && p.structure ? h('p', { class: 'note' }, `句型：${p.structure}`) : null, arr.el];
      getAnswer = () => (arr.full() ? arr.value() : null);
      onWrong = () => { feed.textContent = '這樣念起來不通順。念念看：誰？做什麼？再調整順序。'; };
    } else {
      const isFinal = p.type === 'final';
      intro = isFinal ? '最後一步：哪一個結論和你找到的所有線索都相符？' : p.type === 'compare' ? '幾位證人說法不一樣。哪一句和課文事實相符？' : '用線索推理：';
      let choice = null; const evSel = new Set();
      const btns = p.choices.map((c, i) => h('button', { type: 'button', 'aria-pressed': 'false', onclick: (e) => { choice = c; btns.forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget))); } }, `${p.type === 'compare' ? `證人${'ABCD'[i]}說：` : ''}${c}`));
      const evNeed = isFinal ? p.needEvidence : (p.needEvidence ? 1 : 0);
      let evBox = null;
      if (evNeed) {
        const pool = [...game.clues.filter((c) => game.state.found.includes(c.id)), ...(isFinal ? game.decoys.filter((d) => game.state.found.includes(d.id)) : [])];
        evBox = h('fieldset', { class: 'dt-ev' }, [h('legend', {}, `選出 ${evNeed} 張以上能支持你答案的證據：`), ...C.shuffle(pool, Math.random).map((c) => h('label', { class: `dt-clue${c.decoy ? ' decoy' : ''}` }, [h('input', { type: 'checkbox', onchange: (e) => { if (e.target.checked) evSel.add(c.id); else evSel.delete(c.id); } }), c.text]))]);
      }
      body = [p.stem ? h('div', { class: 'qhead' }, [h('div', { class: 'qstem' }, p.stem), spk(p.stem)]) : null, h('div', { class: 'dt-choice' }, btns), evBox];
      getAnswer = () => (choice == null || (evNeed && evSel.size < evNeed) ? null : { choice, evidence: [...evSel] });
      onWrong = (r) => {
        const d = r.detail;
        feed.textContent = !d.choiceOk ? '這個說法還找不到證據支持。先看證據再想一想。' : d.decoyPicked ? '可疑紙條沒有被證實，不能當證據喔。' : '答案對了，但證據還不夠支持它，再選一次證據。';
        if (!d.choiceOk) { needLook = true; submit.disabled = true; lookBtn.classList.remove('hidden'); }
      };
    }

    const actions = h('div', { class: 'dt-actions' }, [hintBtn, lookBtn, submit]);
    submit.onclick = () => {
      const ans = getAnswer();
      if (!ans) { feed.className = 'dt-feed bad'; feed.textContent = '還有空格沒放好，或還沒選答案（證據）。'; return; }
      if (needLook) return;
      const r = C.check(game, p.id, ans);
      if (r.blocked) { feed.textContent = r.reason; return; }
      if (r.ok) {
        if (p.type === 'blocks') st.answerText = ans.join('');
        feed.className = 'dt-feed ok'; feed.textContent = st.firstTry ? '✓ 解開了！第一次就成功！' : '✓ 解開了！你用證據找到答案。';
        tone('ok'); pendingVisual = p.type; say('解開了');
        actions.replaceChildren(h('button', { class: 'btn primary', type: 'button', onclick: () => { closeModal(); play(); if (p.type === 'final') escapeRoom(); } }, p.type === 'final' ? '打開大門 🚪' : '繼續'));
        actions.querySelector('button').focus();
      } else {
        feed.className = 'dt-feed bad'; tone('bad'); onWrong(r); say(feed.textContent);
        // 錯兩次以上自動送上一級提示（紀錄為使用提示）
        if (st.tries >= 2 && st.hints < 3) hintBtn.click();
      }
    };
    frame(`${room.items.findIndex((it) => it.id === p.id) + 1}. ${room.items.find((it) => it.id === p.id)?.label || C.NAMES[p.type]}${p.lesson && game.mode === 'cross' ? `（第${p.lesson}課）` : ''}`, [
      h('div', { class: 'qhead' }, [h('div', {}, intro), spk(intro + (p.stem || ''), '朗讀說明')]), hint, ...body, evidencePanel, feed, actions,
    ]);
    say(intro + (p.stem || ''));
  }

  // ---------- 逃出與成果 ----------
  function escapeRoom() {
    if (escaping || recorded || !C.escape(game)) return;
    escaping = true; const currentGame = game; const currentRoom = room;
    game.stage = 6; tone('open'); if (room) room.animate('escape');
    const finish = () => { if (game === currentGame && room === currentRoom && escaping) results(); };
    escapeTimer = setTimeout(finish, room && room.is3d && !settings.calm && !matchMedia('(prefers-reduced-motion: reduce)').matches && !document.hidden ? 760 : 0);
  }
  function results() {
    if (recorded) return; recorded = true; clearTimeout(escapeTimer);
    game.stage = 7; closeModal();
    const s = C.summary(game);
    const key = game.mode === 'cross' ? `X${game.lessons.join('-')}` : `L${game.lessons[0]}`;
    const all = load(RKEY, {}); const g = all[gradeKey()] || (all[gradeKey()] = {});
    g[key] = { date: new Date().toISOString().slice(0, 10), level: game.level, first: s.first, total: s.total, hints: s.hints };
    save(RKEY, all);
    if (room) { room.dispose(); room = null; }
    const skills = [...new Set(s.rows.map((r) => r.skill))];
    app.replaceChildren(
      topbar('課文偵探密室｜複習成果'), stepper(),
      h('div', { class: 'setup dt-res' }, [
        h('div', { class: 'dt-escape' }, '🎉 成功逃出密室！'),
        h('p', { class: 'dt-big' }, `${game.title}｜${game.L.label}（${game.L.role}）`),
        h('p', {}, `第一次就完成 ${s.first}／${s.total} 個謎題，一共使用 ${s.hints} 次提示。`),
        h('table', {}, [h('thead', {}, h('tr', {}, ['謎題', '練習能力', '完成情形'].map((t) => h('th', {}, t)))),
          h('tbody', {}, s.rows.map((r) => h('tr', {}, [h('td', {}, r.name + (game.mode === 'cross' && r.lesson ? `（第${r.lesson}課）` : '')), h('td', {}, r.skill), h('td', {}, r.status)])))]),
        h('h2', {}, '這次練習的能力'), h('p', {}, skills.join('、')),
        h('h2', {}, '需要再複習'),
        s.review.length ? h('ul', {}, s.review.map((t) => h('li', {}, t))) : h('p', {}, '全部第一次就完成，太厲害了！'),
        h('p', { class: 'note' }, '紀錄只存在這台裝置的瀏覽器，不含姓名。'),
        h('div', { class: 'row' }, [
          h('button', { class: 'btn primary', type: 'button', onclick: start }, '🔄 再玩一次'),
          h('button', { class: 'btn', type: 'button', onclick: setup }, '換一課'),
          h('a', { class: 'btn', href: `./?g=${gradeKey()}` }, '回遊戲選單'),
        ]),
      ]),
    );
    say(`成功逃出密室！第一次就完成 ${s.first} 個謎題`);
  }

  settings = Object.assign({ mode: 'single', lesson: 1, cross: [], level: 'standard', autoSpeak: false, sound: true, calm: false, proj: false }, load(SKEY, {}));
  loadBank().then((b) => {
    bank = b;
    settings.cross = settings.cross.filter((n) => bank.rooms.some((r) => r.no === n && r.playable));
    setup();
  }).catch((e) => { app.textContent = e.message; });
  window.DT_DEBUG = { get game() { return game; }, pick, start };
})();
