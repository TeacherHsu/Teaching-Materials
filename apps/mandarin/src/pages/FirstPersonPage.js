import { animationReduced } from '../activities/firstPersonPreferences.js';
import { playChime } from '../activities/firstPersonChime.js';
import { moodFor, subtitlePlan, beatLines, subtitleDuration, nextBeat, createPlayback, createCardOrder } from '../activities/firstPersonPresentation.js';
import { operationComplete } from '../activities/firstPersonInteraction.js';
import { h, clear } from '../utils/dom.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { getReading, unlockWithPassword, cryptoAvailable } from '../utils/classroomKey.js';
import { splitSentences } from '../utils/readingUnits.js';
import { cancelSpeaking } from '../utils/speech.js';
import { getFirstPersonLesson, clueRefs } from '../data/firstPersonLesson.js';
import { answerScene, canAnswer, readProgress, saveProgress, reward } from '../activities/firstPersonCore.js';
import { mountFirstPersonScene } from '../activities/firstPersonIllustrated.js';
import '../styles/first-person.css';

const button = (text, action, attrs = {}) => h('button', { type: 'button', class: 'fp-button', onclick: action, ...attrs }, text);
const say = (text, tag = 'p', attrs = {}) => h('div', { class: 'fp-spoken' }, [h(tag, attrs, text), SpeakButton({ text })]);
const PREF_KEY = 'mandarin:explore:settings';
const emptyState = () => ({ read: [], operation: { step: 0 }, found: [], done: false, hints: 0, attempts: 0, questionIndex: 0, hintUses: 0 });

export function FirstPersonPage(lesson) {
  const config = getFirstPersonLesson(lesson.lesson_id);
  const root = h('div', { class: 'fp-page' });
  if (!config) { root.append(say('這一課還沒有課文情境探索。')); return root; }
  document.body.classList.add('fp-immersive');
  let progress;
  try { progress = readProgress(config, localStorage); } catch { progress = readProgress(config, null); }
  let prefs = { sound: false, animation: 'system' };
  try { const s = JSON.parse(localStorage.getItem(PREF_KEY)); prefs = { sound: s?.sound === true, animation: ['system','on','off'].includes(s?.animation) ? s.animation : s?.calm ? 'off' : 'system' }; } catch { /* 預設 */ }
  let world, generation = 0, disposed = false, replay = null, lastClue = null, feedback = '', wrong = false, readingVisible = false;
  let subtitle = null, subtitleTimer, subtitleAfter, subtitleQueue = [];
  let beat = 'intro', beatTimer, playback = createPlayback();
  let chimeUntil = 0, chimeTimer;
  let stopChime, saved = true, audio, ambientGain, ambientSource, modal, observationTimer;
  let scene, state, sources, currentView, idleTimer, teacherAccess = false, actionQuestion = null;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const rootBody = h('div', { class: 'fp-shell' }); root.append(rootBody);
  const calm = () => animationReduced(prefs.animation, reduce.matches);
  function save() { try { saved = saveProgress(config, progress, localStorage); } catch { saved = false; } }
  function savePrefs() { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch { /* 這次仍生效 */ } }
  function sound() {
    const enabled = prefs.sound && !document.hidden && !modal?.open;
    if (!enabled) { stopChime?.(); stopChime = null; if (ambientGain && audio) ambientGain.gain.setTargetAtTime(0, audio.currentTime, .15); return; }
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
  function chime() { chimeUntil=Date.now()+2500;clearTimeout(chimeTimer);chimeTimer=setTimeout(updateMotion,2500); stopChime?.(); stopChime = playChime(prefs.sound, () => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    return audio ||= new AC();
  }); }
  function updateMotion() { root.classList.toggle('fp-calm', calm()); root.classList.toggle('fp-motion-on', prefs.animation === 'on'); world?.setOptions?.({ calm: calm(), reading: ['result','read'].includes(beat), locked: beat !== 'act' || (scene?.act===4 && state?.operation.step===0), paused: Boolean(Date.now()<chimeUntil || modal?.open || subtitle || root.querySelector('.fp-question-cards')) }); sound(); }
  function destroyWorld() { generation++; world?.dispose(); world = null; }
  function close() {
    if (disposed) return; disposed = true; clearTimeout(beatTimer); clearTimeout(chimeTimer); clearTimeout(subtitleTimer); clearTimeout(observationTimer); clearTimeout(idleTimer); destroyWorld(); cancelSpeaking(); audio?.close().catch(() => {});
    modal?.close(); modal?.remove(); document.body.classList.remove('fp-immersive');
    reduce.removeEventListener('change', updateMotion); document.removeEventListener('visibilitychange', sound);
    window.removeEventListener('hashchange', close); window.removeEventListener('pagehide', close);
  }
  window.addEventListener('hashchange', close); window.addEventListener('pagehide', close);
  reduce.addEventListener('change', updateMotion); document.addEventListener('visibilitychange', sound);

  function sheet(title, content, focus) {
    clearTimeout(beatTimer); clearTimeout(subtitleTimer);
    modal?.close(); modal?.remove();
    const dialog = h('dialog', { class: 'fp-sheet', 'aria-labelledby': 'fp-sheet-title' });
    dialog.append(h('div', { class: 'fp-sheet-header' }, [h('h2', { id: 'fp-sheet-title' }, title), button('✕', () => dialog.close(), { 'aria-label': '回到場景', class: 'fp-close' })]), content);
    root.append(dialog); modal = dialog;
    dialog.addEventListener('close', () => { readingVisible = false; cancelSpeaking(); updateMotion(); if(beat==='result')beatTimer=setTimeout(()=>setBeat('read'),scene.beats.result.duration); if(subtitle)subtitle.style.opacity='1'; if(subtitle && (beat==='intro' || playback.automatic))subtitleTimer=setTimeout(nextSubtitle,subtitleDuration(subtitle.querySelector('p')?.textContent || '')); });
    dialog.addEventListener('click', (event) => { if (event.target === dialog && event.clientX < dialog.getBoundingClientRect().left) dialog.close(); });
    dialog.showModal(); updateMotion();
    if (focus) content.querySelector(focus)?.focus();
    return dialog;
  }

  async function start() {
    clear(rootBody);
    const reading = getReading(lesson.lesson_id);
    if (!reading) {
      const gate = h('section', { class: 'fp-gate' }, [h('p', { class: 'fp-kicker' }, '課文樂園・課文情境探索'), h('h1', {}, config.gateTitle), say(config.introduction)]);
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
    for (const [para, texts] of paragraphs) {
      let speaker = '';
      texts.forEach((text,n) => {
        if(text.startsWith('」')) speaker='';
        if(text.includes('「')) speaker = '師傅';
        sources.set(`sentence:${para}:${n}`, speaker ? `${speaker}：${text}` : text);
        if(text.includes('」')) speaker='';
      });
    }
    try {
      for (const sc of config.scenes) for (const clue of [...sc.clues, ...sc.questions.map(q => ({ id: `question-${q.id}`, refs: q.refs })), ...(sc.act === 4 ? [{ id: 'idiom', refs: config.idiomRefs }] : [])]) {
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
    clearTimeout(beatTimer); clearTimeout(observationTimer); clearTimeout(idleTimer); actionQuestion = null; destroyWorld(); modal?.close(); modal?.remove(); modal = null; clear(rootBody);
    subtitle?.remove(); subtitle=null; subtitleQueue=[]; clearTimeout(subtitleTimer);
    scene = config.scenes[progress.current]; state = replay || progress.scenes[progress.current]; currentView = scene.view;
    beat = 'intro'; root.dataset.beat=beat; playback=createPlayback();
    lastClue = null; feedback = ''; wrong = false;
    const stage = h('div', { class: `fp-world fp-world--${scene.id}`, tabindex: '0', role: 'group', 'aria-label': '第一人稱場景。拖曳環顧，左右鍵轉頭；Tab尋找物件，Enter操作。' });
    stage.append(h('div', { class: 'fp-flat', 'aria-hidden': 'true', html: flatScene(scene.id.replace(/^story-/, '')) }));
    const top = h('header', { class: 'fp-topbar' }, [h('a', { href: `#/lesson/${lesson.lesson_id}`, class: 'fp-home', 'aria-label': '回到本課' }, '←'), h('span', {}, `第${scene.act}幕`)]);
    const mood = h('div', { class: 'fp-mood', 'aria-live': 'polite' });
    const controls = h('div', { class: 'fp-controls' }, [mood, button('⚙', showSettings, { 'aria-label': '設定', class: 'fp-gear fp-button' })]);
    rootBody.append(stage, top, controls);
    updateMood();
    const mode = h('span', { class: 'fp-mode' }, '載入場景…'); rootBody.append(mode);
    let pointer;
    stage.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; pointer = { x: e.clientX, y: e.clientY }; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener('pointermove', (e) => { if (!pointer) return; world?.look((e.clientX - pointer.x) * .002, (pointer.y - e.clientY) * .0015); pointer = { x: e.clientX, y: e.clientY }; });
    stage.addEventListener('pointerup', () => { pointer = null; }); stage.addEventListener('pointercancel', () => { pointer = null; });
    stage.addEventListener('keydown', (e) => { if (e.target !== stage) return; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) { e.preventDefault(); world?.look(e.key === 'ArrowLeft' ? .08 : e.key === 'ArrowRight' ? -.08 : 0, e.key === 'ArrowUp' ? .05 : e.key === 'ArrowDown' ? -.05 : 0); } });
    const version = generation;
    mountFirstPersonScene(stage, { phase: { ...scene, id: scene.id.replace(/^story-/, "") }, calm: calm(), operation: state.operation, onChime: chime, onDemoSeen: () => { if(!replay)save(); }, onOperation: () => { if (!replay) save(); updateMood(); if(beat==='act' && operationComplete(scene,state.operation)) setBeat(nextBeat(beat)); else updateMotion(); }, onMode: (label) => { if (version === generation) { mode.textContent = label; mode.hidden = label.startsWith('第一人稱'); } } }).then((controller) => { if (disposed || version !== generation) controller.dispose(); else { world = controller; setBeat('intro'); } });
    updateMotion(); sound();
  }

  function updateMood(remembered = false) {
    const node = root.querySelector('.fp-mood'); if (!node) return;
    const m = moodFor(scene.act, state.operation.step, remembered);
    clear(node); node.dataset.level = String(m.level);
    node.append(h('span', {}, m.label), h('span', { class: 'fp-mood-face', 'aria-hidden': 'true' }, m.face), h('i', { style: `--mood:${m.level / 3 * 100}%`, 'aria-hidden': 'true' }), h('span', { class: 'fp-sr' }, `康康：${m.label}`));
  }
  function setBeat(value) {
    clearTimeout(beatTimer); clearTimeout(subtitleTimer);
    subtitle?.remove(); subtitle=null; beat=value; root.dataset.beat=beat;
    if(value==='intro' || value==='read') {
      subtitleQueue=beatLines(scene.beats[value]);
      subtitleAfter=()=>setBeat(nextBeat(value));
      nextSubtitle();
    } else if(value==='act') {
      if(operationComplete(scene,state.operation)) setBeat(nextBeat(value));
      else if(scene.beats.act.demo && state.operation.step===0) world?.startDemo();
    } else if(value==='result') {
      world?.setView(scene.beats.result.view);
      beatTimer=setTimeout(()=>setBeat(nextBeat(value)),scene.beats.result.duration);
    } else {
      state.found=scene.clues.map(c=>c.id); if(!replay)save(); showQuestion();
    }
    updateMotion();
  }
  function recordRead(ref) {
    state.read ||= [];
    const key=`${ref.para}:${ref.n}`;
    if(!state.read.includes(key))state.read.push(key);
    if(!replay)save();
  }
  function nextSubtitle() {
    clearTimeout(subtitleTimer); subtitle?.remove(); subtitle=null; cancelSpeaking();
    const ref=subtitleQueue.shift();
    if(!ref) {const done=subtitleAfter;subtitleAfter=null;done?.();return;}
    recordRead(ref);
    // 斷句會把「……。」的後引號切到下一句開頭；顯示時把它還給前一句。
    const raw=sources.get(`sentence:${ref.para}:${ref.n}`)||'';
    const following=sources.get(`sentence:${ref.para}:${ref.n+1}`)||'';
    const line=raw.replace(/^[」』]+/,'')+(following.match(/^[」』]+/)?.[0]||'');
    if(ref.para===4 && ref.n===7)updateMood(true);
    const controls=[];
    if(beat==='intro')controls.push(button('略過',()=>{subtitleQueue.forEach(recordRead);subtitleQueue=[];nextSubtitle();}));
    else {
      controls.push(button(playback.automatic?'切換手動':'自動播放',()=>{playback.toggle();clearTimeout(subtitleTimer);if(playback.automatic)subtitleTimer=setTimeout(nextSubtitle,subtitleDuration(line));controls[0].textContent=playback.automatic?'切換手動':'自動播放';}));
      controls.push(button('下一句',nextSubtitle));
    }
    subtitle=h('div',{class:'fp-cinema',role:'group','aria-label':'場景原句'},[
      say(line,'p'),...controls]);
    rootBody.append(subtitle);updateMotion();
    subtitle.querySelector('.speak-button')?.addEventListener('click',()=>{clearTimeout(subtitleTimer);if(beat==='intro' || playback.automatic)subtitleTimer=setTimeout(nextSubtitle,subtitleDuration(line));});
    const delay=beat==='intro'?subtitleDuration(line):playback.delay(line);
    if(delay!==null)subtitleTimer=setTimeout(()=>{if(beat==='intro' && subtitle){subtitle.style.opacity='0';beatTimer=setTimeout(nextSubtitle,calm()?0:200);}else nextSubtitle();},delay);
  }
  function reviewReading() {
    const content = h('div', { class: 'fp-sheet-content' });
    for(let i=0;i<=progress.current;i++) for(const key of progress.scenes[i].read || []) content.append(say(sources.get(`sentence:${key}`)));
    sheet('重看原句', content);
  }

  function advance() { modal?.close(); progress.current = Math.min(config.scenes.length - 1, progress.current + 1); replay = null; save(); enterScene(); }
  function submitAnswer(choice) {
    const result = answerScene(scene, state, choice); if (!result) return;
    feedback = result.feedback; wrong = !result.correct;
    if (replay && state.done && !progress.scenes[progress.current].done) progress.scenes[progress.current] = { ...state, found: [...state.found] };
    if (!replay || state.done) save();
    if(result.correct) {
      const drop=h('span',{class:'fp-reward-drop','aria-hidden':'true'},'💧'); rootBody.append(drop);
      clearTimeout(observationTimer); observationTimer=setTimeout(()=>drop.remove(),1200);
    }
    showQuestion();
  }
  function showQuestion() {
    if (!canAnswer(scene, state)) return;
    root.querySelector('.fp-question-cards')?.remove();
    const q = scene.questions[Math.min(state.questionIndex || 0, scene.questions.length - 1)];
    const content = h('section', { class: 'fp-question-cards', 'aria-label': q.stem });
    if(state.done) {
      content.append(say('💧 ' + q.explanation));
      if(progress.current < config.scenes.length-1) content.append(button('下一幕', advance));
      else { content.append(say('釜底抽薪', 'h3')); config.review.forEach(([title,text])=>content.append(say(`${title}${text}`))); content.append(button('完成・關卡一覽', showScenes)); }
    } else {
      content.append(say(q.stem));
      const choices = h('div', { class: 'fp-card-row' });
      const orderStatus = h('p', {class:'fp-sr', 'aria-live':'polite'}); content.append(orderStatus);
      const cardOrder = createCardOrder(Array.isArray(q.answer) ? [2,0,1] : q.options.map((_,i)=>i));
      let dragged = null, suppressClick = false;
      function renderCards() {
        clear(choices);
        if(Array.isArray(q.answer)) orderStatus.textContent=cardOrder.selected.map((i,n)=>`${n+1}：${q.options[i]}`).join(' → ');
        cardOrder.order.forEach(index => {
          const pick = button(q.options[index], () => {
            if(suppressClick) return;
            if(Array.isArray(q.answer)) { cardOrder.toggle(index); renderCards(); }
            else submitAnswer(index);
          }, { 'data-answer': index, draggable: Array.isArray(q.answer), 'aria-label': Array.isArray(q.answer) ? `${q.options[index]}，點選編號，再點取消；也可拖曳排列` : q.options[index] });
          if(Array.isArray(q.answer)) { const place=cardOrder.selected.indexOf(index); pick.setAttribute('aria-pressed',String(place>=0)); if(place>=0)pick.prepend(h('span',{class:'fp-order-number'},String(place+1))); }
          if(q.type==='emotion') pick.prepend(h('img', { class:'fp-emotion', src:`${import.meta.env.BASE_URL}assets/first-person/115AG3H04/sprites/${q.images[index]}.webp`, alt:'' }));
          pick.ondragstart = () => { dragged=index; };
          pick.ondragover = e => e.preventDefault();
          pick.ondrop = e => { e.preventDefault(); if(dragged===null)return; cardOrder.move(dragged,index); dragged=null; renderCards(); };
          // Pointer dragging supports touch without native HTML drag support.
          let origin;
          pick.onpointerdown = e => { if(Array.isArray(q.answer)) { origin={x:e.clientX,y:e.clientY}; if(e.pointerType!=='mouse') pick.setPointerCapture(e.pointerId); } };
          pick.onpointerup = e => { if(!origin || Math.hypot(e.clientX-origin.x,e.clientY-origin.y)<12)return; suppressClick=true; setTimeout(()=>suppressClick=false,0); const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-answer]'); if(target){ cardOrder.move(index,Number(target.dataset.answer)); renderCards(); } origin=null; };
          choices.append(h('div', { class:'fp-answer-row' }, [pick, SpeakButton({text:q.options[index]})]));
        });
      }
      renderCards(); content.append(choices);
      if(Array.isArray(q.answer)) content.append(button('重新排列',()=>{cardOrder.reset();renderCards();}),button('確認次序',()=>{if(cardOrder.selected.length===q.options.length)submitAnswer(cardOrder.selected);else {orderStatus.textContent='請依序點選三張卡片。';}}));
      if(feedback) content.append(say(feedback,'p',{role:'status',class:'fp-card-feedback'}));
      if(wrong) content.classList.add('fp-wrong');
    }
    rootBody.append(content); world?.setOptions({calm:calm(),paused:true});
  }

  function showHints() {
    if(beat==='act' && [1,4].includes(scene.act) && state.operation.step>0 && !operationComplete(scene,state.operation)){modal?.close();world?.showWoodDemo();return;}
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
    content.append(button('重看原句', reviewReading), button('提示', showHints), button('關卡一覽', showScenes), button('重玩', () => { modal.close(); replay=emptyState(); enterScene(); }));
    for (const [key, label] of [['sound', '環境音效']]) {
      const input = h('input', { type: 'checkbox', checked: prefs[key] });
      input.addEventListener('change', () => { prefs[key] = input.checked; savePrefs(); updateMotion(); });
      content.append(h('label', { class: 'fp-setting' }, [input, label]));
    }
    const animation = h('select', { 'aria-label':'動畫' });
    for(const [value,label] of [['system','跟隨系統'],['on','開'],['off','關']]) animation.append(h('option',{value,selected:prefs.animation===value},label));
    animation.addEventListener('change',()=>{prefs.animation=animation.value;savePrefs();updateMotion();});
    content.append(h('label',{class:'fp-setting'},['動畫：',animation]));
    content.append(say('動畫關閉時保留靜態線索；選擇開可供課堂播放所有動畫。', 'p', { class: 'fp-small' }), say('人物、擺設和聲音為閱讀示意。你是跟著康康一起試的小幫手；文字明說的心情才當作事實。', 'p', { class: 'fp-small' }), h('details', {}, [h('summary', {}, '教師資訊與教材依據'), h('p', { class: 'fp-small' }, `${config.source.text}；${config.source.questions}；${config.source.strategy}。核對：${config.source.checked}。`), h('p', { class: 'fp-small' }, '不計時、不扣分；不記學生姓名，不納入原有成績。場景不要求實際操作火或熱水。')]), button('回到食堂', () => modal.close(), { class: 'fp-button fp-primary' }));
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
