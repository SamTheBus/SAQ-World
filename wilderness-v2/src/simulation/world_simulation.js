import {
  assertCadenceCompatibility, createEmptyWorldState, createWorldState, copyWire,
  createSnapshot, freezeWire, requireContract, safeInteger, validateCommandForState, canonicalStringify,
  validateAttackAction, canonicalAttackAction, validateEventForState, createEvent,
  appliedClientSequence, recordAppliedCommandHistory,
} from "../shared/contracts/index.js";
import {
  advanceAttackTimer, approachIntent, canActorAttack, resolveBoundedDirectDamage,
  selectSimpleEnemyTarget, stepActorMovement,
} from "./combat_rules.js";
import { finalizeCheckpointProposal, validateCampaignEnvelope } from "../shared/contracts/checkpoint.js";

import { compactMidAttemptHistory, sweepAppliedCommandHistory } from "../shared/contracts/history.js";
import { clearPrimaryInput } from "../shared/contracts/primary.js";
import { discoverOverworldActors } from "../shared/contracts/overworld.js";
import { applyPrimaryIntent, advancePrimaryPhases, beginPrimary, readyPrimarySources, pendingPrimaryHits, selectPrimaryTarget,
  cancelDefeatedPrimaries, primaryMovementIntent } from "./primary_rules.js";

export function createWorldSimulation(initialState = createEmptyWorldState()) {
  assertCadenceCompatibility();
  let state = createWorldState(initialState);

  // Tick processing owns these copied branches. Large immutable campaign
  // content and collision data stay shared across published state versions.
  // External inputs, checkpoint proposals and restored snapshots still pass
  // through createWorldState and its complete validation/freeze boundary.
  function copyTickCandidate(source) {
    const campaign = { ...source.campaign };
    if (source.campaign.overworld) campaign.overworld = {
      ...source.campaign.overworld, discovery: copyWire(source.campaign.overworld.discovery),
    };
    return {
      ...source,
      campaign,
      space: { ...source.space, entitiesById: copyWire(source.space.entitiesById) },
      primary: source.primary ? copyWire(source.primary) : source.primary,
      eventEmission: source.eventEmission ? copyWire(source.eventEmission) : source.eventEmission,
      appliedCommandsById: copyWire(source.appliedCommandsById),
      history: source.history ? copyWire(source.history) : source.history,
      multiplayer: source.multiplayer ? copyWire(source.multiplayer) : source.multiplayer,
    };
  }

  function freezeOwned(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      for (const child of Object.values(value)) freezeOwned(child);
      Object.freeze(value);
    }
    return value;
  }

  function publishTickCandidate(next) {
    freezeOwned(next.campaign.overworld?.discovery);
    if (next.campaign.overworld) Object.freeze(next.campaign.overworld);
    Object.freeze(next.campaign);
    freezeOwned(next.space.entitiesById); Object.freeze(next.space);
    freezeOwned(next.primary); freezeOwned(next.eventEmission);
    freezeOwned(next.appliedCommandsById); freezeOwned(next.history); freezeOwned(next.multiplayer);
    return Object.freeze(next);
  }

  function getInspection() {
    return Object.freeze({
      tick: state.tick,
      ticksPerSecond: state.ticksPerSecond,
      playersById: freezeWire(state.playersById),
      entitiesById: freezeWire(state.space?.entitiesById ?? {}),
      activeSpace: state.activeSpaceRef === null ? null : freezeWire(state.activeSpaceRef),
      contentEntryCount: Object.keys(state.content?.definitionsById ?? {}).length,
    });
  }

  function hasCombatSpace() {
    return Boolean(state.campaign && state.session && state.space && state.activeSpaceRef && state.combat && state.space.collision);
  }

  function requireCombatSpace() {
    requireContract(hasCombatSpace(),
      "World combat space is not bound");
  }

  function setMovementIntent(entityId, intent) {
    requireCombatSpace();
    const actor = state.space.entitiesById[entityId];
    requireContract(actor?.kind === "actor", "Unknown movement actor");
    const probe = { ...copyWire(actor), movementIntent: copyWire(intent) };
    const next = copyWire(state);
    next.space.entitiesById[entityId] = probe;
    state = createWorldState(next);
    return freezeWire(state.space.entitiesById[entityId].movementIntent);
  }

  function applyCombatTickPhase(before, next) {
    const readyEnemyAttacks = [];
    for (const entityId of Object.keys(before.space.entitiesById).sort()) {
      const actor = before.space.entitiesById[entityId];
      if (actor.kind !== "actor" || !actor.alive) continue;
      const updated = copyWire(actor);
      updated.attackTimer = advanceAttackTimer(actor);
      updated.movedLastTick = false;
      if (actor.ai?.kind === "simpleMelee") {
        updated.ai.updatesApplied++;
        const target = selectSimpleEnemyTarget(actor, before.space.entitiesById);
        if (target) {
          const cadenceActor = { ...copyWire(actor), attackTimer: updated.attackTimer };
          if (canActorAttack(cadenceActor, target)) {
            readyEnemyAttacks.push({ sourceEntityId: actor.entityId, targetEntityId: target.entityId,
              sourceSequence: actor.nextAttackActionSequence, tick: next.tick });
          } else if (!canActorAttack({ ...copyWire(cadenceActor), attackTimer: actor.attackDelayTicks }, target)) {
            updated.movementIntent = approachIntent(actor, target);
            const movement = stepActorMovement(actor, before.space.collision, updated.movementIntent);
            updated.position = movement.position;
            updated.movedLastTick = movement.moved;
          } else updated.movedLastTick = false;
        } else updated.movedLastTick = false;
      } else {
        const movement = stepActorMovement(actor, before.space.collision, primaryMovementIntent(before,actor));
        updated.position = movement.position;
        updated.movedLastTick = movement.moved;
      }
      next.space.entitiesById[entityId] = updated;
    }
    return readyEnemyAttacks;
  }

  // This is the only operation that advances the authoritative clock. Combat
  // work is a phase of that same tick whenever a combat space is bound.
  function advanceOneTick() {
    if (state.tick === Number.MAX_SAFE_INTEGER) throw new RangeError("Simulation tick limit reached.");
    const before = state;
    const next = copyTickCandidate(state);
    next.tick++;
    const readyEnemyAttacks = hasCombatSpace() ? applyCombatTickPhase(before, next) : [];
    if (hasCombatSpace()) {
      const discovery = discoverOverworldActors(next);
      if (discovery) next.campaign.overworld.discovery = copyWire(discovery);
    }
    const events=advancePrimaryPhases(next);
    sweepAppliedCommandHistory(next);
    state = publishTickCandidate(next);
    return freezeWire({ ...getInspection(), readyEnemyAttacks, ...(state.primary?{events}: {}) });
  }

  function resolveDirectAttack(action, appliedCommand = null) {
    validateAttackAction(action);
    requireCombatSpace();
    const actionCanonical = canonicalAttackAction(action);
    const known = state.combat.appliedActionsById[action.attackActionId];
    if (known) {
      requireContract(known.actionCanonical === actionCanonical, "Attack action ID reused with different data");
      return freezeWire({ status: "alreadyApplied", receipt: known, events: [] });
    }
    requireContract(action.spaceInstanceId === state.activeSpaceRef.spaceInstanceId && action.spaceRevision === state.activeSpaceRef.spaceRevision,
      "Stale attack space context");
    const source = state.space.entitiesById[action.sourceEntityId];
    const target = state.space.entitiesById[action.targetEntityId];
    requireContract(source?.kind === "actor" && target?.kind === "actor", "Attack actor missing from active space");
    requireContract(action.sourceSequence === source.nextAttackActionSequence, "Stale attack source sequence");
    if(!state.primary)requireContract(Object.keys(state.combat.appliedActionsById).length < 64, "Applied combat action fixture limit");
    requireContract(Object.hasOwn(state, "eventEmission"), "Combat event emission requires authority cursor");
    const reservedEventIds = new Set(Object.values(state.combat.appliedActionsById).flatMap((receipt) =>
      Object.values(JSON.parse(receipt.actionCanonical).eventIds)));
    for (const eventId of Object.values(action.eventIds)) requireContract(!reservedEventIds.has(eventId), "Combat event ID already reserved");
    if (state.primary && source.team === "party") {
      const current=state.primary.actorsById[source.entityId]?.current;
      requireContract(current && action.primary?.primaryActionId===current.primaryActionId &&
        canonicalStringify(action.primary)===canonicalStringify({primaryActionId:current.primaryActionId,sourceSequence:current.sourceSequence,
          comboStep:current.comboStep,startedTick:current.startedTick,aim:current.aim}) &&
        action.causation?.commandId===current.commandId && selectPrimaryTarget(state,source.entityId)===target.entityId,
        "Damage requires this primary's legal unresolved forward hit phase");
    }
    const outcome = resolveBoundedDirectDamage(source, target);
    const defeated = !outcome.targetAlive;
    const eventCount = defeated ? 3 : 2;
    safeInteger(state.eventEmission.lastEventSequence, 0, Number.MAX_SAFE_INTEGER - eventCount);

    const next = copyWire(state);
    next.space.entitiesById[source.entityId].attackTimer = 0;
    next.space.entitiesById[source.entityId].nextAttackActionSequence++;
    next.space.entitiesById[target.entityId].hp = copyWire(outcome.resultingHp);
    next.space.entitiesById[target.entityId].alive = outcome.targetAlive;
    const eventSequenceStart = state.eventEmission.lastEventSequence + 1;
    const receipt = {
      attackActionId: action.attackActionId, sourceEntityId: source.entityId, targetEntityId: target.entityId,
      sourceSequence: action.sourceSequence, tick: state.tick, eventSequenceStart,
      eventSequenceEnd: eventSequenceStart + eventCount - 1, actionCanonical, outcome: copyWire(outcome),
    };
    if (action.primary) {
      const current=next.primary.actorsById[source.entityId].current;
      current.hitResolved=true;current.hitAttackActionId=action.attackActionId;
    }
    next.combat.appliedActionsById[action.attackActionId] = receipt;
    next.eventEmission.lastEventSequence = receipt.eventSequenceEnd;
    if (appliedCommand) {
      next.appliedCommandsById[appliedCommand.commandId] = copyWire(appliedCommand);
      next.lastAppliedAuthorityOrder = appliedCommand.authorityOrder;
      recordAppliedCommandHistory(next, appliedCommand);
    }
    cancelDefeatedPrimaries(next);
    compactMidAttemptHistory(next);
    state = createWorldState(next);

    const player = Object.values(state.playersById).find((candidate) => candidate.entityId === source.entityId) ?? null;
    const common = {
      protocolVersion: state.protocolVersion, campaignId: state.campaign.campaignId, sessionId: state.session.sessionId,
      tick: state.tick, causation: { commandId: action.causation?.commandId ?? null, playerId: player?.playerId ?? null },
      source: { playerId: player?.playerId ?? null, characterId: source.ownerCharacterId, entityId: source.entityId },
      subject: { entityId: target.entityId }, spaceInstanceId: action.spaceInstanceId, spaceRevision: action.spaceRevision,
    };
    const events = [createEvent({ ...common, eventId: action.eventIds.attackStartedEventId, eventSequence: eventSequenceStart,
      kind: "combat.attackStarted", payload: { attackActionId: action.attackActionId, sourceEntityId: source.entityId, targetEntityId: target.entityId } })];
    const outcomePayload = { attackActionId: action.attackActionId, sourceEntityId: source.entityId,
      sourceCharacterId: source.ownerCharacterId, targetEntityId: target.entityId, damage: outcome.damage,
      resultingHp: outcome.resultingHp, targetAlive: outcome.targetAlive };
    events.push(createEvent({ ...common, eventId: action.eventIds.damageAppliedEventId, eventSequence: eventSequenceStart + 1,
      kind: "combat.damageApplied", payload: outcomePayload }));
    if (defeated) events.push(createEvent({ ...common, eventId: action.eventIds.actorDefeatedEventId,
      eventSequence: eventSequenceStart + 2, kind: "combat.actorDefeated", payload: outcomePayload }));
    for (const event of events) validateEventForState(event, state);
    return freezeWire({ status: "applied", receipt, events });
  }

  // Diagnostic application records only; no actor/resource/gameplay mutation.
  function applyDiagnosticCommand(command, authorityOrder) {
    requireContract(command.kind === "diagnostic.noop", "Expected diagnostic command");
    validateCommandForState(command, state);
    safeInteger(authorityOrder, 1);
    requireContract(authorityOrder === state.lastAppliedAuthorityOrder + 1, "Applied authority order must be the next contiguous value");
    requireContract(!Object.hasOwn(state.appliedCommandsById, command.commandId), "Command already applied");
    requireContract(command.clientSequence === appliedClientSequence(state, command.playerId) + 1,
      "Applied client sequence must be the next contiguous value");
    const next = copyWire(state);
    next.appliedCommandsById[command.commandId] = { commandId: command.commandId, playerId: command.playerId,
      clientSequence: command.clientSequence, authorityOrder, tick: state.tick, commandCanonical: canonicalStringify(command) };
    next.lastAppliedAuthorityOrder = authorityOrder;
    recordAppliedCommandHistory(next, next.appliedCommandsById[command.commandId]);
    state = createWorldState(next);
    return freezeWire(state.appliedCommandsById[command.commandId]);
  }

  function applyGameplayCommand(command, authorityOrder, action = null) {
    validateCommandForState(command, state);
    requireContract(command.kind !== "diagnostic.noop", "Expected gameplay command");
    const known = state.appliedCommandsById[command.commandId];
    if (known) {
      requireContract(known.commandCanonical === canonicalStringify(command), "Applied command ID collision");
      return freezeWire({ status: "alreadyApplied", commandReceipt: known, events: [] });
    }
    safeInteger(authorityOrder, 1);
    requireContract(authorityOrder === state.lastAppliedAuthorityOrder + 1, "Applied authority order must be next contiguous value");
    requireContract(command.clientSequence === appliedClientSequence(state, command.playerId) + 1, "Applied client sequence must be next contiguous value");
    requireContract(state.history || Object.keys(state.appliedCommandsById).length < 64, "Applied command fixture limit");
    const player = state.playersById[command.playerId];
    const actor = state.space.entitiesById[player.entityId];
    const commandReceipt = { commandId: command.commandId, playerId: command.playerId, clientSequence: command.clientSequence,
      authorityOrder, tick: state.tick, commandCanonical: canonicalStringify(command) };
    if (command.kind === "combat.basicAttack" && canActorAttack(actor, state.space.entitiesById[command.payload.targetEntityId])) {
      validateAttackAction(action);
      requireContract(action.sourceEntityId === player.entityId && action.targetEntityId === command.payload.targetEntityId &&
        action.causation?.commandId === command.commandId && action.causation.playerId === player.playerId &&
        action.causation.characterId === player.characterId && action.causation.sessionId === command.sessionId,
      "Authority action must match admitted command ownership");
      commandReceipt.result = { status: "applied", attackActionId: action.attackActionId };
      const result = resolveDirectAttack(action, commandReceipt);
      return freezeWire({ status: "applied", commandReceipt: state.appliedCommandsById[command.commandId], events: result.events });
    }
    const next = copyWire(state);
    if (command.kind === "space.travel" && actor.alive) {
      // Consumption acknowledges intent, never successful geographic travel.
      for (const player of Object.values(next.playersById)) next.space.entitiesById[player.entityId].movementIntent = { x: 0, y: 0 };
      commandReceipt.result = { status: "applied", entityId: actor.entityId };
    } else if (command.kind === "combat.primaryIntent" && actor.alive) {
      applyPrimaryIntent(next,actor.entityId,command);
      commandReceipt.result = { status: "applied", entityId: actor.entityId };
    } else if (command.kind === "movement.setIntent" && actor.alive) {
      next.space.entitiesById[actor.entityId].movementIntent = copyWire(command.payload);
      const facing=next.primary?.actorsById[actor.entityId], length=Math.hypot(command.payload.x,command.payload.y);
      if(facing&&length>0)facing.facing={x:command.payload.x/length,y:command.payload.y/length};
      commandReceipt.result = { status: "applied", entityId: actor.entityId };
    } else commandReceipt.result = { status: "rejected", reason: actor.alive ? "attackUnavailable" : "actorUnavailable" };
    next.appliedCommandsById[command.commandId] = commandReceipt;
    next.lastAppliedAuthorityOrder = authorityOrder;
    recordAppliedCommandHistory(next, commandReceipt);
    state = createWorldState(next);
    return freezeWire({ status: commandReceipt.result.status, commandReceipt, events: [] });
  }

  function setControllerConnection(playerId, sessionId, connectionStatus) {
    requireContract(state.multiplayer && state.session.sessionId === sessionId, "Stale controller session");
    const next = copyWire(state);
    const player = next.playersById[playerId];
    requireContract(player && ["connected", "disconnected"].includes(connectionStatus), "Unknown controller/connection state");
    player.connectionStatus = connectionStatus;
    if (connectionStatus === "disconnected" && next.space?.entitiesById[player.entityId]?.kind === "actor") {
      next.space.entitiesById[player.entityId].movementIntent = { x: 0, y: 0 };
      clearPrimaryInput(next,player.entityId);sweepAppliedCommandHistory(next);
    }
    state = createWorldState(next);
    return freezeWire(player);
  }

  function beginReadyPrimary(entityId,ids) {
    const next=copyWire(state),event=beginPrimary(next,entityId,ids);
    sweepAppliedCommandHistory(next);state=createWorldState(next);validateEventForState(event,state);
    return freezeWire({events:[event]});
  }
  function resolvePrimaryMiss(entityId) {
    requireContract(selectPrimaryTarget(state,entityId)===null,"Eligible primary cannot be declared a whiff");
    const next=copyWire(state);next.primary.actorsById[entityId].current.hitResolved=true;
    state=createWorldState(next);return freezeWire({events:[]});
  }
  function clearAllPrimaryInput() {
    const next=copyWire(state);for(const id of Object.keys(next.primary?.actorsById??{}))clearPrimaryInput(next,id);
    sweepAppliedCommandHistory(next);state=createWorldState(next);
  }
  return Object.freeze({ getInspection, advanceOneTick, applyDiagnosticCommand, applyGameplayCommand, setControllerConnection,
    beginReadyPrimary,resolvePrimaryMiss,clearAllPrimaryInput,
    readyPrimarySources:()=>readyPrimarySources(state),pendingPrimaryHits:()=>pendingPrimaryHits(state),
    selectPrimaryTarget:(id)=>selectPrimaryTarget(state,id),
    setMovementIntent, resolveDirectAttack: (action) => resolveDirectAttack(action),
    finalizeCheckpoint: (confirmedEnvelope, request) => finalizeCheckpointProposal(state, confirmedEnvelope, request),
    installCommittedCheckpoint: (envelope) => {
      validateCampaignEnvelope(envelope);
      state = createWorldState(envelope.snapshot.state);
      return getInspection();
    },
    // This reference is for the in-process authority only. It is deeply frozen,
    // while readState remains the defensive external/diagnostic copy boundary.
    readAuthorityState: () => state,
    readState: () => freezeWire(state), getSnapshot: () => createSnapshot(state) });
}
