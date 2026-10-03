#!/usr/bin/env node
/**
 * 閱讀理解「證據句」工具。
 *
 * 證據句是提示系統的樞紐——第 3 層提示要在課文上用螢光筆畫出答案所在的句子。
 * 但課文有版權，**不可以**把句子明碼存進 public/data 的 lesson JSON
 * （那等於把課文片段漏到公開 repo，牴觸 sped-os ADR-0034）。
 *
 * 所以證據存成「索引 + 雜湊」：
 *   索引（para / sentences）負責定位——渲染時從解密後的課文取那幾句。
 *   雜湊（sha）負責驗證——課文改過而索引沒跟著改時會被抓出來，不會默默畫錯句子。
 *
 * 用法：
 *   node tools/reading_evidence.mjs list <lesson_id>      # 印出編號後的句子，供人工標注
 *   node tools/reading_evidence.mjs check <lesson_id>     # 驗證已標注的證據（含詩句解碼）還對得上
 *   node tools/reading_evidence.mjs check <lesson_id> --show  # 另外印出詩句與白話意思對照
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// 最小環境：classroomKey 要 window / atob / fetch
globalThis.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
globalThis.atob = (s) => Buffer.from(s, 'base64').toString('binary');
globalThis.btoa = (s) => Buffer.from(s, 'binary').toString('base64');
const ENC = path.join(ROOT, 'public/data/readings.enc.json');
globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => JSON.parse(readFileSync(ENC, 'utf8')) });

import { classroomPassword } from '../scripts/classroom-password.mjs';
const PASSWORD = classroomPassword();
if (!PASSWORD) throw new Error('需要教室密碼：設 CLASSROOM_PASSWORD 或建立 ~/mandarin-work/.classroom-password');

/** 句子的雜湊：只取前 8 碼，夠驗證又不會變成另一種形式的明碼。 */
export function sentenceHash(text) {
  return createHash('sha256').update(text).digest('hex').slice(0, 8);
}

/**
 * 把一課的課文切成「每段一組句子」，索引穩定。
 * @returns {Array<{para:number, sentences:string[]}>}
 */
export async function lessonSentences(lessonId) {
  const K = await import('../src/utils/classroomKey.js');
  await K.unlockWithPassword(PASSWORD);
  const reading = K.getReading(lessonId);
  if (!reading) throw new Error(`${lessonId} 沒有課文（或密碼不對）`);
  const { splitSentences } = await import('../src/utils/readingUnits.js');
  const flat = splitSentences(reading.paras);
  const byPara = new Map();
  for (const s of flat) {
    if (!byPara.has(s.paraIndex)) byPara.set(s.paraIndex, []);
    byPara.get(s.paraIndex).push(s.text);
  }
  return [...byPara.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([paraIndex, sentences]) => ({ para: paraIndex + 1, sentences }));
}

// 這支同時是 CLI 與函式庫（delink_listening_passages.mjs 會 import 它），
// 所以只有「直接執行」時才跑 CLI，被 import 時不要有副作用。
const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
const [, , cmd, lessonId] = process.argv;

if (!isCli) {
  // 被 import：什麼都不做
} else if (cmd === 'list') {
  const paras = await lessonSentences(lessonId);
  console.log(`${lessonId}　${paras.length} 段\n`);
  for (const { para, sentences } of paras) {
    console.log(`【第 ${para} 段】`);
    sentences.forEach((text, i) => {
      console.log(`  ${String(i).padStart(2)}  ${sentenceHash(text)}  ${text}`);
    });
    console.log();
  }
} else if (cmd === 'check') {
  const paras = await lessonSentences(lessonId);
  const byPara = new Map(paras.map((p) => [p.para, p.sentences]));
  const volume = lessonId.slice(0, 7);
  const file = path.join(ROOT, 'public/data', volume, `lesson${lessonId.slice(7)}.json`);
  const lesson = JSON.parse(readFileSync(file, 'utf8'));
  let checked = 0;
  let bad = 0;
  // 詩句解碼的詩句也是存位置＋雜湊，一起檢查；--show 會把詩句和白話意思印出來對照
  const decode = (lesson.genre_activity?.type === 'decode' ? lesson.genre_activity.pairs : [])
    .map((pair, i) => ({ id: `decode:${i + 1}`, line: pair.line, meaning: pair.meaning }));
  const owners = [...(lesson.reading_questions || []), ...decode];
  for (const q of owners) {
    if (q.meaning && process.argv.includes('--show')) {
      const sentences = byPara.get(q.line.para) || [];
      console.log(`  ${q.line.sentences.map((i) => sentences[i]).join('')}  →  ${q.meaning}`);
    }
    for (const key of ['evidence', 'context', 'line']) {
      const spots = q[key];
      if (!spots) continue;
      for (const spot of Array.isArray(spots) ? spots : [spots]) {
        const sentences = byPara.get(spot.para);
        if (!sentences) { console.error(`✗ ${q.id} ${key}：第 ${spot.para} 段不存在`); bad += 1; continue; }
        spot.sentences.forEach((index, k) => {
          checked += 1;
          const text = sentences[index];
          if (text === undefined) { console.error(`✗ ${q.id} ${key}：第 ${spot.para} 段沒有第 ${index} 句`); bad += 1; return; }
          const want = spot.sha?.[k];
          if (want && sentenceHash(text) !== want) {
            console.error(`✗ ${q.id} ${key}：第 ${spot.para} 段第 ${index} 句的內容變了（雜湊對不上）`);
            bad += 1;
          }
        });
      }
    }
  }
  console.log(bad ? `✗ ${bad} 處對不上（共檢查 ${checked} 句）` : `✅ ${checked} 句證據全部對得上`);
  process.exit(bad ? 1 : 0);
} else {
  console.error('用法：node tools/reading_evidence.mjs list|check <lesson_id>');
  process.exit(1);
}
