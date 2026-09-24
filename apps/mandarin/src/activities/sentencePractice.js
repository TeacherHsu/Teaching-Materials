// 「句型練習」模組：三步依序呈現（一畫面一任務）
// 1. 短語搭配（MatchingGame：短語/語詞 ↔ 解釋，3–5 題一組；排除整句例句與句型總表）
// 2. 句子重組（SentenceOrdering，用 approved 例句）
// 3. 仿寫選填（SentenceBuilder，用另一句 approved 例句，避免和步驟 2 重複）
//
// 只用 approved（生產）或 draft（preview/dev，沿用既有 filterByStatus 規則）
// 的 sentence_patterns.examples；若可用例句不足，該步驟略過（不會整個模組壞掉，
// 但 moduleRegistry 會在題數不足時把整個模組標「教材審核中」）。
import { h, clear } from '../utils/dom.js';
import { MatchingGame } from '../components/MatchingGame.js';
import { SentenceOrdering } from '../components/SentenceOrdering.js';
import { SentenceBuilder } from '../components/SentenceBuilder.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { missingContentNotice } from './engine.js';
import { chunkRounds } from '../utils/chunk.js';
import { filterByStatus, isPreview } from '../utils/preview.js';

const PUNCT_RE = /[，。！？、]/;

/** 把一句例句拆成可重組的詞塊：先用標點斷開（標點併入前一片語），
 * 片語數不足 3 段時退回每兩字一組的簡化切法。 */
function splitSentenceIntoChunks(sentence) {
  const rawParts = sentence.split(/([，。！？、])/).filter((s) => s !== '');
  const merged = [];
  for (const part of rawParts) {
    if (PUNCT_RE.test(part) && merged.length > 0) {
      merged[merged.length - 1] += part;
    } else {
      merged.push(part);
    }
  }
  if (merged.length >= 3) return merged;
  const chars = sentence.replace(new RegExp(PUNCT_RE, 'g'), '').split('');
  const chunks = [];
  for (let i = 0; i < chars.length; i += 2) chunks.push(chars.slice(i, i + 2).join(''));
  return chunks.filter(Boolean);
}

const SENTENCE_PUNCT_RE = /[。！？，、]/;
// 句型總表（整條句型規則的名稱，如「並列複句」）不是短語，不放進「短語 ↔ 解釋」配對。
const EXCLUDED_CATEGORY = '教冊句型總表';
const MAX_PHRASE_LEN = 10;

/** 只挑「短語/語詞 ↔ 解釋」可配對的句型項目：排除整句例句（含標點的完整句子）
 * 與句型規則總表（head 是「並列複句」這種抽象規則名，不是可配對的短語）。 */
function readyMatchingPairs(lesson) {
  return filterByStatus(lesson.sentence_patterns || [])
    .filter((p) => p.head && p.description)
    .filter((p) => p.category !== EXCLUDED_CATEGORY)
    .filter((p) => !SENTENCE_PUNCT_RE.test(p.head))
    .filter((p) => p.head.length <= MAX_PHRASE_LEN)
    .map((p) => ({ left: p.head, right: p.description }));
}

/** 把每個句型的 approved（或 preview 下的 draft）例句攤平成 {pattern, sentence} 清單。 */
function flattenExamples(lesson) {
  const patterns = filterByStatus(lesson.sentence_patterns || [], { statusKey: 'examples_status' }).filter(
    (p) => p.examples && p.examples.length > 0,
  );
  const out = [];
  for (const p of patterns) {
    for (const sentence of p.examples) out.push({ pattern: p, sentence });
  }
  return out;
}

function buildRoundsFromExamples(examples, promptPrefix) {
  return examples
    .map(({ pattern, sentence }) => {
      const chunks = splitSentenceIntoChunks(sentence);
      if (chunks.length < 2) return null;
      return {
        prompt: `${promptPrefix}（句型：${pattern.structure || pattern.head}）`,
        parts: chunks,
        solution: chunks,
        draft: pattern.examples_status === 'draft',
      };
    })
    .filter(Boolean);
}

/**
 * @param {object} lesson
 * @param {() => void} onBack
 */
export function buildSentencePracticeActivity(lesson, onBack) {
  const matchingPairs = readyMatchingPairs(lesson);
  const matchingRounds = chunkRounds(matchingPairs, { min: 3, max: 5 });

  const allExamples = flattenExamples(lesson);
  // 句子重組用每個句型的第 1 句、仿寫選填用第 2 句（若沒有第 2 句才退回第 1 句），
  // 讓兩步驟盡量不用同一句例句。
  const seenPatternIds = new Map();
  const orderingExamples = [];
  const builderExamples = [];
  for (const ex of allExamples) {
    const count = seenPatternIds.get(ex.pattern.id) || 0;
    seenPatternIds.set(ex.pattern.id, count + 1);
    if (count === 0) orderingExamples.push(ex);
    else if (count === 1) builderExamples.push(ex);
  }
  if (builderExamples.length === 0) builderExamples.push(...orderingExamples);

  const orderingRounds = buildRoundsFromExamples(orderingExamples, '請把下面的詞語排成一句通順的句子');
  const builderRounds = buildRoundsFromExamples(builderExamples, '請選出正確的詞語，仿照句型組成一句話');

  const steps = [];
  if (matchingRounds.length > 0) steps.push('matching');
  if (orderingRounds.length > 0) steps.push('ordering');
  if (builderRounds.length > 0) steps.push('builder');

  const container = h('div', {});
  let stepIndex = 0;
  let roundIndex = 0;

  function draftNoticeIfNeeded(rounds, idx) {
    if (isPreview() && rounds[idx] && rounds[idx].draft) {
      container.appendChild(h('p', { class: 'meta' }, '「待審」例句只在預覽模式顯示，正式上線只會出現教師核准過的內容。'));
    }
  }

  function renderStep() {
    clear(container);
    if (steps.length === 0) {
      container.appendChild(missingContentNotice('句型練習：教材審核中（例句尚未核准）'));
      return;
    }
    const step = steps[stepIndex];
    const isLastStep = stepIndex === steps.length - 1;
    const stepLabel = `第 ${stepIndex + 1} 步／共 ${steps.length} 步`;

    if (step === 'matching') {
      const isLastRound = roundIndex === matchingRounds.length - 1;
      container.appendChild(
        TaskBanner({ label: '短語搭配：把語詞和意思配對起來', step: `${stepLabel} ・ 第 ${roundIndex + 1} 組／共 ${matchingRounds.length} 組` }),
      );
      container.appendChild(
        MatchingGame({
          pairs: matchingRounds[roundIndex],
          instructions: '選左邊的語詞，再選右邊的意思。',
          backLabel: isLastRound ? (isLastStep ? '回課程首頁' : '繼續：句子重組') : '再來一組',
          onBack: () => {
            if (!isLastRound) {
              roundIndex += 1;
              renderStep();
            } else if (isLastStep) {
              onBack();
            } else {
              stepIndex += 1;
              roundIndex = 0;
              renderStep();
            }
          },
        }),
      );
    } else if (step === 'ordering') {
      const isLastRound = roundIndex === orderingRounds.length - 1;
      container.appendChild(
        TaskBanner({ label: '句子重組', step: `${stepLabel} ・ 第 ${roundIndex + 1} 題／共 ${orderingRounds.length} 題` }),
      );
      draftNoticeIfNeeded(orderingRounds, roundIndex);
      container.appendChild(
        SentenceOrdering({
          ...orderingRounds[roundIndex],
          onBack: () => {
            if (!isLastRound) {
              roundIndex += 1;
              renderStep();
            } else if (isLastStep) {
              onBack();
            } else {
              stepIndex += 1;
              roundIndex = 0;
              renderStep();
            }
          },
        }),
      );
    } else if (step === 'builder') {
      const isLastRound = roundIndex === builderRounds.length - 1;
      container.appendChild(
        TaskBanner({ label: '仿寫選填', step: `${stepLabel} ・ 第 ${roundIndex + 1} 題／共 ${builderRounds.length} 題` }),
      );
      draftNoticeIfNeeded(builderRounds, roundIndex);
      const round = builderRounds[roundIndex];
      container.appendChild(
        SentenceBuilder({
          prompt: round.prompt,
          bank: round.parts,
          solution: round.solution,
          onBack: () => {
            if (!isLastRound) {
              roundIndex += 1;
              renderStep();
            } else {
              onBack();
            }
          },
        }),
      );
    }
  }

  renderStep();
  return container;
}
