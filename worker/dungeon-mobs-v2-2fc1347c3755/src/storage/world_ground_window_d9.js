import {D9_RUNTIME_POLICY as B} from '../shared/content/world_runtime_policy_d9.js';
import {readGroundChunkD9,readGroundCellPageD9,prepareGearIndexD9,installGearIndexD9} from './world_gear_pages_d9.js';
import {prepareGroundResidenceD9,applyGroundResidenceD9} from './world_ground_residency_d9.js';
import {createWorldPageBufferD9} from './world_page_buffer_d9.js';
import {worldTransferPatchD9} from '../shared/contracts/world_patch_d9.js';
import {localFramePositionD9} from '../shared/contracts/local_world_frames_d9.js';
import {legacyWorldPosition,relativeWorldPosition,addressWire} from '../shared/contracts/world_address.js';
import {copyWire} from '../shared/contracts/wire.js';
import {D9_PROFILE as P} from '../shared/content/world_profile_d9.js';
import {asWorldStreamCaptureD9,validateWorldStreamCaptureD9} from '../shared/contracts/world_stream_capture_d9.js';
import {groundOccupancyWindowD9} from '../shared/contracts/world_ground_occupancy_d9.js';

export async function readParticipantGroundWindowD9(state,p,{readPage,sha256,radius=P.projectionRadius,center:requestedCenter=null}){
 const actor=state.entitiesById[p.entityId],spaceInstanceId=actor.residency.spaceInstanceId,actorCenter=spaceInstanceId===state.overworldInstanceId?localFramePositionD9(actor.position,state.d9World.runtime.frames):legacyWorldPosition(actor.position),center=requestedCenter??actorCenter,rows=[];
 if(!state.d9World.groundIndex)return rows;
 for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++){
  const chunkX=addressWire(BigInt(center.chunkX)+BigInt(x)),chunkY=addressWire(BigInt(center.chunkY)+BigInt(y)),left=x*P.chunkWidth-center.localX,top=y*P.chunkHeight-center.localY;
  if(Math.hypot(Math.max(left,-left-P.chunkWidth,0),Math.max(top,-top-P.chunkHeight,0))>radius)continue;
  const chunk=await readGroundChunkD9(state.d9World.groundIndex,{version:'world-ground-chunk-d9-v1',ownerPlayerId:p.playerId,spaceInstanceId,chunkX,chunkY},{readPage,sha256});if(!chunk)continue;
  for(const [ordinal,id] of Object.entries(chunk.cells)){const [cellX,cellY]=ordinal.split(',').map(Number),cx=left+cellX*128,cy=top+cellY*128;if(Math.hypot(Math.max(cx,-cx-128,0),Math.max(cy,-cy-128,0))>radius)continue;
   const cell={version:'world-gear-cell-d9-v1',ownerPlayerId:p.playerId,spaceInstanceId,chunkX,chunkY,cellX,cellY};
   for(const row of await readGroundCellPageD9(id,cell,{readPage,sha256})){const q=relativeWorldPosition(row.location.position,center,4),distance=q?Math.hypot(q.x-center.localX,q.y-center.localY):Infinity;if(distance<=radius){const a=relativeWorldPosition(row.location.position,actorCenter,4);rows.push({row,distance:a?Math.hypot(a.x-actorCenter.localX,a.y-actorCenter.localY):Infinity});}}
  }
 }
 return rows.sort((a,b)=>a.distance-b.distance||a.row.item.itemId.localeCompare(b.row.item.itemId));
}

// Only the nearest bounded interaction projections enter the live inventory.
// All other owned Drops stay on their exact persistent owner/location pages.
export async function prepareGroundWindowD9({state:before,stagedPages=[]},{sha256,readPage}){
 before=asWorldStreamCaptureD9(before,'ground');const state=copyWire(before),buffer=createWorldPageBufferD9({sha256,readPage});buffer.stage(stagedPages);const pageCheckpoint=buffer.capture(),io={sha256,readPage:buffer.readPage},index=await prepareGearIndexD9(state,io);buffer.stage(index.pages);installGearIndexD9(state,index);
 const remove={},load=[],coverage=[];
 for(const p of Object.values(state.playersById)){
  const window=groundOccupancyWindowD9(state,p,B.occupancyRadius),all=await readParticipantGroundWindowD9(state,p,{...io,radius:B.occupancyRadius,center:window.center}),actor=state.entitiesById[p.entityId],spaceInstanceId=actor.residency.spaceInstanceId,points=[];
  for(let i=0;i<all.length;i+=128)points.push(all.slice(i,i+128).map(r=>copyWire(r.row.location.position)));
  coverage.push({playerId:p.playerId,spaceInstanceId,...window,radius:B.occupancyRadius,points});
  const rows=all.filter(r=>r.distance<=P.projectionRadius&&r.row.disposition==='DROPPED').slice(0,B.projectedDropsPerParticipant),selected=new Set(rows.map(r=>r.row.item.sourceEntityId));
  const gone=Object.keys(p.inventory.renewal.groundBySourceId).filter(id=>!selected.has(id));if(gone.length)remove[p.playerId]=gone;
  for(const {row} of rows)if(!p.inventory.renewal.groundBySourceId[row.item.sourceEntityId])load.push({ownerPlayerId:p.playerId,itemId:row.item.itemId});
 }
 // A single handoff stays under the wire/action bound even for four disjoint
 // participants. A subsequent window refresh admits the remaining nearby rows.
 const plan=await prepareGroundResidenceD9(state,{remove,load:load.slice(0,B.groundTransferItems)},io);applyGroundResidenceD9(state,plan);if(Object.keys(remove).length||plan.loaded.length)state.d9World.runtime.revision++;
 validateWorldStreamCaptureD9(state,'ground');return {patch:worldTransferPatchD9(before,state),pages:buffer.captureSince(pageCheckpoint),coverage,more:load.length>B.groundTransferItems};
}
