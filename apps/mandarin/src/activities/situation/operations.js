import { SpeakButton } from '../../components/SpeakButton.js';
import { createCardOrder } from '../firstPersonPresentation.js';

export const containsPoint = (r,p) => Boolean(r && p.x>=r.left && p.x<=r.right && p.y>=r.top && p.y<=r.bottom);
// Segment/rectangle intersection handles coalesced pointer events.
export function crossesRegion(a,b,r) {
  if(!a)return containsPoint(r,b);
  let near=0,far=1;
  for(const [key,min,max] of [['x',r.left,r.right],['y',r.top,r.bottom]]){
    const d=b[key]-a[key];if(!d){if(a[key]<min || a[key]>max)return false;continue;}
    const x=(min-a[key])/d,y=(max-a[key])/d;near=Math.max(near,Math.min(x,y));far=Math.min(far,Math.max(x,y));if(near>far)return false;
  }
  return true;
}
export function advanceScoop(previous, point, region) {
  const dipped=Boolean(previous.dipped || crossesRegion(previous.point,point,region));
  return {point,dipped,lifted:dipped && point.x>=region.left && point.x<=region.right && point.y<region.top};
}
// Advance along a polyline in source-image percentages. Never accept a jump over
// corners of a bend; sparse events are resampled inside the corridor.
export function advanceTrace(progress, previous, point, path, tolerance = 3) {
  if (!path?.length || progress<0) return progress;
  const near=(p,q)=>Math.hypot(p.x-q[0],p.y-q[1])<=tolerance;
  if(progress===0)return near(point,path[0])?1:0;
  if(!previous || progress>=path.length)return progress;
  // Resample coalesced pointer moves. A straight sweep may visit many vertices;
  // a shortcut across a bend must still leave the permitted corridor and fail.
  const count=Math.max(1,Math.ceil(Math.hypot(point.x-previous.x,point.y-previous.y)/.4));
  let next=progress;
  for(let i=1;i<=count;i++){
    const p={x:previous.x+(point.x-previous.x)*i/count,y:previous.y+(point.y-previous.y)*i/count};
    if(next>=path.length)break;
    const a=path[next-1],b=path[next],dx=b[0]-a[0],dy=b[1]-a[1];
    const t=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.y-a[1])*dy)/(dx*dx+dy*dy || 1)));
    if(Math.hypot(p.x-a[0]-t*dx,p.y-a[1]-t*dy)>tolerance)return -1;
    if(near(p,b))next++;
  }
  return next;
}
export const chooseCard = (q,index) => Number.isInteger(index) && index>=0 && index<q.options.length ? index : null;
export const orderCards = initial => createCardOrder(initial);

// All coordinates are percentages of the source image; all buttons also support Tab/Enter.
export function mountConfiguredOperation(plane, options, api) {
  const {scene,state,changed,reduced=()=>false,saveDemo=()=>{},focus}=options;
  const config=scene.operation;
  const gesture=o=>o.gesture || config.type;
  const available=o=>state.step>=(o.fromStep ?? 0) && state.step<=(o.toStep ?? config.steps.length);
  let traceProgress=0, lastStep=state.step;
  const base=`${import.meta.env?.BASE_URL || '/'}${scene.assetBase}sprites/`;
  const layer=document.createElement('div');layer.className=`fp-operation fp-generic-operation${config.keepCompleted?' fp-keep-completed':''}`;plane.append(layer);
  const status=document.createElement('div');status.className='fp-operation-status';status.setAttribute('role','status');
  const message=document.createElement('span'),counter=document.createElement('span');counter.className='fp-operation-count';status.append(message,counter,SpeakButton({text:()=>`${message.textContent}（${counter.textContent}）`}));plane.parentElement.parentElement.append(status);
  let paused=true,disposed=false,selected=null,drag=null,suppress=false,timer,demoTimer,animation,handAnimation,bubble,toolReady=false,gripped=null;
  const elements=new Map();
  const hand=document.createElement('span');hand.className='fp-tongs-hand';hand.textContent='☝';hand.hidden=true;hand.setAttribute('aria-hidden','true');layer.append(hand);
  for(const o of config.objects.filter(o=>o.path)){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');svg.classList.add('fp-trace-route');
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',o.path.map((p,i)=>`${i?'L':'M'}${p[0]} ${p[1]}`).join(' '));svg.append(path);layer.append(svg);
  }
  let arrowPath;
  if(['dragToTarget','toolGrab'].includes(config.type) || config.objects.some(o=>o.gesture==='dragToTarget')){
    const arrow=document.createElementNS('http://www.w3.org/2000/svg','svg');arrow.classList.add('fp-wood-arrow');arrow.setAttribute('viewBox','0 0 100 100');arrow.setAttribute('preserveAspectRatio','none');arrow.setAttribute('aria-hidden','true');
    arrowPath=document.createElementNS('http://www.w3.org/2000/svg','path');arrow.append(arrowPath);layer.append(arrow);
  }
  function guide(p){if(config.guide===false)return;const active=selected || config.objects.find(o=>o.action===config.steps[state.step]);const r=config.regions?.[active?.region || 'target'];if(!arrowPath || !r)return;if(!['dragToTarget','toolGrab'].includes(gesture(active || {}))){arrowPath.setAttribute('d','');return;}const x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;arrowPath.setAttribute('d',`M${p.x} ${p.y} L${x} ${y} m-2 -1 L${x} ${y} l-1 -2`);}
  guide(config.objects[0]);
  const cards = ['chooseCard','orderCards'].includes(config.type) ? orderCards(config.initialOrder || config.objects.map((_,i)=>i)) : null;
  const pos=(el,x,y)=>{el.style.left=`${x}%`;el.style.top=`${y}%`;};
  const tell=text=>{message.textContent=text;};
  const point=e=>{const r=plane.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*100,y:(e.clientY-r.top)/r.height*100};};
  const snap=o=>{const el=elements.get(o.action);el.style.width=`${state.collected?.includes(o.action) && o.destinationWidth ? o.destinationWidth : o.width}%`;pos(el,...(state.collected?.includes(o.action) && o.destination ? o.destination : [o.x,o.y]));};
  function render(){
    for(const o of config.objects){const el=elements.get(o.action);el.hidden=!available(o);el.style.pointerEvents=o.passive?'none':'';el.disabled=Boolean(paused || o.passive || api.complete() || !available(o) || state.collected?.includes(o.action));el.setAttribute('aria-pressed',String(selected===o || gripped===o));if(!drag)snap(o);}
    status.classList.toggle('fp-operation-complete',api.complete());layer.classList.toggle('fp-operation-complete',api.complete());
    tell(config.prompts?.[state.step] || scene.goal);const group=config.groups?.find(g=>state.step>=g.from && state.step<g.to) || config.groups?.at(-1);counter.textContent=group?`${Math.min(group.to-group.from,Math.max(0,state.step-group.from))}／${group.to-group.from}`:`${state.step}／${config.steps.length}`;
    if(lastStep!==state.step){lastStep=state.step;focus?.(config.focus?.[state.step] ?? config.objects.find(o=>o.action===config.steps[state.step])?.x ?? config.objects[0].x);}
    for(const marker of layer.children){if(marker.dataset?.dragGuide)marker.hidden=!['dragToTarget','toolGrab'].includes(gesture(config.objects.find(o=>o.action===config.steps[state.step]) || {})) || api.complete();if(marker.dataset?.region)marker.hidden=marker.dataset.region!==(config.objects.find(o=>o.action===config.steps[state.step])?.region || 'target') || api.complete();}
    guide(config.objects.find(o=>o.action===config.steps[state.step]) || config.objects[0]);
    options.heat?.(config.heat?.[state.step] ?? 1);
  }
  function commit(action){const spec=config.objects.find(o=>o.action===action);if(spec && !available(spec))return false;if(!api.operate(action))return false;render();changed();return true;}
  function observe(o){
    if(config.silentObserve || o.observation===''){commit(o.action);return;}
    bubble?.remove();bubble=document.createElement('div');bubble.className='fp-object-bubble';pos(bubble,o.x,o.y-8);
    const text=o.observation ?? o.label;if(!text){commit(o.action);return;}bubble.append(document.createTextNode(text),SpeakButton({text}));layer.append(bubble);
    clearTimeout(timer);timer=setTimeout(()=>bubble?.remove(),config.bubbleDuration || 2000);commit(o.action);
  }
  function targetFor(o,p){const r=config.regions?.[o.region || 'target'];return containsPoint(r,p);}
  function drop(o,p){
    if(gesture(o)==='dragToTarget'){
      if(targetFor(o,p)){commit(o.action);selected=null;}else tell(config.retry || '移到發亮的目標區，再放開。');
    }else if(config.type==='toolGrab'){
      if(gripped && targetFor(gripped,p)){commit(gripped.action);gripped=null;toolReady=false;selected=null;}else tell(config.retry || '先拿工具、選物件，再放到目標區。');
    }
    snap(o);
  }
  function select(o){
    if(paused || disposed || elements.get(o.action).disabled)return;
    if(o.target){if(selected)drop(selected,{x:o.x,y:o.y});return;}
    if(config.type==='chooseCard'){commit(o.action);return;}
    if(config.type==='orderCards'){
      cards.toggle(config.objects.indexOf(o));
      for(const [i,spec] of config.objects.entries()){
        const index=cards.selected.indexOf(i);elements.get(spec.action).setAttribute('aria-label',`${spec.label}${index<0?'':`，第${index+1}張`}`);
        elements.get(spec.action).setAttribute('aria-pressed',String(index>=0));
      }
      return;
    }
    if(gesture(o)==='tap'){commit(o.action);return;}
    if(gesture(o)==='observe'){observe(o);return;}
    if(gesture(o)==='tracePath'){
      // Keyboard alternative advances one path waypoint per activation.
      traceProgress++;tell(`沿虛線剪裁（${traceProgress}／${o.path.length}）`);
      if(traceProgress>=o.path.length){traceProgress=0;commit(o.action);}return;
    }
    if(config.type==='scoopGesture'){commit(config.steps[state.step]);return;}
    if(config.type==='toolGrab'){
      if(o.tool){toolReady=true;selected=o;tell(config.takePrompt || '選擇要夾取的物件。');return;}
      if(!toolReady || gripped)return;gripped=o;selected=o;
    }else selected=o;
    guide(o);render();
  }
  for(const o of config.objects){
    const el=document.createElement('button');el.type='button';el.className=`fp-object ${o.target?'fp-drop-target fp-glow':''}`;el.dataset.action=o.action;el.setAttribute('aria-label',o.label);
    if(o.minHitSize)el.style.setProperty('--fp-hit-size',`${o.minHitSize}px`);
    el.style.width=`${o.width}%`;el.style.aspectRatio=String(1/o.ratio);el.style.rotate=`${o.angle}deg`;pos(el,o.x,o.y);
    if(o.sprite){const img=new Image();img.src=base+o.sprite+'.webp';img.alt='';img.draggable=false;el.append(img);}else if(!o.target && !o.hotspot)el.textContent=o.label;
    if(o.hotspot)el.classList.add('fp-glow');
    layer.append(el);elements.set(o.action,el);el.onclick=()=>{if(!suppress)select(o);};
    if(o.target || ['tap','observe','chooseCard','orderCards'].includes(gesture(o)))continue;
    el.onpointerdown=e=>{
      if(e.button!==0 || paused || disposed || el.disabled)return;e.stopPropagation();animation?.cancel();
      if(config.type==='toolGrab')select(o);else selected=o;
      traceProgress=0;
      if(gesture(o)==='tracePath')traceProgress=advanceTrace(0,null,point(e),o.path,o.tolerance);
      drag={id:e.pointerId,o,start:point(e),point:point(e),dipped:false,moved:false};el.setPointerCapture(e.pointerId);
    };
    el.onpointermove=e=>{
      if(!drag || drag.id!==e.pointerId)return;const p=point(e);drag.moved ||= Math.hypot(p.x-drag.start.x,p.y-drag.start.y)>1;
      if(gesture(o)==='tracePath' && traceProgress>=0)traceProgress=advanceTrace(traceProgress,drag.point,p,o.path,o.tolerance);
      if(config.type==='scoopGesture')Object.assign(drag,advanceScoop(drag,p,config.regions.water));else drag.point=p;
      pos(el,p.x,p.y);guide(p);
      if(config.type==='toolGrab'){
        if(o.tool && toolReady && !gripped){const found=config.objects.find(other=>!other.tool && !other.target && !state.collected?.includes(other.action) && containsPoint({left:other.x-other.width/2,right:other.x+other.width/2,top:other.y-other.width*other.ratio/2,bottom:other.y+other.width*other.ratio/2},p));if(found){gripped=found;selected=found;}}
        if(gripped)pos(elements.get(gripped.action),p.x,p.y);
      }
    };
    el.onpointerup=e=>{
      if(!drag || drag.id!==e.pointerId)return;el.onpointermove(e);const gesture=drag;drag=null;
      if(gesture.moved){suppress=true;setTimeout(()=>suppress=false,0);
        if(config.type==='tracePath' || o.gesture==='tracePath'){if(traceProgress===o.path.length)commit(o.action);else tell(config.retry || '按住剪刀，從虛線起點慢慢剪到終點。');traceProgress=0;}
        else if(config.type==='scoopGesture'){if(gesture.lifted)commit(config.steps[state.step]);else tell(config.retry || '拖入區域，再往上拉出。');}
        else drop(o,point(e));
      }
      snap(o);if(gripped)snap(gripped);
    };
    el.onpointercancel=()=>{traceProgress=0;drag=null;toolReady=false;if(gripped)snap(gripped);gripped=null;selected=null;snap(o);};
  }
  if(config.type==='orderCards'){
    const confirm=document.createElement('button');confirm.type='button';confirm.className='fp-button';confirm.textContent='確認次序';
    confirm.onclick=()=>{if(paused)return;if(cards.selected.length===config.objects.length && cards.selected.every((n,i)=>n===config.answer[i]))commit(config.steps[state.step]);else tell(config.retry || '再核對次序。');};
    status.append(confirm);
  }
  // Static dashed destination and guide; source art remains unchanged.
  if(config.guide!==false && (['dragToTarget','toolGrab'].includes(config.type) || config.objects.some(o=>o.gesture==='dragToTarget'))){
    const r=config.regions.target,guide=document.createElement('div');guide.dataset.dragGuide='true';guide.className='fp-generic-target';
    guide.style.left=`${r.left}%`;guide.style.top=`${r.top}%`;guide.style.width=`${r.right-r.left}%`;guide.style.height=`${r.bottom-r.top}%`;layer.append(guide);
  }
  function showWoodDemo(force=false){
    if(paused || api.complete() || state.demoSeen && !force)return false;
    const o=config.objects.find(o=>!o.target && !o.tool && !o.passive && available(o) && !state.collected?.includes(o.action));if(!o)return false;
    state.demoSeen=true;saveDemo();animation?.cancel();handAnimation?.cancel();clearTimeout(demoTimer);
    const r=config.regions?.[o.region || 'target'] || config.regions?.water;
    if(r && !reduced()){hand.hidden=false;hand.style.left=`${o.x}%`;hand.style.top=`${o.y}%`;const frames=[{left:`${o.x}%`,top:`${o.y}%`},{left:`${(r.left+r.right)/2}%`,top:`${(r.top+r.bottom)/2}%`},{left:`${o.x}%`,top:`${o.y}%`}];animation=elements.get(o.action).animate(frames,{duration:1800});handAnimation=hand.animate(frames,{duration:1800});demoTimer=setTimeout(()=>{hand.hidden=true;},1800);}else {elements.get(o.action).classList.add('fp-demo-lit');demoTimer=setTimeout(()=>elements.get(o.action).classList.remove('fp-demo-lit'),1800);}
    tell(config.demoPrompt || scene.goal);return true;
  }
  render();
  return {startDemo(){showWoodDemo();},showWoodDemo,get dragging(){return Boolean(drag);},setPaused(value){const was=paused;paused=value;render();if(value){traceProgress=0;animation?.cancel();handAnimation?.cancel();hand.hidden=true;clearTimeout(demoTimer);if(drag){snap(drag.o);drag=null;}}else if(was){render();focus?.(config.focus?.[state.step] ?? scene.art.orientationFocus?.[innerWidth/innerHeight>=1.4?'landscape':'portrait'] ?? config.objects[0].x);if(scene.beats.act.demo)showWoodDemo();}},dispose(){disposed=true;clearTimeout(timer);clearTimeout(demoTimer);animation?.cancel();handAnimation?.cancel();bubble?.remove();status.remove();layer.remove();}};
}
