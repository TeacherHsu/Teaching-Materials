import { h } from '../utils/dom.js';
import { SpeakButton } from '../components/SpeakButton.js';

export function HomePage(courseIndex) {
  const root = h('div', { class: 'container' }, [
    h('div', { class: 'quiz-option-row' }, [
      h('h1', {}, '國語課文樂園'),
      SpeakButton({ text: '國語課文樂園', label: '聽', variant: 'speak-button--option' }),
    ]),
    h('p', { class: 'meta' }, '選擇年級開始學習'),
  ]);
  const grid = h('div', { class: 'card-grid' });
  for (const grade of courseIndex.grades) {
    const link = h(
      'a',
      {
        class: 'nav-card',
        href: `#/grade/${grade.grade}`,
        'aria-label': `${grade.label}，共 ${grade.volumes.length} 冊`,
      },
      [
        h('div', { class: 'nav-card__title' }, grade.label),
        h('div', { class: 'nav-card__meta' }, `${grade.volumes.length} 冊`),
      ],
    );
    grid.appendChild(
      h('div', { class: 'quiz-option-row' }, [
        link,
        SpeakButton({ text: grade.label, label: '聽', variant: 'speak-button--option' }),
      ]),
    );
  }
  root.appendChild(grid);
  return root;
}
