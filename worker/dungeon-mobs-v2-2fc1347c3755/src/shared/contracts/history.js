import { canonicalStringify, closedRecord, copyWire, requireContract, safeInteger } from "./wire.js";
import { validateId } from "./identities.js";
import { boundedCombatInteger, combatIntegerWire } from "./combat_integer.js";

import { primaryPinnedCommands, resetPrimary, COMPLETED_COMBAT_WINDOW } from "./primary.js";

export const HISTORY_VERSION = 1;
export const COMMAND_RETRY_WINDOW = 16;
export const ACTIVE_ACTION_CAPACITY = 64;
export const RETAINED_COMMAND_CAPACITY = COMMAND_RETRY_WINDOW + ACTIVE_ACTION_CAPACITY;
const zeros = (state) => Object.fromEntries(state.session.playerIds.map((id) => [id, 0]));
const equal = (a, b) => canonicalStringify(a) === canonicalStringify(b);
const actionRecords = (state) => Object.values(state.combat.appliedActionsById);
const maxId = (ids) => ids.filter(Boolean).sort().at(-1) ?? null;

export function appliedClientSequence(state, playerId) {
  if (state.history) return state.history.sessionsById[state.session.sessionId].clientSequencesByPlayer[playerId];
  return Object.values(state.appliedCommandsById).filter((r) => r.playerId === playerId &&
    JSON.parse(r.commandCanonical).sessionId === state.session.sessionId).length;
}

export function authorityIdentityHighWatermark(state, kind) {
  if (kind === "primaryActionId") return state.primary?.actionIdHighWatermark ?? null;
  if (kind === "sessionId") return state.history?.sessionIdHighWatermark ?? null;
  const baseline = state.history?.combatBaseline;
  if (kind === "attackActionId") return maxId([baseline?.attackActionIdHighWatermark, ...Object.keys(state.combat?.appliedActionsById ?? {})]);
  if (kind === "eventId") return maxId([baseline?.eventIdHighWatermark, state.primary?.eventIdHighWatermark,
    ...Object.values(state.combat?.appliedActionsById ?? {}).flatMap((r) => Object.values(JSON.parse(r.actionCanonical).eventIds))]);
  return null;
}

// Called only on an already validated prototype state, before a safe durable migration.
export function initializeHistory(state) {
  if (state.history) return copyWire(state);
  requireContract(state.multiplayer && state.combat && state.space && state.eventEmission, "History needs bound multiplayer combat state");
  const next = copyWire(state);
  const sessionsById = {};
  let preceding = 0;
  for (const session of [...state.multiplayer.priorSessions, { sessionId: state.session.sessionId, lastAuthorityOrder: state.lastAppliedAuthorityOrder }]) {
    sessionsById[session.sessionId] = { firstAuthorityOrder: preceding + 1, lastAuthorityOrder: session.lastAuthorityOrder,
      clientSequencesByPlayer: zeros(state) };
    preceding = session.lastAuthorityOrder;
  }
  for (const receipt of Object.values(state.appliedCommandsById)) {
    const session = sessionsById[JSON.parse(receipt.commandCanonical).sessionId];
    session.clientSequencesByPlayer[receipt.playerId] = Math.max(session.clientSequencesByPlayer[receipt.playerId], receipt.clientSequence);
  }
  const actorsById = {};
  for (const actor of Object.values(state.space.entitiesById).filter((a) => a.kind === "actor")) {
    const firstHit = actionRecords(state).filter((r) => r.targetEntityId === actor.entityId).sort((a,b) => a.eventSequenceStart-b.eventSequenceStart)[0];
    const hp = firstHit ? combatIntegerWire(boundedCombatInteger(firstHit.outcome.resultingHp) + boundedCombatInteger(firstHit.outcome.damage)) : copyWire(actor.hp);
    actorsById[actor.entityId] = { lastSourceSequence: 0, hp, alive: boundedCombatInteger(hp) > 0 };
  }
  next.history = { contractVersion: HISTORY_VERSION, sessionGeneration: state.multiplayer.priorSessions.length,
    sessionIdHighWatermark: maxId(Object.keys(sessionsById)), sessionsById,
    commandFloor: { authorityOrder: 0, sessionId: Object.keys(sessionsById)[0], clientSequencesByPlayer: zeros(state) },
    combatBaseline: { eventSequence: 0, tick: 0, attackActionIdHighWatermark: null, eventIdHighWatermark: null, actorsById } };
  return next;
}

export function pruneUnreferencedSessions(state) {
  const needed = new Set([state.session.sessionId, state.history.commandFloor.sessionId]);
  for (const receipt of Object.values(state.appliedCommandsById)) needed.add(JSON.parse(receipt.commandCanonical).sessionId);
  for (const id of Object.keys(state.history.sessionsById)) if (!needed.has(id)) delete state.history.sessionsById[id];
  state.multiplayer.priorSessions = state.multiplayer.priorSessions.filter((prior) => needed.has(prior.sessionId));
}

// Mutates a private candidate state, never a published snapshot. Combat-linked
// commands remain pinned even when their general retry interval has expired.
export function recordAppliedCommandHistory(state, receipt) {
  if (!state.history) return;
  const session = state.history.sessionsById[state.session.sessionId];
  session.lastAuthorityOrder = receipt.authorityOrder;
  session.clientSequencesByPlayer[receipt.playerId] = receipt.clientSequence;
  sweepAppliedCommandHistory(state);
}
export function sweepAppliedCommandHistory(state) {
  if (!state.history) return;
  const floor = state.history.commandFloor;
  const cut = Math.max(floor.authorityOrder, state.lastAppliedAuthorityOrder - COMMAND_RETRY_WINDOW);
  for (const prior of Object.values(state.appliedCommandsById).filter((r) =>
    r.authorityOrder > floor.authorityOrder && r.authorityOrder <= cut).sort((a,b) => a.authorityOrder-b.authorityOrder)) {
    const sid = JSON.parse(prior.commandCanonical).sessionId;
    if (floor.sessionId !== sid) { floor.sessionId = sid; floor.clientSequencesByPlayer = zeros(state); }
    floor.clientSequencesByPlayer[prior.playerId] = prior.clientSequence;
    floor.authorityOrder = prior.authorityOrder;
  }
  const pinned = new Set([...primaryPinnedCommands(state), ...actionRecords(state).map((r) => JSON.parse(r.actionCanonical).causation?.commandId).filter(Boolean)]);
  for (const prior of Object.values(state.appliedCommandsById)) {
    if (prior.authorityOrder <= floor.authorityOrder && !pinned.has(prior.commandId)) delete state.appliedCommandsById[prior.commandId];
  }
  pruneUnreferencedSessions(state);
}

export function compactSafeHistory(state) {
  requireContract(state.space?.encounterId === null, "Cannot compact unresolved encounter combat");
  const next = initializeHistory(state);
  resetPrimary(next);
  const actorsById = {};
  for (const actor of Object.values(next.space.entitiesById).filter((a) => a.kind === "actor")) {
    actorsById[actor.entityId] = { lastSourceSequence: actor.nextAttackActionSequence - 1, hp: copyWire(actor.hp), alive: actor.alive };
  }
  next.history.combatBaseline = { eventSequence: next.eventEmission.lastEventSequence, tick: next.tick, actorsById,
    attackActionIdHighWatermark: authorityIdentityHighWatermark(next, "attackActionId"),
    eventIdHighWatermark: authorityIdentityHighWatermark(next, "eventId") };
  next.history.commandFloor = { authorityOrder: next.lastAppliedAuthorityOrder, sessionId: next.session.sessionId,
    clientSequencesByPlayer: copyWire(next.history.sessionsById[next.session.sessionId].clientSequencesByPlayer) };
  next.appliedCommandsById = {};
  next.combat.appliedActionsById = {};
  pruneUnreferencedSessions(next);
  return next;
}

// A private, already-valid live candidate may retire a completed damage prefix.
// The separate durable encounter-start envelope is never touched. Manual input
// receipts acknowledge intent, so each damage receipt can leave the retry suffix.
export function compactMidAttemptHistory(next) {
  if (!next.primary || !next.history) return;
  const records = actionRecords(next).sort((a,b)=>a.eventSequenceStart-b.eventSequenceStart);
  const base = next.history.combatBaseline;
  for (const receipt of records.slice(0, Math.max(0, records.length-COMPLETED_COMBAT_WINDOW))) {
    const action=JSON.parse(receipt.actionCanonical);
    base.actorsById[receipt.sourceEntityId].lastSourceSequence=receipt.sourceSequence;
    base.actorsById[receipt.targetEntityId].hp=copyWire(receipt.outcome.resultingHp);
    base.actorsById[receipt.targetEntityId].alive=receipt.outcome.targetAlive;
    base.eventSequence=receipt.eventSequenceEnd;base.tick=receipt.tick;
    base.attackActionIdHighWatermark=action.attackActionId;base.eventIdHighWatermark=Object.values(action.eventIds).sort().at(-1);
    delete next.combat.appliedActionsById[receipt.attackActionId];
  }
  sweepAppliedCommandHistory(next);
}

export function addHistorySession(next, oldSessionId) {
  const h = next.history;
  requireContract(next.session.sessionId > h.sessionIdHighWatermark, "Fresh session must advance permanent identity fence");
  h.sessionIdHighWatermark = next.session.sessionId;
  h.sessionGeneration = safeInteger(h.sessionGeneration + 1);
  h.sessionsById[next.session.sessionId] = { firstAuthorityOrder: next.lastAppliedAuthorityOrder + 1,
    lastAuthorityOrder: next.lastAppliedAuthorityOrder, clientSequencesByPlayer: zeros(next) };
  requireContract(h.sessionsById[oldSessionId], "Missing former session summary");
  pruneUnreferencedSessions(next);
}

export function validateHistory(state) {
  const h = state.history;
  requireContract(state.multiplayer && state.combat && state.eventEmission && state.space, "History needs bound combat context");
  closedRecord(h, ["contractVersion", "commandFloor", "sessionsById", "sessionIdHighWatermark", "sessionGeneration", "combatBaseline"]);
  requireContract(h.contractVersion === HISTORY_VERSION, "Unsupported history version");
  validateId("sessionId", h.sessionIdHighWatermark);
  safeInteger(h.sessionGeneration);
  requireContract(Object.keys(h.sessionsById).length <= RETAINED_COMMAND_CAPACITY + 2, "Retained session reference capacity");
  const players = state.session.playerIds;
  const validateWatermarks = (map) => {
    requireContract(equal(Object.keys(map).sort(), players), "History watermark membership mismatch");
    for (const count of Object.values(map)) safeInteger(count);
  };
  const ranges = [];
  for (const [sid, summary] of Object.entries(h.sessionsById)) {
    validateId("sessionId", sid);
    requireContract(sid <= h.sessionIdHighWatermark, "Session exceeds permanent identity fence");
    closedRecord(summary, ["firstAuthorityOrder", "lastAuthorityOrder", "clientSequencesByPlayer"]);
    safeInteger(summary.firstAuthorityOrder, 1, state.lastAppliedAuthorityOrder + 1);
    safeInteger(summary.lastAuthorityOrder, summary.firstAuthorityOrder - 1, state.lastAppliedAuthorityOrder);
    validateWatermarks(summary.clientSequencesByPlayer);
    requireContract(Object.values(summary.clientSequencesByPlayer).reduce((a,b) => a+b,0) ===
      summary.lastAuthorityOrder-summary.firstAuthorityOrder+1, "Session command counts/order interval mismatch");
    if (summary.lastAuthorityOrder >= summary.firstAuthorityOrder) ranges.push(summary);
  }
  ranges.sort((a,b) => a.firstAuthorityOrder-b.firstAuthorityOrder);
  ranges.forEach((range,n) => requireContract(n === 0 || range.firstAuthorityOrder > ranges[n-1].lastAuthorityOrder,
    "History session intervals overlap"));
  requireContract(h.sessionsById[state.session.sessionId]?.lastAuthorityOrder === state.lastAppliedAuthorityOrder, "Current session/global watermark mismatch");
  const floor = h.commandFloor;
  closedRecord(floor, ["authorityOrder", "sessionId", "clientSequencesByPlayer"]);
  safeInteger(floor.authorityOrder, 0, state.lastAppliedAuthorityOrder);
  validateId("sessionId", floor.sessionId);
  validateWatermarks(floor.clientSequencesByPlayer);
  const session = h.sessionsById[floor.sessionId];
  requireContract(session && floor.authorityOrder >= session.firstAuthorityOrder-1 && floor.authorityOrder <= session.lastAuthorityOrder,
    "Command compaction floor/session mismatch");
  requireContract(Object.values(floor.clientSequencesByPlayer).reduce((a,b) => a+b,0) === floor.authorityOrder-session.firstAuthorityOrder+1,
    "Compacted client counts/order mismatch");
  for (const id of players) requireContract(floor.clientSequencesByPlayer[id] <= session.clientSequencesByPlayer[id], "Compacted client watermark exceeds session");
  const priorIds = state.multiplayer.priorSessions.map((prior) => prior.sessionId);
  requireContract(equal(Object.keys(h.sessionsById).filter((id) => id !== state.session.sessionId).sort(), priorIds.slice().sort()),
    "History/session boundary inventory mismatch");
  for (const prior of state.multiplayer.priorSessions) requireContract(h.sessionsById[prior.sessionId].lastAuthorityOrder === prior.lastAuthorityOrder,
    "History/session boundary order mismatch");
  const base = h.combatBaseline;
  closedRecord(base, ["eventSequence", "tick", "actorsById", "attackActionIdHighWatermark", "eventIdHighWatermark"]);
  safeInteger(base.eventSequence, 0, state.eventEmission.lastEventSequence);
  safeInteger(base.tick, 0, state.tick);
  for (const [field,kind] of [["attackActionIdHighWatermark","attackActionId"],["eventIdHighWatermark","eventId"]])
    if (base[field] !== null) validateId(kind, base[field]);
  requireContract(equal(Object.keys(base.actorsById).sort(), Object.values(state.space.entitiesById).filter((a) => a.kind === "actor").map((a) => a.entityId).sort()),
    "Combat anchor actor inventory mismatch");
  for (const [id, anchor] of Object.entries(base.actorsById)) {
    closedRecord(anchor, ["lastSourceSequence", "hp", "alive"]);
    safeInteger(anchor.lastSourceSequence, 0, state.space.entitiesById[id].nextAttackActionSequence-1);
    const hp = boundedCombatInteger(anchor.hp);
    requireContract(hp <= boundedCombatInteger(state.space.entitiesById[id].maxHp) && anchor.alive === (hp > 0) &&
      equal(anchor.hp, combatIntegerWire(hp)), "Invalid combat health anchor");
  }
}

export function validateRetainedCommands(state) {
  const h = state.history, floor = h.commandFloor;
  const records = Object.values(state.appliedCommandsById).sort((a,b) => a.authorityOrder-b.authorityOrder);
  requireContract(records.length <= RETAINED_COMMAND_CAPACITY, "Retained command capacity");
  const pinned = new Set([...primaryPinnedCommands(state), ...actionRecords(state).map((r) => JSON.parse(r.actionCanonical).causation?.commandId).filter(Boolean)]);
  const recent = records.filter((r) => r.authorityOrder > floor.authorityOrder);
  requireContract(recent.length <= COMMAND_RETRY_WINDOW && state.lastAppliedAuthorityOrder === floor.authorityOrder + recent.length,
    "Retained command suffix/cursor mismatch");
  const seenOrders = new Set(), seenSequences = new Set();
  const lastClientByOwner = {};
  for (const record of records) {
    const sid = JSON.parse(record.commandCanonical).sessionId;
    const session = h.sessionsById[sid];
    requireContract(session && record.authorityOrder >= session.firstAuthorityOrder && record.authorityOrder <= session.lastAuthorityOrder &&
      record.clientSequence <= session.clientSequencesByPlayer[record.playerId], "Retained command/session watermark mismatch");
    const key = sid + "/" + record.playerId + "/" + record.clientSequence;
    const owner = sid + "/" + record.playerId;
    requireContract(record.clientSequence > (lastClientByOwner[owner] ?? 0) &&
      record.clientSequence <= record.authorityOrder - session.firstAuthorityOrder + 1 &&
      session.clientSequencesByPlayer[record.playerId] - record.clientSequence <= session.lastAuthorityOrder - record.authorityOrder,
    "Retained client order cannot fit session interval");
    lastClientByOwner[owner] = record.clientSequence;
    requireContract(!seenOrders.has(record.authorityOrder) && !seenSequences.has(key), "Retained command order/sequence collision");
    seenOrders.add(record.authorityOrder); seenSequences.add(key);
    if (record.authorityOrder <= floor.authorityOrder) {
      requireContract(pinned.has(record.commandId), "Unreferenced expired command retained");
      if (sid === floor.sessionId) requireContract(record.clientSequence <= floor.clientSequencesByPlayer[record.playerId],
        "Pinned command exceeds compacted client watermark");
    }
  }
  let sid = floor.sessionId, cursors = copyWire(floor.clientSequencesByPlayer);
  recent.forEach((record,n) => {
    requireContract(record.authorityOrder === floor.authorityOrder+n+1, "Retained command suffix must be contiguous");
    const nextSession = JSON.parse(record.commandCanonical).sessionId;
    if (nextSession !== sid) { sid = nextSession; cursors = zeros(state); }
    requireContract(record.clientSequence === cursors[record.playerId]+1, "Retained client sequence gap");
    cursors[record.playerId] = record.clientSequence;
  });
  const current = sid === state.session.sessionId ? cursors : zeros(state);
  requireContract(equal(current, h.sessionsById[state.session.sessionId].clientSequencesByPlayer), "Current client watermark mismatch");
  const needed = new Set([state.session.sessionId, floor.sessionId, ...records.map((r) => JSON.parse(r.commandCanonical).sessionId)]);
  requireContract(Object.keys(h.sessionsById).every((id) => needed.has(id)), "Unreferenced old session retained");
}
