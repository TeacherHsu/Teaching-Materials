/* 使用 vendor 的真實幾何、矩陣；僅 DOM、WebGL renderer、排程採替身，不代表視覺驗收。 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
function environment({ calm = false, narrow = false, reduced = false, three = true, rendererFails = false } = {}) {
  const media = new Map(), observers = [], frames = new Map(), timers = new Map(), scripts = [], texts = [];
  let now = 0, id = 0, renderCount = 0;
  function node(tag) {
    const events = new Map();
    return { tag, children: [], isConnected: true, style: { setProperty(k, v) { this[k] = v; } }, dataset: {}, hidden: false, attributes: {}, events,
      classList: { values: new Set(), contains(c) { return this.values.has(c); }, add(...cs) { cs.forEach(c => this.values.add(c)); }, remove(c) { this.values.delete(c); }, toggle(c, on) { if (on) this.values.add(c); else this.values.delete(c); } },
      setAttribute(k, v) { this.attributes[k] = v; },
      addEventListener(k, fn) { events.set(k, fn); }, removeEventListener(k) { events.delete(k); },
      append(...children) { this.children.push(...children); if (tag === 'head') scripts.push(...children); },
      replaceChildren(...children) { this.children=children; },
      clientWidth:1200, clientHeight:650, offsetWidth:120, offsetHeight:48,
      prepend(n) { this.children.unshift(n); }, after() {}, querySelector() { return {textContent:''}; }, querySelectorAll() { return []; }, remove() { this.isConnected = false; }, getBoundingClientRect() { return { width: 1200, height: 580 }; },
      getContext() { return new Proxy({ fillText(t) { texts.push(t); }, createLinearGradient() { return {addColorStop(){}}; }, createRadialGradient() { return { addColorStop() {} }; } },
        { get(o, k) { return k in o ? o[k] : () => {}; }, set(o, k, v) { o[k] = v; return true; } }); }
    };
  }
  const body = node('body'); if (calm) body.classList.add('calm');
  const documentEvents = new Map(), windowEvents = new Map();
  const document = { body, head: node('head'), currentScript: { src: 'http://local/Chinese/Review-Games/rg3d-kit.js' }, hidden: false,
    createElement: node, createTextNode: t => ({ textContent: t }), querySelector: () => null, addEventListener(k, f) { documentEvents.set(k, f); }, removeEventListener(k) { documentEvents.delete(k); } };
  const c = { document, localStorage: { getItem(){return null;},setItem(){} }, WebGLRenderingContext: {}, console, performance: { now: () => now }, RG: { systemReduced: () => media.get('(prefers-reduced-motion: reduce)')?.matches || false },
    devicePixelRatio: 3, addEventListener(k, f) { windowEvents.set(k, f); }, removeEventListener(k) { windowEvents.delete(k); },
    matchMedia(q) { if (!media.has(q)) media.set(q, { matches: q.includes('760') ? narrow : reduced,
      addEventListener(k, f) { this.listener = f; }, removeEventListener() { this.listener = null; } }); return media.get(q); },
    MutationObserver: class { constructor(cb) { this.cb = cb; observers.push(this); } observe() {} disconnect() { this.disconnected = true; } },
    ResizeObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame(fn) { const key = ++id; frames.set(key, fn); return key; }, cancelAnimationFrame(key) { frames.delete(key); },
    setTimeout(fn) { const key = ++id; timers.set(key, fn); return key; }, clearTimeout(key) { timers.delete(key); }
  };
  c.window = c; vm.createContext(c);
  if (three) {
    for (const file of ['three.min.js', 'examples/js/geometries/RoundedBoxGeometry.js', 'examples/js/environments/RoomEnvironment.js']) vm.runInContext(read('vendor/three-r128/' + file), c);
    c.THREE.WebGLRenderer = class {
      constructor(options) { if (rendererFails) throw new Error('無 WebGL'); this.options = options; this.domElement = node('canvas'); this.shadowMap = {}; }
      setPixelRatio(r) { this.pixelRatio = r; } setClearColor() {} setSize() {} render() { renderCount++; }
      dispose() { this.disposed = true; } forceContextLoss() { this.lost = true; }
    };
    c.THREE.PMREMGenerator = class { fromScene() { return { texture: {}, dispose() {} }; } dispose() {} };
  }
  vm.runInContext(read('rg3d-kit.js'), c);
  vm.runInContext(read('detective3d.js'), c);
  const host = node('host');
  return { c, kit: c.RG3DKit, host, frames, timers, scripts, media, texts, observers, documentEvents, windowEvents,
    get renderCount() { return renderCount; },
    step(ms = 16) { now += ms; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach((fn) => fn(now)); },
    stage(options = {}) { return c.RG3DKit.createStage({ host, ...options }); } };
}
const settle = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };

function mount(env, theme='study', force2d=false) {
 return env.c.Detective3D.mount(env.host,{theme,objects:Array.from({length:8},(_,i)=>({id:'holder'+i})),puzzles:['sort','dial','keys','blocks','compare','cause','final'].map(type=>({id:type,type})),force2d,onPick(){}});
}
test('六個主題皆建立有厚度的布景與可操作機關',async()=>{
 for(const theme of ['study','classroom','library','forest','lab','museum']) {
  const env=environment(), room=mount(env,theme); await settle();
  assert.equal(room.is3d,true,theme); assert.ok(room.group.children.length>120); assert.equal(room.meshes.size,15);
  assert.equal(room.renderer.toneMappingExposure,.92); room.dispose();
 }
});
test('dispose 解除動畫與 focus 的所有等待並清空排程',async()=>{
 const env=environment(),room=mount(env); await settle();
 const animation=room.animate('dial'); room.dispose(); await animation;
 assert.equal(room.tweens.length,0); assert.equal(env.frames.size,0); assert.equal(env.timers.size,0);
 const env2=environment(),room2=mount(env2); await settle(); const focus=room2.focus('dial'); room2.dispose(); await focus;
 assert.equal(room2.tweens.length,0);
});
test('下一步目標永遠不會遮擋淡出；high 不做遮擋淡出',async()=>{
 const env=environment(),room=mount(env); await settle();room.finishTweens();
 room.setState('dial','next'); room.layoutMarkers();
 room.raycaster.intersectObjects=()=>[{distance:0}]; room.updateOcclusion();
 assert.equal(room.items.find(it=>it.id==='dial').btn.classList.contains('dt-occluded'),false);
 assert.equal(room.items[0].btn.classList.contains('dt-occluded'),true);
 room.setMarkerMode('high');room.updateOcclusion();assert.equal(room.items[0].btn.classList.contains('dt-occluded'),false);assert.ok(room.items.every(it=>!it.btn.classList.contains('dt-dot')));room.dispose();
});
test('平面圖固定 high，保留使用者的探索設定',async()=>{
 const env=environment(),room=mount(env,'study',true); await settle();room.setMarkerMode('standard');
 assert.equal(room.effectiveMarkerMode(),'high');assert.equal(room.host.dataset.markerMode,'high');assert.equal(room.markerMode,'standard');room.dispose();
});
test('yaw pitch 縮放夾住範圍且相機不穿後牆或左牆',async()=>{
 const env=environment(),room=mount(env);await settle();room.finishTweens();
 for(const value of [-100,100]) { room.yaw=value;room.pitch=value;room.zoom=value;room.place();
 assert.ok(Math.abs(room.yaw)<=.9);assert.ok(Math.abs(room.pitch)<=.12);assert.ok(room.zoom>=.72&&room.zoom<=1.2);
 assert.ok(room.camera.position.x>-6);assert.ok(room.camera.position.z>-4.5);
 const center=new env.c.THREE.Vector3(0,0,0).project(room.camera);assert.ok(Math.abs(center.x)<1&&Math.abs(center.y)<1);
 }room.dispose();
});
test('固定視角阻止滾輪與拖曳；低動態動畫直接到終態',async()=>{
 const env=environment(),room=mount(env);await settle();room.finishTweens();room.setFixedView(true);
 const el=room.renderer.domElement;el.events.get('wheel')({deltaY:400,preventDefault(){}});assert.equal(room.zoom,1);
 env.c.document.body.classList.add('calm');await room.animate('dial');assert.ok(Math.abs(room.safeDoor.rotation.y+room.safeDoorFace.rotation.y+Math.PI*100/180)<1e-8);room.dispose();
});
