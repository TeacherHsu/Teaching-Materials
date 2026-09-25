import { h } from '../utils/dom.js';
import { SpeakButton } from './SpeakButton.js';

const TASK_ICON = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l2 2l4-4"/><rect x="3" y="4" width="18" height="16" rx="3"/></svg>`;

function simplifyStep(step) {
  if (!step) return '';
  return step
    .replace(/(?:^|\s*・\s*)第\s*1\s*組\s*[／/]\s*共\s*1\s*組\s*$/u, '')
    .replace(/\s*・\s*$/u, '')
    .trim();
}

/**
 * 「現在要做什麼」任務說明列：一畫面一任務時放在頁面最上方，
 * 讓學生隨時看得到「現在做什麼」。帶大項主題色左邊框＋小圖示
 * （色彩來自 ModulePage 注入在祖先元素的 --module-color CSS 變數）。
 * @param {{label: string, step？: string}} opts
 */
export function TaskBanner({ label, step }) {
  const visibleStep = simplifyStep(step);
  const text = visibleStep ? `${label}（${visibleStep}）` : label;
  return h('div', { class: 'task-banner', role: 'status', 'aria-live': 'polite' }, [
    h('span', { class: 'task-banner__icon', 'aria-hidden': 'true', html: TASK_ICON }),
    h('div', { class: 'task-banner__body' }, [
      h('span', { class: 'task-banner__eyebrow' }, '現在要做什麼'),
      h('div', { class: 'quiz-option-row' }, [
        h('p', { class: 'task-banner__label' }, text),
        SpeakButton({ text: label, label: '聽', variant: 'speak-button--option' }),
      ]),
    ]),
  ]);
}
