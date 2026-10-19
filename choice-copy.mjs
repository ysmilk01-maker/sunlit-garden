import { seedFacts } from './seed-explainer.mjs?v=20261020-24';
import { UPGRADES, LEGACY_UPGRADES, V8_UPGRADES, RUN_DAYS } from './evolution-core.mjs?v=20261020-24';

const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const valid = state => !!state && [2, 3, 4, 5, 6, 7].includes(state.version);
const has = (state, id) => Array.isArray(state.upgrades) && state.upgrades.includes(id);
const upgradesFor = state => state.version === 2 ? LEGACY_UPGRADES
  : state.version === 3 ? V8_UPGRADES : UPGRADES;
const join = lines => lines.join(' · ');

// Concise characteristics, not a second scoring engine. Actual point previews
// remain in seed-explainer; these lines describe the current save's rules.
export function seedInlineCopy(state, type) {
  if (!valid(state)) return null;
  const facts = seedFacts(state, type);
  if (!facts) return null;
  let lines;
  switch (type) {
    case 'sunflower':
      lines = [facts.condition];
      if (has(state, 'sun_pact')) lines.push('햇살 약속: 날씨와 무관하게 추가 +2');
      break;
    case 'clover':
      lines = [facts.condition];
      if (state.version >= 3) lines.push('다른 식물 옆 +2 · 우물·벌집 제외');
      break;
    case 'lavender':
      lines = [facts.condition, '같은 종은 한 번 · 우물·벌집 제외'];
      break;
    case 'berry':
      lines = [facts.condition, '비 오는 날 +3'];
      break;
    case 'mushroom':
      lines = [`${facts.condition} · 한 번만`, '흐린 날 추가 +3'];
      break;
    case 'hive':
      lines = [facts.condition, '우물·같은 열 보너스는 받지 않음'];
      break;
    case 'mint':
      lines = [facts.condition, '베리만 해당 · 딸기는 제외'];
      break;
    case 'tulip':
      lines = [facts.condition, '튤립 제외 · 같은 꽃 종류는 한 번'];
      if (state.version === 2) lines.push('이전 규칙: 연꽃도 제외');
      break;
    case 'fern':
      lines = [`${facts.condition} · 한 번만`, '흐린 날 추가 +3'];
      break;
    case 'pumpkin':
      lines = [facts.condition, '비 오는 날 +2'];
      break;
    case 'rose':
      lines = [facts.condition, '장미 자신이 받음 · 벌집도 꽃 점수 획득'];
      break;
    case 'lotus':
      lines = [`${facts.condition} · 한 번만`, '비 오는 날 추가 +4'];
      break;
    case 'daisy':
      lines = [facts.condition, '모서리도 한 번만 적용'];
      break;
    case 'bluebell':
      lines = [`${facts.condition} · 한 번만`, '흐린 날 추가 +2'];
      break;
    case 'strawberry':
      lines = [facts.condition, '민트 옆 +4 · 여러 송이여도 한 번', '비 오는 날 추가 +2'];
      break;
    case 'bamboo':
      lines = ['바로 위·아래 대나무 딱 하나면 +4', '다른 식물 옆 +2 · 우물·벌집 제외'];
      break;
    case 'cactus':
      lines = ['빈칸이 하나라도 옆에 있으면 +4', '맑음 +2 · 정원 밖은 빈칸 아님'];
      break;
    case 'hydrangea':
      lines = [facts.condition, `우물 옆 +${has(state, 'spring') ? 7 : 5} · 공통 우물 효과 포함`];
      break;
    case 'orchid':
      lines = ['난초 아닌 꽃 2종 이상이 옆이면 +5', '같은 꽃 두 송이는 1종으로 계산'];
      break;
    case 'cherry':
      lines = [facts.condition, '벚꽃 아닌 꽃 옆 +2 · 한 번만'];
      break;
    case 'well':
      lines = [facts.condition, '우물 자신은 0점 · 벌집·대각선 제외', '그늘·연꽃·수국의 우물 조건도 충족'];
      break;
    default: return null;
  }
  const matureAfter = ['berry', 'pumpkin', 'strawberry'].includes(type) ? 2 : type === 'cherry' ? 3 : 0;
  const warning = matureAfter && Number.isInteger(state.day) && state.day + matureAfter > RUN_DAYS
    ? '이번 판 성숙 보너스 없음' : null;
  // Replace the maturity promise in-place, so the small panel needs no extra row.
  if (warning) lines[0] = warning;
  return {
    name: facts.name, base: facts.base, baseLabel: `${facts.label}점 / 수확`,
    growth: facts.rules.some(rule => rule.id === 'growth') ? '수확 후 +1씩 · 최대 +2' : null,
    lines, text: join(lines), warning, neighborNote: '옆 = 상하좌우 · 대각선 제외',
  };
}

/** What this choice changes, independent of today's potential-score preview. */
export function upgradeEffectCopy(state, id) {
  if (!valid(state) || typeof id !== 'string' || !own(upgradesFor(state), id)) return null;
  let lines;
  switch (id) {
    case 'sun_pact':
      lines = ['모든 해바라기, 매 수확 추가 +2', '맑음·비·흐림 모두 적용'];
      break;
    case 'colony':
      lines = ['옆 클로버 1개당 +2 → +3', state.version === 2 ? '상하좌우 이웃마다 적용' : '상하좌우 최대 2개 이웃까지'];
      break;
    case 'diversity':
      lines = ['라벤더: 옆 다른 식물 종류당 +2 → +3', '같은 종 한 번 · 우물·벌집 제외'];
      break;
    case 'jam':
      lines = ['베리 성숙 보너스 +6 → +9', '심은 뒤 3번째 수확부터'];
      break;
    case 'shade':
      lines = ['버섯: 우물·벌집 옆 +4 → +7', '이웃이 여럿이어도 한 번만'];
      break;
    case 'bees':
      lines = ['옆 꽃 1개당 벌집 수확 +4 → +6', '상하좌우 꽃마다 · 꽃에게 주는 점수 아님'];
      break;
    case 'spring':
      lines = ['우물 옆 식물 보너스 +2 → +4', '상하좌우만 적용 · 벌집 제외'];
      break;
    case 'patience':
      lines = ['3번 수확을 마친 기물마다 추가 +2', '4번째 수확부터 · 벌집 포함 · 우물 제외'];
      break;
    case 'wild':
      lines = [state.version === 2 ? '이 단계에 열린 모든 종류를 심으면 식물 +2' : '우물 제외 6종 이상 심으면 식물 +2', '벌집은 종류에 포함 · 점수 대상은 제외'];
      break;
    case 'companions':
      lines = ['자신과 다른 식물 2종 이상이 옆이면 +2', '우물·벌집은 대상·이웃 모두 제외'];
      break;
    case 'edge_bloom':
      lines = ['가장자리에서 다른 종류 식물과 붙으면 +3', '우물·벌집은 대상·이웃 모두 제외'];
      break;
    case 'mixed_beds':
      lines = ['꽃 아닌 식물 옆에 있는 꽃에게 +2', '우물·벌집은 이웃 조건에서 제외'];
      break;
    default: return null;
  }
  return { name: upgradesFor(state)[id].name, lines, text: join(lines) };
}
