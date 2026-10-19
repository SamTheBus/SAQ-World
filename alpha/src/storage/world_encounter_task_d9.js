import {D9_RUNTIME_POLICY as B} from '../shared/content/world_runtime_policy_d9.js';
import {retainedSiteCountsD9} from '../shared/content/alpha_population_retention_v1.js';
import {copyWire} from '../shared/contracts/wire.js';
import {D9_PROFILE as P} from '../shared/content/world_profile_d9.js';
import {localFramePositionD9,projectToLocalFrameD9} from '../shared/contracts/local_world_frames_d9.js';
import {normalizeWorldPosition} from '../shared/contracts/world_address.js';
import {prepareProceduralEncounterD9,admitProceduralEncounterD9,prepareProceduralRenewalD9,applyProceduralRenewalD9} from '../shared/contracts/procedural_encounter_d9.js';
import {worldTransferPatchD9} from '../shared/contracts/world_patch_d9.js';
import {captureWorldPositionsD9} from '../shared/contracts/world_runtime_d9.js';
import {asWorldStreamCaptureD9,validateWorldStreamCaptureD9} from '../shared/contracts/world_stream_capture_d9.js';

// Approach creates the base encounter. The live authority freezes progression
// at its first legitimate activation; pure chunk generation does neither.
export async function prepareWorldEncountersD9(before,{sha256}){
 before=asWorldStreamCaptureD9(before,'encounters');const state=copyWire(before),frames=state.d9World.runtime.frames,placements=[],participants=Object.values(state.playersById).map(p=>{const a=state.entitiesById[p.entityId];return {playerId:p.playerId,alive:a.alive,spaceInstanceId:a.residency.spaceInstanceId,position:a.residency.spaceInstanceId===state.overworldInstanceId?localFramePositionD9(a.position,frames):{chunkX:'0',chunkY:'0',localX:0,localY:0}};});
 const candidates=[];
 for(const chunk of state.d9World.runtime.chunks)for(const anchor of chunk.anchors){const id='ordinary:'+anchor.id.split(':').at(-1),old=state.d9World.episodes[id];if(state.groupsById[id]&&!old?.renewalEligible)continue;
  const world=normalizeWorldPosition({chunkX:chunk.chunkX,chunkY:chunk.chunkY,localX:anchor.position.x,localY:anchor.position.y}),local=projectToLocalFrameD9(world,frames);if(!local)continue;
  const distances=Object.values(state.playersById).map(p=>state.entitiesById[p.entityId]).filter(a=>a.alive&&a.residency.spaceInstanceId===state.overworldInstanceId).map(a=>Math.hypot(a.position.x-local.x,a.position.y-local.y)),distance=Math.min(...distances);
  if(distance<=P.prepareRadius)candidates.push({chunk,anchor,id,world,distance,renewal:Boolean(old)});
 }
 candidates.sort((a,b)=>a.distance-b.distance||a.id.localeCompare(b.id));
 for(const c of candidates){if(placements.length>=2)break;const retained=retainedSiteCountsD9(state);if(!c.renewal&&(state.d9World.runtime.groups.length>=B.proceduralGroups||Object.keys(state.entitiesById).length-retained.actors+2>B.residentActors||Object.keys(state.groupsById).length-retained.groups>=B.residentGroups))continue;
  const options={sha256,participants},plan=await (c.renewal?prepareProceduralRenewalD9(state,c.chunk,c.anchor,options):prepareProceduralEncounterD9(state,c.chunk,c.anchor,options));if(!plan)continue;
  if(c.renewal)applyProceduralRenewalD9(state,plan);else admitProceduralEncounterD9(state,plan);
  placements.push({groupId:c.id,anchor:copyWire(c.world),positions:copyWire(plan.record.placement),renewal:c.renewal});
 }
 captureWorldPositionsD9(state);validateWorldStreamCaptureD9(state,'encounters');return {patch:worldTransferPatchD9(before,state,{placements}),pages:[]};
}
