import { closedRecord, copyWire, freezeWire, requireContract, safeInteger, canonicalStringify } from './wire.js';
import { EQUIPMENT, EQUIPMENT_SLOTS, REWARD_POOLS } from '../content/equipment_d4_legacy.js';
import { ordinaryEnemyForProfile } from '../content/ordinary_enemies.js';
import { ordinaryTier } from './encounter_progression.js';
import { collidesWithTiles } from '../rules/world_geometry.js';

export const D4_ACTIVITY_FORMAT='saq-world-activity-d4-1';
export const PLAYER_INVENTORY_VERSION='player-inventory-d4-v1';
export const MAX_INVENTORY_ITEMS=64,MAX_GOLD=1000000000,BASE_PICKUP_RADIUS=48;
export const itemIdFor=(playerId,sourceEntityId)=>`item:${playerId}:${sourceEntityId??'starter'}`;
export const ownedItem=(p,definitionId,sourceEntityId)=>({itemId:itemIdFor(p.playerId,sourceEntityId),definitionId,ownerPlayerId:p.playerId,sourceEntityId});
export function initialInventory(p){const item=ownedItem(p,'worn-sword',null);return {version:PLAYER_INVENTORY_VERSION,revision:0,gold:0,itemsById:{[item.itemId]:item},equipped:{weapon:item.itemId,armor:null,charm:null},rewardsByEntityId:{},lastEquipmentChange:null};}
export function equipmentBonuses(p){const result={attack:0,maxHp:0,defense:0};if(!p.inventory)return result;for(const id of Object.values(p.inventory.equipped)){if(id===null)continue;const d=EQUIPMENT[p.inventory.itemsById[id]?.definitionId];requireContract(d,'Unknown equipped item');for(const key of Object.keys(result))result[key]+=d.bonuses[key];}return result;}
export function equippedWeaponVisual(p){if(!p.inventory)return 'worn';return EQUIPMENT[p.inventory.itemsById[p.inventory.equipped.weapon]?.definitionId]?.weaponVisual??'unarmed';}
function hash(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h;}
export function defeatReward(state,p,enemy,ordinal){
  const family=ordinaryEnemyForProfile(enemy.contentDefinitionId)?.family;if(!family)return null;
  const group=Object.values(state.groupsById).find(g=>g.entityIds.includes(enemy.entityId)),rank=['C','B','A','S'].indexOf(ordinaryTier(enemy.contentDefinitionId));
  const level=group?.threatSnapshot?.levelsByEntityId[enemy.entityId];safeInteger(level,1,50);safeInteger(ordinal,1,63);
  const roll=hash(`${canonicalStringify(state.campaign.seed)}/${p.playerId}/${enemy.entityId}/${PLAYER_INVENTORY_VERSION}`);
  const gold=({sprout:5,slime:5,golem:7})[family]*(rank+1)+Math.floor((level-1)/5);
  // The first three eligible defeats introduce each slot. Later gear: fixed 35% chance.
  const definitionId=ordinal<=3?REWARD_POOLS[Math.min(2,rank)][ordinal-1]:roll%100<35?REWARD_POOLS[Math.min(2,rank)][(roll>>>8)%3]:null;
  return {gold,definitionId};
}
export function canPickUp(state,p,sourceEntityId,radius){
  const a=state.entitiesById[p.entityId],r=p.inventory?.rewardsByEntityId[sourceEntityId];
  if(!a.alive||!r||r.claimed||a.residency.spaceInstanceId!==r.spaceInstanceId)return false;
  const dx=r.position.x-a.position.x,dy=r.position.y-a.position.y,d=Math.hypot(dx,dy);if(d>radius)return false;
  const c=state.spacesByInstanceId[r.spaceInstanceId].collision,steps=Math.max(1,Math.ceil(d/(c.tileSize/4)));
  for(let i=0;i<=steps;i++)if(collidesWithTiles(c,a.position.x+dx*i/steps,a.position.y+dy*i/steps,0))return false;
  return !r.definitionId||Object.keys(p.inventory.itemsById).length<MAX_INVENTORY_ITEMS;
}
export function equipmentActionAvailable(state,p,kind,payload){
  const inv=p.inventory,primary=state.primary.actorsById[p.entityId];
  if(!inv||inv.revision!==payload.inventoryRevision||primary.current||primary.heldCommandId||primary.queuedCommandId)return false;
  if(kind==='equipment.equip'){const item=inv.itemsById[payload.itemId],d=EQUIPMENT[item?.definitionId];return Boolean(d&&inv.equipped[d.slot]!==item.itemId);}
  return EQUIPMENT_SLOTS.includes(payload.slot)&&inv.equipped[payload.slot]!==null;
}
export function validatePlayerInventory(p,state,validateCommand){
  const inv=p.inventory;closedRecord(inv,['version','revision','gold','itemsById','equipped','rewardsByEntityId','lastEquipmentChange']);
  requireContract(inv.version===PLAYER_INVENTORY_VERSION,'Unsupported player inventory');safeInteger(inv.revision);safeInteger(inv.gold,0,MAX_GOLD);
  closedRecord(inv.equipped,EQUIPMENT_SLOTS);const starter=itemIdFor(p.playerId,null),items=Object.entries(inv.itemsById),rewards=Object.values(inv.rewardsByEntityId);
  requireContract(items.length>=1&&items.length<=MAX_INVENTORY_ITEMS&&rewards.length<=63,'Inventory bound');
  const ordinals=new Set();let totalGold=0,claimed=0;
  function receipt(r,kind){
    closedRecord(r,['command','authorityOrder','tick','revision']);validateCommand(r.command);const c=r.command;
    requireContract(c.kind===kind&&c.playerId===p.playerId&&c.campaignId===state.campaign.campaignId&&c.sessionId===state.session.sessionId,'Inventory receipt owner/context');
    safeInteger(c.clientSequence,1,state.appliedClientSequences[p.playerId]);safeInteger(r.authorityOrder,1,state.lastAppliedAuthorityOrder);safeInteger(r.tick,0,state.tick);safeInteger(r.revision,1,inv.revision);
    requireContract(c.payload.inventoryRevision+1===r.revision&&state.spacesByInstanceId[c.spaceInstanceId]?.spaceRevision===c.spaceRevision,'Inventory receipt revision');
    safeInteger(c.residencyRevision,1,state.entitiesById[p.entityId].residency.residencyRevision);
    const applied=state.appliedCommandsById[c.commandId];if(applied)requireContract(applied.status==='applied'&&applied.authorityOrder===r.authorityOrder&&applied.tick===r.tick&&applied.commandCanonical===canonicalStringify(c),'Inventory applied receipt mismatch');
  }
  for(const [id,r] of Object.entries(inv.rewardsByEntityId)){
    closedRecord(r,['sourceEntityId','ordinal','defeatedTick','spaceInstanceId','position','gold','definitionId','claimed','pickup']);const enemy=state.entitiesById[id];
    requireContract(r.sourceEntityId===id&&enemy?.team==='hostile'&&!enemy.alive&&enemy.residency.spaceInstanceId===r.spaceInstanceId&&canonicalStringify(enemy.position)===canonicalStringify(r.position),'Loot source differs from defeated actor');
    safeInteger(r.ordinal,1,rewards.length);requireContract(!ordinals.has(r.ordinal),'Duplicate reward ordinal');ordinals.add(r.ordinal);safeInteger(r.defeatedTick,0,state.tick);
    const expected=defeatReward(state,p,enemy,r.ordinal);requireContract(expected&&r.gold===expected.gold&&r.definitionId===expected.definitionId&&typeof r.claimed==='boolean','Reward definition drift');
    if(r.claimed){receipt(r.pickup,'loot.pickup');requireContract(r.pickup.command.payload.sourceEntityId===id&&r.pickup.command.spaceInstanceId===r.spaceInstanceId&&r.pickup.tick>=r.defeatedTick,'Pickup source/context');totalGold+=r.gold;claimed++;if(r.definitionId)requireContract(inv.itemsById[itemIdFor(p.playerId,id)],'Claimed gear missing');}
    else requireContract(r.pickup===null,'Unclaimed pickup receipt');
  }
  requireContract(inv.gold===Math.min(MAX_GOLD,totalGold)&&inv.revision>=rewards.length+claimed,'Inventory reward accounting');
  for(const [id,item] of items){closedRecord(item,['itemId','definitionId','ownerPlayerId','sourceEntityId']);requireContract(id===item.itemId&&id===itemIdFor(p.playerId,item.sourceEntityId)&&item.ownerPlayerId===p.playerId&&EQUIPMENT[item.definitionId],'Item identity/owner/definition');
    if(item.sourceEntityId===null)requireContract(id===starter&&item.definitionId==='worn-sword','Invalid starter');else {const r=inv.rewardsByEntityId[item.sourceEntityId];requireContract(r?.claimed&&r.definitionId===item.definitionId,'Item lacks collected reward');}}
  requireContract(inv.itemsById[starter],'Starter item missing');
  const equipped=new Set();for(const slot of EQUIPMENT_SLOTS){const id=inv.equipped[slot];if(id===null)continue;requireContract(!equipped.has(id)&&EQUIPMENT[inv.itemsById[id]?.definitionId]?.slot===slot,'Equipment slot/ownership mismatch');equipped.add(id);}
  if(inv.lastEquipmentChange){const r=inv.lastEquipmentChange;requireContract(['equipment.equip','equipment.unequip'].includes(r.command.kind),'Invalid equipment receipt kind');receipt(r,r.command.kind);const payload=r.command.payload;
    if(r.command.kind==='equipment.equip'){const item=inv.itemsById[payload.itemId];requireContract(item&&inv.equipped[EQUIPMENT[item.definitionId].slot]===item.itemId,'Latest equip not reflected');}else requireContract(inv.equipped[payload.slot]===null,'Latest unequip not reflected');
  }else requireContract(canonicalStringify(inv.equipped)===canonicalStringify(initialInventory(p).equipped),'Equipment changed without command');
  return inv;
}
export function validateInventoryProgress(before,after){
  for(const id of before.session.playerIds){const a=before.playersById[id].inventory,b=after.playersById[id].inventory;if(!a||!b)continue;
    requireContract(b.revision>=a.revision&&b.gold>=a.gold,'Inventory/gold regressed');
    const newRewards=Object.values(b.rewardsByEntityId).filter(r=>!a.rewardsByEntityId[r.sourceEntityId]).length,newClaims=Object.values(b.rewardsByEntityId).filter(r=>r.claimed&&!a.rewardsByEntityId[r.sourceEntityId]?.claimed).length;
    const equipmentChanged=canonicalStringify(a.lastEquipmentChange)!==canonicalStringify(b.lastEquipmentChange);
    requireContract(b.revision-a.revision>=newRewards+newClaims+Number(equipmentChanged),'Inventory changes lack revision advancement');
    for(const [key,item] of Object.entries(a.itemsById))requireContract(canonicalStringify(item)===canonicalStringify(b.itemsById[key]),'Owned item changed or disappeared');
    for(const [key,r] of Object.entries(a.rewardsByEntityId)){const n=b.rewardsByEntityId[key];requireContract(n&&canonicalStringify({...r,claimed:false,pickup:null})===canonicalStringify({...n,claimed:false,pickup:null})&&(!r.claimed||canonicalStringify(n)===canonicalStringify(r)),'Loot history regressed');}
    for(const [key,r] of Object.entries(b.rewardsByEntityId))if(!a.rewardsByEntityId[key])requireContract(before.entitiesById[key]?.alive&&!after.entitiesById[key]?.alive&&r.defeatedTick>=before.tick,'Retroactive or forged loot');
    for(const [key,r] of Object.entries(b.rewardsByEntityId))if(r.claimed&&!a.rewardsByEntityId[key]?.claimed)requireContract(r.pickup.authorityOrder>before.lastAppliedAuthorityOrder&&r.pickup.revision>a.revision,'Pickup does not follow saved cut');
    if(canonicalStringify(a.equipped)!==canonicalStringify(b.equipped)||canonicalStringify(a.lastEquipmentChange)!==canonicalStringify(b.lastEquipmentChange))requireContract(b.lastEquipmentChange?.authorityOrder>before.lastAppliedAuthorityOrder&&b.lastEquipmentChange.revision>a.revision,'Equipment changed without a later command');
  }
}
export const inventoryReadModel=p=>freezeWire(copyWire(p.inventory));
