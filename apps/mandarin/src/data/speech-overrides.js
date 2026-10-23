// 全域 TTS 讀音替代表：顯示文字 → 送給合成語音的字串。
// 沿用 sped-os Reading Tool 的「TTS 替代字」概念，見
// ~/sped-os/90-meta/decisions/ADR-0023-reading-tool-jin4-and-tts-speech-overrides.md。
// 只放「已查證」的案例，其餘不猜。
export const SPEECH_OVERRIDES = {
  一會兒: '義毀ㄦ',
  馬偕: '馬接',
  // 「愛著」的著是輕聲 ˙ㄓㄜ，語音引擎會誤念 ㄓㄠˊ；嫬 讀 ˙ㄓㄜ，沿用 Reading Tool 115KG4A02 的替代字先例。
  愛著: '愛嫬',
};
