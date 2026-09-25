import { h, clear } from '../utils/dom.js';
import { CompletionFeedback } from './CompletionFeedback.js';
import { SpeakButton } from './SpeakButton.js';
import { recordOutcome } from '../utils/scoreSession.js';
import { celebrateCorrect } from '../utils/celebrate.js';
import { shuffle } from '../utils/shuffle.js';

/**
 * 配對遊戲：鍵盤可操作（不只有拖曳）——先選左欄一項，再選右欄一項，
 * 兩者皆用 button + aria-pressed，Tab/Enter 全程可完成。每個項目旁附獨立
 * 的小喇叭鈕，可朗讀該項目但不會誤觸選取。
 * @param {{pairs: Array<{left:string,right:string}>, onComplete?: () => void, onBack?: () => void, backLabel?: string, instructions?: string}} opts
 */
export function MatchingGame({ pairs, onComplete, onBack, backLabel = '回課程首頁', instructions = '選一個左邊的字，再選右邊對應的答案。' }) {
  const root = h('div', {});
  const left = shuffle(pairs);
  const right = shuffle(pairs);
  const matched = new Set();
  let selectedLeft = null;
  let selectedRight = null;
  let mistakes = 0; // 配對遊戲沒有「揭曉正解」機制，全組完成才記一次星星結果，見下方 recordOutcome

  const status = h('p', { role: 'status', 'aria-live': 'polite', class: 'meta' }, instructions);
  const game = h('div', { class: 'matching-game' });
  const leftCol = h('div', { class: 'matching-column', 'aria-label': '左欄' });
  const rightCol = h('div', { class: 'matching-column', 'aria-label': '右欄' });
  const leftButtons = [];
  const rightButtons = [];

  function checkMatch() {
    if (selectedLeft === null || selectedRight === null) return;
    const leftVal = left[selectedLeft].left;
    const pair = pairs.find((p) => p.left === leftVal);
    const isMatch = pair && pair.right === right[selectedRight].right;
    const leftBtn = leftButtons[selectedLeft];
    const rightBtn = rightButtons[selectedRight];
    if (isMatch) {
      matched.add(leftVal);
      leftBtn.classList.add('matching-item--matched');
      rightBtn.classList.add('matching-item--matched');
      leftBtn.disabled = true;
      rightBtn.disabled = true;
      status.textContent = `✓ 配對正確：${leftVal} ↔ ${pair.right}`;
      celebrateCorrect(rightBtn, 'var(--module-color)', { firstTry: mistakes === 0 });
      if (matched.size === pairs.length) {
        recordOutcome({ firstTry: mistakes === 0, revealed: false });
        root.appendChild(
          CompletionFeedback({ correct: pairs.length, total: pairs.length, onBack, backLabel }),
        );
        if (onComplete) onComplete();
      }
    } else {
      mistakes += 1;
      status.textContent = '✗ 再試試看，這一組不對喔。';
      leftBtn.setAttribute('aria-pressed', 'false');
      rightBtn.setAttribute('aria-pressed', 'false');
    }
    selectedLeft = null;
    selectedRight = null;
  }

  left.forEach((p, i) => {
    const btn = h('button', { class: 'matching-item', type: 'button', 'aria-pressed': 'false' }, p.left);
    leftButtons.push(btn);
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      leftButtons.forEach((c) => c.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      selectedLeft = i;
      checkMatch();
    });
    const row = h('div', { class: 'quiz-option-row' }, [
      btn,
      SpeakButton({ text: p.left, label: '聽', ariaLabel: `朗讀：${p.left}`, variant: 'speak-button--option' }),
    ]);
    leftCol.appendChild(row);
  });

  right.forEach((p, i) => {
    const btn = h('button', { class: 'matching-item', type: 'button', 'aria-pressed': 'false' }, p.right);
    rightButtons.push(btn);
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      rightButtons.forEach((c) => c.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      selectedRight = i;
      checkMatch();
    });
    const row = h('div', { class: 'quiz-option-row' }, [
      btn,
      SpeakButton({ text: p.right, label: '聽', ariaLabel: `朗讀：${p.right}`, variant: 'speak-button--option' }),
    ]);
    rightCol.appendChild(row);
  });

  game.appendChild(leftCol);
  game.appendChild(rightCol);
  root.appendChild(status);
  root.appendChild(game);
  return root;
}
