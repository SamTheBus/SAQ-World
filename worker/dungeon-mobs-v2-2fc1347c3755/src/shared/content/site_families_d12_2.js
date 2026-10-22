import {freezeWire} from '../contracts/wire.js';
import {WOODLAND_CAVE_EXTERIOR} from './woodland_cave_d10.js';
import {WOODLAND_CAVE_FAMILY_ID,WOODLAND_CAVE_FAMILY_PACKAGE_ID} from './site_families_d12.js';
import {WOODLAND_CAVE_FORMATION_CATALOG_D12_2_VERSION,WOODLAND_CAVE_FORMATIONS_D12_2} from './woodland_cave_formations_d12_2.js';

export const SITE_FAMILY_DEFINITION_D12_2='site-family-definition-d12-2-v1';
export const WOODLAND_CAVE_FAMILY_VERSION_D12_2='woodland-cave-family-d12-2-v1';
export const WOODLAND_CAVE_GENERATOR_VERSION_D12_2='woodland-cave-generator-d12-2-v1';
export const WOODLAND_CAVE_FAMILY_CONTENT_HASH_D12_2='0fa63b1ae2f1d2f61c9438cff09449039ba634cf594459d514f787e252e17c45';

export const WOODLAND_CAVE_FAMILY_D12_2=freezeWire({
 version:SITE_FAMILY_DEFINITION_D12_2,familyId:WOODLAND_CAVE_FAMILY_ID,familyVersion:WOODLAND_CAVE_FAMILY_VERSION_D12_2,
 siteKind:'woodland-cave',visualKey:'d12.2-natural-woodland-cave',label:'Woodland Cave',biomes:['woodland'],
 placement:{kind:'lazy-region-owned-road-reservation',footprint:{width:WOODLAND_CAVE_EXTERIOR.width,height:WOODLAND_CAVE_EXTERIOR.height},exteriorVersion:'woodland-cave-d12-2-v1',minimumSeparationTiles:40,regionInteriorMarginTiles:14,nearStartGuarantee:1,densityWeights:{zero:34,one:56,two:10}},
 generatorVersion:WOODLAND_CAVE_GENERATOR_VERSION_D12_2,moduleCatalogVersion:WOODLAND_CAVE_FORMATION_CATALOG_D12_2_VERSION,
 tiers:[
  {tier:'small',weight:34,floors:[1,1],rooms:[4,5],threat:[2,3],rewardBudget:1},
  {tier:'standard',weight:38,floors:[1,2],rooms:[5,7],threat:[2,4],rewardBudget:2},
  {tier:'large',weight:22,floors:[2,3],rooms:[7,9],threat:[3,5],rewardBudget:3},
  {tier:'deep',weight:6,floors:[3,4],rooms:[8,10],threat:[3,5],rewardBudget:4}
 ],
 floorCharacters:['root-choked','fungal','damp','mineral-rich','collapsed','bone-strewn','broad-cavern','tight-burrow'],
 topologyForms:['winding','fork-pocket','central-cavern','split-rejoin','partial-loop','descending-spine'],
 encounterPolicy:{rank:'C',families:['rust_nibbler','slime','sprout','golem'],maximumMembersPerFloor:5,minimumSeparationTiles:3},
 rewardPolicy:{kind:'chest',art:'chest',completion:true},moduleCatalog:WOODLAND_CAVE_FORMATIONS_D12_2,
 source:{milestone:'D12.2',reference:'D12.1 deterministic cave authority',provenance:'Region-owned topology-first socket assembly'}
});

export const WOODLAND_CAVE_FAMILY_PACKAGE_D12_2=freezeWire({
 packageId:WOODLAND_CAVE_FAMILY_PACKAGE_ID,packageVersion:WOODLAND_CAVE_FAMILY_VERSION_D12_2,contentHash:WOODLAND_CAVE_FAMILY_CONTENT_HASH_D12_2,
 siteClass:'dungeon',capabilities:['interior'],biomes:['woodland'],minimumLevel:1,maximumLevel:null,repeatable:true,unique:false,reservedSiteId:null
});
