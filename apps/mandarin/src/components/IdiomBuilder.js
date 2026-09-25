import { h, clear } from '../utils/dom.js';
import { DragToSlot } from './DragToSlot.js';
import { ImageFrame } from './ImageFrame.js';
import { TaskBanner } from './TaskBanner.js';
import { missingContentNotice } from '../activities/engine.js';
import { filterByStatus, isPreview } from '../utils/preview.js';

const ROUND_SIZE_MAX = 5;
const BASE = import.meta.env.BASE_URL;

function reviewPendingBadge() {
  return h('span', { class: 'review-pending-badge' }, '待審');
}

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function pickDistractors(all, excludeId, n) {
  const pool = all.filter((x) => x.id !== excludeId);
  return shuffled(pool).slice(0, n);
}

/**
 * 第一關：把生字拖進成語的空格（成語定義卡＋插圖，插圖若缺圖不塌陷）。
 * 只用 idioms[]（定義原文照登，status:"ready"，不需審核），任何時候都可上線。
 */
function buildRound1(idioms) {
  const usable = idioms.filter((idm) => idm.related_char && idm.idiom.includes(idm.related_char));
  const items = shuffled(usable)
    .slice(0, ROUND_SIZE_MAX)
    .map((idm) => {
      const blanked = idm.idiom.replace(idm.related_char, '＿');
      const context = h('div', { class: 'idiom-builder__card' }, [
        ImageFrame({ src: `${BASE}assets/115AG3H/lesson01/idioms/${idm.idiom}.webp`, alt: `「${idm.idiom}」插圖` }),
        h('p', { class: 'quiz-stem' }, `成語：${blanked}`),
        h('p', { class: 'meta' }, idm.definition),
      ]);
      const distractorChars = pickDistractors(usable, idm.id, 2).map((d) => ({
        id: `char:${d.related_char}`,
        label: d.related_char,
      }));
      return {
        id: idm.id,
        context,
        speakText: `成語：${blanked}。${idm.definition}`,
        slotLabel: '？',
        options: [{ id: `char:${idm.related_char}`, label: idm.related_char }, ...distractorChars],
        answerId: `char:${idm.related_char}`,
        hint: '想一想這個成語的意思，哪一個字放進去最通順？',
        explanation: `「${idm.idiom}」：${idm.definition}`,
      };
    });
  return items;
}

/**
 * 第二關：把成語拖進生活語句的空格。用 idiom_sentences[]（改寫例句，status
 * 需 approved 才算生產環境可用；preview 模式下 draft 也顯示並加「待審」標籤）。
 */
function buildRound2(idioms, idiomSentences) {
  const idiomById = new Map(idioms.map((i) => [i.id, i]));
  const visible = filterByStatus(idiomSentences).filter((s) => {
    const idm = idiomById.get(s.idiom_id);
    return idm && s.rewritten && s.rewritten.includes(idm.idiom);
  });
  const usableIdioms = [...new Set(visible.map((s) => idiomById.get(s.idiom_id)))];

  const items = shuffled(visible)
    .slice(0, ROUND_SIZE_MAX)
    .map((s) => {
      const idm = idiomById.get(s.idiom_id);
      const blanked = s.rewritten.replace(idm.idiom, '（　　）');
      const contextChildren = [h('p', { class: 'quiz-stem' }, blanked)];
      if (s.status === 'draft') contextChildren.unshift(reviewPendingBadge());
      const context = h('div', { class: 'idiom-builder__card' }, contextChildren);
      const distractors = pickDistractors(usableIdioms, idm.id, 2).map((d) => ({ id: d.id, label: d.idiom }));
      return {
        id: s.id,
        context,
        speakText: blanked,
        slotLabel: '？',
        options: [{ id: idm.id, label: idm.idiom }, ...distractors],
        answerId: idm.id,
        hint: `想一想「${idm.idiom}」的意思，放進句子裡通不通順？`,
        explanation: `「${idm.idiom}」：${idm.definition}`,
      };
    });
  return items;
}

/**
 * 「生字變成語」：兩關，一次只呈現一關（一畫面一任務）。
 * @param {object} lesson
 * @param {() => void} onBack
 */
export function buildIdiomBuilderActivity(lesson, onBack) {
  const idioms = lesson.idioms || [];
  const round1Items = buildRound1(idioms);
  const round2Items = buildRound2(idioms, lesson.idiom_sentences || []);

  const rounds = [];
  if (round1Items.length >= 3) rounds.push({ key: 'round1', label: '第一關：生字變成語', items: round1Items });
  if (round2Items.length >= 3) rounds.push({ key: 'round2', label: '第二關：成語填句子', items: round2Items });

  const container = h('div', {});
  let roundIndex = 0;

  function renderRound() {
    clear(container);
    if (rounds.length === 0) {
      container.appendChild(missingContentNotice('生字變成語：教材審核中（成語例句尚未核准）'));
      return;
    }
    const round = rounds[roundIndex];
    const isLast = roundIndex === rounds.length - 1;
    container.appendChild(TaskBanner({ label: round.label, step: `第 ${roundIndex + 1} 關／共 ${rounds.length} 關` }));
    if (round.key === 'round2' && isPreview() && round2Items.some((it) => it.context.querySelector?.('.review-pending-badge'))) {
      container.appendChild(h('p', { class: 'meta' }, '「待審」標籤只會在預覽模式顯示，正式上線只會出現教師核准過的內容。'));
    }
    container.appendChild(
      DragToSlot({
        items: round.items,
        backLabel: isLast ? '回課程首頁' : '繼續：下一關',
        onBack: () => {
          if (isLast) {
            onBack();
          } else {
            roundIndex += 1;
            renderRound();
          }
        },
      }),
    );
  }

  renderRound();
  return container;
}
