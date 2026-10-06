// 「認識生字」模組：三步依序呈現（一畫面一任務）
// 1. 字卡＋發音（CharacterCard 逐一瀏覽）
// 2. 看字選音（ChoiceQuiz，3–5 題一組，多組依序進行）
// 3. 部首分類（DragToSlot，同一組內部首不重複）
import { h, clear } from '../utils/dom.js';
import { StepJump } from '../components/StepJump.js';
import { shuffle as shuffled } from '../utils/shuffle.js';
import { chunkRounds } from '../utils/chunk.js';
import { CharacterCard } from '../components/CharacterCard.js';
import { CardWalkthrough } from '../components/CardWalkthrough.js';
import { filterByStatus } from '../utils/preview.js';
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { DragToSlot } from '../components/DragToSlot.js';
import { RadicalGlyph } from '../components/HanziCompare.js';
import { loadHanziParts, hanziPartsIfReady } from '../utils/hanziParts.js';
import { radicalStrategyLesson, pickRadicalChars } from './strategyLessons.js';
import { LibraryStrategy } from '../components/LibraryStrategy.js';
import { setTransferMode } from '../utils/scoreSession.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { buildExtensionLinks } from '../components/ExtensionLinks.js';
import { PronunciationNotice } from '../components/PronunciationNotice.js';
import { missingContentNotice } from './engine.js';
import { buildPronunciationItems } from './pronunciationQuestions.js';
import { getScaffoldLevel, shouldShowBackButton, EARLY_EXIT_LABEL } from '../utils/deviceSettings.js';

const ROUND_MAX = 5;
const MAX_DISPLAY_EXAMPLES = 3;


/** 依教材已審核的常用順序取前幾個，完整 examples 仍保留在資料檔。 */
function selectDisplayedExamples(examples) {
  return [...new Set((examples || []).filter(Boolean))].slice(0, MAX_DISPLAY_EXAMPLES);
}

/** 從本課語詞攤平出每個字的造詞範例，供 CharacterCard 缺 examples 時使用。 */
// 生字卡的「造詞」只顯示本課目標語詞（words[]，來自 05 語詞解釋）中含該字者；
// 06 字義分析的一般造詞（例：水牛、牛脾氣）不是本課語詞，不顯示（CF 2026-09-25）。
function buildExampleMap(lesson) {
  const map = new Map();
  const targets = (lesson.words || []).map((w) => w.word).filter(Boolean);
  for (const c of lesson.characters || []) {
    const hits = targets.filter((w) => w.includes(c.char));
    if (hits.length) map.set(c.char, selectDisplayedExamples(hits));
  }
  return map;
}

function withExamples(characters, lesson) {
  const exampleMap = buildExampleMap(lesson);
  return characters.map((c) => {
    if (c.examples && c.examples.length) return { ...c, examples: selectDisplayedExamples(c.examples) };
    const fallback = exampleMap.get(c.char);
    return fallback ? { ...c, examples: fallback } : c;
  });
}

/** 把生字依部首輪流分配到各組，確保同一組內部首不重複。 */
function buildRadicalRounds(characters) {
  const byRadical = new Map();
  for (const c of characters) {
    if (!byRadical.has(c.radical)) byRadical.set(c.radical, []);
    byRadical.get(c.radical).push(c);
  }
  const queues = [...byRadical.values()];
  const rounds = [];
  while (queues.some((q) => q.length)) {
    const round = [];
    for (const q of queues) {
      if (q.length && round.length < ROUND_MAX) round.push(q.shift());
    }
    if (round.length) rounds.push(round);
  }
  return rounds;
}

function pickDistractorRadicals(all, excludeRadicals, n) {
  const pool = [...new Set(all.map((c) => c.radical))].filter((r) => !excludeRadicals.has(r));
  return shuffled(pool).slice(0, n);
}

/**
 * 部首的三層提示：
 *   1 策略：部首常和字的意思有關
 *   2 縮小：部首常在左邊或上面，並劃掉一個錯誤選項（只剩兩個選項時不劃）
 *   3 示範：列出本課同部首的其他字——看得出共同的部分，就知道部首是哪個
 */
// 部首在字裡常變形：選項寫「手」，字裡長成「扌」。第 3 層要說清楚，不然學生找不到「手」。
const RADICAL_VARIANTS = {
  水: '氵', 手: '扌', 心: '忄', 人: '亻', 犬: '犭', 衣: '衤', 刀: '刂', 火: '灬', 艸: '艹', 辵: '辶',
  邑: '阝（右邊）', 阜: '阝（左邊）', 玉: '王', 肉: '月', 金: '釒', 糸: '糹', 言: '訁', 食: '飠', 示: '礻',
  竹: '⺮', 网: '罒', 老: '耂', 足: '⻊', 牛: '牜', 攴: '攵',
};

export function radicalHints(c, allCharacters, optionCount) {
  const same = (allCharacters || []).filter((o) => o.char !== c.char && o.radical === c.radical).map((o) => o.char);
  const plain = String(c.radical || '').normalize('NFKC');
  const variant = RADICAL_VARIANTS[plain];
  const variantNote = variant ? `「${plain}」當部首時常寫成「${variant}」。` : '';
  return [
    { text: `部首常常和字的意思有關。想一想「${c.char}」的意思和什麼有關？` },
    { text: '部首常在字的左邊或上面，先看那裡。', eliminate: optionCount >= 3 ? 1 : 0 },
    same.length
      ? { text: `${variantNote}這幾個字的部首都一樣：「${same.slice(0, 3).join('」「')}」。它們共同的部分就是部首。` }
      : { text: `${variantNote}把「${c.char}」拆成兩半，看哪一半和選項長得一樣。` },
  ];
}

// 變形部首 → 部首本字（選項顯示字裡看得到的樣子，答案仍是部首本字）
const VARIANT_TO_RADICAL = {
  氵: '水', 扌: '手', 忄: '心', 亻: '人', 犭: '犬', 衤: '衣', 刂: '刀', 灬: '火', 艹: '艸', 辶: '辵',
  王: '玉', 釒: '金', 糹: '糸', 訁: '言', 飠: '食', 礻: '示', '⺮': '竹', 罒: '网', 耂: '老', '⻊': '足', 牜: '牛', 攵: '攴',
};
const IDS = /[\u2FF0-\u2FFB]/u;

/**
 * 部首題以「這個字自己的部件」當選項（CF 2026-10-06：避免學生不假思索從別的部首裡猜）。
 * 例：初＝衤＋刀 → 選項「衤（衣）」「刀」，要判斷哪一個部件才是部首。
 * 拆不出兩個以上部件、或部首不在部件裡（如「大」「也」）時，退回原本的跨字選項。
 */
export function componentRadicalOptions(c, parts) {
  const d = parts?.chars?.[c.char]?.d;
  if (!d) return null;
  const leaves = [...new Set([...d].filter((x) => !IDS.test(x) && x !== '？'))];
  if (leaves.length < 2) return null;
  const radical = String(c.radical || '').normalize('NFKC');
  const baseOf = (x) => VARIANT_TO_RADICAL[x] || x.normalize('NFKC');
  // 「阝」左阜右邑、「月」可能是肉：只要部件的本字或字形等於部首就算
  const isRadical = (x) => baseOf(x) === radical || x.normalize('NFKC') === radical
    || (x === '阝' && (radical === '阜' || radical === '邑')) || (x === '月' && radical === '肉');
  const answers = leaves.filter(isRadical);
  if (answers.length !== 1) return null;
  const label = (x) => (baseOf(x) !== x ? `${x}（${baseOf(x)}）` : x);
  return {
    options: shuffled(leaves.map((x) => ({ id: `part:${x}`, label: label(x) }))),
    answerId: `part:${answers[0]}`,
    shown: answers[0],
  };
}

function buildRadicalDragItems(round, allCharacters, volume) {
  const roundRadicals = new Set(round.map((c) => c.radical));
  const parts = hanziPartsIfReady(volume);
  return round.map((c) => {
    const byParts = componentRadicalOptions(c, parts);
    const distractors = byParts ? [] : pickDistractorRadicals(allCharacters, roundRadicals, Math.max(1, getScaffoldLevel().optionCount - 1));
    const options = byParts ? byParts.options : shuffled([c.radical, ...distractors]).map((r) => ({ id: `radical:${r}`, label: r }));
    // 第 2 層提示：把字畫出來、部首那幾筆上色（資料載不到就只有文字提示）
    const glyphSlot = h('div', { class: 'hanzi-compare-slot' });
    glyphSlot.hidden = true;
    const hints = radicalHints(c, allCharacters, options.length);
    hints[1] = {
      ...hints[1],
      text: `${hints[1].text} 看看上色的地方。`,
      on: () => loadHanziParts(volume).then((data) => {
        const el = RadicalGlyph({ char: c.char, data });
        if (!el) return;
        glyphSlot.replaceChildren(el);
        glyphSlot.hidden = false;
      }),
    };
    return {
      id: `radical-item:${c.char}`,
      skill: 'char:radical',
      context: h('div', { class: 'idiom-builder__card' }, [
        h('p', { class: 'quiz-stem' }, byParts ? `「${c.char}」可以拆成這幾個部件，哪一個是部首？` : `「${c.char}」的部首是？`),
        glyphSlot,
      ]),
      speakText: byParts ? `${c.char}，可以拆成這幾個部件，哪一個是部首？` : `「${c.char}」的部首是？`,
      slotLabel: '？',
      options,
      answerId: byParts ? byParts.answerId : `radical:${c.radical}`,
      hint: '想一想這個字拆開來看，哪一部分是部首？',
      hints,
      explanation: byParts && byParts.shown !== String(c.radical).normalize('NFKC')
        ? `「${c.char}」的部首是「${String(c.radical).normalize('NFKC')}」，在字裡寫成「${byParts.shown}」。`
        : `「${c.char}」的部首是「${String(c.radical).normalize('NFKC')}」。`,
    };
  });
}

/**
 * @param {object} lesson
 * @param {() => void} onBack
 */
// 單課小考用：只出題、不畫面。和下面的 build*Activity 共用同一份出題邏輯，
// 題目才不會兩邊長得不一樣。
export function buildCharacterQuizItems(lesson) {
  const characters = withExamples(
    (lesson.characters || []).filter((c) => c.status === 'ready' || !c.status),
    lesson,
  );
  return buildPronunciationItems(characters, characters);
}

export function buildCharactersActivity(lesson, onBack) {
  const characters = withExamples(
    (lesson.characters || []).filter((c) => c.status === 'ready' || !c.status),
    lesson,
  );
  const choiceItems = buildPronunciationItems(characters, characters);
  const choiceRounds = chunkRounds(choiceItems);
  const radicalRounds = buildRadicalRounds(characters);
  const cardRounds = chunkRounds(characters, { max: 6 });   // 字卡一次最多 6 張，和題目的節奏不同

  const steps = [];
  let jump = null;
  if (characters.length > 0) steps.push('cards');
  if (choiceRounds.length > 0) steps.push('learn-sound', 'choice');
  // 試做：找部首之前先「學方法」（示範＋一起做），之後的部首題算遷移題
  const volume = String(lesson.lesson_id || '').slice(0, 7);
  let learnChars = radicalRounds.length > 0 ? pickRadicalChars(characters, hanziPartsIfReady(volume)) : [];
  if (learnChars.length === 2) steps.push('learn-radical');
  if (radicalRounds.length > 0) steps.push('radical');
  // 直接從網址進來、字形資料還沒載好時：載好後再把「學找部首」補進步驟（學生還沒走到部首題才補）
  if (radicalRounds.length > 0 && learnChars.length < 2) {
    loadHanziParts(volume).then((parts) => {
      const picked = pickRadicalChars(characters, parts);
      const at = steps.indexOf('radical');
      if (picked.length === 2 && !steps.includes('learn-radical') && stepIndex < at) {
        learnChars = picked;
        steps.splice(at, 0, 'learn-radical');
        jump?.update(stepIndex);
      }
    });
  }

  const container = h('div', {});
  let stepIndex = 0;
  let roundIndex = 0;
  let cardRoundIndex = 0;

  function renderStep() {
    clear(container);
    jump?.update(stepIndex);
    if (steps.length === 0) {
      container.appendChild(missingContentNotice('認識生字：教材審核中'));
      return;
    }
    const step = steps[stepIndex];
    const isLastStep = stepIndex === steps.length - 1;
    const stepLabel = `第 ${stepIndex + 1} 步／共 ${steps.length} 步`;

    if (step === 'cards') {
      const moreCards = cardRoundIndex < cardRounds.length - 1;
      container.appendChild(TaskBanner({
        label: '看看這一課的生字：點卡片上的按鈕可以聽發音',
        step: moreCards ? `${stepLabel} ・ 第 ${cardRoundIndex + 1} 組` : stepLabel,
      }));
      const strokeLinks = buildExtensionLinks(lesson, 'characters', {
        collapsible: false,
        filter: (extension) => extension.type === 'reading' && extension.title === '筆順練習(雄筆順)',
      });
      if (strokeLinks) container.appendChild(strokeLinks);
      const originByChar = new Map(
        filterByStatus(lesson.extensions || [])
          .filter((e) => e.module === 'characters' && e.type === 'reading' && e.char)
          .map((e) => [e.char, e]),
      );
      // 逐張點過才能繼續（CF 2026-10-02 指定）：原本整組攤開、按一下就過，
      // 學生可以完全不看。這一步的目的是「接觸」，不是評量，所以不計分。
      const walkthrough = CardWalkthrough({
        cards: cardRounds[cardRoundIndex].map((c) => ({
          el: CharacterCard(c, originByChar.get(c.char) || null, lesson.lesson_id),
          key: c.char,
        })),
        label: '點一下卡片，看過的會打勾',
        onAllSeen: () => {
          for (const btn of continueButtons) {
            btn.disabled = false;
            btn.removeAttribute('aria-disabled');
            btn.textContent = btn.dataset.readyLabel || btn.textContent;
          }
        },
      });
      const continueButtons = [];
      container.appendChild(walkthrough.status);
      container.appendChild(walkthrough.grid);
      const proceed = () => {
        if (moreCards) {
          cardRoundIndex += 1;
        } else if (isLastStep) {
          onBack();
          return;
        } else {
          stepIndex += 1;
          roundIndex = 0;
        }
        renderStep();
      };
      // 卡片還沒全部看過之前，「繼續」是停用的，按鈕上直接寫明原因。
      const makeContinue = (readyLabel, cls) => {
        const btn = h('button', {
          class: cls,
          type: 'button',
          disabled: 'disabled',
          'aria-disabled': 'true',
          onclick: proceed,
        }, '先把卡片都看過');
        btn.dataset.readyLabel = readyLabel;
        continueButtons.push(btn);
        return btn;
      };
      if (moreCards) {
        const actions = h('div', { class: 'activity-round-actions' });
        // 「本課先完成」預設不顯示，由教師設定控制（見 utils/deviceSettings.js）
        if (shouldShowBackButton(EARLY_EXIT_LABEL)) {
          actions.appendChild(h('button', { class: 'btn', type: 'button', onclick: onBack }, EARLY_EXIT_LABEL));
        }
        actions.appendChild(makeContinue('加練下一組', 'btn btn--primary'));
        container.appendChild(actions);
      } else {
        container.appendChild(makeContinue(isLastStep ? '完成' : '繼續：看字選音', 'btn btn--primary'));
      }
      container.appendChild(PronunciationNotice());
    } else if (step === 'choice') {
      const isLastRound = roundIndex === choiceRounds.length - 1;
      container.appendChild(
        TaskBanner({ label: '看字選出正確的注音', step: roundIndex === 0 ? '' : '加練挑戰' }),
      );
      container.appendChild(
        ChoiceQuiz({
          items: choiceRounds[roundIndex],
          backLabel: isLastRound ? (isLastStep ? '回課程首頁' : '繼續：部首分類') : '本課先完成',
          onBack: () => {
            if (!isLastRound) {
              onBack();
            } else if (isLastStep) {
              onBack();
            } else {
              stepIndex += 1;
              roundIndex = 0;
              renderStep();
            }
          },
          onContinue: isLastRound ? null : () => {
            roundIndex += 1;
            renderStep();
          },
        }),
      );
    } else if (step === 'learn-sound') {
      container.appendChild(LibraryStrategy('char-sound', () => {
        setTransferMode(true);
        stepIndex += 1;
        roundIndex = 0;
        renderStep();
      }, () => { stepIndex += 1; roundIndex = 0; renderStep(); }));
    } else if (step === 'learn-radical') {
      container.appendChild(radicalStrategyLesson(learnChars, hanziPartsIfReady(volume), () => {
        stepIndex += 1;
        roundIndex = 0;
        renderStep();
      }));
    } else if (step === 'radical') {
      const isLastRound = roundIndex === radicalRounds.length - 1;
      container.appendChild(
        TaskBanner({ label: '把生字分類到正確的部首', step: roundIndex === 0 ? '' : '加練挑戰' }),
      );
      container.appendChild(
        DragToSlot({
          items: buildRadicalDragItems(radicalRounds[roundIndex], characters, String(lesson.lesson_id || '').slice(0, 7))
            // 學過方法之後，示範、一起做以外的字都是新材料＝遷移題
            .map((it) => ({ ...it, transfer: steps.includes('learn-radical') && !learnChars.some((c) => it.id === `radical-item:${c.char}`) })),
          backLabel: isLastRound ? '回課程首頁' : '本課先完成',
          onContinue: isLastRound ? null : () => {
            roundIndex += 1;
            renderStep();
          },
          onBack: () => {
            if (!isLastRound) {
              onBack();
            } else {
              onBack();
            }
          },
        }),
      );
    }
  }

  // 題組跳轉列放在 container 外面：各步驟會 clear(container)，列不能跟著被清掉
  jump = StepJump({ steps, moduleKey: 'characters', onJump: (i) => { stepIndex = i; roundIndex = 0; cardRoundIndex = 0; renderStep(); } });
  renderStep();
  return h('div', {}, [jump.el, container]);
}
