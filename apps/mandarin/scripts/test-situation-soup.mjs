import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync,readdirSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {homedir} from 'node:os';
import lesson from '../src/data/situationLessons/115AG6H11.js';
import {validateSituationLesson,validateUnlockedLesson,storyUnitKeys,meterFor} from '../src/data/situationLessons/schema.js';
import {splitSentences} from '../src/utils/readingUnits.js';
import {classroomPassword} from './classroom-password.mjs';
import {sceneIllustrationLayout} from '../src/activities/firstPersonLayout.js';
import {operationState,mountOperation,operationComplete,operate} from '../src/activities/firstPersonInteraction.js';
import {meterRevealed} from '../src/activities/firstPersonPresentation.js';
import {mountStrategy,chooseStrategy} from '../src/activities/situation/strategies.js';
validateSituationLesson(lesson);
assert.equal(lesson.sentenceCount,89);assert.equal(lesson.storySentenceCount,88);
assert.deepEqual(lesson.excludedUnits,[{para:1,sentences:[0]}]);
assert.deepEqual(lesson.scenes.map(s=>s.clues[0].refs.reduce((n,r)=>n+r.sentences.length,0)),[14,16,22,36]);
assert.deepEqual(Object.entries(lesson.speakers).filter(([,v])=>v),[['1:29','母親'],['1:30','母親']]);
assert.ok(!lesson.scriptTap && !lesson.script);
const covered=lesson.scenes.flatMap(s=>s.timeline.filter(t=>['intro','read'].includes(t.kind)).flatMap(t=>t.refs.flatMap(r=>r.sentences.map(n=>`${r.para}:${n}`))));
assert.deepEqual(covered,storyUnitKeys(lesson));assert.equal(new Set(covered).size,88);
assert.ok(lesson.scenes.reduce((n,s)=>n+s.operation.steps.length,0)>=14);
for(const s of lesson.scenes){
 assert.ok(s.goal.length<=12);assert.ok(s.operation.prompts.every(t=>t.length<=12));assert.equal(s.operation.silentObserve,true);
 assert.equal(s.operation.focus.length,s.operation.steps.length+1);assert.ok(Number.isFinite(s.operation.focus.at(-1)));
 assert.ok(Array.isArray(s.operation.protectedRegions));
 let run=0;for(const t of s.timeline){if(['act','strategy','question'].includes(t.kind))run=0;
  if(['intro','read'].includes(t.kind)){run+=t.refs.reduce((n,r)=>n+r.sentences.length,0);assert.ok(run<=8,`${s.id} reading run ${run}`);assert.ok(Number.isInteger(t.imageIndex));}
 }
 assert.equal(s.questions[0].operationType,'summaryCard');assert.equal(s.questions[0].summaryImages.length,3);assert.equal(new Set(s.questions[0].summaryImages).size,3);
 for(const t of s.strategies){assert.ok(t.answer.length>=1);if(t.type==='causeEffect')assert.ok(t.options.length>t.answer.length);for(const o of t.options)assert.notEqual(o.label,t.prompt);}
}
const safety='煮東西時，熱鍋和滾水交給大人處理。';
assert.equal(lesson.safetyReminderCount,1);assert.deepEqual(lesson.scenes.filter(s=>s.beats.result.safetyReminder).map(s=>s.act),[3]);assert.equal(JSON.stringify(lesson).split(safety).length-1,1);
assert.equal(lesson.scenes[2].beats.result.safetyReminder,safety);
const cooks=lesson.scenes[2].operation.objects.filter(o=>o.viewMotion==='adultCook');assert.equal(cooks.length,6);
assert.deepEqual(cooks.map(o=>o.cookMotion),['drop','drop','scoop','stir','pour','thicken']);assert.ok(cooks.every(o=>!o.sprite && !o.sourceCaption));
assert.ok(lesson.scenes.flatMap(s=>s.questions).every(q=>!q.stem.includes('你家')));
assert.ok(lesson.scenes[3].operation.objects.slice(0,2).every(o=>o.label.includes('放涼')));
assert.equal(meterRevealed(lesson.scenes[0],[]),false);assert.equal(meterRevealed(lesson.scenes[0],['1:2']),true);
assert.equal(meterFor(lesson,lesson.scenes[1],2).label,lesson.meter.states[0]);assert.equal(meterFor(lesson,lesson.scenes[1],3).label,lesson.meter.states[1]);
assert.equal(meterFor(lesson,lesson.scenes[3],4).label,lesson.meter.states[1]);assert.equal(meterFor(lesson,lesson.scenes[3],5).label,lesson.meter.states[2]);
assert.equal(meterFor(lesson,lesson.scenes[3],7,false,{para:1,n:88}).label,lesson.meter.states[3]);
assert.equal(lesson.scenes[2].art.images[lesson.scenes[2].art.stepImages[7]],'stove-pour.webp');
assert.equal(lesson.scenes[2].art.images[lesson.scenes[2].art.stepImages[8]],'stove.webp');
// Each read checkpoint stays at the state reached before it, never at a later result.
const cookingReads=new Map(lesson.scenes[2].timeline.filter(t=>['intro','read'].includes(t.kind)).map(t=>[t.refs[0].sentences[0],lesson.scenes[2].art.images[t.imageIndex]]));
assert.deepEqual([...cookingReads],[[31,'kitchen.webp'],[34,'stove-clear.webp'],[40,'stove-drop.webp'],[43,'stove-scoop.webp'],[47,'stove-scoop.webp'],[48,'stove-fry.webp'],[50,'stove-pour.webp'],[51,'stove.webp']]);
assert.equal(lesson.scenes[3].art.images[lesson.scenes[3].timeline.find(t=>t.kind==='read' && t.refs[0].sentences[0]===76).imageIndex],'serve-before.webp');
assert.equal(lesson.scenes[3].art.images[lesson.scenes[3].art.stepImages[6]],'serve-before.webp');
assert.ok(cooks.every(o=>lesson.scenes[2].art.images.includes(o.motionImage)));
const password=classroomPassword();assert.ok(password,'local password required: encrypted/source checks must run');
const e=JSON.parse(readFileSync(new URL('../public/data/readings.enc.json',import.meta.url)));const raw=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);const key=await webcrypto.subtle.deriveKey({name:'PBKDF2',salt:Buffer.from(e.salt,'base64'),iterations:e.iter,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,['decrypt']);const rs=JSON.parse(new TextDecoder().decode(await webcrypto.subtle.decrypt({name:'AES-GCM',iv:Buffer.from(e.iv,'base64')},key,Buffer.from(e.data,'base64'))));const ps=new Map();for(const u of splitSentences(rs[lesson.lessonId].paras)){const p=u.paraIndex+1;if(!ps.has(p))ps.set(p,[]);ps.get(p).push(u.text);}await validateUnlockedLesson(lesson,ps);
const roots=[homedir()+'/mandarin-work/',homedir()+'/Library/CloudStorage/OneDrive-個人/mandarin-work/'];const file=roots.map(r=>r+'reading-tool-lessons/115HG6A11.json').find(existsSync);assert.ok(file);assert.equal(JSON.parse(readFileSync(file)).text.replace(/[|\s]/g,''),[...ps.values()].flat().join('').replace(/\s/g,''));
const configSource=readFileSync(new URL('../src/data/situationLessons/115AG6H11.js',import.meta.url),'utf8');for(const ts of ps.values())for(const t of ts)if(t.length>=12 && !lesson.meter.states.some(w=>t.includes(w)))assert.ok(!configSource.includes(t),'no original sentences in config');
const bad=structuredClone(lesson);bad.scenes[0].clues[0].refs[0].sha[0]='00000000';await assert.rejects(()=>validateUnlockedLesson(bad,ps));
let visibilityChecks=0;
const sizes=[[1366,900],[820,1180],[375,812],[678,771]];
const panFor=(w,iw,x)=>Math.max(0,Math.min(1,(iw*x/100-w/2)/(iw-w || 1)));
function visible(s,w,h,o,focus,panel=false){const iw=sceneIllustrationLayout(w,h,.5,s.art).imageWidth,g=sceneIllustrationLayout(w,h,panFor(w,iw,focus),s.art),x=g.left+g.imageWidth*o.x/100,y=g.top+g.imageHeight*o.y/100;const rx=Math.max(22,g.imageWidth*(o.width || 0)/200),ry=Math.max(22,g.imageWidth*(o.width || 0)*(o.ratio || 1)/200);assert.ok(x-rx>=-1e-8 && x+rx<=w+1e-8,`${s.id} ${o.action || o.label}: x at ${w}x${h}`);assert.ok(y-ry>=0 && y+ry<=h*(panel?.74:1),`${s.id} ${o.action || o.label}: y at ${w}x${h}`);visibilityChecks++;}
for(const s of lesson.scenes)for(const[w,h]of sizes){
 for(const read of [false,true])for(const pan of [0,.5,1]){const g=sceneIllustrationLayout(w,h,pan,s.art,read);assert.ok(g.left<=0 && g.top<=0 && g.left+g.imageWidth>=w-1e-8 && g.top+g.imageHeight>=h,'full cover');}
 for(let step=0;step<s.operation.steps.length;step++)for(const o of s.operation.objects.filter(o=>!o.passive && step>=o.fromStep && step<=o.toStep))visible(s,w,h,o,s.operation.focus[step]);
 for(const t of s.strategies)for(const o of t.options){if(o.sprite)visible(s,w,h,o,t.focus,true);visible(s,w,h,{...o,x:o.x+(o.markerOffset?.[0] || 0),y:o.y+(o.markerOffset?.[1] || 0),width:0,ratio:1},t.focus,true);
  if(o.sprite)assert.ok(o.markerOffset[1]*1024/100>o.width*2400/200+22*1024/h,'marker below picture');
  if(o.face){visible(s,w,h,{x:o.x,y:o.y,width:o.face.width,ratio:o.face.height/o.face.width*1024/2400},t.focus,true);const g=sceneIllustrationLayout(w,h,.5,s.art);assert.ok(Math.abs(o.markerOffset[0])*g.imageWidth/100>=22+o.face.width*g.imageWidth/200,'marker beside face');}
 }
 for(let step=0;step<s.operation.steps.length;step++){
  const g=sceneIllustrationLayout(w,h,.5,s.art),active=s.operation.objects.filter(o=>step>=o.fromStep && step<=o.toStep);
  const box=o=>({x:g.imageWidth*o.x/100,y:g.imageHeight*o.y/100,rx:Math.max(22,g.imageWidth*o.width/200),ry:Math.max(22,g.imageWidth*o.width*o.ratio/200)});
  for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){const a=box(active[i]),b=box(active[j]);assert.ok(Math.abs(a.x-b.x)>=a.rx+b.rx || Math.abs(a.y-b.y)>=a.ry+b.ry,`${s.id} ${active[i].action}/${active[j].action} overlap at ${w}x${h}`);}
 }
}
// Fix 1: actual bowl silhouette in table.webp, in source-image percentages.
// Upper part covers soup/rim; the lower part covers ceramic bowl, clear of hands.
const bowlParts=[{left:35.3,right:62.7,top:45,bottom:67},{left:39,right:60,top:67,bottom:85}];
const weather=lesson.scenes[0].strategies.find(t=>t.id==='soup-weather');
const theme=lesson.scenes[3].strategies.find(t=>t.id==='soup-theme');
assert.equal(theme.result,undefined,'theme uses no link across mother');
assert.ok(weather.result[0]>=48 && weather.result[0]<=53 && weather.result[1]>=45 && weather.result[1]<=47,'weather link ends at bowl rear rim before soup surface');
const apart=(a,b)=>a.right<=b.left || b.right<=a.left || a.bottom<=b.top || b.bottom<=a.top;
// The existing quadratic link stays above the soup surface for its entire path.
for(let i=0;i<=100;i++){const t=i/100,sy=weather.options[0].y,ey=weather.result[1];const y=(1-t)**2*sy+2*(1-t)*t*ey+t*t*ey;assert.ok(y<=47,'weather curve never enters soup');}
for(const [w,h]of sizes){
 const g=sceneIllustrationLayout(w,h,.5,lesson.scenes[0].art);
 const boxes=weather.options.map(o=>({left:o.x-o.width/2,right:o.x+o.width/2,top:o.y-o.width*g.imageWidth/g.imageHeight/2,bottom:o.y+o.width*g.imageWidth/g.imageHeight/2}));
 for(const [i,o]of weather.options.entries()){
  visible(lesson.scenes[0],w,h,o,weather.focus,true);
  const marker={x:o.x+o.markerOffset[0],y:o.y+o.markerOffset[1]};
  visible(lesson.scenes[0],w,h,marker,weather.focus,true);
  const mb={left:marker.x-22/g.imageWidth*100,right:marker.x+22/g.imageWidth*100,top:marker.y-22/g.imageHeight*100,bottom:marker.y+22/g.imageHeight*100};
  assert.equal(o.markerOffset[0],0,'marker directly below card');
  assert.ok(mb.top>boxes[i].bottom,'44px marker clears card');
  for(const bowl of bowlParts){assert.ok(apart(boxes[i],bowl),'picture outside bowl');assert.ok(apart(mb,bowl),'marker outside bowl');}
 }
 assert.ok(apart(...boxes),'weather cards separate');
 const o=theme.options[0],mx=o.x+o.markerOffset[0],my=o.y+o.markerOffset[1];
 const fg=sceneIllustrationLayout(w,h,.5,lesson.scenes[3].art);
 const marker={left:mx-22/fg.imageWidth*100,right:mx+22/fg.imageWidth*100,top:my-22/fg.imageHeight*100,bottom:my+22/fg.imageHeight*100};
 assert.ok(apart(marker,{left:o.x-o.face.width/2,right:o.x+o.face.width/2,top:o.y-o.face.height/2,bottom:o.y+o.face.height/2}),'whole theme marker clears face');
}
const invalidResult=structuredClone(lesson);invalidResult.scenes[3].strategies[0].result=[101,60];assert.throws(()=>validateSituationLesson(invalidResult),/cause result/);
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
function setup(s,reduced=true,raw){const state=operationState(s,raw),outer=new Element(),host=new Element(),plane=new Element();outer.append(host);host.append(plane);let changes=0,reenter;const ctl=mountOperation(plane,{scene:s,state,reduced:()=>reduced,changed(){changes++;reenter?.();}});const find=id=>plane.children[0].children.find(n=>n.dataset.action===id);return {state,ctl,find,plane,outer,setReenter:fn=>reenter=fn,get changes(){return changes;}};}

try{
 for(const s of lesson.scenes){
  const p=setup(s);const first=s.operation.objects.find(o=>(o.event || o.action)===s.operation.steps[0]);p.find(first.action).onclick();assert.equal(p.state.step,0);p.ctl.setPaused(false);
  for(const [i,id]of s.operation.steps.entries()){const spec=s.operation.objects.find(o=>(o.event || o.action)===id),node=p.find(spec.action);p.setReenter(()=>node.onclick());node.onclick();assert.equal(p.state.step,i+1);for(let j=0;j<30;j++)node.onclick();assert.equal(p.state.step,i+1);assert.equal(node.disabled,true);}
  assert.ok(operationComplete(s,p.state));assert.equal(p.changes,s.operation.steps.length);assert.equal(operationState(s,p.state).step,s.operation.steps.length);
  assert.ok(!p.plane.children[0].children.some(n=>n.className==='fp-adult-cook-frame'));p.ctl.dispose();
 }
 // Either response completes the same state event, with no branch in the story.
 for(const choice of ['reply-noodles','reply-flat']){const p=setup(lesson.scenes[1],true,{step:3});p.ctl.setPaused(false);p.find(choice).onclick();assert.equal(p.state.step,4);for(const o of ['reply-noodles','reply-flat']){assert.equal(p.find(o).disabled,true);p.find(o).onclick();}assert.equal(p.changes,1);p.ctl.dispose();}
 // Actual adult animation handlers: no early completion, rapid click ignored,
 // cancellation on pause/dispose leaves state, reduced motion commits once.
 for(const o of cooks){const s=lesson.scenes[2],step=s.operation.steps.indexOf(o.action),p=setup(s,false,{step});p.ctl.setPaused(false);const n=p.find(o.action);n.onclick();const a=animations.at(-1);assert.equal(p.state.step,step);for(let i=0;i<20;i++)n.onclick();assert.equal(p.state.step,step);a.onfinish();assert.equal(p.state.step,step+1);assert.equal(p.changes,1);p.ctl.dispose();
  for(const mode of ['pause','dispose']){const q=setup(s,false,{step});q.ctl.setPaused(false);q.find(o.action).onclick();if(mode==='pause')q.ctl.setPaused(true);else q.ctl.dispose();assert.equal(q.state.step,step);assert.ok(!q.plane.children[0]?.children.some(n=>n.className==='fp-adult-cook-frame'));q.ctl.dispose();}
 }
 for(const s of lesson.scenes)for(const t of s.strategies){
  const plane=new Element(),panel=new Element(),stage=new Element();let done=0;const dispose=mountStrategy({strategy:t,panel,plane,stage,states:lesson.meter.states,onWords(){},onDone:()=>done++,focus(){}});
  plane.children.find(n=>n.attrs?.['aria-label']===t.options[1].label).click();assert.equal(done,0);const n=plane.children.find(n=>n.attrs?.['aria-label']===t.options[0].label);n.click();if(t.id==='soup-theme')assert.ok(!plane.children.some(n=>n.className==='fp-strategy-link'),'no theme link after correct answer');const count=plane.children.length;for(let i=0;i<30;i++)n.click();assert.equal(plane.children.length,count);const next=panel.querySelector('[data-strategy-next]');for(let i=0;i<20;i++)next.click();assert.equal(done,1);dispose();assert.equal(plane.children.length,0);
 }
}finally{Object.assign(globalThis,saved);}
const page=readFileSync(new URL('../src/pages/FirstPersonPage.js',import.meta.url),'utf8');assert.match(page,/pick.disabled=place>=0/);assert.match(page,/第\$\{place\+1\}排序格已填好/);assert.match(page,/safetyRemindersShown.has\(scene.id\)/);assert.match(page,/safetyRemindersShown.add\(scene.id\)/);
assert.match(readFileSync(new URL('../src/utils/speech.js',import.meta.url),'utf8'),/utter.lang = 'zh-TW'/);
const opSource=readFileSync(new URL('../src/activities/situation/operations.js',import.meta.url),'utf8');assert.match(opSource,/if\(state.step>=config.steps.length\)\{arrowPath\?\.setAttribute\('d',''\)/);
assert.equal(lesson.scenes[2].questions[1].lockOrderSelections,true);
const files=new Set(lesson.scenes.flatMap(s=>[...s.art.images,...s.questions.flatMap(q=>q.summaryImages || []),...s.operation.objects.filter(o=>o.sprite).map(o=>'sprites/'+o.sprite+'.webp'),...s.strategies.flatMap(t=>t.options.filter(o=>o.sprite).map(o=>'sprites/'+o.sprite+'.webp'))]));for(const f of files)assert.ok(statSync(new URL('../public/'+lesson.assetBase+f,import.meta.url)).size>0 && statSync(new URL('../public/'+lesson.assetBase+f,import.meta.url)).size<=(f.startsWith('sprites/')?120:300)*1024,f);
function dimensions(b){assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');const tag=b.toString('ascii',12,16);if(tag==='VP8X')return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(tag==='VP8 ')return [b.readUInt16LE(26)&16383,b.readUInt16LE(28)&16383];if(tag==='VP8L'){const v=b.readUInt32LE(21);return [(v&16383)+1,((v>>>14)&16383)+1];}throw Error('unsupported WebP header');}
const assetURL=new URL('../public/'+lesson.assetBase,import.meta.url);
for(const f of readdirSync(assetURL).filter(f=>f.endsWith('.webp')))assert.deepEqual(dimensions(readFileSync(new URL(f,assetURL))),[2400,1024]);
for(const f of readdirSync(new URL('sprites/',assetURL)).filter(f=>f.endsWith('.webp'))){const b=readFileSync(new URL('sprites/'+f,assetURL));assert.ok(b.length>0 && b.length<=120*1024);const d=dimensions(b);assert.ok(d.every(n=>n>0));if(f.startsWith('summary-'))assert.deepEqual(d,[720,300]);}

console.log(`PASS: soup 88 ordered units/hash, 20 state steps, cover, ${visibilityChecks} four-size visibility checks, nonoverlap, adult-only cooking, aliases, cancellation/rapid/repeated click, safety once and reading/focus timing`);
