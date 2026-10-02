#!/usr/bin/env node
/**
 * 證據句的「候選建議」工具。
 *
 * 逐題人工找答案在哪一句很慢。這支用答案與題幹的字詞去課文裡找候選句，
 * 把最可能的幾句排出來，人只要覆核與微調——**不是自動標注**。
 * 判定「這句是不是答案的證據」需要讀懂課文，機器的相似度只能縮小範圍。
 *
 *   node tools/suggest_evidence.mjs <lesson_id>
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lessonSentences, sentenceHash } from './reading_evidence.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const lessonId = process.argv[2];
if (!lessonId) { console.error('用法：node tools/suggest_evidence.mjs <lesson_id>'); process.exit(1); }

const volume = lessonId.slice(0, 7);
const lesson = JSON.parse(readFileSync(path.join(ROOT, 'public/data', volume, `lesson${lessonId.slice(7)}.json`), 'utf8'));
const paras = await lessonSentences(lessonId);

/** 停用詞：這些字到處都是，拿來比對只會製造雜訊。 */
const STOP = new Set([...'的了是在我你他她我們他們有和與也就都很不沒這那什麼嗎呢吧啊中上下為以而或者之其所以因此但']);

function tokens(text) {
  return [...String(text)].filter((c) => /[㐀-鿿]/.test(c) && !STOP.has(c));
}

/** 候選分數：答案的字權重最高，題幹次之。連續命中加分（避免零散單字湊出高分）。 */
function score(sentence, answerChars, stemChars) {
  const s = [...sentence];
  let hit = 0;
  let run = 0;
  let best = 0;
  for (const ch of s) {
    const w = answerChars.has(ch) ? 3 : stemChars.has(ch) ? 1 : 0;
    hit += w;
    run = w ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return hit + best * 2;
}

console.log(`${lessonId}　${lesson.title}\n`);
for (const q of lesson.reading_questions || []) {
  const answerChars = new Set(tokens(q.answer || ''));
  const stemChars = new Set(tokens(q.stem || ''));
  const ranked = [];
  for (const { para, sentences } of paras) {
    sentences.forEach((text, index) => {
      const value = score(text, answerChars, stemChars);
      if (value > 0) ranked.push({ para, index, text, value, sha: sentenceHash(text) });
    });
  }
  ranked.sort((a, b) => b.value - a.value);
  console.log(`▸ ${q.stem}`);
  console.log(`  答案：${q.answer}`);
  if (!ranked.length) { console.log('  （沒有候選，要人工找）\n'); continue; }
  for (const r of ranked.slice(0, 4)) {
    console.log(`    ${String(r.value).padStart(3)}分  第${r.para}段 #${r.index}  ${r.sha}  ${r.text}`);
  }
  console.log();
}
console.log('※ 這只是候選。要不要採用、要不要連相鄰句一起標，由人判斷。');
