import assert from 'node:assert/strict';
import { ARM, POT, LADLE, WORKER, ladlePose, armElbow } from '../src/activities/firstPersonMotion.js';

const distance = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
const worldPoint = ([x, y, z]) => [WORKER.x + Math.cos(WORKER.yaw) * x + Math.sin(WORKER.yaw) * z, y, WORKER.z - Math.sin(WORKER.yaw) * x + Math.cos(WORKER.yaw) * z];
const shoulder = worldPoint(WORKER.shoulder), head = worldPoint(WORKER.head);
assert.ok(POT.rimY < WORKER.height * .6, '鍋沿不得接近人物胸口或下巴');
assert.ok(POT.waterY < POT.rimY, '水面低於鍋緣');
const phases = new Set();
let last;
for (let i = 0; i <= 1600; i++) {
  const pose = ladlePose(i * LADLE.duration / 1600); phases.add(pose.phase);
  const elbow = armElbow(shoulder, pose.grip);
  assert.ok(distance(shoulder, pose.grip) < ARM.upper + ARM.lower, '手不能超過手臂實際可達距離');
  assert.ok(Math.abs(distance(shoulder, elbow) - ARM.upper) < 1e-6, '上臂長度固定');
  assert.ok(Math.abs(distance(elbow, pose.grip) - ARM.lower) < 1e-6, '前臂長度固定');
  assert.ok(Math.abs(distance(pose.bowl, pose.grip) - LADLE.handleLength) < 1e-6, '握點固定在勺柄末端');
  assert.ok(Math.hypot(pose.grip[0] - POT.x, pose.grip[2] - POT.z) > POT.radius + ARM.handRadius, '整個手掌位於鍋外');
  assert.ok(distance(pose.grip, head) > WORKER.headRadius + ARM.handRadius + .02, '手掌不得穿進人物頭部');
  for (const [a, b] of [[shoulder, elbow], [elbow, pose.grip]]) for (let j = 0; j <= 20; j++) {
    const p = a.map((v, k) => v + (b[k] - v) * j / 20);
    assert.ok(p[1] > POT.rimY + .06 || Math.hypot(p[0] - POT.x, p[2] - POT.z) > POT.radius + .075, '手臂不得穿過鍋壁或水面');
  }
  if (pose.stream > .01) {
    assert.equal(pose.phase, 'pour');
    assert.ok(pose.bowl[1] - LADLE.bowlRadius > POT.waterY + .1, '抬高後才開始倒水');
    assert.ok(Math.hypot(pose.bowl[0] - POT.x, pose.bowl[2] - POT.z) + LADLE.bowlRadius < POT.radius, '水倒回鍋內');
  }
  if (last) {
    assert.ok(distance(pose.bowl, last.bowl) < .012, '關鍵姿勢之間不可跳位');
    assert.ok(distance(pose.grip, last.grip) < .012, '握點不能突然跳動');
    assert.ok(Math.abs(pose.roll - last.roll) < .04, '勺碗傾倒不能突然翻轉');
  }
  last = pose;
}
assert.deepEqual([...phases].sort(), ['dip', 'lift', 'pour', 'return', 'scoop']);
assert.ok(distance(ladlePose(0).bowl, ladlePose(LADLE.cycle - .00001).bowl) < 1e-6, '循環接點回到同一待機姿勢');
console.log('✅ 1601個舀水姿勢：人物比例、固定臂長、握持、避開鍋體、倒回鍋內與循環連續性通過');
