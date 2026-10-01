// 「認識生字」模組：三步依序呈現（一畫面一任務）
// 1. 字卡＋發音（CharacterCard 逐一瀏覽）
// 2. 看字選音（ChoiceQuiz，3–5 題一組，多組依序進行）
// 3. 部首分類（DragToSlot，同一組內部首不重複）
import { h, clear } from '../utils/dom.js';
import { shuffle as shuffled } from '../utils/shuffle.js';
import { chunkRounds } from '../utils/chunk.js';
import { CharacterCard } from '../components/CharacterCard.js';
import { CardWalkthrough } from '../components/CardWalkthrough.js';
import { filterByStatus } from '../utils/preview.js';
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { DragToSlot } from '../components/DragToSlot.js';
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

function buildRadicalDragItems(round, allCharacters) {
  const roundRadicals = new Set(round.map((c) => c.radical));
  return round.map((c) => {
    const distractors = pickDistractorRadicals(allCharacters, roundRadicals, Math.max(1, getScaffoldLevel().optionCount - 1));
    const options = shuffled([c.radical, ...distractors]).map((r) => ({ id: `radical:${r}`, label: r }));
    return {
      id: `radical-item:${c.char}`,
      context: h('div', { class: 'idiom-builder__card' }, [
        h('p', { class: 'quiz-stem' }, `「${c.char}」的部首是？`),
      ]),
      speakText: `「${c.char}」的部首是？`,
      slotLabel: '？',
      options,
      answerId: `radical:${c.radical}`,
      hint: '想一想這個字拆開來看，哪一部分是部首？',
      explanation: `「${c.char}」的部首是「${c.radical}」。`,
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
  if (characters.length > 0) steps.push('cards');
  if (choiceRounds.length > 0) steps.push('choice');
  if (radicalRounds.length > 0) steps.push('radical');

  const container = h('div', {});
  let stepIndex = 0;
  let roundIndex = 0;
  let cardRoundIndex = 0;

  function renderStep() {
    clear(container);
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
    } else if (step === 'radical') {
      const isLastRound = roundIndex === radicalRounds.length - 1;
      container.appendChild(
        TaskBanner({ label: '把生字分類到正確的部首', step: roundIndex === 0 ? '' : '加練挑戰' }),
      );
      container.appendChild(
        DragToSlot({
          items: buildRadicalDragItems(radicalRounds[roundIndex], characters),
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

  renderStep();
  return container;
}
