import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import lesson from '../src/data/situationLessons/115AG6H12.js';
import {validateSituationLesson,validateUnlockedLesson,meterFor,storyUnitKeys} from '../src/data/situationLessons/schema.js';
import {classroomPassword} from './classroom-password.mjs';
import {splitSentences} from '../src/utils/readingUnits.js';
import {mountOperation,operationState,operationComplete,operate} from '../src/activities/firstPersonInteraction.js';
import {illustrationLayout} from '../src/activities/firstPersonLayout.js';
import {beatLines,nextBeat} from '../src/activities/firstPersonPresentation.js';
import {freshProgress,restoreProgress,answerScene} from '../src/activities/firstPersonCore.js';
validateSituationLesson(lesson);
assert.equal(lesson.sentenceCount,142);assert.equal(storyUnitKeys(lesson).length,141);
assert.deepEqual(lesson.excludedUnits,[{para:1,sentences:[0]}]);
assert.deepEqual(lesson.scenes.map(s=>[s.beats.intro[0].sentences[0],s.beats.intro[0].sentences.at(-1),s.beats.read[0].sentences[0],s.beats.read[0].sentences.at(-1)]),[[1,14,15,32],[33,36,37,49],[50,56,57,88],[89,91,92,141]]);
assert.deepEqual(lesson.scenes.flatMap(s=>beatLines([...s.beats.intro,...s.beats.read]).map(r=>r.n)),Array.from({length:141},(_,i)=>i+1));
assert.deepEqual(lesson.scenes.map(s=>s.questions[0].answer),[0,0,0,0]);assert.ok(lesson.scenes.every(s=>s.questions[0].operationType==='summaryCard'));
assert.deepEqual(lesson.meter.states,['感傷','難過','震驚','憤怒又絕望','冷靜','氣惱','悲從中來','不慌不忙','欣慰','心滿意足']);
for(const [n,word] of [[30,'難過'],[36,'憤怒又絕望'],[37,'冷靜'],[85,'悲從中來'],[93,'不慌不忙'],[133,'欣慰'],[138,'心滿意足']])assert.equal(meterFor(lesson,lesson.scenes[0],0,false,{para:1,n}).label,word);
let b='intro';const beats=[];while(b){beats.push(b);b=nextBeat(b);}assert.deepEqual(beats,['intro','act','result','read','question']);
for(const s of lesson.scenes){
 for(const f of s.art.images)assert.ok(statSync(new URL(`../public/${lesson.assetBase}${f}`,import.meta.url)).size<=400*1024);
 for(const f of Object.values(s.art.expressionStates || {}).flatMap(Object.values))assert.ok(statSync(new URL(`../public/${lesson.assetBase}${f}`,import.meta.url)).size<=120*1024);
 for(const o of s.operation.objects.filter(o=>o.sprite))assert.ok(statSync(new URL(`../public/${lesson.assetBase}sprites/${o.sprite}.webp`,import.meta.url)).size<=120*1024);
 const q=s.questions[0];assert.equal(q.hints.length,3);assert.equal(q.options.length,q.why.length);assert.ok(q.refs.length);
}
const password=classroomPassword();
if(!password)console.log('SKIP: formal password unavailable; source verification not claimed');
else{
 const e=JSON.parse(readFileSync(new URL('../public/data/readings.enc.json',import.meta.url)));
 const raw=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
 const key=await webcrypto.subtle.deriveKey({name:'PBKDF2',salt:Buffer.from(e.salt,'base64'),iterations:e.iter,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,['decrypt']);
 const readings=JSON.parse(new TextDecoder().decode(await webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(e.iv,'base64')},key,Buffer.from(e.data,'base64'))));assert.ok(readings[lesson.lessonId]);
 const paragraphs=new Map();for(const u of splitSentences(readings[lesson.lessonId].paras)){const p=u.paraIndex+1;if(!paragraphs.has(p))paragraphs.set(p,[]);paragraphs.get(p).push(u.text);}await validateUnlockedLesson(lesson,paragraphs);
 const source=[...paragraphs.values()].flat().slice(1).join('').replace(/\s/g,'');const config=readFileSync(new URL('../src/data/situationLessons/115AG6H12.js',import.meta.url),'utf8').replace(/\s/g,'');
 for(let i=0;i<=source.length-18;i++)assert.equal(config.includes(source.slice(i,i+18)),false,'no continuous source passage in public config');
 for(const [name,a,z] of [['布大爺',117,124],['菜販',99,102],['弗大叔',111,114],['警察',87,88],['圍觀的人',94,94],['大家',129,131]])for(let n=a;n<=z;n++)assert.equal(lesson.speakers[`1:${n}`],name);
 console.log('PASS: formal encrypted lesson present, 142 units/141 story units, SHA-256 and ten source meter words');
}
// Numeric full-bleed cover and UI rectangles; not browser verification.
let checks=0;const overlap=(a,b)=>a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
for(const [width,height] of [[1366,900],[820,1180],[375,812]])for(const s of lesson.scenes)for(let step=0;step<s.operation.steps.length;step++){
 const initial=illustrationLayout(width,height,.5,s.art.aspect);assert.ok(initial.imageWidth>=width && initial.imageHeight>=height);
 const focus=s.operation.focus[step];const pan=Math.max(0,Math.min(1,(initial.imageWidth*focus/100-width/2)/(initial.imageWidth-width || 1)));const g=illustrationLayout(width,height,pan,s.art.aspect);
 for(const o of s.operation.objects.filter(o=>!o.passive && step>=(o.fromStep??0) && step<=(o.toStep??99))){
  const w=Math.max(44,g.imageWidth*o.width/100),h=Math.max(44,g.imageWidth*o.width/100*o.ratio),box={x:g.left+g.imageWidth*o.x/100-w/2,y:g.top+g.imageHeight*o.y/100-h/2,w,h};
  assert.ok(box.x>=0 && box.x+box.w<=width,`${width} ${s.id}/${o.action}: same action frame`);assert.ok(box.y>110 && box.y+box.h<height-12,`${width} ${s.id}/${o.action}: clear task and footer`);
  for(const blocker of [{x:12,y:12,w:100,h:44},{x:width-228,y:12,w:216,h:44},{x:12,y:68,w:width-24,h:44}]){assert.ok(!overlap(box,blocker));checks++;}
 }
}
class Element{
 constructor(){this.children=[];this.style={setProperty(k,v){this[k]=v;}};this.dataset={};this.attrs={};this.classList={add(){},remove(){},toggle(){}};}
 append(...xs){for(const x of xs){x.parentElement=this;this.children.push(x);}}setAttribute(k,v){this.attrs[k]=v;}remove(){}getBoundingClientRect(){return {left:0,top:0,width:100,height:100};}setPointerCapture(){}animate(){return {cancel(){}};}
}
const globals={document:globalThis.document,Image:globalThis.Image,innerWidth:globalThis.innerWidth,innerHeight:globalThis.innerHeight};
globalThis.document={createElement:()=>new Element(),createElementNS:()=>new Element(),createTextNode:text=>({textContent:text})};globalThis.Image=Element;globalThis.innerWidth=375;globalThis.innerHeight=812;
const e=(x,y)=>({pointerId:1,button:0,clientX:x,clientY:y,stopPropagation(){}});const tick=()=>new Promise(r=>setTimeout(r,1));
function setup(scene){const outer=new Element(),host=new Element(),plane=new Element();outer.append(host);host.append(plane);const state=operationState(scene);let changes=0;const controller=mountOperation(plane,{scene,state,changed(){changes++;}});controller.setPaused(false);return {scene,state,controller,outer,layer:plane.children[0],find:a=>plane.children[0].children.find(el=>el.dataset.action===a),count:()=>outer.children[1].children[1].textContent,changes:()=>changes};}
try{
 const first=setup(lesson.scenes[0]);first.find('touch-3').onclick();assert.equal(first.state.step,1);assert.ok(!first.layer.children.some(el=>el.className==='fp-object-bubble'),'unnamed pumpkin has no nameplate');first.find('touch-3').onclick();assert.equal(first.state.step,1);for(const a of ['touch-1','touch-2'])first.find(a).onclick();assert.equal(first.count(),'3／3');first.controller.dispose();
 const garden=setup(lesson.scenes[1]);assert.equal(garden.count(),'0／3');assert.equal(garden.find('stem-1').hidden,true);assert.equal(operate(garden.scene,garden.state,'stem-1'),false,'cannot collect from later phase');
 for(const a of ['vine-3','vine-1','vine-2'])garden.find(a).onclick();assert.equal(garden.state.step,3);assert.equal(garden.count(),'0／3');assert.equal(garden.find('stem-1').hidden,false);assert.equal(garden.find('vine-1').hidden,true);
 const stem=garden.find('stem-1');stem.onpointerdown(e(46,71));stem.onpointerup(e(70,60));assert.equal(garden.state.step,3);assert.equal(stem.style.left,'44%');await tick();stem.onpointerdown(e(46,71));stem.onpointercancel();assert.equal(garden.state.step,3);
 for(const a of ['stem-3','stem-1','stem-2']){garden.find(a).onclick();garden.find('bag').onclick();}assert.equal(garden.count(),'3／3');assert.equal(garden.state.step,6);garden.controller.dispose();
 const market=setup(lesson.scenes[2]);for(const a of ['recognize-2','recognize-3','recognize-1'])market.find(a).onclick();assert.equal(market.state.step,3);market.controller.dispose();
 const match=setup(lesson.scenes[3]);assert.equal(match.scene.operation.guide,false,'no arrow revealing matching answer');
 match.find('match-1').onclick();match.find('socket-2').onclick();assert.equal(match.state.step,0,'wrong shape rejected');assert.equal(match.find('match-1').style.left,'46%');
 for(const i of [3,1,2]){const o=match.scene.operation.objects.find(o=>o.action==='match-'+i),button=match.find(o.action);button.onpointerdown(e(o.x,o.y));button.onpointerup(e(o.x,match.find('socket-'+i).style.top.replace('%','')*1));await tick();assert.equal(button.style.width,`${o.destinationWidth}%`);assert.equal(button.style.top,`${o.destination[1]}%`);}
 assert.equal(match.count(),'3／3');assert.equal(match.changes(),3);assert.ok(operationComplete(match.scene,match.state));match.find('socket-1').onclick();assert.equal(match.changes(),3);
 const progress=freshProgress(lesson);progress.current=3;for(let i=0;i<3;i++)Object.assign(progress.scenes[i],{operation:operationState(lesson.scenes[i],{step:lesson.scenes[i].operation.steps.length}),found:lesson.scenes[i].clues.map(c=>c.id),done:true,questionIndex:1});progress.scenes[3].operation=match.state;assert.deepEqual(restoreProgress(lesson,progress).scenes[3].operation,match.state);match.controller.dispose();
 const keyboard=setup(lesson.scenes[3]);for(const i of [2,3,1]){keyboard.find('match-'+i).onclick();keyboard.find('socket-'+i).onclick();}assert.equal(keyboard.state.step,3);keyboard.controller.dispose();
 for(const scene of lesson.scenes){const state={operation:operationState(scene,{step:scene.operation.steps.length}),found:scene.clues.map(c=>c.id),questionIndex:0,done:false};assert.equal(answerScene(scene,state,scene.questions[0].answer).correct,true);assert.equal(state.done,true);}
}finally{Object.assign(globalThis,globals);}
console.log(`PASS: stub four acts, phase counter/reset, no early pickup, no third name, wrong-shape/cancel/duplicate/snap/keyboard/restore/questions; ${checks} three-size UI checks`);
