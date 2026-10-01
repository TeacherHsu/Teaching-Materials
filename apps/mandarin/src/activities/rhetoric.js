// 「修辭小偵探」模組（挑戰層）：依 11 修辭總表歸屬本課的修辭格，判斷生活句用了什麼修辭。
// 選項旁附兒童語言說明（child_note），每題逐題作答。
import { h, clear } from '../utils/dom.js';
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus } from '../utils/preview.js';

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// 官方修辭解析會用「﹁﹂」框出關鍵字；同時接受既有資料常見的「」與『』標記。
// 標記只供教材資料保存，不直接顯示在學生題幹中。
const RHETORIC_MARKUP = /﹁([^﹂]*)﹂|「([^」]*)」|『([^』]*)』/g;
const FALLBACK_FIGURES = ['譬喻', '擬人', '類疊', '排比', '設問', '感嘆', '摹寫', '轉化', '引用', '對偶'];

function highlightPlainText(text, highlightTerms) {
  const terms = [...new Set((highlightTerms || []).map((term) => String(term).trim()).filter(Boolean))]
    .sort((a, b) => b.length - a.length);
  if (!terms.length) return [{ text, highlighted: false }];

  const segments = [];
  let cursor = 0;
  while (cursor < text.length) {
    let nextIndex = -1;
    let nextTerm = '';
    for (const term of terms) {
      const index = text.indexOf(term, cursor);
      if (index < 0) continue;
      if (nextIndex < 0 || index < nextIndex || (index === nextIndex && term.length > nextTerm.length)) {
        nextIndex = index;
        nextTerm = term;
      }
    }
    if (nextIndex < 0) break;
    if (nextIndex > cursor) segments.push({ text: text.slice(cursor, nextIndex), highlighted: false });
    segments.push({ text: nextTerm, highlighted: true });
    cursor = nextIndex + nextTerm.length;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), highlighted: false });
  return segments.length ? segments : [{ text, highlighted: false }];
}

export function splitRhetoricExample(value = '', highlightTerms = []) {
  const text = String(value);
  const segments = [];
  let lastIndex = 0;

  for (const match of text.matchAll(RHETORIC_MARKUP)) {
    if (match.index > lastIndex) {
      segments.push(...highlightPlainText(text.slice(lastIndex, match.index), highlightTerms));
    }
    segments.push({ text: match[1] ?? match[2] ?? match[3], highlighted: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) segments.push(...highlightPlainText(text.slice(lastIndex), highlightTerms));
  return segments.length ? segments : [{ text: '', highlighted: false }];
}

export function stripRhetoricMarkup(value = '') {
  return splitRhetoricExample(value)
    .map(({ text }) => text)
    .join('');
}

function buildRhetoricStem(example, highlightTerms = []) {
  return [
    '這句話用了什麼修辭？「',
    ...splitRhetoricExample(example, highlightTerms).map(({ text, highlighted }) =>
      highlighted ? h('span', { class: 'rhetoric-highlight' }, text) : text,
    ),
    '」',
  ];
}

function buildChoiceItem(entry, all) {
  const availableFigures = [
    ...all.filter((r) => r.figure !== entry.figure).map((r) => r.figure),
    ...FALLBACK_FIGURES.filter((figure) => figure !== entry.figure),
  ];
  const distractors = [...new Set(shuffled(availableFigures))].slice(0, 2);
  const options = shuffled([...new Set([entry.figure, ...distractors])]);
  const stemText = `這句話用了什麼修辭？「${stripRhetoricMarkup(entry.example)}」`;
  return {
    id: entry.id,
    stem: stemText,
    stemText,
    stemContent: buildRhetoricStem(entry.example, entry.highlight_terms),
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
// 單課小考用：只出題、不畫面。和下面的 build*Activity 共用同一份出題邏輯，
// 題目才不會兩邊長得不一樣。
export function buildRhetoricQuizItems(lesson) {
  const entries = filterByStatus(lesson.rhetoric || []).filter((r) => r.example && r.figure);
  return entries.map((entry) => buildChoiceItem(entry, entries));
}

export function buildRhetoricActivity(lesson, onBack) {
  const entries = filterByStatus(lesson.rhetoric || []).filter((r) => r.example && r.figure);
  const rounds = entries.map((entry) => [buildChoiceItem(entry, entries)]);

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
      TaskBanner({ label: '讀句子，判斷用了什麼修辭（挑戰題）', step: roundIndex === 0 ? '' : '加練挑戰' }),
    );
    container.appendChild(
      ChoiceQuiz({
        items: rounds[roundIndex],
        backLabel: isLastRound ? '回課程首頁' : '本課先完成',
        onContinue: isLastRound ? null : () => {
          roundIndex += 1;
          renderStep();
        },
        onBack: () => {
          if (!isLastRound) {
            onBack();
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
