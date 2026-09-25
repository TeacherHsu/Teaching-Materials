import { h } from '../utils/dom.js';
import { SpeakButton } from './SpeakButton.js';

/**
 * 答錯時的 scaffold 提示，不是只給 X。
 * @param {{message: string}} opts
 */
export function HintPanel({ message }) {
  return h('div', { class: 'hint-panel quiz-option-row', role: 'note', 'aria-live': 'polite' }, [
    h('span', {}, `💡 ${message}`),
    SpeakButton({ text: message, label: '聽', variant: 'speak-button--option' }),
  ]);
}
