import {FERRY_NETWORK,hasFerries} from '../content/ferry_plan_v1.js';
import {localFramePositionD9,projectToLocalFrameD9} from './local_world_frames_d9.js';
import {collidesWithTiles} from '../rules/world_geometry.js';
const address=p=>({chunkX:String(1024+Math.floor(p.x/32)),chunkY:String(1024+Math.floor(p.y/26)),localX:(p.x%32+.5)*32,localY:(p.y%26+.5)*32});
export const ferryLanding=id=>FERRY_NETWORK.landings.find(l=>l.id===id);
export const ferryConnections=id=>FERRY_NETWORK.connections.flatMap(e=>e.from===id?[ferryLanding(e.to)]:e.to===id?[ferryLanding(e.from)]:[]);
export function ferrySourceEligible(s,actor,payload){
 if(!hasFerries(s.d9World?.plannedWorld)||!actor?.alive||actor.residency.spaceInstanceId!==s.overworldInstanceId||s.primary.actorsById[actor.entityId].current)return false;
 const from=ferryLanding(payload.fromLandingId),to=ferryLanding(payload.toLandingId);if(!from||!to||!ferryConnections(from.id).includes(to))return false;
 const p=localFramePositionD9(actor.position,s.d9World.runtime.frames),q=address(from.tile);
 return Math.hypot(Number(BigInt(p.chunkX)-BigInt(q.chunkX))*1024+p.localX-q.localX,Number(BigInt(p.chunkY)-BigInt(q.chunkY))*832+p.localY-q.localY)<=80;
}
export function ferryTravelTarget(s,actor,payload){
 if(!ferrySourceEligible(s,actor,payload))return null;
 const destination=ferryLanding(payload.toLandingId),players=[...s.session.playerIds].sort(),pid=players.find(id=>s.playersById[id].entityId===actor.entityId),index=players.indexOf(pid);
 for(let i=0;i<destination.arrivals.length;i++){
  const world=address(destination.arrivals[(index+i)%destination.arrivals.length]),local=projectToLocalFrameD9(world,s.d9World.runtime.frames);if(!local||collidesWithTiles(s.spacesByInstanceId[s.overworldInstanceId].collision,local.x,local.y,actor.hullRadius))continue;
  if(Object.values(s.entitiesById).some(a=>a.entityId!==actor.entityId&&a.alive&&a.residency.spaceInstanceId===s.overworldInstanceId&&Math.hypot(a.position.x-local.x,a.position.y-local.y)<a.hullRadius+actor.hullRadius+4))continue;
  return {spaceInstanceId:s.overworldInstanceId,position:{x:local.x,y:local.y},world};
 }
 return null;
}
export function ferryExits(s,actor){
 if(!hasFerries(s.d9World?.plannedWorld)||actor.residency.spaceInstanceId!==s.overworldInstanceId)return [];
 return FERRY_NETWORK.landings.flatMap(l=>{const p=projectToLocalFrameD9(address(l.tile),s.d9World.runtime.frames),boat=projectToLocalFrameD9(address(l.water),s.d9World.runtime.frames);if(!p||Math.hypot(actor.position.x-p.x,actor.position.y-p.y)>1000)return [];
  return [{exitId:l.id,ferryLandingId:l.id,siteKind:'ferry-landing',x:p.x,y:p.y,boat:boat?{x:boat.x,y:boat.y}:null,facing:l.facing,radius:80,available:actor.alive&&!s.primary.actorsById[actor.entityId].current,label:'Ferry · '+l.name,destinations:ferryConnections(l.id).map(d=>({id:d.id,name:d.name,biome:d.biomeId.replace('biome:',''),band:d.band}))}];});
}
export const ferryArrivalAddress=id=>address(ferryLanding(id).arrivals[0]);

export function ferryPreparationChunks(id){const p=ferryArrivalAddress(id),rows=[];for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++)rows.push({chunkX:String(BigInt(p.chunkX)+BigInt(x)),chunkY:String(BigInt(p.chunkY)+BigInt(y))});return rows;}
