import { h } from '../utils/dom.js';
import { speakSequence, cancelSpeaking, speechSupported } from '../utils/speech.js';

const ICON = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
  <path d="M4 9v6h4l5 5V4L8 9H4z"/>
  <path d="M16.5 12c0-1.77-.77-3.29-2-4.24v8.48c1.23-.95 2-2.47 2-4.24z"/>
  <path d="M19.5 6a9.5 9.5 0 0 1 0 12" stroke="currentColor" stroke-width="1.6" fill="none"/>
</svg>`;

/**
 * 依序組出「全部唸給我聽」的朗讀序列：標題 → 任務說明 → 題幹 → 選項
 * （選項前加「選項一、選項二…」）。純函式，供測試直接檢查組出的序列。
 * @param {{title?: string, task?: string, stem?: string, options?: string[]}} parts
 * @returns {Array<{text: string}>}
 */
export function buildReadAllSequence({ title, task, stem, options = [] } = {}) {
  const seq = [];
  if (title) seq.push({ text: title });
  if (task) seq.push({ text: task });
  if (stem) seq.push({ text: stem });
  const cn = ['一', '二', '三', '四', '五', '六', '七', '八'];
  options.forEach((opt, i) => {
    const prefix = `選項${cn[i] || i + 1}、`;
    seq.push({ text: `${prefix}${opt}` });
  });
  return seq;
}

/**
 * 活動頁頂部的「全部唸給我聽」按鈕：依序朗讀 標題→任務說明→題幹→選項。
 * @param {() => {title?: string, task?: string, stem?: string, options?: string[]}} getParts
 *   延遲取值（每次點擊當下重新讀 DOM/資料），因為題目會隨作答切換。
 */
export function ReadAllButton(getParts) {
  if (!speechSupported()) return h('span', { class: 'speak-button__hidden', 'aria-hidden': 'true' });
  const btn = h(
    'button',
    {
      class: 'speak-button speak-button--read-all',
      type: 'button',
      'aria-label': '全部唸給我聽',
      'aria-pressed': 'false',
      html: ICON + '<span class="speak-button__label">全部唸給我聽</span>',
    },
  );
  let playing = false;
  function setPlaying(next) {
    playing = next;
    btn.setAttribute('aria-pressed', String(next));
    btn.classList.toggle('speak-button--active', next);
  }
  btn.addEventListener('click', () => {
    if (playing) {
      cancelSpeaking();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    const parts = getParts ? getParts() : {};
    const sequence = buildReadAllSequence(parts);
    speakSequence(sequence).finally(() => setPlaying(false));
  });
  return btn;
}
