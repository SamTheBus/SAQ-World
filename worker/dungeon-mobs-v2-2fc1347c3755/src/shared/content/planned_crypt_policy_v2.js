import {populationIds,ALPHA_POPULATION_SELECTIONS,hasAlphaPopulation} from './alpha_site_population_v1.js';
import {freezeWire,requireContract as check} from '../contracts/wire.js';
import {PLANNED_CRYPT_VERSION,CRYPT_PACKAGE,ALPHA_SMALL_CRYPT_ID,plannedCryptIds,cryptGroupInfo} from './planned_crypt_policy_v1.js';
export const PLANNED_CRYPT_V2='planned-crypt-family-candidate-v2';
export const ALPHA_STANDARD_CRYPT_ID='repeatable-slot:crypt:upland:standard:01';
export const ALPHA_DEEP_CRYPT_ID='repeatable-slot:crypt:frostland:deep:01';
export const LARGE_CRYPT_FIXTURE_ID='dev-fixture:crypt:upland:large:01';
export const CRYPT_TIER_POLICY_V2=freezeWire({
 standard:{floors:[{role:'ancestral-nave',tiles:[32,30]},{role:'ossuary-galleries',tiles:[34,30]}]},
 large:{floors:[{role:'processional-hall',tiles:[38,32]},{role:'family-vaults',tiles:[36,34]},{role:'buried-sanctuary',tiles:[38,32]}]},
 deep:{floors:[{role:'memorial-crossing',tiles:[40,34]},{role:'catacomb-loops',tiles:[38,36]},{role:'sealed-archives',tiles:[40,34]},{role:'royal-tomb',tiles:[40,36]}]}
});
export const CRYPT_POLICY_V2=freezeWire({version:PLANNED_CRYPT_V2,parentRuntime:'b4582b6fa03b0988',parentVersion:PLANNED_CRYPT_VERSION,familyId:'site-family:crypt',tiers:CRYPT_TIER_POLICY_V2,exteriorTiles:[12,12],minimumEntranceChunks:1,minimumApproachChunks:1,encounter:'four-existing-ordinary-guards-per-floor',reward:'ordinary-personal-completion-chest-v1',repeatable:true,legacyStonewatchUnchanged:true,smallVersionUnchanged:true});
export const CRYPT_CONTENT_HASH_V2='72153add1755b454e8e11aac4be6aeff986cd97f4a4312d16b7cb29318718908';
export const CRYPT_PACKAGE_V2=freezeWire({...CRYPT_PACKAGE,packageVersion:PLANNED_CRYPT_V2,contentHash:CRYPT_CONTENT_HASH_V2,biomes:['upland','frostland']});
export const CRYPT_CATALOG_V2=freezeWire({schemaVersion:'site-content-catalog-d9-v1',catalogVersion:PLANNED_CRYPT_V2,packages:[CRYPT_PACKAGE_V2]});
export function cryptPackageForVersion(v){check([PLANNED_CRYPT_VERSION,PLANNED_CRYPT_V2].includes(v),'Unknown Crypt package version');return v===PLANNED_CRYPT_V2?CRYPT_PACKAGE_V2:CRYPT_PACKAGE;}
export function cryptIdsForBinding(b){if(hasAlphaPopulation(b))return populationIds(b,'crypt');return b?.cryptPrototype===PLANNED_CRYPT_V2?(b.assetId==='crypt-large-fixture'?[LARGE_CRYPT_FIXTURE_ID]:[ALPHA_SMALL_CRYPT_ID,ALPHA_STANDARD_CRYPT_ID,ALPHA_DEEP_CRYPT_ID]):plannedCryptIds(b);}
export function cryptGroupInfoV2(id){const old=cryptGroupInfo(id);if(old)return old;const m=/^site:site:[a-f0-9]{32}:crypt-(standard|large|deep)-floor-([0-3])(?::episode-([1-9][0-9]*))?$/.exec(id??'');return m&&(!m[3]||Number(m[3])>=2)&&Number(m[2])<CRYPT_TIER_POLICY_V2[m[1]].floors.length?{floor:Number(m[2]),count:4}:null;}
