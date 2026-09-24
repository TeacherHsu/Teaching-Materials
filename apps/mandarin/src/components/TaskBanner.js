import { h } from '../utils/dom.js';

/**
 * 「現在要做什麼」任務說明列：一畫面一任務時放在頁面最上方，
 * 讓學生隨時看得到「現在做什麼」。
 * @param {{label: string, step？: string}} opts
 */
export function TaskBanner({ label, step }) {
  return h('div', { class: 'task-banner', role: 'status', 'aria-live': 'polite' }, [
    h('span', { class: 'task-banner__eyebrow' }, '現在要做什麼'),
    h('p', { class: 'task-banner__label' }, step ? `${label}（${step}）` : label),
  ]);
}
