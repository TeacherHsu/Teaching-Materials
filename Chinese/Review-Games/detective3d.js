/* 課文偵探密室 3D 房間（Three.js r128）。只負責畫面與點選，不出題、不判分。
   固定斜俯視鏡頭，可左右拖曳小幅旋轉（±25°），不需第一人稱移動。
   物件標記一律是 DOM 按鈕（鍵盤、讀屏、觸控都能用）；3D 失敗、減少動態或 WebGL 不可用時改成 2D 平面圖，玩法相同。 */
(function () {
  'use strict';
  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  let loading, artSeed = 0x61d92;
  const artRandom = () => { artSeed = (1664525 * artSeed + 1013904223) >>> 0; return artSeed / 4294967296; };
  function loadThree() {
    if (window.THREE) return Promise.resolve();
    if (!loading) loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      const timer = setTimeout(() => reject(new Error('timeout')), 8000);
      s.src = THREE_URL; s.onload = () => { clearTimeout(timer); resolve(); };
      s.onerror = () => { clearTimeout(timer); reject(new Error('load')); };
      document.head.append(s);
    });
    return loading;
  }

  // 場景主題：共用機關，另加符合名稱的主題道具。
  const THEMES = {
    study: { name: '神祕書房', wall: 0xf3e2c7, wall2: 0xe9d3b0, floor: 0xb98352, rug: 0x8a4fa8, accent: 0xa84b17, sky: 0xfff4e2,
      holders: ['書架上的書', '書桌抽屜', '牆上的相框', '盆栽', '地毯一角', '檯燈下', '地球儀', '舊皮箱'] },
    classroom: { name: '放學後的教室', wall: 0xe4f1e4, wall2: 0xd2e8d3, floor: 0xc79a62, rug: 0x3b82c4, accent: 0x2f7d4a, sky: 0xf2fff4,
      holders: ['圖書角的書', '講桌抽屜', '布告欄照片', '窗邊盆栽', '教室地墊', '檯燈下', '地球儀', '置物箱'] },
    library: { name: '安靜的圖書館', wall: 0xf1e6d6, wall2: 0xe3d2bb, floor: 0x9c6b43, rug: 0xc0362c, accent: 0x7a3e1d, sky: 0xfff6ea,
      holders: ['借書架', '還書櫃抽屜', '館員留言框', '閱讀區盆栽', '地毯一角', '閱讀燈下', '地球儀', '書車箱子'] },
    forest: { name: '森林小屋', wall: 0xe8dcc0, wall2: 0xd9c8a2, floor: 0x8f6a3e, rug: 0x3fa45b, accent: 0x4c7a2a, sky: 0xf4fbe8,
      holders: ['木架上的書', '木桌抽屜', '牆上的畫', '林間盆栽', '草編地毯', '油燈下', '松果籃', '木箱'] },
    lab: { name: '科學實驗室', wall: 0xe3eef6, wall2: 0xd0e2ef, floor: 0xb8c2cc, rug: 0x3b82c4, accent: 0x1f5fa8, sky: 0xf2f9ff,
      holders: ['資料架', '實驗桌抽屜', '公告照片', '觀察盆栽', '防滑墊', '顯微燈下', '地球儀', '器材箱'] },
    museum: { name: '小小博物館', wall: 0xf4ead8, wall2: 0xe8d8bd, floor: 0xa87a4f, rug: 0xb5382c, accent: 0x8b5cc8, sky: 0xfff6e6,
      holders: ['展示櫃的書', '服務台抽屜', '名畫畫框', '大廳盆栽', '紅地毯一角', '展示燈下', '地球儀', '收藏箱'] },
  };
  // 物件位置（x, y, z）與圖示；2D 平面圖用 gx, gy（百分比）
  const STATIONS = {
    sort: { label: '案件布告欄', icon: '📌', pos: [-1.6, 2.5, -4.35], g: [34, 18] },
    dial: { label: '國字保險箱', icon: '🔐', pos: [3.6, 0.75, -3.5], g: [74, 30] },
    keys: { label: '語詞鎖櫃', icon: '🗝️', pos: [-5.35, 1.25, 0.6], g: [8, 52] },
    blocks: { label: '詞塊打字機', icon: '⌨️', pos: [-1.9, 1.15, 0.9], g: [36, 56] },
    compare: { label: '證詞放大鏡', icon: '🔎', pos: [2.2, 1.1, 1.4], g: [62, 60] },
    cause: { label: '原因推理機', icon: '⚙️', pos: [-5.2, 1.9, -3.1], g: [10, 24] },
    final: { label: '出口大門', icon: '🚪', pos: [1.3, 1.6, -4.3], g: [54, 14] },
  };
  const HOLDERS = [
    { pos: [-4.0, 2.2, -4.1], g: [20, 14] }, { pos: [-1.9, 0.65, 1.45], g: [38, 70] },
    { pos: [-5.85, 2.5, 2.6], g: [6, 74] }, { pos: [5.0, 0.7, 3.1], g: [90, 82] },
    { pos: [0.4, 0.06, 3.3], g: [48, 88] }, { pos: [4.6, 1.5, -1.0], g: [86, 44] },
    { pos: [-0.3, 1.25, -3.8], g: [44, 30] }, { pos: [3.4, 0.5, 3.7], g: [72, 90] },
  ];

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const isCalm = () => reduced.matches || document.body.classList.contains('calm');
  function webgl() {
    try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (_) { return false; }
  }

  class Room {
    constructor(host, opts) {
      this.host = host; this.opts = opts; this.theme = THEMES[opts.theme] || THEMES.study;
      this.quality = 'standard'; this.samples = []; this.warmFrames = 30; this.slowWindows = 0;
      this.items = []; this.meshes = new Map(); this.tweens = []; this.yaw = 0;
      host.classList.add('dt-room');
      this.stage = document.createElement('div'); this.stage.className = 'dt-stage';
      this.layer = document.createElement('div'); this.layer.className = 'dt-markers';
      host.append(this.stage, this.layer);
      this.buildItems();
      this.refreshListener = () => this.refreshMode();
      this.visibilityListener = () => this.visibility();
      reduced.addEventListener('change', this.refreshListener);
      document.addEventListener('visibilitychange', this.visibilityListener);
      this.modeObserver = new MutationObserver(this.refreshListener);
      this.modeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      this.markerObserver = new ResizeObserver(() => this.layoutMarkers()); this.markerObserver.observe(host);
      this.mode2d('準備中');
      this.refreshMode();
    }
    refreshMode() {
      if (this.disposed) return;
      if (isCalm() || this.opts.force2d || this.failed) {
        this.teardown3d(); this.mode2d('平面圖：玩法與目前進度相同'); return;
      }
      if (this.renderer || this.loading) return;
      if (!webgl()) { this.failed = true; this.mode2d('這台裝置改用平面圖，玩法相同'); return; }
      this.loading = true;
      loadThree().then(() => { if (!this.disposed && !isCalm() && !this.opts.force2d && !this.failed) this.init3d(); })
        .catch(() => { this.failed = true; if (!this.disposed) this.mode2d('無法載入立體畫面，改用平面圖'); })
        .finally(() => { this.loading = false; });
    }
    finishTweens() { const pending = this.tweens.splice(0); for (const tw of pending) { try { tw.fn(1); } catch (_) {} } }
    visibility() {
      if (document.hidden) { this.finishTweens(); cancelAnimationFrame(this.raf); this.raf = 0; }
      else { this.layoutMarkers(); this.kick(); }
    }

    buildItems() {
      const { objects, puzzles } = this.opts;
      objects.forEach((o, i) => {
        const slot = HOLDERS[i % HOLDERS.length];
        this.items.push({ id: o.id, kind: 'holder', label: this.theme.holders[i % this.theme.holders.length], icon: '🔍', pos: slot.pos, g: slot.g, idx: i });
      });
      puzzles.filter((p) => STATIONS[p.type]).forEach((p) => {
        const s = STATIONS[p.type];
        this.items.push({ id: p.id, kind: p.type, label: s.label, icon: s.icon, pos: s.pos, g: s.g });
      });
      for (const it of this.items) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'dt-mark'; b.dataset.id = it.id; b.dataset.number = String(this.items.indexOf(it) + 1);
        b.innerHTML = `<span class="dt-ico" aria-hidden="true">${it.icon}</span><span class="dt-lab">${it.label}</span><span class="dt-st" aria-hidden="true"></span>`;
        b.addEventListener('click', () => this.opts.onPick(it.id));
        it.btn = b; this.layer.append(b);
      }
    }
    // state: hidden | locked | open | done | found | next
    setState(id, state, text) {
      const it = this.items.find((x) => x.id === id); if (!it) return;
      it.state = state;
      it.btn.dataset.state = state;
      it.btn.setAttribute('aria-label', `${it.label}，${text || ''}`);
      it.btn.querySelector('.dt-st').textContent = { locked: '🔒', done: '✓', found: '✓', next: '!' }[state] || '';
      if (!this.markerRaf) this.markerRaf = requestAnimationFrame(() => { this.markerRaf = 0; this.layoutMarkers(); });
      const m = this.meshes.get(id);
      if (m && m.userData.glow) {
        const ring = m.userData.glow; ring.visible = state === 'open' || state === 'next' || state === 'done' || state === 'found';
        ring.material.color.setHex(state === 'done' || state === 'found' ? 0x3fbf6a : 0xffc94d); ring.userData.calm = state === 'done' || state === 'found';
        if (ring.userData.calm) ring.scale.setScalar(1);
        this.kick();
      }
    }
    mode2d(msg) {
      this.is3d = false; this.host.classList.add('dt-2d'); this.host.classList.remove('dt-3d');
      this.status = msg;
      if (this.opts.onStatus) this.opts.onStatus(msg);
      // 平面圖：標記不可超出邊界（按鈕以中心定位）
      this.layoutMarkers();
    }
    init3d() {
      if (this.disposed || isCalm() || this.opts.force2d || this.failed) return;
      try {
        const T = window.THREE;
        const r = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
        r.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality === 'light' ? 1 : 1.25));
        r.shadowMap.enabled = this.quality !== 'light'; r.shadowMap.autoUpdate = false; r.shadowMap.needsUpdate = true; r.shadowMap.type = T.PCFSoftShadowMap;
        r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = .98;
        this.renderer = r; this.stage.append(r.domElement);
        r.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.failed = true; this.teardown3d(); this.mode2d('立體畫面中斷，改用平面圖'); });
        const scene = new T.Scene(); scene.background = new T.Color(this.theme.sky); this.scene = scene;
        const env = document.createElement('canvas'); env.width = 256; env.height = 128;
        const ctx = env.getContext('2d'), gradient = ctx.createLinearGradient(0, 0, 0, 128);
        gradient.addColorStop(0, '#c1d4e6'); gradient.addColorStop(.45, '#fff4dd'); gradient.addColorStop(1, '#79634f'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 256, 128);
        ctx.fillStyle = '#fffaf0'; ctx.fillRect(32, 20, 56, 35);
        const tex = new T.CanvasTexture(env); tex.encoding = T.sRGBEncoding; tex.mapping = T.EquirectangularReflectionMapping;
        const pmrem = new T.PMREMGenerator(r);
        try { this.environmentTarget = pmrem.fromEquirectangular(tex); scene.environment = this.environmentTarget.texture; } finally { tex.dispose(); pmrem.dispose(); }
        this.camera = new T.PerspectiveCamera(34, 1, 0.1, 100);
        scene.add(new T.HemisphereLight(0xffffff, 0xd9c2a0, 0.75));
        const sun = new T.DirectionalLight(0xfff1dc, 0.85); sun.position.set(4.3, 7, -3.8); sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 });
        scene.add(sun);
        this.group = new T.Group(); scene.add(this.group);
        this.buildRoom(T);
        this.raycaster = new T.Raycaster(); this.pointer = new T.Vector2();
        this.bindPointer();
        this.is3d = true; this.host.classList.add('dt-3d'); this.host.classList.remove('dt-2d');
        if (this.opts.onStatus) this.opts.onStatus('立體密室：拖曳可轉動房間，點物件調查');
        this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this.host);
        this.resize(); this.applyVisualState(this.snapshot); this.enter();
      } catch (e) { this.failed = true; this.teardown3d(); this.mode2d('立體畫面無法使用，改用平面圖'); }
    }
    mat(color, rough = .8) {
      this.materials ||= new Map();
      const key = `${color}|${rough}`; if(this.materials.has(key)) return this.materials.get(key);
      const metal = color === 0xf6d16a;
      const paper = [0xffffff, 0xfffbf0, 0xfffdf2, 0xfff3c4].includes(color);
      const material = new window.THREE.MeshStandardMaterial({ color: new window.THREE.Color(color).convertSRGBToLinear(), roughness: metal ? .35 : paper ? .95 : rough, metalness: metal ? .72 : 0 });
      this.materials.set(key,material); return material;
    }
    sampleFrame(t, busy) {
      if (!busy || document.hidden) { this.lastActiveFrame = null; return; }
      if (this.warmFrames > 0) { this.warmFrames--; this.lastActiveFrame = t; return; }
      if (this.lastActiveFrame != null) this.samples.push(t - this.lastActiveFrame);
      this.lastActiveFrame = t;
      if (this.samples.length < 90) return;
      const p95 = this.samples.sort((a, b) => a - b)[85]; this.samples = [];
      this.slowWindows = p95 > (this.quality === 'light' ? 28 : 22) ? this.slowWindows + 1 : 0;
      if (this.slowWindows < 2) return;
      this.slowWindows = 0;
      if (this.quality === 'light') { this.failed = true; this.teardown3d(); this.mode2d('裝置改用流暢平面圖，進度保留'); }
      else { this.quality = 'light'; this.renderer.shadowMap.enabled = false; this.renderer.setPixelRatio(1); this.resize(); }
    }
    box(w, h, d, color, x, y, z, parent) {
      const T = window.THREE; const m = new T.Mesh(new T.BoxGeometry(w, h, d), this.mat(color));
      m.position.set(x, y, z); m.castShadow = Math.min(w, h, d) > .035; m.receiveShadow = true; (parent || this.group).add(m); return m;
    }
    cyl(rt, rb, h, color, x, y, z, parent, seg = 20) {
      const T = window.THREE; const m = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), this.mat(color));
      m.position.set(x, y, z); m.castShadow = rt > .08; (parent || this.group).add(m); return m;
    }
    buildRoom(T) {
      const th = this.theme; const g = this.group;
      // 地板、兩面牆（剖面娃娃屋視角）、踢腳板、窗戶
      const floor = this.box(12, 0.2, 9, th.floor, 0, -0.1, 0); floor.castShadow = false;
      for (let i = -5; i <= 5; i += 1.2) { const ln = this.box(0.03, 0.01, 9, 0x5a3a1c, i, 0.005, 0); ln.material.transparent = true; ln.material.opacity = 0.25; ln.castShadow = false; }
      this.box(12, 5, 0.2, th.wall, 0, 2.5, -4.6).castShadow = false;
      this.box(0.2, 5, 9, th.wall2, -6.1, 2.5, 0).castShadow = false;
      this.box(12, 0.3, 0.1, th.accent, 0, 0.15, -4.45); this.box(0.1, 0.3, 9, th.accent, -5.95, 0.15, 0);
      const win = this.box(2.2, 1.6, 0.06, 0xbfe3ff, 4.3, 3.0, -4.48); win.material = win.material.clone(); win.material.emissive = new T.Color(0x8fcfff); win.material.emissiveIntensity = 0.35;
      this.box(2.4, 0.12, 0.2, 0xffffff, 4.3, 2.15, -4.42);
      [3.16, 4.3, 5.44].forEach(x => this.box(.08, 1.8, .14, 0xffffff, x, 3, -4.36));
      [2.12, 3.88].forEach(y => this.box(2.4, .1, .18, 0xffffff, 4.3, y, -4.36));
      const beam = new T.Mesh(new T.PlaneGeometry(2.2, 6), new T.MeshBasicMaterial({ color: 0xfff1c4, transparent: true, opacity: 0.09, depthWrite: false, side: T.DoubleSide }));
      const soft = document.createElement('canvas'); soft.width=64; soft.height=128;
      const bc=soft.getContext('2d'), fade=bc.createLinearGradient(0,0,64,0); fade.addColorStop(0,'#000'); fade.addColorStop(.3,'#fff'); fade.addColorStop(.7,'#fff'); fade.addColorStop(1,'#000'); bc.fillStyle=fade;bc.fillRect(0,0,64,128); beam.material.alphaMap=new T.CanvasTexture(soft);
      beam.position.set(4.0, 1.6, -2.2); beam.rotation.set(-1.0, 0.15, 0); g.add(beam);
      const plate = document.createElement('canvas'); plate.width = 512; plate.height = 128; const pc = plate.getContext('2d');
      pc.fillStyle = '#7a3e1d'; pc.fillRect(0, 0, 512, 128); pc.fillStyle = '#ffe9b0'; pc.fillRect(8, 8, 496, 112);
      pc.fillStyle = '#5a2e12'; pc.font = '900 64px "PingFang TC","Microsoft JhengHei","Noto Sans TC",sans-serif'; pc.textAlign = 'center'; pc.textBaseline = 'middle'; pc.fillText('🔍 ' + th.name, 256, 66);
      const tex = new T.CanvasTexture(plate); tex.encoding = T.sRGBEncoding;
      const sign = new T.Mesh(new T.PlaneGeometry(2.4, 0.6), new T.MeshBasicMaterial({ map: tex })); sign.position.set(-1.6, 3.75, -4.45); g.add(sign);
      const rug = this.cyl(2.6, 2.6, 0.04, th.rug, 0.5, 0.02, 1.8, g, 40); rug.scale.z = 0.62; rug.receiveShadow = true; rug.material.roughness = .95; rug.castShadow = false;
      const contact=document.createElement('canvas');contact.width=64;contact.height=64;
      const sc=contact.getContext('2d'), falloff=sc.createRadialGradient(32,32,3,32,32,32);falloff.addColorStop(0,'rgba(48,30,18,.2)');falloff.addColorStop(1,'rgba(48,30,18,0)');sc.fillStyle=falloff;sc.fillRect(0,0,64,64);
      const shadowMat=new T.MeshBasicMaterial({map:new T.CanvasTexture(contact),transparent:true,depthWrite:false});
      [[-1.9,.9,3,1.8],[3.6,-3.6,2,1.7],[2.2,1.4,2.3,2.3],[5,3.1,1.2,1.2]].forEach(([x,z,w,d])=>{const shadow=new T.Mesh(new T.PlaneGeometry(w,d),shadowMat);shadow.rotation.x=-Math.PI/2;shadow.position.set(x,.012,z);g.add(shadow);});
      // 書架
      this.box(2.4, 3.4, 0.08, 0x8a5a2b, -4.0, 1.7, -4.42);
      [-5.15, -2.85].forEach(x => this.box(.1, 3.4, .7, 0x8a5a2b, x, 1.7, -4.1));
      [0.6, 1.5, 2.4, 3.2].forEach((y) => this.box(2.3, 0.08, 0.65, 0x6e4520, -4.0, y, -4.1));
      const bookC = [0xe05a4f, 0xf0a030, 0x3fa45b, 0x3b82c4, 0x8b5cc8, 0xd1559a];
      bookC.forEach((color,c)=>{
        const books=[]; [0.95,1.85,2.75].forEach((y,r)=>{for(let i=0;i<9;i++) if((i+r)%6===c) books.push([-5+i*.24,y+.06,.55+((i+r)%3)*.08]);});
        const batch=new T.InstancedMesh(new T.BoxGeometry(1,1,1),this.mat(color),books.length), dummy=new T.Object3D();
        books.forEach(([x,y,h],i)=>{dummy.position.set(x,y,-4.05);dummy.scale.set(.18,h,.45);dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);}); g.add(batch);
      });
      // 書桌與抽屜、打字機
      const desk = new T.Group(); desk.position.set(-1.9, 0, 0.9); g.add(desk);
      this.box(2.6, 0.12, 1.3, 0xa0703e, 0, 0.95, 0, desk);
      [[-1.2, -0.55], [1.2, -0.55], [-1.2, 0.55], [1.2, 0.55]].forEach(([x, z]) => this.box(0.12, 0.9, 0.12, 0x7a5129, x, 0.45, z, desk));
      const drawer = this.box(1.0, 0.28, 0.9, 0xc08850, 0, 0.72, 0.15, desk); this.drawer = drawer;
      this.box(0.3, 0.06, 0.06, 0xf6d16a, 0, 0, 0.47, drawer);
      const tw = new T.Group(); tw.position.set(0, 1.01, -0.15); desk.add(tw);
      this.box(1.0, 0.22, 0.6, 0x2f3d4f, 0, 0.11, 0, tw); this.typePaper = this.box(0.9, 0.35, 0.08, 0xfffbf0, 0, 0.42, -0.2, tw);
      for (let i = 0; i < 8; i++) this.cyl(0.04, 0.04, 0.05, 0xf6efe2, -0.35 + i * 0.1, 0.25, 0.15, tw, 8);
      // 布告欄
      this.box(2.4, 1.5, 0.08, 0xc9955c, -1.6, 2.5, -4.46); this.box(2.2, 1.3, 0.04, 0xead2a8, -1.6, 2.5, -4.41);
      this.boardCards = [];
      [[-2.3, 2.7], [-1.6, 2.35], [-0.9, 2.75]].forEach(([x, y], i) => { this.boardCards.push(this.box(0.5, 0.4, 0.02, 0xffffff, x, y, -4.38)); this.cyl(0.04, 0.04, 0.04, bookC[i], x, y + 0.17, -4.36, g, 8).rotation.x = Math.PI / 2; });
      // 保險箱（門可開）
      const safe = new T.Group(); safe.position.set(3.6, 0, -3.6); g.add(safe);
      this.box(1.4, 1.5, .1, 0x303a46, 0, .75, -.55, safe);
      [-.66,.66].forEach(x=>this.box(.08,1.5,1.2,0x5b6573,x,.75,0,safe));
      [.05,1.45].forEach(y=>this.box(1.4,.1,1.2,0x5b6573,0,y,0,safe));
      const sdoor = new T.Group(); sdoor.position.set(-0.65, 0.75, 0.61); safe.add(sdoor);
      this.box(1.25, 1.3, 0.08, 0x6f7a89, 0.62, 0, 0, sdoor);
      const dial = this.cyl(0.22, 0.22, 0.08, 0xf6d16a, 0.62, 0.1, 0.06, sdoor, 24); dial.rotation.x = Math.PI / 2; this.safeDial = dial;
      this.safeDoor = sdoor;
      // 鎖櫃（左牆）
      const cab = new T.Group(); cab.position.set(-5.5, 0, 0.6); g.add(cab);
      this.box(0.9, 2.4, 2.0, 0x9c6b43, 0, 1.2, 0, cab);
      this.cabDoors = [-.95,.95].map((z,i)=>{const pivot=new T.Group();pivot.position.set(.47,1.6,z);cab.add(pivot);const side=i?-1:1;this.box(.06,1,.9,0xb98352,0,0,side*.45,pivot);this.box(.08,.18,.12,0xf6d16a,.05,0,side*.8,pivot);return pivot;});
      // 推理機（左後角，齒輪）
      const mach = new T.Group(); mach.position.set(-5.1, 0, -3.1); g.add(mach); this.mach = mach;
      this.box(1.1, 1.8, 1.0, 0x3b82c4, 0, 0.9, 0, mach);
      this.gears = [[-0.1, 1.4, 0.32, 0xf0a030], [0.22, 1.05, 0.22, 0xe05a4f]].map(([x, y, r, c]) => { const gg = this.cyl(r, r, 0.1, c, x + 0.56, y, 0, mach, 10); gg.rotation.z = Math.PI / 2; return gg; });
      // 放大鏡桌
      const tbl = new T.Group(); tbl.position.set(2.2, 0, 1.4); g.add(tbl);
      this.cyl(0.9, 0.9, 0.1, 0xb07a45, 0, 0.9, 0, tbl, 28); this.cyl(0.12, 0.2, 0.9, 0x7a5129, 0, 0.45, 0, tbl, 12);
      this.evidenceCards=[this.box(.5,.02,.6,0xffffff,-.3,.96,.1,tbl),this.box(.5,.02,.6,0xfff3c4,.3,.96,-.1,tbl)]; this.evidenceCards[0].rotation.y=.3;this.evidenceCards[1].rotation.y=-.2;
      const lens = new T.Mesh(new T.TorusGeometry(0.22, 0.04, 8, 24), this.mat(0x2b1d12)); lens.position.set(0.1, 1.05, 0.3); lens.rotation.x = Math.PI / 2; tbl.add(lens);
      // 門（可開）
      const door = new T.Group(); door.position.set(0.55, 0, -4.45); g.add(door); this.door = door;
      this.box(1.7, 3.1, 0.12, th.accent, 0, 1.55, -0.02).position.set(1.3, 1.55, -4.52);
      this.box(1.5, 2.9, 0.1, 0xc98b55, 0.75, 1.45, 0.02, door);
      this.cyl(0.07, 0.07, 0.12, 0xf6d16a, 1.3, 1.4, 0.1, door, 10).rotation.x = Math.PI / 2;
      // 小擺設：盆栽、檯燈、地球儀、皮箱、相框
      this.cyl(0.35, 0.25, 0.6, 0xc0583a, 5.0, 0.3, 3.1);
      for (let i = 0; i < 5; i++) { const leaf = new T.Mesh(new T.SphereGeometry(.32, 8, 6), this.mat(i % 2 ? 0x397b42 : 0x55934a)); leaf.scale.set(.45, 1.7, .22); leaf.position.set(5 + Math.sin(i * 2.4) * .24, .85 + i * .08, 3.1 + Math.cos(i * 2.4) * .24); leaf.rotation.z = (i - 2) * .38; g.add(leaf); }
      this.cyl(0.5, 0.5, 0.06, 0x7a5129, 4.6, 0.03, -1.0); this.cyl(0.05, 0.05, 1.3, 0x2b1d12, 4.6, 0.7, -1.0, g, 8);
      const shade = this.cyl(0.2, 0.45, 0.45, 0xffe08a, 4.6, 1.45, -1.0); shade.material = shade.material.clone(); shade.material.emissive = new T.Color(0xffd36a); shade.material.emissiveIntensity = 0.4;
      const lamp = new T.PointLight(0xffd9a0, 0.5, 6); lamp.position.set(4.6, 1.3, -1.0); g.add(lamp);
      this.box(0.9, 0.9, 0.7, 0x6e4520, -0.3, 0.45, -3.8); const globe = new T.Mesh(new T.SphereGeometry(0.32, 20, 14), this.mat(0x3b82c4, 0.5)); globe.position.set(-0.3, 1.25, -3.8); globe.castShadow = true; g.add(globe); this.globe = globe;
      this.box(1.2, 0.7, 0.8, 0x8a4f2b, 3.4, 0.35, 3.7); this.box(1.22, 0.08, 0.82, 0xf6d16a, 3.4, 0.55, 3.7);
      this.box(0.06, 1.0, 1.3, 0xa0703e, -5.98, 2.5, 2.6); this.box(0.04, 0.8, 1.1, 0xbfe3ff, -5.94, 2.5, 2.6);
      [2.08,3.12].forEach(z=>this.box(.07,.85,.06,0xf6d16a,-5.9,2.5,z));
      [2.08,2.92].forEach(y=>this.box(.07,.06,1.1,0xf6d16a,-5.9,y,2.6));
      this.buildTheme(T);
      // 每個互動點：看不見的點擊盒＋發光圈
      for (const it of this.items) {
        const hit = new T.Mesh(new T.BoxGeometry(1.3, 1.3, 1.3), new T.MeshBasicMaterial({ visible: false }));
        hit.position.set(...it.pos); hit.userData.id = it.id; g.add(hit);
        const ring = new T.Mesh(new T.TorusGeometry(0.55, 0.06, 8, 32), new T.MeshBasicMaterial({ color: 0xffc94d }));
        ring.position.set(it.pos[0], Math.max(0.08, it.pos[1] - 0.6), it.pos[2]); ring.rotation.x = Math.PI / 2; ring.visible = false; g.add(ring);
        hit.userData.glow = ring; this.meshes.set(it.id, hit);
        if (it.state) this.setState(it.id, it.state);
      }
    }
    buildTheme(T) {
      const key = this.opts.theme;
      if (key === 'classroom') { this.box(2.3, 1.1, .08, 0x345d4b, -1.6, 4.35, -4.38); this.box(2.4, .08, .2, 0xb58755, -1.6, 3.78, -4.3); }
      if (key === 'library') { this.box(1.5,.12,.7,0x5a6570,3.8,.4,2.6); this.box(1.5,.12,.7,0x5a6570,3.8,1,2.6); for(let i=0;i<4;i++) this.box(.2,.5,.5,[0x963f36,0x3c6d82][i%2],3.3+i*.3,1.3,2.6); for(const x of [3.2,4.4]) this.cyl(.13,.13,.15,0x303b43,x,.15,2.6).rotation.z=Math.PI/2; }
      if (key === 'forest') { this.globe.visible=false; this.cyl(.4,.3,.28,0x967044,-.3,1.12,-3.8); for(let i=0;i<3;i++) this.cyl(.04,.13,.32,0x6e4520,-.5+i*.2,1.38,-3.8,undefined,8); this.box(1.5,.16,.9,0x765337,3.4,.78,3.7); }
      if (key === 'lab') { this.box(1.6,.1,.7,0x758997,3.7,1.1,2.6); for(let i=0;i<3;i++) { this.cyl(.17,.2,.42,[0x5caab8,0x8060ae,0x62a579][i],3.2+i*.5,1.36,2.6); this.cyl(.07,.07,.24,0xd2e5ed,3.2+i*.5,1.66,2.6); } }
      if (key === 'museum') { this.box(1,.95,1,0xe1d6c4,3.7,.48,2.6); const artifact = new T.Mesh(new T.IcosahedronGeometry(.4,0),this.mat(0xf6d16a)); artifact.position.set(3.7,1.35,2.6); this.group.add(artifact); this.box(1.3,.08,1.3,0x633e29,3.7,.08,2.6); }
      if (key === 'study') { this.box(.65,.07,.45,0x802f39,-2.5,1.08,1.1); this.box(.57,.04,.42,0xfffbf0,-2.5,1.13,1.1); }
      const light = new T.Mesh(new T.PlaneGeometry(1.5,4),new T.MeshBasicMaterial({color:0xffefbd,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide})); light.rotation.x=-Math.PI/2; light.position.set(1.3,.045,-2.3); this.group.add(light); this.exitLight=light;
    }
    applyVisualState(snapshot) {
      if (snapshot) this.snapshot = snapshot;
      if (!this.group || !this.snapshot) return;
      const done = new Set(this.snapshot.done), found = new Set(this.snapshot.found);
      if(this.safeDoor) this.safeDoor.rotation.y = done.has('dial') ? -1.3 : 0;
      const drawerItem=this.items.find(it=>it.kind==='holder' && it.idx===1);
      if(this.drawer) this.drawer.position.z=.15+(found.has(drawerItem?.id) ? .35 : 0);
      this.boardCards?.forEach((card,i)=>{ card.rotation.z=done.has('sort') ? 0 : (i-1)*.15; card.position.y=done.has('sort') ? 2.5 : [2.7,2.35,2.75][i]; });
      this.gears?.forEach((gear,i)=>{ gear.rotation.x=done.has('cause') ? (i?-1:1)*8 : 0; });
      this.cabDoors?.forEach((door,i)=>{door.rotation.y=done.has('keys') ? (i?1:-1)*.65 : 0;});
      if(this.typePaper) {this.typePaper.position.y=done.has('blocks') ? .62 : .42;this.typePaper.scale.y=done.has('blocks') ? 1.6 : 1;}
      this.evidenceCards?.forEach((card,i)=>{card.rotation.y=done.has('compare') ? 0 : (i?-.2:.3);});
      if(this.door) this.door.rotation.y=this.snapshot.escaped ? -1.5 : 0;
      if(this.exitLight) this.exitLight.material.opacity=this.snapshot.escaped ? .35 : 0;
      this.kick();
    }
    enter() {
      if(this.entered || !this.is3d) return; this.entered=true;
      const end=this.camera.position.clone(), start=new window.THREE.Vector3(4.3,3.1,-7);
      const skip=document.createElement('button'); skip.className='dt-skip'; skip.textContent='略過開場'; skip.type='button'; this.host.append(skip);
      const finish=()=>{ this.camera.position.copy(end); this.camera.lookAt(0,1.7,0); skip.remove(); this.markerKey=null; this.kick(); };
      skip.onclick=()=>{this.finishTweens();finish();};
      this.tween(800,k=>{this.camera.position.lerpVectors(start,end,k);this.camera.lookAt(0,1.7,0);this.markerKey=null;if(k===1)finish();});
    }
    bindPointer() {
      const el = this.renderer.domElement; let down = null;
      el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, yaw: this.yaw }; el.setPointerCapture(e.pointerId); });
      el.addEventListener('pointermove', (e) => {
        if (!down) return;
        const dx = e.clientX - down.x;
        if (Math.abs(dx) > 6) { this.yaw = Math.max(-0.45, Math.min(0.45, down.yaw - dx / 400)); this.place(); this.kick(); }
      });
      ['pointercancel', 'lostpointercapture'].forEach(event => el.addEventListener(event, () => { down = null; }));
      el.addEventListener('pointerup', (e) => {
        if (!down) return;
        const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8; down = null;
        if (moved) return;
        const rect = el.getBoundingClientRect();
        this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        this.raycaster.setFromCamera(this.pointer, this.camera);
        const hits = this.raycaster.intersectObjects([...this.meshes.values()]);
        if (hits.length) this.opts.onPick(hits[0].object.userData.id);
      });
    }
    place() {
      // 依房間角點的實際投影迭代逼近，讓房間（地板＋牆的下 4/5）佔畫面約九成，不留大片空白
      const T = window.THREE, a = .62 + this.yaw;
      const target = new T.Vector3(0, 1.4, 0);
      const direction = new T.Vector3(Math.sin(a), .95, Math.cos(a)).normalize();
      const corners = [];
      for (const x of [-6.2, 6.1]) for (const y of [0, 4.2]) for (const z of [-4.7, 4.6]) corners.push(new T.Vector3(x, y, z));
      let distance = 18;
      for (let n = 0; n < 14; n++) {
        this.camera.position.copy(target).addScaledVector(direction, distance); this.camera.lookAt(target); this.camera.updateMatrixWorld(true);
        let ext = 0; for (const c of corners) { const p = c.clone().project(this.camera); ext = Math.max(ext, Math.abs(p.x), Math.abs(p.y)); }
        if (ext > .9 && ext < .95) break;
        distance *= ext / .925;
      }
      this.markerKey = null;
    }

    resize() {
      if (!this.renderer) return;
      const w = this.host.clientWidth, h = this.host.clientHeight; if (!w || !h) return;
      this.renderer.setSize(w, h, false); this.camera.aspect = w / h;
      this.camera.fov = w / h < 1 ? 48 : 34; this.camera.updateProjectionMatrix(); this.place(); this.kick();
    }
    kick() { if (this.is3d && !this.raf) this.raf = requestAnimationFrame((t) => this.frame(t)); }
    frame(t) {
      this.raf = 0; if (this.disposed || !this.renderer) return;
      let busy = false;
      try {
      this.tweens = this.tweens.filter((tw) => { const k = Math.min(1, (t - (tw.t0 || (tw.t0 = t))) / tw.ms); tw.fn(1 - Math.pow(1 - k, 3)); busy = true; return k < 1; });
      this.sampleFrame(t, busy); if (!this.renderer) return;
      this.renderer.shadowMap.needsUpdate = true;
      this.renderer.render(this.scene, this.camera); this.layoutMarkers(); }
      catch (_) { this.failed = true; this.teardown3d(); this.mode2d('立體畫面中斷，請繼續調查'); return; }
      if (busy && !document.hidden) this.kick();
    }
    layoutMarkers() {
      if (this.disposed) return;
      const w = this.host.clientWidth, h = this.host.clientHeight; if (!w || !h) return;
      if (this.camera) this.camera.updateMatrixWorld(true);
      if (this.group) this.group.updateMatrixWorld(true);
      const key = [w, h, this.yaw, this.is3d, this.camera?.position.toArray(), document.body.className, ...this.items.map(it => it.state)].join('|');
      if (key === this.markerKey) return; this.markerKey = key;
      const target = this.items.find(it => it.kind !== 'holder' && it.state === 'next');
      this.items.forEach(it => { it.btn.classList.toggle('dt-target', it === target); it.btn.classList.remove('dt-dot'); });
      const sizes = this.items.map(it => ({ it, w: it.btn.offsetWidth, h: it.btn.offsetHeight }));
      const placed = [];
      for (const entry of sizes.sort((a,b) => Number(b.it === target) - Number(a.it === target))) {
        const {it} = entry; if (it.state === 'hidden') continue;
        let x = w * it.g[0] / 100, y = h * it.g[1] / 100;
        if (this.is3d && this.camera) { const v = new window.THREE.Vector3(...it.pos).applyMatrix4(this.group.matrixWorld).project(this.camera); x = (v.x + 1) * w / 2; y = (1 - v.y) * h / 2; }
        const bw = Math.min(entry.w, w-24), bh = entry.h;
        let best;
        for (const radius of [0, 16, 32, 48]) {
          for (let i=0; i < (radius ? 12 : 1); i++) {
            const cx = x + Math.cos(i*Math.PI/6)*radius-bw/2, cy = y + Math.sin(i*Math.PI/6)*radius-bh/2;
            if (cx<8 || cy<8 || cx+bw>w-8 || cy+bh>h-52 || placed.some(r => cx<r.x+r.w+8 && cx+bw+8>r.x && cy<r.y+r.h+8 && cy+bh+8>r.y)) continue;
            best={x:cx,y:cy,w:bw,h:bh}; break;
          }
          if(best) break;
        }
        if (!best) { it.btn.classList.add('dt-dot'); best={x:Math.max(4,Math.min(w-24,x-10)), y:Math.max(4,Math.min(h-52,y-10)), w:20,h:20}; }
        placed.push(best); entry.rect=best;
      }
      sizes.forEach(({it,rect}) => { if(rect) { it.btn.style.left=rect.x+'px'; it.btn.style.top=rect.y+'px'; } });
    }

    tween(ms, fn) { if (!this.is3d || isCalm() || document.hidden) { fn(1); return; } if (!this.tweens.length) this.lastActiveFrame = null; this.tweens.push({ ms, fn }); this.kick(); }
    // 紙卡從物件升起、翻一圈後消失（找到線索的回饋）
    paper(id) {
      const it = this.items.find((x) => x.id === id); if (!it || !this.is3d || isCalm()) return;
      const target = document.getElementById('dt-notebook'); if(!target) return;
      const from=it.btn.getBoundingClientRect(), to=target.getBoundingClientRect();
      const card=document.createElement('div'); card.className='dt-flying-paper'; card.textContent='線索 → 📓'; document.body.append(card);
      this.tween(400,k=>{card.style.left=(from.left+(to.left-from.left)*k)+'px';card.style.top=(from.top+(to.top-from.top)*k-40*Math.sin(k*Math.PI))+'px';card.style.transform='rotate('+(-12*k)+'deg) scale('+(1-.5*k)+')';if(k===1)card.remove();});
    }

    confetti(pos) {
      if (!this.is3d || isCalm()) return;
      const T = window.THREE; const cols = [0xe05a4f, 0xf0a030, 0x3fa45b, 0x3b82c4, 0x8b5cc8, 0xffffff];
      const bits = Array.from({ length: this.quality === 'light' ? 0 : 8 }, (_, k) => { const m = new T.Mesh(new T.BoxGeometry(0.16, 0.03, 0.1), this.mat(cols[k % cols.length])); m.userData.v = [(artRandom() - 0.5) * 5, 4 + artRandom() * 3, (artRandom() - 0.2) * 4]; this.group.add(m); return m; });
      this.tween(1500, (k) => { bits.forEach((m, i) => { const [vx, vy, vz] = m.userData.v; m.position.set(pos[0] + vx * k, pos[1] + vy * k - 6 * k * k, pos[2] + vz * k); m.rotation.set(k * 12 + i, k * 9, k * 6); }); if (k === 1) bits.forEach((m) => { this.group.remove(m); m.geometry.dispose(); m.material.dispose(); }); });
    }
    // 機關動畫：保險箱開門、抽屜拉出、齒輪轉、門打開
    animate(kind, id) {
      if (!this.is3d) return Promise.resolve();
      if (kind === 'found') { this.paper(id); return Promise.resolve(); }
      this.finishTweens();
      if (kind === 'search') { const it=this.items.find(x=>x.id===id); if(it?.idx===1) this.tween(350,k=>{this.drawer.position.z=.15+.35*k;}); }
      if (kind === 'dial') this.tween(650,k=>{this.safeDoor.rotation.y=-1.3*k;});
      if (kind === 'keys') this.tween(600,k=>{this.cabDoors.forEach((door,i)=>{door.rotation.y=(i?1:-1)*.65*k;});});
      if (kind === 'blocks') this.tween(500,k=>{this.typePaper.position.y=.42+.2*k;this.typePaper.scale.y=1+.6*k;});
      if (kind === 'compare') this.tween(500,k=>{this.evidenceCards.forEach((card,i)=>{card.rotation.y=(i?-.2:.3)*(1-k);});});
      if (kind === 'cause') this.tween(650,k=>{this.gears.forEach((g,i)=>{g.rotation.x=(i?-1:1)*8*k;});});
      if (kind === 'escape') { this.snapshot={...this.snapshot,escaped:true}; this.tween(700,k=>{this.door.rotation.y=-1.5*k;this.exitLight.material.opacity=.35*k;}); }
      return new Promise(resolve=>{this.tween(700,k=>{if(k===1)resolve();});});
    }

    teardown3d() {
      this.finishTweens(); this.is3d = false;
      cancelAnimationFrame(this.raf); this.raf = 0;
      this.meshes.clear(); this.materials?.clear();
      if (this.ro) this.ro.disconnect();
      this.environmentTarget?.dispose(); this.environmentTarget = null;
      if (this.renderer) {
        const resources = new Set();
        this.scene && this.scene.traverse((o) => {
          if (o.geometry) resources.add(o.geometry);
          for (const m of (Array.isArray(o.material) ? o.material : [o.material])) if (m) { resources.add(m); for (const v of Object.values(m)) if (v && v.isTexture) resources.add(v); }
        });
        resources.forEach((r) => r.dispose());
        this.renderer.dispose(); this.renderer.domElement.remove(); this.renderer = null;
      }
    }
    dispose() { this.disposed = true; reduced.removeEventListener('change', this.refreshListener); document.removeEventListener('visibilitychange', this.visibilityListener); this.modeObserver.disconnect(); this.markerObserver.disconnect(); cancelAnimationFrame(this.markerRaf); this.teardown3d(); this.host.replaceChildren(); }
  }

  window.Detective3D = { mount: (host, opts) => new Room(host, opts), THEMES };
})();
