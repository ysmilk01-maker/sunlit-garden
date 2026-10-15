import * as core from './evolution-core.mjs?v=20261015-20';
import { explainSeedPlacement } from './seed-explainer.mjs?v=20261015-20';

/**
 * Forecast-only influence for the planting phase, versions 2–6.
 * No actions are committed, no storage is accessed, and caller objects are never
 * changed. These shape checks are not a replacement for core.sanitizeState when
 * loading a save; UI callers provide the already-loaded current game state.
 *
 * Both APIs return null for unsupported/malformed input or non-plant phases.
 * In particular, past lastHarvest values are never mixed with today's forecast.
 * A well cannot be a source: lotus uses the fixed wellIndex even if its board
 * tile is removed, so removing that tile alone would understate its influence.
 *
 * Result:
 * {mode:'placement'|'existing',day,weather,
 *  source:{index,type,name,value,reasons},ownScore,neighborDelta,totalDelta,
 *  positiveDelta,negativeDelta,beforeTotal,afterTotal,targets,assumption}
 * targets: [{index,type,name,before,after,delta,relation,reasons}].
 * Reasons are {label,before,after,delta}, aggregated by the engine's exact label.
 * A net-zero target remains present when positive/negative reasons cancel out.
 * Indices are zero-based row-major; type is the base seed ID; name includes the
 * current evolution name when applicable. No names are inferred from positions.
 *
 * relation is geometry only: adjacent (orthogonal, never wrapped), otherwise row,
 * otherwise column, otherwise global (elsewhere). It is NOT a causal category:
 * an adjacent tile can change through a global upgrade, or through several
 * effects at once. Explain causality using reasons, not relation.
 *
 * neighborDelta includes ALL other changed tiles, not just adjacent ones.
 * positiveDelta/negativeDelta sum each other tile's net delta, not reason totals.
 * totalDelta === ownScore + neighborDelta === afterTotal - beforeTotal.
 * For 'existing', before is the hypothetical garden WITHOUT the selected plant;
 * after is the actual garden. Thus negative targets mean its presence costs that
 * tile points (e.g. closing a mushroom gap or disabling a royal hive's bonus).
 * This counterfactual is a marginal comparison, not a removal feature or additive
 * ownership of points: do not add influence totals from multiple selected plants.
 */

const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const versions = new Set([2, 3, 4, 5, 6]);
const weatherIds = new Set(['sun', 'rain', 'cloud']);
const entriesFor = state => state.version === 2 ? core.LEGACY_SEEDS : state.version === 3 ? core.V8_SEEDS : core.SEEDS;
const upgradesFor = state => state.version === 2 ? core.LEGACY_UPGRADES : state.version === 3 ? core.V8_UPGRADES : core.UPGRADES;
const validIndex = (state, index) => Number.isInteger(index) && index >= 0 && index < state.board.length;

function validState(state) {
  if (!state || !versions.has(state.version) || state.phase !== 'plant'
    || !Number.isInteger(state.day) || state.day < 1 || state.day > core.RUN_DAYS
    || !Array.isArray(state.board) || !Array.isArray(state.offers)
    || !Array.isArray(state.upgrades) || !Array.isArray(state.weather)
    || state.weather.length !== core.RUN_DAYS || !state.weather.every(id => weatherIds.has(id))) return false;
  const stage = core.stageFor(state);
  if (!stage || state.cols !== stage.cols || state.rows !== stage.rows
    || state.wellIndex !== stage.wellIndex || state.board.length !== state.cols * state.rows
    || !state.offers.every(type => stage.pool.includes(type))
    || !state.upgrades.every(id => typeof id === 'string' && own(upgradesFor(state), id))) return false;
  const entries = entriesFor(state);
  return state.board.every((tile, index) => {
    if (index === state.wellIndex) return tile?.type === 'well';
    if (tile === null) return true;
    if (!tile || typeof tile.type !== 'string' || !own(entries, tile.type) || !stage.pool.includes(tile.type)
      || !Number.isInteger(tile.age) || tile.age < 0 || tile.age > 7
      || !Number.isInteger(tile.plantedDay) || tile.plantedDay < 1 || tile.plantedDay > state.day) return false;
    if (!tile.evolution) return true;
    const evolution = tile.evolution, details = core.EVOLUTIONS[evolution.id];
    return state.version >= 5 && details?.type === tile.type
      && Number.isInteger(evolution.day) && evolution.day >= 1 && evolution.day < state.day
      && (state.version === 5 ? evolution.tier === undefined : [2, 3].includes(evolution.tier));
  });
}

function nameFor(state, tile) {
  return core.evolutionDetails(tile)?.name || entriesFor(state)[tile.type].name;
}

function relation(source, target, cols) {
  const sr = Math.floor(source / cols), tr = Math.floor(target / cols), sc = source % cols, tc = target % cols;
  if (Math.abs(sr - tr) + Math.abs(sc - tc) === 1) return 'adjacent';
  if (sr === tr) return 'row';
  if (sc === tc) return 'column';
  return 'global';
}

function reasonChanges(before = [], after = []) {
  const aggregate = reasons => {
    const result = new Map();
    for (const reason of reasons) result.set(reason.label, (result.get(reason.label) || 0) + reason.value);
    return result;
  };
  const previous = aggregate(before), next = aggregate(after);
  return [...new Set([...previous.keys(), ...next.keys()])].flatMap(label => {
    const a = previous.get(label) || 0, b = next.get(label) || 0;
    return a === b ? [] : [{ label, before: a, after: b, delta: b - a }];
  });
}

function targetFor(state, sourceIndex, change) {
  return {
    index: change.index, type: change.type, name: nameFor(state, state.board[change.index]),
    before: change.before, after: change.after, delta: change.delta,
    relation: relation(sourceIndex, change.index, state.cols),
    reasons: change.reasons.map(reason => ({ ...reason })),
  };
}

function resultFor(state, mode, index, tile, value, reasons, beforeTotal, afterTotal, targets) {
  const neighborDelta = targets.reduce((sum, target) => sum + target.delta, 0);
  const totalDelta = afterTotal - beforeTotal;
  // Fail closed if an engine contract ever changes instead of showing inconsistent
  // self/other totals. In particular do not round, clamp, or hide negative values.
  const finiteInteger = amount => Number.isSafeInteger(amount);
  if (![value, neighborDelta, totalDelta, beforeTotal, afterTotal].every(finiteInteger)
    || totalDelta !== value + neighborDelta
    || reasons.reduce((sum, reason) => sum + reason.value, 0) !== value
    || targets.some(target => ![target.before, target.after, target.delta].every(finiteInteger)
      || target.after - target.before !== target.delta
      || target.reasons.reduce((sum, reason) => sum + reason.delta, 0) !== target.delta)) return null;
  return {
    mode, day: state.day, weather: state.weather[state.day - 1],
    source: { index, type: tile.type, name: nameFor(state, tile), value, reasons: reasons.map(reason => ({ ...reason })) },
    ownScore: value, neighborDelta, totalDelta, beforeTotal, afterTotal,
    positiveDelta: targets.reduce((sum, target) => sum + Math.max(0, target.delta), 0),
    negativeDelta: targets.reduce((sum, target) => sum + Math.min(0, target.delta), 0),
    targets,
    assumption: `${state.day}일차 현재 날씨·성장·강화·진화 기준. ${mode === 'placement' ? '이 칸에 심기 전과 후' : '선택한 식물이 없는 가상 정원과 현재 정원'}를 비교해요. 다음 날과 다른 심기는 제외해요.`,
  };
}

/** Preview exactly this legal offered placement. It does not choose a best slot. */
export function placementInfluence(state, type, index) {
  try {
    if (!validState(state) || typeof type !== 'string' || !own(entriesFor(state), type)
      || !validIndex(state, index) || state.board[index] !== null || !state.offers.includes(type)) return null;
    const explanation = explainSeedPlacement(state, type, index);
    if (!explanation) return null;
    const targets = explanation.existing.changes.map(change => targetFor(state, index, { ...change, reasons: change.reasonChanges }));
    return resultFor(state, 'placement', index, { type }, explanation.newPlant.value, explanation.newPlant.reasons,
      explanation.beforeTotal, explanation.afterTotal, targets);
  } catch { return null; }
}

/** Inspect today's marginal effect of one existing plant, including distant tiles. */
export function plantInfluence(state, index) {
  try {
    if (!validState(state) || !validIndex(state, index) || !state.board[index] || state.board[index].type === 'well') return null;
    const actual = core.forecast(state), source = actual.tiles.find(tile => tile.index === index);
    if (!source) return null;
    const absent = core.forecast({ ...state, board: state.board.map((tile, position) => position === index ? null : tile) });
    const before = new Map(absent.tiles.map(tile => [tile.index, tile]));
    const targets = actual.tiles.filter(tile => tile.index !== index).flatMap(tile => {
      const previous = before.get(tile.index), oldValue = previous?.value || 0;
      const reasons = reasonChanges(previous?.reasons, tile.reasons), delta = tile.value - oldValue;
      return delta !== 0 || reasons.length ? [targetFor(state, index, {
        index: tile.index, type: tile.type, before: oldValue, after: tile.value, delta, reasons,
      })] : [];
    });
    return resultFor(state, 'existing', index, state.board[index], source.value, source.reasons,
      absent.total, actual.total, targets);
  } catch { return null; }
}
