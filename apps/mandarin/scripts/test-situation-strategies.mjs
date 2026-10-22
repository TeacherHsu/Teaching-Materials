import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import lesson from '../src/data/situationLessons/115AG6H12.js';
import water from '../src/data/situationLessons/115AG3H04.js';
import shoes from '../src/data/situationLessons/115AG4K12.js';
import {strategyTypes,validateSituationLesson,storyUnitKeys} from '../src/data/situationLessons/schema.js';
import {chooseStrategy,predictionReminder,storySummary} from '../src/activities/situation/strategies.js';
import {answerScene,freshProgress} from '../src/activities/firstPersonCore.js';
import {beatLines} from '../src/activities/firstPersonPresentation.js';
assert.deepEqual(strategyTypes,['predict','emotionClue','causeEffect','summaryCard']);
const [a,b,c,d]=lesson.scenes;
const emotion=b.strategies[0],cause=c.strategies[0],predict=d.strategies[1];
for(let i=0;i<3;i++){
 const result=chooseStrategy(predict,i);assert.equal(result.complete,true);assert.ok(!Object.hasOwn(result,'correct'));assert.ok(predictionReminder(predict,i).includes(predict.options[i]));
}
assert.equal(chooseStrategy(predict,-1),null);
let e=chooseStrategy(emotion,1);assert.equal(e.complete,false);e=chooseStrategy(emotion,1,e.selected);assert.deepEqual(e.selected,[1]);e=chooseStrategy(emotion,0,e.selected);assert.equal(e.complete,true);
assert.equal(chooseStrategy(cause,1).complete,false);assert.equal(chooseStrategy(cause,0).complete,true);
for(const scene of lesson.scenes){
 const q=scene.questions[0];assert.equal(q.options.length,3);assert.equal(chooseStrategy({...q,type:'summaryCard'},1).complete,false);assert.match(chooseStrategy({...q,type:'summaryCard'},1).feedback,/這是細節，不是最重要的事/);
 const state={operation:{step:scene.operation.steps.length},found:scene.clues.map(c=>c.id),attempts:0};assert.equal(answerScene(scene,state,q.answer).correct,true);
 for(const file of q.summaryImages)assert.ok(statSync(new URL(`../public/${lesson.assetBase}${file}`,import.meta.url)).size>0);
 for(const entry of scene.timeline.filter(t=>t.kind==='intro'))assert.ok(beatLines(entry.refs).length<=8);
}
const progress=freshProgress(lesson);assert.equal(storySummary(lesson,progress.scenes),'。');progress.scenes.forEach(s=>s.done=true);assert.equal(storySummary(lesson,progress.scenes).split('，').length,8);
assert.equal(lesson.scenes.reduce((n,s)=>n+s.questions.length,0),4);
const coverage=lesson.scenes.flatMap(s=>s.timeline.filter(t=>['intro','read'].includes(t.kind)).flatMap(t=>beatLines(t.refs).map(r=>`${r.para}:${r.n}`)));
assert.deepEqual(coverage,storyUnitKeys(lesson));assert.equal(new Set(coverage).size,141);
assert.deepEqual(a.timeline.slice(0,4).map(t=>[t.kind,t.untilStep]),[['intro',undefined],['act',1],['intro',undefined],['act',undefined]]);
assert.deepEqual(d.timeline.map(t=>t.kind),['intro','openBag','read','strategy','intro','strategy','act','result','read','question']);
assert.deepEqual(d.timeline.filter(t=>['intro','read'].includes(t.kind)).map(t=>[t.refs[0].sentences[0],t.refs[0].sentences.at(-1)]),[[89,91],[92,106],[107,114],[115,141]]);
for(const mutate of [
 l=>l.scenes[0].timeline[0].refs[0].sentences.push(9),
 l=>l.scenes[1].strategies[0].options[0].refs[0].sha[0]='12345678',
 l=>l.scenes[3].strategies[1].answer=0,
 l=>l.scenes[3].strategies[1].options[2]='知道了',
 l=>l.scenes[3].strategies[1].options.push('第四張'),
 l=>l.scenes[3].strategies[0].options[0].x=101,
 l=>l.scenes[0].questions[0].options.push('第四張'),
]){const copy=structuredClone(lesson);mutate(copy);assert.throws(()=>validateSituationLesson(copy));}
for(const old of [water,shoes]){assert.equal(old.scenes.some(s=>s.timeline || s.strategies),false);validateSituationLesson(old);}
const page=readFileSync(new URL('../src/pages/FirstPersonPage.js',import.meta.url),'utf8');assert.match(page,/if\(scene.timeline\)runTimeline\(\);else setBeat\('intro'\)/);assert.ok(d.timeline.slice(0,6).every(t=>t.hideOperations && t.imageIndex===0));assert.equal(d.timeline[6].hideOperations,undefined);
console.log('PASS: four strategies, ungraded prediction, duplicate/multiple clues, retry, four summaries, all intro <=8, 4a/4b evidence order, 141 unique ordered units, source/schema rejection, legacy opt-out');

// Run actual strategy DOM click handlers; native buttons provide Enter/Space activation.
const {mountStrategy}=await import('../src/activities/situation/strategies.js');
class Element {
 constructor(tag='div'){this.dataset={};this.tagName=tag;this.children=[];this.attrs={};this.events={};this.classes=new Set();this.classList={add:n=>this.classes.add(n),remove:n=>this.classes.delete(n),toggle(){}};}
 append(...xs){for(const x of xs){this.children.push(x);x.parent=this;}}appendChild(x){this.append(x);}setAttribute(k,v){this.attrs[k]=v;if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;}addEventListener(k,f){(this.events[k] ||= []).push(f);}removeEventListener(k,f){this.events[k]=(this.events[k] || []).filter(fn=>fn!==f);}
 replaceChildren(...xs){this.children=[];this.append(...xs);}remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);}
 querySelector(selector){return this.children.find(x=>selector==='[data-strategy-next]' && x.attrs?.['data-strategy-next']) || this.children.map(x=>x.querySelector?.(selector)).find(Boolean);}
 click(){for(const f of this.events.click || [])f({target:this});}closest(selector){return selector==='button' && this.tagName==='button'?this:null;}
}
const previousDocument=globalThis.document;globalThis.document={createElement:tag=>new Element(tag),createTextNode:text=>({textContent:text})};
try{
 for(const strategy of [emotion,cause,predict]){
  const panel=new Element(),plane=new Element(),stage=new Element();let completed=0,words=[],focused;
  const dispose=mountStrategy({strategy,panel,plane,stage,states:lesson.meter.states,onWords:w=>words.push(...w),onDone:()=>completed++,focus:x=>focused=x});
  if(strategy.type==='predict'){
   const row=panel.children.at(-1);row.children[2].children[0].click();assert.equal(completed,1);
  }else{
   stage.events.click[0]({target:new Element()});assert.equal(completed,0);
   if(strategy.type==='causeEffect'){plane.children.find(n=>n.tagName==='button' && n.attrs['aria-label']==='南瓜').click();assert.equal(completed,0);plane.children[0].click();assert.ok(plane.children.at(-1).innerHTML.includes('<path'));}
   else{plane.children[0].click();assert.equal(panel.querySelector('[data-strategy-next]'),undefined);plane.children.find(n=>n.tagName==='button' && n.attrs['aria-label']==='布大爺的表情').click();assert.deepEqual(words,['震驚','憤怒又絕望']);assert.ok(plane.children.find(n=>n.dataset.faceIndex==='1').classes.has('is-bright'),'face halo briefly brightens on hit');}
   assert.equal(completed,0);panel.querySelector('[data-strategy-next]').click();assert.equal(completed,1);assert.equal(focused,strategy.options[0].x);
  }
  dispose();assert.equal(plane.children.length,0);assert.equal((stage.events.click || []).length,0);
 }
}finally{globalThis.document=previousDocument;}
console.log('PASS: mounted strategy native-button handlers, background/wrong-target retry, two distinct source emotions, cause line, prediction, continue and cleanup');
const {mountBag}=await import('../src/activities/situation/strategies.js');
globalThis.document={createElement:tag=>new Element(tag),createTextNode:text=>({textContent:text})};
try{
 for(const mode of ['drag','click']){
  const plane=new Element(),panel=new Element();let done=0;
  const dispose=mountBag({entry:d.timeline[1],panel,plane,assetBase:'/',onDone:()=>done++});const bag=plane.children[0];bag.setPointerCapture=()=>{};
  bag.onpointerdown({clientX:0,clientY:0,pointerId:1});bag.onpointercancel();bag.onpointerup({clientX:100,clientY:0});assert.equal(bag.classes.has('is-open'),false);
  if(mode==='drag'){bag.onpointerdown({clientX:0,clientY:0,pointerId:1});bag.onpointerup({clientX:0,clientY:-30});}else bag.onclick();
  assert.equal(bag.classes.has('is-open'),true);assert.equal(bag.children.length,1,'no contents or stems revealed');assert.equal(done,0);panel.children[1].click();assert.equal(done,1);dispose();assert.equal(plane.children.length,0);
 }
}finally{globalThis.document=previousDocument;}
console.log('PASS: bag drag/native click, cancel/retry, no revealed contents, explicit continue and cleanup');
