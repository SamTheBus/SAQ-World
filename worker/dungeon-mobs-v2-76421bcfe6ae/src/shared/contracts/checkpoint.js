import { closedRecord, exactVersion, freezeWire, requireContract, safeInteger, validateWire, canonicalStringify, copyWire } from "./wire.js";
import { validateId } from "./identities.js";
import { createSnapshot, validateSnapshot } from "./snapshot.js";
import { eligibleEncounterParticipants, samePlayerMembership, withFreshAuthoritySession } from "./multiplayer.js";
import { compactSafeHistory, appliedClientSequence } from "./history.js";
import { prepareProofStart, prepareProofClear, validatePrimaryProgress } from "./encounter_proof.js";
import { prepareTravelState, validateSafeProgress } from "./travel.js";

export const CAMPAIGN_STORE_VERSION = 1;
export const TRANSACTION_VERSION = 1;
const kinds = ["campaignCreated", "encounterStart", "encounterOutcome", "authoritySessionStarted", "historyCompacted", "spaceTransition"];
export const isEncounterBaseline = (envelope) => Boolean(envelope?.encounter && envelope.encounter.outcome === null);

export function validateCampaignEnvelope(envelope) {
  validateWire(envelope);
  closedRecord(envelope, ["campaignStoreVersion", "campaignId", "saveRevision", "checkpointId", "kind", "encounter", "snapshot"], ["travel", "proof"]);
  exactVersion(envelope.campaignStoreVersion, CAMPAIGN_STORE_VERSION);
  validateId("campaignId", envelope.campaignId);
  validateId("checkpointId", envelope.checkpointId);
  safeInteger(envelope.saveRevision);
  requireContract(kinds.includes(envelope.kind), "Unknown checkpoint kind");
  validateSnapshot(envelope.snapshot);
  const state = envelope.snapshot.state;
  const authored = Boolean(state.campaign?.encounterProof && ["encounterStart","encounterOutcome"].includes(envelope.kind));
  requireContract(Object.hasOwn(envelope,"proof") === authored,"Unexpected authored proof evidence");
  if(authored) {
    closedRecord(envelope.proof,["sourceSnapshot"],envelope.kind==="encounterStart"?["hostileId"]:[]);
    validateSnapshot(envelope.proof.sourceSnapshot);
    const source=envelope.proof.sourceSnapshot.state;
    requireContract(source.campaign.saveRevision+1===envelope.saveRevision&&source.campaign.checkpointId!==envelope.checkpointId,"Proof source checkpoint mismatch");
    let expected;
    if(envelope.kind==="encounterStart") {
      expected=prepareProofStart(source,envelope.proof.hostileId);
      expected.space.encounterId=envelope.encounter.encounterId;
      expected.space.encounterAttemptId=envelope.encounter.encounterAttemptId;
      expected.multiplayer.encounterParticipants=eligibleEncounterParticipants(expected);
    } else {requireContract(envelope.encounter.outcome==="victory","Proof outcome must be authority victory");expected=prepareProofClear(source);}
    expected.campaign.saveRevision=envelope.saveRevision;expected.campaign.checkpointId=envelope.checkpointId;
    requireContract(canonicalStringify(expected)===canonicalStringify(state),"Authored checkpoint differs from prepared source");
  }
  requireContract(Object.hasOwn(envelope, "travel") === (envelope.kind === "spaceTransition"), "Unexpected travel evidence");
  if (envelope.kind === "spaceTransition") {
    closedRecord(envelope.travel, ["sourceSnapshot", "request"]);
    validateSnapshot(envelope.travel.sourceSnapshot);
    requireContract(envelope.travel.sourceSnapshot.state.campaign.saveRevision + 1 === envelope.saveRevision &&
      envelope.travel.sourceSnapshot.state.campaign.checkpointId !== envelope.checkpointId, "Travel source revision/checkpoint mismatch");
    const expected = prepareTravelState(envelope.travel.sourceSnapshot.state, envelope.travel.request);
    expected.campaign.saveRevision = envelope.saveRevision;
    expected.campaign.checkpointId = envelope.checkpointId;
    requireContract(canonicalStringify(expected) === canonicalStringify(state), "Travel destination differs from prepared source");
  }
  requireContract(state.campaign && state.session && state.content, "Checkpoint needs bound campaign/session/content");
  requireContract(state.campaign.campaignId === envelope.campaignId && state.campaign.saveRevision === envelope.saveRevision &&
    state.campaign.checkpointId === envelope.checkpointId, "Checkpoint/campaign identity or revision mismatch");
  if (envelope.kind === "campaignCreated") {
    requireContract(envelope.encounter === null && envelope.saveRevision === 0 && state.space?.encounterId == null,
      "Invalid fresh campaign checkpoint");
    if (state.multiplayer) requireContract(state.multiplayer.encounterParticipants === null, "New campaign has no historical participants");
  } else if (["authoritySessionStarted", "historyCompacted", "spaceTransition"].includes(envelope.kind) && envelope.encounter === null) {
    requireContract(state.multiplayer && state.space?.encounterId == null, "Invalid safe session checkpoint");
  } else {
    closedRecord(envelope.encounter, ["encounterId", "encounterAttemptId", "startCheckpointId", "outcome"]);
    for (const kind of ["encounterId", "encounterAttemptId"]) validateId(kind, envelope.encounter[kind]);
    validateId("checkpointId", envelope.encounter.startCheckpointId);
    requireContract(state.space && state.combat && state.space.collision, "Encounter checkpoint needs combat space");
    if (envelope.kind === "encounterStart" || (envelope.kind === "authoritySessionStarted" && isEncounterBaseline(envelope))) {
      requireContract(envelope.encounter.outcome === null &&
        (envelope.kind !== "encounterStart" || envelope.encounter.startCheckpointId === envelope.checkpointId) &&
        state.space.encounterId === envelope.encounter.encounterId &&
        state.space.encounterAttemptId === envelope.encounter.encounterAttemptId, "Encounter-start reference mismatch");
    } else {
      requireContract(["victory", "defeat"].includes(envelope.encounter.outcome) &&
        state.space.encounterId === null && state.space.encounterAttemptId === null, "Encounter-outcome reference mismatch");
    }
  }
  if (envelope.kind === "authoritySessionStarted") requireContract(state.multiplayer &&
    envelope.saveRevision > 0 && (state.history ? state.history.sessionGeneration > 0 : state.multiplayer.priorSessions.length > 0),
    "Session checkpoint needs explicit fencing history");
  if (envelope.kind === "historyCompacted") requireContract(state.history && state.space?.encounterId === null && !isEncounterBaseline(envelope),
    "Compaction checkpoint must be safe and versioned");
  if (state.multiplayer && envelope.encounter) {
    const roster = state.multiplayer.encounterParticipants;
    requireContract(roster?.encounterId === envelope.encounter.encounterId &&
      roster.encounterAttemptId === envelope.encounter.encounterAttemptId, "Checkpoint participant linkage mismatch");
  }
  return envelope;
}

export function serializeCampaignEnvelope(envelope) {
  validateCampaignEnvelope(envelope);
  return canonicalStringify(envelope);
}

export function parseCampaignEnvelope(text) {
  requireContract(typeof text === "string" && text.length <= 1000000, "Campaign envelope text limit/type");
  const envelope = JSON.parse(text);
  validateCampaignEnvelope(envelope);
  requireContract(serializeCampaignEnvelope(envelope) === text, "Campaign envelope must use canonical wire text");
  return freezeWire(envelope);
}

export function validateTransactionProposal(proposal) {
  validateWire(proposal);
  closedRecord(proposal, ["transactionVersion", "transactionId", "campaignId", "expectedSaveRevision", "kind", "envelope"]);
  exactVersion(proposal.transactionVersion, TRANSACTION_VERSION);
  validateId("transactionId", proposal.transactionId);
  validateId("campaignId", proposal.campaignId);
  validateCampaignEnvelope(proposal.envelope);
  requireContract(proposal.kind === proposal.envelope.kind && proposal.campaignId === proposal.envelope.campaignId, "Proposal checkpoint mismatch");
  if (proposal.expectedSaveRevision === null) requireContract(proposal.kind === "campaignCreated" && proposal.envelope.saveRevision === 0,
    "Only campaign creation has no expected revision");
  else {
    safeInteger(proposal.expectedSaveRevision, 0, Number.MAX_SAFE_INTEGER - 1);
    requireContract(proposal.kind !== "campaignCreated" && proposal.envelope.saveRevision === proposal.expectedSaveRevision + 1,
      "Transaction must advance save revision exactly once");
  }
  return proposal;
}

export function finalizeCheckpointProposal(state, confirmedEnvelope, request) {
  validateWire(request);
  closedRecord(request, ["transactionId", "checkpointId", "kind"], ["encounterId", "encounterAttemptId", "outcome", "sessionId", "travel", "hostileId"]);
  validateId("transactionId", request.transactionId);
  validateId("checkpointId", request.checkpointId);
  requireContract(kinds.includes(request.kind), "Unknown checkpoint request");
  if (confirmedEnvelope !== null) validateCampaignEnvelope(confirmedEnvelope);
  requireContract(Object.hasOwn(request,"hostileId") === Boolean(state.campaign?.encounterProof&&request.kind==="encounterStart"),"Unexpected authored hostile request");
  let next = copyWire(state);
  requireContract(next.campaign !== null, "Cannot checkpoint unbound simulation");
  const expectedSaveRevision = confirmedEnvelope?.saveRevision ?? null;
  requireContract(expectedSaveRevision === null || next.campaign.saveRevision === expectedSaveRevision, "Live revision differs from confirmed revision");
  let encounter = null;
  requireContract(Object.hasOwn(request, "travel") === (request.kind === "spaceTransition"), "Unexpected travel request");
  requireContract(request.kind === "authoritySessionStarted" || !Object.hasOwn(request, "sessionId"), "Unexpected session transition data");
  if (request.kind === "campaignCreated") {
    requireContract(confirmedEnvelope === null && next.campaign.saveRevision === 0 && next.campaign.checkpointId === null &&
      next.space?.encounterId == null, "Campaign creation needs fresh state");
    requireContract(!Object.hasOwn(request, "outcome") && !Object.hasOwn(request, "encounterId") &&
      !Object.hasOwn(request, "encounterAttemptId"), "Unexpected creation data");
  } else if (request.kind === "spaceTransition") {
    requireContract(confirmedEnvelope && !isEncounterBaseline(confirmedEnvelope), "Unresolved encounter cannot travel");
    for (const key of ["outcome", "encounterId", "encounterAttemptId"]) requireContract(!Object.hasOwn(request, key), "Unexpected travel encounter data");
    validateSafeProgress(confirmedEnvelope.snapshot.state, state);
    next = prepareTravelState(state, request.travel);
  } else if (request.kind === "historyCompacted") {
    requireContract(confirmedEnvelope && !isEncounterBaseline(confirmedEnvelope) &&
      canonicalStringify(state) === canonicalStringify(confirmedEnvelope.snapshot.state), "History compaction needs whole confirmed safe state");
    requireContract(!Object.hasOwn(request, "outcome") && !Object.hasOwn(request, "encounterId") && !Object.hasOwn(request, "encounterAttemptId"),
      "Unexpected compaction checkpoint data");
    next = compactSafeHistory(next);
    encounter = copyWire(confirmedEnvelope.encounter);
  } else if (request.kind === "authoritySessionStarted") {
    requireContract(confirmedEnvelope && canonicalStringify(state) === canonicalStringify(confirmedEnvelope.snapshot.state),
      "Fresh session requires whole confirmed restore, without provisional mutations");
    requireContract(state.multiplayer || !confirmedEnvelope.encounter || isEncounterBaseline(confirmedEnvelope),
      "Legacy completed encounter has no frozen start roster for migration");
    requireContract(!Object.hasOwn(request, "outcome") && !Object.hasOwn(request, "encounterId") &&
      !Object.hasOwn(request, "encounterAttemptId"), "Unexpected session checkpoint data");
    next = withFreshAuthoritySession(next, request.sessionId);
    encounter = copyWire(confirmedEnvelope.encounter);
  } else if (request.kind === "encounterStart") {
    requireContract(confirmedEnvelope !== null && !isEncounterBaseline(confirmedEnvelope) && next.space?.encounterId === null,
      "Encounter start needs a confirmed safe checkpoint");
    if (next.campaign.encounterProof) {
      validateSafeProgress(confirmedEnvelope.snapshot.state,state);
      next=prepareProofStart(state,request.hostileId);
      requireContract(request.encounterId===next.campaign.encounterProof.encounterId,"Wrong authored encounter");
    } else if (next.history) next = compactSafeHistory(next);
    validateId("encounterId", request.encounterId);
    validateId("encounterAttemptId", request.encounterAttemptId);
    requireContract(!Object.hasOwn(request, "outcome"), "Encounter start has no outcome");
    encounter = { encounterId: request.encounterId, encounterAttemptId: request.encounterAttemptId,
      startCheckpointId: request.checkpointId, outcome: null };
    next.space.encounterId = request.encounterId;
    next.space.encounterAttemptId = request.encounterAttemptId;
    if (next.multiplayer) next.multiplayer.encounterParticipants = eligibleEncounterParticipants(next);
  } else {
    requireContract(isEncounterBaseline(confirmedEnvelope), "Encounter outcome needs committed encounter baseline");
    requireContract(!Object.hasOwn(request, "encounterId") && !Object.hasOwn(request, "encounterAttemptId") &&
      ["victory", "defeat"].includes(request.outcome), "Invalid bounded encounter outcome");
    encounter = { ...copyWire(confirmedEnvelope.encounter), outcome: request.outcome };
    requireContract(next.space?.encounterId === encounter.encounterId && next.space.encounterAttemptId === encounter.encounterAttemptId,
      "Live encounter reference mismatch");
    if(next.campaign.encounterProof) {
      requireContract(request.outcome==="victory","Only authored victory may clear the proof");
      validatePrimaryProgress(confirmedEnvelope.snapshot.state,state);next=prepareProofClear(state);
    } else {next.space.encounterId = null;next.space.encounterAttemptId = null;}
  }
  const saveRevision = expectedSaveRevision === null ? 0 : safeInteger(expectedSaveRevision + 1);
  next.campaign.saveRevision = saveRevision;
  next.campaign.checkpointId = request.checkpointId;
  const envelope = { campaignStoreVersion: CAMPAIGN_STORE_VERSION, campaignId: next.campaign.campaignId, saveRevision,
    checkpointId: request.checkpointId, kind: request.kind, encounter, snapshot: createSnapshot(next) };
  if (request.kind === "spaceTransition") envelope.travel = { sourceSnapshot: createSnapshot(state), request: copyWire(request.travel) };
  if(state.campaign.encounterProof&&["encounterStart","encounterOutcome"].includes(request.kind))
    envelope.proof={sourceSnapshot:createSnapshot(state),...(request.kind==="encounterStart"?{hostileId:request.hostileId}:{})};
  const proposal = { transactionVersion: TRANSACTION_VERSION, transactionId: request.transactionId,
    campaignId: envelope.campaignId, expectedSaveRevision, kind: request.kind, envelope };
  validateTransactionProposal(proposal);
  if (confirmedEnvelope) validateCheckpointTransition(confirmedEnvelope, envelope);
  return freezeWire(proposal);
}

// This bounded transition contract changes checkpoint metadata only at start;
// outcome captures the whole live attempt, preserving stable party/space ownership.
export function validateCheckpointTransition(current, next) {
  validateCampaignEnvelope(current);
  validateCampaignEnvelope(next);
  requireContract(next.saveRevision === current.saveRevision + 1 && next.campaignId === current.campaignId &&
    next.checkpointId !== current.checkpointId, "Checkpoint transition revision/identity mismatch");
  const before = current.snapshot.state;
  const after = next.snapshot.state;
  if(next.proof) {
    requireContract(next.kind==="encounterStart"?!isEncounterBaseline(current):isEncounterBaseline(current),"Authored checkpoint phase mismatch");
    if(next.kind==="encounterStart")validateSafeProgress(before,next.proof.sourceSnapshot.state);
    else {
      validatePrimaryProgress(before,next.proof.sourceSnapshot.state);
      for(const key of ["encounterId","encounterAttemptId","startCheckpointId"])requireContract(current.encounter[key]===next.encounter[key],"Authored outcome attempt mismatch");
    }
    return next;
  }
  if (next.kind === "spaceTransition") {
    requireContract(!isEncounterBaseline(current) && next.encounter === null, "Travel requires safe checkpoints");
    validateSafeProgress(before, next.travel.sourceSnapshot.state);
    return next;
  }
  if (next.kind === "historyCompacted") {
    requireContract(!isEncounterBaseline(current), "Unresolved encounter cannot compact");
    const expected = compactSafeHistory(before);
    expected.campaign.saveRevision = next.saveRevision;
    expected.campaign.checkpointId = next.checkpointId;
    requireContract(canonicalStringify(expected) === canonicalStringify(after) &&
      canonicalStringify(current.encounter) === canonicalStringify(next.encounter), "Invalid safe history compaction");
    return next;
  }
  requireContract(Boolean(before.history) === Boolean(after.history), "History migration needs explicit compaction checkpoint");
  if (next.kind === "authoritySessionStarted") {
    const expected = withFreshAuthoritySession(before, after.session.sessionId);
    expected.campaign.saveRevision = next.saveRevision;
    expected.campaign.checkpointId = next.checkpointId;
    requireContract(canonicalStringify(expected) === canonicalStringify(after) &&
      canonicalStringify(current.encounter) === canonicalStringify(next.encounter), "Invalid fresh-session checkpoint transition");
    return next;
  }
  requireContract(Boolean(before.multiplayer) === Boolean(after.multiplayer), "Multiplayer extension changes need a session checkpoint");
  requireContract(before.multiplayer ? samePlayerMembership(before.playersById, after.playersById) :
    canonicalStringify(before.playersById) === canonicalStringify(after.playersById), "Checkpoint player membership changed");
  for (const [a, b] of [[before.session, after.session],
    [before.campaign.charactersById, after.campaign.charactersById], [before.activeSpaceRef, after.activeSpaceRef],
    [before.content, after.content], [before.campaign.seed, after.campaign.seed]]) {
    requireContract(canonicalStringify(a) === canonicalStringify(b), "Checkpoint changed stable campaign/party/space context");
  }
  if (next.kind === "encounterStart") {
    requireContract(!isEncounterBaseline(current), "An encounter is already durably active");
    const expected = before.history ? compactSafeHistory(before) : copyWire(before);
    expected.campaign.saveRevision = next.saveRevision;
    expected.campaign.checkpointId = next.checkpointId;
    expected.space.encounterId = next.encounter.encounterId;
    expected.space.encounterAttemptId = next.encounter.encounterAttemptId;
    if (expected.multiplayer) {
      expected.playersById = copyWire(after.playersById);
      // Trusted safe-phase connection control may only clear held movement.
      // Reconnect can leave a connected actor with cleared intent as well.
      for (const player of Object.values(expected.playersById)) {
        const intent = after.space.entitiesById[player.entityId]?.movementIntent;
        if (intent?.x === 0 && intent.y === 0) expected.space.entitiesById[player.entityId].movementIntent = { x: 0, y: 0 };
      }
      expected.multiplayer.encounterParticipants = eligibleEncounterParticipants(expected);
    }
    requireContract(canonicalStringify(expected) === canonicalStringify(after), "Encounter baseline must preserve complete confirmed state");
  } else {
    requireContract(next.kind === "encounterOutcome" && isEncounterBaseline(current), "Invalid checkpoint phase transition");
    if (before.multiplayer) requireContract(canonicalStringify(before.history ? before.multiplayer.encounterParticipants : before.multiplayer) ===
      canonicalStringify(after.history ? after.multiplayer.encounterParticipants : after.multiplayer),
      "Outcome changed frozen participants/session history");
    if (before.history) {
      requireContract(canonicalStringify(before.history.combatBaseline) === canonicalStringify(after.history.combatBaseline) &&
        before.history.sessionGeneration === after.history.sessionGeneration && before.history.sessionIdHighWatermark === after.history.sessionIdHighWatermark &&
        after.history.commandFloor.authorityOrder >= before.history.commandFloor.authorityOrder &&
        after.lastAppliedAuthorityOrder >= before.lastAppliedAuthorityOrder, "Outcome changed protected history anchors");
      for (const id of before.session.playerIds) requireContract(appliedClientSequence(after, id) >= appliedClientSequence(before, id),
        "Outcome client watermark went backward");
      for (const [id, summary] of Object.entries(before.history.sessionsById)) {
        const retained = after.history.sessionsById[id];
        if (retained) requireContract(id === before.session.sessionId ? retained.firstAuthorityOrder === summary.firstAuthorityOrder :
          canonicalStringify(retained) === canonicalStringify(summary), "Outcome changed established session summary");
      }
    }
    for (const field of ["encounterId", "encounterAttemptId", "startCheckpointId"]) {
      requireContract(current.encounter[field] === next.encounter[field], "Outcome is for another attempt");
    }
    requireContract(after.tick >= before.tick, "Outcome tick precedes encounter baseline");
    requireContract(canonicalStringify(before.space.collision) === canonicalStringify(after.space.collision), "Outcome collision changed");
    requireContract(after.space.contentDefinitionId === before.space.contentDefinitionId &&
      canonicalStringify(Object.keys(before.space.entitiesById).sort()) === canonicalStringify(Object.keys(after.space.entitiesById).sort()),
      "Outcome actor/space inventory changed");
    for (const [id, entity] of Object.entries(before.space.entitiesById)) {
      requireContract(after.space.entitiesById[id].ownerCharacterId === entity.ownerCharacterId &&
        after.space.entitiesById[id].contentDefinitionId === entity.contentDefinitionId, "Outcome actor ownership changed");
    }
    for (const [oldMap, newMap] of [[before.appliedCommandsById, after.appliedCommandsById],
      [before.combat.appliedActionsById, after.combat.appliedActionsById]]) {
      for (const [id, receipt] of Object.entries(oldMap)) {
        if (before.history && oldMap === before.appliedCommandsById && !newMap[id] &&
          receipt.authorityOrder <= after.history.commandFloor.authorityOrder && !receipt.result?.attackActionId) continue;
        requireContract(canonicalStringify(receipt) === canonicalStringify(newMap[id]), "Outcome discarded a confirmed receipt");
      }
    }
    requireContract((after.eventEmission?.lastEventSequence ?? 0) >= (before.eventEmission?.lastEventSequence ?? 0),
      "Outcome authority event cursor went backward");
  }
  return next;
}
