// 答對／完成大項的視覺與音效回饋（共用模組，所有元件呼叫同一支，不要各寫一套）。
// ADHD 原則：短（粒子動畫 ≤700ms、完成煙火 ≤1.2s）、不擋操作（純裝飾層，
// pointer-events:none，不阻擋按鈕點擊）、不持續閃動（動畫播完就清空，不循環）。
//
// prefers-reduced-motion 時：不噴粒子、不彈跳、不飛星星，只留靜態勾勾印章與
// 文字徽章（見 celebrateCorrect／celebrateComplete 內的 reducedMotion 分支）。
// 音效仍依「靜音開關」（localStorage）決定，不受 reduced-motion 影響。

const MUTE_KEY = 'mandarin:sound-muted';
const PARTICLE_LAYER_ID = 'celebrate-particle-layer';
const MAX_PARTICLES = 40;
const CORRECT_DURATION_MS = 700;
const COMPLETE_DURATION_MS = 1200;
const STAR_FLY_STAGGER_MS = 150;

const PALETTE_FALLBACK = ['#f2b705', '#ef6461', '#3aa6a6'];

let streak = 0;
let audioCtx = null;
let particleClearTimer = null;

/** 測試與元件共用的環境守門：fake-dom／舊瀏覽器沒有這些 API 時安靜跳過，不拋例外。 */
function hasWindow() {
  return typeof window !== 'undefined';
}

export function prefersReducedMotion() {
  try {
    return !!(hasWindow() && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch {
    return false;
  }
}

export function isMuted() {
  try {
    return hasWindow() && window.localStorage && window.localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setMuted(muted) {
  try {
    if (hasWindow() && window.localStorage) window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // 無痕模式／localStorage 被封鎖時安靜忽略，不影響操作。
  }
}

export function toggleMute() {
  const next = !isMuted();
  setMuted(next);
  return next;
}

// ---- 連對計數：同一大項內「第一次作答就答對」連續次數，答錯／被揭曉就歸零 ----
export function getStreak() {
  return streak;
}

export function resetStreak() {
  streak = 0;
  return streak;
}

function bumpStreak() {
  streak += 1;
  return streak;
}

// ---- Web Audio：即時合成音效，不載外部音檔。AudioContext 延遲到第一次使用者手勢才建立 ----
function getAudioContext() {
  if (!hasWindow()) return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended' && typeof audioCtx.resume === 'function') {
    audioCtx.resume();
  }
  return audioCtx;
}

function isSpeaking() {
  try {
    return !!(hasWindow() && window.speechSynthesis && window.speechSynthesis.speaking);
  } catch {
    return false;
  }
}

/** 短促「叮」上揚音（答對），≤250ms；正在朗讀時略過，不打斷 TTS。 */
function playCorrectSound() {
  if (isMuted() || isSpeaking()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(660, now);
  osc.frequency.exponentialRampToValueAtTime(990, now + 0.15);
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.25);
}

/** 三音琶音（大項完成），≤600ms。 */
function playCompleteSound() {
  if (isMuted() || isSpeaking()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const notes = [523.25, 659.25, 783.99]; // C5 E5 G5
  const now = ctx.currentTime;
  notes.forEach((freq, i) => {
    const start = now + i * 0.15;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.14, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.35);
  });
}

// ---- 粒子層 ----
function getParticleLayer() {
  if (!hasWindow() || !document) return null;
  let layer = document.getElementById ? document.getElementById(PARTICLE_LAYER_ID) : null;
  if (!layer) {
    layer = document.createElement('div');
    layer.id = PARTICLE_LAYER_ID;
    if (layer.setAttribute) {
      layer.setAttribute('aria-hidden', 'true');
      layer.setAttribute(
        'style',
        'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;',
      );
    }
    if (document.body && document.body.appendChild) document.body.appendChild(layer);
  }
  return layer;
}

function clearParticles() {
  const layer = getParticleLayer();
  if (!layer) return;
  if (particleClearTimer) {
    clearTimeout(particleClearTimer);
    particleClearTimer = null;
  }
  if (layer.children) {
    layer.children.slice ? layer.children.slice().forEach((c) => layer.removeChild(c)) : (layer.innerHTML = '');
  }
}

function paletteFor(moduleColor) {
  // moduleColor 是 CSS var 名稱（例如 var(--module-blue)），實際色值交給 CSS 變數，
  // 這裡只需要決定粒子用主題色＋固定 2 個調色盤色，不用彩虹。
  return [moduleColor || PALETTE_FALLBACK[0], 'var(--color-warning, #f2b705)', 'var(--color-success, #3aa6a6)'];
}

/**
 * 從 targetEl 位置噴出 12–18 顆彩色小星星／圓點粒子，放射狀散開＋淡出，
 * 總長 ≤700ms。純裝飾，播完自動從 DOM 移除；同一時間層內粒子數上限
 * MAX_PARTICLES，快速連點時清掉前一批未播完的粒子。
 */
function spawnParticles(targetEl, moduleColor) {
  const layer = getParticleLayer();
  if (!layer) return;
  clearParticles(); // 前一批尚未播完就先清掉，避免同時間粒子數爆量
  const rect = targetEl && targetEl.getBoundingClientRect ? targetEl.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;
  const colors = paletteFor(moduleColor);
  const count = Math.min(18, MAX_PARTICLES);
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const distance = 36 + Math.random() * 28;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    const dot = document.createElement('span');
    const color = colors[i % colors.length];
    if (dot.setAttribute) {
      dot.setAttribute(
        'style',
        `position:absolute;left:${originX}px;top:${originY}px;width:6px;height:6px;border-radius:50%;` +
          `background:${color};opacity:1;transform:translate(-50%,-50%) scale(1);` +
          `transition:transform ${CORRECT_DURATION_MS}ms ease-out, opacity ${CORRECT_DURATION_MS}ms ease-out;`,
      );
    }
    layer.appendChild(dot);
    // 下一個 frame 才套用位移／淡出樣式，讓 transition 生效（純 transform／opacity 動畫）。
    schedule(() => {
      if (dot.setAttribute) {
        dot.setAttribute(
          'style',
          `position:absolute;left:${originX}px;top:${originY}px;width:6px;height:6px;border-radius:50%;` +
            `background:${color};opacity:0;transform:translate(${dx - 3}px,${dy - 3}px) scale(0.4);` +
            `transition:transform ${CORRECT_DURATION_MS}ms ease-out, opacity ${CORRECT_DURATION_MS}ms ease-out;`,
        );
      }
    }, 16);
  }
  particleClearTimer = setTimeout(() => clearParticles(), CORRECT_DURATION_MS + 50);
}

function schedule(fn, delay) {
  setTimeout(fn, delay);
}

function bounceAndStamp(targetEl, reducedMotion) {
  if (!targetEl || !targetEl.classList) return;
  targetEl.classList.add('celebrate-stamp');
  if (!reducedMotion) {
    targetEl.classList.add('celebrate-bounce');
    setTimeout(() => targetEl.classList.remove('celebrate-bounce'), CORRECT_DURATION_MS);
  }
}

function showFloatingBadge(text) {
  if (!hasWindow() || !document || !document.body) return;
  const badge = document.createElement('div');
  if (badge.setAttribute) {
    badge.setAttribute('class', 'celebrate-streak-badge');
    badge.setAttribute('role', 'status');
    badge.setAttribute('aria-live', 'polite');
  }
  badge.textContent = text;
  document.body.appendChild(badge);
  setTimeout(() => {
    if (badge.parentNode) badge.parentNode.removeChild(badge);
  }, 1200);
}

/**
 * 答對時呼叫：粒子噴發＋選項彈跳放大＋勾勾印章＋（連對達標時）浮動徽章＋音效。
 * @param {object} targetEl 答對的選項／卡片節點（DOM element，用來取得噴發起點與加彈跳樣式）
 * @param {string} [moduleColor] 該大項主題色 CSS 值／var()，粒子配色用
 * @param {{firstTry?: boolean}} [opts] firstTry=false（例如揭曉後才「完成」）不算連對、不噴粒子慶祝
 */
export function celebrateCorrect(targetEl, moduleColor, { firstTry = true } = {}) {
  const reducedMotion = prefersReducedMotion();
  if (firstTry) {
    const n = bumpStreak();
    if (n === 3) showFloatingBadge('連對 3 題！');
    if (n === 5) showFloatingBadge('太厲害了！連對 5 題');
  } else {
    resetStreak();
  }
  bounceAndStamp(targetEl, reducedMotion);
  if (!reducedMotion) spawnParticles(targetEl, moduleColor);
  playCorrectSound();
}

/**
 * 大項完成時呼叫：較大的煙火（較多粒子）、星星一顆一顆飛進完成卡星星列、
 * 新紀錄字樣彈入、完成音效（三音琶音）。
 * @param {object} summaryEl 完成卡容器節點，用來取得煙火起點與星星列
 * @param {{moduleColor?: string, isNewRecord?: boolean, starsEarned?: number}} [opts]
 */
export function celebrateComplete(summaryEl, { moduleColor, isNewRecord = false, starsEarned = 0 } = {}) {
  const reducedMotion = prefersReducedMotion();
  if (!reducedMotion) {
    spawnParticles(summaryEl, moduleColor);
    // 完成煙火比單題答對多噴一輪、範圍略大，靠再噴一次達成「較大」的效果，
    // 仍共用同一支 spawnParticles，不另外寫一套噴發邏輯。
    setTimeout(() => spawnParticles(summaryEl, moduleColor), 250);
    if (summaryEl && summaryEl.querySelectorAll) {
      const starEls = summaryEl.querySelectorAll('.star-row svg');
      starEls.forEach((svg, i) => {
        if (!svg.setAttribute) return;
        svg.setAttribute('style', 'opacity:0;transform:scale(0.3);transition:transform 220ms ease-out, opacity 220ms ease-out;');
        setTimeout(() => {
          svg.setAttribute('style', 'opacity:1;transform:scale(1);transition:transform 220ms ease-out, opacity 220ms ease-out;');
        }, i * STAR_FLY_STAGGER_MS);
      });
    }
  }
  if (isNewRecord && summaryEl && summaryEl.classList) {
    summaryEl.classList.add(reducedMotion ? 'celebrate-new-record--static' : 'celebrate-new-record');
  }
  playCompleteSound();
  return { starsEarned };
}

// ---- 測試專用：重置模組層級狀態，避免測試互相污染（生產程式不呼叫） ----
export function _resetCelebrateStateForTests() {
  streak = 0;
  audioCtx = null;
  particleClearTimer = null;
}
