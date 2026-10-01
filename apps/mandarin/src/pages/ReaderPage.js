// 課文點讀：點字、點詞、點句都會念；也可以整篇念下來、逐句高亮。
//
// 為什麼要有這一頁：點讀是閱讀困難學生進入課文的入口。原本做在
// Chinese/Reading-Tool（另一個網址），學生要換站才找得到，等於放在動線外。
// 現在併進課次首頁，和其他大項並排。
//
// 課文全文是出版社教材，只以密文放在站上（見 utils/classroomKey.js），
// 所以這一頁要先過教室密碼。沒解鎖時顯示密碼門，不顯示任何課文片段。
//
// 資料形狀（由 tools/encrypt_readings.py 產生）：
//   paras[段][行][詞] = [文字, "注音 注音 …", 朗讀用字|null]
// 「朗讀用字」是教師裁定的讀音覆寫（例如「一會兒」的「會」念 ㄏㄨㄟˇ，
// 餵「毀」給語音合成才對），優先於語音引擎自己的判斷。
import { h, clear } from '../utils/dom.js';
import { speak, cancelSpeaking, speechSupported } from '../utils/speech.js';
import {
  cryptoAvailable,
  getReading,
  isUnlocked,
  unlockWithPassword,
} from '../utils/classroomKey.js';
import { volumeLabel } from '../utils/volumeLabel.js';
import { ZhuyinText } from '../components/ZhuyinText.js';

// 句子的切點。點讀的「句」用標點切，和學生讀出來的停頓一致。
const SENTENCE_END = /[，。？！；：]/;
// 這些標點不另成一個點讀單位，黏在前一個字後面（中文排版：標點不孤行）。
const TRAILING = /[，。、；：？！」』）…─—]/;
const LEADING = /[「『（]/;

const MODES = [
  { key: 'char', label: '讀字', hint: '點一個字，念那個字。' },
  { key: 'word', label: '讀詞', hint: '點一個字，念整個語詞。' },
  { key: 'sent', label: '讀句', hint: '點一個字，念整句話。' },
];

/**
 * @param {object} lesson 課次物件（含 lesson_id、lesson_no、title、volume）
 * @returns {HTMLElement}
 */
export function ReaderPage(lesson) {
  const root = h('div', { class: 'container' });

  root.appendChild(
    h('p', { class: 'breadcrumb' }, [
      h('a', { href: '#/' }, '首頁'),
      h('a', { href: `#/grade/${lesson.volume.grade}` }, volumeLabel(lesson.volume)),
      h('a', { href: `#/lesson/${lesson.lesson_id}` }, `第 ${lesson.lesson_no} 課`),
      h('span', { class: 'breadcrumb__current' }, '課文點讀'),
    ]),
  );

  const body = h('div', {});
  root.appendChild(body);

  function render() {
    clear(body);
    if (!isUnlocked()) {
      body.appendChild(renderGate(lesson, render));
      return;
    }
    const reading = getReading(lesson.lesson_id);
    if (!reading) {
      body.appendChild(
        h('div', { class: 'card notice' }, [
          h('p', {}, '這一課還沒有課文點讀。'),
          h('a', { class: 'btn', href: `#/lesson/${lesson.lesson_id}` }, '← 回到本課'),
        ]),
      );
      return;
    }
    body.appendChild(renderReader(lesson, reading));
  }

  render();
  return root;
}

// ── 教室密碼門 ────────────────────────────────────
function renderGate(lesson, onUnlocked) {
  const input = h('input', {
    class: 'gate__input',
    type: 'password',
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: 'false',
    inputmode: 'numeric',
    'aria-label': '教室密碼',
  });
  const message = h('p', { class: 'gate__message', role: 'status', 'aria-live': 'polite' }, '');
  const submit = h('button', { class: 'btn btn--primary btn--block', type: 'button' }, '進入教室');
  let busy = false;

  async function tryUnlock() {
    const password = input.value.trim();
    if (!password || busy) return;
    if (!cryptoAvailable()) {
      message.textContent = '這個瀏覽器不能解鎖課文，請用 Safari 或 Chrome 開啟正式網址（https）。';
      return;
    }
    busy = true;
    submit.disabled = true;
    message.textContent = '開門中……';
    try {
      await unlockWithPassword(password);
      onUnlocked();
    } catch {
      busy = false;
      submit.disabled = false;
      input.value = '';
      message.textContent = '密碼不對，再試一次。';
      input.classList.remove('gate__input--shake');
      void input.offsetWidth; // 強制重算，讓同一個動畫可以再播一次
      input.classList.add('gate__input--shake');
      input.focus();
    }
  }

  submit.addEventListener('click', tryUnlock);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') tryUnlock();
  });
  setTimeout(() => input.focus(), 50);

  return h('div', { class: 'card gate' }, [
    h('p', { class: 'gate__icon', 'aria-hidden': 'true' }, '🔒'),
    h('h1', { class: 'gate__title' }, '請輸入教室密碼'),
    h('p', { class: 'gate__note' }, '課文只給班上同學使用。輸入一次之後，這台載具會記住。'),
    input,
    message,
    submit,
  ]);
}

// ── 點讀本體 ──────────────────────────────────────
function renderReader(lesson, reading) {
  let mode = 'word';
  let showZhuyin = true;
  let playingAll = false;
  let highlighted = [];

  // 三種點讀粒度共用同一份 DOM：建字元節點時就把它登記進三張表，
  // 切模式只是換查表的對象，不重建畫面（重建會讓學生失去閱讀位置）。
  const units = { char: [], word: [], sent: [] };
  /** @type {Map<HTMLElement, {char:object, word:object, sent:object}>} */
  const ownerOf = new Map();

  const textBox = h('div', { class: 'reader__text', lang: 'zh-TW' });

  function clearHighlight() {
    highlighted.forEach((el) => el.classList.remove('reader__ch--reading'));
    highlighted = [];
  }

  async function play(unit) {
    if (!unit) return;
    clearHighlight();
    unit.els.forEach((el) => el.classList.add('reader__ch--reading'));
    highlighted = unit.els;
    // say 是教師裁定的朗讀用字；沒有覆寫時就用畫面上的字。
    await speak(unit.say || unit.text);
  }

  function onCharClick(el) {
    if (playingAll) return;
    const owners = ownerOf.get(el);
    if (owners) play(owners[mode]);
  }

  // 建 DOM：段 → 行 → 詞 → 字
  reading.paras.forEach((para) => {
    const paraEl = h('div', { class: 'reader__para' });
    let sent = { els: [], text: '', say: '' };

    const closeSentence = () => {
      if (sent.els.length) units.sent.push(sent);
      sent = { els: [], text: '', say: '' };
    };

    para.forEach((line) => {
      const lineEl = h('p', { class: 'reader__line' });
      // 標點不孤行：把「字＋黏著的標點」包成一個不換行的群組。
      let group = null;
      let pendingOpen = null;

      line.forEach((token) => {
        const [text, zhuyinText, say] = token;
        const zhuyins = zhuyinText ? zhuyinText.split(' ') : [];
        const word = { els: [], text, say: say || text };

        [...text].forEach((ch, i) => {
          const zhuyin = zhuyins[i] || '';
          const isHan = Boolean(zhuyin);
          const el = h('span', {
            class: isHan ? 'reader__ch' : 'reader__ch reader__ch--punct',
            ...(isHan ? { role: 'button', tabindex: '0' } : { 'aria-hidden': 'true' }),
          });
          el.appendChild(ZhuyinText(ch, zhuyin));

          if (isHan) {
            // 逐字的朗讀用字：say 和 text 等長時逐位對應。
            const charSay = say && [...say].length === [...text].length ? [...say][i] : ch;
            const charUnit = { els: [el], text: ch, say: charSay };
            units.char.push(charUnit);
            word.els.push(el);
            sent.els.push(el);
            sent.text += ch;
            sent.say += charSay;
            ownerOf.set(el, { char: charUnit, word, sent });
            el.addEventListener('click', () => onCharClick(el));
            el.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onCharClick(el);
              }
            });
          } else {
            // 標點也要進句子的文字，念出來的停頓才對。
            sent.text += ch;
            sent.say += ch;
          }

          // 排版：標點黏前字、上引號黏後字。
          if (TRAILING.test(ch) && group) {
            group.appendChild(el);
          } else if (LEADING.test(ch)) {
            pendingOpen = pendingOpen || h('span', { class: 'reader__nowrap' });
            pendingOpen.appendChild(el);
          } else {
            group = pendingOpen || h('span', { class: 'reader__nowrap' });
            pendingOpen = null;
            group.appendChild(el);
            lineEl.appendChild(group);
          }

          // 句末標點＋句子有實際內容才切句（避免「」單獨成句）
          if (SENTENCE_END.test(ch) && sent.text.replace(/[「」『』（）\s]/g, '').length > 1) {
            closeSentence();
          }
        });

        if (word.els.length) units.word.push(word);
      });

      if (pendingOpen) lineEl.appendChild(pendingOpen);
      paraEl.appendChild(lineEl);
    });

    closeSentence();
    textBox.appendChild(paraEl);
  });

  // ── 工具列 ──────────────────────────────────────
  const hint = h('p', { class: 'reader__hint', role: 'status', 'aria-live': 'polite' },
    MODES.find((m) => m.key === mode).hint);

  const modeGroup = h('div', { class: 'seg reader__modes', role: 'group', 'aria-label': '點讀範圍' });
  MODES.forEach((m) => {
    const btn = h(
      'button',
      {
        class: `seg__btn${m.key === mode ? ' seg__btn--on' : ''}`,
        type: 'button',
        'aria-pressed': m.key === mode ? 'true' : 'false',
      },
      m.label,
    );
    btn.addEventListener('click', () => {
      mode = m.key;
      clearHighlight();
      [...modeGroup.children].forEach((other) => {
        const on = other === btn;
        other.classList.toggle('seg__btn--on', on);
        other.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      hint.textContent = m.hint;
    });
    modeGroup.appendChild(btn);
  });

  // 注音開關：CF 指定——朗讀要能選擇顯示或不顯示注音。
  // 已經能讀的學生看注音反而受干擾；還在解碼階段的學生需要注音當鷹架。
  const zhuyinToggle = h(
    'button',
    { class: 'btn btn--ghost reader__zhuyin-toggle', type: 'button', 'aria-pressed': 'true' },
    '注音：顯示',
  );
  zhuyinToggle.addEventListener('click', () => {
    showZhuyin = !showZhuyin;
    textBox.classList.toggle('reader__text--no-zhuyin', !showZhuyin);
    zhuyinToggle.textContent = showZhuyin ? '注音：顯示' : '注音：隱藏';
    zhuyinToggle.setAttribute('aria-pressed', showZhuyin ? 'true' : 'false');
  });

  const readAll = h('button', { class: 'btn btn--primary reader__read-all', type: 'button' }, '念全文');
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  function stopAll() {
    playingAll = false;
    cancelSpeaking();
    clearHighlight();
    readAll.textContent = '念全文';
    readAll.classList.remove('btn--stop');
  }

  readAll.addEventListener('click', async () => {
    if (playingAll) {
      stopAll();
      return;
    }
    playingAll = true;
    readAll.textContent = '停止';
    readAll.classList.add('btn--stop');
    for (const unit of units.sent) {
      if (!playingAll) break;
      unit.els[0]?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'center',
      });
      // eslint-disable-next-line no-await-in-loop
      await play(unit);
    }
    if (playingAll) stopAll();
  });

  const card = h('div', { class: 'card reader' }, [
    h('div', { class: 'reader__bar' }, [
      modeGroup,
      zhuyinToggle,
      speechSupported() ? readAll : null,
    ].filter(Boolean)),
    hint,
    h('h1', { class: 'reader__title' }, `第 ${lesson.lesson_no} 課　${lesson.title}`),
    textBox,
    h('a', { class: 'btn btn--ghost reader__back', href: `#/lesson/${lesson.lesson_id}` }, '← 回到本課'),
  ]);

  // 離開這一頁時別讓語音繼續念。
  window.addEventListener('hashchange', stopAll, { once: true });

  return card;
}
