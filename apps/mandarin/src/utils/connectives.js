// 關聯詞表：依關係類型分組。
//
// 用途有兩個：
// 1. 從句型結構字串裡認出「真的」關聯詞——結構字串多半是「名詞（人或物）＋動詞」，
//    直接拆字串會把「名詞」當成關聯詞。
// 2. 選連接詞的誘答：只從**不同關係類型**挑。同類的兩組（雖然……可是／雖然……但是）
//    放進句子都對，拿來當誘答等於出了兩個正解。
//
// 假設和條件常常可以互換（「如果肯付出，就……」「只要肯付出，就……」都通），
// 所以歸成同一家族，不互相當誘答。
export const CONNECTIVE_PAIRS = [
  { type: '轉折', words: ['雖然', '可是'] },
  { type: '轉折', words: ['雖然', '但是'] },
  { type: '轉折', words: ['雖然', '卻'] },
  { type: '因果', words: ['因為', '所以'] },
  { type: '因果', words: ['由於', '因此'] },
  { type: '遞進', words: ['不但', '而且'] },
  { type: '遞進', words: ['不但', '還'] },
  { type: '遞進', words: ['不只', '還'] },
  { type: '遞進', words: ['除了', '也'] },
  { type: '遞進', words: ['除了', '還'] },
  { type: '假設', words: ['如果', '就'] },
  { type: '假設', words: ['要是', '就'] },
  { type: '條件', words: ['只要', '就'] },
  { type: '條件', words: ['只有', '才'] },
  { type: '條件', words: ['無論', '都'] },
  { type: '承接', words: ['先', '再'] },
  { type: '承接', words: ['一', '就'] },
  { type: '承接', words: ['先', '再', '最後'] },
  { type: '並列', words: ['一邊', '一邊'] },
  { type: '並列', words: ['一會兒', '一會兒'] },
  { type: '並列', words: ['有人', '有人'] },
  { type: '並列', words: ['有時', '有時'] },
  { type: '讓步', words: ['即使', '也'] },
  { type: '讓步', words: ['就算', '也'] },
  { type: '取捨', words: ['不是', '而是'] },
];

const FAMILY = { 假設: '假設條件', 條件: '假設條件' };
const family = (type) => FAMILY[type] || type;

const KNOWN = new Set(CONNECTIVE_PAIRS.flatMap((p) => p.words));

/** 從句型結構字串（「雖然＋情況，卻＋結果」「先……，再……」）認出關聯詞，照出現順序。 */
export function connectivesInStructure(structure) {
  return String(structure || '')
    .replace(/（[^）]*）/gu, '')
    .split(/[＋+…，,、。？！\s]+/u)
    .filter((w) => KNOWN.has(w));
}

/** 找出和這組關聯詞對應的關聯詞組（取最長的那一組，「先再最後」優先於「先再」）。 */
export function matchPair(words) {
  const candidates = CONNECTIVE_PAIRS.filter((p) => {
    let i = 0;
    for (const w of words) if (w === p.words[i]) i += 1;
    return i === p.words.length;
  });
  return candidates.sort((a, b) => b.words.length - a.words.length)[0] || null;
}

/**
 * 把例句裡的關聯詞挖空。照順序找，下一個關聯詞一定在上一個之後；
 * 找不齊就回 null（例句沒照句型寫，不出題）。
 */
export function blankConnectives(sentence, words) {
  const parts = [];
  let rest = sentence;
  for (const w of words) {
    const at = rest.indexOf(w);
    if (at < 0) return null;
    parts.push(rest.slice(0, at));
    rest = rest.slice(at + w.length);
  }
  parts.push(rest);
  return parts; // parts.length === words.length + 1，關聯詞在各段之間
}

/**
 * 誘答：同樣個數、不同關係家族、不共用任何一個詞，**每個家族最多一組**
 * （不然三個誘答都是「雖然……」，學生只要排除一類就猜中）。
 * @param {(arr:Array)=>Array} [shuffleImpl] 先洗牌再挑，同一題每次的誘答組合才會不同
 */
// 誘答只從「放進去明顯不通」的類型挑，依明顯程度排序。
// 不同類型不代表一定錯：「不但天空下起大雨，而且運動會延期了」文法說得通，
// 因果和遞進常常模糊；「如果我要掃地，就要排椅子」也說得通。
// 所以每種答案只列幾個確定會錯的類型，支持層只有兩個選項時用第一個（最明顯錯的）。
const CLEARLY_WRONG = {
  轉折: ['因果', '並列', '承接'],
  因果: ['轉折', '並列', '讓步'],
  // 遞進（不只……還）是在列舉兩件事，並列、承接、因果放進去常常也通
  // （「我一邊要掃地，一邊要排椅子」），只留語意明顯不合的兩類
  遞進: ['轉折', '讓步'],
  假設條件: ['轉折', '並列', '承接'],
  承接: ['轉折', '讓步', '取捨'],
  並列: ['轉折', '因果', '讓步'],
  讓步: ['因果', '並列', '承接'],
  取捨: ['並列', '承接', '讓步'],
};

export function connectiveDistractors(answer, count, shuffleImpl = (a) => a) {
  const used = new Set(answer.words);
  const out = [];
  for (const wrongType of CLEARLY_WRONG[family(answer.type)] || []) {
    if (out.length >= count) break;
    // 同一類型裡有好幾組時隨機挑一組，同一題每次的誘答不完全一樣
    const pick = shuffleImpl(CONNECTIVE_PAIRS.filter((p) => family(p.type) === wrongType
      && p.words.length === answer.words.length
      && !p.words.some((w) => used.has(w))))[0];
    if (pick) out.push(pick);
  }
  return out;
}

export const pairLabel = (words) => words.join('……');
