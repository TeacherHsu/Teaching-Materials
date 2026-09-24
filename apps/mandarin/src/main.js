import { route, notFoundRoute, startRouter } from './router/router.js';
import { HomePage } from './pages/HomePage.js';
import { GradePage } from './pages/GradePage.js';
import { LessonDashboard } from './pages/LessonDashboard.js';
import { ModulePage } from './pages/ModulePage.js';
import { FixturesPage } from './pages/FixturesPage.js';
import { h, clear } from './utils/dom.js';
import { isPreview } from './utils/preview.js';

// import.meta.env.BASE_URL 由 vite.config.js 的 base:'./' 決定，
// 開發模式為 '/'，build 後在 index.html 中改寫為相對路徑；
// fetch 資料一律接在 BASE_URL 後面，不可寫死 '/data/...'。
const BASE = import.meta.env.BASE_URL;

const app = document.getElementById('app');

let courseIndexCache = null;
async function loadCourseIndex() {
  if (courseIndexCache) return courseIndexCache;
  const res = await fetch(`${BASE}data/course-index.json`);
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
    const previewRes = await fetch(`${BASE}${previewPath}`);
    if (previewRes.ok) return previewRes.json();
  }

  const res = await fetch(`${BASE}${meta.data}`);
  if (!res.ok) return null;
  return res.json();
}

function renderHeader() {
  const header = h('header', { class: 'app-header' }, [
    h('a', { href: '#/', class: 'app-header__brand' }, '國語課文樂園'),
  ]);
  return header;
}

function mount(pageEl) {
  clear(app);
  app.appendChild(renderHeader());
  app.appendChild(pageEl);
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

route(/^\/lesson\/(?<lessonId>[^/]+)\/module\/(?<moduleKey>[^/]+)$/, async ({ lessonId, moduleKey }) => {
  const lesson = await loadLesson(lessonId);
  if (!lesson) {
    mount(h('div', { class: 'container' }, h('div', { class: 'missing-content' }, '找不到這一課的資料。')));
    return;
  }
  mount(ModulePage(lesson, moduleKey));
});

route(/^\/fixtures$/, async () => {
  const res = await fetch(`${BASE}data/_fixtures/component-fixtures.json`);
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

startRouter();
