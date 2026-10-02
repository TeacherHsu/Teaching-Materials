// 「一字多義」模組：依 06 字義分析中有 ≥2 個字義的生字，逐句判斷該字在句中的意思。
// 每字每個義項各出一句三年級生活句（字挖空／標底線），ChoiceQuiz 一組 3–5 題。
import { h, clear } from '../utils/dom.js';
import { shuffle as shuffled } from '../utils/shuffle.js';
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus } from '../utils/preview.js';
import { chunkRounds } from '../utils/chunk.js';
import { SpeakButton } from '../components/SpeakButton.js';



// 語詞題的資料是樣板句，兩種寫法都有：
//   請看語詞「固守」中的「固」，想一想這個字在語詞中的意思。
//   語詞「固守」中的「固」，就是指堅決的。（舊資料，正解接在後面）
// 抽出語詞本身；不是語詞題就回 null。
export function wordOnlyTerm(text) {
  const m = String(text || '').match(/^(?:請看)?語詞「(.+?)」中的「.+?」/u);
  return m ? m[1] : null;
}

// 題目問的是「字」在句中的意思，所以只凸顯目標字本身；資料裡《》可能框住整個詞
// （例：《併吞》），這裡去掉《》，把詞加底線、目標字另外標色，避免學生以為要解釋整個詞。
function sentenceCard(entry) {
  const raw = entry.sentence || '';
  const rawClean = raw.replace(/[《》]/g, '');
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
  let clean = rawClean;
  const term = wordOnlyTerm(rawClean);
  if (term) {
    // 語詞題（466 題）：畫面上只放語詞本身，放大、標出目標字。
    // 原本是「請看語詞『固守』中的『固』，想一想這個字在語詞中的意思。」
    // 再加上題目「『固』在這句話裡是什麼意思？」——兩句話說同一件事，
    // 而且它根本不是一句話（CF 2026-10-03：拗口冗長）。
    clean = term;
    p.classList.add('polysemy-sentence--word');
    pushWord(term);
  } else if (m) {
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
  const term = wordOnlyTerm(entry.sentence);
  const where = term ? `「${term}」的` : '這裡的';
  const stem = `${where}「${entry.char}」是什麼意思？`;
  return {
    id: entry.id,
    extra: card.el,
    stem,
    readAllStem: term ? stem : `${card.clean}　${stem}`,
    options,
    answer: entry.definition,
    explanation: `${where}「${entry.char}」是：${entry.definition}`,
    // 一字多義最實用的策略是「代入」：把每個意思放回去讀，通順的就是。
    hints: ['把每個意思放進去讀讀看，哪一個最通順？'],
  };
}

/**
 * @param {object} lesson
 * @param {() => void} onBack
 */
// 單課小考用：只出題、不畫面。和下面的 build*Activity 共用同一份出題邏輯，
// 題目才不會兩邊長得不一樣。
export function buildPolysemyQuizItems(lesson) {
  return filterByStatus(lesson.polysemy || [])
    .filter((p) => p.sentence && p.definition)
    .map(buildChoiceItem);
}

export function buildPolysemyActivity(lesson, onBack) {
  const entries = filterByStatus(lesson.polysemy || []).filter((p) => p.sentence && p.definition);
  const rounds = chunkRounds(entries).map((round) => round.map(buildChoiceItem));

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
      TaskBanner({ label: '選出標色的字是什麼意思', step: roundIndex === 0 ? '' : '加練挑戰' }),
    );
    container.appendChild(
      ChoiceQuiz({
        items: rounds[roundIndex],
        backLabel: isLastRound ? '回課程首頁' : '本課先完成',
        onBack: () => {
          if (!isLastRound) {
            onBack();
          } else {
            onBack();
          }
        },
        onContinue: isLastRound ? null : () => {
          roundIndex += 1;
          renderStep();
        },
      }),
    );
  }

  renderStep();
  return container;
}
