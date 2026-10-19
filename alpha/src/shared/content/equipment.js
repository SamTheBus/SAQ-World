import {combatAmount as Q,addCombat as add,multiplyCombat as mul,asCombatAmount as A} from '../contracts/combat_amount.js';
import {SUBWEAPONS} from './subweapons.js';
import {effectiveEquipmentBonuses} from './forge.js';
import { freezeWire, requireContract } from '../contracts/wire.js';

export const itemDefinition=item=>item?.generated?.definition??EQUIPMENT[item?.definitionId];
export const EQUIPMENT_CATALOG_VERSION='world-equipment-d4r-v1';
export const EQUIPMENT_SLOTS=Object.freeze(['weapon','helmet','chest','leggings','overall','boots','ring1','ring2']);
// Fixed definitions, separate from owned instances. Site tier selects a reward pool;
// neither site archetype nor participant level becomes an item identity.
export const EQUIPMENT=freezeWire({...SUBWEAPON_CATALOG(),...Object.fromEntries([
  ['worn-sword','Worn Sword','weapon',0,0,0,'worn'],
  ['iron-sword','Iron Sword','weapon',3,0,0,'iron'],
  ['guard-sword','Guard Sword','weapon',6,0,0,'guard'],
  ['runic-sword','Runic Sword','weapon',9,0,0,'runic'],
  ['padded-armor','Padded Armor','chest',0,20,1,null],
  ['chain-armor','Chain Armor','chest',0,35,3,null],
  ['plate-armor','Plate Armor','chest',0,50,5,null],
  ['copper-charm','Copper Ring','ring',1,0,1,null],
  ['silver-charm','Silver Ring','ring',2,0,2,null],
  ['coif','Coif','helmet',0,8,1,null],
  ['greaves','Greaves','leggings',0,12,1,null],
  ['sabatons','Sabatons','boots',0,0,1,null],
  ['full-plate','Full Plate Armor','overall',0,45,4,null],
  ['sun-charm','Sun Signet Ring','ring',3,0,3,null],
].map(([definitionId,name,slot,attack,maxHp,defense,weaponVisual])=>[definitionId,{definitionId,name,slot,bonuses:{attack,maxHp,defense},weaponVisual}]))});
function SUBWEAPON_CATALOG(){return Object.fromEntries(Object.values(SUBWEAPONS).map(d=>[d.definitionId,d]));}
export const equipmentSlots=inv=>inv?.subweapons?[...EQUIPMENT_SLOTS,'subweapon']:EQUIPMENT_SLOTS;
export const REWARD_POOLS=freezeWire([
  ['iron-sword','padded-armor','copper-charm','coif','greaves','sabatons','full-plate'],
  ['guard-sword','chain-armor','silver-charm','coif','greaves','sabatons','full-plate'],
  ['runic-sword','plate-armor','sun-charm','coif','greaves','sabatons','full-plate'],
]);

// A ring definition fits either explicit ring slot. Conflicts are resolved atomically.
export const compatibleEquipmentSlot=(definition,slot)=>definition?.slot==='ring'?['ring1','ring2'].includes(slot):Boolean(definition&&definition.slot===slot);
export function equipmentAfter(inv,itemId,slot){const item=inv.itemsById[itemId],d=itemDefinition(item),target=slot??d?.slot;if(!equipmentSlots(inv).includes(target)||!compatibleEquipmentSlot(d,target))return null;
 const equipped={...inv.equipped};for(const key of equipmentSlots(inv))if(equipped[key]===itemId)equipped[key]=null;
 if(target==='overall'){equipped.chest=null;equipped.leggings=null;}else if(target==='chest'||target==='leggings')equipped.overall=null;
 equipped[target]=itemId;return equipped;
}

export function equipmentBonuses(p){const result={attack:0,maxHp:0,defense:0};if(!p.inventory)return result;for(const [slot,id] of Object.entries(p.inventory.equipped)){if(id===null||slot==='subweapon')continue;const d=itemDefinition(p.inventory.itemsById[id]);requireContract(d,'Unknown equipped item');const level=p.inventory.economy?.slotLevels[slot]??0,bonus=d.numericVersion?null:effectiveEquipmentBonuses(d,slot,level);for(const key of Object.keys(result)){const extra=slot==='weapon'&&key==='attack'?level*15:['chest','leggings','overall'].includes(slot)?key==='maxHp'?level*50:key==='defense'?level*10:0:['ring1','ring2'].includes(slot)?key==='attack'?level*10:key==='maxHp'?level*30:0:0;const value=d.rarityTier!==undefined?add(d.numericVersion?mul(A(d.bonuses[key]),100+level,100):Q(d.bonuses[key]*(100+level),100),extra):bonus[key];result[key]=value?.n!==undefined||result[key]?.n!==undefined?add(result[key],value):result[key]+value;}}return result;}
