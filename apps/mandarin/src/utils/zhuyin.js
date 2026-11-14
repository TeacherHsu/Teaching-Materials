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

/**
 * 語詞注音補成「一個音節一個空格」。已經有空格的原樣回傳；
 * 連寫的（康軒來源）照結構切開，音節數必須等於語詞裡的國字數，否則回傳 null（不猜）。
 * 間隔號「‧」保留成獨立一段；商標符號等其他記號不屬於讀音，拿掉。
 */
export function spaceWordZhuyin(word, zhuyin) {
  const raw = String(zhuyin || '').trim();
  if (!raw || /\s/.test(raw)) return raw;
  const hanCount = [...String(word || '')].filter((c) => /\p{Script=Han}/u.test(c)).length;
  if (hanCount <= 1) return raw;
  const parts = raw.split('‧').map((part) => parseChunk(part));
  if (parts.reduce((n, part) => n + part.length, 0) !== hanCount) return null;
  return parts.map((part) => part.join(' ')).join(' ‧ ');
}

const YI_NUMERIC = '〇零一二三四五六七八九十';
const YI_ORDINAL_PREV = '第初';

/**
 * 語詞裡的「一」依語流變調標注（sped-os ADR-0028，CF 裁定）：
 * 四聲前 ㄧˊ、一二三聲前 ㄧˋ；詞尾、序數、數字序列維持本調 ㄧ。
 * 量詞「個」不論標四聲或輕聲，前面的「一」都讀 ㄧˊ。
 * 判斷不了的（音節數對不上、後接其他輕聲、疊字中間的「一」）原樣回傳。
 */
export function applyYiSandhi(word, zhuyin) {
  const raw = String(zhuyin || '').trim();
  const chars = [...String(word || '')].filter((c) => /\p{Script=Han}/u.test(c));
  if (!raw || !chars.includes('一')) return raw;
  const tokens = raw.split(/\s+/);
  const slots = tokens.map((t, i) => (t === '‧' ? -1 : i)).filter((i) => i >= 0);
  if (slots.length !== chars.length) return raw;
  chars.forEach((char, i) => {
    if (char !== '一' || !/^ㄧ[ˊˋ]?$/.test(tokens[slots[i]])) return;
    const prev = chars[i - 1];
    const next = chars[i + 1];
    let fixed;
    if (!next || YI_ORDINAL_PREV.includes(prev || ' ') || YI_NUMERIC.includes(next) || YI_NUMERIC.includes(prev || ' ')) {
      fixed = 'ㄧ';
    } else if (prev && prev === next) {
      return; // 看一看：中間的「一」讀輕聲與否交給教師
    } else {
      const nextSyllable = tokens[slots[i + 1]];
      if (nextSyllable.includes('ˋ') || (next === '個' && nextSyllable.startsWith('˙'))) fixed = 'ㄧˊ';
      else if (nextSyllable.startsWith('˙')) return;
      else fixed = 'ㄧˋ';
    }
    tokens[slots[i]] = fixed;
  });
  return tokens.join(' ');
}
