// 「一字多義」模組：依 06 字義分析中有 ≥2 個字義的生字，逐句判斷該字在句中的意思。
// 每字每個義項各出一句三年級生活句（字挖空／標底線），ChoiceQuiz 一組 3–5 題。
import { h, clear } from '../utils/dom.js';
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus } from '../utils/preview.js';
import { chunkRounds } from '../utils/chunk.js';

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildChoiceItem(entry) {
  const options = shuffled([...new Set(entry.options)]);
  return {
    id: entry.id,
    // 句子用《詞語》標示要判斷意思的字／詞（沿用資料裡的標記，ChoiceQuiz 以純文字呈現題幹）。
    stem: entry.sentence,
    options,
    answer: entry.definition,
    explanation: `「${entry.char}」在這句話裡的意思是：${entry.definition}`,
    hints: ['把句子多讀一次，想想這個字在這裡是不是講另一種意思。'],
  };
}

/**
 * @param {object} lesson
 * @param {() => void} onBack
 */
export function buildPolysemyActivity(lesson, onBack) {
  const entries = filterByStatus(lesson.polysemy || []).filter((p) => p.sentence && p.definition);
  const rounds = chunkRounds(entries, { min: 3, max: 5 }).map((round) => round.map(buildChoiceItem));

  const container = h('div', {});
  let roundIndex = 0;

  function renderStep() {
    clear(container);
    if (rounds.length === 0) {
      container.appendChild(missingContentNotice('一字多義：教材審核中'));
      return;
    }
    const isLastRound = roundIndex === rounds.length - 1;
    container.appendChild(
      TaskBanner({ label: '讀句子，選出這個字在句子裡的意思', step: `第 ${roundIndex + 1} 組／共 ${rounds.length} 組` }),
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
