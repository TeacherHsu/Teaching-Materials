/* 課文偵探密室 2.0：三幕案件純邏輯（不碰 DOM），瀏覽器與 node 測試共用。
   設計依據 DETECTIVE-REDESIGN.md。資料由 tools/build_detective.py 產生（room.acts）。
   第一幕還原經過（搜查＋補字修復線索卡＋時間線）→ 第二幕證物袋＋證人對質 → 第三幕主張、證據、理由。 */
(function (root) {
  'use strict';
  const LEVELS = {
    support: { label: '支持', role: '引導型偵探', clues: 3, torn: 2, fragChoices: 2, bags: 2, wordItems: 2, rounds: 1, decoys: 0, claimEvidence: 1, reasoning: 'auto', oneAtATime: true, autoHint: true },
    standard: { label: '標準', role: '獨立型偵探', clues: 4, torn: 3, fragChoices: 3, bags: 3, wordItems: 3, rounds: 1, decoys: 1, claimEvidence: 2, reasoning: 'arrange', oneAtATime: false, autoHint: false },
    challenge: { label: '挑戰', role: '推理型偵探', clues: 6, torn: 6, fragChoices: 4, bags: 3, wordItems: 4, rounds: 2, decoys: 2, claimEvidence: 2, reasoning: 'arrange', oneAtATime: false, autoHint: false },
  };
  const STEP_NAMES = {
    search: '搜查並修復線索卡', timeline: '排好時間線', bag: '打開證物袋', confront: '證人對質',
    claim: '說出主張', evidence: '附上證據', reasoning: '組出推理句',
  };
  const SKILLS = {
    search: '提取訊息、字形辨識', timeline: '事件排序、文章結構', words: '語詞理解', sentence: '句型與語序', listen: '聆聽理解', meaning: '一字多義',
    confront: '推論訊息、以證據判斷', claim: '詮釋整合（主旨）', evidence: '選擇支持的證據', reasoning: '說明理由（主張—證據—理由）',
  };
  const BAG_NAMES = { words: '🔤 詞語密碼袋', sentence: '🧩 句子拼圖袋', listen: '🎧 錄音證詞袋', meaning: '🔍 字義放大鏡袋' };
  const MAX_TRIES = 3; // 第三次錯：示範後記為「一起學過」並前進，不會卡關

  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function shuffle(a, r) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const strip = (s) => String(s).replace(/[。，、！？；：「」『』﹁﹂…—\s]/g, '');
  function blocksOk(item, seq) {
    const s = seq.map(strip);
    if (item.accepted) return item.accepted.some((a) => a.length === s.length && a.every((x, i) => strip(x) === s[i]));
    if (s.length !== item.frame.length) return false;
    return item.frame.every((p, i) => (p === 'S' ? item.fillers[i].map(strip).includes(s[i]) : strip(p) === s[i]));
  }

  function build(bank, lessonNo, levelKey, seed) {
    const L = LEVELS[levelKey] || LEVELS.standard;
    const r = rng(seed);
    const room = bank.rooms.find((x) => x.no === lessonNo);
    if (!room || !room.acts) throw new Error('這一課的三幕案件資料還不完整');
    const A = room.acts;
    // 對質回合：優先用對得到線索卡的題目
    const rounds = A.confront.slice(0, L.rounds).map((c, i) => {
      const liar = shuffle(c.wrong, r)[0];
      const witnesses = shuffle([{ text: c.truth, lying: false }, { text: liar, lying: true }], r);
      return { id: `r${i + 1}`, stem: c.stem, witnesses, evidence: c.evidence.slice(), hints: c.hints || [], truth: c.truth };
    });
    const must = rounds.flatMap((x) => x.evidence);
    // 線索卡：必含開頭、結尾、對質要用的證據段落
    let clues = room.clues;
    if (clues.length > L.clues) {
      const keep = new Set([clues[0].id, clues[clues.length - 1].id, ...must]);
      for (const c of clues) { if (keep.size >= L.clues) break; keep.add(c.id); }
      clues = clues.filter((c) => keep.has(c.id));
    }
    // 撕破的卡：用形似字補字；沒有形似字就用語詞意思二選一
    const frags = shuffle(A.fragments, r);
    const torn = {};
    shuffle(clues.map((c) => c.id), r).slice(0, L.torn).forEach((id, i) => {
      const f = frags[i % Math.max(frags.length, 1)];
      if (f) torn[id] = { kind: 'char', word: f.word, blank: f.blank, answer: f.answer, choices: shuffle([f.answer, ...shuffle(f.wrong, r).slice(0, L.fragChoices - 1)], r) };
      else if (A.fragWords.length >= 2) {
        const [a, b] = shuffle(A.fragWords, r);
        torn[id] = { kind: 'meaning', word: a.word, meaning: a.meaning, answer: a.word, choices: shuffle([a.word, b.word], r) };
      }
    });
    const decoys = A.claim.options.slice(0, L.decoys).map((text, i) => ({ id: `d${i + 1}`, text, decoy: true }));
    const bags = shuffle(A.bags, r).slice(0, L.bags).map((b, i) => {
      const bag = { id: `bag${i + 1}`, type: b.type };
      if (b.type === 'words') {
        const items = shuffle(b.items, r).slice(0, L.wordItems);
        bag.locks = items.map((k) => ({ meaning: k.meaning, answer: k.word }));
        bag.keys = shuffle(items.map((k) => k.word), r);
      } else if (b.type === 'sentence') {
        const item = b.items[Math.floor(r() * b.items.length)];
        bag.item = item; bag.structure = item.structure;
        bag.blocks = shuffle(item.accepted ? item.accepted[0] : item.rows[Math.floor(r() * item.rows.length)], r);
      } else if (b.type === 'meaning') {
        const it = b.items[Math.floor(r() * b.items.length)];
        Object.assign(bag, { char: it.char, sentence: it.sentence, answer: it.answer, choices: shuffle(it.options, r) });
      } else {
        const it = b.items[Math.floor(r() * b.items.length)];
        Object.assign(bag, { stem: it.stem, question: it.question, answer: it.answer, choices: shuffle(it.options, r) });
      }
      return bag;
    });
    // 證物袋的獎勵：對質要用的證據段落標成「★已證實」，錄音袋另得一張錄音證物
    const starQueue = [...new Set(must)];
    bags.forEach((b) => { b.reward = b.type === 'listen' ? { kind: 'listen', id: 'ev-listen', text: b.stem } : (starQueue.length ? { kind: 'star', id: starQueue.shift() } : null); });
    // 推理句用主旨短句（theme）；沒有就用完整主旨
    const claim = { answer: A.claim.answer, short: A.claim.theme || A.claim.answer, choices: shuffle([A.claim.answer, ...A.claim.options], r) };
    const game = {
      v: 2, grade: bank.grade, lesson: room.no, title: `第${room.no}課 ${room.title}`, theme: room.sceneTheme, caseType: A.caseType,
      question: A.question, level: levelKey, L, seed, clues, torn, decoys, bags, rounds, claim, sourceRefs: room.sourceRefs,
    };
    game.state = fresh(game);
    return game;
  }

  function fresh(game) {
    const steps = { search: 0, timeline: 0, claim: 0, evidence: 0, reasoning: 0 };
    const rec = {};
    const add = (id, skill) => { rec[id] = { tries: 0, hints: 0, done: false, learned: false, skill }; };
    game.clues.forEach((c) => { if (game.torn[c.id]) add(`frag-${c.id}`, SKILLS.search); });
    add('timeline', SKILLS.timeline);
    game.bags.forEach((b) => add(b.id, SKILLS[b.type]));
    game.rounds.forEach((x) => add(x.id, SKILLS.confront));
    ['claim', 'evidence', 'reasoning'].forEach((k) => add(k, SKILLS[k]));
    void steps;
    return { act: 1, found: [], fixed: [], stars: [], extra: [], rec, chosenClaim: null, chosenEvidence: [], sentence: null, finished: false };
  }

  // ---------- 證物（筆記本與第三幕可選） ----------
  function evidencePool(game) {
    const s = game.state;
    const pool = game.clues.filter((c) => s.fixed.includes(c.id)).map((c) => ({ id: c.id, text: c.text, kind: 'clue', star: s.stars.includes(c.id), order: c.order }));
    if (s.rec.timeline.done) pool.unshift({ id: 'ev-timeline', text: '時間線：' + game.clues.map((c) => c.text).join(' → '), kind: 'timeline' });
    s.extra.forEach((e) => pool.push(e));
    game.decoys.filter((d) => s.found.includes(d.id)).forEach((d) => pool.push({ id: d.id, text: d.text, kind: 'decoy', decoy: true }));
    return pool;
  }

  // ---------- 判定共用：錯三次自動前進 ----------
  function settle(game, id, ok) {
    const r = game.state.rec[id];
    if (r.done) return { ok: true, already: true };
    r.tries += 1;
    if (ok) { r.done = true; r.first = r.tries === 1 && r.hints === 0; return { ok: true }; }
    if (r.tries >= MAX_TRIES) { r.done = true; r.learned = true; return { ok: false, learned: true }; }
    return { ok: false, tries: r.tries };
  }
  function hint(game, id) { const r = game.state.rec[id]; r.hints = Math.min(3, r.hints + 1); return r.hints; }

  // ---------- 第一幕 ----------
  function investigate(game, holder) {
    const s = game.state;
    if (!s.found.includes(holder)) s.found.push(holder);
    const clue = game.clues.find((c) => c.id === holder);
    if (clue && !game.torn[holder] && !s.fixed.includes(holder)) s.fixed.push(holder);
    return { clue, decoy: game.decoys.find((d) => d.id === holder), torn: clue ? game.torn[holder] : null };
  }
  function fixFragment(game, clueId, choice) {
    const t = game.torn[clueId];
    const res = settle(game, `frag-${clueId}`, choice === t.answer);
    if (game.state.rec[`frag-${clueId}`].done && !game.state.fixed.includes(clueId)) game.state.fixed.push(clueId);
    return res;
  }
  const searchDone = (game) => game.clues.every((c) => game.state.fixed.includes(c.id));
  function placeTimeline(game, order) {
    if (!searchDone(game)) return { blocked: true };
    const wrongAt = order.findIndex((id, i) => id !== game.clues[i].id);
    const res = settle(game, 'timeline', order.length === game.clues.length && wrongAt < 0);
    if (game.state.rec.timeline.done) game.state.act = Math.max(game.state.act, 2);
    return Object.assign(res, { wrongAt });
  }

  // ---------- 第二幕 ----------
  function openBag(game, bagId, answer) {
    if (game.state.act < 2) return { blocked: true };
    const b = game.bags.find((x) => x.id === bagId);
    let ok = false; let detail = null;
    if (b.type === 'words') { const bad = b.locks.map((l, i) => answer[i] !== l.answer); ok = bad.every((x) => !x); detail = { bad }; }
    else if (b.type === 'sentence') ok = answer.length === b.blocks.length && blocksOk(b.item, answer);
    else ok = answer === b.answer;
    const res = settle(game, bagId, ok);
    if (game.state.rec[bagId].done && b.reward) {
      if (b.reward.kind === 'star' && !game.state.stars.includes(b.reward.id)) game.state.stars.push(b.reward.id);
      if (b.reward.kind === 'listen' && !game.state.extra.some((e) => e.id === b.reward.id)) game.state.extra.push({ id: b.reward.id, text: '錄音證詞：' + b.reward.text, kind: 'listen' });
    }
    return Object.assign(res, { detail });
  }
  const bagsDone = (game) => game.bags.every((b) => game.state.rec[b.id].done);
  // 對質：指出說錯的證人，並附上能證明的證物（題目對不到線索卡時免附）
  function confront(game, roundId, { liar, evidence }) {
    if (game.state.act < 2 || !bagsDone(game)) return { blocked: true };
    const x = game.rounds.find((q) => q.id === roundId);
    const liarOk = x.witnesses[liar] && x.witnesses[liar].lying;
    const evOk = !x.evidence.length || x.evidence.includes(evidence);
    const res = settle(game, roundId, liarOk && evOk);
    if (game.rounds.every((q) => game.state.rec[q.id].done)) game.state.act = Math.max(game.state.act, 3);
    return Object.assign(res, { liarOk, evOk });
  }

  // ---------- 第三幕 ----------
  function chooseClaim(game, choice) {
    if (game.state.act < 3) return { blocked: true };
    const res = settle(game, 'claim', choice === game.claim.answer);
    if (game.state.rec.claim.done) game.state.chosenClaim = game.claim.answer;
    return res;
  }
  function chooseEvidence(game, ids) {
    if (!game.state.rec.claim.done) return { blocked: true };
    // 時間線是整段經過，只留在筆記本，不當推理句的證據
    const real = evidencePool(game).filter((e) => !e.decoy && e.kind !== 'timeline').map((e) => e.id);
    const need = game.L.claimEvidence;
    const decoyPicked = ids.some((id) => !real.includes(id));
    const ok = ids.length >= need && !decoyPicked && new Set(ids).size === ids.length;
    const res = settle(game, 'evidence', ok);
    if (game.state.rec.evidence.done) game.state.chosenEvidence = ok ? ids.slice(0, need) : real.slice(0, need);
    return Object.assign(res, { decoyPicked, need });
  }
  // 推理句：只檢查結構——第一格放主張，後面放自己選的證據（順序不拘）
  function reasoningCards(game) {
    const pool = evidencePool(game);
    return [{ id: 'claim', text: game.claim.short, kind: 'claim' }, ...game.state.chosenEvidence.map((id) => pool.find((e) => e.id === id))];
  }
  function buildReasoning(game, order) {
    if (!game.state.rec.evidence.done) return { blocked: true };
    const ev = game.state.chosenEvidence;
    const ok = order[0] === 'claim' && order.length === ev.length + 1 && ev.every((id) => order.includes(id));
    const res = settle(game, 'reasoning', ok);
    if (game.state.rec.reasoning.done) { game.state.sentence = sentenceOf(game); game.state.finished = true; }
    return res;
  }
  function sentenceOf(game) {
    const cards = reasoningCards(game);
    const plain = (t) => String(t).replace(/^(時間線|錄音證詞)：/, '').replace(/[。．]$/, '');
    const parts = cards.slice(1).map((c) => plain(c.text));
    return `我認為${plain(cards[0].text)}，因為${parts[0] || ''}${parts[1] ? `，而且${parts[1]}` : ''}。`;
  }

  function summary(game) {
    const rows = Object.entries(game.state.rec).map(([id, r]) => ({
      id, skill: r.skill, status: !r.done ? '未完成' : r.learned ? '一起學過' : r.first ? '自己想到' : '看提示或再試後想到', hints: r.hints,
    }));
    const review = [];
    game.clues.forEach((c) => { const r = game.state.rec[`frag-${c.id}`]; if (r && !r.first) { const t = game.torn[c.id]; review.push(t.kind === 'char' ? `${t.word}（${t.answer}）` : `${t.word}：${t.meaning}`); } });
    game.bags.forEach((b) => { if (game.state.rec[b.id].first) return; if (b.type === 'words') b.locks.forEach((l) => review.push(`${l.answer}：${l.meaning}`)); else if (b.type === 'sentence') review.push(`句型：${b.structure || b.blocks.join('')}`); else if (b.type === 'meaning') review.push(`「${b.char}」：${b.sentence}`); else review.push(`錄音題：${b.question}`); });
    game.rounds.forEach((x) => { if (!game.state.rec[x.id].first) review.push(`對質：${x.stem}（${x.truth}）`); });
    if (!game.state.rec.timeline.first) review.push('事件的先後順序');
    if (!game.state.rec.claim.first) review.push('本課的主旨');
    return { rows, self: rows.filter((r) => r.status === '自己想到').length, total: rows.length, hints: rows.reduce((a, r) => a + r.hints, 0), review, sentence: game.state.sentence };
  }

  // 存檔：只存種子與狀態，載入時用同一種子重建題目
  function save(game) { return { v: 2, lesson: game.lesson, level: game.level, seed: game.seed, state: game.state }; }
  function load(bank, data) { const g = build(bank, data.lesson, data.level, data.seed); g.state = data.state; return g; }

  root.Detective2 = { LEVELS, STEP_NAMES, SKILLS, BAG_NAMES, MAX_TRIES, build, investigate, fixFragment, searchDone, placeTimeline, openBag, bagsDone, confront, chooseClaim, chooseEvidence, reasoningCards, buildReasoning, evidencePool, hint, summary, save, load, blocksOk, shuffle, rng };
})(typeof window !== 'undefined' ? window : globalThis);
