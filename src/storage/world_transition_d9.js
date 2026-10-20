import {isCryptFamily} from '../shared/content/planned_crypt_policy_v1.js';
import {isRuinFamily} from '../shared/content/planned_ruin_policy_v1.js';
import {isFortFamily} from '../shared/content/planned_fort_policy_v1.js';
import {tavernSpaceIds} from '../shared/contracts/campaign_tavern_v1.js';
import {functionalSiteSpaceIdsD12} from '../shared/contracts/functional_site_d9.js';
import {canonicalStringify,copyWire,requireContract as check} from '../shared/contracts/wire.js';
import {validateActivityState} from '../shared/contracts/activity_state.js';
import {validateD8Advance} from '../shared/contracts/participant_progression.js';
import {progressionBigInt} from '../shared/contracts/progression_integer.js';
import {validateInventoryProgress} from '../shared/contracts/player_inventory.js';
import {validatePlayerRespawnProgress} from '../shared/contracts/player_respawn.js';
import {validateEncounterEconomyProgress,encounterAdvanced} from '../shared/contracts/encounter_economy.js';
import {validateOverworldDiscoveryProgress,manifestForState} from '../shared/contracts/overworld.js';
import {localFramePositionD9,projectToLocalFrameD9} from '../shared/contracts/local_world_frames_d9.js';
import {reconcileWorldComparisonPagesD9} from './world_transition_pages_d9.js';
import {siteResetTransitionsD13C,validateSiteRunEpisodeProgressD13B} from '../shared/contracts/site_run_episode_d13b.js';
import {siteResetIdentityMatchesD13C} from '../shared/contracts/site_reset_d13c.js';
import {validateSiteFinaleReservationProgressD13D_A} from '../shared/contracts/site_finale_d13d.js';
import {originHordeUpgradeForGroup,validateOriginHordeProgress} from '../shared/contracts/origin_hordes_v1.js';

const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
// Frame rebasing is not movement of a reward or a change to a historical receipt.
function comparable(state){const s=copyWire(state),frames=s.d9World.runtime.frames,point=(p,space)=>space===s.overworldInstanceId?copyWire(localFramePositionD9(p,frames)):p;
 for(const p of Object.values(s.playersById)){
  for(const r of Object.values(p.inventory.rewardsByEntityId))r.position=point(r.position,r.spaceInstanceId);
  for(const r of Object.values(p.inventory.renewal.groundBySourceId))r.position=point(r.position,r.spaceInstanceId);
  for(const r of [...Object.values(p.inventory.d7.salvaged),...Object.values(p.inventory.d7.autoSalvaged)])if(r.reward)r.reward.position=point(r.reward.position,r.reward.spaceInstanceId);
 }return s;
}
// Compare immutable world receipts through the AFTER computation frame. This
// applies the exact same deterministic rebase operation to both endpoints;
// it does not introduce a positional tolerance or change saved coordinates.
export function alignWorldReceiptComparisonD9(state,frames){
 const point=(p,space)=>{if(space!==state.overworldInstanceId)return p;const local=projectToLocalFrameD9(p,frames);return local?copyWire(localFramePositionD9(local,frames)):p;};
 for(const p of Object.values(state.playersById)){const i=p.inventory;
  for(const r of Object.values(i.rewardsByEntityId))r.position=point(r.position,r.spaceInstanceId);
  for(const r of Object.values(i.renewal.groundBySourceId))r.position=point(r.position,r.spaceInstanceId);
  for(const r of [...Object.values(i.d7.salvaged),...Object.values(i.d7.autoSalvaged)])if(r.reward)r.reward.position=point(r.reward.position,r.reward.spaceInstanceId);
 }return state;
}
export async function validateWorldAdvanceD9(a,b,options){
 validateActivityState(b);check(a.d9World&&b.d9World,'D9 transition required');
 for(const key of ['content','session','overworldInstanceId','proofCase'])check(same(a[key],b[key]),'Immutable campaign identity changed');
 for(const key of ['campaignId','seed','charactersById'])check(same(a.campaign[key],b.campaign[key]),'Campaign identity changed');
 check(a.campaign.saveRevision===b.campaign.saveRevision&&a.campaign.checkpointId===b.campaign.checkpointId,'Unconfirmed campaign revision');
 if(a.d9World.plannedWorld)check(a.d9World.runtimePolicy===b.d9World.runtimePolicy,'Runtime retention contract changed inside campaign');
 if(a.d9World.plannedWorld)check(same(a.d9World.plannedWorld,b.d9World.plannedWorld)&&same(a.d9World.plannedStart,b.d9World.plannedStart),'Pinned planned world changed');else if(b.d9World.plannedWorld)check(a.tick===0&&b.tick===0&&a.d9World.runtime.chunks.length===0&&Object.keys(a.d9World.siteReservationsById).length===0,'Planned binding is genesis-only');
 if(a.d9World.plannedWorld?.cavePrototype)check(same(a.d9World.siteReservationsById,b.d9World.siteReservationsById),'Pinned planned Cave reservation changed');
 for(const key of ['origin','profile','migration'])check(same(a.d9World[key],b.d9World[key]),'Pinned world provenance changed');
 for(const key of ['tick','identitySequence','lastAppliedAuthorityOrder'])check(b[key]>=a[key],'World chronology regressed');
 check(b.eventEmission.lastEventSequence>=a.eventEmission.lastEventSequence,'Event cursor regressed');
 if(a.d9World.settlementInterior)check(same(a.d9World.settlementInterior,b.d9World.settlementInterior),'Immutable town/tavern binding changed');
 const addedTavern=a.d9World.settlementInterior?[]:tavernSpaceIds(b);check(!addedTavern.length||!a.d9World.plannedWorld&&b.tick===0,'Tavern spaces are genesis-only');
 const oldSpaces=Object.keys(a.spacesByInstanceId).sort(),newSpaces=Object.keys(b.spacesByInstanceId).sort(),addedSiteRecords=Object.entries(b.d9World.functionalSitesById).filter(([id])=>!a.d9World.functionalSitesById[id]),addedSites=addedSiteRecords.flatMap(([,site])=>functionalSiteSpaceIdsD12(site));
 check(addedSiteRecords.length<=1&&same([...oldSpaces,...addedSites,...addedTavern].sort(),newSpaces),'Historical space inventory changed');
 for(const [id,space] of Object.entries(a.spacesByInstanceId)){
  if(id!==a.overworldInstanceId)check(same(space,b.spacesByInstanceId[id]),'Historical interior changed');
  else {const {collision,...identity}=space,{collision:ignored,...next}=b.spacesByInstanceId[id];check(same(identity,next),'Overworld space changed');}
 }
 const resets=siteResetTransitionsD13C(a,b),resetSites=new Set(resets.map(row=>row.siteId)),retiredGroups=new Set(resets.flatMap(row=>row.retiredGroupIds)),retiredEntities=new Set(resets.flatMap(row=>row.retiredEntityIds));for(const [id,x] of Object.entries(a.d9World.functionalSitesById)){const y=b.d9World.functionalSitesById[id],identity=resetSites.has(id)?siteResetIdentityMatchesD13C(a,x,y):(isFortFamily(x)||(isRuinFamily(x)||isCryptFamily(x)))?same({...x,conqueredTick:null,discoveredByPlayerIds:[]},{...y,conqueredTick:null,discoveredByPlayerIds:[]})&&x.discoveredByPlayerIds.every(id=>y.discoveredByPlayerIds.includes(id)):same({...x,conqueredTick:null},{...y,conqueredTick:null});check(y&&identity&&(x.conqueredTick===null||y.conqueredTick===x.conqueredTick),'Functional site identity/completion regressed');}
 for(const [id,y] of Object.entries(b.d9World.functionalSitesById))if(!a.d9World.functionalSitesById[id])check(y.conqueredTick===null,'New functional site cannot begin cleared');
 for(const id of a.session.playerIds){
  const p=a.playersById[id],q=b.playersById[id],{progression,inventory,d8,...identity}=p,{progression:nextProgression,inventory:nextInventory,d8:nextD8,...nextIdentity}=q;
  check(same(identity,nextIdentity)&&progressionBigInt(q.progression.totalXp)>=progressionBigInt(p.progression.totalXp),'Participant identity/progression regressed');
  validateD8Advance({...d8,causalXp:{}},nextD8,progression.level,nextProgression.level,a.lastAppliedAuthorityOrder);
  check(b.appliedClientSequences[id]>=a.appliedClientSequences[id],'Applied command cursor regressed');
 }
 for(const [id,site] of Object.entries(a.campaign.sitesById??{})){const next=b.campaign.sitesById[id];check(next?.spaceInstanceId===site.spaceInstanceId&&(site.conqueredTick===null||next.conqueredTick===site.conqueredTick),'Conquest history regressed');}
 validateOverworldDiscoveryProgress(a.campaign.overworld,b.campaign.overworld,manifestForState(b));
 const result=b;a=comparable(a);b=comparable(b);
 if(options)await reconcileWorldComparisonPagesD9(a,b,options);
 alignWorldReceiptComparisonD9(a,result.d9World.runtime.frames);alignWorldReceiptComparisonD9(b,result.d9World.runtime.frames);
 for(const id of a.session.playerIds)for(const [source,row] of Object.entries(a.playersById[id].d8.causalXp))if(!retiredEntities.has(source))for(const [kind,sequence] of Object.entries(row))check((b.playersById[id].d8.causalXp[source]?.[kind]??0)>=sequence,'Mastery causal receipt regressed across paging');
  validateEncounterEconomyProgress(a,b);validateOriginHordeProgress(a,b);validateSiteRunEpisodeProgressD13B(a,b);validateSiteFinaleReservationProgressD13D_A(a,b);
 for(const [id,g] of Object.entries(a.groupsById)){
  if(retiredGroups.has(id)){check(!b.groupsById[id]&&!b.encounterEconomy.groups[id]&&!b.d9World.episodes[id],'Retired group remained in live authority');continue;}
  const h=b.groupsById[id],originUpgrade=originHordeUpgradeForGroup(a,b,id);check(h&&(same(g.entityIds,h.entityIds)||originUpgrade)&&g.spaceInstanceId===h.spaceInstanceId&&g.siteId===h.siteId,'Resident group identity changed');
  const renewed=encounterAdvanced(a,b,id);check(!g.cleared||h.cleared||renewed,'Encounter clear regressed');
  if(g.threatSnapshot&&(g.siteId!==null||a.d9World.episodes[id]?.snapshot)&&!renewed)check(same(g.threatSnapshot,h.threatSnapshot)||originUpgrade,'Frozen encounter rescaled');
 }
 for(const [id,actor] of Object.entries(a.entitiesById)){
  if(retiredEntities.has(id)){check(actor.team==='hostile'&&!b.entitiesById[id],'Invalid actor retirement');continue;}
  const next=b.entitiesById[id],renewed=Object.values(a.groupsById).some(g=>g.entityIds.includes(id)&&encounterAdvanced(a,b,g.groupId));
  check(next&&next.residency.residencyRevision>=actor.residency.residencyRevision&&(actor.team==='party'||actor.alive||!next.alive||renewed),'Actor disappeared/resurrected without lifecycle');
  if(next.residency.residencyRevision===actor.residency.residencyRevision)check(next.residency.spaceInstanceId===actor.residency.spaceInstanceId,'Residency changed without revision');
 }
 validatePlayerRespawnProgress(a,b);validateInventoryProgress(a,b);return result;
}
