// 共用的「教材待補」提示。
// 原本這支還有一個「動手挑戰」大項的 buildChallengeActivity（選擇題＋配對），
// 已沒有任何大項使用，2026-10-04 移除。

export function missingContentNotice(text = '此部分教材待補') {
  const div = document.createElement('div');
  div.className = 'missing-content';
  div.textContent = text;
  return div;
}
