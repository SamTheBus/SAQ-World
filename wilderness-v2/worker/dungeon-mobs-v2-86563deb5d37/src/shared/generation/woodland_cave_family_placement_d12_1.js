import {copyWire,freezeWire,requireContract as check} from '../contracts/wire.js';
import {floorDiv} from '../contracts/world_address.js';
import {validateSiteSocketD9} from '../contracts/site_content_d9.js';
import {WOODLAND_CAVE_VERSION} from '../content/woodland_cave_d10.js';
import {WOODLAND_CAVE_FAMILY_ID,WOODLAND_CAVE_FAMILY_PACKAGE_ID} from '../content/site_families_d12.js';
import {WOODLAND_CAVE_FAMILY_D12_1,WOODLAND_CAVE_FAMILY_VERSION_D12_1} from '../content/site_families_d12_1.js';
import {deriveWoodlandCaveIdentityD12_1} from './woodland_cave_family_d12_1.js';
import {planWoodlandCaveParcelD10,overlayWoodlandCaveParcelD10} from './woodland_cave_placement_d10.js';
import {worldIdentity} from './world_identity_d9.js';

export const WOODLAND_CAVE_FAMILY_PARCEL_D12_1='woodland-cave-family-parcel-d12-1-v1';
const CW=32n,CH=26n;
const placementRegion=parcel=>`${floorDiv(BigInt(parcel.tileX),128n)},${floorDiv(BigInt(parcel.tileY),104n)}`;
const qualifier=(parcel,fort)=>{
 const x=BigInt(parcel.socket.entrance.chunkX)*CW+BigInt(Math.floor(parcel.socket.entrance.localX/32)),y=BigInt(parcel.socket.entrance.chunkY)*CH+BigInt(Math.floor(parcel.socket.entrance.localY/32)),fx=BigInt(fort.socket.entrance.chunkX)*CW+BigInt(Math.floor(fort.socket.entrance.localX/32)),fy=BigInt(fort.socket.entrance.chunkY)*CH+BigInt(Math.floor(fort.socket.entrance.localY/32)),dx=x-fx,dy=y-fy,vertical=dy< -8n?'North ':dy>8n?'South ':'',horizontal=dx< -8n?'West ':dx>8n?'East ':'',d=parcel.routeDistanceTiles,band=d<112?'Near ':d>=224?'Outer ':d>=168?'Far ':'';return `${band}${vertical}${horizontal}Alderwood`.replace(/\s+/g,' ').trim();
};

// Reserve a finite set of identities in deterministic road-distance bands.
// The planner temporarily evaluates generated pages but retains only compact
// reservation records; actual interior geometry remains lazy until entry.
export async function planWoodlandCaveFamilyParcelsD12_1({seed,origin,ruinSocket,fortParcel,referenceCaveParcel=null,count=WOODLAND_CAVE_FAMILY_D12_1.placement.reservationCount},sha256){
 check(Number.isInteger(count)&&count>=4&&count<=16,'D12.1 Cave regional reservation bound');const parcels=[],regionCounts=new Map();
 for(let ordinal=0;ordinal<count;ordinal++){
  const minRouteTiles=48+ordinal*WOODLAND_CAVE_FAMILY_D12_1.placement.distanceBandTiles,maxRouteTiles=Math.min(512,minRouteTiles+160),excludedPlacementRegions=[...regionCounts].filter(([,n])=>n>=2).map(([key])=>key),planned=await planWoodlandCaveParcelD10({seed,origin,ruinSocket,fortParcel,minRouteTiles,maxRouteTiles,excludedParcels:[...(referenceCaveParcel?[referenceCaveParcel]:[]),...parcels],excludedPlacementRegions,minimumSeparationTiles:WOODLAND_CAVE_FAMILY_D12_1.placement.minimumSeparationTiles},sha256);check(planned,`No suitable distributed Woodland Cave reservation ${ordinal+1}`);
  const identity=await worldIdentity(seed,'site-family-regional-reservation',[WOODLAND_CAVE_FAMILY_VERSION_D12_1,WOODLAND_CAVE_FAMILY_ID,String(ordinal),planned.tileX,planned.tileY],sha256),siteId='site:'+identity.digest.slice(0,32),socket={...copyWire(planned.socket),siteId,siteSeed:identity.digest};validateSiteSocketD9(socket);
  const baseQualifier=qualifier({...planned,socket},fortParcel),duplicateCount=parcels.filter(p=>p.geographicQualifier===baseQualifier||p.geographicQualifier.startsWith(baseQualifier+' ')).length,geographicQualifier=duplicateCount===0?baseQualifier:`${baseQualifier} ${['Road','Trail','Crossing','Reach'][Math.min(3,duplicateCount-1)]}`,stable=await deriveWoodlandCaveIdentityD12_1({campaignSeed:seed,site:socket,geographicQualifier},{sha256}),regionKey=placementRegion(planned);
  const parcel=freezeWire({...copyWire(planned),version:WOODLAND_CAVE_FAMILY_PARCEL_D12_1,siteId,socket,familyId:WOODLAND_CAVE_FAMILY_ID,packageId:WOODLAND_CAVE_FAMILY_PACKAGE_ID,spawnOrdinal:ordinal,placementRegion:regionKey,geographicQualifier,tier:stable.tier,siteSeed:stable.siteSeed,layoutSeed:stable.layoutSeed,placementProvenance:{version:WOODLAND_CAVE_FAMILY_PARCEL_D12_1,kind:'deterministic-region-reservation',searchOriginSiteId:fortParcel.siteId,distanceBand:{minimum:minRouteTiles,maximum:maxRouteTiles},routeDistanceTiles:planned.routeDistanceTiles}});parcels.push(parcel);regionCounts.set(regionKey,(regionCounts.get(regionKey)??0)+1);
 }
 return freezeWire(parcels);
}

const variantFor=(siteId,kind)=>{let n=2166136261;for(const c of siteId+kind)n=Math.imul(n^c.charCodeAt(0),16777619);return (n>>>0)%3;};
export function overlayWoodlandCaveFamilyParcelsD12_1(chunk,parcels=[]){
 let next=chunk;for(const parcel of parcels){if(!parcel?.pages?.some(page=>page.chunkX===next.chunkX&&page.chunkY===next.chunkY))continue;check(parcel.version===WOODLAND_CAVE_FAMILY_PARCEL_D12_1&&parcel.familyId===WOODLAND_CAVE_FAMILY_ID,'Invalid D12.1 Cave parcel overlay');const historical=overlayWoodlandCaveParcelD10(next,{...copyWire(parcel),version:WOODLAND_CAVE_VERSION}),decorations=historical.visual.decorations.map(d=>d.id?.startsWith(`cave-decoration:${parcel.siteId}:`)?{...copyWire(d),variant:variantFor(parcel.siteId,d.kind)}:copyWire(d));next=freezeWire({...copyWire(historical),visual:{...copyWire(historical.visual),decorations},cave:{siteId:parcel.siteId,version:parcel.version,familyId:parcel.familyId,tier:parcel.tier,layoutSeed:parcel.layoutSeed,pages:copyWire(parcel.pages)}});}
 return next;
}
