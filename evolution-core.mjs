import * as base from './campaign-core.mjs';
import * as legacy from './evolution-legacy-v5.mjs';

// Versions 2–5 retain their original rules; only new v6 runs gain a third tier.
export * from './campaign-core.mjs';

export const EVOLUTION_DAYS = Object.freeze([1, 3, 5]);
export const EVOLUTIONS = Object.freeze({
  twin: { id: 'twin', type: 'sunflower', name: '쌍둥이 해바라기', icon: '🌻', short: '매일 나를 한 번 더 수확', description: '다음 날부터 매 수확 때 이 해바라기를 한 번 더 수확해요.' },
  solar: { id: 'solar', type: 'sunflower', name: '태양꽃', icon: '☀️', short: '하루 충전 → 나와 이웃 추가 수확', description: '진화 후 첫 수확은 이 꽃의 점수가 0이에요. 다음 수확에는 자신과 상하좌우 식물을 한 번씩 더 수확해요. 충전과 발산을 번갈아 반복해요. 우물·벌집은 이웃 대상에서 제외해요.' },
  meadow: { id: 'meadow', type: 'clover', name: '작은 초원', icon: '☘️', short: '다른 이웃 종류마다 나에게 +3', description: '상하좌우에서 클로버와 다른 식물의 종류마다 자신에게 +3점. 같은 종류 이웃은 한 종류로 세며 우물·벌집은 제외해요.' },
  lucky: { id: 'lucky', type: 'clover', name: '행운잎', icon: '🍀', short: '가장 값진 이웃 한 번 더 수확', description: '상하좌우 식물 중 진화 효과를 제외한 오늘 수확 점수가 가장 큰 한 송이를 한 번 더 수확해요. 동점이면 위쪽 칸, 같은 행이면 왼쪽 칸이 먼저예요. 우물·벌집은 제외해요.' },
  cluster: { id: 'cluster', type: 'berry', name: '송이열매', icon: '🫐', short: '익은 열매를 한 번 더 수확', description: '이 베리를 심은 뒤 세 번째 수확부터 매번 자신을 한 번 더 수확해요.' },
  jam: { id: 'jam', type: 'berry', name: '나눔잼', icon: '🍯', short: '익으면 다른 이웃에게 각각 +3', description: '이 베리를 심은 뒤 세 번째 수확부터 상하좌우의 베리 아닌 식물에게 각각 +3점. 우물·벌집은 제외해요.' },
  chorus: { id: 'chorus', type: 'lavender', name: '보랏빛 합창', icon: '🎶', short: '같은 가로행 라벤더마다 나에게 +4', description: '같은 가로행의 다른 라벤더마다 자신에게 +4점, 최대 세 송이까지 세요. 붙어 있지 않아도 돼요.' },
  perfume: { id: 'perfume', type: 'lavender', name: '향기바람', icon: '🌬️', short: '다른 이웃 종류마다 나에게 +3', description: '상하좌우에서 라벤더와 다른 식물의 종류마다 자신에게 +3점. 같은 종류 이웃은 한 종류로 세며 우물·벌집은 제외해요.' },
  colony: { id: 'colony', type: 'mushroom', name: '포자둥지', icon: '🍄', short: '빈 이웃 칸마다 나에게 +4', description: '상하좌우의 빈칸마다 자신에게 +4점. 정원 밖은 세지 않아요. 주변을 비워 두면 더 자라요.' },
  moon: { id: 'moon', type: 'mushroom', name: '달빛버섯', icon: '🌙', short: '흐린 날 추가 수확 · 다른 날 +2', description: '흐린 날에는 자신을 한 번 더 수확해요. 맑거나 비 오는 날에는 자신에게 +2점.' },
  swarm: { id: 'swarm', type: 'hive', name: '꿀벌무리', icon: '🐝', short: '이웃 꽃에게 각각 +3', description: '상하좌우의 꽃마다 그 꽃에게 +3점. 꽃이 여럿이면 각각 받아요.' },
  royal: { id: 'royal', type: 'hive', name: '여왕의 벌집', icon: '👑', short: '꽃 이웃이 하나면 두 번 더 수확', description: '상하좌우의 꽃이 정확히 한 송이일 때 그 꽃을 두 번 더 수확해요. 꽃이 둘 이상이면 추가 수확이 없어요.' },
});

// A third tier strengthens the chosen branch. It does not choose a new branch,
// restart an ability's clock, or repeat another evolution's extra harvest.
export const MASTER_EVOLUTIONS = Object.freeze({
  twin: { ...EVOLUTIONS.twin, tier: 3, name: '세쌍둥이 해바라기', short: '매일 나를 두 번 더 수확', description: '다음 날부터 매 수확 때 이 해바라기를 두 번 더 수확해요. 다른 진화로 더한 점수는 반복하지 않아요.' },
  solar: { ...EVOLUTIONS.solar, tier: 3, name: '찬란한 태양꽃', short: '충전 주기 유지 · 발산 때 두 번 더', description: '기존 충전·발산 순서를 그대로 이어가요. 충전 수확은 이 꽃의 점수가 0이고, 발산 수확은 자신과 상하좌우 식물을 두 번씩 더 수확해요. 우물·벌집은 이웃 대상에서 제외해요.' },
  meadow: { ...EVOLUTIONS.meadow, tier: 3, name: '풍성한 초원', short: '다른 이웃 종류마다 나에게 +5', description: '상하좌우에서 클로버와 다른 식물의 종류마다 자신에게 +5점. 같은 종류는 한 번만 세며 우물·벌집은 제외해요.' },
  lucky: { ...EVOLUTIONS.lucky, tier: 3, name: '황금 행운잎', short: '가장 값진 이웃 두 번 더 수확', description: '상하좌우 식물 중 진화 효과를 제외한 오늘 수확 점수가 가장 큰 한 송이를 두 번 더 수확해요. 동점은 위쪽, 같은 행은 왼쪽이 먼저예요. 우물·벌집은 제외해요.' },
  cluster: { ...EVOLUTIONS.cluster, tier: 3, name: '풍년 송이열매', short: '익은 열매를 두 번 더 수확', description: '이 베리를 심은 뒤 세 번째 수확부터 매번 자신을 두 번 더 수확해요.' },
  jam: { ...EVOLUTIONS.jam, tier: 3, name: '풍성한 나눔잼', short: '익으면 다른 이웃에게 각각 +5', description: '이 베리를 심은 뒤 세 번째 수확부터 상하좌우의 베리 아닌 식물에게 각각 +5점. 우물·벌집은 제외해요.' },
  chorus: { ...EVOLUTIONS.chorus, tier: 3, name: '보랏빛 대합창', short: '같은 가로행 라벤더마다 나에게 +6', description: '같은 가로행의 다른 라벤더마다 자신에게 +6점, 최대 세 송이까지 세요. 붙어 있지 않아도 돼요.' },
  perfume: { ...EVOLUTIONS.perfume, tier: 3, name: '향기 정원', short: '다른 이웃 종류마다 나에게 +5', description: '상하좌우에서 라벤더와 다른 식물의 종류마다 자신에게 +5점. 같은 종류는 한 번만 세며 우물·벌집은 제외해요.' },
  colony: { ...EVOLUTIONS.colony, tier: 3, name: '포자 왕국', short: '빈 이웃 칸마다 나에게 +6', description: '상하좌우의 빈칸마다 자신에게 +6점. 정원 밖은 세지 않아요. 주변을 비워 둘수록 유리해요.' },
  moon: { ...EVOLUTIONS.moon, tier: 3, name: '보름달 버섯', short: '흐린 날 두 번 더 · 다른 날 +4', description: '흐린 날에는 자신을 두 번 더 수확해요. 맑거나 비 오는 날에는 자신에게 +4점.' },
  swarm: { ...EVOLUTIONS.swarm, tier: 3, name: '꿀벌 축제', short: '이웃 꽃에게 각각 +5', description: '상하좌우의 꽃마다 그 꽃에게 +5점. 꽃이 여럿이면 각각 받아요.' },
  royal: { ...EVOLUTIONS.royal, tier: 3, name: '여왕의 궁전', short: '꽃 이웃이 하나면 세 번 더 수확', description: '상하좌우의 꽃이 정확히 한 송이일 때 그 꽃을 세 번 더 수확해요. 꽃이 둘 이상이면 추가 수확이 없어요.' },
});

const FLOWERS = new Set(['sunflower', 'clover', 'lavender', 'tulip', 'rose', 'lotus', 'daisy', 'bluebell', 'hydrangea', 'orchid', 'cherry']);
const TYPES = new Set(Object.values(EVOLUTIONS).map(choice => choice.type));
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const copy = value => JSON.parse(JSON.stringify(value));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const isV6 = state => state?.version === 6;
const asBase = state => ({ ...state, version: 4 });
const isPlant = tile => !!tile && own(base.SEEDS, tile.type) && tile.type !== 'hive';
const near = (index, cols, rows) => [index - cols, index + cols, ...(index % cols ? [index - 1] : []), ...(index % cols < cols - 1 ? [index + 1] : [])].filter(i => i >= 0 && i < cols * rows);
const log = (state, next, action) => ({ ...next, version: 6, ledger: [...state.ledger, action] });

export function evolutionTier(tile) {
  if (!tile || tile.type === 'well') return 0;
  const definition = tile.evolution && EVOLUTIONS[tile.evolution.id];
  if (!definition || definition.type !== tile.type) return 1;
  return tile.evolution.tier === 3 ? 3 : 2;
}

export function evolutionDetails(tile) {
  const tier = evolutionTier(tile);
  if (tier < 2) return null;
  const id = tile.evolution.id;
  return tier === 3 ? MASTER_EVOLUTIONS[id] : { ...EVOLUTIONS[id], tier: 2 };
}

export function newRun(seed, stageId = 1) {
  return { ...base.newRun(seed, stageId), version: 6, ledger: [], evolutionNextOffers: [] };
}

export function plant(state, index, type) {
  if (!isV6(state)) return legacy.plant(state, index, type);
  const source = asBase(state), next = base.plant(source, index, type);
  return next === source ? state : log(state, next, { kind: 'plant', index, type });
}

export function undo(state) {
  if (!isV6(state)) return legacy.undo(state);
  if (state.ledger.at(-1)?.kind !== 'plant') return state;
  const source = asBase(state), next = base.undo(source);
  return next === source ? state : { ...next, version: 6, ledger: state.ledger.slice(0, -1) };
}

function candidateIndices(state) {
  return state.board.flatMap((tile, index) => tile && TYPES.has(tile.type) && evolutionTier(tile) < 3 ? [index] : []);
}

export function evolvableTiles(state) {
  if (!isV6(state)) return legacy.evolvableTiles(state);
  return state.phase === 'evolve' ? candidateIndices(state) : [];
}

export function evolutionChoices(state, index) {
  if (!isV6(state)) return legacy.evolutionChoices(state, index);
  if (!Number.isInteger(index) || !evolvableTiles(state).includes(index)) return [];
  const tile = state.board[index];
  if (evolutionTier(tile) === 2) return [MASTER_EVOLUTIONS[tile.evolution.id]];
  return Object.values(EVOLUTIONS).filter(choice => choice.type === tile.type).map(choice => ({ ...choice, tier: 2 }));
}

function afterEvolution(state) {
  return {
    ...state, day: state.day + 1, phase: 'plant', placements: 0, history: [],
    offers: [...state.evolutionNextOffers], evolutionNextOffers: [], upgradeOffers: [],
  };
}

export function evolve(state, index, id) {
  if (!isV6(state)) return legacy.evolve(state, index, id);
  if (!evolutionChoices(state, index).some(choice => choice.id === id)) return state;
  const board = state.board.map((tile, position) => position === index
    ? { ...tile, evolution: tile.evolution ? { ...tile.evolution, tier: 3 } : { id, day: state.day, tier: 2 } }
    : tile ? { ...tile } : null);
  return log(state, afterEvolution({ ...state, board }), { kind: 'evolve', index, id });
}

export function forecast(state) {
  if (!isV6(state)) return legacy.forecast(state);
  const original = base.forecast(asBase(state));
  const tiles = original.tiles.map(tile => ({ ...tile, reasons: tile.reasons.map(reason => ({ ...reason })) }));
  const values = new Map(original.tiles.map(tile => [tile.index, tile.value]));
  const byIndex = new Map(tiles.map(tile => [tile.index, tile]));
  const active = state.board.flatMap((tile, index) => {
    const choice = tile?.evolution && EVOLUTIONS[tile.evolution.id];
    return choice && choice.type === tile.type && tile.evolution.day < state.day
      ? [{ index, tile, id: choice.id, tier: evolutionTier(tile), elapsed: state.day - tile.evolution.day }] : [];
  });
  const resting = new Set(active.filter(item => item.id === 'solar' && item.elapsed % 2 === 1).map(item => item.index));
  const evolutionEffects = [];
  for (const index of resting) {
    const tile = byIndex.get(index);
    const details = evolutionDetails(state.board[index]);
    evolutionEffects.push({ source: index, target: index, index, id: 'solar', tier: details.tier, kind: 'rest', label: `${details.name} · 충전`, value: -tile.value });
    tile.value = 0; tile.reasons = [];
  }
  function add(source, target, id, amount, copies = 0) {
    if (!(amount > 0) || resting.has(target) || !byIndex.has(target)) return;
    const details = evolutionDetails(state.board[source]);
    const label = `${details.name} · ${copies ? '추가 수확' : '진화 보너스'}`;
    const tile = byIndex.get(target);
    tile.value += amount;
    tile.reasons.push({ label, value: amount, combo: true });
    evolutionEffects.push({ source, target, index: target, id, tier: details.tier, kind: copies ? 'extra' : 'bonus', label, value: amount, ...(copies ? { copies } : {}) });
  }
  const extra = (source, target, id, copies = 1) => add(source, target, id, (values.get(target) || 0) * copies, copies);
  for (const { index, tile, id, tier, elapsed } of active) {
    const master = tier === 3, copies = master ? 2 : 1;
    const adjacent = near(index, state.cols, state.rows);
    const others = adjacent.filter(i => isPlant(state.board[i]) && state.board[i].type !== tile.type);
    if (id === 'twin') extra(index, index, id, copies);
    if (id === 'solar' && elapsed % 2 === 0) {
      extra(index, index, id, copies);
      for (const target of adjacent.filter(i => isPlant(state.board[i]))) extra(index, target, id, copies);
    }
    if (id === 'meadow' || id === 'perfume') add(index, index, id, new Set(others.map(i => state.board[i].type)).size * (master ? 5 : 3));
    if (id === 'lucky') {
      const targets = adjacent.filter(i => isPlant(state.board[i])).sort((a, b) => (values.get(b) || 0) - (values.get(a) || 0) || a - b);
      if (targets.length) extra(index, targets[0], id, copies);
    }
    if (id === 'cluster' && tile.age >= 2) extra(index, index, id, copies);
    if (id === 'jam' && tile.age >= 2) for (const target of others) add(index, target, id, master ? 5 : 3);
    if (id === 'chorus') {
      const row = Math.floor(index / state.cols);
      const count = state.board.filter((other, position) => position !== index && Math.floor(position / state.cols) === row && other?.type === 'lavender').length;
      add(index, index, id, Math.min(3, count) * (master ? 6 : 4));
    }
    if (id === 'colony') add(index, index, id, adjacent.filter(i => state.board[i] === null).length * (master ? 6 : 4));
    if (id === 'moon') {
      if (state.weather[state.day - 1] === 'cloud') extra(index, index, id, copies);
      else add(index, index, id, master ? 4 : 2);
    }
    if (id === 'swarm' || id === 'royal') {
      const flowers = adjacent.filter(i => FLOWERS.has(state.board[i]?.type));
      if (id === 'swarm') for (const target of flowers) add(index, target, id, master ? 5 : 3);
      else if (flowers.length === 1) extra(index, flowers[0], id, master ? 3 : 2);
    }
  }
  return {
    total: tiles.reduce((sum, tile) => sum + tile.value, 0), tiles,
    comboCount: tiles.filter(tile => tile.reasons.some(reason => reason.combo)).length,
    evolutionEffects,
  };
}

export function harvest(state) {
  if (!isV6(state)) return legacy.harvest(state);
  const source = asBase(state), next = base.harvest(source);
  if (next === source) return state;
  const result = { ...forecast(state), day: state.day, weather: state.weather[state.day - 1] };
  let scored = {
    ...next, version: 6, score: state.score + result.total,
    harvests: [...state.harvests, result], lastHarvest: result,
  };
  if (EVOLUTION_DAYS.includes(state.day) && candidateIndices(scored).length) {
    scored = {
      ...scored, day: state.day, phase: 'evolve', placements: state.placements,
      offers: [...state.offers], evolutionNextOffers: [...next.offers],
    };
  }
  return log(state, scored, { kind: 'harvest' });
}

export function chooseUpgrade(state, id) {
  if (!isV6(state)) return legacy.chooseUpgrade(state, id);
  const source = asBase(state), next = base.chooseUpgrade(source, id);
  return next === source ? state : log(state, next, { kind: 'upgrade', id });
}

export function rerollsRemaining(state) {
  return isV6(state) ? base.rerollsRemaining(asBase(state)) : legacy.rerollsRemaining(state);
}

export function rerollUpgrades(state) {
  if (!isV6(state)) return legacy.rerollUpgrades(state);
  const source = asBase(state), next = base.rerollUpgrades(source);
  return next === source ? state : log(state, next, { kind: 'reroll' });
}

export function previewEvolution(state, index, id) {
  if (!isV6(state)) return legacy.previewEvolution(state, index, id);
  const evolved = evolve(state, index, id);
  if (evolved === state) return null;
  const unchanged = afterEvolution(state);
  const following = value => ({
    ...value, day: value.day + 1,
    board: value.board.map(tile => tile && tile.type !== 'well' ? { ...tile, age: Math.min(7, tile.age + 1) } : tile ? { ...tile } : null),
  });
  const nextTotal = forecast(evolved).total, nextBaseline = forecast(unchanged).total;
  const followingTotal = forecast(following(evolved)).total, followingBaseline = forecast(following(unchanged)).total;
  return {
    nextTotal, followingTotal, nextDelta: nextTotal - nextBaseline, followingDelta: followingTotal - followingBaseline,
    nextDay: evolved.day, followingDay: evolved.day + 1,
  };
}

function actionMatches(action, keys) {
  return action && typeof action === 'object' && !Array.isArray(action)
    && same(Object.keys(action).sort(), keys.sort());
}

export function sanitizeState(input) {
  if (!isV6(input)) return legacy.sanitizeState(input);
  try {
    if (!base.isStageId(input.stageId) || !Number.isSafeInteger(input.seed) || input.seed < 0
      || !Array.isArray(input.ledger) || input.ledger.length > 64) return null;
    let replay = newRun(input.seed, input.stageId);
    for (const action of input.ledger) {
      let next = replay;
      if (action?.kind === 'plant' && actionMatches(action, ['kind', 'index', 'type'])) next = plant(replay, action.index, action.type);
      if (action?.kind === 'harvest' && actionMatches(action, ['kind'])) next = harvest(replay);
      if (action?.kind === 'upgrade' && actionMatches(action, ['kind', 'id'])) next = chooseUpgrade(replay, action.id);
      if (action?.kind === 'reroll' && actionMatches(action, ['kind'])) next = rerollUpgrades(replay);
      if (action?.kind === 'evolve' && actionMatches(action, ['kind', 'index', 'id'])) next = evolve(replay, action.index, action.id);
      if (next === replay) return null;
      replay = next;
    }
    // Replaying rejects forged tile abilities, double harvests, stale undo boards,
    // altered offers, receipts, counters and future/duplicate evolution choices.
    return same(input, replay) ? replay : null;
  } catch { return null; }
}

function loadJSON(storage, key, sanitize, fallback) {
  let raw;
  try { raw = storage.getItem(key); } catch { return { value: fallback(), available: false }; }
  try { return { value: raw ? sanitize(JSON.parse(raw)) ?? fallback() : fallback(), available: true }; }
  catch { return { value: fallback(), available: true }; }
}

export function loadRun(storage) {
  const loaded = loadJSON(storage, base.STORAGE_KEY, sanitizeState, () => null);
  return { state: loaded.value, available: loaded.available };
}

export function saveRun(storage, state) {
  try {
    const clean = sanitizeState(state);
    if (!clean) return false;
    storage.setItem(base.STORAGE_KEY, JSON.stringify(clean));
    return true;
  } catch { return false; }
}

const starsAtTarget = (score, target) => BigInt(score) * 100n >= BigInt(target) * 140n ? 3
  : BigInt(score) * 100n >= BigInt(target) * 115n ? 2 : score >= target ? 1 : 0;

export function sanitizeCampaign(input) {
  try {
    if (!input || input.version !== 1 || !base.isStageId(input.unlocked) || !input.stages
      || typeof input.stages !== 'object' || Array.isArray(input.stages)) return null;
    const stages = {};
    for (const [key, value] of Object.entries(input.stages)) {
      const id = Number(key);
      if (!base.isStageId(id) || String(id) !== key || !value || !Number.isSafeInteger(value.best) || value.best < 0
        || typeof value.cleared !== 'boolean' || !Number.isSafeInteger(value.attempts) || value.attempts < 1
        || !Array.isArray(value.runIds) || value.runIds.length !== value.attempts || new Set(value.runIds).size !== value.runIds.length) return null;
      if (value.runIds.some(runId => typeof runId !== 'string' || !new RegExp(`^${id}:(0|[1-9][0-9]*)(:v[3456])?$`).test(runId)
        || !Number.isSafeInteger(Number(runId.split(':')[1]))) || !value.runIds.includes(value.lastRunId)) return null;
      const oldTarget = id <= 100 ? base.stageFor({ version: 2, stageId: id }).target : null;
      const v8Target = id <= 100 ? base.stageFor({ version: 3, stageId: id }).target : null;
      const hasLegacyRuns = value.runIds.some(runId => runId.split(':').length === 2);
      const hasV8Runs = value.runIds.some(runId => runId.endsWith(':v3'));
      const hasNewRuns = value.runIds.some(runId => /:v[456]$/.test(runId));
      if (id > 100 && (hasLegacyRuns || hasV8Runs)) return null;
      let targetAtClear = value.targetAtClear, earnedStars = value.earnedStars;
      if (!own(value, 'targetAtClear') && !own(value, 'earnedStars')) {
        if (hasNewRuns || hasV8Runs || value.cleared !== (value.best >= oldTarget)) return null;
        targetAtClear = value.cleared ? oldTarget : null;
        earnedStars = starsAtTarget(value.best, oldTarget);
      }
      if (!Number.isInteger(earnedStars) || earnedStars < 0 || earnedStars > 3) return null;
      if (id > 100) {
        const ceiling = base.endlessTargetCeiling(id);
        if (value.cleared) {
          if (!Number.isSafeInteger(targetAtClear) || targetAtClear < 5 || targetAtClear % 5 || targetAtClear > ceiling
            || value.best < targetAtClear || earnedStars !== starsAtTarget(value.best, targetAtClear)) return null;
        } else if (targetAtClear !== null || earnedStars !== 0 || value.best >= ceiling) return null;
      } else {
        const possibleTargets = [...(hasLegacyRuns ? [oldTarget] : []), ...(hasV8Runs ? [v8Target] : []), ...(hasNewRuns ? [base.STAGES[id - 1].target] : [])];
        if (value.cleared) {
          if (!possibleTargets.includes(targetAtClear) || value.best < targetAtClear || earnedStars < 1
            || earnedStars > starsAtTarget(value.best, Math.min(...possibleTargets))) return null;
        } else if (targetAtClear !== null || earnedStars !== 0 || value.best >= Math.max(...possibleTargets)) return null;
      }
      stages[key] = { best: value.best, cleared: value.cleared, attempts: value.attempts, lastRunId: value.lastRunId, runIds: [...value.runIds], targetAtClear, earnedStars };
    }
    let unlocked = 1;
    while (unlocked < base.MAX_STAGE_ID && stages[unlocked]?.cleared) unlocked++;
    const oldCompletion = input.unlocked === 100 && unlocked === 101 && Object.keys(stages).every(id => Number(id) <= 100);
    if ((unlocked !== input.unlocked && !oldCompletion) || Object.keys(stages).some(id => Number(id) > unlocked)) return null;
    return { version: 1, unlocked, stages };
  } catch { return null; }
}

export function canPlay(campaign, id) {
  const clean = sanitizeCampaign(campaign);
  return base.isStageId(id) && !!clean && id <= clean.unlocked;
}

export function recordResult(campaign, state) {
  const clean = sanitizeState(state), progress = sanitizeCampaign(campaign);
  if (!clean || clean.phase !== 'over' || !progress || !base.isStageId(clean.stageId) || clean.stageId > progress.unlocked) return campaign;
  const stage = base.stageFor(clean), previous = progress.stages[stage.id];
  const runId = `${stage.id}:${clean.seed}${clean.version >= 3 ? `:v${clean.version}` : ''}`;
  const runIds = previous?.runIds.includes(runId) ? [...previous.runIds] : [...(previous?.runIds || []), runId];
  const best = Math.max(previous?.best || 0, clean.score), cleared = !!previous?.cleared || clean.score >= stage.target;
  const targetAtClear = previous?.targetAtClear ?? (clean.score >= stage.target ? stage.target : null);
  const earnedStars = Math.max(previous?.earnedStars || 0, starsAtTarget(clean.score, stage.target));
  const result = { best, cleared, attempts: runIds.length, lastRunId: runId, runIds, targetAtClear, earnedStars };
  if (same(previous, result) && progress.unlocked === campaign.unlocked) return campaign;
  return {
    version: 1,
    unlocked: cleared ? Math.max(progress.unlocked, stage.id < base.MAX_STAGE_ID ? stage.id + 1 : base.MAX_STAGE_ID) : progress.unlocked,
    stages: { ...progress.stages, [stage.id]: result },
  };
}

export function loadCampaign(storage) {
  const loaded = loadJSON(storage, base.CAMPAIGN_STORAGE_KEY, sanitizeCampaign, base.newCampaign);
  return { campaign: loaded.value, available: loaded.available };
}

export function saveCampaign(storage, campaign) {
  try {
    const clean = sanitizeCampaign(campaign);
    if (!clean) return false;
    storage.setItem(base.CAMPAIGN_STORAGE_KEY, JSON.stringify(clean));
    return true;
  } catch { return false; }
}
