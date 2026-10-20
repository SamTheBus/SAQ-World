import {serviceActionProblem,applyServiceAction} from '../shared/contracts/settlement_services_v1.js';
import {ferryTravelTarget} from '../shared/contracts/ferry_travel_v1.js';
import {multiplyCombat} from '../shared/contracts/combat_amount.js';
import {captureWorldPositionsD9} from '../shared/contracts/world_runtime_d9.js';
import {receiveMasteryDefense} from './mastery_transient.js';
import {createMasteryAwards} from './mastery_awards.js';
import {prepareD8Command,applyD8Command} from '../shared/contracts/progression_commands.js';
import {frostMovement,frostMovementRates} from './tome_element_rules.js';
import {guardIntent,settleGuard,reconcileGuard} from '../shared/contracts/shield_guard.js';
import {damageSourceItem} from '../shared/contracts/combat_attribution.js';
import {createEncounterRenewal,canUseResource,useEconomicResource,economicResources} from '../shared/contracts/encounter_economy.js';
import {canDropGear,applyDropGear,collectRenewableGear} from '../shared/contracts/renewable_inventory.js';
import {canAttune,applyAttunement} from '../shared/contracts/forge_economy.js';
import { EQUIPMENT, equipmentAfter } from '../shared/content/equipment.js';
import { canPickUp, equipmentActionAvailable, ownedItem, MAX_GOLD } from '../shared/contracts/player_inventory.js';
import { PLAYER_RESPAWN_VERSION, startingSettlementRespawn } from '../shared/contracts/player_respawn.js';
import { resolvePlayerStats } from '../shared/contracts/player_stats.js';
import { combatIntegerWire } from '../shared/contracts/combat_integer.js';
import { createActivityProgression } from './activity_progression.js';
import { ORDINARY_ACTIVITY_RADII } from '../shared/contracts/encounter_progression.js';
import {functionalSiteGroupsD12,isGeneratedInteriorFamily} from '../shared/contracts/functional_site_d9.js';
import {canSalvage,applySalvage} from '../shared/contracts/gear_salvage.js';
import { upgradeActivityState } from '../shared/contracts/activity_state.js';
import { createOrdinaryEvade } from './ordinary_evade.js';
import { canActivityTargetActor, canActivityApplyDamage } from './activity_combat_legality.js';
import { siteTransitionTarget, SITE_EXIT_PROTECTION_TICKS } from '../shared/contracts/site_interiors.js';
import {captureMeleeAssistAim,meleeLineClear,MELEE_ASSIST_RADIUS} from './melee_assist.js';
import {separateLiveOrdinary} from './ordinary_separation.js';
import { ordinaryEnemyForProfile } from '../shared/content/ordinary_enemies.js';
import {hostileMeleeMotionD11_2} from '../shared/content/encounter_motion_d11_2.js';
import {createEncounterContainmentD11_2} from './encounter_containment_d11_2.js';
import {createInteriorNavigationD12_3A} from './interior_navigation_d12_3a.js';
import { createEvent } from '../shared/contracts/events.js';
import { validateId } from '../shared/contracts/identities.js';
import { createActivityState, actorRules, actorContext, activityContextMatches } from '../shared/contracts/activity_state.js';
import { copyWire, freezeWire, requireContract, canonicalStringify, safeInteger } from '../shared/contracts/wire.js';
import { primaryPinnedCommands, primaryProfile } from '../shared/contracts/primary.js';
import { manifestForState,originManifestForState, discoverOverworldActors, areaAtWorldPosition, technicalChunkId } from '../shared/contracts/overworld.js';
import { createActivityScheduler } from './activity_scheduler.js';
import { createSpatialIndex } from './activity_spatial.js';
import { applyPrimaryIntent, readyPrimarySources, beginPrimary, advancePrimaryPhases, primaryMovementIntent, pendingPrimaryHits, selectForwardActor, cancelDefeatedPrimaries } from './primary_rules.js';
import { advanceAttackTimer, stepActorMovement, selectSimpleEnemyTarget, approachIntent, canActorAttack, resolveBoundedDirectDamage } from './trusted_combat_rules.js';
import {combatInteger,asCombatAmount,resolveCombatDamage,compareCombat} from '../shared/contracts/combat_amount.js';
import {canClaimSubweapon,claimSubweapon} from '../shared/contracts/subweapon_inventory.js';
import {cancelSubweaponResidency} from '../shared/contracts/subweapon_combat.js';
import {canShadowDash,beginShadowDash,advanceShadowDash,criticalDamagePacket,incomingSubweaponHit,clearHullGap,subweaponLineClear} from './subweapon_rules.js';
import {selectTomeTarget} from './tome_targeting.js';
import {createSubweaponSimulation} from './subweapon_simulation.js';
import { collidesWithTiles,collisionBlockDetail,isActorInReach } from '../shared/rules/world_geometry.js';
import {assertActorGeometryD9} from '../shared/contracts/actor_geometry_d9.js';
import {createEliteCombatD12_4} from './elite_combat_d12_4.js';
import {subweaponSuppressedD12_4I} from '../shared/contracts/elite_combat_d12_4.js';
import {createBossCombatD12_5A} from './boss_combat_d12_5.js';
import {observeSiteRunEpisodesD13B,siteRunEpisodeObservationRequiredD13B} from '../shared/contracts/site_run_episode_d13b.js';

// Private working state: validated/copied on construction; never returned to a client.
// Inspection/snapshot/commit are full validation boundaries. Clock = one explicit call.
export function createActivitySimulation(initialState,{measure=(_name,fn)=>fn(),schedulerOptions={},developerCapabilities={}}={}) {
  const state=copyWire(upgradeActivityState(initialState)),manifest=manifestForState(state),progression=createActivityProgression(state,manifest,measure),evade=createOrdinaryEvade(state,manifest,{onHomeReset:progression.onHomeReset}),navigation=createInteriorNavigationD12_3A(state,{eligible:(source,target)=>canActivityTargetActor(state,manifest,source,target),lineClear:meleeLineClear,inAttackGeometry:isActorInReach}),containment=createEncounterContainmentD11_2(state,{participantPolicy:navigation.participantPolicy,targetPolicy:navigation.targetPolicy}),scheduler=createActivityScheduler(state,{...(manifest.population?ORDINARY_ACTIVITY_RADII:{}),...schedulerOptions},{beforeSleep:(g,r)=>{if(!containment.beforeSleep(g)||!evade.beforeSleep(g,r))return false;progression.resetGroup(g);eliteCombat.clearGuardForGroup(g.groupId);eliteCombat.clearAttackAuraForGroup(g.groupId);return true;},onWake:progression.freezeGroup}),spatial=createSpatialIndex(),eliteCombat=createEliteCombatD12_4(state,{lineClear:(source,target)=>meleeLineClear(state.spacesByInstanceId[source.residency.spaceInstanceId].collision,source,target),applyPeriodicDamage:packet=>{const source=state.entitiesById[packet.sourceEntityId],target=state.entitiesById[packet.targetEntityId],result=damage(source,target,packet.damage,packet.mechanic??'poison',null,{periodic:true,trigger:'periodic',sourceEliteId:packet.sourceEliteId,hazardId:packet.hazardId??null,nonlethal:packet.nonlethal===true});requireContract(result,'Invalid elite periodic target');return result;}}),bossCombat=createBossCombatD12_5A(state,{applyDirectDamage:(source,target,amount,mechanic)=>damage(source,target,amount,mechanic,null,{scripted:true,directEnemyAttack:'melee',trigger:null})});
  let activeIds=[],events=[],version=0,lastUpdated=[],clearedGroups=Object.values(state.groupsById).filter(g=>g.cleared).length;
  let renewal=createEncounterRenewal(state,manifest,g=>scheduler.renewGroup(g));
  const identity=prefix=>`${prefix}:${safeInteger(++state.identitySequence,1).toString(16).padStart(32,'0')}`;
  function emit(event){events.push(event);if(events.length>64)events.shift();}
  const assist={starts:0,candidates:0,maxCandidates:0,assisted:0};
  const movementBlocks={attempts:0,blockedTicks:0,genuineBlocker:0,missingResidentPage:0,outsideLocalFrame:0,oldFiniteBound:0,unexplained:0,seamDisagreement:0,last:null};
  function startReady(){for(const p of Object.values(state.playersById)){const c=state.subweaponCombat.actors[p.entityId],a=state.entitiesById[p.entityId];reconcileGuard(c.guard,a,progression.resolvedStats(p.entityId),p.connectionStatus==='connected');settleGuard(c.guard,state.primary.actorsById[p.entityId]);}for(const id of readyPrimarySources(state)){
    const actor=state.entitiesById[id],collision=state.spacesByInstanceId[actor.residency.spaceInstanceId].collision;
    // Exit grace ends at actual offensive action start, including the first held swing.
    if(state.siteExitProtectionByEntityId)delete state.siteExitProtectionByEntityId[id];
    const aim=measure('assistQuery',()=>{const candidates=query(actor,MELEE_ASSIST_RADIUS);assist.starts++;assist.candidates+=candidates.length;assist.maxCandidates=Math.max(assist.maxCandidates,candidates.length);return captureMeleeAssistAim(actor,candidates.filter(target=>canActivityTargetActor(state,manifest,actor,target)),collision);});
    const event=beginPrimary(state,id,{primaryActionId:identity('pra'),startEventId:identity('evt'),finishEventId:identity('evt')});
    const action=state.primary.actorsById[id].current;if(aim){action.aim=aim;assist.assisted++;}
    emit(event);state.primaryContextsById[action.primaryActionId]=actorContext(state,id);
  }}
  function schedule(){activeIds=measure('scheduler',()=>scheduler.schedule());return activeIds;}
  function refreshSpatial(){for(const id of spatialIds)spatial.remove(id);spatialIds=activeIds.slice();for(const id of activeIds){const a=state.entitiesById[id];spatial.insert(id,a.residency.spaceInstanceId,[a.position]);}}
  let separation={queries:0,candidates:0,pairs:0,movedActors:0,maxCandidates:0};
  let spatialIds=[];schedule();refreshSpatial();
  function query(a,r){return measure('targetQuery',()=>spatial.query(a.residency.spaceInstanceId,a.position,r).map(id=>state.entitiesById[id]).filter(b=>Math.hypot(a.position.x-b.position.x,a.position.y-b.position.y)<=r));}
  const playerFor=id=>Object.values(state.playersById).find(p=>p.entityId===id);
  const mastery=createMasteryAwards(state);
  const family=createSubweaponSimulation(state,{damage,mastery,eligible:(a,b)=>canActivityApplyDamage(state,manifest,a,b),identity,getStats:progression.resolvedStats,refreshStats:progression.equipmentChanged});
  function damage(source,target,requested=null,mechanic='main',causationCommandId=null,attribution=null){const periodic=attribution?.periodic===true;if(!periodic&&!canActivityApplyDamage(state,manifest,source,target))return;
    if(!source||!target||!target.alive||!periodic&&(!source.alive||source.residency.spaceInstanceId!==target.residency.spaceInstanceId)||periodic&&(source.team!=='hostile'||target.team!=='party'||!Object.values(state.playersById).some(player=>player.entityId===target.entityId)))return;
    if(mechanic==='bash'&&!attribution?.masteryArea&&family.effects.bash(source,target,requested,attribution?.trigger??'pressure'))return;
    if(!periodic){progression.prepareCombat(source,scheduler.config.prepareRadius);progression.prepareCombat(target,scheduler.config.prepareRadius);}
    let raw=requested??asCombatAmount(source.attackDamage),critical=false,defense=null,defenseStats=null,barrierAbsorption=null,pendingPlayerRng=null,pendingForcedTransient=null,eliteGuard=null,eliteAttack=null;
    const sourceSubweaponSuppressed=source.team==='party'&&subweaponSuppressedD12_4I(state,source.entityId);
    if(mechanic==='main'){const factor=family.effects.mainMultiplier(target);raw=multiplyCombat(raw,factor.n,factor.d);}
    if(source.team==='party'){const transient=playerFor(source.entityId)?.d8?.transient,forced=!sourceSubweaponSuppressed&&mechanic==='main'&&transient?.retaliatoryReady===true,combat=state.subweaponCombat.actors[source.entityId],roll=state.d9World?{rng:combat.rng}:combat;if(forced){if(state.d9World)pendingForcedTransient=transient;else transient.retaliatoryReady=false;}const packet=criticalDamagePacket(roll,progression.resolvedStats(source.entityId),raw,mechanic,forced);if(state.d9World)pendingPlayerRng=roll.rng;raw=packet.damage;critical=packet.critical;}
    else if(!periodic)mechanic='hostile';
    if(source.team==='hostile'&&target.team==='party'&&!periodic){const empowered=eliteCombat.empowerDirectAttack(source,target,raw,{delivery:attribution?.directEnemyAttack??(attribution?.contactMelee?'melee':null),periodic,trigger:attribution?.trigger??null,scripted:attribution?.scripted===true});raw=empowered.damage;eliteAttack=empowered.attackAura;}
    if(target.team==='hostile'&&!periodic){raw=bossCombat.mitigateIncoming(target,raw).damage;const guarded=eliteCombat.mitigateDirectDamage(source,target,raw,{periodic,trigger:attribution?.trigger??null,scripted:attribution?.scripted===true});raw=guarded.damage;eliteGuard=guarded.guard;}
    if(target.team==='party'&&!periodic){const stats=progression.resolvedStats(target.entityId),suppressed=subweaponSuppressedD12_4I(state,target.entityId);defenseStats=stats;defense=incomingSubweaponHit({combat:state.subweaponCombat.actors[target.entityId],stats,raw,actor:target,source,boss:bossCombat.isBoss(source.entityId)||Boolean(state.content.definitionsById[source.contentDefinitionId]?.isBoss),suppressed});raw=defense.damage;if(compareCombat(defense.absorbed,0)>0)barrierAbsorption={absorbed:copyWire(defense.absorbed),remaining:copyWire(state.subweaponCombat.actors[target.entityId].barrier),capacity:copyWire(stats.maxBarrier)};}
    const sourceItem=periodic?null:attribution?.sourceItem??damageSourceItem(playerFor(source.entityId),mechanic);
    const result=resolveCombatDamage(target.hp,raw),defeatPlan=state.d9World&&!result.targetAlive?progression.prepareDefeat(target,scheduler.config.prepareRadius):null;
    if(pendingPlayerRng)state.subweaponCombat.actors[source.entityId].rng=pendingPlayerRng;if(pendingForcedTransient)pendingForcedTransient.retaliatoryReady=false;
    if(!periodic){if(mechanic==='main'||mechanic==='hostile')source.attackTimer=0;source.nextAttackActionSequence++;}
    target.hp=copyWire(result.resultingHp);target.alive=result.targetAlive;
    if(attribution?.contactMelee&&target.alive)eliteCombat.queueContactMelee(source,target);
    if(source.team==='party'&&target.team==='hostile'&&compareCombat(result.damage,0)>0&&navigation.alert(target,source))containment.alert(target);
    if(defense&&!defense.suppressed)mastery.incoming(target,source,defense,source.nextAttackActionSequence-1);
    if(mechanic==='bash'&&compareCombat(result.damage,0)>0)mastery.activation(source,target,'shield','bash',attribution?.masterySequence??source.nextAttackActionSequence-1,10,false);
    // The sole living -> defeated edge. No event, reset or loader awards XP.
    if(!target.alive){
      if(target.ai?.melee)target.ai.defeatedTick=state.tick;
      if(target.team==='hostile'){eliteCombat.clearGuard(target.entityId);eliteCombat.clearAttackAura(target.entityId);}
      progression.awardDefeat(target,scheduler.config.prepareRadius,defeatPlan);
      if(source.team==='party'&&mechanic!=='main'){mastery.defeat(source,target,sourceItem?.subType);family.effects.defeated(source,target,sourceItem?.subType);}
      if(target.team==='party')measure('playerDeath',()=>{target.movementIntent={x:0,y:0};target.movedLastTick=false;target.attackTimer=0;if(!periodic)eliteCombat.clearHostilePoison(target.entityId);eliteCombat.clearNullification(target.entityId);eliteCombat.clearSlagBurn(target.entityId);bossCombat.clearStatus(target.entityId);if(state.siteExitProtectionByEntityId)delete state.siteExitProtectionByEntityId[target.entityId];});
    }
    const context=actorContext(state,periodic?target.entityId:source.entityId),player=Object.values(state.playersById).find(p=>p.entityId===source.entityId),attackActionId=identity('act');
    const common={protocolVersion:state.protocolVersion,campaignId:state.campaign.campaignId,sessionId:state.session.sessionId,tick:state.tick,
      causation:{commandId:causationCommandId,playerId:player?.playerId??null},
      source:{playerId:player?.playerId??null,characterId:source.ownerCharacterId,entityId:source.entityId},subject:{entityId:target.entityId},
      spaceInstanceId:context.spaceInstanceId,spaceRevision:context.spaceRevision};
    for(const kind of [...(periodic?[]:['combat.attackStarted']),compareCombat(result.damage,0)>0?'combat.damageApplied':'combat.defenseResolved',...(!target.alive?['combat.actorDefeated']:[])])emit(createEvent({...common,eventId:identity('evt'),eventSequence:++state.eventEmission.lastEventSequence,kind,
      payload:kind==='combat.attackStarted'?{attackActionId,sourceEntityId:source.entityId,targetEntityId:target.entityId}:
        {attackActionId,sourceEntityId:source.entityId,sourceCharacterId:source.ownerCharacterId,targetEntityId:target.entityId,damage:result.damage,resultingHp:result.resultingHp,targetAlive:result.targetAlive,combatVersion:'combat-integer-v2',barrierAbsorption,sourceItem,...(attribution?.chainFrom?{chainFrom:attribution.chainFrom}:{}),trigger:attribution?.trigger??null,critical,defenseKind:defense?.defense??null,mechanic:compareCombat(result.damage,0)===0?(defense?.defense??'block'):mechanic}}));
    if(defense&&!defense.suppressed&&target.alive){const p=playerFor(target.entityId),reaction=receiveMasteryDefense(p,target,defense,progression.resolvedStats(target.entityId));if(reaction.changed)progression.equipmentChanged(p);if(reaction.pulse)mastery.defensiveActivation(target,source,'shield','pulse',source.nextAttackActionSequence-1,25);}
    if(defense&&!defense.suppressed&&target.alive)family.effects.defended(target,source,defense,source.nextAttackActionSequence-1,defenseStats);
    cancelDefeatedPrimaries(state);
    if(!target.alive)cancelSubweaponResidency(state,target.entityId);
    if(target.team==='party')family.reconcile(target.entityId);
    if(defense?.counter&&target.alive&&source.alive&&clearHullGap(target,source)<=20&&meleeLineClear(state.spacesByInstanceId[target.residency.spaceInstanceId].collision,target,source))damage(target,source,defense.counter.damage,defense.counter.mechanic,null,{sourceItem:damageSourceItem(playerFor(target.entityId),defense.counter.mechanic),trigger:'reactive'});
    return {critical,damage:result.damage,defeated:!result.targetAlive,targetAlive:result.targetAlive,eliteGuard,eliteAttack};
  }
  const hostileMotion=a=>hostileMeleeMotionD11_2(ordinaryEnemyForProfile(a.contentDefinitionId)?.family);
  function advanceHostileMelee(a,impacts){const melee=a.ai?.melee;if(!melee||melee.phase==='idle'||state.tick<melee.phaseEndsTick)return;if(melee.phase==='windup'){melee.phase='impact';melee.phaseStartedTick=state.tick;melee.phaseEndsTick=state.tick+hostileMotion(a).impactTicks;impacts.push([a.entityId,melee.targetEntityId]);}
    else if(melee.phase==='impact'){melee.phase='recovery';melee.phaseStartedTick=state.tick;melee.phaseEndsTick=state.tick+hostileMotion(a).recoveryTicks;}
    else {melee.phase='idle';melee.phaseStartedTick=state.tick;melee.phaseEndsTick=state.tick;melee.targetEntityId=null;}}
  function startHostileMelee(a,target){const timing=hostileMotion(a),melee=a.ai?.melee;if(!timing||!melee||melee.phase!=='idle')return false;melee.phase='windup';melee.phaseStartedTick=state.tick;melee.phaseEndsTick=state.tick+timing.windupTicks;melee.targetEntityId=target.entityId;melee.actionSequence=a.nextAttackActionSequence;return true;}
  function updateHostileMotion(a){const motion=a.ai?.motion;if(!motion||!a.movedLastTick)return;if(motion.lastMovedTick===null||state.tick-motion.lastMovedTick>1)motion.startedTick=state.tick;motion.lastMovedTick=state.tick;}
  function pruneContexts(){
    const records=[...Object.values(state.primary.completedById),...Object.values(state.primary.actorsById).map(a=>a.current).filter(Boolean)],recordIds=new Set(records.map(r=>r.primaryActionId));
    for(const id of Object.keys(state.primaryContextsById))if(!recordIds.has(id))delete state.primaryContextsById[id];
    for(const [entityId,history] of Object.entries(state.residencyHistoryByEntityId)){
      const needed=new Set([state.entitiesById[entityId].residency.residencyRevision]);
      for(const r of records)if(r.sourceEntityId===entityId)needed.add(state.primaryContextsById[r.primaryActionId].residencyRevision);
      for(const r of Object.values(state.appliedCommandsById))if(state.playersById[r.playerId].entityId===entityId)needed.add(JSON.parse(r.commandCanonical).residencyRevision);
      for(const revision of Object.keys(history))if(!needed.has(Number(revision)))delete history[revision];
    }
  }
  function pruneCommands(){const pinned=new Set(primaryPinnedCommands(state));const recent=Object.values(state.appliedCommandsById).sort((a,b)=>b.authorityOrder-a.authorityOrder).slice(0,24);
    for(const r of recent)pinned.add(r.commandId);for(const id of Object.keys(state.appliedCommandsById))if(!pinned.has(id))delete state.appliedCommandsById[id];pruneContexts();}
  function apply(command,authorityOrder){requireContract(authorityOrder===state.lastAppliedAuthorityOrder+1&&command.clientSequence===state.appliedClientSequences[command.playerId]+1,'Noncontiguous applied command');
    const player=state.playersById[command.playerId],actor=state.entitiesById[player.entityId],inventory=player.inventory,respawning=command.kind==='player.respawn',suppressed=subweaponSuppressedD12_4I(state,actor.entityId),target=command.kind==='ferry.travel'?ferryTravelTarget(state,actor,command.payload):command.kind==='site.transition'?siteTransitionTarget(state,manifest,actor,command.payload):null,progressionPlan=prepareD8Command(player,command),valid=(!progressionPlan||!progressionPlan.error&&command.expectedSaveRevision===state.campaign.saveRevision)&&activityContextMatches(state,command)&&(respawning?!actor.alive:actor.alive)&&(!['site.transition','ferry.travel'].includes(command.kind)||Boolean(target))&&(command.kind!=='loot.pickup'||inventory?.revision===command.payload.inventoryRevision&&canPickUp(state,player,command.payload.sourceEntityId,resolvePlayerStats(player).pickupRadius))&&(command.kind!=='subweapon.claim'||canClaimSubweapon(state,player,command.payload))&&(command.kind!=='combat.guardIntent'||!command.payload.pressed||!suppressed&&resolvePlayerStats(player).subType==='shield')&&(command.kind!=='combat.shadowDash'||canShadowDash(actor,state.subweaponCombat.actors[actor.entityId],resolvePlayerStats(player),suppressed))&&(command.kind!=='gear.salvage'||canSalvage(state,player,command.payload))&&(command.kind!=='gear.drop'||canDropGear(state,player,command.payload))&&(command.kind!=='resource.interact'||canUseResource(state,manifest,player,command.payload))&&(command.kind!=='forge.attune'||canAttune(state,player,command.payload,manifest))&&(!(command.kind.startsWith('service.')||command.kind==='supply.use')||serviceActionProblem(state,player,command.kind,command.payload)===null)&&(!command.kind.startsWith('equipment.')||equipmentActionAvailable(state,player,command.kind,command.payload));
    if(valid){if(respawning)measure('playerRespawn',()=>{
      state.encounterEconomy.outingsByPlayer[player.playerId].earnedOutside=false;
      const anchor=startingSettlementRespawn(state,manifest,actor),count=safeInteger((state.playerRespawnsById?.[command.playerId]?.count??0)+1,1);
      safeInteger(actor.residency.residencyRevision+1,1);
      cancelDefeatedPrimaries(state,actor.entityId);
       eliteCombat.clearHostilePoison(actor.entityId);eliteCombat.clearNullification(actor.entityId);eliteCombat.clearSlagBurn(actor.entityId);bossCombat.clearStatus(actor.entityId);actor.hp=structuredClone(combatInteger(resolvePlayerStats(state.playersById[command.playerId]).maxHp));actor.alive=true;actor.attackTimer=0;
      relocate(actor.entityId,anchor.spaceInstanceId,anchor.position,authorityOrder);
      (state.playerRespawnsById??={})[command.playerId]={version:PLAYER_RESPAWN_VERSION,count,command:copyWire(command),authorityOrder,tick:state.tick,toResidencyRevision:actor.residency.residencyRevision,settlementId:anchor.settlementId};
    });else if(command.kind==='loot.pickup'){
      if(inventory.renewal)collectRenewableGear(state,player,command,authorityOrder);else {const r=inventory.rewardsByEntityId[command.payload.sourceEntityId];r.claimed=true;if(r.definitionId){const item=ownedItem(player,r.definitionId,r.sourceEntityId);inventory.itemsById[item.itemId]=item;}inventory.revision++;r.pickup={command:copyWire(command),authorityOrder,tick:state.tick,revision:inventory.revision};
    }}else if(command.kind==='subweapon.claim'){claimSubweapon(state,player,command,authorityOrder);
    }else if(command.kind==='combat.guardIntent'){guardIntent(state.subweaponCombat.actors[actor.entityId].guard,command.payload.pressed,state.primary.actorsById[actor.entityId]);
    }else if(command.kind==='combat.shadowDash'){beginShadowDash(actor,state.subweaponCombat.actors[actor.entityId],resolvePlayerStats(player),command.payload.aim);
    }else if(command.kind==='gear.salvage'){applySalvage(state,player,command,authorityOrder);
    }else if(command.kind==='gear.drop'){applyDropGear(state,player,command,authorityOrder);
    }else if(command.kind.startsWith('service.')||command.kind==='supply.use'){applyServiceAction(state,player,command,authorityOrder);progression.equipmentChanged(player);family.reconcile(actor.entityId);
    }else if(command.kind==='resource.interact'){useEconomicResource(state,manifest,player,command.payload,progression.prepareResource);
    }else if(command.kind==='progression.change'){applyD8Command(state,player,command,authorityOrder,progressionPlan);progression.equipmentChanged(player);family.reconcile(actor.entityId);
    }else if(command.kind==='forge.attune'){applyAttunement(state,player,command,authorityOrder);progression.equipmentChanged(player);family.reconcile(actor.entityId);
    }else if(command.kind.startsWith('equipment.')){
      if(command.kind==='equipment.equip'){inventory.equipped=equipmentAfter(inventory,command.payload.itemId,command.payload.slot);}else inventory.equipped[command.payload.slot]=null;
      inventory.revision++;inventory.lastEquipmentChange={command:copyWire(command),authorityOrder,tick:state.tick,revision:inventory.revision};progression.equipmentChanged(player);family.reconcile(actor.entityId);
    }else if(command.kind==='movement.setIntent'){
      actor.movementIntent=copyWire(command.payload);
      const primary=state.primary.actorsById[actor.entityId],length=Math.hypot(command.payload.x,command.payload.y);
      if(primary&&length>0)primary.facing={x:command.payload.x/length,y:command.payload.y/length};
    }else if(target){const functional=state.d9World?.functionalSitesById?.[command.payload.siteId];if(command.payload.direction==='enter'&&isGeneratedInteriorFamily(functional)&&!functional.discoveredByPlayerIds.includes(command.playerId)){functional.discoveredByPlayerIds.push(command.playerId);functional.discoveredByPlayerIds.sort();}relocate(actor.entityId,target.spaceInstanceId,target.position,authorityOrder);
      if(!target.civilian&&['exit','extract'].includes(command.payload.direction))(state.siteExitProtectionByEntityId??={})[actor.entityId]=safeInteger(state.tick+SITE_EXIT_PROTECTION_TICKS,1);
    }else applyPrimaryIntent(state,actor.entityId,command);}
    state.lastAppliedAuthorityOrder=authorityOrder;state.appliedClientSequences[command.playerId]=command.clientSequence;
    state.appliedCommandsById[command.commandId]={commandId:command.commandId,commandCanonical:canonicalStringify(command),playerId:command.playerId,clientSequence:command.clientSequence,authorityOrder,tick:state.tick,status:valid?'applied':'stale'};
    startReady();pruneCommands();captureWorldPositionsD9(state);version++;return freezeWire(state.appliedCommandsById[command.commandId]);}
  function advanceOneTick(){return measure('simulation',()=>{
    state.tick=safeInteger(state.tick+1,1);
    for(const [id,until] of Object.entries(state.siteExitProtectionByEntityId??{}))if(state.tick>=until)delete state.siteExitProtectionByEntityId[id];
    eliteCombat.beginTick();bossCombat.beginTick();family.enforceSuppression();
    evade.beginTick();schedule();navigation.startTick();containment.beginTick();refreshSpatial();lastUpdated=[];const ready=[],phaseImpacts=[],frostRates=frostMovementRates(state);
    for(const id of activeIds){const a=state.entitiesById[id];lastUpdated.push(id);if(!a.alive)continue;
      a.attackTimer=advanceAttackTimer(a);advanceHostileMelee(a,phaseImpacts);let intent=primaryMovementIntent(state,a),returning=false;
      if(a.ai&&frostRates.get(id)===0){a.movedLastTick=false;continue;}
      if(a.ai&&bossCombat.frozen(id)){a.ai.updatesApplied++;intent={x:0,y:0};}
      else if(a.ai){a.ai.updatesApplied++;const collision=state.spacesByInstanceId[a.residency.spaceInstanceId].collision,contained=containment.groupForActor(id);let target=null;
        if(contained){if(navigation.manages(a)){const decision=measure('caveNavigation',()=>navigation.intentFor(a));target=decision.target;intent=decision.intent;returning=decision.returning;}else {const returnIntent=containment.returnIntent(a);if(returnIntent){intent=returnIntent;returning=true;}else {target=measure('targetQuery',()=>containment.targetFor(a,(source,candidate)=>canActivityTargetActor(state,manifest,source,candidate)&&meleeLineClear(collision,source,candidate)));intent=target?containment.approach(a,target,collision):{x:0,y:0};}}}
        else {const candidates=Object.fromEntries(query(a,a.ai.acquireRange).filter(b=>canActivityTargetActor(state,manifest,a,b)&&meleeLineClear(collision,a,b)).map(b=>[b.entityId,b]));target=measure('targetQuery',()=>selectSimpleEnemyTarget(a,candidates));intent=target?approachIntent(a,target):evade.returnIntent(a);returning=!target;if(target&&ordinaryEnemyForProfile(a.contentDefinitionId)&&Math.hypot(a.position.x-target.position.x,a.position.y-target.position.y)<=14)intent={x:0,y:0};}
        if(a.ai.melee&&a.ai.melee.phase!=='idle')intent={x:0,y:0};if(target){progression.prepareCombat(a,scheduler.config.prepareRadius);bossCombat.observeTarget(a,target);if(!bossCombat.isBoss(id)&&(a.ai.melee?.phase==='idle'||!a.ai.melee))ready.push([id,target.entityId]);}}
      if(a.team==='party'&&state.subweaponCombat.actors[id].guard?.raised)intent={x:intent.x*.5,y:intent.y*.5};
      if(a.team==='party'&&advanceShadowDash(a,state.subweaponCombat.actors[id],progression.resolvedStats(id),state.spacesByInstanceId[a.residency.spaceInstanceId].collision,subweaponSuppressedD12_4I(state,id)))continue;
      const slow=frostRates.get(id)??1,statusMovement=Math.min(eliteCombat.movementMultiplier(id),bossCombat.movementMultiplier(id)),movementMultiplier=a.team==='party'?Math.min(slow,statusMovement):statusMovement;if(a.team!=='party')intent={x:intent.x*slow,y:intent.y*slow};const move=stepActorMovement(a,state.spacesByInstanceId[a.residency.spaceInstanceId].collision,intent,movementMultiplier);
      if(a.team==='party'&&(intent.x||intent.y)){movementBlocks.attempts++;if(!move.moved){const collision=state.spacesByInstanceId[a.residency.spaceInstanceId].collision,vx=intent.x*a.moveSpeed,vy=intent.y*a.moveSpeed,detail=(vx?collisionBlockDetail(collision,a.position.x+vx,a.position.y,a.hullRadius):null)??(vy?collisionBlockDetail(collision,a.position.x,a.position.y+vy,a.hullRadius):null),chunk=detail?.chunkKey&&state.d9World?.runtime.chunks.find(c=>`${c.chunkX},${c.chunkY}`===detail.chunkKey),blocker=chunk&&detail.localTileX!==undefined?chunk.visual.blockers.find(b=>detail.localTileX>=b.x&&detail.localTileY>=b.y&&detail.localTileX<b.x+b.width&&detail.localTileY<b.y+b.height):null,routeClearance=Boolean(chunk?.visual.route?.clearance?.[detail?.localTileY]?.[detail?.localTileX]==='1'),reason=detail?.reason??'unexplained';movementBlocks.blockedTicks++;movementBlocks[reason]=(movementBlocks[reason]??0)+1;movementBlocks.last={tick:state.tick,entityId:id,...detail,reason,routeClearance,obstacleId:blocker?.id??null,obstacleFootprint:blocker?{x:blocker.x,y:blocker.y,width:blocker.width,height:blocker.height}:null};}}
      if(a.team!=='hostile'||a.residency.spaceInstanceId!==state.overworldInstanceId||!manifest.safeRegions.some(r=>move.position.x+a.hullRadius>r.x&&move.position.x-a.hullRadius<r.x+r.width&&move.position.y+a.hullRadius>r.y&&move.position.y-a.hullRadius<r.y+r.height)){
        a.position=copyWire(move.position);a.movedLastTick=move.moved;}else a.movedLastTick=false;
      if(returning)evade.finishMovement(a);
    }
    family.step();refreshSpatial();separation=measure('separation',()=>separateLiveOrdinary(state,activeIds,spatial,manifest,measure));for(const id of activeIds){const a=state.entitiesById[id];if(a?.alive)updateHostileMotion(a);}containment.finishTick();navigation.finishTick();bossCombat.advance();refreshSpatial();
    for(const event of advancePrimaryPhases(state))emit(event);
    for(const p of Object.values(state.playersById))settleGuard(state.subweaponCombat.actors[p.entityId].guard,state.primary.actorsById[p.entityId]);
    for(const id of pendingPrimaryHits(state)){const a=state.entitiesById[id],action=state.primary.actorsById[id].current;
      const tome=progression.resolvedStats(id).subType==='tome';
      const targetId=measure('targetQuery',()=>selectForwardActor(a,query(a,400),action.aim,primaryProfile(state,id).forwardDotMinimum,(source,target)=>canActivityTargetActor(state,manifest,source,target)&&clearHullGap(source,target)<=20&&meleeLineClear(state.spacesByInstanceId[source.residency.spaceInstanceId].collision,source,target)));
      action.hitResolved=true;if(targetId)family.main(a,state.entitiesById[targetId]);else {const r=economicResources(state,manifest).filter(r=>r.kind==='breakable'&&!r.used&&r.spaceInstanceId===a.residency.spaceInstanceId).find(r=>{const dx=r.position.x-a.position.x,dy=r.position.y-a.position.y,d=Math.hypot(dx,dy);return d<=a.attackReach+a.combatRadius+10&&(!d||(dx*action.aim.x+dy*action.aim.y)/d>=primaryProfile(state,id).forwardDotMinimum)&&meleeLineClear(state.spacesByInstanceId[a.residency.spaceInstanceId].collision,a,{position:r.position});});if(r){const p=Object.values(state.playersById).find(p=>p.entityId===id);useEconomicResource(state,manifest,p,{groupId:r.groupId,episode:r.episode,ordinal:r.ordinal},progression.prepareResource);}}if(tome){const target=selectTomeTarget(a,query(a,400),state.spacesByInstanceId[a.residency.spaceInstanceId].collision,(source,target)=>canActivityTargetActor(state,manifest,source,target));if(target)family.proc(a,target);}}
    for(const [id,targetId] of phaseImpacts){const a=state.entitiesById[id],target=state.entitiesById[targetId],eligible=(source,candidate)=>canActivityTargetActor(state,manifest,source,candidate)&&meleeLineClear(state.spacesByInstanceId[source.residency.spaceInstanceId].collision,source,candidate);if(a?.alive&&target?.alive&&frostMovement(state,a)>0&&containment.targetStillValid(a,target,eligible)&&canActorAttack(a,target))damage(a,target,null,'main',null,{contactMelee:true});else if(a?.alive){a.attackTimer=0;a.nextAttackActionSequence++;}}
    for(const [id,targetId] of ready){const a=state.entitiesById[id],target=state.entitiesById[targetId];if(a.alive&&target.alive&&frostMovement(state,a)>0&&canActorAttack(a,target)){if(!startHostileMelee(a,target))damage(a,target,null,'main',null,{contactMelee:true});}}
    eliteCombat.resolveContactMelee();
    eliteCombat.advance();bossCombat.reconcile();family.enforceSuppression();
    for(const id of scheduler.inspect().activeGroups){const g=state.groupsById[id];if(!g.cleared&&g.entityIds.every(id=>!state.entitiesById[id].alive)){g.cleared=true;clearedGroups++;}}
    for(const d of manifest.siteInteriors??[]){const r=state.campaign.sitesById[d.siteId];if(r.conqueredTick===null&&d.groups.every(g=>state.groupsById[g.groupId].cleared))r.conqueredTick=state.tick;}
    for(const functional of Object.values(state.d9World?.functionalSitesById??{}))if(functional.conqueredTick===null&&functionalSiteGroupsD12(functional).every(id=>state.groupsById[id]?.cleared))functional.conqueredTick=state.tick;
    observeSiteRunEpisodesD13B(state);renewal.tick();startReady();pruneCommands();
    // A borrowed discovery view contains only overworld residents, never actor ownership.
    if(lastUpdated.some(id=>state.entitiesById[id].team==='party'&&state.entitiesById[id].movedLastTick)){
      const entitiesById=Object.fromEntries(Object.values(state.playersById).map(p=>state.entitiesById[p.entityId]).filter(a=>a.residency.spaceInstanceId===state.overworldInstanceId&&(!state.d9World||areaAtWorldPosition(originManifestForState(state),a.position))).map(a=>[a.entityId,a]));
      state.campaign.overworld.discovery=copyWire(discoverOverworldActors({...state,playersById:Object.fromEntries(Object.entries(state.playersById).filter(([,p])=>entitiesById[p.entityId])),space:{entitiesById}}));}
    if(state.d9World){const moved=Object.fromEntries(activeIds.filter(id=>state.entitiesById[id]?.movedLastTick).map(id=>[id,state.entitiesById[id]]));if(Object.keys(moved).length)assertActorGeometryD9(state,{actors:moved,mutation:'simulation movement/combat/separation',phase:'authority tick'});}
    captureWorldPositionsD9(state);version++;return state.tick;
  });}
  function relocate(entityId,spaceInstanceId,position,boundaryOrder=state.lastAppliedAuthorityOrder){const a=state.entitiesById[entityId],space=state.spacesByInstanceId[spaceInstanceId];
    requireContract(a?.team==='party'&&space&&!collidesWithTiles(space.collision,position.x,position.y,a.hullRadius),'Invalid participant relocation');
    requireContract(!state.primary.actorsById[entityId].current,'Finish primary work before relocation');
    if(state.siteExitProtectionByEntityId)delete state.siteExitProtectionByEntityId[entityId];
    cancelSubweaponResidency(state,entityId);eliteCombat.clearWebbed(entityId);eliteCombat.clearSlagBurn(entityId);bossCombat.clearStatus(entityId);
    const old=state.residencyHistoryByEntityId[entityId][a.residency.residencyRevision];Object.assign(old,{endTick:state.tick,endEventSequence:state.eventEmission.lastEventSequence,endAuthorityOrder:boundaryOrder});
    a.position=copyWire(position);a.movementIntent={x:0,y:0};a.movedLastTick=false;a.residency={spaceInstanceId,residencyRevision:safeInteger(a.residency.residencyRevision+1,1)};
    state.residencyHistoryByEntityId[entityId][a.residency.residencyRevision]={...actorContext(state,entityId),tick:state.tick,afterEventSequence:state.eventEmission.lastEventSequence,afterAuthorityOrder:boundaryOrder,endTick:null,endEventSequence:null,endAuthorityOrder:null};
    const p=state.primary.actorsById[entityId];p.heldCommandId=null;p.queuedCommandId=null;observeSiteRunEpisodesD13B(state);captureWorldPositionsD9(state);version++;schedule();refreshSpatial();}
  function relocateForFixture(entityId,spaceInstanceId,position){requireContract(state.proofCase!=='A','Synthetic placement is unavailable in normal play');relocate(entityId,spaceInstanceId,position);}
  function developerRelocateToWorld(playerId,position,facing){
    requireContract(developerCapabilities.siteNavigator===true,'Developer Site Navigator capability unavailable');
    const player=state.playersById[playerId],actor=state.entitiesById[player?.entityId],length=Math.hypot(facing?.x??0,facing?.y??0);
    requireContract(player?.connectionStatus==='connected'&&actor?.alive&&actor.residency.spaceInstanceId===state.overworldInstanceId,'Developer relocation requires a live overworld participant');
    requireContract(length>.0001&&Number.isFinite(position?.x)&&Number.isFinite(position?.y),'Invalid developer relocation target');
    relocate(actor.entityId,state.overworldInstanceId,position);
    state.primary.actorsById[actor.entityId].facing={x:facing.x/length,y:facing.y/length};version++;
    return freezeWire({status:'relocated',playerId,position:copyWire(position),facing:copyWire(state.primary.actorsById[actor.entityId].facing)});
  }
  const readState=()=>{if(!siteRunEpisodeObservationRequiredD13B(state))return createActivityState(state);const snapshot=copyWire(state);observeSiteRunEpisodesD13B(snapshot);return createActivityState(snapshot);};
  return Object.freeze({advanceOneTick,apply,relocateForFixture,developerRelocateToWorld,readState,getSnapshot:()=>({state:readState()}),
    refreshWorldResidency(){requireContract(state.d9World,'D9 runtime required');manifestForState(state);progression.refreshGroups();mastery.refreshGroups();evade.refreshHomes();navigation.refreshGroups();containment.refreshGroups();scheduler.refreshGroups();renewal=createEncounterRenewal(state,manifest,g=>scheduler.renewGroup(g));captureWorldPositionsD9(state);schedule();refreshSpatial();version++;},
    // Host-only capability; not exposed by the browser client port.
    withAuthorityState:fn=>fn(state),hasPlayer:playerId=>Object.hasOwn(state.playersById,playerId),version:()=>version,events:()=>events,
    captureForDurability:({saveRevision,checkpointId})=>{
      safeInteger(saveRevision,0);validateId('checkpointId',checkpointId);
      const snapshot={state:JSON.parse(JSON.stringify(state))};Object.assign(snapshot.state.campaign,{saveRevision,checkpointId});
      const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}};
      freeze(snapshot);return snapshot;
    },
    confirmDurability:({saveRevision,checkpointId})=>{safeInteger(saveRevision,state.campaign.saveRevision+1);validateId('checkpointId',checkpointId);Object.assign(state.campaign,{saveRevision,checkpointId});version++;},
    clearedGroupCount:()=>clearedGroups,
    resources:()=>{const simulated=new Set(),outside=[];for(const id of activeIds){const a=state.entitiesById[id];if(a.residency.spaceInstanceId!==state.overworldInstanceId){simulated.add(a.residency.spaceInstanceId);continue;}const area=areaAtWorldPosition(manifest,a.position);if(area)simulated.add(technicalChunkId(area));else outside.push(id);}return {...scheduler.inspect(),clearedGroups,simulatedChunks:simulated.size,simulatedActorsOutsideWorldFrame:outside.length,activeActors:activeIds.length,canonicalActors:Object.keys(state.entitiesById).length,
      dormantActors:Object.keys(state.entitiesById).length-activeIds.length,eventQueue:events.length,appliedReceipts:Object.keys(state.appliedCommandsById).length,
      spatial:spatial.stats(),progression:progression.inspect(),eliteCombat:eliteCombat.inspect(),bossCombat:bossCombat.inspect(),ordinaryEvade:evade.inspect(),encounterContainment:containment.inspect(),interiorNavigation:navigation.inspect(),assist:{...assist},separation:{...separation},movementBlocks:{...movementBlocks,last:movementBlocks.last?{...movementBlocks.last}:null},updatedIds:[...lastUpdated]};},nearby:(a,r)=>query(a,r)});
}
