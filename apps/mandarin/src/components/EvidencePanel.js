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
export function EvidencePanel({ lessonId, spots, label = '課文裡是這樣寫的' }) {
  if (!isUnlocked() || !Array.isArray(spots) || !spots.length) return null;
  const byPara = paragraphSentences(lessonId);
  if (!byPara) return null;

  const marks = [];
  const blocks = [];

  for (const spot of spots) {
    const sentences = byPara.get(spot.para - 1);
    if (!sentences) continue;
    const wanted = new Set(spot.sentences);
    const line = h('p', { class: 'evidence__text', lang: 'zh-TW' });
    sentences.forEach((text, index) => {
      if (wanted.has(index)) {
        // 用 <mark> 而不是只上背景色：語意正確，螢幕閱讀器會念出「標記」
        const mk = h('mark', { class: 'evidence__key' }, text);
        marks.push(mk);
        line.appendChild(mk);
      } else {
        line.appendChild(document.createTextNode(text));
      }
    });
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
