import {NATURAL_CLUSTER_VERSION} from './natural_clusters_v1.js';
import {createPlannedFortExterior,derivePlannedFortReservation} from './planned_fort_v1.js';
import {FORT_TIER_POLICY,PLANNED_FORT_VERSION} from '../content/planned_fort_policy_v1.js';
import {PLANNED_FORT_V2,DEEP_FORT_FIXTURE_ID} from '../content/planned_fort_policy_v2.js';
import {createPlannedTerrain,tileAddress,PLANNED_ADDRESS_OFFSET,PLANNED_WORLD_VERSION,BIOME_CODES,mixPlan} from './planned_world_foundation_v1.js';
import {worldIdentity} from './world_identity_d9.js';
import {regionAddress} from '../contracts/world_address.js';
import {copyWire,freezeWire,requireContract as check} from '../contracts/wire.js';
export function createPlannedFortExteriorV2(asset,id,terrain=createPlannedTerrain(asset)){
 const r=asset.sites.find(s=>s.id===id),p=FORT_TIER_POLICY[r?.tier];check(r?.familyId==='site-family:fort'&&p,'Fort V2 requires an existing Fort reservation');
 // Retained tiers first try the exact accepted exterior, including its gate.
 if(['small','standard'].includes(r.tier)){try{const g=createPlannedFortExterior(asset,id,terrain);if(terrain.base(g.entrance.x,g.entrance.y).biome===BIOME_CODES[r.id.split(':')[2]])return g;}catch(e){if(!e.message.includes('capacity incompatible')&&!e.message.includes('footprint shape')&&!e.message.includes('reserved three-tile approach'))throw e;}}
 const xs=r.footprint.map(c=>c.x),ys=r.footprint.map(c=>c.y),minX=Math.min(...xs)*32,minY=Math.min(...ys)*26,maxX=(Math.max(...xs)+1)*32,maxY=(Math.max(...ys)+1)*26,
 variants=[p.exteriorTiles,...(r.tier==='standard'?[[76,44],[44,76]]:r.tier==='small'?[[36,48]]:[[70,80]])],failures=[];
 for(const [width,height] of variants){if(width>maxX-minX||height>maxY-minY)continue;
  const locations=[{left:minX+Math.floor((maxX-minX-width)/2),top:minY}];
  for(let y=minY;y<=maxY-height;y+=2)for(let x=minX;x<=maxX-width;x+=2)locations.push({left:x,top:y});
  // Bounded, identity-owned tie-break; no frame time or mutable RNG.
  const rest=locations.splice(1).sort((a,b)=>mixPlan(asset.seedDigest+'/'+id+'/'+a.left+'/'+a.top)-mixPlan(asset.seedDigest+'/'+id+'/'+b.left+'/'+b.top));locations.push(...rest.slice(0,63));
  const kw=p.floors[0].tiles[0]+2,kh=p.floors[0].tiles[1]+2,keeps=[{},...[5,width-kw-5].flatMap(keepX=>[5,height-kh-7].map(keepY=>({keepX,keepY})))];
  for(const location of locations)for(const keep of keeps){try{
   // Cheap admission precedes geometry/BFS construction; never rebuild an
   // entire compound merely to discover the door has the wrong biome.
   const kx=keep.keepX??Math.floor((width-kw)/2),ky=keep.keepY??5;
   check(terrain.base(location.left+kx+Math.floor(kw/2),location.top+ky+kh).biome===BIOME_CODES[r.id.split(':')[2]],'Fort entrance biome incompatible');
   for(let y=Math.floor(location.top/26);y<=Math.floor((location.top+height-1)/26);y++)for(let x=Math.floor(location.left/32);x<=Math.floor((location.left+width-1)/32);x++)check(r.footprint.some(c=>c.x===x&&c.y===y),'Fort architecture escapes actual footprint shape');
   const g=createPlannedFortExterior(asset,id,terrain,{version:PLANNED_FORT_V2,tiles:[width,height],...location,...keep,courtyardWings:r.tier==='large'||r.tier==='deep',variant:r.tier+'-'+width+'x'+height+(keep.keepX===undefined?'':'-side-keep-'+keep.keepX+'-'+keep.keepY)});return g;
  }catch(e){failures.push(e.message);}}
 }
 const error=new TypeError('Fort V2 has no compatible layout in the actual reserved footprint/approach');error.capacityEvidence={reservationId:id,tier:r.tier,footprint:r.footprint,approach:r.approach,variants,attempts:failures.length,reasons:[...new Set(failures)]};throw error;
}
export async function derivePlannedFortReservationV2(asset,binding,sha256,{reservationId,terrain}={}){
 const g=createPlannedFortExteriorV2(asset,reservationId,terrain);
 if(g.realizationVersion===PLANNED_FORT_VERSION)return derivePlannedFortReservation(asset,binding,sha256,{reservationId,terrain});
 const r=g.reservation,fixture=r.id===DEEP_FORT_FIXTURE_ID,biome=r.id.split(':')[2],identity=await worldIdentity(asset.campaignSeedHex,PLANNED_FORT_V2,[binding.assetHash,r.id,r.tier],sha256),siteId='site:'+identity.digest.slice(0,32),entrance=tileAddress(g.entrance.x,g.entrance.y),region=regionAddress(entrance.chunkX,entrance.chunkY);
 check(g.terrain.base(g.entrance.x,g.entrance.y).biome===BIOME_CODES[biome],'Fort V2 entrance biome incompatible');
 const chunk=await worldIdentity(PLANNED_WORLD_VERSION+'/'+NATURAL_CLUSTER_VERSION+'/'+asset.campaignSeedHex+'/'+binding.assetHash+(binding.townPrototype?'/'+binding.townPrototype:'')+'/'+PLANNED_FORT_V2,'chunk',[entrance.chunkX,entrance.chunkY],sha256),socket={version:'site-socket-planned-fort-v1',siteId,siteSeed:identity.digest,entrance,siteClass:'dungeon',capabilities:['interior'],region:{regionX:region.regionX,regionY:region.regionY,biome},minimumLevel:[0,1,6,11,21,41][r.band],provenance:{geographyVersion:asset.version,chunkId:chunk.id,placementVersion:PLANNED_FORT_V2,identityDomain:fixture?'isolated-development-fort':'planned-reservation-fort',reservationId:r.id,assetHash:binding.assetHash,planHash:binding.planHash,sizeTier:r.tier,band:r.band,footprintChunks:copyWire(r.footprint),approachChunks:copyWire(r.approach)}};
 const parcel={version:PLANNED_FORT_V2,siteId,socket:copyWire(socket),familyId:'site-family:fort',packageId:'procedural-fort-family',tier:r.tier,label:fixture?'Deep Fort fixture':biome[0].toUpperCase()+biome.slice(1)+' Fort',tileX:String(PLANNED_ADDRESS_OFFSET.chunkX*32+g.left),tileY:String(PLANNED_ADDRESS_OFFSET.chunkY*26+g.top),width:g.width,height:g.height,layoutSeed:identity.digest,pages:r.footprint.map(c=>({chunkX:String(1024+c.x),chunkY:String(1024+c.y)})),roadAnchor:{tileX:String(1024*32+g.gate.x),tileY:String(1024*26+g.gate.y)}};
 return freezeWire({version:'site-reservation-planned-fort-v1',siteId,packageId:'procedural-fort-family',socket,parcel});
}
