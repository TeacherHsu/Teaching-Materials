import { h, clear } from '../utils/dom.js';
import { ProgressIndicator } from './ProgressIndicator.js';
import { HintPanel } from './HintPanel.js';
import { CompletionFeedback } from './CompletionFeedback.js';
import { SpeakButton } from './SpeakButton.js';
import { ReadAllButton } from './ReadAllButton.js';
import { recordOutcome } from '../utils/scoreSession.js';
import { noteMistake, gradeMistake } from '../utils/mistakes.js';
import { celebrateCorrect } from '../utils/celebrate.js';
import { shuffle } from '../utils/shuffle.js';

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
export function ChoiceQuiz({ items, onComplete, onBack, backLabel = '回課程首頁', onContinue, continueLabel = '加練下一組' }) {
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
          onContinue,
          continueLabel,
        }),
      );
      if (onComplete) onComplete(correctCount, items.length);
      return;
    }
    const item = items[index];
    // 題庫資料保留內容順序；學生畫面每次重繪都重新亂數排列選項。
    // ReadAllButton 也使用這份畫面順序，朗讀順序與視覺順序一致。
    const options = shuffle(item.options || []);
    const stemText = item.stemText || item.stem;
    const stemContent = item.stemContent || stemText;
    let answered = false; // 題目鎖定（答對，或第 2 次答錯揭曉正解）
    let attempts = 0;

    root.appendChild(ProgressIndicator({ current: index + 1, total: items.length }));
    if (item.extra) root.appendChild(item.extra);
    root.appendChild(
      h('div', { class: 'quiz-title-row' }, [
        h('div', { class: 'quiz-option-row audio-control-group audio-control-group--prompt' }, [
          h('p', { class: 'quiz-stem' }, stemContent),
          SpeakButton({ text: stemText, label: '聽題目', showLabel: true, ariaLabel: `聽題目：${stemText}`, variant: 'speak-button--option speak-button--audio-label' }),
        ]),
        ReadAllButton(() => ({ stem: item.readAllStem || stemText, options })),
      ]),
    );

    const optionsWrap = h('div', { class: 'quiz-options', role: 'group', 'aria-label': '選項' });
    const feedbackSlot = h('div', {});
    const optionButtons = [];

    options.forEach((opt) => {
      const btn = h(
        'button',
        {
          class: 'quiz-option',
          type: 'button',
          'aria-pressed': 'false',
        },
        opt,
      );
      optionButtons.push(btn);
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
          const firstTry = attempts === 1;
          recordOutcome({ firstTry, revealed: false });
          // 第一次沒答對就收進錯題盒（和「正確率＝第一次答對率」同一個判準）。
          // 在複習模式下則是把這一題往上推一格（連對夠多次就學會、移除）。
          if (item._mistakeId) gradeMistake(item._mistakeId, firstTry);
          else if (!firstTry) noteMistake(item);
          celebrateCorrect(btn, 'var(--module-color)', { firstTry: attempts === 1 });
          optionButtons.forEach((c) => {
            if (c !== btn) c.disabled = true;
          });
          clear(feedbackSlot);
          feedbackSlot.appendChild(
            h('div', { class: 'quiz-option-row' }, [
              h('p', {
                role: 'status',
                'aria-live': 'polite',
                class: 'meta',
                html: `<span style="display:inline-flex;align-items:center;gap:4px;color:var(--color-success)">${CHECK_ICON}答對了！</span>`,
              }),
              SpeakButton({ text: '答對了！', label: '聽', variant: 'speak-button--option' }),
            ]),
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
            h('div', { class: 'quiz-option-row' }, [
              h('p', { role: 'status', 'aria-live': 'polite', class: 'meta' }, [
                h(
                  'span',
                  { style: 'display:inline-flex;align-items:center;gap:4px;color:var(--color-danger)', html: CROSS_ICON },
                  '再試一次',
                ),
              ]),
              SpeakButton({ text: '再試一次', label: '聽', variant: 'speak-button--option' }),
            ]),
          );
          feedbackSlot.appendChild(HintPanel({ message: hintText }));
        } else {
          // 第 2 次答錯：揭曉正解，鎖題
          answered = true;
          recordOutcome({ firstTry: false, revealed: true });
          if (item._mistakeId) gradeMistake(item._mistakeId, false);
          else noteMistake(item);
          btn.disabled = true;
          optionButtons.forEach((c) => {
            c.disabled = true;
            if (c.textContent.trim() === item.answer) {
              c.classList.add('quiz-option--correct');
              c.innerHTML = `${CHECK_ICON}<span>${item.answer}</span>`;
            }
          });
          clear(feedbackSlot);
          feedbackSlot.appendChild(
            h('div', { class: 'quiz-option-row' }, [
              h('p', { role: 'status', 'aria-live': 'polite', class: 'meta' }, [
                h(
                  'span',
                  { style: 'display:inline-flex;align-items:center;gap:4px;color:var(--color-danger)', html: CROSS_ICON },
                  `正確答案是：${item.answer}`,
                ),
              ]),
              SpeakButton({ text: `正確答案是：${item.answer}`, label: '聽', variant: 'speak-button--option' }),
            ]),
          );
          if (item.explanation) {
            feedbackSlot.appendChild(
              h('div', { class: 'quiz-option-row' }, [
                h('p', { class: 'meta' }, item.explanation),
                SpeakButton({ text: item.explanation, label: '聽', variant: 'speak-button--option' }),
              ]),
            );
          }
          appendNextButton();
        }
      });
      const row = h('div', { class: 'quiz-option-row audio-control-group audio-control-group--option' }, [
        btn,
        SpeakButton({ text: opt, label: '聽選項', showLabel: true, ariaLabel: `聽選項：${opt}`, variant: 'speak-button--option speak-button--audio-label' }),
      ]);
      optionsWrap.appendChild(row);
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
