import {populationIds,ALPHA_POPULATION_SELECTIONS,hasAlphaPopulation} from './alpha_site_population_v1.js';
import {freezeWire} from '../contracts/wire.js';
import {PLANNED_RUIN_VERSION,RUIN_TIER_POLICY,RUIN_FAMILY_PACKAGE,ALPHA_RUIN_RESERVATION_IDS,plannedRuinIds,ruinGroupInfoV1,PLANNED_RUIN_CATALOG} from './planned_ruin_policy_v1.js';
export const PLANNED_RUIN_V2='planned-ruin-family-candidate-v2';
export const DEEP_RUIN_FIXTURE_ID='dev-fixture:ruin:volcanic:deep:01';
export const DEEP_RUIN_FIXTURE_ASSET_HASH='08afec90bd4984e8e503c77571d6864a8473da7cf4158e7f0c20af09232be523';
export const ALPHA_RUIN_V2_IDS=freezeWire([...ALPHA_RUIN_RESERVATION_IDS,'repeatable-slot:ruin:volcanic:large:01']);
export const RUIN_TIER_POLICY_V2=freezeWire({...RUIN_TIER_POLICY,
 large:{minimumExteriorChunks:6,minimumApproachChunks:2,exteriorTiles:[56,70],floors:[{role:'roofless-quadrangle',tiles:[44,38]},{role:'fractured-gallery',tiles:[38,34]},{role:'buried-sanctum',tiles:[40,36]}]},
 deep:{minimumExteriorChunks:6,minimumApproachChunks:2,exteriorTiles:[56,70],floors:[{role:'terraced-court',tiles:[46,40]},{role:'collapsed-cloister',tiles:[42,38]},{role:'buried-cistern',tiles:[40,40]},{role:'sealed-archive',tiles:[44,38]}]}});
export const RUIN_ADAPTATION_V2=freezeWire({version:PLANNED_RUIN_V2,parentRuntime:'8ac6eb56c3cf6f21',parentContentHash:RUIN_FAMILY_PACKAGE.contentHash,tiers:RUIN_TIER_POLICY_V2,preserveSmallStandard:true,exteriorVariants:[[56,70],[84,44]],interiorPolicy:'seeded-quadrangle-gallery-cloister-cistern-v2',rewardPolicy:'ordinary-floor-chest-personal-clearance-v1',encounterPolicy:'existing-ordinary-gargoyle-cursed-blade-rust-nibbler',deepPopulation:'isolated-development-fixture-only',clockPolicy:'unchanged-60hz-and-catch-up-caps'});
export const RUIN_CONTENT_HASH_V2='865e2dc45391ab883567d8484dadf58689d07c73b2de74877e6d6bcdac0b8a25';
export const RUIN_PACKAGE_V2=freezeWire({...RUIN_FAMILY_PACKAGE,packageVersion:PLANNED_RUIN_V2,contentHash:RUIN_CONTENT_HASH_V2});
export const RUIN_CATALOG_V2=freezeWire({schemaVersion:'site-content-catalog-d9-v1',catalogVersion:PLANNED_RUIN_V2,packages:[RUIN_PACKAGE_V2]});
export const plannedRuinIdsV2=b=>populationIds(b,'ruin')??(b?.ruinPrototype===PLANNED_RUIN_V2?(b.assetId==='ruin-deep-fixture'?[DEEP_RUIN_FIXTURE_ID]:ALPHA_RUIN_V2_IDS):plannedRuinIds(b));
export const ruinPackageForVersion=v=>v===PLANNED_RUIN_V2?RUIN_PACKAGE_V2:RUIN_FAMILY_PACKAGE;
export const ruinCatalogForVersion=v=>v===PLANNED_RUIN_V2?RUIN_CATALOG_V2:PLANNED_RUIN_CATALOG;
export const ruinTierPolicyForVersion=v=>v===PLANNED_RUIN_V2?RUIN_TIER_POLICY_V2:RUIN_TIER_POLICY;
export function ruinGroupInfoV2(id){const old=ruinGroupInfoV1(id);if(old)return old;const m=/^site:site:[a-f0-9]{32}:ruin-(large|deep)-floor-([0-3])(?::episode-([1-9][0-9]*))?$/.exec(id??'');if(!m||m[1]==='large'&&m[2]==='3'||m[3]&&Number(m[3])<2)return null;return {floor:Number(m[2]),count:m[1]==='large'?4:5};}
