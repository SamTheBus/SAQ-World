import { requireContract } from "./wire.js";

// Extracted X-A1 canonical actor/context projections; no proof orchestration.
export function actorRules(actor) {
  const { residency, ...rules } = actor;
  return rules; // Temporary pure-rule argument, never a second authoritative actor.
}
export function actorContext(state, entityId) {
  const actor = state.entitiesById[entityId];
  requireContract(actor, "Unknown canonical actor");
  const space = state.spacesByInstanceId[actor.residency.spaceInstanceId];
  return { spaceInstanceId: space.spaceInstanceId, spaceRevision: space.spaceRevision,
    residencyRevision: actor.residency.residencyRevision };
}
