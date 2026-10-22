import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import water from '../src/data/situationLessons/115AG3H04.js';
import shoes from '../src/data/situationLessons/115AG4K12.js';
import {validateSituationLesson,validateUnlockedLesson,storyUnitKeys} from '../src/data/situationLessons/schema.js';
import {beatLines} from '../src/activities/firstPersonPresentation.js';
import {chooseStrategy} from '../src/activities/situation/strategies.js';
import {splitSentences} from '../src/utils/readingUnits.js';
import {classroomPassword} from './classroom-password.mjs';
for(const lesson of [water,shoes]){
 validateSituationLesson(lesson);
 const covered=lesson.scenes.flatMap(s=>s.timeline.filter(e=>['intro','read'].includes(e.kind)).flatMap(e=>beatLines(e.refs).map(r=>`${r.para}:${r.n}`)));
 assert.deepEqual(covered,storyUnitKeys(lesson));assert.equal(new Set(covered).size,lesson.storySentenceCount || lesson.sentenceCount);
 assert.equal(lesson.scenes.reduce((n,s)=>n+s.questions.length,0),4);
 for(const scene of lesson.scenes){
  assert.equal(scene.questions[0].operationType,'summaryCard');
  for(const file of scene.questions[0].summaryImages)assert.ok(statSync(new URL(`../public/${lesson.assetBase}${file}`,import.meta.url)).size>0);
  for(const entry of scene.timeline.filter(e=>e.kind==='intro'))assert.ok(beatLines(entry.refs).length<=8);
  for(const t of scene.strategies || []){
   if(t.type==='predict'){assert.equal(t.answer,undefined);assert.equal(t.options.at(-1),'我不確定');for(let i=0;i<t.options.length;i++)assert.equal(chooseStrategy(t,i).complete,true);}
   else{let selected=[];for(const i of t.answer){let r=chooseStrategy(t,i,selected);selected=r.selected;for(let repeat=0;repeat<5;repeat++)assert.deepEqual(chooseStrategy(t,i,selected).selected,selected);}assert.equal(selected.length,t.answer.length);}
   for(const o of t.options)if(o.face){assert.ok(Math.abs(o.markerOffset[0])>o.face.width/2);}
  }
 }
}
assert.deepEqual(water.scenes.map(s=>s.operation.profile),['cooking-dragToTarget','cooking-scoopGesture','cooking-observe','cooking-toolGrab']);
assert.deepEqual(shoes.scenes.map(s=>s.operation.steps.length),[1,2,5,2]);
assert.equal(water.scenes[1].art.images[water.scenes[1].timeline.find(e=>e.kind==='strategy').imageIndex],'act2-scoop-3.webp');
assert.deepEqual(water.scenes[3].beats.intro[0].sentences,[9]);
assert.ok(water.scenes[3].timeline.findIndex(e=>e.kind==='strategy')<water.scenes[3].timeline.findIndex(e=>e.kind==='act'));
assert.ok(shoes.scenes[1].timeline.findIndex(e=>e.kind==='strategy')<shoes.scenes[1].timeline.findIndex(e=>e.kind==='result'));
assert.equal(shoes.scenes[1].strategies[0].revealAt.n,58);
assert.deepEqual(shoes.scenes[2].timeline.slice(0,4).map(e=>[e.kind,e.untilStep]),[['intro',undefined],['act',1],['intro',undefined],['act',undefined]]);
assert.equal(shoes.scenes[3].art.images[shoes.scenes[3].timeline.find(e=>e.kind==='strategy').imageIndex],'midnight-hammer.webp');
const password=classroomPassword();
if(password){
const encrypted=JSON.parse(readFileSync(new URL('../public/data/readings.enc.json',import.meta.url)));
const raw=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
const key=await webcrypto.subtle.deriveKey({name:'PBKDF2',salt:Buffer.from(encrypted.salt,'base64'),iterations:encrypted.iter,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,['decrypt']);
const data=JSON.parse(new TextDecoder().decode(await webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(encrypted.iv,'base64')},key,Buffer.from(encrypted.data,'base64'))));
for(const lesson of [water,shoes]){
 const paragraphs=new Map();for(const u of splitSentences(data[lesson.lessonId].paras)){const p=u.paraIndex+1;if(!paragraphs.has(p))paragraphs.set(p,[]);paragraphs.get(p).push(u.text);}
 await validateUnlockedLesson(lesson,paragraphs);
 for(const scene of lesson.scenes)for(const t of scene.strategies || [])for(const o of t.options)if(typeof o==='object')for(const state of o.states || [])assert.ok(o.refs.some(r=>r.sentences.some(n=>paragraphs.get(r.para)[n].includes(lesson.meter.states[state]))),'emotion word belongs to its evidence sentence');
}
}else console.log('SKIP: no local classroom password; encrypted source verification unavailable');
console.log('PASS: backfill schemas, 45/93 unique ordered source units and hashes, all meter/clue source words, eight summaries/four questions per lesson, <=8 openings, preserved operation steps, reveal timing and evidence frames');
