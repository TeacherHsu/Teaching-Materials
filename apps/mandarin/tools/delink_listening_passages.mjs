#!/usr/bin/env node
/**
 * 把 listening[].passage 從「課文明碼」改成「索引參照」。
 *
 * 問題：聽聽看的 passage 是逐字照抄的課文，而且就存在公開的 lesson JSON 裡。
 * 43 課平均覆蓋該課課文的 28%，最高一課 88%——這和先前修掉的 Reading-Tool
 * 明碼漏洞是同一類問題，只是藏在衍生欄位裡。
 *
 * 處置：passage 是課文，就該和課文放在一起（加密），不該另存一份明碼。
 * 改存 passage_ref（第幾段第幾句 + 雜湊），渲染時從解密後的課文取。
 * 代價是聽聽看會需要教室密碼——但它本來就在念課文，要密碼是一致的。
 *
 * 不是照抄課文的 passage（我們自己寫的、或跨課彙編的）保持明碼不動。
 *
 *   node tools/delink_listening_passages.mjs            # 只報告
 *   node tools/delink_listening_passages.mjs --write    # 實際改寫
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lessonSentences, sentenceHash } from './reading_evidence.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const write = process.argv.includes('--write');
const envelope = JSON.parse(readFileSync(path.join(ROOT, 'public/data/readings.enc.json'), 'utf8'));

const norm = (s) => String(s).replace(/[，。！？；：、\s「」『』（）]/g, '');

let converted = 0;
let kept = 0;
let failed = 0;
const touched = new Set();

for (const lessonId of envelope.lessons) {
  const volume = lessonId.slice(0, 7);
  const file = path.join(ROOT, 'public/data', volume, `lesson${lessonId.slice(7)}.json`);
  let lesson;
  try { lesson = JSON.parse(readFileSync(file, 'utf8')); } catch { continue; }
  if (!Array.isArray(lesson.listening) || !lesson.listening.length) continue;

  const paras = await lessonSentences(lessonId);
  let changed = false;

  for (const entry of lesson.listening) {
    if (!entry.passage) continue;
    const want = norm(entry.passage);
    if (want.length < 4) continue;

    // 逐句比對：passage 可能跨段（例如把第 2 段和第 3 段的句子接起來）
    const spots = [];
    let rest = want;
    for (const { para, sentences } of paras) {
      const picked = [];
      const shas = [];
      sentences.forEach((text, index) => {
        const n = norm(text);
        if (n && rest.startsWith(n)) {
          picked.push(index);
          shas.push(sentenceHash(text));
          rest = rest.slice(n.length);
        }
      });
      if (picked.length) spots.push({ para, sentences: picked, sha: shas });
      if (!rest) break;
    }

    if (rest || !spots.length) {
      // 對不上：這段不是逐字照抄的課文（我們自己寫的／彙編的），保持明碼
      kept += 1;
      continue;
    }

    delete entry.passage;
    entry.passage_ref = spots;
    converted += 1;
    changed = true;
  }

  if (changed) {
    touched.add(path.relative(ROOT, file));
    if (write) writeFileSync(file, `${JSON.stringify(lesson, null, 2)}\n`, 'utf8');
  }
}

console.log(`逐字照抄 → 改成索引參照：${converted} 筆`);
console.log(`不是照抄、保持明碼：${kept} 筆`);
console.log(`${touched.size} 個檔案${write ? '已改寫' : '需要改寫（加 --write）'}`);
if (failed) console.error(`✗ ${failed} 筆轉換失敗`);
