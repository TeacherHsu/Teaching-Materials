import { isPreview } from '../utils/preview.js';
import { setLastLesson } from '../utils/deviceSettings.js';
import { withEntrySpeak } from '../components/EntrySpeak.js';
import { h } from '../utils/dom.js';
import { MODULE_REGISTRY, getModuleStatus, moduleColorVars } from '../activities/moduleRegistry.js';
import { buildExtensionLinks } from '../components/ExtensionLinks.js';
import { SpeakButton, SpeakTip } from '../components/SpeakButton.js';
import { moduleIconMarkup, STATUS_ICONS, uiIconMarkup } from '../components/icons.js';
import { getModuleStars, getLessonStars } from '../utils/storage.js';
import { starsMarkup } from '../utils/scoring.js';
import { volumeLabel } from '../utils/volumeLabel.js';
import { hasReading, isUnlocked } from '../utils/classroomKey.js';
import { reciteSummary } from '../utils/reciteRecords.js';
import { dueCount } from '../utils/mistakes.js';
import { redoSentences } from '../utils/madeSentences.js';
import { mistakeEntry } from './MistakePage.js';
import { loadHanziParts } from '../utils/hanziParts.js';
import { quizEntry } from './QuizPage.js';

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
// 基本練習（2026-10-05）：先練讀（念讀字詞）→ 再練短語（照樣造短語）。
// 不收合、排在核心之後；照樣造短語還沒有教師確認的課，學生畫面不顯示這張卡（預覽模式才看得到）。
const BASIC_MODULES = ['word_reading', 'phrase_builder'];

export function LessonDashboard(lesson) {
  // 先在背景載入這冊的字形／部件資料：字感訓練、形似字、生字部首、筆順都會用到，
  // 學生點進活動時就已經有了。
  if (typeof fetch === 'function') loadHanziParts(String(lesson.lesson_id || '').slice(0, 7)).catch?.(() => {});
  const root = h('div', { class: 'container' });
  root.appendChild(
    h('p', { class: 'breadcrumb' }, [
      h('a', { href: '#/' }, '首頁'),
      h('a', { href: `#/grade/${lesson.volume.grade}` }, volumeLabel(lesson.volume)),
      h('span', { class: 'breadcrumb__current' }, `第 ${lesson.lesson_no} 課`),
    ]),
  );

  const lessonTitle = `第 ${lesson.lesson_no} 課：${lesson.title}`;
  // 分母只算「可開始的大項」（code==='available'|'done'）：排除鎖住的（例如舊字
  // 新詞第 2 課起才開放）與教材審核中的（資料不足時，例如一字多音第 1 課），
  // 不然學生第 1 課永遠湊不滿分母，見規格 §2。跟下面 availableKeys／
  // lessonStarsMax 用同一個條件，避免「已完成 X／Y 項」跟星星最高值的 Y 對不上。
  const availableKeys = MODULE_REGISTRY.filter((entry) => {
    const s = getModuleStatus(lesson, entry);
    return s.code === 'available' || s.code === 'done';
  }).map((entry) => entry.key);
  // 核心必做與加練選做分帳（2026-10-04 第二版審查 A3）：進度環只算核心，
  // 未開任何挑戰也能到 100%；加練的項目與星星另外列，標明「選做」。
  const isDone = (key) => getModuleStatus(lesson, MODULE_REGISTRY.find((e) => e.key === key)).code === 'done';
  const coreKeys = availableKeys.filter((k) => CORE_MODULES.has(k));
  const extraKeys = availableKeys.filter((k) => !CORE_MODULES.has(k));
  const coreDone = coreKeys.filter(isDone).length;
  const extraDone = extraKeys.filter(isDone).length;
  const pct = coreKeys.length > 0 ? Math.round((coreDone / coreKeys.length) * 100) : 0;
  const coreStars = getLessonStars(lesson.lesson_id, coreKeys);
  const extraStars = getLessonStars(lesson.lesson_id, extraKeys);

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
      h('p', { class: 'lesson-hero__progress-label' }, `核心學習 ${coreDone} ／ ${coreKeys.length} 項`),
      coreKeys.length > 0
        ? h('p', { class: 'lesson-hero__stars-label', role: 'img', 'aria-label': `核心星星，最高 ${coreKeys.length * 3} 顆中得到 ${coreStars} 顆` }, [
            h('span', { 'aria-hidden': 'true', html: STATUS_ICONS.star }),
            ` 核心星星 ${coreStars} ／ ${coreKeys.length * 3}`,
          ])
        : null,
      pct === 100 ? h('p', { class: 'lesson-hero__core-done' }, '核心學習完成！加練是額外的練習。') : null,
      extraKeys.length > 0
        ? h('p', { class: 'lesson-hero__extra-label' }, `加練挑戰（選做）${extraDone} ／ ${extraKeys.length} 項・加練星星 ${extraStars}`)
        : null,
    ].filter(Boolean)),
  ]);
  root.appendChild(hero);
  setLastLesson(lesson.lesson_id, `第 ${lesson.lesson_no} 課〈${lesson.title}〉`, lesson.volume.grade);
  { const path = learningPath(lesson, coreKeys); if (path) root.appendChild(path); }
  { const tip = SpeakTip(); if (tip) root.appendChild(tip); }


  // 「下一步」：核心大項裡第一個還沒完成的（參考站的做法）。
  // 對執行功能弱的學生，「接下來做哪一個」本身就是一個要決定的負擔；
  // 直接標出來，他不必自己看完全部卡片再判斷。
  const nextKey = MODULE_REGISTRY.find((entry) => CORE_MODULES.has(entry.key)
    && getModuleStatus(lesson, entry).code === 'available')?.key || null;

  const coreGrid = h('div', { class: 'module-grid' });
  const challengeGrid = h('div', { class: 'module-grid' });
  const basicGrid = h('div', { class: 'module-grid' });
  let reviewCard = null;   // 「舊字新詞」卡片，錯題複習要插在它前面
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
        class: `module-card module-card--${status.code}${status.code === 'locked' || status.code === 'coming_soon' || status.code === 'pending_review' ? ' module-card--locked' : ''}${entry.key === nextKey ? ' module-card--next' : ''}`,
        style: styleAttr,
      },
      [
        status.code === 'done'
          ? h('span', { class: 'module-card__stamp', 'aria-hidden': 'true', html: STATUS_ICONS.done })
          : null,
        entry.key === nextKey
          ? h('span', { class: 'module-card__next-badge' }, [
              h('span', { 'aria-hidden': 'true', html: STATUS_ICONS.arrow }),
              h('span', {}, '下一步'),
            ])
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
    card.setAttribute('data-module-key', entry.key);
    if (BASIC_MODULES.includes(entry.key)) {
      if (playable || isPreview()) basicGrid.appendChild(card);
    } else (CORE_MODULES.has(entry.key) ? coreGrid : challengeGrid).appendChild(card);
    if (entry.key === 'review') reviewCard = card;
  }
  // 課文點讀放在所有大項之前：對閱讀困難的學生，先把課文聽過一遍再做練習
  // 才有意義。要不要顯示取決於「這一課有沒有課文」，而那要讀密文檔的 manifest
  // （非同步），所以先插一個空殼，問到答案再填——不讓整頁等網路。
  const quizSlot = h('div', {});

  root.appendChild(readerEntry(lesson));

  // 小考放在所有大項之後：先練完各站，再混在一起考。
  const quiz = quizEntry(lesson);
  if (quiz) quizSlot.appendChild(quiz);

  if (coreGrid.childElementCount) {
    root.appendChild(h('section', { class: 'lesson-module-section', 'aria-labelledby': 'core-modules-heading' }, [
      // 「本課先完成」對學生是非必要資訊（CF 決定移除，減少視覺干擾）。標題保留給
      // 螢幕閱讀器使用（section 仍以 aria-labelledby 指向它），只是視覺上隱藏。
      h('h2', { id: 'core-modules-heading', class: 'lesson-module-section__title visually-hidden' }, '本課先完成'),
      coreGrid,
    ]));
  }
  if (basicGrid.childElementCount) {
    // 照 BASIC_MODULES 的順序排（念讀在前）
    const order = (el) => BASIC_MODULES.indexOf(el.getAttribute?.('data-module-key'));
    [...basicGrid.children].sort((a, b) => order(a) - order(b)).forEach((el) => basicGrid.appendChild(el));
    root.appendChild(h('section', { class: 'lesson-module-section lesson-basic', 'aria-labelledby': 'basic-modules-heading' }, [
      h('div', { class: 'quiz-option-row' }, [
        h('h2', { id: 'basic-modules-heading', class: 'lesson-basic__title' }, '基本練習：先練讀，再練短語'),
        SpeakButton({ text: '基本練習：先練讀，再練短語', label: '聽', variant: 'speak-button--option' }),
      ]),
      basicGrid,
    ]));
  }
  // 錯題複習放在「加練挑戰」裡、舊字新詞之前（CF 2026-10-01 指定）：
  // 兩者都是「回頭複習前面學過的東西」，放在一起學生比較好理解；
  // 錯題是自己錯過的，比舊字新詞更該先做，所以排在它前面。
  // 待複習數＝到期錯題 ＋ 老師要求重寫的句子
  // 朗讀挑戰也放加練挑戰區（CF 指定），和錯題複習、小考同一區。
  // 有沒有課文是非同步才知道的，所以先放空殼再填。
  const reciteSlot = h('div', { class: 'module-grid__cell' });
  hasReading(lesson.lesson_id)
    .then((available) => {
      if (!available) return;
      const summary = reciteSummary(lesson.lesson_id);
      reciteSlot.appendChild(withEntrySpeak(
        h('a', { class: 'entry-card entry-card--recite', href: `#/lesson/${lesson.lesson_id}/recite` }, [
          h('span', { class: 'entry-card__icon', 'aria-hidden': 'true', html: isUnlocked() ? uiIconMarkup('mic') : STATUS_ICONS.lock }),
          h('span', { class: 'entry-card__body' }, [
            h('span', { class: 'entry-card__title' }, '朗讀挑戰'),
            h('span', { class: 'entry-card__desc' },
              isUnlocked() ? '把課文念出來，看看念對幾個字。' : '需要教室密碼才能打開課文。'),
            summary
              ? h('span', { class: 'entry-card__note' }, `念過 ${summary.units} 段，平均 ${summary.averageAccuracy} 分`)
              : null,
          ].filter(Boolean)),
        ]),
      ));
    })
    .catch(() => { /* 讀不到密文檔就不顯示入口 */ });

  // 錯題以「冊」為範圍（同一台平板不同年級共用）；入口只放在課次頁，
  // 不放首頁，免得不同年級的錯題混在一起。
  const mistakes = mistakeEntry(
    lesson.lesson_id,
    dueCount(lesson.volume.code) + redoSentences(lesson.volume.code).length,
  );
  // 加練挑戰的順序（CF 2026-10-02 指定）：
  //   字感訓練 → 其餘大項 → 錯題複習 → 朗讀挑戰
  // 字感訓練排第一是暖身性質的辨識練習，先做再進其他站。
  // 舊字新詞移出加練區，改排在單課小考之後。
  const visualCard = challengeGrid.children.find
    ? challengeGrid.children.find((c) => c.getAttribute?.('data-module-key') === 'visual_search')
    : [...challengeGrid.children].find((c) => c.getAttribute?.('data-module-key') === 'visual_search');
  if (visualCard && challengeGrid.children[0] !== visualCard) {
    challengeGrid.insertBefore(visualCard, challengeGrid.children[0]);
  }
  // 部件拼字改放在字感訓練頁最上方（CF 2026-10-04），課次首頁不再放卡片
  if (reviewCard && reviewCard.parentNode === challengeGrid) challengeGrid.removeChild(reviewCard);
  if (mistakes) challengeGrid.appendChild(mistakes);
  challengeGrid.appendChild(reciteSlot);

  if (challengeGrid.childElementCount) {
    const details = h('details', { class: 'lesson-challenge-group' });
    details.appendChild(h('summary', { class: 'lesson-challenge-group__summary' }, [
      h('span', {}, '加練挑戰'),
      h('span', { class: 'lesson-challenge-group__hint' }, '想多練習時再展開'),
    ]));
    details.appendChild(challengeGrid);
    root.appendChild(details);
  }

  root.appendChild(quizSlot);

  // 舊字新詞排在單課小考之後，並改成和小考一樣的寬版入口卡（CF 指定）：
  // 兩者都是「跨出本課」的收尾活動，格式一致才看得出是同一層級。
  if (reviewCard) {
    const reviewEntryDef = MODULE_REGISTRY.find((m) => m.key === 'review');
    const reviewStatus = getModuleStatus(lesson, reviewEntryDef);
    const playable = reviewStatus.code === 'available' || reviewStatus.code === 'done';
    root.appendChild(withEntrySpeak(h(
      playable ? 'a' : 'div',
      {
        class: `entry-card entry-card--wide entry-card--dashed entry-card--review${playable ? '' : ' entry-card--locked'}`,
        ...(playable ? { href: `#/lesson/${lesson.lesson_id}/module/review` } : {}),
      },
      [
        h('span', { class: 'entry-card__icon', 'aria-hidden': 'true', html: moduleIconMarkup(reviewEntryDef.icon) }),
        h('span', { class: 'entry-card__body' }, [
          h('span', { class: 'entry-card__title' }, reviewEntryDef.label),
          h('span', { class: 'entry-card__desc' }, playable ? reviewEntryDef.description : reviewStatus.text),
        ]),
        playable ? h('span', { class: 'entry-card__arrow', 'aria-hidden': 'true', html: STATUS_ICONS.arrow }) : null,
      ].filter(Boolean),
    )));
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
      slot.appendChild(withEntrySpeak(
        h('a', { class: 'entry-card entry-card--wide entry-card--reader', href: `#/lesson/${lesson.lesson_id}/reader` }, [
          h('span', { class: 'entry-card__icon', 'aria-hidden': 'true', html: unlocked ? uiIconMarkup('book') : STATUS_ICONS.lock }),
          h('span', { class: 'entry-card__body' }, [
            h('span', { class: 'entry-card__title' }, '課文點讀'),
            h(
              'span',
              { class: 'entry-card__desc' },
              unlocked ? '讀字、讀詞或讀句，點一點讀讀看。' : '需要教室密碼才能打開課文。',
            ),
          ]),
          h('span', { class: 'entry-card__arrow', 'aria-hidden': 'true', html: STATUS_ICONS.arrow }),
        ]),
      ));
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

/**
 * 建議學習路徑＋繼續學習（2026-10-04 UX 優化 P0）：
 * 核心四項照建議順序排成一列，做過的打勾、下一個標「→ 現在」，旁邊一個大按鈕直接進去。
 * 只是建議，不鎖：下面的卡片照樣可以任選、跳過。
 */
function learningPath(lesson, coreKeys) {
  const entries = MODULE_REGISTRY.filter((e) => coreKeys.includes(e.key));
  if (entries.length < 2) return null;
  const done = entries.map((e) => getModuleStatus(lesson, e).code === 'done');
  const nextIndex = done.indexOf(false);
  const labelOf = (e) => (lesson.modules[e.key] && lesson.modules[e.key].label) || e.label;
  const left = done.filter((d) => !d).length;
  const goalText = left === 0 ? '核心學習都完成了！可以去加練挑戰。' : `再完成 ${left} 個，就完成本課核心學習。`;
  const steps = h('ol', { class: 'learning-path__steps' }, entries.map((e, i) => {
    const state = done[i] ? 'done' : i === nextIndex ? 'now' : 'todo';
    return h('li', { class: `learning-path__step learning-path__step--${state}` }, [
      h('a', { href: `#/lesson/${lesson.lesson_id}/module/${e.key}`, 'aria-label': `第 ${i + 1} 步，${labelOf(e)}，${state === 'done' ? '做完了' : state === 'now' ? '現在做這個' : '還沒做'}` }, [
        h('span', { class: 'learning-path__num', 'aria-hidden': 'true' }, state === 'done' ? '✓' : String(i + 1)),
        h('span', { class: 'learning-path__icon', 'aria-hidden': 'true', html: moduleIconMarkup(e.icon) }),
        h('span', { class: 'learning-path__label' }, labelOf(e)),
      ]),
    ]);
  }));
  const next = entries[nextIndex];
  return h('section', { class: 'learning-path', 'aria-labelledby': 'learning-path-title' }, [
    h('div', { class: 'quiz-option-row learning-path__head' }, [
      h('h2', { id: 'learning-path-title', class: 'learning-path__title' }, '建議的學習順序'),
      SpeakButton({ text: `建議的學習順序：${entries.map(labelOf).join('、')}。${goalText}`, label: '聽', variant: 'speak-button--option' }),
    ]),
    steps,
    h('p', { class: 'learning-path__goal' }, [
      h('span', { class: 'learning-path__dots', 'aria-hidden': 'true' }, done.map((d) => (d ? '●' : '○')).join(' ')),
      ' ', goalText,
    ]),
    next ? h('a', { class: 'btn btn--primary learning-path__continue', href: `#/lesson/${lesson.lesson_id}/module/${next.key}` }, [
      h('span', {}, `繼續學習：${labelOf(next)}`),
      h('span', { 'aria-hidden': 'true', html: STATUS_ICONS.arrow }),
    ]) : null,
    h('p', { class: 'meta learning-path__note' }, '這是建議的順序，也可以從下面選任何一個。'),
  ].filter(Boolean));
}
