import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import lesson from '../src/data/situationLessons/115AG6H12.js';
import {sceneIllustrationLayout} from '../src/activities/firstPersonLayout.js';
const scene=lesson.scenes[3];
const overlap=(a,b)=>a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
for(const [w,h] of [[1366,900],[820,1180],[375,812]]){
 const card={x:w-228,y:112,w:216,h:56};
 for(const pan of Array.from({length:101},(_,i)=>i/100)){
  const g=sceneIllustrationLayout(w,h,pan,scene.art);
  const protectedObjects=[...scene.operation.objects,...scene.strategies.flatMap(s=>s.options.filter(o=>o.face).map(o=>({...o,width:o.face.width,faceHeight:o.face.height}))),{x:25,y:30,width:7,faceHeight:17}];
  for(const o of protectedObjects){const bw=Math.max(44,g.imageWidth*o.width/100),bh=o.faceHeight?g.imageHeight*o.faceHeight/100:Math.max(44,g.imageWidth*o.width/100*o.ratio);const box={x:g.left+g.imageWidth*o.x/100-bw/2,y:g.top+g.imageHeight*o.y/100-bh/2,w:bw,h:bh};assert.ok(!overlap(card,box),`${w}: prediction clears ${o.action || o.label || 'farmer face'}`);}
 }
 assert.ok(card.y>=84 && card.y+card.h<h*.74-12);
}
const css=readFileSync(new URL('../src/styles/first-person.css',import.meta.url),'utf8');assert.match(css,/\.fp-prediction-reminder\{top:112px;right:12px;width:216px/);assert.doesNotMatch(css,/fp-prediction-reminder\{top:auto/);
console.log('PASS: three-size prediction card clears meter, subtitles, operation/result objects and faces');
