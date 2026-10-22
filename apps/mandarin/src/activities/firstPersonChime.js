// Gesture-only synthesis. A disabled effect never asks for an AudioContext.
export function playChime(enabled, getAudio, random = Math.random) {
  if (!enabled) return;
  try {
    const audio = getAudio();
    if (!audio) return;
    // Called synchronously in the click handler, including the first gesture.
    audio.resume().catch(() => {});
    const sources = [];
    const now = audio.currentTime;
    for (const [strike, level] of [[.16, 1], [.62, .62], [1.09, .34]]) {
      const fundamental = 1250 + (random() - .5) * 90;
      for (const [ratio, weight] of [[1, 1], [2.76, .36], [5.40, .16], [8.93, .07]]) {
        const oscillator = audio.createOscillator(), gain = audio.createGain();
        sources.push(oscillator);
        oscillator.frequency.value = fundamental * ratio;
        const start = now + strike;
        gain.gain.setValueAtTime(.00001, start);
        gain.gain.exponentialRampToValueAtTime(.045 * weight * level, start + .006);
        gain.gain.exponentialRampToValueAtTime(.00001, start + 2);
        oscillator.connect(gain); gain.connect(audio.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(start); oscillator.stop(start + 2.02);
      }
    }
    const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * 1.5), audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = random() * 2 - 1;
    const source = audio.createBufferSource(), filter = audio.createBiquadFilter(), gain = audio.createGain();
    sources.push(source);
    source.buffer = buffer; filter.type = 'bandpass'; filter.frequency.value = 750; filter.Q.value = 1;
    gain.gain.setValueAtTime(.00001, now);
    gain.gain.linearRampToValueAtTime(.012, now + .3);
    gain.gain.exponentialRampToValueAtTime(.00001, now + 1.5);
    source.connect(filter); filter.connect(gain); gain.connect(audio.destination);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
    source.start(now); source.stop(now + 1.5);
    return () => { for (const node of sources) { try { node.stop(); node.disconnect(); } catch {} } };
  } catch { /* Audio support must not block the operation. */ }
}

export const chimeMotion = reduced => reduced ? 'fp-chime-glow' : 'fp-wind-active';
export function mountChimeWind(plane, base, reduced) {
  const layer = document.createElement('div'); layer.className = 'fp-chime-weather';
  layer.setAttribute('aria-hidden', 'true');
  const bell = document.createElement('div'); bell.className = 'fp-ceramic-chime';
  for (const part of ['shell', 'clapper']) {
    const img = new Image(); img.src = base + 'sprites/chime.webp'; img.alt = ''; img.draggable = false;
    img.className = `fp-chime-${part}`; bell.append(img);
  }
  layer.append(bell);
  for (let i = 0; i < 3; i++) {
    const streak = document.createElement('i'); streak.className = 'fp-wind-streak'; streak.style.setProperty('--i', i); layer.append(streak);
  }
  // Feathered, source-aligned foliage only: no people or architecture in these patches.
  for (const [x,y,w,h] of [[0,0,20,17],[0,69,17,31],[0,38,8,25]]) {
    const leaf = document.createElement('div'); leaf.className = 'fp-wind-foliage';
    Object.assign(leaf.style, {left:`${x}%`, top:`${y}%`, width:`${w}%`, height:`${h}%`, backgroundImage:`url("${base}act1-entrance.webp")`, backgroundSize:`${10000/w}% ${10000/h}%`, backgroundPosition:`${x/(100-w)*100}% ${y/(100-h)*100}%`});
    layer.append(leaf);
  }
  plane.append(layer);
  let timer;
  function stop() { clearTimeout(timer); layer.classList.remove('fp-wind-active','fp-chime-glow'); }
  return {
    blow() {
      stop(); void layer.offsetWidth;
      layer.classList.add(chimeMotion(reduced()));
      timer = setTimeout(stop, reduced() ? 650 : 2500);
    },
    stop,
    updateMotion() { if (reduced() && layer.classList.contains('fp-wind-active')) { layer.classList.remove('fp-wind-active'); layer.classList.add('fp-chime-glow'); } },
    dispose() { stop(); layer.remove(); },
  };
}
