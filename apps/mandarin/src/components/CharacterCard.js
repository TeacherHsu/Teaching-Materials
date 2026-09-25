import { h } from '../utils/dom.js';
import { SpeakButton } from './SpeakButton.js';
import { ImageFrame } from './ImageFrame.js';

const EXTERNAL_LINK_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-left:4px;vertical-align:-2px"><path d="M14 5h5v5"/><path d="M19 5l-8 8"/><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>`;

/**
 * @param {object} character 單一生字資料（見 schema/lesson.schema.json）
 * @param {{url: string, title: string}|null} [originExtension] module=characters、type=reading
 *   的已核准延伸連結（例如「漢字由來」），層級低於主要內容，放在卡片最下方。
 */
export function CharacterCard(character, originExtension = null) {
  const { char, radical, stroke_count, examples, image, audio_override, pedia_url } = character;
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
          h('p', { class: 'character-card__examples' }, `造詞：${examples.join('、')}`),
          SpeakButton({ text: examples.join('、'), label: '聽造詞', variant: 'speak-button--option' }),
        ])
      : h('p', { class: 'character-card__examples' }, '造詞：教材待補'),
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
  return card;
}
