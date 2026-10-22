import {NATURAL_CLUSTER_VERSION} from './natural_clusters_v1.js';
import {PLANNED_CAVE_VERSION,PLANNED_CAVE_SOCKET,PLANNED_CAVE_PARCEL,PLANNED_CAVE_RESERVATION,PLANNED_CAVE_ID,PLANNED_CAVE_TIERS} from '../content/planned_cave_policy_v1.js';
import {WOODLAND_CAVE_EXTERIOR as E} from '../content/woodland_cave_d10.js';
import {WOODLAND_CAVE_FAMILY_ID,WOODLAND_CAVE_FAMILY_PACKAGE_ID} from '../content/site_families_d12.js';
import {createPlannedTerrain,tileAddress,PLANNED_WORLD_VERSION,PLANNED_ADDRESS_OFFSET,BIOME_CODES} from './planned_world_foundation_v1.js';
import {deriveWoodlandCaveIdentityD12_2} from './woodland_cave_family_d12_2.js';
import {worldIdentity} from './world_identity_d9.js';
import {regionAddress} from '../contracts/world_address.js';
import {freezeWire,copyWire,requireContract as check} from '../contracts/wire.js';

// Physical placement is a realization WITHIN an existing reservation, never a
// placement search in legacy origin space. The exterior tier does not grow.
export function createPlannedCaveExterior(asset,reservationId=PLANNED_CAVE_ID,sharedTerrain=null){
 const r=asset.sites.find(s=>s.id===reservationId),destination=asset.routes.destinations.find(d=>d.id===reservationId);
 check(r?.familyId==='site-family:cave'&&PLANNED_CAVE_TIERS.includes(r.tier)&&r.footprint.length===1&&r.approach.length===1&&destination?.point,'Unsupported planned compact Cave reservation');
 const f=r.footprint[0],a=r.approach[0],left=f.x*32+8,top=f.y*26+3,entrance={x:left+E.entranceTile.x,y:top+E.entranceTile.y},road=destination.point;
 const allowed=(x,y)=>[f,a].some(c=>Math.floor(x/32)===c.x&&Math.floor(y/26)===c.y),inside=(x,y)=>x>=left&&x<left+E.width&&y>=top&&y<top+E.height,trail=new Set(),put=(x,y)=>{check(allowed(x,y),'Cave connector escaped allocated entrance/approach');trail.add(x+','+y);};
 // Join the existing south-facing mouth to the accepted approach endpoint.
 const start={x:entrance.x,y:top+E.height-1};for(let y=Math.min(start.y,road.y);y<=Math.max(start.y,road.y);y++)for(let dx=-1;dx<=1;dx++)put(start.x+dx,y);for(let x=Math.min(start.x,road.x);x<=Math.max(start.x,road.x);x++)for(let dy=-1;dy<=1;dy++)put(x,road.y+dy);
 const terrain=sharedTerrain??createPlannedTerrain(asset);for(let y=top;y<top+E.height;y++)for(let x=left;x<left+E.width;x++)check(terrain.base(x,y).walkable&&terrain.base(x,y).landmassId===r.landmassId,'Cave cannot replace authoritative water or another landmass');for(const k of trail){const [x,y]=k.split(',').map(Number);check(terrain.base(x,y).walkable&&terrain.base(x,y).landmassId===r.landmassId,'Cave approach cannot replace water');}
 const apply=(x,y,base)=>inside(x,y)?{...base,collision:E.collision[y-top][x-left]==='1'?'1':'2',material:E.terrain[y-top][x-left],route:E.collision[y-top][x-left]==='1'&&E.terrain[y-top][x-left]==='p'?1:0,caveExterior:true}:trail.has(x+','+y)?{...base,collision:'1',material:'p',route:1,caveExterior:true}:base;
 const intersects=(cx,cy)=>[f,a].some(c=>c.x===cx&&c.y===cy);
 const presentation=(cx,cy,siteId)=>{if(cx!==f.x||cy!==f.y)return {blockers:[],decorations:[]};return {blockers:E.blockers.map(b=>({...copyWire(b),id:'cave:'+siteId+':'+b.detail,x:left+b.x-cx*32,y:top+b.y-cy*26})),decorations:E.decorations.map((d,i)=>({...copyWire(d),id:'cave-decoration:'+siteId+':'+i,x:left+d.x-cx*32,y:top+d.y-cy*26}))};};
 return Object.freeze({reservation:r,destination,footprint:f,approach:a,left,top,entrance,road,trail,inside,allowed,apply,intersects,presentation,terrain});
}

export async function derivePlannedCaveReservation(asset,binding,sha256,{reservationId=PLANNED_CAVE_ID,terrain=null}={}){
 const g=createPlannedCaveExterior(asset,reservationId,terrain),r=g.reservation,identity=await worldIdentity(asset.campaignSeedHex,PLANNED_CAVE_VERSION,[binding.assetHash,r.id,r.tier],sha256),siteId='site:'+identity.digest.slice(0,32),entrance=tileAddress(g.entrance.x,g.entrance.y),region=regionAddress(entrance.chunkX,entrance.chunkY),biome=r.id.split(':')[2];
 check(Object.hasOwn(BIOME_CODES,biome)&&g.terrain.base(g.entrance.x,g.entrance.y).biome===BIOME_CODES[biome],'Cave entrance biome disagrees with reservation');
 const chunk=await worldIdentity(PLANNED_WORLD_VERSION+'/'+NATURAL_CLUSTER_VERSION+'/'+asset.campaignSeedHex+'/'+binding.assetHash+'/'+binding.townPrototype+'/'+PLANNED_CAVE_VERSION,'chunk',[entrance.chunkX,entrance.chunkY],sha256),socket={version:PLANNED_CAVE_SOCKET,siteId,siteSeed:identity.digest,entrance,siteClass:'dungeon',capabilities:['interior'],region:{regionX:region.regionX,regionY:region.regionY,biome},minimumLevel:[0,1,6,11,21,41][r.band],provenance:{geographyVersion:asset.version,chunkId:chunk.id,placementVersion:PLANNED_CAVE_VERSION,identityDomain:'planned-reservation-cave',reservationId:r.id,assetHash:binding.assetHash,planHash:binding.planHash,sizeTier:r.tier,band:r.band,footprintChunk:copyWire(g.footprint),approachChunk:copyWire(g.approach)}};
 const regionName=biome[0].toUpperCase()+biome.slice(1),stable=await deriveWoodlandCaveIdentityD12_2({campaignSeed:asset.campaignSeedHex,site:socket,label:regionName+' Cave',regionName,geographicQualifier:''},{sha256}),parcel={version:PLANNED_CAVE_PARCEL,siteId,socket:copyWire(socket),familyId:WOODLAND_CAVE_FAMILY_ID,packageId:WOODLAND_CAVE_FAMILY_PACKAGE_ID,spawnOrdinal:0,regionKey:region.regionX+','+region.regionY,regionName,geographicQualifier:'',label:stable.label,tileX:String(PLANNED_ADDRESS_OFFSET.chunkX*32+g.left),tileY:String(PLANNED_ADDRESS_OFFSET.chunkY*26+g.top),width:E.width,height:E.height,orientation:'south-facing',pages:[{chunkX:entrance.chunkX,chunkY:entrance.chunkY,baseDigest:chunk.digest}],roadAnchor:{tileX:String(PLANNED_ADDRESS_OFFSET.chunkX*32+g.entrance.x),tileY:String(PLANNED_ADDRESS_OFFSET.chunkY*26+g.top+E.height-1)},tier:r.tier,siteSeed:stable.siteSeed,layoutSeed:stable.layoutSeed,placementProvenance:{version:PLANNED_CAVE_VERSION,kind:'existing-planned-reservation',reservationId:r.id,assetHash:binding.assetHash,planHash:binding.planHash}};
 return freezeWire({version:PLANNED_CAVE_RESERVATION,siteId,packageId:WOODLAND_CAVE_FAMILY_PACKAGE_ID,socket,parcel});
}
