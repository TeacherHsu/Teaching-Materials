import { h } from '../utils/dom.js';

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
  const img = h('img', { src, alt, loading: 'lazy' });
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
