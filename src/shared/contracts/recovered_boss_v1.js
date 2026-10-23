import {bytesToHex,frameUtf8,hashBytes} from './hashing.js';
import {closedRecord,copyWire,freezeWire,requireContract as check,safeInteger} from './wire.js';
import {ARACHNID_TREANT_PROFILE} from '../content/bosses_d12_5.js';
import {RECOVERED_BOSS_VERSION,recoveredBossForId,recoveredBossForReservation} from '../content/recovered_boss_catalog_v1.js';
import {collidesWithTiles} from '../rules/world_geometry.js';
import {archivedCombatProfile,ARCHIVED_FIGHT_PROFILE_VERSION} from '../content/archived_boss_fight_profiles_v1.js';

export const RECOVERED_SUMMON_VERSION='recovered-boss-summon-v1';
const point=p=>Boolean(p&&Number.isFinite(p.x)&&Number.isFinite(p.y));
const states=['idle','telegraphing','dazed','defeated'];
export const recoveredBossRecord=b=>b?.version===RECOVERED_BOSS_VERSION&&Boolean(recoveredBossForId(b.bossDefinitionId));

export async function createRecoveredBossV1({kind,campaignSeed,siteId,floorId,groupId,roomId,entityId,homePosition,activatedTick,spaceInstanceId,sourceResidencyRevision,addMembers=[]},{sha256}) {
 const spec=recoveredBossForId(kind);
 check(spec&&point(homePosition),'Invalid recovered boss creation');
 const digest=bytesToHex((await hashBytes(frameUtf8([RECOVERED_BOSS_VERSION,kind,campaignSeed,siteId,floorId,groupId,entityId]),sha256)).slice(0,16));
 const bossId='boss:'+digest;
 const summons=addMembers.slice(0,spec.adds).map((member,i)=>({
  version:RECOVERED_SUMMON_VERSION,entityId:member.entityId,bossId,groupId,ordinal:i,homePosition:copyWire(member.position),
  kind:kind==='nexus_overseer'?'hologram':kind==='cinderhart'?'bunny':'slime',
  stage:'dormant',activatedTick:null,hatchTick:null,defeatedTick:null
 }));
 const boss={
  version:RECOVERED_BOSS_VERSION,bossId,bossDefinitionId:kind,entityId,siteId,floorId,groupId,roomId,
  homePosition:copyWire(homePosition),activatedTick,spaceInstanceId,sourceResidencyRevision,
  phase:1,phase2Triggered:false,actionState:'idle',activeAbility:null,targetEntityId:null,targetPosition:null,
  telegraphStartedTick:null,resolvesTick:null,nextActionTick:activatedTick+60,abilitySequence:0,
  selectionSeed:parseInt(digest.slice(0,8),16)>>>0,
  shieldHp:'0',shieldMaxHp:'0',dazedUntilTick:null,shieldBrokenTick:null,
  summonEntityIds:summons.map(s=>s.entityId),chunkStep:0,collapseStep:0,stolenGold:'0',coinShots:[],
  pools:[],statusesByEntityId:{},lastTrailPosition:copyWire(homePosition),lastAction:null,
  ...(archivedCombatProfile(kind)?{archive:{version:ARCHIVED_FIGHT_PROFILE_VERSION,charge:null,sporesById:{},poisonByEntityId:{},contactByEntityId:{},nextWarrenTick:activatedTick+60,sludgeSequence:0}}:{})
 };
 return freezeWire({boss,summons});
}

export function validateRecoveredBossV1(state,id,b){
 closedRecord(b,['version','bossId','bossDefinitionId','entityId','siteId','floorId','groupId','roomId','homePosition','activatedTick',
  'spaceInstanceId','sourceResidencyRevision','phase','phase2Triggered','actionState','activeAbility','targetEntityId','targetPosition',
  'telegraphStartedTick','resolvesTick','nextActionTick','abilitySequence','selectionSeed','shieldHp','shieldMaxHp','dazedUntilTick',
  'shieldBrokenTick','summonEntityIds','chunkStep','collapseStep','stolenGold','pools','statusesByEntityId','lastTrailPosition','lastAction'],['coinShots','archive']);
 const spec=recoveredBossForId(b.bossDefinitionId),actor=state.entitiesById[id],group=state.groupsById[b.groupId],c=state.spacesByInstanceId[b.spaceInstanceId]?.collision;
 check(spec&&b.version===RECOVERED_BOSS_VERSION&&b.entityId===id&&/^boss:[a-f0-9]{32}$/.test(b.bossId)&&actor?.team==='hostile'&&
  actor.contentDefinitionId===ARACHNID_TREANT_PROFILE.contentDefinitionId&&group?.entityIds.includes(id)&&group.siteId===b.siteId&&
  actor.residency.spaceInstanceId===b.spaceInstanceId&&actor.residency.residencyRevision===b.sourceResidencyRevision&&
  c&&point(b.homePosition)&&!collidesWithTiles(c,b.homePosition.x,b.homePosition.y,ARACHNID_TREANT_PROFILE.hullRadius),'Recovered boss identity invalid');
 check([1,2].includes(b.phase)&&b.phase2Triggered===(b.phase===2)&&states.includes(b.actionState),'Recovered boss phase invalid');
 safeInteger(b.activatedTick,0,state.tick);safeInteger(b.nextActionTick,0,state.tick+600);safeInteger(b.abilitySequence,0);safeInteger(b.selectionSeed,0,0xffffffff);
 safeInteger(b.chunkStep,0,16);safeInteger(b.collapseStep,0,7);
 check(/^\d+$/.test(b.shieldHp)&&/^\d+$/.test(b.shieldMaxHp)&&BigInt(b.shieldHp)<=BigInt(b.shieldMaxHp)&&/^\d+$/.test(b.stolenGold),'Recovered boss resources invalid');
 check(Array.isArray(b.summonEntityIds)&&b.summonEntityIds.length<=spec.adds&&new Set(b.summonEntityIds).size===b.summonEntityIds.length&&b.summonEntityIds.every(k=>state.bossCombat.summonsByEntityId[k]?.bossId===b.bossId),'Recovered boss adds invalid');
 if(b.actionState==='telegraphing'){
  check(Object.hasOwn(spec.attacks,b.activeAbility)&&point(b.targetPosition)&&state.entitiesById[b.targetEntityId]?.team==='party','Recovered boss telegraph invalid');
  safeInteger(b.telegraphStartedTick,b.activatedTick,state.tick);
  safeInteger(b.resolvesTick,b.telegraphStartedTick+spec.attacks[b.activeAbility],b.telegraphStartedTick+spec.attacks[b.activeAbility]);
 }else check(b.activeAbility===null&&b.targetEntityId===null&&b.targetPosition===null&&b.telegraphStartedTick===null&&b.resolvesTick===null,'Recovered boss stale telegraph');
 if(b.actionState==='dazed')safeInteger(b.dazedUntilTick,state.tick+1,state.tick+300);
 else check(b.dazedUntilTick===null,'Recovered boss stale daze');
 if(b.shieldBrokenTick!==null)safeInteger(b.shieldBrokenTick,b.activatedTick,state.tick);
 if(!actor.alive)check(b.actionState==='defeated','Recovered boss not retired'); else check(b.actionState!=='defeated','Recovered boss defeated while alive');
 check(Array.isArray(b.coinShots??[])&&b.coinShots.length<=16&&(!b.coinShots.length||b.bossDefinitionId==='marcus'),'Coin volley budget invalid');
 for(const shot of b.coinShots??[]){
  closedRecord(shot,['id','position','velocity','firedTick','expiresTick','sequence','ordinal','bounces']);
  check(typeof shot.id==='string'&&shot.id===b.bossId+':coin:'+shot.sequence+':'+shot.ordinal&&point(shot.position)&&point(shot.velocity)&&Math.hypot(shot.velocity.x,shot.velocity.y)<13&&shot.bounces<=2,'Invalid flying Marcus coin');
  safeInteger(shot.firedTick,b.activatedTick,state.tick);safeInteger(shot.expiresTick,shot.firedTick+120,shot.firedTick+120);safeInteger(shot.sequence,1,b.abilitySequence);safeInteger(shot.ordinal,0,7);safeInteger(shot.bounces,0,2);check(state.tick<shot.expiresTick,'Expired coin shot');
 }
 if(b.archive!==undefined){
  const archive=b.archive;
  closedRecord(archive,['version','charge','sporesById','poisonByEntityId','contactByEntityId','nextWarrenTick','sludgeSequence']);
  check(Boolean(archivedCombatProfile(b.bossDefinitionId))&&archive.version===ARCHIVED_FIGHT_PROFILE_VERSION,'Archived boss profile mismatch');
  safeInteger(archive.nextWarrenTick,0,state.tick+1200);safeInteger(archive.sludgeSequence,0);
  check(archive.charge===null||b.bossDefinitionId==='cinderhart','Invalid archived rush owner');
  if(archive.charge){
   const r=archive.charge;closedRecord(r,['startedTick','endsTick','originPosition','endPosition','hitEntityIds','lastFirePosition']);
   safeInteger(r.startedTick,b.activatedTick,state.tick);check(r.endsTick===r.startedTick+24&&state.tick<=r.endsTick&&point(r.originPosition)&&point(r.endPosition)&&point(r.lastFirePosition),'Invalid original 24-tick rush');
   check(Array.isArray(r.hitEntityIds)&&new Set(r.hitEntityIds).size===r.hitEntityIds.length&&r.hitEntityIds.every(id=>state.entitiesById[id]?.team==='party'),'Invalid rush targets');
  }
  check(Object.keys(archive.sporesById).length<=9&&Object.keys(archive.poisonByEntityId).length<=4&&Object.keys(archive.contactByEntityId).length<=4,'Archived projectile/status budget exceeded');
  for(const [id,s] of Object.entries(archive.sporesById)){
   closedRecord(s,['id','position','previousPosition','createdTick','expiresTick','sequence','ordinal','targetEntityId']);
   check(id===s.id&&id.startsWith(b.bossId+':spore:')&&point(s.position)&&point(s.previousPosition)&&s.expiresTick===s.createdTick+360,'Invalid original drifting spore');
   safeInteger(s.createdTick,b.activatedTick,state.tick);safeInteger(s.sequence,1,b.abilitySequence);safeInteger(s.ordinal,0,2);check(state.tick<s.expiresTick,'Expired archived spore');
  }
  for(const [id,p] of Object.entries(archive.poisonByEntityId)){
   closedRecord(p,['stacks','lastAppliedTick','nextTick','expiresTick']);
   check(state.entitiesById[id]?.team==='party','Archived poison target mismatch');
   safeInteger(p.stacks,1,5);safeInteger(p.lastAppliedTick,b.activatedTick,state.tick);safeInteger(p.nextTick,0,state.tick+300);
   safeInteger(p.expiresTick,state.tick+1,state.tick+240);
  }
  for(const [id,last] of Object.entries(archive.contactByEntityId)){
   check(state.entitiesById[id]?.team==='party','Archived contact target mismatch');safeInteger(last,0,state.tick);
  }
 }
 check(Array.isArray(b.pools)&&b.pools.length<=(b.bossDefinitionId==='cinderhart'?64:20)&&point(b.lastTrailPosition),'Recovered boss hazard budget invalid');
 for(const p of b.pools){closedRecord(p,['id','kind','position','radius','createdTick','expiresTick','nextDamageTick']);check(typeof p.id==='string'&&p.id.startsWith(b.bossId+':pool:')&&['acid','slag','fire','void','time','collapse','molten','gold','prism'].includes(p.kind)&&point(p.position)&&Number.isFinite(p.radius)&&p.radius>=8&&p.radius<=300,'Recovered boss pool invalid');safeInteger(p.createdTick,b.activatedTick,state.tick);safeInteger(p.expiresTick,state.tick+1,p.createdTick+600);safeInteger(p.nextDamageTick,p.createdTick,p.expiresTick);}
 for(const [key,s] of Object.entries(b.statusesByEntityId)){closedRecord(s,['kind','startedTick','expiresTick','movementMultiplier']);check(state.entitiesById[key]?.team==='party'&&['time_slow','control_glitch','lasso'].includes(s.kind)&&s.movementMultiplier>0&&s.movementMultiplier<=1,'Recovered boss status invalid');safeInteger(s.startedTick,b.activatedTick,state.tick);safeInteger(s.expiresTick,state.tick+1,s.startedTick+600);}
 if(b.lastAction!==null){closedRecord(b.lastAction,['ability','resolvedTick','targetPosition','hitEntityIds']);check((Object.hasOwn(spec.attacks,b.lastAction.ability)||b.lastAction.ability==='strike')&&point(b.lastAction.targetPosition)&&Array.isArray(b.lastAction.hitEntityIds)&&b.lastAction.hitEntityIds.every(key=>state.entitiesById[key]?.team==='party'),'Recovered boss history invalid');safeInteger(b.lastAction.resolvedTick,b.activatedTick,state.tick);}
 return b;
}

export function validateRecoveredSummonV1(state,id,s,b){
 closedRecord(s,['version','entityId','bossId','groupId','ordinal','homePosition','kind','stage','activatedTick','hatchTick','defeatedTick']);
 const a=state.entitiesById[id],g=state.groupsById[s.groupId];
 check(s.version===RECOVERED_SUMMON_VERSION&&s.entityId===id&&b?.bossId===s.bossId&&b.summonEntityIds[s.ordinal]===id&&s.groupId===b.groupId&&
  a?.team==='hostile'&&g?.entityIds.includes(id)&&point(s.homePosition)&&['slime','slag','hologram','bunny'].includes(s.kind)&&['dormant','hatched','defeated'].includes(s.stage),'Recovered boss add invalid');
 if(s.stage==='dormant')check(a.alive&&s.activatedTick===null&&s.hatchTick===null&&s.defeatedTick===null,'Dormant recovered add invalid');
 else {safeInteger(s.activatedTick,b.activatedTick,state.tick);check(s.hatchTick===s.activatedTick,'Recovered boss add activation invalid');
  if(s.stage==='hatched')check(a.alive&&s.defeatedTick===null,'Defeated active add');else {check(!a.alive,'Living defeated add');safeInteger(s.defeatedTick,s.activatedTick,state.tick);}}
 return s;
}

export function validateRecoveredBossBindingV1(state,site,floor,index,actor,b) {
 const spec=recoveredBossForReservation(site.socket?.provenance?.reservationId,site.familyId.split(':')[1],floor.index,site.floorCount,true);
 const homes=state.groupsById[floor.groupId]?.containment?.memberHomesById;
 check(spec?.id===b.bossDefinitionId&&index===0&&b.siteId===site.siteId&&b.floorId===floor.floorId&&
  b.groupId===floor.groupId&&b.roomId===floor.encounter.members[0].roomId&&b.spaceInstanceId===floor.spaceInstanceId&&
  actor.contentDefinitionId===ARACHNID_TREANT_PROFILE.contentDefinitionId&&actor.hullRadius===ARACHNID_TREANT_PROFILE.hullRadius&&
  homes?.[actor.entityId]?.x===b.homePosition.x&&homes?.[actor.entityId]?.y===b.homePosition.y&&
  !state.eliteCombat?.elitesByEntityId?.[actor.entityId]&&!collidesWithTiles(floor.collision,b.homePosition.x,b.homePosition.y,34),'Recovered boss floor binding invalid');
 return b;
}

export function projectRecoveredBossV1(b,state){
 const spec=recoveredBossForId(b.bossDefinitionId);
 return freezeWire({bossId:b.bossId,bossDefinitionId:b.bossDefinitionId,label:spec.label,phase:b.phase,actionState:b.actionState,
  shieldActive:BigInt(b.shieldHp)>0n,shieldHp:b.shieldHp,shieldMaxHp:b.shieldMaxHp,shieldBrokenTick:b.shieldBrokenTick,
  dazedUntilTick:b.dazedUntilTick,collapseStep:b.collapseStep,chunkStep:b.chunkStep,stolenGold:b.stolenGold,
  coinShots:copyWire(b.coinShots??[]),minions:b.summonEntityIds.map(id=>{const m=state.bossCombat.summonsByEntityId[id];return {entityId:id,kind:m.kind,stage:m.stage,position:copyWire(state.entitiesById[id].position)};}),
  lastAction:copyWire(b.lastAction),pendingAction:b.actionState==='telegraphing'?
  {ability:b.activeAbility,targetEntityId:b.targetEntityId,targetPosition:copyWire(b.targetPosition),startedTick:b.telegraphStartedTick,resolvesTick:b.resolvesTick}:null});
}

export function projectRecoveredHazardsV1(state,spaceId){
 const bosses=Object.values(state.bossCombat?.bossesByEntityId??{}).filter(b=>recoveredBossRecord(b)&&b.spaceInstanceId===spaceId&&state.entitiesById[b.entityId]?.alive);
 return {recoveredTelegraphs:bosses.filter(b=>b.actionState==='telegraphing').map(b=>({bossId:b.bossId,bossDefinitionId:b.bossDefinitionId,ability:b.activeAbility,position:copyWire(b.targetPosition),originPosition:copyWire(state.entitiesById[b.entityId].position),sequence:b.abilitySequence,selectionSeed:b.selectionSeed,startedTick:b.telegraphStartedTick,resolvesTick:b.resolvesTick})),
  recoveredPools:bosses.flatMap(b=>b.pools.map(p=>({...copyWire(p),bossDefinitionId:b.bossDefinitionId})))};
}
export function recoveredStatusForActor(state,entityId){
 for(const b of Object.values(state.bossCombat?.bossesByEntityId??{}))if(recoveredBossRecord(b)){
  const s=b.statusesByEntityId[entityId];if(s&&s.expiresTick>state.tick)return {statusId:s.kind,sourceBossId:b.bossId,applicationTick:s.startedTick,expirationTick:s.expiresTick,remainingTicks:s.expiresTick-state.tick,movementMultiplier:s.movementMultiplier,reversed:s.kind==='control_glitch'};
 }
 return null;
}
