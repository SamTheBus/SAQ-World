import {localFramePositionD9,projectToLocalFrameD9} from './local_world_frames_d9.js';
import {legacyWorldPosition,relativeWorldPosition} from './world_address.js';
import {requireContract as check} from './wire.js';
import {D9_PROFILE} from '../content/world_profile_d9.js';
import {D9_COLLISION_VERSION} from './paged_collision_d9.js';
// Derived positional proof only. Owned items remain in their authoritative pages.
// Canonical coordinates keep this cache valid through a local frame rebase.
const caches=new WeakMap();
export function groundOccupancyWindowD9(state,p,radius){
 const actor=state.entitiesById[p.entityId],spaceId=actor.residency.spaceInstanceId,c=state.spacesByInstanceId[spaceId].collision;
 if(spaceId!==state.overworldInstanceId&&c.version!==D9_COLLISION_VERSION){
  const width=c.width*c.tileSize,height=c.height*c.tileSize;
  if(Math.hypot(width/2,height/2)+27<=radius)return {center:legacyWorldPosition({x:width/2,y:height/2}),fullSpaceBounds:{width,height}};
 }
 return {center:spaceId===state.overworldInstanceId?localFramePositionD9(actor.position,state.d9World.runtime.frames):legacyWorldPosition(actor.position)};
}
// The existing 367 px placement margin plus the accepted participant reward
// radius must fit inside the prepared window before a gameplay tick can award
// a defeat. This is a derived readiness check, never an empty-ground fallback.
export function groundCoverageReadyD9(state,p){
 if(!state.d9World)return true;
 const actor=state.entitiesById[p.entityId],spaceId=actor.residency.spaceInstanceId;
 if(!state.d9World.groundIndex&&spaceId===state.overworldInstanceId)return true;
 const cache=caches.get(state)?.get(p.playerId);
 if(!cache||cache.spaceInstanceId!==spaceId)return false;
 if(cache.fullSpaceBounds)return actor.position.x>=0&&actor.position.y>=0&&actor.position.x<cache.fullSpaceBounds.width&&actor.position.y<cache.fullSpaceBounds.height;
 const canonical=spaceId===state.overworldInstanceId?localFramePositionD9(actor.position,state.d9World.runtime.frames):legacyWorldPosition(actor.position),relative=relativeWorldPosition(canonical,cache.center,4);
 return Boolean(relative&&Math.hypot(relative.x-cache.center.localX,relative.y-cache.center.localY)<=cache.radius-367-D9_PROFILE.prepareRadius);
}
export function interiorGroundCoverageReadyD9(state){return !state.d9World||Object.values(state.playersById).every(p=>state.entitiesById[p.entityId].residency.spaceInstanceId===state.overworldInstanceId||groundCoverageReadyD9(state,p));}
export function installGroundOccupancyD9(state,coverage){
 const owners=new Map(caches.get(state)??[]);for(const c of coverage){check(state.playersById[c.playerId]&&c.radius>=1200&&c.radius<=1600,'Invalid ground occupancy coverage');
  // Worker proof can finish after an actor changes floors. It cannot replace
  // that actor's valid current-space proof with coverage of the departed space.
  const actor=state.entitiesById[state.playersById[c.playerId].entityId];
  if(c.spaceInstanceId===actor.residency.spaceInstanceId){
   if(c.fullSpaceBounds){const expected=groundOccupancyWindowD9(state,state.playersById[c.playerId],c.radius);check(expected.fullSpaceBounds&&JSON.stringify(expected.fullSpaceBounds)===JSON.stringify(c.fullSpaceBounds)&&JSON.stringify(expected.center)===JSON.stringify(c.center),'Invalid whole-floor occupancy coverage');}
   owners.set(c.playerId,c);
  }
 }
 for(const [id,c] of owners)if(c.spaceInstanceId!==state.entitiesById[state.playersById[id]?.entityId]?.residency.spaceInstanceId)owners.delete(id);
 caches.set(state,owners);
}
export function groundSpacingPredicateD9(state,p,spaceId,point,hot){
 if(!state.d9World)return q=>hot.every(o=>Math.hypot(q.x-o.x,q.y-o.y)>=27);
 // A Fort is a bounded, permanently resident space. Its personal ground gear
 // is already in `hot`; the overworld paging coverage does not cover it.
 if(Object.values(state.d9World.functionalSitesById??{}).some(site=>site.siteKind==='woodland-fort'&&site.spaceInstanceId===spaceId))return q=>hot.every(o=>Math.hypot(q.x-o.x,q.y-o.y)>=27);
 const cache=caches.get(state)?.get(p.playerId),canonical=spaceId===state.overworldInstanceId?localFramePositionD9(point,state.d9World.runtime.frames):legacyWorldPosition(point),relative=cache?.spaceInstanceId===spaceId?relativeWorldPosition(canonical,cache.center,4):null;
 // Missing proof is not empty ground. Restrict placement to proven coverage;
 // never overwrite or delete a distant item to satisfy a local projection cap.
 const wholeFloor=cache?.spaceInstanceId===spaceId&&cache.fullSpaceBounds&&point.x>=0&&point.y>=0&&point.x<cache.fullSpaceBounds.width&&point.y<cache.fullSpaceBounds.height;
 if(state.d9World.groundIndex&&(!relative||!wholeFloor&&Math.hypot(relative.x-cache.center.localX,relative.y-cache.center.localY)>cache.radius-367))return ()=>false;
 const bins=new Map(),add=o=>{const k=Math.floor(o.x/28)+','+Math.floor(o.y/28);let b=bins.get(k);if(!b)bins.set(k,b=[]);b.push(o);};
 if(cache?.spaceInstanceId===spaceId)for(const batch of cache.points)for(const c of batch){const q=spaceId===state.overworldInstanceId?projectToLocalFrameD9(c,state.d9World.runtime.frames):relativeWorldPosition(c,{chunkX:'0',chunkY:'0'},64);if(q)add(q);}
 for(const o of hot)add(o);
 return q=>{const x=Math.floor(q.x/28),y=Math.floor(q.y/28);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)for(const o of bins.get((x+dx)+','+(y+dy))??[])if((q.x-o.x)**2+(q.y-o.y)**2<729)return false;return true;};
}
