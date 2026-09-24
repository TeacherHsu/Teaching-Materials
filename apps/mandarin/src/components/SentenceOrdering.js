import { h, clear } from '../utils/dom.js';
import { CompletionFeedback } from './CompletionFeedback.js';

/**
 * 句子排序：點選詞塊依序加入答案區；鍵盤可操作（button 逐一點選，
 * 不倚賴拖曳）。
 * @param {{prompt: string, parts: string[], solution: string[], onBack?: () => void}} opts
 */
export function SentenceOrdering({ prompt, parts, solution, onBack }) {
  const root = h('div', { class: 'quiz-panel' });
  const chosen = [];
  const bank = [...parts].sort(() => Math.random() - 0.5);

  root.appendChild(h('p', { class: 'quiz-stem' }, prompt));
  const slots = h('div', { class: 'sentence-slots', 'aria-label': '目前排出的句子' });
  const bankWrap = h('div', { class: 'sentence-bank', 'aria-label': '可選詞塊' });
  const status = h('p', { class: 'meta', role: 'status', 'aria-live': 'polite' });
  const checkBtn = h('button', { class: 'btn', type: 'button', style: 'margin-top:12px' }, '檢查答案');
  const resetBtn = h('button', { class: 'btn btn--secondary', type: 'button', style: 'margin-left:8px' }, '重新排列');

  function renderSlots() {
    clear(slots);
    chosen.forEach((word) => slots.appendChild(h('span', { class: 'sentence-chip' }, word)));
  }

  bank.forEach((word) => {
    const chip = h('button', { class: 'sentence-chip', type: 'button' }, word);
    chip.addEventListener('click', () => {
      if (chip.disabled) return;
      chosen.push(word);
      chip.disabled = true;
      chip.setAttribute('aria-pressed', 'true');
      renderSlots();
    });
    bankWrap.appendChild(chip);
  });

  checkBtn.addEventListener('click', () => {
    const isCorrect = chosen.join('') === solution.join('');
    if (isCorrect) {
      clear(root);
      root.appendChild(CompletionFeedback({ correct: 1, total: 1, onBack }));
    } else {
      status.textContent = '順序還不對，再想想看。';
    }
  });

  resetBtn.addEventListener('click', () => {
    chosen.length = 0;
    renderSlots();
    [...bankWrap.children].forEach((c) => {
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
