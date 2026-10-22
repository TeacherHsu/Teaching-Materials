// 場景共用的實際尺寸與動作。y 為離地高度，單位是場景公尺。
export const COOKING_SCALE = { x: .78, y: .68, z: .78 };
export const POT = { x: .65, z: -1.4, radius: 1.015 * .78, rimY: 1.57 * .68, waterY: 1.535 * .68, bottomY: 1.04 * .68 };
export const LADLE = { handleLength: .95, bowlRadius: .13, cycle: 4, duration: 8 };
export const ARM = { upper: .31, lower: .29, handRadius: .065 };
export const WORKER = { x: 1.95, z: -.55, yaw: -.4, shoulder: [-.29, 1.25, .04], head: [0, 1.66, .02], headRadius: .31, height: 1.97 };

const add = (a, b) => a.map((v, i) => v + b[i]);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const mul = (a, n) => a.map((v) => v * n);
const dot = (a, b) => a.reduce((n, v, i) => n + v * b[i], 0);
const length = (a) => Math.hypot(...a);
const unit = (a) => mul(a, 1 / Math.max(length(a), 1e-8));
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const smooth = (u) => u * u * u * (u * (u * 6 - 15) + 10);

// 勺柄由勺碗朝外延伸到握點；傾倒沿柄軸旋轉，不讓握點跳開。
const KEYS = [
  { t: 0, bowl: [.9, 1.23, -1.16], direction: [.70, .04, .72], roll: 0, water: 0 },
  { t: .22, bowl: [.82, 1.055, -1.16], direction: [.68, .25, .69], roll: 0, water: 0 },
  { t: .35, bowl: [.82, 1.055, -1.16], direction: [.68, .25, .69], roll: 0, water: 1 },
  { t: .54, bowl: [.84, 1.36, -1.16], direction: [.70, .10, .69], roll: 0, water: 1 },
  { t: .74, bowl: [.84, 1.36, -1.16], direction: [.70, .10, .69], roll: 1.05, water: 0 },
  { t: .86, bowl: [.9, 1.23, -1.16], direction: [.70, .04, .72], roll: 0, water: 0 },
  { t: 1, bowl: [.9, 1.23, -1.16], direction: [.70, .04, .72], roll: 0, water: 0 },
];

export function ladlePose(seconds = null) {
  const u = seconds === null ? 0 : Math.max(0, seconds) % LADLE.cycle / LADLE.cycle;
  let k = 0;
  while (k < KEYS.length - 2 && u > KEYS[k + 1].t) k++;
  const a = KEYS[k], b = KEYS[k + 1], t = smooth(Math.max(0, Math.min(1, (u - a.t) / (b.t - a.t))));
  const bowl = mix(a.bowl, b.bowl, t), direction = unit(mix(a.direction, b.direction, t));
  const roll = a.roll + (b.roll - a.roll) * t;
  const grip = add(bowl, mul(direction, LADLE.handleLength));
  const phase = u < .22 ? 'dip' : u < .35 ? 'scoop' : u < .54 ? 'lift' : u < .74 ? 'pour' : 'return';
  return { bowl, direction, grip, roll, phase, water: a.water + (b.water - a.water) * t,
    stream: phase === 'pour' && roll > .32 ? Math.sin((u - .54) / .2 * Math.PI) : 0 };
}

// 兩節手臂的肘部偏向鍋外，不以一條伸縮長桿代替上臂與前臂。
export function armElbow(shoulder, wrist, pole = [0, 0, 1]) {
  const delta = sub(wrist, shoulder), distance = length(delta), axis = unit(delta);
  const d = Math.max(Math.abs(ARM.upper - ARM.lower) + .0001, Math.min(ARM.upper + ARM.lower - .0001, distance));
  const along = (ARM.upper ** 2 - ARM.lower ** 2 + d ** 2) / (2 * d);
  const height = Math.sqrt(Math.max(0, ARM.upper ** 2 - along ** 2));
  let bend = sub(pole, mul(axis, dot(pole, axis)));
  if (length(bend) < .001) bend = sub([0, 0, 1], mul(axis, axis[2]));
  return add(add(shoulder, mul(axis, along)), mul(unit(bend), height));
}
