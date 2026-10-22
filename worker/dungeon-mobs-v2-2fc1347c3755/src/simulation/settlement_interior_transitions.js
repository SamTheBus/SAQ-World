import {floorForSpace,validateTavernResidency} from '../shared/contracts/settlement_interiors.js';
import {tavernFloor,tavernCollision} from '../shared/content/tavern_interior_v1.js';
import {collidesWithTiles} from '../shared/rules/world_geometry.js';
export const CIVILIAN_TRANSITION_PROTECTION_TICKS=18;
export const CIVILIAN_INTERACTION_RADIUS=40;
export function tavernActions(binding,actor,tick){
 if(!actor.alive||tick<(actor.transitionReadyTick??0))return [];
 const floor=floorForSpace(binding,actor.residency?.spaceInstanceId),make=(id,p,label)=>({exitId:binding.identity+':'+id,x:p.x,y:p.y,radius:CIVILIAN_INTERACTION_RADIUS,label,available:true,civilianAction:id});
 if(!floor)return actor.residency?.spaceInstanceId===binding.exteriorSpaceId?[make('enter',binding.frontage,'Tavern · Enter [E]')]:[];
 validateTavernResidency(binding,actor);const f=tavernFloor(floor);
 return floor==='ground'?[make('exit',f.exitAnchor,'Tavern · Exit [E]'),make('up',f.stairAnchor,'Guest rooms · Upstairs [E]')]:[make('down',f.stairAnchor,'Common room · Downstairs [E]')];
}
export function reachableInteraction(actor,action,collision){
 const dx=action.x-actor.position.x,dy=action.y-actor.position.y,d=Math.hypot(dx,dy);
 if(d>action.radius)return false;
 for(let i=0,n=Math.max(1,Math.ceil(d/4));i<=n;i++)if(collidesWithTiles(collision,actor.position.x+dx*i/n,actor.position.y+dy*i/n,actor.hullRadius))return false;
 return true;
}
export function prepareTavernTransition({binding,actor,exitId,tick,exteriorCollision,actors=[]}){
 const floor=floorForSpace(binding,actor.residency?.spaceInstanceId),collision=floor?tavernCollision(floor):exteriorCollision;
 const action=tavernActions(binding,actor,tick).find(a=>a.exitId===exitId);
 if(!action||!reachableInteraction(actor,action,collision))throw new TypeError('Tavern interaction unavailable');
 const targetFloor=action.civilianAction==='enter'?'ground':action.civilianAction==='up'?'upper':action.civilianAction==='down'?'ground':null;
 const targetSpace=targetFloor?binding.floorSpaces[targetFloor]:binding.exteriorSpaceId,targetCollision=targetFloor?tavernCollision(targetFloor):exteriorCollision;
 const base=targetFloor?(action.civilianAction==='down'?tavernFloor('ground').stairArrival:tavernFloor(targetFloor).arrival):binding.frontage;
 // Four nonoverlapping hull slots at the arrival; never move another actor.
 let position=null;for(const [dx,dy] of [[0,0],[-24,0],[24,0],[0,-24],[0,24],[-24,-24],[24,-24],[-24,24],[24,24]]){const p={x:base.x+dx,y:base.y+dy};if(!collidesWithTiles(targetCollision,p.x,p.y,actor.hullRadius)&&!actors.some(a=>a!==actor&&a.alive&&a.residency?.spaceInstanceId===targetSpace&&Math.hypot(a.position.x-p.x,a.position.y-p.y)<a.hullRadius+actor.hullRadius)){position=p;break;}}
 if(!position)throw new TypeError('Tavern arrival occupied');
 return Object.freeze({actorId:actor.entityId,bindingId:binding.identity,fromSpace:actor.residency.spaceInstanceId,fromRevision:actor.residency.residencyRevision,fromPosition:Object.freeze({...actor.position}),toSpace:targetSpace,position:Object.freeze(position),tick,readyTick:tick+CIVILIAN_TRANSITION_PROTECTION_TICKS,visit:targetFloor?Object.freeze({bindingId:binding.identity,exteriorSpaceId:binding.exteriorSpaceId,returnPosition:binding.frontage}):null});
}
// Campaign adapter must commit this validated target through the existing
// authoritative relocation transaction. This local commit is for dev actors.
export function commitLocalTavernTransition(actor,plan,tick){
 if(actor.entityId!==plan.actorId||tick!==plan.tick||actor.residency.spaceInstanceId!==plan.fromSpace||actor.residency.residencyRevision!==plan.fromRevision||actor.position.x!==plan.fromPosition.x||actor.position.y!==plan.fromPosition.y)throw new TypeError('Stale tavern transition');
 actor.position={...plan.position};actor.residency={spaceInstanceId:plan.toSpace,residencyRevision:plan.fromRevision+1};actor.interiorVisit=plan.visit?structuredClone(plan.visit):null;actor.transitionReadyTick=plan.readyTick;actor.movementIntent={x:0,y:0};actor.movedLastTick=false;
}
