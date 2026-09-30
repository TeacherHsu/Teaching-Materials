// 教師設定的入口檢核：出一道兩位數 × 一位數的乘法。
//
// 目的是「擋住順手亂點的學生」，不是資訊安全——本站沒有帳號，也不該有。
// 難度由 CF 指定為兩位數 × 一位數：對教師是瞬間的事（上課中要快），
// 對本站的學生族群已是足夠的門檻。答錯就換一題，不鎖定
//（鎖定只會讓教師自己被擋在外面）。

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * @returns {{a:number, b:number, question:string, answer:number}}
 */
export function makeTeacherChallenge() {
  // 避開太好算的組合（整十、乘以 1 或 2），否則等於沒擋。
  let a = randomInt(13, 89);
  let b = randomInt(3, 9);
  while (a % 10 === 0) {
    a = randomInt(13, 89);
  }
  return { a, b, question: `${a} × ${b} = ?`, answer: a * b };
}

/** @returns {boolean} 使用者輸入是否等於正解（容許前後空白）。 */
export function verifyTeacherChallenge(challenge, input) {
  const value = Number(String(input ?? '').trim());
  return Number.isFinite(value) && value === challenge.answer;
}
