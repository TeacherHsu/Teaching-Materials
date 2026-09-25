import { h, clear } from '../utils/dom.js';
import { SpeakButton } from './SpeakButton.js';
import { ImageFrame } from './ImageFrame.js';

/**
 * 圖像型語詞卡：圖片固定不變，點選後將詞語替換成意思。
 * @param {object} word
 */
export function VocabularyCard(word) {
  const { word: text, zhuyin, meaning, image } = word;
  const safeMeaning = meaning || '（意思待補）';
  let showingMeaning = false;
  const term = h('div', { class: 'vocabulary-card__term', 'aria-live': 'polite' }, text);
  const pronunciation = zhuyin ? h('div', { class: 'character-card__zhuyin' }, zhuyin) : null;
  const speakSlot = h('div', { class: 'vocabulary-card__speak' }, [SpeakButton({ text, label: '聽發音' })]);

  const card = h(
    'div',
    {
      class: 'vocabulary-card',
      role: 'button',
      tabindex: '0',
      'aria-pressed': 'false',
      'aria-label': `語詞卡：${text}，點選查看意思`,
    },
    [image ? ImageFrame({ src: image, alt: text }) : null, term, pronunciation, speakSlot],
  );

  function renderState() {
    const shownText = showingMeaning ? safeMeaning : text;
    term.textContent = shownText;
    term.classList.toggle('vocabulary-card__term--meaning', showingMeaning);
    if (pronunciation) pronunciation.style.display = showingMeaning ? 'none' : '';
    card.setAttribute('aria-pressed', String(showingMeaning));
    card.setAttribute(
      'aria-label',
      showingMeaning ? `語詞卡：${text}，目前顯示意思：${safeMeaning}，點選返回語詞` : `語詞卡：${text}，點選查看意思`,
    );
    clear(speakSlot);
    speakSlot.appendChild(SpeakButton({ text: shownText, label: showingMeaning ? '聽解釋' : '聽發音' }));
  }

  function toggleMeaning() {
    showingMeaning = !showingMeaning;
    renderState();
  }

  card.addEventListener('click', toggleMeaning);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleMeaning();
    }
  });

  return card;
}
