// Pure structural rules. The core adds these bounded rewards after evolution,
// so an extra harvest never copies a design reward or triggers another reward.
const flowers = new Set(['sunflower', 'clover', 'lavender', 'tulip', 'rose', 'lotus', 'daisy', 'bluebell', 'hydrangea', 'orchid', 'cherry']);
const freezeDesign = value => Object.freeze({
  ...value,
  thresholds: Object.freeze(value.thresholds),
  bonuses: Object.freeze([4, 10, 18]),
  starter: Object.freeze(value.starter),
});

export const GARDEN_DESIGNS = Object.freeze({
  pollinator: freezeDesign({
    id: 'pollinator', name: '꿀벌의 정원', title: '꿀벌의 정원', icon: '🐝',
    description: '벌집 곁에 꽃을 모으세요. 조건을 채운 오늘 수확에서 벌집들이 설계 보너스를 나눠 받아요.',
    condition: '벌집과 상하좌우로 이웃한 꽃',
    unit: '송이', thresholds: [2, 4, 6], starter: ['hive', 'sunflower', 'clover'],
  }),
  moon: freezeDesign({
    id: 'moon', name: '달빛 버섯숲', title: '달빛 버섯숲', icon: '🌙',
    description: '버섯 곁에 빈 땅을 남기세요. 빈 이웃이 있는 버섯들이 오늘 설계 보너스를 나눠 받아요.',
    condition: '상하좌우에 빈칸이 있는 버섯',
    unit: '송이', thresholds: [1, 2, 3], starter: ['mushroom', 'clover', 'berry'],
  }),
  rainbow: freezeDesign({
    id: 'rainbow', name: '무지개 화원', title: '무지개 화원', icon: '🌈',
    description: '서로 다른 씨앗을 모으세요. 우물을 제외한 종류를 세고, 오늘 수확하는 기물이 설계 보너스를 나눠 받아요.',
    condition: '정원에 심은 서로 다른 종류',
    unit: '종', thresholds: [3, 4, 6], starter: ['lavender', 'berry', 'sunflower'],
  }),
});

export function isGardenDesign(id) {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(GARDEN_DESIGNS, id);
}

const neighbors = (index, cols, rows) => [
  index - cols, index + cols,
  ...(index % cols ? [index - 1] : []),
  ...(index % cols < cols - 1 ? [index + 1] : []),
].filter(index => index >= 0 && index < cols * rows);

const resting = (tile, day) => tile?.evolution?.id === 'solar'
  && tile.evolution.day < day && (day - tile.evolution.day) % 2 === 1;

// Only the first pick is tailored. Later offers continue the normal stage seed,
// avoiding an endlessly forced crop. Rotation makes the order deterministic.
export function designStarterOffers(seed, designId) {
  if (!isGardenDesign(designId) || !Number.isSafeInteger(seed) || seed < 0) return null;
  const offers = GARDEN_DESIGNS[designId].starter;
  const offset = seed % offers.length;
  return [...offers.slice(offset), ...offers.slice(0, offset)];
}

/**
 * Current-board projection, never a stored unlock. `indices` are the plants
 * counted by the goal; `bonusIndices` actually receive the bounded reward.
 * A hive can support several flowers, but each flower counts once.
 * Rainbow counts hive as a kind and excludes the well. A charging solar flower
 * keeps its promised zero harvest and receives no design reward that day.
 * For a completed harvest, use lastHarvest.designProgress (the receipt).
 */
export function designProgress(state) {
  if (state?.version !== 8 || !isGardenDesign(state.designId)
    || !Array.isArray(state.board) || !Number.isInteger(state.cols) || state.cols < 1
    || !Number.isInteger(state.rows) || state.rows < 1
    || state.board.length !== state.cols * state.rows
    || !Number.isInteger(state.day) || state.day < 1 || state.day > 7) return null;
  const design = GARDEN_DESIGNS[state.designId], board = state.board;
  let indices = [], recipients = [], progress = 0;
  if (design.id === 'pollinator') {
    indices = board.flatMap((tile, index) => flowers.has(tile?.type)
      && neighbors(index, state.cols, state.rows).some(i => board[i]?.type === 'hive') ? [index] : []);
    recipients = board.flatMap((tile, index) => tile?.type === 'hive'
      && neighbors(index, state.cols, state.rows).some(i => flowers.has(board[i]?.type)) ? [index] : []);
    progress = indices.length;
  } else if (design.id === 'moon') {
    indices = board.flatMap((tile, index) => tile?.type === 'mushroom'
      && neighbors(index, state.cols, state.rows).some(i => board[i] === null) ? [index] : []);
    recipients = [...indices];
    progress = indices.length;
  } else {
    indices = board.flatMap((tile, index) => tile && tile.type !== 'well' ? [index] : []);
    progress = new Set(indices.map(index => board[index].type)).size;
    recipients = indices.filter(index => !resting(board[index], state.day));
  }
  const tier = design.thresholds.filter(threshold => progress >= threshold).length;
  const bonusTotal = tier && recipients.length ? design.bonuses[tier - 1] : 0;
  const share = recipients.length ? Math.floor(bonusTotal / recipients.length) : 0;
  const remainder = recipients.length ? bonusTotal % recipients.length : 0;
  const bonuses = recipients.map((index, order) => ({ index, value: share + (order < remainder ? 1 : 0) }))
    .filter(item => item.value > 0);
  return {
    id: design.id, name: design.name, title: design.title, condition: design.condition, unit: design.unit,
    progress, tier, thresholds: [...design.thresholds], nextThreshold: design.thresholds[tier] ?? null,
    bonusTotal, nextBonus: tier < 3 ? `다음 목표 ${design.thresholds[tier]}${design.unit} · 수확마다 총 +${design.bonuses[tier]}점` : '최고 등급 · 조건을 유지하면 수확마다 총 +18점',
    indices, bonusIndices: bonuses.map(item => item.index), bonuses, complete: tier === 3,
  };
}
