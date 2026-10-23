// Bridge recovered October 2026 boss Canvas painters to authoritative SAQ World
// presentation records. The archived painters remain unchanged. This module
// only projects already simulated attacks, hits, summons and hazard lifetimes.
import {drawCorrosiveAbomination,drawCorrosiveGround,corrosiveDepthItems,drawCorrosiveBossHud} from './boss_presentation_corrosive_v1.js';
import {drawVoidOverseer,drawVoidGround,voidDepthItems,drawVoidBossHud} from './boss_presentation_void_overseer_v1.js';
import {hasExtendedBossPainter,drawExtendedBossActor,drawExtendedSummonActor,drawExtendedBossGround,extendedBossDepthItems} from './boss_archive_world_extended_v1.js';

export const hasArchivedBossPainter=id=>id==='corrosive_abomination'||id==='void_overseer'||hasExtendedBossPainter(id);
const corrosive=id=>id==='corrosive_abomination';
const isVoid=id=>id==='void_overseer';
const TAU=Math.PI*2;
const point=(x,y)=>({x,y});
const rand=(seed,n,salt=0)=>{let v=(seed^Math.imul(n+1,0x9e3779b1)^salt)>>>0;v=Math.imul(v^(v>>>16),0x85ebca6b)>>>0;v=Math.imul(v^(v>>>13),0xc2b2ae35)>>>0;return((v^(v>>>16))>>>0)/4294967296;};
const renamed=ability=>ability==='corrosive_slam'?'slam':ability;
function record(original){return original?{...original,ability:renamed(original.ability)}:null;}
function archivalActor(actor){
 if(!hasArchivedBossPainter(actor?.boss?.bossDefinitionId))return actor;
 const boss=actor.boss;
 return {...actor,boss:{...boss,
  pendingAction:record(boss.pendingAction),
  lastAction:record(boss.lastAction),
  facingAngle:Math.atan2((boss.pendingAction?.targetPosition?.y??boss.lastAction?.targetPosition?.y??actor.position.y+1)-actor.position.y,
   (boss.pendingAction?.targetPosition?.x??boss.lastAction?.targetPosition?.x??actor.position.x)-actor.position.x),
  recentRuptures:boss.recentRuptures??[]
 }};
}
export function drawArchivedBossActor(c,actor,tick,flash=false){
 if(hasExtendedBossPainter(actor.boss?.bossDefinitionId))return drawExtendedBossActor(c,actor,tick,flash);
 if(corrosive(actor.boss?.bossDefinitionId))return drawCorrosiveAbomination(c,archivalActor(actor),tick,flash);
 if(isVoid(actor.boss?.bossDefinitionId))return drawVoidOverseer(c,archivalActor(actor),tick,flash);
 return false;
}
let cacheKey=null,cacheTick=null,cacheView=null;
// The original module expects typed projection arrays. Compute only for a live
// archived boss and memoize across ground, depth and HUD for a presentation tick.
export function archivedBossArtModel(model,tick){
 if(cacheKey===model&&cacheTick===tick)return cacheView;
 cacheKey=model;cacheTick=tick;
 const all=Object.values(model.entitiesById??{}),bosses=all.filter(a=>a.alive&&hasArchivedBossPainter(a.boss?.bossDefinitionId));
 if(!bosses.length){cacheView=null;return null;}
 const byBossId=new Map(bosses.map(a=>[a.boss.bossId,a]));
 const bodyById=Object.fromEntries(all.map(a=>[a.entityId,archivalActor(a)]));
 const h=model.bossHazards??{};
 const tele=(h.recoveredTelegraphs??[]).filter(q=>hasArchivedBossPainter(q.bossDefinitionId));
 const pools=(h.recoveredPools??[]).filter(q=>hasArchivedBossPainter(q.bossDefinitionId));
 const acid=(pools.filter(q=>corrosive(q.bossDefinitionId)&&['acid','slag'].includes(q.kind))).map(q=>({...q}));
 const minions=all.filter(a=>a.alive&&['slime','slag'].includes(a.bossSummon?.kind)&&byBossId.has(a.bossSummon.bossId)).map(a=>{
  const b=a.bossSummon,created=b.activatedTick??tick;
  return {id:a.entityId,sourceEntityId:byBossId.get(b.bossId).entityId,bossId:b.bossId,
   position:{...a.position},landingPosition:{...a.position},originPosition:{...a.position},
   enemyFamily:b.kind==='slag'?'slag_slime':'slime',stage:'active',
   spawnedTick:created,landsTick:created,activatesTick:created,
   hp:a.hp,maxHp:a.maxHp,movedLastTick:a.movedLastTick,visualSeed:a.visualSeed,
   meleePhase:a.meleePhase, facingAngle:0, lastDamagedTick:a.lastDamagedTick};
 });
 // Continuous acid ribbon derived from actual authority patches, preserving the
 // approved V2 bank painter instead of opaque overlapping pool circles.
 const originalTrails=[],trailGroups=new Map();
 for(const p of acid){const key=p.bossId+'/'+p.kind,rows=trailGroups.get(key)??[];rows.push(p);trailGroups.set(key,rows);}
 for(const[key,rows]of trailGroups){
  rows.sort((a,b)=>a.createdTick-b.createdTick||a.id.localeCompare(b.id));
  const owner=byBossId.get(rows[0].bossId),kind=rows[0].kind==='slag'?'slag':'boss';
  const segments=rows.map((p,i)=>{
   const prev=rows[i-1],near=prev&&Math.hypot(p.position.x-prev.position.x,p.position.y-prev.position.y)<=20;
   return {sequence:i+1,from:near?point(prev.position.x,prev.position.y):point(p.position.x-1,p.position.y),
     to:point(p.position.x,p.position.y),createdTick:p.createdTick,expiresTick:p.expiresTick};
  });
  originalTrails.push({id:key,sourceEntityId:owner?.entityId??rows[0].bossId,kind,radius:rows[0].radius,segments});
 }
 const cTele=tele.filter(q=>corrosive(q.bossDefinitionId)).map(q=>{
  const b=byBossId.get(q.bossId),at=q.position,target=q.position,origin=b?.position??target;
  // The original pod painter uses the same deterministic fan as the active
  // World storm: three points offset from the locked target position.
  const positions=q.ability==='spore_storm'?[0,1,2].map(i=>{
   const angle=i*TAU/3;
   return point(origin.x+Math.cos(angle)*45,origin.y+Math.sin(angle)*45);
  }):[];
  return {...q,id:q.bossId+':cast:'+q.sequence,ability:renamed(q.ability),targetPosition:target,originPosition:origin,
   radius:q.ability==='corrosive_slam'?64:12,sporeSpawnPositions:positions};
 });
 const vTele=tele.filter(q=>isVoid(q.bossDefinitionId)&&q.ability==='singularity').map(q=>{
  const b=byBossId.get(q.bossId),center=b?.position??q.position;
  return {...q,id:q.bossId+':cast:'+q.sequence,ability:'singularity',position:{...center},
   targetPosition:{...center},originPosition:{...center},radius:93};
 });
 const cImpacts=[],vImpacts=[];
 for(const b of bosses){
  const row=b.boss.lastAction,age=row?tick-row.resolvedTick:Infinity;
  if(!row||age<0||age>=40)continue;
  const common={...row,bossId:b.boss.bossId,sourceEntityId:b.entityId,originPosition:{...b.position},sequence:b.boss.abilitySequence??1};
  if(corrosive(b.boss.bossDefinitionId)&&row.ability==='corrosive_slam')cImpacts.push({...common,ability:'slam',radius:72});
  if(isVoid(b.boss.bossDefinitionId)&&row.ability==='singularity')vImpacts.push({...common,ability:'singularity',radius:93});
 }
 const archivedHazards={...h,
  corrosivePools:acid,corrosiveTrails:originalTrails,corrosiveMinions:minions,corrosiveTelegraphs:cTele,corrosiveImpacts:cImpacts,
  corrosiveSpores:(h.recoveredSpores??[]).filter(p=>corrosive(p.bossDefinitionId)).map(s=>({...s,stage:'drifting',radius:12})),corrosiveSheds:[],
  voidTelegraphs:vTele,voidImpacts:vImpacts};
 cacheView={...model,entitiesById:bodyById,bossHazards:archivedHazards};
 return cacheView;
}
export function drawArchivedBossGround(c,model,tick){
 const v=archivedBossArtModel(model,tick);if(!v)return;
 drawCorrosiveGround(c,v,tick);drawVoidGround(c,v,tick);drawExtendedBossGround(c,model,tick);
}
export function archivedBossDepthItems(model,tick,viewport=null){
 const v=archivedBossArtModel(model,tick);if(!v)return [];
 return [...corrosiveDepthItems(v,tick,viewport),...voidDepthItems(v,tick,viewport),...extendedBossDepthItems(model,tick,viewport)];
}
export function drawArchivedBossHud(c,canvas,model){
 const v=archivedBossArtModel(model,model.tick);if(!v)return false;
 return drawCorrosiveBossHud(c,canvas,v)||drawVoidBossHud(c,canvas,v);
}

export const drawArchivedBossSummon=drawExtendedSummonActor;