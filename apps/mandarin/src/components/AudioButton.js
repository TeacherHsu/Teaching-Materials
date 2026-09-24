import { h } from '../utils/dom.js';
import { speak, speechSupported } from '../utils/speech.js';

const ICON = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <path d="M4 9v6h4l5 5V4L8 9H4z"/>
  <path d="M16.5 12c0-1.77-.77-3.29-2-4.24v8.48c1.23-.95 2-2.47 2-4.24z"/>
</svg>`;

/**
 * @param {{text: string, audioUrl?: string|null, label?: string}} opts
 * @returns {HTMLElement}
 */
export function AudioButton({ text, audioUrl = null, label = '朗讀' }) {
  if (!speechSupported() && !audioUrl) {
    // 不支援語音且沒有覆寫音檔：隱藏按鈕，不擋操作
    const notice = h('span', { class: 'meta' }, '此裝置不支援朗讀');
    return notice;
  }
  const btn = h(
    'button',
    {
      class: 'audio-button',
      type: 'button',
      'aria-label': `${label}：${text}`,
      html: ICON + `<span>${label}</span>`,
    },
  );
  btn.addEventListener('click', () => {
    speak(text, { audioUrl });
  });
  return btn;
}
