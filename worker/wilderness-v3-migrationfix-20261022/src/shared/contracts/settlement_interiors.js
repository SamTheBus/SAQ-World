import {TAVERN_INTERIOR_V1,tavernCollision} from '../content/tavern_interior_v1.js';
import {collidesWithTiles} from '../rules/world_geometry.js';
export const SETTLEMENT_INTERIOR_VERSION='settlement-interior-binding-v1';
// Caller supplies permanent campaign/settlement/building identities and a real
// exterior frontage. The recipe never chooses a campaign or preview location.
export function createTavernBinding({campaignId,settlementId,buildingId,exteriorSpaceId,frontage,exteriorDimensions}){
 for(const id of [campaignId,settlementId,buildingId,exteriorSpaceId])if(typeof id!=='string'||!id||id.length>256)throw new TypeError('Invalid binding identity');
 if(exteriorDimensions?.[0]!==14||exteriorDimensions?.[1]!==12||!Number.isFinite(frontage?.x)||!Number.isFinite(frontage?.y))throw new TypeError('Invalid fitted tavern exterior');
 const identity=JSON.stringify([SETTLEMENT_INTERIOR_VERSION,campaignId,settlementId,buildingId]),floorSpaces=Object.freeze(Object.fromEntries(['ground','upper'].map(id=>[id,'settlement-interior:'+identity+':'+id])));
 return Object.freeze({version:SETTLEMENT_INTERIOR_VERSION,recipeVersion:TAVERN_INTERIOR_V1.version,campaignId,settlementId,buildingId,exteriorSpaceId,frontage:Object.freeze({...frontage}),floorSpaces,identity});
}
export function floorForSpace(binding,id){return Object.keys(binding.floorSpaces).find(f=>binding.floorSpaces[f]===id)??null;}
export function validateTavernResidency(binding,actor){
 const floor=floorForSpace(binding,actor.residency?.spaceInstanceId);
 if(!floor||actor.interiorVisit?.bindingId!==binding.identity||actor.interiorVisit?.exteriorSpaceId!==binding.exteriorSpaceId||actor.interiorVisit?.returnPosition?.x!==binding.frontage.x||actor.interiorVisit?.returnPosition?.y!==binding.frontage.y||collidesWithTiles(tavernCollision(floor),actor.position.x,actor.position.y,actor.hullRadius))throw new TypeError('Invalid tavern residency/return binding');
 return floor;
}
