import {isCryptFamily} from '../content/planned_crypt_policy_v1.js';
import {buildCryptFamilyV2 as buildCryptFamilyV1} from '../content/crypt_family_runtime_v2.js';
import {isRuinFamily} from '../content/planned_ruin_policy_v1.js';
import {buildRuinFamilyV1} from '../content/ruin_family_runtime_v1.js';
import {isFortFamily} from '../content/planned_fort_policy_v1.js';
import {buildFortFamilyV1} from '../content/fort_family_runtime_v1.js';
import {WOODLAND_CAVE_FAMILY_PACKAGE_D12_2} from '../content/site_families_d12_2.js';
import {buildWoodlandCaveFamilyD12_2} from '../content/site_family_runtime_d12_2.js';
import {bytesToHex,frameUtf8,hashBytes} from './hashing.js';
import {installEliteRecordsD12_4} from './elite_combat_d12_4.js';
import {installBossRecordsD12_5A} from './boss_combat_d12_5.js';
import {advanceSiteRunEpisodeD13C,resolveSiteRunEpisodeD13B,retireSiteEpisodeAuthorityD13C1,siteOccupantsD13C,siteSupportsResetD13C} from './site_run_episode_d13b.js';
import {SITE_FINALE_DEPLOYMENT_D13D_F,SITE_FINALE_RESERVATION_D13D_G,deriveWoodlandCaveFinaleReservationD13D_G,SITE_FINALE_DEPLOYMENT_D13D_B,SITE_FINALE_DEPLOYMENT_D13D_D,SITE_FINALE_RESERVATION_D13D_B,SITE_FINALE_RESERVATION_D13D_E,SMALL_CAVE_FINALE_ESCORT_KEY_D13D_B,SMALL_CAVE_FINALE_LEADER_KEY_D13D_B,STANDARD_CAVE_FINALE_BOSS_KEY_D13D_D,STANDARD_CAVE_FINALE_COCOON_KEYS_D13D_D,STANDARD_CAVE_FINALE_REWARD_D13D_E} from './site_finale_d13d.js';
import {canonicalStringify,copyWire,freezeWire,requireContract as check} from './wire.js';

export const SITE_RESET_D13C='site-reset-d13c1-v1';
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);

const physicalFloor=floor=>{const copy=copyWire(floor);delete copy.groupId;delete copy.enemyIds;return copy;};
export function physicalSiteIdentityD13C(site){
 const copy=copyWire(site);delete copy.conqueredTick;delete copy.discoveredByPlayerIds;delete copy.instanceHash;
 if(copy.interior)delete copy.interior.groupId;
 if(copy.floors)copy.floors=copy.floors.map(physicalFloor);
 return copy;
}

const finaleKeys=new Set([SMALL_CAVE_FINALE_LEADER_KEY_D13D_B,SMALL_CAVE_FINALE_ESCORT_KEY_D13D_B]);
function pendingFinaleIdentityD13D_B(state,currentSite,nextSite){
 const record=state.campaign.siteFinaleReservationsById?.[currentSite.siteId],deployment=state.campaign.siteFinaleDeploymentsById?.[currentSite.siteId],episode=resolveSiteRunEpisodeD13B(state,currentSite.siteId),members=record?.encounterBinding?.members;
 if(record?.version!==SITE_FINALE_RESERVATION_D13D_B||record.siteId!==currentSite.siteId||record.sizeTier!=='small'||currentSite.sizeTier!=='small'||record.finalFloorIndex!==currentSite.floors.length-1||deployment?.version!==SITE_FINALE_DEPLOYMENT_D13D_B||deployment.siteId!==currentSite.siteId||deployment.reservationId!==record.reservationId||!episode||deployment.firstMaterializedEpisode!==episode.episode+1||!Array.isArray(members)||members.length!==2)return false;
 if(members[0].memberKey!==SMALL_CAVE_FINALE_LEADER_KEY_D13D_B||members[1].memberKey!==SMALL_CAVE_FINALE_ESCORT_KEY_D13D_B||currentSite.floors.some(floor=>floor.encounter.members.some(member=>finaleKeys.has(member.memberKey))))return false;
 const expected=physicalSiteIdentityD13C(currentSite),finalFloor=expected.floors[record.finalFloorIndex],keys=expected.encounterProvenance?.floorMemberKeys?.[record.finalFloorId];if(!finalFloor||finalFloor.floorId!==record.finalFloorId||!Array.isArray(keys)||!same(keys,finalFloor.encounter.members.map(member=>member.memberKey)))return false;
 finalFloor.encounter.members.push(...copyWire(members));keys.push(...members.map(member=>member.memberKey));return same(expected,physicalSiteIdentityD13C(nextSite));
}
const standardFinaleKeys=new Set([STANDARD_CAVE_FINALE_BOSS_KEY_D13D_D,...STANDARD_CAVE_FINALE_COCOON_KEYS_D13D_D]);
function pendingStandardFinaleIdentityD13D_D(state,currentSite,nextSite){
 const record=state.campaign.siteFinaleReservationsById?.[currentSite.siteId],deployment=state.campaign.siteFinaleDeploymentsById?.[currentSite.siteId],episode=resolveSiteRunEpisodeD13B(state,currentSite.siteId),members=record?.encounterBinding?.members;
 if(record?.version!==SITE_FINALE_RESERVATION_D13D_E||record.siteId!==currentSite.siteId||record.sizeTier!=='standard'||currentSite.sizeTier!=='standard'||record.rewardBinding?.version!==STANDARD_CAVE_FINALE_REWARD_D13D_E||record.finalFloorIndex!==currentSite.floors.length-1||deployment?.version!==SITE_FINALE_DEPLOYMENT_D13D_D||deployment.siteId!==currentSite.siteId||deployment.reservationId!==record.reservationId||!episode||deployment.firstMaterializedEpisode!==episode.episode+1||!Array.isArray(members)||members.length!==4)return false;
 if(members[0].memberKey!==STANDARD_CAVE_FINALE_BOSS_KEY_D13D_D||!same(members.slice(1).map(member=>member.memberKey),STANDARD_CAVE_FINALE_COCOON_KEYS_D13D_D)||currentSite.floors.some(floor=>floor.encounter.members.some(member=>standardFinaleKeys.has(member.memberKey))))return false;
 const expected=physicalSiteIdentityD13C(currentSite),finalFloor=expected.floors[record.finalFloorIndex],keys=expected.encounterProvenance?.floorMemberKeys?.[record.finalFloorId];if(!finalFloor||finalFloor.floorId!==record.finalFloorId||!Array.isArray(keys)||!same(keys,finalFloor.encounter.members.map(member=>member.memberKey)))return false;
 finalFloor.encounter.members=copyWire(members);expected.encounterProvenance.floorMemberKeys[record.finalFloorId]=members.map(member=>member.memberKey);return same(expected,physicalSiteIdentityD13C(nextSite));
}
function pendingLargeFinaleIdentityD13D_F(state,currentSite,nextSite){
 const record=state.campaign.siteFinaleReservationsById?.[currentSite.siteId],deployment=state.campaign.siteFinaleDeploymentsById?.[currentSite.siteId],episode=resolveSiteRunEpisodeD13B(state,currentSite.siteId);
 if(record?.version!==SITE_FINALE_RESERVATION_D13D_G||currentSite.sizeTier!=='large'||record.rewardBinding?.balanceStatus!=='provisional'||deployment?.version!==SITE_FINALE_DEPLOYMENT_D13D_F||deployment.siteId!==currentSite.siteId||deployment.reservationId!==record.reservationId||!episode||deployment.firstMaterializedEpisode!==episode.episode+1||!same(record,deriveWoodlandCaveFinaleReservationD13D_G(currentSite))||currentSite.floors.some(f=>f.encounter.members.some(m=>String(m.memberKey).startsWith('finale:'))))return false;
 const expected=physicalSiteIdentityD13C(currentSite),floor=expected.floors[record.finalFloorIndex],keys=expected.encounterProvenance.floorMemberKeys[record.finalFloorId];if(!same(keys,floor.encounter.members.map(m=>m.memberKey)))return false;
 floor.encounter.members=copyWire(record.encounterBinding.members);expected.encounterProvenance.floorMemberKeys[record.finalFloorId]=record.encounterBinding.members.map(m=>m.memberKey);
 return same(expected,physicalSiteIdentityD13C(nextSite));
}
export function siteResetIdentityMatchesD13C(state,currentSite,nextSite){return same(physicalSiteIdentityD13C(currentSite),physicalSiteIdentityD13C(nextSite))||pendingFinaleIdentityD13D_B(state,currentSite,nextSite)||pendingStandardFinaleIdentityD13D_D(state,currentSite,nextSite)||pendingLargeFinaleIdentityD13D_F(state,currentSite,nextSite);}

export function transitioningPlayersForSiteD13C(gateway,siteId){
 const players=[];
 for(const entry of Object.values(gateway?.admittedCommandsById??{})){const command=entry.command;if(command?.kind==='site.transition'&&command.payload?.siteId===siteId)players.push(command.playerId);}
 for(const [playerId,row] of Object.entries(gateway?.playersById??{}))for(const command of row.bufferedCommands??[])if(command?.kind==='site.transition'&&command.payload?.siteId===siteId)players.push(playerId);
 return [...new Set(players)].sort();
}

export function siteResetEligibilityD13C(state,siteId,{transitioningPlayerIds=[]}={}){
 const site=state.d9World?.functionalSitesById?.[siteId]??null,reservation=state.d9World?.siteReservationsById?.[siteId]??null,episode=resolveSiteRunEpisodeD13B(state,siteId),occupants=site?siteOccupantsD13C(state,siteId,{connectedOnly:false}):[],reasons=[];
 if(!siteSupportsResetD13C(state,siteId))reasons.push(!site&&reservation?.packageId==='woodland-cave-family'?'site-not-activated':'site-family-not-resettable');
 if(!episode)reasons.push('episode-unavailable');
 else if(episode.status!=='cleared')reasons.push(`episode-${episode.status}`);
 if(occupants.length)reasons.push('site-occupied');
 if(transitioningPlayerIds.length)reasons.push('site-transitioning');
 if(Array.isArray(site?.floors)&&site.floors.some(floor=>!state.groupsById[floor.groupId]?.cleared))reasons.push('encounter-not-cleared');
 return freezeWire({version:SITE_RESET_D13C,siteId,eligible:reasons.length===0,reasons,occupantPlayerIds:occupants,transitioningPlayerIds:[...transitioningPlayerIds],episode:episode?.episode??null,status:episode?.status??null});
}

export async function prepareSiteResetD13C(state,siteId,{sha256,transitioningPlayerIds=[]}){
 const eligibility=siteResetEligibilityD13C(state,siteId,{transitioningPlayerIds});check(eligibility.eligible,`Site reset rejected: ${eligibility.reasons.join(', ')}`);
 const site=state.d9World.functionalSitesById[siteId],episode=resolveSiteRunEpisodeD13B(state,siteId),nextEpisode=episode.episode+1,binding={packageId:site.packageId,packageVersion:site.packageVersion,contentHash:site.contentHash};
 const runtime=await (isCryptFamily(site)?buildCryptFamilyV1:isRuinFamily(site)?buildRuinFamilyV1:isFortFamily(site)?buildFortFamilyV1:buildWoodlandCaveFamilyD12_2)(state,site.socket,binding,{sha256,runEpisode:nextEpisode});
 check(siteResetIdentityMatchesD13C(state,site,runtime.functionalSite),'Site reset changed Cave physical identity');
 check(runtime.spaces.length===site.floors.length&&runtime.spaces.every((space,index)=>space.spaceInstanceId===site.floors[index].spaceInstanceId&&space.spaceId===site.floors[index].logicalSpaceId&&same(space.collision,site.floors[index].collision)),'Site reset changed Cave geometry');
 const digest=await hashBytes(frameUtf8([SITE_RESET_D13C,state.campaign.seed.seedHex,siteId,String(nextEpisode),episode.episodeSeed]),sha256),resetId='reset:'+bytesToHex(digest.slice(0,16));
 return freezeWire({version:SITE_RESET_D13C,resetId,siteId,fromEpisode:episode.episode,toEpisode:nextEpisode,preparedTick:state.tick,oldGroupIds:site.floors.map(floor=>floor.groupId),oldEntityIds:site.floors.flatMap(floor=>floor.enemyIds),runtime});
}

export function commitSiteResetD13C(state,plan,{transitioningPlayerIds=[]}={}){
 check(plan?.version===SITE_RESET_D13C&&plan.preparedTick<=state.tick,'Invalid site reset plan');
 const eligibility=siteResetEligibilityD13C(state,plan.siteId,{transitioningPlayerIds});check(eligibility.eligible,`Site reset changed before commit: ${eligibility.reasons.join(', ')}`);
 const site=state.d9World.functionalSitesById[plan.siteId],episode=resolveSiteRunEpisodeD13B(state,plan.siteId);check(episode.episode===plan.fromEpisode&&plan.toEpisode===plan.fromEpisode+1&&same(site.floors.map(floor=>floor.groupId),plan.oldGroupIds)&&same(site.floors.flatMap(floor=>floor.enemyIds),plan.oldEntityIds),'Stale site reset plan');
 const next=plan.runtime;check(next.groups.every(group=>!state.groupsById[group.groupId])&&next.actors.every(actor=>!state.entitiesById[actor.entityId]),'Site reset identity collision');
 const newGroupIds=next.groups.map(group=>group.groupId),newEntityIds=next.actors.map(actor=>actor.entityId);advanceSiteRunEpisodeD13C(state,site.siteId,{resetId:plan.resetId,resetTick:state.tick,newGroupIds,newEntityIds});retireSiteEpisodeAuthorityD13C1(state,plan.oldGroupIds,plan.oldEntityIds);
 for(const actor of next.actors)state.entitiesById[actor.entityId]=copyWire(actor);
 for(let index=0;index<next.groups.length;index++){const group=next.groups[index];state.groupsById[group.groupId]=copyWire(group);state.encounterEconomy.groups[group.groupId]=copyWire(next.economies[index]);state.d9World.episodes[group.groupId]=copyWire(next.episodes[index]);}
 installEliteRecordsD12_4(state,next.elites??[]);installBossRecordsD12_5A(state,next.bosses??[]);
 state.d9World.runtime.resources.push(...next.resources.map(copyWire));state.d9World.runtime.revision++;state.encounterEconomy.revision++;
 for(let index=0;index<site.floors.length;index++){site.floors[index].groupId=next.groups[index].groupId;site.floors[index].enemyIds=[...next.groups[index].entityIds];site.floors[index].encounter=copyWire(next.functionalSite.floors[index].encounter);}
 site.encounterProvenance=copyWire(next.functionalSite.encounterProvenance);
 site.interior.groupId=site.floors[0].groupId;
 return freezeWire({status:'reset',version:SITE_RESET_D13C,resetId:plan.resetId,siteId:site.siteId,fromEpisode:plan.fromEpisode,toEpisode:plan.toEpisode,episodeSeed:state.campaign.siteRunEpisodesById[site.siteId].episodeSeed,newGroupIds,newEntityIds});
}
