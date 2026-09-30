// 「字的故事」子頁：字形結構、部件意象、字源小故事、字義、語詞與圖像。
//
// 做成子頁而不是塞進生字卡，是因為內容量大；而且**只有查得到可靠字源的字
// 才會出現入口按鈕**，沒有的字就少一顆按鈕，畫面不會留空殼（CF 指定）。
//
// 不做成一張大圖：圖片沒辦法朗讀、手機上字太小、改一個錯字要重畫整張，
// 也不利於放大與螢幕閱讀器。改用結構化資料＋網頁排版，每段都能朗讀。
import { h } from '../utils/dom.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { isPreview } from '../utils/preview.js';
import { volumeLabel } from '../utils/volumeLabel.js';

const ROLE_LABEL = { 義符: '表示意思', 聲符: '表示讀音', 象形: '照樣子畫', 指事: '用符號指出' };

/** 該字是否有可公開的字源（沒有就不該出現入口按鈕）。 */
export function hasApprovedEtymology(character) {
  const e = character && character.etymology;
  if (!e || !e.story) return false;
  return e.status === 'approved' || (isPreview() && e.status === 'draft');
}

/**
 * 是否要出現「字的故事」入口。
 * 字源與影片是兩種各自獨立的內容：有可查證來源的影片就值得連出去，
 * 不必等字源寫好；兩者都沒有就不放空殼按鈕（CF 指定）。
 */
export function hasCharacterStory(character) {
  return hasApprovedEtymology(character) || ((character && character.videos) || []).length > 0;
}

// 區塊編號依「實際呈現的區塊」依序給，不能寫死：
// 沒有語詞或沒有影片的字會少一區，寫死就會跳號（1、2、4）。
function makeSectionNumbering() {
  let n = 0;
  return (title, children) => {
    n += 1;
    return section(title, n, children);
  };
}

function section(title, index, children) {
  return h('section', { class: 'cs__section' }, [
    h('h2', { class: 'cs__section-title' }, [
      h('span', { class: 'cs__section-no', 'aria-hidden': 'true' }, String(index)),
      h('span', {}, title),
    ]),
    ...children,
  ]);
}

/**
 * @param {object} lesson
 * @param {string} char
 */
export function CharacterStoryPage(lesson, char) {
  const character = (lesson.characters || []).find((c) => c.char === char);
  const root = h('div', { class: 'container character-story' });

  root.appendChild(h('p', { class: 'breadcrumb' }, [
    h('a', { href: '#/' }, '首頁'),
    h('a', { href: `#/grade/${lesson.volume.grade}` }, volumeLabel(lesson.volume)),
    h('a', { href: `#/lesson/${lesson.lesson_id}` }, `第 ${lesson.lesson_no} 課`),
    h('a', { href: `#/lesson/${lesson.lesson_id}/module/characters` }, '認識生字'),
    h('span', { class: 'breadcrumb__current' }, `${char} 的故事`),
  ]));

  if (!character || !hasCharacterStory(character)) {
    root.appendChild(h('h1', {}, `${char} 的故事`));
    root.appendChild(h('p', { class: 'meta' }, '這個字目前沒有查得到可靠來源的字源說明或影片。'));
    root.appendChild(h('a', { class: 'btn', href: `#/lesson/${lesson.lesson_id}/module/characters` }, '回認識生字'));
    return root;
  }

  const nextSection = makeSectionNumbering();
  const e = character.etymology || {};
  const showEtymology = hasApprovedEtymology(character);

  root.appendChild(h('div', { class: 'cs__hero' }, [
    h('div', { class: 'cs__glyph', 'aria-label': `生字 ${char}` }, char),
    // 注音不另外列一行：大字用的是注音字型（BpmfIansui），字旁已經帶注音了，
    // 再列一次是重複資訊（CF 指出）。仍保留給螢幕閱讀器。
    h('div', { class: 'cs__hero-meta' }, [
      character.zhuyin ? h('p', { class: 'sr-only' }, `注音：${character.zhuyin}`) : null,
      h('p', { class: 'meta' }, `部首：${character.radical || '—'}　筆畫：${character.stroke_count ?? '—'}`),
      showEtymology && e.structure ? h('p', { class: 'cs__badge' }, e.structure) : null,
    ].filter(Boolean)),
  ]));

  // 1 部件意象
  if (showEtymology && (e.components || []).length) {
    root.appendChild(nextSection('這個字是怎麼組成的', [
      h('div', { class: 'cs__parts' }, e.components.map((c) => h('div', { class: `cs__part cs__part--${c.role === '聲符' ? 'sound' : 'meaning'}` }, [
        h('span', { class: 'cs__part-glyph' }, c.part),
        h('span', { class: 'cs__part-role' }, ROLE_LABEL[c.role] || c.role),
        c.note ? h('span', { class: 'cs__part-note' }, c.note) : null,
      ].filter(Boolean)))),
    ]));
  }

  // 2 字源小故事
  if (showEtymology) root.appendChild(nextSection('字源小故事', [
    h('div', { class: 'cs__story quiz-option-row' }, [
      h('p', { class: 'cs__story-text' }, e.story),
      SpeakButton({ text: e.story, label: '聽', variant: 'speak-button--option' }),
    ]),
    h('p', { class: 'cs__source' }, `出處：${e.source}`),
  ]));

  // 3 語詞與圖像（本課含這個字的語詞，資料本來就有）
  const words = (lesson.words || []).filter((w) => w.word && w.word.includes(char) && w.status === 'ready');
  if (words.length) {
    root.appendChild(nextSection('這個字會用在哪裡', [
      h('div', { class: 'cs__words' }, words.map((w) => h('figure', { class: 'cs__word' }, [
        w.image ? h('img', { class: 'cs__word-image', src: `.${w.image}`, alt: '', loading: 'lazy' }) : null,
        h('figcaption', {}, [
          h('span', { class: 'cs__word-text' }, w.word),
          w.meaning ? h('span', { class: 'cs__word-meaning' }, w.meaning) : null,
        ].filter(Boolean)),
        SpeakButton({ text: w.word, label: '聽', variant: 'speak-button--option' }),
      ].filter(Boolean)))),
    ]));
  }

  // 4 延伸影片（只有實際有資源時才出現）
  const videos = character.videos || [];
  if (videos.length) {
    root.appendChild(nextSection('想看更多', [
      h('ul', { class: 'cs__videos' }, videos.map((v) => h('li', {}, [
        h('a', { class: 'extension-link', href: v.url, target: '_blank', rel: 'noopener noreferrer' }, `${v.title}（另開新視窗）`),
        h('span', { class: 'meta' }, `來源：${v.source}`),
      ].filter(Boolean)))),
    ]));
  }

  root.appendChild(h('a', { class: 'btn', href: `#/lesson/${lesson.lesson_id}/module/characters`, style: 'margin-top:24px' }, '回認識生字'));
  return root;
}
