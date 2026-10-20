import {createBrowserLoopHealth} from '../client/browser_loop_health.js';
import {createRuinStorybookArtV1} from '../client/ruin_storybook_art_v1.js';
import {createHybridArtV2} from '../client/hybrid_art_v2.js';
import {createHybridArtPilotV1} from '../client/hybrid_art_pilot_v1.js';
import {loadPlannedReviewV1,mountPlannedReviewControlsV1} from '../dev/planned_world_review_v1.js';
import {FORGE_REVIEW_BUILD} from '../shared/content/forge_review.js';
import {createAuthorityClock} from '../client/authority_clock.js';
import { createLocalActivitySession, ACTIVITY_DATABASE_NAME } from "../host/local_activity_session.js";
import { createLocalWorldSession } from "../host/local_world_session.js";
import { createLocalIndexedDbCampaignStore, deleteLocalWorldCampaignDatabase } from "../storage/local_indexeddb_campaign_store.js";
import { mountPlayableClient } from "../client/playable_client.js";
import { createLocalLaunchPolicy, classifyLocalLaunchError, WORLD_PROCEDURAL_LAUNCHER_KEY, WORLD_SEAMLESS_LAUNCHER_KEY } from "../client/local_launch_policy.js";
import { createBrowserPerformanceProbe } from "../client/performance_probe.js";
import {createDiagnosticDownloadD9} from '../client/diagnostic_download_d9.js';
import {createActivitySaveBridge} from '../client/activity_save_bridge.js';
import {createWorldWorkerBridgeD9} from '../client/world_worker_bridge_d9.js';
import {createLocalEndlessSessionD9} from '../host/local_endless_session_d9.js';
import {coordinateWorldViewport} from '../client/viewport_shell.js';

function launcherCapability(environment) {
  try { return environment.localStorage; }
  catch (error) { return Object.freeze({ getItem() { throw error; }, setItem() { throw error; }, removeItem() { throw error; } }); }
}

function showStartupRecovery(environment, failure, actions) {
  const doc=environment.document, panel=doc.getElementById("startup-recovery");
  doc.getElementById("primary-attack").hidden=true;
  doc.getElementById("local-world-controls").hidden=true;
  doc.getElementById("startup-recovery-title").textContent=failure.title;
  doc.getElementById("startup-recovery-detail").textContent=failure.detail;
  doc.getElementById("world-status").textContent=`Unable to start: ${failure.title}`;
  panel.hidden=false;
  const bind=(id,handler)=>doc.getElementById(id).onclick=async()=>{
    panel.dataset.busy="true";
    try { await handler();panel.dataset.busy="false"; }
    catch(error) { const classified=classifyLocalLaunchError(error);doc.getElementById("startup-recovery-title").textContent=classified.title;doc.getElementById("startup-recovery-detail").textContent=classified.detail;panel.dataset.busy="false"; }
  };
  bind("startup-retry",actions.retry);bind("startup-new",actions.startNew);bind("startup-forget",actions.forget);
  bind("startup-reset",async()=>{if(environment.confirm("Delete all local SAQ World prototype campaigns and its launcher preference?"))await actions.reset();});
}

function cleanAndReload(environment, policy) {
  environment.history.replaceState(null,"",policy.cleanUrl().href);
  environment.location.reload();
}

// Explicit composition of browser capabilities; no ambient access at import.
export async function startWorldClient(environment) {
  let client=null;
  coordinateWorldViewport({environment,shell:environment.document.getElementById('world-app'),onResize:()=>client?.resize()});
  const sha256 = async (bytes) => Array.from(new Uint8Array(await environment.crypto.subtle.digest("SHA-256", new Uint8Array(bytes))));
  const nextToken = () => Array.from(environment.crypto.getRandomValues(new Uint8Array(16)), (v) => v.toString(16).padStart(2, "0")).join("");
  const location = new URL(environment.location.href);
  const plannedReview=environment.document.body.dataset.plannedWorldReview==='true'?await loadPlannedReviewV1(environment,location.searchParams.get('plan')??'alpha',sha256):null;
  const artV2=environment.document.body.dataset.artV2==='true';
  const townReview=environment.document.body.dataset.townReview==='true';
  const caveReview=environment.document.body.dataset.caveReview==='true',cavePopulation=environment.document.body.dataset.cavePopulation==='true';
  const fortReview=environment.document.body.dataset.fortReview==='true';
  const plannedNamespace=environment.document.body.dataset.worldCombat==='v1'?'saq-world-combat-v2-':environment.document.body.dataset.settlementServices==='v2'?'saq-world-settlement-services-v2-':environment.document.body.dataset.settlementLife==='true'?'saq-world-settlement-life-v1-':environment.document.body.dataset.ferryReview==='true'?'saq-world-ferry-v1-':environment.document.body.dataset.multiroom==='true'?'saq-world-multiroom-v1-':environment.document.body.dataset.sitePopulation==='true'?'saq-world-alpha-site-population-v1-':environment.document.body.dataset.cryptReview==='true'?(environment.document.body.dataset.cryptVersion==='v2'?'saq-world-planned-crypts-v2-':'saq-world-planned-small-crypt-v1-'):environment.document.body.dataset.ruinReview==='true'?(environment.document.body.dataset.ruinVersion==='v2'?'saq-world-planned-ruins-v2-':'saq-world-planned-ruins-v1-'):fortReview?(environment.document.body.dataset.fortVersion==='v2'?'saq-world-planned-forts-v2-':'saq-world-planned-forts-v1-'):cavePopulation?'saq-world-planned-caves-v2-':caveReview?'saq-world-planned-cave-v1-':townReview?'saq-world-town-start-art-v2-':artV2?'saq-world-art-v2-':environment.document.body.dataset.artPilot==='true'?'saq-world-art-pilot-v1-':environment.document.body.dataset.waterReview==='true'?'saq-world-water-v3-':environment.document.body.dataset.shorelineReview==='true'?'saq-world-shoreline-v2-':'saq-world-planned-foundation-v1-';
  const databaseName=plannedReview?plannedNamespace+plannedReview.asset.assetId:ACTIVITY_DATABASE_NAME;
  const requestedScenario=environment.document.body.dataset.worldScenario;
  const scenario=requestedScenario==="fixture"?"fixture":requestedScenario==="seamless"||location.searchParams.get("world")==="reference"?"seamless":"procedural";
  // Planned review pages are explicit development entry points. Inspection travel
  // must work independently of optional profiling and evidence capture.
  const profileRequested=location.searchParams.get("profile")==="1",evidenceRequested=location.searchParams.get('evidence')==='1',siteNavigatorRequested=Boolean(plannedReview)||(profileRequested&&evidenceRequested&&location.searchParams.get('devTools')==='1'),reviewPerformance=environment.document.documentElement.dataset.performanceReview==='true';
  const performanceProbe=createBrowserPerformanceProbe({now:()=>environment.performance.now(),enabled:Boolean(plannedReview)||profileRequested||reviewPerformance,initiallyRecording:profileRequested||reviewPerformance});
  let batteryPresentation=Boolean(performanceProbe)&&location.searchParams.get('battery')==='1',lastPresentedFrame=null;
  environment.document.documentElement.dataset.batteryPresentation=batteryPresentation?'30':'full';
  const activity=scenario==='procedural'&&location.searchParams.get('runtime')!=='legacy';
  const proofCase=location.searchParams.get('activityCase')??'A';
  const launcherKey=plannedReview?plannedNamespace+plannedReview.asset.assetId:activity?`${FORGE_REVIEW_BUILD?'saq-world-forge-review':'saq-world-activity-launcher-v1'}-${proofCase}`:scenario==="procedural"?WORLD_PROCEDURAL_LAUNCHER_KEY:WORLD_SEAMLESS_LAUNCHER_KEY;
  const policy=createLocalLaunchPolicy({launcherStore:launcherCapability(environment),url:location,launcherKey});
  const launcherDatabase=activity?createLocalIndexedDbCampaignStore({indexedDB:environment.indexedDB,sha256,databaseName}):null;
  const forget=async()=>{await launcherDatabase?.writeLocalLauncher(proofCase,null);policy.forget();};
  const reset=async()=>{
    await deleteLocalWorldCampaignDatabase({indexedDB:environment.indexedDB,...(activity?{databaseName}:{})});
    policy.forget();cleanAndReload(environment,policy);
  };
  let launch;
  try { launch=policy.select();if(activity&&launch.source!=='explicit'){
    const durable=await launcherDatabase.readLocalLauncher(proofCase);if(durable)launch={source:'durable-local',resume:durable};
  } }
  catch(error) { showStartupRecovery(environment,classifyLocalLaunchError(error),{
    retry:()=>environment.location.reload(),forget:async()=>{await forget();environment.history.replaceState(null,"",policy.cleanUrl().href);},
    startNew:async()=>{await forget();cleanAndReload(environment,policy);},reset});return null; }
  if(!FORGE_REVIEW_BUILD&&activity&&proofCase==='A'&&!launch.resume&&location.searchParams.get('activityNew')!=='1'&&launcherCapability(environment).getItem(WORLD_PROCEDURAL_LAUNCHER_KEY)){
    showStartupRecovery(environment,{title:'Earlier prototype campaign retained',detail:'This authority checkpoint uses a new save format. Your earlier campaign is still stored. Choose Start New Campaign to create a separate X-C campaign.'},{
      retry:()=>environment.location.reload(),forget,reset,
      startNew:async()=>{await forget();const url=policy.cleanUrl();url.searchParams.set('activityNew','1');environment.history.replaceState(null,'',url.href);environment.location.reload();}});return null;
  }
  let session,saveBridge=null,worldBridge=null;
  try {
    if(activity){const workerUrl=new URL(environment.document.documentElement.dataset.worldSaveWorker??'./save-worker.js',location);if(plannedReview){workerUrl.searchParams.set('plannedReview','1');if(environment.document.body.dataset.worldCombat==='v1')workerUrl.searchParams.set('worldCombat','1');if(environment.document.body.dataset.sitePopulation==='true')workerUrl.searchParams.set('sitePopulation','1');if(environment.document.body.dataset.settlementServices==='v2')workerUrl.searchParams.set('settlementServices','2');if(environment.document.body.dataset.settlementLife==='true')workerUrl.searchParams.set('settlementLife','1');if(environment.document.body.dataset.ferryReview==='true')workerUrl.searchParams.set('ferryReview','1');if(environment.document.body.dataset.multiroom==='true')workerUrl.searchParams.set('multiroom','1');if(townReview)workerUrl.searchParams.set('townReview','1');if(caveReview)workerUrl.searchParams.set('caveReview','1');if(cavePopulation)workerUrl.searchParams.set('cavePopulation','1');if(fortReview){workerUrl.searchParams.set('fortReview','1');if(environment.document.body.dataset.fortVersion==='v2')workerUrl.searchParams.set('fortVersion','2');}if(environment.document.body.dataset.cryptReview==='true'){workerUrl.searchParams.set('cryptReview','1');if(environment.document.body.dataset.cryptVersion==='v2')workerUrl.searchParams.set('cryptVersion','2');}if(environment.document.body.dataset.ruinReview==='true'){workerUrl.searchParams.set('ruinReview','1');if(environment.document.body.dataset.ruinVersion==='v2')workerUrl.searchParams.set('ruinVersion','2');}if(artV2)workerUrl.searchParams.set('artV2','1');if(environment.document.body.dataset.artPilot==='true')workerUrl.searchParams.set('artPilot','1');if(environment.document.body.dataset.waterReview==='true')workerUrl.searchParams.set('waterReview','1');if(environment.document.body.dataset.shorelineReview==='true')workerUrl.searchParams.set('shorelineReview','1');workerUrl.searchParams.set('plan',plannedReview.asset.assetId);}workerUrl.searchParams.set('v',environment.document.documentElement.dataset.worldRelease??'source');
      saveBridge=createActivitySaveBridge(new environment.Worker(workerUrl),{record:performanceProbe?.record,now:performanceProbe?()=>environment.performance.now():null});
      if(['A','F','G','H','I','J','K','L','M','N','O'].includes(proofCase))worldBridge=createWorldWorkerBridgeD9(new environment.Worker(workerUrl),{record:performanceProbe?.record,diagnostics:()=>performanceProbe?.isRecording()===true,now:()=>environment.performance.now()});}
    session = await (worldBridge?createLocalEndlessSessionD9:activity?createLocalActivitySession:createLocalWorldSession)({ sha256, nextToken, scenario, proofCase, runtimeId:environment.document.documentElement.dataset.worldRelease??'source',measure:performanceProbe?.measure, manualPrimary: scenario !== "fixture", resume: launch.resume,worldWorker:worldBridge,
      durabilityTask:saveBridge,
      plannedWorld:plannedReview?.binding,plannedTargets:plannedReview?.targets,seedInput:plannedReview?.asset.seed??location.searchParams.get("seed"),now:()=>environment.performance.now(),reviewCapabilities:{siteNavigator:siteNavigatorRequested},
      entropy:async size=>Array.from(environment.crypto.getRandomValues(new Uint8Array(size))),
      storeFactory: (expectedContentFingerprint,expectedGenerationBinding,codec) =>
      createLocalIndexedDbCampaignStore({ indexedDB: environment.indexedDB, sha256, expectedContentFingerprint, expectedGenerationBinding, codec, ...(activity?{databaseName}:{}) }) });
    if(worldBridge){saveBridge?.destroy();saveBridge=null;}
  } catch(error) {
    saveBridge?.destroy();
    worldBridge?.destroy();
    const failure=classifyLocalLaunchError(error);
    showStartupRecovery(environment,failure,{
      retry:()=>environment.location.reload(),
      forget:async()=>{await forget();environment.history.replaceState(null,"",policy.cleanUrl().href);environment.document.getElementById("startup-recovery-detail").textContent="Saved resume forgotten. Retry to create a fresh campaign.";},
      startNew:async()=>{await forget();cleanAndReload(environment,policy);},reset});
    return null;
  }
  const gameplayPort=Object.freeze({...session.clientPort,getReadModel:()=>session.clientPort.getReadModel({includeDeveloper:false})});
  const clientPort=performanceProbe?Object.freeze({ ...gameplayPort,
    getReadModel:()=>performanceProbe.measure("getReadModel",gameplayPort.getReadModel) }):gameplayPort;
  const runtimeId=environment.document.documentElement.dataset.worldRelease??'source';
  let runtimeFingerprint={declaredRuntimeId:runtimeId,manifestRuntimeId:null,runtimeSha256:null};
  const manifestPath=environment.document.documentElement.dataset.runtimeManifest;
  if(manifestPath){const response=await environment.fetch(new URL(manifestPath,location));if(!response.ok)throw Error('Missing review runtime manifest');const m=await response.json(),digest=(await sha256(new TextEncoder().encode(JSON.stringify(m.files)))).map(n=>n.toString(16).padStart(2,'0')).join('');if(digest!==m.runtimeSha256||m.runtimeId!==digest.slice(0,16))throw Error('Review runtime fingerprint mismatch');runtimeFingerprint={...runtimeFingerprint,manifestRuntimeId:m.runtimeId,runtimeSha256:digest};}
  const loopHealth=createBrowserLoopHealth({now:()=>environment.performance.now(),runtimeId:runtimeFingerprint.manifestRuntimeId??runtimeId,visibility:()=>({hidden:environment.document.hidden,visibility:environment.document.visibilityState,focused:environment.document.hasFocus()})});

  const inspect=fn=>{try{return fn();}catch(error){return {diagnosticCaptureError:error.stack??error.message};}};
  const performanceSnapshot=()=>({runtimeId:runtimeFingerprint.manifestRuntimeId??runtimeId,runtimeFingerprint,browserLoop:loopHealth.inspect(),capturedAt:new Date().toISOString(),case:proofCase,...(performanceProbe?.snapshot()??{}),fatalIncident:session.fatalDiagnostic?.()??null,activity:inspect(()=>session.resources?.()??null),presentation:inspect(()=>client?.resources?.()??null)});
  const diagnosticDownload=createDiagnosticDownloadD9({environment,document:environment.document,runtimeId,readPayload:performanceSnapshot});
  const fatalDownload=environment.document.getElementById('world-gate-download');if(fatalDownload)fatalDownload.onclick=()=>diagnosticDownload.download('fatal');
  const fatalCopy=environment.document.getElementById('world-gate-copy');if(fatalCopy)fatalCopy.onclick=async()=>{fatalCopy.textContent=await diagnosticDownload.copy()?'Copied diagnostic':'Copy failed — use Download';};
  if(performanceProbe)Object.defineProperty(environment,"__SAQ_WORLD_PERFORMANCE__",{
    value:Object.freeze({snapshot:performanceSnapshot}),configurable:true});
  const opened = clientPort.getReadModel();
  try { policy.remember({campaignId:opened.context.campaignId,playerId:opened.localPlayerId}); }
  catch(error) { showStartupRecovery(environment,classifyLocalLaunchError(error),{
    retry:()=>environment.location.reload(),forget,
    startNew:async()=>{await forget();cleanAndReload(environment,policy);},reset});return null; }
  const cleanUrl=policy.cleanUrl();cleanUrl.searchParams.delete("activityNew");environment.history.replaceState(null, "", cleanUrl.href);
  const panel=environment.document.getElementById("startup-recovery"),controls=environment.document.getElementById("local-world-controls");
  panel.hidden=false;panel.dataset.busy='true';environment.document.getElementById('startup-recovery-title').textContent='Preparing nearby world';environment.document.getElementById('startup-recovery-detail').textContent='Loading the immediate terrain, collision, and interaction neighborhood before play begins.';
  environment.document.getElementById("primary-attack").hidden=true;controls.hidden=true;
  environment.document.getElementById("start-new-campaign").onclick=async()=>{await forget();cleanAndReload(environment,policy);};
  environment.document.getElementById("reset-local-world-data").onclick=async()=>{
    if(!environment.confirm("Delete all local SAQ World prototype campaigns and its launcher preference?"))return;
    const status=environment.document.getElementById("local-world-control-status");status.textContent="Resetting local World data…";
    try {await reset();}catch(error){status.textContent=classifyLocalLaunchError(error).detail;}
  };
  if(plannedReview)mountPlannedReviewControlsV1({environment,controls,review:plannedReview,session});
  if(activity){
    const button=environment.document.createElement('button');button.textContent='Save campaign';controls.appendChild(button);
    button.onclick=async()=>{button.disabled=true;const result=await session.save();button.textContent=result.status==='committed'?'Saved':'Save needs retry';button.disabled=false;};
    if(performanceProbe){
      const full=environment.document.createElement('button'),battery=environment.document.createElement('button'),sample=environment.document.createElement('button'),download=environment.document.createElement('button');
      const summaryState=environment.document.createElement('span');summaryState.id='world-performance-summary';summaryState.className='performance-sample-state';
      controls.dataset.performanceEnabled='true';controls.querySelector('summary').append(summaryState);
      full.textContent='Full presentation';battery.textContent='30 FPS presentation';download.textContent='Download performance sample';
      const syncPresentation=()=>{full.setAttribute('aria-pressed',String(!batteryPresentation));battery.setAttribute('aria-pressed',String(batteryPresentation));full.disabled=!batteryPresentation;battery.disabled=batteryPresentation;environment.document.documentElement.dataset.batteryPresentation=batteryPresentation?'30':'full';performanceProbe.setGauge('batteryPresentationFpsCap',batteryPresentation?30:0);};
      const setPresentation=value=>{client?.releaseInput();batteryPresentation=value===30;lastPresentedFrame=null;syncPresentation();};
      const syncSample=()=>{const recording=performanceProbe.isRecording();sample.textContent=recording?'Stop performance sample':'Start performance sample';sample.setAttribute('aria-pressed',String(recording));summaryState.textContent=recording?'● REC':'○ Paused';summaryState.dataset.recording=String(recording);};
      full.onclick=()=>setPresentation(60);battery.onclick=()=>setPresentation(30);sample.onclick=()=>{if(performanceProbe.isRecording())performanceProbe.stop();else{performanceProbe.start();performanceProbe.setGauge('batteryPresentationFpsCap',batteryPresentation?30:0);}syncSample();};
      download.onclick=()=>diagnosticDownload.download('performance');
      controls.append(full,battery,sample,download);syncPresentation();syncSample();
    }
    if(location.searchParams.has('activityCase')){
      const links=environment.document.createElement('div');links.textContent='Activity proof — one local camera: ';
      for(const value of ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O']){const link=environment.document.createElement('a'),url=new URL(location);url.searchParams.set('activityCase',value);url.searchParams.set('profile','1');link.href=url.href;link.textContent=` ${value} `;links.appendChild(link);}controls.appendChild(links);
    }
  }
  const environmentArt=environment.document.body.dataset.artPilot==='true'&&plannedReview&&(artV2||plannedReview.asset.assetId==='alpha')?await (environment.document.body.dataset.storybook==='true'?createRuinStorybookArtV1:artV2?createHybridArtV2:createHybridArtPilotV1)(environment,plannedReview,location.searchParams.get('art')??(environment.document.body.dataset.storybook==='true'?'storybook':'candidate')):null;
  client = mountPlayableClient({ port: clientPort, environment, nextCommandToken: nextToken, performanceProbe,environmentArt,readRuntimeDiagnostics:()=>session.resources?.()??null,readSaveStatus:()=>session.gateStatus?.()??null,
    evidenceMode:evidenceRequested,evidenceIntervalMs:artV2?100:0,developerMode:siteNavigatorRequested,
    capabilities: { coarsePointer: environment.matchMedia("(pointer: coarse)").matches, touchPoints: environment.navigator.maxTouchPoints } });
  if(environmentArt){const group=environment.document.createElement('details');group.id='authored-art-review';group.open=true;const summary=environment.document.createElement('summary');summary.textContent='Authored art pilot · comparison';group.append(summary);const status=environment.document.createElement('p');
   const sync=()=>{status.textContent='Mode: '+environmentArt.mode()+'. Same collision and camera. The Small Woodland trial uses sparser canopy presentation over the same blocking thickets; V2 remains on other compatible terrain in '+plannedReview.asset.assetId+'. Other biome kits and interior art remain deferred.';for(const b of group.querySelectorAll('button[data-art-mode]'))b.setAttribute('aria-pressed',String(b.dataset.artMode===environmentArt.mode()));};
   const setMode=async value=>{client.releaseInput();await environmentArt.setMode(value);client.invalidateArt();sync();};
   for(const value of (environment.document.body.dataset.storybook==='true'?['candidate','storybook']:artV2?['existing','v1','candidate']:['existing','candidate'])){const b=environment.document.createElement('button');b.dataset.artMode=value;b.textContent=value==='storybook'?'Storybook ruin scene':value==='existing'?'Existing art':value==='v1'?'V1 authored art':'Existing Hybrid V2 kit';b.onclick=()=>setMode(value).catch(e=>{status.textContent=e.message;});group.append(b);}group.append(status);if(environmentArt.setSpecimens){const label=environment.document.createElement('label'),box=environment.document.createElement('input');box.type='checkbox';box.onchange=()=>environmentArt.setSpecimens(box.checked);label.append(box,' Existing enemy art specimens (presentation only; no encounter actors)');group.append(label);}controls.prepend(group);sync();
   Object.defineProperty(environment,'__SAQ_ART_REVIEW__',{configurable:true,value:Object.freeze({setMode,mode:environmentArt.mode,resources:environmentArt.resources,setSpecimens:environmentArt.setSpecimens,journey:environmentArt.journey,resetPerformance:()=>performanceProbe?.start({reset:true})})});
  }
  try{client.prepare();}
  catch(error){client.destroy();session.destroy?.();worldBridge?.destroy();showStartupRecovery(environment,{title:'Nearby world could not be prepared',detail:error.message},{retry:()=>environment.location.reload(),forget,startNew:async()=>{await forget();cleanAndReload(environment,policy);},reset});return null;}
  panel.dataset.busy='false';panel.hidden=true;environment.document.getElementById("primary-attack").hidden=false;controls.hidden=false;
  let active = !environment.document.hidden, frame = null;
  function stopAfterLoopError(phase,error){
    const context=inspect(()=>{const m=clientPort.getReadModel();return {tick:m.tick,spaceInstanceId:m.context.spaceInstanceId,persistence:m.persistence,preparation:client.resources().spacePreparation,authorityClock:clock.inspect(),runtime:session.resources?.()};});
    if(!loopHealth.fail(phase,error,context))return;session.haltForClientFault?.(error,phase);

    active=false;if(frame!==null)environment.cancelAnimationFrame(frame);frame=null;stopClockTimer();
    try{client.releaseInput();}catch(secondary){loopHealth.record('input-release-error',{message:secondary.message});}
    const loading=environment.document.getElementById('world-space-loading');if(loading){loading.hidden=true;loading.style.display='none';}
    environment.document.documentElement.dataset.spacePreparing='false';
    const alert=environment.document.getElementById('world-gate-alert');if(alert){alert.hidden=false;environment.document.getElementById('world-gate-alert-text').textContent='Gameplay stopped after an unexpected '+phase+' error. Download the incident before reopening the last confirmed campaign.';for(const id of ['world-gate-reopen','world-gate-copy','world-gate-download'])environment.document.getElementById(id).hidden=false;}
  }
  function paint(time) { frame=null;if(!active||loopHealth.failed())return;
    if(batteryPresentation&&lastPresentedFrame!==null&&time-lastPresentedFrame<1000/30-.5){frame=environment.requestAnimationFrame(paint);return;}
    loopHealth.paintBegin();try{lastPresentedFrame=time;performanceProbe?.frame(time);if(performanceProbe)performanceProbe.measure('clientFrameTotal',()=>client.render(time));else client.render(time);loopHealth.paintEnd();}
    catch(error){stopAfterLoopError('render',error);throw error;}
    if(active&&!loopHealth.failed())frame=environment.requestAnimationFrame(paint);
  }
  function suspend(){loopHealth.record('suspend');client.releaseInput();active=false;clock.reset('suspend');lastPresentedFrame=null;if(frame!==null)environment.cancelAnimationFrame(frame);frame=null;stopClockTimer();}
  function resume(){loopHealth.record('resume');if(environment.document.hidden||loopHealth.failed())return;if(!active){clock.reset('resume');session.resume?.();}active=true;if(frame===null)frame=environment.requestAnimationFrame(paint);startClockTimer();}
  const period=1000/60;
  function tick(){
    if(session.groundPreparationRequired?.()){client.releaseInput();loopHealth.gate('ground-occupancy-preparation');void session.prepareGround().catch(error=>{stopAfterLoopError('ground-preparation',error);environment.setTimeout(()=>{throw error;},0);});return;}
    if(client.pollInput()===false){loopHealth.gate('space-preparation');session.servicePreparation?.();return;}
    const advanced=performanceProbe?performanceProbe.measure('authorityStep',session.step):session.step();
    loopHealth.gate(advanced?'play':'authority-gated');if(advanced){loopHealth.advanced();performanceProbe?.record('authorityTick',0);}
  }
  const clock=createAuthorityClock({now:()=>environment.performance.now(),step:tick,
    // The callback services durability and residency even when gameplay
    // authority is gated. session.step() decides whether a tick may advance.
    ready:()=>active,
    observe:performanceProbe?value=>{performanceProbe.record('authorityCallback',0);performanceProbe.sample('authorityStepsPerCallback',value.steps);performanceProbe.sample('authorityDebtTicks',value.debt);performanceProbe.sample('authorityCallbackGapMs',value.callbackGapMs);performanceProbe.setGauge('authorityDebtTicks',value.debt);performanceProbe.setGauge('authorityCarriedDebtTicks',value.carriedDebtTicks);performanceProbe.setGauge('authorityDiscardedDebtTicks',value.discardedDebtTicks);performanceProbe.setGauge('authorityOverflowDiscardedDebtTicks',value.overflowDiscardedDebtTicks);performanceProbe.setGauge('authorityCallbackGapMs',value.callbackGapMs);performanceProbe.setGauge('maxAuthorityCallbackGapMs',value.maxCallbackGapMs);performanceProbe.setGauge('maxAuthorityDebtTicks',value.maxDebt);performanceProbe.setGauge('authorityStepsPerCallback',value.steps);performanceProbe.setGauge('maxAuthorityStepsPerCallback',value.maxSteps);performanceProbe.setGauge('authorityResetDebtTicks',value.discardedDebtTicks);performanceProbe.setGauge('authorityResetCount',value.resetCount);performanceProbe.setGauge('authorityLastResetReason',value.lastResetReason);}:null});
  let timer=null;
  function pacedTick(){timer=null;if(!active||loopHealth.failed())return;loopHealth.authorityBegin();try{const wait=clock.run();if(active&&!loopHealth.failed())timer=environment.setTimeout(pacedTick,wait);}catch(error){stopAfterLoopError('authority',error);throw error;}}
  function startClockTimer(){if(timer!==null)return;timer=activity?environment.setTimeout(pacedTick,Math.ceil(period)):environment.setInterval(()=>{if(active)tick();},period);}
  function stopClockTimer(){if(timer===null)return;if(activity)environment.clearTimeout(timer);else environment.clearInterval(timer);timer=null;}
  environment.addEventListener("blur", suspend); environment.addEventListener("focus", resume);
  environment.document.addEventListener("visibilitychange", () => environment.document.hidden ? suspend() : resume());
  // A persisted pagehide enters the back/forward cache: retain client, timer and worker.
  // pageshow resumes that same authority. Actual document disposal may release them.
  environment.addEventListener("pagehide", event => { suspend(); if(event.persisted)return;
    stopClockTimer();client.destroy();session.destroy?.();saveBridge?.destroy();worldBridge?.destroy(); });
  environment.addEventListener('pageshow',event=>{if(event.persisted)resume();});
  environment.addEventListener('error',event=>loopHealth.record('uncaught-error',{message:event.message,stack:event.error?.stack??null}));
  environment.addEventListener('unhandledrejection',event=>loopHealth.record('unhandled-rejection',{message:String(event.reason),stack:event.reason?.stack??null}));
  resume();
  return Object.freeze({ launchSource: launch.source, campaignId: opened.context.campaignId, playerId: opened.localPlayerId,
    launcherKey, generationDiagnostics:session.generationDiagnostics });
}
