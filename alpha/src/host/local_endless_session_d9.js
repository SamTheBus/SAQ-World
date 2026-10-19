import {tileAddress} from '../shared/generation/planned_world_foundation_v1.js';
import {interiorGroundCoverageReadyD9} from '../shared/contracts/world_ground_occupancy_d9.js';
import {createDeveloperProjectionPort} from './developer_projection_port.js';
import {revealNavigationD9,revealReservedFortGuidanceD10} from '../shared/contracts/world_navigation_d9.js';
import {createLocalActivitySession} from './local_activity_session.js';
import {createPagedWorldAuthorityD9} from './paged_world_authority_d9.js';
import {createActivityClientPort} from './activity_client_port.js';
import {createWorldResidencyD9} from './world_residency_d9.js';
import {createWorldPageBufferD9} from '../storage/world_page_buffer_d9.js';
import {prepareD9OriginMigration} from '../shared/contracts/world_root_d9.js';
import {createId} from '../shared/contracts/identities.js';
import {requireContract as check} from '../shared/contracts/wire.js';
import {activityCampaignCodec,activityGeneration} from '../storage/activity_campaign_store.js';
import {activateFunctionalSiteD9} from './functional_site_activation_d9.js';
import {SITE_BOOTSTRAP_SOCKET_D9} from '../shared/contracts/site_content_d9.js';
import {D9_RUNTIME_POLICY as B} from '../shared/content/world_runtime_policy_d9.js';
import {firstInvalidActorGeometryD9} from '../shared/contracts/actor_geometry_d9.js';
import {copyWire} from '../shared/contracts/wire.js';
import {prepareFortReservationBindingD10,commitFortReservationBindingD10,prepareCaveReservationBindingD10,commitCaveReservationBindingD10,prepareCaveFamilyReservationBindingD12,commitCaveFamilyReservationBindingD12,prepareCaveFamilyReservationBindingD12_1,commitCaveFamilyReservationBindingD12_1} from './site_content_binding_d9.js';
import {buildWoodlandFortD11 as buildWoodlandFortD10} from '../shared/content/woodland_sites_d11.js';
import {WOODLAND_CAVE_PACKAGE_ID} from '../shared/content/woodland_cave_d10.js';
import {admitFunctionalSiteD9} from '../shared/contracts/functional_site_d9.js';
import {WOODLAND_RUIN_PACKAGE_ID} from '../shared/content/woodland_ruin_d9.js';
import {localFramePositionD9,projectToLocalFrameD9} from '../shared/contracts/local_world_frames_d9.js';
import {WOODLAND_CAVE_FAMILY_PACKAGE_ID} from '../shared/content/site_families_d12.js';
import {WOODLAND_CAVE_FAMILY_PARCEL_D12_1} from '../shared/generation/woodland_cave_family_placement_d12_1.js';
import {WOODLAND_CAVE_FAMILY_PARCEL_D12_2} from '../shared/generation/woodland_cave_region_placement_d12_2.js';
import {resolveSiteTruthD12_4C} from '../shared/contracts/site_truth_d12_4c.js';
import {normalizeWorldPosition} from '../shared/contracts/world_address.js';
import {collidesWithTiles} from '../shared/rules/world_geometry.js';
import {SITE_INTERACTION_RADIUS} from '../shared/contracts/site_interiors.js';
import {revealRadiusD9} from '../shared/contracts/world_navigation_contract_d9.js';
import {resolvePlayerStats} from '../shared/contracts/player_stats.js';
import {D9_PROFILE as P} from '../shared/content/world_profile_d9.js';
import {commitSiteResetD13C,prepareSiteResetD13C,siteResetEligibilityD13C,transitioningPlayersForSiteD13C} from '../shared/contracts/site_reset_d13c.js';
import {resolveSiteRunEpisodeD13B} from '../shared/contracts/site_run_episode_d13b.js';

function geometryFromReason(reason){
 const marker='Invalid canonical actor geometry: ',start=reason?.indexOf(marker)??-1;
 if(start<0)return null;try{return JSON.parse(reason.slice(start+marker.length));}catch{return null;}
}

export function createFunctionalSiteCommandPortD9({clientPort,activate}){
 let pending=null,pendingSiteId=null;
 const procedural=command=>command.kind==='site.transition'&&command.payload.direction==='enter'&&/^site:[a-f0-9]{32}$/.test(command.payload.siteId);
 return Object.freeze({...clientPort,getReadModel(){const model=clientPort.getReadModel();return pending?Object.freeze({...model,siteActivationPending:true}):model;},send(command){
  if(pending){if(procedural(command)&&command.payload.siteId===pendingSiteId)return pending;return {status:'busy'};}
  if(!procedural(command))return clientPort.send(command);pendingSiteId=command.payload.siteId;
  pending=Promise.resolve().then(()=>activate(command)).then(result=>result.receipt).finally(()=>{pending=null;pendingSiteId=null;});return pending;
 },busy:()=>Boolean(pending)});
}

const clueBearing=(from,to)=>{const fx=BigInt(from.chunkX)*32n+BigInt(Math.floor(from.localX/32)),fy=BigInt(from.chunkY)*26n+BigInt(Math.floor(from.localY/32)),tx=BigInt(to.chunkX)*32n+BigInt(Math.floor(to.localX/32)),ty=BigInt(to.chunkY)*26n+BigInt(Math.floor(to.localY/32)),dx=tx-fx,dy=ty-fy,east=dx>2n?'east':dx< -2n?'west':'',south=dy>2n?'south':dy< -2n?'north':'';return south+east||'nearby';};
export function projectFunctionalSiteClueD9(model,clueSearch){
 if(!model.space.overworld||model.navigation?.boundSite||!model.navigation?.position||!clueSearch)return null;
 const position=model.navigation.position,valid=clueSearch.clues.filter(clue=>clue.siteId&&clue.target);
 if(!valid.length)return null;
 const tile={x:BigInt(position.chunkX)*32n+BigInt(Math.floor(position.localX/32)),y:BigInt(position.chunkY)*26n+BigInt(Math.floor(position.localY/32))},score=clue=>{const x=BigInt(clue.target.chunkX)*32n+BigInt(Math.floor(clue.target.localX/32)),y=BigInt(clue.target.chunkY)*26n+BigInt(Math.floor(clue.target.localY/32));return (x>tile.x?x-tile.x:tile.x-x)+(y>tile.y?y-tile.y:tile.y-y);},clue=[...valid].sort((a,b)=>Number(score(a)-score(b))||a.side.localeCompare(b.side))[0],direction=clueBearing(position,clue.target),egress=model.space.overworld.egresses.find(value=>value.side===clue.side),projected=clue.trailheadTarget?projectToLocalFrameD9(clue.trailheadTarget,model.navigation.frames):null,trailLabel=clue.trailLabel??(clue.label?'Fort road':'Woodland trail');
 return Object.freeze({version:clueSearch.version,siteId:clue.siteId,direction,distanceTiles:clue.distanceTiles,side:clue.side,label:`${clue.label??'Unidentified Woodland Site'} · ${direction}`,trailhead:projected?Object.freeze({x:projected.x,y:projected.y,side:clue.side,direction,trailLabel}):egress?Object.freeze({x:egress.x,y:egress.y,side:egress.side,direction,trailLabel}):null});
}

// The Ruin can bind after a fresh session has started. Resolve the clue from
// the current authority projection on every new read model so that entering
// and leaving the Ruin switches immediately to Fort guidance without reopen.
export function createFunctionalSiteCluePortD10({clientPort,plannedBootstrap,fortClue,ruinSiteId}){
 let clueSource=null,clueModel=null;
 return Object.freeze({...clientPort,getReadModel(){const model=clientPort.getReadModel();if(model===clueSource)return clueModel;clueSource=model;const ruinBound=Boolean(ruinSiteId&&model.navigation?.boundSitesById?.[ruinSiteId]),siteClue=projectFunctionalSiteClueD9(model,ruinBound?fortClue:plannedBootstrap);clueModel=siteClue?Object.freeze({...model,siteClue,space:Object.freeze({...model.space,overworld:Object.freeze({...model.space.overworld,siteClue})})}):model;return clueModel;}});
}

export function validateDeveloperSiteNavigatorCommandD12_4C(request){
 check(request&&typeof request==='object'&&!Array.isArray(request),'Invalid Site Navigator command');const keys=Object.keys(request).sort(),returning=request.action==='return';
 check(JSON.stringify(keys)===JSON.stringify(returning?['action']:['action','siteId'])&&(returning||['teleport','reset'].includes(request.action)),'Invalid Site Navigator command shape');
 if(!returning)check(/^((site|loc):[a-f0-9]{32}|settlement:[a-f0-9]{32})$/.test(request.siteId),'Invalid Site Navigator site identity');return request;
}

// The normal D9 campaign retains the existing launcher and D8 save as its
// historical origin. Migration publishes once before any new gameplay tick.
export async function createLocalEndlessSessionD9(options){
 const {sha256,nextToken,worldWorker:worker,measure=(_name,fn)=>fn(),storeFactory,resume,proofCase='A',runtimeId='source',now=()=>Date.now(),reviewCapabilities={}}=options,siteNavigatorEnabled=reviewCapabilities.siteNavigator===true;
 check(worker,'D9 requires its save/generation Worker');let opened=resume?await worker.open(resume.campaignId):null,localPlayerId=resume?.playerId,generationDiagnostics=null;
 if(!opened){
  const legacy=await createLocalActivitySession(options),source=legacy.authority.withAuthority(a=>a.readState());
  generationDiagnostics=legacy.generationDiagnostics;localPlayerId=localPlayerId??legacy.clientPort.getReadModel().localPlayerId;
  const migration=await prepareD9OriginMigration(source,{sha256});
  let result=await worker.commit({state:migration.state,expectedRoot:null,checkpointId:createId('checkpointId',nextToken())});
  if(result.status==='unknown')result=await worker.reconcile();check(result.status==='committed',result.reason??'D9 origin publication did not commit');
  opened=await worker.open(source.campaign.campaignId);
 }
 if(options.plannedWorld&&!opened.state.d9World.plannedWorld){const draft=await worker.bindPlanned({state:opened.state,binding:options.plannedWorld});const published=await worker.commit({state:draft,expectedRoot:opened.publication.id,checkpointId:createId('checkpointId',nextToken())});check(published.status==='committed',published.reason??'Planned campaign binding failed');opened=await worker.open(draft.campaign.campaignId);}
 if(options.plannedWorld)check(opened.state.d9World.plannedWorld?.assetHash===options.plannedWorld.assetHash,'Saved planned world binding differs from review selection');
 check(opened?.state.proofCase===proofCase&&opened.state.playersById[localPlayerId],'D9 stored controller/case mismatch');
 const origin={originWidthChunks:opened.state.d9World.origin.width/1024,originHeightChunks:opened.state.d9World.origin.height/832,egress:opened.state.d9World.origin.egress};
 if(!opened.state.d9World.plannedWorld&&!Object.keys(opened.state.d9World.siteReservationsById??{}).length&&worker.siteReservations){
  const existingRuin=Object.values(opened.state.d9World.functionalSitesById).find(site=>site.packageId===WOODLAND_RUIN_PACKAGE_ID),reserved=await worker.siteReservations({seed:opened.state.campaign.seed.seedHex,origin,...(existingRuin?{ruinSocket:existingRuin.socket}:{})}),draft=copyWire(opened.state),ruin=existingRuin?.socket??reserved.ruin.guaranteedCandidate,fort=reserved.fort,cave=reserved.cave,caves=reserved.caves??[];
  draft.d9World.siteReservationsById[ruin.siteId]={version:'site-reservation-d10-v1',siteId:ruin.siteId,packageId:WOODLAND_RUIN_PACKAGE_ID,socket:copyWire(ruin),parcel:null};
  if(fort)draft.d9World.siteReservationsById[fort.siteId]={version:'site-reservation-d10-v1',siteId:fort.siteId,packageId:'woodland-fort',socket:copyWire(fort.socket),parcel:copyWire(fort)};
  if(cave)draft.d9World.siteReservationsById[cave.siteId]={version:'site-reservation-d10-v1',siteId:cave.siteId,packageId:WOODLAND_CAVE_PACKAGE_ID,socket:copyWire(cave.socket),parcel:copyWire(cave)};
  for(const cave of caves)draft.d9World.siteReservationsById[cave.siteId]={version:cave.version===WOODLAND_CAVE_FAMILY_PARCEL_D12_2?'site-reservation-d12-2-v1':'site-reservation-d12-1-v1',siteId:cave.siteId,packageId:WOODLAND_CAVE_FAMILY_PACKAGE_ID,socket:copyWire(cave.socket),parcel:copyWire(cave)};
  if(existingRuin)for(const playerId of draft.session.playerIds)revealReservedFortGuidanceD10(draft,playerId);
  const staged=new Map();
  if(fort){const bindingPlan=await prepareFortReservationBindingD10(draft,fort,{readPage:worker.readPage,sha256});commitFortReservationBindingD10(draft,bindingPlan);admitFunctionalSiteD9(draft,await buildWoodlandFortD10(draft,fort,bindingPlan.binding,{sha256}));for(const page of bindingPlan.pages)staged.set(page.id,page);}
  if(cave){const readStaged=async id=>staged.get(id)?.value??worker.readPage(id),referenceCaveBinding=await prepareCaveReservationBindingD10(draft,cave,{readPage:readStaged,sha256});commitCaveReservationBindingD10(draft,referenceCaveBinding);for(const page of referenceCaveBinding.pages)staged.set(page.id,page);}
  let saved=await worker.commit({state:draft,expectedRoot:opened.publication.id,checkpointId:createId('checkpointId',nextToken()),stagedPages:[...staged.values()]});
  if(saved.status==='unknown')saved=await worker.reconcile();check(saved.status==='committed',saved.reason??'Site reservation publication did not commit');opened=await worker.open(draft.campaign.campaignId);
 }
 const boundSites=Object.values(opened.state.d9World.functionalSitesById),ruinReservation=Object.values(opened.state.d9World.siteReservationsById??{}).find(r=>r.packageId===WOODLAND_RUIN_PACKAGE_ID),boundSite=boundSites.find(site=>site.socket.version===SITE_BOOTSTRAP_SOCKET_D9),boundBootstrap=ruinReservation?.socket.version===SITE_BOOTSTRAP_SOCKET_D9?Object.freeze({bootstrap:ruinReservation.socket}):boundSite?Object.freeze({bootstrap:boundSite.socket}):null,plannedBootstrap=!opened.state.d9World.plannedWorld&&!boundSites.some(site=>site.packageId===WOODLAND_RUIN_PACKAGE_ID)&&worker.siteBootstrap?await worker.siteBootstrap({seed:opened.state.campaign.seed.seedHex,origin,maxRouteTiles:160}):null;
 // An existing binding remains authoritative. A bound bootstrap socket still
 // overlays its immutable route tile whenever that chunk streams back in;
 // ordinary bound sites require no derived overlay.
 const siteBootstrap=boundBootstrap??plannedBootstrap;
 const pages=createWorldPageBufferD9({readPage:worker.readPage,sha256,now}),authority=createPagedWorldAuthorityD9({initialState:opened.state,publication:opened.publication,task:worker,measure,developerCapabilities:{siteNavigator:siteNavigatorEnabled},capturePages:pages.capture,confirmedPages:pages.acknowledge});
 const fortParcel=Object.values(opened.state.d9World.siteReservationsById??{}).find(r=>r.packageId==='woodland-fort')?.parcel??null,caveParcel=Object.values(opened.state.d9World.siteReservationsById??{}).find(r=>r.packageId===WOODLAND_CAVE_PACKAGE_ID)?.parcel??null,caveParcels=Object.values(opened.state.d9World.siteReservationsById??{}).filter(r=>r.packageId===WOODLAND_CAVE_FAMILY_PACKAGE_ID).map(r=>r.parcel).sort((a,b)=>(a.regionKey??'').localeCompare(b.regionKey??'')||a.spawnOrdinal-b.spawnOrdinal);
 const stream=createWorldResidencyD9({authority,worker,pageBuffer:pages,siteBootstrap,ruinSocket:ruinReservation?.socket??null,fortParcel,caveParcel,caveParcels,measure,now}),clientPort=createActivityClientPort({authority,localPlayerId,measure});
 const store=storeFactory(opened.state.content.fingerprint,activityGeneration(opened.state),activityCampaignCodec);await store.writeLocalLauncher?.(proofCase,{campaignId:opened.state.campaign.campaignId,playerId:localPlayerId});
 // Wall-clock limits are presentation/recovery diagnostics, not simulation time.
 // A blocked Worker may keep an immutable cut in flight; never discard its pages.
 const GATE_TIMEOUT_MS=15000,RETRY_MS=1000,STREAM_SERVICE_MS=100;
 let saving=null,saveAgain=false,lastError=null,lastSavedTick=opened.state.tick,lastLife=null,savePhase='idle',savePhaseAt=now(),gateSince=null,gateTimedOut=false,durabilityFailed=false,fatalInvariant=null,failedCuts=0,retriedCuts=0,lastSuccessfulCommitAt=now(),lastSaveAttemptAt=-Infinity,lastStreamServiceAt=-Infinity;
 const isGeometryFailure=failure=>failure?.code==='WORLD_ACTOR_GEOMETRY_INVALID'||/Invalid canonical actor geometry/.test(failure?.reason??failure?.message??'');
 const liveGeometry=()=>authority.withAuthority(a=>a.withAuthorityState(s=>firstInvalidActorGeometryD9(s,{mutation:'worker result live-state probe',phase:savePhase})));
 function discardStaleGeometry(failure,source){if(!isGeometryFailure(failure)||liveGeometry())return false;retriedCuts++;lastError=`Discarded stale ${source} geometry result; retrying current live authority.`;return true;}
 function latchFatal(failure,source){
  if(fatalInvariant)return fatalInvariant;
  const reason=failure.reason??failure.message??String(failure),publication=authority.readConfirmed(),root=publication?.root??null;
  let liveGeometry=null,liveTick=null,liveProbeError=null;
  try{authority.withAuthority(a=>a.withAuthorityState(s=>{liveTick=s.tick;liveGeometry=firstInvalidActorGeometryD9(s,{mutation:'fatal incident live-state probe',phase:savePhase});}));}catch(error){liveProbeError=error.stack??error.message;}
  let streaming=null;try{streaming=stream.inspect();}catch(error){streaming={inspectError:error.stack??error.message};}
  fatalInvariant=Object.freeze({runtimeId,code:failure.code??'WORLD_ACTOR_GEOMETRY_INVALID',reason,source,phase:savePhase,recordedAt:new Date().toISOString(),recordedAtMs:now(),cutTick:failure.cutTick??null,liveTick,
   actorGeometry:failure.actorGeometry??geometryFromReason(reason),liveActorGeometry:liveGeometry,liveProbeError,stack:failure.stack??null,
   streaming:streaming?{residentKeys:streaming.residentKeys,wantedKeys:streaming.wantedKeys,wantedMissing:streaming.wantedMissing,preparedKeys:streaming.preparedKeys,wantedReady:streaming.wantedReady,error:streaming.error,errorCode:streaming.errorCode,errorStack:streaming.errorStack,progressState:streaming.progressState,progressDetail:streaming.progressDetail}:null,
   dirtyPages:pages.resources(),confirmedRoot:root?{id:publication.id,revision:root.revision,tick:root.tick,previous:root.previous,campaignId:root.campaignId}:null,
   failedCuts,retriedCuts,lastSuccessfulCommitTick:lastSavedTick});
  return fatalInvariant;
 }
 const phase=value=>{if(savePhase!==value){savePhase=value;savePhaseAt=now();if(value==='committed'||value==='idle'){gateSince=null;gateTimedOut=false;}}};
 const lifecycle=()=>authority.withAuthority(a=>a.withAuthorityState(s=>s.session.playerIds.map(id=>`${s.entitiesById[s.playersById[id].entityId].alive}/${s.playerRespawnsById?.[id]?.count??0}/${s.playersById[id].inventory.revision}/${s.playersById[id].d8.lastChange?.authorityOrder??0}`).join('|')+'/'+s.encounterEconomy.revision));
 lastLife=lifecycle();
 if(opened.state.d9World.groundIndex)await stream.warmGround();
 authority.withReadyAuthority(a=>a.withAuthorityState(s=>measure('explorationReveal',()=>revealNavigationD9(s))));
 check(await stream.prime(),'Nearby World collision could not become ready');
 const fortClue=ruinReservation&&fortParcel?Object.freeze({version:'woodland-fort-guidance-d10-v1',clues:[Object.freeze({siteId:fortParcel.siteId,target:fortParcel.socket.entrance,trailheadTarget:ruinReservation.socket.entrance,distanceTiles:fortParcel.routeDistanceTiles,side:'fort-road',label:'Woodland Fort',trailLabel:'Fort road'})]}):null;
 function save(){
  if(fatalInvariant)return Promise.resolve({status:'aborted',reason:fatalInvariant.reason,code:fatalInvariant.code});
  if(saving){saveAgain=true;return saving;}
  lastSaveAttemptAt=now();
  saving=(async()=>{let result;do{
   saveAgain=false;
   // An uncertain publication must be reconciled before a new cut. Retrying
   // commitCut while authority is unknown can never succeed or admit terrain.
   if(authority.getStatus().phase==='unknown'){
    phase('reconciling');const reconciled=await authority.reconcile();
    if(reconciled.status!=='committed'&&reconciled.status!=='aborted'){
     durabilityFailed=true;failedCuts++;lastError=reconciled.reason??'World save reconciliation needs retry';phase('failed');return reconciled;
    }
    if(reconciled.status==='committed'){lastSavedTick=reconciled.tick;lastSuccessfulCommitAt=now();stream.acknowledgeSave?.();}
   }
   phase('waiting-stream');await stream.settled();phase('preparing');let prepared=false;for(let attempt=0;attempt<3&&!prepared;attempt++){prepared=await stream.syncPages();if(!prepared)retriedCuts++;}
   if(!prepared){failedCuts++;durabilityFailed=true;lastError='Live inventory changed during save preparation; retry the current cut.';phase('failed');return {status:'aborted',reason:lastError};}
   // commitCut captures the now-quiescent state and staged pages synchronously.
   // Once that immutable proposal exists, normal simulation may continue while
   // the Worker hashes and publishes it.
   const committing=authority.commitCut({transactionId:createId('transactionId',nextToken()),checkpointId:createId('checkpointId',nextToken())});phase('committing');result=await committing;
   if(result.status==='unknown'){
    phase('reconciling');result=await authority.reconcile();
   }
    lastError=result.status==='committed'?null:result.reason??result.status;
    if(result.status==='committed'){durabilityFailed=false;lastSavedTick=result.tick;lastSuccessfulCommitAt=now();stream.acknowledgeSave?.();phase('committed');}
    else if(discardStaleGeometry(result,'world.commit')){durabilityFailed=true;result={status:'aborted',reason:lastError,code:'WORLD_TRANSFER_STALE'};phase('failed');}
    else{durabilityFailed=true;failedCuts++;if(isGeometryFailure(result))latchFatal(result,'world.commit');phase('failed');}
   }while(saveAgain&&result.status==='committed'&&authority.getStatus().phase==='ready');return result;})().catch(e=>{if(discardStaleGeometry(e,'save preparation')){durabilityFailed=true;phase('failed');return {status:'aborted',reason:lastError,code:'WORLD_TRANSFER_STALE'};}durabilityFailed=true;failedCuts++;lastError=e.message;if(isGeometryFailure(e))latchFatal(e,'save preparation');phase('failed');return {status:'failed',reason:e.message,code:e.code};}).finally(()=>{saving=null;if(savePhase==='committed')phase('idle');});return saving;
 }
 const saveAwarePort=Object.freeze({...clientPort,send(command){if(command.kind==='player.respawn'&&opened.state.d9World.plannedWorld){return (async()=>{await stream.settled();const start=opened.state.d9World.plannedStart;try{await stream.prepareWorldPosition(start);return clientPort.send(command);}finally{stream.finishReviewPosition();void stream.pump();}})();}if(fatalInvariant||authority.getStatus().phase!=='ready'||pages.resources().dirtyPages>=B.dirtyPages-32)return {status:'busy'};try{return clientPort.send(command);}catch(error){if(error.code==='WORLD_ACTOR_GEOMETRY_INVALID')latchFatal(error,'authority command');throw error;}}});
 const functionalCommands=createFunctionalSiteCommandPortD9({clientPort:saveAwarePort,activate:async command=>{try{await stream.settled();const result=await activateFunctionalSiteD9({authority,pageBuffer:pages,playerId:localPlayerId,siteId:command.payload.siteId,sha256,entryCommand:command,returnSite:false});void save();return result;}catch(error){lastError=error.message;throw error;}}});
 const clueCommands=createFunctionalSiteCluePortD10({clientPort:functionalCommands,plannedBootstrap,fortClue,ruinSiteId:ruinReservation?.siteId});let navigatorPrevious=null,navigatorBusy=false;
 const worldDistance=(a,b)=>Math.hypot(Number(BigInt(a.chunkX)-BigInt(b.chunkX))*1024+a.localX-b.localX,Number(BigInt(a.chunkY)-BigInt(b.chunkY))*832+a.localY-b.localY);
 const navigatorProjection=()=>{const gateway=authority.readGateway();return authority.withAuthority(a=>a.withAuthorityState(s=>{const truth=resolveSiteTruthD12_4C(s,{includeRejected:true}),actor=s.entitiesById[s.playersById[localPlayerId].entityId],position=actor.residency.spaceInstanceId===s.overworldInstanceId?localFramePositionD9(actor.position,s.d9World.runtime.frames):null;return {version:truth.version,busy:navigatorBusy,canReturn:Boolean(navigatorPrevious),sites:truth.sites.filter(row=>row.navigable).map(row=>{const transitions=transitioningPlayersForSiteD13C(gateway,row.siteId),reset=siteResetEligibilityD13C(s,row.siteId,{transitioningPlayerIds:transitions}),episode=resolveSiteRunEpisodeD13B(s,row.siteId);return {...copyWire(row),distance:position?worldDistance(position,row.approachAnchor):null,runEpisode:episode?.episode??null,runStatus:episode?.status??null,reset};}),rejected:truth.sites.filter(row=>!row.navigable).map(row=>({siteId:row.siteId,label:row.label,rejectionReason:row.rejectionReason,worldPosition:copyWire(row.worldPosition)})),diagnostics:copyWire(truth.diagnostics)};}));};
 const navigatorRevealDistance=s=>revealRadiusD9(resolvePlayerStats(s.playersById[localPlayerId]).attributes?.int??5)*P.tileSize;
 const directionFromEntrance=(record,base)=>{const entrance=record.entrance,dx=Number(BigInt(base.chunkX)-BigInt(entrance.chunkX))*P.chunkWidth+base.localX-entrance.localX,dy=Number(BigInt(base.chunkY)-BigInt(entrance.chunkY))*P.chunkHeight+base.localY-entrance.localY,length=Math.hypot(dx,dy);return length>1?{x:dx/length,y:dy/length}:{x:0,y:1};};
 const preparationTarget=(record,preferred=null)=>authority.withAuthority(a=>a.withAuthorityState(s=>{
  if(preferred)return copyWire(preferred.position);
  const away=directionFromEntrance(record,record.approachAnchor),minimum=navigatorRevealDistance(s)+P.tileSize/2,distance=Math.ceil(minimum/P.tileSize)*P.tileSize;
  return normalizeWorldPosition({...record.entrance,localX:record.entrance.localX+away.x*distance,localY:record.entrance.localY+away.y*distance});
 }));
 const connectedApproach=(collision,from,to,radius)=>{const size=collision.tileSize,start={x:Math.floor(from.x/size),y:Math.floor(from.y/size)},queue=[start],seen=new Set([start.x+','+start.y]),limit=32;for(let index=0;index<queue.length&&index<4096;index++){const cell=queue[index],point={x:(cell.x+.5)*size,y:(cell.y+.5)*size};if(collidesWithTiles(collision,point.x,point.y,radius))continue;if(Math.hypot(point.x-to.x,point.y-to.y)<=SITE_INTERACTION_RADIUS-P.tileSize/2)return true;for(const [dx,dy] of [[0,-1],[-1,0],[1,0],[0,1]]){const x=cell.x+dx,y=cell.y+dy,key=x+','+y;if(seen.has(key)||Math.abs(x-start.x)+Math.abs(y-start.y)>limit)continue;seen.add(key);queue.push({x,y});}}return false;};
 const landingFor=(record,preferred=null,preparedTarget=null)=>authority.withReadyAuthority(a=>a.withAuthorityState(s=>{
 const player=s.playersById[localPlayerId],actor=s.entitiesById[player.entityId],entrance=record.entrance,base=preferred?.position??preparedTarget??record.approachAnchor,away=directionFromEntrance(record,base),side={x:-away.y,y:away.x},starts=preferred?[{x:0,y:0}]:[{x:0,y:0},{x:away.x*P.tileSize,y:away.y*P.tileSize},{x:side.x*P.tileSize,y:side.y*P.tileSize},{x:-side.x*P.tileSize,y:-side.y*P.tileSize},{x:away.x*P.tileSize+side.x*P.tileSize,y:away.y*P.tileSize+side.y*P.tileSize},{x:away.x*P.tileSize-side.x*P.tileSize,y:away.y*P.tileSize-side.y*P.tileSize}],offsets=starts.concat(Array.from({length:4},(_,ring)=>{const d=P.tileSize*(ring+2);return [{x:away.x*d,y:away.y*d},{x:side.x*d,y:side.y*d},{x:-side.x*d,y:-side.y*d}];}).flat()),collision=s.spacesByInstanceId[s.overworldInstanceId].collision,revealDistance=navigatorRevealDistance(s);
  const rejected={unprojected:0,insideReveal:0,blockedLanding:0,blockedApproach:0};for(const offset of offsets){const world=normalizeWorldPosition({...base,localX:base.localX+offset.x,localY:base.localY+offset.y}),local=projectToLocalFrameD9(world,s.d9World.runtime.frames),entry=projectToLocalFrameD9(entrance,s.d9World.runtime.frames);if(!local||!entry){rejected.unprojected++;continue;}const distance=Math.hypot(local.x-entry.x,local.y-entry.y);if(!preferred&&(distance<=revealDistance||distance<=SITE_INTERACTION_RADIUS)){rejected.insideReveal++;continue;}if(collidesWithTiles(collision,local.x,local.y,actor.hullRadius)){rejected.blockedLanding++;continue;}if(!preferred&&!connectedApproach(collision,local,entry,actor.hullRadius)){rejected.blockedApproach++;continue;}const face={x:entry.x-local.x,y:entry.y-local.y};return {world,local:{x:local.x,y:local.y},facing:preferred?.facing??face,revealDistance,distance};}
  throw new Error('No walkable exterior landing is available for '+record.label+' ('+Object.entries(rejected).map(([key,value])=>key+'='+value).join(', ')+')');
 }));
 const siteNavigator=async request=>{check(siteNavigatorEnabled,'Developer Site Navigator capability unavailable');validateDeveloperSiteNavigatorCommandD12_4C(request);const returning=request.action==='return',resetting=request.action==='reset';if(navigatorBusy)return {status:'busy'};navigatorBusy=true;try{
   let record,preferred=null;if(returning){check(navigatorPrevious,'No previous exterior position');preferred=navigatorPrevious;record={siteId:'return',label:'Previous position',navigable:true,eligible:true,reserved:true,historical:true,entrance:navigatorPrevious.position,approachAnchor:navigatorPrevious.position};}
   else {record=authority.withAuthority(a=>a.withAuthorityState(s=>resolveSiteTruthD12_4C(s,{includeRejected:true}).byId[request.siteId]??null));check(record,'Unknown Site Navigator target');check(record.navigable&&record.eligible&&(record.bound||record.reserved||record.historical),'Site Navigator target is not authoritative and eligible');}
   if(resetting){await stream.settled();check(!functionalCommands.busy(),'Site transition is active');const gateway=authority.readGateway(),transitioningPlayerIds=transitioningPlayersForSiteD13C(gateway,record.siteId),snapshot=authority.withAuthority(a=>a.withAuthorityState(copyWire)),plan=await prepareSiteResetD13C(snapshot,record.siteId,{sha256,transitioningPlayerIds});const liveTransitions=transitioningPlayersForSiteD13C(authority.readGateway(),record.siteId),result=authority.withReadyAuthority(a=>{let receipt;a.withAuthorityState(s=>{receipt=commitSiteResetD13C(s,plan,{transitioningPlayerIds:liveTransitions});});a.refreshWorldResidency();return receipt;});void save();return result;}
   const before=authority.withAuthority(a=>a.withAuthorityState(s=>{const actor=s.entitiesById[s.playersById[localPlayerId].entityId];check(actor.alive&&actor.residency.spaceInstanceId===s.overworldInstanceId,'Site Navigator requires the live overworld');return {position:localFramePositionD9(actor.position,s.d9World.runtime.frames),facing:copyWire(s.primary.actorsById[actor.entityId].facing)};}));
   await stream.settled();const target=preparationTarget(record,preferred);await stream.prepareReviewPosition(target,preferred?[{chunkX:preferred.position.chunkX,chunkY:preferred.position.chunkY}]:record.requiredChunks);const landing=landingFor(record,preferred,target),result=authority.developerRelocateToWorld(localPlayerId,landing.local,landing.facing);if(!returning&&!navigatorPrevious)navigatorPrevious=before;if(returning)navigatorPrevious=null;return {...result,siteId:record.siteId,landing:copyWire(landing.world),distanceFromEntrance:landing.distance,revealDistance:landing.revealDistance};
  }finally{stream.finishReviewPosition();navigatorBusy=false;void stream.pump();}};
 let groundPreparation=null,groundPreparationError=null,groundPreparationOffers=0,groundPreparationCompletions=0;
 const groundPreparationRequired=()=>!groundPreparation&&!groundPreparationError&&!fatalInvariant&&!functionalCommands.busy()&&authority.getStatus().phase==='ready'&&authority.withAuthority(a=>a.withAuthorityState(s=>!interiorGroundCoverageReadyD9(s)));
 function prepareGround(){
  if(groundPreparation)return groundPreparation.promise;
  const work={phase:'waiting-for-save-and-stream',startedAt:now(),promise:null};groundPreparation=work;groundPreparationOffers++;
  work.promise=(async()=>{if(saving)await saving;await stream.settled();authority.drainCommands();work.phase='preparing-occupancy';await stream.warmGround();groundPreparationCompletions++;return true;})().catch(error=>{groundPreparationError={message:error.message,stack:error.stack};throw error;}).finally(()=>{if(groundPreparation===work)groundPreparation=null;});
  return work.promise;
 }
 const groundPreparationStatus=()=>({pending:Boolean(groundPreparation),phase:groundPreparation?.phase??(groundPreparationError?'failed':'ready'),offers:groundPreparationOffers,completions:groundPreparationCompletions,error:groundPreparationError,ageMs:groundPreparation?Math.max(0,now()-groundPreparation.startedAt):0});
 const basePort={...clueCommands,getReadModel(...args){const model=clueCommands.getReadModel(...args);return groundPreparation?Object.freeze({...model,siteActivationPending:true}):model;},mapWindow:request=>{check(request.playerId===localPlayerId,'Map knowledge belongs to the bound participant');return stream.mapWindow(request);}};
 const functionalPort=siteNavigatorEnabled?createDeveloperProjectionPort({clientPort:basePort,project:navigatorProjection,siteNavigator}):Object.freeze(basePort);
 function service(){
  // A rejected residency patch is deterministic state corruption, not a
  // transient save failure. Never schedule another cut against that state.
  const streamFailure=stream.failure?.();
  if(!fatalInvariant&&streamFailure&&isGeometryFailure(streamFailure)){
   if(discardStaleGeometry(streamFailure,'world stream')){durabilityFailed=true;phase('failed');void stream.resume();}
   else{latchFatal(streamFailure,'world stream');lastError=streamFailure.message;durabilityFailed=true;phase('failed');}
  }
  const at=now(),authorityPhase=authority.getStatus().phase,dirty=pages.resources().dirtyPages,
   gameplayGate=authorityPhase!=='ready'||Boolean(fatalInvariant)||dirty>=B.dirtyPages-32;
  if(gameplayGate){if(gateSince===null)gateSince=at;}else{gateSince=null;gateTimedOut=false;}
  if(!gateTimedOut&&saving&&at-savePhaseAt>=GATE_TIMEOUT_MS){gateTimedOut=true;lastError=`World save ${savePhase} exceeded ${GATE_TIMEOUT_MS} ms. The confirmed campaign remains intact; wait for recovery or reopen.`;}
  else if(!gateTimedOut&&gateSince!==null&&at-gateSince>=GATE_TIMEOUT_MS){gateTimedOut=true;lastError=`World authority gate exceeded ${GATE_TIMEOUT_MS} ms during ${savePhase}. The confirmed campaign remains intact; wait for recovery or reopen.`;}
  if(!fatalInvariant&&(authorityPhase==='unknown'||durabilityFailed||dirty>=B.dirtyPages-32)){
   if(!saving&&at-lastSaveAttemptAt>=RETRY_MS)void save();
  }
  // Residency completion, wanted admissions, and save retries must be offered
  // even while gameplay ticks/commands are gated. This call never advances AI.
  if(!groundPreparation&&authorityPhase==='ready'&&savePhase!=='waiting-stream'&&savePhase!=='preparing'&&!functionalCommands.busy()&&at-lastStreamServiceAt>=STREAM_SERVICE_MS){
   lastStreamServiceAt=at;void stream.pump();
  }
 }
 const plannedTravel=async targetId=>{check(siteNavigatorEnabled&&opened.state.d9World.plannedWorld,'Planned review travel unavailable');const target=options.plannedTargets?.find(t=>t.id===targetId);check(target,'Unknown planned review target');await stream.settled();const position=tileAddress(target.tile.x,target.tile.y);try{await stream.prepareReviewPosition(position,[{chunkX:position.chunkX,chunkY:position.chunkY}]);const q=authority.withReadyAuthority(a=>a.withAuthorityState(s=>{const actor=s.entitiesById[s.playersById[localPlayerId].entityId],collision=s.spacesByInstanceId[s.overworldInstanceId].collision;for(let r=0;r<=8;r++)for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){if(Math.max(Math.abs(x),Math.abs(y))!==r)continue;const p=normalizeWorldPosition({...position,localX:position.localX+x*32,localY:position.localY+y*32}),local=projectToLocalFrameD9(p,s.d9World.runtime.frames);if(local&&!collidesWithTiles(collision,local.x,local.y,actor.hullRadius))return local;}throw new Error('Review target has no collision-safe landing');}));return authority.developerRelocateToWorld(localPlayerId,{x:q.x,y:q.y},{x:0,y:1});}finally{stream.finishReviewPosition();void stream.pump();}};
 return Object.freeze({plannedTravel,authority,clientPort:functionalPort,generationDiagnostics,save,fatalDiagnostic:()=>fatalInvariant,gateStatus:()=>({gateTimedOut:gateTimedOut||Boolean(fatalInvariant),fatalInvariant:Boolean(fatalInvariant),error:fatalInvariant?'World state validation failed. Copy or download the incident before reopening the last confirmed campaign.':lastError,diagnostic:fatalInvariant?.reason??null}),saveStatus:()=>({pending:Boolean(saving||functionalCommands.busy()),phase:functionalCommands.busy()?'site-activation':savePhase,phaseAgeMs:Math.max(0,now()-savePhaseAt),gateTimeoutMs:GATE_TIMEOUT_MS,gateTimedOut,error:lastError,durabilityFailed,fatalInvariant,lastSuccessfulCommitTick:lastSavedTick,lastSuccessfulCommitAgeMs:Math.max(0,now()-lastSuccessfulCommitAt),failedCuts,retriedCuts,navigationRowsAwaitingPreparation:stream.inspect().navigationPreparation.pendingRows,oldestDirtyPageAgeMs:pages.resources().oldestDirtyPageAgeMs}),resume(){void stream.resume();service();},
  servicePreparation:service,groundPreparationRequired,prepareGround,haltForClientFault:(error,source)=>latchFatal({code:'WORLD_CLIENT_LOOP_FAILED',message:error.message,stack:error.stack},source),
  step(){service();if(functionalCommands.busy()||authority.getStatus().phase!=='ready')return false;
   if(fatalInvariant||groundPreparation||groundPreparationError||groundPreparationRequired())return false;
   // Keep the hard-cap headroom for one exact cut. If preparation/publication
   // repeatedly fails, no additional rewards or movement enter authority.
   if(pages.resources().dirtyPages>=B.dirtyPages-32)return false;
   try{authority.advanceOneTick();}catch(error){if(error.code==='WORLD_ACTOR_GEOMETRY_INVALID'){latchFatal(error,'authority tick');return false;}latchFatal({code:'WORLD_AUTHORITY_TICK_FAILED',message:error.message,stack:error.stack},'authority tick');throw error;}const tick=authority.withAuthority(a=>a.withAuthorityState(s=>s.tick));
   if(tick%4===0)authority.withReadyAuthority(a=>a.withAuthorityState(s=>measure('explorationReveal',()=>revealNavigationD9(s))));
   if(!saving&&tick%6===0){const life=lifecycle(),streaming=stream.inspect();if((life!==lastLife||streaming.needsSave||tick-lastSavedTick>=600)&&(!lastError||now()-lastSaveAttemptAt>=RETRY_MS)){lastLife=life;void save();}}return true;
  },
  resources:()=>authority.withAuthority(a=>({...a.resources(),...clientPort.resources(),groundPreparation:groundPreparationStatus(),d9Streaming:stream.inspect(),d9Pages:pages.resources(),d9Save:{pending:Boolean(saving),phase:savePhase,error:lastError,durabilityFailed,fatalInvariant,lastSuccessfulCommitTick:lastSavedTick,lastSuccessfulCommitAgeMs:Math.max(0,now()-lastSuccessfulCommitAt),failedCuts,retriedCuts},d9Worker:worker.inspect?.()??null})),
  destroy(){stream.close();}
 });
}
