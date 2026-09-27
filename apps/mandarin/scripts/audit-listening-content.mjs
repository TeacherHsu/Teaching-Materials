#!/usr/bin/env node
// 稽核「聽聽看」是否先播放與題目對應的內容，再讓學生回答問題。
// 預設只報告，不會改寫教材；加上 --strict 時，任一 FAIL／REVIEW_REQUIRED 會以非零狀態結束。
// 不讀取 worksheet-batches，也不把官方課文帶入公開 repo。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = path.join(appRoot, 'public', 'data');
const strict = process.argv.includes('--strict');
const publicStatuses = new Set(['ready', 'approved']);
const promptOnlyPattern = /請仔細聽題目|根據剛才聽到|哪一個答案最合適/;
const MAX_OPTION_LENGTH = 45;

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(appRoot, relative), 'utf8'));
}

function lessonFiles() {
  const index = readJson('public/data/course-index.json');
  const seen = new Set();
  const files = [];
  for (const grade of index.grades || []) {
    for (const volume of grade.volumes || []) {
      for (const unit of volume.units || []) {
        for (const item of unit.lessons || []) {
          if (!item.lesson_id || seen.has(item.lesson_id)) continue;
          seen.add(item.lesson_id);
          files.push({
            grade: grade.grade,
            volume: volume.code,
            lessonId: item.lesson_id,
            title: item.title,
            relative: path.join('public', item.data),
          });
        }
      }
    }
  }
  return files;
}

function classifyItem(item) {
  const question = String(item.question || '').trim();
  const stem = String(item.stem || '').trim();
  const passage = String(item.passage || '').trim();
  const options = Array.isArray(item.options) ? item.options.map((option) => String(option || '').trim()) : [];
  const longOptions = options.filter((option) => option.length > MAX_OPTION_LENGTH);

  if (!question) return { state: 'FAIL', reason: '缺少 question' };
  if (!options.length) return { state: 'FAIL', reason: '缺少 options' };
  if (longOptions.length) {
    const longest = Math.max(...longOptions.map((option) => option.length));
    return { state: 'REVIEW_REQUIRED', reason: `選項過長（最長 ${longest} 字），需刪除解析與非必要資訊` };
  }
  if (!passage) {
    if (!stem) return { state: 'FAIL', reason: '缺少 passage 與 legacy stem' };
    if (stem === question) return { state: 'FAIL', reason: '播放內容等於題目本身' };
    if (promptOnlyPattern.test(stem)) return { state: 'FAIL', reason: '播放的是另一個提問，不是課文／對應內容' };
    return { state: 'REVIEW_REQUIRED', reason: 'legacy stem 看似有內容，但尚未明確標成 passage，需回官方課文核對' };
  }

  if (passage === question) return { state: 'FAIL', reason: 'passage 與 question 相同' };
  if (promptOnlyPattern.test(passage)) return { state: 'FAIL', reason: 'passage 仍是作答提示，不是課文／對應內容' };

  const sentenceCount = passage.split(/[。！？]/u).filter(Boolean).length;
  if (sentenceCount > 2 || passage.length > 160) {
    return { state: 'REVIEW_REQUIRED', reason: `passage 過長（${sentenceCount} 句／${passage.length} 字），需確認是否可縮成關鍵語句` };
  }
  return { state: 'PASS', reason: '有明確、非題目本身的關鍵語句 passage' };
}

const lessons = lessonFiles();
const totals = { PASS: 0, REVIEW_REQUIRED: 0, FAIL: 0, LOCKED: 0 };
const byGrade = new Map();
const issues = [];

for (const meta of lessons) {
  const lesson = readJson(meta.relative);
  const items = (lesson.listening || []).filter((item) => publicStatuses.has(item.status));
  const bucket = byGrade.get(meta.grade) || { lessons: 0, PASS: 0, REVIEW_REQUIRED: 0, FAIL: 0, LOCKED: 0 };
  bucket.lessons += 1;

  if (items.length === 0) {
    const state = lesson.modules?.listening?.status === 'missing' ? 'LOCKED' : 'REVIEW_REQUIRED';
    totals[state] += 1;
    bucket[state] += 1;
    if (state !== 'LOCKED') issues.push(`${meta.lessonId} ${meta.title}: 模組標示可用但沒有可用聽聽看題目`);
    byGrade.set(meta.grade, bucket);
    continue;
  }

  for (const item of items) {
    const result = classifyItem(item);
    totals[result.state] += 1;
    bucket[result.state] += 1;
    if (result.state !== 'PASS') {
      issues.push(`${meta.lessonId} ${meta.title} ${item.id}: ${result.reason}`);
    }
  }
  byGrade.set(meta.grade, bucket);
}

console.log('聽聽看內容對應稽核');
console.log(`規則：可用題目必須先播放與問題直接相關的 passage；passage 不得是題目本身、另一個提問或整段課文；選項不得超過 ${MAX_OPTION_LENGTH} 字，且不得帶入解析。`);
for (const [grade, bucket] of [...byGrade.entries()].sort((a, b) => a[0] - b[0])) {
  console.log(
    `G${grade}A：${bucket.lessons} 課；PASS ${bucket.PASS}；REVIEW_REQUIRED ${bucket.REVIEW_REQUIRED}；FAIL ${bucket.FAIL}；LOCKED ${bucket.LOCKED}`,
  );
}
console.log(`合計：PASS ${totals.PASS}；REVIEW_REQUIRED ${totals.REVIEW_REQUIRED}；FAIL ${totals.FAIL}；LOCKED ${totals.LOCKED}`);

if (issues.length) {
  console.log('');
  console.log(`需要處理的題目／課次：${issues.length}`);
  for (const issue of issues) console.log(`- ${issue}`);
}

if (strict && issues.length) {
  console.error('FAIL: 聽聽看尚未全部符合「先聽對應內容再回答」原則。');
  process.exitCode = 1;
} else if (issues.length) {
  console.log('AUDIT_REQUIRED: 已完成盤點；上述項目需回官方課文補 passage 或人工核對。');
} else {
  console.log('PASS: 所有可用聽聽看題目都有合格的關鍵語句 passage。');
}
