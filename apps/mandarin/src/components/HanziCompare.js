import { h } from '../utils/dom.js';

const NS = 'http://www.w3.org/2000/svg';

/** 用筆畫資料畫一個字；diff 裡的筆畫上色，其他筆畫淡灰。 */
function glyph(strokes, diff) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 1024 1024');
  svg.setAttribute('class', 'hanzi-compare__glyph');
  svg.setAttribute('aria-hidden', 'true');
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('transform', 'scale(1,-1) translate(0,-900)');
  const marked = new Set(diff || []);
  strokes.forEach((d, i) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('class', marked.has(i) ? 'hanzi-compare__stroke--diff' : 'hanzi-compare__stroke');
    g.appendChild(p);
  });
  svg.appendChild(g);
  return svg;
}

/**
 * 形似字部件比較：把同組的字並排，只把「和別的字不一樣的部件」上色。
 * 不標哪一個是正解——學生要自己判斷哪個部件和語詞意思有關。
 * @param {{chars:string[], data:object, diff:Record<string, number[]>}} props
 */
export function HanziCompare({ chars, data, diff }) {
  const usable = chars.filter((c) => data?.chars?.[c]);
  if (usable.length < 2 || !usable.some((c) => diff?.[c]?.length)) return null;
  return h('div', { class: 'hanzi-compare', role: 'group', 'aria-label': `比較：${usable.join('、')}，上色的是不一樣的部分` }, [
    h('div', { class: 'hanzi-compare__row' }, usable.map((c) => h('figure', { class: 'hanzi-compare__item' }, [
      glyph(data.chars[c].s, diff[c]),
    ]))),
    h('p', { class: 'meta hanzi-compare__credit' }, '字形：Make Me a Hanzi（Arphic PL）'),
  ]);
}
