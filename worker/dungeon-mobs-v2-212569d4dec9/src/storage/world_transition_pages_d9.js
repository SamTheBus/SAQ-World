import {copyWire,canonicalStringify,requireContract as check} from '../shared/contracts/wire.js';
import {createWorldPageBufferD9} from './world_page_buffer_d9.js';
import {readOwnedGearD9} from './world_gear_pages_d9.js';
import {changedPageEntriesD9} from './world_page_diff_d9.js';
import {pageDigest} from './paged_world_store.js';
import {chunkDeltaKeyD9} from './world_page_buffer_d9.js';
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);

// Bring only the counterparts of this bounded live cut into its comparison.
// This does not instantiate actors, activate content or install pages in play.
export async function reconcileWorldComparisonPagesD9(a,b,{readPage,sha256}){
 const pages=createWorldPageBufferD9({readPage,sha256}),cache=new Map();
 const read=async(s,geo)=>{const key=s.d9World.regionIndex+'/'+geo.chunkX+','+geo.chunkY;if(!cache.has(key))cache.set(key,await pages.readChunk(s.d9World.regionIndex,geo));return cache.get(key);};
 function inject(target,e){
  const id=e.group.groupId;if(target.groupsById[id])return;
  target.groupsById[id]=copyWire(e.group);target.encounterEconomy.groups[id]=copyWire(e.economy);target.d9World.episodes[id]=copyWire(e.episode);
  for(const actor of e.actors){check(!target.entitiesById[actor.entityId],'Cold actor collision');target.entitiesById[actor.entityId]=copyWire(actor);}
  if(e.hostileActions){check(target.hostileCombat,'Cold ranged comparison requires hostile combat');Object.assign(target.hostileCombat.actionsByEntityId,copyWire(e.hostileActions));}
  for(const [pid,rows] of Object.entries(e.players)){
   const p=target.playersById[pid],i=p?.inventory;check(i,'Cold participant mismatch');
   const merge=(to,from)=>{for(const [id,v] of Object.entries(from)){check(!Object.hasOwn(to,id)||same(to[id],v),'Cold receipt contradicts live ownership');to[id]=copyWire(v);}};
   merge(i.rewardsByEntityId,rows.rewards);merge(i.goldAwardsByEntityId,rows.gold);merge(i.economy.soulAwardsByEntityId,rows.souls);merge(p.d8.causalXp,rows.causalXp);merge(i.d7.salvaged,rows.salvaged);merge(i.d7.autoSalvaged,rows.autoSalvaged);
  }
 }
 // Cold deadlines may modify a source which is absent from BOTH live cuts.
 // Include those changed receipts in conservation/causality comparison too.
 const changed=await changedPageEntriesD9({before:a.d9World.regionIndex,after:b.d9World.regionIndex,readPage,sha256});
 for(const row of changed){check(!row.before||row.after,'Historical chunk delta deleted');
  for(const [target,ref] of [[a,row.before],[b,row.after]])if(ref){check(ref.version==='world-page-ref-d9-v1','Changed chunk reference');const doc=await readPage(ref.pageId);check(doc&&await pageDigest(doc,sha256)===ref.pageId&&doc.kind==='chunk-delta'&&await chunkDeltaKeyD9(doc.payload,sha256)===row.key,'Changed chunk identity/commitment');for(const e of doc.payload.encounters)inject(target,e);}
 }
 async function counterpart(target,other,id){
  if(target.groupsById[id])return;
  const geo=other.d9World.episodes[id]?.geography;check(geo&&!other.d9World.episodes[id].origin,'Historical origin cannot leave the live cut');
  const delta=await read(target,geo),e=delta?.encounters.find(e=>e.group.groupId===id);
  if(!e)return; // A newly generated encounter legitimately has no prior page.
  check(e.episode.anchorId===other.d9World.episodes[id].anchorId&&same(e.episode.geography,geo),'Cold encounter geography changed');
  inject(target,e);
 }
 const aIds=Object.keys(a.groupsById),bIds=Object.keys(b.groupsById);
 for(const id of aIds)await counterpart(b,a,id);
 for(const id of bIds)await counterpart(a,b,id);
 // Deliberate Drops are located independently of their source chunk. Recover
 // their current comparison endpoint from the ownership index, never a stale
 // copy embedded in an old encounter page.
 for(const pid of a.session.playerIds){const x=a.playersById[pid].inventory,y=b.playersById[pid].inventory,items=new Map();for(const inv of [x,y]){for(const item of Object.values(inv.itemsById))if(item.sourceEntityId!==null)items.set(item.itemId,item);for(const drop of Object.values(inv.renewal.groundBySourceId))items.set(drop.item.itemId,drop.item);for(const r of Object.values(inv.rewardsByEntityId))if(r.definitionId&&r.claimed)items.set(`item:${pid}:${r.sourceEntityId}`,{itemId:`item:${pid}:${r.sourceEntityId}`,sourceEntityId:r.sourceEntityId});}
  for(const target of [a,b])for(const item of items.values()){const inv=target.playersById[pid].inventory,id=item.sourceEntityId;if(inv.itemsById[item.itemId]||inv.renewal.groundBySourceId[id]||inv.d7.salvaged[item.itemId]||inv.d7.autoSalvaged[item.itemId])continue;const row=await readOwnedGearD9(target.d9World.ownershipIndex,pid,item.itemId,{sha256,readPage});if(row?.disposition==='DROPPED')inv.renewal.groundBySourceId[id]={item:copyWire(row.item),origin:copyWire(row.origin),position:copyWire(row.location.position),spaceInstanceId:row.location.spaceInstanceId,droppedTick:row.drop.droppedTick,receipt:copyWire(row.drop.receipt)};}
 }
 return {a,b};
}
