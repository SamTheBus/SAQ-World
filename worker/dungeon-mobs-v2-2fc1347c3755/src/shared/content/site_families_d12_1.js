import {freezeWire} from '../contracts/wire.js';
import {WOODLAND_CAVE_EXTERIOR} from './woodland_cave_d10.js';
import {WOODLAND_CAVE_FAMILY_ID,WOODLAND_CAVE_FAMILY_PACKAGE_ID} from './site_families_d12.js';
import {WOODLAND_CAVE_MODULE_CATALOG_D12_1_VERSION,WOODLAND_CAVE_MODULES_D12_1} from './woodland_cave_modules_d12_1.js';

export const SITE_FAMILY_DEFINITION_D12_1='site-family-definition-d12-1-v1';
export const WOODLAND_CAVE_FAMILY_VERSION_D12_1='woodland-cave-family-d12-1-v1';
export const WOODLAND_CAVE_GENERATOR_VERSION_D12_1='woodland-cave-generator-d12-1-v1';
export const WOODLAND_CAVE_FAMILY_CONTENT_HASH_D12_1='6bc2752295a516b132c51a23f6104764209b97e7dc4c087796184a8d604de10f';

export const WOODLAND_CAVE_FAMILY_D12_1=freezeWire({
 version:SITE_FAMILY_DEFINITION_D12_1,familyId:WOODLAND_CAVE_FAMILY_ID,familyVersion:WOODLAND_CAVE_FAMILY_VERSION_D12_1,
 siteKind:'woodland-cave',visualKey:'d12.1-woodland-cave',label:'Woodland Cave',biomes:['woodland'],
 placement:{kind:'regional-road-reservation',footprint:{width:WOODLAND_CAVE_EXTERIOR.width,height:WOODLAND_CAVE_EXTERIOR.height},exteriorVersion:'woodland-cave-d12-1-v1',reservationCount:10,nearStartGuarantee:1,minimumSeparationTiles:28,distanceBandTiles:28},
 generatorVersion:WOODLAND_CAVE_GENERATOR_VERSION_D12_1,moduleCatalogVersion:WOODLAND_CAVE_MODULE_CATALOG_D12_1_VERSION,
 tiers:[
  {tier:'small',weight:34,floors:[1,1],rooms:[4,5],threat:[2,3],rewardBudget:1},
  {tier:'standard',weight:38,floors:[1,2],rooms:[5,7],threat:[2,4],rewardBudget:2},
  {tier:'large',weight:22,floors:[2,3],rooms:[7,9],threat:[3,5],rewardBudget:3},
  {tier:'deep',weight:6,floors:[3,4],rooms:[8,10],threat:[3,5],rewardBudget:4}
 ],
 encounterPolicy:{rank:'C',families:['rust_nibbler','slime','sprout','golem'],maximumMembersPerFloor:5,minimumSeparationTiles:3},
 rewardPolicy:{kind:'chest',art:'chest',completion:true},moduleCatalog:WOODLAND_CAVE_MODULES_D12_1,
 source:{milestone:'D12.1',reference:'D12 deterministic cave authority',provenance:'World-owned authored cave-module assembly'}
});

export const WOODLAND_CAVE_FAMILY_PACKAGE_D12_1=freezeWire({
 packageId:WOODLAND_CAVE_FAMILY_PACKAGE_ID,packageVersion:WOODLAND_CAVE_FAMILY_VERSION_D12_1,contentHash:WOODLAND_CAVE_FAMILY_CONTENT_HASH_D12_1,
 siteClass:'dungeon',capabilities:['interior'],biomes:['woodland'],minimumLevel:1,maximumLevel:null,repeatable:true,unique:false,reservedSiteId:null
});

