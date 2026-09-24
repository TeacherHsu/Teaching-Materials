import { h } from '../utils/dom.js';

export function HomePage(courseIndex) {
  const root = h('div', { class: 'container' }, [
    h('h1', {}, '國語課文樂園'),
    h('p', { class: 'meta' }, '選擇年級開始學習'),
  ]);
  const grid = h('div', { class: 'card-grid' });
  for (const grade of courseIndex.grades) {
    grid.appendChild(
      h(
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
      ),
    );
  }
  root.appendChild(grid);
  return root;
}
