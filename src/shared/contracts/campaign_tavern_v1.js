import {canonicalStringify,closedRecord,copyWire,requireContract as check} from './wire.js';
import {createTavernBinding,floorForSpace} from './settlement_interiors.js';
import {tavernCollision} from '../content/tavern_interior_v1.js';
import {prepareTavernTransition,tavernActions} from '../../simulation/settlement_interior_transitions.js';
import {projectToLocalFrameD9} from './local_world_frames_d9.js';
import {mixPlan} from '../generation/planned_world_foundation_v1.js';
import {PLANNED_TOWN_VERSION,PLANNED_TOWN_START_VERSION,TOWN_START_TILES,PLANNED_TOWN_ID,TOWN_TAVERN,TOWN_FRONTAGE} from '../generation/planned_town_v1.js';
const token=(campaignId,label)=>[0,1,2,3].map(lane=>mixPlan(PLANNED_TOWN_VERSION+'/'+campaignId+'/'+PLANNED_TOWN_ID+'/'+TOWN_TAVERN.id+'/'+label+'/'+lane).toString(16).padStart(8,'0')).join('');
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
export const tavernSpaceIds=s=>Object.values(s.d9World?.settlementInterior?.binding.floorSpaces??{});
export async function installCampaignTavern(s,sha256){
 check(s.d9World.plannedWorld?.townPrototype&&[PLANNED_TOWN_VERSION,PLANNED_TOWN_START_VERSION].includes(s.d9World.plannedWorld.townPrototype)&&!s.d9World.settlementInterior,'Tavern installation requires opted-in genesis');
 const digest=async label=>token(s.campaign.campaignId,label);
 const binding=copyWire(createTavernBinding({campaignId:s.campaign.campaignId,settlementId:PLANNED_TOWN_ID,buildingId:TOWN_TAVERN.id,exteriorSpaceId:s.overworldInstanceId,frontage:{x:0,y:0},exteriorDimensions:[14,12]}));
 binding.frontage=copyWire(TOWN_FRONTAGE); // Permanent plan tile; projected at interaction time.
 const floorLogicalIds={};for(const floor of ['ground','upper']){binding.floorSpaces[floor]='spi:'+await digest(floor);floorLogicalIds[floor]='spc:'+await digest('logical/'+floor);s.spacesByInstanceId[binding.floorSpaces[floor]]={spaceId:floorLogicalIds[floor],spaceInstanceId:binding.floorSpaces[floor],spaceRevision:1,collision:copyWire(tavernCollision(floor))};}
 s.d9World.settlementInterior={version:PLANNED_TOWN_VERSION,siteId:'loc:'+await digest('entrance'),binding,floorLogicalIds};
}
export function campaignTavernBinding(s){
 const record=s.d9World?.settlementInterior;if(!record)return null;
 const a=record.binding.frontage,frontage=projectToLocalFrameD9({chunkX:String(1024+Math.floor(a.x/32)),chunkY:String(1024+Math.floor(a.y/26)),localX:(a.x%32+.5)*32,localY:(a.y%26+.5)*32},s.d9World.runtime.frames);
 return {...record.binding,frontage:frontage??{x:-100000,y:-100000}};
}
function adapterActor(s,a,binding){const floor=floorForSpace(binding,a.residency.spaceInstanceId),residence=s.residencyHistoryByEntityId[a.entityId][a.residency.residencyRevision];return {...a,transitionReadyTick:a.residency.residencyRevision>1?residence.tick+18:0,interiorVisit:floor?{bindingId:binding.identity,exteriorSpaceId:binding.exteriorSpaceId,returnPosition:binding.frontage}:null};}
export function campaignTavernTarget(s,a,payload){
 const record=s.d9World?.settlementInterior;if(!record||payload.siteId!==record.siteId||s.primary.actorsById[a.entityId]?.current)return null;
 const b=campaignTavernBinding(s),action=payload.direction==='enter'?'enter':payload.direction==='exit'?'exit':payload.direction;
 if(!['enter','exit','up','down'].includes(action)||(['up','down'].includes(action)&&payload.transitionId!==record.siteId+':'+action))return null;
 try{const plan=prepareTavernTransition({binding:b,actor:adapterActor(s,a,b),exitId:b.identity+':'+action,tick:s.tick,exteriorCollision:s.spacesByInstanceId[s.overworldInstanceId].collision,actors:Object.values(s.entitiesById)});return {spaceInstanceId:plan.toSpace,position:plan.position,civilian:true};}catch{return null;}
}
export function campaignTavernExits(s,a){const r=s.d9World?.settlementInterior;if(!r)return [];const b=campaignTavernBinding(s);return tavernActions(b,adapterActor(s,a,b),s.tick).map(q=>{const direction=q.civilianAction==='enter'?'enter':q.civilianAction==='exit'?'exit':q.civilianAction,payload={siteId:r.siteId,direction,...(['up','down'].includes(direction)?{transitionId:r.siteId+':'+direction}:{})};return {...q,siteAction:payload,available:Boolean(campaignTavernTarget(s,a,payload)),siteKind:'civilian-tavern'};});}
export function validateCampaignTavern(s){
 const r=s.d9World?.settlementInterior,enabled=s.d9World?.plannedWorld?.townPrototype&&[PLANNED_TOWN_VERSION,PLANNED_TOWN_START_VERSION].includes(s.d9World.plannedWorld.townPrototype);check(Boolean(r)===Boolean(enabled),'Tavern genesis binding missing or unsolicited');if(!r)return;
 if(s.d9World.plannedWorld.townPrototype===PLANNED_TOWN_START_VERSION){const a=TOWN_START_TILES[0],expected={chunkX:String(1024+Math.floor(a.x/32)),chunkY:String(1024+Math.floor(a.y/26)),localX:(a.x%32+.5)*32,localY:(a.y%26+.5)*32};check(same(s.d9World.plannedStart,expected),'Town campaign start drift');}
 closedRecord(r,['version','siteId','binding','floorLogicalIds']);const b=r.binding;
 check(r.version===PLANNED_TOWN_VERSION&&r.siteId==='loc:'+token(s.campaign.campaignId,'entrance')&&b.campaignId===s.campaign.campaignId&&b.settlementId===PLANNED_TOWN_ID&&b.buildingId===TOWN_TAVERN.id&&b.exteriorSpaceId===s.overworldInstanceId&&same(b.frontage,TOWN_FRONTAGE),'Tavern exterior identity drift');
 const expected=createTavernBinding({campaignId:b.campaignId,settlementId:b.settlementId,buildingId:b.buildingId,exteriorSpaceId:b.exteriorSpaceId,frontage:b.frontage,exteriorDimensions:[14,12]});
 check(b.identity===expected.identity&&b.version===expected.version&&b.recipeVersion===expected.recipeVersion&&Object.keys(b).sort().join(',')===Object.keys(expected).sort().join(','),'Tavern recipe/binding drift');
 closedRecord(b.floorSpaces,['ground','upper']);closedRecord(r.floorLogicalIds,['ground','upper']);check(new Set(Object.values(b.floorSpaces)).size===2,'Tavern duplicate floor');
 for(const f of ['ground','upper']){check(b.floorSpaces[f]==='spi:'+token(s.campaign.campaignId,f)&&r.floorLogicalIds[f]==='spc:'+token(s.campaign.campaignId,'logical/'+f),'Tavern deterministic floor identity drift');const space=s.spacesByInstanceId[b.floorSpaces[f]];check(space&&space.spaceId===r.floorLogicalIds[f]&&same(space.collision,tavernCollision(f)),'Tavern floor geometry drift');}
}
