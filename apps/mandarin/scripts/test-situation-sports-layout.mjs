import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import lesson from '../src/data/situationLessons/115AG4K03.js';
import {sceneIllustrationLayout} from '../src/activities/firstPersonLayout.js';
import {promptPosition,overlaps} from '../src/activities/situation/promptLayout.js';
for(const scene of lesson.scenes.slice(1))for(const [w,h] of [[1366,900],[820,1180],[375,812]])for(let pan=0;pan<=1;pan+=.01){
 const g=sceneIllustrationLayout(w,h,pan,scene.art);
 const specs=[...scene.operation.objects,...(scene.operation.hoop?[{x:scene.operation.hoop[0],y:scene.operation.hoop[1],width:10,ratio:.6}]:[]),...(scene.operation.protectedRegions || [])];
 const boxes=specs.map(o=>{const width=Math.max(64,g.imageWidth*o.width/100),height=Math.max(64,width*(o.ratio || 1));return {x:g.left+g.imageWidth*o.x/100-width/2,y:g.top+g.imageHeight*o.y/100-height/2,w:width,h:height};});
 const p=promptPosition(w,h,boxes);assert.ok(p,`${scene.id}/${w}/${pan}: prompt has room`);assert.ok(boxes.every(b=>!overlaps(p,b)),'prompt clears hoop, operation targets and protected faces');
}
const {statSync}=await import('node:fs');
assert.ok(statSync(new URL('../public/assets/situation/115AG4K03/sprites/holding-hands.webp',import.meta.url)).size<120*1024);
console.log('PASS: sports prompts clear protected hoop/objects/faces across three viewports and all pans; paired hands asset budget');
