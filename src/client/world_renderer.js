import {createBossPolishPresentation,drawBossPolishGround,bossPolishDepthItems,drawAegisProjectileTrails} from './boss_attack_polish_v3.js';
import {drawRecoveredBossV1,drawRecoveredSummonV1,drawRecoveredBossGroundV1,drawRecoveredBossHudV1} from './recovered_boss_presentation_v1.js';
import {archivedBossDepthItems} from './boss_archive_world_adapter_v1.js';
import {treasuryBossDepthItems,drawTreasuryBossHudV2} from './boss_original_treasury_world_adapter_v1.js';
import {woodlandPilotEventDepthItems} from './wilderness_event_pilot_presentation_v3_7.js';
import {createBrimstoneEruptionPresentation} from './brimstone_attack_effects_v2.js';
import {drawBrimstoneColossus,drawBrimstoneGround,drawBrimstoneBossHud,brimstoneEffectDepthItems} from './boss_presentation_brimstone_v1.js';
import {drawOrdinaryHostileProjectile} from './ordinary_hostile_projectile_presentation.js';
import {drawPlannedVillageGround,plannedVillageDepthItems} from './planned_village_presentation_v1.js';
import {civilianDepthItems} from './settlement_civilians_v1.js';
import {drawFerryLandings} from './ferry_presentation_v1.js';
import {createCompletionArtPreparation} from './completion_art_preparation.js';
import {drawPlannedTownGround,plannedTownDepthItems} from './planned_town_presentation_v1.js';
import {drawTavernGround,tavernDepthItems} from './settlement_interior_presentation.js';
import {rebaseLocalPointD9} from '../shared/contracts/local_world_frames_d9.js';
import {drawElementProjectile} from './tome_element_art.js';
import {createGroundItemPresentation} from './ground_item_presentation.js';
import {createCombatVfx,drawFireProjectile} from './combat_vfx.js';
import {createResourcePresentation} from './economy_resource_presentation.js';
import {drawForgeStation} from './forge_station_art.js';
import {createLighting} from './lighting_presentation.js';
import {drawEnvironmentAmbient} from './environment_motifs.js';
import {createRewardFeedback} from './reward_feedback.js';
import { createEquipmentArtCache } from './equipment_art.js';
import {createSiteEnvironment} from './site_environment_presentation.js';
import {createCombatFeedback} from './combat_feedback.js';
import { drawOrdinaryEnemy } from './ordinary_enemy_presentation.js';
import {watcherLookTarget} from './temporal_watcher_eye_v1.js';
import { createCamera, createPaintedPrompt, selectedActor, spaceKey,createHeroFacing } from "./presentation_state.js";
import { drawWorldHero, drawProofSlime,tomeFocusPosition } from "./hero_presentation.js";
import { drawEnvironment, drawEnvironmentMarkers, drawCollisionCoverageDebug, createEnvironmentCache } from "./environment_presentation.js";
import {depthItem,drawDepthItems} from './world_depth_presentation.js';
import {drawBerserkerTransfersD12_4H_A,drawGlacialSnareFrontD12_4E,drawGlacialSnareRearD12_4E,drawNullifiedFrontD12_4I,drawNullifiedRearD12_4I,drawSlagShaperHazardsD12_4K,drawToxicPoisonFrontD12_4F,drawToxicPoisonRearD12_4F,drawWebbedFrontD12_4J,drawWebbedRearD12_4J,drawWebWeaverHazardsD12_4J} from './elite_presentation_d12_4.js';
import {drawActorStatusRow} from './actor_status_presentation.js';
import {actorHealthRatio,createHealthTrailsV3,drawEnemyHealthEchoV3,drawBossHealthEchoV3} from './health_feedback_v3.js';
import {drawAttachedAegisMimic,drawAegisMimicTethers} from './aegis_mimic_presentation_v2.js';
import {drawAegisGoliath,drawAegisProjectiles,drawAegisBossHud} from './boss_presentation_aegis_v1.js';
import {drawArachnidTreantBossHudD12_5A,drawArachnidTreantD12_5A,drawTreantCocoonD12_5A} from './boss_presentation_d12_5.js';
import {createExtractionPortalPresentationD12_5C} from './extraction_portal_presentation_d12_5c.js';

// Input polling observes every authority tick even when painting runs at 30 Hz.
// Keep these actual resolution records in disposable presentation state; a
// vanished warning alone is never evidence that an attack resolved.
export function createBossEffectsObserver(){
  const polish=createBossPolishPresentation(),eruptions=createBrimstoneEruptionPresentation();
  let source=null,views=null,frameKey=null;
  function clear(){polish.clear();eruptions.clear();source=null;views=null;frameKey=null;}
  function observe(model){
    if(model===source&&views)return views;
    const frames=model.navigation?.position?model.navigation.frames:null,nextFrameKey=frames?JSON.stringify(frames):null;
    // Local coordinates can rebase before the next painted frame. Never carry
    // an old footprint into a new frame, or apply a Canvas transform here.
    if(nextFrameKey!==frameKey){polish.clear();eruptions.clear();}
    frameKey=nextFrameKey;source=model;
    views=Object.freeze({bossPolishView:polish.update(model),brimstoneView:eruptions.update(model)});
    return views;
  }
  return Object.freeze({observe,clear});
}

export function createWorldRenderer(canvas,{performanceProbe=null,developmentScene=null,environmentArt=null}={}) {
  const completionPreparation=createCompletionArtPreparation(canvas);
  let ctx = canvas.getContext("2d"), layout = 0, facing = 1, previous = null;
  const groundItems=createGroundItemPresentation();
  const boltOrigins=new Map(),combatVfx=createCombatVfx();
  const resourceArt=createResourcePresentation(),portalArt=createExtractionPortalPresentationD12_5C(),rewards=createRewardFeedback(canvas);
  const equipmentArt=createEquipmentArtCache(canvas.ownerDocument);
  const environmentCache=createEnvironmentCache(canvas,{authoredArt:environmentArt,diagnostics:event=>{if(!performanceProbe)return;if(event.kind==='layout')performanceProbe.record('environment.layout',event.ms??0);if(event.kind==='build')performanceProbe.record('environment.rasterBuild',event.ms??0);if(event.kind==='compose')performanceProbe.record('environment.rasterDraw',event.ms??0);}}),lighting=createLighting(canvas);
  const camera = createCamera(), prompt = createPaintedPrompt();
  const collisionDebug=new URLSearchParams(canvas.ownerDocument.defaultView?.location?.search??'').get('collisionDebug')==='1';
  const heroFacing=createHeroFacing(),siteEnvironment=createSiteEnvironment(canvas);let invalidations=0,lastInvalidationReason='none',resizeEvents=0,resizeChanges=0,resizeNoops=0,lastResize=null;
  let observedFrames=null,observedFrameKey=null;let animatedFlowers=0,ambientMarks=0,lastEnvironment=null,lastRenderedEntities=0,seamless=false;const feedback=createCombatFeedback(),healthTrails=createHealthTrailsV3(),bossEffects=createBossEffectsObserver(),observeBossEffects=bossEffects.observe;
  function invalidate(reason='explicit') { invalidations++;lastInvalidationReason=reason;healthTrails.clear();bossEffects.clear();prompt.clear();environmentCache.clear(reason);lighting.clear();layout++; }
  function resize(width, height) {
    const nextWidth=Math.max(1,Math.round(width)),nextHeight=Math.max(1,Math.round(height));resizeEvents++;lastResize={from:{width:canvas.width,height:canvas.height},to:{width:nextWidth,height:nextHeight}};
    if(canvas.width===nextWidth&&canvas.height===nextHeight){resizeNoops++;return false;}
    resizeChanges++;prompt.clear();layout++;canvas.width=nextWidth;canvas.height=nextHeight;ctx=canvas.getContext("2d");rewards.resize();return true;
  }
  function render(model, time, input) {
    prompt.clear();
    const actor = selectedActor(model), key = spaceKey(model), c = model.space.collision;
    const frames=model.navigation?.position?model.navigation.frames:null,frameKey=frames?JSON.stringify(frames):null;
    const residencyChanged=previous&&previous.key!==key;
    if(residencyChanged){previous=null;combatVfx.clear();rewards.clear();boltOrigins.clear();invalidate('residency-change');}
    if(!residencyChanged&&observedFrames&&frames&&observedFrameKey!==frameKey){const project=p=>rebaseLocalPointD9(p,observedFrames,frames);feedback.rebase(project);combatVfx.rebase(project);rewards.rebase(project);heroFacing.rebase(project);if(previous){const p=project(previous);previous.x=p.x;previous.y=p.y;}invalidate('local-frame-rebase');}
    observedFrames=frames;observedFrameKey=frameKey;
    if(performanceProbe)performanceProbe.measure("combatFeedback",()=>feedback.update(model,time));else feedback.update(model,time);
    if (previous?.key === key && actor.position.x !== previous.x) facing = actor.position.x > previous.x ? 1 : -1;
    else if (previous?.key !== key) facing = 1;
    previous = { key, x: actor.position.x,y:actor.position.y };
    const heroPoses=heroFacing.update(model);combatVfx.update(model,time,heroPoses);
    const cam = camera.update(model, canvas.width, canvas.height,time);
    ctx.fillStyle = "#080d16"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.scale(cam.zoom, cam.zoom); ctx.translate(-cam.x, -cam.y);
    const margin=64,viewport={x:cam.x-margin,y:cam.y-margin,width:canvas.width/cam.zoom+margin*2,height:canvas.height/cam.zoom+margin*2},depthItems=[];
    seamless=Boolean(model.space.overworld);
    if(model.space.settlementInterior){drawTavernGround(ctx,model.space);developmentScene?.drawInteriorOverlay?.(ctx,model);depthItems.push(...tavernDepthItems(model));}
    else if(developmentScene){developmentScene.drawGround(ctx,model,viewport,time);depthItems.push(...developmentScene.depthItems(model,viewport,time));}
    else if (model.space.visual) {
      const authoredSite=Boolean(model.space.site||model.space.functionalSite);
      if(!authoredSite)siteEnvironment.clear();
      const paint=()=>authoredSite?siteEnvironment.draw(ctx,model.space,viewport):seamless?environmentCache.draw(ctx,model.space,viewport,cam.zoom):drawEnvironment(ctx,model.space,null);
      lastEnvironment=performanceProbe?performanceProbe.measure("drawEnvironment",paint):paint();
      performanceProbe?.setGauge("paintedTerrainTiles",lastEnvironment.paintedTerrainTiles);
      performanceProbe?.setGauge("paintedBlockers",lastEnvironment.paintedBlockers);
    }
    else for (let row = 0; row < c.height; row++) for (let col = 0; col < c.width; col++) {
      const floor = c.tiles[row][col] === "1";
      ctx.fillStyle = floor ? ((row+col)%2 ? "#283c39" : "#2b403c") : "#111d28";
      ctx.fillRect(col*c.tileSize, row*c.tileSize, c.tileSize, c.tileSize);
      if (!floor) { ctx.strokeStyle = "#526275"; ctx.strokeRect(col*c.tileSize+1, row*c.tileSize+1, c.tileSize-2, c.tileSize-2); }
    }
    if(model.space.plannedVillage){drawPlannedVillageGround(ctx,model,viewport);depthItems.push(...plannedVillageDepthItems(model,viewport));}
    depthItems.push(...civilianDepthItems(model,viewport));
    if(model.space.plannedTown){drawPlannedTownGround(ctx,model,viewport);depthItems.push(...plannedTownDepthItems(model,viewport));}
    if(seamless&&!model.space.site){drawEnvironmentMarkers(ctx,model.space);depthItems.push(...environmentCache.depthItems(model.space,viewport,time));
    if(seamless&&!model.space.site)depthItems.push(...woodlandPilotEventDepthItems(model,viewport,time));}
    else if(model.space.visual&&(model.space.site||model.space.functionalSite))depthItems.push(...siteEnvironment.depthItems(model.space,viewport,time));
    animatedFlowers=seamless&&!model.space.site?environmentCache.drawFlowers(ctx,{x:cam.x,y:cam.y,width:canvas.width/cam.zoom,height:canvas.height/cam.zoom},time):0;
    ambientMarks=drawEnvironmentAmbient(ctx,model.space,{x:cam.x,y:cam.y,width:canvas.width/cam.zoom,height:canvas.height/cam.zoom},time);
    if(collisionDebug&&seamless&&!model.space.site)drawCollisionCoverageDebug(ctx,model.space,viewport);
    depthItems.push(...(environmentArt?.reviewDepthItems?.(model,viewport)??[]));
    depthItems.push(...resourceArt.depthItems(model,time,viewport));
    depthItems.push(...portalArt.depthItems(model,viewport));
    if(model.space.visual){const lightView={x:cam.x,y:cam.y,width:canvas.width/cam.zoom,height:canvas.height/cam.zoom},paintLight=()=>lighting.draw(ctx,model.space,lightView,time,actor);if(performanceProbe)performanceProbe.measure('lighting',paintLight);else paintLight();depthItems.push(...lighting.fixtures(model.space,lightView,time));}
    for(const s of model.space.forgeStations??[])if(s.position.x>viewport.x-80&&s.position.x<viewport.x+viewport.width+80&&s.position.y>viewport.y-80&&s.position.y<viewport.y+viewport.height+80){drawForgeStation(ctx,s.position.x,s.position.y,time);ctx.fillStyle='#ffe3a3';ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.fillText('Forge',s.position.x,s.position.y+37);ctx.textAlign='left';}
    const exits = model.space.exits ?? (model.space.exit?[model.space.exit]:[]);
    const exit = exits.find(e=>Math.hypot(actor.position.x-e.x,actor.position.y-e.y)<=e.radius) ?? exits[0] ?? null;
    if (!model.space.visual&&!developmentScene&&!model.space.settlementInterior&&exit) {
    ctx.fillStyle = "#b99042"; ctx.strokeStyle = "#ffe1a0"; ctx.lineWidth = 2;
    ctx.fillRect(exit.x-11, exit.y-16, 22, 26); ctx.strokeRect(exit.x-11, exit.y-16, 22, 26);
    ctx.fillStyle = "#19222b"; ctx.fillRect(exit.x-5, exit.y-10, 10, 20);
    }
    if(model.encounter?.activation&&!model.encounter.cleared&&!model.encounter.active){
      const area=model.encounter.activation;ctx.strokeStyle="#d2d99588";ctx.lineWidth=2;ctx.beginPath();ctx.arc(area.x,area.y,area.radius,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle="#dce2ba";ctx.font="12px system-ui";ctx.fillText("Slime clearing",area.x-40,area.y-area.radius-10);
    }
    drawWebWeaverHazardsD12_4J(ctx,model,model.tick);drawSlagShaperHazardsD12_4K(ctx,model,model.tick);const {bossPolishView,brimstoneView}=observeBossEffects(model);drawBossPolishGround(ctx,bossPolishView,model.tick);depthItems.push(...bossPolishDepthItems(bossPolishView,model.tick,viewport));drawBrimstoneGround(ctx,brimstoneView,model.tick);drawRecoveredBossGroundV1(ctx,model,model.tick);depthItems.push(...archivedBossDepthItems(model,model.tick,viewport));depthItems.push(...treasuryBossDepthItems(model,model.tick,viewport));depthItems.push(...brimstoneEffectDepthItems(brimstoneView,model.tick,viewport));drawAegisMimicTethers(ctx,model,model.tick);groundItems.draw(ctx,model,time,viewport,equipmentArt);
    for(const shot of model.hostileProjectiles??[])depthItems.push(depthItem({id:'hostile-shot/'+shot.id,anchorX:shot.position.x,anchorY:shot.position.y+4.5,draw:ctx=>drawOrdinaryHostileProjectile(ctx,shot,model.tick)}));
    const liveBolts=new Set((model.bolts??[]).map(b=>b.id));for(const id of boltOrigins.keys())if(!liveBolts.has(id))boltOrigins.delete(id);
    for(const bolt of model.bolts??[]){const source=model.entitiesById[bolt.sourceId],pose=heroPoses[bolt.sourceId];
      if(!boltOrigins.has(bolt.id)&&source&&pose){const focus=tomeFocusPosition(source,pose.facing,time,pose.primary,model.tick);boltOrigins.set(bolt.id,{x:focus.x-bolt.position.x,y:focus.y-bolt.position.y,frames:bolt.frames});}
      const offset=boltOrigins.get(bolt.id),weight=offset?Math.max(0,1-(offset.frames-bolt.frames)/5):0;
      // Visual launch blends from the floating focus into the canonical actor-origin path.
      // No collision, targeting, damage or saved projectile position is modified.
      ctx.save();const drawBolt=bolt.delivery==='fire'?drawFireProjectile:(ctx,p,time)=>drawElementProjectile(ctx,p,time,bolt.delivery);drawBolt(ctx,{x:bolt.position.x+(offset?.x??0)*weight,y:bolt.position.y+(offset?.y??0)*weight,vx:bolt.direction.x,vy:bolt.direction.y},time);ctx.restore();}
    drawBerserkerTransfersD12_4H_A(ctx,model,model.tick);
    lastRenderedEntities=0;
    for (const [id,drawn] of Object.entries(model.entitiesById)) {
      const margin=['aegis_goliath','overlord_iron_vault','corrosive_abomination','void_overseer','marcus','gilded_vault_keeper'].includes(drawn.boss?.bossDefinitionId)?152:64;
      if(seamless&&(drawn.position.x<viewport.x-margin||drawn.position.y<viewport.y-margin||
        drawn.position.x>viewport.x+viewport.width+margin||drawn.position.y>viewport.y+viewport.height+margin))continue;
      lastRenderedEntities++;const reaction=drawn.alive?feedback.reaction(id,time):null;
      depthItems.push(depthItem({id:'actor/'+id,anchorX:drawn.position.x,anchorY:drawn.position.y+(drawn.groundAnchorY??(drawn.hullRadius??10)*.45),draw:ctx=>{
       lighting.ground(ctx,drawn);ctx.save();if(reaction)ctx.translate(reaction.offsetX,reaction.offsetY);
       if(drawn.team==="hostile"){if(drawn.boss){if(!drawRecoveredBossV1(ctx,drawn,model.tick,Boolean(reaction?.flash))&&!drawBrimstoneColossus(ctx,drawn,model.tick,Boolean(reaction?.flash))&&!drawAegisGoliath(ctx,drawn,model.tick,Boolean(reaction?.flash)))drawArachnidTreantD12_5A(ctx,drawn,model.tick,Boolean(reaction?.flash));}else if(drawAttachedAegisMimic(ctx,drawn,model.tick,Boolean(reaction?.flash))){}else if(drawn.bossSummon?.stage==='dormant'){}else if(drawRecoveredSummonV1(ctx,drawn,model.tick,Boolean(reaction?.flash))){}else if(drawn.bossSummon?.stage==='cocoon')drawTreantCocoonD12_5A(ctx,drawn,model.tick,Boolean(reaction?.flash));else if(drawn.enemyFamily)drawOrdinaryEnemy(ctx,drawn,model.tick,Boolean(reaction?.flash),equipmentArt,drawn.enemyFamily==='temporal_watcher'?watcherLookTarget(drawn,model.entitiesById):null);else drawProofSlime(ctx,drawn,Boolean(reaction?.flash),equipmentArt);}
       else {const pose=heroPoses[id];drawGlacialSnareRearD12_4E(ctx,drawn,model.tick);drawToxicPoisonRearD12_4F(ctx,drawn,model.tick);drawNullifiedRearD12_4I(ctx,drawn,model.tick);drawWebbedRearD12_4J(ctx,drawn,model.tick);drawWorldHero(ctx,drawn,pose.facing,time,pose.primary,model.tick,Boolean(reaction?.flash),equipmentArt);drawGlacialSnareFrontD12_4E(ctx,drawn,model.tick);drawToxicPoisonFrontD12_4F(ctx,drawn,model.tick);drawNullifiedFrontD12_4I(ctx,drawn,model.tick);drawWebbedFrontD12_4J(ctx,drawn,model.tick);ctx.save();ctx.translate(drawn.position.x,drawn.position.y);drawActorStatusRow(ctx,drawn,{labels:{healthBarY:-42}});ctx.restore();}
       if(drawn.subType==='tome'&&id===model.playersById[model.localPlayerId].entityId&&model.subweapon?.maxBarrierLabel!=='0'){ctx.fillStyle='#07242a';ctx.fillRect(drawn.position.x-16,drawn.position.y-37,32,4);ctx.fillStyle='#4ddfea';ctx.fillRect(drawn.position.x-16,drawn.position.y-37,32*model.subweapon.barrierRatio,4);}
       if(drawn.team==='hostile'&&drawn.alive&&!drawn.boss){
         const healthVisual=healthTrails.sample('enemy/'+id,actorHealthRatio(drawn),time);
         drawEnemyHealthEchoV3(ctx,drawn,healthVisual,model.tick);
       }
       ctx.restore();
      }}));
    }
    drawFerryLandings(ctx,model.space.exits);
    drawDepthItems(ctx,depthItems);
    combatVfx.draw(ctx,model,time,viewport);if(performanceProbe)performanceProbe.measure("combatFeedback",()=>feedback.draw(ctx,time,equipmentArt,viewport));else feedback.draw(ctx,time,equipmentArt,viewport);
    drawAegisProjectileTrails(ctx,model,model.tick);drawAegisProjectiles(ctx,model,model.tick);
    ctx.restore();
    if(!drawRecoveredBossHudV1(ctx,canvas,model)&&!drawBrimstoneBossHud(ctx,canvas,model)&&!drawAegisBossHud(ctx,canvas,model))drawArachnidTreantBossHudD12_5A(ctx,canvas,model);drawTreasuryBossHudV2(ctx,canvas,model);
    const aliveBoss=Object.entries(model.entitiesById).find(([,entity])=>entity.alive&&entity.boss);
    if(aliveBoss){
      const [bossId,boss]=aliveBoss,visual=healthTrails.sample('boss/'+bossId,actorHealthRatio(boss),time);
      drawBossHealthEchoV3(ctx,canvas,boss,visual,time);
    }
    const available = Boolean(exit)&&((exit.siteAction||exit.forgeAction||exit.ferryLandingId||exit.serviceNpcId)?exit.available&&["safe","encounter"].includes(model.persistence.phase):model.persistence.phase === "safe") && Math.hypot(actor.position.x-exit.x, actor.position.y-exit.y) <= exit.radius;
    if (available) {
      const label = exit.label ?? (model.space.label.endsWith("A") ? "Enter test room B" : "Return to test field A");
      const compactKeep=exit.siteKind==='woodland-fort'&&label==='Leave Keep',caveMouth=exit.siteKind==='woodland-cave'&&label==='Enter Woodland Cave';
      ctx.font = compactKeep||caveMouth?"600 13px system-ui":"600 15px system-ui";
      const compact=compactKeep||caveMouth,width = Math.min(canvas.width-16, Math.ceil(ctx.measureText(label).width)+(compact?20:32)), height = compact?34:44,screenX=(exit.x-cam.x)*cam.zoom,screenY=(exit.y-cam.y)*cam.zoom;
      const x = compactKeep?canvas.width-width-12:Math.max(8, Math.min(canvas.width-width-8, screenX-width/2));
      const y = compactKeep?12:Math.max(8, Math.min(canvas.height-height-8, screenY-(caveMouth?154:94)));
      ctx.fillStyle = "#162436"; ctx.fillRect(x, y, width, height); ctx.strokeStyle = "#e5bd69"; ctx.strokeRect(x, y, width, height);
      ctx.fillStyle = "#ffe3a3"; ctx.textAlign = "center"; ctx.fillText(label, x+width/2, y+(compact?22:28)); ctx.textAlign = "left";
      prompt.record({ x, y, width, height, exitId: exit.exitId, key, layout, context: ctx });
    }
    const joy = input?.read().joystick;
    if (joy) {
      ctx.strokeStyle = "#bedbff99"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(joy.x, joy.y, 44, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = "#bedbff88"; ctx.beginPath(); ctx.arc(joy.x+joy.dx, joy.y+joy.dy, 15, 0, Math.PI*2); ctx.fill();
    }
    rewards.render(model,time,cam);
    return Object.freeze({ xpDisplay:rewards.xp(), walletDisplay:rewards.wallet(), camera: cam, actorX: actor.position.x, actorY: actor.position.y, prompt: prompt.read() });
  }
  function prepare(model,time,input){completionPreparation.prepare();const first=render(model,time,input);if(seamless&&!model.space.site)environmentCache.prepareVisible();return render(model,time,input)??first;}
  return Object.freeze({ render, prepare, resize, invalidate, observeBossEffects, camera, prompt,
    resources: () => Object.freeze({ ...(environmentArt?.resources()??{}),...feedback.resources(), ...rewards.resources(), ...siteEnvironment.resources(), ...environmentCache.resources(), ...lighting.resources(),rendererInvalidations:invalidations,rendererLastInvalidationReason:lastInvalidationReason,rendererResizeEvents:resizeEvents,rendererResizeChanges:resizeChanges,rendererResizeNoops:resizeNoops,rendererLastResize:lastResize, ambientMarks, animatedFlowers, activeSpaceViews: previous ? 1 : 0, rasterCaches: siteEnvironment.resources().siteRasterPages, paintedPrompts: prompt.read() ? 1 : 0,
      completionArtPreparation:completionPreparation.inspect(),collisionCoverageDebug:collisionDebug,...(seamless?{paintedTerrainTiles:lastEnvironment?.paintedTerrainTiles??0,totalTerrainTiles:lastEnvironment?.totalTerrainTiles??0,
        paintedBlockers:lastEnvironment?.paintedBlockers??0,renderedEntities:lastRenderedEntities}: {}) }),
    hit: (point, model) => prompt.hit(point.x, point.y, spaceKey(model), layout, ctx),
    replaceContext: () => { invalidate('context-restored'); ctx = canvas.getContext("2d"); } });
}
