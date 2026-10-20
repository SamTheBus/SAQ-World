import {isCryptFamily} from '../content/planned_crypt_policy_v1.js';
import {isRuinFamily} from '../content/planned_ruin_policy_v1.js';
import {isFortFamily} from '../content/planned_fort_policy_v1.js';
import {D9_PROFILE as P} from '../content/world_profile_d9.js';
import {localFramePositionD9} from './local_world_frames_d9.js';
import {canonicalStringify,closedRecord,copyWire,requireContract,safeInteger} from './wire.js';
import {addAmount,rewardAmount} from './economy_amount.js';
import {retireSalvage} from './gear_salvage.js';

const LEGACY_SITE_RUN_EPISODE_D13B='site-run-episode-d13b-v1';
const LEGACY_SITE_RUN_EPISODE_D13C='site-run-episode-d13c-v1';
export const SITE_RUN_EPISODE_D13B='site-run-episode-d13c1-v1';
export const CURRENT_SITE_EPISODE_D13B=1;
export const SITE_RUN_RECENT_RECEIPT_LIMIT_D13C1=8;
const SITE_RUN_HISTORY_ARCHIVE_D13C1='site-run-history-archive-d13c1-v1';
const SITE_RUN_COMPLETION_RECEIPT_D13C1='site-run-completion-receipt-d13c1-v1';
const SITE_RUN_REWARD_ARCHIVE_D13C1='site-run-reward-archive-d13c1-v1';
const SITE_RESET_RECEIPT_D13C1='site-reset-d13c1-v1';
const WOODLAND_FORT_WIDTH_TILES=48,WOODLAND_FORT_HEIGHT_TILES=36;

const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
const hash32=text=>{
 let value=2166136261;
 for(let index=0;index<text.length;index++)value=Math.imul(value^text.charCodeAt(index),16777619)>>>0;
 value=Math.imul(value^(value>>>16),2246822507)>>>0;
 value=Math.imul(value^(value>>>13),3266489909)>>>0;
 return (value^(value>>>16))>>>0;
};

// A pure domain-separated derivation. It neither reads nor advances any saved
// random stream, so episode advancement cannot perturb world generation.
export function deriveSiteRunEpisodeSeedD13B(worldSeedHex,siteId,episode=CURRENT_SITE_EPISODE_D13B){
 requireContract(typeof worldSeedHex==='string'&&/^[a-f0-9]{32}$/.test(worldSeedHex),'Invalid episode world seed');
 requireContract(/^(?:site|loc):[a-f0-9]{32}$/.test(siteId),'Invalid episode site identity');safeInteger(episode,1);
 const key=`SAQ-WORLD-SITE-EPISODE-D13B/${worldSeedHex}/${siteId}/${episode}`;
 return Array.from({length:8},(_,lane)=>hash32(`${key}/${lane}`).toString(16).padStart(8,'0')).join('');
}

function worldSeedHex(state){
 const seed=state.campaign.seed?.seedHex;
 requireContract(typeof seed==='string'&&/^[a-f0-9]{32}$/.test(seed),'Site episodes require a canonical world seed');
 return seed;
}

function implementedSiteIds(state){
 return [...new Set([...Object.keys(state.campaign.sitesById??{}),...Object.keys(state.d9World?.functionalSitesById??{})])].sort();
}

export function siteSupportsResetD13C(state,siteId){
 const site=state.d9World?.functionalSitesById?.[siteId];
 return Boolean((site?.packageId==='woodland-cave-family'&&site.version==='functional-site-family-d12-2-v1'||isFortFamily(site)||(isRuinFamily(site)||isCryptFamily(site)))&&Array.isArray(site.floors));
}

function currentGroupIds(state,siteId){
 const site=state.d9World?.functionalSitesById?.[siteId];
 if(site?.floors)return site.floors.map(floor=>floor.groupId);
 if(site?.interior?.groupId)return [site.interior.groupId];
 return Object.values(state.groupsById).filter(group=>group.siteId===siteId).map(group=>group.groupId).sort();
}

function currentClearTick(state,siteId){
 if(siteSupportsResetD13C(state,siteId)){
  const ids=currentGroupIds(state,siteId),groups=ids.map(id=>state.groupsById[id]);
  if(!ids.length||groups.some(group=>!group?.cleared))return null;
  return Math.max(...ids.map(id=>state.encounterEconomy?.groups?.[id]?.clearedTick??state.tick));
 }
 const legacy=state.campaign.sitesById?.[siteId];
 if(legacy)return legacy.conqueredTick;
 return state.d9World?.functionalSitesById?.[siteId]?.conqueredTick??null;
}

function fortCompoundContains(state,site,actor){
 if(!state.d9World||actor.residency.spaceInstanceId!==state.overworldInstanceId)return false;
 const point=localFramePositionD9(actor.position,state.d9World.runtime.frames),parcel=site.compound,left=BigInt(parcel.tileX),top=BigInt(parcel.tileY),chunkTileX=BigInt(point.chunkX)*BigInt(P.chunkWidth/P.tileSize),chunkTileY=BigInt(point.chunkY)*BigInt(P.chunkHeight/P.tileSize);
 const x=Number(chunkTileX-left)*P.tileSize+point.localX,y=Number(chunkTileY-top)*P.tileSize+point.localY;
 return x>=0&&y>=0&&x<WOODLAND_FORT_WIDTH_TILES*P.tileSize&&y<WOODLAND_FORT_HEIGHT_TILES*P.tileSize;
}

function caveExteriorContains(state,site,actor){
 if(actor.residency.spaceInstanceId!==state.overworldInstanceId)return false;
 const parcel=state.d9World?.siteReservationsById?.[site.siteId]?.parcel;
 if(parcel?.tileX===undefined||!Number.isInteger(parcel.width)||!Number.isInteger(parcel.height))return false;
 const point=localFramePositionD9(actor.position,state.d9World.runtime.frames),tileX=BigInt(point.chunkX)*32n+BigInt(Math.floor(point.localX/P.tileSize)),tileY=BigInt(point.chunkY)*26n+BigInt(Math.floor(point.localY/P.tileSize)),left=BigInt(parcel.tileX),top=BigInt(parcel.tileY);
 return tileX>=left&&tileX<left+BigInt(parcel.width)&&tileY>=top&&tileY<top+BigInt(parcel.height);
}

function actorOccupiesSite(state,siteId,actor){
 const legacy=state.campaign.sitesById?.[siteId];
 if(legacy)return actor.residency.spaceInstanceId===legacy.spaceInstanceId;
 const site=state.d9World?.functionalSitesById?.[siteId];
 if(!site)return false;
 if(site.siteKind==='woodland-fort')return actor.residency.spaceInstanceId===site.spaceInstanceId||fortCompoundContains(state,site,actor);
 if((isFortFamily(site)||(isRuinFamily(site)||isCryptFamily(site)))&&actor.residency.spaceInstanceId===state.overworldInstanceId){const p=localFramePositionD9(actor.position,state.d9World.runtime.frames),q=site.socket.provenance;return [...q.footprintChunks,...q.approachChunks].some(c=>p.chunkX===String(1024+c.x)&&p.chunkY===String(1024+c.y));}
 if(Array.isArray(site.floors))return site.floors.some(floor=>floor.spaceInstanceId===actor.residency.spaceInstanceId)||caveExteriorContains(state,site,actor);
 return actor.residency.spaceInstanceId===site.spaceInstanceId;
}
function actorInsideSite(state,siteId,actor){
 const legacy=state.campaign.sitesById?.[siteId];if(legacy)return actor.residency.spaceInstanceId===legacy.spaceInstanceId;
 const site=state.d9World?.functionalSitesById?.[siteId];if(!site)return false;if(site.siteKind==='woodland-fort')return actorOccupiesSite(state,siteId,actor);if(Array.isArray(site.floors))return site.floors.some(floor=>floor.spaceInstanceId===actor.residency.spaceInstanceId);return actor.residency.spaceInstanceId===site.spaceInstanceId;
}

export function siteOccupantsD13C(state,siteId,{connectedOnly=true,interiorOnly=false}={}){
 return Object.values(state.playersById).filter(player=>!connectedOnly||player.connectionStatus==='connected').filter(player=>{
  const actor=state.entitiesById[player.entityId];return actor&&(interiorOnly?actorInsideSite(state,siteId,actor):actorOccupiesSite(state,siteId,actor));
 }).map(player=>player.playerId).sort();
}

export const connectedSiteOccupantsD13B=(state,siteId)=>siteOccupantsD13C(state,siteId,{connectedOnly:true});

function migrationEvidenceTick(state,siteId){
 const groups=Object.values(state.groupsById).filter(group=>group.siteId===siteId),ticks=[];
 for(const group of groups){
  if(group.lastRequiredTick!==null)ticks.push(group.lastRequiredTick);
  if(group.entityIds.some(id=>{const actor=state.entitiesById[id];return actor&&(!actor.alive||!same(actor.hp,actor.maxHp));}))ticks.push(state.encounterEconomy?.groups?.[group.groupId]?.startedTick??state.tick);
  if(Object.keys(state.encounterEconomy?.groups?.[group.groupId]?.usedResources??{}).length)ticks.push(state.encounterEconomy.groups[group.groupId].startedTick);
 }
 return ticks.length?Math.min(...ticks):null;
}

const commitment=(domain,value)=>Array.from({length:8},(_,lane)=>hash32(`${domain}/${lane}/${canonicalStringify(value)}`).toString(16).padStart(8,'0')).join('');
const historyGenesis=(state,siteId)=>commitment('SAQ-WORLD-SITE-RUN-HISTORY-D13C1-GENESIS',{worldSeed:worldSeedHex(state),siteId});
const blankHistoryArchive=(state,siteId)=>({version:SITE_RUN_HISTORY_ARCHIVE_D13C1,archivedEpisodes:0,archivedCommitment:historyGenesis(state,siteId)});
const chainHead=record=>record.completionHistory.at(-1)?.commitment??record.historyArchive.archivedCommitment;

function rewardSourceIds(state,groupIds){
 const groups=new Set(groupIds),ids=new Set();
 for(const player of Object.values(state.playersById))for(const [id,reward] of Object.entries(player.inventory?.rewardsByEntityId??{}))if(groups.has(reward.episodeSource?.groupId))ids.add(id);
 for(const groupId of groupIds){const economy=state.encounterEconomy?.groups?.[groupId];for(const id of Object.keys(economy?.usedResources??{}))ids.add(id);for(const id of Object.keys(economy?.personalCompletionClaimsBySourceId??{}))ids.add(id);}
 return [...ids].sort();
}

function receiptIdentity(row){return commitment('SAQ-WORLD-SITE-RUN-RECEIPT-IDENTITY-D13C1',{siteId:row.siteId,episode:row.episode,episodeSeed:row.episodeSeed,startedTick:row.startedTick,clearedTick:row.clearedTick,resetTick:row.resetTick,groupCount:row.groupCount,enemyCount:row.enemyCount});}
function receiptCommitment(row){const {commitment:ignored,...payload}=row;return commitment('SAQ-WORLD-SITE-RUN-RECEIPT-CHAIN-D13C1',payload);}

function completionReceipt(state,siteId,record,resetTick,{groupIds=currentGroupIds(state,siteId),entityIds=null,startedTick=record.startedTick,clearedTick=record.clearedTick,episode=record.episode,episodeSeed=record.episodeSeed}={}){
 groupIds=[...groupIds].sort();const groups=groupIds.map(groupId=>{const group=state.groupsById[groupId];requireContract(group?.siteId===siteId,'Missing retiring site group');return {groupId,enemyCount:group.entityIds.length};}),enemyCount=entityIds?.length??groups.reduce((sum,row)=>sum+row.enemyCount,0),base={version:SITE_RUN_COMPLETION_RECEIPT_D13C1,siteId,episode,episodeSeed,startedTick:startedTick??clearedTick,clearedTick,resetTick,groupCount:groups.length,enemyCount,groups,rewardSourceIds:rewardSourceIds(state,groupIds),previousCommitment:chainHead(record)};
 const withIdentity={...base,identityCommitment:receiptIdentity(base)};return {...withIdentity,commitment:receiptCommitment(withIdentity)};
}

function appendReceipt(record,receipt){
 record.completionHistory.push(receipt);
 while(record.completionHistory.length>SITE_RUN_RECENT_RECEIPT_LIMIT_D13C1){const archived=record.completionHistory.shift();record.historyArchive.archivedEpisodes=archived.episode;record.historyArchive.archivedCommitment=archived.commitment;}
}

function rewardArchiveProof(receipt,sourceEntityId,source,reward){
 const base={version:SITE_RUN_REWARD_ARCHIVE_D13C1,siteId:receipt.siteId,episode:receipt.episode,episodeSeed:receipt.episodeSeed,startedTick:receipt.startedTick,clearedTick:receipt.clearedTick,resetTick:receipt.resetTick,groupCount:receipt.groupCount,enemyCount:receipt.enemyCount,receiptIdentityCommitment:receipt.identityCommitment,sourceEntityId,groupId:source.groupId,sourceEpisode:source.episode,kind:source.kind,ordinal:source.ordinal,rank:source.rank,spawnEntityId:reward.spawnEntityId,participantIds:[]};
 return {...base,sourceCommitment:commitment('SAQ-WORLD-SITE-RUN-REWARD-SOURCE-D13C1',base)};
}

function dispositionOrigin(state,player,sourceEntityId,source,proof){
 const inv=player.inventory,itemId=`item:${player.playerId}:${sourceEntityId}`,base={groupId:source.groupId,episode:source.episode,sourceEntityId,...(source.progression?{progression:copyWire(source.progression)}:{})};
 const carried=inv.itemsById[itemId]&&inv.renewal.originsByItemId[itemId],dropped=inv.renewal.groundBySourceId[sourceEntityId]?.origin,salvaged=inv.d7?.salvaged?.[itemId]?.origin,automatic=inv.d7?.autoSalvaged?.[itemId]?.origin,remote=state.d9World?.paging.remoteGearByPlayer?.[player.playerId]?.[itemId];
 const rows=[carried,dropped,salvaged,automatic,inv.services?.salesByItemId[itemId]?.origin,remote?.origin].filter(Boolean);requireContract(rows.length===1||rows.length===0&&remote,'Claimed retired gear has no unique ownership disposition');
 const origin=rows[0]??(remote.origin=base);requireContract(origin.groupId===source.groupId&&origin.episode===source.episode&&origin.sourceEntityId===sourceEntityId,'Retired gear ownership provenance drift');origin.archive=copyWire(proof);return origin;
}

function retireEpisodeRewardRowsD13C2(state,receipt,{archivedOnly=false}={}){
 const groupIds=receipt?new Set(receipt.groups.map(row=>row.groupId)):null;
 for(const player of Object.values(state.playersById)){
  const inv=player.inventory;let changed=false;
  for(const [sourceEntityId,reward] of Object.entries(inv?.rewardsByEntityId??{})){
   const source=reward.episodeSource;if(!source||(archivedOnly?!source.archive:!groupIds.has(source.groupId)))continue;
   let proof=source.archive;if(!proof){const used=state.encounterEconomy?.groups?.[source.groupId]?.usedResources?.[sourceEntityId];proof=rewardArchiveProof(receipt,sourceEntityId,source,reward);proof.participantIds=used?[...used.playerIds]:[];const {sourceCommitment:ignored,...base}=proof;proof.sourceCommitment=commitment('SAQ-WORLD-SITE-RUN-REWARD-SOURCE-D13C1',base);}
   if(reward.definitionId&&reward.claimed)dispositionOrigin(state,player,sourceEntityId,source,proof);
   inv.renewal.retiredGold=addAmount(inv.renewal.retiredGold,rewardAmount(inv.goldAwardsByEntityId[sourceEntityId].amount));
   inv.renewal.retiredSouls=safeInteger(inv.renewal.retiredSouls+(inv.economy.soulAwardsByEntityId[sourceEntityId]??0));
   delete inv.rewardsByEntityId[sourceEntityId];delete inv.goldAwardsByEntityId[sourceEntityId];delete inv.economy.soulAwardsByEntityId[sourceEntityId];changed=true;
  }
  if(changed){inv.revision++;retireSalvage(player,state);}
 }
}

export function validateSiteRunRewardArchiveD13C1(state,sourceEntityId,source){
 const proof=source?.archive;if(!proof)return false;
 closedRecord(proof,['version','siteId','episode','episodeSeed','startedTick','clearedTick','resetTick','groupCount','enemyCount','receiptIdentityCommitment','sourceEntityId','groupId','sourceEpisode','kind','ordinal','rank','spawnEntityId','participantIds','sourceCommitment']);
 requireContract(proof.version===SITE_RUN_REWARD_ARCHIVE_D13C1&&proof.sourceEntityId===sourceEntityId&&proof.groupId===source.groupId&&proof.sourceEpisode===source.episode&&(source.sourceEntityId===undefined||source.sourceEntityId===sourceEntityId),'Archived reward source identity drift');
 if(source.kind!==undefined)requireContract(proof.kind===source.kind&&proof.ordinal===source.ordinal&&proof.rank===source.rank,'Archived reward source detail drift');
 const record=state.campaign.siteRunEpisodesById?.[proof.siteId];requireContract(record&&record.episode>proof.episode&&proof.episodeSeed===deriveSiteRunEpisodeSeedD13B(worldSeedHex(state),proof.siteId,proof.episode),'Archived reward episode is not retired');
 safeInteger(proof.startedTick,0,proof.clearedTick);safeInteger(proof.clearedTick,proof.startedTick,proof.resetTick);safeInteger(proof.resetTick,proof.clearedTick,state.tick);safeInteger(proof.groupCount,1,4);safeInteger(proof.enemyCount,1,40);safeInteger(proof.ordinal,0,40);
 requireContract(['enemy','breakable','chest'].includes(proof.kind)&&typeof proof.rank==='string'&&proof.rank.length<=8&&Array.isArray(proof.participantIds)&&proof.participantIds.length<=4&&proof.participantIds.every((id,index)=>state.playersById[id]&&(index===0||proof.participantIds[index-1]<id)),'Invalid archived reward source');
 requireContract(proof.receiptIdentityCommitment===receiptIdentity(proof),'Archived reward receipt identity drift');const {sourceCommitment:ignored,...base}=proof;requireContract(proof.sourceCommitment===commitment('SAQ-WORLD-SITE-RUN-REWARD-SOURCE-D13C1',base),'Archived reward source commitment drift');
 const retained=record.completionHistory.find(row=>row.episode===proof.episode);if(retained)requireContract(retained.identityCommitment===proof.receiptIdentityCommitment&&retained.rewardSourceIds.includes(sourceEntityId),'Archived reward absent from retained receipt');else requireContract(record.historyArchive.archivedEpisodes>=proof.episode,'Archived reward predates no committed history');
 return true;
}

export function compactRetiredRewardAuthorityD13C2(state){retireEpisodeRewardRowsD13C2(state,null,{archivedOnly:true});return state;}

function removeTemporaryCombat(state,entityIds){
 const actors=new Set(entityIds),elite=state.eliteCombat,eliteIds=new Set(Object.values(elite?.elitesByEntityId??{}).filter(row=>actors.has(row.entityId)).map(row=>row.eliteId));
 if(elite){
  for(const [id,row] of Object.entries(elite.pendingHazardsBySourceEliteId??{}))if(eliteIds.has(id)||eliteIds.has(row.sourceEliteId))delete elite.pendingHazardsBySourceEliteId[id];
  for(const [id,row] of Object.entries(elite.hazardsById??{}))if(eliteIds.has(row.sourceEliteId))delete elite.hazardsById[id];
  for(const key of ['hasteByEntityId','guardByEntityId','attackAuraByEntityId'])for(const [id,row] of Object.entries(elite[key]??{}))if(actors.has(id)||row.sourceEliteIds?.some(source=>eliteIds.has(source)))delete elite[key][id];
  for(const [id,statuses] of Object.entries(elite.timedStatusesByEntityId??{})){for(const [statusId,row] of Object.entries(statuses))if(actors.has(id)||eliteIds.has(row.sourceEliteId))delete statuses[statusId];if(!Object.keys(statuses).length)delete elite.timedStatusesByEntityId[id];}
  for(const [id,row] of Object.entries(elite.nullificationResistanceByEntityId??{}))if(actors.has(id)||eliteIds.has(row.sourceEliteId))delete elite.nullificationResistanceByEntityId[id];
  for(const key of ['webbedByEntityId','slagBurnByEntityId'])for(const [id,row] of Object.entries(elite[key]??{}))if(actors.has(id)||row.hazardIds?.some(hazardId=>!elite.hazardsById[hazardId]))delete elite[key][id];
  for(const id of actors)delete elite.elitesByEntityId[id];
 }
 const boss=state.bossCombat,bossIds=new Set(Object.values(boss?.bossesByEntityId??{}).filter(row=>actors.has(row.entityId)).map(row=>row.bossId));
 if(boss){for(const [id,row] of Object.entries(boss.hazardsById??{}))if(bossIds.has(row.bossId)||actors.has(row.sourceEntityId))delete boss.hazardsById[id];for(const [id,row] of Object.entries(boss.statusesByEntityId??{}))if(actors.has(id)||bossIds.has(row.sourceBossId))delete boss.statusesByEntityId[id];for(const id of actors){delete boss.bossesByEntityId[id];delete boss.summonsByEntityId[id];}}
}

export function retireSiteEpisodeAuthorityD13C1(state,groupIds,entityIds){
 const groups=new Set(groupIds),actors=new Set(entityIds);removeTemporaryCombat(state,entityIds);
 state.d9World.runtime.groups=state.d9World.runtime.groups.filter(row=>!groups.has(row.groupId));state.d9World.runtime.resources=state.d9World.runtime.resources.filter(row=>!groups.has(row.groupId));
 for(const groupId of groups){delete state.groupsById[groupId];delete state.encounterEconomy.groups[groupId];delete state.d9World.episodes[groupId];delete state.d9World.paging?.coldObligations?.[groupId];}
 for(const player of Object.values(state.playersById))for(const entityId of actors)delete player.d8?.causalXp?.[entityId];
 for(const entityId of actors){delete state.entitiesById[entityId];delete state.d9World.positions?.[entityId];}
 state.d9World.runtime.revision++;state.encounterEconomy.revision++;
}

function initialEpisode(state,siteId,{inferHistory=false}={}){
 const clearTick=currentClearTick(state,siteId),occupied=siteOccupantsD13C(state,siteId).length>0,interiorOccupied=siteOccupantsD13C(state,siteId,{interiorOnly:true}).length>0,evidenceTick=inferHistory&&clearTick===null?migrationEvidenceTick(state,siteId):null,startedTick=clearTick??(interiorOccupied?state.tick:evidenceTick),status=clearTick!==null?'cleared':startedTick!==null?'active':'unstarted';
 return {version:SITE_RUN_EPISODE_D13B,siteId,episode:CURRENT_SITE_EPISODE_D13B,episodeSeed:deriveSiteRunEpisodeSeedD13B(worldSeedHex(state),siteId,CURRENT_SITE_EPISODE_D13B),status,effectiveLevel:null,startedTick,clearedTick:clearTick,vacantSinceTick:startedTick!==null&&!occupied?state.tick:null,activeSigilModifierRef:null,historyArchive:blankHistoryArchive(state,siteId),completionHistory:[],lastReset:null};
}

function migrateEpisodeRecord(state,siteId,record){
 if(record.version===SITE_RUN_EPISODE_D13B)return record;
 requireContract([LEGACY_SITE_RUN_EPISODE_D13B,LEGACY_SITE_RUN_EPISODE_D13C].includes(record.version)&&record.siteId===siteId,'Unsupported site episode migration');
 const next={...copyWire(record),version:SITE_RUN_EPISODE_D13B,historyArchive:blankHistoryArchive(state,siteId),completionHistory:[],lastReset:null};
 if(record.version===LEGACY_SITE_RUN_EPISODE_D13C){
  const retiredGroups=[],retiredEntities=[];
  for(const entry of record.completionHistory??[])if(entry.resetTick!==null){const receipt=completionReceipt(state,siteId,next,entry.resetTick,{groupIds:entry.groupIds,entityIds:entry.entityIds,startedTick:entry.startedTick,clearedTick:entry.clearedTick,episode:entry.episode,episodeSeed:entry.episodeSeed});retireEpisodeRewardRowsD13C2(state,receipt);appendReceipt(next,receipt);retiredGroups.push(...entry.groupIds);retiredEntities.push(...entry.entityIds);}
  if(retiredGroups.length)retireSiteEpisodeAuthorityD13C1(state,[...new Set(retiredGroups)],[...new Set(retiredEntities)]);
  if(record.episode>1){const receipt=next.completionHistory.at(-1),old=record.lastReset;next.lastReset={version:SITE_RESET_RECEIPT_D13C1,resetId:old.resetId,siteId,fromEpisode:old.fromEpisode,toEpisode:old.toEpisode,resetTick:old.resetTick,retiredReceiptCommitment:receipt?.commitment??next.historyArchive.archivedCommitment,retiredGroupIds:[...old.retiredGroupIds].sort(),retiredEntityIds:(record.completionHistory.find(row=>row.episode===old.fromEpisode)?.entityIds??[]).sort(),newGroupIds:[...old.newGroupIds],newEntityIds:[...old.newEntityIds]};}
 }
 return next;
}

export function ensureSiteRunEpisodeD13B(state,siteId,options={}){
 const implemented=implementedSiteIds(state).includes(siteId);
 requireContract(/^(?:site|loc):[a-f0-9]{32}$/.test(siteId)&&implemented,'Cannot create an episode for an unimplemented site');
 const records=state.campaign.siteRunEpisodesById??={};
 records[siteId]=records[siteId]?migrateEpisodeRecord(state,siteId,records[siteId]):initialEpisode(state,siteId,options);
 return records[siteId];
}

export function installSiteRunEpisodesD13B(state,options={}){
 state.campaign.siteRunEpisodesById??={};
 for(const siteId of implementedSiteIds(state))ensureSiteRunEpisodeD13B(state,siteId,options);
 return compactRetiredRewardAuthorityD13C2(state);
}

export function observeSiteRunEpisodesD13B(state){
 installSiteRunEpisodesD13B(state);
 for(const siteId of implementedSiteIds(state)){
  const record=state.campaign.siteRunEpisodesById[siteId],occupied=siteOccupantsD13C(state,siteId).length>0,interiorOccupied=siteOccupantsD13C(state,siteId,{interiorOnly:true}).length>0,clearTick=currentClearTick(state,siteId);
  if(record.status==='unstarted'&&interiorOccupied){record.status='active';record.startedTick=state.tick;}
  if(clearTick!==null&&record.status!=='cleared'){
   record.startedTick??=clearTick;record.status='cleared';record.clearedTick=clearTick;
  }
  if(record.startedTick!==null)record.vacantSinceTick=occupied?null:(record.vacantSinceTick??state.tick);
 }
 return state;
}

export function siteRunEpisodeObservationRequiredD13B(state){
 if(!state.campaign.siteRunEpisodesById)return false;
 for(const siteId of implementedSiteIds(state)){
  const record=state.campaign.siteRunEpisodesById[siteId];if(!record)return true;
  const occupied=siteOccupantsD13C(state,siteId).length>0,interiorOccupied=siteOccupantsD13C(state,siteId,{interiorOnly:true}).length>0,clearTick=currentClearTick(state,siteId);
  if(record.status==='unstarted'&&interiorOccupied)return true;
  if(clearTick!==null&&record.status!=='cleared')return true;
  if(record.startedTick!==null&&((occupied&&record.vacantSinceTick!==null)||(!occupied&&record.vacantSinceTick===null)))return true;
 }
 return false;
}

export function advanceSiteRunEpisodeD13C(state,siteId,{resetId,resetTick,newGroupIds,newEntityIds}){
 const record=ensureSiteRunEpisodeD13B(state,siteId);requireContract(siteSupportsResetD13C(state,siteId)&&record.status==='cleared','Only the cleared current procedural Cave episode may reset');
 const retiredGroupIds=currentGroupIds(state,siteId).sort(),retiredEntityIds=retiredGroupIds.flatMap(id=>state.groupsById[id]?.entityIds??[]).sort(),receipt=completionReceipt(state,siteId,record,resetTick,{groupIds:retiredGroupIds,entityIds:retiredEntityIds});retireEpisodeRewardRowsD13C2(state,receipt);appendReceipt(record,receipt);const fromEpisode=record.episode,toEpisode=safeInteger(fromEpisode+1,2);
 record.episode=toEpisode;record.episodeSeed=deriveSiteRunEpisodeSeedD13B(worldSeedHex(state),siteId,toEpisode);record.status='unstarted';record.effectiveLevel=null;record.startedTick=null;record.clearedTick=null;record.vacantSinceTick=null;record.activeSigilModifierRef=null;
 record.lastReset={version:SITE_RESET_RECEIPT_D13C1,resetId,siteId,fromEpisode,toEpisode,resetTick,retiredReceiptCommitment:receipt.commitment,retiredGroupIds:[...retiredGroupIds],retiredEntityIds:[...retiredEntityIds],newGroupIds:[...newGroupIds],newEntityIds:[...newEntityIds]};
 return record;
}

export const resolveSiteRunEpisodeD13B=(state,siteId)=>state.campaign.siteRunEpisodesById?.[siteId]??null;
export const resolveSiteRunEpisodesD13B=state=>copyWire(state.campaign.siteRunEpisodesById??{});
export function retiredSiteRunGroupD13C(state,groupId){
 for(const [siteId,record] of Object.entries(state.campaign.siteRunEpisodesById??{}))for(const entry of record.completionHistory??[])if(entry.groups.some(row=>row.groupId===groupId))return {siteId,episode:entry.episode,entry};
 return null;
}
export function siteResetTransitionsD13C(before,after){
 const rows=[];for(const [siteId,record] of Object.entries(before.campaign.siteRunEpisodesById??{})){const next=after.campaign.siteRunEpisodesById?.[siteId];if(next?.episode===record.episode+1)rows.push(next.lastReset);}
 return rows;
}

function validateCompletionEntry(state,siteId,entry,index,record){
 closedRecord(entry,['version','siteId','episode','episodeSeed','startedTick','clearedTick','resetTick','groupCount','enemyCount','groups','rewardSourceIds','previousCommitment','identityCommitment','commitment']);
 const expectedEpisode=record.historyArchive.archivedEpisodes+index+1;requireContract(entry.version===SITE_RUN_COMPLETION_RECEIPT_D13C1&&entry.siteId===siteId&&entry.episode===expectedEpisode&&entry.episode<record.episode&&entry.episodeSeed===deriveSiteRunEpisodeSeedD13B(worldSeedHex(state),siteId,entry.episode),'Invalid site completion receipt identity');
 safeInteger(entry.startedTick,0,entry.clearedTick);safeInteger(entry.clearedTick,entry.startedTick,entry.resetTick);safeInteger(entry.resetTick,entry.clearedTick,state.tick);safeInteger(entry.groupCount,1,4);safeInteger(entry.enemyCount,1,40);
 requireContract(entry.groups.length===entry.groupCount&&entry.groups.reduce((sum,row)=>sum+row.enemyCount,0)===entry.enemyCount&&entry.groups.every((row,n)=>{closedRecord(row,['groupId','enemyCount']);safeInteger(row.enemyCount,1,10);return typeof row.groupId==='string'&&(n===0||entry.groups[n-1].groupId<row.groupId);})&&entry.rewardSourceIds.length<=256&&entry.rewardSourceIds.every((id,n)=>typeof id==='string'&&(n===0||entry.rewardSourceIds[n-1]<id)),'Invalid compact site completion inventory');
 const previous=index?record.completionHistory[index-1].commitment:record.historyArchive.archivedCommitment;requireContract(entry.previousCommitment===previous&&entry.identityCommitment===receiptIdentity(entry)&&entry.commitment===receiptCommitment(entry),'Site completion commitment drift');
}

export function validateSiteRunEpisodesD13B(state){
 const records=state.campaign.siteRunEpisodesById;
 if(records===undefined)return true;
 closedRecord(records,[],Object.keys(records));
 const expected=implementedSiteIds(state);requireContract(expected.length<=4096&&same(Object.keys(records).sort(),expected),'Site episode inventory mismatch');
 for(const siteId of expected){
  const record=records[siteId];closedRecord(record,['version','siteId','episode','episodeSeed','status','effectiveLevel','startedTick','clearedTick','vacantSinceTick','activeSigilModifierRef','historyArchive','completionHistory','lastReset']);
  requireContract(record.version===SITE_RUN_EPISODE_D13B&&record.siteId===siteId&&Number.isSafeInteger(record.episode)&&record.episode>=1&&(record.episode===1||siteSupportsResetD13C(state,siteId)&&record.lastReset?.toEpisode===record.episode),'Invalid site episode identity');
  requireContract(record.episodeSeed===deriveSiteRunEpisodeSeedD13B(worldSeedHex(state),siteId,record.episode),'Site episode seed drift');
  requireContract(['unstarted','active','cleared'].includes(record.status),'Invalid site episode status');
  requireContract(record.effectiveLevel===null&&record.activeSigilModifierRef===null,'D13C cannot activate scaling or Sigils');
  for(const key of ['startedTick','clearedTick','vacantSinceTick'])if(record[key]!==null)safeInteger(record[key],0,state.tick);
  if(record.status==='unstarted')requireContract(record.startedTick===null&&record.clearedTick===null&&record.vacantSinceTick===null,'Unstarted site episode carries lifecycle state');
  else requireContract(record.startedTick!==null,'Started site episode lacks start tick');
  if(record.status==='active')requireContract(record.clearedTick===null,'Active site episode is already cleared');
  if(record.status==='cleared')requireContract(record.clearedTick!==null&&record.startedTick<=record.clearedTick,'Invalid cleared site episode chronology');
  if(record.vacantSinceTick!==null)requireContract(record.startedTick!==null&&record.vacantSinceTick>=record.startedTick,'Invalid site vacancy chronology');
  closedRecord(record.historyArchive,['version','archivedEpisodes','archivedCommitment']);requireContract(record.historyArchive.version===SITE_RUN_HISTORY_ARCHIVE_D13C1&&record.historyArchive.archivedEpisodes>=0&&record.historyArchive.archivedEpisodes<=record.episode-1&&/^[a-f0-9]{64}$/.test(record.historyArchive.archivedCommitment),'Invalid site history archive');
  if(record.historyArchive.archivedEpisodes===0)requireContract(record.historyArchive.archivedCommitment===historyGenesis(state,siteId),'Site history genesis drift');
  requireContract(Array.isArray(record.completionHistory)&&record.completionHistory.length<=SITE_RUN_RECENT_RECEIPT_LIMIT_D13C1&&record.historyArchive.archivedEpisodes+record.completionHistory.length===record.episode-1,'Site completion history bound/count drift');
  record.completionHistory.forEach((entry,index)=>validateCompletionEntry(state,siteId,entry,index,record));
  if(record.episode===1)requireContract(record.lastReset===null,'Initial site episode carries reset receipt');
  else {const r=record.lastReset,retired=record.completionHistory.at(-1);closedRecord(r,['version','resetId','siteId','fromEpisode','toEpisode','resetTick','retiredReceiptCommitment','retiredGroupIds','retiredEntityIds','newGroupIds','newEntityIds']);requireContract(r.version===SITE_RESET_RECEIPT_D13C1&&/^reset:[a-f0-9]{32}$/.test(r.resetId)&&r.siteId===siteId&&r.fromEpisode===record.episode-1&&r.toEpisode===record.episode&&r.resetTick===retired.resetTick&&r.retiredReceiptCommitment===retired.commitment&&same(r.retiredGroupIds,retired.groups.map(row=>row.groupId))&&r.retiredEntityIds.length===retired.enemyCount&&new Set(r.retiredEntityIds).size===r.retiredEntityIds.length&&same(r.newGroupIds,currentGroupIds(state,siteId)),'Invalid site reset receipt');safeInteger(r.resetTick,0,state.tick);requireContract(r.retiredEntityIds.every(id=>/^ent:[a-f0-9]{32}$/.test(id)&&!state.entitiesById[id])&&r.retiredGroupIds.every(id=>!state.groupsById[id]&&!state.encounterEconomy.groups[id]&&!state.d9World.episodes[id])&&r.newEntityIds.length>=1&&r.newEntityIds.every(id=>state.entitiesById[id]?.team==='hostile'),'Invalid reset authority retirement');}
  const clearTick=currentClearTick(state,siteId);requireContract((clearTick!==null)===(record.status==='cleared')&&(clearTick===null||record.clearedTick===clearTick),'Site episode clearance drift');
  const permanent=state.campaign.sitesById?.[siteId]?.conqueredTick??state.d9World?.functionalSitesById?.[siteId]?.conqueredTick??null;requireContract((permanent!==null)===(record.episode>1||record.status==='cleared'),'Permanent site-clear history drift');
  if(siteOccupantsD13C(state,siteId).length&&record.status!=='unstarted')requireContract(record.startedTick!==null&&record.vacantSinceTick===null,'Occupied site episode marked vacant');
 }
 return true;
}

export function validateSiteRunEpisodeProgressD13B(before,after){
 if(before.campaign.siteRunEpisodesById===undefined)return true;
 const older=before.campaign.siteRunEpisodesById,newer=after.campaign.siteRunEpisodesById;requireContract(newer,'Site episode history disappeared');
 const rank={unstarted:0,active:1,cleared:2};
 for(const [siteId,record] of Object.entries(older)){
  const next=newer[siteId];requireContract(next&&record.siteId===next.siteId&&record.effectiveLevel===next.effectiveLevel&&record.activeSigilModifierRef===next.activeSigilModifierRef,'Site episode identity changed');
  if(next.episode===record.episode){
   requireContract(next.episodeSeed===record.episodeSeed&&same(next.historyArchive,record.historyArchive)&&same(next.completionHistory,record.completionHistory)&&rank[next.status]>=rank[record.status],'Site episode lifecycle regressed');
   if(record.startedTick!==null)requireContract(next.startedTick===record.startedTick,'Site episode start changed');
   if(record.clearedTick!==null)requireContract(next.clearedTick===record.clearedTick,'Site episode clearance changed');
  }else{
   requireContract(next.episode===record.episode+1&&record.status==='cleared'&&next.status==='unstarted'&&next.episodeSeed===deriveSiteRunEpisodeSeedD13B(worldSeedHex(after),siteId,next.episode),'Invalid site reset advancement');
   requireContract(next.lastReset?.fromEpisode===record.episode&&next.lastReset?.toEpisode===next.episode&&next.lastReset.resetTick>=before.tick,'Site reset lacks authority receipt');
   const receipt=next.completionHistory.at(-1);requireContract(receipt?.episode===record.episode&&receipt.previousCommitment===chainHead(record)&&receipt.commitment===next.lastReset.retiredReceiptCommitment,'Site reset history chain drift');const expected=[...record.completionHistory,receipt],archive=copyWire(record.historyArchive);while(expected.length>SITE_RUN_RECENT_RECEIPT_LIMIT_D13C1){const shifted=expected.shift();archive.archivedEpisodes=shifted.episode;archive.archivedCommitment=shifted.commitment;}requireContract(same(expected,next.completionHistory)&&same(archive,next.historyArchive),'Site reset receipt window drift');
  }
 }
 return true;
}
