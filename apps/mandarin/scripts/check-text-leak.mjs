#!/usr/bin/env node
/**
 * 課文明碼外洩檢查。
 *
 * 課文全文只能以密文存在站上（sped-os ADR-0034）。但衍生欄位很容易把課文
 * 句子逐字抄進公開的 lesson JSON——聽聽看的短文、修辭的例句、句型的樣式
 * 都踩過這個坑。這支把它量出來並設上限，避免再慢慢漏回去。
 *
 * 刻意**不是**零容忍：
 *   · 課名與作者本來就公開（而且課文第一行就是它們），不計入。
 *   · 修辭例句、句型樣式這類「那句話本身就是教學對象」的單句引用，
 *     是教材的正常用法，不該為了數字好看而拿掉。
 * 設的是**可還原比例**的上限：單課不得超過 60%，全站不得超過 20%。
 * 超過就代表有人又把整段課文抄進衍生欄位了。
 *
 *   node scripts/check-text-leak.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ENC = path.join(ROOT, 'public/data/readings.enc.json');
if (!existsSync(ENC)) {
  console.log('⚠ 找不到 readings.enc.json，跳過（這台電腦沒有 mandarin-work）');
  process.exit(0);
}

globalThis.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
globalThis.atob = (s) => Buffer.from(s, 'base64').toString('binary');
globalThis.btoa = (s) => Buffer.from(s, 'binary').toString('base64');
const envelope = JSON.parse(readFileSync(ENC, 'utf8'));
globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => envelope });

const K = await import('../src/utils/classroomKey.js');
await K.unlockWithPassword(process.env.CLASSROOM_PASSWORD || '3939889');
const { splitSentences } = await import('../src/utils/readingUnits.js');

const PER_LESSON_MAX = 60;
const OVERALL_MAX = 20;
// 單課的百分比門檻只套用在「夠長」的課文。
// 一年級的詩整首只有 40 幾字、七行每行 5–7 字，句型練習要教「秋千一下子高」，
// 那句話本身就是教學對象——任何教材都會引用掉大半。對這麼短的文本，
// 百分比是失效的指標，不是真的外洩。這類課次由全站門檻一起把關。
const MIN_LENGTH_FOR_RATIO = 80;
const norm = (s) => String(s).replace(/[，。！？；：、\s「」『』（）]/g, '');

let totalChars = 0;
let leakedChars = 0;
let failed = false;
const rows = [];

for (const lessonId of envelope.lessons) {
  const volume = lessonId.slice(0, 7);
  const file = path.join(ROOT, 'public/data', volume, `lesson${lessonId.slice(7)}.json`);
  if (!existsSync(file)) continue;
  const lesson = JSON.parse(readFileSync(file, 'utf8'));

  // 課名與作者不計：它們本來就公開，而課文第一行就是它們
  const skip = new Set([norm(lesson.title), norm(lesson.author || '')]);
  const clone = { ...lesson };
  delete clone.title;
  delete clone.author;
  const haystack = norm(JSON.stringify(clone));

  const reading = K.getReading(lessonId);
  const sentences = [...new Set(splitSentences(reading.paras).map((s) => norm(s.text)))]
    .filter((s) => s.length >= 5 && !skip.has(s));
  const fullLength = norm(reading.paras.flat(2).map((t) => t[0]).join('')).length;

  const hit = sentences.filter((s) => haystack.includes(s));
  const chars = hit.join('').length;
  totalChars += fullLength;
  leakedChars += chars;
  const pct = fullLength ? (chars / fullLength) * 100 : 0;
  rows.push({ lessonId, chars, fullLength, pct });

  if (fullLength >= MIN_LENGTH_FOR_RATIO && pct > PER_LESSON_MAX) {
    console.error(`[FAIL] ${lessonId}：課文有 ${pct.toFixed(0)}% 可從公開的 lesson JSON 還原`
      + `（${chars}/${fullLength} 字，上限 ${PER_LESSON_MAX}%）`);
    failed = true;
  }
}

const overall = totalChars ? (leakedChars / totalChars) * 100 : 0;
console.log(`課文明碼外洩：全站 ${overall.toFixed(1)}%（${leakedChars}/${totalChars} 字，上限 ${OVERALL_MAX}%）`);
rows.sort((a, b) => b.pct - a.pct);
console.log(`最高的 3 課（只列課文 ${MIN_LENGTH_FOR_RATIO} 字以上的）：`);
for (const r of rows.filter((x) => x.fullLength >= MIN_LENGTH_FOR_RATIO).slice(0, 3)) {
  console.log(`  ${r.lessonId}  ${r.chars}/${r.fullLength} 字  ${r.pct.toFixed(0)}%`);
}
const shortOnes = rows.filter((x) => x.fullLength < MIN_LENGTH_FOR_RATIO);
if (shortOnes.length) {
  console.log(`（${shortOnes.length} 課課文不足 ${MIN_LENGTH_FOR_RATIO} 字，不套用單課比例門檻）`);
}
if (overall > OVERALL_MAX) {
  console.error(`[FAIL] 全站外洩 ${overall.toFixed(1)}% 超過上限 ${OVERALL_MAX}%`);
  failed = true;
}
if (failed) {
  console.error('\n修正方向：把逐字照抄課文的欄位改成索引參照'
    + '（見 tools/delink_listening_passages.mjs 與 components/EvidencePanel.js 的 resolveSpots）。');
  process.exit(1);
}
console.log('✅ 在上限之內');
