// 照樣造短語：每一課逐題走完「認識積木（找不變的字）→ 一起想 → 看圖自己想 → 自己造一個」（2026-10-06）
import { installFakeDom } from './fake-dom.mjs';
installFakeDom();
import fs from 'node:fs'; import path from 'node:path';
const { buildPhraseBuilderActivity } = await import('../src/activities/phraseBuilder.js');
const root = new URL('../public/data', import.meta.url).pathname;
let ok = 0, bad = [];
for (const vol of fs.readdirSync(root).filter((d) => d.startsWith('115AG'))) for (const f of fs.readdirSync(path.join(root, vol)).filter((x) => /^lesson\d+\.json$/.test(x))) {
  const lesson = JSON.parse(fs.readFileSync(path.join(root, vol, f)));
  if (!(lesson.phrase_builders || []).length) continue;
  let done = false;
  const c = buildPhraseBuilderActivity(lesson, () => { done = true; });
  const btns = () => c.findAll((n) => n.tagName === 'button' && !n.disabled && n.getAttribute('disabled') == null && !n.hidden);
  const click = (t) => { const b = btns().find((x) => x.textContent.trim().startsWith(t)); if (b) { b.dispatch('click'); return true; } return false; };
  try {
    for (const [si, spec] of lesson.phrase_builders.entries()) {
      while (click('下一塊'));
      click('換你試試');
      // 找不變的字
      spec.slots.forEach((s, i) => { if (s.fixed) btns().find((b) => b.hasClass('phrase-tile') && b.textContent === s.fixed)?.dispatch('click'); });
      if (!click('我知道了')) throw new Error(`${spec.id} 沒有「我知道了」`);
      const fill = (ans) => spec.slots.forEach((s, i) => { if (s.fixed || s.copy_of !== undefined) return; const t = btns().find((b) => b.hasClass('phrase-tile') && b.textContent === ans[i]); if (!t) throw new Error(`${spec.id} 找不到積木 ${ans[i]}`); t.dispatch('click'); });
      for (const r of spec.rounds) {
        fill(r.answer); click('念念看');
        if (!click('檢查')) throw new Error(`${spec.id} 沒有檢查`);
        if (!click('下一步')) throw new Error(`${spec.id} 答案沒過：${r.answer.join('')}`);
        if (r.check) { const o = r.check.options.find((x) => x.correct); btns().find((b) => b.textContent === o.text).dispatch('click'); click('下一步'); }
      }
      fill(spec.accepted[0]); click('檢查');
      if (!click('下一步')) throw new Error(`${spec.id} 自己造沒過`);
    }
    if (!click('回課程首頁')) throw new Error(`${lesson.lesson_id} 沒走到結束`);
    ok += 1;
  } catch (e) { bad.push(e.message); }
}
bad.forEach((b) => console.error(' ', b));
if (bad.length) process.exit(1);
console.log(`✅ 照樣造短語流程：${ok} 課逐題走完`);
