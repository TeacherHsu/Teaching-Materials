// Activity engine：把 lesson JSON 的 quiz/characters 資料接到對應元件，
// 元件本身完全不含教材內容，只吃資料。新增一課不需要碰這支檔案。

import { h, clear } from '../utils/dom.js';
import { StepJump } from '../components/StepJump.js';
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { MatchingGame } from '../components/MatchingGame.js';
import { MemoryGame } from '../components/MemoryGame.js';
import { getScaffoldLevel } from '../utils/deviceSettings.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { chunkRounds } from '../utils/chunk.js';

/**
 * 「動手挑戰」依序拆成兩個子任務（先選擇題、後配對），畫面同時只呈現一個任務：
 * 完成選擇題才會出現配對，符合「一畫面一任務」。
 * @param {object} lesson 單課 JSON
 * @param {() => void} onBack
 */
export function buildChallengeActivity(lesson, onBack) {
  const choiceItems = (lesson.quiz || []).filter((q) => q.type === 'choice' && q.status === 'ready');
  const matchingItem = (lesson.quiz || []).find((q) => q.type === 'matching' && q.status === 'ready');
  const choiceRounds = chunkRounds(choiceItems);
  const matchingRounds = chunkRounds(matchingItem?.pairs || []);

  const steps = [];
  let jump = null;
  if (choiceRounds.length > 0) steps.push('choice');
  if (matchingRounds.length > 0) steps.push('matching');

  const container = h('div', {});
  let stepIndex = 0;
  let roundIndex = 0;
  let coreComplete = false;

  function renderStep() {
    clear(container);
    jump?.update(stepIndex);
    if (steps.length === 0) {
      container.appendChild(missingContentNotice());
      return;
    }
    const step = steps[stepIndex];
    const isLastStep = stepIndex === steps.length - 1;
    const taskLabel = coreComplete ? '加練挑戰' : '';

    if (step === 'choice') {
      const isLastRound = roundIndex === choiceRounds.length - 1;
      const canContinue = !isLastRound || !isLastStep;
      container.appendChild(TaskBanner({ label: '選出正確的注音', step: taskLabel }));
      container.appendChild(
        ChoiceQuiz({
          items: choiceRounds[roundIndex],
          backLabel: canContinue ? '本課先完成' : '回課程首頁',
          onBack: () => {
            onBack();
          },
          onContinue: canContinue ? () => {
            coreComplete = true;
            if (!isLastRound) roundIndex += 1;
            else { stepIndex += 1; roundIndex = 0; }
            renderStep();
          } : null,
          continueLabel: isLastRound ? '繼續：字詞配對' : '加練下一組',
        }),
      );
    } else if (step === 'matching') {
      const isLastRound = roundIndex === matchingRounds.length - 1;
      const canContinue = !isLastRound;
      container.appendChild(TaskBanner({ label: matchingItem?.stem || '字 ↔ 部首配對', step: taskLabel }));
      container.appendChild(
        (getScaffoldLevel().unlockMemory ? MemoryGame : MatchingGame)({
          pairs: matchingRounds[roundIndex],
          backLabel: canContinue ? '本課先完成' : '回課程首頁',
          onBack,
          onContinue: canContinue ? () => {
            coreComplete = true;
            roundIndex += 1;
            renderStep();
          } : null,
          continueLabel: '加練下一組',
        }),
      );
    }
  }

  // 題組跳轉列放在 container 外面：各步驟會 clear(container)，列不能跟著被清掉
  jump = StepJump({ steps, moduleKey: '', onJump: (i) => { stepIndex = i; roundIndex = 0; renderStep(); } });
  renderStep();
  return h('div', {}, [jump.el, container]);
}

export function missingContentNotice(text = '此部分教材待補') {
  const div = document.createElement('div');
  div.className = 'missing-content';
  div.textContent = text;
  return div;
}
