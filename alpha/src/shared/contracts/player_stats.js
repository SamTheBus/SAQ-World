import {resolveMasteryContribution} from './mastery_stats.js';
import {D9_HERO_VERSION} from './hero_progression_d9.js';
import {resolveD9PlayerStats} from './player_stats_d9.js';
import {tomeProfile} from '../content/tome_profiles.js';
import { equipmentBonuses as legacyBonuses } from './player_inventory_d4_legacy.js';
import { equipmentBonuses, BASE_PICKUP_RADIUS } from './player_inventory.js';
import { MAX_PLAYER_LEVEL, validatePlayerProgression } from './player_progression.js';
import { freezeWire, safeInteger } from './wire.js';
import { MAX_BOUNDED_COMBAT_INTEGER } from './combat_integer.js';
import { EQUIPMENT,itemDefinition } from '../content/equipment.js';
import {combatAmount as amount,addCombat as add,multiplyCombat as mul,roundCombat,combatInteger,compareCombat,subtractCombat,asCombatAmount} from './combat_amount.js';

export const PLAYER_STATS_VERSION = 'resolved-player-stats-d4r-v1';
// D2 character base. Dungeon's +15 HP / +3 Attack are retained without exponentiation.
export const PLAYER_BASE_STATS = Object.freeze({maxHp:100,attack:15,defense:0,moveSpeed:3,pickupRadius:BASE_PICKUP_RADIUS});
// One bounded immutable cache, independent of actors, clients and campaign residence.
// D4 equipment joins base and level here. Future mastery/effects extend this boundary.
// Pickup radius is a base stat; D4 adds no upgrade/skill contributor. Exit protection is combat legality.
const levels = Array.from({length:MAX_PLAYER_LEVEL}, (_, index) => freezeWire({
  version:PLAYER_STATS_VERSION,maxHp:PLAYER_BASE_STATS.maxHp+15*index,
  attack:PLAYER_BASE_STATS.attack+3*index,defense:2*index,moveSpeed:PLAYER_BASE_STATS.moveSpeed,pickupRadius:BASE_PICKUP_RADIUS,
}));
export function resolvePlayerStats(player, {legacyMigration=false}={}) {
  validatePlayerProgression(player.progression);
  if(player.progression.version===D9_HERO_VERSION)return freezeResolved(resolveD9PlayerStats(player));
  const base=levels[player.progression.level-1];if(!player.inventory)return base;const bonus=player.inventory.version==='player-inventory-d4-v1'?legacyBonuses(player):equipmentBonuses(player);
  const plus=(a,b)=>b?.n!==undefined?add(a,b):a+b;const resolved={...base,maxHp:plus(base.maxHp,bonus.maxHp),attack:plus(base.attack,bonus.attack),defense:plus(base.defense,bonus.defense),moveSpeed:base.moveSpeed*Math.min(2.5,1+(player.inventory.equipped.boots?(player.inventory.economy?.slotLevels.boots??0)*2:0)/100)};
  const result=player.inventory.subweapons?resolveSubweaponContribution(player,resolved):resolved;
  if(legacyMigration||!player.inventory.subweapons)return freezeWire(result);
  return (player.d8?freezeResolved:freezeWire)({...result,version:'resolved-player-stats-integer-v2',...Object.fromEntries(['attack','defense','maxHp','maxBarrier'].map(k=>[k,combatInteger(result[k])]))});
}
// D6 source data.js:2475–2548. No allocated points or redundant saved stats.
function resolveSubweaponContribution(player,base){
  const inv=player.inventory,definition=itemDefinition(inv.itemsById[inv.equipped.subweapon]),family=definition?.subType??null;
  const scale=100+(inv.economy.slotLevels.subweapon??0),attributes={str:5+(player.d8?.allocated.str??0),dex:5+(player.d8?.allocated.dex??0),int:5+(player.d8?.allocated.int??0)};
  for(const key of Object.keys(attributes))attributes[key]+=(definition?.attributes[key]??0)*scale/100;
  const effects={};for(const [slot,id] of Object.entries(inv.equipped)){const d=itemDefinition(inv.itemsById[id]);if(!d?.effects)continue;const scale=(100+inv.economy.slotLevels[slot])/100;for(const [k,v] of Object.entries(d.effects))effects[k]=(effects[k]??0)+v*scale;if(slot!=='subweapon')for(const key of Object.keys(attributes))attributes[key]+=(d.attributes?.[key]??0)*scale;}
  for(const key of Object.keys(attributes))attributes[key]=Math.floor(attributes[key]*(1+(effects[key+'Pct']??0)));
  const str=Math.max(0,attributes.str-5),dex=Math.max(0,attributes.dex-5),int=Math.max(0,attributes.int-5);
  const q=n=>amount(Math.round(n*1000000),1000000),f=definition?.family??{},pct=(v,k)=>mul(v,q(1+(effects[k]??0)).n,q(1+(effects[k]??0)).d);
  const gear=key=>amount((definition?.bonuses[key]??0)*scale,100);
  const flatAttack=add(add(add(base.attack,gear('attack')),amount(str*5,2)),dex);
  const attack=mul(flatAttack,1000000+Math.round((effects.atkPct??0)*1000000)+(family==='dagger'?dex:family==='tome'?int:str)*1000,1000000);
  // Source actor Max HP explicitly rounds. Increasing capacity never heals here.
  const maxHp=roundCombat(mul(add(add(base.maxHp,gear('maxHp')),str*10),1000000+Math.round((effects.maxHpPct??0)*1000000)+str*1000,1000000));
  const defense=pct(add(add(base.defense,gear('defense')),amount(int,5)),'defPct');
  const tome=tomeProfile(definition?.spellType??'fire',definition?.rarityTier??0);
  const barrierPct=add(tome.barrier,amount(15*int,100*(int+150)));
  const maxBarrier=family==='tome'?roundCombat(mul(maxHp,barrierPct.n,barrierPct.d)):amount(0);
  const result={...base,version:'resolved-player-stats-d6-v1',attack,maxHp,defense,attributes,subType:family,spellType:definition?.spellType??null,
    critChance:q(Math.min(1,.05+(effects.critChance??0))),critMultiplier:add(amount(15000+dex,10000),q((effects.critDamage??0)+Math.max(0,.05+(effects.critChance??0)-1)*2)),activeHaste:q(effects.activeSpeed??0),moveSpeed:3*Math.min(2.5,(1+((inv.equipped.boots?(inv.economy.slotLevels.boots??0)*2:0)+(effects.moveSpeed??0))/100)*(1+(effects.moveSpeedPct??0))),
    familyProperties:{reflect:q(f.reflectDamage??1),bashAttack:q(f.bashAtkBonus??0),riposte:q(f.riposteDamage??.8),parryMitigation:q(f.parryMitigation??.6),bleed:q(f.bleedChance??.15),offhand:q(f.offhandChance??.5),offhandDamage:q(f.offhandDmg??.45),fireChance:amount(f.fireChanceNumerator??1,f.fireChanceDenominator??3),firePower:amount(f.firePowerNumerator??18,10),tomeChance:tome.chance,tomePower:tome.power},
    blockChance:family==='shield'?guardChance(Math.round(((effects.block??0)+(definition?.family?0:.15))*1000000)+str*1000,Math.round((.4+(f.blockCapBonus??.02))*1000000),1000000):amount(0),
    parryChance:family==='dagger'?guardChance(Math.round(((effects.parry??0)+(definition?.family?0:.12))*1000000)+dex*1000,Math.round(((f.subArchetype==='main_gauche'?.45:.35)+(f.parryCapBonus??.02))*1000000),1000000):amount(0),maxBarrier};
  return resolveMasteryContribution(player,result,{rawBlock:Math.round(((effects.block??0)+(definition?.family?0:.15))*1000000)+str*1000,blockCap:Math.round((.4+(f.blockCapBonus??.02))*1000000),rawParry:Math.round(((effects.parry??0)+(definition?.family?0:.12))*1000000)+dex*1000,parryCap:Math.round(((f.subArchetype==='main_gauche'?.45:.35)+(f.parryCapBonus??.02))*1000000),barrierFraction:barrierPct,rawArea:q(effects.bonusAreaRadius??0),guardChance});
}
// Derived formula coefficients are local, not persisted resource state. Preserve
// exact rational intermediates; only published combat quantities are integers.
function freezeResolved(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const child of Object.values(value))freezeResolved(child);Object.freeze(value);}return value;}

function guardChance(raw,cap,unit=1000){const half=cap/2;if(raw<=half)return amount(raw,unit);return add(amount(half,unit),amount(BigInt(cap-half)*BigInt(raw-half),BigInt(unit)*BigInt(raw-half+cap-half)));}
// Active source caps Defense reduction at 85%. Full Barrier absorption is handled
// before this function; zero remaining damage stays zero.
export function mitigateFractionalPlayerDamage(raw,defense){raw=asCombatAmount(raw);defense=asCombatAmount(defense);if(compareCombat(raw,0)===0)return raw;
  const ratio=amount(20n*BigInt(defense.d),20n*BigInt(defense.d)+BigInt(defense.n));
  const bounded=compareCombat(ratio,amount(15,100))<0?amount(15,100):ratio;
  const result=mul(raw,bounded.n,bounded.d);return compareCombat(result,1)<0?amount(1):result;
}
// Dungeon's diminishing-return principle with a fixed depth-1 constant (20).
// Floor is explicit; bounded integer numerator <= 20 billion is exactly safe.
export function mitigatePlayerDamage(rawDamage, defense) {
  safeInteger(rawDamage, 0, MAX_BOUNDED_COMBAT_INTEGER);
  safeInteger(defense, 0, 2*(MAX_PLAYER_LEVEL-1)+2028);
  return rawDamage === 0 ? 0 : Math.max(1, Math.floor(rawDamage*20/(20+defense)));
}
