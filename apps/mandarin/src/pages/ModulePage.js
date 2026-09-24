import { h } from '../utils/dom.js';
import { CharacterCard } from '../components/CharacterCard.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { buildChallengeActivity, missingContentNotice } from '../activities/engine.js';
import { saveModuleComplete } from '../utils/storage.js';
import { navigate } from '../router/router.js';

export function ModulePage(lesson, moduleKey) {
  const mod = lesson.modules[moduleKey];
  const root = h('div', { class: 'container' });
  root.appendChild(
    h('p', { class: 'breadcrumb' }, [
      h('a', { href: '#/' }, '首頁'),
      ' ／ ',
      h('a', { href: `#/lesson/${lesson.lesson_id}` }, `第 ${lesson.lesson_no} 課`),
      ' ／ ',
      mod ? mod.label : moduleKey,
    ]),
  );

  if (!mod || mod.status !== 'available') {
    root.appendChild(h('h1', {}, mod ? mod.label : '找不到模組'));
    root.appendChild(missingContentNotice(mod && mod.note ? mod.note : '此部分教材待補'));
    root.appendChild(
      h('a', { class: 'btn', href: `#/lesson/${lesson.lesson_id}`, style: 'margin-top:16px' }, '回課程首頁'),
    );
    return root;
  }

  root.appendChild(h('h1', {}, mod.label));

  const onBack = () => navigate(`/lesson/${lesson.lesson_id}`);

  if (moduleKey === 'characters') {
    root.appendChild(TaskBanner({ label: '認識這一課的生字：點卡片聽發音，看完全部生字就算完成' }));
    const grid = h('div', { class: 'card-grid' });
    for (const c of lesson.characters) {
      grid.appendChild(CharacterCard(c));
    }
    root.appendChild(grid);
    saveModuleComplete(lesson.lesson_id, 'characters');
  } else if (moduleKey === 'challenge') {
    root.appendChild(
      buildChallengeActivity(lesson, () => {
        saveModuleComplete(lesson.lesson_id, 'challenge');
        onBack();
      }),
    );
  } else {
    root.appendChild(missingContentNotice());
  }

  return root;
}
