import assert from 'node:assert/strict';
import {readFileSync,statSync,existsSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {homedir} from 'node:os';
import lesson from '../src/data/situationLessons/115AG4K11.js';
import {validateSituationLesson,validateUnlockedLesson,storyUnitKeys} from '../src/data/situationLessons/schema.js';
import {splitSentences} from '../src/utils/readingUnits.js';
import {sentenceSources} from '../src/activities/firstPersonPresentation.js';
import {classroomPassword} from './classroom-password.mjs';
import {operationState,mountOperation,operate,operationComplete} from '../src/activities/firstPersonInteraction.js';
validateSituationLesson(lesson);
const crying=lesson.scenes[2].art;
assert.equal(crying.images[crying.resultImage],'cry.webp');
assert.deepEqual(crying.expressionOverlays,{'cry.webp':'cry-expression.webp'});
assert.ok(crying.stepImages.every(i=>crying.images[i]!=='cry.webp'),'no crying overlay during jumping');
assert.ok(statSync(new URL('../public/assets/situation/115AG4K11/cry-expression.webp',import.meta.url)).size<120*1024);
assert.equal(lesson.scenes.length,5);assert.deepEqual(lesson.paragraphCounts,[6,124]);assert.equal(storyUnitKeys(lesson).length,120);
assert.deepEqual(lesson.scenes.map(s=>[...s.beats.intro,...s.beats.read].flatMap(r=>r.sentences).length),[40,16,15,40,9]);
assert.ok(lesson.scenes.every(s=>s.questions[0].operationType==='summaryCard'));
assert.equal(lesson.scenes[1].questions[1].id,'script-elements');assert.equal(lesson.scenes[4].questions[1].operationType,'orderCards');
assert.deepEqual(lesson.scenes.flatMap((s,i)=>s.beats.result.safetyReminder?[i+1]:[]),[2,4]);
const warning='這是故事裡的魔法。現實中，不認識的食物和飲料不能隨便吃喝。';
assert.equal(JSON.stringify(lesson).split(warning).length-1,2);
for(const s of lesson.scenes){
 assert.ok(s.goal.length<=12);for(const p of s.operation.prompts || [])assert.ok(p.length<=12);
 for(const t of s.timeline.filter(t=>t.kind==='intro'))assert.ok(t.refs.reduce((n,r)=>n+r.sentences.length,0)<=8);
 for(const t of s.strategies){if(t.type==='predict'){assert.equal(t.answer,undefined);assert.ok(!t.options.some(o=>o.includes('二十五') || o.includes('鑰匙')));}if(t.type==='causeEffect'){assert.ok(t.options.length>=2 && t.answer.length<t.options.length);assert.ok(t.options.every(o=>o.label!==t.prompt));}for(const o of t.options.filter(o=>o.face))assert.ok(Math.abs(o.markerOffset[0])>o.face.width/2);}
 const r=s.beats.result;if(r.safetyReminder){assert.ok(r.safetyDelay>s.art.resultDelay);assert.ok(s.art.resultStartImage!==undefined);}
 assert.ok(s.operation.objects.every(o=>!/[吃喝]/.test(o.label)),'student never eats or drinks');
 for(const f of [...s.art.images,...s.operation.objects.filter(o=>o.sprite).flatMap(o=>[`sprites/${o.sprite}.webp`,...(o.completedSprite?[`sprites/${o.completedSprite}.webp`]:[])])])assert.ok(statSync(new URL(`../public/${lesson.assetBase}${f}`,import.meta.url)).size<=(f.startsWith('sprites/')?120:300)*1024);
}
for(const mutate of [l=>l.script.speakStageDirections=true,l=>l.script.stageDirectionStyle='plain',l=>l.scenes[1].beats.result.safetyDelay=0,l=>l.scenes[1].art.resultStartImage=99,l=>l.safetyReminderCount=3]){const copy=structuredClone(lesson);mutate(copy);assert.throws(()=>validateSituationLesson(copy));}
const password=classroomPassword();
if(password){
 const e=JSON.parse(readFileSync(new URL('../public/data/readings.enc.json',import.meta.url))),raw=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
 const key=await webcrypto.subtle.deriveKey({name:'PBKDF2',salt:Buffer.from(e.salt,'base64'),iterations:e.iter,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,['decrypt']);
 const readings=JSON.parse(new TextDecoder().decode(await webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(e.iv,'base64')},key,Buffer.from(e.data,'base64'))));
 const paragraphs=new Map(),sayTexts=new Map();for(const u of splitSentences(readings[lesson.lessonId].paras)){const p=u.paraIndex+1;if(!paragraphs.has(p))paragraphs.set(p,[]);sayTexts.set(`${p}:${paragraphs.get(p).length}`,u.say);paragraphs.get(p).push(u.text);}
 await validateUnlockedLesson(lesson,paragraphs);
 const f=homedir()+'/Library/CloudStorage/OneDrive-個人/mandarin-work/reading-tool-lessons/115KG4A11.json';
 if(existsSync(f))assert.equal(JSON.parse(readFileSync(f)).text.replace(/[|\s]/g,''),[...paragraphs.values()].flat().join('').replace(/\s/g,''),'local transcript matches official encrypted units');
 const sources=sentenceSources(lesson,paragraphs,sayTexts);let depth=0;
 for(const n of Array.from({length:120},(_,i)=>i+4)){
  const text=paragraphs.get(2)[n],script=sources.get(`script:2:${n}`);assert.equal(script.speaker,lesson.speakers[`2:${n}`]);
  const body=text===script.speaker+'：'?'':text.replace(new RegExp('^'+script.speaker+'：'),'');assert.equal(script.parts.map(p=>p.text).join(''),body,'all original stage/dialogue characters displayed');
  const voiceBody=text===script.speaker+'：'?'':(sayTexts.get(`2:${n}`) || text).replace(new RegExp('^'+script.speaker+'：'),'');
  let expected='';for(const ch of voiceBody){if(ch==='（')depth++;if(!depth)expected+=ch;if(ch==='）')depth--;}
  assert.equal(sources.get(`say:2:${n}`).replace(/\s/g,''),expected.replace(/\s/g,''),'stage directions never spoken, including cross-unit parentheses');
 }
 const bad=structuredClone(lesson);bad.scenes[0].clues[0].refs[0].sha[0]='00000000';await assert.rejects(()=>validateUnlockedLesson(bad,paragraphs));
 console.log('PASS: rabbit official source, full ordered coverage, hashes, stage display and speech omission');
}else console.log('SKIP: local classroom password unavailable; rabbit official hash/source');
// Actual mounted click handlers: wrong card target, synchronous reentry, cancellation,
// paused clicks, and repeated completed items must not advance the operation.
class Element{constructor(tag='div'){this.tagName=tag;this.children=[];this.style={setProperty(k,v){this[k]=v;}};this.dataset={};this.classList={add(){},remove(){},toggle(){}};}append(...xs){for(const x of xs){x.parentElement=this;this.children.push(x);}}setAttribute(){}querySelector(s){return this.children.find(x=>s==='img' && x.tagName==='img') || null;}remove(){}setPointerCapture(){}getBoundingClientRect(){return {left:0,top:0,width:100,height:100};}animate(frames,options){const a={frames,options,cancel(){this.oncancel?.();}};this.animation=a;return a;}}
const saved={document:globalThis.document,Image:globalThis.Image};globalThis.document={createElement:t=>new Element(t),createElementNS:(_,t)=>new Element(t)};globalThis.Image=class extends Element{constructor(){super('img');}};
function setup(scene,reduced=true){const state=operationState(scene),outer=new Element(),host=new Element(),plane=new Element();outer.append(host);host.append(plane);let changes=0,reenter;const ctl=mountOperation(plane,{scene,state,reduced:()=>reduced,changed(){changes++;reenter?.();}});ctl.setPaused(false);return {state,ctl,host,find:id=>plane.children[0].children.find(x=>x.dataset.action===id),reenter:f=>reenter=f,get changes(){return changes;}};}
try{
 for(const scene of lesson.scenes){
  const p=setup(scene);
  for(const [i,id] of scene.operation.steps.entries()){
   const node=p.find(id);p.reenter(()=>node.onclick());
   node.onclick();
   const o=scene.operation.objects.find(o=>o.action===id);
   if(o.gesture==='dragToTarget' || scene.operation.type==='dragToTarget'){
    const target=scene.operation.objects.find(t=>t.target && t.action===(id==='small'?'gap-plan':id==='big'?'key-plan':'lock'));
    if(id==='big'){p.find('gap-plan').onclick();assert.equal(p.state.step,i,'wrong target unchanged');}
    p.find(target.action).onclick();
   }
   assert.equal(p.state.step,i+1);for(let j=0;j<30;j++)node.onclick();assert.equal(p.state.step,i+1,'completed item no-op');
  }
  assert.ok(operationComplete(scene,p.state));assert.equal(p.changes,scene.operation.steps.length);p.ctl.setPaused(true);p.ctl.setPaused(false);assert.equal(operate(scene,p.state,scene.operation.steps[0]),false);p.ctl.dispose();
 }
 // Exercise pointer capture/move/up (not the pure state helper), both directions,
 // wrong target and outside drops, cancellation, compatibility click, consumed cards.
 for(const mode of ['click','drag']){
  const scene=lesson.scenes[3],p=setup(scene);
  const message=()=>p.host.parentElement.children.find(e=>e.className==='fp-operation-status').children[0].textContent;
  const event=(x,y)=>({button:0,pointerId:7,clientX:x,clientY:y,stopPropagation(){}});
  async function release(){await new Promise(resolve=>setTimeout(resolve,0));}
  function drag(id,x,y){const n=p.find(id),o=scene.operation.objects.find(o=>o.action===id);n.onpointerdown(event(o.x,o.y));n.onpointermove(event(x,y));n.onpointerup(event(x,y));n.onclick();}
  for(const [i,id,target,wrong] of [[0,'big','key-plan','gap-plan'],[1,'small','gap-plan','key-plan']]){
   const node=p.find(id),o=scene.operation.objects.find(o=>o.action===id),t=scene.operation.objects.find(o=>o.action===target),w=scene.operation.objects.find(o=>o.action===wrong);
   if(mode==='click'){node.onclick();p.find(wrong).onclick();}
   else drag(id,w.x,w.y);
   assert.equal(p.state.step,i);assert.equal(p.changes,i);assert.equal(message(),scene.operation.retry);
   assert.equal(node.style.left,`${o.x}%`);assert.equal(node.style.top,`${o.y}%`,'wrong match snaps back');
   await release();
   if(mode==='drag'){
    drag(id,2,2);assert.equal(p.state.step,i);assert.equal(message(),scene.operation.retry);await release();
    node.onpointerdown(event(o.x,o.y));node.onpointermove(event(t.x,t.y));node.onpointercancel();
    assert.equal(p.state.step,i);assert.equal(p.ctl.dragging,false);assert.equal(node.style.top,`${o.y}%`);
    drag(id,t.x,t.y);
   }else{node.onclick();p.find(target).onclick();}
   assert.equal(p.state.step,i+1);assert.equal(p.changes,i+1);
   assert.equal(node.disabled,true);
   await release();
   if(i===0)p.find('small').onclick(); // a completed card must not replace this selection
   const before=message();
   for(let j=0;j<20;j++){node.onclick();node.onpointerdown(event(o.x,o.y));}
   assert.equal(p.state.step,i+1);assert.equal(p.changes,i+1);assert.equal(message(),before);assert.equal(p.ctl.dragging,false);
  }
  assert.ok(operationComplete(scene,p.state));p.ctl.dispose();
 }
 for(const [index,id] of [[1,'turn'],[2,'jump-1'],[4,'wave-1']]){
  const p=setup(lesson.scenes[index],false);if(index===4)p.find('pick').onclick();const before=p.state.step,node=p.find(id);node.onclick();for(let j=0;j<20;j++)node.onclick();assert.equal(p.state.step,before,'animation gates rapid clicks');const a=(index===2?p.host:node).animation;if(index===2){assert.equal(a.frames[1].transform,'scale(1.08) translateY(14px)');for(const h of [900,1180,812])assert.ok((1.08-1)*h/2>=1.08*14,'jump camera never exposes an unpainted edge');}a.onfinish();assert.equal(p.state.step,before+1);node.onclick();assert.equal(p.state.step,before+1);p.ctl.dispose();
 }
 const p=setup(lesson.scenes[1],false);p.find('turn').onclick();p.ctl.setPaused(true);assert.equal(p.state.step,0);p.ctl.setPaused(false);p.find('turn').onclick();p.find('turn').animation.onfinish();assert.equal(p.state.step,1);p.ctl.dispose();
}finally{Object.assign(globalThis,saved);}
console.log('PASS: rabbit schema/safety, actual mounted handlers, wrong matching, rapid/repeat taps, animation pause/restore');
const {sceneIllustrationLayout}=await import('../src/activities/firstPersonLayout.js');
for(const scene of [lesson.scenes[3],lesson.scenes[4]])for(const [w,h] of [[1366,900],[820,1180],[375,812]]){
 const pan=scene.art.views[scene.beats.result.view],g=sceneIllustrationLayout(w,h,pan,scene.art,true,scene.beats.result.view),x=g.left+g.imageWidth*.41,r=g.imageWidth*.05;
 assert.ok(x-r>=0 && x+r<=w,'grown/depart result preserves the character face at three sizes');
}
console.log('PASS: grown/depart result face framing at three sizes');
