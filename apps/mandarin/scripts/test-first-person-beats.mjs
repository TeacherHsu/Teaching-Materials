import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FIRST_PERSON_LESSON as lesson} from '../src/data/firstPersonLesson.js';
import {beatLines,nextBeat,subtitleDuration,createPlayback,lockBeatObjects} from '../src/activities/firstPersonPresentation.js';
const expected=[9,12,14,10].flatMap((count,i)=>Array.from({length:count},(_,n)=>`${i+1}:${n}`));
const actual=lesson.scenes.flatMap(s=>beatLines([...s.beats.intro,...s.beats.read]).map(r=>`${r.para}:${r.n}`));
assert.deepEqual(actual,expected,'45 references once and in original order across acts');
assert.equal(new Set(actual).size,45);
for(const s of lesson.scenes){let beat='intro';const visited=[];while(beat){visited.push(beat);beat=nextBeat(beat);}assert.deepEqual(visited,['intro','act','result','read','question']);assert.ok(s.beats.result.duration>=1500 && s.beats.result.duration<=2000);}
assert.equal(subtitleDuration('a'),2500);assert.equal(subtitleDuration('a'.repeat(20)),3600);assert.equal(subtitleDuration('a'.repeat(50)),9000);
const play=createPlayback();assert.equal(play.automatic,true);assert.equal(play.delay('a'),2500);play.toggle();assert.equal(play.delay('a'),null);play.toggle();assert.equal(play.delay('a'.repeat(20)),3600);
const buttons=[false,true].map(disabled=>({disabled,dataset:{},hasAttribute(){return 'beatDisabled' in this.dataset;}}));
const plane={querySelectorAll:()=>buttons,classList:{toggle(){}}};
for(const beat of ['intro','act','result','read']){lockBeatObjects(plane,beat!=='act');assert.equal(plane.inert,beat!=='act');if(beat!=='act')assert.ok(buttons.every(b=>b.disabled));else assert.deepEqual(buttons.map(b=>b.disabled),[false,true]);}
const page=readFileSync(new URL('../src/pages/FirstPersonPage.js',import.meta.url),'utf8');
assert.match(page,/subtitleQueue=beatLines\(scene.beats\[value\]\)/);
assert.match(page,/value==='intro' \|\| value==='read'/,'only reading beats create cinema');
assert.match(page,/subtitleQueue=\[\];nextSubtitle\(\)/,'skip finishes opening queue');
assert.match(page,/playback.toggle\(\);clearTimeout\(subtitleTimer\)/,'manual switch cancels autoplay');
assert.match(page,/subtitle\?\.remove\(\); subtitle=null; beat=value/,'act and result remove subtitle DOM');
assert.match(page,/ref.para===4 && ref.n===7/,'remember state is indexed, not substring dependent');
assert.deepEqual(lesson.scenes[2].beats.intro,[]);
console.log('PASS: four beats, ordered 45-clause coverage, timings, skip/manual wiring, real object lock/restore, subtitle exclusion');
