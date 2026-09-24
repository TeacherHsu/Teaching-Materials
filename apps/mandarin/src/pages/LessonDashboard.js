import { h } from '../utils/dom.js';
import { isModuleComplete } from '../utils/storage.js';

const MODULE_ORDER = ['characters', 'vocabulary', 'reading', 'sentence_practice', 'challenge', 'application'];

export function LessonDashboard(lesson) {
  const root = h('div', { class: 'container' });
  root.appendChild(
    h('p', { class: 'breadcrumb' }, [
      h('a', { href: '#/' }, '首頁'),
      ' ／ ',
      h('a', { href: `#/grade/${lesson.volume.grade}` }, `${lesson.volume.grade} 年級`),
      ' ／ ',
      `第 ${lesson.lesson_no} 課`,
    ]),
  );
  root.appendChild(h('h1', {}, `第 ${lesson.lesson_no} 課：${lesson.title}`));
  if (lesson.blurb && !lesson.blurb.startsWith('TODO')) root.appendChild(h('p', {}, lesson.blurb));

  const grid = h('div', { class: 'module-grid' });
  for (const key of MODULE_ORDER) {
    const mod = lesson.modules[key];
    if (!mod) continue;
    const available = mod.status === 'available';
    const done = available && isModuleComplete(lesson.lesson_id, key);
    const statusClass = done
      ? 'module-card__status--done'
      : available
      ? 'module-card__status--available'
      : 'module-card__status--missing';
    const statusText = done ? '已完成' : available ? '可以開始' : '教材待補';

    const card = h('div', { class: 'module-card' }, [
      h('h2', {}, mod.label),
      h('span', { class: `module-card__status ${statusClass}` }, statusText),
      mod.note ? h('p', { class: 'meta' }, mod.note) : null,
    ]);

    if (available) {
      card.appendChild(
        h(
          'a',
          { class: 'btn', href: `#/lesson/${lesson.lesson_id}/module/${key}` },
          done ? '再玩一次' : '開始',
        ),
      );
    } else {
      card.appendChild(h('button', { class: 'btn', type: 'button', disabled: 'disabled' }, '教材待補'));
    }
    grid.appendChild(card);
  }
  root.appendChild(grid);
  return root;
}
