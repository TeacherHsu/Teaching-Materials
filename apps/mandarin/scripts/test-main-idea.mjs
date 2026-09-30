// 抓重點：選項必含正解、彼此互異，且未核准的誘答不得外流到學生端。
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../public/data/', import.meta.url));
let lessons = 0;
let drafts = 0;
let approved = 0;

for (const volume of readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory() && /^115AG\d/.test(e.name))) {
  for (const filename of readdirSync(join(root, volume.name)).filter((n) => /^lesson\d+\.json$/.test(n))) {
    const lesson = JSON.parse(readFileSync(join(root, volume.name, filename), 'utf8'));
    const mainIdea = lesson.main_idea;
    assert.ok(mainIdea && mainIdea.gist, `${lesson.lesson_id}: every lesson needs a main idea`);
    lessons += 1;

    const distractors = mainIdea.distractors || [];
    assert.equal(distractors.length, 2, `${lesson.lesson_id}: two written distractors`);
    const types = distractors.map((d) => d.type).sort();
    assert.deepEqual(types, ['offtopic', 'vague'], `${lesson.lesson_id}: one vague and one off-topic distractor`);

    for (const d of distractors) {
      assert.ok(d.id && d.id.includes(lesson.lesson_id), `${lesson.lesson_id}: distractor id names its lesson`);
      assert.ok(d.text && d.text.trim(), `${lesson.lesson_id}: distractor needs text`);
      assert.notEqual(d.text, mainIdea.gist, `${lesson.lesson_id}: a distractor may not repeat the answer`);
      assert.ok(['draft', 'approved', 'rejected'].includes(d.status), `${lesson.lesson_id}: distractor needs a review status`);
      if (d.status === 'draft') drafts += 1;
      if (d.status === 'approved') {
        approved += 1;
        assert.ok(d.approved_by && d.approved_on, `${lesson.lesson_id}: approvals record who and when`);
      }
      // 誘答不得與任何段落大意重複（以偏概全誘答是執行時另取的）
      for (const p of lesson.paragraph_summary || []) {
        assert.notEqual(d.text, p.summary, `${lesson.lesson_id}: written distractors differ from paragraph summaries`);
      }
    }
    assert.equal(new Set(distractors.map((d) => d.text)).size, 2, `${lesson.lesson_id}: distractors differ from each other`);
  }
}

assert.equal(lessons, 55, 'every published lesson carries a main idea');
console.log(`PASS: ${lessons} lessons — ${approved} approved distractors, ${drafts} awaiting review.`);
