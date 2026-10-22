export const operationTypes = ['observe','dragToTarget','scoopGesture','toolGrab','chooseCard','orderCards','tracePath'];
const fail = message => { throw new Error(`Situation lesson: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const percent = n => Number.isFinite(n) && n >= 0 && n <= 100;
const text = value => typeof value === 'string' && value.trim().length > 0;
const refsOf = lesson => lesson.scenes.flatMap(s => s.clues.flatMap(c=>c.refs || []));
export function validateSituationLesson(lesson) {
  check(lesson.schemaVersion === 1, 'schemaVersion');
  check(text(lesson.lessonId) && Number.isInteger(lesson.version), 'identity/version');
  check(/^assets\/[\w/-]+\/$/.test(lesson.assetBase) && !lesson.assetBase.includes('..'), 'local assetBase');
  check(lesson.paragraphCounts?.length > 0 && lesson.paragraphCounts.every(n=>Number.isInteger(n) && n>0), 'paragraphCounts');
  const expected = lesson.paragraphCounts.flatMap((count,i)=>Array.from({length:count},(_,n)=>`${i+1}:${n}`));
  check(lesson.sentenceCount === expected.length, 'sentenceCount');
  check(lesson.meter?.states?.length > 0 && lesson.meter.states.every(text), 'meter terms');
  for(const key of ['enter','return','speaker','character','context','safety'])check(text(lesson.ui?.[key]), `ui ${key}`);
  check(text(lesson.gateTitle) && text(lesson.introduction) && lesson.source && Array.isArray(lesson.review),'lesson presentation');
  check(lesson.scenes?.length > 0 && new Set(lesson.scenes.map(s=>s.id)).size === lesson.scenes.length, 'scene ids');
  const hashes = new Map();
  function refs(list, requireHash = true) {
    check(Array.isArray(list), 'refs array');
    for (const ref of list) {
      check(Number.isInteger(ref.para) && ref.para>0 && ref.para<=lesson.paragraphCounts.length, 'paragraph');
      check(Array.isArray(ref.sentences) && ref.sentences.length>0, 'sentences');
      if(requireHash)check(Array.isArray(ref.sha) && ref.sha.length===ref.sentences.length, 'hash count');
      ref.sentences.forEach((n,i)=>{
        check(Number.isInteger(n) && n>=0 && n<lesson.paragraphCounts[ref.para-1], 'sentence index');
        if(requireHash){const key=`${ref.para}:${n}`, hash=ref.sha[i];check(/^[a-f0-9]{8}$/.test(hash), 'hash format');check(!hashes.has(key) || hashes.get(key)===hash, 'hash mismatch');hashes.set(key,hash);}
      });
    }
  }
  refs(refsOf(lesson));
  const coverage=[];
  for(const s of lesson.scenes) {
    check(s.assetBase===lesson.assetBase, 'scene assetBase');
    check(operationTypes.includes(s.operation?.type), 'operation type');
    check(s.operation.steps?.length>0 && s.operation.steps.every(text), 'operation steps');
    check(s.operation.profile===undefined || s.operation.profile===`cooking-${s.operation.type}` && lesson.lessonId==='115AG3H04', 'reserved effect profile');
    check(s.art?.images?.length>0 && s.art.images.every(f=>/^[\w/-]+\.webp$/.test(f) && !f.includes('..')), 'images');
    check(s.art.aspect?.length===2 && s.art.aspect.every(n=>Number.isFinite(n) && n>0), 'image aspect');
    for(const point of Object.values({...s.art.hotspots,...s.art.effects}))check(point.length===2 && point.every(percent), 'art coordinates');
    for(const value of Object.values(s.art.orientationFocus || {}))check(percent(value),'orientation focus');
    for(const value of Object.values(s.art.views))check(Number.isFinite(value) && value>=0 && value<=1,'view focus');
    for(const points of Object.values(s.art.focus || {}))for(const [x,y] of Object.entries(points))check(percent(Number(x)) && percent(y), 'orientation focus');
    check(s.operation.objects?.length>0, 'objects');
    for(const o of s.operation.objects){check(text(o.label) && text(o.action),'object identity');check([o.x,o.y,o.width].every(percent) && o.width>0 && Number.isFinite(o.ratio) && o.ratio>0 && Number.isFinite(o.angle),'object geometry');check(!o.sprite || /^[\w-]+$/.test(o.sprite),'sprite');if(o.gesture)check(['tap','observe','dragToTarget','tracePath'].includes(o.gesture),'object gesture');if(o.gesture==='tracePath' || s.operation.type==='tracePath' && !o.passive && !o.target)check(o.path?.length>=2 && o.path.every(p=>p.length===2 && p.every(percent)) && Number.isFinite(o.tolerance) && o.tolerance>0,'trace path');if(o.destination)check(o.destination.length===2 && o.destination.every(percent),'destination');}
    for(const region of Object.values(s.operation.regions || {}))check(['left','right','top','bottom'].every(k=>percent(region[k])) && region.left<region.right && region.top<region.bottom,'region');
    check(s.meter?.length===s.operation.steps.length+1, 'meter event count');
    for(const event of s.meter)check(Number.isInteger(event.state) && text(lesson.meter.states[event.state]) && percent(event.level) && event.level<=3,'meter event');
    for(const name of ['intro','read']){
      refs(s.beats[name]);for(const r of s.beats[name])for(const n of r.sentences)coverage.push(`${r.para}:${n}`);
    }
    check(Number.isFinite(s.beats.result.duration) && s.beats.result.duration>=0 && s.art.views[s.beats.result.view]!==undefined,'result');
    if(['dragToTarget','toolGrab'].includes(s.operation.type) && !s.operation.profile)check(s.operation.regions?.target,'target region');
    if(s.art.stepImages)check(s.art.stepImages.length===s.operation.steps.length+1 && s.art.stepImages.every(n=>Number.isInteger(n) && n>=0 && n<s.art.images.length),'step images');
    if(s.art.resultImage!==undefined)check(Number.isInteger(s.art.resultImage) && s.art.resultImage>=0 && s.art.resultImage<s.art.images.length,'result image');
    if(s.operation.type==='scoopGesture' && !s.operation.profile)check(s.operation.regions?.water,'water region');
    if(s.operation.type==='toolGrab' && !s.operation.profile)check(s.operation.objects.some(o=>o.tool),'tool object');
    if(s.operation.type==='orderCards')check(Array.isArray(s.operation.answer) && s.operation.answer.length===s.operation.objects.length && new Set(s.operation.answer).size===s.operation.objects.length && s.operation.answer.every(i=>Number.isInteger(i) && i>=0 && i<s.operation.objects.length),'operation order answer');
    check(s.questions?.length>0,'questions');
    for(const q of s.questions){
      check(['chooseCard','orderCards'].includes(q.operationType), 'card type');refs(q.refs);
      check(text(q.stem) && q.options?.length>=2 && q.options.every(text),'question');
      const answer=Array.isArray(q.answer)?q.answer:[q.answer];check(answer.every(i=>Number.isInteger(i) && i>=0 && i<q.options.length),'answer');
      if(q.operationType==='orderCards')check(answer.length===q.options.length && new Set(answer).size===answer.length,'order answer');
      if(q.initialOrder)check(q.initialOrder.length===q.options.length && new Set(q.initialOrder).size===q.options.length && q.initialOrder.every(i=>Number.isInteger(i) && i>=0 && i<q.options.length),'initial order');
    }
  }
  check(JSON.stringify(coverage)===JSON.stringify(expected),'full ordered coverage');
  check(expected.every(key=>hashes.has(key)), 'full hashes');
  refs(lesson.ending.refs || []);
  if(lesson.meter.read){const r=lesson.meter.read;check(expected.includes(`${r.para}:${r.n}`) && text(lesson.meter.states[r.state]),'meter read trigger');}
  check(text(lesson.ending.title),'ending');
  return true;
}

export function meterFor(lesson, scene, step, remembered=false) {
  const entry=remembered && lesson.meter.read ? lesson.meter.read : scene.meter[Math.min(step,scene.meter.length-1)];
  return {level:entry.level,label:lesson.meter.states[entry.state],face:lesson.meter.faces?.[entry.state] || '🙂'};
}
// Called only after the existing classroom gate. No text is persisted or logged.
export async function validateUnlockedLesson(lesson, paragraphs) {
  validateSituationLesson(lesson);
  check(paragraphs.size===lesson.paragraphCounts.length && lesson.paragraphCounts.every((n,i)=>paragraphs.get(i+1)?.length===n),'unlocked sentence counts');
  const hashes=new Map(refsOf(lesson).flatMap(r=>r.sentences.map((n,i)=>[`${r.para}:${n}`,r.sha[i]])));
  for(const [para, lines] of paragraphs)for(let n=0;n<lines.length;n++){
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(lines[n]));
    const hash=[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('').slice(0,8);
    check(hashes.get(`${para}:${n}`)===hash,'unlocked hash');
  }
  // Only source words may label a meter; approved legacy intensity suffixes remain unchanged.
  const full=[...paragraphs.values()].flat().join('');
  if(lesson.lessonId!=='115AG3H04')for(const state of lesson.meter.states)check(full.includes(state),'meter source word');
  return true;
}
