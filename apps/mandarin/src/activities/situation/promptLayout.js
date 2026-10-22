// Viewport-local rectangles; choose a compact rail clear of protected scene regions.
export const overlaps=(a,b)=>a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
export function promptPosition(w,h,protectedBoxes,width=Math.min(340,w-24),height=64){
  for(let y=112;y<h-height-90;y+=16)for(const x of [12,w-width-12]){
    const box={x,y,w:width,h:height};
    if(protectedBoxes.every(p=>!overlaps(box,p)))return box;
  }
  return null; // Hide the visual rail rather than cover a target; accessible label remains.
}
export function placePrompt(status,plane,scene){
  const host=plane.parentElement.parentElement.getBoundingClientRect(),r=plane.getBoundingClientRect();
  const specs=[...scene.operation.objects,...(scene.operation.hoop?[{x:scene.operation.hoop[0],y:scene.operation.hoop[1],width:10,ratio:.6}]:[]),...(scene.operation.protectedRegions || [])];
  const boxes=specs.map(o=>{const w=Math.max(64,r.width*o.width/100),h=Math.max(64,w*(o.ratio || 1));return {x:r.left-host.left+r.width*o.x/100-w/2,y:r.top-host.top+r.height*o.y/100-h/2,w,h};});
  const box=promptPosition(host.width,host.height,boxes);
  status.style.visibility=box?'visible':'hidden';
  if(box){Object.assign(status.style,{left:`${box.x}px`,top:`${box.y}px`,width:`${box.w}px`,height:`${box.h}px`,transform:'none',whiteSpace:'normal'});}
}
