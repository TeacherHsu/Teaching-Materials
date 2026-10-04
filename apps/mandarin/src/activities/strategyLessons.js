// 兩個試做的「學方法」內容（2026-10-04）。
// 找線索用本站自寫的短文（原創，不是課文），所以不用教室密碼也能做。
import { h } from '../utils/dom.js';
import { StrategyLesson, TapChoices, AskLine } from '../components/StrategyLesson.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { glyph } from '../components/HanziCompare.js';

// ── 讀懂課文：找線索（提取訊息）────────────────────────────
const DEMO = {
  passage: ['小安星期六去爺爺家。', '他先幫爺爺澆花，', '再和爺爺一起去市場買魚。', '回家後，奶奶煮了一鍋魚湯。'],
  question: '小安和爺爺去市場買什麼？',
  key: '市場',
  clue: 2,
  answer: '買魚',
};
const GUIDED = {
  passage: ['下課鐘響了，', '小美和同學在操場玩跳繩。', '上課前，她把跳繩收回教室。'],
  question: ['小美', '和同學', '在', '操場', '玩什麼？'],
  key: '操場',
  clue: 1,
  options: ['跳繩', '躲避球', '捉迷藏'],
  answer: '跳繩',
};

function markWord(text, word) {
  const i = text.indexOf(word);
  if (i < 0) return [text];
  return [text.slice(0, i), h('mark', { class: 'evidence__key strategy-mark' }, word), text.slice(i + word.length)];
}

function passageView(sentences, { clue = -1, key = '' } = {}) {
  return h('p', { class: 'strategy-passage', lang: 'zh-TW' }, sentences.map((s, i) => (
    i === clue ? h('span', { class: 'strategy-passage__clue' }, key ? markWord(s, key) : s) : s
  )));
}

export function clueStrategyLesson(onDone) {
  const q = (mark) => h('p', { class: 'quiz-stem' }, mark ? markWord(DEMO.question, DEMO.key) : DEMO.question);
  return StrategyLesson({
    title: '學方法：找線索',
    goal: '先找題目裡的關鍵詞，再到文章裡找一樣的詞，答案就在那一句。',
    frames: [
      { render: () => h('div', {}, [q(false), passageView(DEMO.passage)]), say: '先讀題目，再看短文。' },
      { render: () => h('div', {}, [q(true), passageView(DEMO.passage)]), say: `我先找題目裡比較特別的詞：「${DEMO.key}」。` },
      { render: () => h('div', {}, [q(true), passageView(DEMO.passage, { clue: DEMO.clue, key: DEMO.key })]), say: `再到短文裡找「${DEMO.key}」，在這一句。` },
      { render: () => h('div', {}, [q(true), passageView(DEMO.passage, { clue: DEMO.clue, key: DEMO.answer.slice(1) })]), say: `讀這一句：「${DEMO.passage[DEMO.clue].replace(/[，。]$/u, '')}」，所以答案是「${DEMO.answer}」。` },
    ],
    guided: (done) => {
      const box = h('div', {});
      const stepText = h('p', { class: 'strategy-lesson__ask' }, '第 1 步：點一下題目裡比較特別的關鍵詞。');
      // 這一行會隨步驟改變，喇叭念「當下」的文字
      const sayStep = SpeakButton({ text: () => stepText.textContent, ariaLabel: '聽這一步要做什麼', variant: 'speak-button--option' });
      const passage = h('div', { class: 'quiz-option-row' }, [
        passageView(GUIDED.passage),
        SpeakButton({ text: GUIDED.passage.join(''), label: '聽短文', variant: 'speak-button--option' }),
      ]);
      box.appendChild(h('div', { class: 'quiz-option-row strategy-lesson__ask-row' }, [stepText, sayStep]));
      box.appendChild(TapChoices({
        label: '題目的詞',
        items: GUIDED.question.map((t) => ({ text: t })),
        isRight: (it) => it.text === GUIDED.key,
        why: (it) => (it.text === '小美'
          ? '「小美」每一句都在講她，找一個更特別的詞。'
          : '這個詞在很多句子都可能出現，找一個「地方」的詞。'),
        onRight: () => {
          stepText.textContent = `第 2 步：在短文裡點出有「${GUIDED.key}」的那一句。`;
          box.appendChild(TapChoices({
            label: '短文的句子',
            items: GUIDED.passage.map((t) => ({ text: t })),
            isRight: (_, i) => i === GUIDED.clue,
            why: () => `這一句沒有「${GUIDED.key}」，再找找看。`,
            onRight: () => {
              stepText.textContent = '第 3 步：讀這一句，選出答案。';
              box.appendChild(TapChoices({
                label: '答案',
                items: GUIDED.options.map((t) => ({ text: t })),
                isRight: (it) => it.text === GUIDED.answer,
                why: () => `再讀一次：「${GUIDED.passage[GUIDED.clue]}」`,
                onRight: () => { stepText.textContent = '你用「找關鍵詞 → 找句子 → 讀那一句」找到答案了！'; done(); },
              }));
            },
          }));
        },
      }));
      box.appendChild(passage);
      return box;
    },
    onDone,
  });
}

// ── 認識生字：找部首 ─────────────────────────────────────
const VARIANT = {
  水: '氵', 手: '扌', 心: '忄', 人: '亻', 犬: '犭', 衣: '衤', 刀: '刂', 火: '灬', 艸: '艹', 辵: '辶',
  邑: '阝', 阜: '阝', 玉: '王', 肉: '月', 金: '釒', 糸: '糹', 言: '訁', 食: '飠', 示: '礻', 竹: '⺮',
};

/** 從本課生字挑兩個部首標得出來、部首不是整個字的字：一個示範、一個一起做。 */
export function pickRadicalChars(characters, parts) {
  const ok = (characters || []).filter((c) => {
    const r = parts?.radical_strokes?.[c.char];
    const s = parts?.chars?.[c.char]?.s;
    return r && s && r.length < s.length;
  });
  return ok.slice(0, 2);
}

function partGlyph(strokes, keep) {
  const marked = new Set(keep);
  return glyph(strokes.map((d, i) => (marked.has(i) ? d : '')).filter((_, i) => marked.has(i)), keep.map((_, i) => i));
}

export function radicalStrategyLesson(chars, parts, onDone) {
  const [demo, try1] = chars;
  const radicalOf = (c) => String(c.radical || '').normalize('NFKC');
  const form = (c) => (VARIANT[radicalOf(c)] ? `「${VARIANT[radicalOf(c)]}」（就是「${radicalOf(c)}」）` : `「${radicalOf(c)}」`);
  const big = (c, marked) => h('div', { class: 'strategy-glyph' }, [glyph(parts.chars[c.char].s, marked ? parts.radical_strokes[c.char] : [])]);
  return StrategyLesson({
    title: '學方法：找部首',
    goal: '部首常在字的左邊或上面，而且和字的意思有關。',
    frames: [
      { render: () => big(demo, false), say: `這是「${demo.char}」。我先看左邊和上面。` },
      { render: () => big(demo, true), say: `上色的這一部分是${form(demo)}。` },
      { render: () => big(demo, true), say: `「${demo.char}」的部首是「${radicalOf(demo)}」。部首常常告訴我們這個字和什麼有關。` },
    ],
    guided: (done) => {
      const s = parts.chars[try1.char].s;
      const rad = parts.radical_strokes[try1.char];
      const rest = s.map((_, i) => i).filter((i) => !rad.includes(i));
      const msg = h('p', { class: 'strategy-lesson__ask', role: 'status', 'aria-live': 'polite' });
      return h('div', {}, [
        AskLine(`「${try1.char}」拆成兩部分。點一下，哪一部分是部首？`),
        big(try1, false),
        TapChoices({
          label: '字的兩部分',
          items: [{ keep: rad, aria: '第一部分' }, { keep: rest, aria: '第二部分' }]
            .sort(() => (try1.char.charCodeAt(0) % 2 ? 1 : -1))
            .map((it) => ({ ...it, render: () => h('span', { class: 'strategy-part' }, [partGlyph(s, it.keep)]) })),
          isRight: (it) => it.keep === rad,
          why: () => '這一部分比較像是告訴我們讀音的。再看另一部分，和字的意思有沒有關係？',
          onRight: () => { msg.textContent = `「${try1.char}」的部首是「${radicalOf(try1)}」。`; done(); },
        }),
        msg,
      ]);
    },
    onDone,
    doneLabel: '用這個方法找本課的部首',
  });
}
