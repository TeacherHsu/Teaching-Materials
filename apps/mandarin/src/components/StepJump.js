// 題組跳轉列（CF 2026-10-04）：一個關卡有好幾組題目時（例：認識生字＝生字卡／讀音／部首），
// 老師希望學生直接練後面的能力，不必每次從頭做起。
// 教師可在「課堂控制」關掉（避免學生跳過練習只為了拿星星）。
import { h } from '../utils/dom.js';
import { getShowStepJump } from '../utils/deviceSettings.js';

export const STEP_LABELS = {
  cards: '生字卡', choice: '選一選', 'learn-radical': '學找部首', radical: '找部首',
  recognition: '看圖認識', matching: '配對',
  patterns: '認識句型', ordering: '排句子', connectives: '選關聯詞', builder: '仿寫', write: '自己寫',
  map: '課文地圖', paragraphs: '一段一段讀', classify: '分類', decode: '詩句解碼', order: '排順序',
  'learn-clue': '學找線索', questions: '讀題找線索',
  search: '找字', mask: '遮蔽字', flash: '閃現',
  'read-chars': '念生字', 'read-words': '念語詞',
  summaries: '讀段落大意', gist: '選主旨',
  round1: '生字變成語', round2: '成語填句子', discuss: '說說看', 'learn-sound': '學讀音',
};

/** 各關卡的同名步驟在不同關卡意思不同時，用這裡覆寫。 */
const MODULE_OVERRIDES = {
  characters: { choice: '字音' },
  vocabulary: { choice: '看意思選詞' },
  idiom_builder: { choice: '選成語', matching: '成語配對' },
};

/**
 * @param {{ steps: string[], onJump: (index:number) => void, moduleKey?: string }} opts
 * @returns {{ el: HTMLElement, update: (index:number) => void }}
 */
export function StepJump({ steps, onJump, moduleKey = '' }) {
  const el = h('nav', { class: 'step-jump', 'aria-label': '題組' });
  const labels = { ...STEP_LABELS, ...(MODULE_OVERRIDES[moduleKey] || {}) };
  // 手機版面（2026-10-04 第二版審查 A5）：只佔一列——「第 2／5 組：讀音」＋「換題組」；
  // 按「換題組」才展開全部題組。展開後用文字＋形狀分出已做過（✓）、現在（▶）、還沒做。
  let open = false;
  let current = 0;
  function update(index) {
    current = index;
    while (el.firstChild) el.removeChild(el.firstChild);
    el.hidden = steps.length < 2 || !getShowStepJump();
    if (el.hidden) return;
    const toggle = h('button', { class: 'step-jump__toggle', type: 'button', 'aria-expanded': String(open) }, open ? '收起' : '換題組');
    toggle.addEventListener('click', () => { open = !open; update(current); });
    el.appendChild(h('div', { class: 'step-jump__bar' }, [
      h('span', { class: 'step-jump__now' }, `第 ${index + 1}／${steps.length} 組：${labels[steps[index]] || steps[index]}`),
      toggle,
    ]));
    if (!open) return;
    const list = h('div', { class: 'step-jump__list' });
    steps.forEach((step, i) => {
      const isCurrent = i === index;
      const state = isCurrent ? '▶ ' : i < index ? '✓ ' : '';
      const btn = h('button', {
        class: `step-jump__btn${isCurrent ? ' step-jump__btn--current' : ''}${i < index ? ' step-jump__btn--past' : ''}`,
        type: 'button',
        'aria-current': isCurrent ? 'step' : 'false',
        'aria-label': `${labels[step] || step}${isCurrent ? '（現在）' : i < index ? '（做過了）' : ''}`,
      }, `${state}${labels[step] || step}`);
      if (!isCurrent) btn.addEventListener('click', () => { open = false; onJump(i); });
      list.appendChild(btn);
    });
    el.appendChild(list);
  }
  return { el, update };
}
