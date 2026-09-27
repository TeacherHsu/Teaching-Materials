import { h } from '../utils/dom.js';
import { SpeakButton } from '../components/SpeakButton.js';

export function GradePage(courseIndex, gradeNo) {
  const grade = courseIndex.grades.find((g) => String(g.grade) === String(gradeNo));
  const root = h('div', { class: 'container' });
  root.appendChild(h('p', { class: 'breadcrumb' }, [h('a', { href: '#/' }, '首頁'), h('span', { class: 'breadcrumb__current' }, grade ? grade.label : '找不到年級')]));
  if (!grade) {
    root.appendChild(h('div', { class: 'missing-content' }, '找不到這個年級的資料。'));
    return root;
  }
  root.appendChild(
    h('div', { class: 'page-hero' }, [
      h('div', { class: 'quiz-option-row' }, [
        h('h1', {}, grade.label),
        SpeakButton({ text: grade.label, label: '聽', variant: 'speak-button--option' }),
      ]),
    ]),
  );
  const lessons = [];
  for (const volume of grade.volumes) {
    for (const unit of volume.units) {
      for (const lesson of unit.lessons) {
        const metaText = unit.title.startsWith('TODO') ? volume.label : `${volume.label} ・ ${unit.title}`;
        const cardLabel = `第 ${lesson.lesson_no} 課：${lesson.title}，${volume.label}`;
        const titleText = `第 ${lesson.lesson_no} 課：${lesson.title}`;
        const link = h('a', { class: 'nav-card', href: `#/lesson/${lesson.lesson_id}`, 'aria-label': cardLabel }, [
          h('div', { class: 'nav-card__meta' }, metaText),
          h('div', { class: 'nav-card__title' }, titleText),
        ]);
        lessons.push({ lesson, titleText, link });
      }
    }
  }

  const makeGrid = (items) => {
    const grid = h('div', { class: 'card-grid' });
    for (const { titleText, link } of items) {
      grid.appendChild(h('div', { class: 'quiz-option-row' }, [
        link,
        SpeakButton({ text: titleText, label: '聽', variant: 'speak-button--option' }),
      ]));
    }
    return grid;
  };

  if (Number(grade.grade) >= 2 && Number(grade.grade) <= 6) {
    for (const [start, end] of [[1, 6], [7, 12]]) {
      const group = lessons.filter(({ lesson }) => lesson.lesson_no >= start && lesson.lesson_no <= end);
      if (!group.length) continue;
      const details = h('details', { class: 'course-group' });
      details.appendChild(h('summary', { class: 'course-group__summary' }, [
        h('span', {}, `第 ${start}～${end} 課`),
        h('span', { class: 'course-group__count' }, `${group.length} 課`),
      ]));
      details.appendChild(makeGrid(group));
      root.appendChild(details);
    }
    const otherLessons = lessons.filter(({ lesson }) => lesson.lesson_no < 1 || lesson.lesson_no > 12);
    if (otherLessons.length) root.appendChild(makeGrid(otherLessons));
  } else {
    root.appendChild(makeGrid(lessons));
  }
  return root;
}
