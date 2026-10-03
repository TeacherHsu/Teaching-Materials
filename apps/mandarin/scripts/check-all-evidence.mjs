// 逐課驗證證據句雜湊（審查建議：瀏覽時只依索引取句、不比對 sha，
// 所以要在資料驗證階段擋：任何一句對不上就整個失敗，免得標錯句還告訴學生那是線索）。
// 需要本機有教室密碼可解密課文；CI 沒有密碼時跳過。
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = path.join(root, 'public', 'data');
let bad = 0; let ok = 0;
for (const vol of fs.readdirSync(data).filter((n) => /^115AG\d/.test(n))) {
  for (const f of fs.readdirSync(path.join(data, vol)).filter((n) => /^lesson\d+\.json$/.test(n))) {
    const lesson = JSON.parse(fs.readFileSync(path.join(data, vol, f), 'utf8'));
    const has = (lesson.reading_questions || []).some((q) => q.evidence?.length)
      || (lesson.paragraph_summary || []).some((p) => p.text_spots?.length);
    if (!has) continue;
    try {
      execFileSync('node', ['tools/reading_evidence.mjs', 'check', lesson.lesson_id], { cwd: root, stdio: 'pipe' });
      ok += 1;
    } catch (e) {
      bad += 1;
      console.error(`✗ ${lesson.lesson_id}\n${String(e.stdout || '')}${String(e.stderr || '').split('\n')[0]}`);
    }
  }
}
if (bad) { console.error(`證據句對不上：${bad} 課`); process.exit(1); }
console.log(`✅ ${ok} 課的證據句雜湊全部對得上`);
