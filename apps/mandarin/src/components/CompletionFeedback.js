import { h } from '../utils/dom.js';
import { SpeakButton } from './SpeakButton.js';

const BADGE_ICON = `<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3l6-6.5"/></svg>`;

/**
 * 每一輪（非整個大項）的完成小卡：大勾勾徽章＋「完成了！」。
 * 星星（大項最佳成績）只在整個大項結束時由 ModulePage 另外的摘要卡顯示，
 * 這裡只負責「這一輪答對幾題」，避免同一次作答被算兩次星星。
 * @param {{correct: number, total: number, onRetry?: () => void, onBack?: () => void, backLabel?: string}} opts
 */
export function CompletionFeedback({ correct, total, onRetry, onBack, backLabel = '回課程首頁' }) {
  const message = `答對 ${correct} / ${total} 題`;
  const wrap = h('div', { class: 'completion-feedback', role: 'status', 'aria-live': 'polite' }, [
    h('span', { class: 'completion-feedback__badge', 'aria-hidden': 'true', html: BADGE_ICON }),
    h('h2', {}, '完成了！'),
    h('div', { class: 'quiz-option-row' }, [
      h('p', {}, message),
      SpeakButton({ text: message, label: '聽', variant: 'speak-button--option' }),
    ]),
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
