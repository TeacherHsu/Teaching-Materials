// 驗證 ExtensionLinks：
//   1. 生產模式（無 ?preview=1）只顯示 approved 連結，draft 不顯示。
//   2. preview 模式（?preview=1）額外顯示 draft，並帶「待審」標籤。
//   3. 沒有對應 module 的可見連結時回傳 null（不掛載空區塊）。
//   4. 產生的連結是 target=_blank + rel=noopener noreferrer 的 <a>。
// 無新依賴，純 Node（fake-dom stub）。
// 用法：node scripts/test-extension-links.mjs
import assert from 'node:assert/strict';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();
const { buildExtensionLinks } = await import('../src/components/ExtensionLinks.js');

const lesson = {
  extensions: [
    {
      id: 'ext:1', url: 'https://wordwall.net/tc/resource/1', title: '生字遊戲',
      provider: 'Wordwall', type: 'game', module: 'characters', status: 'approved',
    },
    {
      id: 'ext:2', url: 'https://quizlet.com/2', title: '語詞測驗',
      provider: 'Quizlet', type: 'quiz', module: 'characters', status: 'draft',
    },
    {
      id: 'ext:3', url: 'https://www.youtube.com/watch?v=3', title: '課文朗讀影片',
      provider: 'YouTube', type: 'video', module: 'reading', status: 'approved',
    },
  ],
};

// --- 生產模式：只顯示 approved ---
globalThis.window.location.search = '';
const prod = buildExtensionLinks(lesson, 'characters');
assert.ok(prod, '生產模式：characters 模組應有 1 筆 approved 連結可顯示');
const prodLinks = prod.findAll((n) => n.tagName === 'a');
assert.equal(prodLinks.length, 1, '生產模式只應顯示 approved 連結，draft 應被過濾');
assert.equal(prodLinks[0].getAttribute('href'), 'https://wordwall.net/tc/resource/1');
assert.equal(prodLinks[0].getAttribute('target'), '_blank');
assert.equal(prodLinks[0].getAttribute('rel'), 'noopener noreferrer');
const prodBadge = prod.findAll((n) => n.hasClass('extension-link__draft-badge'));
assert.equal(prodBadge.length, 0, '生產模式不應出現待審標籤');

// --- preview 模式：draft 也顯示，並帶待審標籤 ---
globalThis.window.location.search = '?preview=1';
const preview = buildExtensionLinks(lesson, 'characters');
const previewLinks = preview.findAll((n) => n.tagName === 'a');
assert.equal(previewLinks.length, 2, 'preview 模式應顯示 approved + draft 共 2 筆');
const previewBadges = preview.findAll((n) => n.hasClass('extension-link__draft-badge'));
assert.equal(previewBadges.length, 1, 'preview 模式應有 1 個待審標籤（對應 draft 那筆）');

// --- 沒有連結時回傳 null，不掛載空區塊 ---
globalThis.window.location.search = '';
const empty = buildExtensionLinks(lesson, 'vocabulary');
assert.equal(empty, null, '沒有對應 module 的可見連結時，應回傳 null（不顯示空區塊）');

console.log('test-extension-links: 全部通過');
