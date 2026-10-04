// 形似字資料健檢：字要出現在自己的例詞裡，且不可是「例詞首字」誤植（例詞另有共同字）。
// （四上曾整批把「例詞的第一個字」當成形似字：秀／誘存成秀／引。）
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dataRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data');
// 已人工確認字是對的（例詞第二個詞剛好借用了別的字，不是匯入錯誤）
const REVIEWED = new Set([
  'lookalike:115AG6H07:08', // 恫洞桐銅：洞簫、笙簫 → 「洞」正確
  'lookalike:115AG6H09:01', // 鬆鬚鬍髮鬟：鬍鬚、鬚根 → 「鬍」正確（鬚是同組另一字）
]);
const bad = [];
let checked = 0;
for (const vol of fs.readdirSync(dataRoot).filter((n) => /^115AG\d/.test(n))) {
  for (const f of fs.readdirSync(path.join(dataRoot, vol)).filter((n) => /^lesson\d+\.json$/.test(n))) {
    const L = JSON.parse(fs.readFileSync(path.join(dataRoot, vol, f), 'utf8'));
    for (const g of L.lookalikes || []) {
      for (const c of g.chars || []) {
        const words = String(c.example || '').split(/[、,，]/u).map((w) => w.trim()).filter(Boolean);
        if (!words.length || !c.char) continue;
        checked += 1;
        // 字至少要出現在某一個例詞裡（例詞偶爾附上不含該字的相關詞，如「遷徙、遷移」，那一個不出題，無妨）
        if (!words.some((w) => w.includes(c.char))) { bad.push(`${L.lesson_id} ${g.id}：「${c.char}」不在任何例詞裡`); continue; }
        // 四上匯入錯誤的特徵：字是第一個例詞的首字、其他例詞都沒有它，而例詞另有共同字
        if (!REVIEWED.has(g.id) && words.length >= 2 && words[0][0] === c.char && words.slice(1).every((w) => !w.includes(c.char))) {
          const common = [...words[0]].filter((ch) => words.every((w) => w.includes(ch)));
          if (common.length) bad.push(`${L.lesson_id} ${g.id}：「${c.char}」像是例詞首字，例詞共有的是「${common.join('')}」`);
        }
      }
    }
  }
}
assert.equal(bad.length, 0, `形似字資料有誤：\n${bad.join('\n')}`);
console.log(`✅ ${checked} 個形似字都出現在自己的例詞裡`);
