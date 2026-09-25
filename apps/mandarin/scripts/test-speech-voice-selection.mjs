// 驗證朗讀核心（src/utils/speech.js）：
//   1. 聲音選擇：只有 zh-CN 時不選、回報缺台灣聲音；有 zh-TW／Meijia／Google 國語（臺灣）時選中。
//   2. 讀音替代表（TTS 替代字）套用：課次專屬 overrides 優先於全域表，全域表含「一會兒」案例。
//   3. speak() 實際送進 SpeechSynthesisUtterance 的字串是替代後的文字，lang 固定 zh-TW。
// 無新依賴，純 Node（scripts/fake-dom.mjs 的 DOM／speechSynthesis stub）。
// 用法：node scripts/test-speech-voice-selection.mjs
import assert from 'node:assert/strict';
import { installFakeDom, installFakeSpeechSynthesis } from './fake-dom.mjs';

installFakeDom();
const {
  pickTaiwanVoice,
  hasTaiwanVoice,
  applySpeechOverrides,
  speak,
  ensureVoicesLoaded,
  shouldWarnNoTaiwanVoice,
} = await import('../src/utils/speech.js');

// --- 1a. 只有 zh-CN：不應選中，且應回報缺台灣聲音 ---
{
  const voices = [{ lang: 'zh-CN', name: 'Tingting' }];
  assert.equal(pickTaiwanVoice(voices), null, '只有 zh-CN 時不應選中任何聲音');
  assert.equal(hasTaiwanVoice(voices), false, '只有 zh-CN 時應回報沒有台灣聲音');
}

// --- 1b. 有 zh-TW／Meijia：應選中 ---
{
  const meijia = { lang: 'zh-TW', name: 'Meijia' };
  const voices = [{ lang: 'zh-CN', name: 'Tingting' }, meijia];
  assert.equal(pickTaiwanVoice(voices), meijia, '有 zh-TW／Meijia 時應選中該聲音');
}

// --- 1c. 只有名稱含「國語（臺灣）」（lang 可能不精確）：靠名稱關鍵字仍應選中 ---
{
  const googleTw = { lang: 'cmn-Hant-TW', name: 'Google 國語（臺灣）' };
  const voices = [{ lang: 'zh-CN', name: 'Google 普通話（中國大陸）' }, googleTw];
  assert.equal(pickTaiwanVoice(voices), googleTw, 'Google 國語（臺灣）應被選中');
}

// --- 1d. 禁止退回 zh-HK ---
{
  const voices = [{ lang: 'zh-HK', name: 'Sinji' }];
  assert.equal(pickTaiwanVoice(voices), null, '不應退回 zh-HK 聲音');
}

console.log('PASS (1/3): 聲音選擇嚴格優先 zh-TW，不退回 zh-CN／zh-HK。');

// --- 2. 讀音替代表 ---
assert.equal(applySpeechOverrides('一會兒'), '義毀ㄦ', '全域替代表應涵蓋「一會兒」（ADR-0023 案例）');
assert.equal(
  applySpeechOverrides('等一會兒再走'),
  '等義毀ㄦ再走',
  '含替代詞的長句也應正確替換',
);
assert.equal(
  applySpeechOverrides('一會兒', [{ text: '一會兒', speak: '課次專屬讀法' }]),
  '課次專屬讀法',
  '課次專屬 overrides 應優先於全域替代表',
);
assert.equal(applySpeechOverrides('普通句子'), '普通句子', '沒有替代規則時應原樣輸出');

console.log('PASS (2/3): 讀音替代表（TTS 替代字）套用邏輯正確，課次專屬優先於全域表。');

// --- 3. speak() 送進合成語音的文字是替代後的文字，lang 固定 zh-TW ---
{
  const synth = installFakeSpeechSynthesis([{ lang: 'zh-TW', name: 'Meijia' }]);
  let spokenText = null;
  let spokenLang = null;
  const originalSpeak = synth.speak.bind(synth);
  synth.speak = (utter) => {
    spokenText = utter.text;
    spokenLang = utter.lang;
    originalSpeak(utter);
  };
  await ensureVoicesLoaded();
  await speak('一會兒');
  assert.equal(spokenText, '義毀ㄦ', '合成語音應唸替代後的字串，不是原字面');
  assert.equal(spokenLang, 'zh-TW', 'utterance.lang 應固定為 zh-TW');

  const shouldWarn = await shouldWarnNoTaiwanVoice();
  assert.equal(shouldWarn, false, '已有台灣聲音時不應顯示提示');
}

// --- 3b. 裝置只有 zh-CN 聲音時，應回報需要提示 ---
{
  installFakeSpeechSynthesis([{ lang: 'zh-CN', name: 'Tingting' }]);
  const shouldWarn = await shouldWarnNoTaiwanVoice();
  assert.equal(shouldWarn, true, '裝置只有 zh-CN 聲音時應顯示「沒有台灣聲音」提示');
}

console.log('PASS (3/3): speak() 送出替代後文字＋固定 zh-TW；缺台灣聲音時正確回報需要提示。');
