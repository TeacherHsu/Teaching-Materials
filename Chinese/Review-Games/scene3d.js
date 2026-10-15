/* 綜合複習 3D 視圖：狀態由各遊戲傳入，這裡不出題、不計分、不改學習紀錄。 */
(function () {
  'use strict';
  const CDN = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/';
  const instances = new Set();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 760px)');
  const colors = ['#c0362c', '#1f5fa8', '#1f7a43', '#6b3fb0'];
  let library, effects, toolbar;
  const el = (tag, cls, text) => { const n = document.createElement(tag); n.className = cls || ''; if (text) n.textContent = text; return n; };
  const isCalm = () => reduced.matches || document.body.classList.contains('calm');
  function script(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      const timer = setTimeout(() => { s.remove(); reject(new Error('載入逾時')); }, 6500);
      s.src = src; s.onload = () => { clearTimeout(timer); resolve(); };
      s.onerror = () => { clearTimeout(timer); s.remove(); reject(new Error('無法載入')); };
      document.head.append(s);
    });
  }
  function loadThree() {
    if (window.THREE) return Promise.resolve();
    if (!library) library = script('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
    return library;
  }
  // 後製可獨立失敗；泛光只照亮成功標記，文字維持深色、高對比。
  function loadEffects() {
    if (!effects) effects = (async () => {
      await Promise.all(['shaders/CopyShader.js', 'shaders/LuminosityHighPassShader.js'].map((p) => script(CDN + p)));
      await script(CDN + 'postprocessing/EffectComposer.js');
      await Promise.all(['postprocessing/RenderPass.js', 'postprocessing/ShaderPass.js'].map((p) => script(CDN + p)));
      await script(CDN + 'postprocessing/UnrealBloomPass.js');
    })();
    return effects;
  }
  function controls() {
    if (toolbar && toolbar.isConnected) return;
    toolbar = el('div', 'rg3d-tools'); toolbar.setAttribute('aria-label', '畫面設定');
    const status = el('span', 'rg3d-status', '正在準備立體視圖，已可開始操作'); status.setAttribute('role', 'status');
    toolbar.append(status);
    [['calm', '減少動態'], ['proj', '投影模式']].forEach(([key, text]) => {
      const label = el('label', 'rg3d-switch'); const input = document.createElement('input'); input.type = 'checkbox';
      input.checked = document.body.classList.contains(key);
      input.addEventListener('change', () => document.body.classList.toggle(key, input.checked));
      label.append(input, document.createTextNode(text)); toolbar.append(label);
    });
    const heading = document.querySelector('#app .topbar');
    if (heading) heading.after(toolbar);
  }
  function refresh() { for (const v of instances) v.refresh(); }
  new MutationObserver(() => {
    if (toolbar) toolbar.querySelectorAll('input').forEach((n, i) => { n.checked = document.body.classList.contains(i ? 'proj' : 'calm'); });
    refresh();
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(() => { for (const v of instances) if (!v.host.isConnected) v.dispose(); }).observe(document.body, { childList: true, subtree: true });
  reduced.addEventListener('change', refresh); narrow.addEventListener('change', refresh);
  document.addEventListener('visibilitychange', () => { for (const v of instances) v.visibility(); });
  window.addEventListener('pagehide', () => { for (const v of [...instances]) v.dispose(); });

  class View {
    constructor(options) {
      Object.assign(this, options);
      this.tokens = new Map(); this.owners = new Map(); this.marks = new Map(); this.lineState = [];
      this.tweens = new Map(); this.labels = []; this.meshCells = new Map(); this.pieces = new Map(); this.flags = new Map();
      this.projection = false; this.active = false; this.disposed = false; this.failed = ''; this.dieValue = 1;
      this.overlay = this.kind === 'dobble' || this.kind === 'bingo';
      this.surface = el('div', 'rg3d-surface'); this.surface.setAttribute('aria-hidden', 'true');
      this.host.classList.add('rg3d-host', `rg3d-${this.kind}`); this.host.prepend(this.surface);
      if (this.kind === 'bingo') { this.feedbackLayer = el('div', 'rg3d-feedback-lines'); this.feedbackLayer.setAttribute('aria-hidden', 'true'); this.host.append(this.feedbackLayer); }
      if (!this.overlay && this.cells) {
        this.domLabels = el('div', 'rg3d-dom-labels');
        this.domCells = new Map();
        this.cells.forEach((c) => {
          const box = el('div', 'rg3d-cell-label');
          const name = el('span', 'rg3d-cell-name'); name.textContent = `${this.kind === 'monopoly' ? c.id + ' ' : ''}${c.label} ${c.direction || ''}`;
          const detail = el('span', 'rg3d-cell-detail'); detail.textContent = c.detail || '';
          const state = el('span', 'rg3d-cell-state');
          box.append(name, detail, state); this.domLabels.append(box); this.domCells.set(c.id, { box, state });
        });
        this.host.append(this.domLabels);
      }
      controls(); instances.add(this);
      this.resizeObserver = new ResizeObserver(() => { if (this.active) { try { this.resize(); } catch (_) { this.failed = '立體視圖無法使用'; this.mode(false); } } }); this.resizeObserver.observe(this.host);
      this.refresh();
    }
    status(text) { if (toolbar && toolbar.isConnected) toolbar.querySelector('.rg3d-status').textContent = text; }
    async refresh() {
      if (this.disposed) return;
      const reason = isCalm() ? '減少動態' : narrow.matches ? '窄螢幕' : this.failed;
      if (reason) { this.mode(false); this.status(`2D 模式・${reason}，玩法相同`); return; }
      if (this.loading) return;
      if (!this.renderer) {
        this.loading = true;
        try {
          await loadThree();
          if (this.disposed) return;
          if (isCalm() || narrow.matches) return;
          this.init();
        } catch (_) { this.failed = '立體視圖無法使用'; }
        finally { this.loading = false; }
        if (!this.renderer || this.failed) { this.mode(false); this.status('2D 模式・立體視圖無法使用，玩法相同'); return; }
      }
      // 等待 CDN 時切換顯示設定，也必須以當下設定為準。
      if (isCalm() || narrow.matches) { this.mode(false); return; }
      try { this.mode(true); } catch (_) { this.failed = '立體視圖無法使用'; this.mode(false); return; }
      const proj = document.body.classList.contains('proj');
      const changed = this.projection !== proj;
      if (changed) { this.projection = proj; this.updateProjection(); }
      try { this.resize(changed); if (this.pendingDeal) this.deal(); this.status('3D 立體視圖・題目與操作保留大字'); }
      catch (_) { this.failed = '立體視圖無法使用'; this.mode(false); }
    }
    mode(on) {
      if (this.active === on) return;
      this.active = on;
      if (!on) { this.finishTweens(); cancelAnimationFrame(this.frame); this.frame = 0; }
      this.boardLabelKey = null;
      this.host.classList.toggle('is-3d', on);
      const original = this.host.querySelector('.tilt'); if (original) original.setAttribute('aria-hidden', String(on));
      if (this.onMode) this.onMode(on);
      if (on) { this.sync(); this.draw(); }
    }
    init() {
      const T = window.THREE;
      this.renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
      this.renderer.outputEncoding = T.sRGBEncoding;
      this.renderer.toneMapping = T.ACESFilmicToneMapping; this.renderer.toneMappingExposure = .98;
      this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = T.PCFSoftShadowMap;
      this.surface.append(this.renderer.domElement);
      this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
        e.preventDefault(); if (this.disposed) return; this.failed = 'WebGL 已中斷'; this.mode(false); this.status('2D 模式・WebGL 已中斷，請繼續遊戲');
      });
      this.scene = new T.Scene();
      // 後製以暖色底合成，避免透明畫布在泛光後出現黑底。
      this.scene.background = new T.Color('#bd8b62').convertSRGBToLinear();
      this.camera = new T.PerspectiveCamera(36, 1, .1, 120);
      this.camera.position.set(0, 18, 15); this.camera.lookAt(0, 0, 0);
      this.scene.add(new T.HemisphereLight(0xffe9cc, 0x51453e, .42));
      const key = new T.DirectionalLight(0xffdfb0, 1.25); key.position.set(-7, 13, 6); key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, far: 50 }); key.shadow.camera.updateProjectionMatrix();
      key.shadow.bias = -.0003; key.shadow.normalBias = .035; key.shadow.radius = 3; this.scene.add(key);
      const rim = new T.DirectionalLight(0xb6d9ff, .7); rim.position.set(6, 7, -9); this.scene.add(rim);
      this.root = new T.Group(); this.scene.add(this.root);
      const table = this.box(40, .3, 40, '#ffffff'); table.position.y = -1.05;
      table.material.map = this.woodTexture('table'); table.material.roughness = .92;
      if (!this.overlay) this.buildBoard();
      loadEffects().then(() => {
        if (this.disposed || this.failed) return;
        try {
          const hdr = this.renderer.capabilities.isWebGL2 ? this.renderer.extensions.has('EXT_color_buffer_float') : this.renderer.extensions.has('EXT_color_buffer_half_float') && this.renderer.extensions.has('OES_texture_half_float_linear');
          if (!hdr) return; // 不支援浮點附件的 GPU 使用一般 3D，不冒黑畫面風險。
          // 底圖與發光遮罩分開：白字卡、木桌與格子不會被泛光洗白。
          this.baseTarget = new T.WebGLRenderTarget(512, 512, { type: T.HalfFloatType });
          const target = new T.WebGLRenderTarget(512, 512, { type: T.HalfFloatType });
          this.composer = new T.EffectComposer(this.renderer, target);
          this.composer.addPass(new T.RenderPass(this.scene, this.camera));
          this.bloom = new T.UnrealBloomPass(new T.Vector2(512, 512), .22, .35, 1.05);
          this.composer.addPass(this.bloom);
          const output = new T.ShaderPass({
            uniforms: { baseTexture: { value: this.baseTarget.texture }, bloomTexture: { value: this.bloom.renderTargetsHorizontal[0].texture } },
            vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
            fragmentShader: `uniform sampler2D baseTexture;
              uniform sampler2D bloomTexture;
              varying vec2 vUv;
              void main(){
                vec3 c=texture2D(baseTexture,vUv).rgb+texture2D(bloomTexture,vUv).rgb;
                gl_FragColor=vec4(c,1.0);
                #include <encodings_fragment>
              }`
          });
          // ShaderPass 會 clone uniforms；必須再接回實際 render target 的 texture。
          output.uniforms.baseTexture.value = this.baseTarget.texture; output.uniforms.bloomTexture.value = this.bloom.renderTargetsHorizontal[0].texture;
          output.material.toneMapped = false; this.composer.addPass(output);
          this.maskMaterial = new T.MeshBasicMaterial({ color: 0x000000, toneMapped: false });
          this.composer.setSize(this.width || 512, this.height || 512);
          this.baseTarget.setSize(Math.round((this.width || 512) * this.renderer.getPixelRatio()), Math.round((this.height || 512) * this.renderer.getPixelRatio())); this.draw();
        } catch (_) { this.disposeEffects(); }
      }).catch(() => { /* 後製失敗仍可使用一般 3D。 */ });
    }
    material(color, glow = false) {
      const linear = new THREE.Color(color).convertSRGBToLinear();
      return new THREE.MeshStandardMaterial({ color: linear, roughness: .6, metalness: .04, emissive: glow ? linear : 0x000000, emissiveIntensity: glow ? 2.4 : 0 });
    }
    mesh(geometry, color, parent = this.root) {
      const m = new THREE.Mesh(geometry, this.material(color)); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
    }
    box(w, h, d, color, parent) { return this.mesh(new THREE.BoxGeometry(w, h, d), color, parent); }
    roundedBox(w, h, d, color, parent, bevel = .07) {
      const s = new THREE.Shape(), x = -w / 2 + bevel, z = -d / 2 + bevel;
      const a = w - bevel * 2, b = d - bevel * 2, r = Math.min(.16, a / 5, b / 5);
      s.moveTo(x + r, z); s.lineTo(x + a - r, z); s.quadraticCurveTo(x + a, z, x + a, z + r);
      s.lineTo(x + a, z + b - r); s.quadraticCurveTo(x + a, z + b, x + a - r, z + b);
      s.lineTo(x + r, z + b); s.quadraticCurveTo(x, z + b, x, z + b - r);
      s.lineTo(x, z + r); s.quadraticCurveTo(x, z, x + r, z);
      const geo = new THREE.ExtrudeGeometry(s, { depth: h - bevel * 2, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: bevel, bevelThickness: bevel, curveSegments: 5 });
      geo.rotateX(-Math.PI / 2); geo.translate(0, -h / 2 + bevel, 0);
      const vertices = geo.getAttribute('position'), uv = geo.getAttribute('uv');
      for (let i = 0; i < vertices.count; i++) uv.setXY(i, vertices.getX(i) / w + .5, vertices.getZ(i) / d + .5);
      return this.mesh(geo, color, parent);
    }
    woodTexture(kind) {
      this.woodTextures ||= new Map(); if (this.woodTextures.has(kind)) return this.woodTextures.get(kind);
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1024;
      const c = canvas.getContext('2d'), gradient = c.createRadialGradient(500, 380, 80, 512, 512, 760);
      gradient.addColorStop(0, kind === 'table' ? '#ead1aa' : '#ba8046'); gradient.addColorStop(1, kind === 'table' ? '#ba8b60' : '#704321');
      c.fillStyle = gradient; c.fillRect(0, 0, 1024, 1024);
      for (let i = 0; i < 480; i++) {
        const y = i * 2.2; c.strokeStyle = `rgba(80,42,18,${.025 + (i % 7) * .006})`; c.lineWidth = .6 + i % 3;
        c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(300, y + Math.sin(i) * 9, 700, y + Math.cos(i * .7) * 12, 1024, y); c.stroke();
      }
      const t = new THREE.CanvasTexture(canvas); t.encoding = THREE.sRGBEncoding; t.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
      this.woodTextures.set(kind, t); return t;
    }
    label(text, width = 1.4, height = .48, bg = '#fffaf3', ink = '#2b1d12') {
      const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = Math.round(768 * height / width);
      const c = canvas.getContext('2d'); c.fillStyle = bg; c.fillRect(0, 0, canvas.width, canvas.height);
      c.fillStyle = ink; c.textAlign = 'center'; c.textBaseline = 'middle';
      // 使用裝置正體中文字型；不把注音或教學文字搬進材質。
      c.font = `900 ${Math.min(canvas.height * .72, canvas.width / Math.max([...text].length, 2) * .88)}px "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", sans-serif`;
      c.fillText(text, canvas.width / 2, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas); texture.encoding = THREE.sRGBEncoding;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false, toneMapped: false }));
      sprite.scale.set(width * (this.projection ? 1.16 : 1), height * (this.projection ? 1.16 : 1), 1); sprite.userData.baseScale = [width, height]; sprite.renderOrder = 5;
      this.labels.push(sprite); return sprite;
    }
    cellPosition(index) {
      const c = this.cells.find((c) => c.id === index); return new THREE.Vector3((c.col - 2.5) * 1.8, .28, (c.row - (this.kind === 'snakes' ? 2 : 2.5)) * 1.8);
    }
    buildBoard() {
      const T = THREE, depth = this.kind === 'snakes' ? 9.5 : 11.4;
      const plinth = this.roundedBox(11.55, .6, depth, '#ffffff'); plinth.position.y = -.4;
      plinth.material.map = this.woodTexture('board'); plinth.material.roughness = .46;
      const inset = this.roundedBox(11.12, .16, depth - .4, '#593d2b'); inset.position.y = -.06;
      // 金色細邊與雙層底座讓棋盤邊緣、厚度、投影有清楚的層次。
      const foot = this.roundedBox(11.25, .16, depth - .15, '#4d3021'); foot.position.y = -.75;
      this.cells.forEach((c) => {
        const p = this.cellPosition(c.id);
        const lesson = Number((c.label.match(/^第(\d)課$/) || [])[1]);
        const palette = ['#de5942', '#e5a529', '#52a765', '#3699c5', '#8c69bc', '#cf6b9e'];
        const color = this.kind === 'snakes' ? ((c.row + c.col) % 2 ? '#e2ad67' : '#f4d29b') : lesson ? palette[lesson - 1] : c.label === '綜合複習' ? '#69a5c8' : '#edc580';
        const m = this.roundedBox(1.65, .31, 1.65, color); m.position.copy(p); m.position.y = .13;
        m.material.roughness = lesson ? .45 : .72;
        this.meshCells.set(c.id, m);
        const snakes = this.kind === 'snakes';
        if (this.kind === 'monopoly' && !lesson && c.label !== '綜合複習') this.specialProp(c, p);
      });
      if (this.kind === 'monopoly') {
        const pad = this.mesh(new T.CylinderGeometry(2.9, 3, .2, 80), '#285e61'); pad.position.y = .06;
        const rim = this.mesh(new T.TorusGeometry(2.88, .045, 8, 80), '#edb95b'); rim.rotation.x = Math.PI / 2; rim.position.y = .2;
        const l = this.label('課文探險', 4.05, .88, '#fff2d1', '#54331f'); l.position.set(0, .5, -1.1); this.root.add(l);
        for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; const tick = this.box(k % 6 ? .05 : .09, .03, k % 6 ? .22 : .36, '#edb95b'); tick.position.set(Math.sin(a) * 2.55, .19, Math.cos(a) * 2.55); tick.rotation.y = a; }
        [['#de5942', 0], ['#3699c5', .22], ['#e5a529', .44]].forEach(([c, y], k) => { const b = this.roundedBox(1.05, .2, .75, c, undefined, .05); b.position.set(-1.75, .24 + y, .55); b.rotation.y = .25 - k * .2; const page = this.box(.98, .14, .66, '#fff8e8'); page.position.set(-1.68, .24 + y, .55); page.rotation.y = b.rotation.y; });
        const quill = this.mesh(new T.ConeGeometry(.09, 1.1, 8), '#f6efe2'); quill.position.set(1.75, .55, .7); quill.rotation.z = -.9; quill.rotation.x = .3;
        this.buildDie(new T.Vector3(0, .85, .65));
      } else {
        this.paths = new Map();
        Object.entries(this.ladders).forEach(([a, b]) => this.ladder(+a, b));
        Object.entries(this.snakes).forEach(([a, b]) => this.snake(+a, b));
        this.trophy(this.cellPosition(30));
        // 骰子放在前方獨立木托盤，納入相機取景邊界，遠離右側裁切區。
        const tray = this.roundedBox(3.6, .22, 1.9, '#ffffff'); tray.position.set(0, -.55, 5.35); tray.material.map = this.woodTexture('board');
        const felt = this.roundedBox(3.24, .15, 1.58, '#285e61'); felt.position.set(0, -.39, 5.35);
        this.buildDie(new T.Vector3(0, .38, 5.35));
      }
    }
    specialProp(c, p) {
      const g = new THREE.Group(); this.root.add(g); g.position.copy(p); g.position.z += .22;
      if (c.label === '起點') {
        this.rod(new THREE.Vector3(-.22, 0, 0), new THREE.Vector3(-.22, .85, 0), .035, '#75502d', g);
        const f = this.box(.6, .35, .07, '#e75438', g); f.position.set(.07, .67, 0);
      } else if (c.label === '機會') {
        const coin = this.mesh(new THREE.CylinderGeometry(.35, .35, .18, 32), '#d99523', g); coin.position.y = .15;
        const q = this.label('?', .47, .5, '#d99523', '#3c2517'); q.position.y = .47; g.add(q);
      } else if (c.label === '休息站') {
        const cup = this.mesh(new THREE.CylinderGeometry(.25, .19, .44, 32), '#31889c', g); cup.position.y = .28;
        const drink = this.mesh(new THREE.CylinderGeometry(.215, .215, .025, 32), '#5b321e', g); drink.position.y = .51;
        const handle = this.mesh(new THREE.TorusGeometry(.16, .055, 8, 20), '#31889c', g); handle.position.set(.26, .3, 0);
      } else {
        const die = this.roundedBox(.56, .56, .56, '#ffedd0', g, .06); die.position.y = .29; die.rotation.y = .3;
        [-1, 1].forEach((s) => { const dot = this.mesh(new THREE.SphereGeometry(.06, 10, 8), '#704224', g); dot.position.set(s * .12, .4 + s * .12, .3); });
      }
    }
    rod(a, b, radius, color, parent = this.root) {
      const d = new THREE.Vector3().subVectors(b, a);
      const m = this.mesh(new THREE.CylinderGeometry(radius, radius, d.length(), 10), color, parent);
      m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m;
    }
    ladder(a, b) {
      const start = this.cellPosition(a), end = this.cellPosition(b); start.y = end.y = .32;
      const dir = end.clone().sub(start).normalize(); const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(.23);
      [-1, 1].forEach((s) => { const rail = this.rod(start.clone().addScaledVector(side, s), end.clone().addScaledVector(side, s), .075, '#e4b46f'); rail.material.map = this.woodTexture('board'); rail.material.roughness = .8; });
      const count = Math.ceil(start.distanceTo(end) / .36);
      for (let i = 1; i < count; i++) { const p = start.clone().lerp(end, i / count); this.rod(p.clone().sub(side), p.clone().add(side), .06, '#dba65c'); }
      this.paths.set(`ladder:${a}`, new THREE.LineCurve3(start, end));
    }
    snake(a, b) {
      const start = this.cellPosition(a), end = this.cellPosition(b); start.y = end.y = .48;
      const d = end.clone().sub(start); const side = new THREE.Vector3(-d.z, 0, d.x).normalize();
      const points = Array.from({ length: 13 }, (_, i) => start.clone().lerp(end, i / 12).addScaledVector(side, Math.sin(i / 12 * Math.PI * 4) * .26));
      const path = new THREE.CatmullRomCurve3(points);
      const geo = new THREE.TubeGeometry(path, 72, .145, 10, false), attribute = geo.getAttribute('position'), shades = [];
      for (let i = 0; i < attribute.count; i++) { const shade = new THREE.Color().setHSL(.32 + .05 * i / attribute.count, .7, .26 + .14 * Math.sin(i / attribute.count * Math.PI)); shade.convertSRGBToLinear(); shades.push(shade.r, shade.g, shade.b); }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(shades, 3));
      const body = this.mesh(geo, '#ffffff'); body.material.vertexColors = true; body.material.roughness = .4; this.paths.set(`snake:${a}`, path);
      for (let i = 1; i < 20; i++) { const spot = this.mesh(new THREE.SphereGeometry(.065, 8, 6), '#e0cf59'); spot.scale.y = .3; spot.position.copy(path.getPoint(i / 20)); spot.position.y += .14; }
      const head = this.mesh(new THREE.SphereGeometry(.27, 20, 12), '#459e36'); head.scale.z = 1.3; head.position.copy(start);
      [-1, 1].forEach((s) => {
        const eye = this.mesh(new THREE.SphereGeometry(.09, 12, 8), '#fffbe3'); eye.position.copy(start).add(new THREE.Vector3(s * .13, .21, -.08));
        const pupil = this.mesh(new THREE.SphereGeometry(.044, 10, 8), '#18291b'); pupil.position.copy(eye.position).add(new THREE.Vector3(0, .06, .04));
      });
    }
    trophy(p) {
      const g = new THREE.Group(); g.position.copy(p); g.position.x += .45; g.position.z += .2; this.root.add(g);
      const base = this.box(.55, .12, .5, '#86613d', g); base.position.y = .05;
      const stem = this.mesh(new THREE.CylinderGeometry(.08, .13, .25, 16), '#e6af38', g); stem.position.y = .2;
      const cup = this.mesh(new THREE.CylinderGeometry(.28, .1, .35, 24), '#e6af38', g); cup.position.y = .45;
      [-1, 1].forEach((s) => { const handle = this.mesh(new THREE.TorusGeometry(.18, .035, 8, 20), '#e6af38', g); handle.position.set(s * .26, .48, 0); });
      g.scale.setScalar(1.35); cup.material.metalness = .55; cup.material.roughness = .23; cup.material.emissive.copy(cup.material.color); cup.material.emissiveIntensity = .4;
      const halo = this.mesh(new THREE.TorusGeometry(.42, .035, 8, 32), '#efb73d', g); halo.rotation.x = Math.PI / 2; halo.position.y = .08; halo.material.emissive.copy(halo.material.color); halo.material.emissiveIntensity = 2.4; halo.userData.feedback = 1;
    }
    buildDie(p) {
      const g = new THREE.Group(); g.position.copy(p); this.root.add(g); this.dice = g; this.diceHome = p.clone();
      const shell = this.roundedBox(.98, .98, .98, '#fff3d8', g, .09); shell.material.roughness = .27;
      const faces = [[1, [0, 1, 0]], [6, [0, -1, 0]], [2, [1, 0, 0]], [5, [-1, 0, 0]], [3, [0, 0, 1]], [4, [0, 0, -1]]];
      const dots = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]] };
      faces.forEach(([n, axis]) => {
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...axis));
        dots[n].forEach(([x, y]) => { const dot = this.mesh(new THREE.SphereGeometry(.073, 12, 8), n === 1 ? '#b73527' : '#30241c', g); dot.scale.z = .22; dot.quaternion.copy(q); dot.position.set(x * .23, y * .23, .496).applyQuaternion(q); });
      });
      g.scale.setScalar(1.3);
    }
    async rollDice(n) {
      this.dieValue = n;
      if (!this.active || !this.dice) return;
      // 六面各有固定點數，最後讓指定面朝上；拋物線加兩次衰減碰跳。
      const end = { 1: [0, 0, 0], 6: [Math.PI, 0, 0], 2: [0, 0, Math.PI / 2], 5: [0, 0, -Math.PI / 2], 3: [-Math.PI / 2, 0, 0], 4: [Math.PI / 2, 0, 0] }[n];
      const from = this.dice.rotation.clone();
      await this.tween('dice', 930, (t) => {
        const ease = 1 - Math.pow(1 - t, 3);
        this.dice.rotation.set(...end.map((v, i) => from[['x', 'y', 'z'][i]] * (1 - ease) + (v + Math.PI * 4) * ease));
        this.dice.position.y = this.diceHome.y + Math.abs(Math.sin(t * Math.PI * 3)) * (1 - t) * 1.7;
        this.dice.position.x = this.diceHome.x + Math.sin(t * Math.PI * 2) * (1 - t) * .7;
      });
    }
    piece(i) {
      const g = new THREE.Group(); this.root.add(g);
      const geo = [() => new THREE.SphereGeometry(.23, 20, 16), () => new THREE.BoxGeometry(.42, .42, .42), () => new THREE.ConeGeometry(.3, .5, 3), () => new THREE.OctahedronGeometry(.31)][i % 4]();
      const m = this.mesh(geo, colors[i % 4], g); m.position.y = .24;
      const ring = this.mesh(new THREE.CylinderGeometry(.3, .33, .1, 24), '#f3c365', g); ring.position.y = .03;
      const base = this.mesh(new THREE.CylinderGeometry(.34, .36, .09, 24), colors[i % 4], g); base.position.y = -.04;
      const l = this.label(String(i + 1), .34, .32, colors[i % 4], '#ffffff'); l.position.y = .3; g.add(l);
      this.pieces.set(i, g); this.updateProjection(); return g;
    }
    tokenPosition(i, cell) {
      return this.cellPosition(cell).add(new THREE.Vector3((i % 2 ? 1 : -1) * .38, .02, .2 + Math.floor(i / 2) * .4));
    }
    moveToken(i, cell, options = {}) {
      const previous = this.tokens.get(i); this.tokens.set(i, cell);
      if (!this.active) return Promise.resolve();
      const g = this.pieces.get(i) || this.piece(i), target = this.tokenPosition(i, cell);
      if (previous == null || options.instant) { g.position.copy(target); this.draw(); return Promise.resolve(); }
      const from = g.position.clone(); let path = options.path && this.paths && this.paths.get(`${options.path}:${previous}`);
      if (options.path === 'snake' && path && path.getPoint(1).distanceTo(this.cellPosition(cell)) >= .5) {
        // 最多退三格時保留實際落點，以短彎曲滑道呈現，不改蛇的遊戲規則。
        const direction = target.clone().sub(from), side = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
        path = new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, k) => from.clone().lerp(target, k / 8).addScaledVector(side, Math.sin(k / 8 * Math.PI * 2) * .23)));
      }
      return this.tween(`token${i}`, options.path ? 1400 : 420, (t) => {
        const ease = t * t * (3 - 2 * t);
        if (path && options.path === 'ladder') g.position.copy(path.getPoint(ease)).add(new THREE.Vector3((i % 2 ? 1 : -1) * .38, .08 + Math.sin(t * Math.PI * 6) * .045, .2 + Math.floor(i / 2) * .4));
        else if (path && options.path === 'snake') g.position.copy(path.getPoint(ease)).add(new THREE.Vector3(0, .08, .18));
        else g.position.copy(from).lerp(target, ease).add(new THREE.Vector3(0, Math.sin(t * Math.PI) * (options.path ? .35 : .55), 0));
        if (t === 1) g.position.copy(target);
      });
    }
    layoutBoardLabels() {
      if (!this.active || !this.domLabels || !this.camera) return;
      const key = [this.host.clientWidth, this.host.clientHeight, this.projection, ...this.tokens, ...this.owners, ...(this.domSteps || [])].join('|');
      if (this.boardLabelKey === key) return; this.boardLabelKey = key;
      const positions = this.cells.map((c) => {
        const v = this.cellPosition(c.id); v.y = .55; v.z -= .5; v.project(this.camera);
        const { box, state } = this.domCells.get(c.id);
        const teams = [...this.tokens].filter(([, cell]) => cell === c.id).map(([i]) => `${i + 1}隊`);
        state.textContent = [this.owners.has(c.id) ? `屋：${this.owners.get(c.id) + 1}隊` : '', teams.join(' '), this.domSteps?.get(c.id) || ''].filter(Boolean).join('・');
        return { box, x: (v.x + 1) * this.host.clientWidth / 2, y: (1 - v.y) * this.host.clientHeight / 2 };
      });
      // 實際矩形避碰；只在尺寸／狀態改變時測量，不在動畫逐幀強制排版。
      positions.forEach((p) => { p.w = p.box.offsetWidth; p.h = p.box.offsetHeight; });
      const placed = [], width = this.host.clientWidth, height = this.host.clientHeight;
      positions.sort((a, b) => a.y - b.y).forEach((p) => {
        let best, cost = Infinity;
        const xs = new Set([4, width - p.w - 4, Math.max(4, Math.min(width - p.w - 4, p.x - p.w / 2))]);
        const ys = new Set([4, height - p.h - 4, Math.max(4, Math.min(height - p.h - 4, p.y - p.h / 2))]);
        placed.forEach((r) => { xs.add(r.x + r.w + 4); xs.add(r.x - p.w - 4); ys.add(r.y + r.h + 4); ys.add(r.y - p.h - 4); });
        for (const y of ys) for (const x of xs) {
          if (x < 4 || y < 4 || x + p.w > width - 4 || y + p.h > height - 4) continue;
          const d = (x + p.w / 2 - p.x) ** 2 + (y + p.h / 2 - p.y) ** 2;
          if (d >= cost || placed.some((r) => x < r.x + r.w + 4 && x + p.w + 4 > r.x && y < r.y + r.h + 4 && y + p.h + 4 > r.y)) continue;
          cost = d; best = { x, y, w: p.w, h: p.h };
        }
        p.rect = best || { x: Math.max(4, Math.min(width - p.w - 4, p.x - p.w / 2)), y: Math.max(4, Math.min(height - p.h - 4, p.y - p.h / 2)), w: p.w, h: p.h };
        placed.push(p.rect);
      });
      positions.forEach((p) => { p.box.style.left = `${p.rect.x}px`; p.box.style.top = `${p.rect.y}px`; });
    }
    // 逐格足跡：走過的格子鋪上隊伍色，頭上浮出步數 1、2、3…，讓學生看見「骰幾點就走幾格」
    stepMark(i, cell, n) {
      this.domSteps ||= new Map(); this.domSteps.set(cell, `${n}步`);
      if (!this.active) return;
      const colors = ['#c0362c', '#1f5fa8', '#1f7a43', '#6b3fb0'];
      this.stepMarks = this.stepMarks || [];
      const p = this.cellPosition(cell);
      const disc = this.mesh(new THREE.TorusGeometry(.72, .025, 6, 32), colors[i % 4]);
      disc.rotation.x = Math.PI / 2; disc.material.transparent = true; disc.material.opacity = .62; disc.position.copy(p); disc.position.y = .32;
      this.stepMarks.push(disc); this.draw();
    }
    clearMarks() {
      this.domSteps?.clear(); this.layoutBoardLabels();
      if (!this.stepMarks) return;
      this.stepMarks.forEach((m) => { m.parent?.remove(m); m.geometry?.dispose?.(); m.material?.map?.dispose?.(); m.material?.dispose?.(); });
      this.labels = this.labels.filter((l) => !this.stepMarks.includes(l));
      this.stepMarks = []; if (this.active) this.draw();
    }
    focusPlayer(i, cell) {
      this.focused = { i, cell };
      if (!this.active || this.overlay) return;
      if (!this.highlight) {
        this.highlight = new THREE.Group(); this.root.add(this.highlight);
        [-1, 1].forEach((s) => {
          const a = this.box(1.72, .045, .065, '#523522', this.highlight); a.position.z = s * .84;
          const b = this.box(.065, .045, 1.72, '#523522', this.highlight); b.position.x = s * .84;
        });
      }
      this.highlight.position.copy(this.cellPosition(cell)); this.highlight.position.y = .31;
      // 固定完整取景；不因焦點換隊而推近邊角，避免骰子／標籤出框。
      this.draw();
    }
    setOwner(cell, i) {
      if (this.owners.get(cell) === i) return;
      this.owners.set(cell, i);
      if (!this.active) return;
      this.ownerModel(cell, i, true);
      this.burst(this.cellPosition(cell), colors[i]);
    }
    // 慶祝彩紙：一次性往上噴再落下（約 0.9 秒），不循環、不閃爍；減少動態時不出現
    burst(pos, color, count = 16) {
      if (!this.active || isCalm() || document.hidden) return;
      const palette = [color, '#ffc643', '#ffffff', '#f08a4b'];
      const bits = [];
      for (let k = 0; k < count; k++) {
        const m = this.box(.12, .03, .07, palette[k % palette.length]); m.castShadow = false;
        const a = k / count * Math.PI * 2 + Math.random() * .4, sp = .9 + Math.random() * .8;
        m.userData.v = [Math.cos(a) * sp, 2.4 + Math.random() * 1.4, Math.sin(a) * sp]; m.position.copy(pos); m.position.y += .4;
        bits.push(m);
      }
      const start = pos.clone();
      this.tween(`burst${performance.now()}${Math.random()}`, 900, (t) => {
        bits.forEach((m, k) => {
          const [vx, vy, vz] = m.userData.v;
          m.position.set(start.x + vx * t, start.y + .4 + vy * t - 4.2 * t * t, start.z + vz * t);
          m.rotation.set(t * 9 + k, t * 7, t * 5); m.scale.setScalar(1 - t * .5);
        });
        if (t === 1) bits.forEach((m) => { m.parent?.remove(m); m.geometry.dispose(); m.material.dispose(); });
      });
    }
    ownerModel(cell, i, animate) {
      if (this.flags.has(cell)) return;
      const g = new THREE.Group(); g.position.copy(this.cellPosition(cell)); g.position.x += .54; g.position.z += .08; this.root.add(g); this.flags.set(cell, g);
      this.rod(new THREE.Vector3(0, .1, 0), new THREE.Vector3(0, .95, 0), .025, '#76593e', g);
      const flag = this.box(.3, .2, .04, colors[i], g); flag.position.set(.15, .82, 0);
      const house = this.box(.38, .27, .38, '#fff4d9', g); house.position.y = .22;
      const roof = this.mesh(new THREE.ConeGeometry(.34, .24, 4), colors[i], g); roof.rotation.y = Math.PI / 4; roof.position.y = .47;
      const num = this.label(String(i + 1), .24, .24, colors[i], '#ffffff'); num.position.set(.14, 1.04, 0); g.add(num);
      if (animate) this.tween(`owner${cell}`, 950, (t) => {
        g.scale.y = .05 + .95 * (1 - Math.pow(1 - Math.min(t * 2, 1), 3));
        [house, roof, flag].forEach((m) => { m.material.emissive.copy(m.material.color); m.material.emissiveIntensity = 3 * Math.sin(Math.PI * t); });
        g.userData.feedback = Math.sin(Math.PI * t);
      });
    }
    sync() {
      if (!this.renderer) return;
      if (this.overlay) this.layoutOverlay();
      else {
        this.tokens.forEach((cell, i) => { const g = this.pieces.get(i) || this.piece(i); g.position.copy(this.tokenPosition(i, cell)); });
        this.owners.forEach((i, cell) => this.ownerModel(cell, i, false));
        if (this.focused) this.focusPlayer(this.focused.i, this.focused.cell);
      }
    }
    updateProjection() {
      this.labels.forEach((s) => { const [w, h] = s.userData.baseScale; const k = this.projection ? 1.16 : 1; s.scale.set(w * k, h * k, 1); });
      this.pieces.forEach((g) => g.scale.setScalar((this.kind === 'snakes' ? 1.5 : 1.15) * (this.projection ? 1.2 : 1))); this.draw();
    }
    resize(force = false) {
      if (!this.active || !this.renderer || this.disposed) return;
      const r = this.surface.getBoundingClientRect(); if (!r.width || !r.height) return;
      if (!force && r.width === this.width && r.height === this.height) return;
      this.width = r.width; this.height = r.height;
      this.renderer.setSize(r.width, r.height, false);
      if (this.composer) this.composer.setSize(r.width, r.height);
      if (this.baseTarget) this.baseTarget.setSize(Math.round(r.width * this.renderer.getPixelRatio()), Math.round(r.height * this.renderer.getPixelRatio()));
      const aspect = r.width / r.height;
      this.camera.aspect = aspect; this.camera.updateProjectionMatrix();
      const angle = 50 * Math.PI / 180, direction = new THREE.Vector3(0, Math.sin(angle), Math.cos(angle));
      const target = new THREE.Vector3(0, 0, this.kind === 'snakes' ? .55 : 0);
      let distance = this.overlay ? r.height / 100 / (2 * Math.tan(this.camera.fov * Math.PI / 360)) : 21;
      const place = () => { this.camera.position.copy(target).addScaledVector(direction, distance); this.camera.lookAt(target); this.camera.updateMatrixWorld(); };
      place();
      if (!this.overlay) {
        // 同時計入標籤、放大棋子、骰子最高彈跳與前方托盤。保留 10% 安全邊界。
        for (let attempt = 0; attempt < 12; attempt++) {
          let extent = 0;
          for (const x of [-5.95, 5.95]) for (const y of [-.85, 1.6]) for (const z of [-5.85, this.kind === 'snakes' ? 6.45 : 5.85]) {
            const p = new THREE.Vector3(x, y, z).project(this.camera); extent = Math.max(extent, Math.abs(p.x), Math.abs(p.y));
          }
          if (extent <= .95 && extent >= .9) break; distance *= extent / .93; place();
        }
      }
      if (this.overlay) this.layoutOverlay(); this.draw();
    }
    pointAt(node, y = 0, u = .5, v = .5) {
      const r = node.getBoundingClientRect(), bounds = this.surface.getBoundingClientRect();
      const p = new THREE.Vector2((r.left + r.width * u - bounds.left) / bounds.width * 2 - 1, -(r.top + r.height * v - bounds.top) / bounds.height * 2 + 1);
      // 面對面區域連同畫布一起旋轉；先轉回畫布局部座標，語詞連線才會對準。
      if (this.host.closest('.zone.flip')) p.multiplyScalar(-1);
      const ray = new THREE.Raycaster(); ray.setFromCamera(p, this.camera);
      const result = new THREE.Vector3(); ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -y), result); return result;
    }
    screenTile(node, color, top, thickness, parent = this.overlayRoot, corners = [[.025, .025], [.975, .025], [.975, .975], [.025, .975]]) {
      // 反投影四角，而非用固定 px/世界比例。透視、縮放、面對面旋轉時仍與 DOM 詞槽對齊。
      const center = this.pointAt(node, top), points = corners.map(([u, v]) => this.pointAt(node, top, u, v).sub(center));
      const positions = []; [0, -thickness].forEach((y) => points.forEach((p) => positions.push(p.x, y, p.z)));
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute([...corners.flat(), ...corners.flat()], 2));
      geo.setIndex([0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7]);
      const flat = geo.toNonIndexed(); geo.dispose(); flat.computeVertexNormals();
      const m = this.mesh(flat, color, parent); m.position.copy(center); m.userData.restY = top; return m;
    }
    clearGroup(group) {
      if (!group) return;
      const textures = new Set(), geometries = new Set(), materials = new Set();
      group.traverse((o) => { if (o.geometry) geometries.add(o.geometry); if (o.userData && o.userData.bloomMaterial) materials.add(o.userData.bloomMaterial); [].concat(o.material || []).forEach((m) => { if (m.map) textures.add(m.map); materials.add(m); }); });
      textures.forEach((t) => t.dispose()); geometries.forEach((g) => g.dispose()); materials.forEach((m) => m.dispose()); group.clear();
    }
    layoutOverlay() {
      if (!this.width || !this.active) return;
      this.finishTweens();
      if (this.overlayRoot) { this.clearGroup(this.overlayRoot); this.root.remove(this.overlayRoot); }
      this.overlayRoot = new THREE.Group(); this.root.add(this.overlayRoot); this.meshCells.clear(); this.discs = [];
      if (this.kind === 'bingo') {
        const grid = this.host.querySelector('.bgrid');
        // 桌盤略呈梯形；邊界也用反投影計算，不能在近端無限制放大而被裁切。
        const tray = this.screenTile(grid, '#ffffff', -.3, .3, this.overlayRoot, [[-.025, -.03], [1.025, -.03], [1.05, 1.035], [-.05, 1.035]]); tray.material.map = this.woodTexture('board');
        this.buttons.forEach((b, i) => {
          const marked = this.marks.has(i);
          const mk = this.marks.get(i);
          const m = this.screenTile(b, marked ? (mk.color || (mk.learned ? '#245c99' : '#af4b16')) : '#f4dbaf', marked ? .38 : .04, marked ? .58 : .24);
          this.meshCells.set(i, m);
        });
        this.drawLines();
      } else {
        this.host.querySelectorAll('.disc').forEach((d, i) => {
          const r = d.getBoundingClientRect(), center = this.pointAt(d, .05);
          const left = this.pointAt(d, .05, .03, .5), right = this.pointAt(d, .05, .97, .5);
          const back = this.pointAt(d, .05, .5, .03), front = this.pointAt(d, .05, .5, .97);
          const w = left.distanceTo(right), depth = back.distanceTo(front);
          const g = new THREE.Group(); g.position.copy(center); this.overlayRoot.add(g); this.discs.push(g);
          // 雙人分區較窄時採立體長卡，詞槽仍完整留在 DOM。
          const tall = r.height > r.width * 1.3;
          const rim = tall ? this.roundedBox(w, .28, depth, i % 2 ? '#246b9c' : '#bf601e', g)
            : this.mesh(new THREE.CylinderGeometry(w / 2, w / 2, .28, 80), i % 2 ? '#246b9c' : '#bf601e', g);
          if (!tall) rim.scale.z = depth / w; rim.position.y = -.22;
          const face = tall ? this.roundedBox(w * .95, .13, depth * .95, i % 2 ? '#b6dded' : '#f6ce87', g, .04)
            : this.mesh(new THREE.CylinderGeometry(w * .475, w * .475, .13, 80), i % 2 ? '#b6dded' : '#f6ce87', g);
          if (!tall) face.scale.z = depth / w; face.position.y = -.05; face.material.roughness = .8;
          g.rotation.x = -.035; g.rotation.z = i % 2 ? -.025 : .025;
          d.querySelectorAll('.sym').forEach((b) => this.screenTile(b, '#bb8b50', .06, .13));
        });
        if (this.match) this.drawMatch(this.match);
      }
      this.draw();
    }
    deal() {
      this.match = null; this.pendingDeal = true;
      if (!this.active || !this.width) return;
      this.pendingDeal = false; this.layoutOverlay();
      this.discs.forEach((g, i) => this.tween(`deal${i}`, 540 + i * 70, (t) => {
        const e = 1 - Math.pow(1 - t, 3); g.position.y = .05 + (1 - e) * .8; g.rotation.z = (i % 2 ? -1 : 1) * (.025 + (1 - e) * .15);
      }));
    }
    markMatch(text) { this.match = text; this.pendingDeal = false; if (this.active) { this.layoutOverlay(); this.draw(); } }
    drawMatch(text) {
      const nodes = [...this.host.querySelectorAll('.sym')].filter((b) => b.textContent === text);
      if (nodes.length !== 2) return;
      const points = nodes.map((n) => this.pointAt(n, .28, .5, 1));
      const mid = points[0].clone().lerp(points[1], .5); mid.z += .35;
      const path = new THREE.CatmullRomCurve3([points[0], mid, points[1]]);
      const edge = this.mesh(new THREE.TubeGeometry(path, 40, .095, 8, false), '#96570d', this.overlayRoot); edge.renderOrder = 6; edge.material.depthTest = false;
      const beam = new THREE.Mesh(new THREE.TubeGeometry(path, 40, .055, 8, false), this.material('#ffc643', true)); beam.renderOrder = 7; beam.material.depthTest = false; beam.userData.feedback = 1; this.overlayRoot.add(beam);
      points.forEach((p) => { const ring = this.mesh(new THREE.TorusGeometry(.21, .045, 8, 32), '#ffc643', this.overlayRoot); ring.rotation.x = Math.PI / 2; ring.position.copy(p); ring.material.emissive.copy(ring.material.color); ring.material.emissiveIntensity = 2; });
    }
    // color：對抗模式的隊伍色（沒有就用原本的橘／藍）
    markCell(i, learned, color) {
      this.marks.set(i, { learned, color });
      if (!this.active) return;
      let m = this.meshCells.get(i); if (!m) return;
      this.finishTweens(); m.geometry.dispose(); m.material.dispose(); this.overlayRoot.remove(m);
      m = this.screenTile(this.buttons[i], color || (learned ? '#245c99' : '#af4b16'), .38, .58); this.meshCells.set(i, m);
      if (!learned) { const c = this.pointAt(this.buttons[i], .6); this.burst(c, color || '#af4b16', 10); }
      this.tween(`mark${i}`, 520, (t) => { m.rotation.x = Math.PI * 2 * (1 - Math.pow(1 - t, 3)); m.position.y = .04 + .34 * t + Math.sin(t * Math.PI) * .2; });
    }
    setLines(lines) {
      this.lineState = lines.map((l) => l.slice());
      if (this.active && this.kind === 'bingo') { this.drawLines(); this.draw(); }
    }
    drawLines() {
      if (this.beams) { this.clearGroup(this.beams); if (this.beams.parent) this.beams.parent.remove(this.beams); }
      this.beams = new THREE.Group(); this.overlayRoot.add(this.beams);
      this.feedbackLayer.replaceChildren();
      this.lineState.forEach((line) => {
        const first = this.buttons[line[0]], last = this.buttons[line[line.length - 1]];
        const start = this.pointAt(first, .43, .5, .93), end = this.pointAt(last, .43, .5, .93);
        // 光束位於詞塊下緣，不蓋住字。DOM 實線與勾號同時保留。
        const m = this.rod(start, end, .07, '#ffc643', this.beams); m.material.emissive.copy(m.material.color); m.material.emissiveIntensity = 2.6;
        m.userData.feedback = 1;
        // DOM 成功色會遮住畫布；另畫一道同位置的細光軌，確保每格下緣都看得見連線。
        const firstRect = first.getBoundingClientRect(), lastRect = last.getBoundingClientRect();
        const horizontal = Math.abs(firstRect.top - lastRect.top) < 2, vertical = Math.abs(firstRect.left - lastRect.left) < 2;
        if (!horizontal && !vertical) return; // 斜線在畫布與格框呈現，不能畫過 DOM 語詞。
        const bounds = this.host.getBoundingClientRect(), points = [first, last].map((node) => {
          const r = node.getBoundingClientRect(); return { x: r.left + r.width * (vertical ? .985 : .5) - bounds.left, y: r.top + r.height * (horizontal ? .985 : .5) - bounds.top };
        });
        const [a, b] = points, rail = el('span', 'rg3d-feedback-line');
        Object.assign(rail.style, { left: `${a.x}px`, top: `${a.y}px`, width: `${Math.hypot(b.x - a.x, b.y - a.y)}px`, transform: `translateY(-50%) rotate(${Math.atan2(b.y - a.y, b.x - a.x)}rad)` });
        this.feedbackLayer.append(rail);
      });
    }
    tween(key, duration, update) {
      if (!this.active || document.hidden) { update(1); this.draw(); return Promise.resolve(); }
      const old = this.tweens.get(key); if (old) { old.update(1); old.resolve(); }
      return new Promise((resolve) => { this.tweens.set(key, { start: performance.now(), duration, update, resolve }); this.draw(); });
    }
    finishTweens() {
      for (const a of this.tweens.values()) { a.update(1); a.resolve(); } this.tweens.clear();
    }
    renderEffects() {
      const previous = this.renderer.getRenderTarget(), background = this.scene.background, saved = [];
      // 基礎場景維持 ACES；僅成功物件用未壓縮的金色遮罩供 UnrealBloom 擷取。
      this.renderer.setRenderTarget(this.baseTarget); this.renderer.render(this.scene, this.camera);
      try {
        this.scene.background = new THREE.Color(0x000000);
        this.root.traverse((o) => {
          if (o.isSprite) { saved.push([o, 'visible', o.visible]); o.visible = false; }
          else if (o.isMesh) {
            saved.push([o, 'material', o.material]);
            let amount = o.userData.feedback || 0, parent = o.parent;
            while (!amount && parent && parent !== this.root) { amount = parent.userData.feedback || 0; parent = parent.parent; }
            // 購地光暈只做單次淡入淡出，不閃爍。
            if (amount > 0) {
              const glow = o.userData.bloomMaterial ||= new THREE.MeshBasicMaterial({ toneMapped: false });
              glow.color.set('#ffd15b').convertSRGBToLinear().multiplyScalar(3 * amount); o.material = glow;
            } else o.material = this.maskMaterial;
          }
        });
        this.composer.render();
      } finally {
        saved.forEach(([o, key, value]) => { o[key] = value; }); this.scene.background = background; this.renderer.setRenderTarget(previous);
      }
    }
    disposeEffects() {
      if (this.composer) {
        this.composer.passes.forEach((p) => {
          if (p.dispose) p.dispose();
          if (p.material) p.material.dispose();
          if (p === this.bloom) { [p.materialHighPassFilter, p.compositeMaterial, p.materialCopy, p.basic, ...p.separableBlurMaterials].forEach((m) => m.dispose()); }
        });
        this.composer.renderTarget1.dispose(); this.composer.renderTarget2.dispose();
      }
      if (this.baseTarget) this.baseTarget.dispose();
      if (this.maskMaterial) this.maskMaterial.dispose();
      this.composer = null; this.baseTarget = null;
    }
    draw() {
      if (this.frame || !this.active || this.disposed || document.hidden) return;
      this.frame = requestAnimationFrame((now) => {
        this.frame = 0;
        try {
          for (const [key, a] of this.tweens) { const t = Math.min(1, Math.max(0, (now - a.start) / a.duration)); a.update(t); if (t === 1) { this.tweens.delete(key); a.resolve(); } }
          this.layoutBoardLabels();
          if (this.composer) {
            try { this.renderEffects(); } catch (_) { this.disposeEffects(); this.renderer.setRenderTarget(null); this.renderer.render(this.scene, this.camera); }
          } else this.renderer.render(this.scene, this.camera);
          if (this.tweens.size) this.draw();
        } catch (_) { this.failed = '立體繪圖中斷'; this.mode(false); this.status('2D 模式・立體繪圖中斷，請繼續遊戲'); }
      });
    }
    visibility() { if (document.hidden) { this.finishTweens(); cancelAnimationFrame(this.frame); this.frame = 0; } else { this.sync(); this.draw(); } }
    dispose() {
      this.disposed = true; this.finishTweens(); cancelAnimationFrame(this.frame); this.resizeObserver.disconnect();
      this.clearGroup(this.root); this.labels = []; this.meshCells.clear(); this.pieces.clear(); this.flags.clear();
      this.disposeEffects();
      if (this.renderer) { this.renderer.dispose(); this.renderer.forceContextLoss(); }
      if (this.feedbackLayer) this.feedbackLayer.remove();
      this.domLabels?.remove(); this.surface.remove(); instances.delete(this);
    }
  }
  window.RG3D = { mount: (options) => {
    // 視圖初始化失敗不向遊戲規則拋出錯誤。
    try { return new View(options); } catch (_) { options.host.classList.remove('is-3d'); if (options.onMode) options.onMode(false); return null; }
  } };
})();
