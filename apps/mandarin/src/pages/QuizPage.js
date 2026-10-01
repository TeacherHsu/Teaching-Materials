// 單課小考：#/lesson/<lesson_id>/quiz
//
// 從這一課各大項的選擇題各抽幾題，混在一起考，像定期評量。
// 和平常練習的差別只有一個：**不給提示、答錯一次就揭曉答案**。
// 不計時、不扣分、不排名——重點是讓學生先在接近評量的情境練過一次，
// 也讓教師看得出「混題之後還會不會」。
//
// 答錯的題目會自動進錯題盒（ChoiceQuiz 已經接好），考完可以直接去複習。
import { h, clear } from '../utils/dom.js';
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { volumeLabel } from '../utils/volumeLabel.js';
import { getScaffoldLevelKey } from '../utils/deviceSettings.js';
import { recordAttempt } from '../utils/records.js';
import { startMistakeContext, endMistakeContext, dueCount } from '../utils/mistakes.js';
import { findModuleEntry } from '../activities/moduleRegistry.js';
import { collectQuizBank, pickQuizItems, toQuizItem, QUIZ_SIZE } from '../activities/quizBank.js';

function moduleLabel(moduleKey) {
  const entry = findModuleEntry(moduleKey);
  return (entry && entry.label) || moduleKey;
}

export function QuizPage(lesson) {
  const lessonId = lesson.lesson_id;
  const root = h('div', { class: 'container' });
  root.appendChild(
    h('p', { class: 'breadcrumb' }, [
      h('a', { href: '#/' }, '首頁'),
      h('a', { href: `#/grade/${lesson.volume.grade}` }, volumeLabel(lesson.volume)),
      h('a', { href: `#/lesson/${lessonId}` }, `第 ${lesson.lesson_no} 課`),
      h('span', { class: 'breadcrumb__current' }, '單課小考'),
    ]),
  );

  const body = h('div', {});
  root.appendChild(body);
  const backHref = `#/lesson/${lessonId}`;

  const bank = collectQuizBank(lesson);
  const moduleKeys = Object.keys(bank);
  const target = QUIZ_SIZE[getScaffoldLevelKey()] || QUIZ_SIZE.standard;

  function renderIntro() {
    clear(body);
    if (!moduleKeys.length) {
      body.appendChild(
        h('div', { class: 'card quiz-intro' }, [
          h('p', { class: 'quiz-intro__icon', 'aria-hidden': 'true' }, '📝'),
          h('h1', { class: 'quiz-intro__title' }, '這一課還不能小考'),
          h('p', { class: 'quiz-intro__note' }, '要先有可以考的練習題，教材審核完成後就會開放。'),
          h('a', { class: 'btn btn--primary', href: backHref }, '回到本課'),
        ]),
      );
      return;
    }

    const picked = pickQuizItems(bank, target);
    const intro = `單課小考，一共 ${picked.length} 題，題目從各個練習站抽出來。這次沒有提示，答錯會直接告訴你答案。`;
    const start = h('button', { class: 'btn btn--primary', type: 'button' }, '開始小考');
    start.addEventListener('click', () => renderQuiz(picked));

    body.appendChild(
      h('div', { class: 'card quiz-intro' }, [
        h('p', { class: 'quiz-intro__icon', 'aria-hidden': 'true' }, '📝'),
        h('div', { class: 'quiz-option-row' }, [
          h('h1', { class: 'quiz-intro__title' }, `第 ${lesson.lesson_no} 課 單課小考`),
          SpeakButton({ text: intro, label: '聽', variant: 'speak-button--option' }),
        ]),
        h('p', { class: 'quiz-intro__note' }, [
          `一共 ${picked.length} 題，題目從各個練習站抽出來。`,
          h('br'),
          '這次沒有提示；答錯會告訴你正確答案，考完會放進錯題複習。',
        ]),
        h('div', { class: 'quiz-option-row' }, [start, h('a', { class: 'btn', href: backHref }, '回到本課')]),
      ]),
    );
  }

  function renderQuiz(picked) {
    clear(body);
    body.appendChild(TaskBanner({ label: '把每一題做完。這次沒有提示。', step: `共 ${picked.length} 題` }));

    // 各大項答對統計：考完讓教師看得出是哪一站弱。
    const perModule = {};
    picked.forEach((item) => {
      perModule[item._moduleKey] = perModule[item._moduleKey] || { total: 0, correct: 0 };
      perModule[item._moduleKey].total += 1;
    });

    // 小考也要收錯題，情境標成 _quiz 以便和平常練習區分。
    startMistakeContext(lessonId, '_quiz');

    let firstTryCount = 0;

    const items = picked.map((item) => {
      const quizItem = toQuizItem(item);
      // 考試模式：拿掉提示。ChoiceQuiz 會改用預設的「再看看題目」，不洩題。
      delete quizItem.hints;
      delete quizItem.hint;
      return quizItem;
    });

    const quiz = ChoiceQuiz({
      items,
      // 小考固定：答錯一次就揭曉答案，不受教師的鷹架設定影響。
      // 考試的重點是「混題之後還會不會」，不是讓學生在這裡反覆猜。
      wrongLimit: 1,
      // 題目不自動念——混題測驗自動念會變成逐題等它念完，節奏被拖垮。
      // 喇叭鈕仍然在，要聽隨時可以按。
      autoRead: false,
      // 逐題回呼：統計每一站第一次答對幾題。
      onItemResolved: ({ item, firstTry }) => {
        if (!firstTry) return;
        firstTryCount += 1;
        const stat = perModule[item._moduleKey];
        if (stat) stat.correct += 1;
      },
      onComplete: (correct, total) => {
        endMistakeContext();
        const session = { total, firstTryCount, revealedCount: total - firstTryCount };
        recordAttempt(lessonId, '_quiz', session);
        setTimeout(() => renderResult(session, perModule), 0);
      },
      onBack: () => {
        endMistakeContext();
        window.location.hash = backHref;
      },
      backLabel: '回到本課',
    });

    body.appendChild(quiz);
  }

  function renderResult(session, perModule) {
    clear(body);
    const score = session.total ? Math.round((session.firstTryCount / session.total) * 100) : 0;
    const rows = Object.entries(perModule).filter(([, v]) => v.total > 0);
    const wrong = session.total - session.firstTryCount;

    const headline = `小考完成，${score} 分。第一次就答對 ${session.firstTryCount} 題，共 ${session.total} 題。`;

    const table = h('table', { class: 'records quiz-result__table' }, [
      h('thead', {}, h('tr', {}, [h('th', {}, '練習站'), h('th', {}, '第一次答對')])),
      h(
        'tbody',
        {},
        rows.map(([key, v]) => h('tr', {}, [h('td', {}, moduleLabel(key)), h('td', {}, `${v.correct}／${v.total}`)])),
      ),
    ]);

    const actions = [];
    if (wrong > 0 && dueCount(lessonId)) {
      actions.push(h('a', { class: 'btn btn--primary', href: `#/mistakes/${lessonId}` }, '馬上複習答錯的'));
    }
    actions.push(h('a', { class: wrong > 0 ? 'btn' : 'btn btn--primary', href: backHref }, '回到本課'));

    body.appendChild(
      h('div', { class: 'card quiz-result' }, [
        h('p', { class: 'quiz-result__icon', 'aria-hidden': 'true' }, score >= 90 ? '🏆' : score >= 60 ? '👍' : '💪'),
        h('div', { class: 'quiz-option-row' }, [
          h('p', { class: 'quiz-result__score' }, `${score} 分`),
          SpeakButton({ text: headline, label: '聽', variant: 'speak-button--option' }),
        ]),
        h('p', { class: 'quiz-result__note' },
          `第一次就答對 ${session.firstTryCount}／${session.total} 題` + (wrong ? `，答錯的 ${wrong} 題已經放進錯題複習。` : '。')),
        table,
        h('div', { class: 'quiz-option-row' }, actions),
      ]),
    );
  }

  renderIntro();
  return root;
}

/** 課次首頁的小考入口；這一課沒有可考的題目時回 null。 */
export function quizEntry(lesson) {
  const bank = collectQuizBank(lesson);
  if (!Object.keys(bank).length) return null;
  return h('a', { class: 'quiz-entry', href: `#/lesson/${lesson.lesson_id}/quiz` }, [
    h('span', { class: 'quiz-entry__icon', 'aria-hidden': 'true' }, '📝'),
    h('span', { class: 'quiz-entry__text' }, [
      h('span', { class: 'quiz-entry__title' }, '單課小考'),
      h('span', { class: 'quiz-entry__desc' }, '各站的題目混在一起考，沒有提示。'),
    ]),
  ]);
}
