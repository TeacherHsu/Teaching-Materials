// 證據面板：把答案所在的課文段落展開，並用螢光筆畫出證據句。
//
// 這是三層提示的第 2、3 層實際做的事：
//   第 2 層「找位置」→ 展開段落（證據句還沒畫）
//   第 3 層「看證據」→ 螢光筆畫出來
//
// 為什麼要做到這個程度：對閱讀困難的學生，「回到課文找線索」這句話沒有作用——
// 他不知道回到哪裡、找什麼、找到了要怎麼用。鷹架要把這個歷程拆成他做得到的
// 動作，而「段落直接出現在題目下面、答案句被畫起來」就是把歷程做給他看。
//
// ── 版權界線 ──────────────────────────────────────
// 證據句**不存在 lesson JSON 裡**（那會把課文片段漏到公開 repo）。
// lesson JSON 只存「第幾段第幾句」的索引與雜湊；真正的句子在這裡才從
// 解密後的課文取出來。學生沒解鎖課文時就看不到證據——這是刻意的。
import { h } from '../utils/dom.js';
import { SpeakButton } from './SpeakButton.js';
import { getReading, isUnlocked } from '../utils/classroomKey.js';
import { splitSentences } from '../utils/readingUnits.js';

/**
 * 證據句前後各留幾句當上下文。
 * 0 會讓證據變成沒有脈絡的碎片，整段又太囉嗦——1 句剛好夠學生知道
 * 「這句話出現在什麼地方」，又不會把課名、作者這些無關的字一起拉進來。
 */
const CONTEXT_SENTENCES = 1;
// 第 3 層要「直接看到對應段落」（CF 2026-10-04）：段落不長就整段給，太長才只留前後兩句
const FULL_PARAGRAPH_MAX = 8;
const LONG_PARAGRAPH_CONTEXT = 2;

const FUNCTION_CHARS = /[和與跟的了是在也就都還又著把被]/u;
const han = (t) => String(t || '').replace(/[^\u3400-\u9fff]/gu, '');

/**
 * 在證據句裡找出「關鍵資訊」：和答案（及參考答案）共有、至少兩個字的片段。
 * 回傳 [start, end) 區間（以句子字元位置計），已合併相鄰區間。
 */
export function keySpans(sentence, keys, exclude = '') {
  const keyText = (keys || []).map(han).join('｜');
  if (!keyText) return [];
  // 題目裡已經出現的詞（「南瓜蒂」）不算關鍵資訊：學生本來就看得到，畫了只是雜訊
  const skip = han(exclude);
  const flags = new Array(sentence.length).fill(false);
  for (let i = 0; i < sentence.length - 1; i += 1) {
    const bi = sentence.slice(i, i + 2);
    // 含虛詞的雙字（「和南」「蒂和」）多半是跨詞拼出來的，不當關鍵詞的起點
    if (han(bi).length === 2 && keyText.includes(bi) && !skip.includes(bi) && !FUNCTION_CHARS.test(bi)) { flags[i] = true; flags[i + 1] = true; }
  }
  const spans = [];
  for (let i = 0; i < flags.length; i += 1) {
    if (!flags[i]) continue;
    let j = i;
    while (j + 1 < flags.length && flags[j + 1]) j += 1;
    spans.push([i, j + 1]);
    i = j;
  }
  return spans;
}

function markedSentence(text, keys, exclude, wholeIfNone) {
  const spans = keySpans(text, keys, exclude);
  // 推論題常常整段都沒有字面相同的詞：那就整句上螢光筆；
  // 但只要別的線索句有關鍵詞，這句就只畫底線，免得滿版都是黃色
  if (!spans.length) return wholeIfNone ? [h('mark', { class: 'evidence__key' }, text)] : [text];
  const out = [];
  let at = 0;
  for (const [a, b] of spans) {
    if (a > at) out.push(text.slice(at, a));
    out.push(h('mark', { class: 'evidence__key' }, text.slice(a, b)));
    at = b;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}
// 中文刪節號是兩個「…」共六點（CF 2026-10-03 提醒），不是英文的三點。
const ELLIPSIS = '……';

/** 把一課的課文切成「每段一組句子」，索引和 tools/reading_evidence.mjs 一致。 */
function paragraphSentences(lessonId) {
  const reading = getReading(lessonId);
  if (!reading) return null;
  const byPara = new Map();
  for (const s of splitSentences(reading.paras)) {
    if (!byPara.has(s.paraIndex)) byPara.set(s.paraIndex, []);
    byPara.get(s.paraIndex).push(s.text);
  }
  return byPara;
}

/**
 * @param {{
 *   lessonId: string,
 *   spots: Array<{para:number, sentences:number[]}>,   // 證據位置
 *   label?: string,
 * }} opts
 * @returns {{el: HTMLElement, highlight: () => void}|null} 課文沒解鎖時回 null
 */
export function EvidencePanel({ lessonId, spots, label = '課文裡是這樣寫的', keys = null, exclude = '' }) {
  if (!isUnlocked() || !Array.isArray(spots) || !spots.length) return null;
  const byPara = paragraphSentences(lessonId);
  if (!byPara) return null;

  const marks = [];
  const blocks = [];
  // 整個面板有沒有任何一句找得到關鍵詞（決定沒有關鍵詞的線索句要不要整句畫）
  const anyKey = Boolean(keys) && spots.some((spot) => (byPara.get(spot.para - 1) || [])
    .some((t, i) => spot.sentences.includes(i) && keySpans(t, keys, exclude).length));

  for (const spot of spots) {
    const sentences = byPara.get(spot.para - 1);
    if (!sentences) continue;
    const wanted = [...spot.sentences].sort((a, b) => a - b);

    // 只呈現證據句與它緊鄰的上下文，不是整段。
    // CF 指出：證據是「我們在游泳池游呀游，游成自由的魚……」時，
    // 前面的「水陸小高手。游泳。謝安通。」（課名、詩名、作者）是多餘的，
    // 對要找答案的學生只是干擾。多出來的字會讓閱讀困難的學生先累了才讀到重點。
    // keys 有給（第 3 層用法）：段落不長就整段呈現，長段落留前後兩句
    const ctx = keys ? (sentences.length <= FULL_PARAGRAPH_MAX ? sentences.length : LONG_PARAGRAPH_CONTEXT) : CONTEXT_SENTENCES;
    const first = Math.max(0, wanted[0] - ctx);
    const last = Math.min(sentences.length - 1, wanted[wanted.length - 1] + ctx);

    const line = h('p', { class: 'evidence__text', lang: 'zh-TW' });
    if (first > 0) line.appendChild(h('span', { class: 'evidence__ellipsis', 'aria-label': '前面還有' }, ELLIPSIS));
    for (let index = first; index <= last; index += 1) {
      const text = sentences[index];
      if (wanted.includes(index) && keys) {
        // 線索句淡淡畫底線，句中的關鍵資訊（和答案相同的詞）上螢光筆
        const sent = h('span', { class: 'evidence__sentence' }, markedSentence(text, keys, exclude, !anyKey));
        marks.push(sent);
        line.appendChild(sent);
      } else if (wanted.includes(index)) {
        // 用 <mark> 而不是只上背景色：語意正確，螢幕閱讀器會念出「標記」
        const mk = h('mark', { class: 'evidence__key' }, text);
        marks.push(mk);
        line.appendChild(mk);
      } else {
        line.appendChild(document.createTextNode(text));
      }
    }
    if (last < sentences.length - 1) {
      line.appendChild(h('span', { class: 'evidence__ellipsis', 'aria-label': '後面還有' }, ELLIPSIS));
    }

    blocks.push(h('div', { class: 'evidence__para' }, [
      h('p', { class: 'evidence__no' }, `第 ${spot.para} 段`),
      line,
    ]));
  }

  if (!blocks.length) return null;

  // 給螢幕閱讀器與朗讀鈕用的純文字摘要
  const spoken = spots
    .map((spot) => (byPara.get(spot.para - 1) || []).filter((_, i) => spot.sentences.includes(i)).join(''))
    .filter(Boolean)
    .join(' ');

  const el = h('div', { class: 'evidence' }, [
    h('div', { class: 'quiz-option-row' }, [
      h('p', { class: 'evidence__label' }, label),
      SpeakButton({ text: spoken, label: '聽', variant: 'speak-button--option' }),
    ]),
    ...blocks,
  ]);

  return {
    el,
    /** 第 3 層提示才呼叫：把證據句畫起來。 */
    highlight() {
      el.classList.add('evidence--marked');
    },
  };
}

/**
 * 把「索引參照」還原成課文原句。
 *
 * 用在 listening[].passage_ref：聽聽看要念的那段話就是課文，所以不存明碼
 * （那等於把課文片段漏到公開 repo），只存第幾段第幾句，這裡才取回來。
 *
 * @param {string} lessonId
 * @param {Array<{para:number, sentences:number[]}>} spots
 * @returns {string|null} 課文沒解鎖或索引對不上時回 null
 */
export function resolveSpots(lessonId, spots) {
  if (!isUnlocked() || !Array.isArray(spots) || !spots.length) return null;
  const byPara = paragraphSentences(lessonId);
  if (!byPara) return null;
  const parts = [];
  for (const spot of spots) {
    const sentences = byPara.get(spot.para - 1);
    if (!sentences) return null;
    for (const index of spot.sentences) {
      if (sentences[index] === undefined) return null;
      parts.push(sentences[index]);
    }
  }
  return parts.join('') || null;
}
