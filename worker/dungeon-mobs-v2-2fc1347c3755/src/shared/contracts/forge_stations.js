import {hasServicesV2,serviceNpcsFor} from '../content/settlement_services_v2.js';
import {accessibleServiceNpc} from './settlement_services_v1.js';
import {canonicalStringify,freezeWire,requireContract} from './wire.js';
import {collidesWithTiles} from '../rules/world_geometry.js';
export const FORGE_INTERACTION_RADIUS=48;
const layouts=new WeakMap();
// Additive campaign service content. Existing geography/hash/collision never changes.
// A station and its approach are selected once from the stored town's clear ground.
export function forgeStationLayout(manifest,collision){
 if(layouts.has(manifest))return layouts.get(manifest);
 const stations=manifest.settlements.map(town=>{
  const regions=manifest.safeRegions.filter(r=>r.settlementId===town.settlementId);
  const origin=town.settlementId===manifest.start.settlementId?manifest.start.position:{x:regions[0].x+regions[0].width/2,y:regions[0].y+regions[0].height/2};
  const desired={x:origin.x+160,y:origin.y-64};let best=null;
  for(const r of regions)for(let y=r.y+80;y<r.y+r.height-80;y+=32)for(let x=r.x+80;x<r.x+r.width-80;x+=32){
   if(collidesWithTiles(collision,x,y,64))continue;
   const score=(x-desired.x)**2+(y-desired.y)**2;
   if(!best||score<best.score)best={x,y,score};
  }
  requireContract(best,'Town has no clear Forge service pad');
  return {stationId:'forge:'+town.settlementId,settlementId:town.settlementId,kind:'STATION_FORGE',position:{x:best.x,y:best.y},interaction:{x:best.x+22,y:best.y+40}};
 });
 const result=freezeWire({version:'town-forge-stations-v1',stations});layouts.set(manifest,result);return result;
}
export function validateForgeStations(value,manifest,collision){requireContract(canonicalStringify(value)===canonicalStringify(forgeStationLayout(manifest,collision)),'Forge station content drift');}
export function installForgeStations(state,manifest){state.campaign.forgeStations??=JSON.parse(JSON.stringify(forgeStationLayout(manifest,state.spacesByInstanceId[state.overworldInstanceId].collision)));return state;}
export function nearbyForge(state,p){
 if(hasServicesV2(state.d9World?.plannedWorld)){const n=serviceNpcsFor(state.d9World.plannedWorld).find(n=>n.services?.includes('attune')&&accessibleServiceNpc(state,p,n.id));if(n)return n;}
 const actor=state.entitiesById[p.entityId],primary=state.primary.actorsById[p.entityId];
 if(!actor?.alive||actor.residency.spaceInstanceId!==state.overworldInstanceId||primary?.current||primary?.heldCommandId||primary?.queuedCommandId)return null;
 const c=state.spacesByInstanceId[state.overworldInstanceId].collision;
 return state.campaign.forgeStations?.stations.find(s=>{
  const dx=s.interaction.x-actor.position.x,dy=s.interaction.y-actor.position.y;if(Math.hypot(dx,dy)>FORGE_INTERACTION_RADIUS)return false;
  for(let i=0;i<=8;i++)if(collidesWithTiles(c,actor.position.x+dx*i/8,actor.position.y+dy*i/8,0))return false;
  return true;
 })??null;
}
