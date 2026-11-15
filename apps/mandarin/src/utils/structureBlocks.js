// 「例句拆積木」的資料面：把句型結構字串和例句對起來，算出每一格（誰／做什麼／原因……）
// 裝的是例句的哪一段。純函式、不碰 DOM，方便用資料整批驗證。
//
// 結構字串有兩種寫法：
//   A. 括號是格子、其餘是固定字：「（主詞）是（情況一），也是（情況二）。」
//   B. 用＋串起來：「動詞（動作）＋著＋動詞（做什麼事）」「只要＋條件，就＋結果」
// 規則：括號內的字是格子的白話名稱；沒有括號的一段，如果原樣出現在例句裡就是固定字
// （著、的、如果、不但），否則是格子（名詞、動詞、條件、結果）。
// 對不起來就回傳 null——寧可不出這一題，也不要把語塊放錯格子教錯結構。

const PUNCT = '，。！？、；：,.!?;:';
const PUNCT_RE = new RegExp(`[${PUNCT}]`, 'u');

/** 詞性術語換成學生聽得懂的問法；括號裡已經有白話的就用括號裡的。 */
const PLAIN_LABEL = [
  [/疊字形容詞/u, '怎麼樣'],
  [/單位量詞|量詞/u, '多少'],
  [/形容詞/u, '怎麼樣'],
  [/副詞/u, '怎麼做'],
  [/動詞/u, '做什麼'],
  [/名詞/u, '人或東西'],
  [/主詞|主語/u, '誰'],
  [/時間詞?/u, '什麼時候'],
  [/地方|地點|處所/u, '在哪裡'],
];

export function plainSlotLabel(label) {
  const text = String(label || '').trim().replace(/^加上/u, '');
  if (/抽象動作/u.test(text)) return '做什麼';
  for (const [re, plain] of PLAIN_LABEL) if (re.test(text) && text.length <= 7) return plain;
  return text;
}

/** 結構字串 → [{ type: 'slot', label } | { type: 'lit', text } | { type: 'punct', text }] */
export function parseStructure(structure, example = '') {
  const source = String(structure || '').replace(/[+]/gu, '＋').replace(/[(︵]/gu, '（').replace(/[)︶]/gu, '）').trim();
  if (!source) return [];
  const sentence = String(example || '');
  const tokens = [];
  const pushBare = (bare) => {
    const text = bare.trim();
    if (!text) return;
    // 省略號是「這裡可以放東西」的記號，不是固定字
    if (/^[…．.]+$/u.test(text)) return;
    if (sentence.includes(text)) tokens.push({ type: 'lit', text });
    else tokens.push({ type: 'slot', label: plainSlotLabel(text) });
  };
  for (const segment of source.split('＋')) {
    let rest = segment;
    while (rest) {
      const punct = rest.match(new RegExp(`^[${PUNCT}\\s]+`, 'u'));
      if (punct) {
        if (PUNCT_RE.test(punct[0])) tokens.push({ type: 'punct', text: punct[0].trim() });
        rest = rest.slice(punct[0].length);
        continue;
      }
      // 「動詞（動作）」：前面的術語是詞性，括號裡是白話 → 一格
      const labelled = rest.match(/^([^（），。！？、；：\s]*)（([^（）]+)）/u);
      if (labelled) {
        const [whole, before, inner] = labelled;
        if (before && sentence.includes(before)) {
          tokens.push({ type: 'lit', text: before });
          tokens.push({ type: 'slot', label: plainSlotLabel(inner) });
        } else {
          tokens.push({ type: 'slot', label: plainSlotLabel(inner) });
        }
        rest = rest.slice(whole.length);
        continue;
      }
      const bare = rest.match(new RegExp(`^[^（${PUNCT}\\s]+`, 'u'));
      if (!bare) return [];
      pushBare(bare[0]);
      rest = rest.slice(bare[0].length);
    }
  }
  return tokens;
}

const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
const strip = (text) => String(text || '').replace(new RegExp(`^[${PUNCT}\\s]+|[${PUNCT}\\s]+$`, 'gu'), '');

/**
 * 把例句切進結構的格子。
 * @returns {null | { frame: Array<{type:'slot', label:string, text:string} | {type:'lit', text:string}>, slots: Array<{label:string, text:string}> }}
 */
export function alignExample(structure, example, manualParts = null) {
  const sentence = String(example || '').trim();
  const tokens = parseStructure(structure, sentence);
  const slotCount = tokens.filter((t) => t.type === 'slot').length;
  if (slotCount < 2) return null;
  // 標點只在「夾在兩格中間」時留著當界線（假如（情況），（結果）。）；其他位置的標點可有可無
  const content = tokens.filter((t, i) => t.type !== 'punct'
    || (tokens[i - 1]?.type === 'slot' && tokens[i + 1]?.type === 'slot'));
  // 結構從固定字開頭（一方面……），例句卻先說了主角（公共藝術一方面……）：前面補一格
  const first = content[0];
  if (first?.type === 'lit' && sentence.indexOf(first.text) > 0 && !manualParts) {
    content.unshift({ type: 'slot', label: '誰或什麼' });
  }
  const real = content.filter((t) => t.type !== 'punct');

  let frame = null;
  // 教材已經人工拆好語塊、塊數又和結構一一對應：直接用，最可靠
  if (Array.isArray(manualParts) && manualParts.length === real.length
    // 固定字那一塊最多比結構多 3 個字（就 → 就一定會）；多更多代表人工語塊把內容也併進去了，改用字面對位
    && real.every((t, i) => t.type !== 'lit'
      || (strip(manualParts[i]).includes(t.text) && [...strip(manualParts[i])].length <= [...t.text].length + 3))) {
    frame = real.map((t, i) => (t.type === 'slot'
      ? { type: 'slot', label: t.label, text: strip(manualParts[i]) }
      // 人工語塊的固定字可能比結構多幾個字（就 → 就一定會）：照例句原樣顯示，句子才拼得回去
      : { type: 'lit', text: strip(manualParts[i]) }));
  } else {
    // 兩格相鄰、中間沒有固定字也沒有標點，就沒辦法從字面知道界線在哪 → 不猜
    for (let i = 1; i < content.length; i += 1) {
      if (content[i].type === 'slot' && content[i - 1].type === 'slot') return null;
    }
    const lastSlot = content.map((t) => t.type).lastIndexOf('slot');
    const pattern = content.map((t, i) => {
      if (t.type === 'punct') return `[${PUNCT}]+\\s*`;
      if (t.type === 'lit') return `[${PUNCT}\\s]*${escapeRe(t.text)}`;
      return `(${i === lastSlot ? '.+' : '.+?'})`;
    }).join('');
    const match = sentence.match(new RegExp(`^${pattern}[${PUNCT}\\s]*$`, 'u'));
    if (!match) return null;
    let group = 0;
    frame = content.map((t) => {
      if (t.type === 'punct') return { type: 'lit', text: '，' };
      return t.type === 'slot'
        ? { type: 'slot', label: t.label, text: strip(match[group += 1]) }
        : { type: 'lit', text: t.text };
    });
  }

  const slots = frame.filter((t) => t.type === 'slot');
  if (slots.some((s) => !s.text)) return null;
  // 品質門檻：2～3 格；至少要有一個固定字（不然只是排順序）；語塊裡不能夾標點（多半是切歪了）；
  // 格子名稱要短、不能是「先……」這種沒有意思的記號
  if (slots.length > 3) return null;
  if (!frame.some((t) => t.type === 'lit' && t.text !== '，')) return null;
  if (slots.some((s) => PUNCT_RE.test(s.text) || /[…．]/u.test(s.label) || [...s.label].length > 9)) return null;
  // 兩格裝的字一樣（看一看、走一走）：學生放哪一格都對，問不出結構
  if (new Set(slots.map((s) => s.text)).size !== slots.length) return null;
  // 同一句裡格子名稱重複（動作＋著＋動作）就加上順序，問法才不會模稜兩可
  const seen = new Map();
  const total = new Map();
  for (const s of slots) total.set(s.label, (total.get(s.label) || 0) + 1);
  for (const s of slots) {
    if (total.get(s.label) > 1) {
      const n = (seen.get(s.label) || 0) + 1;
      seen.set(s.label, n);
      s.label = `第 ${n} 個${s.label}`;
    }
  }
  return { frame, slots };
}

/** 句型框架的顯示文字：「＿＿是＿＿，也是＿＿」 */
export function frameText(frame) {
  // 兩格相鄰時中間留一個空白，不然會連成一條長底線，看不出是兩格
  return frame.map((t, i) => (t.type === 'slot' ? `${frame[i - 1]?.type === 'slot' ? ' ' : ''}＿＿` : t.text)).join('');
}

/**
 * 一個句型裡所有對得起來的例句（最多 perPattern 句）。同一個框架換不同內容，
 * 學生才看得出「格子不變、裡面的東西會換」。
 */
export function alignPattern(pattern, { perPattern = 2 } = {}) {
  const out = [];
  if (!pattern?.structure) return out;
  const examples = pattern.examples || [];
  for (let i = 0; i < examples.length && out.length < perPattern; i += 1) {
    const aligned = alignExample(pattern.structure, examples[i], pattern.example_parts?.[i]);
    if (aligned) out.push({ example_index: i, sentence: examples[i], ...aligned });
  }
  return out;
}
