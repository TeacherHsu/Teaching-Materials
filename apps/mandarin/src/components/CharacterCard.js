import { h } from '../utils/dom.js';
import { SpeakButton } from './SpeakButton.js';
import { ImageFrame } from './ImageFrame.js';
import { hasCharacterStory } from '../pages/CharacterStoryPage.js';
import { StrokeAnimation } from './StrokeAnimation.js';
import { loadHanziParts } from '../utils/hanziParts.js';
import { isPreview } from '../utils/preview.js';

// 筆順動畫：CF 核對完「生字筆順-待確認」清單之前，只在預覽模式出現。核對完改成 true。
// 鉛筆插畫（和大項插圖同一種淡雅風格：主題色描邊、無黑線）
const PENCIL_ILLUSTRATION = `<svg viewBox="0 0 64 64" width="40" height="40" aria-hidden="true">
  <g transform="rotate(-40 32 32)" stroke="var(--module-color, #3a7cc0)" stroke-opacity="0.55" stroke-width="2.5" stroke-linejoin="round">
    <rect x="14" y="25" width="30" height="14" rx="2" fill="#f7d77e"/>
    <rect x="44" y="25" width="7" height="14" fill="#cfd8e6"/>
    <rect x="51" y="25" width="6" height="14" rx="3" fill="#f2a7b5"/>
    <path d="M14 25 L4 32 L14 39 Z" fill="#f6e3c6"/>
    <path d="M7.5 29.6 L4 32 L7.5 34.4 Z" fill="var(--module-color, #3a7cc0)" stroke="none" opacity="0.8"/>
    <line x1="16" y1="32" x2="42" y2="32" stroke-opacity="0.3"/>
  </g>
</svg>`;

const STROKE_ANIMATION_APPROVED = true; // CF 2026-10-04 核對 808 字筆順 OK

const EXTERNAL_LINK_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-left:4px;vertical-align:-2px"><path d="M14 5h5v5"/><path d="M19 5l-8 8"/><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>`;

/**
 * @param {object} character 單一生字資料（見 schema/lesson.schema.json）
 * @param {{url: string, title: string}|null} [originExtension] module=characters、type=reading
 *   的已核准延伸連結（例如「漢字由來」），層級低於主要內容，放在卡片最下方。
 */
export function CharacterCard(character, originExtension = null, lessonId = '') {
  const { char, radical, stroke_count, examples, image, audio_override, pedia_url } = character;
  // 「字的故事」按鈕只在查得到可靠字源時出現；沒有字源的字就少一顆按鈕，
  // 不放空殼入口（CF 指定）。
  const card = h('div', { class: 'character-card' }, [
    h('div', { class: 'character-card__glyph', 'aria-hidden': 'true' }, char),
    SpeakButton({ text: char, audioUrl: audio_override, label: '聽發音' }),
    h('div', { class: 'character-card__meta-row' }, [
      h('span', {}, `部首：${radical}`),
      h('span', {}, `筆畫：${stroke_count}`),
    ]),
    image ? ImageFrame({ src: image, alt: `${char} 的插圖` }) : null,
    examples && examples.length
      ? h('div', { class: 'quiz-option-row' }, [
          h('p', { class: 'character-card__examples' }, examples.join('、')),
          SpeakButton({ text: examples.join('、'), label: '聽造詞', variant: 'speak-button--option' }),
        ])
      : null,
    lessonId && hasCharacterStory(character)
      ? h('a', {
          class: 'btn btn--secondary character-card__story-link',
          href: `#/lesson/${lessonId}/char/${encodeURIComponent(char)}`,
        }, `${char} 的故事`)
      : null,
    pedia_url
      ? h(
          'a',
          {
            href: pedia_url,
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'btn btn--secondary character-card__pedia-link',
            'aria-label': '待：筆順與解釋，教育百科，另開新視窗',
            html: `筆順與解釋${EXTERNAL_LINK_ICON}`,
          },
        )
      : null,
    originExtension
      ? h(
          'a',
          {
            href: originExtension.url,
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'character-card__origin-link',
            'aria-label': '待：字的由來，教育部異體字字典，另開新視窗',
            html: `字的由來${EXTERNAL_LINK_ICON}`,
          },
        )
      : null,
  ]);
  // 站內筆順動畫：資料載到、而且這個字有筆順（筆畫數和課本一致）才出現按鈕。
  // 沒有的字照舊用上面的外部「筆順與解釋」。
  if (lessonId && typeof document !== 'undefined' && (STROKE_ANIMATION_APPROVED || isPreview())) {
    const slot = h('div', { class: 'character-card__stroke' });
    // 只放鉛筆插畫、不寫字（CF 2026-10-04：卡片上已有外部「筆順與解釋」，避免「筆順」重複出現）
    const toggle = h('button', {
      class: 'character-card__stroke-btn', type: 'button', hidden: true,
      'aria-label': '看筆順動畫', 'aria-expanded': 'false', title: '看筆順動畫', html: PENCIL_ILLUSTRATION,
    });
    let open = false;
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      open = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '收起筆順動畫' : '看筆順動畫');
      toggle.classList.toggle('character-card__stroke-btn--open', open);
      if (!open) { slot.replaceChildren(); return; }
      loadHanziParts(lessonId.slice(0, 7)).then((data) => {
        const d = data?.chars?.[char];
        if (d?.m) slot.replaceChildren(StrokeAnimation({ char, strokes: d.s, medians: d.m }));
      });
    });
    loadHanziParts(lessonId.slice(0, 7)).then((data) => { if (data?.chars?.[char]?.m) toggle.hidden = false; });
    card.insertBefore(slot, card.children[2] || null);
    card.insertBefore(toggle, slot);
  }
  return card;
}
