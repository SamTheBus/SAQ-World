import {finiteNodeRank,nodeRank} from './participant_progression.js';
import {combatAmount as Q,addCombat as add,multiplyCombat as mul,minCombat} from './combat_amount.js';
import {integerBigInt,INTEGER_MAX_DIGITS,numericExtension} from './integer_domain.js';
const powerCache=new Map();
export function masteryPower(n,d,rank){const key=`${n}/${d}/${typeof rank==='string'?rank:rank.chunks.join('')}`;if(powerCache.has(key))return powerCache.get(key);let e=integerBigInt(rank),a=BigInt(n),b=BigInt(d),x=1n,y=1n,work=0;while(e){if(++work>64)numericExtension('mastery formula cold work');if(e&1n){x*=a;y*=b;}e>>=1n;if(e){a*=a;b*=b;}if([x,y,a,b].some(v=>v.toString().length>INTEGER_MAX_DIGITS*2+32))numericExtension('mastery formula proof');}const value=Q(x,y);if(powerCache.size>=24)powerCache.delete(powerCache.keys().next().value);powerCache.set(key,value);return value;}
const times=(a,b)=>mul(a,b.n,b.d),pct=(v,hundredths)=>mul(v,10000+hundredths,10000);
export function resolveMasteryContribution(player,base,{rawBlock,blockCap,rawParry,parryCap,barrierFraction,rawArea=Q(0),guardChance}){
 const state=player.d8;if(!state)return base;const r=id=>finiteNodeRank(state,id),t=state.transient??{},result={...base,attributes:{...base.attributes},familyProperties:{...base.familyProperties}},f=result.familyProperties;
 const defPercent=300*(r('shield_def')+r('shield_filler_hp_flat'))+400*r('shield_fortified_guard')*(t.fortitudeStacks??0);
 result.defense=times(pct(add(base.defense,5*r('shield_filler_flat_def')),defPercent),masteryPower(51,50,nodeRank(state,'shield_inf_defense')));
 result.maxHp=pct(add(base.maxHp,25*r('shield_filler_flat_def')),400*(r('shield_hp')+r('shield_filler_hp_flat'))+300*r('utility_vitality'));
 let lateInt=times(pct(base.attributes.int,400*r('tome_arcane_syphon')*(t.syphonStacks??0)),masteryPower(51,50,nodeRank(state,'tome_inf_intel')));
 result.lateInt=lateInt; // Formula input: round only the eventual damaging packet.
 result.attack=times(base.attack,masteryPower(51,50,nodeRank(state,'tome_inf_intel')));
 if(r('shield_keystone_reflect'))result.attack=add(result.attack,mul(result.defense,2,5));
 if(r('tome_keystone_singularity'))result.attack=add(result.attack,mul(lateInt,4,5));
 if(t.colossusAttack)result.attack=add(result.attack,t.colossusAttack);
 result.attack=pct(result.attack,400*r('dagger_filler_armor_pen')+350*r('tome_atk')+200*r('tome_filler_spell_crit'));
 const crit=add(base.critChance,Q(15*(r('dagger_crit_chance')+r('tome_filler_spell_crit')),1000));result.critChance=minCombat(1,crit);
 result.critMultiplier=times(add(base.critMultiplier,Q(6*r('dagger_crit_dmg')+3*r('dagger_filler_armor_pen'),100)),masteryPower(51,50,nodeRank(state,'dagger_inf_crit')));
 result.moveSpeed=base.moveSpeed+(4*r('dagger_filler_haste')+2*r('utility_vitality'))*3/100;
 if(t.shadowStepTicks>0){result.moveSpeed*=1+.15*r('dagger_shadow_step');result.activeHaste=add(base.activeHaste,Q(r('dagger_shadow_step'),10));}
 result.blockChance=base.subType==='shield'?guardChance((rawBlock?.n!==undefined?add(rawBlock,10000*r('shield_iron_wall')):rawBlock+10000*r('shield_iron_wall')),blockCap+20000*r('shield_iron_wall'),1000000):Q(0);
 result.parryChance=base.subType==='dagger'?guardChance((rawParry?.n!==undefined?add(rawParry,10000*(r('dagger_parry')+r('dagger_filler_haste'))):rawParry+10000*(r('dagger_parry')+r('dagger_filler_haste'))),Math.max(parryCap+20000*r('dagger_parry'),r('dagger_keystone_duellist')?400000:0),1000000):Q(0);
 const capacity=add(barrierFraction,Q(10*r('tome_runic_barrier')+r('tome_filler_barrier_regen')+50*r('tome_keystone_singularity'),100));result.maxBarrier=base.subType==='tome'?times(result.maxHp,capacity):Q(0);
 f.reflect=r('shield_keystone_reflect')?Q(18,10):f.reflect;f.bashAttack=add(f.bashAttack,Q(15*r('shield_retaliation'),100));f.bashDefense=Q(12*r('shield_retaliation'),100);f.bashMultiplier=times(Q(100+15*r('shield_retaliation'),100),masteryPower(51,50,nodeRank(state,'shield_inf_bash')));
 f.blockMitigation=r('shield_keystone_colossus')?Q(1):minCombat(Q(95,100),Q(70+5*r('shield_stalwart_bastion')+10*r('shield_fortitude'),100));
 f.parryMitigation=r('dagger_keystone_duellist')?Q(1):f.parryMitigation;f.riposte=add(f.riposte,Q(r('dagger_shadow_step'),5));f.bleed=add(f.bleed,Q(r('dagger_vipers_coating'),20));f.offhandDamage=times(f.offhandDamage,Q(100+8*r('dagger_offhand_precision'),100));
 f.toxicMultiplier=masteryPower(51,50,nodeRank(state,'dagger_inf_poison'));
 f.tomeChance=minCombat(Q(base.spellType==='lightning'?60:50,100),add(f.tomeChance,Q(r('tome_empowered_catalysts'),20)));
 f.tomePower=resolveMasterySpellPower({basePower:f.tomePower,catalyst:r('tome_empowered_catalysts'),atk:r('tome_atk'),filler:r('tome_filler_barrier_regen'),infinite:nodeRank(state,'tome_inf_spell'),weaving:r('tome_spell_weaving'),stacks:t.weavingStacks??0});
 const area=add(rawArea,Q(20*r('tome_elemental_overload')+5*r('tome_filler_barrier_regen'),100)),den=add(1,mul(area,65,100));result.areaMultiplier=add(1,mul(mul(area,85,100),den.d,den.n));result.heroXpRate=Q(100+3*r('tome_exp'),100);
 return result;
}

// Shared exact formula for resolved stats and an immutable in-flight recipe.
export function resolveMasterySpellPower(r){return times(times(times(times(add(r.basePower,Q(r.catalyst,4)),Q(1000+35*r.atk,1000)),Q(100+4*r.filler,100)),masteryPower(28,25,r.infinite)),Q(100+15*r.weaving*r.stacks,100));}
