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

/** 這一課可以用的應用任務（沒有、或還沒核准就回傳 null）。 */
export function readyApplication(lesson) {
  const [task] = filterByStatus(lesson.application ? [lesson.application] : []);
  if (!task || !task.passage) return null;
  const questions = (task.questions || []).filter((q) => q.question && hasPlayableAnswer(q));
  if (questions.length < 2) return null;
  return { ...task, questions };
}

export function canStartApplication(lesson) {
  return readyApplication(lesson) !== null;
}

/** 短文卡：像一張真的便條／通知，字看得到，也能整段聽或一句一句重聽。 */
function PassageCard(task, { compact = false } = {}) {
  const card = h('div', { class: `application-passage${compact ? ' application-passage--compact' : ''}` }, [
    h('p', { class: 'application-passage__kind' }, task.kind),
    task.title ? h('p', { class: 'application-passage__title' }, task.title) : null,
    ...String(task.passage).split('\n').map((line) => h('p', { class: 'application-passage__text' }, line)),
    task.signature ? h('p', { class: 'application-passage__signature' }, task.signature) : null,
  ].filter(Boolean));
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
  const level = getScaffoldLevel();
  const pattern = (lesson.sentence_patterns || []).find((p) => p.id === task.write?.pattern_id);
  // 支持層不寫句子：對書寫負荷高的學生，讀懂並選對回應就是這一關的完成
  const steps = ['read', 'questions'];
  if (pattern && level.key !== 'support') steps.push('write');
  let stepIndex = 0;
  let jump = null;

  const quizItems = [
    ...task.questions.map((q) => ({ ...q, stem: q.question, hints: [q.hint || `再看一次這張${task.kind}，找找和問題有關的那一句。`] })),
    ...(task.response && hasPlayableAnswer(task.response) ? [{
      ...task.response,
      id: `${task.id}:response`,
      stem: task.response.question,
      hints: [task.response.hint || '想一想：對方最想知道什麼？哪一句話最有禮貌、也回答到重點？'],
    }] : []),
  ].map((item) => ({ ...item, extra: PassageCard(task, { compact: true }) }));

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
