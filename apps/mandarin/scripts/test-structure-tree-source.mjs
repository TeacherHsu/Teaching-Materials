// structure_tree 結構與來源檢查（規格 docs/specs/2026-09-30-structure-map-redesign.md）
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../public/data/', import.meta.url));
let lessonsWithTree = 0;
let nodes = 0;
let segments = 0;
let approved = 0;

function walk(node, lesson) {
  nodes += 1;
  assert.ok(typeof node.label === 'string' && node.label.trim(), `${lesson.lesson_id}: node needs a label`);
  for (const segment of node.segments || []) {
    segments += 1;
    assert.ok(segment.gist_id, `${lesson.lesson_id}: every segment needs a stable id`);
    assert.ok(
      ['todo_rewrite', 'draft', 'approved', 'rejected'].includes(segment.status),
      `${lesson.lesson_id}: unexpected segment status ${segment.status}`,
    );
    // 未改寫完成的 segment 不得帶文字；有文字者必須經過審核狀態。
    if (segment.status === 'todo_rewrite') {
      assert.equal(segment.gist, null, `${lesson.lesson_id}: todo_rewrite segments carry no text`);
    } else {
      assert.ok(segment.gist && segment.gist.trim(), `${lesson.lesson_id}: rewritten segments need text`);
    }
    if (segment.status === 'approved') {
      approved += 1;
      assert.ok(segment.approved_by && segment.approved_on, `${lesson.lesson_id}: approvals must record who and when`);
    }
    const paragraphs = segment.paragraphs || [];
    assert.ok(paragraphs.length <= 2, `${lesson.lesson_id}: a segment is one paragraph or a range`);
    assert.ok(paragraphs.every((n) => Number.isInteger(n) && n > 0), `${lesson.lesson_id}: paragraph numbers are positive`);
    if (paragraphs.length === 2) assert.ok(paragraphs[0] < paragraphs[1], `${lesson.lesson_id}: range must ascend`);
  }
  for (const child of node.children || []) walk(child, lesson);
}

for (const volume of readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory() && /^115AG\d/.test(e.name))) {
  for (const filename of readdirSync(join(root, volume.name)).filter((n) => /^lesson\d+\.json$/.test(n))) {
    const lesson = JSON.parse(readFileSync(join(root, volume.name, filename), 'utf8'));
    const tree = lesson.structure_tree;
    if (!tree) continue;
    lessonsWithTree += 1;
    assert.ok(/課文結構表/.test(tree.source), `${lesson.lesson_id}: source must name the official structure table`);
    assert.ok(['A', 'B'].includes(tree.task_type), `${lesson.lesson_id}: task_type must be A or B`);
    assert.ok((tree.nodes || []).length >= 2, `${lesson.lesson_id}: a structure tree needs at least two nodes`);
    for (const node of tree.nodes) walk(node, lesson);
    // B 類代表官方未標段落編號，不得憑空補上
    if (tree.task_type === 'B') {
      const withParas = tree.nodes.filter((n) => (n.segments || []).some((s) => (s.paragraphs || []).length > 0)).length;
      assert.ok(withParas <= 1, `${lesson.lesson_id}: type B must not invent paragraph mappings`);
    }
  }
}

assert.equal(lessonsWithTree, 10, 'only the ten usable sixth-grade lessons carry a structure tree');
assert.equal(segments, approved, 'every published segment has been approved by a teacher');
console.log(`PASS: ${lessonsWithTree} lessons, ${nodes} nodes, ${segments} segments, all teacher-approved.`);
