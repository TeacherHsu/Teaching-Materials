// 驗證字旁注音的排版契約：
//   二、三、四聲（ˊ ˇ ˋ）在注音符號的**右側**
//   輕聲（˙）在注音符號的**上方**
//   一聲不標
// 整串一起直排會把聲調擠到最下面，那不是台灣的寫法——這支就是防止它回去。
// 用法：node scripts/test-zhuyin-text.mjs
import assert from 'node:assert/strict';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();
const { ZhuyinText } = await import('../src/components/ZhuyinText.js');

function parts(char, zhuyin) {
  const el = ZhuyinText(char, zhuyin);
  const rt = el.find?.((n) => n.tagName === 'rt');
  return {
    el,
    rt,
    body: el.find?.((n) => n.hasClass?.('zhuyin__body')),
    tone: el.find?.((n) => n.hasClass?.('zhuyin__tone')),
    neutral: Boolean(rt && rt.className.includes('zhuyin__rt--neutral')),
  };
}

// ── 二、三、四聲：本體與聲調分開，聲調不在直排裡 ──────
for (const [char, zhuyin, body, tone] of [
  ['候', 'ㄏㄡˋ', 'ㄏㄡ', 'ˋ'],
  ['好', 'ㄏㄠˇ', 'ㄏㄠ', 'ˇ'],
  ['情', 'ㄑㄧㄥˊ', 'ㄑㄧㄥ', 'ˊ'],
]) {
  const p = parts(char, zhuyin);
  assert.equal(p.body.textContent, body, `${char}：本體應為 ${body}`);
  assert.ok(p.tone, `${char}：應該有獨立的聲調元素（不可和本體混在一起直排）`);
  assert.equal(p.tone.textContent, tone, `${char}：聲調應為 ${tone}`);
  assert.equal(p.neutral, false, `${char} 不是輕聲`);
}

// ── 輕聲：要標成 neutral，由 CSS 放到上方 ─────────────
for (const [char, zhuyin, body] of [['的', '˙ㄉㄜ', 'ㄉㄜ'], ['了', '˙ㄌㄜ', 'ㄌㄜ']]) {
  const p = parts(char, zhuyin);
  assert.equal(p.body.textContent, body);
  assert.equal(p.tone.textContent, '˙');
  assert.equal(p.neutral, true, `${char}：輕聲要加 zhuyin__rt--neutral，CSS 才會放到上方`);
}

// 來源若寫成後置輕聲，也不該把 ˙ 當成本體的一部分
const postfix = parts('了', 'ㄌㄜ˙');
assert.ok(!postfix.body.textContent.includes('˙'), '後置輕聲不可留在本體裡');

// ── 一聲：不標聲調 ───────────────────────────────
for (const [char, zhuyin] of [['心', 'ㄒㄧㄣ'], ['媽', 'ㄇㄚ']]) {
  const p = parts(char, zhuyin);
  assert.equal(p.body.textContent, zhuyin);
  assert.equal(p.tone, null, `${char}：一聲不該標聲調`);
}

// ── 沒有注音（標點）就只回文字 ─────────────────────
const punct = ZhuyinText('，', '');
assert.equal(punct.tagName, undefined, '沒有注音時應回純文字節點，不要包 ruby');

// ── 無障礙：ruby 結構完整 ────────────────────────
const full = parts('候', 'ㄏㄡˋ');
assert.equal(full.el.tagName, 'ruby');
assert.ok(full.rt, '要有 <rt>，螢幕閱讀器才知道那是讀音註記');
assert.equal(full.el.children.filter((n) => n.tagName === 'rp').length, 2, '要有兩個 <rp> 當退路');

console.log('✅ 字旁注音：二三四聲在右側、輕聲在上方、一聲不標、標點不包 ruby、ruby 結構完整');
