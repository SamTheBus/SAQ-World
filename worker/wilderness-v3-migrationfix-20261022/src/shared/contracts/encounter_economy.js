import {hasWorldCombat,WORLD_COMBAT_HASH} from '../content/world_combat_v1.js';
import {prototypeRewardProgression,rewardProgression} from '../content/reward_progression.js';
import {rewardProgressionD9} from '../content/reward_progression_d9.js';
import {positiveProgression} from './progression_integer.js';
import {combatInteger,asCombatAmount,minCombat,addCombat,multiplyCombat,roundCombat} from './combat_amount.js';
import {closedRecord,copyWire,requireContract,safeInteger,canonicalStringify} from './wire.js';
import {ordinaryTier,encounterActorProfile,ORDINARY_ACTIVITY_RADII} from './encounter_progression.js';
import {episodeRewardId,hashReward,CONTENT_REWARD_VERSION} from '../content/economy_rewards.js';
import {installRenewableInventory,hasUnresolvedGear,retireEncounterRewards,awardEpisodeReward,prepareEpisodeReward,applyEpisodeReward,lineToPoint,autoSalvageEligibleRewards} from './renewable_inventory.js';
import {collidesWithTiles} from '../rules/world_geometry.js';
import {boundedCombatInteger,combatIntegerWire} from './combat_integer.js';
import {advanceVacancyD9,unfrozenEpisodeD9} from './episode_progression_d9.js';
import {D9_PROFILE} from '../content/world_profile_d9.js';
import {admitContentNumericD9} from './content_numeric_admission_d9.js';
import {progressionBigInt,progressionWire} from './progression_integer.js';
import {legacyWorldPosition} from './world_address.js';
import {functionalSiteGroupsD12} from './functional_site_d9.js?v=wilderness-v3-5-ecology-20261022';
import {siteResetTransitionsD13C} from './site_run_episode_d13b.js';
import {rewardClassForCompletionResourceD13D_C} from './boss_completion_reward_d12_5d.js';
import {ensurePersonalFinaleClaimsD13D_G1,markPersonalFinaleClaimD13D_G1,personalFinaleClaimD13D_G1,validatePersonalFinaleClaimsD13D_G1} from './site_finale_completion_d13d.js';
import {originHordeUpgradeForGroup} from './origin_hordes_v1.js';
import {adoptOrdinaryRosters} from './ordinary_roster_v1.js?v=wilderness-v3-5-ecology-20261022';
import {adoptOrdinaryRostersV2} from './ordinary_roster_v2.js?v=wilderness-v3-5-ecology-20261022';
const stateMax=a=>(typeof a.maxHp==='string'||a.maxHp.n!==undefined||a.maxHp.chunks)?0:boundedCombatInteger(a.maxHp);
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
export const inSettlement=(s,m,a)=>a.residency.spaceInstanceId===s.overworldInstanceId&&m.safeRegions.some(r=>a.position.x>=r.x&&a.position.x<r.x+r.width&&a.position.y>=r.y&&a.position.y<r.y+r.height);
export function installEncounterEconomy(s,m){if(s.encounterEconomy)return s;const groups={};for(const g of Object.values(s.groupsById))groups[g.groupId]={episode:0,startedTick:s.tick,eligibleReturn:0,clearedTick:g.cleared?s.tick:null,vacatedTick:null,usedResources:{}};
 s.encounterEconomy={version:CONTENT_REWARD_VERSION,revision:0,returnSequence:0,lastReturnTick:null,groups,outingsByPlayer:Object.fromEntries(Object.values(s.playersById).map(p=>[p.playerId,{wasInTown:inSettlement(s,m,s.entitiesById[p.entityId]),earnedOutside:false}]))};
 for(const p of Object.values(s.playersById))installRenewableInventory(s,p);return s;
}
const layouts=new WeakMap(),d9Layouts=new WeakMap();
export function encounterResourceLayout(s,m){if(s.d9World){const cached=d9Layouts.get(s);if(cached?.revision===s.d9World.runtime.revision)return cached.value;const out={};for(const r of [...s.d9World.origin.resources,...s.d9World.runtime.resources]){(out[r.groupId]??=[]).push(r);}d9Layouts.set(s,{revision:s.d9World.runtime.revision,value:out});return out;}let result=layouts.get(m);if(result)return result;
 const sources=[...(m.population?.groups??[]),...(m.siteInteriors??[]).flatMap(d=>d.groups)],used=[],byGroup={};
 for(let index=0;index<sources.length;index++){const def=sources[index],g=s.groupsById[def.groupId],c=s.spacesByInstanceId[g.spaceInstanceId].collision,home=def.members[0].position,count=[1,3,2][index%3],resources=[];
  for(let n=0;n<count+(index%3===2?1:0);n++){const kind=n===count?'chest':'breakable',h=hashReward(`${def.groupId}/resource/${n}`);let point=null;
   for(let attempt=0;attempt<160;attempt++){const a=((h%360)+attempt*137.508)*Math.PI/180,r=48+(attempt%5)*24,q={x:Math.round(home.x+Math.cos(a)*r),y:Math.round(home.y+Math.sin(a)*r)};
    if(collidesWithTiles(c,q.x,q.y,12)||g.spaceInstanceId===s.overworldInstanceId&&m.safeRegions.some(z=>q.x>z.x-24&&q.x<z.x+z.width+24&&q.y>z.y-24&&q.y<z.y+z.height+24)||used.some(o=>o.spaceInstanceId===g.spaceInstanceId&&Math.hypot(o.position.x-q.x,o.position.y-q.y)<38)||def.members.some(a=>Math.hypot(a.position.x-q.x,a.position.y-q.y)<26)||!lineToPoint(s,{alive:true,position:home,residency:{spaceInstanceId:g.spaceInstanceId}},g.spaceInstanceId,q,180))continue;
    point=q;break;
   }
   requireContract(point,'No legal environmental resource placement');const r={groupId:g.groupId,ordinal:n,kind,art:kind==='chest'?'chest':['pot','barrel','urn'][h%3],position:point,spaceInstanceId:g.spaceInstanceId};resources.push(r);used.push(r);
  }byGroup[g.groupId]=resources;
 }result=Object.freeze(byGroup);layouts.set(m,result);return result;
}
// Frozen presentation-independent content depth for each encounter episode.
// Migrated episodes retain the accepted D7 prototype mapping; future authored
// content can supply explicit depth without consulting a participant's level.
export function installD8EncounterDepth(s){for(const [id,e] of Object.entries(s.encounterEconomy?.groups??{})){if(e.contentDepth!==undefined)continue;const g=s.groupsById[id],rank=ordinaryTier(s.entitiesById[g.entityIds[0]].contentDefinitionId)??'C';e.contentDepth=prototypeRewardProgression(rank,id).sourceDepth;}return s;}
export function episodeSource(s,g,kind,ordinal,rewardClass=null){const e=s.encounterEconomy.groups[g.groupId],episode=e.episode,sourceEntityId=episodeRewardId(g.groupId,episode,kind,ordinal),d9=s.d9World?.episodes[g.groupId],progression=d9?(d9.snapshot?{...rewardProgressionD9(d9.snapshot.sourceDepth,sourceEntityId),episodeSnapshotId:d9.snapshot.snapshotId,...(hasWorldCombat(s)?{combatHash:WORLD_COMBAT_HASH,combatQuality:kind==='chest'?'completion':kind==='enemy'&&(s.eliteCombat?.elitesByEntityId[g.entityIds[ordinal]]||s.bossCombat?.bossesByEntityId[g.entityIds[ordinal]])?'elite':'ordinary'}:{})}:null):e.contentDepth!==undefined?rewardProgression(e.contentDepth,sourceEntityId):null;return {groupId:g.groupId,episode,kind,spawnOrdinal:ordinal,sourceEntityId,rank:ordinaryTier(s.entitiesById[g.entityIds[0]].contentDefinitionId)??'C',...(progression?{progression}:{}),...(rewardClass?{rewardClass}:{})};}
export function economicResources(s,m,playerId=null,spaceInstanceId=null){const layout=encounterResourceLayout(s,m);return Object.values(layout).flat().filter(r=>spaceInstanceId===null||r.spaceInstanceId===spaceInstanceId).map(r=>{
 // Presentation needs only the stable source identity. Constructing a complete
 // reward progression here repeated reward validation on every rendered frame;
 // actual resource use still builds and admits its full source in the normal path.
 const group=s.groupsById[r.groupId],economy=s.encounterEconomy.groups[group.groupId],episode=economy.episode,sourceEntityId=episodeRewardId(group.groupId,episode,r.kind,r.ordinal),rewardClass=rewardClassForCompletionResourceD13D_C(s,r),claim=playerId?personalFinaleClaimD13D_G1(s,r.groupId,sourceEntityId,playerId):null,record=economy.personalCompletionClaimsBySourceId?.[sourceEntityId],used=claim?claim.claimed:record?record.eligiblePlayerIds.every(id=>record.claimedByPlayerId[id]):Boolean(economy.usedResources[sourceEntityId]);
 return {...r,episode,sourceEntityId,...(rewardClass?{rewardClass}:{}),...(claim?{personalClaim:claim}:{}),used};
 });}
export function resourceForCommand(s,m,payload,playerId=null){const e=s.encounterEconomy?.groups[payload.groupId];if(!e||e.episode!==payload.episode)return null;const r=encounterResourceLayout(s,m)[payload.groupId]?.find(r=>r.ordinal===payload.ordinal);if(!r||r.completion&&!s.groupsById[r.groupId]?.cleared)return null;const sourceEntityId=episodeRewardId(r.groupId,e.episode,r.kind,r.ordinal),claim=playerId?personalFinaleClaimD13D_G1(s,r.groupId,sourceEntityId,playerId):null;return claim?claim.eligible&&!claim.claimed?r:null:!e.usedResources[sourceEntityId]?r:null;}
export function canUseResource(s,m,p,payload){const r=resourceForCommand(s,m,payload,p.playerId),a=s.entitiesById[p.entityId],primary=s.primary.actorsById[p.entityId];return Boolean(r&&p.inventory.revision===payload.inventoryRevision&&!primary.current&&!primary.heldCommandId&&!primary.queuedCommandId&&lineToPoint(s,a,r.spaceInstanceId,r.position,48));}
export function markEarning(s,m,p){const a=s.entitiesById[p.entityId];if(a.alive&&!inSettlement(s,m,a))s.encounterEconomy.outingsByPlayer[p.playerId].earnedOutside=true;}
export function useEconomicResource(s,m,p,payload,prepareEpisode=null){const r=resourceForCommand(s,m,payload,p.playerId);requireContract(r,'Stale environmental resource');if(s.d9World?.episodes[r.groupId]&&!s.d9World.episodes[r.groupId].snapshot){requireContract(prepareEpisode,'D9 resource requires authoritative progression admission');prepareEpisode(s.groupsById[r.groupId],r.position);}const rewardClass=rewardClassForCompletionResourceD13D_C(s,r),source=episodeSource(s,s.groupsById[r.groupId],r.kind,r.ordinal,rewardClass),personal=personalFinaleClaimD13D_G1(s,r.groupId,source.sourceEntityId,p.playerId),players=personal?[p]:Object.values(s.playersById).filter(p=>lineToPoint(s,s.entitiesById[p.entityId],r.spaceInstanceId,r.position,ORDINARY_ACTIVITY_RADII.prepareRadius)).sort((a,b)=>a.playerId.localeCompare(b.playerId));
 const plans=s.d9World?players.map(p=>prepareEpisodeReward(s,p,source,r.position,r.spaceInstanceId)):null;
 if(personal)markPersonalFinaleClaimD13D_G1(s,r.groupId,source.sourceEntityId,p.playerId);else s.encounterEconomy.groups[r.groupId].usedResources[source.sourceEntityId]={tick:s.tick,playerIds:players.map(p=>p.playerId)};
 for(const [i,p] of players.entries()){const reward=plans?applyEpisodeReward(s,p,plans[i]):awardEpisodeReward(s,p,source,r.position,r.spaceInstanceId);if(reward?.healing){const actor=s.entitiesById[p.entityId],max=stateMax(actor);actor.hp=s.subweaponCombat?combatInteger(minCombat(actor.maxHp,addCombat(actor.hp,roundCombat(multiplyCombat(actor.maxHp,15,100))))):structuredClone(combatIntegerWire(Math.min(max,boundedCombatInteger(actor.hp)+Math.round(max*.15))));}markEarning(s,m,p);}
 s.encounterEconomy.revision++;
}
export function createEncounterRenewal(s,m,onRenew){const layout=encounterResourceLayout(s,m),defs=new Map([...(m.population?.groups??[]),...(m.siteInteriors??[]).flatMap(d=>d.groups)].map(g=>[g.groupId,g]));
 const near=(g,a,r)=>a.residency.spaceInstanceId===g.spaceInstanceId&&(g.siteId!==null||!inSettlement(s,m,a))&&(g.siteId!==null||defs.get(g.groupId).members.some(member=>Math.hypot(a.position.x-member.position.x,a.position.y-member.position.y)<=r));
 function tick(){const econ=s.encounterEconomy,actors=Object.values(s.playersById).map(p=>s.entitiesById[p.entityId]);
  // Every participant counts for vacancy, including dead/disconnected residents.
  for(const g of Object.values(s.groupsById)){const e=econ.groups[g.groupId];if(!g.cleared)continue;if(e.clearedTick===null){e.clearedTick=s.tick;ensurePersonalFinaleClaimsD13D_G1(s,g.groupId);}
   const occupied=actors.some(a=>near(g,a,ORDINARY_ACTIVITY_RADII.leaveRadius));
   if(Object.values(s.d9World?.functionalSitesById??{}).some(site=>functionalSiteGroupsD12(site).includes(g.groupId)))continue;
   const procedural=s.d9World?.episodes[g.groupId];if(procedural&&!procedural.origin){
    procedural.clearedTick=e.clearedTick;
    const next=advanceVacancyD9(procedural,{tick:s.tick,occupied,obligationsResolved:!hasUnresolvedGear(s,g.groupId)});
    s.d9World.episodes[g.groupId]=next;e.vacatedTick=next.vacatedTick;
   }else {if(!occupied){if(e.vacatedTick===null)e.vacatedTick=s.tick;}else {e.vacatedTick=null;}if(procedural){procedural.clearedTick=e.clearedTick;procedural.vacatedTick=e.vacatedTick;}}
  }
  for(const p of Object.values(s.playersById)){const a=s.entitiesById[p.entityId],o=econ.outingsByPlayer[p.playerId],town=inSettlement(s,m,a);
   if(!a.alive)o.earnedOutside=false;
   if(town&&!o.wasInTown&&o.earnedOutside&&a.alive&&a.movedLastTick){econ.returnSequence=safeInteger(econ.returnSequence+1,1);econ.lastReturnTick=s.tick;o.earnedOutside=false;econ.revision++;
    // The qualifying return belongs to the cleared/vacated encounter even when
    // personal gear still needs resolution. The unresolved obligation remains
    // the renewal gate; resolving the final item does not require a second trip.
    for(const g of Object.values(s.groupsById)){const e=econ.groups[g.groupId],episode=s.d9World?.episodes[g.groupId];if((!episode||episode.origin)&&g.cleared&&e.vacatedTick!==null&&e.vacatedTick<=s.tick)e.eligibleReturn=econ.returnSequence;}
   }o.wasInTown=town;
  }
  // Generated encounter loot receives a coarse, active-simulation deadline.
  // Only already-vacated cleared encounters are scanned, at most once/second.
  if(s.tick%60===0)autoSalvageEligibleRewards(s);
  for(const g of Object.values(s.groupsById)){const e=econ.groups[g.groupId],existing=s.d9World?.episodes[g.groupId];if(Object.values(s.d9World?.functionalSitesById??{}).some(site=>functionalSiteGroupsD12(site).includes(g.groupId))||existing&&!existing.origin||!g.cleared||!e.eligibleReturn||s.tick<=econ.lastReturnTick||hasUnresolvedGear(s,g.groupId))continue;
   const visitors=actors.filter(a=>a.alive&&near(g,a,ORDINARY_ACTIVITY_RADII.prepareRadius));if(!visitors.length)continue;
   let originEpisode=null;
   if(s.d9World){
    const rank=ordinaryTier(s.entitiesById[g.entityIds[0]].contentDefinitionId)??'C',highest=Object.values(s.playersById).filter(p=>visitors.includes(s.entitiesById[p.entityId])).reduce((n,p)=>progressionBigInt(p.progression.level)>n?progressionBigInt(p.progression.level):n,1n);admitContentNumericD9(progressionWire(highest),rank);
    const address=legacyWorldPosition(defs.get(g.groupId).members[0].position);
    originEpisode={...unfrozenEpisodeD9('origin:'+g.groupId,safeInteger(e.episode+1),{origin:true}),...(existing?.ordinaryRoster?{ordinaryRoster:copyWire(existing.ordinaryRoster)}:{}),...(existing?.ordinaryRosterV2?{ordinaryRosterV2:copyWire(existing.ordinaryRosterV2)}:{}),geography:existing?.geography??{chunkX:address.chunkX,chunkY:address.chunkY,anchorOrdinal:0,minimumLevel:1,rank}};
   }
   // Eligibility was recorded only while the entire space was vacant. Returning
   // participants encounter the new occupation together; there is no live reset.
   retireEncounterRewards(s,g.groupId);e.episode=safeInteger(e.episode+1,1);e.startedTick=s.tick;e.clearedTick=null;e.vacatedTick=null;e.eligibleReturn=0;e.usedResources={};delete e.personalCompletionClaimsBySourceId;g.cleared=false;
   if(originEpisode){s.d9World.episodes[g.groupId]=originEpisode;e.contentDepth=1;g.threatSnapshot=null;g.threatReady=true;}
   for(const member of defs.get(g.groupId).members){const a=s.entitiesById[member.entityId],profile=encounterActorProfile(s,g,a);a.position={...member.position};a.hp=structuredClone((s.subweaponCombat?combatInteger(profile.maxHp):profile.maxHp));a.maxHp=structuredClone(a.hp);a.attackDamage=structuredClone((s.subweaponCombat?combatInteger(profile.attackDamage):profile.attackDamage));a.alive=true;a.attackTimer=0;a.movementIntent={x:0,y:0};a.movedLastTick=false;delete a.ai.defeatedTick;if(a.ai.melee)Object.assign(a.ai.melee,{phase:'idle',phaseStartedTick:s.tick,phaseEndsTick:s.tick,targetEntityId:null});if(a.ai.motion)Object.assign(a.ai.motion,{startedTick:null,lastMovedTick:null});}
   if(g.siteId===null)g.threatReady=true;adoptOrdinaryRosters(s,{groupIds:[g.groupId],safe:false,freshEpisodes:{[g.groupId]:e.episode-1}});adoptOrdinaryRostersV2(s,{groupIds:[g.groupId],safe:false,freshEpisodes:{[g.groupId]:e.episode-1}});econ.revision++;onRenew(g);
  }
 }
 return {tick};
}
export function validateEncounterEconomy(s,m){const e=s.encounterEconomy;if(!e)return;closedRecord(e,['version','revision','returnSequence','lastReturnTick','groups','outingsByPlayer']);requireContract(e.version===CONTENT_REWARD_VERSION,'Unknown content economy');safeInteger(e.revision);safeInteger(e.returnSequence);if(e.lastReturnTick!==null)safeInteger(e.lastReturnTick,0,s.tick);requireContract(same(Object.keys(e.groups).sort(),Object.keys(s.groupsById).sort()),'Episode registry differs from encounters');closedRecord(e.outingsByPlayer,s.session.playerIds);for(const o of Object.values(e.outingsByPlayer)){closedRecord(o,['wasInTown','earnedOutside']);requireContract(typeof o.wasInTown==='boolean'&&typeof o.earnedOutside==='boolean','Invalid outing flags');}
 const layout=encounterResourceLayout(s,m);for(const [id,r] of Object.entries(e.groups)){closedRecord(r,['episode','startedTick','eligibleReturn','clearedTick','vacatedTick','usedResources'],['contentDepth','personalCompletionClaimsBySourceId']);if(r.contentDepth!==undefined){if(s.d9World?.episodes[id]){positiveProgression(r.contentDepth);requireContract(same(r.contentDepth,s.d9World.episodes[id].snapshot?.sourceDepth??s.d9World.episodes[id].geography.minimumLevel),'Episode depth drift');}else safeInteger(r.contentDepth,1,10000);}safeInteger(r.episode);safeInteger(r.startedTick,0,s.tick);safeInteger(r.eligibleReturn,0,e.returnSequence);if(r.clearedTick!==null)safeInteger(r.clearedTick,r.startedTick,s.tick);if(r.vacatedTick!==null)safeInteger(r.vacatedTick,r.clearedTick??r.startedTick,s.tick);if(r.eligibleReturn)requireContract(s.groupsById[id].cleared&&r.clearedTick!==null,'Uncleared encounter eligible for renewal');const valid=new Set((layout[id]??[]).map(q=>episodeRewardId(id,r.episode,q.kind,q.ordinal)));for(const [key,v] of Object.entries(r.usedResources)){requireContract(valid.has(key),'Resource incarnation mismatch');closedRecord(v,['tick','playerIds']);safeInteger(v.tick,r.startedTick,s.tick);requireContract(v.playerIds.length>0&&same([...new Set(v.playerIds)].sort(),v.playerIds)&&v.playerIds.every(id=>s.playersById[id]),'Resource award participants');}validatePersonalFinaleClaimsD13D_G1(s,id,r);}
}
export function encounterAdvanced(a,b,groupId){return Boolean(a.encounterEconomy&&b.encounterEconomy&&b.encounterEconomy.groups[groupId].episode>a.encounterEconomy.groups[groupId].episode);}
export function validateEncounterEconomyProgress(a,b){
 if(!a.encounterEconomy)return;const x=a.encounterEconomy,y=b.encounterEconomy;
 requireContract(y&&y.version===x.version&&y.revision>=x.revision&&y.returnSequence>=x.returnSequence,'Episode chronology regressed');
 const retired=new Set(siteResetTransitionsD13C(a,b).flatMap(row=>row.retiredGroupIds));
 for(const [id,g] of Object.entries(x.groups)){
  const n=y.groups[id],prior=a.d9World?.episodes[id],next=b.d9World?.episodes[id];if(retired.has(id)){requireContract(!n&&!next&&!b.groupsById[id],'Retired encounter remained live');continue;}requireContract(n&&n.episode>=g.episode&&n.startedTick>=g.startedTick,'Encounter episode regressed');
  if(prior){
   requireContract(next&&next.anchorId===prior.anchorId&&same(next.geography,prior.geography),'Procedural encounter geography changed');
   if(n.episode===g.episode&&prior.snapshot)requireContract(same(prior.snapshot,next.snapshot),'Frozen procedural progression changed');
   if(n.episode>g.episode&&!prior.origin){const r=next.renewalReceipt;requireContract(r?.version==='procedural-renewal-d9-v1'&&r.fromEpisode===n.episode-1&&r.renewedTick===n.startedTick&&r.renewedTick>=a.tick&&r.clearedTick!==null&&r.vacatedTick>=r.clearedTick&&r.renewedTick-r.vacatedTick>=D9_PROFILE.renewalVacancyTicks,'Procedural renewal lacks vacancy receipt');}
  }else if(g.contentDepth!==undefined&&!(next?.origin&&n.episode>g.episode))requireContract(n.contentDepth===g.contentDepth||originHordeUpgradeForGroup(a,b,id),'Frozen encounter content depth changed');
  if(n.episode===g.episode){requireContract(n.startedTick===g.startedTick,'Episode start changed');for(const [key,personal] of Object.entries(g.personalCompletionClaimsBySourceId??{})){const nextRecord=n.personalCompletionClaimsBySourceId?.[key],beforeClaimed=Object.keys(personal.claimedByPlayerId),afterClaimed=Object.keys(nextRecord?.claimedByPlayerId??{});requireContract(nextRecord&&same({...personal,claimedByPlayerId:{}},{...nextRecord,claimedByPlayerId:{}})&&beforeClaimed.every(playerId=>same(personal.claimedByPlayerId[playerId],nextRecord.claimedByPlayerId[playerId]))&&beforeClaimed.every(playerId=>afterClaimed.includes(playerId)),'Personal completion claim regressed');}for(const [key,r] of Object.entries(g.usedResources)){const personal=g.personalCompletionClaimsBySourceId?.[key];if(personal)requireContract(r.tick===n.usedResources[key]?.tick&&r.playerIds.every(playerId=>n.usedResources[key]?.playerIds.includes(playerId)),'Personal completion provenance regressed');else requireContract(same(n.usedResources[key],r),'Consumed resource reset');}}
  else if(!prior||prior.origin)requireContract(n.startedTick>=a.tick&&(y.returnSequence>x.returnSequence||g.eligibleReturn>0),'Renewal lacks settlement return');
 }
}
