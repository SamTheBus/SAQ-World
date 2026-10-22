import {aegisMimicFor} from '../shared/content/aegis_mimics_v2.js';
import { isWorldPointSafe } from '../shared/contracts/overworld.js';
import { canTargetActor } from './trusted_combat_rules.js';
import {bossActorTargetableD12_5A} from '../shared/contracts/boss_combat_d12_5.js';

// Shared activity target admission: both directions use current authority geometry.
export function canActivityTargetActor(state, manifest, source, target,packet=null) {
  const component=packet?.bossComponentImpact===true&&source?.team==='party'?aegisMimicFor(state,target?.entityId):null,internalFusedHit=component?.mimic.stage==='fused'&&state.entitiesById[component.boss.entityId]?.alive;
  if (!canTargetActor(source, target) || source.residency.spaceInstanceId !== target.residency.spaceInstanceId||!internalFusedHit&&!bossActorTargetableD12_5A(state,target.entityId)) return false;
  const party = source.team === 'party' ? source : target.team === 'party' ? target : null;
  return !(party && party.residency.spaceInstanceId === state.overworldInstanceId && isWorldPointSafe(manifest, party.position));
}

export function canActivityApplyDamage(state, manifest, source, target,packet=null) {
  return canActivityTargetActor(state, manifest, source, target,packet) &&
    !(target.team === 'party' && state.tick < (state.siteExitProtectionByEntityId?.[target.entityId] ?? 0));
}
