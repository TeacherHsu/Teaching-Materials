/* 嘴巴探險隊：注音發音位置練習（純前端、無外部相依） */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

/* ───────── 1. 聲道幾何模型 ─────────
   座標是 SVG 座標，臉朝左。舌頭的兩個控制點存在「下巴座標」裡（下巴閉合時的位置），
   畫圖時再跟著下巴一起轉動，並且不能穿過上顎。 */
const PIV = [455, 235], JAW_MAX = 11 * Math.PI / 180;
function rot(p, ang) {
  const c = Math.cos(ang), s = Math.sin(ang), x = p[0] - PIV[0], y = p[1] - PIV[1];
  return [PIV[0] + x * c - y * s, PIV[1] + x * s + y * c];
}
const J = (p, jaw, k = 1) => rot(p, -jaw * JAW_MAX * k);    // 下巴座標 → 畫面
const Jinv = (p, jaw) => rot(p, jaw * JAW_MAX);              // 畫面 → 下巴座標

function roofY(x, vel) {   // 口腔「天花板」：上牙背、牙齦、硬顎、軟顎
  const P = [[160, 292], [168, 292], [176, 290], [184, 266], [198, 253], [222, 239], [250, 229], [275, 225], [305, 226],
    [338, 232], [365, lerp(247, 262, vel)], [395, lerp(270, 302, vel)], [412, lerp(300, 330, vel)]];
  if (x <= P[0][0]) return P[0][1];
  for (let i = 1; i < P.length; i++) if (x <= P[i][0]) {
    const a = P[i - 1], b = P[i];
    return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0]));
  }
  return P[P.length - 1][1];
}
const UP_LIP_BOTTOM = 292, LIP_RY = 12;

function geom(s) {
  const g = {};
  // 嘴唇
  const lcx = 146 - 12 * Math.max(s.lx, 0) + 20 * Math.max(-s.lx, 0);
  let lw = J([lcx, 290 + 34 * s.ly], s.jaw);
  if (lw[1] < UP_LIP_BOTTOM + LIP_RY) lw = [lw[0], UP_LIP_BOTTOM + LIP_RY];
  g.lipL = lw; g.gapL = lw[1] - LIP_RY - UP_LIP_BOTTOM;
  g.lipU = [146 - 12 * Math.max(s.lx, 0), 281];
  g.round = Math.max(s.lx, 0);
  g.labiodental = s.lx < -0.6 && g.gapL < 3;
  g.lipJ = Jinv(lw, s.jaw);
  // 舌頭
  let T = J(s.tip, s.jaw), B = J(s.body, s.jaw);
  T = [clamp(T[0], 172, 300), T[1]]; T[1] = Math.max(T[1], roofY(T[0], s.vel) + 1);
  B = [clamp(B[0], 236, 398), B[1]]; B[1] = Math.max(B[1], roofY(B[0], s.vel) + 2);
  g.T = T; g.B = B;
  g.gapT = T[1] - roofY(T[0], s.vel); g.gapB = B[1] - roofY(B[0], s.vel);
  const root = J([396, 392], s.jaw, 0.3); root[0] = Math.min(root[0], 404);
  const F = J([214, 342], s.jaw), Fm = J([290, 384], s.jaw), bot = J([352, 428], s.jaw, 0.6);
  const p1 = [Math.min(406, B[0] + 36), lerp(B[1], root[1], 0.5)];
  const M = mix(B, T, 0.55); M[1] = Math.max(M[1] - 8, roofY(M[0], s.vel) + 2);
  const tu = [T[0] + 12, T[1] + 13], ub = mix(tu, F, 0.5); ub[0] += 10;
  g.M = M; g.gapM = M[1] - roofY(M[0], s.vel); g.root = root; g.p1 = p1;
  g.tongue = spline([root, p1, B, M, T, tu, ub, F, Fm, bot]);
  // 軟顎
  g.velum = `M338 230 Q${lerp(372, 366, s.vel)} ${lerp(236, 244, s.vel)} ${lerp(400, 382, s.vel)} ${lerp(262, 292, s.vel)}`;
  g.teethL = J([180, 296], s.jaw);
  return g;
}
function spline(p) {  // 封閉的 Catmull-Rom 曲線
  const n = p.length, f = v => v.toFixed(1);
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < n; i++) {
    const a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n], e = p[(i + 2) % n];
    d += `C${f(b[0] + (c[0] - a[0]) / 6)} ${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (e[0] - b[0]) / 6)} ${f(c[1] - (e[1] - b[1]) / 6)} ${f(c[0])} ${f(c[1])}`;
  }
  return d + 'Z';
}

/* ───────── 2. 每個音的嘴型 ─────────
   tip／body 寫成 [x,y] 是下巴座標；寫成 {x,gap} 是「離天花板多遠」（0＝貼住）。 */
const REST_T = [196, 296], REST_B = [305, 262];
const POSE = {
  rest: { jaw: .1, l: [0, .5], tip: REST_T, body: REST_B },
  'ㄚ': { jaw: .9, l: [0, .75], tip: [198, 300], body: [325, 300] },
  'ㄧ': { jaw: .15, l: [-.25, .45], tip: [196, 297], body: { x: 258, gap: 9 } },
  'ㄩ': { jaw: .15, l: [1, .3], tip: [196, 297], body: { x: 258, gap: 9 } },
  'ㄨ': { jaw: .2, l: [1, .3], tip: [215, 302], body: { x: 352, gap: 9 } },
  'ㄛ': { jaw: .5, l: [.7, .55], tip: [212, 303], body: [350, 272] },
  'ㄜ': { jaw: .4, l: [0, .6], tip: [206, 300], body: [338, 258] },
  'ㄝ': { jaw: .55, l: [-.25, .7], tip: [196, 298], body: [275, 262] },
  e:    { jaw: .35, l: [-.25, .6], tip: [196, 297], body: [268, 250] },
  'ㄦ': { jaw: .45, l: [0, .6], tip: { x: 232, gap: 12 }, body: [325, 270] },
  // 聲符的「擋住／靠近」位置（c＝貼住，f＝留一條縫）
  lip_c:   { jaw: .12, l: [0, 0], tip: REST_T, body: REST_B },
  teeth_f: { jaw: .18, l: [-1, 0], tip: REST_T, body: REST_B },
  alv_c:   { jaw: .2, l: [0, .5], tip: { x: 198, gap: 0 }, body: [310, 262] },
  vel_c:   { jaw: .25, l: [0, .5], tip: [208, 302], body: { x: 356, gap: 0 } },
  vel_f:   { jaw: .25, l: [0, .5], tip: [208, 302], body: { x: 356, gap: 6 } },
  pal_c:   { jaw: .12, l: [-.25, .45], tip: [196, 297], body: { x: 250, gap: 0 } },
  pal_f:   { jaw: .12, l: [-.25, .45], tip: [196, 297], body: { x: 250, gap: 5 } },
  retro_c: { jaw: .18, l: [.2, .5], tip: { x: 231, gap: 0 }, body: [322, 266] },
  retro_f: { jaw: .18, l: [.2, .5], tip: { x: 231, gap: 5 }, body: [322, 266] },
  retro_v: { jaw: .22, l: [.2, .5], tip: { x: 231, gap: 10 }, body: [322, 266] },
  dent_c:  { jaw: .08, l: [-.25, .45], tip: { x: 181, gap: 0 }, body: [305, 260] },
  dent_f:  { jaw: .08, l: [-.25, .45], tip: { x: 183, gap: 4 }, body: [305, 260] },
  dent_v:  { jaw: .12, l: [-.25, .45], tip: { x: 185, gap: 9 }, body: [305, 260] },
};
function toState(p, velOverride) {
  const vel = velOverride ?? p.vel ?? 0;
  const pt = v => Array.isArray(v) ? v.slice() : Jinv([v.x, roofY(v.x, vel) + v.gap], p.jaw);
  return { jaw: p.jaw, lx: p.l[0], ly: p.l[1], tip: pt(p.tip), body: pt(p.body), vel };
}
const st = (name, vel) => toState(POSE[name], vel);

/* 聲符：部位、方法、送氣、聲帶 */
const CONS = {
  'ㄅ': ['lip', 'stop', 0, 0], 'ㄆ': ['lip', 'stop', 1, 0], 'ㄇ': ['lip', 'nasal', 0, 1], 'ㄈ': ['teeth', 'fric', 0, 0],
  'ㄉ': ['alv', 'stop', 0, 0], 'ㄊ': ['alv', 'stop', 1, 0], 'ㄋ': ['alv', 'nasal', 0, 1], 'ㄌ': ['alv', 'lat', 0, 1],
  'ㄍ': ['vel', 'stop', 0, 0], 'ㄎ': ['vel', 'stop', 1, 0], 'ㄏ': ['vel', 'fric', 0, 0],
  'ㄐ': ['pal', 'affr', 0, 0], 'ㄑ': ['pal', 'affr', 1, 0], 'ㄒ': ['pal', 'fric', 0, 0],
  'ㄓ': ['retro', 'affr', 0, 0], 'ㄔ': ['retro', 'affr', 1, 0], 'ㄕ': ['retro', 'fric', 0, 0], 'ㄖ': ['retro', 'fric', 0, 1],
  'ㄗ': ['dent', 'affr', 0, 0], 'ㄘ': ['dent', 'affr', 1, 0], 'ㄙ': ['dent', 'fric', 0, 0],
};
const GROUP = {
  lip: ['g-lip', '嘴唇的音（雙唇音）'], teeth: ['g-teeth', '牙齒碰嘴唇的音（唇齒音）'], alv: ['g-tip', '舌尖的音（舌尖音）'],
  vel: ['g-root', '舌根的音（舌根音）'], pal: ['g-face', '舌面的音（舌面音）'], retro: ['g-curl', '翹舌的音（翹舌音）'], dent: ['g-flat', '平舌的音（平舌音）'],
};
const NAME_V = { lip: 'ㄛ', teeth: 'ㄛ', alv: 'ㄜ', vel: 'ㄜ', pal: 'ㄧ' };  // 單念聲符時後面帶的韻
const VOWELS = 'ㄧㄨㄩㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ';
const SIMPLE_V = 'ㄧㄨㄩㄚㄛㄜㄝㄦ';
const FIN = {
  'ㄚ': ['ㄚ'], 'ㄛ': ['ㄛ'], 'ㄜ': ['ㄜ'], 'ㄝ': ['ㄝ'], 'ㄧ': ['ㄧ'], 'ㄨ': ['ㄨ'], 'ㄩ': ['ㄩ'],
  'ㄞ': ['ㄚ', 'ㄧ'], 'ㄟ': ['e', 'ㄧ'], 'ㄠ': ['ㄚ', 'ㄨ'], 'ㄡ': ['ㄛ', 'ㄨ'],
  'ㄢ': ['ㄚ', 'n'], 'ㄣ': ['ㄜ', 'n'], 'ㄤ': ['ㄚ', 'ng'], 'ㄥ': ['ㄜ', 'ng'], 'ㄦ': ['ㄜ', 'ㄦ'],
};
const FIN_AFTER = { 'ㄧㄢ': ['ㄝ', 'n'], 'ㄩㄢ': ['ㄝ', 'n'], 'ㄧㄣ': ['n'], 'ㄩㄣ': ['n'], 'ㄧㄥ': ['ng'], 'ㄨㄥ': ['ng'], 'ㄩㄥ': ['ng'] };

const S3 = '氣會一直流出來，這個音可以拉長。';
const TIP = {
  asp: '試試看：把手心放在嘴巴前面，會感覺到一股氣噴出來。',
  unasp: '試試看：把手心放在嘴巴前面，只有一點點氣。',
  nasal: '試試看：摸摸鼻子，會感覺到震動；捏住鼻子就發不出來。',
  voiced: '試試看：摸摸喉嚨，會感覺到震動。',
  fric: '試試看：' + S3,
  vowel: '試試看：摸摸喉嚨，會感覺到震動。照鏡子看看自己的嘴型。',
};
const STEPS = {
  'ㄅ': ['兩片嘴唇閉緊', '嘴唇輕輕打開'], 'ㄆ': ['兩片嘴唇閉緊', '嘴唇打開，噴出一口氣'], 'ㄇ': ['兩片嘴唇閉緊，氣從鼻子出來', '嘴唇打開'],
  'ㄈ': ['上排牙齒輕輕碰下嘴唇，把氣吹出來', '嘴巴打開'],
  'ㄉ': ['舌尖頂住上牙齦', '舌尖輕輕放開'], 'ㄊ': ['舌尖頂住上牙齦', '舌尖放開，噴出一口氣'], 'ㄋ': ['舌尖頂住上牙齦，氣從鼻子出來', '舌尖放開'],
  'ㄌ': ['舌尖頂住上牙齦，氣從舌頭兩邊流出來', '舌尖放開'],
  'ㄍ': ['舌頭後面抬高，頂住軟顎', '舌頭輕輕放下來'], 'ㄎ': ['舌頭後面抬高，頂住軟顎', '舌頭放下來，噴出一口氣'], 'ㄏ': ['舌頭後面抬高，靠近軟顎，把氣吹出來', '嘴巴打開'],
  'ㄐ': ['舌尖放在下牙齒後面，舌面貼住硬顎', '放開一條小縫，讓氣擠出來'], 'ㄑ': ['舌尖放在下牙齒後面，舌面貼住硬顎', '放開一條小縫，用力噴氣'],
  'ㄒ': ['舌尖放在下牙齒後面，舌面靠近硬顎，把氣吹出來', '嘴巴扁扁的'],
  'ㄓ': ['舌尖翹起來，頂住牙齦後面', '放開一條小縫，讓氣擠出來'], 'ㄔ': ['舌尖翹起來，頂住牙齦後面', '放開一條小縫，用力噴氣'],
  'ㄕ': ['舌尖翹起來，靠近牙齦後面，把氣吹出來', '舌頭不要動，發出聲音'], 'ㄖ': ['舌尖翹起來，靠近牙齦後面', '一邊吹氣，一邊讓喉嚨震動'],
  'ㄗ': ['舌尖頂住上牙齒後面', '放開一條小縫，讓氣擠出來'], 'ㄘ': ['舌尖頂住上牙齒後面', '放開一條小縫，用力噴氣'], 'ㄙ': ['舌尖靠近上牙齒後面，把氣吹出來', '舌頭不要動，發出聲音'],
  'ㄧ': ['嘴巴扁扁的，像在微笑', '舌頭前面抬高'], 'ㄨ': ['嘴唇圓圓的，往前嘟', '舌頭後面抬高'], 'ㄩ': ['嘴唇圓圓的，往前嘟', '舌頭前面抬高'],
  'ㄚ': ['嘴巴張大', '舌頭放低'], 'ㄛ': ['嘴唇圓圓的，嘴巴半開', '舌頭往後縮'], 'ㄜ': ['嘴巴半開，嘴唇放鬆', '舌頭後面稍微抬高'], 'ㄝ': ['嘴巴半開，嘴角往兩邊', '舌頭往前'],
  'ㄞ': ['先做ㄚ：嘴巴張大', '再滑到ㄧ：嘴巴變扁'], 'ㄟ': ['先做ㄝ：嘴巴半開', '再滑到ㄧ：嘴巴變扁'], 'ㄠ': ['先做ㄚ：嘴巴張大', '再滑到ㄨ：嘴唇變圓'], 'ㄡ': ['先做ㄛ：嘴唇圓圓的', '再滑到ㄨ：嘴唇更小更圓'],
  'ㄢ': ['先做ㄚ：嘴巴張大', '舌尖頂住上牙齦，氣從鼻子出來'], 'ㄣ': ['先做ㄜ：嘴巴半開', '舌尖頂住上牙齦，氣從鼻子出來'],
  'ㄤ': ['先做ㄚ：嘴巴張大', '舌頭後面抬高，氣從鼻子出來'], 'ㄥ': ['先做ㄜ：嘴巴半開', '舌頭後面抬高，氣從鼻子出來'], 'ㄦ': ['先做ㄜ：嘴巴半開', '舌尖往上捲起來'],
};

/* ───────── 3. 把一個音節變成一連串動作 ───────── */
function vowelState(code) {
  if (code === 'n') return st('alv_c', 1);
  if (code === 'ng') return st('vel_c', 1);
  return st(code);
}
// parts: {ini, med, fin}；回傳 [{to, move, hold, sym, li, voiced, air, lateral}]
function buildSteps(parts, solo) {
  const { ini, med, fin } = parts, out = [];
  let codes = [];
  if (med) codes.push(med);
  if (fin) codes = codes.concat((med && FIN_AFTER[med + fin]) || FIN[fin]);
  let sym = 0;
  if (ini) {
    const [place, manner, asp, voiced] = CONS[ini];
    let tail = codes.slice();
    if (!tail.length && NAME_V[place] && (solo || !POSE[place + '_v'])) tail = [NAME_V[place]];
    const next = tail.length ? vowelState(tail[0]) : null;
    const shape = name => {           // 預先擺好後面韻母的嘴型
      const s = st(name, manner === 'nasal' ? 1 : 0);
      if (next) {
        if (place === 'lip' || place === 'teeth') { s.tip = next.tip.slice(); s.body = next.body.slice(); }
        else if (next.lx > .5) s.lx = .7;
      }
      return s;
    };
    const closeName = place === 'teeth' ? 'teeth_f' : place + '_c', fricName = place + '_f';
    if (manner === 'stop') out.push({ to: shape(closeName), move: 380, hold: 520, sym, li: 0, air: 1, burst: asp ? 2 : 1 });
    else if (manner === 'affr') {
      out.push({ to: shape(closeName), move: 380, hold: 420, sym, li: 0, air: 1 });
      out.push({ to: shape(fricName), move: 120, hold: 420, sym, li: 1, air: asp ? 2 : 1 });
    } else if (manner === 'fric') out.push({ to: shape(place === 'teeth' ? 'teeth_f' : fricName), move: 380, hold: 800, sym, li: 0, air: 2, voiced });
    else out.push({ to: shape(closeName), move: 380, hold: 700, sym, li: 0, air: 1, voiced: 1, lateral: manner === 'lat' });
    if (!tail.length) {               // ㄓㄔㄕㄖㄗㄘㄙ 單獨成音節：舌頭留在原地出聲
      out.push({ to: st(place + '_v'), move: 200, hold: 650, sym, li: 1, air: 1, voiced: 1 });
    } else if (!codes.length) {
      out.push({ to: next, move: 260, hold: 600, sym, li: 1, air: out[0].burst || 1, voiced: 1 });
    }
    sym++;
  }
  const burst = out.length && out[0].burst;
  codes.forEach((c, i) => {
    const isMed = med && i === 0;
    const to = vowelState(c);
    if ((c === 'n' || c === 'ng') && i > 0) { const prev = out[out.length - 1].to; to.lx = prev.lx > .5 ? .6 : to.lx; }
    out.push({ to, move: i === 0 ? 260 : 380, hold: isMed && codes.length > 1 ? 220 : 480, sym: isMed ? sym : sym + (med ? 1 : 0),
      li: solo ? Math.min(i, 1) : -1, air: i === 0 && burst ? burst : 1, voiced: 1 });
  });
  return out;
}
function parseSyl(z) {
  const tone = (z.match(/[ˊˇˋ˙]/) || [''])[0];
  const b = [...z.replace(/[ˊˇˋ˙]/g, '')];
  const parts = { tone };
  if (CONS[b[0]]) parts.ini = b.shift();
  if (b.length > 1 && 'ㄧㄨㄩ'.includes(b[0])) parts.med = b.shift();
  if (b.length) parts.fin = b[0];
  parts.syms = [parts.ini, parts.med, parts.fin].filter(Boolean);
  return parts;
}

/* ───────── 4. 畫面狀態 ───────── */
let state = st('rest');
let mode = 'explore', playing = null, dirty = true, slow = false;
const flow = { air: 1, voiced: false, lateral: false };
let target = null, targetSym = null, hintOn = true, solved = false, okSince = 0;
let stars = 0;
try { stars = +localStorage.getItem('mouthExplorerStars') || 0; } catch (e) { /* 沒有儲存空間也能玩 */ }

const el = {};
['stage', 'velum', 'jawG', 'jawFlesh', 'tongue', 'tongueClip', 'tongueLine', 'tintTip', 'tintBody', 'restTongue', 'zone', 'marks', 'lipU', 'lipL', 'ghostTongue', 'ghostLip', 'ghostVelum', 'particles', 'labels',
  'folds', 'voiceWave', 'hVel', 'hJaw', 'hLip', 'hBody', 'hTip'].forEach(k => el[k] = $(k));
let G = geom(state);

/* 「碰到了」「留一條縫」的記號，和發音部位的綠色提示帶 */
const MARK = {};
['lip', 'tip', 'body'].forEach(k => {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'mark');
  g.innerHTML = '<circle r="12"/><text y="5"></text>'; g.setAttribute('hidden', ''); el.marks.appendChild(g); MARK[k] = g;
});
function setMark(k, kind, p) {
  const g = MARK[k]; g.toggleAttribute('hidden', !kind); if (!kind) return;
  g.setAttribute('class', 'mark ' + kind); g.setAttribute('transform', `translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})`);
  g.lastChild.textContent = kind === 'hit' ? '碰' : '縫';
}
let zonePlace = null;
const ZONE = { dent: [172, 186], alv: [186, 212], retro: [214, 250], pal: [236, 300], vel: [338, 392] };
function setZone(place) {
  zonePlace = place; dirty = true;
  if (!place) return;
  let d;
  if (place === 'lip') d = 'M128 292a17 17 0 1 0 34 0a17 17 0 1 0 -34 0';
  else if (place === 'teeth') d = 'M150 296a16 12 0 1 0 32 0a16 12 0 1 0 -32 0';
  else { const [x0, x1] = ZONE[place]; d = ''; for (let i = 0; i <= 8; i++) { const x = lerp(x0, x1, i / 8); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (roofY(x, 0) - 3).toFixed(1); } }
  el.zone.setAttribute('d', d);
}
function render() {
  G = geom(state);
  const deg = -state.jaw * JAW_MAX * 180 / Math.PI;
  el.jawG.setAttribute('transform', `rotate(${deg.toFixed(2)} ${PIV[0]} ${PIV[1]})`);
  const [cx, cy] = G.lipJ;
  el.jawFlesh.setAttribute('d', `M${cx - 18} ${cy + 2}C120 ${cy + 26} 126 356 150 376C190 400 260 405 320 438L334 440C350 420 350 380 330 365L300 352L210 333L192 323L168 323L${cx + 14} ${cy + 2}Z`);
  el.tongue.setAttribute('d', G.tongue); el.tongueClip.setAttribute('d', G.tongue); el.tongueLine.setAttribute('d', G.tongue);
  el.tintTip.setAttribute('cx', G.T[0] + 6); el.tintTip.setAttribute('cy', G.T[1] + 6);
  el.tintBody.setAttribute('cx', G.B[0]); el.tintBody.setAttribute('cy', G.B[1] + 12);
  el.zone.toggleAttribute('hidden', !(zonePlace && (playing || mode === 'challenge')));
  el.velum.setAttribute('d', G.velum);
  setLip(el.lipL, G.lipL, G.round, 16, LIP_RY);
  setLip(el.lipU, G.lipU, G.round, 17, 11);
  place(el.hTip, G.T); place(el.hBody, G.B); place(el.hLip, G.lipL);
  place(el.hJaw, J([170, 372], state.jaw)); place(el.hVel, [448, 272]);
  describe();
  if (mode === 'challenge') checkMatch();
  dirty = false;
}
function setLip(e, c, round, rx, ry) {
  e.setAttribute('cx', c[0].toFixed(1)); e.setAttribute('cy', c[1].toFixed(1));
  e.setAttribute('rx', (rx - 4 * round).toFixed(1)); e.setAttribute('ry', ry);
}
const place = (e, p) => e.setAttribute('transform', `translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})`);

/* 現在的嘴型，用孩子聽得懂的話說出來 */
const VREF = [...'ㄧㄨㄩㄚㄛㄜㄝ'].map(v => { const s = st(v); return { v, s, g: geom(s) }; });
function describe() {
  const s = state, g = G, closed = g.gapL < 2.5;
  let lip, tip, body, like = [];
  if (g.labiodental) lip = '下嘴唇碰到上排牙齒';
  else if (closed) lip = '閉起來';
  else if (s.lx > .5) lip = '圓圓的，往前嘟';
  else if (g.gapL > 30) lip = '張得大大的';
  else if (s.lx < -.15) lip = '扁扁的';
  else lip = '張開';
  const tz = g.T[0] < 187 ? 0 : g.T[0] < 212 ? 1 : g.T[0] < 256 ? 2 : 3;
  const tNames = ['上牙齒後面', '上牙齦', '牙齦後面（翹起來）'];
  const tNear = g.gapT < 8 && tz < 3 && !(s.tip[1] > 288 && g.gapT > 2.5);
  if (g.gapT < 2.5 && tz < 3) tip = '頂住' + tNames[tz];
  else if (tNear) tip = '靠近' + tNames[tz] + '，留一條縫';
  else if (s.tip[1] > 288) tip = '放在下牙齒後面';
  else if (g.T[1] < g.B[1] - 4) tip = '往上翹';
  else tip = '放平';
  const bz = g.B[0] < 325 ? '硬顎' : '軟顎';
  if (g.gapB < 2.5) body = (bz === '軟顎' ? '後面抬高，頂住' : '抬高，貼住') + bz;
  else if (g.gapB < 8) body = '抬高，靠近' + bz;
  else if (g.gapB < 16) body = g.B[0] < 300 ? '前面抬高' : '後面抬高';
  else if (s.body[1] > 282) body = '放低';
  else body = '放鬆';
  if (closed && !g.labiodental) like = s.vel > .5 ? ['ㄇ'] : ['ㄅ', 'ㄆ'];
  else if (g.labiodental) like = ['ㄈ'];
  else if (tNear) like = tz === 0 ? ['ㄗ', 'ㄘ', 'ㄙ'] : tz === 1 ? (s.vel > .5 ? ['ㄋ'] : ['ㄉ', 'ㄊ', 'ㄌ']) : ['ㄓ', 'ㄔ', 'ㄕ', 'ㄖ'];
  else if (g.gapB < 8) like = bz === '硬顎' ? ['ㄐ', 'ㄑ', 'ㄒ'] : ['ㄍ', 'ㄎ', 'ㄏ'];
  else if (tz === 2 && g.gapT < 18 && s.tip[1] < 285) like = ['ㄦ'];
  else {
    let best = null, bd = 1e9;
    for (const r of VREF) {
      const d = ((s.jaw - r.s.jaw) / .35) ** 2 + ((s.lx - r.s.lx) / .7) ** 2 + (dist(g.B, r.g.B) / 40) ** 2;
      if (d < bd) { bd = d; best = r.v; }
    }
    like = bd < 2.2 ? [best] : [];
  }
  setMark('lip', g.labiodental ? 'slit' : closed ? 'hit' : null, g.labiodental ? [176, 294] : [g.lipU[0] - 2, UP_LIP_BOTTOM]);
  setMark('tip', tz < 3 && g.gapT < 2.5 ? 'hit' : tNear ? 'slit' : null, [g.T[0] - 3, roofY(g.T[0], s.vel) - 9]);
  setMark('body', g.gapB < 2.5 ? 'hit' : g.gapB < 8 ? 'slit' : null, [g.B[0], roofY(g.B[0], s.vel) - 10]);
  $('nowLip').textContent = lip; $('nowTip').textContent = tip; $('nowBody').textContent = body;
  $('nowVel').textContent = s.vel > .5 ? '通道打開，氣從鼻子出來' : '通道關著，氣從嘴巴出來';
  const key = like.join('');
  const box = $('likeChips');
  if (box.dataset.key !== key) {
    box.dataset.key = key; box.textContent = '';
    if (!like.length) box.textContent = '（再調調看）';
    like.forEach(z => { const b = document.createElement('button'); b.className = 'likeChip ' + keyClass(z); b.textContent = z; b.onclick = () => pickSymbol(z); box.appendChild(b); });
  }
  const nb = $('btnNose'); nb.textContent = '👃 鼻子通道：' + (s.vel > .5 ? '開' : '關'); nb.setAttribute('aria-pressed', s.vel > .5);
}
const keyClass = z => CONS[z] ? GROUP[CONS[z][0]][0] : ('ㄧㄨㄩ'.includes(z) ? 'g-mid' : 'g-vow');

/* ───────── 5. 氣流小點點 ───────── */
const NP = 24, parts = [];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
for (let i = 0; i < NP; i++) {
  const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c.setAttribute('r', 4); c.setAttribute('class', 'pt'); el.particles.appendChild(c);
  parts.push({ c, d: Math.random() * 500, off: (Math.random() - .5) * 9, route: 'o', sp: .8 + Math.random() * .5 });
}
function routes() {
  const g = G, s = state, mid = (p, gap) => [p[0], p[1] - gap / 2];
  const base = [[394, 596], [394, 520], [(g.root[0] + 414) / 2 + 2, 430], [(g.p1[0] + 414) / 2 + 2, g.p1[1]]];
  const lipGap = g.labiodental ? 5 : g.gapL;
  const oral = base.concat([mid(g.B, g.gapB), mid(g.M, g.gapM), mid([g.T[0] - 2, g.T[1]], g.gapT),
    [170, (UP_LIP_BOTTOM + g.teethL[1]) / 2 + 2], [g.lipU[0] - 2, UP_LIP_BOTTOM + g.gapL / 2], [g.lipU[0] - 70, UP_LIP_BOTTOM + g.gapL / 2 + 6]]);
  const gaps = [99, 99, 99, 99, g.gapB, g.gapM, flow.lateral ? 6 : g.gapT, 99, lipGap, 99];
  const nasal = base.concat([[405, 290], [404, 236], [352, 200], [250, 188], [160, 224], [104, 257], [56, 272]]);
  return { oral: measure(oral, gaps), nasal: measure(nasal, null), nasalOpen: s.vel > .5 };
}
function measure(pts, gaps) {
  const len = [0]; let block = Infinity;
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + dist(pts[i - 1], pts[i]));
  if (gaps) for (let i = 0; i < gaps.length; i++) if (gaps[i] < 2.5) { block = len[i] - 9; break; }
  return { pts, len, gaps, block, total: len[len.length - 1] };
}
function at(r, d) {
  const { pts, len } = r;
  for (let i = 1; i < pts.length; i++) if (d <= len[i]) { const t = (d - len[i - 1]) / (len[i] - len[i - 1] || 1); return { p: mix(pts[i - 1], pts[i], t), i }; }
  return { p: pts[pts.length - 1], i: pts.length - 1 };
}
function tickParticles(dt) {
  if (!flow.air || reduce) { if (el.particles.style.display !== 'none') el.particles.style.display = 'none'; return; }
  el.particles.style.display = '';
  const R = routes(), speed = (flow.air === 2 ? 0.34 : 0.13) * dt;
  for (const q of parts) {
    let r = q.route === 'n' ? R.nasal : R.oral;
    if (q.route === 'n' && !R.nasalOpen && q.d < r.len[4]) q.route = 'o', r = R.oral;
    if (q.route === 'o' && R.nasalOpen && q.d < R.oral.len[3] && (R.oral.block < Infinity || q.off > 0)) q.route = 'n', r = R.nasal;
    q.d += speed * q.sp;
    if (q.d > r.total) { q.d = Math.random() * 40; q.route = 'o'; q.off = (Math.random() - .5) * 9; }
    let d = q.d, piled = false;
    if (r.block < Infinity && d > r.block) { d = q.d = r.block - Math.random() * 26; piled = true; }
    const { p, i } = at(r, d);
    let hot = false;
    if (r.gaps) for (const k of [i - 1, i]) if (r.gaps[k] < 8 && Math.abs(d - r.len[k]) < 16) hot = true;
    const squeeze = piled ? 1.4 : hot ? .25 : 1;
    q.c.setAttribute('cx', (p[0] + (piled ? (Math.random() - .5) * 6 : 0)).toFixed(1));
    q.c.setAttribute('cy', (p[1] + q.off * squeeze).toFixed(1));
    q.c.setAttribute('class', hot || flow.air === 2 ? 'pt hot' : 'pt');
  }
}

/* ───────── 6. 動畫播放 ───────── */
function lerpState(a, b, t) {
  return { jaw: lerp(a.jaw, b.jaw, t), lx: lerp(a.lx, b.lx, t), ly: lerp(a.ly, b.ly, t), tip: mix(a.tip, b.tip, t), body: mix(a.body, b.body, t), vel: lerp(a.vel, b.vel, t) };
}
function play(steps, onStep, onDone) {
  stop();
  playing = { steps, i: -1, t0: 0, from: null, onStep, onDone };
  el.stage.classList.add('playing'); el.restTongue.toggleAttribute('hidden', mode !== 'explore');
  nextStep(performance.now());
}
function nextStep(now) {
  const p = playing; p.i++;
  if (p.i >= p.steps.length) { const done = p.onDone; stop(); done && done(); return; }
  const s = p.steps[p.i];
  p.t0 = now; p.from = JSON.parse(JSON.stringify(state)); p.released = false;
  flow.voiced = !!s.voiced; flow.air = s.air; flow.lateral = !!s.lateral;
  setVoice();
  p.onStep && p.onStep(s);
}
function stop() {
  if (!playing) return;
  playing = null; el.stage.classList.remove('playing'); el.restTongue.setAttribute('hidden', ''); dirty = true;
  flow.voiced = false; flow.air = 1; flow.lateral = false; setVoice();
}
function setVoice() { el.folds.classList.toggle('vib', flow.voiced); el.voiceWave.toggleAttribute('hidden', !flow.voiced); }
function tickPlay(now) {
  const p = playing, s = p.steps[p.i], k = slow ? 2.4 : 1.4;
  const t = (now - p.t0) / (s.move * k);
  if (t < 1) { const e = t * t * (3 - 2 * t); state = lerpState(p.from, s.to, e); dirty = true; }
  else {
    if (!p.snapped) { state = lerpState(p.from, s.to, 1); dirty = true; }
    if (now - p.t0 > (s.move + s.hold) * k) nextStep(now);
  }
}
let last = performance.now();
function frame(now) {
  const dt = Math.min(50, now - last); last = now;
  if (playing) tickPlay(now);
  if (dirty) render();
  tickParticles(dt);
  requestAnimationFrame(frame);
}

/* ───────── 7. 拖拉 ───────── */
function svgPoint(ev) {
  const m = el.stage.getScreenCTM().inverse();
  return [ev.clientX * m.a + ev.clientY * m.c + m.e, ev.clientX * m.b + ev.clientY * m.d + m.f];
}
function moveHandle(kind, p) {
  const s = state;
  if (kind === 'tip') {
    let x = clamp(p[0], 172, 300), y = Math.max(p[1], roofY(x, s.vel) + 1);
    let j = Jinv([x, y], s.jaw);
    j[1] = Math.min(j[1], 318); if (j[1] > 298) j[0] = Math.max(j[0], 192);
    j[0] = Math.min(j[0], s.body[0] - 40);
    s.tip = j;
  } else if (kind === 'body') {
    let x = clamp(p[0], 236, 398), y = Math.max(p[1], roofY(x, s.vel) + 2);
    let j = Jinv([x, y], s.jaw);
    j[1] = Math.min(j[1], 305); j[0] = clamp(j[0], s.tip[0] + 40, 392);
    s.body = j;
  } else if (kind === 'lip') {
    const j = Jinv(p, s.jaw);
    s.ly = clamp((j[1] - 290) / 34, 0, 1);
    let lx = j[0] < 146 ? clamp((146 - j[0]) / 12, 0, 1) : -clamp((j[0] - 146) / 20, 0, 1);
    s.lx = Math.abs(lx) < .18 ? 0 : lx;
  } else if (kind === 'jaw') {
    s.jaw = clamp((p[1] - 372) / 58, 0, 1);
  }
  dirty = true;
}
function handlePos(kind) {
  return kind === 'tip' ? G.T : kind === 'body' ? G.B : kind === 'lip' ? G.lipL : J([170, 372], state.jaw);
}
[['hTip', 'tip'], ['hBody', 'body'], ['hLip', 'lip'], ['hJaw', 'jaw']].forEach(([id, kind]) => {
  const h = el[id]; let grab = null;
  h.addEventListener('pointerdown', ev => {
    ev.preventDefault(); stop(); h.setPointerCapture(ev.pointerId);
    const p = svgPoint(ev), c = handlePos(kind); grab = [p[0] - c[0], p[1] - c[1]];
  });
  h.addEventListener('pointermove', ev => { if (!grab) return; const p = svgPoint(ev); moveHandle(kind, [p[0] - grab[0], p[1] - grab[1]]); });
  const end = () => { grab = null; };
  h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end);
  h.addEventListener('keydown', ev => {
    const d = { ArrowLeft: [-4, 0], ArrowRight: [4, 0], ArrowUp: [0, -4], ArrowDown: [0, 4] }[ev.key];
    if (!d) return; ev.preventDefault(); stop();
    const c = handlePos(kind); moveHandle(kind, [c[0] + d[0], c[1] + d[1]]);
  });
});
function toggleVel() { stop(); state.vel = state.vel > .5 ? 0 : 1; dirty = true; }
el.hVel.addEventListener('click', toggleVel);
el.hVel.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggleVel(); } });
$('btnNose').onclick = toggleVel;
$('btnReset').onclick = () => { stop(); play([{ to: st('rest'), move: 300, hold: 0, air: 1 }]); };
$('btnLabels').onclick = e => { const on = el.labels.style.display === 'none'; el.labels.style.display = on ? '' : 'none'; e.currentTarget.setAttribute('aria-pressed', on); };
$('btnSlow').onclick = e => { slow = !slow; e.currentTarget.textContent = '🐢 慢動作：' + (slow ? '開' : '關'); e.currentTarget.setAttribute('aria-pressed', slow); };

/* ───────── 8. 說明卡、注音鍵盤、語音 ───────── */
let DATA = null, charMap = null, wordMap = null;
function loadData() {
  const sc = document.createElement('script'); sc.src = 'zhuyin-data.js';
  sc.onload = () => {
    DATA = window.ZHUYIN_DATA; charMap = new Map(); wordMap = new Map();
    DATA.c.split(';').forEach(e => charMap.set(e[0], e.slice(1).split(',')));
    DATA.w.split(';').forEach(e => { const i = e.indexOf(' '); wordMap.set(e.slice(0, i), e.slice(i + 1).split(' ')); });
    if ($('txt').value.trim()) analyze();
  };
  sc.onerror = () => { $('syls').innerHTML = '<span class="msg">字音資料載入失敗，請重新整理網頁。</span>'; };
  document.head.appendChild(sc);
}
function speak(text, rate) {
  if (!('speechSynthesis' in window) || !text) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = 'zh-TW'; u.rate = rate || (slow ? .55 : .8);
    const v = speechSynthesis.getVoices().find(v => /zh[-_]TW/i.test(v.lang)); if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch (e) { /* 沒有語音也沒關係，畫面仍可使用 */ }
}
const speakSym = z => speak((DATA && DATA.s[z]) || z);

let curSym = null;
function showDetail(z, li) {
  if (curSym !== z) {
    curSym = z;
    const c = CONS[z];
    setZone(c ? c[0] : null);
    $('bigSym').textContent = z; $('bigSym').className = 'bigSym ' + keyClass(z);
    $('groupTag').textContent = c ? GROUP[c[0]][1] : 'ㄧㄨㄩ'.includes(z) ? '介符（也可以當韻符）' : 'ㄞㄟㄠㄡ'.includes(z) ? '韻符（嘴巴會滑動）' : 'ㄢㄣㄤㄥ'.includes(z) ? '韻符（最後氣從鼻子出來）' : '韻符';
    $('steps').innerHTML = STEPS[z].map(t => `<li>${t}</li>`).join('');
    const nasal = c ? c[1] === 'nasal' : 'ㄢㄣㄤㄥ'.includes(z), voiced = c ? !!c[3] : true;
    const strong = c && (c[2] || c[1] === 'fric');
    $('badges').innerHTML = [
      [`💨 氣流：${strong ? '強' : '弱'}`, strong], [`〰️ 喉嚨：${voiced ? '會震動' : '不震動'}`, voiced], [`👃 鼻子：${nasal ? '有氣出來' : '沒有氣'}`, nasal],
    ].map(([t, on]) => `<span class="badge${on ? ' on' : ''}">${t}</span>`).join('');
    $('tip').textContent = !c ? (nasal ? TIP.nasal : TIP.vowel) : c[1] === 'nasal' ? TIP.nasal : c[1] === 'fric' ? (c[3] ? TIP.voiced : TIP.fric) : c[1] === 'lat' ? TIP.voiced : c[2] ? TIP.asp : TIP.unasp;
    $('btnReplay').hidden = $('btnSpeak').hidden = false;
    document.querySelectorAll('.key').forEach(k => k.classList.toggle('on', k.textContent === z));
  }
  [...$('steps').children].forEach((n, i) => n.classList.toggle('cur', i === li));
}
function demo(z) {
  const parts = CONS[z] ? { ini: z } : { fin: z };
  showDetail(z, -1); speakSym(z);
  play(buildSteps(parts, true), s => showDetail(z, s.li), () => showDetail(z, -1));
}
function pickSymbol(z) {
  clearSylCur();
  if (mode === 'challenge') {
    if (targetPose(z)) return setTarget(z);
    $('missionSym').textContent = z; flashMission('這個音嘴巴會滑動，先看示範！');
  }
  demo(z);
}
function buildKeys() {
  const mk = (z, box) => { const b = document.createElement('button'); b.className = 'key ' + keyClass(z); b.textContent = z; b.setAttribute('aria-label', '注音 ' + z); b.onclick = () => pickSymbol(z); box.appendChild(b); };
  Object.keys(CONS).forEach(z => mk(z, $('keysC'))); [...VOWELS].forEach(z => mk(z, $('keysV')));
}
$('btnReplay').onclick = () => curSym && demo(curSym);
$('btnSpeak').onclick = () => curSym && speakSym(curSym);

/* ───────── 9. 輸入國字 ───────── */
let syls = [];
function analyze() {
  const text = $('txt').value.trim(), box = $('syls');
  syls = []; box.textContent = '';
  if (!text) return;
  if (!charMap) { box.innerHTML = '<span class="msg">字音資料載入中，請等一下……</span>'; return; }
  const chars = [...text].filter(c => /\p{Script=Han}/u.test(c));
  for (let i = 0; i < chars.length;) {
    let hit = null;
    for (let n = Math.min(4, chars.length - i); n >= 2 && !hit; n--) { const w = chars.slice(i, i + n).join(''); if (wordMap.has(w)) hit = [n, wordMap.get(w)]; }
    if (hit) { for (let k = 0; k < hit[0]; k++) { const rs = charMap.get(chars[i + k]) || [hit[1][k]]; syls.push({ ch: chars[i + k], rs, r: hit[1][k] }); } i += hit[0]; }
    else { const rs = charMap.get(chars[i]); syls.push({ ch: chars[i], rs: rs || [], r: rs ? rs[0] : null }); i++; }
  }
  syls.forEach((s, idx) => {
    const b = document.createElement('button'); b.className = 'syl' + (s.r ? '' : ' unk'); s.el = b;
    drawSyl(s);
    b.onclick = () => { if (!s.r) return; if (s.cur && s.rs.length > 1 && !playing) { s.r = s.rs[(s.rs.indexOf(s.r) + 1) % s.rs.length]; drawSyl(s); } playSyls(idx, idx); };
    box.appendChild(b);
  });
  if (syls.some(s => !s.r)) { const m = document.createElement('span'); m.className = 'msg'; m.textContent = '灰色的字查不到注音，會先跳過。'; box.appendChild(m); }
  if (syls.some(s => s.rs.length > 1)) { const m = document.createElement('span'); m.className = 'msg'; m.style.color = '#52607f'; m.textContent = '有「↻」的字有別的讀音：再點一次那個字就會換。'; box.appendChild(m); }
}
function drawSyl(s) {
  const esc = t => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let zy = '（查不到）';
  if (s.r) { s.parts = parseSyl(s.r); zy = (s.parts.tone === '˙' ? '˙' : '') + s.parts.syms.map(z => `<i>${z}</i>`).join('') + (s.parts.tone !== '˙' ? s.parts.tone : ''); }
  s.el.innerHTML = `<span class="ch">${esc(s.ch)}</span><span class="zy">${zy}</span>` + (s.rs.length > 1 ? '<span class="alt">↻ 換讀音</span>' : '');
  s.el.setAttribute('aria-label', `${s.ch} ${s.r || '查不到注音'}`);
}
function clearSylCur() { syls.forEach(s => { s.cur = false; s.el.classList.remove('cur'); s.el.querySelectorAll('i').forEach(n => n.classList.remove('cur')); }); }
function playSyls(from, to) {
  const list = syls.slice(from, to + 1).filter(s => s.r);
  if (!list.length) return;
  if (mode === 'challenge') setMode('explore');
  let steps = [];
  list.forEach(s => buildSteps(s.parts, false).forEach(q => steps.push(Object.assign(q, { syl: s }))));
  speak(list.map(s => s.ch).join(''), list.length > 1 ? (slow ? .5 : .7) : 0);
  play(steps, q => {
    clearSylCur(); q.syl.cur = true; q.syl.el.classList.add('cur');
    const n = q.syl.el.querySelectorAll('i')[q.sym]; n && n.classList.add('cur');
    showDetail(q.syl.parts.syms[q.sym], -1);
  }, () => { if (list.length > 1) clearSylCur(); else syls.forEach(s => s.el.querySelectorAll('i').forEach(n => n.classList.remove('cur'))); });
}
$('btnPlayTxt').onclick = () => { analyze(); playSyls(0, syls.length - 1); };
$('txt').addEventListener('keydown', ev => { if (ev.key === 'Enter' && !ev.isComposing) { analyze(); playSyls(0, syls.length - 1); } });
$('txt').addEventListener('input', ev => { if (!ev.isComposing) analyze(); });
$('txt').addEventListener('compositionend', analyze);

/* ───────── 10. 模仿挑戰 ───────── */
const CH_ORDER = [...'ㄚㄧㄨㄅㄇㄉㄋㄍㄩㄛㄜㄈㄌㄏㄐㄒㄗㄙㄓㄕㄆㄊㄎㄝㄑㄘㄔㄖㄦ'];
let chIdx = -1;
function targetPose(z) {
  const c = CONS[z];
  if (!c) return SIMPLE_V.includes(z) ? st(z) : null;
  const [place, manner] = c;
  return st(place === 'teeth' ? 'teeth_f' : place + (manner === 'fric' ? '_f' : '_c'), manner === 'nasal' ? 1 : 0);
}
function setTarget(z) {
  stop(); targetSym = z; target = targetPose(z); solved = false; okSince = 0;
  $('missionSym').textContent = z; $('cheer').hidden = true;
  showDetail(z, -1);
  state = st('rest'); drawGhost(); dirty = true;
}
function drawGhost() {
  const show = mode === 'challenge' && target && hintOn;
  el.ghostTongue.toggleAttribute('hidden', !show); el.ghostLip.toggleAttribute('hidden', !show); el.ghostVelum.toggleAttribute('hidden', !(show && target.vel > .5));
  if (!show) return;
  const g = geom(target);
  el.ghostTongue.setAttribute('d', g.tongue);
  setLip(el.ghostLip, g.lipL, g.round, 16, LIP_RY);
  el.ghostVelum.setAttribute('d', g.velum);
}
function checkMatch() {
  if (!target) return;
  const g = G, t = geom(target), s = state;
  const closedT = t.gapL < 2.5, closedS = g.gapL < 2.5;
  const ok = {
    lip: closedT ? (closedS && Math.abs(s.lx - target.lx) < .6) : (!closedS && Math.abs(s.lx - target.lx) < .5 && Math.abs(g.gapL - t.gapL) < 12),
    jaw: Math.abs(s.jaw - target.jaw) < .22,
    tip: dist(g.T, t.T) < 16 && (t.gapT > 2.5 || g.gapT < 4),
    body: dist(g.B, t.B) < 20 && (t.gapB > 2.5 || g.gapB < 4),
    vel: (s.vel > .5) === (target.vel > .5),
  };
  const names = { lip: '嘴唇', jaw: '下巴', tip: '舌尖', body: '舌面', vel: '鼻子' };
  $('checks').innerHTML = Object.keys(names).map(k => `<span class="chk${ok[k] ? ' ok' : ''}">${ok[k] ? '✔' : '○'} ${names[k]}</span>`).join('');
  el.hLip.classList.toggle('ok', ok.lip); el.hJaw.classList.toggle('ok', ok.jaw); el.hTip.classList.toggle('ok', ok.tip);
  el.hBody.classList.toggle('ok', ok.body); el.hVel.classList.toggle('ok', ok.vel);
  const all = Object.values(ok).every(Boolean);
  if (!all) okSince = 0;
  else if (!solved && !playing) {
    if (!okSince) { okSince = performance.now(); setTimeout(() => { dirty = true; }, 520); }
    else if (performance.now() - okSince > 480) win();
  }
}
function win() {
  solved = true; stars++;
  try { localStorage.setItem('mouthExplorerStars', stars); } catch (e) { /* 略過 */ }
  $('starCount').textContent = stars;
  const c = $('cheer'); c.hidden = false; c.textContent = '🎉 太棒了！這就是 ' + targetSym;
  speakSym(targetSym);
  setTimeout(() => { c.hidden = true; }, 2600);
}
function flashMission(t) { const c = $('cheer'); c.hidden = false; c.textContent = t; setTimeout(() => { c.hidden = true; }, 1800); }
function nextTarget() { chIdx = (chIdx + 1) % CH_ORDER.length; setTarget(CH_ORDER[chIdx]); }
function setMode(m) {
  mode = m; stop();
  const ch = m === 'challenge';
  $('modeExplore').classList.toggle('on', !ch); $('modeChallenge').classList.toggle('on', ch);
  $('modeExplore').setAttribute('aria-pressed', !ch); $('modeChallenge').setAttribute('aria-pressed', ch);
  $('mission').hidden = $('btnHint').hidden = $('btnNext').hidden = !ch;
  if (ch) { clearSylCur(); if (curSym && targetPose(curSym)) setTarget(curSym); else nextTarget(); }
  else { target = null; ['hLip', 'hJaw', 'hTip', 'hBody', 'hVel'].forEach(k => el[k].classList.remove('ok')); drawGhost(); }
  dirty = true;
}
$('modeExplore').onclick = () => setMode('explore');
$('modeChallenge').onclick = () => setMode('challenge');
$('btnNext').onclick = nextTarget;
$('btnHint').onclick = e => { hintOn = !hintOn; e.currentTarget.textContent = '💡 提示：' + (hintOn ? '開' : '關'); e.currentTarget.setAttribute('aria-pressed', hintOn); drawGhost(); };

/* ───────── 11. 鏡子（只在本機顯示，不錄影、不上傳） ───────── */
let camStream = null;
async function openMirror() {
  if (camStream) return closeMirror();
  try {
    camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    $('cam').srcObject = camStream; $('mirror').hidden = false;
  } catch (e) { camStream = null; flashMission('打不開鏡頭，可以改用真的鏡子喔！'); }
}
function closeMirror() { if (camStream) camStream.getTracks().forEach(t => t.stop()); camStream = null; $('cam').srcObject = null; $('mirror').hidden = true; }
$('btnMirror').onclick = openMirror; $('mirrorClose').onclick = closeMirror;

/* ───────── 啟動 ───────── */
$('starCount').textContent = stars;
el.restTongue.setAttribute('d', geom(st('rest')).tongue);
buildKeys(); loadData(); render(); requestAnimationFrame(frame);
window.__mouth = { get state() { return state; }, set state(v) { state = v; dirty = true; }, get G() { return G; }, st, POSE, CONS, targetPose, buildSteps, parseSyl, geom, describe, get playing() { return !!playing; } };
})();
