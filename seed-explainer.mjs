import * as core from './evolution-core.mjs?v=20261020-24';

// Text describes the rules; all placement scores come from the selected engine.
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const versions = new Set([2, 3, 4, 5, 6, 7]);
const entriesFor = state => state?.version === 2 ? core.LEGACY_SEEDS
  : state?.version === 3 ? core.V8_SEEDS : core.SEEDS;
const baseValues = Object.freeze({
  sunflower: 3, clover: 2, lavender: 2, berry: 1, mushroom: 2, hive: 0,
  mint: 2, tulip: 3, fern: 3, pumpkin: 2, rose: 4, lotus: 2, daisy: 2,
  bluebell: 2, strawberry: 1, bamboo: 2, cactus: 3, hydrangea: 2, orchid: 3,
  cherry: 3, well: 0,
});
const grows = new Set(['sunflower', 'clover', 'lavender', 'mint', 'tulip', 'rose', 'daisy', 'bluebell', 'hydrangea', 'orchid', 'cherry']);
const oldFlowers = ['sunflower', 'clover', 'lavender', 'tulip', 'rose'];
const allFlowers = [...oldFlowers, 'lotus', 'daisy', 'bluebell', 'hydrangea', 'orchid', 'cherry'];
const rule = (id, label, text) => ({ id, label, text });
const has = (state, id) => Array.isArray(state.upgrades) && state.upgrades.includes(id);

function sharedRules(state, type) {
  if (type === 'well') return [];
  const shared = [];
  if (type !== 'hive') {
    shared.push(rule('well', '우물', `상하좌우 우물 옆이면 +${has(state, 'spring') ? 4 : 2}. 대각선은 제외해요.`));
    if (state.version >= 4) shared.push(rule('column', '같은 열', '같은 세로열에 같은 종류가 자신 포함 2/3/4개 이상이면 각각 +2/+4/+6. 붙어 있지 않아도 돼요.'));
  }
  if (has(state, 'patience')) shared.push(rule('patience', '오래된 정원', '세 번 수확을 마친 뒤부터 매 수확 +2. 벌집도 받아요.'));
  if (type !== 'hive' && has(state, 'wild')) {
    const count = state.version === 2 ? '이 단계에서 열린 모든 종류' : '우물 제외 여섯 종류 이상';
    shared.push(rule('wild', '작은 생태계', `${count}를 심으면 이 식물 +2. 벌집은 종류에 포함되지만 점수는 받지 않아요.`));
  }
  if (state.version >= 3 && type !== 'hive') {
    if (has(state, 'companions')) shared.push(rule('companions', '공생의 정원', '상하좌우에 자신과 다른 식물 두 종류 이상이면 +2. 우물·벌집 제외.'));
    if (has(state, 'edge_bloom')) shared.push(rule('edge_bloom', '테두리 화단', '가장자리에서 다른 종류 식물과 상하좌우로 붙으면 +3. 우물·벌집 제외.'));
    if (has(state, 'mixed_beds') && allFlowers.includes(type)) shared.push(rule('mixed_beds', '꽃과 잎 사이', '꽃 아닌 식물과 상하좌우로 붙으면 이 꽃 +2. 우물·벌집 제외.'));
  }
  if (state.version >= 5 && type !== 'hive') shared.push(rule('evolution', '진화한 이웃', '주변 진화 식물이 추가 점수를 주거나, 새 이웃 때문에 기존 보너스를 잃을 수 있어요. 실제 변화는 자리별 예고로 확인해요.'));
  return shared;
}

/** Card facts are available for every type belonging to this version, even if locked. */
export function seedFacts(state, type) {
  if (!state || !versions.has(state.version) || typeof type !== 'string'
    || !own(baseValues, type) || (type !== 'well' && !own(entriesFor(state), type))) return null;
  const entries = entriesFor(state), rules = [];
  const add = (id, label, text) => rules.push(rule(id, label, text));
  let condition = '';
  const pair = has(state, 'colony') ? 3 : 2;
  const kinds = has(state, 'diversity') ? 3 : 2;
  const fruit = has(state, 'jam') ? 9 : 6;
  const shade = has(state, 'shade') ? 7 : 4;
  const bees = has(state, 'bees') ? 6 : 4;
  const spring = has(state, 'spring') ? 4 : 2;
  if (type !== 'well') add('base', '기본 수확', `조건 없이 기본 ${baseValues[type]}점.${type === 'hive' ? ' 벌집은 꽃 이웃이 있어야 꽃 보너스를 받아요.' : ''}`);
  if (grows.has(type)) add('growth', '성장', '수확할 때마다 다음 수확 +1. 성장 보너스는 최대 +2예요.');
  switch (type) {
    case 'sunflower':
      condition = '맑은 날 +3';
      add('sun', '날씨', '맑은 날 자신에게 +3. 비·흐림에는 없어요.');
      if (has(state, 'sun_pact')) add('sun_pact', '햇살 약속', '강화 효과로 날씨와 관계없이 자신에게 +2.');
      break;
    case 'clover':
      condition = state.version === 2 ? `옆 클로버마다 +${pair}` : `옆 클로버 둘까지 +${pair}씩`;
      add('clover', '클로버 이웃', `상하좌우 클로버 ${state.version === 2 ? '한 송이마다' : '최대 두 송이까지 각각'} 자신에게 +${pair}.`);
      if (state.version >= 3) add('companion', '다른 식물', '다른 종류 식물이 상하좌우에 하나라도 있으면 자신에게 +2. 우물·벌집은 제외해요.');
      break;
    case 'lavender':
      condition = `다른 이웃 종류마다 +${kinds}`;
      add('diversity', '다양한 이웃', `상하좌우의 라벤더 아닌 식물 종류마다 자신에게 +${kinds}. 같은 종류는 한 번만 세며 우물·벌집은 제외해요.`);
      break;
    case 'berry':
      condition = `3번째 수확부터 +${fruit}`;
      add('mature', '익은 열매', `심은 뒤 세 번째 수확부터 자신에게 +${fruit}. 첫 두 번은 열매 보너스가 없어요.`);
      add('rain', '날씨', '비 오는 날 자신에게 +3. 새 베리도 받아요.');
      break;
    case 'mushroom':
      condition = `우물·벌집 옆 +${shade}`;
      add('shade', '그늘', `상하좌우에 우물이나 벌집이 하나라도 있으면 자신에게 +${shade}. 여러 개여도 한 번이에요.`);
      add('cloud', '날씨', '흐린 날 자신에게 +3. 그늘 보너스와 함께 받아요.');
      break;
    case 'hive': {
      condition = `꽃 이웃 1개당 자신 +${bees}`;
      const flowers = (state.version === 2 ? oldFlowers : allFlowers).map(id => entries[id].name).join('·');
      add('flowers', '꽃과 꿀벌', `상하좌우 꽃 한 송이마다 벌집 자신에게 +${bees}. 꽃에 주는 점수가 아니에요.`);
      add('flower-types', '꽃 종류', flowers);
      add('facility', '시설', '벌집은 우물·같은 열 보너스를 받지 않아요. 버섯의 그늘과 장미의 이웃 조건은 만들어요.');
      break;
    }
    case 'mint':
      condition = '옆 베리마다 +3';
      add('berry', '베리 이웃', '상하좌우 베리 한 송이마다 민트 자신에게 +3. 딸기는 베리로 세지 않아요.');
      break;
    case 'tulip':
      condition = '다른 꽃 종류마다 +2';
      add('flowers', '다른 꽃', `상하좌우의 튤립 아닌 꽃 종류마다 자신에게 +2. 같은 종류는 한 번만 세요.${state.version === 2 ? ' 이 버전은 연꽃을 꽃으로 세지 않아요.' : ''}`);
      break;
    case 'fern':
      condition = '우물·버섯 옆 +4';
      add('shade', '숲 그늘', '상하좌우 우물 또는 버섯이 있으면 자신에게 +4. 여러 개여도 한 번이에요.');
      add('cloud', '날씨', '흐린 날 자신에게 +3. 숲 그늘과 함께 받아요.');
      break;
    case 'pumpkin':
      condition = '3번째 수확부터 +9';
      add('mature', '익은 호박', '심은 뒤 세 번째 수확부터 자신에게 +9. 첫 두 번은 성숙 보너스가 없어요.');
      add('rain', '날씨', '비 오는 날 자신에게 +2.');
      break;
    case 'rose':
      condition = '옆 벌집마다 +4';
      add('hive', '벌집 이웃', '상하좌우 벌집 하나마다 장미 자신에게 +4. 장미는 벌집의 꽃 조건도 만들어요.');
      break;
    case 'lotus':
      condition = '우물과 같은 행·열 +5';
      add('line', '우물과 같은 줄', '우물과 같은 가로행 또는 세로열이면 자신에게 +5. 두 조건이 겹쳐도 한 번이에요.');
      add('rain', '날씨', '비 오는 날 자신에게 +4.');
      break;
    case 'daisy':
      condition = '정원 가장자리 +3';
      add('edge', '가장자리', '정원 테두리 칸이면 자신에게 +3. 모서리도 한 번만 받아요.');
      break;
    case 'bluebell':
      condition = '버섯·고사리 옆 +4';
      add('forest', '숲속 이웃', '상하좌우 버섯 또는 고사리가 있으면 자신에게 +4. 여러 개여도 한 번이에요.');
      add('cloud', '날씨', '흐린 날 자신에게 +2.');
      break;
    case 'strawberry':
      condition = '3번째 수확부터 +5';
      add('mature', '익은 딸기', '심은 뒤 세 번째 수확부터 자신에게 +5.');
      add('mint', '민트 이웃', '상하좌우 민트가 하나라도 있으면 자신에게 +4. 여러 송이여도 한 번이에요.');
      add('rain', '날씨', '비 오는 날 자신에게 +2.');
      break;
    case 'bamboo':
      condition = '위·아래 짝 딱 하나 +4';
      add('pair', '두 줄기', '바로 위·아래 대나무가 정확히 하나일 때 자신에게 +4. 양쪽에 있으면 이 보너스는 없어요.');
      add('companion', '다른 식물', '다른 종류 식물이 상하좌우에 하나라도 있으면 자신에게 +2. 우물·벌집은 제외해요.');
      break;
    case 'cactus':
      condition = '빈칸 옆 +4';
      add('empty', '여유로운 빈자리', '상하좌우 빈칸이 하나라도 남으면 자신에게 +4. 정원 밖은 빈칸이 아니에요.');
      add('sun', '날씨', '맑은 날 자신에게 +2.');
      break;
    case 'hydrangea':
      condition = '비 오는 날 +4';
      add('rain', '날씨', '비 오는 날 자신에게 +4.');
      add('water', '물가의 수국', `상하좌우 우물 옆이면 추가 +3. 공통 우물 +${spring}과 합쳐 +${spring + 3}을 받아요.`);
      break;
    case 'orchid':
      condition = '다른 꽃 2종 옆 +5';
      add('flowers', '다채로운 꽃', '상하좌우에 난초 아닌 서로 다른 꽃 두 종류 이상이면 자신에게 +5. 같은 꽃 두 송이로는 부족해요.');
      break;
    case 'cherry':
      condition = '4번째 수확부터 +4';
      add('mature', '활짝 핀 벚꽃', '심은 뒤 네 번째 수확부터 자신에게 +4. 성장 보너스와 함께 받아요.');
      add('flowers', '꽃 친구', '벚꽃 아닌 꽃이 상하좌우에 하나라도 있으면 자신에게 +2. 여러 송이여도 한 번이에요.');
      break;
    case 'well':
      condition = `옆 식물에게 +${spring}`;
      add('support', '물 주는 시설', `우물 자신은 0점. 상하좌우 식물에게 각각 +${spring}. 벌집·대각선은 제외해요.`);
      add('special', '식물 고유 조건', '버섯·고사리의 그늘, 연꽃의 같은 행·열, 수국의 물가 조건도 만들어요.');
      add('fixed', '고정 시설', '처음부터 놓인 시설이라 씨앗으로 심거나 진화시킬 수 없어요.');
      break;
  }
  return {
    type, name: type === 'well' ? '우물' : entries[type].name,
    base: baseValues[type], label: type === 'well' ? '직접 수확 0' : `기본 ${baseValues[type]}`,
    condition, description: type === 'well' ? rules[0].text : entries[type].description,
    rules, shared: sharedRules(state, type), support: type === 'well',
  };
}

function reasonsByLabel(reasons) {
  const values = new Map();
  for (const reason of reasons) values.set(reason.label, (values.get(reason.label) || 0) + reason.value);
  return values;
}

function changedReasons(before = [], after = []) {
  const old = reasonsByLabel(before), next = reasonsByLabel(after);
  return [...new Set([...old.keys(), ...next.keys()])].flatMap(label => {
    const previous = old.get(label) || 0, value = next.get(label) || 0;
    return previous === value ? [] : [{ label, before: previous, after: value, delta: value - previous }];
  });
}

function placementResult(state, type, index, before, candidate, selection, bestSlots) {
  const after = core.forecast(candidate);
  const old = new Map(before.tiles.map(tile => [tile.index, tile]));
  const newTile = after.tiles.find(tile => tile.index === index);
  if (!newTile) return null;
  const changes = after.tiles.filter(tile => tile.index !== index).flatMap(tile => {
    const previous = old.get(tile.index), delta = tile.value - (previous?.value || 0);
    const reasonChanges = changedReasons(previous?.reasons, tile.reasons);
    return delta || reasonChanges.length ? [{ index: tile.index, type: tile.type,
      name: entriesFor(state)[tile.type].name, before: previous?.value || 0, after: tile.value,
      delta, reasonChanges,
      reasonPositive: reasonChanges.reduce((sum, reason) => sum + Math.max(0, reason.delta), 0),
      reasonNegative: reasonChanges.reduce((sum, reason) => sum + Math.min(0, reason.delta), 0),
    }] : [];
  });
  const positive = changes.reduce((sum, tile) => sum + Math.max(0, tile.delta), 0);
  const negative = changes.reduce((sum, tile) => sum + Math.min(0, tile.delta), 0);
  return {
    type, index, selection, bestSlots: [...bestSlots], day: state.day,
    newPlant: { value: newTile.value, reasons: newTile.reasons.map(reason => ({ ...reason })) },
    existing: { delta: positive + negative, positive, negative, changes,
      reasonPositive: changes.reduce((sum, tile) => sum + tile.reasonPositive, 0),
      reasonNegative: changes.reduce((sum, tile) => sum + tile.reasonNegative, 0),
    },
    totalDelta: after.total - before.total, beforeTotal: before.total, afterTotal: after.total,
    assumption: `${state.day}일차 날씨·현재 성장·강화·진화 기준. 이후 심기와 다음 날 변화는 제외해요.`,
  };
}

/** A missing index selects the actual highest whole-garden delta, with stable ties. */
export function explainSeedPlacement(state, type, index) {
  try {
    if (!seedFacts(state, type) || type === 'well' || state.phase !== 'plant'
      || !Array.isArray(state.board) || !Array.isArray(state.offers) || !state.offers.includes(type)) return null;
    if (index !== undefined && (!Number.isInteger(index) || index < 0 || index >= state.board.length || state.board[index] !== null)) return null;
    const before = core.forecast(state);
    if (index !== undefined) {
      const candidate = core.plant(state, index, type);
      return candidate === state ? null : placementResult(state, type, index, before, candidate, 'chosen', []);
    }
    let best = null, bestTotal = -Infinity;
    const bestSlots = [];
    for (let position = 0; position < state.board.length; position++) {
      if (state.board[position] !== null) continue;
      const candidate = core.plant(state, position, type);
      if (candidate === state) continue;
      const total = core.forecast(candidate).total;
      if (total > bestTotal) {
        bestTotal = total; best = { index: position, candidate }; bestSlots.splice(0, bestSlots.length, position);
      } else if (total === bestTotal && bestSlots.length < 3) bestSlots.push(position);
    }
    return best ? placementResult(state, type, best.index, before, best.candidate, 'best', bestSlots) : null;
  } catch { return null; }
}
