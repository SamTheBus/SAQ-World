export function isBelowHealthFraction(combatant, fraction) {
  if (!combatant?.hp || !combatant?.maxHp) return false;
  if (
    typeof combatant.hp.lt === "function" &&
    typeof combatant.maxHp.mul === "function"
  ) {
    return combatant.hp.lt(combatant.maxHp.mul(fraction));
  }
  return Number(combatant.hp) < Number(combatant.maxHp) * fraction;
}

export function isOverkillHit(damage, maxHp, multiple = 10) {
  if (!damage || !maxHp) return false;
  if (typeof damage.gte === "function" && typeof maxHp.mul === "function") {
    return damage.gte(maxHp.mul(multiple));
  }
  return Number(damage) >= Number(maxHp) * multiple;
}

export function updateFinitePeakHit(currentPeak, damage) {
  let current = Number(currentPeak);
  if (!Number.isFinite(current) || current < 0) current = 0;

  let hit =
    damage && typeof damage.toFiniteNumber === "function"
      ? damage.toFiniteNumber()
      : Number(damage);
  if (!Number.isFinite(hit)) {
    hit = hit < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE;
  }

  return Math.max(current, hit);
}
