// 「注音高手」：聽語詞 → 用注音鍵盤打出注音 → 選出正確的字。
//
// 設計原始來源：雄老師「HTML5 FUN 注音高手」。本站為自行實作，未使用其程式碼；
// 頁面底部標示出處。
//
// 為什麼要有這個大項：本站其餘大項全是「再認」（從給定選項挑一個），學生可以
// 靠刪去法通過卻不見得真的會。注音打字是唯一的「產出」活動——聽到音要自己把
// 聲符、韻符、聲調一個個打出來，沒有選項可猜，練的是聲韻覺識與注音自動化。
// 規格：docs/specs/2026-09-30-zhuyin-typing.md
import { h, clear } from '../utils/dom.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { HintPanel } from '../components/HintPanel.js';
import { CompletionFeedback } from '../components/CompletionFeedback.js';
import { ZhuyinKeyboard, KEY_MAP } from '../components/ZhuyinKeyboard.js';
import { splitSyllables, syllablesMatchWord } from '../utils/zhuyin.js';
import { getScaffoldLevel } from '../utils/deviceSettings.js';
import { recordOutcome } from '../utils/scoreSession.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus } from '../utils/preview.js';

const CANDIDATE_COUNT = { support: 3, standard: 5, challenge: 8 };
let charIndexCache = null;

/** 候選字索引（同音字與高頻字）；載入失敗時回空表，活動仍可跑，只是干擾項較弱。 */
async function loadCharIndex(base = '') {
  if (charIndexCache) return charIndexCache;
  try {
    const res = await fetch(`${base}data/_index/char-index.json`, { cache: 'force-cache' });
    charIndexCache = res.ok ? await res.json() : { chars: {} };
  } catch {
    charIndexCache = { chars: {} };
  }
  return charIndexCache;
}

/** 可以出題的語詞：有注音、有圖、且注音音節數對得上字數。 */
export function typableWords(lesson) {
  return filterByStatus(lesson.words || []).filter(
    (w) => w.word && w.zhuyin && syllablesMatchWord(w.word, w.zhuyin),
  );
}

export function canStartZhuyinTyping(lesson) {
  return typableWords(lesson).length >= 3;
}

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

/**
 * 選字階段的候選：正確答案 ＋ 高頻干擾字，亂序。
 * 干擾優先序：同音字 > 只差聲調 > 其餘高頻字。同音字最有教學價值，
 * 因為它逼學生分辨字形，而不是靠讀音消去。
 */
export function pickCandidates(answerChar, answerSyllable, index, count) {
  const chars = (index && index.chars) || {};
  const base = String(answerSyllable || '').replace(/[ˊˇˋ˙]$/u, '');
  const sameSound = [];
  const sameBase = [];
  const others = [];
  for (const [char, info] of Object.entries(chars)) {
    if (char === answerChar) continue;
    const readings = info.z || [];
    if (readings.includes(answerSyllable)) sameSound.push(char);
    else if (readings.some((z) => z.replace(/[ˊˇˋ˙]$/u, '') === base)) sameBase.push(char);
    else others.push(char);
  }
  const pool = [...shuffled(sameSound), ...shuffled(sameBase), ...others];
  return shuffled([answerChar, ...pool.slice(0, Math.max(0, count - 1))]);
}

/**
 * @param {object} lesson
 * @param {() => void} onModuleDone
 */
export function buildZhuyinTypingActivity(lesson, onModuleDone) {
  const container = h('div', {});
  const level = getScaffoldLevel();
  const words = shuffled(typableWords(lesson)).slice(0, level.roundSize);

  if (words.length < 3) {
    container.appendChild(missingContentNotice('注音高手：教材準備中（這一課的語詞還沒有注音）'));
    return container;
  }

  let index = 0;
  let correctCount = 0;
  let charIndex = { chars: {} };
  loadCharIndex(container.__base || '').then((data) => { charIndex = data; });

  function renderQuestion() {
    clear(container);
    const word = words[index];
    const syllables = splitSyllables(word.zhuyin);
    const chars = [...word.word];

    let slot = 0;                 // 目前在打第幾個字
    let typed = '';               // 這個字已經打的符號
    let hintLevel = 0;
    let usedHelp = false;         // 用過提示（不扣星，只是不算 firstTry）
    let wrongOnce = false;

    const speakText = word.word;
    const image = word.image
      ? h('img', { class: 'zt__image', src: `.${word.image}`, alt: '', loading: 'lazy' })
      : null;

    const slotsEl = h('div', { class: 'zt__slots', 'aria-live': 'polite' });
    const feedbackEl = h('div', { class: 'zt__feedback' });
    const chooserEl = h('div', { class: 'zt__chooser' });

    function renderSlots() {
      clear(slotsEl);
      chars.forEach((_, i) => {
        const done = i < slot;
        const current = i === slot;
        slotsEl.appendChild(h('div', {
          class: `zt__slot${done ? ' zt__slot--done' : ''}${current ? ' zt__slot--current' : ''}`,
        }, [
          h('span', { class: 'zt__slot-zhuyin' }, done ? syllables[i] : (current ? typed || '　' : '　')),
          h('span', { class: 'zt__slot-char' }, done ? (chars[i] || '') : '？'),
        ]));
      });
    }

    function finishItem() {
      recordOutcome({ firstTry: !usedHelp && !wrongOnce, revealed: false });
      correctCount += 1;
      next();
    }

    function skipItem() {
      recordOutcome({ firstTry: false, revealed: true });
      next();
    }

    function next() {
      index += 1;
      if (index >= words.length) renderDone();
      else renderQuestion();
    }

    /** 注音打對之後，讓學生從候選國字中選字。 */
    function askForCharacter() {
      clear(feedbackEl);
      clear(chooserEl);
      const count = CANDIDATE_COUNT[level.key] || 5;
      const candidates = pickCandidates(chars[slot], syllables[slot], charIndex, count);
      chooserEl.appendChild(h('p', { class: 'zt__chooser-stem' }, `「${syllables[slot]}」是哪一個字？`));
      const row = h('div', { class: 'zt__candidates' }, candidates.map((c) => {
        const btn = h('button', { class: 'zt__candidate', type: 'button' }, c);
        btn.addEventListener('click', () => {
          if (c === chars[slot]) {
            slot += 1;
            typed = '';
            hintLevel = 0;
            clear(chooserEl);
            renderSlots();
            if (slot >= chars.length) finishItem();
          } else {
            wrongOnce = true;
            btn.classList.add('zt__candidate--wrong');
            btn.disabled = true;
            clear(feedbackEl);
            feedbackEl.appendChild(HintPanel({ message: '再看一次這個字的形狀，哪一個和語詞的意思有關？' }));
          }
        });
        return btn;
      }));
      chooserEl.appendChild(row);
    }

    function press(symbol) {
      if (slot >= chars.length || chooserEl.childElementCount > 0) return;
      const target = syllables[slot];
      const attempt = typed + symbol;
      if (target.startsWith(attempt)) {
        typed = attempt;
        clear(feedbackEl);
        renderSlots();
        if (typed === target) askForCharacter();
      } else {
        wrongOnce = true;
        clear(feedbackEl);
        feedbackEl.appendChild(HintPanel({ message: '這個符號不對，再聽一次語詞，注意第一個音。' }));
      }
    }

    function backspace() {
      if (!typed) return;
      typed = typed.slice(0, -1);
      renderSlots();
    }

    // 測試用掛勾：讓回歸測試能把這一題做完。刻意不放進 DOM，
    // 免得學生打開開發者工具就看到答案。
    container.__solution = { word: word.word, syllables, chars };

    const keyboard = ZhuyinKeyboard({ onKey: press, onBackspace: backspace });

    const onPhysicalKey = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'Backspace') { event.preventDefault(); backspace(); return; }
      const symbol = KEY_MAP[event.key.toLowerCase()];
      if (!symbol) return;
      event.preventDefault();
      keyboard.flash(symbol);
      press(symbol);
    };
    // 有實體鍵盤的載具可以直接打字；沒有 window 監聽能力的環境（測試夾具）
    // 就只用畫面鍵盤，不影響活動本身。
    const canListen = typeof window !== 'undefined' && typeof window.addEventListener === 'function';
    if (canListen) window.addEventListener('keydown', onPhysicalKey);
    container.__cleanup = () => { if (canListen) window.removeEventListener('keydown', onPhysicalKey); };

    const hintBtn = h('button', { class: 'btn', type: 'button' }, '提示');
    hintBtn.addEventListener('click', () => {
      usedHelp = true;
      hintLevel += 1;
      const target = syllables[slot] || '';
      const shown = target.slice(0, Math.min(hintLevel, target.length));
      clear(feedbackEl);
      feedbackEl.appendChild(HintPanel({ message: `這個字的注音是「${shown}⋯」` }));
    });

    const skipBtn = h('button', { class: 'btn', type: 'button' }, '跳過這一題');
    skipBtn.addEventListener('click', skipItem);

    container.appendChild(TaskBanner({ label: '聽語詞，把注音打出來', step: `第 ${index + 1} / ${words.length} 題` }));
    container.appendChild(h('div', { class: 'zt__prompt' }, [
      image,
      h('div', { class: 'zt__listen' }, [
        SpeakButton({ text: speakText, label: '聽語詞' }),
        h('p', { class: 'meta' }, '可以重複聽'),
      ]),
    ].filter(Boolean)));
    renderSlots();
    container.appendChild(slotsEl);
    container.appendChild(chooserEl);
    container.appendChild(feedbackEl);
    container.appendChild(keyboard.el);
    container.appendChild(h('div', { class: 'quiz-option-row zt__actions' }, [hintBtn, skipBtn]));
    container.appendChild(attribution());
  }

  function renderDone() {
    if (container.__cleanup) container.__cleanup();
    clear(container);
    container.appendChild(CompletionFeedback({
      correct: correctCount,
      total: words.length,
      onBack: () => onModuleDone(),
      backLabel: '回課程首頁',
    }));
    container.appendChild(attribution());
  }

  renderQuestion();
  return container;
}

/** 設計出處標示（CF 指定）。 */
function attribution() {
  return h('p', { class: 'zt__credit' }, '設計原始來源：雄老師「HTML5 FUN 注音高手」。本站為自行實作。');
}
