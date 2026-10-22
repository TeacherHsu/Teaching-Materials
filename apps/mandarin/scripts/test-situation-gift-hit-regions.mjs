import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import lesson from '../src/data/situationLessons/115AG4K12.js';
import {illustrationLayout} from '../src/activities/firstPersonLayout.js';
const scene=lesson.scenes[3],gifts=scene.operation.objects.filter(o=>o.sprite);
assert.equal(gifts.length,2);assert.ok(scene.operation.keepCompleted);
for(const o of gifts){assert.ok(o.width>=9.6);assert.ok(o.minHitSize>=64);assert.ok(o.y<=65 && o.y>=59,'bright tabletop');assert.ok(o.toStep===undefined,'remain visible after placing');}
for(const [w,h] of [[1366,900],[820,1180],[375,812]]){
 const initial=illustrationLayout(w,h,.5,scene.art.aspect);
 const pan=(initial.imageWidth*.5-w/2)/(initial.imageWidth-w);
 const g=illustrationLayout(w,h,pan,scene.art.aspect);
 for(const placed of [false,true]){
  const boxes=gifts.map(o=>{const [x,y]=placed?o.destination:[o.x,o.y],width=Math.max(o.minHitSize,g.imageWidth*o.width/100),height=Math.max(o.minHitSize,g.imageWidth*o.width/100*o.ratio);return {x:g.left+g.imageWidth*x/100-width/2,y:g.top+g.imageHeight*y/100-height/2,w:width,h:height};});
  for(const box of boxes){assert.ok(box.w>=64 && box.h>=64);assert.ok(box.x>=0 && box.x+box.w<=w && box.y>=110 && box.y+box.h<=h,'whole hit region on screen');}
  assert.ok(boxes[0].x+boxes[0].w<=boxes[1].x,'gift hit regions do not overlap');
 }
}
const css=readFileSync(new URL('../src/styles/first-person.css',import.meta.url),'utf8'),runtime=readFileSync(new URL('../src/activities/situation/operations.js',import.meta.url),'utf8');
assert.ok(css.includes('min-width:var(--fp-hit-size,44px); min-height:var(--fp-hit-size,44px)'));
assert.ok(runtime.includes("el.style.setProperty('--fp-hit-size',`${o.minHitSize}px`)"));
assert.ok(css.includes('.fp-keep-completed .fp-object:not(.fp-drop-target) { z-index:1; }'),'table target never intercepts gift hit regions');
assert.ok(css.includes('.fp-page .fp-keep-completed.fp-operation-complete { opacity:1'));
console.log('PASS: 1.6x gifts, 64px minimum CSS hit regions, separate visible placements at three sizes, completed object retention');
