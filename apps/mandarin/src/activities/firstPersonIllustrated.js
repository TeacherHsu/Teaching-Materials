import { FIRST_PERSON_ILLUSTRATIONS } from '../data/firstPersonLesson.js';

// Same controller contract as the retained Three.js scene; no renderer dependencies.
export async function mountFirstPersonScene(host, { phase, onProject, onMode, calm = false }) {
  const art = FIRST_PERSON_ILLUSTRATIONS[phase.act];
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const layer = document.createElement('div'); layer.className = 'fp-illustration'; layer.setAttribute('aria-hidden', 'true');
  const plane = document.createElement('div'); plane.className = 'fp-illustration-plane'; layer.append(plane); host.prepend(layer);
  host.classList.add('is-illustrated');
  let disposed = false, paused = false, frame = 0, previous = 0, elapsed = 0, pan = art.views[phase.view] ?? .5, target = pan, after = false;
  let width = 0, imageWidth = 0, imageHeight = 0, top = 0;
  const base = `${import.meta.env.BASE_URL}assets/first-person/115AG3H04/`;
  const images = art.images.map((file, i) => {
    const img = new Image(); img.alt = ''; img.draggable = false; img.className = 'fp-illustration-frame'; img.style.opacity = i ? '0' : '1';
    img.onload = () => { if (!disposed) { host.classList.remove('fp-image-failed'); onMode?.('第一人稱・插畫探索'); render(); } };
    img.onerror = () => { if (!disposed && i === 0) { host.classList.add('fp-image-failed'); onMode?.('圖片暫時無法載入，仍可用下方線索讀文與闖關。'); } };
    img.src = base + file; plane.append(img); return img;
  });
  const effects = document.createElement('div'); effects.style.zIndex = '2'; effects.className = 'fp-illustration-effects'; plane.append(effects);
  for (const [kind, point] of Object.entries(art.effects || {})) {
    for (let i = 0; i < (kind === 'fire' ? 1 : 5); i++) {
      const p = document.createElement('i'); p.className = `fp-art-${kind}`;
      p.style.left = `${point[0] + (i - 2) * 1.1}%`; p.style.top = `${point[1]}%`; p.style.animationDelay = `${-i * .51}s`; effects.append(p);
    }
  }
  // Only the next act is warmed. No global cache that keeps all four acts alive.
  const preloads = (FIRST_PERSON_ILLUSTRATIONS[phase.act + 1]?.images || []).map(file => { const img = new Image(); img.src = base + file; return img; });
  const reduced = () => calm || media.matches;
  function render() {
    if (disposed) return;
    width = host.clientWidth;
    // Full-bleed cover: the illustration fills the viewport; controls float above it.
    const height = host.clientHeight;
    imageHeight = Math.max(height, width * 1024 / 2400);
    top = (height - imageHeight) / 2;
    imageWidth = imageHeight * 2400 / 1024;
    const left = Math.max(0, (width - imageWidth) / 2) - Math.max(0, imageWidth - width) * pan;
    layer.style.top = `${top}px`; layer.style.height = `${imageHeight}px`;
    plane.style.width = `${imageWidth}px`; plane.style.transform = `translateX(${left}px)`;
    const points = {};
    for (const [key, [x, y]] of Object.entries(art.hotspots)) {
      const px = imageWidth * x / 100 + left;
      points[key] = { x: px / width * 100, y: (top + imageHeight * y / 100) / height * 100, visible: px >= 28 && px <= width - 28 };
    }
    onProject?.(points);
  }
  function showFrames() {
    if (phase.act === 2) {
      const t = elapsed / 1.2, index = Math.floor(t) % images.length, mix = t % 1;
      images.forEach((img, i) => { const next = i === (index + 1) % images.length; img.style.opacity = String(i === index ? 1 : next ? mix : 0); img.style.zIndex = next ? '1' : '0'; });
    } else if (phase.act === 4) {
      const mix = after ? Math.min(1, elapsed / 1.2) : 0;
      images[0].style.opacity = String(1 - mix); images[1].style.opacity = String(mix);
      effects.classList.toggle('fp-art-after', after);
    }
  }
  function tick(now) {
    frame = 0; if (disposed) return;
    const dt = previous ? Math.min(.05, (now - previous) / 1000) : 0; previous = now;
    if (!paused && !document.hidden) {
      if (!reduced()) elapsed += dt;
      pan += (target - pan) * (reduced() ? 1 : Math.min(1, dt * 9));
      if (Math.abs(target - pan) < .001) pan = target;
      if (!reduced()) showFrames(); render();
    }
    if (!paused && !document.hidden && (!reduced() || pan !== target)) frame = requestAnimationFrame(tick);
  }
  function resume() {
    cancelAnimationFrame(frame); previous = 0;
    effects.classList.toggle('fp-art-still', reduced() || paused || document.hidden);
    if (reduced()) { pan = target; if (phase.act === 2) images.forEach((img, i) => { img.style.opacity = i ? '0' : '1'; }); if (phase.act === 4) { elapsed = after ? 1.2 : 0; showFrames(); } }
    render(); if (!paused && !document.hidden) frame = requestAnimationFrame(tick);
  }
  const resize = new ResizeObserver(render); resize.observe(host);
  media.addEventListener('change', resume); document.addEventListener('visibilitychange', resume);
  resume();
  return {
    setView(view) { target = art.views[view] ?? .5; resume(); },
    look(dx) { target = Math.max(0, Math.min(1, target - dx * 2)); resume(); },
    observeAction() { if (phase.act === 4) { after = true; elapsed = 0; } resume(); },
    setOptions(options) { calm = Boolean(options.calm); paused = Boolean(options.paused); resume(); },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); resize.disconnect(); media.removeEventListener('change', resume); document.removeEventListener('visibilitychange', resume);
      [...images, ...preloads].forEach(img => { img.onload = img.onerror = null; img.removeAttribute('src'); }); layer.remove(); host.classList.remove('is-illustrated', 'fp-image-failed');
    },
  };
}
