// Presentation helpers only. Forecasts, goals and progression stay in the game core.
export function goalProgress(score, target) {
  if (!Number.isFinite(score) || score < 0 || !Number.isFinite(target) || target <= 0) return null;
  return {
    score,
    target,
    percent: Math.min(100, score / target * 100),
    remaining: Math.max(0, target - score),
    achieved: score >= target,
    valueText: `${score}점 / 목표 ${target}점`,
  };
}

// The next visible goal follows the exact 100/115/140 percent star thresholds.
// This describes progress only; it awards no stars and changes no saved result.
export function nextStarGoal(score, target) {
  if (!Number.isSafeInteger(score) || score < 0 || !Number.isSafeInteger(target) || target <= 0) return null;
  const earned = BigInt(score), base = BigInt(target);
  const thresholds = [base, (base * 115n + 99n) / 100n, (base * 140n + 99n) / 100n];
  const stars = thresholds.filter(value => earned >= value).length;
  if (stars === 3) return { stars, nextStars: null, nextTarget: null, remaining: 0, label: '★★★ 완성 · 나의 기록에 도전' };
  const threshold = thresholds[stars], remaining = Number(threshold - earned);
  // Real stage goals are small numbers. Keep theoretical safe-integer boundary
  // inputs exact and JSON-serializable if their next threshold exceeds that range.
  const nextTarget = threshold <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(threshold) : threshold.toString();
  return {
    stars, nextStars: stars + 1, nextTarget, remaining,
    label: stars ? `${'★'.repeat(stars)} 달성 · ${'★'.repeat(stars + 1)}까지 ${remaining}점` : `목표 ${target} · ${remaining}점 더`,
  };
}

// Ties are equally good for this harvest. Cap the visual highlights, not the score.
// Negative maxima remain negative; an occupied/null cell can never be highlighted.
export function bestPreviewSlots(previews, limit = 3) {
  if (!Array.isArray(previews) || !Number.isInteger(limit) || limit < 1) return [];
  let maximum = -Infinity;
  const slots = [];
  previews.forEach((value, index) => {
    if (!Number.isFinite(value)) return;
    if (value > maximum) {
      maximum = value;
      slots.length = 0;
    }
    if (value === maximum && slots.length < limit) slots.push(index);
  });
  return slots;
}
