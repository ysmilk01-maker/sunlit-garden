// Presentation only: group the committed harvest receipt without recomputing rules.
const LABEL_GROUPS = Object.freeze({
  column: { label: '같은 열', labels: ['같은 열'] },
  weather: { label: '날씨', labels: ['햇살', '촉촉한 비', '흐린 날'] },
  growth: { label: '성장', labels: ['성장', '달콤한 열매', '잘 익은 호박', '빨갛게 익은 딸기', '활짝 핀 벚꽃'] },
  neighbors: { label: '배치 조합', labels: ['클로버 이웃·최대 둘', '다른 식물과 공생', '다양한 이웃', '시원한 그늘', '꽃과 꿀벌', '베리 이웃', '다른 꽃', '숲 그늘', '벌집 이웃', '우물과 같은 줄', '가장자리 햇살', '숲속 이웃', '민트의 향기', '두 줄기 대나무', '여유로운 빈자리', '물가의 수국', '다채로운 꽃 이웃', '꽃 친구', '우물'] },
  upgrades: { label: '정원의 힘', labels: ['햇살 약속', '오래된 정원', '작은 생태계', '공생의 정원', '테두리 화단', '꽃과 잎 사이'] },
});
const REASON_GROUP = new Map(Object.entries(LABEL_GROUPS).flatMap(([key, value]) => value.labels.map(label => [label, key])));
const validScore = value => Number.isSafeInteger(value) && value >= 0;

export function harvestPresentation(receipt) {
  const input = Array.isArray(receipt?.tiles) ? receipt.tiles : [];
  const tiles = input.filter(tile => Number.isInteger(tile?.index) && tile.index >= 0 && validScore(tile.value));
  const sum = tiles.reduce((value, tile) => value + tile.value, 0);
  const total = validScore(receipt?.total) ? receipt.total : validScore(sum) ? sum : 0;
  const consistent = tiles.length === input.length && validScore(sum) && total === sum;
  // A damaged/incomplete receipt can still show its committed total, but no
  // invented per-plant explanation or partial counter masquerading as the total.
  if (!consistent) return { total, consistent, steps: [{ indices: [], delta: total, cumulative: total }], highlights: [], bonuses: [], summary: '' };

  const count = Math.min(5, tiles.length);
  let cumulative = 0;
  const steps = Array.from({ length: count }, (_, index) => {
    const group = tiles.slice(Math.floor(index * tiles.length / count), Math.floor((index + 1) * tiles.length / count));
    const delta = group.reduce((value, tile) => value + tile.value, 0);
    cumulative += delta;
    return { indices: group.map(tile => tile.index), delta, cumulative };
  });
  const highlights = [...tiles].filter(tile => tile.value > 0).sort((a, b) => b.value - a.value || a.index - b.index).slice(0, 3).map(({ index, type, value }) => ({ index, type, value }));
  const groups = new Map();
  for (const tile of tiles) {
    const reasons = Array.isArray(tile.reasons) ? tile.reasons : [];
    // Older receipts may omit reasons. Do not claim the omitted contribution.
    if (!reasons.every(reason => validScore(reason?.value)) || reasons.reduce((value, reason) => value + reason.value, 0) !== tile.value) continue;
    for (const reason of reasons) {
      const label = reason.label;
      const key = typeof label === 'string' && / · (추가 수확|진화 보너스)$/.test(label) ? 'evolution' : REASON_GROUP.get(label);
      if (key && reason.value > 0) groups.set(key, (groups.get(key) || 0) + reason.value);
    }
  }
  const bonuses = [...groups].map(([key, value]) => ({ key, label: key === 'evolution' ? '진화' : LABEL_GROUPS[key].label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'ko')).slice(0, 3);
  return { total, consistent, steps, highlights, bonuses, summary: bonuses.map(bonus => `${bonus.label} +${bonus.value}`).join(' · ') };
}
