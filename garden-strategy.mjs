import * as core from './evolution-core.mjs?v=20261020-24';
import * as classic from './campaign-core.mjs';

// Advice is a projection of the selected save's rules, never a second score engine.
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const near = (index, cols, rows) => [index - cols, index + cols, ...(index % cols ? [index - 1] : []), ...(index % cols < cols - 1 ? [index + 1] : [])].filter(i => i >= 0 && i < cols * rows);
const V2_FLOWERS = ['sunflower', 'clover', 'lavender', 'tulip', 'rose'];
const FLOWERS = [...V2_FLOWERS, 'lotus', 'daisy', 'bluebell', 'hydrangea', 'orchid', 'cherry'];
const flowersFor = state => new Set(state.version === 2 ? V2_FLOWERS : FLOWERS);
const entriesFor = state => state.version === 2 ? { seeds: core.LEGACY_SEEDS, upgrades: core.LEGACY_UPGRADES }
  : state.version === 3 ? { seeds: core.V8_SEEDS, upgrades: core.V8_UPGRADES }
    : { seeds: core.SEEDS, upgrades: core.UPGRADES };
const isPlant = (state, tile) => !!tile && own(entriesFor(state).seeds, tile.type) && tile.type !== 'hive';
const isResting = (state, tile) => tile?.evolution?.id === 'solar' && state.day > tile.evolution.day
  && (state.day - tile.evolution.day) % 2 === 1;
const validState = state => !!state && [2, 3, 4, 5, 6, 7].includes(state.version) && Array.isArray(state.board)
  && state.board.length === state.cols * state.rows && Number.isInteger(state.day) && state.day >= 1 && state.day <= core.RUN_DAYS;
const dayLabel = day => `${day}일차 수확`;

const SEED_HINTS = {
  sunflower: { role: '햇살과 성장', watch: '맑음 보너스는 날씨가 바뀌면 사라져요.', plan: '앞으로 맑은 날이 남았는지 보고, 벌집 곁도 살펴보세요.' },
  clover: { role: '이웃과 군락', watch: '세로 같은 열과 상하좌우 이웃은 서로 다른 조건이에요.', plan: '클로버 이웃과 다른 식물 이웃을 함께 남겨 두세요.' },
  lavender: { role: '다양한 이웃', watch: '같은 종류를 여러 개 붙여도 이웃 종류는 하나예요.', plan: '상하좌우를 서로 다른 식물로 채울 자리를 남기세요.' },
  berry: { role: '기다려 키우기', watch: '새 베리는 세 번째 수확부터 열매 보너스를 받아요.', plan: '일찍 심어 수확 횟수를 확보하세요.' },
  mushroom: { role: '그늘 활용', watch: '우물과 벌집이 둘 다 붙어도 그늘 보너스는 한 번이에요.', plan: '우물이나 벌집 곁의 빈칸을 활용하세요.' },
  hive: { role: '꽃 모아 수확', watch: '꽃 이웃이 없으면 벌집의 꽃 보너스는 0점이에요.', plan: '상하좌우에 꽃을 더 심을 수 있는 곳을 남겨 두세요.' },
  mint: { role: '베리 곁의 잎', watch: '베리가 대각선이나 두 칸 떨어져 있으면 보너스가 없어요.', plan: '베리의 상하좌우에 민트를 연결하세요.' },
  tulip: { role: '다른 꽃 모으기', watch: '튤립끼리는 다른 꽃 보너스를 주지 않아요.', plan: '튤립 둘레에 서로 다른 꽃을 심으세요.' },
  fern: { role: '숲 그늘', watch: '우물과 버섯이 여럿이어도 그늘 보너스는 한 번이에요.', plan: '우물이나 버섯과 붙이고 흐린 날을 살펴보세요.' },
  pumpkin: { role: '늦게 큰 수확', watch: '세 번째 수확 전에는 잘 익은 호박 +9가 없어요.', plan: '일찍 심어 마지막 날까지 여러 번 수확하세요.' },
  rose: { role: '벌집과 꽃', watch: '벌집이 없는 자리에서는 벌집 이웃 보너스가 없어요.', plan: '벌집의 빈 이웃 칸에 장미를 연결하세요.' },
  lotus: { role: '물길 같은 줄', watch: '우물과 같은 행·열이 겹쳐도 같은 줄 보너스는 한 번이에요.', plan: '우물과 같은 가로행 또는 세로열을 활용하세요.' },
  daisy: { role: '정원 테두리', watch: '모서리도 가장자리 보너스를 두 번 받지는 않아요.', plan: '테두리 칸과 벌집 이웃 조건을 함께 살펴보세요.' },
  bluebell: { role: '숲속 이웃', watch: '버섯과 고사리가 함께 있어도 이웃 보너스는 한 번이에요.', plan: '버섯이나 고사리 옆에서 흐린 날을 활용하세요.' },
  strawberry: { role: '익는 열매와 민트', watch: '세 번째 수확 전에는 익은 딸기 +5가 없어요.', plan: '일찍 심고 민트가 닿을 자리를 남겨 두세요.' },
  bamboo: { role: '두 줄기 짝', watch: '위·아래에 대나무가 둘 다 있으면 두 줄기 보너스를 잃어요.', plan: '위나 아래 한쪽에만 대나무를 붙이세요.' },
  cactus: { role: '빈칸을 남기기', watch: '마지막 빈 이웃을 채우면 빈칸 보너스 +4를 잃어요.', plan: '상하좌우 한 칸은 비워 두고 맑은 날을 활용하세요.' },
  hydrangea: { role: '비와 우물', watch: '비 보너스는 맑거나 흐린 날에는 적용되지 않아요.', plan: '우물 옆 자리를 쓰고 남은 비 예보를 확인하세요.' },
  orchid: { role: '꽃 두 종류', watch: '같은 꽃 두 송이는 서로 다른 두 종류가 아니에요.', plan: '난초와 다른 꽃 두 종류를 상하좌우에 붙이세요.' },
  cherry: { role: '오래 키우는 꽃', watch: '네 번째 수확부터 오래 자란 벚꽃 +4를 받아요.', plan: '일찍 심고 벚꽃 아닌 꽃을 옆에 연결하세요.' },
};

const UPGRADE_HINTS = {
  sun_pact: { role: '날씨와 무관한 햇살', watch: '해바라기가 없으면 이 강화로 늘어나는 수확도 없어요.', plan: '앞으로 심을 해바라기까지 함께 키우세요.' },
  colony: { role: '붙어 있는 클로버', watch: '같은 세로열이어도 떨어져 있으면 이웃 강화는 못 받아요.', plan: '클로버를 상하좌우에 붙여 이웃 조건을 만드세요.' },
  diversity: { role: '라벤더의 이웃 종류', watch: '같은 종류 이웃을 늘려도 추가 종류 보너스는 늘지 않아요.', plan: '라벤더 곁에 아직 없는 종류를 연결하세요.' },
  jam: { role: '익은 베리 강화', watch: '심은 뒤 세 번째 수확부터 적용돼요. 새 베리는 바로 받지 못해요.', plan: '먼저 심은 베리를 중심으로 수확 횟수를 확보하세요.' },
  shade: { role: '그늘 버섯 강화', watch: '우물·벌집과 떨어진 버섯은 이 강화를 못 받아요.', plan: '버섯을 우물이나 벌집의 상하좌우에 심으세요.' },
  bees: { role: '벌집의 꽃 연결', watch: '점수가 늘어나는 쪽은 꽃과 연결된 벌집이에요.', plan: '벌집 상하좌우의 빈칸에 꽃을 추가하세요.' },
  spring: { role: '우물 둘레 강화', watch: '벌집과 대각선 식물은 우물 보너스를 받지 못해요.', plan: '우물의 상하좌우 빈칸을 식물로 채우세요.' },
  patience: { role: '오래 키운 기물', watch: '세 번 수확한 뒤부터 적용돼요. 늦게 심은 기물은 기다려야 해요.', plan: '일찍 심은 식물과 벌집의 남은 수확을 활용하세요.' },
  wild: { role: '여러 종류의 정원', watch: '종류 수에는 벌집도 포함되지만, +2점 대상에서는 벌집이 빠져요.', plan: '아직 없는 종류를 골라 조건을 채우세요.' },
  companions: { role: '서로 다른 두 이웃', watch: '우물·벌집과 자기와 같은 종류는 이웃 두 종류에 포함되지 않아요.', plan: '한 식물 둘레에 서로 다른 타종 두 종류를 붙이세요.' },
  edge_bloom: { role: '테두리의 공생', watch: '테두리 자리만으로는 부족해요. 다른 식물 이웃도 필요해요.', plan: '테두리 식물 옆에 다른 종류를 연결하세요.' },
  mixed_beds: { role: '꽃과 잎의 조합', watch: '점수는 꽃이 받아요. 우물·벌집은 꽃 아닌 이웃으로 세지 않아요.', plan: '꽃 곁에 베리·버섯처럼 꽃 아닌 식물을 붙이세요.' },
};

const EVOLUTION_HINTS = {
  twin: { role: '매일 추가 수확', watch: '주변 식물까지 더 수확하지는 않아요.', plan: '이 해바라기의 햇살·우물·같은 열 조건을 키우세요.' },
  solar: { role: '충전 후 한꺼번에', watch: '충전 날에는 이 꽃이 0점이에요. 다른 진화로도 수확할 수 없어요.', plan: '발산 날까지 상하좌우를 값진 식물로 채우세요.' },
  meadow: { role: '다른 이웃 모으기', watch: '같은 종류 이웃이 여럿이어도 한 종류로 세요.', plan: '클로버와 다른 식물의 종류를 둘레에 늘리세요.' },
  lucky: { role: '한 이웃에 집중', watch: '동점이면 위·왼쪽 칸이 먼저예요. 충전 중인 태양꽃은 못 수확해요.', plan: '가장 값진 이웃 한 송이의 기본 수확을 키우세요.' },
  cluster: { role: '내 열매 더 따기', watch: '심은 뒤 세 번째 수확부터예요. 진화만으로 바로 익지는 않아요.', plan: '이 베리의 비·같은 열 보너스를 함께 활용하세요.' },
  jam: { role: '이웃과 열매 나누기', watch: '익은 뒤 적용돼요. 베리·우물·벌집은 나눔 대상에서 빠져요.', plan: '둘레를 베리 아닌 식물로 채우세요.' },
  chorus: { role: '가로로 이어진 합창', watch: '세로 같은 열이 아니에요. 같은 가로행 라벤더를 최대 셋까지 세요.', plan: '같은 가로행의 빈칸에 라벤더를 모으세요.' },
  perfume: { role: '다른 이웃의 향기', watch: '같은 종류 이웃을 반복해도 추가 종류로 세지 않아요.', plan: '상하좌우를 라벤더와 다른 종류로 나누세요.' },
  colony: { role: '비워 두고 키우기', watch: '빈칸을 채울 때마다 이 버섯의 진화 보너스가 4점 줄어요.', plan: '이 버섯 둘레를 비워 두고 다른 자리에 심으세요.' },
  moon: { role: '흐린 날 큰 수확', watch: '맑음·비에는 추가 수확 대신 +2점이에요.', plan: '앞으로 흐린 날이 남았는지 보고 그늘도 연결하세요.' },
  swarm: { role: '여러 꽃에 나누기', watch: '꽃 아닌 식물에는 +3점을 주지 않아요.', plan: '벌집 상하좌우에 여러 꽃을 연결하세요.' },
  royal: { role: '꽃 한 송이에 집중', watch: '꽃을 하나 더 붙여 두 송이가 되면 추가 수확이 사라져요.', plan: '꽃 한 송이를 남기고 나머지 이웃은 꽃 아닌 식물로 쓰세요.' },
};

function project(state, days = 1) {
  return {
    ...state, day: state.day + days,
    board: state.board.map(tile => tile && tile.type !== 'well'
      ? { ...tile, age: Math.min(7, tile.age + days) } : tile ? { ...tile } : null),
  };
}

function compare(before, after) {
  const original = core.forecast(before), candidate = core.forecast(after);
  const originalTiles = new Map(original.tiles.map(tile => [tile.index, tile]));
  const differences = candidate.tiles.map(tile => ({
    index: tile.index, type: tile.type, delta: tile.value - (originalTiles.get(tile.index)?.value || 0),
  })).filter(tile => tile.delta !== 0);
  return { delta: candidate.total - original.total, affected: differences.length, differences, total: candidate.total };
}

function twoHarvests(before, after) {
  const now = compare(before, after);
  const later = after.day < core.RUN_DAYS ? compare(project(before), project(after)) : null;
  return { now, later };
}

function context(state, index, type) {
  const adjacent = near(index, state.cols, state.rows);
  const tiles = adjacent.map(position => state.board[position]).filter(Boolean);
  const otherKinds = new Set(tiles.filter(tile => isPlant(state, tile) && tile.type !== type).map(tile => tile.type));
  const flowerKinds = new Set(tiles.filter(tile => flowersFor(state).has(tile.type) && tile.type !== type).map(tile => tile.type));
  return {
    adjacent, tiles, otherKinds, flowerKinds,
    flowers: tiles.filter(tile => flowersFor(state).has(tile.type)).length,
    empty: adjacent.filter(position => state.board[position] === null).length,
    count: name => tiles.filter(tile => tile.type === name).length,
    edge: index < state.cols || index >= state.board.length - state.cols || index % state.cols === 0 || index % state.cols === state.cols - 1,
    weather: state.weather[state.day - 1],
  };
}

function seedReason(state, index, type) {
  const c = context(state, index, type), day = state.day;
  switch (type) {
    case 'sunflower': return c.weather === 'sun' ? '오늘은 맑음이라 이 해바라기가 햇살 +3점을 받아요.'
      : day === core.RUN_DAYS ? '오늘 햇살 보너스는 없어요. 마지막 수확의 이웃 조건을 살펴보세요.' : '오늘 햇살 보너스는 없어요. 다음 수확부터 성장 점수가 붙어요.';
    case 'clover': return state.version === 2
      ? `상하좌우 클로버 ${c.count('clover')}송이가 서로 이웃 보너스를 만들어요.`
      : `클로버 이웃 ${Math.min(2, c.count('clover'))}송이를 세고, 다른 식물 이웃은 ${c.otherKinds.size ? '있어요' : '아직 없어요'}.`;
    case 'lavender': return `이 자리의 다른 식물 이웃은 ${c.otherKinds.size}종이에요. 종류마다 보너스를 받아요.`;
    case 'berry': return c.weather === 'rain' ? '오늘은 비라 새 베리도 +3점. 열매는 세 번째 수확부터예요.' : `${day + 2}일차부터 열매가 익어요. 오늘은 새 베리의 기본 수확부터 받아요.`;
    case 'mushroom': return c.count('well') || c.count('hive') ? '이 자리는 우물·벌집 곁이라 버섯의 그늘 조건을 채워요.' : c.weather === 'cloud' ? '오늘은 흐림이라 그늘 이웃이 없어도 날씨 +3점을 받아요.' : '이 자리에는 그늘 이웃이 없어요. 우물·벌집이나 흐린 날이 기회예요.';
    case 'hive': return `이 자리의 꽃 이웃은 ${c.flowers}송이예요. 연결된 꽃 수가 벌집의 수확을 정해요.`;
    case 'mint': return `이웃 베리 ${c.count('berry')}송이마다 민트가 +3점을 받아요.`;
    case 'tulip': return `튤립과 다른 꽃 이웃은 ${c.flowerKinds.size}종이에요. 종류마다 +2점이에요.`;
    case 'fern': return c.count('well') || c.count('mushroom') ? '이 자리는 우물·버섯 곁이라 고사리의 숲 그늘 +4를 받아요.' : '우물·버섯 이웃이 없어 숲 그늘 +4는 아직 없어요.';
    case 'pumpkin': return `${day + 2}일차부터 잘 익은 호박 +9가 붙어요. 그전에는 작은 수확이에요.`;
    case 'rose': return `이웃 벌집 ${c.count('hive')}개마다 장미가 +4점을 받아요.`;
    case 'lotus': return Math.floor(index / state.cols) === Math.floor(state.wellIndex / state.cols) || index % state.cols === state.wellIndex % state.cols
      ? '우물과 같은 행 또는 열이라 연꽃의 같은 줄 +5를 받아요.' : '우물과 같은 행·열은 아니에요. 비 오는 날에는 +4를 받아요.';
    case 'daisy': return c.edge ? '이 자리는 가장자리라 데이지가 +3점을 받아요.' : '이 자리는 안쪽이라 가장자리 +3은 없어요.';
    case 'bluebell': return c.count('mushroom') || c.count('fern') ? '버섯·고사리 이웃이 있어 초롱꽃의 숲속 이웃 +4를 받아요.' : '버섯·고사리 이웃이 없어요. 흐린 날에는 +2를 받아요.';
    case 'strawberry': return `민트 이웃은 ${c.count('mint') ? '있어요' : '없어요'}. ${day + 2}일차부터 딸기의 익은 열매 +5도 붙어요.`;
    case 'bamboo': {
      const count = [index - state.cols, index + state.cols].filter(position => position >= 0 && position < state.board.length && state.board[position]?.type === 'bamboo').length;
      return `위·아래 대나무는 ${count}송이예요. 정확히 하나일 때 두 줄기 +4를 받아요.`;
    }
    case 'cactus': return `빈 이웃은 ${c.empty}칸이에요. 하나라도 남으면 선인장이 +4를 받아요.`;
    case 'hydrangea': return `${c.count('well') ? '우물 옆 추가 +3 조건을 채웠어요.' : '우물 옆 추가 +3은 없어요.'} ${c.weather === 'rain' ? '오늘 비 +4도 받아요.' : '비 오는 날에는 +4예요.'}`;
    case 'orchid': return `난초와 다른 꽃 이웃은 ${c.flowerKinds.size}종이에요. 둘 이상이면 +5를 받아요.`;
    case 'cherry': return `다른 꽃 이웃은 ${c.flowerKinds.size ? '있어요' : '없어요'}. 오래 자란 꽃 +4는 ${day + 3}일차부터예요.`;
    default: return '';
  }
}

function lossWatch(state, comparison) {
  const losses = comparison.differences.filter(tile => tile.delta < 0);
  if (!losses.length) return null;
  const first = entriesFor(state).seeds[losses[0].type].name;
  const value = losses.reduce((sum, tile) => sum - tile.delta, 0);
  return `기존 ${first}${losses.length > 1 ? ` 등 ${losses.length}송이` : ''}의 수확이 ${value}점 줄어요. 새 식물 점수와 합산한 예고예요.`;
}

export function seedAdvice(state, type) {
  try {
    if (!validState(state) || state.phase !== 'plant' || !state.offers.includes(type)
      || !own(entriesFor(state).seeds, type) || !own(SEED_HINTS, type)) return null;
    let best = null, bestSlots = [];
    for (let index = 0; index < state.board.length; index++) {
      if (state.board[index] !== null) continue;
      const candidate = core.plant(state, index, type);
      if (candidate === state) continue;
      const now = compare(state, candidate);
      if (!best || now.delta > best.now.delta) { best = { index, candidate, now }; bestSlots = [index]; }
      else if (now.delta === best.now.delta && bestSlots.length < 3) bestSlots.push(index);
    }
    if (!best) return null;
    const later = state.day < core.RUN_DAYS ? compare(project(state), project(best.candidate)) : null;
    const hint = SEED_HINTS[type], meta = entriesFor(state).seeds[type];
    let reason = seedReason(state, best.index, type), watch = hint.watch, plan = hint.plan;
    if (state.version === 2 && type === 'clover') {
      plan = '상하좌우에 클로버를 붙여 서로 이웃 보너스를 받으세요.';
      watch = '이 버전은 같은 세로열 가점 없이 상하좌우 클로버 이웃을 세요.';
    }
    if (state.version >= 3 && type === 'clover') watch = '클로버 이웃은 둘까지만 세요. 같은 종류만 모으면 공생 +2를 놓쳐요.';
    const wait = ['berry', 'pumpkin', 'strawberry'].includes(type) ? 2 : type === 'cherry' ? 3 : 0;
    if (wait && state.day + wait > core.RUN_DAYS) {
      reason = '지금 심으면 이번 판 안에 성숙 보너스를 받지 못해요.';
      watch = '남은 수확에서는 기본 점수와 이웃·날씨 효과만 비교하세요.';
      plan = '이번 판은 성숙을 기다리는 배치보다 즉시 조건을 살피세요.';
    }
    if (state.day === core.RUN_DAYS) plan = '마지막 수확이라 오늘 바로 받는 이웃·날씨 효과를 비교하세요.';
    const shared = core.forecast(best.candidate).tiles.find(tile => tile.index === best.index)?.reasons
      .filter(item => ['우물', '같은 열'].includes(item.label) || /진화 보너스|추가 수확/.test(item.label))
      .sort((a, b) => b.value - a.value)[0];
    const otherGain = best.now.differences.filter(tile => tile.index !== best.index && tile.delta > 0)
      .sort((a, b) => b.delta - a.delta)[0];
    if (shared) reason = `${shared.label} +${shared.value}도 받는 자리예요. ${reason}`;
    else if (otherGain) {
      const name = entriesFor(state).seeds[otherGain.type].name;
      reason = `기존 ${name}의 수확도 +${otherGain.delta} 늘어요. ${reason}`;
    }
    const losses = lossWatch(state, best.now);
    if (losses) watch = losses;
    if (best.now.delta < 0) reason = `현재 빈칸 중 오늘 감소가 가장 작은 자리도 정원 수확이 ${-best.now.delta}점 줄어요.`;
    return {
      role: hint.role, reason, watch, plan, nowLabel: dayLabel(state.day), nowDelta: best.now.delta,
      laterLabel: later ? dayLabel(state.day + 1) : null, laterDelta: later?.delta ?? null,
      affected: best.now.affected, bestIndex: best.index, bestSlots, description: meta.description,
    };
  } catch { return null; }
}

function upgradeCondition(state, id) {
  const board = state.board, kinds = new Set(board.filter(tile => tile && tile.type !== 'well').map(tile => tile.type));
  const count = type => board.filter(tile => tile?.type === type).length;
  switch (id) {
    case 'sun_pact': return `현재 해바라기는 ${count('sunflower')}송이예요. 날씨와 관계없이 각각 +2를 받아요.`;
    case 'colony': return state.version === 2 ? '상하좌우 클로버 한 이웃마다 보너스가 +1 늘어요.' : '상하좌우 클로버 이웃 둘까지, 한 이웃마다 보너스가 +1 늘어요.';
    case 'diversity': return `라벤더 ${count('lavender')}송이의 서로 다른 이웃 종류마다 +1이 더 붙어요.`;
    case 'jam': return '세 번째 수확에 도달한 베리부터 성숙 보너스가 +3 늘어요.';
    case 'shade': return '우물·벌집과 붙어 있는 버섯의 그늘 보너스가 +3 늘어요.';
    case 'bees': return `벌집 ${count('hive')}개의 꽃 이웃마다 벌집 수확이 +2 늘어요.`;
    case 'spring': return '우물의 상하좌우에 있는 식물마다 우물 보너스가 +2 늘어요.';
    case 'patience': return '수확을 세 번 겪은 기물부터 매 수확 +2를 받아요. 벌집도 포함돼요.';
    case 'wild': {
      const required = state.version === 2 ? core.stageFor(state).pool.length : 6;
      return `현재 ${kinds.size}종, 필요한 종류는 ${required}종이에요. ${kinds.size >= required ? '종류 조건을 채웠어요.' : `${required - kinds.size}종을 더 모아야 해요.`}`;
    }
    case 'companions': return '자기와 다른 식물 두 종류 이상에 붙어 있는 식물마다 +2예요.';
    case 'edge_bloom': return '다른 식물과 붙어 있는 가장자리 식물마다 +3예요.';
    case 'mixed_beds': return '꽃 아닌 식물과 붙어 있는 꽃마다 +2예요.';
    default: return '';
  }
}

export function upgradeAdvice(state, id) {
  try {
    if (!validState(state) || state.phase !== 'upgrade' || !own(entriesFor(state).upgrades, id) || !own(UPGRADE_HINTS, id)) return null;
    const chosen = core.chooseUpgrade(state, id);
    if (chosen === state) return null;
    // chooseUpgrade already advances the day. The board was aged by the preceding
    // harvest, so it must not be aged again for the next harvest's comparison.
    const unchanged = { ...chosen, upgrades: [...state.upgrades] };
    const { now, later } = twoHarvests(unchanged, chosen);
    const hint = UPGRADE_HINTS[id];
    let reason = upgradeCondition(chosen, id), watch = hint.watch, plan = hint.plan;
    if (now.delta === 0) reason = later?.delta > 0
      ? `다음 수확은 그대로예요. 현재 배치에서 ${chosen.day + 1}일차 수확부터 효과가 나타나요.`
      : `지금 배치에서는 다음 수확이 늘지 않아요. ${hint.plan}`;
    if (id === 'wild') reason = upgradeCondition(chosen, id);
    if (id === 'colony' && state.version >= 3) watch = '한 클로버는 이웃 둘까지만 강화돼요. 떨어진 같은 열은 이웃이 아니에요.';
    if (chosen.day === core.RUN_DAYS && now.delta === 0) watch = '마지막 수확이에요. 오늘 남은 심기로 조건을 만들 수 있는지 먼저 살피세요.';
    if (id === 'jam' && chosen.day > 5) plan = '새 베리는 이번 판에 익지 않아요. 먼저 심은 베리를 확인하세요.';
    return {
      role: hint.role, reason, watch, plan, nowLabel: dayLabel(chosen.day), nowDelta: now.delta,
      laterLabel: later ? dayLabel(chosen.day + 1) : null, laterDelta: later?.delta ?? null,
      affected: now.affected, description: entriesFor(state).upgrades[id].description,
    };
  } catch { return null; }
}

function evolutionReason(state, index, id, preview) {
  const chosen = core.evolve(state, index, id), tile = chosen.board[index], c = context(chosen, index, tile.type);
  switch (id) {
    case 'twin': return '이 해바라기의 다음 수확을 한 번 더 받아요. 이웃 식물은 그대로예요.';
    case 'solar': return `${preview.nextDay}일차에는 충전해요. ${preview.followingDay}일차에는 자신과 상하좌우 식물을 추가 수확해요.`;
    case 'meadow': case 'perfume': return `다른 식물 이웃 ${c.otherKinds.size}종으로, 이 한 송이에 +${c.otherKinds.size * 3}점이 붙어요.`;
    case 'lucky': {
      const raw = classic.forecast({ ...chosen, version: 4 });
      const values = new Map(raw.tiles.map(value => [value.index, value.value]));
      const targets = c.adjacent.filter(position => isPlant(chosen, chosen.board[position])).sort((a, b) => (values.get(b) || 0) - (values.get(a) || 0) || a - b);
      if (!targets.length) return '추가 수확할 식물 이웃이 아직 없어요.';
      const target = chosen.board[targets[0]], name = entriesFor(chosen).seeds[target.type].name;
      const rests = isResting(chosen, target);
      return rests ? `최고값 이웃은 ${name}지만, 다음 수확은 태양꽃 충전 중이라 더 수확할 수 없어요.`
        : `다음 수확 대상은 ${name}예요. 다른 진화 효과를 뺀 ${values.get(targets[0])}점을 한 번 더 받아요.`;
    }
    case 'cluster': return tile.age >= 2 ? '이 베리는 이미 익었어요. 다음 수확부터 한 번 더 따요.'
      : `${chosen.day + 2 - tile.age}일차부터 익어요. 진화해도 성숙 시점은 그대로예요.`;
    case 'jam': {
      const recipients = c.tiles.filter(other => isPlant(chosen, other) && other.type !== 'berry' && !isResting(chosen, other)).length;
      return tile.age >= 2 ? `다음 수확에 베리 아닌 이웃 ${recipients}송이에게 각각 +3을 나눠요. 충전 중인 꽃은 제외해요.`
        : `${chosen.day + 2 - tile.age}일차에 익으면, 상하좌우의 베리 아닌 식물에게 각각 +3을 나눠요.`;
    }
    case 'chorus': {
      const row = Math.floor(index / chosen.cols);
      const count = chosen.board.filter((other, position) => position !== index && Math.floor(position / chosen.cols) === row && other?.type === 'lavender').length;
      return `같은 가로행의 다른 라벤더 ${count}송이 중 ${Math.min(3, count)}송이를 세어 자신에게 +${Math.min(3, count) * 4}점이에요.`;
    }
    case 'colony': return `빈 이웃 ${c.empty}칸이 자신에게 +${c.empty * 4}점을 줘요. 정원 밖은 세지 않아요.`;
    case 'moon': return c.weather === 'cloud' ? '다음 날은 흐림이라 이 버섯을 한 번 더 수확해요.' : '다음 날은 흐림이 아니라 추가 수확 대신 이 버섯에 +2점이에요.';
    case 'swarm': {
      const active = c.tiles.filter(other => flowersFor(chosen).has(other.type) && !isResting(chosen, other)).length;
      return `이웃 꽃 중 충전하지 않는 ${active}송이가 각각 +3을 받아요. 벌집 자체의 점수는 아니에요.`;
    }
    case 'royal': {
      if (c.flowers !== 1) return `이웃 꽃이 ${c.flowers}송이라 추가 수확이 없어요. 정확히 하나여야 해요.`;
      const flower = c.tiles.find(other => flowersFor(chosen).has(other.type));
      return isResting(chosen, flower) ? '이웃 꽃은 하나지만 태양꽃 충전 날이라 추가 수확을 받을 수 없어요.'
        : '이웃 꽃이 정확히 하나라 그 꽃을 두 번 더 수확해요.';
    }
    default: return '';
  }
}

export function evolutionAdvice(state, index, id) {
  try {
    if (!validState(state) || state.version < 5 || !own(EVOLUTION_HINTS, id)) return null;
    const preview = core.previewEvolution(state, index, id);
    if (!preview) return null;
    const chosen = core.evolve(state, index, id);
    const board = chosen.board.map((tile, position) => {
      if (position !== index || !tile) return tile;
      // Keep the selected plant's existing tier when comparing tier 2 -> 3.
      const { evolution, ...plain } = tile;
      return state.board[index].evolution ? { ...plain, evolution: { ...state.board[index].evolution } } : plain;
    });
    const unchanged = { ...chosen, board };
    const now = compare(unchanged, chosen), hint = EVOLUTION_HINTS[id];
    const detail = core.evolutionDetails(chosen.board[index]);
    const master = core.evolutionTier(chosen.board[index]) === 3;
    return {
      role: master ? '3단계 · 한 송이에 집중' : hint.role, reason: master ? detail.description : evolutionReason(state, index, id, preview), watch: master ? '이번 진화 기회 한 번을 써요. 다른 식물의 첫 진화와 수확 증가량을 비교하세요.' : hint.watch, plan: hint.plan,
      nowLabel: dayLabel(preview.nextDay), nowDelta: preview.nextDelta,
      laterLabel: dayLabel(preview.followingDay), laterDelta: preview.followingDelta,
      affected: now.affected, description: detail.description,
    };
  } catch { return null; }
}
