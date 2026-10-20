import {rewardProgressionD9} from '../content/reward_progression_d9.js';
import {hasWorldCombat,WORLD_COMBAT_HASH} from '../content/world_combat_v1.js';
import {hasServicesV2,serviceNpcsFor,SPECIALIST_NPC} from '../content/settlement_services_v2.js';
import {installWorkshop,workshopProblem,applyWorkshop,validateWorkshop,validateWorkshopItem,validateWorkshopProgress} from './settlement_workshop_v2.js';
import {unmodifiedItem} from '../content/workshop_gear_v2.js';
import {progressionBigInt} from './progression_integer.js';
import {SETTLEMENT_LIFE_POLICY as P,SETTLEMENT_LIFE_VERSION,hasSettlementLife} from '../content/settlement_life_v1.js';
import {LIFE_NPCS} from '../content/settlement_life_alpha_v1.js';
import {projectToLocalFrameD9} from './local_world_frames_d9.js';
import {inventoryIntakeCapacity} from './participant_progression.js';
import {generateGear,gearSeed,gearHash} from '../content/generated_gear.js';
import {rewardProgression} from '../content/reward_progression.js';
import {itemDefinition,REWARD_POOLS} from '../content/equipment.js';
import {addAmount,subtractAmount,compareAmount,multiplyAmount,amount} from './economy_amount.js';
import {combatInteger,minCombat,addCombat,roundCombat,multiplyCombat,compareCombat} from './combat_amount.js';
import {collidesWithTiles} from '../rules/world_geometry.js';
import {closedRecord,copyWire,freezeWire,canonicalStringify,requireContract as check,safeInteger} from './wire.js';
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),ordinary=new Set(REWARD_POOLS.flat());
const token=text=>[0,1,2,3].map(i=>gearHash(text+'/'+i).toString(16).padStart(8,'0')).join('');
export function installSettlementServices(s){if(!hasSettlementLife(s.d9World?.plannedWorld))return;
 for(const p of Object.values(s.playersById)){check(!p.inventory.services,'Service installation is genesis-only');p.inventory.services={version:SETTLEMENT_LIFE_VERSION,purchasesBySourceId:{},salesByItemId:{},retiredSaleGold:'0',supplyPurchases:0,suppliesUsed:0,restCount:0,lastTransaction:null};if(hasWorldCombat(s))p.inventory.services.combatHash=WORLD_COMBAT_HASH;installWorkshop(s,p);}
}
export function serviceNpcPosition(s,n){
 if(n.space==='tavern-ground')return s.d9World?.settlementInterior?{spaceInstanceId:s.d9World.settlementInterior.binding.floorSpaces.ground,position:{x:(n.tile.x+.5)*32,y:(n.tile.y+.5)*32}}:null;
 const t=n.tile,q=projectToLocalFrameD9({chunkX:String(1024+Math.floor(t.x/32)),chunkY:String(1024+Math.floor(t.y/26)),localX:(t.x%32+.5)*32,localY:(t.y%26+.5)*32},s.d9World.runtime.frames);return q?{spaceInstanceId:s.overworldInstanceId,position:{x:q.x,y:q.y}}:null;
}
export function accessibleServiceNpc(s,p,npcId){
 if(!hasSettlementLife(s.d9World?.plannedWorld))return null;const n=serviceNpcsFor(s.d9World?.plannedWorld).find(n=>n.id===npcId),a=s.entitiesById[p.entityId],q=n&&serviceNpcPosition(s,n),primary=s.primary.actorsById[a.entityId];
 if(!q||!a.alive||p.connectionStatus!=='connected'||q.spaceInstanceId!==a.residency.spaceInstanceId||primary.current||primary.heldCommandId||primary.queuedCommandId)return null;
 const dx=a.position.x-q.position.x,dy=a.position.y-q.position.y,d=Math.hypot(dx,dy);if(d>P.interactionRadius||d<18)return null;
 const end={x:q.position.x+dx/d*20,y:q.position.y+dy/d*20},c=s.spacesByInstanceId[q.spaceInstanceId].collision,steps=Math.max(1,Math.ceil(Math.hypot(end.x-a.position.x,end.y-a.position.y)/8));
 for(let i=0;i<=steps;i++)if(collidesWithTiles(c,a.position.x+(end.x-a.position.x)*i/steps,a.position.y+(end.y-a.position.y)*i/steps,0))return null;return n;
}
const stockCache=new Map();
const merchantPrice=(npc,offer)=>String(Number(offer.price)*npc.band);
export function serviceStock(s,p,npc){
 const offers=P.stockByRole[npc.role]??[];return offers.map(base=>{const offer={...base,price:merchantPrice(npc,base)},sourceEntityId='ent:'+token(P.stockVersion+(hasWorldCombat(s)?'/'+WORLD_COMBAT_HASH:'')+'/'+s.campaign.seed.seedHex+'/'+p.playerId+'/'+npc.id+'/'+offer.id),key=sourceEntityId;
  if(!stockCache.has(key)){const progression=hasWorldCombat(s)?{...rewardProgressionD9([0,1,6,11,21,41][npc.band],sourceEntityId),combatHash:WORLD_COMBAT_HASH,combatQuality:'ordinary'}:rewardProgression(P.bandSourceDepth[npc.band],sourceEntityId),generated=generateGear(gearSeed(s,p,sourceEntityId),progression,{tier:P.gearRarity,family:offer.family});if(stockCache.size>=128)stockCache.delete(stockCache.keys().next().value);stockCache.set(key,freezeWire({offer,sourceEntityId,item:{itemId:`item:${p.playerId}:${sourceEntityId}`,definitionId:offer.definitionId,ownerPlayerId:p.playerId,sourceEntityId,generated:copyWire(generated)}}));}
  return stockCache.get(key);
 });
}
export function servicePurchase(p,sourceId){return p.inventory.services?.purchasesBySourceId[sourceId]??null;}
export function validateServiceOrigin(p,o,id){closedRecord(o,['servicePurchase','sourceEntityId']);check(o.servicePurchase===id&&servicePurchase(p,id),'Unknown purchased gear provenance');}
export function validateServiceItem(s,p,item){const r=servicePurchase(p,item.sourceEntityId),n=LIFE_NPCS.find(n=>n.id===r?.npcId),stock=n&&serviceStock(s,p,n).find(q=>q.offer.id===r.offerId);check(stock&&same(stock.item,unmodifiedItem(item))&&same(r.item,unmodifiedItem(item)),'Purchased gear changed');return item;}
export function saleQuote(p,item){
 const d=itemDefinition(item),o=p.inventory.renewal?.originsByItemId[item?.itemId];
 if(!item||item.ownerPlayerId!==p.playerId||!o||item.sourceEntityId===null||!ordinary.has(item.definitionId)||item.locked||item.protected||item.unique||d?.unique||d?.classification==='unique-landmark'||Object.values(p.inventory.equipped).includes(item.itemId)||Object.values(p.inventory.subweapons?.claims??{}).some(c=>c.sourceEntityId===item.sourceEntityId)||(item.generated?.rarityTier??0)>P.sale.maximumRarity)return null;
 if(!o.servicePurchase&&!o.groupId)return null;
 const power=progressionBigInt(item.generated?.itemPower??1),bounded=Number(power>BigInt(P.sale.maximumValuationPower)?BigInt(P.sale.maximumValuationPower):power);return String(P.sale.baseGold+bounded*P.sale.perItemPower+(item.generated?.rarityTier??0)*P.sale.perRarityTier);
}
export const supplyCount=p=>(p.inventory.services?.supplyPurchases??0)-(p.inventory.services?.suppliesUsed??0);
export function serviceActionProblem(s,p,kind,payload){
 const inv=p.inventory,l=inv?.services,a=s.entitiesById[p.entityId],primary=s.primary.actorsById[a.entityId];
 if(!l||!hasSettlementLife(s.d9World?.plannedWorld))return 'Settlement services are unavailable';
 if(inv.revision!==payload.inventoryRevision)return 'Your inventory changed. Review the new offer.';
 if(!a.alive||primary.current||primary.heldCommandId||primary.queuedCommandId)return 'Finish your action first';
 if(kind==='supply.use'){if(supplyCount(p)<1)return 'No field rations carried';if(compareCombat(a.hp,a.maxHp)>=0)return 'Already at full health';return null;}
 const npc=accessibleServiceNpc(s,p,payload.npcId);if(!npc)return 'Approach this civilian on clear ground';
 if(kind==='service.modify'||kind==='service.material')return workshopProblem(s,p,npc,kind,payload);
 if(kind==='service.buy'){
  if(payload.offerId===P.supply.id){if(npc.role!=='general')return 'This merchant does not stock provisions';if(supplyCount(p)>=P.supply.maximum)return 'Provision carrying limit reached';if(l.supplyPurchases>=P.maximumSupplyPurchases)return 'Provision ledger limit reached';return compareAmount(inv.gold,P.supply.price)<0?'Insufficient gold':null;}
  const stock=serviceStock(s,p,npc).find(q=>q.offer.id===payload.offerId);if(!stock)return 'Offer unavailable';if(l.purchasesBySourceId[stock.sourceEntityId])return 'This personal stock has already been purchased';if(Object.keys(inv.itemsById).length>=inventoryIntakeCapacity(p.d8))return 'Equipment inventory is full';if(Object.keys(l.purchasesBySourceId).length>=P.maximumPurchaseRecords)return 'Personal stock ledger is full';return compareAmount(inv.gold,stock.offer.price)<0?'Insufficient gold':null;
 }
 if(kind==='service.sell'){if(npc.role!=='general'&&npc.role!=='smith')return 'This civilian does not buy equipment';if(Object.keys(l.salesByItemId).length>=P.sale.retainedReceiptBound)return 'Sale receipt capacity reached; retained ownership proofs cannot be discarded';return saleQuote(p,inv.itemsById[payload.itemId])===null?'Only unequipped ordinary carried loot can be sold':null;}
 if(kind==='service.rest'){if(npc.role!=='innkeeper')return 'This civilian does not offer rest';if(compareCombat(a.hp,a.maxHp)>=0)return 'Already at full health';if(l.restCount>=P.maximumRests)return 'Rest ledger limit reached';return compareAmount(inv.gold,P.rest.price)<0?'Insufficient gold':null;}
 return 'Unknown service action';
}
export function applyServiceAction(s,p,c,order){
 check(serviceActionProblem(s,p,c.kind,c.payload)===null,'Service transaction became unavailable');const i=p.inventory,l=i.services,a=s.entitiesById[p.entityId];let price='0';
 if(c.kind==='service.modify'||c.kind==='service.material'){applyWorkshop(s,p,c,order);return;}
 if(c.kind==='service.buy'){
  if(c.payload.offerId===P.supply.id){price=P.supply.price;l.supplyPurchases++;}
  else {const n=LIFE_NPCS.find(n=>n.id===c.payload.npcId),q=serviceStock(s,p,n).find(q=>q.offer.id===c.payload.offerId);price=q.offer.price;i.itemsById[q.item.itemId]=copyWire(q.item);i.renewal.originsByItemId[q.item.itemId]={servicePurchase:q.sourceEntityId,sourceEntityId:q.sourceEntityId};l.purchasesBySourceId[q.sourceEntityId]={npcId:n.id,offerId:q.offer.id,item:copyWire(q.item),command:copyWire(c),authorityOrder:order,tick:s.tick,revision:i.revision+1};}
  i.gold=subtractAmount(i.gold,price);
 }else if(c.kind==='service.sell'){
  const item=i.itemsById[c.payload.itemId],origin=i.renewal.originsByItemId[item.itemId],gold=saleQuote(p,item);l.salesByItemId[item.itemId]={item:copyWire(item),origin:copyWire(origin),gold,command:copyWire(c),authorityOrder:order,tick:s.tick,revision:i.revision+1};i.gold=addAmount(i.gold,gold);delete i.itemsById[item.itemId];delete i.renewal.originsByItemId[item.itemId];
 }else if(c.kind==='service.rest'){i.gold=subtractAmount(i.gold,P.rest.price);l.restCount++;a.hp=copyWire(a.maxHp);}
 else {l.suppliesUsed++;a.hp=copyWire(combatInteger(minCombat(a.maxHp,addCombat(a.hp,roundCombat(multiplyCombat(a.maxHp,P.supply.recoveryPercent,100))))));}
 i.revision++;l.lastTransaction={command:copyWire(c),authorityOrder:order,tick:s.tick,revision:i.revision};
}
export function serviceGoldAdjustment(p,gold){const l=p.inventory.services;if(!l)return gold;let income=l.retiredSaleGold,spent=addAmount(multiplyAmount(String(l.supplyPurchases),P.supply.price),multiplyAmount(String(l.restCount),P.rest.price));for(const r of Object.values(l.salesByItemId))income=addAmount(income,r.gold);for(const r of Object.values(l.purchasesBySourceId)){const n=LIFE_NPCS.find(n=>n.id===r.npcId),offer=P.stockByRole[n?.role]?.find(q=>q.id===r.offerId);check(offer,'Unknown purchased stock');spent=addAmount(spent,merchantPrice(n,offer));}return subtractAmount(addAmount(gold,income),spent);}
export function validateSettlementServices(s,p,validateCommand){const l=p.inventory.services;if(!hasSettlementLife(s.d9World?.plannedWorld)){check(!l,'Unsolicited settlement service state');return;}check(l,'Missing service state');closedRecord(l,['version','purchasesBySourceId','salesByItemId','retiredSaleGold','supplyPurchases','suppliesUsed','restCount','lastTransaction'],['workshop','combatHash']);check((l.combatHash??null)===(hasWorldCombat(s)?WORLD_COMBAT_HASH:null),'Service combat policy drift');validateWorkshop(s,p,validateCommand);check(l.version===SETTLEMENT_LIFE_VERSION,'Unknown service version');amount(l.retiredSaleGold);safeInteger(l.supplyPurchases,0,P.maximumSupplyPurchases);safeInteger(l.suppliesUsed,0,l.supplyPurchases);safeInteger(supplyCount(p),0,P.supply.maximum);safeInteger(l.restCount,0,P.maximumRests);check(Object.keys(l.purchasesBySourceId).length<=P.maximumPurchaseRecords&&Object.keys(l.salesByItemId).length<=P.sale.retainedReceiptBound,'Service receipt bound');
 function receipt(r,kind){validateCommand(r.command);const c=r.command;check(c.kind===kind&&c.playerId===p.playerId&&c.campaignId===s.campaign.campaignId&&c.sessionId===s.session.sessionId,'Service receipt context');safeInteger(r.authorityOrder,1,s.lastAppliedAuthorityOrder);safeInteger(r.tick,0,s.tick);safeInteger(r.revision,1,p.inventory.revision);check(c.payload.inventoryRevision+1===r.revision,'Service inventory revision fence');safeInteger(c.clientSequence,1,s.appliedClientSequences[p.playerId]);const applied=s.appliedCommandsById[c.commandId];if(applied)check(applied.status==='applied'&&applied.authorityOrder===r.authorityOrder&&applied.commandCanonical===canonicalStringify(c),'Service applied receipt drift');}
 for(const [id,r] of Object.entries(l.purchasesBySourceId)){closedRecord(r,['npcId','offerId','item','command','authorityOrder','tick','revision']);receipt(r,'service.buy');check(id===r.item.sourceEntityId&&r.command.payload.npcId===r.npcId&&r.command.payload.offerId===r.offerId,'Purchase identity drift');validateServiceItem(s,p,r.item);const i=r.item;check(same(unmodifiedItem(p.inventory.itemsById[i.itemId]??p.inventory.renewal.groundBySourceId[id]?.item??p.inventory.d7?.salvaged[i.itemId]?.item??s.d9World?.paging.remoteGearByPlayer[p.playerId]?.[i.itemId]?.item??l.salesByItemId[i.itemId]?.item??{}),i),'Purchased gear disposition missing');}
 for(const [id,r] of Object.entries(l.salesByItemId)){closedRecord(r,['item','origin','gold','command','authorityOrder','tick','revision']);receipt(r,'service.sell');const i=r.item;check(id===i.itemId&&i.ownerPlayerId===p.playerId&&r.command.payload.itemId===id&&!p.inventory.itemsById[id]&&!p.inventory.renewal.groundBySourceId[i.sourceEntityId]&&!p.inventory.d7?.salvaged[id],'Sold gear has duplicate ownership');const fake={...p,inventory:{...p.inventory,renewal:{...p.inventory.renewal,originsByItemId:{[id]:r.origin}}}};check(saleQuote(fake,i)===r.gold,'Sale eligibility/price drift');}
 if(l.lastTransaction){closedRecord(l.lastTransaction,['command','authorityOrder','tick','revision']);check(['service.buy','service.sell','service.rest','supply.use'].includes(l.lastTransaction.command.kind),'Unknown last service action');receipt(l.lastTransaction,l.lastTransaction.command.kind);}else check(!l.supplyPurchases&&!l.suppliesUsed&&!l.restCount&&!Object.keys(l.purchasesBySourceId).length&&!Object.keys(l.salesByItemId).length,'Service activity lacks a receipt');
}
// A reset archives the reward before retiring its group. Keep its durable SOLD
// ownership page; compact only the local receipt and carry its exact gold forward.
export function retireArchivedServiceSales(p){const l=p.inventory.services;if(!l)return;for(const [id,r] of Object.entries(l.salesByItemId))if(!l.purchasesBySourceId[r.item.sourceEntityId]&&!p.inventory.rewardsByEntityId[r.item.sourceEntityId]&&r.origin.archive){l.retiredSaleGold=addAmount(l.retiredSaleGold,r.gold);delete l.salesByItemId[id];}}
export function validateServiceProgress(before,after,pid){validateWorkshopProgress(before,after,pid);const a=before.playersById[pid].inventory,b=after.playersById[pid].inventory,x=a.services,y=b.services;if(!x&&y){check(!before.d9World?.plannedWorld&&before.tick===0&&after.tick===0&&y.lastTransaction===null&&y.supplyPurchases===0&&y.restCount===0&&Object.keys(y.purchasesBySourceId).length===0&&Object.keys(y.salesByItemId).length===0,'Service installation is genesis-only');return;}check(Boolean(x)===Boolean(y),'Service state changed after genesis');if(!x)return;
 check(y.supplyPurchases>=x.supplyPurchases&&y.suppliesUsed>=x.suppliesUsed&&y.restCount>=x.restCount,'Service counters regressed');
 for(const [id,r] of Object.entries(x.purchasesBySourceId))check(same(r,y.purchasesBySourceId[id]),'Purchase history rewritten');let retired=x.retiredSaleGold;for(const [id,r] of Object.entries(x.salesByItemId)){const n=y.salesByItemId[id];if(!n){check(!b.rewardsByEntityId[r.item.sourceEntityId]&&!x.purchasesBySourceId[r.item.sourceEntityId]&&Object.values(after.campaign.siteRunEpisodesById??{}).some(e=>e.lastReset?.retiredGroupIds.includes(r.origin.groupId)&&e.lastReset.toEpisode===e.episode),'Sale retired without authoritative reward archival');retired=addAmount(retired,r.gold);continue;}const strip=v=>{const q=copyWire(v);if(q.origin)delete q.origin.archive;return q;},reset=n?.origin.archive&&!r.origin.archive&&Object.values(after.campaign.siteRunEpisodesById??{}).some(e=>e.lastReset?.retiredGroupIds.includes(r.origin.groupId)&&e.lastReset.toEpisode===e.episode);check(same(r,n)||reset&&same(strip(r),strip(n)),'Sale history rewritten');}
 check(y.retiredSaleGold===retired,'Retired sale gold accounting');let added=0;for(const [id,r] of Object.entries(y.purchasesBySourceId))if(!x.purchasesBySourceId[id]){check(r.authorityOrder>before.lastAppliedAuthorityOrder&&r.revision>a.revision,'Purchase lacks a later command');added++;}
 for(const [id,r] of Object.entries(y.salesByItemId))if(!x.salesByItemId[id]){const known=a.itemsById[id]??y.purchasesBySourceId[r.item.sourceEntityId]?.item??b.rewardsByEntityId[r.item.sourceEntityId];check(known&&r.authorityOrder>before.lastAppliedAuthorityOrder&&r.revision>a.revision,'Sale lacks carried ancestry or later command');added++;}
 const changes=added+y.supplyPurchases-x.supplyPurchases+y.suppliesUsed-x.suppliesUsed+y.restCount-x.restCount;check(b.revision-a.revision>=changes,'Service changes lack inventory revisions');if(changes)check(y.lastTransaction.authorityOrder>before.lastAppliedAuthorityOrder,'Service counters lack a later receipt');else check(same(x.lastTransaction,y.lastTransaction),'Service receipt changed without transaction');
}
export function projectedServiceNpcs(s,p){if(!hasSettlementLife(s.d9World?.plannedWorld))return [];const a=s.entitiesById[p.entityId];return serviceNpcsFor(s.d9World?.plannedWorld).flatMap(n=>{if(n.space==='exterior'&&!s.d9World.runtime.chunks.some(c=>c.chunkX===String(1024+Math.floor(n.tile.x/32))&&c.chunkY===String(1024+Math.floor(n.tile.y/26))))return [];const q=serviceNpcPosition(s,n);if(!q||q.spaceInstanceId!==a.residency.spaceInstanceId||Math.abs(q.position.x-a.position.x)>1800||Math.abs(q.position.y-a.position.y)>1800)return [];return [{...n,position:q.position,available:Boolean(accessibleServiceNpc(s,p,n.id)),stock:serviceStock(s,p,n).map(q=>({id:q.offer.id,label:q.item.generated.definition.name,price:q.offer.price,item:copyWire(q.item),purchased:Boolean(servicePurchase(p,q.sourceEntityId))}))}];});}
