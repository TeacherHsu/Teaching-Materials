// 課文的朗讀單位：把「段→行→詞」的資料切成句子。
//
// 點讀（ReaderPage）和朗讀挑戰（RecitePage）必須用**同一套**切句規則，
// 否則「點一句聽」和「念一句」會對不起來，學生會混亂。所以抽成共用。
//
// 切句用標點，和學生讀出來的停頓一致。句末的下引號歸到前一句
// （「他說：『好。』」不該切出一個只有『』的句子）。

/** 短句（clause）的切點：所有的停頓標點。 */
const CLAUSE_END = /[，。？！；：]/;
/** 完整一句的切點：只有句末標點。 */
const FULL_STOP = /[。？！]/;
/** 支持層一口氣念的上限字數——超過就算沒有逗號也要斷。 */
const CLAUSE_MAX_CHARS = 20;

/** 句子的切點（預設粒度：短句）。 */
const SENTENCE_END = CLAUSE_END;
/** 只有這些符號的「句子」不成句（例如單獨的下引號）。 */
const PUNCT_ONLY = /^[「」『』（）\s，。、；：？！…─—]*$/;

/**
 * @typedef {[string, string, string|null]} Token 詞：[文字, "注音 注音", 朗讀用字|null]
 */

/**
 * 把一課的 paras 切成句子。
 * @param {Array<Array<Array<Token>>>} paras 段 → 行 → 詞
 * @returns {Array<{
 *   paraIndex: number,
 *   text: string,            // 這一句的字（含標點）
 *   say: string,             // 餵給語音合成的字（含教師裁定的讀音覆寫）
 *   tokens: Array<Token>,    // 這一句包含的詞（可能跨行）
 * }>}
 */
export function splitSentences(paras) {
  const out = [];
  (paras || []).forEach((para, paraIndex) => {
    let current = { paraIndex, text: '', say: '', tokens: [] };
    // 正在累積的「子詞」：一個詞可能被句點切成兩半，注音與朗讀用字要跟著切。
    let buf = { text: '', zhuyin: [], say: '', dirty: false };

    const flushToken = () => {
      if (!buf.text) return;
      current.tokens.push([buf.text, buf.zhuyin.join(' '), buf.dirty ? buf.say : null]);
      current.text += buf.text;
      current.say += buf.say;
      buf = { text: '', zhuyin: [], say: '', dirty: false };
    };

    const close = () => {
      flushToken();
      if (current.text) {
        const previous = out[out.length - 1];
        if (PUNCT_ONLY.test(current.text) && previous && previous.paraIndex === paraIndex) {
          // 只有標點的「句」不成句（例如單獨的下引號），但**不能丟掉**——
          // 丟掉就會少字。併進上一句。
          previous.text += current.text;
          previous.say += current.say;
          previous.tokens.push(...current.tokens);
        } else {
          out.push(current);
        }
      }
      current = { paraIndex, text: '', say: '', tokens: [] };
    };

    para.forEach((line) => {
      line.forEach((token) => {
        const [text, zhuyinText, say] = token;
        const zs = zhuyinText ? zhuyinText.split(' ') : [];
        const chars = [...text];
        // 朗讀用字和文字等長才逐字對應（加密器保證這個不變量）
        const sayChars = say && [...say].length === chars.length ? [...say] : null;

        chars.forEach((ch, i) => {
          const sayCh = sayChars ? sayChars[i] : ch;
          buf.text += ch;
          buf.zhuyin.push(zs[i] || '');
          buf.say += sayCh;
          if (sayCh !== ch) buf.dirty = true;

          // 句末標點就切句——**在詞的內部也要切**。長課文的詞邊界符標的是
          // 整段而不是詞，一個 token 可能包含好幾句，只在詞邊界切會切不開
          // （曾經出現 500 字的「一句」）。
          if (SENTENCE_END.test(ch)) {
            flushToken();
            if (current.text.replace(/[「」『』（）\s]/g, '').length > 2) close();
          }
        });
        flushToken();
      });
      // 行尾一律斷句。散文的一段通常就是一行，所以這條不影響散文；
      // 但詩是分行的而且常常整首沒有標點（例如六上〈遇見自己〉），
      // 不在行尾斷就會切出 90 幾個字的一「句」，沒有人能一口氣念完。
      close();
    });
    close();
  });
  return out;
}

/**
 * 把句子併成「段」——挑戰層一次念一整段。
 * @returns {Array<{paraIndex:number, text:string, say:string, tokens:Array, sentences:Array}>}
 */
export function groupByParagraph(sentences) {
  const out = [];
  for (const sentence of sentences) {
    const last = out[out.length - 1];
    if (last && last.paraIndex === sentence.paraIndex) {
      last.text += sentence.text;
      last.say += sentence.say;
      last.tokens.push(...sentence.tokens);
      last.sentences.push(sentence);
    } else {
      out.push({
        paraIndex: sentence.paraIndex,
        text: sentence.text,
        say: sentence.say,
        tokens: [...sentence.tokens],
        sentences: [sentence],
      });
    }
  }
  return out;
}

/**
 * 依語境斷詞。
 *
 * 課文資料裡的 `|` 標的**不是詞**：低年級課文標的是短語（「害怕的時候」），
 * 長課文標的甚至是整段。所以「讀詞」模式不能用 `|` 當詞界，否則點一個字會
 * 念出一整句——這正是 CF 回報的問題。
 *
 * 改用瀏覽器內建的 Intl.Segmenter（zh-TW、granularity: 'word'），那是有
 * 語境判斷的中文斷詞。不支援的瀏覽器安全降級成**單字**，寧可切太細也不要
 * 把整句誤當成一詞。
 *
 * @param {string} text
 * @returns {Array<{start:number, end:number, text:string}>} end 為 exclusive
 */
export function segmentWords(text) {
  const source = String(text || '');
  if (!source) return [];

  const Segmenter = typeof Intl !== 'undefined' ? Intl.Segmenter : null;
  if (typeof Segmenter !== 'function') {
    // 降級：一個字一個單位
    return [...source].map((ch, i) => ({ start: i, end: i + 1, text: ch }));
  }

  const segmenter = new Segmenter('zh-TW', { granularity: 'word' });
  const out = [];
  for (const piece of segmenter.segment(source)) {
    if (!piece.segment.trim()) continue;
    out.push({
      start: piece.index,
      end: piece.index + piece.segment.length,
      text: piece.segment,
    });
  }
  return out;
}

/**
 * 依朗讀粒度把句子重新組合。
 *
 * splitSentences() 切得最細（每個停頓標點都斷），那是點讀「讀句」要的粒度，
 * 但拿來朗讀對中高組太細碎——CF 回報「切得太細碎了」。這裡按教師設定重組：
 *
 *   clause     支持層：念到逗號，或滿 20 字就斷
 *   sentence   標準層：念到句號，上限 45 字
 *   paragraph  挑戰層：一次一整段，上限 90 字
 *
 * **每一種都有字數上限**：超過就在最近的停頓處斷開。沒有上限的話，
 * 散文課次會出現 1200 字的一「段」，挑戰層的學生也念不完。
 * 一口氣念得完才有成就感，念不完只會讓人放棄。
 */
const UNIT_RULES = {
  clause: { max: 20, stopAt: null },          // 任何停頓標點都可斷
  sentence: { max: 45, stopAt: FULL_STOP },   // 盡量斷在句末標點
  paragraph: { max: 90, stopAt: FULL_STOP },  // 同上，但可以裝更多
};

/**
 * 把超過上限的 token 用語境斷詞拆成詞級 token，注音與朗讀用字一起切。
 * 散文課次的詞邊界符標的是整段，所以一個 token 可能長達數十字，
 * 不先拆就沒有地方可以斷行。
 */
function splitLongTokens(tokens, max) {
  const out = [];
  for (const token of tokens) {
    const [text, zhuyinText, say] = token;
    if ([...text].length <= max) { out.push(token); continue; }
    const zs = zhuyinText ? zhuyinText.split(' ') : [];
    const chars = [...text];
    const sayChars = say && [...say].length === chars.length ? [...say] : null;
    for (const word of segmentWords(text)) {
      const slice = chars.slice(word.start, word.end);
      if (!slice.length) continue;
      out.push([
        slice.join(''),
        zs.slice(word.start, word.end).join(' '),
        sayChars ? sayChars.slice(word.start, word.end).join('') : null,
      ]);
    }
  }
  return out;
}

export function groupByUnit(sentences, unit) {
  const rule = UNIT_RULES[unit] || UNIT_RULES.sentence;
  const out = [];
  let current = null;

  const flush = () => {
    if (current && current.tokens.length) out.push(current);
    current = null;
  };
  const start = (paraIndex) => ({ paraIndex, text: '', say: '', tokens: [] });
  const len = (t) => [...t].length;

  for (const piece of sentences) {
    // 換段一定斷：段落是作者給的意義邊界
    if (current && current.paraIndex !== piece.paraIndex) flush();
    if (!current) current = start(piece.paraIndex);

    // 單一 piece 本身就超過上限：依詞逐一裝填。
    // 散文課次的一個 token 可能就是整句（詞邊界符標的是整段），
    // 所以先把過長的 token 用語境斷詞拆成詞，才有地方可以斷。
    if (len(piece.text) > rule.max) {
      flush();
      let buf = start(piece.paraIndex);
      for (const token of splitLongTokens(piece.tokens, rule.max)) {
        if (buf.tokens.length && len(buf.text) + len(token[0]) > rule.max) {
          out.push(buf);
          buf = start(piece.paraIndex);
        }
        buf.tokens.push(token);
        buf.text += token[0];
        buf.say += token[2] || token[0];
      }
      if (buf.tokens.length) out.push(buf);
      continue;
    }

    // 裝得下就併進來，裝不下就先收掉
    if (current.tokens.length && len(current.text) + len(piece.text) > rule.max) {
      flush();
      current = start(piece.paraIndex);
    }
    current.text += piece.text;
    current.say += piece.say;
    current.tokens.push(...piece.tokens);

    // clause 每個停頓都斷；其餘斷在句末標點
    const last = piece.text[piece.text.length - 1];
    if (!rule.stopAt || rule.stopAt.test(last)) flush();
  }
  flush();
  return out;
}
