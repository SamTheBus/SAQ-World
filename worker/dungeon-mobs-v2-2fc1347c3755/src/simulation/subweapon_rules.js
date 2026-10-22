import {integerBigInt} from '../shared/contracts/integer_domain.js';
import {reconcileGuard,advanceGuard,guardsSource,lowerShield,spendGuard} from '../shared/contracts/shield_guard.js';
import {combatAmount as Q,addCombat as add,subtractCombat as sub,multiplyCombat as mul,minCombat as min,compareCombat as cmp,roundCombat,combatInteger,outgoingCombat} from '../shared/contracts/combat_amount.js';
import {resolvePlayerStats,mitigateFractionalPlayerDamage} from '../shared/contracts/player_stats.js';
import {nextUint32} from '../shared/contracts/rng.js';
import {copyWire} from '../shared/contracts/wire.js';
import {collidesWithTiles} from '../shared/rules/world_geometry.js';

// Core mechanics consume participant-owned state and explicit effects. No global
// player, renderer RNG, reward calculation, or mastery side effects live here.
export function combatRoll(combat,chance){const draw=nextUint32(combat.rng);combat.rng=copyWire(draw.state);return BigInt(draw.value)*BigInt(chance.d)<BigInt(chance.n)*4294967296n;}
export const clearHullGap=(a,b)=>Math.max(0,Math.hypot(a.position.x-b.position.x,a.position.y-b.position.y)-a.hullRadius-b.hullRadius);
export function subweaponLineClear(collision,a,b){
  const dx=b.position.x-a.position.x,dy=b.position.y-a.position.y,d=Math.hypot(dx,dy);if(!d)return true;
  const from=a.hullRadius+4,to=Math.max(from,d-b.hullRadius-4);
  for(let t=from;t<=to;t+=4)if(collidesWithTiles(collision,a.position.x+dx*t/d,a.position.y+dy*t/d,4))return false;
  return !collidesWithTiles(collision,a.position.x+dx*to/d,a.position.y+dy*to/d,4);
}
export function canShadowDash(actor,combat,stats,suppressed=false){return !suppressed&&actor.alive&&stats.subType==='dagger'&&combat.dash.frames===0&&combat.dash.cooldown===0;}
export function beginShadowDash(actor,combat,stats,aim,suppressed=false){if(!canShadowDash(actor,combat,stats,suppressed))return false;
  const intent=actor.movementIntent,direction=Math.hypot(intent.x,intent.y)>.01?intent:aim,length=Math.hypot(direction.x,direction.y);if(!length)return false;
  Object.assign(combat.dash,{frames:8,cooldown:90,remaining:64,x:direction.x/length,y:direction.y/length});return true;
}
export function advanceShadowDash(actor,combat,stats,collision,suppressed=false){const dash=combat.dash;
  if(stats.subType!=='dagger'){Object.assign(dash,{frames:0,cooldown:0,remaining:0});return false;}
  if(!actor.alive){dash.frames=0;dash.remaining=0;return false;}
  if(dash.cooldown>0)dash.cooldown--;if(suppressed){dash.frames=0;dash.remaining=0;return false;}if(!dash.frames)return false;
  const distance=Math.min(8,dash.remaining),x=actor.position.x,y=actor.position.y;
  const blocked=f=>collidesWithTiles(collision,x+dash.x*distance*f,y+dash.y*distance*f,actor.hullRadius);
  let fraction=1;if(blocked(1)){let lo=0,hi=1;for(let i=0;i<10;i++){const mid=(lo+hi)/2;if(blocked(mid))hi=mid;else lo=mid;}fraction=lo;}
  actor.position={x:x+dash.x*distance*fraction,y:y+dash.y*distance*fraction};actor.movedLastTick=fraction>0;
  dash.remaining=Math.max(0,dash.remaining-distance*fraction);dash.frames--;
  if(fraction<.999||dash.remaining<=.001||!dash.frames){dash.frames=0;dash.remaining=0;}return true;
}
export function reconcileSubweapon(actor,combat,stats){
  reconcileGuard(combat.guard,actor,stats);
  if(cmp(combat.barrier,stats.maxBarrier)>0)combat.barrier=copyWire(stats.maxBarrier);
  if(cmp(combat.barrier,stats.maxBarrier)===0)combat.barrierRechargeRemainder=0;
  if(stats.subType!=='shield')combat.pressure=0;
  if(stats.subType!=='dagger')Object.assign(combat.dash,{frames:0,cooldown:0,remaining:0});
  if(!actor.alive){combat.barrier='0';combat.barrierRechargeRemainder=0;combat.pressure=0;combat.dash.frames=0;combat.dash.remaining=0;}
}
export function advanceSubweaponTimers(actor,combat,stats,{suppressed=false}={}){if(suppressed)lowerShield(combat.guard);advanceGuard(combat.guard,actor,stats);if(!stats.subType&&!combat.fatigue&&!combat.counterCooldown)return;reconcileSubweapon(actor,combat,stats);if(!actor.alive)return;
  if(combat.fatigue>0)combat.fatigue--;if(combat.counterCooldown>0)combat.counterCooldown--;
  // Source active fallback: ten percent per second, with no assigned hit delay.
  if(!suppressed&&stats.subType==='tome'&&cmp(combat.barrier,stats.maxBarrier)<0){const accrued=BigInt(combat.barrierRechargeRemainder)+integerBigInt(stats.maxBarrier);combat.barrier=combatInteger(min(stats.maxBarrier,add(combat.barrier,Q(accrued/600n))));combat.barrierRechargeRemainder=cmp(combat.barrier,stats.maxBarrier)===0?0:Number(accrued%600n);}
}
// Explicit World adaptation: the user authorizes Crit for every damage packet,
// including each periodic tick. Capture uncritical bases; roll once at delivery.
// Absorption is a defensive outcome and never enters this damage function.
export function criticalDamagePacket(combat,stats,base,mechanic,forced=false){const critical=combatRoll(combat,stats.critChance)||forced;return {damage:outgoingCombat(critical?mul(base,stats.critMultiplier.n,stats.critMultiplier.d):base),critical,mechanic};}
export const mainAttackPacket=(combat,stats)=>criticalDamagePacket(combat,stats,stats.attack,'main');
export const shieldPacket=stats=>{const f=stats.familyProperties,defense=add(f?.reflect??Q(1),f?.bashDefense??Q(0)),base=add(mul(stats.defense,defense.n,defense.d),mul(stats.attack,f?.bashAttack?.n??0,f?.bashAttack?.d??1)),scale=f?.bashMultiplier??Q(1);return mul(base,scale.n,scale.d);};
export function successfulSubweaponHit({combat,stats,target,damage,bleed,fire,offhand=()=>{},suppressed=false}){if(suppressed)return {proactive:false};
  // Guard Pressure is spent by the Bash itself. A lethal main hit leaves the
  // stored readiness intact because there is no surviving target to Bash.
  if(stats.subType==='shield'&&combat.pressure===3&&target.alive){damage(shieldPacket(stats),'bash');combat.pressure=0;}
  let proactive=false;
  if(stats.subType==='dagger'){
    if(combatRoll(combat,stats.familyProperties?.bleed??Q(15,100))&&target.alive){bleed(stats.attack);proactive=true;}
    if(combatRoll(combat,stats.familyProperties?.offhand??Q(1,2))&&target.alive){proactive=true;damage(mul(stats.attack,stats.familyProperties?.offhandDamage?.n??45,stats.familyProperties?.offhandDamage?.d??100),'offhand');offhand();if(combatRoll(combat,stats.familyProperties?.bleed??Q(15,100))&&target.alive){bleed(stats.attack);proactive=true;}}
  }
  return {proactive};
}
export function incomingSubweaponHit({combat,stats,raw,boss=false,actor=null,source=null,suppressed=false}){if(suppressed)return {damage:combatInteger(mitigateFractionalPlayerDamage(raw,stats.defense)),absorbed:'0',defense:null,counter:null,suppressed:true};
  const absorbed=combatInteger(min(combat.barrier,raw));combat.barrier=combatInteger(sub(combat.barrier,absorbed));raw=sub(raw,absorbed);
  if(cmp(raw,0)===0)return {damage:'0',absorbed,defense:'barrier',counter:null};
  const net=mitigateFractionalPlayerDamage(raw,stats.defense),family=stats.subType;
  const chance=family==='shield'?stats.blockChance:family==='dagger'?stats.parryChance:Q(0);
  const activeGuard=family==='shield'&&guardsSource(combat.guard,actor,source);
  const guarded=activeGuard||cmp(chance,0)>0&&combatRoll(combat,mul(chance,(boss?65:100)*(combat.fatigue?50:100),10000));
  if(!guarded)return {damage:combatInteger(net),absorbed,defense:null,counter:null};
  if(activeGuard)spendGuard(combat.guard,net);
  combat.fatigue=30;if(family==='shield')combat.pressure=Math.min(3,combat.pressure+1);
  const riposte=family!=='shield'||combatRoll(combat,Q(1,4));
  const mitigation=mul(family==='shield'?(stats.familyProperties?.blockMitigation??Q(7,10)):stats.familyProperties?.parryMitigation??Q(3,5),boss?65:100,100);
  const damage=combatInteger(mul(net,sub(1,mitigation).n,sub(1,mitigation).d));
  const masteryCounterEligible=!boss||combat.counterCooldown===0;
  const counter=riposte&&(!boss||combat.counterCooldown===0)?{damage:family==='shield'?shieldPacket(stats):mul(stats.attack,stats.familyProperties?.riposte?.n??80,stats.familyProperties?.riposte?.d??100),mechanic:family==='shield'?'bash':'riposte'}:null;
  if(counter&&boss)combat.counterCooldown=60;
  return {damage,absorbed,prevented:sub(net,damage),masteryCounterEligible,defense:family==='shield'?'block':'parry',counter};
}
