// Gameplay-only restoration of original 2026-10-21/22 boss arena behavior.
// Ground truth: archived SOURCE/RECOVERED-ARENA-SOURCE and six PLAYABLE-ARENAS.
// The World actor IDs / site geometry / save journal remain authoritative.
import {combatInteger,compareCombat,multiplyCombat,subtractCombat,minCombat} from '../shared/contracts/combat_amount.js';
import {integerBigInt} from '../shared/contracts/integer_domain.js';
import {copyWire} from '../shared/contracts/wire.js';
import {archivedCombatProfile} from '../shared/content/archived_boss_fight_profiles_v1.js';
import {range,segmentDistance,sweptPathClear,originalCinderRushEndpoint,originalArenaRing,onOriginalRing,originalFireCone} from './archived_boss_attack_geometry_v1.js';
import {moveAegisAffectedActor} from './aegis_goliath_v1.js';

const rounded=(hp,n,d)=>combatInteger(multiplyCombat(hp,n,d),'round');
const within=(a,b,r)=>range(a,b)<=r;
const point=p=>({x:p.x,y:p.y});
const roll=(seed,n,salt=0)=>{let v=(seed^Math.imul(n+1,0x9e3779b1)^salt)>>>0;v=Math.imul(v^(v>>>16),0x85ebca6b)>>>0;v=Math.imul(v^(v>>>13),0xc2b2ae35)>>>0;return ((v^(v>>>16))>>>0)/4294967296;};

export function createArchivedBossFightRuntime(state,{pool,damage,hit,clear,awaken,effect}){
 const cfg=b=>b.archive?archivedCombatProfile(b.bossDefinitionId):null;
 const targetsIn=(b,all)=>all.filter(t=>t?.alive&&t.residency?.spaceInstanceId===b.spaceInstanceId);
 const damagePacket=(a,t,amount,mechanic,metadata={})=> {
  if(!t?.alive||compareCombat(amount,0)<=0)return false;
  return damage(a,t,amount,mechanic,{bypassMitigation:true,...metadata})!==false;
 };
 function beginRush(b,a,target,collision){
  const conf=cfg(b)?.rush;if(!conf)return false;
  const end=originalCinderRushEndpoint(collision,a.position,target,Math.min(a.hullRadius,28));
  b.archive.charge={startedTick:state.tick,endsTick:state.tick+conf.durationTicks,
   originPosition:point(a.position),endPosition:end,hitEntityIds:[],lastFirePosition:point(a.position)};
  b.lastAction={ability:'fire_charge',resolvedTick:state.tick,targetPosition:point(target),hitEntityIds:[]};
  clear(b);b.actionState='rushing';b.nextActionTick=state.tick+conf.durationTicks+110;
  return true;
 }
 function advanceRush(b,a,all,c){
  const r=b.archive?.charge,conf=cfg(b)?.rush;
  if(!r||!conf)return false;
  const elapsed=Math.max(0,state.tick-r.startedTick),q=Math.min(1,elapsed/conf.durationTicks);
  const prev=point(a.position),next={x:r.originPosition.x+(r.endPosition.x-r.originPosition.x)*q,
   y:r.originPosition.y+(r.endPosition.y-r.originPosition.y)*q};
  if(sweptPathClear(c,prev,next,Math.min(a.hullRadius,28)))a.position=next;
  const step=range(prev,a.position);
  for(const t of targetsIn(b,all)){
   if(r.hitEntityIds.includes(t.entityId)||segmentDistance(t.position,prev,a.position)>conf.radius+(t.hullRadius??9))continue;
   if(damagePacket(a,t,rounded(a.attackDamage,13,10),'cinderhart_rush',{sourceActionSequence:b.abilitySequence})){
    r.hitEntityIds.push(t.entityId);b.lastAction.hitEntityIds=[...r.hitEntityIds];
   }
  }
  // The archived rush paints one connected line over 24 ticks. Each segment
  // stays dangerous for 180 ticks after laying, not merely after the cast.
  const before=r.lastFirePosition;
  if(range(before,a.position)>=8){
   let pos=point(before),d=range(before,a.position),count=Math.min(16,Math.ceil(d/10));
   for(let i=1;i<=count;i++){
    const p={x:before.x+(a.position.x-before.x)*i/count,y:before.y+(a.position.y-before.y)*i/count};
    if(sweptPathClear(c,pos,p,3))pool(b,p,'fire',18,180);
    pos=p;
   }
   r.lastFirePosition=point(a.position);
  }
  if(state.tick>=r.endsTick){
   b.archive.charge=null;b.actionState='idle';b.nextActionTick=state.tick+110;
  }
  return true;
 }
 function spillCorrosive(b,a,c){
  if(b.bossDefinitionId!=='corrosive_abomination')return;
  const conf=cfg(b),from=b.lastTrailPosition,to=a.position,d=range(from,to);
  if(d<8)return;
  const count=Math.min(15,Math.floor(d/9));
  if(count<1)return;
  let prev=point(from);
  for(let i=1;i<=count;i++){
   const p={x:from.x+(to.x-from.x)*i/count,y:from.y+(to.y-from.y)*i/count};
   if(sweptPathClear(c,prev,p,Math.min(5,conf.acid.radius/2)))pool(b,p,'acid',conf.acid.radius,conf.acid.lifeTicks);
   prev=p;
  }
  b.lastTrailPosition=point(to);
 }
 function tickAcid(b,a,all,c){
  if(b.bossDefinitionId!=='corrosive_abomination')return;
  const conf=cfg(b);
  for(const[kind,cfgKey]of[['acid','acid'],['slag','slag']]){
   const spec=conf[cfgKey];if(state.tick%spec.cadenceTicks!==0)continue;
   const pools=b.pools.filter(p=>p.kind===kind&&state.tick>p.createdTick&&state.tick<p.expiresTick);
   if(!pools.length)continue;
   for(const t of targetsIn(b,all)){
    if(!pools.some(p=>within(t.position,p.position,p.radius+(t.hullRadius??9))&&sweptPathClear(c,p.position,t.position,3)))continue;
    let requested=rounded(t.maxHp,kind==='acid'?15:1,kind==='acid'?1000:100);
    if(kind==='acid'){
     if(compareCombat(t.hp,'1')<=0)continue;
     requested=combatInteger(minCombat(requested,subtractCombat(t.hp,'1')),'round');
    }
    damagePacket(a,t,requested,kind==='acid'?'corrosive_acid':'corrosive_slag_sludge',
      {sourceActionSequence:b.abilitySequence,nonLethal:kind==='acid'});
   }
  }
 }
 function startSpores(b,a,c){
  if(b.bossDefinitionId!=='corrosive_abomination'||!b.archive)return false;
  const spores=b.archive.sporesById,keys=Object.keys(spores);
  if(keys.length>=9)for(const id of keys.sort().slice(0,keys.length-8))delete spores[id];
  for(let i=0;i<3;i++){
   const theta=i*Math.PI*2/3,p={x:a.position.x+Math.cos(theta)*45,y:a.position.y+Math.sin(theta)*45};
   const id=b.bossId+':spore:'+b.abilitySequence+':'+i;
   spores[id]={id,position:p,previousPosition:point(p),createdTick:state.tick,expiresTick:state.tick+360,sequence:b.abilitySequence,ordinal:i,targetEntityId:null};
  }
  return true;
 }
 function tickSpores(b,a,all,c){
  if(b.bossDefinitionId!=='corrosive_abomination'||!b.archive)return;
  const spores=b.archive.sporesById;
  for(const [id,s]of Object.entries(spores).sort(([x],[y])=>x.localeCompare(y))){
   if(state.tick>=s.expiresTick){delete spores[id];continue;}
   if(state.tick<=s.createdTick)continue;
   const target=targetsIn(b,all).sort((x,y)=>range(s.position,x.position)-range(s.position,y.position)||x.entityId.localeCompare(y.entityId))[0];
   s.previousPosition=point(s.position);s.targetEntityId=target?.entityId??null;
   if(!target)continue;
   const d=range(s.position,target.position);
   if(d>0){s.position.x+=(target.position.x-s.position.x)/d;s.position.y+=(target.position.y-s.position.y)/d;}
   // The original one-HP pods float through walls and home on the nearest party
   // member. We retain their authority as independent saved projectiles.
   if(d<12+(target.hullRadius??9)){
    damagePacket(a,target,rounded(a.attackDamage,11875,10000),'corrosive_spore',{sourceActionSequence:s.sequence});
    const old=b.archive.poisonByEntityId[target.entityId];
    b.archive.poisonByEntityId[target.entityId]={
     stacks:Math.min(5,(old?.stacks??0)+3),lastAppliedTick:state.tick,
     nextTick:old?.nextTick??state.tick+60,expiresTick:state.tick+240
    };
    delete spores[id];
   }
  }
 }
 function tickPoison(b,a,all){
  if(b.bossDefinitionId!=='corrosive_abomination'||!b.archive)return;
  const active=new Set(targetsIn(b,all).map(t=>t.entityId));
  for(const [id,p]of Object.entries(b.archive.poisonByEntityId)){
   const t=state.entitiesById[id];
   if(!active.has(id)||!t?.alive||state.tick>=p.expiresTick){delete b.archive.poisonByEntityId[id];continue;}
   if(state.tick>=p.nextTick){
    const damageValue=rounded(t.maxHp,p.stacks*12,1000);
    damagePacket(a,t,damageValue,'corrosive_poison',{sourceActionSequence:b.abilitySequence});
    p.nextTick=state.tick+60;
   }
  }
 }
 function tickContact(b,a,all){
  if(!cfg(b)||!['corrosive_abomination','void_overseer'].includes(b.bossDefinitionId))return;
  const conf=cfg(b).contact;
  for(const t of targetsIn(b,all)){
   if(!within(t.position,a.position,conf.radius+(t.hullRadius??9)))continue;
   const old=b.archive.contactByEntityId[t.entityId]??-100;
   if(state.tick-old<conf.cadenceTicks)continue;
   b.archive.contactByEntityId[t.entityId]=state.tick;
   damagePacket(a,t,rounded(a.attackDamage,1,2),'boss_body_contact',{sourceActionSequence:b.abilitySequence});
  }
 }
 function collapseRing(b,a,c){
  if(b.bossDefinitionId!=='hooktail'||!b.archive)return false;
  const idx=b.archive.collapsedRings.length,ring=originalArenaRing(c,b.homePosition,idx);
  if(!ring)return false;
  b.archive.collapsedRings.push({...ring,createdTick:state.tick});
  b.collapseStep=Math.min(7,idx+1);
  return true;
 }
 function tickCollapsedRings(b,a,all){
  if(b.bossDefinitionId!=='hooktail'||!b.archive||!b.archive.collapsedRings.length||state.tick%40!==0)return;
  for(const t of targetsIn(b,all)){
   if(!b.archive.collapsedRings.some(r=>onOriginalRing(r,t.position)))continue;
   if(compareCombat(t.hp,'1')<=0)continue;
   const requested=combatInteger(minCombat(rounded(t.maxHp,8,100),subtractCombat(t.hp,'1')),'round');
   damagePacket(a,t,requested,'hooktail_void',{sourceActionSequence:b.abilitySequence,nonLethal:true});
  }
 }
 function resolveOriginal(b,a,targets,ability,pos,c){
  if(!b.archive)return false;
  const kind=b.bossDefinitionId,conf=cfg(b);
  const locked=targetsIn(b,targets),hits=[];
  if(ability==='fire_charge'&&kind==='cinderhart')return beginRush(b,a,pos,c);
  if(ability==='spore_storm'&&kind==='corrosive_abomination'){
   startSpores(b,a,c);
  }else if(ability==='corrosive_slam'&&kind==='corrosive_abomination'){
   for(const t of locked)if(within(t.position,pos,64+(t.hullRadius??9))&&damagePacket(a,t,rounded(a.attackDamage,18,10),'corrosive_slam',{sourceActionSequence:b.abilitySequence}))hits.push(t.entityId);
  }else if(ability==='time_field'&&kind==='chronos_arbitrator'){
   pool(b,pos,'time',conf.timeField.radius,conf.timeField.lifetimeTicks);
  }else if(ability==='chronos_slam'&&kind==='chronos_arbitrator'){
   for(const t of locked)if(within(t.position,pos,64+(t.hullRadius??9))&&damagePacket(a,t,rounded(a.attackDamage,18,10),'chronos_slam',{sourceActionSequence:b.abilitySequence}))hits.push(t.entityId);
  }else if(ability==='prism_collapse'&&kind==='nexus_overseer'){
   for(const t of locked)if(within(t.position,pos,conf.cage.radius+(t.hullRadius??9))&&damagePacket(a,t,rounded(a.attackDamage,18,10),'nexus_prism_collapse',{sourceActionSequence:b.abilitySequence}))hits.push(t.entityId);
  }else if(ability==='control_glitch'&&kind==='nexus_overseer'){
   for(const t of locked)if(within(t.position,pos,conf.glitch.radius+(t.hullRadius??9))){effect(b,t,'control_glitch',conf.glitch.durationTicks,1);hits.push(t.entityId);}
  }else if(ability==='scarlet_fire'&&kind==='hooktail'){
   for(const t of locked)if(originalFireCone(a.position,pos,t.position,conf.fire.range,conf.fire.halfAngle,t.hullRadius??9)
     &&sweptPathClear(c,a.position,t.position,3)&&damagePacket(a,t,rounded(a.attackDamage,155,100),'hooktail_scarlet_fire',{sourceActionSequence:b.abilitySequence}))hits.push(t.entityId);
  }else if(ability==='hooked_tail'&&kind==='hooktail'){
   for(const t of locked)if(within(t.position,pos,64+(t.hullRadius??9))&&damagePacket(a,t,rounded(a.attackDamage,18,10),'hooktail_slam',{sourceActionSequence:b.abilitySequence}))hits.push(t.entityId);
  }else if(ability==='arena_collapse'&&kind==='hooktail'){
   collapseRing(b,a,c);
  }else if(ability==='singularity'&&kind==='void_overseer'){
   for(const t of locked)if(within(t.position,a.position,conf.singularity.radius+(t.hullRadius??9))
    &&damagePacket(a,t,rounded(a.attackDamage,195,100),'void_singularity',{sourceActionSequence:b.abilitySequence}))hits.push(t.entityId);
  }else return false;
  b.lastAction={ability,resolvedTick:state.tick,targetPosition:point(pos),hitEntityIds:hits};
  clear(b);b.actionState='idle';b.nextActionTick=state.tick+110;
  return true;
 }
 function tickCinderFires(b,a,all){
  if(b.bossDefinitionId!=='cinderhart'||!b.archive)return;
  for(const t of targetsIn(b,all)){
   const old=b.archive.contactByEntityId[t.entityId]??-1000;
   if(state.tick-old<30)continue;
   const standing=b.pools.some(p=>p.kind==='fire'&&p.expiresTick>state.tick&&
    state.tick>=p.createdTick+12&&within(t.position,p.position,p.radius+(t.hullRadius??9)));
   if(!standing)continue;
   if(damagePacket(a,t,combatInteger(24),'cinderhart_fire',{sourceActionSequence:b.abilitySequence,periodic:true}))
    b.archive.contactByEntityId[t.entityId]=state.tick;
  }
 }
 function advanceNexusDecoys(b,a,all,c){
  if(b.bossDefinitionId!=='nexus_overseer'||!b.archive)return;
  const cfgN=cfg(b).decoy,shots=b.archive.nexusShotsById??=( {});
  for(const id of b.summonEntityIds){
   const s=state.bossCombat?.summonsByEntityId?.[id],decoy=state.entitiesById[id];
   if(s?.kind!=='hologram'||s.stage!=='hatched'||!decoy?.alive)continue;
   const targets=targetsIn(b,all),t=[...targets].sort((x,y)=>range(decoy.position,x.position)-range(decoy.position,y.position)||x.entityId.localeCompare(y.entityId))[0];
   if(!t)continue;
   const d=range(decoy.position,t.position),u=d>0?{x:(t.position.x-decoy.position.x)/d,y:(t.position.y-decoy.position.y)/d}:{x:1,y:0};
   if(d>100)moveAegisAffectedActor(c,decoy,{x:u.x*cfgN.speed,y:u.y*cfgN.speed});
   else if(d<60)moveAegisAffectedActor(c,decoy,{x:-u.x*cfgN.speed*.8,y:-u.y*cfgN.speed*.8});
   const age=state.tick-s.activatedTick-60-s.ordinal*17;
   if(age<0||age%90!==0||d>cfgN.range||!sweptPathClear(c,decoy.position,t.position,3))continue;
   const direction=range(decoy.position,t.position)||1,seq=Math.floor(age/90)+1;
   const key=b.bossId+':bolt:'+decoy.entityId+':'+seq;
   shots[key]={id:key,sourceEntityId:decoy.entityId,position:point(decoy.position),
    previousPosition:point(decoy.position),
    velocity:{x:(t.position.x-decoy.position.x)/direction*cfgN.projectileSpeed,
     y:(t.position.y-decoy.position.y)/direction*cfgN.projectileSpeed},
    createdTick:state.tick,expiresTick:state.tick+cfgN.projectileLifeTicks,sequence:seq,ordinal:s.ordinal};
   if(Object.keys(shots).length>12)delete shots[Object.keys(shots).sort((x,y)=>shots[x].createdTick-shots[y].createdTick||x.localeCompare(y))[0]];
  }
  for(const [key,p] of Object.entries(shots).sort(([x],[y])=>x.localeCompare(y))){
   const actor=state.entitiesById[p.sourceEntityId];
   if(!actor?.alive||state.tick>=p.expiresTick){delete shots[key];continue;}
   if(state.tick<=p.createdTick)continue;
   const prev=point(p.position),next={x:prev.x+p.velocity.x,y:prev.y+p.velocity.y};
   if(!sweptPathClear(c,prev,next,cfgN.projectileRadius)){delete shots[key];continue;}
   let best=null,bestT=2;
   for(const t of targetsIn(b,all)){
    const dx=next.x-prev.x,dy=next.y-prev.y,den=dx*dx+dy*dy||1;
    const u=Math.min(1,Math.max(0,((t.position.x-prev.x)*dx+(t.position.y-prev.y)*dy)/den));
    if(segmentDistance(t.position,prev,next)<=cfgN.projectileRadius+(t.hullRadius??9)&&u<bestT){best=t;bestT=u;}
   }
   if(best){
    damagePacket(actor,best,actor.attackDamage,'nexus_decoy_bolt',{sourceActionSequence:p.sequence,
     projectileImpact:true,projectileDirection:{x:p.velocity.x/cfgN.projectileSpeed,y:p.velocity.y/cfgN.projectileSpeed}});
    delete shots[key];continue;
   }
   p.previousPosition=prev;p.position=next;
  }
 }
 function tick(b,a,all,c){
  if(!b.archive||!cfg(b))return false;
  if(b.bossDefinitionId==='corrosive_abomination'){spillCorrosive(b,a,c);tickAcid(b,a,all,c);tickSpores(b,a,all,c);tickPoison(b,a,all);}
  if(b.bossDefinitionId==='hooktail')tickCollapsedRings(b,a,all);
  if(b.bossDefinitionId==='cinderhart')tickCinderFires(b,a,all);
  if(b.bossDefinitionId==='nexus_overseer')advanceNexusDecoys(b,a,all,c);
  if(['corrosive_abomination','void_overseer'].includes(b.bossDefinitionId))tickContact(b,a,all);
  return b.bossDefinitionId==='cinderhart'&&advanceRush(b,a,all,c);
 }
 return Object.freeze({tick,resolveOriginal,beginRush,startSpores,collapseRing});
}
