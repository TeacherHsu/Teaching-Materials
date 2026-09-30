// These are structural labels, rather than paragraph numbers or textbook subheads.
// New labels should be added only after review against the private source material.
const APPROVED_STRUCTURE_ROLES = new Set([
  '開頭', '開端', '起因', '經過', '發展', '轉折',
  '結果', '收束', '結局', '總說', '分說',
]);

export function isApprovedStructureRole(role) {
  return typeof role === 'string' && APPROVED_STRUCTURE_ROLES.has(role.trim());
}
