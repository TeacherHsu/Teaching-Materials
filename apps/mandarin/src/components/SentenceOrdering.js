import { h, clear } from '../utils/dom.js';
import { CompletionFeedback } from './CompletionFeedback.js';
import { SpeakButton } from './SpeakButton.js';
import { ReadAllButton } from './ReadAllButton.js';
import { shuffleDiffering } from '../utils/shuffle.js';
import { recordOutcome } from '../utils/scoreSession.js';
import { celebrateCorrect } from '../utils/celebrate.js';
import { HintPanel } from './HintPanel.js';
import { getScaffoldLevel } from '../utils/deviceSettings.js';

/**
 * 句子排序：點選詞塊依序加入答案區，也支援滑鼠／觸控拖曳到指定序位；
 * 鍵盤仍可操作（button 逐一點選）。確認答案後只退回位置錯誤的詞塊，
 * 正確詞塊留在原序位並鎖定，讓學習者可以再次拖曳錯誤詞塊修正。
 * @param {{prompt: string, parts: string[], solution: string[], onBack?: () => void}} opts
 */
export function SentenceOrdering({ prompt, parts, solution, onBack, backLabel = '回課程首頁', onContinue, continueLabel = '繼續', hint }) {
  const root = h('div', { class: 'quiz-panel' });
  const bank = shuffleDiffering(parts, `${prompt}|${parts.join('')}`).map((word, index) => ({
    id: `sentence-part-${index}`,
    word,
    incorrect: false,
  }));
  const itemById = new Map(bank.map((item) => [item.id, item]));
  const slotsState = Array(solution.length).fill(null);
  const lockedIds = new Set();
  let mistakes = 0;
  let feedbackShown = false;
  let returning = false;
  let activeDragId = null;

  root.appendChild(
    h('div', { class: 'quiz-title-row' }, [
      h('div', { class: 'quiz-option-row' }, [
        h('p', { class: 'quiz-stem' }, prompt),
        SpeakButton({ text: prompt, label: '聽', variant: 'speak-button--option' }),
      ]),
      ReadAllButton(() => ({ task: prompt, options: bank.map((item) => item.word) })),
    ]),
  );
  const instruction = h(
    'p',
    { class: 'sentence-ordering__instruction' },
    '可點選詞塊依序排列；再點一次已放置詞塊可退回候選區；檢查後，將變紅的詞塊拖到正確序位。',
  );
  const slots = h('div', { class: 'sentence-slots', 'aria-label': '目前排出的句子' });
  const bankWrap = h('div', {
    class: 'sentence-bank',
    'aria-label': '可選詞塊；可點選加入，或拖曳到下方正確序位',
  });
  const status = h('p', { class: 'meta', role: 'status', 'aria-live': 'polite' });
  const checkBtn = h('button', { class: 'btn', type: 'button', style: 'margin-top:12px' }, '檢查答案');
  const resetBtn = h('button', { class: 'btn btn--secondary', type: 'button', style: 'margin-left:8px' }, '重新排列');
  const chipById = new Map();

  // 「看提示」：第 1 次給策略（先找開頭），之後每按一次標亮下一塊該放的詞塊。
  // 參考站的排句子也是這樣——直接指出下一步，學生不必在一堆詞塊裡亂試。
  // 挑戰層不給主動提示（和 ChoiceQuiz 一致）；用過提示就不算獨立排對。
  let hintsUsed = 0;
  const hintBox = h('div', { role: 'status', 'aria-live': 'polite' });
  const hintBtn = getScaffoldLevel().key === 'challenge'
    ? null
    : h('button', { class: 'btn btn--ghost quiz-hint-button', type: 'button', style: 'margin-left:8px' }, '看提示');
  function showHint() {
    hintsUsed += 1;
    chipById.forEach((c) => c.classList.remove('sentence-chip--hinted'));
    clear(hintBox);
    if (hintsUsed === 1) {
      hintBox.appendChild(HintPanel({ message: hint || '先找句子的開頭：是誰？什麼時候？還是一個關聯詞？' }));
      return;
    }
    const next = solution.findIndex((word, i) => itemById.get(slotsState[i])?.word !== word);
    if (next < 0) return;
    const wanted = solution[next];
    const item = bank.find((it) => it.word === wanted && !slotsState.includes(it.id));
    const chip = item && chipById.get(item.id);
    if (!chip) return;
    chip.classList.add('sentence-chip--hinted');
    chip.scrollIntoView?.({ block: 'nearest' });
    hintBox.appendChild(HintPanel({ message: `第 ${next + 1} 格要放亮起來的那一塊。` }));
  }
  if (hintBtn) hintBtn.addEventListener('click', showHint);

  function getSlotIndex(target) {
    let node = target;
    while (node && node !== root) {
      const raw = node.getAttribute?.('data-slot-index');
      if (raw !== null && raw !== undefined) return Number(raw);
      node = node.parentNode;
    }
    return -1;
  }

  function clearItemError(item) {
    if (!item) return;
    item.incorrect = false;
    const chip = chipById.get(item.id);
    chip?.classList.remove('sentence-chip--incorrect', 'sentence-chip--returning');
  }

  function firstEmptySlot() {
    return slotsState.findIndex((id) => id === null);
  }

  function placeAt(itemId, targetIndex) {
    if (returning || targetIndex < 0 || targetIndex >= slotsState.length) return;
    const item = itemById.get(itemId);
    if (!item || lockedIds.has(itemId) || lockedIds.has(slotsState[targetIndex])) return;

    const sourceIndex = slotsState.indexOf(itemId);
    const displacedId = slotsState[targetIndex];
    if (sourceIndex === targetIndex) return;

    if (sourceIndex >= 0) {
      // 拖曳已排好的未鎖定詞塊時，與目標位置交換，避免破壞其他已排內容。
      slotsState[sourceIndex] = displacedId || null;
    }
    slotsState[targetIndex] = itemId;
    clearItemError(item);
    if (displacedId && displacedId !== itemId) clearItemError(itemById.get(displacedId));
    renderSlots();
    renderBank();
  }

  function chooseFromBank(itemId) {
    const targetIndex = firstEmptySlot();
    if (targetIndex === -1) return;
    placeAt(itemId, targetIndex);
  }

  function returnToBank(itemId) {
    if (returning || feedbackShown || lockedIds.has(itemId)) return;
    const slotIndex = slotsState.indexOf(itemId);
    if (slotIndex < 0) return;
    slotsState[slotIndex] = null;
    clearItemError(itemById.get(itemId));
    renderSlots();
    renderBank();
  }

  function bindDropTarget(target, index) {
    target.addEventListener('dragover', (event) => {
      if (returning || lockedIds.has(slotsState[index])) return;
      event.preventDefault?.();
      target.classList.add('sentence-ordering__slot--drag-over');
    });
    target.addEventListener('dragleave', () => {
      target.classList.remove('sentence-ordering__slot--drag-over');
    });
    target.addEventListener('drop', (event) => {
      event.preventDefault?.();
      target.classList.remove('sentence-ordering__slot--drag-over');
      const itemId = event.dataTransfer?.getData?.('text/plain') || activeDragId;
      if (itemId) placeAt(itemId, index);
      activeDragId = null;
    });
  }

  function bindDrag(chip, itemId) {
    chip.draggable = true;
    chip.setAttribute('draggable', 'true');
    let pointerDrag = null;
    let suppressClick = false;

    chip.addEventListener('dragstart', (event) => {
      if (returning || lockedIds.has(itemId)) return;
      activeDragId = itemId;
      event.dataTransfer?.setData?.('text/plain', itemId);
      chip.classList.add('sentence-chip--dragging');
    });
    chip.addEventListener('dragend', () => {
      activeDragId = null;
      chip.classList.remove('sentence-chip--dragging');
    });
    chip.addEventListener('pointerdown', (event) => {
      if (returning || lockedIds.has(itemId)) return;
      if (event.button !== undefined && event.button !== 0) return;
      pointerDrag = {
        startX: event.clientX ?? 0,
        startY: event.clientY ?? 0,
        started: false,
      };
      activeDragId = itemId;
      chip.setPointerCapture?.(event.pointerId);
    });
    chip.addEventListener('pointermove', (event) => {
      if (!pointerDrag || returning) return;
      const distance = Math.hypot(
        (event.clientX ?? 0) - pointerDrag.startX,
        (event.clientY ?? 0) - pointerDrag.startY,
      );
      if (!pointerDrag.started && distance < 8) return;
      pointerDrag.started = true;
      suppressClick = true;
      event.preventDefault?.();
      chip.classList.add('sentence-chip--dragging');
      const targetIndex = getSlotIndex(document.elementFromPoint?.(event.clientX, event.clientY));
      slots.querySelectorAll?.('.sentence-ordering__slot--drag-over').forEach((node) => {
        node.classList.remove('sentence-ordering__slot--drag-over');
      });
      if (targetIndex >= 0) {
        slots.querySelector?.(`[data-slot-index="${targetIndex}"]`)?.classList.add('sentence-ordering__slot--drag-over');
      }
    });
    chip.addEventListener('pointerup', (event) => {
      if (!pointerDrag) return;
      const wasDragging = pointerDrag.started;
      const targetIndex = getSlotIndex(document.elementFromPoint?.(event.clientX, event.clientY));
      pointerDrag = null;
      chip.classList.remove('sentence-chip--dragging');
      if (wasDragging) {
        event.preventDefault?.();
        if (targetIndex >= 0) placeAt(itemId, targetIndex);
      }
      activeDragId = null;
    });
    chip.addEventListener('pointercancel', () => {
      pointerDrag = null;
      activeDragId = null;
      chip.classList.remove('sentence-chip--dragging');
    });
    chip.addEventListener('click', () => {
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      if (returning || lockedIds.has(itemId)) return;
      chooseFromBank(itemId);
    });
  }

  function renderSlots() {
    clear(slots);
    if (!feedbackShown) {
      slotsState.forEach((itemId) => {
        if (!itemId) return;
        const item = itemById.get(itemId);
        if (!item) return;
        const chip = h('button', {
          class: 'sentence-chip sentence-ordering__placed-chip',
          type: 'button',
          'aria-pressed': 'true',
          'aria-label': `${item.word}，再點一次退回候選區`,
          title: '再點一次退回候選區',
        }, item.word);
        chip.addEventListener('click', () => returnToBank(item.id));
        const row = h('span', { class: 'quiz-option-row', style: 'display:inline-flex' }, [
          chip,
          SpeakButton({ text: item.word, label: '聽', ariaLabel: `朗讀詞塊：${item.word}`, variant: 'speak-button--option' }),
        ]);
        slots.appendChild(row);
      });
      return;
    }

    slotsState.forEach((itemId, index) => {
      if (!itemId) {
        const target = h('button', {
          class: 'sentence-chip sentence-ordering__slot-target',
          type: 'button',
          'data-slot-index': index,
          'aria-label': `第 ${index + 1} 個詞塊空位，可將詞塊拖到這裡`,
        }, '放這裡');
        bindDropTarget(target, index);
        slots.appendChild(target);
        return;
      }

      const item = itemById.get(itemId);
      const locked = lockedIds.has(itemId);
      const chip = h('button', {
        class: `sentence-chip sentence-ordering__slot-chip${locked ? ' sentence-chip--correct' : ''}`,
        type: 'button',
        'data-slot-index': index,
        'aria-pressed': 'true',
        'aria-label': locked
          ? `第 ${index + 1} 個詞塊：${item.word}，位置正確`
          : `第 ${index + 1} 個詞塊：${item.word}，可拖曳調整`,
        disabled: locked ? 'disabled' : undefined,
      }, item.word);
      if (!locked) {
        bindDrag(chip, itemId);
        bindDropTarget(chip, index);
      }
      slots.appendChild(chip);
    });
  }

  function renderBank() {
    clear(bankWrap);
    for (const item of bank) {
      if (slotsState.includes(item.id)) continue;
      const chip = chipById.get(item.id);
      if (!chip) continue;
      chip.disabled = false;
      chip.setAttribute('aria-pressed', 'false');
      chip.classList.toggle('sentence-chip--incorrect', item.incorrect);
      chip.classList.toggle('sentence-chip--returning', item.incorrect);
      const row = h('span', { class: 'quiz-option-row', style: 'display:inline-flex' }, [
        chip,
        SpeakButton({ text: item.word, label: '聽', ariaLabel: `朗讀詞塊：${item.word}`, variant: 'speak-button--option' }),
      ]);
      bankWrap.appendChild(row);
    }
  }

  for (const item of bank) {
    const chip = h('button', {
      class: 'sentence-chip',
      type: 'button',
      'aria-pressed': 'false',
      title: '點選加入句子，或拖曳到正確序位',
    }, item.word);
    chipById.set(item.id, chip);
    bindDrag(chip, item.id);
  }

  checkBtn.addEventListener('click', () => {
    if (returning) return;
    const isComplete = slotsState.every(Boolean);
    const isCorrect = isComplete && slotsState.every((itemId, index) => itemById.get(itemId)?.word === solution[index]);
    if (isCorrect) {
      const firstTry = mistakes === 0 && hintsUsed === 0;
      recordOutcome({ firstTry, revealed: false });
      celebrateCorrect(checkBtn, 'var(--module-color)', { firstTry });
      const finished = slotsState.map((itemId) => itemById.get(itemId).word).join('');
      clear(root);
      root.appendChild(
        h('div', { class: 'quiz-option-row' }, [
          h('p', { class: 'quiz-stem' }, finished),
          SpeakButton({ text: finished, label: '聽完成句', variant: 'speak-button--option' }),
        ]),
      );
      root.appendChild(CompletionFeedback({ correct: 1, total: 1, onBack, backLabel, onContinue, continueLabel }));
      return;
    }

    mistakes += 1;
    // 退回前先記下學生排的句子：讓他「聽自己排的」，自己發現哪裡接不起來
    // （2026-10-03 審查建議：不要只說「找句子開頭」）。
    const attemptText = slotsState.map((id) => (id ? itemById.get(id).word : '')).join('');
    const firstWrong = slotsState.findIndex((id, i) => id && itemById.get(id).word !== solution[i]);
    const wrongIds = [];
    slotsState.forEach((itemId, index) => {
      if (!itemId) return;
      const item = itemById.get(itemId);
      if (item.word === solution[index]) lockedIds.add(itemId);
      else wrongIds.push(itemId);
    });

    for (const itemId of wrongIds) {
      const index = slotsState.indexOf(itemId);
      if (index >= 0) slotsState[index] = null;
      const item = itemById.get(itemId);
      item.incorrect = true;
    }
    feedbackShown = true;
    returning = true;
    renderSlots();
    renderBank();
    returning = false;
    if (wrongIds.length > 0) {
      const where = firstWrong >= 0 ? `從第 ${firstWrong + 1} 格開始接不起來。` : '';
      status.textContent = `${where}紅色詞塊已退回候選區；先聽聽你剛才排的句子，哪裡念起來怪怪的？${isComplete ? '' : '尚有空位未完成。'}`;
      if (attemptText) {
        clear(attemptSlot);
        attemptSlot.appendChild(SpeakButton({ text: attemptText, label: '聽我排的句子', showLabel: true, variant: 'speak-button--option speak-button--audio-label' }));
      }
    } else {
      status.textContent = '已排列的詞塊位置正確，請把剩下的詞塊拖到空位。';
    }
  });

  resetBtn.addEventListener('click', () => {
    clear(attemptSlot);
    slotsState.fill(null);
    lockedIds.clear();
    bank.forEach((item) => { item.incorrect = false; });
    feedbackShown = false;
    returning = false;
    activeDragId = null;
    renderSlots();
    renderBank();
    status.textContent = '';
  });

  root.appendChild(instruction);
  root.appendChild(slots);
  root.appendChild(bankWrap);
  root.appendChild(status);
  const attemptSlot = h('div', { class: 'sentence-ordering__attempt' });
  root.appendChild(attemptSlot);
  const actions = h('div', {});
  actions.appendChild(checkBtn);
  actions.appendChild(resetBtn);
  if (hintBtn) actions.appendChild(hintBtn);
  root.appendChild(actions);
  root.appendChild(hintBox);
  renderSlots();
  renderBank();
  return root;
}
