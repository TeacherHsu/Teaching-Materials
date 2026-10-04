// 朗讀挑戰：#/lesson/<lesson_id>/recite
//
// 一句一句（挑戰層一段一段）念出來，用瀏覽器內建的語音辨識比對課文，
// 標出念錯和漏掉的字。
//
// 評分判準見 utils/readingScore.js：**不比聲調、同音字算對**。
// 重點是「說得夠清楚讓機器抓得到」，不是「發音標準」——構音異常與聲調不穩
// 在這群學生很常見，拿那個扣分只會讓他們不敢開口。
//
// 難易度由教師設定控制（CF 指定）：
//   支持／標準層：一次一句，可以先聽範讀。
//   挑戰層：一次一整段，沒有範讀。
//
// 流暢度**不給百分制分數**，只和自己的上一次比——給分數會讓學生把「念快」
// 當目標，對口吃、構音異常、閱讀困難的學生是有害的誘因。
import { h, clear } from '../utils/dom.js';
import { STATUS_ICONS } from '../components/icons.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { ZhuyinText } from '../components/ZhuyinText.js';
import { volumeLabel } from '../utils/volumeLabel.js';
import { getScaffoldLevel, reciteZhuyinOn } from '../utils/deviceSettings.js';
import { speak, cancelSpeaking, speechSupported } from '../utils/speech.js';
import { cryptoAvailable, getReading, isUnlocked, unlockWithPassword } from '../utils/classroomKey.js';
import { splitSentences, groupByUnit } from '../utils/readingUnits.js';
import {
  ensureCharReadings, scorableChars, scoreReading, fluency, compareFluency, accuracyStars,
} from '../utils/readingScore.js';
import { saveRecite, bestRecite } from '../utils/reciteRecords.js';
import { starsMarkup } from '../utils/scoring.js';

function recognitionSupported() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// 學生看得懂的圖例（CF 2026-10-04：紅色不知道代表什麼）：
// 每一項都放一個和課文同樣標示的「字」當樣本，再用白話說明可以怎麼做。
const LEGEND_TEXT = {
  wrong: '紅底的字：念得不一樣。點一下那個字，聽聽看怎麼念。',
  missed: '黃底的字：漏掉了，沒有念到。點一下聽聽看。',
};
function MarkLegend(counts) {
  const keys = ['wrong', 'missed'].filter((k) => counts[k]);
  if (!keys.length) return null;
  const sayAll = keys.map((k) => LEGEND_TEXT[k]).join('');
  return h('div', { class: 'recite-legend' }, [
    h('div', { class: 'quiz-option-row' }, [
      h('p', { class: 'recite-legend__title' }, '標示是什麼意思？'),
      SpeakButton({ text: sayAll, label: '聽', variant: 'speak-button--option' }),
    ]),
    h('ul', { class: 'recite-legend__list' }, keys.map((k) => h('li', { class: 'recite-legend__item' }, [
      h('span', { class: `lesson-text__ch lesson-text__ch--${k} recite-legend__sample`, 'aria-hidden': 'true' }, '字'),
      h('span', {}, `${LEGEND_TEXT[k]}（${counts[k]} 個）`),
    ]))),
  ]);
}

const MARK_LABEL = {
  ok: '念對了',
  homophone: '念對了（辨識成同音字）',
  wrong: '念錯了',
  missed: '沒有念到',
};

export function RecitePage(lesson) {
  const lessonId = lesson.lesson_id;
  const root = h('div', { class: 'container' });
  root.appendChild(
    h('p', { class: 'breadcrumb' }, [
      h('a', { href: '#/' }, '首頁'),
      h('a', { href: `#/grade/${lesson.volume.grade}` }, volumeLabel(lesson.volume)),
      h('a', { href: `#/lesson/${lessonId}` }, `第 ${lesson.lesson_no} 課`),
      h('span', { class: 'breadcrumb__current' }, '朗讀挑戰'),
    ]),
  );
  const body = h('div', {});
  root.appendChild(body);
  const backHref = `#/lesson/${lessonId}`;

  function render() {
    clear(body);
    if (!isUnlocked()) {
      body.appendChild(gate(render));
      return;
    }
    const reading = getReading(lessonId);
    if (!reading) {
      body.appendChild(notice('這一課還沒有課文可以朗讀。', backHref));
      return;
    }
    if (!recognitionSupported()) {
      body.appendChild(notice(
        '這台裝置不能用語音辨識，請改用 iPad 的 Safari 或電腦的 Chrome 開啟。',
        backHref,
      ));
      return;
    }
    ensureCharReadings().catch(() => { /* 查不到讀音就退回同字比對，不擋操作 */ });
    body.appendChild(renderChallenge(lesson, reading, backHref));
  }

  render();
  return root;
}

function notice(text, backHref) {
  return h('div', { class: 'card card--centered' }, [
    h('p', { class: 'outcome__note' }, text),
    h('a', { class: 'btn btn--primary', href: backHref }, '回到本課'),
  ]);
}

// 教室密碼門（和課文點讀同一道）
function gate(onUnlocked) {
  const input = h('input', {
    class: 'gate__input', type: 'password', autocomplete: 'off',
    autocapitalize: 'off', spellcheck: 'false', inputmode: 'numeric', 'aria-label': '教室密碼',
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
    busy = true; submit.disabled = true; message.textContent = '開門中……';
    try {
      await unlockWithPassword(password);
      onUnlocked();
    } catch {
      busy = false; submit.disabled = false; input.value = '';
      message.textContent = '密碼不對，再試一次。';
      input.classList.remove('gate__input--shake');
      void input.offsetWidth;
      input.classList.add('gate__input--shake');
      input.focus();
    }
  }
  submit.addEventListener('click', tryUnlock);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryUnlock(); });
  setTimeout(() => input.focus(), 50);
  return h('div', { class: 'card card--centered' }, [
    h('p', { class: 'gate__icon', 'aria-hidden': 'true', html: STATUS_ICONS.lock }),
    h('h1', { class: 'gate__title' }, '請輸入教室密碼'),
    h('p', { class: 'gate__note' }, '課文只給班上同學使用。輸入一次之後，這台載具會記住。'),
    input, message, submit,
  ]);
}

function renderChallenge(lesson, reading, backHref) {
  const lessonId = lesson.lesson_id;
  const scaffold = getScaffoldLevel();
  const sentences = splitSentences(reading.paras);
  const units = groupByUnit(sentences, scaffold.reciteUnit);

  const wrap = h('div', {});
  let index = 0;
  // 注音由教師頁細項決定，學生端不能切換（CF 2026-10-04）
  const showZhuyin = reciteZhuyinOn(lesson.volume?.grade ?? Number(String(lessonId).charAt(5)));
  let recognition = null;
  let startedAt = 0;

  const unitWord = scaffold.reciteUnit === 'paragraph' ? '段' : '句';
  // 支持層切到逗號，說「句」容易讓學生以為要念到句號；用「小段」比較不會誤會。
  const unitLabel = scaffold.reciteUnit === 'clause' ? '小段' : unitWord;

  function stopRecognition() {
    if (recognition) {
      try { recognition.abort(); } catch { /* 已經停了 */ }
      recognition = null;
    }
  }

  // 句／段的挑選列。每一格顯示編號與目前最高分，點了就跳過去。
  function renderPicker() {
    const list = h('div', {
      class: 'recite-picker',
      role: 'tablist',
      'aria-label': `選擇要念的${unitLabel}`,
    });
    units.forEach((unit, i) => {
      const best = bestRecite(lessonId, i);
      const current = i === index;
      const tone = best ? (best.accuracy >= 90 ? 'good' : best.accuracy >= 60 ? 'fair' : 'poor') : 'none';
      const label = `第 ${i + 1} ${unitLabel}`
        + (best ? `，最高 ${best.accuracy} 分` : '，還沒念過')
        + `：${unit.text.slice(0, 12)}`;
      const btn = h('button', {
        class: `recite-picker__item recite-picker__item--${tone}${current ? ' recite-picker__item--current' : ''}`,
        type: 'button',
        role: 'tab',
        'aria-selected': String(current),
        'aria-label': label,
        title: unit.text,
      }, [
        h('span', { class: 'recite-picker__no' }, String(i + 1)),
        best
          ? h('span', { class: 'recite-picker__score' }, String(best.accuracy))
          : h('span', { class: 'recite-picker__score recite-picker__score--empty', 'aria-hidden': 'true' }, '·'),
      ]);
      btn.addEventListener('click', () => {
        if (i === index) return;
        index = i;
        renderUnit();
      });
      list.appendChild(btn);
    });
    return list;
  }

  function renderUnit() {
    stopRecognition();
    cancelSpeaking();
    clear(wrap);

    const unit = units[index];
    const expected = scorableChars(unit.tokens);
    const best = bestRecite(lessonId, index);

    wrap.appendChild(TaskBanner({
      label: `把這一${unitLabel}念出來。`,
      step: `第 ${index + 1}／${units.length} ${unitLabel}`,
    }));

    // 隨點隨選：不必照順序念完才能跳下一句。學生可能只想練某一句，
    // 教師也可能指定某一段；強迫循序只會讓人卡住。
    wrap.appendChild(renderPicker());

    // 課文（可切注音）
    const textBox = h('div', { class: `lesson-text${showZhuyin ? '' : ' lesson-text--no-zhuyin'}` });
    const charEls = [];
    for (const [text, zhuyinText] of unit.tokens) {
      const zs = zhuyinText ? zhuyinText.split(' ') : [];
      [...text].forEach((ch, i) => {
        const zhuyin = zs[i] || '';
        const el = h('span', { class: zhuyin ? 'lesson-text__ch' : 'lesson-text__ch lesson-text__ch--punct' });
        el.dataset.ch = ch;
        el.appendChild(ZhuyinText(ch, zhuyin));
        if (zhuyin) charEls.push(el);
        textBox.appendChild(el);
      });
    }

    const tools = [];
    if (scaffold.reciteModel && speechSupported()) {
      const model = h('button', { class: 'btn', type: 'button' }, '先聽一次');
      model.addEventListener('click', () => speak(unit.say || unit.text));
      tools.push(model);
    }

    wrap.appendChild(h('div', { class: 'card' }, [
      tools.length ? h('div', { class: 'lesson-toolbar' }, tools) : null,
      textBox,
    ].filter(Boolean)));

    const status = h('p', { class: 'recite__status', role: 'status', 'aria-live': 'polite' }, '');
    const result = h('div', {});
    const micBtn = h('button', { class: 'btn btn--primary recite__mic', type: 'button' }, '開始念');

    micBtn.addEventListener('click', () => {
      if (recognition) { stopRecognition(); return; }
      cancelSpeaking();
      clear(result);
      charEls.forEach((el) => {
        el.classList.remove('lesson-text__ch--ok', 'lesson-text__ch--homophone', 'lesson-text__ch--wrong', 'lesson-text__ch--missed');
        // 重念時把上一次「可點來聽」也清掉
        ['role', 'tabindex', 'aria-label'].forEach((n) => el.removeAttribute(n));
        el.onclick = null; el.onkeydown = null;
      });
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new Recognition();
      recognition.lang = 'zh-TW';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      startedAt = Date.now();
      micBtn.textContent = '正在聽……（再按一次結束）';
      micBtn.classList.add('recite__mic--on');
      status.textContent = '慢慢念，念完再按一次。';
      recognition.onresult = (event) => {
        const heard = event.results?.[0]?.[0]?.transcript || '';
        finish(heard);
      };
      recognition.onerror = (event) => {
        finish('', event.error === 'no-speech' ? '沒有聽到聲音，再試一次。' : '聽不清楚，再試一次。');
      };
      recognition.onend = () => {
        recognition = null;
        micBtn.textContent = '再念一次';
        micBtn.classList.remove('recite__mic--on');
      };
      try { recognition.start(); } catch {
        recognition = null;
        status.textContent = '這台裝置不能用麥克風，請檢查權限。';
      }
    });

    function finish(heard, errorText) {
      const elapsed = Date.now() - startedAt;
      stopRecognition();
      if (errorText) { status.textContent = errorText; return; }
      const score = scoreReading(expected, heard);
      const speed = fluency(score.total, elapsed);

      // 上色
      // 念錯、漏掉的字可以點：念給學生聽，讓標示變成「下一步可以做什麼」
      score.marks.forEach((mark, i) => {
        const el = charEls[i];
        if (!el) return;
        // 同音字算念對、不標示（CF 2026-10-04：避免增加負擔）
        if (mark === 'homophone' || mark === 'ok') return;
        el.classList.add(`lesson-text__ch--${mark}`);
        if (mark === 'wrong' || mark === 'missed') {
          const ch = el.dataset.ch;
          el.setAttribute('role', 'button');
          el.setAttribute('tabindex', '0');
          el.setAttribute('aria-label', `${ch}，${MARK_LABEL[mark]}，點一下聽怎麼念`);
          const hear = () => { speak(ch); status.textContent = `「${ch}」這樣念，跟著念一次。`; };
          el.onclick = hear;
          el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault?.(); hear(); } };
        }
      });

      const previous = best ? best.charsPerMinute : null;
      saveRecite(lessonId, index, {
        accuracy: score.accuracy,
        charsPerMinute: speed.charsPerMinute,
        total: score.total,
      });

      status.textContent = score.marks.some((m) => m === 'wrong' || m === 'missed')
        ? '有標記的字再練習一下，點一下那個字可以聽怎麼念。' : '';
      clear(result);
      result.appendChild(renderResult(score, speed, previous, unitLabel));

      const actions = h('div', { class: 'quiz-option-row' }, []);
      if (index < units.length - 1) {
        const next = h('button', { class: 'btn btn--primary', type: 'button' }, `下一${unitLabel}`);
        next.addEventListener('click', () => { index += 1; renderUnit(); });
        actions.appendChild(next);
      }
      actions.appendChild(h('a', {
        class: index < units.length - 1 ? 'btn' : 'btn btn--primary',
        href: backHref,
      }, index < units.length - 1 ? '回到本課' : '念完了，回到本課'));
      result.appendChild(actions);
      // 念完一次要更新挑選列上的分數
      const picker = wrap.querySelector('.recite-picker');
      if (picker) picker.replaceWith(renderPicker());
    }

    wrap.appendChild(h('div', { class: 'quiz-option-row recite__actions' }, [
      micBtn,
      h('a', { class: 'btn', href: backHref }, '回到本課'),
    ]));
    wrap.appendChild(status);
    wrap.appendChild(result);

    if (best) {
      wrap.appendChild(h('p', { class: 'meta' },
        `這一${unitLabel}之前最高 ${best.accuracy} 分`
        + (best.charsPerMinute ? `，每分鐘 ${best.charsPerMinute} 個字。` : '。')));
    }
  }

  // 換頁時停掉辨識與朗讀
  window.addEventListener('hashchange', () => { stopRecognition(); cancelSpeaking(); }, { once: true });

  renderUnit();
  return wrap;
}

function renderResult(score, speed, previous, unitLabel) {
  const counts = score.marks.reduce((acc, mark) => {
    acc[mark] = (acc[mark] || 0) + 1;
    return acc;
  }, {});
  const ok = (counts.ok || 0) + (counts.homophone || 0);

  // 一定要有文字摘要：顏色不是唯一的線索（色覺與螢幕閱讀器）。
  const parts = [`這一${unitWord} ${score.total} 個字，念對 ${ok} 個`];
  if (counts.wrong) parts.push(`念錯 ${counts.wrong} 個`);
  if (counts.missed) parts.push(`漏掉 ${counts.missed} 個`);
  const summary = `${parts.join('、')}。`;

  const trend = compareFluency(speed.charsPerMinute, previous);
  const trendText = {
    faster: '比上次快一些。',
    slower: '比上次慢一些，念清楚比念快重要。',
    similar: '和上次差不多。',
    first: '',
  }[trend];

  return h('div', { class: 'card card--centered' }, [
    h('div', { class: 'quiz-option-row' }, [
      h('p', { class: 'outcome__score' }, `${score.accuracy} 分`),
      h('span', { html: starsMarkup({ earned: accuracyStars(score.accuracy), max: 3, size: 'sm' }) }),
      SpeakButton({ text: `${summary}${trendText}`, label: '聽', variant: 'speak-button--option' }),
    ]),
    h('p', { class: 'outcome__summary' }, summary),
    MarkLegend(counts),
    speed.charsPerMinute
      ? h('p', { class: 'meta' }, `每分鐘 ${speed.charsPerMinute} 個字。${trendText}`)
      : null,
  ].filter(Boolean));
}
