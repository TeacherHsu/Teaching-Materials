#!/usr/bin/env node
/**
 * 從教育百科抓取語詞注音，產出待審清單（不直接寫入教材）。
 *
 * 為什麼一定要人工複核：
 * - **變調**：「一起」在簡編本是 ㄧ ㄑㄧˇ（本調），修訂本作 ㄧˋ ㄑㄧˇ（變調）。
 *   課本用哪一個要看語境，辭典不會替我們決定。
 * - **多音**：「東西」有 ㄉㄨㄥ ㄒㄧ 與 ㄉㄨㄥ ㄒㄧ˙ 兩讀。
 * 因此本腳本只負責抓取與標記分歧，核定一律由教師處理
 * （比照 memory：讀音以教師裁定優先）。
 *
 * 注音藏在 <div class="zhuyin-h-item tone-N-M"><span class="bottom">符號</span></div>，
 * **聲調編在 class 名稱裡，不在文字內**——只讀可見文字會整批掉聲調。
 *
 *   node scripts/fetch-word-zhuyin.mjs --volume 115AG3H [--limit 20]
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const volume = opt('volume');
const limit = Number(opt('limit') || 0);
if (!volume) { console.error('需要 --volume'); process.exit(1); }

const TONE_MARK = { 0: '˙', 1: '', 2: 'ˊ', 3: 'ˇ', 4: 'ˋ' };
const ITEM_RE = /<div class="zhuyin-h-item tone-(\d)-\d">[\s\S]*?<span class="bottom">([^<]*)<\/span>/g;

function parseGroups(html, charCount) {
  const items = [];
  let m;
  ITEM_RE.lastIndex = 0;
  while ((m = ITEM_RE.exec(html)) !== null) {
    items.push({ tone: Number(m[1]), symbols: m[2].trim() });
  }
  // 頁面會重複列出多本辭典的讀音；依字數切成一組一組
  const groups = [];
  for (let i = 0; i + charCount <= items.length; i += charCount) {
    const group = items.slice(i, i + charCount);
    if (group.some((it) => !it.symbols)) continue;
    groups.push(group.map((it) => `${it.symbols}${TONE_MARK[it.tone] ?? ''}`).join(' '));
  }
  return [...new Set(groups)];
}

const dataRoot = fileURLToPath(new URL('../public/data/', import.meta.url));
const pending = [];
for (const filename of readdirSync(join(dataRoot, volume)).filter((n) => /^lesson\d+\.json$/.test(n))) {
  const lesson = JSON.parse(readFileSync(join(dataRoot, volume, filename), 'utf8'));
  for (const w of lesson.words || []) {
    if (!w.zhuyin && w.word) pending.push({ lessonId: lesson.lesson_id, id: w.id, word: w.word });
  }
}
const todo = limit > 0 ? pending.slice(0, limit) : pending;
console.log(`${volume}：${pending.length} 個語詞缺注音，本次處理 ${todo.length} 個`);

const results = [];
for (const [i, item] of todo.entries()) {
  const url = `https://pedia.cloud.edu.tw/Entry/Detail?title=${encodeURIComponent(item.word)}`;
  let readings = [];
  let error = '';
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (teaching-material lookup)' } });
    if (res.ok) readings = parseGroups(await res.text(), [...item.word].length);
    else error = `HTTP ${res.status}`;
  } catch (err) {
    error = err.message;
  }
  results.push({ ...item, url, readings, error, needsCheck: readings.length !== 1 });
  process.stdout.write(`\r  ${i + 1}/${todo.length} ${item.word}   `);
  await new Promise((r) => setTimeout(r, 350));   // 對公家網站客氣一點
}
console.log('');

const reportDir = join(homedir(), 'mandarin-work', volume, 'reports');
mkdirSync(reportDir, { recursive: true });
writeFileSync(join(reportDir, 'word-zhuyin-fetched.json'), `${JSON.stringify(results, null, 2)}\n`, 'utf8');

const single = results.filter((r) => r.readings.length === 1);
const multi = results.filter((r) => r.readings.length > 1);
const none = results.filter((r) => r.readings.length === 0);
const md = [
  `# ${volume} 語詞注音抓取結果（待 CF 審核）`, '',
  '來源：教育百科 `Entry/Detail`。聲調由 `zhuyin-h-item tone-N` 的 class 取得',
  '（頁面可見文字會掉聲調，不能直接讀）。', '',
  '**一定要人工複核**：辭典給的是本調，課本可能用變調（例如「一」「不」）；',
  '多音詞也要看語境挑一個。讀音以教師裁定為準。', '',
  `| 狀態 | 筆數 |`, `|---|---|`,
  `| 只有一種讀音（可直接採用） | ${single.length} |`,
  `| 多種讀音（要挑一個） | ${multi.length} |`,
  `| 查不到 | ${none.length} |`, '',
  '## 只有一種讀音', '', '| 課次 | 語詞 | 注音 |', '|---|---|---|',
  ...single.map((r) => `| ${r.lessonId} | ${r.word} | ${r.readings[0]} |`), '',
  '## 多種讀音（請挑一個）', '', '| 課次 | 語詞 | 候選讀音 |', '|---|---|---|',
  ...multi.map((r) => `| ${r.lessonId} | ${r.word} | ${r.readings.join('　／　')} |`), '',
  '## 查不到（需另尋來源或教師自訂）', '', ...none.map((r) => `- ${r.lessonId} ${r.word}${r.error ? `（${r.error}）` : ''}`),
].join('\n');
writeFileSync(join(reportDir, 'word-zhuyin-review.md'), md, 'utf8');
console.log(`單一讀音 ${single.length}／多讀音 ${multi.length}／查不到 ${none.length}`);
console.log(`報告：${join(reportDir, 'word-zhuyin-review.md')}`);
