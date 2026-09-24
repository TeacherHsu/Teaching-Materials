import { h, clear } from '../utils/dom.js';
import { ProgressIndicator } from './ProgressIndicator.js';
import { HintPanel } from './HintPanel.js';
import { CompletionFeedback } from './CompletionFeedback.js';

const CHECK_ICON = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>`;
const CROSS_ICON = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>`;

const DEFAULT_HINT = '再看看題目，仔細比對一下再選。';

/**
 * 選擇題引擎：一組 3–5 題、逐題作答。
 * 答錯處理（不揭曉答案就直接鎖題）：
 *   第 1 次答錯 → 該選項標「再試一次」＋顯示 scaffold 提示，選項停用但不揭曉正解，可再選其他選項。
 *   第 2 次答錯 → 才揭曉正解，鎖題進入下一題。
 * 鍵盤可操作（原生 button，Tab/Enter 即可）。
 * @param {{items: Array, onComplete?: (correct:number, total:number)=>void, onBack?: () => void, backLabel?: string}} opts
 */
export function ChoiceQuiz({ items, onComplete, onBack, backLabel = '回課程首頁' }) {
  const root = h('div', { class: 'quiz-panel' });
  let index = 0;
  let correctCount = 0;

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
          backLabel,
        }),
      );
      if (onComplete) onComplete(correctCount, items.length);
      return;
    }
    const item = items[index];
    let answered = false; // 題目鎖定（答對，或第 2 次答錯揭曉正解）
    let attempts = 0;

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
        if (answered || btn.disabled) return;
        const isCorrect = opt === item.answer;

        if (isCorrect) {
          answered = true;
          attempts += 1;
          btn.classList.add('quiz-option--correct');
          btn.setAttribute('aria-pressed', 'true');
          btn.innerHTML = `${CHECK_ICON}<span>${opt}</span>`;
          correctCount += 1;
          [...optionsWrap.children].forEach((c) => {
            if (c !== btn) c.disabled = true;
          });
          clear(feedbackSlot);
          feedbackSlot.appendChild(
            h('p', {
              role: 'status',
              'aria-live': 'polite',
              class: 'meta',
              html: `<span style="display:inline-flex;align-items:center;gap:4px;color:var(--color-success)">${CHECK_ICON}答對了！</span>`,
            }),
          );
          appendNextButton();
          return;
        }

        // 答錯
        attempts += 1;
        btn.classList.add('quiz-option--incorrect');
        btn.setAttribute('aria-pressed', 'true');
        btn.innerHTML = `${CROSS_ICON}<span>${opt}</span>`;

        if (attempts < 2) {
          // 第 1 次答錯：不揭曉正解，該選項停用，其餘選項仍可選
          btn.disabled = true;
          clear(feedbackSlot);
          const hintText = (item.hints && item.hints[0]) || item.hint || DEFAULT_HINT;
          feedbackSlot.appendChild(
            h('p', { role: 'status', 'aria-live': 'polite', class: 'meta' }, [
              h(
                'span',
                { style: 'display:inline-flex;align-items:center;gap:4px;color:var(--color-danger)', html: CROSS_ICON },
                '再試一次',
              ),
            ]),
          );
          feedbackSlot.appendChild(HintPanel({ message: hintText }));
        } else {
          // 第 2 次答錯：揭曉正解，鎖題
          answered = true;
          btn.disabled = true;
          [...optionsWrap.children].forEach((c) => {
            c.disabled = true;
            if (c.textContent.trim() === item.answer) {
              c.classList.add('quiz-option--correct');
              c.innerHTML = `${CHECK_ICON}<span>${item.answer}</span>`;
            }
          });
          clear(feedbackSlot);
          feedbackSlot.appendChild(
            h('p', { role: 'status', 'aria-live': 'polite', class: 'meta' }, [
              h(
                'span',
                { style: 'display:inline-flex;align-items:center;gap:4px;color:var(--color-danger)', html: CROSS_ICON },
                `正確答案是：${item.answer}`,
              ),
            ]),
          );
          if (item.explanation) {
            feedbackSlot.appendChild(h('p', { class: 'meta' }, item.explanation));
          }
          appendNextButton();
        }
      });
      optionsWrap.appendChild(btn);
    });

    function appendNextButton() {
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
    }

    root.appendChild(optionsWrap);
    root.appendChild(feedbackSlot);
  }

  render();
  return root;
}
