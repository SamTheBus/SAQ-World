import {hasWorldCombat} from './world_combat_v1.js';
import {ordinaryEnemyForProfile} from './ordinary_enemies.js';

// World cleave measures the clear gap between combat hulls. Imported ordinary
// enemies previously used a 20px center distance, leaving a ~32px band where
// a slower enemy could never retaliate against a retreating primary swing.
// Use the same 32px hull-gap geometry for ordinary melee. Family movement,
// attack cadence, telegraph phases and line-of-sight checks remain unchanged.
export function worldOrdinaryMeleeProfile(state, profile) {
  return hasWorldCombat(state) && ordinaryEnemyForProfile(profile?.contentDefinitionId)
    ? {...profile, attackReach: 32, attackReachMode: 'clearHullGap'}
    : profile;
}
