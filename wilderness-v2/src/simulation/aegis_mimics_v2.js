import {combatInteger,compareCombat,multiplyCombat} from '../shared/contracts/combat_amount.js';
import {copyWire} from '../shared/contracts/wire.js';
import {collidesWithTiles} from '../shared/rules/world_geometry.js';
import {AEGIS_MIMICS,aegisMimicFor,aegisMimicOrbitPosition,livingFusedMimics,aegisTowerHealth,aegisTowerHalfAngle} from '../shared/content/aegis_mimics_v2.js';

const angle=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x),delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const zero={x:0,y:0};
const incomingAngle=(source,target,packet)=>packet?.projectileDirection?Math.atan2(-packet.projectileDirection.y,-packet.projectileDirection.x):source?angle(target.position,source.position):null;
function stop(a,tick){a.movementIntent={...zero};a.movedLastTick=false;if(a.ai?.melee)Object.assign(a.ai.melee,{phase:'idle',phaseStartedTick:tick,phaseEndsTick:tick,targetEntityId:null});}

export function createAegisMimicSimulation(state){
 const stats={detached:0,recalls:0,fusions:0,enrages:0};
 function rows(b){return Object.values(b.mimicEncounter?.mimicsByEntityId??{}).sort((x,y)=>x.ordinal-y.ordinal);}
 function cleanupHaste(ids){const root=state.eliteCombat;if(!root)return;const elites=new Set(ids.map(id=>root.elitesByEntityId?.[id]?.eliteId));for(const[id,h]of Object.entries(root.hasteByEntityId??{})){if(ids.includes(id)||!state.entitiesById[id]?.alive){delete root.hasteByEntityId[id];continue;}h.sourceEliteIds=h.sourceEliteIds.filter(id=>!elites.has(id));}}
 function retire(b){
  const ids=[];for(const m of rows(b)){const a=state.entitiesById[m.entityId];if(a?.alive){a.hp=combatInteger(0);a.alive=false;a.ai.defeatedTick=state.tick;stop(a,state.tick);}if(m.stage!=='defeated'){m.stage='defeated';m.stageStartedTick=state.tick;m.defeatedTick=state.tick;}ids.push(m.entityId);}cleanupHaste(ids);
 }
 function beginRecall(b,a){
  const e=b.mimicEncounter;b.phase=2;b.phase2Triggered=true;b.actionState='recalling';b.activeAbility=null;b.targetEntityId=null;b.targetPosition=null;b.telegraphStartedTick=null;b.resolvesTick=null;b.dazedUntilTick=null;b.shieldActive=false;b.projectilesById={};b.knockbacksByEntityId={};e.recallStartedTick=state.tick;e.recallEndsTick=state.tick+AEGIS_MIMICS.recallTicks;b.nextActionTick=e.recallEndsTick+30;
  stop(a,state.tick);for(const m of rows(b)){const actor=state.entitiesById[m.entityId];if(!actor.alive)continue;m.stage='recalling';m.stageStartedTick=state.tick;stop(actor,state.tick);}cleanupHaste(rows(b).map(m=>m.entityId));stats.recalls++;
 }
 function enrage(b){const e=b.mimicEncounter;if(e.enragedTick===null){e.enragedTick=state.tick;stats.enrages++;}b.shieldActive=false;if(b.activeAbility==='shield_bash'){b.actionState='idle';b.activeAbility=null;b.targetEntityId=null;b.targetPosition=null;b.telegraphStartedTick=null;b.resolvesTick=null;b.nextActionTick=state.tick+30;}}
 function synchronize(b,a){
  const e=b.mimicEncounter;if(!e)return;
  for(const m of rows(b)){
   const actor=state.entitiesById[m.entityId];
   if(!actor.alive){if(m.stage!=='defeated'){m.stage='defeated';m.stageStartedTick=state.tick;m.defeatedTick=state.tick;cleanupHaste([m.entityId]);}continue;}
   if(m.stage==='orbiting'&&compareCombat(actor.hp,multiplyCombat(actor.maxHp,1,2))<=0){m.stage='landing';m.stageStartedTick=state.tick;m.detachedTick=state.tick;stop(actor,state.tick);stats.detached++;}
   if(m.stage==='landing'&&state.tick>=m.detachedTick+30){m.stage='detached';m.stageStartedTick=state.tick;stop(actor,state.tick);}
  }
  if(b.phase===1&&compareCombat(a.hp,multiplyCombat(a.maxHp,1,2))<0)beginRecall(b,a);
  if(e.recallResolvedTick!==null&&livingFusedMimics(state,b).length===0){if(b.shieldBrokenTick===null)b.shieldBrokenTick=state.tick;enrage(b);}
  b.shieldActive=a.alive&&livingFusedMimics(state,b).length>0&&b.actionState!=='dazed';
 }
 function updateOrbit(b,a,m){
  const actor=state.entitiesById[m.entityId],c=state.spacesByInstanceId[b.spaceInstanceId].collision,desired=aegisMimicOrbitPosition(a.position,state.tick,m.ordinal);
  let p=desired;
  if(collidesWithTiles(c,p.x,p.y,actor.hullRadius)){
   const dx=desired.x-a.position.x,dy=desired.y-a.position.y;let found=false;
   for(let r=58;r>=38;r-=4){const q={x:a.position.x+dx*r/62,y:a.position.y+dy*r/62};if(!collidesWithTiles(c,q.x,q.y,actor.hullRadius)){p=q;found=true;break;}}
   if(!found)p={...a.position};
  }
  actor.position=p;stop(actor,state.tick);
 }
 function advance(b,a){
  const e=b.mimicEncounter;if(!e)return false;
  for(const m of rows(b)){if(m.stage==='orbiting')updateOrbit(b,a,m);else if(m.stage==='fused'){const actor=state.entitiesById[m.entityId];actor.position={...a.position};stop(actor,state.tick);}}
  if(b.actionState!=='recalling')return false;
  stop(a,state.tick);if(state.tick<e.recallEndsTick)return true;
  for(const m of rows(b)){const actor=state.entitiesById[m.entityId];if(!actor.alive)continue;m.stage='fused';m.stageStartedTick=state.tick;actor.position={...a.position};stop(actor,state.tick);}
  e.recallResolvedTick=e.recallEndsTick;e.towerMaxHp=String(rows(b).reduce((sum,m)=>sum+BigInt(m.maxHp),0n));b.actionState='idle';b.nextActionTick=state.tick+30;b.shieldActive=livingFusedMimics(state,b).length>0;
  if(b.shieldActive){b.shieldStartedTick=state.tick;stats.fusions++;}else enrage(b);
  return true;
 }
 function towerTarget(source,target,packet){
  const b=state.bossCombat?.bossesByEntityId?.[target.entityId];if(!b?.mimicEncounter||source?.team!=='party'||b.actionState==='dazed')return null;
  const fused=livingFusedMimics(state,b),a=incomingAngle(source,target,packet);if(!fused.length||a===null||Math.abs(delta(a,b.shieldAngle))>=aegisTowerHalfAngle(fused.length))return null;
  return state.entitiesById[fused[0].entityId];
 }
 function mitigateIncoming(target,damage,source,packet){
  const b=state.bossCombat?.bossesByEntityId?.[target.entityId];if(!b?.mimicEncounter)return null;
  const a=incomingAngle(source,target,packet);
  if(b.phase===1&&a!==null)for(const m of rows(b))if(m.stage==='orbiting'){
   const shield=state.entitiesById[m.entityId];if(!shield?.alive)continue;const d=Math.hypot(shield.position.x-target.position.x,shield.position.y-target.position.y),half=Math.asin(Math.min(1,shield.combatRadius/Math.max(1,d)));
   if(Math.abs(delta(a,angle(target.position,shield.position)))<=half)return {damage:combatInteger(0),shielded:true};
  }
  return {damage,shielded:false};
 }
 return Object.freeze({synchronize,advance,retire,towerTarget,mitigateIncoming,
  ownsMimic:id=>Boolean(aegisMimicFor(state,id)),frozen:id=>{const row=aegisMimicFor(state,id);return row?row.mimic.stage!=='detached':false;},
  inspect:()=>({...stats})});
}
