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

/**
 * 星星（1–3）以「最佳成績」記錄，重玩只會提高、不會累加，避免刷星。
 * 沿用 saveModuleComplete 同一份 progress 物件（同一個 key：lessonId），
 * 只是在 progress[moduleKey] 上多存一個 stars 欄位，不另起一套 storage key。
 * @returns {{stars:number, isNewRecord:boolean, saved:boolean}}
 */
export function saveModuleStars(lessonId, moduleKey, stars) {
  const safeStars = Math.max(0, Math.min(3, Math.round(stars) || 0));
  try {
    const progress = loadProgress(lessonId);
    const prevStars = (progress[moduleKey] && progress[moduleKey].stars) || 0;
    const bestStars = Math.max(prevStars, safeStars);
    const isNewRecord = safeStars > prevStars;
    progress[moduleKey] = {
      ...(progress[moduleKey] || {}),
      completed: true,
      at: new Date().toISOString(),
      stars: bestStars,
    };
    window.localStorage.setItem(PREFIX + lessonId, JSON.stringify(progress));
    return { stars: bestStars, isNewRecord, saved: true };
  } catch (e) {
    // localStorage 不可用：不影響操作，回傳「這次得到的星」供畫面顯示，但不算新紀錄
    return { stars: safeStars, isNewRecord: false, saved: false };
  }
}

export function getModuleStars(lessonId, moduleKey) {
  const progress = loadProgress(lessonId);
  return (progress[moduleKey] && progress[moduleKey].stars) || 0;
}

/** 整課累計星星：對 moduleKeys（通常是可開始的大項 key 清單）加總各自最佳星數。 */
export function getLessonStars(lessonId, moduleKeys) {
  return moduleKeys.reduce((sum, key) => sum + getModuleStars(lessonId, key), 0);
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
