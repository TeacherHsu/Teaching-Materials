// 「讀懂課文」模組：先比較兩段大意，再排序全篇，最後進入閱讀理解提問。
import { h, clear } from '../utils/dom.js';
import { SentenceOrdering } from '../components/SentenceOrdering.js';
import { ReadingQuestions } from '../components/ReadingQuestions.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus, isPreview } from '../utils/preview.js';
import { chunkRounds } from '../utils/chunk.js';

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
    steps.push('warmup');
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

    if (step === 'warmup') {
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
