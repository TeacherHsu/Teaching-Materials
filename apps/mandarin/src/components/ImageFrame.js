import { h } from '../utils/dom.js';

/**
 * 圖片為 optional enhancement：缺圖不得出現 broken image、不得 layout collapse。
 * @param {{src: string|null|undefined, alt: string}} opts
 */
export function ImageFrame({ src, alt }) {
  const frame = h('div', { class: 'image-frame' });
  if (!src) {
    frame.appendChild(h('span', { class: 'image-frame__placeholder' }, '（無圖）'));
    return frame;
  }
  const img = h('img', { src, alt, loading: 'lazy' });
  img.addEventListener('error', () => {
    img.remove();
    frame.appendChild(h('span', { class: 'image-frame__placeholder' }, '（圖片載入失敗）'));
  });
  frame.appendChild(img);
  return frame;
}
