// One geometry model for runtime and numeric viewport checks (source art 2400×1024).
export function illustrationLayout(width, height, pan = .5, aspect = [2400, 1024]) {
  const imageHeight = Math.max(height, width * aspect[1] / aspect[0]);
  const top = (height - imageHeight) / 2;
  const imageWidth = imageHeight * aspect[0] / aspect[1];
  const left = imageWidth <= width ? (width-imageWidth)/2 : -(imageWidth-width)*pan;
  return { top, left, imageWidth, imageHeight };
}
export { groundPile, outsidePile, operationObjects, woodAngle } from '../data/situationLessons/115AG3H04.js';
// Slab intersection also handles a sparse path whose endpoints straddle the water.
function crossesWater(start, end) {
  if(!start)return false;
  let near=0, far=1;
  for(const [key,min,max] of [['x',54,77],['y',65,76]]) {
    const delta=end[key]-start[key];
    if(delta===0){if(start[key]<min || start[key]>max)return false;continue;}
    const a=(min-start[key])/delta,b=(max-start[key])/delta;
    near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));
    if(near>far)return false;
  }
  return true;
}
export function scoopGesture(previous, point) {
  const inWater=point.x>=54 && point.x<=77 && point.y>=65 && point.y<=76;
  const dipped=Boolean(previous.dipped || inWater || crossesWater(previous.point,point));
  return { point, dipped, lifted: dipped && point.x>=54 && point.x<=77 && point.y<65 };
}
export const woodOutside = p => p.x < 61 && p.y >= 58 && p.y <= 88;

// Compact floor arrangement for portrait cover, clear of the figures above y=74.
export function woodLayout(width, height) {
  const portrait = width / height < 1.4;
  return { center: portrait ? 59 : 44,
    woods: portrait ? [[55.5,85],[59,87],[62.5,85]] : [[24,79],[31,81],[35,77]],
    width: portrait ? 3.4 : null };
}

// Optional lesson framing keeps faces visible during result/read without changing legacy zoom.
export function sceneIllustrationLayout(width,height,pan,art,reading=false,view) {
  const zoom=reading && art.readingZoom!==false;
  const scale=art.viewScales?.[view] || 1;
  const geometry=illustrationLayout(width,height*(zoom?1.3:1)*scale,pan,art.aspect);
  if(zoom)geometry.top-=height*.3;
  if(scale>1)geometry.top-=height*(scale-1)/2;
  return geometry;
}
