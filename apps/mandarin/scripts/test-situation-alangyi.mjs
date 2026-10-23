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
const saved={document:globalThis.document,Image:globalThis.Image};globalThis.document={createElement:t=>new Element(t),createElementNS:(_,t)=>new Element(t),createTextNode:t=>({textContent:t})};globalThis.Image=class extends Element{constructor(){super('img');}};
function setup(s,reduced=true,raw){const state=operationState(s,raw),outer=new Element(),host=new Element(),plane=new Element();outer.append(host);host.append(plane);let changes=0,reenter;const ctl=mountOperation(plane,{scene:s,state,reduced:()=>reduced,changed(){changes++;reenter?.();}});const find=id=>plane.children[0].children.find(n=>n.dataset.action===id);return {state,ctl,find,plane,outer,setReenter:fn=>reenter=fn,get changes(){return changes;}};}
