import assert from 'node:assert/strict';
import {stat,readFile} from 'node:fs/promises';
import { FIRST_PERSON_LESSON as config } from '../src/data/firstPersonLesson.js';
import {operationState,operate,operationComplete,heatFor} from '../src/activities/firstPersonInteraction.js';
import {freshProgress,restoreProgress,canAnswer} from '../src/activities/firstPersonCore.js';
for(const scene of config.scenes){
 const state=operationState(scene); assert.equal(operationComplete(scene,state),false);
 assert.equal(operate(scene,state,'wrong'),false); assert.equal(state.step,0);
 for(const action of scene.operation.steps){ assert.equal(operate(scene,state,action),true); assert.ok(heatFor(scene,state)>=0 && heatFor(scene,state)<=1); if(scene.act===2) assert.equal(heatFor(scene,state),1); }
 assert.ok(operationComplete(scene,state)); if(scene.act===4)assert.equal(heatFor(scene,state),0);
 assert.equal(operate(scene,state,'wrong'),false); assert.equal(operate(scene,state,undefined),false);
 const raw=freshProgress(config); raw.scenes[0].found=['paragraph']; assert.equal(canAnswer(config.scenes[0],raw.scenes[0]),false);
 assert.deepEqual(restoreProgress(config,raw).scenes[0].found,[]);
}
for(const name of ['ladle-empty','ladle-full','wood','wood-burning','tongs','bell','anxious','relaxed','relieved']){
 const url=new URL(`../public/assets/first-person/115AG3H04/sprites/${name}.webp`,import.meta.url);
 assert.ok((await stat(url)).size<=120*1024,name); const bytes=await readFile(url); assert.equal(bytes.toString('ascii',8,12),'WEBP'); assert.ok(bytes.includes(Buffer.from('ALPH')) || (bytes.toString('ascii',12,16)==='VP8L'),'alpha required');
}
assert.deepEqual(config.scenes.map(s=>s.operation.steps.length),[4,3,3,4]);
assert.equal(config.idiomRefs[0].para,4);
console.log('PASS: ordered operations, wrong action unchanged, heat, read gate, alpha sprites and limits');
// Partial operations survive v5 restoration; a completed operation alone never
// fabricates reading/question completion or unlocks the next act.
{
 const p=freshProgress(config); p.scenes[0].operation.step=2;
 const restored=restoreProgress(config,p); assert.equal(restored.scenes[0].operation.step,2); assert.equal(restored.scenes[0].done,false);
 p.scenes[0].operation.step=4; p.scenes[0].done=true; p.scenes[0].questionIndex=1;
 assert.equal(restoreProgress(config,p).scenes[0].done,false);
}
// Students may collect/extract any remaining log; repeat picking cannot count twice.
for(const scene of config.scenes.filter(s=>[1,4].includes(s.act))){
 const state=operationState(scene); assert.ok(operate(scene,state,scene.operation.steps[0]));
 assert.ok(operate(scene,state,'wood-3')); assert.equal(operate(scene,state,'wood-3'),false);
 assert.ok(operate(scene,state,'wood-1')); assert.ok(operate(scene,state,'wood-2'));
 assert.ok(operationComplete(scene,state)); assert.deepEqual(operationState(scene,state),state);
}
