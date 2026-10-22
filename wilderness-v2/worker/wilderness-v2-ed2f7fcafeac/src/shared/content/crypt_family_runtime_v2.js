import {CRYPT_POPULATION_VERSION,CRYPT_POPULATION_PACKAGE,CRYPT_POPULATION_TIERS,cryptPopulationRecipe,cryptPopulationLinks} from './crypt_population_v3.js';
import {buildRuinFamilyV1} from './ruin_family_runtime_v1.js';
import {CRYPT_PACKAGE_V2,PLANNED_CRYPT_V2,CRYPT_TIER_POLICY_V2} from './planned_crypt_policy_v2.js';
import {FUNCTIONAL_CRYPT_FAMILY} from './planned_crypt_policy_v1.js';
import {buildCryptFamilyV1} from './crypt_family_runtime_v1.js';
import {cryptFloorRecipeV2,cryptFloorLinksV2} from '../generation/crypt_family_v2.js';
export const CRYPT_CONFIGURATION_V2=Object.freeze({version:PLANNED_CRYPT_V2,package:CRYPT_PACKAGE_V2,functionalVersion:FUNCTIONAL_CRYPT_FAMILY,familyId:'site-family:crypt',siteKind:'procedural-crypt',groupPrefix:'crypt',policy:CRYPT_TIER_POLICY_V2,recipe:cryptFloorRecipeV2,links:cryptFloorLinksV2});
export const CRYPT_CONFIGURATION_V3=Object.freeze({...CRYPT_CONFIGURATION_V2,version:CRYPT_POPULATION_VERSION,package:CRYPT_POPULATION_PACKAGE,policy:CRYPT_POPULATION_TIERS,recipe:cryptPopulationRecipe,links:cryptPopulationLinks});
export const buildCryptFamilyV2=(state,socket,binding,options)=>socket.provenance.placementVersion===CRYPT_POPULATION_VERSION?buildRuinFamilyV1(state,socket,binding,{...options,familyDefinition:CRYPT_CONFIGURATION_V3}):socket.provenance.placementVersion===PLANNED_CRYPT_V2?buildRuinFamilyV1(state,socket,binding,{...options,familyDefinition:CRYPT_CONFIGURATION_V2}):buildCryptFamilyV1(state,socket,binding,options);
export const CRYPT_DEFINITION_V2=Object.freeze({package:CRYPT_PACKAGE_V2,family:{label:'Crypt'},placement:'generated-interior-family',build:buildCryptFamilyV2});

export const CRYPT_DEFINITION_V3=Object.freeze({...CRYPT_DEFINITION_V2,family:{label:'Crypt'},package:CRYPT_POPULATION_PACKAGE});
