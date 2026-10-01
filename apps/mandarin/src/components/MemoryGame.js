// 翻牌記憶遊戲：全部牌面蓋著，翻兩張，配對成功就留著。
//
// 和 MatchingGame 吃同一份 pairs 資料（{left, right}），所以呼叫端換一個元件
// 就好，資料不必改。只在**挑戰層**開放。
//
// ── 為什麼只給挑戰層，而且放在加練區 ──────────────────
// 工作記憶正是學障學生的弱項，翻牌遊戲直接打在弱點上。所以：
//   · 只在挑戰層出現（照定義是能力較好的學生）
//   · 放在「加練挑戰」區，不進核心流程——不會有人被迫玩
//   · 不計時、不計步數、不排名
//   · 「再看一次」可以把全部翻開看兩秒，次數不限。這是鷹架不是作弊；
//     能自己決定要不要看，比一直失敗有用
//   · 翻錯要等一下才蓋回去，不能立刻——注意力弱的學生需要時間登錄
//     剛剛看到什麼
import { h, clear } from '../utils/dom.js';
import { CompletionFeedback } from './CompletionFeedback.js';
import { SpeakButton } from './SpeakButton.js';
import { recordOutcome } from '../utils/scoreSession.js';
import { celebrateCorrect } from '../utils/celebrate.js';
import { shuffle } from '../utils/shuffle.js';

/** 翻錯之後蓋回去的等待時間。不能太短——要讓人看得完。 */
const FLIP_BACK_MS = 1200;
/** 「再看一次」全部翻開的時間。 */
const PEEK_MS = 2000;

/**
 * @param {{
 *   pairs: Array<{left: string, right: string}>,
 *   onComplete?: () => void,
 *   onBack?: () => void,
 *   backLabel?: string,
 *   onContinue?: (() => void)|null,
 *   continueLabel?: string,
 *   instructions?: string,
 * }} opts
 */
export function MemoryGame({
  pairs,
  onComplete,
  onBack,
  backLabel = '回課程首頁',
  onContinue,
  continueLabel = '加練下一組',
  instructions = '翻開兩張卡片，配成一對就留著。',
}) {
  const root = h('div', {});

  // 每一組拆成兩張牌，用 pairIndex 認親（同名的左欄文字不會互相誤配）
  const cards = shuffle(
    pairs.flatMap((pair, pairIndex) => [
      { pairIndex, side: 'left', text: pair.left },
      { pairIndex, side: 'right', text: pair.right },
    ]),
  );

  const matched = new Set();
  let first = null;
  let busy = false;
  let mistakes = 0;

  const status = h('p', { role: 'status', 'aria-live': 'polite', class: 'meta' }, instructions);
  const grid = h('div', { class: 'memory-game' });
  const buttons = [];

  function faceUp(entry) {
    entry.btn.classList.add('memory-card--up');
    entry.btn.setAttribute('aria-label', entry.card.text);
    clear(entry.btn);
    entry.btn.appendChild(h('span', { class: 'memory-card__text' }, entry.card.text));
  }

  function faceDown(entry) {
    if (matched.has(entry.card.pairIndex)) return;
    entry.btn.classList.remove('memory-card--up');
    entry.btn.setAttribute('aria-label', `第 ${entry.index + 1} 張，還沒翻開`);
    clear(entry.btn);
    entry.btn.appendChild(h('span', { class: 'memory-card__back', 'aria-hidden': 'true' }, '？'));
  }

  function finish() {
    // 和 MatchingGame 一致：整組完成才記一次，沒有「揭曉正解」的概念
    recordOutcome({ firstTry: mistakes === 0, revealed: false });
    clear(root);
    root.appendChild(CompletionFeedback({
      correct: mistakes === 0 ? 1 : 0,
      total: 1,
      onBack,
      backLabel,
      onContinue,
      continueLabel,
    }));
    if (onComplete) onComplete();
  }

  cards.forEach((card, index) => {
    const btn = h('button', {
      class: 'memory-card',
      type: 'button',
      'aria-label': `第 ${index + 1} 張，還沒翻開`,
    }, [h('span', { class: 'memory-card__back', 'aria-hidden': 'true' }, '？')]);
    const entry = { card, btn, index };
    buttons.push(entry);

    btn.addEventListener('click', () => {
      if (busy || matched.has(card.pairIndex)) return;
      if (first && first.index === index) return;      // 同一張再按一次：忽略
      faceUp(entry);

      if (!first) { first = entry; return; }

      if (first.card.pairIndex === card.pairIndex) {
        matched.add(card.pairIndex);
        [first, entry].forEach((e) => {
          e.btn.classList.add('memory-card--matched');
          e.btn.disabled = true;
        });
        celebrateCorrect(btn, 'var(--module-color)', { firstTry: mistakes === 0 });
        status.textContent = `配對成功！還有 ${pairs.length - matched.size} 對。`;
        first = null;
        if (matched.size === pairs.length) setTimeout(finish, 400);
        return;
      }

      // 翻錯：等一下才蓋回去，讓人看得完
      mistakes += 1;
      busy = true;
      status.textContent = '這兩張不是一對，再看看。';
      const wrongFirst = first;
      first = null;
      setTimeout(() => {
        faceDown(wrongFirst);
        faceDown(entry);
        busy = false;
      }, FLIP_BACK_MS);
    });

    grid.appendChild(btn);
  });

  // 「再看一次」：全部翻開看兩秒。次數不限——這是鷹架不是作弊。
  const peek = h('button', { class: 'btn', type: 'button' }, '再看一次');
  peek.addEventListener('click', () => {
    if (busy) return;
    busy = true;
    peek.disabled = true;
    buttons.forEach(faceUp);
    status.textContent = '全部翻開兩秒，記一下位置。';
    setTimeout(() => {
      buttons.forEach((entry) => {
        if (first && first.index === entry.index) return;
        faceDown(entry);
      });
      busy = false;
      peek.disabled = false;
      status.textContent = instructions;
    }, PEEK_MS);
  });

  root.appendChild(h('div', { class: 'quiz-option-row' }, [
    peek,
    SpeakButton({ text: instructions, label: '聽', variant: 'speak-button--option' }),
  ]));
  root.appendChild(status);
  root.appendChild(grid);
  return root;
}
