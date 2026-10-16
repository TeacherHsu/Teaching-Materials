/* 共用玩具呈現層；點數與隊伍皆由呼叫端決定，不使用遊戲亂數。 */
(function () {
  'use strict';
  const VENDOR = ((document.currentScript && document.currentScript.src) || '').replace(/[^/]*$/, '') + 'vendor/three-r128/';
  const TOKENS = Object.freeze({ press: 150, select: 220, correct: 600, reward: 900, dice: 1200,
    teams: Object.freeze(['#c0362c', '#1f5fa8', '#1f7a43', '#6b3fb0']) });
  const LIGHT = Object.freeze({ hemisphere: Object.freeze({ sky: '#fff4e2', ground: '#b98d62', intensity: .55 }),
    key: Object.freeze({ color: '#fff1dc', intensity: 1.55, position: Object.freeze([-6, 12, 7]), radius: 4, bias: -.0004, normalBias: .02 }),
    fill: Object.freeze({ color: '#dfe8ff', intensity: .35, position: Object.freeze([7, 6, -4]) }) });
  // 2026-10-16 修正：系統「減少動態」只關動畫（靜態 3D），不再整個退回 2D；只有遊戲內「減少動態（平面圖）」開關（body.calm）才切 2D。
  const flat2d = () => document.body.classList.contains('calm');
  const calmNow = (calm = false) => !!calm || document.body.classList.contains('calm') || !!window.RG?.systemReduced();
  const qualityOf = (q) => ['high', 'light'].includes(q) ? q : 'standard';
  const scripts = new Map(); let library, effects;
  function script(path) {
    if (scripts.has(path)) return scripts.get(path);
    const p = new Promise((resolve, reject) => {
      const s = document.createElement('script'); let done = false;
      const finish = (error) => { if (done) return; done = true; clearTimeout(timer); s.onload = s.onerror = null;
        if (error) { s.remove(); scripts.delete(path); reject(error); } else resolve(); };
      const timer = setTimeout(() => finish(new Error('3D 載入逾時')), 6500);
      s.src = VENDOR + path; s.onload = () => finish(); s.onerror = () => finish(new Error('3D 載入失敗'));
      document.head.append(s);
    }); scripts.set(path, p); return p;
  }
  async function load(options = {}) {
    if (!library) library = (async () => {
      if (!window.THREE) await script('three.min.js');
      if (!window.THREE.RoundedBoxGeometry) await script('examples/js/geometries/RoundedBoxGeometry.js');
      if (!window.THREE.RoomEnvironment) await script('examples/js/environments/RoomEnvironment.js');
      return window.THREE;
    })().catch((e) => { library = null; throw e; });
    const T = await library;
    if (options.effects) {
      if (!effects) effects = (async () => {
        for (const p of ['shaders/CopyShader.js', 'shaders/LuminosityHighPassShader.js', 'postprocessing/EffectComposer.js',
          'postprocessing/RenderPass.js', 'postprocessing/ShaderPass.js', 'postprocessing/UnrealBloomPass.js']) await script('examples/js/' + p);
      })().catch((e) => { effects = null; throw e; });
      await effects;
    } return T;
  }
  const T = () => { if (!window.THREE) throw new Error('請先 await RG3DKit.load()'); return window.THREE; };
  const materials = new Map(), textures = new Map();
  function texture(name, size, paint) {
    if (!textures.has(name)) {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
      paint(canvas.getContext('2d'), size);
      const map = new (T().CanvasTexture)(canvas); map.encoding = T().sRGBEncoding; textures.set(name, map);
    } return textures.get(name);
  }
  function grain() {
    return texture('wood', 512, (c, s) => {
      c.fillStyle = '#eee0cc'; c.fillRect(0, 0, s, s);
      for (let i = 0; i < 110; i++) {
        const y = i * s / 110; c.strokeStyle = `rgba(92,56,26,${.07 + (i % 5) * .018})`; c.lineWidth = 1 + i % 3;
        c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(150, y + Math.sin(i) * 9, 360, y - Math.cos(i) * 7, s, y); c.stroke();
      }
    });
  }
  function material(name, color, roughness, metalness = 0, extra = {}) {
    // r128 的 Color 視 hex 為線性值；設計色票是 sRGB，要先轉換，否則畫面整體褪色偏粉。
    if (!materials.has(name)) materials.set(name, new (T().MeshStandardMaterial)({ color: new (T().Color)(color).convertSRGBToLinear(), roughness, metalness, ...extra }));
    return materials.get(name);
  }
  const MAT = {
    get wood() { return material('wood', '#c58b54', .62, 0, { map: grain() }); },
    get woodDark() { return material('woodDark', '#8a5a33', .58, 0, { map: grain() }); },
    plastic(color) { return material('plastic:' + color, color, .42, 0, { envMapIntensity: .45 }); },
    get paper() { return material('paper', '#fbf3e4', .9); },
    get felt() { return material('felt', '#7aa38f', 1, 0, { map: texture('felt', 256, (c, s) => {
      c.fillStyle = '#e7eee9'; c.fillRect(0, 0, s, s); let seed = 731;
      for (let i = 0; i < 14000; i++) { seed = (1664525 * seed + 1013904223) >>> 0;
        c.fillStyle = i % 2 ? 'rgba(20,65,42,.06)' : 'rgba(255,255,255,.12)'; c.fillRect(seed % s, (seed >>> 8) % s, 1, 1); }
    }) }); },
    get gold() { return material('gold', '#d9a441', .32, .7); },
    get ink() { return material('ink', '#2b1d12', .5); }
  };
  function roundedBox(w, h, d, r, seg = 3) { return new (T().RoundedBoxGeometry)(w, h, d, seg, r); }
  function mesh(geometry, mat, parent, x = 0, y = 0, z = 0) {
    const m = new (T().Mesh)(geometry, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
  }
  function box(parent, w, h, d, mat, x, y, z, r = .04) { return mesh(roundedBox(w, h, d, r), mat, parent, x, y, z); }
  function ball(parent, x, y, z, radius, mat, scale) {
    const m = mesh(new (T().SphereGeometry)(radius, 20, 12), mat, parent, x, y, z); if (scale) m.scale.set(...scale); return m;
  }
  function blobShadow(size = 1, opacity = .23) {
    const map = texture('shadow', 128, (c, s) => { const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, 'rgba(49,30,14,.8)'); g.addColorStop(.4, 'rgba(49,30,14,.35)'); g.addColorStop(1, 'rgba(49,30,14,0)');
      c.fillStyle = g; c.fillRect(0, 0, s, s); });
    const m = new (T().Mesh)(new (T().PlaneGeometry)(size, size), new (T().MeshStandardMaterial)({ map, transparent: true, opacity, depthWrite: false, roughness: 1 }));
    m.rotation.x = -Math.PI / 2; m.position.y = .002; m.userData.ownedMaterial = true; return m;
  }
  function createRenderer(quality = 'standard') {
    const t = T(), q = qualityOf(quality), r = new t.WebGLRenderer({ antialias: true, alpha: true });
    r.outputEncoding = t.sRGBEncoding; r.toneMapping = t.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.physicallyCorrectLights = false;
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, { high: 2, standard: 1.5, light: 1 }[q]));
    r.setClearColor(0, 0); r.shadowMap.enabled = q !== 'light'; r.shadowMap.type = t.PCFSoftShadowMap;
    r.domElement.setAttribute('aria-hidden', 'true'); r.domElement.style.pointerEvents = 'none'; return r;
  }
  function addStudioLights(scene, quality = 'standard') {
    const t = T(), h = LIGHT.hemisphere, k = LIGHT.key, f = LIGHT.fill;
    const lin = (c) => new t.Color(c).convertSRGBToLinear();
    const hemi = new t.HemisphereLight(lin(h.sky), lin(h.ground), h.intensity), key = new t.DirectionalLight(lin(k.color), k.intensity), fill = new t.DirectionalLight(lin(f.color), f.intensity);
    key.position.set(...k.position); key.castShadow = quality !== 'light'; key.shadow.mapSize.set(quality === 'high' ? 2048 : 1024, quality === 'high' ? 2048 : 1024);
    Object.assign(key.shadow, { radius: k.radius, bias: k.bias, normalBias: k.normalBias });
    Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: .5, far: 40 });
    fill.position.set(...f.position); scene.add(hemi, key, fill); return { hemi, key, fill };
  }
  let serial = 0;
  function animate(object, name, ms, fn, options = {}) {
    let parent = object, stage = options.stage;
    while (parent && !stage) { stage = parent.userData?.stage; parent = parent.parent; }
    if (stage) return stage.tween(object.uuid + ':' + name, ms, fn);
    // 未掛載時仍更新最終狀態，不建立第二套永久 rAF。
    fn(1); return Promise.resolve();
  }
  function piece(team) {
    if (!Number.isInteger(team) || team < 0 || team > 3) throw new RangeError('team 必須是 0–3');
    const t = T(), root = new t.Group(), toy = new t.Group(), color = MAT.plastic(TOKENS.teams[team]); root.add(toy);
    root.userData.team = team; root.userData.animationId = ++serial;
    const shadow = blobShadow(.95); root.add(shadow);
    const base = mesh(new t.CylinderGeometry(.39, .39, .10, 48), color, toy, 0, .06, 0);
    // 圓邊以環面銜接圓盤，避免可見的尖銳圓柱邊。
    for (const y of [.025, .095]) { const rim = mesh(new t.TorusGeometry(.365, .025, 8, 48), color, toy, 0, y, 0); rim.rotation.x = Math.PI / 2; }
    const numberMap = texture('number:' + team, 128, (c, s) => {
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(s / 2, s / 2, s * .46, 0, Math.PI * 2); c.fill();
      c.fillStyle = TOKENS.teams[team]; c.font = '900 92px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(team + 1), s / 2, s / 2 + 3);
    });
    const badge = mesh(new t.CircleGeometry(.17, 32), material('badge:' + team, '#ffffff', .9, 0, { map: numberMap, transparent: true }), toy, 0, .113, .205);
    badge.rotation.x = -Math.PI / 2; base.userData.numberTexture = numberMap; root.userData.base = base;
    if (team === 0) {
      ball(toy, 0, .36, 0, .23, color, [1, 1.08, .86]); ball(toy, 0, .66, .025, .20, MAT.plastic('#f1c59f'));
      mesh(new t.CylinderGeometry(.32, .32, .045, 32), MAT.paper, toy, 0, .80, 0);
      ball(toy, 0, .82, 0, .21, MAT.paper, [1, .50, 1]); box(toy, .25, .31, .15, MAT.woodDark, 0, .40, -.22);
    } else if (team === 1) {
      box(toy, .43, .36, .31, color, 0, .32, 0, .08); box(toy, .49, .30, .33, color, 0, .65, 0, .08);
      box(toy, .39, .13, .04, MAT.ink, 0, .67, .18, .035);
      mesh(new t.CylinderGeometry(.022, .022, .13, 10), MAT.ink, toy, 0, .85, 0); ball(toy, 0, .94, 0, .045, color);
      for (const x of [-.29, .29]) box(toy, .10, .25, .13, color, x, .32, 0);
    } else if (team === 2) {
      ball(toy, 0, .40, 0, .25, color, [1, 1.15, .9]); ball(toy, 0, .69, .085, .21, color, [1, .9, 1.05]);
      ball(toy, 0, .60, .24, .14, color, [1.1, .6, .8]);
      const tail = mesh(new t.ConeGeometry(.12, .42, 16), color, toy, 0, .24, -.32); tail.rotation.x = -1.0;
      for (let i = 0; i < 4; i++) { const spike = mesh(new t.ConeGeometry(.075, .16, 12), MAT.paper, toy, 0, .32 + i * .13, -.23 + i * .02); spike.rotation.x = -.8; }
    } else {
      ball(toy, 0, .43, 0, .25, color, [1, 1.18, .85]); ball(toy, 0, .68, .025, .18, color);
      for (const side of [-1, 1]) {
        const page = box(toy, .34, .43, .065, MAT.paper, side * .25, .48, -.18, .025); page.rotation.y = side * -.5; page.rotation.z = side * -.16;
        const cover = box(toy, .36, .45, .045, color, side * .26, .48, -.23, .025); cover.rotation.copy(page.rotation);
      }
      const star = new t.Shape(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + Math.PI / 2, r = i % 2 ? .045 : .10; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (!i) star.moveTo(x, y); else star.lineTo(x, y); } star.closePath();
      mesh(new t.ExtrudeGeometry(star, { depth: .035, bevelEnabled: true, bevelSize: .008, bevelThickness: .008, bevelSegments: 1, steps: 1 }), MAT.gold, toy, 0, .94, 0);
    }
    const eyeY = team === 1 ? .67 : .68, front = team === 2 ? .255 : team === 1 ? .21 : .20;
    for (const x of [-.075, .075]) {
      ball(toy, x, eyeY, front, .029, team === 1 ? MAT.paper : MAT.ink, [1, 1.15, .5]);
      ball(toy, x * 1.55, eyeY - .065, front - .015, .037, MAT.plastic('#eaa599'), [1, .5, .35]);
    }
    root.idle = (options = {}) => {
      if (calmNow(options.calm) || !options.active) {
        let parent = root, stage = options.stage;
        while (parent && !stage) { stage = parent.userData?.stage; parent = parent.parent; }
        stage?.cancelTween?.(root.uuid + ':idle'); toy.position.y = 0; return Promise.resolve();
      }
      return animate(root, 'idle', 2400, (p) => { toy.position.y = .019 * Math.sin(p * Math.PI * 2); }, options);
    };
    root.hop = (from, to, options = {}) => {
      const calm = calmNow(options.calm), dx = to.x - from.x, dz = to.z - from.z;
      if (dx || dz) toy.rotation.y = Math.atan2(dx, dz);
      return animate(root, 'hop', calm ? 80 : TOKENS.select, (p) => {
        const travel = calm ? p : Math.min(1, p / .8), height = calm ? 0 : .35 * Math.sin(Math.PI * travel);
        root.position.set(from.x + dx * travel, from.y + (to.y - from.y) * travel + height, from.z + dz * travel);
        toy.scale.y = calm ? 1 : 1 - .06 * Math.sin(Math.PI * Math.max(0, (p - .8) / .2));
        if (p === 1) toy.scale.y = 1;
        shadow.position.y = .002 - height;
      }, options);
    };
    root.cheer = (options = {}) => {
      if (calmNow(options.calm)) return Promise.resolve();
      const start = toy.rotation.y;
      return animate(root, 'cheer', TOKENS.correct, (p) => { toy.position.y = p === 1 ? 0 : .30 * Math.sin(Math.PI * p); toy.rotation.y = start + Math.PI * 2 * p; }, options);
    };
    return root;
  }
  // 面的本地法向量與終態旋轉；測試以實際旋轉矩陣查核。
  const faces = [null, [0, 1, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [1, 0, 0], [0, -1, 0]];
  const angles = [null, [0, 0, 0], [0, 0, -Math.PI / 2], [-Math.PI / 2, 0, 0], [Math.PI / 2, 0, 0], [0, 0, Math.PI / 2], [Math.PI, 0, 0]];
  function dice() {
    const t = T(), root = new t.Group(), body = new t.Group(), shadow = blobShadow(1.3); root.add(shadow, body); body.position.y = .46;
    const shell = roundedBox(.9, .9, .9, .14), positions = shell.getAttribute('position'), keep = [];
    // 移除六個平面中央的三角形，再補有孔的面，讓骰點確實凹入。
    for (let i = 0; i < positions.count; i += 3) {
      let flat = false;
      for (let axis = 0; axis < 3; axis++) for (const sign of [-1, 1]) {
        if ([0, 1, 2].every((v) => Math.abs(positions.array[(i + v) * 3 + axis] - sign * .45) < .00001)) flat = true;
      }
      if (!flat) keep.push(i, i + 1, i + 2);
    }
    shell.setIndex(keep); shell.clearGroups(); mesh(shell, MAT.plastic('#fbf3e4'), body);
    const layouts = [null, [[0, 0]], [[-.20, .20], [.20, -.20]], [[-.20, .20], [0, 0], [.20, -.20]],
      [[-.20, -.20], [-.20, .20], [.20, -.20], [.20, .20]],
      [[-.20, -.20], [-.20, .20], [0, 0], [.20, -.20], [.20, .20]],
      [[-.20, -.22], [-.20, 0], [-.20, .22], [.20, -.22], [.20, 0], [.20, .22]]];
    const normals = new Map();
    for (let n = 1; n <= 6; n++) {
      const normal = new t.Vector3(...faces[n]), face = new t.Group(); face.quaternion.setFromUnitVectors(new t.Vector3(0, 0, 1), normal);
      face.position.copy(normal).multiplyScalar(.4505); body.add(face); normals.set(n, normal);
      const surface = new t.Shape(); surface.moveTo(-.31, -.31); surface.lineTo(.31, -.31); surface.lineTo(.31, .31); surface.lineTo(-.31, .31); surface.closePath();
      for (const [x, y] of layouts[n]) { const hole = new t.Path(); hole.absarc(x, y, .066, 0, Math.PI * 2, true); surface.holes.push(hole); }
      mesh(new t.ShapeGeometry(surface, 16), MAT.plastic('#fbf3e4'), face);
      const geom = new t.SphereGeometry(.066, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      // 內凹半球朝內，rim 與骰面齊平；不是凸出的黑色珠子。
      for (const [x, y] of layouts[n]) { const pip = mesh(geom, material('pip:' + n, n === 1 ? '#c0362c' : '#2b1d12', .5, 0, { side: t.DoubleSide }), face, x, y, 0); pip.rotation.x = -Math.PI / 2; pip.scale.y = .24; }
    }
    root.userData.body = body; root.userData.faceNormals = normals; root.userData.value = 1;
    root.roll = (n, options = {}) => {
      if (!Number.isInteger(n) || n < 1 || n > 6) throw new RangeError('骰子結果必須是 1–6');
      const calm = calmNow(options.calm), end = angles[n], start = body.rotation.clone(); root.userData.value = n;
      if (calm) body.rotation.set(...end);
      // 淡入只影響骰子本身，不改共用材質透明度。
      if (!root.userData.fadeMaterials) {
        const clones = new Map(); body.traverse((o) => { if (o.material) { if (!clones.has(o.material)) clones.set(o.material, o.material.clone()); o.material = clones.get(o.material); o.userData.ownedMaterial = true; } });
        root.userData.fadeMaterials = [...clones.values()];
      }
      return animate(root, 'roll', calm ? TOKENS.press : TOKENS.dice, (p) => {
        if (!calm) {
          body.rotation.set(...end.map((a, i) => p === 1 ? a : start[['x', 'y', 'z'][i]] * (1 - p) + (a + Math.PI * (i === 1 ? 4 : 6)) * p));
          const height = p < .55 ? 1.05 * Math.sin(Math.PI * p / .55) : p < .78 ? .26 * Math.sin(Math.PI * (p - .55) / .23) : .10 * Math.sin(Math.PI * (p - .78) / .22);
          body.position.y = .46 + Math.max(0, height); shadow.scale.setScalar(1 + Math.max(0, height) * .4);
          shadow.material.opacity = .23 / (1 + Math.max(0, height));
        }
        for (const mat of root.userData.fadeMaterials) { mat.transparent = calm && p < 1; mat.opacity = calm ? p : 1; }
        if (p === 1) { body.rotation.set(...end); body.position.y = .46; shadow.scale.setScalar(1); shadow.material.opacity = .23; }
      }, options);
    }; return root;
  }
  let toolbar;
  function controls() {
    if (toolbar?.isConnected) return toolbar;
    const el = (tag, cls, text) => { const n = document.createElement(tag); n.className = cls || ''; if (text) n.textContent = text; return n; };
    toolbar = el('details', 'rg3d-tools'); toolbar.setAttribute('aria-label', '畫面設定');
    toolbar.append(el('summary', '', '畫面設定'));
    const status = el('span', 'rg3d-status', '正在準備立體視圖，已可開始操作'); status.setAttribute('role', 'status'); toolbar.append(status);
    const switches = [];
    for (const [key, text] of [['calm', '減少動態（平面圖）'], ['proj', '投影模式']]) {
      const label = el('label', 'rg3d-switch'), input = el('input'); input.type = 'checkbox';
      input.checked = document.body.classList.contains(key);
      input.addEventListener('change', () => document.body.classList.toggle(key, input.checked));
      label.append(input, document.createTextNode(text)); toolbar.append(label); switches.push([key, input]);
    }
    const force = window.RG?.force3dToggle?.(); if (force) toolbar.append(force);
    const observer = new MutationObserver(() => {
      if (!toolbar.isConnected) { observer.disconnect(); return; }
      switches.forEach(([key, input]) => { input.checked = document.body.classList.contains(key); });
    }); observer.observe(document.body, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
    document.querySelector('#app .topbar')?.after(toolbar); return toolbar;
  }
  function createStage({ host, quality = 'standard', onMode = () => {} }) {
    if (!host) throw new TypeError('createStage 需要 host');
    const stage = { host, quality: qualityOf(quality), scene: null, camera: null, renderer: null,
      active: false, disposed: false, failed: '', tweens: new Map(), frame: 0, generation: 0 };
    const reduced = matchMedia('(prefers-reduced-motion: reduce)'), narrow = matchMedia('(max-width: 760px)');
    let resizeObserver, observer, loading, environment, lights, samples = [], slow = 0, warm = 30, last = null;
    function finish(name) {
      const a = stage.tweens.get(name); if (!a) return;
      stage.tweens.delete(name); try { a.fn(1); } finally { a.resolve(); }
    }
    function finishAll() { for (const name of [...stage.tweens.keys()]) { try { finish(name); } catch (_) { /* 每個等待者都必須解除 */ } }
      cancelAnimationFrame(stage.frame); stage.frame = 0; last = null; }
    function mode(on, reason = '') {
      const changed = stage.active !== on; stage.active = on;
      if (!on) finishAll();
      if (stage.renderer) stage.renderer.domElement.hidden = !on;
      if (changed || !on) onMode(on, reason);
    }
    stage.draw = () => {
      if (!stage.active || stage.disposed || document.hidden) return;
      try { stage.renderer.render(stage.scene, stage.camera); }
      catch (_) { stage.failed = 'WebGL 繪製失敗'; mode(false, stage.failed); }
    };
    stage.resize = () => {
      if (!stage.renderer || stage.disposed) return;
      const rect = host.getBoundingClientRect(), width = Math.max(1, rect.width), height = Math.max(1, rect.height);
      stage.renderer.setSize(width, height); stage.camera.aspect = width / height; stage.camera.updateProjectionMatrix(); stage.draw();
    };
    function sample(now) {
      if (warm > 0) warm--; else if (last !== null) samples.push(now - last); last = now;
      if (samples.length < 90) return;
      samples.sort((a, b) => a - b); slow = samples[85] > (stage.quality === 'light' ? 28 : 22) ? slow + 1 : 0; samples = [];
      if (slow < 2) return;
      slow = 0; finishAll();
      if (stage.quality !== 'light') {
        stage.quality = 'light'; stage.renderer.setPixelRatio(1); stage.renderer.shadowMap.enabled = false;
        lights.key.castShadow = false; stage.resize();
      } else { stage.failed = '連續慢幀，改用 2D'; mode(false, stage.failed); }
    }
    function frame(now) {
      stage.frame = 0;
      if (!stage.active || stage.disposed || document.hidden) { finishAll(); return; }
      // rAF 期間仍檢查設定，避免 MutationObserver 尚未送達時多播動畫。
      if (flat2d()) { stage.refresh(); return; }
      sample(now);
      for (const [name, a] of [...stage.tweens]) {
        const p = Math.min(1, Math.max(0, (now - a.start) / a.ms));
        try { if (p === 1) finish(name); else a.fn(p); }
        catch (_) { stage.failed = '補間失敗'; mode(false, stage.failed); break; }
      }
      stage.draw();
      if (stage.tweens.size && stage.active) stage.frame = requestAnimationFrame(frame); else last = null;
    }
    stage.cancelTween = (name) => { finish(name); };
    stage.tween = (name, ms, fn) => {
      try { finish(name); } catch (_) { /* 同名替換也解除舊 Promise */ }
      if (!stage.active || stage.disposed || document.hidden || calmNow() || ms <= 0) { fn(1); stage.draw(); return Promise.resolve(); }
      return new Promise((resolve) => {
        stage.tweens.set(name, { start: performance.now(), ms, fn, resolve });
        if (!stage.frame) stage.frame = requestAnimationFrame(frame);
      });
    };
    stage.visibility = () => { if (document.hidden) finishAll(); else { last = null; stage.draw(); } };
    const lost = (event) => { event.preventDefault(); stage.failed = 'WebGL context lost'; mode(false, stage.failed); };
    stage.refresh = async () => {
      if (stage.disposed) return;
      const reason = flat2d() ? '平面圖' : stage.failed;
      if (reason) { mode(false, reason); return; }
      if (stage.renderer) { mode(true); stage.resize(); return; }
      if (loading) return loading;
      const generation = ++stage.generation;
      loading = (async () => {
        try {
          await load();
          if (stage.disposed || generation !== stage.generation || flat2d()) return;
          // 手機寬度也顯示 3D，改用輕量畫質（pixelRatio 1、不開陰影貼圖，只用接觸陰影）。
          if (narrow.matches) stage.quality = 'light';
          const t = T(); stage.scene = new t.Scene(); stage.scene.userData.stage = stage;
          stage.camera = new t.PerspectiveCamera(32, 1, .1, 100); stage.camera.position.set(0, 7.8, 9.8); stage.camera.lookAt(0, .2, 0);
          stage.renderer = createRenderer(stage.quality); stage.renderer.domElement.addEventListener('webglcontextlost', lost);
          host.append(stage.renderer.domElement); lights = addStudioLights(stage.scene, stage.quality);
          const room = new t.RoomEnvironment(), pmrem = new t.PMREMGenerator(stage.renderer);
          try { environment = pmrem.fromScene(room, .04); stage.scene.environment = environment.texture; }
          finally { pmrem.dispose(); const geometries = new Set(), mats = new Set(); room.traverse((o) => { if (o.geometry) geometries.add(o.geometry); if (o.material) mats.add(o.material); }); geometries.forEach((g) => g.dispose()); mats.forEach((m) => m.dispose()); }
          mode(true); stage.resize();
        } catch (_) { stage.failed = '3D 載入或初始化失敗'; mode(false, stage.failed); }
        finally { loading = null; }
      })(); return loading;
    };
    stage.dispose = () => {
      if (stage.disposed) return; stage.disposed = true; stage.generation++; mode(false, '已釋放');
      resizeObserver?.disconnect(); observer?.disconnect();
      reduced.removeEventListener('change', refresh); narrow.removeEventListener('change', refresh);
      document.removeEventListener('visibilitychange', stage.visibility); window.removeEventListener('pagehide', stage.dispose);
      environment?.dispose();
      const geometries = new Set(), owned = new Set();
      stage.scene?.traverse((o) => { if (o.geometry) geometries.add(o.geometry); if (o.userData.ownedMaterial) owned.add(o.material); if (o.isLight) o.shadow?.map?.dispose(); });
      geometries.forEach((g) => g.dispose()); owned.forEach((m) => m.dispose());
      if (stage.renderer) { stage.renderer.domElement.removeEventListener('webglcontextlost', lost); stage.renderer.dispose(); stage.renderer.forceContextLoss(); stage.renderer.domElement.remove(); }
      stage.scene = stage.camera = stage.renderer = null;
    };
    const refresh = () => { if (host.isConnected === false) stage.dispose(); else stage.refresh(); };
    resizeObserver = new ResizeObserver(() => { stage.refresh(); }); resizeObserver.observe(host);
    observer = new MutationObserver((records) => {
      if (host.isConnected === false || records.some(r => r.type === 'attributes' && r.target === document.body)) refresh();
    }); observer.observe(document.body, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
    reduced.addEventListener('change', refresh); narrow.addEventListener('change', refresh);
    document.addEventListener('visibilitychange', stage.visibility); window.addEventListener('pagehide', stage.dispose);
    stage.ready = stage.refresh().then(() => stage); return stage;
  }
  window.RG3DKit = { load, TOKENS, LIGHT, MAT, material, releaseMaterial: (key) => { materials.get(key)?.dispose(); materials.delete(key); }, controls, roundedBox, blobShadow, createRenderer, addStudioLights, piece, dice, createStage };
})();
