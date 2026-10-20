import {hasWorldCombat} from './world_combat_v1.js';
import {ordinaryEnemyForProfile} from './ordinary_enemies.js';
import {HOSTILE_MOTION_D11_2_VERSION, hostileMeleeMotionD11_2} from './encounter_motion_d11_2.js';

export const WORLD_CLASSIC_MELEE_TIMING = Object.freeze({
  sprout: Object.freeze({windupTicks: 12, impactTicks: 4, recoveryTicks: 10}),
  slime: Object.freeze({windupTicks: 12, impactTicks: 4, recoveryTicks: 10}),
  golem: Object.freeze({windupTicks: 18, impactTicks: 4, recoveryTicks: 12})
});
export const worldHostileMeleeTiming = (state, family) =>
  hasWorldCombat(state) && WORLD_CLASSIC_MELEE_TIMING[family] || hostileMeleeMotionD11_2(family);

// The optional phase/motion records already exist in the saved actor schema.
// Initialize only missing records; a resumed windup or impact is never reset.
export function installWorldHostileMelee(state) {
  if (!hasWorldCombat(state)) return;
  for (const actor of Object.values(state.entitiesById)) {
    const family = ordinaryEnemyForProfile(actor.contentDefinitionId)?.family;
    if (!actor.ai || !worldHostileMeleeTiming(state, family)) continue;
    actor.ai.melee ??= {version: HOSTILE_MOTION_D11_2_VERSION, phase: 'idle',
      phaseStartedTick: state.tick, phaseEndsTick: state.tick, targetEntityId: null, actionSequence: 0};
    actor.ai.motion ??= {version: HOSTILE_MOTION_D11_2_VERSION,
      startedTick: actor.movedLastTick ? state.tick : null, lastMovedTick: actor.movedLastTick ? state.tick : null};
  }
}

export function resolvedHostileMeleeTimer(state, actor) {
  const family = ordinaryEnemyForProfile(actor.contentDefinitionId)?.family;
  // Classic attacks retain their 60-tick hit cadence after adding a warning:
  // windup time is credited toward the next attack's existing cooldown.
  return hasWorldCombat(state) && WORLD_CLASSIC_MELEE_TIMING[family]
    ? Math.min(actor.attackDelayTicks, WORLD_CLASSIC_MELEE_TIMING[family].windupTicks) : 0;
}
