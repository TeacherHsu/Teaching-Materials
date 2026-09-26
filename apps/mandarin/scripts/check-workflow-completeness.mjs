#!/usr/bin/env node
// 檢查公開 repo 的教材工作流是否仍具備來源契約、產生器、容量閘門與回歸測試。
// 不讀取 worksheet-batches，也不驗證官方內容本身。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const exists = (relative) => fs.existsSync(path.join(appRoot, relative));
const read = (relative) => fs.readFileSync(path.join(appRoot, relative), 'utf8');

const requiredFiles = [
  ['主工作流文件', 'docs/lesson-generation-workflow.md'],
  ['匯入器規格', 'docs/specs/2026-09-25-mandarin-dabutie-importer.md'],
  ['G1A/G3A/G4A/G6A 批次介面', 'scripts/generate_lessons.py'],
  ['G4A 康軒來源準備器', 'scripts/prepare_g4a.mjs'],
  ['語詞圖片補圖器', 'scripts/fill_vocabulary_images.py'],
  ['生成圖 manifest 建立器', 'scripts/build_vocabulary_image_manifest.mjs'],
  ['圖片壓縮器', 'scripts/compress-images.py'],
  ['圖片容量閘門', 'scripts/check-assets.mjs'],
  ['跨課舊字新詞同步器', 'scripts/sync-review-coverage.mjs'],
  ['官方來源匯入器', 'tools/dabutie/import_lesson.py'],
  ['來源合併器', 'tools/dabutie/merge.py'],
  ['來源驗證器', 'tools/dabutie/validate.py'],
];

const requiredTests = [
  ['常用造詞前三項', 'scripts/test-character-examples-limit.mjs'],
  ['語詞圖片完整性', 'scripts/test-vocabulary-image-completeness.mjs'],
  ['圖片詞意配對', 'scripts/test-vocabulary-image-pairs.mjs'],
  ['成語具體情境句', 'scripts/test-idiom-sentence-contexts.mjs'],
  ['成語點選填句', 'scripts/test-idiom-fill-sentence.mjs'],
  ['句型詞塊', 'scripts/test-sentence-chunking.mjs'],
  ['修辭關鍵字變色', 'scripts/test-rhetoric-highlights.mjs'],
  ['形似字官方群組', 'scripts/test-lookalike-shape-groups.mjs'],
  ['一字多義／多音／聽聽看', 'scripts/test-g3a-official-extensions.mjs'],
  ['星星累計', 'scripts/test-star-scoring.mjs'],
  ['模組星星覆蓋', 'scripts/test-module-star-coverage.mjs'],
  ['段落與朗讀 fallback', 'scripts/test-read-all-sequence.mjs'],
  ['跨課複習', 'scripts/test-review-coverage.mjs'],
];

const errors = [];
for (const [label, relative] of [...requiredFiles, ...requiredTests]) {
  if (exists(relative)) console.log(`[OK] ${label}: ${relative}`);
  else errors.push(`${label} 缺少 ${relative}`);
}

const generator = read('scripts/generate_lessons.py');
for (const [label, needle] of [
  ['G1A profile', '"g1a": Profile'],
  ['G3A profile', '"g3a": Profile'],
  ['G4A profile', '"g4a": Profile'],
  ['G6A profile', '"g6a": Profile'],
  ['G4A/G6A prepared-root 介面', 'PREPARED_PROFILES'],
  ['G4A/G6A 準備資料驗證', 'validate_prepared_lesson'],
  ['中斷後續作', '--resume'],
  ['唯讀來源檢查', '--dry-run'],
]) {
  if (generator.includes(needle)) console.log(`[OK] 產生器契約：${label}`);
  else errors.push(`產生器缺少 ${label}（${needle}）`);
}

const workflow = read('docs/lesson-generation-workflow.md');
for (const [label, needle] of [
  ['G6A 公開準備資料介面', 'G6A 公開準備資料介面'],
  ['G4A 公開準備資料介面', 'G4A 公開準備資料介面'],
  ['G6A 私有來源閘門', 'G6A 專用來源閘門'],
  ['工作流完整性規則', '工作流完整性檢查'],
  ['WebP／AVIF 容量規則', '單張不得超過 300 KiB'],
  ['成語具體情境規則', '可由上下文判斷的具體情境句'],
  ['修辭關鍵字規則', '﹁關鍵字﹂'],
  ['形似字核對規則', 'official_shape_group'],
]) {
  if (workflow.includes(needle)) console.log(`[OK] 工作流文件：${label}`);
  else errors.push(`工作流文件缺少 ${label}（${needle}）`);
}

const packageJson = JSON.parse(read('package.json'));
for (const script of ['validate', 'build', 'check-assets', 'check-dist']) {
  if (typeof packageJson.scripts?.[script] === 'string') console.log(`[OK] npm script：${script}`);
  else errors.push(`package.json 缺少 npm script：${script}`);
}

if (errors.length) {
  console.error(`FAIL: 工作流完整性檢查發現 ${errors.length} 項缺漏`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`PASS: 工作流完整性檢查通過（${requiredFiles.length} 個工具／契約、${requiredTests.length} 個回歸測試、${Object.keys(packageJson.scripts).length} 個 npm 閘門）`);
}
