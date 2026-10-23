import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {homedir} from 'node:os';
import {runInNewContext} from 'node:vm';
import lesson from '../src/data/situationLessons/115AG3H11.js';
import {validateSituationLesson,validateUnlockedLesson,storyUnitKeys} from '../src/data/situationLessons/schema.js';
import {classroomPassword} from './classroom-password.mjs';
import {splitSentences} from '../src/utils/readingUnits.js';
import {sceneIllustrationLayout} from '../src/activities/firstPersonLayout.js';
import {operationState,mountOperation,operationComplete} from '../src/activities/firstPersonInteraction.js';
import {mountStrategy,chooseStrategy} from '../src/activities/situation/strategies.js';
import {sourceCaptionText} from '../src/activities/situation/operations.js';
validateSituationLesson(lesson);
assert.deepEqual(lesson.paragraphCounts,[4,6,6,7,5,5,7,4,2,3]);
const covered=lesson.scenes.flatMap(s=>s.timeline.filter(t=>['intro','read'].includes(t.kind)).flatMap(t=>t.refs.flatMap(r=>r.sentences.map(n=>`${r.para}:${n}`))));
assert.deepEqual(covered,storyUnitKeys(lesson));assert.equal(new Set(covered).size,49);
assert.deepEqual(lesson.scenes.map(s=>s.clues[0].refs.reduce((n,r)=>n+r.sentences.length,0)),[10,13,17,9]);
for(const s of lesson.scenes){
 assert.ok(s.goal.length<=12);assert.equal(s.operation.silentObserve,true);assert.ok(s.operation.objects.every(o=>!o.sourceCaption && !o.target && !o.tool));
 assert.ok(s.operation.protectedRegions.length>0);
 for(const p of s.operation.prompts)assert.ok(p.length<=12);
 for(const t of s.timeline.filter(t=>t.kind==='intro'))assert.ok(t.refs.flatMap(r=>r.sentences).length<=8);
 assert.equal(s.questions[0].operationType,'summaryCard');assert.equal(s.questions[0].summaryImages.length,2);assert.notEqual(...s.questions[0].summaryImages);
 for(const t of s.strategies || []){assert.ok(t.hint.length<=12);if(t.type==='causeEffect'){assert.ok(t.options.length>t.answer.length);for(const o of t.options)assert.notEqual(o.label,t.prompt);assert.equal(chooseStrategy(t,t.answer[0]).complete,true);assert.equal(chooseStrategy(t,t.options.findIndex((_,i)=>!t.answer.includes(i))).complete,false);}}
}
const predict=lesson.scenes[1].strategies[0];assert.ok(predict.options.includes('我不確定'));assert.equal(predict.answer,undefined);assert.ok(predict.options.every(t=>!t.includes('修好')));
const bt=lesson.scenes[1].timeline;assert.ok(bt.findIndex(t=>t.id===predict.id)<bt.findLastIndex(t=>t.kind==='act'));assert.ok(bt.findIndex(t=>t.id===predict.id)<bt.findIndex(t=>t.kind==='result'));
assert.equal(lesson.scenes[2].strategies[0].meterTarget,'媽媽');assert.deepEqual(lesson.scenes[2].strategies[0].options[0].words,['不好意思']);
for(const [p,ns,who] of [[4,[5,6],'爸爸'],[5,[1,2],'修車師傅'],[6,[3,4],'媽媽'],[7,[0,1],'修車師傅'],[7,[4,5,6],'滿屋子的人'],[9,[0],'我們'],[10,[0,2],'滿屋子的人']])for(const n of ns)assert.equal(lesson.speakers[`${p}:${n}`],who);
const password=classroomPassword();
if(password){
 const e=JSON.parse(readFileSync(new URL('../public/data/readings.enc.json',import.meta.url)));const raw=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);const key=await webcrypto.subtle.deriveKey({name:'PBKDF2',salt:Buffer.from(e.salt,'base64'),iterations:e.iter,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,['decrypt']);const rs=JSON.parse(new TextDecoder().decode(await webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(e.iv,'base64')},key,Buffer.from(e.data,'base64'))));const ps=new Map();for(const u of splitSentences(rs[lesson.lessonId].paras)){const p=u.paraIndex+1;if(!ps.has(p))ps.set(p,[]);ps.get(p).push(u.text);}await validateUnlockedLesson(lesson,ps);
 const roots=[homedir()+'/mandarin-work/',homedir()+'/Library/CloudStorage/OneDrive-個人/mandarin-work/'];const local=roots.map(r=>r+'reading-tool-lessons/115HG3A11.json').find(existsSync);assert.ok(local,'official local source exists');assert.equal(JSON.parse(readFileSync(local)).text.replace(/[|\s]/g,''),[...ps.values()].flat().join('').replace(/\s/g,''));
 const bad=structuredClone(lesson);bad.scenes[0].clues[0].refs[0].sha[0]='00000000';await assert.rejects(()=>validateUnlockedLesson(bad,ps));
 const rawSource=readFileSync(new URL('../src/data/situationLessons/115AG3H11.js',import.meta.url),'utf8');for(const ts of ps.values())for(const t of ts)if(t.length>=12)assert.ok(!rawSource.includes(t),'no original sentence in config');
 for(const o of lesson.scenes[3].operation.objects){const words=sourceCaptionText(o.sourceSpeech,({para,n})=>ps.get(para)[n]);assert.ok(words.length>0);assert.ok(!o.sourceCaption);}
}else console.log('SKIP: local classroom password unavailable; encrypted/source checks not run');
// Source-image geometry: check every active hotspot and every correct/distractor
// marker at its actual operation/strategy camera, including the panel's lower 26%.
let visibilityChecks=0;
const sizes=[[1366,900],[820,1180],[375,812],[678,771]];
const panFor=(w,iw,x)=>Math.max(0,Math.min(1,(iw*x/100-w/2)/(iw-w || 1)));
function visible(s,w,h,x,y,focus){const iw=sceneIllustrationLayout(w,h,.5,s.art).imageWidth;const g=sceneIllustrationLayout(w,h,panFor(w,iw,focus),s.art);const px=g.left+g.imageWidth*x/100,py=g.top+g.imageHeight*y/100;assert.ok(px>=22 && px<=w-22,`${s.id}: marker x=${x} at ${w}x${h}`);assert.ok(py>=22 && py+22<=h*.74,`${s.id}: panel-safe y=${y} at ${w}x${h}`);visibilityChecks++;}
for(const s of lesson.scenes)for(const[w,h]of sizes){
 for(const read of [false,true])for(const pan of [0,.5,1]){const g=sceneIllustrationLayout(w,h,pan,s.art,read);assert.ok(g.left<=0 && g.top<=0 && g.left+g.imageWidth>=w-1e-8 && g.top+g.imageHeight>=h,'full cover');}
 for(const [i,o]of s.operation.objects.entries())visible(s,w,h,o.x,o.y,s.operation.focus[i]);
 for(const t of s.strategies || [])if(t.type!=='predict')for(const focus of [t.focus ?? t.options[0].x,...t.options.map(o=>t.focus ?? o.x)])for(const o of t.options){const[dx,dy]=o.markerOffset || [0,0];visible(s,w,h,o.x+dx,o.y+dy,focus);if(o.face)assert.ok(Math.abs(dx)>=o.face.width/2+1,'marker beside face');}
}
// Actual mounted handlers exercise synchronous reentry, queued rapid clicks,
// already-complete no-op, pause and persisted state without a browser.
class Element{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.style={setProperty(k,v){this[k]=v;}};this.dataset={};this.attrs={};this.events={};this.classes=new Set();this.classList={add:n=>this.classes.add(n),remove:n=>this.classes.delete(n),toggle(){}};}
 append(...xs){for(const x of xs){x.parentElement=this;this.children.push(x);}}appendChild(x){this.append(x);}prepend(x){x.parentElement=this;this.children.unshift(x);}setAttribute(k,v){this.attrs[k]=v;if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;}
 addEventListener(k,f){(this.events[k] ||= []).push(f);}removeEventListener(k,f){this.events[k]=(this.events[k] || []).filter(fn=>fn!==f);}replaceChildren(...xs){this.children=[];this.append(...xs);}remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(x=>x!==this);}setPointerCapture(){}getBoundingClientRect(){return{left:0,top:0,width:100,height:100};}
 querySelector(s){return this.children.find(x=>s==='img' && x.tagName==='img' || s==='[data-strategy-next]' && x.attrs?.['data-strategy-next']) || this.children.map(x=>x.querySelector?.(s)).find(Boolean) || null;}
 closest(s){return s==='button' && this.tagName==='button'?this:null;}click(){this.onclick?.();for(const f of this.events.click || [])f({target:this});}
}
const saved={document:globalThis.document,Image:globalThis.Image};globalThis.document={createElement:t=>new Element(t),createElementNS:(_,t)=>new Element(t),createTextNode:t=>({textContent:t})};globalThis.Image=class extends Element{constructor(){super('img');}};
try{
 for(const s of lesson.scenes){
  const state=operationState(s),outer=new Element(),host=new Element(),plane=new Element();outer.append(host);host.append(plane);let changes=0,reenter;const ctl=mountOperation(plane,{scene:s,state,reduced:()=>true,changed(){changes++;reenter?.();},sourceText:()=>''});const find=id=>plane.children[0].children.find(n=>n.dataset.action===id);
  find(s.operation.steps[0]).onclick();assert.equal(state.step,0,'initially paused');ctl.setPaused(false);
  if(s.operation.steps.length>1){find(s.operation.steps[1]).onclick();assert.equal(state.step,0,'wrong order stays');}
  for(const id of s.operation.steps){const n=find(id);reenter=()=>n.onclick();n.onclick();const step=state.step;for(let i=0;i<30;i++)n.onclick();assert.equal(state.step,step,'completed no-op');assert.equal(n.disabled,true);}
  assert.ok(operationComplete(s,state));assert.equal(changes,s.operation.steps.length);assert.equal(operationState(s,state).step,s.operation.steps.length);ctl.setPaused(true);find(s.operation.steps[0]).onclick();assert.equal(changes,s.operation.steps.length);ctl.dispose();
 }
 // Verify real sourceSpeech dispatch, Taiwan language and repeat no-op.
 {const before={window:globalThis.window,SpeechSynthesisUtterance:globalThis.SpeechSynthesisUtterance},spoken=[];
  globalThis.window={speechSynthesis:{cancel(){},getVoices:()=>[],speak(u){spoken.push(u);u.onend?.();}}};globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  try{const scene=lesson.scenes[3],state=operationState(scene),outer=new Element(),host=new Element(),plane=new Element();outer.append(host);host.append(plane);const ctl=mountOperation(plane,{scene,state,reduced:()=>true,changed(){},sourceText:()=> '測試祝福'});ctl.setPaused(false);for(const id of scene.operation.steps){const n=plane.children[0].children.find(n=>n.dataset.action===id);for(let i=0;i<25;i++)n.onclick();}assert.equal(spoken.length,2);assert.ok(spoken.every(u=>u.lang==='zh-TW' && u.text==='測試祝福'));ctl.dispose();}finally{Object.assign(globalThis,before);}
 }
 for(const s of lesson.scenes)for(const t of s.strategies || []){
  const plane=new Element(),panel=new Element(),stage=new Element();let done=0,focused,words=[];const dispose=mountStrategy({strategy:t,panel,plane,stage,states:lesson.meter.states,onWords:w=>words.push(...w),onDone:()=>done++,focus:x=>focused=x});
  if(t.type==='predict'){const n=panel.children.at(-1).children[2].children[0];for(let i=0;i<20;i++)n.click();assert.equal(done,1);}
  else{const wrong=t.options.findIndex((_,i)=>!t.answer.includes(i));if(wrong>=0)plane.children.find(n=>n.attrs?.['aria-label']===t.options[wrong].label).click();assert.equal(done,0);for(const i of t.answer){const n=plane.children.find(n=>n.attrs?.['aria-label']===t.options[i].label);n.click();const count=plane.children.length;for(let j=0;j<25;j++)n.click();assert.equal(plane.children.length,count);}if(t.type==='emotionClue'){assert.deepEqual(words,['不好意思']);assert.equal(focused,t.focus);}const next=panel.querySelector('[data-strategy-next]');assert.ok(next);for(let i=0;i<20;i++)next.click();assert.equal(done,1);}
  dispose();assert.equal(plane.children.length,0,'no leftover cause lines/markers');
 }
}finally{Object.assign(globalThis,saved);}
const warning='車子故障時，小朋友留在安全的地方，讓大人處理。';assert.equal(JSON.stringify(lesson).split(warning).length-1,1);assert.equal(lesson.safetyReminderCount,1);assert.deepEqual(lesson.scenes.filter(s=>s.beats.result.safetyReminder).map(s=>s.act),[2]);
// Execute the real page scheduler: replay/re-entry schedules no second reminder.
const page=readFileSync(new URL('../src/pages/FirstPersonPage.js',import.meta.url),'utf8');const scheduler=page.slice(page.indexOf('function scheduleResult(){'),page.indexOf('  function setBeat(value)'));
const timers=[],context={scene:lesson.scenes[1],disposed:false,beat:'result',resultWarningShown:false,safetyRemindersShown:new Set(),beatTimer:0,setTimeout(fn){timers.push(fn);return timers.length;},rootBody:{append(){context.reminders++;}},reminders:0,h:()=>({}),say:()=>({}),finishBeat(){context.finished++;},finished:0};runInNewContext(scheduler+';this.run=scheduleResult;',context);context.run();timers.shift()();timers.shift()();context.resultWarningShown=context.safetyRemindersShown.has(context.scene.id);context.run();timers.shift()();assert.equal(context.reminders,1);assert.equal(context.finished,2);assert.match(page,/resultWarningShown=safetyRemindersShown.has\(scene.id\);scheduleResult\(\)/);
for(const mutate of [l=>l.safetyReminderCount=2,l=>l.scenes[2].strategies[0].focus=101,l=>l.scenes[3].operation.objects[0].sourceSpeech.refs=[],l=>l.scenes[1].timeline.reverse()]){const bad=structuredClone(lesson);mutate(bad);assert.throws(()=>validateSituationLesson(bad));}
const files=new Set(lesson.scenes.flatMap(s=>[...s.art.images,...Object.values(s.art.expressionOverlays || {}),...s.questions.flatMap(q=>q.summaryImages || []),...s.operation.objects.filter(o=>o.sprite).map(o=>'sprites/'+o.sprite+'.webp')]));for(const f of files){const p=new URL('../public/'+lesson.assetBase+f,import.meta.url);assert.ok(statSync(p).size<=(f.startsWith('sprites/') || f==='mother-apology.webp'?120:300)*1024,f);}
assert.match(page,/pick.disabled=place>=0/);assert.match(page,/第\$\{place\+1\}排序格已填好/);assert.equal(lesson.scenes[3].questions[1].lockOrderSelections,true);
assert.match(readFileSync(new URL('../src/utils/speech.js',import.meta.url),'utf8'),/utter.lang = 'zh-TW'/);
console.log(`PASS: journey 49 ordered official units/hash, speakers, strategies, source speech, mounted rapid/repeat/pause, ${visibilityChecks} viewport markers, cover, safety scheduler exactly once and assets`);
