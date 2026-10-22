import { lockBeatObjects } from './firstPersonPresentation.js';
import { mountChimeWind } from './firstPersonChime.js';
import { illustrationLayout } from './firstPersonLayout.js';
import { mountOperation } from './firstPersonInteraction.js';
import { FIRST_PERSON_ILLUSTRATIONS } from '../data/firstPersonLesson.js';

// Same controller contract as the retained Three.js scene; no renderer dependencies.
export async function mountFirstPersonScene(host, { phase, onProject, onMode, calm = false, operation, onOperation, onChime, onDemoSeen }) {
  const art = FIRST_PERSON_ILLUSTRATIONS[phase.act];
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const layer = document.createElement('div'); layer.className = 'fp-illustration';
  const plane = document.createElement('div'); plane.className = 'fp-illustration-plane'; layer.append(plane); host.prepend(layer);
  host.classList.add('is-illustrated');
  let reading = false;
  let disposed = false, paused = true, frame = 0, previous = 0, pan = art.views[phase.view] ?? .5, target = pan;
  let width = 0, imageWidth = 0, imageHeight = 0, top = 0;
  const base = `${import.meta.env.BASE_URL}assets/first-person/115AG3H04/`;
  const images = art.images.map((file, i) => {
    const img = new Image(); img.alt = ''; img.setAttribute('aria-hidden','true'); img.draggable = false; img.className = 'fp-illustration-frame'; img.style.opacity = i ? '0' : '1';
    img.onload = () => { if (!disposed) { host.classList.remove('fp-image-failed'); onMode?.('第一人稱・插畫探索'); render(); } };
    img.onerror = () => { if (!disposed && i === 0) { host.classList.add('fp-image-failed'); onMode?.('圖片暫時無法載入，仍可用下方線索讀文與闖關。'); } };
    img.src = base + file; plane.append(img); return img;
  });
  const effects = document.createElement('div'); effects.style.zIndex = '2'; effects.className = 'fp-illustration-effects'; plane.append(effects);
  for (const [kind, point] of Object.entries(art.effects || {})) {
    for (let i = 0; i < (kind === 'fire' ? 1 : 5); i++) {
      const p = document.createElement('i'); p.className = `fp-art-${kind}`;
      p.style.left = `${point[0] + (kind === 'fire' ? 0 : i - 2) * 1.1}%`; p.style.top = `${point[1]}%`; p.style.animationDelay = `${-i * .51}s`; effects.append(p);
    }
  }
  const wind = phase.act === 1 ? mountChimeWind(plane, base, () => calm) : null;
  const interaction = mountOperation(plane, { scene: phase, state: operation, changed: onOperation, saveDemo: onDemoSeen, reduced: () => calm, chime() { wind?.blow(); onChime?.(); }, focus(x) { if(phase.act===4 && (x===49||x===69) && host.clientWidth/host.clientHeight>=1.4)x=46; else if(phase.act===4 && x===49)x=30; const iw=illustrationLayout(host.clientWidth,host.clientHeight).imageWidth; if(iw>host.clientWidth) { target=Math.max(0,Math.min(1,(iw*x/100-host.clientWidth/2)/(iw-host.clientWidth))); pan=target; render(); } }, heat(value) { effects.style.opacity = '1'; effects.style.setProperty('--heat', value); [...effects.children].forEach((el,i) => { const fire=el.classList.contains('fp-art-fire'); el.style.visibility = !fire && (value === 0 || (el.classList.contains('fp-art-bubble') && i % 5 >= Math.ceil(value * 5))) ? 'hidden' : ''; el.style.opacity=String(fire?Math.max(1/3,value):value); if(fire) el.style.scale=String(Math.max(1/3,value)); }); if(phase.act === 4) { images[0].style.opacity=String(value); images[1].style.opacity=String(1-value); images[0].style.transition=images[1].style.transition=(calm)?'none':'opacity .8s ease'; } }, demonstrate(active) { images[0].style.opacity=active?'0':'1'; images[1].style.opacity=active?'1':'0'; } });
  // Only the next act is warmed. No global cache that keeps all four acts alive.
  const preloads = (FIRST_PERSON_ILLUSTRATIONS[phase.act + 1]?.images || []).map(file => { const img = new Image(); img.src = base + file; return img; });
  const reduced = () => calm;
  function render() {
    if (disposed) return;
    width = host.clientWidth;
    const geometry=illustrationLayout(width,host.clientHeight * (reading ? 1.3 : 1),pan);
    ({imageHeight,imageWidth,top}=geometry);
    if(reading)top-=host.clientHeight*.3;
    const left=geometry.left;
    layer.style.top = `${top}px`; layer.style.height = `${imageHeight}px`;
    plane.style.width = `${imageWidth}px`; plane.style.transform = `translateX(${left}px)`;
    const points = {};
    for (const [key, [x, y]] of Object.entries(art.hotspots)) {
      const px = imageWidth * x / 100 + left;
      points[key] = { x: px / width * 100, y: (top + imageHeight * y / 100) / host.clientHeight * 100, visible: px >= 28 && px <= width - 28 };
    }
    onProject?.(points);
  }
  function tick(now) {
    frame = 0; if (disposed) return;
    const dt = previous ? Math.min(.05, (now - previous) / 1000) : 0; previous = now;
    if (!paused && !document.hidden) {
      if (!interaction.dragging) pan += (target - pan) * (reduced() ? 1 : Math.min(1, dt * 9));
      if (Math.abs(target - pan) < .001) pan = target;
      render();
    }
    if (!paused && !document.hidden && (!reduced() || pan !== target)) frame = requestAnimationFrame(tick);
  }
  function resume() {
    cancelAnimationFrame(frame); previous = 0;
    if (document.hidden) wind?.stop();
    else wind?.updateMotion();
    interaction.setPaused(paused || document.hidden);
    effects.classList.toggle('fp-art-still', reduced() || paused || document.hidden);
    if (reduced()) { pan = target; if (phase.act === 2) images.forEach((img, i) => { img.style.opacity = i ? '0' : '1'; });  }
    render(); if (!paused && !document.hidden) frame = requestAnimationFrame(tick);
  }
  plane.addEventListener('focusin', event => { const x=parseFloat(event.target.closest('.fp-object')?.style.left); if(event.target.matches(':focus-visible') && !interaction.dragging && Number.isFinite(x) && imageWidth>width) { target=Math.max(0,Math.min(1,(imageWidth*x/100-width/2)/(imageWidth-width))); resume(); } });
  const resize = new ResizeObserver(render); resize.observe(host);
  media.addEventListener('change', resume); document.addEventListener('visibilitychange', resume);
  resume();
  return {
    startDemo() { interaction.startDemo?.(); },
    showWoodDemo() { return interaction.showWoodDemo(true); },
    setView(view) { target = art.views[view] ?? .5; resume(); },
    look(dx) { if(interaction.dragging) return; target = Math.max(0, Math.min(1, target - dx * 2)); resume(); },
    observeAction() { resume(); },
    setOptions(options) { reading=Boolean(options.reading); calm = Boolean(options.calm); paused = Boolean(options.paused); lockBeatObjects(plane,Boolean(options.locked));
      plane.inert=paused || Boolean(options.locked);
      resume(); },
    dispose() {
      disposed = true; wind?.dispose(); interaction.dispose(); cancelAnimationFrame(frame); resize.disconnect(); media.removeEventListener('change', resume); document.removeEventListener('visibilitychange', resume);
      [...images, ...preloads].forEach(img => { img.onload = img.onerror = null; img.removeAttribute('src'); }); layer.remove(); host.classList.remove('is-illustrated', 'fp-image-failed');
    },
  };
}
