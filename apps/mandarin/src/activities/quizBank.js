// 單課小考的題庫：把各大項的選擇題收集起來，混在一起考。
//
// 為什麼要有小考：站上每一站都是「教完就過」，學生從來沒有在
// 「題目混在一起、沒有提示、答錯就揭曉」的情境下被考過——那正是定期評量
// 的樣子。沒有這一關，教師無法預測學生在正式評量的表現。
//
// 為什麼不另建題庫：題目會和各站長得不一樣，而且要維護兩份。這裡直接呼叫
// 各活動**自己的出題函式**（build*QuizItems），和學生平常做的是同一批題目。
//
// 參考站是用全域旗標讓各站的 runQuiz「只收題不渲染」。我們不這樣做：
// 那在模組化架構下會變成隱性耦合（任何人改 runQuiz 都可能默默破壞收題）。
// 改成各活動明確匯出一支純函式，型別清楚、可單獨測試。
import { buildCharacterQuizItems } from './characters.js';
import { buildVocabularyQuizItems } from './vocabulary.js';
import { buildReadingQuizItems } from './reading.js';
import { buildLookalikeQuestionItems } from './lookalikes.js';
import { buildPolysemyQuizItems } from './polysemy.js';
import { buildPolyphoneQuizItems } from './polyphones.js';
import { buildRhetoricQuizItems } from './rhetoric.js';
import { buildListeningQuizItems } from './listening.js';
import { shuffle } from '../utils/shuffle.js';

// 小考的題數：鷹架層級越高考越多題。
export const QUIZ_SIZE = { support: 8, standard: 12, challenge: 15 };

// 「舊字新詞」(review) 刻意不收：它考的是**前面課次**的內容，不屬於這一課，
// 而且要非同步載入前課 JSON。小考只考這一課。
const SOURCES = [
  ['characters', buildCharacterQuizItems],
  ['vocabulary', buildVocabularyQuizItems],
  ['reading', buildReadingQuizItems],
  ['lookalikes', buildLookalikeQuestionItems],
  ['polysemy', buildPolysemyQuizItems],
  ['polyphones', buildPolyphoneQuizItems],
  ['rhetoric', buildRhetoricQuizItems],
  ['listening', buildListeningQuizItems],
];

/** 題目合格才進題庫：要有至少兩個選項，而且答案在選項裡。 */
function usable(item) {
  return Boolean(
    item
      && typeof item.stem === 'string'
      && item.stem
      && Array.isArray(item.options)
      && item.options.length >= 2
      && typeof item.answer === 'string'
      && item.options.includes(item.answer),
  );
}

/**
 * 收集這一課所有大項的選擇題，依大項分組。
 * 單一大項出錯不該讓整場小考開不起來，所以每一支都各自 try。
 * @returns {Record<string, Array>} 大項代號 → 題目陣列
 */
export function collectQuizBank(lesson) {
  const bank = {};
  // 去重要**跨大項**，不能只在單站內：同一個生字可能在「認識生字」和
  // 「形近字」被問同一件事，分站去重會讓同一題在一場小考裡出現兩次。
  // 先收到的站保留，後面的站讓出去（SOURCES 的順序即優先序）。
  const seen = new Set();
  for (const [moduleKey, build] of SOURCES) {
    let items = [];
    try {
      items = build(lesson) || [];
    } catch {
      continue; // 這一站收題失敗就略過，其他站照常
    }
    const unique = items.filter((item) => {
      if (!usable(item)) return false;
      const key = `${item.stem}|${item.answer}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (unique.length) {
      bank[moduleKey] = unique.map((item) => ({ ...item, _moduleKey: moduleKey }));
    }
  }
  return bank;
}

/**
 * 各大項輪流抽題，盡量讓每一站都被考到（而不是題目多的那站佔滿整場）。
 * @param {Record<string, Array>} bank
 * @param {number} target 想抽幾題
 * @param {(a:Array)=>Array} [shuffleImpl] 測試可注入固定順序
 */
export function pickQuizItems(bank, target, shuffleImpl = shuffle) {
  const pools = {};
  for (const key of Object.keys(bank)) pools[key] = shuffleImpl([...bank[key]]);
  const picked = [];
  // 一輪一輪地走：每一輪每站各出一題，直到湊滿或所有站都空了。
  while (picked.length < target) {
    const available = Object.keys(pools).filter((k) => pools[k].length);
    if (!available.length) break;
    for (const key of shuffleImpl(available)) {
      if (picked.length >= target) break;
      picked.push(pools[key].pop());
    }
  }
  return picked;
}

/** 題目轉成小考用：去掉 extra（音檔列等 DOM），避免把畫面元件帶進混題測驗。 */
export function toQuizItem(item) {
  const { extra, stemContent, ...rest } = item;
  return rest;
}
