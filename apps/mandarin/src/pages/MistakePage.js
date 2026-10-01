// 錯題複習：#/mistakes 或 #/mistakes/<lesson_id>
//
// 把之前「第一次沒答對」的題目再考一次。答對往上一格、答錯歸零，
// 連續答對四次就算學會、從盒子裡拿掉（間隔規則見 utils/mistakes.js）。
//
// 一次只出一批（不超過一輪題數 + 2 題）：一次面對一整牆錯題會讓學生放棄，
// 這和站上「一個畫面只放一個任務」的底線是同一個理由。
import { h, clear } from '../utils/dom.js';
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { volumeLabel } from '../utils/volumeLabel.js';
import { getScaffoldLevel } from '../utils/deviceSettings.js';
import { shuffle } from '../utils/shuffle.js';
import { SentenceWriter } from '../components/SentenceWriter.js';
import { redoSentences, skipToday } from '../utils/madeSentences.js';
import {
  BOX_DAYS,
  allMistakes,
  daysUntilNextDue,
  dueMistakes,
  toQuizItem,
} from '../utils/mistakes.js';

/**
 * @param {object|null} lesson 指定課次時只複習那一課；null 代表全部課次
 * @returns {HTMLElement}
 */
export function MistakePage(lesson) {
  const lessonId = lesson ? lesson.lesson_id : null;
  const root = h('div', { class: 'container' });

  const crumbs = [h('a', { href: '#/' }, '首頁')];
  if (lesson) {
    crumbs.push(h('a', { href: `#/grade/${lesson.volume.grade}` }, volumeLabel(lesson.volume)));
    crumbs.push(h('a', { href: `#/lesson/${lessonId}` }, `第 ${lesson.lesson_no} 課`));
  }
  crumbs.push(h('span', { class: 'breadcrumb__current' }, '錯題複習'));
  root.appendChild(h('p', { class: 'breadcrumb' }, crumbs));

  const body = h('div', {});
  root.appendChild(body);

  const backHref = lesson ? `#/lesson/${lessonId}` : '#/';
  const backLabel = lesson ? '回到本課' : '回首頁';

  function renderBatch() {
    clear(body);

    // 老師打 ✗ 的句子要先重寫，再做選擇題。
    // 這是全站唯一的教師→學生回饋通道，排在最前面才不會被跳過；
    // 但學生卡住時可以「今天先跳過」，不要讓一句話擋住整個複習。
    const redo = redoSentences(lessonId);
    if (redo.length) {
      body.appendChild(renderRedo(redo[0], redo.length, renderBatch));
      return;
    }

    const due = shuffle(dueMistakes(lessonId));

    if (!due.length) {
      body.appendChild(emptyState(lessonId, backHref, backLabel));
      return;
    }

    // 一批的題數跟著鷹架層級走：支持層一次少一點。
    const batchSize = Math.max(5, getScaffoldLevel().roundSize + 2);
    const batch = due.slice(0, batchSize);
    const remaining = due.length - batch.length;

    body.appendChild(
      TaskBanner({
        label: '把之前答錯的題目再做一次。',
        step: remaining ? `這次 ${batch.length} 題，還有 ${remaining} 題` : `這次 ${batch.length} 題`,
      }),
    );

    // 記下這一批作答前的狀態，結算時才算得出「有幾題學會了」。
    // 學會＝連續答對四次後從盒子裡消失，這是學生最該被看見的進展。
    const before = new Set(batch.map((m) => m.id));

    const quiz = ChoiceQuiz({
      items: batch.map(toQuizItem),
      // ChoiceQuiz 依 item._mistakeId 自己把升降格寫回盒子，這裡只負責結算畫面。
      onComplete: () => {
        const stillThere = new Set(allMistakes(lessonId).map((m) => m.id));
        const learned = [...before].filter((id) => !stillThere.has(id)).length;
        const moreDue = dueMistakes(lessonId).length;
        // 蓋掉 ChoiceQuiz 的預設完成畫面：錯題複習的重點不是「這批對幾題」，
        // 而是「有幾題學會了、還剩幾題」。
        setTimeout(() => {
          clear(body);
          body.appendChild(summary({ learned, moreDue, lessonId, backHref, backLabel, onNext: renderBatch }));
        }, 0);
      },
      onBack: () => {
        window.location.hash = backHref;
      },
      backLabel,
    });
    body.appendChild(quiz);
  }

  renderBatch();
  return root;
}

// 一批複習完的結算畫面。
function summary({ learned, moreDue, lessonId, backHref, backLabel, onNext }) {
  const days = daysUntilNextDue(lessonId);
  const pending = allMistakes(lessonId).length;

  const title = learned ? `太棒了！有 ${learned} 題學會了` : '這一批複習完了';
  const lines = [];
  if (learned) lines.push(`學會的題目不會再出現（連續答對 ${BOX_DAYS.length} 次就算學會）。`);
  if (moreDue) lines.push(`今天還有 ${moreDue} 題要複習。`);
  else if (pending) lines.push(`還有 ${pending} 題在練習中${days ? `，${days} 天後會再出現` : ''}。`);
  else lines.push('今天的錯題都複習完了。');
  const note = lines.join('');

  const actions = [];
  if (moreDue) {
    const next = h('button', { class: 'btn btn--primary', type: 'button' }, '再複習下一批');
    next.addEventListener('click', onNext);
    actions.push(next);
  }
  actions.push(h('a', { class: moreDue ? 'btn' : 'btn btn--primary', href: backHref }, backLabel));

  return h('div', { class: 'card card--centered' }, [
    h('p', { class: 'outcome__icon', 'aria-hidden': 'true' }, learned ? '🏅' : '🎉'),
    h('div', { class: 'quiz-option-row' }, [
      h('h1', { class: 'outcome__title' }, title),
      SpeakButton({ text: `${title}。${note}`, label: '聽', variant: 'speak-button--option' }),
    ]),
    h('p', { class: 'outcome__note' }, note),
    h('div', { class: 'quiz-option-row' }, actions),
  ]);
}

// 老師打 ✗ 的句子：用同一個句型再寫一次。
function renderRedo(entry, remaining, onDone) {
  const wrap = h('div', {});
  wrap.appendChild(
    TaskBanner({
      label: '老師請你再寫一次這一句。',
      step: remaining > 1 ? `還有 ${remaining - 1} 句要重寫` : '',
    }),
  );
  wrap.appendChild(
    h('div', { class: 'card redo-previous' }, [
      h('p', { class: 'meta' }, '你上次寫的是'),
      h('p', { class: 'redo-previous__text' }, entry.text),
    ]),
  );

  const pattern = {
    id: entry.patternId,
    head: entry.patternHead,
    structure: entry.structure,
    description: '',
    examples: [],
  };
  // 不帶入上次寫的句子：要重寫就重新想一次，不是改錯字。
  wrap.appendChild(
    SentenceWriter({
      lessonId: entry.lessonId,
      pattern,
      onDone: () => setTimeout(onDone, 1200),
    }),
  );

  const skip = h('button', { class: 'btn', type: 'button' }, '今天先跳過這一句');
  skip.addEventListener('click', () => {
    skipToday(entry.lessonId, entry.patternId);
    onDone();
  });
  wrap.appendChild(h('div', { class: 'quiz-option-row' }, [skip]));
  return wrap;
}

function emptyState(lessonId, backHref, backLabel) {
  const pending = allMistakes(lessonId);
  const days = daysUntilNextDue(lessonId);
  const done = pending.length > 0;

  const title = done ? '今天的錯題都複習完了！' : '目前沒有錯題';
  const note = done
    ? `還有 ${pending.length} 題在練習中${days ? `，${days} 天後會再出現` : ''}。`
    : '做練習時第一次沒答對的題目，會自動收到這裡。';

  return h('div', { class: 'card card--centered' }, [
    h('p', { class: 'outcome__icon', 'aria-hidden': 'true' }, done ? '🎉' : '📥'),
    h('div', { class: 'quiz-option-row' }, [
      h('h1', { class: 'outcome__title' }, title),
      SpeakButton({ text: `${title} ${note}`, label: '聽', variant: 'speak-button--option' }),
    ]),
    h('p', { class: 'outcome__note' }, note),
    h('a', { class: 'btn btn--primary', href: backHref }, backLabel),
  ]);
}

/** 給課次首頁／首頁用的入口按鈕；沒有到期錯題時回 null（不顯示）。 */
export function mistakeEntry(lessonId, count) {
  if (!count) return null;
  const href = lessonId ? `#/mistakes/${lessonId}` : '#/mistakes';
  return h('a', { class: 'entry-card entry-card--accent entry-card--mistake', href }, [
    h('span', { class: 'entry-card__icon', 'aria-hidden': 'true' }, '🔁'),
    h('span', { class: 'entry-card__body' }, [
      h('span', { class: 'entry-card__title' }, '錯題複習'),
      h('span', { class: 'entry-card__desc' }, '把之前答錯的題目再做一次。'),
    ]),
    h('span', { class: 'entry-card__badge', 'aria-label': `${count} 題待複習` }, String(count)),
  ]);
}
