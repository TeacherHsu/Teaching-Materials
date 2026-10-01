// 自己寫一句話：全站唯一讓學生自由輸入文字的地方。
//
// 為什麼要有：點詞塊組句有固定正解、機器判得出來，但那不是「造句」——
// 學生沒有真的產出過一句自己的話。真正的造句需要人看過，所以這一步寫完
// 不判對錯，交給教師批改（教師頁 → ✓／✗ → 打 ✗ 的進錯題複習重寫）。
//
// 設計重點：
//   · 句型、說明、例句一直留在畫面上——這是鷹架，不是考記憶。
//   · 提供語音輸入：學生打字慢，用說的比較不會卡在輸入法而忘記要寫什麼。
//   · 「還沒用到的字」只是**提示**，永遠可以直接送出。用不可靠的規則擋住
//     學生，比不檢查更糟（句型敘述的寫法並不一致，見 utils/madeSentences.js）。
import { h, clear } from '../utils/dom.js';
import { uiIconMarkup } from './icons.js';
import { SpeakButton } from './SpeakButton.js';
import { checkSentence, missingKeywords, saveSentence } from '../utils/madeSentences.js';

function recognitionSupported() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * @param {{
 *   lessonId: string,
 *   pattern: object,            // sentence_patterns 的一筆
 *   previous?: string,          // 重寫時帶入上次寫的句子
 *   onDone: (text: string) => void,
 *   onBack?: () => void,
 *   backLabel?: string,
 * }} opts
 */
export function SentenceWriter({ lessonId, pattern, previous = '', onDone, onBack, backLabel = '回課程首頁' }) {
  const root = h('div', { class: 'writer' });

  const promptText = `請用「${pattern.structure || pattern.head}」寫一句話。`;
  root.appendChild(
    h('div', { class: 'quiz-option-row' }, [
      h('p', { class: 'writer__prompt' }, promptText),
      SpeakButton({ text: promptText, label: '聽', variant: 'speak-button--option' }),
    ]),
  );

  // 鷹架：句型、說明、例句一直看得到
  // 重寫時只拿得到句型本身（錯題盒不存整課資料），說明和例句可能是空的——
  // 這時候不要畫出一個空的鷹架框。
  const scaffoldParts = [
    pattern.description ? h('p', { class: 'writer__desc' }, pattern.description) : null,
    (pattern.examples || []).length
      ? h('div', {}, [
          h('p', { class: 'writer__examples-label' }, '例句'),
          h('ul', { class: 'writer__examples' },
            (pattern.examples || []).slice(0, 3).map((ex) => h('li', {}, [
              h('span', {}, ex),
              SpeakButton({ text: ex, label: '聽', variant: 'speak-button--option' }),
            ]))),
        ])
      : null,
  ].filter(Boolean);
  if (scaffoldParts.length) {
    root.appendChild(h('div', { class: 'writer__scaffold' }, scaffoldParts));
  }

  const input = h('textarea', {
    class: 'writer__input',
    rows: '3',
    'aria-label': '寫下你的句子',
    placeholder: '在這裡寫一句話…',
    spellcheck: 'false',
  });
  input.value = previous || '';
  root.appendChild(input);

  const message = h('p', { class: 'writer__message', role: 'status', 'aria-live': 'polite' }, '');

  // ── 語音輸入 ────────────────────────────────────
  let recognition = null;
  const micBtn = h('button', { class: 'btn writer__mic', type: 'button' }, '用說的');
  if (recognitionSupported()) {
    micBtn.addEventListener('click', () => {
      if (recognition) {
        try { recognition.stop(); } catch { /* 已經停了 */ }
        return;
      }
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new Recognition();
      recognition.lang = 'zh-TW';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      micBtn.textContent = '正在聽…（再按一次停止）';
      micBtn.classList.add('writer__mic--on');
      recognition.onresult = (event) => {
        const said = event.results?.[0]?.[0]?.transcript || '';
        // 接在原本的句子後面，學生可以說一段、再說一段
        input.value = (input.value + said).trim();
        update();
      };
      recognition.onerror = () => {
        message.textContent = '沒聽清楚，再試一次，或直接用鍵盤寫。';
      };
      recognition.onend = () => {
        recognition = null;
        micBtn.textContent = '用說的';
        micBtn.classList.remove('writer__mic--on');
      };
      try {
        recognition.start();
      } catch {
        recognition = null;
        message.textContent = '這台裝置不能用說的，請用鍵盤寫。';
      }
    });
    root.appendChild(h('div', { class: 'quiz-option-row' }, [micBtn]));
  }

  root.appendChild(message);

  // ── 軟提示 ──────────────────────────────────────
  const hint = h('p', { class: 'writer__hint' }, '');
  root.appendChild(hint);

  function update() {
    const missing = missingKeywords(input.value, pattern);
    hint.textContent = missing.length
      ? `提示：還沒用到「${missing.join('」「')}」。（還是可以送出，老師會看）`
      : '';
    hint.classList.toggle('writer__hint--show', missing.length > 0);
  }
  input.addEventListener('input', update);
  update();

  // ── 送出 ────────────────────────────────────────
  const submit = h('button', { class: 'btn btn--primary', type: 'button' }, '寫好了，交給老師看');
  submit.addEventListener('click', () => {
    const result = checkSentence(input.value);
    if (!result.ok) {
      message.textContent = result.reason;
      input.focus();
      return;
    }
    saveSentence({
      lessonId,
      patternId: pattern.id,
      patternHead: pattern.head,
      structure: pattern.structure,
      text: result.text,
    });
    clear(root);
    const done = `寫好了！你的句子是：${result.text}　老師看過之後會告訴你。`;
    root.appendChild(
      h('div', { class: 'writer__done' }, [
        h('p', { class: 'outcome__icon', 'aria-hidden': 'true', html: uiIconMarkup('sent') }),
        h('div', { class: 'quiz-option-row' }, [
          h('h2', { class: 'outcome__title' }, '交出去了！'),
          SpeakButton({ text: done, label: '聽', variant: 'speak-button--option' }),
        ]),
        h('p', { class: 'writer__done-text' }, result.text),
        h('p', { class: 'meta' }, '老師看過之後會告訴你。'),
      ]),
    );
    onDone(result.text);
  });

  const actions = [submit];
  if (onBack) {
    const back = h('button', { class: 'btn', type: 'button' }, backLabel);
    back.addEventListener('click', onBack);
    actions.push(back);
  }
  root.appendChild(h('div', { class: 'quiz-option-row writer__actions' }, actions));

  return root;
}
