import { createWorldSimulation } from "../simulation/world_simulation.js";
import { isEncounterBaseline, parseCampaignEnvelope, serializeCampaignEnvelope } from "../shared/contracts/checkpoint.js";
import { canonicalStringify, closedRecord, safeInteger, freezeWire, requireContract, copyWire } from "../shared/contracts/wire.js";
import { appliedClientSequence, authorityIdentityHighWatermark } from "../shared/contracts/history.js";
import { validateSnapshot } from "../shared/contracts/snapshot.js";
import { validateSafeFixture } from "../shared/contracts/travel.js";
import { allocateIdentity, allocateFencedIdentity } from "./identity_allocation.js";
import { createGatewayState, admitDiagnosticCommand, validateGatewayForState, retireAppliedAdmissions } from "./diagnostic_gateway.js";
import { prepareTransaction, validateCommittedResult, verifyPersistedEnvelope,
  DurableIdentityConflictError, TransactionPayloadConflictError } from "../storage/campaign_store.js";

import { canActivateProof, proofDefeated, validatePrimaryProgress } from "../shared/contracts/encounter_proof.js";
import { canActorAttack } from "../simulation/combat_rules.js";

// Only this host touches the asynchronous CampaignStore port. It privately
// owns the simulation so every gameplay entry point shares the commit barrier.
export function createCampaignAuthority({ initialState, store, sha256, expectedContentFingerprint, nextToken,
  allowSafeTravel = false, prepareDestination = async () => {} }) {
  for (const name of ["commitTransaction", "loadCampaign", "lookupTransaction", "loadLatestCheckpoint"]) {
    requireContract(typeof store?.[name] === "function", "Incomplete CampaignStore port");
  }
  let simulation = createWorldSimulation(initialState);
  const options = { sha256, expectedContentFingerprint };
  let confirmed = null;
  let pending = null;
  let phase = "new";
  let controlBusy = false;
  let gateway = null;
  let transportEpoch = 0;
  let travelTask = null;
  let travelResult = null;
  let encounterTask = null, encounterResult = null;
  const currentState = () => simulation.readAuthorityState();
  let verifiedSafeCollision=null,verifiedSafeContent=null,verifiedSafeMembership=null;
  function validateCurrentSafeFixture() {
    const state=currentState(),membership=state.session.playerIds.map(id=>`${id}:${state.playersById[id]?.entityId}`).join("/");
    if(state.space.collision===verifiedSafeCollision&&state.space.contentDefinitionId===verifiedSafeContent&&membership===verifiedSafeMembership)return;
    validateSafeFixture(state);
    verifiedSafeCollision=state.space.collision;verifiedSafeContent=state.space.contentDefinitionId;verifiedSafeMembership=membership;
  }
  function progressEncounter() {
    if(!currentState().campaign?.encounterProof || !gameplaySessionReady || pending || controlBusy || !["safe","encounter"].includes(phase))return;
    const state=currentState();
    let request;
    if(phase==="safe"&&canActivateProof(state))request={kind:"encounterStart",encounterId:state.campaign.encounterProof.encounterId,
      encounterAttemptId:allocate("encounterAttemptId"),hostileId:allocate("entityId",Object.keys(state.space.entitiesById))};
    else if(phase==="encounter"&&proofDefeated(state)) {
      simulation.clearAllPrimaryInput();
      if(Object.values(currentState().primary.actorsById).some(a=>a.current))return;
      request={kind:"encounterOutcome",outcome:"victory"};
    }
    if(!request)return;
    encounterResult=freezeWire({status:"pending",kind:request.kind});
    encounterTask=commit({...request,transactionId:allocate("transactionId"),checkpointId:allocate("checkpointId")})
      .then(result=>{encounterResult=freezeWire({...result,kind:request.kind});return encounterResult;},
        error=>{encounterResult=freezeWire({status:"failed",kind:request.kind,reason:error.message});return encounterResult;});
  }
  let presentationEvents = [];
  function retainEvents(events) { presentationEvents = [...presentationEvents,...events].slice(-64); }
  function startReadyPrimaries() {
    const events=[];
    if(proofDefeated(currentState()))return events;
    for(const entityId of simulation.readyPrimarySources()) {
      const startEventId=allocate("eventId"),finishEventId=allocate("eventId",[startEventId]);
      events.push(...simulation.beginReadyPrimary(entityId,{primaryActionId:allocate("primaryActionId"),startEventId,finishEventId}).events);
    }
    return events;
  }
  let gameplaySessionReady = Boolean(initialState?.multiplayer && initialState.campaign.checkpointId === null);

  function phaseFor(envelope) { return isEncounterBaseline(envelope) ? "encounter" : envelope ? "safe" : "new"; }
  function assertControlAvailable() { requireContract(!controlBusy, "Authority control operation already pending"); }
  function assertGameplay() { requireContract(!controlBusy && phase === "encounter", "Gameplay blocked by checkpoint barrier"); }
  function assertCommandGameplay() {
    if (allowSafeTravel && phase === "safe" && !controlBusy) validateCurrentSafeFixture();
    else assertGameplay();
    requireContract(gameplaySessionReady, "Fresh authority-session fence required");
  }
  function resetTransport() {
    const state = currentState();
    gateway = state.multiplayer ? createGatewayState(state) : null;
    transportEpoch++;
  }
  function allocate(kind, existingIds = []) {
    const state = currentState();
    if (kind === "spaceInstanceId" && allowSafeTravel) return allocateFencedIdentity(kind,
      { nextToken, existingIds, highWatermark: state.activeSpaceRef.spaceInstanceId });
    if (state.history && ["sessionId", "attackActionId", "eventId", "primaryActionId"].includes(kind)) return allocateFencedIdentity(kind,
      { nextToken, existingIds, highWatermark: authorityIdentityHighWatermark(state, kind) });
    return allocateIdentity(kind, { nextToken, existingIds });
  }
  function allocateAttack(sourceEntityId, targetEntityId, command = null) {
    const state = currentState();
    const reserved = Object.values(state.combat.appliedActionsById).flatMap((receipt) => Object.values(JSON.parse(receipt.actionCanonical).eventIds));
    const eventIds = {};
    for (const key of ["attackStartedEventId", "damageAppliedEventId", "actorDefeatedEventId"]) {
      eventIds[key] = allocate("eventId", reserved);
      reserved.push(eventIds[key]);
    }
    const action = { attackActionId: allocate("attackActionId", Object.keys(state.combat.appliedActionsById)),
      sourceEntityId, targetEntityId, sourceSequence: state.space.entitiesById[sourceEntityId].nextAttackActionSequence,
      spaceInstanceId: state.activeSpaceRef.spaceInstanceId, spaceRevision: state.activeSpaceRef.spaceRevision, eventIds };
    if (command) action.causation = { commandId: command.commandId, playerId: command.playerId,
      characterId: state.playersById[command.playerId].characterId, sessionId: state.session.sessionId };
    return action;
  }
  function status() {
    return freezeWire({ phase, pendingTransactionId: pending?.proposal.transactionId ?? null,
      confirmedSaveRevision: confirmed?.saveRevision ?? null,
      confirmedCheckpointId: confirmed?.checkpointId ?? null });
  }
  async function checkedEnvelope(text, campaignId) {
    const envelope = parseCampaignEnvelope(text);
    requireContract(envelope.campaignId === campaignId, "Loaded campaign identity mismatch");
    return verifyPersistedEnvelope(envelope, options);
  }
  function install(envelope) {
    // Caller completed all asynchronous verification before this synchronous step.
    const oldSessionId = currentState().session?.sessionId;
    simulation.installCommittedCheckpoint(envelope);
    if (oldSessionId !== envelope.snapshot.state.session.sessionId) gameplaySessionReady = false;
    confirmed = envelope;
    presentationEvents = [];
    phase = phaseFor(envelope);
    resetTransport();
  }

  async function settle(result, prepared) {
    if (result?.status === "committed") {
      const committed = validateCommittedResult(prepared, result);
      await verifyPersistedEnvelope(committed.envelope, options);
      const latestText = await store.loadLatestCheckpoint(prepared.proposal.campaignId);
      requireContract(latestText !== null, "Committed campaign is missing");
      const latest = await checkedEnvelope(latestText, prepared.proposal.campaignId);
      requireContract(latest.saveRevision >= committed.envelope.saveRevision, "Store revision went backward");
      if (latest.saveRevision === committed.envelope.saveRevision) {
        requireContract(serializeCampaignEnvelope(latest) === serializeCampaignEnvelope(committed.envelope),
          "Store checkpoint disagrees with committed receipt");
      }
      install(latest);
      if (prepared.proposal.kind === "authoritySessionStarted" && latest.snapshot.state.session.sessionId ===
        prepared.proposal.envelope.snapshot.state.session.sessionId) gameplaySessionReady = true;
      pending = null;
      return freezeWire({ status: "committed", receipt: committed.receipt, installedSaveRevision: latest.saveRevision });
    }
    if (result?.status === "aborted" || result?.status === "conflict") {
      const checked = freezeWire(result);
      if (checked.status === "aborted") {
        closedRecord(checked, ["status", "reason"]);
        requireContract(typeof checked.reason === "string" && checked.reason.length > 0, "Abort reason required");
      } else {
        closedRecord(checked, ["status", "actualSaveRevision"]);
        if (checked.actualSaveRevision !== null) safeInteger(checked.actualSaveRevision);
      }
      if (pending?.rollbackState) {
        const rollback=copyWire(pending.rollbackState);
        if(prepared.proposal.envelope.proof)for(const actor of Object.values(rollback.space.entitiesById)){
          actor.movementIntent={x:0,y:0};actor.movedLastTick=false;
        }
        simulation = createWorldSimulation(rollback);
      }
      else if (confirmed) simulation.installCommittedCheckpoint(confirmed);
      resetTransport();
      pending = null;
      phase = checked.status === "conflict" || checked.reason === "transaction-payload-conflict" ||
        checked.reason.startsWith("durable-") ? "conflict" : phaseFor(confirmed);
      return checked;
    }
    phase = "unknown";
    return freezeWire({ status: "unknown", transactionId: prepared.proposal.transactionId });
  }

  async function commit(request) {
    assertControlAvailable();
    requireContract(!pending && !["unknown", "conflict"].includes(phase), "Resolve outstanding authority transaction first");
    const proposal = simulation.finalizeCheckpoint(confirmed, request);
    const priorPhase = phase;
    // Barrier is installed synchronously, before hashing or store calls.
    phase = "pending";
    controlBusy = true;
    pending = { proposal, prepared: null, rollbackState: request.kind === "spaceTransition" || proposal.envelope.proof ? currentState() : null };
    let dispatched = false;
    try {
      if (request.kind === "spaceTransition") await prepareDestination(proposal.envelope);
      const prepared = await prepareTransaction(proposal, options);
      pending.prepared = prepared;
      dispatched = true;
      return await settle(await store.commitTransaction(proposal), prepared);
    } catch (error) {
      if (dispatched && (error instanceof TransactionPayloadConflictError || error instanceof DurableIdentityConflictError)) {
        return settle({ status: "aborted", reason: error instanceof TransactionPayloadConflictError ?
          "transaction-payload-conflict" : `durable-${error.identityKind}-conflict` }, pending.prepared);
      }
      if (dispatched) {
        phase = "unknown";
        return freezeWire({ status: "unknown", transactionId: proposal.transactionId });
      }
      pending = null;
      phase = priorPhase;
      throw error;
    } finally { controlBusy = false; }
  }

  async function reconcile() {
    assertControlAvailable();
    requireContract(pending?.prepared && phase === "unknown", "No unknown transaction to reconcile");
    controlBusy = true;
    phase = "pending";
    try {
      const { prepared, proposal } = pending;
      const known = await store.lookupTransaction(proposal.campaignId, proposal.transactionId);
      if (known !== null) {
        if (known.proposalCanonical !== prepared.proposalCanonical) {
          // Prove the conflicting durable record before treating uncertainty as rejection.
          const original = await prepareTransaction(JSON.parse(known.proposalCanonical), options);
          requireContract(original.proposalCanonical === known.proposalCanonical &&
            original.proposal.campaignId === proposal.campaignId && original.proposal.transactionId === proposal.transactionId,
          "Mismatched transaction lookup record");
          validateCommittedResult(original, known.result);
          return await settle({ status: "aborted", reason: "transaction-payload-conflict" }, prepared);
        }
        return await settle(known.result, prepared);
      }
      // Absence is not an abort. Retry the exact proposal under the same ID;
      // the store serializes/deduplicates against a possibly delayed commit.
      const retried = await store.commitTransaction(proposal);
      // A retry's failure does not prove the disposition of an earlier request.
      // Retain the ID/barrier until a receipt or successful same-ID retry resolves it.
      return await settle(retried?.status === "committed" ? retried : { status: "unknown" }, prepared);
    } catch (error) {
      if (error instanceof TransactionPayloadConflictError || error instanceof DurableIdentityConflictError) {
        return settle({ status: "aborted", reason: error instanceof TransactionPayloadConflictError ?
          "transaction-payload-conflict" : `durable-${error.identityKind}-conflict` }, pending.prepared);
      }
      phase = "unknown";
      return freezeWire({ status: "unknown", transactionId: pending.proposal.transactionId });
    } finally { controlBusy = false; }
  }

  async function loadCampaign(campaignId) {
    assertControlAvailable();
    requireContract(pending === null, "Unknown transaction must reconcile before loading");
    const priorPhase = phase;
    phase = "loading";
    controlBusy = true;
    try {
      const text = await store.loadCampaign(campaignId);
      requireContract(text !== null, "Campaign not found");
      const envelope = await checkedEnvelope(text, campaignId);
      requireContract(confirmed === null || envelope.campaignId !== confirmed.campaignId ||
        envelope.saveRevision >= confirmed.saveRevision, "Loaded revision predates confirmed state");
      if (confirmed && envelope.campaignId === confirmed.campaignId && envelope.saveRevision === confirmed.saveRevision) {
        requireContract(serializeCampaignEnvelope(envelope) === serializeCampaignEnvelope(confirmed), "Same revision has another checkpoint");
      }
      install(envelope);
      gameplaySessionReady = false;
      return status();
    } catch (error) { phase = priorPhase; throw error; }
    finally { controlBusy = false; }
  }

  function exportConfirmed() {
    requireContract(confirmed !== null, "No confirmed campaign to export");
    return Object.freeze({ campaignText: serializeCampaignEnvelope(confirmed), unresolvedTransactionId: pending?.proposal.transactionId ?? null });
  }

  async function loadFreshCampaign(campaignId) {
    await loadCampaign(campaignId);
    const state = currentState();
    const sessionId = allocate("sessionId", [state.session.sessionId, ...(state.multiplayer?.priorSessions ?? []).map((prior) => prior.sessionId)]);
    return commit({ kind: "authoritySessionStarted", sessionId, transactionId: allocate("transactionId"), checkpointId: allocate("checkpointId") });
  }

  function controllerWatermark(playerId) {
    const state = currentState();
    requireContract(state.playersById[playerId], "Unknown controller membership");
    return freezeWire({ sessionId: state.session.sessionId, playerId,
      lastAppliedClientSequence: appliedClientSequence(state, playerId),
      lastAppliedAuthorityOrder: state.lastAppliedAuthorityOrder });
  }

  function createControllerPort(playerId) {
    requireContract(gameplaySessionReady && currentState().playersById[playerId]?.connectionStatus === "connected",
      "Controller must be connected to current authority session");
    const epoch = transportEpoch;
    return Object.freeze({ send: (command) => {
      assertCommandGameplay();
      requireContract(epoch === transportEpoch, "Stale controller transport; rebind using current watermark");
      requireContract(command.playerId === playerId, "Forged transport player ownership");
      requireContract(currentState().playersById[playerId].connectionStatus === "connected", "Disconnected controller");
      if (command.kind === "space.travel") {
        requireContract(allowSafeTravel, "Travel not enabled for this authority");
        validateCurrentSafeFixture();
      }
      if (phase === "safe") requireContract(["movement.setIntent", "space.travel"].includes(command.kind), "Safe client supports movement and travel only");
      const admitted = admitDiagnosticCommand(gateway, command, currentState());
      gateway = admitted.gateway;
      return freezeWire({ status: admitted.status, readyCount: admitted.ready.length,
        appliedReceipt: currentState().appliedCommandsById[command.commandId] ?? null });
    } });
  }

  function drainCommands() {
    assertCommandGameplay();
    const results = [];
    const pendingAdmissions = Object.values(gateway.admittedCommandsById).filter((entry) =>
      !currentState().appliedCommandsById[entry.command.commandId]).sort((a, b) => a.authorityOrder - b.authorityOrder);
    for (const { command, authorityOrder } of pendingAdmissions) {
      if (command.kind === "diagnostic.noop") results.push({ status: "applied", commandReceipt: simulation.applyDiagnosticCommand(command, authorityOrder), events: [] });
      else {
        const state = currentState();
        const action = command.kind === "combat.basicAttack" ? allocateAttack(state.playersById[command.playerId].entityId,
          command.payload.targetEntityId, command) : null;
        results.push(simulation.applyGameplayCommand(command, authorityOrder, action));
        if (command.kind === "space.travel") {
          const requestContext = freezeWire({ status: "pending", requestId: command.commandId, sessionId: command.sessionId,
            spaceInstanceId: command.spaceInstanceId, spaceRevision: command.spaceRevision });
          travelResult = requestContext;
          const finish = (result) => {
            const completed = freezeWire({ ...requestContext, ...result });
            if (travelResult === requestContext) travelResult = completed;
            return completed;
          };
          travelTask = commit({ kind: "spaceTransition", transactionId: allocate("transactionId"), checkpointId: allocate("checkpointId"),
            travel: { commandId: command.commandId, destinationInstanceId: allocate("spaceInstanceId", [state.space.spaceInstanceId]) } })
            .then(finish, (error) => finish({ status: "failed", reason: error.message }));
          break;
        }
      }
    }
    if (currentState().history) gateway = retireAppliedAdmissions(gateway, currentState());
    else validateGatewayForState(gateway, currentState());
    if (phase === "encounter") {
      const events=startReadyPrimaries();
      if(events.length)results.push({status:"primaryStarted",events});
    }
    retainEvents(results.flatMap(r=>r.events??[]));
    return freezeWire(results);
  }

  function controllerConnection(playerId, watermark, connected) {
    assertControlAvailable();
    requireContract(gameplaySessionReady && !pending && ["safe", "encounter"].includes(phase), "Controller control blocked by checkpoint barrier");
    requireContract(canonicalStringify(watermark) === canonicalStringify(controllerWatermark(playerId)), "Stale reconnect session/watermark");
    simulation.setControllerConnection(playerId, watermark.sessionId, connected ? "connected" : "disconnected");
    // Control fences discard unapplied transport work, never applied history.
    // All producers rebind/resubmit unacknowledged input from applied watermarks.
    resetTransport();
    return controllerWatermark(playerId);
  }

  function advanceCommandTick() {
    assertCommandGameplay();
    const tickResult = simulation.advanceOneTick();
    const events = [...(tickResult.events??[])];
    for(const id of simulation.pendingPrimaryHits()) {
      const targetId=simulation.selectPrimaryTarget(id);
      if(targetId===null)simulation.resolvePrimaryMiss(id);
      else {
        const state=currentState(),primary=state.primary.actorsById[id].current;
        const command=JSON.parse(state.appliedCommandsById[primary.commandId].commandCanonical);
        const action=allocateAttack(id,targetId,command);
        action.primary={primaryActionId:primary.primaryActionId,sourceSequence:primary.sourceSequence,
          comboStep:primary.comboStep,startedTick:primary.startedTick,aim:primary.aim};
        events.push(...simulation.resolveDirectAttack(action).events);
      }
    }
    for (const ready of tickResult.readyEnemyAttacks) {
      const current=currentState();
      if(canActorAttack(current.space.entitiesById[ready.sourceEntityId],current.space.entitiesById[ready.targetEntityId]))
        events.push(...simulation.resolveDirectAttack(allocateAttack(ready.sourceEntityId, ready.targetEntityId)).events);
    }
    if(phase==="encounter")events.push(...startReadyPrimaries());
    if(currentState().history)gateway=retireAppliedAdmissions(gateway,currentState());
    retainEvents(events);
    progressEncounter();
    return freezeWire({ tick: tickResult.tick, events });
  }

  function getExactSnapshotForTest() {
    assertControlAvailable();
    requireContract(confirmed && !pending && gameplaySessionReady && ["safe", "encounter"].includes(phase), "Exact snapshot requires stable authority");
    return Object.freeze({ snapshot: simulation.getSnapshot(), confirmedCampaignText: serializeCampaignEnvelope(confirmed), gateway });
  }
  async function restoreExactSnapshotForTest(data) {
    assertControlAvailable();
    requireContract(!confirmed && !pending, "Exact test restore requires an unused host");
    controlBusy = true;
    try {
      validateSnapshot(data.snapshot);
      const snapshot = freezeWire(data.snapshot);
      const restoredGateway = freezeWire(data.gateway);
      const envelope = await checkedEnvelope(data.confirmedCampaignText, snapshot.state.campaign.campaignId);
      requireContract(Boolean(snapshot.state.history) === Boolean(envelope.snapshot.state.history), "Exact restore history version mismatch");
      if (snapshot.state.primary) validatePrimaryProgress(envelope.snapshot.state,snapshot.state);
      else if (snapshot.state.history) requireContract(canonicalStringify(snapshot.state.history.combatBaseline) ===
        canonicalStringify(envelope.snapshot.state.history.combatBaseline) && snapshot.state.history.sessionGeneration ===
        envelope.snapshot.state.history.sessionGeneration && snapshot.state.history.sessionIdHighWatermark ===
        envelope.snapshot.state.history.sessionIdHighWatermark, "Exact restore changed protected history anchors");
      requireContract(canonicalStringify(snapshot.state.campaign) === canonicalStringify(envelope.snapshot.state.campaign) &&
        canonicalStringify(snapshot.state.session) === canonicalStringify(envelope.snapshot.state.session) &&
        canonicalStringify(snapshot.state.history ? snapshot.state.multiplayer.encounterParticipants : snapshot.state.multiplayer) ===
        canonicalStringify(envelope.snapshot.state.history ? envelope.snapshot.state.multiplayer.encounterParticipants : envelope.snapshot.state.multiplayer),
      "Exact test restore campaign/session/participants mismatch");
      await verifyPersistedEnvelope({ ...envelope, snapshot }, options);
      validateGatewayForState(restoredGateway, snapshot.state);
      simulation = createWorldSimulation(snapshot.state);
      confirmed = envelope;
      gateway = restoredGateway;
      phase = phaseFor(envelope);
      gameplaySessionReady = true;
      transportEpoch++;
      return status();
    } finally { controlBusy = false; }
  }
  const clientView = Object.freeze({ getInspection: () => simulation.getInspection(), getPersistenceStatus: status });
  return Object.freeze({
    createCampaign: (request) => commit({ ...request, kind: "campaignCreated" }),
    compactHistory: (request) => commit({ ...request, kind: "historyCompacted" }),
    startEncounter: (request) => commit({ ...request, kind: "encounterStart" }),
    commitEncounterOutcome: (request) => commit({ ...request, kind: "encounterOutcome" }),
    reconcile, loadCampaign, loadFreshCampaign, exportConfirmed, getPersistenceStatus: status, clientView,
    createControllerPort, controllerWatermark, drainCommands, advanceCommandTick,
    awaitTravel: () => travelTask,
    awaitEncounter: () => encounterTask,
    getEncounterResult: () => encounterResult,
    getTravelResult: () => travelResult,
    disconnectController: (playerId, watermark) => controllerConnection(playerId, watermark, false),
    reconnectController: (playerId, watermark) => controllerConnection(playerId, watermark, true),
    getGatewayState: () => gateway === null ? null : freezeWire(gateway),
    getExactSnapshotForTest, restoreExactSnapshotForTest,
    readPresentationEvents: () => freezeWire(presentationEvents),
    // Read-only in-process projection source. The simulation publishes a
    // deeply frozen state and replaces it atomically after each operation.
    readClientState: currentState,
    readState: () => simulation.readState(),
    advanceOneTick: () => { assertGameplay(); return simulation.advanceOneTick(); },
    setMovementIntent: (entityId, intent) => { assertGameplay(); return simulation.setMovementIntent(entityId, intent); },
    resolveDirectAttack: (action) => { assertGameplay(); return simulation.resolveDirectAttack(action); },
    applyDiagnosticCommand: (command, order) => { assertGameplay(); return simulation.applyDiagnosticCommand(command, order); },
  });
}
