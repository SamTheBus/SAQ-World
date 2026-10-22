import {freezeWire,copyWire,canonicalStringify,requireContract as check} from '../contracts/wire.js';
import {hashBytes,frameUtf8,bytesToHex,utf8} from '../contracts/hashing.js';
import {combatInteger} from '../contracts/combat_amount.js';
import {ORDINARY_ENEMIES,ORDINARY_ACQUIRE_RANGE,resolveOrdinaryProfile} from './ordinary_enemies.js';
import {threatEndpointsD9} from '../contracts/threat_power_d9.js';
import {prepareEpisodeSnapshotD9,unfrozenEpisodeD9} from '../contracts/episode_progression_d9.js';
import {D9_THREAT_VERSION} from '../contracts/encounter_progression.js';

export const WOODLAND_RUIN_PACKAGE_ID='woodland-overgrown-ruin';
export const WOODLAND_RUIN_VERSION='woodland-overgrown-ruin-d9-v1';
export const WOODLAND_RUIN_CONTENT_HASH='df347eceb3224eaf1f924530fdd26ce25d50f3aa39471a8836dc611bbe93a1fb';
export const WOODLAND_RUIN_PACKAGE=freezeWire({
 packageId:WOODLAND_RUIN_PACKAGE_ID,packageVersion:WOODLAND_RUIN_VERSION,contentHash:WOODLAND_RUIN_CONTENT_HASH,
 siteClass:'dungeon',capabilities:['interior'],biomes:['woodland'],minimumLevel:1,maximumLevel:null,
 repeatable:false,unique:true,reservedSiteId:null
});

// One fixed, authored room sequence. The socket seed supplies identity only;
// it never rearranges the interior or rerolls its encounter on reopen.
const ROWS=[
 '222222222222222222222222',
 '200000000000000000000002',
 '201111111111111111111102',
 '201111111111111111111102',
 '201111111111111111111102',
 '201111111111111111111102',
 '201111111111111111111102',
 '201111111111111111111102',
 '201111111111111111111102',
 '201111111100001111111102',
 '201111111111111111111102',
 '201111111111111111111102',
 '201111111111111111111102',
 '201111111111111111111102',
 '201111111111111111111102',
 '201111111111111111111102',
 '201111111111111111111102',
 '201111111111111111111102',
 '200000000001100000000002',
 '222222222222222222222222'
];
export const WOODLAND_RUIN_TEMPLATE=freezeWire({
 version:WOODLAND_RUIN_VERSION,label:'Overgrown Ruin',siteKind:'woodland-ruin',
 collision:{tileSize:32,width:24,height:20,tiles:ROWS},entrance:{x:384,y:544},
 rooms:[{roomId:'arrival',role:'arrival',x:8,y:13,width:8,height:5},{roomId:'ruin-court',role:'encounter',x:5,y:3,width:14,height:9}],
 decorations:[
  {kind:'sconce',x:5,y:2},{kind:'sconce',x:18,y:2},{kind:'vine',x:3,y:4},{kind:'vine',x:20,y:8},
  {kind:'roots',x:7,y:12},{kind:'rubble',x:16,y:13},{kind:'mushrooms',x:4,y:15}
 ],
 encounter:{rank:'C',members:[{family:'sprout',x:304,y:240},{family:'slime',x:464,y:240}]},
 reward:{kind:'chest',art:'chest',position:{x:384,y:128}}
});

const token=async(site,key,sha256)=>bytesToHex((await hashBytes(frameUtf8([WOODLAND_RUIN_VERSION,site.siteId,key]),sha256)).slice(0,16));
export async function buildWoodlandRuinD9(state,site,binding,{sha256}){
 check(binding.packageId===WOODLAND_RUIN_PACKAGE_ID&&binding.packageVersion===WOODLAND_RUIN_VERSION&&binding.contentHash===WOODLAND_RUIN_CONTENT_HASH,'Missing or corrupt Woodland ruin package');
 const spaceInstanceId='spi:'+await token(site,'space-instance',sha256),logicalSpaceId='spc:'+await token(site,'logical-space',sha256),groupId='site:'+site.siteId+':overgrown-court';
 const members=[],actors=[],entityIds=[];
 for(let n=0;n<WOODLAND_RUIN_TEMPLATE.encounter.members.length;n++){
  const spec=WOODLAND_RUIN_TEMPLATE.encounter.members[n],enemy=ORDINARY_ENEMIES.find(e=>e.family===spec.family),profile=resolveOrdinaryProfile(enemy,WOODLAND_RUIN_TEMPLATE.encounter.rank),entityId='ent:'+await token(site,'enemy-'+n,sha256);
  entityIds.push(entityId);members.push({entityId,enemyDefinitionId:enemy.enemyDefinitionId,profileId:profile.contentDefinitionId,position:{x:spec.x,y:spec.y}});
 }
 const episode={...unfrozenEpisodeD9('site-anchor:'+site.siteId,0),geography:{chunkX:site.entrance.chunkX,chunkY:site.entrance.chunkY,anchorOrdinal:0,minimumLevel:copyWire(site.minimumLevel),rank:WOODLAND_RUIN_TEMPLATE.encounter.rank}};
 episode.snapshot=prepareEpisodeSnapshotD9(episode,{tick:state.tick,minimumLevel:site.minimumLevel,participants:Object.values(state.playersById).map(p=>{const a=state.entitiesById[p.entityId];return {playerId:p.playerId,alive:a.alive,spaceInstanceId:a.residency.spaceInstanceId,position:copyWire(state.d9World.positions[a.entityId]??site.entrance),heroLevel:p.progression.level};}),anchor:site.entrance,spaceInstanceId:state.overworldInstanceId,rank:WOODLAND_RUIN_TEMPLATE.encounter.rank,trigger:'activation'});
 for(let n=0;n<members.length;n++){
  const member=members[n],profile=worldOrdinaryMeleeProfile(state,state.content.definitionsById[member.profileId]),stats=threatEndpointsD9(episode.snapshot.effectiveLevel,WOODLAND_RUIN_TEMPLATE.encounter.rank,ORDINARY_ENEMIES.find(e=>e.enemyDefinitionId===member.enemyDefinitionId).budget);
  actors.push({entityId:member.entityId,contentDefinitionId:profile.contentDefinitionId,kind:'actor',ownerCharacterId:null,team:'hostile',hp:combatInteger(stats.maxHp),maxHp:combatInteger(stats.maxHp),position:copyWire(member.position),hullRadius:profile.hullRadius,combatRadius:profile.combatRadius,movementIntent:{x:0,y:0},moveSpeed:profile.moveSpeed,alive:true,attackDamage:combatInteger(stats.attackDamage),attackReach:profile.attackReach,attackReachMode:profile.attackReachMode,attackDelayTicks:profile.attackDelayTicks,attackTimer:profile.attackDelayTicks,nextAttackActionSequence:1,movedLastTick:false,ai:{kind:'simpleMelee',acquireRange:ORDINARY_ACQUIRE_RANGE,updatesApplied:0},residency:{spaceInstanceId,residencyRevision:1}});
 }
 const interior={recipeVersion:WOODLAND_RUIN_VERSION,siteId:site.siteId,logicalSpaceId,contentHash:WOODLAND_RUIN_CONTENT_HASH,collision:copyWire(WOODLAND_RUIN_TEMPLATE.collision),entrance:copyWire(WOODLAND_RUIN_TEMPLATE.entrance),rooms:copyWire(WOODLAND_RUIN_TEMPLATE.rooms),decorations:copyWire(WOODLAND_RUIN_TEMPLATE.decorations),groupId};
 const functionalSite={version:'functional-site-d9-v1',siteId:site.siteId,packageId:binding.packageId,packageVersion:binding.packageVersion,contentHash:binding.contentHash,label:WOODLAND_RUIN_TEMPLATE.label,siteKind:WOODLAND_RUIN_TEMPLATE.siteKind,socket:copyWire(site),spaceInstanceId,interior,conqueredTick:null};
 const group={groupId,siteId:site.siteId,spaceInstanceId,entityIds,cleared:false,lastRequiredTick:null,threatSnapshot:{version:D9_THREAT_VERSION,activatedTick:state.tick,levelsByEntityId:Object.fromEntries(entityIds.map(id=>[id,copyWire(episode.snapshot.effectiveLevel)]))},threatReady:false};
 const economy={episode:0,startedTick:state.tick,eligibleReturn:0,clearedTick:null,vacatedTick:null,usedResources:{},contentDepth:copyWire(episode.snapshot.sourceDepth)};
 const resource={groupId,ordinal:0,kind:'chest',art:'chest',position:copyWire(WOODLAND_RUIN_TEMPLATE.reward.position),spaceInstanceId,completion:true};
 const commitment=bytesToHex(await hashBytes(utf8(canonicalStringify({functionalSite,group,economy,episode,actors,resource})),sha256));
 functionalSite.instanceHash=commitment;
 return freezeWire({functionalSite,space:{spaceId:logicalSpaceId,spaceInstanceId,spaceRevision:1,collision:copyWire(interior.collision)},group,economy,episode,actors,resource,members});
}
import {worldOrdinaryMeleeProfile} from './world_melee_geometry.js';
