const SINGLE_BOPOMOFO = /^[\u3105-\u3129]+[\u02CA\u02C7\u02CB\u02D9]?$/u;

function pronunciationCharacter(stem) {
  const match = /^「(.+)」的注音是[？?]$/.exec(String(stem || '').trim());
  if (!match || [...match[1]].length !== 1) return null;
  return match[1];
}

/**
 * Keep only complete, sourced character-to-pronunciation questions.
 * Other choice items in lesson.quiz belong to different activities and must
 * not leak into the "看字選音" step.
 */
export function isPronunciationQuizItem(item, characters) {
  if (!item || item.type !== 'choice' || item.status !== 'ready') return false;

  const character = pronunciationCharacter(item.stem);
  if (!character) return false;

  const reference = (Array.isArray(characters) ? characters : []).find((entry) => entry.char === character);
  if (!reference || !SINGLE_BOPOMOFO.test(reference.zhuyin || '')) return false;
  if (!String(reference.pedia_url || '').startsWith('https://pedia.cloud.edu.tw/Entry/Detail?title=')) return false;
  if (item.answer !== reference.zhuyin) return false;

  if (!Array.isArray(item.options) || item.options.length !== 3) return false;
  if (new Set(item.options).size !== item.options.length) return false;
  if (!item.options.includes(item.answer)) return false;
  return item.options.every((option) => typeof option === 'string' && SINGLE_BOPOMOFO.test(option));
}

export function selectPronunciationQuizItems(quiz, characters) {
  return (Array.isArray(quiz) ? quiz : []).filter((item) => isPronunciationQuizItem(item, characters));
}
