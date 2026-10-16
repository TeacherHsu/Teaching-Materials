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
      prepend(n) { this.children.unshift(n); }, after() {}, querySelector() { return null; }, querySelectorAll() { return []; }, remove() { this.isConnected = false; }, getBoundingClientRect() { return { width: 1200, height: 580 }; },
      getContext() { return new Proxy({ fillText(t) { texts.push(t); }, createRadialGradient() { return { addColorStop() {} }; } },
        { get(o, k) { return k in o ? o[k] : () => {}; }, set(o, k, v) { o[k] = v; return true; } }); }
    };
  }
  const body = node('body'); if (calm) body.classList.add('calm');
  const documentEvents = new Map(), documentListeners = new Map(), windowEvents = new Map();
  const document = { body, head: node('head'), currentScript: { src: 'http://local/Chinese/Review-Games/rg3d-kit.js' }, hidden: false,
    createElement: node, createTextNode: t => ({ textContent: t }), querySelector: () => null, addEventListener(k, f) { if (!documentListeners.has(k)) documentListeners.set(k,new Set()); documentListeners.get(k).add(f); documentEvents.set(k,()=>{for(const fn of [...documentListeners.get(k)])fn();}); }, removeEventListener(k,f) { documentListeners.get(k)?.delete(f); } };
  const c = { document, console, performance: { now: () => now }, RG: { systemReduced: () => media.get('(prefers-reduced-motion: reduce)')?.matches || false },
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
  vm.runInContext(read('scene3d-snakes.js'), c);
  const host = node('host');
  return { c, kit: c.RG3DKit, host, frames, timers, scripts, media, texts, observers, documentEvents, windowEvents,
    get renderCount() { return renderCount; },
    step(ms = 16) { now += ms; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach((fn) => fn(now)); },
    stage(options = {}) { return c.RG3DKit.createStage({ host, ...options }); } };
}
const settle = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };

const ladders = {3:11,8:16,14:22,19:27};
const snakes = {13:5,21:9,25:17,29:18};
const cells = Array.from({length:30},(_,i)=>{const id=i+1,r=Math.floor(i/6);return {id,row:4-r,col:r%2?5-i%6:i%6,label:String(id),direction:'→',detail:[6,10,17,24].includes(id)?'多走1格':null};});
const mount = async (e, options={}) => {const v=e.c.RG3DSnakes.mount({host:e.host,cells,ladders,snakes,...options});assert.ok(v);await v.ready;return v;};
async function complete(e,promise) {for(let i=0;i<240;i++){e.step(16);await Promise.resolve();}await promise;}

test('真實幾何：每條蛇的頭在高號格、尾端在低號格，環紋及漸細方向正確',async()=>{
  const e=environment(),v=await mount(e),T=e.c.THREE;assert.equal(v.active,true,v.failed);
  for(const[a,b]of Object.entries(snakes)){
    const g=v.snakeModels.get(+a),path=v.paths.get('snake:'+a);assert.equal(g.userData.headCell,+a);assert.equal(g.userData.tailCell,b);assert.ok(+a>b);
    for(const[t,id]of [[0,+a],[1,b]]){const p=path.getPoint(t),q=v.cellPosition(id);assert.ok(Math.hypot(p.x-q.x,p.z-q.z)<1e-6);}
    assert.ok(g.userData.head.position.distanceTo(path.getPoint(0))<1e-6);
    const geo=g.children[0].geometry,positions=geo.attributes.position;
    assert.ok(Math.abs(new T.Vector3().fromBufferAttribute(positions,0).distanceTo(path.getPointAt(0))-.22)<1e-6);
    assert.ok(Math.abs(new T.Vector3().fromBufferAttribute(positions,96*11).distanceTo(path.getPointAt(1))-.08)<1e-6);
    assert.ok(g.children[0].material.map.repeat.x>=3);assert.equal(g.userData.eyes.length,2);
    for(let i=0;i<=64;i++){const p=path.points[i];if(cells.some(c=>{const q=v.cellPosition(c.id);return p.x-q.x<-.10&&p.x-q.x>-.88&&p.z-q.z<-.10&&p.z-q.z>-.88;}))assert.ok(p.y>=.60-1e-9);}
  }
  await v.dispose();
});
test('真實幾何：梯子兩端完全對應 LADDERS，斜高 .15 且橫桿等距',async()=>{
  const e=environment(),v=await mount(e);
  for(const[a,b]of Object.entries(ladders)){
    const m=v.ladderModels.get(+a),p=v.paths.get('ladder:'+a);assert.equal(m.userData.from,+a);assert.equal(m.userData.to,b);
    for(const[t,id]of [[0,+a],[1,b]]){const q=p.getPoint(t),c=v.cellPosition(id);assert.ok(Math.hypot(q.x-c.x,q.z-c.z)<1e-9);}
    assert.ok(Math.abs(p.getPoint(1).y-p.getPoint(0).y-.15)<1e-9);
    m.updateMatrixWorld(true);const bounds=new e.c.THREE.Box3().setFromObject(m);assert.ok(bounds.min.y>=.249-1e-6);
    const gaps=Array.from({length:m.userData.steps},(_,i)=>p.getPoint(i/m.userData.steps).distanceTo(p.getPoint((i+1)/m.userData.steps)));
    assert.ok(Math.max(...gaps)-Math.min(...gaps)<1e-9);
  }await v.dispose();
});
test('dispose 同時解除等待中的滑蛇、爬梯、逐格跳與骰子 Promise；後續呼叫立即完成',async()=>{
  const e=environment(),v=await mount(e);
  for(const[i,at]of [[0,13],[1,3],[2,1]])await v.moveToken(i,at,{instant:true});
  const pending=[v.moveToken(0,5,{path:'snake'}),v.moveToken(1,11,{path:'ladder'}),v.moveToken(2,2),v.rollDice(6)];
  assert.ok(v.stage.tweens.size>=4);await v.dispose();await Promise.all(pending);assert.equal(v.active,false);assert.equal(e.frames.size,0);assert.equal(v.stage.tweens.size,0);
  await v.moveToken(0,6);await v.stepMark(0,6,1);await v.clearMarks();await v.rollDice(2);await v.focusPlayer(0,6);await v.presentFinish();await v.dispose();
});
test('同一格四隊棋子的真實不透明幾何 XZ 不重疊，離開後恢復單隊中央',async()=>{
  const e=environment(),v=await mount(e),T=e.c.THREE;
  for(let i=0;i<4;i++)await v.moveToken(i,17,{instant:true});v.root.updateMatrixWorld(true);
  const boxes=[...v.pieces.values()].map(p=>new T.Box3().setFromObject(p.children[0]));
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){const a=boxes[i],b=boxes[j];assert.ok(a.max.x<=b.min.x||b.max.x<=a.min.x||a.max.z<=b.min.z||b.max.z<=a.min.z,`隊伍 ${i}/${j} 重疊: ${JSON.stringify([a,b])}`);}
  for(let i=1;i<4;i++)await v.moveToken(i,18,{instant:true});assert.ok(v.pieces.get(0).position.distanceTo(v.position(0,17))<1e-9);await v.dispose();
});
test('爬梯每階120ms；滑蛇先眨眼點頭再沿曲線滑900ms，最後到達實際落點',async()=>{
  const e=environment(),v=await mount(e);
  await v.moveToken(0,3,{instant:true});let promise=v.moveToken(0,11,{path:'ladder'});assert.equal(v.stage.tweens.get('token:0').ms,v.ladderModels.get(3).userData.steps*120);await complete(e,promise);assert.ok(v.pieces.get(0).position.distanceTo(v.position(0,11))<1e-9);
  await v.moveToken(0,13,{instant:true});promise=v.moveToken(0,5,{path:'snake'});assert.equal(v.stage.tweens.get('token:0').ms,1080);e.step(90);assert.ok(v.snakeModels.get(13).userData.eyes[0].scale.y<.2);await complete(e,promise);
  assert.ok(v.pieces.get(0).position.distanceTo(v.position(0,5))<1e-9);assert.equal(v.snakeModels.get(13).userData.eyes[0].scale.y,1);await v.dispose();
});
test('低動態、窄螢幕與 WebGL 失敗：所有 API 立即 resolve，2D 狀態可恢復',async()=>{
  for(const opts of [{calm:true},{narrow:true},{reduced:true},{rendererFails:true}]){
    const e=environment(opts),modes=[],v=await mount(e,{onMode:on=>modes.push(on)});assert.equal(v.active,false);
    await v.moveToken(0,13,{instant:true});await v.moveToken(0,5,{path:'snake'});await v.stepMark(0,5,1);await v.rollDice(4);await v.focusPlayer(0,5);await v.presentFinish();assert.equal(v.keepsake.hidden,false);await v.clearMarks();
    assert.equal(v.tokens.get(0),5);assert.equal(e.frames.size,0);assert.ok(modes.includes(false));await v.dispose();
  }
});
test('降級、隱藏與 context lost 解除等待者；重新啟用同步最後位置',async()=>{
  for(const mode of ['calm','hidden','context','narrow']){
    const e=environment(),v=await mount(e);await v.moveToken(0,13,{instant:true});const promise=v.moveToken(0,5,{path:'snake'});
    if(mode==='calm'){e.c.document.body.classList.add('calm');await v.stage.refresh();}
    if(mode==='hidden'){e.c.document.hidden=true;e.documentEvents.get('visibilitychange')();}
    if(mode==='context')v.stage.renderer.domElement.events.get('webglcontextlost')({preventDefault(){}});
    if(mode==='narrow'){e.media.get('(max-width: 760px)').matches=true;await v.stage.refresh();}
    await promise;assert.equal(v.stage.tweens.size,0);assert.ok(v.pieces.get(0).position.distanceTo(v.position(0,5))<1e-9);
    if(mode==='calm'){e.c.document.body.classList.remove('calm');await v.stage.refresh();assert.equal(v.active,true);}
    await v.dispose();
  }
});
test('格號、事件小標與步數各自投影；事件有步數時往底邊讓位',async()=>{
  const e=environment(),v=await mount(e),d=v.domCells.get(6);v.draw();const before=parseFloat(d.detail.style.top);
  await v.stepMark(1,6,3);assert.equal(d.step.textContent,'3步');assert.ok(parseFloat(d.detail.style.top)>before);assert.notEqual(d.box.style.top,d.detail.style.top);assert.notEqual(d.step.style.top,d.detail.style.top);
  await v.clearMarks();assert.equal(d.step.textContent,'');await v.dispose();
});
test('HTML 僅替換呈現入口，遊戲規則與 QA 選擇器保留',()=>{
  const html=read('snakes.html'),qa=read('tools/qa/play-snakes.js');assert.ok(html.includes('rg3d-kit.js'));assert.ok(html.includes('scene3d-snakes.js'));assert.ok(!html.includes('src="scene3d.js'));
  assert.ok(html.includes('window.RG3DSnakes?.mount'));assert.ok(qa.includes("document.querySelector('canvas')"));
  assert.ok(html.includes('const LADDERS = { 3: 11, 8: 16, 14: 22, 19: 27 };'));assert.ok(html.includes('const SNAKES = { 13: 5, 21: 9, 25: 17, 29: 18 };'));
});
