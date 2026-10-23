import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync,readdirSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {homedir} from 'node:os';
import lesson from '../src/data/situationLessons/115AG3H09.js';
import {validateSituationLesson,validateUnlockedLesson,storyUnitKeys,meterFor} from '../src/data/situationLessons/schema.js';
import {splitSentences} from '../src/utils/readingUnits.js';
import {classroomPassword} from './classroom-password.mjs';
import {sceneIllustrationLayout} from '../src/activities/firstPersonLayout.js';
import {operationState,mountOperation,operationComplete} from '../src/activities/firstPersonInteraction.js';
import {mountStrategy,chooseStrategy} from '../src/activities/situation/strategies.js';
validateSituationLesson(lesson);
assert.deepEqual(lesson.paragraphCounts,[4,14,19,4]);assert.equal(lesson.sentenceCount,41);assert.equal(lesson.storySentenceCount,41);
// The current encrypted edition has no title unit: do not remove the first body sentence.
assert.deepEqual(lesson.excludedUnits,[]);assert.ok(!lesson.scriptTap && !lesson.script);
assert.deepEqual(Object.entries(lesson.speakers).filter(([,v])=>v),[['2:4','弟弟'],['2:5','弟弟'],...Array.from({length:5},(_,i)=>[`3:${i+14}`,'導遊'])]);
const covered=lesson.scenes.flatMap(s=>s.timeline.filter(t=>['intro','read'].includes(t.kind)).flatMap(t=>t.refs.flatMap(r=>r.sentences.map(n=>`${r.para}:${n}`))));
assert.deepEqual(covered,storyUnitKeys(lesson));assert.equal(new Set(covered).size,41);
assert.deepEqual(lesson.scenes.map(s=>s.clues[0].refs.reduce((n,r)=>n+r.sentences.length,0)),[15,5,6,15]);
assert.equal(lesson.scenes.reduce((n,s)=>n+s.operation.steps.length,0),24);
for(const s of lesson.scenes){
 assert.ok(s.goal.length<=12);assert.ok(s.operation.prompts.every(t=>t.length<=12));assert.equal(s.operation.silentObserve,true);
 assert.equal(s.operation.focus.length,s.operation.steps.length+1);assert.ok(Number.isFinite(s.operation.focus.at(-1)));assert.ok(Array.isArray(s.operation.protectedRegions));
 let run=0;for(const t of s.timeline){if(['act','strategy','question'].includes(t.kind))run=0;if(['intro','read'].includes(t.kind)){run+=t.refs.reduce((n,r)=>n+r.sentences.length,0);assert.ok(run<=8);assert.ok(Number.isInteger(t.imageIndex));}}
 const q=s.questions[0];assert.equal(q.operationType,'summaryCard');assert.equal(q.summaryImages.length,3);assert.equal(new Set(q.summaryImages).size,3);
 for(const t of s.strategies){if(t.type==='predict'){assert.equal(t.answer,undefined);assert.deepEqual(t.options,['鳳梨','別的果實','我不確定']);for(let i=0;i<t.options.length;i++)assert.equal(chooseStrategy(t,i).complete,true);continue;}assert.ok(t.answer.length>=1 && t.options.length>t.answer.length);for(const o of t.options)assert.notEqual(o.label,t.prompt);}
}
assert.equal(lesson.meter.title,'古道上的發現');assert.equal(lesson.meter.subject,'古道');
assert.equal(lesson.scenes[1].meter[0].state,1);assert.equal(lesson.scenes[1].meter[1].state,2);assert.equal(lesson.scenes[1].meter[5].state,2);assert.equal(lesson.scenes[1].meter[6].state,3);
assert.ok(lesson.scenes[1].operation.objects.slice(1).every(o=>o.minIntervalMs===600 && o.gentlePrompt==='小心，一步一步走'));
assert.equal(lesson.scenes[3].operation.objects.at(-1).returnOnTap,'導遊說：只能拍照，不能帶走');
assert.ok(lesson.scenes[3].operation.objects.slice(0,7).every((o,i)=>o.fromStep===i && o.successCount===i+1 && o.destination));
const password=classroomPassword();assert.ok(password,'local classroom credential is required');
const e=JSON.parse(readFileSync(new URL('../public/data/readings.enc.json',import.meta.url)));const raw=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);const key=await webcrypto.subtle.deriveKey({name:'PBKDF2',salt:Buffer.from(e.salt,'base64'),iterations:e.iter,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,['decrypt']);const rs=JSON.parse(new TextDecoder().decode(await webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(e.iv,'base64')},key,Buffer.from(e.data,'base64'))));const ps=new Map();for(const u of splitSentences(rs[lesson.lessonId].paras)){const p=u.paraIndex+1;if(!ps.has(p))ps.set(p,[]);ps.get(p).push(u.text);}await validateUnlockedLesson(lesson,ps);
const file=[homedir()+'/mandarin-work/',homedir()+'/Library/CloudStorage/OneDrive-個人/mandarin-work/'].map(r=>r+'reading-tool-lessons/115HG3A09.json').find(existsSync);assert.ok(file);assert.equal(JSON.parse(readFileSync(file)).text.replace(/[|\s]/g,''),[...ps.values()].flat().join('').replace(/\s/g,''));
const bad=structuredClone(lesson);bad.scenes[0].clues[0].refs[0].sha[0]='00000000';await assert.rejects(()=>validateUnlockedLesson(bad,ps));
let visibilityChecks=0;
const sizes=[[1366,900],[820,1180],[375,812],[678,771]];
const panFor=(w,iw,x)=>Math.max(0,Math.min(1,(iw*x/100-w/2)/(iw-w || 1)));
function geometry(s,w,h,focus){const iw=sceneIllustrationLayout(w,h,.5,s.art).imageWidth;return sceneIllustrationLayout(w,h,panFor(w,iw,focus),s.art);}
function box(g,o){const x=g.left+g.imageWidth*o.x/100,y=g.top+g.imageHeight*o.y/100;return {x,y,rx:Math.max(22,g.imageWidth*(o.width || 0)/200),ry:Math.max(22,g.imageWidth*(o.width || 0)*(o.ratio || 1)/200)};}
function visible(s,w,h,o,focus,panel=false){const b=box(geometry(s,w,h,focus),o);assert.ok(b.x-b.rx>=-1e-8 && b.x+b.rx<=w+1e-8,`${s.id} ${o.action || o.label} x ${w}x${h}`);assert.ok(b.y-b.ry>=0 && b.y+b.ry<=h*(panel?.74:1),`${s.id} ${o.action || o.label} y ${w}x${h}`);visibilityChecks++;}
for(const s of lesson.scenes)for(const[w,h]of sizes){
 for(const read of [false,true])for(const pan of [0,.5,1]){const g=sceneIllustrationLayout(w,h,pan,s.art,read);assert.ok(g.left<=0 && g.top<=0 && g.left+g.imageWidth>=w-1e-8 && g.top+g.imageHeight>=h,'full cover');}
 for(let step=0;step<=s.operation.steps.length;step++){
  const active=s.operation.objects.filter(o=>step>=o.fromStep && step<=o.toStep && !s.operation.steps.slice(0,step).includes(o.action));
  for(const o of active)visible(s,w,h,o,s.operation.focus[step]);
  const g=geometry(s,w,h,s.operation.focus[step]);
  for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){const a=box(g,active[i]),b=box(g,active[j]);assert.ok(Math.abs(a.x-b.x)>=a.rx+b.rx || Math.abs(a.y-b.y)>=a.ry+b.ry,`${s.id} interactive objects overlap`);}
  // Completed sprites must not cover the next interactive object.
  const completed=s.operation.objects.filter(o=>o.sprite && step>=o.fromStep && step<=o.toStep && s.operation.steps.slice(0,step).includes(o.action) && o.destination);
  for(const o of active)for(const c of completed){const a=box(g,o),b=box(g,{...c,x:c.destination[0],y:c.destination[1],width:c.destinationWidth || c.width});assert.ok(Math.abs(a.x-b.x)>=a.rx+b.rx || Math.abs(a.y-b.y)>=a.ry+b.ry,`${s.id} completed sprite covers active object`);}
 }
 for(const t of s.strategies.filter(t=>t.type!=='predict'))for(const o of t.options){visible(s,w,h,o,t.focus,true);visible(s,w,h,{...o,x:o.x+o.markerOffset[0],y:o.y+o.markerOffset[1],width:0},t.focus,true);const g=geometry(s,w,h,t.focus);assert.ok(o.markerOffset[1]*g.imageHeight/100>g.imageWidth*o.width/200+22,'marker below illustration');}
}
// Full 44px strategy markers and illustrations clear all protected faces.
for(const [w,h]of sizes){const scene=lesson.scenes[3],t=scene.strategies[0],g=geometry(scene,w,h,t.focus);
 const apart=(a,b)=>Math.abs(a.x-b.x)>=a.rx+b.rx || Math.abs(a.y-b.y)>=a.ry+b.ry;
 for(const o of t.options){const card=box(g,{...o,ratio:1}),marker=box(g,{x:o.x+o.markerOffset[0],y:o.y+o.markerOffset[1],width:0});
  assert.ok(apart(card,marker));for(const face of scene.operation.protectedRegions){assert.ok(apart(card,box(g,face)),'strategy card clears faces');assert.ok(apart(marker,box(g,face)),'44px marker clears faces');}
 }
 assert.ok(apart(...t.options.map(o=>box(g,o))),'strategy pictures do not overlap');
}
// No premature outcome on the interleaved reading beats.
assert.deepEqual(lesson.scenes[1].timeline.filter(t=>['intro','read'].includes(t.kind)).map(t=>t.imageIndex),[0,1,2]);
assert.equal(lesson.scenes[0].art.images[lesson.scenes[0].timeline.find(t=>t.kind==='read').imageIndex],'fruit.webp');
const order=lesson.scenes[3].questions[1];assert.equal(order.lockOrderSelections,true);assert.deepEqual(order.answer,[0,1,2,3,4]);
const animations=[];
class Element{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.style={setProperty(k,v){this[k]=v;}};this.dataset={};this.attrs={};this.events={};this.classes=new Set();this.classList={add:n=>this.classes.add(n),remove:n=>this.classes.delete(n),toggle:(n,v)=>v?this.classes.add(n):this.classes.delete(n)};}
 append(...xs){for(const x of xs){x.parentElement=this;this.children.push(x);}}appendChild(x){this.append(x);}prepend(x){x.parentElement=this;this.children.unshift(x);}setAttribute(k,v){this.attrs[k]=v;if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;}
 addEventListener(k,f){(this.events[k] ||= []).push(f);}removeEventListener(k,f){this.events[k]=(this.events[k] || []).filter(fn=>fn!==f);}replaceChildren(...xs){this.children=[];this.append(...xs);}remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(x=>x!==this);}setPointerCapture(){}getBoundingClientRect(){return{left:0,top:0,width:100,height:100};}
 querySelector(s){return this.children.find(x=>s==='img' && x.tagName==='img' || s==='[data-strategy-next]' && x.attrs?.['data-strategy-next']) || this.children.map(x=>x.querySelector?.(s)).find(Boolean) || null;}
 closest(s){return s==='button' && this.tagName==='button'?this:null;}click(){this.onclick?.();for(const f of this.events.click || [])f({target:this});}
 animate(){const a={cancel(){this.oncancel?.();}};animations.push(a);return a;}
}
const saved={document:globalThis.document,Image:globalThis.Image,performance:globalThis.performance};let now=1000;globalThis.performance={now:()=>now};globalThis.document={createElement:t=>new Element(t),createElementNS:(_,t)=>new Element(t),createTextNode:t=>({textContent:t})};globalThis.Image=class extends Element{constructor(){super('img');}};
function setup(s,reduced=true,raw){const state=operationState(s,raw),outer=new Element(),host=new Element(),plane=new Element();outer.append(host);host.append(plane);let changes=0,reenter;const ctl=mountOperation(plane,{scene:s,state,reduced:()=>reduced,changed(){changes++;reenter?.();}});const find=id=>plane.children[0].children.find(n=>n.dataset.action===id);return {state,ctl,find,plane,outer,setReenter:fn=>reenter=fn,get changes(){return changes;}};}

try{
 for(const scene of lesson.scenes){
  const p=setup(scene);const first=p.find(scene.operation.steps[0]);first.onclick();assert.equal(p.state.step,0);p.ctl.setPaused(false);
  for(const [i,id]of scene.operation.steps.entries()){
   now+=700;const n=p.find(id);p.setReenter(()=>n.onclick());n.onclick();assert.equal(p.state.step,i+1,`${scene.id} ${id}`);
   for(let k=0;k<30;k++)n.onclick();assert.equal(p.state.step,i+1);assert.equal(n.disabled,true);
  }
  assert.ok(operationComplete(scene,p.state));assert.equal(p.changes,scene.operation.steps.length);assert.ok(!p.plane.children[0].children.some(n=>n.className==='fp-generic-target' && !n.hidden || n.className==='fp-wood-arrow'),'tap-only lessons leave no placement guides');assert.equal(operationState(scene,p.state).step,scene.operation.steps.length);
  p.ctl.dispose();
 }
 // Too-fast stair taps gently wait; no score/state change. Exactly 600ms passes.
 const stairs=setup(lesson.scenes[1]);stairs.ctl.setPaused(false);stairs.find('gap').onclick();stairs.find('stair-1').onclick();assert.equal(stairs.state.step,2);
 for(let k=0;k<20;k++)stairs.find('stair-2').onclick();assert.equal(stairs.state.step,2);
 assert.equal(stairs.outer.children[1].children[0].textContent,'小心，一步一步走');now+=599;stairs.find('stair-2').onclick();assert.equal(stairs.state.step,2);now++;stairs.find('stair-2').onclick();assert.equal(stairs.state.step,3);stairs.ctl.dispose();
 // The interval starts at the accepted tap, not the end of its animation.
 const timed=setup(lesson.scenes[1],false,{step:1});timed.ctl.setPaused(false);now=10000;timed.find('stair-1').onclick();const firstAnimation=animations.at(-1);now+=250;firstAnimation.onfinish();assert.equal(timed.state.step,2);
 now=10599;timed.find('stair-2').onclick();assert.equal(timed.state.step,2);now=10600;timed.find('stair-2').onclick();now+=250;animations.at(-1).onfinish();assert.equal(timed.state.step,3);timed.ctl.dispose();
 // Non-scoring conservation choice returns the stone, keeps the camera available.
 const take=setup(lesson.scenes[3],true,{step:7});take.ctl.setPaused(false);
 for(let k=0;k<30;k++)take.find('take-home').onclick();assert.equal(take.state.step,7);assert.equal(take.changes,0);
 assert.equal(take.outer.children[1].children[0].textContent,'導遊說：只能拍照，不能帶走');assert.equal(take.find('photo').disabled,false);
 take.find('photo').onclick();assert.equal(take.state.step,8);assert.equal(take.changes,1);take.find('take-home').onclick();assert.equal(take.changes,1);take.ctl.dispose();
 // Wrong color is a meaningful retry, never a shortcut through the order.
 const colors=setup(lesson.scenes[2]);colors.ctl.setPaused(false);colors.find('blue-5').onclick();assert.equal(colors.state.step,0);assert.equal(colors.changes,0);colors.ctl.dispose();
 // Every non-reduced motion waits for completion. Pause/dispose cancels cleanly.
 for(const scene of lesson.scenes)for(const spec of scene.operation.objects.filter(o=>o.viewMotion)){
  const step=scene.operation.steps.indexOf(spec.action),p=setup(scene,false,{step});p.ctl.setPaused(false);const n=p.find(spec.action);n.onclick();const a=animations.at(-1);
  for(let k=0;k<20;k++)n.onclick();assert.equal(p.state.step,step);a.onfinish();assert.equal(p.state.step,step+1);assert.equal(p.changes,1);p.ctl.dispose();
  for(const mode of ['pause','dispose']){const q=setup(scene,false,{step});q.ctl.setPaused(false);q.find(spec.action).onclick();if(mode==='pause')q.ctl.setPaused(true);else q.ctl.dispose();assert.equal(q.state.step,step);q.ctl.dispose();}
 }
 const stones=setup(lesson.scenes[3]);stones.ctl.setPaused(false);
 for(let i=0;i<7;i++){stones.find(`stone-${i+1}`).onclick();assert.equal(stones.plane.children[0].children.at(-1).textContent,'一二三四五六七'[i]);}stones.ctl.dispose();
 const scene=lesson.scenes[3],strategy=scene.strategies[0],plane=new Element(),panel=new Element(),stage=new Element();let done=0;
 const dispose=mountStrategy({strategy,panel,plane,stage,states:lesson.meter.states,onWords(){},onDone:()=>done++,focus(){}});
 plane.children.find(n=>n.attrs?.['aria-label']===strategy.options[1].label).click();assert.equal(done,0);
 const n=plane.children.find(n=>n.attrs?.['aria-label']===strategy.options[0].label);n.click();const count=plane.children.length;for(let k=0;k<20;k++)n.click();assert.equal(plane.children.length,count);
 for(let k=0;k<20;k++)panel.querySelector('[data-strategy-next]').click();assert.equal(done,1);dispose();assert.equal(plane.children.length,0);
}finally{Object.assign(globalThis,saved);}
const page=readFileSync(new URL('../src/pages/FirstPersonPage.js',import.meta.url),'utf8');assert.match(page,/pick.disabled=place>=0/);assert.match(page,/第\$\{place\+1\}排序格已填好/);
assert.match(readFileSync(new URL('../src/utils/speech.js',import.meta.url),'utf8'),/utter.lang = 'zh-TW'/);
const opSource=readFileSync(new URL('../src/activities/situation/operations.js',import.meta.url),'utf8');assert.match(opSource,/if\(state.step>=config.steps.length\)\{arrowPath\?\.setAttribute\('d',''\)/);
const files=new Set(lesson.scenes.flatMap(s=>[...s.art.images,...s.questions.flatMap(q=>q.summaryImages || []),...s.operation.objects.filter(o=>o.sprite).map(o=>'sprites/'+o.sprite+'.webp'),...s.strategies.flatMap(t=>t.options.filter(o=>o.sprite).map(o=>'sprites/'+o.sprite+'.webp'))]));
for(const f of files){const path=new URL('../public/'+lesson.assetBase+f,import.meta.url);assert.ok(existsSync(path),f);assert.ok(statSync(path).size>0 && statSync(path).size<=(f.startsWith('sprites/')?120:300)*1024,f);}
function dimensions(b){assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');const tag=b.toString('ascii',12,16);if(tag==='VP8X')return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(tag==='VP8 ')return [b.readUInt16LE(26)&16383,b.readUInt16LE(28)&16383];if(tag==='VP8L'){const v=b.readUInt32LE(21);return [(v&16383)+1,((v>>>14)&16383)+1];}throw Error('unsupported WebP header');}
const assetURL=new URL('../public/'+lesson.assetBase,import.meta.url);
for(const f of readdirSync(assetURL).filter(f=>f.endsWith('.webp')))assert.deepEqual(dimensions(readFileSync(new URL(f,assetURL))),[2400,1024]);
for(const f of readdirSync(new URL('sprites/',assetURL)).filter(f=>f.startsWith('summary-')))assert.deepEqual(dimensions(readFileSync(new URL('sprites/'+f,assetURL))),[720,300]);
const configSource=readFileSync(new URL('../src/data/situationLessons/115AG3H09.js',import.meta.url),'utf8');
for(const ts of ps.values())for(const t of ts)if(t.length>=12 && !lesson.meter.states.some(w=>t.includes(w)))assert.ok(!configSource.includes(t),'no original prose in config');
console.log(`PASS: alangyi 41 ordered units/hash, 24 state steps, cover, ${visibilityChecks} four-size visibility checks, nonoverlap, rapid/repeated taps, gentle conservation/stair prompts, animation completion/cancellation and final focus`);
