import { h } from '../utils/dom.js';
import { shouldWarnNoTaiwanVoice, NO_TAIWAN_VOICE_MESSAGE, PLATFORM_VOICE_HINTS } from '../utils/speech.js';

const SESSION_KEY = 'mandarin:voice-warning-dismissed';

function dismissed() {
  try {
    return typeof window !== 'undefined' && window.sessionStorage
      ? window.sessionStorage.getItem(SESSION_KEY) === '1'
      : false;
  } catch (e) {
    return false;
  }
}

function markDismissed() {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(SESSION_KEY, '1');
    }
  } catch (e) {
    // 私密瀏覽模式等情況下安靜失敗
  }
}

/**
 * 裝置沒有台灣腔調語音時，在頁首顯示一次性提示（每個瀏覽 session 只顯示一次，
 * 可手動關閉）。掛載後才非同步確認語音清單，確認前不佔版面。
 * @returns {HTMLElement} 一個空 wrapper，稍後可能被填入提示內容
 */
export function VoiceWarningBanner() {
  const wrap = h('div', { class: 'voice-warning-banner-slot' });
  if (dismissed()) return wrap;

  shouldWarnNoTaiwanVoice().then((shouldWarn) => {
    if (!shouldWarn || dismissed()) return;
    const hints = PLATFORM_VOICE_HINTS.map((h2) => `${h2.platform}：${h2.hint}`).join('　／　');
    const banner = h('div', { class: 'voice-warning-banner', role: 'note' }, [
      h('p', {}, NO_TAIWAN_VOICE_MESSAGE),
      h('p', { class: 'meta' }, hints),
    ]);
    const closeBtn = h('button', { class: 'voice-warning-banner__close', type: 'button', 'aria-label': '關閉提示' }, '×');
    closeBtn.addEventListener('click', () => {
      markDismissed();
      wrap.innerHTML = '';
    });
    banner.appendChild(closeBtn);
    wrap.appendChild(banner);
  });

  return wrap;
}
