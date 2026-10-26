import{KEY,SIZE,DAYS,PLANTS,ORDERS,fresh,matches,mature,act,restore}from'./orders-core.mjs?v=20261026-30';
import{plantArt,installSpriteFallbacks}from'./garden-sprites.mjs?v=20261024-28';
import{createGardenAudio}from'./garden-audio.mjs?v=20261024-28';
import{createGardenMusic}from'./garden-music.mjs?v=20261024-28';
const $=id=>document.getElementById(id),art=(type,age=2)=>plantArt(type,age);
let stored=null;try{stored=localStorage.getItem(KEY);}catch{}
let s=restore(stored)||fresh(),seed='sunflower',slot=0,match=0,moving=null,home=true,ctx=null,timer,pop=-1;
let prefs={music:true,sound:true};try{const p=JSON.parse(localStorage.getItem(KEY+'-prefs'));if(typeof p?.music==='boolean')prefs.music=p.music;if(typeof p?.sound==='boolean')prefs.sound=p.sound;}catch{}
const context=()=>{if(!ctx)ctx=new(window.AudioContext||window.webkitAudioContext)();return ctx;};
const audio=createGardenAudio({getContext:context,isEnabled:()=>prefs.sound,isHidden:()=>document.hidden||home});
const music=createGardenMusic({getContext:context,enabled:prefs.music,volume:.22});
function activate(){try{const c=context();void c.resume().catch(()=>{});audio.prepare();if(!home)void music.activate();}catch{}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(s));$('save-warning').textContent='';}catch{$('save-warning').textContent='저장 공간을 사용할 수 없어요. 이 창을 닫으면 진행이 사라질 수 있어요.';}}
function sound(kind){activate();audio.play(kind,{type:seed});}
function notice(t){$('toast').textContent=t;clearTimeout(timer);timer=setTimeout(()=>$('toast').textContent='',2200);}
function modal(html){document.querySelector('main').inert=true;$('sheet').innerHTML=html;$('veil').hidden=false;$('sheet').querySelector('button')?.focus();}
function close(){ document.querySelector('main').inert=false;$('veil').hidden=true;$('sheet').innerHTML='';$('home').focus();}
function button(text,action,extra=''){return`<button data-action="${action}" ${extra}>${text}</button>`;}
function showHome(){home=true;audio.stop();void music.setHidden(true);modal(`<div class="eyebrow">SUNLIT GARDEN · 주문 정원</div><div class="hero-plants">${art('sunflower')}${art('lavender')}${art('hive')}</div><h1>오늘은 어떤<br>정원을 보낼까요?</h1><p>꽃집에는 꽃다발을, 이웃에게는 꿀을.<br>주문을 골라 키우고, 수확한 자리에 다시 심어요.<br><b>10일 안에 도장 ${s.goal}개를 모으면 완성!</b></p>${button(s.delivered||s.day>1?'내 주문 정원 이어하기':'첫 주문 받기','start','class="primary"')}${button('어떻게 하나요?','help')}${button('음악 · 효과음','settings')}<a href="./classic.html?v=20261026-29">이전 점수 정원 · 기존 기록 이어하기</a>${button('이번 주문 정원 다시 시작','restart')}<p style="font-size:11px">진행은 이 브라우저에 저장돼요. 기존 점수 정원 기록은 그대로 남아 있어요.</p>`);}
function help(){modal(`<h2>주문 하나부터 시작해요</h2><p><b>① 주문 선택</b><br>위쪽 주문서에서 필요한 식물과 배치를 확인해요.</p><p><b>② 심고 키우기</b><br>아래 씨앗 → 빈 땅을 누르세요. 하루 행동은 3번. 다음 날에는 모든 식물이 한 단계 자라요.</p><p><b>③ 납품하고 다시 심기</b><br>조건을 맞추면 금빛 테두리가 생겨요. 납품할 식물을 확인한 뒤 보내면 그 자리가 비어요.</p><p>10일 안에 도장 ${s.goal}개. 꿀 주문은 도장 2개! 납품은 행동을 쓰지 않아요. ‘옆’은 상하좌우이며 대각선은 제외해요.</p>${button('알겠어요 · 정원으로','resume','class="primary"')}`);}
function commit(action,kind='select'){
 const next=act(s,action);if(next===s){notice('지금은 할 수 없어요. 조건과 남은 행동을 확인해 주세요.');return false;}
 s=next;save();match=0;moving=null;render();sound(kind);if(s.phase==='reward'||s.phase==='won'||s.phase==='lost')phaseModal();return true;
}
function phaseModal(){
 if(s.phase==='reward')modal(`<div class="reward-art">✉️</div><div class="eyebrow">DELIVERED</div><h2>${s.receipt?.name||'주문'} 도착!</h2><p>도장 +${s.receipt?.reward||1} · ${s.stamps}/${s.goal}<br>수확한 땅은 다시 쓸 수 있어요. 다음 준비는?</p>${button('오늘 한 번 더 가꾸기<small>지금 행동 +1 · 오늘 안에 사용</small>','reward-action','class="primary"')}${button('영양제 받아 두기<small>원할 때 식물 한 단계 성장 · 행동 소모 없음</small>','reward-fertilizer')}`);
 if(s.phase==='won')modal(`<div class="reward-art">💐</div><div class="eyebrow">ALL DELIVERED</div><h2>이웃에게 정원이 도착했어요</h2><p>${s.delivered}건 납품 · 도장 ${s.stamps}개<br>${s.day}일 만에 ${s.level}번째 정원 완성!</p>${button('다음 정원 열기','next','class="primary"')}${button('시작 화면','home')}`);
 if(s.phase==='lost')modal(`<h2>오늘의 장이 끝났어요</h2><p>도장 ${s.stamps}/${s.goal} · 주문 ${s.delivered}건을 보냈어요.<br>다음에는 빨리 납품할 꽃다발과 계속 쓸 벌집을 나눠 심어 보세요.</p>${button('같은 정원 다시 도전','retry','class="primary"')}${button('시작 화면','home')}`);
}
function render(){
 const all=matches(s,s.orders[slot]);match=Math.min(match,Math.max(0,all.length-1));const chosen=all[match],order=ORDERS[s.orders[slot]];
 $('status').textContent=`${s.day}/${DAYS}일 · 행동 ${s.actions}번`;$('goal').textContent=`✿ ${s.stamps}/${s.goal}`;
 $('orders').innerHTML=s.orders.map((id,i)=>`<button class="order ${i===slot?'active':''} ${matches(s,id).length?'ready':''}" data-slot="${i}" aria-pressed="${i===slot}"><strong>${ORDERS[id].name}</strong><div class="mini-plants">${ORDERS[id].types.map(t=>art(t)).join('')}</div><small>도장 ${ORDERS[id].reward}개</small></button>`).join('');
 $('brief').innerHTML=`<p><b>${order.customer}</b> · ${order.rule}</p>${button('교체','swap',`aria-label="선택한 주문 교체, 하루 한 번" ${s.swapDay===s.day?'disabled':''}`)}`;
 $('board').innerHTML=s.board.map((t,i)=>`<button class="tile ${!t?'empty':''} ${chosen?.take.includes(i)?'take':''} ${chosen?.keep.includes(i)?'keep':''} ${moving===i?'selected':''} ${pop===i?'pop':''}" data-cell="${i}" aria-label="${Math.floor(i/SIZE)+1}행 ${i%SIZE+1}열 ${t?PLANTS[t.type].name+(mature(t)?' 다 자람':` ${PLANTS[t.type].days-t.age}일 뒤 완성`):'빈 땅'}">${t?art(t.type,mature(t)?2:0)+`<small>${PLANTS[t.type].name}${mature(t)?' ✓':` ${PLANTS[t.type].days-t.age}일`}</small>`:''}</button>`).join('');pop=-1;
 $('seeds').innerHTML=Object.entries(PLANTS).map(([id,p])=>`<button class="seed ${seed===id?'active':''}" data-seed="${id}" aria-pressed="${seed===id}">${art(id)}<span>${p.name}</span></button>`).join('');
 $('hint').textContent=moving!==null?'옮길 빈 땅을 누르세요 · 행동 1번. 같은 식물을 다시 누르면 취소.':chosen?`금빛 ${chosen.take.length}칸을 수확해요${chosen.keep.length?' · 점선 벌집은 남아요':''}. 아래 납품 버튼으로 보내세요.`:`${PLANTS[seed].name}: ${PLANTS[seed].tip} · 심기 1행동`;
 $('actions').innerHTML=button('↶','undo',`aria-label="마지막 행동 되돌리기" ${!s.history.length?'disabled':''}`)+(chosen?button(`납품 · 도장 +${order.reward}`,'deliver','class="deliver"')+(all.length>1?button('↔','cycle',`class="cycle" aria-label="다른 납품 식물 조합 보기"`):''):'')+button(s.day===DAYS?'영업 마치기':'다음 날 ☾','night','class="primary"');
}
function manage(i){const t=s.board[i];modal(`<h2>${PLANTS[t.type].name}</h2><p>${mature(t)?'다 자랐어요. 주문 조건을 맞추면 납품할 수 있어요.':`${PLANTS[t.type].days-t.age}일 더 자라야 해요. 기다리거나 지금 물을 줄 수 있어요.`}</p>${button('물 주기 · 한 단계 성장 (행동 1)','water',`data-at="${i}" ${mature(t)||!s.actions?'disabled':''}`)}${button(`영양제 쓰기 · 성장 +1 (${s.fertilizer}개)`,'fertilize',`data-at="${i}" ${mature(t)||!s.fertilizer?'disabled':''}`)}${button('다른 빈 땅으로 옮기기 (행동 1)','move',`data-at="${i}" ${!s.actions?'disabled':''}`)}${button('뽑아서 빈 땅 만들기 (행동 1)','remove',`data-at="${i}" ${!s.actions?'disabled':''}`)}${button('돌아가기','close')}`);}
function tile(i){if(moving!==null){if(i===moving){moving=null;render();return;}if(s.board[i]){notice('옮길 빈 땅을 골라 주세요.');return;}commit({kind:'move',at:moving,to:i},'plant');return;}if(s.board[i]){manage(i);return;}if(!s.actions){notice('오늘 행동을 다 썼어요. 납품하거나 다음 날로 넘겨 주세요.');return;}pop=i;commit({kind:'plant',at:i,type:seed},'plant');}
function start(){home=false;close();activate();void music.setHidden(false);render();if(s.phase!=='play')phaseModal();}
function settings(){modal(`<h2>정원의 소리</h2>${button(`배경음악 ${prefs.music?'켜짐':'꺼짐'}`,'music')}${button(`효과음 ${prefs.sound?'켜짐':'꺼짐'}`,'sound')}${button('돌아가기',home?'home':'close')}`);}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;activate();
 if(b.dataset.slot!==undefined){slot=Number(b.dataset.slot);match=0;moving=null;render();sound('select');return;}
 if(b.dataset.seed){seed=b.dataset.seed;moving=null;render();sound('select');return;}
 if(b.dataset.cell!==undefined){tile(Number(b.dataset.cell));return;}
 const a=b.dataset.action,i=Number(b.dataset.at);
 if(a==='start'||a==='resume'){start();return;}if(a==='home'){showHome();return;}if(a==='help'){help();return;}if(a==='settings'){settings();return;}if(a==='close'){close();return;}
 if(a==='music'||a==='sound'){prefs[a]=!prefs[a];try{localStorage.setItem(KEY+'-prefs',JSON.stringify(prefs));}catch{}music.setPreferences({enabled:prefs.music});if(!prefs.sound)audio.stop();settings();return;}
 if(a==='cycle'){match=(match+1)%matches(s,s.orders[slot]).length;render();return;}
 if(a==='deliver'){const m=matches(s,s.orders[slot])[match];if(!m)return;modal(`<h2>${ORDERS[s.orders[slot]].name}</h2><p>金빛으로 표시한 ${m.take.length}개의 식물을 수확해서 보냅니다.${m.keep.length?' 벌집은 남겨서 다음 주문에도 써요.':''}<br>도장 +${ORDERS[s.orders[slot]].reward} · 행동 소모 없음</p>${button('확인 · 이 식물들 납품','confirm-deliver','class="primary"')}${button('더 키울래요','close')}`.replace('金빛','금빛'));return;}
 if(a==='confirm-deliver'){close();commit({kind:'deliver',slot,match},'mission');return;}
 if(a==='reward-action'||a==='reward-fertilizer'){close();commit({kind:'reward',choice:a.slice(7)},'upgrade');return;}
 if(a==='night'){modal(`<h2>${s.day===DAYS?'영업을 마칠까요?':'하루를 보낼까요?'}</h2><p>${s.day===DAYS?'마지막 날입니다. 목표 미달이면 이번 정원이 끝나요.':'모든 식물이 한 단계 자라고 행동 3번을 새로 받아요.'}${s.actions?`<br>남은 행동 ${s.actions}번은 사라져요.`:''}${s.orders.some(id=>matches(s,id).length)?'<br><b>지금 납품할 수 있는 주문이 있어요.</b>':''}</p>${button(s.day===DAYS?'영업 종료':'다음 날로','confirm-night','class="primary"')}${button('정원으로 돌아가기','close')}`);return;}
 if(a==='confirm-night'){close();commit({kind:'night'},'bloom');return;}
 if(a==='swap'){modal(`<h2>다른 주문을 받을까요?</h2><p>선택한 주문이 바뀌어요. 하루 한 번 무료이며 식물은 그대로 남아요.</p>${button('이 주문 교체','confirm-swap','class="primary"')}${button('취소','close')}`);return;}
 if(a==='confirm-swap'){close();commit({kind:'swap',slot},'reroll');return;}
 if(a==='undo'){commit({kind:'undo'},'undo');return;}
 if(a==='move'){moving=i;close();render();return;}
 if(a==='remove'){modal(`<h2>이 식물을 뽑을까요?</h2><p>${PLANTS[s.board[i].type].name}와 성장 상태가 사라지고 빈 땅이 됩니다. 행동 1번을 써요.</p>${button('뽑기','confirm-remove',`data-at="${i}"`)}${button('취소','close')}`);return;}
 if(a==='confirm-remove'||a==='water'||a==='fertilize'){close();commit({kind:a==='confirm-remove'?'remove':a,at:i},a==='confirm-remove'?'undo':'bloom');return;}
 if(a==='restart'){modal(`<h2>이번 주문 정원을 다시 시작할까요?</h2><p>이번 주문 진행만 초기화해요. 이전 점수 정원 기록은 건드리지 않아요.</p>${button('다시 시작','retry','class="primary"')}${button('취소','home')}`);return;}
 if(a==='retry'||a==='next'){s=fresh(a==='next'?s.level+1:s.level);slot=0;match=0;save();start();return;}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.stop();void music.setHidden(document.hidden||home);if(document.hidden)save();});
window.addEventListener('pagehide',save);
installSpriteFallbacks(document);render();showHome();

document.addEventListener('keydown',e=>{if(e.key==='Tab'&&!$('veil').hidden){const buttons=[...$('sheet').querySelectorAll('button:not(:disabled),a')];const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
