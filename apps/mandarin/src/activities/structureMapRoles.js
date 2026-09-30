// These are structural labels, rather than paragraph numbers or textbook subheads.
// New labels should be added only after review against the private source material.
const APPROVED_STRUCTURE_ROLES = new Set([
  '開頭', '開端', '起因', '經過', '發展', '轉折',
  '結果', '收束', '結局', '總說', '分說',
]);

// 冊別層級的 fail-closed 名單：官方「課文結構表」查核後，確認該冊現有
// structure_role 沒有來源依據，整冊不得呈現課文地圖。
//
// 115AG1H（一上）：2026-09-30 逐課比對官方 08課文結構表（115 學年，8 份 WORD）
// 後確認，一上 L01–L07 的結構表**只有課文句子，完全沒有結構角色標籤**；
// 僅課外〈妹妹寫的字〉標有「背景／原因／經過／結果」。但現有資料 7 課一律是
// 「開端／發展／轉折／收束」，官方來源並不存在這些詞，屬生成內容。
// 一上是注音期韻文教材，本就不適合結構分析活動；在重新確認這個年段該有什麼
// 活動之前，整冊停止呈現。解除前必須先有官方來源與教師核准紀錄。
const UNSOURCED_VOLUMES = new Set(['115AG1H']);

/** 從 lesson_id（如 `115AG3H01`）取冊別代號。取不到時回傳空字串。 */
function volumeOf(lessonId) {
  const match = /^(115AG\d+[A-Z])/.exec(String(lessonId || '').trim());
  return match ? match[1] : '';
}

/**
 * 該課所屬冊別的結構資料是否已對過官方來源。
 * 取不到冊別時回傳 true，交由角色白名單把關（不因 id 格式改變而整批消失）。
 */
export function isStructureSourceVerified(lessonId) {
  const volume = volumeOf(lessonId);
  return volume ? !UNSOURCED_VOLUMES.has(volume) : true;
}

export function isApprovedStructureRole(role) {
  return typeof role === 'string' && APPROVED_STRUCTURE_ROLES.has(role.trim());
}
