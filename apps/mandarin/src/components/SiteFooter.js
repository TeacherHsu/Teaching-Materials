import { h } from '../utils/dom.js';

// 頁尾來源與用途說明。文字由 CF 定稿，逐字照用，不要自行潤飾。
// 這段是給大人看的（教師、家長），不是學生會讀的教材文字，
// 因此刻意不加朗讀鈕（見 ADR-0034 第 15 條的適用範圍）。
const FOOTER_LINES = [
  '省三國小潛能教室整理之特殊教育輔助教材。',
  '資料來源為翰林版與康軒版教材。',
  '本站僅供教學使用，不作商業用途。',
];

/**
 * 全站共用頁尾，掛在每個頁面最下方。
 * @returns {HTMLElement}
 */
export function SiteFooter() {
  return h(
    'footer',
    { class: 'site-footer' },
    FOOTER_LINES.map((line) => h('p', { class: 'site-footer__line' }, line)),
  );
}
