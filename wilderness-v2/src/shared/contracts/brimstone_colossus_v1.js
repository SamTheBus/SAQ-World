import {bytesToHex,frameUtf8,hashBytes} from './hashing.js';
import {closedRecord,copyWire,freezeWire,requireContract as check,safeInteger} from './wire.js';
import {BRIMSTONE_ID,BRIMSTONE as C,BRIMSTONE_PROFILE,brimstoneFortFloor,brimstoneVentArms} from '../content/brimstone_colossus_v1.js';
import {collidesWithTiles} from '../rules/world_geometry.js';

const point=p=>p&&Object.keys(p).length===2&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const abilities=['strike','slam','magma_vents'];
export async function createBrimstoneColossus({campaignSeed,siteId,floorId,groupId,roomId,entityId,homePosition,activatedTick,spaceInstanceId,sourceResidencyRevision},{sha256}){
 const digest=bytesToHex((await hashBytes(frameUtf8(['brimstone-colossus-v1',campaignSeed,siteId,floorId,groupId,entityId]),sha256)).slice(0,16));
 return freezeWire({boss:{version:'brimstone-colossus-v1',bossId:'boss:'+digest,bossDefinitionId:BRIMSTONE_ID,entityId,siteId,floorId,groupId,roomId,homePosition:copyWire(homePosition),activatedTick,spaceInstanceId,sourceResidencyRevision,
 phase:1,phase2Triggered:false,actionState:'idle',activeAbility:null,targetEntityId:null,targetPosition:null,telegraphStartedTick:null,resolvesTick:null,nextActionTick:activatedTick+60,abilitySequence:0,selectionSeed:parseInt(digest.slice(0,8),16)>>>0,facingAngle:Math.PI/2,summonEntityIds:[],ventTargets:[],ventsById:{},lastAction:null},summons:[]});
}
export function validateBrimstoneColossus(state,key,b){
 closedRecord(b,['version','bossId','bossDefinitionId','entityId','siteId','floorId','groupId','roomId','homePosition','activatedTick','spaceInstanceId','sourceResidencyRevision','phase','phase2Triggered','actionState','activeAbility','targetEntityId','targetPosition','telegraphStartedTick','resolvesTick','nextActionTick','abilitySequence','selectionSeed','facingAngle','summonEntityIds','ventTargets','ventsById','lastAction']);
 const a=state.entitiesById[key],g=state.groupsById[b.groupId],c=state.spacesByInstanceId[b.spaceInstanceId]?.collision;
 check(b.version==='brimstone-colossus-v1'&&b.bossDefinitionId===BRIMSTONE_ID&&/^boss:[a-f0-9]{32}$/.test(b.bossId)&&key===b.entityId&&a?.team==='hostile'&&a.contentDefinitionId===BRIMSTONE_PROFILE.contentDefinitionId&&g?.entityIds.includes(key)&&g.siteId===b.siteId&&a.residency.spaceInstanceId===b.spaceInstanceId&&a.residency.residencyRevision===b.sourceResidencyRevision&&c&&point(b.homePosition)&&!collidesWithTiles(c,b.homePosition.x,b.homePosition.y,34),'Invalid Brimstone identity');
 check(b.phase===1&&b.phase2Triggered===false&&Number.isFinite(b.facingAngle)&&Math.abs(b.facingAngle)<=Math.PI&&Array.isArray(b.summonEntityIds)&&b.summonEntityIds.length===0&&['idle','telegraphing','defeated'].includes(b.actionState),'Invalid Brimstone action');
 safeInteger(b.activatedTick,0,state.tick);safeInteger(b.nextActionTick,0,state.tick+120);safeInteger(b.abilitySequence,0);safeInteger(b.selectionSeed,0,0xffffffff);
 if(b.actionState==='telegraphing'){
  check(a.alive&&abilities.includes(b.activeAbility)&&point(b.targetPosition)&&state.entitiesById[b.targetEntityId]?.team==='party','Invalid Brimstone telegraph');
  safeInteger(b.telegraphStartedTick,b.activatedTick,state.tick);safeInteger(b.resolvesTick,b.telegraphStartedTick+C[b.activeAbility].telegraphTicks,b.telegraphStartedTick+C[b.activeAbility].telegraphTicks);check(state.tick<b.resolvesTick,'Expired Brimstone warning');
 }else check(b.activeAbility===null&&b.targetEntityId===null&&b.targetPosition===null&&b.telegraphStartedTick===null&&b.resolvesTick===null,'Stale Brimstone telegraph');
 check(Array.isArray(b.ventTargets)&&b.ventTargets.length===(b.activeAbility==='magma_vents'?2:0)&&b.ventTargets.every(p=>point(p)&&!collidesWithTiles(c,p.x,p.y,12)),'Invalid Brimstone vent targets');
 check(Object.keys(b.ventsById).length<=C.magma_vents.maxActive,'Brimstone vent budget exceeded');
 for(const[id,v]of Object.entries(b.ventsById)){
  closedRecord(v,['id','position','createdTick','detonatesTick','expiresTick','sequence','ordinal','arms','stage','hitEntityIds']);
  check(id===v.id&&id===b.bossId+':vent:'+v.sequence+':'+v.ordinal&&point(v.position)&&!collidesWithTiles(c,v.position.x,v.position.y,12)&&['boiling','erupting'].includes(v.stage),'Invalid Brimstone vent');
  safeInteger(v.sequence,1,b.abilitySequence);safeInteger(v.ordinal,0,1);safeInteger(v.createdTick,b.activatedTick,state.tick);safeInteger(v.detonatesTick,v.createdTick+270,v.createdTick+270);safeInteger(v.expiresTick,v.detonatesTick+18,v.detonatesTick+18);
  closedRecord(v.arms,['east','west','north','south']);const expected=brimstoneVentArms(c,v.position);for(const k of Object.keys(expected))check(v.arms[k]===expected[k],'Brimstone vent geometry drift');
  check(state.tick<v.expiresTick&&(v.stage==='boiling')===(state.tick<v.detonatesTick)&&Array.isArray(v.hitEntityIds)&&new Set(v.hitEntityIds).size===v.hitEntityIds.length&&v.hitEntityIds.every(id=>state.entitiesById[id]?.team==='party')&&(v.stage!=='boiling'||!v.hitEntityIds.length),'Invalid Brimstone vent schedule');
 }
 if(!a.alive)check(b.actionState==='defeated'&&!Object.keys(b.ventsById).length,'Active defeated Brimstone');
 if(b.actionState==='defeated')check(!a.alive,'Living defeated Brimstone');
 if(b.lastAction!==null){closedRecord(b.lastAction,['ability','resolvedTick','targetPosition','hitEntityIds']);check(abilities.includes(b.lastAction.ability)&&point(b.lastAction.targetPosition)&&Array.isArray(b.lastAction.hitEntityIds)&&new Set(b.lastAction.hitEntityIds).size===b.lastAction.hitEntityIds.length&&b.lastAction.hitEntityIds.every(id=>state.entitiesById[id]?.team==='party'),'Invalid Brimstone action history');safeInteger(b.lastAction.resolvedTick,b.activatedTick,state.tick);}
 return b;
}
export function validateBrimstoneFortBinding(state,site,floor,index,a,b){
 check(brimstoneFortFloor(site,floor.index)&&index===0&&b.entityId===a.entityId&&b.siteId===site.siteId&&b.floorId===floor.floorId&&b.groupId===floor.groupId&&b.roomId===floor.encounter.members[0].roomId&&a.residency.spaceInstanceId===floor.spaceInstanceId&&a.contentDefinitionId===BRIMSTONE_PROFILE.contentDefinitionId&&a.hullRadius===34&&!state.eliteCombat?.elitesByEntityId?.[a.entityId]&&!collidesWithTiles(floor.collision,b.homePosition.x,b.homePosition.y,34),'Invalid Fort Brimstone binding');
}
export function projectBrimstoneColossus(b){
 return freezeWire({bossId:b.bossId,bossDefinitionId:b.bossDefinitionId,label:C.label,phase:1,actionState:b.actionState,facingAngle:b.facingAngle,lastAction:copyWire(b.lastAction),pendingAction:b.actionState==='telegraphing'?{ability:b.activeAbility,targetEntityId:b.targetEntityId,targetPosition:copyWire(b.targetPosition),ventTargets:copyWire(b.ventTargets),startedTick:b.telegraphStartedTick,resolvesTick:b.resolvesTick}:null});
}
export function projectBrimstoneHazards(state,spaceInstanceId){
 const rows=Object.values(state.bossCombat?.bossesByEntityId??{}).filter(b=>b.bossDefinitionId===BRIMSTONE_ID&&b.spaceInstanceId===spaceInstanceId&&state.entitiesById[b.entityId]?.alive).sort((a,z)=>a.bossId.localeCompare(z.bossId));
 if(!rows.length)return {};
 return {brimstoneTelegraphs:rows.filter(b=>b.actionState==='telegraphing').map(b=>({bossId:b.bossId,ability:b.activeAbility,position:copyWire(b.activeAbility==='strike'?state.entitiesById[b.entityId].position:b.targetPosition),angle:b.facingAngle,ventTargets:copyWire(b.ventTargets),startedTick:b.telegraphStartedTick,resolvesTick:b.resolvesTick})),brimstoneVents:rows.flatMap(b=>Object.values(b.ventsById).sort((a,z)=>a.id.localeCompare(z.id)).map(copyWire)),brimstoneImpacts:rows.filter(b=>b.lastAction?.ability==='slam'&&state.tick-b.lastAction.resolvedTick<18).map(b=>copyWire(b.lastAction))};
}
