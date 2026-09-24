// 「舊字新詞」跨課選題邏輯的最小驗證腳本（無新依賴，純 Node）。
// 用 public/data/_fixtures/ 下的假 course-index＋假第 2 課，驗證：
//   1. loadPrevLessons() 只抓到「本冊、比目前課次早」的課次（這裡是真的第 1 課，
//      不含假第 2 課自己）。
//   2. buildReviewQuizItems()／pickReviewRound() 混出的題目只用第 1 課的
//      生字／語詞，不含假第 2 課 fixture 自己的內容（測、驗、測試）。
//   3. 題數落在 3–5 題之間。
// 用法：node scripts/test-review-cross-lesson.mjs
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { loadPrevLessons, buildReviewQuizItems, pickReviewRound } from '../src/activities/review.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// 假 fetch：course-index.json 這個請求攔截成讀 fixture 索引，其餘路徑照樣讀 public/ 下的檔案
// （meta.data 路徑本身就寫死指到 fixture 或真實檔案，不需要另外改寫）。
async function fetchImpl(url) {
  const rel = url.endsWith('data/course-index.json')
    ? 'data/_fixtures/review-course-index.fixture.json'
    : url;
  const filePath = path.join(PUBLIC_DIR, rel);
  let text;
  try {
    text = await readFile(filePath, 'utf8');
  } catch {
    return { ok: false };
  }
  return { ok: true, json: async () => JSON.parse(text) };
}

async function main() {
  const lesson02Fixture = JSON.parse(
    await readFile(path.join(PUBLIC_DIR, 'data/_fixtures/review-lesson02.fixture.json'), 'utf8'),
  );

  const prevLessons = await loadPrevLessons(lesson02Fixture, { base: '', fetchImpl });
  assert.equal(prevLessons.length, 1, '應該只抓到 1 課（真正的第 1 課）');
  assert.equal(prevLessons[0].lesson_id, '115AG3H01', '抓到的應該是第 1 課');

  const items = buildReviewQuizItems(prevLessons);
  assert.ok(items.length >= 3, `候選題目太少：${items.length}`);
  for (const item of items) {
    const touchesFixtureLesson02 = [item.stem, item.answer, ...(item.options || [])].some(
      (v) => typeof v === 'string' && (v.includes('測') || v.includes('驗')),
    );
    assert.ok(!touchesFixtureLesson02, `題目不該包含假第 2 課的內容：${JSON.stringify(item)}`);
  }

  const round = pickReviewRound(prevLessons);
  assert.ok(round.length >= 3 && round.length <= 5, `一組題數應為 3–5，實際 ${round.length}`);

  console.log(`[PASS] 跨課選題只來自第 1 課，候選 ${items.length} 題，一組 ${round.length} 題。`);
}

main().catch((err) => {
  console.error('[FAIL]', err);
  process.exit(1);
});
