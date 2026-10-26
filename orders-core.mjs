// Order garden: separate save namespace; never migrates or overwrites classic saves.
export const KEY='sunlit-orders-v1';
export const SIZE=5, DAYS=10;
export const PLANTS={
 sunflower:{name:'해바라기',days:1,tip:'하루 뒤 개화 · 꽃다발과 벌집 주문에 써요'},
 lavender:{name:'라벤더',days:2,tip:'이틀 뒤 개화 · 다른 꽃과 붙여 심어요'},
 mushroom:{name:'버섯',days:1,tip:'하루 뒤 성장 · 빈 이웃 땅을 두 칸 남겨요'},
 hive:{name:'벌집',days:0,tip:'바로 완성 · 꽃을 납품해도 벌집은 남아요'},
};
export const ORDERS={
 sunny:{name:'햇살 한 다발',customer:'꽃집 소미',types:['sunflower','sunflower'],rule:'다 자란 해바라기 두 송이를 붙여 주세요.',short:'해바라기 2 · 서로 이웃',reward:1},
 bouquet:{name:'보랏빛 꽃다발',customer:'카페 라라',types:['sunflower','lavender'],rule:'다 자란 해바라기와 라벤더가 서로 이웃하면 완성.',short:'해바라기 + 라벤더 · 서로 이웃',reward:1},
 forest:{name:'숲속 저녁 식탁',customer:'요리사 밤이',types:['mushroom','mushroom'],rule:'다 자란 버섯 두 개. 각각 상하좌우에 빈 땅이 두 칸 이상 필요해요.',short:'버섯 2 · 각각 빈 이웃 2칸',reward:1},
 honey:{name:'꽃향기 꿀 선물',customer:'양봉가 모모',types:['hive','sunflower','lavender'],rule:'벌집의 상하좌우에 다 자란 해바라기와 라벤더. 꽃만 수확하고 벌집은 남아요.',short:'벌집 옆 해바라기 + 라벤더',reward:2},
 perfume:{name:'라벤더 향 주머니',customer:'공방 보리',types:['lavender','lavender'],rule:'다 자란 라벤더 두 송이를 붙여 주세요.',short:'라벤더 2 · 서로 이웃',reward:1},
};
const sequence=['sunny','bouquet','forest','honey','perfume','bouquet','forest','sunny','honey','perfume'];
export const neighbors=i=>[i%SIZE?i-1:-1,i%SIZE<SIZE-1?i+1:-1,i>=SIZE?i-SIZE:-1,i<SIZE*(SIZE-1)?i+SIZE:-1].filter(n=>n>=0);
export const mature=t=>!!t&&t.age>=PLANTS[t.type].days;
const clone=x=>structuredClone(x);
export function fresh(level=1){return{version:1,level,day:1,actions:3,board:Array(25).fill(null),orders:sequence.slice(0,3),cursor:3,stamps:0,delivered:0,goal:Math.min(8,4+level),phase:'play',fertilizer:0,swapDay:0,history:[],receipt:null};}
export function matches(s,id){
 if(!ORDERS[id])return[];const b=s.board,out=[];
 const pair=(a,z,adj=true)=>{for(let i=0;i<25;i++)if(b[i]?.type===a&&mature(b[i]))for(let j=0;j<25;j++)if(j!==i&&b[j]?.type===z&&mature(b[j])&&(a!==z||j>i)&&(!adj||neighbors(i).includes(j)))out.push({take:[i,j],keep:[]});};
 if(id==='sunny')pair('sunflower','sunflower');
 if(id==='bouquet')pair('sunflower','lavender');
 if(id==='perfume')pair('lavender','lavender');
 if(id==='forest'){pair('mushroom','mushroom',false);return out.filter(m=>m.take.every(i=>neighbors(i).filter(n=>!b[n]).length>=2));}
 if(id==='honey')for(let h=0;h<25;h++)if(b[h]?.type==='hive')for(const a of neighbors(h))if(b[a]?.type==='sunflower'&&mature(b[a]))for(const z of neighbors(h))if(b[z]?.type==='lavender'&&mature(b[z]))out.push({take:[a,z],keep:[h]});
 return out;
}
function snapshot(s){const c=clone(s);c.history=[];c.receipt=null;return c;}
function edit(s){const c=clone(s);c.history=[...s.history,snapshot(s)].slice(-12);return c;}
const cell=i=>Number.isInteger(i)&&i>=0&&i<25;
function nextOrder(s,exclude){for(let n=0;n<sequence.length;n++){const id=sequence[s.cursor++%sequence.length];if(!exclude.includes(id))return id;}return'sunny';}
export function act(s,action){
 if(!valid(s)||!action)return s;
 if(action.kind==='reward'){
  if(s.phase!=='reward'||!['action','fertilizer'].includes(action.choice))return s;
  const c=clone(s);if(action.choice==='action')c.actions++;else c.fertilizer++;c.phase='play';c.receipt=null;return c;
 }
 if(s.phase!=='play')return s;
 if(action.kind==='undo'){
  if(!s.history.length)return s;const c=clone(s.history.at(-1));c.history=s.history.slice(0,-1);return c;
 }
 if(action.kind==='deliver'){
  if(!Number.isInteger(action.slot)||action.slot<0||action.slot>2)return s;
  const id=s.orders[action.slot],m=matches(s,id)[action.match??0];if(!m)return s;
  const c=clone(s);m.take.forEach(i=>c.board[i]=null);c.stamps+=ORDERS[id].reward;c.delivered++;c.orders[action.slot]=nextOrder(c,c.orders);c.history=[];
  c.receipt={name:ORDERS[id].name,reward:ORDERS[id].reward,take:m.take,keep:m.keep};c.phase=c.stamps>=c.goal?'won':'reward';return c;
 }
 if(action.kind==='swap'){
  if(s.swapDay===s.day||!Number.isInteger(action.slot)||action.slot<0||action.slot>2)return s;
  const c=edit(s);c.orders[action.slot]=nextOrder(c,c.orders);c.swapDay=c.day;return c;
 }
 if(action.kind==='night'){
  const c=clone(s);c.history=[];
  if(s.day===DAYS){c.phase='lost';return c;}
  c.day++;c.actions=3;c.board=c.board.map(t=>t?{...t,age:Math.min(PLANTS[t.type].days,t.age+1)}:null);return c;
 }
 if(!cell(action.at))return s;
 if(action.kind==='fertilize'){
  if(!s.fertilizer||!s.board[action.at]||mature(s.board[action.at]))return s;
  const c=edit(s);c.fertilizer--;c.board[action.at].age++;return c;
 }
 if(s.actions<1)return s;
 if(action.kind==='plant'){
  if(!Object.hasOwn(PLANTS,action.type)||s.board[action.at])return s;
  const c=edit(s);c.board[action.at]={type:action.type,age:0};c.actions--;return c;
 }
 if(action.kind==='water'){
  if(!s.board[action.at]||mature(s.board[action.at]))return s;
  const c=edit(s);c.board[action.at].age++;c.actions--;return c;
 }
 if(action.kind==='remove'){
  if(!s.board[action.at])return s;const c=edit(s);c.board[action.at]=null;c.actions--;return c;
 }
 if(action.kind==='move'){
  if(!s.board[action.at]||!cell(action.to)||s.board[action.to])return s;
  const c=edit(s);c.board[action.to]=c.board[action.at];c.board[action.at]=null;c.actions--;return c;
 }
 return s;
}
export function valid(s,history=true){
 const int=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
 const receipt=r=>r&&Object.values(ORDERS).some(o=>o.name===r.name&&o.reward===r.reward)&&Array.isArray(r.take)&&r.take.length===2&&r.take.every(cell)&&new Set(r.take).size===2&&Array.isArray(r.keep)&&r.keep.length<=1&&r.keep.every(i=>cell(i)&&!r.take.includes(i));
 return !!s&&s.version===1&&int(s.level,1,10000)&&int(s.day,1,DAYS)&&int(s.actions,0,20)&&int(s.fertilizer,0,20)&&int(s.stamps,0,20)&&int(s.delivered,0,20)&&s.goal===Math.min(8,4+s.level)&&int(s.cursor,3,500)&&int(s.swapDay,0,s.day)
 &&Array.isArray(s.board)&&s.board.length===25&&s.board.every(t=>t===null||(t&&Object.hasOwn(PLANTS,t.type)&&int(t.age,0,PLANTS[t.type].days)))
 &&Array.isArray(s.orders)&&s.orders.length===3&&new Set(s.orders).size===3&&s.orders.every(id=>Object.hasOwn(ORDERS,id))&&['play','reward','won','lost'].includes(s.phase)
 &&(s.receipt===null||receipt(s.receipt))&&(!['reward','won'].includes(s.phase)||receipt(s.receipt))
 &&(s.phase!=='won'||s.stamps>=s.goal)&&(s.phase!=='lost'||s.day===DAYS)&&Array.isArray(s.history)&&s.history.length<=12&&(!history||s.history.every(x=>valid(x,false)&&x.phase==='play'&&x.history.length===0));
}
export function restore(text){try{const s=JSON.parse(text);return valid(s)?s:null;}catch{return null;}}
