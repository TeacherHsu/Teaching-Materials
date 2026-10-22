// Exercise production Pointer Event handlers without a browser or unlock bypass.
import assert from 'node:assert/strict';
import { mountOperation, operationState } from '../src/activities/firstPersonInteraction.js';
import { FIRST_PERSON_LESSON } from '../src/data/firstPersonLesson.js';
class Element {
 constructor(){this.children=[];this.style={};this.dataset={};this.attrs={};this.classList={add(){},remove(){},toggle(){}};}
 append(...items){for(const x of items){x.parentElement=this;this.children.push(x);}}
 appendChild(x){this.append(x);}
 setAttribute(k,v){this.attrs[k]=v;}
 setPointerCapture(){}
 getBoundingClientRect(){return {left:0,top:0,width:1000,height:1000,right:1000,bottom:1000};}
 querySelector(tag){return this.children.find(x=>tag==='img' && x instanceof Image);}
 remove(){}
}
const original={document:globalThis.document,Image:globalThis.Image,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
let clock=0,id=0;const pending=new Map();
globalThis.document={createElement:()=>new Element()};globalThis.Image=class extends Element {};
globalThis.setTimeout=(fn,ms)=>{const key=++id;pending.set(key,{fn,time:clock+ms});return key;};
globalThis.clearTimeout=key=>pending.delete(key);
function advance(ms){const until=clock+ms;while(true){const next=[...pending].filter(([,t])=>t.time<=until).sort((a,b)=>a[1].time-b[1].time)[0];if(!next)break;pending.delete(next[0]);clock=next[1].time;next[1].fn();}clock=until;}
function setup(act){
 const scene=FIRST_PERSON_LESSON.scenes.find(s=>s.act===act),state=operationState(scene);
 const outer=new Element(),host=new Element(),plane=new Element();outer.append(host);host.append(plane);
 const api=mountOperation(plane,{scene,state,changed(){},heat(){},demonstrate(){},chime(){}});
 const layer=plane.children[0];return {state,api,layer,find:action=>layer.children.find(x=>x.dataset.action===action)};
}
const event=(x,y)=>({button:0,pointerId:1,clientX:x,clientY:y,stopPropagation(){}});
try {
 const {state,api,find,layer}=setup(2),ladle=find('ladle');
 assert.equal(layer.children.length,2,'one ladle and one unlabeled water halo');
 assert.equal(find('water').textContent,undefined);
 ladle.onpointerdown(event(500,600));ladle.onpointermove(event(590,540));ladle.onpointerup(event(590,540));advance(1000);assert.equal(state.step,0);
 ladle.onpointerdown(event(590,670));ladle.onpointermove(event(640,700));assert.match(ladle.querySelector('img').src,/ladle-full/);
 ladle.onpointermove(event(640,540));ladle.onpointerup(event(640,540));assert.equal(state.step,0);assert.equal(ladle.style.top,'54%');
 advance(850);assert.equal(state.step,1);assert.match(ladle.querySelector('img').src,/ladle-empty/);
 ladle.onpointerdown(event(590,670));ladle.onpointermove(event(640,700));ladle.onpointercancel();advance(1000);assert.equal(state.step,1);
 ladle.onclick();ladle.onclick();advance(1600);assert.equal(state.step,2);
 ladle.onclick();advance(1600);assert.equal(state.step,3);api.dispose();
 const first=setup(1);assert.equal(first.find('bell').onpointerdown,undefined,'chime stays anchored');first.find('bell').onclick();first.find('bell').onclick();assert.equal(first.state.step,1,'replaying wind does not advance progress');const branch=first.find('wood-1');branch.onpointerdown(event(300,580));branch.onpointermove(event(640,620));branch.onpointerup(event(640,620));assert.equal(branch.style.left,'59%');assert.equal(branch.hidden,false);assert.equal(branch.disabled,true);first.api.dispose();
 const fourth=setup(4);assert.equal(fourth.find('wood-1').disabled,true);advance(2400);assert.equal(fourth.state.step,1);
 const log=fourth.find('wood-1');log.onpointerdown(event(690,730));log.onpointermove(event(650,730));log.onpointerup(event(650,730));advance(1);assert.equal(fourth.state.step,1);
 log.onpointerdown(event(690,730));log.onpointermove(event(580,750));log.onpointerup(event(580,750));advance(1);assert.equal(fourth.state.step,2);
 fourth.find('wood-2').onclick();advance(450);assert.equal(fourth.state.step,3);
 fourth.find('wood-3').onclick();fourth.api.dispose();advance(1000);assert.equal(fourth.state.step,3,'leaving cancels pending extraction');

 // Pointer-up alone supplies the final position and a path crossing the water.
 const fast=setup(2), spoon=fast.find('ladle');
 spoon.onpointerdown(event(640,810));spoon.onpointerup(event(640,540));advance(850);assert.equal(fast.state.step,1);
 spoon.onpointerdown(event(640,700));spoon.onpointermove(event(640,540));spoon.onpointerup(event(900,540));advance(850);assert.equal(fast.state.step,1,'release must still be above water');
 fast.api.dispose();
 const quick=setup(4);advance(2400);const quickLog=quick.find('wood-1');
 quickLog.onpointerdown(event(710,710));quickLog.onpointerup(event(570,800));
 assert.equal(quick.state.step,2,'no pointermove extraction');assert.equal(quickLog.hidden,false);assert.equal(quickLog.disabled,true);assert.equal(quickLog.style.top,'80%');quick.api.dispose();
 const collect=setup(1);collect.find('bell').onclick();const stick=collect.find('wood-2');
 stick.onpointerdown(event(350,830));stick.onpointerup(event(610,800));assert.equal(collect.state.step,2,'no pointermove collection');assert.equal(stick.style.top,'81%');collect.api.dispose();
 console.log('PASS: real pointer gesture, full/empty sprite, return stream timing, cancellation, click alternative, demo gate and stove exit');
} finally {Object.assign(globalThis,original);}
