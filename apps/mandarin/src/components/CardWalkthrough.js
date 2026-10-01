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

  cards.forEach(({ el, key }) => {
    const wrap = h('div', {
      class: 'walkthrough__item',
      role: 'button',
      tabindex: '0',
      'aria-pressed': 'false',
      'aria-label': `第 ${seen.size + 1} 張卡片，點一下表示看過了`,
    }, [el]);

    const mark = () => {
      if (seen.has(key)) return;
      seen.add(key);
      wrap.classList.add('walkthrough__item--seen');
      wrap.setAttribute('aria-pressed', 'true');
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
