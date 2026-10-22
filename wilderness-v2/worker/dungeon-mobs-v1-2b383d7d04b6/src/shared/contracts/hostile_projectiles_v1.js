import {hasWorldCombat} from '../content/world_combat_v1.js';
import {ordinaryEnemyForProfile} from '../content/ordinary_enemies.js';
import {closedRecord,requireContract as check,safeInteger,canonicalStringify} from './wire.js';
import {validateId} from './identities.js';
import {validateInteger,integerBigInt} from './integer_domain.js';
import {positiveProgression} from './progression_integer.js';
import {collidesWithTiles} from '../rules/world_geometry.js';

export const HOSTILE_PROJECTILES_VERSION='hostile-projectiles-v1';
export const HOSTILE_PROJECTILE_STYLES=Object.freeze(['thorn','frost','fireball','maelstrom','void']);
export const HOSTILE_PROJECTILE_LIMITS=Object.freeze({global:128,perSource:4,lifeTicks:80,travelRange:336,radius:6,speed:4.2});
const same=(a,b)=>a===b||a!==undefined&&b!==undefined&&canonicalStringify(a)===canonicalStringify(b);
const ranged=a=>ordinaryEnemyForProfile(a?.contentDefinitionId)?.ranged;
const vector=(v,unit=false)=>{closedRecord(v,['x','y']);check(Number.isFinite(v.x)&&Number.isFinite(v.y),'Hostile projectile vector');if(unit)check(Math.abs(Math.hypot(v.x,v.y)-1)<1e-9,'Hostile projectile direction');};
export const idleHostileRangedAction=tick=>({phase:'idle',phaseStartedTick:tick,phaseEndsTick:tick,targetEntityId:null,aim:null,actionSequence:0});

export function installHostileProjectiles(state){
 if(!hasWorldCombat(state))return;
 state.hostileCombat??={version:HOSTILE_PROJECTILES_VERSION,actionsByEntityId:{},projectiles:{}};
 for(const a of Object.values(state.entitiesById))if(a.alive&&ranged(a)){
  if(a.ai?.melee?.phase==='idle')delete a.ai.melee;
 }
}

export function cancelHostileProjectiles(state,entityId){
 const root=state.hostileCombat;if(!root)return;
 for(const [id,shot] of Object.entries(root.projectiles))if(shot.sourceId===entityId||shot.intendedTargetId===entityId)delete root.projectiles[id];
 for(const [id,action] of Object.entries(root.actionsByEntityId))if(id===entityId||action.targetEntityId===entityId){
  root.actionsByEntityId[id]={...idleHostileRangedAction(state.tick),actionSequence:action.actionSequence};
 }
}

export function validateHostileProjectiles(state){
 const root=state.hostileCombat;if(!root)return;
 check(hasWorldCombat(state),'Hostile projectiles outside World combat');
 closedRecord(root,['version','actionsByEntityId','projectiles'],['catalogUpgrade']);
 check(root.version===HOSTILE_PROJECTILES_VERSION,'Hostile projectile version');
 closedRecord(root.actionsByEntityId,[],Object.keys(root.actionsByEntityId));
 closedRecord(root.projectiles,[],Object.keys(root.projectiles));
 check(Object.keys(root.actionsByEntityId).length<=Object.keys(state.entitiesById).length,'Hostile ranged action bound');
 const parties=new Set(Object.values(state.playersById).map(p=>p.entityId));
 for(const [id,a] of Object.entries(root.actionsByEntityId)){
  const source=state.entitiesById[id],profile=ranged(source);
  check(source?.team==='hostile'&&profile,'Hostile ranged action owner');
  closedRecord(a,['phase','phaseStartedTick','phaseEndsTick','targetEntityId','aim','actionSequence']);
  check(['idle','windup','recovery'].includes(a.phase),'Hostile ranged phase');
  safeInteger(a.phaseStartedTick,0,state.tick);safeInteger(a.phaseEndsTick,a.phaseStartedTick,state.tick+300);safeInteger(a.actionSequence);
  check(a.phaseEndsTick-a.phaseStartedTick===(a.phase==='windup'?profile.windupTicks:a.phase==='recovery'?profile.recoveryTicks:0),'Hostile ranged phase timing');
  check(a.phase==='windup'?a.actionSequence===source.nextAttackActionSequence:a.phase==='idle'?a.actionSequence<=source.nextAttackActionSequence:a.actionSequence<source.nextAttackActionSequence,'Hostile ranged action chronology');
  check((a.phase==='idle')===(a.targetEntityId===null&&a.aim===null),'Hostile ranged idle action');
  if(a.phase!=='idle'){check(parties.has(a.targetEntityId)&&a.aim!==null,'Hostile ranged action target');vector(a.aim,true);}
 }
 check(Object.keys(root.projectiles).length<=HOSTILE_PROJECTILE_LIMITS.global,'Hostile projectile global bound');
 const counts=new Map(),groupByActor=new Map(Object.values(state.groupsById).flatMap(g=>g.entityIds.map(id=>[id,g])));
 for(const [id,b] of Object.entries(root.projectiles)){
  closedRecord(b,['id','sourceId','sourceResidencyRevision','spaceInstanceId','intendedTargetId','position','direction','remaining','remainingTicks','firedTick','radius','type','attack','sourceLevel','actionSequence']);
  validateId('attackActionId',id);check(b.id===id,'Hostile projectile identity');
  const source=state.entitiesById[b.sourceId],profile=ranged(source),g=groupByActor.get(b.sourceId);
  check(source?.alive&&source.team==='hostile'&&profile&&root.actionsByEntityId[b.sourceId],'Hostile projectile source');
  check(source.residency.spaceInstanceId===b.spaceInstanceId&&source.residency.residencyRevision===b.sourceResidencyRevision,'Hostile projectile source residency');
  check(parties.has(b.intendedTargetId),'Hostile projectile intended target');
  check(state.entitiesById[b.intendedTargetId].residency.spaceInstanceId===b.spaceInstanceId,'Hostile projectile target residency');
  check(profile.projectileType===b.type&&HOSTILE_PROJECTILE_STYLES.includes(b.type)&&b.radius===profile.radius,'Hostile projectile style/radius');
  safeInteger(b.sourceResidencyRevision,1);safeInteger(b.actionSequence,1);check(b.actionSequence<source.nextAttackActionSequence,'Hostile projectile source action chronology');safeInteger(b.firedTick,0,state.tick);safeInteger(b.remainingTicks,1,profile.lifeTicks);
  check(b.remainingTicks<=profile.lifeTicks-(state.tick-b.firedTick),'Hostile projectile lifetime chronology');
  check(Number.isFinite(b.remaining)&&b.remaining>0&&b.remaining<=profile.travelRange,'Hostile projectile range');
  vector(b.position);vector(b.direction,true);check(Math.abs(b.position.x)<=1000000&&Math.abs(b.position.y)<=1000000&&!collidesWithTiles(state.spacesByInstanceId[b.spaceInstanceId].collision,b.position.x,b.position.y,b.radius),'Hostile projectile saved geometry');validateInteger(b.attack);check(integerBigInt(b.attack)>0n,'Hostile projectile attack');
  positiveProgression(b.sourceLevel);check(same(g?.threatSnapshot?.levelsByEntityId[b.sourceId],b.sourceLevel),'Hostile projectile locked level');
  check(same(source.attackDamage,b.attack),'Hostile projectile captured attack');
  counts.set(b.sourceId,(counts.get(b.sourceId)??0)+1);check(counts.get(b.sourceId)<=HOSTILE_PROJECTILE_LIMITS.perSource,'Hostile projectile source bound');
 }
}
