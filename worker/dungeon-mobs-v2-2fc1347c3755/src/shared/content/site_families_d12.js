import {freezeWire} from '../contracts/wire.js';
import {WOODLAND_CAVE_EXTERIOR} from './woodland_cave_d10.js';

export const SITE_FAMILY_DEFINITION_D12='site-family-definition-d12-v1';
export const WOODLAND_CAVE_FAMILY_ID='family:woodland-cave-d12';
export const WOODLAND_CAVE_FAMILY_VERSION='woodland-cave-family-d12-v1';
export const WOODLAND_CAVE_GENERATOR_VERSION='woodland-cave-generator-d12-v1';
export const WOODLAND_CAVE_MODULE_CATALOG_VERSION='woodland-cave-modules-d12-v1';
export const WOODLAND_CAVE_FAMILY_CONTENT_HASH='9088fb632063a7d4416a52ff0456b33cddd11bd85e26e11b7cf3c2d7931ab01b';
export const WOODLAND_CAVE_FAMILY_PACKAGE_ID='woodland-cave-family';

export const WOODLAND_CAVE_MODULE_ROLES=freezeWire([
 'arrival','encounter','small-chamber','large-chamber','straight-tunnel','turning-tunnel',
 'junction','loop','reward-dead-end','stairs-down','stairs-up','final-reward'
]);

export const WOODLAND_CAVE_FAMILY_D12=freezeWire({
 version:SITE_FAMILY_DEFINITION_D12,
 familyId:WOODLAND_CAVE_FAMILY_ID,
 familyVersion:WOODLAND_CAVE_FAMILY_VERSION,
 siteKind:'woodland-cave',visualKey:'d10.2.1-woodland-cave',label:'Woodland Cave',
 biomes:['woodland'],placement:{kind:'road-connected-exterior',footprint:{width:WOODLAND_CAVE_EXTERIOR.width,height:WOODLAND_CAVE_EXTERIOR.height},exteriorVersion:'woodland-cave-d10-2-v1'},
 generatorVersion:WOODLAND_CAVE_GENERATOR_VERSION,moduleCatalogVersion:WOODLAND_CAVE_MODULE_CATALOG_VERSION,
 tiers:[
  {tier:'small',weight:34,floors:[1,1],rooms:[4,5],threat:[2,3],rewardBudget:1},
  {tier:'standard',weight:38,floors:[1,2],rooms:[5,7],threat:[2,4],rewardBudget:2},
  {tier:'large',weight:22,floors:[2,3],rooms:[7,9],threat:[3,5],rewardBudget:3},
  {tier:'deep',weight:6,floors:[3,4],rooms:[8,10],threat:[3,5],rewardBudget:4}
 ],
 encounterPolicy:{rank:'C',families:['rust_nibbler','slime','sprout','golem'],maximumMembersPerFloor:5},
 rewardPolicy:{kind:'chest',art:'chest',completion:true},
 supportedModuleRoles:WOODLAND_CAVE_MODULE_ROLES,
 source:{milestone:'D12',reference:'D10.2.1 Woodland Cave',provenance:'World-owned deterministic hybrid cave modules'}
});

export const WOODLAND_CAVE_FAMILY_PACKAGE_D12=freezeWire({
 packageId:WOODLAND_CAVE_FAMILY_PACKAGE_ID,packageVersion:WOODLAND_CAVE_FAMILY_VERSION,contentHash:WOODLAND_CAVE_FAMILY_CONTENT_HASH,
 siteClass:'dungeon',capabilities:['interior'],biomes:['woodland'],minimumLevel:1,maximumLevel:null,repeatable:true,unique:false,reservedSiteId:null
});
