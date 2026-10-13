import { SEEDS as ORIGINAL_SEEDS, UPGRADES as ORIGINAL_UPGRADES, WEATHER as ORIGINAL_WEATHER } from './growth-core.mjs';

export const RUN_DAYS = 7;
export const STORAGE_KEY = 'sunlit-garden:campaign:run:v1';
export const CAMPAIGN_STORAGE_KEY = 'sunlit-garden:campaign:progress:v1';
export const SEEDS = {
  ...ORIGINAL_SEEDS,
  hive: { ...ORIGINAL_SEEDS.hive, description: '상하좌우 해바라기·클로버·라벤더·튤립·장미마다 +4점.' },
  mint: { id: 'mint', name: '민트', icon: '🌿', short: '옆 베리마다 +3', description: '기본 2점. 수확할 때마다 다음 수확 +1, 최대 +2. 상하좌우 베리마다 +3점.' },
  tulip: { id: 'tulip', name: '튤립', icon: '🌷', short: '다른 꽃 종류마다 +2', description: '기본 3점. 수확할 때마다 다음 수확 +1, 최대 +2. 상하좌우의 다른 꽃 종류마다 +2점.' },
  fern: { id: 'fern', name: '고사리', icon: '🌱', short: '우물·버섯 옆 +4', description: '기본 3점. 우물 또는 버섯 옆이면 +4점(중복 없음). 흐린 날 +3점.' },
  pumpkin: { id: 'pumpkin', name: '호박', icon: '🎃', short: '세 번째 수확부터 +9', description: '기본 2점. 심은 뒤 세 번째 수확부터 +9점. 비 오는 날 +2점.' },
  rose: { id: 'rose', name: '장미', icon: '🌹', short: '옆 벌집마다 +4', description: '기본 4점. 수확할 때마다 다음 수확 +1, 최대 +2. 상하좌우 벌집마다 +4점.' },
  lotus: { id: 'lotus', name: '연꽃', icon: '🪷', short: '우물과 같은 줄 +5', description: '기본 2점. 우물과 같은 행 또는 열이면 +5점(중복 없음). 비 오는 날 +4점.' },
};
export const UPGRADES = {
  ...ORIGINAL_UPGRADES,
  wild: { ...ORIGINAL_UPGRADES.wild, short: '이 단계 전종 모으면 +2', description: '현재 단계에서 열린 모든 종류를 심으면 벌집을 제외한 모든 식물이 수확마다 +2점.' },
};
export const WEATHER = {
  ...ORIGINAL_WEATHER,
  rain: { ...ORIGINAL_WEATHER.rain, short: '베리 +3 · 호박 +2 · 연꽃 +4', description: '비가 베리·호박·연꽃의 수확을 높여요. 현재 단계에서 열린 식물만 적용돼요.' },
  cloud: { ...ORIGINAL_WEATHER.cloud, short: '버섯·고사리 +3', description: '버섯과 고사리가 좋아하는 선선한 날이에요. 현재 단계에서 열린 식물만 적용돼요.' },
};
const FLOWERS = new Set(['sunflower', 'clover', 'lavender', 'tulip', 'rose']);
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const cloneBoard = board => board.map(tile => tile ? { ...tile } : null);
const countsFor = total => Array.from({ length: RUN_DAYS }, (_, i) => Math.floor(total / RUN_DAYS) + (i >= RUN_DAYS - total % RUN_DAYS ? 1 : 0));
const unlockAt = { 1: ['sunflower', 'clover', 'berry'], 6: ['lavender'], 11: ['mushroom'], 21: ['hive'], 31: ['mint'], 41: ['tulip'], 51: ['fern'], 61: ['pumpkin'], 71: ['rose'], 81: ['lotus'] };
const regions = [
  { first: 1, last: 10, cols: 4, rows: 4, name: '첫 햇살', target: 250, step: 10 },
  { first: 11, last: 20, cols: 5, rows: 4, name: '향기로운 뜰', target: 360, step: 10 },
  { first: 21, last: 35, cols: 5, rows: 5, name: '꿀벌의 방문', target: 480, step: 6 },
  { first: 36, last: 50, cols: 6, rows: 5, name: '초록빛 산책', target: 600, step: 10 },
  { first: 51, last: 65, cols: 6, rows: 6, name: '숲의 선물', target: 780, step: 10 },
  { first: 66, last: 80, cols: 7, rows: 6, name: '장미의 약속', target: 960, step: 10 },
  { first: 81, last: 100, cols: 7, rows: 7, name: '물빛 정원', target: 1140, step: 6 },
];
const calibratedTargets = [345,360,370,375,380,385,390,395,400,405,410,415,420,425,430,435,440,445,450,455,555,560,565,570,575,580,585,590,595,600,605,610,615,620,625,745,770,775,780,785,790,795,800,805,810,820,825,830,835,840,935,940,945,950,955,960,965,970,975,980,990,1000,1005,1010,1015,1210,1215,1220,1225,1230,1250,1255,1260,1265,1270,1310,1315,1325,1335,1340,1430,1435,1440,1445,1450,1455,1460,1465,1470,1475,1480,1485,1490,1495,1500,1505,1510,1585,1650,1660];
// Development targets; all fixed stage seeds are checked by tools/campaign-balance.mjs.
export const STAGES = Array.from({ length: 100 }, (_, i) => {
  const id = i + 1, region = regions.find(item => id >= item.first && id <= item.last), { cols, rows } = region;
  const seed = 20261013 + id * 7919, rng = random(seed, 437);
  const wellIndex = (1 + Math.floor(rng() * (rows - 2))) * cols + 1 + Math.floor(rng() * (cols - 2));
  return { id, name: `${region.name} ${id}`, cols, rows, seed, wellIndex, pool: Object.entries(unlockAt).filter(([at]) => Number(at) <= id).flatMap(([, types]) => types), unlocks: [...(unlockAt[id] || [])], target: calibratedTargets[i], picksPerDay: countsFor(cols * rows - 2) };
});
export function stageFor(stateOrId = 1) { const id = typeof stateOrId === 'object' && stateOrId ? stateOrId.stageId : stateOrId; return STAGES.find(stage => stage.id === id) || null; }
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
function upgradesFor(seed, stage, day, picked) {
  return sample(Object.keys(UPGRADES).filter(id => !picked.includes(id) && (!upgradeRequirement[id] || stage.pool.includes(upgradeRequirement[id]))), seed, stage.id * 1999 + day * 1543);
}
const weatherFor = (seed, stageId) => { const rng = random(seed, 997 + stageId * 1291); return Array.from({ length: RUN_DAYS }, () => ['sun', 'rain', 'cloud'][Math.floor(rng() * 3)]); };
export function newRun(seed, stageId = 1) {
  const stage = stageFor(stageId) || STAGES[0];
  if (!Number.isSafeInteger(seed) || seed < 0) seed = stage.seed;
  const board = Array(stage.cols * stage.rows).fill(null);
  board[stage.wellIndex] = { type: 'well', age: 0, plantedDay: 0 };
  return { version: 2, stageId: stage.id, cols: stage.cols, rows: stage.rows, wellIndex: stage.wellIndex, runDays: RUN_DAYS, picksPerDay: [...stage.picksPerDay], seed, day: 1, phase: 'plant', board, offers: offersFor(seed, stage, 1, 0), placements: 0, score: 0, upgrades: [], upgradeOffers: [], history: [], harvests: [], lastHarvest: null, weather: weatherFor(seed, stage.id) };
}
export function plant(state, index, type) {
  if (!state || state.phase !== 'plant' || state.placements >= picksToday(state) || !Number.isInteger(index) || index < 0 || index >= state.board.length || state.board[index] !== null || !state.offers.includes(type) || !stageFor(state)?.pool.includes(type)) return state;
  const board = cloneBoard(state.board); board[index] = { type, age: 0, plantedDay: state.day };
  const history = [...state.history, { board: cloneBoard(state.board), offers: [...state.offers], placements: state.placements }];
  return { ...state, board, history, placements: state.placements + 1, offers: offersFor(state.seed, stageFor(state), state.day, state.placements + 1) };
}
export function undo(state) {
  if (!state || state.phase !== 'plant' || !state.history.length) return state;
  const previous = state.history.at(-1);
  return { ...state, board: cloneBoard(previous.board), offers: [...previous.offers], placements: previous.placements, history: state.history.slice(0, -1) };
}
export function forecast(state) {
  const upgrades = new Set(state.upgrades), weather = state.weather[state.day - 1], stage = stageFor(state);
  const kinds = new Set(state.board.filter(Boolean).map(tile => tile.type)), ecosystem = stage.pool.every(type => kinds.has(type));
  const tiles = [];
  for (let index = 0; index < state.board.length; index++) {
    const tile = state.board[index]; if (!tile || tile.type === 'well') continue;
    const near = neighbors(index, state.cols, state.rows).map(i => state.board[i]).filter(Boolean), reasons = [];
    const add = (label, value, combo = false) => { if (value > 0) reasons.push({ label, value, combo }); };
    const ageBonus = Math.min(tile.age, 2);
    if (tile.type === 'sunflower') { add('기본', 3); add('성장', ageBonus); if (weather === 'sun') add('햇살', 3, true); if (upgrades.has('sun_pact')) add('햇살 약속', 2, true); }
    if (tile.type === 'clover') { add('기본', 2); add('성장', ageBonus); add('클로버 이웃', near.filter(p => p.type === 'clover').length * (upgrades.has('colony') ? 3 : 2), true); }
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
    if (tile.type !== 'hive' && near.some(p => p.type === 'well')) add('우물', upgrades.has('spring') ? 4 : 2, true);
    if (upgrades.has('patience') && tile.age >= 3) add('오래된 정원', 2, true);
    if (upgrades.has('wild') && ecosystem && tile.type !== 'hive') add('작은 생태계', 2, true);
    tiles.push({ index, type: tile.type, value: reasons.reduce((sum, reason) => sum + reason.value, 0), reasons });
  }
  return { total: tiles.reduce((sum, tile) => sum + tile.value, 0), tiles, comboCount: tiles.filter(tile => tile.reasons.some(reason => reason.combo)).length };
}
function nextDay(state) { const day = state.day + 1; return { ...state, day, phase: 'plant', placements: 0, history: [], upgradeOffers: [], offers: offersFor(state.seed, stageFor(state), day, 0) }; }
export function harvest(state) {
  if (!state || state.phase !== 'plant' || state.placements !== picksToday(state)) return state;
  const result = { ...forecast(state), day: state.day, weather: state.weather[state.day - 1] };
  const board = state.board.map(tile => tile && tile.type !== 'well' ? { ...tile, age: Math.min(7, tile.age + 1) } : tile ? { ...tile } : null);
  const scored = { ...state, board, history: [], score: state.score + result.total, harvests: [...state.harvests, result], lastHarvest: result };
  if (state.day === RUN_DAYS) return { ...scored, phase: 'over', upgradeOffers: [] };
  if (state.day % 2 === 0) return { ...scored, phase: 'upgrade', upgradeOffers: upgradesFor(state.seed, stageFor(state), state.day, state.upgrades) };
  return nextDay(scored);
}
export function chooseUpgrade(state, id) {
  if (!state || state.phase !== 'upgrade' || !state.upgradeOffers.includes(id) || state.upgrades.includes(id) || !own(UPGRADES, id)) return state;
  return nextDay({ ...state, upgrades: [...state.upgrades, id] });
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
  try {
    const stage = stageFor(input); if (!stage || input.version !== 2 || !Number.isSafeInteger(input.seed) || input.seed < 0 || !Number.isInteger(input.day) || input.day < 1 || input.day > RUN_DAYS || !['plant', 'upgrade', 'over'].includes(input.phase) || !Number.isInteger(input.placements) || input.placements < 0 || input.placements > stage.picksPerDay[input.day - 1] || !Number.isSafeInteger(input.score) || input.score < 0) return null;
    if (input.cols !== stage.cols || input.rows !== stage.rows || input.wellIndex !== stage.wellIndex || input.runDays !== RUN_DAYS || !same(input.picksPerDay, stage.picksPerDay)) return null;
    if ((input.phase === 'over' && (input.day !== RUN_DAYS || input.placements !== picksToday(input))) || (input.phase === 'upgrade' && (![2, 4, 6].includes(input.day) || input.placements !== picksToday(input)))) return null;
    const board = cleanBoard(input.board, input.day, stage); if (!board) return null;
    const finished = input.phase === 'plant' ? input.day - 1 : input.day;
    if (!validPlantingDays(board, input.day, input.placements, stage) || board.some(tile => tile && tile.type !== 'well' && tile.age !== finished - tile.plantedDay + 1)) return null;
    if (!validIds(input.offers, SEEDS, 3) || !same(input.offers, offersFor(input.seed, stage, input.day, input.placements))) return null;
    const expectedUpgrades = input.phase === 'over' ? 3 : Math.floor((input.day - 1) / 2);
    if (!validIds(input.upgrades, UPGRADES, expectedUpgrades) || !validIds(input.upgradeOffers, UPGRADES, input.phase === 'upgrade' ? 3 : 0) || input.upgradeOffers.some(id => input.upgrades.includes(id))) return null;
    for (let i = 0; i < input.upgrades.length; i++) if (!upgradesFor(input.seed, stage, (i + 1) * 2, input.upgrades.slice(0, i)).includes(input.upgrades[i])) return null;
    if (input.phase === 'upgrade' && !same(input.upgradeOffers, upgradesFor(input.seed, stage, input.day, input.upgrades))) return null;
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
    return { version: 2, stageId: stage.id, cols: stage.cols, rows: stage.rows, wellIndex: stage.wellIndex, runDays: RUN_DAYS, picksPerDay: [...stage.picksPerDay], seed: input.seed, day: input.day, phase: input.phase, board, offers: [...input.offers], placements: input.placements, score: input.score, upgrades: [...input.upgrades], upgradeOffers: [...input.upgradeOffers], history, harvests, lastHarvest: harvests.at(-1) || null, weather };
  } catch { return null; }
}
function loadJSON(storage, key, sanitize, fallback) {
  let raw; try { raw = storage.getItem(key); } catch { return { value: fallback(), available: false }; }
  try { return { value: raw ? sanitize(JSON.parse(raw)) ?? fallback() : fallback(), available: true }; } catch { return { value: fallback(), available: true }; }
}
export function loadRun(storage) { const loaded = loadJSON(storage, STORAGE_KEY, sanitizeState, () => null); return { state: loaded.value, available: loaded.available }; }
export function saveRun(storage, state) { try { const clean = sanitizeState(state); if (!clean) return false; storage.setItem(STORAGE_KEY, JSON.stringify(clean)); return true; } catch { return false; } }

export const newCampaign = () => ({ version: 1, unlocked: 1, stages: {} });
export function sanitizeCampaign(input) {
  try {
    if (!input || input.version !== 1 || !Number.isInteger(input.unlocked) || input.unlocked < 1 || input.unlocked > STAGES.length || !input.stages || typeof input.stages !== 'object' || Array.isArray(input.stages)) return null;
    const stages = {};
    for (const [key, value] of Object.entries(input.stages)) {
      const stage = stageFor(Number(key));
      if (!stage || String(stage.id) !== key || !value || !Number.isSafeInteger(value.best) || value.best < 0 || typeof value.cleared !== 'boolean' || value.cleared !== (value.best >= stage.target) || !Number.isInteger(value.attempts) || value.attempts < 1 || !Array.isArray(value.runIds) || value.runIds.length !== value.attempts || new Set(value.runIds).size !== value.runIds.length) return null;
      if (value.runIds.some(id => typeof id !== 'string' || !new RegExp(`^${stage.id}:(0|[1-9][0-9]*)$`).test(id) || !Number.isSafeInteger(Number(id.split(':')[1]))) || !value.runIds.includes(value.lastRunId)) return null;
      stages[key] = { best: value.best, cleared: value.cleared, attempts: value.attempts, lastRunId: value.lastRunId, runIds: [...value.runIds] };
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
  const stage = stageFor(clean), previous = progress.stages[stage.id], runId = `${stage.id}:${clean.seed}`;
  const runIds = previous?.runIds.includes(runId) ? [...previous.runIds] : [...(previous?.runIds || []), runId];
  const best = Math.max(previous?.best || 0, clean.score), cleared = best >= stage.target;
  const result = { best, cleared, attempts: runIds.length, lastRunId: runId, runIds };
  if (same(previous, result)) return campaign;
  const stages = { ...progress.stages, [stage.id]: result };
  return { version: 1, unlocked: cleared ? Math.min(STAGES.length, Math.max(progress.unlocked, stage.id + 1)) : progress.unlocked, stages };
}
export function loadCampaign(storage) { const loaded = loadJSON(storage, CAMPAIGN_STORAGE_KEY, sanitizeCampaign, newCampaign); return { campaign: loaded.value, available: loaded.available }; }
export function saveCampaign(storage, campaign) { try { const clean = sanitizeCampaign(campaign); if (!clean) return false; storage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(clean)); return true; } catch { return false; } }
