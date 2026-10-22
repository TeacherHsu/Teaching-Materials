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
