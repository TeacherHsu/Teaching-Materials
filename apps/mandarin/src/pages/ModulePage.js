import { h, clear } from '../utils/dom.js';
import { SpeakButton } from '../components/SpeakButton.js';
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
import { buildPolyphonesActivity } from '../activities/polyphones.js';
import { buildLookalikesActivity } from '../activities/lookalikes.js';
import { buildExtensionLinks } from '../components/ExtensionLinks.js';
import { findModuleEntry, getModuleStatus, MODULE_REGISTRY, moduleColorVars } from '../activities/moduleRegistry.js';
import { saveModuleComplete, saveModuleStars, getLessonStars } from '../utils/storage.js';
import { startScoreSession, endScoreSession } from '../utils/scoreSession.js';
import { computeModuleStars, starsMarkup } from '../utils/scoring.js';
import { celebrateComplete } from '../utils/celebrate.js';
import { moduleIconMarkup } from '../components/icons.js';
import { navigate } from '../router/router.js';
import { isPreview } from '../utils/preview.js';
import { volumeLabel } from '../utils/volumeLabel.js';

const ACTIVITY_BUILDERS = {
  characters: buildCharactersActivity,
  vocabulary: buildVocabularyActivity,
  sentence_practice: buildSentencePracticeActivity,
  idiom_builder: buildIdiomBuilderActivity,
  reading: buildReadingActivity,
  polysemy: buildPolysemyActivity,
  listening: buildListeningActivity,
  rhetoric: buildRhetoricActivity,
  structure_map: buildStructureMapActivity,
  polyphones: buildPolyphonesActivity,
  lookalikes: buildLookalikesActivity,
  review: buildReviewActivity,
};

/** 可開始的大項清單，用來算「本課星星 N／最高 M」的分母（M = 這些大項數 × 3）。 */
function availableModuleKeys(lesson) {
  return MODULE_REGISTRY.filter((entry) => {
    const s = getModuleStatus(lesson, entry);
    return s.code === 'available' || s.code === 'done';
  }).map((entry) => entry.key);
}

export function ModulePage(lesson, moduleKey) {
  const entry = findModuleEntry(moduleKey);
  const mod = lesson.modules[moduleKey];
  const label = (mod && mod.label) || (entry && entry.label) || moduleKey;
  const status = entry ? getModuleStatus(lesson, entry) : { code: 'coming_soon', text: '即將推出' };
  const root = h('div', { class: 'container' });
  if (entry) {
    const colorVars = moduleColorVars(entry.color);
    root.setAttribute('style', Object.entries(colorVars).map(([k, v]) => `${k}:${v}`).join(';'));
  }
  root.appendChild(
    h('p', { class: 'breadcrumb' }, [
      h('a', { href: '#/' }, '首頁'),
      ' ／ ',
      h('a', { href: `#/grade/${lesson.volume.grade}` }, volumeLabel(lesson.volume)),
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

  if (entry) {
    root.appendChild(
      h('div', { class: 'module-page-strip', 'aria-hidden': 'true' }, [
        h('span', { class: 'module-page-strip__icon', html: moduleIconMarkup(entry.icon) }),
      ]),
    );
  }
  root.appendChild(
    h('div', { class: 'quiz-option-row' }, [
      h('h1', {}, label),
      SpeakButton({ text: label, label: '聽', variant: 'speak-button--option' }),
    ]),
  );
  if (isPreview()) {
    root.appendChild(h('p', { class: 'meta' }, '預覽模式：待審（draft）內容會顯示並加「待審」標籤，正式上線不會出現。'));
  }

  const onBack = () => navigate(`/lesson/${lesson.lesson_id}`);
  const activitySlot = h('div', {});
  root.appendChild(activitySlot);

  const builder = ACTIVITY_BUILDERS[moduleKey];
  if (builder) {
    startScoreSession();
    const onModuleDone = () => {
      const meta = endScoreSession();
      const stars = computeModuleStars(meta);
      const { stars: bestStars, isNewRecord } = saveModuleStars(lesson.lesson_id, moduleKey, stars);
      saveModuleComplete(lesson.lesson_id, moduleKey);
      clear(activitySlot);
      activitySlot.appendChild(renderModuleCompleteSummary({ lesson, stars, bestStars, isNewRecord, onBack }));
    };
    activitySlot.appendChild(builder(lesson, onModuleDone));
  } else {
    activitySlot.appendChild(missingContentNotice());
  }

  const extensionLinks = buildExtensionLinks(lesson, moduleKey);
  if (extensionLinks) root.appendChild(extensionLinks);

  return root;
}

/**
 * 大項完成後的星星摘要卡：這次得到幾顆星、整課累計、若刷新最佳紀錄加提示。
 * total=0（此大項沒有可判定題目，例如純瀏覽步驟）時不顯示星星列，只顯示完成訊息。
 */
function renderModuleCompleteSummary({ lesson, stars, bestStars, isNewRecord, onBack }) {
  const keys = availableModuleKeys(lesson);
  const lessonStars = getLessonStars(lesson.lesson_id, keys);
  const lessonStarsMax = keys.length * 3;

  const children = [
    h('div', { class: 'completion-feedback__badge', 'aria-hidden': 'true', html: DONE_BADGE }),
    h('h2', {}, '完成！'),
  ];
  if (bestStars > 0 || stars > 0) {
    children.push(
      h('div', { class: 'quiz-option-row', style: 'justify-content:center' }, [
        h('p', { class: 'completion-feedback__stars-label' }, '這次得到：'),
        h('span', { html: starsMarkup({ earned: stars, max: 3 }) }),
      ]),
    );
    if (isNewRecord) {
      children.push(h('p', { class: 'completion-feedback__new-record' }, '新紀錄！'));
    }
  }
  children.push(
    h('p', { class: 'meta' }, `本課累計星星：${lessonStars} ／ ${lessonStarsMax}`),
  );
  children.push(
    h('div', { class: 'card-grid', style: 'margin-top:16px' }, [
      h('button', { class: 'btn', type: 'button', onclick: onBack }, '回任務地圖'),
    ]),
  );

  const summary = h(
    'div',
    { class: 'completion-feedback completion-feedback--module', role: 'status', 'aria-live': 'polite' },
    children,
  );
  if (stars > 0) {
    celebrateComplete(summary, { moduleColor: 'var(--module-color)', isNewRecord, starsEarned: stars });
  }
  return summary;
}

const DONE_BADGE = `<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3l6-6.5"/></svg>`;
