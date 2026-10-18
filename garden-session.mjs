// Presentation decisions only. Scores, rewards and stage generation remain in the core.
export function homeActionFor(state, target) {
  if (state.phase === 'over') {
    const cleared = state.score >= target;
    return {kind: cleared ? 'next' : 'retry', stageId: state.stageId + (cleared ? 1 : 0),
      title: cleared ? '다음 정원 가꾸기' : '다시 도전하기',
      detail: cleared ? `${state.stageId + 1}단계 · 새로운 정원` : `${state.stageId}단계 · 다른 배치로 한 번 더`};
  }
  const active = state.day > 1 || state.placements > 0 || state.phase !== 'plant';
  return {kind: active ? 'resume' : 'start', stageId: state.stageId,
    title: active ? '정원 이어가기' : '나의 정원 열기',
    detail: `${state.stageId}단계 · ${active ? state.day + '일째부터' : '일곱 날의 시작'}`};
}

export function harvestHighlights(state) {
  const harvests = Array.isArray(state.harvests) ? state.harvests : [];
  const best = harvests.reduce((top, day) => !top || day.total > top.total ? day : top, null);
  const totals = new Map();
  for (const day of harvests) for (const tile of day.tiles || []) {
    totals.set(tile.type, (totals.get(tile.type) || 0) + tile.value);
  }
  const lead = [...totals].sort((a, b) => b[1] - a[1])[0];
  return {bestDay: best?.day ?? null, bestTotal: best?.total ?? 0,
    leadType: lead?.[0] ?? null, leadTotal: lead?.[1] ?? 0};
}

export function saveNoticeFor(status) {
  const unrecovered = Object.values(status.keys || {}).some(key => key.corrupt && !key.recovered);
  if (status.volatile) return {warning:true, title:'저장 확인이 필요해요', short:'저장할 수 없어요 · 설정에서 저장 상태 확인', message:'지금은 기기에 저장할 수 없어요. 이 창에서는 계속할 수 있지만, 창을 닫으면 이번 진행을 잃을 수 있어요.'};
  if (unrecovered) return {warning:true, title:status.recovered?'일부 기록만 되찾았어요':'일부 기록을 읽지 못했어요', short:'일부 기록 복구 실패 · 설정에서 저장 상태 확인', message:'읽을 수 없고 복구 가능한 백업도 없는 항목은 기본값으로 열었어요. 다른 항목의 복구 여부와 별개로 일부 진행이 되돌아갔을 수 있어요.'};
  if (status.backupFailed || status.quarantineFailed) return {warning:true, title:'복구용 보관함 확인이 필요해요', short:'진행 저장됨 · 복구용 백업 확인 필요', message:'현재 진행은 저장됐지만 복구용 기록을 모두 보관하지 못했어요. 브라우저의 저장 공간을 확인해 주세요.'};
  if (status.recovered) return {warning:false, title:'백업에서 되찾았어요', short:'이전 정상 기록 복구됨', message:'읽을 수 없던 기록을 이전 저장본에서 복구했어요. 마지막 행동 일부가 되돌아갔을 수 있어요.'};
  return {warning:false, title:'기록을 보관하고 있어요', short:'정원 기록 저장됨', message:'진행·해금·꽃잎·씨앗 안내를 이 브라우저에 자동으로 저장해요.'};
}
