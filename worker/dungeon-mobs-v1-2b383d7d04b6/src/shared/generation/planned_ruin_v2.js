import {NATURAL_CLUSTER_VERSION} from './natural_clusters_v1.js';
import {createPlannedRuinExterior,derivePlannedRuinReservation} from './planned_ruin_v1.js';
import {PLANNED_RUIN_V2,RUIN_TIER_POLICY_V2,DEEP_RUIN_FIXTURE_ID} from '../content/planned_ruin_policy_v2.js';
import {PLANNED_RUIN_SOCKET,PLANNED_RUIN_RESERVATION,RUIN_FAMILY_PACKAGE_ID} from '../content/planned_ruin_policy_v1.js';
import {createPlannedTerrain,tileAddress,PLANNED_WORLD_VERSION,BIOME_CODES,mixPlan} from './planned_world_foundation_v1.js';
import {worldIdentity} from './world_identity_d9.js';import {regionAddress} from '../contracts/world_address.js';import {copyWire,freezeWire,requireContract as check} from '../contracts/wire.js';
export function createPlannedRuinExteriorV2(asset,id,terrain=createPlannedTerrain(asset)){
 const r=asset.sites.find(s=>s.id===id),policy=RUIN_TIER_POLICY_V2[r?.tier];check(r?.familyId==='site-family:ruin'&&policy,'Ruin V2 requires a Ruin reservation');
 if(['small','standard'].includes(r.tier))return createPlannedRuinExterior(asset,id,terrain);
 const xs=r.footprint.map(c=>c.x),ys=r.footprint.map(c=>c.y),minX=Math.min(...xs)*32,minY=Math.min(...ys)*26,maxX=(Math.max(...xs)+1)*32,maxY=(Math.max(...ys)+1)*26,failures=[];
 for(const tiles of [[56,70],[84,44]]){const [w,h]=tiles;if(w>maxX-minX||h>maxY-minY)continue;const first={left:minX+Math.floor((maxX-minX-w)/2),top:minY},locations=[];for(let y=minY;y<=maxY-h;y+=2)for(let x=minX;x<=maxX-w;x+=2)locations.push({left:x,top:y});locations.sort((a,b)=>mixPlan(asset.seedDigest+'/'+id+'/'+a.left+'/'+a.top)-mixPlan(asset.seedDigest+'/'+id+'/'+b.left+'/'+b.top));
  for(const q of [first,...locations.slice(0,63)])try{check(terrain.base(q.left+Math.floor(w/2),q.top+Math.floor(h/2)).biome===BIOME_CODES[id.split(':')[2]],'Ruin entrance biome incompatible');return createPlannedRuinExterior(asset,id,terrain,{...q,tiles,policy,version:PLANNED_RUIN_V2});}catch(e){failures.push(e.message);}
 }
 const error=new TypeError('Ruin V2 has no compatible exterior within reserved shape/approach');error.capacityEvidence={reservationId:id,footprint:r.footprint,approach:r.approach,attempts:failures.length,reasons:[...new Set(failures)]};throw error;
}
export async function derivePlannedRuinReservationV2(asset,binding,sha256,{reservationId,terrain}={}){
 const r=asset.sites.find(s=>s.id===reservationId);if(['small','standard'].includes(r?.tier))return derivePlannedRuinReservation(asset,binding,sha256,{reservationId,terrain});
 const g=createPlannedRuinExteriorV2(asset,reservationId,terrain),biome=r.id.split(':')[2],identity=await worldIdentity(asset.campaignSeedHex,PLANNED_RUIN_V2,[binding.assetHash,r.id,r.tier],sha256),siteId='site:'+identity.digest.slice(0,32),entrance=tileAddress(g.entrance.x,g.entrance.y),region=regionAddress(entrance.chunkX,entrance.chunkY),chunk=await worldIdentity(PLANNED_WORLD_VERSION+'/'+NATURAL_CLUSTER_VERSION+'/'+asset.campaignSeedHex+'/'+binding.assetHash+(binding.townPrototype?'/'+binding.townPrototype:'')+'/'+PLANNED_RUIN_V2,'chunk',[entrance.chunkX,entrance.chunkY],sha256);
 const socket={version:PLANNED_RUIN_SOCKET,siteId,siteSeed:identity.digest,entrance,siteClass:'dungeon',capabilities:['interior'],region:{regionX:region.regionX,regionY:region.regionY,biome},minimumLevel:[0,1,6,11,21,41][r.band],provenance:{geographyVersion:asset.version,chunkId:chunk.id,placementVersion:PLANNED_RUIN_V2,identityDomain:r.id===DEEP_RUIN_FIXTURE_ID?'isolated-development-ruin':'planned-reservation-ruin',reservationId:r.id,assetHash:binding.assetHash,planHash:binding.planHash,sizeTier:r.tier,band:r.band,footprintChunks:copyWire(r.footprint),approachChunks:copyWire(r.approach)}};
 const parcel={version:PLANNED_RUIN_V2,siteId,socket:copyWire(socket),familyId:'site-family:ruin',packageId:RUIN_FAMILY_PACKAGE_ID,tier:r.tier,label:r.id===DEEP_RUIN_FIXTURE_ID?'Deep Ruin fixture':biome[0].toUpperCase()+biome.slice(1)+' Ruin',tileX:String(1024*32+g.left),tileY:String(1024*26+g.top),width:g.width,height:g.height,layoutSeed:identity.digest,pages:r.footprint.map(c=>({chunkX:String(1024+c.x),chunkY:String(1024+c.y)})),roadAnchor:{tileX:String(1024*32+g.gate.x),tileY:String(1024*26+g.gate.y)}};
 return freezeWire({version:PLANNED_RUIN_RESERVATION,siteId,packageId:RUIN_FAMILY_PACKAGE_ID,socket,parcel});
}
