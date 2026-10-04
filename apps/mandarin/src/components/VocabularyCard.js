import { h, clear } from '../utils/dom.js';
import { SpeakButton } from './SpeakButton.js';
import { ImageFrame } from './ImageFrame.js';

/**
 * 圖像型語詞卡：圖片固定不變，點選後將詞語替換成意思。
 * @param {object} word
 */
export function VocabularyCard(word) {
  const { word: text, meaning, image } = word;
  const safeMeaning = meaning || '（意思待補）';
  let showingMeaning = false;
  // 翻面用真正的 <button>；外框不再是 role=button（裡面還有喇叭，巢狀互動元件讀屏會混亂）
  const term = h('button', { class: 'vocabulary-card__term', type: 'button', 'aria-live': 'polite', 'aria-pressed': 'false' }, text);
  const speakSlot = h('div', { class: 'vocabulary-card__speak' }, [SpeakButton({ text, label: '聽發音' })]);

  const card = h(
    'div',
    {
      class: 'vocabulary-card',
    },
    [image ? ImageFrame({ src: image, alt: '' }) : null, term, speakSlot],
  );

  function renderState() {
    const shownText = showingMeaning ? safeMeaning : text;
    term.textContent = shownText;
    term.classList.toggle('vocabulary-card__term--meaning', showingMeaning);
    term.setAttribute('aria-pressed', String(showingMeaning));
    term.setAttribute(
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

  // 點卡片任何地方都能翻（圖片也算）；鍵盤用 term 按鈕（原生 Enter／空白鍵）
  card.addEventListener('click', toggleMeaning);

  return card;
}
