import {collisionBlockDetail} from '../rules/world_geometry.js';
import {localFramePositionD9,projectToLocalFrameD9,chunkAddressKey} from './local_world_frames_d9.js';

// A read-only invariant probe. It never moves an actor or repairs a page.
export function invalidActorGeometryD9(state,{actors=state.entitiesById,collisionBySpace=null,mutation=null,phase=null}={}){
 const memberships=new Map();for(const group of Object.values(state.groupsById))for(const id of group.entityIds)memberships.set(id,group);
 const failures=[];
 for(const actor of Object.values(actors)){
  const space=state.spacesByInstanceId[actor.residency.spaceInstanceId],collision=collisionBySpace?.[actor.residency.spaceInstanceId]??space?.collision;
  const block=collision?collisionBlockDetail(collision,actor.position.x,actor.position.y,actor.hullRadius):{reason:'missingSpace'};
  if(!block)continue;
  const group=memberships.get(actor.entityId),frames=state.d9World?.runtime.frames;
  let address=null;try{if(frames&&actor.residency.spaceInstanceId===state.overworldInstanceId)address=localFramePositionD9(actor.position,frames);}catch{}
  const page=address&&state.d9World.runtime.chunks.find(c=>chunkAddressKey(c.chunkX,c.chunkY)===chunkAddressKey(address.chunkX,address.chunkY));
  failures.push({actorId:actor.entityId,ownerCharacterId:actor.ownerCharacterId,team:actor.team,alive:actor.alive,contentDefinitionId:actor.contentDefinitionId,
   groupId:group?.groupId??null,groupCleared:group?.cleared??null,groupLastRequiredTick:group?.lastRequiredTick??null,
   spaceInstanceId:actor.residency.spaceInstanceId,position:{...actor.position},worldAddress:address,hullRadius:actor.hullRadius,
   tile:{x:Math.floor(actor.position.x/(collision?.tileSize??32)),y:Math.floor(actor.position.y/(collision?.tileSize??32))},
   collisionBlockDetail:block,collisionSource:block.source??null,residentPageId:page?.identity.id??null,
   localFrame:address?projectToLocalFrameD9(address,frames)?.frameId??null:null,mutation,saveTick:state.tick,savePhase:phase});
 }
 return failures;
}
export const firstInvalidActorGeometryD9=(state,context)=>invalidActorGeometryD9(state,context)[0]??null;
function throwFault(fault){const error=new Error('Invalid canonical actor geometry: '+JSON.stringify(fault));error.code='WORLD_ACTOR_GEOMETRY_INVALID';error.actorGeometry=fault;throw error;}
export function assertActorGeometryD9(state,context){const fault=firstInvalidActorGeometryD9(state,context);if(fault)throwFault(fault);return true;}
export function assertNoNewActorGeometryFailureD9(before,after,context){
 const baseline=new Map(invalidActorGeometryD9(before).map(f=>[f.actorId,f]));
 for(const fault of invalidActorGeometryD9(after,context)){const old=baseline.get(fault.actorId);if(old&&JSON.stringify(old.position)===JSON.stringify(fault.position)&&JSON.stringify(old.collisionBlockDetail)===JSON.stringify(fault.collisionBlockDetail))continue;throwFault(fault);}
 return true;
}

// A cold release must account for actors that will remain canonical, rather
// than assuming every actor associated with the page is serialized with it.
export function assertReleasedActorFootprintsD9(state,releaseChunks,detachedGroupIds=[],context={}){
 const released=new Set(releaseChunks.map(c=>chunkAddressKey(c.chunkX,c.chunkY)));if(!released.size)return true;
 const detached=new Set(detachedGroupIds.flatMap(id=>state.groupsById[id]?.entityIds??[])),frames=state.d9World.runtime.frames,actors={};
 for(const actor of Object.values(state.entitiesById)){
  if(detached.has(actor.entityId)||actor.residency.spaceInstanceId!==state.overworldInstanceId)continue;
  const r=actor.hullRadius;
  if([actor.position.x-r,actor.position.x+r].some(x=>[actor.position.y-r,actor.position.y+r].some(y=>{const q=localFramePositionD9({x,y},frames);return released.has(chunkAddressKey(q.chunkX,q.chunkY));})))actors[actor.entityId]=actor;
 }
 if(!Object.keys(actors).length)return true;
 const space=state.spacesByInstanceId[state.overworldInstanceId],proposal={...state,
  d9World:{...state.d9World,runtime:{...state.d9World.runtime,chunks:state.d9World.runtime.chunks.filter(c=>!released.has(chunkAddressKey(c.chunkX,c.chunkY))) }},
  spacesByInstanceId:{...state.spacesByInstanceId,[state.overworldInstanceId]:{...space,collision:{...space.collision,pages:space.collision.pages.filter(c=>!released.has(chunkAddressKey(c.chunkX,c.chunkY)))}}}};
 const fault=firstInvalidActorGeometryD9(proposal,{actors,...context});
 if(fault)throwFault(fault);
 // This fallback also rejects a release intersecting an actor when another
 // collision layer happens to mask the missing-page probe.
 const actor=Object.values(actors)[0];throwFault({actorId:actor.entityId,team:actor.team,alive:actor.alive,spaceInstanceId:actor.residency.spaceInstanceId,position:{...actor.position},hullRadius:actor.hullRadius,collisionBlockDetail:{reason:'releasedResidentPageUnderCanonicalActor',pageKeys:[...released]},mutation:context.mutation??null,saveTick:state.tick,savePhase:context.phase??null});
}
