import {freezeWire,copyWire,canonicalStringify,requireContract as check} from '../contracts/wire.js';
import {hashBytes,frameUtf8,bytesToHex,utf8} from '../contracts/hashing.js';
import {combatInteger} from '../contracts/combat_amount.js';
import {ORDINARY_ENEMIES,ORDINARY_ACQUIRE_RANGE,resolveOrdinaryProfile} from './ordinary_enemies.js';
import {threatEndpointsD9} from '../contracts/threat_power_d9.js';
import {prepareEpisodeSnapshotD9,unfrozenEpisodeD9} from '../contracts/episode_progression_d9.js';
import {D9_THREAT_VERSION} from '../contracts/encounter_progression.js';
import {ENCOUNTER_CONTAINMENT_D11_2_VERSION,HOSTILE_MOTION_D11_2_VERSION,hostileMeleeMotionD11_2} from './encounter_motion_d11_2.js';

const actorAi=(family,tick)=>{const timing=hostileMeleeMotionD11_2(family);return {kind:'simpleMelee',acquireRange:ORDINARY_ACQUIRE_RANGE,updatesApplied:0,...(timing?{melee:{version:HOSTILE_MOTION_D11_2_VERSION,phase:'idle',phaseStartedTick:tick,phaseEndsTick:tick,targetEntityId:null,actionSequence:0},motion:{version:HOSTILE_MOTION_D11_2_VERSION,startedTick:null,lastMovedTick:null}}:{})};};
const containment=(definition,members,tick)=>{if(!definition.containment)return null;const x=members.reduce((n,m)=>n+m.position.x,0)/members.length,y=members.reduce((n,m)=>n+m.position.y,0)/members.length;return {version:ENCOUNTER_CONTAINMENT_D11_2_VERSION,homeAnchor:{x,y},memberHomesById:Object.fromEntries(members.map(m=>[m.entityId,copyWire(m.position)])),...copyWire(definition.containment),mode:'guard',outsideTicks:0,modeStartedTick:tick};};

// A data-defined site builder. Future biome forts can supply a new immutable
// definition without copying authority, identity, encounter, or reward logic.
export async function buildDefinedFunctionalSiteD10(state,site,binding,definition,{sha256,identityDomain=null,frozenSnapshot=null}={}){
 const {package:pkg,template,groupSuffix}=definition;
 check(binding.packageId===pkg.packageId&&binding.packageVersion===pkg.packageVersion&&binding.contentHash===pkg.contentHash,'Missing or corrupt site package');
 const token=async key=>bytesToHex((await hashBytes(frameUtf8([pkg.packageVersion,site.siteId,identityDomain===null?key:identityDomain+'/'+key]),sha256)).slice(0,16));
 const spaceInstanceId='spi:'+await token('space-instance'),logicalSpaceId='spc:'+await token('logical-space'),groupId='site:'+site.siteId+':'+groupSuffix;
 const members=[],actors=[],entityIds=[];
 for(let n=0;n<template.encounter.members.length;n++){
  const spec=template.encounter.members[n],enemy=ORDINARY_ENEMIES.find(e=>e.family===spec.family);check(enemy,'Unknown site enemy');
  const profile=resolveOrdinaryProfile(enemy,template.encounter.rank),entityId='ent:'+await token('enemy-'+n);
  entityIds.push(entityId);members.push({entityId,enemyDefinitionId:enemy.enemyDefinitionId,profileId:profile.contentDefinitionId,position:{x:spec.x,y:spec.y}});
 }
 const episode={...unfrozenEpisodeD9('site-anchor:'+site.siteId,0),geography:{chunkX:site.entrance.chunkX,chunkY:site.entrance.chunkY,anchorOrdinal:0,minimumLevel:copyWire(site.minimumLevel),rank:template.encounter.rank}};
 episode.snapshot=frozenSnapshot?copyWire(frozenSnapshot):prepareEpisodeSnapshotD9(episode,{tick:state.tick,minimumLevel:site.minimumLevel,participants:Object.values(state.playersById).map(p=>{const a=state.entitiesById[p.entityId];return {playerId:p.playerId,alive:a.alive,spaceInstanceId:a.residency.spaceInstanceId,position:copyWire(state.d9World.positions[a.entityId]??site.entrance),heroLevel:p.progression.level};}),anchor:site.entrance,spaceInstanceId:state.overworldInstanceId,rank:template.encounter.rank,trigger:'activation'});
 for(const member of members){
  const profile=state.content.definitionsById[member.profileId],enemy=ORDINARY_ENEMIES.find(e=>e.enemyDefinitionId===member.enemyDefinitionId),stats=threatEndpointsD9(episode.snapshot.effectiveLevel,template.encounter.rank,enemy.budget);
  actors.push({entityId:member.entityId,contentDefinitionId:profile.contentDefinitionId,kind:'actor',ownerCharacterId:null,team:'hostile',hp:combatInteger(stats.maxHp),maxHp:combatInteger(stats.maxHp),position:copyWire(member.position),hullRadius:profile.hullRadius,combatRadius:profile.combatRadius,movementIntent:{x:0,y:0},moveSpeed:profile.moveSpeed,alive:true,attackDamage:combatInteger(stats.attackDamage),attackReach:profile.attackReach,attackReachMode:profile.attackReachMode,attackDelayTicks:profile.attackDelayTicks,attackTimer:profile.attackDelayTicks,nextAttackActionSequence:1,movedLastTick:false,ai:actorAi(enemy.family,state.tick),residency:{spaceInstanceId,residencyRevision:1}});
 }
 const interior={recipeVersion:pkg.packageVersion,siteId:site.siteId,logicalSpaceId,contentHash:pkg.contentHash,collision:copyWire(template.collision),entrance:copyWire(template.entrance),rooms:copyWire(template.rooms),decorations:copyWire(template.decorations),groupId,...(template.visual?{visual:copyWire(template.visual)}:{})};
 const functionalSite={version:'functional-site-d9-v1',siteId:site.siteId,packageId:binding.packageId,packageVersion:binding.packageVersion,contentHash:binding.contentHash,label:template.label,siteKind:template.siteKind,socket:copyWire(site),spaceInstanceId,interior,conqueredTick:null};
 const group={groupId,siteId:site.siteId,spaceInstanceId,entityIds,cleared:false,lastRequiredTick:null,threatSnapshot:{version:D9_THREAT_VERSION,activatedTick:state.tick,levelsByEntityId:Object.fromEntries(entityIds.map(id=>[id,copyWire(episode.snapshot.effectiveLevel)]))},threatReady:false,...(definition.containment?{containment:containment(definition,members,state.tick)}:{})};
 const economy={episode:0,startedTick:state.tick,eligibleReturn:0,clearedTick:null,vacatedTick:null,usedResources:{},contentDepth:copyWire(episode.snapshot.sourceDepth)};
 const resource={groupId,ordinal:0,kind:'chest',art:'chest',position:copyWire(template.reward.position),spaceInstanceId,completion:true};
 functionalSite.instanceHash=bytesToHex(await hashBytes(utf8(canonicalStringify({functionalSite,group,economy,episode,actors,resource})),sha256));
 return freezeWire({functionalSite,space:{spaceId:logicalSpaceId,spaceInstanceId,spaceRevision:1,collision:copyWire(interior.collision)},group,economy,episode,actors,resource,members});
}

// The same immutable site definition can place its encounter in the overworld
// while retaining one small instanced room. Initial actors/resources are held
// as parcel-relative values until all four pages are admitted together.
export async function buildDefinedWorldCompoundD10(state,parcel,binding,definition,{sha256}){
 const site=parcel.socket,{package:pkg,template,groupSuffix}=definition;
 check(template.placement==='overworld-compound'&&site.siteId===parcel.siteId&&binding.packageId===pkg.packageId&&binding.packageVersion===pkg.packageVersion&&binding.contentHash===pkg.contentHash,'Invalid compound binding');
 const token=async key=>bytesToHex((await hashBytes(frameUtf8([pkg.packageVersion,site.siteId,key]),sha256)).slice(0,16));
 const spaceInstanceId='spi:'+await token('space-instance'),logicalSpaceId='spc:'+await token('logical-space'),groupId='site:'+site.siteId+':'+groupSuffix;
 const members=[],actors=[],entityIds=[];
 for(let n=0;n<template.encounter.members.length;n++){
  const spec=template.encounter.members[n],enemy=ORDINARY_ENEMIES.find(e=>e.family===spec.family);check(enemy,'Unknown compound enemy');
  const profile=resolveOrdinaryProfile(enemy,template.encounter.rank),entityId='ent:'+await token('enemy-'+n),stats=threatEndpointsD9(site.minimumLevel,template.encounter.rank,enemy.budget),position={x:spec.x,y:spec.y};
  entityIds.push(entityId);members.push({entityId,enemyDefinitionId:enemy.enemyDefinitionId,profileId:profile.contentDefinitionId,position:copyWire(position)});
  actors.push({entityId,contentDefinitionId:profile.contentDefinitionId,kind:'actor',ownerCharacterId:null,team:'hostile',hp:combatInteger(stats.maxHp),maxHp:combatInteger(stats.maxHp),position:copyWire(position),hullRadius:profile.hullRadius,combatRadius:profile.combatRadius,movementIntent:{x:0,y:0},moveSpeed:profile.moveSpeed,alive:true,attackDamage:combatInteger(stats.attackDamage),attackReach:profile.attackReach,attackReachMode:profile.attackReachMode,attackDelayTicks:profile.attackDelayTicks,attackTimer:profile.attackDelayTicks,nextAttackActionSequence:1,movedLastTick:false,ai:actorAi(spec.family,state.tick),residency:{spaceInstanceId:state.overworldInstanceId,residencyRevision:1}});
 }
 const episode={...unfrozenEpisodeD9('site-anchor:'+site.siteId,0),geography:{chunkX:site.entrance.chunkX,chunkY:site.entrance.chunkY,anchorOrdinal:0,minimumLevel:copyWire(site.minimumLevel),rank:template.encounter.rank}};
 const group={groupId,siteId:site.siteId,spaceInstanceId:state.overworldInstanceId,entityIds,cleared:false,lastRequiredTick:null,threatSnapshot:{version:D9_THREAT_VERSION,activatedTick:state.tick,levelsByEntityId:Object.fromEntries(entityIds.map(id=>[id,copyWire(site.minimumLevel)]))},threatReady:false,...(definition.containment?{containment:containment(definition,members,state.tick)}:{})};
 const economy={episode:0,startedTick:state.tick,eligibleReturn:0,clearedTick:null,vacatedTick:null,usedResources:{},contentDepth:copyWire(site.minimumLevel)};
 const resource={groupId,ordinal:0,kind:'chest',art:'chest',position:copyWire(template.reward.position),spaceInstanceId:state.overworldInstanceId,completion:true};
 const definitionRow={groupId,regionId:'d9-region:'+site.region.regionX+','+site.region.regionY,anchor:{x:template.keepDoor.x,y:template.keepDoor.y+128},members:copyWire(members)};
 const interior={recipeVersion:pkg.packageVersion,siteId:site.siteId,logicalSpaceId,contentHash:pkg.contentHash,collision:copyWire(template.keep.collision),entrance:copyWire(template.keep.entrance),rooms:[{roomId:'keep',role:'arrival',x:1,y:1,width:12,height:10}],decorations:copyWire(template.keep.visual.decorations??[]),groupId,visual:copyWire(template.keep.visual)};
 const functionalSite={version:'functional-site-d10-compound-v1',siteId:site.siteId,packageId:binding.packageId,packageVersion:binding.packageVersion,contentHash:binding.contentHash,label:template.label,siteKind:template.siteKind,socket:copyWire(site),spaceInstanceId,interior,compound:copyWire(parcel),initial:{group,economy,episode,actors,resource,definition:definitionRow},conqueredTick:null};
 functionalSite.instanceHash=bytesToHex(await hashBytes(utf8(canonicalStringify(functionalSite)),sha256));
 return freezeWire({functionalSite,space:{spaceId:logicalSpaceId,spaceInstanceId,spaceRevision:1,collision:copyWire(interior.collision)}});
}
