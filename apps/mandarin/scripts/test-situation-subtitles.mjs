import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import lesson from '../src/data/situationLessons/115AG4K12.js';
import cooking from '../src/data/situationLessons/115AG3H04.js';
import { sentenceSources, beatLines } from '../src/activities/firstPersonPresentation.js';
const paragraphs=new Map([[1,Array.from({length:100},(_,n)=>`fixture-${n}`)]]);
const sayTexts=new Map(Array.from({length:100},(_,n)=>[`1:${n}`,`voice-${n}`]));
const sources=sentenceSources(lesson,paragraphs,sayTexts);
for(let n=0;n<7;n++)for(const type of ['sentence','say'])assert.ok(!sources.has(`${type}:1:${n}`),'excluded unit must never be a display/voice source');
assert.equal(sources.size,93*2);
const expected={老鞋匠:[25,26,27,47,75,76],顧客:[33,34],妻子:[49,50,78,79,80],小精靈:[54,55,56,85,86,87,88,89,90,94,95]};
for(const [speaker,indices] of Object.entries(expected))for(const n of indices){assert.equal(sources.get(`sentence:1:${n}`),`${speaker}：fixture-${n}`);assert.equal(sources.get(`say:1:${n}`),`voice-${n}`,'speaker never enters speech');}
for(const scene of lesson.scenes)for(const ref of beatLines([...scene.beats.intro,...scene.beats.read]))assert.ok(sources.has(`sentence:${ref.para}:${ref.n}`));
assert.equal(sources.get('sentence:1:7'),'fixture-7','narration has no invented speaker');
// Legacy quote continuation and closing behavior remain unchanged.
const legacy=sentenceSources(cooking,new Map([[1,['敘述，','「甲，','乙。」','敘述。']]]),new Map());
assert.equal(legacy.get('sentence:1:1'),'師傅：「甲，');assert.equal(legacy.get('sentence:1:2'),'師傅：乙。」');assert.equal(legacy.get('sentence:1:3'),'敘述。');
const page=readFileSync(new URL('../src/pages/FirstPersonPage.js',import.meta.url),'utf8');
assert.ok(page.includes('sources = sentenceSources(config, paragraphs, sayTexts)'),'page uses the tested source builder');
console.log('PASS: excluded units never enter subtitle/voice sources; four explicit speakers, unlabeled speech and legacy 師傅');
