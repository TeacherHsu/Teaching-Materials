// 字旁注音：用 <ruby> 標記，CSS 以 ruby-position: inter-character 排成
// 台灣慣用的「注音在字的右側直排」。
//
// 為什麼用 <ruby> 而不是自己疊 <span>：
//   1. 語意正確——螢幕閱讀器會把注音當成讀音註記，而不是當成另一串要唸的字。
//      自己疊 span 會讓 VoiceOver 把「ㄨㄛˇ」逐符號唸出來。
//   2. 注音隱藏時只要 CSS 關掉 <rt>，不必重建 DOM，學生不會失去閱讀位置。
//
// 注意：這裡**不**負責決定要不要顯示注音，由呼叫端在容器上加
// .reader__text--no-zhuyin 之類的 class 控制，理由同第 2 點。
import { h } from '../utils/dom.js';

/**
 * @param {string} char 一個字（標點也可以，會原樣輸出）
 * @param {string} zhuyin 這個字的注音；空字串代表沒有注音（標點、或資料缺注音）
 * @returns {HTMLElement|Text}
 */
export function ZhuyinText(char, zhuyin) {
  if (!zhuyin) return document.createTextNode(char);
  return h('ruby', { class: 'zhuyin' }, [
    document.createTextNode(char),
    // <rp> 是不支援 ruby 的瀏覽器的退路，讓注音至少以括號呈現而不是黏在字後面
    h('rp', { 'aria-hidden': 'true' }, '('),
    h('rt', { class: 'zhuyin__rt' }, zhuyin),
    h('rp', { 'aria-hidden': 'true' }, ')'),
  ]);
}
