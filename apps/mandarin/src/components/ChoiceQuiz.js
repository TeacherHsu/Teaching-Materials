import { h, clear } from '../utils/dom.js';
import { ProgressIndicator } from './ProgressIndicator.js';
import { HintPanel } from './HintPanel.js';
import { CompletionFeedback } from './CompletionFeedback.js';
import { SpeakButton } from './SpeakButton.js';
import { ReadAllButton } from './ReadAllButton.js';
import { recordOutcome } from '../utils/scoreSession.js';
import { noteMistake, gradeMistake } from '../utils/mistakes.js';
import { celebrateCorrect } from '../utils/celebrate.js';
import { shuffle } from '../utils/shuffle.js';
import { getScaffoldLevel } from '../utils/deviceSettings.js';
import { speak, cancelSpeaking } from '../utils/speech.js';

const CHECK_ICON = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>`;
const CROSS_ICON = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>`;

const DEFAULT_HINT = '再看看題目，仔細比對一下再選。';

/**
 * 選擇題引擎：一組 3–5 題、逐題作答。
 * 答錯處理（不揭曉答案就直接鎖題）：
 *   第 1 次答錯 → 該選項標「再試一次」＋顯示 scaffold 提示，選項停用但不揭曉正解，可再選其他選項。
 *   第 2 次答錯 → 才揭曉正解，鎖題進入下一題。
 * 鍵盤可操作（原生 button，Tab/Enter 即可）。
 * @param {{
 *   items: Array,
 *   onComplete?: (correct:number, total:number)=>void,
 *   onItemResolved?: (info:{item:object, firstTry:boolean, revealed:boolean})=>void,
 *     每一題判定完（答對、或被揭曉答案）時呼叫一次，同一題只會呼叫一次。
 *     單課小考用它統計「每一站第一次答對幾題」——比在外面監看 DOM 可靠。
 *   onBack?: () => void,
 *   backLabel?: string,
 * }} opts
 */
export function ChoiceQuiz({
  items,
  onComplete,
  onItemResolved,
  onBack,
  backLabel = '回課程首頁',
  onContinue,
  continueLabel = '加練下一組',
  wrongLimit,
  autoRead,
  optionCount,
}) {
  // 預設跟著這台載具的鷹架設定；呼叫端可以覆寫（單課小考固定 wrongLimit 1）。
  const scaffold = getScaffoldLevel();
  const limit = Number.isFinite(wrongLimit) && wrongLimit > 0 ? wrongLimit : scaffold.wrongLimit;
  const readAloud = autoRead === undefined ? scaffold.autoRead : autoRead;
  // 選項數跟著鷹架層（支持 2／標準 3／挑戰 4）。原本只有少數活動自己讀設定，
  // 共用元件不裁，教師在設定頁選「支持」卻看到四個選項。資料選項比設定多時，
  // 留正解、隨機留其他；比設定少就照資料（不會無中生有）。
  // item.fixedOptions 的題目（例如「是／不是」）不裁。
  const maxOptions = Number.isFinite(optionCount) && optionCount >= 2 ? optionCount : scaffold.optionCount;
  const root = h('div', { class: 'quiz-panel' });
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
          onContinue,
          continueLabel,
        }),
      );
      if (onComplete) onComplete(correctCount, items.length);
      return;
    }
    const item = items[index];
    // 題庫資料保留內容順序；學生畫面每次重繪都重新亂數排列選項。
    // ReadAllButton 也使用這份畫面順序，朗讀順序與視覺順序一致。
    const options = shuffle(trimOptions(item, maxOptions));
    const stemText = item.stemText || item.stem;
    const stemContent = item.stemContent || stemText;
    let answered = false; // 題目鎖定（答對，或第 2 次答錯揭曉正解）
    let attempts = 0;
    // 提示是**分層遞進**的：每答錯一次就往下一層。
    // 每一層對應一個策略動作（想一想 → 找位置 → 看證據），
    // 而不是「同一句話講得更白」——後者只是暗示，前者才是教方法。
    let hintLevel = 0;
    let hintUsed = false;

    root.appendChild(ProgressIndicator({ current: index + 1, total: items.length }));
    if (item.extra) root.appendChild(item.extra);
    root.appendChild(
      h('div', { class: 'quiz-title-row' }, [
        h('div', { class: 'quiz-option-row audio-control-group audio-control-group--prompt' }, [
          h('p', { class: 'quiz-stem' }, stemContent),
          SpeakButton({ text: stemText, label: '聽題目', showLabel: true, ariaLabel: `聽題目：${stemText}`, variant: 'speak-button--option speak-button--audio-label' }),
        ]),
        ReadAllButton(() => ({ stem: item.readAllStem || stemText, options })),
      ]),
    );

    // 自動念題目（支持層預設開）：閱讀困難的學生要先聽到題目才讀得下去，
    // 不該每一題都得自己按喇叭。換題時先停掉上一題，免得兩句疊在一起念。
    // 第一題可能因為瀏覽器的自動播放限制而不會出聲——學生按過「開始」之後
    // 就有使用者手勢，後續都正常，所以不另外處理，喇叭鈕仍然在。
    if (readAloud) {
      cancelSpeaking();
      speak(stemText);
    }

    const optionsWrap = h('div', { class: 'quiz-options', role: 'group', 'aria-label': '選項' });
    const feedbackSlot = h('div', {});
    const optionButtons = [];

    options.forEach((opt) => {
      const btn = h(
        'button',
        {
          class: 'quiz-option',
          type: 'button',
          'aria-pressed': 'false',
        },
        opt,
      );
      optionButtons.push(btn);
      btn.addEventListener('click', () => {
        if (answered || btn.disabled) return;
        const isCorrect = opt === item.answer;

        if (isCorrect) {
          answered = true;
          attempts += 1;
          btn.classList.add('quiz-option--correct');
          btn.setAttribute('aria-pressed', 'true');
          btn.innerHTML = `${CHECK_ICON}<span>${opt}</span>`;
          correctCount += 1;
          // 用過提示才答對，不算獨立答對：照樣收進錯題盒，之後再練一次。
          const firstTry = attempts === 1 && !hintUsed;
          recordOutcome({ firstTry, revealed: false });
          // 第一次沒答對就收進錯題盒（和「正確率＝第一次答對率」同一個判準）。
          // 在複習模式下則是把這一題往上推一格（連對夠多次就學會、移除）。
          if (item._mistakeId) gradeMistake(item._mistakeId, firstTry);
          else if (!firstTry) noteMistake(item);
          if (onItemResolved) onItemResolved({ item, firstTry, revealed: false });
          celebrateCorrect(btn, 'var(--module-color)', { firstTry });
          optionButtons.forEach((c) => {
            if (c !== btn) c.disabled = true;
          });
          clear(feedbackSlot);
          refreshHintButton();
          feedbackSlot.appendChild(
            h('div', { class: 'quiz-option-row' }, [
              h('p', {
                role: 'status',
                'aria-live': 'polite',
                class: 'meta',
                html: `<span style="display:inline-flex;align-items:center;gap:4px;color:var(--color-success)">${CHECK_ICON}答對了！</span>`,
              }),
              SpeakButton({ text: '答對了！', label: '聽', variant: 'speak-button--option' }),
            ]),
          );
          appendNextButton();
          return;
        }

        // 答錯
        attempts += 1;
        btn.classList.add('quiz-option--incorrect');
        btn.setAttribute('aria-pressed', 'true');
        btn.innerHTML = `${CROSS_ICON}<span>${opt}</span>`;

        if (attempts < limit) {
          // 還沒到揭曉次數：不揭曉正解，該選項停用，其餘選項仍可選。
          btn.disabled = true;
          clear(feedbackSlot);
          const layers = Array.isArray(item.hints) ? item.hints : [];
          // 支持層第一次錯就給「最強」的那層（中間層的動作一併做完），讓學生
          // 帶著明確線索自己再選一次；其他層一次往下一層。
          const target = scaffold.key === 'support' ? layers.length - 1 : hintLevel;
          let layer = layers[Math.min(hintLevel, layers.length - 1)];
          // 提示可以「做事」：第 2 層展開段落、第 3 層畫螢光筆。
          // 對閱讀困難的學生，「回到課文找線索」這句話沒有作用——
          // 他不知道回到哪裡、找什麼。要把動作做給他看。
          do {
            layer = layers[Math.min(hintLevel, layers.length - 1)];
            applyLayer(layer);
            hintLevel += 1;
          } while (hintLevel <= target && hintLevel < layers.length);
          refreshHintButton();
          revealExtra();
          const hintText = (layer && (layer.text || layer)) || item.hint || DEFAULT_HINT;
          feedbackSlot.appendChild(
            h('div', { class: 'quiz-option-row' }, [
              h('p', { role: 'status', 'aria-live': 'polite', class: 'meta' }, [
                h(
                  'span',
                  { style: 'display:inline-flex;align-items:center;gap:4px;color:var(--color-danger)', html: CROSS_ICON },
                  '再試一次',
                ),
              ]),
              SpeakButton({ text: '再試一次', label: '聽', variant: 'speak-button--option' }),
            ]),
          );
          // 錯因回饋：資料若寫了「這個選項為什麼不對」，先指出錯在哪，再給下一步提示。
          const why = item.why && item.why[opt];
          if (why) feedbackSlot.appendChild(h('p', { class: 'meta quiz-why' }, why));
          feedbackSlot.appendChild(HintPanel({ message: hintText }));
        } else {
          // 達到揭曉次數：揭曉正解，鎖題
          answered = true;
          refreshHintButton();
          // 揭曉答案時，把還沒用到的提示動作全部執行——證據要留在畫面上，
          // 學生才看得到「答案為什麼是這個」，而不是只看到一個紅勾綠勾。
          if (Array.isArray(item.hints)) {
            item.hints.slice(hintLevel).forEach((l) => { if (l && typeof l === 'object' && typeof l.on === 'function') l.on(); });
            revealExtra();
          }
          recordOutcome({ firstTry: false, revealed: true });
          if (item._mistakeId) gradeMistake(item._mistakeId, false);
          else noteMistake(item);
          if (onItemResolved) onItemResolved({ item, firstTry: false, revealed: true });
          btn.disabled = true;
          optionButtons.forEach((c) => {
            c.disabled = true;
            if (c.textContent.trim() === item.answer) {
              c.classList.add('quiz-option--correct');
              c.innerHTML = `${CHECK_ICON}<span>${item.answer}</span>`;
            }
          });
          clear(feedbackSlot);
          feedbackSlot.appendChild(
            h('div', { class: 'quiz-option-row' }, [
              h('p', { role: 'status', 'aria-live': 'polite', class: 'meta' }, [
                h(
                  'span',
                  { style: 'display:inline-flex;align-items:center;gap:4px;color:var(--color-danger)', html: CROSS_ICON },
                  `正確答案是：${item.answer}`,
                ),
              ]),
              SpeakButton({ text: `正確答案是：${item.answer}`, label: '聽', variant: 'speak-button--option' }),
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
        }
      });
      const row = h('div', { class: 'quiz-option-row audio-control-group audio-control-group--option' }, [
        btn,
        SpeakButton({ text: opt, label: '聽選項', showLabel: true, ariaLabel: `聽選項：${opt}`, variant: 'speak-button--option speak-button--audio-label' }),
      ]);
      optionsWrap.appendChild(row);
    });

    function appendNextButton() {
      const nextBtn = h(
        'button',
        { class: 'btn', type: 'button', style: 'margin-top:16px' },
        index + 1 < items.length ? '下一題' : '看結果',
      );
      nextBtn.addEventListener('click', () => {
        index += 1;
        render();
      });
      feedbackSlot.appendChild(nextBtn);
    }

    // 「看提示」：學生不必先答錯，就能主動要下一層提示。
    // 原本提示只綁在答錯上，支持層答錯一次就揭曉（零錯誤學習），結果最需要鷹架
    // 的學生一層提示都拿不到；標準／挑戰層答錯兩次揭曉，第 2 層也永遠跳過。
    // 零錯誤學習本來就該「先給提示再作答」，所以提示改成也能主動取用。
    // 只有分層提示（閱讀理解）才出現；一般題目沒有這顆按鈕。
    // 每一層都有（2026-10-03 審查建議）：挑戰層練的是獨立，但「需要時自己叫得
    // 出提示」本身就是獨立學習者的能力；用了提示照樣不算獨立答對，紀錄分得開。
    // 一般字串提示也一樣可以主動取用，不必等答錯。
    const layered = Array.isArray(item.hints) && item.hints.some((l) => l && (typeof l === 'object' || typeof l === 'string'));
    const hintButton = layered
      ? h('button', { class: 'btn btn--ghost quiz-hint-button', type: 'button' })
      : null;
    /**
     * 套用一層提示的「動作」。除了自訂的 on()，還有兩種通用動作：
     *   eliminate: n  刪掉 n 個錯誤選項（縮小範圍，最少到最多提示法的第 2 層）
     *   speak: '…'    念出一段話（示範，例如念出這個字所在的語詞）
     * 刪選項只挑還沒被刪、也還沒被選過的錯誤選項，正解永遠留著。
     */
    function applyLayer(layer) {
      if (!layer || typeof layer !== 'object') return;
      if (typeof layer.on === 'function') layer.on();
      if (layer.eliminate) {
        const wrong = optionButtons.filter((b) => !b.disabled && b.textContent.trim() !== item.answer);
        // 至少留一個錯誤選項：刪到只剩正解，提示就等於直接給答案。
        shuffle(wrong).slice(0, Math.min(layer.eliminate, wrong.length - 1)).forEach((b) => {
          b.disabled = true;
          b.classList.add('quiz-option--eliminated');
          b.setAttribute('aria-label', `${b.textContent.trim()}（提示：不是這個）`);
        });
      }
      if (layer.speak) speak(layer.speak);
    }

    function revealExtra() {
      if (!item.extra || item.extra.hidden || typeof item.extra.scrollIntoView !== 'function') return;
      const reduce = typeof window !== 'undefined' && window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      item.extra.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    }
    function refreshHintButton() {
      if (!hintButton) return;
      const total = item.hints.length;
      const done = answered || hintLevel >= total;
      hintButton.hidden = done;
      hintButton.textContent = `看提示（${Math.min(hintLevel + 1, total)}／${total}）`;
    }
    if (hintButton) {
      hintButton.addEventListener('click', () => {
        if (answered || hintLevel >= item.hints.length) return;
        const layer = item.hints[hintLevel];
        hintLevel += 1;
        hintUsed = true;
        applyLayer(layer);
        clear(feedbackSlot);
        feedbackSlot.appendChild(HintPanel({ message: (typeof layer === 'string' ? layer : layer && layer.text) || DEFAULT_HINT }));
        refreshHintButton();
        // 證據面板在題目上方，提示在選項下方；面板一打開，學生的視線還停在下面，
        // 常常沒注意到上面多了課文。打開時把面板捲進畫面。
        revealExtra();
      });
      refreshHintButton();
    }

    root.appendChild(optionsWrap);
    if (hintButton) root.appendChild(hintButton);
    root.appendChild(feedbackSlot);
  }

  render();
  return root;
}

/**
 * 依鷹架層裁選項：正解一定留著，其餘隨機留到 max 個。
 * 資料選項不多於 max、或題目標了 fixedOptions，就原樣回傳。
 */
export function trimOptions(item, max) {
  const all = Array.isArray(item?.options) ? item.options : [];
  if (item?.fixedOptions || !Number.isFinite(max) || all.length <= max || !all.includes(item.answer)) return all;
  // item.keepOrder：資料順序就是優先順序（形似字：同組的字先，補充的形似字後），
  // 裁切時照順序留，不隨機——免得把真正的形似字裁掉、留下補充的字
  const pool = all.filter((o) => o !== item.answer);
  const others = (item.keepOrder ? pool : shuffle(pool)).slice(0, max - 1);
  return [item.answer, ...others];
}
