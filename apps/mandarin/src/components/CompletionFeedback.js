import { h } from '../utils/dom.js';

/**
 * @param {{correct: number, total: number, onRetry?: () => void, onBack?: () => void, backLabel?: string}} opts
 */
export function CompletionFeedback({ correct, total, onRetry, onBack, backLabel = '回課程首頁' }) {
  const wrap = h('div', { class: 'completion-feedback', role: 'status', 'aria-live': 'polite' }, [
    h('h2', {}, '完成了！'),
    h('p', {}, `答對 ${correct} / ${total} 題`),
  ]);
  const actions = h('div', { class: 'card-grid', style: 'margin-top:16px' }, []);
  if (onRetry) {
    actions.appendChild(h('button', { class: 'btn', type: 'button', onclick: onRetry }, '再玩一次'));
  }
  if (onBack) {
    actions.appendChild(
      h('button', { class: 'btn btn--secondary', type: 'button', onclick: onBack }, backLabel),
    );
  }
  wrap.appendChild(actions);
  return wrap;
}
