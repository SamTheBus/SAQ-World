import {D9_PROFILE as P} from '../content/world_profile_d9.js';
import {projectToLocalFrameD9,localFramePositionD9} from './local_world_frames_d9.js';
import {copyWire,requireContract as check} from './wire.js';
import {assertNoNewActorGeometryFailureD9} from './actor_geometry_d9.js';
const views=new WeakMap();
export function runtimeManifestD9(state,origin){
 const runtime=state.d9World?.runtime;if(!runtime)return origin;let cached=views.get(state);if(cached?.revision===runtime.revision)return cached.manifest;
 const chunks=[...origin.chunks],regions=origin.regions.map(r=>({...r,chunkIds:[...r.chunkIds]}));
 for(const page of runtime.chunks){const p=projectToLocalFrameD9({chunkX:page.chunkX,chunkY:page.chunkY,localX:0,localY:0},runtime.frames);if(!p)continue;const id=page.identity.id,regionId='d9-region:'+page.region.regionX+','+page.region.regionY;
  chunks.push({chunkId:id,areaId:id,origin:{x:p.x,y:p.y},dimensions:{width:P.chunkWidth,height:P.chunkHeight},label:page.region.name,biome:page.region.biome,minimumLevel:copyWire(page.region.minimumLevel)});
  let region=regions.find(r=>r.regionId===regionId);if(!region){region={regionId,label:page.region.name,biome:page.region.biome,minimumLevel:copyWire(page.region.minimumLevel),chunkIds:[],discoveryId:regionId};regions.push(region);}region.chunkIds.push(id);
 }
 const originGroups=(origin.population?.groups??[]).map(g=>state.d9World.originHordes?.groupsById[g.groupId]?.definition??g);
 const siteInteriors=origin.siteInteriors?.map(site=>({...site,groups:site.groups.map(g=>state.d9World.originHordes?.groupsById[g.groupId]?.definition??g)}));
 const next={...origin,chunks,regions,population:{...origin.population,groups:[...originGroups,...runtime.groups]},...(siteInteriors?{siteInteriors}:{}),d9:true};
 // Authority helpers may retain the projection identity while its bounded
 // membership changes. This is derived geometry, never a second campaign fact.
 if(cached){for(const key of Object.keys(cached.manifest))delete cached.manifest[key];Object.assign(cached.manifest,next);cached.revision=runtime.revision;}else{cached={manifest:next,revision:runtime.revision};views.set(state,cached);}return cached.manifest;
}
export function captureWorldPositionsD9(state){const world=state.d9World;if(!world?.runtime)return;const positions={};for(const a of Object.values(state.entitiesById))if(a.residency.spaceInstanceId===state.overworldInstanceId)positions[a.entityId]=copyWire(localFramePositionD9(a.position,world.runtime.frames));world.positions=positions;}
export function rebaseWorldRuntimeD9(state,newFrames){
 const world=state.d9World,runtime=world.runtime,old=runtime.frames;
 const project=p=>{const q=projectToLocalFrameD9(localFramePositionD9(p,old),newFrames);check(q,'Live geometry outside new admitted frame');return {x:q.x,y:q.y};};
 const changes=[];for(const a of Object.values(state.entitiesById))if(a.residency.spaceInstanceId===state.overworldInstanceId)changes.push([a,'position',project(a.position)]);
 for(const p of Object.values(state.playersById))for(const rows of [p.inventory.rewardsByEntityId,p.inventory.renewal.groundBySourceId])for(const value of Object.values(rows))if(value.spaceInstanceId===state.overworldInstanceId)changes.push([value,'position',project(value.position)]);
 for(const p of Object.values(state.playersById))for(const rows of [p.inventory.d7.salvaged,p.inventory.d7.autoSalvaged])for(const value of Object.values(rows))if(value.reward?.spaceInstanceId===state.overworldInstanceId)changes.push([value.reward,'position',project(value.reward.position)]);
 const effects=[...Object.values(state.subweaponCombat.projectiles),...Object.values(state.subweaponCombat.mastery??{}).flatMap(b=>[...Object.values(b.hazards??{}),...Object.values(b.razors??{})])];
 for(const value of effects)if(value.spaceInstanceId===state.overworldInstanceId)changes.push([value,'position',project(value.position)]);
 for(const group of Object.values(state.groupsById))if(group.spaceInstanceId===state.overworldInstanceId&&group.containment){changes.push([group.containment,'homeAnchor',project(group.containment.homeAnchor)]);for(const id of Object.keys(group.containment.memberHomesById))changes.push([group.containment.memberHomesById,id,project(group.containment.memberHomesById[id])]);}
 for(const group of runtime.groups){changes.push([group,'anchor',project(group.anchor)]);for(const member of group.members)changes.push([member,'position',project(member.position)]);}
 for(const resource of runtime.resources)if(resource.spaceInstanceId===state.overworldInstanceId)changes.push([resource,'position',project(resource.position)]);
 // Validate the complete transform before applying any spatial change. No
 // residency change, attack cancellation, rotation reset or VFX reset occurs.
 const proposedActors={...state.entitiesById};for(const [object,key,value] of changes)if(key==='position'&&object.entityId&&state.entitiesById[object.entityId]===object)proposedActors[object.entityId]={...object,position:value};
 const collision={...state.spacesByInstanceId[state.overworldInstanceId].collision,frames:copyWire(newFrames)};
 assertNoNewActorGeometryFailureD9(state,{...state,entitiesById:proposedActors,d9World:{...world,runtime:{...runtime,frames:newFrames}},spacesByInstanceId:{...state.spacesByInstanceId,[state.overworldInstanceId]:{...state.spacesByInstanceId[state.overworldInstanceId],collision}}},{mutation:'local-frame rebase before installation',phase:'residency integration'});
 for(const [object,key,value] of changes)object[key]=value;runtime.frames=copyWire(newFrames);state.spacesByInstanceId[state.overworldInstanceId].collision.frames=copyWire(newFrames);runtime.revision++;captureWorldPositionsD9(state);
}
