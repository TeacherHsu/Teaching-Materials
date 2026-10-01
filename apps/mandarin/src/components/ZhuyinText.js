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
import { normalizeZhuyin } from '../utils/zhuyin.js';

/**
 * @param {string} char 一個字（標點也可以，會原樣輸出）
 * @param {string} zhuyin 這個字的注音；空字串代表沒有注音（標點、或資料缺注音）
 * @returns {HTMLElement|Text}
 */
export function ZhuyinText(char, zhuyin) {
  if (!zhuyin) return document.createTextNode(char);

  // 聲調要和注音符號本體分開放：
  //   二、三、四聲（ˊ ˇ ˋ）在注音符號的**右側**
  //   輕聲（˙）在注音符號的**上方**
  //   一聲不標
  // 整串一起直排會把聲調擠到最下面，那不是台灣的寫法。
  // 先正規化：來源若把輕聲寫成後置（ㄌㄜ˙）也要處理成前置，
  // 否則 ˙ 會被當成本體的一部分跟著直排下去。
  const text = normalizeZhuyin(zhuyin);
  const neutral = text.startsWith('˙');
  const body = neutral ? text.slice(1) : text.replace(/[ˊˇˋ]$/, '');
  const tone = neutral ? '˙' : (text.match(/[ˊˇˋ]$/) || [''])[0];

  const rt = h('rt', { class: `zhuyin__rt${neutral ? ' zhuyin__rt--neutral' : ''}` }, [
    tone ? h('span', { class: 'zhuyin__tone' }, tone) : null,
    h('span', { class: 'zhuyin__body' }, body),
  ].filter(Boolean));

  return h('ruby', { class: 'zhuyin' }, [
    document.createTextNode(char),
    // <rp> 是不支援 ruby 的瀏覽器的退路
    h('rp', { 'aria-hidden': 'true' }, '('),
    rt,
    h('rp', { 'aria-hidden': 'true' }, ')'),
  ]);
}
