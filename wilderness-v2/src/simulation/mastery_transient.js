import {emptyMasteryTransient,finiteNodeRank} from '../shared/contracts/participant_progression.js';
import {combatInteger,addCombat as add,multiplyCombat as mul,minCombat as min,compareCombat as cmp} from '../shared/contracts/combat_amount.js';

export function advanceMasteryTransient(player){const t=player.d8?.transient;if(!t)return false;let changed=false;for(const [timer,fields] of [['fortitudeTicks',['fortitudeStacks']],['colossusTicks',['colossusAttack']],['shadowStepTicks',[]],['syphonTicks',['syphonStacks']],['weavingTicks',['weavingStacks']]]){if(t[timer]>0&&--t[timer]===0){changed=true;for(const f of fields)t[f]=f==='colossusAttack'?'0':0;}}return changed;}
export function resetMasteryTransient(player){if(player?.d8)player.d8.transient=emptyMasteryTransient();}
export function receiveMasteryDefense(player,actor,outcome,stats){if(!player?.d8||!actor.alive)return {changed:false,pulse:false};const t=player.d8.transient,r=id=>finiteNodeRank(player.d8,id);let changed=false,pulse=false;
 if(outcome.defense==='block'){
  if(r('shield_fortified_guard')){t.fortitudeStacks=Math.min(5,t.fortitudeStacks+1);t.fortitudeTicks=360;changed=true;}
  if(r('shield_retaliatory_strike'))t.retaliatoryReady=true;
  if(r('shield_keystone_colossus')&&cmp(outcome.prevented??'0',0)>0){t.colossusAttack=combatInteger(add(t.colossusAttack,combatInteger(mul(outcome.prevented,1,10))));t.colossusTicks=600;changed=true;}
  const rank=r('shield_aegis_pulse');if(rank&&++t.pulseBlocks>=5){t.pulseBlocks=0;actor.hp=combatInteger(min(stats.maxHp,add(actor.hp,combatInteger(mul(stats.maxHp,3*rank,100)))));pulse=true;}
 }
 if(outcome.defense==='parry'&&r('dagger_shadow_step')){t.shadowStepTicks=240;changed=true;}
 return {changed,pulse};
}
