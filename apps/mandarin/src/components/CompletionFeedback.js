import { h } from '../utils/dom.js';
import { shouldShowBackButton } from '../utils/deviceSettings.js';
import { SpeakButton } from './SpeakButton.js';

const BADGE_ICON = `<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3l6-6.5"/></svg>`;

/**
 * 每一輪（非整個大項）的完成小卡：大勾勾徽章＋「完成了！」。
 * 星星（大項最佳成績）只在整個大項結束時由 ModulePage 另外的摘要卡顯示，
 * 這裡只負責「這一輪答對幾題」，避免同一次作答被算兩次星星。
 * @param {{correct: number, total: number, onRetry?: () => void, onBack?: () => void, backLabel?: string, onContinue?: () => void, continueLabel?: string}} opts
 */
export function CompletionFeedback({ correct, total, reviewedOnly = false, onRetry, onBack, backLabel = '回課程首頁', onContinue, continueLabel = '加練下一組' }) {
  // reviewedOnly：開放問答沒有收學生的答案，不能說「答對幾題」（2026-10-03 第二版審查 P0）
  const message = reviewedOnly ? `已看完 ${total} 題，記得和老師說說你的想法。` : `答對 ${correct} / ${total} 題`;
  const wrap = h('div', { class: 'completion-feedback', role: 'status', 'aria-live': 'polite' }, [
    h('span', { class: 'completion-feedback__badge', 'aria-hidden': 'true', html: BADGE_ICON }),
    h('h2', {}, reviewedOnly ? '看完了！' : '完成了！'),
    h('div', { class: 'quiz-option-row' }, [
      h('p', {}, message),
      SpeakButton({ text: message, label: '聽', variant: 'speak-button--option' }),
    ]),
  ]);
  const actions = h('div', { class: 'card-grid', style: 'margin-top:16px' }, []);
  if (onContinue) {
    actions.appendChild(h('button', { class: 'btn', type: 'button', onclick: onContinue }, continueLabel));
  }
  if (onRetry) {
    actions.appendChild(h('button', { class: 'btn', type: 'button', onclick: onRetry }, '再玩一次'));
  }
  if (onBack && shouldShowBackButton(backLabel)) {
    actions.appendChild(
      // 「本課先完成」預設不顯示（教師設定）：開著的話學生可以在任何一步
      // 中途離開，為了快點拿到星星而跳過練習。活動結束的「回課程首頁」
      // 不受影響，由 shouldShowBackButton 依標籤判斷。
      h('button', { class: 'btn btn--secondary', type: 'button', onclick: onBack }, backLabel),
    );
  }
  wrap.appendChild(actions);
  return wrap;
}
