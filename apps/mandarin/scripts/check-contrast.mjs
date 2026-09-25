// 驗證 design tokens 的前景/背景色彩組合是否符合 WCAG AA。
// 一般文字門檻 4.5:1，大字（>=24px 或粗體 >=19px）門檻 3:1。
// 用法：node scripts/check-contrast.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tokensPath = path.join(__dirname, '../src/styles/tokens.css');
const css = readFileSync(tokensPath, 'utf8');

function readVar(name) {
  const re = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`);
  const m = css.match(re);
  if (!m) throw new Error(`token 找不到：--${name}`);
  return m[1];
}

function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const num = parseInt(h.slice(0, 6), 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function relLuminance({ r, g, b }) {
  const toLinear = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const [R, G, B] = [toLinear(r), toLinear(g), toLinear(b)];
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(hex1, hex2) {
  const l1 = relLuminance(hexToRgb(hex1));
  const l2 = relLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// pairs: [label, foregroundVarOrHex, backgroundVarOrHex, minRatio]
const V = readVar;
const pairs = [
  ['text-primary / background', V('text-primary'), V('color-background'), 4.5],
  ['text-primary / surface', V('text-primary'), V('color-surface'), 4.5],
  ['text-primary / surface-muted', V('text-primary'), V('color-surface-muted'), 4.5],
  ['text-secondary / background', V('text-secondary'), V('color-background'), 4.5],
  ['text-secondary / surface', V('text-secondary'), V('color-surface'), 4.5],
  ['text-on-primary / primary', V('text-on-primary'), V('color-primary'), 4.5],
  ['text-on-primary / primary-hover', V('text-on-primary'), V('color-primary-hover'), 4.5],
  ['text-on-primary / success', V('text-on-primary'), V('color-success'), 4.5],
  ['text-on-primary / danger', V('text-on-primary'), V('color-danger'), 4.5],
  ['text-primary / warning(large)', '#2b2823', V('color-warning'), 3],
  ['primary / background(large,button)', V('color-primary'), V('color-background'), 3],
];

const modules = ['blue', 'teal', 'purple', 'terracotta', 'rose', 'olive'];
for (const m of modules) {
  const dark = V(`module-${m}-dark`);
  const base = V(`module-${m}`);
  const tint = V(`module-${m}-tint`);
  pairs.push([`module-${m}-dark / background（狀態文字/icon 說明字）`, dark, V('color-background'), 4.5]);
  pairs.push([`module-${m}-dark / surface（卡片內文字）`, dark, V('color-surface'), 4.5]);
  pairs.push([`module-${m}-dark / ${m}-tint（圖示徽章文字/圖示）`, dark, tint, 4.5]);
  pairs.push([`module-${m} / ${m}-tint（大型圖示線條，>=3:1）`, base, tint, 3]);
  pairs.push([`text-on-primary / module-${m}（實心按鈕大字）`, V('text-on-primary'), base, 3]);
}

let fail = false;
console.log('對比檢查（WCAG AA）');
console.log('='.repeat(70));
for (const [label, fg, bg, min] of pairs) {
  const ratio = contrastRatio(fg, bg);
  const ok = ratio >= min;
  if (!ok) fail = true;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(42, ' ')} ${fg} on ${bg}  ${ratio.toFixed(2)}:1（門檻 ${min}:1）`,
  );
}
console.log('='.repeat(70));
if (fail) {
  console.error('有組合未達門檻，請調整 tokens.css。');
  process.exit(1);
} else {
  console.log(`全部 ${pairs.length} 組通過。`);
}
