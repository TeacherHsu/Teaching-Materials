import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { playChime, chimeMotion, mountChimeWind } from '../src/activities/firstPersonChime.js';
assert.equal(chimeMotion(true), 'fp-chime-glow');
assert.equal(chimeMotion(false), 'fp-wind-active');
let requested = 0;
playChime(false, () => { requested++; throw Error('must never construct AudioContext'); });
assert.equal(requested, 0, 'sound off must not request/construct AudioContext');
const nodes = [], calls = [];
function node(kind) {
 const n = {kind, connect(){}, disconnect(){}, start(t){calls.push([kind,'start',t]);}, stop(t){calls.push([kind,'stop',t]);},
  frequency:{value:0}, Q:{value:0}, gain:{events:[],setValueAtTime(...v){this.events.push(['set',...v]);},exponentialRampToValueAtTime(...v){this.events.push(['exp',...v]);},linearRampToValueAtTime(...v){this.events.push(['linear',...v]);}}};
 nodes.push(n);return n;
}
let resumed = false;
const audio={currentTime:10,sampleRate:48000,destination:{},resume(){resumed=true;return Promise.resolve();},createOscillator:()=>node('osc'),createGain:()=>node('gain'),createBiquadFilter:()=>node('filter'),createBufferSource:()=>node('noise'),createBuffer:(_,len)=>({getChannelData:()=>new Float32Array(len)})};
playChime(true,()=>audio,()=>.5);
assert.ok(resumed, 'resume synchronously within the user gesture');
const oscillators=nodes.filter(n=>n.kind==='osc');assert.equal(oscillators.length,12);
oscillators.slice(0,4).forEach((n,i)=>assert.ok(Math.abs(n.frequency.value-[1250,3450,6750,11162.5][i])<1e-8));
assert.deepEqual(calls.filter(c=>c[0]==='osc' && c[1]==='start').map(c=>c[2]),[...Array(4).fill(10.16),...Array(4).fill(10.62),...Array(4).fill(11.09)]);
const gains=nodes.filter(n=>n.kind==='gain');
assert.ok(gains[0].gain.events[1][1]>gains[4].gain.events[1][1] && gains[4].gain.events[1][1]>gains[8].gain.events[1][1]);
assert.equal(nodes.find(n=>n.kind==='filter').type,'bandpass');
assert.equal(nodes.find(n=>n.kind==='filter').frequency.value,750);
assert.ok(gains.at(-1).gain.events[1][1]<gains[0].gain.events[1][1]);
playChime(true,()=>null);playChime(true,()=>{throw Error('unsupported');});
// Exercise actual reduced-motion mount and cleanup without browser access.
class Element {
 constructor(){this.children=[];this.style={setProperty(){}};this.classes=new Set();this.classList={add:(...v)=>v.forEach(x=>this.classes.add(x)),remove:(...v)=>v.forEach(x=>this.classes.delete(x)),contains:x=>this.classes.has(x)};}
 setAttribute(){} append(...v){this.children.push(...v);} remove(){this.removed=true;}
}
const original={document:globalThis.document,Image:globalThis.Image};
globalThis.document={createElement:()=>new Element()};globalThis.Image=class extends Element {};
try {
 let reduced=true; const plane=new Element(),wind=mountChimeWind(plane,'/art/',()=>reduced),layer=plane.children[0];
 wind.blow();assert.ok(layer.classList.contains('fp-chime-glow'));assert.ok(!layer.classList.contains('fp-wind-active'));
 reduced=false;wind.blow();assert.ok(layer.classList.contains('fp-wind-active'));
 reduced=true;wind.updateMotion();assert.ok(!layer.classList.contains('fp-wind-active'));assert.ok(layer.classList.contains('fp-chime-glow'));
 wind.dispose();assert.ok(layer.removed);
} finally {Object.assign(globalThis,original);}
for (const file of ['act1-entrance.webp','sprites/chime.webp']) {
 const url=new URL(`../public/assets/first-person/115AG3H04/${file}`,import.meta.url);
 assert.ok((await stat(url)).size<=300*1024,file);
 const bytes=await readFile(url);assert.equal(bytes.toString('ascii',8,12),'WEBP');
 if(file.startsWith('sprites/'))assert.ok(bytes.includes(Buffer.from('ALPH')) || bytes.toString('ascii',12,16)==='VP8L');
}
const interaction=await readFile(new URL('../src/activities/firstPersonInteraction.js',import.meta.url),'utf8');
assert.ok(interaction.includes('把地上的木柴搬到灶旁的柴堆'));assert.ok(interaction.includes("status.setAttribute('aria-live','polite')"));
const css=await readFile(new URL('../src/styles/first-person.css',import.meta.url),'utf8');
assert.match(css,/@media\(prefers-reduced-motion:reduce\)[\s\S]*?\.fp-chime-weather \.fp-wind-streak[\s\S]*?display:none/);
console.log('PASS: chime assets, silent lazy context, synchronous resume, 3 damped strikes, wind noise, reduced-motion branch and cleanup');
