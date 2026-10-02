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
import { SentenceWriter } from '../components/SentenceWriter.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { CardWalkthrough } from '../components/CardWalkthrough.js';
import { speak } from '../utils/speech.js';
import { getScaffoldLevelKey } from '../utils/deviceSettings.js';
import { missingContentNotice } from './engine.js';
import { chunkRounds } from '../utils/chunk.js';
import { filterByStatus, isPreview } from '../utils/preview.js';
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { shuffle } from '../utils/shuffle.js';
import { getScaffoldLevel } from '../utils/deviceSettings.js';
import {
  connectivesInStructure, matchPair, blankConnectives, connectiveDistractors, pairLabel,
} from '../utils/connectives.js';

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
export function splitSentenceIntoChunks(sentence, maxChunks = Infinity) {
  return coarsenChunks(mergeSemanticTokens(segmentText(sentence)), maxChunks);
}

// 句子重組的詞塊數依組別（CF 2026-10-03：詞塊過於細碎）。
// 原本一句「我喜歡吃肉羹，不是因為它的味道，而是因為可以跟媽媽撒嬌」會被切成
// 14 塊，排列組合太多，學生在拼字面而不是在理解句子結構。
export const CHUNK_TARGET = { support: 3, standard: 4, challenge: 5 };

/**
 * 把細詞塊合併到最多 target 塊。
 * - 不跨標點合併（「肉羹，」和「不是」之間是自然的分句處），除非分句本身就超過 target。
 * - 每次合併「合起來最短」的相鄰兩塊，讓塊的長度平均。
 * - 單字詞（我、他、跟、吃）優先黏到後面：中文的單字代名詞、介詞、動詞
 *   通常和後面的詞是一個意群（「他卻沒有」「跟媽媽」「吃肉羹」）。
 * - 「……的」要接住後面的名詞，太短的句尾併到前面，不留孤單的「事，」。
 */
/**
 * 排句子時把關聯詞獨立成一塊（參考站做法：可是／雖然／外面下著大雨，／我們還是準時到校。）。
 * 句型練習要練的正是「關聯詞放在哪裡」；關聯詞黏在分句裡，學生排的只是分句順序。
 * 關聯詞分兩類：
 * - 本身就在分句開頭的（先、再、最後、不是、而是、雖然、可是……）：在哪裡都切。
 * - 跟在主語後面的副詞（卻、也、就、還……）：只在句首或標點後切；
 *   「他卻沒有放棄」硬切會留下孤單的「他」。
 */
const ADVERB_CONNECTIVES = new Set(['卻', '也', '就', '還', '才', '都', '便', '仍', '又', '更', '一']);

export function splitWithConnectives(sentence, connectives, target) {
  const words = [...new Set(connectives)].filter(Boolean).sort((a, b) => b.length - a.length);
  if (!words.length) return null;
  const blocks = [];
  let rest = sentence;
  let clauseStart = true;
  let buffer = '';
  while (rest) {
    const hit = words.find((w) => rest.startsWith(w) && (clauseStart || !ADVERB_CONNECTIVES.has(w)));
    if (hit) {
      if (buffer) blocks.push(buffer);
      buffer = '';
      blocks.push(hit);
      rest = rest.slice(hit.length);
      clauseStart = false;
      continue;
    }
    const ch = rest[0];
    buffer += ch;
    rest = rest.slice(1);
    clauseStart = /[，。！？、；：]/u.test(ch);
  }
  if (buffer) blocks.push(buffer);
  const connectiveCount = blocks.filter((b) => words.includes(b)).length;
  // 沒切到關聯詞，或只切出兩塊（排兩塊沒有練習價值），就退回一般切法
  if (connectiveCount === 0 || blocks.length < 3) return null;
  // 非關聯詞的分句若太長，再用一般規則切開，但總塊數不超過 target＋關聯詞數
  const budget = Math.max(target, connectiveCount + 2);
  if (blocks.length >= budget) return blocks;
  const out = [];
  const spare = budget - blocks.length;
  let extra = spare;
  for (const block of blocks) {
    // 分句十個字以內就保持完整，切開反而打斷意群（「外面下著／大雨」）
    if (words.includes(block) || extra <= 0 || block.length <= 10) { out.push(block); continue; }
    const pieces = coarsenChunks(mergeSemanticTokens(segmentText(block)), 1 + Math.min(extra, 1));
    extra -= pieces.length - 1;
    out.push(...pieces);
  }
  return out;
}

/**
 * 一句例句在目前組別下要切成哪些詞塊。活動和測試都用這一個函式，答案才一致。
 * 優先序：教師人工確認的詞塊 → 關聯詞獨立成塊（中、高組）→ 一般語意切法。
 */
export function chunksForExample(pattern, sentence, manualParts, levelKey = getScaffoldLevelKey()) {
  if (manualParts) return manualParts;
  const target = CHUNK_TARGET[levelKey] || 4;
  // 低組只排分句（塊數少、負荷低）；中、高組要放對關聯詞
  const withConnectives = levelKey !== 'support'
    // 只用關聯詞表認得的詞：結構字串常是「一＋量詞＋又＋一＋量詞」，拆字串會把「量詞」也當關聯詞
    ? splitWithConnectives(sentence, connectivesInStructure(pattern?.structure), target)
    : null;
  return withConnectives || splitSentenceIntoChunks(sentence, target);
}

export function coarsenChunks(tokens, target) {
  const blocks = [...tokens];
  if (!Number.isFinite(target) || blocks.length <= target) return blocks;
  const endsClause = (t) => /[，。！？、；：]$/u.test(t);
  const cost = (a, b) => a.length + b.length
    - (a.length === 1 ? 2 : 0)              // 單字黏後面
    - (/的$/u.test(a) ? 3 : 0)              // 「不公平的」要接住「事」
    - (b.length <= 2 && endsClause(b) ? 2 : 0); // 短句尾「事，」「憤慨。」併到前面
  while (blocks.length > target) {
    let best = -1;
    let bestCost = Infinity;
    for (const crossClause of [false, true]) {
      for (let i = 0; i < blocks.length - 1; i += 1) {
        if (!crossClause && endsClause(blocks[i])) continue;
        const c = cost(blocks[i], blocks[i + 1]);
        if (c < bestCost) { bestCost = c; best = i; }
      }
      if (best >= 0) break;
    }
    blocks.splice(best, 2, blocks[best] + blocks[best + 1]);
  }
  return blocks;
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
    .filter((p) => !isAbstractPattern(p))
    .map((p) => ({ left: p.head, right: p.description }));
}

/**
 * 「遞進複句」「把字句」這類句型名稱是抽象術語，右邊配的往往是造句指示
 * （「依照句型寫一句：先說表面的意義……」）而不是定義——學生沒辦法從字面配對
 * （CF 2026-10-03）。這類改成句型卡：看例句、聽一遍，而不是考術語。
 */
export function isAbstractPattern(pattern) {
  return /句$/u.test(pattern.head || '');
}

/** 從句型結構「不是……，而是……」「雖然＋情況，卻＋結果」取出關聯詞。 */
export function connectivesOf(structure) {
  return String(structure || '')
    .split(/[＋+…，,、。（）()「」\s]+/u)
    .map((w) => w.trim())
    .filter((w) => w && w.length <= 3 && !/情況|結果|行動|原因|狀態|事情|動作/u.test(w));
}

/** 句型卡資料：句型名、關聯詞、一句例句（要有核准例句才出卡）。 */
function readyPatternCards(lesson) {
  const withExamples = new Map(
    filterByStatus(lesson.sentence_patterns || [], { statusKey: 'examples_status' })
      .filter((p) => p.examples && p.examples.length)
      .map((p) => [p.id || p.head, p.examples[0]]),
  );
  return filterByStatus(lesson.sentence_patterns || [])
    .filter((p) => p.head && isAbstractPattern(p))
    .map((p) => ({ head: p.head, structure: p.structure || '', example: withExamples.get(p.id || p.head) }))
    .filter((card) => card.example);
}

// ── 選關聯詞（參考站句型練習的第 3 步） ─────────────────────
// 例句的關聯詞挖空，從不同關係類型的關聯詞組中選。
// 排句子練的是「關聯詞放哪裡」，這一步練的是「該用哪一組」。
const TYPE_HINTS = {
  轉折: '前後兩句的意思是相反的嗎？',
  因果: '前面是不是後面的原因？',
  遞進: '後面是不是比前面說得更多、更進一步？',
  假設: '前面是不是「如果發生了」的情況？',
  條件: '是不是要先做到前面，才會有後面？',
  承接: '事情是不是一件接著一件發生？',
  並列: '是不是兩件事同時在做？',
  讓步: '是不是就算前面這樣，後面也不改變？',
  取捨: '是不是先說不是哪個，再說真正是哪個？',
};

/** 同一個句型的另一句例句（關聯詞完整的），當選關聯詞第 3 層的示範。 */
function modelSentence(pattern, current, pair) {
  return (pattern.examples || []).find((ex) => ex !== current && pair.words.every((w) => ex.includes(w))) || null;
}

export function buildConnectiveItems(lesson, optionCount = 3, shuffleImpl = shuffle) {
  const items = [];
  const patterns = filterByStatus(lesson.sentence_patterns || [], { statusKey: 'examples_status' })
    .filter((p) => p.structure && p.examples && p.examples.length);
  for (const pattern of patterns) {
    let pair = matchPair(connectivesInStructure(pattern.structure));
    if (!pair) continue;
    let distractors = connectiveDistractors(pair, optionCount - 1, shuffleImpl);
    // 「先……再……最後」找不到三個詞的誘答，改挖前兩個
    if (!distractors.length && pair.words.length > 2) {
      pair = matchPair(pair.words.slice(0, 2));
      if (!pair) continue;
      distractors = connectiveDistractors(pair, optionCount - 1, shuffleImpl);
    }
    if (!distractors.length) continue;
    const sentence = pattern.examples.find((ex) => blankConnectives(ex, pair.words));
    if (!sentence) continue;
    const parts = blankConnectives(sentence, pair.words);
    const answer = pairLabel(pair.words);
    const readable = parts.reduce((acc, part, i) => acc + part + (i < pair.words.length ? '（空格）' : ''), '');
    items.push({
      id: `connective:${lesson.lesson_id}:${pattern.id || pattern.head}`,
      stem: '空格要填哪一組關聯詞？',
      readAllStem: `${readable}${/[。！？]$/u.test(readable) ? '' : '。'}空格要填哪一組關聯詞？`,
      stemContent: h('div', { class: 'connective-quiz' }, [
        h('p', { class: 'connective-quiz__sentence' }, parts.flatMap((part, i) => (
          i < pair.words.length ? [part, h('span', { class: 'connective-quiz__blank', 'aria-label': '空格' }, '')] : [part]
        ))),
        h('p', { class: 'quiz-stem' }, '空格要填哪一組關聯詞？'),
      ]),
      options: shuffleImpl([answer, ...distractors.map((d) => pairLabel(d.words))]),
      answer,
      explanation: `答案是「${answer}」。`,
      // 選關聯詞的三層：1 想關係 → 2 劃掉一個 → 3 看同一組關聯詞的另一個例句（示範）
      hints: [
        { text: TYPE_HINTS[pair.type] || '想一想前後兩句是什麼關係。' },
        { text: '先把放進去讀起來最不通的那一組劃掉。', eliminate: optionCount >= 3 ? 1 : 0 },
        modelSentence(pattern, sentence, pair)
          ? { text: `看看另一個例子：「${modelSentence(pattern, sentence, pair)}」` }
          : { text: `把每一組放進句子讀一遍，哪一組最通順？` },
      ],
    });
  }
  return items;
}

const NEXT_STEP_LABEL = {
  patterns: '繼續：認識句型',
  matching: '繼續：短語搭配',
  ordering: '繼續：句子重組',
  connectives: '繼續：選關聯詞',
  builder: '繼續：仿寫選填',
  write: '繼續：自己寫一句',
};

const CARD_HUES = ['blue', 'teal', 'purple', 'terracotta', 'rose', 'olive'];

// 句型的意思用孩子聽得懂的話說（參考站的做法：「前後意思相反或轉彎」）。
// 術語本身不考，但知道「這種句子在做什麼」，學生才會用。
const PATTERN_MEANINGS = {
  轉折: '前面和後面的意思相反，或是轉了一個彎。',
  遞進: '後面比前面更進一步、說得更多。',
  並列: '兩件事一起說，一樣重要。',
  承接: '事情一件接著一件，照順序發生。',
  因果: '前面是原因，後面是結果。',
  條件: '要先做到前面，才會有後面。',
  假設: '如果前面發生了，就會有後面的結果。',
  讓步: '就算前面這樣，後面還是不會改變。',
  選擇: '從兩個裡面選一個。',
  目的: '後面是做前面這件事的目的。',
  把字: '說出把一樣東西怎麼處理了。',
  被字: '說出一樣東西被別人怎麼了。',
};
export function patternMeaning(head) {
  const key = Object.keys(PATTERN_MEANINGS).find((k) => String(head || '').startsWith(k));
  return key ? PATTERN_MEANINGS[key] : '';
}

/** 例句中把關聯詞用卡片同色標出來，學生看得到「句型長在句子的哪裡」。 */
function highlightConnectives(sentence, words) {
  if (!words.length) return [sentence];
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gu');
  return sentence.split(re).filter(Boolean).map((part) => (
    words.includes(part) ? h('mark', { class: 'pattern-card__key' }, part) : part
  ));
}

function PatternCard(card, index) {
  const hue = CARD_HUES[index % CARD_HUES.length];
  const words = connectivesOf(card.structure);
  const meaning = patternMeaning(card.head);
  return h('div', { class: `pattern-card pattern-card--${hue}` }, [
    h('p', { class: 'pattern-card__name' }, card.head),
    words.length ? h('p', { class: 'pattern-card__frame' }, words.join(' …… ')) : null,
    meaning ? h('p', { class: 'pattern-card__meaning' }, meaning) : null,
    h('p', { class: 'pattern-card__example' }, highlightConnectives(card.example, words)),
  ].filter(Boolean));
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
      const chunks = chunksForExample(pattern, sentence, manualParts);
      if (chunks.length < 2) return null;
      // 排句子的第 1 層提示：有關聯詞就先找關聯詞（它決定句子的骨架），
      // 沒有就先找「誰」。之後每按一次提示會標亮下一塊（SentenceOrdering）。
      const lead = connectivesInStructure(pattern.structure)[0];
      return {
        prompt: promptPrefix,
        parts: chunks,
        solution: chunks,
        hint: lead
          ? `先找關聯詞「${lead}」，想想它要放在哪裡。`
          : '先找句子的主角是「誰」，再找他「做什麼」。',
        draft: pattern.examples_status === 'draft',
        pattern,
      };
    })
    .filter(Boolean);
}

function appendPatternContext(round, container) {
  const pattern = round.pattern;
  if (!pattern?.show_practice_context) return;

  const fields = [
    ['說明', pattern.description],
    ['結構', pattern.structure],
    ['練習引導', pattern.guide],
    ['課文原句', pattern.course_sentence],
  ].filter(([, value]) => value);
  const spokenText = fields.map(([label, value]) => `${label}：${value}`).join('；');
  container.appendChild(h('aside', { class: 'sentence-pattern-context', role: 'note' }, [
    h('div', { class: 'sentence-pattern-context__head' }, [
      h('p', { class: 'sentence-pattern-context__title' }, `${pattern.category || '句型'}提示`),
      SpeakButton({ text: spokenText, label: '聽句型提示', showLabel: true, variant: 'speak-button--option speak-button--audio-label' }),
    ]),
    ...fields.map(([label, value]) => h('p', { class: 'sentence-pattern-context__line' }, [
      h('strong', {}, `${label}：`),
      value,
    ])),
  ]));
}

/**
 * @param {object} lesson
 * @param {() => void} onBack
 */
export function buildSentencePracticeActivity(lesson, onBack) {
  const matchingPairs = readyMatchingPairs(lesson);
  const matchingRounds = chunkRounds(matchingPairs);

  const allExamples = flattenExamples(lesson);
  // 句子重組用每個句型的第 1 句；仿寫選填使用其他例句，
  // 讓完整例句都能練到，並避免同一句重複出現在兩步驟。
  const seenPatternIds = new Map();
  const orderingExamples = [];
  const builderExamples = [];
  for (const ex of allExamples) {
    const count = seenPatternIds.get(ex.pattern.id) || 0;
    seenPatternIds.set(ex.pattern.id, count + 1);
    if (count === 0) orderingExamples.push(ex);
    else if (count === 1 || ex.pattern.practice_all_examples) builderExamples.push(ex);
  }
  if (builderExamples.length === 0) builderExamples.push(...orderingExamples);

  const orderingRounds = chunkRounds(buildRoundsFromExamples(orderingExamples, '請把下面的詞語排成一句通順的句子'), { min: 1, max: 3 });
  const builderRounds = chunkRounds(buildRoundsFromExamples(builderExamples, '請選出正確的詞語，仿照句型組成一句話'), { min: 1, max: 3 });

  const patternCards = readyPatternCards(lesson);
  const steps = [];
  if (patternCards.length > 0) steps.push('patterns');
  if (matchingRounds.length > 0) steps.push('matching');
  if (orderingRounds.length > 0) steps.push('ordering');
  const connectiveItems = buildConnectiveItems(lesson, Math.max(2, getScaffoldLevel().optionCount));
  if (connectiveItems.length > 0) steps.push('connectives');
  if (builderRounds.length > 0) steps.push('builder');
  // 最後一步：用句型自己寫一句話，交給老師看。
  // 排在組句之後——先看過句型怎麼用、組過幾句，才有東西可以仿。
  const writablePatterns = filterByStatus(lesson.sentence_patterns || [])
    .filter((pattern) => pattern.structure || pattern.head);
  if (writablePatterns.length > 0) steps.push('write');

  const container = h('div', {});
  let stepIndex = 0;
  let roundIndex = 0;
  let itemIndex = 0;
  let coreComplete = false;

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
    const taskLabel = coreComplete ? '加練挑戰' : '';

    if (step === 'patterns') {
      container.appendChild(TaskBanner({ label: '認識句型：點一下卡片聽聽看', step: taskLabel }));
      const advance = h('button', { class: 'btn btn--primary', type: 'button', disabled: true, 'aria-disabled': 'true' },
        '每一張都點過才能繼續');
      const walkthrough = CardWalkthrough({
        cards: patternCards.map((card, i) => {
          const el = PatternCard(card, i);
          // 點卡片就念出來：句型名稱＋例句。學生先聽到句型「用起來」的樣子，
          // 而不是先背術語。
          el.addEventListener('click', () => speak(`${card.head}。${patternMeaning(card.head)}例如：${card.example}`));
          return { el, key: `${card.head}:${i}` };
        }),
        label: '點一下卡片，會念給你聽',
        onAllSeen: () => {
          advance.disabled = false;
          advance.removeAttribute('aria-disabled');
          advance.textContent = isLastStep ? '回課程首頁' : '繼續';
        },
      });
      advance.addEventListener('click', () => {
        if (advance.disabled) return;
        if (isLastStep) { onBack(); return; }
        stepIndex += 1;
        roundIndex = 0;
        itemIndex = 0;
        renderStep();
      });
      container.appendChild(walkthrough.status);
      container.appendChild(walkthrough.grid);
      container.appendChild(h('div', { class: 'quiz-option-row' }, [advance]));
    } else if (step === 'matching') {
      const isLastRound = roundIndex === matchingRounds.length - 1;
      const canContinue = !isLastRound || !isLastStep;
      container.appendChild(
        TaskBanner({ label: '短語搭配：把語詞和意思配對起來', step: taskLabel }),
      );
      container.appendChild(
        MatchingGame({
          pairs: matchingRounds[roundIndex],
          instructions: '選左邊的語詞，再選右邊的意思。',
          backLabel: canContinue ? '本課先完成' : '回課程首頁',
          onBack,
          onContinue: canContinue ? () => {
            coreComplete = true;
            if (!isLastRound) {
              roundIndex += 1;
            } else {
              stepIndex += 1;
              roundIndex = 0;
              itemIndex = 0;
            }
            renderStep();
          } : null,
          continueLabel: isLastRound ? (NEXT_STEP_LABEL[steps[stepIndex + 1]] || '繼續') : '加練下一組',
        }),
      );
    } else if (step === 'ordering') {
      const group = orderingRounds[roundIndex];
      const round = group[itemIndex];
      const isLastRound = roundIndex === orderingRounds.length - 1;
      const isLastItem = itemIndex === group.length - 1;
      const hasNextItem = !isLastItem;
      const canContinue = hasNextItem || !isLastRound || !isLastStep;
      const continueLabel = hasNextItem
        ? '下一題'
        : !isLastRound
          ? '加練下一組'
          : !isLastStep
            ? NEXT_STEP_LABEL[steps[stepIndex + 1]] || '繼續'
            : '完成';
      container.appendChild(TaskBanner({ label: '句子重組', step: taskLabel }));
      appendPatternContext(round, container);
      draftNoticeIfNeeded(group, itemIndex);
      container.appendChild(
        SentenceOrdering({
          ...round,
          backLabel: canContinue ? '本課先完成' : '回課程首頁',
          onBack,
          onContinue: canContinue ? () => {
            if (!hasNextItem) coreComplete = true;
            if (hasNextItem) {
              itemIndex += 1;
            } else if (!isLastRound) {
              roundIndex += 1;
              itemIndex = 0;
            } else {
              stepIndex += 1;
              roundIndex = 0;
              itemIndex = 0;
            }
            renderStep();
          } : null,
          continueLabel,
        }),
      );
    } else if (step === 'connectives') {
      container.appendChild(TaskBanner({ label: '選關聯詞：空格要填哪一組？', step: taskLabel }));
      container.appendChild(ChoiceQuiz({
        items: connectiveItems,
        backLabel: isLastStep ? '回課程首頁' : '本課先完成',
        onBack,
        onContinue: isLastStep ? null : () => {
          stepIndex += 1;
          roundIndex = 0;
          itemIndex = 0;
          renderStep();
        },
        continueLabel: NEXT_STEP_LABEL[steps[stepIndex + 1]] || '繼續',
      }));
    } else if (step === 'builder') {
      const group = builderRounds[roundIndex];
      const round = group[itemIndex];
      const isLastRound = roundIndex === builderRounds.length - 1;
      const isLastItem = itemIndex === group.length - 1;
      const hasNextItem = !isLastItem;
      const canContinue = hasNextItem || !isLastRound;
      container.appendChild(TaskBanner({ label: '仿寫選填', step: taskLabel }));
      appendPatternContext(round, container);
      draftNoticeIfNeeded(group, itemIndex);
      container.appendChild(SentenceBuilder({
        prompt: round.prompt,
        bank: round.parts,
        solution: round.solution,
        backLabel: canContinue ? '本課先完成' : '回課程首頁',
        onBack,
        onContinue: canContinue ? () => {
          if (!hasNextItem) coreComplete = true;
          if (hasNextItem) {
            itemIndex += 1;
          } else {
            roundIndex += 1;
            itemIndex = 0;
          }
          renderStep();
        } : null,
        continueLabel: hasNextItem ? '下一題' : '加練下一組',
      }));
    } else if (step === 'write') {
      // 一課只寫一句：對特教學生，寫一句好的比趕三句有用。挑第一個句型。
      const pattern = writablePatterns[0];
      container.appendChild(TaskBanner({ label: '自己寫一句話', step: taskLabel }));
      container.appendChild(
        SentenceWriter({
          lessonId: lesson.lesson_id,
          pattern,
          onDone: () => { coreComplete = true; },
          onBack,
          backLabel: '回課程首頁',
        }),
      );
    }
  }

  renderStep();
  return container;
}
