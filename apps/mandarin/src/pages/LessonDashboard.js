import { h } from '../utils/dom.js';
import { MODULE_REGISTRY, getModuleStatus, moduleColorVars } from '../activities/moduleRegistry.js';
import { buildExtensionLinks } from '../components/ExtensionLinks.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { moduleIconMarkup, STATUS_ICONS } from '../components/icons.js';
import { getModuleStars, getLessonStars } from '../utils/storage.js';
import { starsMarkup } from '../utils/scoring.js';
import { volumeLabel } from '../utils/volumeLabel.js';
import { hasReading, isUnlocked } from '../utils/classroomKey.js';
import { dueCount } from '../utils/mistakes.js';
import { mistakeEntry } from './MistakePage.js';

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
const CORE_MODULES = new Set(['characters', 'vocabulary', 'sentence_practice', 'reading']);

export function LessonDashboard(lesson) {
  const root = h('div', { class: 'container' });
  root.appendChild(
    h('p', { class: 'breadcrumb' }, [
      h('a', { href: '#/' }, '首頁'),
      h('a', { href: `#/grade/${lesson.volume.grade}` }, volumeLabel(lesson.volume)),
      h('span', { class: 'breadcrumb__current' }, `第 ${lesson.lesson_no} 課`),
    ]),
  );

  const lessonTitle = `第 ${lesson.lesson_no} 課：${lesson.title}`;
  const doneCount = MODULE_REGISTRY.filter((entry) => getModuleStatus(lesson, entry).code === 'done').length;
  // 分母只算「可開始的大項」（code==='available'|'done'）：排除鎖住的（例如舊字
  // 新詞第 2 課起才開放）與教材審核中的（資料不足時，例如一字多音第 1 課），
  // 不然學生第 1 課永遠湊不滿分母，見規格 §2。跟下面 availableKeys／
  // lessonStarsMax 用同一個條件，避免「已完成 X／Y 項」跟星星最高值的 Y 對不上。
  const availableKeys = MODULE_REGISTRY.filter((entry) => {
    const s = getModuleStatus(lesson, entry);
    return s.code === 'available' || s.code === 'done';
  }).map((entry) => entry.key);
  const totalCount = availableKeys.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const lessonStars = getLessonStars(lesson.lesson_id, availableKeys);
  const lessonStarsMax = availableKeys.length * 3;

  const hero = h('div', { class: 'lesson-hero' }, [
    h('div', { class: 'lesson-hero__text' }, [
      h('p', { class: 'lesson-hero__eyebrow' }, `${volumeLabel(lesson.volume)}・第 ${lesson.lesson_no} 課`),
      h('div', { class: 'quiz-option-row' }, [
        h('h1', { class: 'lesson-hero__title' }, lessonTitle),
        SpeakButton({ text: lessonTitle, label: '聽', variant: 'speak-button--option' }),
      ]),
      lesson.blurb && !lesson.blurb.startsWith('TODO')
        ? h('div', { class: 'lesson-hero__focus' }, [
            h('p', { class: 'lesson-hero__focus-label' }, '本課學習重點'),
            h('div', { class: 'quiz-option-row' }, [
              h('p', { class: 'lesson-hero__blurb' }, lesson.blurb),
              SpeakButton({ text: lesson.blurb, label: '聽', variant: 'speak-button--option' }),
            ]),
          ])
        : null,
    ].filter(Boolean)),
    h('div', { class: 'lesson-hero__progress', role: 'status', 'aria-live': 'polite' }, [
      ringSvg(pct),
      h('p', { class: 'lesson-hero__progress-label' }, `已完成 ${doneCount} ／ ${totalCount} 項`),
      lessonStarsMax > 0
        ? h(
            'p',
            { class: 'lesson-hero__stars-label', role: 'img', 'aria-label': `本課星星，最高 ${lessonStarsMax} 顆中得到 ${lessonStars} 顆` },
            [
              h('span', { 'aria-hidden': 'true', html: STATUS_ICONS.star }),
              ` 本課星星 ${lessonStars} ／ ${lessonStarsMax}`,
            ],
          )
        : null,
    ].filter(Boolean)),
  ]);
  root.appendChild(hero);

  const coreGrid = h('div', { class: 'module-grid' });
  const challengeGrid = h('div', { class: 'module-grid' });
  for (const entry of MODULE_REGISTRY) {
    const status = getModuleStatus(lesson, entry);
    const label = (lesson.modules[entry.key] && lesson.modules[entry.key].label) || entry.label;
    const playable = status.code === 'available' || status.code === 'done';
    const colorVars = moduleColorVars(entry.color);
    const styleAttr = Object.entries(colorVars)
      .map(([k, v]) => `${k}:${v}`)
      .join(';');

    const card = h(
      'div',
      {
        class: `module-card module-card--${status.code}${status.code === 'locked' || status.code === 'coming_soon' || status.code === 'pending_review' ? ' module-card--locked' : ''}`,
        style: styleAttr,
      },
      [
        status.code === 'done'
          ? h('span', { class: 'module-card__stamp', 'aria-hidden': 'true', html: STATUS_ICONS.done })
          : null,
        h('div', {
          class: 'module-card__icon',
          'aria-hidden': 'true',
          html: moduleIconMarkup(entry.icon),
        }),
        h('div', { class: 'quiz-option-row' }, [
          h('h2', { class: 'module-card__title' }, label),
          SpeakButton({ text: label, label: '聽', variant: 'speak-button--option' }),
        ]),
        entry.description ? h('p', { class: 'module-card__desc' }, entry.description) : null,
        h(
          'span',
          { class: `module-card__status ${STATUS_CLASS[status.code]}` },
          [
            h('span', { 'aria-hidden': 'true', html: statusIcon(status.code) }),
            h('span', {}, status.text),
          ],
        ),
        playable
          ? h('span', { html: starsMarkup({ earned: getModuleStars(lesson.lesson_id, entry.key), max: 3, size: 'sm' }) })
          : null,
      ].filter(Boolean),
    );

    if (playable) {
      card.appendChild(
        h(
          'a',
          { class: 'btn module-card__cta', href: `#/lesson/${lesson.lesson_id}/module/${entry.key}` },
          [
            h('span', {}, STATUS_BUTTON_LABEL[status.code] || '開始'),
            h('span', { 'aria-hidden': 'true', html: STATUS_ICONS.arrow }),
          ],
        ),
      );
    } else {
      card.appendChild(h('button', { class: 'btn module-card__cta', type: 'button', disabled: 'disabled' }, status.text));
    }
    (CORE_MODULES.has(entry.key) ? coreGrid : challengeGrid).appendChild(card);
  }
  // 課文點讀放在所有大項之前：對閱讀困難的學生，先把課文聽過一遍再做練習
  // 才有意義。要不要顯示取決於「這一課有沒有課文」，而那要讀密文檔的 manifest
  // （非同步），所以先插一個空殼，問到答案再填——不讓整頁等網路。
  // 錯題複習排在課文點讀之前：有到期錯題時，那是今天最該做的事。
  const mistakes = mistakeEntry(lesson.lesson_id, dueCount(lesson.lesson_id));
  if (mistakes) root.appendChild(mistakes);

  root.appendChild(readerEntry(lesson));

  if (coreGrid.childElementCount) {
    root.appendChild(h('section', { class: 'lesson-module-section', 'aria-labelledby': 'core-modules-heading' }, [
      // 「本課先完成」對學生是非必要資訊（CF 決定移除，減少視覺干擾）。標題保留給
      // 螢幕閱讀器使用（section 仍以 aria-labelledby 指向它），只是視覺上隱藏。
      h('h2', { id: 'core-modules-heading', class: 'lesson-module-section__title visually-hidden' }, '本課先完成'),
      coreGrid,
    ]));
  }
  if (challengeGrid.childElementCount) {
    const details = h('details', { class: 'lesson-challenge-group' });
    details.appendChild(h('summary', { class: 'lesson-challenge-group__summary' }, [
      h('span', {}, '加練挑戰'),
      h('span', { class: 'lesson-challenge-group__hint' }, '想多練習時再展開'),
    ]));
    details.appendChild(challengeGrid);
    root.appendChild(details);
  }

  const extensionLinks = buildExtensionLinks(lesson, 'lesson', { title: '本課延伸資源' });
  if (extensionLinks) root.appendChild(extensionLinks);

  return root;
}

// 「課文點讀」入口。沒有課文就什麼都不顯示（不要留一個按不動的按鈕）。
function readerEntry(lesson) {
  const slot = h('div', {});
  hasReading(lesson.lesson_id)
    .then((available) => {
      if (!available) return;
      const unlocked = isUnlocked();
      slot.appendChild(
        h('a', { class: 'reader-entry', href: `#/lesson/${lesson.lesson_id}/reader` }, [
          h('span', { class: 'reader-entry__icon', 'aria-hidden': 'true' }, unlocked ? '📖' : '🔒'),
          h('span', { class: 'reader-entry__text' }, [
            h('span', { class: 'reader-entry__title' }, '課文點讀'),
            h(
              'span',
              { class: 'reader-entry__desc' },
              unlocked ? '點字、點詞、點句都會念，也可以整篇念下來。' : '需要教室密碼才能打開課文。',
            ),
          ]),
          h('span', { class: 'reader-entry__arrow', 'aria-hidden': 'true', html: STATUS_ICONS.arrow }),
        ]),
      );
    })
    .catch(() => {
      /* 讀不到密文檔就不顯示入口，其他大項照常 */
    });
  return slot;
}

function statusIcon(code) {
  if (code === 'done') return STATUS_ICONS.done;
  if (code === 'locked' || code === 'coming_soon') return STATUS_ICONS.lock;
  return '';
}

function ringSvg(pct) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const offset = c - (c * pct) / 100;
  const svgMarkup = `<svg viewBox="0 0 72 72" width="72" height="72" role="img" aria-label="整課完成進度 ${pct}%">
    <circle cx="36" cy="36" r="${r}" fill="none" stroke="var(--color-surface-muted)" stroke-width="8"/>
    <circle cx="36" cy="36" r="${r}" fill="none" stroke="var(--color-primary)" stroke-width="8"
      stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${offset}"
      transform="rotate(-90 36 36)"/>
    <text x="36" y="41" text-anchor="middle" font-size="18" font-weight="700" fill="var(--text-primary)">${pct}%</text>
  </svg>`;
  return h('div', { class: 'progress-ring', html: svgMarkup });
}
