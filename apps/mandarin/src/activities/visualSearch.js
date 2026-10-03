// 「字感訓練」：建立生字的「心理圖像」——學生腦中要能看見字長什麼樣，
// 才寫得出來。三種題型由易到難：
//
//   1. 視覺搜尋：在字陣裡找出目標字（辨識）
//   2. 遮罩補全：字被遮掉一半，猜是哪個字（部件辨識）
//   3. 閃現後寫出：字出現後消失，憑記憶寫出來（字形記憶）
//
// 第 2、3 種依組別分層（CF 2026-10-03）：
//   高組：自己打字或手寫輸入；閃現 5 秒後自動蓋起來
//   中組：自己打字或手寫輸入；閃現由學生按「我記住了」才蓋
//   低組：從形近字選項裡選（辨認比回憶容易）
//
// 第 2、3 種是「部件拼一拼」學習單的數位替代方案。原本的做法要有拆字資料，
// 但 etymology.components 只有 7% 覆蓋率。遮罩不需要拆字資料——漢字本來就是
// 空間組合的，用 CSS 遮掉左半，剩下的「禾」就是幾何上免費得到的部件。
// 閃現則切斷視覺比對，強迫從記憶中提取，那正是心理圖像的訓練。
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
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus } from '../utils/preview.js';
import { shuffle } from '../utils/shuffle.js';
import { getScaffoldLevelKey } from '../utils/deviceSettings.js';
import { recordOutcome } from '../utils/scoreSession.js';
import { celebrateCorrect } from '../utils/celebrate.js';
import { noteMistake } from '../utils/mistakes.js';
import { HintPanel } from '../components/HintPanel.js';
import { hanziPartsIfReady } from '../utils/hanziParts.js';
import { buildExtensionLinks } from '../components/ExtensionLinks.js';
import { partdleUrl } from '../utils/partdle.js';

// 非字干擾：用 Unicode 既有符號，不需要美術資源。
// 刻意挑「筆畫感」接近漢字但明顯不是字的形狀。
const NON_CHARS = ['◌', '☺', '♪', '✦', '❖', '⌘', '✺', '◍', '❂', '⚘'];

// 字陣大小依鷹架：支持層小一點，挑戰層大一點。
const GRID = {
  support: { cols: 3, rows: 3, targets: 2, nonChars: 3 },
  // 標準、挑戰層不放非字符號：干擾項全部是形似字（CF 2026-10-04）
  standard: { cols: 4, rows: 4, targets: 3, nonChars: 0 },
  challenge: { cols: 5, rows: 5, targets: 4, nonChars: 0 },
};

/** 可用的形近字組：每組至少要有兩個字才構成「辨識」。 */
export function usableLookalikeGroups(lesson) {
  return filterByStatus(lesson.lookalikes || [])
    // 標了「字形不像」的組（同音字或誤植）不出題（CF 2026-10-04：沒有形似字就不要硬出題）
    .filter((group) => !group.not_shape_similar)
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
  // 干擾項只用官方核對過的同組形似字（CF 2026-10-04：不自行補字）
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

/** 遮罩的方向：各遮掉一半，剩下的那半就是「部件」。 */
/**
 * 選項＝正解＋最多三個形近字，再洗牌。
 * 不能先把整組洗牌再取前四個：一組超過四個字時（六上 L05「戴載截裁栽」），
 * 正解有機會被切掉，題目就沒有正確答案（CF 2026-10-03 回報）。
 */
export function optionsWithAnswer(answer, chars, shuffleImpl = shuffle, max = 4) {
  const others = shuffleImpl(chars.filter((c) => c !== answer)).slice(0, max - 1);
  return shuffleImpl([answer, ...others]);
}

const MASK_SIDES = [
  { key: 'left', label: '左半邊被遮住了' },
  { key: 'right', label: '右半邊被遮住了' },
  { key: 'top', label: '上半部被遮住了' },
  { key: 'bottom', label: '下半部被遮住了' },
];

/**
 * 遮罩補全：顯示被遮掉一半的字，從同組形近字裡選出正確的。
 * 形近字當選項是刻意的——它們的另一半長得很像，學生必須看懂露出來的部件。
 */
export function buildMaskItems(groups, shuffleImpl = shuffle, parts = null) {
  const items = [];
  for (const group of groups) {
    for (const char of group.chars) {
      const others = group.chars.filter((c) => c !== char);
      if (!others.length) continue;
      // 遮「共同的那半」、露出不同的部件（墨／黑 遮下半部就兩個都剩「黑」，沒有正解）。
      // 部件資料算不出方向的字才隨機。
      const planned = parts?.mask_side?.[group.id]?.[char];
      const side = MASK_SIDES.find((m) => m.key === planned) || shuffleImpl(MASK_SIDES)[0];
      items.push({
        char,
        side,
        options: optionsWithAnswer(char, group.chars, shuffleImpl),
        answer: char,
      });
    }
  }
  return shuffleImpl(items);
}

/**
 * 閃現後寫出：字出現兩秒就消失，再從形近字裡選出剛剛看到的那個。
 * 看得到字的時候不能作答，看不到的時候才能選——這樣才是考記憶不是考比對。
 */
export function buildFlashItems(groups, shuffleImpl = shuffle, parts = null) {
  const items = [];
  for (const group of groups) {
    if (group.chars.length < 2) continue;
    for (const char of group.chars) {
      items.push({
        char,
        options: optionsWithAnswer(char, group.chars, shuffleImpl),
        answer: char,
      });
    }
  }
  return shuffleImpl(items);
}

/** 依組別決定：要不要自己寫出來（高、中組），閃現要不要自動蓋起來（高組）。 */
export function recallMode(levelKey) {
  return {
    typed: levelKey === 'standard' || levelKey === 'challenge',
    autoHideMs: levelKey === 'challenge' ? 5000 : 0,
  };
}

/** 從輸入框的字串取出第一個漢字（平板手寫、注音輸入法都可能多帶空白或標點）。 */
export function firstHanzi(value) {
  const match = String(value || '').match(/\p{Script=Han}/u);
  return match ? match[0] : '';
}

/**
 * 自己寫出目標字：打字或用平板手寫輸入都行。
 * 「寫得出來」比「認得出來」難一個層次，所以只給高、中組。
 * 寫不出來時可以改用選的，不讓一個字卡住整個練習。
 */
function TypeAnswer({ item, hint, onResolved }) {
  const root = h('div', { class: 'type-answer' });
  const input = h('input', {
    class: 'type-answer__input',
    type: 'text',
    inputmode: 'text',
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: 'false',
    maxlength: '4',
    'aria-label': '把字寫在這裡',
    placeholder: '寫在這裡',
  });
  const submit = h('button', { class: 'btn btn--primary', type: 'button' }, '確定');
  const fallback = h('button', { class: 'btn btn--ghost', type: 'button' }, '我寫不出來，改用選的');
  const feedback = h('div', { role: 'status', 'aria-live': 'polite' });
  let attempts = 0;
  let done = false;

  function finish(firstTry) {
    done = true;
    input.disabled = true;
    submit.remove?.();
    fallback.remove?.();
    recordOutcome({ firstTry, revealed: !firstTry });
    if (!firstTry) noteMistake({ stem: item.stem, options: item.options, answer: item.answer });
    onResolved(firstTry);
  }

  function check() {
    if (done) return;
    const got = firstHanzi(input.value);
    if (!got) {
      clear(feedback);
      feedback.appendChild(h('p', { class: 'meta' }, '先把字寫進框框裡。'));
      return;
    }
    attempts += 1;
    clear(feedback);
    if (got === item.answer) {
      input.classList.add('type-answer__input--correct');
      celebrateCorrect(input, 'var(--module-color)', { firstTry: attempts === 1 });
      feedback.appendChild(h('p', { class: 'meta type-answer__ok' }, '寫對了！'));
      finish(attempts === 1);
      return;
    }
    input.classList.add('type-answer__input--wrong');
    setTimeout(() => input.classList.remove('type-answer__input--wrong'), 600);
    if (attempts < 2) {
      feedback.appendChild(HintPanel({ message: `你寫的是「${got}」。${hint}` }));
      input.select?.();
      return;
    }
    feedback.appendChild(h('div', { class: 'type-answer__reveal' }, [
      h('span', { class: 'meta' }, '正確的字是'),
      h('span', { class: 'type-answer__glyph' }, item.answer),
    ]));
    finish(false);
  }

  submit.addEventListener('click', check);
  input.addEventListener('keydown', (e) => {
    // 輸入法選字時按 Enter 不算送出（isComposing），不然注音一選字就被判錯
    if (e.key === 'Enter' && !e.isComposing) check();
  });
  // 改用選的：就地換成形近字選項（不另開一個 ChoiceQuiz——那會多出一張
  // 「完成了 1／1」的結算卡，學生要多按一次才回到這一步）。
  // 退回選擇題就不算獨立寫出，結果照樣記入錯題盒。
  fallback.addEventListener('click', () => {
    if (done) return;
    clear(root);
    const note = h('div', { role: 'status', 'aria-live': 'polite' });
    const buttons = item.options.map((opt) => {
      const btn = h('button', { class: 'quiz-option type-answer__choice', type: 'button' }, opt);
      btn.addEventListener('click', () => {
        if (done || btn.disabled) return;
        if (opt === item.answer) {
          btn.classList.add('quiz-option--correct');
          buttons.forEach((b) => { b.disabled = true; });
          clear(note);
          note.appendChild(h('p', { class: 'meta type-answer__ok' }, '選對了！'));
          finish(false);
          return;
        }
        btn.classList.add('quiz-option--incorrect');
        btn.disabled = true;
        clear(note);
        note.appendChild(HintPanel({ message: hint }));
      });
      return btn;
    });
    root.appendChild(h('div', { class: 'quiz-options type-answer__choices' }, buttons));
    root.appendChild(note);
  });

  root.appendChild(h('div', { class: 'type-answer__row' }, [input, submit]));
  root.appendChild(feedback);
  root.appendChild(h('div', { class: 'type-answer__row' }, [fallback]));
  setTimeout(() => input.focus?.(), 50);
  return root;
}

/**
 * @param {object} lesson
 * @param {() => void} onBack
 */
export function buildVisualSearchActivity(lesson, onBack) {
  // 部件資料（遮蔽方向）在課次首頁就先載好；還沒載到就隨機遮。
  const activity = buildVisualSearchWithParts(lesson, onBack, hanziPartsIfReady(String(lesson.lesson_id || '').slice(0, 7)));
  // 雄老師部件拼字放在字感訓練頁最上方（CF 2026-10-04），和生字頁的雄筆順同一種連結列
  const url = partdleUrl(lesson);
  const link = url && buildExtensionLinks({ extensions: [{
    module: 'visual_search', type: 'game', title: '部件拼字(雄老師)', url, provider: '雄老師', compact: true, status: 'approved',
  }] }, 'visual_search', { collapsible: false });
  return link ? h('div', {}, [link, activity]) : activity;
}

function buildVisualSearchWithParts(lesson, onBack, parts) {
  const groups = usableLookalikeGroups(lesson);
  const container = h('div', {});

  if (!groups.length) {
    container.appendChild(missingContentNotice('字感訓練：這一課沒有形似字資料'));
    return container;
  }

  // 字陣大小由教師設定決定
  const level = getScaffoldLevelKey();

  // 三個步驟依序進行：找字 → 遮罩補全 → 閃現後寫出，由易到難。
  const maskItems = buildMaskItems(groups, shuffle, parts).slice(0, 4);
  const flashItems = buildFlashItems(groups, shuffle, parts).slice(0, 4);
  const steps = ['search'];
  if (maskItems.length) steps.push('mask');
  if (flashItems.length) steps.push('flash');
  let stepIndex = 0;

  let roundIndex = 0;
  const stats = { rounds: 0, firstTry: 0 };

  function nextStep() {
    stepIndex += 1;
    roundIndex = 0;
    render();
  }

  function render() {
    clear(container);
    if (steps[stepIndex] === 'mask') { renderMask(); return; }
    if (steps[stepIndex] === 'flash') { renderFlash(); return; }
    if (roundIndex >= groups.length) {
      if (stepIndex < steps.length - 1) { nextStep(); return; }
      container.appendChild(CompletionFeedback({
        correct: stats.firstTry,
        total: stats.rounds,
        onRetry: () => { roundIndex = 0; stats.rounds = 0; stats.firstTry = 0; render(); },
        onBack,
        backLabel: '回課程首頁',
      }));
      return;
    }

    const round = buildRound(groups[roundIndex], level, shuffle);
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

    // 目標字獨立放大、上色（CF 2026-10-03）：原本只寫在題目句子裡，和字陣同樣大小，
    // 學生要一直回頭看題目才記得在找哪個字。先讓目標字留在眼前，視覺搜尋才練得到。
    container.appendChild(h('div', { class: 'vsearch__target', 'aria-hidden': 'true' }, [
      h('span', { class: 'vsearch__target-label' }, '找這個字'),
      h('span', { class: 'vsearch__target-glyph' }, round.target),
    ]));
    container.appendChild(status);
    container.appendChild(grid);
    container.appendChild(actions);
  }

  // ── 遮罩補全 ────────────────────────────────────
  const mode = recallMode(level);
  const MASK_HINT = '看看露出來的那一半，想想哪一個字有這個部分。';

  function renderMask() {
    if (!mode.typed) { renderMaskChoice(); return; }
    let index = 0;
    function showOne() {
      clear(container);
      if (index >= maskItems.length) { nextStep(); return; }
      const item = maskItems[index];
      container.appendChild(TaskBanner({
        label: '字被遮住一半了，把整個字寫出來。',
        step: `第 ${stepIndex + 1}／${steps.length} 步 ・ 第 ${index + 1}／${maskItems.length} 題`,
      }));
      container.appendChild(h('div', { class: 'glyph-quiz' }, [
        h('span', { class: `glyph-mask glyph-mask--${item.side.key}` }, item.char),
        h('span', { class: 'glyph-quiz__hint' }, item.side.label),
      ]));
      const next = h('div', { class: 'quiz-option-row' });
      container.appendChild(TypeAnswer({
        item: { stem: `${item.side.label}，這是哪一個字？`, options: item.options, answer: item.answer },
        hint: MASK_HINT,
        onResolved: () => {
          stats.rounds += 1;
          const btn = h('button', { class: 'btn btn--primary', type: 'button' },
            index < maskItems.length - 1 ? '下一題' : '繼續：閃一下就不見');
          btn.addEventListener('click', () => { index += 1; showOne(); });
          next.appendChild(btn);
        },
      }));
      container.appendChild(next);
    }
    showOne();
  }

  function renderMaskChoice() {
    const items = maskItems.map((item) => ({
      id: `mask:${item.char}:${item.side.key}`,
      stem: `${item.side.label}，這是哪一個字？`,
      stemContent: h('div', { class: 'glyph-quiz' }, [
        h('span', { class: `glyph-mask glyph-mask--${item.side.key}` }, item.char),
        h('span', { class: 'glyph-quiz__hint' }, item.side.label),
      ]),
      options: item.options,
      answer: item.answer,
      explanation: `答案是「${item.answer}」。`,
      hints: [MASK_HINT],
    }));
    container.appendChild(TaskBanner({
      label: '字被遮住一半了，猜猜看是哪一個字。',
      step: `第 ${stepIndex + 1}／${steps.length} 步`,
    }));
    container.appendChild(ChoiceQuiz({
      items,
      onBack,
      backLabel: '回課程首頁',
      onContinue: stepIndex < steps.length - 1 ? nextStep : null,
      continueLabel: '繼續：閃一下就不見',
    }));
  }

  // ── 閃現後寫出 ──────────────────────────────────
  function renderFlash() {
    let index = 0;

    function showOne() {
      clear(container);
      if (index >= flashItems.length) {
        container.appendChild(CompletionFeedback({
          correct: stats.firstTry,
          total: stats.rounds,
          onRetry: () => { stepIndex = 0; roundIndex = 0; stats.rounds = 0; stats.firstTry = 0; render(); },
          onBack,
          backLabel: '回課程首頁',
        }));
        return;
      }
      const item = flashItems[index];
      container.appendChild(TaskBanner({
        label: mode.autoHideMs
          ? '看清楚這個字，5 秒後會蓋起來，再把它寫出來。'
          : '看清楚這個字，記住了就按下面的按鈕，字會蓋起來。',
        step: `第 ${stepIndex + 1}／${steps.length} 步 ・ 第 ${index + 1}／${flashItems.length} 題`,
      }));

      const stage = h('div', { class: 'glyph-quiz' }, [
        h('span', { class: 'glyph-flash' }, item.char),
      ]);
      const slot = h('div', {});
      container.appendChild(stage);
      container.appendChild(slot);

      // 中、低組由學生自己按「我記住了」才蓋掉，不倒數計時：
      // 計時對 ADHD 學生是額外的焦慮來源，而焦慮正是記憶的敵人。
      // 高組才限時 5 秒（CF 2026-10-03）——對已經掌握字形的學生，
      // 縮短觀看時間才有挑戰，練的是快速建立心理圖像。
      const ready = h('button', { class: 'btn btn--primary', type: 'button' }, '我記住了');
      let hidden = false;
      const hide = () => {
        if (hidden) return;
        hidden = true;
        clear(stage);
        stage.appendChild(h('span', { class: 'glyph-flash glyph-flash--gone' }, '？'));
        ready.remove();
        if (mode.typed) {
          const next = h('div', { class: 'quiz-option-row' });
          slot.appendChild(TypeAnswer({
            item: { stem: '剛剛看到的是哪一個字？', options: item.options, answer: item.answer },
            hint: '想想它的部首在左邊還是上面。',
            onResolved: () => {
              stats.rounds += 1;
              const btn = h('button', { class: 'btn btn--primary', type: 'button' },
                index < flashItems.length - 1 ? '下一題' : '看結果');
              btn.addEventListener('click', () => { index += 1; showOne(); });
              next.appendChild(btn);
            },
          }));
          slot.appendChild(next);
          return;
        }
        slot.appendChild(ChoiceQuiz({
          items: [{
            id: `flash:${item.char}:${index}`,
            stem: '剛剛看到的是哪一個字？',
            options: item.options,
            answer: item.answer,
            explanation: `答案是「${item.answer}」。`,
            hints: ['想想它的部首在左邊還是上面。'],
          }],
          onBack,
          backLabel: '回課程首頁',
          onContinue: () => { index += 1; showOne(); },
          continueLabel: index < flashItems.length - 1 ? '下一題' : '看結果',
        }));
      };
      ready.addEventListener('click', hide);
      if (mode.autoHideMs) {
        stage.appendChild(h('span', { class: 'glyph-flash__timer', style: `--flash-ms:${mode.autoHideMs}ms` }));
        setTimeout(hide, mode.autoHideMs);
      } else {
        container.appendChild(h('div', { class: 'quiz-option-row' }, [ready]));
      }
    }

    showOne();
  }

  render();
  return container;
}
