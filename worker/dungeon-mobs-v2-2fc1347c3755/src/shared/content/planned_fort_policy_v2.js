import {populationIds,ALPHA_POPULATION_SELECTIONS,hasAlphaPopulation} from './alpha_site_population_v1.js';
import {freezeWire} from '../contracts/wire.js';
import {FORT_TIER_POLICY,FORT_FAMILY_PACKAGE,ALPHA_FORT_RESERVATION_IDS,plannedFortIds} from './planned_fort_policy_v1.js';
export const PLANNED_FORT_V2='planned-fort-family-candidate-v2';
export const DEEP_FORT_FIXTURE_ID='dev-fixture:fort:tropical:deep:01';
export const DEEP_FORT_FIXTURE_ASSET_HASH='166e56d979d1c187a7354ab69ec362e9e65adaf954acc455d4634e01d352907b';
export const ALPHA_FORT_V2_IDS=freezeWire([...ALPHA_FORT_RESERVATION_IDS,'repeatable-slot:fort:tropical:large:01']);
export const FORT_ADAPTATION_V2=freezeWire({version:PLANNED_FORT_V2,parentRuntime:'422cbf122da801d1',parentContentHash:FORT_FAMILY_PACKAGE.contentHash,
  tiers:FORT_TIER_POLICY,exteriorPolicy:'actual-reserved-shape-bounded-layout-variants',standardWideTiles:[76,44],
  preserveExistingSmallStandard:true,interiorPolicy:'seeded-courtyard-gallery-vault-v2',rewardPolicy:'existing-ordinary-floor-chests-provisional',
  deepPopulation:'isolated-development-fixture-only',clockPolicy:'unchanged-60hz-and-catch-up-caps'});
export const FORT_CONTENT_HASH_V2='089700accd337a7bc3bb385f2ca41b59ce7a7e578c3ab34b686c4f10d4f4130f';
export const FORT_PACKAGE_V2=freezeWire({...FORT_FAMILY_PACKAGE,packageVersion:PLANNED_FORT_V2,contentHash:FORT_CONTENT_HASH_V2});
export const FORT_CATALOG_V2=freezeWire({schemaVersion:'site-content-catalog-d9-v1',catalogVersion:PLANNED_FORT_V2,packages:[FORT_PACKAGE_V2]});
export const plannedFortIdsV2=b=>populationIds(b,'fort')??(b?.fortPrototype===PLANNED_FORT_V2?(b.assetId==='fort-deep-fixture'?[DEEP_FORT_FIXTURE_ID]:ALPHA_FORT_V2_IDS):plannedFortIds(b));
export const fortPackageForVersion=v=>v===PLANNED_FORT_V2?FORT_PACKAGE_V2:FORT_FAMILY_PACKAGE;
