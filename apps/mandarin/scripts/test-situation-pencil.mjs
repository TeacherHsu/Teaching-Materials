import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {homedir} from 'node:os';
import lesson from '../src/data/situationLessons/115AG3H06.js';
import {validateSituationLesson,validateUnlockedLesson,storyUnitKeys} from '../src/data/situationLessons/schema.js';
import {splitSentences} from '../src/utils/readingUnits.js';
import {classroomPassword} from './classroom-password.mjs';
import {sceneIllustrationLayout} from '../src/activities/firstPersonLayout.js';
import {operationState,mountOperation,operationComplete,operate} from '../src/activities/firstPersonInteraction.js';
import {meterRevealed,sentenceSources} from '../src/activities/firstPersonPresentation.js';
import {mountStrategy,chooseStrategy} from '../src/activities/situation/strategies.js';
validateSituationLesson(lesson);
assert.deepEqual(lesson.paragraphCounts,[2,4,1,7,12,1,5,5,3]);
assert.equal(lesson.sentenceCount,40);assert.equal(lesson.storySentenceCount,38);
assert.deepEqual(lesson.excludedUnits,[{para:3,sentences:[0]},{para:6,sentences:[0]}]);
const covered=lesson.scenes.flatMap(s=>s.timeline.filter(t=>['intro','read'].includes(t.kind)).flatMap(t=>t.refs.flatMap(r=>r.sentences.map(n=>`${r.para}:${n}`))));
assert.deepEqual(covered,storyUnitKeys(lesson));assert.equal(new Set(covered).size,38);
assert.ok(!covered.includes('3:0') && !covered.includes('6:0'),'subheadings never read');
assert.deepEqual(lesson.scenes.map(s=>s.clues[0].refs.reduce((n,r)=>n+r.sentences.length,0)),[6,7,7,18]);
assert.equal(lesson.meter.title,'鉛筆變身進度');assert.equal(lesson.meter.subject,'鉛筆');
assert.deepEqual(lesson.meter.labels,['石墨和黏土','光滑、油亮的筆芯','筆芯三明治','一枝枝的筆桿','閃亮亮的鉛筆']);
for(const s of lesson.scenes){
 assert.ok(s.goal.length<=12);assert.ok(s.operation.prompts.every(t=>t.length<=12));assert.equal(s.operation.silentObserve,true);
 assert.ok(s.operation.objects.every(o=>!o.sourceCaption && !o.sourceSpeech && o.observation===''));
 assert.equal(s.questions[0].operationType,'summaryCard');assert.equal(s.questions[0].summaryImages.length,2);assert.notEqual(...s.questions[0].summaryImages);
 for(const t of s.timeline.filter(t=>t.kind==='intro'))assert.ok(t.refs.flatMap(r=>r.sentences).length<=8);
 for(const [i,t]of s.timeline.entries())if(t.kind==='read' && s.timeline.slice(i+1).some(t=>t.kind==='act'))assert.ok(Number.isInteger(t.imageIndex),'interleaved read fixes current illustration');
}
assert.ok(Object.values(lesson.speakers).every(s=>s===''),'no dialogue speakers');
assert.equal(meterRevealed(lesson.scenes[0],[]),false);assert.equal(meterRevealed(lesson.scenes[0],['1:0','2:1']),false);assert.equal(meterRevealed(lesson.scenes[0],['2:2']),true);assert.equal(meterRevealed(lesson.scenes[1],[]),true);
const predict=lesson.scenes[0].strategies[0];assert.deepEqual(predict.options,['鉛','石墨、黏土和木頭','我不確定']);assert.equal(predict.answer,undefined);assert.deepEqual(predict.revealAt,{para:2,n:2});assert.ok(lesson.scenes[0].timeline.findIndex(t=>t.id===predict.id)<lesson.scenes[0].timeline.findIndex(t=>t.kind==='act'));
const cause=lesson.scenes[1].strategies[0];assert.deepEqual(cause.answer,[0,1]);assert.equal(chooseStrategy(cause,0).complete,false);assert.equal(chooseStrategy(cause,1,[0]).complete,true);assert.equal(chooseStrategy(cause,2).complete,false);for(const o of cause.options)assert.notEqual(o.label,cause.prompt);
assert.equal(lesson.scenes[2].operation.collect,undefined,'assembly strictly ordered');assert.equal(lesson.scenes[3].operation.objects.find(o=>o.action==='cut').viewMotion,'machineCut');assert.equal(lesson.scenes[3].questions[1].kind,'比較');assert.equal(lesson.scenes[3].questions[2].lockOrderSelections,true);
const password=classroomPassword();
if(password){
 const e=JSON.parse(readFileSync(new URL('../public/data/readings.enc.json',import.meta.url)));const raw=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);const key=await webcrypto.subtle.deriveKey({name:'PBKDF2',salt:Buffer.from(e.salt,'base64'),iterations:e.iter,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,['decrypt']);const rs=JSON.parse(new TextDecoder().decode(await webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(e.iv,'base64')},key,Buffer.from(e.data,'base64'))));const ps=new Map();for(const u of splitSentences(rs[lesson.lessonId].paras)){const p=u.paraIndex+1;if(!ps.has(p))ps.set(p,[]);ps.get(p).push(u.text);}await validateUnlockedLesson(lesson,ps);
 const roots=[homedir()+'/mandarin-work/',homedir()+'/Library/CloudStorage/OneDrive-個人/mandarin-work/'];const file=roots.map(r=>r+'reading-tool-lessons/115HG3A06.json').find(existsSync);assert.ok(file);assert.equal(JSON.parse(readFileSync(file)).text.replace(/[|\s]/g,''),[...ps.values()].flat().join('').replace(/\s/g,''));
 const resolved=sentenceSources(lesson,ps,new Map());assert.equal([...resolved.keys()].filter(k=>k.startsWith('sentence:')).length,38);assert.ok(!resolved.has('sentence:3:0') && !resolved.has('sentence:6:0'));for(const key of covered){const [p,n]=key.split(':').map(Number);assert.equal(resolved.get('sentence:'+key),ps.get(p)[n]);}
 const source=readFileSync(new URL('../src/data/situationLessons/115AG3H06.js',import.meta.url),'utf8');for(const ts of ps.values())for(const t of ts)if(t.length>=12)assert.ok(!source.includes(t),'no source sentences in config');
 const bad=structuredClone(lesson);bad.scenes[0].clues[0].refs[0].sha[0]='00000000';await assert.rejects(()=>validateUnlockedLesson(bad,ps));
 const wrongTerm=structuredClone(lesson);wrongTerm.meter.states[0]='不存在的原料';await assert.rejects(()=>validateUnlockedLesson(wrongTerm,ps));
}else console.log('SKIP: local classroom password unavailable; encrypted/source checks not run');
let visibilityChecks=0;
const sizes=[[1366,900],[820,1180],[375,812],[678,771]];
const panFor=(w,iw,x)=>Math.max(0,Math.min(1,(iw*x/100-w/2)/(iw-w || 1)));
function visible(s,w,h,o,focus,panel=true){const iw=sceneIllustrationLayout(w,h,.5,s.art).imageWidth,g=sceneIllustrationLayout(w,h,panFor(w,iw,focus),s.art),x=g.left+g.imageWidth*o.x/100,y=g.top+g.imageHeight*o.y/100;const rx=Math.max(22,g.imageWidth*(o.width || 0)/200),ry=Math.max(22,g.imageWidth*(o.width || 0)*(o.ratio || 1)/200);assert.ok(x-rx>=-1e-8 && x+rx<=w+1e-8,`${s.id} ${o.action || o.label}: x at ${w}x${h}`);assert.ok(y-ry>=0 && y+ry<=h*(panel?.74:1),`${s.id} ${o.action || o.label}: y at ${w}x${h}`);visibilityChecks++;}
for(const s of lesson.scenes)for(const[w,h]of sizes){
 for(const read of [false,true])for(const pan of [0,.5,1]){const g=sceneIllustrationLayout(w,h,pan,s.art,read);assert.ok(g.left<=0 && g.top<=0 && g.left+g.imageWidth>=w-1e-8 && g.top+g.imageHeight>=h,'full cover');}
 for(let step=0;step<s.operation.steps.length;step++)for(const o of s.operation.objects.filter(o=>!o.passive && step>=(o.fromStep ?? 0) && step<=(o.toStep ?? s.operation.steps.length) && !s.operation.steps.slice(0,step).includes(o.action)))visible(s,w,h,o,s.operation.focus[step]);
 for(const t of s.strategies || [])if(t.type!=='predict')for(const o of t.options)visible(s,w,h,o,t.focus);
 for(const t of s.timeline.filter(t=>t.kind==='openBag'))visible(s,w,h,{...t.object,ratio:1.2},50);
}
// A DOM adapter executes the actual handlers without launching a browser.
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
function setup(s,reduced=true,raw){const state=operationState(s,raw),outer=new Element(),host=new Element(),plane=new Element();outer.append(host);host.append(plane);let changes=0,reenter;const ctl=mountOperation(plane,{scene:s,state,reduced:()=>reduced,changed(){changes++;reenter?.();}});const find=id=>plane.children[0].children.find(n=>n.dataset.action===id);const activate=id=>{const o=s.operation.objects.find(o=>o.action===id);find(id).onclick();if((o.gesture || s.operation.type)==='dragToTarget')find(s.operation.objects.find(t=>t.target).action).onclick();};return {state,ctl,find,activate,plane,outer,setReenter:fn=>reenter=fn,get changes(){return changes;}};}
try{
 for(const s of lesson.scenes){
  const p=setup(s);p.activate(s.operation.steps[0]);assert.equal(p.state.step,0,'paused');p.ctl.setPaused(false);
  for(const [i,id] of s.operation.steps.entries()){const node=p.find(id);p.setReenter(()=>node.onclick());p.activate(id);assert.equal(p.state.step,i+1);for(let j=0;j<30;j++)node.onclick();assert.equal(p.state.step,i+1,'completed no-op');assert.equal(node.disabled,true);}
  assert.ok(operationComplete(s,p.state));assert.equal(p.changes,s.operation.steps.length);assert.equal(operationState(s,p.state).step,s.operation.steps.length);
  const layer=p.plane.children[0];for(const n of layer.children){if(n.classes?.has('fp-wood-arrow'))assert.equal(n.children[0].attrs.d,'');if(n.dataset.region)assert.equal(n.hidden,true,'no remaining drag guide');}
  p.ctl.dispose();
 }
 // Both materials may be collected in either order, but processing waits for both.
 {const s=lesson.scenes[1],state=operationState(s);assert.equal(operate(s,state,'mix'),false);assert.equal(operate(s,state,'clay'),true);assert.equal(operate(s,state,'clay'),false);assert.equal(operate(s,state,'graphite'),true);assert.equal(operate(s,state,'mix'),true);}
 // Wrong assembly order gives state-dependent gentle help, without scoring.
 {// 材料逐步出現：凹槽刻好前沒有筆芯、筆芯放好前沒有上蓋木板，因此不會發生錯序。
 const s=lesson.scenes[2],p=setup(s);p.ctl.setPaused(false);p.activate('insert');assert.equal(p.state.step,0,'core unavailable before grooving');p.activate('glue');assert.equal(p.state.step,0,'lid unavailable before grooving');p.activate('groove');assert.equal(p.state.step,1);p.activate('glue');assert.equal(p.state.step,1,'lid unavailable before core');assert.equal(p.changes,1);p.ctl.dispose();}
 // Cutting and mixing advance only on animation completion; rapid clicks,
 // pause/cancel and restoring a completed machine never run another cycle.
 for(const s of [lesson.scenes[1],lesson.scenes[3]]){
  const index=s.operation.steps.findIndex(id=>['mix','cut'].includes(id)),id=s.operation.steps[index],p=setup(s,false,{step:index});p.ctl.setPaused(false);p.activate(id);const a=animations.at(-1);assert.equal(p.state.step,index);for(let i=0;i<20;i++)p.activate(id);assert.equal(animations.at(-1),a);p.ctl.setPaused(true);a.onfinish?.();assert.equal(p.state.step,index);p.ctl.setPaused(false);p.activate(id);animations.at(-1).onfinish();assert.equal(p.state.step,index+1);assert.equal(p.changes,1);p.activate(id);assert.equal(p.changes,1);p.ctl.dispose();
 }
 for(const s of lesson.scenes)for(const t of s.strategies || []){
  const plane=new Element(),panel=new Element(),stage=new Element();let done=0;const dispose=mountStrategy({strategy:t,panel,plane,stage,states:lesson.meter.states,onWords(){},onDone:()=>done++,focus(){}});
  if(t.type==='predict'){const n=panel.children.at(-1).children[2].children[0];for(let i=0;i<20;i++)n.click();assert.equal(done,1);}
  else{plane.children.find(n=>n.attrs?.['aria-label']===t.options[2].label).click();assert.equal(done,0);for(const i of t.answer){const n=plane.children.find(n=>n.attrs?.['aria-label']===t.options[i].label);n.click();const count=plane.children.length;for(let j=0;j<25;j++)n.click();assert.equal(plane.children.length,count);}const next=panel.querySelector('[data-strategy-next]');assert.ok(next);for(let i=0;i<20;i++)next.click();assert.equal(done,1);}
  dispose();assert.equal(plane.children.length,0,'no leftover strategy curves/markers');
 }
}finally{Object.assign(globalThis,saved);}
const page=readFileSync(new URL('../src/pages/FirstPersonPage.js',import.meta.url),'utf8');const moodCode=page.slice(page.indexOf('function updateMood('),page.indexOf('  function finishBeat('));const node=new Element(),ctx={root:{querySelector:()=>node},scene:lesson.scenes[0],state:{operation:{step:0},read:[]},config:lesson,meterRevealed,meterFor:()=>({level:0,sourceLabel:lesson.meter.states[0],label:lesson.meter.labels[0],face:'pencil'}),clear:n=>n.replaceChildren(),h:(tag,attrs,text)=>({tag,attrs,text,append(){}}),SpeakButton:()=>({}),moodLabel:'old'};runInNewContext(moodCode+';this.run=updateMood;',ctx);ctx.run();assert.equal(node.hidden,true);assert.equal(node.children.length,0);assert.equal(ctx.moodLabel,'');ctx.state.read=['2:2'];ctx.run();assert.equal(node.hidden,false);assert.ok(node.children.some(n=>n.text===lesson.meter.labels[0]));assert.match(page,/pick.disabled=place>=0/);assert.match(page,/第\$\{place\+1\}排序格已填好/);assert.match(readFileSync(new URL('../src/utils/speech.js',import.meta.url),'utf8'),/utter.lang = 'zh-TW'/);
const files=new Set(lesson.scenes.flatMap(s=>[...s.art.images,...s.questions.flatMap(q=>q.summaryImages || []),...s.operation.objects.filter(o=>o.sprite).flatMap(o=>['sprites/'+o.sprite+'.webp',...(o.completedSprite?['sprites/'+o.completedSprite+'.webp']:[])]),...(s.strategies || []).flatMap(t=>t.options.filter(o=>o.sprite).map(o=>'sprites/'+o.sprite+'.webp')),...s.timeline.filter(t=>t.kind==='openBag').map(t=>'sprites/'+t.object.sprite+'.webp')]));for(const f of files)assert.ok(statSync(new URL('../public/'+lesson.assetBase+f,import.meta.url)).size<=(f.startsWith('sprites/')?120:300)*1024,f);
for(const mutate of [l=>l.scenes[1].timeline.reverse(),l=>l.scenes[2].operation.retryByStep.pop(),l=>l.scenes[3].operation.objects[0].machineRegion.x=101,l=>l.excludedUnits=[],l=>l.scenes[0].meterRevealAt.n=999]){const bad=structuredClone(lesson);mutate(bad);assert.throws(()=>validateSituationLesson(bad));}
console.log(`PASS: pencil 38 ordered body units/hash, subheading exclusion, cover, ${visibilityChecks} four-size visibility checks, prediction/cause/comparison/order, actual rapid/repeat/assembly/machine-cancel handlers and assets`);
