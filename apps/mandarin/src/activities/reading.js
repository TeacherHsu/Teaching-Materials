// 「讀懂課文」模組：段落大意排序 → 閱讀理解提問，兩步驟依序呈現（一畫面一任務）。
import { h, clear } from '../utils/dom.js';
import { SentenceOrdering } from '../components/SentenceOrdering.js';
import { ReadingQuestions } from '../components/ReadingQuestions.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus, isPreview } from '../utils/preview.js';

/**
 * @param {object} lesson
 * @param {() => void} onBack
 */
export function buildReadingActivity(lesson, onBack) {
  const paragraphs = filterByStatus(lesson.paragraph_summary || []).filter((p) => p.summary);
  const questions = filterByStatus(lesson.reading_questions || []).filter((q) => q.stem);

  const steps = [];
  if (paragraphs.length >= 3) steps.push('order');
  if (questions.length >= 1) steps.push('questions');

  const container = h('div', {});
  let stepIndex = 0;

  function renderStep() {
    clear(container);
    if (steps.length === 0) {
      container.appendChild(missingContentNotice('讀懂課文：教材審核中（段落大意／提問尚未核准）'));
      return;
    }
    const step = steps[stepIndex];
    const isLast = stepIndex === steps.length - 1;
    const stepLabel = `第 ${stepIndex + 1} 步／共 ${steps.length} 步`;

    if (step === 'order') {
      container.appendChild(TaskBanner({ label: '把段落大意排回課文順序', step: stepLabel }));
      if (isPreview() && paragraphs.some((p) => p.status === 'draft')) {
        container.appendChild(h('p', { class: 'meta' }, '「待審」標籤只在預覽模式顯示，正式上線只會出現教師核准過的內容。'));
      }
      const sorted = [...paragraphs].sort((a, b) => a.para_no - b.para_no);
      container.appendChild(
        SentenceOrdering({
          prompt: '課文有好幾段，請把下面的段落大意排回正確的順序。',
          parts: sorted.map((p) => p.summary),
          solution: sorted.map((p) => p.summary),
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
      container.appendChild(TaskBanner({ label: '讀完課文，想一想這些問題', step: stepLabel }));
      container.appendChild(
        ReadingQuestions({
          items: questions,
          backLabel: '回課程首頁',
          onBack: () => onBack(),
        }),
      );
    }
  }

  renderStep();
  return container;
}
