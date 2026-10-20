import {worldOrdinaryMeleeProfile} from '../content/world_melee_geometry.js';
import {adoptOrdinaryRosters,restoreOrdinaryRosterProfiles} from './ordinary_roster_v1.js';
import {HOSTILE_MOTION_D11_2_VERSION,hostileMeleeMotionD11_2} from '../content/encounter_motion_d11_2.js';
import {hasWorldCombat,WORLD_COMBAT_VERSION} from '../content/world_combat_v1.js';
import {ORDINARY_ENEMIES,ORDINARY_ACQUIRE_RANGE,resolveOrdinaryProfile} from '../content/ordinary_enemies.js';
import {D9_PROFILE as P} from '../content/world_profile_d9.js';
import {worldIdentity} from '../generation/world_identity_d9.js';
import {normalizeWorldPosition} from './world_address.js';
import {projectToLocalFrameD9,localFramePositionD9} from './local_world_frames_d9.js';
import {chooseEpisodePlacementD9,unfrozenEpisodeD9} from './episode_progression_d9.js';
import {collidesWithTiles} from '../rules/world_geometry.js';
import {assertActorGeometryD9} from './actor_geometry_d9.js';
import {combatInteger} from './combat_amount.js';
import {copyWire,requireContract as check} from './wire.js';
import {hashReward} from '../content/economy_rewards.js';
import {hasUnresolvedGear,retireEncounterRewards} from './renewable_inventory.js';
import {safeInteger,canonicalStringify} from './wire.js';
import {fortParcelOwnsWorldPositionD10} from '../generation/woodland_fort_placement_d10.js';
import {caveParcelOwnsWorldPositionD10} from '../generation/woodland_cave_placement_d10.js';
export async function prepareProceduralEncounterD9(state,chunk,anchor,{sha256,episode=0,participants,renewal=false}){
 const groupId='ordinary:'+anchor.id.split(':').at(-1),frames=state.d9World.runtime.frames,spaceInstanceId=state.overworldInstanceId,c=state.spacesByInstanceId[spaceInstanceId].collision;
 check(renewal?state.groupsById[groupId]?.cleared&&state.d9World.episodes[groupId]?.renewalEligible&&!hasUnresolvedGear(state,groupId):!state.groupsById[groupId],renewal?'Encounter renewal unavailable':'Encounter already resident');
 const world=p=>normalizeWorldPosition({chunkX:chunk.chunkX,chunkY:chunk.chunkY,localX:p.x,localY:p.y}),local=p=>{const q=projectToLocalFrameD9(p,frames);return q?{x:q.x,y:q.y}:null;};
 const h=hashReward(`${anchor.id}/placement/${episode}`),candidates=[];
 for(let i=0;i<P.placementCandidates;i++){const angle=((h%360)+i*137.508)*Math.PI/180,r=i===0?0:32+(i%5)*32,p={x:Math.round(anchor.position.x+Math.cos(angle)*r),y:Math.round(anchor.position.y+Math.sin(angle)*r)};if(p.x<64||p.y<64||p.x>928||p.y>736)continue;candidates.push([world(p),world({x:p.x+32,y:p.y})]);}
 const reservations=Object.values(state.d9World.siteReservationsById??{}),fort=reservations.find(r=>r.packageId==='woodland-fort')?.parcel??null,cave=reservations.find(r=>r.packageId==='woodland-cave')?.parcel??null,parcelOwns=p=>fortParcelOwnsWorldPositionD10(fort,p)||caveParcelOwnsWorldPositionD10(cave,p);
 const isLegal=p=>{const q=local(p);return q&&!parcelOwns(p)&&!collidesWithTiles(c,q.x,q.y,10)&&!chunk.anchors.some(other=>other!==anchor&&Math.hypot(p.localX-other.position.x,p.localY-other.position.y)<72);};const pair=anchor.combatVersion===WORLD_COMBAT_VERSION?anchor.members.map(m=>world(m.position)):chooseEpisodePlacementD9({candidates,participants,spaceInstanceId,isLegal});if(!pair||anchor.combatVersion&&(pair.some(p=>!isLegal(p))||!chooseEpisodePlacementD9({candidates:[pair],participants,spaceInstanceId,isLegal,combat:true})))return null;
 const entityIds=[],actors=[],members=[];
 for(let n=0;n<pair.length;n++){const identity=await worldIdentity(state.campaign.seed.seedHex,'spawn',[chunk.chunkX,chunk.chunkY,anchor.ordinal,n],sha256),entityId='ent:'+identity.digest.slice(0,32),enemy=ORDINARY_ENEMIES.find(e=>e.family===anchor.members[n].family),profile=worldOrdinaryMeleeProfile(state,resolveOrdinaryProfile(enemy,anchor.rank)),position=local(pair[n]);entityIds.push(entityId);check(renewal?state.groupsById[groupId].entityIds[n]===entityId:!state.entitiesById[entityId],'Procedural entity identity collision');
  members.push({entityId,enemyDefinitionId:enemy.enemyDefinitionId,profileId:profile.contentDefinitionId,position:copyWire(position)});
  actors.push({entityId,contentDefinitionId:profile.contentDefinitionId,kind:'actor',ownerCharacterId:null,team:'hostile',hp:combatInteger(profile.maxHp),maxHp:combatInteger(profile.maxHp),position:copyWire(position),hullRadius:profile.hullRadius,combatRadius:profile.combatRadius,movementIntent:{x:0,y:0},moveSpeed:profile.moveSpeed,alive:true,attackDamage:combatInteger(profile.attackDamage),attackReach:profile.attackReach,attackReachMode:profile.attackReachMode,attackDelayTicks:profile.attackDelayTicks,attackTimer:profile.attackDelayTicks,nextAttackActionSequence:1,movedLastTick:false,ai:{kind:'simpleMelee',acquireRange:ORDINARY_ACQUIRE_RANGE,updatesApplied:0,...(anchor.combatVersion&&hostileMeleeMotionD11_2(enemy.family)?{melee:{version:HOSTILE_MOTION_D11_2_VERSION,phase:'idle',phaseStartedTick:state.tick,phaseEndsTick:state.tick,targetEntityId:null,actionSequence:0},motion:{version:HOSTILE_MOTION_D11_2_VERSION,startedTick:null,lastMovedTick:null}}:{})},residency:{spaceInstanceId,residencyRevision:1}});
 }
 const regionId='d9-region:'+chunk.region.regionX+','+chunk.region.regionY,definition={groupId,regionId,anchor:local(world(anchor.position)),members},record={...unfrozenEpisodeD9(anchor.id,episode),placement:copyWire(pair),geography:{chunkX:chunk.chunkX,chunkY:chunk.chunkY,anchorOrdinal:anchor.ordinal,minimumLevel:copyWire(chunk.region.minimumLevel),rank:anchor.rank}};
 const resources=[],mode=hashReward(anchor.id+'/resources')%3,count=[1,3,2][mode];
 for(let n=0;n<count+(mode===2?1:0);n++){const kind=n===count?'chest':'breakable',seed=hashReward(anchor.id+'/resource/'+n);let point=null;for(let i=0;i<64;i++){const angle=((seed%360)+i*137.508)*Math.PI/180,r=64+(i%5)*24,p={x:Math.round(definition.anchor.x+Math.cos(angle)*r),y:Math.round(definition.anchor.y+Math.sin(angle)*r)};if(!parcelOwns(localFramePositionD9(p,state.d9World.runtime.frames))&&!collidesWithTiles(c,p.x,p.y,12)&&resources.every(v=>Math.hypot(v.position.x-p.x,v.position.y-p.y)>=38)&&members.every(v=>Math.hypot(v.position.x-p.x,v.position.y-p.y)>=26)){point=p;break;}}check(point,'Procedural resource placement extension required');resources.push({groupId,ordinal:n,kind,art:kind==='chest'?'chest':['pot','barrel','urn'][seed%3],position:point,spaceInstanceId});}
 return {definition,actors,record,resources,group:{groupId,siteId:null,regionId,spaceInstanceId,entityIds,cleared:false,lastRequiredTick:null,threatSnapshot:null,threatReady:true,...(anchor.combatVersion?{containment:{version:'encounter-containment-d11.2-v1',homeAnchor:local(world(anchor.position)),memberHomesById:Object.fromEntries(members.map(m=>[m.entityId,m.position])),acquireRadius:320,pursuitRadius:800,disengageTicks:120,homeTolerance:12,approachRadius:20,mode:'guard',outsideTicks:0,modeStartedTick:state.tick}}:{})},economy:{episode,startedTick:state.tick,eligibleReturn:0,clearedTick:null,vacatedTick:null,usedResources:{},contentDepth:copyWire(chunk.region.minimumLevel)}};
}
export function admitProceduralEncounterD9(state,plan){check(plan&&!state.groupsById[plan.group.groupId],'Duplicate encounter admission');for(const a of plan.actors)check(!state.entitiesById[a.entityId],'Duplicate actor admission');assertActorGeometryD9(state,{actors:Object.fromEntries(plan.actors.map(a=>[a.entityId,a])),mutation:'procedural encounter admission',phase:'worker preparation'});for(const a of plan.actors)state.entitiesById[a.entityId]=copyWire(a);const id=plan.group.groupId;state.groupsById[id]=copyWire(plan.group);state.encounterEconomy.groups[id]=copyWire(plan.economy);state.d9World.episodes[id]=copyWire(plan.record);state.d9World.runtime.groups.push(copyWire(plan.definition));state.d9World.runtime.resources.push(...plan.resources.map(copyWire));state.d9World.runtime.revision++;adoptOrdinaryRosters(state,{groupIds:[id]});}

const participantStamp=state=>canonicalStringify(Object.values(state.playersById).map(p=>({playerId:p.playerId,revision:p.inventory.revision,actor:state.entitiesById[p.entityId]})));
export async function prepareProceduralRenewalD9(state,chunk,anchor,options){
 const id='ordinary:'+anchor.id.split(':').at(-1),old=state.d9World.episodes[id];if(!old?.renewalEligible||!state.groupsById[id]?.cleared||hasUnresolvedGear(state,id))return null;
 const position=projectToLocalFrameD9({chunkX:chunk.chunkX,chunkY:chunk.chunkY,localX:anchor.position.x,localY:anchor.position.y},state.d9World.runtime.frames);
 if(!position||!Object.values(state.playersById).some(p=>{const a=state.entitiesById[p.entityId];return a.alive&&a.residency.spaceInstanceId===state.overworldInstanceId&&Math.hypot(a.position.x-position.x,a.position.y-position.y)<=P.prepareRadius;}))return null;
 const guard={tick:state.tick,episode:canonicalStringify(old),participants:participantStamp(state)};
 const plan=await prepareProceduralEncounterD9(state,chunk,anchor,{...options,renewal:true,episode:safeInteger(state.encounterEconomy.groups[id].episode+1)});
 return plan?{...plan,renewalGuard:guard}:null;
}
export function applyProceduralRenewalD9(state,plan){
 const id=plan.group.groupId,old=state.d9World.episodes[id],guard=plan.renewalGuard;
 check(guard&&state.tick===guard.tick&&canonicalStringify(old)===guard.episode&&participantStamp(state)===guard.participants,'Stale procedural renewal preparation');
 check(old.renewalEligible&&state.groupsById[id].cleared&&!hasUnresolvedGear(state,id),'Renewal obligations changed');
 assertActorGeometryD9(state,{actors:Object.fromEntries(plan.actors.map(a=>[a.entityId,a])),mutation:'procedural encounter renewal',phase:'worker preparation'});
 const runtime=state.d9World.runtime,index=runtime.groups.findIndex(g=>g.groupId===id);check(index>=0,'Missing procedural placement');
 const priorRoster=old.ordinaryRoster?copyWire(old.ordinaryRoster):null;
 const renewalReceipt={version:'procedural-renewal-d9-v1',fromEpisode:old.episode,clearedTick:old.clearedTick,vacatedTick:old.vacatedTick,renewedTick:state.tick};
 retireEncounterRewards(state,id);
 for(const replacement of plan.actors){const a=state.entitiesById[replacement.entityId];Object.assign(a,{position:copyWire(replacement.position),hp:copyWire(replacement.hp),maxHp:copyWire(replacement.maxHp),attackDamage:copyWire(replacement.attackDamage),alive:true,attackTimer:hasWorldCombat(state)?replacement.attackDelayTicks:0,movementIntent:{x:0,y:0},movedLastTick:false});if(hasWorldCombat(state)){const updates=a.ai.updatesApplied;a.ai=copyWire(replacement.ai);a.ai.updatesApplied=updates;}}
 // Actor/attack identities survive; a new episode changes reward identity and
 // progression snapshot. D8 mastery receipt causality must never wind backward.
 state.groupsById[id]=copyWire(plan.group);state.encounterEconomy.groups[id]=copyWire(plan.economy);state.d9World.episodes[id]=copyWire(plan.record);
 state.d9World.episodes[id].renewalReceipt=renewalReceipt;if(priorRoster){state.d9World.episodes[id].ordinaryRoster=priorRoster;restoreOrdinaryRosterProfiles(state,id);}
 runtime.groups[index]=copyWire(plan.definition);runtime.resources=runtime.resources.filter(r=>r.groupId!==id).concat(plan.resources.map(copyWire));runtime.revision++;if(!priorRoster)adoptOrdinaryRosters(state,{groupIds:[id],safe:false,freshEpisodes:{[id]:state.encounterEconomy.groups[id].episode-1}});state.encounterEconomy.revision++;
}
