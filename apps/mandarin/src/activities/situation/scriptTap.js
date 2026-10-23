import { h } from '../../utils/dom.js';

// Group the actual reading queue, never copy dialogue into public configuration.
export function groupScriptLines(lines, speakers = {}) {
  const groups=[];
  for(const ref of lines){
    const speaker=speakers[`${ref.para}:${ref.n}`] || '';
    if(groups.at(-1)?.speaker===speaker)groups.at(-1).lines.push(ref);
    else groups.push({speaker,lines:[ref]});
  }
  return groups;
}
// speakerSpots[說話者] 可以是單一位置，或依插畫分開的位置陣列（每筆用 imageIndices 指定適用的插畫）。
export function speakerSpot(scene, speaker, imageIndex, operationStep) {
  const entry=scene.art.speakerSpots?.[speaker];
  const spots=Array.isArray(entry) ? entry : entry ? [entry] : [];
  return spots.find(spot=>!spot.hiddenSteps?.includes(operationStep) && (!spot.imageIndices || spot.imageIndices.includes(imageIndex))) || null;
}
export function needsScriptTap(config, mode, group, scene, imageIndex, operationStep) {
  return Boolean(config.scriptTap && mode!=='auto' && group.speaker && group.speaker!=='旁白' && speakerSpot(scene,group.speaker,imageIndex,operationStep));
}
// One controller owns the queue and its generation. Repeated activation and stale
// speech completions cannot advance another line; pausing resumes the same unit.
export function createScriptTapPlayback({config,scene,lines,mode='tap',imageIndex,operationStep,onWait,onLine,read,onDone,cancel=()=>{}}) {
  const groups=groupScriptLines(lines,config.speakers);
  let groupIndex=0,lineIndex=0,started=false,waiting=false,paused=false,disposed=false,token=0;
  function run(){
    if(paused || disposed)return;
    const group=groups[groupIndex];
    if(!group){disposed=true;onDone();return;}
    // imageIndex 可傳函式：輪到這句時才讀「當下畫面上的插畫」，避免開場前就取到舊插畫。
    const shown=typeof imageIndex==='function' ? imageIndex() : imageIndex;
    if(!started && needsScriptTap(config,mode,group,scene,shown,operationStep)){
      waiting=true;onWait(group,speakerSpot(scene,group.speaker,shown,operationStep));return;
    }
    started=true;waiting=false;
    if(lineIndex>=group.lines.length){groupIndex++;lineIndex=0;started=false;run();return;}
    const ref=group.lines[lineIndex],version=++token;
    onLine(ref);
    Promise.resolve(read(ref)).then(()=>{
      if(disposed || paused || version!==token)return;
      lineIndex++;run();
    });
  }
  function activate(){if(!waiting || paused || disposed)return false;waiting=false;started=true;run();return true;}
  return {
    start:run, activate,
    next(){if(waiting)return activate();if(disposed || paused)return false;token++;cancel();lineIndex++;run();return true;},
    pause(){if(disposed)return;paused=true;token++;cancel();},
    resume(){if(!paused || disposed)return;paused=false;run();},
    remaining(){return groups.slice(groupIndex).flatMap((g,i)=>i?g.lines:g.lines.slice(lineIndex));},
    dispose(){disposed=true;token++;cancel();},
    get waiting(){return waiting;}
  };
}
export function mountSpeakerTap({plane,speaker,spot,activate,focus}) {
  let used=false;
  const [dx,dy]=spot.markerOffset || [0,spot.face.height/2+6];
  const invoke=()=>{if(used)return; if(activate()){used=true;dispose();}};
  const marker=h('button',{type:'button',class:'fp-strategy-target fp-face-marker','aria-label':`聽${speaker}說`,style:`left:${spot.x+dx}%;top:${spot.y+dy}%`,onclick:invoke},'◉');
  // Native buttons support keyboard click; explicit keys also work in embedded
  // webviews. preventDefault suppresses the additional native activation.
  const key=e=>{if(e.key==='Enter' || e.key===' '){e.preventDefault();invoke();}};
  const face=h('button',{type:'button',class:'fp-speaker-face','aria-label':`聽${speaker}說`,style:`left:${spot.x}%;top:${spot.y}%;width:${spot.face.width}%;height:${spot.face.height}%`,onclick:invoke});
  const ring=h('span',{class:'fp-face-ring','aria-hidden':'true',style:`left:${spot.x}%;top:${spot.y}%;width:${spot.face.width}%;height:${spot.face.height}%`});
  for(const node of [marker,face]){node.addEventListener('keydown',key);node.addEventListener('focus',()=>focus(spot.x+dx));}
  plane.append(ring,face,marker);focus(spot.x+dx/2);
  function dispose(){for(const node of [ring,face,marker])node.remove();}
  return dispose;
}
