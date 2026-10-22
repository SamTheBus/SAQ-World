import {combatInteger,compareCombat,minCombat,maxCombat,multiplyCombat} from './combat_amount.js';
import {resolvePlayerStats} from './player_stats.js';
import {requireContract} from './wire.js';
export const INTEGER_COMBAT_STATE='subweapon-combat-integer-v2';
// Called on a private copy after legacy validation; never emits gameplay events.
export function migrateIntegerCombat(s){const c=s.subweaponCombat;if(c.version===INTEGER_COMBAT_STATE)return s;
 requireContract(c.version==='subweapon-combat-d6-v3','Explicit combat migration rule required');
 for(const a of Object.values(s.entitiesById)){a.maxHp=combatInteger(a.maxHp);a.attackDamage=combatInteger(a.attackDamage);a.hp=combatInteger(compareCombat(a.hp,0)>0?maxCombat(1,combatInteger(a.hp,'floor')):0);}
 for(const p of Object.values(s.playersById)){const a=s.entitiesById[p.entityId],stats=resolvePlayerStats(p),v=c.actors[p.entityId];a.maxHp=stats.maxHp;a.attackDamage=stats.attack;v.barrier=combatInteger(minCombat(combatInteger(v.barrier,'floor'),stats.maxBarrier));v.barrierRechargeRemainder=0;v.guard.integrity=combatInteger(minCombat(combatInteger(v.guard.integrity,'floor'),32));v.guard.guardRechargeRemainder=0;if(v.guard.integrity==='0'&&v.guard.raised){v.guard.raised=false;v.guard.requested=false;v.guard.mustRelease=true;}}
 for(const a of Object.values(s.entitiesById))a.hp=combatInteger(minCombat(a.hp,a.maxHp));
 for(const p of Object.values(c.projectiles)){p.attack=combatInteger(p.attack);p.rulesVersion='combat-integer-v2';}
 for(const e of Object.values(c.effects)){requireContract(e.kind==='bleed'||e.kind==='burn','Explicit effect migration rule required');e.attack=combatInteger(multiplyCombat(e.damage,100,e.kind==='bleed'?5:15));delete e.damage;e.rulesVersion='combat-integer-v2';}
 c.version=INTEGER_COMBAT_STATE;return s;
}
