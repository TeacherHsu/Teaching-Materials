import { h } from '../utils/dom.js';

export function GradePage(courseIndex, gradeNo) {
  const grade = courseIndex.grades.find((g) => String(g.grade) === String(gradeNo));
  const root = h('div', { class: 'container' });
  root.appendChild(h('p', { class: 'breadcrumb' }, [h('a', { href: '#/' }, '首頁'), ' ／ ', grade ? grade.label : '找不到年級']));
  if (!grade) {
    root.appendChild(h('div', { class: 'missing-content' }, '找不到這個年級的資料。'));
    return root;
  }
  root.appendChild(h('h1', {}, grade.label));
  const grid = h('div', { class: 'card-grid' });
  for (const volume of grade.volumes) {
    for (const unit of volume.units) {
      for (const lesson of unit.lessons) {
        const metaText = unit.title.startsWith('TODO') ? volume.label : `${volume.label} ・ ${unit.title}`;
        const cardLabel = `第 ${lesson.lesson_no} 課：${lesson.title}，${volume.label}`;
        grid.appendChild(
          h('a', { class: 'nav-card', href: `#/lesson/${lesson.lesson_id}`, 'aria-label': cardLabel }, [
            h('div', { class: 'nav-card__meta' }, metaText),
            h('div', { class: 'nav-card__title' }, `第 ${lesson.lesson_no} 課：${lesson.title}`),
          ]),
        );
      }
    }
  }
  root.appendChild(grid);
  return root;
}
