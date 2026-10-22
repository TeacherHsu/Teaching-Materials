export const operationTypes = ['observe','dragToTarget','scoopGesture','toolGrab','chooseCard','orderCards','tracePath','rhythmTap','aimShot','holdBreath'];
export const strategyTypes = ['predict','emotionClue','causeEffect','summaryCard'];
const fail = message => { throw new Error(`Situation lesson: ${message}`); };
const check = (condition, message) => { if (!condition) fail(message); };
const percent = n => Number.isFinite(n) && n >= 0 && n <= 100;
const text = value => typeof value === 'string' && value.trim().length > 0;
const refsOf = lesson => lesson.scenes.flatMap(s => s.clues.flatMap(c=>c.refs || []));
export const isStoryUnit = (lesson, para, n) => !(lesson.excludedUnits || []).some(r=>r.para===para && r.sentences.includes(n));
export const storyUnitKeys = lesson => lesson.paragraphCounts.flatMap((count,i)=>Array.from({length:count},(_,n)=>n).filter(n=>isStoryUnit(lesson,i+1,n)).map(n=>`${i+1}:${n}`));
export function validateSituationLesson(lesson) {
  check(lesson.schemaVersion === 1, 'schemaVersion');
  check(text(lesson.lessonId) && Number.isInteger(lesson.version), 'identity/version');
  check(/^assets\/[\w/-]+\/$/.test(lesson.assetBase) && !lesson.assetBase.includes('..'), 'local assetBase');
  check(lesson.paragraphCounts?.length > 0 && lesson.paragraphCounts.every(n=>Number.isInteger(n) && n>0), 'paragraphCounts');
  const expected = lesson.paragraphCounts.flatMap((count,i)=>Array.from({length:count},(_,n)=>`${i+1}:${n}`));
  check(lesson.sentenceCount === expected.length, 'sentenceCount');
  const excluded = lesson.excludedUnits || [];
  check(Array.isArray(excluded), 'excluded units');
  const omitted = [];
  for(const r of excluded){
    check(Number.isInteger(r.para) && r.para>0 && r.para<=lesson.paragraphCounts.length && Array.isArray(r.sentences) && r.sentences.length>0,'excluded paragraph');
    for(const n of r.sentences){check(Number.isInteger(n) && n>=0 && n<lesson.paragraphCounts[r.para-1],'excluded index');omitted.push(`${r.para}:${n}`);}
  }
  check(new Set(omitted).size===omitted.length && omitted.length<expected.length,'excluded duplicates/all');
  const storyExpected=storyUnitKeys(lesson);
  if(lesson.storySentenceCount!==undefined)check(lesson.storySentenceCount===storyExpected.length,'storySentenceCount');
  if(lesson.speakers){
    check(Object.keys(lesson.speakers).length===storyExpected.length && storyExpected.every(k=>Object.hasOwn(lesson.speakers,k)),'speaker coverage');
    check(Object.values(lesson.speakers).every(v=>v==='' || text(v) && v!=='故事中的人物'),'speaker names');
  }
  check(lesson.meter?.states?.length > 0 && lesson.meter.states.every(text), 'meter terms');
  for(const key of ['title','subject'])if(lesson.meter[key]!==undefined)check(text(lesson.meter[key]),`meter ${key}`);
  if(lesson.meter.labels)check(lesson.meter.stateEvidence && lesson.meter.labels.length===lesson.meter.states.length && lesson.meter.labels.every(text),'meter display labels');
  for(const key of ['enter','return','character','context','safety'])check(text(lesson.ui?.[key]), `ui ${key}`);
  check(lesson.speakers || text(lesson.ui.speaker),'speaker configuration');
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
        check(isStoryUnit(lesson,ref.para,n),'excluded reference');
        if(requireHash){const key=`${ref.para}:${n}`, hash=ref.sha[i];check(/^[a-f0-9]{8}$/.test(hash), 'hash format');check(!hashes.has(key) || hashes.get(key)===hash, 'hash mismatch');hashes.set(key,hash);}
      });
    }
  }
  refs(refsOf(lesson));
  if(lesson.meter.stateEvidence){
    check(lesson.meter.stateEvidence.length===lesson.meter.states.length,'meter evidence count');
    for(const e of lesson.meter.stateEvidence){refs(e.refs);check(e.refs.length>0 && e.parts?.length>0 && e.parts.every(text),'meter evidence');}
  }
  const coverage=[];
  for(const s of lesson.scenes) {
    check(s.assetBase===lesson.assetBase, 'scene assetBase');
    check(operationTypes.includes(s.operation?.type), 'operation type');
    check(s.operation.steps?.length>0 && s.operation.steps.every(text), 'operation steps');
    check(s.operation.profile===undefined || s.operation.profile===`cooking-${s.operation.type}` && lesson.lessonId==='115AG3H04', 'reserved effect profile');
    check(s.art?.images?.length>0 && s.art.images.every(f=>/^[\w/-]+\.webp$/.test(f) && !f.includes('..')), 'images');
    for(const [base,file] of Object.entries(s.art.expressionOverlays || {}))check(s.art.images.includes(base) && /^[\w-]+\.webp$/.test(file),'expression overlay');
    for(const [state,files] of Object.entries(s.art.expressionStates || {})){check(lesson.meter.states.includes(state),'expression state');for(const [base,file] of Object.entries(files))check(s.art.images.includes(base) && /^[\w-]+\.webp$/.test(file),'state overlay');}
    check(s.art.aspect?.length===2 && s.art.aspect.every(n=>Number.isFinite(n) && n>0), 'image aspect');
    for(const point of Object.values({...s.art.hotspots,...s.art.effects}))check(point.length===2 && point.every(percent), 'art coordinates');
    for(const value of Object.values(s.art.orientationFocus || {}))check(percent(value),'orientation focus');
    for(const [view,scale] of Object.entries(s.art.viewScales || {}))check(s.art.views[view]!==undefined && Number.isFinite(scale) && scale>=1 && scale<=1.5,'view cover scale');
    for(const value of Object.values(s.art.views))check(Number.isFinite(value) && value>=0 && value<=1,'view focus');
    for(const points of Object.values(s.art.focus || {}))for(const [x,y] of Object.entries(points))check(percent(Number(x)) && percent(y), 'orientation focus');
    check(s.operation.objects?.length>0, 'objects');
    for(const o of s.operation.objects){check(text(o.label) && text(o.action),'object identity');check([o.x,o.y,o.width].every(percent) && o.width>0 && Number.isFinite(o.ratio) && o.ratio>0 && Number.isFinite(o.angle),'object geometry');check(!o.sprite || /^[\w-]+$/.test(o.sprite),'sprite');if(o.completedSprite!==undefined)check(/^[\w-]+$/.test(o.completedSprite) && o.sprite,'completed sprite');if(o.minHitSize!==undefined)check(Number.isFinite(o.minHitSize) && o.minHitSize>=44,'hit size');if(o.viewMotion)check(['lookUp','approach'].includes(o.viewMotion),'observation view motion');if(o.gesture)check(['tap','observe','dragToTarget','tracePath','rhythmTap','aimShot','holdBreath'].includes(o.gesture),'object gesture');if(o.gesture==='tracePath' || s.operation.type==='tracePath' && !o.passive && !o.target)check(o.path?.length>=2 && o.path.every(p=>p.length===2 && p.every(percent)) && Number.isFinite(o.tolerance) && o.tolerance>0,'trace path');if(o.destinationWidth!==undefined)check(percent(o.destinationWidth) && o.destinationWidth>0 && o.destination,'destination width');if(o.destination)check(o.destination.length===2 && o.destination.every(percent),'destination');}
    for(const region of Object.values(s.operation.regions || {}))check(['left','right','top','bottom'].every(k=>percent(region[k])) && region.left<region.right && region.top<region.bottom,'region');
    check(s.meter?.length===s.operation.steps.length+1, 'meter event count');
    for(const event of s.meter)check(Number.isInteger(event.state) && text(lesson.meter.states[event.state]) && percent(event.level) && event.level<=3,'meter event');
    for(const name of ['intro','read']){
      refs(s.beats[name]);if(!s.timeline)for(const r of s.beats[name])for(const n of r.sentences)coverage.push(`${r.para}:${n}`);
    }
    check(Number.isFinite(s.beats.result.duration) && s.beats.result.duration>=0 && s.art.views[s.beats.result.view]!==undefined,'result');
    if(['dragToTarget','toolGrab'].includes(s.operation.type) && !s.operation.profile)check(s.operation.regions?.target,'target region');
    if(s.operation.hoop)check(s.operation.hoop.length===2 && s.operation.hoop.every(percent),'shot hoop');
    if(s.operation.guaranteed!==undefined)check(typeof s.operation.guaranteed==='boolean','guaranteed shot');
    if(['rhythmTap','aimShot','holdBreath'].includes(s.operation.type))check(!s.operation.collect && s.operation.objects.every(o=>!o.passive && !o.target),'sports ordered steps');
    if(s.operation.groups){let end=0;for(const g of s.operation.groups){check(g.from===end && Number.isInteger(g.to) && g.to>g.from && g.to<=s.operation.steps.length,'operation group');end=g.to;}check(end===s.operation.steps.length,'group coverage');}
    if(s.operation.guide===false)check(s.operation.type==='dragToTarget','unguided drag');
    if(s.art.portraitFrame){const f=s.art.portraitFrame;check(percent(f.left) && percent(f.right) && f.right>f.left && [f.top,f.bottom].every(n=>Number.isFinite(n) && n>=0),'portrait evidence frame');}
    if(s.art.stepImages)check(s.art.stepImages.length===s.operation.steps.length+1 && s.art.stepImages.every(n=>Number.isInteger(n) && n>=0 && n<s.art.images.length),'step images');
    if(s.art.resultImage!==undefined)check(Number.isInteger(s.art.resultImage) && s.art.resultImage>=0 && s.art.resultImage<s.art.images.length,'result image');
    if(s.operation.type==='scoopGesture' && !s.operation.profile)check(s.operation.regions?.water,'water region');
    if(s.operation.type==='toolGrab' && !s.operation.profile)check(s.operation.objects.some(o=>o.tool),'tool object');
    if(s.operation.type==='orderCards')check(Array.isArray(s.operation.answer) && s.operation.answer.length===s.operation.objects.length && new Set(s.operation.answer).size===s.operation.objects.length && s.operation.answer.every(i=>Number.isInteger(i) && i>=0 && i<s.operation.objects.length),'operation order answer');
    for(const [key,view] of Object.entries(s.readViews || {}))check(s.beats.read.some(r=>r.sentences.some(n=>`${r.para}:${n}`===key)) && s.art.views[view]!==undefined,'reading view');
    if(s.timeline){
      check(s.timeline.length>0,'timeline');
      for(const entry of s.timeline){
        if(entry.imageIndex!==undefined)check(Number.isInteger(entry.imageIndex) && entry.imageIndex>=0 && entry.imageIndex<s.art.images.length,'timeline image');
        check(['intro','read','act','result','strategy','openBag','question'].includes(entry.kind),'timeline kind');
        if(['intro','read'].includes(entry.kind)){refs(entry.refs);for(const r of entry.refs)for(const n of r.sentences)coverage.push(`${r.para}:${n}`);if(entry.kind==='intro')check(entry.refs.reduce((n,r)=>n+r.sentences.length,0)<=8 || text(entry.lengthException),'opening length');}
        if(entry.kind==='act' && entry.untilStep!==undefined)check(Number.isInteger(entry.untilStep) && entry.untilStep>0 && entry.untilStep<s.operation.steps.length,'timeline operation checkpoint');
        if(entry.kind==='openBag'){refs(entry.refs);check(text(entry.prompt) && text(entry.label) && text(entry.openedMessage),'bag presentation');check(entry.object && [entry.object.x,entry.object.y,entry.object.width].every(percent) && /^[\w-]+$/.test(entry.object.sprite),'bag checkpoint');}
        if(entry.kind==='strategy')check(s.strategies?.some(t=>t.id===entry.id),'timeline strategy');
      }
      check(JSON.stringify(s.timeline.filter(e=>['intro','read'].includes(e.kind)).flatMap(e=>e.refs.flatMap(r=>r.sentences.map(n=>`${r.para}:${n}`))))===JSON.stringify([...s.beats.intro,...s.beats.read].flatMap(r=>r.sentences.map(n=>`${r.para}:${n}`))),'timeline beat alignment');
    }
    for(const t of s.strategies || []){
      check(strategyTypes.includes(t.type) && text(t.id) && text(t.prompt),'strategy identity');refs(t.refs);check(t.refs.length>0,'strategy evidence');
      check(t.options?.length>=1 && t.options.length<=3,'strategy option count');
      if(t.revealOnResult)check(t.type==='predict' && text(t.resultReminder),'result prediction reminder');
      if(t.type==='predict'){check(t.options.length>=2 && t.options.every(text) && t.options.includes('我不確定') && t.answer===undefined,'prediction ungraded');check(t.revealAt && t.refs.some(r=>r.para===t.revealAt.para && r.sentences.includes(t.revealAt.n)),'prediction reveal');}
      else {check(Array.isArray(t.answer) && t.answer.length>0 && t.answer.every(n=>Number.isInteger(n) && t.options[n]),'strategy answer');for(const o of t.options){check(text(o.label) && percent(o.x) && percent(o.y),'strategy hotspot');refs(o.refs);check(o.refs.length>0,'hotspot evidence');if(o.sprite)check(/^[\w-]+$/.test(o.sprite) && (o.width===undefined || percent(o.width) && o.width>0),'strategy sprite');if(o.face){check(percent(o.face.width) && percent(o.face.height),'face halo');check(o.markerOffset?.length===2 && o.markerOffset.every(Number.isFinite),'face marker offset');}for(const state of o.states || [])check(text(lesson.meter.states[state]),'strategy meter word');}if(t.type==='emotionClue')check(t.answer.length<=2,'emotion clue count');if(t.type==='causeEffect')check(t.result?.length===2 && t.result.every(percent) && text(t.explanation),'cause result');}
    }
    check(s.questions?.length>0,'questions');
    for(const q of s.questions){
      check(['chooseCard','orderCards','summaryCard'].includes(q.operationType), 'card type');refs(q.refs);
      if(q.operationType==='summaryCard')check(q.options?.length===3 && q.summaryImages?.length===3 && q.summaryImages.every(f=>s.art.images.includes(f) || /^sprites\/[\w-]+\.webp$/.test(f)) && q.refs.length>0,'summary cards');
      check(text(q.stem) && q.options?.length>=2 && q.options.every(text),'question');
      const answer=Array.isArray(q.answer)?q.answer:[q.answer];check(answer.every(i=>Number.isInteger(i) && i>=0 && i<q.options.length),'answer');
      if(q.operationType==='orderCards')check(answer.length===q.options.length && new Set(answer).size===answer.length,'order answer');
      if(q.initialOrder)check(q.initialOrder.length===q.options.length && new Set(q.initialOrder).size===q.options.length && q.initialOrder.every(i=>Number.isInteger(i) && i>=0 && i<q.options.length),'initial order');
    }
  }
  check(JSON.stringify(coverage)===JSON.stringify(storyExpected),'full ordered story coverage');
  check(storyExpected.every(key=>hashes.has(key)), 'full hashes');
  refs(lesson.ending.refs || []);
  for(const r of lesson.meter.events || [])check(storyExpected.includes(`${r.para}:${r.n}`) && text(lesson.meter.states[r.state]) && Number.isInteger(r.level) && r.level>=0 && r.level<=3,'meter read event');
  if(lesson.meter.read){const r=lesson.meter.read;check(expected.includes(`${r.para}:${r.n}`) && text(lesson.meter.states[r.state]),'meter read trigger');}
  check(text(lesson.ending.title),'ending');
  return true;
}

export function meterFor(lesson, scene, step, remembered=false, readRef=null) {
  const event=readRef && lesson.meter.events?.filter(r=>r.para<readRef.para || r.para===readRef.para && r.n<=readRef.n).at(-1);
  const entry=event || (remembered && lesson.meter.read ? lesson.meter.read : scene.meter[Math.min(step,scene.meter.length-1)]);
  return {level:entry.level,sourceLabel:lesson.meter.states[entry.state],label:lesson.meter.labels?.[entry.state] || lesson.meter.states[entry.state],face:lesson.meter.faces?.[entry.state] || '🙂'};
}
// Called only after the existing classroom gate. No text is persisted or logged.
export async function validateUnlockedLesson(lesson, paragraphs) {
  validateSituationLesson(lesson);
  check(paragraphs.size===lesson.paragraphCounts.length && lesson.paragraphCounts.every((n,i)=>paragraphs.get(i+1)?.length===n),'unlocked sentence counts');
  const hashes=new Map(refsOf(lesson).flatMap(r=>r.sentences.map((n,i)=>[`${r.para}:${n}`,r.sha[i]])));
  for(const [para, lines] of paragraphs)for(let n=0;n<lines.length;n++){
    if(!isStoryUnit(lesson,para,n))continue;
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(lines[n]));
    const hash=[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('').slice(0,8);
    check(hashes.get(`${para}:${n}`)===hash,'unlocked hash');
  }
  if(lesson.scenes.some(s=>s.timeline))for(const e of lesson.meter.events || [])check(paragraphs.get(e.para)?.[e.n]?.includes(lesson.meter.states[e.state]),'meter event source sentence');
  // Only source words may label a meter; approved legacy intensity suffixes remain unchanged.
  const full=[...paragraphs].flatMap(([p,lines])=>lines.filter((_,n)=>isStoryUnit(lesson,p,n))).join('');
  for(const s of lesson.scenes)for(const t of s.strategies || [])for(const o of t.options)if(typeof o==='object')for(const word of o.words || [])check(o.refs.map(r=>r.sentences.map(n=>paragraphs.get(r.para)[n]).join('')).join('').includes(word),'strategy source word');
  for(const state of lesson.meter.states)check(full.includes(state),'meter source word');
  for(const [i,e] of (lesson.meter.stateEvidence || []).entries()){
    const source=e.refs.flatMap(r=>r.sentences.map(n=>paragraphs.get(r.para)[n])).join('');
    check(source.includes(lesson.meter.states[i]),'meter evidence state');
    let end=0;for(const part of e.parts){const at=source.indexOf(part,end);check(at>=0,'meter evidence source part');end=at+part.length;}
  }
  return true;
}
