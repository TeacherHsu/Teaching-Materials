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
      getContext() { const canvas=this; canvas.paintCalls ||= []; return new Proxy({ fillRect(...args) { canvas.paintCalls.push([this.fillStyle,...args]); }, fillText(t) { texts.push(t); }, createLinearGradient() { return {addColorStop(){}}; }, createRadialGradient() { return { addColorStop() {} }; } },
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

test('R1 所有實例屬性均不遮蔽方法，動畫幀確實能渲染',async()=>{
 const env=environment(),room=mount(env);await settle();room.finishTweens();
 for(const name of Object.getOwnPropertyNames(Object.getPrototypeOf(room))) {
  if(name!=='constructor' && typeof Object.getPrototypeOf(room)[name]==='function') assert.equal(Object.hasOwn(room,name),false,name);
 }
 env.step();assert.equal(room.is3d,true);assert.ok(env.renderCount>0);room.dispose();
});

test('R1 搜查 open 也有完整的下一步目標，搜查後依序移往未調查物件及機關',async()=>{
 const env=environment(),room=mount(env);await settle();room.finishTweens();
 room.items.forEach(it=>room.setState(it.id,it.kind==='holder'?'open':'locked'));
 room.layoutMarkers();const target=()=>room.items.filter(it=>it.btn.classList.contains('dt-target'));
 assert.equal(target().length,1);assert.equal(target()[0].id,'holder0');assert.ok(!target()[0].btn.classList.contains('dt-dot'));
 room.setState('holder0','found');room.layoutMarkers();assert.equal(target()[0].id,'holder1');
 room.setState('dial','next');room.layoutMarkers();assert.equal(target()[0].id,'dial');
 room.raycaster.intersectObjects=()=>[{distance:0}];room.updateOcclusion();assert.ok(!target()[0].btn.classList.contains('dt-occluded'));
 room.dispose();
});

function projectedBox(env,room,object) {
 const T=env.c.THREE;room.group.updateMatrixWorld(true);const box=new T.Box3().setFromObject(object),points=[];
 for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new T.Vector3(x,y,z).project(room.camera));
 return {left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.max(...points.map(p=>p.y)),bottom:Math.min(...points.map(p=>p.y))};
}
test('R1 實際畫布比例下底座占 88–92%，牆頂與底座均完整入鏡',async()=>{
 const env=environment(),room=mount(env);await settle();room.finishTweens();const T=env.c.THREE;
 // CSS 桌機 aspect-ratio=1.2；手機保留最小高度 340。
 for(const [w,h] of [[860,717],[700,584],[350,340],[1200,1000]]) {
  room.host.clientWidth=w;room.host.clientHeight=h;room.resize();
  const base=[];for(const x of [-6.3,6.3])for(const y of [-.57,-.19])for(const z of [-4.8,4.8])base.push(new T.Vector3(x,y,z).project(room.camera));
  const span=Math.max(Math.max(...base.map(p=>p.x))-Math.min(...base.map(p=>p.x)),Math.max(...base.map(p=>p.y))-Math.min(...base.map(p=>p.y)))/2;
  assert.ok(span>=.88&&span<=.92,`${w}x${h}: ${span}`);
  for(const p of [...base,...[[-6.25,5,-4.75],[6.125,5,-4.75],[-6.25,5,4.625]].map(p=>new T.Vector3(...p).project(room.camera))]) assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1,`${w}x${h}: ${p.toArray()}`);
 }room.dispose();
});

test('R1 六主題壁紙在室內側，配色不同，3–5 組專屬道具從預設鏡頭入鏡',async()=>{
 const expected={study:['armchair','globe-meridian','letter-and-ink'],classroom:['chalkboard','school-desk-chair','lectern'],library:['full-wall-bookshelves','book-cart','reading-stack'],forest:['pinecone-basket','hanging-lantern','stump-stool'],lab:['lab-bench','beaker-rack','microscope'],museum:['glass-statue-case','red-rope-stanchions','gilded-gallery']};
 const palettes=new Set(),patterns=new Set();
 for(const [theme,names] of Object.entries(expected)) {
  const env=environment(),room=mount(env,theme);await settle();room.finishTweens();room.host.clientWidth=860;room.host.clientHeight=717;room.resize();
  palettes.add(room.theme.wall);assert.ok(room.themeProps.length>=3&&room.themeProps.length<=5);
  for(const name of names)assert.ok(room.themeProps.some(o=>o.name===name),`${theme}: ${name}`);
  for(const o of room.themeProps) {const r=projectedBox(env,room,o);assert.ok(r.left>-1&&r.right<1&&r.bottom>-1&&r.top<1,`${theme}/${o.name}: ${JSON.stringify(r)}`);}
  for(const wall of room.wallSurfaces) {
   assert.ok(wall.material.map?.isCanvasTexture);assert.equal(wall.material.envMapIntensity,.18);
   const paint=wall.material.map.image.paintCalls;
   assert.equal(paint[0][0],'#'+room.theme.wall.toString(16).padStart(6,'0'));patterns.add(JSON.stringify(paint));
   assert.ok(wall.position.z>-4.495 || wall.position.x>-5.995);
  }
  assert.ok(room.roomLights.hemi.intensity<=.3&&room.roomLights.fill.intensity<=.2);
  room.dispose();
 }
 assert.equal(palettes.size,6);assert.equal(patterns.size,6);
});

test('R1 前景預設有局部入鏡，旋轉／縮放／手機均不遮標記及投影錨點',async()=>{
 const env=environment(),room=mount(env);await settle();room.finishTweens();const T=env.c.THREE;
 room.items.forEach(it=>room.setState(it.id,it.kind==='holder'?'open':'locked'));
 const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 let visibleCount=0;
 for(const [w,h] of [[860,717],[350,340]])for(const [yaw,zoom] of [[0,1],[-.9,1],[.9,1],[0,.72],[0,1.2]]) {
  room.host.clientWidth=w;room.host.clientHeight=h;room.yaw=yaw;room.zoom=zoom;room.resize();room.layoutMarkers();
  if(yaw===0&&zoom===1)assert.equal(room.foreground.visible,true,`default ${w}`);
  if(!room.foreground.visible)continue;visibleCount++;
  const r=room.foregroundRect;assert.ok(r.x<0||r.x+r.w>w||r.y+r.h>h,'前景只露出一部分');
  for(const rect of room.markerRects)assert.ok(!overlap(r,rect),`hit area: ${w}/${yaw}/${zoom}`);
  for(const it of room.items){const p=new T.Vector3(...it.pos).project(room.camera);assert.ok(!overlap(r,{x:(p.x+1)*w/2-24,y:(1-p.y)*h/2-24,w:48,h:48}),`anchor ${it.id}`);}
 }
 assert.ok(visibleCount>=2);room.dispose();
});


test('R1 打字機只有 24 個按鍵下壓，紙捲與滾軸不被按鍵動畫移位',async()=>{
 const env=environment(),room=mount(env);await settle();room.finishTweens();
 assert.equal(room.typeKeys.length,24);assert.equal(room.cabDoors.length,6);
 assert.ok(room.gears.every(g=>g.children.length>=14));assert.ok(room.lens.children.length>=2);
 const rollers=room.typePaper.parent.children.filter(o=>o.geometry?.type==='CylinderGeometry'&&!o.userData.typewriterKey);
 const before=rollers.map(o=>o.position.toArray());assert.equal(rollers.length,2);
 env.c.document.body.classList.add('calm');await room.animate('blocks');
 assert.deepEqual(rollers.map(o=>o.position.toArray()),before);room.dispose();
});
