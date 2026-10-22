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
  const base = `${import.meta.env.BASE_URL}assets/first-person/115AG3H04/sprites/`;
  const layer = document.createElement('div'); layer.className = 'fp-operation'; plane.append(layer);
  let selected = null, dragging = null, suppress = false, timer, armed = false, disposed = false;
  const status = document.createElement('div'); status.className = 'fp-operation-status'; status.setAttribute('role','status');
  const message = document.createElement('span'); status.append(message, SpeakButton({text:()=>message.textContent})); plane.parentElement.parentElement.append(status);
  const objects = [], targets = [];
  function item(label, sprite, x, y, action, target = false) {
    const el = document.createElement('button'); el.type='button'; el.className=`fp-object ${target ? 'fp-drop-target' : ''}`; el.setAttribute('aria-label',label); el.title=label;
    el.style.left=`${x}%`; el.style.top=`${y}%`;
    if(sprite) { const img=new Image(); img.src=base+sprite+'.webp'; img.alt=''; img.draggable=false; img.onerror=()=>{ img.remove(); el.textContent=label; }; el.append(img); } else el.textContent=label;
    layer.append(el); const obj={el,x,y,action,label}; (target?targets:objects).push(obj);
    el.onclick=()=>{ if(suppress) return; if(target) drop(obj); else select(obj); };
    if(!target) {
      el.onpointerdown=e=>{ if(e.button!==0) return; if(scene.act===4 && obj.action==='demo' && state.step>0) armed=true; e.stopPropagation(); dragging={obj,id:e.pointerId,x:e.clientX,y:e.clientY,moved:false}; el.setPointerCapture(e.pointerId); layer.classList.add('is-dragging'); };
      el.onpointermove=e=>{ if(!dragging || dragging.id!==e.pointerId) return; const r=plane.getBoundingClientRect(); dragging.moved ||= Math.hypot(e.clientX-dragging.x,e.clientY-dragging.y)>6; if(dragging.moved) { el.style.left=`${(e.clientX-r.left)/r.width*100}%`; el.style.top=`${(e.clientY-r.top)/r.height*100}%`; } };
      el.onpointerup=e=>{ if(!dragging) return; const moved=dragging.moved; dragging=null; layer.classList.remove('is-dragging'); if(moved) { selected=obj; const dest=targets.find(t=>{ const r=t.el.getBoundingClientRect(); return e.clientX>=r.left-20 && e.clientX<=r.right+20 && e.clientY>=r.top-20 && e.clientY<=r.bottom+20; }); if(dest) drop(dest); else feedback('再試一次，把物件移到亮框裡。'); suppress=true; setTimeout(()=>suppress=false,0); } reset(obj); };
      el.onpointercancel=()=>{ dragging=null; layer.classList.remove('is-dragging'); reset(obj); feedback('慢慢來，可以改用點選。'); };
    }
    return obj;
  }
  function reset(o){ o.el.style.left=`${o.x}%`; o.el.style.top=`${o.y}%`; }
  function feedback(text){ message.textContent=text; }
  function commit(action){ if(!operate(scene,state,action)){ feedback('慢慢來，先完成目前的步驟。'); return false; } selected=null; heat(heatFor(scene,state)); changed(); render(); return true; }
  function select(o){
    if(scene.act===1 && o.action==='bell'){ chime(); o.el.classList.remove('fp-swing'); void o.el.offsetWidth; o.el.classList.add('fp-swing'); if(state.step===0) commit('bell'); else feedback('風鈴輕輕擺動。'); return; }
    if(scene.act===3){ if(o.action==='pot') feedback('水面還在冒泡。'); if(o.action==='ladle') feedback('你剛才用勺子舀了，水仍在滾。'); if(commit(o.action) && o.action==='fire') { layer.classList.add('fp-discovery'); feedback('你找到了鍋下的線索。'); } return; }
    if(scene.act===4 && state.step===0){
      if(timer) return; demonstrate(true); feedback('先看師傅使用工具，再換你試試。');
      timer=setTimeout(()=>{ timer=null; if(disposed)return; demonstrate(false); commit('demo'); },2400); return;
    }
    if(scene.act===4) { if(o.action==='demo') { armed=true; selected=o; feedback('你拿好了火鉗，選一根柴火。'); return; } if(!armed) { feedback('先拿起火鉗，再選柴火。'); return; } }
    selected=o; feedback(`你選了${o.label}，再點亮框。`); objects.forEach(x=>x.el.setAttribute('aria-pressed',String(x===o)));
  }
  function drop(t){
    if(!selected){ feedback('先拿起物件，再點亮框。'); return; }
    if(scene.act===4 && !armed) { feedback('先拿起火鉗，再選柴火。'); return; }
    const expected=scene.operation.steps[state.step];
    const action=scene.act===4 && selected.action==='demo' ? ['wood-1','wood-2','wood-3'].find(id=>!state.collected?.includes(id)) : scene.act===1 || scene.act===4 ? selected.action : t.action;
    if((scene.act===1 && t.action!=='pile') || (scene.act===4 && (state.step===0 || t.action!=='out')) || (action!==expected && !((scene.act===1 || scene.act===4) && expected?.startsWith('wood-') && action?.startsWith('wood-') && !state.collected?.includes(action)))){ feedback('再試一次，看看目前的亮框。'); return; }
    const held = selected;
    if(scene.act===2) { held.x=action==='pour'?51:t.x; held.y=action==='pour'?48:t.y; reset(held); }
    if(commit(action)) { if(scene.act===4) armed=false; feedback(operationComplete(scene,state)?(scene.act===2?'水還在滾……好像沒有用？':'完成了！你可以解鎖這一段原句。'):'做到了，再接著試試。'); }
  }
  if(scene.act===1){ item('風鈴','bell',29,16,'bell'); for(let i=0;i<3;i++)item(`第${i+1}根木柴`,'wood',30+i*8,58+i*2,`wood-${i+1}`); item('柴堆',null,64,62,'pile',true); }
  if(scene.act===2){ item('勺子','ladle-empty',51,48,'ladle'); item('入水',null,65,68,'dip',true); item('舀起',null,60,51,'lift',true); item('鍋上方',null,73,49,'above',true); item('倒回鍋中',null,73,64,'pour',true); }
  if(scene.act===3){ item('水面',null,62,30,'pot'); item('勺子','ladle-empty',44,48,'ladle'); item('火紅木柴','wood-burning',59,68,'fire'); }
  if(scene.act===4){ item('火鉗','tongs',51,59,'demo'); for(let i=0;i<3;i++)item(`第${i+1}根柴火`,'wood-burning',69+i*4,73,`wood-${i+1}`); item('抽到爐外',null,53,80,'out',true); }
  function render(){
    const expected=scene.operation.steps[state.step];
    objects.forEach(o=>{ o.el.hidden=(scene.act===1 || scene.act===4) && o.action.startsWith('wood-') && (state.collected || scene.operation.steps.slice(0,state.step)).includes(o.action); if(scene.act===4 && o.action.startsWith('wood-')) o.el.disabled=state.step===0; });
    targets.forEach(t=>{ t.el.hidden=operationComplete(scene,state) || (scene.act===2 && t.action!==expected); });
    if(scene.act===2){ const img=objects[0].el.querySelector('img'); if(img) img.src=base+(['lift','above','pour'].includes(expected)?'ladle-full':'ladle-empty')+'.webp'; }
    if(scene.act===2 && expected) { const destination=targets.find(t=>t.action===expected); focus?.((objects[0].x+destination.x)/2); }
    status.classList.toggle('fp-operation-complete', operationComplete(scene,state));
    feedback(operationComplete(scene,state)?'💧 完成操作！解鎖原句吧。':scene.act===2?`第 ${Math.floor(state.step/4)+1} 次：${{dip:'拿起勺子，移入水中',lift:'把水舀起',above:'拉到鍋上方',pour:'把水倒回鍋中'}[expected]}`:scene.act===3?({pot:'先看看水面：水還在冒泡。',ladle:'再看看勺子：剛才舀了也沒有用。',fire:'找找鍋下燒得火紅的木柴。'}[expected]):scene.act===4 && state.step===0?'點火鉗，先看師傅示範。':scene.act===4?'先點火鉗，再選一根柴火，拖或點到爐外。':'點風鈴，再把木柴拖到柴堆，也可以點木柴再點柴堆。');
    heat(heatFor(scene,state));
  }
  render();
  if(scene.act===4 && state.step===0) select(objects[0]);
  return { get dragging(){return Boolean(dragging);}, dispose(){disposed=true;clearTimeout(timer);status.remove();layer.remove();} };
}
