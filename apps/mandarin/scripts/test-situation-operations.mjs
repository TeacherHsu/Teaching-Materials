import assert from 'node:assert/strict';
import { mountOperation, operationState, operationComplete } from '../src/activities/firstPersonInteraction.js';
import { advanceScoop, crossesRegion, chooseCard, orderCards } from '../src/activities/situation/operations.js';
import { freshProgress, restoreProgress } from '../src/activities/firstPersonCore.js';
class Element {
 constructor(){this.children=[];this.style={};this.dataset={};this.attrs={};this.classList={add(){},remove(){},toggle(){}};}
 append(...xs){for(const x of xs){x.parentElement=this;this.children.push(x);}}
 setAttribute(k,v){this.attrs[k]=v;}
 remove(){}
 getBoundingClientRect(){return {left:0,top:0,width:100,height:100};}
 setPointerCapture(){}
 animate(){return {cancel(){}};}
}
const saved={document:globalThis.document,Image:globalThis.Image,innerWidth:globalThis.innerWidth,innerHeight:globalThis.innerHeight};
globalThis.document={createElement:()=>new Element(),createElementNS:()=>new Element(),createTextNode:text=>({textContent:text})};globalThis.Image=Element;globalThis.innerWidth=100;globalThis.innerHeight=100;
const obj=(action,x,y,extra={})=>({action,label:action,x,y,width:10,ratio:1,angle:0,...extra});
const event=(x,y)=>({pointerId:1,button:0,clientX:x,clientY:y,stopPropagation(){}});
function setup(type,objects,steps,extra={}){
 const scene={id:'fixture',act:1,assetBase:'assets/fixture/',goal:'fixture',art:{},beats:{act:{demo:false},intro:[],read:[]},clues:[],questions:[],operation:{type,objects,steps,...extra}};
 const state=operationState(scene),outer=new Element(),host=new Element(),plane=new Element();outer.append(host);host.append(plane);let changes=0;
 const controller=mountOperation(plane,{scene,state,changed(){changes++;}});controller.setPaused(false);
 return {scene,state,controller,layer:plane.children[0],find:action=>plane.children[0].children.find(el=>el.dataset.action===action),get changes(){return changes;}};
}
try{
 const observe=setup('observe',[obj('look',20,20)],['look']);observe.find('look').onclick();assert.equal(observe.state.step,1);observe.controller.dispose();
 const target={left:60,right:80,top:60,bottom:80};
 const drag=setup('dragToTarget',[obj('one',10,10,{destination:[70,70]}),obj('two',25,10,{destination:[74,74]}),obj('target',70,70,{target:true})],['one','two'],{regions:{target},collect:['one','two']});
 const one=drag.find('one');one.onpointerdown(event(10,10));one.onpointerup(event(40,40));assert.equal(drag.state.step,0);assert.equal(one.style.left,'10%');
 one.onpointerdown(event(10,10));one.onpointerup(event(70,70));assert.equal(drag.state.step,1);assert.equal(one.style.left,'70%');
 await new Promise(resolve=>setTimeout(resolve,1));drag.find('two').onclick();drag.find('target').onclick();assert.ok(operationComplete(drag.scene,drag.state));assert.equal(drag.changes,2);
 const lesson={version:1,scenes:[drag.scene]};const progress=freshProgress(lesson);progress.scenes[0].operation=drag.state;assert.deepEqual(restoreProgress(lesson,progress).scenes[0].operation,drag.state);drag.controller.dispose();
 const scoop=setup('scoopGesture',[obj('ladle',30,30)],['scoop','scoop'],{regions:{water:{left:40,right:60,top:50,bottom:70}}});
 const ladle=scoop.find('ladle');ladle.onpointerdown(event(50,80));ladle.onpointerup(event(50,30));assert.equal(scoop.state.step,1,'coalesced release crosses water');ladle.onpointerdown(event(50,60));ladle.onpointercancel();assert.equal(scoop.state.step,1);await new Promise(resolve=>setTimeout(resolve,1));ladle.onclick();assert.equal(scoop.state.step,2,'keyboard/click fallback');scoop.controller.dispose();
 const tool=setup('toolGrab',[obj('tool',10,10,{tool:true}),obj('log',40,40,{destination:[70,70]}),obj('target',70,70,{target:true})],['log'],{collect:['log'],regions:{target}});
 tool.find('log').onclick();tool.find('target').onclick();assert.equal(tool.state.step,0,'tool required');tool.find('tool').onclick();tool.find('log').onclick();tool.find('target').onclick();assert.equal(tool.state.step,1);tool.controller.dispose();
 const choose=setup('chooseCard',[obj('yes',10,10),obj('no',30,10)],['yes']);choose.find('no').onclick();assert.equal(choose.state.step,0);choose.find('yes').onclick();assert.equal(choose.state.step,1);choose.controller.dispose();
 const order=setup('orderCards',[obj('a',10,10),obj('b',30,10)],['sorted'],{answer:[1,0]});order.find('b').onclick();order.find('a').onclick();order.controller.setPaused(true);const status=order.layer.parentElement.parentElement.parentElement.children[1];const confirm=status.children.at(-1);confirm.onclick();assert.equal(order.state.step,0);order.controller.setPaused(false);confirm.onclick();assert.equal(order.state.step,1);order.controller.dispose();
 // Three activations with no wait (well within 200 ms), plus stale/repeated input.
 for(const type of ['tap','observe','dragToTarget','scoopGesture','toolGrab','chooseCard','orderCards','tracePath']){
  const objects=['a','b','c'].map((a,i)=>obj(a,10+i*15,20,type==='tracePath'?{path:[[10+i*15,20]]}:{}));
  if(type==='toolGrab')objects.push(obj('tool',5,5,{tool:true}));
  if(['dragToTarget','toolGrab'].includes(type))objects.push(obj('target',70,70,{target:true}));
  const steps=type==='orderCards'?['sorted']:type==='scoopGesture'?['scoop','scoop','scoop']:['a','b','c'];
  const fixture=setup(type,objects,steps,{collect:['tap','observe','dragToTarget','toolGrab'].includes(type)?steps:undefined,regions:{target,water:target},answer:[0,1,2]});
  const start=performance.now();
  for(const a of ['a','b','c']){
   if(type==='toolGrab')fixture.find('tool').onclick();
   fixture.find(a).onclick();
   if(['dragToTarget','toolGrab'].includes(type))fixture.find('target').onclick();
  }
  if(type==='orderCards')fixture.layer.parentElement.parentElement.parentElement.children[1].children.at(-1).onclick();
  assert.ok(performance.now()-start<200,`${type}: rapid activation`);
  assert.ok(operationComplete(fixture.scene,fixture.state),`${type}: completion from state`);
  assert.equal(fixture.changes,steps.length,`${type}: one notification per commit`);
  fixture.find('a').onclick();assert.equal(fixture.state.step,steps.length);
  fixture.controller.dispose();
 }
 assert.equal(chooseCard({options:['a','b']},3),null);const cards=orderCards([1,0]);cards.toggle(0);cards.toggle(0);assert.deepEqual(cards.selected,[]);cards.move(0,1);assert.deepEqual(cards.selected,[0,1]);
 assert.equal(crossesRegion({x:0,y:0},{x:100,y:100},target),true);assert.equal(advanceScoop({}, {x:0,y:0},target).dipped,false);
}finally{Object.assign(globalThis,saved);}
console.log('PASS: six generic operation types execute production handlers; reject wrong drops; snap/count/restore; coalesced scoop/cancel; tool gating; keyboard cards/order/paused input');
