import assert from 'node:assert/strict';
import { readdir, stat } from 'node:fs/promises';
import { validateSituationLesson, validateUnlockedLesson, meterFor } from '../src/data/situationLessons/schema.js';
const directory=new URL('../src/data/situationLessons/',import.meta.url);
let count=0;
for(const file of await readdir(directory)){
  if(!file.endsWith('.js') || ['index.js','schema.js'].includes(file))continue;
  const {default:lesson}=await import(new URL(file,directory));validateSituationLesson(lesson);count++;
  assert.equal(file,`${lesson.lessonId}.js`);
  for(const scene of lesson.scenes){
    const assets=[...scene.art.images,...Object.values(scene.art.expressionOverlays || {}),...Object.values(scene.art.expressionStates || {}).flatMap(Object.values),...scene.operation.objects.filter(o=>o.sprite).map(o=>`sprites/${o.sprite}.webp`),...scene.questions.flatMap(q=>(q.images || []).map(f=>`sprites/${f}.webp`))];
    for(const file of assets){const info=await stat(new URL(`../public/${lesson.assetBase}${file}`,import.meta.url));assert.ok(info.size>0 && info.size<=(scene.art.aspect[0]===2400 && !file.startsWith('sprites/')?400:300)*1024,`asset limit: ${file}`);}
  }
  const mutate=fn=>{const copy=structuredClone(lesson);fn(copy);assert.throws(()=>validateSituationLesson(copy));};
  mutate(l=>l.scenes[0].operation.type='unknown');
  mutate(l=>l.scenes[0].operation.objects[0].x=101);
  mutate(l=>l.scenes[0].operation.objects[0].y=-1);
  mutate(l=>l.meter.states[0]='');
  mutate(l=>l.scenes[0].beats.intro[0].sha[0]='bad');
  mutate(l=>l.scenes[0].beats.read=[]);
  mutate(l=>l.sentenceCount++);
  mutate(l=>l.scenes[0].art.views[l.scenes[0].view]=1.1);
  mutate(l=>l.scenes[0].meter[0].state=999);
  if(lesson.lessonId==='115AG3H04'){
    assert.equal(lesson.sentenceCount,45);
    assert.deepEqual([0,1,2,3,4].map(n=>meterFor(lesson,lesson.scenes[3],n).level),[3,3,2,1,0]);
    assert.equal(meterFor(lesson,lesson.scenes[3],4,true).label,'用心記住');
  }
}
assert.ok(count>0);
// Synthetic unlocked fixture: tests digest and source-word checks without storing lesson text.
const {default:original}=await import('../src/data/situationLessons/115AG3H04.js');
const synthetic=structuredClone(original);synthetic.lessonId='synthetic';
const paragraphs=new Map(synthetic.paragraphCounts.map((n,i)=>[i+1,Array.from({length:n},(_,j)=>`fixture-${i}-${j}`)]));
const hash=async text=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(v=>v.toString(16).padStart(2,'0')).join('').slice(0,8);
for(const s of synthetic.scenes){delete s.operation.profile;s.operation.type='observe';
  for(const r of [...s.clues.flatMap(c=>c.refs),...s.questions.flatMap(q=>q.refs),...s.beats.intro,...s.beats.read])r.sha=await Promise.all(r.sentences.map(n=>hash(paragraphs.get(r.para)[n])));
}
for(const r of synthetic.ending.refs)r.sha=await Promise.all(r.sentences.map(n=>hash(paragraphs.get(r.para)[n])));
synthetic.meter.states=synthetic.meter.states.map(()=> 'fixture');
await validateUnlockedLesson(synthetic,paragraphs);
synthetic.meter.states[0]='absent';await assert.rejects(()=>validateUnlockedLesson(synthetic,paragraphs),/meter source word/);
synthetic.meter.states[0]='fixture';paragraphs.get(1)[0]='changed';await assert.rejects(()=>validateUnlockedLesson(synthetic,paragraphs),/unlocked hash/);
console.log(`PASS: ${count} lesson schemas; full coverage, hashes, meter terms/events, types, coordinates; unlocked hash and source-word rejection`);

const {default:shoemaker}=await import('../src/data/situationLessons/115AG4K12.js');
for(const change of [
 l=>l.excludedUnits[0].sentences.push(0),
 l=>l.excludedUnits[0].sentences.push(100),
 l=>l.storySentenceCount=100,
 l=>delete l.speakers['1:25'],
 l=>l.speakers['1:25']='故事中的人物',
 l=>{l.scenes[0].beats.intro[0].sentences.unshift(0);l.scenes[0].beats.intro[0].sha.unshift('fb5d242b');},
 l=>l.scenes[3].operation.objects[0].minHitSize=32,
]){const copy=structuredClone(shoemaker);change(copy);assert.throws(()=>validateSituationLesson(copy));}
console.log('PASS: story-only coverage rejects excluded refs, invalid exclusions/count, missing speakers and undersized hit regions');
