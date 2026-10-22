import {validateAegisMimicEncounter} from './aegis_mimics_v2.js';
import {aegisTowerHealth,livingFusedMimics,aegisTowerHalfAngle} from '../content/aegis_mimics_v2.js';
import {bytesToHex,frameUtf8,hashBytes} from './hashing.js';
import {closedRecord,copyWire,freezeWire,requireContract as check,safeInteger} from './wire.js';
import {AEGIS_GOLIATH_ID,AEGIS_GOLIATH,AEGIS_PHYSICAL_PROFILE,aegisFortFloor} from '../content/aegis_goliath_v1.js';
import {collidesWithTiles} from '../rules/world_geometry.js';

export const AEGIS_RECORD_VERSION='aegis-goliath-v1';
const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const abilities=['magnetic_pull','boomerang_shield','shield_bash'];
export async function createAegisGoliath({campaignSeed,siteId,floorId,groupId,roomId,entityId,homePosition,activatedTick,spaceInstanceId,sourceResidencyRevision},{sha256}){
 const digest=bytesToHex((await hashBytes(frameUtf8(['aegis-goliath-v1',campaignSeed,siteId,floorId,groupId,entityId]),sha256)).slice(0,16));
 return freezeWire({boss:{version:AEGIS_RECORD_VERSION,bossId:'boss:'+digest,bossDefinitionId:AEGIS_GOLIATH_ID,entityId,siteId,floorId,groupId,roomId,homePosition:copyWire(homePosition),activatedTick,spaceInstanceId,sourceResidencyRevision,
  phase:1,phase2Triggered:false,actionState:'idle',activeAbility:null,targetEntityId:null,targetPosition:null,telegraphStartedTick:null,resolvesTick:null,nextActionTick:activatedTick+60,strikeCooldownUntilTick:activatedTick,
  abilitySequence:0,selectionSeed:parseInt(digest.slice(0,8),16)>>>0,shieldAngle:Math.PI/2,shieldActive:false,shieldStartedTick:null,shieldBrokenTick:null,dazedUntilTick:null,summonEntityIds:[],projectilesById:{},knockbacksByEntityId:{},lastAction:null},summons:[]});
}
export function validateAegisGoliath(state,key,b){
 closedRecord(b,['version','bossId','bossDefinitionId','entityId','siteId','floorId','groupId','roomId','homePosition','activatedTick','spaceInstanceId','sourceResidencyRevision','phase','phase2Triggered','actionState','activeAbility','targetEntityId','targetPosition','telegraphStartedTick','resolvesTick','nextActionTick','strikeCooldownUntilTick','abilitySequence','selectionSeed','shieldAngle','shieldActive','shieldStartedTick','shieldBrokenTick','dazedUntilTick','summonEntityIds','projectilesById','knockbacksByEntityId','lastAction'],['mimicEncounter']);
 const a=state.entitiesById[key],g=state.groupsById[b.groupId];
 check(b.version===AEGIS_RECORD_VERSION&&b.bossDefinitionId===AEGIS_GOLIATH_ID&&/^boss:[a-f0-9]{32}$/.test(b.bossId)&&b.entityId===key&&a?.team==='hostile'&&a.contentDefinitionId===AEGIS_PHYSICAL_PROFILE.contentDefinitionId&&g?.entityIds.includes(key)&&g.siteId===b.siteId&&a.residency.spaceInstanceId===b.spaceInstanceId&&a.residency.residencyRevision===b.sourceResidencyRevision&&point(b.homePosition),'Invalid Aegis identity');
 check([1,2].includes(b.phase)&&b.phase2Triggered===(b.phase===2)&&Number.isFinite(b.shieldAngle)&&Math.abs(b.shieldAngle)<=Math.PI,'Invalid Aegis phase/direction');
 check(['idle','telegraphing','dazed','defeated',...(b.mimicEncounter?['recalling']:[])].includes(b.actionState)&&Array.isArray(b.summonEntityIds)&&b.summonEntityIds.length===(b.mimicEncounter?3:0),'Invalid Aegis action');
 if(!b.mimicEncounter)check(b.shieldActive===(a.alive&&b.phase===2&&b.actionState!=='dazed')&&b.shieldBrokenTick===null,'Invalid Aegis shield');else validateAegisMimicEncounter(state,b);
 safeInteger(b.activatedTick,0,state.tick);safeInteger(b.nextActionTick,0,state.tick+210);safeInteger(b.strikeCooldownUntilTick,0,state.tick+50);safeInteger(b.abilitySequence,0);safeInteger(b.selectionSeed,0,0xffffffff);
 if(b.shieldStartedTick!==null)safeInteger(b.shieldStartedTick,b.activatedTick,state.tick);
 if(b.actionState==='telegraphing'){
  check(abilities.includes(b.activeAbility)&&point(b.targetPosition)&&state.entitiesById[b.targetEntityId]?.team==='party'&&(b.activeAbility!=='shield_bash'||b.phase===2),'Invalid Aegis telegraph');safeInteger(b.telegraphStartedTick,b.activatedTick,state.tick);safeInteger(b.resolvesTick,b.telegraphStartedTick+AEGIS_GOLIATH[b.activeAbility].telegraphTicks,b.telegraphStartedTick+AEGIS_GOLIATH[b.activeAbility].telegraphTicks);
 }else check(b.activeAbility===null&&b.targetEntityId===null&&b.targetPosition===null&&b.telegraphStartedTick===null&&b.resolvesTick===null,'Stale Aegis telegraph');
 if(b.actionState==='dazed')safeInteger(b.dazedUntilTick,state.tick+1,state.tick+210);else check(b.dazedUntilTick===null,'Stale Aegis daze');
 if(!a.alive)check(b.actionState==='defeated'&&!Object.keys(b.projectilesById).length&&!Object.keys(b.knockbacksByEntityId).length,'Active defeated Aegis');
 check(Object.keys(b.projectilesById).length<=4,'Aegis projectile budget exceeded');
 for(const [id,p]of Object.entries(b.projectilesById)){
  closedRecord(p,['id','position','velocity','firedTick','expiresTick','sequence','ordinal']);check(p.id===id&&id===b.bossId+':shield:'+p.sequence+':'+p.ordinal&&point(p.position)&&point(p.velocity)&&Math.hypot(p.velocity.x,p.velocity.y)<=5.500001,'Invalid Aegis projectile');safeInteger(p.sequence,1,b.abilitySequence);safeInteger(p.ordinal,0,1);safeInteger(p.firedTick,b.activatedTick,state.tick);safeInteger(p.expiresTick,p.firedTick+180,p.firedTick+180);check(state.tick<p.expiresTick,'Expired Aegis projectile');
 }
 for(const[id,k]of Object.entries(b.knockbacksByEntityId)){
  closedRecord(k,['velocity','expiresTick','residencyRevision']);const t=state.entitiesById[id];check(t?.team==='party'&&t.alive&&t.residency.spaceInstanceId===b.spaceInstanceId&&k.residencyRevision===t.residency.residencyRevision&&point(k.velocity)&&Math.hypot(k.velocity.x,k.velocity.y)<=10.000001,'Invalid Aegis knockback');safeInteger(k.expiresTick,state.tick+1,state.tick+12);
 }
 if(b.lastAction!==null){closedRecord(b.lastAction,['ability','resolvedTick','targetPosition','hitEntityIds']);check([...abilities,'strike'].includes(b.lastAction.ability)&&point(b.lastAction.targetPosition)&&Array.isArray(b.lastAction.hitEntityIds)&&new Set(b.lastAction.hitEntityIds).size===b.lastAction.hitEntityIds.length&&b.lastAction.hitEntityIds.every(id=>state.entitiesById[id]?.team==='party'),'Invalid Aegis action history');safeInteger(b.lastAction.resolvedTick,b.activatedTick,state.tick);}
 return b;
}
export function validateAegisFortBinding(state,site,floor,index,actor,b){
 check(aegisFortFloor(site,floor.index)&&index===0&&b.entityId===actor.entityId&&b.siteId===site.siteId&&b.floorId===floor.floorId&&b.groupId===floor.groupId&&b.roomId===floor.encounter.members[0].roomId&&actor.residency.spaceInstanceId===floor.spaceInstanceId&&actor.contentDefinitionId===AEGIS_PHYSICAL_PROFILE.contentDefinitionId&&actor.hullRadius===34&&!state.eliteCombat?.elitesByEntityId?.[actor.entityId]&&!collidesWithTiles(floor.collision,b.homePosition.x,b.homePosition.y,34),'Invalid Fort Aegis binding');
}
export function projectAegisGoliath(b,state=null){return freezeWire({bossId:b.bossId,bossDefinitionId:b.bossDefinitionId,label:AEGIS_GOLIATH.label,phase:b.phase,actionState:b.actionState,shieldAngle:b.shieldAngle,shieldActive:b.shieldActive,shieldStartedTick:b.shieldStartedTick,shieldBrokenTick:b.shieldBrokenTick,dazedUntilTick:b.dazedUntilTick,...(b.mimicEncounter?{mimicEncounter:{recallStartedTick:b.mimicEncounter.recallStartedTick,recallEndsTick:b.mimicEncounter.recallEndsTick,recallResolvedTick:b.mimicEncounter.recallResolvedTick,enragedTick:b.mimicEncounter.enragedTick,towerMaxHp:b.mimicEncounter.towerMaxHp,towerHp:state?aegisTowerHealth(state,b):'0',fusedOrdinals:state?livingFusedMimics(state,b).map(m=>m.ordinal):[],livingMimics:state?Object.values(b.mimicEncounter.mimicsByEntityId).filter(m=>state.entitiesById[m.entityId]?.alive).length:0}}:{}),lastAction:copyWire(b.lastAction),pendingAction:b.actionState==='telegraphing'?{ability:b.activeAbility,targetEntityId:b.targetEntityId,targetPosition:copyWire(b.targetPosition),startedTick:b.telegraphStartedTick,resolvesTick:b.resolvesTick}:null});}
export function projectAegisHazards(state,spaceInstanceId){
 const bosses=Object.values(state.bossCombat?.bossesByEntityId??{}).filter(b=>b.bossDefinitionId===AEGIS_GOLIATH_ID&&b.spaceInstanceId===spaceInstanceId&&state.entitiesById[b.entityId]?.alive).sort((a,b)=>a.bossId.localeCompare(b.bossId));
 if(!bosses.length)return {};
 return {aegisTelegraphs:bosses.filter(b=>b.actionState==='telegraphing').map(b=>({bossId:b.bossId,ability:b.activeAbility,position:copyWire(state.entitiesById[b.entityId].position),angle:b.activeAbility==='shield_bash'?b.shieldAngle:Math.atan2(b.targetPosition.y-state.entitiesById[b.entityId].position.y,b.targetPosition.x-state.entitiesById[b.entityId].position.x),startedTick:b.telegraphStartedTick,resolvesTick:b.resolvesTick})),aegisProjectiles:bosses.flatMap(b=>Object.values(b.projectilesById).map(copyWire))};
}
