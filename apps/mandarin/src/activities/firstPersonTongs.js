import { SpeakButton } from '../components/SpeakButton.js';
import { outsidePile } from './firstPersonLayout.js';

export const furnace = {left:66,right:80,top:64,bottom:86};
export const outsideFurnace = ({x,y}) => x>=0 && x<=100 && y>=0 && y<=100 && !(x>=furnace.left && x<=furnace.right && y>=furnace.top && y<=furnace.bottom);
// Fixed CSS hit squares remain disjoint at every cover scale.
export function tongsWoodLayout(imageWidth,imageHeight) {
  return [0,1,2].map(i=>({x:73+(i-1)*74/imageWidth*100,y:[73,78,75.5][i],size:64}));
}
export function tongsState(){return {phase:'rest',wood:null};}
export function tongsAction(tool,action,point){
  if(action==='take' && tool.phase==='rest'){tool.phase='ready';return 'ready';}
  if(action.startsWith('wood-') && tool.phase==='ready'){tool.phase='gripped';tool.wood=action;return 'gripped';}
  if(action==='drop' && tool.phase==='gripped'){
    const result=outsideFurnace(point)?tool.wood:'rebound';tool.phase='rest';tool.wood=null;return result;
  }
  return false;
}
export function mountTongs(plane, options, api){
  const {state,changed,heat,demonstrate,focus,reduced=()=>false,saveDemo=()=>{}}=options;
  const {operate,complete,heatFor}=api;
  const layer=document.createElement('div');layer.className='fp-operation fp-act-4 fp-tongs-operation';plane.append(layer);
  const base=`${import.meta.env?.BASE_URL || '/'}assets/first-person/115AG3H04/sprites/`;
  const status=document.createElement('div');status.className='fp-operation-status';status.setAttribute('role','status');
  const message=document.createElement('span');status.append(message,SpeakButton({text:()=>message.textContent}));plane.parentElement.parentElement.append(status);
  const tool=tongsState(), logs=[];let paused=true,disposed=false,drag=null,demoTimer,idleTimer,handTimer,animations=[],suppress=false;
  function button(label,sprite,action){const el=document.createElement('button');el.type='button';el.className='fp-object';el.dataset.action=action;el.setAttribute('aria-label',label);if(sprite){const img=new Image();img.src=base+sprite+'.webp';img.alt='';img.draggable=false;el.append(img);}layer.append(el);return el;}
  const ground=button('爐外地上',null,'outside');ground.classList.add('fp-tongs-ground');ground.textContent='爐外地上';
  const tong=button('拿起火鉗','tongs','tongs');
  for(let i=0;i<3;i++)logs.push(button(`第${i+1}根柴火`,'wood-burning',`wood-${i+1}`));
  const arrow=document.createElementNS('http://www.w3.org/2000/svg','svg');arrow.classList.add('fp-wood-arrow');arrow.setAttribute('viewBox','0 0 100 100');arrow.setAttribute('preserveAspectRatio','none');arrow.setAttribute('aria-hidden','true');arrow.innerHTML='<path d="M73 75 L61 84 m1 -2 L61 84 l2 1"/>';arrow.hidden=true;layer.append(arrow);
  const hand=document.createElement('span');hand.className='fp-tongs-hand';hand.textContent='☝';hand.setAttribute('aria-hidden','true');hand.hidden=true;layer.append(hand);
  const point=e=>{const r=plane.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*100,y:(e.clientY-r.top)/r.height*100};};
  const position=(el,x,y)=>{el.style.left=`${x}%`;el.style.top=`${y}%`;};
  function task(){message.textContent=state.step===0?'先看師傅示範':`用火鉗把柴夾出爐口（${state.collected?.length || 0}／3）`;}
  function stopDemo(){clearTimeout(handTimer);animations.forEach(a=>a.cancel());animations=[];hand.hidden=true;layer.classList.remove('fp-demo-lit');}
  function idle(){clearTimeout(idleTimer);layer.classList.remove('fp-wood-static');if(!paused && state.step>0 && !complete())idleTimer=setTimeout(()=>{layer.classList.add('fp-wood-static');},8000);}
  function arrange(){const r=plane.getBoundingClientRect();const coords=tongsWoodLayout(r.width,r.height);logs.forEach((el,i)=>{if(state.collected?.includes(el.dataset.action)){position(el,...outsidePile[i]);el.style.rotate=[-14,9,-4][i]+'deg';el.classList.add('fp-extracted');el.querySelector('img').src=base+'wood-burning.webp';}else if(tool.wood!==el.dataset.action)position(el,coords[i].x,coords[i].y);});if(!drag && tool.phase!=='gripped')position(tong,62,66);}
  function render(){task();logs.forEach(el=>{el.disabled=state.step===0 || state.collected?.includes(el.dataset.action) || (tool.phase==='gripped' && tool.wood!==el.dataset.action);});tong.disabled=state.step===0 || complete();tong.setAttribute('aria-pressed',String(tool.phase!=='rest'));ground.disabled=state.step===0 || complete();arrow.hidden=tool.phase==='rest';status.classList.toggle('fp-operation-complete',complete());heat(heatFor());arrange();idle();}
  function take(){if(paused || tong.disabled)return;stopDemo();tongsAction(tool,'take');render();message.textContent='拿起火鉗，選一根柴火。';}
  function grip(el){if(state.collected?.includes(el.dataset.action))return;if(tongsAction(tool,el.dataset.action)){const x=parseFloat(el.style.left),y=parseFloat(el.style.top);position(tong,x,y);tong.style.rotate='-8deg';render();message.textContent='夾住了，往發亮的爐外地上拉。';}}
  function release(p){const result=tongsAction(tool,'drop',p);tong.style.rotate='0deg';if(result && result!=='rebound'){operate(result);changed();}render();if(result==='rebound')message.textContent='還在爐口裡，試著往發亮的地面拉遠一點。';}
  tong.onclick=()=>{if(!suppress)take();};logs.forEach(el=>el.onclick=()=>{if(!suppress){stopDemo();grip(el);}});ground.onclick=()=>{if(!suppress)release({x:61,y:84});};
  // Native buttons provide the identical take → grip → ground sequence with Tab/Enter/Space.
  tong.onpointerdown=e=>{if(e.button!==0 || paused || tong.disabled)return;e.stopPropagation();take();drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};tong.setPointerCapture(e.pointerId);layer.classList.add('is-dragging');arrow.hidden=false;};
  tong.onpointermove=e=>{if(!drag || drag.id!==e.pointerId)return;const p=point(e);drag.moved ||= Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>6;position(tong,p.x,p.y);tong.style.rotate=reduced()?'0deg':`${Math.max(-10,Math.min(10,(e.clientX-drag.x)/20))}deg`;if(tool.phase==='ready'){const el=logs.find(el=>{const r=el.getBoundingClientRect();return !el.disabled && e.clientX>=r.left && e.clientX<=r.right && e.clientY>=r.top && e.clientY<=r.bottom;});if(el)grip(el);}if(tool.wood){const el=logs.find(el=>el.dataset.action===tool.wood);position(el,p.x,p.y);}};
  tong.onpointerup=e=>{if(!drag || drag.id!==e.pointerId)return;tong.onpointermove(e);const moved=drag.moved;drag=null;layer.classList.remove('is-dragging');if(moved){suppress=true;setTimeout(()=>suppress=false,0);if(tool.phase==='gripped')release(point(e));else{tool.phase='rest';render();message.textContent='先把鉗尖移到一根柴火上，再往外拉。';}}};
  tong.onpointercancel=()=>{drag=null;tool.phase='rest';tool.wood=null;tong.style.rotate='0deg';layer.classList.remove('is-dragging');render();message.textContent='慢慢來，可以改用點選。';};
  function showWoodDemo(force=false){if(paused || state.step===0 || complete() || (!force && state.tongsDemoSeen))return false;stopDemo();state.tongsDemoSeen=true;saveDemo();const el=logs.find(el=>!el.disabled);if(!el)return false;hand.hidden=false;position(hand,62,66);const frames=[{left:'62%',top:'66%'},{left:el.style.left,top:el.style.top},{left:'61%',top:'84%'}];if(reduced()){layer.classList.add('fp-demo-lit');message.textContent='拿火鉗 → 點柴火夾住 → 放到發亮的爐外地上。';let i=0;const next=()=>{position(hand,parseFloat(frames[i].left),parseFloat(frames[i].top));if(++i<3)handTimer=setTimeout(next,700);else handTimer=setTimeout(stopDemo,700);};next();}else{animations=[hand.animate(frames,{duration:2400,easing:'ease-in-out'})];handTimer=setTimeout(stopDemo,2400);}return true;}
  layer.addEventListener('pointerdown',idle);layer.addEventListener('keydown',idle);
  const observer=new ResizeObserver(arrange);observer.observe(plane);
  render();focus?.(state.step===0?49:69);
  function startDemo(){if(state.step!==0 || demoTimer)return;demonstrate(true);demoTimer=setTimeout(()=>{if(disposed)return;demonstrate(false);operate('demo');changed();focus?.(69);render();showWoodDemo();},2400);}
  return {startDemo,showWoodDemo,get dragging(){return Boolean(drag);},setPaused(value){if(reduced() && animations.length)stopDemo();paused=value;if(value){stopDemo();clearTimeout(idleTimer);}else{showWoodDemo();idle();}},dispose(){disposed=true;clearTimeout(demoTimer);clearTimeout(idleTimer);stopDemo();observer.disconnect();layer.remove();status.remove();}};
}
