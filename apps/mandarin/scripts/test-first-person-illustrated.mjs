import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { FIRST_PERSON_ILLUSTRATIONS as acts, FIRST_PERSON_LESSON } from '../src/data/firstPersonLesson.js';
for (const scene of FIRST_PERSON_LESSON.scenes) {
  const act = acts[scene.act]; assert.ok(act);
  for (const clue of scene.clues) assert.ok(act.hotspots[clue.object], `${scene.id}: ${clue.object}`);
}
for (const act of Object.values(acts)) {
  for (const point of Object.values(act.hotspots)) for (const v of point) assert.ok(Number.isFinite(v) && v >= 0 && v <= 100);
  for (const file of act.images) {
    const url = new URL(`../public/assets/first-person/115AG3H04/${file}`, import.meta.url);
    assert.ok((await stat(url)).size <= 400 * 1024, file);
    const b = await readFile(url); assert.equal(b.toString('ascii', 8, 12), 'WEBP');
  }
}
// Walk actual page dependency graph, including literal dynamic imports.
const visited = new Set();
async function walk(url) {
  if (visited.has(url.href)) return; visited.add(url.href);
  const source = await readFile(url, 'utf8');
  assert.ok(!/firstPersonScene|vendor\/three|RG3DKit|from\s+['"]three/.test(source), url.pathname);
  for (const match of source.matchAll(/(?:from\s*|import\s*\(\s*)['"]([^'"]+)['"]/g)) {
    if (match[1].startsWith('.') && match[1].endsWith('.js')) await walk(new URL(match[1], url));
  }
}
await walk(new URL('../src/pages/FirstPersonPage.js', import.meta.url));
console.log('PASS: four acts, image limits, hotspot bounds and page graph without Three.js');
// After a production build, inspect emitted executable chunks as well.
const { readdir } = await import('node:fs/promises');
const dist = new URL('../dist/assets/', import.meta.url);
try {
  for (const name of await readdir(dist)) if (name.endsWith('.js')) {
    const code = await readFile(new URL(name, dist), 'utf8');
    assert.ok(!/WebGLRenderer|RG3DKit|vendor\/three/.test(code), `Three.js in ${name}`);
  }
  console.log('PASS: production chunks contain no Three.js renderer or loader');
} catch (error) { if (error.code === 'ENOENT') console.log('SKIP: production chunks absent; run npm run build and repeat'); else throw error; }
