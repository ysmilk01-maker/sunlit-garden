export const RUN_DAYS = 7;
export const STORAGE_KEY = 'sunlit-garden:growth:v1';
export const WELL_INDEX = 5;
export const SEEDS = {
  sunflower: { id: 'sunflower', name: '해바라기', icon: '🌻', short: '맑은 날 +3', description: '기본 3점. 수확할 때마다 다음 수확 +1, 최대 +2. 맑은 날 +3점.' },
  clover: { id: 'clover', name: '클로버', icon: '🍀', short: '옆 클로버마다 +2', description: '기본 2점. 수확할 때마다 다음 수확 +1, 최대 +2. 상하좌우 클로버마다 +2점.' },
  lavender: { id: 'lavender', name: '라벤더', icon: '🪻', short: '다른 식물 종류마다 +2', description: '기본 2점. 수확할 때마다 다음 수확 +1, 최대 +2. 상하좌우의 다른 식물 종류마다 +2점. 벌집·우물 제외.' },
  berry: { id: 'berry', name: '베리', icon: '🫐', short: '세 번째 수확부터 +6', description: '기본 1점. 심은 뒤 세 번째 수확부터 +6, 비 오는 날 +3점.' },
  mushroom: { id: 'mushroom', name: '버섯', icon: '🍄', short: '우물·벌집 옆 +4', description: '기본 2점. 우물 또는 벌집 옆 +4, 흐린 날 +3점.' },
  hive: { id: 'hive', name: '벌집', icon: '🐝', short: '옆 꽃마다 +4', description: '상하좌우 해바라기·클로버·라벤더마다 +4점.' },
};
export const UPGRADES = {
  sun_pact: { id: 'sun_pact', name: '햇살 약속', icon: '☀️', short: '해바라기 +2', description: '날씨와 관계없이 모든 해바라기가 수확마다 +2점.' },
  colony: { id: 'colony', name: '초록 군락', icon: '🍀', short: '클로버 이웃 +1', description: '클로버의 이웃 클로버 한 개당 보너스가 2점에서 3점으로 증가.' },
  diversity: { id: 'diversity', name: '향기 모자이크', icon: '🪻', short: '다른 식물 종류 +1', description: '라벤더의 서로 다른 이웃 종류당 보너스가 2점에서 3점으로 증가.' },
  jam: { id: 'jam', name: '달콤한 잼', icon: '🫐', short: '익은 베리 +3', description: '두 번 자란 베리의 성숙 보너스가 6점에서 9점으로 증가.' },
  shade: { id: 'shade', name: '시원한 그늘', icon: '🍄', short: '그늘 버섯 +3', description: '우물 또는 벌집 옆 버섯의 그늘 보너스가 4점에서 7점으로 증가.' },
  bees: { id: 'bees', name: '부지런한 꿀벌', icon: '🐝', short: '벌집 옆 꽃 +2', description: '벌집의 이웃 꽃 한 개당 점수가 4점에서 6점으로 증가.' },
  spring: { id: 'spring', name: '맑은 샘물', icon: '💧', short: '우물 옆 +2', description: '우물 옆 식물의 보너스가 2점에서 4점으로 증가. 벌집 제외.' },
  patience: { id: 'patience', name: '오래된 정원', icon: '🌳', short: '세 번 자라면 +2', description: '수확을 세 번 겪은 모든 기물은 수확마다 +2점.' },
  wild: { id: 'wild', name: '작은 생태계', icon: '🌈', short: '6종 모으면 식물 +2', description: '여섯 종류를 모두 심으면 벌집을 제외한 모든 식물이 수확마다 +2점.' },
};
export const WEATHER = {
  sun: { id: 'sun', name: '맑음', icon: '☀️', short: '해바라기 +3', description: '해바라기가 더 많은 햇살을 받아요.' },
  rain: { id: 'rain', name: '비', icon: '🌧️', short: '베리 +3', description: '촉촉한 비가 베리를 키워요.' },
  cloud: { id: 'cloud', name: '흐림', icon: '☁️', short: '버섯 +3', description: '버섯이 좋아하는 선선한 날이에요.' },
};
const TYPES = Object.keys(SEEDS);
const FLOWERS = new Set(['sunflower', 'clover', 'lavender']);
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const cloneBoard = board => board.map(tile => tile ? { ...tile } : null);
const neighbors = index => [index - 4, index + 4, ...(index % 4 ? [index - 1] : []), ...(index % 4 < 3 ? [index + 1] : [])].filter(i => i >= 0 && i < 16);
function random(seed, salt) {
  let state = ((seed % 4294967296) ^ Math.imul(Math.floor(seed / 4294967296), 0x9e3779b9) ^ Math.imul(salt, 0x85ebca6b)) >>> 0;
  return () => { state += 0x6D2B79F5; let t = state; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function sample(values, seed, salt, count = 3) {
  const valuesCopy = [...values], rng = random(seed, salt);
  for (let i = valuesCopy.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [valuesCopy[i], valuesCopy[j]] = [valuesCopy[j], valuesCopy[i]]; }
  return valuesCopy.slice(0, count);
}
const offersFor = (seed, day, placements) => sample(TYPES, seed, day * 31 + placements * 719);
const upgradesFor = (seed, day, picked) => sample(Object.keys(UPGRADES).filter(id => !picked.includes(id)), seed, day * 1543);
const weatherFor = seed => { const rng = random(seed, 997); return Array.from({ length: RUN_DAYS }, () => ['sun', 'rain', 'cloud'][Math.floor(rng() * 3)]); };
export function newRun(seed = 1) {
  if (!Number.isSafeInteger(seed) || seed < 0) seed = 1;
  const board = Array(16).fill(null); board[WELL_INDEX] = { type: 'well', age: 0, plantedDay: 0 };
  return { version: 1, seed, day: 1, phase: 'plant', board, offers: offersFor(seed, 1, 0), placements: 0, score: 0, upgrades: [], upgradeOffers: [], history: [], harvests: [], lastHarvest: null, weather: weatherFor(seed) };
}
export function plant(state, index, type) {
  if (!state || state.phase !== 'plant' || state.placements >= 2 || !Number.isInteger(index) || index < 0 || index >= 16 || state.board[index] !== null || !state.offers.includes(type) || !own(SEEDS, type)) return state;
  const board = cloneBoard(state.board); board[index] = { type, age: 0, plantedDay: state.day };
  const history = [...state.history, { board: cloneBoard(state.board), offers: [...state.offers], placements: state.placements }];
  return { ...state, board, history, placements: state.placements + 1, offers: offersFor(state.seed, state.day, state.placements + 1) };
}
export function undo(state) {
  if (!state || state.phase !== 'plant' || !state.history.length) return state;
  const previous = state.history.at(-1);
  return { ...state, board: cloneBoard(previous.board), offers: [...previous.offers], placements: previous.placements, history: state.history.slice(0, -1) };
}
export function forecast(state) {
  const upgrades = new Set(state.upgrades), weather = state.weather[state.day - 1];
  const kinds = new Set(state.board.filter(Boolean).map(tile => tile.type));
  const ecosystem = TYPES.every(type => kinds.has(type));
  const tiles = [];
  for (let index = 0; index < state.board.length; index++) {
    const tile = state.board[index]; if (!tile || tile.type === 'well') continue;
    const near = neighbors(index).map(i => state.board[i]).filter(Boolean), reasons = [];
    const add = (label, value, combo = false) => { if (value > 0) reasons.push({ label, value, combo }); };
    const ageBonus = Math.min(tile.age, 2);
    if (tile.type === 'sunflower') { add('기본', 3); add('성장', ageBonus); if (weather === 'sun') add('햇살', 3, true); if (upgrades.has('sun_pact')) add('햇살 약속', 2, true); }
    if (tile.type === 'clover') { add('기본', 2); add('성장', ageBonus); add('클로버 이웃', near.filter(p => p.type === 'clover').length * (upgrades.has('colony') ? 3 : 2), true); }
    if (tile.type === 'lavender') { add('기본', 2); add('성장', ageBonus); add('다양한 이웃', new Set(near.filter(p => own(SEEDS, p.type) && p.type !== 'hive' && p.type !== 'lavender').map(p => p.type)).size * (upgrades.has('diversity') ? 3 : 2), true); }
    if (tile.type === 'berry') { add('기본', 1); if (tile.age >= 2) add('달콤한 열매', upgrades.has('jam') ? 9 : 6, true); if (weather === 'rain') add('촉촉한 비', 3, true); }
    if (tile.type === 'mushroom') { add('기본', 2); if (near.some(p => p.type === 'well' || p.type === 'hive')) add('시원한 그늘', upgrades.has('shade') ? 7 : 4, true); if (weather === 'cloud') add('흐린 날', 3, true); }
    if (tile.type === 'hive') add('꽃과 꿀벌', near.filter(p => FLOWERS.has(p.type)).length * (upgrades.has('bees') ? 6 : 4), true);
    if (tile.type !== 'hive' && near.some(p => p.type === 'well')) add('우물', upgrades.has('spring') ? 4 : 2, true);
    if (upgrades.has('patience') && tile.age >= 3) add('오래된 정원', 2, true);
    if (upgrades.has('wild') && ecosystem && tile.type !== 'hive') add('작은 생태계', 2, true);
    tiles.push({ index, type: tile.type, value: reasons.reduce((sum, reason) => sum + reason.value, 0), reasons });
  }
  return { total: tiles.reduce((sum, tile) => sum + tile.value, 0), tiles, comboCount: tiles.filter(tile => tile.reasons.some(reason => reason.combo)).length };
}
function nextDay(state) { const day = state.day + 1; return { ...state, day, phase: 'plant', placements: 0, history: [], upgradeOffers: [], offers: offersFor(state.seed, day, 0) }; }
export function harvest(state) {
  if (!state || state.phase !== 'plant' || state.placements !== 2) return state;
  const result = { ...forecast(state), day: state.day, weather: state.weather[state.day - 1] };
  const board = state.board.map(tile => tile && tile.type !== 'well' ? { ...tile, age: Math.min(7, tile.age + 1) } : tile ? { ...tile } : null);
  const scored = { ...state, board, history: [], score: state.score + result.total, harvests: [...state.harvests, result], lastHarvest: result };
  if (state.day === RUN_DAYS) return { ...scored, phase: 'over', upgradeOffers: [] };
  if (state.day % 2 === 0) return { ...scored, phase: 'upgrade', upgradeOffers: upgradesFor(state.seed, state.day, state.upgrades) };
  return nextDay(scored);
}
export function chooseUpgrade(state, id) {
  if (!state || state.phase !== 'upgrade' || !state.upgradeOffers.includes(id) || state.upgrades.includes(id) || !own(UPGRADES, id)) return state;
  return nextDay({ ...state, upgrades: [...state.upgrades, id] });
}
function cleanBoard(board, day) {
  if (!Array.isArray(board) || board.length !== 16) return null;
  const clean = [];
  for (let i = 0; i < 16; i++) {
    const tile = board[i];
    if (i === WELL_INDEX) { if (!tile || tile.type !== 'well' || tile.age !== 0 || tile.plantedDay !== 0) return null; clean.push({ type: 'well', age: 0, plantedDay: 0 }); continue; }
    if (tile === null) { clean.push(null); continue; }
    if (!tile || !own(SEEDS, tile.type) || !Number.isInteger(tile.age) || tile.age < 0 || tile.age > 7 || !Number.isInteger(tile.plantedDay) || tile.plantedDay < 1 || tile.plantedDay > day) return null;
    clean.push({ type: tile.type, age: tile.age, plantedDay: tile.plantedDay });
  }
  return clean;
}
const validIds = (values, entries, count) => Array.isArray(values) && (count === undefined || values.length === count) && values.every(id => typeof id === 'string' && own(entries, id)) && new Set(values).size === values.length;
function validPlantingDays(board, day, placements) {
  for (let plantedDay = 1; plantedDay <= day; plantedDay++) {
    if (board.filter(tile => tile && tile.type !== 'well' && tile.plantedDay === plantedDay).length !== (plantedDay === day ? placements : 2)) return false;
  }
  return true;
}
function validPlacementTransition(previous, nextBoard, day) {
  let additions = 0;
  for (let i = 0; i < 16; i++) {
    const before = previous.board[i], after = nextBoard[i];
    if (before === null && after !== null) {
      if (after.age !== 0 || after.plantedDay !== day || !previous.offers.includes(after.type)) return false;
      additions++;
    } else if (JSON.stringify(before) !== JSON.stringify(after)) return false;
  }
  return additions === 1;
}
function cleanHarvest(result, day) {
  if (!result || result.day !== day || !own(WEATHER, result.weather) || !Number.isSafeInteger(result.total) || result.total < 0 || !Array.isArray(result.tiles) || result.tiles.length !== day * 2) return null;
  const tiles = [], indices = new Set();
  for (const tile of result.tiles) {
    if (!tile || !Number.isInteger(tile.index) || tile.index < 0 || tile.index > 15 || tile.index === WELL_INDEX || indices.has(tile.index) || !own(SEEDS, tile.type) || !Number.isSafeInteger(tile.value) || tile.value < 0 || !Array.isArray(tile.reasons) || tile.reasons.length > 8) return null;
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
    if (!input || input.version !== 1 || !Number.isSafeInteger(input.seed) || input.seed < 0 || !Number.isInteger(input.day) || input.day < 1 || input.day > RUN_DAYS || !['plant', 'upgrade', 'over'].includes(input.phase) || !Number.isInteger(input.placements) || input.placements < 0 || input.placements > 2 || !Number.isSafeInteger(input.score) || input.score < 0) return null;
    if ((input.phase === 'over' && (input.day !== RUN_DAYS || input.placements !== 2)) || (input.phase === 'upgrade' && (![2, 4, 6].includes(input.day) || input.placements !== 2))) return null;
    const board = cleanBoard(input.board, input.day); if (!board) return null;
    const finished = input.phase === 'plant' ? input.day - 1 : input.day;
    if (board.filter(tile => tile && tile.type !== 'well').length !== (input.day - 1) * 2 + input.placements) return null;
    if (!validPlantingDays(board, input.day, input.placements)) return null;
    if (board.some(tile => tile && tile.type !== 'well' && tile.age !== finished - tile.plantedDay + 1)) return null;
    if (!validIds(input.offers, SEEDS, 3) || JSON.stringify(input.offers) !== JSON.stringify(offersFor(input.seed, input.day, input.placements))) return null;
    const expectedUpgrades = input.phase === 'over' ? 3 : Math.floor((input.day - 1) / 2);
    if (!validIds(input.upgrades, UPGRADES, expectedUpgrades) || !validIds(input.upgradeOffers, UPGRADES, input.phase === 'upgrade' ? 3 : 0) || input.upgradeOffers.some(id => input.upgrades.includes(id))) return null;
    for (let i = 0; i < input.upgrades.length; i++) if (!upgradesFor(input.seed, (i + 1) * 2, input.upgrades.slice(0, i)).includes(input.upgrades[i])) return null;
    if (input.phase === 'upgrade' && JSON.stringify(input.upgradeOffers) !== JSON.stringify(upgradesFor(input.seed, input.day, input.upgrades))) return null;
    const weather = weatherFor(input.seed); if (JSON.stringify(input.weather) !== JSON.stringify(weather)) return null;
    if (!Array.isArray(input.harvests) || input.harvests.length !== finished) return null;
    const harvests = input.harvests.map((result, i) => cleanHarvest(result, i + 1));
    if (harvests.some((result, i) => !result || result.weather !== weather[i]) || harvests.reduce((sum, result) => sum + result.total, 0) !== input.score) return null;
    if (!Array.isArray(input.history) || input.history.length !== (input.phase === 'plant' ? input.placements : 0)) return null;
    const history = [];
    for (let i = 0; i < input.history.length; i++) {
      const previous = input.history[i], previousBoard = cleanBoard(previous?.board, input.day);
      if (!previousBoard || previous.placements !== i || !validIds(previous.offers, SEEDS, 3) || JSON.stringify(previous.offers) !== JSON.stringify(offersFor(input.seed, input.day, i)) || !validPlantingDays(previousBoard, input.day, i) || previousBoard.some(tile => tile && tile.type !== 'well' && tile.age !== finished - tile.plantedDay + 1)) return null;
      history.push({ board: previousBoard, offers: [...previous.offers], placements: i });
    }
    for (let i = 0; i < history.length; i++) if (!validPlacementTransition(history[i], history[i + 1]?.board || board, input.day)) return null;
    return { version: 1, seed: input.seed, day: input.day, phase: input.phase, board, offers: [...input.offers], placements: input.placements, score: input.score, upgrades: [...input.upgrades], upgradeOffers: [...input.upgradeOffers], history, harvests, lastHarvest: harvests.at(-1) || null, weather };
  } catch { return null; }
}
export function loadRun(storage) {
  let raw;
  try { raw = storage.getItem(STORAGE_KEY); } catch { return { state: null, available: false }; }
  try { return { state: raw ? sanitizeState(JSON.parse(raw)) : null, available: true }; }
  catch { return { state: null, available: true }; }
}
export function saveRun(storage, state) {
  try { const clean = sanitizeState(state); if (!clean) return false; storage.setItem(STORAGE_KEY, JSON.stringify(clean)); return true; }
  catch { return false; }
}
