// 「學會語詞」模組：三步依序呈現（一畫面一任務）
// 1. 看圖認識語詞（VocabularyCard，點選後顯示詞義）
// 2. 詞 ↔ 義配對（MatchingGame，3–5 題一組，多組依序進行）
// 3. 看義選詞（ChoiceQuiz，3–5 題一組，多組依序進行）
// 基礎／挑戰：以 word.level 欄位分層，缺欄位時依字數（≥3 字視為挑戰層）。
import { h, clear } from '../utils/dom.js';
import { VocabularyCard } from '../components/VocabularyCard.js';
import { MatchingGame } from '../components/MatchingGame.js';
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { missingContentNotice } from './engine.js';
import { chunkRounds } from '../utils/chunk.js';

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function wordLevel(word) {
  if (word.level === 'challenge' || word.level === 'basic') return word.level;
  return word.word && word.word.length >= 3 ? 'challenge' : 'basic';
}

function pickDistractorWords(all, exclude, n) {
  const pool = all.filter((w) => w.word !== exclude.word);
  return shuffled(pool).slice(0, n);
}

function buildChoiceItem(word, all) {
  const distractors = pickDistractorWords(all, word, 2);
  const options = shuffled([word, ...distractors].map((w) => w.word));
  return {
    id: `word-choice:${word.id || word.word}`,
    stem: `哪一個語詞的意思是「${word.meaning}」？`,
    options,
    answer: word.word,
    explanation: `「${word.word}」：${word.meaning}`,
    hints: ['再想想這個意思最常用在哪一個詞語裡。'],
  };
}

/**
 * @param {object} lesson
 * @param {() => void} onBack
 */
export function buildVocabularyActivity(lesson, onBack) {
  const words = (lesson.words || []).filter((w) => w.status === 'ready' && w.word && w.meaning);
  const basicFirst = [...words].sort((a, b) => (wordLevel(a) === wordLevel(b) ? 0 : wordLevel(a) === 'basic' ? -1 : 1));

  const recognitionRounds = chunkRounds(basicFirst, { min: 3, max: 5 });
  const matchingRounds = chunkRounds(basicFirst, { min: 3, max: 5 });
  const choiceRounds = chunkRounds(basicFirst, { min: 3, max: 5 }).map((round) => round.map((w) => buildChoiceItem(w, words)));

  const steps = [];
  if (recognitionRounds.length > 0) steps.push('recognition');
  if (matchingRounds.length > 0) steps.push('matching');
  if (choiceRounds.length > 0) steps.push('choice');

  const container = h('div', {});
  let stepIndex = 0;
  let roundIndex = 0;

  function renderStep() {
    clear(container);
    if (steps.length === 0) {
      container.appendChild(missingContentNotice('學會語詞：教材審核中'));
      return;
    }
    const step = steps[stepIndex];
    const isLastStep = stepIndex === steps.length - 1;
    const stepLabel = `第 ${stepIndex + 1} 步／共 ${steps.length} 步`;

    if (step === 'recognition') {
      const isLastRound = roundIndex === recognitionRounds.length - 1;
      container.appendChild(
        TaskBanner({
          label: '看圖片認識語詞：點選卡片查看解釋',
          step: stepLabel,
        }),
      );
      const grid = h('div', { class: 'card-grid' });
      for (const w of recognitionRounds[roundIndex]) grid.appendChild(VocabularyCard(w));
      container.appendChild(grid);
      const nextBtn = h(
        'button',
        { class: 'btn', type: 'button', style: 'margin-top:16px' },
        isLastRound ? (isLastStep ? '完成' : '繼續：詞義配對') : '下一組',
      );
      nextBtn.addEventListener('click', () => {
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
      });
      container.appendChild(nextBtn);
    } else if (step === 'matching') {
      const isLastRound = roundIndex === matchingRounds.length - 1;
      container.appendChild(
        TaskBanner({ label: '把語詞和意思配對起來', step: `${stepLabel} ・ 第 ${roundIndex + 1} 組／共 ${matchingRounds.length} 組` }),
      );
      const pairs = matchingRounds[roundIndex].map((w) => ({ left: w.word, right: w.meaning }));
      container.appendChild(
        MatchingGame({
          pairs,
          backLabel: isLastRound ? (isLastStep ? '回課程首頁' : '繼續：看義選詞') : '再來一組',
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
    } else if (step === 'choice') {
      const isLastRound = roundIndex === choiceRounds.length - 1;
      container.appendChild(
        TaskBanner({ label: '看意思選出正確的語詞', step: `${stepLabel} ・ 第 ${roundIndex + 1} 組／共 ${choiceRounds.length} 組` }),
      );
      container.appendChild(
        ChoiceQuiz({
          items: choiceRounds[roundIndex],
          backLabel: isLastRound ? '回課程首頁' : '再來一組',
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
