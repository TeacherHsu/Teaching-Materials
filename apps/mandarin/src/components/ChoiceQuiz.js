import { h, clear } from '../utils/dom.js';
import { ProgressIndicator } from './ProgressIndicator.js';
import { HintPanel } from './HintPanel.js';
import { CompletionFeedback } from './CompletionFeedback.js';

/**
 * 選擇題引擎：一組 3–5 題、逐題作答、答錯給 hint 而非只有 X。
 * 鍵盤可操作（原生 button，Tab/Enter 即可）。
 * @param {{items: Array, onComplete?: (correct:number, total:number)=>void, onBack?: () => void}} opts
 */
export function ChoiceQuiz({ items, onComplete, onBack }) {
  const root = h('div', { class: 'quiz-panel' });
  let index = 0;
  let correctCount = 0;
  let answered = false;

  function render() {
    clear(root);
    if (index >= items.length) {
      root.appendChild(
        CompletionFeedback({
          correct: correctCount,
          total: items.length,
          onRetry: () => {
            index = 0;
            correctCount = 0;
            render();
          },
          onBack,
        }),
      );
      if (onComplete) onComplete(correctCount, items.length);
      return;
    }
    const item = items[index];
    answered = false;
    root.appendChild(ProgressIndicator({ current: index + 1, total: items.length }));
    root.appendChild(h('p', { class: 'quiz-stem' }, item.stem));

    const optionsWrap = h('div', { class: 'quiz-options', role: 'group', 'aria-label': '選項' });
    const feedbackSlot = h('div', {});

    item.options.forEach((opt) => {
      const btn = h(
        'button',
        {
          class: 'quiz-option',
          type: 'button',
          'aria-pressed': 'false',
        },
        opt,
      );
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const isCorrect = opt === item.answer;
        btn.classList.add(isCorrect ? 'quiz-option--correct' : 'quiz-option--incorrect');
        btn.setAttribute('aria-pressed', 'true');
        if (isCorrect) {
          correctCount += 1;
          clear(feedbackSlot);
          feedbackSlot.appendChild(h('p', { role: 'status', 'aria-live': 'polite' }, '✅ 答對了！'));
        } else {
          clear(feedbackSlot);
          feedbackSlot.appendChild(
            HintPanel({ message: item.explanation || '再看看注音，仔細比對一下。' }),
          );
          // 標出正確答案所在按鈕
          [...optionsWrap.children].forEach((c) => {
            if (c.textContent === item.answer) c.classList.add('quiz-option--correct');
          });
        }
        const nextBtn = h(
          'button',
          { class: 'btn', type: 'button', style: 'margin-top:16px' },
          index + 1 < items.length ? '下一題' : '看結果',
        );
        nextBtn.addEventListener('click', () => {
          index += 1;
          render();
        });
        feedbackSlot.appendChild(nextBtn);
      });
      optionsWrap.appendChild(btn);
    });

    root.appendChild(optionsWrap);
    root.appendChild(feedbackSlot);
  }

  render();
  return root;
}
