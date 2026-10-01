// 這台載具的教師設定（存在 localStorage，不隨課次改變）。
//
// 潛能教室的現實：同一節課裡有不同年級、不同能力的學生，教師無法為每個人
// 另做一份教材。這裡採「同一份教材、不同鷹架厚度」——題目本身不變，
// 只調整支持的多寡。這樣同一課仍是同一份教材，好帶。
const KEY = 'mandarin:device-settings:v1';

/**
 * 三段鷹架厚度。題目內容完全相同，差別只在支持的多寡。
 *
 * - optionCount：選擇題的選項數（含正解）
 * - roundSize：每一輪最多幾題
 * - wrongLimit：答錯幾次之後直接揭曉正解。
 *     支持層設 1＝**答錯一次就告訴他答案**，不讓學生在錯誤裡反覆打轉
 *     （近似零錯誤學習）。標準／挑戰層設 2＝先給提示，再錯才揭曉。
 * - autoRead：題目出現時自動念一次。支持層預設開——閱讀困難的學生
 *     要先聽到題目才讀得下去，不該每題都得自己按喇叭。
 * - reciteUnit：朗讀挑戰一次念多少。'sentence' 一句、'paragraph' 一整段。
 *     挑戰層才念整段——連續語流比單句難得多。
 * - prefill：造句時預先幫他填好句型的前幾個必用字，游標停在最後。
 *     支持層填 1 個。我們的造句是一個輸入框的自由書寫，在句子**中間**
 *     插字對手部控制不佳或不熟輸入法的學生很痛苦；預填開頭等於給一個
 *     「起頭」，他只要往後寫。
 * - reciteModel：朗讀前可不可以先聽範讀。支持與標準層開，挑戰層關
 *     （挑戰層要的是自己讀出來，不是跟著念）。
 */
export const SCAFFOLD_LEVELS = {
  support: {
    key: 'support',
    label: '支持',
    optionCount: 2,
    roundSize: 3,
    wrongLimit: 1,
    autoRead: true,
    reciteUnit: 'sentence',
    reciteModel: true,
    prefill: 1,
    note: '選項少、題數少；答錯一次就直接告訴他答案；題目會自動念出來；朗讀一次一句、可先聽範讀。',
  },
  standard: {
    key: 'standard',
    label: '標準',
    optionCount: 3,
    roundSize: 5,
    wrongLimit: 2,
    autoRead: false,
    reciteUnit: 'sentence',
    reciteModel: true,
    prefill: 0,
    note: '一般難度。答錯先給提示，再錯才揭曉答案；朗讀一次一句、可先聽範讀。',
  },
  challenge: {
    key: 'challenge',
    label: '挑戰',
    optionCount: 4,
    roundSize: 5,
    wrongLimit: 2,
    autoRead: false,
    reciteUnit: 'paragraph',
    reciteModel: false,
    prefill: 0,
    note: '選項多。答錯先給提示，再錯才揭曉答案；朗讀一次一整段、沒有範讀。',
  },
};

const DEFAULT_LEVEL = 'standard';

/**
 * 可以個別覆寫的項目。值為 null 代表「跟隨等級」——這個哨兵值是刻意的：
 * 教師手動調過的項目，之後切換等級**不會**被蓋掉；要恢復成跟著等級走，
 * 必須明確按「跟隨等級」。沒有這個區分的話，教師每次換等級都要重調一次。
 */
export const OVERRIDABLE = ['autoRead'];

function read() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
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

/**
 * 目前生效的設定＝等級預設 ⊕ 教師的個別覆寫。
 * @returns {{key:string,label:string,optionCount:number,roundSize:number,
 *            wrongLimit:number,autoRead:boolean,note:string}}
 */
export function getScaffoldLevel() {
  const base = SCAFFOLD_LEVELS[getScaffoldLevelKey()];
  const overrides = read().overrides || {};
  const merged = { ...base };
  for (const name of OVERRIDABLE) {
    if (overrides[name] !== null && overrides[name] !== undefined) merged[name] = overrides[name];
  }
  return merged;
}

/** @returns {boolean} 是否成功寫入（localStorage 不可用時回 false，但不丟例外）。 */
export function setScaffoldLevel(levelKey) {
  if (!SCAFFOLD_LEVELS[levelKey]) return false;
  return write({ ...read(), scaffoldLevel: levelKey });
}

/**
 * 這個項目現在是跟著等級，還是教師手調過的。
 * @returns {null|boolean} null＝跟隨等級
 */
export function getOverride(name) {
  if (!OVERRIDABLE.includes(name)) return null;
  const value = (read().overrides || {})[name];
  return value === undefined ? null : value;
}

/**
 * 設定個別覆寫。傳 null 代表恢復「跟隨等級」。
 */
export function setOverride(name, value) {
  if (!OVERRIDABLE.includes(name)) return false;
  const state = read();
  const overrides = { ...(state.overrides || {}) };
  if (value === null) delete overrides[name];
  else overrides[name] = Boolean(value);
  return write({ ...state, overrides });
}

/**
 * 課文點讀／朗讀的字級。學生的視力、閱讀距離、投影與否差很多，
 * 讓現場可以直接調，不必改程式。數值是 --font-size 的倍率。
 */
export const READER_FONT_SCALES = [
  { key: 'small', label: '小', scale: 0.85 },
  { key: 'medium', label: '中', scale: 1 },
  { key: 'large', label: '大', scale: 1.25 },
  { key: 'xlarge', label: '特大', scale: 1.5 },
];

export function getReaderFontKey() {
  const key = read().readerFont;
  return READER_FONT_SCALES.some((f) => f.key === key) ? key : 'medium';
}

export function getReaderFontScale() {
  return (READER_FONT_SCALES.find((f) => f.key === getReaderFontKey()) || READER_FONT_SCALES[1]).scale;
}

export function setReaderFont(key) {
  if (!READER_FONT_SCALES.some((f) => f.key === key)) return false;
  return write({ ...read(), readerFont: key });
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
