// 注音音節切分與鍵盤對應。
//
// 語詞注音的資料格式不一致：有的用空白分隔（ㄌㄧㄢˊ ㄧ），有的沒有
// （ㄧㄡˊㄩㄥˇ）。要把「音」對到「字」就必須自己切音節，不能靠空白。
//
// 一個注音音節的結構：[聲母]?[介音]?[韻母]?[聲調]?
// 至少要有聲母、介音、韻母其中之一。空韻（ㄗ、ㄓ 單獨成音）也合法。
//
// ── 輕聲有兩種正當形式，不要混用 ──────────────────────
//   顯示形式（前置）：˙ㄌㄜ —— 台灣的印刷慣例，學生看到的就是這樣。
//                          資料檔與索引一律存這種形式。
//   按鍵形式（後置）：ㄌㄜ˙ —— 注音輸入法是最後才按聲調，所以「注音聽打」
//                          要的敲鍵順序是這樣。只在 syllableKeys() 裡出現。
// splitSyllables 回傳**顯示形式**；要敲鍵順序請用 syllableKeys()。

export const INITIALS = 'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ';
export const MEDIALS = 'ㄧㄨㄩ';
export const FINALS = 'ㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ';
export const TONES = 'ˊˇˋ˙';

/**
 * 輕聲符號一律前置。
 *
 * 台灣的注音寫法是把「˙」寫在音節**前面**（˙ㄌㄜ），但資料裡混進過後置的
 * 寫法（ㄌㄜ˙）——那會讓學生在語詞卡上看到錯的注音。這支把後置的搬到前面。
 *
 * 多音節時只搬「它自己那一個音節」：ㄐㄧㄝˇㄐㄧㄝ˙ → ㄐㄧㄝˇ˙ㄐㄧㄝ，
 * 不是搬到整串的最前面。
 */
export function normalizeZhuyin(text) {
  return String(text || '').replace(/([^\sˊˇˋ˙]+)˙/g, '˙$1');
}

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
    // 輕聲符號前置（˙ㄉㄜ）與後置（ㄉㄜ˙）的資料都碰過，一律輸出前置形式。
    let neutral = '';
    if (src[i] === '˙') { neutral = '˙'; i += 1; }
    let syllable = '';
    if (INITIALS.includes(src[i])) { syllable += src[i]; i += 1; }
    if (MEDIALS.includes(src[i])) { syllable += src[i]; i += 1; }
    if (FINALS.includes(src[i])) { syllable += src[i]; i += 1; }
    if (!syllable) { i = start + 1; continue; }      // 無法辨識的字元：跳過
    if (src[i] === '˙') { neutral = '˙'; i += 1; }
    else if (TONES.includes(src[i])) { syllable += src[i]; i += 1; }
    out.push(neutral + syllable);
  }
  return out;
}

/**
 * 把音節拆成一顆一顆按鍵（聲母／介音／韻母／聲調），供逐鍵輸入比對。
 * 輕聲在儲存時是前置（˙ㄌㄜ），但注音輸入法是**最後**才按聲調，
 * 所以敲鍵順序要把它移到尾端：˙ㄌㄜ → ㄌ ㄜ ˙。
 */
export function syllableKeys(syllable) {
  const text = String(syllable || '');
  const keys = text.startsWith('˙') ? `${text.slice(1)}˙` : text;
  return [...keys];
}

/** 語詞的注音是否能一一對應到每個字。 */
export function syllablesMatchWord(word, zhuyin) {
  const chars = [...String(word || '')];
  return chars.length > 0 && splitSyllables(zhuyin).length === chars.length;
}
