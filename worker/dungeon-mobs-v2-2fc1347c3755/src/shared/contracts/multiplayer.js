import { canonicalStringify, closedRecord, copyWire, requireContract, safeInteger, validateWire } from "./wire.js";
import { validateId } from "./identities.js";
import { addHistorySession, RETAINED_COMMAND_CAPACITY } from "./history.js";

export const MULTIPLAYER_CONTRACT_VERSION = 1;

export function eligibleEncounterParticipants(state) {
  const characterIds = Object.values(state.playersById).filter((player) => player.connectionStatus === "connected" &&
    state.space?.entitiesById[player.entityId]?.alive).map((player) => player.characterId).sort();
  requireContract(characterIds.length > 0 && new Set(characterIds).size === characterIds.length,
    "Encounter needs unique eligible connected participants");
  return { encounterId: state.space.encounterId, encounterAttemptId: state.space.encounterAttemptId,
    characterIds, participantCount: characterIds.length, profile: "world1c-fixed" };
}

export function validateMultiplayerState(value, world) {
  validateWire(value);
  closedRecord(value, ["contractVersion", "priorSessions", "encounterParticipants"]);
  requireContract(value.contractVersion === MULTIPLAYER_CONTRACT_VERSION, "Unsupported multiplayer contract version");
  requireContract(world.session && Array.isArray(value.priorSessions) && value.priorSessions.length <= (world.history ? RETAINED_COMMAND_CAPACITY + 1 : 16),
    "Invalid authority session history");
  const ids = new Set([world.session.sessionId]);
  let lastOrder = 0;
  for (const prior of value.priorSessions) {
    closedRecord(prior, ["sessionId", "lastAuthorityOrder"]);
    validateId("sessionId", prior.sessionId);
    requireContract(!ids.has(prior.sessionId), "Authority session identity reused");
    ids.add(prior.sessionId);
    safeInteger(prior.lastAuthorityOrder, lastOrder, world.lastAppliedAuthorityOrder);
    lastOrder = prior.lastAuthorityOrder;
  }
  const roster = value.encounterParticipants;
  if (roster !== null) {
    closedRecord(roster, ["encounterId", "encounterAttemptId", "characterIds", "participantCount", "profile"]);
    validateId("encounterId", roster.encounterId);
    validateId("encounterAttemptId", roster.encounterAttemptId);
    requireContract(Array.isArray(roster.characterIds) && roster.characterIds.length > 0 && roster.characterIds.length <= 4,
      "Participant roster size");
    roster.characterIds.forEach((id, index) => {
      validateId("characterId", id);
      requireContract(Object.hasOwn(world.campaign.charactersById, id) && (index === 0 || roster.characterIds[index - 1] < id),
        "Participants must be sorted unique durable characters");
    });
    requireContract(roster.participantCount === roster.characterIds.length && roster.profile === "world1c-fixed",
      "Participant count/profile mismatch");
  }
  if (world.space?.encounterId !== null && world.space?.encounterId !== undefined) {
    requireContract(roster?.encounterId === world.space.encounterId && roster?.encounterAttemptId === world.space.encounterAttemptId,
      "Active encounter participant linkage mismatch");
  }
  return value;
}

export function sessionForAuthorityOrder(world, order) {
  if (world.history) return Object.keys(world.history.sessionsById).find((sid) => {
    const range = world.history.sessionsById[sid];
    return order >= range.firstAuthorityOrder && order <= range.lastAuthorityOrder;
  });
  for (const prior of world.multiplayer?.priorSessions ?? []) {
    if (order <= prior.lastAuthorityOrder) return prior.sessionId;
  }
  return world.session?.sessionId;
}

export function currentSessionAppliedReceipts(world, playerId) {
  return Object.values(world.appliedCommandsById).filter((receipt) => receipt.playerId === playerId &&
    JSON.parse(receipt.commandCanonical).sessionId === world.session.sessionId);
}

// Explicit authority-incarnation transition. The caller must validate and commit
// the resulting whole checkpoint before exposing new-session gameplay ports.
import {lowerShield} from './shield_guard.js';
import { clearPrimaryInput } from "./primary.js";

export function withFreshAuthoritySession(state, newSessionId) {
  validateId("sessionId", newSessionId);
  requireContract(state.session && newSessionId !== state.session.sessionId, "Fresh session identity required");
  const next = copyWire(state);
  if (!next.multiplayer) next.multiplayer = { contractVersion: MULTIPLAYER_CONTRACT_VERSION,
    priorSessions: [], encounterParticipants: next.space?.encounterId ? eligibleEncounterParticipants(next) : null };
  requireContract(!next.multiplayer.priorSessions.some((prior) => prior.sessionId === newSessionId), "Session identity already fenced");
  requireContract(next.history || next.multiplayer.priorSessions.length < 16, "Authority session fixture history limit");
  const oldSessionId = next.session.sessionId;
  next.multiplayer.priorSessions.push({ sessionId: next.session.sessionId, lastAuthorityOrder: next.lastAppliedAuthorityOrder });
  next.session.sessionId = newSessionId;
  if (next.history) addHistorySession(next, oldSessionId);
  for (const player of Object.values(next.playersById)) {
    player.connectionStatus = "disconnected";
    clearPrimaryInput(next,player.entityId);lowerShield(next.subweaponCombat?.actors[player.entityId]?.guard,true);
    const actor = next.space?.entitiesById[player.entityId];
    if (actor?.kind === "actor") actor.movementIntent = { x: 0, y: 0 };
  }
  return next;
}

export function samePlayerMembership(before, after) {
  const membership = (players) => Object.fromEntries(Object.entries(players).map(([id, player]) =>
    [id, { playerId: player.playerId, characterId: player.characterId, entityId: player.entityId }]));
  return canonicalStringify(membership(before)) === canonicalStringify(membership(after));
}
