// 驗證規格 2026-09-25-mandarin-dabutie-importer.md §1／§4：
// 1. 課次首頁 hero 進度分母只算「可開始的大項」（code==='available'|'done'；鎖住的
//    舊字新詞、教材審核中的一字多音都不計入），第 1 課應為 10。
// 4. 活動頁／課次首頁麵包屑補上課本層（翰林三上），且與 LessonDashboard 共用同一份 volumeLabel。
// 用法：node scripts/test-lesson-dashboard-progress.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();

const { LessonDashboard } = await import('../src/pages/LessonDashboard.js');
const { ModulePage } = await import('../src/pages/ModulePage.js');
const { MODULE_REGISTRY, getModuleStatus } = await import('../src/activities/moduleRegistry.js');
const { volumeLabel } = await import('../src/utils/volumeLabel.js');

const lesson = JSON.parse(readFileSync(new URL('../public/data/115AG3H/lesson01.json', import.meta.url)));

// ---- 靜態確認：第 1 課 12 大項中「舊字新詞」鎖住、「一字多音」教材審核中
// （05大補帖注音無法可靠抽取，pedia 也沒有語詞多讀音層級注音，資料層 0 筆可
// 用題目，屬預期中的「教材審核中」，非 bug），其餘 10 項可開始 ----
const statuses = MODULE_REGISTRY.map((entry) => ({ key: entry.key, code: getModuleStatus(lesson, entry).code }));
const lockedKeys = statuses.filter((s) => s.code === 'locked').map((s) => s.key);
assert.deepEqual(lockedKeys, ['review'], `第 1 課應該只有「舊字新詞」鎖住，實際鎖住：${lockedKeys.join('、') || '無'}`);
const pendingKeys = statuses.filter((s) => s.code === 'pending_review').map((s) => s.key);
assert.deepEqual(pendingKeys, ['polyphones'], `第 1 課應該只有「一字多音」教材審核中，實際：${pendingKeys.join('、') || '無'}`);
const availableCount = statuses.filter((s) => s.code === 'available' || s.code === 'done').length;
assert.equal(availableCount, 10, `第 1 課可開始的大項應為 10 項，實際 ${availableCount}`);

// ---- LessonDashboard：hero 分母應為 10（不把鎖住／教材審核中的項目算進分母） ----
const dashboard = LessonDashboard(lesson);
const progressLabel = dashboard.find((n) => n.hasClass('lesson-hero__progress-label'));
assert.ok(progressLabel, '應該要有 lesson-hero__progress-label');
assert.match(
  progressLabel.textContent,
  /已完成 0 ／ 10 項/,
  `hero 進度分母應為 10（排除鎖住的舊字新詞、教材審核中的一字多音），實際：「${progressLabel.textContent}」`,
);

// 進度環（progress-ring）文字也要用同一個分母換算百分比，0/10 = 0%
const ringSvgHtml = dashboard.find((n) => n.hasClass('progress-ring')).innerHTML;
assert.match(ringSvgHtml, /0%/, '進度環百分比應該用「可開始大項」當分母（0／10＝0%），不是把鎖住／審核中的項目也算進分母');

// ---- LessonDashboard 麵包屑：首頁／翰林三上／第 1 課 ----
const dashboardBreadcrumb = dashboard.find((n) => n.hasClass('breadcrumb'));
assert.ok(dashboardBreadcrumb.textContent.includes(volumeLabel(lesson.volume)), '課次首頁麵包屑應包含課本層（例如「翰林三上」）');
assert.ok(dashboardBreadcrumb.textContent.includes('第 1 課'), '課次首頁麵包屑仍要保留「第 1 課」');

// ---- ModulePage 麵包屑：首頁／翰林三上／第 1 課／一字多義，且與 LessonDashboard 共用 volumeLabel ----
const modulePage = ModulePage(lesson, 'polysemy');
const moduleBreadcrumb = modulePage.find((n) => n.hasClass('breadcrumb'));
assert.ok(moduleBreadcrumb, 'ModulePage 應該要有麵包屑');
const crumbText = moduleBreadcrumb.textContent;
assert.ok(crumbText.includes(volumeLabel(lesson.volume)), `活動頁麵包屑應該補上課本層，實際：「${crumbText}」`);
assert.ok(crumbText.indexOf(volumeLabel(lesson.volume)) < crumbText.indexOf('第 1 課'), '課本層應該排在「第 1 課」之前');
assert.ok(crumbText.indexOf('第 1 課') < crumbText.indexOf('一字多義'), '「第 1 課」應該排在大項名稱之前');

console.log('PASS: hero 進度分母只算可開始的大項（第 1 課＝10），且活動頁／課次首頁麵包屑補上課本層並共用 volumeLabel。');
