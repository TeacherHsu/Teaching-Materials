// 「答錯時順勢提醒看方法」（CF 2026-10-04）：同一關連續 2 題第一次就答錯、
// 而且這個學生還沒看過本關的方法，就提醒一次「要不要看看這關的方法？」。
// ChoiceQuiz 回報每題第一次作答對錯；ModulePage 決定要不要顯示提醒。
const NUDGE_AFTER = 2;
let streak = 0;
let listener = null;

/** ModulePage 進關卡時註冊；傳 null 取消。 */
export function onStrategyNudge(fn) {
  listener = fn;
  streak = 0;
}

/** 每題第一次作答的結果（答對就歸零）。 */
export function noteFirstAttempt(correct) {
  if (correct) { streak = 0; return; }
  streak += 1;
  if (streak >= NUDGE_AFTER && listener) {
    const fn = listener;
    listener = null; // 一關只提醒一次
    fn();
  }
}
