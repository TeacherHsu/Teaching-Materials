import { h } from '../utils/dom.js';

/**
 * 答錯時的 scaffold 提示，不是只給 X。
 * @param {{message: string}} opts
 */
export function HintPanel({ message }) {
  return h('div', { class: 'hint-panel', role: 'note', 'aria-live': 'polite' }, `💡 ${message}`);
}
