// 字的故事：只有查得到可靠來源、且教師核准的字源才會公開。
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();
const { hasCharacterStory, hasApprovedEtymology } = await import('../src/pages/CharacterStoryPage.js');

const root = fileURLToPath(new URL('../public/data/', import.meta.url));
let withEtymology = 0;
let approved = 0;
let videoCount = 0;

for (const volume of readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory() && /^115AG\d/.test(e.name))) {
  for (const filename of readdirSync(join(root, volume.name)).filter((n) => /^lesson\d+\.json$/.test(n))) {
    const lesson = JSON.parse(readFileSync(join(root, volume.name, filename), 'utf8'));
    for (const c of lesson.characters || []) {
      const e = c.etymology;
      // 影片和字源各自獨立：兩者都沒有才不該出現入口按鈕（畫面不放空殼）
      const videos = c.videos || [];
      if (!e && videos.length === 0) {
        assert.equal(hasCharacterStory(c), false, `${lesson.lesson_id} ${c.char}: 沒有字源也沒有影片，不得出現按鈕`);
      }
      for (const v of videos) {
        assert.match(v.url, /^https:\/\/www\.youtube\.com\/watch\?v=/, `${lesson.lesson_id} ${c.char}: 影片連結格式`);
        assert.ok(v.title && v.source, `${lesson.lesson_id} ${c.char}: 影片要有標題與來源`);
        videoCount += 1;
      }
      if (!e) continue;
      withEtymology += 1;
      assert.ok(e.story && e.story.length >= 10, `${lesson.lesson_id} ${c.char}: 字源故事太短`);
      // 字源最容易出錯的就是沒有出處的說法，一律要求標明來源
      assert.ok(e.source && e.source.length >= 4, `${lesson.lesson_id} ${c.char}: 字源必須標明出處`);
      assert.ok(['draft', 'approved', 'rejected'].includes(e.status), `${lesson.lesson_id} ${c.char}: 需要審核狀態`);
      if (e.status === 'approved') {
        approved += 1;
        assert.ok(e.approved_by && e.approved_on, `${lesson.lesson_id} ${c.char}: 核准要記錄人與日期`);
      } else {
        assert.equal(hasApprovedEtymology(c), false, `${lesson.lesson_id} ${c.char}: 未核准的字源不得公開`);
      }
      for (const comp of e.components || []) {
        assert.ok(comp.part && comp.role, `${lesson.lesson_id} ${c.char}: 部件要有字與角色`);
      }
    }
  }
}

assert.ok(withEtymology > 0, '至少要有一個字寫了字源');
console.log(`PASS: ${withEtymology} 個字有字源（已核准 ${approved} 個）、${videoCount} 支影片，全部標明出處；未核准者不公開。`);
