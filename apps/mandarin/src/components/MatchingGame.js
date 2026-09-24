import { h, clear } from '../utils/dom.js';
import { CompletionFeedback } from './CompletionFeedback.js';

/**
 * 配對遊戲：鍵盤可操作（不只有拖曳）——先選左欄一項，再選右欄一項，
 * 兩者皆用 button + aria-pressed，Tab/Enter 全程可完成。
 * @param {{pairs: Array<{left:string,right:string}>, onComplete?: () => void, onBack?: () => void}} opts
 */
export function MatchingGame({ pairs, onComplete, onBack }) {
  const root = h('div', {});
  const left = [...pairs].sort(() => Math.random() - 0.5);
  const right = [...pairs].sort(() => Math.random() - 0.5);
  const matched = new Set();
  let selectedLeft = null;
  let selectedRight = null;

  const status = h('p', { role: 'status', 'aria-live': 'polite', class: 'meta' }, '選一個左邊的字，再選右邊對應的答案。');
  const game = h('div', { class: 'matching-game' });
  const leftCol = h('div', { class: 'matching-column', 'aria-label': '左欄' });
  const rightCol = h('div', { class: 'matching-column', 'aria-label': '右欄' });

  function checkMatch() {
    if (selectedLeft === null || selectedRight === null) return;
    const leftVal = left[selectedLeft].left;
    const pair = pairs.find((p) => p.left === leftVal);
    const isMatch = pair && pair.right === right[selectedRight].right;
    const leftBtn = leftCol.children[selectedLeft];
    const rightBtn = rightCol.children[selectedRight];
    if (isMatch) {
      matched.add(leftVal);
      leftBtn.classList.add('matching-item--matched');
      rightBtn.classList.add('matching-item--matched');
      leftBtn.disabled = true;
      rightBtn.disabled = true;
      status.textContent = `配對正確：${leftVal} ↔ ${pair.right}`;
      if (matched.size === pairs.length) {
        root.appendChild(
          CompletionFeedback({ correct: pairs.length, total: pairs.length, onBack }),
        );
        if (onComplete) onComplete();
      }
    } else {
      status.textContent = '再試試看，不對喔。';
      leftBtn.setAttribute('aria-pressed', 'false');
      rightBtn.setAttribute('aria-pressed', 'false');
    }
    selectedLeft = null;
    selectedRight = null;
  }

  left.forEach((p, i) => {
    const btn = h('button', { class: 'matching-item', type: 'button', 'aria-pressed': 'false' }, p.left);
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      [...leftCol.children].forEach((c) => c.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      selectedLeft = i;
      checkMatch();
    });
    leftCol.appendChild(btn);
  });

  right.forEach((p, i) => {
    const btn = h('button', { class: 'matching-item', type: 'button', 'aria-pressed': 'false' }, p.right);
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      [...rightCol.children].forEach((c) => c.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      selectedRight = i;
      checkMatch();
    });
    rightCol.appendChild(btn);
  });

  game.appendChild(leftCol);
  game.appendChild(rightCol);
  root.appendChild(status);
  root.appendChild(game);
  return root;
}
