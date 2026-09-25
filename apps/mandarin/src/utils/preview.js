// 待審預覽模式：網址帶 ?preview=1 才會顯示 status:draft 的改寫內容並加「待審」標籤。
// 生產（未帶 ?preview=1）一律過濾掉未核准（非 approved／ready）的內容。
// 規格 docs/specs/2026-09-25-mandarin-dabutie-importer.md §4「生產 build 過濾規則」。

export function isPreview() {
  try {
    return new URLSearchParams(window.location.search).get('preview') === '1';
  } catch {
    return false;
  }
}

// 直接公開類（生字／語詞／成語定義／句型結構）status 只會是 ready/todo；
// 改寫類（例句、提問、大意…）status 是 todo_rewrite/draft/approved/rejected。
// 兩種情況下「可在生產環境顯示」的條件相同：ready 或 approved。
const PUBLIC_STATUSES = new Set(['ready', 'approved']);

/**
 * 依 preview 模式過濾一個陣列裡帶 status 欄位的項目。
 * @param {Array<object>} items
 * @param {{ statusKey?: string }} [opts]
 */
export function filterByStatus(items, { statusKey = 'status' } = {}) {
  const preview = isPreview();
  return (items || []).filter((item) => {
    const status = item[statusKey];
    if (PUBLIC_STATUSES.has(status)) return true;
    if (status === 'draft' && preview) return true;
    return false;
  });
}

export function isDraftVisible(item, statusKey = 'status') {
  return item[statusKey] === 'draft' && isPreview();
}
