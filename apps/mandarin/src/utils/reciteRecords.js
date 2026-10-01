// 朗讀挑戰的成績（存在這台載具）。
//
// ── 只存分數，不存辨識出來的文字 ──────────────────────
// 語音辨識的結果可能夾帶學生的自言自語，和 P1-E 的造句同一個理由：
// 可能包含可識別的個人資訊。所以這裡只存
//   每一段的最高正確率、每分鐘字數、字數
// 不存逐字判定，也不存辨識文字。
//
// 「最高分」而不是「最近一次」：朗讀要讓學生願意一直重念，
// 記最高分才不會因為重念一次失常就把紀錄弄壞。
const KEY = 'mandarin:recite:v1';

function read() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function write(data) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/**
 * 記一次朗讀。只有比之前好才更新正確率；每分鐘字數跟著最高分那一次走，
 * 這樣「比上次快／慢」比較的才是同一個水準下的速度。
 * @param {string} lessonId
 * @param {number} unitIndex 第幾句／第幾段
 * @param {{accuracy:number, charsPerMinute:number|null, total:number}} result
 */
export function saveRecite(lessonId, unitIndex, result) {
  if (!lessonId || !Number.isInteger(unitIndex) || unitIndex < 0) return false;
  const all = read();
  const lesson = all[lessonId] || (all[lessonId] = {});
  const key = String(unitIndex);
  const previous = lesson[key];
  const accuracy = Math.max(0, Math.min(100, Math.round(result.accuracy || 0)));
  if (!previous || accuracy >= previous.accuracy) {
    lesson[key] = {
      accuracy,
      charsPerMinute: result.charsPerMinute || null,
      total: result.total || 0,
      attempts: (previous ? previous.attempts : 0) + 1,
    };
  } else {
    previous.attempts += 1;
  }
  return write(all);
}

/** 這一句／這一段的最高分紀錄；沒念過回 null。 */
export function bestRecite(lessonId, unitIndex) {
  const lesson = read()[lessonId];
  if (!lesson) return null;
  return lesson[String(unitIndex)] || null;
}

/**
 * 整課的摘要，給教師頁用。
 * @returns {{units:number, attempts:number, averageAccuracy:number|null,
 *            averageCharsPerMinute:number|null}|null}
 */
export function reciteSummary(lessonId) {
  const lesson = read()[lessonId];
  if (!lesson) return null;
  const list = Object.values(lesson);
  if (!list.length) return null;
  const speeds = list.map((r) => r.charsPerMinute).filter((n) => typeof n === 'number' && n > 0);
  return {
    units: list.length,
    attempts: list.reduce((n, r) => n + (r.attempts || 0), 0),
    averageAccuracy: Math.round(list.reduce((n, r) => n + r.accuracy, 0) / list.length),
    averageCharsPerMinute: speeds.length
      ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length)
      : null,
  };
}

/** 有朗讀紀錄的課次。 */
export function reciteLessons() {
  return Object.keys(read());
}

export function clearRecite() {
  return write({});
}
