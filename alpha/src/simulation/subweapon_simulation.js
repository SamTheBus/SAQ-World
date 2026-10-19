import {nodeRank} from '../shared/contracts/participant_progression.js';
import {createMasteryEffects,periodicPacket} from './mastery_effects.js';
import {captureTomeRecipe,capturedTomePower,commitTomeAnchor,synchronizeTomeRotation} from '../shared/contracts/tome_cast.js';
import {settleTomeSustain} from './tome_sustain.js';
import {advanceMasteryTransient,resetMasteryTransient} from './mastery_transient.js';
import {lightningHop,applyFrostControl,expireFrost} from './tome_element_rules.js';
import {damageSourceItem} from '../shared/contracts/combat_attribution.js';
import {combatAmount as Q} from '../shared/contracts/combat_amount.js';
import {resolvePlayerStats} from '../shared/contracts/player_stats.js';
import {copyWire} from '../shared/contracts/wire.js';
import {multiplyCombat as mul} from '../shared/contracts/combat_amount.js';
import {collidesWithTiles} from '../shared/rules/world_geometry.js';
import {combatRoll,successfulSubweaponHit,subweaponLineClear,advanceSubweaponTimers,reconcileSubweapon} from './subweapon_rules.js';
import {cancelSubweaponResidency} from '../shared/contracts/subweapon_combat.js';
import {subweaponSuppressedD12_4I} from '../shared/contracts/elite_combat_d12_4.js';

export const FIRE_TOME_PROC_CHANCE=Object.freeze(Q(1,3));
export function createSubweaponSimulation(s,{damage,eligible,identity,getStats,mastery,refreshStats}){
 const c=s.subweaponCombat,players=new Map(Object.values(s.playersById).map(p=>[p.entityId,p]));
 const stats=id=>getStats?getStats(id):resolvePlayerStats(players.get(id));
 const effects=createMasteryEffects(s,{damage,eligible,identity,getStats:stats,awards:mastery,bleed:(a,t,captured)=>periodic(a,t,'bleed',captured.attack,captured)});
 function periodic(source,target,kind,attack,captured){if(!target.alive)return;const id=`${source.entityId}/${target.entityId}/${kind}`,old=c.effects[id];
   c.effects[id]={id,sourceId:source.entityId,targetId:target.entityId,spaceInstanceId:source.residency.spaceInstanceId,kind,...(kind==='bleed'&&players.get(source.entityId)?.d8?{toxicRank:copyWire(nodeRank(players.get(source.entityId).d8,'dagger_inf_poison'))}:{}),stacks:kind==='bleed'?Math.min(5,(old?.stacks??0)+1):1,
    nextTick:old?.nextTick??s.tick+60,expiresTick:s.tick+(kind==='bleed'?600:240),sourceItem:copyWire(captured.sourceItem??damageSourceItem(players.get(source.entityId),kind)),attack:copyWire(attack),rulesVersion:'combat-integer-v2'};
 }
 const suppressed=id=>subweaponSuppressedD12_4I(s,id);
 function successful(source,target,captured){const outcome=successfulSubweaponHit({combat:c.actors[source.entityId],stats:captured,target,
  damage:(raw,kind)=>damage(source,target,raw,kind,null,{sourceItem:damageSourceItem(players.get(source.entityId),kind),trigger:kind==='bash'?'pressure':null}),
  bleed:attack=>periodic(source,target,'bleed',attack,captured),offhand:()=>effects.offhand(source,target,captured),
  });if(outcome.proactive)mastery?.primary(source,target,'proactive');
 }
 function hit(source,target,captured,commandId=s.primary.actorsById[source.entityId].current?.commandId??null){const result=damage(source,target,captured.attack,'main',commandId);if(!suppressed(source.entityId)){effects.main(source,target,result?.critical===true);successful(source,target,captured);}}
 function main(source,target){hit(source,target,stats(source.entityId));}
 function proc(source,target){if(suppressed(source.entityId))return false;const captured=stats(source.entityId);if(captured.subType!=='tome'||!combatRoll(c.actors[source.entityId],captured.familyProperties?.tomeChance??captured.familyProperties?.fireChance??FIRE_TOME_PROC_CHANCE))return false;
  const dx=target.position.x-source.position.x,dy=target.position.y-source.position.y,d=Math.hypot(dx,dy);if(!d)return false;
  const owner=players.get(source.entityId),recipe=owner.d8?captureTomeRecipe(owner,effects.area(source)):null,anchor=recipe?commitTomeAnchor(owner,recipe):captured.spellType??'fire';
  mastery?.primary(source,target,'proc');settleTomeSustain(owner,source,c.actors[source.entityId],captured);refreshStats?.(owner);
  const id=identity('act');c.actors[source.entityId].delivery={status:'launched',tick:s.tick};c.projectiles[id]={id,intendedTargetId:target.entityId,sourceId:source.entityId,spaceInstanceId:source.residency.spaceInstanceId,residencyRevision:source.residency.residencyRevision,position:{...source.position},direction:{x:dx/d,y:dy/d},remaining:128+source.hullRadius,frames:20,
   delivery:anchor,...(recipe?{tomeRecipe:recipe}:{firePower:copyWire(captured.familyProperties?.tomePower??captured.familyProperties?.firePower??Q(18,10))}),sourceItem:damageSourceItem(players.get(source.entityId),captured.spellType??'fire'),attack:copyWire(captured.attack),rulesVersion:'combat-integer-v2',commandId:s.primary.actorsById[source.entityId].current?.commandId??null};return true;
 }
 function elementImpact(source,target,b,element=b.delivery??'fire'){const coefficient=b.tomeRecipe?capturedTomePower(b.tomeRecipe):b.firePower??Q(18,10),raw=mul(b.attack,coefficient.n,coefficient.d),overload=b.tomeRecipe?.overload??0,A=b.tomeRecipe?.areaScale??1,origin={position:{...target.position},hullRadius:target.hullRadius};
  const neighbors=overload&&element!=='lightning'?effects.nearby(source,origin,80*A*(1+.2*overload)).filter(t=>t.entityId!==target.entityId):[];
  const hops=[];if(element==='lightning'){let previous=target;const seen=new Set([target.entityId]);for(let n=0;n<1+overload;n++){const next=Object.values(s.entitiesById).filter(t=>!seen.has(t.entityId)&&eligible(source,t)&&Math.hypot(t.position.x-previous.position.x,t.position.y-previous.position.y)<=120*(overload?A:1)&&subweaponLineClear(s.spacesByInstanceId[source.residency.spaceInstanceId].collision,previous,t)).sort((a,b)=>Math.hypot(a.position.x-previous.position.x,a.position.y-previous.position.y)-Math.hypot(b.position.x-previous.position.x,b.position.y-previous.position.y)||a.entityId.localeCompare(b.entityId))[0];if(!next)break;hops.push({target:next,from:{entityId:previous.entityId,position:{...previous.position}}});seen.add(next.entityId);previous=next;}}
  damage(source,target,raw,element,b.commandId,{sourceItem:b.sourceItem,trigger:'proc'});
  if(element==='fire'){if(eligible(source,target))periodic(source,target,'burn',b.attack,{sourceItem:b.sourceItem});for(const t of neighbors){damage(source,t,mul(raw,35*overload,100),'fire',b.commandId,{sourceItem:b.sourceItem,trigger:'mastery'});if(eligible(source,t))periodic(source,t,'burn',b.attack,{sourceItem:b.sourceItem});}}
  if(element==='lightning')for(const hop of hops)damage(source,hop.target,raw,'lightning',b.commandId,{sourceItem:b.sourceItem,trigger:'proc',chainFrom:hop.from});
  if(element==='frost'){if(eligible(source,target))applyFrostControl(s,source,target,stats(source.entityId));for(const t of neighbors)effects.status(source,t,'slow',overload,240);}
 }

 function step(){
  expireFrost(s);effects.step();
  for(const [id,p] of players){const a=s.entitiesById[id];if(!a.alive)resetMasteryTransient(p);else if(advanceMasteryTransient(p))refreshStats?.(p);advanceSubweaponTimers(a,c.actors[id],stats(id),{suppressed:suppressed(id)});if(!a.alive)cancelSubweaponResidency(s,id);}
  for(const [id,b] of Object.entries(c.projectiles)){const source=s.entitiesById[b.sourceId];
   if(!source.alive||source.residency.spaceInstanceId!==b.spaceInstanceId||source.residency.residencyRevision!==b.residencyRevision){delete c.projectiles[id];continue;}
   const step=Math.min(8,b.remaining);b.position.x+=b.direction.x*step;b.position.y+=b.direction.y*step;b.remaining-=step;b.frames--;
   if(collidesWithTiles(s.spacesByInstanceId[b.spaceInstanceId].collision,b.position.x,b.position.y,4)){c.actors[source.entityId].delivery={status:'blocked',tick:s.tick};delete c.projectiles[id];continue;}
   const target=Object.values(s.entitiesById).filter(t=>eligible(source,t)&&Math.hypot(t.position.x-b.position.x,t.position.y-b.position.y)<=4+t.hullRadius).sort((a,b)=>a.entityId.localeCompare(b.entityId))[0];
   if(target){c.actors[source.entityId].delivery={status:target.entityId===b.intendedTargetId?'impact':'intercepted',tick:s.tick};for(const element of b.tomeRecipe?.triad?['fire','lightning','frost']:[b.delivery??'fire'])elementImpact(source,target,b,element);delete c.projectiles[id];}
   else if(b.remaining<=0||b.frames<=0){c.actors[source.entityId].delivery={status:'expired',tick:s.tick};delete c.projectiles[id];}
  }
  for(const [id,e] of Object.entries(c.effects)){const source=s.entitiesById[e.sourceId],target=s.entitiesById[e.targetId];
   if(!source.alive||!target.alive||source.residency.spaceInstanceId!==e.spaceInstanceId||target.residency.spaceInstanceId!==e.spaceInstanceId){delete c.effects[id];continue;}
   if(s.tick>=e.nextTick){if(eligible(source,target))damage(source,target,periodicPacket(e),e.kind,null,{sourceItem:e.sourceItem??null,trigger:'periodic'});e.nextTick+=60;}
   if(!target.alive||s.tick>=e.expiresTick)delete c.effects[id];
  }
 }
 function enforceSuppression(){for(const [id] of players)if(suppressed(id)){const combat=c.actors[id];lowerSuppressed(combat);}}
 function lowerSuppressed(combat){combat.guard.raised=false;combat.guard.requested=false;combat.dash.frames=0;combat.dash.remaining=0;}
 return {main,proc,step,effects,enforceSuppression,reconcile:id=>{synchronizeTomeRotation(players.get(id));reconcileSubweapon(s.entitiesById[id],c.actors[id],stats(id));}};
}
