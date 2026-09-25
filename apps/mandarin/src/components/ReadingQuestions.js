import { h, clear } from '../utils/dom.js';
import { ProgressIndicator } from './ProgressIndicator.js';
import { CompletionFeedback } from './CompletionFeedback.js';
import { SpeakButton } from './SpeakButton.js';
import { ReadAllButton } from './ReadAllButton.js';
import { isPreview } from '../utils/preview.js';

/**
 * 閱讀理解提問：開放式問答，非選擇題，所以不判對錯，而是「想一想 → 看提示」
 * 的揭曉式互動。策略標籤（strategy_tag）只在預覽模式顯示給老師看，
 * 學生畫面不會出現「提取訊息／推論訊息」等後設標籤。
 * @param {{items: Array, onBack?: () => void, backLabel?: string}} opts
 */
export function ReadingQuestions({ items, onBack, backLabel = '回課程首頁' }) {
  const root = h('div', { class: 'quiz-panel' });
  let index = 0;
  const preview = isPreview();

  function render() {
    clear(root);
    if (index >= items.length) {
      root.appendChild(CompletionFeedback({ correct: items.length, total: items.length, onBack, backLabel }));
      return;
    }
    const item = items[index];
    root.appendChild(ProgressIndicator({ current: index + 1, total: items.length }));

    if (preview && item.status === 'draft') {
      root.appendChild(h('span', { class: 'review-pending-badge' }, '待審'));
    }
    if (preview && item.strategy_tag) {
      root.appendChild(h('p', { class: 'meta' }, `（教師預覽）策略標籤：${item.strategy_tag}`));
    }

    root.appendChild(
      h('div', { class: 'quiz-title-row' }, [
        h('div', { class: 'quiz-option-row' }, [
          h('p', { class: 'quiz-stem' }, item.stem),
          SpeakButton({ text: item.stem, label: '聽', variant: 'speak-button--option' }),
        ]),
        ReadAllButton(() => ({ stem: item.stem })),
      ]),
    );

    const revealSlot = h('div', { role: 'status', 'aria-live': 'polite' });
    const revealBtn = h('button', { class: 'btn btn--secondary', type: 'button', style: 'margin-top:12px' }, '看提示');
    revealBtn.addEventListener('click', () => {
      clear(revealSlot);
      const hintText = item.answer_hint || '想一想，說說看你的答案。';
      revealSlot.appendChild(
        h('div', { class: 'quiz-option-row' }, [
          h('p', { class: 'meta' }, hintText),
          SpeakButton({ text: hintText, label: '聽', variant: 'speak-button--option' }),
        ]),
      );
      revealBtn.disabled = true;
      root.appendChild(nextBtn);
    });

    const nextBtn = h('button', { class: 'btn', type: 'button', style: 'margin-top:16px' },
      index + 1 < items.length ? '下一題' : '看結果');
    nextBtn.addEventListener('click', () => {
      index += 1;
      render();
    });

    root.appendChild(revealBtn);
    root.appendChild(revealSlot);
  }

  render();
  return root;
}
