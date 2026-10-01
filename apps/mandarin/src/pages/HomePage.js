import { h } from '../utils/dom.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { MODULE_COLOR_KEYS, moduleColorVars } from '../activities/moduleRegistry.js';
import { dueCount } from '../utils/mistakes.js';
import { redoSentences } from '../utils/madeSentences.js';
import { uiIconMarkup } from '../components/icons.js';

export function HomePage(courseIndex) {
  const root = h('div', { class: 'container' }, [
    h('div', { class: 'page-hero' }, [
      h('div', { class: 'quiz-option-row' }, [
        h('h1', {}, '國語課文樂園'),
        SpeakButton({ text: '國語課文樂園', label: '聽', variant: 'speak-button--option' }),
      ]),
      h('p', { class: 'meta' }, '選擇課本開始學習'),
    ]),
  ]);
  const grid = h('div', { class: 'card-grid' });
  courseIndex.grades.forEach((grade, i) => {
    const colorKey = MODULE_COLOR_KEYS[i % MODULE_COLOR_KEYS.length];
    const styleAttr = Object.entries(moduleColorVars(colorKey))
      .map(([k, v]) => `${k}:${v}`)
      .join(';');
    const link = h(
      'a',
      {
        class: 'nav-card nav-card--cover',
        href: `#/grade/${grade.grade}`,
        'aria-label': grade.label,
        style: styleAttr,
      },
      [
        h('div', { class: 'nav-card__title' }, grade.label),
      ],
    );
    grid.appendChild(
      h('div', { class: 'quiz-option-row' }, [
        link,
        SpeakButton({ text: grade.label, label: '聽', variant: 'speak-button--option' }),
      ]),
    );
  });
  root.appendChild(grid);

  // 首頁下半原本是空的（看起來像還沒載完）。這裡放的是學生真的會用的入口，
  // 不是為了填滿版面的裝飾：有到期錯題時才出現，沒有就不佔位置。
  const pending = dueCount() + redoSentences().length;
  if (pending) {
    root.appendChild(h('a', {
      class: 'entry-card entry-card--wide entry-card--mistake entry-card--accent',
      href: '#/mistakes',
    }, [
      h('span', { class: 'entry-card__icon', 'aria-hidden': 'true', html: uiIconMarkup('redo') }),
      h('span', { class: 'entry-card__body' }, [
        h('span', { class: 'entry-card__title' }, '錯題複習'),
        h('span', { class: 'entry-card__desc' }, '把之前答錯的題目再做一次，不分課本。'),
      ]),
      h('span', { class: 'entry-card__badge', 'aria-label': `${pending} 題待複習` }, String(pending)),
    ]));
  }
  return root;
}
