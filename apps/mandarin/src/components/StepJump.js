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
  function update(index) {
    while (el.firstChild) el.removeChild(el.firstChild);
    el.hidden = steps.length < 2 || !getShowStepJump();
    if (el.hidden) return;
    el.appendChild(h('span', { class: 'step-jump__label' }, '題組：'));
    steps.forEach((step, i) => {
      const current = i === index;
      const btn = h('button', {
        class: `step-jump__btn${current ? ' step-jump__btn--current' : ''}`,
        type: 'button',
        'aria-current': current ? 'step' : 'false',
      }, labels[step] || step);
      if (!current) btn.addEventListener('click', () => onJump(i));
      el.appendChild(btn);
    });
  }
  return { el, update };
}
