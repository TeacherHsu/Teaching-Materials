import { MODULE_COLOR_KEYS, moduleColorVars } from '../activities/moduleRegistry.js';
import { h } from '../utils/dom.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { getLastLesson } from '../utils/deviceSettings.js';

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
  // 繼續學習：只顯示這個年級（＋學生代碼）的上次進度
  const last = getLastLesson(grade.grade);
  if (last?.lessonId) {
    root.appendChild(h('div', { class: 'continue-card quiz-option-row' }, [
      h('a', { class: 'btn btn--primary continue-card__btn', href: `#/lesson/${last.lessonId}` }, `繼續學習：${last.label}`),
      SpeakButton({ text: `繼續學習：${last.label}`, label: '聽', variant: 'speak-button--option' }),
    ]));
  }
  const lessons = [];
  for (const volume of grade.volumes) {
    for (const unit of volume.units) {
      for (const lesson of unit.lessons) {
        // 單元名稱是 TODO 或只是「N 年級上學期國語課程」這種樣板字時不顯示
        const unitLabel = unit.title.startsWith('TODO') || /國語課程$/.test(unit.title)
          ? '' : unit.title;
        const cardLabel = `第 ${lesson.lesson_no} 課：${lesson.title}，${volume.label}`;
        const titleText = `第 ${lesson.lesson_no} 課：${lesson.title}`;
        // 課次卡片沿用這一冊的顏色與課號徽章。原本全部純白，和站上其他
        // 頁面的卡片語彙不一致，掃視時也分不出第幾課。
        const colorKey = MODULE_COLOR_KEYS[(lesson.lesson_no - 1) % MODULE_COLOR_KEYS.length];
        const link = h('a', {
          class: 'nav-card nav-card--lesson',
          href: `#/lesson/${lesson.lesson_id}`,
          'aria-label': cardLabel,
          style: Object.entries(moduleColorVars(colorKey)).map(([k, v]) => `${k}:${v}`).join(';'),
        }, [
          h('span', { class: 'nav-card__no', 'aria-hidden': 'true' }, String(lesson.lesson_no)),
          // 卡片上不再重複冊別（頁面標題已經寫了「康軒四上」），那行比課名
          // 還長、又每張都一樣，只會搶走視線。單元名稱有意義時才顯示。
          h('div', { class: 'nav-card__body' }, [
            h('div', { class: 'nav-card__title' }, lesson.title),
            unitLabel ? h('div', { class: 'nav-card__meta' }, unitLabel) : null,
          ].filter(Boolean)),
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

  // 跨課統整複習（course-index 的 volume.reviews）：放在對應課次區塊的最後，
  // 之後同範圍的統整教材只要在資料裡加一筆，不必改程式。
  const makeReview = (start, end) => {
    const items = grade.volumes.flatMap((v) => (v.reviews || [])
      .filter((r) => r.from === start && r.to === end)
      .flatMap((r) => r.items));
    if (!items.length) return null;
    const heading = `第 ${start}～${end} 課綜合複習`;
    const grid = h('div', { class: 'card-grid' });
    for (const item of items) {
      const speakText = item.description ? `${item.title}：${item.description}` : item.title;
      grid.appendChild(h('div', { class: 'quiz-option-row' }, [
        h('a', {
          class: 'nav-card nav-card--review',
          href: item.url,
          'aria-label': `${heading}：${item.title}`,
        }, [
          h('span', { class: 'nav-card__no', 'aria-hidden': 'true' }, '★'),
          h('div', { class: 'nav-card__body' }, [
            h('div', { class: 'nav-card__title' }, item.title),
            item.description ? h('div', { class: 'nav-card__meta' }, item.description) : null,
          ].filter(Boolean)),
        ]),
        SpeakButton({ text: speakText, label: '聽', variant: 'speak-button--option' }),
      ]));
    }
    return h('section', { class: 'course-review', 'aria-label': heading }, [
      h('div', { class: 'quiz-option-row course-review__head' }, [
        h('h2', { class: 'course-review__title' }, heading),
        SpeakButton({ text: heading, label: '聽', variant: 'speak-button--option' }),
      ]),
      grid,
    ]);
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
      const review = makeReview(start, end);
      if (review) details.appendChild(review);
      root.appendChild(details);
    }
    const otherLessons = lessons.filter(({ lesson }) => lesson.lesson_no < 1 || lesson.lesson_no > 12);
    if (otherLessons.length) root.appendChild(makeGrid(otherLessons));
  } else {
    root.appendChild(makeGrid(lessons));
    // 一年級不分組：綜合複習接在課次後面
    for (const r of grade.volumes.flatMap((v) => v.reviews || [])) {
      const review = makeReview(r.from, r.to);
      if (review) root.appendChild(review);
    }
  }
  return root;
}
