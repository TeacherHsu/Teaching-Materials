// One geometry model for runtime and numeric viewport checks (source art 2400×1024).
export function illustrationLayout(width, height, pan = .5) {
  const top = 200, bottom = 270;
  const imageHeight = Math.max(120, height - top - bottom);
  const imageWidth = imageHeight * 2400 / 1024;
  const left = imageWidth <= width ? (width-imageWidth)/2 : -(imageWidth-width)*pan;
  return { top, left, imageWidth, imageHeight };
}
export const operationObjects = {
  1: [['風鈴','bell',29,16,'bell',6,2], ...[0,1,2].map(i=>[`第${i+1}根木柴`,'wood',30+i*8,58+i*2,`wood-${i+1}`,9,.24]), ['柴堆',null,64,62,'pile',12,.4,true]],
  2: [['勺子','ladle-empty',59,67,'ladle',18,.78], ['水面',null,64,69,'water',20,.22,true]],
  3: [['水面',null,62,30,'pot',15,.3], ['勺子','ladle-empty',46,32,'ladle',18,.78], ['火紅木柴','wood-burning',59,68,'fire',12,.35]],
  4: [['師傅示範','tongs',51,59,'demo',16,.3], ...[0,1,2].map(i=>[`第${i+1}根柴火`,'wood-burning',69+i*3,73+i,`wood-${i+1}`,12,.35])],
};
export function scoopGesture(previous, point) {
  const inWater=point.x>=54 && point.x<=77 && point.y>=65 && point.y<=76;
  return { dipped: previous.dipped || inWater, lifted: previous.lifted || (previous.dipped && point.y<61) };
}
export const woodOutside = p => p.x < 61 && p.y >= 58 && p.y <= 88;
