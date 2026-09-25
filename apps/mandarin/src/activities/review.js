// 「舊字新詞」（10 大項第 10 項）：從「本冊、比目前課次早」的課次抓 ready 生字／語詞，
// 混出一組 3–5 題（看字選音、看義選詞），複習前面課次教過的內容。
// 這一項需要跨課資料，元件內自己 fetch course-index＋前課 JSON（其他模組只吃已載入的
// 單課 lesson 物件，唯獨這項例外，因為它的內容不屬於單一課）。
import { h, clear } from '../utils/dom.js';
import { ChoiceQuiz } from '../components/ChoiceQuiz.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus } from '../utils/preview.js';

const ROUND_MIN = 3;
const ROUND_MAX = 5;

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function readyCharsOf(lesson) {
  return (lesson.characters || []).filter((c) => (c.status === 'ready' || !c.status) && c.char && c.zhuyin);
}

function readyWordsOf(lesson) {
  return filterByStatus(lesson.words || []).filter((w) => w.word && w.meaning);
}

// 看字選音：題幹是生字，正解是注音，干擾選項取自其他前課生字的注音。
function buildCharacterItems(prevLessons) {
  const allChars = prevLessons.flatMap(readyCharsOf);
  return allChars.map((c, i) => {
    const distractorPool = allChars.filter((o) => o.zhuyin !== c.zhuyin);
    const distractors = shuffled(distractorPool).slice(0, 3).map((o) => o.zhuyin);
    const options = shuffled([...new Set([c.zhuyin, ...distractors])]);
    return {
      id: `review-char:${c.char}:${i}`,
      stem: `「${c.char}」的注音是？`,
      options,
      answer: c.zhuyin,
      explanation: `「${c.char}」讀作 ${c.zhuyin}。`,
    };
  });
}

// 看義選詞：題幹是語詞的意思，正解是語詞，干擾選項取自其他前課語詞。
function buildWordItems(prevLessons) {
  const allWords = prevLessons.flatMap(readyWordsOf);
  return allWords.map((w, i) => {
    const distractorPool = allWords.filter((o) => o.word !== w.word);
    const distractors = shuffled(distractorPool).slice(0, 3).map((o) => o.word);
    const options = shuffled([...new Set([w.word, ...distractors])]);
    return {
      id: `review-word:${w.id || w.word}:${i}`,
      stem: `意思是「${w.meaning}」的語詞是？`,
      options,
      answer: w.word,
      explanation: `「${w.word}」的意思是：${w.meaning}。`,
    };
  });
}

/**
 * 純函式：由前面課次的完整 lesson JSON 陣列，混出「看字選音」＋「看義選詞」候選題目。
 * 不含任何 DOM／fetch，供瀏覽器與 node 測試共用。
 * @param {Array<object>} prevLessons 比目前課次早的課次 JSON（完整版）
 * @returns {Array<object>} 打散順序的候選題目（尚未裁切成一組 3–5 題）
 */
export function buildReviewQuizItems(prevLessons) {
  const items = [...buildCharacterItems(prevLessons), ...buildWordItems(prevLessons)];
  return shuffled(items);
}

/**
 * 純函式：從候選題目裡挑一組 3–5 題；題目不足 3 題時回傳空陣列（教材審核中）。
 * @param {Array<object>} prevLessons
 * @param {{min?: number, max?: number}} [opts]
 */
export function pickReviewRound(prevLessons, { min = ROUND_MIN, max = ROUND_MAX } = {}) {
  const items = buildReviewQuizItems(prevLessons);
  if (items.length < min) return [];
  return items.slice(0, max);
}

function findVolumeLessonMetas(courseIndex, volumeCode) {
  const metas = [];
  for (const grade of courseIndex.grades || []) {
    for (const volume of grade.volumes || []) {
      if (volume.code !== volumeCode) continue;
      for (const unit of volume.units || []) {
        for (const lessonMeta of unit.lessons || []) {
          metas.push(lessonMeta);
        }
      }
    }
  }
  return metas;
}

/**
 * 跨課讀檔：找出「本冊、比目前課次早」的課次完整 JSON。
 * @param {object} lesson 目前課次（需要 volume.code、lesson_no、lesson_id）
 * @param {{base?: string, fetchImpl?: typeof fetch}} [opts]
 * @returns {Promise<Array<object>>}
 */
export async function loadPrevLessons(lesson, { base = '/', fetchImpl = fetch } = {}) {
  const volumeCode = lesson.volume && lesson.volume.code;
  if (!volumeCode) return [];

  const indexRes = await fetchImpl(`${base}data/course-index.json`);
  if (!indexRes.ok) return [];
  const courseIndex = await indexRes.json();

  const prevMetas = findVolumeLessonMetas(courseIndex, volumeCode).filter(
    (meta) => meta.lesson_no < lesson.lesson_no && meta.lesson_id !== lesson.lesson_id,
  );

  const jsons = await Promise.all(
    prevMetas.map(async (meta) => {
      const res = await fetchImpl(`${base}${meta.data}`);
      if (!res.ok) return null;
      return res.json();
    }),
  );
  return jsons.filter(Boolean);
}

/**
 * @param {object} lesson
 * @param {() => void} onBack
 * @param {{base?: string, fetchImpl?: typeof fetch}} [opts] 測試用注入點；正式使用讀
 *   import.meta.env.BASE_URL（跟 main.js 的 loadCourseIndex/loadLesson 一致）。
 */
export function buildReviewActivity(lesson, onBack, opts = {}) {
  const base = opts.base ?? (typeof import.meta !== 'undefined' ? import.meta.env?.BASE_URL : undefined) ?? '/';
  const fetchImpl = opts.fetchImpl ?? fetch;

  const container = h('div', {});
  container.appendChild(TaskBanner({ label: '複習前面課次教過的字詞', step: '載入中…' }));

  loadPrevLessons(lesson, { base, fetchImpl })
    .then((prevLessons) => {
      const roundItems = pickReviewRound(prevLessons);
      clear(container);
      if (roundItems.length === 0) {
        container.appendChild(missingContentNotice('舊字新詞：教材審核中'));
        return;
      }
      container.appendChild(
        TaskBanner({ label: '複習前面課次教過的字詞', step: `共 ${roundItems.length} 題` }),
      );
      container.appendChild(
        ChoiceQuiz({
          items: roundItems,
          backLabel: '回課程首頁',
          onBack,
        }),
      );
    })
    .catch(() => {
      clear(container);
      container.appendChild(missingContentNotice('舊字新詞：教材審核中'));
    });

  return container;
}
