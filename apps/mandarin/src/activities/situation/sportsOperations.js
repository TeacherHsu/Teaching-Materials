import { placePrompt } from './promptLayout.js';
import { SpeakButton } from '../../components/SpeakButton.js';

// Pure, serializable rules. Attempts survive pause/reload; failures never advance step.
export function rhythmAttempt(attempts, phase = 0) {
  const attempt = attempts + 1;
  const window = attempt >= 5 ? 1 : .1 + attempt * .18;
  return { attempts: attempt, window, success: attempt >= 5 && Math.abs(phase) <= window };
}
export const breathProgress = elapsed => Math.max(0, Math.min(1, elapsed / 3000));
export const breathScale = progress => 1 + .65 * Math.sin(Math.PI * progress);
export function assistedShot(start, end, hoop, guaranteed = false) {
  return Math.hypot(end.x-start.x,end.y-start.y) >= 3 && (guaranteed || end.y < start.y + 8 && Math.hypot(end.x-hoop[0],end.y-hoop[1]) < 38);
}

export function mountSportsOperation(plane, options, api) {
  const {scene,state,changed,focus,reduced=()=>false,saveDemo=()=>{}}=options;
  const config=scene.operation, objects=config.objects;
  let paused=true,disposed=false,busy=false,committing=false,drag=null,holding=null,frame=null,lastAttempt=-Infinity,suppress=false,animation;
  const layer=document.createElement('div');layer.className='fp-operation fp-sports-operation';plane.append(layer);
  const status=document.createElement('div');status.className='fp-operation-status fp-sports-status';status.setAttribute('role','status');
  const message=document.createElement('span'),counter=document.createElement('span');status.append(message,counter,SpeakButton({text:()=>message.textContent}));plane.parentElement.parentElement.append(status);
  const base=`${import.meta.env?.BASE_URL || '/'}${scene.assetBase}sprites/`;
  const elements=new Map();
  let hands;
  if(config.heldHands){hands=new Image();hands.src=base+'holding-hands.webp';hands.alt='';hands.className='fp-holding-hands';hands.draggable=false;layer.append(hands);}
  const layout=()=>placePrompt(status,plane,scene);
  const resize=typeof ResizeObserver==='undefined'?null:new ResizeObserver(layout);resize?.observe(plane);
  const panObserver=typeof MutationObserver==='undefined'?null:new MutationObserver(layout);
  panObserver?.observe(plane,{attributes:true,attributeFilter:['style']});
  panObserver?.observe(plane.parentElement,{attributes:true,attributeFilter:['style']});

  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');svg.classList.add('fp-shot-guide');svg.setAttribute('aria-hidden','true');
  const arc=document.createElementNS('http://www.w3.org/2000/svg','path');svg.append(arc);layer.append(svg);
  const point=e=>{const r=plane.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*100,y:(e.clientY-r.top)/r.height*100};};
  const current=()=>objects.find(o=>state.step>=(o.fromStep??0) && state.step<=(o.toStep??config.steps.length) && !o.passive);
  const type=o=>o.gesture || config.type;
  const reset=o=>{const el=elements.get(o.action);el.style.left=`${o.x}%`;el.style.top=`${o.y}%`;el.style.transform='';};
  function render(){
    const active=current();
    for(const o of objects){const el=elements.get(o.action);el.hidden=api.complete() || o!==active;el.disabled=paused || disposed || busy || api.complete();}
    counter.textContent=`${state.step}／${config.steps.length}`;message.textContent=config.prompts?.[state.step] || scene.goal;
    layer.dataset.mode=active?type(active):'';layer.classList.toggle('fp-sports-calm',reduced());
    if(!drag)arc.setAttribute('d','');
    layout();
  }
  function commit(){
    if(paused || disposed || committing || api.complete())return false;
    // Re-entry guard remains held through changed(), which may synchronously pause us.
    committing=true;
    try {const accepted=api.operate(config.steps[state.step]);if(accepted){if(api.complete())options.quiet?.(0);changed();}render();return accepted;} finally {committing=false;}
  }
  function animate(el,frames,duration,done){
    animation?.cancel();busy=true;render();
    if(reduced()){busy=false;done();render();return;}
    animation=el.animate(frames,{duration,easing:'ease-in-out'});
    animation.onfinish=()=>{animation=null;busy=false;if(!disposed && !paused)done();render();};
    animation.oncancel=()=>{busy=false;if(!disposed)render();};
  }
  function tap(o){
    if(paused || disposed || busy || committing || current()!==o || api.complete())return;
    const now=performance.now();if(now-lastAttempt<650)return;lastAttempt=now;
    const result=rhythmAttempt(state.rhythmAttempts || 0,Math.sin(now/180));state.rhythmAttempts=result.attempts;saveDemo();
    const el=elements.get(o.action);
    if(result.success)animate(el,[{transform:'translate(-50%,-50%)'},{transform:'translate(-50%,0%)'},{transform:'translate(-50%,-50%)'}],650,commit);
    else{
      layer.classList.add('fp-gentle-duck');
      animate(el,[{transform:'translate(-50%,-50%)'},{transform:'translate(-15%,-62%) rotate(12deg)'},{transform:'translate(-50%,-50%)'}],650,()=>{layer.classList.remove('fp-gentle-duck');message.textContent='球回來了，再試一次。';});
    }
  }
  function shot(o,end,keyboard=false){
    if(paused || disposed || busy || committing || current()!==o || api.complete())return;
    const hoop=config.hoop || [50,25],el=elements.get(o.action);
    const success=assistedShot({x:o.x,y:o.y},end,hoop,config.guaranteed || keyboard);
    arc.setAttribute('d','');
    if(!success){reset(o);message.textContent='往籃框的方向拉，再放開。';return;}
    animate(el,[{left:`${o.x}%`,top:`${o.y}%`,transform:'translate(-50%,-50%) scale(1)'},{left:`${(o.x+hoop[0])/2}%`,top:`${hoop[1]-13}%`,transform:'translate(-50%,-50%) scale(.65)',offset:.55},{left:`${hoop[0]}%`,top:`${hoop[1]}%`,transform:'translate(-50%,-50%) scale(.4)'},{left:`${hoop[0]}%`,top:`${hoop[1]+15}%`,transform:'translate(-50%,-50%) scale(.4)'}],1150,()=>{reset(o);commit();});
  }
  function stopHold(){layer.classList.remove('fp-breath-holding');holding=null;cancelAnimationFrame(frame);frame=null;layer.style.setProperty('--breath-progress',state.step>=1 && config.type==='holdBreath'?'1':'0');options.quiet?.(state.step>=1 && config.type==='holdBreath'?1:0);for(const o of objects)if(type(o)==='holdBreath')elements.get(o.action).style.transform='';}
  function startHold(o,id){
    if(paused || disposed || busy || holding || current()!==o || api.complete())return;
    layer.classList.add('fp-breath-holding');holding={start:performance.now(),id,o};
    function tick(now){
      if(!holding || paused || disposed)return;
      const progress=breathProgress(now-holding.start);
      elements.get(o.action).style.transform=`translate(-50%,-50%) scale(${breathScale(progress)})`;
      layer.style.setProperty('--breath-progress',String(progress));
      layer.dataset.quiet=String(progress>=.5);
      options.quiet?.(progress);
      if(progress>=1){stopHold();options.quiet?.(1);layer.style.setProperty('--breath-progress','1');layer.dataset.quiet='true';busy=true;commit();busy=false;render();}else frame=requestAnimationFrame(tick);
    }
    frame=requestAnimationFrame(tick);
  }
  for(const o of objects){
    const el=document.createElement('button');el.type='button';el.className='fp-object fp-sport-object';el.dataset.action=o.action;el.setAttribute('aria-label',o.label);el.style.left=`${o.x}%`;el.style.top=`${o.y}%`;el.style.width=`${o.width}%`;el.style.aspectRatio=String(1/o.ratio);
    if(o.sprite){const img=new Image();img.src=base+o.sprite+'.webp';img.alt='';img.draggable=false;el.append(img);}else {el.classList.add('fp-breath-circle');el.textContent='吸氣…吐氣';}
    layer.append(el);elements.set(o.action,el);
    el.onclick=e=>{if(suppress || paused || busy || disposed || api.complete())return;if(type(o)==='rhythmTap')tap(o);if(type(o)==='aimShot' && e.detail===0)shot(o,{x:50,y:25},true);};
    el.onkeydown=e=>{if(![' ','Enter'].includes(e.key))return;if(type(o)==='holdBreath'){e.preventDefault();if(!e.repeat)startHold(o,'keyboard');}else if(e.repeat)e.preventDefault();};
    el.onkeyup=e=>{if(type(o)==='holdBreath' && [' ','Enter'].includes(e.key)){e.preventDefault();stopHold();options.quiet?.(state.step>=1?1:0);}};
    el.onblur=()=>{if(holding?.id==='keyboard')stopHold();};
    el.oncontextmenu=e=>e.preventDefault();
    el.onlostpointercapture=()=>{if(holding)stopHold();};
    el.onpointerdown=e=>{
      if(e.button!==0 || paused || disposed || busy || drag || holding || current()!==o || api.complete())return;
      if(type(o)==='rhythmTap')return;
      el.setPointerCapture(e.pointerId);e.preventDefault();
      if(type(o)==='holdBreath'){startHold(o,e.pointerId);return;}
      drag={id:e.pointerId,o,start:point(e)};
    };
    el.onpointermove=e=>{if(!drag || drag.id!==e.pointerId || paused)return;const p=point(e);const x=Math.max(0,Math.min(100,p.x)),y=Math.max(0,Math.min(100,p.y));el.style.left=`${x}%`;el.style.top=`${y}%`;arc.setAttribute('d',`M ${o.x} ${o.y} Q ${(o.x+x)/2} ${Math.min(y,o.y)-18} ${x} ${y}`);};
    el.onpointerup=e=>{
      if(holding?.id===e.pointerId){stopHold();options.quiet?.(0);return;}
      if(!drag || drag.id!==e.pointerId)return;drag=null;suppress=true;setTimeout(()=>suppress=false,0);shot(o,point(e));
    };
    el.onpointercancel=()=>{drag=null;arc.setAttribute('d','');stopHold();reset(o);};
  }
  render();
  return {startDemo(){},showWoodDemo(){return false;},get dragging(){return Boolean(drag || holding);},setPaused(value){paused=value;if(value){stopHold();options.quiet?.(state.step>=1 && config.type==='holdBreath'?1:0);drag=null;animation?.cancel();animation=null;busy=false;for(const o of objects)reset(o);}render();if(!value)focus?.(50);},dispose(){panObserver?.disconnect();resize?.disconnect();disposed=true;stopHold();options.quiet?.(0);animation?.cancel();status.remove();layer.remove();}};
}
