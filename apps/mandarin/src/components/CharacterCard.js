import { h } from '../utils/dom.js';
import { SpeakButton } from './SpeakButton.js';
import { ImageFrame } from './ImageFrame.js';

/**
 * @param {object} character 單一生字資料（見 schema/lesson.schema.json）
 * @param {{url: string, title: string}|null} [originExtension] module=characters、type=reading
 *   的已核准延伸連結（例如「漢字由來」），層級低於主要內容，放在卡片最下方。
 */
export function CharacterCard(character, originExtension = null) {
  const { char, zhuyin, radical, stroke_count, type, examples, image, audio_override, pedia_url } = character;
  const card = h('div', { class: 'character-card' }, [
    h('span', { class: 'character-card__type-badge' }, type === '認讀字' ? '認讀字（只要會認）' : '習寫字'),
    h('div', { class: 'character-card__glyph', 'aria-hidden': 'true' }, char),
    h('div', { class: 'character-card__zhuyin' }, zhuyin),
    SpeakButton({ text: char, audioUrl: audio_override, label: '聽發音' }),
    h('div', { class: 'character-card__meta-row' }, [
      h('span', {}, `部首：${radical}`),
      h('span', {}, `筆畫：${stroke_count}`),
    ]),
    image ? ImageFrame({ src: image, alt: `${char} 的插圖` }) : null,
    examples && examples.length
      ? h('div', { class: 'quiz-option-row' }, [
          h('p', { class: 'meta' }, `造詞：${examples.join('、')}`),
          SpeakButton({ text: examples.join('、'), label: '聽造詞', variant: 'speak-button--option' }),
        ])
      : h('p', { class: 'meta' }, '造詞：教材待補'),
    pedia_url
      ? h(
          'a',
          { href: pedia_url, target: '_blank', rel: 'noopener noreferrer', class: 'btn btn--secondary' },
          '看筆順與完整解釋（教育百科，另開視窗）',
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
          },
          '看字的由來（另開視窗）',
        )
      : null,
  ]);
  return card;
}
