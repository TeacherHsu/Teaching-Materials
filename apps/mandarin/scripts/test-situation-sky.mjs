import assert from 'node:assert/strict';
import {readFileSync,statSync,existsSync} from 'node:fs';import {webcrypto} from 'node:crypto';import {homedir} from 'node:os';
import lesson from '../src/data/situationLessons/115AG2H02.js';
import {validateSituationLesson,validateUnlockedLesson,storyUnitKeys} from '../src/data/situationLessons/schema.js';
import {splitSentences} from '../src/utils/readingUnits.js';import {classroomPassword} from './classroom-password.mjs';
import {operationState,mountOperation,operationComplete,operate} from '../src/activities/firstPersonInteraction.js';
import {sceneIllustrationLayout} from '../src/activities/firstPersonLayout.js';
import {sourceCaptionText} from '../src/activities/situation/operations.js';
assert.equal(sourceCaptionText({refs:[{para:3,sentences:[6]}]},r=>r.para===3 && r.n===6?'「測試文字！」':''),'測試文字！');
assert.equal(sourceCaptionText({refs:[{para:3,sentences:[6]}]}), '');
const page=readFileSync(new URL('../src/pages/FirstPersonPage.js',import.meta.url),'utf8');assert.ok(page.includes('pick.disabled=place>=0'));assert.ok(page.includes('第${place+1}排序格已填好'));
assert.equal(lesson.scenes[3].questions[1].lockOrderSelections,true);
validateSituationLesson(lesson);assert.deepEqual(lesson.paragraphCounts,[6,6,7,4]);assert.equal(lesson.sentenceCount,23);assert.equal(storyUnitKeys(lesson).length,22);assert.equal(lesson.meter.title,'我的心情');
assert.deepEqual(lesson.scenes.map(s=>[...s.beats.intro,...s.beats.read].flatMap(r=>r.sentences).length),[5,6,7,4]);
for(const s of lesson.scenes){
 assert.ok(s.goal.length<=8);for(const p of s.operation.prompts || [])assert.ok(p.length<=8);assert.ok(s.operation.retry===undefined || s.operation.retry.length<=8);
 for(const b of s.timeline.filter(b=>b.kind==='intro'))assert.ok(b.refs.flatMap(r=>r.sentences).length<=8);
 const q=s.questions[0];assert.equal(q.type,'summaryCard');assert.equal(q.options.length,2);assert.equal(q.summaryImages.length,2);assert.ok(q.options.every(x=>/^\p{Extended_Pictographic}/u.test(x)));
 const names=s.operation.objects.map(o=>o.label);assert.equal(new Set(names).size,names.length);
 for(const f of [...s.art.images,...Object.values(s.art.expressionOverlays || {}),...Object.values(s.art.expressionStates || {}).flatMap(Object.values),...s.operation.objects.filter(o=>o.sprite).map(o=>'sprites/'+o.sprite+'.webp')])assert.ok(statSync(new URL('../public/'+lesson.assetBase+f,import.meta.url)).size<=(f.startsWith('sprites/') || f.includes('overlay')?120:400)*1024,f);
 for(const [w,h] of [[1366,900],[820,1180],[375,812]])for(const pan of [0,.25,.5,.75,1])for(const read of [false,true]){const g=sceneIllustrationLayout(w,h,pan,s.art,read);assert.ok(g.left<=.01 && g.top<=.01 && g.left+g.imageWidth>=w-.01 && g.top+g.imageHeight>=h-.01,'full cover');}
}
const broken=structuredClone(lesson);broken.scenes[0].timeline[0].refs[0].sentences.reverse();assert.throws(()=>validateSituationLesson(broken));
const wrongHash=structuredClone(lesson);wrongHash.scenes[0].beats.intro[0].sha[0]='00000000';assert.throws(()=>validateSituationLesson(wrongHash));
const invalidCount=structuredClone(lesson);invalidCount.summaryCardCount=1;assert.throws(()=>validateSituationLesson(invalidCount));
const pred=lesson.scenes[2];assert.ok(pred.timeline.findIndex(b=>b.kind==='strategy')<pred.timeline.findIndex(b=>b.kind==='act'));assert.equal(pred.strategies[0].answer,undefined);assert.ok(!pred.strategies[0].options.some(x=>/新希望|快樂學習/.test(x)));
const cause=lesson.scenes[1].strategies[1];assert.ok(cause.answer.length>=1 && cause.options.length>cause.answer.length);assert.ok(cause.options.every(o=>o.label!==cause.prompt));
assert.equal(lesson.scenes[3].operation.showOnStrategy,true);assert.equal(lesson.review.length,0);
const password=classroomPassword();if(password){
 const e=JSON.parse(readFileSync(new URL('../public/data/readings.enc.json',import.meta.url)));const raw=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);const key=await webcrypto.subtle.deriveKey({name:'PBKDF2',salt:Buffer.from(e.salt,'base64'),iterations:e.iter,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,['decrypt']);const readings=JSON.parse(new TextDecoder().decode(await webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(e.iv,'base64')},key,Buffer.from(e.data,'base64'))));
 const paragraphs=new Map();for(const u of splitSentences(readings[lesson.lessonId].paras)){const p=u.paraIndex+1;if(!paragraphs.has(p))paragraphs.set(p,[]);paragraphs.get(p).push(u.text);}await validateUnlockedLesson(lesson,paragraphs);
 const sourceFile=homedir()+'/mandarin-work/reading-tool-lessons/115HG2A02.json';if(existsSync(sourceFile)){const source=JSON.parse(readFileSync(sourceFile)).text.replace(/[|\s]/g,'');assert.equal(source,[...paragraphs.values()].flat().join('').replace(/\s/g,''),'local source matches encrypted units');}
 const bad=structuredClone(lesson);for(const s of bad.scenes)for(const r of s.clues[0].refs)if(r.para===1 && r.sentences.includes(1))r.sha[r.sentences.indexOf(1)]='00000000';await assert.rejects(()=>validateUnlockedLesson(bad,paragraphs));
}else console.log('SKIP: no local classroom password; official king hash/source unavailable');
class Element{constructor(tag='div'){this.tagName=tag;this.children=[];this.attrs={};this.style={setProperty(k,v){this[k]=v;}};this.dataset={};this.classList={add(){},remove(){},toggle(){}};}append(...xs){for(const x of xs){x.parentElement=this;this.children.push(x);}}setAttribute(k,v){this.attrs[k]=v;}querySelector(s){return this.children.find(x=>s==='img' && x.tagName==='img') || null;}remove(){}setPointerCapture(){}getBoundingClientRect(){return {left:0,top:0,width:100,height:100};}}
const saved={document:globalThis.document,Image:globalThis.Image};globalThis.document={createElement:t=>new Element(t),createElementNS:(_,t)=>new Element(t)};globalThis.Image=class extends Element{constructor(){super('img');}};
function setup(scene,raw){const state=operationState(scene,raw),outer=new Element(),host=new Element(),plane=new Element();outer.append(host);host.append(plane);let changes=0,reenter;const ctl=mountOperation(plane,{scene,state,sourceText:()=>'「測試文字！」',reduced:()=>true,changed(){changes++;reenter?.();}});ctl.setPaused(false);return {state,ctl,layer:plane.children[0],find:id=>plane.children[0].children.find(x=>x.dataset.action===id),setReenter:f=>reenter=f,get changes(){return changes;}};}
try{
 for(const scene of lesson.scenes){
 const p=setup(scene);for(const action of scene.operation.steps){const n=p.find(action),spec=scene.operation.objects.find(o=>o.action===action);p.setReenter(()=>n.onclick());n.onclick();if(scene.operation.type==='dragToTarget'){const t=scene.operation.objects.find(o=>o.target && (o.region || 'target')===(spec.region || 'target'));p.find(t.action).onclick();assert.equal(p.find(t.action).disabled,true,'filled target disabled');}
 const step=p.state.step;for(let j=0;j<25;j++)n.onclick();assert.equal(p.state.step,step,'repeat is no-op');}
 assert.equal(p.changes,scene.operation.steps.length,'reentry does not double count');for(const e of p.layer.children.filter(e=>e.tagName==='svg'))for(const path of e.children)assert.ok(!path.attrs.d,'completed drag line cleared');assert.ok(operationComplete(scene,p.state));
 for(const m of p.layer.children.filter(x=>x.dataset.dragGuide || x.dataset.region))assert.equal(m.hidden,true,'completed guides hidden');
 const restored=operationState(scene,p.state);assert.ok(operationComplete(scene,restored));assert.equal(operate(scene,restored,scene.operation.steps[0]),false);p.ctl.dispose();
 }
 const p=setup(lesson.scenes[3]);const n=p.find('cloud');const ev=(x,y)=>({button:0,pointerId:1,clientX:x,clientY:y,stopPropagation(){}});n.onpointerdown(ev(50,79));n.onpointerup(ev(10,65));assert.equal(p.state.step,0,'outside target');n.onpointerdown(ev(50,79));n.onpointercancel();assert.equal(p.state.step,0,'cancel');n.onpointerdown(ev(50,79));n.onpointerup(ev(53,24));assert.equal(p.state.step,1,'correct hook');n.onclick();assert.equal(p.state.step,1);p.ctl.dispose();
 const paused=setup(lesson.scenes[0]);paused.ctl.setPaused(true);paused.find('look').onclick();assert.equal(paused.state.step,0);paused.ctl.dispose();
 const card=setup(lesson.scenes[2]);const caption=card.find('card').children.find(e=>e.className==='fp-source-caption');assert.equal(caption.hidden,true);card.find('write').onclick();assert.equal(caption.hidden,true,'must wave back first');card.find('wave-left').onclick();card.find('wave-left').onclick();card.find('wave-right').onclick();assert.equal(card.state.step,2);card.find('write').onclick();assert.equal(caption.hidden,false);assert.equal(caption.textContent,'測試文字！');card.ctl.dispose();
}finally{Object.assign(globalThis,saved);}
console.log('PASS: sky official ordered source/hash, two-card summaries, short prompts, cover, rapid/reentrant/repeat/pause/cancel/restore, filled target and cleared guides');
