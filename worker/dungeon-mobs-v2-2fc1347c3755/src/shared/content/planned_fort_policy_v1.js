import {freezeWire} from '../contracts/wire.js';
// Explicit adaptation; the accepted D10/D11 single Fort package is untouched.
export const PLANNED_FORT_VERSION='planned-fort-family-candidate-v1';
export const PLANNED_FORT_SOCKET='site-socket-planned-fort-v1';
export const PLANNED_FORT_RESERVATION='site-reservation-planned-fort-v1';
export const FUNCTIONAL_FORT_FAMILY='functional-fort-family-v1';
export const FORT_FAMILY_PACKAGE_ID='procedural-fort-family';
export const FORT_TIER_POLICY=freezeWire({
 small:{minimumExteriorChunks:4,minimumApproachChunks:2,exteriorTiles:[48,36],floors:[{role:'ground',tiles:[14,12]}]},
 standard:{minimumExteriorChunks:6,minimumApproachChunks:2,exteriorTiles:[56,60],floors:[{role:'ground',tiles:[24,22]},{role:'upper',tiles:[24,22]},{role:'underground',tiles:[32,28]}]},
 large:{minimumExteriorChunks:9,minimumApproachChunks:3,exteriorTiles:[80,70],floors:[{role:'ground',tiles:[30,26]},{role:'upper',tiles:[30,26]},{role:'upper-tower',tiles:[24,22]},{role:'underground',tiles:[38,32]}]},
 deep:{minimumExteriorChunks:9,minimumApproachChunks:3,exteriorTiles:[80,70],floors:[{role:'ground',tiles:[30,26]},{role:'upper',tiles:[30,26]},{role:'underground',tiles:[38,32]},{role:'deep-underground',tiles:[40,34]}]}
});
export const ALPHA_FORT_RESERVATION_IDS=freezeWire(['repeatable-slot:fort:grassland:small:01','repeatable-slot:fort:woodland:standard:01']);
export const FORT_ADAPTATION=freezeWire({version:PLANNED_FORT_VERSION,parentPackageId:'woodland-fort',parentVersion:'woodland-fort-d11.2-v1',parentContentHash:'f79728292e714330b5139fbca3c4e14b57722b17d45b013a2e7bc50162485a22',repeatable:true,unique:false,exteriorProfile:'compound-monument',interiorScaleIndependent:true,resetPolicy:'explicit-cleared-vacant-no-transition-bounded-d13c2',encounterPolicy:'temporary-existing-ordinary-and-elite-v1',rewardPolicy:'existing-ordinary-floor-chests-provisional',biomePolicy:'authoritative-planned-reservation-biome',tiers:FORT_TIER_POLICY});
export const FORT_FAMILY_CONTENT_HASH='fb01ee67919c53e545b69d440a9df99b035a86bca6162d61b3c2a483e5b3380f';
export const FORT_FAMILY_PACKAGE=freezeWire({packageId:FORT_FAMILY_PACKAGE_ID,packageVersion:PLANNED_FORT_VERSION,contentHash:FORT_FAMILY_CONTENT_HASH,siteClass:'dungeon',capabilities:['interior'],biomes:['woodland','grassland','wetland','upland','desert','frostland','tropical','volcanic'],minimumLevel:1,maximumLevel:null,repeatable:true,unique:false,reservedSiteId:null});
// Only explicitly reserved planned Fort sockets consume this catalog.
export const PLANNED_FORT_CATALOG=freezeWire({schemaVersion:'site-content-catalog-d9-v1',catalogVersion:PLANNED_FORT_VERSION,packages:[FORT_FAMILY_PACKAGE]});
export const isFortFamily=site=>site?.version===FUNCTIONAL_FORT_FAMILY;
export const plannedFortIds=binding=>binding?.fortPrototype===PLANNED_FORT_VERSION?ALPHA_FORT_RESERVATION_IDS:[];

// Ownership pages retain this exact group domain after live actors retire.
export function fortGroupFloorIndexV1(groupId){const m=/^site:site:[a-f0-9]{32}:fort-floor-([0-3])(?::episode-([1-9][0-9]*))?$/.exec(groupId??'');if(!m)return null;if(m[2]&&(!Number.isSafeInteger(Number(m[2]))||Number(m[2])<2))return null;return Number(m[1]);}
