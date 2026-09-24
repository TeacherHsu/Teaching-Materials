import { h } from '../utils/dom.js';
import { missingContentNotice } from '../activities/engine.js';
import { buildIdiomBuilderActivity } from '../components/IdiomBuilder.js';
import { buildReadingActivity } from '../activities/reading.js';
import { buildCharactersActivity } from '../activities/characters.js';
import { buildVocabularyActivity } from '../activities/vocabulary.js';
import { buildSentencePracticeActivity } from '../activities/sentencePractice.js';
import { buildPolysemyActivity } from '../activities/polysemy.js';
import { buildListeningActivity } from '../activities/listening.js';
import { buildRhetoricActivity } from '../activities/rhetoric.js';
import { buildStructureMapActivity } from '../activities/structureMap.js';
import { buildReviewActivity } from '../activities/review.js';
import { buildExtensionLinks } from '../components/ExtensionLinks.js';
import { findModuleEntry, getModuleStatus } from '../activities/moduleRegistry.js';
import { saveModuleComplete } from '../utils/storage.js';
import { navigate } from '../router/router.js';
import { isPreview } from '../utils/preview.js';

export function ModulePage(lesson, moduleKey) {
  const entry = findModuleEntry(moduleKey);
  const mod = lesson.modules[moduleKey];
  const label = (mod && mod.label) || (entry && entry.label) || moduleKey;
  const status = entry ? getModuleStatus(lesson, entry) : { code: 'coming_soon', text: '即將推出' };
  const root = h('div', { class: 'container' });
  root.appendChild(
    h('p', { class: 'breadcrumb' }, [
      h('a', { href: '#/' }, '首頁'),
      ' ／ ',
      h('a', { href: `#/lesson/${lesson.lesson_id}` }, `第 ${lesson.lesson_no} 課`),
      ' ／ ',
      label,
    ]),
  );

  const playable = status.code === 'available' || status.code === 'done';
  if (!playable) {
    root.appendChild(h('h1', {}, label));
    root.appendChild(missingContentNotice(status.text));
    root.appendChild(
      h('a', { class: 'btn', href: `#/lesson/${lesson.lesson_id}`, style: 'margin-top:16px' }, '回課程首頁'),
    );
    return root;
  }

  root.appendChild(h('h1', {}, label));
  if (isPreview()) {
    root.appendChild(h('p', { class: 'meta' }, '預覽模式：待審（draft）內容會顯示並加「待審」標籤，正式上線不會出現。'));
  }

  const onBack = () => navigate(`/lesson/${lesson.lesson_id}`);

  if (moduleKey === 'characters') {
    root.appendChild(
      buildCharactersActivity(lesson, () => {
        saveModuleComplete(lesson.lesson_id, 'characters');
        onBack();
      }),
    );
  } else if (moduleKey === 'vocabulary') {
    root.appendChild(
      buildVocabularyActivity(lesson, () => {
        saveModuleComplete(lesson.lesson_id, 'vocabulary');
        onBack();
      }),
    );
  } else if (moduleKey === 'sentence_practice') {
    root.appendChild(
      buildSentencePracticeActivity(lesson, () => {
        saveModuleComplete(lesson.lesson_id, 'sentence_practice');
        onBack();
      }),
    );
  } else if (moduleKey === 'idiom_builder') {
    root.appendChild(
      buildIdiomBuilderActivity(lesson, () => {
        saveModuleComplete(lesson.lesson_id, 'idiom_builder');
        onBack();
      }),
    );
  } else if (moduleKey === 'reading') {
    root.appendChild(
      buildReadingActivity(lesson, () => {
        saveModuleComplete(lesson.lesson_id, 'reading');
        onBack();
      }),
    );
  } else if (moduleKey === 'polysemy') {
    root.appendChild(
      buildPolysemyActivity(lesson, () => {
        saveModuleComplete(lesson.lesson_id, 'polysemy');
        onBack();
      }),
    );
  } else if (moduleKey === 'listening') {
    root.appendChild(
      buildListeningActivity(lesson, () => {
        saveModuleComplete(lesson.lesson_id, 'listening');
        onBack();
      }),
    );
  } else if (moduleKey === 'rhetoric') {
    root.appendChild(
      buildRhetoricActivity(lesson, () => {
        saveModuleComplete(lesson.lesson_id, 'rhetoric');
        onBack();
      }),
    );
  } else if (moduleKey === 'structure_map') {
    root.appendChild(
      buildStructureMapActivity(lesson, () => {
        saveModuleComplete(lesson.lesson_id, 'structure_map');
        onBack();
      }),
    );
  } else if (moduleKey === 'review') {
    root.appendChild(
      buildReviewActivity(lesson, () => {
        saveModuleComplete(lesson.lesson_id, 'review');
        onBack();
      }),
    );
  } else {
    root.appendChild(missingContentNotice());
  }

  const extensionLinks = buildExtensionLinks(lesson, moduleKey);
  if (extensionLinks) root.appendChild(extensionLinks);

  return root;
}
