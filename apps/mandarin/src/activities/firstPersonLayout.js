// One geometry model for runtime and numeric viewport checks (source art 2400×1024).
export function illustrationLayout(width, height, pan = .5) {
  const imageHeight = Math.max(height, width * 1024 / 2400);
  const top = (height - imageHeight) / 2;
  const imageWidth = imageHeight * 2400 / 1024;
  const left = imageWidth <= width ? (width-imageWidth)/2 : -(imageWidth-width)*pan;
  return { top, left, imageWidth, imageHeight };
}
export const groundPile = [[59,80],[62,81],[60.5,78.5]];
export const outsidePile = [[56,80],[60,81],[64,80]];
export const operationObjects = {
  1: [['風鈴',null,29.5,17,'bell',5,1],
    ['第1根木柴','wood',24,79,'wood-1',9,.24],
    ['第2根木柴','wood',31,81,'wood-2',10,.24],
    ['第3根木柴','wood',35,77,'wood-3',8.5,.24],
    ['柴堆',null,61,80,'pile',9,.3,true]],
  2: [['勺子','ladle-empty',59,67,'ladle',18,.78], ['水面',null,64,69,'water',20,.22,true]],
  3: [['水面',null,62,30,'pot',15,.3], ['勺子','ladle-empty',77,43,'ladle',12,.78], ['火紅木柴','wood-burning',59,68,'fire',12,.35]],
  4: [['師傅示範','tongs',51,59,'demo',16,.3],
    ['第1根柴火','wood-burning',71,71,'wood-1',7,.35],
    ['第2根柴火','wood-burning',74,76,'wood-2',8,.35],
    ['第3根柴火','wood-burning',72,79,'wood-3',6.5,.35]],
};
export const woodAngle = (act, index) => (act === 1 ? [-14,11,-6] : [-19,22,-9])[index];
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
