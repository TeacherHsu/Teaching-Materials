import { h } from '../utils/dom.js';
import { SpeakButton } from './SpeakButton.js';

const BULB = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2l.1.7h4.8l.1-.7c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3Z"/></svg>';

/**
 * 答錯時的 scaffold 提示，不是只給 X。
 * @param {{message: string}} opts
 */
export function HintPanel({ message }) {
  return h('div', { class: 'hint-panel quiz-option-row', role: 'note', 'aria-live': 'polite' }, [
    // 原本用 💡 表情符號；CF 要求減少 emoji，改成和全站一致的線條燈泡。
    h('span', { class: 'hint-panel__icon', 'aria-hidden': 'true', html: BULB }),
    h('span', {}, message),
    SpeakButton({ text: message, label: '聽', variant: 'speak-button--option' }),
  ]);
}
