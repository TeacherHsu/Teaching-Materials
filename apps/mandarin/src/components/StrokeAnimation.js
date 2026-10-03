import { h } from '../utils/dom.js';

const NS = 'http://www.w3.org/2000/svg';
let uid = 0;

function el(tag, attrs = {}) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function pathLength(points) {
  let len = 0;
  for (let i = 1; i < points.length; i += 1) {
    len += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return len;
}

/**
 * 站內筆順動畫（Make Me a Hanzi 的筆畫輪廓＋中線）。
 * 每一筆用輪廓當遮罩，沿中線「畫出來」。筆畫數和課本不同的字，build 時就不給資料。
 * - 「播放」一次畫完；「下一筆」一筆一筆看（學生自己控制速度）；「重來」清空。
 * - prefers-reduced-motion：不做描繪動畫，每按一次直接出現一筆。
 * @param {{char:string, strokes:string[], medians:number[][][]}} props
 */
export function StrokeAnimation({ char, strokes, medians }) {
  const id = `sa${uid += 1}`;
  const reduce = typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const svg = el('svg', { viewBox: '0 0 1024 1024', class: 'stroke-anim__svg', role: 'img', 'aria-label': `「${char}」的筆順，共 ${strokes.length} 畫` });
  const g = el('g', { transform: 'scale(1,-1) translate(0,-900)' });
  svg.appendChild(g);
  const defs = el('defs');
  g.appendChild(defs);
  strokes.forEach((d) => g.appendChild(el('path', { d, class: 'stroke-anim__ghost' })));
  const inks = strokes.map((d, i) => {
    const clip = el('clipPath', { id: `${id}-c${i}` });
    clip.appendChild(el('path', { d }));
    defs.appendChild(clip);
    const pts = medians[i];
    const len = Math.ceil(pathLength(pts)) + 1;
    const ink = el('path', {
      d: `M ${pts.map((p) => p.join(' ')).join(' L ')}`,
      class: 'stroke-anim__ink',
      'clip-path': `url(#${id}-c${i})`,
      'stroke-dasharray': `${len} ${len}`,
      'stroke-dashoffset': String(len),
    });
    ink.dataset.len = String(len);
    g.appendChild(ink);
    return ink;
  });

  let shown = 0;
  let timer = null;
  const counter = h('p', { class: 'meta stroke-anim__count', 'aria-live': 'polite' }, `0／${strokes.length} 畫`);

  function drawStroke(i, done) {
    const ink = inks[i];
    const len = Number(ink.dataset.len);
    if (reduce) { ink.setAttribute('stroke-dashoffset', '0'); done?.(); return; }
    const ms = Math.max(350, Math.min(900, len * 1.1));
    const start = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - start) / ms);
      ink.setAttribute('stroke-dashoffset', String(len * (1 - k)));
      if (k < 1) timer = requestAnimationFrame(step); else done?.();
    };
    timer = requestAnimationFrame(step);
  }
  function update() { counter.textContent = `${shown}／${strokes.length} 畫`; }
  function reset() {
    if (timer) cancelAnimationFrame(timer);
    inks.forEach((ink) => ink.setAttribute('stroke-dashoffset', ink.dataset.len));
    shown = 0;
    update();
  }
  function next() {
    if (shown >= strokes.length) return;
    const i = shown;
    shown += 1;
    update();
    drawStroke(i);
  }
  function play() {
    reset();
    const run = () => {
      if (shown >= strokes.length) return;
      const i = shown;
      shown += 1;
      update();
      drawStroke(i, () => { timer = setTimeout(run, reduce ? 300 : 120); });
    };
    run();
  }

  const btn = (label, fn) => {
    const b = h('button', { class: 'btn btn--secondary', type: 'button' }, label);
    b.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
    return b;
  };
  return h('div', { class: 'stroke-anim' }, [
    svg,
    counter,
    h('div', { class: 'stroke-anim__controls' }, [btn('播放', play), btn('下一筆', next), btn('重來', reset)]),
    h('p', { class: 'meta stroke-anim__credit' }, '字形與筆順：Make Me a Hanzi（Arphic PL）'),
  ]);
}
