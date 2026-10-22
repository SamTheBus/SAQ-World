import {canonicalStringify,closedRecord,requireContract as check,safeInteger} from './wire.js';
import {compareCombat} from './combat_amount.js';
import {integerBigInt,validateInteger} from './integer_domain.js';
import {AEGIS_MIMICS_VERSION,aegisHealthBudget,livingFusedMimics} from '../content/aegis_mimics_v2.js';
import {ORDINARY_ENEMIES,resolveOrdinaryProfile} from '../content/ordinary_enemies.js';
import {worldBossStats} from '../content/world_combat_v1.js';
import {collidesWithTiles} from '../rules/world_geometry.js';

const profile=resolveOrdinaryProfile(ORDINARY_ENEMIES.find(e=>e.family==='mimic_shield'),'C');
export const aegisMimicProfile=()=>profile;
export function validateAegisMimicEncounter(state,boss){
 const e=boss.mimicEncounter;if(!e)return;
 closedRecord(e,['version','totalMaxHp','recallStartedTick','recallEndsTick','recallResolvedTick','towerMaxHp','enragedTick','mimicsByEntityId']);check(e.version===AEGIS_MIMICS_VERSION,'Invalid Mimic encounter version');validateInteger(e.totalMaxHp);validateInteger(e.towerMaxHp);
 const budget=aegisHealthBudget(e.totalMaxHp),a=state.entitiesById[boss.entityId],g=state.groupsById[boss.groupId],rows=Object.values(e.mimicsByEntityId).sort((x,y)=>x.ordinal-y.ordinal);
 check(rows.length===3&&rows.every((m,i)=>m.ordinal===i)&&new Set(rows.map(m=>m.entityId)).size===3&&canonicalStringify(boss.summonEntityIds)===canonicalStringify(rows.map(m=>m.entityId)),'Invalid fixed Mimic roster');
 check(a.maxHp===budget.body,'Aegis body health budget drift');
 const level=state.d9World?.episodes?.[boss.groupId]?.snapshot?.effectiveLevel;if(level!==undefined)check(worldBossStats(level).maxHp===e.totalMaxHp,'Aegis total health budget drift');
 for(const m of rows){
  closedRecord(m,['entityId','ordinal','roomId','homePosition','maxHp','stage','stageStartedTick','detachedTick','defeatedTick']);const actor=state.entitiesById[m.entityId],elite=state.eliteCombat?.elitesByEntityId?.[m.entityId];
  check(e.mimicsByEntityId[m.entityId]===m&&g.entityIds.includes(m.entityId)&&actor?.contentDefinitionId===profile.contentDefinitionId&&actor.team==='hostile'&&actor.residency.spaceInstanceId===boss.spaceInstanceId&&actor.maxHp===budget.mimics[m.ordinal]&&m.maxHp===actor.maxHp&&elite?.affixIds[0]==='swift_commander'&&elite.groupId===boss.groupId&&elite.roomId===m.roomId,'Mimic actor/elite binding drift');
  check(['orbiting','landing','detached','recalling','fused','defeated'].includes(m.stage)&&actor.alive===(m.stage!=='defeated')&&compareCombat(actor.hp,actor.maxHp)<=0,'Invalid Mimic life stage');safeInteger(m.stageStartedTick,boss.activatedTick,state.tick);
  check(Number.isFinite(m.homePosition?.x)&&Number.isFinite(m.homePosition?.y)&&!collidesWithTiles(state.spacesByInstanceId[boss.spaceInstanceId].collision,m.homePosition.x,m.homePosition.y,actor.hullRadius),'Invalid Mimic home');
  if(m.detachedTick!==null)safeInteger(m.detachedTick,boss.activatedTick,state.tick);if(['landing','detached'].includes(m.stage))check(m.detachedTick!==null,'Missing Mimic detach history');
  if(m.stage==='defeated')safeInteger(m.defeatedTick,boss.activatedTick,state.tick);else check(m.defeatedTick===null,'Living defeated Mimic');
  if(m.stage==='fused')check(boss.phase===2&&e.recallResolvedTick!==null,'Premature Mimic fusion');
  if(m.stage==='recalling')check(boss.actionState==='recalling'&&e.recallStartedTick!==null,'Mimic recall state drift');
 }
 if(e.recallStartedTick===null)check(e.recallEndsTick===null&&e.recallResolvedTick===null&&boss.phase===1&&e.enragedTick===null,'Premature recall state');
 else{safeInteger(e.recallStartedTick,boss.activatedTick,state.tick);check(e.recallEndsTick===e.recallStartedTick+120&&boss.phase===2,'Recall timing drift');if(e.recallResolvedTick===null)check(!a.alive||state.tick<e.recallEndsTick&&boss.actionState==='recalling','Stale pending recall');else{check(e.recallResolvedTick===e.recallEndsTick,'Recall resolution drift');safeInteger(e.recallResolvedTick,0,state.tick);}}
 const fused=livingFusedMimics(state,boss);check(integerBigInt(e.towerMaxHp)>=fused.reduce((s,m)=>s+integerBigInt(state.entitiesById[m.entityId].hp),0n),'Tower health exceeds recalled health');
 if(e.enragedTick!==null){safeInteger(e.enragedTick,boss.activatedTick,state.tick);check(e.recallResolvedTick!==null&&fused.length===0,'Enraged armored Aegis');}
 check(boss.shieldActive===(a.alive&&fused.length>0&&boss.actionState!=='dazed'),'Mimic tower guard drift');
}
export function validateAegisFortMimic(state,site,floor,index,actor,boss,m){
 const ids=Object.values(boss.mimicEncounter.mimicsByEntityId).map(m=>m.entityId);check(ids.includes(actor.entityId)&&floor.enemyIds[index]===actor.entityId&&boss.floorId===floor.floorId&&boss.siteId===site.siteId&&m.roomId===floor.encounter.members[index].roomId&&actor.contentDefinitionId===profile.contentDefinitionId,'Invalid Fort Mimic binding');
}
