// Exact original (unminified esbuild) October 2026 Canvas painters for four
// additional bosses. Only adaptation of current authoritative World events is
// performed here; no damage, collision, timers or saved records are mutated.
import {drawChronosArbitrator,drawChronosGround,chronosDepthItems} from './boss_presentation_chronos_arbitrator_v1.js';
import {drawNexusOverseer,drawNexusGround,nexusDepthItems} from './boss_presentation_nexus_overseer_v1.js';
import {drawHooktail,drawHooktailGround,hooktailDepthItems} from './boss_presentation_hooktail_v1.js';
import {drawCinderhart,drawCinderBunny,drawCinderhartGround,cinderhartDepthItems} from './boss_presentation_cinderhart_v1.js';

const kinds=['chronos_arbitrator','nexus_overseer','hooktail','cinderhart'];
export const hasExtendedBossPainter=id=>kinds.includes(id);
const point=p=>({x:p.x,y:p.y});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const ids=a=>a?.bossSummon?.kind;
const isExtendedSummon=a=>['bunny','hologram'].includes(ids(a));
const renamed=(kind,ability)=>{
 if(kind==='chronos_arbitrator')return ({chronos_slam:'slam',time_field:'dilation_field',chronos_rewind:'rewind'})[ability]??ability;
 if(kind==='hooktail')return ({hooked_tail:'slam',arena_collapse:'calamity_slam'})[ability]??ability;
 if(kind==='cinderhart')return ({fire_charge:'cinder_rush'})[ability]??ability;
 if(kind==='nexus_overseer')return ({prism_slam:'strike'})[ability]??ability;
 return ability;
};
const action=(kind,x,origin)=>x?{...x,ability:renamed(kind,x.ability),originPosition:x.originPosition??origin}:null;
function rewindRecord(b,actor,tick){
 const pending=b.pendingAction,last=b.lastAction;
 if(pending?.ability==='chronos_rewind')return {startedTick:pending.startedTick,resolvesTick:pending.resolvesTick,outcome:'channeling',originPosition:point(actor.position),targetPosition:point(pending.targetPosition)};
 if(last?.ability==='chronos_rewind'&&tick-last.resolvedTick<48)return {startedTick:last.resolvedTick-240,resolvedTick:last.resolvedTick,resolvesTick:last.resolvedTick,outcome:'completed',originPosition:point(actor.position),targetPosition:point(last.targetPosition)};
 return null;
}
function barrierRecord(b,actor,tick){
 if(b.phase!==2)return null;
 const alive=(b.minions??[]).filter(m=>m.kind==='hologram'&&m.stage==='hatched');
 if(!alive.length)return null;
 return {id:b.bossId+':barrier',bossId:b.bossId,sourceEntityId:actor.entityId,startedTick:Math.min(b.activatedTick??tick,tick-16),
  outcome:'active',position:point(actor.position),originPosition:point(actor.position),sequence:b.abilitySequence??0,
  decoyEntityIds:alive.map(m=>m.entityId),livingDecoyEntityIds:alive.map(m=>m.entityId),blockedHitTick:null};
}
function originalActor(actor,tick){
 const kind=actor.boss?.bossDefinitionId;
 if(!hasExtendedBossPainter(kind))return actor;
 const b=actor.boss;
 const pending=action(kind,b.pendingAction,actor.position),last=action(kind,b.lastAction,actor.position);
 const aim=pending?.targetPosition??last?.targetPosition;
 const facing=aim?.x<actor.position.x?-1:1;
 const add={facing,phaseStartedTick:null,abilitySequence:b.abilitySequence??0,
  pendingAction:pending,lastAction:last};
 if(kind==='chronos_arbitrator'){add.rewind=rewindRecord(b,actor,tick);add.dazeResumeTick=b.dazedUntilTick??null;}
 if(kind==='nexus_overseer')add.barrier=barrierRecord(b,actor,tick);
 // The World charge currently resolves in one authority tick. The original
 // rush painter still receives the real cast and actual ignition patches.
 if(kind==='cinderhart')add.rush=b.archive?.charge??null;
 return {...actor,boss:{...b,...add}};
}
function syntheticBunny(actor,tick,owner=null){
 const b=actor.bossSummon,age=Math.max(0,tick-(b.activatedTick??tick)),period=owner?.boss?.phase===2?36:46,flight=owner?.boss?.phase===2?24:28;
 const cycle=Math.floor(age/period),elapsed=age%period,start=tick-elapsed,hopping=elapsed<flight;
 return {...actor,cinderBunny:{summonType:'cinder_bunny',stage:hopping?'hopping':'idle',hopStartedTick:start,landsTick:start+flight,stageStartedTick:start,
  nextHopTick:start+period,hopSequence:cycle,defeatedTick:null,facing:(cycle+(b.ordinal??0))%2?1:-1}};
}
function syntheticDecoy(actor,tick){
 const b=actor.bossSummon,initial=b.activatedTick??tick,age=Math.max(0,tick-initial),seq=Math.floor(age/90),last=initial+seq*90+(b.ordinal??0)*17;
 return {...actor,nexusDecoy:{sourceBossId:b.bossId,stage:'active',aggro:true,defeatedTick:null,lastShotTick:last,nextShotTick:last+90}};
}
export function drawExtendedBossActor(c,actor,tick,flash=false){
 const a=originalActor(actor,tick),kind=actor.boss?.bossDefinitionId;
 if(kind==='chronos_arbitrator')return drawChronosArbitrator(c,a,tick,flash);
 if(kind==='nexus_overseer')return drawNexusOverseer(c,a,tick,flash);
 if(kind==='hooktail')return drawHooktail(c,a,tick,flash);
 if(kind==='cinderhart')return drawCinderhart(c,a,tick,flash);
 return false;
}
let cacheModel=null,cacheTick=null,cacheArt=null;
function projected(model,tick){
 if(cacheModel===model&&cacheTick===tick)return cacheArt;
 cacheModel=model;cacheTick=tick;
 const original=Object.values(model.entitiesById??{}),bosses=original.filter(a=>a.alive&&hasExtendedBossPainter(a.boss?.bossDefinitionId));
 if(!bosses.length){cacheArt=null;return null;}
 const byId=new Map(bosses.map(a=>[a.boss.bossId,a]));
 const actors=Object.fromEntries(original.map(a=>{
  if(hasExtendedBossPainter(a.boss?.bossDefinitionId))return [a.entityId,originalActor(a,tick)];
  if(isExtendedSummon(a)&&byId.has(a.bossSummon.bossId))return [a.entityId,ids(a)==='bunny'?syntheticBunny(a,tick,byId.get(a.bossSummon.bossId)):syntheticDecoy(a,tick)];
  return [a.entityId,a];
 }));
 const h=model.bossHazards??{},tele=(h.recoveredTelegraphs??[]).filter(q=>hasExtendedBossPainter(q.bossDefinitionId)),pools=(h.recoveredPools??[]).filter(q=>hasExtendedBossPainter(q.bossDefinitionId));
 const casts=tele.map(q=>{
  const b=byId.get(q.bossId),at=b?.position??q.originPosition??q.position;
  const ability=renamed(q.bossDefinitionId,q.ability),common={...q,id:q.bossId+':cast:'+q.sequence,ability,originPosition:point(at),targetPosition:point(q.position)};
  if(q.bossDefinitionId==='chronos_arbitrator')return {...common,position:point(q.position),radius:q.ability==='time_field'?35:64,sourceEntityId:b?.entityId};
  if(q.bossDefinitionId==='cinderhart')return {...common,position:point(q.position),radius:18,spawnCount:b?.boss?.minions?.length??5,
   rushEndPosition:q.ability==='fire_charge'?point(q.position):null};
  return {...common,position:point(q.position),facing:q.position.x<at.x?-1:1,
   range:q.ability==='scarlet_fire'?110:null,halfAngle:q.ability==='scarlet_fire'?.8:null,
   radius:q.ability==='prism_collapse'?64:q.ability==='hooked_tail'?64:80,sourceEntityId:b?.entityId};
 });
 const impacts=[];
 for(const b of bosses){
  const last=b.boss.lastAction,age=last?tick-last.resolvedTick:Infinity;
  if(!last||age<0||age>=40)continue;
  impacts.push({...last,ability:renamed(b.boss.bossDefinitionId,last.ability),bossDefinitionId:b.boss.bossDefinitionId,
   bossId:b.boss.bossId,sourceEntityId:b.entityId,originPosition:point(b.position),radius:75,sequence:b.boss.abilitySequence??0});
 }
 const field=pools.filter(p=>p.bossDefinitionId==='chronos_arbitrator'&&p.kind==='time').map(p=>({...p,radius:35}));
 const fires=pools.filter(p=>p.bossDefinitionId==='cinderhart'&&p.kind==='fire').map(p=>({...p,ignitesTick:p.createdTick+12}));
 const barriers=bosses.filter(b=>b.boss.bossDefinitionId==='nexus_overseer').map(b=>barrierRecord(b.boss,b,tick)).filter(Boolean);
 const glitches=[];
 for(const b of bosses.filter(x=>x.boss.bossDefinitionId==='nexus_overseer')){
  for(const a of original)if(a?.timedStatuses?.control_glitch){const s=a.timedStatuses.control_glitch;
   glitches.push({id:b.boss.bossId+':glitch:'+a.entityId,sourceBossId:b.boss.bossId,targetEntityId:a.entityId,position:point(a.position),appliedTick:s.applicationTick??tick,expiresTick:s.expirationTick??tick+1});
  }
 }
 // Hooktail's authority currently stores a circular crumbling hazard, not
 // individual collapsed floor tiles. We preserve it as a warning only; never
 // paint missing floor tiles or imply new collision has occurred.
 const artHazards={...h,
  chronosTelegraphs:casts.filter(q=>q.bossDefinitionId==='chronos_arbitrator'),
  chronosFields:field,chronosImpacts:impacts.filter(q=>q.bossDefinitionId==='chronos_arbitrator'&&q.ability==='slam'),
  chronosRewinds:[],
  nexusTelegraphs:casts.filter(q=>q.bossDefinitionId==='nexus_overseer'),
  nexusImpacts:impacts.filter(q=>q.bossDefinitionId==='nexus_overseer'),nexusBarriers:barriers,nexusProjectiles:[],nexusGlitches:glitches,
  hooktailTelegraphs:casts.filter(q=>q.bossDefinitionId==='hooktail'),
  hooktailImpacts:impacts.filter(q=>q.bossDefinitionId==='hooktail'),
   hooktailCollapsedRings:(h.recoveredCollapsedRings??[]).map(r=>({id:r.bossId+':collapse:'+r.index,bossId:r.bossId,createdTick:r.createdTick,ring:{index:r.index,minColumn:r.minColumn,maxColumn:r.maxColumn,minRow:r.minRow,maxRow:r.maxRow,tileSize:r.tileSize,tiles:r.tiles}})),
  cinderhartFires:fires,
  cinderhartLandings:[],cinderhartTelegraphs:casts.filter(q=>q.bossDefinitionId==='cinderhart'),
  cinderhartImpacts:impacts.filter(q=>q.bossDefinitionId==='cinderhart')};
 cacheArt={...model,entitiesById:actors,bossHazards:artHazards};
 return cacheArt;
}
export function drawExtendedBossGround(c,model,tick){const a=projected(model,tick);if(!a)return;
 drawChronosGround(c,a,tick);drawNexusGround(c,a,tick);drawHooktailGround(c,a,tick);drawCinderhartGround(c,a,tick);
}
export function extendedBossDepthItems(model,tick,viewport){const a=projected(model,tick);if(!a)return [];
 return [...chronosDepthItems(a,tick,viewport),...nexusDepthItems(a,tick,viewport),...hooktailDepthItems(a,tick,viewport),...cinderhartDepthItems(a,tick,viewport)];
}
export function drawExtendedSummonActor(c,actor,tick,flash=false){
 if(!isExtendedSummon(actor))return false;
 const boss=Object.values(cacheModel?.entitiesById??{}).find(a=>a.boss?.bossId===actor.bossSummon.bossId);
 if(ids(actor)==='bunny')return drawCinderBunny(c,syntheticBunny(actor,tick,boss),tick,flash);
 if(ids(actor)==='hologram')return drawNexusOverseer(c,syntheticDecoy(actor,tick),tick,flash);
 return false;
}