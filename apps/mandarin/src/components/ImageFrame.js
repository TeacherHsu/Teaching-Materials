import { h } from '../utils/dom.js';

// 資料檔裡的圖片路徑歷史上寫成網域根絕對路徑（'/assets/...'）。網站實際掛在
// GitHub Pages 子路徑（/Teaching-Materials/mandarin/），根絕對路徑會被瀏覽器
// 解析到網域根而 404；本機 vite dev 掛在根目錄才剛好會通，所以只在正式站爆。
// 這裡統一接回 BASE_URL，資料檔不必改寫。測試環境沒有 import.meta.env，退回 '/'。
const BASE = (typeof import.meta !== 'undefined' ? import.meta.env?.BASE_URL : undefined) ?? '/';

/**
 * 把資料檔的圖片路徑解析成可用網址：根絕對路徑接回 BASE_URL，
 * 相對路徑與完整網址（http(s):、data:）原樣保留。
 * @param {string} src
 * @returns {string}
 */
export function resolveImageSrc(src) {
  if (typeof src !== 'string' || src === '') {
    return src;
  }
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(src)) {
    return src;
  }
  if (src.startsWith('/')) {
    return `${BASE.endsWith('/') ? BASE : `${BASE}/`}${src.slice(1)}`;
  }
  return src;
}

/**
 * 圖片為 optional enhancement：缺圖不得出現 broken image、不得 layout collapse，
 * 也不得對學生顯示錯誤字樣（「圖片載入失敗」等）。缺圖時只留固定比例的
 * 空白容器（不寫錯誤文字），螢幕閱讀器仍可用 aria-label 得知「尚無圖片」。
 * @param {{src: string|null|undefined, alt: string}} opts
 */
export function ImageFrame({ src, alt }) {
  const frame = h('div', { class: 'image-frame', role: 'img', 'aria-label': `${alt}：尚無圖片` });
  if (!src) {
    return frame;
  }
  const img = h('img', { src: resolveImageSrc(src), alt, loading: 'lazy' });
  img.addEventListener('error', () => {
    img.remove();
    frame.setAttribute('role', 'img');
    frame.setAttribute('aria-label', `${alt}：圖片尚未提供`);
  });
  frame.removeAttribute('role');
  frame.removeAttribute('aria-label');
  frame.appendChild(img);
  return frame;
}
