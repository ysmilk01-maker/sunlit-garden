// Presentation only: the scoring engine owns every value in the supplied model.
const NS='http://www.w3.org/2000/svg';
const signed=n=>n>0?`+${n}`:String(n);
export function clearInfluence(board){
  if(!board)return;
  board.querySelectorAll('.influence-layer,.influence-marker,.influence-origin-label').forEach(n=>n.remove());
  board.querySelectorAll('.influence-source,.influence-positive,.influence-negative,.influence-mixed').forEach(n=>{
    n.classList.remove('influence-source','influence-positive','influence-negative','influence-mixed');
    const original=n.getAttribute('data-influence-original-label');
    if(original!==null){n.setAttribute('aria-label',original);n.removeAttribute('data-influence-original-label');}
  });
}
export function drawInfluence(board,model,{preview=false}={}){
  clearInfluence(board);if(!board||!model)return;
  const cell=index=>board.querySelector(`[data-slot="${index}"],[data-cell="${index}"]`);
  const source=cell(model.source.index),box=board.getBoundingClientRect();
  if(!box.width||!box.height)return;
  const center=node=>{const b=node.getBoundingClientRect();return {x:b.x-box.x+b.width/2,y:b.y-box.y+b.height/2,w:b.width,h:b.height};};
  if(source){source.classList.add('influence-source');const badge=board.ownerDocument.createElement('span');badge.className='influence-origin-label';badge.textContent=preview?'기준 자리':'영향 시작';badge.setAttribute('aria-hidden','true');source.append(badge);}
  const layer=board.ownerDocument.createElementNS(NS,'svg');layer.classList.add('influence-layer');layer.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);layer.setAttribute('aria-hidden','true');
  const start=source?center(source):null;
  for(const target of model.targets){
    const node=cell(target.index);if(!node)continue;
    const kind=target.delta>0?'positive':target.delta<0?'negative':'mixed';node.classList.add(`influence-${kind}`);
    const marker=board.ownerDocument.createElement('span');marker.className=`influence-marker influence-marker--${kind}`;marker.textContent=target.delta===0?'±0':signed(target.delta);marker.setAttribute('aria-hidden','true');
    marker.title=(target.reasons||[]).map(r=>`${r.label} ${signed(r.delta)}`).join(' · ');node.append(marker);
    const label=node.getAttribute('aria-label');if(label!==null){node.setAttribute('data-influence-original-label',label);node.setAttribute('aria-label',`${label}. ${preview?'기준 자리에 심으면':'선택 식물의 영향'} ${signed(target.delta)}점. ${marker.title}`);}
    if(!start)continue;
    const end=center(node),dx=end.x-start.x,dy=end.y-start.y,length=Math.hypot(dx,dy);if(!length)continue;
    const ux=dx/length,uy=dy/length,padA=Math.min(start.w,start.h)*.35,padB=Math.min(end.w,end.h)*.36;
    const ax=start.x+ux*padA,ay=start.y+uy*padA,bx=end.x-ux*padB,by=end.y-uy*padB;
    const line=board.ownerDocument.createElementNS(NS,'path');line.setAttribute('d',`M${ax},${ay} L${bx},${by}`);line.setAttribute('class',`influence-line influence-line--${kind}${target.relation==='adjacent'?'':' influence-line--distant'}`);layer.append(line);
    const head=board.ownerDocument.createElementNS(NS,'path');const size=Math.min(5,end.w*.1);head.setAttribute('d',`M${bx-ux*size-uy*size*.6},${by-uy*size+ux*size*.6} L${bx},${by} L${bx-ux*size+uy*size*.6},${by-uy*size-ux*size*.6}`);head.setAttribute('class',`influence-line influence-line--${kind}`);layer.append(head);
  }
  board.append(layer);
}
