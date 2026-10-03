import { h } from '../utils/dom.js';

// 頁尾來源與用途說明。刻意不寫學校名稱（CF 決定：不讓外人辨識是哪一所學校）。
// 「非出版社官方產品」這句是關鍵：少了它，「資料來源：翰林版、康軒版」會被讀成
// 本站就是出版社教材。這段是給大人看的，不是學生會讀的教材文字，故不加朗讀鈕。
// 三句各自一行，CF 指定。
const FOOTER_LINES = [
  '特殊教育輔助教材，非出版社官方產品。',
  '資料來源：翰林版、康軒版。',
  '僅供教學使用，不作商業用途。',
];

/**
 * 全站共用頁尾，掛在每個頁面最下方。
 * @returns {HTMLElement}
 */
export function SiteFooter() {
  return h(
    'footer',
    { class: 'site-footer' },
    [
      ...FOOTER_LINES.map((line) => h('p', { class: 'site-footer__line' }, line)),
      // 給其他老師的操作指引、完整的版權與資料來源（CF 2026-10-04）
      h('p', { class: 'site-footer__links' }, [
        h('a', { href: '#/guide' }, '教師操作指引'),
        h('span', { 'aria-hidden': 'true' }, '・'),
        h('a', { href: '#/credits' }, '版權與資料來源'),
      ]),
      // 教師設定入口已移到每一頁右上角的齒輪（CF 2026-10-01 指定統一入口），
      // 不再放在頁尾——頁尾的入口在長頁面要捲到底才找得到。
    ],
  );
}
