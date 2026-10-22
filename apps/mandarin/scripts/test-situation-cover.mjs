import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {sceneIllustrationLayout} from '../src/activities/firstPersonLayout.js';
let checks=0;
for(const file of readdirSync(new URL('../src/data/situationLessons/',import.meta.url)).filter(f=>/^\d.*\.js$/.test(f))){
 const {default:lesson}=await import(`../src/data/situationLessons/${file}`);
 for(const scene of lesson.scenes)for(const [w,h] of [[1366,900],[820,1180],[375,812]])for(const beat of ['intro','openBag','strategy','act','result','read','question'])for(const pan of [0,.33,.5,.75,1]){
  const g=sceneIllustrationLayout(w,h,pan,scene.art,['result','read'].includes(beat));
  assert.ok(g.imageHeight>=h && g.imageWidth>=w,`${file}/${scene.id}/${beat}: cover`);
  assert.ok(g.top<=0 && g.top+g.imageHeight>=h && g.left<=0 && g.left+g.imageWidth>=w-1e-8,`${file}/${scene.id}/${beat}: no borders`);checks++;
 }
}
console.log(`PASS: ${checks} all-lesson/scene/beat/viewport/pan cover checks`);
