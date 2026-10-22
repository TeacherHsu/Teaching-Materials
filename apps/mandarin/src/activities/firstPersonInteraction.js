import { operationObjects, scoopGesture, woodOutside } from './firstPersonLayout.js';
import { SpeakButton } from '../components/SpeakButton.js';
// Serializable operation state; wrong drops never change progress or rewards.
export function operationState(scene, raw = {}) {
  const max = scene.operation.steps.length;
  const step = Number.isInteger(raw.step) ? Math.max(0, Math.min(max, raw.step)) : 0;
  const validWood = ['wood-1','wood-2','wood-3'];
  const collected = [...new Set((Array.isArray(raw.collected) ? raw.collected : scene.operation.steps.slice(0,step)).filter(x=>validWood.includes(x)))];
  return { step, ...(collected.length ? { collected } : {}) };
}
export function operate(scene, state, action) {
  const expected = scene.operation.steps[state.step];
  if (!expected) return false;
  if (expected?.startsWith('wood-')) {
    if (!['wood-1','wood-2','wood-3'].includes(action) || state.collected?.includes(action)) return false;
    state.collected = [...(state.collected || []), action];
  } else if (expected !== action) return false;
  state.step++; return true;
}
export const operationComplete = (scene, state) => state.step === scene.operation.steps.length;
export const heatFor = (scene, state) => scene.act === 4 ? 1 - Math.max(0, state.step - 1) / 3 : 1;

// Source-image coordinates remain valid while the illustration pans or resizes.
export function mountOperation(plane, { scene, state, changed, heat, demonstrate, chime, focus }) {
  const base = `${(import.meta.env?.BASE_URL || '/')}assets/first-person/115AG3H04/sprites/`;
  const layer = document.createElement('div'); layer.className = 'fp-operation'; plane.append(layer);
  let selected = null, dragging = null, suppress = false, timer, busy = false, disposed = false;
  const status = document.createElement('div'); status.className = 'fp-operation-status'; status.setAttribute('role','status');
  const message = document.createElement('span'); status.append(message, SpeakButton({text:()=>message.textContent})); plane.parentElement.parentElement.append(status);
  const objects = [], targets = [];
  function item(label, sprite, x, y, action, width = 10, ratio = .5, target = false) {
    const el = document.createElement('button'); el.type='button'; el.className=`fp-object ${target ? 'fp-drop-target' : ''}`; el.setAttribute('aria-label',label); el.dataset.action=action;
    el.style.width=`${width}%`; el.style.aspectRatio=String(1/ratio); el.style.left=`${x}%`; el.style.top=`${y}%`;
    if(sprite) { const img=new Image(); img.src=base+sprite+'.webp'; img.alt=''; img.draggable=false; img.onerror=()=>{ img.remove(); el.textContent=label; }; el.append(img); } else el.classList.add('fp-glow');
    layer.append(el); const obj={el,x,y,action,label}; (target?targets:objects).push(obj);
    el.onclick=()=>{ if(suppress) return; if(target) drop(obj); else select(obj); };
    if(!target) {
      el.onpointerdown=e=>{ if(e.button!==0) return; if(busy || el.disabled || dragging)return; e.stopPropagation(); dragging={obj,id:e.pointerId,x:e.clientX,y:e.clientY,moved:false,dipped:false,lifted:false}; el.setPointerCapture(e.pointerId); layer.classList.add('is-dragging'); };
      el.onpointermove=e=>{
        if(!dragging || dragging.id!==e.pointerId)return;
        const r=plane.getBoundingClientRect(), point={x:(e.clientX-r.left)/r.width*100,y:(e.clientY-r.top)/r.height*100};
        dragging.moved ||= Math.hypot(e.clientX-dragging.x,e.clientY-dragging.y)>6;
        if(dragging.moved){ el.style.left=`${point.x}%`; el.style.top=`${point.y}%`; }
        if(scene.act===2){ const next=scoopGesture(dragging,point); if(next.dipped && !dragging.dipped){ setSprite(obj,'ladle-full'); splash(); } Object.assign(dragging,next); }
      };
      el.onpointerup=e=>{
        if(!dragging)return;
        const gesture=dragging; dragging=null; layer.classList.remove('is-dragging');
        if(gesture.moved){
          selected=obj;
          if(scene.act===2){ if(gesture.lifted) {suppress=true;setTimeout(()=>suppress=false,0);pour(obj);return;} else {setSprite(obj,'ladle-empty');feedback('把勺子放入水面，再往上拉。');} }
          else if(scene.act===4){ const r=plane.getBoundingClientRect(); if(woodOutside({x:(e.clientX-r.left)/r.width*100,y:(e.clientY-r.top)/r.height*100}))commit(obj.action); else feedback('把柴往爐口外拉。'); }
          else { const dest=targets.find(t=>{const r=t.el.getBoundingClientRect();return e.clientX>=r.left-20 && e.clientX<=r.right+20 && e.clientY>=r.top-20 && e.clientY<=r.bottom+20;});if(dest)drop(dest); }
          suppress=true;setTimeout(()=>suppress=false,0);
        }
        if(!(scene.act===1 && state.collected?.includes(obj.action)))reset(obj);
      };
      el.onpointercancel=()=>{ dragging=null; layer.classList.remove('is-dragging'); reset(obj); if(scene.act===2)setSprite(obj,'ladle-empty'); feedback('慢慢來，可以改用點選。'); };
    }
    return obj;
  }
  function reset(o){ o.el.style.left=`${o.x}%`; o.el.style.top=`${o.y}%`; }
  function feedback(text){ message.textContent=text; }
  function commit(action){ if(!operate(scene,state,action)){ feedback('慢慢來，先完成目前的步驟。'); return false; } selected=null; if(scene.act===1)focus?.(47.5); heat(heatFor(scene,state)); changed(); render(); return true; }
  function select(o){
    if(busy || operationComplete(scene,state))return;
    if(scene.act===2){ scoopAnimation(o); return; }
    if(scene.act===1 && o.action==='bell'){ chime(); o.el.classList.remove('fp-swing'); void o.el.offsetWidth; o.el.classList.add('fp-swing'); if(state.step===0) commit('bell'); else feedback('風鈴輕輕擺動。'); return; }
    if(scene.act===3){ if(o.action==='pot') feedback('水面還在冒泡。'); if(o.action==='ladle') feedback('你剛才用勺子舀了，水仍在滾。'); if(commit(o.action) && o.action==='fire') { layer.classList.add('fp-discovery'); feedback('你找到了鍋下的線索。'); } return; }
    if(scene.act===4 && state.step===0){
      if(timer) return; demonstrate(true); feedback('先看師傅使用工具，再換你試試。');
      timer=setTimeout(()=>{ timer=null; if(disposed)return; demonstrate(false); commit('demo'); },2400); return;
    }
    if(scene.act===4){ busy=true; o.el.style.left='58%'; o.el.style.top='78%'; later(()=>{busy=false;commit(o.action);},450); return; }
    selected=o; feedback(`你選了${o.label}，再點光暈。`); objects.forEach(x=>x.el.setAttribute('aria-pressed',String(x===o)));
  }
  function drop(t){
    if(!selected){ feedback('先拿起物件，再點光暈。'); return; }
    const expected=scene.operation.steps[state.step];
    const action=selected.action;
    if(t.action!=='pile' || !action.startsWith('wood-'))return;
    if(commit(action)) {  feedback(operationComplete(scene,state)?(scene.act===2?'水還在滾……好像沒有用？':'完成了！你可以解鎖這一段原句。'):'做到了，再接著試試。'); }
  }
  for(const spec of operationObjects[scene.act]) item(...spec);
  function setSprite(o,name){ const img=o.el.querySelector('img');if(img)img.src=base+name+'.webp'; }
  function splash(){ layer.classList.remove('fp-splash'); void layer.offsetWidth; layer.classList.add('fp-splash'); }
  function later(fn,delay){ timer=setTimeout(()=>{if(!disposed)fn();},delay); }
  function pour(o){
    if(busy)return; busy=true; o.el.style.left='64%';o.el.style.top='54%';
    layer.classList.add('fp-pouring'); splash();
    later(()=>{ layer.classList.remove('fp-pouring'); setSprite(o,'ladle-empty'); reset(o);busy=false;commit('scoop'); if(operationComplete(scene,state))feedback('水還在滾……好像沒有用？'); },850);
  }
  function scoopAnimation(o){
    if(busy)return;busy=true;o.el.style.left='64%';o.el.style.top='69%';
    later(()=>{setSprite(o,'ladle-full');splash();o.el.style.top='54%';later(()=>{busy=false;pour(o);},400);},350);
  }
  function render(){
    const expected=scene.operation.steps[state.step];
    objects.forEach(o=>{ o.el.hidden=(scene.act===1 || scene.act===4) && o.action.startsWith('wood-') && (state.collected || scene.operation.steps.slice(0,state.step)).includes(o.action); if(scene.act===4)o.el.disabled=state.step===0 ? o.action!=='demo' : o.action==='demo'; });
    if(scene.act===1)objects.filter(o=>o.action.startsWith('wood-') && state.collected?.includes(o.action)).forEach((o,i)=>{o.el.hidden=false;o.el.disabled=true;o.el.style.left='64%';o.el.style.top=`${60-i*2}%`;o.el.classList.add('fp-stacked');});
    targets.forEach(t=>{ t.el.hidden=operationComplete(scene,state); });
    status.classList.toggle('fp-operation-complete', operationComplete(scene,state));
    feedback(operationComplete(scene,state)?(scene.act===2?'水還在滾……好像沒有用？':'💧 完成操作！解鎖原句吧。'):scene.act===2?`第 ${Math.min(3,state.step+1)} 次：按住勺子往下舀，再往上拉；也可以點勺子。`:scene.act===3?({pot:'先看看水面：水還在冒泡。',ladle:'再看看勺子：剛才舀了也沒有用。',fire:'找找鍋下燒得火紅的木柴。'}[expected]):scene.act===4 && state.step===0?'點火鉗，先看師傅示範。':scene.act===4?'把爐口裡的柴往外拖，也可以點柴。':'點風鈴，再把木柴拖到柴堆，也可以點木柴再點柴堆。');
    heat(heatFor(scene,state));
  }
  render();
  focus?.(scene.act===1 ? (state.step===0?29:47.5) : scene.act===2?61:scene.act===4?64:55);
  if(scene.act===4 && state.step===0) select(objects[0]);
  return { get dragging(){return Boolean(dragging);}, dispose(){disposed=true;clearTimeout(timer);status.remove();layer.remove();} };
}
