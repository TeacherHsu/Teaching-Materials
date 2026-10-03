// 「形似字」模組：05字形辨別（文字方塊表格）形似字組，看語詞空格，從同組
// 形似字中選正確的字。題目與選項直接用課本例詞／字（直接公開類，不需要改寫），
// 所以資料 status 恆為 ready，不會有 draft 待審內容。
import { h, clear } from '../utils/dom.js';
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus } from '../utils/preview.js';
import { chunkRounds } from '../utils/chunk.js';
import { shuffle } from '../utils/shuffle.js';
import { loadHanziParts } from '../utils/hanziParts.js';
import { HanziCompare } from '../components/HanziCompare.js';

function splitExamples(example) {
  return String(example)
    .split(/[、,，]/u)
    .map((term) => term.trim())
    .filter(Boolean);
}

function blankTarget(example, char) {
  const idx = example.indexOf(char);
  if (idx === -1) return null;
  return example.slice(0, idx) + '＿' + example.slice(idx + 1);
}

function usableGroups(lesson) {
  return filterByStatus(lesson.lookalikes || [])
    .filter((g) => !g.not_shape_similar) // 字形不像的組不出題（CF 2026-10-04）
    .map((g) => ({
      ...g,
      // 官方教材多半只在正確字上提供例詞；其餘形似字仍是必要的選項。
      chars: (g.chars || []).filter((c) => c.char),
    }))
    .filter((g) => g.chars.length >= 2);
}

/**
 * 三層提示（2026-10-03 審查建議：「比較部首或發音」沒指出這題的差異）。
 * 1. 讀整個詞、想意思；2. 用「別的字」的例詞做對照——看到錯的字用在哪裡，
 *    學生自己排除，不會直接看到答案；3. 把每個字放進詞裡自己念念看（不替他念：念出來等於給答案）。
 */
export function lookalikeHints(group, target, blanked, example) {
  const others = group.chars
    .filter((c) => c.char !== target.char && c.example)
    .map((c) => `「${c.char}」用在「${splitExamples(c.example)[0]}」`);
  return [
    { text: `先把「${blanked}」整個讀一讀，想想這個詞在說什麼。` },
    others.length
      ? { text: `比一比：${others.join('；')}。這個詞的意思和它們一樣嗎？` }
      : { text: '看看每個字不一樣的那一半：和意思有關的部首是哪一個？' },
    // 不念出語詞：形似字讀音多半不同，念出來就等於說出答案（2026-10-03 第二版審查）
    { text: `把每個字放進「${blanked}」念念看，哪一個和這個詞的意思有關？` },
  ];
}

/**
 * 第 2 層加上「部件上色」：把同組字並排，只標出彼此不一樣的部件（Make Me a Hanzi）。
 * 面板先藏著，學生要到第 2 層才看到；資料載不到就維持純文字提示。
 */
function withPartsPanel(item, group, volume) {
  if (typeof document === 'undefined') return item;
  const panel = h('div', { class: 'hanzi-compare-slot' });
  panel.hidden = true;
  const layer = item.hints[1];
  item.extra = panel;
  item.hints[1] = {
    ...layer,
    text: `${layer.text} 也看看上色的部分：這幾個字就差在那裡。`,
    on: () => {
      loadHanziParts(volume).then((data) => {
        const el = data && HanziCompare({
          chars: group.chars.map((c) => c.char),
          data,
          diff: data.lookalike_diff?.[group.id] || {},
        });
        if (!el) return;
        panel.replaceChildren(el);
        panel.hidden = false;
      });
    },
  };
  return item;
}

function buildChoiceItems(group, target, volume) {
  return splitExamples(target.example).flatMap((example, exampleIndex) => {
    const blanked = blankTarget(example, target.char);
    if (!blanked) return [];

    // 選項只用官方核對過的同組形似字（CF 2026-10-04），不另外補字
    const options = shuffle(group.chars.map((c) => c.char));
    return [{
      id: `${group.id}:${target.char}:${exampleIndex}`,
      stem: `「${blanked}」，空格裡應該填哪一個字？`,
      readAllStem: `${blanked}　空格裡應該填哪一個字？`,
      options,
      answer: target.char,
      explanation: `正確答案是「${target.char}」：${example}`,
      hints: lookalikeHints(group, target, blanked, example),
    }].map((item) => (volume ? withPartsPanel(item, group, volume) : item));
  });
}

/**
 * 將官方每個字的「例詞、例詞」拆成一個例詞一題，避免另一個完整例詞洩漏答案。
 * @param {object} lesson
 * @returns {Array<object>}
 */
export function buildLookalikeQuestionItems(lesson, { withParts = false } = {}) {
  const groups = usableGroups(lesson);
  const volume = withParts ? String(lesson.lesson_id || '').slice(0, 7) : null;
  const items = [];
  for (const group of groups) {
    for (const target of group.chars) {
      items.push(...buildChoiceItems(group, target, volume));
    }
  }
  return items;
}

/**
 * @param {object} lesson
 * @param {() => void} onBack
 */
export function buildLookalikesActivity(lesson, onBack) {
  const items = buildLookalikeQuestionItems(lesson, { withParts: true });
  const rounds = chunkRounds(items);

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
      TaskBanner({ label: '看語詞裡的空格，選出正確的字', step: roundIndex === 0 ? '' : '加練挑戰' }),
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
