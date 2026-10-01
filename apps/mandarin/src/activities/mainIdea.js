// 「抓重點」：讀完各段大意後，判斷哪一句最能說出整課在講什麼。
//
// 目標是摘要策略——區分「主旨」與「細節」。這是可遷移的能力，換一篇文章
// 還能用。三個誘答各自對應學生真實會犯的錯：
//   partial  以偏概全：拿某一段的大意當成全課主旨（最常見）
//   vague    太空泛：套用任何課都成立，講了等於沒講
//   offtopic 偏離：與主題相關但不是本課內容
// 規格 docs/specs/2026-09-30-main-idea-module.md。
import { h, clear } from '../utils/dom.js';
import { shuffle as shuffled } from '../utils/shuffle.js';
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus, isPreview } from '../utils/preview.js';
import { getScaffoldLevel } from '../utils/deviceSettings.js';

function approvedMainIdea(lesson) {
  const mainIdea = lesson.main_idea;
  if (!mainIdea || !mainIdea.gist) return null;
  const usable = mainIdea.status === 'approved' || (isPreview() && mainIdea.status === 'draft');
  return usable ? mainIdea : null;
}

function approvedDistractors(mainIdea) {
  return (mainIdea.distractors || []).filter(
    (d) => d.text && (d.status === 'approved' || (isPreview() && d.status === 'draft')),
  );
}

export function readyParagraphSummaries(lesson) {
  return filterByStatus(lesson.paragraph_summary || []).filter((p) => p.summary);
}


/** 以偏概全的誘答直接取用該課段落大意，不另存文字，避免與段落內容不同步。 */
function partialDistractor(paragraphs) {
  const pool = paragraphs.filter((p) => p.summary && p.summary.length >= 10);
  return pool.length ? shuffled(pool)[0].summary : null;
}

export function canStartMainIdea(lesson) {
  const mainIdea = approvedMainIdea(lesson);
  if (!mainIdea) return false;
  const paragraphs = readyParagraphSummaries(lesson);
  if (paragraphs.length < 2) return false;
  // 正解以外至少還要兩個可用選項，題目才有鑑別度。
  const candidates = approvedDistractors(mainIdea).length + (partialDistractor(paragraphs) ? 1 : 0);
  return candidates >= 2;
}

function buildQuizItem(lesson, mainIdea, paragraphs) {
  const partial = partialDistractor(paragraphs);
  const distractors = approvedDistractors(mainIdea);
  // 「以偏概全」排最前面：它是最有教學意義的誘答，選項變少時要優先保留。
  const candidates = [
    ...(partial ? [partial] : []),
    ...distractors.map((d) => d.text),
  ];
  const wanted = Math.max(1, getScaffoldLevel().optionCount - 1);
  const options = [mainIdea.gist, ...candidates.slice(0, wanted)]
    .filter((text, index, all) => text && all.indexOf(text) === index);

  return {
    id: `main-idea:${lesson.lesson_id}`,
    stem: '哪一句最能說出整課在講什麼？',
    // ChoiceQuiz 每次重繪都會重新亂序，這裡再亂一次避免資料順序外洩正解位置。
    options: shuffled(options),
    answer: mainIdea.gist,
    hint: '先想想：這句話講到的是整課，還是只有其中一段？',
    // 解析講「為什麼其他選項不對」，而不是把正解再念一次——
    // 三種誘答正對應學生最常犯的三種錯，指出來才學得到分辨的方法。
    explanation: '這一句把整課從頭到尾都說到了。其他選項有的只講到其中一段，有的太籠統、換一課也講得通，有的根本不是這一課的內容。',
  };
}

/**
 * @param {object} lesson
 * @param {() => void} onBack
 */
export function buildMainIdeaActivity(lesson, onBack) {
  const container = h('div', {});
  const mainIdea = approvedMainIdea(lesson);
  const paragraphs = readyParagraphSummaries(lesson);

  if (!canStartMainIdea(lesson)) {
    container.appendChild(missingContentNotice('抓重點：教材準備中（課文大意或選項尚未核准）'));
    return container;
  }

  const showQuiz = () => {
    clear(container);
    container.appendChild(TaskBanner({ label: '哪一句最能說出整課在講什麼？', step: '第 2 步／共 2 步' }));
    container.appendChild(
      ChoiceQuiz({
        items: [buildQuizItem(lesson, mainIdea, paragraphs)],
        backLabel: '回課程首頁',
        onBack: () => onBack(),
      }),
    );
  };

  const showReading = () => {
    clear(container);
    const list = h('ol', { class: 'main-idea__summaries' }, paragraphs.map((p, i) => h(
      'li',
      { class: 'main-idea__summary' },
      [
        h('span', { class: 'main-idea__summary-no' }, `第 ${p.paragraph_no ?? p.para_no ?? i + 1} 段`),
        h('span', { class: 'main-idea__summary-text' }, p.summary),
        SpeakButton({ text: p.summary, label: '聽', variant: 'speak-button--option' }),
      ],
    )));
    container.appendChild(TaskBanner({ label: '先讀一遍每一段在說什麼', step: '第 1 步／共 2 步' }));
    container.appendChild(h('div', { class: 'main-idea__reading' }, [list]));
    container.appendChild(h('div', { class: 'quiz-option-row' }, [
      h('button', { class: 'btn btn--primary', type: 'button', onclick: showQuiz }, '繼續：開始抓重點'),
      h('button', { class: 'btn', type: 'button', onclick: () => onBack() }, '回課程首頁'),
    ]));
  };

  showReading();
  return container;
}
