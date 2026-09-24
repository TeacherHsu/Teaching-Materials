// 待審頁：#/review/<lesson_id>（僅 ?preview=1 可進，main.js 已做這層 gate）。
// 規格 docs/specs/2026-09-25-mandarin-dabutie-importer.md §5。
//
// 純靜態站沒有寫回能力：這頁只做「本機暫存審核決定＋下載審核結果 JSON」，
// 真正寫回 lesson JSON 要靠 `python3 tools/dabutie/apply_review.py`。
import { h, clear } from '../utils/dom.js';
import { loadReviewDecisions, saveReviewDecisions } from '../utils/storage.js';

// 每組 items() 回傳 [{id, statusField, content, requirement}]。
// statusField 只是給教師／開發者對照 apply_review.py 用的欄位名稱，
// 下載的審核結果 JSON 不含 statusField（apply_review.py 自己知道每個 id
// 該改哪個欄位）。
const GROUPS = [
  {
    key: 'idiom_builder',
    title: '3 生字變成語 — 成語生活句',
    items(lesson) {
      const idiomsById = new Map((lesson.idioms || []).map((i) => [i.id, i]));
      return (lesson.idiom_sentences || [])
        .filter((s) => s.status === 'draft')
        .map((s) => {
          const idiom = idiomsById.get(s.idiom_id);
          return {
            id: s.id,
            content: s.rewritten || '（空白）',
            requirement: idiom ? `成語：${idiom.idiom}（${idiom.definition}）` : '（找不到對應成語）',
          };
        });
    },
  },
  {
    key: 'sentence_practice',
    title: '4 句型練習 — 句型例句',
    items(lesson) {
      return (lesson.sentence_patterns || [])
        .filter((p) => p.examples_status === 'draft')
        .map((p) => ({
          id: p.id,
          content: (p.examples || []).join('／') || '（空白）',
          requirement: `句型：${p.structure || p.head}（${p.description || ''}）`,
        }));
    },
  },
  {
    key: 'reading_paragraph',
    title: '5／7 讀懂課文・課文地圖 — 段落大意',
    items(lesson) {
      return (lesson.paragraph_summary || [])
        .filter((p) => p.status === 'draft')
        .map((p) => ({
          id: p.id,
          content: p.summary || '（空白）',
          requirement: `第 ${p.para_no} 段・課文地圖結構角色：${p.structure_role || '（未標註）'}`,
        }));
    },
  },
  {
    key: 'main_idea',
    title: '5 讀懂課文 — 主旨與課文大意',
    items(lesson) {
      const mi = lesson.main_idea;
      if (!mi || mi.status !== 'draft') return [];
      return [
        {
          id: mi.id,
          content: `課文大意：${mi.gist || '（空白）'}\n主旨：${mi.theme || '（空白）'}`,
          requirement: '課文大意＋主旨（教師改寫）',
        },
      ];
    },
  },
  {
    key: 'reading_questions',
    title: '5 讀懂課文 — 閱讀理解提問',
    items(lesson) {
      return (lesson.reading_questions || [])
        .filter((q) => q.status === 'draft')
        .map((q) => ({
          id: q.id,
          content: `題幹：${q.stem || '（空白）'}\n提示：${q.answer_hint || '（空白）'}`,
          requirement: `策略標籤：${q.strategy_tag || '（無）'}`,
        }));
    },
  },
  {
    key: 'polysemy',
    title: '6 一字多義 — 例句',
    items(lesson) {
      return (lesson.polysemy || [])
        .filter((p) => p.status === 'draft')
        .map((p) => ({
          id: p.id,
          content: p.sentence || '（空白）',
          requirement: `「${p.char}」義項：${p.definition}`,
        }));
    },
  },
  {
    key: 'listening',
    title: '8 聽聽看 — 聽力題',
    items(lesson) {
      return (lesson.listening || [])
        .filter((l) => l.status === 'draft')
        .map((l) => ({
          id: l.id,
          content: `題目：${l.stem || '（空白）'}\n問題：${l.question || '（空白）'}\n選項：${(l.options || []).join('、')}\n答案：${l.answer || '（空白）'}`,
          requirement: '聽力題（教師原創，無對應大補帖來源）',
        }));
    },
  },
  {
    key: 'rhetoric',
    title: '9 修辭小偵探 — 修辭例句',
    items(lesson) {
      return (lesson.rhetoric || [])
        .filter((r) => r.status === 'draft')
        .map((r) => ({
          id: r.id,
          content: r.child_note ? `${r.example || '（空白）'}\n（${r.child_note}）` : (r.example || '（空白）'),
          requirement: `修辭格：${r.figure}`,
        }));
    },
  },
];

export function ReviewPage(lesson) {
  const lessonId = lesson.lesson_id;
  const decisions = loadReviewDecisions(lessonId); // { [id]: { decision, note } }

  const groupsWithItems = GROUPS.map((g) => ({ ...g, list: g.items(lesson) })).filter((g) => g.list.length > 0);
  const allIds = groupsWithItems.flatMap((g) => g.list.map((it) => it.id));
  const total = allIds.length;

  const root = h('div', { class: 'container review-page' });
  root.appendChild(
    h('p', { class: 'breadcrumb' }, [
      h('a', { href: '#/' }, '首頁'),
      ' ／ ',
      h('a', { href: `#/lesson/${lessonId}` }, `第 ${lesson.lesson_no} 課`),
      ' ／ ',
      '待審核',
    ]),
  );
  root.appendChild(h('h1', {}, `第 ${lesson.lesson_no} 課：${lesson.title} — 教材待審`));

  if (total === 0) {
    root.appendChild(
      h('p', { class: 'missing-content' }, '目前沒有待審（draft）內容。可能已全數核准，或這是生產資料（不含草稿）。'),
    );
    root.appendChild(h('a', { class: 'btn', href: `#/lesson/${lessonId}` }, '回課程首頁'));
    return root;
  }

  const progressText = h('p', { class: 'review-progress', role: 'status' }, '');
  root.appendChild(progressText);

  function countDecided() {
    return allIds.filter((id) => decisions[id] && decisions[id].decision).length;
  }
  function updateProgress() {
    progressText.textContent = `已審 ${countDecided()} ／ 共 ${total}`;
  }

  function persist() {
    saveReviewDecisions(lessonId, decisions);
    updateProgress();
  }

  function setDecision(id, decision) {
    decisions[id] = { ...(decisions[id] || {}), decision };
    persist();
  }
  function setNote(id, note) {
    decisions[id] = { ...(decisions[id] || {}), note };
    persist();
  }

  for (const group of groupsWithItems) {
    const section = h('section', { class: 'review-group' });
    const header = h('div', { class: 'review-group__header' }, [
      h('h2', {}, `${group.title}（${group.list.length} 筆）`),
      h(
        'button',
        {
          class: 'btn btn--secondary',
          type: 'button',
          onClick: () => {
            for (const it of group.list) setDecision(it.id, 'approved');
            renderGroupItems();
          },
        },
        '全部核准此組',
      ),
    ]);
    section.appendChild(header);

    const itemsWrap = h('div', { class: 'review-group__items' });
    section.appendChild(itemsWrap);

    function renderGroupItems() {
      clear(itemsWrap);
      for (const it of group.list) {
        itemsWrap.appendChild(renderItem(it));
      }
    }

    function renderItem(it) {
      const current = decisions[it.id] || {};
      const card = h('div', { class: 'review-item' });
      card.appendChild(h('p', { class: 'review-item__requirement' }, it.requirement));
      card.appendChild(h('p', { class: 'review-item__content' }, it.content));

      const approveBtn = h(
        'button',
        {
          class: 'btn review-decision review-decision--approved',
          type: 'button',
          'aria-pressed': String(current.decision === 'approved'),
          onClick: () => {
            setDecision(it.id, 'approved');
            renderGroupItems();
          },
        },
        '核准',
      );
      const rejectBtn = h(
        'button',
        {
          class: 'btn btn--secondary review-decision review-decision--rejected',
          type: 'button',
          'aria-pressed': String(current.decision === 'rejected'),
          onClick: () => {
            setDecision(it.id, 'rejected');
            renderGroupItems();
          },
        },
        '退回',
      );
      const actions = h('div', { class: 'review-item__actions' }, [approveBtn, rejectBtn]);
      card.appendChild(actions);

      const note = h('textarea', {
        class: 'review-item__note',
        rows: '2',
        placeholder: '退回時請寫備註（教師可見，供改寫者參考）',
        onChange: (e) => setNote(it.id, e.target.value),
      });
      note.value = current.note || '';
      card.appendChild(h('label', { class: 'review-item__note-label' }, ['備註', note]));

      return card;
    }

    renderGroupItems();
    root.appendChild(section);
  }

  const downloadBtn = h(
    'button',
    { class: 'btn btn--accent', type: 'button' },
    '下載審核結果 JSON',
  );
  downloadBtn.addEventListener('click', () => {
    const payload = {
      lesson_id: lessonId,
      decisions: allIds
        .filter((id) => decisions[id] && decisions[id].decision)
        .map((id) => ({ id, decision: decisions[id].decision, note: decisions[id].note || '' })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lessonId}-review-result.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
  root.appendChild(h('div', { class: 'review-page__footer' }, [downloadBtn]));

  updateProgress();
  return root;
}
