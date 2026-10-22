import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import lesson from '../src/data/situationLessons/115AG6H12.js';
import water from '../src/data/situationLessons/115AG3H04.js';
import shoes from '../src/data/situationLessons/115AG4K12.js';
import {sceneIllustrationLayout} from '../src/activities/firstPersonLayout.js';
import {meterFor,validateSituationLesson} from '../src/data/situationLessons/schema.js';
const [a,b,c,d]=lesson.scenes;
validateSituationLesson(lesson);
assert.ok(a.art.expressionOverlays['sunset.webp']);assert.ok(a.art.expressionOverlays['homeward.webp']);
assert.ok(b.art.expressionOverlays['morning.webp']);assert.ok(b.art.expressionStates['冷靜']['morning.webp']);
assert.equal(meterFor(lesson,b,0,false,{para:1,n:36}).label,'憤怒又絕望');assert.equal(meterFor(lesson,b,0,false,{para:1,n:37}).label,'冷靜');
for(const [n,label] of [[72,'氣惱'],[85,'悲從中來']]){assert.equal(meterFor(lesson,c,0,false,{para:1,n}).label,label);for(const base of c.art.images)assert.ok(c.art.expressionStates[label][base]);}
for(const scene of lesson.scenes)for(const s of scene.strategies || [])for(const o of s.options){if(typeof o==='object' && /臉|表情|警察/.test(o.label)){assert.ok(o.face);assert.ok(Math.abs(o.markerOffset[0])>o.face.width/2);}}
for(const i of [1,2,3]){const pumpkin=d.operation.objects.find(o=>o.action===`pumpkin-${i}`);assert.ok(pumpkin.width>=8);assert.equal(pumpkin.grounded,true);const socket=d.operation.objects.find(o=>o.action===`socket-${i}`);assert.equal(socket.consumedBy,`match-${i}`);assert.equal(d.operation.objects.find(o=>o.action===`match-${i}`).usedFade,true);}
const bag=d.timeline.find(t=>t.kind==='openBag').object;assert.ok(bag.x<40 && bag.y>=80);
for(const [w,h] of [[1366,900],[820,1180],[375,812]]){
 const g0=sceneIllustrationLayout(w,h,.5,d.art);const center=40;const pan=Math.max(0,Math.min(1,(g0.imageWidth*center/100-w/2)/(g0.imageWidth-w || 1)));const g=sceneIllustrationLayout(w,h,pan,d.art);
 // Main actor and all evidence occupy one frame, independent of moving focus.
 for(const x of [18.5,25,44,53,66])assert.ok(g.left+g.imageWidth*x/100>=0 && g.left+g.imageWidth*x/100<=w,`${w}: actor/bag/evidence ${x}`);
 const cinemaTop=h*.74-12;const reminderBottom=w/h<1.4?h*.74-24:238;assert.ok(reminderBottom<cinemaTop,`${w}: reminder clears maximum subtitles`);
}
for(const old of [water,shoes])assert.ok(old.scenes.every(s=>!s.art.portraitFrame && !s.strategies && !s.timeline));
const css=readFileSync(new URL('../src/styles/first-person.css',import.meta.url),'utf8');assert.match(css,/\.fp-face-ring\{[^}]*pointer-events:none[^}]*background:transparent/);assert.match(css,/\.fp-strategy-bag\.is-open::after\{height:13%\}/);
console.log('PASS: expression source timing, unobscured face markers, 2.1x grounded pumpkins, consumed pairs, actor/bag/evidence framing, prediction vs subtitle and legacy opt-out');
