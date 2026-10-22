import {aegisComponentProfile} from '../content/aegis_mimics_v2.js';
import {hasWorldCombat,worldEnemyStats,worldBossStats,worldHeroKillXp} from '../content/world_combat_v1.js';
import {worldOrdinaryMeleeProfile} from '../content/world_melee_geometry.js';
import { closedRecord, requireContract, safeInteger } from './wire.js';
import { MAX_PLAYER_LEVEL } from './player_progression.js';
import { ordinaryEnemyForProfile, ORDINARY_PROFILES, resolveOrdinaryProfile } from '../content/ordinary_enemies.js';
import { resolveThreatPower, THREAT_TIERS } from './threat_power.js';
import {threatEndpointsD9} from './threat_power_d9.js';
import {positiveProgression,progressionBigInt} from './progression_integer.js';
import {eliteActorProfileD12_4} from './elite_combat_d12_4.js';

export const ENCOUNTER_PROGRESSION_VERSION = 'encounter-progression-d3-v1';
export const D9_THREAT_VERSION='encounter-progression-d9-v1';
export const ORDINARY_XP_VERSION = 'ordinary-kill-xp-d3-v1';
export const ORDINARY_ACTIVITY_RADII = Object.freeze({prepareRadius:768,leaveRadius:960});
export function ordinaryTier(profileId) {
  const index=ORDINARY_PROFILES.findIndex(p=>p.contentDefinitionId===profileId);
  return index<0?null:THREAT_TIERS[index%4];
}
export function encounterActorProfile(state, group, actor) {
  const enemy=ordinaryEnemyForProfile(actor.contentDefinitionId);
  const level=group.threatSnapshot?.levelsByEntityId[actor.entityId];
  let profile;if(enemy&&level!==undefined&&group.threatSnapshot.version===D9_THREAT_VERSION){const stats=hasWorldCombat(state)?worldEnemyStats(level,ordinaryTier(actor.contentDefinitionId),enemy.budget):threatEndpointsD9(level,ordinaryTier(actor.contentDefinitionId),enemy.budget);profile={...state.content.definitionsById[actor.contentDefinitionId],maxHp:stats.maxHp,attackDamage:stats.attackDamage};}
  else profile=enemy&&level!==undefined?resolveOrdinaryProfile(enemy,ordinaryTier(actor.contentDefinitionId),level):state.content.definitionsById[actor.contentDefinitionId];
  if(hasWorldCombat(state)&&profile?.isBoss&&level!==undefined)profile={...profile,...worldBossStats(level)};return aegisComponentProfile(state,actor,eliteActorProfileD12_4(state,actor,worldOrdinaryMeleeProfile(state,profile)));
}
export function ordinaryKillXp(actor, group, state=null,participant=null) {
  const enemy=ordinaryEnemyForProfile(actor.contentDefinitionId);
  if(hasWorldCombat(state)&&participant){const boss=Boolean(state.content.definitionsById[actor.contentDefinitionId]?.isBoss);if(!enemy&&!boss)return 0;return worldHeroKillXp(group.threatSnapshot.levelsByEntityId[actor.entityId],participant.progression.level,ordinaryTier(actor.contentDefinitionId)??'C',Boolean(state.eliteCombat?.elitesByEntityId[actor.entityId]),boss);}
  if(!enemy)return hasWorldCombat(state)&&state.content.definitionsById[actor.contentDefinitionId]?.isBoss?worldBossStats(group.threatSnapshot.levelsByEntityId[actor.entityId]).xp:0;
  const level=group.threatSnapshot?.levelsByEntityId[actor.entityId];
  if(hasWorldCombat(state))return worldEnemyStats(level,ordinaryTier(actor.contentDefinitionId),enemy.budget,Boolean(state.eliteCombat?.elitesByEntityId[actor.entityId])).xp;
  if(group.threatSnapshot?.version===D9_THREAT_VERSION)return threatEndpointsD9(level,ordinaryTier(actor.contentDefinitionId),{...enemy.budget,xp:({sprout:20,slime:20,golem:25,gargoyle:24,rust_nibbler:18,animated_armor:25,cursed_blade:22})[enemy.family]}).xp;
  safeInteger(level,1,MAX_PLAYER_LEVEL);
  return Math.round(({sprout:20,slime:20,golem:25,gargoyle:24,rust_nibbler:18,animated_armor:25,cursed_blade:22})[enemy.family]*resolveThreatPower(level,ordinaryTier(actor.contentDefinitionId)).power);
}
// Includes living participants regardless of local rendering/connection. At most four.
export function eligibleNearbyParticipants(state, instanceId, points, radius) {
  return Object.values(state.playersById).filter(p=>{
    const a=state.entitiesById[p.entityId];
    return a.alive&&a.residency.spaceInstanceId===instanceId&&points.some(point=>Math.hypot(a.position.x-point.x,a.position.y-point.y)<=radius);
  }).sort((a,b)=>a.playerId.localeCompare(b.playerId));
}
export function validateEncounterProgression(state, group) {
  requireContract(typeof group.threatReady==='boolean','Missing encounter reset state');
  const snapshot=group.threatSnapshot;
  if(snapshot===null){requireContract(group.threatReady,'Missing locked threat snapshot');return;}
  closedRecord(snapshot,['version','activatedTick','levelsByEntityId']);
  requireContract(snapshot.version===ENCOUNTER_PROGRESSION_VERSION||state.d9World&&snapshot.version===D9_THREAT_VERSION,'Unsupported encounter progression');
  safeInteger(snapshot.activatedTick,0,state.tick);
  closedRecord(snapshot.levelsByEntityId,group.entityIds);
  const liveLevels=new Set();
  for(const id of group.entityIds){if(snapshot.version===D9_THREAT_VERSION)positiveProgression(snapshot.levelsByEntityId[id]);else safeInteger(snapshot.levelsByEntityId[id],1,MAX_PLAYER_LEVEL);if(state.entitiesById[id].alive)liveLevels.add(progressionBigInt(snapshot.levelsByEntityId[id]).toString());}
  requireContract(liveLevels.size<=1,'Split live group threat');
  if(group.siteId!==null)requireContract(!group.threatReady||state.d9World?.episodes[group.groupId]?.snapshot===null,'Site snapshot cannot thaw');
}
