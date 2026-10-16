/* 大富翁微縮桌遊呈現層；不出題、不擲亂數、不改計分。 */
(function () {
  'use strict';
  const K = window.RG3DKit, done = () => Promise.resolve();
  const el = (tag, cls, text) => { const n = document.createElement(tag); n.className = cls || ''; if (text) n.textContent = text; return n; };
  const STYLE = `
.rg3d-monopoly.is-3d>.rg3d-surface{background:transparent;border:0;box-shadow:none;border-radius:20px;min-height:0;max-height:none;width:100%;height:auto;aspect-ratio:1.22}
.rg3d-monopoly>.rg3d-surface{position:relative}
.rg3d-monopoly>.rg3d-surface canvas{position:absolute;inset:0;width:100%!important;height:100%!important;mask-image:linear-gradient(to right,transparent,#000 4%,#000 96%,transparent),linear-gradient(to bottom,transparent,#000 4%,#000 96%,transparent);mask-composite:intersect}
.rg3d-monopoly.is-3d .rg3d-cell-label{transform:translate(-50%,-50%);display:block;max-width:none;width:max-content;line-height:1.1}
.rg3d-monopoly.is-3d .rg3d-cell-name{font-size:0!important;background:#fffaf3ed;border:1px solid #d7c4a6;border-radius:6px;padding:3px 5px;box-shadow:0 2px 3px #51381e18;color:var(--ink);visibility:visible!important}
.rg3d-monopoly.is-3d .rg3d-cell-name::before{content:attr(data-compact);font-size:16px!important;font-weight:800;color:#2b1d12;text-shadow:none}
.rg3d-monopoly.is-3d .rg3d-cell-label.is-destination .rg3d-cell-name::before{content:attr(data-compact)}
.rg3d-monopoly .rg3d-cell-name::after{content:'';display:inline-block;width:6px;height:6px;margin-left:3px;border-radius:50%;background:var(--lesson-color,#7aa38f)}
.rg3d-monopoly.is-3d .rg3d-cell-step{font-size:16px;min-width:22px;height:22px;line-height:20px;z-index:2}
.rg3d-monopoly.is-3d .rg3d-cell-direction{display:none!important}
@media(min-width:761px) and (max-width:900px){.rg3d-monopoly.is-3d>.rg3d-surface{height:auto;aspect-ratio:1.22;min-height:0;max-height:none}}
`;
  // 合併相同材質：保留 group 的移動/縮放，靜態零件不各佔一個 draw call。
  function batch(group) {
    const T = window.THREE, buckets = new Map(), owned = new Set(); group.updateMatrixWorld(true);
    const inverse = new T.Matrix4().copy(group.matrixWorld).invert(), originals = new Set();
    group.traverse(o => { if (!o.isMesh) return; const key = o.material; if (o.userData.ownedMaterial) owned.add(key);
      if (!buckets.has(key)) buckets.set(key, []);
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      g.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse, o.matrixWorld)); buckets.get(key).push(g); originals.add(o.geometry);
    });
    group.clear(); originals.forEach(g => g.dispose());
    for (const [mat, parts] of buckets) {
      const geo = new T.BufferGeometry();
      for (const key of ['position', 'normal', 'uv']) {
        const count = parts.reduce((n, g) => n + g.attributes[key].array.length, 0), array = new Float32Array(count); let offset = 0;
        parts.forEach(g => { array.set(g.attributes[key].array, offset); offset += g.attributes[key].array.length; });
        geo.setAttribute(key, new T.BufferAttribute(array, key === 'uv' ? 2 : 3));
      }
      const m = new T.Mesh(geo, mat); m.castShadow = m.receiveShadow = !mat.transparent; m.userData.ownedMaterial = owned.has(mat); group.add(m); parts.forEach(g => g.dispose());
    }
  }
  class View {
    constructor(opts) {
      this.host = opts.host; this.cells = opts.cells || []; this.onMode = opts.onMode;
      this.tokens = new Map(); this.owners = new Map(); this.pieces = new Map(); this.buildings = new Map(); this.plots = new Map(); this.domCells = new Map(); this.domSteps = new Map(); this.pennants = new Map();
      this.active = false; this.disposed = false; this.dieValue = 1; this.idleEpoch = 0;
      this.host.classList.add('rg3d-host', 'rg3d-monopoly');
      this.surface = el('div', 'rg3d-surface'); this.surface.setAttribute('aria-hidden', 'true'); this.host.prepend(this.surface);
      this.domLabels = el('div', 'rg3d-dom-labels'); this.host.append(this.domLabels);
      this.cells.forEach(c => {
        const box = el('div', 'rg3d-cell-label'), name = el('span', 'rg3d-cell-name', c.label), state = el('span', 'rg3d-cell-state'), step = el('span', 'rg3d-cell-step');
        box.dataset.cell = c.id; step.dataset.cell = c.id;
        name.setAttribute('data-compact', c.label.replace(/^第(\d+)課$/, '$1課').replace('綜合複習', '複習').replace('休息站', '休息')); name.setAttribute('data-full', c.label); name.setAttribute('title', c.label);
        box.style.setProperty('--lesson-color', c.band || '#7aa38f');
        box.append(name, el('span', 'rg3d-cell-direction', c.direction), el('span', 'rg3d-cell-detail', c.detail), state);
        this.domLabels.append(box, step); this.domCells.set(c.id, { box, state, step });
      });
      this.toolbar = K.controls();
      this.stage = K.createStage({ host: this.surface, quality: opts.quality, onMode: (on, reason) => this.mode(on, reason) });
      const draw = this.stage.draw, resize = this.stage.resize;
      this.stage.draw = () => { this.layoutLabels(); draw(); };
      this.stage.resize = () => { this.fit(); resize(); };
      this.ready = this.stage.ready.then(() => this);
      this.visible = () => { if (!document.hidden) this.startIdle(); };
      document.addEventListener('visibilitychange', this.visible);
      this.detached = new MutationObserver(() => { if (!this.host.isConnected) this.dispose(); }); this.detached.observe(document.body, { childList: true, subtree: true });
    }
    mode(on, reason) {
      if (on && !this.root) this.build();
      const changed = this.active !== on; this.active = on;
      this.host.classList.toggle('is-3d', on); this.host.querySelector('.tilt')?.setAttribute('aria-hidden', String(on));
      const status = this.toolbar?.querySelector('.rg3d-status'); if (status) status.textContent = on ? '立體桌面' : `2D 模式・${reason || '玩法相同'}`;
      if (changed) this.onMode?.(on);
      if (on) { this.sync(); this.fit(); this.startIdle(); } else this.stopIdle();
    }
    get renderer() { return this.stage?.renderer; }
    get camera() { return this.stage?.camera; }
    get quality() { return this.stage?.quality; }
    get failed() { return this.stage?.failed || ''; }
    draw() { this.stage?.draw(); }
    cellPosition(id) {
      const c = this.cells.find(c => c.id === id); return new window.THREE.Vector3(((c?.col || 0) - 2.5) * 1.68, .25, ((c?.row || 0) - 2.5) * 1.68);
    }
    inward(id) { const p = this.cellPosition(id); return Math.abs(p.z) >= Math.abs(p.x) ? [0, -Math.sign(p.z)] : [-Math.sign(p.x), 0]; }
    anchor(id, inward) { const p = this.cellPosition(id), d = this.inward(id); p.x += d[0] * inward; p.z += d[1] * inward; return p; }
    labelPosition(id) { return this.anchor(id, .82); }
    orientPlot(g, id) {
      const d = this.inward(id); g.rotation.y = Math.atan2(d[0], d[1]); g.scale.z = .65;
    }
    box(g, w, h, d, mat, x = 0, y = 0, z = 0, r = .03) { return this.mesh(g, K.roundedBox(w, h, d, r, 1), mat, x, y, z); }
    mesh(g, geo, mat, x = 0, y = 0, z = 0) { const m = new window.THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; }
    cylinder(g, rt, rb, h, mat, x, y, z) { return this.mesh(g, new window.THREE.CylinderGeometry(rt, rb, h, 16), mat, x, y, z); }
    roof(g, mat, y = .57, w = .72, h = .22, d = .58) {
      const T = window.THREE, s = new T.Shape(); s.moveTo(-w / 2, 0); s.lineTo(0, h); s.lineTo(w / 2, 0); s.closePath();
      return this.mesh(g, new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelSize: .015, bevelThickness: .015, bevelSegments: 1, steps: 1, curveSegments: 1 }), mat, 0, y, -d / 2);
    }
    sign(g, text, x, y, z, w = .55, h = .22, color = '#fffaf3') {
      // 全場標牌共用一張 atlas；隊號、問號與課文探險合計一張 canvas。
      const T = window.THREE, idx = ['1', '2', '3', '4', '?', '課文探險', '起跑'].indexOf(text);
      const geo = new T.PlaneGeometry(w, h), uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), (uv.getY(i) + 6 - idx) / 7);
      this.box(g, w + .03, h + .03, .035, K.MAT.plastic(color), x, y, z - .025);
      return this.mesh(g, geo, this.signMaterial, x, y, z);
    }
    building(lesson, team) {
      const T = window.THREE, g = new T.Group(), P = K.MAT.paper, C = K.MAT.plastic(K.TOKENS.teams[team]);
      g.userData.lesson = lesson; g.userData.team = team;
      if (lesson === 1) {
        this.box(g, .62, .46, .44, C, 0, .27); this.box(g, .54, .43, .46, P, .025, .27); this.roof(g, C, .50);
        const arch = new T.Shape(); arch.moveTo(-.10, 0); arch.lineTo(-.10, .14); arch.absarc(0, .14, .10, Math.PI, 0, true); arch.lineTo(.10, 0); arch.closePath();
        this.mesh(g, new T.ShapeGeometry(arch, 8), C, 0, .055, .245);
      } else if (lesson === 2) {
        this.box(g, .66, .38, .48, P, 0, .23); this.box(g, .72, .06, .56, C, 0, .45);
        for (let i = 0; i < 5; i++) { const stripe = this.box(g, .13, .045, .26, i % 2 ? P : C, (i - 2) * .13, .38, .30); stripe.rotation.x = .2; }
        this.cylinder(g, .065, .065, .25, C, .18, .605, 0); this.mesh(g, new T.ConeGeometry(.065, .10, 8), K.MAT.wood, .18, .78, 0);
      } else if (lesson === 3) {
        this.box(g, .78, .32, .45, P, 0, .20); this.roof(g, C, .37, .84, .15, .51);
        this.box(g, .26, .26, .26, P, 0, .54); this.roof(g, C, .68, .34, .10, .30);
        const clock = this.mesh(g, new T.CircleGeometry(.09, 16), K.MAT.ink, 0, .57, .14); clock.rotation.z = .2;
        this.box(g, .012, .065, .01, P, 0, .59, .13); this.box(g, .045, .012, .01, P, .02, .565, .13);
      } else if (lesson === 4) {
        this.box(g, .78, .05, .64, P, 0, .035, .02); this.box(g, .69, .05, .54, P, 0, .085, .02);
        this.box(g, .64, .34, .30, P, 0, .28, -.08);
        for (const x of [-.27, -.09, .09, .27]) this.cylinder(g, .045, .05, .36, P, x, .29, .24);
        this.roof(g, C, .47, .79, .21, .55);
      } else if (lesson === 5) {
        this.cylinder(g, .28, .29, .40, P, 0, .24, 0); this.mesh(g, new T.ConeGeometry(.36, .29, 20), C, 0, .585, 0);
        this.box(g, .09, .25, .10, P, .19, .60, -.08);
      } else {
        this.box(g, .33, .53, .36, P, 0, .30);
        for (let i = 0; i < 3; i++) { const b = this.box(g, .56, .075, .43, i % 2 ? P : C, 0, .59 + i * .075); b.rotation.y = (i - 1) * .15; }
      }
      if (lesson !== 1) this.box(g, .12, .20, .025, C, 0, .16, lesson === 5 ? .29 : .25);
      this.box(g, .022, .16, .022, K.MAT.woodDark, -.23, .72, 0);
      this.sign(g, String(team + 1), -.13, .76, .015, .17, .12, K.TOKENS.teams[team]);
      // 房屋最大高度 .84，屋頂隊號旗也包含於高度限制。
      const shadow = K.blobShadow(1, .18); shadow.position.y = .004; g.add(shadow);
      batch(g); return g;
    }
    feltMap() {
      const T = window.THREE, canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 256, 256);
      let seed = 731;
      for (let i = 0; i < 12000; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; ctx.fillStyle = 'rgba(0,0,0,.035)'; ctx.fillRect(seed % 256, (seed >>> 8) % 256, 1, 1); }
      const map = new T.CanvasTexture(canvas); map.encoding = T.sRGBEncoding; this.ownedFeltMap = map; return map;
    }
    build() {
      const T = window.THREE, s = this.stage, P = K.MAT.paper; this.root = new T.Group(); s.scene.add(this.root);
      const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 896;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#2b1d12'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ['1', '2', '3', '4', '?', '課文探險', '起跑'].forEach((t, i) => { ctx.font = `900 ${t.length > 2 ? 80 : 100}px sans-serif`; ctx.fillText(t, 256, i * 128 + 64); });
      const map = new T.CanvasTexture(canvas); map.encoding = T.sRGBEncoding;
      this.signKey = 'monopoly-sign:' + this.root.uuid;
      this.signMaterial = K.material(this.signKey, '#ffffff', .9, 0, { map, transparent: true, depthWrite: false }); this.ownedMap = map;
      const fixed = new T.Group(); this.root.add(fixed);
      this.box(fixed, 22, .12, 22, K.MAT.woodDark, 0, -.64, 0, .12);
      this.box(fixed, 11.08, .55, 11.08, K.MAT.wood, 0, -.275, 0, .12);
      this.box(fixed, 10.08, .045, 10.08, P, 0, .022, 0, .06);
      this.box(fixed, 6.5, .08, 6.5, K.MAT.woodDark, 0, .08, 0, .08);
      this.box(fixed, 6.3, .045, 6.3, K.material('monopoly-felt:' + this.root.uuid, '#5f8f78', 1, 0, { map: this.feltMap() }), 0, .14, 0, .08);
      this.cells.forEach(c => {
        const g = new T.Group(), p = this.cellPosition(c.id), d = this.inward(c.id); g.position.set(p.x, .15, p.z); fixed.add(g);
        const tint = c.band ? new T.Color('#fbf3e4').lerp(new T.Color(c.band), .15).getStyle() : '#fff0cd';
        this.box(g, 1.62, .2, 1.62, K.material('monopoly-tile:' + tint, tint, .9), 0, 0, 0, .07);
        if (c.band) {
          const band = this.box(g, d[0] ? .42 : 1.62, .04, d[1] ? .42 : 1.62, K.MAT.plastic(c.band), d[0] * .60, .12, d[1] * .60); this.plots.set(c.id, { band });
          const plot = new T.Group(), a = this.anchor(c.id, -.54); plot.position.set(a.x, .26, a.z); this.orientPlot(plot, c.id); this.root.add(plot);
          for (const z of [-.31, .31]) this.box(plot, .86, .025, .025, K.MAT.wood, 0, .015, z);
          for (const x of [-.42, .42]) this.box(plot, .025, .025, .62, K.MAT.wood, x, .015, 0);
          this.box(plot, .025, .18, .025, K.MAT.woodDark, -.28, .1, -.1); this.box(plot, .24, .12, .045, K.MAT.wood, -.28, .20, -.1);
          batch(plot); this.plots.get(c.id).foundation = plot;
        } else this.special(g, c.label, c.id);
      });
      // 中央微縮景物都低於 .7；骰子獨立位於前側淺盤。
      const lib = this.building(4, 1);
      // 主景含旗號，尺寸 1.6 × 1.0（XZ），高 .65；不連同接觸陰影計尺寸。
      lib.scale.set(1.6 / .82, .65 / .84, 1 / .67); lib.position.set(0, .17, -1.85); fixed.add(lib);
      this.library = lib;
      for (let i = 0; i < 4; i++) this.box(fixed, .50, .035, .30, K.MAT.plastic('#b8b5a2'), (i % 2 ? .06 : -.06), .19, -.70 - i * .22);
      for (const [i, x, z] of [[0,-2.35,-2.25],[1,-1.65,-2.5],[2,1.65,-2.5],[3,2.35,-2.2],[4,-2.4,.15],[5,2.45,.1]]) {
        this.cylinder(fixed, .045, .06, .23, K.MAT.woodDark, x, .28, z);
        this.mesh(fixed, new T.SphereGeometry(.24, 12, 8), K.MAT.plastic(i % 2 ? '#377456' : '#69994d'), x, .59, z);
      }
      for (const x of [-1.85, 1.85]) {
        this.cylinder(fixed, .055, .055, .44, K.MAT.plastic('#e3aa52'), x, .39, -.65);
        this.mesh(fixed, new T.ConeGeometry(.07, .10, 12), K.MAT.wood, x, .66, -.65);
        const glow = K.material('monopoly-lamp', '#fff1dc', .5, 0, { emissive: new T.Color('#ffd995').convertSRGBToLinear(), emissiveIntensity: .4 });
        this.cylinder(fixed, .17, .12, .12, glow, x, .71, -.65);
      }
      this.box(fixed, .62, .27, .43, K.MAT.gold, 2.15, .305, -1.3); this.box(fixed, .66, .08, .46, K.MAT.woodDark, 2.15, .48, -1.3);
      const plaque = new T.Group(); plaque.position.set(1.95, .37, 1.0); plaque.rotation.x = -.60;
      this.sign(plaque, '課文探險', 0, 0, 0, 1.65, .60, '#c58b54'); fixed.add(plaque); this.plaque = plaque;
      this.cylinder(fixed, 1.33, 1.33, .09, K.MAT.wood, 0, .21, .85);
      const rim = this.mesh(fixed, new T.TorusGeometry(1.29, .06, 6, 48), K.MAT.woodDark, 0, .29, .85); rim.rotation.x = Math.PI / 2;
      this.die = K.dice(); this.die.position.set(0, .26, .85); this.root.add(this.die); batch(this.die.userData.body);
      // 色帶購地發光使用獨立覆蓋片，不改共用材質。
      batch(fixed); this.fixed = fixed;
      this.reward = this.mesh(this.root, new T.TorusGeometry(.32, .045, 6, 24), K.MAT.gold, 0, .55, -1); this.reward.visible = false;
      this.sync();
    }
    special(g, label, id) {
      const T = window.THREE, P = K.MAT.paper, W = K.MAT.woodDark, blue = K.MAT.plastic('#1f5fa8');
      const prop = new T.Group(), d = this.inward(id); prop.position.set(-d[0] * .30, .12, -d[1] * .30); g.add(prop);
      const shadow = K.blobShadow(.9, .17); shadow.position.y = .003; prop.add(shadow);
      if (label === '起點') {
        this.box(prop, .035, .50, .035, W, -.18, .26, 0);
        const shape = new T.Shape(); shape.moveTo(0, 0); shape.lineTo(.38, -.12); shape.lineTo(0, -.23); shape.closePath();
        this.mesh(prop, new T.ShapeGeometry(shape), K.MAT.plastic('#1f7a43'), -.16, .51, .01); this.sign(prop, '起跑', .1, .10, .12, .37, .16, '#c58b54');
      } else if (label === '機會') { this.box(prop, .43, .43, .43, K.MAT.gold, 0, .23); this.sign(prop, '?', 0, .24, .225, .27, .31, '#d9a441'); }
      else if (label === '命運' || label === '綜合複習') {
        for (let i = 0; i < 3; i++) { const b = this.box(prop, .55, label === '命運' ? .035 : .10, .38, i % 2 ? P : blue, (i - 1) * .06, .05 + i * (label === '命運' ? .05 : .11), 0); b.rotation.y = (i - 1) * .16; }
      } else {
        this.box(prop, .68, .06, .26, K.MAT.wood, 0, .18); this.box(prop, .68, .20, .055, K.MAT.wood, 0, .31, -.12);
        for (const x of [-.25, .25]) this.box(prop, .045, .17, .19, W, x, .08);
        this.cylinder(prop, .065, .05, .10, P, .18, .27, .02); const handle = this.mesh(prop, new T.TorusGeometry(.045, .012, 5, 10), P, .25, .28, .02); handle.rotation.y = Math.PI / 2;
      }
    }
    fit() {
      if (!this.camera || !this.root) return;
      const T = window.THREE, cam = this.camera;
      const angle = 54 * Math.PI / 180;
      const corners = [-5.54, 5.54].flatMap(x => [-5.54, 5.54].flatMap(z => [-.55, 0].map(y => new T.Vector3(x, y, z))));
      // 先求左右各 5% 的距離，再迭代畫布比例及垂直中心，避免高度 fit 把棋盤縮小。
      let aspect = 1.22, targetY = 0, distance;
      for (let pass = 0; pass < 8; pass++) {
        cam.aspect = aspect; cam.updateProjectionMatrix();
        const place = dist => { cam.position.set(0, targetY + Math.sin(angle) * dist, Math.cos(angle) * dist); cam.lookAt(0, targetY, 0); cam.updateMatrixWorld(true); };
        let low = 8, high = 65;
        for (let n = 0; n < 32; n++) {
          const dist = (low + high) / 2; place(dist);
          if (corners.every(p => Math.abs(p.clone().project(cam).x) <= .90)) high = dist; else low = dist;
        }
        distance = high; place(distance);
        const ys = corners.map(p => p.clone().project(cam).y), min = Math.min(...ys), max = Math.max(...ys);
        targetY += (max + min) / 2 * distance * Math.tan(cam.fov * Math.PI / 360) / Math.sin(angle);
        aspect *= 1.80 / (max - min);
      }
      this.surface.style.aspectRatio = String(aspect);
      // 同步 CSS 高度的結果；不用尚未完成排版的舊 rect.height。
      cam.aspect = aspect; cam.updateProjectionMatrix();
      cam.position.set(0, targetY + Math.sin(angle) * distance, Math.cos(angle) * distance); cam.lookAt(0, targetY, 0); cam.updateMatrixWorld(true);
      this.baseDistance = distance; this.fitAspect = aspect;
    }

    layoutLabels() {
      if (!this.active || !this.camera) return;
      const r = this.surface.getBoundingClientRect(), point = (p, node) => { p.project(this.camera); node.style.left = `${(p.x + 1) * r.width / 2}px`; node.style.top = `${(1 - p.y) * r.height / 2}px`; };
      this.cells.forEach(c => {
        const { box, state, step } = this.domCells.get(c.id), p = this.labelPosition(c.id); p.y = .30; point(p, box);
        const q = this.anchor(c.id, -.02); q.y = .30; q.x += .58; point(q, step);
        box.classList.toggle('is-current', this.focused?.cell === c.id); box.classList.toggle('is-destination', this.destination === c.id);
        const n = this.domSteps.get(c.id)?.n || ''; if (step.textContent !== n) step.textContent = n; step.style.setProperty('--rg3d-step-color', K.TOKENS.teams[this.domSteps.get(c.id)?.team || 0]);
        if (state.textContent) state.textContent = ''; box.setAttribute('aria-label', [c.label, this.owners.has(c.id) ? `${this.owners.get(c.id) + 1}隊擁有` : '', ...[...this.tokens].filter(([, cell]) => cell === c.id).map(([i]) => `${i + 1}隊`)].filter(Boolean).join('，'));
      });
    }
    position(i, cell) {
      const p = this.cellPosition(cell), d = this.inward(cell), radial = i < 2 ? -.14 : .18, tangent = i % 2 ? .30 : -.30;
      p.x += d[0] * radial + d[1] * tangent; p.z += d[1] * radial - d[0] * tangent; return p;
    }
    ensurePiece(i) { if (!this.pieces.has(i)) { const piece = K.piece(i); piece.scale.setScalar(.30); batch(piece.children[0]); this.pieces.set(i, piece); this.root.add(piece); } return this.pieces.get(i); }
    sync() {
      if (!this.root) return;
      for (const [i, cell] of this.tokens) this.ensurePiece(i).position.copy(this.position(i, cell));
      for (const [cell, team] of this.owners) if (!this.buildings.has(cell)) this.ownerModel(cell, team);
      if (this.die && this.die.userData.value !== this.dieValue) this.die.roll(this.dieValue, { calm: true });
      this.updatePennants();
    }
    stopIdle() { this.idleEpoch++; for (const p of this.pieces.values()) p.idle({ active: false, stage: this.stage }); }
    startIdle() {
      this.stopIdle(); if (!this.active || this.disposed || this.completed || document.hidden || !this.focused || !this.stage?.active || document.body.classList.contains('calm') || window.RG?.systemReduced()) return;
      const epoch = this.idleEpoch, piece = this.pieces.get(this.focused.i); if (!piece) return;
      const loop = () => { if (epoch !== this.idleEpoch || !this.stage.active || this.disposed || document.hidden || document.body.classList.contains('calm') || window.RG?.systemReduced()) return;
        piece.idle({ active: true, stage: this.stage }).then(loop);
      }; loop();
    }
    moveToken(i, cell, { instant = false } = {}) {
      if (this.disposed) return done(); this.tokens.set(i, cell);
      if (!this.active || !this.root) return done();
      const p = this.ensurePiece(i), target = this.position(i, cell); this.stopIdle();
      if (instant) this.stage.cancelTween(p.uuid + ':hop');
      const promise = instant ? (p.position.copy(target), done()) : p.hop(p.position.clone(), target, { stage: this.stage });
      this.draw(); return promise.then(() => { this.startIdle(); });
    }
    stepMark(i, cell, n) { if (this.disposed) return done(); this.domSteps.set(cell, { team: i, n: String(n) }); this.destination = cell; this.draw(); return done(); }
    clearMarks() { this.domSteps.clear(); this.destination = null; this.draw(); return done(); }
    rollDice(n) { if (this.disposed) return done(); this.dieValue = n; if (!this.active || !this.die) return done(); return this.die.roll(n, { stage: this.stage }); }
    focusPlayer(i, cell) {
      if (this.disposed) return done(); this.focused = { i, cell }; this.startIdle(); this.draw();
      if (!this.active || !this.camera) return done();
      const camera = this.camera;
      return this.stage.tween('focus', 500, t => { camera.zoom = 1 + .025 * Math.sin(Math.PI * t); camera.updateProjectionMatrix(); });
    }
    ownerModel(cell, team) {
      const c = this.cells.find(c => c.id === cell); if (!c?.band) return null;
      const model = this.building(Number(c.label.match(/\d+/)?.[0]) || 1, team), p = this.anchor(cell, -.54);
      model.position.set(p.x, .26, p.z); this.orientPlot(model, cell); this.root.add(model); this.buildings.set(cell, model); this.plots.get(cell).foundation.visible = false; return model;
    }
    updatePennants() {
      if (!this.root) return;
      const groups = new Map(); for (const c of this.cells.filter(c => c.band)) { const key = c.label; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(c.id); }
      for (const [key, ids] of groups) {
        if (ids.length !== 2 || !this.owners.has(ids[0]) || this.owners.get(ids[0]) !== this.owners.get(ids[1]) || this.pennants.has(key)) continue;
        const T = window.THREE, g = new T.Group(), team = this.owners.get(ids[0]), a = this.anchor(ids[0], -.54), b = this.anchor(ids[1], -.54), mat = K.MAT.plastic(K.TOKENS.teams[team]);
        const points = [];
        for (let i = 0; i <= 12; i++) { const t = i / 12; points.push(new T.Vector3(a.x + (b.x - a.x) * t, 1.02 - .13 * Math.sin(Math.PI * t), a.z + (b.z - a.z) * t)); }
        this.mesh(g, new T.TubeGeometry(new T.CatmullRomCurve3(points), 12, .012, 4, false), K.MAT.woodDark);
        for (let i = 1; i <= 5; i++) { const t = i / 6, shape = new T.Shape(); shape.moveTo(-.075, 0); shape.lineTo(.075, 0); shape.lineTo(0, -.13); shape.closePath(); const m = this.mesh(g, new T.ShapeGeometry(shape), mat, a.x + (b.x - a.x) * t, 1.02 - .13 * Math.sin(Math.PI * t), a.z + (b.z - a.z) * t); m.rotation.y = Math.atan2(b.z - a.z, b.x - a.x) * -1; }
        batch(g); this.root.add(g); this.pennants.set(key, g);
      }
    }
    setOwner(cell, team) {
      if (this.disposed || this.owners.get(cell) === team) return done(); this.owners.set(cell, team);
      if (!this.active || !this.root) return done();
      const existing = this.buildings.get(cell); if (existing) { this.release(existing); this.buildings.delete(cell); }
      const model = this.ownerModel(cell, team); if (!model) return done(); model.visible = false;
      const c = this.cells.find(c => c.id === cell), d = this.inward(cell), p = this.cellPosition(cell), flash = new window.THREE.Group();
      flash.position.set(p.x + d[0] * .60, .29, p.z + d[1] * .60); this.root.add(flash);
      this.box(flash, d[0] ? .42 : 1.62, .015, d[1] ? .42 : 1.62, K.MAT.plastic('#fff4c9'));
      const flag = this.stage.tween('purchase-flash:' + cell, 300, t => { flash.visible = t < 1; }).then(() => {
        this.release(flash); model.visible = true; model.scale.y = .001;
        return this.stage.tween('purchase-grow:' + cell, 700, t => { const q = t < .78 ? 1.08 * (1 - Math.pow(1 - t / .78, 3)) : 1.08 - .08 * ((t - .78) / .22); model.scale.y = Math.max(.001, q); });
      }).then(() => { this.updatePennants(); this.draw(); });
      // 不讓呼吸與 cheer 同時改角色的垂直位置。
      this.stopIdle(); const cheer = this.pieces.get(team)?.cheer({ stage: this.stage }) || done();
      return Promise.all([flag, cheer]).then(() => this.startIdle());
    }
    presentFinish() {
      if (this.disposed) return done(); this.completed = true; this.stopIdle();
      if (!this.active) return done(); this.reward.visible = true;
      const cheer = [...this.pieces.values()].map(p => p.cheer({ stage: this.stage }));
      return Promise.all([...cheer, this.stage.tween('finish-reward', 900, t => { this.reward.rotation.z = t * Math.PI * 2; this.reward.scale.setScalar(1 + Math.sin(Math.PI * t) * .2); })]);
    }
    release(group) { group.parent?.remove(group); group.traverse(o => { o.geometry?.dispose(); if (o.userData.ownedMaterial) o.material.dispose(); }); }
    stats() {
      let triangles = 0, calls = 0; const maps = new Set();
      this.root?.traverseVisible(o => { if (!o.isMesh) return; calls++; triangles += (o.geometry.index?.count || o.geometry.attributes.position.count) / 3;
        for (const mat of [o.material].flat()) if (mat.map) maps.add(mat.map); });
      return { triangles, calls, canvasTextures: maps.size, textureSizes: [...maps].map(m => [m.image.width, m.image.height]) };
    }
    dispose() {
      if (this.disposed) return done(); this.disposed = true; this.stopIdle(); this.stage.dispose();
      this.detached.disconnect(); document.removeEventListener('visibilitychange', this.visible); this.surface.remove(); this.domLabels.remove(); this.host.classList.remove('is-3d');
      this.ownedFeltMap?.dispose(); K.releaseMaterial('monopoly-felt:' + this.root?.uuid); this.ownedMap?.dispose(); K.releaseMaterial(this.signKey); return done();
    }
  }
  window.RG3DMonopoly = { building(lesson, team, signMaterial) { const factory = Object.create(View.prototype); factory.signMaterial = signMaterial; return factory.building(lesson, team); }, mount(opts) {
    if (!opts?.host || !K) return null;
    let v;
    try {
      if (!document.querySelector('style[data-rg3d-monopoly]')) { const style = el('style'); style.setAttribute('data-rg3d-monopoly', ''); style.textContent = STYLE; document.head.append(style); }
      v = new View(opts); return v;
    } catch (_) { v?.dispose(); opts.host.classList.remove('is-3d'); opts.onMode?.(false); return null; }
  } };
})();
