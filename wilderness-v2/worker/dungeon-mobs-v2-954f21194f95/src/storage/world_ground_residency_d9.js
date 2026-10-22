import {readOwnedGearD9} from './world_gear_pages_d9.js';
import {prepareGearKnowledgeD9,installGearKnowledgeD9} from './world_gear_knowledge_d9.js';
import {copyWire,canonicalStringify,requireContract as check,safeInteger} from '../shared/contracts/wire.js';
import {projectToLocalFrameD9,localFramePositionD9} from '../shared/contracts/local_world_frames_d9.js';
import {relativeWorldPosition,legacyWorldPosition} from '../shared/contracts/world_address.js';
import {collidesWithTiles} from '../shared/rules/world_geometry.js';
import {pruneColdOriginsD9} from '../shared/contracts/world_paging_d9.js';
import {D9_PROFILE} from '../shared/content/world_profile_d9.js';
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);

// Ground residency transfers an existing owned item between its sparse page and
// a bounded local interaction projection. It never acts as a pickup command.
export async function prepareGroundResidenceD9(state,{remove={},load=[]},{sha256,readPage}){
 check(load.length<=256&&new Set(load.map(r=>r.ownerPlayerId+'\u0000'+r.itemId)).size===load.length,'Ground projection request bound/duplicate');const roots={ownership:state.d9World.ownershipIndex,ground:state.d9World.groundIndex},removed={},loaded=[];
 for(const [pid,ids] of Object.entries(remove)){const p=state.playersById[pid];check(p&&ids.length<=256&&new Set(ids).size===ids.length,'Unknown ground owner/duplicate removal');removed[pid]={};for(const id of ids){const d=p.inventory.renewal.groundBySourceId[id];check(d,'Ground item already absent');const row=await readOwnedGearD9(roots.ownership,pid,d.item.itemId,{readPage,sha256}),location={spaceInstanceId:d.spaceInstanceId,position:d.spaceInstanceId===state.overworldInstanceId?localFramePositionD9(d.position,state.d9World.runtime.frames):legacyWorldPosition(d.position)};check(row?.disposition==='DROPPED'&&same(row.item,d.item)&&same(row.origin,d.origin)&&same(row.location,location)&&same(row.drop.receipt,d.receipt),'Ground item must reach its ownership page before eviction');removed[pid][id]=copyWire(d);}}
 for(const {ownerPlayerId:pid,itemId} of load){const p=state.playersById[pid];check(p,'Unknown ground owner');const row=await readOwnedGearD9(roots.ownership,pid,itemId,{sha256,readPage});if(!row||row.disposition!=='DROPPED')continue;
  const i=p.inventory,id=row.item.sourceEntityId;if(i.renewal.groundBySourceId[id])continue;check(!i.itemsById[itemId]&&!i.d7.salvaged[itemId]&&!i.d7.autoSalvaged[itemId],'Ground item already resolved in live authority');
  const actor=state.entitiesById[p.entityId],space=row.location.spaceInstanceId,projected=space===state.overworldInstanceId?projectToLocalFrameD9(row.location.position,state.d9World.runtime.frames):relativeWorldPosition(row.location.position,{chunkX:'0',chunkY:'0'},64);
  check(projected&&actor.residency.spaceInstanceId===space&&Math.hypot(actor.position.x-projected.x,actor.position.y-projected.y)<=D9_PROFILE.projectionRadius,'Ground item outside owner interest');const position={x:projected.x,y:projected.y};check(!collidesWithTiles(state.spacesByInstanceId[space].collision,position.x,position.y,0),'Ground item outside admitted geometry');
  if(!state.groupsById[row.origin.groupId]&&row.origin.groupId&&!row.origin.archive)check(row.sourceGeography,'Cold ground source lacks geography provenance');
  loaded.push({pid,row:copyWire(row),drop:{item:copyWire(row.item),origin:copyWire(row.origin),position,spaceInstanceId:space,droppedTick:row.drop.droppedTick,receipt:copyWire(row.drop.receipt)}});
 }
 const knowledge=await prepareGearKnowledgeD9(state,{readPage,sha256,excludingGround:remove});
 for(const p of Object.values(state.playersById)){const n=Object.keys(p.inventory.renewal.groundBySourceId).length-Object.keys(removed[p.playerId]??{}).length+loaded.filter(r=>r.pid===p.playerId).length;check(n<=128,'Ground projection needs a smaller local page');}
 return {roots,removed,loaded,knowledge,frames:canonicalStringify(state.d9World.runtime.frames)};
}
export function applyGroundResidenceD9(state,plan){
 check(state.d9World.ownershipIndex===plan.roots.ownership&&state.d9World.groundIndex===plan.roots.ground&&canonicalStringify(state.d9World.runtime.frames)===plan.frames,'Ground residency context changed');
 for(const [pid,rows] of Object.entries(plan.removed))for(const [id,d] of Object.entries(rows))check(same(state.playersById[pid].inventory.renewal.groundBySourceId[id],d),'Ground item changed before eviction');
 // Construct the bounded bookkeeping before making any ownership projection change.
 const obligations=copyWire(plan.knowledge.coldObligations),origins=copyWire(state.d9World.paging.originsByGroup);
 for(const {pid,row} of plan.loaded){const gid=row.origin.groupId;if(obligations[gid])obligations[gid][pid]=safeInteger(obligations[gid][pid]-1);if(gid&&!state.groupsById[gid]&&!row.origin.archive){const g=row.sourceGeography;origins[gid]={groupId:gid,episode:Math.max(origins[gid]?.episode??0,row.origin.episode),rank:g.rank,chunkX:g.chunkX,chunkY:g.chunkY,anchorOrdinal:g.anchorOrdinal,entityIds:[...g.entityIds]};}}
 installGearKnowledgeD9(state,plan.knowledge);state.d9World.paging.coldObligations=obligations;state.d9World.paging.originsByGroup=origins;
 for(const [pid,rows] of Object.entries(plan.removed))for(const id of Object.keys(rows))delete state.playersById[pid].inventory.renewal.groundBySourceId[id];
 for(const {pid,row,drop} of plan.loaded){state.playersById[pid].inventory.renewal.groundBySourceId[row.item.sourceEntityId]=copyWire(drop);delete state.d9World.paging.remoteGearByPlayer[pid][row.item.itemId];}
 pruneColdOriginsD9(state);
}
