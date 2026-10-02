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

  const steps = [];
  if (paragraphs.length >= 3) {
    // 有課文地圖就不再做「兩段比較」暖身：學生剛看過全篇骨架，
    // 直接排全篇就是一次回想練習。
    steps.push('map');
    steps.push('order');
  }
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
      container.appendChild(TaskBanner({ label: '把段落大意排回課文順序', step: stepLabel }));
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
