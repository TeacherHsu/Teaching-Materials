import { createServer as createHttpServer } from 'node:http';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';
const root=await mkdtemp(join(tmpdir(),'situation-registry-'));
let server;
const httpServer=createHttpServer();
try {
  await writeFile(join(root,'index.js'),await readFile(new URL('../src/data/situationLessons/index.js',import.meta.url),'utf8'));
  for(const id of ['115AG3H04','next-lesson'])await writeFile(join(root,`${id}.js`),`export default {lessonId:'${id}'};`);
  server=await createServer({root,configFile:false,server:{middlewareMode:true,hmr:{server:httpServer}},optimizeDeps:{noDiscovery:true,include:[]},appType:'custom'});
  const {situationLessons,getSituationLesson}=await server.ssrLoadModule('/index.js');
  assert.deepEqual(Object.keys(situationLessons).sort(),['115AG3H04','next-lesson']);
  assert.equal(getSituationLesson('next-lesson').lessonId,'next-lesson');assert.equal(getSituationLesson('missing'),null);
} finally {await server?.close();await rm(root,{recursive:true,force:true});}
console.log('PASS: actual Vite glob discovers a new lesson file without registry/route edits');

// Verify the real lesson file reaches the unchanged public getter as well.
const appRoot=new URL('../',import.meta.url).pathname;
const appHttpServer=createHttpServer();
const app=await createServer({root:appRoot,configFile:false,server:{middlewareMode:true,hmr:{server:appHttpServer}},optimizeDeps:{noDiscovery:true,include:[]},appType:'custom'});
try {
 const {getFirstPersonLesson}=await app.ssrLoadModule('/src/data/firstPersonLesson.js');
 assert.equal(getFirstPersonLesson('115AG4K12').scenes.length,4);
 assert.equal(getFirstPersonLesson('115AG3H04').sentenceCount,45);
}finally{await app.close();}
console.log('PASS: real Vite getter exposes shoemaker and retains the cooking lesson');
const {default:shoemaker}=await import('../src/data/situationLessons/115AG4K12.js');
const {default:cooking}=await import('../src/data/situationLessons/115AG3H04.js');
const {storyUnitKeys}=await import('../src/data/situationLessons/schema.js');
assert.equal(storyUnitKeys(shoemaker).length,93);
assert.equal(storyUnitKeys(shoemaker)[0],'1:7');
assert.equal(storyUnitKeys(cooking).length,45);
assert.equal(cooking.ui.speaker,'師傅');
assert.equal(cooking.excludedUnits,undefined);
assert.ok(cooking.scenes.every(s=>s.art.readingZoom===undefined));
console.log('PASS: registry lessons retain independent story boundaries, speakers and framing defaults');
