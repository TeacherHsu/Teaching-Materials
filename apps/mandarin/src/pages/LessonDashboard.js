import { h } from '../utils/dom.js';
import { MODULE_REGISTRY, getModuleStatus } from '../activities/moduleRegistry.js';
import { buildExtensionLinks } from '../components/ExtensionLinks.js';
import { SpeakButton } from '../components/SpeakButton.js';

const CN_NUM = ['', '一', '二', '三', '四', '五', '六'];
const volumeLabel = (v) => `${v.publisher || ''}${CN_NUM[v.grade] || v.grade}${v.term || ''}`;

const STATUS_CLASS = {
  done: 'module-card__status--done',
  available: 'module-card__status--available',
  pending_review: 'module-card__status--missing',
  coming_soon: 'module-card__status--missing',
  locked: 'module-card__status--missing',
};

const STATUS_BUTTON_LABEL = {
  done: '再玩一次',
  available: '開始',
};

export function LessonDashboard(lesson) {
  const root = h('div', { class: 'container' });
  root.appendChild(
    h('p', { class: 'breadcrumb' }, [
      h('a', { href: '#/' }, '首頁'),
      ' ／ ',
      h('a', { href: `#/grade/${lesson.volume.grade}` }, volumeLabel(lesson.volume)),
      ' ／ ',
      `第 ${lesson.lesson_no} 課`,
    ]),
  );
  const lessonTitle = `第 ${lesson.lesson_no} 課：${lesson.title}`;
  root.appendChild(
    h('div', { class: 'quiz-option-row' }, [
      h('h1', {}, lessonTitle),
      SpeakButton({ text: lessonTitle, label: '聽', variant: 'speak-button--option' }),
    ]),
  );
  if (lesson.blurb && !lesson.blurb.startsWith('TODO')) {
    root.appendChild(
      h('div', { class: 'quiz-option-row' }, [
        h('p', {}, lesson.blurb),
        SpeakButton({ text: lesson.blurb, label: '聽', variant: 'speak-button--option' }),
      ]),
    );
  }

  const grid = h('div', { class: 'module-grid' });
  for (const entry of MODULE_REGISTRY) {
    const status = getModuleStatus(lesson, entry);
    const label = (lesson.modules[entry.key] && lesson.modules[entry.key].label) || entry.label;
    const playable = status.code === 'available' || status.code === 'done';

    const card = h('div', { class: 'module-card' }, [
      h('div', { class: 'quiz-option-row' }, [
        h('h2', {}, label),
        SpeakButton({ text: label, label: '聽', variant: 'speak-button--option' }),
      ]),
      h('span', { class: `module-card__status ${STATUS_CLASS[status.code]}` }, status.text),
    ]);

    if (playable) {
      card.appendChild(
        h(
          'a',
          { class: 'btn', href: `#/lesson/${lesson.lesson_id}/module/${entry.key}` },
          STATUS_BUTTON_LABEL[status.code] || '開始',
        ),
      );
    } else {
      card.appendChild(h('button', { class: 'btn', type: 'button', disabled: 'disabled' }, status.text));
    }
    grid.appendChild(card);
  }
  root.appendChild(grid);

  const extensionLinks = buildExtensionLinks(lesson, 'lesson', { title: '本課延伸資源' });
  if (extensionLinks) root.appendChild(extensionLinks);

  return root;
}
