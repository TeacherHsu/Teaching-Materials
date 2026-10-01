// 「字感訓練」：在一片字陣裡找出目標字。
//
// 這是視覺辨識與注意力的訓練，來源是 CF 提供的「識寫策略學習單」。
// 紙本做不到、數位版才做得到的部分是**記錄歷程**：找到幾個、點錯幾次、
// 花了多久——那正是注意力訓練要看的東西，所以這一項值得做成數位。
//
// 干擾項分兩種，難度不同：
//   形近字（已／己／巳）— 真正的字形辨識，資料來自 lesson.lookalikes，
//                        是教師核可過的形似字組，不是我們亂配的。
//   非字符號（◌ ☺ ♪）— 比較容易排除，支持層多放一點。
//
// 刻意**不計時**（和站上其他活動一致），但記錄花了多久給教師看。
// 計時會讓 ADHD 學生更焦慮，而焦慮正是注意力的敵人。
import { h, clear } from '../utils/dom.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { CompletionFeedback } from '../components/CompletionFeedback.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus } from '../utils/preview.js';
import { shuffle } from '../utils/shuffle.js';
import { getScaffoldLevelKey } from '../utils/deviceSettings.js';
import { recordOutcome } from '../utils/scoreSession.js';
import { celebrateCorrect } from '../utils/celebrate.js';

// 非字干擾：用 Unicode 既有符號，不需要美術資源。
// 刻意挑「筆畫感」接近漢字但明顯不是字的形狀。
const NON_CHARS = ['◌', '☺', '♪', '✦', '❖', '⌘', '✺', '◍', '❂', '⚘'];

// 字陣大小依鷹架：支持層小一點，挑戰層大一點。
const GRID = {
  support: { cols: 3, rows: 3, targets: 2, nonChars: 3 },
  standard: { cols: 4, rows: 4, targets: 3, nonChars: 3 },
  challenge: { cols: 5, rows: 5, targets: 4, nonChars: 2 },
};

/** 可用的形近字組：每組至少要有兩個字才構成「辨識」。 */
export function usableLookalikeGroups(lesson) {
  return filterByStatus(lesson.lookalikes || [])
    .map((group) => ({
      id: group.id,
      chars: (group.chars || []).map((c) => c.char).filter(Boolean),
    }))
    .filter((group) => group.chars.length >= 2);
}

export function canStartVisualSearch(lesson) {
  return usableLookalikeGroups(lesson).length >= 1;
}

/**
 * 組一輪字陣。
 * @returns {{target:string, cells:Array<{text:string, kind:'target'|'lookalike'|'symbol'}>}}
 */
export function buildRound(group, level, shuffleImpl = shuffle) {
  const config = GRID[level] || GRID.standard;
  const size = config.cols * config.rows;
  const chars = shuffleImpl(group.chars);
  const target = chars[0];
  const distractors = chars.slice(1);

  const cells = [];
  for (let i = 0; i < config.targets; i += 1) cells.push({ text: target, kind: 'target' });
  const symbols = shuffleImpl(NON_CHARS).slice(0, config.nonChars);
  for (const symbol of symbols) cells.push({ text: symbol, kind: 'symbol' });
  // 其餘用形近字填滿；形近字不夠時重複使用（它們本來就是要反覆比對的）
  let i = 0;
  while (cells.length < size) {
    cells.push({ text: distractors[i % distractors.length], kind: 'lookalike' });
    i += 1;
  }
  return { target, cells: shuffleImpl(cells), cols: config.cols };
}

/**
 * @param {object} lesson
 * @param {() => void} onBack
 */
export function buildVisualSearchActivity(lesson, onBack) {
  const groups = usableLookalikeGroups(lesson);
  const container = h('div', {});

  if (!groups.length) {
    container.appendChild(missingContentNotice('字感訓練：這一課沒有形似字資料'));
    return container;
  }

  // 字陣大小由教師設定決定
  const level = getScaffoldLevelKey();

  let roundIndex = 0;
  const stats = { rounds: 0, firstTry: 0 };

  function render() {
    clear(container);
    if (roundIndex >= groups.length) {
      container.appendChild(CompletionFeedback({
        correct: stats.firstTry,
        total: stats.rounds,
        onRetry: () => { roundIndex = 0; stats.rounds = 0; stats.firstTry = 0; render(); },
        onBack,
        backLabel: '回課程首頁',
      }));
      return;
    }

    const round = buildRound(groups[roundIndex], level);
    const found = new Set();
    const wanted = round.cells.filter((c) => c.kind === 'target').length;
    let misses = 0;
    const startedAt = Date.now();

    const task = `在下面找出所有的「${round.target}」，一共有 ${wanted} 個。`;
    container.appendChild(TaskBanner({
      label: task,
      step: `第 ${roundIndex + 1}／${groups.length} 組`,
    }));
    container.appendChild(h('div', { class: 'quiz-option-row' }, [
      SpeakButton({ text: task, label: '聽題目', showLabel: true, variant: 'speak-button--option' }),
    ]));

    const status = h('p', { class: 'vsearch__status', role: 'status', 'aria-live': 'polite' },
      `找到 0／${wanted}`);

    const grid = h('div', {
      class: 'vsearch__grid',
      role: 'group',
      'aria-label': `字陣，找出所有的${round.target}`,
      style: `--vsearch-cols:${round.cols}`,
    });

    round.cells.forEach((cell, index) => {
      const isTarget = cell.kind === 'target';
      const btn = h('button', {
        class: 'vsearch__cell',
        type: 'button',
        'aria-label': `第 ${index + 1} 格：${cell.text}`,
      }, cell.text);
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        if (isTarget) {
          found.add(index);
          btn.disabled = true;
          btn.classList.add('vsearch__cell--found');
          celebrateCorrect(btn, 'var(--module-color)', { firstTry: misses === 0 });
          status.textContent = `找到 ${found.size}／${wanted}`;
          if (found.size === wanted) finish();
        } else {
          misses += 1;
          btn.classList.add('vsearch__cell--miss');
          setTimeout(() => btn.classList.remove('vsearch__cell--miss'), 600);
          status.textContent = `這個不是「${round.target}」，再看看。（找到 ${found.size}／${wanted}）`;
        }
      });
      grid.appendChild(btn);
    });

    const actions = h('div', { class: 'quiz-option-row vsearch__actions' }, []);

    function finish() {
      const seconds = Math.round((Date.now() - startedAt) / 1000);
      stats.rounds += 1;
      const clean = misses === 0;
      if (clean) stats.firstTry += 1;
      recordOutcome({ firstTry: clean, revealed: false });
      status.textContent = clean
        ? `全部找到了，而且一次都沒點錯！（花了 ${seconds} 秒）`
        : `全部找到了。點錯 ${misses} 次，花了 ${seconds} 秒。`;
      clear(actions);
      const next = h('button', { class: 'btn btn--primary', type: 'button' },
        roundIndex < groups.length - 1 ? '下一組' : '看結果');
      next.addEventListener('click', () => { roundIndex += 1; render(); });
      actions.appendChild(next);
    }

    container.appendChild(status);
    container.appendChild(grid);
    container.appendChild(actions);
  }

  render();
  return container;
}
