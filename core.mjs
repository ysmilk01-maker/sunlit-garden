export const STORAGE_KEY = 'sunlit-garden:prototype:v1';
const STEPS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const REFLECTIONS = [[3, 2, 1, 0], [1, 0, 3, 2]];
const pointKey = ({ x, y }) => `${x},${y}`;

export const initialAngles = level => level.mirrors.map(mirror => mirror.angle);
export const solvedAngles = level => level.mirrors.map(mirror => mirror.solution);
export function rotate(angles, index) {
  if (!Number.isInteger(index) || index < 0 || index >= angles.length) return [...angles];
  return angles.map((angle, i) => i === index ? 1 - angle : angle);
}

export function trace(level, angles) {
  const mirrors = new Map(level.mirrors.map((mirror, index) => [pointKey(mirror), index]));
  const plants = new Map(level.plants.map((plant, index) => [pointKey(plant), index]));
  const shadePlants = new Map((level.shadePlants || []).map((plant, index) => [pointKey(plant), index]));
  const rocks = new Set(level.rocks.map(pointKey));
  const lit = new Set();
  const overheated = new Set();
  const visited = new Set();
  const segments = [];
  let { x, y, dir } = level.source;
  let reason = 'exit';
  // A beam has only 4 possible directions in each cell; this also protects malformed levels.
  const limit = level.size * level.size * 4 + 8;
  for (let i = 0; i < limit; i += 1) {
    const step = STEPS[dir];
    if (!step) { reason = 'invalid'; break; }
    const next = { x: x + step[0], y: y + step[1] };
    segments.push({ from: { x, y }, to: next });
    x = next.x; y = next.y;
    if (x < 0 || y < 0 || x >= level.size || y >= level.size) break;
    const state = `${x},${y},${dir}`;
    if (visited.has(state)) { reason = 'loop'; break; }
    visited.add(state);
    const key = `${x},${y}`;
    if (rocks.has(key)) { reason = 'blocked'; break; }
    if (plants.has(key)) lit.add(plants.get(key));
    if (shadePlants.has(key)) overheated.add(shadePlants.get(key));
    if (mirrors.has(key)) {
      const angle = angles[mirrors.get(key)];
      if (angle !== 0 && angle !== 1) { reason = 'invalid'; break; }
      dir = REFLECTIONS[angle][dir];
    }
    if (i === limit - 1) reason = 'limit';
  }
  return { segments, lit: [...lit], overheated: [...overheated], complete: level.plants.length > 0 && lit.size === level.plants.length && overheated.size === 0, reason, visitedCount: visited.size };
}

export function freshProgress() { return { version: 1, current: 0, completed: [], states: {} }; }
export function sanitizeProgress(input, levels) {
  const fresh = freshProgress();
  if (!input || typeof input !== 'object' || input.version !== 1) return fresh;
  if (Number.isInteger(input.current) && input.current >= 0 && input.current < levels.length) fresh.current = input.current;
  if (Array.isArray(input.completed)) fresh.completed = [...new Set(input.completed.filter(id => Number.isInteger(id) && levels.some(level => level.id === id)))];
  if (input.states && typeof input.states === 'object' && !Array.isArray(input.states)) {
    for (const level of levels) {
      const values = input.states[level.id];
      if (Array.isArray(values) && values.length === level.mirrors.length && values.every(value => value === 0 || value === 1)) fresh.states[level.id] = [...values];
    }
  }
  return fresh;
}
export function loadProgress(storage, levels) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return { progress: sanitizeProgress(raw ? JSON.parse(raw) : null, levels), available: true };
  } catch { return { progress: freshProgress(), available: false }; }
}
export function saveProgress(storage, progress, levels) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(sanitizeProgress(progress, levels))); return true; }
  catch { return false; }
}
