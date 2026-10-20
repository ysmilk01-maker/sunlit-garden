// Presentation copy. All rewards and progress come from the replayable game rules.
export const DESIGN_COPY = Object.freeze({
  pollinator: {
    promise: '꽃과 벌집으로 수확을 연결해요',
    tradeoff: '벌집 곁의 꽃을 늘려요. 같은 꽃도 각각 세어요.',
    hint: '벌집의 상하좌우에 꽃을 심어요',
    seeds: ['hive', 'sunflower', 'clover'],
    names: '벌집 + 해바라기 + 클로버',
    medal: '꿀빛 화관',
    unit: '꽃',
  },
  moon: {
    promise: '비워 둔 자리도 전략이 돼요',
    tradeoff: '빈 땅과 이웃한 버섯을 늘려요. 주변을 채우면 보너스가 줄어요.',
    hint: '버섯 곁에 빈 땅을 남겨요',
    seeds: ['mushroom', 'clover', 'berry'],
    names: '버섯 + 클로버 + 베리',
    medal: '달빛 포자',
    unit: '버섯',
  },
  rainbow: {
    promise: '서로 다른 씨앗을 모아 피워요',
    tradeoff: '새 종류를 모아요. 같은 종류를 더 심어도 설계 수는 늘지 않아요.',
    hint: '아직 없는 종류를 심어요',
    seeds: ['sunflower', 'berry', 'lavender'],
    names: '꽃 + 열매 + 새로운 종류',
    medal: '무지개 꽃다발',
    unit: '종',
  },
});

export const DESIGN_FLOWERS = new Set([
  'sunflower', 'clover', 'lavender', 'tulip', 'rose', 'lotus',
  'daisy', 'bluebell', 'hydrangea', 'orchid', 'cherry',
]);

export function designSeedFit(state, type) {
  if (state?.version !== 8 || !state.designId) return null;
  if (state.designId === 'pollinator') {
    if (type === 'hive') return '설계 핵심 · 꽃 곁에 벌집';
    if (DESIGN_FLOWERS.has(type)) return '설계 재료 · 벌집 곁의 꽃';
    return '보조 식물 · 설계 수에는 제외';
  }
  if (state.designId === 'moon') {
    return type === 'mushroom' ? '설계 핵심 · 빈 땅 곁 버섯' : '보조 식물 · 버섯 곁 빈칸 유지';
  }
  if (state.designId === 'rainbow') {
    return state.board.some(tile => tile?.type === type)
      ? '이미 있는 종류 · 설계 수 유지'
      : '새로운 종류 · 설계 수 +1';
  }
  return null;
}

export function designBonusSum(state) {
  return (state?.harvests || []).reduce((sum, receipt) => sum + (receipt.designProgress?.bonusTotal || 0), 0);
}

export function designSeedTag(state, type) {
  const fit=designSeedFit(state,type);
  if (!fit) return null;
  return {
    '설계 핵심 · 꽃 곁에 벌집':'꽃 곁에 벌집',
    '설계 재료 · 벌집 곁의 꽃':'벌집 곁의 꽃',
    '보조 식물 · 설계 수에는 제외':'설계 수 제외',
    '설계 핵심 · 빈 땅 곁 버섯':'빈칸 곁 버섯',
    '보조 식물 · 버섯 곁 빈칸 유지':'버섯 곁 빈칸 유지',
    '이미 있는 종류 · 설계 수 유지':'종류 수 유지',
    '새로운 종류 · 설계 수 +1':'새 종류 +1',
  }[fit];
}

export function designTierLabel(tier) {
  return ['아직 준비 중', '새싹 설계', '꽃망울 설계', '만개 설계'][tier] || '아직 준비 중';
}
