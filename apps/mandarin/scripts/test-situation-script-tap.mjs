import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {groupScriptLines,needsScriptTap,createScriptTapPlayback,mountSpeakerTap,speakerSpot} from '../src/activities/situation/scriptTap.js';
import lesson from '../src/data/situationLessons/115AG3H08.js';
import rabbit from '../src/data/situationLessons/115AG4K11.js';
const lines=Array.from({length:8},(_,n)=>({para:1,n}));
const config={scriptTap:true,speakers:{'1:0':'旁白','1:1':'小螃蟹','1:2':'小螃蟹','1:3':'寄居蟹','1:4':'寄居蟹','1:5':'旁白','1:6':'畫外音','1:7':''}};
const scene=lesson.scenes[0];
assert.equal(speakerSpot(lesson.scenes[3],'寄居蟹',0,2),null,'hidden animal must not require a face click');
assert.equal(speakerSpot(lesson.scenes[3],'寄居蟹',3,5),null,'still hidden after returning from recall');
assert.ok(speakerSpot(lesson.scenes[3],'寄居蟹',0,1),'visible before hiding');
const groups=groupScriptLines(lines,config.speakers);
assert.deepEqual(groups.map(g=>[g.speaker,g.lines.length]),[['旁白',1],['小螃蟹',2],['寄居蟹',2],['旁白',1],['畫外音',1],['',1]]);
assert.ok(needsScriptTap(config,'tap',groups[1],scene,1));
assert.ok(!needsScriptTap(config,'auto',groups[1],scene,1));
assert.ok(!needsScriptTap({...config,scriptTap:undefined},'tap',groups[1],scene,1));
assert.equal(speakerSpot({art:{speakerSpots:{甲:{imageIndices:[0]}}}},'甲',1),null);
const tick=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
function setup(extra={}){
 const spoken=[],waits=[],shown=[];let complete=0,pending=[];
 const ctl=createScriptTapPlayback({config,scene,lines,read:r=>{spoken.push(r.n);return new Promise(resolve=>pending.push(resolve));},onLine:r=>shown.push(r.n),onWait:g=>waits.push(g.speaker),onDone:()=>complete++,...extra});
 return{ctl,spoken,waits,shown,get complete(){return complete;},async finish(){pending.shift()?.();await tick();}};
}
const p=setup();p.ctl.start();assert.deepEqual(p.spoken,[0]);await p.finish();
assert.equal(p.ctl.waiting,true);assert.deepEqual(p.waits,['小螃蟹']);assert.deepEqual(p.spoken,[0],'dialogue never starts before click');
assert.equal(p.ctl.next(),true,'next is an activation while waiting');assert.equal(p.ctl.activate(),false);assert.deepEqual(p.spoken,[0,1]);
await p.finish();assert.deepEqual(p.spoken,[0,1,2]);assert.equal(p.waits.length,1,'one click for entire turn');
await p.finish();assert.equal(p.ctl.waiting,true);assert.deepEqual(p.waits,['小螃蟹','寄居蟹']);
assert.equal(p.ctl.activate(),true);for(let i=0;i<30;i++)assert.equal(p.ctl.activate(),false);
for(let i=0;i<5;i++)await p.finish();assert.deepEqual(p.spoken,[0,1,2,3,4,5,6,7]);assert.equal(p.complete,1,'narrator, invisible and empty speakers auto-read');
assert.equal(p.ctl.next(),false);
for(const extra of [{mode:'auto'},{config:{...config,scriptTap:undefined}}]){
 const q=setup(extra);q.ctl.start();for(let i=0;i<8;i++)await q.finish();assert.deepEqual(q.spoken,lines.map(r=>r.n));assert.deepEqual(q.waits,[]);assert.equal(q.complete,1);
}
// Pausing/disposing makes stale speech completions inert. Resume reads the same unit.
{const q=setup();q.ctl.start();q.ctl.pause();await q.finish();assert.deepEqual(q.spoken,[0]);q.ctl.resume();assert.deepEqual(q.spoken,[0,0]);await q.finish();assert.ok(q.ctl.waiting);q.ctl.pause();assert.equal(q.ctl.activate(),false);q.ctl.resume();q.ctl.activate();q.ctl.dispose();await q.finish();assert.deepEqual(q.spoken,[0,0,1]);}
// Switching to automatic resumes the unread queue rather than losing the waiting turn.
{const q=setup();q.ctl.start();await q.finish();const remaining=q.ctl.remaining();q.ctl.dispose();assert.equal(remaining[0].n,1);const a=setup({lines:remaining,mode:'auto'});a.ctl.start();for(let i=0;i<7;i++)await a.finish();assert.deepEqual(a.spoken,[1,2,3,4,5,6,7]);assert.equal(a.complete,1);}
class Node{
 constructor(){this.children=[];this.attrs={};this.events={};}
 setAttribute(k,v){this.attrs[k]=v;}addEventListener(k,f){(this.events[k] ||= []).push(f);}appendChild(n){n.parent=this;this.children.push(n);}append(...ns){ns.forEach(n=>this.appendChild(n));}remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);}fire(k,e={}){for(const f of this.events[k] || [])f(e);}
}
const doc=globalThis.document;globalThis.document={createElement:()=>new Node(),createTextNode:()=>new Node()};
try{
 for(const key of ['Enter',' ']){
  const plane=new Node();let called=0,focused=0,prevented=0;
  const dispose=mountSpeakerTap({plane,speaker:'小螃蟹',spot:scene.art.speakerSpots['小螃蟹'],activate:()=>{called++;return true;},focus:()=>focused++});
  const targets=plane.children.filter(n=>n.attrs.type==='button');assert.equal(targets.length,2);
  assert.ok(targets.every(n=>n.attrs['aria-label']==='聽小螃蟹說'));
  targets[0].fire('focus');targets[0].fire('keydown',{key,preventDefault(){prevented++;}});targets[0].fire('click');targets[1].fire('click');
  assert.equal(called,1);assert.equal(prevented,1);assert.ok(focused>=2);assert.equal(plane.children.length,0);dispose();
 }
}finally{globalThis.document=doc;}
// Every configured timeline turn fits within a single read entry (no second tap mid-turn).
for(const s of lesson.scenes)for(let i=1;i<s.timeline.length;i++){
 const a=s.timeline[i-1],b=s.timeline[i];if(a.kind!=='read' || b.kind!=='read')continue;
 const last=a.refs.at(-1),first=b.refs[0];assert.notEqual(lesson.speakers[`${last.para}:${last.sentences.at(-1)}`],lesson.speakers[`${first.para}:${first.sentences[0]}`]);
}
const page=readFileSync(new URL('../src/pages/FirstPersonPage.js',import.meta.url),'utf8');
assert.match(page,/config.scriptTap && prefs.dialogue!=='auto' && beat==='read'/);assert.match(page,/mandarin:explore:settings/);assert.match(page,/scriptPlayback\?\.pause\(\)/);assert.match(page,/scriptPlayback\.resume\(\)/);assert.match(page,/restartDialogue=beat==='read'/);
// 同一角色在不同插畫的位置不同：speakerSpots 可為陣列，依 imageIndices 選位置；該插畫沒有此角色則自動朗讀。
{const act4=rabbit.scenes.find(s=>s.act===4);assert.equal(rabbit.scriptTap,true);
 assert.equal(speakerSpot(act4,'愛麗絲',0,0).x,42);assert.equal(speakerSpot(act4,'愛麗絲',2,0).x,45);
 assert.equal(speakerSpot(act4,'兔子先生',0,0),null);assert.equal(speakerSpot(act4,'兔子先生',2,0).x,63);}
console.log('PASS: script tap grouping, click gate, ordered speech, narrator/invisible/empty auto, automatic/legacy, next, keyboard, no-op, pause/dispose and mode-switch queue');
