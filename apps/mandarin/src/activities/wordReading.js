// 念讀字詞測驗（CF 2026-10-04）：本課生字、語詞一個一個念出來。
//
// 評分沿用朗讀挑戰的 readingScore：**不比聲調、同音字算對**（構音、聲調不穩在這群學生
// 很常見，重點是念得出這個字）。每個字詞最多念兩次：
//   第一次就念對 → 自己念對；聽過範讀或第二次才對 → 提示後念對；兩次都沒對 → 念給他聽、記為看答案。
// 裝置沒有語音辨識（或老師想自己聽）時，改成教師判讀：老師聽完按「念對了／再練習」。
// 字詞本來就公開（生字、語詞），不需要教室密碼。
import { h, clear } from '../utils/dom.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { CompletionFeedback } from '../components/CompletionFeedback.js';
import { StepJump } from '../components/StepJump.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus } from '../utils/preview.js';
import { chunkRounds } from '../utils/chunk.js';
import { getScaffoldLevel } from '../utils/deviceSettings.js';
import { speak, cancelSpeaking } from '../utils/speech.js';
import { splitSyllables } from '../utils/zhuyin.js';
import { ensureCharReadings, scoreReading } from '../utils/readingScore.js';
import { recordOutcome } from '../utils/scoreSession.js';
import { celebrateCorrect } from '../utils/celebrate.js';

// 念對時的稱讚輪流換，避免每次都一樣變成背景音
const PRAISE_FIRST = ['念對了！好棒！', '太棒了，念得很清楚！', '答對了！你好厲害！', '很好！繼續加油！'];
const PRAISE_HELPED = ['念對了！多練一次就會了！', '有進步！念對了！', '做到了！再接再厲！'];

const HAN = /[㐀-鿿]/u;

export function recognitionSupported() {
  return typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/** 要念的字詞：生字（單字）與語詞，都要有注音且字數對得上才出題。 */
export function readingItems(lesson) {
  const chars = (lesson.characters || [])
    .filter((c) => (c.status === 'ready' || !c.status) && c.char && c.zhuyin)
    .map((c) => ({ text: c.char, expected: [{ char: c.char, zhuyin: c.zhuyin }], kind: 'char' }));
  const words = filterByStatus(lesson.words || [])
    .filter((w) => w.word && w.zhuyin)
    .map((w) => {
      const chs = [...w.word].filter((ch) => HAN.test(ch));
      const syl = splitSyllables(w.zhuyin);
      return syl.length === chs.length
        ? { text: w.word, expected: chs.map((ch, i) => ({ char: ch, zhuyin: syl[i] })), kind: 'word' }
        : null;
    })
    .filter(Boolean);
  return { chars, words };
}

export function canStartWordReading(lesson) {
  const { chars, words } = readingItems(lesson);
  return chars.length + words.length >= 3;
}

/** 一次辨識：回傳聽到的文字（或錯誤訊息）。 */
function listenOnce(onResult) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new Recognition();
  rec.lang = 'zh-TW';
  rec.interimResults = false;
  rec.maxAlternatives = 3;
  let done = false;
  rec.onresult = (event) => {
    done = true;
    const alts = [...(event.results?.[0] || [])].map((a) => a.transcript || '');
    onResult({ heard: alts });
  };
  rec.onerror = (event) => { if (!done) { done = true; onResult({ error: event.error === 'no-speech' ? '沒有聽到聲音，再按一次念念看。' : '聽不清楚，再按一次念念看。' }); } };
  rec.onend = () => { if (!done) { done = true; onResult({ error: '沒有聽到聲音，再按一次念念看。' }); } };
  try { rec.start(); } catch { onResult({ error: '這台裝置不能用麥克風，請檢查權限。' }); }
  return rec;
}

/** 多個辨識候選裡，任何一個念對就算對（辨識器常把單字聽成別的詞）。 */
export function judge(expected, alternatives) {
  return (alternatives || []).some((alt) => scoreReading(expected, alt).accuracy === 100);
}

export function buildWordReadingActivity(lesson, onBack) {
  const { chars, words } = readingItems(lesson);
  const steps = [];
  if (chars.length) steps.push('read-chars');
  if (words.length) steps.push('read-words');
  const pools = { 'read-chars': chars, 'read-words': words };
  const container = h('div', {});
  let stepIndex = 0;
  let roundIndex = 0;
  let jump = null;
  let teacherMode = !recognitionSupported();
  const log = [];
  // 同音字判斷要用字→讀音索引；載不到時評分退回「同字才算對」，不影響操作
  try { Promise.resolve(ensureCharReadings()).catch(() => {}); } catch { /* 測試環境沒有 fetch */ }

  function renderStep() {
    clear(container);
    jump?.update(stepIndex);
    if (!steps.length) { container.appendChild(missingContentNotice('念讀字詞：這一課還沒有可以念的字詞')); return; }
    const step = steps[stepIndex];
    const rounds = chunkRounds(pools[step]);
    const round = rounds[roundIndex] || [];
    const isLastRound = roundIndex >= rounds.length - 1;
    const isLastStep = stepIndex >= steps.length - 1;
    container.appendChild(TaskBanner({
      label: step === 'read-chars' ? '念念看：把生字念出來' : '念念看：把語詞念出來',
      step: rounds.length > 1 ? `第 ${roundIndex + 1}／${rounds.length} 組` : '',
    }));
    const modeText = teacherMode ? '老師判讀：學生念完，老師按「念對了」或「再練習」。' : '按麥克風，念完會自動判斷（不比聲調，念清楚就好）。';
    const modeRow = h('p', { class: 'meta word-reading__mode' }, [
      SpeakButton({ text: modeText, label: '聽', variant: 'speak-button--option' }),
      ' ',
      modeText,
      ' ',
      recognitionSupported() ? Object.assign(h('button', { class: 'btn btn--ghost', type: 'button' }, teacherMode ? '改用自動判斷' : '改由老師判讀'),
        { onclick: () => { teacherMode = !teacherMode; renderStep(); } }) : null,
    ]);
    container.appendChild(modeRow);
    let i = 0;
    let streak = 0;
    const stage = h('div', { class: 'word-reading' });
    container.appendChild(stage);

    function next() {
      i += 1;
      if (i < round.length) { showItem(); return; }
      clear(stage);
      const roundLog = log.slice(-round.length);
      const ok = roundLog.filter((x) => ['first', 'helped', 'after-model'].includes(x.result)).length;
      const cheer = ok === round.length ? `這一組全部念對了！你真的很棒！` : ok > 0 ? `念對了 ${ok} 個，很努力！再念一組會更熟。` : '謝謝你認真念，多聽多念就會進步！';
      stage.appendChild(h('div', { class: 'quiz-option-row word-reading__cheer' }, [
        h('p', { class: 'word-reading__praise' }, cheer),
        SpeakButton({ text: cheer, label: '聽', variant: 'speak-button--option' }),
      ]));
      speak(cheer);
      stage.appendChild(h('ul', { class: 'word-reading__summary' }, roundLog.map((x) => h('li', {}, [
        h('span', { class: 'word-reading__summary-word' }, x.text),
        h('span', { class: `word-reading__badge word-reading__badge--${x.result}` },
          ({ first: '自己念對', helped: '自己改正', 'after-model': '跟讀後自己念對', modeled: '跟讀練習', skipped: '先跳過' })[x.result] || '再多練習'),
      ]))));
      stage.appendChild(CompletionFeedback({
        correct: ok,
        total: round.length,
        onBack,
        backLabel: isLastRound && isLastStep ? '回課程首頁' : '本課先完成',
        onContinue: isLastRound && isLastStep ? null : () => {
          if (isLastRound) { stepIndex += 1; roundIndex = 0; } else { roundIndex += 1; }
          renderStep();
        },
        continueLabel: isLastRound ? '繼續：念語詞' : '再念一組',
      }));
    }

    function showItem() {
      clear(stage);
      cancelSpeaking();
      const item = round[i];
      let tries = 0;
      let heardModel = false;
      const status = h('p', { class: 'word-reading__status', role: 'status', 'aria-live': 'polite' });
      stage.appendChild(h('p', { class: 'meta' }, `第 ${i + 1}／${round.length} 個`));
      const target = h('p', { class: `word-reading__target word-reading__target--${item.kind}`, lang: 'zh-TW' }, item.text);
      stage.appendChild(target);
      const controls = h('div', { class: 'quiz-option-row word-reading__controls' });

      const btn = (text, onClick, cls = 'btn') => {
        const b = h('button', { class: cls, type: 'button' }, text);
        b.addEventListener('click', onClick);
        return b;
      };
      const setControls = (...nodes) => {
        while (controls.firstChild) controls.removeChild(controls.firstChild);
        nodes.filter(Boolean).forEach((n) => controls.appendChild(n));
      };
      // 念一次：自動判斷用麥克風；老師判讀由老師按。辨識失敗（沒聽到、權限）不算念錯。
      const attempt = (label, onJudged, okText = '念對了', noText = '再練習') => {
        if (teacherMode) {
          return [btn(okText, () => onJudged(true), 'btn btn--primary'), btn(noText, () => onJudged(false))];
        }
        const mic = btn(label, () => {
          cancelSpeaking();
          mic.disabled = true;
          status.textContent = '正在聽……';
          listenOnce(({ heard, error }) => {
            mic.disabled = false;
            if (error) { status.textContent = error; return; }
            onJudged(judge(item.expected, heard));
          });
        }, 'btn btn--primary word-reading__mic');
        return [mic];
      };
      const listenBtn = (text = '先聽一次') => btn(text, () => { heardModel = true; speak(item.text); }, 'btn btn--secondary');
      const skipBtn = () => btn('先跳過／請老師幫忙', () => finish('skipped'), 'btn btn--ghost');

      // 結果分開記（第二版審查 A6）：只有第一次就自己念對才算獨立；
      // 跟讀念對不算答對，跟讀後自己再念對＝提示後念對；略過不算念錯。
      function finish(result) {
        log.push({ text: item.text, result });
        if (result === 'first' || result === 'helped' || result === 'after-model') {
          recordOutcome({ firstTry: result === 'first', revealed: false, skill: 'reading-aloud:word' });
          streak += 1;
          const pool = result === 'first' ? PRAISE_FIRST : PRAISE_HELPED;
          const praise = pool[(log.length - 1) % pool.length];
          const more = streak >= 3 ? `已經連續念對 ${streak} 個了！` : '';
          status.textContent = `${praise}${more}`;
          status.classList.add('word-reading__status--right');
          try { celebrateCorrect(target, undefined, { firstTry: result === 'first' }); } catch { /* 測試環境 */ }
          speak(praise);
        } else {
          // modeled（跟讀過、自己還沒念出來）或 skipped：記為看答案，不扣星以外的東西
          if (result === 'modeled') recordOutcome({ firstTry: false, revealed: true, skill: 'reading-aloud:word' });
          streak = 0;
          status.textContent = result === 'skipped' ? '沒關係，先練下一個。' : '你跟著念了，很好！下次再自己試試看。';
        }
        let moved = false;
        const goOn = () => { if (!moved) { moved = true; next(); } };
        setControls(btn('下一個', goOn, 'btn btn--primary'));
        if (result !== 'skipped') setTimeout(goOn, 2500);
      }

      // 第三段：跟讀之後，不看示範、自己再念一次
      function selfRetry() {
        status.textContent = '跟讀練習完成！現在不聽範讀，自己再念一次。';
        speak('現在自己再念一次');
        setControls(...attempt('自己念一次', (ok) => finish(ok ? 'after-model' : 'modeled'), '自己念對了', '還沒念出來'), skipBtn());
      }
      // 第二段：聽一次示範 → 跟著念
      function modelAndEcho() {
        status.textContent = '聽一次，再跟著念。';
        heardModel = true;
        speak(item.text);
        setControls(listenBtn('再聽一次'), ...attempt('跟著念', (ok) => {
          if (ok) selfRetry();
          else { status.textContent = '沒關係，再聽一次，慢慢跟著念。'; }
        }, '跟著念了', '還要再聽'), skipBtn());
      }

      function settle(correct) {
        tries += 1;
        if (correct) finish(tries === 1 && !heardModel ? 'first' : 'helped');
        else if (tries < 2) {
          // 第一段：留一次自己改正的機會，給可以做的提示，並把「先聽一次」放到明顯的位置
          status.textContent = '再念一次：看著字，一個字一個字念。想不起來可以按「先聽一次」。';
          setControls(listenBtn(), ...attempt('再念一次', settle));
        } else modelAndEcho();
      }

      setControls(getScaffoldLevel().reciteModel ? listenBtn() : null, ...attempt('按這裡開始念', settle));
      stage.appendChild(controls);
      stage.appendChild(status);
    }

    if (round.length) showItem();
  }

  jump = StepJump({ steps, moduleKey: 'word_reading', onJump: (k) => { stepIndex = k; roundIndex = 0; renderStep(); } });
  renderStep();
  return h('div', {}, [jump.el, container]);
}
