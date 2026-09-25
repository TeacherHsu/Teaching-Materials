// 「課文地圖」模組：先看整課的結構樹（開頭／經過／結果…），再把每段大意
// 拖進正確的結構空格。沿用 DragToSlot（IdiomBuilder 已用過的同一引擎）：
// 每一題的空格只放「結構角色」，context 顯示這一段的大意卡＋整課結構樹
// （目前段落所屬的節點會標記起來），寬螢幕（≥900px）樹狀橫排，手機單欄堆疊。
// 規格 docs/specs/2026-09-25-mandarin-dabutie-importer.md §4：
// modules key `structure_map`，資料來自 `paragraph_summary[].structure_role`。
import { h, clear } from '../utils/dom.js';
import { DragToSlot } from '../components/DragToSlot.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus, isPreview } from '../utils/preview.js';

const ROUND_SIZE_MAX = 5;

// 通用結構角色詞庫，供某課只出現 1 種角色時補干擾選項用。
const GENERIC_ROLE_POOL = ['開頭', '經過', '結果', '總說', '分說', '起因'];

function reviewPendingBadge() {
  return h('span', { class: 'review-pending-badge' }, '待審');
}

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function readyParagraphs(lesson) {
  return filterByStatus(lesson.paragraph_summary || []).filter((p) => p.summary && p.structure_role);
}

/** 整課結構樹：依段落順序列出各段的結構角色（重複角色只顯示一次連續節點）。 */
function buildTree(paragraphs, currentParaNo) {
  const nodes = [];
  paragraphs
    .slice()
    .sort((a, b) => a.para_no - b.para_no)
    .forEach((p) => {
      const last = nodes[nodes.length - 1];
      if (last && last.role === p.structure_role) {
        last.paraNos.push(p.para_no);
      } else {
        nodes.push({ role: p.structure_role, paraNos: [p.para_no] });
      }
    });

  const tree = h('div', { class: 'structure-map__tree', 'aria-label': '課文結構地圖' });
  nodes.forEach((node, i) => {
    if (i > 0) tree.appendChild(h('span', { class: 'structure-map__arrow', 'aria-hidden': 'true' }, '→'));
    const isCurrent = node.paraNos.includes(currentParaNo);
    tree.appendChild(
      h('div', {
        class: `structure-map__node${isCurrent ? ' structure-map__node--current' : ''}`,
      }, node.role),
    );
  });
  return tree;
}

function pickRoleDistractors(allRoles, excludeRole, n) {
  const pool = [...new Set(allRoles.filter((r) => r !== excludeRole))];
  if (pool.length < n) {
    GENERIC_ROLE_POOL.forEach((r) => {
      if (r !== excludeRole && !pool.includes(r)) pool.push(r);
    });
  }
  return shuffled(pool).slice(0, n);
}

function buildItems(paragraphs) {
  const allRoles = paragraphs.map((p) => p.structure_role);
  const picked = shuffled(paragraphs).slice(0, ROUND_SIZE_MAX);

  return picked.map((p) => {
    const cardChildren = [];
    if (p.status === 'draft') cardChildren.push(reviewPendingBadge());
    cardChildren.push(h('p', { class: 'quiz-stem' }, `第 ${p.para_no} 段大意：${p.summary}`));
    const card = h('div', { class: 'structure-map__card' }, cardChildren);

    const context = h('div', {}, [buildTree(paragraphs, p.para_no), card]);

    const distractors = pickRoleDistractors(allRoles, p.structure_role, 2).map((role) => ({
      id: `role:${role}`,
      label: role,
    }));

    return {
      id: p.id,
      context,
      speakText: `第 ${p.para_no} 段大意：${p.summary}`,
      slotLabel: '？',
      options: [{ id: `role:${p.structure_role}`, label: p.structure_role }, ...distractors],
      answerId: `role:${p.structure_role}`,
      hint: '想一想這一段在課文結構圖裡，是接近開頭、經過還是結果？',
      explanation: `第 ${p.para_no} 段屬於「${p.structure_role}」。`,
    };
  });
}

/**
 * 「課文地圖」：先看整課結構樹，再把每段大意拖進正確的結構空格。
 * @param {object} lesson
 * @param {() => void} onBack
 */
export function buildStructureMapActivity(lesson, onBack) {
  const paragraphs = readyParagraphs(lesson);
  const items = paragraphs.length >= 3 ? buildItems(paragraphs) : [];

  const container = h('div', {});

  function render() {
    clear(container);
    if (items.length === 0) {
      container.appendChild(missingContentNotice('課文地圖：教材審核中（段落大意／結構尚未核准）'));
      return;
    }
    container.appendChild(TaskBanner({ label: '把段落大意拖進課文結構圖的空格' }));
    if (isPreview() && paragraphs.some((p) => p.status === 'draft')) {
      container.appendChild(h('p', { class: 'meta' }, '「待審」標籤只在預覽模式顯示，正式上線只會出現教師核准過的內容。'));
    }
    container.appendChild(
      DragToSlot({
        items,
        backLabel: '回課程首頁',
        onBack: () => onBack(),
      }),
    );
  }

  render();
  return container;
}
