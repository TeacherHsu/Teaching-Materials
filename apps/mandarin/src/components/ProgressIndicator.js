import { h } from '../utils/dom.js';

/**
 * 分段式進度：每題一格，已作答的格子填滿主題色、目前題外框強調，
 * 尚未作答的格子是空框。第一個子節點固定是文字「第 X / N 題」
 * （scripts/test-listening-single-round.mjs 會直接讀 children[0]，不能移動）。
 * @param {{current: number, total: number}} opts
 */
export function ProgressIndicator({ current, total }) {
  const segments = h('div', { class: 'progress-indicator__segments', 'aria-hidden': 'true' });
  for (let i = 1; i <= total; i += 1) {
    const filled = i < current; // 已完成的題目
    const isCurrent = i === current;
    const seg = h('span', {
      class: `progress-indicator__segment${filled ? ' progress-indicator__segment--filled' : ''}${isCurrent ? ' progress-indicator__segment--current' : ''}`,
    });
    segments.appendChild(seg);
  }
  return h('div', { class: 'progress-indicator', role: 'status', 'aria-live': 'polite' }, [
    h('span', {}, `第 ${current} / ${total} 題`),
    segments,
  ]);
}
