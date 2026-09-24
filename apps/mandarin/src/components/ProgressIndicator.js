import { h } from '../utils/dom.js';

/**
 * @param {{current: number, total: number}} opts
 */
export function ProgressIndicator({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return h('div', { class: 'progress-indicator', role: 'status', 'aria-live': 'polite' }, [
    h('span', {}, `第 ${current} / ${total} 題`),
    h('div', { class: 'progress-indicator__bar' }, [
      h('div', { class: 'progress-indicator__fill', style: `width:${pct}%` }),
    ]),
  ]);
}
