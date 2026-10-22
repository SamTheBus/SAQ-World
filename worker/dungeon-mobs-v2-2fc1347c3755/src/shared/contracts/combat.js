import { closedRecord, canonicalStringify, freezeWire, requireContract, safeInteger, validateWire } from "./wire.js";
import { validateId, validateRevision } from "./identities.js";

import { validatePrimaryAim } from "./primary.js";

export function validateAttackAction(action) {
  validateWire(action);
  closedRecord(action, ["attackActionId", "sourceEntityId", "targetEntityId", "sourceSequence",
    "spaceInstanceId", "spaceRevision", "eventIds"], ["causation", "primary"]);
  if (action.primary) {
    closedRecord(action.primary, ["primaryActionId", "sourceSequence", "comboStep", "startedTick", "aim"]);
    validateId("primaryActionId", action.primary.primaryActionId);safeInteger(action.primary.sourceSequence,1);
    safeInteger(action.primary.comboStep,1,3);safeInteger(action.primary.startedTick);validatePrimaryAim(action.primary.aim);
    requireContract(action.causation, "Primary hit requires explicit input causation");
  }
  if (Object.hasOwn(action, "causation")) {
    closedRecord(action.causation, ["commandId", "playerId", "characterId", "sessionId"]);
    for (const kind of ["commandId", "playerId", "characterId", "sessionId"]) validateId(kind, action.causation[kind]);
  }
  validateId("attackActionId", action.attackActionId);
  validateId("entityId", action.sourceEntityId);
  validateId("entityId", action.targetEntityId);
  validateId("spaceInstanceId", action.spaceInstanceId);
  safeInteger(action.sourceSequence, 1);
  validateRevision("spaceRevision", action.spaceRevision);
  closedRecord(action.eventIds, ["attackStartedEventId", "damageAppliedEventId", "actorDefeatedEventId"]);
  validateId("eventId", action.eventIds.attackStartedEventId);
  validateId("eventId", action.eventIds.damageAppliedEventId);
  validateId("eventId", action.eventIds.actorDefeatedEventId);
  const ids = Object.values(action.eventIds);
  requireContract(new Set(ids).size === ids.length, "Attack event ID collision");
  return action;
}

export function createAttackAction(record) {
  validateAttackAction(record);
  return freezeWire(record);
}

export function canonicalAttackAction(record) {
  validateAttackAction(record);
  return canonicalStringify(record);
}
