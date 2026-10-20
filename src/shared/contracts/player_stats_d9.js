import {resonanceEffects} from '../content/workshop_gear_v2.js';
import {d9LevelStats} from './hero_progression_d9.js';
import {equipmentBonuses,itemDefinition} from '../content/equipment.js';
import {exactDecimal} from '../content/gear_numbers_d9.js';
import {resolveMasteryContribution} from './mastery_stats.js';
import {tomeProfile} from '../content/tome_profiles.js';
import {combatAmount as Q,asCombatAmount as A,addCombat as add,multiplyCombat as mul,subtractCombat as sub,roundCombat as round,minCombat as min,maxCombat as max,combatInteger,compareCombat as cmp,presentCombat} from './combat_amount.js';
import {progressionBigInt as big} from './progression_integer.js';
import {BASE_PICKUP_RADIUS} from './player_inventory.js';
const times=(a,b)=>{b=A(b);return mul(a,b.n,b.d);};
export function guardChanceExact(raw,cap,unit=1000){raw=A(raw);const half=Q(cap,2);if(cmp(raw,half)<=0)return mul(raw,1,unit);const delta=sub(raw,half),den=add(delta,half);return add(mul(half,1,unit),mul(times(half,delta),den.d,BigInt(den.n)*BigInt(unit)));}
export function resolveD9PlayerStats(player){
 const inv=player.inventory,level=d9LevelStats(player.progression.level),bonus=equipmentBonuses(player),base={version:'resolved-player-stats-integer-v2',maxHp:add(level.maxHp,bonus.maxHp),attack:add(level.attack,bonus.attack),defense:add(level.defense,bonus.defense),moveSpeed:3,pickupRadius:BASE_PICKUP_RADIUS};
 if(!inv?.subweapons)return {...base,...Object.fromEntries(['maxHp','attack','defense'].map(k=>[k,combatInteger(base[k])]))};
 const definition=itemDefinition(inv.itemsById[inv.equipped.subweapon]),family=definition?.subType??null,scale=100+(inv.economy.slotLevels.subweapon??0),attributes=Object.fromEntries(['str','dex','int'].map(k=>[k,add(5,Q(big(player.d8?.allocated[k]??0)))])),effects=Object.fromEntries(Object.entries(resonanceEffects(inv)).map(([k,v])=>[k,exactDecimal(v)]));
 for(const [slot,id] of Object.entries(inv.equipped)){const d=itemDefinition(inv.itemsById[id]);if(!d)continue;const scale=100+(inv.economy.slotLevels[slot]??0);for(const [k,v] of Object.entries(d.effects??{}))effects[k]=add(effects[k]??0,mul(exactDecimal(v),scale,100));for(const k of ['str','dex','int'])attributes[k]=add(attributes[k],mul(exactDecimal(d.attributes?.[k]??0),scale,100));}
 const effect=k=>effects[k]??Q(0),quantize=v=>mul(round(mul(v,1000000)),1,1000000),pct=(v,k)=>times(v,quantize(add(1,effect(k))));
 for(const k of ['str','dex','int'])attributes[k]=combatInteger(round(times(attributes[k],add(1,effect(k+'Pct'))),'floor'));
 const str=sub(max(attributes.str,5),5),dex=sub(max(attributes.dex,5),5),intel=sub(max(attributes.int,5),5),f=definition?.family??{};
 const gear=k=>mul(exactDecimal(definition?.bonuses[k]??0),scale,100);
 const flatAttack=add(add(add(base.attack,gear('attack')),mul(str,5,2)),dex);
 const attack=times(flatAttack,add(quantize(add(1,effect('atkPct'))),mul(family==='dagger'?dex:family==='tome'?intel:str,1,1000)));
 const maxHp=round(times(add(add(base.maxHp,gear('maxHp')),mul(str,10)),add(quantize(add(1,effect('maxHpPct'))),mul(str,1,1000))));
 const defense=pct(add(add(base.defense,gear('defense')),mul(intel,1,5)),'defPct'),tome=tomeProfile(definition?.spellType??'fire',definition?.rarityTier??0),den=add(intel,150),barrier=add(tome.barrier,mul(intel,15n*BigInt(den.d),100n*BigInt(den.n)));
 const chance=add(Q(5,100),effect('critChance')),overflow=cmp(chance,1)>0?sub(chance,1):Q(0);
 const rawBlock=add(round(mul(add(effect('block'),exactDecimal(definition?.family?0:.15)),1000000)),mul(str,1000)),rawParry=add(round(mul(add(effect('parry'),exactDecimal(definition?.family?0:.12)),1000000)),mul(dex,1000));
 const blockCap=Math.round((.4+(f.blockCapBonus??.02))*1000000),parryCap=Math.round(((f.subArchetype==='main_gauche'?.45:.35)+(f.parryCapBonus??.02))*1000000);
 const boots=inv.equipped.boots?(inv.economy.slotLevels.boots??0)*2:0;
 const speed=mul(min(Q(5,2),times(add(1,mul(add(boots,effect('moveSpeed')),1,100)),add(1,effect('moveSpeedPct')))),3);
 const result={...base,attack,maxHp,defense,attributes,subType:family,spellType:definition?.spellType??null,critChance:quantize(min(1,chance)),critMultiplier:add(add(Q(3,2),mul(dex,1,10000)),quantize(add(effect('critDamage'),mul(overflow,2)))),activeHaste:quantize(effect('activeSpeed')),moveSpeed:presentCombat(speed),
 familyProperties:{reflect:quantize(exactDecimal(f.reflectDamage??1)),bashAttack:quantize(exactDecimal(f.bashAtkBonus??0)),riposte:quantize(exactDecimal(f.riposteDamage??.8)),parryMitigation:quantize(exactDecimal(f.parryMitigation??.6)),bleed:quantize(exactDecimal(f.bleedChance??.15)),offhand:quantize(exactDecimal(f.offhandChance??.5)),offhandDamage:quantize(exactDecimal(f.offhandDmg??.45)),fireChance:Q(f.fireChanceNumerator??1,f.fireChanceDenominator??3),firePower:Q(f.firePowerNumerator??18,10),tomeChance:tome.chance,tomePower:tome.power},
 blockChance:family==='shield'?guardChanceExact(rawBlock,blockCap,1000000):Q(0),parryChance:family==='dagger'?guardChanceExact(rawParry,parryCap,1000000):Q(0),maxBarrier:family==='tome'?round(times(maxHp,barrier)):Q(0)};
 const resolved=resolveMasteryContribution(player,result,{rawBlock,rawParry,blockCap,parryCap,barrierFraction:barrier,rawArea:quantize(effect('bonusAreaRadius')),guardChance:guardChanceExact});
 return {...resolved,...Object.fromEntries(['attack','defense','maxHp','maxBarrier'].map(k=>[k,combatInteger(resolved[k])]))};
}
