import {CRYPT_DEFINITION_V2,CRYPT_DEFINITION_V3} from './crypt_family_runtime_v2.js';
import {CRYPT_FAMILY_DEFINITION} from './crypt_family_runtime_v1.js';
import {RUIN_PACKAGE_V2} from './planned_ruin_policy_v2.js';
import {RUIN_FAMILY_DEFINITION} from './ruin_family_runtime_v1.js';
import {FORT_FAMILY_DEFINITION,FORT_FAMILY_DEFINITION_V2} from './fort_family_runtime_v1.js?v=v3-6-aegis-deep-20261022';
import {WOODLAND_RUIN_PACKAGE,WOODLAND_RUIN_TEMPLATE,buildWoodlandRuinD9} from './woodland_ruin_d9.js';
import {WOODLAND_FORT_DEFINITION,buildWoodlandFortD10} from './woodland_fort_d10.js';
import {WOODLAND_CAVE_DEFINITION,buildWoodlandCaveD10} from './woodland_cave_d10.js';
import {WOODLAND_RUIN_D11_DEFINITION,WOODLAND_RUIN_D11_3_DEFINITION,WOODLAND_RUIN_D11_3_1_DEFINITION,WOODLAND_RUIN_D11_3_2_DEFINITION,WOODLAND_FORT_D11_DEFINITION,WOODLAND_CAVE_D11_DEFINITION,buildWoodlandRuinD11,buildWoodlandRuinD11_3,buildWoodlandRuinD11_3_1,buildWoodlandRuinD11_3_2,buildWoodlandFortD11,buildWoodlandCaveD11} from './woodland_sites_d11.js';
import {freezeWire} from '../contracts/wire.js';
import {WOODLAND_CAVE_FAMILY_DEFINITION_D12} from './site_family_runtime_d12.js';
import {WOODLAND_CAVE_FAMILY_DEFINITION_D12_1} from './site_family_runtime_d12_1.js';
import {WOODLAND_CAVE_FAMILY_DEFINITION_D12_2} from './site_family_runtime_d12_2.js';

const rows=[CRYPT_FAMILY_DEFINITION,CRYPT_DEFINITION_V2,CRYPT_DEFINITION_V3,RUIN_FAMILY_DEFINITION,{...RUIN_FAMILY_DEFINITION,family:{label:'Ruin'},package:RUIN_PACKAGE_V2},
 FORT_FAMILY_DEFINITION,
 FORT_FAMILY_DEFINITION_V2,
 {package:WOODLAND_RUIN_PACKAGE,template:WOODLAND_RUIN_TEMPLATE,groupSuffix:'overgrown-court',placement:'interior',build:buildWoodlandRuinD9},
 {...WOODLAND_FORT_DEFINITION,placement:'overworld-compound',build:buildWoodlandFortD10},
 {...WOODLAND_CAVE_DEFINITION,placement:'interior',build:buildWoodlandCaveD10},
 {...WOODLAND_RUIN_D11_DEFINITION,placement:'interior',build:buildWoodlandRuinD11},
 {...WOODLAND_RUIN_D11_3_DEFINITION,placement:'interior',build:buildWoodlandRuinD11_3},
 {...WOODLAND_RUIN_D11_3_1_DEFINITION,placement:'interior',build:buildWoodlandRuinD11_3_1},
 {...WOODLAND_RUIN_D11_3_2_DEFINITION,placement:'interior',build:buildWoodlandRuinD11_3_2},
 {...WOODLAND_FORT_D11_DEFINITION,placement:'overworld-compound',build:buildWoodlandFortD11},
 {...WOODLAND_CAVE_D11_DEFINITION,placement:'interior',build:buildWoodlandCaveD11},
 WOODLAND_CAVE_FAMILY_DEFINITION_D12,
 WOODLAND_CAVE_FAMILY_DEFINITION_D12_1,
 WOODLAND_CAVE_FAMILY_DEFINITION_D12_2
];
export const FUNCTIONAL_SITE_REGISTRY_D10=freezeWire(rows.map(({build,...row})=>row));
export const functionalSiteDefinitionD10=(packageId,packageVersion=null)=>[...rows].reverse().find(row=>row.package.packageId===packageId&&(packageVersion===null||row.package.packageVersion===packageVersion))??null;
export const functionalSiteDefinitionForGroupD10=groupId=>[...rows].reverse().find(row=>groupId.startsWith('site:')&&groupId.endsWith(':'+row.groupSuffix))??null;
