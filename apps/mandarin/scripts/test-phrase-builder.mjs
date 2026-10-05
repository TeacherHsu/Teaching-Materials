// 照樣造短語：判定資料化、能分「結構錯」「意思怪」「合理但不是這張圖」「符合圖片」；
// 每一課的資料都要能追溯到官方短語（pattern_ref）、每種結構正確的組合都有判定。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { installFakeDom } from './fake-dom.mjs';
installFakeDom();
const { judgePhrase } = await import('../src/activities/phraseBuilder.js');

const root = new URL('../public/data/', import.meta.url).pathname;
let n = 0;
for (const vol of fs.readdirSync(root).filter((d) => d.startsWith('115AG'))) {
  for (const f of fs.readdirSync(path.join(root, vol)).filter((x) => /^lesson\d+\.json$/.test(x))) {
    const lesson = JSON.parse(fs.readFileSync(path.join(root, vol, f), 'utf8'));
    for (const spec of lesson.phrase_builders || []) {
      n += 1;
      const ref = (lesson.sentence_patterns || []).find((p) => p.id === spec.pattern_ref);
      assert.ok(ref, `${spec.id} 要對應到官方短語（sentence_patterns）`);
      assert.equal(spec.example.chunks.join(''), ref.head, `${spec.id} 示範必須是課本的短語`);
      assert.ok(spec.source, `${spec.id} 要標來源`);
      // copy_of 的格子跟著來源格，不是自由選（實際畫面選不出「兩格不一樣」的組合）
      const byRole = spec.slots.map((s) => (s.fixed ? [s.fixed] : s.copy_of !== undefined ? [null] : spec.bank.filter((b) => b.role === s.role).map((b) => b.text)));
      const combos = byRole.reduce((acc, list) => acc.flatMap((a) => list.map((x) => [...a, x])), [[]])
        .map((c) => c.map((x, i) => (spec.slots[i].copy_of !== undefined ? c[spec.slots[i].copy_of] : x)));
      spec.slots.forEach((s, i) => { if (s.copy_of !== undefined) assert.ok(s.copy_of < i, `${spec.id} copy_of 要指向前面的格子`); });
      for (const c of combos) {
        const known = (spec.accepted || []).some((a) => a.join() === c.join()) || (spec.semantic_rejects || []).some((r) => r.chunks.join() === c.join());
        assert.ok(known, `${spec.id}「${c.join('')}」沒有判定（要放進 accepted 或 semantic_rejects）`);
      }
      for (const r of spec.rounds) {
        assert.ok((spec.accepted || []).some((a) => a.join() === r.answer.join()), `${spec.id} 每張圖的答案要在 accepted 裡`);
        assert.equal(judgePhrase(spec, r, r.answer).kind, 'fit');
        const free = spec.slots.map((s, i) => (s.fixed || s.copy_of !== undefined ? null : i)).filter((i) => i !== null);
        if (free.length >= 2 && spec.slots[free[0]].role !== spec.slots[free[free.length - 1]].role) {
          const swapped = [...r.answer]; [swapped[free[0]], swapped[free[free.length - 1]]] = [swapped[free[free.length - 1]], swapped[free[0]]];
          assert.equal(judgePhrase(spec, r, swapped).kind, 'structure', `${spec.id} 位置放錯要判成結構錯`);
        }
        const partial = [...r.answer]; partial[free[free.length - 1]] = null;
        assert.equal(judgePhrase(spec, r, partial).kind, 'incomplete');
        if (r.adapted) {
          spec.slots.forEach((slot, i) => {
            if (slot.fixed || slot.copy_of !== undefined) return;
            assert.equal([...r.answer[i]].length, [...spec.example.chunks[i]].length,
              `${spec.id} 改寫的「${r.answer[i]}」字數要和課本同一格「${spec.example.chunks[i]}」一樣（CF 2026-10-05）`);
          });
        }
        if (r.check) assert.equal(r.check.options.filter((o) => o.correct).length, 1, `${spec.id} 小確認題只能有一個正解`);
      }
      const rej = (spec.semantic_rejects || [])[0];
      if (rej) {
      assert.equal(judgePhrase(spec, spec.rounds[0], rej.chunks).kind, 'semantic');
      assert.equal(judgePhrase(spec, spec.rounds[0], rej.chunks).feedback, rej.feedback);
      }
    }
  }
}
assert.ok(n >= 1, '至少要有一課照樣造短語');

// 圖片規格（docs/lesson-generation-workflow.md）：960×960 正方形 WebP、單張 ≤300 KiB、不裁切
function webpSize(buf) {
  const kind = buf.toString('ascii', 12, 16);
  if (kind === 'VP8X') return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
  if (kind === 'VP8L') { const b = buf.readUInt32LE(21); return [(b & 0x3fff) + 1, ((b >> 14) & 0x3fff) + 1]; }
  return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
}
if (process.env.SKIP_PHRASE_IMAGES !== '1') {
  for (const vol of fs.readdirSync(root).filter((d) => d.startsWith('115AG'))) {
    for (const f of fs.readdirSync(path.join(root, vol)).filter((x) => /^lesson\d+\.json$/.test(x))) {
      const lesson = JSON.parse(fs.readFileSync(path.join(root, vol, f), 'utf8'));
      for (const spec of lesson.phrase_builders || []) {
        for (const r of spec.rounds) {
          const file = new URL(`../public${r.image.src}`, import.meta.url).pathname;
          assert.ok(fs.existsSync(file), `${spec.id} 缺圖：${r.image.src}`);
          const buf = fs.readFileSync(file);
          assert.ok(buf.length <= 300 * 1024, `${r.image.src} 超過 300 KiB`);
          assert.deepEqual(webpSize(buf), [960, 960], `${r.image.src} 要是 960×960`);
          assert.equal(r.image.layout, 'square-native', `${r.image.src} 要標 image.layout`);
        }
      }
    }
  }
  console.log('✅ 照樣造短語圖片：960×960、≤300 KiB');
}
console.log(`✅ 照樣造短語：${n} 個句型，判定與官方來源檢查通過`);
