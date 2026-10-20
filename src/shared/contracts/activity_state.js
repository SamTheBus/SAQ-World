import {hasWorldCombat} from '../content/world_combat_v1.js';
import {equipmentLevelAllowed,equipmentRequiredLevel} from '../content/equipment.js';
import {serviceActionProblem} from './settlement_services_v1.js';
import {ferryTravelTarget} from './ferry_travel_v1.js';
import {FUNCTIONAL_CRYPT_FAMILY} from '../content/planned_crypt_policy_v1.js';
import {FUNCTIONAL_FORT_FAMILY} from '../content/planned_fort_policy_v1.js';
import {FUNCTIONAL_RUIN_FAMILY} from '../content/planned_ruin_policy_v1.js';
import {D9_RUNTIME_POLICY as B} from '../content/world_runtime_policy_d9.js';
import {withinRetainedSiteBudgetsD9} from '../content/alpha_population_retention_v1.js';
import {installMasteryCombat} from './mastery_combat.js';
import {validateD9Root} from './world_root_contract_d9.js';
import {historicalSiteContentD9,validateSiteSocketD9} from './site_content_d9.js';
import {validateFunctionalSiteStateD9,functionalSiteTransitionTargetD9,functionalSitesD10,migrateLegacyFunctionalSitesD10,functionalSiteGroupsD12,functionalSiteSpaceIdsD12,functionalSiteForSpaceD12} from './functional_site_d9.js';
import {applyOriginEgress} from './origin_egress_d9.js';
import {D9_COLLISION_VERSION} from './paged_collision_d9.js';
import {localFramePositionD9} from './local_world_frames_d9.js';
import {validateMasteryCausality} from './mastery_causality.js';
import {initialD8Progression,validateD8Progression} from './participant_progression.js';
import {prepareD8Command,validateD8Receipt} from './progression_commands.js';
import {compareCombat} from './combat_amount.js';
import {installSubweaponCombat,validateSubweaponCombat} from './subweapon_combat.js';
import {validateAttackTiming} from './attack_haste.js';
import {installD7,canSalvage} from './gear_salvage.js';
import {D6_ACTIVITY_FORMAT,canClaimSubweapon} from './subweapon_inventory.js';
import {combatInteger,asCombatAmount} from './combat_amount.js';
import {validateFractionalActor} from './state.js';
import {canShadowDash} from '../../simulation/subweapon_rules.js';
import {installD8EncounterDepth,installEncounterEconomy,validateEncounterEconomy,canUseResource} from './encounter_economy.js';
import {canDropGear,installAutoSalvageDeadlines} from './renewable_inventory.js';
import {installForgeStations,validateForgeStations} from './forge_stations.js';
import {migrateForgeInventory,canAttune} from './forge_economy.js';
import { validatePlayerInventory as validateLegacyInventory } from './player_inventory_d4_legacy.js';
import { LEGACY_D4_ACTIVITY_FORMAT, migratePresentationInventory, migrateD4Inventory, D4_ACTIVITY_FORMAT, initialInventory, validatePlayerInventory, equipmentActionAvailable, canPickUp } from './player_inventory.js';
import { validatePlayerRespawns } from './player_respawn.js';
import { D3_ACTIVITY_FORMAT, progressionAtXp, validatePlayerProgression } from './player_progression.js';
import { resolvePlayerStats } from './player_stats.js';
import { combatIntegerWire } from './combat_integer.js';
import { encounterActorProfile, validateEncounterProgression, ENCOUNTER_PROGRESSION_VERSION } from './encounter_progression.js';
import {validateCampaignTavern,tavernSpaceIds} from './campaign_tavern_v1.js';
import { validateSiteInteriors, validateSiteState, siteTransitionTarget, SITE_EXIT_PROTECTION_TICKS } from './site_interiors.js';
export { ordinaryEnemyForProfile } from '../content/ordinary_enemies.js';
export { populationRegionAt } from './ordinary_population.js';
import { validateOrdinaryPopulation } from '../contracts/ordinary_population.js';
import {validateOriginHordes} from './origin_hordes_v1.js';
import {validateOrdinaryRosterState} from './ordinary_roster_v1.js';
import {validateOrdinaryRosterV2State} from './ordinary_roster_v2.js';
import {validateOrdinaryCatalogV2} from './dungeon_mob_catalog_v2.js';
import {validateHostileProjectiles} from './hostile_projectiles_v1.js';
import { ORDINARY_ENEMIES, ORDINARY_PROFILES, ORDINARY_ACQUIRE_RANGE, ORDINARY_ACQUIRE_RANGES, ordinaryEnemyForProfile } from '../content/ordinary_enemies.js';
import { compileBoundOverworld } from '../content/overworld_fixture_catalog.js';
export { compileBoundOverworld } from '../content/overworld_fixture_catalog.js';
import { closedRecord, copyWire, freezeWire, requireContract, safeInteger, canonicalStringify, validateWire } from './wire.js';
import { validateCampaignState, validateSessionState, validatePlayerState, validateEntityState, validateCollisionSpace } from './state.js';
import { validateContentCatalog } from '../content/index.js';
import { validateId } from './identities.js';
import { validateCommand } from './commands.js';
import { primaryProfile, primaryPhaseAt, validatePrimaryAim, primaryRecords } from './primary.js';
import { validateOverworldCampaign, manifestForState,originManifestForState } from './overworld.js';
import { actorRules, actorContext } from './actor_residency.js';
import { collidesWithTiles } from '../rules/world_geometry.js';
import {assertActorGeometryD9} from './actor_geometry_d9.js';
import {CAVE_INTERIOR_NAVIGATION_D12_3A,interiorPursuitMemoryTicks} from '../content/interior_navigation_d12_3a.js';
import {validateEliteCombatD12_4} from './elite_combat_d12_4.js';
import {validateBossCombatD12_5A} from './boss_combat_d12_5.js';
import {validateAuthoritativeSiteDefinitionsD13A} from './site_definition_d13a.js';
import {installSiteRunEpisodesD13B,validateSiteRunEpisodesD13B} from './site_run_episode_d13b.js';
import {installSiteFinaleReservationsD13D_A,validateSiteFinaleReservationsD13D_A} from './site_finale_d13d.js';
import {installPersonalFinaleClaimsD13D_G1} from './site_finale_completion_d13d.js';
export { actorRules, actorContext };
export const ACTIVITY_FORMAT='saq-world-activity-1';
export function validateActivityCommand(command){validateWire(command);const {residencyRevision,...legacy}=command;safeInteger(residencyRevision,1);validateCommand(legacy);
  requireContract(['movement.setIntent','combat.primaryIntent','combat.guardIntent','combat.shadowDash','subweapon.claim','service.modify','service.material','service.buy','service.sell','service.rest','supply.use','ferry.travel','site.transition','player.respawn','loot.pickup','gear.salvage','gear.drop','resource.interact','progression.change','forge.attune','equipment.equip','equipment.unequip'].includes(command.kind),'Unsupported activity command');return command;}
export function activityContextMatches(state,c){const a=state.entitiesById[state.playersById[c.playerId]?.entityId];if(!a)return false;const context=actorContext(state,a.entityId);
  return ['spaceInstanceId','spaceRevision','residencyRevision'].every(k=>c[k]===context[k]);}
export function validateActivityCommandForState(c,s){validateActivityCommand(c);requireContract(c.campaignId===s.campaign.campaignId&&c.sessionId===s.session.sessionId,'Stale session/campaign');
  requireContract(s.playersById[c.playerId]?.connectionStatus==='connected'&&activityContextMatches(s,c),'Stale residency or disconnected controller');
  const actor=s.entitiesById[s.playersById[c.playerId].entityId];requireContract(c.kind==='player.respawn'?!actor.alive:actor.alive,c.kind==='player.respawn'?'Only a defeated participant can respawn':'Defeated participant cannot act');
  if(c.kind==='progression.change'){requireContract(c.expectedSaveRevision===s.campaign.saveRevision,'Stale save revision');const plan=prepareD8Command(s.playersById[c.playerId],c);requireContract(plan&&!plan.error,plan?.error??'Progression unavailable');}
  if(c.kind==='subweapon.claim')requireContract(canClaimSubweapon(s,s.playersById[c.playerId],c.payload),'Provision unavailable');
  if(c.kind==='combat.guardIntent'&&c.payload.pressed)requireContract(resolvePlayerStats(s.playersById[c.playerId]).subType==='shield','Guard requires Shield');
  if(c.kind==='combat.shadowDash')requireContract(s.subweaponCombat&&canShadowDash(actor,s.subweaponCombat.actors[actor.entityId],resolvePlayerStats(s.playersById[c.playerId])),'Dash unavailable');
  if(c.kind==='loot.pickup')requireContract(s.playersById[c.playerId].inventory?.revision===c.payload.inventoryRevision&&canPickUp(s,s.playersById[c.playerId],c.payload.sourceEntityId,resolvePlayerStats(s.playersById[c.playerId]).pickupRadius),'Loot unavailable: approach your drop');
  if(c.kind==='gear.salvage')requireContract(canSalvage(s,s.playersById[c.playerId],c.payload),'Salvage unavailable');
  if(c.kind==='gear.drop')requireContract(canDropGear(s,s.playersById[c.playerId],c.payload),'Drop unavailable: item must be carried, unequipped and unprotected');
  if(c.kind==='resource.interact')requireContract(canUseResource(s,manifestForState(s),s.playersById[c.playerId],c.payload),'Resource unavailable: approach it and finish your swing');
  if(c.kind==='forge.attune')requireContract(canAttune(s,s.playersById[c.playerId],c.payload,manifestForState(s)),'Forge unavailable: approach the Forge and check level and costs');
  if(c.kind==='equipment.equip'){const p=s.playersById[c.playerId],item=p.inventory?.itemsById[c.payload.itemId];requireContract(equipmentLevelAllowed(p,item),`Item requires hero level ${equipmentRequiredLevel(p,item)}`);}
  if(c.kind.startsWith('equipment.'))requireContract(equipmentActionAvailable(s,s.playersById[c.playerId],c.kind,c.payload),'Equipment unavailable: release Primary and finish the swing');
  if(c.kind.startsWith('service.')||c.kind==='supply.use')requireContract(serviceActionProblem(s,s.playersById[c.playerId],c.kind,c.payload)===null,serviceActionProblem(s,s.playersById[c.playerId],c.kind,c.payload)??'Service unavailable');
  if(c.kind==='ferry.travel')requireContract(ferryTravelTarget(s,actor,c.payload),'Ferry unavailable: approach the landing and prepare a safe arrival');
  if(c.kind==='site.transition'){const actor=s.entitiesById[s.playersById[c.playerId].entityId],target=/^site:/.test(c.payload.siteId)?functionalSiteTransitionTargetD9(s,actor,c.payload):siteTransitionTarget(s,manifestForState(s),actor,c.payload);requireContract(target,'Site entrance unavailable: approach it and finish the current swing');}return c;}
const same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
export function validateActivityState(s){
  validateWire(s);closedRecord(s,['format','protocolVersion','ticksPerSecond','tick','content','campaign','session','playersById','spacesByInstanceId','entitiesById','groupsById','primary','eventEmission','appliedCommandsById','appliedClientSequences','lastAppliedAuthorityOrder','identitySequence','overworldInstanceId','proofCase','residencyHistoryByEntityId','primaryContextsById'],['siteExitProtectionByEntityId','playerRespawnsById','encounterEconomy','subweaponCombat','d9World','eliteCombat','bossCombat','hostileCombat']);
  validateCampaignTavern(s);
  const d9=Boolean(s.d9World);if(d9)validateD9Root(s.d9World);
  const d6=s.format===D6_ACTIVITY_FORMAT,legacyD4=s.format===LEGACY_D4_ACTIVITY_FORMAT,d4=d6||s.format===D4_ACTIVITY_FORMAT||legacyD4,d3=d4||s.format===D3_ACTIVITY_FORMAT;
  requireContract((d3||s.format===ACTIVITY_FORMAT)&&s.protocolVersion===1&&s.ticksPerSecond===60,'Unsupported activity state');safeInteger(s.tick);safeInteger(s.identitySequence);safeInteger(s.lastAppliedAuthorityOrder);safeInteger(s.eventEmission.lastEventSequence);
  closedRecord(s.eventEmission,['lastEventSequence']);validateContentCatalog(s.content);validateCampaignState(s.campaign);validateSessionState(s.session);
  requireContract(s.campaign.contentFingerprint===s.content.fingerprint&&s.session.campaignId===s.campaign.campaignId,'Campaign/content mismatch');
  requireContract(same(s.session.playerIds,Object.keys(s.playersById).sort())&&s.session.playerIds.length>=1,'Party inventory mismatch');
  requireContract(['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'].includes(s.proofCase),'Unknown activity fixture');
  const manifest=manifestForState(s),origin=originManifestForState(s);requireContract(manifest?.manifestVersion===2,'Stored generated manifest required');validateOverworldCampaign(s.campaign.overworld,origin);
  if(d9){requireContract(same(s.d9World.content.historical,historicalSiteContentD9(origin,s.d9World.origin.manifestHash).historical),'Historical site content changed');for(const chunk of s.d9World.runtime.chunks)for(const site of chunk.sites??[])validateSiteSocketD9(site);}
  const spaces=Object.values(s.spacesByInstanceId),functionalSpaceCount=functionalSitesD10(s).reduce((n,site)=>n+functionalSiteSpaceIdsD12(site).length,0);requireContract(spaces.length>=1&&spaces.length<=2+(manifest.siteInteriors?.length??0)+functionalSpaceCount+tavernSpaceIds(s).length,'Instance bound');
  for(const [id,space] of Object.entries(s.spacesByInstanceId)){closedRecord(space,['spaceId','spaceInstanceId','spaceRevision','collision']);validateId('spaceId',space.spaceId);validateId('spaceInstanceId',id);requireContract(id===space.spaceInstanceId,'Instance key mismatch');safeInteger(space.spaceRevision,1);if(!d9||id!==s.overworldInstanceId)validateCollisionSpace(space.collision);}
  const overworld=s.spacesByInstanceId[s.overworldInstanceId],originCollision=compileBoundOverworld(s).collision;requireContract(overworld?.spaceId===origin.logicalSpaceId,'Overworld space binding mismatch');
  if(d9){const c=overworld.collision;closedRecord(c,['version','tileSize','width','height','origin','frames','pages']);requireContract(c.version===D9_COLLISION_VERSION&&c.tileSize===32&&c.width===20480&&c.height===3328,'D9 collision frame contract');requireContract(same(c.origin,applyOriginEgress(originCollision,s.d9World.origin.egress))&&same(c.frames,s.d9World.runtime.frames),'D9 origin/frame geometry mismatch');requireContract(c.pages.length===s.d9World.runtime.chunks.length,'D9 collision page count');for(let i=0;i<c.pages.length;i++){const page=s.d9World.runtime.chunks[i];requireContract(same(c.pages[i],{chunkX:page.chunkX,chunkY:page.chunkY,tiles:page.collision.tiles}),'D9 collision page drift');}for(const a of Object.values(s.entitiesById))if(a.residency.spaceInstanceId===s.overworldInstanceId)requireContract(same(s.d9World.positions[a.entityId],localFramePositionD9(a.position,c.frames)),'D9 canonical address drift');}
  else {requireContract(overworld.collision.width*manifest.tileSize===manifest.dimensions.width&&overworld.collision.height*manifest.tileSize===manifest.dimensions.height,'Overworld binding mismatch');requireContract(same(overworld.collision,originCollision),'Collision differs from generated manifest');}
  if(s.campaign.forgeStations)validateForgeStations(s.campaign.forgeStations,origin,originCollision);
  validateSiteInteriors(origin,originCollision);validateSiteState(s,manifest);validateEncounterEconomy(s,manifest);if(d9)validateFunctionalSiteStateD9(s);validateAuthoritativeSiteDefinitionsD13A(s);validateSiteRunEpisodesD13B(s);validateSiteFinaleReservationsD13D_A(s);
  if(manifest.population){
    validateOrdinaryPopulation(origin,originCollision);
    if(d9)validateOriginHordes(s,origin,originCollision);
    if(d9){validateOrdinaryRosterState(s);validateOrdinaryRosterV2State(s);}
    validateOrdinaryCatalogV2(s);
  requireContract(same(Object.keys(s.groupsById).sort(),[...manifest.population.groups,...(manifest.siteInteriors??[]).flatMap(d=>d.groups)].map(g=>g.groupId).concat(functionalSitesD10(s).filter(f=>f.siteKind!=='woodland-fort').flatMap(functionalSiteGroupsD12)).sort()),'Population inventory mismatch');
    for(const g of manifest.population.groups){const live=s.groupsById[g.groupId];requireContract((live.siteId!==null||live.regionId===g.regionId)&&live.spaceInstanceId===s.overworldInstanceId&&same(live.entityIds,g.members.map(a=>a.entityId)),'Population group drift');
      for(const member of g.members){const a=s.entitiesById[member.entityId];requireContract(a?.contentDefinitionId===member.profileId&&ORDINARY_ACQUIRE_RANGES.includes(a.ai?.acquireRange),'Generated actor definition drift');}}
  }
  const groupByEntity=new Map();for(const g of Object.values(s.groupsById)){if(d3)validateEncounterProgression(s,g);for(const id of g.entityIds)groupByEntity.set(id,g);}validateEliteCombatD12_4(s);validateBossCombatD12_5A(s);
  if(d9)assertActorGeometryD9(s,{mutation:'durability validation',phase:'validation'});
  const playerByEntity=new Map(Object.values(s.playersById).map(p=>[p.entityId,p]));
  const owned=new Set();for(const [id,p] of Object.entries(s.playersById)){if(d3){const {progression,inventory,d8,...identity}=p;if(d8){validateD8Progression(d8,progression.level);validateD8Receipt(s,p,validateActivityCommand);validateMasteryCausality(s,p);}validatePlayerState(identity);validatePlayerProgression(progression);if(d4)(legacyD4?validateLegacyInventory:validatePlayerInventory)(p,s,validateActivityCommand);else requireContract(inventory===undefined,'Inventory needs D4 format');}else validatePlayerState(p);const a=s.entitiesById[p.entityId];requireContract(id===p.playerId&&a?.ownerCharacterId===p.characterId&&a.team==='party'&&s.campaign.charactersById[p.characterId]&&!owned.has(p.entityId),'Canonical ownership mismatch');owned.add(p.entityId);safeInteger(s.appliedClientSequences[id]);}
  requireContract(same(Object.keys(s.appliedClientSequences).sort(),s.session.playerIds),'Applied cursor owners');
  requireContract(d9?withinRetainedSiteBudgetsD9(s):Object.keys(s.entitiesById).length<=64,'Bounded dormant actor inventory');
  for(const [id,a] of Object.entries(s.entitiesById)){(d6?validateFractionalActor:validateEntityState)(actorRules(a),s.subweaponCombat?.version==='subweapon-combat-integer-v2');closedRecord(a.residency,['spaceInstanceId','residencyRevision']);safeInteger(a.residency.residencyRevision,1);const space=s.spacesByInstanceId[a.residency.spaceInstanceId];
    if(a.ai?.defeatedTick!==undefined){safeInteger(a.ai.defeatedTick,0,s.tick);requireContract(!a.alive,'Living hostile retained defeat presentation');}
    if(a.ai?.interiorNavigation){const nav=a.ai.interiorNavigation,site=functionalSiteForSpaceD12(s,a.residency.spaceInstanceId);requireContract([CAVE_INTERIOR_NAVIGATION_D12_3A.floorFamilyVersion,FUNCTIONAL_FORT_FAMILY,FUNCTIONAL_RUIN_FAMILY,FUNCTIONAL_CRYPT_FAMILY].includes(site?.version),'Cave navigation escaped its generated interior');if(nav.lastSeenTick!==null){safeInteger(nav.lastSeenTick,0,s.tick);safeInteger(nav.memoryExpiresTick,nav.lastSeenTick,nav.lastSeenTick+interiorPursuitMemoryTicks(s));}safeInteger(nav.replanAfterTick,0,s.tick+CAVE_INTERIOR_NAVIGATION_D12_3A.unreachableRetryTicks);}
    requireContract(id===a.entityId&&space&&(!d9||!collidesWithTiles(space.collision,a.position.x,a.position.y,a.hullRadius)),'Invalid canonical actor geometry');
    let p=s.content.definitionsById[a.contentDefinitionId];requireContract(p?.kind==='actorProfile','Missing actor profile');
    if(d3&&a.team==='party'){const resolved=resolvePlayerStats(playerByEntity.get(id),{legacyMigration:s.subweaponCombat?.version!=='subweapon-combat-integer-v2'});p={...p,maxHp:d6?resolved.maxHp:combatIntegerWire(resolved.maxHp),attackDamage:d6?resolved.attack:combatIntegerWire(resolved.attack),moveSpeed:resolved.moveSpeed,...(hasWorldCombat(s)?{attackReach:32}:{})};}
    else if(d3&&groupByEntity.has(id))p=encounterActorProfile(s,groupByEntity.get(id),a);
    if(d6)p={...p,maxHp:(s.subweaponCombat?.version==='subweapon-combat-integer-v2'?combatInteger:asCombatAmount)(p.maxHp),attackDamage:(s.subweaponCombat?.version==='subweapon-combat-integer-v2'?combatInteger:asCombatAmount)(p.attackDamage)};
    for(const key of ['team','maxHp','hullRadius','combatRadius','moveSpeed','attackDamage','attackReach','attackReachMode','attackDelayTicks'])requireContract(same(a[key],p[key]),'Actor profile drift');
    if(a.team==='party')requireContract(owned.has(id),'Unowned party actor');else if(a.residency.spaceInstanceId===s.overworldInstanceId)requireContract(!manifest.safeRegions.some(r=>a.position.x+a.hullRadius>r.x&&a.position.x-a.hullRadius<r.x+r.width&&a.position.y+a.hullRadius>r.y&&a.position.y-a.hullRadius<r.y+r.height),'Hostile overlaps safe settlement');}
  requireContract(d9?withinRetainedSiteBudgetsD9(s):Object.keys(s.groupsById).length<=16,'Group inventory bound');const grouped=new Set();
  for(const [id,g] of Object.entries(s.groupsById)){closedRecord(g,['groupId','siteId','spaceInstanceId','entityIds','cleared','lastRequiredTick',...(manifest.population&&g.siteId===null?['regionId']:[]),...(d3?['threatSnapshot','threatReady']:[])],['containment']);if(g.lastRequiredTick!==null)safeInteger(g.lastRequiredTick,0,s.tick);const functional=functionalSitesD10(s).find(f=>functionalSiteGroupsD12(f).includes(id)),functionalFloor=functional?.floors?.find(f=>f.groupId===id),functionalSpace=functional?.siteKind==='woodland-fort'?s.overworldInstanceId:functionalFloor?.spaceInstanceId??functional?.spaceInstanceId;requireContract(id===g.groupId&&typeof id==='string'&&s.spacesByInstanceId[g.spaceInstanceId]&&(functional?functional.siteId===g.siteId&&g.spaceInstanceId===functionalSpace:manifest.population?(g.siteId===null?manifest.regions.some(r=>r.regionId===g.regionId):manifest.siteInteriors?.some(d=>d.siteId===g.siteId&&s.campaign.sitesById[d.siteId].spaceInstanceId===g.spaceInstanceId)):manifest.sites.some(site=>site.locationId===g.siteId)),'Group site/instance mismatch');
    if(g.containment){const c=g.containment;closedRecord(c,['version','homeAnchor','memberHomesById','acquireRadius','pursuitRadius','disengageTicks','homeTolerance','approachRadius','mode','outsideTicks','modeStartedTick']);requireContract(c.version==='encounter-containment-d11.2-v1'&&['guard','engaged','returning'].includes(c.mode),'Invalid encounter containment state');closedRecord(c.homeAnchor,['x','y']);requireContract(Number.isFinite(c.homeAnchor.x)&&Number.isFinite(c.homeAnchor.y),'Invalid encounter home anchor');closedRecord(c.memberHomesById,g.entityIds);for(const home of Object.values(c.memberHomesById)){closedRecord(home,['x','y']);requireContract(Number.isFinite(home.x)&&Number.isFinite(home.y),'Invalid encounter member home');}requireContract(Number.isFinite(c.acquireRadius)&&Number.isFinite(c.pursuitRadius)&&c.acquireRadius>0&&c.pursuitRadius>c.acquireRadius&&c.pursuitRadius<=1200,'Invalid encounter envelope');safeInteger(c.disengageTicks,1,600);requireContract(Number.isFinite(c.homeTolerance)&&c.homeTolerance>0&&c.homeTolerance<=32&&Number.isFinite(c.approachRadius)&&c.approachRadius>=8&&c.approachRadius<32,'Invalid encounter return/approach');safeInteger(c.outsideTicks,0,c.disengageTicks);safeInteger(c.modeStartedTick,0,s.tick);}
    requireContract(g.entityIds.length>=1&&g.entityIds.length<=(hasWorldCombat(s)?40:10)&&typeof g.cleared==='boolean','Group capacity');
    for(const id of g.entityIds){const a=s.entitiesById[id];requireContract(a?.team==='hostile'&&a.residency.spaceInstanceId===g.spaceInstanceId&&!grouped.has(id),'Group actor ownership mismatch');grouped.add(id);}
    requireContract(g.cleared===g.entityIds.every(id=>!s.entitiesById[id].alive),'Clear/liveness mismatch');}
  requireContract(Object.values(s.entitiesById).filter(a=>a.team==='hostile').every(a=>grouped.has(a.entityId)),'Ungrouped hostile');
  requireContract(same(Object.keys(s.residencyHistoryByEntityId).sort(),[...owned].sort()),'Residency history owners');
  for(const [id,history] of Object.entries(s.residencyHistoryByEntityId)){
    requireContract(Object.keys(history).length<=72,'Retained residency bound');const current=s.entitiesById[id].residency;
    for(const [key,c] of Object.entries(history)){closedRecord(c,['spaceInstanceId','spaceRevision','residencyRevision','tick','afterEventSequence','afterAuthorityOrder','endTick','endEventSequence','endAuthorityOrder']);
      safeInteger(c.residencyRevision,1,current.residencyRevision);requireContract(String(c.residencyRevision)===key&&s.spacesByInstanceId[c.spaceInstanceId]?.spaceRevision>=c.spaceRevision,'Invalid historical instance binding');
      safeInteger(c.tick,0,s.tick);safeInteger(c.afterEventSequence,0,s.eventEmission.lastEventSequence);safeInteger(c.afterAuthorityOrder,0,s.lastAppliedAuthorityOrder);
      if(c.residencyRevision===current.residencyRevision)requireContract(c.spaceInstanceId===current.spaceInstanceId&&c.endTick===null&&c.endEventSequence===null&&c.endAuthorityOrder===null,'Current residence mismatch');
      else {safeInteger(c.endTick,c.tick,s.tick);safeInteger(c.endEventSequence,c.afterEventSequence,s.eventEmission.lastEventSequence);safeInteger(c.endAuthorityOrder,c.afterAuthorityOrder,s.lastAppliedAuthorityOrder);}
    }requireContract(history[current.residencyRevision],'Missing current residence');
  }
  if(s.siteExitProtectionByEntityId!==undefined){
    closedRecord(s.siteExitProtectionByEntityId,[],[...owned]);
    for(const [id,untilTick] of Object.entries(s.siteExitProtectionByEntityId)){
      const a=s.entitiesById[id],residence=s.residencyHistoryByEntityId[id][a.residency.residencyRevision];
      safeInteger(untilTick,s.tick+1,s.tick+SITE_EXIT_PROTECTION_TICKS);
      requireContract((manifest.siteInteriors||functionalSitesD10(s).length)&&a.residency.spaceInstanceId===s.overworldInstanceId&&a.residency.residencyRevision>1&&untilTick===residence.tick+SITE_EXIT_PROTECTION_TICKS,'Invalid site exit protection');
    }
  }
  const primary=s.primary;closedRecord(primary,['contractVersion','actorsById','completedById','actionIdHighWatermark','eventIdHighWatermark']);requireContract(primary.contractVersion===1&&same(Object.keys(primary.actorsById).sort(),[...owned].sort())&&Object.keys(primary.completedById).length<=16,'Primary inventory');
  const records=primaryRecords(s),sequences={};for(const [id,a] of Object.entries(primary.actorsById)){closedRecord(a,['profileId','facing','heldCommandId','queuedCommandId','current','nextComboStep','comboDeadline','nextSourceSequence','retiredSourceSequence']);const p=primaryProfile(s,id);validatePrimaryAim(a.facing);safeInteger(a.nextComboStep,1,3);safeInteger(a.nextSourceSequence,1);safeInteger(a.retiredSourceSequence,0,a.nextSourceSequence-1);sequences[id]=a.retiredSourceSequence;
    if(a.comboDeadline!==null)safeInteger(a.comboDeadline,0,s.tick+p.continuationTicks);
    for(const cid of [a.heldCommandId,a.queuedCommandId])if(cid!==null){validateId('commandId',cid);requireContract(s.appliedCommandsById[cid]?.playerId===Object.values(s.playersById).find(p=>p.entityId===id).playerId,'Primary command owner');}}
  requireContract(same(Object.keys(s.primaryContextsById).sort(),records.map(r=>r.primaryActionId).sort()),'Primary context inventory');
  const eventSequences=new Set();let lastTick=-1;
  for(const r of records.sort((a,b)=>a.startEventSequence-b.startEventSequence)){closedRecord(r,['primaryActionId','sourceEntityId','sourceSequence','commandId','comboStep','aim','startedTick','phase','phaseStartedTick','phaseEndsTick','hitResolved','hitAttackActionId','startEventId','finishEventId','startEventSequence','finishEventSequence','completedTick','interrupted'],['timing']);if(r.timing)validateAttackTiming(r.timing,primaryProfile(s,r.sourceEntityId).steps[r.comboStep-1]);
    const context=s.primaryContextsById[r.primaryActionId],history=s.residencyHistoryByEntityId[r.sourceEntityId]?.[context.residencyRevision];closedRecord(context,['spaceInstanceId','spaceRevision','residencyRevision']);requireContract(history&&context.spaceInstanceId===history.spaceInstanceId&&context.spaceRevision===history.spaceRevision&&r.startedTick>=history.tick&&(history.endTick===null||r.completedTick!==null&&r.completedTick<=history.endTick)&&r.startEventSequence>history.afterEventSequence&&(history.endEventSequence===null||(r.finishEventSequence??r.startEventSequence)<=history.endEventSequence),'Primary outside historical residence');
    validateId('primaryActionId',r.primaryActionId);validateId('eventId',r.startEventId);validateId('eventId',r.finishEventId);validatePrimaryAim(r.aim);requireContract(owned.has(r.sourceEntityId)&&r.sourceSequence===++sequences[r.sourceEntityId],'Primary source sequence');safeInteger(r.comboStep,1,3);safeInteger(r.startedTick,0,s.tick);requireContract(r.startedTick>=lastTick,'Primary chronology');lastTick=r.startedTick;
    for(const seq of [r.startEventSequence,r.finishEventSequence].filter(n=>n!==null)){safeInteger(seq,1,s.eventEmission.lastEventSequence);requireContract(!eventSequences.has(seq),'Event collision');eventSequences.add(seq);}
    requireContract(typeof r.hitResolved==='boolean'&&typeof r.interrupted==='boolean'&&r.hitAttackActionId===null,'Invalid primary hit state');
    const owner=primary.actorsById[r.sourceEntityId];if(r.completedTick===null){requireContract(owner.current?.primaryActionId===r.primaryActionId&&r.finishEventSequence===null,'Current primary ownership');const expected=primaryPhaseAt(r,primaryProfile(s,r.sourceEntityId),s.tick);requireContract(s.tick<expected.phaseEndsTick&&same(expected,{phase:r.phase,phaseStartedTick:r.phaseStartedTick,phaseEndsTick:r.phaseEndsTick}),'Primary timing drift');}
    else {safeInteger(r.completedTick,r.startedTick,s.tick);requireContract(primary.completedById[r.primaryActionId]===r&&r.phase==='complete'&&(r.interrupted?r.finishEventSequence===null:r.finishEventSequence>r.startEventSequence),'Completed primary state');}}
  for(const [id,a] of Object.entries(primary.actorsById))requireContract(sequences[id]===a.nextSourceSequence-1,'Primary sequence cursor');
  requireContract(Object.keys(s.appliedCommandsById).length<=48,'Applied receipt bound');const orders=new Set();
  for(const [id,r] of Object.entries(s.appliedCommandsById)){closedRecord(r,['commandId','commandCanonical','playerId','clientSequence','authorityOrder','tick','status']);const c=JSON.parse(r.commandCanonical);validateActivityCommand(c);requireContract(id===c.commandId&&id===r.commandId&&c.playerId===r.playerId&&c.clientSequence===r.clientSequence&&c.campaignId===s.campaign.campaignId&&c.sessionId===s.session.sessionId&&canonicalStringify(c)===r.commandCanonical,'Applied command evidence');safeInteger(r.authorityOrder,1,s.lastAppliedAuthorityOrder);safeInteger(r.clientSequence,1,s.appliedClientSequences[r.playerId]);safeInteger(r.tick,0,s.tick);requireContract(['applied','stale'].includes(r.status)&&!orders.has(r.authorityOrder),'Applied order/status');const history=s.residencyHistoryByEntityId[s.playersById[r.playerId]?.entityId]?.[c.residencyRevision];requireContract(history&&history.spaceInstanceId===c.spaceInstanceId&&history.spaceRevision===c.spaceRevision,'Applied command historical residency');if(r.status==='applied')requireContract(r.tick>=history.tick&&(history.endTick===null||r.tick<=history.endTick)&&r.authorityOrder>history.afterAuthorityOrder&&(history.endAuthorityOrder===null||r.authorityOrder<=history.endAuthorityOrder),'Command outside historical residence');orders.add(r.authorityOrder);}
  if(s.playerRespawnsById!==undefined)requireContract(d3,'Respawn receipts need D3 progression');
  validatePlayerRespawns(s,manifest);
  if(d6)validateSubweaponCombat(s);else requireContract(s.subweaponCombat===undefined,'D6 combat requires version');
  validateHostileProjectiles(s);
  return s;
}
export const createActivityState=s=>freezeWire(validateActivityState(s));
function normalizeOrdinaryAcquireRange(state){
  installForgeStations(state,manifestForState(state));installEncounterEconomy(state,manifestForState(state));
  for(const group of Object.values(state.groupsById))for(const id of group.entityIds){const actor=state.entitiesById[id];if(ordinaryEnemyForProfile(actor.contentDefinitionId))actor.ai.acquireRange=ORDINARY_ACQUIRE_RANGE;}
  return state;
}
// Validate the original before conversion. Never mutate a verified envelope/hash.
// D2 visited/damaged/dead groups retain their exact L1 combat state conservatively.
export function upgradeActivityState(input){if(input.d9World){const next=copyWire(input);migrateLegacyFunctionalSitesD10(next.d9World);installSiteRunEpisodesD13B(next,{inferHistory:true});installSiteFinaleReservationsD13D_A(next);installPersonalFinaleClaimsD13D_G1(next,{migration:true});return createActivityState(next);}if(input.format===D6_ACTIVITY_FORMAT)return createActivityState(installD8(reconcileD7Migration(installD7(installSubweaponCombat(copyWire(createActivityState(input)))))));return createActivityState(installD8(installD7(installSubweaponCombat(copyWire(upgradeLegacyActivityState(input))))));}
function upgradeLegacyActivityState(input){
  validateActivityState(input);
  if(input.format===D4_ACTIVITY_FORMAT){const next=copyWire(input);for(const p of Object.values(next.playersById))p.inventory=migrateForgeInventory({...p,inventory:migratePresentationInventory(p)});return createActivityState(normalizeOrdinaryAcquireRange(next));}
  if(input.format===LEGACY_D4_ACTIVITY_FORMAT){const next=copyWire(input);next.format=D4_ACTIVITY_FORMAT;for(const p of Object.values(next.playersById))p.inventory=migrateForgeInventory({...p,inventory:migratePresentationInventory({...p,inventory:migrateD4Inventory(p)})});return createActivityState(normalizeOrdinaryAcquireRange(next));}
  if(input.format===D3_ACTIVITY_FORMAT){const next=copyWire(input);next.format=D4_ACTIVITY_FORMAT;for(const p of Object.values(next.playersById))p.inventory=initialInventory(p);return createActivityState(normalizeOrdinaryAcquireRange(next));}
  const state=copyWire(input);state.format=D3_ACTIVITY_FORMAT;
  for(const p of Object.values(state.playersById))p.progression={...progressionAtXp(0)};
  for(const g of Object.values(state.groupsById)){
    const used=g.lastRequiredTick!==null||g.entityIds.some(id=>{const a=state.entitiesById[id];return !a.alive||!same(a.hp,a.maxHp);});
    g.threatSnapshot=used?{version:ENCOUNTER_PROGRESSION_VERSION,activatedTick:g.lastRequiredTick??state.tick,levelsByEntityId:Object.fromEntries(g.entityIds.map(id=>[id,1]))}:null;
    g.threatReady=!used;
  }
  state.format=D4_ACTIVITY_FORMAT;for(const p of Object.values(state.playersById))p.inventory=initialInventory(p);
  return createActivityState(normalizeOrdinaryAcquireRange(state));
}

function reconcileD7Migration(s){for(const p of Object.values(s.playersById)){const a=s.entitiesById[p.entityId],stats=resolvePlayerStats(p);a.maxHp=copyWire(stats.maxHp);a.attackDamage=copyWire(stats.attack);a.moveSpeed=stats.moveSpeed;if(compareCombat(a.hp,stats.maxHp)>0)a.hp=copyWire(stats.maxHp);const c=s.subweaponCombat.actors[p.entityId];if(compareCombat(c.barrier,stats.maxBarrier)>0)c.barrier=copyWire(stats.maxBarrier);}return s;}

function installD8(s){installD8EncounterDepth(s);installAutoSalvageDeadlines(s);installMasteryCombat(s);for(const p of Object.values(s.playersById)){p.d8??=initialD8Progression(p.progression.level);p.d8.causalXp??={};}return s;}
