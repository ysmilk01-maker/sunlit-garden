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
