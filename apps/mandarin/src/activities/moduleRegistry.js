// 10 大項模組註冊表：狀態由資料＋是否已實作決定，不寫死於元件／頁面。
// 規格 docs/specs/2026-09-25-mandarin-dabutie-importer.md §4。
import { filterByStatus } from '../utils/preview.js';
import { isModuleComplete } from '../utils/storage.js';

const ROUND_MIN = 3;

function readyCharacters(lesson) {
  return (lesson.characters || []).filter((c) => c.status === 'ready' || !c.status);
}

function readyChoiceQuiz(lesson) {
  return (lesson.quiz || []).filter((q) => q.type === 'choice' && q.status === 'ready');
}

function distinctRadicals(characters) {
  return new Set(characters.map((c) => c.radical).filter(Boolean));
}

function readyWords(lesson) {
  return (lesson.words || []).filter((w) => w.status === 'ready' && w.word && w.meaning);
}

function usableIdioms(lesson) {
  return (lesson.idioms || []).filter((i) => i.related_char && i.idiom && i.idiom.includes(i.related_char));
}

function readyPatterns(lesson) {
  return filterByStatus(lesson.sentence_patterns || []).filter((p) => p.head && p.description);
}

function patternsWithApprovedExamples(lesson) {
  return filterByStatus(lesson.sentence_patterns || [], { statusKey: 'examples_status' }).filter(
    (p) => p.examples && p.examples.length > 0,
  );
}

function readyParagraphs(lesson) {
  return filterByStatus(lesson.paragraph_summary || []).filter((p) => p.summary);
}

function readyReadingQuestions(lesson) {
  return filterByStatus(lesson.reading_questions || []).filter((q) => q.stem);
}

/**
 * 10 大項模組，依 Dashboard 顯示順序排列。
 * implemented=false 的項目一律「即將推出」，不看資料。
 * reviewOnly 的項目（舊字新詞）狀態不是「可以開始／教材審核中」，而是
 * 「可以開始／第 2 課起開放」，因為它需要「前面課次」的資料才有內容。
 */
export const MODULE_REGISTRY = [
  {
    key: 'characters',
    label: '認識生字',
    implemented: true,
    ready(lesson) {
      const chars = readyCharacters(lesson);
      return chars.length >= ROUND_MIN && readyChoiceQuiz(lesson).length >= ROUND_MIN && distinctRadicals(chars).size >= 2;
    },
  },
  {
    key: 'vocabulary',
    label: '學會語詞',
    implemented: true,
    ready(lesson) {
      return readyWords(lesson).length >= ROUND_MIN;
    },
  },
  {
    key: 'idiom_builder',
    label: '生字變成語',
    implemented: true,
    ready(lesson) {
      return usableIdioms(lesson).length >= ROUND_MIN;
    },
  },
  {
    key: 'sentence_practice',
    label: '句型練習',
    implemented: true,
    ready(lesson) {
      return readyPatterns(lesson).length >= ROUND_MIN && patternsWithApprovedExamples(lesson).length >= 1;
    },
  },
  {
    key: 'reading',
    label: '讀懂課文',
    implemented: true,
    ready(lesson) {
      return readyParagraphs(lesson).length >= ROUND_MIN || readyReadingQuestions(lesson).length >= 1;
    },
  },
  { key: 'polysemy', label: '一字多義', implemented: false },
  { key: 'structure_map', label: '課文地圖', implemented: false },
  { key: 'listening', label: '聽聽看', implemented: false },
  { key: 'rhetoric', label: '修辭小偵探', implemented: false },
  {
    key: 'review',
    label: '舊字新詞',
    implemented: true,
    reviewOnly: true,
    ready(lesson) {
      const byLesson = (lesson.review_words && lesson.review_words.by_lesson) || {};
      return Object.keys(byLesson)
        .map(Number)
        .some((n) => n < lesson.lesson_no);
    },
  },
];

/**
 * @param {object} lesson
 * @param {object} entry MODULE_REGISTRY 的一筆
 * @returns {{code: 'done'|'available'|'pending_review'|'coming_soon'|'locked', text: string}}
 */
export function getModuleStatus(lesson, entry) {
  if (!entry.implemented) {
    return { code: 'coming_soon', text: '即將推出' };
  }
  if (entry.reviewOnly) {
    return entry.ready(lesson)
      ? { code: 'available', text: '可以開始' }
      : { code: 'locked', text: '第 2 課起開放' };
  }
  if (isModuleComplete(lesson.lesson_id, entry.key)) {
    return { code: 'done', text: '已完成' };
  }
  if (entry.ready(lesson)) {
    return { code: 'available', text: '可以開始' };
  }
  return { code: 'pending_review', text: '教材審核中' };
}

export function findModuleEntry(key) {
  return MODULE_REGISTRY.find((m) => m.key === key);
}
