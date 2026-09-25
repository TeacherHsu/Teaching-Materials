// Activity engine：把 lesson JSON 的 quiz/characters 資料接到對應元件，
// 元件本身完全不含教材內容，只吃資料。新增一課不需要碰這支檔案。

import { h, clear } from '../utils/dom.js';
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { MatchingGame } from '../components/MatchingGame.js';
import { TaskBanner } from '../components/TaskBanner.js';

/**
 * 「動手挑戰」依序拆成兩個子任務（先選擇題、後配對），畫面同時只呈現一個任務：
 * 完成選擇題才會出現配對，符合「一畫面一任務」。
 * @param {object} lesson 單課 JSON
 * @param {() => void} onBack
 */
export function buildChallengeActivity(lesson, onBack) {
  const choiceItems = (lesson.quiz || []).filter((q) => q.type === 'choice' && q.status === 'ready');
  const matchingItem = (lesson.quiz || []).find((q) => q.type === 'matching' && q.status === 'ready');

  const steps = [];
  if (choiceItems.length > 0) steps.push('choice');
  if (matchingItem) steps.push('matching');

  const container = h('div', {});
  let stepIndex = 0;

  function renderStep() {
    clear(container);
    if (steps.length === 0) {
      container.appendChild(missingContentNotice());
      return;
    }
    const step = steps[stepIndex];
    const isLastStep = stepIndex === steps.length - 1;
    const stepLabel = `第 ${stepIndex + 1} 步／共 ${steps.length} 步`;

    if (step === 'choice') {
      container.appendChild(TaskBanner({ label: '選出正確的注音', step: stepLabel }));
      container.appendChild(
        ChoiceQuiz({
          items: choiceItems,
          backLabel: isLastStep ? '回課程首頁' : '繼續：字詞配對',
          onBack: () => {
            if (isLastStep) {
              onBack();
            } else {
              stepIndex += 1;
              renderStep();
            }
          },
        }),
      );
    } else if (step === 'matching') {
      container.appendChild(TaskBanner({ label: matchingItem.stem || '字 ↔ 部首配對', step: stepLabel }));
      container.appendChild(
        MatchingGame({
          pairs: matchingItem.pairs,
          backLabel: '回課程首頁',
          onBack: () => onBack(),
        }),
      );
    }
  }

  renderStep();
  return container;
}

export function missingContentNotice(text = '此部分教材待補') {
  const div = document.createElement('div');
  div.className = 'missing-content';
  div.textContent = text;
  return div;
}
