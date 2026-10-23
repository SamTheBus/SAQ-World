import {preparePlannedCampaignBindingV1} from '../host/planned_campaign_binding_v1.js?v=wilderness-v3-5-ecology-20261022';
import {prepareNavigationPagesD9,readNavigationWindowD9} from './world_navigation_pages_d9.js';
import {generateChunkD9} from '../shared/generation/endless_world_d9.js';
import {validateWire,closedRecord,requireContract as check} from '../shared/contracts/wire.js';
import {D9_PROFILE} from '../shared/content/world_profile_d9.js';
import {createWorldSaveTaskD9} from './world_save_task_d9.js?v=wilderness-v3-5-ecology-20261022';
import {prepareWorldResidencyD9} from './world_residency_task_d9.js';
import {prepareWorldEncountersD9} from './world_encounter_task_d9.js?v=wilderness-v3-5-ecology-20261022';
import {prepareColdDeadlinePatchD9} from './world_cold_deadlines_d9.js';
import {prepareGroundWindowD9} from './world_ground_window_d9.js';
import {findWoodlandSiteCluesD9,planFunctionalSiteBootstrapD9} from '../shared/generation/site_discovery_d9.js';
import {planWoodlandFortParcelD10} from '../shared/generation/woodland_fort_placement_d10.js';
import {planWoodlandCaveParcelD10} from '../shared/generation/woodland_cave_placement_d10.js';
import {planWoodlandCaveFamilyParcelsD12} from '../shared/generation/woodland_cave_family_placement_d12.js';
import {planWoodlandCaveFamilyParcelsD12_1} from '../shared/generation/woodland_cave_family_placement_d12_1.js';
import {planWoodlandCaveRegionD12_2} from '../shared/generation/woodland_cave_region_placement_d12_2.js';
export function createWorldWorkerTaskD9({store,sha256,plannedAssets=null}){
 const saves=createWorldSaveTaskD9({store,sha256,generatePlannedChunk:request=>{check(plannedAssets,'Planned world asset loader unavailable');return plannedAssets.generate(request);}});
 return async function run(kind,request){
  validateWire(request);
  if(kind==='world.bindPlanned'){closedRecord(request,['state','binding']);check(plannedAssets,'Planned asset loader unavailable');return preparePlannedCampaignBindingV1(request.state,request.binding,{plannedAssets});}
  if(kind==='world.collect'){closedRecord(request,[]);return store.worldPages.collect?.()??{deleted:0};}
  if(kind==='world.prepareNavigation')return prepareNavigationPagesD9(request,{sha256,readPage:store.worldPages.readPage});
  if(kind==='world.mapWindow')return readNavigationWindowD9(request,{sha256,readPage:store.worldPages.readPage});
  if(kind==='world.generate'){
   closedRecord(request,['seed','chunkX','chunkY','profile'],['origin','plannedWorld']);if(request.plannedWorld){check(plannedAssets,'Planned generator unavailable');return plannedAssets.generate(request);}check(request.profile===D9_PROFILE.version&&typeof request.seed==='string'&&request.seed.length<=256,'World generator profile/seed mismatch');
   return generateChunkD9(request,sha256);
  }
  if(kind==='world.siteClues'){closedRecord(request,['seed','origin','maxRouteTiles']);return findWoodlandSiteCluesD9(request,sha256);}
  if(kind==='world.siteBootstrap'){closedRecord(request,['seed','origin','maxRouteTiles']);return planFunctionalSiteBootstrapD9(request,sha256);}
  if(kind==='world.siteReservations'){closedRecord(request,['seed','origin'],['ruinSocket']);const ruin=await planFunctionalSiteBootstrapD9({seed:request.seed,origin:request.origin,maxRouteTiles:160},sha256),ruinSocket=request.ruinSocket??ruin.guaranteedCandidate,fort=await planWoodlandFortParcelD10({seed:request.seed,origin:request.origin,ruinSocket,maxRouteTiles:160},sha256),cave=fort?await planWoodlandCaveParcelD10({seed:request.seed,origin:request.origin,ruinSocket,fortParcel:fort,maxRouteTiles:192},sha256):null,near=fort&&cave?await planWoodlandCaveRegionD12_2({seed:request.seed,origin:request.origin,regionX:fort.socket.region.regionX,regionY:fort.socket.region.regionY,existingParcels:[fort,cave],guarantee:true},sha256):null;return {ruin,fort,cave,caves:near?.parcels??[],nearRegion:near};}
  if(kind==='world.siteRegionReservations'){closedRecord(request,['seed','origin','regionX','regionY','existingParcels'],['guarantee']);return planWoodlandCaveRegionD12_2(request,sha256);}
  if(kind==='world.readRoot'){closedRecord(request,['campaignId']);return store.worldPages.readRoot(request.campaignId);}
  if(kind==='world.readPage'){closedRecord(request,['id']);return store.worldPages.readPage(request.id);}
  if(kind==='world.open'){closedRecord(request,['campaignId']);return saves.open(request.campaignId);}
  if(kind==='world.commit')return saves.commit(request);
  if(kind==='world.reconcile'){closedRecord(request,[]);return saves.reconcile();}
  if(kind==='world.prepareResidency'){closedRecord(request,['state'],['release','admit','stagedPages']);return prepareWorldResidencyD9(request,{sha256,readPage:store.worldPages.readPage});}
  if(kind==='world.prepareEncounters'){closedRecord(request,['state']);return prepareWorldEncountersD9(request.state,{sha256});}
  if(kind==='world.prepareDeadlines'){closedRecord(request,['state'],['stagedPages']);return prepareColdDeadlinePatchD9(request,{sha256,readPage:store.worldPages.readPage});}
  if(kind==='world.prepareGround'){closedRecord(request,['state'],['stagedPages']);return prepareGroundWindowD9(request,{sha256,readPage:store.worldPages.readPage});}
  if(kind==='world.publish'){closedRecord(request,['root','pages'],['expectedRoot','legacyCheckpoint']);return store.worldPages.publish(request);}
  throw new TypeError('Unknown D9 world Worker task');
 };
}
