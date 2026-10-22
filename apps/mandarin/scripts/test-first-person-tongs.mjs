import assert from 'node:assert/strict';
import {tongsState,tongsAction,tongsWoodLayout,outsideFurnace} from '../src/activities/firstPersonTongs.js';
import {illustrationLayout} from '../src/activities/firstPersonLayout.js';
import {operationState,operate,heatFor} from '../src/activities/firstPersonInteraction.js';
import {FIRST_PERSON_LESSON} from '../src/data/firstPersonLesson.js';
const scene=FIRST_PERSON_LESSON.scenes[3];
for(const mode of ['drag','click','keyboard']){
 const state=operationState(scene);operate(scene,state,'demo');const tool=tongsState();
 for(let i=1;i<=3;i++){
  assert.equal(tongsAction(tool,`wood-${i}`),false);
  assert.equal(tongsAction(tool,'take'),'ready');assert.equal(tongsAction(tool,`wood-${i}`),'gripped');
  assert.equal(tongsAction(tool,'wood-other'),false);
  assert.equal(tongsAction(tool,'drop',{x:73,y:75}),'rebound');assert.equal(state.step,i);
  tongsAction(tool,'take');tongsAction(tool,`wood-${i}`);
  const result=tongsAction(tool,'drop',{x:61,y:84});assert.equal(result,`wood-${i}`);assert.ok(operate(scene,state,result));
  assert.equal(state.collected.length,i);assert.ok(Math.abs(heatFor(scene,state)-(1-i/3))<1e-9);
 }
 assert.equal(state.step,4,mode);
}
for(const [w,h] of [[1366,900],[820,1180],[375,812]]){
 const g=illustrationLayout(w,h);const logs=tongsWoodLayout(g.imageWidth,g.imageHeight);
 const left=w/2-g.imageWidth*.73;
 for(const a of logs){assert.equal(a.size,64);const x=left+g.imageWidth*a.x/100,y=g.top+g.imageHeight*a.y/100;assert.ok(x-32>=0 && x+32<=w);assert.ok(y-32>0 && y+32<h-60);}
 for(let i=0;i<2;i++)assert.ok((logs[i+1].x-logs[i].x)*g.imageWidth/100>=69.99);
}
assert.ok(outsideFurnace({x:81,y:75}));assert.ok(outsideFurnace({x:73,y:87}));
assert.equal(operationState(scene,{step:1,tongsDemoSeen:true}).tongsDemoSeen,true);
console.log('PASS: shared tongs flow, rebound, count/heat, disjoint 64px targets at three sizes; DOM controls require Claude QA');
