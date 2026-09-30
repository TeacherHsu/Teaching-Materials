// 這台載具的教師設定（存在 localStorage，不隨課次改變）。
//
// 潛能教室的現實：同一節課裡有不同年級、不同能力的學生，教師無法為每個人
// 另做一份教材。這裡採「同一份教材、不同鷹架厚度」——題目本身不變，
// 只調整干擾項數量、每輪題數與提示層數。這樣同一課仍是同一份教材，好帶。
const KEY = 'mandarin:device-settings:v1';

/**
 * 三段鷹架厚度。題目內容完全相同，差別只在支持的多寡。
 * - optionCount：選擇題的選項數（含正解）
 * - roundSize：每一輪幾題
 * - eliminateHint：答錯第二次時是否用刪去法畫掉一個明顯錯的選項
 */
export const SCAFFOLD_LEVELS = {
  support: { key: 'support', label: '支持', optionCount: 2, roundSize: 3, eliminateHint: true, note: '選項少、題數少，答錯會幫忙刪掉一個。' },
  standard: { key: 'standard', label: '標準', optionCount: 3, roundSize: 5, eliminateHint: true, note: '一般難度。' },
  challenge: { key: 'challenge', label: '挑戰', optionCount: 4, roundSize: 5, eliminateHint: false, note: '選項多，不提供刪去法。' },
};

const DEFAULT_LEVEL = 'standard';

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

/** @returns {string} 目前的鷹架層級 key；讀不到或值不合法時回到標準。 */
export function getScaffoldLevelKey() {
  const level = read().scaffoldLevel;
  return SCAFFOLD_LEVELS[level] ? level : DEFAULT_LEVEL;
}

/** @returns {{key:string,label:string,optionCount:number,roundSize:number,eliminateHint:boolean,note:string}} */
export function getScaffoldLevel() {
  return SCAFFOLD_LEVELS[getScaffoldLevelKey()];
}

/** @returns {boolean} 是否成功寫入（localStorage 不可用時回 false，但不丟例外）。 */
export function setScaffoldLevel(levelKey) {
  if (!SCAFFOLD_LEVELS[levelKey]) return false;
  return write({ ...read(), scaffoldLevel: levelKey });
}

/**
 * Google 試算表同步網址（Apps Script 網頁應用程式）。
 * 存在這台載具，不進 repo——網址等同於寫入權限，不可以進版本控制。
 */
export function getSheetUrl() {
  return read().sheetUrl || '';
}

export function setSheetUrl(url) {
  const value = String(url || '').trim();
  // 只接受 Apps Script 的網址，避免誤填成別的地方而把成績送錯對象。
  if (value && !/^https:\/\/script\.google(usercontent)?\.com\//.test(value)) return false;
  return write({ ...read(), sheetUrl: value });
}

/** 這台載具的標記（例如「三年級 3 號機」），只作為成績紀錄的標頭，不含學生姓名。 */
export function getDeviceLabel() {
  return read().deviceLabel || '';
}

export function setDeviceLabel(label) {
  return write({ ...read(), deviceLabel: String(label || '').slice(0, 30) });
}
