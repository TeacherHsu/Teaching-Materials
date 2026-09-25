// 10 大項模組註冊表：狀態由資料＋是否已實作決定，不寫死於元件／頁面。
// 規格 docs/specs/2026-09-25-mandarin-dabutie-importer.md §4。
import { filterByStatus } from '../utils/preview.js';
import { isModuleComplete } from '../utils/storage.js';
import { usablePolyphoneEntries } from './polyphones.js';

const ROUND_MIN = 3;

/**
 * 6 色和諧調色盤，10 大項輪用（視覺升級）。色值定義在 src/styles/tokens.css，
 * 對比驗證見 scripts/check-contrast.mjs。元件只吃這裡輸出的 CSS 變數，
 * 不在 JS/CSS 另外寫死色碼。
 */
export const MODULE_COLOR_KEYS = ['blue', 'teal', 'purple', 'terracotta', 'rose', 'olive'];

export function moduleColorVars(colorKey) {
  return {
    '--module-color': `var(--module-${colorKey})`,
    '--module-color-dark': `var(--module-${colorKey}-dark)`,
    '--module-color-tint': `var(--module-${colorKey}-tint)`,
  };
}

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

function readyStructureParagraphs(lesson) {
  return filterByStatus(lesson.paragraph_summary || []).filter((p) => p.summary && p.structure_role);
}

function readyReadingQuestions(lesson) {
  return filterByStatus(lesson.reading_questions || []).filter((q) => q.stem);
}

function readyPolysemy(lesson) {
  return filterByStatus(lesson.polysemy || []).filter((p) => p.sentence && p.definition);
}

function readyListening(lesson) {
  return filterByStatus(lesson.listening || []).filter((l) => l.stem && l.question);
}

function readyRhetoric(lesson) {
  return filterByStatus(lesson.rhetoric || []).filter((r) => r.example && r.figure);
}

function readyLookalikeQuestions(lesson) {
  return filterByStatus(lesson.lookalikes || [])
    .map((g) => {
      const chars = (g.chars || []).filter((c) => c.char && c.example);
      if (chars.length < 2) return [];
      return chars.flatMap((c) => String(c.example).split(/[、,，]/u).map((term) => term.trim()).filter(Boolean));
    })
    .flat();
}

/**
 * 12 大項模組（新增「一字多音」「形似字」），依 Dashboard 顯示順序排列。
 * implemented=false 的項目一律「即將推出」，不看資料。
 * reviewOnly 的項目（舊字新詞）狀態不是「可以開始／教材審核中」，而是
 * 「可以開始／第 2 課起開放」，因為它需要「前面課次」的資料才有內容。
 */
export const MODULE_REGISTRY = [
  {
    key: 'characters',
    label: '認識生字',
    icon: 'characters',
    color: 'blue',
    description: '看字、聽音、分部首',
    implemented: true,
    ready(lesson) {
      const chars = readyCharacters(lesson);
      return chars.length >= ROUND_MIN && readyChoiceQuiz(lesson).length >= ROUND_MIN && distinctRadicals(chars).size >= 2;
    },
  },
  {
    key: 'vocabulary',
    label: '學會語詞',
    icon: 'vocabulary',
    color: 'teal',
    description: '認識詞義、練習配對',
    implemented: true,
    ready(lesson) {
      return readyWords(lesson).length >= ROUND_MIN;
    },
  },
  {
    key: 'idiom_builder',
    label: '生字變成語',
    icon: 'idiom_builder',
    color: 'purple',
    description: '用生字組出成語',
    implemented: true,
    ready(lesson) {
      return usableIdioms(lesson).length >= ROUND_MIN;
    },
  },
  {
    key: 'sentence_practice',
    label: '句型練習',
    icon: 'sentence_practice',
    color: 'terracotta',
    description: '照句型練習造句',
    implemented: true,
    ready(lesson) {
      return readyPatterns(lesson).length >= ROUND_MIN && patternsWithApprovedExamples(lesson).length >= 1;
    },
  },
  {
    key: 'reading',
    label: '讀懂課文',
    icon: 'reading',
    color: 'rose',
    description: '讀段落、抓重點',
    implemented: true,
    ready(lesson) {
      return readyParagraphs(lesson).length >= ROUND_MIN || readyReadingQuestions(lesson).length >= 1;
    },
  },
  {
    key: 'polysemy',
    label: '一字多義',
    icon: 'polysemy',
    color: 'olive',
    description: '同一個字，不同意思',
    implemented: true,
    ready(lesson) {
      return readyPolysemy(lesson).length >= ROUND_MIN;
    },
  },
  {
    key: 'polyphones',
    label: '一字多音',
    icon: 'polyphones',
    color: 'blue',
    description: '同一個字，不同讀音',
    implemented: true,
    ready(lesson) {
      // 有些課的官方教材只有一個多音字，但仍可用兩個讀音完成一組練習。
      return usablePolyphoneEntries(lesson).length >= 2;
    },
  },
  {
    key: 'lookalikes',
    label: '形似字',
    icon: 'lookalikes',
    color: 'teal',
    description: '長得很像的字，選出正確的',
    implemented: true,
    ready(lesson) {
      return readyLookalikeQuestions(lesson).length >= ROUND_MIN;
    },
  },
  {
    key: 'structure_map',
    label: '課文地圖',
    icon: 'structure_map',
    color: 'blue',
    description: '整理課文的段落結構',
    implemented: true,
    ready(lesson) {
      return readyStructureParagraphs(lesson).length >= ROUND_MIN;
    },
  },
  {
    key: 'listening',
    label: '聽聽看',
    icon: 'listening',
    color: 'teal',
    description: '聽一句、選答案',
    implemented: true,
    ready(lesson) {
      return readyListening(lesson).length >= ROUND_MIN;
    },
  },
  {
    key: 'rhetoric',
    label: '修辭小偵探',
    icon: 'rhetoric',
    color: 'purple',
    description: '找出課文裡的修辭手法',
    implemented: true,
    ready(lesson) {
      return readyRhetoric(lesson).length >= ROUND_MIN;
    },
  },
  {
    key: 'review',
    label: '舊字新詞',
    icon: 'review',
    color: 'terracotta',
    description: '複習前面課次學過的字詞',
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
