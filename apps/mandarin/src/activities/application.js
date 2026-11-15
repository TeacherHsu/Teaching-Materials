// 「我會應用」模組：把這一課的語詞和句型搬到課文以外的生活情境用一次。
//
// 其他大項練的是「在句子裡用對語詞／句型」；這一關練的是遷移——換一種沒看過的
// 生活文本（便條、邀請卡、通知……），為了一個真實目的去讀、去回應（CF 2026-11-15）。
// 三步，一畫面一任務：
//   1. read     讀一則生活短文（看得到字、可以聽、可以分句重聽）
//   2. questions 看懂它（功能性訊息：誰、什麼時候、要做什麼）＋選一句合適的回應
//   3. write    用本課的一個句型自己寫一句，交給老師看（支持層不寫，到第 2 步為止）
//
// 短文是自編內容（lesson.application.passage），不是課文，所以不必解鎖教室密碼；
// 但新編內容要教師核准才上線，draft 只有預覽模式看得到。
import { h, clear } from '../utils/dom.js';
import { StepJump } from '../components/StepJump.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { SentenceWriter } from '../components/SentenceWriter.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus } from '../utils/preview.js';
import { speak, speechSupported } from '../utils/speech.js';
import { getScaffoldLevel } from '../utils/deviceSettings.js';
import { hasPlayableAnswer } from '../utils/answerGate.js';
import { splitForReplay } from './listening.js';
import { ImageFrame } from '../components/ImageFrame.js';

/** 這一課可以用的應用任務（沒有、或還沒核准就回傳 null）。 */
export function readyApplication(lesson) {
  const [task] = filterByStatus(lesson.application ? [lesson.application] : []);
  if (!task) return null;
  if (task.variant === 'picture') {
    // 一年級：看圖選一句話（不讀短文、不寫句子）
    const items = (task.items || []).filter((item) => item.image && hasPlayableAnswer(item));
    return items.length >= 2 ? { ...task, items } : null;
  }
  if (!task.passage) return null;
  const questions = (task.questions || []).filter((q) => q.question && hasPlayableAnswer(q));
  if (questions.length < 2) return null;
  return { ...task, questions };
}

export function canStartApplication(lesson) {
  return readyApplication(lesson) !== null;
}

/**
 * 把一段文字裡的關鍵字詞包成 <mark>。答錯一次時用：對閱讀困難的學生，
 * 「再看一次短文」沒有用——他不知道要看哪裡，要直接把線索標出來（CF 2026-11-15）。
 */
function markedText(text, phrases) {
  const hits = (phrases || []).filter((p) => p && text.includes(p)).sort((a, b) => text.indexOf(a) - text.indexOf(b));
  if (!hits.length) return [text];
  const out = [];
  let rest = text;
  for (const phrase of hits) {
    const at = rest.indexOf(phrase);
    if (at < 0) continue;
    if (at > 0) out.push(rest.slice(0, at));
    out.push(h('mark', { class: 'application-passage__key' }, phrase));
    rest = rest.slice(at + phrase.length);
  }
  if (rest) out.push(rest);
  return out;
}

/** 短文卡：像一張真的便條／通知，字看得到，也能整段聽或一句一句重聽。 */
function PassageCard(task, { compact = false } = {}) {
  const lines = [];
  const add = (cls, text) => {
    if (!text) return;
    const el = h('p', { class: cls }, text);
    lines.push({ el, text });
    return el;
  };
  const card = h('div', { class: `application-passage${compact ? ' application-passage--compact' : ''}` }, [
    h('p', { class: 'application-passage__kind' }, task.kind),
    add('application-passage__title', task.title),
    ...String(task.passage).split('\n').map((line) => add('application-passage__text', line)),
    add('application-passage__signature', task.signature),
  ].filter(Boolean));
  // 答錯時呼叫：把這一題的關鍵字詞畫上顏色
  card.highlight = (phrases) => {
    // 每個關鍵字詞只畫一處：整行就是它（標題「給小安」、署名「媽媽」）就畫那一行，
    // 否則畫第一個出現的地方——同一個詞畫兩三處，學生反而不知道要看哪裡。
    const perLine = lines.map(() => []);
    for (const phrase of phrases || []) {
      let at = lines.findIndex((line) => line.text === phrase);
      if (at < 0) at = lines.findIndex((line) => line.text.includes(phrase));
      if (at >= 0) perLine[at].push(phrase);
    }
    lines.forEach(({ el, text }, i) => {
      clear(el);
      for (const part of markedText(text, perLine[i])) el.appendChild(typeof part === 'string' ? document.createTextNode(part) : part);
    });
    card.classList.add('application-passage--marked');
  };
  if (speechSupported()) {
    const spoken = [task.title, task.passage.replace(/\n/g, ''), task.signature].filter(Boolean).join('。');
    const row = h('div', { class: 'listening-audio application-passage__audio' }, [
      SpeakButton({ text: spoken, label: compact ? '再聽一次' : '聽整張', showLabel: true, ariaLabel: `朗讀這張${task.kind}` }),
    ]);
    const parts = compact ? [] : splitForReplay(task.passage.replace(/\n/g, ''));
    if (parts.length >= 2) {
      row.appendChild(h('div', { class: 'listening-replay', role: 'group', 'aria-label': '分句重播' },
        parts.map((text, i) => SpeakButton({
          text,
          label: `第 ${i + 1} 句`,
          showLabel: true,
          ariaLabel: `重聽第 ${i + 1} 句`,
          variant: 'speak-button--option speak-button--audio-label',
        }))));
    }
    card.appendChild(row);
  }
  return card;
}

export function buildApplicationActivity(lesson, onBack) {
  const task = readyApplication(lesson);
  const container = h('div', {});
  if (!task) {
    container.appendChild(missingContentNotice('我會應用：教材審核中'));
    return container;
  }
  if (task.variant === 'picture') {
    // 一年級識字量少，短文太重：一張圖配幾句話，選出說的是這張圖的那一句。
    // 練的一樣是「把學過的語詞用在新的句子裡」，只是負荷降到一年級做得到。
    container.appendChild(TaskBanner({ label: '看圖，選出說這張圖的句子', step: '' }));
    container.appendChild(ChoiceQuiz({
      items: task.items.map((item) => ({
        id: item.id,
        stem: '哪一句話說的是這張圖？',
        options: item.options,
        answer: item.answer,
        explanation: `這張圖是「${item.word}」：${item.answer}`,
        hints: ['先看圖裡有誰、在做什麼，再把每一句念一遍。'],
        extra: h('div', { class: 'application-picture' }, [ImageFrame({ src: item.image, alt: '' })]),
      })),
      backLabel: '回課程首頁',
      onBack,
    }));
    return container;
  }
  const level = getScaffoldLevel();
  const pattern = (lesson.sentence_patterns || []).find((p) => p.id === task.write?.pattern_id);
  // 支持層不寫句子：對書寫負荷高的學生，讀懂並選對回應就是這一關的完成
  const steps = ['read', 'questions'];
  if (pattern && level.key !== 'support') steps.push('write');
  let stepIndex = 0;
  let jump = null;

  // 每一題各有一張短文卡；答錯一次（或按「看提示」）就在這張卡上把關鍵字詞畫出來
  const withCard = (item, fallbackHint) => {
    const card = PassageCard(task, { compact: true });
    const evidence = item.evidence || [];
    const hint = evidence.length
      ? { text: `再看一次這張${task.kind}，答案的線索在畫上顏色的地方。`, on: () => card.highlight(evidence) }
      : (item.hint || fallbackHint);
    return { ...item, stem: item.question, hints: [hint], extra: card };
  };
  const quizItems = [
    ...task.questions.map((q) => withCard(q, `再看一次這張${task.kind}，找找和問題有關的那一句。`)),
    ...(task.response && hasPlayableAnswer(task.response)
      ? [withCard({ ...task.response, id: `${task.id}:response` }, '想一想：對方最想知道什麼？哪一句話最有禮貌、也回答到重點？')]
      : []),
  ];

  function renderStep() {
    clear(container);
    jump?.update(stepIndex);
    const step = steps[stepIndex];
    const isLastStep = stepIndex === steps.length - 1;
    const next = () => { stepIndex += 1; renderStep(); };

    if (step === 'read') {
      container.appendChild(TaskBanner({ label: `讀一讀這張${task.kind}`, step: '' }));
      if (task.situation) {
        container.appendChild(h('div', { class: 'quiz-option-row' }, [
          h('p', { class: 'application-situation' }, task.situation),
          SpeakButton({ text: task.situation, label: '聽', variant: 'speak-button--option' }),
        ]));
      }
      container.appendChild(PassageCard(task));
      const go = h('button', { class: 'btn btn--primary', type: 'button', style: 'margin-top:16px' }, '我讀完了');
      go.addEventListener('click', next);
      container.appendChild(h('div', { class: 'quiz-option-row' }, [go]));
      // 支持層自動念一次（和選擇題的 autoRead 一致）
      if (level.autoRead && speechSupported()) speak([task.situation, task.title, task.passage.replace(/\n/g, '')].filter(Boolean).join('。'));
    } else if (step === 'questions') {
      container.appendChild(TaskBanner({ label: `看懂這張${task.kind}，再想想怎麼回應`, step: '' }));
      container.appendChild(ChoiceQuiz({
        items: quizItems,
        backLabel: isLastStep ? '回課程首頁' : '本課先完成',
        onBack,
        onContinue: isLastStep ? null : next,
        continueLabel: '繼續：自己寫一句',
      }));
    } else if (step === 'write') {
      container.appendChild(TaskBanner({ label: '換你了：用這一課的句型寫一句', step: '' }));
      const prompt = task.write.prompt;
      container.appendChild(h('div', { class: 'write-prompt' }, [
        h('div', { class: 'quiz-option-row' }, [h('p', {}, prompt), SpeakButton({ text: prompt, label: '聽', variant: 'speak-button--option' })]),
        task.write.model ? h('div', { class: 'quiz-option-row' }, [
          h('p', { class: 'write-prompt__check' }, `例如：${task.write.model}`),
          SpeakButton({ text: task.write.model, label: '聽', variant: 'speak-button--option' }),
        ]) : null,
      ].filter(Boolean)));
      container.appendChild(SentenceWriter({ lessonId: lesson.lesson_id, pattern, onDone: () => {}, onBack, backLabel: '回課程首頁' }));
    }
  }

  jump = StepJump({ steps: steps.map((s) => `application-${s}`), moduleKey: 'application', onJump: (i) => { stepIndex = i; renderStep(); } });
  renderStep();
  return h('div', {}, [jump.el, container]);
}
