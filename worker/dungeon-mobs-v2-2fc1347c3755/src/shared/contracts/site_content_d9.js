import {PLANNED_CRYPT_SOCKET,CRYPT_PACKAGE_ID} from '../content/planned_crypt_policy_v1.js';
import {validatePlannedCryptSocket} from './planned_crypt_v1.js';
import {PLANNED_RUIN_SOCKET,RUIN_FAMILY_PACKAGE_ID} from '../content/planned_ruin_policy_v1.js';
import {validatePlannedRuinSocket} from './planned_ruin_v1.js';
import {PLANNED_FORT_SOCKET,FORT_FAMILY_PACKAGE_ID} from '../content/planned_fort_policy_v1.js';
import {validatePlannedFortSocket} from './planned_fort_v1.js';
import {PLANNED_CAVE_SOCKET} from '../content/planned_cave_policy_v1.js';
import {validatePlannedCaveSocket} from './planned_cave_v1.js';
import {closedRecord,copyWire,freezeWire,requireContract as check,safeInteger,canonicalStringify} from './wire.js';
import {validateWorldPosition,regionAddress} from './world_address.js';
import {progressionBigInt} from './progression_integer.js';
import {D9_PROFILE} from '../content/world_profile_d9.js';
import {WOODLAND_RUIN_D11_3_2_PACKAGE,WOODLAND_FORT_D11_PACKAGE,WOODLAND_CAVE_D11_PACKAGE} from '../content/woodland_sites_d11.js';
import {WOODLAND_CAVE_FAMILY_PACKAGE_D12} from '../content/site_families_d12.js';
import {WOODLAND_CAVE_FAMILY_PACKAGE_D12_1} from '../content/site_families_d12_1.js';
import {WOODLAND_CAVE_FAMILY_PACKAGE_D12_2} from '../content/site_families_d12_2.js';

// Geography versions select sockets. Catalog versions select content only at a
// legitimate activation. Neither catalog updates nor discovery rewrite geography.
export const SITE_SOCKET_D9='site-socket-d9-v1';
export const SITE_BOOTSTRAP_SOCKET_D9='site-socket-d9-bootstrap-v1';
export const SITE_REGIONAL_SOCKET_D12_2='site-socket-d12-2-regional-v1';
export const SITE_BOOTSTRAP_PLACEMENT_D9='woodland-site-bootstrap-placement-d9-v1';
export const SITE_CONTENT_D9='site-content-ledger-d9-v1';
export const SITE_BINDING_D9='site-content-binding-d9-v1';
export const SITE_CATALOG_D9='site-content-catalog-d9-v1';
export const SITE_BINDING_POLICY_D9='unrepresented-eligible-first-d9-v1';
const token=v=>typeof v==='string'&&v.length>0&&v.length<=128;
const digest=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);

export function validateSiteSocketD9(site){
 closedRecord(site,['version','siteId','siteSeed','entrance','siteClass','capabilities','region','minimumLevel','provenance']);
 check([SITE_SOCKET_D9,SITE_BOOTSTRAP_SOCKET_D9,SITE_REGIONAL_SOCKET_D12_2,PLANNED_CAVE_SOCKET,PLANNED_FORT_SOCKET,PLANNED_RUIN_SOCKET,PLANNED_CRYPT_SOCKET].includes(site.version)&&/^site:[a-f0-9]{32}$/.test(site.siteId)&&digest(site.siteSeed),'Invalid procedural site identity');
 validateWorldPosition(site.entrance);check(site.siteClass==='dungeon'&&canonicalStringify(site.capabilities)==='["interior"]','Unknown D9 site capability');
 closedRecord(site.region,['regionX','regionY','biome']);check(D9_PROFILE.biomes.includes(site.region.biome)||[PLANNED_CAVE_SOCKET,PLANNED_FORT_SOCKET,PLANNED_RUIN_SOCKET,PLANNED_CRYPT_SOCKET].includes(site.version)&&['woodland','grassland','wetland','upland','desert','frostland','tropical','volcanic'].includes(site.region.biome),'Unknown site biome');
 const region=regionAddress(site.entrance.chunkX,site.entrance.chunkY);check(region.regionX===site.region.regionX&&region.regionY===site.region.regionY,'Site region/address mismatch');
 check(progressionBigInt(site.minimumLevel)>=1n,'Invalid site minimum');
 if(site.version===PLANNED_CRYPT_SOCKET){validatePlannedCryptSocket(site);return site;}
 if(site.version===PLANNED_RUIN_SOCKET){validatePlannedRuinSocket(site);return site;}
 if(site.version===PLANNED_FORT_SOCKET){validatePlannedFortSocket(site);return site;}
 if(site.version===PLANNED_CAVE_SOCKET){validatePlannedCaveSocket(site);return site;}
 if(site.version===SITE_SOCKET_D9){closedRecord(site.provenance,['geographyVersion','chunkId','ordinal']);safeInteger(site.provenance.ordinal,0,0);}
 else if(site.version===SITE_BOOTSTRAP_SOCKET_D9){closedRecord(site.provenance,['geographyVersion','chunkId','placementVersion','identityDomain','sourceEgress','routeDistanceTiles']);check(site.provenance.placementVersion===SITE_BOOTSTRAP_PLACEMENT_D9&&site.provenance.identityDomain==='site-bootstrap'&&['north','east','south','west'].includes(site.provenance.sourceEgress),'Invalid bootstrap site provenance');safeInteger(site.provenance.routeDistanceTiles,0,512);}
 else{closedRecord(site.provenance,['geographyVersion','chunkId','placementVersion','identityDomain','regionKey','ordinal']);check(site.provenance.placementVersion==='woodland-cave-family-parcel-d12-2-v1'&&site.provenance.identityDomain==='region-owned-cave'&&site.provenance.regionKey===site.region.regionX+','+site.region.regionY,'Invalid regional site provenance');safeInteger(site.provenance.ordinal,0,1);}
 check(site.provenance.geographyVersion===D9_PROFILE.version&&/^chunk:[a-f0-9]{32}$/.test(site.provenance.chunkId),'Invalid site provenance');return site;
}

export function historicalSiteContentD9(manifest,manifestHash){
 const historical=manifest.sites.map(site=>{
  const interior=manifest.siteInteriors?.find(x=>x.siteId===site.locationId);
  return {version:SITE_BINDING_D9,siteId:site.locationId,status:'bound',packageId:site.locationDefinitionId,packageVersion:'historical-origin-d8',contentHash:interior?.contentHash??manifestHash,catalogVersion:'historical-origin-d8',policyVersion:'historical-origin-binding-d9-v1',boundTick:null,causedByPlayerId:null};
 });
 return {version:SITE_CONTENT_D9,catalogVersion:'historical-origin-d8',policyVersion:SITE_BINDING_POLICY_D9,index:null,historical};
}

export function validateSiteContentRootD9(content){
 closedRecord(content,['version','catalogVersion','policyVersion','index','historical']);
 check(content.version===SITE_CONTENT_D9&&token(content.catalogVersion)&&content.policyVersion===SITE_BINDING_POLICY_D9&&(content.index===null||digest(content.index)),'Invalid content ledger root');
 check(Array.isArray(content.historical)&&content.historical.length<=64,'Historical site bound');const ids=new Set();
 for(const b of content.historical){validateSiteBindingD9(b);check(!ids.has(b.siteId)&&b.policyVersion==='historical-origin-binding-d9-v1'&&b.boundTick===null&&b.causedByPlayerId===null,'Invalid historical binding');ids.add(b.siteId);}return content;
}

export function validateSiteBindingD9(b){
 closedRecord(b,['version','siteId','status','packageId','packageVersion','contentHash','catalogVersion','policyVersion','boundTick','causedByPlayerId']);
 check(b.version===SITE_BINDING_D9&&b.status==='bound'&&[b.siteId,b.packageId,b.packageVersion,b.catalogVersion,b.policyVersion].every(token)&&digest(b.contentHash),'Invalid content binding');
 if(b.boundTick!==null){safeInteger(b.boundTick);check(['seed-reserved-fort-d10-v1','seed-reserved-site-d10-v1','seed-reserved-cave-family-d12-v1','seed-regional-cave-family-d12-1-v1'].includes(b.policyVersion)?b.causedByPlayerId===null:token(b.causedByPlayerId),'Missing binding cause');}return b;
}

export function validateSiteCatalogD9(catalog){
 closedRecord(catalog,['schemaVersion','catalogVersion','packages']);check(catalog.schemaVersion===SITE_CATALOG_D9&&token(catalog.catalogVersion)&&Array.isArray(catalog.packages)&&catalog.packages.length<=128,'Invalid content catalog');const ids=new Set();
 for(const p of catalog.packages){
  closedRecord(p,['packageId','packageVersion','contentHash','siteClass','capabilities','biomes','minimumLevel','maximumLevel','repeatable','unique','reservedSiteId']);
  check(token(p.packageId)&&token(p.packageVersion)&&digest(p.contentHash)&&!ids.has(p.packageId),'Invalid/duplicate package');ids.add(p.packageId);
  check(p.siteClass==='dungeon'&&canonicalStringify(p.capabilities)==='["interior"]'&&Array.isArray(p.biomes)&&p.biomes.length>0&&p.biomes.every(b=>D9_PROFILE.biomes.includes(b)||[FORT_FAMILY_PACKAGE_ID,RUIN_FAMILY_PACKAGE_ID,CRYPT_PACKAGE_ID].includes(p.packageId)&&['woodland','grassland','wetland','upland','desert','frostland','tropical','volcanic'].includes(b)),'Invalid package capabilities');
  check(progressionBigInt(p.minimumLevel)>=1n&&(p.maximumLevel===null||progressionBigInt(p.maximumLevel)>=progressionBigInt(p.minimumLevel)),'Invalid package level restriction');
  check(typeof p.repeatable==='boolean'&&typeof p.unique==='boolean'&&!(p.repeatable&&p.unique)&&(p.reservedSiteId===null||token(p.reservedSiteId)),'Invalid package repetition/reservation');
 }return catalog;
}

export function packageEligibleD9(site,p,represented){
 if(p.packageId===CRYPT_PACKAGE_ID&&site.version!==PLANNED_CRYPT_SOCKET)return false;
 if(p.packageId===RUIN_FAMILY_PACKAGE_ID&&site.version!==PLANNED_RUIN_SOCKET)return false;
 if(p.packageId===FORT_FAMILY_PACKAGE_ID&&site.version!==PLANNED_FORT_SOCKET)return false;
 return p.siteClass===site.siteClass&&site.capabilities.every(c=>p.capabilities.includes(c))&&(p.biomes.includes(site.region.biome)||site.version===PLANNED_CAVE_SOCKET&&p.packageId==='woodland-cave-family')&&progressionBigInt(site.minimumLevel)>=progressionBigInt(p.minimumLevel)&&(p.maximumLevel===null||progressionBigInt(site.minimumLevel)<=progressionBigInt(p.maximumLevel))&&(p.reservedSiteId===null||p.reservedSiteId===site.siteId)&&(!represented||p.repeatable&&!p.unique);
}

// Catalog order preserves the D9 first-site Ruin, then offers the Fort on the
// next eligible Woodland socket. Existing bound sockets never select again.
export const D9_SITE_CONTENT_CATALOG=freezeWire({schemaVersion:SITE_CATALOG_D9,catalogVersion:'d12-2-natural-cave-assembly-v1',packages:[WOODLAND_RUIN_D11_3_2_PACKAGE,WOODLAND_FORT_D11_PACKAGE,WOODLAND_CAVE_D11_PACKAGE,WOODLAND_CAVE_FAMILY_PACKAGE_D12_2]});
