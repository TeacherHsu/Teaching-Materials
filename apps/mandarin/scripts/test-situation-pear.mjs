import assert from 'node:assert/strict';
import {readFileSync,statSync,existsSync} from 'node:fs';import {webcrypto} from 'node:crypto';import {homedir} from 'node:os';
import lesson from '../src/data/situationLessons/115AG3H05.js';
import {validateSituationLesson,validateUnlockedLesson,storyUnitKeys,meterFor} from '../src/data/situationLessons/schema.js';
import {splitSentences} from '../src/utils/readingUnits.js';import {classroomPassword} from './classroom-password.mjs';
import {operationState,mountOperation,operationComplete,operate} from '../src/activities/firstPersonInteraction.js';
validateSituationLesson(lesson);assert.deepEqual(lesson.paragraphCounts,[14,11,12,7]);assert.equal(storyUnitKeys(lesson).length,44);
assert.equal(lesson.meter.title,'梨花狀況');assert.equal(lesson.meter.subject,'梨花');assert.deepEqual(lesson.meter.labels,['淋雨腐爛','撐著小雨傘','結出的果實比較多']);assert.ok(!lesson.meter.states.includes('煩心'));
assert.equal(meterFor(lesson,lesson.scenes[2],2).label,lesson.meter.labels[2]);assert.equal(meterFor(lesson,lesson.scenes[0],0).sourceLabel,Object.keys(lesson.scenes[0].art.expressionStates)[0]);
assert.equal(lesson.scenes[0].strategies[0].meterTarget,'翁先生');assert.deepEqual(lesson.scenes[0].strategies[0].options[0].words,['煩心']);
assert.equal(lesson.scenes[2].beats.intro.length,0);assert.ok(lesson.scenes.every(s=>s.questions.length===1 && s.questions[0].type==='summaryCard'));
for(const mutate of [l=>l.meter.title='',l=>l.scenes[3].art.viewScales.work=.9,l=>l.meter.subject=4,l=>l.meter.labels.pop(),l=>l.meter.stateEvidence.pop(),l=>l.scenes[0].operation.objects[0].completedSprite='../bad',l=>l.scenes[3].strategies[0].options[0].sprite='../bad']){const x=structuredClone(lesson);mutate(x);assert.throws(()=>validateSituationLesson(x));}
for(const s of lesson.scenes){assert.ok(s.goal.length<=12);for(const prompt of s.operation.prompts || [])assert.ok(prompt.length<=12);for(const t of s.timeline.filter(t=>t.kind==='intro'))assert.ok(t.refs.reduce((n,r)=>n+r.sentences.length,0)<=8);for(const f of [...s.art.images,...s.operation.objects.filter(o=>o.sprite).flatMap(o=>[`sprites/${o.sprite}.webp`,...(o.completedSprite?[`sprites/${o.completedSprite}.webp`]:[])])])assert.ok(statSync(new URL(`../public/${lesson.assetBase}${f}`,import.meta.url)).size<=(f.startsWith('sprites/')?120:400)*1024);}
const predict=lesson.scenes[1];assert.ok(predict.timeline.findIndex(t=>t.kind==='strategy')<predict.timeline.findIndex(t=>t.kind==='act'));assert.equal(predict.strategies[0].answer,undefined);
const password=classroomPassword();if(password){
const e=JSON.parse(readFileSync(new URL('../public/data/readings.enc.json',import.meta.url)));const raw=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);const key=await webcrypto.subtle.deriveKey({name:'PBKDF2',salt:Buffer.from(e.salt,'base64'),iterations:e.iter,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,['decrypt']);const readings=JSON.parse(new TextDecoder().decode(await webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(e.iv,'base64')},key,Buffer.from(e.data,'base64'))));
const paragraphs=new Map();for(const u of splitSentences(readings[lesson.lessonId].paras)){const p=u.paraIndex+1;if(!paragraphs.has(p))paragraphs.set(p,[]);paragraphs.get(p).push(u.text);}await validateUnlockedLesson(lesson,paragraphs);
const sourceFile=homedir()+'/Library/CloudStorage/OneDrive-個人/mandarin-work/reading-tool-lessons/115HG3A05.json';if(existsSync(sourceFile)){const source=JSON.parse(readFileSync(sourceFile)).text.replace(/[|\s]/g,'');assert.ok(source===[...paragraphs.values()].flat().join('').replace(/\s/g,''),'local source matches encrypted units');}
const bad=structuredClone(lesson);bad.meter.stateEvidence[0].parts=['不存在的來源詞'];await assert.rejects(()=>validateUnlockedLesson(bad,paragraphs));
}else console.log('SKIP: no local classroom password; official pear hash/source unavailable');
// Actual mounted handlers, including synchronous reentry and 200ms repeat taps.
class Element{constructor(tag='div'){this.tagName=tag;this.children=[];this.style={setProperty(k,v){this[k]=v;}};this.dataset={};this.classList={add(){},remove(){},toggle(){}};}append(...xs){for(const x of xs){x.parentElement=this;this.children.push(x);}}setAttribute(){}querySelector(s){return this.children.find(x=>s==='img' && x.tagName==='img') || null;}remove(){}setPointerCapture(){}getBoundingClientRect(){return {left:0,top:0,width:100,height:100};}}
const saved={document:globalThis.document,Image:globalThis.Image};globalThis.document={createElement:t=>new Element(t),createElementNS:(_,t)=>new Element(t)};globalThis.Image=class extends Element{constructor(){super('img');}};
function setup(scene,raw){const state=operationState(scene,raw),outer=new Element(),host=new Element(),plane=new Element();outer.append(host);host.append(plane);let changes=0,reenter;const ctl=mountOperation(plane,{scene,state,reduced:()=>true,changed(){changes++;reenter?.();}});ctl.setPaused(false);return {state,ctl,find:id=>plane.children[0].children.find(x=>x.dataset.action===id),setReenter:f=>reenter=f,get changes(){return changes;},status:outer.children.at(-1)};}
try{
 for(const scene of lesson.scenes){
  const p=setup(scene),actions=scene.operation.collect?[...scene.operation.collect].reverse():scene.operation.steps;
  if(!scene.operation.collect){p.find(actions.at(-1)).onclick();assert.equal(p.state.step,0,'wrong order unchanged');assert.equal(p.status.children[0].textContent,scene.operation.retry);}
  for(const [i,id] of actions.entries()){const node=p.find(id);p.setReenter(()=>node.onclick());node.onclick();assert.equal(p.state.step,i+1);assert.equal(p.changes,i+1);for(let j=0;j<20;j++)node.onclick();assert.equal(p.state.step,i+1,'completed item no-op');}
  assert.ok(operationComplete(scene,p.state));p.ctl.setPaused(true);p.ctl.setPaused(false);p.find(actions[0]).onclick();assert.equal(p.changes,actions.length);p.ctl.dispose();
  const restored=operationState(scene,p.state);assert.equal(restored.step,actions.length);assert.equal(operate(scene,restored,actions[0]),false);
 }
 const p=setup(lesson.scenes[0]);p.find('wet-2').onclick();assert.match(p.find('wet-2').querySelector('img').src,/flower-wet\.webp$/);assert.match(p.find('wet-1').querySelector('img').src,/flower-dry\.webp$/);p.ctl.dispose();
 const q=setup(lesson.scenes[3]);q.find('clip-3').onclick();assert.match(q.find('clip-3').querySelector('img').src,/clip-umbrella\.webp$/);q.ctl.setPaused(true);q.find('clip-1').onclick();assert.equal(q.state.step,1);q.ctl.dispose();
}finally{Object.assign(globalThis,saved);}
console.log('PASS: pear 44 official units/hash/source, configurable meter/source labels, summary timing, sprite swaps, wrong assembly order, any-order clips, repeat/reentry/pause/restore');
const {sceneIllustrationLayout}=await import('../src/activities/firstPersonLayout.js');
for(const [w,h] of [[1366,900],[820,1180],[375,812]]){
 const a=lesson.scenes[3].art,near=sceneIllustrationLayout(w,h,.5,a,false,'work'),wide=sceneIllustrationLayout(w,h,.5,a,false,'wide');
 assert.ok(near.imageHeight>wide.imageHeight,'late orchard view pulls back');
 for(const g of [near,wide])assert.ok(g.left<=0 && g.top<=0 && g.left+g.imageWidth>=w && g.top+g.imageHeight>=h,'pullback always retains full cover');
 for(const scene of [lesson.scenes[0],lesson.scenes[1]]){
  const g=sceneIllustrationLayout(w,h,.5,scene.art);for(const o of scene.operation.objects.filter(o=>!o.passive)){
   const x=g.left+g.imageWidth*o.x/100;assert.ok(x>=22 && x<=w-22,'all flower/material centers fit mobile cover');
  }
 }
 const clue=lesson.scenes[0].strategies[0].options[0];assert.ok(clue.markerOffset[0]>clue.face.width/2,'marker lies outside face');
}
console.log('PASS: late orchard pullback retains cover at three sizes; flower/material targets visible; face marker outside facial features');
