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
  const documentEvents = new Map(), windowEvents = new Map();
  const document = { body, head: node('head'), currentScript: { src: 'http://local/Chinese/Review-Games/rg3d-kit.js' }, hidden: false,
    createElement: node, createTextNode: t => ({ textContent: t }), querySelector: () => null, addEventListener(k, f) { documentEvents.set(k, f); }, removeEventListener(k) { documentEvents.delete(k); } };
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
  vm.runInContext(read('scene3d-monopoly.js'), c);
  const host = node('host');
  return { c, kit: c.RG3DKit, host, frames, timers, scripts, media, texts, observers, documentEvents, windowEvents,
    get renderCount() { return renderCount; },
    step(ms = 16) { now += ms; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach((fn) => fn(now)); },
    stage(options = {}) { return c.RG3DKit.createStage({ host, ...options }); } };
}
const settle = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };

const cells = Array.from({ length: 20 }, (_, id) => ({ id,
  row: id <= 5 ? 0 : id <= 10 ? id - 5 : id <= 15 ? 5 : 20 - id,
  col: id <= 5 ? id : id <= 10 ? 5 : id <= 15 ? 15 - id : 0,
  label: [1,2,4,5,7,8,11,12,14,15,17,18].includes(id) ? `第${Math.floor([1,2,4,5,7,8,11,12,14,15,17,18].indexOf(id)/2)+1}課` : ({0:'起點',3:'機會',6:'命運',9:'機會',10:'休息站',13:'機會',16:'命運',19:'機會'}[id]),
  band: [1,2,4,5,7,8,11,12,14,15,17,18].includes(id) ? '#d9a441' : null
}));
const mount = async e => { const v = e.c.RG3DMonopoly.mount({ host:e.host, cells }); assert.ok(v); await v.ready; return v; };
async function complete(e, promise) { for(let i=0;i<110;i++) { e.step(16); await Promise.resolve(); } await promise; }

test('載入失敗及 2D 模式：所有方法立即完成，保留呈現狀態', async () => {
  // 窄螢幕不再降 2D（2026-10-16），改由下一個測試驗證輕量 3D。
  for(const opts of [{rendererFails:true},{calm:true}]) {
    const e=environment(opts), modes=[];
    const v=e.c.RG3DMonopoly.mount({host:e.host,cells,onMode:on=>modes.push(on)}); await v.ready;
    assert.equal(v.active,false);
    await v.moveToken(0,1); await v.stepMark(0,1,1); await v.clearMarks(); await v.rollDice(3);
    await v.focusPlayer(0,1); await v.setOwner(1,0); await v.presentFinish(); await v.dispose();
    assert.equal(v.tokens.get(0),1); assert.equal(v.owners.get(1),0);
  }
  assert.equal(environment().c.RG3DMonopoly.mount({}),null);
});
test('窄螢幕與系統減少動態仍顯示 3D', async () => {
  for (const opts of [{narrow:true},{reduced:true}]) { const e=environment(opts), v=await mount(e); assert.equal(v.active,true, JSON.stringify(opts)+v.failed); await v.dispose(); }
});
test('真實幾何初始化、未售只有地基，購地後六種建築出現；相同課旗串', async () => {
  const e=environment(), v=await mount(e); assert.equal(v.active,true, v.failed);
  assert.equal(v.buildings.size,0); assert.equal(v.plots.size,12);
  for(const p of v.plots.values()) assert.equal(p.foundation.visible,true);
  for(const [n,id] of [1,4,7,11,14,17].entries()) {
    await complete(e,v.setOwner(id,n%4)); assert.equal(v.buildings.get(id).userData.lesson,n+1);
    assert.equal(v.plots.get(id).foundation.visible,false);
    assert.equal(v.buildings.get(id).scale.y,1);
  }
  await complete(e,v.setOwner(2,0)); assert.equal(v.pennants.size,1); await v.dispose();
});
test('dispose 解除等待中的逐格 hop、骰子及購地，所有後續方法立即完成', async () => {
  const e=environment(),v=await mount(e); await v.moveToken(0,0,{instant:true});
  const a=v.moveToken(0,1),b=v.rollDice(6),c=v.setOwner(1,0); assert.ok(v.stage.tweens.size>0);
  await v.dispose(); await Promise.all([a,b,c]);
  await v.moveToken(0,5); await v.rollDice(2); await v.stepMark(0,1,1); await v.clearMarks(); await v.focusPlayer(0,1); await v.setOwner(4,0); await v.presentFinish();
  assert.equal(e.frames.size,0); assert.equal(v.stage.tweens.size,0);
});
test('四隊同格維持獨立中央槽，且只為當前隊伍播放 idle', async () => {
  const e=environment(),v=await mount(e),T=e.c.THREE;
  for(let i=0;i<4;i++) await v.moveToken(i,1,{instant:true});
  v.root.updateMatrixWorld(true); const ps=[...v.pieces.values()].map(p=>p.getWorldPosition(new T.Vector3()));
  for(let i=0;i<4;i++) for(let j=i+1;j<4;j++) assert.ok(ps[i].distanceTo(ps[j])>=.5-1e-9);
  await complete(e,v.focusPlayer(1,1)); assert.equal([...v.stage.tweens.keys()].filter(k=>k.endsWith(':idle')).length,1);
  await complete(e,v.focusPlayer(3,1)); assert.equal([...v.stage.tweens.keys()].filter(k=>k.endsWith(':idle')).length,1);
  await v.dispose();
});
test('rollDice 1–6 完成後真實旋轉矩陣的指定面朝上', async () => {
  const e=environment(),v=await mount(e),T=e.c.THREE;
  for(let n=1;n<=6;n++) {
    await complete(e,v.rollDice(n));
    const matrix=new T.Matrix4().makeRotationFromEuler(v.die.userData.body.rotation);
    const up=[...v.die.userData.faceNormals].filter(([,p])=>p.clone().transformDirection(matrix).y>.99999).map(([face])=>face);
    assert.deepEqual(up,[n]);
  } await v.dispose();
});
test('全購地、四角色與六條旗串的最壞情境預算', async () => {
  const e=environment(),v=await mount(e);
  for(let i=0;i<4;i++) await v.moveToken(i,0,{instant:true});
  for(const c of cells.filter(c=>c.band)) await complete(e,v.setOwner(c.id,0));
  await complete(e,v.presentFinish()); const stats=v.stats(); console.log('T1B 全購地幾何預算',JSON.stringify(stats));
  assert.ok(stats.triangles<=80000,`三角形 ${stats.triangles}`); assert.ok(stats.calls<=160,`draw calls ${stats.calls}`);
  assert.ok(stats.canvasTextures<=10); stats.textureSizes.forEach(([w,h])=>assert.ok(w<=1024&&h<=1024)); await v.dispose();
});

test('只有模式改變才通知；2D 期間更新的棋子與地產在恢復時同步', async () => {
  const e=environment({calm:true}),modes=[];
  const v=e.c.RG3DMonopoly.mount({host:e.host,cells,onMode:on=>modes.push(on)}); await v.ready;
  assert.deepEqual(modes,[]); await v.moveToken(2,7); await v.setOwner(7,2); await v.rollDice(4);
  e.c.document.body.classList.remove('calm'); await v.stage.refresh();
  assert.deepEqual(modes,[true]); assert.equal(v.buildings.size,1); assert.equal(v.pieces.size,1); assert.equal(v.die.userData.value,4);
  await v.stage.refresh(); assert.deepEqual(modes,[true]);
  const a=v.moveToken(2,8),b=v.rollDice(5); e.c.document.body.classList.add('calm'); await v.stage.refresh(); await Promise.all([a,b]);
  assert.deepEqual(modes,[true,false]); assert.equal(e.frames.size,0); await v.dispose();
});

test('hop 壓縮只發生在落地之後，停止 idle 不留下補間', async () => {
  const e=environment(),p=e.kit.piece(0), toy=p.children[0],samples=[];
  await p.hop({x:0,y:.25,z:0},{x:1,y:.25,z:0},{stage:{tween:async (name,ms,fn)=>{
    for(const t of [.5,.79,.8,.9,1]) { fn(t); samples.push([p.position.y,toy.scale.y]); }
  }}});
  assert.equal(samples[0][1],1); assert.equal(samples[1][1],1); assert.ok(Math.abs(samples[3][0]-.25)<1e-10); assert.ok(Math.abs(samples[3][1]-.94)<1e-10);
  const v=await mount(e); await v.moveToken(0,0,{instant:true}); const focus=v.focusPlayer(0,0); v.stopIdle();
  assert.equal([...v.stage.tweens.keys()].filter(k=>k.endsWith(':idle')).length,0); await v.dispose(); await focus;
});

test('Resize／標籤 DOM 更新不會遞迴觸發 stage.refresh', async () => {
  const e=environment(),v=await mount(e); let count=0; const refresh=v.stage.refresh; v.stage.refresh=()=>{count++;return refresh();};
  // controls、stage、view 各有 observer，只有 stage 要處理 body class 或 host 移除。
  const observer=e.observers[1]; observer.cb([{type:'childList',target:{}}]); assert.equal(count,0);
  observer.cb([{type:'attributes',target:e.c.document.body}]); await settle(); assert.equal(count,1); await v.dispose();
});

test('斜俯視相機在各驗收寬度維持完整外框與水平留白', async () => {
  const e=environment(),v=await mount(e),T=e.c.THREE;
  for(const width of [620,800,1024,1366,1920]) {
    v.surface.getBoundingClientRect=()=>({width,height:width/Number(v.surface.style.aspectRatio || 1.22)}); v.stage.resize();
    const corners=[-5.54,5.54].flatMap(x=>[-5.54,5.54].flatMap(z=>[-.55,0].map(y=>new T.Vector3(x,y,z).project(v.camera))));
    const extent=Math.max(...corners.map(p=>Math.abs(p.x)));
    console.log('T1B 相機外框投影',width,extent);
    assert.ok(extent>=.88&&extent<=.92,`左右邊界 ${extent}`);
    assert.ok(corners.every(p=>Math.abs(p.y)<=.901));
    assert.equal(v.camera.fov,32); assert.equal(v.camera.position.x,0);
  } await v.dispose();
});

// 包圍盒取真實模型幾何，忽略透明接觸陰影；檢查世界座標 XZ 投影。
function footprint(T, model) {
  model.updateMatrixWorld(true); const result = new T.Box3();
  model.traverse(o => { if (!o.isMesh || o.material.transparent) return;
    o.geometry.computeBoundingBox(); result.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
  }); return result;
}
test('單隊居中，多隊展開 ±.40 槽位，離開後剩餘棋子回中央', async () => {
  const e=environment(),v=await mount(e);
  await v.moveToken(3,1,{instant:true});
  assert.ok(v.pieces.get(3).position.distanceTo(v.cellPosition(1))<1e-9);
  await v.moveToken(0,1,{instant:true});
  for(const i of [0,3]) {
    const delta=v.pieces.get(i).position.clone().sub(v.cellPosition(1));
    assert.ok(Math.abs(Math.abs(delta.x)-.4)<1e-9); assert.ok(Math.abs(Math.abs(delta.z)-.4)<1e-9);
  }
  await complete(e,v.moveToken(0,2));
  assert.ok(v.pieces.get(3).position.distanceTo(v.cellPosition(1))<1e-9);
  assert.ok(v.pieces.get(0).position.distanceTo(v.cellPosition(2))<1e-9);
  await v.dispose();
});
function projectedBounds(T,model,camera,width,height) {
  model.updateMatrixWorld(true); const points=[];
  model.traverse(o=>{if(!o.isMesh || o.material.transparent)return;
    const attr=o.geometry.attributes.position;
    for(let j=0;j<attr.count;j++) points.push(new T.Vector3().fromBufferAttribute(attr,j).applyMatrix4(o.matrixWorld).project(camera));
  });
  return {left:Math.min(...points.map(p=>p.x))*width/2,right:Math.max(...points.map(p=>p.x))*width/2,
    top:Math.min(...points.map(p=>p.y))*height/2,bottom:Math.max(...points.map(p=>p.y))*height/2};
}
test('1024 頁面棋盤寬 690：20 格四角色實際幾何投影至少 40px',async()=>{
  const e=environment(),v=await mount(e),T=e.c.THREE,width=690;
  v.surface.getBoundingClientRect=()=>({width,height:width/Number(v.surface.style.aspectRatio)}); v.stage.resize();
  let minimum=Infinity;
  for(const c of cells) for(let i=0;i<4;i++) {
    await v.moveToken(i,c.id,{instant:true});
    const b=projectedBounds(T,v.pieces.get(i),v.camera,width,width/v.fitAspect);
    minimum=Math.min(minimum,b.bottom-b.top);
  }
  console.log('R2 最小角色投影高度',minimum); assert.ok(minimum>=40);
  assert.match(read('scene3d-monopoly.js'),/dom-labels\{z-index:3\}/);
  assert.match(read('scene3d-monopoly.js'),/background:#fffaf3;/);
  await v.dispose();
});
test('全購地每棟建築可見紙色牆面，外框完整且仰角 48 度',async()=>{
  const e=environment(),v=await mount(e),T=e.c.THREE;
  // 用相機視線量角，不依賴 fit 內部暫存的 targetY。
  const direction=v.camera.getWorldDirection(new T.Vector3());
  assert.ok(Math.abs(Math.asin(-direction.y)*180/Math.PI-48)<1e-8);
  for(const c of cells.filter(c=>c.band)) {
    await complete(e,v.setOwner(c.id,1)); const model=v.buildings.get(c.id);
    const b=projectedBounds(T,model,v.camera,2,2), ray=new T.Raycaster(); let walls=0,hits=0;
    for(let x=0;x<24;x++)for(let y=0;y<24;y++) {
      ray.setFromCamera(new T.Vector2(b.left+(b.right-b.left)*(x+.5)/24,b.top+(b.bottom-b.top)*(y+.5)/24),v.camera);
      const hit=ray.intersectObject(model,true).find(h=>!h.object.material.transparent);
      if(hit){hits++;if(hit.object.material===e.kit.MAT.paper)walls++;}
    }
    console.log('R2 可見牆面比例',c.id,walls/hits);
    assert.ok(walls/hits>=.08,`格 ${c.id} 可見牆面 ${walls}/${hits}`);
  }
  await v.dispose();
});
test('中央靜態擺設高度、主景尺寸與木牌字高',async()=>{
  const e=environment(),v=await mount(e),T=e.c.THREE;
  const lib=footprint(T,v.library),size=lib.getSize(new T.Vector3());
  console.log('R1 library',size.toArray());
  assert.ok(size.x>=1.5&&size.x<=1.7); assert.ok(size.z>=.9&&size.z<=1.1); assert.ok(lib.max.y<=.87);
  for(const width of [690,850,1100]) {
    v.surface.getBoundingClientRect=()=>({width,height:width/Number(v.surface.style.aspectRatio||1.22)}); v.stage.resize();
    v.root.updateMatrixWorld(true);
    const a=new T.Vector3(0,-.1875,0).applyMatrix4(v.plaque.matrixWorld).project(v.camera);
    const b=new T.Vector3(0,.1875,0).applyMatrix4(v.plaque.matrixWorld).project(v.camera);
    assert.ok(Math.abs(a.y-b.y)*width/v.fitAspect/2>=14,'課文探險字高至少 14px');
  } await v.dispose();
});

test('四隊同格頭部可見、底座號牌不互擋且保留最上層繪製',async()=>{
  const e=environment(),v=await mount(e),T=e.c.THREE,ray=new T.Raycaster();
  for(const c of cells) {
    for(let i=0;i<4;i++) await v.moveToken(i,c.id,{instant:true});
    v.root.updateMatrixWorld(true); const centers=[];
    for(let i=0;i<4;i++) {
      const p=v.pieces.get(i),badge=p.userData.monopolyBadge;
      assert.equal(badge.material.depthTest,false); assert.equal(badge.material.depthWrite,false);
      assert.equal(badge.renderOrder,2); assert.equal(badge.userData.ownedMaterial,true);
      const center=badge.getWorldPosition(new T.Vector3()).project(v.camera); centers.push(center);
      let visibleHead=false;
      p.children[0].traverse(o=>{
        if(!o.isMesh || o.material.transparent || visibleHead)return;
        const attr=o.geometry.attributes.position;
        for(let j=0;j<attr.count;j++) {
          const local=new T.Vector3().fromBufferAttribute(attr,j);
          if(local.y<.75)continue;
          const pt=local.applyMatrix4(o.matrixWorld).project(v.camera);
          ray.setFromCamera(new T.Vector2(pt.x,pt.y),v.camera);
          const hit=ray.intersectObjects([...v.pieces.values()],true).find(h=>!h.object.material.transparent);
          if(hit?.object.parent===p.children[0]){visibleHead=true;break;}
        }
      });
      assert.ok(visibleHead,`格 ${c.id} 隊 ${i} 頭部可見`);
    }
    // 寬 690px 時兩個號牌中心至少相距 16px（牌面直徑約 16px 以內）。
    for(let i=0;i<4;i++)for(let j=i+1;j<4;j++) {
      const a=centers[i],b=centers[j];
      assert.ok(Math.hypot((a.x-b.x)*345,(a.y-b.y)*345/v.fitAspect)>=16);
    }
  }
  await v.dispose();
});
