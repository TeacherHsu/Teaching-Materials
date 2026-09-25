// 「形似字」模組：05字形辨別（文字方塊表格）形似字組，看語詞空格，從同組
// 形似字中選正確的字。題目與選項直接用課本例詞／字（直接公開類，不需要改寫），
// 所以資料 status 恆為 ready，不會有 draft 待審內容。
import { h, clear } from '../utils/dom.js';
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus } from '../utils/preview.js';
import { chunkRounds } from '../utils/chunk.js';

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function blankFirstChar(example, char) {
  const idx = example.indexOf(char);
  if (idx === -1) return null;
  return example.slice(0, idx) + '＿' + example.slice(idx + 1);
}

function usableGroups(lesson) {
  return filterByStatus(lesson.lookalikes || [])
    .map((g) => ({
      ...g,
      chars: (g.chars || []).filter((c) => c.char && c.example),
    }))
    .filter((g) => g.chars.length >= 2);
}

function buildChoiceItem(group, target) {
  const blanked = blankFirstChar(target.example, target.char);
  const options = shuffled(group.chars.map((c) => c.char));
  return {
    id: `${group.id}:${target.char}`,
    stem: `「${blanked || target.example}」，空格裡應該填哪一個字？`,
    readAllStem: `${blanked || target.example}　空格裡應該填哪一個字？`,
    options,
    answer: target.char,
    explanation: `正確答案是「${target.char}」：${target.example}`,
    hints: [`這幾個字長得很像，比較一下部首或發音，想想哪一個字才對。`],
  };
}

/**
 * @param {object} lesson
 * @param {() => void} onBack
 */
export function buildLookalikesActivity(lesson, onBack) {
  const groups = usableGroups(lesson);
  const items = [];
  for (const group of groups) {
    for (const target of group.chars) {
      items.push(buildChoiceItem(group, target));
    }
  }
  const rounds = chunkRounds(items, { min: 3, max: 5 });

  const container = h('div', {});
  let roundIndex = 0;

  function renderStep() {
    clear(container);
    if (rounds.length === 0) {
      container.appendChild(missingContentNotice('形似字：教材審核中'));
      return;
    }
    const isLastRound = roundIndex === rounds.length - 1;
    container.appendChild(
      TaskBanner({ label: '看語詞裡的空格，選出正確的字', step: `第 ${roundIndex + 1} 組／共 ${rounds.length} 組` }),
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
