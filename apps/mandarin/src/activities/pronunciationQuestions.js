// 「看字選音」題目改由生字資料直接產生。
//
// 原本依賴 lesson.quiz 裡的題目，但那批資料的產生器沒有把正解放進選項
// （442 題中 332 題答案不在選項內），且混入部首題與字義題，五冊只有 22 題
// 通得過檢核。生字的注音與教育百科來源本來就逐字核過，直接據此出題比修補
// 舊題目可靠，也和「部首」那一步的做法一致。

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

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

/**
 * 產生該課的看字選音題。選項一律亂序，並附解析。
 * @param {object[]} characters 該課生字
 * @param {object[]} allCharacters 誘答來源（同冊生字較貼近學生已學過的字）
 */
export function buildPronunciationItems(characters, allCharacters = characters) {
  const quizzable = (characters || []).filter(isQuizzableCharacter);
  const pool = (allCharacters || []).filter(isQuizzableCharacter).map((c) => c.zhuyin);

  return quizzable.map((c) => {
    const distractors = pickPronunciationDistractors(c.zhuyin, pool, 2);
    if (distractors.length < 2) return null;
    // ChoiceQuiz 以純字串比對選項，且自己也會再亂序一次。
    const options = shuffled([c.zhuyin, ...distractors]);
    return {
      id: `pronunciation-item:${c.char}`,
      character: c.char,
      answer: c.zhuyin,
      options,
      stem: `「${c.char}」的注音是？`,
      hint: '先想想這個字在課文語詞裡怎麼念，再比較看看聲調。',
      explanation: `「${c.char}」念作「${c.zhuyin}」。`,
    };
  }).filter(Boolean);
}
