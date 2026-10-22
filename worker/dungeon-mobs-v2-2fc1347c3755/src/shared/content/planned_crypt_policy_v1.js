import {freezeWire} from '../contracts/wire.js';
export const PLANNED_CRYPT_VERSION='planned-small-crypt-candidate-v1';
export const PLANNED_CRYPT_SOCKET='site-socket-planned-crypt-v1';
export const PLANNED_CRYPT_RESERVATION='site-reservation-planned-crypt-v1';
export const FUNCTIONAL_CRYPT_FAMILY='functional-crypt-family-v1';
export const CRYPT_PACKAGE_ID='procedural-crypt-family';
export const ALPHA_SMALL_CRYPT_ID='repeatable-slot:crypt:grassland:small:01';
export const CRYPT_POLICY=freezeWire({version:PLANNED_CRYPT_VERSION,parentRuntime:'d038e94b8e38ea23',familyId:'site-family:crypt',implementedTiers:['small'],deferredTiers:['standard','large','deep'],floors:1,interiorTiles:[26,28],exteriorTiles:[12,12],minimumEntranceChunks:1,minimumApproachChunks:1,encounter:'three-existing-ordinary-guards',reward:'ordinary-personal-completion-chest-v1',repeatable:true,legacyStonewatchUnchanged:true});
export const CRYPT_CONTENT_HASH='fd89aebc12ee8ee21fd55ae9c4133218a0206812a236707d17870b27a7574dae';
export const CRYPT_PACKAGE=freezeWire({packageId:CRYPT_PACKAGE_ID,packageVersion:PLANNED_CRYPT_VERSION,contentHash:CRYPT_CONTENT_HASH,siteClass:'dungeon',capabilities:['interior'],biomes:['grassland'],minimumLevel:1,maximumLevel:null,repeatable:true,unique:false,reservedSiteId:null});
export const CRYPT_CATALOG=freezeWire({schemaVersion:'site-content-catalog-d9-v1',catalogVersion:PLANNED_CRYPT_VERSION,packages:[CRYPT_PACKAGE]});
export const isCryptFamily=s=>s?.version===FUNCTIONAL_CRYPT_FAMILY;
export const plannedCryptIds=b=>b?.cryptPrototype===PLANNED_CRYPT_VERSION?[ALPHA_SMALL_CRYPT_ID]:[];
export function cryptGroupInfo(id){const m=/^site:site:[a-f0-9]{32}:crypt-small-floor-0(?::episode-([1-9][0-9]*))?$/.exec(id??'');return m&&(!m[1]||Number(m[1])>=2)?{floor:0,count:3}:null;}
