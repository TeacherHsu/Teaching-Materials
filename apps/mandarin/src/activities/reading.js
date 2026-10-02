// 「讀懂課文」模組：先看課文地圖（全篇分成哪幾個部分），再排序全篇，最後進入閱讀理解提問。
//
// 課文地圖是「前導組織」：讀之前先看到全篇的骨架，學生才知道每一段放在哪裡、
// 回答問題時要回哪一塊找（第 2 層提示說的「找『經過』那一塊」就是指這裡）。
// 參考站同樣把它放在讀懂課文的第一步，而不是獨立選單（CF 2026-10-03）。
import { h, clear } from '../utils/dom.js';
import { SentenceOrdering } from '../components/SentenceOrdering.js';
import { ReadingQuestions } from '../components/ReadingQuestions.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus, isPreview } from '../utils/preview.js';
import { chunkRounds } from '../utils/chunk.js';
import { CardWalkthrough } from '../components/CardWalkthrough.js';
import { speak } from '../utils/speech.js';
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { MatchingGame } from '../components/MatchingGame.js';
import { resolveSpots } from '../components/EvidencePanel.js';
import { shuffle } from '../utils/shuffle.js';
import { getScaffoldLevel } from '../utils/deviceSettings.js';

const CN_NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
function cnNumber(n) {
  if (n <= 10) return CN_NUM[n];
  if (n < 20) return `十${CN_NUM[n - 10]}`;
  return `${CN_NUM[Math.floor(n / 10)]}十${CN_NUM[n % 10]}`;
}

/**
 * 段落大意 → 課文地圖的格子。
 * 有結構區塊（起因、經過、結果……）就把同一塊的大意合成一格；沒有就一段一格。
 * 段號只在資料有的時候才顯示（二上的大意對應結構表節點，不是自然段，沒有段號）。
 */
export function buildTextMap(paragraphs) {
  const nodes = [];
  for (const p of paragraphs) {
    const label = p.structure_block || '';
    const last = nodes[nodes.length - 1];
    const from = p.paragraph_span ? p.paragraph_span[0] : p.paragraph_no;
    const to = p.paragraph_span ? p.paragraph_span[1] : p.paragraph_no;
    if (label && last && last.label === label && last.section === (p.section || '')) {
      last.gists.push(p.summary);
      if (Number.isFinite(to)) last.to = to;
      continue;
    }
    nodes.push({ label, focus: p.structure_focus || '', section: p.section || '', from, to, gists: [p.summary] });
  }
  return nodes.map((node) => ({
    ...node,
    range: Number.isFinite(node.from)
      ? (node.from === node.to ? `第${cnNumber(node.from)}段` : `第${cnNumber(node.from)}～${cnNumber(node.to)}段`)
      : '',
  }));
}

function TextMapCard(node) {
  return h('div', { class: 'text-map__node' }, [
    h('div', { class: 'text-map__head' }, [
      node.section && node.section !== node.label ? h('span', { class: 'text-map__section' }, node.section) : null,
      node.label ? h('span', { class: 'text-map__label' }, node.label) : null,
      node.focus ? h('span', { class: 'text-map__focus' }, node.focus) : null,
      node.range ? h('span', { class: 'text-map__range' }, node.range) : null,
    ].filter(Boolean)),
    h('p', { class: 'text-map__gist' }, node.gists.join('')),
  ]);
}

// ── 依文體的第三步（參考站：故事排順序、說明文分類、詩句解碼） ─────────
// 故事有先後，排順序有意義；說明文的段落常常是並列的（101、晴空塔、雙峰塔
// 先介紹哪一棟都可以），排順序沒有唯一答案，改成「這個細節屬於哪一部分」；
// 詩的難處在「詩句在說什麼」，改成詩句配白話意思。

/** 說明文分類題：細節 → 屬於哪一類。細節是改寫過的短句，公開也沒問題。 */
export function buildClassifyItems(activity, shuffleImpl = shuffle) {
  const categories = activity?.categories || [];
  return (activity?.items || [])
    .filter((it) => it.text && categories.includes(it.answer))
    .map((it, i) => ({
      id: `classify:${i}:${it.text}`,
      stem: `「${it.text}」屬於哪一個？`,
      options: shuffleImpl([...categories]),
      answer: it.answer,
      explanation: `「${it.text}」屬於「${it.answer}」。`,
      hints: [activity.hint || '想一想，課文是在介紹哪一個的時候提到這件事？'],
    }));
}

/**
 * 詩句解碼：詩句從課文密文取原文（要教室密碼，和證據面板同一套），
 * 白話意思是改寫過的。沒解鎖就回空陣列，這一步不出現。
 */
export function buildDecodePairs(lessonId, activity, resolve = resolveSpots) {
  const pairs = [];
  for (const pair of activity?.pairs || []) {
    // 一句一句取，現代詩的詩行之間沒有標點，直接接起來會變成
    // 「風揚起池水的漣漪我遇見皺巴巴的自己」，要留空才讀得出是兩行。
    const lines = (pair.line?.sentences || []).map((i) => resolve(lessonId, [{ ...pair.line, sentences: [i] }]));
    if (!lines.length || lines.some((l) => !l) || !pair.meaning) return [];   // 少一句就整組不出
    const text = lines.reduce((acc, l) => (acc && !/[，。、；！？：」]$/u.test(acc) ? `${acc}　${l}` : acc + l), '');
    pairs.push({ left: text.replace(/[，。、；！？]+$/u, ''), right: pair.meaning });
  }
  return pairs;
}

/**
 * 一段一段讀（參考站讀懂課文的第 2 步）：顯示這一段的課文原文，選出它在說什麼。
 * 原文從密文取（要教室密碼，CF：原文對照放在密碼後面、不另外改寫）；
 * 正解是這一段的大意，誘答是其他段的大意——學生要真的讀這一段才分得出來。
 * 沒解鎖、或某段取不到原文，就整步不出現。
 */
export function buildParagraphItems(lessonId, paragraphs, optionCount = 3, resolve = resolveSpots, shuffleImpl = shuffle) {
  const usable = paragraphs.filter((p) => Array.isArray(p.text_spots) && p.text_spots.length);
  if (usable.length < 2 || usable.length !== paragraphs.length) return [];
  const items = [];
  for (const [i, p] of usable.entries()) {
    const text = resolve(lessonId, p.text_spots);
    if (!text) return [];
    const others = usable.filter((o) => o !== p);
    // 誘答優先挑相鄰的段：內容最接近，最需要真的讀過才分得出來
    const near = others.sort((a, b) => Math.abs(usable.indexOf(a) - i) - Math.abs(usable.indexOf(b) - i));
    const distractors = near.slice(0, Math.max(1, optionCount - 1)).map((o) => o.summary);
    const range = p.paragraph_span
      ? `第 ${p.paragraph_span[0]}～${p.paragraph_span[1]} 段`
      : (Number.isFinite(p.paragraph_no) ? `第 ${p.paragraph_no} 段` : `第 ${i + 1} 部分`);
    const label = `${p.section ? `〈${p.section}〉` : ''}${range}`;
    items.push({
      id: `paragraph-read:${lessonId}:${i}`,
      noReview: true,
      stem: '這一段在說什麼？',
      readAllStem: `${text}　這一段在說什麼？`,
      stemContent: h('div', { class: 'para-read' }, [
        h('p', { class: 'para-read__label' }, label),
        h('div', { class: 'para-read__text' }, text),
        h('p', { class: 'quiz-stem' }, '這一段在說什麼？'),
      ]),
      options: shuffleImpl([p.summary, ...distractors]),
      answer: p.summary,
      explanation: `這一段在說：${p.summary}`,
      hints: ['先找這一段在講誰、做了什麼，再看哪個選項說的是同一件事。'],
    });
  }
  return items;
}

/**
 * @param {object} lesson
 * @param {() => void} onBack
 */
// 單課小考用：只出題、不畫面。和下面的 build*Activity 共用同一份出題邏輯，
// 題目才不會兩邊長得不一樣。
// 只收「有選項且答案在選項裡」的閱讀理解題；開放問答進不了小考。
export function buildReadingQuizItems(lesson) {
  return filterByStatus(lesson.reading_questions || []).filter(
    (q) => q.stem && Array.isArray(q.options) && q.options.length >= 2
      && typeof q.answer === 'string' && q.options.includes(q.answer),
  );
}

export function buildReadingActivity(lesson, onBack) {
  const paragraphs = filterByStatus(lesson.paragraph_summary || []).filter((p) => p.summary);
  const questions = filterByStatus(lesson.reading_questions || []).filter((q) => q.stem);
  const questionRounds = chunkRounds(questions);

  const activity = filterByStatus(lesson.genre_activity ? [lesson.genre_activity] : [])[0] || null;
  const classifyItems = activity?.type === 'classify' ? buildClassifyItems(activity) : [];
  const decodePairs = activity?.type === 'decode' ? buildDecodePairs(lesson.lesson_id, activity) : [];

  const paragraphItems = buildParagraphItems(lesson.lesson_id, paragraphs, Math.max(2, getScaffoldLevel().optionCount));

  const steps = [];
  if (paragraphs.length >= 3) {
    // 有課文地圖就不再做「兩段比較」暖身：學生剛看過全篇骨架，
    // 直接排全篇就是一次回想練習。
    steps.push('map');
  }
  // 一段一段讀：要解鎖課文才出現（原文在密碼後面）
  if (paragraphItems.length >= 2) steps.push('paragraphs');
  // 第三步依文體：說明文分類、詩句解碼；都沒有就排順序（故事最適合）
  if (classifyItems.length >= 3) steps.push('classify');
  else if (decodePairs.length >= 2) steps.push('decode');
  else if (paragraphs.length >= 3) steps.push('order');
  if (questionRounds.length >= 1) steps.push('questions');

  const container = h('div', {});
  let stepIndex = 0;
  let roundIndex = 0;

  function renderStep() {
    clear(container);
    if (steps.length === 0) {
      container.appendChild(missingContentNotice('讀懂課文：教材審核中（段落大意／提問尚未核准）'));
      return;
    }
    const step = steps[stepIndex];
    const isLast = stepIndex === steps.length - 1;
    const stepLabel = `第 ${stepIndex + 1} 步／共 ${steps.length} 步`;

    if (step === 'map') {
      container.appendChild(TaskBanner({ label: '看課文地圖：這一課分成幾個部分？點每一格聽一聽', step: stepLabel }));
      if (isPreview() && paragraphs.some((p) => p.status === 'draft')) {
        container.appendChild(h('p', { class: 'meta' }, '「待審」標籤只在預覽模式顯示，正式上線只會出現教師核准過的內容。'));
      }
      const nodes = buildTextMap(paragraphs);
      const next = h('button', { class: 'btn btn--primary', type: 'button', disabled: true, 'aria-disabled': 'true' },
        '每一格都點過才能繼續');
      const walkthrough = CardWalkthrough({
        cards: nodes.map((node, i) => {
          const el = TextMapCard(node);
          el.addEventListener('click', () => speak([node.label, node.range, node.gists.join('')].filter(Boolean).join('，')));
          return { el, key: `map:${i}` };
        }),
        label: '點一下每一格，會念給你聽',
        onAllSeen: () => {
          next.disabled = false;
          next.removeAttribute('aria-disabled');
          next.textContent = isLast ? '回課程首頁' : '我看懂了，繼續';
        },
      });
      walkthrough.grid.classList.add('text-map');
      next.addEventListener('click', () => {
        if (next.disabled) return;
        if (isLast) { onBack(); return; }
        stepIndex += 1;
        renderStep();
      });
      container.appendChild(walkthrough.status);
      container.appendChild(walkthrough.grid);
      container.appendChild(h('div', { class: 'quiz-option-row' }, [next]));
    } else if (step === 'paragraphs') {
      container.appendChild(TaskBanner({ label: '一段一段讀：讀完這一段，選出它在說什麼', step: stepLabel }));
      if (isPreview() && paragraphs.some((p) => p.status === 'draft')) {
        container.appendChild(h('p', { class: 'meta' }, '「待審」標籤只在預覽模式顯示，正式上線只會出現教師核准過的內容。'));
      }
      container.appendChild(ChoiceQuiz({
        items: paragraphItems,
        backLabel: isLast ? '回課程首頁' : '本課先完成',
        onBack,
        onContinue: isLast ? null : () => { stepIndex += 1; renderStep(); },
        continueLabel: '繼續',
      }));
    } else if (step === 'classify') {
      container.appendChild(TaskBanner({ label: '說明文分類：這件事屬於哪一個？', step: stepLabel }));
      if (isPreview() && activity.status === 'draft') {
        container.appendChild(h('p', { class: 'meta' }, '「待審」題目只在預覽模式顯示，正式上線只會出現教師核准過的內容。'));
      }
      container.appendChild(ChoiceQuiz({
        items: classifyItems,
        backLabel: isLast ? '回課程首頁' : '本課先完成',
        onBack,
        onContinue: isLast ? null : () => { stepIndex += 1; renderStep(); },
        continueLabel: '繼續：讀題找線索',
      }));
    } else if (step === 'decode') {
      container.appendChild(TaskBanner({ label: '詩句解碼：每一句詩在說什麼？', step: stepLabel }));
      if (isPreview() && activity.status === 'draft') {
        container.appendChild(h('p', { class: 'meta' }, '「待審」題目只在預覽模式顯示，正式上線只會出現教師核准過的內容。'));
      }
      container.appendChild(MatchingGame({
        pairs: decodePairs,
        instructions: '先選左邊的詩句，再選右邊它的意思。',
        backLabel: isLast ? '回課程首頁' : '本課先完成',
        onBack,
        onContinue: isLast ? null : () => { stepIndex += 1; renderStep(); },
        continueLabel: '繼續：讀題找線索',
      }));
    } else if (step === 'warmup') {
      // 段落大意一律照資料順序，不用段號排：欄位其實叫 paragraph_no（原本寫 para_no，
      // 比較結果是 NaN，排序從來沒生效過），而六上 L05 有兩個子篇、段號各自從 1 起算，
      // 用段號排會把「觀樹」和「種樹」交錯打亂。資料順序就是課文順序。
      const sorted = [...paragraphs].slice(0, 2);
      container.appendChild(TaskBanner({ label: '先比較兩段，找出內容先後的線索', step: stepLabel }));
      container.appendChild(h('p', { class: 'reading-warmup__instruction' }, '先比較兩段，找出內容先後或因果的線索。'));
      container.appendChild(SentenceOrdering({
        prompt: '把這兩段大意排回課文順序。',
        parts: sorted.map((p) => p.summary),
        solution: sorted.map((p) => p.summary),
        backLabel: '繼續：全篇排序',
        onBack: () => {
          stepIndex += 1;
          renderStep();
        },
      }));
    } else if (step === 'order') {
      container.appendChild(TaskBanner({
        // 「照課文的順序」而不是「照發生的先後」：倒敘的課文（四上 L03 第一段就是
        // 最後比賽投進的畫面）兩者正好相反，正解是課文順序。
        label: lesson.genre === 'narrative' ? '故事排順序：照課文的順序排好' : '把段落大意排回課文順序',
        step: stepLabel,
      }));
      if (isPreview() && paragraphs.some((p) => p.status === 'draft')) {
        container.appendChild(h('p', { class: 'meta' }, '「待審」標籤只在預覽模式顯示，正式上線只會出現教師核准過的內容。'));
      }
      const sorted = [...paragraphs];
      container.appendChild(
        SentenceOrdering({
          prompt: '課文有好幾段，請把下面的段落大意排回正確的順序。',
          parts: sorted.map((p) => p.summary),
          solution: sorted.map((p) => p.summary),
          // 不是最後一步時，按鈕會進到下一步；原本沒傳文字，顯示預設的「回課程首頁」，
          // 學生會以為做完了要離開。
          backLabel: isLast ? '回課程首頁' : '繼續：讀題找線索',
          onBack: () => {
            if (isLast) {
              onBack();
            } else {
              stepIndex += 1;
              renderStep();
            }
          },
        }),
      );
    } else if (step === 'questions') {
      const isLastRound = roundIndex === questionRounds.length - 1;
      container.appendChild(TaskBanner({
        label: roundIndex === 0 ? '讀題、找線索' : '加練挑戰：繼續讀題找線索',
        step: stepLabel,
      }));
      container.appendChild(
        ReadingQuestions({
          lessonId: lesson.lesson_id,
          items: questionRounds[roundIndex],
          backLabel: '本課先完成',
          onBack: () => onBack(),
          onContinue: isLastRound ? null : () => {
            roundIndex += 1;
            renderStep();
          },
        }),
      );
    }
  }

  renderStep();
  return container;
}
