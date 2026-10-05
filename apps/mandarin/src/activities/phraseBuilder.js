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

const isFreeSlot = (slot) => !slot.fixed && slot.copy_of === undefined;
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
  // 固定字（slots[i].fixed，例如「越」「的」）自動補上；
  // copy_of 的格子＝和另一格同一個詞（例如「想也不想」「一朵又一朵」），自動跟著填
  chunks = spec.slots.map((s, i) => (s.fixed ? s.fixed : chunks[i]));
  chunks = chunks.map((c, i) => (spec.slots[i].copy_of !== undefined ? chunks[spec.slots[i].copy_of] : c));
  if (chunks.length < spec.slots.length || chunks.some((c) => !c)) return { kind: 'incomplete' };
  const roleOf = (text) => spec.bank.find((b) => b.text === text)?.role;
  const free = (i) => !spec.slots[i].fixed && spec.slots[i].copy_of === undefined;
  if (!chunks.every((c, i) => !free(i) || roleOf(c) === spec.slots[i].role)) return { kind: 'structure' };
  if (same(chunks, round.answer)) return { kind: 'fit' };
  if ((spec.accepted || []).some((a) => same(a, chunks))) return { kind: 'ok-other' };
  const reject = (spec.semantic_rejects || []).find((r) => same(r.chunks, chunks));
  return { kind: 'semantic', feedback: reject?.feedback || '順序對了。想一想：平常會這樣說嗎？再看看圖片。' };
}

function chunkRow(chunks, slots, { showLabels = true } = {}) {
  return h('div', { class: 'phrase-chunks' }, chunks.map((c, i) => h('span', { class: `phrase-chunk phrase-chunk--${slots[i] && !isFreeSlot(slots[i]) ? 'fixed' : (slots[i]?.role || '')}` }, [
    showLabels && slots[i] && isFreeSlot(slots[i]) ? h('span', { class: 'phrase-chunk__label' }, slots[i].label) : null,
    h('span', { class: 'phrase-chunk__text' }, c),
  ].filter(Boolean))));
}

// 三步驟（2026-10-05 參考站「短語短句」分析後調整）：
//   ① 認識積木：課本短語一塊一塊放聲思考，最後「換你試試」換一塊（零壓力）
//   ② 一起想：第一張圖，每一格配一個引導問題（slots[i].ask），格子標籤看得到
//   ③ 看圖自己想：之後的圖，不給問題與標籤（第 2 級提示再打開）
const STAGES = ['認識積木', '一起想', '看圖自己想'];

function stageBar(active) {
  return h('ol', { class: 'phrase-stages', 'aria-label': '照樣造短語的步驟' }, STAGES.map((name, i) => h('li', {
    class: `phrase-stages__item${i === active ? ' phrase-stages__item--now' : i < active ? ' phrase-stages__item--done' : ''}`,
    'aria-current': i === active ? 'step' : null,
  }, `${i < active ? '✓ ' : i === active ? '▶ ' : ''}${name}`)));
}

const isFree = isFreeSlot;

export function buildPhraseBuilderActivity(lesson, onBack) {
  const specs = readyPhraseBuilders(lesson);
  const container = h('div', {});
  if (!specs.length) {
    container.appendChild(missingContentNotice('照樣造短語：這一課的短語還在等老師確認'));
    return container;
  }
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
    let stage = 'demo';

    function finishRound() {
      if (roundIndex + 1 < spec.rounds.length) { roundIndex += 1; stage = 'build'; renderStage(); return; }
      if (specIndex + 1 < specs.length) { specIndex += 1; renderSpec(); return; }
      clear(container);
      container.appendChild(CompletionFeedback({ correct, total, onBack, backLabel: '回課程首頁' }));
    }

    function sayRow(text, cls = '') {
      return h('div', { class: `quiz-option-row phrase-feedback__row ${cls}` }, [
        h('p', {}, text),
        SpeakButton({ text, label: '聽', variant: 'speak-button--option' }),
      ]);
    }

    function renderStage() {
      clear(container);
      const round = spec.rounds[roundIndex];
      const guided = roundIndex === 0;

      if (stage === 'demo') {
        // ① 認識積木：一塊一塊放聲思考
        container.appendChild(stageBar(0));
        const head = spec.example.chunks.join('');
        container.appendChild(TaskBanner({ label: '認識積木：看看課本的短語怎麼一塊一塊組成' }));
        container.appendChild(h('div', { class: 'quiz-option-row' }, [
          h('p', { class: 'phrase-demo__head' }, `課本：${head}`),
          SpeakButton({ text: head, label: '聽', variant: 'speak-button--option' }),
        ]));
        const lines = [];
        spec.slots.forEach((slot, i) => {
          const c = spec.example.chunks[i];
          if (slot.fixed) lines.push({ upto: i, text: `「${slot.fixed}」不用換，照著放。` });
          else if (slot.copy_of !== undefined) lines.push({ upto: i, text: `這一塊和前面一樣，也放「${c}」。` });
          else lines.push({ upto: i, text: `這一塊要放「${slot.label}」，課本放的是「${c}」。` });
        });
        lines.push({ upto: spec.slots.length - 1, text: `合起來就是：「${head}」。${spec.explain}` });
        let k = 0;
        const row = h('div', {});
        const think = h('div', { class: 'phrase-think' });
        const next = h('button', { class: 'btn btn--secondary', type: 'button' }, '');
        const tryBox = h('div', {});
        const drawDemo = () => {
          clear(row); clear(think);
          const shown = spec.example.chunks.map((c, i) => (i <= lines[k].upto ? c : '＿'));
          row.appendChild(chunkRow(shown, spec.slots));
          think.appendChild(sayRow(lines[k].text, 'phrase-think__row'));
          speak(lines[k].text);
          next.textContent = k + 1 < lines.length ? `下一塊（${k + 2}／${lines.length}）` : '換你試試';
        };
        next.addEventListener('click', () => {
          if (k + 1 < lines.length) { k += 1; drawDemo(); return; }
          next.hidden = true;
          // 換你試試：換第一塊可以換的積木，選什麼都不扣分
          const at = spec.slots.findIndex(isFree);
          const slot = spec.slots[at];
          clear(tryBox);
          tryBox.appendChild(sayRow(`換你試試：換一塊「${slot.label}」，看看變成什麼短語。`));
          const out = h('div', {});
          const choices = h('div', { class: 'phrase-bank' }, spec.bank.filter((b) => b.role === slot.role).map((b) => {
            const btn = h('button', { class: 'phrase-tile', type: 'button' }, b.text);
            btn.addEventListener('click', () => {
              const chunks = spec.example.chunks.map((c, i) => (i === at ? b.text : (spec.slots[i].copy_of === at ? b.text : c)));
              const phrase = chunks.join('');
              const ok = (spec.accepted || []).some((a) => same(a, chunks));
              clear(out);
              out.appendChild(chunkRow(chunks, spec.slots));
              out.appendChild(sayRow(ok ? `✓ 「${phrase}」也說得通！換一塊，就是新的短語。` : `「${phrase}」說起來有點怪，再換一塊試試看。`, ok ? 'phrase-feedback--right' : 'phrase-feedback--try'));
            });
            return btn;
          }));
          tryBox.appendChild(choices);
          tryBox.appendChild(out);
        });
        const start = h('button', { class: 'btn btn--primary', type: 'button' }, '我知道了，開始練習');
        start.addEventListener('click', () => { stage = 'build'; renderStage(); });
        container.appendChild(row);
        container.appendChild(think);
        container.appendChild(h('div', { class: 'quiz-option-row' }, [next]));
        container.appendChild(tryBox);
        container.appendChild(h('div', { class: 'quiz-option-row phrase-start' }, [start]));
        drawDemo();
        return;
      }

      if (stage === 'build') {
        // ② 一起想（第一張圖）／③ 看圖自己想（之後的圖）
        container.appendChild(stageBar(guided ? 1 : 2));
        container.appendChild(TaskBanner({
          label: guided ? '一起想：看圖，回答下面的問題，一塊一塊選積木' : '看圖自己想：組出和圖片一樣意思的短語',
          step: spec.rounds.length > 1 ? `第 ${roundIndex + 1}／${spec.rounds.length} 題` : '',
        }));
        const imageBox = h('div', { class: 'phrase-image phrase-image--small' }, [ImageFrame({ src: round.image?.src || null, alt: round.image?.alt || '' })]);
        container.appendChild(imageBox);
        const scene = round.scene || round.image?.alt || '';
        if (scene) container.appendChild(sayRow(scene, 'phrase-scene'));

        const picked = spec.slots.map((s) => s.fixed || null);
        const sync = () => spec.slots.forEach((s, i) => { if (s.copy_of !== undefined) picked[i] = picked[s.copy_of]; });
        const firstEmpty = () => picked.findIndex((p, i) => !p && isFree(spec.slots[i]));
        let attempts = 0;
        let hintLevel = 0;
        let hintUsed = false;
        let showLabels = guided;
        let showAsks = guided;
        let hidden = new Set();
        const answerRow = h('div', { class: 'phrase-answer', 'aria-label': '你的短語' });
        const askBox = h('ol', { class: 'phrase-asks' });
        const bankRow = h('div', { class: 'phrase-bank', role: 'group', 'aria-label': '積木' });
        const feedback = h('div', { class: 'phrase-feedback', role: 'status', 'aria-live': 'polite' });

        function drawAsks() {
          clear(askBox);
          const asks = spec.slots.map((s, i) => ({ s, i })).filter(({ s }) => isFree(s) && s.ask);
          askBox.hidden = !showAsks || !asks.length;
          const now = firstEmpty();
          asks.forEach(({ s, i }) => askBox.appendChild(h('li', { class: `phrase-asks__item${i === now ? ' phrase-asks__item--now' : ''}` }, [
            h('span', {}, `${s.ask}（「${s.label}」）`),
            SpeakButton({ text: s.ask, label: '聽', variant: 'speak-button--option' }),
          ])));
        }
        function drawAnswer() {
          clear(answerRow);
          const now = firstEmpty();
          spec.slots.forEach((slot, i) => {
            const filled = picked[i];
            if (!isFree(slot)) {
              answerRow.appendChild(h('span', { class: 'phrase-slot phrase-slot--fixed', 'aria-label': slot.fixed ? `固定的字：${slot.fixed}` : `和前面一樣：${filled || '還沒放'}` }, [
                h('span', { class: 'phrase-slot__text' }, filled || '＿'),
              ]));
              return;
            }
            const b = h('button', {
              class: `phrase-slot phrase-slot--${slot.role}${filled ? ' phrase-slot--filled' : ''}${showAsks && i === now ? ' phrase-slot--now' : ''}`,
              type: 'button',
              'aria-label': filled ? `${slot.label}：${filled}，點一下拿掉` : `空格${showLabels ? `，要放「${slot.label}」` : ''}`,
            }, [
              showLabels ? h('span', { class: 'phrase-chunk__label' }, slot.label) : null,
              h('span', { class: 'phrase-slot__text' }, filled || '＿＿'),
            ].filter(Boolean));
            b.addEventListener('click', () => { if (picked[i]) { picked[i] = null; sync(); redraw(); } });
            answerRow.appendChild(b);
          });
        }
        function drawBank() {
          clear(bankRow);
          spec.bank.filter((c) => !hidden.has(c.text)).forEach((c) => {
            const used = spec.slots.some((s, i) => isFree(s) && picked[i] === c.text);
            const b = h('button', { class: `phrase-tile${used ? ' phrase-tile--used' : ''}`, type: 'button', disabled: used ? 'disabled' : null }, c.text);
            b.addEventListener('click', () => {
              const at = firstEmpty();
              if (at < 0 || used) return;
              picked[at] = c.text;
              sync();
              redraw();
            });
            bankRow.appendChild(b);
          });
        }
        function redraw() { drawAnswer(); drawAsks(); drawBank(); clear(feedback); }

        const check = h('button', { class: 'btn btn--primary', type: 'button' }, '檢查');
        const reset = h('button', { class: 'btn', type: 'button' }, '重新開始');
        const hintBtn = h('button', { class: 'btn btn--ghost', type: 'button' }, '看提示（1／3）');
        reset.addEventListener('click', () => { spec.slots.forEach((s, i) => { picked[i] = s.fixed || null; }); redraw(); });
        const say = (text, cls) => { clear(feedback); feedback.appendChild(sayRow(text, cls)); };

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
          else { showLabels = true; drawAnswer(); say(`看看例子：${spec.explain}`, 'phrase-feedback--try'); }
        });

        hintBtn.addEventListener('click', () => {
          hintUsed = true;
          hintLevel += 1;
          let text = '';
          if (hintLevel === 1) {
            imageBox.classList.add('phrase-image--focus');
            text = round.image_hint || '再看一次圖片，圖片裡最重要的是什麼？';
          } else if (hintLevel === 2) {
            showLabels = true; showAsks = true; drawAnswer(); drawAsks();
            text = `看格子上的字：${spec.slots.map((s) => `「${s.fixed || (s.copy_of !== undefined ? '同上' : s.label)}」`).join('＋')}。`;
          } else {
            const keep = new Set(round.answer);
            spec.slots.filter(isFree).forEach((slot) => {
              const extra = spec.bank.find((c) => c.role === slot.role && !keep.has(c.text));
              if (extra) keep.add(extra.text);
            });
            hidden = new Set(spec.bank.map((c) => c.text).filter((t) => !keep.has(t)));
            picked.forEach((t, i) => { if (t && isFree(spec.slots[i]) && hidden.has(t)) picked[i] = null; });
            sync(); drawAnswer(); drawBank();
            text = '拿掉了一些用不到的積木，在剩下的裡面選。';
          }
          clear(feedback);
          feedback.appendChild(HintPanel({ message: text }));
          hintBtn.textContent = `看提示（${Math.min(hintLevel + 1, 3)}／3）`;
          hintBtn.hidden = hintLevel >= 3;
        });

        redraw();
        container.appendChild(answerRow);
        container.appendChild(askBox);
        container.appendChild(bankRow);
        container.appendChild(h('div', { class: 'quiz-option-row phrase-actions' }, [check, reset, hintBtn]));
        container.appendChild(feedback);
        return;
      }

      if (stage === 'check') {
        // 小確認：排得對不代表意思合理
        const c = round.check;
        if (!c) { finishRound(); return; }
        container.appendChild(stageBar(guided ? 1 : 2));
        container.appendChild(TaskBanner({ label: '想一想：意思合不合理？' }));
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
            fb.appendChild(sayRow(`${o.correct ? '✓ ' : '再想想：'}${o.feedback}`, o.correct ? 'phrase-feedback--right' : 'phrase-feedback--try'));
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
