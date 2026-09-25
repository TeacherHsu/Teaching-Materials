// 「一字多義」模組：依 06 字義分析中有 ≥2 個字義的生字，逐句判斷該字在句中的意思。
// 每字每個義項各出一句三年級生活句（字挖空／標底線），ChoiceQuiz 一組 3–5 題。
import { h, clear } from '../utils/dom.js';
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus } from '../utils/preview.js';
import { chunkRounds } from '../utils/chunk.js';
import { SpeakButton } from '../components/SpeakButton.js';

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// 題目問的是「字」在句中的意思，所以只凸顯目標字本身；資料裡《》可能框住整個詞
// （例：《併吞》），這裡去掉《》，把詞加底線、目標字另外標色，避免學生以為要解釋整個詞。
function sentenceCard(entry) {
  const raw = entry.sentence || '';
  const clean = raw.replace(/[《》]/g, '');
  const p = h('p', { class: 'polysemy-sentence' });
  const m = raw.match(/^(.*?)《(.*?)》(.*)$/);
  const pushWord = (word) => {
    if (!word.includes(entry.char)) { p.appendChild(document.createTextNode(word)); return; }
    // 詞內所有目標字都標色（例：庸庸碌碌 兩個「碌」）
    const parts = word.split(entry.char);
    const kids = [];
    parts.forEach((part, i) => {
      if (part) kids.push(part);
      if (i < parts.length - 1) kids.push(h('mark', { class: 'polysemy-sentence__char' }, entry.char));
    });
    p.appendChild(h('span', { class: 'polysemy-sentence__word' }, kids));
  };
  if (m) {
    p.appendChild(document.createTextNode(m[1]));
    pushWord(m[2]);
    p.appendChild(document.createTextNode(m[3]));
  } else {
    pushWord(clean);
  }
  return {
    clean,
    el: h('div', { class: 'quiz-option-row polysemy-sentence-row' }, [
      p,
      SpeakButton({ text: clean, variant: 'speak-button--option' }),
    ]),
  };
}

function buildChoiceItem(entry) {
  const options = shuffled([...new Set(entry.options)]);
  const card = sentenceCard(entry);
  const stem = `「${entry.char}」在這句話裡是什麼意思？`;
  return {
    id: entry.id,
    extra: card.el,
    stem,
    readAllStem: `${card.clean}　${stem}`,
    options,
    answer: entry.definition,
    explanation: `「${entry.char}」在這句話裡的意思是：${entry.definition}`,
    hints: [`把句子多讀一次，只看「${entry.char}」這個字，想想它在這裡講的是哪一種意思。`],
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
      TaskBanner({ label: '讀句子，選出標色的字在句子裡的意思', step: `第 ${roundIndex + 1} 組／共 ${rounds.length} 組` }),
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
