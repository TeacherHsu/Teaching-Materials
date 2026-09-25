import { h } from '../utils/dom.js';
import { speak, cancelSpeaking, speechSupported } from '../utils/speech.js';

const ICON = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
  <path d="M4 9v6h4l5 5V4L8 9H4z"/>
  <path d="M16.5 12c0-1.77-.77-3.29-2-4.24v8.48c1.23-.95 2-2.47 2-4.24z"/>
</svg>`;

function truncate(text, max = 20) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/**
 * 朗讀鈕：只顯示喇叭 icon（CF 2026-09-25：降低視覺干擾，不顯示文字；label 參數保留相容但不渲染），朗讀「乾淨文字」（呼叫端提供，不自行
 * 抓 innerText，避免把注音符號／「（另開視窗）」等 UI 字樣唸出來）。
 * @param {{
 *   text: string,                 // 要朗讀、也用於讀音替代表比對的文字
 *   audioUrl?: string|null,       // 有實體音檔時優先播放
 *   overrides?: Array<{text:string, speak:string}>, // 課次專屬讀音替代
 *   label?: string,               // 按鈕可見文字，預設「聽」
 *   ariaLabel?: string,           // 自訂 aria-label，預設「朗讀：<text 前 20 字>」
 *   variant?: string,             // 額外 class，例如 'speak-button--option'
 * }} opts
 * @returns {HTMLElement}
 */
export function SpeakButton({ text, audioUrl = null, overrides = [], label = '聽', ariaLabel, variant = '' }) {
  if (!speechSupported() && !audioUrl) {
    // 完全不支援 speechSynthesis 且沒有音檔：隱藏朗讀鈕，不擋操作
    return h('span', { class: 'speak-button__hidden', 'aria-hidden': 'true' });
  }
  const btn = h(
    'button',
    {
      class: `speak-button ${variant}`.trim(),
      type: 'button',
      'aria-label': ariaLabel || `朗讀：${truncate(text)}`,
      'aria-pressed': 'false',
      html: ICON,
    },
  );
  let speaking = false;

  function setSpeaking(next) {
    speaking = next;
    btn.setAttribute('aria-pressed', String(next));
    btn.classList.toggle('speak-button--active', next);
  }

  btn.addEventListener('click', (e) => {
    // 卡片本身可能也有點擊互動（例如 VocabularyCard 翻面）：朗讀鈕不應誤觸該互動
    e.stopPropagation();
    if (speaking) {
      cancelSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speak(text, { audioUrl, overrides }).finally(() => setSpeaking(false));
  });
  return btn;
}

// 向下相容：AudioButton 併入 SpeakButton，舊名稱仍可用。
export const AudioButton = SpeakButton;
