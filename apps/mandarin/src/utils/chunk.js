// 把陣列切成每組 min~max 題的多組，供「一組 3–5 題，可再來一組」的模組共用。
export function chunkRounds(items, { min = 3, max = 5 } = {}) {
  const rounds = [];
  let rest = [...items];
  while (rest.length > 0) {
    if (rest.length <= max) {
      rounds.push(rest);
      rest = [];
    } else {
      rounds.push(rest.slice(0, max));
      rest = rest.slice(max);
    }
  }
  // 最後一組題數低於 min 時併入前一組（避免出現只有 1–2 題的組），
  // 除非整體題數本來就不足 min。
  if (rounds.length >= 2 && rounds[rounds.length - 1].length < min) {
    const last = rounds.pop();
    rounds[rounds.length - 1] = rounds[rounds.length - 1].concat(last);
  }
  return rounds;
}
