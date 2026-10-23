import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {homedir} from 'node:os';
import lesson from '../src/data/situationLessons/115AG3H08.js';
import {validateSituationLesson,validateUnlockedLesson,storyUnitKeys} from '../src/data/situationLessons/schema.js';
import {splitSentences} from '../src/utils/readingUnits.js';
import {classroomPassword} from './classroom-password.mjs';
import {sceneIllustrationLayout} from '../src/activities/firstPersonLayout.js';
import {operationState,mountOperation,operationComplete,operate} from '../src/activities/firstPersonInteraction.js';
import {meterRevealed,sentenceSources} from '../src/activities/firstPersonPresentation.js';
import {speakerSpot,needsScriptTap} from '../src/activities/situation/scriptTap.js';
import {mountStrategy,chooseStrategy} from '../src/activities/situation/strategies.js';
validateSituationLesson(lesson);
assert.equal(lesson.sentenceCount,128);assert.equal(lesson.storySentenceCount,107);
assert.deepEqual(lesson.scenes.map(s=>s.clues[0].refs.reduce((n,r)=>n+r.sentences.length,0)),[38,30,13,26]);
const covered=lesson.scenes.flatMap(s=>s.timeline.filter(t=>['intro','read'].includes(t.kind)).flatMap(t=>t.refs.flatMap(r=>r.sentences.map(n=>`${r.para}:${n}`))));
assert.deepEqual(covered,storyUnitKeys(lesson));assert.equal(new Set(covered).size,107);
assert.deepEqual([...new Set(Object.values(lesson.speakers))].sort(),['旁白','小螃蟹','寄居蟹','友友','美美','淨灘志工'].sort());
for(const s of lesson.scenes){
 assert.ok(s.goal.length<=12);assert.ok(s.operation.prompts.every(t=>t.length<=12));assert.equal(s.operation.silentObserve,true);
 assert.equal(s.operation.focus.length,s.operation.steps.length+1);assert.ok(Number.isFinite(s.operation.focus.at(-1)));
 assert.ok(s.roleIntro);assert.ok(s.settingLabel);assert.ok(s.operation.protectedRegions.every(o=>o.width>0 && o.ratio>0));
 assert.equal(s.questions[0].operationType,'summaryCard');assert.equal(s.questions[0].summaryImages.length,2);assert.notEqual(...s.questions[0].summaryImages);
 for(const t of s.timeline.filter(t=>t.kind==='intro'))assert.ok(t.refs.flatMap(r=>r.sentences).length<=8);
 for(const [i,t]of s.timeline.entries())if(t.kind==='read' && s.timeline.slice(i+1).some(t=>t.kind==='act'))assert.ok(Number.isInteger(t.imageIndex));
}
assert.equal(lesson.script.stageDirectionStyle,'small-italic');assert.equal(lesson.script.speakStageDirections,false);
const cause=lesson.scenes[0].strategies[0];assert.deepEqual(cause.answer,[0]);// CF 2026-10-23：選項配圖是貝殼／瓶蓋，題目改問「想要住哪裡」。
assert.equal(cause.prompt,'寄居蟹想要住哪裡？');assert.equal(cause.options[0].label,'貝殼');assert.equal(cause.options[1].label,'瓶蓋');assert.equal(chooseStrategy(cause,1).complete,false);assert.equal(chooseStrategy(cause,0).complete,true);
for(const o of cause.options){assert.notEqual(o.label,cause.prompt);assert.ok(o.markerOffset[1]>o.width);}
assert.equal(lesson.scenes[1].strategies[0].type,'emotionClue');assert.equal(lesson.scenes[3].strategies[0].type,'predict');assert.equal(lesson.scenes[3].strategies[0].answer,undefined);assert.ok(!lesson.scenes[3].strategies[0].options.some(o=>/志工|貝殼|新家/.test(o)));
assert.equal(lesson.scenes[3].questions[1].lockOrderSelections,true);
assert.ok(lesson.scenes.flatMap(s=>s.operation.objects).filter(o=>!o.target && !o.hotspot).every(o=>!['hermit','crab'].includes(o.sprite)),'no grabbing animals');
assert.ok(lesson.scenes[1].operation.objects.filter(o=>lesson.scenes[1].operation.collect.includes(o.action)).every(o=>['bottle','cup','cap'].includes(o.sprite)));
assert.equal(meterRevealed(lesson.scenes[0],[]),false);assert.equal(meterRevealed(lesson.scenes[0],['12:2']),true);assert.equal(meterRevealed(lesson.scenes[1],['26:3']),false);assert.equal(meterRevealed(lesson.scenes[3],['44:1']),false);
const password=classroomPassword();
if(password){
 const e=JSON.parse(readFileSync(new URL('../public/data/readings.enc.json',import.meta.url)));const raw=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);const key=await webcrypto.subtle.deriveKey({name:'PBKDF2',salt:Buffer.from(e.salt,'base64'),iterations:e.iter,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,['decrypt']);const rs=JSON.parse(new TextDecoder().decode(await webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(e.iv,'base64')},key,Buffer.from(e.data,'base64'))));const ps=new Map();for(const u of splitSentences(rs[lesson.lessonId].paras)){const p=u.paraIndex+1;if(!ps.has(p))ps.set(p,[]);ps.get(p).push(u.text);}await validateUnlockedLesson(lesson,ps);
 const roots=[homedir()+'/mandarin-work/',homedir()+'/Library/CloudStorage/OneDrive-個人/mandarin-work/'];const file=roots.map(r=>r+'reading-tool-lessons/115HG3A08.json').find(existsSync);assert.ok(file);assert.equal(JSON.parse(readFileSync(file)).text.replace(/[|\s]/g,''),[...ps.values()].flat().join('').replace(/\s/g,''));
 const sayTexts=new Map();for(const u of splitSentences(rs[lesson.lessonId].paras)){const para=u.paraIndex+1;const count=[...sayTexts.keys()].filter(k=>k.startsWith(para+':')).length;sayTexts.set(`${para}:${count}`,u.say);}
 const resolved=sentenceSources(lesson,ps,sayTexts);assert.equal([...resolved.keys()].filter(k=>k.startsWith('sentence:')).length,107);
 for(const r of lesson.excludedUnits)for(const n of r.sentences)assert.ok(!resolved.has(`say:${r.para}:${n}`),'headers never spoken');
 for(const key of covered){const [para,n]=key.split(':').map(Number),script=resolved.get(`script:${key}`);assert.equal(script.speaker,lesson.speakers[key]);assert.equal(script.parts.map(p=>p.text).join(''),ps.get(para)[n].replace(new RegExp('^'+script.speaker+'：'),''));assert.ok(!/[（）【】]/.test(resolved.get(`say:${key}`)));}
 // Count consecutive audible units across adjacent timeline read entries too:
 // speaker-only headers and unspoken stage directions never start speech.
 for(const scene of lesson.scenes){let run=0;for(const t of scene.timeline){if(['act','strategy','question'].includes(t.kind)){run=0;continue;}if(['intro','read'].includes(t.kind))for(const r of t.refs)for(const n of r.sentences){if(resolved.get(`say:${r.para}:${n}`)?.trim())run++;assert.ok(run<=8,`${scene.id} uninterrupted audible run exceeds 8`);}}}
 assert.equal(resolved.get('say:26:4'),'');assert.equal(resolved.get('say:45:0'),'');assert.equal(resolved.get('say:5:0'),'');assert.equal(resolved.get('say:5:1'),'');
 const source=readFileSync(new URL('../src/data/situationLessons/115AG3H08.js',import.meta.url),'utf8');for(const ts of ps.values())for(const t of ts)if(t.length>=12 && !lesson.meter.states.some(w=>t.includes(w)))assert.ok(!source.includes(t),'no source sentences in config');
 const bad=structuredClone(lesson);bad.scenes[0].clues[0].refs[0].sha[0]='00000000';await assert.rejects(()=>validateUnlockedLesson(bad,ps));
 const wrongTerm=structuredClone(lesson);wrongTerm.meter.states[0]='不存在的原料';await assert.rejects(()=>validateUnlockedLesson(wrongTerm,ps));
}else console.log('SKIP: local classroom password unavailable; encrypted/source checks not run');
assert.ok(lesson.scenes.reduce((n,s)=>n+s.operation.steps.length,0)>=14);
for(const s of lesson.scenes)for(const t of s.timeline.filter(t=>['intro','read'].includes(t.kind)))assert.ok(t.refs.reduce((n,r)=>n+r.sentences.length,0)<=8,'reading chunk <=8');
let visibilityChecks=0;
const sizes=[[1366,900],[820,1180],[375,812],[678,771]];
const panFor=(w,iw,x)=>Math.max(0,Math.min(1,(iw*x/100-w/2)/(iw-w || 1)));
function visible(s,w,h,o,focus,panel=true){const iw=sceneIllustrationLayout(w,h,.5,s.art).imageWidth,g=sceneIllustrationLayout(w,h,panFor(w,iw,focus),s.art),x=g.left+g.imageWidth*o.x/100,y=g.top+g.imageHeight*o.y/100;const rx=Math.max(22,g.imageWidth*(o.width || 0)/200),ry=Math.max(22,g.imageWidth*(o.width || 0)*(o.ratio || 1)/200);assert.ok(x-rx>=-1e-8 && x+rx<=w+1e-8,`${s.id} ${o.action || o.label}: x at ${w}x${h}`);assert.ok(y-ry>=0 && y+ry<=h*(panel?.74:1),`${s.id} ${o.action || o.label}: y at ${w}x${h}`);visibilityChecks++;}
for(const s of lesson.scenes)for(const[w,h]of sizes){
 for(const spot of Object.values(s.art.speakerSpots || {})){
  const [dx,dy]=spot.markerOffset;visible(s,w,h,{x:spot.x+dx,y:spot.y+dy,width:0},spot.x+dx/2);
  visible(s,w,h,{x:spot.x,y:spot.y,width:spot.face.width,ratio:spot.face.height/spot.face.width*1024/2400},spot.x+dx/2);
  const g=sceneIllustrationLayout(w,h,.5,s.art);
  assert.ok(Math.abs(dy)*g.imageHeight/100>=22+spot.face.height*g.imageHeight/200,'marker outside face');
 }
 for(const read of [false,true])for(const pan of [0,.5,1]){const g=sceneIllustrationLayout(w,h,pan,s.art,read);assert.ok(g.left<=0 && g.top<=0 && g.left+g.imageWidth>=w-1e-8 && g.top+g.imageHeight>=h,'full cover');}
 for(let step=0;step<s.operation.steps.length;step++)for(const o of s.operation.objects.filter(o=>!o.passive && step>=(o.fromStep ?? 0) && step<=(o.toStep ?? s.operation.steps.length) && !s.operation.steps.slice(0,step).includes(o.action)))visible(s,w,h,o,s.operation.focus[step]);
 for(const t of s.strategies || [])if(t.type!=='predict')for(const o of t.options){if(o.sprite)visible(s,w,h,o,t.focus);visible(s,w,h,{...o,x:o.x+(o.markerOffset?.[0] || 0),y:o.y+(o.markerOffset?.[1] || 0),width:0,ratio:1},t.focus);}

}
const animations=[];
class Element{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.style={setProperty(k,v){this[k]=v;}};this.dataset={};this.attrs={};this.events={};this.classes=new Set();this.classList={add:n=>this.classes.add(n),remove:n=>this.classes.delete(n),toggle:(n,v)=>v?this.classes.add(n):this.classes.delete(n)};}
 append(...xs){for(const x of xs){x.parentElement=this;this.children.push(x);}}appendChild(x){this.append(x);}prepend(x){x.parentElement=this;this.children.unshift(x);}setAttribute(k,v){this.attrs[k]=v;if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;}
 addEventListener(k,f){(this.events[k] ||= []).push(f);}removeEventListener(k,f){this.events[k]=(this.events[k] || []).filter(fn=>fn!==f);}replaceChildren(...xs){this.children=[];this.append(...xs);}remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(x=>x!==this);}setPointerCapture(){}getBoundingClientRect(){return{left:0,top:0,width:100,height:100};}
 querySelector(s){return this.children.find(x=>s==='img' && x.tagName==='img' || s==='[data-strategy-next]' && x.attrs?.['data-strategy-next']) || this.children.map(x=>x.querySelector?.(s)).find(Boolean) || null;}
 closest(s){return s==='button' && this.tagName==='button'?this:null;}click(){this.onclick?.();for(const f of this.events.click || [])f({target:this});}
 animate(){const a={cancel(){this.oncancel?.();}};animations.push(a);return a;}
}
const saved={document:globalThis.document,Image:globalThis.Image};globalThis.document={createElement:t=>new Element(t),createElementNS:(_,t)=>new Element(t),createTextNode:t=>({textContent:t})};globalThis.Image=class extends Element{constructor(){super('img');}};
function setup(s,reduced=true,raw){const state=operationState(s,raw),outer=new Element(),host=new Element(),plane=new Element();outer.append(host);host.append(plane);let changes=0,reenter;const ctl=mountOperation(plane,{scene:s,state,reduced:()=>reduced,changed(){changes++;reenter?.();}});const find=id=>plane.children[0].children.find(n=>n.dataset.action===id);const activate=id=>{const o=s.operation.objects.find(o=>o.action===id);find(id).onclick();if((o.gesture || s.operation.type)==='dragToTarget')find(s.operation.objects.find(t=>t.target && (o.region==='second'?t.action==='sand-2':true)).action).onclick();};return {state,ctl,find,activate,plane,outer,setReenter:fn=>reenter=fn,get changes(){return changes;}};}

// Check full object boxes, including 44px touch bounds, at every active step.
for(const s of lesson.scenes)for(const [w,h]of sizes)for(let step=0;step<s.operation.steps.length;step++){
 const g=sceneIllustrationLayout(w,h,.5,s.art);
 const active=s.operation.objects.filter(o=>step>=(o.fromStep ?? 0) && step<=(o.toStep ?? 99) && !s.operation.steps.slice(0,step).includes(o.action));
 const box=o=>{const rx=Math.max(22,g.imageWidth*o.width/200),ry=Math.max(22,g.imageWidth*o.width*o.ratio/200);return{x:g.imageWidth*o.x/100,y:g.imageHeight*o.y/100,rx,ry};};
 for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){const a=box(active[i]),b=box(active[j]);assert.ok(Math.abs(a.x-b.x)>=a.rx+b.rx || Math.abs(a.y-b.y)>=a.ry+b.ry,`${s.id} ${active[i].action}/${active[j].action} overlap at ${w}x${h}`);}
}
try{
 for(const s of lesson.scenes){
  const p=setup(s);p.activate(s.operation.steps[0]);assert.equal(p.state.step,0);p.ctl.setPaused(false);
  for(const [i,id]of s.operation.steps.entries()){const node=p.find(id);p.setReenter(()=>node.onclick());p.activate(id);assert.equal(p.state.step,i+1);for(let j=0;j<30;j++)node.onclick();assert.equal(p.state.step,i+1);assert.equal(node.disabled,true);if(s.operation.objects.find(o=>o.action===id).hideWhenCompleted)assert.equal(node.hidden,true);}
  assert.ok(operationComplete(s,p.state));assert.equal(p.changes,s.operation.steps.length);assert.equal(operationState(s,p.state).step,s.operation.steps.length);
  for(const n of p.plane.children[0].children){if(n.classes?.has('fp-wood-arrow'))assert.equal(n.children[0].attrs.d,'');if(n.dataset.region)assert.equal(n.hidden,true);}
  p.ctl.dispose();
 }
 // New motion commits only at animation completion, supports cancellation, and
 // restores the hidden illustration from state on remount.
 for(const [sceneIndex,step,action] of [[0,2,'search-1'],[2,2,'nod-youyou'],[3,1,'hide']]){
  const p=setup(lesson.scenes[sceneIndex],false,{step});p.ctl.setPaused(false);p.activate(action);const a=animations.at(-1);assert.equal(p.state.step,step);p.activate(action);assert.equal(p.state.step,step);a.onfinish();assert.equal(p.state.step,step+1);p.ctl.dispose();
  const q=setup(lesson.scenes[sceneIndex],false,{step});q.ctl.setPaused(false);q.activate(action);q.ctl.setPaused(true);assert.equal(q.state.step,step);q.ctl.dispose();
 }
 {const scene=lesson.scenes[3],p=setup(scene,true,{step:2});
  assert.equal(scene.art.images[scene.art.stepImages[p.state.step]],'mound-hidden.webp');
  assert.equal(scene.art.resultImage,undefined,'initial listen result must not hide the crab early');
  assert.equal(scene.art.images[scene.art.stepImages.at(-1)],'mound-hidden.webp');
  assert.equal(scene.operation.objects.find(o=>o.action==='hide').viewMotion,'sandPuff');
  assert.ok(!p.plane.children.some(n=>n.className==='fp-action-hideInSand'));p.ctl.dispose();
  let afterHide=false;
  for(const beat of scene.timeline){if(beat.kind==='act' && beat.untilStep===2){afterHide=true;continue;}if(afterHide && beat.kind==='read')assert.equal(scene.art.images[beat.imageIndex],'mound-hidden.webp');if(afterHide && beat.kind==='act')assert.equal(scene.art.images[beat.imageIndex],'day-empty.webp');}
  for(const step of [2,3,4,5]){assert.equal(speakerSpot(scene,'寄居蟹',3,step),null);assert.equal(needsScriptTap(lesson,'tap',{speaker:'寄居蟹'},scene,3,step),false);}
  const css=readFileSync(new URL('../src/styles/first-person.css',import.meta.url),'utf8');assert.ok(!css.includes('.fp-action-hideInSand'));assert.match(css,/@keyframes fp-sand-puff/);
  assert.ok(existsSync(new URL('../public/'+lesson.assetBase+'mound-hidden.webp',import.meta.url)));
 }
 {const p=setup(lesson.scenes[3],false,{step:1});p.ctl.setPaused(false);p.activate('hide');const effect=p.plane.children[0].children.find(n=>n.className==='fp-action-sandPuff');assert.equal(effect.children.length,7);assert.equal(p.state.step,1);animations.at(-1).onfinish();assert.equal(p.state.step,2);assert.ok(!p.plane.children[0].children.includes(effect));p.ctl.dispose();}
 // The old motion name remains an alias for the same transient effect.
 {const scene=structuredClone(lesson.scenes[3]);scene.operation.objects.find(o=>o.action==='hide').viewMotion='hideInSand';const p=setup(scene,false,{step:1});p.ctl.setPaused(false);p.activate('hide');assert.equal(p.state.step,1);animations.at(-1).onfinish();assert.equal(p.state.step,2);p.ctl.dispose();}
 // Shell is a non-scoring distractor, returns for click and pointer alternatives.
 {const p=setup(lesson.scenes[1]);p.ctl.setPaused(false);p.activate('shell');assert.equal(p.state.step,0);assert.equal(p.changes,0);assert.equal(p.find('shell').style.left,'52%');assert.equal(p.outer.children[1].children[0].textContent,'貝殼要留給寄居蟹');
 const n=p.find('shell');n.onpointerdown({button:0,pointerId:1,clientX:52,clientY:69,stopPropagation(){}});n.onpointerup({pointerId:1,clientX:57,clientY:63});assert.equal(p.state.step,0);assert.equal(n.style.left,'52%');p.ctl.dispose();}
 // Actual fast and slow cup drags, cancellation, release-click suppression, no double counting.
 {const s=lesson.scenes[0],p=setup(s,true,{step:1});p.ctl.setPaused(false);const n=p.find('cup');const down=()=>n.onpointerdown({button:0,pointerId:2,clientX:43.5,clientY:54,stopPropagation(){}}),up=()=>n.onpointerup({pointerId:2,clientX:55.5,clientY:66});
 down();up();assert.equal(p.state.step,1);assert.equal(p.outer.children[1].children[0].textContent,'輕輕的');assert.equal(n.style.left,'43.5%');
 down();n.onpointercancel();up();assert.equal(p.state.step,1);
 const start=performance.now();down();await new Promise(r=>setTimeout(r,900));up();assert.ok(performance.now()-start>=850);assert.equal(p.state.step,2);assert.equal(p.changes,1);n.onclick();assert.equal(p.changes,1);p.ctl.dispose();}
 for(const s of lesson.scenes)for(const t of s.strategies || []){
  const plane=new Element(),panel=new Element(),stage=new Element();let done=0;const dispose=mountStrategy({strategy:t,panel,plane,stage,states:lesson.meter.states,onWords(){},onDone:()=>done++,focus(){}});
  if(t.type==='predict'){const n=panel.children.at(-1).children[2].children[0];for(let i=0;i<20;i++)n.click();assert.equal(done,1);}
  else{plane.children.find(n=>n.attrs?.['aria-label']===t.options[1].label).click();assert.equal(done,0);const n=plane.children.find(n=>n.attrs?.['aria-label']===t.options[0].label);n.click();const count=plane.children.length;for(let i=0;i<30;i++)n.click();assert.equal(plane.children.length,count);const next=panel.querySelector('[data-strategy-next]');for(let i=0;i<20;i++)next.click();assert.equal(done,1);}
  dispose();assert.equal(plane.children.length,0);
 }
}finally{Object.assign(globalThis,saved);}
const page=readFileSync(new URL('../src/pages/FirstPersonPage.js',import.meta.url),'utf8');assert.match(page,/pick.disabled=place>=0/);assert.match(page,/第\$\{place\+1\}排序格已填好/);assert.match(readFileSync(new URL('../src/utils/speech.js',import.meta.url),'utf8'),/utter.lang = 'zh-TW'/);
const files=new Set(lesson.scenes.flatMap(s=>[...s.art.images,...s.questions.flatMap(q=>q.summaryImages || []),...s.operation.objects.filter(o=>o.sprite).map(o=>'sprites/'+o.sprite+'.webp'),...(s.strategies || []).flatMap(t=>t.options.filter(o=>o.sprite).map(o=>'sprites/'+o.sprite+'.webp'))]));for(const f of files)assert.ok(statSync(new URL('../public/'+lesson.assetBase+f,import.meta.url)).size<=(f.startsWith('sprites/')?120:300)*1024,f);
console.log(`PASS: crab 107 ordered units/hash, cover, ${visibilityChecks} four-size visibility checks, no overlap, script/speakers, gentle cup and shell, rapid/repeated click, focus and guide cleanup`);

for(const mutate of [l=>l.scenes[0].operation.objects[1].minDragMs=-1,l=>l.scenes[1].operation.objects[3].action='cup',l=>l.script.speakStageDirections=true]){const bad=structuredClone(lesson);mutate(bad);assert.throws(()=>validateSituationLesson(bad));}
