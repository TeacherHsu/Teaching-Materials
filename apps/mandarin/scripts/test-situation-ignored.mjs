import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {homedir} from 'node:os';
import lesson from '../src/data/situationLessons/115AG6H02.js';
import {validateSituationLesson,validateUnlockedLesson,storyUnitKeys} from '../src/data/situationLessons/schema.js';
import {classroomPassword} from './classroom-password.mjs';
import {splitSentences} from '../src/utils/readingUnits.js';
import {sceneIllustrationLayout} from '../src/activities/firstPersonLayout.js';
import {operationState,mountOperation,operationComplete} from '../src/activities/firstPersonInteraction.js';
import {mountStrategy,chooseStrategy,appendOrderSupport} from '../src/activities/situation/strategies.js';
import {answerScene} from '../src/activities/firstPersonCore.js';
validateSituationLesson(lesson);
assert.deepEqual(lesson.paragraphCounts,[134]);assert.deepEqual(lesson.excludedUnits,[{para:1,sentences:[0,133]}]);
const covered=lesson.scenes.flatMap(s=>s.timeline.filter(t=>['intro','read'].includes(t.kind)).flatMap(t=>t.refs.flatMap(r=>r.sentences.map(n=>`${r.para}:${n}`))));
assert.deepEqual(covered,storyUnitKeys(lesson));assert.equal(new Set(covered).size,132);
assert.deepEqual(lesson.scenes.map(s=>s.clues[0].refs.reduce((n,r)=>n+r.sentences.length,0)),[32,33,31,16,20]);
assert.match(lesson.introduction,/這是爸爸小時候的故事/);assert.match(lesson.ending.title,/這是爸爸小時候的故事/);
assert.equal(lesson.scenes[0].art.images[0],'letter.webp');assert.equal(lesson.scenes[4].art.images[0],'letter.webp');
for(const s of lesson.scenes){
 assert.ok(s.goal.length<=12);assert.equal(s.operation.silentObserve,true);assert.ok(s.operation.objects.every(o=>!o.sourceCaption));
 for(const p of s.operation.prompts)assert.ok(p.length<=12);
 for(const o of s.operation.objects)assert.doesNotMatch(o.label,/趕走|冷落|嘲笑|不理別人|揮手叫/,'no exclusion action');
 for(const t of s.timeline.filter(t=>t.kind==='intro'))assert.ok(t.refs.flatMap(r=>r.sentences).length<=8);
 const beforeAct=s.timeline.slice(0,s.timeline.findIndex(t=>t.kind==='act')).filter(t=>['intro','read'].includes(t.kind)).flatMap(t=>t.refs.flatMap(r=>r.sentences));assert.ok(beforeAct.length<=8,'actual opening, including any read before first action');
 for(const t of s.timeline.filter(t=>['intro','read'].includes(t.kind)))assert.ok(Number.isInteger(t.imageIndex),'fixed artwork during inserted reading');
 assert.equal(s.questions[0].operationType,'summaryCard');assert.equal(s.questions[0].summaryImages.length,3);assert.equal(new Set(s.questions[0].summaryImages).size,3);
 for(const t of s.strategies){assert.ok(t.prompt.length<=12);assert.ok(t.hint.length<=12);if(t.type==='causeEffect'){assert.ok(t.options.length>t.answer.length);for(const o of t.options)assert.notEqual(o.label,t.prompt);assert.equal(chooseStrategy(t,t.answer[0]).complete,true);assert.equal(chooseStrategy(t,t.options.findIndex((_,i)=>!t.answer.includes(i))).complete,false);}}
}
const predict=lesson.scenes[0].strategies[0];assert.ok(predict.options.includes('我不確定'));assert.equal(predict.answer,undefined);assert.ok(predict.options.every(t=>!/不想看|冷淡|開刀|不理/.test(t)));
const metaphor=lesson.scenes[1].strategies[0];assert.equal(metaphor.type,'emotionClue');assert.deepEqual(metaphor.answer,[0,1]);assert.ok(metaphor.options.every(o=>o.presentation==='picture' && o.sprite && o.states[0]===2));
const third=lesson.scenes[2];assert.equal(third.strategies[0].options[0].label,'為了出氣');
const correction=third.timeline.find(t=>t.kind==='read' && t.refs[0].sentences.includes(76));assert.deepEqual(correction.refs[0].sentences,[72,73,74,75,76,77,78,79,80]);
const attribution=lesson.scenes[3].strategies[0];assert.equal(attribution.options[attribution.answer[0]].label,'母親開刀，他很擔憂');assert.match(lesson.scenes[3].questions[0].options[0],/想到別人的難處/);
assert.ok(lesson.scenes.flatMap(s=>s.questions).every(q=>q.options.every(o=>!/回家去吧|我做錯了/.test(o))));
for(const [a,b,who] of [[4,4,'櫻櫻'],[35,36,'我'],[41,41,'許達三'],[63,63,'我'],[69,69,'陳文虎'],[72,72,'我心裡'],[76,78,'我心裡'],[96,96,'我'],[100,103,'許達三']])for(let n=a;n<=b;n++)assert.equal(lesson.speakers[`1:${n}`],who);
const password=classroomPassword();
if(password){
 const e=JSON.parse(readFileSync(new URL('../public/data/readings.enc.json',import.meta.url)));const raw=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);const key=await webcrypto.subtle.deriveKey({name:'PBKDF2',salt:Buffer.from(e.salt,'base64'),iterations:e.iter,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,['decrypt']);const rs=JSON.parse(new TextDecoder().decode(await webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(e.iv,'base64')},key,Buffer.from(e.data,'base64'))));const ps=new Map();for(const u of splitSentences(rs[lesson.lessonId].paras)){const p=u.paraIndex+1;if(!ps.has(p))ps.set(p,[]);ps.get(p).push(u.text);}await validateUnlockedLesson(lesson,ps);
 const roots=[homedir()+'/mandarin-work/',homedir()+'/Library/CloudStorage/OneDrive-個人/mandarin-work/'];const local=roots.map(r=>r+'reading-tool-lessons/115HG6A02.json').find(existsSync);assert.ok(local,'official local source exists');assert.equal(JSON.parse(readFileSync(local)).text.replace(/[|\s]/g,''),[...ps.values()].flat().join('').replace(/\s/g,''));
 const bad=structuredClone(lesson);bad.scenes[0].clues[0].refs[0].sha[0]='00000000';await assert.rejects(()=>validateUnlockedLesson(bad,ps));
 const rawSource=readFileSync(new URL('../src/data/situationLessons/115AG6H02.js',import.meta.url),'utf8');for(const ts of ps.values())for(const t of ts)if(t.length>=12)assert.ok(!rawSource.includes(t),'no original sentence in config');
}else console.log('SKIP: local classroom password unavailable; encrypted/source checks not run');
let visibilityChecks=0;
const sizes=[[1366,900],[820,1180],[375,812],[678,771]];
const panFor=(w,iw,x)=>Math.max(0,Math.min(1,(iw*x/100-w/2)/(iw-w || 1)));
function geometry(s,w,h,focus){const iw=sceneIllustrationLayout(w,h,.5,s.art).imageWidth;return sceneIllustrationLayout(w,h,panFor(w,iw,focus),s.art);}
function visible(s,w,h,x,y,focus,width=0,ratio=1){const g=geometry(s,w,h,focus),hw=Math.max(22,g.imageWidth*width/200),hh=Math.max(22,g.imageWidth*width*ratio/200);const px=g.left+g.imageWidth*x/100,py=g.top+g.imageHeight*y/100;assert.ok(px-hw>=0 && px+hw<=w,`${s.id}: x=${x} at ${w}x${h}`);assert.ok(py-hh>=0 && py+hh<=h*.74,`${s.id}: panel-safe y=${y} at ${w}x${h}`);visibilityChecks++;}
for(const s of lesson.scenes)for(const[w,h]of sizes){
 for(const read of [false,true])for(const pan of [0,.5,1]){const g=sceneIllustrationLayout(w,h,pan,s.art,read);assert.ok(g.left<=0 && g.top<=0 && g.left+g.imageWidth>=w-1e-8 && g.top+g.imageHeight>=h,'full cover');}
 for(let step=0;step<s.operation.steps.length;step++)for(const o of s.operation.objects.filter(o=>step>=(o.fromStep??0) && step<=(o.toStep??99)))visible(s,w,h,o.x,o.y,s.operation.focus[step],o.width,o.ratio);
 for(const t of s.strategies)if(t.type!=='predict')for(const focus of [t.focus,...t.options.map(o=>t.focus ?? o.x)])for(const o of t.options){const[dx,dy]=o.markerOffset || [0,0];visible(s,w,h,o.x+dx,o.y+dy,focus);if(o.sprite)visible(s,w,h,o.x,o.y,focus,o.width,o.presentation==='picture'?1:1);if(o.face)assert.ok(Math.abs(dx)>=o.face.width/2+1,'marker beside face');}
}
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
  for(const id of s.operation.steps){const n=find(id);if(s.act===1){const event=(x,y)=>({pointerId:1,button:0,clientX:x,clientY:y,stopPropagation(){}});n.onpointerdown(event(45,56));n.onpointerup(event(30,30));assert.equal(state.step,0,'wrong drop rejected');await new Promise(r=>setTimeout(r,1));n.onpointerdown(event(45,56));n.onpointercancel();assert.equal(state.step,0,'cancel rejected');n.onclick();reenter=()=>n.onclick();find('desk').onclick();}else{reenter=()=>n.onclick();n.onclick();}const step=state.step;for(let i=0;i<30;i++)n.onclick();assert.equal(state.step,step,'completed no-op');assert.equal(n.disabled,true);}
  assert.ok(operationComplete(s,state));assert.equal(changes,s.operation.steps.length);assert.equal(operationState(s,state).step,s.operation.steps.length);assert.ok(plane.children[0].children.filter(n=>n.dataset.dragGuide || n.dataset.region).every(n=>n.hidden),'no drag guide after completion');ctl.setPaused(true);find(s.operation.steps[0]).onclick();assert.equal(changes,s.operation.steps.length);ctl.dispose();
 }
 for(const s of lesson.scenes)for(const t of s.strategies){
  const plane=new Element(),panel=new Element(),stage=new Element();let done=0,words=[];const dispose=mountStrategy({strategy:t,panel,plane,stage,states:lesson.meter.states,onWords:w=>words.push(...w),onDone:()=>done++,focus(){},assetBase:lesson.assetBase});
  if(t.type==='predict'){const n=panel.children.at(-1).children[2].children[0];for(let i=0;i<20;i++)n.click();assert.equal(done,1);}
  else{const wrong=t.options.findIndex((_,i)=>!t.answer.includes(i));if(wrong>=0)plane.children.find(n=>n.attrs?.['aria-label']===t.options[wrong].label).click();assert.equal(done,0);for(const i of t.answer){const n=plane.children.find(n=>n.attrs?.['aria-label']===t.options[i].label);if(t.type==='emotionClue'){assert.equal(n.children[0].tagName,'img');assert.equal(n.children.length,1,'wordless image card');}n.click();const count=plane.children.length;for(let j=0;j<25;j++)n.click();assert.equal(plane.children.length,count);}if(t.type==='emotionClue')assert.deepEqual(words,['很害怕','很害怕']);const next=panel.querySelector('[data-strategy-next]');assert.ok(next);for(let i=0;i<20;i++)next.click();assert.equal(done,1);}
  dispose();assert.equal(plane.children.length,0,'no leftover lines/markers');
 }
 const s=lesson.scenes.at(-1),q=s.questions[1],state={operation:operationState(s,{step:1}),found:['evidence'],questionIndex:0,attempts:0,done:false};const host=new Element(),shown=new Set();
 assert.equal(appendOrderSupport({question:q,done:false,shown,host}),false);
 assert.equal(answerScene(s,state,s.questions[0].answer).correct,true);assert.equal(state.done,false);assert.equal(host.children.length,0);
 assert.equal(appendOrderSupport({question:s.questions[0],done:true,shown,host}),false);
 assert.equal(answerScene(s,state,q.answer).correct,true);assert.equal(state.done,true);
 for(let i=0;i<30;i++)appendOrderSupport({question:q,done:state.done,shown,host});assert.equal(host.children.length,1,'support exactly once after order');
 const replayHost=new Element();appendOrderSupport({question:q,done:true,shown,host:replayHost});assert.equal(replayHost.children.length,0,'replay does not repeat support');
}finally{Object.assign(globalThis,saved);}
const support='如果你在學校也覺得被冷落，可以找信任的大人說說，例如家人、導師或輔導老師。';assert.equal(JSON.stringify(lesson).split(support).length-1,1);
for(const mutate of [l=>l.scenes[0].questions[0].afterOrderSupport='錯置',l=>l.scenes[1].strategies[0].options[0].presentation='text',l=>l.scenes[1].strategies[0].options[0].sprite='',l=>l.scenes[1].timeline.reverse()]){const bad=structuredClone(lesson);mutate(bad);assert.throws(()=>validateSituationLesson(bad));}
const files=new Set(lesson.scenes.flatMap(s=>[...s.art.images,...Object.values(s.art.expressionStates || {}).flatMap(Object.values),...s.questions.flatMap(q=>q.summaryImages || []),...s.operation.objects.filter(o=>o.sprite).map(o=>'sprites/'+o.sprite+'.webp'),...s.strategies.flatMap(t=>t.options.filter(o=>o.sprite).map(o=>'sprites/'+o.sprite+'.webp'))]));for(const f of files){const p=new URL('../public/'+lesson.assetBase+f,import.meta.url);assert.ok(statSync(p).size<=(f.startsWith('sprites/') || f==='xu-worry.webp'?120:300)*1024,f);}
const page=readFileSync(new URL('../src/pages/FirstPersonPage.js',import.meta.url),'utf8');assert.match(page,/appendOrderSupport\(\{question:q,done:state.done/);assert.match(page,/pick.disabled=place>=0/);assert.match(page,/第\$\{place\+1\}排序格已填好/);assert.equal(lesson.scenes[4].questions[1].lockOrderSelections,true);
assert.match(readFileSync(new URL('../src/utils/speech.js',import.meta.url),'utf8'),/utter.lang = 'zh-TW'/);
console.log(`PASS: ignored 132 ordered official units/hash, speakers, five acts, metaphor picture handlers, safe attribution, rapid/repeat/pause, ${visibilityChecks} viewport checks, cover, support exactly once after order and assets`);
