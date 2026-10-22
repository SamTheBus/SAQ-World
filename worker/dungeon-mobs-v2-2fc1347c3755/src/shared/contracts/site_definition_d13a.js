import {CRYPT_POPULATION_VERSION,CRYPT_POPULATION_TIERS} from '../content/crypt_population_v3.js';
import {PLANNED_CRYPT_V2,CRYPT_TIER_POLICY_V2} from '../content/planned_crypt_policy_v2.js';
import {CRYPT_PACKAGE_ID,PLANNED_CRYPT_VERSION} from '../content/planned_crypt_policy_v1.js';
import {functionalSiteDefinitionD10} from '../content/functional_site_registry_d10.js';
import {manifestForState} from './overworld.js';
import {closedRecord,copyWire,freezeWire,requireContract,safeInteger} from './wire.js';
import {WOODLAND_CAVE_FINALE_PROFILE_D13D_A} from './site_finale_d13d.js';

export const UNIVERSAL_SITE_DEFINITION_D13A='universal-site-definition-d13a-v2';
export const STONEWATCH_LOCATION_DEFINITION_ID='def:d2000000000000000000000000000002';

export const SITE_FAMILY_REGISTRY_D13A=freezeWire([
 {familyId:'cave',displayName:'Cave'},
 {familyId:'ruin',displayName:'Ruin'},
 {familyId:'fort',displayName:'Fort'},
 {familyId:'crypt',displayName:'Crypt'}
]);

// This registry describes identity and lifecycle semantics. Existing manifest,
// reservation, functional-site, geometry, encounter and reward records remain
// authoritative for their own state.
export const SITE_DEFINITION_REGISTRY_D13A=freezeWire([
 {familyId:'crypt',namedVariantId:null,packageId:'procedural-crypt-family',locationDefinitionId:null,placementClass:'family-instance',layoutClass:'seeded-procedural',fixedFloorCount:1,floorCountRule:'floor-count-rule:crypt-small-v1',resetPolicyRef:'reset-policy:explicit-cleared-vacant-crypt-small-v1'},
 {familyId:'ruin',namedVariantId:null,packageId:'procedural-ruin-family',locationDefinitionId:null,placementClass:'family-instance',layoutClass:'seeded-procedural',fixedFloorCount:null,floorCountRule:'floor-count-rule:ruin-family-v1',resetPolicyRef:'reset-policy:explicit-cleared-vacant-ruin-family-v1'},
 {familyId:'fort',namedVariantId:null,packageId:'procedural-fort-family',locationDefinitionId:null,placementClass:'family-instance',layoutClass:'seeded-procedural',fixedFloorCount:null,floorCountRule:'floor-count-rule:fort-family-v1',resetPolicyRef:'reset-policy:explicit-cleared-vacant-fort-family-v1'},
 {familyId:'cave',namedVariantId:null,packageId:'woodland-cave',locationDefinitionId:null,placementClass:'family-instance',layoutClass:'fixed-authored',fixedFloorCount:1,floorCountRule:null,resetPolicyRef:'reset-policy:persistent-clear-no-reset'},
 {familyId:'cave',namedVariantId:null,packageId:'woodland-cave-family',locationDefinitionId:null,placementClass:'family-instance',layoutClass:'seeded-procedural',fixedFloorCount:null,floorCountRule:'floor-count-rule:woodland-cave-tier-d12.2',resetPolicyRef:'reset-policy:persistent-clear-no-reset'},
 {familyId:'ruin',namedVariantId:null,packageId:'woodland-overgrown-ruin',locationDefinitionId:null,placementClass:'family-instance',layoutClass:'fixed-authored',fixedFloorCount:1,floorCountRule:null,resetPolicyRef:'reset-policy:persistent-clear-no-reset'},
 {familyId:'fort',namedVariantId:null,packageId:'woodland-fort',locationDefinitionId:null,placementClass:'family-instance',layoutClass:'fixed-authored',fixedFloorCount:1,floorCountRule:null,resetPolicyRef:'reset-policy:persistent-clear-no-reset'},
 {familyId:'crypt',namedVariantId:'stonewatch',packageId:null,locationDefinitionId:STONEWATCH_LOCATION_DEFINITION_ID,placementClass:'unique-landmark',layoutClass:'fixed-authored',fixedFloorCount:1,floorCountRule:null,resetPolicyRef:'reset-policy:persistent-clear-no-reset'}
]);

const blueprintForPackage=packageId=>SITE_DEFINITION_REGISTRY_D13A.find(row=>row.packageId===packageId)??null;
const stonewatchBlueprint=()=>SITE_DEFINITION_REGISTRY_D13A.find(row=>row.namedVariantId==='stonewatch');
const regionIdForSocket=socket=>socket?.region?`d9-region:${socket.region.regionX},${socket.region.regionY}`:null;
const regionBinding=(manifest,{socket=null,site=null,parcel=null,legacySite=null}={})=>{
 const regionId=legacySite?.regionId??regionIdForSocket(socket),region=manifest.regions?.find(row=>row.regionId===regionId)??null;
 return {
  biome:socket?.region?.biome??region?.biome??null,
  regionId,
  regionName:site?.regionName??parcel?.regionName??region?.label??null
 };
};
const packageProfileRef=(definition,facet)=>`${definition.package.packageId}:${definition.package.packageVersion}:${facet}`;

function resolveFunctional(state,manifest,siteId){
 const site=state.d9World?.functionalSitesById?.[siteId]??null,reservation=state.d9World?.siteReservationsById?.[siteId]??null;
 if(!site&&!reservation)return null;
 const packageId=site?.packageId??reservation?.packageId,blueprint=blueprintForPackage(packageId);
 if(!blueprint)return null;
 const definition=functionalSiteDefinitionD10(packageId,site?.packageVersion??(packageId===CRYPT_PACKAGE_ID?reservation?.socket.provenance.placementVersion:null));
 if(!definition)return null;
 const socket=site?.socket??reservation?.socket,parcel=reservation?.parcel??null,generated=definition.placement==='generated-interior-family';
 const floorCount=site?.floorCount??(packageId===CRYPT_PACKAGE_ID&&[PLANNED_CRYPT_V2,CRYPT_POPULATION_VERSION].includes(socket.provenance.placementVersion)?(socket.provenance.placementVersion===CRYPT_POPULATION_VERSION?CRYPT_POPULATION_TIERS:CRYPT_TIER_POLICY_V2)[parcel.tier].floors.length:blueprint.fixedFloorCount);
 return freezeWire({
  version:UNIVERSAL_SITE_DEFINITION_D13A,
  siteId,
  familyId:blueprint.familyId,
  namedVariantId:blueprint.namedVariantId,
  displayName:site?.label??parcel?.label??definition.template?.label??definition.family?.label,
  biomeOrRegionBinding:regionBinding(manifest,{socket,site,parcel}),
  tier:site?.sizeTier??parcel?.tier??null,
  floorCount:floorCount??null,
  floorCountRule:generated?(packageId===CRYPT_PACKAGE_ID&&socket.provenance.placementVersion===CRYPT_POPULATION_VERSION?'floor-count-rule:crypt-reservation-population-v3':packageId===CRYPT_PACKAGE_ID&&socket.provenance.placementVersion===PLANNED_CRYPT_V2?'floor-count-rule:crypt-family-v2':blueprint.floorCountRule):null,
  layoutIdentity:generated?(site?.layoutSeed??parcel?.layoutSeed??definition.package.contentHash):(site?.interior?.contentHash??definition.package.contentHash),
  minimumLevel:socket?.minimumLevel??definition.package.minimumLevel??null,
  placementClass:blueprint.placementClass,
  layoutClass:blueprint.layoutClass,
  encounterProfileRef:packageProfileRef(definition,'encounter'),
  finaleProfileRef:packageId==='woodland-cave-family'?WOODLAND_CAVE_FINALE_PROFILE_D13D_A:null,
  rewardProfileRef:packageProfileRef(definition,'reward'),
  resetPolicyRef:packageId===CRYPT_PACKAGE_ID&&socket.provenance.placementVersion===PLANNED_CRYPT_V2?'reset-policy:explicit-cleared-vacant-crypt-family-v2':blueprint.resetPolicyRef,
  uniqueLootProfileRef:null,
  artifactRef:null,
  sigilModifierSlot:null
 });
}

function resolveStonewatch(state,manifest,siteId){
 const legacySite=manifest.sites?.find(row=>row.locationId===siteId)??null,interior=manifest.siteInteriors?.find(row=>row.siteId===siteId)??null;
 if(!legacySite||!interior||legacySite.locationDefinitionId!==STONEWATCH_LOCATION_DEFINITION_ID||legacySite.properName!=='Stonewatch')return null;
 const blueprint=stonewatchBlueprint();
 return freezeWire({
  version:UNIVERSAL_SITE_DEFINITION_D13A,
  siteId,
  familyId:blueprint.familyId,
  namedVariantId:blueprint.namedVariantId,
  displayName:legacySite.properName,
  biomeOrRegionBinding:regionBinding(manifest,{legacySite}),
  tier:legacySite.siteTier??null,
  floorCount:blueprint.fixedFloorCount,
  floorCountRule:null,
  layoutIdentity:interior.contentHash,
  minimumLevel:null,
  placementClass:blueprint.placementClass,
  layoutClass:blueprint.layoutClass,
  encounterProfileRef:`${interior.recipeVersion}:encounter`,
  finaleProfileRef:null,
  rewardProfileRef:'encounter-economy:ordinary-site-rewards',
  resetPolicyRef:blueprint.resetPolicyRef,
  uniqueLootProfileRef:null,
  artifactRef:null,
  sigilModifierSlot:null
 });
}

export function resolveSiteDefinitionD13A(state,siteId){
 const manifest=manifestForState(state);
 return resolveStonewatch(state,manifest,siteId)??resolveFunctional(state,manifest,siteId);
}

export function resolveAuthoritativeSiteDefinitionsD13A(state){
 const manifest=manifestForState(state),ids=new Set();
 for(const interior of manifest.siteInteriors??[])ids.add(interior.siteId);
 for(const siteId of Object.keys(state.d9World?.siteReservationsById??{}))ids.add(siteId);
 for(const siteId of Object.keys(state.d9World?.functionalSitesById??{}))ids.add(siteId);
 return freezeWire([...ids].sort().map(siteId=>resolveStonewatch(state,manifest,siteId)??resolveFunctional(state,manifest,siteId)).filter(Boolean));
}

export function validateResolvedSiteDefinitionD13A(definition){
 closedRecord(definition,['version','siteId','familyId','namedVariantId','displayName','biomeOrRegionBinding','tier','floorCount','floorCountRule','layoutIdentity','minimumLevel','placementClass','layoutClass','encounterProfileRef','finaleProfileRef','rewardProfileRef','resetPolicyRef','uniqueLootProfileRef','artifactRef','sigilModifierSlot']);
 requireContract(definition.version===UNIVERSAL_SITE_DEFINITION_D13A&&/^(?:site|loc):[0-9a-f]{32}$/.test(definition.siteId),'Invalid universal site identity');
 requireContract(SITE_FAMILY_REGISTRY_D13A.some(row=>row.familyId===definition.familyId),'Unknown universal site family');
 requireContract(definition.namedVariantId===null||/^[a-z0-9-]{1,48}$/.test(definition.namedVariantId),'Invalid named site variant');
 requireContract(typeof definition.displayName==='string'&&definition.displayName.length>=1&&definition.displayName.length<=96,'Invalid site display name');
 const binding=definition.biomeOrRegionBinding;closedRecord(binding,['biome','regionId','regionName']);
 requireContract(binding.biome===null||typeof binding.biome==='string','Invalid site biome binding');
 requireContract(binding.regionId===null||typeof binding.regionId==='string','Invalid site region identity');
 requireContract(binding.regionName===null||typeof binding.regionName==='string','Invalid site region name');
 requireContract(binding.biome!==null||binding.regionId!==null,'Site must bind a biome or region');
 requireContract(definition.tier===null||typeof definition.tier==='string','Invalid site tier');
 if(definition.floorCount!==null)safeInteger(definition.floorCount,1,32);
 requireContract(definition.floorCountRule===null||typeof definition.floorCountRule==='string','Invalid floor-count rule');
 requireContract(definition.floorCount!==null||definition.floorCountRule!==null,'Site needs fixed floor count or floor-count rule');
 requireContract(typeof definition.layoutIdentity==='string'&&definition.layoutIdentity.length>=1&&definition.layoutIdentity.length<=128,'Invalid site layout identity');
 if(definition.minimumLevel!==null)safeInteger(definition.minimumLevel,1);
 requireContract(['unique-landmark','family-instance'].includes(definition.placementClass),'Invalid site placement class');
 requireContract(['fixed-authored','seeded-procedural'].includes(definition.layoutClass),'Invalid site layout class');
 for(const key of ['encounterProfileRef','rewardProfileRef','resetPolicyRef'])requireContract(typeof definition[key]==='string'&&definition[key].length>=1,'Missing site profile reference');
 for(const key of ['finaleProfileRef','uniqueLootProfileRef','artifactRef','sigilModifierSlot'])requireContract(definition[key]===null||typeof definition[key]==='string','Invalid optional site reference');
 if(definition.familyId==='crypt'&&definition.namedVariantId===null&&definition.encounterProfileRef===`${CRYPT_PACKAGE_ID}:${CRYPT_POPULATION_VERSION}:encounter`)requireContract(definition.rewardProfileRef===`${CRYPT_PACKAGE_ID}:${CRYPT_POPULATION_VERSION}:reward`&&definition.placementClass==='family-instance'&&definition.layoutClass==='seeded-procedural'&&CRYPT_POPULATION_TIERS[definition.tier]?.floors.length===definition.floorCount&&definition.floorCountRule==='floor-count-rule:crypt-reservation-population-v3','Invalid population Crypt definition');
 else if(definition.familyId==='crypt'&&definition.namedVariantId===null&&definition.encounterProfileRef===`${CRYPT_PACKAGE_ID}:${PLANNED_CRYPT_V2}:encounter`)requireContract(definition.rewardProfileRef===`${CRYPT_PACKAGE_ID}:${PLANNED_CRYPT_V2}:reward`&&definition.placementClass==='family-instance'&&definition.layoutClass==='seeded-procedural'&&CRYPT_TIER_POLICY_V2[definition.tier]?.floors.length===definition.floorCount&&definition.floorCountRule==='floor-count-rule:crypt-family-v2','Invalid repeatable Crypt V2 definition');
 else if(definition.familyId==='crypt'&&definition.namedVariantId===null)requireContract(definition.encounterProfileRef===`${CRYPT_PACKAGE_ID}:${PLANNED_CRYPT_VERSION}:encounter`&&definition.rewardProfileRef===`${CRYPT_PACKAGE_ID}:${PLANNED_CRYPT_VERSION}:reward`&&definition.placementClass==='family-instance'&&definition.layoutClass==='seeded-procedural'&&definition.tier==='small'&&definition.floorCount===1,'Invalid repeatable Small Crypt definition');
 else if(definition.familyId==='crypt')requireContract(definition.namedVariantId==='stonewatch'&&definition.displayName==='Stonewatch'&&definition.placementClass==='unique-landmark'&&definition.layoutClass==='fixed-authored','Invalid Stonewatch Crypt definition');
 else requireContract(definition.namedVariantId===null,'Unexpected named variant');
 return definition;
}

export function validateAuthoritativeSiteDefinitionsD13A(state){
 const definitions=resolveAuthoritativeSiteDefinitionsD13A(state),ids=new Set();
 for(const definition of definitions){validateResolvedSiteDefinitionD13A(definition);requireContract(!ids.has(definition.siteId),'Duplicate universal site definition');ids.add(definition.siteId);}
 const manifest=manifestForState(state);
 for(const interior of manifest.siteInteriors??[]){const site=manifest.sites.find(row=>row.locationId===interior.siteId);if(site?.locationDefinitionId===STONEWATCH_LOCATION_DEFINITION_ID&&site.properName==='Stonewatch')requireContract(ids.has(site.locationId),'Stonewatch Crypt definition missing');}
 for(const [siteId,reservation] of Object.entries(state.d9World?.siteReservationsById??{}))if(blueprintForPackage(reservation.packageId)&&functionalSiteDefinitionD10(reservation.packageId,state.d9World.functionalSitesById?.[siteId]?.packageVersion??null))requireContract(ids.has(siteId),'Functional site definition missing');
 return true;
}
