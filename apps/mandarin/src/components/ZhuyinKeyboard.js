import { h } from '../utils/dom.js';
import { INITIALS, MEDIALS, FINALS, TONES } from '../utils/zhuyin.js';

// 大千（標準）注音鍵盤排列，與實體鍵盤一致。
// 排列順序本身就是要學的東西，**不可以為了排版好看而重排**——
// 這樣練習才遷移得到真的打字。
const ROWS = [
  { keys: '1234567890-', symbols: 'ㄅㄉˇˋㄓˊ˙ㄚㄞㄢㄦ' },
  { keys: 'qwertyuiop', symbols: 'ㄆㄊㄍㄐㄔㄗㄧㄛㄟㄣ' },
  { keys: 'asdfghjkl;', symbols: 'ㄇㄋㄎㄑㄕㄘㄨㄜㄠㄤ' },
  { keys: 'zxcvbnm,./', symbols: 'ㄈㄌㄏㄒㄖㄙㄩㄝㄡㄥ' },
];

/** 供測試比對：{ 實體鍵: 注音符號 } */
export const KEY_MAP = ROWS.reduce((map, row) => {
  [...row.symbols].forEach((symbol, i) => { map[row.keys[i]] = symbol; });
  return map;
}, {});

export const KEYBOARD_ROWS = ROWS;

/** 符號分類，用來上色與標示——不是裝飾，是讓學生看見注音的結構。 */
export function symbolKind(symbol) {
  if (INITIALS.includes(symbol)) return 'initial';
  if (MEDIALS.includes(symbol)) return 'medial';
  if (FINALS.includes(symbol)) return 'final';
  if (TONES.includes(symbol)) return 'tone';
  return 'other';
}

const KIND_LABEL = { initial: '聲母', medial: '介音', final: '韻母', tone: '聲調' };

/**
 * 畫面上的注音鍵盤。
 * @param {{onKey: (symbol:string)=>void, onBackspace: ()=>void}} opts
 * @returns {{el: HTMLElement, flash: (symbol:string)=>void}}
 */
export function ZhuyinKeyboard({ onKey, onBackspace }) {
  const buttons = new Map();

  const rows = ROWS.map((row, rowIndex) => h(
    'div',
    { class: `zk__row zk__row--${rowIndex}` },
    [...row.symbols].map((symbol, i) => {
      const kind = symbolKind(symbol);
      const btn = h('button', {
        class: `zk__key zk__key--${kind}`,
        type: 'button',
        'data-symbol': symbol,
        'aria-label': `${KIND_LABEL[kind] || ''}${symbol}`,
      }, [
        // 只顯示注音符號本身。原本還有實體鍵位字母（Q、1……）和上方的
        // 聲母／介音／韻母／聲調標籤，對學生是非必要的視覺干擾（CF 2026-10-03）。
        // 分類仍留在 aria-label 給螢幕報讀，畫面上不顯示。
        h('span', { class: 'zk__symbol' }, symbol),
      ]);
      btn.addEventListener('click', () => onKey(symbol));
      buttons.set(symbol, btn);
      return btn;
    }),
  ));

  const backspace = h('button', { class: 'zk__key zk__key--wide', type: 'button', 'aria-label': '刪除上一個符號' }, '⌫ 刪除');
  backspace.addEventListener('click', () => onBackspace());

  const el = h('div', { class: 'zk', role: 'group', 'aria-label': '注音鍵盤' }, [
    // 鍵盤自己可以橫向捲動，這樣按鍵維持 44px 觸控下限、排列也不必改
    h('div', { class: 'zk__keys' }, [h('div', { class: 'zk__keys-inner' }, rows)]),
    h('div', { class: 'zk__row zk__row--actions' }, [backspace]),
  ]);

  let marked = null;

  return {
    el,
    /**
     * 提示：在正確的鍵上用紅色直接標出來（CF 2026-10-03）。
     * 比文字提示「這個字的注音是……」直接——學生不用先讀懂一句話、
     * 再去鍵盤上找那個符號，眼睛直接看到要按哪一顆。
     */
    mark(symbol) {
      if (marked) marked.classList.remove('zk__key--hinted');
      marked = buttons.get(symbol) || null;
      if (marked) {
        marked.classList.add('zk__key--hinted');
        marked.scrollIntoView?.({ block: 'nearest', inline: 'center' });
      }
    },
    unmark() {
      if (marked) marked.classList.remove('zk__key--hinted');
      marked = null;
    },
    /** 實體鍵盤輸入時，讓畫面上對應的鍵閃一下，幫學生把兩者連起來。 */
    flash(symbol) {
      const btn = buttons.get(symbol);
      if (!btn) return;
      btn.classList.add('zk__key--active');
      setTimeout(() => btn.classList.remove('zk__key--active'), 180);
    },
  };
}
