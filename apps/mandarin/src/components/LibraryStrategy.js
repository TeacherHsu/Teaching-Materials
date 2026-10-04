// 依 strategyLibrary 的資料畫出「學方法」（看示範 → 一起做一步）。
import { h } from '../utils/dom.js';
import { SpeakButton } from './SpeakButton.js';
import { StrategyLesson, TapChoices, AskLine } from './StrategyLesson.js';
import { STRATEGY_LIBRARY } from '../activities/strategyLibrary.js';

function markLine(line, mark) {
  if (!mark || !line.includes(mark)) return line;
  const i = line.indexOf(mark);
  return [line.slice(0, i), h('mark', { class: 'evidence__key strategy-mark' }, mark), line.slice(i + mark.length)];
}

export function LibraryStrategy(key, onDone, onSkip = onDone) {
  const spec = STRATEGY_LIBRARY[key];
  if (!spec) return null;
  return StrategyLesson({
    title: spec.title,
    goal: spec.goal,
    frames: spec.frames.map((f) => ({
      say: f.say,
      render: () => h('div', { class: 'strategy-lines' }, f.lines.map((line) => h('div', { class: 'quiz-option-row' }, [
        // 問句（題目）用深藍色，和示範的短文區分
        h('p', { class: /[？?]\s*$/u.test(line) || /^題目/u.test(line) ? 'strategy-passage strategy-question' : 'strategy-passage' }, markLine(line, f.mark)),
        SpeakButton({ text: line, label: '聽', variant: 'speak-button--option' }),
      ]))),
    })),
    guided: (done) => {
      const g = spec.guided;
      const msg = h('p', { class: 'strategy-lesson__ask', role: 'status', 'aria-live': 'polite' });
      return h('div', {}, [
        AskLine(g.ask),
        TapChoices({
          label: '選一選',
          // 選項順序固定打散（不讓正解永遠在第一個），但每次一樣，方便老師示範
          items: g.choices.map((text, i) => ({ text, i })).sort((a, b) => ((a.i * 7 + 3) % 5) - ((b.i * 7 + 3) % 5)),
          isRight: (it) => it.i === g.answer,
          why: (it) => g.why[it.i] || '再想一想。',
          onRight: () => { msg.textContent = g.done; done(); },
        }),
        msg,
      ]);
    },
    onDone,
    onSkip,
    doneLabel: '開始練習',
  });
}
