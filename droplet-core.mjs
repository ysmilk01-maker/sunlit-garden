export const STORAGE_KEY = 'sunlit-garden:droplet:run:v1';
export const SIZE = 4;
export const PLANTS = Object.freeze({
  sunflower: Object.freeze({ id: 'sunflower', name: '해바라기', icon: '🌻', short: '물을 바로 아래로', description: '물을 받으면 피고 바로 아래 칸에 한 방울을 보내요. 한 연쇄에 한 번만 전달해요.' }),
  mint: Object.freeze({ id: 'mint', name: '민트', icon: '🌿', short: '물을 좌우로 나눠요', description: '물을 받으면 좌우 칸에 한 방울씩 보내요. 한 연쇄에 한 번만 전달해요.' }),
  strawberry: Object.freeze({ id: 'strawberry', name: '딸기', icon: '🍓', short: '두 번 자라면 수확', description: '물이나 벌을 두 번 받으면 수확되어 빈칸이 돼요. 물을 받았을 때만 아래로 한 번 전달해요. 성장은 다음 턴에도 남아요.' }),
  hive: Object.freeze({ id: 'hive', name: '벌집', icon: '🐝', short: '옆 꽃에서 딸기로', description: '상하좌우의 해바라기·민트가 피면 가장 가까운 딸기로 벌을 한 번 보내요. 거리 동률이면 위쪽·왼쪽 딸기를 먼저 찾아요. 직접 받은 물은 전달하지 않아요.' }),
});
const piece = type => Object.freeze({ type, growth: 0 });
const boardWith = entries => Object.freeze(Array.from({ length: SIZE * SIZE }, (_, index) => entries[index] ? piece(entries[index]) : null));
const pool = Object.freeze(Object.keys(PLANTS));
export const GARDENS = Object.freeze([
  Object.freeze({ id: 1, name: '한 방울의 시작', subtitle: '끊긴 물길을 이어요', turns: 4, goal: Object.freeze({ harvests: 1, chain: 3 }), hint: '해바라기를 2행 2열에 심고, 두 번째 열에 물을 주세요.', hintIndex: 5, hintColumn: 1, seed: 1013, pool, board: boardWith({ 1: 'sunflower', 9: 'sunflower', 13: 'strawberry' }) }),
  Object.freeze({ id: 2, name: '두 갈래 화단', subtitle: '수확한 빈자리가 다음 물길', turns: 5, goal: Object.freeze({ harvests: 3, chain: 6 }), hint: '민트 위에 물길을 만들고, 수확한 딸기 자리를 다시 이어 보세요.', hintIndex: 1, hintColumn: 1, seed: 2013, pool, board: boardWith({ 4: 'strawberry', 5: 'mint', 6: 'strawberry', 10: 'sunflower', 11: 'hive' }) }),
  Object.freeze({ id: 3, name: '돌 너머의 정원', subtitle: '벌이 물길 밖까지 닿아요', turns: 6, goal: Object.freeze({ harvests: 4, chain: 6 }), hint: '돌에 막힌 열 대신 민트 위로 물을 보내고, 아래쪽 열매까지 이어 보세요.', hintIndex: 2, hintColumn: 2, seed: 3013, pool, board: boardWith({ 1: 'sunflower', 5: 'rock', 6: 'mint', 7: 'sunflower', 10: 'hive', 11: 'strawberry', 14: 'strawberry' }) }),
]);

const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const cloneBoard = board => board.map(tile => tile ? { ...tile } : null);
const gardenFor = id => GARDENS.find(garden => garden.id === id) || null;
const neighbors = index => [index - SIZE, index + SIZE, ...(index % SIZE ? [index - 1] : []), ...(index % SIZE < SIZE - 1 ? [index + 1] : [])].filter(i => i >= 0 && i < SIZE * SIZE).sort((a, b) => a - b);
function random(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ result >>> 15, result | 1);
    result ^= result + Math.imul(result ^ result >>> 7, result | 61);
    return ((result ^ result >>> 14) >>> 0) / 4294967296;
  };
}
function offersFor(stageId, turn, placements) {
  if (turn === 1 && placements === 0) return ['sunflower', 'mint', 'strawberry'];
  const choices = ['sunflower', 'mint', 'hive'];
  const rng = random(gardenFor(stageId).seed + turn * 719 + placements * 1543);
  for (let index = choices.length - 1; index > 0; index--) {
    const other = Math.floor(rng() * (index + 1));
    [choices[index], choices[other]] = [choices[other], choices[index]];
  }
  // Replanting harvested fruit is always an available choice in this first experiment.
  return [choices[0], 'strawberry', choices[1]];
}
export function newRun(stageId = 1) {
  const garden = gardenFor(stageId);
  if (!garden) return null;
  return {
    version: 1, stageId, turn: 1, phase: 'build', board: cloneBoard(garden.board),
    offers: offersFor(stageId, 1, 0), placements: 0, score: 0, totalHarvests: 0,
    bestChain: 0, lastResult: null, history: [], actions: [],
  };
}
export function place(state, index, type) {
  if (!state || state.phase !== 'build' || !gardenFor(state.stageId) || state.placements >= 2 || !Number.isInteger(index) || index < 0 || index >= SIZE * SIZE || state.board[index] !== null || !own(PLANTS, type) || !state.offers.includes(type)) return state;
  const board = cloneBoard(state.board);
  board[index] = { type, growth: 0 };
  const history = [...state.history, { board: cloneBoard(state.board), offers: [...state.offers], placements: state.placements }];
  const placements = state.placements + 1;
  return { ...state, board, placements, history, offers: offersFor(state.stageId, state.turn, placements), actions: [...state.actions, { kind: 'place', index, type }] };
}
export function undo(state) {
  if (!state || state.phase !== 'build' || !state.history.length) return state;
  const previous = state.history.at(-1);
  return { ...state, board: cloneBoard(previous.board), offers: [...previous.offers], placements: previous.placements, history: state.history.slice(0, -1), actions: state.actions.slice(0, -1) };
}
function validPreviewInput(state, column) {
  return !!state && state.phase === 'build' && !!gardenFor(state.stageId) && Number.isInteger(column) && column >= 0 && column < SIZE && Array.isArray(state.board) && state.board.length === SIZE * SIZE && state.board.every(tile => tile === null || (tile && (own(PLANTS, tile.type) || tile.type === 'rock') && Number.isInteger(tile.growth) && tile.growth >= 0 && tile.growth <= (tile.type === 'strawberry' ? 1 : 0)));
}
export function preview(state, column) {
  if (!validPreviewInput(state, column)) return null;
  const board = cloneBoard(state.board), events = [], edges = [], breaks = [];
  const active = new Set(), emitted = new Set(), scheduledHives = new Set();
  const queue = [];
  let harvests = 0;
  const event = (kind, fields) => { const result = { step: events.length, kind, ...fields }; events.push(result); return result; };
  const stop = (from, to, reason, direction) => breaks.push(event('break', { from, to, reason, direction }));
  const activate = (index, type) => {
    if (active.has(index)) return;
    active.add(index); event('activate', { index, type });
  };
  const grow = (index, source) => {
    const fruit = board[index];
    if (fruit?.type !== 'strawberry') return;
    activate(index, 'strawberry');
    const before = fruit.growth, after = before + 1;
    event('grow', { index, before, after, source });
    if (after >= 2) {
      harvests++; board[index] = null; event('harvest', { index, type: 'strawberry' });
    } else board[index] = { type: 'strawberry', growth: after };
  };
  const send = (from, direction) => {
    let to = direction === 'down' ? from + SIZE : direction === 'left' ? from - 1 : from + 1;
    if (to >= SIZE * SIZE || (direction === 'left' && from % SIZE === 0) || (direction === 'right' && from % SIZE === SIZE - 1)) to = null;
    queue.push({ kind: 'water', from, to, direction });
  };
  let first = null;
  for (let row = 0; row < SIZE; row++) if (board[row * SIZE + column]) { first = row * SIZE + column; break; }
  queue.push({ kind: 'water', from: null, to: first, direction: 'down', emptyColumn: first === null });
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const job = queue[cursor];
    if (job.kind === 'hive') {
      const target = board.map((tile, index) => tile?.type === 'strawberry' ? index : -1).filter(index => index >= 0).sort((a, b) => {
        const distance = index => Math.abs(Math.floor(index / SIZE) - Math.floor(job.from / SIZE)) + Math.abs(index % SIZE - job.from % SIZE);
        return distance(a) - distance(b) || a - b;
      })[0];
      if (target === undefined) { stop(job.from, null, 'no-fruit', 'bee'); continue; }
      activate(job.from, 'hive');
      edges.push({ from: job.from, to: target, kind: 'bee', direction: 'bee' });
      event('bee', { from: job.from, to: target, direction: 'bee' });
      grow(target, 'bee');
      continue;
    }
    edges.push({ from: job.from, to: job.to, kind: 'water', direction: job.direction });
    event('flow', { from: job.from, to: job.to, direction: job.direction });
    if (job.to === null) { stop(job.from, null, job.emptyColumn ? 'empty' : 'edge', job.direction); continue; }
    const tile = board[job.to];
    if (!tile) { stop(job.from, job.to, 'empty', job.direction); continue; }
    if (tile.type === 'rock') { stop(job.from, job.to, 'rock', job.direction); continue; }
    if (tile.type === 'hive') { stop(job.from, job.to, 'passive', job.direction); continue; }
    if (tile.type === 'strawberry') {
      grow(job.to, 'water');
      if (!emitted.has(job.to)) { emitted.add(job.to); send(job.to, 'down'); }
      continue;
    }
    if (emitted.has(job.to)) { stop(job.from, job.to, 'spent', job.direction); continue; }
    activate(job.to, tile.type); emitted.add(job.to);
    if (tile.type === 'sunflower') send(job.to, 'down');
    if (tile.type === 'mint') { send(job.to, 'left'); send(job.to, 'right'); }
    for (const index of neighbors(job.to)) if (board[index]?.type === 'hive' && !scheduledHives.has(index)) {
      scheduledHives.add(index); queue.push({ kind: 'hive', from: index });
    }
  }
  const activated = [...active], chain = activated.length;
  return { board, events, score: chain * 10 + harvests * 50, harvests, chain, activated, edges, breaks };
}
export function water(state, column) {
  const result = preview(state, column);
  if (!result) return state;
  const garden = gardenFor(state.stageId), totalHarvests = state.totalHarvests + result.harvests, bestChain = Math.max(state.bestChain, result.chain);
  const won = totalHarvests >= garden.goal.harvests && bestChain >= garden.goal.chain;
  const phase = won ? 'won' : state.turn >= garden.turns ? 'lost' : 'build';
  const turn = phase === 'build' ? state.turn + 1 : state.turn;
  return {
    ...state, turn, phase, board: cloneBoard(result.board), offers: offersFor(state.stageId, turn, 0),
    placements: 0, score: state.score + result.score, totalHarvests, bestChain,
    lastResult: { ...result, turn: state.turn, column }, history: [],
    actions: [...state.actions, { kind: 'water', column }],
  };
}
export function advance(state) {
  return state?.phase === 'won' && gardenFor(state.stageId + 1) ? newRun(state.stageId + 1) : state;
}
function same(a, b) {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
  const aKeys = Object.keys(a).sort(), bKeys = Object.keys(b).sort();
  return aKeys.length === bKeys.length && aKeys.every((key, index) => key === bKeys[index] && same(a[key], b[key]));
}
export function hydrate(raw) {
  try {
    const input = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const garden = gardenFor(input?.stageId);
    if (!garden || input.version !== 1 || !Array.isArray(input.actions) || input.actions.length > garden.turns * 3) return null;
    let state = newRun(input.stageId);
    for (const action of input.actions) {
      if (!action || typeof action !== 'object') return null;
      const next = action.kind === 'place' ? place(state, action.index, action.type) : action.kind === 'water' ? water(state, action.column) : state;
      if (next === state) return null;
      state = next;
    }
    return same(state, input) ? state : null;
  } catch { return null; }
}
export function serialize(state) {
  const clean = hydrate(state);
  return clean ? JSON.stringify(clean) : null;
}
