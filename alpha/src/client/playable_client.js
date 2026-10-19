import {createCivilianContextInput} from './civilian_context_input.js';
import {createWorldMapD9} from './world_map_d9.js';
import {formatLarge,integerRatio} from '../shared/contracts/large_number.js';
import {integerWire} from '../shared/contracts/integer_domain.js';
import {progressionBigInt} from '../shared/contracts/progression_integer.js';
const progressionText=v=>formatLarge(integerWire(v));
import {createSubweaponHud} from './subweapon_hud.js';
import {createDiagnosticOverlays} from './diagnostic_overlays.js';
import {formatAmount} from '../shared/contracts/economy_amount.js';
import { createInventoryPresentation } from './inventory_presentation.js';
import { createDeathPresentation } from './death_presentation.js';
import { createControlProfile, spaceKey, createPresentationQueue, gameplayPresentationState, applyGameplayPresentationState } from "./presentation_state.js";
import { createClientCommandAdapter } from "./command_adapter.js";
import { createWorldRenderer } from "./world_renderer.js";
import { createPrimaryInput } from "./primary_input.js";
import { createWorldInput } from "./world_input.js";
import {createSiteNavigatorD12_4C} from './site_navigator_d12_4c.js';
import {createSpacePreparationGate} from './space_preparation_gate.js';

export function mountPlayableClient({ port, environment, nextCommandToken, capabilities, performanceProbe = null, environmentArt=null, readRuntimeDiagnostics=()=>null, readSaveStatus=()=>null, evidenceMode = false,evidenceIntervalMs=0, developerMode = false }) {
  const doc = environment.document, canvas = doc.getElementById("world-view"), status = doc.getElementById("world-status");
  doc.documentElement.dataset.gameplayHudVisible='false';
  for(const id of ['world-hud','world-level-up','primary-attack','world-bag','world-pickup','world-loot-notice'])doc.getElementById(id)?.setAttribute('data-gameplay-hud','');
  const label = doc.getElementById("space-label"), mode = doc.getElementById("control-mode"), provenance = doc.getElementById("control-provenance");
  const generation=doc.getElementById("world-generation");
  const renderer = createWorldRenderer(canvas,{performanceProbe,environmentArt}), profile = createControlProfile(capabilities), queue = createPresentationQueue();
  const adapter = createClientCommandAdapter({ port, nextCommandToken });
  const restoreGameplayFocus=()=>canvas.focus({preventScroll:true});
  let observedProgression=null,levelNoticeUntil=0,inventory=null,diagnostics=null,subweaponHud=null,navigation=null,siteNavigator=null,renderModel=null;
  // One authoritative projection per rendered frame. The UI previously asked
  // the port for the same immutable model through several child presenters,
  // creating avoidable full-state clones and major-GC gaps during long play.
  const readModel=()=>renderModel??port.getReadModel(),viewPort=Object.freeze({...port,getReadModel:readModel});
  let message = "", key = spaceKey(port.getReadModel()), lastTravel = null;
  const presentationSpace=m=>`${m.context.sessionId}/${m.localPlayerId}/${m.context.spaceInstanceId}`;
  const preparation=createSpacePreparationGate(presentationSpace(readModel()));
  const loading=doc.createElement('div');loading.id='world-space-loading';loading.hidden=true;loading.setAttribute('role','status');loading.setAttribute('aria-live','polite');
  loading.style.cssText='position:fixed;inset:0;z-index:1000;background:#101923ed;color:#f6e9cf;display:flex;align-items:center;justify-content:center;text-align:center;pointer-events:auto;font:600 20px system-ui';
  // An explicit hidden style avoids overriding the HTML hidden attribute.
  loading.style.display='none';loading.textContent='Loading area…';doc.body.appendChild(loading);
  const loadingFeedback=blocked=>{loading.hidden=!blocked;loading.style.display=blocked?'flex':'none';doc.documentElement.dataset.spacePreparing=String(blocked);};
  const gameplayInputBlocked=()=>{const m=readModel();return !preparation.observe(presentationSpace(m),Boolean(m.siteActivationPending))||Boolean(inventory?.isOpen()||navigation?.isOpen()||diagnostics?.isDragging()||siteNavigator?.busy());};
  const input = createWorldInput({ canvas, environment, renderer, profile, adapter, readModel,
    retryRejectedStop:doc.body.dataset.shorelineReview==='true',readCommandModel:()=>port.getReadModel(),
    openForge:()=>inventory?.openForge(),isBlocked:gameplayInputBlocked,reportError: (text) => { message = text; }, now: () => environment.performance.now() });
  const civilianInput=createCivilianContextInput({environment,readModel,activate:exitId=>input.activate(exitId),isBlocked:()=>gameplayInputBlocked()||!readModel().space.exits?.some(e=>e.available&&(e.siteKind==='civilian-tavern'||(doc.body.dataset.caveReview==='true'||doc.body.dataset.fortReview==='true'||doc.body.dataset.ruinReview==='true'||doc.body.dataset.cryptReview==='true')&&e.siteAction))});
  const button=doc.getElementById("primary-attack");
  const gameSurfaces=[canvas,button,doc.getElementById('world-pickup')].filter(Boolean),gestureListeners=[];
  // Cancel only touches owned by game surfaces. Pointer handlers still own commands.
  // This complements touch-action on WebKit; it cannot override OS-owned gestures.
  for(const surface of gameSurfaces)for(const type of ['touchstart','touchmove','touchend','dblclick','contextmenu']){
    const handler=event=>{if(event.cancelable)event.preventDefault();};surface.addEventListener(type,handler,{passive:false});
    gestureListeners.push(()=>surface.removeEventListener(type,handler));
  }
  const primary=button?createPrimaryInput({button,environment,adapter,readModel,isBlocked:gameplayInputBlocked,restoreGameplayFocus,reportError:text=>{message=text;}}):null;
  inventory=createInventoryPresentation({document:doc,environment,readModel,adapter,restoreGameplayFocus,clearInput:()=>{subweaponHud?.clear();input.clear();primary?.clear();}});
  navigation=createWorldMapD9({document:doc,environment,port:viewPort,releaseInput:()=>{subweaponHud?.clear();input.clear();primary?.clear();restoreGameplayFocus();}});
  siteNavigator=createSiteNavigatorD12_4C({document:doc,port:viewPort,enabled:developerMode,releaseInput:()=>{subweaponHud?.clear();input.clear();primary?.clear();}});
  diagnostics=createDiagnosticOverlays({document:doc,environment,performanceProbe,readRuntimeDiagnostics,readPresentationDiagnostics:()=>({...renderer.resources(),...(navigation?.resources?.()??{})}),releaseInput:()=>{
    subweaponHud?.clear();const held=input.read();if(held.keys.length||held.joystick||held.cursor||held.movementOwner!==null)input.clear();
    const m=readModel(),p=m.primary?.actorsById[m.playersById[m.localPlayerId].entityId];
    if(primary?.read().owners.length||p?.held||p?.queued)primary?.clear();
  }});
  subweaponHud=createSubweaponHud({clearPrimary:()=>primary?.clear(),document:doc,environment,readModel,adapter,isBlocked:gameplayInputBlocked,reportError:text=>{message=text;}});
  const death=createDeathPresentation({document:doc,readModel,adapter,restoreGameplayFocus,clearInput:()=>{input.clear(false);primary?.clear(false);}});
  const setText=(element,text)=>{if(element.textContent!==text)element.textContent=text;};
  doc.getElementById('world-gate-reopen')?.addEventListener('click',()=>environment.location.reload());
  function resize() { subweaponHud?.clear();input.clear(); primary?.clear(); const rect = canvas.parentElement.getBoundingClientRect(); renderer.resize(rect.width, rect.height); }
  const disclosure=doc.getElementById('local-world-controls');
  const compact=disclosure&&environment.matchMedia('(max-width: 600px), (max-height: 450px), (pointer: coarse)');
  const layoutDisclosure=()=>{disclosure.open=doc.documentElement.dataset.performanceReview==='true'||!compact.matches;resize();};
  if(disclosure){layoutDisclosure();compact.addEventListener?.('change',layoutDisclosure);disclosure.addEventListener('toggle',resize);}
  mode.value = profile.read().mode;
  mode.addEventListener("focus", () => input.clear());
  mode.addEventListener("change", () => { input.clear(); profile.select(mode.value); });
  doc.getElementById("retry-travel").addEventListener("click", async () => {
    const model = port.getReadModel(), requestId = model.travel?.requestId;
    try { await port.reconcile(); }
    catch (error) { queue.retain(model, requestId ?? "reconcile", model.tick, error.message); }
  });
  let nextEvidenceAt=-Infinity,nextSiteNavAt=-Infinity;const artReviewV2=doc.body.dataset.artV2==='true';
  function render(time) {
    const model = port.getReadModel();
    renderModel=model;
    preparation.observe(presentationSpace(model),Boolean(model.siteActivationPending));
    if(!preparation.ready()){
      input.clear(false);primary?.clear(false);loadingFeedback(true);
      const work=preparation.frame();
      if(work==='show-loading'){renderModel=null;return;}
      if(work==='prepare'){renderer.invalidate('prepared-space-change');renderer.prepare(model,time,input);preparation.prepared();renderModel=null;return;}
    }
    diagnostics.update(model,time);
    if (spaceKey(model) !== key) { input.clear(false); primary?.clear(false); renderer.invalidate('space-change'); key = spaceKey(model); message = "Travel committed."; }
    if (model.travel && `${model.travel.requestId}/${model.travel.status}` !== lastTravel) {
      lastTravel = `${model.travel.requestId}/${model.travel.status}`;
      if (["failed", "aborted", "conflict"].includes(model.travel.status)) message = model.travel.reason ?? "Travel failed; source retained.";
    }
    for (const job of queue.due(model)) message = job.message;
    inventory.refresh(model,time);
    if(performanceProbe)performanceProbe.measure('deathPresentation',()=>death.refresh(model));else death.refresh(model);
    const presentation=applyGameplayPresentationState(doc,gameplayPresentationState(model,{foregroundModalOpen:inventory.isOpen()||!doc.getElementById('world-death').hidden||!doc.getElementById('startup-recovery').hidden,fullScreenPanelOpen:navigation.isOpen()}));
    navigation.refresh(model,time,presentation);if(disclosure.open&&time>=nextSiteNavAt){siteNavigator.refresh(model);nextSiteNavAt=time+250;}subweaponHud.refresh(model);primary?.refresh(model);
    const participant=model.playersById[model.localPlayerId],progress=participant.progression;
    const levelNotice=doc.getElementById('world-level-up');
    const painted = performanceProbe?performanceProbe.measure("rendererTotal",()=>renderer.render(model,time,input)):
      renderer.render(model, time, input);
    const displayProgress=painted.xpDisplay??progress;
    if(displayProgress){const identity=`${model.context.campaignId}/${model.localPlayerId}`;
      if(observedProgression?.identity===identity&&progressionBigInt(displayProgress.level)>progressionBigInt(observedProgression.level)){if(levelNotice)levelNotice.textContent=`LEVEL ${progressionText(displayProgress.level)}`;levelNoticeUntil=time+3000;}
      else if(observedProgression?.identity!==identity)levelNoticeUntil=0;
      observedProgression={identity,level:displayProgress.level};
    }
    if(levelNotice)levelNotice.hidden=inventory.isOpen()||!model.entitiesById[participant.entityId].alive||!(time<levelNoticeUntil);
    const updateDom=()=>{
    setText(label,model.space.label);
    if(generation)setText(generation,model.space.overworld?.seedHex?`World ${model.space.overworld.manifestId.slice(-8)} · Seed ${model.space.overworld.seedHex}${model.space.overworld.regionThreatTier?` · Region threat ${model.space.overworld.regionThreatTier} · ${model.space.overworld.populationGroups} ordinary groups`:""}`:"");
    setText(provenance,profile.read().provenance);
    const activeSite=model.space.site??model.space.functionalSite,conquered=activeSite?.conqueredTick!==null&&activeSite?.conqueredTick!==undefined&&model.tick-activeSite.conqueredTick<180;
    const statusText=model.siteActivationPending?'Preparing site entry…':conquered?`${activeSite.label} conquered` : model.persistence.phase === "pending" ? "Saving checkpoint… authority is paused." :
      model.persistence.phase === "unknown" ? "Save outcome unknown. Reconcile before continuing." :
      model.persistence.phase === 'conflict' ? 'Another writer advanced this campaign. Reopen the latest confirmed campaign.' :
      !model.entitiesById[model.playersById[model.localPlayerId].entityId].alive ? (model.recovery?'Defeated · No XP lost. Respawn at the starting settlement.':model.encounter?'Defeated · Reload this page to retry from the saved encounter start.':'Defeated · Reopen the latest confirmed campaign cut. Unsaved progress is not a recovery checkpoint.') :
      model.persistence.saving ? 'Saving campaign in the background…' :
      model.encounter?.active ? "Fern Hollow encounter · Space / Attack: tap one swing, hold the chain. Travel waits for victory." :
      model.encounter?.cleared ? "Slime clearing secured · Clear saved. Travel is available." : message ||
      (model.space.visual ? (model.space.settlementSafe ? (compact?.matches?`${model.space.label} · Safe.`:`${model.space.label} is safe. Roads continue beyond its visible streets.`) :
        model.space.overworld ? (model.siteClue?`${model.siteClue.label} (${model.siteClue.distanceTiles} road tiles).`:`Explore freely.`) :
        "Follow the pale road, or explore the woodland paths. Approach an edge marker to travel.") : "Reach the gold doorway, then tap its prompt.");
    const saveGate=readSaveStatus(),gateAlert=doc.getElementById('world-gate-alert');
    if(gateAlert){gateAlert.hidden=!saveGate?.gateTimedOut;if(saveGate?.gateTimedOut)setText(doc.getElementById('world-gate-alert-text'),saveGate.error??'World save is taking too long. Reopen to recover the last confirmed campaign.');for(const id of ['world-gate-reopen','world-gate-copy','world-gate-download'])doc.getElementById(id).hidden=!saveGate?.fatalInvariant;}
    const statusDetail=doc.getElementById('world-status-detail');if(statusDetail)setText(statusDetail,saveGate?.gateTimedOut?saveGate.error:statusText);
    const heroAlive=model.entitiesById[model.playersById[model.localPlayerId].entityId].alive;
    setText(status,model.siteActivationPending?'Entering…':model.persistence.phase==='unknown'?'Reconcile save':model.persistence.phase==='conflict'?'Reopen campaign':
      model.persistence.phase==='pending'||model.persistence.saving?'Saving…':!heroAlive?'Defeated':
      conquered?`${activeSite.label} conquered`:message?'Notice · Playtest':model.encounter?.active?'Combat':model.encounter?.cleared?'Clear saved':model.space.settlementSafe?'Safe':'Explore');
    const retry=doc.getElementById("retry-travel"),retryHidden=model.persistence.phase!=="unknown";
    if(retry.hidden!==retryHidden)retry.hidden=retryHidden;
    const hero=model.entitiesById[model.playersById[model.localPlayerId].entityId];
    const progressHud=doc.getElementById('world-progression');
    if(progressHud){progressHud.hidden=!progress;if(progress){
      setText(doc.getElementById('world-level'),`Lv ${progressionText(displayProgress.level)}`);
      setText(doc.getElementById('world-xp'),displayProgress.capped?'MAX':`${progressionText(displayProgress.current)}/${progressionText(displayProgress.required)} XP`);
      const bar=doc.getElementById('world-xp-bar'),value=displayProgress.value??(progress.capped?100:100*integerRatio(integerWire(progress.current),integerWire(progress.required)));
      if(bar.value!==value)bar.value=value;
      bar.setAttribute('aria-label',progress.capped?'Maximum level':`Level ${progressionText(progress.level)}: ${progressionText(progress.current)} of ${progressionText(progress.required)} XP`);
      progressHud.title=`Max HP ${formatLarge(participant.stats.maxHp)} · Attack ${formatLarge(participant.stats.attack)} · Defense ${formatLarge(participant.stats.defense)}`;
    }}
    const hpBar=doc.getElementById('world-hp-bar');if(hpBar)hpBar.value=100*integerRatio(hero.hpExact??'0',hero.maxHpExact??'1');setText(doc.getElementById('world-gold'),formatAmount(painted.walletDisplay??model.inventory?.gold??'0'));
    const health=doc.getElementById('world-health');if(health)setText(health,`HP ${formatLarge(hero.hpExact??String(Math.round(hero.hp.m*10**hero.hp.e)))} / ${formatLarge(hero.maxHpExact??String(Math.round(hero.maxHp.m*10**hero.maxHp.e)))}`);
    setText(doc.getElementById("world-metrics"),(model.primary?`HP ${formatLarge(hero.hpExact??String(Math.round(hero.hp.m*10**hero.hp.e)))} / ${formatLarge(hero.maxHpExact??String(Math.round(hero.maxHp.m*10**hero.maxHp.e)))} · `:"")+(model.space.visual ?
      `${model.space.settlementSafe ? "Safe settlement" : model.space.label} · ${model.space.visitedCount}/${model.space.visitedTotal} semantic places/sites discovered${model.space.site?model.space.site.conqueredTick!==null?" · Conquered":" · Active site":model.space.functionalSite?model.space.functionalSite.conqueredTick!==null?" · Conquered":" · Active site":model.space.overworld?" · One continuous overworld":" · Arrival saved"}` :
      `Tick ${model.tick} · Space revision ${model.context.spaceRevision} · Save ${model.persistence.confirmedSaveRevision}`));
    };
    if(performanceProbe)performanceProbe.measure("domPresentation",updateDom);else updateDom();
    const writeEvidence=()=>Object.assign(canvas.dataset, { space: model.space.label, x: String(painted.actorX), y: String(painted.actorY),
      tick: String(model.tick), revision: String(model.context.spaceRevision), save: String(model.persistence.confirmedSaveRevision),
      cameraX: String(painted.camera.x), cameraY: String(painted.camera.y), cameraZoom:String(painted.camera.zoom), phase: model.persistence.phase,
      primary:JSON.stringify(model.primary?.actorsById[model.playersById[model.localPlayerId].entityId]??null),
      progression:JSON.stringify(progress??null),
      entities:JSON.stringify(model.entitiesById),encounter:JSON.stringify(model.encounter??null),
      spaceId: model.space.spaceId, resources: JSON.stringify({...renderer.resources(),...(navigation?.resources?.()??{})}),
      areaId:model.space.overworld?.currentAreaId??model.space.spaceId,manifest:model.space.overworld?.manifestId??"legacy",
      placeId:model.space.overworld?.currentPlaceId??model.space.spaceId,seed:model.space.overworld?.seedHex??"legacy",
      prompt: painted.prompt ? JSON.stringify({ x: painted.prompt.x, y: painted.prompt.y, width: painted.prompt.width, height: painted.prompt.height }) : "null" });
    if(evidenceMode&&time>=nextEvidenceAt){nextEvidenceAt=time+evidenceIntervalMs;if(performanceProbe)performanceProbe.measure("debugEvidence",writeEvidence);else writeEvidence();}
    preparation.presented();loadingFeedback(!preparation.ready());renderModel=null;
  }
  resize();
  return Object.freeze({ render, invalidateArt:()=>renderer.invalidate('review-art-mode-change'), prepare:()=>renderer.prepare(port.getReadModel(),environment.performance.now(),input),pollInput:()=>{const model=port.getReadModel(),ready=preparation.observe(presentationSpace(model),Boolean(model.siteActivationPending));if(!ready){input.clear(false);primary?.clear(false);loadingFeedback(true);return false;}input.refresh(model);primary?.refresh(model);return true;}, releaseInput:()=>{subweaponHud?.clear();input.clear();primary?.clear();}, resize,resources:()=>Object.freeze({...renderer.resources(),...(navigation?.resources?.()??{}),spacePreparation:preparation.inspect()}),
    destroy:()=>{loading.remove();civilianInput.destroy();navigation.destroy();siteNavigator.destroy();subweaponHud.destroy();diagnostics.destroy();inventory.destroy();death.destroy();input.destroy();primary?.destroy();gestureListeners.forEach(remove=>remove());if(disclosure){compact.removeEventListener?.('change',layoutDisclosure);disclosure.removeEventListener('toggle',resize);}} });
}
