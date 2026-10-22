import { h, clear } from '../utils/dom.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { getReading, unlockWithPassword, cryptoAvailable } from '../utils/classroomKey.js';
import { splitSentences } from '../utils/readingUnits.js';
import { cancelSpeaking } from '../utils/speech.js';
import { getFirstPersonLesson, clueRefs } from '../data/firstPersonLesson.js';
import { answerScene, canAnswer, readProgress, saveProgress, reward } from '../activities/firstPersonCore.js';
import { mountFirstPersonScene } from '../activities/firstPersonScene.js';
import '../styles/first-person.css';

const button = (text, action, attrs = {}) => h('button', { type: 'button', class: 'fp-button', onclick: action, ...attrs }, text);
const say = (text, tag = 'p', attrs = {}) => h('div', { class: 'fp-spoken' }, [h(tag, attrs, text), SpeakButton({ text })]);
const PREF_KEY = 'mandarin:explore:settings';
const emptyState = () => ({ found: [], done: false, hints: 0, attempts: 0, questionIndex: 0, hintUses: 0 });

export function FirstPersonPage(lesson) {
  const config = getFirstPersonLesson(lesson.lesson_id);
  const root = h('div', { class: 'fp-page' });
  if (!config) { root.append(say('這一課還沒有第一人稱探索試作。')); return root; }
  document.body.classList.add('fp-immersive');
  let progress;
  try { progress = readProgress(config, localStorage); } catch { progress = readProgress(config, null); }
  let prefs = { sound: false, calm: false };
  try { const s = JSON.parse(localStorage.getItem(PREF_KEY)); prefs = { sound: s?.sound === true, calm: s?.calm === true }; } catch { /* 預設 */ }
  let world, generation = 0, disposed = false, replay = null, lastClue = null, feedback = '', wrong = false, readingVisible = false;
  let saved = true, audio, ambientGain, ambientSource, modal, observationTimer;
  let scene, state, sources, currentView, idleTimer, teacherAccess = false, actionQuestion = null;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const rootBody = h('div', { class: 'fp-shell' }); root.append(rootBody);
  const calm = () => prefs.calm || reduce.matches;
  function save() { try { saved = saveProgress(config, progress, localStorage); } catch { saved = false; } }
  function savePrefs() { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch { /* 這次仍生效 */ } }
  function sound() {
    const enabled = prefs.sound && !document.hidden && !modal?.open;
    if (!enabled) { if (ambientGain && audio) ambientGain.gain.setTargetAtTime(0, audio.currentTime, .15); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      audio ||= new AC(); audio.resume().catch(() => {});
      if (!ambientSource) {
        const buffer = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate), data = buffer.getChannelData(0);
        let seed = 121; for (let i = 0; i < data.length; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; data[i] = seed / 2147483648 - 1; }
        ambientSource = audio.createBufferSource(); ambientSource.buffer = buffer; ambientSource.loop = true;
        const filter = audio.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 700;
        ambientGain = audio.createGain(); ambientGain.gain.value = 0; ambientSource.connect(filter); filter.connect(ambientGain); ambientGain.connect(audio.destination); ambientSource.start();
      }
      ambientGain.gain.setTargetAtTime(scene?.id === 'root' ? .008 : scene?.id === 'welcome' ? .005 : .022, audio.currentTime, .5);
    } catch { /* 音訊不影響學習 */ }
  }
  function updateMotion() { root.classList.toggle('fp-calm', calm()); world?.setOptions?.({ calm: calm(), paused: Boolean(modal?.open) }); sound(); }
  function destroyWorld() { generation++; world?.dispose(); world = null; }
  function close() {
    if (disposed) return; disposed = true; clearTimeout(observationTimer); clearTimeout(idleTimer); destroyWorld(); cancelSpeaking(); audio?.close().catch(() => {});
    modal?.close(); modal?.remove(); document.body.classList.remove('fp-immersive');
    reduce.removeEventListener('change', updateMotion); document.removeEventListener('visibilitychange', sound);
    window.removeEventListener('hashchange', close); window.removeEventListener('pagehide', close);
  }
  window.addEventListener('hashchange', close); window.addEventListener('pagehide', close);
  reduce.addEventListener('change', updateMotion); document.addEventListener('visibilitychange', sound);

  function sheet(title, content, focus) {
    modal?.close(); modal?.remove();
    const dialog = h('dialog', { class: 'fp-sheet', 'aria-labelledby': 'fp-sheet-title' });
    dialog.append(h('div', { class: 'fp-sheet-header' }, [h('h2', { id: 'fp-sheet-title' }, title), button('✕', () => dialog.close(), { 'aria-label': '回到場景', class: 'fp-close' })]), content);
    root.append(dialog); modal = dialog;
    dialog.addEventListener('close', () => { readingVisible = false; cancelSpeaking(); updateMotion(); });
    dialog.addEventListener('click', (event) => { if (event.target === dialog && event.clientX < dialog.getBoundingClientRect().left) dialog.close(); });
    dialog.showModal(); updateMotion();
    if (focus) content.querySelector(focus)?.focus();
    return dialog;
  }

  async function start() {
    clear(rootBody);
    const reading = getReading(lesson.lesson_id);
    if (!reading) {
      const gate = h('section', { class: 'fp-gate' }, [h('p', { class: 'fp-kicker' }, '課文樂園・第一人稱探索'), h('h1', {}, config.gateTitle), say(config.introduction)]);
      const input = h('input', { type: 'password', id: 'fp-password', autocomplete: 'off', required: true });
      const status = h('p', { role: 'status' });
      const submit = button('打開課文，進入食堂', null, { type: 'submit', class: 'fp-button fp-primary' });
      const form = h('form', {}, [h('label', { for: 'fp-password' }, '請老師輸入教室密碼'), input, submit, status]);
      form.addEventListener('submit', async (event) => {
        event.preventDefault(); submit.disabled = true;
        if (!cryptoAvailable()) { status.textContent = '請使用 HTTPS 或 localhost 開啟。'; submit.disabled = false; return; }
        try { await unlockWithPassword(input.value); teacherAccess = true; input.value = ''; await start(); }
        catch { status.textContent = '還沒打開，請老師確認密碼與課文檔案，再試一次。'; submit.disabled = false; }
      });
      gate.append(form, h('a', { href: `#/lesson/${lesson.lesson_id}` }, '← 回到本課')); rootBody.append(gate); return;
    }
    const paragraphs = new Map();
    for (const s of splitSentences(reading.paras)) { if (!paragraphs.has(s.paraIndex + 1)) paragraphs.set(s.paraIndex + 1, []); paragraphs.get(s.paraIndex + 1).push(s.text); }
    sources = new Map();
    try {
      for (const sc of config.scenes) for (const clue of [...sc.clues, ...sc.questions.map(q => ({ id: `question-${q.id}`, refs: q.refs }))]) {
        const refs = clueRefs(clue, sc, lesson); if (!refs?.length) throw new Error('missing');
        const blocks = [];
        for (const ref of refs) {
          const texts = [];
          for (let i = 0; i < ref.sentences.length; i++) {
            const text = paragraphs.get(ref.para)?.[ref.sentences[i]]; if (!text) throw new Error('missing');
            const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
            const hash = [...new Uint8Array(digest)].map((v) => v.toString(16).padStart(2, '0')).join('').slice(0, 8);
            if (hash !== ref.sha[i]) throw new Error('version'); texts.push(text);
          }
          blocks.push({ para: ref.para, text: texts.join('') });
        }
        sources.set(`${sc.id}:${clue.id}`, blocks);
      }
    } catch { rootBody.append(h('div', { class: 'fp-gate' }, [say('課文與線索版本尚未對齊，請老師先核對本課原文。'), h('a', { href: `#/lesson/${lesson.lesson_id}/reader` }, '課文點讀')])); return; }
    if (!disposed) enterScene();
  }

  function enterScene() {
    clearTimeout(observationTimer); clearTimeout(idleTimer); actionQuestion = null; destroyWorld(); modal?.close(); modal?.remove(); modal = null; clear(rootBody);
    scene = config.scenes[progress.current]; state = replay || progress.scenes[progress.current]; currentView = scene.view;
    lastClue = null; feedback = ''; wrong = false;
    const completed = progress.scenes.filter((s) => s.done).length;
    const stage = h('div', { class: `fp-world fp-world--${scene.id}`, tabindex: '0', role: 'group', 'aria-label': '第一人稱場景。拖曳環顧，左右鍵轉頭；也能用下方線索按鈕。' });
    stage.append(h('div', { class: 'fp-flat', 'aria-hidden': 'true', html: flatScene(scene.id.replace(/^story-/, '')) }));
    const top = h('header', { class: 'fp-topbar' }, [h('a', { href: `#/lesson/${lesson.lesson_id}`, class: 'fp-home', 'aria-label': '離開探索，回到本課' }, '←'), h('div', {}, [h('p', { class: 'fp-kicker' }, `第${scene.act}幕・${scene.stationType === "story" ? "劇情站" : "關卡"}`), h('h1', {}, scene.title)]), button(`${progress.current + 1} / ${config.scenes.length}`, showScenes, { class: 'fp-stage-number', 'aria-label': `場景 ${progress.current + 1}，已完成 ${completed} 個。查看進度` })]);
    const mission = h('div', { class: 'fp-mission' }, [h('span', { class: 'fp-mission-dot', 'aria-hidden': 'true' }), h('p', { id: 'fp-goal' }, scene.experience.reflection), SpeakButton({ text: `${scene.goal}${scene.experience.reflection}` })]);
    const markers = h('div', { class: 'fp-markers' }), markerMap = {};
    scene.clues.forEach((clue, i) => {
      const mark = button(String(i + 1), () => observe(clue), { class: 'fp-marker', 'data-hotspot': clue.id, 'aria-label': `觀察${clue.label}`, title: clue.label });
      markerMap[clue.object] = mark; markers.append(mark);
    });
    stage.append(markers);
    const viewStatus = h('p', { class: 'fp-view-status', role: 'status' }, '拖曳環顧，或點小圓點觀察');
    const captionText = h('p', { id: 'fp-caption' }, scene.experience.caption);
    const caption = h('div', { class: 'fp-spoken fp-caption' }, [captionText, SpeakButton({ text: () => captionText.textContent })]);
    const viewButtons = h('div', { class: 'fp-view-buttons' }, [button('↶', () => { currentView = scene.view; world?.setView(currentView); }, { 'aria-label': '看起始位置' }), button('↷', () => { currentView = scene.alternateView; world?.setView(currentView); }, { 'aria-label': scene.viewLabel })]);
    viewButtons.append(button('側', () => world?.setView('side'), { 'aria-label': '側面觀察握勺與舀水動作' }));
    const readingButton = button('讀課文', showReading, { class: 'fp-button fp-primary', 'data-read': 'true' });
    const actionButton = button(scene.experience.action, playObservation, { class: 'fp-button fp-observe', 'data-observe': 'true' });
    const clueButtons = h('div', { class: 'fp-clue-dock' });
    scene.clues.forEach((clue, i) => clueButtons.append(button(`${i + 1} ${clue.label}`, () => observe(clue), { 'data-clue': clue.id, class: 'fp-clue-chip', 'aria-pressed': String(state.found.includes(clue.id)) })));
    const bottom = h('div', { class: 'fp-bottom' }, [caption, h('div', { class: 'fp-action-row' }, [actionButton, readingButton]), clueButtons]);
    const toolbar = h('nav', { class: 'fp-toolbar', 'aria-label': '閱讀工具' }, [button('提示', showHints), button('重玩', () => { replay = emptyState(); enterScene(); }), button('設定', showSettings), button('關卡一覽', showScenes)]);
    rootBody.append(stage, top, mission, viewStatus, viewButtons, bottom, toolbar);
    const mode = h('span', { class: 'fp-mode' }, '載入場景…'); rootBody.append(mode);
    let pointer;
    stage.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; pointer = { x: e.clientX, y: e.clientY }; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener('pointermove', (e) => { if (!pointer) return; world?.look((pointer.x - e.clientX) * .002, (pointer.y - e.clientY) * .0015); pointer = { x: e.clientX, y: e.clientY }; });
    stage.addEventListener('pointerup', () => { pointer = null; }); stage.addEventListener('pointercancel', () => { pointer = null; });
    stage.addEventListener('keydown', (e) => { if (e.target !== stage) return; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) { e.preventDefault(); world?.look(e.key === 'ArrowLeft' ? .08 : e.key === 'ArrowRight' ? -.08 : 0, e.key === 'ArrowUp' ? .05 : e.key === 'ArrowDown' ? -.05 : 0); } });
    const version = generation;
    mountFirstPersonScene(stage, { phase: { ...scene, id: scene.id.replace(/^story-/, "") }, calm: calm(), onMode: (label) => { if (version === generation) { mode.textContent = label; mode.hidden = label.startsWith('第一人稱'); } }, onProject: (points) => {
      for (const [object, marker] of Object.entries(markerMap)) {
        const p = points?.[object]; marker.hidden = false;
        const off = p && !p.visible;
        marker.classList.toggle('fp-marker--offscreen', Boolean(off));
        marker.textContent = off ? (Math.abs(p.y - 50) > Math.abs(p.x - 50) ? (p.y < 50 ? '↑' : '↓') : (p.x < 50 ? '←' : '→')) : String(scene.clues.findIndex(c => c.object === object) + 1);
        marker.classList.toggle('fp-marker--target', !state.found.includes(scene.clues.find(c => c.object === object)?.id));
        if (p) { marker.style.left = `${Math.max(7, Math.min(93, p.x))}%`; marker.style.top = `${Math.max(32, Math.min(62, p.y))}%`; }
      }
    } }).then((controller) => { if (disposed || version !== generation) controller.dispose(); else { world = controller; updateMotion(); } });
    updateMotion(); sound();
    function resetIdle() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { if (!disposed && !modal?.open) viewStatus.textContent = '慢慢找就好。點下方定點按鈕，就能找到線索。'; }, 10000);
    }
    rootBody.onpointerdown = resetIdle; rootBody.onkeydown = resetIdle; resetIdle();

    function observe(clue) {
      lastClue = clue;
      currentView = clue === scene.clues[1] ? scene.alternateView : scene.view;
      world?.setView(currentView);
      if (['ladle', 'cause', 'root'].includes(scene.id.replace(/^story-/, ''))) playObservation();
      const text = scene.experience.observeCaption || clue.note;
      caption.querySelector('p').textContent = text;
      readingButton.textContent = `讀${clue.label}的原文`;
      viewStatus.textContent = `正在觀察：${clue.label}`;
      sound();
    }
    function playObservation() {
      clearTimeout(observationTimer); world?.observeAction(); sound();
      if (scene.id.endsWith('root')) { currentView = 'fire'; world?.setView('fire'); }
      captionText.textContent = scene.experience.caption;
      const observing = scene.id;
      if (scene.experience.afterCaption) observationTimer = setTimeout(() => {
        if (!disposed && scene.id === observing) captionText.textContent = scene.experience.afterCaption;
      }, 8200);
    }
  }

  function showReading() {
    readingVisible = true;
    const clue = lastClue || scene.clues.find((c) => !state.found.includes(c.id)) || scene.clues[0];
    lastClue = clue;
    if (!state.found.includes(clue.id)) state.found.push(clue.id);
    root.querySelector(`[data-clue="${clue.id}"]`)?.setAttribute('aria-pressed', 'true');
    if (!replay) save();
    const content = h('div', { class: 'fp-sheet-content' });
    content.append(say(clue.note, 'p', { class: 'fp-small' }));
    for (const block of sources.get(`${scene.id}:${clue.id}`)) content.append(h('p', { class: 'fp-source' }, `課文第 ${block.para} 段・原句`), say(block.text, 'blockquote', { class: 'fp-excerpt' }));
    content.append(h('p', { class: 'fp-small fp-count' }, `已讀線索 ${state.found.length} / ${scene.clues.length}`));
    const next = scene.clues.find((c) => !state.found.includes(c.id));
    if (next) content.append(button(`回到場景，觀察${next.label}`, () => { modal.close(); lastClue = next; currentView = scene.alternateView; world?.setView(currentView); root.querySelector('[data-read]').textContent = `讀${next.label}的原文`; }, { class: 'fp-button fp-primary' }));
    else if (scene.stationType === 'story') content.append(button('已讀本段，前往關卡 →', () => { state.done = true; if (!replay) save(); advance(); }, { class: 'fp-button fp-primary' }));
    else content.append(button('想一想他的經歷 →', showQuestion, { class: 'fp-button fp-primary', 'data-challenge': 'true' }));
    sheet(clue.label, content);
  }

  function advance() { modal?.close(); progress.current = Math.min(config.scenes.length - 1, progress.current + 1); replay = null; save(); enterScene(); }
  function submitAnswer(choice) {
    const result = answerScene(scene, state, choice); if (!result) return;
    feedback = result.feedback; wrong = !result.correct;
    if (replay && state.done && !progress.scenes[progress.current].done) progress.scenes[progress.current] = { ...state, found: [...state.found] };
    if (!replay || state.done) save();
    if (result.correct && !state.done) {
      sheet('找到依據了', h('div', { class: 'fp-sheet-content' }, [say(feedback), button('下一題', () => { feedback = ''; showQuestion(); }, { class: 'fp-button fp-primary' })]));
    } else showQuestion();
  }
  function showQuestion() {
    if (!canAnswer(scene, state)) { showReading(); return; }
    const q = scene.questions[Math.min(state.questionIndex || 0, scene.questions.length - 1)];
    const content = h('div', { class: 'fp-sheet-content' });
    content.append(h('p', { class: 'fp-kicker' }, `${q.kind}・PIRLS ${q.pirls}`), say(q.stem, 'h3', { id: 'fp-question', tabindex: '-1' }));
    if (!state.done) {
      if (q.type === 'action') content.append(button('到場景操作', () => {
        modal.close(); actionQuestion?.remove();
        actionQuestion = h('div', { class: 'fp-scene-actions', role: 'group', 'aria-label': q.stem });
        q.options.forEach((label, i) => actionQuestion.append(button(label, () => { actionQuestion.remove(); actionQuestion = null; if (i === q.answer) { world?.observeAction(); const next = button('觀察後回到題目', () => { next.remove(); submitAnswer(i); }, { class: 'fp-button fp-return-answer' }); rootBody.append(next); } else submitAnswer(i); })));
        rootBody.append(actionQuestion);
      }, { class: 'fp-button fp-primary' }));
      else {
        const choices = h('div', { class: 'fp-answers' }), selected = [];
        const status = h('p', { role: 'status' });
        q.options.forEach((option, index) => {
          const pick = button(option, () => {
            if (!Array.isArray(q.answer)) { submitAnswer(index); return; }
            if (selected.includes(index)) return;
            selected.push(index); pick.disabled = true;
            status.textContent = selected.map(i => q.options[i]).join(' → ');
          }, { 'data-answer': index });
          if (q.type === 'picture') pick.prepend(h('span', { class: 'fp-picture', 'aria-hidden': 'true', html: picture(q.images[index]) }));
          choices.append(h('div', { class: 'fp-answer-row' }, [pick, SpeakButton({ text: option })]));
        });
        content.append(choices);
        if (Array.isArray(q.answer)) content.append(status, button('重新排列', showQuestion), button('確認', () => { if (selected.length === q.answer.length) submitAnswer(selected); else status.textContent = `請選${q.answer.length}張卡片。`; }));
      }
    }
    if (feedback) content.append(say(feedback, 'p', { role: 'status', class: 'fp-feedback' }));
    if (state.hints) content.append(say(q.hints[state.hints - 1], 'p', { class: 'fp-hint' }));
    content.append(h('div', { class: 'fp-inline-tools' }, [button('重看課文', () => showEvidence(q)), button('查看提示', () => { state.hints = Math.min(3, state.hints + 1); state.hintUses++; if (!replay) save(); showQuestion(); })]));
    if (state.done) {
      content.append(say(`收集到 ${reward(state)} 顆水滴 💧。你可以隨時重玩。`));
      if (progress.current < config.scenes.length - 1) content.append(button('前往下一站 →', advance, { class: 'fp-button fp-primary', 'data-next': 'true' }));
      else {
        config.review.forEach(([title, text]) => content.append(say(title, 'h3'), say(text)));
        content.append(button('回關卡一覽重玩', showScenes), h('a', { class: 'fp-button', href: `#/lesson/${lesson.lesson_id}` }, '回到本課'));
      }
    }
    sheet('讀懂經歷，也讀懂心情', content, '#fp-question');
  }

  function showEvidence(q) {
    const content = h('div', { class: 'fp-sheet-content' });
    for (const block of sources.get(`${scene.id}:question-${q.id}`) || []) content.append(say(`第 ${block.para} 段・原句`, 'p', { class: 'fp-source' }), say(block.text, 'blockquote', { class: 'fp-excerpt' }));
    content.append(button('回到題目', showQuestion)); sheet('回原句找依據', content);
  }
  function showHints() {
    state.hints = Math.min(3, state.hints + 1); state.hintUses++; if (!replay) save();
    sheet('慢慢觀察，不用著急', h('div', { class: 'fp-sheet-content' }, [say(scene.goal), say((scene.questions[state.questionIndex || 0]?.hints || ['先觀察動作。', '點定點按鈕找線索。', '讀完本段原句再前進。'])[state.hints - 1], 'p', { class: 'fp-hint' }), button('回到場景', () => modal.close(), { class: 'fp-button fp-primary' })]));
  }
  function showScenes() {
    const content = h('div', { class: 'fp-sheet-content' });
    const first = progress.scenes.findIndex((s) => !s.done);
    config.scenes.forEach((s, i) => content.append(button(`${progress.scenes[i].done ? '✓' : i + 1} ${s.title}`, () => { modal.close(); progress.current = i; replay = progress.scenes[i].done || (first >= 0 && i > first) ? emptyState() : null; save(); enterScene(); }, { disabled: !teacherAccess && first >= 0 && i > first, class: 'fp-button fp-scene-link' })));
    content.append(say(saved ? '進度保存在這個瀏覽器，不需要填姓名。' : '這個瀏覽器暫時無法保存；本次仍可繼續。', 'p', { class: 'fp-small' }));
    if (!teacherAccess) {
      const input = h('input', { type: 'password', autocomplete: 'off', 'aria-label': '教室密碼' });
      const status = h('p', { role: 'status' });
      content.append(say('教師可用教室密碼開啟任意關卡預覽。'), input, button('教師解鎖', async () => { try { await unlockWithPassword(input.value); input.value = ''; teacherAccess = true; showScenes(); } catch { input.value = ''; status.textContent = '請老師確認教室密碼。'; } }), status);
    }
    sheet('關卡一覽', content);
  }
  function showSettings() {
    const content = h('div', { class: 'fp-sheet-content' });
    for (const [key, label] of [['sound', '環境音效'], ['calm', '減少動畫']]) {
      const input = h('input', { type: 'checkbox', checked: prefs[key] });
      input.addEventListener('change', () => { prefs[key] = input.checked; savePrefs(); updateMotion(); });
      content.append(h('label', { class: 'fp-setting' }, [input, label]));
    }
    content.append(say('減少動畫會保留靜態線索；也會遵守系統的減少動態設定。', 'p', { class: 'fp-small' }), say('人物、擺設和聲音為閱讀示意。玩家是課文探索者；文字明說的心情才當作事實。', 'p', { class: 'fp-small' }), h('details', {}, [h('summary', {}, '教師資訊與教材依據'), h('p', { class: 'fp-small' }, `${config.source.text}；${config.source.questions}；${config.source.strategy}。核對：${config.source.checked}。`), h('p', { class: 'fp-small' }, '不計時、不扣分；不記學生姓名，不納入原有成績。場景不要求實際操作火或熱水。')]), button('回到食堂', () => modal.close(), { class: 'fp-button fp-primary' }));
    sheet('畫面與聲音', content);
  }
  start(); return root;
}

function flatScene(id) {
  return `<svg viewBox="0 0 1000 800" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fp-f" x2="0" y2="1"><stop stop-color="#b9b69e"/><stop offset="1" stop-color="#765f45"/></linearGradient><radialGradient id="fp-w"><stop stop-color="#e3efcf"/><stop offset="1" stop-color="#8cb3a5"/></radialGradient></defs><path fill="url(#fp-f)" d="M0 0h1000v800H0z"/><path fill="#c19a69" d="M0 610h1000v190H0z"/><rect x="30" y="70" width="360" height="380" rx="14" fill="#b2c8ae" stroke="#95714c" stroke-width="24"/><path d="M210 70v380M30 250h360" stroke="#95714c" stroke-width="15"/><path d="M210 0v90" stroke="#63543c" stroke-width="5"/><path d="m180 90-25 70h110l-25-70" fill="#be995c"/><rect x="160" y="560" width="660" height="230" rx="35" fill="#a1907b"/><rect x="340" y="660" width="300" height="140" rx="30" fill="#403b31"/><path d="M380 790q-35-60 10-100 40 80 70 5 60 90 120 95" fill="${id === 'root' ? '#a57c49' : '#dfa358'}"/><path d="M190 480h600l-65 170H250z" fill="#394947"/><ellipse cx="490" cy="480" rx="300" ry="95" fill="url(#fp-w)" stroke="#4a5954" stroke-width="18"/><g fill="#eff2d9"><ellipse cx="370" cy="480" rx="28" ry="12"/><ellipse cx="520" cy="440" rx="20" ry="10"/><ellipse cx="630" cy="500" rx="24" ry="11"/></g><path d="M470 430q-80-80 10-150t-10-150M580 440q60-90-5-170t30-180" stroke="#fff4dc" opacity=".27" stroke-width="38" stroke-linecap="round" fill="none"/></svg>`;
}

function picture(kind) {
 const paths = { bell: '<path d="M35 20h30l15 45H20z" fill="#c39750"/><circle cx="50" cy="73" r="7" fill="#72552c"/>', fire: '<path d="M15 80h70M25 90l50-20" stroke="#87572e" stroke-width="12"/><path d="M50 15Q15 55 40 70Q80 85 70 40L55 55Z" fill="#cf732d"/>', notes: '<path d="M20 15h60v70H20z" fill="#fff5da" stroke="#826844"/><path d="M30 35h40M30 50h40M30 65h25" stroke="#826844"/>' };
 return `<svg viewBox="0 0 100 100" width="80" height="80" xmlns="http://www.w3.org/2000/svg">${paths[kind] || ''}</svg>`;
}
