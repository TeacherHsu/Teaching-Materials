import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync,readdirSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {homedir} from 'node:os';
import lesson from '../src/data/situationLessons/115AG4K07.js';
import {validateSituationLesson,validateUnlockedLesson,storyUnitKeys,meterFor} from '../src/data/situationLessons/schema.js';
import {splitSentences} from '../src/utils/readingUnits.js';
import {classroomPassword} from './classroom-password.mjs';
import {sceneIllustrationLayout} from '../src/activities/firstPersonLayout.js';
import {operationState,mountOperation,operationComplete,operate} from '../src/activities/firstPersonInteraction.js';
import {mountStrategy,chooseStrategy} from '../src/activities/situation/strategies.js';
validateSituationLesson(lesson);
assert.deepEqual(lesson.paragraphCounts,[2,12,17,7,5,4]);assert.equal(lesson.sentenceCount,47);assert.equal(lesson.storySentenceCount,47);assert.deepEqual(lesson.excludedUnits,[]);assert.ok(!lesson.scriptTap);
const covered=lesson.scenes.flatMap(s=>s.timeline.filter(t=>['intro','read'].includes(t.kind)).flatMap(t=>t.refs.flatMap(r=>r.sentences.map(n=>`${r.para}:${n}`))));assert.deepEqual(covered,storyUnitKeys(lesson));assert.equal(new Set(covered).size,47);
assert.equal(lesson.scenes.reduce((n,s)=>n+s.operation.steps.length,0),19);
assert.deepEqual(Object.entries(lesson.speakers).filter(([,v])=>v).map(([k])=>k),[...[8,9,10].map(n=>`2:${n}`),...Array.from({length:11},(_,i)=>`3:${i+3}`),...Array.from({length:3},(_,i)=>`5:${i+2}`)]);assert.ok(Object.values(lesson.speakers).every(v=>v==='' || v==='巧文姐姐'));
for(const s of lesson.scenes){assert.ok(s.goal.length<=12);assert.ok(s.operation.prompts.every(t=>t.length<=12));assert.equal(s.operation.focus.length,s.operation.steps.length+1);assert.ok(s.operation.silentObserve);assert.ok(s.operation.protectedRegions.length);
 let run=0;for(const t of s.timeline){if(['act','strategy','question'].includes(t.kind))run=0;if(['intro','read'].includes(t.kind)){run+=t.refs.reduce((n,r)=>n+r.sentences.length,0);assert.ok(run<=8);assert.ok(Number.isInteger(t.imageIndex));}}
 assert.equal(s.questions[0].operationType,'summaryCard');assert.equal(new Set(s.questions[0].summaryImages).size,3);
 for(const t of s.strategies){assert.ok(t.answer.length>=1 && t.options.length>t.answer.length);assert.ok(t.options.every(o=>o.label!==t.prompt));}
}
assert.equal(lesson.meter.title,'美食之旅');assert.equal(lesson.meter.subject,'這堂課');assert.deepEqual(lesson.meter.states,['印度甩餅','義大利麵','壽司','多元的文化']);assert.ok(lesson.scenes[3].meter.slice(0,3).every(m=>m.state===2));
const sushi=lesson.scenes[2];assert.deepEqual(sushi.operation.collect,['cucumber','egg','floss','crab']);assert.deepEqual(sushi.operation.objects.filter(o=>sushi.operation.collect.includes(o.action)).map(o=>o.label),['放上小黃瓜','放上玉子燒','放上肉鬆','放上蟹肉棒']);assert.ok(!JSON.stringify(lesson).includes('生魚片'));
assert.equal(sushi.operation.objects.find(o=>o.action==='roll').gesture,'dragToTarget');assert.equal(sushi.art.images[sushi.art.resultStartImage],'sushi-cut.webp');assert.equal(sushi.art.resultDelay,1400);assert.equal(sushi.operation.objects.some(o=>o.action.includes('cut')),false);assert.equal(sushi.timeline.find(t=>t.kind==='read' && t.refs[0].sentences[0]===4).imageIndex,0);
const order=lesson.scenes[3].questions[1];assert.equal(order.lockOrderSelections,true);assert.deepEqual(order.options,['首先：印度甩餅','接著：義大利麵','最後：壽司']);
const password=classroomPassword();assert.ok(password,'local classroom credential is required');
const e=JSON.parse(readFileSync(new URL('../public/data/readings.enc.json',import.meta.url)));const raw=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);const key=await webcrypto.subtle.deriveKey({name:'PBKDF2',salt:Buffer.from(e.salt,'base64'),iterations:e.iter,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,['decrypt']);const rs=JSON.parse(new TextDecoder().decode(await webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(e.iv,'base64')},key,Buffer.from(e.data,'base64'))));const ps=new Map();for(const u of splitSentences(rs[lesson.lessonId].paras)){const p=u.paraIndex+1;if(!ps.has(p))ps.set(p,[]);ps.get(p).push(u.text);}await validateUnlockedLesson(lesson,ps);
const file=homedir()+'/mandarin-work/reading-tool-lessons/115KG4A07.json';assert.equal(JSON.parse(readFileSync(file)).text.replace(/[|\s]/g,''),[...ps.values()].flat().join('').replace(/\s/g,''));
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
 for(const scene of lesson.scenes){const p=setup(scene);p.ctl.setPaused(false);
  for(const [i,id]of scene.operation.steps.entries()){
   const n=p.find(id),spec=scene.operation.objects.find(o=>o.action===id);
   if(spec.gesture==='dragToTarget'){n.onclick();const r=scene.operation.regions[spec.region || 'target'];n.onpointerdown({button:0,pointerId:1,clientX:spec.x,clientY:spec.y,stopPropagation(){}});n.onpointerup({pointerId:1,clientX:(r.left+r.right)/2,clientY:(r.top+r.bottom)/2});}
   else n.onclick();
   assert.equal(p.state.step,i+1,`${scene.id} ${id}`);for(let k=0;k<25;k++)n.onclick();assert.equal(p.state.step,i+1);assert.equal(n.disabled,true);await new Promise(r=>setTimeout(r,1));
  }
  assert.ok(operationComplete(scene,p.state));assert.equal(p.changes,scene.operation.steps.length);assert.equal(operationState(scene,p.state).step,scene.operation.steps.length);
  assert.ok(!p.plane.children[0].children.some(n=>n.dataset?.region && !n.hidden));const arrow=p.plane.children[0].children.find(n=>n.className==='fp-wood-arrow' || n.classes?.has('fp-wood-arrow'));if(arrow)assert.equal(arrow.children[0].attrs.d,'');p.ctl.dispose();
 }
 // Every possible ordered pair is accepted; choosing the same ingredient twice is a no-op, including restore.
 for(const a of sushi.operation.collect)for(const b of sushi.operation.collect.filter(x=>x!==a)){
  const p=setup(sushi,true,{step:1,collected:[]});p.ctl.setPaused(false);p.find(a).onclick();assert.equal(p.state.step,2);for(let n=0;n<20;n++)p.find(a).onclick();assert.equal(p.state.step,2);p.find(b).onclick();assert.equal(p.state.step,3);assert.deepEqual(p.state.collected,[a,b]);const saved=operationState(sushi,p.state);assert.deepEqual(saved.collected,[a,b]);assert.equal(operate(sushi,saved,a),false);p.ctl.dispose();
 }
 // Wrong sauce-target pair never advances; the right region completes exactly once.
 const pasta=lesson.scenes[1];for(const [i,id]of ['red','white','green'].entries()){
  const p=setup(pasta,true,{step:i+3});p.ctl.setPaused(false);const n=p.find(id);n.onclick();const r=pasta.operation.regions[['white','green','red'][i]];
  n.onpointerdown({button:0,pointerId:1,clientX:50,clientY:86,stopPropagation(){}});n.onpointerup({pointerId:1,clientX:(r.left+r.right)/2,clientY:(r.top+r.bottom)/2});assert.equal(p.state.step,i+3);p.ctl.dispose();
 }
 // Actual animation handlers: no early count, no repeat, pause/dispose cancel.
 for(const scene of lesson.scenes)for(const spec of scene.operation.objects.filter(o=>o.viewMotion)){
  const step=scene.operation.steps.indexOf(spec.action);if(step<0)continue;
  const p=setup(scene,false,{step});p.ctl.setPaused(false);const n=p.find(spec.action);n.onclick();const a=animations.at(-1);assert.equal(p.state.step,step);for(let k=0;k<20;k++)n.onclick();assert.equal(p.state.step,step);a.onfinish();assert.equal(p.state.step,step+1);p.ctl.dispose();
  for(const mode of ['pause','dispose']){const q=setup(scene,false,{step});q.ctl.setPaused(false);q.find(spec.action).onclick();if(mode==='pause')q.ctl.setPaused(true);else q.ctl.dispose();assert.equal(q.state.step,step);q.ctl.dispose();}
 }
}finally{Object.assign(globalThis,saved);}
const page=readFileSync(new URL('../src/pages/FirstPersonPage.js',import.meta.url),'utf8');assert.match(page,/pick.disabled=place>=0/);assert.match(page,/第\$\{place\+1\}排序格已填好/);assert.match(readFileSync(new URL('../src/utils/speech.js',import.meta.url),'utf8'),/utter.lang = 'zh-TW'/);
const files=new Set(lesson.scenes.flatMap(s=>[...s.art.images,...s.questions.flatMap(q=>q.summaryImages || []),...s.operation.objects.filter(o=>o.sprite).map(o=>'sprites/'+o.sprite+'.webp'),...s.strategies.flatMap(t=>t.options.filter(o=>o.sprite).map(o=>'sprites/'+o.sprite+'.webp'))]));
for(const f of files){const path=new URL('../public/'+lesson.assetBase+f,import.meta.url);assert.ok(existsSync(path),f);assert.ok(statSync(path).size>0 && statSync(path).size<=(f.startsWith('sprites/')?120:300)*1024,f);}
console.log(`tasty: full encrypted/source/hash coverage, 19 state steps, gestures/repeat/cancel, ${visibilityChecks} four-size visibility checks passed`);
function dimensions(b){const tag=b.toString('ascii',12,16);if(tag==='VP8X')return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(tag==='VP8 ')return [b.readUInt16LE(26)&16383,b.readUInt16LE(28)&16383];if(tag==='VP8L'){const v=b.readUInt32LE(21);return [(v&16383)+1,((v>>>14)&16383)+1];}throw Error('unsupported WebP');}
for(const f of files){const b=readFileSync(new URL('../public/'+lesson.assetBase+f,import.meta.url));if(!f.startsWith('sprites/'))assert.deepEqual(dimensions(b),[2400,1024]);if(f.startsWith('sprites/summary-'))assert.deepEqual(dimensions(b),[720,300]);}
const configSource=readFileSync(new URL('../src/data/situationLessons/115AG4K07.js',import.meta.url),'utf8');for(const lines of ps.values())for(const t of lines)if(t.length>=15)assert.ok(!configSource.includes(t),'no original sentence in config');
