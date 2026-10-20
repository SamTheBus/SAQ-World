import {workshopExtension} from '../shared/content/workshop_gear_v2.js';
import {cryptGroupInfoV2 as cryptGroupInfo} from '../shared/content/planned_crypt_policy_v2.js';
import {ruinGroupInfoV2 as ruinGroupInfoV1} from '../shared/content/planned_ruin_policy_v2.js';
import {fortGroupFloorIndexV1} from '../shared/content/planned_fort_policy_v1.js';
import {copyWire,canonicalStringify,closedRecord,requireContract as check,safeInteger} from '../shared/contracts/wire.js';
import {localFramePositionD9} from '../shared/contracts/local_world_frames_d9.js';
import {legacyWorldPosition,validateWorldPosition} from '../shared/contracts/world_address.js';
import {createPageTransaction,pageDigest} from './paged_world_store.js';
import {worldDocument} from './world_page_publication_d9.js';
import {functionalSiteDefinitionForGroupD10} from '../shared/content/functional_site_registry_d10.js';
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
export const GEAR_PAGE_D9='world-owned-gear-d9-v1';
export const gearOwnershipKeyD9=(ownerPlayerId,itemId,sha256)=>pageDigest({version:GEAR_PAGE_D9,ownerPlayerId,itemId},sha256);
export const gearObligationKeyD9=(ownerPlayerId,groupId,sha256)=>pageDigest({version:'world-gear-obligation-d9-v1',ownerPlayerId,groupId},sha256);
const physical=row=>['DROPPED','UNCLAIMED'].includes(row?.disposition);
export function gearCellD9(ownerPlayerId,location){validateWorldPosition(location.position);return {version:'world-gear-cell-d9-v1',ownerPlayerId,spaceInstanceId:location.spaceInstanceId,chunkX:location.position.chunkX,chunkY:location.position.chunkY,cellX:Math.floor(location.position.localX/128),cellY:Math.floor(location.position.localY/128)};}
export const gearCellKeyD9=(cell,sha256)=>pageDigest(cell,sha256);
export const gearChunkD9=cell=>({version:'world-ground-chunk-d9-v1',ownerPlayerId:cell.ownerPlayerId,spaceInstanceId:cell.spaceInstanceId,chunkX:cell.chunkX,chunkY:cell.chunkY});
export const gearChunkKeyD9=(chunk,sha256)=>pageDigest(chunk,sha256);
function inventoryRows(state,p){
 const inv=p.inventory,frames=state.d9World.runtime.frames,point=(position,spaceInstanceId)=>({spaceInstanceId,position:copyWire(spaceInstanceId===state.overworldInstanceId?localFramePositionD9(position,frames):legacyWorldPosition(position))});
 const base=(item,origin,disposition)=>{const episode=state.d9World.episodes[origin.groupId],cold=state.d9World.paging.originsByGroup[origin.groupId],g=episode&&!episode.origin?{...episode.geography,entityIds:state.groupsById[origin.groupId].entityIds}:cold,sourceGeography=g?{chunkX:g.chunkX,chunkY:g.chunkY,anchorOrdinal:g.anchorOrdinal,rank:g.rank,entityIds:[...g.entityIds]}:null;return {version:GEAR_PAGE_D9,ownerPlayerId:p.playerId,item:copyWire(item),origin:copyWire(origin),disposition,...(sourceGeography?{sourceGeography}:{})};};
 const rows=[];
 for(const item of Object.values(inv.itemsById))if(item.sourceEntityId!==null)rows.push(base(item,inv.renewal.originsByItemId[item.itemId],'CARRIED'));
 for(const r of Object.values(inv.rewardsByEntityId))if(r.definitionId&&!r.claimed&&r.retiredTick===undefined){const item={itemId:`item:${p.playerId}:${r.sourceEntityId}`,definitionId:r.definitionId,ownerPlayerId:p.playerId,sourceEntityId:r.sourceEntityId,...(r.generated?{generated:copyWire(r.generated)}:{})},source=r.episodeSource,origin=source?{groupId:source.groupId,episode:source.episode,sourceEntityId:r.sourceEntityId,...(source.progression?{progression:copyWire(source.progression)}:{})}:Object.values(state.groupsById).filter(g=>g.entityIds.includes(r.sourceEntityId)).map(g=>({groupId:g.groupId,episode:0,sourceEntityId:r.sourceEntityId}))[0];
  rows.push({...base(item,origin,'UNCLAIMED'),location:point(r.position,r.spaceInstanceId)});
 }
 for(const d of Object.values(inv.renewal.groundBySourceId))rows.push({...base(d.item,d.origin,'DROPPED'),location:point(d.position,d.spaceInstanceId),drop:{droppedTick:d.droppedTick,receipt:copyWire(d.receipt)}});
 for(const [kind,table] of [['SALVAGED',inv.d7.salvaged],['AUTO_SALVAGED',inv.d7.autoSalvaged]])for(const r of Object.values(table))rows.push({...base(r.item,r.origin,kind),terminal:{tick:r.tick,revision:r.revision,materials:copyWire(r.materials),...(r.command?{command:copyWire(r.command),authorityOrder:r.authorityOrder}:{eligibleTick:r.eligibleTick})}});
 for(const r of Object.values(inv.services?.salesByItemId??{}))rows.push({...base(r.item,r.origin,'SOLD'),terminal:{tick:r.tick,revision:r.revision,gold:r.gold,command:copyWire(r.command),authorityOrder:r.authorityOrder}});
 return rows;
}
function latestRetiredRewardSources(state){const ids=new Set();for(const record of Object.values(state.campaign.siteRunEpisodesById??{})){const receipt=record.completionHistory?.at(-1);if(record.lastReset?.toEpisode===record.episode&&receipt?.episode===record.lastReset.fromEpisode)for(const id of receipt.rewardSourceIds)ids.add(id);}return [...ids].sort();}
export function validateOwnedGearPageD9(row){
 closedRecord(row,['version','ownerPlayerId','item','origin','disposition'],['location','drop','terminal','sourceGeography']);check(row.version===GEAR_PAGE_D9&&row.item.ownerPlayerId===row.ownerPlayerId&&row.item.sourceEntityId!==null&&['CARRIED','UNCLAIMED','DROPPED','SALVAGED','AUTO_SALVAGED','SOLD'].includes(row.disposition),'Owned gear page identity');
 check(row.item.itemId===`item:${row.ownerPlayerId}:${row.item.sourceEntityId}`&&row.origin.sourceEntityId===row.item.sourceEntityId,'Owned gear source identity');
 check(Boolean(row.location)===physical(row)&&Boolean(row.drop)===(row.disposition==='DROPPED')&&Boolean(row.terminal)===['SALVAGED','AUTO_SALVAGED','SOLD'].includes(row.disposition),'Owned gear disposition fields');
 if(row.sourceGeography){const g=row.sourceGeography,site=functionalSiteDefinitionForGroupD10(row.origin.groupId),generated=/^site:site:[a-f0-9]{32}:cave-floor-[0-3]$/.test(row.origin.groupId),fortFloor=fortGroupFloorIndexV1(row.origin.groupId),ruin=cryptGroupInfo(row.origin.groupId)??ruinGroupInfoV1(row.origin.groupId),count=ruin?ruin.count:fortFloor!==null?3:site?.template.encounter.members.length??(generated?null:2);closedRecord(g,['chunkX','chunkY','anchorOrdinal','rank','entityIds']);validateWorldPosition({chunkX:g.chunkX,chunkY:g.chunkY,localX:0,localY:0});safeInteger(g.anchorOrdinal,0,generated||fortFloor!==null||ruin?3:1);if(fortFloor!==null)check(g.anchorOrdinal===fortFloor,'Fort gear floor provenance drift');if(ruin)check(g.anchorOrdinal===ruin.floor,'Ruin gear floor provenance drift');check(['C','B','A','S'].includes(g.rank)&&Array.isArray(g.entityIds)&&(count===null?g.entityIds.length>=1&&g.entityIds.length<=5:g.entityIds.length===count)&&new Set(g.entityIds).size===g.entityIds.length&&g.entityIds.every(id=>typeof id==='string'&&id.startsWith('ent:')),'Owned gear geography provenance');}
 if(row.location){closedRecord(row.location,['spaceInstanceId','position']);validateWorldPosition(row.location.position);}return row;
}

// A separate sparse ownership index resolves an item's CURRENT disposition even
// after its original encounter, deliberate Drop and participant are far apart.
// Updating the index never creates, consumes, rerolls or pays for an item.
export async function prepareGearIndexD9(state,{sha256,readPage,additionalRows={}}){
 const expected={ownershipIndex:state.d9World.ownershipIndex,groundIndex:state.d9World.groundIndex},owners=createPageTransaction({root:expected.ownershipIndex,readPage,sha256}),locations=createPageTransaction({root:expected.groundIndex,readPage,sha256}),cells=new Map(),chunks=new Map(),pages=[],indexedRevisions={...state.d9World.paging.indexedRevisions};
 async function chunk(descriptor){const address=gearChunkD9(descriptor),key=await gearChunkKeyD9(address,sha256);if(chunks.has(key))return chunks.get(key);const ref=await locations.get(key);let children={};if(ref){check(ref.version==='world-page-ref-d9-v1','Ground chunk index reference');const doc=await readPage(ref.pageId);check(await pageDigest(doc,sha256)===ref.pageId&&doc.kind==='ground-chunk'&&same(doc.payload.address,address),'Ground chunk commitment/address mismatch');children=copyWire(doc.payload.cells);}const entry={key,address,cells:children};chunks.set(key,entry);return entry;}
 async function cell(location,pid){const descriptor=gearCellD9(pid,location),key=await gearCellKeyD9(descriptor,sha256);if(cells.has(key))return cells.get(key);
  const parent=await chunk(descriptor),ordinal=descriptor.cellX+','+descriptor.cellY,ref=parent.cells[ordinal];let items={};if(ref){const doc=await readPage(ref);check(await pageDigest(doc,sha256)===ref&&doc.kind==='ground-cell'&&same(doc.payload.cell,descriptor),'Ground cell commitment/address mismatch');items=copyWire(doc.payload.items);}
  const entry={key,cell:descriptor,items,parent,ordinal};cells.set(key,entry);return entry;
 }
 async function obligation(row,delta){if(!physical(row)||!row.origin.groupId)return;const key=await gearObligationKeyD9(row.ownerPlayerId,row.origin.groupId,sha256),prior=await owners.get(key),count=safeInteger((prior?.count??0)+delta);if(prior)check(prior.ownerPlayerId===row.ownerPlayerId&&prior.groupId===row.origin.groupId,'Gear obligation identity');await owners.set(key,count?{version:'world-gear-obligation-d9-v1',ownerPlayerId:row.ownerPlayerId,groupId:row.origin.groupId,count}:null);}
 const provenance=o=>{const value=copyWire(o);delete value.archive;return value;},revisions={};
 for(const p of Object.values(state.playersById)){
  revisions[p.playerId]=p.inventory.revision;if(indexedRevisions[p.playerId]===p.inventory.revision&&!additionalRows[p.playerId]?.length)continue;
  for(const sourceEntityId of latestRetiredRewardSources(state)){const itemId=`item:${p.playerId}:${sourceEntityId}`,key=await gearOwnershipKeyD9(p.playerId,itemId,sha256),prior=await owners.get(key);if(prior?.disposition!=='UNCLAIMED')continue;validateOwnedGearPageD9(prior);const c=await cell(prior.location,p.playerId);check(c.items[key],'Retired unclaimed gear is absent from its ground index');delete c.items[key];await obligation(prior,-1);await owners.set(key,null);}
  const rows=[...inventoryRows(state,p),...(additionalRows[p.playerId]??[])];for(const [itemId,proof] of Object.entries(state.d9World.paging.remoteGearByPlayer[p.playerId]??{}))if(proof.origin?.archive){const key=await gearOwnershipKeyD9(p.playerId,itemId,sha256),prior=await owners.get(key);if(prior&&!same(prior.origin,proof.origin))rows.push({...copyWire(prior),origin:copyWire(proof.origin)});}
  for(let row of rows){
   validateOwnedGearPageD9(row);const key=await gearOwnershipKeyD9(p.playerId,row.item.itemId,sha256),prior=await owners.get(key);if(prior){validateOwnedGearPageD9(prior);if(prior.sourceGeography&&!row.sourceGeography)row={...row,sourceGeography:copyWire(prior.sourceGeography)};check((same(prior.item,row.item)||!['SALVAGED','AUTO_SALVAGED','SOLD'].includes(prior.disposition)&&workshopExtension(prior.item,row.item))&&same(provenance(prior.origin),provenance(row.origin))&&same(prior.sourceGeography??null,row.sourceGeography??null)&&(!prior.origin.archive||same(prior.origin.archive,row.origin.archive)),'Gear payload/provenance changed');if(same(prior,row))continue;check(!['SALVAGED','AUTO_SALVAGED','SOLD'].includes(prior.disposition)||prior.disposition===row.disposition,'Terminal gear resurrected');}
   if(physical(prior)){const c=await cell(prior.location,p.playerId);check(c.items[key],'Ground ownership index is incomplete');delete c.items[key];await obligation(prior,-1);}
   if(physical(row)){const c=await cell(row.location,p.playerId);c.items[key]=copyWire(row);check(Object.keys(c.items).length<=64,'Ground cell occupancy extension required');await obligation(row,1);}
   await owners.set(key,row);
  }
  indexedRevisions[p.playerId]=p.inventory.revision;
 }
 for(const c of cells.values())if(Object.keys(c.items).length){const value=worldDocument('ground-cell',{cell:c.cell,items:c.items}),id=await pageDigest(value,sha256);pages.push({id,value});c.parent.cells[c.ordinal]=id;}else delete c.parent.cells[c.ordinal];
 for(const c of chunks.values())if(Object.keys(c.cells).length){const value=worldDocument('ground-chunk',{address:c.address,cells:c.cells},Object.values(c.cells)),id=await pageDigest(value,sha256);pages.push({id,value});await locations.set(c.key,{version:'world-page-ref-d9-v1',pageId:id});}else await locations.set(c.key,null);
 return {expected,revisions,indexedRevisions,ownershipIndex:owners.root(),groundIndex:locations.root(),pages:[...pages,...owners.pages(),...locations.pages()]};
}
export function installGearIndexD9(state,plan){check(state.d9World.ownershipIndex===plan.expected.ownershipIndex&&state.d9World.groundIndex===plan.expected.groundIndex,'Stale gear index root');for(const [id,revision] of Object.entries(plan.revisions))check(state.playersById[id].inventory.revision===revision,'Inventory changed during gear index preparation');state.d9World.ownershipIndex=plan.ownershipIndex;state.d9World.groundIndex=plan.groundIndex;state.d9World.paging.indexedRevisions={...plan.indexedRevisions};}
export async function readOwnedGearD9(root,ownerPlayerId,itemId,{readPage,sha256}){if(!root)return null;const tx=createPageTransaction({root,readPage,sha256}),row=await tx.get(await gearOwnershipKeyD9(ownerPlayerId,itemId,sha256));return row?copyWire(validateOwnedGearPageD9(row)):null;}
export async function readGroundChunkD9(root,address,{readPage,sha256}){if(!root)return null;const tx=createPageTransaction({root,readPage,sha256}),ref=await tx.get(await gearChunkKeyD9(address,sha256));if(!ref)return null;const doc=await readPage(ref.pageId);check(await pageDigest(doc,sha256)===ref.pageId&&doc.kind==='ground-chunk'&&same(doc.payload.address,address),'Ground chunk commitment/address mismatch');check(Object.keys(doc.payload.cells).length<=56,'Ground chunk cell bound');return copyWire(doc.payload);}
export async function readGroundCellPageD9(id,descriptor,{readPage,sha256}){if(!id)return [];const doc=await readPage(id);check(await pageDigest(doc,sha256)===id&&doc.kind==='ground-cell'&&same(doc.payload.cell,descriptor),'Ground cell commitment/address mismatch');const rows=Object.values(doc.payload.items);check(rows.length<=64,'Ground cell bound');return rows.map(r=>copyWire(validateOwnedGearPageD9(r)));}
export async function readGroundCellD9(root,descriptor,io){const chunk=await readGroundChunkD9(root,gearChunkD9(descriptor),io);return readGroundCellPageD9(chunk?.cells[descriptor.cellX+','+descriptor.cellY],descriptor,io);}
