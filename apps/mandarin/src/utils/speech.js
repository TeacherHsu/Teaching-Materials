// Web Speech API 包裝：朗讀核心（feature detect + graceful fallback）。
// 設計依據：docs 派工需求「頁面上所有學生會讀的文字都要有語音按鈕，台灣腔調國語」。
//
// - 聲音選擇嚴格優先 zh-TW，禁止退回 zh-CN／zh-HK 聲音（避免學生學到不同腔調的讀音）。
// - audio_override（實體音檔）一律優先於合成語音（教師裁定優先）。
// - 讀音校正：沿用 sped-os Reading Tool 的「TTS 替代字」概念（見
//   ~/sped-os/90-meta/decisions/ADR-0023-reading-tool-jin4-and-tts-speech-overrides.md）：
//   顯示文字與送給 TTS 的字串可以不同（例如「一會兒」需唸成「義毀ㄦ」才不會被
//   合成語音唸錯）。全域替代表見 src/data/speech-overrides.json；courses 可在
//   lesson JSON 用 `speech_overrides: [{text, speak}]` 補課次專屬替代字。

import { SPEECH_OVERRIDES as globalOverrides } from '../data/speech-overrides.js';

const RATE_KEY = 'mandarin:speech-rate';
const DEFAULT_RATE = 0.85;
export const RATE_PRESETS = { slow: 0.7, normal: 0.85, fast: 1.0 };

const TAIWAN_LANGS = ['zh-tw', 'zh_tw', 'cmn-hant-tw'];
const TAIWAN_NAME_HINTS = [
  'taiwan',
  '臺灣',
  '台灣',
  'meijia',
  '美佳',
  'hsiaochen',
  'hsiaoyu',
  'yating',
  'hanhan',
  'zhiwei',
];
const NON_TAIWAN_ZH_LANGS = ['zh-cn', 'zh_cn', 'zh-hk', 'zh_hk', 'cmn-hans-cn', 'yue-hant-hk'];

export function speechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// ---- 語速（可在設定調整；slow/normal/fast，存 localStorage） ----

export function getRate() {
  if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_RATE;
  try {
    const raw = window.localStorage.getItem(RATE_KEY);
    const rate = raw ? parseFloat(raw) : DEFAULT_RATE;
    return Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_RATE;
  } catch (e) {
    return DEFAULT_RATE;
  }
}

export function setRate(rate) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(RATE_KEY, String(rate));
  } catch (e) {
    // 私密瀏覽模式等 localStorage 不可用時，安靜失敗，不影響朗讀本身
  }
}

// ---- 聲音選擇：嚴格優先 zh-TW，禁止退回 zh-CN／zh-HK ----

function isTaiwanVoice(voice) {
  const lang = (voice.lang || '').toLowerCase();
  if (TAIWAN_LANGS.includes(lang)) return true;
  const name = (voice.name || '').toLowerCase();
  return TAIWAN_NAME_HINTS.some((hint) => name.includes(hint.toLowerCase()));
}

function isNonTaiwanChinese(voice) {
  const lang = (voice.lang || '').toLowerCase();
  return NON_TAIWAN_ZH_LANGS.includes(lang);
}

/**
 * 從候選聲音清單挑出台灣腔調的聲音。純函式，供測試直接餵假 voices 清單。
 * @param {Array<{lang?: string, name?: string}>} voices
 * @returns {object|null}
 */
export function pickTaiwanVoice(voices) {
  if (!voices || voices.length === 0) return null;
  const taiwan = voices.find(isTaiwanVoice);
  return taiwan || null;
}

/** 是否完全沒有可用的台灣腔調聲音（用來決定要不要顯示提示）。 */
export function hasTaiwanVoice(voices) {
  return !!pickTaiwanVoice(voices);
}

let cachedVoices = null;
let voicesReadyPromise = null;

function readVoices() {
  if (!speechSupported()) return [];
  return window.speechSynthesis.getVoices() || [];
}

/**
 * 等待瀏覽器非同步載入完整聲音清單（Chrome/iOS 需要 voiceschanged 事件）。
 * @returns {Promise<Array>}
 */
export function ensureVoicesLoaded() {
  if (!speechSupported()) return Promise.resolve([]);
  const existing = readVoices();
  if (existing.length > 0) {
    cachedVoices = existing;
    return Promise.resolve(existing);
  }
  if (voicesReadyPromise) return voicesReadyPromise;
  voicesReadyPromise = new Promise((resolve) => {
    const handle = () => {
      const voices = readVoices();
      if (voices.length > 0) {
        cachedVoices = voices;
        window.speechSynthesis.removeEventListener?.('voiceschanged', handle);
        resolve(voices);
      }
    };
    window.speechSynthesis.addEventListener?.('voiceschanged', handle);
    // Safari/舊瀏覽器沒有事件時的保底：短延遲後再讀一次
    setTimeout(() => resolve(readVoices()), 500);
  });
  return voicesReadyPromise;
}

function pickVoice() {
  const voices = cachedVoices && cachedVoices.length ? cachedVoices : readVoices();
  return pickTaiwanVoice(voices);
}

// ---- 裝置沒有台灣聲音時的一次性提示文案 ----

export const NO_TAIWAN_VOICE_MESSAGE = '此裝置沒有台灣國語語音，發音可能不同，建議安裝「國語（臺灣）」語音。';

export const PLATFORM_VOICE_HINTS = [
  { platform: 'iPad / iPhone', hint: '設定 → 輔助使用 → 朗讀內容 → 聲音 → 中文（台灣）' },
  { platform: 'Windows', hint: '設定 → 時間與語言 → 語音 → 新增語音 → 中文(台灣)' },
  { platform: 'Chromebook / Android', hint: 'Google 文字轉語音 → 國語（臺灣）' },
];

/**
 * 檢查目前裝置是否需要顯示「沒有台灣聲音」提示。
 * @returns {Promise<boolean>}
 */
export async function shouldWarnNoTaiwanVoice() {
  if (!speechSupported()) return false;
  const voices = await ensureVoicesLoaded();
  if (voices.length === 0) return false; // 清單還沒就緒（例如 headless）時不誤報
  return !hasTaiwanVoice(voices);
}

// ---- 讀音校正（TTS 替代字） ----

/**
 * 套用讀音替代表：先套用呼叫端傳入的課次專屬 overrides（lesson.speech_overrides），
 * 找不到再套用全域替代表（src/data/speech-overrides.json）。
 * @param {string} text 顯示文字
 * @param {Array<{text:string, speak:string}>} [localOverrides] 課次專屬替代表
 * @returns {string} 送給 TTS 的字串
 */
export function applySpeechOverrides(text, localOverrides = []) {
  if (!text) return text;
  const local = (localOverrides || []).find((o) => o.text === text);
  if (local) return local.speak;
  if (Object.prototype.hasOwnProperty.call(globalOverrides, text)) {
    return globalOverrides[text];
  }
  // 沒有整段完全比對到時，逐一比對全域替代表的 key 是否為子字串並替換，
  // 讓「昨天一會兒就走了」這類含替代詞的長句也能正確替換。
  let result = text;
  for (const [key, value] of Object.entries(globalOverrides)) {
    if (result.includes(key)) result = result.split(key).join(value);
  }
  return result;
}

// ---- 朗讀 ----

let currentUtterance = null;

/**
 * 朗讀一段文字或播放覆寫音檔。呼叫端必須傳入「乾淨」的朗讀文字（不含注音符號、
 * 「（另開視窗）」等 UI 字樣），本函式不會自行抓 innerText。
 * @param {string} text 要朗讀的文字（顯示用，也作為 overrides 比對用的 key）
 * @param {{audioUrl?: string|null, overrides?: Array<{text:string,speak:string}>}} opts
 * @returns {Promise<void>}
 */
export function speak(text, opts = {}) {
  const { audioUrl, overrides } = opts;
  cancelSpeaking();
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    return audio.play().catch(() => speakWithSynthesis(text, overrides));
  }
  return speakWithSynthesis(text, overrides);
}

function speakWithSynthesis(text, overrides) {
  if (!speechSupported() || !text) return Promise.resolve();
  const speakText = applySpeechOverrides(text, overrides);
  return new Promise((resolve) => {
    try {
      const utter = new SpeechSynthesisUtterance(speakText);
      utter.lang = 'zh-TW';
      utter.rate = getRate();
      const voice = pickVoice();
      if (voice) utter.voice = voice;
      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      currentUtterance = utter;
      window.speechSynthesis.speak(utter);
    } catch (e) {
      resolve();
    }
  });
}

/** 停止目前正在朗讀的內容（例如使用者再按一次朗讀鈕）。 */
export function cancelSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel();
  currentUtterance = null;
}

export function isSpeaking() {
  return speechSupported() && window.speechSynthesis.speaking;
}

/**
 * 依序朗讀多段文字（供「全部唸給我聽」使用）。逐段等待上一段唸完才唸下一段。
 * @param {Array<{text:string, audioUrl?:string|null, overrides?:Array}>} segments
 * @returns {Promise<void>}
 */
export async function speakSequence(segments) {
  for (const seg of segments) {
    if (!seg || !seg.text) continue;
    // eslint-disable-next-line no-await-in-loop
    await speak(seg.text, { audioUrl: seg.audioUrl, overrides: seg.overrides });
  }
}

if (speechSupported()) {
  // 部分瀏覽器（Chrome）語音清單非同步載入，先觸發一次以暖機
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    cachedVoices = readVoices();
  });
  // 部分瀏覽器（Safari）需要主動呼叫一次 getVoices 才會開始載入
  readVoices();
}
