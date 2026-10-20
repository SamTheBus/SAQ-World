import {combatPlayer,combatAttuneCost,combatAttuneSpent} from './world_combat_v1.js';
import {asCombatAmount as A,multiplyCombat as combatMul,combatInteger} from '../contracts/combat_amount.js';
import {progressionWire,progressionBigInt} from '../contracts/progression_integer.js';
import {FORGE_MATERIAL_COSTS} from './forge_material_costs.js';
import {addAmount,multiplyAmount,powerAmount,floorAmount} from '../contracts/economy_amount.js';
import {safeInteger,freezeWire} from '../contracts/wire.js';
// Dungeon items.js:1322–1394. No discounts, floating-point currency or old wallet cap.
export const FORGE_MATERIALS=Object.freeze(['Monster Soul','Rare Scrap','Luminous Soul','Magic Scrap','Epic Scrap','Astral Shards','Legendary Scrap','Mythic Scrap','Eridium Shard',"Overlord's Sigil",'Astral Essence']);
const mul=multiplyAmount,pow=powerAmount;
export function attunementCost(level,player=null){if(combatPlayer(player))return freezeWire(combatAttuneCost(level));safeInteger(level,0,99);const n=level+1;
 const gold=n<=10?mul('2500',pow('1.35',n)):n<=30?mul(mul('2500',pow('1.35',10)),pow('3.55',n-10)):mul(mul('100000',pow('2.25',30)),pow('3',n-30));
 return freezeWire({gold,materials:FORGE_MATERIAL_COSTS[level]});
}
// Static prefix totals keep validation independent of the number of past commands.
const totals=[{gold:'0',materials:{}}];
for(let level=0;level<100;level++){const prev=totals[level],cost=attunementCost(level),materials={...prev.materials};for(const [k,v] of Object.entries(cost.materials))materials[k]=(materials[k]??0)+v;totals.push(freezeWire({gold:addAmount(prev.gold,cost.gold),materials}));}
export const attunementSpent=(level,player=null)=>combatPlayer(player)?combatAttuneSpent(safeInteger(level,0,100)):totals[safeInteger(level,0,100)];
// Dungeon data.js:2280–2320. Base gear bonuses stay in the equipment layer.
// World combat remains integer: ceil matches Dungeon's visible Forge preview.
export function effectiveEquipmentBonuses(definition,slot,level=0,combat=false){safeInteger(level,0,100);const bonus=Object.fromEntries(Object.entries(definition.bonuses).map(([k,v])=>[k,definition.numericVersion?progressionWire(BigInt(combatInteger(combatMul(A(v),100+level,100),'ceil'))):Math.ceil(v*(100+level)/100)]));
 if(definition.numericVersion){const plus=(k,n)=>bonus[k]=progressionWire(progressionBigInt(bonus[k])+BigInt(n));if(slot==='weapon')plus('attack',level*(combat?2:15));if(['chest','leggings','overall'].includes(slot)){plus('maxHp',level*(combat?8:50));plus('defense',level*(combat?2:10));}if(['ring1','ring2'].includes(slot)){plus('attack',level*(combat?2:10));plus('maxHp',level*(combat?6:30));}return bonus;}
 if(slot==='weapon')bonus.attack+=level*(combat?2:15);
 if(['chest','leggings','overall'].includes(slot)){bonus.maxHp+=level*(combat?8:50);bonus.defense+=level*(combat?2:10);}
 if(['ring1','ring2'].includes(slot)){bonus.attack+=level*(combat?2:10);bonus.maxHp+=level*(combat?6:30);}
 return bonus;
}
