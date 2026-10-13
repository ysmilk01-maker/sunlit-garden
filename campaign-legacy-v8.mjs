import { SEEDS as ORIGINAL_SEEDS, UPGRADES as ORIGINAL_UPGRADES, WEATHER as ORIGINAL_WEATHER } from './growth-core.mjs';
import * as legacy from './campaign-legacy-v7.mjs';

export const LEGACY_SEEDS = legacy.SEEDS;
export const LEGACY_UPGRADES = legacy.UPGRADES;
export const LEGACY_WEATHER = legacy.WEATHER;

export const RUN_DAYS = 7;
export const STORAGE_KEY = 'sunlit-garden:campaign:run:v1';
export const CAMPAIGN_STORAGE_KEY = 'sunlit-garden:campaign:progress:v1';
export const SEEDS = {
  ...ORIGINAL_SEEDS,
  clover: { ...ORIGINAL_SEEDS.clover, short: '클로버 둘까지 · 타종 +2', description: '기본 2점. 성장 +1씩, 최대 +2. 이웃 클로버는 최대 둘까지만 각각 +2점. 다른 식물이 옆에 있으면 +2점(우물·벌집 제외).' },
  hive: { ...ORIGINAL_SEEDS.hive, description: '상하좌우 꽃마다 +4점. 꽃은 해바라기·클로버·라벤더·튤립·장미·연꽃·데이지·초롱꽃·수국·난초·벚꽃이에요.' },
  mint: { id: 'mint', name: '민트', icon: '🌿', short: '옆 베리마다 +3', description: '기본 2점. 수확할 때마다 다음 수확 +1, 최대 +2. 상하좌우 베리마다 +3점.' },
  tulip: { id: 'tulip', name: '튤립', icon: '🌷', short: '다른 꽃 종류마다 +2', description: '기본 3점. 수확할 때마다 다음 수확 +1, 최대 +2. 상하좌우의 다른 꽃 종류마다 +2점.' },
  fern: { id: 'fern', name: '고사리', icon: '🌱', short: '우물·버섯 옆 +4', description: '기본 3점. 우물 또는 버섯 옆이면 +4점(중복 없음). 흐린 날 +3점.' },
  pumpkin: { id: 'pumpkin', name: '호박', icon: '🎃', short: '세 번째 수확부터 +9', description: '기본 2점. 심은 뒤 세 번째 수확부터 +9점. 비 오는 날 +2점.' },
  rose: { id: 'rose', name: '장미', icon: '🌹', short: '옆 벌집마다 +4', description: '기본 4점. 수확할 때마다 다음 수확 +1, 최대 +2. 상하좌우 벌집마다 +4점.' },
  lotus: { id: 'lotus', name: '연꽃', icon: '🪷', short: '우물과 같은 줄 +5', description: '기본 2점. 우물과 같은 행 또는 열이면 +5점(중복 없음). 비 오는 날 +4점.' },
  daisy: { id: 'daisy', name: '데이지', icon: '🌼', short: '정원 가장자리 +3', description: '기본 2점. 성장 +1씩, 최대 +2. 가장자리 칸이면 +3점. 모서리도 한 번만 받아요.' },
  bluebell: { id: 'bluebell', name: '초롱꽃', icon: '🔔', short: '버섯·고사리 옆 +4', description: '기본 2점. 성장 +1씩, 최대 +2. 버섯 또는 고사리 옆이면 +4점(중복 없음). 흐린 날 +2점.' },
  strawberry: { id: 'strawberry', name: '딸기', icon: '🍓', short: '익으면 +5 · 민트 옆 +4', description: '기본 1점. 세 번째 수확부터 +5점. 민트 옆이면 +4점(중복 없음). 비 오는 날 +2점.' },
  bamboo: { id: 'bamboo', name: '대나무', icon: '🎋', short: '세로 대나무 딱 하나 +4', description: '기본 2점. 위·아래에 대나무가 딱 하나 있으면 +4점. 상하좌우 다른 식물이 있으면 +2점(우물·벌집 제외).' },
  cactus: { id: 'cactus', name: '선인장', icon: '🌵', short: '빈칸 옆 +4 · 맑음 +2', description: '기본 3점. 상하좌우에 빈칸이 하나라도 있으면 +4점. 맑은 날 +2점. 정원 밖은 빈칸으로 세지 않아요.' },
  hydrangea: { id: 'hydrangea', name: '수국', icon: '💐', short: '비 +4 · 우물 옆 +3', description: '기본 2점. 성장 +1씩, 최대 +2. 비 오는 날 +4점. 우물 옆이면 기본 우물 효과에 추가로 +3점.' },
  orchid: { id: 'orchid', name: '난초', icon: '🌸', short: '다른 꽃 2종 이웃 +5', description: '기본 3점. 성장 +1씩, 최대 +2. 난초 이외 서로 다른 꽃 두 종류 이상이 상하좌우에 있으면 +5점.' },
  cherry: { id: 'cherry', name: '벚꽃', icon: '🌸', short: '네 번째 수확부터 +4', description: '기본 3점. 성장 +1씩, 최대 +2. 네 번째 수확부터 +4점. 벚꽃 이외 꽃이 옆에 있으면 +2점(중복 없음).' },
};
export const UPGRADES = {
  ...ORIGINAL_UPGRADES,
  colony: { ...ORIGINAL_UPGRADES.colony, short: '클로버 둘까지 +1씩', description: '클로버 이웃 보너스가 각각 +2에서 +3점으로 증가해요. 최대 두 이웃까지만 적용돼요.' },
  wild: { ...ORIGINAL_UPGRADES.wild, short: '6종 이상이면 식물 +2', description: '우물을 제외한 여섯 종류 이상을 심으면 벌집을 제외한 모든 식물이 수확마다 +2점.' },
  companions: { id: 'companions', name: '공생의 정원', icon: '🤝', short: '서로 다른 타종 2이웃 +2', description: '자신과 다른 식물 두 종류 이상과 이웃한 식물은 +2점. 우물·벌집은 대상과 이웃에서 제외해요.' },
  edge_bloom: { id: 'edge_bloom', name: '테두리 화단', icon: '🪴', short: '가장자리 · 타종 이웃 +3', description: '가장자리에서 다른 종류 식물과 이웃하면 +3점. 우물·벌집은 대상과 이웃에서 제외해요.' },
  mixed_beds: { id: 'mixed_beds', name: '꽃과 잎 사이', icon: '🌿', short: '꽃이 잎·열매 곁이면 +2', description: '꽃 아닌 식물과 이웃한 꽃은 +2점. 우물·벌집은 이웃으로 세지 않아요.' },
};
export const WEATHER = {
  ...ORIGINAL_WEATHER,
  sun: { ...ORIGINAL_WEATHER.sun, short: '해바라기 +3 · 선인장 +2', description: '해바라기와 선인장이 좋아하는 맑은 날이에요.' },
  rain: { ...ORIGINAL_WEATHER.rain, short: '베리 +3 · 열매·물꽃 보너스', description: '베리 +3, 호박·딸기 +2, 연꽃·수국 +4점. 열린 식물만 적용돼요.' },
  cloud: { ...ORIGINAL_WEATHER.cloud, short: '버섯·고사리 +3 · 초롱꽃 +2', description: '버섯·고사리 +3, 초롱꽃 +2점. 열린 식물만 적용돼요.' },
};
const FLOWERS = new Set(['sunflower', 'clover', 'lavender', 'tulip', 'rose', 'lotus', 'daisy', 'bluebell', 'hydrangea', 'orchid', 'cherry']);
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const cloneBoard = board => board.map(tile => tile ? { ...tile } : null);
const countsFor = total => Array.from({ length: RUN_DAYS }, (_, i) => Math.floor(total / RUN_DAYS) + (i >= RUN_DAYS - total % RUN_DAYS ? 1 : 0));
const unlockAt = { 1: ['sunflower', 'clover', 'berry', 'lavender', 'mushroom', 'hive'], 6: ['mint'], 11: ['tulip'], 16: ['daisy'], 21: ['fern'], 26: ['bluebell'], 31: ['pumpkin'], 36: ['strawberry'], 41: ['rose'], 46: ['bamboo'], 51: ['lotus'], 61: ['cactus'], 71: ['hydrangea'], 81: ['orchid'], 91: ['cherry'] };
const regions = [
  { first: 1, last: 10, cols: 4, rows: 4, name: '첫 햇살', target: 250, step: 10 },
  { first: 11, last: 20, cols: 5, rows: 4, name: '향기로운 뜰', target: 360, step: 10 },
  { first: 21, last: 35, cols: 5, rows: 5, name: '꿀벌의 방문', target: 480, step: 6 },
  { first: 36, last: 50, cols: 6, rows: 5, name: '초록빛 산책', target: 600, step: 10 },
  { first: 51, last: 65, cols: 6, rows: 6, name: '숲의 선물', target: 780, step: 10 },
  { first: 66, last: 80, cols: 7, rows: 6, name: '장미의 약속', target: 960, step: 10 },
  { first: 81, last: 100, cols: 7, rows: 7, name: '물빛 정원', target: 1140, step: 6 },
];
const calibratedTargets = legacy.STAGES.map(stage => Math.round(stage.target * 1.15 / 5) * 5);
// Development targets; all fixed stage seeds are checked by tools/campaign-balance.mjs.
export const STAGES = Array.from({ length: 100 }, (_, i) => {
  const id = i + 1, region = regions.find(item => id >= item.first && id <= item.last), { cols, rows } = region;
  const seed = 20261013 + id * 7919, rng = random(seed, 437);
  const wellIndex = (1 + Math.floor(rng() * (rows - 2))) * cols + 1 + Math.floor(rng() * (cols - 2));
  return { id, name: `${region.name} ${id}`, cols, rows, seed, wellIndex, pool: Object.entries(unlockAt).filter(([at]) => Number(at) <= id).flatMap(([, types]) => types), unlocks: [...(unlockAt[id] || [])], target: calibratedTargets[i], picksPerDay: countsFor(cols * rows - 2) };
});
export function stageFor(stateOrId = 1) { if (stateOrId?.version === 2) return legacy.stageFor(stateOrId); const id = typeof stateOrId === 'object' && stateOrId ? stateOrId.stageId : stateOrId; return STAGES.find(stage => stage.id === id) || null; }
export function picksToday(state) { return stageFor(state)?.picksPerDay[state.day - 1] ?? 0; }
const neighbors = (index, cols, rows) => [index - cols, index + cols, ...(index % cols ? [index - 1] : []), ...(index % cols < cols - 1 ? [index + 1] : [])].filter(i => i >= 0 && i < cols * rows);
function random(seed, salt) {
  let state = ((seed % 4294967296) ^ Math.imul(Math.floor(seed / 4294967296), 0x9e3779b9) ^ Math.imul(salt, 0x85ebca6b)) >>> 0;
  return () => { state += 0x6D2B79F5; let t = state; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function sample(values, seed, salt, count = 3) {
  const copy = [...values], rng = random(seed, salt);
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy.slice(0, count);
}
const offersFor = (seed, stage, day, placements) => sample(stage.pool, seed, stage.id * 3571 + day * 31 + placements * 719);
const upgradeRequirement = { sun_pact: 'sunflower', colony: 'clover', diversity: 'lavender', jam: 'berry', shade: 'mushroom', bees: 'hive' };
function upgradesFor(seed, stage, day, picked, reroll = 0) {
  const pool = Object.keys(UPGRADES).filter(id => !picked.includes(id) && (!upgradeRequirement[id] || stage.pool.includes(upgradeRequirement[id])));
  const salt = stage.id * 1999 + day * 1543;
  const initial = sample(pool, seed, salt);
  if (!reroll) return initial;
  const alternatives = pool.filter(id => !initial.includes(id));
  return sample(alternatives.length >= 3 ? alternatives : pool, seed, salt + reroll * 104729);
}
const weatherFor = (seed, stageId) => { const rng = random(seed, 997 + stageId * 1291); return Array.from({ length: RUN_DAYS }, () => ['sun', 'rain', 'cloud'][Math.floor(rng() * 3)]); };
export function newRun(seed, stageId = 1) {
  const stage = stageFor(stageId) || STAGES[0];
  if (!Number.isSafeInteger(seed) || seed < 0) seed = stage.seed;
  const board = Array(stage.cols * stage.rows).fill(null);
  board[stage.wellIndex] = { type: 'well', age: 0, plantedDay: 0 };
  return { version: 3, stageId: stage.id, cols: stage.cols, rows: stage.rows, wellIndex: stage.wellIndex, runDays: RUN_DAYS, picksPerDay: [...stage.picksPerDay], seed, day: 1, phase: 'plant', board, offers: offersFor(seed, stage, 1, 0), placements: 0, score: 0, upgrades: [], upgradeOffers: [], upgradeRerolls: { 2: 0, 4: 0, 6: 0 }, history: [], harvests: [], lastHarvest: null, weather: weatherFor(seed, stage.id) };
}
export function plant(state, index, type) {
  if (state?.version === 2) return legacy.plant(state, index, type);
  if (!state || state.phase !== 'plant' || state.placements >= picksToday(state) || !Number.isInteger(index) || index < 0 || index >= state.board.length || state.board[index] !== null || !state.offers.includes(type) || !stageFor(state)?.pool.includes(type)) return state;
  const board = cloneBoard(state.board); board[index] = { type, age: 0, plantedDay: state.day };
  const history = [...state.history, { board: cloneBoard(state.board), offers: [...state.offers], placements: state.placements }];
  return { ...state, board, history, placements: state.placements + 1, offers: offersFor(state.seed, stageFor(state), state.day, state.placements + 1) };
}
export function undo(state) {
  if (state?.version === 2) return legacy.undo(state);
  if (!state || state.phase !== 'plant' || !state.history.length) return state;
  const previous = state.history.at(-1);
  return { ...state, board: cloneBoard(previous.board), offers: [...previous.offers], placements: previous.placements, history: state.history.slice(0, -1) };
}
export function forecast(state) {
  if (state?.version === 2) return legacy.forecast(state);
  const upgrades = new Set(state.upgrades), weather = state.weather[state.day - 1], stage = stageFor(state);
  const kinds = new Set(state.board.filter(tile => tile && tile.type !== 'well').map(tile => tile.type)), ecosystem = kinds.size >= 6;
  const tiles = [];
  for (let index = 0; index < state.board.length; index++) {
    const tile = state.board[index]; if (!tile || tile.type === 'well') continue;
    const nearIndices = neighbors(index, state.cols, state.rows);
    const near = nearIndices.map(i => state.board[i]).filter(Boolean), reasons = [];
    const otherPlants = near.filter(p => own(SEEDS, p.type) && p.type !== 'hive' && p.type !== tile.type);
    const edge = index < state.cols || index >= state.board.length - state.cols || index % state.cols === 0 || index % state.cols === state.cols - 1;
    const add = (label, value, combo = false) => { if (value > 0) reasons.push({ label, value, combo }); };
    const ageBonus = Math.min(tile.age, 2);
    if (tile.type === 'sunflower') { add('기본', 3); add('성장', ageBonus); if (weather === 'sun') add('햇살', 3, true); if (upgrades.has('sun_pact')) add('햇살 약속', 2, true); }
    if (tile.type === 'clover') { add('기본', 2); add('성장', ageBonus); add('클로버 이웃·최대 둘', Math.min(2, near.filter(p => p.type === 'clover').length) * (upgrades.has('colony') ? 3 : 2), true); if (otherPlants.length) add('다른 식물과 공생', 2, true); }
    if (tile.type === 'lavender') { add('기본', 2); add('성장', ageBonus); add('다양한 이웃', new Set(near.filter(p => own(SEEDS, p.type) && p.type !== 'hive' && p.type !== 'lavender').map(p => p.type)).size * (upgrades.has('diversity') ? 3 : 2), true); }
    if (tile.type === 'berry') { add('기본', 1); if (tile.age >= 2) add('달콤한 열매', upgrades.has('jam') ? 9 : 6, true); if (weather === 'rain') add('촉촉한 비', 3, true); }
    if (tile.type === 'mushroom') { add('기본', 2); if (near.some(p => p.type === 'well' || p.type === 'hive')) add('시원한 그늘', upgrades.has('shade') ? 7 : 4, true); if (weather === 'cloud') add('흐린 날', 3, true); }
    if (tile.type === 'hive') add('꽃과 꿀벌', near.filter(p => FLOWERS.has(p.type)).length * (upgrades.has('bees') ? 6 : 4), true);
    if (tile.type === 'mint') { add('기본', 2); add('성장', ageBonus); add('베리 이웃', near.filter(p => p.type === 'berry').length * 3, true); }
    if (tile.type === 'tulip') { add('기본', 3); add('성장', ageBonus); add('다른 꽃', new Set(near.filter(p => FLOWERS.has(p.type) && p.type !== 'tulip').map(p => p.type)).size * 2, true); }
    if (tile.type === 'fern') { add('기본', 3); if (near.some(p => p.type === 'well' || p.type === 'mushroom')) add('숲 그늘', 4, true); if (weather === 'cloud') add('흐린 날', 3, true); }
    if (tile.type === 'pumpkin') { add('기본', 2); if (tile.age >= 2) add('잘 익은 호박', 9, true); if (weather === 'rain') add('촉촉한 비', 2, true); }
    if (tile.type === 'rose') { add('기본', 4); add('성장', ageBonus); add('벌집 이웃', near.filter(p => p.type === 'hive').length * 4, true); }
    if (tile.type === 'lotus') { add('기본', 2); if (Math.floor(index / state.cols) === Math.floor(state.wellIndex / state.cols) || index % state.cols === state.wellIndex % state.cols) add('우물과 같은 줄', 5, true); if (weather === 'rain') add('촉촉한 비', 4, true); }
    if (tile.type === 'daisy') { add('기본', 2); add('성장', ageBonus); if (edge) add('가장자리 햇살', 3, true); }
    if (tile.type === 'bluebell') { add('기본', 2); add('성장', ageBonus); if (near.some(p => ['mushroom', 'fern'].includes(p.type))) add('숲속 이웃', 4, true); if (weather === 'cloud') add('흐린 날', 2, true); }
    if (tile.type === 'strawberry') { add('기본', 1); if (tile.age >= 2) add('빨갛게 익은 딸기', 5, true); if (near.some(p => p.type === 'mint')) add('민트의 향기', 4, true); if (weather === 'rain') add('촉촉한 비', 2, true); }
    if (tile.type === 'bamboo') { add('기본', 2); if ([index - state.cols, index + state.cols].filter(i => i >= 0 && i < state.board.length && state.board[i]?.type === 'bamboo').length === 1) add('두 줄기 대나무', 4, true); if (otherPlants.length) add('다른 식물과 공생', 2, true); }
    if (tile.type === 'cactus') { add('기본', 3); if (nearIndices.some(i => state.board[i] === null)) add('여유로운 빈자리', 4, true); if (weather === 'sun') add('햇살', 2, true); }
    if (tile.type === 'hydrangea') { add('기본', 2); add('성장', ageBonus); if (weather === 'rain') add('촉촉한 비', 4, true); if (near.some(p => p.type === 'well')) add('물가의 수국', 3, true); }
    if (tile.type === 'orchid') { add('기본', 3); add('성장', ageBonus); if (new Set(near.filter(p => FLOWERS.has(p.type) && p.type !== 'orchid').map(p => p.type)).size >= 2) add('다채로운 꽃 이웃', 5, true); }
    if (tile.type === 'cherry') { add('기본', 3); add('성장', ageBonus); if (tile.age >= 3) add('활짝 핀 벚꽃', 4, true); if (near.some(p => FLOWERS.has(p.type) && p.type !== 'cherry')) add('꽃 친구', 2, true); }
    if (tile.type !== 'hive' && near.some(p => p.type === 'well')) add('우물', upgrades.has('spring') ? 4 : 2, true);
    if (upgrades.has('patience') && tile.age >= 3) add('오래된 정원', 2, true);
    if (upgrades.has('wild') && ecosystem && tile.type !== 'hive') add('작은 생태계', 2, true);
    if (upgrades.has('companions') && tile.type !== 'hive' && new Set(otherPlants.map(p => p.type)).size >= 2) add('공생의 정원', 2, true);
    if (upgrades.has('edge_bloom') && tile.type !== 'hive' && edge && otherPlants.length) add('테두리 화단', 3, true);
    if (upgrades.has('mixed_beds') && FLOWERS.has(tile.type) && near.some(p => own(SEEDS, p.type) && p.type !== 'hive' && !FLOWERS.has(p.type))) add('꽃과 잎 사이', 2, true);
    tiles.push({ index, type: tile.type, value: reasons.reduce((sum, reason) => sum + reason.value, 0), reasons });
  }
  return { total: tiles.reduce((sum, tile) => sum + tile.value, 0), tiles, comboCount: tiles.filter(tile => tile.reasons.some(reason => reason.combo)).length };
}
function nextDay(state) { const day = state.day + 1; return { ...state, day, phase: 'plant', placements: 0, history: [], upgradeOffers: [], offers: offersFor(state.seed, stageFor(state), day, 0) }; }
export function harvest(state) {
  if (state?.version === 2) return legacy.harvest(state);
  if (!state || state.phase !== 'plant' || state.placements !== picksToday(state)) return state;
  const result = { ...forecast(state), day: state.day, weather: state.weather[state.day - 1] };
  const board = state.board.map(tile => tile && tile.type !== 'well' ? { ...tile, age: Math.min(7, tile.age + 1) } : tile ? { ...tile } : null);
  const scored = { ...state, board, history: [], score: state.score + result.total, harvests: [...state.harvests, result], lastHarvest: result };
  if (state.day === RUN_DAYS) return { ...scored, phase: 'over', upgradeOffers: [] };
  if (state.day % 2 === 0) return { ...scored, phase: 'upgrade', upgradeOffers: upgradesFor(state.seed, stageFor(state), state.day, state.upgrades) };
  return nextDay(scored);
}
export function chooseUpgrade(state, id) {
  if (state?.version === 2) return legacy.chooseUpgrade(state, id);
  if (!state || state.phase !== 'upgrade' || !state.upgradeOffers.includes(id) || state.upgrades.includes(id) || !own(UPGRADES, id)) return state;
  return nextDay({ ...state, upgrades: [...state.upgrades, id] });
}
export function rerollsRemaining(state) {
  return state?.version === 3 && state.phase === 'upgrade' && state.upgradeRerolls?.[state.day] === 0 ? 1 : 0;
}
export function rerollUpgrades(state) {
  if (!rerollsRemaining(state)) return state;
  const upgradeRerolls = { ...state.upgradeRerolls, [state.day]: 1 };
  return { ...state, upgradeRerolls, upgradeOffers: upgradesFor(state.seed, stageFor(state), state.day, state.upgrades, 1) };
}
function cleanBoard(board, day, stage) {
  if (!Array.isArray(board) || board.length !== stage.cols * stage.rows) return null;
  const clean = [];
  for (let i = 0; i < board.length; i++) {
    const tile = board[i];
    if (i === stage.wellIndex) { if (!tile || tile.type !== 'well' || tile.age !== 0 || tile.plantedDay !== 0) return null; clean.push({ type: 'well', age: 0, plantedDay: 0 }); continue; }
    if (tile === null) { clean.push(null); continue; }
    if (!tile || !stage.pool.includes(tile.type) || !Number.isInteger(tile.age) || tile.age < 0 || tile.age > 7 || !Number.isInteger(tile.plantedDay) || tile.plantedDay < 1 || tile.plantedDay > day) return null;
    clean.push({ type: tile.type, age: tile.age, plantedDay: tile.plantedDay });
  }
  return clean;
}
const validIds = (values, entries, count) => Array.isArray(values) && (count === undefined || values.length === count) && values.every(id => typeof id === 'string' && own(entries, id)) && new Set(values).size === values.length;
function validPlantingDays(board, day, placements, stage) {
  for (let plantedDay = 1; plantedDay <= day; plantedDay++) if (board.filter(tile => tile && tile.type !== 'well' && tile.plantedDay === plantedDay).length !== (plantedDay === day ? placements : stage.picksPerDay[plantedDay - 1])) return false;
  return true;
}
function validPlacementTransition(previous, nextBoard, day) {
  let additions = 0;
  for (let i = 0; i < nextBoard.length; i++) {
    const before = previous.board[i], after = nextBoard[i];
    if (before === null && after !== null) { if (after.age !== 0 || after.plantedDay !== day || !previous.offers.includes(after.type)) return false; additions++; }
    else if (!same(before, after)) return false;
  }
  return additions === 1;
}
function cleanHarvest(result, day, stage) {
  const plantCount = stage.picksPerDay.slice(0, day).reduce((a, b) => a + b, 0);
  if (!result || result.day !== day || !own(WEATHER, result.weather) || !Number.isSafeInteger(result.total) || result.total < 0 || !Array.isArray(result.tiles) || result.tiles.length !== plantCount) return null;
  const tiles = [], indices = new Set();
  for (const tile of result.tiles) {
    if (!tile || !Number.isInteger(tile.index) || tile.index < 0 || tile.index >= stage.cols * stage.rows || tile.index === stage.wellIndex || indices.has(tile.index) || !stage.pool.includes(tile.type) || !Number.isSafeInteger(tile.value) || tile.value < 0 || !Array.isArray(tile.reasons) || tile.reasons.length > 8) return null;
    const reasons = [];
    for (const reason of tile.reasons) {
      if (!reason || typeof reason.label !== 'string' || reason.label.length > 60 || !Number.isSafeInteger(reason.value) || reason.value <= 0 || typeof reason.combo !== 'boolean') return null;
      reasons.push({ label: reason.label, value: reason.value, combo: reason.combo });
    }
    if (reasons.reduce((sum, reason) => sum + reason.value, 0) !== tile.value) return null;
    indices.add(tile.index); tiles.push({ index: tile.index, type: tile.type, value: tile.value, reasons });
  }
  if (tiles.reduce((sum, tile) => sum + tile.value, 0) !== result.total) return null;
  const comboCount = tiles.filter(tile => tile.reasons.some(reason => reason.combo)).length;
  if (result.comboCount !== comboCount) return null;
  return { day, weather: result.weather, total: result.total, comboCount, tiles };
}
export function sanitizeState(input) {
  if (input?.version === 2) return legacy.sanitizeState(input);
  try {
    const stage = stageFor(input); if (!stage || input.version !== 3 || !Number.isSafeInteger(input.seed) || input.seed < 0 || !Number.isInteger(input.day) || input.day < 1 || input.day > RUN_DAYS || !['plant', 'upgrade', 'over'].includes(input.phase) || !Number.isInteger(input.placements) || input.placements < 0 || input.placements > stage.picksPerDay[input.day - 1] || !Number.isSafeInteger(input.score) || input.score < 0) return null;
    if (input.cols !== stage.cols || input.rows !== stage.rows || input.wellIndex !== stage.wellIndex || input.runDays !== RUN_DAYS || !same(input.picksPerDay, stage.picksPerDay)) return null;
    if ((input.phase === 'over' && (input.day !== RUN_DAYS || input.placements !== picksToday(input))) || (input.phase === 'upgrade' && (![2, 4, 6].includes(input.day) || input.placements !== picksToday(input)))) return null;
    const board = cleanBoard(input.board, input.day, stage); if (!board) return null;
    const finished = input.phase === 'plant' ? input.day - 1 : input.day;
    if (!validPlantingDays(board, input.day, input.placements, stage) || board.some(tile => tile && tile.type !== 'well' && tile.age !== finished - tile.plantedDay + 1)) return null;
    if (!validIds(input.offers, SEEDS, 3) || !same(input.offers, offersFor(input.seed, stage, input.day, input.placements))) return null;
    const expectedUpgrades = input.phase === 'over' ? 3 : Math.floor((input.day - 1) / 2);
    if (!validIds(input.upgrades, UPGRADES, expectedUpgrades) || !validIds(input.upgradeOffers, UPGRADES, input.phase === 'upgrade' ? 3 : 0) || input.upgradeOffers.some(id => input.upgrades.includes(id))) return null;
    if (!input.upgradeRerolls || typeof input.upgradeRerolls !== 'object' || Array.isArray(input.upgradeRerolls) || !same(Object.keys(input.upgradeRerolls).sort(), ['2', '4', '6'])) return null;
    const upgradeRerolls = {};
    for (const day of [2, 4, 6]) {
      const count = input.upgradeRerolls[day];
      if (count !== 0 && count !== 1) return null;
      if ((day > input.day || (day === input.day && input.phase === 'plant')) && count !== 0) return null;
      upgradeRerolls[day] = count;
    }
    for (let i = 0; i < input.upgrades.length; i++) if (!upgradesFor(input.seed, stage, (i + 1) * 2, input.upgrades.slice(0, i), upgradeRerolls[(i + 1) * 2]).includes(input.upgrades[i])) return null;
    if (input.phase === 'upgrade' && !same(input.upgradeOffers, upgradesFor(input.seed, stage, input.day, input.upgrades, upgradeRerolls[input.day]))) return null;
    const weather = weatherFor(input.seed, stage.id); if (!same(input.weather, weather)) return null;
    if (!Array.isArray(input.harvests) || input.harvests.length !== finished) return null;
    const harvests = input.harvests.map((result, i) => cleanHarvest(result, i + 1, stage));
    if (harvests.some((result, i) => !result || result.weather !== weather[i]) || harvests.reduce((sum, result) => sum + result.total, 0) !== input.score) return null;
    if (!Array.isArray(input.history) || input.history.length !== (input.phase === 'plant' ? input.placements : 0)) return null;
    const history = [];
    for (let i = 0; i < input.history.length; i++) {
      const previous = input.history[i], previousBoard = cleanBoard(previous?.board, input.day, stage);
      if (!previousBoard || previous.placements !== i || !validIds(previous.offers, SEEDS, 3) || !same(previous.offers, offersFor(input.seed, stage, input.day, i)) || !validPlantingDays(previousBoard, input.day, i, stage) || previousBoard.some(tile => tile && tile.type !== 'well' && tile.age !== finished - tile.plantedDay + 1)) return null;
      history.push({ board: previousBoard, offers: [...previous.offers], placements: i });
    }
    for (let i = 0; i < history.length; i++) if (!validPlacementTransition(history[i], history[i + 1]?.board || board, input.day)) return null;
    return { version: 3, stageId: stage.id, cols: stage.cols, rows: stage.rows, wellIndex: stage.wellIndex, runDays: RUN_DAYS, picksPerDay: [...stage.picksPerDay], seed: input.seed, day: input.day, phase: input.phase, board, offers: [...input.offers], placements: input.placements, score: input.score, upgrades: [...input.upgrades], upgradeOffers: [...input.upgradeOffers], upgradeRerolls, history, harvests, lastHarvest: harvests.at(-1) || null, weather };
  } catch { return null; }
}
function loadJSON(storage, key, sanitize, fallback) {
  let raw; try { raw = storage.getItem(key); } catch { return { value: fallback(), available: false }; }
  try { return { value: raw ? sanitize(JSON.parse(raw)) ?? fallback() : fallback(), available: true }; } catch { return { value: fallback(), available: true }; }
}
export function loadRun(storage) { const loaded = loadJSON(storage, STORAGE_KEY, sanitizeState, () => null); return { state: loaded.value, available: loaded.available }; }
export function saveRun(storage, state) { try { const clean = sanitizeState(state); if (!clean) return false; storage.setItem(STORAGE_KEY, JSON.stringify(clean)); return true; } catch { return false; } }

export const newCampaign = () => ({ version: 1, unlocked: 1, stages: {} });
const starsAtTarget = (score, target) => score * 100 >= target * 140 ? 3 : score * 100 >= target * 115 ? 2 : score >= target ? 1 : 0;
export function sanitizeCampaign(input) {
  try {
    if (!input || input.version !== 1 || !Number.isInteger(input.unlocked) || input.unlocked < 1 || input.unlocked > STAGES.length || !input.stages || typeof input.stages !== 'object' || Array.isArray(input.stages)) return null;
    const stages = {};
    for (const [key, value] of Object.entries(input.stages)) {
      const stage = stageFor(Number(key));
      if (!stage || String(stage.id) !== key || !value || !Number.isSafeInteger(value.best) || value.best < 0 || typeof value.cleared !== 'boolean' || !Number.isInteger(value.attempts) || value.attempts < 1 || !Array.isArray(value.runIds) || value.runIds.length !== value.attempts || new Set(value.runIds).size !== value.runIds.length) return null;
      if (value.runIds.some(id => typeof id !== 'string' || !new RegExp(`^${stage.id}:(0|[1-9][0-9]*)(:v3)?$`).test(id) || !Number.isSafeInteger(Number(id.split(':')[1]))) || !value.runIds.includes(value.lastRunId)) return null;
      const oldTarget = legacy.stageFor(stage.id).target;
      const hasLegacyRuns = value.runIds.some(id => !id.endsWith(':v3'));
      const hasNewRuns = value.runIds.some(id => id.endsWith(':v3'));
      let targetAtClear = value.targetAtClear, earnedStars = value.earnedStars;
      if (!own(value, 'targetAtClear') && !own(value, 'earnedStars')) {
        if (hasNewRuns || value.cleared !== (value.best >= oldTarget)) return null;
        targetAtClear = value.cleared ? oldTarget : null;
        earnedStars = starsAtTarget(value.best, oldTarget);
      }
      const possibleTargets = [...(hasLegacyRuns ? [oldTarget] : []), ...(hasNewRuns ? [stage.target] : [])];
      if (!Number.isInteger(earnedStars) || earnedStars < 0 || earnedStars > 3) return null;
      if (value.cleared) {
        if (!possibleTargets.includes(targetAtClear) || value.best < targetAtClear || earnedStars < 1 || earnedStars > starsAtTarget(value.best, Math.min(...possibleTargets))) return null;
      } else if (targetAtClear !== null || earnedStars !== 0 || value.best >= Math.max(...possibleTargets)) return null;
      stages[key] = { best: value.best, cleared: value.cleared, attempts: value.attempts, lastRunId: value.lastRunId, runIds: [...value.runIds], targetAtClear, earnedStars };
    }
    let unlocked = 1; while (unlocked < STAGES.length && stages[unlocked]?.cleared) unlocked++;
    if (unlocked !== input.unlocked || Object.keys(stages).some(id => Number(id) > unlocked)) return null;
    return { version: 1, unlocked, stages };
  } catch { return null; }
}
export function canPlay(campaign, id) { return !!stageFor(id) && !!sanitizeCampaign(campaign) && id <= campaign.unlocked; }
export function recordResult(campaign, state) {
  const clean = sanitizeState(state), progress = sanitizeCampaign(campaign);
  if (!clean || clean.phase !== 'over' || !progress || !canPlay(progress, clean.stageId)) return campaign;
  const stage = stageFor(clean), previous = progress.stages[stage.id], runId = `${stage.id}:${clean.seed}${clean.version === 3 ? ':v3' : ''}`;
  const runIds = previous?.runIds.includes(runId) ? [...previous.runIds] : [...(previous?.runIds || []), runId];
  const best = Math.max(previous?.best || 0, clean.score), cleared = !!previous?.cleared || clean.score >= stage.target;
  const targetAtClear = previous?.targetAtClear ?? (clean.score >= stage.target ? stage.target : null);
  const earnedStars = Math.max(previous?.earnedStars || 0, starsAtTarget(clean.score, stage.target));
  const result = { best, cleared, attempts: runIds.length, lastRunId: runId, runIds, targetAtClear, earnedStars };
  if (same(previous, result)) return campaign;
  const stages = { ...progress.stages, [stage.id]: result };
  return { version: 1, unlocked: cleared ? Math.min(STAGES.length, Math.max(progress.unlocked, stage.id + 1)) : progress.unlocked, stages };
}
export function loadCampaign(storage) { const loaded = loadJSON(storage, CAMPAIGN_STORAGE_KEY, sanitizeCampaign, newCampaign); return { campaign: loaded.value, available: loaded.available }; }
export function saveCampaign(storage, campaign) { try { const clean = sanitizeCampaign(campaign); if (!clean) return false; storage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(clean)); return true; } catch { return false; } }
