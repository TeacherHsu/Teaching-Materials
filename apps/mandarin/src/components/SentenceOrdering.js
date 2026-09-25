import { h, clear } from '../utils/dom.js';
import { CompletionFeedback } from './CompletionFeedback.js';
import { SpeakButton } from './SpeakButton.js';
import { ReadAllButton } from './ReadAllButton.js';
import { shuffleDiffering } from '../utils/shuffle.js';
import { recordOutcome } from '../utils/scoreSession.js';
import { celebrateCorrect } from '../utils/celebrate.js';

/**
 * 句子排序：點選詞塊依序加入答案區；鍵盤可操作（button 逐一點選，
 * 不倚賴拖曳）。初始呈現順序保證被打亂（不等於正解、至少 2 個位置不同，seeded）。
 * 每個詞塊旁附獨立的小喇叭鈕（不與選字按鈕合一），可朗讀該詞塊但不會誤觸選字。
 * @param {{prompt: string, parts: string[], solution: string[], onBack?: () => void}} opts
 */
export function SentenceOrdering({ prompt, parts, solution, onBack }) {
  const root = h('div', { class: 'quiz-panel' });
  const chosen = [];
  const bank = shuffleDiffering(parts, `${prompt}|${parts.join('')}`);
  let mistakes = 0; // 沒有揭曉正解機制，只記是否一次就排對，供星星計分用

  root.appendChild(
    h('div', { class: 'quiz-title-row' }, [
      h('div', { class: 'quiz-option-row' }, [
        h('p', { class: 'quiz-stem' }, prompt),
        SpeakButton({ text: prompt, label: '聽', variant: 'speak-button--option' }),
      ]),
      ReadAllButton(() => ({ task: prompt, options: bank })),
    ]),
  );
  const slots = h('div', { class: 'sentence-slots', 'aria-label': '目前排出的句子' });
  const bankWrap = h('div', { class: 'sentence-bank', 'aria-label': '可選詞塊，詞塊旁的喇叭可以聽這個詞塊怎麼唸' });
  const status = h('p', { class: 'meta', role: 'status', 'aria-live': 'polite' });
  const checkBtn = h('button', { class: 'btn', type: 'button', style: 'margin-top:12px' }, '檢查答案');
  const resetBtn = h('button', { class: 'btn btn--secondary', type: 'button', style: 'margin-left:8px' }, '重新排列');
  const chips = [];

  function renderSlots() {
    clear(slots);
    chosen.forEach((word) => slots.appendChild(h('span', { class: 'sentence-chip' }, word)));
  }

  bank.forEach((word) => {
    const chip = h('button', { class: 'sentence-chip', type: 'button' }, word);
    chips.push(chip);
    chip.addEventListener('click', () => {
      if (chip.disabled) return;
      chosen.push(word);
      chip.disabled = true;
      chip.setAttribute('aria-pressed', 'true');
      renderSlots();
    });
    const row = h('span', { class: 'quiz-option-row', style: 'display:inline-flex' }, [
      chip,
      SpeakButton({ text: word, label: '聽', ariaLabel: `朗讀詞塊：${word}`, variant: 'speak-button--option' }),
    ]);
    bankWrap.appendChild(row);
  });

  checkBtn.addEventListener('click', () => {
    const isCorrect = chosen.join('') === solution.join('');
    if (isCorrect) {
      recordOutcome({ firstTry: mistakes === 0, revealed: false });
      celebrateCorrect(checkBtn, 'var(--module-color)', { firstTry: mistakes === 0 });
      const finished = chosen.join('');
      clear(root);
      root.appendChild(
        h('div', { class: 'quiz-option-row' }, [
          h('p', { class: 'quiz-stem' }, finished),
          SpeakButton({ text: finished, label: '聽完成句', variant: 'speak-button--option' }),
        ]),
      );
      root.appendChild(CompletionFeedback({ correct: 1, total: 1, onBack }));
    } else {
      mistakes += 1;
      status.textContent = '順序還不對，再想想看。';
    }
  });

  resetBtn.addEventListener('click', () => {
    chosen.length = 0;
    renderSlots();
    chips.forEach((c) => {
      c.disabled = false;
      c.setAttribute('aria-pressed', 'false');
    });
    status.textContent = '';
  });

  root.appendChild(slots);
  root.appendChild(bankWrap);
  root.appendChild(status);
  const actions = h('div', {});
  actions.appendChild(checkBtn);
  actions.appendChild(resetBtn);
  root.appendChild(actions);
  return root;
}
