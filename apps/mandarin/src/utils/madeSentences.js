import { inScope } from './mistakes.js';
// 學生自己寫的句子：存、批改、要求重寫。
//
// 這是全站唯一的「教師 → 學生」回饋通道。其他練習都是機器判對錯，只有造句
// 需要人看過——句子通不通順、合不合句型，不是比對字串能決定的。
// 流程：學生寫 → 教師在教師頁打 ✓／✗ → 打 ✗ 的句型進錯題複習，要求重寫。
//
// ── 個資界線（重要，不要改掉）────────────────────────
// 學生自由寫的句子**可能寫到自己或同學的名字**，所以：
//   1. 句子存在這個獨立的 localStorage key，和 records.js 的紀錄完全分開。
//   2. records.js 的 Google 試算表同步只讀它自己的 key，**結構上**不可能
//      把句子帶出去。這不是靠記得，是靠分開存。
//   3. 句子永遠不離開這台載具。要給別人看，請教師自己在載具上看。
// 這條對應 sped-os 的資料分級（L3 學生可識別資料不外流）。
const KEY = 'mandarin:made-sentences:v1';
const MAX_ITEMS = 200;

/** 批改狀態：null＝還沒看、'ok'＝通過、'redo'＝要重寫 */
export const MARKS = { PENDING: null, OK: 'ok', REDO: 'redo' };

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
    return false;
  }
}

function today(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10);
}

// 句型敘述裡常出現「沒加括號的佔位詞」（動詞＋上／下＋名詞、原因，所以結果），
// 這些是詞性或角色提示，不是要學生照抄的字。全站 208 個句型的寫法並不一致，
// 所以把這些字列成詞彙表排除掉。
const PLACEHOLDER_WORDS = new Set([
  '動詞', '名詞', '形容詞', '副詞', '疊字', '疊字形容詞', '疊字副詞', '量詞', '數詞', '連接詞',
  '原因', '結果', '情況', '狀態', '動作', '誰', '什麼', '什麼事', '什麼地方', '地方', '時間',
  '人物', '事情', '物品', '東西', '某人', '某事', '某物', '怎麼樣', '做什麼', '做什麼事',
  '程度', '對象', '句子', '短語', '詞語',
]);

// 這些不是句型，是分類標籤（整串沒有任何佔位符號或連接記號）。
const LABEL_ONLY = /^[\u3400-\u9fff]{2,6}$/;

/**
 * 從句型的 structure 抽出「大概要用到的字」，用來給學生**軟提示**。
 *
 * 刻意保守而且不保證完整：208 個句型的寫法不一致，抽不準是常態。
 * 所以這個結果只拿來提醒，**絕對不拿來擋學生送出**——對閱讀困難的學生，
 * 用一個不可靠的啟發法把他的句子判成錯的，比不檢查還糟。
 * 句子通不通順由教師判斷，那正是這個功能存在的理由。
 *
 * 「無比（形容詞）的（名詞）」→ ['無比', '的']
 * 「（名詞）從（名詞）（疊字副詞）（動詞）。」→ ['從']
 * 「動詞＋上／下＋名詞」→ ['上', '下']（動詞／名詞是佔位詞）
 * 「生活情境句」→ []（這是標籤不是句型）
 */
export function patternKeywords(structure) {
  const text = String(structure || '').trim();
  if (!text || LABEL_ONLY.test(text)) return [];
  return text
    .replace(/[（(][^）)]*[）)]/g, '\u0000')
    .split(/[\u0000＋+／/、，。！？；：…\s]+/)
    .map((part) => part.trim())
    .filter((part) => part && !PLACEHOLDER_WORDS.has(part)
      && ![...PLACEHOLDER_WORDS].some((ph) => part.includes(ph)));
}

/** 句子裡還沒用到的句型關鍵字（依序比對）。只拿來提示，不擋送出。 */
export function missingKeywords(raw, pattern) {
  const text = String(raw || '').replace(/\s+/g, '');
  const missing = [];
  let cursor = 0;
  for (const word of patternKeywords(pattern && pattern.structure)) {
    const at = text.indexOf(word, cursor);
    if (at < 0) missing.push(word);
    else cursor = at + word.length;   // 要求順序，不只是「有出現」
  }
  return missing;
}

/**
 * 送出前的硬性檢查。只擋「沒寫」和「太短」這兩件無論如何都不成立的事；
 * 其餘一律放行，交給教師批改。
 * @returns {{ok: boolean, reason: string, text: string}}
 */
export function checkSentence(raw, prefilled = '') {
  const text = String(raw || '').trim().replace(/\s+/g, '');
  if (!text) return { ok: false, reason: '還沒有寫喔，試著寫一句話。', text };
  // 預填的字不算學生寫的，否則他什麼都沒打、光靠預填就能送出。
  const own = text.startsWith(prefilled) ? text.slice(prefilled.length) : text;
  const han = (own.match(/[\u3400-\u9fff]/g) || []).length;
  if (han < 4) return { ok: false, reason: '再多寫一點，讓句子完整。', text };
  // 句號沒打不算錯，幫他補上
  const ended = /[。！？]$/.test(text) ? text : `${text}。`;
  return { ok: true, reason: '', text: ended };
}

/** 存一句學生寫的句子（同一課同一句型只留最新一句）。 */
export function saveSentence({ lessonId, patternId, patternHead, structure, text }, now = Date.now()) {
  if (!lessonId || !patternId || !text) return false;
  const list = read();
  const index = list.findIndex((s) => s.lessonId === lessonId && s.patternId === patternId);
  const entry = {
    lessonId,
    patternId,
    patternHead: patternHead || '',
    structure: structure || '',
    text: String(text),
    at: now,
    mark: MARKS.PENDING,   // 重寫過就回到「還沒看」，教師要再批一次
    skip: null,
  };
  if (index >= 0) list[index] = entry;
  else list.push(entry);
  if (list.length > MAX_ITEMS) list.splice(0, list.length - MAX_ITEMS);
  return write(list);
}

/** 全部句子；給 lessonId 時只回那一課的。最近寫的排前面。 */
export function listSentences(lessonId) {
  const list = read().filter((s) => inScope(s.lessonId, lessonId));
  return list.sort((a, b) => b.at - a.at);
}

/** 還沒批改的句子（教師頁的待辦）。 */
export function pendingSentences() {
  return listSentences().filter((s) => s.mark === MARKS.PENDING);
}

/** 教師批改。 */
export function markSentence(lessonId, patternId, mark) {
  if (![MARKS.OK, MARKS.REDO, MARKS.PENDING].includes(mark)) return false;
  const list = read();
  const found = list.find((s) => s.lessonId === lessonId && s.patternId === patternId);
  if (!found) return false;
  found.mark = mark;
  found.skip = null;       // 重新批改就解除「今天先跳過」
  return write(list);
}

/**
 * 今天要重寫的句子（教師打了 ✗ 而且今天還沒跳過）。
 * @param {string} [lessonId]
 */
export function redoSentences(lessonId, now = Date.now()) {
  return listSentences(lessonId).filter((s) => s.mark === MARKS.REDO && s.skip !== today(now));
}

/**
 * 今天先跳過這一句（學生卡住時不要擋住整個錯題複習）。
 * 明天還是會再出現。
 */
export function skipToday(lessonId, patternId, now = Date.now()) {
  const list = read();
  const found = list.find((s) => s.lessonId === lessonId && s.patternId === patternId);
  if (!found) return false;
  found.skip = today(now);
  return write(list);
}

/** 清掉（教師頁「清除紀錄」會一起呼叫）。 */
export function clearSentences() {
  return write([]);
}
