import {canonicalStringify,copyWire,freezeWire,requireContract as check} from '../contracts/wire.js';
import {bytesToHex,frameUtf8,hashBytes,utf8} from '../contracts/hashing.js';
import {combatInteger} from '../contracts/combat_amount.js';
import {D9_THREAT_VERSION} from '../contracts/encounter_progression.js';
import {prepareEpisodeSnapshotD9,unfrozenEpisodeD9} from '../contracts/episode_progression_d9.js';
import {threatEndpointsD9} from '../contracts/threat_power_d9.js';
import {ORDINARY_ACQUIRE_RANGE,ORDINARY_ENEMIES,resolveOrdinaryProfile} from './ordinary_enemies.js';
import {ENCOUNTER_CONTAINMENT_D11_2_VERSION,HOSTILE_MOTION_D11_2_VERSION,hostileMeleeMotionD11_2} from './encounter_motion_d11_2.js';
import {WOODLAND_CAVE_FAMILY_CONTENT_HASH,WOODLAND_CAVE_FAMILY_D12,WOODLAND_CAVE_FAMILY_PACKAGE_D12} from './site_families_d12.js';
import {generateWoodlandCaveInstanceD12,validateGeneratedWoodlandCaveD12} from '../generation/woodland_cave_family_d12.js';

export const FUNCTIONAL_SITE_FAMILY_D12='functional-site-family-d12-v1';
const actorAi=(family,tick)=>{const timing=hostileMeleeMotionD11_2(family);return {kind:'simpleMelee',acquireRange:ORDINARY_ACQUIRE_RANGE,updatesApplied:0,...(timing?{melee:{version:HOSTILE_MOTION_D11_2_VERSION,phase:'idle',phaseStartedTick:tick,phaseEndsTick:tick,targetEntityId:null,actionSequence:0},motion:{version:HOSTILE_MOTION_D11_2_VERSION,startedTick:null,lastMovedTick:null}}:{})};};
const containment=(members,tick)=>{const x=members.reduce((n,m)=>n+m.position.x,0)/members.length,y=members.reduce((n,m)=>n+m.position.y,0)/members.length;return {version:ENCOUNTER_CONTAINMENT_D11_2_VERSION,homeAnchor:{x,y},memberHomesById:Object.fromEntries(members.map(m=>[m.entityId,copyWire(m.position)])),acquireRadius:290,pursuitRadius:520,disengageTicks:120,homeTolerance:12,approachRadius:20,mode:'guard',outsideTicks:0,modeStartedTick:tick};};

export async function buildWoodlandCaveFamilyD12(state,site,binding,{sha256}){
 check(binding.packageId===WOODLAND_CAVE_FAMILY_PACKAGE_D12.packageId&&binding.packageVersion===WOODLAND_CAVE_FAMILY_PACKAGE_D12.packageVersion&&binding.contentHash===WOODLAND_CAVE_FAMILY_CONTENT_HASH,'Missing D12 cave family binding');
 const reservation=state.d9World.siteReservationsById?.[site.siteId],ordinal=reservation?.parcel?.spawnOrdinal;check(Number.isInteger(ordinal),'Missing D12 cave spawn provenance');
 const generated=await generateWoodlandCaveInstanceD12({campaignSeed:state.campaign.seed.seedHex,site,spawnOrdinal:ordinal},{sha256});validateGeneratedWoodlandCaveD12(generated);
 const token=async key=>bytesToHex((await hashBytes(frameUtf8([WOODLAND_CAVE_FAMILY_PACKAGE_D12.packageVersion,site.siteId,key]),sha256)).slice(0,16));
 const spaces=[],groups=[],economies=[],episodes=[],actors=[],resources=[],floorRecords=[];
 for(const floor of generated.floors){
  const spaceInstanceId='spi:'+await token(`floor-${floor.index}-instance`),logicalSpaceId='spc:'+await token(`floor-${floor.index}-space`),groupId=`site:${site.siteId}:cave-floor-${floor.index}`,entityIds=[],members=[];
  const episode={...unfrozenEpisodeD9(`site-anchor:${site.siteId}:floor:${floor.index}`,0),geography:{chunkX:site.entrance.chunkX,chunkY:site.entrance.chunkY,anchorOrdinal:floor.index,minimumLevel:copyWire(site.minimumLevel),rank:floor.encounter.rank}};
  episode.snapshot=prepareEpisodeSnapshotD9(episode,{tick:state.tick,minimumLevel:site.minimumLevel,participants:Object.values(state.playersById).map(p=>{const a=state.entitiesById[p.entityId];return {playerId:p.playerId,alive:a.alive,spaceInstanceId:a.residency.spaceInstanceId,position:copyWire(state.d9World.positions[a.entityId]??site.entrance),heroLevel:p.progression.level};}),anchor:site.entrance,spaceInstanceId:state.overworldInstanceId,rank:floor.encounter.rank,trigger:'activation'});
  for(let n=0;n<floor.encounter.members.length;n++){
   const spec=floor.encounter.members[n],enemy=ORDINARY_ENEMIES.find(e=>e.family===spec.family);check(enemy,'Unknown D12 cave enemy');const profile=resolveOrdinaryProfile(enemy,floor.encounter.rank),entityId='ent:'+await token(`floor-${floor.index}-enemy-${n}`),resolved=state.content.definitionsById[profile.contentDefinitionId],stats=threatEndpointsD9(episode.snapshot.effectiveLevel,floor.encounter.rank,enemy.budget);check(resolved,'Missing D12 cave actor profile');
   entityIds.push(entityId);members.push({entityId,enemyDefinitionId:enemy.enemyDefinitionId,profileId:resolved.contentDefinitionId,position:copyWire(spec.position)});
   actors.push({entityId,contentDefinitionId:resolved.contentDefinitionId,kind:'actor',ownerCharacterId:null,team:'hostile',hp:combatInteger(stats.maxHp),maxHp:combatInteger(stats.maxHp),position:copyWire(spec.position),hullRadius:resolved.hullRadius,combatRadius:resolved.combatRadius,movementIntent:{x:0,y:0},moveSpeed:resolved.moveSpeed,alive:true,attackDamage:combatInteger(stats.attackDamage),attackReach:resolved.attackReach,attackReachMode:resolved.attackReachMode,attackDelayTicks:resolved.attackDelayTicks,attackTimer:resolved.attackDelayTicks,nextAttackActionSequence:1,movedLastTick:false,ai:actorAi(enemy.family,state.tick),residency:{spaceInstanceId,residencyRevision:1}});
  }
  const group={groupId,siteId:site.siteId,spaceInstanceId,entityIds,cleared:false,lastRequiredTick:null,threatSnapshot:{version:D9_THREAT_VERSION,activatedTick:state.tick,levelsByEntityId:Object.fromEntries(entityIds.map(id=>[id,copyWire(episode.snapshot.effectiveLevel)]))},threatReady:false,containment:containment(members,state.tick)},economy={episode:0,startedTick:state.tick,eligibleReturn:0,clearedTick:null,vacatedTick:null,usedResources:{},contentDepth:copyWire(episode.snapshot.sourceDepth)};
  const record={...copyWire(floor),logicalSpaceId,spaceInstanceId,groupId,enemyIds:[...entityIds],rewardId:floor.reward?.rewardId??null};
  spaces.push({spaceId:logicalSpaceId,spaceInstanceId,spaceRevision:1,collision:copyWire(floor.collision)});groups.push(group);economies.push(economy);episodes.push(episode);floorRecords.push(record);
  if(floor.reward)resources.push({groupId,ordinal:0,kind:floor.reward.kind,art:floor.reward.art,position:copyWire(floor.reward.position),spaceInstanceId,completion:true});
 }
 for(let i=0;i<floorRecords.length;i++){const f=floorRecords[i];if(f.transitions.up)f.transitions.up={...f.transitions.up,spaceInstanceId:floorRecords[i-1].spaceInstanceId,targetAnchor:copyWire(floorRecords[i-1].transitions.down.anchor)};if(f.transitions.down)f.transitions.down={...f.transitions.down,spaceInstanceId:floorRecords[i+1].spaceInstanceId,targetAnchor:copyWire(floorRecords[i+1].transitions.up.anchor)};}
 const first=floorRecords[0],interior={recipeVersion:binding.packageVersion,siteId:site.siteId,logicalSpaceId:first.logicalSpaceId,contentHash:binding.contentHash,collision:copyWire(first.collision),entrance:copyWire(first.entrance),rooms:copyWire(first.graph.rooms),decorations:copyWire(first.visual.decorations),groupId:first.groupId,visual:copyWire(first.visual)};
 const functionalSite={version:FUNCTIONAL_SITE_FAMILY_D12,siteId:site.siteId,packageId:binding.packageId,packageVersion:binding.packageVersion,contentHash:binding.contentHash,label:WOODLAND_CAVE_FAMILY_D12.label,siteKind:WOODLAND_CAVE_FAMILY_D12.siteKind,familyId:generated.familyId,familyVersion:generated.familyVersion,generatorVersion:generated.generatorVersion,moduleCatalogVersion:generated.moduleCatalogVersion,siteSeed:generated.siteSeed,spawnProvenance:copyWire(generated.spawnProvenance),sizeTier:generated.sizeTier,floorCount:generated.floorCount,floorIds:copyWire(generated.floorIds),layoutHash:generated.layoutHash,encounterProvenance:copyWire(generated.encounterProvenance),rewardProvenance:copyWire(generated.rewardProvenance),socket:copyWire(site),spaceInstanceId:first.spaceInstanceId,interior,floors:floorRecords,conqueredTick:null,discoveredByPlayerIds:[]};
 functionalSite.instanceHash=bytesToHex(await hashBytes(utf8(canonicalStringify({functionalSite,groups,economies,episodes,actors,resources})),sha256));
 return freezeWire({functionalSite,spaces,groups,economies,episodes,actors,resources});
}

export const WOODLAND_CAVE_FAMILY_DEFINITION_D12=Object.freeze({package:WOODLAND_CAVE_FAMILY_PACKAGE_D12,family:WOODLAND_CAVE_FAMILY_D12,placement:'generated-interior-family',build:buildWoodlandCaveFamilyD12});
