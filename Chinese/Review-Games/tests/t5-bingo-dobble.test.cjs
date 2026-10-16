/* T5：抽取真實 inline script；靜態邊界與呈現鎖驗證，不啟動瀏覽器。 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const scripts = (html) => [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const bingo = read('bingo.html'), dobble = read('dobble.html');
const bingoJS = scripts(bingo).join('\n'), dobbleJS = scripts(dobble).join('\n');
for (const [name, html] of [['bingo', bingo], ['dobble', dobble]]) {
  test(`${name}：抽出的每支 inline script 語法正確`, () => {
    assert.ok(scripts(html).length);
    scripts(html).forEach((script) => assert.doesNotThrow(() => new vm.Script(script)));
  });
  test(`${name}：calm 和系統低動態將時間與延遲歸零`, () => {
    assert.match(html, /body\.calm[^{}]*\{[^}]*animation-duration:\s*0ms\s*!important;[^}]*animation-delay:\s*0ms\s*!important;[^}]*transition-duration:\s*0ms\s*!important/);
    assert.match(html, /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation-duration: 0ms/);
  });
}
test('哆寶：所有內嵌詞塊尺寸宣告至少 64×52，且覆蓋共用縮小規則', () => {
  const css = dobble.match(/<style>([\s\S]*?)<\/style>/)[1];
  let checked = 0;
  for (const m of css.matchAll(/([^{}]+)\{([^{}]+)\}/g)) {
    if (!m[1].includes('.sym')) continue;
    for (const size of m[2].matchAll(/min-(width|height):\s*(\d+)px/g)) {
      assert.ok(Number(size[2]) >= (size[1] === 'width' ? 64 : 52), m[0]); checked++;
    }
  }
  assert.ok(checked >= 4);
  assert.match(css, /#app \.stage \.disc \.sym\s*\{[^}]*min-width: 64px; min-height: 52px/);
  assert.match(css, /grid-template-columns: minmax\(64px,1fr\)/);
});
test('賓果：連線動畫呼叫位於 settle 內 lines() 判定之後', () => {
  const settle = bingoJS.slice(bingoJS.indexOf('function settle('), bingoJS.indexOf('function reveal('));
  const judgement = settle.indexOf('const confirmedLines = lines();');
  const animation = settle.indexOf('animateConfirmedLines(confirmedLines);');
  assert.ok(judgement >= 0 && animation > judgement);
  assert.equal((bingoJS.match(/animateConfirmedLines\(confirmedLines\)/g) || []).length, 1);
});
function animationEnv({ calm = false, systemReduced = false } = {}) {
  const classes = () => ({ values: new Set(), add(...v) { v.forEach((s) => this.values.add(s)); }, remove(v) { this.values.delete(v); } });
  const timers = [];
  let now = 0;
  const context = {
    shownLines: new Set(), lineAnimating: false,
    grid: { inert: false }, acts: { inert: false, querySelector: () => null },
    btns: Array.from({ length: 9 }, () => ({ classList: classes() })),
    banner: { textContent: '', classList: classes() },
    document: { body: { classList: { contains: () => calm } } },
    matchMedia: () => ({ matches: systemReduced, addEventListener() {}, removeEventListener() {} }),
    MutationObserver: class { observe() {} disconnect() {} },
    setTimeout(fn, delay) { const t = { fn, at: now + delay, cleared: false }; timers.push(t); return t; },
    clearTimeout(t) { t.cleared = true; },
  };
  const helper = bingoJS.slice(bingoJS.indexOf('function animateConfirmedLines('), bingoJS.indexOf('        const allLines'));
  vm.createContext(context); vm.runInContext(helper, context);
  const tick = (ms) => {
    const until = now + ms;
    while (true) {
      const t = timers.filter((t) => !t.cleared && t.at <= until).sort((a, b) => a.at - b.at)[0];
      if (!t) break;
      t.cleared = true; now = t.at; t.fn();
    }
    now = until;
  };
  return { context, tick, timers };
}
test('賓果：每格相隔 120ms，橫幅 1.2 秒後解鎖，重複連線不再播', () => {
  const { context: c, tick } = animationEnv();
  c.animateConfirmedLines([[0, 1, 2]]);
  assert.equal(c.lineAnimating, true); assert.equal(c.grid.inert, true); assert.equal(c.acts.inert, true);
  tick(0); assert.equal(c.btns[0].classList.values.has('line'), true); assert.equal(c.btns[1].classList.values.has('line'), false);
  tick(120); assert.equal(c.btns[1].classList.values.has('line'), true); assert.equal(c.btns[2].classList.values.has('line'), false);
  tick(120); assert.equal(c.btns[2].classList.values.has('line'), true);
  tick(120); assert.equal(c.banner.classList.values.has('visible'), true);
  tick(1199); assert.equal(c.lineAnimating, true);
  tick(1); assert.equal(c.lineAnimating, false); assert.equal(c.grid.inert, false); assert.equal(c.acts.inert, false);
  c.animateConfirmedLines([[0, 1, 2]]); assert.equal(c.lineAnimating, false);
});
for (const mode of ['calm', 'systemReduced']) {
  test(`賓果：${mode} 不等待，連線與橫幅仍更新`, () => {
    const { context: c, timers } = animationEnv({ [mode]: true });
    c.animateConfirmedLines([[0, 4, 8]]);
    assert.equal(c.lineAnimating, false); assert.equal(c.grid.inert, false);
    assert.ok([0, 4, 8].every((i) => c.btns[i].classList.values.has('line')));
    assert.equal(c.banner.textContent, 'BINGO!'); assert.equal(timers.length, 0);
  });
}
test('哆寶：單雙人成功後均畫 SVG，換卡與收尾清除舊連線', () => {
  assert.match(dobbleJS, /showMatch\(discA, discB\);/);
  assert.match(dobbleJS, /showMatch\(p\.discA, p\.discB\);/);
  assert.match(dobbleJS, /createElementNS\('http:\/\/www\.w3\.org\/2000\/svg', 'svg'\)/);
  assert.match(dobbleJS, /clearMatch\(disc\.closest\('\.stage'\)\)/);
  assert.match(dobbleJS, /clearMatch\(discA\.closest\('\.stage'\)\)/);
  assert.match(dobbleJS, /stage\.closest\('\.zone.flip'\)/);
});
test('賓果：橘底及四隊成功格的白字對比至少 4.5:1', () => {
  const colors = vm.runInNewContext(read('common.js').match(/const TEAM_COLORS = (\[[^;]+\]);/)[1]);
  const luminance = (hex) => hex.slice(1).match(/../g).map((s) => parseInt(s, 16) / 255).map((c) => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4).reduce((v, c, i) => v + c * [.2126, .7152, .0722][i], 0);
  for (const color of ['#a84b17', ...colors]) assert.ok(1.05 / (luminance(color) + .05) >= 4.5, color);
  assert.match(bingo, /\.bcell\.on \{ background: var\(--action\);[^}]*color: #fff/);
  assert.match(bingo, /\.bcell\.team \{ background: var\(--tc\);[^}]*color: #fff/);
});
