import { h, clear } from '../utils/dom.js';
import { ProgressIndicator } from './ProgressIndicator.js';
import { CompletionFeedback } from './CompletionFeedback.js';
import { SpeakButton } from './SpeakButton.js';
import { ReadAllButton } from './ReadAllButton.js';
import { ChoiceQuiz } from './ChoiceQuiz.js';
import { isPreview } from '../utils/preview.js';

/**
 * 閱讀理解提問：選擇題呈現選項但不猜測未核定的答案；提示逐步揭露。
 * 策略標籤（strategy_tag）只在預覽模式顯示給老師看，
 * 學生畫面不會出現「提取訊息／推論訊息」等後設標籤。
 * @param {{items: Array, onBack?: () => void, backLabel?: string}} opts
 */
export function ReadingQuestions({ items, onBack, backLabel = '本課先完成', onContinue, continueLabel = '加練下一組' }) {
  const hasOptions = items.some((item) => Array.isArray(item.options) && item.options.length > 0);
  if (hasOptions) {
    const allChoicesReady = items.every((item) =>
      Array.isArray(item.options)
      && item.options.length >= 2
      && typeof item.answer === 'string'
      && item.options.includes(item.answer),
    );
    if (!allChoicesReady) {
      return h('div', { class: 'quiz-panel' }, [
        h('p', { class: 'meta', role: 'status', 'aria-live': 'polite' }, '這組選擇題的答案資料尚待核對，暫時無法開始。'),
      ]);
    }

    // 所有年級共用選擇題回饋：第一次答錯給線索，第二次才揭曉答案。
    return ChoiceQuiz({
      items: items.map((item) => ({
        ...item,
        hints: item.hints?.length ? item.hints : (item.scaffold ? [item.scaffold] : undefined),
      })),
      onBack,
      backLabel,
      onContinue,
      continueLabel,
    });
  }

  const root = h('div', { class: 'quiz-panel' });
  let index = 0;
  const preview = isPreview();

  function render() {
    clear(root);
    if (index >= items.length) {
      root.appendChild(CompletionFeedback({ correct: items.length, total: items.length, onBack, backLabel, onContinue, continueLabel }));
      return;
    }
    const item = items[index];
    root.appendChild(ProgressIndicator({ current: index + 1, total: items.length }));

    if (preview && item.status === 'draft') {
      root.appendChild(h('span', { class: 'review-pending-badge' }, '待審'));
    }
    if (preview && item.strategy_tag) {
      root.appendChild(h('p', { class: 'meta' }, `（教師預覽）策略標籤：${item.strategy_tag}`));
    }

    root.appendChild(
      h('div', { class: 'quiz-title-row' }, [
        h('div', { class: 'quiz-option-row audio-control-group audio-control-group--prompt' }, [
          h('p', { class: 'quiz-stem' }, item.stem),
          SpeakButton({ text: item.stem, label: '聽題目', showLabel: true, ariaLabel: `聽題目：${item.stem}`, variant: 'speak-button--option speak-button--audio-label' }),
        ]),
        ReadAllButton(() => ({ stem: item.stem, options: item.options || [] })),
      ]),
    );

    const selectionStatus = h('p', { class: 'meta', role: 'status', 'aria-live': 'polite' });
    if (Array.isArray(item.options) && item.options.length > 0) {
      const optionsWrap = h('div', { class: 'quiz-options', role: 'group', 'aria-label': '選項' });
      for (const option of item.options) {
        const optionButton = h('button', { class: 'quiz-option', type: 'button', 'aria-pressed': 'false' }, option);
        optionButton.addEventListener('click', () => {
          for (const button of optionsWrap.querySelectorAll('button.quiz-option')) {
            const active = button === optionButton;
            button.classList.toggle('quiz-option--selected', active);
            button.setAttribute('aria-pressed', String(active));
          }
          selectionStatus.textContent = `你選了：${option}`;
        });
        optionsWrap.appendChild(h('div', { class: 'quiz-option-row audio-control-group audio-control-group--option' }, [
          optionButton,
          SpeakButton({ text: option, label: '聽選項', showLabel: true, ariaLabel: `聽選項：${option}`, variant: 'speak-button--option speak-button--audio-label' }),
        ]));
      }
      root.appendChild(optionsWrap);
      root.appendChild(selectionStatus);
    }

    const revealSlot = h('div', { role: 'status', 'aria-live': 'polite' });
    let revealStage = 0;
    const revealBtn = h('button', { class: 'btn btn--secondary', type: 'button', style: 'margin-top:12px' }, '找哪段／哪張圖');
    revealBtn.addEventListener('click', () => {
      clear(revealSlot);
      const stages = [
        item.scaffold || '回到課文，找出和題目有關的段落或插圖。',
        '先圈出題目中的關鍵詞，再回到課文或插圖找線索。',
        item.answer_hint || '想一想，說說看你的答案。',
      ];
      const labels = ['指出關鍵詞', '看答案提示'];
      const hintText = stages[revealStage];
      revealSlot.appendChild(
        h('div', { class: 'quiz-option-row audio-control-group audio-control-group--hint' }, [
          h('p', { class: 'meta' }, hintText),
          SpeakButton({ text: hintText, label: '聽', variant: 'speak-button--option' }),
        ]),
      );
      revealStage += 1;
      if (revealStage < stages.length) {
        revealBtn.textContent = labels[revealStage - 1];
      } else {
        revealBtn.disabled = true;
        root.appendChild(nextBtn);
      }
    });

    const nextBtn = h('button', { class: 'btn', type: 'button', style: 'margin-top:16px' },
      index + 1 < items.length ? '下一題' : '看結果');
    nextBtn.addEventListener('click', () => {
      index += 1;
      render();
    });

    root.appendChild(revealBtn);
    root.appendChild(revealSlot);
  }

  render();
  return root;
}
