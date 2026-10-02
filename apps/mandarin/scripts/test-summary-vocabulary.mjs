// 段落大意要用到該課自己的語詞。
//
// 這條規則有兩個用處：
// 1. 教學上——大意是學生再遇到本課語詞的機會，刻意改寫掉等於浪費一次複習。
//    （CF 2026-10-02 指示：該課生字詞不要刻意改寫）
// 2. 防呆——六上原本那批大意是生成的，整課六筆沒有一個本課語詞，
//    L11 的課文「母親」出現 19 次而大意一次都沒提。這條測試會擋住那種大意。
//
// 門檻刻意訂得低（每課至少 2 個）：不是每個語詞都塞得進大意，硬塞比不塞更糟。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = path.join(appRoot, 'public', 'data');
const MIN_WORDS = 2;

let checked = 0;
for (const volume of fs.readdirSync(dataRoot, { withFileTypes: true }).filter((e) => e.isDirectory() && /^115AG\d/.test(e.name))) {
  for (const filename of fs.readdirSync(path.join(dataRoot, volume.name)).filter((n) => /^lesson\d+\.json$/.test(n))) {
    const lesson = JSON.parse(fs.readFileSync(path.join(dataRoot, volume.name, filename), 'utf8'));
    const summaries = (lesson.paragraph_summary || []).map((p) => p.summary || '').join('');
    const words = (lesson.words || []).map((w) => w.word).filter(Boolean);
    if (!summaries || words.length < MIN_WORDS) continue;
    checked += 1;
    const used = words.filter((word) => summaries.includes(word));
    assert.ok(
      used.length >= MIN_WORDS,
      `${lesson.lesson_id}: 段落大意只用到 ${used.length} 個本課語詞（至少要 ${MIN_WORDS} 個）——`
      + '整課大意都不碰本課語詞，通常表示大意不是從這一課來的',
    );
  }
}

assert.ok(checked >= 40, `應該檢查到多數課次，實際只有 ${checked} 課`);
console.log(`✅ 段落大意語詞：${checked} 課都用到本課語詞`);
