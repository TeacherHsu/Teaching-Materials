import { h, clear } from '../utils/dom.js';
import { ProgressIndicator } from './ProgressIndicator.js';
import { HintPanel } from './HintPanel.js';
import { CompletionFeedback } from './CompletionFeedback.js';
import { SpeakButton } from './SpeakButton.js';
import { ReadAllButton } from './ReadAllButton.js';
import { recordOutcome } from '../utils/scoreSession.js';
import { celebrateCorrect } from '../utils/celebrate.js';
import { shuffle } from '../utils/shuffle.js';

const CHECK_ICON = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>`;
const CROSS_ICON = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>`;

const DEFAULT_HINT = '再看看題目，仔細比對一下再選。';

/**
 * 「拖到空格」通用引擎：一次一題，一畫面一任務。
 * 互動用 Pointer Events 直接支援滑鼠／觸控拖曳，並保留原生 button 的點選與鍵盤
 * 操作（Tab/Enter、Space），讓觸控裝置或鍵盤使用者也能完成同一題。
 *
 * 答錯先提示（第 1 次不揭曉正解，可重選），第 2 次答錯才揭曉正解。
 *
 * @param {{
 *   items: Array<{
 *     id: string,
 *     context: Node | string,      // 題目情境（例如成語定義卡、生活語句）
 *     slotLabel?: string,          // 空格佔位文字，預設「？」
 *     options: Array<{id: string, label: string}>, // 候選詞塊（含干擾項）
 *     answerId: string,
 *     hint?: string,
 *     explanation?: string,
 *     speech_overrides?: Array<{text:string, speak:string}>, // 候選卡朗讀讀音校正
 *   }>,
 *   onComplete?: (correct:number, total:number) => void,
 *   onBack?: () => void,
 *   backLabel?: string,
 *   dragEnabled?: boolean, // 開啟直接拖曳候選詞塊到空格
 * }} opts
 */
export function DragToSlot({ items, onComplete, onBack, backLabel = '回課程首頁', dragEnabled = false }) {
  const root = h('div', {
    class: `quiz-panel drag-to-slot${dragEnabled ? ' drag-to-slot--drag-enabled' : ''}`,
  });
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
    let placed = null; // 已放入空格的候選詞塊 id
    let attempts = 0;
    let answered = false;

    if (item.speakText) {
      root.appendChild(
        h('div', { class: 'quiz-title-row' }, [
          ProgressIndicator({ current: index + 1, total: items.length }),
          ReadAllButton(() => ({ stem: item.speakText, options: options.map((o) => o.label) })),
        ]),
      );
    } else {
      root.appendChild(ProgressIndicator({ current: index + 1, total: items.length }));
    }

    const contextWrap = h('div', { class: 'drag-to-slot__context' });
    if (typeof item.context === 'string') {
      contextWrap.appendChild(
        h('div', { class: 'quiz-option-row' }, [
          h('p', { class: 'quiz-stem' }, item.context),
          SpeakButton({ text: item.context, label: '聽', variant: 'speak-button--option' }),
        ]),
      );
    } else if (item.context) {
      contextWrap.appendChild(item.context);
      if (item.speakText) {
        contextWrap.appendChild(SpeakButton({ text: item.speakText, label: '聽題目', variant: 'speak-button--option' }));
      }
    }
    root.appendChild(contextWrap);

    if (dragEnabled) {
      root.appendChild(
        h('p', { class: 'drag-to-slot__instruction' }, '把正確答案拖到空格裡，也可以先點選答案，再點一下空格。'),
      );
    }

    const slot = h('button', {
      class: 'sentence-chip drag-to-slot__slot',
      type: 'button',
      'aria-label': dragEnabled
        ? '答案空格，可將候選答案拖到這裡；點一下可以取消已放入的詞塊'
        : '答案空格，點一下可以取消已放入的詞塊',
    }, item.slotLabel || '？');
    const slotSpeakWrap = h('span', { class: 'drag-to-slot__slot-speak' });
    const slotWrap = h('div', { class: 'sentence-slots drag-to-slot__slot-row', 'aria-label': '目前放入空格的詞塊' }, [slot, slotSpeakWrap]);
    root.appendChild(slotWrap);

    const bankWrap = h('div', {
      class: 'sentence-bank',
      'aria-label': dragEnabled ? '可選答案，拖到上方空格或先點選再放入' : '可選詞塊，先點選再點空格放入',
    });
    // 候選詞塊每次進入題目都重新亂數排列，且不改動題庫資料。
    const options = shuffle(item.options || []);
    const overrides = item.speech_overrides || [];

    function refreshSlot() {
      const opt = options.find((o) => o.id === placed);
      slot.textContent = opt ? opt.label : item.slotLabel || '？';
      slot.classList.toggle('drag-to-slot__slot--filled', !!placed);
      clear(slotSpeakWrap);
      if (opt) {
        slotSpeakWrap.appendChild(
          SpeakButton({
            text: opt.label,
            overrides,
            label: '聽',
            variant: 'speak-button--option',
            ariaLabel: `朗讀空格內容：${opt.label}`,
          }),
        );
      }
    }

    const chipById = new Map(); // optId -> 候選卡按鈕（bankWrap 的子節點現在是「卡片＋喇叭」的 row，不能直接當 chip 用）

    function placeOption(optId) {
      if (answered) return;
      const previous = placed;
      if (previous && previous !== optId) {
        const previousChip = chipById.get(previous);
        if (previousChip) {
          previousChip.disabled = false;
          previousChip.setAttribute('aria-pressed', 'false');
        }
      }
      const chip = chipById.get(optId);
      if (!chip || chip.disabled) return;
      placed = optId;
      chip.disabled = true;
      chip.setAttribute('aria-pressed', 'true');
      refreshSlot();
      checkBtn.disabled = false;
    }

    slot.addEventListener('click', () => {
      if (answered || !placed) return;
      // 取消放入，詞塊退回候選區
      const chip = chipById.get(placed);
      if (chip) {
        chip.disabled = false;
        chip.setAttribute('aria-pressed', 'false');
      }
      placed = null;
      refreshSlot();
      checkBtn.disabled = true;
    });

    const feedbackSlot = h('div', {});
    const checkBtn = h('button', { class: 'btn', type: 'button', style: 'margin-top:12px', disabled: 'disabled' }, '確認答案');

    options.forEach((opt) => {
      const chip = h(
        'button',
        {
          class: `sentence-chip drag-to-slot__option-chip${dragEnabled ? ' drag-to-slot__option-chip--draggable' : ''}`,
          type: 'button',
          'aria-pressed': 'false',
          title: dragEnabled ? '拖到上方空格，或點選後放入' : undefined,
        },
        opt.label,
      );
      chip.dataset.optId = opt.id;
      chip.addEventListener('click', () => {
        if (answered || chip.disabled) return;
        placeOption(opt.id);
      });

      if (dragEnabled) {
        let pointerDrag = null;
        chip.addEventListener('pointerdown', (event) => {
          if (answered || chip.disabled) return;
          if (event.button !== undefined && event.button !== 0) return;
          pointerDrag = {
            startX: event.clientX ?? 0,
            startY: event.clientY ?? 0,
            started: false,
          };
          chip.setPointerCapture?.(event.pointerId);
        });
        chip.addEventListener('pointermove', (event) => {
          if (!pointerDrag || answered) return;
          const distance = Math.hypot(
            (event.clientX ?? 0) - pointerDrag.startX,
            (event.clientY ?? 0) - pointerDrag.startY,
          );
          if (!pointerDrag.started && distance < 8) return;
          pointerDrag.started = true;
          event.preventDefault?.();
          chip.classList.add('drag-to-slot__option-chip--dragging');
          const element = document.elementFromPoint?.(event.clientX, event.clientY);
          const overSlot = !!element && (element === slot || slot.contains?.(element));
          slot.classList.toggle('drag-to-slot__slot--drag-over', overSlot);
        });
        chip.addEventListener('pointerup', (event) => {
          if (!pointerDrag) return;
          const wasDragging = pointerDrag.started;
          const element = document.elementFromPoint?.(event.clientX, event.clientY);
          const overSlot = !!element && (element === slot || slot.contains?.(element));
          pointerDrag = null;
          chip.classList.remove('drag-to-slot__option-chip--dragging');
          slot.classList.remove('drag-to-slot__slot--drag-over');
          if (wasDragging) {
            event.preventDefault?.();
            if (overSlot) placeOption(opt.id);
          }
        });
        chip.addEventListener('pointercancel', () => {
          pointerDrag = null;
          chip.classList.remove('drag-to-slot__option-chip--dragging');
          slot.classList.remove('drag-to-slot__slot--drag-over');
        });
      }
      // 候選卡本身的朗讀鈕：獨立節點，不觸發卡片選取。click 由 SpeakButton
      // 內部 stopPropagation；這裡額外攔截 pointerdown，避免拖曳手勢誤把
      // 喇叭當成候選卡的起點。
      const optSpeaker = SpeakButton({
        text: opt.label,
        overrides,
        label: '聽',
        variant: 'speak-button--option',
        ariaLabel: `朗讀：${opt.label}`,
      });
      optSpeaker.addEventListener('pointerdown', (e) => e.stopPropagation());
      const row = h('div', { class: 'drag-to-slot__option-row' }, [chip, optSpeaker]);
      bankWrap.appendChild(row);
      chipById.set(opt.id, chip);
    });

    checkBtn.addEventListener('click', () => {
      if (answered || !placed) return;
      attempts += 1;
      const isCorrect = placed === item.answerId;

      if (isCorrect) {
        answered = true;
        correctCount += 1;
        recordOutcome({ firstTry: attempts === 1, revealed: false });
        celebrateCorrect(slot, 'var(--module-color)', { firstTry: attempts === 1 });
        slot.classList.add('quiz-option--correct');
        clear(feedbackSlot);
        feedbackSlot.appendChild(
          h('p', {
            role: 'status', 'aria-live': 'polite', class: 'meta',
            html: `<span style="display:inline-flex;align-items:center;gap:4px;color:var(--color-success)">${CHECK_ICON}答對了！</span>`,
          }),
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
        checkBtn.disabled = true;
        return;
      }

      slot.classList.add('quiz-option--incorrect');
      if (attempts < 2) {
        // 第 1 次答錯：不揭曉正解，退回候選區重選
        const chip = chipById.get(placed);
        if (chip) {
          chip.disabled = false;
          chip.setAttribute('aria-pressed', 'false');
        }
        placed = null;
        refreshSlot();
        slot.classList.remove('quiz-option--incorrect');
        checkBtn.disabled = true;
        clear(feedbackSlot);
        feedbackSlot.appendChild(
          h('p', { role: 'status', 'aria-live': 'polite', class: 'meta' }, [
            h('span', { style: 'display:inline-flex;align-items:center;gap:4px;color:var(--color-danger)', html: CROSS_ICON }, '再試一次'),
          ]),
        );
        feedbackSlot.appendChild(HintPanel({ message: item.hint || DEFAULT_HINT }));
      } else {
        // 第 2 次答錯：揭曉正解，鎖題
        answered = true;
        recordOutcome({ firstTry: false, revealed: true });
        const answerOpt = options.find((o) => o.id === item.answerId);
        slot.textContent = answerOpt ? answerOpt.label : item.slotLabel;
        slot.classList.remove('quiz-option--incorrect');
        slot.classList.add('quiz-option--correct');
        clear(slotSpeakWrap);
        if (answerOpt) {
          slotSpeakWrap.appendChild(
            SpeakButton({
              text: answerOpt.label,
              overrides,
              label: '聽',
              variant: 'speak-button--option',
              ariaLabel: `朗讀空格內容：${answerOpt.label}`,
            }),
          );
        }
        chipById.forEach((c) => { c.disabled = true; });
        clear(feedbackSlot);
        feedbackSlot.appendChild(
          h('p', { role: 'status', 'aria-live': 'polite', class: 'meta' }, [
            h('span', { style: 'display:inline-flex;align-items:center;gap:4px;color:var(--color-danger)', html: CROSS_ICON },
              `正確答案是：${answerOpt ? answerOpt.label : ''}`),
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
        checkBtn.disabled = true;
      }
    });

    function appendNextButton() {
      const nextBtn = h('button', { class: 'btn', type: 'button', style: 'margin-top:16px' },
        index + 1 < items.length ? '下一題' : '看結果');
      nextBtn.addEventListener('click', () => {
        index += 1;
        render();
      });
      feedbackSlot.appendChild(nextBtn);
    }

    root.appendChild(bankWrap);
    root.appendChild(checkBtn);
    root.appendChild(feedbackSlot);
  }

  render();
  return root;
}
