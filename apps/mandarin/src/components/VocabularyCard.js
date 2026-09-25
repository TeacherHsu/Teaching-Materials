import { h } from '../utils/dom.js';
import { SpeakButton } from './SpeakButton.js';
import { ImageFrame } from './ImageFrame.js';

/**
 * 圖像型語詞卡：固定顯示圖片、詞語與注音，意思與例句留在後續練習活動。
 * @param {object} word
 */
export function VocabularyCard(word) {
  const { word: text, zhuyin, image } = word;
  return h('div', { class: 'vocabulary-card' }, [
    image ? ImageFrame({ src: image, alt: text }) : null,
    h('div', { class: 'character-card__glyph', style: 'font-size:56px' }, text),
    zhuyin ? h('div', { class: 'character-card__zhuyin' }, zhuyin) : null,
    SpeakButton({ text, label: '聽發音' }),
  ]);
}
