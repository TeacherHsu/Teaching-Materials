import { route, notFoundRoute, startRouter } from './router/router.js';
import { unlockFromStore } from './utils/classroomKey.js';
import { HomePage } from './pages/HomePage.js';
import { GradePage } from './pages/GradePage.js';
import { LessonDashboard } from './pages/LessonDashboard.js';
import { ModulePage } from './pages/ModulePage.js';
import { PendingReviewPage } from './pages/PendingReviewPage.js';
import { ReaderPage } from './pages/ReaderPage.js';
import { MistakePage } from './pages/MistakePage.js';
import { QuizPage } from './pages/QuizPage.js';
import { RecitePage } from './pages/RecitePage.js';
import { FixturesPage } from './pages/FixturesPage.js';
import { h, clear } from './utils/dom.js';
import { isPreview } from './utils/preview.js';
import { VoiceWarningBanner } from './components/VoiceWarningBanner.js';
import { isMuted, toggleMute } from './utils/celebrate.js';
import { SiteFooter } from './components/SiteFooter.js';

// import.meta.env.BASE_URL 由 vite.config.js 的 base:'./' 決定，
// 開發模式為 '/'，build 後在 index.html 中改寫為相對路徑；
// fetch 資料一律接在 BASE_URL 後面，不可寫死 '/data/...'。
const BASE = import.meta.env.BASE_URL;

const app = document.getElementById('app');

let courseIndexCache = null;
async function loadCourseIndex() {
  if (courseIndexCache) return courseIndexCache;
  const res = await fetch(`${BASE}data/course-index.json`, { cache: 'no-cache' });
  courseIndexCache = await res.json();
  return courseIndexCache;
}

function findLessonMeta(courseIndex, lessonId) {
  for (const grade of courseIndex.grades) {
    for (const volume of grade.volumes) {
      for (const unit of volume.units) {
        for (const lesson of unit.lessons) {
          if (lesson.lesson_id === lessonId) return lesson;
        }
      }
    }
  }
  return null;
}

// 生產 build 會把 data/<code>/lessonNN.json 過濾成只剩 approved/ready 內容（見
// scripts/filter-build-data.mjs），並把未過濾的完整版另存一份到
// data/_preview/<code>/lessonNN.json。?preview=1 時優先讀 _preview 版本
// （才看得到 draft 待審內容），讀不到（例如 dev server 未跑過 build）就
// 退回正常路徑——dev 模式下 public/data 本來就是未過濾的完整版。
async function loadLesson(lessonId) {
  const courseIndex = await loadCourseIndex();
  const meta = findLessonMeta(courseIndex, lessonId);
  if (!meta) return null;

  if (isPreview()) {
    const previewPath = meta.data.replace(/^data\//, 'data/_preview/');
    const previewRes = await fetch(`${BASE}${previewPath}`, { cache: 'no-cache' });
    if (previewRes.ok) return previewRes.json();
  }

  const res = await fetch(`${BASE}${meta.data}`, { cache: 'no-cache' });
  if (!res.ok) return null;
  return res.json();
}

// 教師設定的齒輪：固定在每一頁右上角（CF 指定統一入口）。
// 進去還有一道兩位數 × 一位數的乘法擋著（utils/teacherGate.js），
// 所以放在顯眼處不要緊——擋的是順手亂點，不是資訊安全。
const GEAR_ICON = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

function renderTeacherButton() {
  return h('a', {
    class: 'app-header__teacher',
    href: '#/teacher',
    'aria-label': '教師設定',
    title: '教師設定',
    html: GEAR_ICON,
  });
}

function renderHeader() {
  const header = h('header', { class: 'app-header' }, [
    h('a', { href: '#/', class: 'app-header__brand' }, '國語課文樂園'),
    renderMuteButton(),
    renderTeacherButton(),
  ]);
  return header;
}

const MUTE_ICON = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 5V4L8 9H4z"/><path d="M16.5 12c0-1.77-.77-3.29-2-4.24v8.48c1.23-.95 2-2.47 2-4.24z"/><path d="M19.5 6a9.5 9.5 0 0 1 0 12"/></svg>`;
const MUTED_ICON = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 5V4L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>`;

/** 音效靜音開關：答對／完成音效專用，不影響 TTS 朗讀。狀態存 localStorage，
 * 純更新按鈕本身圖示／aria-label，不重新整個頁面。 */
function renderMuteButton() {
  const btn = h('button', {
    class: 'app-header__mute',
    type: 'button',
    'aria-pressed': String(isMuted()),
    'aria-label': isMuted() ? '目前靜音，點一下開啟音效' : '目前有音效，點一下靜音',
    html: isMuted() ? MUTED_ICON : MUTE_ICON,
  });
  btn.addEventListener('click', () => {
    const muted = toggleMute();
    btn.setAttribute('aria-pressed', String(muted));
    btn.setAttribute('aria-label', muted ? '目前靜音，點一下開啟音效' : '目前有音效，點一下靜音');
    btn.innerHTML = muted ? MUTED_ICON : MUTE_ICON;
  });
  return btn;
}

function mount(pageEl) {
  clear(app);
  app.appendChild(renderHeader());
  app.appendChild(VoiceWarningBanner());
  app.appendChild(pageEl);
  app.appendChild(SiteFooter());
}

route(/^\/$/, async () => {
  const courseIndex = await loadCourseIndex();
  mount(HomePage(courseIndex));
});

route(/^\/grade\/(?<grade>[^/]+)$/, async ({ grade }) => {
  const courseIndex = await loadCourseIndex();
  mount(GradePage(courseIndex, grade));
});

route(/^\/lesson\/(?<lessonId>[^/]+)$/, async ({ lessonId }) => {
  const lesson = await loadLesson(lessonId);
  if (!lesson) {
    mount(h('div', { class: 'container' }, h('div', { class: 'missing-content' }, '找不到這一課的資料。')));
    return;
  }
  mount(LessonDashboard(lesson));
});

route(/^\/mistakes$/, async () => {
  mount(MistakePage(null));
});

route(/^\/mistakes\/(?<lessonId>[^/]+)$/, async ({ lessonId }) => {
  const lesson = await loadLesson(lessonId);
  if (!lesson) {
    mount(h('div', { class: 'container' }, h('div', { class: 'missing-content' }, '找不到這一課的資料。')));
    return;
  }
  mount(MistakePage(lesson));
});

route(/^\/lesson\/(?<lessonId>[^/]+)\/quiz$/, async ({ lessonId }) => {
  const lesson = await loadLesson(lessonId);
  if (!lesson) {
    mount(h('div', { class: 'container' }, h('div', { class: 'missing-content' }, '找不到這一課的資料。')));
    return;
  }
  mount(QuizPage(lesson));
});

route(/^\/lesson\/(?<lessonId>[^/]+)\/recite$/, async ({ lessonId }) => {
  const lesson = await loadLesson(lessonId);
  if (!lesson) {
    mount(h('div', { class: 'container' }, h('div', { class: 'missing-content' }, '找不到這一課的資料。')));
    return;
  }
  mount(RecitePage(lesson));
});

route(/^\/lesson\/(?<lessonId>[^/]+)\/reader$/, async ({ lessonId }) => {
  const lesson = await loadLesson(lessonId);
  if (!lesson) {
    mount(h('div', { class: 'container' }, h('div', { class: 'missing-content' }, '找不到這一課的資料。')));
    return;
  }
  mount(ReaderPage(lesson));
});

route(/^\/lesson\/(?<lessonId>[^/]+)\/module\/(?<moduleKey>[^/]+)$/, async ({ lessonId, moduleKey }) => {
  const lesson = await loadLesson(lessonId);
  if (!lesson) {
    mount(h('div', { class: 'container' }, h('div', { class: 'missing-content' }, '找不到這一課的資料。')));
    return;
  }
  mount(ModulePage(lesson, moduleKey));
});

route(/^\/review\/(?<lessonId>[^/]+)$/, async ({ lessonId }) => {
  if (!isPreview()) {
    mount(
      h('div', { class: 'container' }, h('div', { class: 'missing-content' }, '此頁僅供教師預覽（網址需帶 ?preview=1）。')),
    );
    return;
  }
  const lesson = await loadLesson(lessonId);
  if (!lesson) {
    mount(h('div', { class: 'container' }, h('div', { class: 'missing-content' }, '找不到這一課的資料。')));
    return;
  }
  mount(PendingReviewPage(lesson));
});

route(/^\/lesson\/(?<lessonId>[^/]+)\/char\/(?<char>[^/]+)$/, async ({ lessonId, char }) => {
  const lesson = await loadLesson(lessonId);
  if (!lesson) {
    mount(h('div', { class: 'container' }, h('div', { class: 'missing-content' }, '找不到這一課的資料。')));
    return;
  }
  const { CharacterStoryPage } = await import('./pages/CharacterStoryPage.js');
  mount(CharacterStoryPage(lesson, decodeURIComponent(char)));
});

route(/^\/teacher$/, async () => {
  const { TeacherPage } = await import('./pages/TeacherPage.js');
  mount(TeacherPage());
});

route(/^\/fixtures$/, async () => {
  const res = await fetch(`${BASE}data/_fixtures/component-fixtures.json`, { cache: 'no-cache' });
  const fixtures = await res.json();
  mount(FixturesPage(fixtures));
});

notFoundRoute(() => {
  mount(
    h('div', { class: 'container' }, [
      h('h1', {}, '找不到這個頁面'),
      h('a', { class: 'btn', href: '#/' }, '回首頁'),
    ]),
  );
});

// 開站時先用這台載具記住的教室金鑰試解一次課文，解開了課次首頁才會
// 顯示「課文點讀」入口。失敗（沒存過、金鑰過期）不影響其他功能，所以
// 不等它完成就啟動路由；解完之後重跑一次目前的路由讓入口出現。
unlockFromStore()
  .then((unlocked) => {
    if (unlocked) window.dispatchEvent(new HashChangeEvent('hashchange'));
  })
  .catch(() => {
    /* 解不開就是沒解鎖，學生仍可做其他大項 */
  });

startRouter();
