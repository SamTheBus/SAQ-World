import { freezeWire } from '../contracts/wire.js';

export const EQUIPMENT_CATALOG_VERSION='world-equipment-d4-v1';
export const EQUIPMENT_SLOTS=Object.freeze(['weapon','armor','charm']);
// Fixed definitions, separate from owned instances. Site tier selects a reward pool;
// neither site archetype nor participant level becomes an item identity.
export const EQUIPMENT=freezeWire(Object.fromEntries([
  ['worn-sword','Worn Sword','weapon',0,0,0,'worn'],
  ['iron-sword','Iron Sword','weapon',3,0,0,'iron'],
  ['guard-sword','Guard Sword','weapon',6,0,0,'guard'],
  ['runic-sword','Runic Sword','weapon',9,0,0,'runic'],
  ['padded-armor','Padded Armor','armor',0,20,1,null],
  ['chain-armor','Chain Armor','armor',0,35,3,null],
  ['plate-armor','Plate Armor','armor',0,50,5,null],
  ['copper-charm','Copper Charm','charm',1,0,1,null],
  ['silver-charm','Silver Charm','charm',2,0,2,null],
  ['sun-charm','Sun Charm','charm',3,0,3,null],
].map(([definitionId,name,slot,attack,maxHp,defense,weaponVisual])=>[definitionId,{definitionId,name,slot,bonuses:{attack,maxHp,defense},weaponVisual}])));
export const REWARD_POOLS=freezeWire([
  ['iron-sword','padded-armor','copper-charm'],
  ['guard-sword','chain-armor','silver-charm'],
  ['runic-sword','plate-armor','sun-charm'],
]);
