// 注音音節切分與鍵盤對應。
//
// 語詞注音的資料格式不一致：有的用空白分隔（ㄌㄧㄢˊ ㄧ），有的沒有
// （ㄧㄡˊㄩㄥˇ）。要把「音」對到「字」就必須自己切音節，不能靠空白。
//
// 一個注音音節的結構：[聲母]?[介音]?[韻母]?[聲調]?
// 至少要有聲母、介音、韻母其中之一。空韻（ㄗ、ㄓ 單獨成音）也合法。

export const INITIALS = 'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ';
export const MEDIALS = 'ㄧㄨㄩ';
export const FINALS = 'ㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ';
export const TONES = 'ˊˇˋ˙';

/**
 * 切成音節。
 * @param {string} zhuyin
 * @returns {string[]} 每個元素是一個音節（含聲調），一聲不帶符號。
 */
export function splitSyllables(zhuyin) {
  const raw = String(zhuyin || '').trim();
  // 資料有用空白分隔時，空白就是最可靠的音節界線，優先採用；
  // 否則（例如四上的 ㄧㄡˊㄩㄥˇ）才用結構規則貪婪切分。
  // 「獅子王 → ㄕ ˙ㄗ ㄨㄤˊ」這種輕聲寫在前面的情形，只有靠空白才切得對。
  if (/\s/.test(raw)) {
    return raw.split(/\s+/).filter(Boolean).flatMap((chunk) => parseChunk(chunk));
  }
  return parseChunk(raw);
}

function parseChunk(chunk) {
  const src = String(chunk || '');
  const out = [];
  let i = 0;
  while (i < src.length) {
    const start = i;
    // 輕聲符號有時寫在音節前面（˙ㄉㄜ），先收起來，最後補到音節尾端。
    let leadingNeutral = '';
    if (src[i] === '˙') { leadingNeutral = '˙'; i += 1; }
    let syllable = '';
    if (INITIALS.includes(src[i])) { syllable += src[i]; i += 1; }
    if (MEDIALS.includes(src[i])) { syllable += src[i]; i += 1; }
    if (FINALS.includes(src[i])) { syllable += src[i]; i += 1; }
    if (!syllable) { i = start + 1; continue; }      // 無法辨識的字元：跳過
    if (TONES.includes(src[i])) { syllable += src[i]; i += 1; }
    else if (leadingNeutral) { syllable += leadingNeutral; }
    out.push(syllable);
  }
  return out;
}

/** 把音節拆成一顆一顆按鍵（聲母／介音／韻母／聲調），供逐鍵輸入比對。 */
export function syllableKeys(syllable) {
  return [...String(syllable || '')];
}

/** 語詞的注音是否能一一對應到每個字。 */
export function syllablesMatchWord(word, zhuyin) {
  const chars = [...String(word || '')];
  return chars.length > 0 && splitSyllables(zhuyin).length === chars.length;
}
