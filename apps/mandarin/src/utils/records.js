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
// 本檔不存任何學生姓名，只存學生代碼（老師自訂、英數 8 碼內）、課次代號、大項代號與作答結果。
import { getStudentCode, getScaffoldLevelKey } from './deviceSettings.js';
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
export function recordAttempt(lessonId, moduleKey, session, at, student = getStudentCode()) {
  const accuracy = accuracyOf(session);
  if (accuracy === null) return { accuracy: null, saved: false };
  const all = read();
  const lesson = all[lessonId] || (all[lessonId] = {});
  const list = lesson[moduleKey] || (lesson[moduleKey] = []);
  list.push({
    at: at || new Date().toISOString(),
    student: student || '',
    // 作答當時的鷹架層：升降級建議只能拿同一層的資料比（不同層選項數、提示都不同）
    level: safeLevel(),
    total: session.total,
    firstTry: session.firstTryCount,
    hinted: session.hintedCount ?? Math.max(0, session.total - session.firstTryCount - session.revealedCount),
    revealed: session.revealedCount,
    accuracy: Math.round(accuracy * 100) / 100,
  });
  // 每個學生各留最近 MAX 筆：多人共用一台時，不會因為別人練得多就把你的紀錄擠掉
  const mine = list.filter((a) => (a.student || '') === (student || ''));
  if (mine.length > MAX_ATTEMPTS_PER_MODULE) list.splice(list.indexOf(mine[0]), 1);
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
      // 同一台載具會給好幾個學生用：依學生代碼分開算（沒填代碼的歸在空白）
      const byStudent = new Map();
      for (const a of list) {
        const key = a.student || '';
        if (!byStudent.has(key)) byStudent.set(key, []);
        byStudent.get(key).push(a);
      }
      for (const [student, attempts] of byStudent) {
        const latest = attempts[attempts.length - 1];
        const best = attempts.reduce((m, a) => Math.max(m, a.accuracy || 0), 0);
        rows.push({ student, lessonId, moduleKey, attempts: attempts.length, latest, best });
      }
    }
  }
  rows.sort((a, b) => String(b.latest.at).localeCompare(String(a.latest.at)));
  return rows;
}

/** 匯出成可貼進試算表的 TSV（不含個人資料）。 */
export function recordsAsTsv(rows, deviceLabel = '') {
  const header = ['載具', '學生代碼', '課次', '大項', '最近日期', '最近正確率', '最佳正確率', '練習次數', '最近題數', '獨立答對', '提示後答對', '揭曉答案'].join('\t');
  const lines = rows.map((r) => [
    deviceLabel,
    r.student || '',
    r.lessonId,
    r.moduleKey,
    String(r.latest.at).slice(0, 10),
    `${Math.round((r.latest.accuracy || 0) * 100)}%`,
    `${Math.round(r.best * 100)}%`,
    r.attempts,
    r.latest.total ?? '',
    r.latest.firstTry ?? '',
    r.latest.hinted ?? '',
    r.latest.revealed ?? '',
  ].join('\t'));
  return [header, ...lines].join('\n');
}

export function clearRecords() {
  return write({});
}

/** 還沒同步過的紀錄（syncedAt 未設定）。 */
export function unsyncedAttempts() {
  const all = read();
  const out = [];
  for (const [lessonId, modules] of Object.entries(all)) {
    for (const [moduleKey, list] of Object.entries(modules)) {
      (Array.isArray(list) ? list : []).forEach((a, index) => {
        if (!a.syncedAt) out.push({ lessonId, moduleKey, index, ...a });
      });
    }
  }
  return out.sort((a, b) => String(a.at).localeCompare(String(b.at)));
}

function markSynced(items, syncedAt) {
  const all = read();
  for (const it of items) {
    const list = all[it.lessonId] && all[it.lessonId][it.moduleKey];
    if (Array.isArray(list) && list[it.index]) list[it.index].syncedAt = syncedAt;
  }
  return write(all);
}

/**
 * 把還沒送出的紀錄送到 Google 試算表（Apps Script 網頁應用程式）。
 *
 * 刻意設計成「教師按一次才送」而不是即時同步：課堂網路不可靠，即時同步
 * 失敗會是靜默的，教師不會知道哪幾筆沒上去。手動同步則成功與失敗都看得見。
 * 送出成功才標記 syncedAt，所以重複按不會重複寫入。
 *
 * 用 text/plain 送出是刻意的：這樣屬於 CORS 的 simple request，不會觸發
 * preflight（Apps Script 不處理 OPTIONS，會因此失敗）。
 *
 * @returns {Promise<{ok:boolean, sent:number, message:string}>}
 */
export async function syncRecords(url, deviceLabel, fetchImpl = globalThis.fetch) {
  if (!url) return { ok: false, sent: 0, message: '尚未設定試算表網址。' };
  const pending = unsyncedAttempts();
  if (pending.length === 0) return { ok: true, sent: 0, message: '沒有新的紀錄需要同步。' };

  const rows = pending.map((a) => ({
    device: deviceLabel || '',
    student: a.student || '',
    lessonId: a.lessonId,
    moduleKey: a.moduleKey,
    at: a.at,
    accuracy: a.accuracy,
    total: a.total,
    firstTry: a.firstTry,
    hinted: a.hinted,
    revealed: a.revealed,
  }));

  try {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ rows }),
    });
    if (!res || !res.ok) {
      return { ok: false, sent: 0, message: `試算表沒有收到（HTTP ${res ? res.status : '無回應'}）。請確認網址與部署權限。` };
    }
    markSynced(pending, new Date().toISOString());
    return { ok: true, sent: rows.length, message: `已送出 ${rows.length} 筆紀錄。` };
  } catch (err) {
    return { ok: false, sent: 0, message: `連線失敗：${err && err.message ? err.message : '請檢查網路'}。紀錄仍保留在這台載具。` };
  }
}

/**
 * 依「獨立答對率」給老師升降級建議（參考站的判準）：
 *   低於 5 成 → 降一級；5～8 成 → 維持；8 成以上 → 升一級。
 * 「獨立答對」＝沒用提示、第一次就答對（ChoiceQuiz 用過「看提示」就不算第一次答對）。
 *
 * 只算這個年級的課次（同一台平板會給不同年級用），取最近 days 天內的作答；
 * 題數太少時不給建議，免得兩三題的運氣影響判斷。
 *
 * @param {string} grade 年級（'2'、'6'……），對應課次代號第 6 碼（115AG6H11 → 6）
 * @param {string} levelKey 目前等級
 * @returns {{items:number, rate:number|null, advice:'up'|'down'|'stay'|null, minItems:number}}
 */
function safeLevel() {
  try { return getScaffoldLevelKey(); } catch { return ''; }
}

export function levelAdvice(grade, levelKey, { days = 21, minItems = 20, now = Date.now(), student = getStudentCode() } = {}) {
  const since = now - days * 24 * 60 * 60 * 1000;
  let total = 0;
  let firstTry = 0;
  for (const [lessonId, modules] of Object.entries(read())) {
    if (String(lessonId).charAt(5) !== String(grade)) continue;
    for (const list of Object.values(modules)) {
      if (!Array.isArray(list)) continue;
      for (const attempt of list) {
        if (Date.parse(attempt.at) < since) continue;
        // 只算「目前這位學生代碼」在「目前這一層」的作答（2026-10-03 第二版審查：
        // 原本合併同年級所有人、所有層，共用平板時建議不能代表任何一個學生）
        if ((attempt.student || '') !== (student || '')) continue;
        if (attempt.level && attempt.level !== levelKey) continue;
        total += attempt.total || 0;
        firstTry += attempt.firstTry || 0;
      }
    }
  }
  if (total < minItems) return { items: total, rate: null, advice: null, minItems };
  const rate = firstTry / total;
  let advice = 'stay';
  if (rate < 0.5 && levelKey !== 'support') advice = 'down';
  if (rate >= 0.8 && levelKey !== 'challenge') advice = 'up';
  return { items: total, rate, advice, minItems };
}
