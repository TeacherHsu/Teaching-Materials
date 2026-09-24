import { h } from '../utils/dom.js';
import { AudioButton } from './AudioButton.js';
import { ImageFrame } from './ImageFrame.js';

/**
 * 翻卡型語詞卡：正面詞語，點擊或按 Enter/Space 翻至背面看意思＋例句。
 * @param {object} word
 */
export function VocabularyCard(word) {
  const { word: text, zhuyin, meaning, example_sentence, image } = word;
  let flipped = false;
  const front = h('div', {}, [
    h('div', { class: 'character-card__glyph', style: 'font-size:56px' }, text),
    zhuyin ? h('div', { class: 'character-card__zhuyin' }, zhuyin) : null,
    AudioButton({ text }),
  ]);
  const back = h('div', {}, [
    h('p', {}, meaning || '（意思待補）'),
    example_sentence ? h('p', { class: 'meta' }, `例句：${example_sentence}`) : null,
  ]);
  back.style.display = 'none';

  const card = h(
    'div',
    {
      class: 'vocabulary-card',
      role: 'button',
      tabindex: '0',
      'aria-label': `語詞卡：${text}，點選可翻面看意思`,
    },
    [image ? ImageFrame({ src: image, alt: text }) : null, front, back],
  );

  function toggle() {
    flipped = !flipped;
    front.style.display = flipped ? 'none' : '';
    back.style.display = flipped ? '' : 'none';
  }

  card.addEventListener('click', toggle);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  });

  return card;
}
