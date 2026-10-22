import threeURL from '../../../../Chinese/Review-Games/vendor/three-r128/three.min.js?url';
import roundedURL from '../../../../Chinese/Review-Games/vendor/three-r128/examples/js/geometries/RoundedBoxGeometry.js?url';
import kitURL from '../../../../Chinese/Review-Games/rg3d-kit.js?url';
import roomURL from '../../../../Chinese/Review-Games/vendor/three-r128/examples/js/environments/RoomEnvironment.js?url';
import { COOKING_SCALE, POT, LADLE, ARM, WORKER, ladlePose, armElbow } from './firstPersonMotion.js';

let library;
function script(src) {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script');
    const timer = setTimeout(() => { el.remove(); reject(new Error('timeout')); }, 6500);
    el.src = src;
    el.onload = () => { clearTimeout(timer); resolve(); };
    el.onerror = () => { clearTimeout(timer); el.remove(); reject(new Error('load')); };
    document.head.append(el);
  });
}
async function load() {
  if (!library) library = (async () => {
    if (!window.THREE) await script(threeURL);
    if (!window.THREE.RoundedBoxGeometry) await script(roundedURL);
    if (!window.THREE.RoomEnvironment) await script(roomURL);
    if (!window.RG3DKit) await script(kitURL);
    return { T: window.THREE, K: window.RG3DKit };
  })().catch((e) => { library = null; throw e; });
  return library;
}

// 小幅、離散的第一人稱觀察位置；不使用自由走路、指標鎖定或連續鏡頭。
const VIEWS = {
  entrance: [[-1.1, 2.1, 2.4], [-1.8, 1.65, -1.5]],
  work: [[-1.1, 1.65, 1.9], [-2.6, .7, -1]],
  pot: [[.1, 1.88, 2.05], [1.05, 1.1, -1.2]],
  side: [[3.5, 1.72, 1.15], [1.05, 1.18, -1.12]],
  ladle: [[.35, 1.82, 1.9], [1.15, 1.18, -1.1]],
  fire: [[.25, 1.18, 1.8], [.65, .58, -1.05]],
  tool: [[.1, 1.8, 2.15], [1.1, 1.05, -1.2]],
  notes: [[2.6, 1.7, 2], [3.6, 1.1, -.65]],
};

export async function mountFirstPersonScene(host, { phase, onProject, onMode, calm = false }) {
  let disposed = false, failed = false, renderer, scene, camera, observer;
  let currentView = phase.view;
  let frame = 0, lastTime = 0, elapsed = 0, paused = false, yaw = 0, pitch = 0, environment;
  let animateAction = 0;
  const updates = [];
  const geometries = new Set();
  const localMaterials = new Set();
  const markers = {};
  const fallback = () => { failed = true; cancelAnimationFrame(frame); host.classList.remove('is-3d'); onMode('圖像探索'); onProject(null); };
  const lost = (e) => { e.preventDefault(); fallback(); };
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    observer?.disconnect();
    window.removeEventListener('pagehide', dispose);
    document.removeEventListener('visibilitychange', visibility);
    renderer?.domElement.removeEventListener('webglcontextlost', lost);
    scene?.traverse((o) => { if (o.geometry) geometries.add(o.geometry); if (o.isLight) o.shadow?.map?.dispose(); });
    geometries.forEach((g) => g.dispose());
    localMaterials.forEach((m) => m.dispose());
    environment?.dispose();
    renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove();
  }
  function render() {
    if (disposed || failed || !renderer || !host.isConnected || renderer.getContext().isContextLost()) return;
    try {
      const width = host.clientWidth, height = host.clientHeight;
      if (!width || !height) return;
      if (renderer.domElement.width !== Math.floor(width * renderer.getPixelRatio()) || renderer.domElement.height !== Math.floor(height * renderer.getPixelRatio())) renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const portrait = width / height < .7;
      camera.fov = portrait ? 70 : width / height < .8 ? 64 : 53;
      const [pos, target] = VIEWS[currentView];
      camera.position.set(...pos);
      const framing = new window.THREE.Vector3(...target);
      if (portrait && !['entrance', 'work', 'fire'].includes(currentView)) { camera.position.z += 1.45; framing.x += .18; }
      camera.lookAt(framing); camera.rotateY(yaw); camera.rotateX(pitch); camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      const result = {};
      for (const [key, object] of Object.entries(markers)) {
        const v = object.getWorldPosition(new window.THREE.Vector3()); v.project(camera);
        result[key] = { x: (v.x + 1) * 50, y: (1 - v.y) * 50, visible: v.z < 1 && Math.abs(v.x) < .85 && Math.abs(v.y) < .83 };
      }
      onProject(result);
    } catch { fallback(); }
  }
  function tick(now) {
    frame = 0;
    if (disposed || failed || calm || paused || document.hidden || !host.isConnected) return;
    if (now - lastTime >= 32) {
      const dt = lastTime ? Math.min((now - lastTime) / 1000, .25) : 0;
      lastTime = now; elapsed += dt;
      animateAction = Math.max(0, animateAction - dt);
      updates.forEach((update) => update(elapsed, animateAction)); render();
    }
    frame = requestAnimationFrame(tick);
  }
  function resume() { cancelAnimationFrame(frame); lastTime = 0; if (failed || disposed) return; if (!calm && !paused && !document.hidden) frame = requestAnimationFrame(tick); else render(); }
  function visibility() { resume(); }
  try {
    const { T, K } = await load();
    if (disposed || !host.isConnected) return { dispose, setView() {}, setOptions() {}, observeAction() {}, look() {} };
    renderer = K.createRenderer(matchMedia('(max-width:760px)').matches ? 'light' : 'high');
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.addEventListener('webglcontextlost', lost);
    host.prepend(renderer.domElement);
    scene = new T.Scene(); scene.background = new T.Color('#dbccb0'); scene.fog = new T.Fog('#dbccb0', 11, 27);
    camera = new T.PerspectiveCamera(48, 1, .1, 70);
    K.addStudioLights(scene, 'high');
    const room = new T.RoomEnvironment(), pmrem = new T.PMREMGenerator(renderer);
    environment = pmrem.fromScene(room, .04); scene.environment = environment.texture; pmrem.dispose();
    room.traverse((o) => { o.geometry?.dispose(); if (o.material) o.material.dispose(); });
    const windowLight = new T.DirectionalLight('#fff0d4', .9); windowLight.position.set(-4, 5, -1); scene.add(windowLight);
    renderer.shadowMap.enabled = true;
    // 灶台、木梁的陰影只烘繪一次；水泡與蒸氣不反覆重算整間屋子的陰影。
    renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
    const mat = K.MAT;
    let parent = scene;
    const stone = mat.plastic('#b5aaa0'), ceramic = mat.plastic('#a9c4be');
    const iron = K.material('explore-cast-iron', '#3c4748', .46, .55, { envMapIntensity: .7 });
    const box = (w, h, d, material, x, y, z) => {
      const m = new T.Mesh(K.roundedBox(w, h, d, Math.min(.07, w / 5, h / 5, d / 5)), material);
      m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
    };
    const sphere = (radius, material, x, y, z, scale = [1, 1, 1]) => {
      const m = new T.Mesh(new T.SphereGeometry(radius, 28, 18), material);
      m.position.set(x, y, z); m.scale.set(...scale); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
    };
    const cylinder = (top, bottom, height, material, x, y, z) => {
      const m = new T.Mesh(new T.CylinderGeometry(top, bottom, height, 40), material);
      m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
    };
    const torus = (r, tube, material, x, y, z) => {
      const m = new T.Mesh(new T.TorusGeometry(r, tube, 12, 44), material);
      m.position.set(x, y, z); parent.add(m); return m;
    };
    const boxes = (w, h, d, material, positions) => {
      const mesh = new T.InstancedMesh(K.roundedBox(w, h, d, Math.min(.04, w / 5, h / 5, d / 5)), material, positions.length);
      const matrix = new T.Matrix4(); positions.forEach((p, i) => { matrix.makeTranslation(...p); mesh.setMatrixAt(i, matrix); });
      mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false; parent.add(mesh); return mesh;
    };
    // 材質皆程序生成，無外部圖片。木板逐片留縫，灶台有錯縫磚、鐵箍和灰燼。
    const plasterCanvas = document.createElement('canvas'); plasterCanvas.width = plasterCanvas.height = 128;
    const pc = plasterCanvas.getContext('2d'); pc.fillStyle = '#d9c9ad'; pc.fillRect(0, 0, 128, 128);
    let seed = 87;
    for (let j = 0; j < 3500; j++) { seed = (seed * 1664525 + 1013904223) >>> 0; pc.fillStyle = j % 2 ? '#d3c3a51a' : '#fff9e81c'; pc.fillRect(seed % 128, (seed >>> 8) % 128, 1, 2); }
    const plasterTexture = new T.CanvasTexture(plasterCanvas); plasterTexture.encoding = T.sRGBEncoding;
    const plaster = new T.MeshStandardMaterial({ map: plasterTexture, roughness: .95 }); localMaterials.add(plaster);
    const oldDispose = plaster.dispose.bind(plaster); plaster.dispose = () => { plasterTexture.dispose(); oldDispose(); };
    // 木地板、灰泥牆、露木梁和窗外的微縮樹林。
    box(11, .18, 14, mat.wood, 0, -.15, 0);
    const seams = [], joints = [];
    for (let z = -5; z <= 6; z += .48) {
      seams.push([0, -.045, z]);
      for (let x = -4 + (Math.round(z * 10) % 2) * .6; x < 5; x += 2.2) joints.push([x, -.045, z + .24]);
    }
    boxes(10.8, .012, .018, mat.woodDark, seams); boxes(.018, .012, .46, mat.woodDark, joints);
    box(11, 4.7, .18, plaster, 0, 2.2, -4);
    box(.2, 4.7, 9, plaster, -5.4, 2.2, .4);
    box(11, .12, 9, mat.woodDark, 0, 4.55, -.5);
    for (let z = -3.6; z < 4; z += 2.3) box(10.8, .23, .18, mat.wood, 0, 4.35, z);
    [-4.7, -.4, 4.7].forEach((x) => box(.2, 4.7, .26, mat.woodDark, x, 2.15, -3.8));
    box(10.7, .27, .3, mat.wood, 0, 3.9, -3.65);
    box(3.6, 2.3, .14, mat.plastic('#b6d7d1'), -2.55, 2.3, -3.82);
    for (let i = 0; i < 6; i++) {
      sphere(.6, mat.plastic(i % 2 ? '#7eaa88' : '#96b797'), -4 + i * .6, 2.1 + (i % 3) * .21, -3.64, [.7, 1.2, .14]);
      box(.07, .8, .06, mat.wood, -4 + i * .6, 1.5, -3.5);
    }
    [-4.35, -.75].forEach((x) => box(.13, 2.5, .18, mat.wood, x, 2.3, -3.4));
    [1.1, 2.3, 3.5].forEach((y) => box(3.7, .1, .22, mat.wood, -2.55, y, -3.4));
    box(.12, 2.5, .18, mat.wood, -2.55, 2.3, -3.4);
    box(4, .17, .7, mat.wood, -2.55, 1.02, -3.25);
    // 門口的風鈴不擺動，不暗示文字未提到的事件。
    const bell = cylinder(.26, .34, .37, mat.gold, -3.1, 2.65, -.4);
    const bellRim = torus(.34, .022, mat.gold, -3.1, 2.46, -.4); bellRim.rotation.x = Math.PI / 2;
    box(.025, .75, .025, mat.woodDark, -3.1, 3.17, -.4);
    box(.025, .3, .025, mat.woodDark, -3.1, 2.29, -.4);
    markers.bell = sphere(.065, mat.woodDark, -3.1, 2.1, -.4);
    updates.push((t) => { bell.rotation.z = Math.sin(t * 1.1) * .035; });
    // 工作角木柴與置物架。
    box(2, .13, 1.1, mat.wood, -2.7, .13, -.75);
    for (let i = 0; i < 7; i++) {
      const log = cylinder(.105, .12, 1.6, i % 2 ? mat.woodDark : mat.wood, -3.15 + (i % 4) * .26, .3 + Math.floor(i / 4) * .21, -.7);
      log.rotation.x = Math.PI / 2;
    }
    markers.wood = box(.01, .01, .01, mat.wood, -2.7, .7, -.7);
    box(2, .12, .6, mat.wood, 3.1, 2.8, -3.45);
    for (let i = 0; i < 4; i++) {
      const x = 2.4 + i * .45;
      sphere(.19, i % 2 ? ceramic : mat.paper, x, 3.03, -3.4, [1, 1.15, 1]);
      cylinder(.09, .13, .1, ceramic, x, 3.22, -3.4);
    }
    // 圓角柴灶：爐口在正前方；鍋身、鍋緣、水面分層。
    const cooking = new T.Group(); scene.add(cooking); parent = cooking;
    box(2.35, 1.04, 1.8, stone, .65, .48, -1.4);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 6; col++) {
      const x = -.35 + col * .39 + (row % 2) * .1;
      if (row < 2 && x > -.05 && x < 1.4) continue;
      box(.365, .23, .1, mat.plastic((row + col) % 3 ? '#b49b82' : '#a38c77'), x, .15 + row * .255, -.45);
    }
    box(1.25, .56, .06, iron, .65, .38, -.47);
    box(1.45, .13, .2, stone, .65, .74, -.43);
    const smaller = phase.id === 'root';
    for (let i = 0; i < (smaller ? 2 : 4); i++) {
      const log = cylinder(.09, .11, .8, mat.woodDark, .2 + i * .25, .18, -.51); log.rotation.x = Math.PI / 2;
    }
    const ember = K.material('explore-ember', '#df9a46', .8, 0, { emissive: new T.Color('#7d381b').convertSRGBToLinear(), emissiveIntensity: .35 });
    const flames = [];
    const flameGeometry = new T.LatheGeometry([[0, 0], [.07, .025], [.10, .10], [.065, .22], [0, .34]].map(([r, y]) => new T.Vector2(r, y)), 20);
    for (let i = 0; i < 5; i++) {
      const flame = new T.Mesh(flameGeometry, ember); flame.position.set(.27 + i * .19, .17, -.42); flame.scale.set(smaller ? .6 : 1, smaller ? .4 : 1, .6); cooking.add(flame);
      flames.push(flame);
    }
    const fireLight = new T.PointLight('#ffbd76', smaller ? .18 : .65, 3.2); fireLight.position.set(.65, .4, -.15); cooking.add(fireLight);
    updates.push((t, action) => {
      const level = smaller && action > 0 ? .35 + .65 * Math.min(1, action / 4) : smaller ? .35 : 1;
      flames.forEach((f, j) => { f.scale.y = (.95 + Math.sin(t * 2 + j) * .07) * level; });
      fireLight.intensity = .65 * level + Math.sin(t * 1.6) * .025;
    });
    markers.fire = box(.01, .01, .01, iron, -.18, .45, -.35);
    // 中空鍋壁；封頂 Cylinder 會把水面蓋成一片灰色鐵蓋。
    const potProfile = [[0, 1.04], [.74, 1.04], [.83, 1.12], [.94, 1.36], [.97, 1.56], [.91, 1.56], [.88, 1.36], [.77, 1.13], [.7, 1.10], [0, 1.10]].map(([r, y]) => new T.Vector2(r, y));
    const potShell = new T.Mesh(new T.LatheGeometry(potProfile, 64), iron); potShell.position.set(.65, 0, -1.4); potShell.castShadow = true; cooking.add(potShell);
    const burner = torus(.62, .055, iron, .65, .985, -1.4); burner.rotation.x = Math.PI / 2;
    const rim = torus(.96, .055, iron, .65, 1.57, -1.4); rim.rotation.x = Math.PI / 2;
    const waterMaterial = new T.ShaderMaterial({
      uniforms: { time: { value: 0 } }, transparent: true,
      vertexShader: 'varying vec2 surface; uniform float time; void main(){surface=position.xz; vec3 p=position; p.y+=sin(p.x*19.+time*2.)*cos(p.z*17.-time)*.003; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
      fragmentShader: 'varying vec2 surface; uniform float time; void main(){float wave=sin(surface.x*29.+time*2.)*cos(surface.y*25.-time*1.3)*.025; float light=.42+surface.y*.18+wave; vec3 color=mix(vec3(.23,.41,.39),vec3(.61,.75,.66),light); float sheen=pow(max(0.,1.-abs(surface.x+surface.y*.3-.25)*2.),10.)*.12; gl_FragColor=vec4(color+sheen,.97);}',
    }); localMaterials.add(waterMaterial);
    const water = cylinder(.89, .89, .025, waterMaterial, .65, 1.535, -1.4);
    water.renderOrder = 1;
    const bubbles = [], ripples = [];
    const bubbleMaterial = new T.MeshPhysicalMaterial({ color: new T.Color('#e7f0df').convertSRGBToLinear(), roughness: .12, metalness: .02, transparent: true, opacity: .26, clearcoat: 1, depthWrite: false }); localMaterials.add(bubbleMaterial);
    const rippleMaterial = new T.MeshBasicMaterial({ color: '#dceadc', transparent: true, opacity: .42, depthWrite: false }); localMaterials.add(rippleMaterial);
    const bubbleCount = smaller ? 3 : 25;
    const bubbleMesh = new T.InstancedMesh(new T.SphereGeometry(1, 16, 10), bubbleMaterial, bubbleCount);
    bubbleMesh.instanceMatrix.setUsage(T.DynamicDrawUsage); bubbleMesh.frustumCulled = false; bubbleMesh.renderOrder = 2; cooking.add(bubbleMesh);
    for (let i = 0; i < bubbleCount; i++) {
      const r = .02 + (i % 4) * .008;
      const x = .65 + Math.cos(i * 2.4) * (.17 + (i % 6) * .105), z = -1.4 + Math.sin(i * 2.4) * (.17 + (i % 6) * .105);
      const bubble = new T.Object3D(); bubble.position.set(x, 1.56, z); bubble.userData.radius = r; bubbles.push(bubble);
      if (i < 10) { const ripple = torus(.07, .003, rippleMaterial, x, 1.56, z); ripple.renderOrder = 3; ripple.rotation.x = Math.PI / 2; ripples.push(ripple); }
    }
    updates.push((t) => {
      waterMaterial.uniforms.time.value = t;
      water.position.y = 1.535 + (smaller ? .001 : .004) * Math.sin(t * 3.4);
      bubbles.forEach((b, j) => {
        const u = (t * (smaller ? .22 : .75) + j * .23) % 1;
        const scale = .25 + Math.sin(u * Math.PI) * 1.15;
        b.scale.set(scale, .3 + Math.sin(u * Math.PI) * .5, scale).multiplyScalar(b.userData.radius);
        b.position.y = 1.55 + Math.sin(u * Math.PI) * (smaller ? .006 : .018);
        b.updateMatrix(); bubbleMesh.setMatrixAt(j, b.matrix);
      });
      bubbleMesh.instanceMatrix.needsUpdate = true;
      ripples.forEach((r, j) => { const u = (t * .38 + j * .17) % 1; r.scale.setScalar(.2 + u * 1.5); r.visible = u < .8; });
    });
    const steamCanvas = document.createElement('canvas'); steamCanvas.width = steamCanvas.height = 128;
    const sc = steamCanvas.getContext('2d'), gradient = sc.createRadialGradient(64, 64, 3, 64, 64, 62);
    gradient.addColorStop(0, 'rgba(243,238,219,.85)'); gradient.addColorStop(.4, 'rgba(236,233,217,.38)'); gradient.addColorStop(1, 'rgba(243,238,219,0)');
    sc.fillStyle = gradient; sc.fillRect(0, 0, 128, 128);
    const steamTexture = new T.CanvasTexture(steamCanvas), steamPuffs = [];
    for (let i = 0; i < 12; i++) {
      const material = new T.SpriteMaterial({ map: steamTexture, transparent: true, opacity: smaller ? .13 : .4, depthWrite: false, color: '#ece9da' });
      localMaterials.add(material);
      const puff = new T.Sprite(material); puff.renderOrder = 4; cooking.add(puff); steamPuffs.push(puff);
    }
    const firstSteamMaterial = steamPuffs[0].material, steamDispose = firstSteamMaterial.dispose.bind(firstSteamMaterial);
    firstSteamMaterial.dispose = () => { steamTexture.dispose(); steamDispose(); };
    const updateSteam = (t) => steamPuffs.forEach((puff, i) => {
      const u = (t * .15 + i / 12) % 1;
      puff.position.set(.65 + Math.sin(i * 2.4 + u * 2) * (.2 + u * .26), 1.62 + u * 1.45, -1.4 + Math.cos(i * 2.4) * .28);
      puff.scale.set(.32 + u * .75, .45 + u * .9, 1);
      puff.material.opacity = Math.sin(u * Math.PI) * (smaller ? .08 : .46);
    });
    updates.push(updateSteam); updateSteam(0);
    const wispMaterial = new T.MeshBasicMaterial({ color: '#f2f0df', transparent: true, opacity: .16, depthWrite: false }); localMaterials.add(wispMaterial);
    const wisps = [];
    for (let i = 0; i < 5; i++) {
      const points = [];
      for (let j = 0; j < 9; j++) points.push(new T.Vector3(Math.sin(j * .65 + i) * .07, j * .13, Math.cos(j * .5 + i) * .045));
      const wisp = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points), 36, .018 + (i % 2) * .006, 5, false), wispMaterial);
      wisp.position.set(.3 + i * .17, 1.58, -1.25 + (i % 2) * .15); wisp.renderOrder = 4; cooking.add(wisp); wisps.push(wisp);
    }
    updates.push((t) => wisps.forEach((w, i) => { w.rotation.y = Math.sin(t * .35 + i) * .4; w.scale.y = (smaller ? .25 : .8) + Math.sin(t * .6 + i) * .07; }));
    [-.42, 1.72].forEach((x) => { const handle = torus(.17, .05, iron, x, 1.35, -1.4); handle.rotation.y = Math.PI / 2; });
    markers.pot = box(.01, .01, .01, iron, -.42, 1.45, -1.4);
    cooking.scale.set(COOKING_SCALE.x, COOKING_SCALE.y, COOKING_SCALE.z);
    cooking.position.set(POT.x * (1 - COOKING_SCALE.x), 0, POT.z * (1 - COOKING_SCALE.z));
    // 木工作桌與勺／抽柴工具；皆為讀文的視覺線索，不可操作熱水。
    const worktable = new T.Group(); scene.add(worktable); parent = worktable; worktable.position.x = .6;
    box(1.95, .18, 1.45, mat.wood, 3.05, 1.02, -.9);
    for (const x of [2.32, 3.78]) for (const z of [-1.4, -.4]) box(.14, 1.1, .14, mat.woodDark, x, .5, z);
    const spoon = box(.1, .09, 1.15, mat.wood, 2.3, 1.2, -.75); spoon.rotation.y = -.25;
    const spareBowl = sphere(.23, mat.wood, 2.43, 1.19, -1.32, [1, .3, 1]);
    const holding = phase.id === 'ladle' || phase.id === 'cause';
    spoon.visible = spareBowl.visible = !holding;
    for (const x of [3.1, 3.25]) { const tool = box(.055, .06, 1.05, iron, x, 1.2, -1); tool.rotation.y = x === 3.1 ? .15 : -.15; tool.visible = !smaller; }
    // 無字筆記卡只代表介面中的閱讀筆記，不是新增故事道具。
    markers.notes = box(.68, .045, .52, mat.paper, 3.3, 1.16, .02);
    for (let i = 0; i < 3; i++) box(.45, .008, .015, mat.felt, 3.3, 1.19, -.1 + i * .1);
    parent = scene;
    markers.tool = new T.Object3D(); markers.tool.position.set(1.35, .8, -.55); scene.add(markers.tool);
    markers.ladle = new T.Object3D(); markers.ladle.position.set(1.2, 1.5, -1.0); scene.add(markers.ladle);
    // 人物是年輕徒弟與年長師傅的微縮造型示意，玩家保持觀察者視角。
    function person(x, z, master, worried, working = false) {
      const group = new T.Group(); scene.add(group);
      const skin = mat.plastic('#dfb58e'), cloth = mat.plastic(master ? '#c4aa80' : '#729d93');
      const add = (geo, material, px, py, pz) => { const m = new T.Mesh(geo, material); m.position.set(px, py, pz); m.castShadow = true; group.add(m); return m; };
      const rounded = (w, h, d, material, px, py, pz) => add(K.roundedBox(w, h, d, .06), material, px, py, pz);
      const ball = (r, material, px, py, pz) => add(new T.SphereGeometry(r, 24, 16), material, px, py, pz);
      rounded(.47, .68, .32, cloth, 0, 1.03, 0);
      rounded(.35, .45, .035, mat.paper, 0, .95, .18);
      for (const side of [-1, 1]) {
        rounded(.16, .55, .2, mat.plastic('#59645c'), side * .13, .43, 0);
        rounded(.19, .11, .3, mat.woodDark, side * .13, .12, .07);
        if (!(working && side === -1)) {
          const sleeve = rounded(.18, .46, .22, cloth, side * .31, 1.08, .03); sleeve.rotation.z = side * (worried ? -.12 : .12);
          ball(.075, skin, side * (worried ? .32 : .29), .83, .09);
        }
      }
      ball(.31, skin, 0, 1.66, .02);
      add(new T.SphereGeometry(.322, 28, 16, 0, Math.PI * 2, 0, Math.PI * .4), master ? mat.plastic('#b4b1a6') : mat.plastic('#554438'), 0, 1.665, .02);
      if (master) { const beard = ball(.19, mat.paper, 0, 1.47, .23); beard.scale.set(1, .7, .5); }
      for (const side of [-1, 1]) {
        const eye = ball(.024, mat.ink, side * .105, 1.66, .303); eye.scale.z = .4;
        const brow = rounded(.105, .018, .025, mat.woodDark, side * .105, worried ? 1.75 : 1.74, .3); brow.rotation.z = worried ? side * -.25 : side * -.06;
      }
      const mouth = new T.Mesh(new T.TorusGeometry(.05, .009, 6, 16, Math.PI), mat.woodDark);
      mouth.position.set(0, worried ? 1.52 : 1.56, .316); mouth.rotation.z = worried ? 0 : Math.PI; group.add(mouth);
      const shoulder = new T.Object3D(); shoulder.position.set(...WORKER.shoulder); group.add(shoulder); group.userData.shoulder = shoulder;
      group.position.set(x, 0, z); group.rotation.y = WORKER.yaw;
      return group;
    }
    const apprentice = person(smaller ? 2.7 : WORKER.x, smaller ? -2.1 : WORKER.z, false, holding, holding);
    const master = person(smaller ? WORKER.x : phase.id === 'ladle' ? -4.1 : 2.85, smaller ? WORKER.z : phase.id === 'ladle' ? -2.6 : -2.65, true, false, smaller);
    const movingLadle = new T.Group(); scene.add(movingLadle);
    const cupProfile = [[0, -.12], [.05, -.11], [.10, -.075], [LADLE.bowlRadius, 0], [.115, 0], [.086, -.065], [.04, -.09], [0, -.095]].map(([r, y]) => new T.Vector2(r, y));
    const bowl = new T.Mesh(new T.LatheGeometry(cupProfile, 40), mat.wood); movingLadle.add(bowl);
    const lip = new T.Mesh(new T.TorusGeometry(LADLE.bowlRadius, .012, 8, 36), mat.woodDark); lip.rotation.x = Math.PI / 2; movingLadle.add(lip);
    const shaft = new T.Mesh(K.roundedBox(LADLE.handleLength + .05, .035, .04, .015), mat.wood); shaft.position.set(LADLE.handleLength / 2, 0, 0); movingLadle.add(shaft);
    movingLadle.visible = holding;
    const streamMaterial = new T.MeshPhysicalMaterial({ color: new T.Color('#a9d2c7').convertSRGBToLinear(), transparent: true, opacity: .7, roughness: .16, clearcoat: 1, depthWrite: false }); localMaterials.add(streamMaterial);
    const heldWater = new T.Mesh(new T.CircleGeometry(.112, 28), streamMaterial); heldWater.rotation.x = -Math.PI / 2; heldWater.position.y = -.025; heldWater.renderOrder = 5; movingLadle.add(heldWater);
    const stream = new T.Mesh(new T.CylinderGeometry(.013, .018, 1, 12), streamMaterial); stream.renderOrder = 5; scene.add(stream); stream.visible = false;
    const splash = new T.Mesh(new T.TorusGeometry(.065, .005, 6, 24), rippleMaterial); splash.rotation.x = Math.PI / 2; splash.renderOrder = 5; scene.add(splash); splash.visible = false;
    const v = (point) => new T.Vector3(...point);
    const up = new T.Vector3(0, 1, 0);
    function segment(mesh, start, end) {
      const direction = end.clone().sub(start);
      mesh.position.copy(start).lerp(end, .5); mesh.scale.y = direction.length();
      mesh.quaternion.setFromUnitVectors(up, direction.normalize());
    }
    const worker = smaller ? master : apprentice;
    const shirt = mat.plastic(smaller ? '#c4aa80' : '#729d93'), skin = mat.plastic('#dfb58e');
    const upperArm = new T.Mesh(new T.CylinderGeometry(.075, .068, 1, 18), shirt);
    const forearm = new T.Mesh(new T.CylinderGeometry(.062, .05, 1, 18), shirt);
    scene.add(upperArm, forearm);
    const elbowJoint = sphere(.068, shirt, 0, 0, 0);
    const palm = new T.Group(); scene.add(palm);
    const palmMesh = new T.Mesh(new T.SphereGeometry(ARM.handRadius, 20, 14), skin); palmMesh.scale.set(1, .85, .8); palm.add(palmMesh);
    const thumb = new T.Mesh(new T.SphereGeometry(.025, 14, 10), skin); thumb.position.set(-.025, -.015, .04); palm.add(thumb);
    // 指節包住勺柄兩側，握點仍由 motion 共用尺寸決定。
    for (let i = 0; i < 3; i++) {
      const finger = new T.Mesh(new T.TorusGeometry(.027, .011, 6, 12, Math.PI * 1.5), skin);
      finger.rotation.y = Math.PI / 2; finger.position.set(-.028 + i * .026, -.004, 0); palm.add(finger);
    }
    for (const mesh of [upperArm, forearm, elbowJoint, palm]) { mesh.visible = holding || smaller; mesh.castShadow = false; }
    const extraction = new T.Group(); scene.add(extraction); extraction.visible = false;
    const extractedLog = new T.Mesh(new T.CylinderGeometry(.085, .1, .65, 18), mat.woodDark); extractedLog.rotation.x = Math.PI / 2; extraction.add(extractedLog);
    const tongs = [-1, 1].map(() => { const mesh = new T.Mesh(new T.CylinderGeometry(.018, .018, 1, 10), iron); scene.add(mesh); mesh.visible = smaller; return mesh; });
    const basis = new T.Matrix4(), rollRotation = new T.Quaternion(), axisX = new T.Vector3(1, 0, 0);
    updates.push((t, action) => {
      const pose = ladlePose(action > 0 ? LADLE.duration - action : null);
      host.dataset.ladlePhase = holding && action > 0 ? pose.phase : 'rest';
      host.dataset.ladleRoll = pose.roll.toFixed(3);
      const xAxis = v(pose.direction), yAxis = up.clone().addScaledVector(xAxis, -up.dot(xAxis)).normalize(), zAxis = xAxis.clone().cross(yAxis).normalize();
      basis.makeBasis(xAxis, yAxis, zAxis);
      movingLadle.position.copy(v(pose.bowl)); movingLadle.quaternion.setFromRotationMatrix(basis);
      movingLadle.quaternion.multiply(rollRotation.setFromAxisAngle(axisX, pose.roll));
      heldWater.visible = holding && pose.water > .02;
      heldWater.scale.setScalar(Math.sqrt(.4 + pose.water * .6)); heldWater.position.y = -.025 - (1 - pose.water) * .06;
      stream.visible = holding && action > 0 && pose.stream > .08;
      splash.visible = stream.visible;
      if (stream.visible) {
        const start = new T.Vector3(0, 0, LADLE.bowlRadius * .92).applyQuaternion(movingLadle.quaternion).add(movingLadle.position);
        const end = start.clone(); end.y = POT.waterY + .006;
        segment(stream, start, end); stream.scale.x = stream.scale.z = pose.stream;
        splash.position.copy(end); splash.scale.setScalar(.7 + Math.sin(t * 10) * .1);
      }
      let wrist = v(pose.grip);
      if (smaller) {
        const u = action > 0 ? Math.min(1, (LADLE.duration - action) / 5) : 1;
        extraction.visible = true; extraction.position.set(.75 + u * .55, .19 + u * .03, -.7 + u * .3);
        wrist.set(1.72 + u * .08, 1.03, -.52);
        tongs.forEach((tong, index) => {
          const offset = (index ? 1 : -1) * .05;
          segment(tong, extraction.position.clone().add(new T.Vector3(offset, .03, .05)), wrist.clone().add(new T.Vector3(offset * .3, 0, 0)));
        });
      }
      worker.updateWorldMatrix(true, false);
      const shoulder = worker.userData.shoulder.getWorldPosition(new T.Vector3());
      const elbow = v(armElbow(shoulder.toArray(), wrist.toArray()));
      segment(upperArm, shoulder, elbow); segment(forearm, elbow, wrist);
      elbowJoint.position.copy(elbow); palm.position.copy(wrist);
      if (smaller) palm.quaternion.setFromUnitVectors(axisX, wrist.clone().sub(extraction.position).normalize());
      else palm.quaternion.copy(movingLadle.quaternion);
    });
    const shadow = K.blobShadow(2.6, .25); shadow.position.set(.65, -.04, -1.1); localMaterials.add(shadow.material); scene.add(shadow);
    host.classList.add('is-3d'); onMode('第一人稱・定點觀察');
    observer = new ResizeObserver(render); observer.observe(host);
    window.addEventListener('pagehide', dispose);
    document.addEventListener('visibilitychange', visibility);
    updates.forEach((update) => update(0, 0)); render(); resume();
  } catch { renderer?.dispose(); renderer?.domElement.remove(); fallback(); }
  return {
    dispose,
    setView(view) { if (!VIEWS[view]) return; currentView = view; yaw = pitch = 0; render(); },
    setOptions(options) { calm = Boolean(options.calm); paused = Boolean(options.paused); resume(); },
    observeAction() { animateAction = LADLE.duration; if (calm) { updates.forEach((update) => update(2.3, LADLE.duration - 2.3)); render(); } else resume(); },
    look(dx, dy) { yaw = Math.max(-.4, Math.min(.4, yaw + dx)); pitch = Math.max(-.18, Math.min(.18, pitch + dy)); render(); },
  };
}
