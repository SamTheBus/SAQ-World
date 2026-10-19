import { isWorldPointSafe } from '../shared/contracts/overworld.js';
import { canTargetActor } from './trusted_combat_rules.js';
import {bossActorTargetableD12_5A} from '../shared/contracts/boss_combat_d12_5.js';

// Shared activity target admission: both directions use current authority geometry.
export function canActivityTargetActor(state, manifest, source, target) {
  if (!canTargetActor(source, target) || source.residency.spaceInstanceId !== target.residency.spaceInstanceId||!bossActorTargetableD12_5A(state,target.entityId)) return false;
  const party = source.team === 'party' ? source : target.team === 'party' ? target : null;
  return !(party && party.residency.spaceInstanceId === state.overworldInstanceId && isWorldPointSafe(manifest, party.position));
}

export function canActivityApplyDamage(state, manifest, source, target) {
  return canActivityTargetActor(state, manifest, source, target) &&
    !(target.team === 'party' && state.tick < (state.siteExitProtectionByEntityId?.[target.entityId] ?? 0));
}
