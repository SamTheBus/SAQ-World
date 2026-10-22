import {newPopulationSelection,ALPHA_POPULATION_HASH,hasAlphaPopulation} from '../content/alpha_site_population_v1.js';
import {CRYPT_POPULATION_VERSION} from '../content/crypt_population_v3.js';
import {createPlannedCryptExterior,derivePlannedCryptReservation} from './planned_crypt_v1.js';import {createPlannedCryptExteriorV2,derivePlannedCryptReservationV2} from './planned_crypt_v2.js';
import {copyWire,freezeWire} from '../contracts/wire.js';import {worldIdentity} from './world_identity_d9.js';import {NATURAL_CLUSTER_VERSION} from './natural_clusters_v1.js';import {PLANNED_WORLD_VERSION} from './planned_world_foundation_v1.js';import {PLANNED_RUIN_EXTERIOR_VERSION} from '../content/planned_ruin_exterior_v4.js';import {STANDARD_RUIN_KIT_VERSION} from '../content/planned_ruin_standard_kit_v1.js';
import {createPlannedRuinExterior,derivePlannedRuinReservation} from './planned_ruin_v1.js';import {createPlannedRuinExteriorV2,derivePlannedRuinReservationV2} from './planned_ruin_v2.js';import {BIOME_CODES,mixPlan} from './planned_world_foundation_v1.js';
export function createPopulationRuinExterior(asset,id,terrain){
 const g=createPlannedRuinExteriorV2(asset,id,terrain);if(terrain.base(g.entrance.x,g.entrance.y).biome===BIOME_CODES[id.split(':')[2]])return g;
 const r=g.reservation,minX=Math.min(...r.footprint.map(c=>c.x))*32,minY=Math.min(...r.footprint.map(c=>c.y))*26,maxX=(Math.max(...r.footprint.map(c=>c.x))+1)*32,maxY=(Math.max(...r.footprint.map(c=>c.y))+1)*26,locations=[];
 for(let top=minY;top<=maxY-g.height;top+=2)for(let left=minX;left<=maxX-g.width;left+=2)locations.push({left,top,tiles:[g.width,g.height]});locations.sort((a,b)=>mixPlan(asset.seedDigest+'/'+id+'/'+a.left+'/'+a.top)-mixPlan(asset.seedDigest+'/'+id+'/'+b.left+'/'+b.top));
 for(const q of locations.slice(0,64))try{const n=createPlannedRuinExterior(asset,id,terrain,q);if(terrain.base(n.entrance.x,n.entrance.y).biome===BIOME_CODES[id.split(':')[2]])return Object.freeze({...n,populationRealization:q});}catch{}
 throw new TypeError('No compatible Ruin anchor within its existing footprint/approach');
}
export async function derivePopulationRuinReservation(asset,binding,sha256,options){const g=createPopulationRuinExterior(asset,options.reservationId,options.terrain);const r=g.populationRealization?await derivePlannedRuinReservation(asset,binding,sha256,{...options,realization:g.populationRealization}):await derivePlannedRuinReservationV2(asset,binding,sha256,options);return completePopulationReservation(r,asset,binding,sha256);}
export function createPopulationCryptExterior(asset,id,terrain){const r=asset.sites.find(r=>r.id===id),g=(r.tier==='small'?createPlannedCryptExterior:createPlannedCryptExteriorV2)(asset,id,terrain);return newPopulationSelection(id)?Object.freeze({...g,realizationVersion:CRYPT_POPULATION_VERSION}):g;}
export async function completePopulationReservation(r,asset,binding,sha256){
 const p=r.socket.provenance,s=newPopulationSelection(p.reservationId);if(!s||!hasAlphaPopulation(binding))return r;const n=copyWire(r),family=s.familyId.split(':')[1];
 if(family==='crypt'){const identity=await worldIdentity(asset.campaignSeedHex,CRYPT_POPULATION_VERSION,[binding.assetHash,s.id,s.tier],sha256);n.siteId=n.socket.siteId=n.parcel.siteId='site:'+identity.digest.slice(0,32);n.socket.siteSeed=n.parcel.layoutSeed=identity.digest;n.socket.provenance.placementVersion=n.parcel.version=CRYPT_POPULATION_VERSION;}
 n.socket.provenance.populationHash=ALPHA_POPULATION_HASH;n.parcel.label=s.tier[0].toUpperCase()+s.tier.slice(1)+' '+s.biome[0].toUpperCase()+s.biome.slice(1)+' '+family[0].toUpperCase()+family.slice(1);
 const version=n.socket.provenance.placementVersion,extra=(family==='ruin'||family==='crypt')?'/'+PLANNED_RUIN_EXTERIOR_VERSION+(family==='ruin'&&s.tier==='standard'?'/'+STANDARD_RUIN_KIT_VERSION:''):'';
 const c=await worldIdentity(PLANNED_WORLD_VERSION+'/'+NATURAL_CLUSTER_VERSION+'/'+asset.campaignSeedHex+'/'+binding.assetHash+(binding.townPrototype?'/'+binding.townPrototype:'')+'/'+version+extra,'chunk',[n.socket.entrance.chunkX,n.socket.entrance.chunkY],sha256);n.socket.provenance.chunkId=c.id;
 n.parcel.socket=copyWire(n.socket);return freezeWire(n);
}
