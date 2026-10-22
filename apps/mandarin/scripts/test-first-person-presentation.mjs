import assert from 'node:assert/strict';
import { FIRST_PERSON_LESSON as config } from '../src/data/firstPersonLesson.js';
import { moodFor, beatLines, toggleOrder, reorderCards, createCardOrder } from '../src/activities/firstPersonPresentation.js';
assert.equal(config.version,9);
assert.deepEqual([0,1,2,3].map(n=>moodFor(2,n).level),[1,2,3,3]);
assert.equal(moodFor(1,4).level,0);
assert.equal(moodFor(3,3).level,3);
assert.deepEqual([0,1,2,3,4].map(n=>moodFor(4,n).level),[3,3,2,1,0]);
const seen=[];
for(const scene of config.scenes) for(const {para,n} of beatLines([...scene.beats.intro,...scene.beats.read])) seen.push(`${para}:${n}`);
assert.equal(seen.length,45); assert.equal(new Set(seen).size,45);
console.log('PASS: event-driven mood and exactly 45 unique beat subtitles');

assert.equal(moodFor(4,4).label,'平靜');
assert.equal(moodFor(4,4,true).label,'用心記住');
for(const scene of config.scenes) for(const q of scene.questions) {
 for(const text of [q.explanation,...q.why,...q.hints]) {
  if(scene.act<=2)assert.doesNotMatch(text,/抽|柴火變小|不再沸騰|釜底抽薪/);
  assert.doesNotMatch(text,/後來|後面的劇情|接下來會/);
 }
}


// Exercise the same card controller used by the rendered question, including reset.
const cards=createCardOrder([2,0,1]);
cards.toggle(2);cards.toggle(0);assert.deepEqual(cards.selected,[2,0]);
cards.toggle(2);assert.deepEqual(cards.selected,[0]);assert.equal(cards.selected.indexOf(0)+1,1);
cards.move(2,1);assert.deepEqual(cards.order,[0,2,1]);assert.deepEqual(cards.selected,cards.order);
cards.reset();assert.deepEqual(cards.selected,[]);assert.deepEqual(cards.order,[2,0,1]);
for(const i of [0,1,2])cards.toggle(i);
assert.deepEqual(cards.selected,config.scenes[3].questions[0].answer);
for(const i of cards.order)assert.deepEqual(reorderCards(cards.order,i,i),cards.order,'drop on itself');
