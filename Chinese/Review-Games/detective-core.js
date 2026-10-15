/* 課文偵探密室：純邏輯核心（不碰 DOM），瀏覽器與 node 測試共用。
   關卡資料由 tools/build_detective.py 產生；這裡依難度組出一局、檢查答案、管理解鎖與紀錄。 */
(function (root) {
  'use strict';

  // 沿用既有三級（支持／標準／挑戰），只改變思考與理解要求，不縮字、不限時、不藏物件
  const LEVELS = {
    support: { label: '支持', role: '引導型偵探', clues: 3, decoys: 0, mechs: 3, dials: 1, dialChars: 2, keys: 2, keyDecoys: 0, blockDistract: 0, choices: 2, causeEvidence: false, finalEvidence: 0, autoHint: true, oneAtATime: true },
    standard: { label: '標準', role: '獨立型偵探', clues: 4, decoys: 1, mechs: 4, dials: 2, dialChars: 3, keys: 3, keyDecoys: 1, blockDistract: 1, choices: 3, causeEvidence: false, finalEvidence: 2, autoHint: false, oneAtATime: false },
    challenge: { label: '挑戰', role: '推理型偵探', clues: 6, decoys: 2, mechs: 5, dials: 3, dialChars: 4, keys: 4, keyDecoys: 2, blockDistract: 1, choices: 4, causeEvidence: true, finalEvidence: 2, autoHint: false, oneAtATime: false },
  };
  const SKILLS = {
    search: '線索觀察', sort: '事件排序', dial: '國字辨識（形似字）', keys: '語詞理解',
    blocks: '句型與語序', compare: '提取訊息、證據比對', cause: '因果推理', final: '統整推理',
  };
  const NAMES = {
    search: '搜查現場', sort: '排好案件時間線', dial: '國字密碼鎖', keys: '語詞鑰匙',
    blocks: '詞塊密語', compare: '證詞比對', cause: '原因推理機', final: '最終推理',
  };
  const MECH_ORDER = ['compare', 'keys', 'dial', 'blocks', 'cause'];

  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function shuffle(arr, rand) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const strip = (s) => String(s).replace(/[。，、！？；：「」『』﹁﹂…—\s]/g, '');

  // 從全部線索中挑出本局要找的：必含開頭、結尾與謎題引用的證據，其餘依序補滿
  function pickClues(clues, n, must) {
    if (clues.length <= n) return clues.slice();
    const keep = new Set([clues[0].id, clues[clues.length - 1].id, ...must.filter((id) => clues.some((c) => c.id === id))]);
    for (const c of clues) { if (keep.size >= n) break; keep.add(c.id); }
    return clues.filter((c) => keep.has(c.id)).slice(0, Math.max(n, keep.size));
  }

  function choiceSet(p, n, rand) {
    return shuffle([p.answer, ...shuffle(p.options, rand).slice(0, n - 1)], rand);
  }

  // 詞塊：有 accepted（教師確認的多解清單）就比對清單；否則依句型結構逐槽檢查
  function blocksOk(item, seq) {
    const s = seq.map(strip);
    if (item.accepted) return item.accepted.some((a) => a.length === s.length && a.every((x, i) => strip(x) === s[i]));
    if (s.length !== item.frame.length) return false;
    return item.frame.every((part, i) => (part === 'S' ? item.fillers[i].map(strip).includes(s[i]) : strip(part) === s[i]));
  }

  function buildPuzzle(type, src, L, rand, ctx) {
    const p = { id: type, type, lesson: ctx.lesson, deps: [] };
    if (type === 'search') return p;
    if (type === 'sort') { p.deps = ['search']; p.cards = shuffle(ctx.clues.map((c) => c.id), rand); p.answer = ctx.clues.map((c) => c.id); return p; }
    if (type === 'dial') {
      p.deps = ['sort'];
      p.items = shuffle(src.items, rand).slice(0, L.dials).map((it) => ({
        word: it.word, blank: it.blank, answer: it.answer,
        chars: shuffle([it.answer, ...shuffle(it.wrong, rand).slice(0, L.dialChars - 1)], rand),
      }));
      return p;
    }
    if (type === 'keys') {
      p.deps = ['sort'];
      const pool = shuffle(src.items, rand);
      p.locks = pool.slice(0, L.keys).map((k) => ({ meaning: k.meaning, answer: k.word }));
      const used = new Set(p.locks.map((l) => l.answer));
      const decoys = pool.slice(L.keys).filter((k) => !used.has(k.word)).slice(0, L.keyDecoys).map((k) => k.word);
      p.keys = shuffle([...p.locks.map((l) => l.answer), ...decoys], rand);
      return p;
    }
    if (type === 'blocks') {
      p.deps = ['sort'];
      const item = src.items[Math.floor(rand() * src.items.length)];
      const row = item.rows[Math.floor(rand() * item.rows.length)];
      p.item = item; p.structure = item.structure;
      let extra = [];
      if (L.blockDistract && ctx.otherBlocks.length) {
        // 干擾詞塊不能是本句型任何槽位可接受的詞，否則就變成另一個正解
        const valid = new Set([...(item.fillers || []).flat(), ...(item.accepted || []).flat(), ...row].map(strip));
        const cand = shuffle(ctx.otherBlocks, rand).find((b) => !valid.has(strip(b)));
        if (cand) extra = [cand];
      }
      p.blocks = shuffle([...row, ...extra], rand);
      p.need = row.length;
      return p;
    }
    if (type === 'compare' || type === 'cause') {
      p.deps = ['search'];
      p.stem = src.stem; p.answer = src.answer; p.hintsText = src.hints || []; p.tag = src.tag;
      p.choices = choiceSet(src, Math.min(L.choices + (type === 'cause' ? 0 : 0), src.options.length + 1), rand);
      p.evidence = (src.evidence || []).filter((id) => ctx.clues.some((c) => c.id === id));
      p.needEvidence = type === 'cause' && L.causeEvidence && p.evidence.length > 0;
      return p;
    }
    if (type === 'final') {
      p.answer = src.answer;
      p.choices = shuffle([src.answer, ...src.options], rand);
      p.needEvidence = L.finalEvidence;
      return p;
    }
    throw new Error('unknown puzzle ' + type);
  }

  function otherBlocksOf(rooms, room) {
    const out = [];
    for (const r of rooms) {
      if (r === room || !r.puzzles.blocks) continue;
      for (const it of r.puzzles.blocks.items) for (const row of it.rows) for (const b of row) if (strip(b).length >= 2) out.push(b);
    }
    return out;
  }

  // 單課密室
  function makeRoom(bank, lessonNo, levelKey, seed) {
    const L = LEVELS[levelKey] || LEVELS.standard;
    const rand = rng(seed || Date.now());
    const room = bank.rooms.find((r) => r.no === lessonNo);
    if (!room || !room.playable) throw new Error('這一課的密室資料還不完整');
    const P = room.puzzles;
    const mechs = MECH_ORDER.filter((t) => P[t]).slice(0, L.mechs);
    const must = mechs.filter((t) => t === 'compare' || t === 'cause').flatMap((t) => P[t].evidence || []);
    const clues = pickClues(room.clues, L.clues, must);
    const ctx = { lesson: room.no, clues, otherBlocks: otherBlocksOf(bank.rooms, room) };
    const puzzles = ['search', 'sort', ...mechs].map((t) => buildPuzzle(t, P[t], L, rand, ctx));
    const final = buildPuzzle('final', P.final, L, rand, ctx);
    final.deps = puzzles.map((p) => p.id);
    puzzles.push(final);
    const decoys = (P.final.options || []).slice(0, L.decoys).map((text, i) => ({ id: `d${i + 1}`, text, decoy: true }));
    return finish({ mode: 'single', grade: bank.grade, lessons: [room.no], title: `第${room.no}課 ${room.title}`, theme: room.sceneTheme, roomId: room.roomId, level: levelKey, L, clues, decoys, puzzles });
  }

  // 跨課綜合密室：教師選 2 課以上；機關輪流取自不同課，最終推理是「主旨配對課名」
  function makeCross(bank, lessonNos, levelKey, seed) {
    const L = LEVELS[levelKey] || LEVELS.standard;
    const rand = rng(seed || Date.now());
    const rooms = lessonNos.map((n) => bank.rooms.find((r) => r.no === n)).filter((r) => r && r.playable);
    if (rooms.length < 2) throw new Error('跨課複習至少要選兩課可玩的課次');
    const base = rooms[Math.floor(rand() * rooms.length)];
    const clues = pickClues(base.clues, L.clues, []);
    const puzzles = [buildPuzzle('search', null, L, rand, { lesson: base.no }), buildPuzzle('sort', null, L, rand, { lesson: base.no, clues })];
    let i = 0;
    for (const t of MECH_ORDER) {
      if (puzzles.length - 2 >= L.mechs) break;
      const owners = rooms.filter((r) => r.puzzles[t]);
      if (!owners.length) continue;
      const r = owners[(i++) % owners.length];
      const ctx = { lesson: r.no, clues: r === base ? clues : [], otherBlocks: otherBlocksOf(bank.rooms, r) };
      puzzles.push(buildPuzzle(t, r.puzzles[t], L, rand, ctx));
    }
    const pick = shuffle(rooms, rand).slice(0, Math.min(rooms.length, levelKey === 'support' ? 2 : levelKey === 'standard' ? 3 : 4));
    const final = {
      id: 'final', type: 'final', cross: true, deps: puzzles.map((p) => p.id), lesson: null,
      pairs: shuffle(pick.map((r) => ({ gist: r.puzzles.final.answer, answer: `第${r.no}課 ${r.title}` })), rand),
    };
    final.titles = shuffle(final.pairs.map((p) => p.answer), rand);
    puzzles.push(final);
    return finish({ mode: 'cross', grade: bank.grade, lessons: rooms.map((r) => r.no), title: `跨課綜合案件（第${rooms.map((r) => r.no).join('、')}課）`, theme: 'museum', roomId: 'cross', level: levelKey, L, clues, decoys: [], puzzles, baseLesson: base.no });
  }

  function finish(game) {
    game.objects = [
      ...game.clues.map((c) => ({ id: `obj-${c.id}`, holds: c.id, role: 'clue' })),
      ...game.decoys.map((d) => ({ id: `obj-${d.id}`, holds: d.id, role: 'decoy' })),
    ];
    game.state = { found: [], solved: {}, log: [], escaped: false, started: Date.now() };
    for (const p of game.puzzles) game.state.solved[p.id] = { done: false, tries: 0, hints: 0, wrong: [] };
    return game;
  }

  const puzzle = (game, id) => game.puzzles.find((p) => p.id === id);
  function isOpen(game, id) {
    const p = puzzle(game, id);
    return !!p && p.deps.every((d) => game.state.solved[d].done);
  }
  // 線索搜尋：只有真的線索才計入，干擾紙條記為「尚未證實的推測」
  function investigate(game, objId) {
    const o = game.objects.find((x) => x.id === objId);
    if (!o) return { kind: 'none' };
    if (!game.state.found.includes(o.holds)) game.state.found.push(o.holds);
    const real = game.clues.filter((c) => game.state.found.includes(c.id)).length;
    if (real === game.clues.length && !game.state.solved.search.done) {
      game.state.solved.search.done = true; game.state.solved.search.tries = 1;
    }
    return { kind: o.role, item: o.role === 'clue' ? game.clues.find((c) => c.id === o.holds) : game.decoys.find((d) => d.id === o.holds), progress: [real, game.clues.length] };
  }

  // 檢查答案：回傳 { ok, detail }，detail 讓介面指出哪裡要再檢查，但不公布答案
  function check(game, id, answer) {
    const p = puzzle(game, id);
    if (!p) return { ok: false, blocked: true };
    if (!isOpen(game, id)) return { ok: false, blocked: true, reason: '這個機關還鎖著，先完成前面的任務。' };
    const st = game.state.solved[id];
    if (st.done) return { ok: true, already: true };
    let ok = false; let detail = null;
    if (p.type === 'sort') {
      const wrongAt = answer.findIndex((x, i) => x !== p.answer[i]);
      ok = answer.length === p.answer.length && wrongAt < 0; detail = { wrongAt };
    } else if (p.type === 'dial') {
      const bad = p.items.map((it, i) => answer[i] !== it.answer);
      ok = bad.every((b) => !b); detail = { bad };
    } else if (p.type === 'keys') {
      const bad = p.locks.map((l, i) => answer[i] !== l.answer);
      ok = bad.every((b) => !b); detail = { bad };
    } else if (p.type === 'blocks') {
      ok = answer.length === p.need && blocksOk(p.item, answer);
    } else if (p.type === 'compare' || p.type === 'cause') {
      const choiceOk = answer.choice === p.answer;
      const evOk = !p.needEvidence || (answer.evidence || []).some((e) => p.evidence.includes(e));
      ok = choiceOk && evOk; detail = { choiceOk, evOk };
    } else if (p.type === 'final' && p.cross) {
      const bad = p.pairs.map((pr, i) => answer[i] !== pr.answer);
      ok = bad.every((b) => !b); detail = { bad };
    } else if (p.type === 'final') {
      const choiceOk = answer.choice === p.answer;
      const ev = answer.evidence || [];
      const realIds = game.clues.map((c) => c.id);
      const evOk = ev.length >= p.needEvidence && ev.every((e) => realIds.includes(e));
      ok = choiceOk && evOk; detail = { choiceOk, evOk, decoyPicked: ev.some((e) => !realIds.includes(e)) };
    }
    st.tries += 1;
    if (ok) { st.done = true; st.firstTry = st.tries === 1 && st.hints === 0; }
    else st.wrong.push(answer);
    game.state.log.push({ id, ok, t: Date.now() });
    return { ok, detail };
  }
  function useHint(game, id) {
    const st = game.state.solved[id];
    st.hints = Math.min(3, st.hints + 1);
    return st.hints;
  }
  function canEscape(game) { return game.state.solved.final.done; }
  function escape(game) { if (!canEscape(game)) return false; game.state.escaped = true; return true; }

  function summary(game) {
    const rows = game.puzzles.map((p) => {
      const st = game.state.solved[p.id];
      const status = p.type === 'search' ? (st.done ? '線索全部找到' : '未完成') : !st.done ? '未完成' : st.firstTry ? '第一次就完成' : st.hints ? `用了 ${st.hints} 次提示後完成` : `試了 ${st.tries} 次後完成`;
      return { id: p.id, name: NAMES[p.type], skill: SKILLS[p.type], lesson: p.lesson, done: st.done, firstTry: !!st.firstTry, hints: st.hints, tries: st.tries, status };
    });
    const graded = rows.filter((r) => r.id !== 'search');
    const first = graded.filter((r) => r.firstTry).length;
    const review = [];
    for (const p of game.puzzles) {
      const st = game.state.solved[p.id];
      if (st.firstTry || p.type === 'search') continue;
      if (p.type === 'dial') p.items.forEach((it) => review.push(`${it.word}（${it.answer}）`));
      else if (p.type === 'keys') p.locks.forEach((l) => review.push(`${l.answer}：${l.meaning}`));
      else if (p.type === 'blocks') review.push(`句型：${p.structure || p.item.rows[0].join('')}`);
      else if (p.type === 'sort') review.push(`第${p.lesson}課的事件順序`);
      else if (p.type === 'compare' || p.type === 'cause') review.push(`第${p.lesson}課：${p.stem}`);
      else if (p.type === 'final') review.push(p.cross ? '各課的主旨' : `第${p.lesson || game.lessons[0]}課的主旨`);
    }
    return { rows, first, total: graded.length, hints: rows.reduce((s, r) => s + r.hints, 0), review };
  }

  root.DetectiveCore = { LEVELS, SKILLS, NAMES, makeRoom, makeCross, isOpen, investigate, check, useHint, canEscape, escape, summary, blocksOk, rng, shuffle };
})(typeof window !== 'undefined' ? window : globalThis);
