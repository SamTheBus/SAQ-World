import { PROTOCOL_VERSION, SIMULATION_STATE_SCHEMA_VERSION, SIMULATION_TICKS_PER_SECOND, WORLD_COMBAT_CONTRACT_VERSION } from "./versions.js";
import { closedRecord, exactVersion, freezeWire, requireContract, safeInteger, validateWire, validateBigNumWire, canonicalStringify } from "./wire.js";
import {validateInteger} from './integer_domain.js';
import {validateCombatAmount,compareCombat} from './combat_amount.js';
import { boundedCombatInteger, combatIntegerWire, MAX_BOUNDED_COMBAT_INTEGER, validateBoundedCombatIntegerWire } from "./combat_integer.js";
import { validateCommand } from "./commands.js";
import { validateAttackAction } from "./combat.js";
import { validateId, validateIdMap, validateRevision } from "./identities.js";
import { validateStoredSeed } from "./seed.js";
import { validateRngState } from "./rng.js";
import { validateContentCatalog } from "../content/index.js";
import { validateHex } from "./hashing.js";
import { collidesWithTiles } from "../rules/world_geometry.js";
import { validateMultiplayerState, sessionForAuthorityOrder } from "./multiplayer.js";
import { validateHistory, validateRetainedCommands } from "./history.js";
import {CAVE_INTERIOR_NAVIGATION_D12_3A_VERSION} from '../content/interior_navigation_d12_3a.js';

import { validateEncounterProof } from "./encounter_proof.js";
import { validatePrimaryState, primaryProfile } from "./primary.js";
import { validateDiscovery, validateWorldGeography } from "./geography.js";
import { validateOverworldState } from "./overworld.js";

const nullableId = (kind, value) => { if (value !== null) validateId(kind, value); };
const own = (record, key) => Object.hasOwn(record, key);

export function validateCharacterState(value) {
  validateWire(value);
  closedRecord(value, ["characterId"]);
  validateId("characterId", value.characterId);
  return value;
}

export function validateCampaignState(value) {
  validateWire(value);
  closedRecord(value, ["campaignId", "saveRevision", "seed", "contentFingerprint", "charactersById", "checkpointId"], ["geography", "encounterProof", "overworld", "sitesById", "forgeStations", "siteRunEpisodesById", "siteFinaleReservationsById", "siteFinaleDeploymentsById"]);
  if(value.sitesById!==undefined){closedRecord(value.sitesById,[],Object.keys(value.sitesById));requireContract(Object.keys(value.sitesById).length===1,'Site state budget');
    for(const [id,r] of Object.entries(value.sitesById)){validateId('locationId',id);closedRecord(r,['spaceInstanceId','conqueredTick']);validateId('spaceInstanceId',r.spaceInstanceId);if(r.conqueredTick!==null)safeInteger(r.conqueredTick);}}
  if(value.siteRunEpisodesById!==undefined){closedRecord(value.siteRunEpisodesById,[],Object.keys(value.siteRunEpisodesById));requireContract(Object.keys(value.siteRunEpisodesById).length<=4096,'Site run episode budget');}
  if(value.siteFinaleReservationsById!==undefined){closedRecord(value.siteFinaleReservationsById,[],Object.keys(value.siteFinaleReservationsById));requireContract(Object.keys(value.siteFinaleReservationsById).length<=4096,'Site finale reservation budget');}
  if(value.siteFinaleDeploymentsById!==undefined){closedRecord(value.siteFinaleDeploymentsById,[],Object.keys(value.siteFinaleDeploymentsById));requireContract(Object.keys(value.siteFinaleDeploymentsById).length<=4096,'Site finale deployment budget');}
  if (Object.hasOwn(value, "geography")) validateDiscovery(value.geography);
  if (Object.hasOwn(value, "overworld")) {
    closedRecord(value.overworld, ["manifestDefinitionId", "manifestId", "manifestHash", "discovery"]);
    validateId("contentDefinitionId", value.overworld.manifestDefinitionId); validateHex(value.overworld.manifestHash, 32);
    requireContract(typeof value.overworld.manifestId === "string" && value.overworld.manifestId.length <= 128, "Invalid overworld manifest identity");
    const legacy=Object.hasOwn(value.overworld.discovery,"visitedAreaIds");
    closedRecord(value.overworld.discovery,legacy?["visitedAreaIds", "traversedRoadSegmentIds"]:
      ["discoveredRegionIds","discoveredSettlementIds","discoveredSiteIds","traversedCorridorSegmentIds"]);
    requireContract((legacy?[value.overworld.discovery.visitedAreaIds,value.overworld.discovery.traversedRoadSegmentIds]:
      [value.overworld.discovery.discoveredRegionIds,value.overworld.discovery.discoveredSettlementIds,
        value.overworld.discovery.discoveredSiteIds,value.overworld.discovery.traversedCorridorSegmentIds]).every(Array.isArray),
    "Invalid overworld discovery shape");
  }
  validateId("campaignId", value.campaignId);
  validateRevision("saveRevision", value.saveRevision);
  if (value.seed !== null) validateStoredSeed(value.seed);
  validateHex(value.contentFingerprint, 32);
  nullableId("checkpointId", value.checkpointId);
  validateIdMap("characterId", value.charactersById, (character, key) => {
    validateCharacterState(character);
    requireContract(character.characterId === key, "Character map identity mismatch");
  });
  requireContract(Object.keys(value.charactersById).length <= 16, "Character fixture limit");
  return value;
}

export function validateSessionState(value) {
  validateWire(value);
  closedRecord(value, ["sessionId", "campaignId", "playerIds"]);
  validateId("sessionId", value.sessionId);
  validateId("campaignId", value.campaignId);
  requireContract(Array.isArray(value.playerIds) && value.playerIds.length <= 4, "Party limit");
  value.playerIds.forEach((id, index) => {
    validateId("playerId", id);
    requireContract(index === 0 || value.playerIds[index - 1] < id, "Player IDs must be sorted and unique");
  });
  return value;
}

export function validatePlayerState(value) {
  validateWire(value);
  closedRecord(value, ["playerId", "characterId", "entityId", "connectionStatus"]);
  validateId("playerId", value.playerId);
  validateId("characterId", value.characterId);
  nullableId("entityId", value.entityId);
  requireContract(["connected", "disconnected"].includes(value.connectionStatus), "Invalid connection status");
  return value;
}

export function validateActiveSpaceRef(value) {
  validateWire(value);
  closedRecord(value, ["spaceId", "spaceInstanceId", "spaceRevision"]);
  validateId("spaceId", value.spaceId);
  validateId("spaceInstanceId", value.spaceInstanceId);
  validateRevision("spaceRevision", value.spaceRevision);
  return value;
}

function finiteBounded(value, minimum, maximum, message) {
  requireContract(typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum, message);
}

export function validateCollisionSpace(value) {
  validateWire(value);
  closedRecord(value, ["tileSize", "width", "height", "tiles"]);
  safeInteger(value.tileSize, 1, 256);
  safeInteger(value.width, 1, 128);
  safeInteger(value.height, 1, 128);
  requireContract(Array.isArray(value.tiles) && value.tiles.length === value.height, "Collision row count mismatch");
  for (const row of value.tiles) {
    requireContract(typeof row === "string" && row.length === value.width && /^[012]+$/.test(row), "Invalid collision tile row");
  }
  return value;
}

export function validateFractionalActor(value,integer=false){validateWire(value);validateId('entityId',value.entityId);validateId('contentDefinitionId',value.contentDefinitionId);nullableId('characterId',value.ownerCharacterId);requireContract(value.kind==='actor','Expected fractional actor');validateActorState(value,integer?2:true);return value;}
function validateActorState(value, fractional=false) {
  closedRecord(value, ["entityId", "contentDefinitionId", "kind", "ownerCharacterId", "hp", "maxHp", "team", "position",
    "hullRadius", "combatRadius", "movementIntent", "moveSpeed", "alive", "attackDamage", "attackReach", "attackReachMode",
    "attackDelayTicks", "attackTimer", "nextAttackActionSequence", "movedLastTick", "ai"]);
  requireContract(value.team === "party" || value.team === "hostile", "Invalid actor team");
  closedRecord(value.position, ["x", "y"]);
  finiteBounded(value.position.x, -1000000, 1000000, "Invalid actor position");
  finiteBounded(value.position.y, -1000000, 1000000, "Invalid actor position");
  finiteBounded(value.hullRadius, 0.25, 64, "Invalid actor hull");
  finiteBounded(value.combatRadius, 0.25, 64, "Invalid actor combat radius");
  closedRecord(value.movementIntent, ["x", "y"]);
  finiteBounded(value.movementIntent.x, -1, 1, "Invalid movement intent");
  finiteBounded(value.movementIntent.y, -1, 1, "Invalid movement intent");
  requireContract(Math.hypot(value.movementIntent.x, value.movementIntent.y) <= 1.000000000001, "Movement intent exceeds unit magnitude");
  finiteBounded(value.moveSpeed, 0, 16, "Invalid move speed");
  if(fractional){
    for(const k of ['hp','maxHp','attackDamage'])(fractional===2?validateInteger:validateCombatAmount)(value[k]);
    requireContract(compareCombat(value.maxHp,0)>0&&compareCombat(value.hp,value.maxHp)<=0&&compareCombat(value.attackDamage,0)>0,'Invalid fractional actor health/stats');
    requireContract(typeof value.alive==='boolean'&&value.alive===(compareCombat(value.hp,0)>0),'Actor liveness/HP mismatch');
  }else{
    const hp=boundedCombatInteger(value.hp),maxHp=boundedCombatInteger(value.maxHp);validateBoundedCombatIntegerWire(value.attackDamage,1);
    requireContract(maxHp>0&&hp<=maxHp,'Invalid actor health');requireContract(typeof value.alive==='boolean'&&value.alive===(hp>0),'Actor liveness/HP mismatch');
  }
  finiteBounded(value.attackReach, 0, 256, "Invalid attack reach");
  requireContract(value.attackReachMode === "center" || value.attackReachMode === "clearHullGap", "Invalid reach mode");
  safeInteger(value.attackDelayTicks, 4, 300);
  safeInteger(value.attackTimer, 0, value.attackDelayTicks);
  safeInteger(value.nextAttackActionSequence, 1);
  requireContract(typeof value.movedLastTick === "boolean", "Invalid actor movement state");
  if (value.ai === null) requireContract(value.team === "party", "Hostile actor requires AI state");
  else {
    closedRecord(value.ai, ["kind", "acquireRange", "updatesApplied"], ["melee", "motion", "defeatedTick", "interiorNavigation"]);
    requireContract(value.team === "hostile" && value.ai.kind === "simpleMelee", "Invalid actor AI");
    finiteBounded(value.ai.acquireRange, 1, 512, "Invalid AI acquire range");
    safeInteger(value.ai.updatesApplied);
    if(value.ai.melee){const m=value.ai.melee;closedRecord(m,["version","phase","phaseStartedTick","phaseEndsTick","targetEntityId","actionSequence"]);requireContract(m.version==='hostile-motion-d11.2-v1'&&['idle','windup','impact','recovery'].includes(m.phase),'Invalid hostile melee presentation state');safeInteger(m.phaseStartedTick);safeInteger(m.phaseEndsTick,m.phaseStartedTick);safeInteger(m.actionSequence);if(m.targetEntityId!==null)validateId('entityId',m.targetEntityId);requireContract((m.phase==='idle')===(m.targetEntityId===null),'Hostile melee target/phase mismatch');}
    if(value.ai.motion){const m=value.ai.motion;closedRecord(m,["version","startedTick","lastMovedTick"]);requireContract(m.version==='hostile-motion-d11.2-v1','Invalid hostile locomotion state');if(m.startedTick!==null)safeInteger(m.startedTick);if(m.lastMovedTick!==null){safeInteger(m.lastMovedTick);requireContract(m.startedTick!==null&&m.lastMovedTick>=m.startedTick,'Invalid hostile locomotion chronology');}}
    if(value.ai.interiorNavigation){const n=value.ai.interiorNavigation;closedRecord(n,["version","mode","targetEntityId","lastKnownPosition","lastSeenTick","memoryExpiresTick","replanAfterTick","blockedTicks"]);requireContract(n.version===CAVE_INTERIOR_NAVIGATION_D12_3A_VERSION&&['idle','pursuit','memory','returning','unreachable'].includes(n.mode),'Invalid Cave navigation state');if(n.targetEntityId!==null)validateId('entityId',n.targetEntityId);requireContract((n.lastKnownPosition===null)===(n.lastSeenTick===null)&&(n.lastSeenTick===null)===(n.memoryExpiresTick===null),'Incomplete Cave pursuit memory');if(n.lastKnownPosition){closedRecord(n.lastKnownPosition,['x','y']);finiteBounded(n.lastKnownPosition.x,-1000000,1000000,'Invalid Cave memory position');finiteBounded(n.lastKnownPosition.y,-1000000,1000000,'Invalid Cave memory position');safeInteger(n.lastSeenTick);safeInteger(n.memoryExpiresTick,n.lastSeenTick);}safeInteger(n.replanAfterTick);safeInteger(n.blockedTicks,0,600);requireContract(n.mode==='idle'||n.mode==='returning'||n.targetEntityId!==null,'Cave pursuit has no target');}
    if(value.ai.defeatedTick!==undefined)safeInteger(value.ai.defeatedTick);
  }
}

export function validateEntityState(value) {
  validateWire(value);
  if (value.kind === "diagnostic") closedRecord(value, ["entityId", "contentDefinitionId", "kind", "ownerCharacterId", "hp", "maxHp"]);
  else {
    requireContract(value.kind === "actor", "Unknown entity kind");
    validateActorState(value);
  }
  validateId("entityId", value.entityId);
  validateId("contentDefinitionId", value.contentDefinitionId);
  nullableId("characterId", value.ownerCharacterId);
  validateBigNumWire(value.hp);
  validateBigNumWire(value.maxHp);
  requireContract(value.hp.m >= 0 && value.maxHp.m > 0, "Invalid diagnostic health magnitude");
  requireContract(value.hp.m === 0 || value.hp.e < value.maxHp.e ||
    (value.hp.e === value.maxHp.e && value.hp.m <= value.maxHp.m), "HP exceeds max HP");
  return value;
}

export function validateSpaceState(value) {
  validateWire(value);
  closedRecord(value, ["spaceId", "spaceInstanceId", "spaceRevision", "contentDefinitionId", "entitiesById", "encounterId", "encounterAttemptId"], ["collision"]);
  validateActiveSpaceRef({ spaceId: value.spaceId, spaceInstanceId: value.spaceInstanceId, spaceRevision: value.spaceRevision });
  validateId("contentDefinitionId", value.contentDefinitionId);
  nullableId("encounterId", value.encounterId);
  nullableId("encounterAttemptId", value.encounterAttemptId);
  requireContract((value.encounterId === null) === (value.encounterAttemptId === null), "Incomplete encounter reference");
  validateIdMap("entityId", value.entitiesById, (entity, key) => {
    validateEntityState(entity);
    requireContract(entity.entityId === key, "Entity map identity mismatch");
  });
  requireContract(Object.keys(value.entitiesById).length <= 128, "Entity fixture limit");
  if (Object.hasOwn(value, "collision")) validateCollisionSpace(value.collision);
  return value;
}

function validateCombatState(combat, world) {
  validateWire(combat);
  closedRecord(combat, ["combatContractVersion", "appliedActionsById"]);
  exactVersion(combat.combatContractVersion, WORLD_COMBAT_CONTRACT_VERSION);
  const receipts = [];
  const eventIds = new Set();
  validateIdMap("attackActionId", combat.appliedActionsById, (receipt, key) => {
    closedRecord(receipt, ["attackActionId", "sourceEntityId", "targetEntityId", "sourceSequence", "tick",
      "eventSequenceStart", "eventSequenceEnd", "actionCanonical", "outcome"]);
    validateId("attackActionId", receipt.attackActionId);
    validateId("entityId", receipt.sourceEntityId);
    validateId("entityId", receipt.targetEntityId);
    requireContract(receipt.attackActionId === key, "Combat receipt identity mismatch");
    safeInteger(receipt.sourceSequence, 1);
    safeInteger(receipt.tick, 0, world.tick);
    safeInteger(receipt.eventSequenceStart, 1);
    safeInteger(receipt.eventSequenceEnd, receipt.eventSequenceStart);
    requireContract(typeof receipt.actionCanonical === "string", "Missing canonical attack action");
    closedRecord(receipt.outcome, ["damage", "resultingHp", "targetAlive"]);
    const damage = boundedCombatInteger(receipt.outcome.damage);
    const resultingHp = boundedCombatInteger(receipt.outcome.resultingHp);
    requireContract(damage > 0 && typeof receipt.outcome.targetAlive === "boolean" &&
      receipt.outcome.targetAlive === (resultingHp > 0), "Invalid frozen combat outcome");
    requireContract(canonicalStringify(combatIntegerWire(damage)) === canonicalStringify(receipt.outcome.damage) &&
      canonicalStringify(combatIntegerWire(resultingHp)) === canonicalStringify(receipt.outcome.resultingHp),
    "Combat receipt outcome must use canonical bounded integer wires");
    const action = JSON.parse(receipt.actionCanonical);
    validateAttackAction(action);
    requireContract(canonicalStringify(action) === receipt.actionCanonical && action.attackActionId === key &&
      action.sourceEntityId === receipt.sourceEntityId && action.targetEntityId === receipt.targetEntityId &&
      action.sourceSequence === receipt.sourceSequence, "Combat action/receipt mismatch");
    const ids = Object.values(action.eventIds);
    const emittedEventCount = receipt.outcome.targetAlive ? 2 : 3;
    requireContract(receipt.eventSequenceEnd === receipt.eventSequenceStart + emittedEventCount - 1, "Combat event range mismatch");
    for (const id of ids) { requireContract(!eventIds.has(id), "Combat event ID collision"); eventIds.add(id); }
    receipts.push({ receipt, action });
  });
  requireContract(receipts.length <= 64, "Applied combat action fixture limit");
  receipts.sort((a, b) => a.receipt.eventSequenceStart - b.receipt.eventSequenceStart);
  receipts.forEach(({ receipt }, index) => requireContract(index === 0 || receipt.eventSequenceStart > receipts[index - 1].receipt.eventSequenceEnd,
    "Combat event ranges overlap"));
  if (receipts.length > 0) requireContract(Object.hasOwn(world, "eventEmission"), "Combat receipts need authority event cursor");
  for (const { receipt } of receipts) requireContract(receipt.eventSequenceEnd <= world.eventEmission.lastEventSequence,
    "Combat event range exceeds authority cursor");
  return receipts;
}

function validateEventEmissionState(value) {
  validateWire(value);
  closedRecord(value, ["lastEventSequence"]);
  safeInteger(value.lastEventSequence);
  return value;
}

export function validateWorldState(value) {
  validateWire(value);
  closedRecord(value, ["protocolVersion", "simulationStateSchemaVersion", "ticksPerSecond", "tick", "content", "campaign", "session",
    "playersById", "activeSpaceRef", "space", "rngStatesByName", "appliedCommandsById", "lastAppliedAuthorityOrder"], ["combat", "eventEmission", "multiplayer", "history", "primary"]);
  exactVersion(value.protocolVersion, PROTOCOL_VERSION);
  exactVersion(value.simulationStateSchemaVersion, SIMULATION_STATE_SCHEMA_VERSION);
  exactVersion(value.ticksPerSecond, SIMULATION_TICKS_PER_SECOND);
  safeInteger(value.tick);
  safeInteger(value.lastAppliedAuthorityOrder);
  if (Object.hasOwn(value, "multiplayer")) validateMultiplayerState(value.multiplayer, value);
  if (Object.hasOwn(value, "history")) validateHistory(value);
  validateIdMap("playerId", value.playersById, (player, key) => {
    validatePlayerState(player);
    requireContract(player.playerId === key, "Player map identity mismatch");
  });
  requireContract(Object.keys(value.playersById).length <= 4, "Party limit");
  closedRecord(value.rngStatesByName, [], Object.keys(value.rngStatesByName));
  for (const [name, state] of Object.entries(value.rngStatesByName)) {
    requireContract(/^[a-z][a-z0-9._-]{0,63}$/.test(name), "Invalid named RNG state");
    validateRngState(state);
  }
  validateIdMap("commandId", value.appliedCommandsById, (receipt, key) => {
    closedRecord(receipt, ["commandId", "playerId", "clientSequence", "authorityOrder", "tick", "commandCanonical"], ["result"]);
    requireContract(receipt.commandId === key, "Applied command identity mismatch");
    validateId("playerId", receipt.playerId);
    safeInteger(receipt.clientSequence, 1);
    safeInteger(receipt.authorityOrder, 1);
    safeInteger(receipt.tick, 0, value.tick);
    requireContract(typeof receipt.commandCanonical === "string", "Missing applied command data");
    const command = JSON.parse(receipt.commandCanonical);
    validateCommand(command);
    requireContract(canonicalStringify(command) === receipt.commandCanonical && command.commandId === key &&
      command.playerId === receipt.playerId && command.clientSequence === receipt.clientSequence &&
      command.campaignId === value.campaign?.campaignId && command.sessionId === sessionForAuthorityOrder(value, receipt.authorityOrder),
    "Applied command data/reference mismatch");
    requireContract(own(value.playersById, receipt.playerId), "Applied command references missing player");
    if (command.kind !== "diagnostic.noop") {
      requireContract(value.multiplayer && receipt.result, "Gameplay receipt requires multiplayer result");
      const result = receipt.result;
      if (result.status === "applied") {
        if (["movement.setIntent", "space.travel", "combat.primaryIntent"].includes(command.kind)) {
          closedRecord(result, ["status", "entityId"]);
          requireContract(result.entityId === value.playersById[receipt.playerId].entityId, "Movement result owner mismatch");
        } else {
          closedRecord(result, ["status", "attackActionId"]);
          const actionReceipt = value.combat?.appliedActionsById[result.attackActionId];
          const action = actionReceipt && JSON.parse(actionReceipt.actionCanonical);
          requireContract(action?.causation?.commandId === command.commandId && actionReceipt.tick === receipt.tick,
            "Applied attack command needs its action receipt");
        }
      } else {
        closedRecord(result, ["status", "reason"]);
        requireContract(result.status === "rejected" && ["actorUnavailable", "attackUnavailable"].includes(result.reason),
          "Invalid gameplay rejection result");
      }
    } else requireContract(!own(receipt, "result"), "Diagnostic result extension forbidden");
  });
  const receipts = Object.values(value.appliedCommandsById).sort((a, b) => a.authorityOrder - b.authorityOrder);
  if (value.history) validateRetainedCommands(value);
  else {
  requireContract(receipts.length <= 64, "Applied command fixture limit");
  const clientSequences = Object.create(null);
  receipts.forEach((receipt, index) => {
    const sequenceKey = `${sessionForAuthorityOrder(value, receipt.authorityOrder)}/${receipt.playerId}`;
    requireContract(receipt.authorityOrder === index + 1, "Applied authority orders must be contiguous from one");
    requireContract(receipt.clientSequence === (clientSequences[sequenceKey] ?? 0) + 1, "Applied client sequences must be contiguous from one");
    clientSequences[sequenceKey] = receipt.clientSequence;
  });
  requireContract(value.lastAppliedAuthorityOrder === receipts.length, "Applied order/cursor mismatch");
  }
  if (Object.hasOwn(value, "eventEmission")) validateEventEmissionState(value.eventEmission);
  const combatReceipts = Object.hasOwn(value, "combat") ? validateCombatState(value.combat, value) : [];

  if (value.campaign === null) {
    requireContract(value.session === null && value.content === null && value.space === null && value.activeSpaceRef === null &&
      Object.keys(value.playersById).length === 0 && receipts.length === 0 && Object.keys(value.rngStatesByName).length === 0,
    "Unbound state cannot contain campaign-owned data");
    requireContract(!Object.hasOwn(value, "combat") && !Object.hasOwn(value, "eventEmission"), "Unbound state cannot contain authority event data");
    return value;
  }
  validateCampaignState(value.campaign);
  validateSessionState(value.session);
  validateContentCatalog(value.content);
  validateWorldGeography(value);
  validateOverworldState(value);
  requireContract(value.campaign.contentFingerprint === value.content.fingerprint, "Campaign/content fingerprint mismatch");
  requireContract(value.session.campaignId === value.campaign.campaignId, "Session/campaign mismatch");
  requireContract(JSON.stringify(value.session.playerIds) === JSON.stringify(Object.keys(value.playersById).sort()), "Session membership mismatch");
  requireContract((value.space === null) === (value.activeSpaceRef === null), "Incomplete active space");
  if (value.space !== null) {
    validateSpaceState(value.space);
    validateActiveSpaceRef(value.activeSpaceRef);
    for (const key of ["spaceId", "spaceInstanceId", "spaceRevision"]) {
      requireContract(value.activeSpaceRef[key] === value.space[key], "Active space reference mismatch");
    }
    requireContract(own(value.content.definitionsById, value.space.contentDefinitionId), "Unknown space definition");
    for (const entity of Object.values(value.space.entitiesById)) {
      requireContract(own(value.content.definitionsById, entity.contentDefinitionId), "Unknown entity definition");
      const definition = value.content.definitionsById[entity.contentDefinitionId];
      requireContract(entity.ownerCharacterId === null || own(value.campaign.charactersById, entity.ownerCharacterId), "Unknown entity owner");
      if (entity.kind === "actor") {
        requireContract(Object.hasOwn(value, "combat") && Object.hasOwn(value.space, "collision") && definition.kind === "actorProfile",
          "Actor requires combat, collision, and actor profile");
        for (const key of ["team", "moveSpeed", "hullRadius", "combatRadius", "attackReach", "attackReachMode", "attackDelayTicks"]) {
          requireContract(entity[key] === definition[key], "Actor/profile value mismatch");
        }
        requireContract(canonicalStringify(entity.maxHp) === canonicalStringify(definition.maxHp) &&
          canonicalStringify(entity.attackDamage) === canonicalStringify(definition.attackDamage), "Actor/profile combat value mismatch");
        requireContract((entity.ai?.kind ?? null) === definition.aiKind, "Actor/profile AI mismatch");
        requireContract(value.space.collision.tileSize === 32, "WORLD.1C collision tile size must remain 32 pixels");
        requireContract(entity.moveSpeed < value.space.collision.tileSize, "Actor movement may tunnel across a collision cell");
        requireContract(!collidesWithTiles(value.space.collision, entity.position.x, entity.position.y, entity.hullRadius),
          "Actor position overlaps blocked collision geometry");
      } else requireContract(definition.kind === "diagnostic", "Diagnostic entity requires diagnostic definition");
    }
  }
  const controlledCharacters = new Set();
  const controlledEntities = new Set();
  for (const player of Object.values(value.playersById)) {
    requireContract(own(value.campaign.charactersById, player.characterId), "Unknown player character");
    requireContract(!controlledCharacters.has(player.characterId), "Character has multiple controllers");
    controlledCharacters.add(player.characterId);
    if (player.entityId !== null) {
      requireContract(value.space !== null && own(value.space.entitiesById, player.entityId), "Unknown controlled entity");
      requireContract(!controlledEntities.has(player.entityId), "Entity has multiple controllers");
      controlledEntities.add(player.entityId);
      requireContract(value.space.entitiesById[player.entityId].ownerCharacterId === player.characterId, "Player/entity ownership mismatch");
    }
  }
  const sourceSequences = Object.create(null);
  const latestOutcomeByTarget = Object.create(null);
  const priorOutcomeByTarget = Object.create(null);
  const baseline = value.history?.combatBaseline;
  for (const [id, anchor] of Object.entries(baseline?.actorsById ?? {})) {
    sourceSequences[id] = anchor.lastSourceSequence;
    priorOutcomeByTarget[id] = { resultingHp: anchor.hp, targetAlive: anchor.alive };
    latestOutcomeByTarget[id] = priorOutcomeByTarget[id];
  }
  const primaryHitIds=new Set();
  let previousReceiptTick = baseline?.tick ?? 0;
  let previousActionId = baseline?.attackActionIdHighWatermark ?? null;
  let previousEventId = baseline?.eventIdHighWatermark ?? null;
  for (const { receipt, action } of combatReceipts.slice().sort((a, b) => a.receipt.eventSequenceStart - b.receipt.eventSequenceStart)) {
    const source = value.space?.entitiesById[receipt.sourceEntityId];
    const target = value.space?.entitiesById[receipt.targetEntityId];
    requireContract(source?.kind === "actor" && target?.kind === "actor", "Combat receipt references missing actor");
    if (baseline) {
      requireContract(receipt.eventSequenceStart > baseline.eventSequence, "Combat receipt precedes compacted event fence");
      requireContract(previousActionId === null || action.attackActionId > previousActionId, "Combat action identity fence violation");
      const ids = Object.values(action.eventIds);
      requireContract(previousEventId === null || ids.every((id) => id > previousEventId), "Combat event identity fence violation");
      previousActionId = action.attackActionId;
      previousEventId = ids.sort().at(-1);
    }
    if (action.primary) {
      const p=action.primary,owner=value.primary?.actorsById[receipt.sourceEntityId];
      requireContract(owner && p.sourceSequence<owner.nextSourceSequence && p.primaryActionId<=value.primary.actionIdHighWatermark &&
        !primaryHitIds.has(p.primaryActionId), "Primary damage identity/sequence collision");
      primaryHitIds.add(p.primaryActionId);
    }
    if (action.causation) {
      const applied = value.appliedCommandsById[action.causation.commandId];
      const command = applied && JSON.parse(applied.commandCanonical);
      const player = value.playersById[action.causation.playerId];
      const primary = action.primary;
      const linkage = primary ? value.primary && command?.kind === "combat.primaryIntent" && command.payload.pressed &&
        applied.tick <= primary.startedTick && applied.result?.entityId === source.entityId &&
        receipt.tick === primary.startedTick + primaryProfile(value,source.entityId).steps[primary.comboStep-1].startup :
        command?.kind === "combat.basicAttack" && applied.tick === receipt.tick && command.payload.targetEntityId === target.entityId &&
        applied.result?.attackActionId === action.attackActionId;
      requireContract(value.multiplayer && linkage && command.sessionId === action.causation.sessionId && command.playerId === action.causation.playerId &&
        command.spaceInstanceId === action.spaceInstanceId && command.spaceRevision === action.spaceRevision && player?.entityId === source.entityId &&
        player.characterId === action.causation.characterId && source.ownerCharacterId === player.characterId && applied.result?.status === "applied",
      "Combat command attribution/receipt mismatch");
    }
    requireContract(receipt.tick >= previousReceiptTick, "Combat event chronology runs backward relative to simulation tick");
    previousReceiptTick = receipt.tick;
    const next = (sourceSequences[receipt.sourceEntityId] ?? 0) + 1;
    requireContract(receipt.sourceSequence === next, "Combat source sequences must be contiguous");
    sourceSequences[receipt.sourceEntityId] = next;
    requireContract(action.spaceInstanceId === value.space.spaceInstanceId && action.spaceRevision <= value.space.spaceRevision,
      "Combat receipt space context mismatch");
    const damage = boundedCombatInteger(receipt.outcome.damage);
    const resultingHp = boundedCombatInteger(receipt.outcome.resultingHp);
    safeInteger(resultingHp + damage, 1, MAX_BOUNDED_COMBAT_INTEGER);
    const priorHp = resultingHp + damage;
    const precedingOutcome = priorOutcomeByTarget[receipt.targetEntityId];
    if (precedingOutcome) requireContract(priorHp === boundedCombatInteger(precedingOutcome.resultingHp),
      "Combat receipt target-health chain mismatch");
    else requireContract(priorHp <= boundedCombatInteger(target.maxHp), "Combat receipt exceeds target maximum health");
    requireContract(damage === Math.min(priorHp, boundedCombatInteger(source.attackDamage)),
      "Frozen combat outcome does not match direct damage rule");
    priorOutcomeByTarget[receipt.targetEntityId] = receipt.outcome;
    latestOutcomeByTarget[receipt.targetEntityId] = receipt.outcome;
  }
  for (const entity of Object.values(value.space?.entitiesById ?? {})) {
    if (entity.kind === "actor") requireContract(entity.nextAttackActionSequence === (sourceSequences[entity.entityId] ?? 0) + 1,
      "Actor combat action cursor mismatch");
  }
  for (const [entityId, outcome] of Object.entries(latestOutcomeByTarget)) {
    const target = value.space.entitiesById[entityId];
    requireContract(canonicalStringify(target.hp) === canonicalStringify(outcome.resultingHp) && target.alive === outcome.targetAlive,
      "Actor state does not match latest frozen combat outcome");
  }
  if (value.primary) validatePrimaryState(value);
  if (value.campaign?.encounterProof) validateEncounterProof(value);
  return value;
}

const construct = (validate, record) => { validate(record); return freezeWire(record); };
export const createCharacterState = (record) => construct(validateCharacterState, record);
export const createCampaignState = (record) => construct(validateCampaignState, record);
export const createSessionState = (record) => construct(validateSessionState, record);
export const createPlayerState = (record) => construct(validatePlayerState, record);
export const createActiveSpaceRef = (record) => construct(validateActiveSpaceRef, record);
export const createEntityState = (record) => construct(validateEntityState, record);
export const createSpaceState = (record) => construct(validateSpaceState, record);
export const createWorldState = (record) => construct(validateWorldState, record);

export function createEmptyWorldState() {
  return createWorldState({ protocolVersion: PROTOCOL_VERSION, simulationStateSchemaVersion: SIMULATION_STATE_SCHEMA_VERSION,
    ticksPerSecond: SIMULATION_TICKS_PER_SECOND, tick: 0, content: null, campaign: null, session: null,
    playersById: Object.create(null), activeSpaceRef: null, space: null, rngStatesByName: Object.create(null),
    appliedCommandsById: Object.create(null), lastAppliedAuthorityOrder: 0 });
}
