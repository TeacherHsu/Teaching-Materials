import { h, clear } from '../utils/dom.js';
import { ProgressIndicator } from './ProgressIndicator.js';
import { CompletionFeedback } from './CompletionFeedback.js';
import { SpeakButton } from './SpeakButton.js';
import { ReadAllButton } from './ReadAllButton.js';
import { ChoiceQuiz } from './ChoiceQuiz.js';
import { EvidencePanel } from './EvidencePanel.js';
import { isPreview } from '../utils/preview.js';

/**
 * 閱讀理解提問：選擇題呈現選項但不猜測未核定的答案；提示逐步揭露。
 * 策略標籤（strategy_tag）只在預覽模式顯示給老師看，
 * 學生畫面不會出現「提取訊息／推論訊息」等後設標籤。
 * @param {{items: Array, onBack?: () => void, backLabel?: string}} opts
 */

/**
 * 把一題接上三層鷹架。
 *
 * 有 evidence（答案在課文的哪幾句）的題目才做得出完整的三層：
 *   1 想一想  → 指向策略，由資料提供文字
 *   2 找位置  → 展開證據所在的段落（還不畫螢光筆）
 *   3 看證據  → 畫螢光筆
 * 沒有 evidence 的題目退回單層提示，不會壞掉——但那一層只是暗示，不是教方法，
 * 這也是為什麼「補 evidence」是這個模組真正的瓶頸。
 *
 * 證據句不在 item 裡（lesson JSON 不存課文明碼），由 EvidencePanel 在渲染時
 * 從解密後的課文取。課文沒解鎖就沒有第 2、3 層——這是刻意的。
 */
/**
 * 沒有解鎖課文時的第 3 層：不顯示課文（版權），但告訴學生翻課本看第幾段，
 * 學生仍然拿得到「去哪裡找」這個線索（2026-10-03 第二版審查）。
 */
function lockedHint(evidence, paraMap) {
  // 密文的段號不一定等於課本段號（課名、稱呼、故事便利貼也算一段）：
  // 只用段落大意對得上的課本段號；有任何一段對不上就不說段號，免得指錯地方
  const mapped = (evidence || []).map((e) => paraMap?.get(e.para));
  const paras = mapped.every(Boolean) ? [...new Set(mapped)].sort((a, b) => a - b) : [];
  const where = paras.length ? `打開課本，讀第 ${paras.join('、')} 段，找找和題目有關的句子。` : '打開課本找找看。';
  return `${where}（老師在「課文點讀」輸入教室密碼後，這裡會直接顯示那一段並畫出重點。）`;
}

// 畫重點試做（第二版審查 B2，CF 2026-10-04 同意先在讀懂課文試）：
// 題目可以一個詞一個詞點，點了上黃色螢光筆、再點取消——學生自己圈關鍵詞。
// 不評分（題目資料沒有標準關鍵詞），只是讓「找關鍵詞」變成手上的動作；第 1 層提示會引導去用它。
function splitWords(text) {
  try {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      return [...new Intl.Segmenter('zh-TW', { granularity: 'word' }).segment(text)].map((x) => x.segment);
    }
  } catch { /* 舊瀏覽器 */ }
  return [...text];
}
export function KeywordStem(text) {
  const words = splitWords(String(text));
  const line = h('span', { class: 'keyword-stem__line' }, words.map((w) => {
    if (!/[\p{Script=Han}A-Za-z0-9]/u.test(w)) return w;
    const tok = h('span', { class: 'keyword-stem__word', role: 'button', tabindex: '0', 'aria-pressed': 'false' }, w);
    const toggle = () => {
      const on = tok.classList.toggle('keyword-stem__word--on');
      tok.setAttribute('aria-pressed', String(on));
    };
    tok.addEventListener('click', toggle);
    tok.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault?.(); toggle(); } });
    return tok;
  }));
  return h('span', { class: 'keyword-stem' }, [
    line,
    h('span', { class: 'keyword-stem__tip' }, '可以先點題目裡重要的詞，用螢光筆圈起來。'),
  ]);
}

function buildScaffoldedItem(lessonId, item) {
  const written = Array.isArray(item.hints)
    ? item.hints.filter((hint) => hint && typeof hint.text === 'string')
    : [];
  const byLevel = (level) => written.find((hint) => hint.level === level);
  const first = byLevel(1) || written[0];

  // 第 1、2 層是文字（策略 → 找位置）；第 3 層才把課文段落直接放到題目上方，
  // 段落中的線索句畫底線、關鍵資訊上螢光筆（CF 2026-10-04）。
  // 面板在按到第 3 層「當下」才建立：學生做題中途老師才輸入密碼，也看得到。
  const slot = h('div', { class: 'evidence-slot' });
  slot.hidden = true;
  const layers = [];
  if (first) layers.push({ text: first.text });
  layers.push({ text: byLevel(2)?.text || '答案在課文的哪一部分？先想想題目問的是誰、在做什麼。' });
  if (!item.evidence) {
    // 沒有證據索引的題目（或舊資料）：維持文字提示
    const fallback = written.map((hint) => hint.text);
    return { ...item, hints: fallback.length ? fallback : (item.scaffold ? [item.scaffold] : undefined) };
  }
  const extract = item.strategy_tag === '提取訊息' || !item.strategy_tag;
  layers.push({
    text: byLevel(3)?.text || (extract
      ? '看上面的課文：螢光筆畫的就是答案的關鍵字，和選項對照看看。'
      : '看上面的課文：畫線的句子是線索，螢光筆是重要的詞。想一想它們讓你知道了什麼？'),
    on: () => {
      const panel = EvidencePanel({
        lessonId,
        spots: item.evidence,
        label: '課文裡的這一段',
        keys: [item.answer, item.answer_hint, item.explanation].filter(Boolean),
        exclude: item.stem,
      });
      clear(slot);
      slot.appendChild(panel
        ? panel.el
        : h('p', { class: 'meta evidence__lock-note' }, lockedHint(item.evidence, item._paraMap)));
      slot.hidden = false;
      if (panel) panel.highlight();
    },
  });
  layers[0] = { ...layers[0], text: `先圈關鍵詞：點題目裡最重要的詞。${layers[0].text}` };
  return { ...item, stemContent: KeywordStem(item.stem), hints: layers, extra: slot, skill: item.skill || (item.strategy_tag ? `reading:${item.strategy_tag}` : null) };
}

export function ReadingQuestions({ lessonId, items, onBack, backLabel = '本課先完成', onContinue, continueLabel = '加練下一組' }) {
  const hasOptions = items.some((item) => Array.isArray(item.options) && item.options.length > 0);
  if (hasOptions) {
    const allChoicesReady = items.every((item) =>
      Array.isArray(item.options)
      && item.options.length >= 2
      && typeof item.answer === 'string'
      && item.options.includes(item.answer),
    );
    if (!allChoicesReady) {
      return h('div', { class: 'quiz-panel' }, [
        h('p', { class: 'meta', role: 'status', 'aria-live': 'polite' }, '這組選擇題的答案資料尚待核對，暫時無法開始。'),
      ]);
    }

    // 所有年級共用選擇題回饋：第一次答錯給線索，第二次才揭曉答案。
    return ChoiceQuiz({
      items: items.map((item) => buildScaffoldedItem(lessonId, item)),
      onBack,
      backLabel,
      onContinue,
      continueLabel,
    });
  }

  const root = h('div', { class: 'quiz-panel' });
  let index = 0;
  const preview = isPreview();

  function render() {
    clear(root);
    if (index >= items.length) {
      // 開放問答：學生是口頭或在紙上回答，網站沒有收到答案——只說「看完了」，不顯示答對數、不記分
      root.appendChild(CompletionFeedback({ total: items.length, reviewedOnly: true, onBack, backLabel, onContinue, continueLabel }));
      return;
    }
    const item = items[index];
    root.appendChild(ProgressIndicator({ current: index + 1, total: items.length }));

    if (preview && item.status === 'draft') {
      root.appendChild(h('span', { class: 'review-pending-badge' }, '待審'));
    }
    if (preview && item.strategy_tag) {
      root.appendChild(h('p', { class: 'meta' }, `（教師預覽）策略標籤：${item.strategy_tag}`));
    }

    root.appendChild(
      h('div', { class: 'quiz-title-row' }, [
        h('div', { class: 'quiz-option-row audio-control-group audio-control-group--prompt' }, [
          h('p', { class: 'quiz-stem' }, item.stem),
          SpeakButton({ text: item.stem, label: '聽題目', showLabel: true, ariaLabel: `聽題目：${item.stem}`, variant: 'speak-button--option speak-button--audio-label' }),
        ]),
        ReadAllButton(() => ({ stem: item.stem, options: item.options || [] })),
      ]),
    );

    const selectionStatus = h('p', { class: 'meta', role: 'status', 'aria-live': 'polite' });
    if (Array.isArray(item.options) && item.options.length > 0) {
      const optionsWrap = h('div', { class: 'quiz-options', role: 'group', 'aria-label': '選項' });
      for (const option of item.options) {
        const optionButton = h('button', { class: 'quiz-option', type: 'button', 'aria-pressed': 'false' }, option);
        optionButton.addEventListener('click', () => {
          for (const button of optionsWrap.querySelectorAll('button.quiz-option')) {
            const active = button === optionButton;
            button.classList.toggle('quiz-option--selected', active);
            button.setAttribute('aria-pressed', String(active));
          }
          selectionStatus.textContent = `你選了：${option}`;
        });
        optionsWrap.appendChild(h('div', { class: 'quiz-option-row audio-control-group audio-control-group--option' }, [
          optionButton,
          SpeakButton({ text: option, label: '聽選項', showLabel: true, ariaLabel: `聽選項：${option}`, variant: 'speak-button--option speak-button--audio-label' }),
        ]));
      }
      root.appendChild(optionsWrap);
      root.appendChild(selectionStatus);
    }

    const revealSlot = h('div', { role: 'status', 'aria-live': 'polite' });
    let revealStage = 0;
    // 有證據句（且課文已解鎖）時，鷹架落在課文上：第 1 層打開那一段、
    // 第 2 層把線索句畫起來、第 3 層才給參考答案。沒有證據（看圖題、開放思考題）
    // 維持原本的文字提示。
    const panel = lessonId && item.evidence
      ? EvidencePanel({ lessonId, spots: item.evidence, label: '課文裡的這一段', keys: [item.answer_hint].filter(Boolean), exclude: item.stem })
      : null;
    if (panel) {
      panel.el.hidden = true;
      root.appendChild(panel.el);
    }
    const revealBtn = h('button', { class: 'btn btn--secondary', type: 'button', style: 'margin-top:12px' }, panel ? '看課文哪一段' : '找哪段／哪張圖');
    revealBtn.addEventListener('click', () => {
      clear(revealSlot);
      if (panel && revealStage === 0) panel.el.hidden = false;
      if (panel && revealStage === 1) panel.highlight();
      const stages = panel
        ? [
          '答案的線索在這一段裡，先讀一讀。',
          '畫起來的句子是線索。用自己的話說說看答案。',
          `老師的參考答案：${item.answer_hint || '說說看你的想法。'}`,
        ]
        : [
          item.scaffold || '回到課文，找出和題目有關的段落或插圖。',
          '先圈出題目中的關鍵詞，再回到課文或插圖找線索。',
          item.answer_hint || '想一想，說說看你的答案。',
        ];
      const labels = panel ? ['畫出線索句', '看參考答案'] : ['指出關鍵詞', '看答案提示'];
      const hintText = stages[revealStage];
      revealSlot.appendChild(
        h('div', { class: 'quiz-option-row audio-control-group audio-control-group--hint' }, [
          h('p', { class: 'meta' }, hintText),
          SpeakButton({ text: hintText, label: '聽', variant: 'speak-button--option' }),
        ]),
      );
      revealStage += 1;
      if (revealStage < stages.length) {
        revealBtn.textContent = labels[revealStage - 1];
      } else {
        revealBtn.disabled = true;
        root.appendChild(nextBtn);
      }
    });

    const nextBtn = h('button', { class: 'btn', type: 'button', style: 'margin-top:16px' },
      index + 1 < items.length ? '下一題' : '看結果');
    nextBtn.addEventListener('click', () => {
      index += 1;
      render();
    });

    root.appendChild(revealBtn);
    root.appendChild(revealSlot);
  }

  render();
  return root;
}
