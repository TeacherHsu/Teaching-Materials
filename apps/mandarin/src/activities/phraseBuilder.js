// 照樣造短語（2026-10-05）：看圖理解 → 示範拆詞塊 → 點詞塊組短語 → 語意判定 → 小確認題。
//
// 教材原則：
// - 題目來自課次 JSON 的 sentence_patterns（官方「各課短語句型練習」）；詞塊拆分、圖片描述、
//   語意判定與回饋是本站編寫，放在 lesson.phrase_builders，status=draft 時只在預覽模式出現，
//   教師確認後改 approved。元件不寫任何教材內容，換課只改資料。
// - 判定完全資料化：accepted（說得通）、semantic_rejects（順序對但意思怪，附回饋）、
//   每一輪 rounds[i].answer（最符合圖片）。不呼叫任何外部 AI。
// - 三級提示：① 圖片線索 ② 句型線索（格子標出「怎麼樣的／什麼東西」）③ 刪掉多餘詞塊。
// - 答錯不重置：保留學生排好的詞塊，可以點格子拿掉、換一個。
import { h, clear } from '../utils/dom.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { ImageFrame } from '../components/ImageFrame.js';
import { CompletionFeedback } from '../components/CompletionFeedback.js';
import { HintPanel } from '../components/HintPanel.js';
import { StepJump } from '../components/StepJump.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus } from '../utils/preview.js';
import { recordOutcome } from '../utils/scoreSession.js';
import { speak } from '../utils/speech.js';

const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

export function readyPhraseBuilders(lesson) {
  return filterByStatus(lesson.phrase_builders || []).filter((p) => p.slots?.length && p.rounds?.length && p.bank?.length);
}

export function canStartPhraseBuilder(lesson) {
  return readyPhraseBuilders(lesson).length > 0;
}

/**
 * 判定一組詞塊。回傳 kind：
 *   'fit'        結構對、意思通、而且最符合這張圖
 *   'ok-other'   結構對、意思通，但不是這張圖的意思
 *   'semantic'   結構對，意思不自然（附回饋）
 *   'structure'  位置放錯
 *   'incomplete' 還沒放滿
 */
export function judgePhrase(spec, round, chunks) {
  // 固定字的格子（slots[i].fixed，例如「越」「的」「又」）自動補上，學生只放可換的格子
  chunks = spec.slots.map((s, i) => (s.fixed ? s.fixed : chunks[i]));
  if (chunks.length < spec.slots.length || chunks.some((c) => !c)) return { kind: 'incomplete' };
  const roleOf = (text) => spec.bank.find((b) => b.text === text)?.role;
  if (!chunks.every((c, i) => spec.slots[i].fixed || roleOf(c) === spec.slots[i].role)) return { kind: 'structure' };
  if (same(chunks, round.answer)) return { kind: 'fit' };
  if ((spec.accepted || []).some((a) => same(a, chunks))) return { kind: 'ok-other' };
  const reject = (spec.semantic_rejects || []).find((r) => same(r.chunks, chunks));
  return { kind: 'semantic', feedback: reject?.feedback || '順序對了。想一想：平常會這樣說嗎？再看看圖片。' };
}

function chunkRow(chunks, slots, { showLabels = true } = {}) {
  return h('div', { class: 'phrase-chunks' }, chunks.map((c, i) => h('span', { class: `phrase-chunk phrase-chunk--${slots[i]?.fixed ? 'fixed' : (slots[i]?.role || '')}` }, [
    showLabels && slots[i] && !slots[i].fixed ? h('span', { class: 'phrase-chunk__label' }, slots[i].label) : null,
    h('span', { class: 'phrase-chunk__text' }, c),
  ].filter(Boolean))));
}

export function buildPhraseBuilderActivity(lesson, onBack) {
  const specs = readyPhraseBuilders(lesson);
  const container = h('div', {});
  if (!specs.length) {
    container.appendChild(missingContentNotice('照樣造短語：這一課的短語還在等老師確認'));
    return container;
  }
  // 每個短語句型＝一個題組：看圖 → 示範 → 每張圖組一次＋小確認
  const steps = specs.map((_, i) => `phrase-${i}`);
  let specIndex = 0;
  let correct = 0;
  let total = 0;
  let jump = null;

  function renderSpec() {
    clear(container);
    jump?.update(specIndex);
    const spec = specs[specIndex];
    let roundIndex = 0;
    let stage = 'look';

    function renderStage() {
      clear(container);
      const round = spec.rounds[roundIndex];
      const roundLabel = spec.rounds.length > 1 ? `第 ${roundIndex + 1}／${spec.rounds.length} 張圖` : '';

      if (stage === 'look') {
        // Stage 1｜看圖理解
        container.appendChild(TaskBanner({ label: '照樣造短語：先看圖', step: roundLabel }));
        container.appendChild(h('div', { class: 'phrase-image' }, [ImageFrame({ src: round.image?.src || null, alt: round.image?.alt || '' })]));
        container.appendChild(h('div', { class: 'quiz-option-row' }, [
          h('p', { class: 'phrase-caption' }, round.image?.alt || ''),
          round.image?.alt ? SpeakButton({ text: round.image.alt, label: '聽', variant: 'speak-button--option' }) : null,
        ].filter(Boolean)));
        const go = h('button', { class: 'btn btn--primary', type: 'button' }, roundIndex === 0 ? '看示範' : '開始組短語');
        go.addEventListener('click', () => { stage = roundIndex === 0 ? 'demo' : 'build'; renderStage(); });
        container.appendChild(h('div', { class: 'quiz-option-row' }, [go]));
        return;
      }

      if (stage === 'demo') {
        // Stage 2｜示範＋拆解：課本的短語拆成詞塊，標出哪裡可以換
        const head = spec.example.chunks.join('');
        container.appendChild(TaskBanner({ label: '照樣造短語：看課本的例子' }));
        container.appendChild(h('div', { class: 'quiz-option-row' }, [
          h('p', { class: 'phrase-demo__head' }, `課本：${head}`),
          SpeakButton({ text: head, label: '聽', variant: 'speak-button--option' }),
        ]));
        container.appendChild(chunkRow(spec.example.chunks, spec.slots));
        container.appendChild(h('div', { class: 'quiz-option-row' }, [
          h('p', { class: 'phrase-demo__explain' }, spec.explain),
          SpeakButton({ text: spec.explain, label: '聽', variant: 'speak-button--option' }),
        ]));
        const go = h('button', { class: 'btn btn--primary', type: 'button' }, '換我組組看');
        go.addEventListener('click', () => { stage = 'build'; renderStage(); });
        container.appendChild(h('div', { class: 'quiz-option-row' }, [go]));
        return;
      }

      if (stage === 'build') {
        // Stage 3｜點詞塊組短語（點一下放進下一個空格；點格子拿回來）
        container.appendChild(TaskBanner({ label: '照樣造短語：照著例子，組出和圖片一樣意思的短語', step: roundLabel }));
        const imageBox = h('div', { class: 'phrase-image phrase-image--small' }, [ImageFrame({ src: round.image?.src || null, alt: round.image?.alt || '' })]);
        container.appendChild(imageBox);
        const picked = spec.slots.map((s) => s.fixed || null);
        const firstEmpty = () => picked.findIndex((p, i) => !p && !spec.slots[i].fixed);
        let attempts = 0;
        let hintLevel = 0;
        let hintUsed = false;
        let showLabels = false;
        let hidden = new Set();
        const answerRow = h('div', { class: 'phrase-answer', 'aria-label': '你的短語' });
        const bankRow = h('div', { class: 'phrase-bank', role: 'group', 'aria-label': '詞塊' });
        const feedback = h('div', { class: 'phrase-feedback', role: 'status', 'aria-live': 'polite' });

        function drawAnswer() {
          clear(answerRow);
          spec.slots.forEach((slot, i) => {
            const filled = picked[i];
            if (slot.fixed) {
              // 固定字：不能動，用虛線框和一般字色表示「這裡不用換」
              answerRow.appendChild(h('span', { class: 'phrase-slot phrase-slot--fixed', 'aria-label': `固定的字：${slot.fixed}` }, [
                h('span', { class: 'phrase-slot__text' }, slot.fixed),
              ]));
              return;
            }
            const b = h('button', {
              class: `phrase-slot phrase-slot--${slot.role}${filled ? ' phrase-slot--filled' : ''}`,
              type: 'button',
              'aria-label': filled ? `第 ${i + 1} 格：${filled}，點一下拿掉` : `第 ${i + 1} 格，空的${showLabels ? `，要放「${slot.label}」` : ''}`,
            }, [
              showLabels ? h('span', { class: 'phrase-chunk__label' }, slot.label) : null,
              h('span', { class: 'phrase-slot__text' }, filled || '＿＿'),
            ].filter(Boolean));
            b.addEventListener('click', () => { if (picked[i]) { picked[i] = null; redraw(); } });
            answerRow.appendChild(b);
          });
        }
        function drawBank() {
          clear(bankRow);
          spec.bank.filter((c) => !hidden.has(c.text)).forEach((c) => {
            const used = picked.includes(c.text);
            const b = h('button', { class: `phrase-tile${used ? ' phrase-tile--used' : ''}`, type: 'button', disabled: used ? 'disabled' : null }, c.text);
            b.addEventListener('click', () => {
              const at = firstEmpty();
              if (at < 0 || used) return;
              picked[at] = c.text;
              redraw();
            });
            bankRow.appendChild(b);
          });
        }
        function redraw() { drawAnswer(); drawBank(); clear(feedback); }

        const check = h('button', { class: 'btn btn--primary', type: 'button' }, '檢查');
        const reset = h('button', { class: 'btn', type: 'button' }, '重新開始');
        const hintBtn = h('button', { class: 'btn btn--ghost', type: 'button' }, '看提示（1／3）');
        reset.addEventListener('click', () => { spec.slots.forEach((s, i) => { picked[i] = s.fixed || null; }); redraw(); });

        const say = (text, cls) => {
          clear(feedback);
          feedback.appendChild(h('div', { class: `quiz-option-row phrase-feedback__row ${cls}` }, [
            h('p', {}, text),
            SpeakButton({ text, label: '聽', variant: 'speak-button--option' }),
          ]));
        };

        check.addEventListener('click', () => {
          const r = judgePhrase(spec, round, picked);
          if (r.kind === 'incomplete') { say('還有空格，先把格子放滿。', 'phrase-feedback--info'); return; }
          attempts += 1;
          if (r.kind === 'fit') {
            const firstTry = attempts === 1 && !hintUsed;
            total += 1; if (firstTry) correct += 1;
            recordOutcome({ firstTry, revealed: false, skill: 'phrase:pattern' });
            const phrase = picked.join('');
            say(`✓ 很好！「${phrase}」這樣說很合理。`, 'phrase-feedback--right');
            speak(`很好！${phrase}`);
            [check, reset, hintBtn].forEach((b) => { b.hidden = true; });
            const go = h('button', { class: 'btn btn--primary', type: 'button' }, '下一步');
            go.addEventListener('click', () => { stage = 'check'; renderStage(); });
            feedback.appendChild(h('div', { class: 'quiz-option-row' }, [go]));
            return;
          }
          if (r.kind === 'ok-other') say('這樣說也通順，但和圖片的意思不一樣。再看一次圖片。', 'phrase-feedback--try');
          else if (r.kind === 'semantic') say(r.feedback, 'phrase-feedback--try');
          else {
            showLabels = true; drawAnswer();
            say(`看看例子：${spec.explain}`, 'phrase-feedback--try');
          }
        });

        hintBtn.addEventListener('click', () => {
          hintUsed = true;
          hintLevel += 1;
          let text = '';
          if (hintLevel === 1) {
            imageBox.classList.add('phrase-image--focus');
            text = round.image_hint || '再看一次圖片，圖片裡最重要的是什麼？';
          } else if (hintLevel === 2) {
            showLabels = true; drawAnswer();
            text = `看格子上的字：${spec.slots.map((s) => `「${s.fixed || s.label}」`).join('＋')}。`;
          } else {
            // 只留這張圖的答案，加每一格一個別的詞塊（不直接給答案）
            const keep = new Set(round.answer);
            spec.slots.filter((s) => !s.fixed).forEach((slot) => {
              const extra = spec.bank.find((c) => c.role === slot.role && !keep.has(c.text));
              if (extra) keep.add(extra.text);
            });
            hidden = new Set(spec.bank.map((c) => c.text).filter((t) => !keep.has(t)));
            picked.forEach((t, i) => { if (t && !spec.slots[i].fixed && hidden.has(t)) picked[i] = null; });
            drawAnswer(); drawBank();
            text = '拿掉了一些用不到的詞塊，在剩下的裡面選。';
          }
          clear(feedback);
          feedback.appendChild(HintPanel({ message: text }));
          hintBtn.textContent = `看提示（${Math.min(hintLevel + 1, 3)}／3）`;
          hintBtn.hidden = hintLevel >= 3;
        });

        redraw();
        container.appendChild(answerRow);
        container.appendChild(bankRow);
        container.appendChild(h('div', { class: 'quiz-option-row phrase-actions' }, [check, reset, hintBtn]));
        container.appendChild(feedback);
        return;
      }

      if (stage === 'check') {
        // Stage 4｜小確認：排得對不代表意思合理
        const c = round.check;
        const finishRound = () => {
          if (roundIndex + 1 < spec.rounds.length) { roundIndex += 1; stage = 'look'; renderStage(); return; }
          if (specIndex + 1 < specs.length) { specIndex += 1; renderSpec(); return; }
          clear(container);
          container.appendChild(CompletionFeedback({ correct, total, onBack, backLabel: '回課程首頁' }));
        };
        if (!c) { finishRound(); return; }
        container.appendChild(TaskBanner({ label: '想一想：意思合不合理？', step: roundLabel }));
        container.appendChild(h('div', { class: 'phrase-image phrase-image--small' }, [ImageFrame({ src: round.image?.src || null, alt: round.image?.alt || '' })]));
        container.appendChild(h('div', { class: 'quiz-option-row' }, [
          h('p', { class: 'quiz-stem' }, c.prompt),
          SpeakButton({ text: c.prompt, label: '聽題目', variant: 'speak-button--option' }),
        ]));
        const fb = h('div', { class: 'phrase-feedback', role: 'status', 'aria-live': 'polite' });
        const opts = h('div', { class: 'quiz-options' });
        c.options.forEach((o) => {
          const b = h('button', { class: 'quiz-option', type: 'button' }, o.text);
          b.addEventListener('click', () => {
            clear(fb);
            const text = `${o.correct ? '✓ ' : '再想想：'}${o.feedback}`;
            fb.appendChild(h('div', { class: `quiz-option-row phrase-feedback__row ${o.correct ? 'phrase-feedback--right' : 'phrase-feedback--try'}` }, [
              h('p', {}, text), SpeakButton({ text, label: '聽', variant: 'speak-button--option' }),
            ]));
            if (o.correct) {
              opts.querySelectorAll?.('button').forEach((x) => { x.disabled = true; });
              b.classList.add('quiz-option--correct');
              const go = h('button', { class: 'btn btn--primary', type: 'button' }, '下一步');
              go.addEventListener('click', finishRound);
              fb.appendChild(h('div', { class: 'quiz-option-row' }, [go]));
            } else {
              b.disabled = true;
            }
          });
          opts.appendChild(h('div', { class: 'quiz-option-row' }, [b, SpeakButton({ text: o.text, label: '聽選項', variant: 'speak-button--option' })]));
        });
        container.appendChild(opts);
        container.appendChild(fb);
      }
    }
    renderStage();
  }

  jump = StepJump({ steps, moduleKey: 'phrase_builder', onJump: (k) => { specIndex = k; renderSpec(); } });
  renderSpec();
  return h('div', {}, [jump.el, container]);
}
