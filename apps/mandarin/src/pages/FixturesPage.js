import { h } from '../utils/dom.js';
import { VocabularyCard } from '../components/VocabularyCard.js';
import { SentenceBuilder } from '../components/SentenceBuilder.js';
import { SentenceOrdering } from '../components/SentenceOrdering.js';

/**
 * 元件測試頁：驗證 VocabularyCard／SentenceBuilder／SentenceOrdering
 * 可以運作。資料來自 public/data/_fixtures/component-fixtures.json，
 * 明確標示為假資料，不進課程 index。
 */
export function FixturesPage(fixtures) {
  const root = h('div', { class: 'container' }, [
    h('h1', {}, '元件測試頁（非教材）'),
    h('p', { class: 'meta' }, fixtures._note),
  ]);

  root.appendChild(h('h2', {}, 'VocabularyCard'));
  const vocabGrid = h('div', { class: 'card-grid' });
  fixtures.vocabulary.forEach((w) => vocabGrid.appendChild(VocabularyCard(w)));
  root.appendChild(vocabGrid);

  root.appendChild(h('h2', { style: 'margin-top:32px' }, 'SentenceBuilder'));
  root.appendChild(SentenceBuilder(fixtures.sentenceBuilder));

  root.appendChild(h('h2', { style: 'margin-top:32px' }, 'SentenceOrdering'));
  root.appendChild(SentenceOrdering(fixtures.sentenceOrdering));

  return root;
}
