import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import lesson from '../src/data/situationLessons/115AG4K12.js';
import { validateSituationLesson, validateUnlockedLesson } from '../src/data/situationLessons/schema.js';
import { splitSentences } from '../src/utils/readingUnits.js';
import { classroomPassword } from './classroom-password.mjs';
import { mountOperation, operationState, operationComplete } from '../src/activities/firstPersonInteraction.js';
import { advanceTrace } from '../src/activities/situation/operations.js';
import { beatLines, nextBeat } from '../src/activities/firstPersonPresentation.js';
import { illustrationLayout } from '../src/activities/firstPersonLayout.js';
import { freshProgress, restoreProgress, answerScene } from '../src/activities/firstPersonCore.js';
validateSituationLesson(lesson);
assert.deepEqual(lesson.scenes.map(s=>s.questions[0].answer).slice(0,3),[0,1,2]);
assert.deepEqual(lesson.meter.states,['嘆口氣','驚訝','喜出望外','百思不解','嘖嘖稱奇','幸福與喜悅']);
assert.deepEqual(lesson.scenes.flatMap(s=>beatLines([...s.beats.intro,...s.beats.read]).map(r=>r.n)),Array.from({length:93},(_,i)=>i+7));
let beat='intro';const beats=[];while(beat){beats.push(beat);beat=nextBeat(beat);}assert.deepEqual(beats,['intro','act','result','read','question']);
for(const s of lesson.scenes){
 const q=s.questions[0];assert.equal(q.hints.length,3);assert.equal(q.why.length,q.options.length);
 for(const file of s.art.images)assert.ok(statSync(new URL(`../public/${lesson.assetBase}${file}`,import.meta.url)).size<=400*1024);
 for(const o of s.operation.objects.filter(o=>o.sprite))assert.ok(statSync(new URL(`../public/${lesson.assetBase}sprites/${o.sprite}.webp`,import.meta.url)).size<=120*1024);
}
// Real encrypted source only in memory. Errors never print sentences/passwords.
const password=classroomPassword();
if(!password)console.log('SKIP: no classroom password; source hash verification unavailable');
else {
 const e=JSON.parse(readFileSync(new URL('../public/data/readings.enc.json',import.meta.url)));
 const raw=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
 const key=await webcrypto.subtle.deriveKey({name:'PBKDF2',salt:Buffer.from(e.salt,'base64'),iterations:e.iter,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,['decrypt']);
 const readings=JSON.parse(new TextDecoder().decode(await webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(e.iv,'base64')},key,Buffer.from(e.data,'base64'))));
 assert.ok(readings[lesson.lessonId]);const paragraphs=new Map();
 for(const u of splitSentences(readings[lesson.lessonId].paras)){const p=u.paraIndex+1;if(!paragraphs.has(p))paragraphs.set(p,[]);paragraphs.get(p).push(u.text);}
 await validateUnlockedLesson(lesson,paragraphs);
 const plain=[...paragraphs.values()].flat().join('').replace(/\s/g,'');
 const configText=readFileSync(new URL('../src/data/situationLessons/115AG4K12.js',import.meta.url),'utf8').replace(/\s/g,'');
 for(let i=0;i<=plain.length-18;i++)assert.equal(configText.includes(plain.slice(i,i+18)),false,'no continuous 18-character source passage in config');
 for(const scene of lesson.scenes)for(const q of scene.questions)assert.ok(q.refs.every(r=>r.sentences.every((n,i)=>scene.clues.flatMap(c=>c.refs).some(c=>c.para===r.para && c.sentences.some((v,j)=>v===n && c.sha[j]===r.sha[i])))) || scene.act===4);
 console.log('PASS: official encrypted 100 units, 93 story units ordered unique coverage, all SHA-256 refs and six source meter words');
}
// Numeric cover rectangles are not a browser layout claim.
let checks=0;
const overlaps=(a,b)=>a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
for(const [width,height] of [[1366,900],[820,1180],[375,812]])for(const scene of lesson.scenes){
 const initial=illustrationLayout(width,height,.5,scene.art.aspect);assert.ok(initial.imageWidth>=width && initial.imageHeight>=height);
 for(const o of scene.operation.objects){
  const pan=Math.max(0,Math.min(1,(initial.imageWidth*o.x/100-width/2)/(initial.imageWidth-width || 1)));
  const g=illustrationLayout(width,height,pan,scene.art.aspect),w=Math.max(44,g.imageWidth*o.width/100),h=Math.max(44,g.imageWidth*o.width/100*o.ratio);
  const box={x:g.left+g.imageWidth*o.x/100-w/2,y:g.top+g.imageHeight*o.y/100-h/2,w,h};
  assert.ok(box.y>110 && box.y+box.h<height-12,`${width}: ${o.action} clear of toolbar/task`);
  const blockers=[{x:12,y:12,w:100,h:44},{x:width-228,y:12,w:216,h:44},{x:12,y:74,w:width-24,h:36}];
  for(const b of blockers){assert.ok(!overlaps(box,b),`${width}: ${o.action} overlaps UI`);checks++;}
 }
}
// Source and destination must share the portrait frame during each drag.
for(const [width,height] of [[1366,900],[820,1180],[375,812]])for(const scene of lesson.scenes)for(let step=0;step<scene.operation.steps.length;step++){
 const initial=illustrationLayout(width,height,.5,scene.art.aspect);
 const x=scene.operation.focus?.[step] ?? scene.art.orientationFocus[width/height>=1.4?'landscape':'portrait'];
 const pan=Math.max(0,Math.min(1,(initial.imageWidth*x/100-width/2)/(initial.imageWidth-width || 1)));
 const g=illustrationLayout(width,height,pan,scene.art.aspect);
 const active=scene.operation.objects.filter(o=>!o.passive && step>=(o.fromStep ?? 0) && step<=(o.toStep ?? 99));
 for(const o of active){const w=Math.max(44,g.imageWidth*o.width/100),left=g.left+g.imageWidth*o.x/100-w/2;assert.ok(left>=0 && left+w<=width,`${width} ${scene.id}/${step}: ${o.action} fully in the action frame`);}
}
// Exercise production event handlers with the actual lesson configuration.
class Element {
 constructor(){this.children=[];this.style={setProperty(k,v){this[k]=v;}};this.dataset={};this.attrs={};this.classList={add(){},remove(){},toggle(){}};}
 append(...xs){for(const x of xs){x.parentElement=this;this.children.push(x);}}
 setAttribute(k,v){this.attrs[k]=v;}
 remove(){} getBoundingClientRect(){return {left:0,top:0,width:100,height:100};}
 setPointerCapture(){} animate(){return {cancel(){}};}
}
const saved={document:globalThis.document,Image:globalThis.Image,innerWidth:globalThis.innerWidth,innerHeight:globalThis.innerHeight};
globalThis.document={createElement:()=>new Element(),createElementNS:()=>new Element(),createTextNode:text=>({textContent:text})};globalThis.Image=Element;globalThis.innerWidth=1366;globalThis.innerHeight=900;
const event=(x,y)=>({pointerId:1,button:0,clientX:x,clientY:y,stopPropagation(){}});
function setup(scene){const outer=new Element(),host=new Element(),plane=new Element();outer.append(host);host.append(plane);const state=operationState(scene);let changes=0;const controller=mountOperation(plane,{scene,state,changed(){changes++;}});controller.setPaused(false);return {state,controller,find:a=>plane.children[0].children.find(el=>el.dataset.action===a),changes:()=>changes};}
const tick=()=>new Promise(r=>setTimeout(r,1));
try{
 const cut=setup(lesson.scenes[0]),scissors=cut.find('cut');
 scissors.onpointerdown(event(33,65));scissors.onpointerup(event(47,80));assert.equal(cut.state.step,0,'off-line path rejected');await tick();
 scissors.onpointerdown(event(33,65));scissors.onpointermove(event(40,65));scissors.onpointercancel();assert.equal(cut.state.step,0,'cancel leaves leather intact');
 scissors.onpointerdown(event(33,65));scissors.onpointerup(event(47,65));assert.equal(cut.state.step,1,'coalesced straight sweep visits the dashed route');assert.equal(cut.changes(),1);assert.equal(scissors.hidden,true);cut.controller.dispose();await tick();
 const keyboard=setup(lesson.scenes[0]);for(let i=0;i<4;i++)keyboard.find('cut').onclick();assert.equal(keyboard.state.step,0);keyboard.find('cut').onclick();assert.equal(keyboard.state.step,1);keyboard.controller.dispose();
 const morning=setup(lesson.scenes[1]);assert.equal(morning.find('buy').hidden,true);
 morning.find('sell').onpointerdown(event(58,64));morning.find('sell').onpointerup(event(75,51));assert.equal(morning.state.step,0,'shoe must go to customer, not rack');await tick();
 morning.find('sell').onclick();morning.find('customer').onclick();assert.equal(morning.state.step,1);assert.equal(morning.find('buy').hidden,false);assert.equal(morning.find('sell').hidden,true);
 morning.find('buy').onpointerdown(event(64,66));morning.find('buy').onpointerup(event(75,51));assert.equal(morning.state.step,2);morning.controller.dispose();
 const midnight=setup(lesson.scenes[2]);midnight.find('hammer').onclick();assert.equal(midnight.state.step,0);midnight.find('blow').onclick();assert.equal(midnight.state.step,1);
 midnight.find('hide').onpointerdown(event(8,44));midnight.find('hide').onpointerup(event(19,44));assert.equal(midnight.state.step,2);await tick();
 for(const action of ['sew','hammer','arrange'])midnight.find(action).onclick();assert.equal(midnight.state.step,5);assert.equal(midnight.changes(),5);midnight.controller.dispose();
 const gifts=setup(lesson.scenes[3]);for(const action of ['little-shoes','clothes']){gifts.find(action).onclick();gifts.find('table').onclick();}assert.equal(gifts.state.step,2);assert.ok(!gifts.find('clothes').hidden && !gifts.find('little-shoes').hidden,'enlarged sprites remain on the table until departure');gifts.find('table').onclick();assert.equal(gifts.changes(),2);
 const progress=freshProgress(lesson);progress.scenes[3].operation=gifts.state;gifts.controller.dispose();
 for(const scene of lesson.scenes){const state={operation:operationState(scene,{step:scene.operation.steps.length}),found:scene.clues.map(c=>c.id),questionIndex:0,done:false};assert.ok(operationComplete(scene,state.operation));const result=answerScene(scene,state,scene.questions[0].answer);assert.equal(result.correct,true);assert.equal(state.done,true);}
 const restored=freshProgress(lesson);restored.scenes[0].operation=operationState(lesson.scenes[0],{step:1});assert.equal(restoreProgress(lesson,restored).scenes[0].operation.step,1);
 const bent=[[10,10],[10,30],[30,30]];assert.equal(advanceTrace(1,{x:10,y:10},{x:30,y:30},bent,2),-1,'diagonal shortcut across bend is rejected');
}finally{Object.assign(globalThis,saved);}
console.log(`PASS: shoemaker four operations, keyboard/cancel/wrong-target/order/duplicate/restore/questions; ${checks} object/UI checks at three sizes`);
