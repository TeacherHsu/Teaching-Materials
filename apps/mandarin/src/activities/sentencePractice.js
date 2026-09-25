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

const PUNCT_RE = /[，。！？、]/u;
const PROTECTED_PHRASES = [
  // 課文句型與常見固定語塊：先保護，再交給斷詞器，避免被拆成單字元。
  '一會兒', '不只要', '不只會', '不只', '不但', '而且', '如果', '因為', '所以', '只要', '除了',
  '沒想到', '有時', '慢吞吞', '五彩繽紛', '各式各樣', '半信半疑', '迫不及待', '翻山越嶺',
  // 課堂常見的複合詞，補足瀏覽器斷詞器容易拆開的內容詞。
  '作業本', '服務人員', '每一位', '遠道而來', '穿起來', '背起來', '放進書包', '排椅子', '不費力', '不容易出錯',
  '不會沉迷', '不必花錢', '不遲到', '不賴床', '不拖延', '不慌張', '分工合作', '一起想辦法',
  '認真練習投球', '認真練習後', '足夠的時間', '足夠的飲水', '再檢查一次', '春天的到來', '花朵綻放',
  '老師的提醒', '老師講解後', '同學解題的時間', '充分的準備', '進行得更順利', '天空下起大雨', '很快睡著', '角落旁',
  '調皮的孩子', '勤勞的農夫', '準時起床工作', '最後一個', '太大聲', '好活潑', '新的橋樑', '跑步的時間', '穿鞋子',
  '回家的路程', '完成的時間', '專心寫作業', '妹妹的心情', '寫作業', '出太陽', '靜不下來', '有品味', '有自信', '有秩序', '肥沃的土地',
  '舒服的床', '安靜的角落', '輕巧防水', '書包容量很大', '這個書包容量很大', '這本故事書', '內容有趣', '插圖很精美', '這件雨衣',
  '山景', '風光明媚', '天氣涼爽', '種在', '為了準時到校', '為了保持健康', '為了完成作業', '每天運動', '專心寫字', '有足夠的時間',
  '可以檢查書包', '準備了足夠的飲水', '可以安心出發', '留有足夠的時間', '可以再檢查一次', '提早準備', '今天沒有遲到', '就不容易出錯',
  '讓我準時完成作業',
  '暖暖的', '一個小箱子', '提早出門', '分工不清', '飲水不足', '進門的客人', '參觀學校的家長',
].sort((a, b) => b.length - a.length);
const SUFFIX_PARTICLES = new Set(['的', '地', '得', '了', '著', '過', '們', '吧', '呢', '嗎', '啊', '呀', '喔', '啦', '上', '下', '裡', '中', '旁', '邊', '後', '時']);
const PREFIX_WORDS = new Set(['把', '讓', '在', '用', '從', '向', '對', '和', '與', '而', '就', '很', '太', '更', '最', '還', '再', '可', '會', '要', '能']);

function segmentText(text) {
  if (typeof Intl?.Segmenter !== 'function') return text ? [text] : [];

  const segmenter = new Intl.Segmenter('zh-TW', { granularity: 'word' });
  const tokens = [];
  let buffer = '';

  const flush = () => {
    if (!buffer) return;
    tokens.push(...[...segmenter.segment(buffer)].map(({ segment }) => segment).filter(Boolean));
    buffer = '';
  };

  for (let index = 0; index < text.length;) {
    const phrase = PROTECTED_PHRASES.find((candidate) => text.startsWith(candidate, index));
    if (phrase) {
      flush();
      tokens.push(phrase);
      index += phrase.length;
    } else {
      buffer += text[index];
      index += 1;
    }
  }
  flush();
  return tokens;
}

function mergeSemanticTokens(tokens) {
  const merged = [];
  for (const token of tokens) {
    if (PUNCT_RE.test(token)) {
      if (merged.length > 0) merged[merged.length - 1] += token;
      else merged.push(token);
    } else if (SUFFIX_PARTICLES.has(token) && merged.length > 0) {
      merged[merged.length - 1] += token;
    } else if (PREFIX_WORDS.has(merged.at(-1)) && token.length <= 4) {
      merged[merged.length - 1] += token;
    } else {
      merged.push(token);
    }
  }
  return merged.filter(Boolean);
}

/**
 * 把一句例句拆成可重組的語意詞塊。
 *
 * 先保護固定詞組，再使用瀏覽器中文斷詞，最後合併助詞、介詞與標點；
 * 不再以「每兩個字」硬切，避免「一會兒」被拆開或留下孤單的「了／的」。
 * 教材若有特殊句型，可在 sentence_patterns[].example_parts 提供人工確認的詞塊，
 * buildRoundsFromExamples 會優先採用該資料。
 */
export function splitSentenceIntoChunks(sentence) {
  return mergeSemanticTokens(segmentText(sentence));
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
    for (const [index, sentence] of p.examples.entries()) {
      out.push({ pattern: p, sentence, parts: p.example_parts?.[index] });
    }
  }
  return out;
}

function buildRoundsFromExamples(examples, promptPrefix) {
  return examples
    .map(({ pattern, sentence, parts }) => {
      const manualParts = Array.isArray(parts) && parts.length >= 2 && parts.join('') === sentence ? parts : null;
      const chunks = manualParts || splitSentenceIntoChunks(sentence);
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
