import {isCryptFamily} from '../content/planned_crypt_policy_v1.js';
import {isRuinFamily} from '../content/planned_ruin_policy_v1.js';
import {BOSS_COMPLETION_REWARD_CLASS,SITE_FINALE_ELITE_PACK_COMPLETION_REWARD_CLASS,SITE_FINALE_PROVISIONAL_COMPLETION_REWARD_CLASS,episodeRewardId} from '../content/economy_rewards.js';
import {collidesWithTiles} from '../rules/world_geometry.js';
import {projectToLocalFrameD9} from './local_world_frames_d9.js';
import {floorDiv,normalizeWorldPosition} from './world_address.js';
import {largeCaveFinaleCompletionActiveD13D_G,smallCaveFinaleCompletionActiveD13D_C,standardCaveBossCompletionActiveD13D_E} from './site_finale_d13d.js';
import {canonicalStringify,closedRecord,copyWire,freezeWire,requireContract,safeInteger} from './wire.js';

export const SMALL_CAVE_FINALE_EXTRACTION_D13D_C='small-cave-finale-extraction-d13d-c-v1';
export const STANDARD_CAVE_BOSS_EXTRACTION_D13D_E='standard-cave-boss-extraction-d13d-e-v1';
export const LARGE_CAVE_FINALE_EXTRACTION_D13D_G='large-cave-finale-extraction-d13d-g-v1';
export const PERSONAL_FINALE_CLAIMS_D13D_G1='site-finale-personal-claims-d13d-g1-v1';

const hash=text=>{let value=2166136261;for(let index=0;index<text.length;index++)value=Math.imul(value^text.charCodeAt(index),16777619);return value>>>0;};
const cellCenter=value=>{const [x,y]=value.split(',').map(Number);return {x:(x+.5)*32,y:(y+.5)*32};};

function contextForGroup(state,groupId){
 for(const site of Object.values(state.d9World?.functionalSitesById??{})){
  if((isRuinFamily(site)||isCryptFamily(site))){const floor=site.floors.find(f=>f.groupId===groupId);if(floor)return {site,floor,rewardClass:null};continue;}
  // The immutable reservation identifies the sole completion group. Avoid
  // validating unrelated finales when projecting a different floor/resource.
  const reservation=state.campaign.siteFinaleReservationsById?.[site.siteId],floor=site.floors?.[reservation?.finalFloorIndex];
  if(floor?.groupId!==groupId)continue;
  const small=smallCaveFinaleCompletionActiveD13D_C(state,site),standard=standardCaveBossCompletionActiveD13D_E(state,site),large=largeCaveFinaleCompletionActiveD13D_G(state,site);if(!small&&!standard&&!large)continue;
  if(floor?.groupId===groupId)return {site,reservation,floor,episode:state.campaign.siteRunEpisodesById[site.siteId],deployment:state.campaign.siteFinaleDeploymentsById[site.siteId],rewardClass:small?SITE_FINALE_ELITE_PACK_COMPLETION_REWARD_CLASS:standard?BOSS_COMPLETION_REWARD_CLASS:SITE_FINALE_PROVISIONAL_COMPLETION_REWARD_CLASS};
 }
 return null;
}

const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
const claimSourceId=(groupId,economy)=>episodeRewardId(groupId,economy.episode,'chest',0);
function occupantsAtClear(state,site){
 const spaces=new Set(site.floors.map(floor=>floor.spaceInstanceId));
 return Object.values(state.playersById).filter(player=>spaces.has(state.entitiesById[player.entityId]?.residency.spaceInstanceId)).map(player=>player.playerId).sort();
}

// Finale eligibility is frozen at authoritative group clearance. The physical
// chest and reward source remain singular; only the participant dispositions
// are personal. This ledger is retired with the episode's encounter economy.
export function ensurePersonalFinaleClaimsD13D_G1(state,groupId,{migration=false}={}){
 const context=contextForGroup(state,groupId),group=state.groupsById[groupId],economy=state.encounterEconomy?.groups?.[groupId];
 if(!context||!group?.cleared||economy?.clearedTick===null||economy?.clearedTick===undefined)return null;
 const sourceEntityId=claimSourceId(groupId,economy),claims=economy.personalCompletionClaimsBySourceId??={};
 if(claims[sourceEntityId])return claims[sourceEntityId];
 const used=economy.usedResources[sourceEntityId],eligible=new Set(occupantsAtClear(state,context.site));
 // Accepted pre-G.1 saves did not retain the clear-time occupancy snapshot.
 // Preserve every proven recipient, and conservatively keep current session
 // participants eligible rather than permanently losing an old global claim.
 if(migration)for(const playerId of state.session.playerIds)eligible.add(playerId);
 for(const playerId of used?.playerIds??[])eligible.add(playerId);
 const claimedByPlayerId=Object.fromEntries((used?.playerIds??[]).sort().map(playerId=>[playerId,{tick:used.tick}]));
 return claims[sourceEntityId]={version:PERSONAL_FINALE_CLAIMS_D13D_G1,sourceEntityId,siteId:context.site.siteId,groupId,episode:economy.episode,clearedTick:economy.clearedTick,eligiblePlayerIds:[...eligible].sort(),claimedByPlayerId};
}

export function installPersonalFinaleClaimsD13D_G1(state,{migration=false}={}){
 for(const groupId of Object.keys(state.groupsById??{}).sort())ensurePersonalFinaleClaimsD13D_G1(state,groupId,{migration});
 return state;
}

export function personalFinaleClaimD13D_G1(state,groupId,sourceEntityId,playerId){
 const record=state.encounterEconomy?.groups?.[groupId]?.personalCompletionClaimsBySourceId?.[sourceEntityId];
 if(!record)return null;
 return freezeWire({personal:true,eligible:record.eligiblePlayerIds.includes(playerId),claimed:Boolean(record.claimedByPlayerId[playerId]),clearedTick:record.clearedTick});
}

export function markPersonalFinaleClaimD13D_G1(state,groupId,sourceEntityId,playerId){
 const economy=state.encounterEconomy.groups[groupId],record=economy.personalCompletionClaimsBySourceId?.[sourceEntityId];
 requireContract(record?.eligiblePlayerIds.includes(playerId)&&!record.claimedByPlayerId[playerId],'Personal completion claim unavailable');
 record.claimedByPlayerId[playerId]={tick:state.tick};
 const claimed=Object.keys(record.claimedByPlayerId).sort(),used=economy.usedResources[sourceEntityId];
 economy.usedResources[sourceEntityId]={tick:used?.tick??state.tick,playerIds:claimed};
 return record.claimedByPlayerId[playerId];
}

export function validatePersonalFinaleClaimsD13D_G1(state,groupId,economy){
 const claims=economy.personalCompletionClaimsBySourceId,context=contextForGroup(state,groupId);if(claims===undefined){requireContract(!(context&&state.groupsById[groupId]?.cleared&&economy.clearedTick!==null),'Cleared production finale lacks personal eligibility snapshot');return true;}
 closedRecord(claims,[],Object.keys(claims));
 requireContract(context&&state.groupsById[groupId]?.cleared&&economy.clearedTick!==null,'Personal completion claims require a cleared production finale');
 const expectedSource=claimSourceId(groupId,economy);requireContract(Object.keys(claims).length===1&&claims[expectedSource],'Personal completion claim source mismatch');
 const record=claims[expectedSource];closedRecord(record,['version','sourceEntityId','siteId','groupId','episode','clearedTick','eligiblePlayerIds','claimedByPlayerId']);
 requireContract(record.version===PERSONAL_FINALE_CLAIMS_D13D_G1&&record.sourceEntityId===expectedSource&&record.siteId===context.site.siteId&&record.groupId===groupId&&record.episode===economy.episode&&record.clearedTick===economy.clearedTick,'Personal completion claim identity drift');
 safeInteger(record.clearedTick,economy.startedTick,state.tick);requireContract(record.eligiblePlayerIds.length<=4&&same([...new Set(record.eligiblePlayerIds)].sort(),record.eligiblePlayerIds)&&record.eligiblePlayerIds.every(id=>state.playersById[id]),'Invalid completion eligibility snapshot');
 closedRecord(record.claimedByPlayerId,[],record.eligiblePlayerIds);const claimed=Object.keys(record.claimedByPlayerId).sort();for(const [playerId,row] of Object.entries(record.claimedByPlayerId)){closedRecord(row,['tick']);safeInteger(row.tick,record.clearedTick,state.tick);requireContract(state.playersById[playerId],'Unknown completion claimant');}
 const used=economy.usedResources[expectedSource];if(claimed.length)requireContract(used&&same(used.playerIds,claimed)&&used.tick===Math.min(...Object.values(record.claimedByPlayerId).map(row=>row.tick)),'Personal completion provenance drift');else requireContract(!used,'Unclaimed completion source was consumed');
 return true;
}

export function rewardClassForEconomicResourceD13D_C(state,resource){
 if(resource.kind!=='chest'||resource.completion!==true||resource.ordinal!==0)return null;
 return contextForGroup(state,resource.groupId)?.rewardClass??null;
}

export function validateSiteFinaleCompletionRewardSourceD13D_C(state,source){
 const context=contextForGroup(state,source.groupId),economy=state.encounterEconomy.groups[source.groupId];
 requireContract([SITE_FINALE_ELITE_PACK_COMPLETION_REWARD_CLASS,BOSS_COMPLETION_REWARD_CLASS,SITE_FINALE_PROVISIONAL_COMPLETION_REWARD_CLASS].includes(source.rewardClass)&&source.rewardClass===context?.rewardClass&&source.kind==='chest'&&source.ordinal===0&&economy?.episode===source.episode,'Invalid Cave finale completion reward source');
 return source;
}

export function projectSmallCaveFinaleCompletionChestD13D_C(state,resource){
 if(resource.kind!=='chest'||resource.completion!==true||resource.ordinal!==0)return null;
 const context=contextForGroup(state,resource.groupId);if(context?.rewardClass!==SITE_FINALE_ELITE_PACK_COMPLETION_REWARD_CLASS)return null;
 const group=state.groupsById[resource.groupId],economy=state.encounterEconomy.groups[resource.groupId],visible=Boolean(group?.cleared&&economy?.clearedTick!==null);
 return freezeWire({kind:'small-cave-elite-pack-completion',profileId:context.reservation.rewardBinding.profileId,siteId:context.site.siteId,floorId:context.floor.floorId,episode:context.episode.episode,visible,clearTick:visible?economy.clearedTick:null});
}

export function projectStandardCaveBossCompletionChestD13D_E(state,resource){
 if(resource.kind!=='chest'||resource.completion!==true||resource.ordinal!==0)return null;
 const context=contextForGroup(state,resource.groupId);if(context?.rewardClass!==BOSS_COMPLETION_REWARD_CLASS||context.site.sizeTier!=='standard')return null;const boss=Object.values(state.bossCombat?.bossesByEntityId??{}).find(row=>row.groupId===resource.groupId&&row.siteId===context.site.siteId&&row.floorId===context.floor.floorId);if(!boss)return null;
 const group=state.groupsById[resource.groupId],economy=state.encounterEconomy.groups[resource.groupId],visible=Boolean(group?.cleared&&economy?.clearedTick!==null);
 return freezeWire({kind:'arachnid-treant-completion',bossId:boss.bossId,profileId:context.reservation.rewardBinding.profileId,siteId:context.site.siteId,floorId:context.floor.floorId,episode:context.episode.episode,visible,clearTick:visible?economy.clearedTick:null});
}

export function projectLargeCaveFinaleCompletionChestD13D_G(state,resource){
 if(resource.kind!=='chest'||resource.completion!==true||resource.ordinal!==0)return null;
 const context=contextForGroup(state,resource.groupId);if(context?.rewardClass!==SITE_FINALE_PROVISIONAL_COMPLETION_REWARD_CLASS||context.site.sizeTier!=='large')return null;
 const group=state.groupsById[resource.groupId],economy=state.encounterEconomy.groups[resource.groupId],visible=Boolean(group?.cleared&&economy?.clearedTick!==null);
 return freezeWire({kind:'large-cave-provisional-completion',profileId:context.reservation.rewardBinding.profileId,balanceStatus:'provisional',siteId:context.site.siteId,floorId:context.floor.floorId,episode:context.episode.episode,visible,clearTick:visible?economy.clearedTick:null});
}

function portalPosition(context){
 const {site,reservation,floor,episode}=context,reward=floor.reward?.position,room=floor.graph.rooms.find(row=>row.roomId===reservation.finaleChamberId);if(!reward||!room)return null;
 const portalId=`extraction:${site.siteId}:${floor.index}:finale:${episode.episode}`,phase=hash(portalId)%8,angle=phase*Math.PI/4,desired={x:reward.x+Math.cos(angle)*104,y:reward.y+Math.sin(angle)*104},reserved=[floor.entrance,...Object.values(floor.transitions).filter(Boolean).map(row=>row.anchor)],decorations=(floor.visual?.decorations??[]).map(row=>({x:row.x*floor.collision.tileSize,y:row.y*floor.collision.tileSize}));
 const candidates=(room.openCells??[]).map(cellCenter).filter(point=>{const distance=Math.hypot(point.x-reward.x,point.y-reward.y);return distance>=72&&distance<=176&&!collidesWithTiles(floor.collision,point.x,point.y,22)&&reserved.every(anchor=>Math.hypot(point.x-anchor.x,point.y-anchor.y)>=80)&&decorations.every(anchor=>Math.hypot(point.x-anchor.x,point.y-anchor.y)>=64);}).sort((a,b)=>Math.hypot(a.x-desired.x,a.y-desired.y)-Math.hypot(b.x-desired.x,b.y-desired.y)||a.y-b.y||a.x-b.x);
 return candidates[0]??null;
}

export function smallCaveFinaleExteriorDestinationD13D_C(state,site){
 const entrance=projectToLocalFrameD9(site.socket.entrance,state.d9World.runtime.frames);if(!entrance)return null;
 const road=state.d9World.siteReservationsById?.[site.siteId]?.parcel?.roadAnchor,tx=road?BigInt(road.tileX):0n,ty=road?BigInt(road.tileY):0n,cx=floorDiv(tx,32n),cy=floorDiv(ty,26n),roadWorld=road?normalizeWorldPosition({chunkX:String(cx),chunkY:String(cy),localX:Number(tx-cx*32n)*32+16,localY:Number(ty-cy*26n)*32+16}):null,roadLocal=roadWorld?projectToLocalFrameD9(roadWorld,state.d9World.runtime.frames):null,dx=(roadLocal?.x??entrance.x)-(entrance.x),dy=(roadLocal?.y??entrance.y+96)-(entrance.y),length=Math.hypot(dx,dy),direction=length>1?{x:dx/length,y:dy/length}:{x:0,y:1};
 return freezeWire({x:entrance.x+direction.x*96,y:entrance.y+direction.y*96});
}

export function projectSmallCaveFinaleExtractionD13D_C(state,site,floor){
 if(!site||!floor||!smallCaveFinaleCompletionActiveD13D_C(state,site))return null;
 const reservation=state.campaign.siteFinaleReservationsById[site.siteId],episode=state.campaign.siteRunEpisodesById[site.siteId];if(floor.floorId!==reservation.finalFloorId)return null;
 const context={site,reservation,floor,episode,deployment:state.campaign.siteFinaleDeploymentsById[site.siteId]},position=portalPosition(context);if(!position)return null;
 const group=state.groupsById[floor.groupId],economy=state.encounterEconomy.groups[floor.groupId],visible=Boolean(group?.cleared&&economy?.clearedTick!==null),portalId=`extraction:${site.siteId}:${floor.index}:finale:${episode.episode}`,destination=smallCaveFinaleExteriorDestinationD13D_C(state,site);if(!destination)return null;
 return freezeWire({version:SMALL_CAVE_FINALE_EXTRACTION_D13D_C,portalId,siteId:site.siteId,floorId:floor.floorId,groupId:floor.groupId,episode:episode.episode,spaceInstanceId:floor.spaceInstanceId,position:copyWire(position),destination:copyWire(destination),visible,activatedTick:visible?economy.clearedTick:null});
}

export function projectStandardCaveBossExtractionD13D_E(state,site,floor){
 if(!site||!floor||!standardCaveBossCompletionActiveD13D_E(state,site))return null;
 const reservation=state.campaign.siteFinaleReservationsById[site.siteId],episode=state.campaign.siteRunEpisodesById[site.siteId];if(floor.floorId!==reservation.finalFloorId)return null;
 const context={site,reservation,floor,episode,deployment:state.campaign.siteFinaleDeploymentsById[site.siteId]},position=portalPosition(context);if(!position)return null;
 const group=state.groupsById[floor.groupId],economy=state.encounterEconomy.groups[floor.groupId],visible=Boolean(group?.cleared&&economy?.clearedTick!==null),portalId=`extraction:${site.siteId}:${floor.index}:finale:${episode.episode}`,destination=smallCaveFinaleExteriorDestinationD13D_C(state,site);if(!destination)return null;
 return freezeWire({version:STANDARD_CAVE_BOSS_EXTRACTION_D13D_E,portalId,siteId:site.siteId,floorId:floor.floorId,groupId:floor.groupId,episode:episode.episode,spaceInstanceId:floor.spaceInstanceId,position:copyWire(position),destination:copyWire(destination),visible,activatedTick:visible?economy.clearedTick:null});
}

export function projectLargeCaveFinaleExtractionD13D_G(state,site,floor){
 if(!site||!floor||!largeCaveFinaleCompletionActiveD13D_G(state,site))return null;
 const reservation=state.campaign.siteFinaleReservationsById[site.siteId],episode=state.campaign.siteRunEpisodesById[site.siteId];if(floor.floorId!==reservation.finalFloorId)return null;
 const context={site,reservation,floor,episode,deployment:state.campaign.siteFinaleDeploymentsById[site.siteId]},position=portalPosition(context);if(!position)return null;
 const group=state.groupsById[floor.groupId],economy=state.encounterEconomy.groups[floor.groupId],visible=Boolean(group?.cleared&&economy?.clearedTick!==null),portalId=`extraction:${site.siteId}:${floor.index}:finale:${episode.episode}`,destination=smallCaveFinaleExteriorDestinationD13D_C(state,site);if(!destination)return null;
 return freezeWire({version:LARGE_CAVE_FINALE_EXTRACTION_D13D_G,portalId,siteId:site.siteId,floorId:floor.floorId,groupId:floor.groupId,episode:episode.episode,spaceInstanceId:floor.spaceInstanceId,position:copyWire(position),destination:copyWire(destination),visible,activatedTick:visible?economy.clearedTick:null});
}
