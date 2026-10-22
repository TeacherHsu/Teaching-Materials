// Only event-backed states; intermediate positions describe intensity, not new emotions.
export function moodFor(act, step, remembered = false) {
  const level = act === 1 ? 0 : act === 2 ? Math.min(3, 1 + step) : act === 3 ? 3 : [3, 3, 2, 1, 0][Math.min(4, step)];
  return { level, label: act === 4 && remembered ? '用心記住' : level === 0 ? '平靜' : level === 1 ? '有點慌張' : level === 2 ? '慌張' : '十分慌張', face: level === 0 ? '🙂' : '😟' };
}
export const subtitlePlan = scene => scene.clues.flatMap(c => c.refs || []);

export const beatLines = refs => refs.flatMap(ref => ref.sentences.map(n => ({para:ref.para,n})));
export const subtitleDuration = text => Math.max(2500, [...text].length * 180);
export const nextBeat = beat => ({intro:'act', act:'result', result:'read', read:'question'})[beat];
export function createPlayback() {
  let automatic = true;
  return { get automatic(){return automatic;}, toggle(){automatic=!automatic;return automatic;}, delay(text){return automatic ? subtitleDuration(text) : null;} };
}

// A card can be selected once, then tapped again to cancel its numbered place.
export function toggleOrder(selected, index) {
  return selected.includes(index) ? selected.filter(i => i !== index) : [...selected, index];
}
export function reorderCards(order, from, to) {
  if(from===to)return [...order];
  const next = [...order]; next.splice(next.indexOf(from), 1); next.splice(next.indexOf(to), 0, from); return next;
}

export function createCardOrder(initial) {
  let order=[...initial],selected=[];
  return {
    get order(){return [...order];}, get selected(){return [...selected];},
    toggle(index){selected=toggleOrder(selected,index);},
    move(from,to){order=reorderCards(order,from,to);selected=[...order];},
    reset(){order=[...initial];selected=[];},
  };
}

export function lockBeatObjects(plane, locked) {
  plane.inert=locked;
  plane.classList.toggle('fp-locked',locked);
  for(const el of plane.querySelectorAll('button')) {
    if(locked) { if(!el.hasAttribute('data-beat-disabled'))el.dataset.beatDisabled=String(el.disabled); el.disabled=true; }
    else if(el.hasAttribute('data-beat-disabled')) { el.disabled=el.dataset.beatDisabled==='true';delete el.dataset.beatDisabled; }
  }
}
