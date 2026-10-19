import {createPageTransaction,pageDigest} from './paged_world_store.js';
import {readOwnedGearD9,gearObligationKeyD9} from './world_gear_pages_d9.js';
import {copyWire,canonicalStringify,requireContract as check,safeInteger} from '../shared/contracts/wire.js';
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
export async function prepareGearKnowledgeD9(state,{readPage,sha256,excludingGround={}}){
 const root=state.d9World.ownershipIndex,tx=createPageTransaction({root,readPage,sha256}),remoteGearByPlayer={},coldObligations={},revisions={};
 for(const p of Object.values(state.playersById)){
  revisions[p.playerId]=p.inventory.revision;check(state.d9World.paging.indexedRevisions[p.playerId]===p.inventory.revision,'Index inventory changes before loading gear knowledge');
  const inv=p.inventory,remote=remoteGearByPlayer[p.playerId]={},candidates=new Set(Object.keys(state.d9World.paging.remoteGearByPlayer[p.playerId]??{}));
  for(const r of Object.values(inv.rewardsByEntityId))if(r.definitionId&&r.claimed)candidates.add(`item:${p.playerId}:${r.sourceEntityId}`);
  for(const sourceEntityId of excludingGround[p.playerId]??[])if(inv.renewal.groundBySourceId[sourceEntityId])candidates.add(inv.renewal.groundBySourceId[sourceEntityId].item.itemId);
  for(const id of candidates){const marker=id.lastIndexOf(':ent:'),sourceEntityId=marker>=0?id.slice(marker+1):null,reward=sourceEntityId?inv.rewardsByEntityId[sourceEntityId]:null;if(inv.itemsById[id]||sourceEntityId&&inv.renewal.groundBySourceId[sourceEntityId]&&!excludingGround[p.playerId]?.includes(sourceEntityId)||inv.d7.salvaged[id]||inv.d7.autoSalvaged[id])continue;
   const row=await readOwnedGearD9(root,p.playerId,id,{readPage,sha256});check(row&&['DROPPED','SALVAGED','AUTO_SALVAGED'].includes(row.disposition)&&(!reward||row.item.definitionId===reward.definitionId&&same(row.item.generated??null,reward.generated??null)),'Claimed reward lost its current owned disposition');
   remote[id]={item:copyWire(row.item),origin:copyWire(row.origin),disposition:row.disposition,recordHash:await pageDigest(row,sha256)};
  }
  const hot=new Map();for(const r of Object.values(inv.rewardsByEntityId))if(r.definitionId&&!r.claimed&&r.retiredTick===undefined){const gid=r.episodeSource?.groupId??Object.values(state.groupsById).find(g=>g.entityIds.includes(r.sourceEntityId))?.groupId;if(gid)hot.set(gid,(hot.get(gid)??0)+1);}
  for(const d of Object.values(inv.renewal.groundBySourceId))if(d.origin.groupId&&!excludingGround[p.playerId]?.includes(d.item.sourceEntityId))hot.set(d.origin.groupId,(hot.get(d.origin.groupId)??0)+1);
  for(const gid of Object.keys(state.groupsById)){
   const row=await tx.get(await gearObligationKeyD9(p.playerId,gid,sha256));if(row)check(row.version==='world-gear-obligation-d9-v1'&&row.ownerPlayerId===p.playerId&&row.groupId===gid,'Cold obligation identity mismatch');
   const count=safeInteger((row?.count??0)-(hot.get(gid)??0));(coldObligations[gid]??={})[p.playerId]=count;
  }
 }
 return {root,revisions,groupIds:Object.keys(state.groupsById).sort(),remoteGearByPlayer,coldObligations};
}
export function installGearKnowledgeD9(state,plan){check(state.d9World.ownershipIndex===plan.root&&same(Object.keys(state.groupsById).sort(),plan.groupIds),'Gear knowledge context changed');for(const [id,revision] of Object.entries(plan.revisions))check(state.playersById[id].inventory.revision===revision,'Gear knowledge inventory changed');state.d9World.paging.remoteGearByPlayer=copyWire(plan.remoteGearByPlayer);state.d9World.paging.coldObligations=copyWire(plan.coldObligations);}
export async function verifyRemoteGearKnowledgeD9(state,{readPage,sha256}){
 for(const [pid,rows] of Object.entries(state.d9World.paging.remoteGearByPlayer))for(const [id,proof] of Object.entries(rows)){const row=await readOwnedGearD9(state.d9World.ownershipIndex,pid,id,{readPage,sha256});check(row&&await pageDigest(row,sha256)===proof.recordHash&&same(row.item,proof.item)&&same(row.origin,proof.origin)&&row.disposition===proof.disposition,'Remote gear proof differs from its ownership page');}
}
