/* 課文偵探密室 3D 房間（Three.js r128）。只負責畫面與點選，不出題、不判分。
   剖面微縮屋、可拖曳探索鏡頭與兩種 DOM 標記模式。
   物件標記一律是 DOM 按鈕（鍵盤、讀屏、觸控都能用）；3D 失敗、減少動態或 WebGL 不可用時改成 2D 平面圖，玩法相同。 */
(function () {
  'use strict';
  const kit = () => window.RG3DKit;
  let artSeed = 0x61d92, serial = 0;
  const artRandom = () => { artSeed = (1664525 * artSeed + 1013904223) >>> 0; return artSeed / 4294967296; };
  const readSetting = (key, fallback) => { try { return localStorage.getItem(key) || fallback; } catch (_) { return fallback; } };
  const saveSetting = (key, value) => { try { localStorage.setItem(key, value); } catch (_) {} };
  const loadThree = () => kit().load();

  // 場景主題：共用機關，另加符合名稱的主題道具。
  const THEMES = {
    study: { name: '神祕書房', wall: 0x244b3c, wall2: 0x18352b, floor: 0xb98352, rug: 0x8a4fa8, accent: 0xa84b17, sky: 0xfff4e2,
      holders: ['書架上的書', '書桌抽屜', '牆上的相框', '盆栽', '地毯一角', '檯燈下', '地球儀', '舊皮箱'] },
    classroom: { name: '放學後的教室', wall: 0xe4f1e4, wall2: 0xd2e8d3, floor: 0xc79a62, rug: 0x3b82c4, accent: 0x2f7d4a, sky: 0xf2fff4,
      holders: ['圖書角的書', '講桌抽屜', '布告欄照片', '窗邊盆栽', '教室地墊', '檯燈下', '地球儀', '置物箱'] },
    library: { name: '安靜的圖書館', wall: 0x493025, wall2: 0x302219, floor: 0x9c6b43, rug: 0xc0362c, accent: 0x7a3e1d, sky: 0xfff6ea,
      holders: ['借書架', '還書櫃抽屜', '館員留言框', '閱讀區盆栽', '地毯一角', '閱讀燈下', '地球儀', '書車箱子'] },
    forest: { name: '森林小屋', wall: 0xa77446, wall2: 0x68472e, floor: 0x8f6a3e, rug: 0x3fa45b, accent: 0x4c7a2a, sky: 0xf4fbe8,
      holders: ['木架上的書', '木桌抽屜', '牆上的畫', '林間盆栽', '草編地毯', '油燈下', '松果籃', '木箱'] },
    lab: { name: '科學實驗室', wall: 0xe5eeee, wall2: 0x728c91, floor: 0xb8c2cc, rug: 0x3b82c4, accent: 0x1f5fa8, sky: 0xf2f9ff,
      holders: ['資料架', '實驗桌抽屜', '公告照片', '觀察盆栽', '防滑墊', '顯微燈下', '地球儀', '器材箱'] },
    museum: { name: '小小博物館', wall: 0x722c40, wall2: 0x441c2b, floor: 0xa87a4f, rug: 0xb5382c, accent: 0x8b5cc8, sky: 0xfff6e6,
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
  // 標記按鈕的 class 查詢；替身環境（舊 p0 測試）的 classList 沒有 contains，退回讀 dot 旗標。
  const hasClass = (el, c) => (el.classList && el.classList.contains) ? el.classList.contains(c) : (c === 'dt-dot' ? !!el.dot : false);
  const isCalm = () => (window.RG && RG.systemReduced ? RG.systemReduced() : reduced.matches) || document.body.classList.contains('calm');
  function webgl() {
    try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (_) { return false; }
  }

  class Room {
    constructor(host, opts) {
      this.host = host; this.opts = opts; this.theme = THEMES[opts.theme] || THEMES.study;
      this.quality = 'standard'; this.samples = []; this.warmFrames = 30; this.slowWindows = 0;
      this.items = []; this.meshes = new Map(); this.tweens = []; this.yaw = 0; this.pitch = 0; this.zoom = 1; this.uid = ++serial; this.ownedKeys = new Set(); this.ownedTextures = new Set();
      this.markerMode = readSetting('dt-marker-mode', 'standard') === 'high' ? 'high' : 'standard'; this.fixedView = readSetting('dt-fixed-view', 'false') === 'true';
      host.classList.add('dt-room');
      this.stage = document.createElement('div'); this.stage.className = 'dt-stage';
      this.layer = document.createElement('div'); this.layer.className = 'dt-markers';
      host.append(this.stage, this.layer);
      this.buildItems();
      this.resetButton = document.createElement('button'); this.resetButton.type = 'button'; this.resetButton.className = 'dt-reset-view';
      this.resetButton.textContent = '⟲ 回到預設視角'; this.resetButton.onclick = () => { if (!this.camera) return; this.finishTweens(); this.yaw = this.pitch = 0; this.zoom = 1; this.place(); this.kick(); }; host.append(this.resetButton);
      this.refreshListener = () => this.refreshMode();
      this.visibilityListener = () => this.visibility();
      reduced.addEventListener('change', this.refreshListener);
      document.addEventListener('visibilitychange', this.visibilityListener);
      this.modeObserver = new MutationObserver(this.refreshListener);
      this.modeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      this.markerObserver = new ResizeObserver(() => this.layoutMarkers()); this.markerObserver.observe(host);
      this.mode2d('準備中');
      this.listContainer=host.parentElement?.querySelector('.dt-side');
      this.listFocusListener=e=>{
        const button=e.target.closest('button'); if(!button || button.disabled) return;
        let id=button.dataset.id;
        if(!id) { const match=button.textContent.match(/(?:^|\s)(\d+)\./); if(match) id=this.items[Number(match[1])-1]?.id; }
        if(!id) id=this.items.find(it=>button.textContent.includes(it.label))?.id;
        if(id) this.focus(id);
      };
      this.listContainer?.addEventListener('click',this.listFocusListener,true);
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
      if (document.hidden) { clearTimeout(this.occlusionTimer); this.finishTweens(); clearTimeout(this.occlusionTimer); cancelAnimationFrame(this.raf); this.raf = 0; }
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
        b.type = 'button'; b.className = 'dt-mark'; b.dataset.kind = it.kind; b.dataset.id = it.id; b.dataset.number = String(this.items.indexOf(it) + 1);
        b.innerHTML = `<span class="dt-ico" aria-hidden="true">${it.icon}</span><span class="dt-lab">${it.label}</span><span class="dt-st" aria-hidden="true"></span>`;
        b.addEventListener('click', () => { this.focus(it.id); this.opts.onPick(it.id); });
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
        ring.material.color.setHex(state === 'done' || state === 'found' ? 0x3fbf6a : 0xffc94d).convertSRGBToLinear(); ring.userData.calm = state === 'done' || state === 'found';
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
        const r = kit().createRenderer(this.quality); r.toneMappingExposure = .92;
        r.domElement.style.pointerEvents = 'auto';
        this.renderer = r; this.stage.append(r.domElement);
        r.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.failed = true; this.teardown3d(); this.mode2d('立體畫面中斷，改用平面圖'); });
        const scene = new T.Scene(); this.scene = scene;
        const pmrem = new T.PMREMGenerator(r), environment = new T.RoomEnvironment();
        try { this.environmentTarget = pmrem.fromScene(environment, .04); scene.environment = this.environmentTarget.texture; } finally { const resources = new Set(); environment.traverse(o=>{if(o.geometry) resources.add(o.geometry); if(o.material) resources.add(o.material);}); resources.forEach(r=>r.dispose()); pmrem.dispose(); }
        this.camera = new T.PerspectiveCamera(34, 1, .1, 150);
        const lights = kit().addStudioLights(scene, this.quality);
        lights.key.position.set(4.3, 7, -3); lights.key.intensity = 1.65;
        lights.hemi.intensity = .24; lights.fill.intensity = .16;
        lights.fill.color.setHex(0xffc180).convertSRGBToLinear();
        lights.fill.position.set(4.6, 2.8, 0);
        this.roomLights = lights;
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
    ownMaterial(name, color, rough = .8, metal = 0, extra = {}) {
      const key = `detective:${this.uid}:${name}`; this.ownedKeys.add(key);
      const material=kit().material(key, color, rough, metal, { envMapIntensity: .18, ...extra });
      (this.roomMaterials ||= new Set()).add(material); return material;
    }
    mat(color, rough = .8) {
      if ([0x8a5a2b, 0x6e4520, 0x7a5129, 0x8a4f2b].includes(color)) return kit().MAT.woodDark;
      if ([0xa0703e, 0xc08850, 0xb07a45, 0x9c6b43, 0xb98352, 0xc98b55].includes(color)) return kit().MAT.wood;
      if ([0xffffff, 0xfffbf0, 0xfffdf2, 0xfff3c4].includes(color)) return kit().MAT.paper;
      return kit().MAT.plastic(color);
    }
    setMarkerMode(mode) { this.markerMode = mode === 'high' ? 'high' : 'standard'; saveSetting('dt-marker-mode', this.markerMode); this.markerKey = null; this.layoutMarkers(); this.scheduleOcclusion(); }
    setFixedView(fixed) { this.fixedView = !!fixed; saveSetting('dt-fixed-view', String(this.fixedView)); }
    effectiveMarkerMode() { return this.is3d ? this.markerMode : 'high'; }
    scheduleOcclusion() {
      clearTimeout(this.occlusionTimer);
      this.occlusionTimer = setTimeout(() => this.updateOcclusion(), 180);
    }
    updateOcclusion() {
      if (this.disposed || document.hidden) return;
      const T = window.THREE;
      this.group?.updateMatrixWorld(true);
      const blockers = []; this.group?.traverse?.(o => {
        if(!o.isMesh || !o.visible || o.userData.id || o.userData.markerGlow || o.material.transparent)return;
        for(let p=o.parent;p;p=p.parent)if(!p.visible)return; blockers.push(o);
      });
      for (const it of this.items) {
        let blocked = false;
        if (this.is3d && this.effectiveMarkerMode() === 'standard' && !hasClass(it.btn, 'dt-target')) {
          const point = new T.Vector3(...it.pos).applyMatrix4(this.group.matrixWorld), delta = point.clone().sub(this.camera.position);
          this.raycaster.set(this.camera.position, delta.clone().normalize());
          blocked = this.raycaster.intersectObjects(blockers, false).some(hit => hit.distance < delta.length() - .7);
        }
        it.btn.classList.toggle('dt-occluded', blocked);
      }
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
      const T = window.THREE; const m = new T.Mesh(kit().roundedBox(w, h, d, Math.min(.06, w/3, h/3, d/3), 2), this.mat(color));
      m.position.set(x, y, z); m.castShadow = Math.min(w, h, d) > .035; m.receiveShadow = true; (parent || this.group).add(m); return m;
    }
    cyl(rt, rb, h, color, x, y, z, parent, seg = 20) {
      const T = window.THREE; const m = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), this.mat(color));
      m.position.set(x, y, z); m.castShadow = rt > .08; (parent || this.group).add(m); return m;
    }
    buildRoom(T) {
      const th = this.theme; const g = this.group;
      // 地板、兩面牆（剖面娃娃屋視角）、踢腳板、窗戶
      this.box(12.6, .38, 9.6, 0x6e4520, 0, -.38, 0);
      for (let i = 0; i < 18; i++) { const plank = this.box(.65, .16, 9, th.floor, -5.67+i*.665, -.08, 0); plank.material = this.ownMaterial('floor',th.floor,.85,0,{map:kit().MAT.wood.map}); }
      // 真正留下窗洞；牆厚與洞口切面均為米白色。
      for (const [w,h,x,y] of [[12.25,2.1,0,1.05],[12.25,1.1,0,4.45],[9.225,1.8,-1.5125,3],[.625,1.8,5.8125,3]]) this.box(w,h,.25,0xfffbf0,x,y,-4.62);
      this.box(.25, 5, 9.25, 0xfffbf0, -6.12, 2.5, 0);
      this.box(12, 1.35, .06, th.wall2, 0, .7, -4.45);
      this.box(.06, 1.35, 9, th.wall2, -5.95, .7, 0);
      const wallTex = this.wallPattern(T);
      // 平面 UV 依世界座標鋪排；薄壁紙與米白切面分開，避免被牆殼吃掉或條紋拉伸。
      const wallMat = this.ownMaterial('wallpaper', 0xffffff, 1, 0, {map:wallTex});
      this.wallSurfaces = [];
      const surface = (w,h,x,y,z,left=false) => {
        const geo = new T.PlaneGeometry(w,h), uv=geo.attributes.uv, pos=geo.attributes.position;
        for(let i=0;i<uv.count;i++) uv.setXY(i,(pos.getX(i)+(left ? -z : x))/2,(pos.getY(i)+y)/2);
        const mesh = new T.Mesh(geo,wallMat); mesh.position.set(x,y,z); if(left) mesh.rotation.y=Math.PI/2;
        mesh.receiveShadow=true; g.add(mesh); this.wallSurfaces.push(mesh);
      };
      for (const [w,h,x,y] of [[12,.68,0,1.76],[12,1.02,0,4.41],[9.1,1.8,-1.45,3],[.5,1.8,5.75,3]]) surface(w,h,x,y,-4.42);
      surface(9,3.5,-5.93,3.17,0,true);
      for (let x=-5.8;x<6;x+=.8) this.box(.035,1.2,.05,th.accent,x,.68,-4.39);
      for (let z=-4.2;z<4.5;z+=.8) this.box(.05,1.2,.035,th.accent,-5.89,.68,z);
      for (const y of [.15,1.4]) { this.box(12,.12,.12,0x8a5a2b,0,y,-4.36); this.box(.12,.12,9,0x8a5a2b,-5.86,y,0); }
      const win = this.box(2.2, 1.6, 0.06, 0xbfe3ff, 4.3, 3.0, -4.48); win.material = this.ownMaterial('window',0xbfe3ff,.42); win.material.emissive = new T.Color(0x8fcfff).convertSRGBToLinear(); win.material.emissiveIntensity = 0.35;
      this.box(2.4, 0.12, 0.2, 0xffffff, 4.3, 2.15, -4.42);
      [3.16, 4.3, 5.44].forEach(x => this.box(.08, 1.8, .14, 0xffffff, x, 3, -4.36));
      [2.12, 3.88].forEach(y => this.box(2.4, .1, .18, 0xffffff, 4.3, y, -4.36));
      const beam = new T.Mesh(new T.PlaneGeometry(2.2, 6), this.ownMaterial('beam', 0xfff1c4, 1, 0, { emissive: new T.Color(0xfff1c4).convertSRGBToLinear(), transparent: true, opacity: .09, depthWrite: false, side: T.DoubleSide, blending:T.AdditiveBlending }));
      const soft = document.createElement('canvas'); soft.width=64; soft.height=128;
      const bc=soft.getContext('2d'), fade=bc.createLinearGradient(0,0,64,0); fade.addColorStop(0,'#000'); fade.addColorStop(.3,'#fff'); fade.addColorStop(.7,'#fff'); fade.addColorStop(1,'#000'); bc.fillStyle=fade;bc.fillRect(0,0,64,128); beam.material.alphaMap=new T.CanvasTexture(soft); this.ownedTextures.add(beam.material.alphaMap);
      beam.position.set(4.0, 1.6, -2.2); beam.rotation.set(-1.0, 0.15, 0); g.add(beam);
      const plate = document.createElement('canvas'); plate.width = 512; plate.height = 128; const pc = plate.getContext('2d');
      pc.fillStyle = '#7a3e1d'; pc.fillRect(0, 0, 512, 128); pc.fillStyle = '#ffe9b0'; pc.fillRect(8, 8, 496, 112);
      pc.fillStyle = '#5a2e12'; pc.font = '900 64px "PingFang TC","Microsoft JhengHei","Noto Sans TC",sans-serif'; pc.textAlign = 'center'; pc.textBaseline = 'middle'; pc.fillText('🔍 ' + th.name, 256, 66);
      const tex = new T.CanvasTexture(plate); this.ownedTextures.add(tex); tex.encoding = T.sRGBEncoding;
      const sign = new T.Mesh(new T.PlaneGeometry(2.4, 0.6), this.ownMaterial('sign', 0xffffff, 1, 0, { map: tex })); sign.position.set(-1.6, 3.75, -4.37); g.add(sign);
      const rug = this.cyl(2.6, 2.6, 0.04, th.rug, 0.5, 0.02, 1.8, g, 40); rug.scale.z = 0.62; rug.receiveShadow = true; rug.material=this.ownMaterial('rug',th.rug,1); rug.castShadow = false;
      for (const [x,z,size] of [[-4,-4,3],[-1.9,.9,3],[3.6,-3.6,2.2],[2.2,1.4,2.4],[5,3.1,1.4],[-5.5,.6,2.3],[-5.1,-3.1,2],[4.6,-1,1.3],[3.4,3.7,1.8],[-.3,-3.8,1.2]]) { const shadow=kit().blobShadow(size,.23); shadow.position.set(x,.012,z); g.add(shadow); }
      for (let i=0;i<19;i++) {
        const x=-1.8+i*.25;
        this.box(.025,.012,2.7,0xfffbf0,x,.05,1.8);
        for (const z of [.25,3.35]) this.box(.04,.02,.24,0xfffbf0,x,.03,z);
      }
      for (const z of [.5,3.1]) this.box(3.8,.015,.04,0xfffbf0,.5,.06,z);
      // 近鏡頭葉片建立景深，位置由投影碰撞檢查決定。
      this.buildForeground(T);
      // 書架
      this.box(2.4, 3.4, 0.08, 0x8a5a2b, -4.0, 1.7, -4.42);
      [-5.15, -2.85].forEach(x => this.box(.1, 3.4, .7, 0x8a5a2b, x, 1.7, -4.1));
      [0.6, 1.5, 2.4, 3.2].forEach((y) => this.box(2.3, 0.08, 0.65, 0x6e4520, -4.0, y, -4.1));
      const bookC = [0xe05a4f, 0xf0a030, 0x3fa45b, 0x3b82c4, 0x8b5cc8, 0xd1559a];
      bookC.forEach((color,c)=>{
        const books=[]; [0.95,1.85,2.75].forEach((y,r)=>{for(let i=0;i<9;i++) if((i+r)%6===c) books.push([-5+i*.24,y+.06,.55+((i+r)%3)*.08]);});
        const batch=new T.InstancedMesh(kit().roundedBox(1,1,1,.08,1),this.mat(color),books.length), dummy=new T.Object3D();
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
      for(let row=0;row<3;row++) for(let i=0;i<8;i++) this.cyl(.035,.04,.05,0xf6efe2,-.35+i*.1,.25,.03+row*.1,tw,8).userData.typewriterKey=true;
      const roller=this.cyl(.09,.09,1.15,0x202931,0,.35,-.22,tw); roller.rotation.z=Math.PI/2;
      const paperRoll=this.cyl(.06,.06,.9,0xfffbf0,0,.6,-.2,tw); paperRoll.rotation.z=Math.PI/2;
      this.box(.5,.04,.06,0xf6efe2,0,.25,.35,tw);
      // 布告欄
      this.box(2.4, 1.5, 0.08, 0xc9955c, -1.6, 2.5, -4.46); this.box(2.2, 1.3, 0.04, 0xead2a8, -1.6, 2.5, -4.41);
      this.boardCards = [];
      [[-2.3, 2.7], [-1.6, 2.35], [-0.9, 2.75]].forEach(([x, y], i) => { const card=this.box(.55,.48,.025,0xffffff,x,y,-4.29); this.boardCards.push(card); this.cyl(.055,.055,.05,bookC[i],0,.18,.035,card,8).rotation.x=Math.PI/2; for(let j=0;j<3;j++) this.box(.33-j*.04,.015,.008,0x787269,0,.07-j*.075,.02,card); });
      // 保險箱（門可開）
      const safe = new T.Group(); safe.position.set(3.6, 0, -3.6); g.add(safe);
      this.box(1.4, 1.5, .1, 0x303a46, 0, .75, -.55, safe);
      [-.66,.66].forEach(x=>this.box(.08,1.5,1.2,0x5b6573,x,.75,0,safe));
      [.05,1.45].forEach(y=>this.box(1.4,.1,1.2,0x5b6573,0,y,0,safe));
      const sdoor = new T.Group(); sdoor.position.set(-0.65, 0.75, 0.61); safe.add(sdoor);
      this.box(1.25, 1.3, 0.08, 0x6f7a89, 0.62, 0, 0, sdoor);
      const dial = this.cyl(0.22, 0.22, 0.08, 0xf6d16a, 0.62, 0.1, 0.06, sdoor, 24); dial.rotation.x = Math.PI / 2; this.safeDial = dial;
      // 保留既有 pivot 的 -1.3 終態，第二層鉸鏈補足實際 100° 開門角。
      this.safeDoorFace = new T.Group(); [...sdoor.children].forEach(child=>this.safeDoorFace.add(child)); sdoor.add(this.safeDoorFace);
      this.safeDoor = sdoor;
      // 鎖櫃（左牆）
      const cab = new T.Group(); cab.position.set(-5.5, 0, 0.6); g.add(cab);
      this.box(0.9, 2.4, 2.0, 0x9c6b43, 0, 1.2, 0, cab);
      this.cabDoors = [];
      for(let row=0;row<2;row++) for(let col=0;col<3;col++) {
        const pivot=new T.Group(); pivot.position.set(.49,.65+row*1.12,-.96+col*.64); cab.add(pivot);
        this.box(.08,1.03,.59,0x956840,0,0,.3,pivot); this.box(.12,.14,.06,0xf6d16a,.08,0,.52,pivot);
        this.box(.015,.16,.22,0xfffbf0,.05,.29,.3,pivot); this.cabDoors.push(pivot);
      }
      // 推理機（左後角，齒輪）
      const mach = new T.Group(); mach.position.set(-5.1, 0, -3.1); g.add(mach); this.mach = mach;
      this.box(1.1, 1.8, 1.0, 0x3b82c4, 0, 0.9, 0, mach);
      this.gears = [[1.35,.32,0xf0a030,-.22],[.85,.27,0xe05a4f,.22]].map(([y,r,c,z])=>{
        const gear=new T.Group(); gear.position.set(.61,y,z); mach.add(gear);
        const hub=this.cyl(r*.75,r*.75,.12,c,0,0,0,gear,16); hub.rotation.z=Math.PI/2;
        for(let i=0;i<12;i++) { const a=i*Math.PI/6, tooth=this.box(.13,.13,.14,c,0,Math.cos(a)*r,Math.sin(a)*r,gear); tooth.rotation.x=a; }
        const axle=this.cyl(.065,.065,.17,0x303a46,.03,0,0,gear); axle.rotation.z=Math.PI/2;
        return gear;
      });
      // 放大鏡桌
      const tbl = new T.Group(); tbl.position.set(2.2, 0, 1.4); g.add(tbl);
      this.cyl(0.9, 0.9, 0.1, 0xb07a45, 0, 0.9, 0, tbl, 28); this.cyl(0.12, 0.2, 0.9, 0x7a5129, 0, 0.45, 0, tbl, 12);
      this.evidenceCards=[this.box(.5,.02,.6,0xffffff,-.3,.96,.1,tbl),this.box(.5,.02,.6,0xfff3c4,.3,.96,-.1,tbl)]; this.evidenceCards[0].rotation.y=.3;this.evidenceCards[1].rotation.y=-.2;
      const lens = new T.Mesh(new T.TorusGeometry(.32, .055, 8, 24), this.mat(0x2b1d12)); lens.position.set(0.1, 1.05, 0.3); lens.rotation.x = Math.PI / 2; tbl.add(lens);
      const glassLens=new T.Mesh(new T.CircleGeometry(.29,24),this.ownMaterial('magnifier-glass',0xb9e3e9,.12,0,{transparent:true,opacity:.4,side:T.DoubleSide,depthWrite:false})); lens.add(glassLens);
      const handle=this.box(.13,.52,.1,0x352b23,0,-.53,0,lens);
      handle.rotation.z=-.12;
      // 門（可開）
      const door = new T.Group(); door.position.set(0.55, 0, -4.45); g.add(door); this.door = door;
      this.box(1.7, 3.1, 0.12, th.accent, 0, 1.55, -0.02).position.set(1.3, 1.55, -4.52);
      this.box(1.5, 2.9, 0.1, 0xc98b55, 0.75, 1.45, 0.02, door);
      this.cyl(0.07, 0.07, 0.12, 0xf6d16a, 1.3, 1.4, 0.1, door, 10).rotation.x = Math.PI / 2;
      for(const x of [.45,2.15]) this.box(.18,3.25,.25,0x593a25,x,1.63,-4.28);
      this.box(1.9,.22,.26,0x593a25,1.3,3.22,-4.28);
      this.box(.28,.07,.1,0xf6d16a,1.19,1.4,.18,door);
      for(const y of [.75,2.15]) this.box(1.13,.88,.035,0x8e613e,.75,y,.085,door);
      // 小擺設：盆栽、檯燈、地球儀、皮箱、相框
      this.cyl(0.35, 0.25, 0.6, 0xc0583a, 5.0, 0.3, 3.1);
      for (let i = 0; i < 5; i++) { const leaf = new T.Mesh(new T.SphereGeometry(.32, 8, 6), this.mat(i % 2 ? 0x397b42 : 0x55934a)); leaf.scale.set(.45, 1.7, .22); leaf.position.set(5 + Math.sin(i * 2.4) * .24, .85 + i * .08, 3.1 + Math.cos(i * 2.4) * .24); leaf.rotation.z = (i - 2) * .38; g.add(leaf); }
      this.cyl(0.5, 0.5, 0.06, 0x7a5129, 4.6, 0.03, -1.0); this.cyl(0.05, 0.05, 1.3, 0x2b1d12, 4.6, 0.7, -1.0, g, 8);
      const shade = this.cyl(0.2, 0.45, 0.45, 0xffe08a, 4.6, 1.45, -1.0); shade.material = this.ownMaterial('lamp',0xffe08a,.42); shade.material.emissive = new T.Color(0xffd36a).convertSRGBToLinear(); shade.material.emissiveIntensity = 0.4;
      if (this.quality === 'high') { const lamp = new T.PointLight(new T.Color(0xffd9a0).convertSRGBToLinear(), .5, 4); lamp.position.set(4.6,1.3,-1); g.add(lamp); }
      this.box(0.9, 0.9, 0.7, 0x6e4520, -0.3, 0.45, -3.8); const globe = new T.Mesh(new T.SphereGeometry(0.32, 20, 14), this.mat(0x3b82c4, 0.5)); globe.position.set(-0.3, 1.25, -3.8); globe.castShadow = true; g.add(globe); this.globe = globe;
      this.box(1.2, 0.7, 0.8, 0x8a4f2b, 3.4, 0.35, 3.7); this.box(1.22, 0.08, 0.82, 0xf6d16a, 3.4, 0.55, 3.7);
      this.box(0.06, 1.0, 1.3, 0xa0703e, -5.98, 2.5, 2.6); this.box(0.04, 0.8, 1.1, 0xbfe3ff, -5.94, 2.5, 2.6);
      [2.08,3.12].forEach(z=>this.box(.07,.85,.06,0xf6d16a,-5.9,2.5,z));
      [2.08,2.92].forEach(y=>this.box(.07,.06,1.1,0xf6d16a,-5.9,y,2.6));
      this.book = this.box(.3,.65,.5,0xc0362c,-4,2.7,-3.75);
      this.bookCover = this.box(.03,.65,.5,0x8a4f2b,-.16,0,0,this.book);
      this.photoFrame = new T.Group(); this.photoFrame.position.set(-5.88,2.5,2.08); g.add(this.photoFrame);
      this.box(.07,1,1.3,0xa0703e,0,0,.65,this.photoFrame); this.box(.08,.78,1.08,0x7aa38f,.03,0,.65,this.photoFrame);
      this.lens = lens; lens.material=this.ownMaterial('lens',0x2b1d12,.32,0,{emissive:new T.Color(0xffe09a).convertSRGBToLinear(),emissiveIntensity:0});
      this.lock = new T.Group(); this.lock.position.set(.54,1.4,0); cab.add(this.lock);
      this.box(.12,.26,.24,0xf6d16a,0,0,0,this.lock);
      this.shackle = new T.Mesh(new T.TorusGeometry(.13,.035,8,16),this.mat(0x2b1d12)); this.shackle.position.y=.18; this.lock.add(this.shackle);
      this.leaves = g.children.filter(o=>o.geometry?.type==='SphereGeometry' && o.position.x>4.5);
      this.typeKeys = tw.children.filter(o=>o.userData.typewriterKey);
      this.buildTheme(T);
      // PMREM 仍提供金屬反射，室內霧面物件不再被環境光洗白；不更改 kit 共用材質。
      const localMaterials=new Map();
      g.traverse(o=>{ if(!o.isMesh || !o.material || o.userData.ownedMaterial || this.roomMaterials?.has(o.material)) return;
        const source=o.material; if(!localMaterials.has(source)) { const m=source.clone(); m.envMapIntensity=.16; localMaterials.set(source,m); }
        o.material=localMaterials.get(source); o.userData.ownedMaterial=true;
      });
      // 每個互動點：看不見的點擊盒＋發光圈
      for (const it of this.items) {
        const hit = new T.Mesh(kit().roundedBox(1.3,1.3,1.3,.06,1), this.ownMaterial('hit', 0xffffff, 1, 0, {visible:false}));
        hit.position.set(...it.pos); hit.userData.id = it.id; g.add(hit);
        const ring = new T.Mesh(new T.TorusGeometry(0.55, 0.06, 8, 32), this.ownMaterial('ring:'+it.id, 0xffc94d));
        ring.userData.markerGlow = true; ring.position.set(it.pos[0], Math.max(0.08, it.pos[1] - 0.6), it.pos[2]); ring.rotation.x = Math.PI / 2; ring.visible = false; g.add(ring);
        hit.userData.glow = ring; this.meshes.set(it.id, hit);
        if (it.state) this.setState(it.id, it.state);
      }
    }
    wallPattern(T) {
      const canvas=document.createElement('canvas'); canvas.width=canvas.height=256;
      const c=canvas.getContext('2d'), hex=n=>'#'+n.toString(16).padStart(6,'0'), key=this.opts.theme;
      c.fillStyle=hex(this.theme.wall); c.fillRect(0,0,256,256);
      c.strokeStyle=hex(this.theme.wall2); c.lineWidth=2;
      if(key==='study') {
        for(let x=0;x<256;x+=16) { c.fillStyle='#122e25'; c.fillRect(x,0,3,256); c.fillStyle='#70826a'; c.fillRect(x+5,0,1,256); }
      } else if(key==='forest') {
        for(let y=0;y<256;y+=64) {
          c.fillStyle=y%128 ? '#ad7e50' : hex(this.theme.wall); c.fillRect(0,y,256,62);
          c.fillStyle=hex(this.theme.wall2); c.fillRect(0,y+62,256,2);
          c.strokeStyle='#80542f'; c.lineWidth=1;
          for(let j=8;j<60;j+=9) {c.beginPath();c.moveTo(0,y+j);c.bezierCurveTo(70,y+j-6,170,y+j+6,256,y+j);c.stroke();}
          for(const x of [10,246]) {c.fillStyle='#493423';c.fillRect(x,y+8,2,3);c.fillRect(x,y+50,2,3);}
        }
      } else if(key==='lab') {
        c.fillStyle='#fafcf9'; for(let y=0;y<256;y+=64) for(let x=0;x<256;x+=64) {c.fillRect(x+2,y+2,60,60); c.strokeRect(x+2,y+2,60,60);}
      } else if(key==='museum') {
        c.strokeStyle='#a25b69'; c.lineWidth=2;
        for(let x=0;x<=256;x+=64) for(let y=0;y<=256;y+=64) {
          c.beginPath();c.moveTo(x,y-28);c.bezierCurveTo(x+28,y-10,x+22,y+6,x,y+28);c.bezierCurveTo(x-22,y+6,x-28,y-10,x,y-28);c.stroke();
          for(const side of [-1,1]) {c.beginPath();c.ellipse(x+side*9,y,5,12,side*.5,0,Math.PI*2);c.stroke();}
        }
      } else if(key==='library') {
        const colors=['#956a42','#6c7a63','#783b35','#b48c53','#455769'];
        for(let y=0;y<256;y+=64) {for(let x=4;x<256;x+=16) {const h=38+(x%3)*6;c.fillStyle=colors[(x/16|0)%5];c.fillRect(x,y+58-h,12,h);c.fillStyle='#d0ac74';c.fillRect(x+2,y+52-h,8,2);c.fillRect(x+2,y+50,8,2);}c.fillStyle='#241912';c.fillRect(0,y+58,256,6);}
      } else {
        c.fillStyle='#b5d0b6';c.fillRect(0,250,256,6);
        c.fillStyle='#d5e6d2'; for(let x=0;x<256;x+=32)c.fillRect(x,0,1,250);
      }
      const tex=new T.CanvasTexture(canvas);tex.encoding=T.sRGBEncoding;tex.wrapS=tex.wrapT=T.RepeatWrapping;this.ownedTextures.add(tex);return tex;
    }
    buildForeground(T) {
      // 裝飾植物放在近鏡頭的畫框外緣，只露出葉片；不參與房間 fit。
      this.foreground=new T.Group(); this.foreground.name='foreground-fronds'; this.group.add(this.foreground);
      for(let i=0;i<5;i++) {
        const leaf=new T.Mesh(new T.SphereGeometry(.3,10,6),this.mat(i%2 ? 0x294631 : 0x3a5d3b));
        leaf.scale.set(.4,2.1,.12);leaf.position.set(-.12-i*.12,.1+i*.18,0);leaf.rotation.z=-.4-i*.18;this.foreground.add(leaf);
      }
    }
    buildTheme(T) {
      const key = this.opts.theme; this.themeProps=[];
      const prop=(name,x,y,z)=>{const g=new T.Group();g.name=name;g.position.set(x,y,z);this.group.add(g);this.themeProps.push(g);return g;};
      const shadow=(x,z,size)=>{const m=kit().blobShadow(size,.32);m.position.set(x,.015,z);this.group.add(m);};
      const sphere=(r,color,x,y,z,g)=>{const m=new T.Mesh(new T.SphereGeometry(r,16,10),this.mat(color));m.position.set(x,y,z);g.add(m);return m;};
      const book=(g,x,y,z,c)=>{this.box(.5,.09,.65,c,x,y,z,g);this.box(.44,.05,.58,0xfffbf0,x,y+.05,z,g);};
      const bench=(g,w,d,color)=>{this.box(w,.14,d,color,0,1.1,0,g);for(const x of [-w/2+.15,w/2-.15]) for(const z of [-d/2+.12,d/2-.12])this.box(.12,1.05,.12,0x434d50,x,.53,z,g);};
      if(key==='study') {
        const chair=prop('armchair',-3.9,0,2.5);
        this.box(1.5,.4,1.4,0x704239,0,.65,0,chair);this.box(1.5,1.35,.3,0x704239,0,1.1,-.57,chair);
        for(const x of [-.68,.68]) {this.box(.28,.65,1.5,0x8c5145,x,1,0,chair);for(const z of [-.5,.5])this.box(.12,.5,.12,0x593a25,x,.25,z,chair);}shadow(-3.9,2.5,2.3);
        const globeStand=prop('globe-meridian',-.3,1.25,-3.8);
        const ring=new T.Mesh(new T.TorusGeometry(.43,.025,8,32),kit().MAT.gold);ring.rotation.z=-.3;globeStand.add(ring);
        this.globe.scale.setScalar(1.18);for(let i=0;i<5;i++){const a=i*1.7;const land=sphere(.13,0x689364,Math.cos(a)*.29,Math.sin(a)*.21,.22,globeStand);land.scale.set(1,.65,.3);}
        this.cyl(.24,.3,.09,0x593a25,0,-.3,0,globeStand);
        const writing=prop('letter-and-ink',-2.65,1.04,1.15);this.box(.5,.02,.42,0xfffbf0,0,0,0,writing);this.cyl(.09,.1,.18,0x202931,.3,.09,0,writing);this.box(.025,.48,.025,0xe4c996,.3,.35,0,writing).rotation.z=-.25;
      }
      if(key==='classroom') {
        const blackboard=prop('chalkboard',-5.85,3.6,-.4); blackboard.rotation.y=Math.PI/2;
        this.box(4.8,1.9,.16,0x805633,0,0,0,blackboard);
        const canvas=document.createElement('canvas');canvas.width=512;canvas.height=192;const c=canvas.getContext('2d');c.fillStyle='#193c32';c.fillRect(0,0,512,192);c.strokeStyle='#cad8bc';c.lineWidth=3;
        for(let row=0;row<3;row++) for(let col=0;col<6;col++){const x=32+col*48,y=35+row*48;c.beginPath();c.moveTo(x,y);c.lineTo(x+23,y+2);c.moveTo(x+12,y-10);c.lineTo(x+11,y+14);c.moveTo(x,y+17);c.lineTo(x+24,y+15);c.stroke();}
        c.strokeRect(357,30,116,110);const tex=new T.CanvasTexture(canvas);tex.encoding=T.sRGBEncoding;this.ownedTextures.add(tex);
        this.box(4.55,1.65,.025,0xffffff,0,0,.1,blackboard).material=this.ownMaterial('chalkboard',0xffffff,1,0,{map:tex});this.box(4.8,.1,.3,0x805633,0,-.93,.12,blackboard);
        for(const x of [.1,2.1]) {const desk=prop('school-desk-chair',x,0,-.6);bench(desk,1.3,.85,0xb48b52);this.box(.7,.12,.65,0xb48b52,0,.55,.85,desk);this.box(.7,.65,.1,0xb48b52,0,.92,1.12,desk);for(const dx of [-.28,.28])for(const z of [.6,1.1])this.box(.07,.52,.07,0x434d50,dx,.26,z,desk);book(desk,0,1.2,0,0x375f77);shadow(x,-.2,2);}
        const lectern=prop('lectern',-2.2,0,-2.35);this.box(1.6,1.25,.85,0x976139,0,.63,0,lectern);this.box(1.8,.12,1,0xb48b52,0,1.3,0,lectern);shadow(-2.2,-2.35,2);
      }
      if(key==='library') {
        const shelves=prop('full-wall-bookshelves',-5.72,0,0);shelves.rotation.y=Math.PI/2;
        for(const x of [-4.35,-1.45,1.45,4.35])this.box(.12,4.9,.35,0x493025,x,2.45,-.02,shelves);
        for(const y of [3.2,3.95,4.75])this.box(8.8,.1,.45,0x493025,0,y,0,shelves);
        for(let i=0;i<34;i++)this.box(.18,.55+(i%3)*.06,.28,[0x926b49,0x527060,0x833e38][i%3],-4.2+i*.25,4.32,.05,shelves);
        const cart=prop('book-cart',.2,0,-.8);for(const y of [.32,1.05])this.box(1.6,.1,.85,0x4c625d,0,y,0,cart);for(const x of [-.72,.72]){this.box(.08,1.4,.08,0x4c625d,x,.75,-.35,cart);for(const z of [-.3,.3])this.cyl(.14,.14,.12,0x262b2b,x,.16,z,cart).rotation.z=Math.PI/2;}for(let i=0;i<6;i++)this.box(.18,.6,.6,[0x9b4239,0x476674,0xb58a4e][i%3],-.6+i*.23,1.4,0,cart);shadow(.2,-.8,2.2);
        const stack=prop('reading-stack',-3.7,0,2.5);this.box(1,.55,1,0x5b3e2c,0,.28,0,stack);for(let i=0;i<4;i++)book(stack,0,.65+i*.12,0,[0x476674,0x9b4239][i%2]);shadow(-3.7,2.5,1.5);
      }
      if(key==='forest') {
        this.globe.visible=false;
        const basket=prop('pinecone-basket',-.3,.94,-3.8);this.cyl(.5,.38,.35,0x9a7242,0,.18,0,basket);
        for(let j=0;j<4;j++){const rim=new T.Mesh(new T.TorusGeometry(.4+j*.025,.025,6,24),this.mat(0x674522));rim.rotation.x=Math.PI/2;rim.position.y=.05+j*.09;basket.add(rim);}
        for(let i=0;i<5;i++){const cone=new T.Mesh(new T.ConeGeometry(.13,.35,8),this.mat(0x513522));cone.position.set(Math.sin(i*2.4)*.28,.46,Math.cos(i*2.4)*.28);basket.add(cone);for(let j=0;j<3;j++)this.cyl(.12-j*.02,.14-j*.02,.06,0x76502f,cone.position.x,.35+j*.09,cone.position.z,basket,8);}
        const lantern=prop('hanging-lantern',-5.35,3.1,-1.4);this.box(.07,.65,.07,0x302a22,0,.85,0,lantern);this.box(.55,.08,.55,0x302a22,0,.5,0,lantern);this.box(.55,.08,.55,0x302a22,0,-.2,0,lantern);for(const x of [-.22,.22])for(const z of [-.22,.22])this.box(.04,.7,.04,0x302a22,x,.15,z,lantern);this.cyl(.16,.2,.5,0xffcf70,0,.14,0,lantern).material=this.ownMaterial('lantern-flame',0xffcf70,.5,0,{emissive:new T.Color(0xffb647).convertSRGBToLinear(),emissiveIntensity:.8});this.box(.8,.1,.12,0x493423,-.3,1.2,0,lantern);
        const stump=prop('stump-stool',-.1,0,-.6);this.cyl(.58,.7,.8,0x704629,0,.4,0,stump,16);this.cyl(.57,.57,.035,0xc29964,0,.82,0,stump,24);for(let i=1;i<5;i++){const ring=new T.Mesh(new T.TorusGeometry(i*.1,.008,4,32),this.mat(0x805733));ring.rotation.x=Math.PI/2;ring.position.y=.845;stump.add(ring);}shadow(-.1,-.6,1.7);
      }
      if(key==='lab') {
        const table=prop('lab-bench',.4,0,-1.5);bench(table,3.1,1.3,0xc1d3d4);this.box(2.8,.18,.1,0x3f6267,0,.97,.62,table);shadow(.4,-1.5,3.6);
        const rack=prop('beaker-rack',-.4,1.18,-1.5);for(const y of [.06,.45])this.box(1.2,.08,.5,0x587a7d,0,y,0,rack);for(const x of [-.53,.53])this.box(.06,.48,.06,0x587a7d,x,.24,0,rack);for(let i=0;i<3;i++){this.cyl(.13,.13,.55,0xc2e3e5,-.38+i*.38,.35,0,rack);this.cyl(.135,.135,.22,[0x57aa8a,0x986bb4,0x5898bb][i],-.38+i*.38,.2,0,rack);}
        const scope=prop('microscope',1.25,1.18,-1.5);this.box(.65,.1,.5,0x2e4045,0,.05,0,scope);this.box(.12,.7,.14,0xe0e6df,-.2,.4,-.12,scope).rotation.z=-.25;this.box(.5,.06,.4,0x2e4045,0,.4,.02,scope);const tube=this.cyl(.1,.13,.55,0xe0e6df,.03,.82,0,scope);tube.rotation.z=-.4;this.cyl(.14,.14,.08,0x2e4045,.14,1.09,0,scope);this.cyl(.12,.12,.16,0x2e4045,-.25,.55,.06,scope).rotation.x=Math.PI/2;
      }
      if(key==='museum') {
        const exhibit=prop('glass-statue-case',.1,0,-.9);this.box(1.3,.95,1.3,0xd3c6b0,0,.48,0,exhibit);this.box(1.5,.09,1.5,0x68472e,0,1,0,exhibit);this.cyl(.25,.32,.15,0xd6b778,0,1.12,0,exhibit);this.cyl(.18,.3,.55,0xd6b778,0,1.45,0,exhibit);sphere(.22,0xd6b778,0,1.92,0,exhibit);this.box(.65,.15,.26,0xd6b778,0,1.65,0,exhibit);this.box(1.25,1.3,1.25,0xbfe3ff,0,1.7,0,exhibit).material=this.ownMaterial('display-glass',0xc5e4e9,.12,0,{transparent:true,opacity:.14,depthWrite:false});for(const x of [-.63,.63])for(const z of [-.63,.63])this.box(.025,1.3,.025,0xb6a17c,x,1.7,z,exhibit);shadow(.1,-.9,2);
        const cordon=prop('red-rope-stanchions',.1,0,.25);for(const x of [-1.1,1.1]){this.cyl(.27,.3,.08,0xc8a359,x,.05,0,cordon);this.cyl(.045,.06,.9,0xc8a359,x,.5,0,cordon);sphere(.1,0xc8a359,x,.98,0,cordon);}const curve=new T.CatmullRomCurve3([new T.Vector3(-1.1,.9,0),new T.Vector3(0,.66,0),new T.Vector3(1.1,.9,0)]);cordon.add(new T.Mesh(new T.TubeGeometry(curve,16,.055,8,false),this.mat(0x9b273b)));
        const paintings=prop('gilded-gallery',-5.8,3.7,-.4);paintings.rotation.y=Math.PI/2;
        for(const x of [-1.2,1.2]){this.box(1.8,1.6,.12,0xb58a3f,x,0,0,paintings);this.box(1.55,1.35,.04,0x382c35,x,0,.09,paintings);this.cyl(.3,.3,.04,0x8b795d,x,.04,.14,paintings).rotation.x=Math.PI/2;this.box(.48,.5,.03,0x735744,x,-.37,.14,paintings);}
      }
      const light = new T.Mesh(new T.PlaneGeometry(1.5,4),this.ownMaterial('exit',0xffefbd,1,0,{emissive:new T.Color(0xffefbd).convertSRGBToLinear(),transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide})); light.rotation.x=-Math.PI/2; light.position.set(1.3,.045,-2.3); this.group.add(light); this.exitLight=light;
    }
    applyVisualState(snapshot) {
      if (snapshot) this.snapshot = snapshot;
      if (!this.group || !this.snapshot) return;
      const done = new Set(this.snapshot.done), found = new Set(this.snapshot.found);
      if(this.safeDoor) this.safeDoor.rotation.y = done.has('dial') ? -1.3 : 0;
      if(this.safeDoorFace) this.safeDoorFace.rotation.y = done.has('dial') ? -(Math.PI*100/180-1.3) : 0;
      const drawerItem=this.items.find(it=>it.kind==='holder' && it.idx===1);
      if(this.drawer) this.drawer.position.z=.15+(found.has(drawerItem?.id) ? .35 : 0);
      this.boardCards?.forEach((card,i)=>{ card.rotation.z=done.has('sort') ? 0 : (i-1)*.15; card.position.y=done.has('sort') ? 2.5 : [2.7,2.35,2.75][i]; });
      this.gears?.forEach((gear,i)=>{ gear.rotation.x=done.has('cause') ? (i?-1:1)*8 : 0; });
      this.cabDoors?.forEach((door,i)=>{door.rotation.y=done.has('keys') ? (i?1:-1)*.65 : 0;});
      if(this.typePaper) {this.typePaper.position.y=done.has('blocks') ? .62 : .42;this.typePaper.scale.y=done.has('blocks') ? 1.6 : 1;}
      this.evidenceCards?.forEach((card,i)=>{card.rotation.y=done.has('compare') ? 0 : (i?-.2:.3);});
      this.items.filter(it=>it.kind==='holder' && found.has(it.id)).forEach(it=>this.holderPose(it.idx,1));
      if(this.lock) { this.lock.position.y=done.has('keys') ? .4 : 1.4; this.shackle.position.y=done.has('keys') ? .4 : .18; }
      if(this.door) this.door.rotation.y=this.snapshot.escaped ? -1.5 : 0;
      if(this.exitLight) this.exitLight.material.opacity=this.snapshot.escaped ? .35 : 0;
      this.kick();
    }
    enter() {
      if (this.entered) return; this.entered = true;
      this.tween(500, k => { this.zoom = 1.08 - .08*k; this.place(); });
    }
    bindPointer() {
      const el = this.renderer.domElement, pointers = new Map(); let down, pinch;
      const distance = () => { const pts = [...pointers.values()]; return pts.length === 2 ? Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y) : 0; };
      el.addEventListener('pointerdown', e => {
        if (this.fixedView) return;
        this.finishTweens(); pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
        down = {x:e.clientX,y:e.clientY,yaw:this.yaw,pitch:this.pitch,moved:false};
        el.setPointerCapture(e.pointerId); if (pointers.size === 2) pinch = {distance:distance(),zoom:this.zoom};
      });
      el.addEventListener('pointermove', e => {
        if (!down || this.fixedView) return;
        pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
        const dx=e.clientX-down.x, dy=e.clientY-down.y;
        if (pinch && pointers.size === 2) { down.moved=true; this.zoom=pinch.zoom*pinch.distance/Math.max(1,distance()); }
        else if (Math.hypot(dx,dy)>6) { down.moved=true; this.yaw=down.yaw-dx/400; this.pitch=down.pitch+dy/900; }
        this.place(); this.kick();
      });
      el.addEventListener('pointerup', e => {
        const click=down && !down.moved && !pinch; pointers.delete(e.pointerId); down=null; pinch=null;
        if (!click) return;
        const rect=el.getBoundingClientRect(); this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
        this.raycaster.setFromCamera(this.pointer,this.camera);
        const hit=this.raycaster.intersectObjects([...this.meshes.values()])[0];
        if (hit) { this.focus(hit.object.userData.id); this.opts.onPick(hit.object.userData.id); }
      });
      for (const event of ['pointercancel','lostpointercapture']) el.addEventListener(event, e => { pointers.delete(e.pointerId); down=null; pinch=null; });
      el.addEventListener('wheel', e => { if (this.fixedView) return; e.preventDefault(); this.zoom*=Math.exp(e.deltaY*.001); this.place(); this.kick(); },{passive:false});
    }
    clampView() { this.yaw=Math.max(-.9,Math.min(.9,this.yaw)); this.pitch=Math.max(-.12,Math.min(.12,this.pitch)); this.zoom=Math.max(.72,Math.min(1.2,this.zoom)); }
    place() {
      if (!this.camera) return;
      this.clampView(); this.camera.clearViewOffset?.();
      const T=window.THREE, a=.92+this.yaw, target=new T.Vector3(0,.9,0);
      const direction=new T.Vector3(Math.sin(a),.5+this.pitch,Math.cos(a)).normalize();
      // 只量實際底座，不能把不存在的「前方屋頂角」也納入，否則整間會被縮小。
      const base=[]; for(const x of [-6.3,6.3]) for(const y of [-.57,-.19]) for(const z of [-4.8,4.8]) base.push(new T.Vector3(x,y,z));
      const silhouette=[...base,new T.Vector3(-6.25,5,-4.75),new T.Vector3(6.125,5,-4.75),new T.Vector3(-6.25,5,4.625)];
      let distance=23;
      for(let n=0;n<32;n++) {
        this.camera.position.copy(target).addScaledVector(direction,distance);this.camera.lookAt(target);this.camera.updateMatrixWorld(true);
        const points=base.map(p=>p.clone().project(this.camera));
        const span=Math.max(Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)),Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y)))/2;
        const all=silhouette.map(p=>p.clone().project(this.camera));
        const cy=(Math.max(...all.map(p=>p.y))+Math.min(...all.map(p=>p.y)))/2;
        target.y+=cy*distance*Math.tan(this.camera.fov*Math.PI/360)*.65;
        distance*=Math.max(.8,Math.min(1.2,span/.9));
        if(Math.abs(span-.9)<.0005 && Math.abs(cy)<.001)break;
      }
      this.camera.position.copy(target).addScaledVector(direction,Math.max(10,distance*this.zoom));
      this.camera.position.x=Math.max(-5.6,this.camera.position.x); this.camera.position.z=Math.max(-3.9,this.camera.position.z);
      this.camera.lookAt(target); this.camera.updateMatrixWorld(true);
      // 高牆的透視外緣偏右，平移畫框而不縮小底座，讓兩側切面都完整入鏡。
      const xs=silhouette.map(p=>p.clone().project(this.camera).x), cx=(Math.min(...xs)+Math.max(...xs))/2;
      const w=this.host.clientWidth,h=this.host.clientHeight;
      this.camera.setViewOffset?.(w,h,cx*w/2,0,w,h);
      this.markerKey=null; this.scheduleOcclusion();
    }
    focus(id) {
      const it=this.items.find(x=>x.id===id); if (!it || !this.is3d) return Promise.resolve();
      this.finishTweens(); const start={yaw:this.yaw,pitch:this.pitch,zoom:this.zoom};
      const yaw=Math.max(-.9,Math.min(.9,Math.atan2(it.pos[0]*.08,1)-.25));
      const ring=this.meshes.get(id)?.userData.glow, visible=ring?.visible;
      return new Promise(resolve=>this.tween(500,k=>{
        this.yaw=start.yaw+(yaw-start.yaw)*k; this.pitch=start.pitch*(1-k); this.zoom=start.zoom+(.84-start.zoom)*k; this.place();
        if (ring) { ring.visible=true; ring.scale.setScalar(1+.35*Math.sin(Math.PI*k)); if(k===1) ring.visible=visible; }
        if(k===1) resolve();
      }));
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
      (this.host.dataset ||= {}).markerMode = this.effectiveMarkerMode();
      if (this.camera) this.camera.updateMatrixWorld(true);
      if (this.group) this.group.updateMatrixWorld(true);
      const key = [w, h, this.yaw, this.is3d, this.markerMode, this.camera?.position.toArray(), document.body.className, ...this.items.map(it => it.state)].join('|');
      if (key === this.markerKey) return; this.markerKey = key;
      // 搜查階段標準難度的 holder 是 open，仍需指定一個可調查的下一步。
      const target = this.items.find(it => it.kind !== 'holder' && it.state === 'next') || this.items.find(it=>it.kind==='holder' && (it.state==='next' || it.state==='open'));
      this.items.forEach(it => { it.btn.classList.toggle('dt-target', it === target); it.btn.classList.remove('dt-dot'); if (it === target) it.btn.classList.remove('dt-occluded'); });
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
        if (!best && this.effectiveMarkerMode() === 'high') {
          // 高辨識模式優先找完整標籤的空位，保持圖示、編號、名稱。
          for(let cy=8;cy+bh<h-52 && !best;cy+=8) for(let cx=8;cx+bw<w-8;cx+=8) {
            if(!placed.some(r=>cx<r.x+r.w+8 && cx+bw+8>r.x && cy<r.y+r.h+8 && cy+bh+8>r.y)) { best={x:cx,y:cy,w:bw,h:bh}; break; }
          }
        }
        if (!best) { if (it !== target && this.is3d && this.effectiveMarkerMode() !== 'high') it.btn.classList.add('dt-dot'); best=it === target ? {x:Math.max(8,Math.min(w-bw-8,x-bw/2)),y:Math.max(8,Math.min(h-bh-52,y-bh/2)),w:bw,h:bh} : {x:Math.max(4,Math.min(w-24,x-10)),y:Math.max(4,Math.min(h-52,y-10)),w:20,h:20}; }
        placed.push(best); entry.rect=best;
      }
      // 比對真正的 48px 熱區、目標完整標籤和物件原始投影；前景不可蓋住任一者。
      this.markerRects=sizes.filter(e=>e.rect).map(({it,rect})=>{
        const dot=hasClass(it.btn, 'dt-dot'), pad=dot ? 14 : 0;
        return {x:rect.x-pad,y:rect.y-pad,w:dot ? 48 : rect.w,h:dot ? 48 : rect.h};
      });
      if(this.is3d && this.foreground) {
        const T=window.THREE, obstacles=[...this.markerRects];
        for(const it of this.items.filter(it=>it.state!=='hidden')) {const p=new T.Vector3(...it.pos).applyMatrix4(this.group.matrixWorld).project(this.camera);obstacles.push({x:(p.x+1)*w/2-24,y:(1-p.y)*h/2-24,w:48,h:48});}
        let visible=false;
        // 兩側都保留局部裁切；轉動後優先移到空的邊角，沒有空位才隱藏。
        for(const side of [1,-1]) {
          const near=new T.Vector3(side*1.02,-.87,.96).unproject(this.camera);
          this.foreground.position.copy(near);this.foreground.quaternion.copy(this.camera.quaternion);
          this.foreground.scale.set(side*.35,.35,.35);this.foreground.updateMatrixWorld(true);
          const box=new T.Box3().setFromObject(this.foreground),points=[];
          for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new T.Vector3(x,y,z).project(this.camera));
          const xs=points.map(p=>(p.x+1)*w/2),ys=points.map(p=>(1-p.y)*h/2);
          const r={x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
          visible=!obstacles.some(o=>o.x<r.x+r.w+8 && o.x+o.w>r.x-8 && o.y<r.y+r.h+8 && o.y+o.h>r.y-8);
          this.foregroundRect=r;
          if(visible)break;
        }
        this.foreground.visible=visible;this.kick();
      }
      this.scheduleOcclusion();
      sizes.forEach(({it,rect}) => { if(rect) { it.btn.style.left=rect.x+'px'; it.btn.style.top=rect.y+'px'; } });
    }

    tween(ms, fn) { if (this.disposed || !this.is3d || isCalm() || document.hidden) { fn(1); return; } if (!this.tweens.length) this.lastActiveFrame = null; this.tweens.push({ ms, fn }); this.kick(); }
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
      const bits = Array.from({ length: this.quality === 'light' ? 0 : 8 }, (_, k) => { const m = new T.Mesh(kit().roundedBox(.16,.03,.1,.01,1), this.mat(cols[k % cols.length])); m.userData.v = [(artRandom() - 0.5) * 5, 4 + artRandom() * 3, (artRandom() - 0.2) * 4]; this.group.add(m); return m; });
      this.tween(1500, (k) => { bits.forEach((m, i) => { const [vx, vy, vz] = m.userData.v; m.position.set(pos[0] + vx * k, pos[1] + vy * k - 6 * k * k, pos[2] + vz * k); m.rotation.set(k * 12 + i, k * 9, k * 6); }); if (k === 1) bits.forEach((m) => { this.group.remove(m); m.geometry.dispose(); }); });
    }
    holderPose(idx,k) {
      if(idx%8===0 && this.book) { this.book.position.z=-3.75+.2*k; this.bookCover.rotation.y=-1.2*k; }
      if(idx%8===1 && this.drawer) this.drawer.position.z=.15+.35*k;
      if(idx%8===2 && this.photoFrame) this.photoFrame.rotation.y=-1.1*k;
      if(idx%8===3) this.leaves?.forEach((leaf,i)=>leaf.rotation.z=(i-2)*.38+Math.sin(k*Math.PI*2)*.2);
    }
    animate(kind,id) {
      if (!this.is3d) return Promise.resolve();
      if (kind==='found') { this.paper(id); return Promise.resolve(); }
      this.finishTweens();
      return new Promise(resolve=>this.tween(700,k=>{
        if(kind==='search') { const it=this.items.find(x=>x.id===id); if(it) this.holderPose(it.idx,k); }
        if(kind==='dial') { this.safeDial.rotation.z=k*Math.PI*4; this.safeDoor.rotation.y=-1.3*Math.max(0,(k-.3)/.7); this.safeDoorFace.rotation.y=-(Math.PI*100/180-1.3)*Math.max(0,(k-.3)/.7); }
        if(kind==='keys') { this.shackle.position.y=.18+.22*Math.min(1,k*3); this.lock.position.y=1.4-Math.max(0,(k-.4)/.6); this.cabDoors.forEach((door,i)=>door.rotation.y=(i?1:-1)*.65*k); }
        if(kind==='blocks') { this.typeKeys.forEach((key,i)=>key.position.y=.25-.05*Math.max(0,Math.sin(Math.min(1,Math.max(0,k*2-i*.08))*Math.PI))); this.typePaper.position.y=.42+.2*k; this.typePaper.scale.y=1+.6*k; }
        if(kind==='compare') { this.lens.material.emissiveIntensity=.7*Math.sin(Math.PI*k); this.lens.position.y=1.05+.35*Math.sin(Math.PI*k); this.lens.rotation.z=Math.sin(Math.PI*k)*.4; this.evidenceCards.forEach(card=>card.rotation.y*=1-k); }
        if(kind==='cause') this.gears.forEach((gear,i)=>gear.rotation.x=(i?-1:1)*8*k);
        if(kind==='escape') { this.snapshot={...this.snapshot,escaped:true}; this.door.rotation.y=-1.5*k; this.exitLight.material.opacity=.35*k; }
        if(k===1) resolve();
      }));
    }

    teardown3d() {
      this.finishTweens(); this.is3d = false;
      cancelAnimationFrame(this.raf); this.raf = 0;
      this.meshes.clear(); clearTimeout(this.occlusionTimer);
      if (this.ro) this.ro.disconnect();
      this.environmentTarget?.dispose(); this.environmentTarget = null;
      if (this.renderer) {
        const resources = new Set();
        this.scene?.traverse(o => { if(o.geometry) resources.add(o.geometry); if(o.userData.ownedMaterial) resources.add(o.material); if(o.isLight) o.shadow?.map?.dispose(); });
        resources.forEach(r=>r.dispose());
        this.ownedKeys?.forEach(key=>kit().releaseMaterial(key)); this.ownedKeys?.clear();
        this.ownedTextures?.forEach(tex=>tex.dispose()); this.ownedTextures?.clear(); this.roomMaterials?.clear();
        this.renderer.dispose(); this.renderer.domElement.remove(); this.renderer = null; this.camera = this.group = this.scene = null;
      }
    }
    dispose() { if(this.disposed) return; this.listContainer?.removeEventListener('click',this.listFocusListener,true); this.disposed = true; reduced.removeEventListener('change', this.refreshListener); document.removeEventListener('visibilitychange', this.visibilityListener); this.modeObserver.disconnect(); this.markerObserver.disconnect(); cancelAnimationFrame(this.markerRaf); this.teardown3d(); this.host.replaceChildren(); }
  }

  window.Detective3D = { mount: (host, opts) => new Room(host, opts), THEMES };
})();
