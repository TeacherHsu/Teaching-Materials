// 作答紀錄（存在這台載具，供教師當平時成績參考）。
//
// 「正確率」的定義：**第一次作答就答對的比率**（firstTryCount / total）。
//
// 這個站的互動是「答錯給提示、再答錯揭曉」，學生最後一定會通過，所以
// 「最終答對率」永遠是 100%，沒有鑑別度。有診斷價值的是第一次的判斷。
//
// 這和星星是**刻意分開**的兩套訊號：
//   星星（學生看）  — 精熟導向，用提示不扣分，目的是讓孩子願意用鷹架。
//   正確率（教師看）— 診斷用，記錄第一次判斷的正確比例。
// 兩者混在一起就會回到「用提示要扣分」的老問題。
//
// 本檔不存任何學生姓名或個人資料，只存課次代號、大項代號與作答結果。
const KEY = 'mandarin:records:v1';
const MAX_ATTEMPTS_PER_MODULE = 20;

function read() {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function write(next) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

/** @returns {number|null} 第一次就答對的比率（0–1）；沒有可判定題目時回 null。 */
export function accuracyOf({ total, firstTryCount }) {
  if (!total || total <= 0) return null;
  return Math.max(0, Math.min(1, firstTryCount / total));
}

/**
 * 記一次作答。
 * @param {string} lessonId
 * @param {string} moduleKey
 * @param {{total:number, firstTryCount:number, revealedCount:number}} session
 * @param {string} [at] ISO 時間字串，預設為現在（測試可注入固定值）
 * @returns {{accuracy:number|null, saved:boolean}}
 */
export function recordAttempt(lessonId, moduleKey, session, at) {
  const accuracy = accuracyOf(session);
  if (accuracy === null) return { accuracy: null, saved: false };
  const all = read();
  const lesson = all[lessonId] || (all[lessonId] = {});
  const list = lesson[moduleKey] || (lesson[moduleKey] = []);
  list.push({
    at: at || new Date().toISOString(),
    total: session.total,
    firstTry: session.firstTryCount,
    revealed: session.revealedCount,
    accuracy: Math.round(accuracy * 100) / 100,
  });
  if (list.length > MAX_ATTEMPTS_PER_MODULE) list.splice(0, list.length - MAX_ATTEMPTS_PER_MODULE);
  return { accuracy, saved: write(all) };
}

/**
 * 攤平成一列一筆，供教師檢視／匯出。最近的排前面。
 * @returns {Array<{lessonId:string, moduleKey:string, attempts:number, latest:object, best:number}>}
 */
export function listRecords() {
  const all = read();
  const rows = [];
  for (const [lessonId, modules] of Object.entries(all)) {
    for (const [moduleKey, list] of Object.entries(modules)) {
      if (!Array.isArray(list) || list.length === 0) continue;
      const latest = list[list.length - 1];
      const best = list.reduce((m, a) => Math.max(m, a.accuracy || 0), 0);
      rows.push({ lessonId, moduleKey, attempts: list.length, latest, best });
    }
  }
  rows.sort((a, b) => String(b.latest.at).localeCompare(String(a.latest.at)));
  return rows;
}

/** 匯出成可貼進試算表的 TSV（不含個人資料）。 */
export function recordsAsTsv(rows, deviceLabel = '') {
  const header = ['載具', '課次', '大項', '最近日期', '最近正確率', '最佳正確率', '練習次數'].join('\t');
  const lines = rows.map((r) => [
    deviceLabel,
    r.lessonId,
    r.moduleKey,
    String(r.latest.at).slice(0, 10),
    `${Math.round((r.latest.accuracy || 0) * 100)}%`,
    `${Math.round(r.best * 100)}%`,
    r.attempts,
  ].join('\t'));
  return [header, ...lines].join('\n');
}

export function clearRecords() {
  return write({});
}
