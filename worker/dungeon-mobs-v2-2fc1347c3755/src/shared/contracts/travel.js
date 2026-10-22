import { canonicalStringify, closedRecord, copyWire, requireContract, safeInteger } from "./wire.js";
import { validateId } from "./identities.js";
import { validateWorldState } from "./state.js";
import { compactSafeHistory, appliedClientSequence } from "./history.js";
import { samePlayerMembership } from "./multiplayer.js";
import { activeSpaceFixture, ACTIVE_SPACE_FIXTURES } from "../content/active_spaces.js";
import { collidesWithTiles } from "../rules/world_geometry.js";
export { activeSpaceFixture } from "../content/active_spaces.js";

import { oldwardSpace, discoverCrossing } from "./geography.js";
import { manifestForState, validateCampaignDiscoveryProgress } from "./overworld.js";
import { compileBoundOverworld } from "../content/overworld_fixture_catalog.js";
export function activeTravelSpace(state) {
  const manifest = manifestForState(state);
  if (manifest) return compileBoundOverworld(state);
  return state.campaign.geography ? oldwardSpace(state.space.spaceId) : activeSpaceFixture(state.space.spaceId);
}

const same = (a, b) => canonicalStringify(a) === canonicalStringify(b);
export function validateSafeFixture(state) {
  const fixture = activeTravelSpace(state);
  requireContract(state.history && state.space.encounterId === null && state.space.encounterAttemptId === null,
    "Travel unavailable during unresolved encounter");
  requireContract(same(state.space.collision, fixture.collision) && state.space.contentDefinitionId === fixture.contentDefinitionId,
    "Active fixture geometry mismatch");
  requireContract(same(Object.keys(state.space.entitiesById).sort(), Object.values(state.playersById).map((p) => p.entityId).sort()),
    "Safe fixture only supports party actors");
  return fixture;
}

// Validates the live safe phase against its durable starting point. Movement and
// command summaries can progress; health, combat, identity and RNG cannot change.
export function validateSafeProgress(before, source) {
  validateWorldState(source);
  validateSafeFixture(source);
  requireContract(before.space.encounterId === null && source.tick >= before.tick, "Invalid safe progress phase/tick");
  requireContract(samePlayerMembership(before.playersById, source.playersById), "Safe player membership changed");
  validateCampaignDiscoveryProgress(before, source);
  for (const key of ["session", "content", "activeSpaceRef", "rngStatesByName", "combat", "eventEmission"])
    requireContract(same(before[key], source[key]), `Safe progress changed ${key}`);
  requireContract(same(before.multiplayer.encounterParticipants, source.multiplayer.encounterParticipants), "Safe progress changed participants");
  requireContract(Boolean(before.primary)===Boolean(source.primary),"Safe primary extension changed");
  if(before.primary){const normalized=copyWire(source.primary);
    for(const id of Object.keys(normalized.actorsById))normalized.actorsById[id].facing=copyWire(before.primary.actorsById[id].facing);
    requireContract(same(normalized,before.primary),"Safe progress changed primary rules/history");}
  requireContract(source.lastAppliedAuthorityOrder >= before.lastAppliedAuthorityOrder, "Safe command order went backward");
  requireContract(source.history.commandFloor.authorityOrder >= before.history.commandFloor.authorityOrder, "Safe command floor went backward");
  for (const [sessionId, summary] of Object.entries(before.history.sessionsById)) {
    const retained = source.history.sessionsById[sessionId];
    if (retained) requireContract(sessionId === before.session.sessionId ? retained.firstAuthorityOrder === summary.firstAuthorityOrder :
      same(retained, summary), "Safe progress changed established session summary");
  }
  for (const key of ["combatBaseline", "sessionIdHighWatermark", "sessionGeneration"])
    requireContract(same(before.history[key], source.history[key]), "Safe progress changed history anchors");
  requireContract(same(Object.keys(before.space.entitiesById).sort(), Object.keys(source.space.entitiesById).sort()), "Safe actor inventory changed");
  for (const playerId of before.session.playerIds) requireContract(appliedClientSequence(source, playerId) >= appliedClientSequence(before, playerId),
    "Safe client sequence went backward");
  for (const [id, actor] of Object.entries(before.space.entitiesById)) {
    const normalized = copyWire(source.space.entitiesById[id]);
    for (const key of ["position", "movementIntent", "attackTimer", "movedLastTick"]) normalized[key] = copyWire(actor[key]);
    requireContract(same(normalized, actor), "Safe progress changed actor rules or health");
    const current = source.space.entitiesById[id];
    requireContract(!collidesWithTiles(source.space.collision, current.position.x, current.position.y, current.hullRadius), "Safe actor in blocked tile");
  }
  for (const receipt of Object.values(source.appliedCommandsById)) if (receipt.authorityOrder > before.lastAppliedAuthorityOrder)
    requireContract(["movement.setIntent", "space.travel"].includes(JSON.parse(receipt.commandCanonical).kind), "Non-movement safe command");
}

export function prepareTravelState(source, travel) {
  validateWorldState(source);
  closedRecord(travel, ["commandId", "destinationInstanceId"]);
  validateId("commandId", travel.commandId);
  validateId("spaceInstanceId", travel.destinationInstanceId);
  const fixture = validateSafeFixture(source);
  const receipt = source.appliedCommandsById[travel.commandId];
  requireContract(receipt?.authorityOrder === source.lastAppliedAuthorityOrder && receipt.tick === source.tick, "Travel needs latest applied intent at current tick");
  const command = JSON.parse(receipt.commandCanonical);
  requireContract(command.kind === "space.travel" && command.sessionId === source.session.sessionId &&
    command.spaceInstanceId === source.space.spaceInstanceId && command.spaceRevision === source.space.spaceRevision,
    "Stale travel request context");
  const player = source.playersById[command.playerId], actor = source.space.entitiesById[player.entityId];
  const exit = (fixture.exits ?? [fixture.exit]).find(e=>e.exitId === command.payload.exitId);
  requireContract(player.connectionStatus === "connected" && actor.alive && exit &&
    Math.hypot(actor.position.x-exit.x, actor.position.y-exit.y) <= exit.radius, "Exit unavailable or out of reach");
  requireContract(travel.destinationInstanceId > source.space.spaceInstanceId, "Travel must advance permanent instance identity fence");
  const regional = Boolean(source.campaign.geography);
  const destination = regional ? oldwardSpace(exit.destinationSpaceId) : ACTIVE_SPACE_FIXTURES[exit.destinationIndex];
  const arrival = regional ? destination.exits.find(e=>e.exitId===exit.reciprocalExitId) : null;
  if (regional) requireContract(arrival?.destinationSpaceId === fixture.spaceId && arrival.reciprocalExitId === exit.exitId,
    "Destination reciprocal socket mismatch");
  const next = compactSafeHistory(source);
  next.activeSpaceRef = { spaceId: destination.spaceId, spaceInstanceId: travel.destinationInstanceId,
    spaceRevision: safeInteger(source.space.spaceRevision + 1) };
  Object.assign(next.space, next.activeSpaceRef, { contentDefinitionId: destination.contentDefinitionId, collision: copyWire(destination.collision) });
  next.multiplayer.encounterParticipants = null;
  for (const [index, playerId] of next.session.playerIds.entries()) {
    const moved = next.space.entitiesById[next.playersById[playerId].entityId];
    moved.position = regional ? copyWire(arrival.partyPositions[index]) : { x: destination.anchor.x, y: destination.anchor.y + index * 24 };
    requireContract(!collidesWithTiles(destination.collision, moved.position.x, moved.position.y, moved.hullRadius), "Destination anchor blocked");
    moved.movementIntent = { x: 0, y: 0 };
    moved.movedLastTick = false;
  }
  if (regional) next.campaign.geography = discoverCrossing(source.campaign.geography, destination.spaceId, exit.roadSegmentId);
  validateWorldState(next);
  return next;
}
