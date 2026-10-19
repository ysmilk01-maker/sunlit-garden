import {SEEDS,UPGRADES,WEATHER,STAGES,RUN_DAYS,newStrategicRun as newRun,transplant,transplantsRemaining,undoAvailable,stageFor,picksToday,plant,undo,forecast,harvest,chooseUpgrade,rerollUpgrades,rerollsRemaining,loadRun,saveRun,loadCampaign,saveCampaign,recordResult,canPlay} from './evolution-core.mjs?v=20261020-24';
import {EVOLUTIONS,evolutionTier,evolutionDetails,evolutionChoices,evolvableTiles,evolve as chooseEvolution,previewEvolution} from './evolution-core.mjs?v=20261020-24';
import {plantArt,evolutionArt,installSpriteFallbacks} from './garden-sprites.mjs?v=20261015-20';
import {createGardenAudio} from './garden-audio.mjs?v=20261013-12';
import {seedAdvice,upgradeAdvice,evolutionAdvice} from './garden-strategy.mjs?v=20261020-24';
import {createGardenFeedback} from './garden-feedback.mjs?v=20261020-24';
import {seedFacts,explainSeedPlacement} from './seed-explainer.mjs?v=20261020-24';
import {seedInlineCopy,upgradeEffectCopy} from './choice-copy.mjs?v=20261020-24';
import {createSeedDiscovery} from './seed-discovery.mjs?v=20261014-19';
import {goalProgress,bestPreviewSlots,nextStarGoal} from './garden-journey.mjs?v=20261020-24';
import {DECORATIONS,loadProfile,saveProfile,missionFor,claimHarvest,claimClear,reconcileCampaign,starsFor,summaryFor,selectDecoration,setOptions} from './garden-features.mjs?v=20261020-24';
import {createGardenMusic} from './garden-music.mjs?v=20261013-7';
import * as LEGACY from './campaign-legacy-v7.mjs';
import * as LEGACY8 from './campaign-legacy-v8.mjs';
import {createWeatherScene} from './weather-scene.mjs?v=20261015-20';
import {gardenIcon} from './garden-icons.mjs?v=20261020-24';
import {homeActionFor,harvestHighlights,saveNoticeFor} from './garden-session.mjs?v=20261018-23';
import {createGardenSaveStore} from './garden-save-store.mjs?v=20261018-23';
import {transplantPreview,presentationDelay} from './garden-transplant.mjs?v=20261020-24';
import {harvestPresentation} from './harvest-presentation.mjs?v=20261020-24';
const $=id=>document.getElementById(id);
const weatherScene=createWeatherScene(document.querySelector('.app'));
installSpriteFallbacks(document);
let rawStorage;try{rawStorage=window.localStorage;}catch{}
const storage=createGardenSaveStore(rawStorage);
const seedDiscovery=createSeedDiscovery(storage,{validIds:Object.keys(SEEDS)});
let discoveryQueue=[],discoveryIndex=0;
let profile=loadProfile(storage).profile;
let homeVisible=true,lastMissionReward=0,lastClearReward=0,lastDecorUnlocks=[],paused=false;
const hapticCapable=typeof navigator.vibrate==='function';
const loadedCampaign=loadCampaign(storage);
let campaign=loadedCampaign.campaign;
profile=reconcileCampaign(profile,campaign);
const loaded=loadRun(storage);
let state=loaded.state&&canPlay(campaign,loaded.state.stageId)?loaded.state:newRun(undefined,1);
let adviceState=null,adviceCache=new Map(),explanationState=null,explanationCache=new Map();
let selected=null,busy=false,sound=profile.options.sound,audioContext=null,sheetMode='',rotatedSheet=false,helpPage=0,zoomMode=false,zoomZone=0,stagePage=Math.floor((state.stageId-1)/10);
let transplantMode=false,transplantSource=null;
const music=createGardenMusic({audio:$('garden-bgm'),getContext:getAudioContext,enabled:profile.options.music,volume:profile.options.musicVolume,onChange:updateMusicStatus});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const sfx=createGardenAudio({getContext:getAudioContext,isEnabled:()=>sound,isHidden:()=>document.hidden||landscape.matches});
const feedback=createGardenFeedback({reduced});
const art=(tile,small=false)=>evolutionArt(tile.type,tile.evolution?.id,tile.age,{small,tier:evolutionTier(tile)});
const evolutionName=tile=>tile?.evolution?evolutionDetails(tile)?.name:null;
const landscape=matchMedia('(orientation: landscape) and (pointer: coarse), (orientation: landscape) and (max-height: 600px) and (max-width: 1000px)');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const say=text=>{$('announcement').textContent=text;};
const stage=()=>stageFor(state);
const previousRules=()=>state.version===2?LEGACY:state.version===3?LEGACY8:null;
const seeds=()=>previousRules()?.SEEDS??SEEDS;
const abilities=()=>previousRules()?.UPGRADES??UPGRADES;
const weatherData=()=>previousRules()?.WEATHER??WEATHER;
const signed=value=>value>0?`+${value}`:String(value);
const columnBonus=result=>(result?.tiles||[]).reduce((sum,t)=>sum+t.reasons.filter(r=>r.label==='같은 열').reduce((n,r)=>n+r.value,0),0);
const passed=()=>state.phase==='over'&&state.score>=stage().target;
const resultFor=()=>state.phase==='plant'?forecast(state):state.lastHarvest;
function renderGoal(score=state.score,target=stage().target){
 const progress=goalProgress(score,target);if(!progress)return;
 $('goal').textContent=nextStarGoal(score,target)?.label||progress.valueText;
 $('goal').classList.toggle('achieved',progress.achieved);
 const meter=$('goal-meter'),fill=$('goal-fill');
 if(meter){meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax','100');meter.setAttribute('aria-valuenow',String(Math.round(progress.percent*10)/10));meter.setAttribute('aria-valuetext',progress.valueText);meter.classList.toggle('achieved',progress.achieved);}
 if(fill)fill.style.width=`${progress.percent}%`;
}
function persist(){const runOK=saveRun(storage,state),progressOK=saveCampaign(storage,campaign),profileOK=saveProfile(storage,profile);const durable=runOK&&progressOK&&profileOK,notice=saveNoticeFor(storage.getStatus());$('save-status').textContent=notice.short;$('save-status').dataset.state=durable&&!notice.warning?'saved':'warning';}
function saveRecord(){if(state.phase==='over'){campaign=recordResult(campaign,state);const before=profile.petals;profile=claimClear(profile,state);lastClearReward=Math.max(lastClearReward,profile.petals-before);}}
function getAudioContext(){audioContext??=new (window.AudioContext||window.webkitAudioContext)();return audioContext;}
function soundIcon(){return sound?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m11 4-5 4H3v8h3l5 4V4ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m11 4-5 4H3v8h3l5 4V4Zm5 5 5 6m0-6-5 6"/></svg>';}
function previewScores(){if(transplantMode||!selected||state.phase!=='plant'||state.placements>=picksToday(state))return [];const base=forecast(state).total;return state.board.map((t,i)=>t?null:forecast(plant(state,i,selected)).total-base);}
function plotHTML(index,interactive=true,previews=[],planted=-1,prefix='plot',bestSlots=[]){
 const tile=state.board[index],sc=resultFor()?.tiles.find(t=>t.index===index),location=`${Math.floor(index/state.cols)+1}행 ${index%state.cols+1}열`,pv=previews[index],canPreview=Number.isFinite(pv),isBest=canPreview&&bestSlots.includes(index),isAnchor=canPreview&&explanationFor(selected)?.index===index;
 const tag=interactive?'button':'div',attr=interactive?`id="${prefix}-${index}" data-slot="${index}" ${busy?'disabled':''}`:`data-cell="${index}" aria-hidden="true"`;
 if(!tile)return `<${tag} ${attr} class="plot empty ${transplantMode&&transplantSource!==null?'move-target':''} ${canPreview?'available':''} ${isBest?'best':''} ${isAnchor?'preview-anchor':''} ${canPreview&&pv<0?'preview-loss':''}" ${canPreview?`data-preview-delta="${pv}"`:''} ${interactive?`aria-label="${location} 빈 땅${transplantMode?', 옮겨심을 자리 선택':''}${canPreview?', '+seeds()[selected].name+' 심기, 정원 수확 변화 '+signed(pv):''}${isBest?', 오늘 수확 변화가 가장 큰 자리':''}"`:''}>${canPreview?`<span class="preview-label">${isAnchor?'오늘 최대':isBest?'오늘 최대':'정원 변화'}</span><span class="preview-score">${signed(pv)}</span>`:'<span class="empty-plus" aria-hidden="true">+</span>'}</${tag}>`;
 const name=tile.type==='well'?'우물':evolutionName(tile)||seeds()[tile.type].name,combo=sc?.reasons.some(r=>r.combo),lineBonus=sc?.reasons.find(r=>r.label==='같은 열')?.value||0;
 const seedling=tile.age===0&&!tile.evolution&&['sunflower','clover','berry','lavender','mushroom'].includes(tile.type);
 return `<${tag} ${attr} class="plot ${transplantMode&&transplantSource===index?'move-source':''} ${tile.evolution?'evolved':''} ${evolutionTier(tile)===3?'evolution-master':''} ${seedling?'has-seedling':''} ${state.phase==='evolve'&&evolvableTiles(state).includes(index)?'evolution-ready':''} ${lineBonus?'column-synergy':''} ${combo?'synergy':''} ${planted===index?'planted':''}" data-type="${tile.type}" data-score="+${sc?.value||0}" ${interactive?`aria-label="${location} ${name}${tile.evolution?', '+evolutionTier(tile)+'단계 진화':''}${sc?', 수확 '+sc.value+'점, '+tile.age+'번 성장':''}${lineBonus?', 세로열 보너스 '+lineBonus+'점':''}. ${transplantMode?'옮길 식물 선택':'설명 보기'}"`:''}>${art(tile)}${seedling?`<span class="seedling-name" aria-hidden="true">${escape(seeds()[tile.type].name)}</span>`:''}${tile.evolution?`<span class="evolution-badge" aria-hidden="true">${evolutionTier(tile)===3?'✦3':'✦2'}</span>`:''}${lineBonus?`<span class="column-badge" aria-hidden="true">↕</span>`:''}${tile.type!=='well'?`<span class="age-dots" aria-hidden="true">${[0,1,2].map(n=>`<i class="${tile.age>n?'grown':''}"></i>`).join('')}</span><span class="tile-score ${combo?'combo':''}">+${sc?.value||0}</span>`:''}</${tag}>`;
}
function fitBoard(){const frame=$('garden-frame'),space=$('board-space').getBoundingClientRect(),style=getComputedStyle(frame),px=parseFloat(style.paddingLeft)+parseFloat(style.paddingRight)+2,py=parseFloat(style.paddingTop)+parseFloat(style.paddingBottom)+2;
 const width=Math.max(100,Math.min(space.width,396,Math.max(0,space.height-8-py)*state.cols/state.rows+px)),height=(width-px)*state.rows/state.cols+py;
 frame.style.width=Math.floor(width)+'px';frame.style.height=Math.floor(height)+'px';
 const gap=Number.parseFloat(getComputedStyle($('board')).gap)||4,need=(width-px-gap*(state.cols-1))/state.cols<44;
 if(need!==zoomMode){zoomMode=need;renderBoard();}
}
function renderBoard(planted=-1){feedback.clear();const previews=previewScores(),bestSlots=bestPreviewSlots(previews),singleZone=state.cols<=4&&state.rows<=4;$('board').style.setProperty('--cols',state.cols);$('board').style.setProperty('--rows',state.rows);$('board').setAttribute('aria-label',`${state.rows}행 ${state.cols}열 정원${zoomMode?', '+(singleZone?'눌러서 크게 보세요':'구역을 눌러 확대하세요'):''}`);$('board').innerHTML=state.board.map((_,i)=>plotHTML(i,!zoomMode,previews,planted,'plot',bestSlots)).join('');$('garden-frame').classList.toggle('overview',zoomMode);$('zoom-zones').hidden=!zoomMode;$('zoom-zones').classList.toggle('single-zone',singleZone);$('zoom-zones').innerHTML=zoomMode?(singleZone?['정원 크게 보기']:['왼쪽 위','오른쪽 위','왼쪽 아래','오른쪽 아래']).map((name,i)=>`<button data-zone="${i}" aria-label="${singleZone?name:name+' 정원 확대'}" ${busy?'disabled':''}><span aria-hidden="true">${name} ⊕</span></button>`).join(''):'';$('board-hint').textContent=zoomMode?(singleZone?'정원을 눌러 크게 심기':'구역을 눌러 크게 심기'):'✧　✿　✧';}
function adviceFor(id){if(adviceState!==state){adviceState=state;adviceCache=new Map();}if(!adviceCache.has(id))adviceCache.set(id,seedAdvice(state,id));return adviceCache.get(id);}
function explanationFor(id){if(explanationState!==state){explanationState=state;explanationCache=new Map();}if(!explanationCache.has(id))explanationCache.set(id,explainSeedPlacement(state,id));return explanationCache.get(id);}
function locationOf(index){return `${Math.floor(index/state.cols)+1}행 ${index%state.cols+1}열`;}
function effectEquation(a){const old=a.existing;return `새 식물 ${signed(a.newPlant.value)} · 기존 ${old.reasonNegative<0?`${signed(old.reasonPositive)} / ${signed(old.reasonNegative)}`:signed(old.delta)}`;}
function activeReasons(a){const reasons=a.newPlant.reasons.filter(r=>r.value!==0),short={'시원한 그늘':'그늘','맑은 날':'맑음','흐린 날':'흐림'};const parts=reasons.slice(0,3).map(r=>`${short[r.label]||r.label} ${signed(r.value)}`);if(reasons.length>3)parts.push(`기타 ${signed(reasons.slice(3).reduce((n,r)=>n+r.value,0))}`);return parts.join(' · ')||'아직 수확 조건을 채우지 못했어요.';}
function cardsHTML(){return state.offers.map(id=>{const f=seedFacts(state,id),a=explanationFor(id);const wait=['berry','pumpkin','strawberry'].includes(id)?2:id==='cherry'?3:0,condition=wait&&state.day+wait>RUN_DAYS?'이번 판 성숙 보너스 없음':f.condition;return `<button data-seed="${id}" id="seed-${id}" class="seed-card" aria-pressed="${selected===id}" aria-label="${escape(f.name)}, 기본 ${f.base}점. ${escape(condition)}. 오늘 정원 최대 ${signed(a?.totalDelta||0)}점 변화" ${busy?'disabled':''}><span class="seed-head"><span class="seed-art">${plantArt(id,2,{small:true})}</span><strong>${escape(f.name)}</strong></span><span class="seed-base">기본 ${f.base}점 / 수확</span><span class="seed-condition">${escape(condition)}</span><span class="seed-potential ${a?.totalDelta<0?'loss':''}">오늘 최대 <b>${signed(a?.totalDelta||0)}</b></span></button>`;}).join('');}
function adviceNumbers(a){return `<div class="advice-numbers"><span><small>${escape(a.nowLabel)}</small><strong class="${a.nowDelta<0?'loss':''}">${signed(a.nowDelta)}<em>점</em></strong></span>${a.laterDelta!==null?`<span><small>${escape(a.laterLabel)}</small><strong class="${a.laterDelta<0?'loss':''}">${signed(a.laterDelta)}<em>점</em></strong></span>`:'<span><small>남은 수확</small><strong>마지막</strong></span>'}</div>`;}
function adviceText(a){return `<div class="strategy-lines"><p><b>지금 효과</b>${escape(a.reason)}</p><p class="strategy-watch"><b>주의할 점</b>${escape(a.watch)}</p><p><b>다음 배치</b>${escape(a.plan)}</p></div>`;}
function seedInlineHTML(id){const c=seedInlineCopy(state,id),a=adviceFor(id);if(!c)return '';
 return `<div class="seed-inline"><div class="seed-inline-head"><strong>${escape(c.name)}의 특성</strong><span>${escape(c.baseLabel)}</span></div><div class="seed-inline-traits">${c.lines.map(line=>`<p class="${line===c.warning?'seed-inline-warning':''}">${escape(line)}</p>`).join('')}</div><p class="seed-inline-meta">${c.growth?'성장: '+escape(c.growth)+' · ':''}${a?`<span class="seed-projection">오늘 ${signed(a.nowDelta)} · ${a.laterDelta===null?'마지막 수확':'내일 '+signed(a.laterDelta)}</span><br>오늘 최대 자리 기준 · 이후 심기·새 능력 제외`:escape(c.neighborNote)}</p></div>`;
}
function renderSeedStrategy(){const box=$('seed-strategy'),active=!!selected||transplantMode;box.hidden=!active;document.querySelector('.game').classList.toggle('has-seed-advice',active);$('tip').hidden=active;box.innerHTML=transplantMode?`<div class="move-instructions">${gardenIcon('trowel')}<div><strong>${transplantSource===null?'옮길 식물을 골라요':'새로 자리 잡을 빈 땅을 골라요'}</strong><p>${transplantSource===null?'한 정원에 한 번 · 성장과 진화는 그대로.':'확정 전 오늘·내일 수확 변화를 비교해요.'}<br>아래 ‘취소’를 누르면 횟수는 그대로예요.</p></div></div>`:selected?seedInlineHTML(selected):'';}

function toggleTransplant(){if(busy||state.phase!=='plant')return;if(transplantMode){transplantMode=false;transplantSource=null;}else{if(!transplantsRemaining(state))return;transplantMode=true;transplantSource=null;selected=null;}render();say(transplantMode?'옮길 식물을 고른 뒤 빈 땅을 누르세요.':'옮겨심기를 취소했어요.');}
function pickTransplant(index,returnZone=null){
 if(!transplantMode||busy)return false;
 const tile=state.board[index];
 if(tile){if(tile.type==='well'){say('우물은 옮길 수 없어요.');return true;}transplantSource=index;render();if(returnZone!==null)openZoom(returnZone);sfx.play('select',{type:tile.type});say(`${evolutionName(tile)||seeds()[tile.type].name} 선택. 옮길 빈 땅을 누르세요.`);return true;}
 if(transplantSource===null){say('먼저 옮길 식물을 골라 주세요.');return true;}
 const from=transplantSource,preview=transplantPreview(state,from,index);if(!preview)return true;
 const chosen=state.board[from],name=evolutionName(chosen)||seeds()[chosen.type].name;
 openSheet('transplant',`${name} 옮겨심기`,'한 정원에 한 번',`<div class="move-preview-art">${art(chosen)}<p>${locationOf(from)}<br>↓<br>${locationOf(index)}</p></div><div class="move-score"><div><span>오늘 수확 변화</span><strong class="${preview.today<0?'loss':''}">${signed(preview.today)}</strong></div><div><span>내일 수확 변화</span><strong class="${preview.tomorrow<0?'loss':''}">${preview.tomorrow===null?'마지막 날':signed(preview.tomorrow)}</strong></div></div><p class="move-confirm-note">${chosen.age}번 성장 · ${evolutionTier(chosen)}단계 유지<br>${preview.tomorrow===null?'마지막 수확의 변화예요.':'같은 배치로 다음 날까지 계산했어요.'}<br>이후 심기·새 진화·강화는 제외한 예고예요.</p><div class="sheet-actions"><button id="cancel-transplant" class="secondary">다른 자리 보기</button><button id="confirm-transplant" class="primary">이 자리로 옮기기</button></div>`);
 $('cancel-transplant').onclick=()=>returnZone===null?closeSheet():openZoom(returnZone);
 $('confirm-transplant').onclick=()=>{const next=transplant(state,from,index);if(next===state)return;state=next;transplantMode=false;transplantSource=null;selected=null;persist();closeSheet();render(index);plantFeedback(index);sfx.play('plant',{type:chosen.type});haptic([8,25,12]);toast(`옮겨심기 완료 · 오늘 ${signed(preview.today)}점`);say(`${name} 옮겨심기 완료. 수확 전 되돌리기로 복원할 수 있어요.`);};
 return true;
}

function render(planted=-1){const activeId=document.activeElement?.id,st=stage(),result=resultFor(),isPlant=state.phase==='plant',ready=isPlant&&state.placements===picksToday(state),weather=weatherData()[state.weather[state.day-1]],tomorrow=weatherData()[state.weather[state.day]];
 $('stage-label').textContent=`${st.id}단계 · ${st.cols}×${st.rows}`;$('stage-button').setAttribute('aria-label',`${st.id}단계 ${st.name}. 단계 선택`);$('home-button').setAttribute('aria-label','정원 메뉴 · 잠시 쉬기');
 weatherScene.update(state.weather[state.day-1],{paused:homeVisible});
 $('day').textContent=state.day;$('score').textContent=state.score;$('weather').innerHTML=`<span>${weather.icon} 오늘 ${weather.name}</span><small>${tomorrow?'내일 '+tomorrow.icon+' '+tomorrow.name:'마지막 수확'}</small>`;
 $('days').innerHTML=Array.from({length:RUN_DAYS},(_,i)=>`<span class="day-pip ${i<state.harvests.length?'done':i===state.day-1?'current':''}" title="${i+1}일차"></span>`).join('');
 renderGoal(state.score,st.target);
 $('board-label').textContent=`${st.name} · ${st.cols} × ${st.rows}`;$('garden-frame').classList.toggle('dense',state.cols>=6);fitBoard();renderBoard(planted);
 $('forecast-label').textContent=isPlant?'오늘 수확':'마지막 수확';$('forecast').innerHTML=`+${result?.total||0} <small>햇살</small>`;$('combos').textContent=columnBonus(result)?`↕ 같은 열 +${columnBonus(result)}`:result?.comboCount?`조합 효과 ${result.comboCount}곳`:state.version>=4?'같은 식물을 세로로 모아요':'이웃 효과를 만들어요';
 $('seed-cards').hidden=!isPlant||ready;$('ready-card').hidden=isPlant&&!ready;
 $('draft-title').textContent=transplantMode?'옮겨심기':state.phase==='over'?(passed()?'정원 완성!':'다시 도전해요'):state.phase==='evolve'?'식물 진화 선택':state.phase==='upgrade'?'정원 성장 선택':ready?'수확할 시간이에요':selected?'어디에 심을까요?':'씨앗 비교';
 $('picks').textContent=isPlant?`${state.placements}/${picksToday(state)}개`:state.phase==='evolve'?`진화 ${state.board.filter(t=>t?.evolution).length}송이`:`${state.upgrades.length}개 성장 보너스`;
 if(isPlant&&!ready)$('seed-cards').innerHTML=cardsHTML();
 if(state.phase==='over')$('ready-card').innerHTML=`<span aria-hidden="true">${passed()?'✿':'♧'}</span><div><strong>${passed()?`${st.id}단계 클리어`:`목표까지 ${st.target-state.score}점`}</strong><p>${passed()?'다음 단계에서 새로운 정원을 만나세요.':'같은 씨앗으로 배치와 조합을 바꿔 보세요.'}</p></div>`;
 else if(state.phase==='evolve')$('ready-card').innerHTML=`<span aria-hidden="true">✦</span><div><strong>내 식물의 새로운 모습</strong><p>${state.version>=6?'한 송이 3단계 집중 육성, 또는 새로운 식물 진화.':'한 송이를 고르고, 두 모습 중 하나로 키워요.'}</p></div>`;
 else if(state.phase==='upgrade')$('ready-card').innerHTML='<span aria-hidden="true">✦</span><div><strong>어떤 정원으로 키울까요?</strong><p>이번 단계 내내 유지되는 보너스를 골라요.</p></div>';
 else $('ready-card').innerHTML='<span aria-hidden="true">✦</span><div><strong>오늘의 정원이 준비됐어요</strong><p>수확하면 모든 식물이 한 번 더 자라요.</p></div>';
 $('tip').textContent=selected?(zoomMode?'원하는 구역을 누르면 크게 보고 심을 수 있어요.':'땅의 숫자 = 정원 전체의 수확 변화량'):state.phase==='over'?'결과를 보고 다음 전략을 정해 보세요.':state.phase==='evolve'?'정원의 식물을 누르거나 아래에서 진화를 골라요.':state.phase==='upgrade'?'성장 보너스는 이 단계가 끝날 때까지 유지돼요.':ready?'수확 전에는 되돌려서 자리를 바꿀 수 있어요.':'옆 = 상하좌우 · 대각선 제외\n오늘 최대 = 지금 심었을 때 정원 전체 증가량';
 if(state.version>=6&&isPlant&&!selected&&!ready){const m=missionFor(state);if(m?.kind==='weather'){const paid=profile.claimedMissions.includes(`${state.stageId}:${m.day}`);$('tip').textContent=`🐰 ${m.title} · 새로 한 송이 심기\n${paid?'이미 꽃잎 보상을 받은 부탁이에요':m.complete?'✓ 해결! 수확하면 꽃잎 +2':'오늘 날씨 보너스를 받으면 꽃잎 +2'}\n토끼 모모를 누르면 자세히 볼 수 있어요`;}}
 $('undo').disabled=busy||!isPlant||!undoAvailable(state);const move=$('transplant');move.hidden=state.version<7;move.disabled=busy||!isPlant||(!transplantMode&&!transplantsRemaining(state));move.setAttribute('aria-pressed',String(transplantMode));move.setAttribute('aria-label',transplantMode?'옮겨심기 취소':transplantsRemaining(state)?'옮겨심기 · 한 정원에 한 번':'옮겨심기 · 지금 사용할 수 없음');move.innerHTML=gardenIcon(transplantMode?'close':'trowel')+`<span>${transplantMode?'취소':transplantsRemaining(state)?'옮기기 1':'옮기기 0'}</span>`;document.querySelector('.app').classList.toggle('transplanting',transplantMode);$('harvest').disabled=busy||(isPlant&&!ready);const action=busy?'수확하고 있어요…':state.phase==='over'?'정원 완성 기록':state.phase==='evolve'?'식물 진화시키기':state.phase==='upgrade'?'정원의 힘 고르기':ready?`수확하기 · +${result.total}점`:`씨앗 ${picksToday(state)-state.placements}개를 더 심어요`;$('harvest').innerHTML=gardenIcon(state.phase==='evolve'?'leaf':state.phase==='upgrade'?'sun':state.phase==='over'?'trophy':ready?'basket':'seed')+`<span class="button-label">${action}</span>`;$('harvest').dataset.phase=state.phase;document.querySelector('.app').dataset.phase=state.phase;
 renderSeedStrategy();renderMission();applyDecoration();for(const id of ['help','score-button','settings','stage-button','home-button'])$(id).disabled=busy;
 if(homeVisible)renderHomeInfo();
 if(activeId&&$(activeId)&&!$(activeId).disabled)$(activeId).focus({preventScroll:true});
}
function openSheet(mode,title,eyebrow,html){sheetMode=mode;$('sheet').dataset.mode=mode;$('sheet').classList.toggle('zoom-sheet',mode==='zoom');$('sheet-title').textContent=title;$('sheet-eyebrow').textContent=eyebrow;$('sheet-content').innerHTML=html;if(!landscape.matches&&!$('sheet').open)$('sheet').showModal();else if(landscape.matches)rotatedSheet=true;}
function closeSheet(){feedback.clear();if($('sheet').open)$('sheet').close();rotatedSheet=false;}
function dismissSheet(){if(sheetMode==='report')afterReport();else if(sheetMode==='seed-discovery')finishSeedDiscovery();else if(sheetMode==='intro')beginSeedDiscovery();else closeSheet();}
function finishSeedDiscovery(){discoveryQueue=[];discoveryIndex=0;closeSheet();$('home-button').focus({preventScroll:true});}
function showSeedDiscovery(){
 while(discoveryIndex<discoveryQueue.length&&seedDiscovery.hasSeen(discoveryQueue[discoveryIndex]))discoveryIndex++;
 if(discoveryIndex>=discoveryQueue.length){finishSeedDiscovery();return;}
 const id=discoveryQueue[discoveryIndex],c=seedInlineCopy(state,id),last=discoveryIndex===discoveryQueue.length-1;
 if(!c){discoveryIndex++;showSeedDiscovery();return;}
 const saved=seedDiscovery.getStatus(),note=saved.seen.length&&!saved.durable?'확인 기록을 저장할 수 없어, 창을 다시 열면 안내가 나올 수 있어요.':'한 번 확인한 씨앗은 다음 판부터 생략해요.';
 openSheet('seed-discovery',c.name,'처음 만나는 씨앗',`<p class="discovery-progress" aria-label="새 씨앗 ${discoveryQueue.length}종 중 ${discoveryIndex+1}번째">${discoveryIndex+1} / ${discoveryQueue.length}</p><div class="discovery-art" aria-hidden="true">${plantArt(id,2)}</div><p class="discovery-basic">${escape(c.baseLabel)}</p><div class="discovery-traits">${c.lines.map(line=>`<p>${escape(line)}</p>`).join('')}</div>${c.growth?`<p class="discovery-growth">성장 · ${escape(c.growth)}</p>`:''}<p class="discovery-note">${escape(c.neighborNote)}<br>${note}</p><div class="discovery-actions"><button id="discovery-later" class="secondary">나중에 보기</button><button id="discovery-next" class="primary">${last?'확인 · 정원 시작':'확인 · 다음 씨앗 →'}</button></div>`);
 $('discovery-later').onclick=finishSeedDiscovery;
 $('discovery-next').onclick=()=>{seedDiscovery.acknowledge(id);discoveryIndex++;showSeedDiscovery();};
 $('discovery-next').focus({preventScroll:true});
 say(`처음 만나는 씨앗 ${discoveryIndex+1}/${discoveryQueue.length}. ${c.name}. ${c.baseLabel}. ${c.lines.join('. ')}`);
}
function beginSeedDiscovery(){discoveryQueue=seedDiscovery.unseen(stage().pool);discoveryIndex=0;showSeedDiscovery();}
const primaryButton=(id,text)=>`<button class="primary" id="${id}">${gardenIcon('arrow')}<span class="button-label">${text.replace(/[↗→✦]/g,'').trim()}</span></button>`;
function openZoom(zone=0){const singleZone=state.cols<=4&&state.rows<=4;zoomZone=singleZone?0:zone;zone=zoomZone;const startCol=zone%2?Math.max(0,state.cols-4):0,startRow=zone>=2?Math.max(0,state.rows-4):0,cols=Math.min(4,state.cols),rows=Math.min(4,state.rows),cells=Array.from({length:rows*cols},(_,i)=>(startRow+Math.floor(i/cols))*state.cols+startCol+i%cols),previews=previewScores(),bestSlots=bestPreviewSlots(previews);
 openSheet('zoom',`${startRow+1}–${startRow+rows}행 · ${startCol+1}–${startCol+cols}열`,selected?`${seeds()[selected].name} · 오늘 ${state.placements}/${picksToday(state)}`:`${stage().id}단계 · 확대 정원`,`<div class="zoom-grid" style="--cols:${cols};--rows:${rows}">${cells.map(i=>plotHTML(i,true,previews,-1,'zoom',bestSlots)).join('')}</div><div class="zoom-cards">${!transplantMode&&state.phase==='plant'&&state.placements<picksToday(state)?cardsHTML().replaceAll('id="seed-','id="zoom-seed-'):''}</div>${transplantMode?`<p class="zoom-move-note">${transplantSource===null?'옮길 식물을 골라요.':'빈 땅을 고르면 수확 변화를 먼저 비교해요.'}<br>다른 구역으로도 옮길 수 있어요.</p>`:selected?`<aside class="zoom-seed-inline" id="zoom-seed-advice" aria-live="polite">${seedInlineHTML(selected)}</aside>`:'<p class="zoom-tip" id="zoom-tip">씨앗을 고르면 아래에 특성이 나와요.</p>'}<div class="guide-pages"><button class="secondary" id="zone-prev" ${singleZone?'hidden':''}>← 옆 구역</button><button class="secondary" id="zoom-close">전체 정원</button><button class="secondary" id="zone-next" ${singleZone?'hidden':''}>옆 구역 →</button></div>`);
 $('zone-prev').onclick=()=>openZoom((zoomZone+3)%4);$('zone-next').onclick=()=>openZoom((zoomZone+1)%4);$('zoom-close').onclick=closeSheet;
 $('sheet-content').querySelectorAll('[data-seed]').forEach(b=>b.onclick=()=>selectSeed(b.dataset.seed,zoomZone));
 $('sheet-content').querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.slot);if(pickTransplant(i,zoomZone))return;if(state.board[i]){tileDetail(i,zoomZone);return;}if(plantAt(i)){if(state.placements>=picksToday(state)){closeSheet();plantFeedback(i);}else {openZoom(zoomZone);plantFeedback(i);}}else{($('zoom-tip')||$('zoom-seed-advice')).textContent=state.phase==='plant'&&state.placements<picksToday(state)?'아래 씨앗에서 하나를 먼저 골라 주세요.':'전체 정원으로 돌아가 수확·보너스·결과를 진행해 주세요.';}});
}
function selectSeed(id,returnZone=null){if(busy||state.phase!=='plant'||state.placements>=picksToday(state))return;transplantMode=false;transplantSource=null;selected=id;render();sfx.play('select',{type:id});haptic(5);if(returnZone!==null)openZoom(returnZone);say(`${seeds()[id].name} 선택. 아래 특성을 확인하고 빈 땅에 바로 심으세요.`);}
function plantAt(index){if(transplantMode||busy||state.phase!=='plant'||!selected||state.placements>=picksToday(state))return false;const next=plant(state,index,selected);if(next===state)return false;const plantedType=selected,name=seeds()[selected].name,wasComplete=missionFor(state)?.complete;state=next;selected=null;persist();render(index);sfx.play('plant',{type:plantedType});haptic(9);plantFeedback(index);const mission=missionFor(state);if(!wasComplete&&mission?.complete){const paid=profile.claimedMissions.includes(`${state.stageId}:${mission.day}`);if(!paid)sfx.play('mission');toast(paid?'부탁 해결! 보상은 이미 받았어요':'모모의 부탁 해결! 수확하면 꽃잎 +2');haptic([9,35,15]);}say(`${name} 심기 완료. 오늘 ${state.placements}/${picksToday(state)}, 수확 예상 ${forecast(state).total}점.`);return true;}
function help(page=0){const catalog=seeds(),catalogStages=previousRules()?.STAGES??STAGES,ids=Object.keys(catalog).sort((a,b)=>catalogStages.find(s=>s.pool.includes(a)).id-catalogStages.find(s=>s.pool.includes(b)).id),plantPages=Math.ceil(ids.length/3),rewardsPage=plantPages+1,lastPage=plantPages+2,pages=lastPage+1;helpPage=Math.max(0,Math.min(pages-1,page));let html='';
 if(helpPage===0)html=`<div class="guide-steps"><div class="guide-step"><span>1</span><div><strong>7일의 수확으로 목표에 도전해요</strong><p>총점이 최소 목표 이상이면 다음 단계가 열려요. 씨앗과 날씨는 같아도 배치에 따라 결과가 달라져요.</p></div></div><div class="guide-step"><span>2</span><div><strong>같은 식물을 세로로 모아 보세요</strong><p>${state.version<4?'이전 규칙으로 이어가는 정원이에요. 새 규칙은 시작 화면에서 선택할 수 있어요.':'같은 열 2개면 각각 +2, 3개 +4, 4개 이상 +6. 떨어져 있어도 돼요. 우물·벌집은 제외해요.'}</p></div></div><div class="guide-step"><span>3</span><div><strong>${state.version>=5?'식물 진화 + 정원 성장':'성장 보너스도 내 전략에 맞게'}</strong><p>${state.version>=6?'1·3·5일 수확 뒤 한 송이를 골라 2단계 또는 3단계로 키워요. ':state.version===5?'1·3·5일 수확 뒤 처음 여섯 종류 중 한 송이를 진화시켜요. ':''}2·4·6일에는 정원 능력을 하나 골라요.${state.version===2?' 새 규칙으로 시작하면 제안 새로고침도 열려요.':' 마음에 드는 제안이 없으면 매 선택마다 한 번 무료로 새로고침해요.'}</p></div></div></div><p class="sheet-note">${state.version>=7?'옮겨심기: 아래 모종삽 → 식물 → 빈 땅. 성장·진화 유지, 한 정원에 한 번.<br>':''}끝없는 단계 · 4×4 → 7×7 · 수확 전 되돌리기</p>`;
 else if(helpPage<=plantPages){const entries=ids.slice((helpPage-1)*3,helpPage*3),stages=previousRules()?.STAGES??STAGES;html=`<div class="plant-guide">${entries.map(id=>{const unlock=stages.find(s=>s.pool.includes(id)).id;return `<article>${plantArt(id,2,{small:true})}<div><h3>${catalog[id].name} <small>${unlock===1?'처음부터':unlock+'단계 해금'}</small></h3><p>${catalog[id].description}</p></div></article>`;}).join('')}</div><p class="sheet-note">현재 ${stage().pool.length}종 / 전체 ${ids.length}종.<br>이웃은 상하좌우. 개별 점수는 식물을 눌러 확인해요.</p>`;}
 else if(helpPage===rewardsPage)html=`<div class="sheet-body"><p><strong>모모의 부탁</strong>은 2·4·6일에 찾아와요. 해결하고 수확하면 꽃잎 +2. 같은 단계의 같은 날 보상은 한 번만 받아요. 놓쳐도 감점은 없어요.</p><p><strong>각 단계 첫 클리어는 꽃잎 +3.</strong> 꽃잎을 모으면 꾸미기 수첩의 장식이 열려요. 장식을 골라도 꽃잎은 줄지 않아요.</p><p><strong>목표를 넘겨 별을 모아요.</strong><br>목표 100% ★ · 115% ★★ · 140% ★★★<br>재도전으로 더 높은 별 기록에 도전해 보세요.</p></div><p class="sheet-note">꽃잎과 장식은 수확 점수에 영향을 주지 않아요.</p>`;
 else html=`<div class="sheet-body"><p><strong>같은 날씨, 다른 정원으로.</strong> 101단계부터도 7×7 새 정원은 계속 이어져요. 재도전은 같은 씨앗과 날씨, 다른 배치로 도전해요.</p><p><strong>이 브라우저에 자동 저장돼요.</strong> 현재 정원·해금·최고 기록을 이어갈 수 있어요. 다른 기기와 동기화되지 않으며 브라우저 데이터를 지우면 사라져요.</p><p>${state.version<4?'진행 중인 정원은 기존 규칙으로 보존했어요. 아래에서 다시 시작하면 세로열 보너스와 높은 목표가 적용돼요.':'다시 시작해도 이미 깬 단계와 최고 기록, 꽃잎과 장식은 남아요.'}</p></div><div class="sheet-actions"><button class="secondary" id="reset-run">${state.version<4?'새 규칙으로 이 단계 시작':'이 단계 처음부터'}</button></div><p class="sheet-note">옮겨심기와 조합 수확 정원 v24 · 정식 판매 버전이 아닙니다.</p>`;
 html+=`<div class="guide-pages"><button class="secondary" id="help-prev" ${helpPage===0?'disabled':''}>← 이전</button><span>${helpPage+1} / ${pages}</span><button class="secondary" id="help-next">${helpPage===lastPage?'닫기':'다음 →'}</button></div>`;
 openSheet('help',helpPage===0?'다르게 심어, 더 크게':helpPage===rewardsPage?'모모와 꽃잎, 별':helpPage===lastPage?'다시, 다른 선택으로':'식물 도감','정원사의 수첩',html);$('help-prev').onclick=()=>help(helpPage-1);$('help-next').onclick=()=>helpPage===lastPage?closeSheet():help(helpPage+1);if($('reset-run'))$('reset-run').onclick=()=>confirmStage(state.stageId);
}
function tileDetail(index,returnZone=null){sfx.play('inspect',{type:state.board[index]?.type});if(state.phase==='evolve'&&evolvableTiles(state).includes(index)){evolutions(index);return;}const tile=state.board[index];if(!tile)return;const data=resultFor()?.tiles.find(t=>t.index===index),well=tile.type==='well';openSheet('tile',well?'작은 우물':evolutionName(tile)||seeds()[tile.type].name,well?'정원의 작은 샘':`${tile.age}번 성장 · ${Math.floor(index/state.cols)+1}행 ${index%state.cols+1}열`,`<div class="tile-detail-art">${art(tile)}</div>${tile.evolution?`<p class="evolution-description"><strong>✦ ${evolutionName(tile)}</strong>${evolutionDetails(tile).description}</p>`:''}<p class="tile-description">${well?'상하좌우 식물에 기본 +2. 벌집은 제외예요.<br>맑은 샘물을 고르면 +4, 버섯은 그늘 효과도 더해요.':seeds()[tile.type].description}</p>${data?`<div class="tile-reasons">${data.reasons.map(r=>`<div><span class="${r.label==='같은 열'?'column-reason':''}">${escape(r.label)}</span><strong>${signed(r.value)}</strong></div>`).join('')}</div><div class="big-harvest"><strong>+${data.value}</strong><span>${state.phase==='plant'?'이번 수확 예상':'마지막 수확'}</span></div>`:''}<div class="sheet-actions">${primaryButton('back-to-garden',returnZone===null?'정원으로':'확대 정원으로')}</div>`);$('back-to-garden').onclick=()=>returnZone===null?closeSheet():openZoom(returnZone);}
function report(){const r=state.lastHarvest;if(!r)return;const top=[...r.tiles].sort((a,b)=>b.value-a.value).slice(0,3);openSheet('report',`${r.day}일째 수확했어요`,`${stage().id}단계 · 목표 ${stage().target}점`,`<div class="big-harvest"><strong>+${r.total}</strong><span>햇살</span></div><p class="harvest-sub">누적 ${state.score} / ${stage().target}점 · 조합 효과 ${r.comboCount}곳</p><p class="harvest-reasons">${escape(harvestPresentation(r).summary)}</p><div class="report-rows">${top.map(t=>`<div class="report-row"><span>${art(state.board[t.index],true)}${evolutionName(state.board[t.index])||seeds()[t.type].name}<small>${Math.floor(t.index/state.cols)+1}행 ${t.index%state.cols+1}열</small></span><strong>+${t.value}</strong></div>`).join('')}</div>${harvestRewardHTML()}<p class="sheet-note">${r.day===RUN_DAYS?(passed()?'최소 목표 달성! 단계 클리어입니다.':`최소 목표까지 ${stage().target-state.score}점 부족해요.`):state.phase==='evolve'?'수확한 식물이 새 모습으로 자랄 준비를 마쳤어요.':state.phase==='upgrade'?'성장 보너스로 다음 수확을 더 풍성하게.':`내일은 ${weatherData()[state.weather[state.day-1]].name}. 식물은 그대로 남아 자라요.`}</p><div class="sheet-actions">${primaryButton('continue-day',state.phase==='over'?'단계 결과 보기 ↗':state.phase==='evolve'?'식물 진화시키기 ✦':state.phase==='upgrade'?'성장 보너스 고르기 ✦':`${state.day}일째 시작 →`)}</div>`);$('continue-day').onclick=afterReport;}
function afterReport(){closeSheet();if(state.phase==='evolve')evolutions();else if(state.phase==='upgrade')upgrades();else if(state.phase==='over')results();else say(`${state.day}일째. 새 씨앗을 골라 주세요.`);}
function upgrades(focused=null){if(state.phase!=='upgrade')return;const left=rerollsRemaining(state),choice=state.upgradeOffers.includes(focused)?focused:null,a=choice?upgradeAdvice(state,choice):null;
 openSheet('upgrade','정원의 힘을 골라요',`${RUN_DAYS-state.day}번 수확 동안 유지`, `${harvestRewardHTML(true)}<div class="strategy-upgrades">${state.upgradeOffers.map(id=>{const u=abilities()[id],v=upgradeAdvice(state,id),effect=upgradeEffectCopy(state,id);return `<button class="strategy-upgrade" data-upgrade="${id}" aria-pressed="${choice===id}"><span aria-hidden="true">${u.icon}</span><span><strong>${u.name}</strong><small class="upgrade-effect">${(effect?.lines||[u.description]).map(line=>`<span>${escape(line)}</span>`).join('')}</small></span><b>${v?signed(v.nowDelta):'—'}<small>다음 수확</small></b></button>`;}).join('')}</div><div class="choice-explanation" aria-live="polite">${a?`<p class="upgrade-preview-numbers"><b>내 정원 변화</b> ${escape(a.nowLabel)} ${signed(a.nowDelta)}점${a.laterDelta!==null?' · '+escape(a.laterLabel)+' '+signed(a.laterDelta)+'점':''}</p><p class="upgrade-preview-reason">${escape(a.reason)}</p>`:'<p class="choice-prompt">카드의 기본 효과를 비교해 보세요.<br>누르면 내 정원에서 늘어나는 점수가 나와요.</p>'}</div><p class="advice-assumption">선택 전 대비 · 같은 배치, 이후 심기·새 보너스 제외</p><div class="choice-actions"><button id="confirm-upgrade" class="primary choice-confirm" ${choice?'':'disabled'}>${choice?abilities()[choice].name+' 선택하기':'먼저 능력을 골라 주세요'}</button></div><div class="strategy-reroll"><button class="secondary" id="reroll-upgrades" ${left?'':'disabled'}>↻ ${left?'다른 능력 보기':'새로고침 사용 완료'} ${state.version===2?'':left+'/1'}</button><small>${state.version===2?'이전 정원은 새로고침 없음':left?'한 번 무료 · 세 능력 모두 바뀌어요':'다음 성장 선택에서 다시 사용해요'}</small></div>`);
 $('sheet-content').querySelectorAll('[data-upgrade]').forEach(b=>b.onclick=()=>{sfx.play('inspect');upgrades(b.dataset.upgrade);});
 $('confirm-upgrade').onclick=()=>{if(!choice)return;const next=chooseUpgrade(state,choice);if(next===state)return;state=next;selected=null;persist();closeSheet();render();feedback.celebrate($('board'),'upgrade');sfx.play('upgrade');haptic([10,35,16]);say(`${abilities()[choice].name} 선택. ${state.day}일째 시작.`);};
 $('reroll-upgrades').onclick=()=>{const next=rerollUpgrades(state);if(next===state)return;state=next;persist();sfx.play('reroll');upgrades();haptic(8);say('성장 제안 세 개를 새로 뽑았어요. 이번 선택의 새로고침을 사용했습니다.');};
}

function miniGarden(){return `<div class="mini-garden" style="--cols:${state.cols};--rows:${state.rows}" aria-label="완성된 ${state.cols}×${state.rows} 정원">${state.board.map(t=>`<span>${t?art(t,true):''}</span>`).join('')}</div>`;}
function results(){saveRecord();persist();const st=stage(),clear=passed(),next=clear?stageFor(st.id+1):null,highlights=harvestHighlights(state),stars=starsFor(state),nextStar=stars<3?Math.ceil(st.target*(stars===1?1.15:stars===2?1.4:1)):null;
 openSheet('result',clear?'정원이 활짝 피었어요':'다시 심어도 괜찮아요',`${st.id}번째 정원 · ${clear?'CLEAR':'ONE MORE GARDEN'}`,`${harvestRewardHTML(true)}<div class="result-heading" aria-label="별 ${stars}개 / 3개">${[1,2,3].map(n=>`<span class="star ${n<=stars?'won':''}" style="--delay:${(n-1)*130}ms" aria-hidden="true">★</span>`).join('')}</div><div class="result-postcard">${miniGarden()}<div class="result-postcard-copy"><small>일곱 날의 수확 기록</small><strong>${st.name}</strong><span>${highlights.bestDay?`가장 풍성한 날 · ${highlights.bestDay}일 ${highlights.bestTotal}점`:"첫 수확을 기다려요"}<br>${highlights.leadType?`${escape(seeds()[highlights.leadType]?.name||highlights.leadType)} 누적 ${highlights.leadTotal}점`:""}</span></div></div><div class="stat-grid"><div><strong>${state.score}</strong><small>이번 점수</small></div><div><strong>${st.target}</strong><small>클리어 목표</small></div><div><strong>${campaign.stages[st.id]?.best||state.score}</strong><small>나의 최고</small></div></div><div class="result-rewards"><span>✿ 꽃잎 ${profile.petals}${lastClearReward?' · 첫 클리어 +'+lastClearReward:''}</span><span>${nextStar?`다음 별 ${nextStar}점`:'별 세 개, 완벽한 수확!'}</span></div><p class="result-next">${clear?(next?`다음은 ${next.id}단계 · ${next.cols}×${next.rows}${next.unlocks.length?'<br>새 친구 '+next.unlocks.map(id=>SEEDS[id].name).join(' · ')+' 등장!':''}`:'참 멀리까지 온 정원이에요.'):`${st.target-state.score}점만 더!<br>이웃 효과와 내일 날씨를 함께 살펴보세요.`}</p><div class="sheet-actions"><button class="secondary" id="result-collection">꾸미기 수첩</button>${primaryButton(clear&&next?'next-stage':'retry-stage',clear&&next?'다음 정원 →':'다시 키우기')}</div><button class="sheet-home-link" id="result-home">시작 화면으로</button>`);
 $('result-collection').onclick=collection;$('result-home').onclick=showHome;if($('next-stage'))$('next-stage').onclick=()=>startStage(st.id+1);if($('retry-stage'))$('retry-stage').onclick=()=>startStage(st.id);if(clear){celebrate();sfx.play('success');haptic([15,60,15,60,35]);}else sfx.play('fail');
}
function stagesMenu(page=Math.floor((state.stageId-1)/10)){
 const maxPage=Math.floor((Math.max(100,campaign.unlocked)-1)/10);stagePage=Math.max(0,Math.min(maxPage,Number.isSafeInteger(page)?page:0));
 const chunk=Array.from({length:10},(_,i)=>{const id=stagePage*10+i+1;if(!Number.isSafeInteger(id))return null;if(id===state.stageId&&state.phase!=='over')return stageFor(state);if(id>100&&campaign.stages[id]?.cleared)return {id,name:`이어지는 정원 ${id}`,cols:7,rows:7,target:campaign.stages[id].targetAtClear,unlocks:[]};return id>100&&id>campaign.unlocked?{id,name:'다음 무한 정원',cols:7,rows:7,target:null,unlocks:[]}:stageFor(id);}).filter(Boolean);
 openSheet('stages','정원의 길',`${campaign.unlocked}단계까지 열림`, `<p class="upgrade-intro">${stagePage>=10?'101단계부터는 7×7 새 정원이 계속 이어져요.':'목표를 넘길 때마다 다음 정원이 열려요.'}</p><div class="stage-list">${chunk.map(st=>{const unlocked=st.id<=campaign.unlocked,record=campaign.stages[st.id],isCurrent=state.stageId===st.id,currentLegacy=isCurrent&&state.version<6&&state.phase!=='over';return `<button class="stage-card ${record?.cleared?'cleared':''} ${isCurrent?'current':''}" data-stage="${st.id}" ${unlocked?'':'disabled'} aria-label="${st.id}단계 ${st.name}, ${st.cols}열 ${st.rows}행, ${st.target===null?'목표는 해금 후 공개':'목표 '+st.target+'점'}${currentLegacy?', 이전 규칙 이어하기':record?.cleared?', 완료':unlocked?', 열림':', 잠김'}"><strong><span>${String(st.id).padStart(2,'0')}</span>${record?.cleared?'✓':unlocked?'↗':'◇'}</strong><span class="stage-name">${st.name}</span><small>${st.cols}×${st.rows} · ${st.target===null?'해금 후 목표 공개':'목표 '+st.target}</small>${currentLegacy?'<span class="new-label">이전 규칙 · 이어하기</span>':st.unlocks.length?`<span class="new-label">+ ${st.unlocks.map(id=>SEEDS[id].name).join(' · ')}</span>`:''}</button>`;}).join('')}</div><div class="stage-jump"><label for="stage-number">단계</label><input id="stage-number" aria-label="찾을 단계 번호" type="number" inputmode="numeric" min="1" max="${Math.max(100,campaign.unlocked)}" value="${stagePage*10+1}"><button class="secondary" id="stage-go">이동</button><button class="secondary" id="stage-prev" aria-label="이전 10단계" ${stagePage===0?'disabled':''}>←</button><button class="secondary" id="stage-next" aria-label="다음 10단계" ${stagePage===maxPage?'disabled':''}>→</button></div>`);
 const jump=()=>{const id=Number($('stage-number').value);if(!Number.isSafeInteger(id)||id<1||id>Math.max(100,campaign.unlocked)){say('열린 단계 안에서 번호를 입력해 주세요.');$('stage-number').focus();return;}stagesMenu(Math.floor((id-1)/10));};
 $('stage-go').onclick=jump;$('stage-number').onkeydown=e=>{if(e.key==='Enter')jump();};$('stage-prev').onclick=()=>stagesMenu(stagePage-1);$('stage-next').onclick=()=>stagesMenu(stagePage+1);
 $('sheet-content').querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{const id=Number(b.dataset.stage);if(id===state.stageId&&state.phase!=='over'){closeSheet();resumeGarden();return;}if(state.phase!=='over'&&(state.day>1||state.placements>0))confirmStage(id);else startStage(id);});
}
function stageIntro(){const st=stage();openSheet('intro',`${st.id}단계 · ${st.name}`,'이번 정원의 목표',`<div class="intro-goal"><span>클리어 최소 점수</span><strong>${st.target}<small>점</small></strong></div><div class="stat-grid"><div><strong>${st.cols}×${st.rows}</strong><small>정원 크기</small></div><div><strong>${st.pool.length}종</strong><small>사용할 씨앗</small></div><div><strong>7일</strong><small>수확 기간</small></div></div>${state.version>=5?'<p class="evolution-intro">✦ 첫 수확 뒤, 식물 한 송이가 진화해요.<br>같은 씨앗도 어떤 모습으로 키울지는 당신의 선택.</p>':''}${st.unlocks.length?`<p class="unlock-heading">이번에 만날 새 식물</p><div class="unlock-plants ${st.unlocks.length>3?'many':''}">${st.unlocks.map(id=>`<span>${plantArt(id,2,{small:true})}<strong>${seeds()[id].name}</strong><small>${seeds()[id].short}</small></span>`).join('')}</div>`:`<p class="sheet-body">${st.id>100?'끝없는 정원이에요. 새로운 씨앗·날씨·우물 배치에 맞춰 키워 보세요.':st.cols>=6?'커진 정원은 구역을 눌러 확대할 수 있어요.':'오늘과 내일 날씨, 우물 위치를 먼저 살펴보세요.'}</p>`}<p class="sheet-note">${state.version>=7?'모종삽으로 한 번 옮겨심을 수 있어요.<br>':''}7일 총합 ${st.target}점 이상이면 다음 단계가 열려요.<br>이 단계에서는 하루 ${Math.min(...st.picksPerDay)===Math.max(...st.picksPerDay)?picksToday(state):Math.min(...st.picksPerDay)+'–'+Math.max(...st.picksPerDay)}개를 심습니다.</p><div class="sheet-actions">${primaryButton('begin-stage','정원 키우기 →')}</div>`);$('begin-stage').onclick=beginSeedDiscovery;}
function confirmStage(id){const next=stageFor(id);openSheet('reset',`${id}단계를 시작할까요?`,'새 정원 시작',`<div class="sheet-body"><p>진행 중인 정원은 새로 시작합니다. 이미 깬 단계와 최고 점수, 꽃잎과 장식은 그대로 남아요.</p><p><strong>${next.pool.length}종 씨앗 · 목표 ${next.target}점</strong><br>새 정원은 옮겨심기 1회와 3단계 진화, 날씨 부탁이 적용돼요. 1·3·5일에 집중 육성하거나 다른 식물을 진화시켜요.</p></div><div class="sheet-actions"><button class="secondary" id="cancel-reset">계속 키우기</button><button class="primary" id="confirm-reset">새 정원 시작</button></div>`);$('cancel-reset').onclick=closeSheet;$('confirm-reset').onclick=()=>startStage(id);}
function startStage(id){if(!canPlay(campaign,id))return;closeSheet();hideHome();lastClearReward=0;lastMissionReward=0;state=newRun(undefined,id);selected=null;transplantMode=false;transplantSource=null;persist();render();sfx.play('inspect');stageIntro();say(`${id}단계. 목표 ${stage().target}점.`);}
function journal(){const max=Math.max(1,...state.harvests.map(r=>r.total));openSheet('journal',`${state.stageId}단계 정원 기록`,`${stage().name} · ${stage().cols}×${stage().rows}`,`<div class="stat-grid"><div><strong>${state.score}</strong><small>누적 점수</small></div><div><strong>${stage().target}</strong><small>최소 목표</small></div><div><strong>${campaign.stages[state.stageId]?.best||0}</strong><small>단계 최고</small></div></div><div class="chart" aria-label="하루별 수확">${Array.from({length:RUN_DAYS},(_,i)=>`<div class="chart-bar" style="height:${state.harvests[i]?Math.max(5,state.harvests[i].total/max*100):3}%"><span>${state.harvests[i]?.total||'·'}</span><small>${i+1}일</small></div>`).join('')}</div><div class="result-badges">${state.board.filter(t=>t?.evolution).map(t=>`<span>✦ ${evolutionName(t)}</span>`).join('')}${state.upgrades.length?state.upgrades.map(id=>`<span>${abilities()[id].icon} ${abilities()[id].name}</span>`).join(''):'<span>2·4·6일 성장 보너스 선택</span>'}</div><p class="sheet-note">이번 단계는 ${stage().pool.length}종을 사용할 수 있어요.<br>남은 ${RUN_DAYS-state.harvests.length}일 동안 목표를 넘겨 보세요.</p><div class="sheet-actions">${state.lastHarvest?'<button class="secondary" id="last-harvest-report">지난 수확 자세히</button>':''}${primaryButton('journal-close','정원으로')}</div>`);$('journal-close').onclick=closeSheet;if($('last-harvest-report'))$('last-harvest-report').onclick=report;}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function doHarvest(){
 if(busy)return;
 if(state.phase==='over'){results();return;}
 if(state.phase==='evolve'){evolutions();return;}
 if(state.phase==='upgrade'){upgrades();return;}
 if(state.placements!==picksToday(state))return;
 const scoreBefore=state.score,target=stage().target,next=harvest(state),r=next.lastHarvest;
 if(next===state||!r)return;
 busy=true;selected=null;transplantMode=false;transplantSource=null;render();state=next;
 const beforePetals=profile.petals;
 profile=claimHarvest(profile,state);lastMissionReward=profile.petals-beforePetals;lastClearReward=0;
 saveRecord();lastDecorUnlocks=Object.values(DECORATIONS).filter(d=>d.threshold>beforePetals&&d.threshold<=profile.petals);
 persist();sfx.play('harvest');haptic([14,45,22]);
 $('garden-frame').classList.add('harvest-celebration');
  try{
   if(!reduced.matches&&!document.hidden){
    const presentation=harvestPresentation(r);
    feedback.harvest(r.tiles.map(t=>$('plot-'+t.index)||$('board').querySelector(`[data-cell="${t.index}"]`)),{target:$('score'),highlightIndices:presentation.highlights.map(t=>t.index)});
    for(let i=0;i<presentation.steps.length;i++){
     if(document.hidden||reduced.matches)break;
     const step=presentation.steps[i];
     for(const index of step.indices)($('plot-'+index)||$('board').querySelector(`[data-cell="${index}"]`))?.classList.add('collecting');
     sfx.play('bloom',{step:i});const counted=scoreBefore+step.cumulative;
     $('score').textContent=counted;renderGoal(counted,target);
     if(!await presentationDelay(120,{document,reduced}))break;
    }
    if(!document.hidden&&!reduced.matches){$('harvest-banner').innerHTML=`+${r.total} 햇살<small>${escape(presentation.summary)}</small>`;$('harvest-banner').hidden=false;await presentationDelay(180,{document,reduced});}
   }
 }finally{
  $('harvest-banner').hidden=true;$('garden-frame').classList.remove('harvest-celebration');busy=false;render();
 }
 toast(`+${r.total} 햇살${lastMissionReward?' · 꽃잎 +'+lastMissionReward:''}`);
 afterReport();
 say(`${r.day}일째 ${r.total}점 수확, 누적 ${state.score}점.${lastMissionReward?' 부탁 보상 꽃잎 '+lastMissionReward+'개.':''}`);
}
$('seed-cards').addEventListener('click',e=>{const b=e.target.closest('[data-seed]');if(b)selectSeed(b.dataset.seed);});
$('board').addEventListener('click',e=>{const b=e.target.closest('[data-slot]');if(!b||busy)return;const index=Number(b.dataset.slot);if(pickTransplant(index))return;if(state.board[index])tileDetail(index);else if(!plantAt(index)&&state.phase==='plant'&&state.placements<picksToday(state)){$('tip').textContent='아래에서 씨앗을 먼저 골라 주세요.';say('씨앗을 먼저 골라 주세요.');}});
$('zoom-zones').addEventListener('click',e=>{const b=e.target.closest('[data-zone]');if(b&&!busy)openZoom(Number(b.dataset.zone));});
$('board').addEventListener('keydown',e=>{const b=e.target.closest('[data-slot]');if(!b)return;const i=Number(b.dataset.slot),moves={ArrowLeft:-1,ArrowRight:1,ArrowUp:-state.cols,ArrowDown:state.cols};if(e.key in moves){e.preventDefault();const next=i+moves[e.key];if(next>=0&&next<state.board.length&&(!(e.key==='ArrowLeft'||e.key==='ArrowRight')||Math.floor(next/state.cols)===Math.floor(i/state.cols)))$('plot-'+next)?.focus();}});
$('undo').onclick=()=>{if(busy)return;const next=undo(state);if(next===state)return;state=next;selected=null;transplantMode=false;transplantSource=null;persist();render();sfx.play('undo');haptic(6);say('마지막 배치와 씨앗 제안을 복원했어요.');};
$('transplant').onclick=toggleTransplant;
$('harvest').onclick=doHarvest;$('help').onclick=()=>help(0);$('score-button').onclick=journal;$('stage-button').onclick=()=>stagesMenu();$('home-button').onclick=pauseGarden;$('settings').onclick=settings;
$('home-sound').onclick=()=>{profile=setOptions(profile,{sound:!sound});sound=profile.options.sound;persist();if(sound)sfx.play('plant',{type:'sunflower'});else sfx.stop();renderHomeInfo();updateSoundControls();};
$('home-preview').onclick=evolutionGuide;$('home-play').onclick=()=>{const action=homeActionFor(state,stage().target);if(action.kind==='next'||action.kind==='retry')startStage(action.stageId);else resumeGarden();};$('home-last-result').onclick=resumeGarden;$('home-stages').onclick=()=>stagesMenu();$('home-collection').onclick=collection;$('home-settings').onclick=settings;$('home-new-rules').onclick=()=>confirmStage(state.stageId);$('mission-button').onclick=missionSheet;
$('close-sheet').onclick=dismissSheet;$('sheet').addEventListener('cancel',e=>{e.preventDefault();dismissSheet();});
$('sheet').addEventListener('close',()=>{if(!paused||rotatedSheet)return;paused=false;music.setHidden(document.hidden);weatherScene.update(state.weather[state.day-1],{paused:homeVisible});});
landscape.addEventListener('change',()=>{if(landscape.matches){feedback.clear();sfx.stop();}if(landscape.matches&&$('sheet').open){rotatedSheet=true;$('sheet').close();}else if(!landscape.matches&&rotatedSheet){rotatedSheet=false;$('sheet').showModal();}fitBoard();});
new ResizeObserver(fitBoard).observe($('board-space'));window.addEventListener('resize',fitBoard);
// A real click (including keyboard activation) unlocks audio; initial page load stays silent.
document.addEventListener('click',event=>{
 if(event.isTrusted&&event.target.closest('button')&&!event.target.closest('#toggle-music,#music-retry'))music.activate();
},{capture:true});
document.addEventListener('visibilitychange',()=>{music.setHidden(document.hidden||paused);if(document.hidden){feedback.clear();sfx.stop();}});
reduced.addEventListener('change',()=>feedback.clear());
window.addEventListener('pagehide',()=>{music.setHidden(true);feedback.clear();sfx.stop();});
window.addEventListener('pageshow',()=>music.setHidden(document.hidden||paused));
installGardenControls();saveRecord();render();persist();showHome();

function haptic(pattern=8){if(!profile.options.haptics||!hapticCapable)return;try{navigator.vibrate(pattern);}catch{}}
function applyDecoration(){const id=profile.selectedDecoration||'';$('garden-frame').dataset.decoration=id;$('home-screen').dataset.decoration=id;}
function updateSoundControls(){$('settings').innerHTML=gardenIcon('settings');$('settings').setAttribute('aria-label','정원 설정 · 음악과 효과음');$('settings').classList.remove('sound-off');if($('home-sound')){$('home-sound').innerHTML=gardenIcon(sound?'sound':'muted');$('home-sound').setAttribute('aria-label',sound?'효과음 켜짐 · 끄기':'효과음 꺼짐 · 켜기');$('home-sound').setAttribute('aria-pressed',sound);}}
function renderHomeInfo(){updateSoundControls();const s=summaryFor(profile,campaign),action=homeActionFor(state,stage().target);$('home-stats').innerHTML=`<span>완성한 정원<strong>${s.cleared}개</strong></span><span>모은 별<strong>${s.stars}</strong></span><span>꽃잎<strong>${s.petals}</strong></span>`;$('home-new-rules').hidden=state.version>=7;$('home-new-rules').textContent='옮겨심기 있는 새 정원 시작';$('home-play').innerHTML=`${gardenIcon(action.kind==='resume'?'play':'seed')}<span class="button-copy"><strong>${action.title}</strong><small>${action.detail}</small></span>${gardenIcon('arrow')}`;$('home-last-result').hidden=state.phase!=='over';const status=storage.getStatus(),notice=saveNoticeFor(status),note=document.querySelector('.home-note');note.textContent=notice.warning?notice.short:status.recovered?'이전 정상 기록에서 정원을 되찾았어요.':'서두르지 않아도 괜찮아요. 당신의 속도로.';note.classList.toggle('storage-warning',notice.warning);}
function showHome(){if(busy)return;feedback.clear();closeSheet();homeVisible=true;$('home-screen').hidden=false;document.querySelector('.app').classList.add('home-mode');weatherScene.update(state.weather[state.day-1],{paused:true});document.querySelector('.game').inert=true;document.querySelector('.topbar').inert=true;renderHomeInfo();$('home-play').focus({preventScroll:true});}
function hideHome(){homeVisible=false;$('home-screen').hidden=true;document.querySelector('.app').classList.remove('home-mode');weatherScene.update(state.weather[state.day-1],{paused:false});document.querySelector('.game').inert=false;document.querySelector('.topbar').inert=false;fitBoard();}
function resumeGarden(){hideHome();haptic(10);sfx.play('inspect');if(state.phase==='over')results();else if(state.phase==='evolve')evolutions();else if(state.phase==='upgrade')upgrades();else if(state.day===1&&state.placements===0)stageIntro();else beginSeedDiscovery();}
function installGardenControls(){
 for(const [id,icon] of [['stage-button','map'],['help','book'],['settings','settings'],['close-sheet','close']])$(id).innerHTML=gardenIcon(icon);
 document.querySelector('.brand-mark').innerHTML=gardenIcon('leaf');
 document.querySelector('#score-button>span').innerHTML=gardenIcon('sun');
 $('undo').innerHTML=gardenIcon('undo')+'<span>되돌리기</span>';
 for(const [id,icon,label] of [['home-stages','map','정원의 길'],['home-collection','leaf','꾸미기'],['home-settings','settings','설정']])$(id).innerHTML=gardenIcon(icon)+`<span class="button-label">${label}</span>`;
 $('home-preview').innerHTML=gardenIcon('book')+'<span class="button-label">씨앗에서 만개까지</span>';
}
function pauseGarden(){
 if(busy||homeVisible)return;
 persist();paused=true;music.setHidden(true);sfx.stop();feedback.clear();weatherScene.update(state.weather[state.day-1],{paused:true});
 openSheet('pause','잠깐, 쉬어 가요',`${stage().name} · ${state.stageId}번째 정원`,
 `<div class="pause-summary">${gardenIcon('leaf')}<div><strong>${state.day}일째 정원</strong><span>${state.score} / ${stage().target}점 · ${RUN_DAYS-state.harvests.length}번 수확 남음</span></div></div><p class="storage-notice">${escape($('save-status').textContent)}<br>시간 제한은 없어요. 준비되면 이어서 가꿔요.</p><div class="sheet-actions">${primaryButton('pause-resume','계속 가꾸기')}</div><div class="pause-actions"><button class="secondary" id="pause-journal">${gardenIcon('book')}수확 기록</button><button class="secondary" id="pause-settings">${gardenIcon('settings')}정원 설정</button><button class="secondary" id="pause-home">${gardenIcon('home')}시작 화면</button><button class="secondary" id="pause-stages">${gardenIcon('map')}정원의 길</button></div>`);
 $('pause-resume').onclick=closeSheet;
 $('pause-journal').onclick=()=>{closeSheet();journal();};$('pause-settings').onclick=()=>{closeSheet();settings();};
 $('pause-home').onclick=showHome;$('pause-stages').onclick=()=>{closeSheet();stagesMenu();};
 $('pause-resume').focus({preventScroll:true});
}
function saveStatusSheet(){
 const status=storage.getStatus();
 const notice=saveNoticeFor(status);
 openSheet('save-status','정원 기록 보관함','내 기기의 저장 상태',`<div class="pause-summary">${gardenIcon(status.volatile?'book':'check')}<div><strong>${notice.title}</strong><span>브라우저 저장 · 클라우드 동기화 없음</span></div></div><p class="storage-notice">${notice.message}</p><p class="sheet-body">이전 저장본을 복구용으로 보관해요. 손상된 기록도 가능한 경우 별도로 남겨요.</p><p class="sheet-note">브라우저 데이터 삭제·다른 기기·시크릿 모드에서는 기록이 이어지지 않을 수 있어요.${status.quarantineFailed?'<br>손상 원문을 따로 보관하지 못해 기존 원본을 유지하고 있어요.':''}</p><div class="sheet-actions">${primaryButton('save-status-close','알겠어요')}</div>`);
 $('save-status-close').onclick=closeSheet;
}
function renderMission(){const m=missionFor(state),paid=m&&profile.claimedMissions.includes(`${state.stageId}:${m.day}`);$('mission-button').classList.toggle('done',!!m?.complete);$('mission-button').disabled=busy;
 if(state.version>=5&&state.phase==='evolve'){$('mission-copy').innerHTML='<strong>✦ 진화할 식물을 골라요</strong><small>식물을 골라 다음 두 날의 수확을 비교해요</small>';$('mission-progress').textContent='진화 선택';}
 else if(state.version>=5&&[1,3,5].includes(state.day)){$('mission-copy').innerHTML=`<strong>오늘 수확 뒤, 식물이 진화해요</strong><small>${state.version>=6?'한 송이에 집중하거나, 다른 식물을 키워요':'처음 여섯 종류 중 아직 진화하지 않은 한 송이'}</small>`;$('mission-progress').textContent=state.version>=6?'최대 3단계':'두 가지 모습';}
 else if(state.phase==='over'){$('mission-copy').innerHTML='<strong>모모의 꾸미기 수첩</strong><small>꽃잎으로 작은 정원 장식을 모아요</small>';$('mission-progress').textContent='✿ '+profile.petals;}
 else if(m){$('mission-copy').innerHTML=`<strong>${m.complete?'✓ ':''}${m.title}</strong><small>모모의 부탁 · 오늘 안에 · 선택 미션</small>`;$('mission-progress').textContent=paid?'보상 받음':m.complete?'수확하면 ✿ +2':`${m.progress}/${m.required} · ✿ +2`;}
  else{$('mission-copy').innerHTML=`<strong>${state.day===7?'마지막 수확, 응원할게요!':'오늘도 함께 정원을 키워요'}</strong><small>${state.day===7?(profile.clearedStages.includes(state.stageId)?'클리어 보상은 받았어요 · 더 높은 별에 도전!':'첫 클리어하면 꽃잎 3개를 받아요'):'2·4·6일에는 모모가 작은 부탁을 해요'}</small>`;$('mission-progress').textContent='✿ '+profile.petals;}
 const missionLabel=[$('mission-copy').textContent,$('mission-progress').textContent].join(' · ').replace(/\s+/g,' ').trim();
 $('mission-button').setAttribute('aria-label',missionLabel);$('mission-button').title=missionLabel;
}
function missionSheet(){if(state.phase==='evolve'){evolutions();return;}if(state.version>=5&&[1,3,5].includes(state.day)){evolutionGuide();return;}if(state.phase==='over'){collection();return;}const m=missionFor(state),paid=m&&profile.claimedMissions.includes(`${state.stageId}:${m.day}`);openSheet('mission','모모의 작은 부탁',m?`${m.day}일째 · ${paid?'다시 해보는 부탁':'선택 미션'}`:'YOUR GARDEN FRIEND',`<div class="mission-sheet-art"><img src="./assets/bunny-guide-v6.webp" alt="물뿌리개를 든 토끼 모모"><div class="mission-bubble">${m?(paid?'꽃잎은 이미 받았어요. 원하면 다시 해봐도 좋아요!':'괜찮다면, 오늘은 이렇게 심어 볼래요?'):'안녕! 나는 정원사 모모예요. 2·4·6일에 작은 부탁을 들고 올게요.'}</div></div>${m?`<div class="mission-task"><strong>${m.title}</strong><p>${m.description}</p><span>${m.progress} / ${m.required} · ${paid?'꽃잎 보상 받음':'수확하면 꽃잎 +'+m.reward}</span></div>`:'<div class="mission-task"><strong>꽃잎을 모으면 장식이 열려요</strong><p>부탁 첫 해결 +2 · 단계 첫 클리어 +3<br>꽃잎은 사용해도 줄어들지 않아요.</p></div>'}<p class="sheet-note">${paid?'같은 단계의 같은 날 보상은 한 번만 받아요.':'실제 시간 제한은 없어요. 오늘 수확 전에 해내면 돼요.'}<br>놓쳐도 감점 없이 계속 플레이할 수 있어요.</p><div class="sheet-actions">${primaryButton('mission-close','좋아, 정원으로 →')}</div>`);$('mission-close').onclick=closeSheet;}
function harvestRewardHTML(compact=false){
 const receipt=state.lastHarvest;if(!receipt)return '';
 const m=missionFor(state,receipt.day),paid=m&&profile.claimedMissions.includes(`${state.stageId}:${m.day}`);
 if(compact){
  const notes=[`${receipt.day}일 수확 +${receipt.total} 햇살`];
  if(lastMissionReward)notes.push(`부탁 보상 꽃잎 +${lastMissionReward}`);
  else if(m?.complete&&paid)notes.push('부탁 보상 받음');
  if(lastClearReward)notes.push(`첫 클리어 꽃잎 +${lastClearReward}`);
  if(lastDecorUnlocks.length)notes.push('새 장식 '+lastDecorUnlocks.map(d=>d.name).join(' · '));
  return `<p class="harvest-reward-note">${notes.map(escape).join(' · ')}</p>`;
 }
 if(!m&&!lastDecorUnlocks.length)return '';
 return `<div class="reward-line ${m&&!m.complete?'pending':''}">${m?(m.complete?`✿ ${m.title} 해결! ${lastMissionReward?'꽃잎 +'+lastMissionReward:paid?'이미 받은 부탁 보상':''}`:'이번 부탁은 지나갔지만, 정원은 계속 자라요.') : ''}${lastDecorUnlocks.length?(m?'<br>':'')+'새 장식 열림 · '+lastDecorUnlocks.map(d=>escape(d.name)).join(' · '):''}</div>`;
}
function collection(){const s=summaryFor(profile,campaign);openSheet('collection','작은 정원, 나의 취향','모모의 꾸미기 수첩',`<div class="collection-head"><strong>✿ ${s.petals}<small> 꽃잎</small></strong><small>${s.nextDecoration?`${s.nextDecoration.name}까지 ${s.nextDecoration.threshold-s.petals}개`:'네 가지 장식을 모두 모았어요!'}</small></div><div class="collection-grid">${Object.values(DECORATIONS).map(d=>{const unlocked=profile.petals>=d.threshold;return `<button class="decor-card ${unlocked?'':'locked'}" data-decor="${d.id}" aria-pressed="${profile.selectedDecoration===d.id}" ${unlocked?'':'disabled'} aria-label="${d.name}, ${unlocked?'꾸미기 적용':'꽃잎 '+d.threshold+'개 필요'}"><span class="decor-icon" aria-hidden="true">${d.icon}</span><strong>${d.name}</strong><small>${unlocked?(profile.selectedDecoration===d.id?'✓ 지금 정원에 적용 중':'눌러서 정원에 놓기'):'꽃잎 '+d.threshold+'개에 열려요'}</small></button>`;}).join('')}</div><button class="secondary collection-reset" id="decor-reset">${profile.selectedDecoration?'기본 정원으로 바꾸기':'기본 정원 사용 중'}</button><p class="sheet-note">모모의 부탁 +2 · 첫 단계 클리어 +3<br>꽃잎은 줄지 않고, 장식은 점수에 영향을 주지 않아요.</p>`);$('sheet-content').querySelectorAll('[data-decor]').forEach(b=>b.onclick=()=>{profile=selectDecoration(profile,b.dataset.decor);persist();applyDecoration();renderHomeInfo();haptic(10);sfx.play('upgrade');collection();});$('decor-reset').onclick=()=>{profile=selectDecoration(profile,null);persist();applyDecoration();collection();};}
function musicStateLabel(state){return {idle:'첫 터치 후 재생',loading:'음악을 불러오고 있어요',playing:'재생 중 · 반복 재생',paused:'잠시 멈춤',off:'음악 꺼짐',blocked:'버튼을 눌러 음악을 시작해 주세요',error:'음악을 불러오지 못했어요'}[state]||'첫 터치 후 재생';}
function updateMusicStatus(status){
 const label=$('music-status');if(!label)return;
 label.textContent=musicStateLabel(status.state);label.dataset.state=status.state;
 const retry=$('music-retry');if(retry)retry.hidden=!status.enabled||!['blocked','error'].includes(status.state);
}
function settings(){
 updateSoundControls();const status=music.getStatus(),volume=Math.round(profile.options.musicVolume*100);
 openSheet('settings','음악과 함께, 내 속도로','소리와 손끝',`
  <div class="music-settings">
   <div class="setting-row music-row"><div><strong>정원의 배경음악</strong><small>BEATWAVE · James K<br><span id="music-status" data-state="${status.state}" aria-live="polite">${musicStateLabel(status.state)}</span></small></div><button id="toggle-music" class="toggle" role="switch" aria-label="배경음악" aria-checked="${profile.options.music}"></button></div>
   <div class="music-volume-row"><label for="music-volume">음악 크기</label><input id="music-volume" type="range" min="0" max="100" step="5" value="${volume}" aria-label="배경음악 음량" aria-valuetext="${volume}%"><output id="music-volume-value" for="music-volume">${volume}%</output></div>
   <button id="music-retry" class="secondary music-retry" ${status.enabled&&['blocked','error'].includes(status.state)?'':'hidden'}>눌러서 음악 재생 ♫</button>
  </div>
  <div class="setting-row"><div><strong>작은 정원의 효과음</strong><small>식물마다 다른 심기음 · 진화·수확·보상</small></div><button id="toggle-sound" class="toggle" role="switch" aria-label="효과음" aria-checked="${profile.options.sound}"></button></div>
  <div class="setting-row"><div><strong>손끝의 진동</strong><small>${hapticCapable?'지원하는 기기에서 짧고 가볍게 울려요.':'이 브라우저는 진동을 지원하지 않아요.<br>아이폰 Safari는 화면과 소리로 반응해요.'}</small></div><button id="toggle-haptics" class="toggle" role="switch" aria-label="진동" aria-checked="${hapticCapable&&profile.options.haptics}" ${hapticCapable?'':'disabled'}></button></div>
  <div class="sound-samples"><label for="sound-sample">소리 선택</label><select id="sound-sample"><option value="plant">씨앗 심기</option><option value="evolve">식물 진화</option><option value="harvest">수확</option><option value="upgrade">성장 선택</option><option value="mission">미션 보상</option><option value="success">정원 완성</option></select><button class="secondary" id="try-feedback">켜고 듣기 ▶</button></div><p class="sheet-note">다른 앱이나 탭으로 이동하면 음악이 잠시 멈춰요.<br>음악·음량·효과음 설정은 이 브라우저에 저장돼요.</p><div class="sheet-actions"><button id="save-record" class="secondary">${gardenIcon('book')}저장 상태</button>${primaryButton('settings-close','좋아요')}</div>`);
 $('toggle-music').onclick=()=>{profile=setOptions(profile,{music:!profile.options.music});music.setPreferences({enabled:profile.options.music});persist();if(profile.options.music)music.activate();settings();$('toggle-music').focus({preventScroll:true});};
 $('music-volume').oninput=event=>{const value=Number(event.target.value);profile=setOptions(profile,{musicVolume:value/100});music.setPreferences({volume:profile.options.musicVolume});event.target.setAttribute('aria-valuetext',value+'%');$('music-volume-value').textContent=value+'%';persist();};
 $('music-retry').onclick=()=>music.activate();
 $('toggle-sound').onclick=()=>{profile=setOptions(profile,{sound:!profile.options.sound});sound=profile.options.sound;persist();if(sound)sfx.play('plant');else sfx.stop();settings();$('toggle-sound').focus({preventScroll:true});};
 $('toggle-haptics').onclick=()=>{profile=setOptions(profile,{haptics:!profile.options.haptics});persist();haptic([9,45,14]);settings();$('toggle-haptics').focus({preventScroll:true});};
 $('try-feedback').onclick=()=>{const kind=$('sound-sample').value;profile=setOptions(profile,{sound:true});sound=true;persist();sfx.play(kind,{type:'sunflower'});haptic([8,45,12]);updateSoundControls();$('toggle-sound').setAttribute('aria-checked','true');$('try-feedback').textContent='다시 듣기 ▶';};$('settings-close').onclick=closeSheet;$('save-record').onclick=saveStatusSheet;
}
function toast(message){if(reduced.matches){say(message);return;}const el=document.createElement('span');el.className='reward-toast';el.textContent=message;$('effects-layer').append(el);el.addEventListener('animationend',()=>el.remove(),{once:true});}
function plantFeedback(index){const tile=$('sheet').open?$('zoom-'+index):null;feedback.play(tile||$('plot-'+index)||$('board').querySelector(`[data-cell="${index}"]`),'plant',state.board[index]?.type);}
function celebrate(){feedback.celebrate($('sheet'),'success');}


function evolutions(preferred=null,focused=null){
 if(state.phase!=='evolve')return;
 const candidates=evolvableTiles(state),index=candidates.includes(preferred)?preferred:candidates[0];if(index===undefined)return;
 const at=candidates.indexOf(index),tile=state.board[index],choices=evolutionChoices(state,index),choice=choices.find(c=>c.id===focused),a=choice?evolutionAdvice(state,index,choice.id):null;
 const tier=evolutionTier(tile),master=choices.some(c=>c.tier===3),other=candidates.find(i=>i!==index&&!state.board[i].evolution)??candidates.find(i=>i!==index);
 const route=state.version>=6?`${tier} → ${tier+1}단계 · ${master?'한 송이에 집중 육성':'새로운 능력 선택'}`:'1 → 2단계 · 새로운 능력 선택';
 openSheet('evolution',master?'이 식물을 만개시킬까요?':'어떤 모습으로 키울까요?',`${state.day}일째 수확 · 진화 기회 1회`, `${harvestRewardHTML(true)}<div class="evolution-picker"><button class="secondary" id="evo-prev" aria-label="이전 진화 후보" ${candidates.length<2?'disabled':''}>‹</button><div>${art(tile,true)}<span><strong>${escape(evolutionName(tile)||seeds()[tile.type].name)}</strong><small>${Math.floor(index/state.cols)+1}행 ${index%state.cols+1}열 · 후보 ${at+1}/${candidates.length}</small></span></div><button class="secondary" id="evo-next" aria-label="다음 진화 후보" ${candidates.length<2?'disabled':''}>›</button></div><p class="evolution-route">${route}</p><div class="strategy-evolutions ${master?'has-master':''}">${choices.map(c=>{const v=previewEvolution(state,index,c.id);return `<button class="strategy-evolution ${c.tier===3?'master-choice':''}" data-evolution="${c.id}" aria-pressed="${choice?.id===c.id}">${evolutionArt(tile.type,c.id,2,{tier:c.tier})}<strong>${escape(c.name)}</strong><small>${v.nextDay}일 ${signed(v.nextDelta)} · ${v.followingDay}일 ${signed(v.followingDelta)}</small></button>`;}).join('')}${master&&other!==undefined?`<button class="strategy-evolution switch-candidate" id="other-evolution">${art(state.board[other],true)}<strong>다른 식물도 비교</strong><small>${escape(evolutionName(state.board[other])||seeds()[state.board[other].type].name)} 살펴보기 →</small></button>`:''}</div><div class="choice-explanation" aria-live="polite">${a?`<div class="strategy-role">${escape(a.role)}</div>${adviceText(a)}`:`<p class="choice-prompt">${master?'3단계로 집중 육성하거나<br>다른 식물의 진화와 비교해 보세요.':'두 모습을 눌러 효과를 비교해 보세요.<br>확정하기 전에는 정원이 바뀌지 않아요.'}</p>`}</div><p class="advice-assumption">현재 단계 대비 · 같은 배치, 이후 심기·새 보너스 제외</p><div class="choice-actions"><button id="confirm-evolution" class="primary choice-confirm" ${choice?'':'disabled'}>${choice?`${choice.tier===3?'3단계 ':' '}${escape(choice.name)}으로 진화`:'먼저 모습을 골라 주세요'}</button><button id="choice-rule" class="secondary" ${choice?'':'disabled'}>규칙</button></div>`);
 $('evo-prev').onclick=()=>{sfx.play('select');evolutions(candidates[(at+candidates.length-1)%candidates.length]);};
 $('evo-next').onclick=()=>{sfx.play('select');evolutions(candidates[(at+1)%candidates.length]);};
 $('sheet-content').querySelectorAll('button[data-evolution]').forEach(button=>button.onclick=()=>{sfx.play('inspect',{type:tile.type});evolutions(index,button.dataset.evolution);});
 if($('other-evolution'))$('other-evolution').onclick=()=>{sfx.play('select');evolutions(other);};
 $('choice-rule').onclick=()=>choiceRule('evolution',choice?.id,index);
 $('confirm-evolution').onclick=()=>{if(!choice)return;const next=chooseEvolution(state,index,choice.id);if(next===state)return;state=next;selected=null;persist();closeSheet();render();const cell=$('plot-'+index)||$('board').querySelector(`[data-cell="${index}"]`);feedback.play(cell,'evolve',tile.type,{tier:choice.tier||2});sfx.play('evolve',{type:tile.type});haptic(choice.tier===3?[18,45,30,45,18]:[12,45,22]);toast(`${choice.name}, ${choice.tier===3?'3단계 만개!':'새 모습으로 자랐어요!'}`);say(`${choice.name} ${choice.tier||2}단계 진화 완료. ${choice.description} ${state.day}일째 시작.`);};
}

function evolutionGuide(){
 openSheet('evolution-guide','한 송이를 끝까지 키워 볼까요?','1단계 씨앗 → 2단계 진화 → 3단계 만개',`<div class="evolution-example"><div>${evolutionArt('sunflower','twin',2)}<strong>2단계 · 쌍둥이</strong><small>나를 한 번 더 수확</small></div><span>→</span><div>${evolutionArt('sunflower','twin',2,{tier:3})}<strong>3단계 · 세쌍둥이</strong><small>나를 두 번 더 수확</small></div></div><div class="guide-steps"><div class="guide-step"><span>1</span><div><strong>날씨를 보고 씨앗을 골라요</strong><p>햇살·비·구름에 강한 식물을 골라 모모의 날씨 부탁도 해결해요.</p></div></div><div class="guide-step"><span>2</span><div><strong>1·3·5일, 진화 기회는 한 번씩</strong><p>처음 여섯 종류에 두 갈래씩. 다른 식물을 2단계로 키우거나, 이미 진화한 식물을 3단계로 키워요.</p></div></div><div class="guide-step"><span>3</span><div><strong>집중 육성할까요, 넓게 키울까요?</strong><p>다음 두 날의 수확 차이를 비교해요. 2·4·6일 정원의 힘과도 조합해 보세요.</p></div></div></div><p class="sheet-note">정원마다 진화 선택은 새로 시작해요. 해금·기록·꽃잎은 남아요.${state.version<6?'<br>진행 중인 정원은 이전 규칙으로 보존돼요.<br>시작 화면의 ‘옮겨심기 있는 새 정원 시작’에서 새 규칙을 선택할 수 있어요.':''}</p><div class="sheet-actions">${primaryButton('evolution-guide-close','좋아, 키워 보자 →')}</div>`);$('evolution-guide-close').onclick=()=>{closeSheet();if(homeVisible&&state.version>=6)resumeGarden();};
}

function choiceRule(kind,id,index){if(!id)return;const data=kind==='upgrade'?abilities()[id]:evolutionChoices(state,index).find(c=>c.id===id);if(!data)return;sfx.play('inspect');openSheet('rule',data.name,'정확한 발동 조건',`<div class="rule-body">${escape(data.description)}</div><p class="sheet-note">이번 정원에서 유지되는 능력이에요.<br>비교 화면으로 돌아가 선택을 확정하세요.</p><div class="sheet-actions">${primaryButton('back-to-choice','선택 비교로 돌아가기')}</div>`);$('back-to-choice').onclick=()=>kind==='upgrade'?upgrades(id):evolutions(index,id);}
