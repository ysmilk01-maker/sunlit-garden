import { STAGES, SEEDS, newRun, stageFor, picksToday, plant, harvest, chooseUpgrade, sanitizeState, sanitizeCampaign } from './campaign-core.mjs';

export const FEATURE_KEY = 'sunlit-garden:features:v1';
export const STORAGE_KEY = FEATURE_KEY;
export const DECORATIONS = {
  stones: { id: 'stones', name: '조약돌 길', description: '정원 둘레에 아기자기한 조약돌을 놓아요. 점수에는 영향을 주지 않아요.', threshold: 4, icon: '🪨' },
  lantern: { id: 'lantern', name: '작은 정원등', description: '따뜻한 정원등으로 가장자리를 밝혀요. 점수에는 영향을 주지 않아요.', threshold: 12, icon: '🏮' },
  pond: { id: 'pond', name: '물빛 연못', description: '잔잔한 물빛으로 정원을 꾸며요. 점수에는 영향을 주지 않아요.', threshold: 24, icon: '💧' },
  fireflies: { id: 'fireflies', name: '반딧불 밤', description: '작은 반딧불이 정원 곁에서 빛나요. 점수에는 영향을 주지 않아요.', threshold: 40, icon: '✨' },
};
const MISSION_REWARD = 2;
const CLEAR_REWARD = 3;
const MISSION_DAYS = [2, 4, 6];
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const adjacent = (index, cols, rows) => [index - cols, index + cols, ...(index % cols ? [index - 1] : []), ...(index % cols < cols - 1 ? [index + 1] : [])].filter(i => i >= 0 && i < cols * rows);
const firstOfferCache = new Map();

// Reconstruct a day's first offer through public campaign actions. This avoids copying
// its private RNG and keeps the mission stable after harvest clears undo history.
function firstOffers(state, day) {
  if (day === state.day && state.history?.[0]?.offers) return state.history[0].offers;
  if (day === state.day && state.phase === 'plant' && state.placements === 0) return state.offers;
  const key = `${state.stageId}:${state.seed}:${day}`;
  if (firstOfferCache.has(key)) return firstOfferCache.get(key);
  let replay = newRun(state.seed, state.stageId);
  while (replay.day < day) {
    if (replay.phase === 'upgrade') { replay = chooseUpgrade(replay, replay.upgradeOffers[0]); continue; }
    while (replay.placements < picksToday(replay)) replay = plant(replay, replay.board.findIndex(tile => tile === null), replay.offers[0]);
    replay = harvest(replay);
  }
  const result = [...replay.offers];
  if (firstOfferCache.size >= 512) firstOfferCache.clear();
  firstOfferCache.set(key, result);
  return result;
}

export function missionFor(state, day = state?.day) {
  const stage = stageFor(state);
  if (!stage || !MISSION_DAYS.includes(day) || day > state.day || !Array.isArray(state.board) || state.board.length !== stage.cols * stage.rows) return null;
  const sameDayHistory = day === state.day ? state.history?.[0] : null;
  const startBoard = sameDayHistory?.board || state.board.map(tile => tile && tile.type !== 'well' && tile.plantedDay >= day ? null : tile);
  const todayBoard = state.board.map(tile => tile && tile.type !== 'well' && tile.plantedDay > day ? null : tile);
  const today = todayBoard.map((tile, index) => ({ tile, index })).filter(({ tile }) => tile && tile.type !== 'well' && tile.plantedDay === day && stage.pool.includes(tile.type));
  const mission = { id: `${stage.id}:${state.seed}:${day}`, day, reward: MISSION_REWARD, optional: true, required: 1, progress: 0, complete: false };
  if (day === 2) {
    const wellCells = adjacent(stage.wellIndex, stage.cols, stage.rows);
    if (wellCells.some(index => startBoard[index] === null)) {
      Object.assign(mission, { kind: 'well', title: '우물 곁에 한 자리', description: '오늘 새 식물 하나를 우물의 상하좌우에 심어 보세요. 기존 식물은 세지 않아요.' });
      mission.progress = Math.min(1, today.filter(({ index }) => wellCells.includes(index)).length);
    } else {
      const connectionPossible = startBoard.some((tile, index) => tile === null && adjacent(index, stage.cols, stage.rows).some(i => startBoard[i] === null || startBoard[i]?.type !== 'well'));
      if (connectionPossible) {
        Object.assign(mission, { kind: 'neighbor', title: '새로운 이웃', description: '오늘 새 식물 하나를 다른 식물의 상하좌우에 심어 보세요. 우물은 이웃 식물로 세지 않아요.' });
        mission.progress = Math.min(1, today.filter(({ index }) => adjacent(index, stage.cols, stage.rows).some(i => todayBoard[i] && todayBoard[i].type !== 'well')).length);
      } else {
        Object.assign(mission, { kind: 'variety', title: '둘이 다른 정원', description: '오늘 서로 다른 종류의 새 식물 두 개를 심어 보세요.', required: 2 });
        mission.progress = Math.min(2, new Set(today.map(({ tile }) => tile.type)).size);
      }
    }
  } else if (day === 4) {
    Object.assign(mission, { kind: 'variety', title: '오늘의 두 가지 향기', description: '오늘 서로 다른 종류를 두 가지 이상 새로 심어 보세요. 이전에 심은 식물은 세지 않아요.', required: 2 });
    mission.progress = Math.min(2, new Set(today.map(({ tile }) => tile.type)).size);
  } else {
    const targetType = firstOffers(state, day)[0];
    if (!stage.pool.includes(targetType)) return null;
    Object.assign(mission, { kind: 'type', targetType, title: `${SEEDS[targetType].name}에게 한 자리`, description: `오늘 새 ${SEEDS[targetType].name} 하나를 심어 보세요. 오늘의 첫 씨앗 제안에 있어요.` });
    mission.progress = Math.min(1, today.filter(({ tile }) => tile.type === targetType).length);
  }
  mission.complete = mission.progress >= mission.required;
  return mission;
}

export function newProfile() {
  return { version: 1, petals: 0, claimedMissions: [], claimedHarvests: [], clearedStages: [], stageStars: {}, selectedDecoration: null, options: { sound: false, haptics: true } };
}
export function sanitizeProfile(input) {
  try {
    if (!input || input.version !== 1 || !Number.isSafeInteger(input.petals) || input.petals < 0 || !Array.isArray(input.claimedMissions) || !Array.isArray(input.claimedHarvests) || !Array.isArray(input.clearedStages) || !input.stageStars || typeof input.stageStars !== 'object' || Array.isArray(input.stageStars) || !input.options || typeof input.options.sound !== 'boolean' || typeof input.options.haptics !== 'boolean') return null;
    if (input.claimedMissions.length > STAGES.length * MISSION_DAYS.length || input.claimedHarvests.length !== input.claimedMissions.length || input.clearedStages.length > STAGES.length || new Set(input.claimedMissions).size !== input.claimedMissions.length || new Set(input.claimedHarvests).size !== input.claimedHarvests.length || new Set(input.clearedStages).size !== input.clearedStages.length) return null;
    const missions = new Set();
    for (const id of input.claimedMissions) {
      if (typeof id !== 'string' || !/^([1-9][0-9]*):(2|4|6)$/.test(id)) return null;
      const [stageId] = id.split(':').map(Number); if (!stageFor(stageId)) return null; missions.add(id);
    }
    const receiptMissions = new Set();
    for (const id of input.claimedHarvests) {
      if (typeof id !== 'string' || !/^([1-9][0-9]*):(0|[1-9][0-9]*):(2|4|6)$/.test(id)) return null;
      const [stageId, seed, day] = id.split(':').map(Number), missionId = `${stageId}:${day}`;
      if (!stageFor(stageId) || !Number.isSafeInteger(seed) || !missions.has(missionId) || receiptMissions.has(missionId)) return null;
      receiptMissions.add(missionId);
    }
    if (input.clearedStages.some(id => !Number.isInteger(id) || !stageFor(id))) return null;
    const stageStars = {};
    for (const [id, stars] of Object.entries(input.stageStars)) {
      if (!/^[1-9][0-9]*$/.test(id) || !stageFor(Number(id)) || !Number.isInteger(stars) || stars < 1 || stars > 3 || !input.clearedStages.includes(Number(id))) return null;
      stageStars[id] = stars;
    }
    if (input.clearedStages.some(id => !own(stageStars, id)) || input.petals !== input.claimedMissions.length * MISSION_REWARD + input.clearedStages.length * CLEAR_REWARD) return null;
    if (input.selectedDecoration !== null && (!own(DECORATIONS, input.selectedDecoration) || DECORATIONS[input.selectedDecoration].threshold > input.petals)) return null;
    return { version: 1, petals: input.petals, claimedMissions: [...input.claimedMissions], claimedHarvests: [...input.claimedHarvests], clearedStages: [...input.clearedStages], stageStars, selectedDecoration: input.selectedDecoration, options: { sound: input.options.sound, haptics: input.options.haptics } };
  } catch { return null; }
}
export function starsFor(state) {
  const stage = stageFor(state); if (!stage || state.phase !== 'over' || !Number.isFinite(state.score)) return 0;
  if (state.score * 100 >= stage.target * 140) return 3;
  if (state.score * 100 >= stage.target * 115) return 2;
  return state.score >= stage.target ? 1 : 0;
}
export function claimHarvest(profile, state) {
  const clean = sanitizeProfile(profile), valid = sanitizeState(state);
  if (!clean || !valid || !valid.lastHarvest) return profile;
  const day = valid.lastHarvest.day, mission = missionFor(valid, day);
  if (!mission?.complete) return profile;
  const missionId = `${valid.stageId}:${day}`, receiptId = `${valid.stageId}:${valid.seed}:${day}`;
  // A stage/day may reward once in total, even if a replay uses another seed.
  if (clean.claimedMissions.includes(missionId) || clean.claimedHarvests.includes(receiptId)) return profile;
  return { ...clean, petals: clean.petals + MISSION_REWARD, claimedMissions: [...clean.claimedMissions, missionId], claimedHarvests: [...clean.claimedHarvests, receiptId] };
}
export function claimClear(profile, state) {
  const clean = sanitizeProfile(profile), valid = sanitizeState(state);
  if (!clean || !valid || valid.phase !== 'over') return profile;
  const stars = starsFor(valid); if (!stars) return profile;
  const firstClear = !clean.clearedStages.includes(valid.stageId), previousStars = clean.stageStars[valid.stageId] || 0;
  if (!firstClear && previousStars >= stars) return profile;
  return { ...clean, petals: clean.petals + (firstClear ? CLEAR_REWARD : 0), clearedStages: firstClear ? [...clean.clearedStages, valid.stageId] : clean.clearedStages, stageStars: { ...clean.stageStars, [valid.stageId]: Math.max(previousStars, stars) } };
}
export function reconcileCampaign(profile, campaign) {
  const clean = sanitizeProfile(profile), progress = sanitizeCampaign(campaign);
  if (!clean || !progress) return profile;
  let changed = false;
  for (const [id, result] of Object.entries(progress.stages)) {
    if (!result.cleared) continue;
    const stageId = Number(id), stars = starsFor({ stageId, phase: 'over', score: result.best });
    if (!stars) continue;
    if (!clean.clearedStages.includes(stageId)) {
      clean.clearedStages.push(stageId);
      clean.petals += CLEAR_REWARD;
      clean.stageStars[stageId] = stars;
      changed = true;
    } else if ((clean.stageStars[stageId] || 0) < stars) {
      clean.stageStars[stageId] = stars;
      changed = true;
    }
  }
  return changed ? clean : profile;
}
export function availableDecorations(profile) {
  const valid = sanitizeProfile(profile); return valid ? Object.values(DECORATIONS).filter(item => valid.petals >= item.threshold) : [];
}
export function selectDecoration(profile, id) {
  const valid = sanitizeProfile(profile);
  if (!valid || (id !== null && (!own(DECORATIONS, id) || valid.petals < DECORATIONS[id].threshold)) || valid.selectedDecoration === id) return profile;
  return { ...valid, selectedDecoration: id };
}
export function setOptions(profile, patch) {
  const valid = sanitizeProfile(profile); if (!valid || !patch || typeof patch !== 'object') return profile;
  const options = { ...valid.options };
  for (const key of ['sound', 'haptics']) if (own(patch, key) && typeof patch[key] === 'boolean') options[key] = patch[key];
  return equal(options, valid.options) ? profile : { ...valid, options };
}
export function summaryFor(profile, campaign) {
  const valid = sanitizeProfile(profile) || newProfile(), progress = sanitizeCampaign(campaign), collected = availableDecorations(valid);
  return { petals: valid.petals, cleared: progress ? Object.values(progress.stages).filter(stage => stage.cleared).length : valid.clearedStages.length, collected: collected.length, stars: Object.values(valid.stageStars).reduce((sum, value) => sum + value, 0), unlockedStage: progress?.unlocked || 1, totalStages: STAGES.length, nextDecoration: Object.values(DECORATIONS).find(item => item.threshold > valid.petals) || null, selectedDecoration: valid.selectedDecoration, title: '나의 작은 정원' };
}
export function loadProfile(storage) {
  let raw; try { raw = storage.getItem(FEATURE_KEY); } catch { return { profile: newProfile(), available: false }; }
  try { return { profile: raw ? sanitizeProfile(JSON.parse(raw)) || newProfile() : newProfile(), available: true }; }
  catch { return { profile: newProfile(), available: true }; }
}
export function saveProfile(storage, profile) {
  try { const valid = sanitizeProfile(profile); if (!valid) return false; storage.setItem(FEATURE_KEY, JSON.stringify(valid)); return true; }
  catch { return false; }
}
