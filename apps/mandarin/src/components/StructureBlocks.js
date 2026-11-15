import { h, clear } from '../utils/dom.js';
import { CompletionFeedback } from './CompletionFeedback.js';
import { SpeakButton } from './SpeakButton.js';
import { HintPanel } from './HintPanel.js';
import { ProgressIndicator } from './ProgressIndicator.js';
import { getScaffoldLevel } from '../utils/deviceSettings.js';
import { recordOutcome } from '../utils/scoreSession.js';
import { celebrateCorrect } from '../utils/celebrate.js';
import { shuffle } from '../utils/shuffle.js';
import { frameText } from '../utils/structureBlocks.js';

/**
 * 例句拆積木：上面是句型的格子（誰／做什麼／原因……，固定字直接印在格子之間），
 * 下面是例句拆開的語塊。一次只問一格——「哪一塊是『原因』？」——學生點一塊放進去。
 *
 * 為什麼一次一格：特教學生同時要「讀語塊、想順序、記格子名稱」負荷太大；
 * 一次只決定一件事，注意力才會落在「這一格裝的是什麼」，也就是句子的結構。
 * 答錯先提示、再錯才幫忙放（和其他關卡一致）；支持層會先放好第一格當示範。
 *
 * @param {{
 *   items: Array<{ id: string, sentence: string, frame: Array<{type:'slot', label:string, text:string} | {type:'lit', text:string}> }>,
 *   onBack?: () => void, backLabel?: string, onContinue?: () => void, continueLabel?: string,
 * }} opts
 */
export function StructureBlocks({ items, onBack, backLabel = '回課程首頁', onContinue, continueLabel = '繼續' }) {
  const root = h('div', { class: 'quiz-panel structure-blocks' });
  const level = getScaffoldLevel();
  let index = 0;
  let correctCount = 0;

  function renderItem() {
    clear(root);
    if (index >= items.length) {
      root.appendChild(CompletionFeedback({
        correct: correctCount,
        total: items.length,
        onRetry: () => { index = 0; correctCount = 0; renderItem(); },
        onBack,
        backLabel,
        onContinue,
        continueLabel,
      }));
      return;
    }
    const item = items[index];
    const slots = item.frame.filter((t) => t.type === 'slot').map((t, i) => ({ ...t, n: i, filled: false }));
    const bank = shuffle(slots.map((s) => ({ slot: s.n, text: s.text })));
    // 支持層先放好前面幾格當示範，但至少留一格給學生自己放
    const prefill = Math.min(Number(level.prefill) || 0, slots.length - 1);
    for (let i = 0; i < prefill; i += 1) slots[i].filled = true;
    let active = slots.findIndex((s) => !s.filled);
    let wrongOnSlot = 0;
    let mistakes = 0;
    let revealed = false;

    root.appendChild(ProgressIndicator({ current: index + 1, total: items.length }));
    const question = h('p', { class: 'quiz-stem structure-blocks__question', role: 'status', 'aria-live': 'polite' });
    const questionRow = h('div', { class: 'quiz-option-row' }, [question]);
    const frameRow = h('div', { class: 'structure-blocks__frame', 'aria-label': '句型的格子' });
    const bankRow = h('div', { class: 'sentence-bank structure-blocks__bank', 'aria-label': '例句的語塊' });
    const feedback = h('div', { role: 'status', 'aria-live': 'polite' });
    const footer = h('div', { class: 'quiz-option-row structure-blocks__footer' });
    root.appendChild(questionRow);
    root.appendChild(frameRow);
    root.appendChild(bankRow);
    root.appendChild(feedback);
    root.appendChild(footer);

    function questionText() {
      return active < 0 ? '放好了！念念看這個句子。' : `哪一塊是「${slots[active].label}」？`;
    }

    function renderFrame() {
      clear(frameRow);
      for (const token of item.frame) {
        if (token.type === 'lit') {
          frameRow.appendChild(h('span', { class: 'structure-blocks__fixed' }, token.text));
          continue;
        }
        const slot = slots.find((s) => s.label === token.label && s.text === token.text);
        const isActive = slot.n === active;
        const box = h('button', {
          class: `structure-blocks__slot structure-blocks__slot--c${slot.n % 3}${slot.filled ? ' structure-blocks__slot--filled' : ''}${isActive ? ' structure-blocks__slot--active' : ''}`,
          type: 'button',
          'aria-label': slot.filled ? `${slot.label}：${slot.text}` : `${slot.label}：還沒放`,
          'aria-current': isActive ? 'true' : null,
          disabled: slot.filled ? true : null,
        }, [
          h('span', { class: 'structure-blocks__label' }, slot.label),
          h('span', { class: 'structure-blocks__value' }, slot.filled ? slot.text : '？'),
        ]);
        // 想先放別格也可以：點空格子就改問那一格
        box.addEventListener('click', () => {
          if (slot.filled) return;
          active = slot.n;
          wrongOnSlot = 0;
          clear(feedback);
          refresh();
        });
        frameRow.appendChild(box);
      }
    }

    function renderBank() {
      clear(bankRow);
      for (const chunk of bank) {
        const used = slots[chunk.slot].filled;
        const chip = h('button', {
          class: `sentence-chip${used ? ' structure-blocks__chip--used' : ''}`,
          type: 'button',
          disabled: used || active < 0 ? true : null,
        }, chunk.text);
        chip.addEventListener('click', () => choose(chunk, chip));
        bankRow.appendChild(chip);
      }
    }

    function fill(slotIndex) {
      slots[slotIndex].filled = true;
      active = slots.findIndex((s) => !s.filled);
      wrongOnSlot = 0;
    }

    function choose(chunk, chip) {
      if (active < 0) return;
      clear(feedback);
      // 兩格的字一樣時資料端就不出題，所以用格子編號比對即可
      if (chunk.slot === active) {
        fill(active);
        celebrateCorrect(frameRow, null, { firstTry: mistakes === 0 });
        refresh();
        return;
      }
      mistakes += 1;
      wrongOnSlot += 1;
      chip.classList.add('sentence-chip--incorrect');
      const wanted = slots[active];
      if (wrongOnSlot >= (Number(level.wrongLimit) || 2)) {
        // 再錯就幫忙放，並說出為什麼
        revealed = true;
        feedback.appendChild(HintPanel({ message: `「${wanted.label}」是「${wanted.text}」。` }));
        fill(active);
        refresh();
      } else {
        feedback.appendChild(HintPanel({ message: `再想想：「${chunk.text}」是「${slots[chunk.slot].label}」。「${wanted.label}」是哪一塊？` }));
      }
    }

    function finishItem() {
      if (mistakes === 0 && !revealed) correctCount += 1;
      recordOutcome({ firstTry: mistakes === 0 && !revealed, revealed });
      clear(footer);
      const sentence = h('p', { class: 'structure-blocks__sentence' },
        item.frame.map((t) => (t.type === 'lit'
          ? h('span', { class: 'structure-blocks__fixed' }, t.text)
          : h('span', { class: `structure-blocks__part structure-blocks__part--c${slots.find((s) => s.text === t.text && s.label === t.label).n % 3}` }, t.text))));
      const pattern = h('p', { class: 'meta structure-blocks__pattern' }, `句型：${frameText(item.frame)}`);
      const next = h('button', { class: 'btn btn--primary', type: 'button' }, index === items.length - 1 ? '完成' : '下一題');
      next.addEventListener('click', () => { index += 1; renderItem(); });
      clear(feedback);
      feedback.appendChild(h('div', { class: 'structure-blocks__done' }, [
        h('div', { class: 'quiz-option-row' }, [sentence, SpeakButton({ text: item.sentence, label: '聽', variant: 'speak-button--option' })]),
        pattern,
      ]));
      footer.appendChild(next);
    }

    function refresh() {
      question.textContent = questionText();
      renderFrame();
      renderBank();
      if (active < 0) finishItem();
    }

    refresh();
  }

  renderItem();
  return root;
}
