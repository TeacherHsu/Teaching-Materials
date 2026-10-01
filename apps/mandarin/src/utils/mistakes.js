// 錯題盒：把「第一次沒答對」的題目收起來，隔幾天再考一次，連續答對才讓它消失。
//
// 為什麼要有這個：我們的學生最大的問題不是當下不會，是「上週會、這週忘」。
// 站上原本的流程是答錯 → 給提示 → 再答錯 → 揭曉 → 當場過關 → 題目消失，
// 沒有任何機制把它找回來。錯題盒補的就是這一段。
//
// 間隔用 Leitner 盒：答對往上一格、答錯歸零。格子對應的天數是
// BOX_DAYS，連續答對 BOX_DAYS.length 次就算學會，從盒子裡拿掉。
//
// 到期時間刻意**提早一小時**：排 1 天後其實是 23 小時後，這樣「昨天上課
// 答錯的題目，今天同一節課就會出現」，而不是要等到放學才到期。
//
// 存的是**題目資料**（stem／options／answer），不是畫面 HTML。參考站存
// innerHTML 是為了讓錯題不依賴原模組還在不在，但我們的題目本來就是純資料，
// 存資料更乾淨，也不會把當時的樣式凍進 localStorage。代價是像「修辭小偵探」
// 那種有 DOM 題幹（stemContent）的題目，重練時會退成純文字題幹——可以接受，
// 因為重練的重點是判斷本身，不是當初的排版。
//
// 本檔不存任何學生姓名或個人資料，只存課次代號、大項代號與題目內容。
const KEY = 'mandarin:mistakes:v1';

/** 第 n 次連續答對之後，隔幾天再出現。長度即「連對幾次算學會」。 */
export const BOX_DAYS = [0, 1, 3, 7];
const DAY_MS = 86400000;
const EARLY_MS = 3600000; // 提早一小時到期，理由見檔頭
const MAX_ITEMS = 300;

function read() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false; // 私密瀏覽等情況：不影響當下作答
  }
}

/** 題目的穩定代號：同一課同一大項、同樣的題幹與答案視為同一題。 */
function mistakeId(lessonId, moduleKey, item) {
  return [lessonId, moduleKey, item.answer, String(item.stem || '').slice(0, 80)].join('|');
}

/**
 * 只留可序列化的欄位。stemContent／extra 可能是 DOM 元素，一定要排除，
 * 否則 JSON.stringify 會丟掉它們或拋錯。
 */
function snapshot(item) {
  const hints = Array.isArray(item.hints) ? item.hints.filter((x) => typeof x === 'string') : [];
  return {
    stem: String(item.stem || ''),
    options: item.options.map(String),
    answer: String(item.answer),
    explanation: typeof item.explanation === 'string' ? item.explanation : '',
    hints: hints.length ? hints : undefined,
    hint: typeof item.hint === 'string' ? item.hint : undefined,
    readAllStem: typeof item.readAllStem === 'string' ? item.readAllStem : undefined,
  };
}

/** 這一題是不是可以收進錯題盒（沒有選項或答案的題型就不收）。 */
function storable(item) {
  return Boolean(item && Array.isArray(item.options) && item.options.length >= 2 && item.answer);
}

// ── 作答情境 ──────────────────────────────────────
// 和 scoreSession.js 同一個模式：單人、單分頁的靜態站，用 module 單例即可，
// 不必把 lessonId／moduleKey 一路傳進每個活動檔案。
let context = null;

/** ModulePage 在建立大項活動前呼叫。 */
export function startMistakeContext(lessonId, moduleKey) {
  context = lessonId && moduleKey ? { lessonId, moduleKey } : null;
}

export function endMistakeContext() {
  context = null;
}

/**
 * 記一題「第一次沒答對」。沒有 startMistakeContext 時安靜忽略
 * （例如單元測試直接建元件），不影響作答。
 * @returns {boolean} 有沒有真的記下來
 */
export function noteMistake(item) {
  if (!context || !storable(item)) return false;
  const { lessonId, moduleKey } = context;
  const id = mistakeId(lessonId, moduleKey, item);
  const list = read();
  const found = list.find((m) => m.id === id);
  const now = Date.now();
  if (found) {
    // 又錯一次：退回第一格，立刻到期。
    found.box = 0;
    found.due = now;
    found.wrongCount += 1;
    found.lastAt = now;
    found.snap = snapshot(item); // 題目內容可能改版過，用最新的
  } else {
    list.push({
      id,
      lessonId,
      moduleKey,
      box: 0,
      due: now,
      wrongCount: 1,
      firstAt: now,
      lastAt: now,
      snap: snapshot(item),
    });
    // 超過上限先丟最舊的，避免 localStorage 爆掉
    if (list.length > MAX_ITEMS) list.splice(0, list.length - MAX_ITEMS);
  }
  write(list);
  return true;
}

/** 全部錯題；給定 lessonId 時只回那一課的。 */
export function allMistakes(lessonId) {
  const list = read();
  return lessonId ? list.filter((m) => m.lessonId === lessonId) : list;
}

/** 今天該複習的錯題（到期的）。 */
export function dueMistakes(lessonId, now = Date.now()) {
  return allMistakes(lessonId).filter((m) => m.due <= now);
}

/** 課次首頁／首頁上的紅點數字。 */
export function dueCount(lessonId, now = Date.now()) {
  return dueMistakes(lessonId, now).length;
}

/** 下一題到期還要幾天（無錯題或全部到期時回 null）。 */
export function daysUntilNextDue(lessonId, now = Date.now()) {
  const pending = allMistakes(lessonId).filter((m) => m.due > now);
  if (!pending.length) return null;
  const soonest = pending.reduce((min, m) => Math.min(min, m.due), Infinity);
  return Math.max(1, Math.ceil((soonest - now) / DAY_MS));
}

/**
 * 把錯題還原成 ChoiceQuiz 吃的題目物件。
 * 帶 `_mistakeId` 讓作答結果能對回盒子裡的那一筆。
 */
export function toQuizItem(mistake) {
  const s = mistake.snap;
  return {
    id: `mistake:${mistake.id}`,
    _mistakeId: mistake.id,
    stem: s.stem,
    stemText: s.stem,
    options: s.options,
    answer: s.answer,
    explanation: s.explanation,
    hints: s.hints,
    hint: s.hint,
    readAllStem: s.readAllStem,
  };
}

/**
 * 複習作答的結果。
 * @param {string} mistakeId
 * @param {boolean} firstTry 第一次就答對
 * @returns {'learned'|'advanced'|'reset'|'missing'}
 */
export function gradeMistake(mistakeId, firstTry, now = Date.now()) {
  const list = read();
  const index = list.findIndex((m) => m.id === mistakeId);
  if (index < 0) return 'missing';
  const m = list[index];
  m.lastAt = now;
  if (!firstTry) {
    m.box = 0;
    m.due = now;
    m.wrongCount += 1;
    write(list);
    return 'reset';
  }
  m.box += 1;
  if (m.box >= BOX_DAYS.length) {
    list.splice(index, 1);
    write(list);
    return 'learned';
  }
  m.due = now + BOX_DAYS[m.box] * DAY_MS - EARLY_MS;
  write(list);
  return 'advanced';
}

/** 清空錯題盒（教師頁的「清除學習紀錄」會一起呼叫）。 */
export function clearMistakes() {
  return write([]);
}
