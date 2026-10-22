import {copyWire,requireContract as check} from '../shared/contracts/wire.js';
import {captureChunkDeltaD9,detachableProceduralGroupIdsD9} from '../shared/contracts/world_chunk_delta_d9.js';
import {attachChunkRuntimeD9,detachChunksRuntimeD9} from '../shared/contracts/world_paging_d9.js';
import {createWorldPageBufferD9} from './world_page_buffer_d9.js';
import {prepareGearIndexD9,installGearIndexD9} from './world_gear_pages_d9.js';
import {prepareGearKnowledgeD9,installGearKnowledgeD9} from './world_gear_knowledge_d9.js';
import {prepareGroundResidenceD9,applyGroundResidenceD9} from './world_ground_residency_d9.js';
import {worldTransferPatchD9} from '../shared/contracts/world_patch_d9.js';
import {asWorldStreamCaptureD9,validateWorldStreamCaptureD9} from '../shared/contracts/world_stream_capture_d9.js';
import {localFramePositionD9} from '../shared/contracts/local_world_frames_d9.js';
import {assertNoNewActorGeometryFailureD9,assertReleasedActorFootprintsD9} from '../shared/contracts/actor_geometry_d9.js';
import {prepareChunkDeadlinesD9} from './world_deadlines_d9.js';

// Bounded cold preparation only. The calling host applies the returned guarded
// patch to its current authority; neither this task nor generation advances time.
export async function prepareWorldResidencyD9(request,{sha256,readPage}){
 const {release=[],admit=[],stagedPages=[]}=request,before=asWorldStreamCaptureD9(request.state,'residency');check(release.length+admit.length<=8,'World residency batch bound');
 for(const fort of Object.values(before.d9World.functionalSitesById??{}).filter(site=>site.version==='functional-site-d10-compound-v1')){
  const keys=new Set(fort.compound.pages.map(page=>page.chunkX+','+page.chunkY));
  const current=before.d9World.runtime.chunks.filter(chunk=>keys.has(chunk.chunkX+','+chunk.chunkY));
  const removed=current.filter(chunk=>release.includes(chunk.identity.id));
  const added=admit.filter(chunk=>keys.has(chunk.chunkX+','+chunk.chunkY));
  check(current.length===0||current.length===keys.size,'Partial Fort parcel before handoff');
  check(removed.length===0||removed.length===keys.size,'Partial Fort parcel release');
  check(added.length===0||added.length===keys.size,'Partial Fort parcel admission');
 }
 const releaseChunks=release.map(id=>{const chunk=before.d9World.runtime.chunks.find(c=>c.identity.id===id);check(chunk,'Released terrain not resident');return chunk;}),detachmentInventory=new Map(releaseChunks.map(chunk=>[chunk.identity.id,detachableProceduralGroupIdsD9(before,chunk)]));
 const detaching=releaseChunks.flatMap(chunk=>detachmentInventory.get(chunk.identity.id));
 assertReleasedActorFootprintsD9(before,releaseChunks,detaching,{mutation:'cold residency release preflight',phase:'worker preparation'});
 const state=copyWire(before),buffer=createWorldPageBufferD9({readPage,sha256});buffer.stage(stagedPages);const pageCheckpoint=buffer.capture();
 const index=await prepareGearIndexD9(state,{readPage:buffer.readPage,sha256});buffer.stage(index.pages);installGearIndexD9(state,index);
 const releasedGroupIds=[],remove={};
 for(const id of release){const chunk=state.d9World.runtime.chunks.find(c=>c.identity.id===id);check(chunk,'Released terrain not resident');for(const p of Object.values(state.playersById))for(const [source,d] of Object.entries(p.inventory.renewal.groundBySourceId))if(d.spaceInstanceId===state.overworldInstanceId){const pos=localFramePositionD9(d.position,state.d9World.runtime.frames);if(pos.chunkX===chunk.chunkX&&pos.chunkY===chunk.chunkY)(remove[p.playerId]??=[]).push(source);}}
 if(Object.keys(remove).length){const ground=await prepareGroundResidenceD9(state,{remove},{sha256,readPage:buffer.readPage});applyGroundResidenceD9(state,ground);}
 // Actor/group ownership was proven against the immutable request before any
 // mutation. Capture each final page delta once, after deliberate Drops have
 // moved to their sparse ownership pages, and use that same delta to prepare
 // and detach the chunk.
 const releaseDeltas=new Map(releaseChunks.map(chunk=>[chunk.identity.id,captureChunkDeltaD9(state,chunk)]));
 for(const chunk of releaseChunks)check(JSON.stringify(releaseDeltas.get(chunk.identity.id).encounters.map(e=>e.group.groupId).sort())===JSON.stringify(detachmentInventory.get(chunk.identity.id)),'Chunk encounter inventory changed during ground handoff');
 // Build the complete sparse-page transaction first. Batch detachment removes
 // every captured actor/group before removing any of the released collision
 // pages, including corpses that died outside their encounter home chunk.
 const transfers=[];let regionRoot=state.d9World.regionIndex;
 for(const id of release){const chunk=state.d9World.runtime.chunks.find(c=>c.identity.id===id),delta=releaseDeltas.get(id),prepared=await buffer.prepareChunk(regionRoot,delta),deadlines=await prepareChunkDeadlinesD9(state.d9World.deadlineIndex,delta,{sha256,readPage:buffer.readPage});buffer.stage([...prepared.pages,...deadlines.pages]);regionRoot=prepared.root;state.d9World.deadlineIndex=deadlines.root;releasedGroupIds.push(...delta.encounters.map(e=>e.group.groupId));transfers.push({chunk,delta,prepared});}
 if(transfers.length)detachChunksRuntimeD9(state,transfers);
 for(const chunk of admit){const delta=await buffer.readChunk(state.d9World.regionIndex,chunk);attachChunkRuntimeD9(state,chunk,delta);}
 const knowledge=await prepareGearKnowledgeD9(state,{sha256,readPage:buffer.readPage});installGearKnowledgeD9(state,knowledge);assertNoNewActorGeometryFailureD9(before,state,{mutation:'cold residency admission/release',phase:'worker preparation'});validateWorldStreamCaptureD9(state,'residency');
 return {patch:worldTransferPatchD9(before,state,{releasedGroupIds}),pages:buffer.captureSince(pageCheckpoint)};
}
