import {copyWire,canonicalStringify,closedRecord,requireContract as check} from './wire.js';
import {captureWorldPositionsD9} from './world_runtime_d9.js';
import {proceduralGroupPinnedD9} from './world_chunk_delta_d9.js';
import {localFramePositionD9} from './local_world_frames_d9.js';
import {relativeWorldPosition} from './world_address.js';
import {D9_PROFILE as P} from '../content/world_profile_d9.js';
import {assertNoNewActorGeometryFailureD9,assertReleasedActorFootprintsD9} from './actor_geometry_d9.js';
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b),record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const transferRoots=['d9World','entitiesById','groupsById','encounterEconomy','spacesByInstanceId','playersById'];
const pack=(value,exists)=>exists?{exists:true,value:copyWire(value)}:{exists:false};
const revisionGuardedBulkPath=path=>(path[0]==='d9World'&&path[1]==='runtime'&&['chunks','groups','resources'].includes(path[2]))||(path[0]==='spacesByInstanceId'&&path.at(-2)==='collision'&&path.at(-1)==='pages');
// Worker preparation yields a compare-and-apply patch, never a replacement live
// simulation. Unrelated ticks, inputs, live actors and combat remain current.
export function worldTransferPatchD9(before,after,{releasedGroupIds=[],placements=[],coldGroups=[]}={}){
 const changes=[];
 function visit(a,b,path,aExists=true,bExists=true){
  if(path.length===2&&path[0]==='d9World'&&path[1]==='positions')return;
  if(aExists&&bExists&&same(a,b))return;
  if(aExists&&bExists&&record(a)&&record(b)){for(const key of new Set([...Object.keys(a),...Object.keys(b)]))visit(a[key],b[key],[...path,key],Object.hasOwn(a,key),Object.hasOwn(b,key));}
  else changes.push({path,before:pack(a,aExists),after:pack(b,bExists)});
 }
 for(const root of transferRoots)visit(before[root],after[root],[root]);
 check(changes.length<=256,'World transfer needs a smaller prepared batch');
 return {version:'world-transfer-patch-d9-v1',campaignId:before.campaign.campaignId,runtimeRevision:before.d9World.runtime.revision,frames:copyWire(before.d9World.runtime.frames),revisions:Object.fromEntries(Object.values(before.playersById).map(p=>[p.playerId,p.inventory.revision])),releasedGroupIds:[...releasedGroupIds],placements:copyWire(placements),coldGroups:[...coldGroups],changes};
}
export function applyWorldTransferPatchD9(state,patch){
 closedRecord(patch,['version','campaignId','runtimeRevision','frames','revisions','releasedGroupIds','placements','coldGroups','changes']);check(patch.version==='world-transfer-patch-d9-v1'&&patch.campaignId===state.campaign.campaignId&&patch.runtimeRevision===state.d9World.runtime.revision&&same(patch.frames,state.d9World.runtime.frames),'World transfer campaign/frame changed during preparation');
 for(const [pid,revision] of Object.entries(patch.revisions))check(state.playersById[pid]?.inventory.revision===revision,'Inventory changed during world preparation');
 for(const id of patch.releasedGroupIds)check(!proceduralGroupPinnedD9(state,id),'Combat now pins a prepared eviction');
 for(const id of patch.coldGroups)check(!state.groupsById[id],'Cold encounter residency changed during preparation');
 for(const placement of patch.placements){
  closedRecord(placement,['groupId','anchor','positions','renewal']);check(placement.positions.length===2,'Prepared placement composition changed');
  const participants=Object.values(state.playersById).map(p=>state.entitiesById[p.entityId]).filter(a=>a.residency.spaceInstanceId===state.overworldInstanceId).map(a=>({alive:a.alive,position:localFramePositionD9(a.position,state.d9World.runtime.frames)}));
  const distance=(a,b)=>{const q=relativeWorldPosition(a,b,4);return q?Math.hypot(q.x-b.localX,q.y-b.localY):Infinity;};
  check(participants.some(p=>p.alive&&distance(p.position,placement.anchor)<=P.prepareRadius)&&placement.positions.every(q=>participants.every(p=>distance(q,p.position)>=P.placementSafetyRadius)),'Participant approach/safe placement changed');
 }
 const targets=[];
 for(const change of patch.changes){closedRecord(change,['path','before','after']);check(Array.isArray(change.path)&&change.path.length>0&&change.path.length<=24&&transferRoots.includes(change.path[0])&&change.path.every(k=>typeof k==='string'&&!['__proto__','prototype','constructor'].includes(k)),'Invalid world transfer path');
  let parent=state;for(const key of change.path.slice(0,-1)){check(parent&&Object.hasOwn(parent,key),'World transfer parent disappeared');parent=parent[key];}const key=change.path.at(-1),exists=Object.hasOwn(parent,key),bulk=revisionGuardedBulkPath(change.path);check(exists===change.before.exists&&(!exists||bulk||same(parent[key],change.before.value)),'World state changed during preparation');targets.push({parent,key,after:change.after,bulk});
 }
 // Every dependency is checked before any field is installed. A stale job is a
 // retryable cold preparation, never a partial ownership or geography change.
 // Worker messages already cross a structured-clone boundary. Bulk immutable
 // residency arrays are guarded by runtimeRevision, so serializing and cloning
 // their complete bounded window again on the live thread adds no safety.
 const values=targets.map(t=>t.after.exists?(t.bulk?t.after.value:copyWire(t.after.value)):null);
 // Validate geometry against the whole proposed actor/page replacement before
 // touching live authority. A returning page may be valid in isolation yet
 // collide with an actor that remained live while the Worker prepared it.
 const geometryChanges=patch.changes.filter(c=>c.path[0]==='entitiesById'||c.path[0]==='spacesByInstanceId');
 if(geometryChanges.length){
  const proposal={...state,entitiesById:{...state.entitiesById},spacesByInstanceId:{...state.spacesByInstanceId}};
  for(const change of geometryChanges){let parent=proposal;const path=change.path;
   for(const key of path.slice(0,-1)){if(parent[key]===undefined)break;parent[key]=Array.isArray(parent[key])?[...parent[key]]:{...parent[key]};parent=parent[key];}
   if(change.after.exists)parent[path.at(-1)]=change.after.value;else delete parent[path.at(-1)];
  }
  const oldPages=state.spacesByInstanceId[state.overworldInstanceId].collision.pages,newPages=proposal.spacesByInstanceId[state.overworldInstanceId].collision.pages;
  const retained=new Set(newPages.map(p=>p.chunkX+','+p.chunkY)),released=oldPages.filter(p=>!retained.has(p.chunkX+','+p.chunkY));
  // Recheck the current live footprint against the exact prepared detachment
  // inventory. Movement, death, or a capture mismatch makes this job stale;
  // the guarded patch is retried and no page is removed.
  try{assertReleasedActorFootprintsD9(state,released,patch.releasedGroupIds,{mutation:'live actor footprint changed during prepared eviction',phase:'residency integration'});}
  catch(error){if(error.code!=='WORLD_ACTOR_GEOMETRY_INVALID')throw error;const stale=new Error('World actor footprint changed during prepared eviction');stale.code='WORLD_TRANSFER_STALE';stale.actorGeometry=error.actorGeometry;throw stale;}
  assertReleasedActorFootprintsD9(proposal,released,[],{mutation:'prepared world release before installation',phase:'residency integration'});
  assertNoNewActorGeometryFailureD9(state,proposal,{mutation:'prepared world transfer before installation',phase:'residency integration'});
 }
 for(let i=0;i<targets.length;i++){const {parent,key,after}=targets[i];if(after.exists)parent[key]=values[i];else delete parent[key];}
 for(const p of patch.placements){state.encounterEconomy.groups[p.groupId].startedTick=state.tick;if(p.renewal)state.d9World.episodes[p.groupId].renewalReceipt.renewedTick=state.tick;}
 captureWorldPositionsD9(state);return true;
}
