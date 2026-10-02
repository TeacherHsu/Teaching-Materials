import { h } from '../utils/dom.js';

function simplifyStep(step) {
  if (!step) return '';
  return step
    .replace(/(?:^|\s*・\s*)第\s*\d+\s*組\s*[／/]\s*共\s*\d+\s*組\s*$/u, '')
    .replace(/\s*・\s*$/u, '')
    .trim();
}

/**
 * 步驟進度列（原本的「現在要做什麼」卡片）。
 *
 * CF 2026-10-03：「現在要做什麼」是多餘資訊。原本每個畫面疊了三層說明——
 * 學習策略卡、這張卡、活動本身的題目——而這張卡的文字常和下面的題目重複
 * （卡片寫「把這兩段大意排回課文順序」，題目又寫一次）。它唯一不重複的資訊
 * 是「第幾步、共幾步」，所以只留進度和步驟名稱，縮成一條細線。
 * 步驟名稱取冒號前的短名（「一段一段讀：讀完這一段……」→「一段一段讀」）。
 * @param {{label: string, step？: string}} opts
 */
export function TaskBanner({ label, step }) {
  const visibleStep = simplifyStep(step);
  const name = String(label || '').split(/[：:]/u)[0].trim();
  const progress = (visibleStep.match(/第\s*(\d+)\s*步\s*[／/]\s*共\s*(\d+)\s*步/u) || []).slice(1);
  return h('p', { class: 'task-step', role: 'status', 'aria-live': 'polite' }, [
    progress.length
      ? h('span', { class: 'task-step__progress' }, `第 ${progress[0]}／${progress[1]} 步`)
      : (visibleStep ? h('span', { class: 'task-step__progress' }, visibleStep) : null),
    name ? h('span', { class: 'task-step__name' }, name) : null,
  ].filter(Boolean));
}
