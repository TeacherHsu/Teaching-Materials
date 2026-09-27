// 「一字多音」模組：05認識多音字，看語詞（多音字標色）選正確讀音。選項是
// 注音，每個選項 ChoiceQuiz 都內建朗讀鈕。題目與選項直接用課本例詞／注音
// （直接公開類，不需要改寫），status 恆為 ready，不會有 draft 待審內容。
//
// 注音限制（見 tools/dabutie/extractors/vocab_explanations.py 說明）：05 docx
// 的注音是向量圖形，無法可靠抽取；本模組只用得到 zhuyin 欄位（呼叫端用 pedia
// 查證後填入，pedia 也沒有的維持 null）。同一個字若不到 2 個讀音有查得到、
// 彼此不同的 zhuyin，就沒有辦法出「選正確讀音」的題目，該讀音略過不計入
// 題庫；若某課完全沒有可用的 zhuyin，本大項在 moduleRegistry 就會判定
// ready()=false，顯示「教材審核中」（等同教材待補，見 moduleRegistry.js）。
import { h, clear } from '../utils/dom.js';
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus } from '../utils/preview.js';
import { chunkRounds } from '../utils/chunk.js';

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

/** 一個字要能出題，至少要有 2 個讀音各自查得到 zhuyin，且彼此不同。 */
export function usablePolyphoneEntries(lesson) {
  const out = [];
  for (const entry of filterByStatus(lesson.polyphones || [])) {
    const readings = (entry.readings || []).map((reading) => ({
      ...reading,
      // 舊資料有 readings[].examples，新資料則把例詞放在 senses[].examples。
      examples: [...new Set([
        ...(reading.examples || []),
        ...(reading.senses || []).flatMap((sense) => sense.examples || []),
      ].filter(Boolean))],
    })).filter((r) => r.zhuyin && r.examples.length > 0);
    const distinctZhuyin = new Set(readings.map((r) => r.zhuyin));
    if (readings.length < 2 || distinctZhuyin.size < 2) continue;
    for (const reading of readings) {
      const example = reading.examples[0];
      if (!example) continue;
      out.push({ char: entry.char, example, zhuyin: reading.zhuyin, allZhuyin: [...distinctZhuyin] });
    }
  }
  return out;
}

export function canStartPolyphones(lesson) {
  return usablePolyphoneEntries(lesson).length >= 2;
}

function buildChoiceItem(item) {
  const options = shuffled(item.allZhuyin);
  return {
    id: `polyphone:${item.char}:${item.zhuyin}:${item.example}`,
    stem: `「${item.example}」的「${item.char}」，這裡讀作什麼？`,
    readAllStem: `${item.example}　「${item.char}」這裡讀作什麼？`,
    options,
    answer: item.zhuyin,
    explanation: `「${item.example}」的「${item.char}」讀作 ${item.zhuyin}。`,
    hints: ['同一個字的不同讀音，意思通常也不一樣，想想這個詞的意思是什麼。'],
  };
}

/**
 * @param {object} lesson
 * @param {() => void} onBack
 */
export function buildPolyphonesActivity(lesson, onBack) {
  const entries = usablePolyphoneEntries(lesson);
  const rounds = chunkRounds(entries, { min: 3, max: 5 }).map((round) => round.map(buildChoiceItem));

  const container = h('div', {});
  let roundIndex = 0;

  function renderStep() {
    clear(container);
    if (!canStartPolyphones(lesson) || rounds.length === 0) {
      container.appendChild(missingContentNotice('一字多音：教材審核中'));
      return;
    }
    const isLastRound = roundIndex === rounds.length - 1;
    container.appendChild(
      TaskBanner({ label: '看語詞，選出標色的字正確的讀音', step: roundIndex === 0 ? '本課先完成' : '加練挑戰' }),
    );
    container.appendChild(
      ChoiceQuiz({
        items: rounds[roundIndex],
        backLabel: isLastRound ? '回課程首頁' : '本課先完成',
        onBack: () => {
          if (!isLastRound) {
            onBack();
          } else {
            onBack();
          }
        },
        onContinue: isLastRound ? null : () => {
          roundIndex += 1;
          renderStep();
        },
      }),
    );
  }

  renderStep();
  return container;
}
