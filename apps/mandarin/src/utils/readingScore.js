// 朗讀評分：把語音辨識的結果和課文逐字比對。
//
// 判準（和「念讀語詞」一致，源自雄老師 HTML5 FUN Speaking 的設計）：
//   **不比聲調、同音字算對。**
//   構音異常與聲調不穩在這群學生很常見，把評分重點放在「說得夠清楚讓機器
//   抓得到」，而不是「發音標準」。學生念對了，辨識器挑了哪個同音字不是他的錯
//   （念「ㄏㄡˋ」被辨識成「厚」而不是「候」，那是辨識器的事）。
//
// 對齊用編輯距離回溯，所以分得出「念錯」和「漏掉」：
//   念錯＝有念但讀音不同（替換）；漏掉＝根本沒念到（刪除）。
// 這兩種在教學上的意義不一樣，不能混為一談。

const HAN = /[㐀-鿿]/;
const TONES = /[ˊˇˋ˙]/g;
const INDEX_URL = 'data/_index/char-readings.json';

/** 去聲調。輕聲符號「˙」在資料裡前置與後置都出現過，一律去掉。 */
export function toneless(zhuyin) {
  return String(zhuyin || '').replace(TONES, '');
}

// 字→讀音索引在執行期載入（和課文密文一樣放 public/data，不打包進 bundle）。
// 還沒載入時 readingsOf 回空陣列，評分會退回「同字才算對」——會嚴一點，
// 但不會壞掉。
let INDEX = {};
let indexPromise = null;

/** 載入字→讀音索引。重複呼叫共用同一個 promise。 */
export function ensureCharReadings(base = import.meta.env?.BASE_URL || '/') {
  if (!indexPromise) {
    indexPromise = fetch(`${String(base).replace(/\/$/, '')}/${INDEX_URL}`)
      .then((res) => {
        if (!res.ok) throw new Error(`char-readings.json 讀取失敗（HTTP ${res.status}）`);
        return res.json();
      })
      .then((data) => {
        INDEX = data.chars || {};
        return INDEX;
      })
      .catch((err) => {
        indexPromise = null;   // 允許重試
        throw err;
      });
  }
  return indexPromise;
}

/** 測試用：直接注入索引，不經過 fetch。 */
export function setCharReadings(index) {
  INDEX = index || {};
}

/** 這個字的所有讀音（去聲調、去重）。查不到時回空陣列。 */
export function readingsOf(char) {
  const list = INDEX[char];
  if (!list) return [];
  return [...new Set(list.map(toneless))];
}

/**
 * 學生念出來的字，和課文期望的讀音算不算同一個音。
 * 查不到讀音的字（索引外）退回「同字才算對」，這會讓少數同音字被誤判為念錯，
 * 是已知限制，教師頁要說明。
 */
function sounds(expectedChar, expectedReading, heardChar) {
  if (heardChar === expectedChar) return 'ok';
  const heard = readingsOf(heardChar);
  if (!heard.length) return false;              // 不認得這個字，不敢說它對
  const want = toneless(expectedReading);
  if (!want) return false;
  return heard.includes(want) ? 'homophone' : false;
}

/**
 * 把一句課文拆成「要評分的字」。標點不算分——念不念標點不是朗讀能力。
 * @param {Array} words 這一句的詞 [[文字, "注音 注音", 朗讀用字|null], …]
 * @returns {Array<{char: string, zhuyin: string, wordIndex: number, charIndex: number}>}
 */
export function scorableChars(words) {
  const out = [];
  words.forEach((word, wordIndex) => {
    const [text, zhuyinText] = word;
    const zs = zhuyinText ? zhuyinText.split(' ') : [];
    [...text].forEach((char, charIndex) => {
      const zhuyin = zs[charIndex] || '';
      if (HAN.test(char) && zhuyin) out.push({ char, zhuyin, wordIndex, charIndex });
    });
  });
  return out;
}

/**
 * 逐字對齊並評分。
 * @param {Array<{char:string, zhuyin:string}>} expected 課文該句的字
 * @param {string} heardText 語音辨識的結果
 * @returns {{
 *   marks: Array<'ok'|'homophone'|'wrong'|'missed'>,  // 和 expected 等長
 *   heardFor: Array<string|null>,                     // 每個期望字實際聽到什麼
 *   okCount: number, total: number, accuracy: number, // accuracy 0–100
 * }}
 */
export function scoreReading(expected, heardText) {
  const heard = [...String(heardText || '')].filter((c) => HAN.test(c));
  const n = expected.length;
  const m = heard.length;

  if (n === 0) {
    return { marks: [], heardFor: [], okCount: 0, total: 0, accuracy: 0 };
  }

  // 編輯距離 DP：cost[i][j] = 前 i 個期望字、前 j 個聽到的字的最小代價
  const cost = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i += 1) cost[i][0] = i;      // 全部漏掉
  for (let j = 0; j <= m; j += 1) cost[0][j] = j;      // 全部多念
  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      const hit = sounds(expected[i - 1].char, expected[i - 1].zhuyin, heard[j - 1]);
      cost[i][j] = Math.min(
        cost[i - 1][j - 1] + (hit ? 0 : 1),   // 對上（或念錯這個字）
        cost[i - 1][j] + 1,                   // 漏掉一個期望字
        cost[i][j - 1] + 1,                   // 多念一個字
      );
    }
  }

  // 回溯
  const marks = new Array(n).fill('missed');
  const heardFor = new Array(n).fill(null);
  let i = n;
  let j = m;
  while (i > 0) {
    if (j > 0) {
      const hit = sounds(expected[i - 1].char, expected[i - 1].zhuyin, heard[j - 1]);
      if (cost[i][j] === cost[i - 1][j - 1] + (hit ? 0 : 1)) {
        marks[i - 1] = hit || 'wrong';
        heardFor[i - 1] = heard[j - 1];
        i -= 1; j -= 1;
        continue;
      }
      if (cost[i][j] === cost[i][j - 1] + 1) { j -= 1; continue; }   // 多念的字，忽略
    }
    marks[i - 1] = 'missed';
    i -= 1;
  }

  const okCount = marks.filter((mk) => mk === 'ok' || mk === 'homophone').length;
  return {
    marks,
    heardFor,
    okCount,
    total: n,
    accuracy: Math.round((okCount / n) * 100),
  };
}

/**
 * 流暢度：每分鐘念幾個字。
 *
 * **刻意不給百分制分數、也不對照外部常模。** 兩個理由：
 *   1. Web Speech Recognition 不提供逐字時間戳，做不到真正的停頓分析，
 *      只能用「整段字數 ÷ 秒數」近似，精度撐不起一個分數。
 *   2. 給分數會讓學生把「念快」當目標。對口吃、構音異常、閱讀困難的學生，
 *      那是有害的誘因——念得清楚比念得快重要。
 * 改成**和自己比**：記錄每分鐘字數，和同一段上次的紀錄比較。
 * 自我參照的進步監控本來就是 IEP 的做法，也不需要引用未經查證的年段常模。
 *
 * @param {number} charCount 這一段有幾個要念的字
 * @param {number} elapsedMs 從開始念到辨識結束的毫秒數
 * @returns {{charsPerMinute: number|null, seconds: number}}
 */
export function fluency(charCount, elapsedMs) {
  const seconds = elapsedMs / 1000;
  if (!charCount || seconds < 1) return { charsPerMinute: null, seconds };
  return { charsPerMinute: Math.round((charCount / seconds) * 60), seconds };
}

/**
 * 和自己的上一次比。
 * @returns {'faster'|'similar'|'slower'|'first'}
 */
export function compareFluency(current, previous) {
  if (!previous || !current) return 'first';
  const diff = (current - previous) / previous;
  if (diff > 0.1) return 'faster';
  if (diff < -0.1) return 'slower';
  return 'similar';
}

/** 正確性 → 星星。和站上其他大項同一個尺度。 */
export function accuracyStars(accuracy) {
  if (accuracy >= 90) return 3;
  if (accuracy >= 70) return 2;
  if (accuracy >= 40) return 1;
  return 0;
}
