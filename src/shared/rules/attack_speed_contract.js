export const COMBAT_SIMULATION_FRAMES_PER_SECOND = 60;
export const ACTIVE_ATTACK_BASE_DELAY_FRAMES = 15;
export const ACTIVE_ATTACK_MIN_DELAY_FRAMES = 4;
export const ACTIVE_ATTACK_MAX_DELAY_FRAMES = 300;

export function normalizeActiveAttackDelayFrames(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return ACTIVE_ATTACK_BASE_DELAY_FRAMES;
  }

  return Math.min(
    ACTIVE_ATTACK_MAX_DELAY_FRAMES,
    Math.max(ACTIVE_ATTACK_MIN_DELAY_FRAMES, Math.round(numericValue)),
  );
}

export function calculateActiveAttackDelayFrames(hasteBonus = 0) {
  const numericBonus = Number(hasteBonus);
  const safeBonus = Number.isFinite(numericBonus) ? numericBonus : 0;
  const hasteDivisor = Math.max(0.1, 1 + safeBonus);
  return normalizeActiveAttackDelayFrames(
    ACTIVE_ATTACK_BASE_DELAY_FRAMES / hasteDivisor,
  );
}

export function getActiveAttackDelayFrames(resolvedStats) {
  return normalizeActiveAttackDelayFrames(resolvedStats?.activeAttackSpeed);
}

export function getActiveAttacksPerSecond(delayFrames) {
  return (
    COMBAT_SIMULATION_FRAMES_PER_SECOND /
    normalizeActiveAttackDelayFrames(delayFrames)
  );
}

export function isActiveAttackReady(attackTimer, resolvedStats) {
  const numericTimer = Number(attackTimer);
  return (
    Number.isFinite(numericTimer) &&
    numericTimer >= getActiveAttackDelayFrames(resolvedStats)
  );
}

export function formatActiveAttackCadence(delayFrames) {
  const normalizedDelay = normalizeActiveAttackDelayFrames(delayFrames);
  return `${normalizedDelay}f · ${getActiveAttacksPerSecond(normalizedDelay).toFixed(2)}/sec`;
}
