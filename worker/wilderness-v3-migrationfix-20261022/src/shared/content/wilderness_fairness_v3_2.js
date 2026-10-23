// Wilderness V3.2 combat fairness overlay.
// An explicit successor to the World Combat V1 level-gap *delivery* rule;
// the frozen World Combat policy/hash and historical saves remain unchanged.
// Only committed Wilderness worlds opt into this balance adjustment.
import {hasWorldCombat, worldLevelGapMultiplier} from './world_combat_v1.js';
import {hasWilderness} from './wilderness_v2.js';
import {combatAmount} from '../contracts/combat_amount.js';

export const WILDERNESS_FAIRNESS_V3_2_VERSION = 'wilderness-v3-2-level-fairness-1';
export const WILDERNESS_FAIRNESS_V3_2 = Object.freeze({
  version: WILDERNESS_FAIRNESS_V3_2_VERSION,
  enemyBaseDamage: 'unchanged; no additional multiplier from level difference',
  enemyDamageAmplification: 'boss/elite abilities remain independent of level difference',
  playerOffense: 'preserve exact existing higher-level resistance',
  historicWorldCombatV1: 'immutable; retain published level-gap contract for legacy non-wilderness worlds',
  eligibility: 'world-combat-v1 plus committed wilderness-v2 world binding',
  pendingSeparateTuning: 'cleave reach and simultaneous incoming hit protection',
});

export const usesWildernessFairnessV3_2 = state =>
  hasWorldCombat(state) && hasWilderness(state?.d9World?.plannedWorld);

// Pure, deterministic, no RNG misses. Base attack and defenses still decide
// real incoming damage; all player packet types keep existing resistance.
export function wildernessFairLevelGap(heroLevel, enemyLevel) {
  const old = worldLevelGapMultiplier(heroLevel, enemyLevel);
  return {outgoing: old.outgoing, incoming: combatAmount(1)};
}
