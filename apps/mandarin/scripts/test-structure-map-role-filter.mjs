import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isApprovedStructureRole } from '../src/activities/structureMapRoles.js';

for (const role of ['開頭', '開端', '起因', '經過', '發展', '轉折', '結果', '收束', '結局', '總說', '分說']) {
  assert.equal(isApprovedStructureRole(role), true, `${role} should be a structural label`);
}
for (const role of ['第1段重點', '游泳】想像、歡樂與自信', '【第一段】觀察自己', '自動鉛筆', '', null]) {
  assert.equal(isApprovedStructureRole(role), false, `${role} should not be shown as a structural role`);
}

const root = fileURLToPath(new URL('../public/data/', import.meta.url));
let scannedLessons = 0;
let withheldParagraphs = 0;
for (const volume of readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory() && /^115AG\d/.test(entry.name))) {
  const volumePath = join(root, volume.name);
  for (const filename of readdirSync(volumePath).filter((name) => /^lesson\d+\.json$/.test(name))) {
    const lesson = JSON.parse(readFileSync(join(volumePath, filename), 'utf8'));
    for (const paragraph of lesson.paragraph_summary || []) {
      if (!isApprovedStructureRole(paragraph.structure_role)) withheldParagraphs += 1;
    }
    scannedLessons += 1;
  }
}

assert.equal(scannedLessons, 55, 'the audit must cover all published grades and lessons');
assert.ok(withheldParagraphs > 0, 'known heading and paragraph-label records should be withheld pending source review');
console.log(`PASS: scanned ${scannedLessons} lessons; withheld ${withheldParagraphs} unverified map labels.`);
