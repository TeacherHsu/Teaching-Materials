/* 綜合複習 3D 視圖：狀態由各遊戲傳入，這裡不出題、不計分、不改學習紀錄。 */
(function () {
  'use strict';
  const CDN = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/';
  const instances = new Set();
  // Independent visual PRNG: never advance question/dice randomness.
  let artSeed = 0x81b27;
  const artRandom = () => { artSeed = (1664525 * artSeed + 1013904223) >>> 0; return artSeed / 4294967296; };
  const dieAngles = (n) => ({ 1: [0, 0, 0], 6: [Math.PI, 0, 0], 2: [0, 0, Math.PI / 2], 5: [0, 0, -Math.PI / 2], 3: [-Math.PI / 2, 0, 0], 4: [Math.PI / 2, 0, 0] }[n]);
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
    toolbar = el('details', 'rg3d-tools');
    toolbar.append(el('summary', '', '畫面設定')); toolbar.setAttribute('aria-label', '畫面設定');
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
      this.quality = this.quality === 'high' ? 'high' : 'standard'; this.frameSamples = []; this.slowWindows = 0; this.warmFrames = 30;
      this.overlay = this.kind === 'dobble' || this.kind === 'bingo';
      this.surface = el('div', 'rg3d-surface'); this.surface.setAttribute('aria-hidden', 'true');
      this.host.classList.add('rg3d-host', `rg3d-${this.kind}`); this.host.prepend(this.surface);
      if (this.overlay) { this.feedbackLayer = el('div', 'rg3d-feedback-lines'); this.feedbackLayer.setAttribute('aria-hidden', 'true'); this.host.append(this.feedbackLayer); }
      if (!this.overlay && this.cells) {
        this.domLabels = el('div', 'rg3d-dom-labels');
        this.domCells = new Map();
        this.cells.forEach((c) => {
          const box = el('div', 'rg3d-cell-label');
          const name = el('span', 'rg3d-cell-name'); name.textContent = `${this.kind === 'monopoly' ? c.label : c.id}`;
          const detail = el('span', 'rg3d-cell-detail'); detail.textContent = c.detail || '';
          const state = el('span', 'rg3d-cell-state');
          const step = el('span', 'rg3d-cell-step'); this.domLabels.append(step);
          const direction = el('span', 'rg3d-cell-direction', c.direction || '');
          box.append(name, direction, detail, state); this.domLabels.append(box); this.domCells.set(c.id, { box, state, step });
          if (this.kind === 'monopoly') { const number = el('span', 'rg3d-cell-number', String(c.id)); this.domLabels.append(number); this.domCells.get(c.id).number = number; }
        });
        this.host.append(this.domLabels);
      }
      this.mission = el('div', 'rg3d-mission');
      this.mission.append(el('span', '', ({ monopoly: '走訪課次站，答題收集學習章。', snakes: '沿閱讀小徑前進，一起走向終點。', dobble: '找出相同語詞，把閱讀卡整理成一盒。', bingo: '讀懂意思，把語詞收進收藏盤。' })[this.kind]));
      this.skipIntro = el('button', 'rg3d-skip', '略過入場'); this.skipIntro.type = 'button'; this.skipIntro.hidden = true;
      this.skipIntro.addEventListener('click', () => this.cancelIntro()); this.mission.append(this.skipIntro);
      (this.host.closest?.('.play') || this.host.closest?.('.bingo-layout') || this.host).before?.(this.mission);
      this.workshop = el('div', 'rg3d-workshop'); this.workshop.setAttribute('aria-hidden', 'true');
      this.workshop.append(el('i', 'rg3d-window'), el('i', 'rg3d-books'), el('i', 'rg3d-lamp'));
      this.host.prepend(this.workshop);
      this.keepsake = el('div', `rg3d-keepsake rg3d-keepsake-${this.kind}`); this.keepsake.hidden = true;
      this.host.append(this.keepsake);
      this.host.addEventListener('pointerdown', () => this.cancelIntro());
      this.host.addEventListener('keydown', () => this.cancelIntro());
      controls(); instances.add(this);
      this.resizeObserver = new ResizeObserver(() => { if (this.active) { try { this.resize(); } catch (_) { this.failed = '立體視圖無法使用'; this.mode(false); } } }); this.resizeObserver.observe(this.host);
      this.refresh();
    }
    cancelIntro() {
      const a = this.tweens.get('intro');
      if (a) { a.update(1); a.resolve(); this.tweens.delete('intro'); }
      if (this.skipIntro) this.skipIntro.hidden = true;
      this.introDone = true;
    }
    presentIntro() {
      if (this.introDone || !this.camera || !this.width) return;
      this.introDone = true;
      if (isCalm() || this.overlay) {
        // Overlay cards must keep their DOM projection fixed. Move the complete desk together.
        if (!isCalm()) { this.host.classList.add('rg3d-enter'); this.skipIntro.hidden = false;
          this.tween('intro', 450, (t) => { if (t === 1) { this.host.classList.remove('rg3d-enter'); this.skipIntro.hidden = true; } }); }
        return;
      }
      const end = this.camera.position.clone(); this.skipIntro.hidden = false;
      this.tween('intro', 450, (t) => {
        const k = 1 - t * t * (3 - 2 * t);
        this.camera.position.copy(end).multiplyScalar(1 + .04 * k);
        this.camera.lookAt(0, 0, this.kind === 'snakes' ? .55 : 0); this.camera.updateMatrixWorld();
        this.boardLabelKey = null;
        if (t === 1) this.skipIntro.hidden = true;
      });
    }
    presentFinish() {
      this.cancelIntro(); this.completed = true;
      this.host.classList.add('rg3d-completed');
      this.keepsake.hidden = false;
      this.keepsake.textContent = ({ monopoly: '書屋亮燈・學習章已收藏', snakes: '⚑ 終點旗已升起・本次旅程完成', dobble: '閱讀卡盒・已整理', bingo: '✓ 語詞收藏盤・完成章' })[this.kind];
      this.finishModel(); this.draw();
    }
    finishModel() {
      if (!this.active || !this.root || this.overlay || this.finishRoot) return;
      const g = this.finishRoot = new THREE.Group(); this.root.add(g);
      g.position.set(2.1, .1, 0);
      if (this.kind === 'monopoly') {
        const house = this.box(1.1, .65, .8, '#ac794b', g); house.position.y = .34;
        const roof = this.box(1.28, .13, 1, '#795338', g); roof.position.y = .75;
        for (const x of [-.27, .27]) {
          const pane = this.box(.22, .26, .025, '#ffdf84', g); pane.position.set(x, .42, .415);
          pane.material.emissive.set('#ffcb64').convertSRGBToLinear(); pane.material.emissiveIntensity = .5;
        }
      } else {
        this.rod(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1.5, 0), .035, '#79634c', g);
        const flag = this.box(.65, .38, .045, '#ba6837', g); flag.position.set(.34, 1.18, 0);
        this.tween('finishFlag', 360, (t) => { flag.position.y = .55 + .63 * t; });
      }
      this.draw();
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
      try { this.resize(changed); if (this.pendingDeal) this.deal(); this.status('立體桌面'); this.presentIntro(); if (this.completed) this.finishModel(); }
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
      this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.quality === 'high' && !this.host.closest('.duel') ? 1.5 : 1.25));
      this.renderer.outputEncoding = T.sRGBEncoding;
      this.renderer.toneMapping = T.ACESFilmicToneMapping; this.renderer.toneMappingExposure = .98;
      this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = T.PCFSoftShadowMap; this.renderer.shadowMap.autoUpdate = false; this.renderer.shadowMap.needsUpdate = true;
      this.surface.append(this.renderer.domElement);
      this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
        e.preventDefault(); if (this.disposed) return; this.failed = 'WebGL 已中斷'; this.mode(false); this.status('2D 模式・WebGL 已中斷，請繼續遊戲');
      });
      this.scene = new T.Scene();
      // 後製以暖色底合成，避免透明畫布在泛光後出現黑底。
      this.scene.background = null;
      this.camera = new T.PerspectiveCamera(36, 1, .1, 120);
      this.camera.position.set(0, 18, 15); this.camera.lookAt(0, 0, 0);
      this.scene.add(new T.HemisphereLight(0xffe9cc, 0x51453e, .42));
      const key = new T.DirectionalLight(0xffdfb0, 1.25); key.position.set(-7, 13, 6); key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, far: 50 }); key.shadow.camera.updateProjectionMatrix();
      key.shadow.bias = -.0003; key.shadow.normalBias = .035; key.shadow.radius = 3; this.scene.add(key);
      const rim = new T.DirectionalLight(0xb6d9ff, .7); rim.position.set(6, 7, -9); this.scene.add(rim);
      this.makeEnvironment();
      this.root = new T.Group(); this.scene.add(this.root);
      const table = this.box(15, .3, 15, '#ffffff'); table.position.y = -1.05;
      table.material.map = this.woodTexture('table'); table.material.roughness = .82;
      if (!this.overlay) this.buildBoard();
      if (this.quality === 'high' && !this.host.closest('.duel')) loadEffects().then(() => {
        if (this.disposed || this.failed || this.quality !== 'high') return;
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
    makeEnvironment() {
      const c = document.createElement('canvas'); c.width = 256; c.height = 128;
      const ctx = c.getContext('2d'), g = ctx.createLinearGradient(0, 0, 0, 128);
      g.addColorStop(0, '#c1d4e6'); g.addColorStop(.45, '#fff4dd'); g.addColorStop(1, '#79634f');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 128);
      ctx.fillStyle = '#fffaf0'; ctx.fillRect(32, 20, 56, 35);
      const texture = new THREE.CanvasTexture(c); texture.encoding = THREE.sRGBEncoding; texture.mapping = THREE.EquirectangularReflectionMapping;
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      try { this.environmentTarget = pmrem.fromEquirectangular(texture); this.scene.environment = this.environmentTarget.texture; }
      finally { texture.dispose(); pmrem.dispose(); }
    }
    applyQuality(level) {
      this.quality = level; this.slowWindows = 0; this.frameSamples = [];
      if (level === 'light') {
        this.disposeEffects(); this.renderer.setPixelRatio(1); this.renderer.shadowMap.enabled = false;
        this.resize(true);
      } else if (level === '2d') { this.failed = '裝置改用流暢平面圖'; this.mode(false); this.status('2D 模式・保留目前進度'); }
    }
    sampleFrame(now) {
      if (!this.tweens.size || document.hidden) { this.lastActiveFrame = null; return; }
      if (this.warmFrames > 0) { this.warmFrames--; this.lastActiveFrame = now; return; }
      if (this.lastActiveFrame != null) this.frameSamples.push(now - this.lastActiveFrame);
      this.lastActiveFrame = now;
      if (this.frameSamples.length < 90) return;
      const samples = this.frameSamples.sort((a, b) => a - b), p95 = samples[85]; this.frameSamples = [];
      this.slowWindows = p95 > (this.quality === 'light' ? 28 : 22) ? this.slowWindows + 1 : 0;
      if (this.slowWindows >= 2) this.applyQuality(this.quality === 'light' ? '2d' : 'light');
    }
    material(color, glow = false) {
      const linear = new THREE.Color(color).convertSRGBToLinear();
      return new THREE.MeshStandardMaterial({ color: linear, roughness: .8, metalness: 0, emissive: glow ? linear : 0x000000, emissiveIntensity: glow ? 2.4 : 0 });
    }
    mesh(geometry, color, parent = this.root) {
      const m = new THREE.Mesh(geometry, this.material(color)); m.castShadow = geometry.type !== 'SphereGeometry' && geometry.type !== 'TubeGeometry'; m.receiveShadow = true; parent.add(m); return m;
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
      for (let i = 0; i < 160; i++) {
        const y = i * 6.5; c.strokeStyle = `rgba(80,42,18,${.012 + (i % 7) * .002})`; c.lineWidth = .6 + i % 3;
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
      const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 128;
      const ctx = shadowCanvas.getContext('2d'), gradient = ctx.createRadialGradient(64, 64, 25, 64, 64, 64);
      gradient.addColorStop(0, '#39231466'); gradient.addColorStop(1, '#39231400'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
      const contact = new T.Mesh(new T.PlaneGeometry(13.4, depth + 1.6), new T.MeshBasicMaterial({ map: new T.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }));
      contact.rotation.x = -Math.PI / 2; contact.position.y = -.885; this.root.add(contact);
      const plinth = this.roundedBox(11.55, .6, depth, '#ffffff'); plinth.position.y = -.4;
      plinth.material.map = this.woodTexture('board'); plinth.material.roughness = .78;
      const inset = this.roundedBox(11.12, .16, depth - .4, '#593d2b'); inset.position.y = -.06;
      // 金色細邊與雙層底座讓棋盤邊緣、厚度、投影有清楚的層次。
      const foot = this.roundedBox(11.25, .16, depth - .15, '#4d3021'); foot.position.y = -.75;
      this.cells.forEach((c) => {
        const p = this.cellPosition(c.id);
        const lesson = Number((c.label.match(/^第(\d)課$/) || [])[1]);
        const palette = ['#de5942', '#e5a529', '#52a765', '#3699c5', '#8c69bc', '#cf6b9e'];
        const color = this.kind === 'snakes' ? ((c.row + c.col) % 2 ? '#e2ad67' : '#f4d29b') : lesson ? palette[lesson - 1] : c.label === '綜合複習' ? '#69a5c8' : '#edc580';
        const m = this.roundedBox(1.65, .31, 1.65, color); m.position.copy(p); m.position.y = .13;
        m.material.roughness = .95;
        if (this.kind === 'snakes' && c.detail && !/蛇|梯/.test(c.detail)) m.material.color.set('#eaca73').convertSRGBToLinear();
        this.meshCells.set(c.id, m);
        const snakes = this.kind === 'snakes';
        if (this.kind === 'monopoly' && !lesson && c.label !== '綜合複習') this.specialProp(c, p);
      });
      if (this.kind === 'monopoly') {
        const pad = this.mesh(new T.CylinderGeometry(2.9, 3, .2, 80), '#285e61'); pad.position.y = .06;
        const rim = this.mesh(new T.TorusGeometry(2.88, .045, 8, 80), '#edb95b'); rim.rotation.x = Math.PI / 2; rim.position.y = .2;
        const l = this.label('課文探險', 4.05, .88, '#fff2d1', '#54331f'); l.position.set(0, .5, -1.1); this.root.add(l);
        // One open, unprinted book and a pencil; leave the centre free for the die.
        [-1, 1].forEach((side) => { const page = this.roundedBox(.62, .08, .8, '#fff6df', undefined, .025); page.position.set(-1.7 + side * .3, .26, .6); page.rotation.z = side * .08; });
        const pencil = this.mesh(new T.CylinderGeometry(.035, .035, 1.05, 6), '#d8a649'); pencil.rotation.z = .9; pencil.position.set(-1.6, .3, 1.3);
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
      const start = this.cellPosition(a), end = this.cellPosition(b); start.y = end.y = .34; start.x += .15; end.x += .15;
      const dir = end.clone().sub(start).normalize(); const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(.23);
      [-1, 1].forEach((s) => { const rail = this.rod(start.clone().addScaledVector(side, s), end.clone().addScaledVector(side, s), .075, '#e4b46f'); rail.material.map = this.woodTexture('board'); rail.material.roughness = .8; });
      const count = Math.ceil(start.distanceTo(end) / .36);
      for (let i = 1; i < count; i++) { const p = start.clone().lerp(end, i / count); this.rod(p.clone().sub(side), p.clone().add(side), .06, '#dba65c'); }
      this.paths.set(`ladder:${a}`, new THREE.LineCurve3(start, end));
    }
    snake(a, b) {
      const start = this.cellPosition(a), end = this.cellPosition(b); start.y = end.y = .48; start.x += .22; end.x += .22;
      const d = end.clone().sub(start); const side = new THREE.Vector3(-d.z, 0, d.x).normalize();
      const points = Array.from({ length: 13 }, (_, i) => {
        const p = start.clone().lerp(end, i / 12).addScaledVector(side, Math.sin(i / 12 * Math.PI * 4) * .22);
        // Keep the top-left number reserve clear in every crossed cell.
        if (i > 0 && i < 12) for (const c of this.cells) { const cell = this.cellPosition(c.id); if (p.x > cell.x - .83 && p.x < cell.x - .12 && p.z > cell.z - .83 && p.z < cell.z - .25) p.x = cell.x + .02; }
        return p;
      });
      const path = new THREE.CatmullRomCurve3(points);
      const geo = new THREE.TubeGeometry(path, 40, .11, 8, false), attribute = geo.getAttribute('position'), shades = [];
      for (let i = 0; i < attribute.count; i++) { const shade = new THREE.Color().setHSL(.33, .55, .29 + .10 * (Math.floor(i / 9) % 6 < 2 ? 1 : 0)); shade.convertSRGBToLinear(); shades.push(shade.r, shade.g, shade.b); }
      for (let ring = 0; ring <= 40; ring++) {
        const center = path.getPointAt(ring / 40), taper = 1 - .82 * Math.pow(ring / 40, 3);
        for (let k = 0; k <= 8; k++) { const index = ring * 9 + k; attribute.setXYZ(index, center.x + (attribute.getX(index) - center.x) * taper, center.y + (attribute.getY(index) - center.y) * taper, center.z + (attribute.getZ(index) - center.z) * taper); }
      }
      attribute.needsUpdate = true; geo.computeVertexNormals();
      geo.setAttribute('color', new THREE.Float32BufferAttribute(shades, 3));
      const body = this.mesh(geo, '#ffffff'); body.material.vertexColors = true; body.material.roughness = .4; this.paths.set(`snake:${a}`, path);
      const head = this.mesh(new THREE.SphereGeometry(.27, 20, 12), '#459e36'); head.scale.z = 1.3; head.position.copy(start);
      const tangent = path.getTangent(0); head.rotation.y = Math.atan2(tangent.x, tangent.z);
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
      g.scale.setScalar(1.35); cup.material.metalness = .72; cup.material.roughness = .35; cup.material.emissive.copy(cup.material.color); cup.material.emissiveIntensity = .4;
      const halo = this.mesh(new THREE.TorusGeometry(.42, .035, 8, 32), '#efb73d', g); halo.rotation.x = Math.PI / 2; halo.position.y = .08; halo.material.emissive.copy(halo.material.color); halo.material.emissiveIntensity = 2.4; halo.userData.feedback = 1;
    }
    buildDie(p) {
      const g = new THREE.Group(); g.position.copy(p); this.root.add(g); this.dice = g; this.diceHome = p.clone();
      const shell = this.roundedBox(.98, .98, .98, '#fff3d8', g, .09); shell.material.roughness = .4;
      const faces = [[1, [0, 1, 0]], [6, [0, -1, 0]], [2, [1, 0, 0]], [5, [-1, 0, 0]], [3, [0, 0, 1]], [4, [0, 0, -1]]];
      const dots = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]] };
      faces.forEach(([n, axis]) => {
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...axis));
        dots[n].forEach(([x, y]) => { const dot = this.mesh(new THREE.SphereGeometry(.073, 12, 8), n === 1 ? '#b73527' : '#30241c', g); dot.scale.z = .22; dot.quaternion.copy(q); dot.position.set(x * .23, y * .23, .496).applyQuaternion(q); });
      });
      g.scale.setScalar(this.kind === 'monopoly' ? 1.04 : 1.3);
    }
    async rollDice(n) {
      this.dieValue = n;
      if (!this.active || !this.dice) return;
      // 六面各有固定點數，最後讓指定面朝上；拋物線加兩次衰減碰跳。
      const end = dieAngles(n);
      const from = this.dice.rotation.clone();
      await this.tween('dice', 930, (t) => {
        const ease = 1 - Math.pow(1 - t, 3);
        this.dice.rotation.set(...end.map((v, i) => from[['x', 'y', 'z'][i]] * (1 - ease) + v * ease + Math.PI * 4 * t));
        this.dice.position.y = this.diceHome.y + Math.abs(Math.sin(t * Math.PI * 3)) * (1 - t) * 1.7;
        this.dice.position.x = this.diceHome.x + Math.sin(t * Math.PI * 2) * (1 - t) * .7;
        if (t === 1) { this.dice.rotation.set(...end); this.dice.position.copy(this.diceHome); }
      });
    }
    piece(i) {
      const g = new THREE.Group(); this.root.add(g);
      const geo = [() => new THREE.SphereGeometry(.23, 20, 16), () => new THREE.BoxGeometry(.42, .42, .42), () => new THREE.ConeGeometry(.3, .5, 3), () => new THREE.OctahedronGeometry(.31)][i % 4]();
      const m = this.mesh(geo, colors[i % 4], g); m.material.roughness = .4; m.position.y = .24;
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
        else g.position.copy(from).lerp(target, ease).add(new THREE.Vector3(0, Math.sin(t * Math.PI) * .30, 0));
        if (path && options.path) { const tangent = path.getTangent(ease); g.rotation.y = Math.atan2(tangent.x, tangent.z); }
        if (t === 1) { g.position.copy(target); g.rotation.y = 0; }
      });
    }
    layoutBoardLabels() {
      if (!this.active || !this.domLabels || !this.camera) return;
      const key = [this.host.clientWidth, this.host.clientHeight, this.projection, ...this.tokens, ...this.owners, ...(this.domSteps || [])].join('|');
      if (this.boardLabelKey === key) return; this.boardLabelKey = key;
      this.cells.forEach((c) => {
        // Fixed corner anchors: labels never migrate into adjacent cells.
        const v = this.cellPosition(c.id); v.y = .32; v.x -= .72; v.z -= .68; v.project(this.camera);
        const { box, state, number, step } = this.domCells.get(c.id);
        if (number) { const n = this.cellPosition(c.id); n.x -= .65; n.z += .52; n.y = .32; n.project(this.camera); number.style.left = `${(n.x + 1) * this.width / 2}px`; number.style.top = `${(1 - n.y) * this.height / 2}px`; }
        const teams = [...this.tokens].filter(([, cell]) => cell === c.id).map(([i]) => `${i + 1}隊`);
        const needed = this.focused?.cell === c.id || teams.length > 0;
        box.classList.toggle('is-current', needed);
        state.textContent = this.owners.has(c.id) ? `屋${this.owners.get(c.id) + 1}` : '';
        step.textContent = this.domSteps?.get(c.id) || '';
        const sp = this.cellPosition(c.id); sp.x += .18; sp.z += .57; sp.project(this.camera);
        step.style.left = `${(sp.x + 1) * this.width / 2}px`; step.style.top = `${(1 - sp.y) * this.height / 2}px`;
        box.setAttribute('aria-label', [c.id, c.label, c.detail, teams.join(' '), state.textContent].filter(Boolean).join('，'));
        box.style.left = `${(v.x + 1) * this.width / 2}px`;
        box.style.top = `${(1 - v.y) * this.height / 2}px`;
      });
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
      this.focused = { i, cell }; this.boardLabelKey = null;
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
      if (!this.active || isCalm() || document.hidden || this.quality === 'light') return;
      count = Math.min(count, this.quality === 'high' ? 16 : 8);
      const palette = [color, '#ffc643', '#ffffff', '#f08a4b'];
      const bits = [];
      for (let k = 0; k < count; k++) {
        const m = this.box(.12, .03, .07, palette[k % palette.length]); m.castShadow = false;
        const a = k / count * Math.PI * 2 + artRandom() * .4, sp = .9 + artRandom() * .8;
        m.userData.v = [Math.cos(a) * sp, 2.4 + artRandom() * 1.4, Math.sin(a) * sp]; m.position.copy(pos); m.position.y += .4;
        bits.push(m);
      }
      const start = pos.clone();
      this.tween(`burst${performance.now()}${artRandom()}`, 450, (t) => {
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
      const g = new THREE.Group(); g.position.copy(this.cellPosition(cell)); g.position.x += .57; g.position.z -= .03; this.root.add(g); this.flags.set(cell, g);
      const house = this.box(.38, .27, .38, '#fff4d9', g); house.position.y = .18;
      const roof = this.mesh(new THREE.ConeGeometry(.31, .20, 4), colors[i], g); roof.rotation.y = Math.PI / 4; roof.position.y = .41;
      const pages = this.box(.23, .12, .02, '#fffaf0', g); pages.position.set(0, .17, .20);
      const num = this.label(String(i + 1), .24, .24, colors[i], '#ffffff'); num.position.set(0, .57, 0); g.add(num);
      if (animate) this.tween(`owner${cell}`, 480, (t) => {
        g.position.y = this.cellPosition(cell).y + (1 - Math.min(t / .75, 1)) * .18;
        g.userData.feedback = Math.sin(Math.PI * t);
      });
    }
    sync() {
      if (!this.renderer) return;
      if (this.overlay) this.layoutOverlay();
      else {
        if (this.dice) { this.dice.rotation.set(...dieAngles(this.dieValue)); this.dice.position.copy(this.diceHome); }
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
      const angle = 60 * Math.PI / 180, direction = new THREE.Vector3(0, Math.sin(angle), Math.cos(angle));
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
      const bevel = Math.min(.02, thickness / 4), shape = new THREE.Shape();
      points.forEach((p, i) => { if (i) shape.lineTo(p.x, -p.z); else shape.moveTo(p.x, -p.z); }); shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness - bevel * 2, steps: 1, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1, curveSegments: 1 });
      geo.rotateX(-Math.PI / 2); geo.translate(0, -thickness + bevel, 0);
      const m = this.mesh(geo, color, parent); m.position.copy(center); m.userData.restY = top; return m;
    }

    clearGroup(group) {
      if (!group) return;
      const textures = new Set(), geometries = new Set(), materials = new Set();
      group.traverse((o) => { if (o.geometry) geometries.add(o.geometry); if (o.userData && o.userData.bloomMaterial) materials.add(o.userData.bloomMaterial); [].concat(o.material || []).forEach((m) => { if (m.map && ![...(this.woodTextures?.values() || [])].includes(m.map)) textures.add(m.map); materials.add(m); }); });
      textures.forEach((t) => t.dispose()); geometries.forEach((g) => g.dispose()); materials.forEach((m) => m.dispose()); group.clear();
    }
    layoutOverlay() {
      if (!this.width || !this.active) return;
      const nodes = [...this.host.querySelectorAll(this.kind === 'bingo' ? '.bcell' : '.disc')];
      const layoutKey = [this.width, this.height, ...nodes.flatMap((n) => { const r = n.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }), JSON.stringify([...this.marks])].join('|');
      if (layoutKey === this.overlayLayoutKey) { if (this.kind === 'bingo') this.drawLines(); else if (this.match) this.drawMatch(this.match); return; }
      this.overlayLayoutKey = layoutKey;
      this.finishTweens();
      this.matchRoot = null;
      if (this.overlayRoot) { this.clearGroup(this.overlayRoot); this.root.remove(this.overlayRoot); }
      this.overlayRoot = new THREE.Group(); this.root.add(this.overlayRoot); this.meshCells.clear(); this.discs = [];
      if (this.kind === 'bingo') {
        const grid = this.host.querySelector('.bgrid');
        // 桌盤略呈梯形；邊界也用反投影計算，不能在近端無限制放大而被裁切。
        const tray = this.screenTile(grid, '#ffffff', -.3, .3, this.overlayRoot, [[-.025, -.03], [1.025, -.03], [1.05, 1.035], [-.05, 1.035]]); tray.material.map = this.woodTexture('board');
        this.buttons.forEach((b, i) => {
          const marked = this.marks.has(i);
          const mk = this.marks.get(i);
          const m = this.screenTile(b, marked ? (mk.color || (mk.learned ? '#245c99' : '#af4b16')) : '#f4dbaf', marked ? .06 : .04, marked ? .14 : .10);
          this.meshCells.set(i, m);
        });
        this.drawLines();
      } else {
        this.host.querySelectorAll('.disc').forEach((d, i) => {
          const rim = this.screenTile(d, i % 2 ? '#73abc2' : '#c98043', -.015, .17);
          rim.material.roughness = .85;
          const face = this.screenTile(d, '#fff7e5', .025, .10, this.overlayRoot, [[.04,.035],[.96,.035],[.96,.965],[.04,.965]]);
          face.material.roughness = .98; face.castShadow = true; this.discs.push(face);
        });
        if (this.match) this.drawMatch(this.match);
      }
      this.draw();
    }
    deal() {
      this.match = null; this.pendingDeal = true; this.feedbackLayer?.replaceChildren?.();
      if (this.matchRoot) { this.clearGroup(this.matchRoot); this.matchRoot.parent?.remove(this.matchRoot); this.matchRoot = null; }
      if (!this.active || !this.width) return;
      this.pendingDeal = false; this.layoutOverlay();
      this.discs.forEach((g, i) => this.tween(`deal${i}`, 250, (t) => {
        g.material.transparent = t < 1; g.material.opacity = t;
      }));
    }
    markMatch(text) {
      this.match = text; this.pendingDeal = false;
      if (this.active) { this.finishTweens(); this.drawMatch(text); this.draw(); }
    }
    drawMatch(text) {
      this.feedbackLayer.replaceChildren();
      const nodes = [...this.host.querySelectorAll('.sym')].filter((b) => b.textContent === text);
      if (nodes.length !== 2) return;
      const bounds = this.host.getBoundingClientRect(), flipped = !!this.host.closest('.zone.flip');
      const localRect = (node) => {
        const r = node.getBoundingClientRect();
        const left = flipped ? bounds.right - r.right : r.left - bounds.left;
        const top = flipped ? bounds.bottom - r.bottom : r.top - bounds.top;
        return { left, top, right: left + r.width, bottom: top + r.height, width: r.width, height: r.height };
      };
      const routes = nodes.map((node) => {
        const r = localRect(node), card = localRect(node.closest('.disc')), x = (r.left + r.right) / 2;
        const side = x < (card.left + card.right) / 2 ? card.left - 4 : card.right + 4;
        return [{ x, y: r.bottom + 1 }, { x, y: r.bottom + 6 }, { x: side, y: r.bottom + 6 }, { x: side, y: card.bottom + 8 }];
      });
      const route = [...routes[0], ...routes[1].reverse()];
      for (let i = 1; i < route.length; i++) {
        const a = route[i - 1], b = route[i], rail = el('span', 'rg3d-feedback-line');
        Object.assign(rail.style, { left: `${a.x}px`, top: `${a.y}px`, width: `${Math.hypot(b.x - a.x, b.y - a.y)}px`, transform: `translateY(-50%) rotate(${Math.atan2(b.y - a.y, b.x - a.x)}rad)` });
        this.feedbackLayer.append(rail);
      }
    }
    // color：對抗模式的隊伍色（沒有就用原本的橘／藍）
    markCell(i, learned, color) {
      this.marks.set(i, { learned, color });
      if (!this.active) return;
      let m = this.meshCells.get(i); if (!m) return;
      this.finishTweens();
      m.material.color.set(color || (learned ? '#245c99' : '#af4b16')).convertSRGBToLinear();
      m.scale.y = 1.4; m.position.y = .06;
      // Material transition only: DOM words and hit areas remain stationary.
      const destination = m.material.color.clone(); m.material.color.set('#fff3d7').convertSRGBToLinear();
      const initial = m.material.color.clone();
      this.tween(`mark${i}`, 260, (t) => { m.material.color.copy(initial).lerp(destination, t); });
    }

    setLines(lines) {
      this.lineState = lines.map((l) => l.slice());
      if (this.active && this.kind === 'bingo') { this.drawLines(); this.draw(); }
    }
    drawLines() {
      if (this.beams) { this.clearGroup(this.beams); if (this.beams.parent) this.beams.parent.remove(this.beams); }
      this.beams = new THREE.Group(); this.overlayRoot.add(this.beams);
      this.feedbackLayer.replaceChildren();
      this.host.querySelectorAll('.rg3d-line-badge').forEach((n) => n.remove());
      this.lineState.forEach((line, index) => {
        const first = this.buttons[line[0]], last = this.buttons[line[line.length - 1]];
        const start = this.pointAt(first, .43, .5, .93), end = this.pointAt(last, .43, .5, .93);
        // 光束位於詞塊下緣，不蓋住字。DOM 實線與勾號同時保留。
        const m = this.rod(start, end, .07, '#ffc643', this.beams); m.material.emissive.copy(m.material.color); m.material.emissiveIntensity = 2.6;
        m.userData.feedback = 1;
        // DOM 成功色會遮住畫布；另畫一道同位置的細光軌，確保每格下緣都看得見連線。
        const firstRect = first.getBoundingClientRect(), lastRect = last.getBoundingClientRect();
        const horizontal = Math.abs(firstRect.top - lastRect.top) < 2, vertical = Math.abs(firstRect.left - lastRect.left) < 2;
        line.forEach((cell) => {
          const badge = el('span', 'rg3d-line-badge', `${index + 1}`); badge.setAttribute('aria-label', `第${index + 1}線：${horizontal ? '橫線' : vertical ? '直線' : firstRect.left < lastRect.left ? '左上到右下' : '右上到左下'}`);
          badge.style.left = `${index * 18 + 3}px`; this.buttons[cell].append(badge);
        });
        if (!horizontal && !vertical) {
          const bounds = this.host.getBoundingClientRect();
          const segment = (a, b) => {
            const rail = el('span', 'rg3d-feedback-line');
            Object.assign(rail.style, { left: `${a.x - bounds.left}px`, top: `${a.y - bounds.top}px`, width: `${Math.hypot(b.x - a.x, b.y - a.y)}px`, transform: `translateY(-50%) rotate(${Math.atan2(b.y - a.y, b.x - a.x)}rad)` });
            this.feedbackLayer.append(rail);
          };
          for (let j = 1; j < line.length; j++) {
            const a = this.buttons[line[j - 1]].getBoundingClientRect(), b = this.buttons[line[j]].getBoundingClientRect();
            const right = a.left < b.left, x1 = right ? a.right + 2 : a.left - 2, x2 = right ? b.left - 2 : b.right + 2, y = (a.bottom + b.top) / 2;
            const route = [{ x: x1, y: a.bottom - 3 }, { x: x1, y }, { x: x2, y }, { x: x2, y: b.top + 3 }];
            route.slice(1).forEach((p, k) => segment(route[k], p));
          }
          return;
        }
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
      if (!this.tweens.size) this.lastActiveFrame = null;
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
          this.sampleFrame(now); if (!this.active) return;
          this.renderer.shadowMap.needsUpdate = true;
          this.layoutBoardLabels();
          if (this.composer && this.tweens.size) {
            try { this.renderEffects(); } catch (_) { this.disposeEffects(); this.renderer.setRenderTarget(null); this.renderer.render(this.scene, this.camera); }
          } else this.renderer.render(this.scene, this.camera);
          if (this.tweens.size) this.draw();
        } catch (_) { this.failed = '立體繪圖中斷'; this.mode(false); this.status('2D 模式・立體繪圖中斷，請繼續遊戲'); }
      });
    }
    visibility() { if (document.hidden) { this.finishTweens(); cancelAnimationFrame(this.frame); this.frame = 0; } else { this.sync(); this.draw(); } }
    dispose() {
      this.disposed = true; this.mission?.remove(); this.workshop?.remove(); this.keepsake?.remove(); this.finishTweens(); cancelAnimationFrame(this.frame); this.resizeObserver.disconnect();
      this.clearGroup(this.root); this.labels = []; this.meshCells.clear(); this.pieces.clear(); this.flags.clear();
      this.disposeEffects();
      this.woodTextures?.forEach((t) => t.dispose()); this.woodTextures?.clear(); this.environmentTarget?.dispose();
      this.host.querySelectorAll('.rg3d-line-badge').forEach((n) => n.remove());
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
