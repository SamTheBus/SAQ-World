import {validateDamageSourceItem} from './combat_attribution.js';
import {validateInteger} from './integer_domain.js';
import {validateCombatAmount,compareCombat} from './combat_amount.js';
import { PROTOCOL_VERSION } from "./versions.js";
import { closedRecord, exactVersion, freezeWire, requireContract, safeInteger, validateWire, canonicalStringify } from "./wire.js";
import { boundedCombatInteger, validateBoundedCombatIntegerWire } from "./combat_integer.js";
import { validateId } from "./identities.js";
import { validateWorldState } from "./state.js";
import { validateDiagnosticPayload, validateSpaceStamp } from "./commands.js";

export function validateEvent(event) {
  validateWire(event);
  closedRecord(event, ["protocolVersion", "campaignId", "sessionId", "eventId", "eventSequence", "tick", "kind", "causation", "source", "subject", "spaceInstanceId", "spaceRevision", "payload"]);
  exactVersion(event.protocolVersion, PROTOCOL_VERSION);
  for (const kind of ["campaignId", "sessionId", "eventId"]) validateId(kind, event[kind]);
  safeInteger(event.eventSequence, 1);
  safeInteger(event.tick);
  requireContract(["diagnostic.commandApplied", "combat.attackStarted", "combat.damageApplied", "combat.defenseResolved", "combat.actorDefeated", "combat.primaryStarted", "combat.primaryFinished"].includes(event.kind), "Unsupported event kind");
  closedRecord(event.causation, ["commandId", "playerId"]);
  if (event.causation.commandId !== null) validateId("commandId", event.causation.commandId);
  if (event.causation.playerId !== null) validateId("playerId", event.causation.playerId);
  closedRecord(event.source, ["playerId", "characterId", "entityId"]);
  if (event.source.playerId !== null) validateId("playerId", event.source.playerId);
  if (event.source.characterId !== null) validateId("characterId", event.source.characterId);
  if (event.source.entityId !== null) validateId("entityId", event.source.entityId);
  closedRecord(event.subject, ["entityId"]);
  if (event.subject.entityId !== null) validateId("entityId", event.subject.entityId);
  validateSpaceStamp(event);
  if (event.kind === "diagnostic.commandApplied") validateDiagnosticPayload(event.payload);
  else if (["combat.primaryStarted", "combat.primaryFinished"].includes(event.kind)) {
    closedRecord(event.payload,["primaryActionId","sourceEntityId","sourceSequence","comboStep"]);
    validateId("primaryActionId",event.payload.primaryActionId);validateId("entityId",event.payload.sourceEntityId);
    safeInteger(event.payload.sourceSequence,1);safeInteger(event.payload.comboStep,1,3);
  } else if (event.kind === "combat.attackStarted") {
    closedRecord(event.payload, ["attackActionId", "sourceEntityId", "targetEntityId"]);
    validateId("attackActionId", event.payload.attackActionId);
    validateId("entityId", event.payload.sourceEntityId);
    validateId("entityId", event.payload.targetEntityId);
  } else {
    closedRecord(event.payload, ["attackActionId", "sourceEntityId", "sourceCharacterId", "targetEntityId", "damage", "resultingHp", "targetAlive"], ["combatVersion","critical","mechanic","defenseKind","sourceItem","trigger","barrierAbsorption","chainFrom","meleeContact"]);
    validateId("attackActionId", event.payload.attackActionId);
    validateId("entityId", event.payload.sourceEntityId);
    if (event.payload.sourceCharacterId !== null) validateId("characterId", event.payload.sourceCharacterId);
    validateId("entityId", event.payload.targetEntityId);
    if(event.payload.meleeContact!==undefined){
      const c=event.payload.meleeContact;
      closedRecord(c,['sourcePosition','targetPosition','reach','mode','sourceRadius','targetRadius']);
      for(const p of [c.sourcePosition,c.targetPosition]){closedRecord(p,['x','y']);requireContract(Number.isFinite(p.x)&&Number.isFinite(p.y),'Invalid melee contact position');}
      for(const n of [c.reach,c.sourceRadius,c.targetRadius])requireContract(Number.isFinite(n)&&n>=0&&n<=256,'Invalid melee contact geometry');
      requireContract(['center','clearHullGap'].includes(c.mode)&&event.payload.combatVersion==='combat-integer-v2'&&event.payload.trigger!=='periodic'&&['hostile','barrier','block','parry'].includes(event.payload.mechanic),'Invalid melee contact attribution');
      const centerReach=c.reach+(c.mode==='clearHullGap'?c.sourceRadius+c.targetRadius:0);
      requireContract(Math.hypot(c.targetPosition.x-c.sourcePosition.x,c.targetPosition.y-c.sourcePosition.y)<=centerReach+1e-7,'Melee contact exceeds authoritative reach');
    }
    if(['fractional-d6-v1','combat-integer-v2'].includes(event.payload.combatVersion)){const validateAmount=event.payload.combatVersion==='combat-integer-v2'?validateInteger:validateCombatAmount;const chain=event.payload.chainFrom;if(chain){closedRecord(chain,['entityId','position']);validateId('entityId',chain.entityId);closedRecord(chain.position,['x','y']);requireContract(event.payload.mechanic==='lightning'&&Number.isFinite(chain.position.x)&&Number.isFinite(chain.position.y),'Invalid Lightning chain');}const b=event.payload.barrierAbsorption;if(b!=null){closedRecord(b,['absorbed','remaining','capacity']);for(const v of Object.values(b))validateAmount(v);requireContract(compareCombat(b.absorbed,0)>0&&compareCombat(b.remaining,0)>=0&&compareCombat(b.capacity,0)>0&&compareCombat(b.remaining,b.capacity)<=0,'Invalid Barrier absorption feedback');}if(event.payload.sourceItem!==undefined)validateDamageSourceItem(event.payload.sourceItem);requireContract(event.payload.trigger===undefined||event.payload.trigger===null||['pressure','reactive','proc','periodic','mastery'].includes(event.payload.trigger),'Invalid damage trigger');
      validateAmount(event.payload.damage);validateAmount(event.payload.resultingHp);requireContract(event.payload.defenseKind==null||['barrier','block','parry'].includes(event.payload.defenseKind),'Invalid defense feedback');
      requireContract(typeof event.payload.critical==='boolean'&&['main','bash','riposte','offhand','fire','lightning','frost','bleed','burn','poison','slag','bloom','rupture','shadowflurry','windrazor','assassin','aegis','shatter','hostile','barrier','block','parry'].includes(event.payload.mechanic),'Invalid fractional packet attribution');
      requireContract(event.payload.targetAlive===(compareCombat(event.payload.resultingHp,0)>0),'Fractional event liveness');
      requireContract(event.kind==='combat.defenseResolved'?compareCombat(event.payload.damage,0)===0:compareCombat(event.payload.damage,0)>0,'Fractional outcome kind');
      requireContract(event.kind!=='combat.actorDefeated'||!event.payload.targetAlive,'Defeat liveness');return event;
    }
    requireContract(event.payload.combatVersion===undefined&&event.payload.critical===undefined&&event.payload.mechanic===undefined&&event.payload.defenseKind===undefined&&event.payload.sourceItem===undefined&&event.payload.trigger===undefined&&event.payload.barrierAbsorption===undefined&&event.kind!=='combat.defenseResolved','Unsupported damage version');
    validateBoundedCombatIntegerWire(event.payload.damage, 1);
    validateBoundedCombatIntegerWire(event.payload.resultingHp);
    requireContract(typeof event.payload.targetAlive === "boolean" &&
      event.payload.targetAlive === (boundedCombatInteger(event.payload.resultingHp) > 0),
      "Invalid combat outcome payload");
    requireContract(event.kind !== "combat.actorDefeated" || !event.payload.targetAlive, "Defeat event target must be dead");
  }
  return event;
}

export function validateEventForState(event, state) {
  validateEvent(event);
  validateWorldState(state);
  requireContract(event.campaignId === state.campaign?.campaignId && event.sessionId === state.session?.sessionId, "Stale event identity");
  requireContract(event.spaceInstanceId === (state.activeSpaceRef?.spaceInstanceId ?? null) &&
    event.spaceRevision === (state.activeSpaceRef?.spaceRevision ?? null), "Stale event space");
  requireContract(event.subject.entityId === null || (state.space && Object.hasOwn(state.space.entitiesById, event.subject.entityId)), "Unknown event subject");
  if (event.kind === "diagnostic.commandApplied") {
    const player = state.playersById[event.source.playerId];
    requireContract(player && player.characterId === event.source.characterId && player.entityId === event.source.entityId, "Invalid event source");
    requireContract(event.causation.commandId !== null && event.causation.playerId === event.source.playerId, "Event causation owner mismatch");
    const applied = state.appliedCommandsById[event.causation.commandId];
    requireContract(applied && applied.playerId === event.source.playerId && applied.tick === event.tick, "Event is not backed by an applied command");
    const command = JSON.parse(applied.commandCanonical);
    requireContract(command.payload.tag === event.payload.tag, "Event payload/command mismatch");
    requireContract(event.spaceInstanceId === command.spaceInstanceId && event.spaceRevision === command.spaceRevision,
      "Event stamp/causation command mismatch");
    return event;
  }

  if (["combat.primaryStarted", "combat.primaryFinished"].includes(event.kind)) {
    const records=[...Object.values(state.primary?.completedById??{}),...Object.values(state.primary?.actorsById??{}).map(a=>a.current).filter(Boolean)];
    const action=records.find(a=>a.primaryActionId===event.payload.primaryActionId),finished=event.kind==="combat.primaryFinished";
    const player=state.playersById[event.source.playerId];
    requireContract(action && action.sourceEntityId===event.source.entityId && player?.entityId===action.sourceEntityId &&
      player.characterId===event.source.characterId && event.causation.commandId===action.commandId && event.causation.playerId===player.playerId &&
      event.payload.comboStep===action.comboStep && event.payload.sourceSequence===action.sourceSequence &&
      event.eventId===(finished?action.finishEventId:action.startEventId) && event.eventSequence===(finished?action.finishEventSequence:action.startEventSequence) &&
      event.tick===(finished?action.completedTick:action.startedTick) && event.subject.entityId===null,"Primary event attribution mismatch");
    return event;
  }
  requireContract(event.source.entityId !== null, "Combat event must have explicit actor source");
  const source = state.space?.entitiesById[event.source.entityId];
  const target = state.space?.entitiesById[event.subject.entityId];
  requireContract(source?.kind === "actor" && target?.kind === "actor", "Combat event actor reference mismatch");
  const sourcePlayer = Object.values(state.playersById).find((player) => player.entityId === source.entityId) ?? null;
  requireContract(event.source.playerId === (sourcePlayer?.playerId ?? null) && event.causation.playerId === (sourcePlayer?.playerId ?? null) &&
    event.source.characterId === source.ownerCharacterId, "Combat event source attribution mismatch");
  const receipt = state.combat?.appliedActionsById[event.payload.attackActionId];
  requireContract(receipt && receipt.sourceEntityId === source.entityId && receipt.targetEntityId === target.entityId && receipt.tick === event.tick,
    "Combat event has no matching action receipt");
  const action = JSON.parse(receipt.actionCanonical);
  requireContract(event.causation.commandId === (action.causation?.commandId ?? null), "Combat event command causation mismatch");
  if (action.causation) requireContract(event.sessionId === action.causation.sessionId &&
    event.source.playerId === action.causation.playerId && event.source.characterId === action.causation.characterId,
  "Combat event causal session/source mismatch");
  requireContract(canonicalStringify(action) === receipt.actionCanonical && event.spaceInstanceId === action.spaceInstanceId &&
    event.spaceRevision === action.spaceRevision, "Combat event stamp/causation action mismatch");
  requireContract(event.payload.sourceEntityId === source.entityId && event.payload.targetEntityId === target.entityId, "Combat event payload actor mismatch");
  const eventOffset = event.kind === "combat.attackStarted" ? 0 : event.kind === "combat.damageApplied" ? 1 : 2;
  const eventIdKey = event.kind === "combat.attackStarted" ? "attackStartedEventId" :
    event.kind === "combat.damageApplied" ? "damageAppliedEventId" : "actorDefeatedEventId";
  requireContract(event.eventId === action.eventIds[eventIdKey], "Combat event identity/action mismatch");
  requireContract(event.eventSequence === receipt.eventSequenceStart + eventOffset && event.eventSequence <= receipt.eventSequenceEnd,
    "Combat event sequence/action mismatch");
  if (event.kind !== "combat.attackStarted") {
    requireContract(event.payload.sourceCharacterId === source.ownerCharacterId &&
      canonicalStringify(event.payload.damage) === canonicalStringify(receipt.outcome.damage) &&
      canonicalStringify(event.payload.resultingHp) === canonicalStringify(receipt.outcome.resultingHp) &&
      event.payload.targetAlive === receipt.outcome.targetAlive, "Combat event outcome/receipt mismatch");
    requireContract(event.kind !== "combat.actorDefeated" || !receipt.outcome.targetAlive, "Unexpected combat defeat event");
  }
  return event;
}

export function createEvent(record) {
  validateEvent(record);
  return freezeWire(record);
}
