import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { illustrationLayout, operationObjects, scoopGesture, woodOutside } from '../src/activities/firstPersonLayout.js';
const css=await readFile(new URL('../src/styles/first-person.css',import.meta.url),'utf8');
for(const declaration of ['max-height:82px','bottom:148px; height:104px','bottom:96px; height:48px','bottom:12px; max-height:80px','bottom:256px'])assert.ok(css.includes(declaration),declaration);
assert.ok(!css.includes('clamp('));
const intersects=(a,b)=>a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
let checks=0;
for(const [width,height] of [[1366,900],[820,1180],[375,812]]){
 const blockers=[{name:'.fp-mission',x:0,y:100,w:width,h:86},{name:'.fp-bottom',x:0,y:height-144,w:width,h:48},{name:'.fp-toolbar',x:0,y:height-92,w:width,h:80},{name:'.fp-operation-status',x:0,y:height-252,w:width,h:104},{name:'.fp-view-buttons',x:0,y:height-304,w:width,h:48}];
 for(const [act,objects] of Object.entries(operationObjects)){
  const positions=[];
  // Check all pan positions; off-screen geometry cannot collide with UI.
  for(let n=0;n<=100;n++){
   const g=illustrationLayout(width,height,n/100);
   const additional=act==='1'?[0,1,2].map(i=>['stacked','wood',64,60-i*2,'pile',9,.24]):act==='2'?[[64,69],[64,54]].map(([x,y])=>['scoop path','ladle',x,y,'scoop',18,.78]):act==='4'?[['extracted','wood',58,78,'out',12,.35]]:[];
   for(const [label,,x,y,,percent,ratio] of [...objects,...additional]){
    const w=Math.max(44,g.imageWidth*percent/100),h=Math.max(44,g.imageWidth*percent/100*ratio);
    const margin=12;
    const r={x:g.left+g.imageWidth*x/100-w/2-margin,y:g.top+g.imageHeight*y/100-h/2-margin,w:w+margin*2,h:h+margin*2};
    for(const b of blockers){assert.ok(!intersects(r,b),`${width}×${height} act${act} ${label} pan${n}: ${b.name}`);checks++;}

   }
  }
  const initial=illustrationLayout(width,height), focus={1:.29,2:.61,3:.55,4:.64}[act];
  const pan=initial.imageWidth>width?Math.max(0,Math.min(1,(initial.imageWidth*focus-width/2)/(initial.imageWidth-width))):.5;
  const g=illustrationLayout(width,height,pan);
  for(const [label,,x,y,,percent,ratio] of objects){
   const cx=g.left+g.imageWidth*x/100,cy=g.top+g.imageHeight*y/100;
   positions.push(`${label}=(${Math.round(cx)},${Math.round(cy)}) ${Math.round(g.imageWidth*percent/100)}×${Math.round(g.imageWidth*percent/100*ratio)}${cx<0||cx>width?' [pan to view]':''}`);
  }
  console.log(`${width}×${height} act${act}: ${positions.join('; ')}`);
 }
}
let gesture={dipped:false,lifted:false};
gesture=scoopGesture(gesture,{x:64,y:54});assert.equal(gesture.lifted,false);
gesture=scoopGesture(gesture,{x:20,y:70});assert.equal(gesture.dipped,false);
gesture=scoopGesture(gesture,{x:64,y:70});assert.equal(gesture.dipped,true);
gesture=scoopGesture(gesture,{x:64,y:54});assert.equal(gesture.lifted,true);
assert.ok(woodOutside({x:58,y:75}));assert.equal(woodOutside({x:70,y:75}),false);
assert.equal(woodOutside({x:58,y:20}),false);
console.log(`PASS: ${checks} numeric overlap checks, including hit areas, halos, stack and gesture paths; ordered scoop gesture and stove exit`);
