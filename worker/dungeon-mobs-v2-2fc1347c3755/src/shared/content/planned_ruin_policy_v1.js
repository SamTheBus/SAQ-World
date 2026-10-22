import {freezeWire} from '../contracts/wire.js';
// Successor adaptation only. No legacy Overgrown Ruin record is replaced.
export const PLANNED_RUIN_VERSION='planned-ruin-family-candidate-v1';
export const PLANNED_RUIN_SOCKET='site-socket-planned-ruin-v1';
export const PLANNED_RUIN_RESERVATION='site-reservation-planned-ruin-v1';
export const FUNCTIONAL_RUIN_FAMILY='functional-ruin-family-v1';
export const RUIN_FAMILY_PACKAGE_ID='procedural-ruin-family';
export const RUIN_TIER_POLICY=freezeWire({small:{minimumExteriorChunks:2,minimumApproachChunks:1,exteriorTiles:[26,44],floors:[{role:'roofless-hall',tiles:[22,30]}]},standard:{minimumExteriorChunks:4,minimumApproachChunks:2,exteriorTiles:[56,44],floors:[{role:'broken-courtyard',tiles:[38,30]},{role:'buried-foundation',tiles:[30,26]}]}});
export const ALPHA_RUIN_RESERVATION_IDS=freezeWire(['repeatable-slot:ruin:woodland:small:01','repeatable-slot:ruin:upland:standard:01']);
export const RUIN_ADAPTATION=freezeWire({version:PLANNED_RUIN_VERSION,parentPackageId:'woodland-overgrown-ruin',parentVersion:'woodland-overgrown-ruin-d11.3.2-v1',parentContentHash:'fc5a1d75f2a96b1fef0eceac18adbeee2db1005028f81c8a4e029ac2464fde29',repeatable:true,unique:false,exteriorProfile:'open-landmark',interiorScaleIndependent:true,resetPolicy:'explicit-cleared-vacant-no-transition-bounded-d13c2',encounterPolicy:'existing-gargoyle-cursed-blade-v1',rewardPolicy:'ordinary-floor-chest-personal-clearance-v1',unimplementedTiers:['large','deep'],tiers:RUIN_TIER_POLICY});
export const RUIN_FAMILY_CONTENT_HASH='34679f7f989b54f63283563e62aed234ab5f6db98207757dfd35a979e08bef5c';
export const RUIN_FAMILY_PACKAGE=freezeWire({packageId:RUIN_FAMILY_PACKAGE_ID,packageVersion:PLANNED_RUIN_VERSION,contentHash:RUIN_FAMILY_CONTENT_HASH,siteClass:'dungeon',capabilities:['interior'],biomes:['woodland','grassland','wetland','upland','desert','frostland','tropical','volcanic'],minimumLevel:1,maximumLevel:null,repeatable:true,unique:false,reservedSiteId:null});
export const PLANNED_RUIN_CATALOG=freezeWire({schemaVersion:'site-content-catalog-d9-v1',catalogVersion:PLANNED_RUIN_VERSION,packages:[RUIN_FAMILY_PACKAGE]});
export const isRuinFamily=site=>site?.version===FUNCTIONAL_RUIN_FAMILY;
export const plannedRuinIds=binding=>binding?.ruinPrototype===PLANNED_RUIN_VERSION?ALPHA_RUIN_RESERVATION_IDS:[];
export function ruinGroupInfoV1(id){const m=/^site:site:[a-f0-9]{32}:ruin-(small|standard)-floor-([01])(?::episode-([1-9][0-9]*))?$/.exec(id??'');if(!m||m[1]==='small'&&m[2]!=='0'||m[3]&&Number(m[3])<2)return null;return {floor:Number(m[2]),count:m[1]==='small'?2:3};}
