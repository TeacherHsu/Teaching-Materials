import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { illustrationLayout, operationObjects, scoopGesture, woodOutside, groundPile, outsidePile, woodAngle, woodLayout } from '../src/activities/firstPersonLayout.js';
const css=await readFile(new URL('../src/styles/first-person.css',import.meta.url),'utf8');
// The final CSS declarations define each box independently. These are visible UI
// rectangles, never full-width reserved bands. Browser font/layout QA is separate.
const declarations = selector => {
 const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const out={};
 for(const m of css.matchAll(new RegExp(escaped+'\\s*\\{([^}]+)\\}','g'))) for(const d of m[1].split(';')) {const [key,...v]=d.split(':'); if(key?.trim() && v.length)out[key.trim()]=v.join(':').trim();}
 return out;
};
const px=(selector,key)=>{const v=declarations(selector)[key];assert.match(v,/^\d+px$/);return parseFloat(v);};
const overlaps=(a,b)=>a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
let checks=0;
for(const [width,height] of [[1366,900],[820,1180],[375,812]]) {
 const mobile=width<=600;
 // Mobile overrides are explicit CSS rules; fixed dimensions below are read from CSS.
 const moodWidth=mobile?148:160, gap=mobile?4:8;
 assert.ok(css.includes(`width:${moodWidth}px`)); assert.ok(css.includes(`gap:${gap}px`));
 const edge=px('.fp-controls','right'), gear=px('.fp-page .fp-gear','width');
 const top=px('.fp-page .fp-topbar','top'), back=px('.fp-page .fp-home','width');
 const taskHeight=px('.fp-page .fp-operation-status','height');
 const blockers=[{name:'back',x:edge,y:top,w:back,h:back},{name:'act',x:mobile?60:64,y:top,w:px('.fp-page .fp-topbar>span','width'),h:back},{name:'mood',x:width-edge-gear-gap-moodWidth,y:top,w:moodWidth,h:px('.fp-mood','height')},{name:'gear',x:width-edge-gear,y:top,w:gear,h:gear}, {name:'task',x:edge,y:height-edge-taskHeight,w:Math.min(width-24,px('.fp-page .fp-operation-status','width')),h:taskHeight}, {name:'subtitle',x:Math.max(12,(width-760)/2),y:height-12-px('.fp-page .fp-cinema','max-height'),w:Math.min(760,width-24),h:px('.fp-page .fp-cinema','max-height')}];
 for(const [act,objects] of Object.entries(operationObjects)) {
  const extra=act==='1'?groundPile.map(([x,y])=>['stacked',null,x,y,'pile',7,.24]):act==='2'?[[64,69],[64,54]].map(([x,y])=>['gesture',null,x,y,'scoop',18,.78]):act==='4'?outsidePile.map(([x,y])=>['extracted',null,x,y,'out',8,.35]):[];
  for(const [label,,x,y,,percent,ratio] of [...objects,...extra]) {
   const initial=illustrationLayout(width,height);
   assert.ok(initial.imageWidth>=width && initial.imageHeight>=height);
   assert.equal(initial.top,(height-initial.imageHeight)/2);
   const pan=Math.max(0,Math.min(1,(initial.imageWidth*x/100-width/2)/(initial.imageWidth-width || 1)));
   const g=illustrationLayout(width,height,pan), w=Math.max(44,g.imageWidth*percent/100),h=Math.max(44,g.imageWidth*percent/100*ratio);
   const r={x:g.left+g.imageWidth*x/100-w/2,y:g.top+g.imageHeight*y/100-h/2,w,h};
   assert.ok(r.x+r.w>0 && r.x<width && r.y>=0 && r.y+r.h<=height,`${width} act${act} ${label}: visible after focus`);
   for(const b of blockers) {assert.ok(!overlaps(r,b),`${width} act${act} ${label} overlaps ${b.name}`);checks++;}
  }
 }
}
let g=scoopGesture({dipped:false,lifted:false},{x:64,y:70}); assert.ok(g.dipped);assert.ok(scoopGesture(g,{x:64,y:54}).lifted);assert.ok(woodOutside({x:58,y:75}));
console.log(`PASS: cover geometry and ${checks} focused object/UI rectangle checks at three viewport sizes`);

assert.equal(operationObjects[1][0][1],null,'invisible hotspot keeps its geometry; wind module supplies the ceramic sprite');
for(const o of operationObjects[1].filter(o=>o[4].startsWith('wood-'))) { assert.ok(o[3]>=75 && o[3]<=85); assert.ok(o[2]+o[5]/2<40,'clear of door posts and people'); }
assert.ok(groundPile.every(([x,y])=>x>57 && x<65 && y>=78),'pile on floor beside stove');
assert.ok(operationObjects[3].find(o=>o[4]==='ladle')[2]>70,'ladle away from face');
assert.equal(new Set([0,1,2].map(i=>woodAngle(4,i))).size,3);

for(const [width,height] of [[1366,900],[820,1180],[375,812]]) {
 const layout=woodLayout(width,height), initial=illustrationLayout(width,height);
 const pan=Math.max(0,Math.min(1,(initial.imageWidth*layout.center/100-width/2)/(initial.imageWidth-width)));
 const g=illustrationLayout(width,height,pan);
 const specs=[...layout.woods.map(([x,y],i)=>[x,y,layout.width || operationObjects[1][i+1][5],.24]),[61,80,9,.3]];
 const people=[{x:40,y:38,w:12,h:35},{x:72,y:39,w:15,h:35}];
 for(const [x,y,w,ratio] of specs){
  const pw=Math.max(44,g.imageWidth*w/100),ph=Math.max(44,g.imageWidth*w/100*ratio);
  const box={x:g.left+g.imageWidth*x/100-pw/2,y:g.top+g.imageHeight*y/100-ph/2,w:pw,h:ph};
  assert.ok(box.x>=12 && box.x+box.w<=width-12,`${width}: all wood and pile fully in same frame`);
  assert.ok(box.y>74 && box.y+box.h<height-60,`${width}: clear of task bar`);
  for(const p of people) assert.ok(y-Math.max(ph/g.imageHeight*100,0)/2>=p.y+p.h,'floor objects below figures');
 }
}
console.log('PASS: shared wood/pile camera at 1366x900, 820x1180, 375x812, floor/figure and task clearance');
