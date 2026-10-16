/* 蛇梯棋微縮玩具呈現層；只接收遊戲結果，不出題、不產生遊戲亂數。 */
(function () {
  'use strict';
  const K = window.RG3DKit, done = () => Promise.resolve();
  const el = (tag, cls, text) => { const n = document.createElement(tag); n.className = cls || ''; if (text) n.textContent = text; return n; };
  const STYLE = `
.rg3d-snakes.is-3d>.rg3d-surface{background:transparent;border:0;box-shadow:none;border-radius:20px;min-height:0;max-height:none;width:100%;height:auto;aspect-ratio:1.4}
.rg3d-snakes>.rg3d-surface canvas{position:absolute;inset:0;width:100%!important;height:100%!important;mask-image:linear-gradient(to right,transparent,#000 4%,#000 96%,transparent),linear-gradient(to bottom,transparent,#000 4%,#000 96%,transparent);mask-composite:intersect}
.rg3d-snakes.is-3d>.rg3d-dom-labels{z-index:4}
.rg3d-snakes.is-3d .rg3d-cell-label{display:block;transform:translate(-50%,-50%);max-width:none;width:max-content;line-height:1}
.rg3d-snakes.is-3d .rg3d-cell-name{display:block;font-size:18px!important;color:#2b1d12;background:#fffaf3;padding:2px 4px;border-radius:5px;text-shadow:none}
.rg3d-snakes.is-3d .rg3d-cell-label.is-current .rg3d-cell-name{outline:2px solid #2b1d12;box-shadow:0 2px 4px #51381e25}
.rg3d-snakes.is-3d .rg3d-cell-direction{position:absolute;font-size:12px;color:#76736e;line-height:1;transform:translate(-50%,-50%)}
.rg3d-snakes.is-3d .rg3d-cell-detail{position:absolute;display:block;font-size:12px;line-height:1.1;white-space:nowrap;padding:2px 3px;transform:translate(-50%,-50%);color:#5c4633;background:#fffaf3;border-radius:4px}
.rg3d-snakes.is-3d .rg3d-cell-detail:empty{display:none}
@media (max-width:760px){.rg3d-snakes.is-3d .rg3d-cell-name{font-size:12px!important;padding:1px 2px}.rg3d-snakes.is-3d .rg3d-cell-detail,.rg3d-snakes.is-3d .rg3d-cell-direction{display:none!important}}
.rg3d-snakes.is-3d .rg3d-cell-step{font-size:18px;line-height:22px;height:24px;min-width:24px;text-align:center;padding:0 3px;background:var(--rg3d-step-color);color:white;border:1px solid white;z-index:2}
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
      this.host = opts.host; this.cells = opts.cells || []; this.ladders = opts.ladders || {}; this.snakes = opts.snakes || {}; this.onMode = opts.onMode;
      this.tokens = new Map(); this.pieces = new Map(); this.paths = new Map(); this.snakeModels = new Map(); this.ladderModels = new Map(); this.domCells = new Map(); this.domSteps = new Map(); this.maps = []; this.materialKeys = [];
      this.disposed = false; this._active = false; this.dieValue = 1; this.idleEpoch = 0;
      this.host.classList.add('rg3d-host', 'rg3d-snakes');
      this.surface = el('div', 'rg3d-surface'); this.surface.setAttribute('aria-hidden', 'true'); this.host.prepend(this.surface);
      this.domLabels = el('div', 'rg3d-dom-labels'); this.host.append(this.domLabels);
      this.keepsake = el('div', 'rg3d-keepsake rg3d-keepsake-snakes', '🏆 本次旅程完成'); this.keepsake.hidden = true; this.host.append(this.keepsake);
      this.cells.forEach(c => {
        const box = el('div', 'rg3d-cell-label'), name = el('span', 'rg3d-cell-name', c.label), detail = el('span', 'rg3d-cell-detail', c.detail), direction = el('span', 'rg3d-cell-direction', c.id === this.cells.length ? '' : c.direction), step = el('span', 'rg3d-cell-step');
        box.dataset.cell = c.id; step.dataset.cell = c.id; direction.setAttribute('aria-hidden', 'true');
        box.append(name); this.domLabels.append(box, detail, direction, step); this.domCells.set(c.id, { box, name, detail, direction, step });
      });
      this.toolbar = K.controls();
      this.stage = K.createStage({ host: this.surface, quality: opts.quality, onMode: (on, reason) => this.mode(on, reason) });
      const draw = this.stage.draw, resize = this.stage.resize;
      this.stage.draw = () => { this.layoutLabels(); draw(); }; this.stage.resize = () => { this.fit(); resize(); };
      this.ready = this.stage.ready.then(() => this);
      this.visible = () => { if (document.hidden) this.stopIdle(); else this.startIdle(); };
      document.addEventListener('visibilitychange', this.visible);
      this.detached = new MutationObserver(() => { if (!this.host.isConnected) this.dispose(); }); this.detached.observe(document.body, { childList: true, subtree: true });
    }
    get active() { return this._active && !this.disposed; }
    get camera() { return this.stage?.camera; }
    get failed() { return this.stage?.failed || ''; }
    mode(on, reason) {
      if (on && !this.root) this.build();
      const changed = this._active !== on; this._active = on;
      this.host.classList.toggle('is-3d', on); this.host.querySelector('.tilt')?.setAttribute('aria-hidden', String(on));
      const status = this.toolbar?.querySelector('.rg3d-status'); if (status) status.textContent = on ? '立體桌面' : `2D 模式・${reason || '玩法相同'}`;
      // 初次降級也通知使用端，維持骰子與設定列一致。
      if (changed || !on) this.onMode?.(on);
      if (on) { this.sync(); this.fit(); this.startIdle(); } else this.stopIdle();
    }
    draw() { this.stage?.draw(); }
    cellPosition(id) { const c = this.cells.find(c => c.id === id); return new window.THREE.Vector3(((c?.col || 0) - 2.5) * 1.68, .25, ((c?.row || 0) - 2) * 1.68); }
    mesh(g, geo, mat, x = 0, y = 0, z = 0) { const m = new window.THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; }
    box(g, w, h, d, mat, x = 0, y = 0, z = 0, r = .03) { return this.mesh(g, K.roundedBox(w, h, d, r, 1), mat, x, y, z); }
    rod(g, a, b, radius, mat) {
      const T = window.THREE, m = this.mesh(g, new T.CylinderGeometry(radius, radius, a.distanceTo(b), 12), mat);
      m.position.copy(a).lerp(b, .5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize()); return m;
    }
    overlay(group, order) {
      // 蛇梯與道具不寫深度，後畫的事件、棋子永遠可見；共用 kit 材質不變更。
      const clones = new Map(); group.traverse(o => { if (!o.isMesh) return; if (!clones.has(o.material)) { const m = o.material.clone(); m.depthWrite = false; clones.set(o.material, m); }
        const original = o.material; o.material = clones.get(original); if (o.userData.ownedMaterial) original.dispose(); o.userData.ownedMaterial = true; o.renderOrder = order; });
    }
    build() {
      const T = window.THREE, P = K.MAT.paper; this.root = new T.Group(); this.stage.scene.add(this.root);
      const fixed = new T.Group(); this.root.add(fixed);
      this.box(fixed, 22, .12, 20, K.MAT.woodDark, 0, -.64, 0, .12);
      this.box(fixed, 11.08, .55, 9.4, K.MAT.wood, 0, -.275, 0, .12);
      this.box(fixed, 10.08, .045, 8.4, P, 0, .022, 0, .06);
      this.cells.forEach(c => { const p = this.cellPosition(c.id); this.box(fixed, 1.62, .2, 1.62, (c.row + c.col) % 2 ? K.MAT.plastic('#f1d49e') : P, p.x, .15, p.z, .07); });
      batch(fixed);
      for (const [a,b] of Object.entries(this.ladders)) this.ladder(+a, +b);
      for (const [i,[a,b]] of Object.entries(this.snakes).entries()) this.snake(+a, +b, i);
      this.cells.filter(c => c.detail && !/蛇|梯/.test(c.detail)).forEach(c => {
        const p = this.cellPosition(c.id), g = new T.Group(); g.position.set(p.x + .52, .28, p.z + .12); this.root.add(g);
        const shape = new T.Shape(); for (let i=0;i<10;i++) { const angle = i*Math.PI/5+Math.PI/2, r = i%2 ? .10 : .22; if (!i) shape.moveTo(Math.cos(angle)*r,Math.sin(angle)*r); else shape.lineTo(Math.cos(angle)*r,Math.sin(angle)*r); } shape.closePath();
        const star = this.mesh(g, new T.ExtrudeGeometry(shape,{depth:.06,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:1,steps:1}), K.MAT.gold, 0,.18,0); star.rotation.x = -.65;
        g.add(K.blobShadow(.6,.16)); this.overlay(g,2); batch(g); g.children.forEach(o=>o.renderOrder=2);
      });
      this.startFlag(); this.finishCup();
      // 骰盤放在托盤前緣之外，不蓋住任何格子。
      this.box(this.root, 1.45, .10, 1.3, K.MAT.wood, 0, -.10, 4.95, .12);
      this.die = K.dice(); this.die.position.set(0, -.04, 4.95); this.die.scale.setScalar(.8); this.root.add(this.die); batch(this.die.userData.body);
      this.sync();
    }
    startFlag() {
      const T = window.THREE, p = this.cellPosition(1), g = new T.Group(); g.position.set(p.x+.50,.26,p.z+.12); this.root.add(g);
      this.rod(g,new T.Vector3(0,0,0),new T.Vector3(0,.62,0),.025,K.MAT.woodDark);
      const s = new T.Shape(); s.moveTo(0,0); s.lineTo(.34,-.10); s.lineTo(0,-.23); s.closePath(); this.mesh(g,new T.ShapeGeometry(s),K.MAT.plastic('#1f7a43'),0,.60,0);
      g.add(K.blobShadow(.6,.16)); this.overlay(g,0); batch(g);
    }
    finishCup() {
      const T=window.THREE,p=this.cellPosition(this.cells.length),g=new T.Group(); g.position.set(p.x+.48,.26,p.z+.12);this.root.add(g);this.cup=g;
      this.box(g,.42,.10,.36,K.MAT.woodDark,0,.05);
      this.rod(g,new T.Vector3(0,.1,0),new T.Vector3(0,.32,0),.065,K.MAT.gold);
      this.mesh(g,new T.SphereGeometry(.22,16,10,0,Math.PI*2,0,Math.PI/2),K.MAT.gold,0,.52,0).rotation.x=Math.PI;
      for(const x of [-.25,.25]) { const handle=this.mesh(g,new T.TorusGeometry(.13,.028,6,16),K.MAT.gold,x,.43,0); handle.scale.x=.7; }
      g.add(K.blobShadow(.7,.18));this.overlay(g,0);batch(g);
    }
    ladder(a,b) {
      const T=window.THREE,start=this.cellPosition(a),end=this.cellPosition(b);start.y+=.045;end.y+=.195;
      const path=new T.LineCurve3(start,end),side=end.clone().sub(start); side.set(-side.z,0,side.x).normalize().multiplyScalar(.23);
      const g=new T.Group();this.root.add(g); const steps=Math.max(3,Math.round(start.distanceTo(end)/.35));
      for(const s of [-1,1])this.rod(g,start.clone().addScaledVector(side,s),end.clone().addScaledVector(side,s),.045,K.MAT.wood);
      for(let i=0;i<=steps;i++){const p=path.getPoint(i/steps);this.rod(g,p.clone().sub(side),p.clone().add(side),.035,K.MAT.wood);}
      for(const p of [start,end]) {const height=p.y-.25;this.box(g,.64,height,.26,K.MAT.woodDark,p.x,.25+height/2,p.z,.02);const shadow=K.blobShadow(.85,.19);shadow.position.set(p.x,.253,p.z);g.add(shadow);}
      g.userData={from:a,to:b,steps,start:start.clone(),end:end.clone()};this.paths.set('ladder:'+a,path);this.ladderModels.set(a,g);this.overlay(g,1);batch(g);g.children.forEach(o=>o.renderOrder=1);
    }
    snake(a,b,index) {
      const T=window.THREE,start=this.cellPosition(a),end=this.cellPosition(b),side=end.clone().sub(start);side.set(-side.z,0,side.x).normalize();
      const planar=new T.CatmullRomCurve3(Array.from({length:9},(_,i)=>start.clone().lerp(end,i/8).addScaledVector(side,Math.sin(i/8*Math.PI*2)*.27)));
      // 左上40%保留給格號；跨過保留區的蛇身抬高到格面+.35。
      const points=Array.from({length:65},(_,i)=>{const p=planar.getPoint(i/64);const near=this.cells.some(c=>{const q=this.cellPosition(c.id);return p.x-q.x<-.10&&p.x-q.x>-.88&&p.z-q.z<-.10&&p.z-q.z>-.88;});p.y=.25+(near?.35:.18);return p;});
      const path=new T.CatmullRomCurve3(points),geo=new T.TubeGeometry(path,96,.22,10,false),pos=geo.attributes.position;
      for(let i=0;i<=96;i++){const center=path.getPointAt(i/96),scale=(.22-.14*i/96)/.22;for(let j=0;j<=10;j++){const k=i*11+j,p=new T.Vector3().fromBufferAttribute(pos,k).sub(center).multiplyScalar(scale).add(center);pos.setXYZ(k,p.x,p.y,p.z);}}geo.computeVertexNormals();
      const colors=[['#368555','#efd16c'],['#c77535','#fae6c4'],['#367aa9','#b9ddeb']][index%3],canvas=document.createElement('canvas');canvas.width=128;canvas.height=32;const ctx=canvas.getContext('2d');ctx.fillStyle=colors[0];ctx.fillRect(0,0,128,32);ctx.fillStyle=colors[1];ctx.fillRect(64,0,40,32);
      const map=new T.CanvasTexture(canvas);map.encoding=T.sRGBEncoding;map.wrapS=T.RepeatWrapping;map.repeat.set(Math.max(3,path.getLength()*1.5),1);this.maps.push(map);
      const key='snakes-stripe:'+this.root.uuid+':'+a;this.materialKeys.push(key);const mat=K.material(key,'#ffffff',.42,0,{map,envMapIntensity:.45});
      const g=new T.Group();this.root.add(g);this.mesh(g,geo,mat);
      const head=new T.Group();head.position.copy(path.getPoint(0));const tangent=path.getTangent(0).negate();head.rotation.y=Math.atan2(tangent.x,tangent.z);g.add(head);
      const skull=this.mesh(head,new T.SphereGeometry(.28,20,12),K.MAT.plastic(colors[0]));skull.scale.set(1,.55,1.25);
      const eyes=[];for(const x of [-.13,.13]){const eye=new T.Group();eye.position.set(x,.13,.12);head.add(eye);eyes.push(eye);this.mesh(eye,new T.SphereGeometry(.08,12,8),K.MAT.paper);this.mesh(eye,new T.SphereGeometry(.036,10,8),K.MAT.ink,0,.05,.035);}
      this.box(head,.035,.018,.19,K.MAT.plastic('#c0362c'),0,-.005,.39,.008);
      g.userData={headCell:a,tailCell:b,head,eyes};this.paths.set('snake:'+a,path);this.snakeModels.set(a,g);this.overlay(g,1);// 蛇頭保留獨立節點，以便眨眼、點頭。
    }
    fit() {
      if (!this.camera || !this.root) return;
      const T = window.THREE, cam = this.camera;
      const angle = (matchMedia('(max-width: 760px)').matches ? 66 : 54) * Math.PI / 180;
      const corners = [-5.54, 5.54].flatMap(x => [-4.70, 4.70].flatMap(z => [-.55, 0].map(y => new T.Vector3(x, y, z))));
      // 遠端那排的棋子高約 1.1，也要納入取景，否則頭會被畫布上緣切掉。
      corners.push(new T.Vector3(-4.7, 1.15, -3.86), new T.Vector3(4.7, 1.15, -3.86));
      // 前緣獨立骰盤亦納入取景。
      corners.push(new T.Vector3(-.73, 1.25, 5.60), new T.Vector3(.73, -.15, 5.60));
      // 先求左右各 5% 的距離，再迭代畫布比例及垂直中心，避免高度 fit 把棋盤縮小。
      let aspect = 1.4, targetY = 0, distance;
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
      this.camera.updateMatrixWorld(true); const rect=this.surface.getBoundingClientRect();
      const project=(p,node)=>{p.project(this.camera);node.style.left=`${(p.x+1)*rect.width/2}px`;node.style.top=`${(1-p.y)*rect.height/2}px`;};
      this.cells.forEach(c=>{const d=this.domCells.get(c.id),p=this.cellPosition(c.id),mark=this.domSteps.get(c.id);
        project(p.clone().add(new window.THREE.Vector3(-.53,.025,-.52)),d.box);
        project(p.clone().add(new window.THREE.Vector3(.66,.025,.59)),d.direction);
        project(p.clone().add(new window.THREE.Vector3(0,.025,mark?.67:.52)),d.detail);
        project(p.clone().add(new window.THREE.Vector3(-.37,.025,.24)),d.step);
        d.step.textContent=mark ? (/^\d+$/.test(mark.n)?mark.n+'步':mark.n) : '';d.step.style.setProperty('--rg3d-step-color',K.TOKENS.teams[mark?.team||0]);
        d.box.classList.toggle('is-current',this.focused?.cell===c.id);d.box.setAttribute('aria-label',[c.label,c.detail,...[...this.tokens].filter(([,cell])=>cell===c.id).map(([i])=>`${i+1}隊`)].filter(Boolean).join('，'));
      });
    }
    position(i,cell) {const p=this.cellPosition(cell);if([...this.tokens.values()].filter(n=>n===cell).length>1){p.x+=(i%2?.39:-.39);p.z+=(i<2?-.32:.48);}else p.z+=.12;return p;}
    ensurePiece(i) {
      if(!this.pieces.has(i)){const p=K.piece(i);p.scale.setScalar(.72);batch(p.children[0]);p.traverse(o=>{if(o.isMesh)o.renderOrder=3;});this.pieces.set(i,p);this.root.add(p);}return this.pieces.get(i);
    }
    sync(){if(!this.root)return;for(const[i,cell]of this.tokens)this.ensurePiece(i).position.copy(this.position(i,cell));if(this.die&&this.die.userData.value!==this.dieValue)this.die.roll(this.dieValue,{calm:true});}
    stopIdle(){this.idleEpoch++;for(const p of this.pieces.values())p.idle({active:false,stage:this.stage});}
    startIdle(){this.stopIdle();if(!this.active||this.completed||document.hidden||!this.focused||!this.stage?.active||document.body.classList.contains('calm')||window.RG?.systemReduced())return;
      const epoch=this.idleEpoch,p=this.pieces.get(this.focused.i);if(!p)return;const loop=()=>{if(epoch!==this.idleEpoch||!this.active||!this.stage.active||document.hidden||document.body.classList.contains('calm')||window.RG?.systemReduced())return;p.idle({active:true,stage:this.stage}).then(loop);};loop();}
    moveToken(i,cell,{instant=false,path:kind}={}) {
      if(this.disposed)return done();const previous=this.tokens.get(i);this.tokens.set(i,cell);if(!this.active||!this.root)return done();
      this.stopIdle();const p=this.ensurePiece(i),target=this.position(i,cell),from=p.position.clone();
      this.stage.cancelTween(p.uuid+':hop');this.stage.cancelTween('token:'+i);
      for(const[j,at]of this.tokens)if(j!==i)this.ensurePiece(j).position.copy(this.position(j,at));
      if(instant||previous==null){p.position.copy(target);this.draw();this.startIdle();return done();}
      const path=this.paths.get(kind+':'+previous),model=kind==='snake'?this.snakeModels.get(previous):this.ladderModels.get(previous);
      let promise;
      if(path&&model&&model.userData[kind==='snake'?'tailCell':'to']===cell){
        const steps=model.userData.steps||1,ms=kind==='ladder'?steps*120:1080;
        promise=this.stage.tween('token:'+i,ms,t=>{
          if(kind==='snake') {const blink=Math.sin(Math.PI*Math.min(1,t/.1667));for(const eye of model.userData.eyes)eye.scale.y=1-.88*blink;model.userData.head.rotation.x=.12*blink;}
          const travel=kind==='snake'?Math.max(0,(t-1/6)*1.2):t;
          const q=path.getPoint(travel),a=path.getPoint(0),b=path.getPoint(1);
          q.add(from.clone().sub(a).multiplyScalar(1-travel)).add(target.clone().sub(b).multiplyScalar(travel));
          const surfaceY=path.getPoint(travel).y+(kind==='snake'?.22-.14*travel+.025:.05);
          const settle=Math.min(1,travel*10,(1-travel)*10);q.y=q.y*(1-settle)+surfaceY*settle;
          if(kind==='ladder')q.y+=.13*Math.sin(Math.PI*(Math.min(steps-.000001,t*steps)%1));
          p.position.copy(q);const tangent=path.getTangent(travel);p.children[0].rotation.y=Math.atan2(tangent.x,tangent.z);
          if(t===1){p.position.copy(target);if(kind==='snake'){model.userData.head.rotation.x=0;for(const eye of model.userData.eyes)eye.scale.y=1;}}
        });
      }else promise=p.hop(from,target,{stage:this.stage});
      this.draw();return promise.then(()=>this.startIdle());
    }
    stepMark(i,cell,n){if(this.disposed)return done();this.domSteps.set(cell,{team:i,n:String(n)});this.draw();return done();}
    clearMarks(){if(this.disposed)return done();this.domSteps.clear();this.draw();return done();}
    rollDice(n){if(this.disposed)return done();this.dieValue=n;return this.active&&this.die?this.die.roll(n,{stage:this.stage}):done();}
    focusPlayer(i,cell){if(this.disposed)return done();this.focused={i,cell};this.startIdle();this.draw();return done();}
    presentFinish(){if(this.disposed)return done();this.completed=true;this.host.classList.add('rg3d-completed');this.keepsake.hidden=false;this.stopIdle();if(!this.active)return done();return Promise.all([...this.pieces.values()].map(p=>p.cheer({stage:this.stage})));}
    dispose(){if(this.disposed)return done();this.disposed=true;this.stopIdle();this.stage.dispose();this.detached.disconnect();document.removeEventListener('visibilitychange',this.visible);this.surface.remove();this.domLabels.remove();this.keepsake.remove();this.host.classList.remove('is-3d');this.host.classList.remove('rg3d-completed');this.host.querySelector('.tilt')?.setAttribute('aria-hidden','false');this.maps.forEach(m=>m.dispose());this.materialKeys.forEach(key=>K.releaseMaterial(key));return done();}
  }
  window.RG3DSnakes = { mount(opts) {
    if(!opts?.host||!K)return null;let view;
    try{if(!document.querySelector('style[data-rg3d-snakes]')){const style=el('style');style.setAttribute('data-rg3d-snakes','');style.textContent=STYLE;document.head.append(style);}view=new View(opts);return view;}
    catch(_){view?.dispose();opts.host.classList.remove('is-3d');opts.onMode?.(false);return null;}
  }};
})();
