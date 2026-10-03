// 選擇題的結構閘門：答案必須「逐字等於」其中一個選項。
// 判分是字串相等；答案只要多一個「因為」或句號，學生就怎麼選都錯。
// 三上 L07–L12 聽聽看曾有 18 題這樣上線（answer 放的是完整說明句）。
// 不合格的題目一律不出，寧可少一題，也不要一題沒有正解。
export function hasPlayableAnswer(item) {
  return Array.isArray(item?.options)
    && item.options.length >= 2
    && typeof item.answer === 'string'
    && item.options.includes(item.answer);
}
