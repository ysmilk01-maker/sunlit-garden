import {transplant,forecast,RUN_DAYS} from './evolution-core.mjs?v=20261026-29';

// The projection retains evolution clocks and uses the actual score engine.
// It assumes no subsequent planting, evolution or upgrade.
export function transplantPreview(state,from,to){
  const next=transplant(state,from,to);
  if(next===state)return null;
  const project=s=>({...s,day:s.day+1,board:s.board.map(t=>t&&t.type!=='well'?{...t,age:Math.min(7,t.age+1)}:t)});
  return {from,to,today:forecast(next).total-forecast(state).total,
    tomorrow:state.day<RUN_DAYS?forecast(project(next)).total-forecast(project(state)).total:null};
}

// Visibility changes finish an in-flight delay immediately: background timer
// throttling must never leave the harvest controls locked.
export function presentationDelay(ms,{document:doc=globalThis.document,reduced}={}){
  if(doc?.hidden||reduced?.matches)return Promise.resolve(false);
  return new Promise(resolve=>{
    let timer;
    const finish=()=>{clearTimeout(timer);doc?.removeEventListener('visibilitychange',change);reduced?.removeEventListener?.('change',change);resolve(!(doc?.hidden||reduced?.matches));};
    const change=()=>{if(doc?.hidden||reduced?.matches)finish();};
    doc?.addEventListener('visibilitychange',change);reduced?.addEventListener?.('change',change);
    timer=setTimeout(finish,Math.max(0,Math.min(200,ms)));
  });
}
