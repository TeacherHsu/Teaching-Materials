// 「修辭小偵探」模組（挑戰層）：依 11 修辭總表歸屬本課的修辭格，判斷生活句用了什麼修辭。
// 選項旁附兒童語言說明（child_note），ChoiceQuiz 一組 3–5 題。
import { h, clear } from '../utils/dom.js';
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus } from '../utils/preview.js';
import { chunkRounds } from '../utils/chunk.js';

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildChoiceItem(entry, all) {
  const distractors = shuffled(all.filter((r) => r.figure !== entry.figure)).slice(0, 2).map((r) => r.figure);
  const options = shuffled([...new Set([entry.figure, ...distractors])]);
  return {
    id: entry.id,
    stem: `這句話用了什麼修辭？「${entry.example}」`,
    options,
    answer: entry.figure,
    explanation: `${entry.figure}：${entry.child_note || entry.note}`,
    hints: [entry.child_note || '再想一想這句話的寫法特別在哪裡。'],
  };
}

/**
 * @param {object} lesson
 * @param {() => void} onBack
 */
export function buildRhetoricActivity(lesson, onBack) {
  const entries = filterByStatus(lesson.rhetoric || []).filter((r) => r.example && r.figure);
  const rounds = chunkRounds(entries, { min: 3, max: 5 }).map((round) => round.map((r) => buildChoiceItem(r, entries)));

  const container = h('div', {});
  let roundIndex = 0;

  function renderStep() {
    clear(container);
    if (rounds.length === 0) {
      container.appendChild(missingContentNotice('修辭小偵探：教材審核中'));
      return;
    }
    const isLastRound = roundIndex === rounds.length - 1;
    container.appendChild(
      TaskBanner({ label: '讀句子，判斷用了什麼修辭（挑戰題）', step: `第 ${roundIndex + 1} 組／共 ${rounds.length} 組` }),
    );
    container.appendChild(
      ChoiceQuiz({
        items: rounds[roundIndex],
        backLabel: isLastRound ? '回課程首頁' : '再來一組',
        onBack: () => {
          if (!isLastRound) {
            roundIndex += 1;
            renderStep();
          } else {
            onBack();
          }
        },
      }),
    );
  }

  renderStep();
  return container;
}
