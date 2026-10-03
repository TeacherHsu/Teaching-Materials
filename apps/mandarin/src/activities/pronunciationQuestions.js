// 「看字選音」題目改由生字資料直接產生。
//
// 原本依賴 lesson.quiz 裡的題目，但那批資料的產生器沒有把正解放進選項
// （442 題中 332 題答案不在選項內），且混入部首題與字義題，五冊只有 22 題
// 通得過檢核。生字的注音與教育百科來源本來就逐字核過，直接據此出題比修補
// 舊題目可靠，也和「部首」那一步的做法一致。

import { getScaffoldLevel } from '../utils/deviceSettings.js';
import { shuffle as shuffled } from '../utils/shuffle.js';

const SINGLE_BOPOMOFO = /^[ㄅ-ㄩ]+[ˊˇˋ˙]?$/u;
const TONE = /[ˊˇˋ˙]$/u;
const PEDIA_PREFIX = 'https://pedia.cloud.edu.tw/Entry/Detail?title=';

/** 只有注音為單一音節、且有教育百科來源的生字才出題。 */
export function isQuizzableCharacter(c) {
  return Boolean(
    c
    && (c.status === 'ready' || !c.status)
    && typeof c.zhuyin === 'string'
    && SINGLE_BOPOMOFO.test(c.zhuyin)
    && typeof c.pedia_url === 'string'
    && c.pedia_url.startsWith(PEDIA_PREFIX),
  );
}

function parts(zhuyin) {
  const tone = TONE.test(zhuyin) ? zhuyin.slice(-1) : '';
  const body = tone ? zhuyin.slice(0, -1) : zhuyin;
  return { body, tone, initial: body[0] || '', final: body.slice(1) || body };
}

/**
 * 誘答優先選「容易混淆」的讀音：同音不同調 > 同聲母 > 同韻 > 其他。
 * 學生要真的分辨聲調與聲韻才答得對，而不是憑長相隨便挑。
 */
export function pickPronunciationDistractors(answer, pool, n) {
  const a = parts(answer);
  const others = [...new Set(pool)].filter((z) => z !== answer && SINGLE_BOPOMOFO.test(z));
  const rank = (z) => {
    const p = parts(z);
    if (p.body === a.body) return 0;          // 同音不同調
    if (p.initial === a.initial) return 1;    // 同聲母
    if (p.final === a.final) return 2;        // 同韻
    return 3;
  };
  return others
    .map((z) => ({ z, r: rank(z), k: Math.random() }))
    .sort((x, y) => x.r - y.r || x.k - y.k)
    .slice(0, n)
    .map((x) => x.z);
}


/**
 * 產生該課的看字選音題。選項一律亂序，並附解析。
 * @param {object[]} characters 該課生字
 * @param {object[]} allCharacters 誘答來源（同冊生字較貼近學生已學過的字）
 */
/**
 * 生字讀音的三層提示（最少到最多提示法）：
 *   1 策略：想想這個字在哪個語詞裡、那個語詞怎麼念（從已知的詞找讀音）
 *   2 縮小：告訴他第一個注音符號，並刪掉一個錯誤選項（只剩兩個選項時不刪，免得直接變成答案）
 *   3 示範：把那個語詞念給他聽
 * 沒有例詞的字，第 1、3 層退回通用說法。
 */
const TONE_TEXT = { 'ˊ': '第二聲（聲音往上揚）', 'ˇ': '第三聲（先降再升）', 'ˋ': '第四聲（聲音往下降）', '˙': '輕聲（又輕又短）' };
function toneHint(zhuyin) {
  const z = String(zhuyin || '');
  const tone = z.startsWith('˙') ? '˙' : [...z].find((ch) => TONE_TEXT[ch]);
  return `這個字在這裡念${tone ? TONE_TEXT[tone] : '第一聲（聲音平平的）'}，再比一比剩下的選項。`;
}

export function pronunciationHints(c, optionCount) {
  const word = (c.examples || []).find((w) => w && w.includes(c.char) && w.length >= 2);
  const first = String(c.zhuyin || '').replace(/^˙/u, '').charAt(0);
  return [
    { text: word ? `想一想「${word}」這個語詞怎麼念。` : '先想想這個字在課文的語詞裡怎麼念。' },
    { text: first ? `第一個注音符號是「${first}」。` : '再比較看看聲調。', eliminate: optionCount >= 3 ? 1 : 0 },
    // 第 3 層不念出語詞：念出來就等於告訴他讀音（2026-10-03 第二版審查）。
    // 改給聲調線索＋再刪一個錯的；學生仍要自己判斷，正確讀音在作答後才念。
    { text: toneHint(c.zhuyin), eliminate: 1 },
  ];
}

export function buildPronunciationItems(characters, allCharacters = characters, optionCount = getScaffoldLevel().optionCount) {
  const quizzable = (characters || []).filter(isQuizzableCharacter);
  const pool = (allCharacters || []).filter(isQuizzableCharacter).map((c) => c.zhuyin);
  // 鷹架厚度只改干擾項數量，題目本身不變（見 utils/deviceSettings.js）。
  const wanted = Math.max(1, (optionCount || 3) - 1);

  return quizzable.map((c) => {
    const distractors = pickPronunciationDistractors(c.zhuyin, pool, wanted);
    if (distractors.length < 1) return null;
    // ChoiceQuiz 以純字串比對選項，且自己也會再亂序一次。
    const options = shuffled([c.zhuyin, ...distractors]);
    return {
      id: `pronunciation-item:${c.char}`,
      character: c.char,
      answer: c.zhuyin,
      options,
      stem: `「${c.char}」的注音是？`,
      hint: '先想想這個字在課文語詞裡怎麼念，再比較看看聲調。',
      hints: pronunciationHints(c, options.length),
      explanation: `「${c.char}」念作「${c.zhuyin}」。`,
    };
  }).filter(Boolean);
}
