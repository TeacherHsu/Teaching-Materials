// Web Speech API 包裝：feature detect + graceful fallback。
// audio_override 一律優先於合成語音（教師裁定優先），由呼叫端傳入 audioUrl。

export function speechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

let cachedVoice = null;

function pickVoice() {
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  cachedVoice =
    voices.find((v) => v.lang === 'zh-TW') ||
    voices.find((v) => v.lang && v.lang.startsWith('zh')) ||
    null;
  return cachedVoice;
}

/**
 * 朗讀一段文字或播放覆寫音檔。
 * @param {string} text 要朗讀的文字
 * @param {{audioUrl?: string|null}} opts
 * @returns {Promise<void>}
 */
export function speak(text, opts = {}) {
  const { audioUrl } = opts;
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    return audio.play().catch(() => {
      // 音檔播放失敗（例如檔案不存在）時，退回合成語音，不擋操作
      return speakWithSynthesis(text);
    });
  }
  return speakWithSynthesis(text);
}

function speakWithSynthesis(text) {
  if (!speechSupported()) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'zh-TW';
      const voice = pickVoice();
      if (voice) utter.voice = voice;
      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (e) {
      resolve();
    }
  });
}

if (speechSupported()) {
  // 部分瀏覽器（Chrome）語音清單非同步載入，先觸發一次以暖機
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null;
  };
}
