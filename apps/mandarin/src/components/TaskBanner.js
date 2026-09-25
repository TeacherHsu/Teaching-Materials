import { h } from '../utils/dom.js';
import { SpeakButton } from './SpeakButton.js';

/**
 * 「現在要做什麼」任務說明列：一畫面一任務時放在頁面最上方，
 * 讓學生隨時看得到「現在做什麼」。
 * @param {{label: string, step？: string}} opts
 */
export function TaskBanner({ label, step }) {
  const text = step ? `${label}（${step}）` : label;
  return h('div', { class: 'task-banner', role: 'status', 'aria-live': 'polite' }, [
    h('span', { class: 'task-banner__eyebrow' }, '現在要做什麼'),
    h('div', { class: 'quiz-option-row' }, [
      h('p', { class: 'task-banner__label' }, text),
      SpeakButton({ text: label, label: '聽', variant: 'speak-button--option' }),
    ]),
  ]);
}
