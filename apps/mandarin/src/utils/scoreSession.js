// 星星計分用的「本次大項作答」暫存區。
// 設計：mandarin-lesson-site 是單人、單分頁、單一 JS 執行環境的靜態網站，
// 沒有伺服器與多分頁並發問題，所以用 module-level 單例累加即可，不需要
// 透過 props 一路傳遞給每個活動檔案（characters.js／vocabulary.js…）。
// ModulePage 在建立一個大項活動之前呼叫 startScoreSession()，活動內任何一輪
// ChoiceQuiz／DragToSlot／MatchingGame 在「每一題（或每個配對回合）被判定」
// 時呼叫 recordOutcome()；活動全部完成、使用者按下「回課程首頁」時，
// ModulePage 呼叫 endScoreSession() 取得整個大項的彙總數據來換算星星。

let session = null;

export function startScoreSession() {
  session = { total: 0, firstTryCount: 0, revealedCount: 0 };
}

/**
 * @param {{firstTry: boolean, revealed: boolean}} outcome
 *   firstTry：這一題／這一回合第一次作答就答對，未看提示、未被揭曉正解。
 *   revealed：這一題／這一回合用盡重試次數，最後是被系統揭曉正解（不是自己答對）。
 */
export function recordOutcome({ firstTry, revealed }) {
  if (!session) return; // 沒有 startScoreSession 時（例如舊測試直接建元件）安靜忽略，不影響操作
  session.total += 1;
  if (firstTry) session.firstTryCount += 1;
  if (revealed) session.revealedCount += 1;
}

/** 結束本次作答並回傳彙總，之後 session 歸零，避免下一個大項誤繼承。 */
export function endScoreSession() {
  const result = session || { total: 0, firstTryCount: 0, revealedCount: 0 };
  session = null;
  return result;
}
