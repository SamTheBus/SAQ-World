import {copyWire,freezeWire,requireContract as check} from '../contracts/wire.js';
import {validateSiteSocketD9} from '../contracts/site_content_d9.js';
import {WOODLAND_CAVE_VERSION} from '../content/woodland_cave_d10.js';
import {WOODLAND_CAVE_FAMILY_ID,WOODLAND_CAVE_FAMILY_PACKAGE_ID,WOODLAND_CAVE_FAMILY_VERSION} from '../content/site_families_d12.js';
import {planWoodlandCaveParcelD10,overlayWoodlandCaveParcelD10} from './woodland_cave_placement_d10.js';
import {worldIdentity} from './world_identity_d9.js';

export const WOODLAND_CAVE_FAMILY_PARCEL_D12='woodland-cave-family-parcel-d12-v1';

// Reuse the accepted footprint validator and road walk, then assign a D12
// family identity. Starting each bounded search at the previous parcel spreads
// instances along connected geography without changing the world road graph.
export async function planWoodlandCaveFamilyParcelsD12({seed,origin,ruinSocket,fortParcel,referenceCaveParcel=null,count=3,maxRouteTiles=224},sha256){
 check(Number.isInteger(count)&&count>=2&&count<=4,'D12 cave density bound');const parcels=[];
 for(let ordinal=0;ordinal<count;ordinal++){
  const excludedParcels=[...(referenceCaveParcel?[referenceCaveParcel]:[]),...parcels],planned=await planWoodlandCaveParcelD10({seed,origin,ruinSocket,fortParcel,maxRouteTiles,excludedParcels},sha256);check(planned,`No suitable road-connected Woodland Cave family parcel ${ordinal+1}`);
  const identity=await worldIdentity(seed,'site-family-reservation',[WOODLAND_CAVE_FAMILY_VERSION,WOODLAND_CAVE_FAMILY_ID,String(ordinal),planned.tileX,planned.tileY],sha256),siteId='site:'+identity.digest.slice(0,32),socket={...copyWire(planned.socket),siteId,siteSeed:identity.digest};validateSiteSocketD9(socket);
  const parcel=freezeWire({...copyWire(planned),version:WOODLAND_CAVE_FAMILY_PARCEL_D12,siteId,socket,familyId:WOODLAND_CAVE_FAMILY_ID,packageId:WOODLAND_CAVE_FAMILY_PACKAGE_ID,spawnOrdinal:ordinal,placementProvenance:{version:WOODLAND_CAVE_FAMILY_PARCEL_D12,searchOriginSiteId:fortParcel.siteId,routeDistanceTiles:planned.routeDistanceTiles}});
  parcels.push(parcel);
 }
 return freezeWire(parcels);
}

export function overlayWoodlandCaveFamilyParcelsD12(chunk,parcels=[]){
 let next=chunk;for(const parcel of parcels){if(!parcel?.pages?.some(p=>p.chunkX===next.chunkX&&p.chunkY===next.chunkY))continue;check(parcel.version===WOODLAND_CAVE_FAMILY_PARCEL_D12&&parcel.familyId===WOODLAND_CAVE_FAMILY_ID,'Invalid D12 cave parcel overlay');const historical=overlayWoodlandCaveParcelD10(next,{...copyWire(parcel),version:WOODLAND_CAVE_VERSION});next=freezeWire({...copyWire(historical),cave:{siteId:parcel.siteId,version:parcel.version,familyId:parcel.familyId,pages:copyWire(parcel.pages)}});}
 return next;
}
