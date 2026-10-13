import {PLANTS,GARDENS,STORAGE_KEY,newRun,place,undo,preview,water,advance,hydrate,serialize} from './droplet-core.mjs?v=20261013-10';
import {plantArt} from './garden-art.mjs?v=20261013-8';
import {createGardenMusic} from './garden-music.mjs?v=20261013-7';
import {createDropletAudio} from './droplet-audio.mjs?v=20261013-10.1';

const $=id=>document.getElementById(id);
const PROFILE_KEY='sunlit-garden:droplet:profile:v1';
const VERSION=1;
const names={sunflower:'해바라기',mint:'민트',strawberry:'딸기',hive:'벌집',rock:'돌'};
const roles={sunflower:'물을 아래로',mint:'물을 좌우로',strawberry:'두 번 익혀 수확',hive:'옆 꽃이 피면 벌 출발'};
const arrows={sunflower:'↓',mint:'← →',strawberry:'↓',hive:'↗'};
const descriptions={sunflower:'물 한 방울을 받아 꽃이 피고, 바로 아래 칸으로 물을 보내요. 빈칸을 만나면 거기서 멈춰요.',mint:'받은 물을 왼쪽과 오른쪽으로 한 방울씩 보내요. 두 화단을 동시에 깨우는 갈림길이에요.',strawberry:'물이나 벌이 두 번 찾아오면 수확돼 빈 땅으로 돌아가요. 물을 받으면 아래로도 한 번 보내요.',hive:'옆의 해바라기나 민트가 피면, 가장 가까운 딸기에 벌을 보내 한 번 익혀요. 물을 직접 부으면 아무 일도 없어요.'};
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dropIcon='<svg viewBox="0 0 24 28" aria-hidden="true"><path d="M12 2C10 8 3 13 3 18a9 9 0 0 0 18 0C21 13 14 8 12 2Z" fill="currentColor"/><path d="M7 18c0 3 2 5 5 5" fill="none" stroke="#ffffff" stroke-opacity=".65" stroke-width="2" stroke-linecap="round"/></svg>';
let storage,rawRun=null;try{storage=window.localStorage;rawRun=storage.getItem(STORAGE_KEY);}catch{}
let state=hydrate(rawRun)||newRun(1),profile=loadProfile();
let damagedSave=rawRun!==null&&!hydrate(rawRun),saveFailed=false,selected=null,column=null,busy=false,homeVisible=true,lastTrigger=null,audioContext=null,skipRequested=false;
let abortWait=null,activeAnimations=new Set(),plantingEffect=null,helpPage=0;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const landscape=matchMedia('(orientation: landscape) and (pointer: coarse), (orientation: landscape) and (max-height: 600px) and (max-width: 1000px)');
const music=createGardenMusic({audio:$('drop-bgm'),getContext:audio,enabled:profile.options.music,volume:profile.options.volume,onChange:musicStatus});
const sfx=createDropletAudio({getContext:audio,isEnabled:()=>profile.options.sound,isHidden:()=>document.hidden||landscape.matches});
const garden=()=>GARDENS.find(item=>item.id===state.stageId)||GARDENS[0];
const goal=()=>garden().goal;
const say=text=>{$('announcement').textContent=text;};

function loadProfile(){
  let options={music:true,volume:.3,sound:true,haptics:true};
  try{
    const old=JSON.parse(storage?.getItem('sunlit-garden:features:v1')||'null')?.options;
    if(old){if(typeof old.music==='boolean')options.music=old.music;if(Number.isFinite(old.musicVolume))options.volume=Math.max(0,Math.min(1,old.musicVolume));if(typeof old.sound==='boolean')options.sound=old.sound;if(typeof old.haptics==='boolean')options.haptics=old.haptics;}
    const saved=JSON.parse(storage?.getItem(PROFILE_KEY)||'null');
    if(saved?.version===VERSION){
      for(const key of ['music','sound','haptics'])if(typeof saved.options?.[key]==='boolean')options[key]=saved.options[key];
      if(Number.isFinite(saved.options?.volume))options.volume=Math.max(0,Math.min(1,saved.options.volume));
      return {version:VERSION,cleared:[...new Set((Array.isArray(saved.cleared)?saved.cleared:[]).filter(id=>GARDENS.some(g=>g.id===id)))],options};
    }
  }catch{}
  return {version:VERSION,cleared:[],options};
}
function save(){
  if(damagedSave){statusText();return false;}
  try{
    const data=serialize(state);if(!storage||!data)throw new Error('Save unavailable');
    storage.setItem(STORAGE_KEY,data);storage.setItem(PROFILE_KEY,JSON.stringify(profile));saveFailed=false;
  }catch{saveFailed=true;}
  statusText();return !saveFailed;
}
function statusText(){$('save-status').textContent=damagedSave?'저장된 정원을 읽지 못했어요 · 시작 화면에서 확인해 주세요':saveFailed?'저장 공간을 확인해 주세요 · 지금 정원은 창 안에 있어요':profile.options.sound?'이 브라우저에 자동 저장 · 기존 정원 기록도 그대로':'자동 저장 · 효과음 꺼짐 · 위의 ♪에서 켤 수 있어요';}
function reconcileClear(){if(state.phase==='won'&&!profile.cleared.includes(state.stageId)){profile.cleared.push(state.stageId);profile.cleared.sort((a,b)=>a-b);}}
function unlocked(id){return id===1||profile.cleared.includes(id-1)||profile.cleared.includes(id);}
function audio(){audioContext??=new (window.AudioContext||window.webkitAudioContext)();return audioContext;}
function gesture(){music.activate();}
function vibrate(pattern){if(profile.options.haptics&&navigator.vibrate)try{navigator.vibrate(pattern);}catch{}}
function musicStatus(){const text=$('music-status');if(text){const s=music.getStatus().state;text.textContent=({playing:'BEATWAVE · James K',off:'음악 꺼짐',blocked:'재생 버튼을 눌러 주세요',error:'음악을 불러오지 못했어요',loading:'음악 준비 중',paused:'잠시 쉬는 중',idle:'재생 버튼을 누르면 시작해요'})[s]||'';}}

function openDialog(title,html,mode='info'){
  lastTrigger=document.activeElement;$('dialog-title').textContent=title;$('dialog-content').innerHTML=html;$('drop-dialog').dataset.mode=mode;
  if(!$('drop-dialog').open)$('drop-dialog').showModal();
}
function closeDialog(){$('drop-dialog').close();if(lastTrigger?.isConnected&&!lastTrigger.disabled)lastTrigger.focus();}
function art(tile,small=false){if(tile.type==='rock')return '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M15 69 24 41 44 29 74 37 87 66 72 82 32 81Z" fill="#a5aa99"/><path d="m24 41 20-12 30 8-15 25-37 7Z" fill="#c5caba"/><path d="m59 62 15-25 13 29-15 16Z" fill="#858d7c"/></svg>';return plantArt(tile.type,tile.type==='strawberry'?(tile.growth?2:1):2,{small});}
function renderWelcome(){
  $('welcome-status').textContent=profile.cleared.length===3?'세 정원을 깨웠어요 · 이번엔 다른 물길로':profile.cleared.length?`${profile.cleared.length}개의 정원을 깨웠어요`:'작은 선택이 큰 연쇄가 되는 곳';
  $('start').innerHTML=damagedSave?'저장된 정원 확인하기':rawRun||state.actions?.length?`정원 이어가기 <span>${state.stageId}번째 정원 ↗</span>`:'첫 물방울 떨어뜨리기 <span aria-hidden="true">↗</span>';
  $('welcome-diorama').innerHTML=`<span class="diorama-drop">${dropIcon}</span><span class="diorama-stem" aria-hidden="true"></span>${['sunflower','mint','strawberry'].map((type,i)=>`<span class="diorama-plant diorama-plant-${i}">${art({type,growth:1})}</span>`).join('')}<span class="diorama-caption">한 방울, 세 송이의 시작</span>`;
}
function render(){
  clearPlanting();
  const activeId=document.activeElement?.id;
  $('welcome').hidden=!homeVisible;$('play').hidden=homeVisible;
  if(homeVisible){renderWelcome();statusText();return;}
  const g=garden(),total=g.turns||6;
  $('chapter-name').textContent=`0${g.id} / 03 · ${g.name}`;
  $('turn-label').textContent=state.phase==='build'?`물주기 ${state.turn} / ${total}`:'정원의 기록';
  $('turn-dots').innerHTML=Array.from({length:total},(_,i)=>`<i class="${i<state.turn-1||state.phase!=='build'?'done':i===state.turn-1?'current':''}"></i>`).join('');
  $('harvest-goal').classList.toggle('complete',state.totalHarvests>=goal().harvests);
  $('chain-goal').classList.toggle('complete',state.bestChain>=goal().chain);
  $('harvest-goal').innerHTML=`<span aria-hidden="true">🍓</span><span>수확 <strong>${state.totalHarvests}<small> / ${goal().harvests}</small></strong></span>`;
  $('chain-goal').innerHTML=`<span aria-hidden="true">✦</span><span>최대 연쇄 <strong>${state.bestChain}<small> / ${goal().chain}</small></strong></span>`;
  const currentPreview=column===null?null:preview(state,column);
  $('watering-row').innerHTML=Array.from({length:4},(_,i)=>`<button class="column-button ${state.stageId===1&&state.turn===1&&state.board[5]?.type==='sunflower'&&i===1&&column===null?'suggested':''}" id="water-col-${i}" data-column="${i}" aria-label="${i+1}열 물길 미리보기" aria-pressed="${column===i}" ${busy||state.phase!=='build'?'disabled':''}>${dropIcon}<span>${i+1}</span></button>`).join('');
  renderBoard(state.board,currentPreview);
  drawPaths(currentPreview);
  $('chain-preview').textContent=currentPreview?`${currentPreview.chain}개 연쇄 · 딸기 ${currentPreview.harvests}개 수확`:'↑ 물을 줄 열을 골라요';
  $('path-note').textContent=currentPreview?currentPreview.chain?'점선은 물길 · 금색은 벌의 길':'다른 열을 고르거나 물길을 이어 주세요':'심은 뒤에도 물길을 바꿀 수 있어요';
  $('placements').textContent=state.phase!=='build'?'수고했어요':state.placements>=2?'오늘 심기 완료':`${2-state.placements}번 더 심을 수 있어요`;
  $('tray-title').textContent=selected?`${names[selected]}를 놓을 빈칸 선택`:'무엇을 심을까요?';
  const full=state.board.every(Boolean),canPlace=state.phase==='build'&&state.placements<2&&!full&&!busy;
  $('seeds').innerHTML=state.offers.map((type,index)=>`<button id="seed-${index}" data-seed="${type}" class="seed-option" aria-label="${names[type]} 씨앗 선택, ${roles[type]}" aria-pressed="${selected===type}" ${canPlace?'':'disabled'}>${art({type,growth:1},true)}<strong>${names[type]}</strong><small>${roles[type]}</small></button>`).join('');
  $('undo').disabled=busy||state.phase!=='build'||!state.history.length;
  $('water').disabled=busy||column===null||state.phase!=='build';
  $('water').innerHTML=state.phase!=='build'?'정원 결과 보기':column===null?'물을 줄 열을 골라요':`${column+1}열에 물 한 방울 <span aria-hidden="true">↓</span>`;
  if(state.phase!=='build')$('water').disabled=false;
  $('skip').hidden=!busy;
  updateGuide();statusText();
  if(activeId&&$(activeId)&&!$(activeId).disabled)$(activeId).focus({preventScroll:true});
}
function updateGuide(){
  let text=garden().hint||'씨앗을 심고, 위에서 물을 줄 열을 골라요.';
  if(state.lastResult?.harvests&&state.phase==='build'&&state.placements===0)text='딸기를 딴 자리가 비었어요. 새로운 물길을 만들어 볼까요?';
  if(selected)text=`${names[selected]} · ${roles[selected]}. 빈 땅을 눌러 심어요.`;
  else if(state.placements>=2)text='준비됐어요! 위의 물방울을 고르고 물을 주세요.';
  else if(column!==null)text='점선이 이어지는 곳을 보세요. 지금 물을 줘도 괜찮아요.';
  if(state.stageId===1&&state.turn===1){
    if(!state.board[5])text=selected==='sunflower'?'반짝이는 빈칸을 눌러 꽃 사이를 이어 주세요.':'해바라기를 골라 반짝이는 빈칸에 심어 보세요.';
    else if(state.board[5].type==='sunflower')text=column===1?'네 식물이 이어졌어요! 아래 버튼으로 물을 주세요.':'위에서 두 번째 물방울을 눌러 물길을 확인해요.';
  }else if(state.stageId===1&&state.turn===2&&!selected&&column===null&&state.board[13]?.growth)text='딸기가 한 번 익었어요. 같은 열에 다시 물을 주면 수확돼요.';
  $('guide-copy').textContent=text;
}
function renderBoard(board,result=null){
  const active=new Set(result?.activated||[]);
  $('drop-board').innerHTML=board.map((tile,index)=>{
    const label=`${Math.floor(index/4)+1}행 ${index%4+1}열`;
    return `<button id="tile-${index}" class="tile ${tile?'planted':'empty'} ${active.has(index)?'planned':''} ${state.stageId===1&&state.turn===1&&!tile&&index===5?'suggested':''}" data-index="${index}" data-type="${tile?.type||'empty'}" aria-label="${label} ${tile?names[tile.type]+(tile.type==='strawberry'?`, ${tile.growth||0}번 익음`:'')+' 설명':selected?names[selected]+' 심을 빈 땅':'빈 땅'}" ${busy?'disabled':''}>${tile?`${art(tile)}<small class="tile-flow" aria-hidden="true">${arrows[tile.type]||'•'}</small>${tile.type==='strawberry'?`<span class="growth-dots" aria-hidden="true"><i class="${tile.growth?'filled':''}"></i><i></i></span>`:''}`:'<span class="empty-mark" aria-hidden="true">+</span>'}</button>`;
  }).join('');
}
function point(index,columnIndex=column){return index===null?{x:50+(columnIndex||0)*100,y:-20}:{x:50+(index%4)*100,y:50+Math.floor(index/4)*100};}
function line(edge){const from=point(edge.from),to=edge.to===null?{x:from.x+(edge.direction==='left'?-65:edge.direction==='right'?65:0),y:from.y+(edge.direction==='down'?65:0)}:point(edge.to);return{from,to};}
function drawPaths(result){
  $('water-paths').innerHTML=result?(result.edges||[]).map((edge,index)=>{
    const {from,to}=line(edge);return `<path id="edge-${index}" class="${edge.kind==='bee'?'bee-path':'water-path'}" d="M${from.x} ${from.y} ${edge.kind==='bee'?`Q${(from.x+to.x)/2+28} ${(from.y+to.y)/2-36}`:'L'} ${to.x} ${to.y}"/>`;
  }).join('')+(result.breaks||[]).filter(e=>e.reason==='empty'&&Number.isInteger(e.to)).map(e=>{const p=point(e.to);return `<circle class="path-end" cx="${p.x}" cy="${p.y}" r="7"/>`;}).join(''):'';
}
function tileInfo(index){
  const tile=state.board[index];if(!tile)return;
  openDialog(names[tile.type],`<div class="plant-detail">${art(tile)}</div><p class="dialog-copy">${tile.type==='rock'?'돌은 움직이지 않고 물길을 막아요. 다른 열이나 민트의 갈림길을 이용해 보세요.':descriptions[tile.type]}</p>${tile.type==='strawberry'?`<p class="detail-note">${tile.growth?'한 번 더 익으면 수확돼요.':'두 번 방문하면 수확돼요.'} 물과 벌을 함께 써도 돼요.</p>`:''}<div class="modal-actions"><button class="primary" id="info-done">정원으로</button></div>`,'plant');$('info-done').onclick=closeDialog;
}
function showGame(){$('welcome').classList.add('intro-complete');homeVisible=false;selected=null;column=null;render();$('go-home').focus();if(state.phase!=='build')showResult();}
function startGame(){
  gesture();
  if(damagedSave){openDialog('저장된 정원을 읽지 못했어요','<p class="dialog-copy">이 실험판의 진행을 새로 시작할 수 있어요. 기존 햇빛정원의 기록은 그대로 남아요.</p><div class="modal-actions"><button class="secondary" id="keep-save">닫기</button><button class="primary" id="fresh-save">새 정원 시작</button></div>','confirm');$('keep-save').onclick=closeDialog;$('fresh-save').onclick=()=>{damagedSave=false;state=newRun(1);closeDialog();save();showGame();};return;}
  save();showGame();
}
function chooseGarden(){
  gesture();openDialog('세 번의 작은 발견',`<p class="dialog-copy">각 정원을 깨우면 다음 물길이 열려요.</p><div class="chapter-grid">${GARDENS.map(g=>`<button class="chapter-card" data-garden="${g.id}" ${unlocked(g.id)?'':'disabled'}><span class="chapter-number">0${g.id}</span><span><strong>${escape(g.name)}</strong><small>${escape(g.subtitle||'새로운 물길을 만들어요')}</small></span><span class="chapter-status">${profile.cleared.includes(g.id)?'✓':unlocked(g.id)?'↗':'잠김'}</span></button>`).join('')}</div><p class="detail-note">진행과 해금은 이 브라우저에 남아요.</p>`,'chapters');
  $('dialog-content').querySelectorAll('[data-garden]').forEach(button=>button.onclick=()=>confirmGarden(Number(button.dataset.garden)));
}
function confirmGarden(id){
  if(!unlocked(id))return;
  if(state.stageId===id&&state.phase==='build'){closeDialog();showGame();return;}
  const g=GARDENS.find(x=>x.id===id);
  const begin=()=>{state=newRun(id);damagedSave=false;rawRun='started';selected=null;column=null;closeDialog();save();showGame();};
  if(state.phase==='build'&&state.actions.length){openDialog(`${g.name}으로 갈까요?`,'<p class="dialog-copy">지금 정원의 진행은 처음부터 다시 시작해요. 이미 깬 정원은 그대로 남아요.</p><div class="modal-actions"><button class="secondary" id="stay">계속 키우기</button><button class="primary" id="go-new">새 정원 시작</button></div>','confirm');$('stay').onclick=closeDialog;$('go-new').onclick=begin;}else begin();
}
function retry(){state=newRun(state.stageId);selected=null;column=null;closeDialog();save();render();}
function showResult(){
  if(state.phase==='build')return;
  const won=state.phase==='won',last=state.stageId===GARDENS.at(-1).id;
  openDialog(won?'한 방울로 해냈어요!':'물길을 조금 바꿔 볼까요?',`<div class="result-flower" aria-hidden="true">${art({type:won?'sunflower':'mint'})}</div><p class="result-subtitle">${escape(garden().name)} · ${won?'정원이 깨어났어요':'다음에는 다른 길로'}</p><div class="results-grid"><div><span>딸기 수확</span><strong>${state.totalHarvests}<small> / ${goal().harvests}</small></strong></div><div><span>가장 긴 연쇄</span><strong>${state.bestChain}<small> / ${goal().chain}</small></strong></div></div><p class="dialog-copy">${won?(last?'세 정원을 모두 깨웠어요. 같은 정원도 민트와 벌집의 위치를 바꾸면 다른 길로 살아나요.':'수확한 자리에 새로운 씨앗을 심으면, 물길도 다시 자라요. 다음 정원에서는 다른 연결을 발견해 보세요.'):state.totalHarvests<goal().harvests?'딸기는 두 번 방문해야 수확돼요. 같은 열에 다시 물을 주거나, 옆 꽃과 벌집을 연결해 보세요.':'민트로 좌우를 연결하면 한 방울이 더 멀리 퍼져요. 점선 끝의 빈칸부터 이어 보세요.'}</p><div class="modal-actions">${won&&!last?'<button id="result-retry" class="secondary">다른 길로 도전</button><button id="result-next" class="primary">다음 정원 →</button>':`<button id="result-home" class="secondary">정원 목록</button><button id="result-retry" class="primary">${won?'다른 물길 만들기':'다시 도전'}</button>`}</div>`,'result');
  $('result-retry').onclick=retry;
  if($('result-next'))$('result-next').onclick=()=>{state=advance(state);selected=null;column=null;closeDialog();save();render();say(`${garden().name}. ${garden().hint}`);};
  if($('result-home'))$('result-home').onclick=chooseGarden;
}
function help(page=0){
  helpPage=page;const types=Object.keys(descriptions).slice(page*2,page*2+2);
  openDialog(page?'벌과 딸기의 작은 약속':'물 한 방울로 연결해요',`<div class="guide-grid">${types.map(type=>`<article>${art({type,growth:1},true)}<div><h3>${names[type]} <span>${arrows[type]}</span></h3><p>${descriptions[type]}</p></div></article>`).join('')}</div><p class="detail-note">하루에 씨앗을 두 번까지 심고, 열 하나에 물을 줘요. 꽃과 벌집은 물주기마다 한 번 작동해요.</p><div class="modal-actions">${page?'<button id="help-back" class="secondary">← 앞쪽</button>':''}<button id="help-next" class="primary">${page?'알겠어요':'벌과 딸기 보기 →'}</button></div>`,'guide');
  if($('help-back'))$('help-back').onclick=()=>help(0);$('help-next').onclick=()=>page?closeDialog():help(1);
}
function settings(){
  gesture();openDialog('작은 정원의 소리',`<div class="setting-row"><span><strong>배경음악</strong><small id="music-status"></small></span><button id="music-toggle" class="toggle" role="switch" aria-label="배경음악" aria-checked="${profile.options.music}">${profile.options.music?'켜짐':'꺼짐'}</button></div><label class="volume-row" for="music-volume">음악 크기 <output id="volume-label">${Math.round(profile.options.volume*100)}%</output><input type="range" id="music-volume" min="0" max="100" value="${Math.round(profile.options.volume*100)}"></label><div class="setting-row"><span><strong>심기·물방울 효과음</strong><small>흙, 꽃, 벌, 수확의 작은 소리</small></span><button id="effects-preview" class="sound-preview" aria-label="효과음 켜고 미리듣기">▶</button><button id="effects-toggle" class="toggle" role="switch" aria-label="효과음" aria-checked="${profile.options.sound}">${profile.options.sound?'켜짐':'꺼짐'}</button></div><div class="setting-row"><span><strong>가벼운 진동</strong><small>${navigator.vibrate?'심기와 수확에 반응해요':'이 브라우저는 진동을 지원하지 않아요'}</small></span><button id="haptics-toggle" class="toggle" role="switch" aria-label="진동" aria-checked="${profile.options.haptics}" ${navigator.vibrate?'':'disabled'}>${profile.options.haptics?'켜짐':'꺼짐'}</button></div><div class="modal-actions"><button class="secondary" id="music-play">음악 재생</button><button class="primary" id="settings-done">정원으로</button></div>`,'settings');
  for(const [id,key] of [['music-toggle','music'],['effects-toggle','sound'],['haptics-toggle','haptics']])$(id).onclick=()=>{profile.options[key]=!profile.options[key];$(id).setAttribute('aria-checked',String(profile.options[key]));$(id).textContent=profile.options[key]?'켜짐':'꺼짐';music.setPreferences({enabled:profile.options.music,volume:profile.options.volume});if(key==='music'&&profile.options.music)music.activate();if(key==='sound'){sfx.stop();if(profile.options.sound)sfx.play('bloom',{step:2});}save();};
  $('effects-preview').onclick=()=>{gesture();profile.options.sound=true;$('effects-toggle').setAttribute('aria-checked','true');$('effects-toggle').textContent='켜짐';sfx.stop();sfx.play('plant');save();};
  $('music-volume').oninput=event=>{profile.options.volume=Number(event.target.value)/100;music.setPreferences({volume:profile.options.volume});$('volume-label').textContent=`${event.target.value}%`;save();};
  $('music-play').onclick=()=>{profile.options.music=true;$('music-toggle').setAttribute('aria-checked','true');$('music-toggle').textContent='켜짐';music.setPreferences({enabled:true});music.activate();save();};$('settings-done').onclick=closeDialog;musicStatus();
}

function wait(ms){return new Promise(resolve=>{const timer=setTimeout(()=>{abortWait=null;resolve();},ms);abortWait=()=>{clearTimeout(timer);abortWait=null;resolve();};});}
function finishAnimation(stopSound=true){skipRequested=true;abortWait?.();if(stopSound)sfx.stop();for(const animation of activeAnimations)animation.cancel();activeAnimations.clear();$('particles').replaceChildren();}
function clearPlanting(){
  if(!plantingEffect)return;
  const effect=plantingEffect;plantingEffect=null;
  for(const animation of effect.animations)animation.cancel();
  effect.layer?.remove();effect.cell?.classList.remove('just-planted');
}
function plantFeedback(index,type){
  clearPlanting();
  const cell=$(`tile-${index}`),image=cell?.querySelector('svg');
  if(!image?.animate||document.hidden)return;
  const effect={cell,layer:null,animations:[]};plantingEffect=effect;
  cell.classList.add('just-planted');
  const run=(element,frames,options={})=>{
    const animation=element.animate(frames,{duration:240,easing:'cubic-bezier(0.23, 1, 0.32, 1)',fill:'both',...options});
    effect.animations.push(animation);animation.finished.catch(()=>{});return animation;
  };
  if(reduce.matches){
    const fade=run(image,[{opacity:.65},{opacity:1}],{duration:160});
    fade.finished.catch(()=>{}).finally(()=>{if(plantingEffect===effect)clearPlanting();});return;
  }
  const layer=document.createElement('span');layer.className='planting-effect';layer.setAttribute('aria-hidden','true');effect.layer=layer;
  layer.innerHTML='<i class="planting-soil"></i><i class="planting-seed"></i>'+Array.from({length:5},()=>'<i class="soil-grain"></i>').join('');
  cell.append(layer);
  run(layer.querySelector('.planting-seed'),[{transform:'translate(-50%,-230%) rotate(-25deg)',opacity:1},{offset:.75,transform:'translate(-50%,-50%) rotate(15deg)',opacity:1},{transform:'translate(-50%,-20%) rotate(20deg)',opacity:0}],{duration:120});
  run(layer.querySelector('.planting-soil'),[{transform:'translate(-50%,-50%) scale(.95)',opacity:0},{offset:.25,transform:'translate(-50%,-50%) scale(1)',opacity:.7},{transform:'translate(-50%,-50%) scale(1.08)',opacity:0}],{delay:60});
  const size=cell.getBoundingClientRect().width;
  const scatter=[[-.28,-.2],[-.17,-.34],[.02,-.38],[.21,-.3],[.3,-.12]];
  layer.querySelectorAll('.soil-grain').forEach((grain,i)=>{
    const [x,y]=scatter[i];
    run(grain,[{transform:'translate(-50%,-50%)',opacity:0},{offset:.15,transform:'translate(-50%,-50%)',opacity:.85},{offset:.6,transform:`translate(${x*size}px,${y*size}px) rotate(${i*37}deg)`,opacity:.7},{transform:`translate(${x*size*1.1}px,${size*.03}px) rotate(${i*63}deg)`,opacity:0}],{duration:200,delay:80});
  });
  const rise=run(image,type==='hive'?[{transform:'translateY(-10%) scale(.95)',opacity:0},{offset:.7,transform:'translateY(2%) scale(1)',opacity:1},{transform:'translateY(0) scale(1)',opacity:1}]:[{transform:'translateY(14%) scale(.92)',opacity:0},{offset:.65,transform:'translateY(-3%) scale(1.03)',opacity:1},{transform:'translateY(0) scale(1)',opacity:1}],{duration:200,delay:100});
  rise.finished.catch(()=>{}).finally(()=>{if(plantingEffect===effect)clearPlanting();});
}
function animate(element,frames,options){if(reduce.matches||skipRequested||!element?.animate)return;const a=element.animate(frames,{duration:200,easing:'cubic-bezier(0.23, 1, 0.32, 1)',...options});activeAnimations.add(a);a.finished.catch(()=>{}).finally(()=>activeAnimations.delete(a));return a;}
function fly(event){
  if(event.to===null||!Number.isInteger(event.to))return;
  const {from,to}=line(event),bounds=$('particles').getBoundingClientRect();
  const particle=document.createElement('span');particle.className=event.kind==='bee'?'flight bee-flight':'flight water-flight';particle.innerHTML=event.kind==='bee'?'🐝':dropIcon;particle.style.left='0';particle.style.top='0';$('particles').append(particle);
  const xy=p=>`translate(${p.x/400*bounds.width-10}px,${p.y/400*bounds.height-12}px)`;
  const a=animate(particle,[{transform:xy(from),opacity:.3},{transform:xy(to),opacity:1}],{duration:200,easing:'cubic-bezier(0.77, 0, 0.175, 1)'});
  if(a)a.finished.catch(()=>{}).finally(()=>particle.remove());else particle.remove();
}
async function playChain(before,result){
  const events=result.events||[],groups=[];
  for(const event of events){let group=groups.at(-1);if(!group||group.step!==event.step)groups.push(group={step:event.step,events:[]});group.events.push(event);}
  const interval=Math.max(40,Math.min(125,3000/Math.max(1,groups.length)));let count=0;
  const visual=before.board.map(tile=>tile?{...tile}:null);
  drawPaths(result);$('water-paths').classList.add('running');
  for(const group of groups){
    if(skipRequested||reduce.matches||document.hidden)break;
    for(const event of group.events){
      const cell=Number.isInteger(event.index)?$(`tile-${event.index}`):null;
      if(event.kind==='flow'||event.kind==='bee')fly(event);
      if(event.kind==='bee')sfx.play('bee');
      if(event.kind==='activate'&&cell){count++;cell.classList.add('active');animate(cell.querySelector('svg'),[{transform:'scale(.94)',opacity:.75},{transform:'scale(1.1)',opacity:1},{transform:'scale(1)',opacity:1}],{duration:240});sfx.play('bloom',{step:count-1});$('chain-preview').textContent=`${count}개가 이어서 깨어나요!`;}
      if(event.kind==='grow'&&cell&&visual[event.index]){visual[event.index].growth=event.after;cell.classList.add('grown');const image=cell.querySelector('svg');if(image)image.outerHTML=art(visual[event.index]);cell.querySelector('.growth-dots i')?.classList.add('filled');if(event.after<2)sfx.play('grow');}
      if(event.kind==='harvest'&&cell){cell.classList.add('harvested');animate(cell.querySelector('svg'),[{transform:'translateY(0) scale(1)',opacity:1},{transform:'translateY(-18px) scale(.95)',opacity:0}],{duration:200});visual[event.index]=null;sfx.play('harvest');vibrate([10,25,15]);}
      if(event.kind==='break'&&event.reason==='empty'&&Number.isInteger(event.to))$(`tile-${event.to}`)?.classList.add('water-stop');
    }
    await wait(interval);
  }
  if(!skipRequested&&!reduce.matches&&!document.hidden)await wait(160);
  $('water-paths').classList.remove('running');$('particles').replaceChildren();
}
async function pour(){
  gesture();if(busy)return;if(state.phase!=='build'){showResult();return;}if(column===null)return;
  const before=state,next=water(state,column);if(next===state)return;
  clearPlanting();sfx.stop();sfx.play('water');
  busy=true;skipRequested=false;selected=null;state=next;rawRun='started';reconcileClear();save();
  $('skip').hidden=false;$('water').disabled=true;$('undo').disabled=true;$('guide-copy').textContent='한 방울이 물길을 따라가요…';
  document.querySelectorAll('#watering-row button,#seeds button,#drop-board button,#go-home,#guide,#sound').forEach(button=>button.disabled=true);
  $('skip').focus();
  try{await playChain(before,state.lastResult);}finally{
    finishAnimation(false);busy=false;$('go-home').disabled=false;$('guide').disabled=false;$('sound').disabled=false;column=null;render();
    const r=state.lastResult;$('chain-preview').textContent=`${r.chain}개 연쇄 · 딸기 ${r.harvests}개 수확!`;$('path-note').textContent=r.harvests?'빈 땅에 새로운 연결을 심어 보세요':'다음 물주기를 준비해요';say(`${r.chain}개 연쇄, 딸기 ${r.harvests}개 수확. ${state.phase==='build'?state.turn+'번째 물주기입니다.':state.phase==='won'?'정원을 깨웠어요.':'다른 물길로 다시 도전해 보세요.'}`);
    if(state.phase!=='build'){sfx.play(state.phase==='won'?'win':'loss');showResult();}else $('water-col-0').focus({preventScroll:true});
  }
}

$('start').onclick=startGame;$('choose-garden').onclick=chooseGarden;
$('go-home').onclick=()=>{if(busy)return;gesture();homeVisible=true;closeDialog();render();$('start').focus();};
$('guide').onclick=()=>{gesture();help();};$('sound').onclick=settings;
$('close-dialog').onclick=closeDialog;$('drop-dialog').addEventListener('cancel',()=>{});
$('seeds').onclick=event=>{const button=event.target.closest('[data-seed]');if(!button||button.disabled||busy)return;gesture();selected=selected===button.dataset.seed?null:button.dataset.seed;render();sfx.play('select');};
$('drop-board').onclick=event=>{const button=event.target.closest('[data-index]');if(!button||button.disabled||busy)return;gesture();const index=Number(button.dataset.index);if(state.board[index]){tileInfo(index);return;}if(!selected){$('guide-copy').textContent='아래에서 씨앗을 하나 고른 뒤 이 칸에 심어요.';say('먼저 아래에서 씨앗을 골라 주세요.');return;}const plantedType=selected,next=place(state,index,selected);if(next===state)return;state=next;rawRun='started';selected=null;save();render();plantFeedback(index,plantedType);vibrate(8);sfx.play('plant');say(`${names[plantedType]}를 심었어요.`);};
$('drop-board').addEventListener('keydown',event=>{const index=Number(event.target.closest('[data-index]')?.dataset.index),delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-4,ArrowDown:4}[event.key];if(!Number.isInteger(index)||!delta)return;const next=index+delta;if(next<0||next>15||Math.abs(delta)===1&&Math.floor(next/4)!==Math.floor(index/4))return;event.preventDefault();$(`tile-${next}`).focus();});
$('watering-row').onclick=event=>{const button=event.target.closest('[data-column]');if(!button||button.disabled||busy)return;gesture();column=Number(button.dataset.column);selected=null;render();};
$('undo').onclick=()=>{if(busy)return;gesture();state=undo(state);selected=null;save();render();sfx.stop();sfx.play('undo');};
$('water').onclick=pour;$('skip').onclick=finishAnimation;
document.addEventListener('visibilitychange',()=>{music.setHidden(document.hidden);if(document.hidden){sfx.stop();clearPlanting();if(busy)finishAnimation();}});
landscape.addEventListener?.('change',event=>{if(event.matches){sfx.stop();clearPlanting();if(busy)finishAnimation();if($('drop-dialog').open)closeDialog();}});
reduce.addEventListener?.('change',event=>{if(event.matches){clearPlanting();if(busy)finishAnimation();}});
window.addEventListener('pagehide',()=>{sfx.stop();clearPlanting();});
reconcileClear();render();
