// 「延伸練習」外部連結卡片列表。
// 規格 docs/specs/2026-09-25-mandarin-dabutie-importer.md「延伸練習連結」一節：
// - 主要任務之後、視覺層級低於主任務。
// - 生產只顯示 approved；preview（?preview=1）額外顯示 draft 並加「待審」標籤。
// - 不在載入時抓任何外部資源（不嵌 iframe、不抓縮圖/favicon），維持零外部連線；
//   使用者主動點擊 <a target="_blank"> 不算違反。
import { h } from '../utils/dom.js';
import { filterByStatus, isDraftVisible } from '../utils/preview.js';
import { SpeakButton } from './SpeakButton.js';

// 純手繪 inline SVG（不對外抓圖），每種 type 一個極簡示意圖示。
const TYPE_ICONS = {
  game: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="3" y="9" width="18" height="8" rx="4" fill="currentColor"/><circle cx="8" cy="13" r="1.4" fill="#fff"/><circle cx="12" cy="13" r="1.4" fill="#fff"/><circle cx="16" cy="13" r="1.4" fill="#fff"/></svg>',
  quiz: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><text x="12" y="16" font-size="11" text-anchor="middle" fill="currentColor">?</text></svg>',
  video: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><polygon points="10,9 16,12 10,15" fill="currentColor"/></svg>',
  dictionary: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4z" fill="none" stroke="currentColor" stroke-width="2"/><line x1="8" y1="9" x2="14" y2="9" stroke="currentColor" stroke-width="1.5"/></svg>',
  reading: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 5c-2-1-5-1-8 0v14c3-1 6-1 8 0 2-1 5-1 8 0V5c-3-1-6-1-8 0z" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2"/></svg>',
};

const TYPE_LABEL = {
  game: '遊戲',
  quiz: '測驗',
  video: '影片',
  dictionary: '字典',
  reading: '閱讀',
};

/**
 * @param {object} lesson 完整 lesson JSON
 * @param {string} moduleKey 對應大項 key，或 "lesson"（整課，Lesson Dashboard 用）
 * @param {{title?: string}} [opts] title 預設「做完了？再挑戰看看」（大項頁用）；
 *   Lesson Dashboard 呼叫時傳入「本課延伸資源」。
 * @returns {HTMLElement|null} 沒有可顯示連結時回傳 null（呼叫端自行判斷是否掛載）
 */
export function buildExtensionLinks(lesson, moduleKey, opts = {}) {
  const title = opts.title || '做完了？再挑戰看看';
  const all = (lesson.extensions || []).filter((e) => e.module === moduleKey);
  const visible = filterByStatus(all);
  if (visible.length === 0) return null;

  const list = h('div', { class: 'extension-links__list' });
  for (const ext of visible) {
    const icon = h('span', { class: 'extension-link__icon', html: TYPE_ICONS[ext.type] || '' });
    const meta = h('div', { class: 'extension-link__meta' }, [
      h('span', { class: 'extension-link__title' }, ext.title),
      h('span', { class: 'extension-link__provider' }, [
        ext.provider,
        ext.version_note ? `・${ext.version_note}` : '',
        ext.login_required ? '・需登入' : '',
      ].join('')),
    ]);
    const badges = h('span', { class: 'extension-link__badges' }, [
      h('span', { class: 'extension-link__type-label' }, TYPE_LABEL[ext.type] || ext.type),
      h('span', { class: 'extension-link__window-note' }, '另開新視窗'),
      isDraftVisible(ext) ? h('span', { class: 'extension-link__draft-badge' }, '待審') : null,
    ]);

    const card = h(
      'a',
      {
        class: 'extension-link',
        href: ext.url,
        target: '_blank',
        rel: 'noopener noreferrer',
      },
      [icon, meta, badges],
    );
    // 朗讀鈕放在 <a> 外面，不巢狀在連結裡（避免互動元素巢狀），點擊不會觸發跳轉。
    const row = h('div', { class: 'extension-link-row' }, [
      card,
      SpeakButton({ text: ext.title, label: '聽', variant: 'speak-button--option' }),
    ]);
    list.appendChild(row);
  }

  // 預設折疊（CF 2026-09-25）：連結內容（如成語典條目）可能直接透露上方題目答案，
  // 學生要自己點開才看得到。用原生 <details>，鍵盤與螢幕閱讀器皆可操作。
  const summary = h('summary', { class: 'extension-links__summary' }, [
    h('span', { class: 'extension-links__title' }, title),
    h('span', { class: 'extension-links__count' }, `（${visible.length} 個連結，點開看）`),
  ]);
  return h('section', { class: 'extension-links' }, [
    h('details', { class: 'extension-links__details' }, [summary, list]),
  ]);
}
