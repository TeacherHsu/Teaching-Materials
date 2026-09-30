// 「課文地圖」模組：先看整課的結構樹（開頭／經過／結果…），再把每段大意
// 拖進正確的結構空格。沿用 DragToSlot（IdiomBuilder 已用過的同一引擎）：
// 每一題的空格只放「結構角色」，context 顯示這一段的大意卡＋整課結構樹
// （目前段落所屬的節點只標示位置、不直接顯示角色答案），寬螢幕（≥900px）樹狀橫排，手機單欄堆疊。
// 規格 docs/specs/2026-09-25-mandarin-dabutie-importer.md §4：
// modules key `structure_map`，資料來自 `paragraph_summary[].structure_role`。
import { h, clear } from '../utils/dom.js';
import { DragToSlot } from '../components/DragToSlot.js';
import { TaskBanner } from '../components/TaskBanner.js';
import { SpeakButton } from '../components/SpeakButton.js';
import { missingContentNotice } from './engine.js';
import { filterByStatus, isPreview } from '../utils/preview.js';
import { isApprovedStructureRole, isStructureSourceVerified } from './structureMapRoles.js';

const ROUND_SIZE_MAX = 5;

// 通用結構角色詞庫，供某課只出現 1 種角色時補干擾選項用。
const GENERIC_ROLE_POOL = ['開頭', '經過', '結果', '總說', '分說', '起因'];

function reviewPendingBadge() {
  return h('span', { class: 'review-pending-badge' }, '待審');
}

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function paragraphNo(paragraph) {
  const value = paragraph.paragraph_no ?? paragraph.para_no;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function paragraphPrompt(paragraph) {
  const number = paragraphNo(paragraph);
  return number ? `第 ${number} 段大意：${paragraph.summary}` : paragraph.summary;
}

function readyParagraphs(lesson) {
  // 冊別未對過官方來源時整冊不呈現，不逐段判斷（見 structureMapRoles.js）。
  if (!isStructureSourceVerified(lesson.lesson_id)) return [];
  return filterByStatus(lesson.paragraph_summary || []).filter(
    (p) => p.summary && isApprovedStructureRole(p.structure_role),
  );
}

/** 整課結構樹：依段落順序列出各段的結構角色（重複角色只顯示一次連續節點）。 */
function buildTree(paragraphs, currentParaNo) {
  const nodes = [];
  paragraphs
    .slice()
    .sort((a, b) => (paragraphNo(a) || Number.MAX_SAFE_INTEGER) - (paragraphNo(b) || Number.MAX_SAFE_INTEGER))
    .forEach((p) => {
      const last = nodes[nodes.length - 1];
      if (last && last.role === p.structure_role) {
        last.paraNos.push(paragraphNo(p));
      } else {
        nodes.push({ role: p.structure_role, paraNos: [paragraphNo(p)] });
      }
    });

  const tree = h('div', { class: 'structure-map__tree', 'aria-label': '課文結構地圖' });
  nodes.forEach((node, i) => {
    if (i > 0) tree.appendChild(h('span', { class: 'structure-map__arrow', 'aria-hidden': 'true' }, '→'));
    const isCurrent = node.paraNos.includes(currentParaNo);
    tree.appendChild(
      h('div', {
        class: `structure-map__node${isCurrent ? ' structure-map__node--current' : ''}`,
        'aria-label': isCurrent ? '目前段落的位置，結構角色待判斷' : `結構角色：${node.role}`,
      }, isCurrent ? '目前段落' : node.role),
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
    cardChildren.push(h('p', { class: 'quiz-stem' }, paragraphPrompt(p)));
    const card = h('div', { class: 'structure-map__card' }, cardChildren);

    const context = h('div', {}, [buildTree(paragraphs, paragraphNo(p)), card]);

    const distractors = pickRoleDistractors(allRoles, p.structure_role, 2).map((role) => ({
      id: `role:${role}`,
      label: role,
    }));

    return {
      id: p.id,
      context,
      speakText: paragraphPrompt(p),
      slotLabel: '？',
      options: [{ id: `role:${p.structure_role}`, label: p.structure_role }, ...distractors],
      answerId: `role:${p.structure_role}`,
      hint: '想一想這一段在課文結構圖裡，是接近開頭、經過還是結果？',
      explanation: paragraphNo(p)
        ? `第 ${paragraphNo(p)} 段屬於「${p.structure_role}」。`
        : `這段內容屬於「${p.structure_role}」。`,
    };
  });
}


/** 段落群組 `[2,3]` → 「第 2–3 段」；`[4]` → 「第 4 段」。 */
function groupLabel(group) {
  if (!Array.isArray(group) || group.length === 0) return '';
  return group.length === 1 ? `第 ${group[0]} 段` : `第 ${group[0]}–${group[1]} 段`;
}

/** 只有教師核准過的大意才會出現在學生端。 */
function approvedSegments(node) {
  return (node.segments || []).filter((s) => s.gist && (s.status === 'approved' || (isPreview() && s.status === 'draft')));
}

/** 走訪整棵樹，取出所有可呈現的 segment（含所屬節點標籤）。 */
function collectSegments(nodes, out = []) {
  for (const node of nodes || []) {
    for (const segment of approvedSegments(node)) out.push({ node, segment });
    collectSegments(node.children, out);
  }
  return out;
}

/** 官方結構骨架：逐節點列出標籤、段落範圍與大意，子節點縮排。 */
function buildSkeletonNode(node, depth) {
  const segments = approvedSegments(node);
  const ranges = (node.segments || []).map((s) => groupLabel(s.paragraphs)).filter(Boolean).join('、');
  const children = (node.children || []).map((child) => buildSkeletonNode(child, depth + 1));
  return h('li', { class: `structure-map__skeleton-item structure-map__skeleton-item--d${depth}` }, [
    h('span', { class: 'structure-map__skeleton-label' }, node.label),
    // 有大意時，段落範圍已逐筆標在大意前面，節點層就不再重複。
    ranges && segments.length === 0 ? h('span', { class: 'structure-map__skeleton-range' }, ranges) : null,
    segments.length
      ? h('ul', { class: 'structure-map__skeleton-gists' }, segments.map(({ gist, paragraphs }) => h(
          'li',
          { class: 'structure-map__skeleton-gist' },
          [
            groupLabel(paragraphs) ? h('span', { class: 'structure-map__skeleton-range' }, groupLabel(paragraphs)) : null,
            h('span', {}, gist),
          ].filter(Boolean),
        )))
      : null,
    children.length ? h('ul', { class: 'structure-map__skeleton-children' }, children) : null,
  ].filter(Boolean));
}

/**
 * 段落歸位：把每一段大意放回它所屬的結構段。
 * 學生必須讀懂大意在講什麼才放得進去，所以操作本身就是理解檢核。
 * 只在官方標有段落編號（A 類）且結構段夠多時才出題（規格 §7.1）。
 */
function buildPlacementItems(nodes) {
  const pairs = collectSegments(nodes);
  const labels = [...new Set(pairs.map(({ node }) => node.label))];
  if (labels.length < 2) return [];

  return shuffled(pairs).slice(0, ROUND_SIZE_MAX).map(({ node, segment }) => {
    const range = groupLabel(segment.paragraphs);
    const prompt = range ? `${range}：${segment.gist}` : segment.gist;
    const distractors = shuffled(labels.filter((label) => label !== node.label)).slice(0, 2);
    return {
      id: segment.gist_id,
      context: h('div', { class: 'structure-map__card' }, [h('p', { class: 'quiz-stem' }, prompt)]),
      speakText: prompt,
      slotLabel: '？',
      options: shuffled([node.label, ...distractors]).map((label) => ({ id: `role:${label}`, label })),
      answerId: `role:${node.label}`,
      hint: '想一想：這一段是在開頭交代、中間推進，還是收尾？',
      explanation: `這一段屬於「${node.label}」。`,
    };
  });
}

/**
 * 有官方結構樹時的呈現：先讓學生看懂這一課是怎麼組織的。
 * 段落大意（gist）須先經 rewrite-queue 改寫核准才公開，因此拖曳作答
 * 暫不開放；規格 docs/specs/2026-09-30-structure-map-redesign.md §3.1、§7。
 */
function buildSkeletonView(lesson, tree, onBack) {
  const nodes = (tree.nodes || []).filter((node) => node && node.label);
  if (nodes.length < 2) return null;

  const list = h('ul', { class: 'structure-map__skeleton' }, nodes.map((node) => buildSkeletonNode(node, 0)));
  const pending = collectSegments(nodes).length === 0;
  const speakText = nodes
    .map((node) => {
      const paragraphs = (node.paragraphs || []).map(groupLabel).filter(Boolean).join('、');
      return paragraphs ? `${node.label}，${paragraphs}` : node.label;
    })
    .join('；');

  const items = tree.task_type === 'A' && !pending ? buildPlacementItems(nodes) : [];

  const container = h('div', {});
  const showSkeleton = () => {
    clear(container);
    container.appendChild(h('div', {}, [
      TaskBanner({ label: '先看看這一課是怎麼組織起來的' }),
      h('div', { class: 'structure-map__skeleton-wrap', 'aria-label': '課文結構地圖' }, [list]),
      SpeakButton({ text: speakText }),
      pending ? h('p', { class: 'meta' }, '段落大意正在改寫審核中，核准後就能在這裡練習把大意放進結構。') : null,
      items.length >= 3
        ? h('button', { class: 'btn btn--primary', type: 'button', onclick: showPlacement }, '開始練習：把大意放回結構')
        : null,
      h('button', { class: 'btn', type: 'button', onclick: () => onBack() }, '回課程首頁'),
    ].filter(Boolean)));
  };
  function showPlacement() {
    clear(container);
    container.appendChild(TaskBanner({ label: '把每一段大意放回它所屬的結構' }));
    container.appendChild(DragToSlot({ items, backLabel: '回結構地圖', onBack: showSkeleton }));
  }

  showSkeleton();
  return container;
}

/**
 * 「課文地圖」：先看整課結構樹，再把每段大意拖進正確的結構空格。
 * @param {object} lesson
 * @param {() => void} onBack
 */
export function buildStructureMapActivity(lesson, onBack) {
  const tree = lesson.structure_tree;
  if (tree && isStructureSourceVerified(lesson.lesson_id)) {
    const skeleton = buildSkeletonView(lesson, tree, onBack);
    if (skeleton) {
      const wrapper = h('div', {});
      wrapper.appendChild(skeleton);
      return wrapper;
    }
  }

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
