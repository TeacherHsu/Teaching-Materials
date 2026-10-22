import { h } from '../../utils/dom.js';
import { SpeakButton } from '../../components/SpeakButton.js';

// Strategies do not award points. Predictions deliberately have no correctness flag.
export function chooseStrategy(strategy, index, selected = []) {
  if(!Number.isInteger(index) || !strategy.options[index])return null;
  if(strategy.type==='predict')return {selected:[index],complete:true};
  if(strategy.type==='summaryCard')return {selected:[index],complete:index===strategy.answer,feedback:index===strategy.answer?strategy.explanation:strategy.why[index]};
  if(!strategy.answer.includes(index))return {selected:[...selected],complete:false,feedback:strategy.hint};
  const next=[...new Set([...selected,index])];
  return {selected:next,complete:strategy.answer.every(i=>next.includes(i)),feedback:strategy.explanation || ''};
}
export const predictionReminder = (strategy, index) => `你猜的是：${strategy.options[index]}，課文怎麼說？`;
export function storySummary(config, states) {
  return config.scenes.filter((s,i)=>states[i]?.done && s.questions[0]?.operationType==='summaryCard').map(s=>s.questions[0].options[s.questions[0].answer].replace(/[。！]$/,'')).join('，')+'。';
}

export function mountStrategy({strategy, panel, plane, stage, states, onWords, onDone, focus, assetBase=''}) {
  let selected=[],result=null,disposed=false,finished=false;
  const nodes=[],timers=[];
  const say=text=>h('div',{class:'fp-spoken'},[h('p',{},text),SpeakButton({text})]);
  panel.append(say(strategy.prompt));
  const status=h('div',{role:'status','aria-live':'polite'});panel.append(status);
  function message(text){status.replaceChildren(say(text));}
  function choose(index,button){
    if(disposed || finished)return;
    result=chooseStrategy(strategy,index,selected);if(!result)return;
    selected=result.selected;
    if(strategy.type==='predict'){finish();return;}
    if(!strategy.answer.includes(index)){message(result.feedback);return;}
    button.classList.add('fp-strategy-hit');button.setAttribute('aria-pressed','true');
    const option=strategy.options[index];
    const ring=nodes.find(n=>n.dataset?.faceIndex===String(index));if(ring){ring.classList.add('is-bright');timers.push(setTimeout(()=>ring.classList.remove('is-bright'),650));}
    if(strategy.type==='emotionClue'){
      const words=(option.states || []).map(i=>states[i]).concat(option.words || []);
      onWords(words,strategy.meterTarget);message(words.join('、'));
    }else{
      message(result.feedback);
      const svg=h('div',{class:'fp-strategy-link','aria-hidden':'true'});
      // Coordinates live in the same full-bleed image plane as both targets.
      svg.innerHTML=`<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M ${option.x} ${option.y} Q ${option.x} ${strategy.result[1]} ${strategy.result[0]} ${strategy.result[1]}"/></svg>`;
      plane.append(svg);nodes.push(svg);
    }
    if(result.complete && !panel.querySelector('[data-strategy-next]'))panel.append(h('button',{type:'button','data-strategy-next':'true',class:'fp-button',onclick:finish},'繼續'));
  }
  function finish(){if(disposed || finished)return;finished=true;onDone(result);}
  const wrong=e=>{if(!e.target.closest('button'))message(strategy.hint);};
  if(strategy.type==='predict'){
    const row=h('div',{class:'fp-card-row'});panel.append(row);
    strategy.options.forEach((label,i)=>row.append(h('div',{class:'fp-answer-row'},[h('button',{type:'button',class:'fp-button',onclick:()=>choose(i)},label),SpeakButton({text:label})])));
  }else{
    strategy.options.forEach((option,i)=>{
      if(option.sprite){
        const art=h('img',{src:`${assetBase}sprites/${option.sprite}.webp`,alt:'','aria-hidden':'true',class:'fp-strategy-evidence',style:`left:${option.x}%;top:${option.y}%;width:${option.width || 10}%`});
        plane.append(art);nodes.push(art);
      }
      const [dx,dy]=option.markerOffset || [0,0];
      const button=h('button',{type:'button',class:`fp-strategy-target${option.face?' fp-face-marker':''}`,'aria-label':option.label,style:`left:${option.x+dx}%;top:${option.y+dy}%`,onclick:()=>choose(i,button)},'◉');
      button.addEventListener('focus',()=>focus(option.x));
      plane.append(button);nodes.push(button);
      if(option.face){const ring=h('span',{class:'fp-face-ring','data-face-index':String(i),'aria-hidden':'true',style:`left:${option.x}%;top:${option.y}%;width:${option.face.width}%;height:${option.face.height}%`});plane.append(ring);nodes.push(ring);}
      panel.append(h('div',{class:'fp-spoken'},[h('span',{},option.label),SpeakButton({text:option.label})]));
    });
    stage.addEventListener('click',wrong);focus(strategy.options[0].x);
  }
  return ()=>{disposed=true;timers.forEach(clearTimeout);nodes.forEach(n=>n.remove());stage.removeEventListener('click',wrong);panel.remove();};
}

// A reusable interlude with no contents rendered inside the opened container.
export function mountBag({entry,panel,plane,assetBase,onDone}) {
  const say=text=>h('div',{class:'fp-spoken'},[h('p',{},text),SpeakButton({text})]);
  panel.append(say(entry.prompt));
  const bag=h('button',{type:'button',class:'fp-strategy-bag',style:`left:${entry.object.x}%;top:${entry.object.y}%;width:${entry.object.width}%`,'aria-label':entry.label},[h('img',{src:`${assetBase}sprites/${entry.object.sprite}.webp`,alt:''})]);plane.append(bag);
  let opened=false,origin=null,disposed=false;
  const open=()=>{
    if(opened || disposed)return;opened=true;bag.classList.add('is-open');bag.setAttribute('aria-label',entry.openedMessage);
    panel.replaceChildren(say(entry.openedMessage),h('button',{type:'button',class:'fp-button',onclick:()=>{if(!disposed)onDone();}},'繼續'));
  };
  bag.onclick=open;
  bag.onpointerdown=e=>{origin=[e.clientX,e.clientY];bag.setPointerCapture(e.pointerId);};
  bag.onpointerup=e=>{if(origin && Math.hypot(e.clientX-origin[0],e.clientY-origin[1])>=20)open();origin=null;};
  bag.onpointercancel=()=>{origin=null;};
  return ()=>{disposed=true;bag.remove();panel.remove();};
}
