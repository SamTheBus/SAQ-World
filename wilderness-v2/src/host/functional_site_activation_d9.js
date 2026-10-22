import {CRYPT_POPULATION_VERSION,CRYPT_POPULATION_CATALOG} from '../shared/content/crypt_population_v3.js';
import {PLANNED_CRYPT_V2,CRYPT_CATALOG_V2} from '../shared/content/planned_crypt_policy_v2.js';
import {PLANNED_CRYPT_SOCKET,CRYPT_CATALOG} from '../shared/content/planned_crypt_policy_v1.js';
import {ruinCatalogForVersion} from '../shared/content/planned_ruin_policy_v2.js';
import {PLANNED_RUIN_SOCKET,PLANNED_RUIN_CATALOG} from '../shared/content/planned_ruin_policy_v1.js';
import {FORT_CATALOG_V2,PLANNED_FORT_V2} from '../shared/content/planned_fort_policy_v2.js';
import {PLANNED_FORT_SOCKET,PLANNED_FORT_CATALOG} from '../shared/content/planned_fort_policy_v1.js';
import {copyWire,canonicalStringify,requireContract as check} from '../shared/contracts/wire.js';
import {D9_SITE_CONTENT_CATALOG} from '../shared/contracts/site_content_d9.js';
import {prepareSiteBindingD9,commitSiteBindingD9} from './site_content_binding_d9.js';
import {findRuntimeSiteSocketD9,eligibleFunctionalSocketD10,admitFunctionalSiteD9} from '../shared/contracts/functional_site_d9.js';
import {WOODLAND_RUIN_PACKAGE_ID} from '../shared/content/woodland_ruin_d9.js';
import {functionalSiteDefinitionD10} from '../shared/content/functional_site_registry_d10.js';
import {validateActivityCommandForState} from '../shared/contracts/activity_state.js';
import {revealReservedFortGuidanceD10} from '../shared/contracts/world_navigation_d9.js';

// The asynchronous hash/page preparation happens before the ordinary command.
// The guarded authority block then binds content, installs the authored runtime,
// and stages every immutable page as one indivisible live transition.
export async function activateFunctionalSiteD9({authority,pageBuffer,playerId,siteId,sha256,entryCommand=null,returnSite=true}){
 // Already-installed content belongs to the validated private authority. A
 // re-entry needs current command/geometry validation, not a full campaign
 // inspection clone. Public readState/save/worker boundaries are unchanged.
 const installed=authority.withReadyAuthority(engine=>engine.withAuthorityState(state=>Boolean(state.d9World.functionalSitesById[siteId])));
 if(installed)return authority.withReadyAuthority(engine=>{
  let functionalSite=null;engine.withAuthorityState(state=>{if(returnSite)functionalSite=copyWire(state.d9World.functionalSitesById[siteId]);if(entryCommand)validateActivityCommandForState(entryCommand,state);});
  if(!entryCommand)return functionalSite;
  const receipt=engine.createControllerPort(playerId).send(entryCommand);engine.drainCommands();
  const applied=engine.withAuthorityState(state=>state.appliedCommandsById[entryCommand.commandId]);check(applied?.status==='applied','Atomic site re-entry did not apply');return {functionalSite,receipt};
 });
 const snapshot=authority.readState();
 const site=findRuntimeSiteSocketD9(snapshot,siteId);check(site&&eligibleFunctionalSocketD10(snapshot,site),'Site has no eligible installed content package');
 const bindingPlan=await prepareSiteBindingD9({state:snapshot,site,playerId,kind:'entry',catalog:site.version===PLANNED_CRYPT_SOCKET?(site.provenance.placementVersion===CRYPT_POPULATION_VERSION?CRYPT_POPULATION_CATALOG:site.provenance.placementVersion===PLANNED_CRYPT_V2?CRYPT_CATALOG_V2:CRYPT_CATALOG):site.version===PLANNED_RUIN_SOCKET?ruinCatalogForVersion(site.provenance.placementVersion):site.version===PLANNED_FORT_SOCKET?(site.provenance.placementVersion===PLANNED_FORT_V2?FORT_CATALOG_V2:PLANNED_FORT_CATALOG):D9_SITE_CONTENT_CATALOG,readPage:pageBuffer.readPage,sha256});
 check(bindingPlan,'Site has no eligible installed content package');const build=functionalSiteDefinitionD10(bindingPlan.binding.packageId,bindingPlan.binding.packageVersion)?.build;
 check(build,'Unknown functional site package');const runtimePlan=await build(snapshot,site,bindingPlan.binding,{sha256}),installPages=pageBuffer.prepareStage(bindingPlan.pages);
 if(entryCommand){const trial=copyWire(snapshot);commitSiteBindingD9(trial,bindingPlan);admitFunctionalSiteD9(trial,runtimePlan);validateActivityCommandForState(entryCommand,trial);}
 return authority.withReadyAuthority(engine=>{let result,receipt=null;engine.withAuthorityState(state=>{
  check(!state.d9World.functionalSitesById[siteId]&&canonicalStringify(findRuntimeSiteSocketD9(state,siteId))===canonicalStringify(site),'Site activation geography changed');
  const committed=commitSiteBindingD9(state,bindingPlan);check(committed.binding.packageId===runtimePlan.functionalSite.packageId,'Site package changed during activation');
  admitFunctionalSiteD9(state,runtimePlan);if(runtimePlan.functionalSite.packageId===WOODLAND_RUIN_PACKAGE_ID)revealReservedFortGuidanceD10(state,playerId);installPages();result=returnSite?copyWire(state.d9World.functionalSitesById[siteId]):null;
 });engine.refreshWorldResidency();if(entryCommand){receipt=engine.createControllerPort(playerId).send(entryCommand);engine.drainCommands();const applied=engine.withAuthorityState(state=>state.appliedCommandsById[entryCommand.commandId]);check(applied?.status==='applied','Atomic site entry did not apply');}return entryCommand?{functionalSite:result,receipt}:result;});
}
