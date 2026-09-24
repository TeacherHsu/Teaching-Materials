// localStorage 包裝：所有讀寫都要 try/catch（無痕模式、儲存空間滿都可能丟例外）。

const PREFIX = 'mandarin-lesson-site:';

export function loadProgress(lessonId) {
  try {
    const raw = window.localStorage.getItem(PREFIX + lessonId);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveModuleComplete(lessonId, moduleKey) {
  try {
    const progress = loadProgress(lessonId);
    progress[moduleKey] = { completed: true, at: new Date().toISOString() };
    window.localStorage.setItem(PREFIX + lessonId, JSON.stringify(progress));
    return true;
  } catch (e) {
    return false;
  }
}

export function isModuleComplete(lessonId, moduleKey) {
  const progress = loadProgress(lessonId);
  return Boolean(progress[moduleKey] && progress[moduleKey].completed);
}

// 待審頁（#/review/<lesson_id>）審核狀態暫存：純本機草稿，不代表已寫回
// lesson JSON（寫回要靠「下載審核結果 JSON」＋ tools/dabutie/apply_review.py）。
const REVIEW_PREFIX = 'mandarin-lesson-site:review:';

export function loadReviewDecisions(lessonId) {
  try {
    const raw = window.localStorage.getItem(REVIEW_PREFIX + lessonId);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveReviewDecisions(lessonId, decisions) {
  try {
    window.localStorage.setItem(REVIEW_PREFIX + lessonId, JSON.stringify(decisions));
    return true;
  } catch (e) {
    return false;
  }
}
