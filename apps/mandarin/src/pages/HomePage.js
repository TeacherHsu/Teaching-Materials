import { h } from '../utils/dom.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { MODULE_COLOR_KEYS, moduleColorVars } from '../activities/moduleRegistry.js';

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
  // 「繼續學習」不放首頁（CF 2026-10-04）：一台平板不同年級共用，首頁不分年級會帶錯課；
  // 改放在各年級頁，只顯示該年級的上次進度。
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

  // 錯題複習不放首頁（CF 2026-10-03）：同一台平板會給不同年級用，
  // 首頁的「不分課本」錯題卡會讓六年級學生看到二年級的錯題。
  // 入口移到各課次頁的加練挑戰區，範圍限定在該冊。
  return root;
}
