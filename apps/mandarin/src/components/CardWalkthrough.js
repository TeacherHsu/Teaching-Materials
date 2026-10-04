// 「看過才能繼續」：純資料卡片（生字卡、語詞卡）要學生逐張點過才放行。
//
// 為什麼：原本整組卡片一次攤開、按一下「繼續」就過去了，學生可以完全不看。
// 對注意力弱的學生，「看過」不能靠自律，要有機制。參考站也是這樣做的。
//
// 刻意不做成測驗：這一步的目的是**接觸**，不是評量。點一下代表「我看過了」，
// 不計分、不扣分、不排名。點過的卡片會打勾並降低明度，剩幾張看得一清二楚。
import { h } from '../utils/dom.js';

/**
 * @param {{
 *   cards: Array<{el: HTMLElement, key: string}>,  // 已建好的卡片元素與識別碼
 *   label?: string,                                 // 進度列的說明
 *   onAllSeen?: () => void,                         // 全部看過時呼叫（用來啟用繼續鈕）
 * }} opts
 * @returns {{grid: HTMLElement, status: HTMLElement, allSeen: () => boolean}}
 */
export function CardWalkthrough({ cards, label = '點一下卡片，看過的會打勾', onAllSeen }) {
  const seen = new Set();
  const total = cards.length;

  const status = h('p', {
    class: 'walkthrough__status',
    role: 'status',
    'aria-live': 'polite',
  }, `${label}（看過 0／${total}）`);

  const grid = h('div', { class: 'card-grid walkthrough' });

  // 讀屏名稱用卡片索引＋可見內容（原本用 seen.size + 1，建立時都是 0，四張都報成「第 1 張」）
  const nameOf = (el, i, done) => {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30);
    return `第 ${i + 1} 格${text ? `，${text}` : ''}，${done ? '已看過' : '還沒看'}`;
  };
  cards.forEach(({ el, key, name }, i) => {
    // 卡片裡已經有按鈕（喇叭、翻面）時，外框不當按鈕（避免巢狀互動元件），
    // 點裡面的按鈕會冒泡到外框，一樣算看過；沒有按鈕的卡片（課文地圖）外框才是按鈕。
    const nested = Boolean(el.querySelector?.('button, a, [tabindex]'));
    const wrap = h('div', {
      class: 'walkthrough__item',
      role: nested ? 'group' : 'button',
      tabindex: nested ? null : '0',
      'aria-pressed': nested ? null : 'false',
      'aria-label': name ? `第 ${i + 1} 格，${name}，還沒看` : nameOf(el, i, false),
    }, [el]);

    const mark = () => {
      if (seen.has(key)) return;
      seen.add(key);
      wrap.classList.add('walkthrough__item--seen');
      if (!nested) wrap.setAttribute('aria-pressed', 'true');
      wrap.setAttribute('aria-label', name ? `第 ${i + 1} 格，${name}，已看過` : nameOf(el, i, true));
      status.textContent = `${label}（看過 ${seen.size}／${total}）`;
      if (seen.size === total && onAllSeen) onAllSeen();
    };

    wrap.addEventListener('click', mark);
    wrap.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        mark();
      }
    });
    grid.appendChild(wrap);
  });

  return { grid, status, allSeen: () => seen.size === total };
}
