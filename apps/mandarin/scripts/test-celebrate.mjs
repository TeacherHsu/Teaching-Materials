// 驗證 src/utils/celebrate.js：reduced-motion 不噴粒子、粒子自動清除、
// 連對計數答錯歸零、靜音時不建立 AudioContext。
// 用法：node scripts/test-celebrate.mjs
import assert from 'node:assert/strict';
import { installFakeDom, FakeElement } from './fake-dom.mjs';

installFakeDom();

// fake-dom 只做最小的 h()/clear() 子集，這裡補上 celebrate.js 會用到的
// document.body／getElementById／AudioContext／matchMedia，維持「無新依賴」，
// 純手寫最小子集。
document.body = new FakeElement('body');
document.getElementById = (id) => document.body.find((n) => n.id === id) || null;

let reducedMotion = false;
window.matchMedia = (query) => ({ matches: query.includes('reduce') && reducedMotion });

let audioContextCount = 0;
class FakeAudioContext {
  constructor() {
    audioContextCount += 1;
    this.state = 'running';
    this.currentTime = 0;
    this.destination = {};
  }
  createOscillator() {
    return {
      type: '',
      frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      connect() { return this; },
      start() {},
      stop() {},
    };
  }
  createGain() {
    return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() { return this; } };
  }
  resume() {}
}
window.AudioContext = FakeAudioContext;

// 簡易假計時器：不用等真的 700ms，手動 flush。
const timerQueue = [];
let nextTimerId = 1;
globalThis.setTimeout = (fn, delay) => {
  const id = nextTimerId++;
  timerQueue.push({ id, fn, delay });
  return id;
};
globalThis.clearTimeout = (id) => {
  const t = timerQueue.find((t) => t.id === id);
  if (t) t.fn = null;
};
function flushTimers() {
  while (timerQueue.length) {
    const t = timerQueue.shift();
    if (t.fn) t.fn();
  }
}

const {
  celebrateCorrect,
  celebrateComplete,
  getStreak,
  resetStreak,
  isMuted,
  setMuted,
  toggleMute,
  _resetCelebrateStateForTests,
} = await import('../src/utils/celebrate.js');

function makeTargetEl() {
  const el = new FakeElement('button');
  return el;
}

// ---- 1. prefers-reduced-motion 時不產生粒子 ----
_resetCelebrateStateForTests();
resetStreak();
setMuted(true); // 這個測項不驗證音效，先靜音避免無關副作用
reducedMotion = true;
celebrateCorrect(makeTargetEl(), 'var(--module-blue)', { firstTry: true });
const layerAfterReduced = document.getElementById('celebrate-particle-layer');
assert.ok(!layerAfterReduced || layerAfterReduced.children.length === 0, 'reduced-motion 時不應該產生任何粒子節點');
console.log('PASS: prefers-reduced-motion 時不噴粒子');

// ---- 2. 粒子會自動清除（假計時器） ----
reducedMotion = false;
celebrateCorrect(makeTargetEl(), 'var(--module-blue)', { firstTry: true });
const layerDuring = document.getElementById('celebrate-particle-layer');
assert.ok(layerDuring, '動畫允許時應該建立粒子層');
assert.ok(layerDuring.children.length > 0, '動畫允許時應該噴出粒子（12–18 顆彩色小星星／圓點）');
assert.ok(layerDuring.children.length <= 40, '同一時間粒子數不可超過上限 40 個');
flushTimers();
assert.equal(layerDuring.children.length, 0, '粒子播完（或計時器觸發）後應該自動從 DOM 移除');
console.log('PASS: 粒子會自動清除，不會殘留在畫面上');

// ---- 快速連點：前一批尚未播完的粒子要清掉 ----
celebrateCorrect(makeTargetEl(), 'var(--module-blue)', { firstTry: true });
const firstBurstCount = document.getElementById('celebrate-particle-layer').children.length;
assert.ok(firstBurstCount > 0);
celebrateCorrect(makeTargetEl(), 'var(--module-blue)', { firstTry: true }); // 還沒 flush 就再噴一次
const layerAfterSecondBurst = document.getElementById('celebrate-particle-layer');
assert.ok(
  layerAfterSecondBurst.children.length <= 18,
  '快速連點時，前一批未播完的粒子應該先被清掉，不會兩批疊加超過單批上限',
);
flushTimers();
console.log('PASS: 快速連點時前一批粒子會先被清掉，不會疊加');

// ---- 3. 連對計數在答錯後歸零 ----
resetStreak();
celebrateCorrect(makeTargetEl(), 'c', { firstTry: true });
celebrateCorrect(makeTargetEl(), 'c', { firstTry: true });
assert.equal(getStreak(), 2, '連續兩題第一次就答對，連對數應為 2');
celebrateCorrect(makeTargetEl(), 'c', { firstTry: false }); // 這題被揭曉正解，不是自己答對
assert.equal(getStreak(), 0, '答錯（被揭曉）後連對數應該歸零');
flushTimers();
console.log('PASS: 連對計數在答錯／被揭曉後正確歸零');

// ---- 4. 靜音時不建立 AudioContext，也不播放 ----
_resetCelebrateStateForTests();
audioContextCount = 0;
setMuted(true);
assert.equal(isMuted(), true);
celebrateCorrect(makeTargetEl(), 'c', { firstTry: true });
celebrateComplete(document.body, { moduleColor: 'c', isNewRecord: true, starsEarned: 3 });
flushTimers();
assert.equal(audioContextCount, 0, '靜音時 celebrateCorrect／celebrateComplete 都不應該建立 AudioContext');
console.log('PASS: 靜音時不建立 AudioContext，不播放音效');

// ---- 取消靜音後才會建立 AudioContext（正常播放路徑存在，不是整個音效邏輯壞掉） ----
_resetCelebrateStateForTests();
audioContextCount = 0;
setMuted(false);
celebrateCorrect(makeTargetEl(), 'c', { firstTry: true });
flushTimers();
assert.equal(audioContextCount, 1, '取消靜音後答對應該建立一次 AudioContext 來播放音效');
console.log('PASS: 取消靜音後正常播放音效（建立 AudioContext）');

// ---- toggleMute 往返正確 ----
setMuted(false);
const afterToggle = toggleMute();
assert.equal(afterToggle, true);
assert.equal(isMuted(), true);
toggleMute();
assert.equal(isMuted(), false);
console.log('PASS: toggleMute 靜音開關往返正確');

console.log('全部通過：celebrate.js reduced-motion／粒子清除／連對歸零／靜音守門。');
