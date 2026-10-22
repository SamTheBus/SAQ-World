import {createAegisMimicSimulation} from './aegis_mimics_v2.js';
import {combatInteger,compareCombat,multiplyCombat} from '../shared/contracts/combat_amount.js';
import {copyWire} from '../shared/contracts/wire.js';
import {AEGIS_GOLIATH_ID,AEGIS_GOLIATH as C} from '../shared/content/aegis_goliath_v1.js';
import {collidesWithTiles,collisionTile} from '../shared/rules/world_geometry.js';

export const aegisAngleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const normalized=a=>Math.atan2(Math.sin(a),Math.cos(a));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const angle=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
const roll=(seed,n,salt)=>{let v=(seed^Math.imul(n+1,0x9e3779b1)^salt)>>>0;v=Math.imul(v^(v>>>16),0x85ebca6b)>>>0;v=Math.imul(v^(v>>>13),0xc2b2ae35)>>>0;return((v^(v>>>16))>>>0)/0x100000000;};
const at=(p,d,t)=>({x:p.x+d.x*t,y:p.y+d.y*t});

// Swept circle/expanded-tile contacts use the same geometry as ordinary World
// shots. A wall wins a tied party contact; no actor can be hit through a corner.
function segmentCircle(p,d,c,r){
 const x=p.x-c.x,y=p.y-c.y,a=d.x*d.x+d.y*d.y,v=x*x+y*y-r*r;
 if(v<=0)return 0;if(!a)return null;const b=2*(x*d.x+y*d.y),disc=b*b-4*a*v;
 if(disc<0)return null;const t=(-b-Math.sqrt(disc))/(2*a);return t>=0&&t<=1?t:null;
}
function segmentBox(p,d,l,t,r,b){
 let low=0,high=1;for(const[v,s,min,max]of[[p.x,d.x,l,r],[p.y,d.y,t,b]]){
  if(!s){if(v<min||v>max)return null;}else{const a=(min-v)/s,z=(max-v)/s;low=Math.max(low,Math.min(a,z));high=Math.min(high,Math.max(a,z));if(low>high)return null;}
 }return low;
}
function wallContact(c,p,d,r){
 const end=at(p,d,1),s=c.tileSize;let first=null;
 for(let y=Math.floor((Math.min(p.y,end.y)-r)/s);y<=Math.floor((Math.max(p.y,end.y)+r)/s);y++)for(let x=Math.floor((Math.min(p.x,end.x)-r)/s);x<=Math.floor((Math.max(p.x,end.x)+r)/s);x++){
  if(collisionTile(c,x,y)==='1')continue;const t=segmentBox(p,d,x*s-r,y*s-r,(x+1)*s+r,(y+1)*s+r);if(t!==null&&(first===null||t<first))first=t;
 }return first;
}
export function moveAegisAffectedActor(c,actor,delta){
 const n=Math.max(1,Math.ceil(Math.hypot(delta.x,delta.y)/2));let moved=false;
 for(let i=0;i<n;i++){const p={x:actor.position.x+delta.x/n,y:actor.position.y+delta.y/n};if(collidesWithTiles(c,p.x,p.y,actor.hullRadius))break;actor.position=p;moved=true;}
 if(moved)actor.movedLastTick=true;return moved;
}
export function createAegisGoliathCombat(state,{applyDirectDamage,eligible=()=>true,lineClear}={}){
 const mimics=createAegisMimicSimulation(state);
 const observed=new Map(),stats={pullCasts:0,shieldThrows:0,bashCasts:0,dodgedBashes:0,projectileHits:0,blockedHits:0,phaseTwoTriggers:0};
 const records=()=>Object.values(state.bossCombat?.bossesByEntityId??{}).filter(b=>b.bossDefinitionId===AEGIS_GOLIATH_ID).sort((a,b)=>a.bossId.localeCompare(b.bossId));
 const record=id=>{const b=state.bossCombat?.bossesByEntityId?.[id];return b?.bossDefinitionId===AEGIS_GOLIATH_ID?b:null;};
 function players(a){return Object.values(state.playersById).filter(p=>p.connectionStatus==='connected').map(p=>state.entitiesById[p.entityId]).filter(t=>t?.alive&&t.residency.spaceInstanceId===a.residency.spaceInstanceId&&eligible(a,t)).sort((x,y)=>x.entityId.localeCompare(y.entityId));}
 function clearAction(b){b.activeAbility=null;b.targetEntityId=null;b.targetPosition=null;b.telegraphStartedTick=null;b.resolvesTick=null;}
 function defeat(b){mimics.retire(b);clearAction(b);b.actionState='defeated';b.dazedUntilTick=null;b.shieldActive=false;b.projectilesById={};b.knockbacksByEntityId={};}
 function synchronize(b,a){
  if(!a?.alive||a.residency.spaceInstanceId!==b.spaceInstanceId||a.residency.residencyRevision!==b.sourceResidencyRevision){defeat(b);return false;}
  mimics.synchronize(b,a);
  if(!b.mimicEncounter&&b.phase===1&&compareCombat(a.hp,multiplyCombat(a.maxHp,1,2))<0){b.phase=2;b.phase2Triggered=true;b.shieldStartedTick=state.tick;stats.phaseTwoTriggers++;}
  if(b.actionState==='dazed'&&state.tick>=b.dazedUntilTick){b.actionState='idle';b.dazedUntilTick=null;}
  if(!b.mimicEncounter)b.shieldActive=b.phase===2&&b.actionState!=='dazed';
  return true;
 }
 function choose(b,d){
  if(b.phase===2&&(!b.mimicEncounter||b.shieldActive)&&d<64&&roll(b.selectionSeed,b.abilitySequence,0xa24baed5)<.8)return 'shield_bash';
  const pool=b.phase===2&&(!b.mimicEncounter||b.shieldActive)?['magnetic_pull','boomerang_shield','shield_bash']:['magnetic_pull','boomerang_shield'];
  return pool[Math.floor(roll(b.selectionSeed,b.abilitySequence,0x51ed270b)*pool.length)];
 }
 function shots(b,a,targets,c){
  for(const[id,p]of Object.entries(b.projectilesById).sort(([a],[z])=>a.localeCompare(z))){
   if(state.tick>=p.expiresTick){delete b.projectilesById[id];continue;}if(state.tick===p.firedTick)continue;
   const dx=a.position.x-p.position.x,dy=a.position.y-p.position.y,n=Math.hypot(dx,dy)||1;
   p.velocity.x+=dx/n*C.boomerang_shield.acceleration;p.velocity.y+=dy/n*C.boomerang_shield.acceleration;
   const speed=Math.hypot(p.velocity.x,p.velocity.y);if(speed>C.boomerang_shield.maxSpeed){p.velocity.x*=C.boomerang_shield.maxSpeed/speed;p.velocity.y*=C.boomerang_shield.maxSpeed/speed;}
   const wall=wallContact(c,p.position,p.velocity,8),caught=state.tick-p.firedTick>18?segmentCircle(p.position,p.velocity,a.position,16):null;
   let hit=null,time=null;for(const t of targets){const q=segmentCircle(p.position,p.velocity,t.position,8+t.combatRadius);if(q!==null&&(time===null||q<time)){hit=t;time=q;}}
   if(wall!==null&&(time===null||wall<=time)||caught!==null&&(time===null||caught<=time)){delete b.projectilesById[id];continue;}
   if(hit){const impact=at(p.position,p.velocity,time),s=Math.hypot(p.velocity.x,p.velocity.y)||1;applyDirectDamage(a,hit,combatInteger(multiplyCombat(a.attackDamage,9,10),'round'),'aegis_boomerang',{directEnemyAttack:'ranged',projectileImpact:true,projectileDirection:{x:p.velocity.x/s,y:p.velocity.y/s},sourceActionSequence:p.sequence,projectileContact:{position:impact,style:'clockwork'}});delete b.projectilesById[id];stats.projectileHits++;continue;}
   p.position=at(p.position,p.velocity,1);
  }
 }
 function knockbacks(b,targets,c){
  for(const[id,k]of Object.entries(b.knockbacksByEntityId)){
   const t=targets.find(t=>t.entityId===id);if(!t||k.residencyRevision!==t.residency.residencyRevision||state.tick>=k.expiresTick){delete b.knockbacksByEntityId[id];continue;}
   if(!moveAegisAffectedActor(c,t,k.velocity)){delete b.knockbacksByEntityId[id];continue;}k.velocity.x*=.75;k.velocity.y*=.75;
  }
 }
 function resolve(b,a,targets,c){
  const ability=b.activeAbility,pos=copyWire(b.targetPosition),hits=[];
  if(ability==='boomerang_shield'){
   const aim=angle(a.position,pos);for(let i=0;i<2;i++)if(Object.keys(b.projectilesById).length<4){const rad=aim+(i===0?-.25:.25),id=b.bossId+':shield:'+b.abilitySequence+':'+i;b.projectilesById[id]={id,position:copyWire(a.position),velocity:{x:Math.cos(rad)*4.5,y:Math.sin(rad)*4.5},firedTick:state.tick,expiresTick:state.tick+180,sequence:b.abilitySequence,ordinal:i};}
  }else for(const t of targets){
   const cfg=C[ability];if(distance(a.position,t.position)>cfg.radius||!lineClear(a,t)||ability==='shield_bash'&&Math.abs(aegisAngleDelta(angle(a.position,t.position),b.shieldAngle))>cfg.halfAngle)continue;
   const result=applyDirectDamage(a,t,combatInteger(multiplyCombat(a.attackDamage,cfg.damageNumerator,10),'round'),'aegis_'+ability);
   if(result!==undefined&&result!==false){hits.push(t.entityId);if(ability==='shield_bash'&&t.alive)b.knockbacksByEntityId[t.entityId]={velocity:{x:Math.cos(b.shieldAngle)*10,y:Math.sin(b.shieldAngle)*10},expiresTick:state.tick+12,residencyRevision:t.residency.residencyRevision};}
  }
  b.lastAction={ability,resolvedTick:state.tick,targetPosition:ability==='boomerang_shield'?pos:copyWire(a.position),hitEntityIds:hits};clearAction(b);b.actionState='idle';b.nextActionTick=state.tick+(b.mimicEncounter?.enragedTick!==null&&b.mimicEncounter?75:110);
  if(ability==='shield_bash'&&!hits.length){b.actionState='dazed';b.dazedUntilTick=state.tick+210;b.nextActionTick=b.dazedUntilTick;b.shieldActive=false;stats.dodgedBashes++;}
 }
 function advance(){
  for(const b of records()){
   const a=state.entitiesById[b.entityId];if(!synchronize(b,a))continue;
   if(mimics.advance(b,a))continue;
   const targets=players(a),c=state.spacesByInstanceId[b.spaceInstanceId].collision;
   knockbacks(b,targets,c);
   if(!targets.length){b.projectilesById={};if(b.actionState==='telegraphing'){clearAction(b);b.actionState='idle';b.nextActionTick=state.tick+60;}continue;}
   shots(b,a,targets,c);if(b.actionState==='dazed')continue;
   const preferred=targets.find(t=>t.entityId===observed.get(a.entityId)),target=preferred??targets.filter(t=>lineClear(a,t)).sort((x,y)=>distance(a.position,x.position)-distance(a.position,y.position)||x.entityId.localeCompare(y.entityId))[0];
   if(target&&b.activeAbility!=='shield_bash'){const d=aegisAngleDelta(angle(a.position,target.position),b.shieldAngle);b.shieldAngle=normalized(b.shieldAngle+Math.max(-C.turnSpeed,Math.min(C.turnSpeed,d)));}
   if(b.actionState==='telegraphing'){
    if(b.activeAbility==='magnetic_pull')for(const t of targets){const d=distance(a.position,t.position);if(d<=C.range&&d>14&&lineClear(a,t)){const n=Math.min(2.2,d-14);moveAegisAffectedActor(c,t,{x:(a.position.x-t.position.x)/d*n,y:(a.position.y-t.position.y)/d*n});}}
    if(state.tick>=b.resolvesTick)resolve(b,a,players(a),c);continue;
   }
   if(!target||distance(a.position,target.position)>C.range||!lineClear(a,target))continue;
   const d=distance(a.position,target.position);
   if(state.tick>=b.nextActionTick){
    const ability=choose(b,d);b.abilitySequence++;b.actionState='telegraphing';b.activeAbility=ability;b.targetEntityId=target.entityId;b.targetPosition=copyWire(target.position);b.telegraphStartedTick=state.tick;b.resolvesTick=state.tick+C[ability].telegraphTicks;
    a.movementIntent={x:0,y:0};
    if(ability==='magnetic_pull')stats.pullCasts++;else if(ability==='boomerang_shield')stats.shieldThrows++;else stats.bashCasts++;
   }else if(d<=32&&state.tick>=b.strikeCooldownUntilTick){applyDirectDamage(a,target,a.attackDamage,'aegis_strike');b.strikeCooldownUntilTick=state.tick+50;b.lastAction={ability:'strike',resolvedTick:state.tick,targetPosition:copyWire(target.position),hitEntityIds:[target.entityId]};}
  }observed.clear();
 }
 function reconcile(){for(const b of records()){const a=state.entitiesById[b.entityId];if(!synchronize(b,a))continue;for(const[id,k]of Object.entries(b.knockbacksByEntityId)){const t=state.entitiesById[id];if(!t?.alive||t.residency.spaceInstanceId!==b.spaceInstanceId||t.residency.residencyRevision!==k.residencyRevision||state.tick>=k.expiresTick)delete b.knockbacksByEntityId[id];}}}
 function mitigateIncoming(target,damage,source,attribution){
  const b=record(target.entityId);if(!b)return null;const componentResult=mimics.mitigateIncoming(target,damage,source,attribution);if(componentResult)return componentResult;
  // A projectile's incoming vector is its real contact direction. Area attacks
  // otherwise use their authoritative owner position, like Dungeon's shield.
  const impactAngle=attribution?.projectileDirection?Math.atan2(-attribution.projectileDirection.y,-attribution.projectileDirection.x):source?angle(target.position,source.position):null;
  if(b.phase===2&&b.actionState!=='dazed'&&impactAngle!==null&&Math.abs(aegisAngleDelta(impactAngle,b.shieldAngle))<C.blockHalfAngle){stats.blockedHits++;return {damage:combatInteger(0),shielded:true};}
  return {damage,shielded:false};
 }
 return Object.freeze({advance,reconcile,observeTarget:(a,t)=>{if(record(a.entityId))observed.set(a.entityId,t?.entityId);},owns:id=>Boolean(record(id))||mimics.ownsMimic(id),towerTarget:mimics.towerTarget,frozen:id=>{if(mimics.ownsMimic(id))return mimics.frozen(id);const b=record(id);return b?['telegraphing','dazed','defeated','recalling'].includes(b.actionState):false;},movementMultiplier:id=>{if(mimics.ownsMimic(id))return mimics.frozen(id)?0:1;const b=record(id);return b?((state.tick-b.activatedTick)%30<15?(b.mimicEncounter?.enragedTick!==null&&b.mimicEncounter?2:b.phase===2?1.4:1.7)/1.3:0):1;},mitigateIncoming,inspect:()=>({...stats,mimics:mimics.inspect()})});
}
