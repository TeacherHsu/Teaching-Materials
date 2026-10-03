#!/usr/bin/env node
/**
 * 一上／二上「開放問答」自動配證據句：用題幹＋參考答案和課文逐句比「雙字詞重疊」，
 * 只在分數夠高時才配（寧缺勿錯）。看圖題（題幹提到插圖／圖）不配。
 *
 *   node tools/match_open_evidence.mjs            # 只報告（印出配到的句子供人工抽查）
 *   node tools/match_open_evidence.mjs --write    # 寫入 evidence 與三層 hints
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lessonSentences, sentenceHash } from './reading_evidence.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const write = process.argv.includes('--write');
const han = (s) => String(s).replace(/[^㐀-鿿]/g, '');
const bigrams = (s) => { const t = han(s); const out = new Set(); for (let i = 0; i < t.length - 1; i += 1) out.add(t.slice(i, i + 2)); return out; };
const STOP = new Set(['什麼', '為什', '麼會', '課文', '一個', '他們', '我們', '你們', '因為', '所以', '可以', '覺得', '這個', '那個', '怎麼', '如何', '哪裡', '哪些', '是什', '想一', '一想', '說說']);

let matched = 0; let skipped = 0;
for (const vol of ['115AG1H', '115AG2H']) {
  for (const f of readdirSync(path.join(ROOT, 'public/data', vol)).filter((n) => /^lesson\d+\.json$/.test(n)).sort()) {
    const file = path.join(ROOT, 'public/data', vol, f);
    const lesson = JSON.parse(readFileSync(file, 'utf8'));
    let paras;
    try { paras = await lessonSentences(lesson.lesson_id); } catch { continue; }
    let changed = false;
    for (const q of lesson.reading_questions || []) {
      if (q.options?.length) continue;
      if (/插圖|圖中|圖片|畫面|看圖/.test(q.stem)) { skipped += 1; continue; }
      // 開放思考、整課歸納、查字典這類題目，答案不在某一句裡，不配證據
      if (/想一想|說一說|你覺得|你認為|取名|字典|整首|整課|如果你|你會/.test(q.stem)) { skipped += 1; continue; }
      // 只用參考答案比對：題幹會和「某某說：」這種引述句撞詞
      const key = new Set([...bigrams(q.answer_hint || '')].filter((b) => !STOP.has(b)));
      const scored = [];
      for (const { para, sentences } of paras) {
        sentences.forEach((text, i) => {
          if (para === 1 && i === 0 && han(text) === han(lesson.title)) return; // 課名
          if (/^[^，。！？]{1,6}[：:]$/.test(text.trim())) return; // 「媽媽說：」引述開頭
          const b = bigrams(text);
          let hit = 0; for (const x of b) if (key.has(x)) hit += 1;
          if (b.size && hit >= 2) scored.push({ para, i, text, hit, ratio: hit / b.size });
        });
      }
      scored.sort((a, b) => b.hit - a.hit || b.ratio - a.ratio);
      const best = scored[0];
      if (!best || best.hit < 3 || best.ratio < 0.35) { skipped += 1; continue; }
      // 取最佳句，再加同段中分數 ≥ 最佳一半的句子（最多 3 句）
      const picks = scored.filter((s) => s.para === best.para && s.hit * 2 >= best.hit).slice(0, 3).sort((a, b) => a.i - b.i);
      matched += 1;
      console.log(`${lesson.lesson_id} ${q.stem}\n   → 第${best.para}段 ${picks.map((p) => p.text).join('')}`);
      if (write) {
        q.evidence = [{ para: best.para, sentences: picks.map((p) => p.i), sha: picks.map((p) => sentenceHash(p.text)) }];
        q.evidence_method = 'auto:bigram-overlap 2026-10-03';
        changed = true;
      }
    }
    if (changed) writeFileSync(file, `${JSON.stringify(lesson, null, 2)}\n`);
  }
}
console.log(`\n配到 ${matched} 題；未配（看圖題或分數不足）${skipped} 題`);
