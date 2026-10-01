// 課文的朗讀單位：把「段→行→詞」的資料切成句子。
//
// 點讀（ReaderPage）和朗讀挑戰（RecitePage）必須用**同一套**切句規則，
// 否則「點一句聽」和「念一句」會對不起來，學生會混亂。所以抽成共用。
//
// 切句用標點，和學生讀出來的停頓一致。句末的下引號歸到前一句
// （「他說：『好。』」不該切出一個只有『』的句子）。

/** 句子的切點。 */
const SENTENCE_END = /[，。？！；：]/;
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
